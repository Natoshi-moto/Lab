"""R016 integrated synthetic custody and conserved-transfer kernel.

This self-contained module is a deterministic safety demonstration, not a
claim that its synthetic unit is money or that this process is distributed
consensus. Every post-genesis change passes one canonical serialized apply
gate, anchors the exact combined predecessor root, and verifies all required
Ed25519 signatures through OpenSSL.
"""

from __future__ import annotations

import copy
import hashlib
import json
import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Sequence


NETWORK = "NEXUS-R016-SYNTHETIC"
PROFILE = "CUSTODY-KERNEL-V1"
PROTOCOL_VERSION = "1"
STATUS_AUTHORITY = "NONE"
RECOVERY_THRESHOLD = "2"
ZERO_HEAD = "0" * 64

MAX_WIRE_BYTES = 64 * 1024
MAX_GENESIS_BYTES = 256 * 1024
MAX_CHECKPOINT_BYTES = 2 * 1024 * 1024
MAX_CONTROLLERS = 256
MAX_GENESIS_UTXOS = 4096
MAX_INPUTS = 64
MAX_OUTPUTS = 64
MAX_RETIRED_KEYS = 4096
MAX_AMOUNT = (1 << 128) - 1
MAX_HEIGHT = (1 << 64) - 1

_HEX32 = re.compile(r"^[0-9a-f]{64}$")
_HEX64 = re.compile(r"^[0-9a-f]{128}$")
_UINT = re.compile(r"^(0|[1-9][0-9]*)$")
_POSITIVE_UINT = re.compile(r"^[1-9][0-9]*$")

_STATE_DOMAIN = "NEXUS/R016/COMBINED-STATE/v1"
_OUTPOINT_DOMAIN = "NEXUS/R016/OUTPOINT/v1"
_RECEIPT_DOMAIN = "NEXUS/R016/RECEIPT/v1"
_EVENT_ID_DOMAIN = "NEXUS/R016/EVENT-ID/v1"
_RECOVERY_POLICY_DOMAIN = "NEXUS/R016/RECOVERY-POLICY/v1"
_SIGN_DOMAINS = {
    "TRANSFER_ACTIVE": "NEXUS/R016/SIGN/TRANSFER-ACTIVE/v1",
    "ROTATE_ACTIVE": "NEXUS/R016/SIGN/ROTATE-ACTIVE/v1",
    "ROTATE_GUARDIAN": "NEXUS/R016/SIGN/ROTATE-GUARDIAN/v1",
    "ROTATE_NEW_KEY": "NEXUS/R016/SIGN/ROTATE-NEW-KEY/v1",
    "RECOVER_GUARDIAN": "NEXUS/R016/SIGN/RECOVER-GUARDIAN/v1",
    "RECOVER_NEW_KEY": "NEXUS/R016/SIGN/RECOVER-NEW-KEY/v1",
    "REVOKE_GUARDIAN": "NEXUS/R016/SIGN/REVOKE-GUARDIAN/v1",
}


class CustodyKernelError(Exception):
    """Base for deliberate, typed, fail-closed kernel failures."""

    code = "CUSTODY_KERNEL_ERROR"

    def __init__(self, message: str, *, category: str | None = None) -> None:
        super().__init__(message)
        self.category = category


class WireTypeError(CustodyKernelError):
    code = "WIRE_TYPE"


class BoundsError(CustodyKernelError):
    code = "BOUNDS"


class CanonicalEncodingError(CustodyKernelError):
    code = "NON_CANONICAL"


class DuplicateKeyError(CanonicalEncodingError):
    code = "DUPLICATE_JSON_KEY"


class SchemaError(CustodyKernelError):
    code = "SCHEMA"


class IntegerEncodingError(SchemaError):
    code = "INTEGER_ENCODING"


class NetworkMismatchError(CustodyKernelError):
    code = "NETWORK_MISMATCH"


class AuthorityEscalationError(CustodyKernelError):
    code = "AUTHORITY_ESCALATION"


class UnknownControllerError(CustodyKernelError):
    code = "UNKNOWN_CONTROLLER"


class LockedControllerError(CustodyKernelError):
    code = "CONTROLLER_LOCKED"


class StaleStateError(CustodyKernelError):
    code = "STALE_STATE"


class StaleControllerContextError(CustodyKernelError):
    code = "STALE_CONTROLLER_CONTEXT"


class ObjectIdCollisionError(CustodyKernelError):
    code = "OBJECT_ID_COLLISION"


class EventIdMismatchError(CustodyKernelError):
    code = "EVENT_ID_MISMATCH"


class OutpointCollisionError(CustodyKernelError):
    code = "OUTPOINT_COLLISION"


class UnknownOutpointError(CustodyKernelError):
    code = "UNKNOWN_OUTPOINT"


class OwnershipError(CustodyKernelError):
    code = "OWNERSHIP"


class ConservationError(CustodyKernelError):
    code = "CONSERVATION"


class InvalidSignatureError(CustodyKernelError):
    code = "INVALID_SIGNATURE"


class VerificationUnavailableError(CustodyKernelError):
    code = "VERIFICATION_UNAVAILABLE"


class KeyRoleError(CustodyKernelError):
    code = "KEY_ROLE"


class RetiredKeyError(KeyRoleError):
    code = "RETIRED_KEY"


class KeyReuseError(CustodyKernelError):
    code = "KEY_REUSE"


class QuorumError(CustodyKernelError):
    code = "QUORUM"


class BackupNotRestorableError(CustodyKernelError):
    code = "BACKUP_NOT_RESTORABLE"


@dataclass(frozen=True)
class BackupAssessment:
    """A public checkpoint classification; no secret-backup claim is made."""

    classification: str
    restorable: bool
    reason: str


@dataclass
class _Controller:
    controller: str
    epoch: int
    head: str
    status: str
    active_key: str
    recovery_keys: tuple[str, str, str]
    retired_keys: list[str]


