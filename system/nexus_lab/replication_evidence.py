"""R017 replica-independent history attestations and fork evidence.

A history identifier commits only ledger-history facts. A checkpoint identifier
commits the replica identity plus that history statement. Multiple replicas may
therefore attest one history without being misclassified as a fork.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any, Callable, Mapping

CHECKPOINT_SCHEMA = "nexus.r017.replica-checkpoint/v1"
FORK_PROOF_SCHEMA = "nexus.r017.fork-proof/v1"
OBSERVATION_SCHEMA = "nexus.r017.observation/v1"
STATUS_AUTHORITY = "NONE"
MAX_WIRE_BYTES = 32 * 1024
MAX_HEIGHT = (1 << 64) - 1
MAX_REPLICAS = 64
MAX_OBSERVATIONS = 4096

_HASH = re.compile(r"^[0-9a-f]{64}$")
_REPLICA = re.compile(r"^[a-z0-9][a-z0-9._-]{0,62}$")
_UINT = re.compile(r"^(0|[1-9][0-9]*)$")


class ReplicationEvidenceError(Exception):
    code = "REPLICATION_EVIDENCE_ERROR"


class EncodingError(ReplicationEvidenceError):
    code = "ENCODING_INVALID"


class SchemaError(ReplicationEvidenceError):
    code = "SCHEMA_INVALID"


class AuthenticationError(ReplicationEvidenceError):
    code = "AUTHENTICATION_FAILED"


class EquivocationError(ReplicationEvidenceError):
    code = "REPLICA_EQUIVOCATION"


class CapacityError(ReplicationEvidenceError):
    code = "CAPACITY_EXCEEDED"


def canonical_json(value: Any) -> bytes:
    try:
        return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("ascii")
    except (TypeError, ValueError, UnicodeError) as exc:
        raise EncodingError("value is not canonical ASCII JSON") from exc


def _decode(raw: bytes) -> dict[str, Any]:
    if type(raw) is not bytes or not 1 <= len(raw) <= MAX_WIRE_BYTES:
        raise EncodingError("checkpoint must be bounded exact bytes")
    try:
        value = json.loads(raw.decode("ascii"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise EncodingError("checkpoint is not valid ASCII JSON") from exc
    if type(value) is not dict or canonical_json(value) != raw:
        raise EncodingError("checkpoint is not exact canonical JSON")
    return value


def _hash(domain: str, value: Mapping[str, Any]) -> str:
    domain_raw = domain.encode("ascii")
    payload = canonical_json(value)
    frame = len(domain_raw).to_bytes(2, "big") + domain_raw + len(payload).to_bytes(8, "big") + payload
    return hashlib.sha256(frame).hexdigest()


def _require_hash(value: Any, label: str, *, allow_empty: bool = False) -> str:
    if allow_empty and value == "":
        return ""
    if type(value) is not str or _HASH.fullmatch(value) is None:
        raise SchemaError(f"{label} must be a lowercase SHA-256 digest")
    return value


def _height(value: Any) -> int:
    if type(value) is not str or _UINT.fullmatch(value) is None:
        raise SchemaError("height must be a canonical decimal string")
    result = int(value)
    if result > MAX_HEIGHT:
        raise SchemaError("height exceeds protocol bound")
    return result


def history_subject(payload: Mapping[str, Any]) -> dict[str, str]:
    height = _height(payload.get("height"))
    subject = {
        "genesis_sha256": _require_hash(payload.get("genesis_sha256"), "genesis_sha256"),
        "height": str(height),
        "parent_history": _require_hash(payload.get("parent_history"), "parent_history", allow_empty=height == 0),
        "receipt_head": _require_hash(payload.get("receipt_head"), "receipt_head", allow_empty=height == 0),
        "record_hash": _require_hash(payload.get("record_hash"), "record_hash", allow_empty=height == 0),
        "schema": "nexus.r017.history/v1",
        "state_root": _require_hash(payload.get("state_root"), "state_root"),
        "status_authority": STATUS_AUTHORITY,
    }
    if height == 0 and any(subject[k] for k in ("parent_history", "receipt_head", "record_hash")):
        raise SchemaError("height-zero history must use empty predecessor heads")
    if height > 0 and not all(subject[k] for k in ("parent_history", "receipt_head", "record_hash")):
        raise SchemaError("nonzero history requires all predecessor heads")
    return subject


@dataclass(frozen=True)
class Checkpoint:
    replica_id: str
    height: int
    state_root: str
    record_hash: str
    receipt_head: str
    parent_history: str
    genesis_sha256: str
    history_id: str
    checkpoint_id: str
    signature: str
    raw: bytes

    @property
    def unsigned(self) -> dict[str, str]:
        return {
            "checkpoint_id": self.checkpoint_id,
            "genesis_sha256": self.genesis_sha256,
            "height": str(self.height),
            "history_id": self.history_id,
            "parent_history": self.parent_history,
            "receipt_head": self.receipt_head,
            "record_hash": self.record_hash,
            "replica_id": self.replica_id,
            "schema": CHECKPOINT_SCHEMA,
            "state_root": self.state_root,
            "status_authority": STATUS_AUTHORITY,
        }


def checkpoint_payload(*, replica_id: str, height: int, state_root: str, record_hash: str, receipt_head: str, parent_checkpoint: str | None = None, parent_history: str | None = None, genesis_sha256: str) -> dict[str, str]:
    if type(replica_id) is not str or _REPLICA.fullmatch(replica_id) is None:
        raise SchemaError("replica_id has invalid syntax")
    if type(height) is not int or not 0 <= height <= MAX_HEIGHT:
        raise SchemaError("height is outside the protocol bound")
    parent = parent_history if parent_history is not None else parent_checkpoint
    if parent is None:
        raise SchemaError("parent_history is required")
    history = history_subject({
        "genesis_sha256": genesis_sha256,
        "height": str(height),
        "parent_history": parent,
        "receipt_head": receipt_head,
        "record_hash": record_hash,
        "state_root": state_root,
    })
    history_id = _hash("NEXUS/R017/HISTORY/v1", history)
    return {
        "genesis_sha256": history["genesis_sha256"],
        "height": history["height"],
        "history_id": history_id,
        "parent_history": history["parent_history"],
        "receipt_head": history["receipt_head"],
        "record_hash": history["record_hash"],
        "replica_id": replica_id,
        "schema": CHECKPOINT_SCHEMA,
        "state_root": history["state_root"],
        "status_authority": STATUS_AUTHORITY,
    }


def _checkpoint_id(unsigned_without_id: Mapping[str, Any]) -> str:
    return _hash("NEXUS/R017/CHECKPOINT/v1", unsigned_without_id)


def encode_checkpoint(payload: Mapping[str, Any], signature: str) -> bytes:
    if type(signature) is not str or not signature:
        raise SchemaError("signature must be nonempty")
    expected = {"genesis_sha256", "height", "history_id", "parent_history", "receipt_head", "record_hash", "replica_id", "schema", "state_root", "status_authority"}
    if set(payload) != expected:
        raise SchemaError("checkpoint payload fields are not exact")
    rebuilt = checkpoint_payload(
        replica_id=payload["replica_id"], height=_height(payload["height"]),
        state_root=payload["state_root"], record_hash=payload["record_hash"],
        receipt_head=payload["receipt_head"], parent_history=payload["parent_history"],
        genesis_sha256=payload["genesis_sha256"],
    )
    if dict(payload) != rebuilt:
        raise EncodingError("history_id does not bind the exact history")
    checkpoint_id = _checkpoint_id(rebuilt)
    return canonical_json({**rebuilt, "checkpoint_id": checkpoint_id, "signature": signature})


def decode_checkpoint(raw: bytes, verify: Callable[[str, bytes, str], bool]) -> Checkpoint:
    obj = _decode(raw)
    expected = {"checkpoint_id", "genesis_sha256", "height", "history_id", "parent_history", "receipt_head", "record_hash", "replica_id", "schema", "signature", "state_root", "status_authority"}
    if set(obj) != expected or obj["schema"] != CHECKPOINT_SCHEMA or obj["status_authority"] != STATUS_AUTHORITY:
        raise SchemaError("checkpoint shape, schema, or authority is invalid")
    unsigned = {key: obj[key] for key in expected - {"signature", "checkpoint_id"}}
    rebuilt = checkpoint_payload(
        replica_id=obj["replica_id"], height=_height(obj["height"]), state_root=obj["state_root"],
        record_hash=obj["record_hash"], receipt_head=obj["receipt_head"], parent_history=obj["parent_history"],
        genesis_sha256=obj["genesis_sha256"],
    )
    if unsigned != rebuilt:
        raise EncodingError("history_id does not bind the exact history")
    checkpoint_id = _checkpoint_id(rebuilt)
    if obj["checkpoint_id"] != checkpoint_id:
        raise EncodingError("checkpoint_id does not bind the exact attestation")
    message = canonical_json({**rebuilt, "checkpoint_id": checkpoint_id})
    if not verify(obj["replica_id"], message, obj["signature"]):
        raise AuthenticationError("checkpoint signature was not accepted")
    return Checkpoint(
        replica_id=obj["replica_id"], height=int(obj["height"]), state_root=obj["state_root"],
        record_hash=obj["record_hash"], receipt_head=obj["receipt_head"], parent_history=obj["parent_history"],
        genesis_sha256=obj["genesis_sha256"], history_id=obj["history_id"], checkpoint_id=checkpoint_id,
        signature=obj["signature"], raw=raw,
    )


def fork_proof(left: Checkpoint, right: Checkpoint, reason: str) -> dict[str, Any]:
    ordered = sorted((left, right), key=lambda item: item.history_id)
    body = {
        "genesis_sha256": left.genesis_sha256,
        "left_checkpoint": ordered[0].checkpoint_id,
        "left_history": ordered[0].history_id,
        "left_raw_sha256": hashlib.sha256(ordered[0].raw).hexdigest(),
        "reason": reason,
        "right_checkpoint": ordered[1].checkpoint_id,
        "right_history": ordered[1].history_id,
        "right_raw_sha256": hashlib.sha256(ordered[1].raw).hexdigest(),
        "schema": FORK_PROOF_SCHEMA,
        "status_authority": STATUS_AUTHORITY,
    }
    return {**body, "proof_id": _hash("NEXUS/R017/FORK-PROOF/v1", body)}


class ReplicaEvidenceLog:
    """Bounded observation index; preserves evidence and never chooses a branch."""

    def __init__(self, genesis_sha256: str) -> None:
        self.genesis_sha256 = _require_hash(genesis_sha256, "genesis_sha256")
        self._by_checkpoint: dict[str, Checkpoint] = {}
        self._by_history: dict[str, list[Checkpoint]] = {}
        self._by_replica_height: dict[tuple[str, int], Checkpoint] = {}
        self._children: dict[str, set[str]] = {}
        self._observations: list[dict[str, Any]] = []

    @property
    def observations(self) -> tuple[dict[str, Any], ...]:
        return tuple(self._observations)

    def observe(self, checkpoint: Checkpoint) -> dict[str, Any]:
        if checkpoint.genesis_sha256 != self.genesis_sha256:
            raise SchemaError("checkpoint belongs to a different genesis")
        if len(self._observations) >= MAX_OBSERVATIONS:
            raise CapacityError("observation bound reached")
        if checkpoint.checkpoint_id in self._by_checkpoint:
            return self._record("DUPLICATE_ATTESTATION", checkpoint, None)
        prior_slot = self._by_replica_height.get((checkpoint.replica_id, checkpoint.height))
        if prior_slot is not None and prior_slot.history_id != checkpoint.history_id:
            proof = fork_proof(prior_slot, checkpoint, "SAME_REPLICA_SAME_HEIGHT_EQUIVOCATION")
            self._record("EQUIVOCATION", checkpoint, proof)
            raise EquivocationError(proof["proof_id"])
        if checkpoint.history_id in self._by_history:
            relation, proof = "AGREEMENT_ATTESTATION", None
        else:
            relation, proof = ("GENESIS_HISTORY", None) if checkpoint.height == 0 else ("GAP", None)
            if checkpoint.height > 0 and checkpoint.parent_history in self._by_history:
                parent = self._by_history[checkpoint.parent_history][0]
                relation = "EXTENDS_KNOWN_HISTORY" if parent.height + 1 == checkpoint.height else "INVALID_PARENT_HEIGHT"
                if relation == "INVALID_PARENT_HEIGHT":
                    proof = fork_proof(parent, checkpoint, relation)
            siblings = self._children.setdefault(checkpoint.parent_history, set())
            if siblings and checkpoint.history_id not in siblings:
                sibling = self._by_history[sorted(siblings)[0]][0]
                relation = "FORK_OBSERVED"
                proof = fork_proof(sibling, checkpoint, "CONFLICTING_SIBLING_HISTORIES")
            siblings.add(checkpoint.history_id)
        self._by_checkpoint[checkpoint.checkpoint_id] = checkpoint
        self._by_history.setdefault(checkpoint.history_id, []).append(checkpoint)
        self._by_replica_height[(checkpoint.replica_id, checkpoint.height)] = checkpoint
        return self._record(relation, checkpoint, proof)

    def _record(self, relation: str, checkpoint: Checkpoint, proof: dict[str, Any] | None) -> dict[str, Any]:
        body = {
            "checkpoint_id": checkpoint.checkpoint_id,
            "history_id": checkpoint.history_id,
            "observation_index": str(len(self._observations)),
            "proof_id": "" if proof is None else proof["proof_id"],
            "relation": relation,
            "schema": OBSERVATION_SCHEMA,
            "status_authority": STATUS_AUTHORITY,
        }
        observation = {**body, "observation_id": _hash("NEXUS/R017/OBSERVATION/v1", body)}
        self._observations.append(observation)
        return {"observation": observation, "fork_proof": proof}
