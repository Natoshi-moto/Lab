"""Pinned Ed25519 authentication and R016 anchor adaptation for R017.

This module deliberately verifies public statements only. It does not load,
generate, store, or manage private keys. Replica key provisioning and rotation
remain outside this bounded research profile.
"""

from __future__ import annotations

import hashlib
import re
import subprocess
import tempfile
from copy import deepcopy
from pathlib import Path
from typing import Any, Mapping

from .custody_kernel import NETWORK, PROFILE, PROTOCOL_VERSION, canonical_json
from .replication_evidence import AuthenticationError, SchemaError, checkpoint_payload

_PUBLIC_KEY = re.compile(r"^[0-9a-f]{64}$")
_SIGNATURE = re.compile(r"^[0-9a-f]{128}$")
_HASH = re.compile(r"^[0-9a-f]{64}$")
_REPLICA = re.compile(r"^[a-z0-9][a-z0-9._-]{0,62}$")
ANCHOR_SCHEMA = "nexus.pcx-custody-durable-anchor/v0"


class ReplicaKeyRegistry:
    """Immutable pinned replica-id to raw Ed25519 public-key mapping."""

    def __init__(self, keys: Mapping[str, str]) -> None:
        if type(keys) is not dict or not keys:
            raise SchemaError("replica key registry must be a nonempty exact mapping")
        normalized: dict[str, str] = {}
        for replica_id, public_key in keys.items():
            if type(replica_id) is not str or _REPLICA.fullmatch(replica_id) is None:
                raise SchemaError("registry contains an invalid replica_id")
            if type(public_key) is not str or _PUBLIC_KEY.fullmatch(public_key) is None:
                raise SchemaError("registry contains an invalid Ed25519 public key")
            if public_key in normalized.values():
                raise SchemaError("one public key may not identify multiple replicas")
            normalized[replica_id] = public_key
        self._keys = dict(sorted(normalized.items()))
        self.registry_id = hashlib.sha256(
            b"NEXUS/R017/REPLICA-REGISTRY/v0\x00"
            + b"\n".join(f"{key}:{value}".encode("ascii") for key, value in self._keys.items())
        ).hexdigest()

    @property
    def keys(self) -> dict[str, str]:
        return dict(self._keys)

    def verify(self, replica_id: str, message: bytes, signature: str) -> bool:
        public_key = self._keys.get(replica_id)
        if public_key is None:
            return False
        if type(message) is not bytes or type(signature) is not str or _SIGNATURE.fullmatch(signature) is None:
            return False
        public_der = bytes.fromhex("302a300506032b6570032100" + public_key)
        try:
            with tempfile.TemporaryDirectory(prefix="nexus-r017-ed25519-") as temp:
                directory = Path(temp)
                key_path = directory / "public.der"
                message_path = directory / "message.bin"
                signature_path = directory / "signature.bin"
                key_path.write_bytes(public_der)
                message_path.write_bytes(message)
                signature_path.write_bytes(bytes.fromhex(signature))
                completed = subprocess.run(
                    [
                        "openssl", "pkeyutl", "-verify", "-pubin",
                        "-inkey", str(key_path), "-keyform", "DER", "-rawin",
                        "-in", str(message_path), "-sigfile", str(signature_path),
                    ],
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=10,
                    check=False,
                )
        except (FileNotFoundError, PermissionError, subprocess.TimeoutExpired, OSError) as exc:
            raise AuthenticationError("OpenSSL Ed25519 verification is unavailable") from exc
        return completed.returncode == 0


def _validate_r016_anchor(anchor: Any) -> tuple[int, dict[str, Any]]:
    expected = {
        "anchor_id", "network", "profile", "protocol_version", "receipt_head",
        "record_hash", "schema", "sequence", "state_root", "status_authority",
    }
    if type(anchor) is not dict or set(anchor) != expected:
        raise SchemaError("R016 anchor fields are not exact")
    if (
        anchor["schema"] != ANCHOR_SCHEMA
        or anchor["network"] != NETWORK
        or anchor["profile"] != PROFILE
        or anchor["protocol_version"] != PROTOCOL_VERSION
        or anchor["status_authority"] != "NONE"
    ):
        raise SchemaError("R016 anchor domain or authority is invalid")
    sequence = anchor["sequence"]
    if type(sequence) is not str or not sequence.isdigit() or (sequence != "0" and sequence.startswith("0")):
        raise SchemaError("R016 anchor sequence is not canonical")
    height = int(sequence)
    for field in ("anchor_id", "state_root"):
        if type(anchor[field]) is not str or _HASH.fullmatch(anchor[field]) is None:
            raise SchemaError(f"R016 anchor {field} is invalid")
    for field in ("record_hash", "receipt_head"):
        value = anchor[field]
        if height == 0 and value == "":
            continue
        if type(value) is not str or _HASH.fullmatch(value) is None:
            raise SchemaError(f"R016 anchor {field} is invalid")
    subject = deepcopy(anchor)
    subject["anchor_id"] = ""
    tag_hash = hashlib.sha256(b"NEXUS/PCX/CUSTODY-DURABLE-ANCHOR/V0").digest()
    expected_id = hashlib.sha256(tag_hash + tag_hash + canonical_json(subject)).hexdigest()
    if anchor["anchor_id"] != expected_id:
        raise SchemaError("R016 anchor_id does not bind the exact anchor")
    return height, anchor


def checkpoint_payload_from_r016_audit(
    *,
    replica_id: str,
    genesis_raw: bytes,
    audit_report: Mapping[str, Any],
    parent_checkpoint: str,
) -> dict[str, str]:
    """Derive one R017 statement from an exact successful R016 store audit."""

    if type(genesis_raw) is not bytes or not genesis_raw:
        raise SchemaError("genesis_raw must be nonempty exact bytes")
    if not isinstance(audit_report, Mapping):
        raise SchemaError("audit_report must be a mapping")
    report = dict(audit_report)
    if report.get("status") != "PASS" or report.get("status_authority") != "NONE":
        raise SchemaError("R016 audit report is not a passing authority-free report")
    height, anchor = _validate_r016_anchor(report.get("anchor"))
    if report.get("height") != height or report.get("state_root") != anchor["state_root"]:
        raise SchemaError("R016 audit summary differs from its anchor")
    return checkpoint_payload(
        replica_id=replica_id,
        height=height,
        state_root=anchor["state_root"],
        record_hash=anchor["record_hash"],
        receipt_head=anchor["receipt_head"],
        parent_checkpoint=parent_checkpoint,
        genesis_sha256=hashlib.sha256(genesis_raw).hexdigest(),
    )