@dataclass(frozen=True)
class _Utxo:
    outpoint: str
    controller: str
    amount: int


def _validate_json(value: Any, path: str = "$", depth: int = 0) -> None:
    if depth > 32:
        raise BoundsError(f"JSON nesting exceeds limit at {path}")
    if type(value) is str:
        if len(value) > MAX_CHECKPOINT_BYTES:
            raise BoundsError(f"string exceeds limit at {path}")
        return
    if type(value) is list:
        if len(value) > MAX_GENESIS_UTXOS + MAX_CONTROLLERS:
            raise BoundsError(f"array exceeds generic limit at {path}")
        for index, item in enumerate(value):
            _validate_json(item, f"{path}[{index}]", depth + 1)
        return
    if type(value) is dict:
        if len(value) > 32:
            raise BoundsError(f"object has too many fields at {path}")
        for key, item in value.items():
            if type(key) is not str:
                raise SchemaError(f"non-string object key at {path}")
            _validate_json(item, f"{path}.{key}", depth + 1)
        return
    raise SchemaError(f"only objects, arrays, and strings are allowed at {path}")


def canonical_json(value: Any) -> bytes:
    """Encode the protocol JSON subset as canonical ASCII bytes."""

    _validate_json(value)
    try:
        return json.dumps(
            value,
            ensure_ascii=True,
            sort_keys=True,
            separators=(",", ":"),
            allow_nan=False,
        ).encode("ascii")
    except (TypeError, ValueError, UnicodeError) as exc:
        raise CanonicalEncodingError("value cannot be canonically encoded") from exc


def _pairs_no_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateKeyError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def _reject_constant(value: str) -> None:
    raise SchemaError(f"non-finite JSON number is forbidden: {value}")


def _decode(wire: bytes, maximum: int) -> tuple[dict[str, Any], bytes]:
    if type(wire) is not bytes:
        raise WireTypeError("serialized input must be bytes")
    if not wire or len(wire) > maximum:
        raise BoundsError("serialized input is empty or exceeds its byte limit")
    try:
        text = wire.decode("ascii")
    except UnicodeDecodeError as exc:
        raise CanonicalEncodingError("serialized input must be ASCII") from exc
    try:
        value = json.loads(
            text,
            object_pairs_hook=_pairs_no_duplicates,
            parse_constant=_reject_constant,
        )
    except DuplicateKeyError:
        raise
    except SchemaError:
        raise
    except (json.JSONDecodeError, ValueError) as exc:
        raise CanonicalEncodingError("serialized input is not valid JSON") from exc
    except RecursionError as exc:
        raise BoundsError("serialized input nesting exceeds parser limits") from exc
    if type(value) is not dict:
        raise SchemaError("top-level JSON value must be an object")
    normalized = canonical_json(value)
    if normalized != wire:
        raise CanonicalEncodingError("input is not exact canonical ASCII JSON")
    return value, normalized


def _exact(obj: Any, fields: set[str], path: str) -> dict[str, Any]:
    if type(obj) is not dict:
        raise SchemaError(f"{path} must be an object")
    actual = set(obj)
    if actual != fields:
        raise SchemaError(
            f"{path} schema mismatch; missing={sorted(fields-actual)}, "
            f"unknown={sorted(actual-fields)}"
        )
    return obj


def _array(value: Any, minimum: int, maximum: int, path: str) -> list[Any]:
    if type(value) is not list:
        raise SchemaError(f"{path} must be an array")
    if not minimum <= len(value) <= maximum:
        raise BoundsError(f"{path} length must be between {minimum} and {maximum}")
    return value


def _string(value: Any, path: str, maximum: int = 256) -> str:
    if type(value) is not str:
        raise SchemaError(f"{path} must be a string")
    if not value or len(value) > maximum:
        raise BoundsError(f"{path} has invalid length")
    return value


def _hex32(value: Any, path: str, allow_zero: bool = True) -> str:
    value = _string(value, path, 64)
    if _HEX32.fullmatch(value) is None:
        raise SchemaError(f"{path} must be 32 lowercase hex bytes")
    if not allow_zero and value == ZERO_HEAD:
        raise SchemaError(f"{path} may not be the reserved zero identifier")
    return value


def _signature(value: Any, path: str) -> str:
    value = _string(value, path, 128)
    if _HEX64.fullmatch(value) is None:
        raise SchemaError(f"{path} must be 64 lowercase hex bytes")
    return value


def _uint(value: Any, path: str, positive: bool, maximum: int) -> int:
    if type(value) is not str:
        raise IntegerEncodingError(f"{path} must be a decimal string")
    pattern = _POSITIVE_UINT if positive else _UINT
    if pattern.fullmatch(value) is None:
        raise IntegerEncodingError(f"{path} is not a canonical decimal string")
    result = int(value)
    if result > maximum:
        raise BoundsError(f"{path} exceeds its maximum")
    return result


def _authority(value: Any, path: str) -> None:
    if type(value) is not str or value != STATUS_AUTHORITY:
        raise AuthorityEscalationError(
            f"{path} attempts to introduce status authority"
        )


def _sorted_unique(values: Sequence[str], path: str) -> None:
    if list(values) != sorted(values):
        raise SchemaError(f"{path} must be sorted")
    if len(set(values)) != len(values):
        raise SchemaError(f"{path} must contain unique values")


def _frame(domain: str, payload: bytes) -> bytes:
    domain_bytes = domain.encode("ascii")
    return (
        len(domain_bytes).to_bytes(2, "big")
        + domain_bytes
        + len(payload).to_bytes(8, "big")
        + payload
    )


def _hash(domain: str, value: Any) -> str:
    return hashlib.sha256(_frame(domain, canonical_json(value))).hexdigest()


