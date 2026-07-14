#!/usr/bin/env python3
"""Independent Python/OpenSSL verifier for the closed R016 transcript.

This verifier deliberately does not import the implementation under test.  It
reimplements the byte framing, content addressing, authorization rules,
combined-state transition, and receipt derivation from the frozen protocol.
"""

from __future__ import annotations

import base64
import copy
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


NETWORK = "NEXUS-R016-SYNTHETIC"
PROFILE = "CUSTODY-KERNEL-V1"
VERSION = "1"
STATUS_AUTHORITY = "NONE"
ZERO = "0" * 64
THRESHOLD = "2"

TRANSCRIPT_SCHEMA = "nexus.r016-custody-closed-transcript/v0"
REPORT_SCHEMA = "nexus.r016-cross-implementation-report/v0"

DOMAINS = {
    "state": "NEXUS/R016/COMBINED-STATE/v1",
    "outpoint": "NEXUS/R016/OUTPOINT/v1",
    "receipt": "NEXUS/R016/RECEIPT/v1",
    "event_id": "NEXUS/R016/EVENT-ID/v1",
    "policy": "NEXUS/R016/RECOVERY-POLICY/v1",
    "transcript": "NEXUS/R016/CLOSED-TRANSCRIPT/v1",
    "controllers": "NEXUS/R016/FINAL-CONTROLLERS/v1",
}
SIGN_DOMAINS = {
    "TRANSFER_ACTIVE": "NEXUS/R016/SIGN/TRANSFER-ACTIVE/v1",
    "ROTATE_ACTIVE": "NEXUS/R016/SIGN/ROTATE-ACTIVE/v1",
    "ROTATE_GUARDIAN": "NEXUS/R016/SIGN/ROTATE-GUARDIAN/v1",
    "ROTATE_NEW_KEY": "NEXUS/R016/SIGN/ROTATE-NEW-KEY/v1",
    "RECOVER_GUARDIAN": "NEXUS/R016/SIGN/RECOVER-GUARDIAN/v1",
    "RECOVER_NEW_KEY": "NEXUS/R016/SIGN/RECOVER-NEW-KEY/v1",
    "REVOKE_GUARDIAN": "NEXUS/R016/SIGN/REVOKE-GUARDIAN/v1",
}

HEX32 = re.compile(r"^[0-9a-f]{64}$")
HEX64 = re.compile(r"^[0-9a-f]{128}$")
UINT = re.compile(r"^(0|[1-9][0-9]*)$")
POSITIVE = re.compile(r"^[1-9][0-9]*$")


class VerificationError(Exception):
    """A fail-closed independent verification failure."""


def _no_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    value: dict[str, Any] = {}
    for key, item in pairs:
        if key in value:
            raise VerificationError(f"duplicate JSON key: {key}")
        value[key] = item
    return value


def _json_subset(value: Any, path: str = "$") -> None:
    if type(value) is str:
        return
    if type(value) is list:
        for index, item in enumerate(value):
            _json_subset(item, f"{path}[{index}]")
        return
    if type(value) is dict:
        for key, item in value.items():
            if type(key) is not str:
                raise VerificationError(f"non-string key at {path}")
            _json_subset(item, f"{path}.{key}")
        return
    raise VerificationError(f"non-string JSON scalar at {path}")


def canonical_json(value: Any) -> bytes:
    _json_subset(value)
    return json.dumps(
        value, ensure_ascii=True, sort_keys=True, separators=(",", ":")
    ).encode("ascii")


def decode_exact(wire: bytes, *, final_newline: bool = False) -> dict[str, Any]:
    if final_newline:
        if not wire.endswith(b"\n") or wire.endswith(b"\n\n"):
            raise VerificationError("document must have exactly one final newline")
        wire = wire[:-1]
    try:
        text = wire.decode("ascii")
        value = json.loads(text, object_pairs_hook=_no_duplicate_pairs)
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise VerificationError("invalid canonical ASCII JSON") from exc
    if type(value) is not dict:
        raise VerificationError("top-level JSON must be an object")
    if canonical_json(value) != wire:
        raise VerificationError("JSON bytes are not exact canonical encoding")
    return value


