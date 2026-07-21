"""R017 bounded replication and explicit fork-evidence experiment.

This module exchanges exact R016 synthetic envelopes between isolated logical
hosts.  It detects sibling histories and authenticates observations; it does
not implement fork choice, consensus, networking, or live custody.
"""

from __future__ import annotations

import base64
import copy
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from .custody_kernel import Machine, canonical_json


SCHEMA = "nexus.r017-compound-campaign/v0"
REPORT_SCHEMA = "nexus.r017-compound-report/v0"
CHECKPOINT_SCHEMA = "nexus.r017-checkpoint/v0"
FORK_SCHEMA = "nexus.r017-fork-evidence/v0"
NETWORK = "NEXUS-R016-SYNTHETIC"
PROFILE = "R017-REPLICATION-FORK-EVIDENCE-V0"
STATUS_AUTHORITY = "NONE"
BRANCH_SELECTION = "NONE"
CHECKPOINT_DOMAIN = "NEXUS/R017/CHECKPOINT/v0"
FORK_DOMAIN = "NEXUS/R017/FORK-EVIDENCE/v0"
REPORT_DOMAIN = "NEXUS/R017/COMPOUND-REPORT/v0"
ZERO = "0" * 64
MAX_CAMPAIGN_BYTES = 4 * 1024 * 1024


class ReplicationError(Exception):
    code = "REPLICATION_ERROR"


class AuthenticationError(ReplicationError):
    code = "CHECKPOINT_AUTHENTICATION"


class GenesisMismatchError(ReplicationError):
    code = "GENESIS_MISMATCH"


class MissingPredecessorError(ReplicationError):
    code = "MISSING_PREDECESSOR"


class CorruptEnvelopeError(ReplicationError):
    code = "CORRUPT_ENVELOPE"


def frame(domain: str, payload: bytes) -> bytes:
    raw = domain.encode("ascii")
    return len(raw).to_bytes(2, "big") + raw + len(payload).to_bytes(8, "big") + payload


def digest(domain: str, value: Any) -> str:
    return hashlib.sha256(frame(domain, canonical_json(value))).hexdigest()


def checkpoint_subject(value: dict[str, Any]) -> dict[str, Any]:
    expected = {
        "genesis_sha256", "height", "host", "host_key", "network", "payload_digest",
        "profile", "root", "schema", "session", "signature", "status_authority",
    }
    if set(value) != expected:
        raise AuthenticationError("checkpoint schema mismatch")
    subject = copy.deepcopy(value)
    subject["signature"] = ""
    return subject


def checkpoint_message(value: dict[str, Any]) -> bytes:
    return frame(CHECKPOINT_DOMAIN, canonical_json(checkpoint_subject(value)))


def _verify_ed25519(public_hex: str, signature_hex: str, message: bytes) -> None:
    try:
        public = bytes.fromhex(public_hex)
        signature = bytes.fromhex(signature_hex)
    except ValueError as exc:
        raise AuthenticationError("checkpoint key or signature is not hex") from exc
    if len(public) != 32 or len(signature) != 64:
        raise AuthenticationError("checkpoint key or signature has wrong length")
    public_der = bytes.fromhex("302a300506032b6570032100") + public
    with tempfile.TemporaryDirectory(prefix="nexus-r017-verify-") as directory:
        root = Path(directory)
        (root / "public.der").write_bytes(public_der)
        (root / "signature.bin").write_bytes(signature)
        (root / "message.bin").write_bytes(message)
        result = subprocess.run(
            ["openssl", "pkeyutl", "-verify", "-pubin", "-inkey", str(root / "public.der"),
             "-keyform", "DER", "-rawin", "-in", str(root / "message.bin"),
             "-sigfile", str(root / "signature.bin")],
            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            check=False, timeout=10,
        )
    if result.returncode != 0:
        raise AuthenticationError("checkpoint Ed25519 signature is invalid")


def verify_checkpoint(value: dict[str, Any], *, host_keys: dict[str, str], genesis_sha256: str,
                      session: str) -> None:
    subject = checkpoint_subject(value)
    if value["schema"] != CHECKPOINT_SCHEMA or value["network"] != NETWORK or value["profile"] != PROFILE:
        raise AuthenticationError("checkpoint protocol domain mismatch")
    if value["status_authority"] != STATUS_AUTHORITY or value["session"] != session:
        raise AuthenticationError("checkpoint authority or session mismatch")
    if value["genesis_sha256"] != genesis_sha256:
        raise GenesisMismatchError("checkpoint binds another genesis")
    if host_keys.get(value["host"]) != value["host_key"]:
        raise AuthenticationError("checkpoint sender substitution")
    payload = {k: subject[k] for k in subject if k not in {"payload_digest", "signature"}}
    if value["payload_digest"] != hashlib.sha256(canonical_json(payload)).hexdigest():
        raise AuthenticationError("checkpoint payload digest mismatch")
    _verify_ed25519(value["host_key"], value["signature"], checkpoint_message(value))