def derive_outpoint(object_id: str, index: int) -> str:
    _hex32(object_id, "object_id", False)
    if type(index) is not int or index < 0 or index >= MAX_OUTPUTS:
        raise BoundsError("output index is outside the protocol bound")
    return _hash(_OUTPOINT_DOMAIN, {"index": str(index), "object_id": object_id})


def recovery_policy_hash(
    controller_id: str, recovery_keys: Sequence[str]
) -> str:
    """Commit an immutable 2-of-3 recovery policy for one controller."""

    controller_id = _hex32(controller_id, "controller", False)
    if type(recovery_keys) not in {list, tuple} or len(recovery_keys) != 3:
        raise SchemaError("recovery policy requires exactly three keys")
    keys = [
        _hex32(key, f"recovery_keys[{index}]", False)
        for index, key in enumerate(recovery_keys)
    ]
    _sorted_unique(keys, "recovery_keys")
    return _hash(
        _RECOVERY_POLICY_DOMAIN,
        {
            "controller": controller_id,
            "recovery_keys": keys,
            "threshold": RECOVERY_THRESHOLD,
        },
    )


_COMMON_FIELDS = {
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
_OP_FIELDS = {
    "TRANSFER": _COMMON_FIELDS | {"inputs", "outputs", "proofs"},
    "ROTATE": _COMMON_FIELDS | {"new_key", "proofs"},
    "RECOVER": _COMMON_FIELDS | {"new_key", "proofs"},
    "REVOKE": _COMMON_FIELDS | {"proofs"},
}


def _common_values(
    op: Mapping[str, Any], *, allow_zero_object_id: bool = False
) -> None:
    network = _string(op["network"], "$.network", 64)
    profile = _string(op["profile"], "$.profile", 64)
    version = _string(op["version"], "$.version", 8)
    if (network, profile, version) != (NETWORK, PROFILE, PROTOCOL_VERSION):
        raise NetworkMismatchError("operation targets another network/profile/version")
    _authority(op["status_authority"], "$.status_authority")
    kind = _string(op["kind"], "$.kind", 16)
    if kind not in _OP_FIELDS:
        raise SchemaError("unsupported operation kind")
    _hex32(op["object_id"], "$.object_id", allow_zero_object_id)
    _hex32(op["predecessor"], "$.predecessor")
    _hex32(op["controller"], "$.controller", False)
    _uint(op["controller_epoch"], "$.controller_epoch", False, MAX_HEIGHT)
    _hex32(op["controller_head"], "$.controller_head")


def _transfer_unsigned(op: Mapping[str, Any]) -> None:
    inputs = _array(op["inputs"], 1, MAX_INPUTS, "$.inputs")
    parsed = [_hex32(item, f"$.inputs[{index}]") for index, item in enumerate(inputs)]
    _sorted_unique(parsed, "$.inputs")
    outputs = _array(op["outputs"], 1, MAX_OUTPUTS, "$.outputs")
    for index, output in enumerate(outputs):
        output = _exact(output, {"amount", "controller"}, f"$.outputs[{index}]")
        _hex32(output["controller"], f"$.outputs[{index}].controller", False)
        _uint(output["amount"], f"$.outputs[{index}].amount", True, MAX_AMOUNT)


def _unsigned_operation(
    operation: Mapping[str, Any], *, allow_zero_object_id: bool = False
) -> dict[str, Any]:
    if not isinstance(operation, Mapping):
        raise SchemaError("operation must be an object")
    op = dict(operation)
    op.pop("proofs", None)
    kind = _string(op.get("kind"), "$.kind", 16)
    expected = _OP_FIELDS.get(kind)
    if expected is None:
        raise SchemaError("unsupported operation kind")
    _exact(op, expected - {"proofs"}, "$unsigned")
    _common_values(op, allow_zero_object_id=allow_zero_object_id)
    if kind == "TRANSFER":
        _transfer_unsigned(op)
    elif kind in {"ROTATE", "RECOVER"}:
        _hex32(op["new_key"], "$.new_key", False)
    return op


def operation_id(operation: Mapping[str, Any]) -> str:
    """Content-address a complete unsigned operation.

    Proofs are excluded and the object-id slot is replaced with the reserved
    zero value before canonical domain-separated hashing. This removes caller
    control over accepted event identifiers without creating a hash/signature
    cycle.
    """

    if not isinstance(operation, Mapping):
        raise SchemaError("operation must be an object")
    subject = dict(operation)
    subject.pop("proofs", None)
    subject["object_id"] = ZERO_HEAD
    unsigned = _unsigned_operation(subject, allow_zero_object_id=True)
    return _hash(_EVENT_ID_DOMAIN, unsigned)


def signature_message(
    operation: Mapping[str, Any],
    role: str,
    *,
    key: str,
    outpoint: str | None = None,
) -> bytes:
    """Build the exact domain-separated byte message for an operation proof."""

    if role not in _SIGN_DOMAINS:
        raise SchemaError("unknown signature role")
    unsigned = _unsigned_operation(operation)
    key = _hex32(key, "signature.key", False)
    context: dict[str, Any] = {
        "controller": unsigned["controller"],
        "controller_epoch": unsigned["controller_epoch"],
        "controller_head": unsigned["controller_head"],
        "key": key,
        "operation": unsigned,
        "predecessor": unsigned["predecessor"],
        "role": role,
    }
    if role == "TRANSFER_ACTIVE":
        if outpoint is None:
            raise SchemaError("transfer proof requires an outpoint")
        outpoint = _hex32(outpoint, "signature.outpoint")
        if outpoint not in unsigned["inputs"]:
            raise SchemaError("signed outpoint is not an operation input")
        context["outpoint"] = outpoint
        context["input_index"] = str(unsigned["inputs"].index(outpoint))
    elif outpoint is not None:
        raise SchemaError("non-transfer proof cannot name an outpoint")
    return _frame(_SIGN_DOMAINS[role], canonical_json(context))


def _proof(value: Any, path: str, with_outpoint: bool = False) -> dict[str, Any]:
    fields = {"key", "signature"} | ({"outpoint"} if with_outpoint else set())
    value = _exact(value, fields, path)
    _hex32(value["key"], f"{path}.key", False)
    _signature(value["signature"], f"{path}.signature")
    if with_outpoint:
        _hex32(value["outpoint"], f"{path}.outpoint")
    return value


def _full_operation(op: dict[str, Any]) -> None:
    kind = _string(op.get("kind"), "$.kind", 16)
    expected = _OP_FIELDS.get(kind)
    if expected is None:
        raise SchemaError("unsupported operation kind")
    _exact(op, expected, "$")
    _common_values(op)
    if kind == "TRANSFER":
        _transfer_unsigned(op)
        proofs = _array(op["proofs"], 1, MAX_INPUTS, "$.proofs")
        for index, item in enumerate(proofs):
            _proof(item, f"$.proofs[{index}]", True)
        if [item["outpoint"] for item in proofs] != op["inputs"]:
            raise SchemaError("transfer proofs must exactly follow the sorted inputs")
    elif kind == "ROTATE":
        _hex32(op["new_key"], "$.new_key", False)
        proofs = _exact(op["proofs"], {"active", "guardian", "new_key"}, "$.proofs")
        _proof(proofs["active"], "$.proofs.active")
        _proof(proofs["guardian"], "$.proofs.guardian")
        _proof(proofs["new_key"], "$.proofs.new_key")
    elif kind == "RECOVER":
        _hex32(op["new_key"], "$.new_key", False)
        proofs = _exact(op["proofs"], {"guardians", "new_key"}, "$.proofs")
        guardians = _array(proofs["guardians"], 2, 2, "$.proofs.guardians")
        for index, item in enumerate(guardians):
            _proof(item, f"$.proofs.guardians[{index}]")
        keys = [item["key"] for item in guardians]
        if keys != sorted(keys):
            raise SchemaError("guardian proofs must be sorted by raw key")
        _proof(proofs["new_key"], "$.proofs.new_key")
    else:
        proofs = _exact(op["proofs"], {"guardians"}, "$.proofs")
        guardians = _array(proofs["guardians"], 2, 2, "$.proofs.guardians")
        for index, item in enumerate(guardians):
            _proof(item, f"$.proofs.guardians[{index}]")
        keys = [item["key"] for item in guardians]
        if keys != sorted(keys):
            raise SchemaError("guardian proofs must be sorted by raw key")


def _openssl_verify(public_key_hex: str, signature_hex: str, message: bytes) -> None:
    """Verify a raw Ed25519 public key using OpenSSL and fail closed."""

    public_der = bytes.fromhex("302a300506032b6570032100") + bytes.fromhex(public_key_hex)
    signature = bytes.fromhex(signature_hex)
    try:
        with tempfile.TemporaryDirectory(prefix="nexus-r016-ed25519-") as temp:
            directory = Path(temp)
            key_path = directory / "public.der"
            message_path = directory / "message.bin"
            signature_path = directory / "signature.bin"
            key_path.write_bytes(public_der)
            message_path.write_bytes(message)
            signature_path.write_bytes(signature)
            completed = subprocess.run(
                [
                    "openssl",
                    "pkeyutl",
                    "-verify",
                    "-pubin",
                    "-inkey",
                    str(key_path),
                    "-keyform",
                    "DER",
                    "-rawin",
                    "-in",
                    str(message_path),
                    "-sigfile",
                    str(signature_path),
                ],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=10,
                check=False,
            )
    except (FileNotFoundError, PermissionError, subprocess.TimeoutExpired, OSError) as exc:
        raise VerificationUnavailableError(
            "OpenSSL Ed25519 verification is unavailable"
        ) from exc
    if completed.returncode != 0:
        raise InvalidSignatureError("Ed25519 signature verification failed")


def _controller_dict(controller: _Controller) -> dict[str, Any]:
    return {
        "active_key": controller.active_key,
        "controller": controller.controller,
        "epoch": str(controller.epoch),
        "head": controller.head,
        "recovery_policy_hash": recovery_policy_hash(
            controller.controller, controller.recovery_keys
        ),
        "recovery_keys": list(controller.recovery_keys),
        "recovery_threshold": RECOVERY_THRESHOLD,
        "retired_keys": sorted(controller.retired_keys),
        "status": controller.status,
    }


def _utxo_dict(utxo: _Utxo) -> dict[str, str]:
    return {
        "amount": str(utxo.amount),
        "controller": utxo.controller,
        "outpoint": utxo.outpoint,
    }


def _snapshot(
    controllers: Mapping[str, _Controller],
    utxos: Mapping[str, _Utxo],
    height: int,
    last_object_id: str,
) -> dict[str, Any]:
    return {
        "controllers": [
            _controller_dict(controllers[key]) for key in sorted(controllers)
        ],
        "height": str(height),
        "last_object_id": last_object_id,
        "network": NETWORK,
        "profile": PROFILE,
        "status_authority": STATUS_AUTHORITY,
        "utxos": [_utxo_dict(utxos[key]) for key in sorted(utxos)],
        "version": PROTOCOL_VERSION,
    }


def _snapshot_root(snapshot: dict[str, Any]) -> str:
    return _hash(_STATE_DOMAIN, snapshot)


def _validate_snapshot(snapshot: Any) -> None:
    snapshot = _exact(
        snapshot,
        {
            "controllers",
            "height",
            "last_object_id",
            "network",
            "profile",
            "status_authority",
            "utxos",
            "version",
        },
        "$.state",
    )
    if (
        snapshot["network"],
        snapshot["profile"],
        snapshot["version"],
    ) != (NETWORK, PROFILE, PROTOCOL_VERSION):
        raise NetworkMismatchError("checkpoint state targets another profile")
    _authority(snapshot["status_authority"], "$.state.status_authority")
    height = _uint(snapshot["height"], "$.state.height", False, MAX_HEIGHT)
    last_object_id = _hex32(
        snapshot["last_object_id"], "$.state.last_object_id"
    )
    if height == 0 and last_object_id != ZERO_HEAD:
        raise SchemaError("height zero requires the zero last_object_id")
    if height > 0 and last_object_id == ZERO_HEAD:
        raise SchemaError("positive height requires a nonzero last_object_id")
    items = _array(
        snapshot["controllers"], 1, MAX_CONTROLLERS, "$.state.controllers"
    )
    controller_ids: list[str] = []
    all_keys: set[str] = set()
    for index, item in enumerate(items):
        path = f"$.state.controllers[{index}]"
        item = _exact(
            item,
            {
                "active_key",
                "controller",
                "epoch",
                "head",
                "recovery_policy_hash",
                "recovery_keys",
                "recovery_threshold",
                "retired_keys",
                "status",
            },
            path,
        )
        controller_ids.append(_hex32(item["controller"], f"{path}.controller", False))
        active = _hex32(item["active_key"], f"{path}.active_key")
        _uint(item["epoch"], f"{path}.epoch", False, MAX_HEIGHT)
        _hex32(item["head"], f"{path}.head")
        if item["status"] not in {"ACTIVE", "LOCKED"}:
            raise SchemaError(f"{path}.status is invalid")
        if item["status"] == "ACTIVE" and active == ZERO_HEAD:
            raise SchemaError(f"{path} active controller has no active key")
        if item["status"] == "LOCKED" and active != ZERO_HEAD:
            raise SchemaError(f"{path} locked controller retains an active key")
        recovery = _array(item["recovery_keys"], 3, 3, f"{path}.recovery_keys")
        recovery = [
            _hex32(key, f"{path}.recovery_keys[{position}]", False)
            for position, key in enumerate(recovery)
        ]
        _sorted_unique(recovery, f"{path}.recovery_keys")
        if item["recovery_threshold"] != RECOVERY_THRESHOLD:
            raise SchemaError(f"{path}.recovery_threshold must be 2")
        policy_hash = _hex32(
            item["recovery_policy_hash"], f"{path}.recovery_policy_hash"
        )
        if policy_hash != recovery_policy_hash(item["controller"], recovery):
            raise SchemaError(f"{path}.recovery_policy_hash is invalid")
        retired = _array(
            item["retired_keys"], 0, MAX_RETIRED_KEYS, f"{path}.retired_keys"
        )
        retired = [
            _hex32(key, f"{path}.retired_keys[{position}]", False)
            for position, key in enumerate(retired)
        ]
        _sorted_unique(retired, f"{path}.retired_keys")
        local = [*recovery, *retired]
        if active != ZERO_HEAD:
            local.append(active)
        if len(set(local)) != len(local):
            raise KeyReuseError(f"{path} contains a key in multiple roles")
        if all_keys.intersection(local):
            raise KeyReuseError("checkpoint reuses a raw public key globally")
        all_keys.update(local)
    _sorted_unique(controller_ids, "$.state.controllers")

    utxos = _array(
        snapshot["utxos"], 0, MAX_GENESIS_UTXOS, "$.state.utxos"
    )
    outpoints: list[str] = []
    for index, item in enumerate(utxos):
        path = f"$.state.utxos[{index}]"
        item = _exact(item, {"amount", "controller", "outpoint"}, path)
        outpoints.append(_hex32(item["outpoint"], f"{path}.outpoint"))
        owner = _hex32(item["controller"], f"{path}.controller", False)
        if owner not in controller_ids:
            raise UnknownControllerError(f"{path} owner does not exist")
        _uint(item["amount"], f"{path}.amount", True, MAX_AMOUNT)
    _sorted_unique(outpoints, "$.state.utxos")


class Machine:
    """One deterministic R016 synthetic custody state machine."""

    def __init__(self, genesis_wire: bytes) -> None:
        genesis, _ = _decode(genesis_wire, MAX_GENESIS_BYTES)
        _exact(
            genesis,
            {
                "controllers",
                "kind",
                "network",
                "profile",
                "status_authority",
                "utxos",
                "version",
            },
            "$",
        )
        if (
            genesis["kind"],
            genesis["network"],
            genesis["profile"],
            genesis["version"],
        ) != ("GENESIS", NETWORK, PROFILE, PROTOCOL_VERSION):
            raise NetworkMismatchError("genesis targets another network/profile/version")
        _authority(genesis["status_authority"], "$.status_authority")

        controller_items = _array(
            genesis["controllers"], 1, MAX_CONTROLLERS, "$.controllers"
        )
        controllers: dict[str, _Controller] = {}
        seen_keys: set[str] = set()
        ordered_ids: list[str] = []
        for index, item in enumerate(controller_items):
            path = f"$.controllers[{index}]"
            item = _exact(
                item, {"active_key", "controller", "recovery_keys"}, path
            )
            controller_id = _hex32(
                item["controller"], f"{path}.controller", False
            )
            active = _hex32(item["active_key"], f"{path}.active_key", False)
            recovery_items = _array(
                item["recovery_keys"], 3, 3, f"{path}.recovery_keys"
            )
            recovery = tuple(
                _hex32(key, f"{path}.recovery_keys[{position}]", False)
                for position, key in enumerate(recovery_items)
            )
            _sorted_unique(recovery, f"{path}.recovery_keys")
            key_set = {active, *recovery}
            if len(key_set) != 4 or seen_keys.intersection(key_set):
                raise KeyReuseError("genesis raw public keys must be globally unique")
            if controller_id in controllers:
                raise SchemaError("duplicate genesis controller")
            controllers[controller_id] = _Controller(
                controller=controller_id,
                epoch=0,
                head=ZERO_HEAD,
                status="ACTIVE",
                active_key=active,
                recovery_keys=recovery,  # type: ignore[arg-type]
                retired_keys=[],
            )
            ordered_ids.append(controller_id)
            seen_keys.update(key_set)
        _sorted_unique(ordered_ids, "$.controllers")

        utxo_items = _array(
            genesis["utxos"], 1, MAX_GENESIS_UTXOS, "$.utxos"
        )
        utxos: dict[str, _Utxo] = {}
        ordered_outpoints: list[str] = []
        for index, item in enumerate(utxo_items):
            path = f"$.utxos[{index}]"
            item = _exact(item, {"amount", "controller", "outpoint"}, path)
            outpoint = _hex32(item["outpoint"], f"{path}.outpoint")
            owner = _hex32(item["controller"], f"{path}.controller", False)
            if owner not in controllers:
                raise UnknownControllerError("genesis UTXO owner does not exist")
            amount = _uint(item["amount"], f"{path}.amount", True, MAX_AMOUNT)
            if outpoint in utxos:
                raise OutpointCollisionError("duplicate genesis outpoint")
            utxos[outpoint] = _Utxo(outpoint, owner, amount)
            ordered_outpoints.append(outpoint)
        _sorted_unique(ordered_outpoints, "$.utxos")

        self._controllers = controllers
        self._utxos = utxos
        self._seen_keys = seen_keys
        self._seen_outpoints = set(utxos)
        self._objects: dict[str, bytes] = {}
        self._receipts: dict[str, dict[str, str]] = {}
        self._height = 0
        self._last_object_id = ZERO_HEAD
        self._root = _snapshot_root(
            _snapshot(controllers, utxos, self._height, self._last_object_id)
        )
        self._root_heights = {self._root: 0}

    @property
    def state_root(self) -> str:
        return self._root

    @property
    def height(self) -> int:
        return self._height

    @property
    def last_object_id(self) -> str:
        return self._last_object_id

    def controller(self, controller_id: str) -> dict[str, Any]:
        controller_id = _hex32(controller_id, "controller_id", False)
        try:
            return copy.deepcopy(_controller_dict(self._controllers[controller_id]))
        except KeyError as exc:
            raise UnknownControllerError("controller does not exist") from exc

    def utxos(self) -> list[dict[str, str]]:
        return copy.deepcopy(
            [_utxo_dict(self._utxos[key]) for key in sorted(self._utxos)]
        )

    def public_state(self) -> dict[str, Any]:
        return copy.deepcopy(
            _snapshot(
                self._controllers,
                self._utxos,
                self._height,
                self._last_object_id,
            )
        )

    def accepted_object(
        self, object_id: str
    ) -> tuple[bytes, dict[str, str]] | None:
        """Return immutable copies for durable exact-retry detection."""

        object_id = _hex32(object_id, "object_id", False)
        wire = self._objects.get(object_id)
        if wire is None:
            return None
        return bytes(wire), copy.deepcopy(self._receipts[object_id])

    def _live_controller(self, op: Mapping[str, Any]) -> _Controller:
        try:
            controller = self._controllers[op["controller"]]
        except KeyError as exc:
            raise UnknownControllerError("operation controller does not exist") from exc
        if controller.status != "ACTIVE":
            raise LockedControllerError("controller is permanently locked")
        declared_epoch = _uint(
            op["controller_epoch"], "$.controller_epoch", False, MAX_HEIGHT
        )
        if (
            declared_epoch != controller.epoch
            or op["controller_head"] != controller.head
        ):
            raise StaleControllerContextError(
                "controller epoch/head is not current"
            )
        return controller

    @staticmethod
    def _active_proof(controller: _Controller, proof: Mapping[str, Any]) -> None:
        key = proof["key"]
        if key != controller.active_key:
            if key in controller.retired_keys:
                raise RetiredKeyError("retired active key cannot authorize")
            raise KeyRoleError("proof key is not the current active key")

    @staticmethod
    def _guardian_proof(
        controller: _Controller, proof: Mapping[str, Any]
    ) -> None:
        key = proof["key"]
        if key not in controller.recovery_keys:
            if key in controller.retired_keys:
                raise RetiredKeyError(
                    "retired active key is not a recovery guardian"
                )
            raise KeyRoleError("proof key is not a fixed recovery guardian")

    @staticmethod
    def _two_guardians(proofs: Sequence[Mapping[str, Any]]) -> None:
        if len({item["key"] for item in proofs}) != 2:
            raise QuorumError("two distinct recovery guardians are required")

    @staticmethod
    def _verify(
        op: Mapping[str, Any],
        role: str,
        proof: Mapping[str, Any],
        outpoint: str | None = None,
    ) -> None:
        message = signature_message(
            op, role, key=proof["key"], outpoint=outpoint
        )
        _openssl_verify(proof["key"], proof["signature"], message)

    def apply(self, wire: bytes) -> dict[str, str]:
        """Validate and atomically apply exactly one serialized operation."""

        op, canonical = _decode(wire, MAX_WIRE_BYTES)
        _full_operation(op)
        object_id = op["object_id"]
        prior = self._objects.get(object_id)
        if prior is not None:
            if prior == canonical:
                return copy.deepcopy(self._receipts[object_id])
            raise ObjectIdCollisionError(
                "object_id already identifies different accepted bytes"
            )
        expected_object_id = operation_id(op)
        if object_id != expected_object_id:
            raise EventIdMismatchError(
                "object_id is not the content address of the unsigned operation"
            )
        if op["predecessor"] != self._root:
            raise StaleStateError(
                "operation does not anchor the exact live combined state root"
            )

        live = self._live_controller(op)
        controllers = copy.deepcopy(self._controllers)
        utxos = dict(self._utxos)
        seen_keys = set(self._seen_keys)
        seen_outpoints = set(self._seen_outpoints)
        staged = controllers[live.controller]

        kind = op["kind"]
        if kind == "TRANSFER":
            self._apply_transfer(op, live, utxos, seen_outpoints)
        elif kind == "ROTATE":
            self._apply_rotate(op, live, staged, seen_keys)
        elif kind == "RECOVER":
            self._apply_recover(op, live, staged, seen_keys)
        else:
            self._apply_revoke(op, live, staged)

        before_root = self._root
        new_height = self._height + 1
        after_root = _snapshot_root(
            _snapshot(controllers, utxos, new_height, object_id)
        )
        if after_root == before_root:
            raise CustodyKernelError("transition unexpectedly preserved its root")
        receipt_base = {
            "after_root": after_root,
            "before_root": before_root,
            "height": str(new_height),
            "kind": kind,
            "object_id": object_id,
            "result": "APPLIED",
            "status_authority": STATUS_AUTHORITY,
        }
        receipt = {
            **receipt_base,
            "receipt_hash": _hash(_RECEIPT_DOMAIN, receipt_base),
        }

        # The only commit point follows all validation and state derivation.
        self._controllers = controllers
        self._utxos = utxos
        self._seen_keys = seen_keys
        self._seen_outpoints = seen_outpoints
        self._height = new_height
        self._last_object_id = object_id
        self._root = after_root
        self._root_heights[after_root] = new_height
        self._objects[object_id] = canonical
        self._receipts[object_id] = copy.deepcopy(receipt)
        return copy.deepcopy(receipt)

    def _apply_transfer(
        self,
        op: Mapping[str, Any],
        live: _Controller,
        utxos: dict[str, _Utxo],
        seen_outpoints: set[str],
    ) -> None:
        input_total = 0
        for outpoint, proof in zip(op["inputs"], op["proofs"], strict=True):
            try:
                utxo = self._utxos[outpoint]
            except KeyError as exc:
                raise UnknownOutpointError(
                    "input is absent or already spent"
                ) from exc
            if utxo.controller != live.controller:
                raise OwnershipError("controller does not own every input")
            self._active_proof(live, proof)
            self._verify(op, "TRANSFER_ACTIVE", proof, outpoint)
            input_total += utxo.amount
            if input_total > MAX_AMOUNT:
                raise BoundsError("input sum exceeds maximum")

        output_total = 0
        new_outputs: list[_Utxo] = []
        for index, output in enumerate(op["outputs"]):
            recipient_id = output["controller"]
            try:
                recipient = self._controllers[recipient_id]
            except KeyError as exc:
                raise UnknownControllerError(
                    "transfer recipient does not exist"
                ) from exc
            if recipient.status != "ACTIVE":
                raise LockedControllerError("transfer recipient is locked")
            amount = _uint(
                output["amount"],
                f"$.outputs[{index}].amount",
                True,
                MAX_AMOUNT,
            )
            output_total += amount
            if output_total > MAX_AMOUNT:
                raise BoundsError("output sum exceeds maximum")
            outpoint = derive_outpoint(op["object_id"], index)
            if outpoint in seen_outpoints:
                raise OutpointCollisionError(
                    "derived output identifier has already existed"
                )
            seen_outpoints.add(outpoint)
            new_outputs.append(_Utxo(outpoint, recipient_id, amount))
        if input_total != output_total:
            raise ConservationError("inputs and outputs are not conserved")

        for outpoint in op["inputs"]:
            del utxos[outpoint]
        for output in new_outputs:
            utxos[output.outpoint] = output

    def _fresh_key(self, new_key: str) -> None:
        if new_key in self._seen_keys:
            raise KeyReuseError("raw public key has appeared before")

    @staticmethod
    def _replace_key(
        staged: _Controller,
        new_key: str,
        object_id: str,
        seen_keys: set[str],
    ) -> None:
        staged.retired_keys.append(staged.active_key)
        if len(staged.retired_keys) > MAX_RETIRED_KEYS:
            raise BoundsError("retired-key history exceeds its bound")
        staged.active_key = new_key
        staged.epoch += 1
        staged.head = object_id
        seen_keys.add(new_key)

    def _apply_rotate(
        self,
        op: Mapping[str, Any],
        live: _Controller,
        staged: _Controller,
        seen_keys: set[str],
    ) -> None:
        proofs = op["proofs"]
        self._fresh_key(op["new_key"])
        self._active_proof(live, proofs["active"])
        self._guardian_proof(live, proofs["guardian"])
        if proofs["new_key"]["key"] != op["new_key"]:
            raise KeyRoleError("new-key proof does not use the declared key")
        self._verify(op, "ROTATE_ACTIVE", proofs["active"])
        self._verify(op, "ROTATE_GUARDIAN", proofs["guardian"])
        self._verify(op, "ROTATE_NEW_KEY", proofs["new_key"])
        self._replace_key(
            staged, op["new_key"], op["object_id"], seen_keys
        )

    def _apply_recover(
        self,
        op: Mapping[str, Any],
        live: _Controller,
        staged: _Controller,
        seen_keys: set[str],
    ) -> None:
        proofs = op["proofs"]
        guardians = proofs["guardians"]
        self._fresh_key(op["new_key"])
        for proof in guardians:
            self._guardian_proof(live, proof)
        self._two_guardians(guardians)
        if proofs["new_key"]["key"] != op["new_key"]:
            raise KeyRoleError("new-key proof does not use the declared key")
        for proof in guardians:
            self._verify(op, "RECOVER_GUARDIAN", proof)
        self._verify(op, "RECOVER_NEW_KEY", proofs["new_key"])
        self._replace_key(
            staged, op["new_key"], op["object_id"], seen_keys
        )

    def _apply_revoke(
        self,
        op: Mapping[str, Any],
        live: _Controller,
        staged: _Controller,
    ) -> None:
        guardians = op["proofs"]["guardians"]
        for proof in guardians:
            self._guardian_proof(live, proof)
        self._two_guardians(guardians)
        for proof in guardians:
            self._verify(op, "REVOKE_GUARDIAN", proof)
        staged.retired_keys.append(staged.active_key)
        if len(staged.retired_keys) > MAX_RETIRED_KEYS:
            raise BoundsError("retired-key history exceeds its bound")
        staged.active_key = ZERO_HEAD
        staged.status = "LOCKED"
        staged.epoch += 1
        staged.head = op["object_id"]

    def public_checkpoint(self, caller_anchor: str) -> bytes:
        """Export only public state and only at the exact live caller anchor."""

        caller_anchor = _hex32(caller_anchor, "caller_anchor")
        if caller_anchor != self._root:
            category = (
                "STALE" if caller_anchor in self._root_heights else "UNANCHORED"
            )
            raise BackupNotRestorableError(
                "checkpoint export requires the exact live caller anchor",
                category=category,
            )
        return canonical_json(
            {
                "height": str(self._height),
                "kind": "PUBLIC_CHECKPOINT",
                "network": NETWORK,
                "profile": PROFILE,
                "status_authority": STATUS_AUTHORITY,
                "state": _snapshot(
                    self._controllers,
                    self._utxos,
                    self._height,
                    self._last_object_id,
                ),
                "state_root": self._root,
                "version": PROTOCOL_VERSION,
            }
        )

    def classify_public_checkpoint(
        self, checkpoint_wire: bytes, caller_anchor: str
    ) -> BackupAssessment:
        """Classify public state without mutating or restoring the machine."""

        checkpoint, canonical = _decode(
            checkpoint_wire, MAX_CHECKPOINT_BYTES
        )
        _exact(
            checkpoint,
            {
                "height",
                "kind",
                "network",
                "profile",
                "status_authority",
                "state",
                "state_root",
                "version",
            },
            "$",
        )
        if checkpoint["kind"] != "PUBLIC_CHECKPOINT":
            raise SchemaError("checkpoint kind is invalid")
        _authority(checkpoint["status_authority"], "$.status_authority")
        if (
            checkpoint["network"],
            checkpoint["profile"],
            checkpoint["version"],
        ) != (NETWORK, PROFILE, PROTOCOL_VERSION):
            return BackupAssessment(
                "CONFLICTING",
                False,
                "checkpoint profile conflicts with this machine",
            )
        height = _uint(checkpoint["height"], "$.height", False, MAX_HEIGHT)
        checkpoint_root = _hex32(
            checkpoint["state_root"], "$.state_root"
        )
        _validate_snapshot(checkpoint["state"])
        try:
            caller_anchor = _hex32(caller_anchor, "caller_anchor")
        except CustodyKernelError:
            return BackupAssessment(
                "UNANCHORED", False, "caller anchor is not a valid root"
            )

        if height > self._height:
            return BackupAssessment(
                "AHEAD", False, "checkpoint claims a future height"
            )
        if caller_anchor != self._root:
            if caller_anchor in self._root_heights:
                return BackupAssessment(
                    "STALE", False, "caller anchor is a historical root"
                )
            return BackupAssessment(
                "UNANCHORED", False, "caller anchor is absent from history"
            )
        if checkpoint_root != caller_anchor:
            if checkpoint_root in self._root_heights or height < self._height:
                return BackupAssessment(
                    "STALE",
                    False,
                    "checkpoint does not match the live caller anchor",
                )
            if height == self._height:
                return BackupAssessment(
                    "CONFLICTING", False, "checkpoint conflicts at live height"
                )
            return BackupAssessment(
                "UNANCHORED", False, "checkpoint root has no anchor"
            )
        if height != self._height:
            return BackupAssessment(
                "CONFLICTING", False, "checkpoint height conflicts with root"
            )
        if _snapshot_root(checkpoint["state"]) != checkpoint_root:
            return BackupAssessment(
                "CONFLICTING", False, "checkpoint state does not hash to root"
            )
        expected = self.public_checkpoint(caller_anchor)
        if canonical != expected:
            return BackupAssessment(
                "CONFLICTING", False, "checkpoint is not exact live state"
            )
        return BackupAssessment(
            "RESTORABLE",
            True,
            "public checkpoint exactly matches caller anchor",
        )

    def require_restorable_public_checkpoint(
        self, checkpoint_wire: bytes, caller_anchor: str
    ) -> BackupAssessment:
        assessment = self.classify_public_checkpoint(
            checkpoint_wire, caller_anchor
        )
        if not assessment.restorable:
            raise BackupNotRestorableError(
                assessment.reason, category=assessment.classification
            )
        return assessment


__all__ = [
    "NETWORK",
    "PROFILE",
    "PROTOCOL_VERSION",
    "STATUS_AUTHORITY",
    "RECOVERY_THRESHOLD",
    "ZERO_HEAD",
    "Machine",
    "BackupAssessment",
    "CustodyKernelError",
    "WireTypeError",
    "BoundsError",
    "CanonicalEncodingError",
    "DuplicateKeyError",
    "SchemaError",
    "IntegerEncodingError",
    "NetworkMismatchError",
    "AuthorityEscalationError",
    "UnknownControllerError",
    "LockedControllerError",
    "StaleStateError",
    "StaleControllerContextError",
    "ObjectIdCollisionError",
    "EventIdMismatchError",
    "OutpointCollisionError",
    "UnknownOutpointError",
    "OwnershipError",
    "ConservationError",
    "InvalidSignatureError",
    "VerificationUnavailableError",
    "KeyRoleError",
    "RetiredKeyError",
    "KeyReuseError",
    "QuorumError",
    "BackupNotRestorableError",
    "canonical_json",
    "derive_outpoint",
    "operation_id",
    "recovery_policy_hash",
    "signature_message",
]
