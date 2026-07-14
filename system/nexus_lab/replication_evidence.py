"""R017 deterministic replication and explicit fork-evidence kernel.

This module compares authenticated checkpoint statements produced by independent
R016 replicas.  It does not select a winner, manufacture finality, or claim
consensus.  It preserves enough exact evidence to distinguish duplicate,
extension, stale, gap, corruption, equivocation, and fork observations.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any, Callable, Mapping

CHECKPOINT_SCHEMA = "nexus.r017.replica-checkpoint/v0"
FORK_PROOF_SCHEMA = "nexus.r017.fork-proof/v0"
OBSERVATION_SCHEMA = "nexus.r017.observation/v0"
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

    def __init__(self, message: str) -> None:
        super().__init__(message)


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
        return json.dumps(
            value,
            ensure_ascii=True,
            sort_keys=True,
            separators=(",", ":"),
            allow_nan=False,
        ).encode("ascii")
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
    parsed = int(value)
    if parsed > MAX_HEIGHT:
        raise SchemaError("height exceeds protocol bound")
    return parsed


@dataclass(frozen=True)
class Checkpoint:
    replica_id: str
    height: int
    state_root: str
    record_hash: str
    receipt_head: str
    parent_checkpoint: str
    genesis_sha256: str
    checkpoint_id: str
    signature: str
    raw: bytes

    @property
    def unsigned(self) -> dict[str, str]:
        return {
            "genesis_sha256": self.genesis_sha256,
            "height": str(self.height),
            "parent_checkpoint": self.parent_checkpoint,
            "receipt_head": self.receipt_head,
            "record_hash": self.record_hash,
            "replica_id": self.replica_id,
            "schema": CHECKPOINT_SCHEMA,
            "state_root": self.state_root,
            "status_authority": STATUS_AUTHORITY,
        }


def checkpoint_payload(
    *,
    replica_id: str,
    height: int,
    state_root: str,
    record_hash: str,
    receipt_head: str,
    parent_checkpoint: str,
    genesis_sha256: str,
) -> dict[str, str]:
    if type(replica_id) is not str or _REPLICA.fullmatch(replica_id) is None:
        raise SchemaError("replica_id has invalid syntax")
    if type(height) is not int or not 0 <= height <= MAX_HEIGHT:
        raise SchemaError("height is outside the protocol bound")
    payload = {
        "genesis_sha256": _require_hash(genesis_sha256, "genesis_sha256"),
        "height": str(height),
        "parent_checkpoint": _require_hash(parent_checkpoint, "parent_checkpoint", allow_empty=height == 0),
        "receipt_head": _require_hash(receipt_head, "receipt_head", allow_empty=height == 0),
        "record_hash": _require_hash(record_hash, "record_hash", allow_empty=height == 0),
        "replica_id": replica_id,
        "schema": CHECKPOINT_SCHEMA,
        "state_root": _require_hash(state_root, "state_root"),
        "status_authority": STATUS_AUTHORITY,
    }
    if height == 0 and any(payload[key] for key in ("parent_checkpoint", "receipt_head", "record_hash")):
        raise SchemaError("height-zero checkpoint must use empty predecessor heads")
    if height > 0 and not all(payload[key] for key in ("parent_checkpoint", "receipt_head", "record_hash")):
        raise SchemaError("nonzero checkpoint requires all predecessor heads")
    return payload


def encode_checkpoint(payload: Mapping[str, Any], signature: str) -> bytes:
    if type(signature) is not str or not signature:
        raise SchemaError("signature must be a nonempty transport-authentication token")
    unsigned = checkpoint_payload(
        replica_id=payload.get("replica_id"),
        height=_height(payload.get("height")),
        state_root=payload.get("state_root"),
        record_hash=payload.get("record_hash"),
        receipt_head=payload.get("receipt_head"),
        parent_checkpoint=payload.get("parent_checkpoint"),
        genesis_sha256=payload.get("genesis_sha256"),
    )
    checkpoint_id = _hash("NEXUS/R017/CHECKPOINT/v0", unsigned)
    return canonical_json({**unsigned, "checkpoint_id": checkpoint_id, "signature": signature})


def decode_checkpoint(raw: bytes, verify: Callable[[str, bytes, str], bool]) -> Checkpoint:
    obj = _decode(raw)
    expected_fields = {
        "checkpoint_id", "genesis_sha256", "height", "parent_checkpoint",
        "receipt_head", "record_hash", "replica_id", "schema", "signature",
        "state_root", "status_authority",
    }
    if set(obj) != expected_fields:
        raise SchemaError("checkpoint fields are not exact")
    if obj["schema"] != CHECKPOINT_SCHEMA or obj["status_authority"] != STATUS_AUTHORITY:
        raise SchemaError("checkpoint schema or authority is invalid")
    unsigned = checkpoint_payload(
        replica_id=obj["replica_id"], height=_height(obj["height"]),
        state_root=obj["state_root"], record_hash=obj["record_hash"],
        receipt_head=obj["receipt_head"], parent_checkpoint=obj["parent_checkpoint"],
        genesis_sha256=obj["genesis_sha256"],
    )
    checkpoint_id = _hash("NEXUS/R017/CHECKPOINT/v0", unsigned)
    if obj["checkpoint_id"] != checkpoint_id:
        raise EncodingError("checkpoint_id does not bind the exact statement")
    signature = obj["signature"]
    if type(signature) is not str or not signature:
        raise SchemaError("signature is missing")
    if not verify(obj["replica_id"], canonical_json(unsigned), signature):
        raise AuthenticationError("checkpoint signature was not accepted")
    return Checkpoint(
        replica_id=obj["replica_id"], height=int(obj["height"]),
        state_root=obj["state_root"], record_hash=obj["record_hash"],
        receipt_head=obj["receipt_head"], parent_checkpoint=obj["parent_checkpoint"],
        genesis_sha256=obj["genesis_sha256"], checkpoint_id=checkpoint_id,
        signature=signature, raw=raw,
    )


def fork_proof(left: Checkpoint, right: Checkpoint, reason: str) -> dict[str, Any]:
    ordered = sorted((left, right), key=lambda item: item.checkpoint_id)
    body = {
        "genesis_sha256": left.genesis_sha256,
        "left_checkpoint": ordered[0].checkpoint_id,
        "left_raw_sha256": hashlib.sha256(ordered[0].raw).hexdigest(),
        "reason": reason,
        "right_checkpoint": ordered[1].checkpoint_id,
        "right_raw_sha256": hashlib.sha256(ordered[1].raw).hexdigest(),
        "schema": FORK_PROOF_SCHEMA,
        "status_authority": STATUS_AUTHORITY,
    }
    return {**body, "proof_id": _hash("NEXUS/R017/FORK-PROOF/v0", body)}


class ReplicaEvidenceLog:
    """Bounded append-only observation index; never chooses a canonical branch."""

    def __init__(self, genesis_sha256: str) -> None:
        self.genesis_sha256 = _require_hash(genesis_sha256, "genesis_sha256")
        self._by_id: dict[str, Checkpoint] = {}
        self._by_replica_height: dict[tuple[str, int], Checkpoint] = {}
        self._children: dict[str, set[str]] = {}
        self._observations: list[dict[str, Any]] = []

    @property
    def observations(self) -> tuple[dict[str, Any], ...]:
        return tuple(self._observations)

    def observe(self, checkpoint: Checkpoint) -> dict[str, Any]:
        if checkpoint.genesis_sha256 != self.genesis_sha256:
            raise SchemaError("checkpoint belongs to a different genesis")
        if len(self._observations) >= MAX_OBSERVATIONS or len({c.replica_id for c in self._by_id.values()} | {checkpoint.replica_id}) > MAX_REPLICAS:
            raise CapacityError("replication evidence bound reached")
        existing = self._by_id.get(checkpoint.checkpoint_id)
        if existing is not None:
            return self._record("DUPLICATE", checkpoint, None)
        same_slot = self._by_replica_height.get((checkpoint.replica_id, checkpoint.height))
        if same_slot is not None and same_slot.checkpoint_id != checkpoint.checkpoint_id:
            proof = fork_proof(same_slot, checkpoint, "SAME_REPLICA_SAME_HEIGHT_EQUIVOCATION")
            self._record("EQUIVOCATION", checkpoint, proof)
            raise EquivocationError(proof["proof_id"])
        relation = "GENESIS" if checkpoint.height == 0 else "GAP"
        proof = None
        if checkpoint.height > 0:
            parent = self._by_id.get(checkpoint.parent_checkpoint)
            if parent is not None:
                if parent.height + 1 != checkpoint.height:
                    relation = "INVALID_PARENT_HEIGHT"
                    proof = fork_proof(parent, checkpoint, relation)
                elif parent.genesis_sha256 != checkpoint.genesis_sha256:
                    relation = "GENESIS_MISMATCH"
                    proof = fork_proof(parent, checkpoint, relation)
                else:
                    relation = "EXTENDS_KNOWN_PREFIX"
            siblings = self._children.setdefault(checkpoint.parent_checkpoint, set())
            if siblings and checkpoint.checkpoint_id not in siblings:
                sibling = self._by_id[next(iter(sorted(siblings)))]
                proof = fork_proof(sibling, checkpoint, "CONFLICTING_SIBLING_CHECKPOINTS")
                relation = "FORK_OBSERVED"
            siblings.add(checkpoint.checkpoint_id)
        self._by_id[checkpoint.checkpoint_id] = checkpoint
        self._by_replica_height[(checkpoint.replica_id, checkpoint.height)] = checkpoint
        return self._record(relation, checkpoint, proof)

    def _record(self, relation: str, checkpoint: Checkpoint, proof: dict[str, Any] | None) -> dict[str, Any]:
        body = {
            "checkpoint_id": checkpoint.checkpoint_id,
            "observation_index": str(len(self._observations)),
            "proof_id": "" if proof is None else proof["proof_id"],
            "relation": relation,
            "schema": OBSERVATION_SCHEMA,
            "status_authority": STATUS_AUTHORITY,
        }
        observation = {**body, "observation_id": _hash("NEXUS/R017/OBSERVATION/v0", body)}
        self._observations.append(observation)
        return {"observation": observation, "fork_proof": proof}