def replay(genesis: bytes, wires: list[bytes]) -> Machine:
    machine = Machine(genesis)
    for wire in wires:
        machine.apply(wire)
    return machine


def fork_evidence(*, genesis_sha256: str, predecessor: str, children: list[dict[str, str]],
                  checkpoints: list[dict[str, Any]]) -> dict[str, Any]:
    ordered_children = sorted(children, key=lambda item: bytes.fromhex(item["event_sha256"]))
    ordered_checkpoints = sorted(
        [{"checkpoint_digest": hashlib.sha256(canonical_json(item)).hexdigest(), "host": item["host"]}
         for item in checkpoints], key=lambda item: (item["host"], item["checkpoint_digest"]),
    )
    result: dict[str, Any] = {
        "branch_selection": BRANCH_SELECTION,
        "checkpoint_observations": ordered_checkpoints,
        "children": ordered_children,
        "classification": "SIBLING_FORK_OBSERVED",
        "evidence_id": ZERO,
        "genesis_sha256": genesis_sha256,
        "network": NETWORK,
        "predecessor": predecessor,
        "profile": PROFILE,
        "schema": FORK_SCHEMA,
        "status_authority": STATUS_AUTHORITY,
    }
    result["evidence_id"] = digest(FORK_DOMAIN, result)
    return result


def run_campaign(campaign: dict[str, Any]) -> dict[str, Any]:
    if campaign.get("schema") != SCHEMA or campaign.get("status_authority") != STATUS_AUTHORITY:
        raise ReplicationError("campaign schema or authority mismatch")
    genesis = base64.b64decode(campaign["genesis_b64"], validate=True)
    genesis_sha256 = hashlib.sha256(genesis).hexdigest()
    if genesis_sha256 != campaign["genesis_sha256"]:
        raise GenesisMismatchError("campaign genesis digest mismatch")
    common = base64.b64decode(campaign["common_event_b64"], validate=True)
    siblings = [base64.b64decode(item["event_b64"], validate=True) for item in campaign["siblings"]]
    common_machine = replay(genesis, [common])
    predecessor = common_machine.state_root
    child_rows: list[dict[str, str]] = []
    branch_roots: list[str] = []
    for declared, wire in zip(campaign["siblings"], siblings, strict=True):
        if hashlib.sha256(wire).hexdigest() != declared["event_sha256"]:
            raise CorruptEnvelopeError("sibling envelope digest mismatch")
        operation = json.loads(wire)
        if operation["predecessor"] != predecessor:
            raise MissingPredecessorError("sibling does not bind common predecessor")
        machine = replay(genesis, [common, wire])
        branch_roots.append(machine.state_root)
        child_rows.append({"event_id": operation["object_id"], "event_sha256": declared["event_sha256"]})
    if len(set(branch_roots)) != len(branch_roots):
        raise ReplicationError("declared siblings do not produce distinct roots")
    host_keys = campaign["host_keys"]
    for checkpoint in campaign["checkpoints"]:
        verify_checkpoint(checkpoint, host_keys=host_keys, genesis_sha256=genesis_sha256,
                          session=campaign["session"])
    evidence = fork_evidence(genesis_sha256=genesis_sha256, predecessor=predecessor,
                             children=child_rows, checkpoints=campaign["checkpoints"])
    base_report: dict[str, Any] = {
        "accounted_deliveries": str(len(campaign["schedule"])),
        "branch_roots": sorted(branch_roots),
        "checkpoint_count": str(len(campaign["checkpoints"])),
        "fork_evidence": evidence,
        "genesis_sha256": genesis_sha256,
        "host_count": str(len(host_keys)),
        "report_id": ZERO,
        "schema": REPORT_SCHEMA,
        "status": "PASS",
        "status_authority": STATUS_AUTHORITY,
    }
    base_report["report_id"] = digest(REPORT_DOMAIN, base_report)
    return base_report


def load_campaign(path: Path) -> dict[str, Any]:
    raw = path.read_bytes()
    if not raw or len(raw) > MAX_CAMPAIGN_BYTES:
        raise ReplicationError("campaign is empty or oversized")
    value = json.loads(raw)
    if canonical_json(value) + b"\n" != raw:
        raise ReplicationError("campaign is not canonical JSON plus newline")
    return value