def exact(value: Any, fields: set[str], path: str) -> dict[str, Any]:
    if type(value) is not dict or set(value) != fields:
        raise VerificationError(f"exact schema mismatch at {path}")
    return value


def string(value: Any, path: str) -> str:
    if type(value) is not str or not value:
        raise VerificationError(f"expected nonempty string at {path}")
    return value


def hex32(value: Any, path: str, *, nonzero: bool = False) -> str:
    value = string(value, path)
    if HEX32.fullmatch(value) is None or (nonzero and value == ZERO):
        raise VerificationError(f"invalid 32-byte hex value at {path}")
    return value


def signature(value: Any, path: str) -> str:
    value = string(value, path)
    if HEX64.fullmatch(value) is None:
        raise VerificationError(f"invalid Ed25519 signature at {path}")
    return value


def uint(value: Any, path: str, *, positive: bool = False) -> int:
    if type(value) is not str:
        raise VerificationError(f"integer is not a string at {path}")
    pattern = POSITIVE if positive else UINT
    if pattern.fullmatch(value) is None:
        raise VerificationError(f"noncanonical decimal integer at {path}")
    parsed = int(value)
    if parsed >= 1 << 128:
        raise VerificationError(f"integer exceeds R016 bound at {path}")
    return parsed


def sorted_unique(values: list[str], path: str) -> None:
    if values != sorted(values) or len(values) != len(set(values)):
        raise VerificationError(f"array is not sorted and unique at {path}")


def frame(domain: str, payload: bytes) -> bytes:
    encoded = domain.encode("ascii")
    return len(encoded).to_bytes(2, "big") + encoded + len(payload).to_bytes(8, "big") + payload


def hash_value(domain: str, value: Any) -> str:
    return hashlib.sha256(frame(domain, canonical_json(value))).hexdigest()


def policy_hash(controller: str, keys: list[str]) -> str:
    return hash_value(
        DOMAINS["policy"],
        {"controller": controller, "recovery_keys": keys, "threshold": THRESHOLD},
    )


def outpoint(object_id: str, index: int) -> str:
    return hash_value(DOMAINS["outpoint"], {"index": str(index), "object_id": object_id})


def snapshot(controllers: dict[str, dict[str, Any]], utxos: dict[str, dict[str, str]], height: int, last: str) -> dict[str, Any]:
    return {
        "controllers": [copy.deepcopy(controllers[key]) for key in sorted(controllers)],
        "height": str(height),
        "last_object_id": last,
        "network": NETWORK,
        "profile": PROFILE,
        "status_authority": STATUS_AUTHORITY,
        "utxos": [copy.deepcopy(utxos[key]) for key in sorted(utxos)],
        "version": VERSION,
    }


def state_root(controllers: dict[str, dict[str, Any]], utxos: dict[str, dict[str, str]], height: int, last: str) -> str:
    return hash_value(DOMAINS["state"], snapshot(controllers, utxos, height, last))


COMMON = {
    "controller",
    "controller_epoch",
    "controller_head",
    "kind",
    "network",
    "object_id",
    "predecessor",
    "profile",
    "status_authority",
    "version",
}
OP_FIELDS = {
    "TRANSFER": COMMON | {"inputs", "outputs", "proofs"},
    "ROTATE": COMMON | {"new_key", "proofs"},
    "RECOVER": COMMON | {"new_key", "proofs"},
    "REVOKE": COMMON | {"proofs"},
}


def unsigned(operation: dict[str, Any], *, zero_id: bool = False) -> dict[str, Any]:
    value = copy.deepcopy(operation)
    value.pop("proofs", None)
    if zero_id:
        value["object_id"] = ZERO
    return value


def operation_id(operation: dict[str, Any]) -> str:
    return hash_value(DOMAINS["event_id"], unsigned(operation, zero_id=True))


def signature_message(operation: dict[str, Any], role: str, key: str, signed_outpoint: str | None = None) -> bytes:
    body = unsigned(operation)
    context: dict[str, Any] = {
        "controller": body["controller"],
        "controller_epoch": body["controller_epoch"],
        "controller_head": body["controller_head"],
        "key": key,
        "operation": body,
        "predecessor": body["predecessor"],
        "role": role,
    }
    if role == "TRANSFER_ACTIVE":
        if signed_outpoint is None or signed_outpoint not in body["inputs"]:
            raise VerificationError("transfer proof does not bind a live input")
        context["input_index"] = str(body["inputs"].index(signed_outpoint))
        context["outpoint"] = signed_outpoint
    elif signed_outpoint is not None:
        raise VerificationError("non-transfer signature names an outpoint")
    return frame(SIGN_DOMAINS[role], canonical_json(context))


def verify_ed25519(public_key: str, proof_signature: str, message: bytes) -> None:
    public_der = bytes.fromhex("302a300506032b6570032100" + public_key)
    with tempfile.TemporaryDirectory(prefix="nexus-r016-independent-") as temporary:
        directory = Path(temporary)
        (directory / "key.der").write_bytes(public_der)
        (directory / "message.bin").write_bytes(message)
        (directory / "signature.bin").write_bytes(bytes.fromhex(proof_signature))
        try:
            completed = subprocess.run(
                [
                    "openssl", "pkeyutl", "-verify", "-pubin", "-inkey",
                    str(directory / "key.der"), "-keyform", "DER", "-rawin",
                    "-in", str(directory / "message.bin"), "-sigfile",
                    str(directory / "signature.bin"),
                ],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
                timeout=10,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise VerificationError("OpenSSL Ed25519 verification unavailable") from exc
    if completed.returncode != 0:
        raise VerificationError("invalid Ed25519 signature")


def proof_shape(value: Any, path: str, *, with_outpoint: bool = False) -> dict[str, str]:
    fields = {"key", "signature"} | ({"outpoint"} if with_outpoint else set())
    result = exact(value, fields, path)
    hex32(result["key"], f"{path}.key", nonzero=True)
    signature(result["signature"], f"{path}.signature")
    if with_outpoint:
        hex32(result["outpoint"], f"{path}.outpoint")
    return result  # type: ignore[return-value]


class IndependentMachine:
    def __init__(self, genesis: dict[str, Any]) -> None:
        exact(genesis, {"controllers", "kind", "network", "profile", "status_authority", "utxos", "version"}, "$genesis")
        if (genesis["kind"], genesis["network"], genesis["profile"], genesis["status_authority"], genesis["version"]) != ("GENESIS", NETWORK, PROFILE, STATUS_AUTHORITY, VERSION):
            raise VerificationError("genesis profile or authority mismatch")
        if type(genesis["controllers"]) is not list or not genesis["controllers"]:
            raise VerificationError("genesis controllers must be nonempty")
        self.controllers: dict[str, dict[str, Any]] = {}
        self.seen_keys: set[str] = set()
        controller_order: list[str] = []
        for index, item in enumerate(genesis["controllers"]):
            item = exact(item, {"active_key", "controller", "recovery_keys"}, f"$genesis.controllers[{index}]")
            controller = hex32(item["controller"], "controller", nonzero=True)
            active = hex32(item["active_key"], "active_key", nonzero=True)
            if type(item["recovery_keys"]) is not list or len(item["recovery_keys"]) != 3:
                raise VerificationError("genesis requires exactly three recovery keys")
            keys = [hex32(key, "recovery_key", nonzero=True) for key in item["recovery_keys"]]
            sorted_unique(keys, "recovery_keys")
            local = {active, *keys}
            if len(local) != 4 or self.seen_keys.intersection(local) or controller in self.controllers:
                raise VerificationError("genesis key/controller uniqueness failure")
            self.seen_keys.update(local)
            controller_order.append(controller)
            self.controllers[controller] = {
                "active_key": active,
                "controller": controller,
                "epoch": "0",
                "head": ZERO,
                "recovery_policy_hash": policy_hash(controller, keys),
                "recovery_keys": keys,
                "recovery_threshold": THRESHOLD,
                "retired_keys": [],
                "status": "ACTIVE",
            }
        sorted_unique(controller_order, "controllers")
        if type(genesis["utxos"]) is not list or not genesis["utxos"]:
            raise VerificationError("genesis UTXOs must be nonempty")
        self.utxos: dict[str, dict[str, str]] = {}
        outpoint_order: list[str] = []
        for index, item in enumerate(genesis["utxos"]):
            item = exact(item, {"amount", "controller", "outpoint"}, f"$genesis.utxos[{index}]")
            identifier = hex32(item["outpoint"], "outpoint")
            controller = hex32(item["controller"], "controller", nonzero=True)
            uint(item["amount"], "amount", positive=True)
            if identifier in self.utxos or controller not in self.controllers:
                raise VerificationError("genesis UTXO identity/owner failure")
            outpoint_order.append(identifier)
            self.utxos[identifier] = copy.deepcopy(item)
        sorted_unique(outpoint_order, "utxos")
        self.seen_outpoints = set(self.utxos)
        self.height = 0
        self.last = ZERO
        self.root = state_root(self.controllers, self.utxos, 0, ZERO)

    @property
    def supply(self) -> int:
        return sum(uint(item["amount"], "amount", positive=True) for item in self.utxos.values())

    def _validate_operation(self, op: dict[str, Any]) -> None:
        kind = string(op.get("kind"), "kind")
        if kind not in OP_FIELDS:
            raise VerificationError("unsupported operation kind")
        exact(op, OP_FIELDS[kind], "$event")
        if (op["network"], op["profile"], op["status_authority"], op["version"]) != (NETWORK, PROFILE, STATUS_AUTHORITY, VERSION):
            raise VerificationError("event profile or authority mismatch")
        hex32(op["object_id"], "object_id", nonzero=True)
        hex32(op["predecessor"], "predecessor")
        hex32(op["controller"], "controller", nonzero=True)
        uint(op["controller_epoch"], "controller_epoch")
        hex32(op["controller_head"], "controller_head")
        if kind == "TRANSFER":
            if type(op["inputs"]) is not list or not 1 <= len(op["inputs"]) <= 64:
                raise VerificationError("invalid transfer inputs")
            inputs = [hex32(item, "input") for item in op["inputs"]]
            sorted_unique(inputs, "inputs")
            if type(op["outputs"]) is not list or not 1 <= len(op["outputs"]) <= 64:
                raise VerificationError("invalid transfer outputs")
            for output in op["outputs"]:
                exact(output, {"amount", "controller"}, "output")
                uint(output["amount"], "amount", positive=True)
                hex32(output["controller"], "controller", nonzero=True)
            if type(op["proofs"]) is not list or len(op["proofs"]) != len(inputs):
                raise VerificationError("transfer proofs do not match inputs")
            proofs = [proof_shape(item, "proof", with_outpoint=True) for item in op["proofs"]]
            if [item["outpoint"] for item in proofs] != inputs:
                raise VerificationError("transfer proof order mismatch")
        elif kind == "ROTATE":
            hex32(op["new_key"], "new_key", nonzero=True)
            proofs = exact(op["proofs"], {"active", "guardian", "new_key"}, "proofs")
            for name in ("active", "guardian", "new_key"):
                proof_shape(proofs[name], f"proofs.{name}")
        elif kind == "RECOVER":
            hex32(op["new_key"], "new_key", nonzero=True)
            proofs = exact(op["proofs"], {"guardians", "new_key"}, "proofs")
            if type(proofs["guardians"]) is not list or len(proofs["guardians"]) != 2:
                raise VerificationError("recovery requires two proofs")
            guardians = [proof_shape(item, "guardian") for item in proofs["guardians"]]
            sorted_unique([item["key"] for item in guardians], "guardian proofs")
            proof_shape(proofs["new_key"], "proofs.new_key")
        else:
            proofs = exact(op["proofs"], {"guardians"}, "proofs")
            if type(proofs["guardians"]) is not list or len(proofs["guardians"]) != 2:
                raise VerificationError("revocation requires two proofs")
            guardians = [proof_shape(item, "guardian") for item in proofs["guardians"]]
            sorted_unique([item["key"] for item in guardians], "guardian proofs")

    @staticmethod
    def _check_active(controller: dict[str, Any], proof: dict[str, str]) -> None:
        if proof["key"] != controller["active_key"]:
            raise VerificationError("proof is not from current active key")

    @staticmethod
    def _check_guardian(controller: dict[str, Any], proof: dict[str, str]) -> None:
        if proof["key"] not in controller["recovery_keys"]:
            raise VerificationError("proof is not from fixed recovery policy")

    @staticmethod
    def _verify(op: dict[str, Any], role: str, proof: dict[str, str], signed_outpoint: str | None = None) -> None:
        verify_ed25519(proof["key"], proof["signature"], signature_message(op, role, proof["key"], signed_outpoint))

    def apply(self, op: dict[str, Any]) -> dict[str, str]:
        self._validate_operation(op)
        if op["object_id"] != operation_id(op):
            raise VerificationError("event content address mismatch")
        if op["predecessor"] != self.root:
            raise VerificationError("event predecessor is not exact combined root")
        controller_id = op["controller"]
        if controller_id not in self.controllers:
            raise VerificationError("unknown controller")
        live = self.controllers[controller_id]
        if live["status"] != "ACTIVE":
            raise VerificationError("locked controller cannot act")
        if op["controller_epoch"] != live["epoch"] or op["controller_head"] != live["head"]:
            raise VerificationError("stale controller context")

        controllers = copy.deepcopy(self.controllers)
        utxos = copy.deepcopy(self.utxos)
        staged = controllers[controller_id]
        kind = op["kind"]
        if kind == "TRANSFER":
            total_in = 0
            for identifier, proof in zip(op["inputs"], op["proofs"], strict=True):
                if identifier not in self.utxos or self.utxos[identifier]["controller"] != controller_id:
                    raise VerificationError("unknown or foreign transfer input")
                self._check_active(live, proof)
                self._verify(op, "TRANSFER_ACTIVE", proof, identifier)
                total_in += uint(self.utxos[identifier]["amount"], "input amount", positive=True)
            total_out = 0
            additions: list[dict[str, str]] = []
            for index, output in enumerate(op["outputs"]):
                recipient = output["controller"]
                if recipient not in self.controllers or self.controllers[recipient]["status"] != "ACTIVE":
                    raise VerificationError("transfer recipient unavailable")
                total_out += uint(output["amount"], "output amount", positive=True)
                identifier = outpoint(op["object_id"], index)
                if identifier in self.seen_outpoints:
                    raise VerificationError("derived outpoint has existed before")
                additions.append({"amount": output["amount"], "controller": recipient, "outpoint": identifier})
            if total_in != total_out:
                raise VerificationError("transfer violates conservation")
            for identifier in op["inputs"]:
                del utxos[identifier]
            for item in additions:
                utxos[item["outpoint"]] = item
                self.seen_outpoints.add(item["outpoint"])
        elif kind == "ROTATE":
            proofs = op["proofs"]
            if op["new_key"] in self.seen_keys:
                raise VerificationError("new key has already appeared")
            self._check_active(live, proofs["active"])
            self._check_guardian(live, proofs["guardian"])
            if proofs["new_key"]["key"] != op["new_key"]:
                raise VerificationError("new-key possession proof mismatch")
            self._verify(op, "ROTATE_ACTIVE", proofs["active"])
            self._verify(op, "ROTATE_GUARDIAN", proofs["guardian"])
            self._verify(op, "ROTATE_NEW_KEY", proofs["new_key"])
            staged["retired_keys"].append(staged["active_key"])
            staged["retired_keys"].sort()
            staged["active_key"] = op["new_key"]
            staged["epoch"] = str(int(staged["epoch"]) + 1)
            staged["head"] = op["object_id"]
            self.seen_keys.add(op["new_key"])
        elif kind == "RECOVER":
            proofs = op["proofs"]
            guardians = proofs["guardians"]
            if op["new_key"] in self.seen_keys:
                raise VerificationError("recovery key has already appeared")
            for item in guardians:
                self._check_guardian(live, item)
                self._verify(op, "RECOVER_GUARDIAN", item)
            if len({item["key"] for item in guardians}) != 2:
                raise VerificationError("recovery quorum is not distinct")
            if proofs["new_key"]["key"] != op["new_key"]:
                raise VerificationError("recovery possession proof mismatch")
            self._verify(op, "RECOVER_NEW_KEY", proofs["new_key"])
            staged["retired_keys"].append(staged["active_key"])
            staged["retired_keys"].sort()
            staged["active_key"] = op["new_key"]
            staged["epoch"] = str(int(staged["epoch"]) + 1)
            staged["head"] = op["object_id"]
            self.seen_keys.add(op["new_key"])
        else:
            guardians = op["proofs"]["guardians"]
            for item in guardians:
                self._check_guardian(live, item)
                self._verify(op, "REVOKE_GUARDIAN", item)
            if len({item["key"] for item in guardians}) != 2:
                raise VerificationError("revocation quorum is not distinct")
            staged["retired_keys"].append(staged["active_key"])
            staged["retired_keys"].sort()
            staged["active_key"] = ZERO
            staged["status"] = "LOCKED"
            staged["epoch"] = str(int(staged["epoch"]) + 1)
            staged["head"] = op["object_id"]

        before = self.root
        height = self.height + 1
        after = state_root(controllers, utxos, height, op["object_id"])
        receipt_base = {
            "after_root": after,
            "before_root": before,
            "height": str(height),
            "kind": kind,
            "object_id": op["object_id"],
            "result": "APPLIED",
            "status_authority": STATUS_AUTHORITY,
        }
        receipt = {**receipt_base, "receipt_hash": hash_value(DOMAINS["receipt"], receipt_base)}
        self.controllers = controllers
        self.utxos = utxos
        self.height = height
        self.last = op["object_id"]
        self.root = after
        return receipt


CLAIMS = [
    "CLOSED_TRANSCRIPT_REPLAYED_IDENTICALLY_BY_INDEPENDENT_PYTHON_OPENSSL_AND_NODE_NOBLE_IMPLEMENTATIONS",
    "SYNTHETIC_SUPPLY_CONSERVED_ACROSS_THE_ACCEPTED_PREFIX",
    "CONTROLLER_ROTATION_QUORUM_RECOVERY_AND_TERMINAL_LOCK_REPLAYED",
]
NONCLAIMS = [
    "NO_CLAIM_OF_MONEY_ECONOMIC_VALUE_PURCHASING_POWER_VALUE_STABILITY_BACKING_OR_REDEMPTION",
    "NO_CLAIM_OF_PRODUCTION_KEY_SECRECY_ENTROPY_SECURE_ERASURE_HSM_OR_DEVICE_SAFETY",
    "NO_CLAIM_OF_GUARDIAN_INDEPENDENCE_AND_NO_AUTOMATIC_LOSS_OR_COMPROMISE_DETECTION",
    "NO_REVERSAL_OF_AN_ATTACKER_TRANSFER_COMMITTED_FIRST",
    "NO_CONSENSUS_FORK_CHOICE_OR_GLOBAL_FINALITY",
    "NO_PHYSICAL_POWER_LOSS_PROOF",
    "NO_EXTERNAL_AUDIT_FORMAL_VERIFICATION_REGULATORY_APPROVAL_OR_LIVE_PILOT",
]


def verify(genesis_path: Path, transcript_path: Path) -> dict[str, Any]:
    genesis_wire = genesis_path.read_bytes()
    genesis = decode_exact(genesis_wire)
    transcript = decode_exact(transcript_path.read_bytes(), final_newline=True)
    exact(
        transcript,
        {
            "closure", "event_count", "final_height", "final_state", "final_state_root",
            "genesis_b64", "genesis_sha256", "initial_state_root", "network",
            "profile", "records", "schema", "status_authority", "synthetic_supply",
            "transcript_id", "vector_provenance", "version",
        },
        "$transcript",
    )
    if (
        transcript["closure"], transcript["network"], transcript["profile"],
        transcript["schema"], transcript["status_authority"], transcript["version"],
    ) != ("CLOSED_EXACT_PREFIX", NETWORK, PROFILE, TRANSCRIPT_SCHEMA, STATUS_AUTHORITY, VERSION):
        raise VerificationError("transcript envelope mismatch")
    expected_provenance = {
        "derivation": "PUBLIC_LABEL_SHA256_TO_EPHEMERAL_ED25519_PKCS8_TEMPFILES",
        "operational_secrecy": "NONE",
        "retained_private_material": "FALSE",
        "signer": "OPENSSL_ED25519",
    }
    if transcript["vector_provenance"] != expected_provenance:
        raise VerificationError("vector provenance mismatch")
    try:
        embedded_genesis = base64.b64decode(transcript["genesis_b64"], validate=True)
    except (ValueError, TypeError) as exc:
        raise VerificationError("invalid genesis base64") from exc
    if embedded_genesis != genesis_wire or hashlib.sha256(genesis_wire).hexdigest() != transcript["genesis_sha256"]:
        raise VerificationError("embedded genesis/hash mismatch")
    transcript_subject = copy.deepcopy(transcript)
    transcript_subject["transcript_id"] = ZERO
    if transcript["transcript_id"] != hash_value(DOMAINS["transcript"], transcript_subject):
        raise VerificationError("transcript content address mismatch")

    machine = IndependentMachine(genesis)
    initial_root = machine.root
    initial_supply = machine.supply
    if transcript["initial_state_root"] != initial_root:
        raise VerificationError("initial state root mismatch")
    if type(transcript["records"]) is not list or uint(transcript["event_count"], "event_count") != len(transcript["records"]):
        raise VerificationError("event count mismatch")
    counts = {"RECOVER": 0, "REVOKE": 0, "ROTATE": 0, "TRANSFER": 0}
    for index, record in enumerate(transcript["records"], start=1):
        record = exact(record, {"event_b64", "event_sha256", "kind", "object_id", "receipt", "sequence"}, f"$records[{index - 1}]")
        if record["sequence"] != str(index):
            raise VerificationError("record sequence mismatch")
        try:
            event_wire = base64.b64decode(record["event_b64"], validate=True)
        except (ValueError, TypeError) as exc:
            raise VerificationError("invalid event base64") from exc
        event = decode_exact(event_wire)
        if hashlib.sha256(event_wire).hexdigest() != record["event_sha256"]:
            raise VerificationError("event byte hash mismatch")
        if event["kind"] != record["kind"] or event["object_id"] != record["object_id"]:
            raise VerificationError("record event identity mismatch")
        receipt = machine.apply(event)
        if receipt != record["receipt"]:
            raise VerificationError("independently derived receipt mismatch")
        if machine.supply != initial_supply:
            raise VerificationError("synthetic supply changed")
        counts[event["kind"]] += 1
    if (
        machine.root != transcript["final_state_root"]
        or str(machine.height) != transcript["final_height"]
        or str(initial_supply) != transcript["synthetic_supply"]
    ):
        raise VerificationError("final state/supply mismatch")
    if snapshot(machine.controllers, machine.utxos, machine.height, machine.last) != transcript["final_state"]:
        raise VerificationError("embedded final state mismatch")
    locked = [item for item in machine.controllers.values() if item["status"] == "LOCKED"]
    if len(locked) != 1 or locked[0]["active_key"] != ZERO:
        raise VerificationError("expected exactly one terminally locked controller")
    final_controllers = [machine.controllers[key] for key in sorted(machine.controllers)]
    locked_controller = locked[0]
    return {
        "claims": CLAIMS,
        "event_count": str(len(transcript["records"])),
        "final_controller_set_hash": hash_value(DOMAINS["controllers"], final_controllers),
        "final_height": str(machine.height),
        "final_locked_controller": {
            "active_key": locked_controller["active_key"],
            "controller": locked_controller["controller"],
            "epoch": locked_controller["epoch"],
            "head": locked_controller["head"],
            "retired_key_count": str(len(locked_controller["retired_keys"])),
            "status": locked_controller["status"],
        },
        "final_state_root": machine.root,
        "implementations": ["NODE_NOBLE_ED25519", "PYTHON_OPENSSL_ED25519"],
        "initial_state_root": initial_root,
        "nonclaims": NONCLAIMS,
        "operation_counts": {key: str(counts[key]) for key in sorted(counts)},
        "schema": REPORT_SCHEMA,
        "status": "PASS",
        "status_authority": STATUS_AUTHORITY,
        "synthetic_supply": str(initial_supply),
        "transcript_id": transcript["transcript_id"],
    }


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        raise SystemExit("usage: verify_transcript.py GENESIS.json CLOSED_TRANSCRIPT.json")
    report = verify(Path(argv[1]), Path(argv[2]))
    sys.stdout.buffer.write(canonical_json(report) + b"\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
