from __future__ import annotations

import base64
import binascii
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from copy import deepcopy
from pathlib import Path
from typing import Any

from .util import NexusError


GENESIS_SCHEMA = "nexus.pcx-genesis/v0"
TRANSFER_SCHEMA = "nexus.pcx-transfer/v0"
RECEIPT_SCHEMA = "nexus.pcx-value-receipt/v0"
CHECKPOINT_SCHEMA = "nexus.pcx-checkpoint/v0"
REPORT_SCHEMA = "nexus.pcx-conformance-report/v0"
SUITE_SCHEMA = "nexus.pcx-conformance-suite/v0"

NETWORK_ID = "NEXUS-R013-SYNTHETIC"
UNIT_LABEL = "R013-SYNTHETIC-CLAIM"
GENESIS_SUPPLY = 1000
MAX_INPUTS = 8
MAX_OUTPUTS = 8
MAX_LIVE_UTXOS = 64
MAX_RAW_BYTES = 64 * 1024
MAX_SUITE_BYTES = 8 * 1024 * 1024
MAX_HISTORIES = 32
MAX_CASES = 256
MAX_JSON_DEPTH = 32
MAX_JSON_STRING_CHARS = 128 * 1024
PINNED_NODE_VERIFIER_SHA256 = "fd547ec4e5aa4961ec8b238ad1cd3688bd02d47273a56a4d3cb5cabe1163c52c"

# Filled only by the frozen R013 vector generator. A different genesis is a
# different system and is rejected, even if it is internally self-consistent.
PINNED_GENESIS_ID = "974cd4da89feb9f7ae8e14d7b4359f4b76d8697f55e5793219c52e38b627b7de"
ALLOWED_OWNER_KEYS = {
    "bd31dcf54d9b3255ab917685de56afd9a593c503086c9a02bc692bc40a28cdaa",
    "e213e0ad80924531679056653aabb4a6ad9937e42ecac3c5e0fe2c82c212b049",
    "0a207102823217b7e722847916ba90ffc1d249d77b7220f646fb633aacde54c7",
    "b5e14889a863987b67737e56699decaf8c62f5af1fc8e0773836a95782de4fec",
}

HASH_RE = re.compile(r"^[0-9a-f]{64}$")
SIGNATURE_RE = re.compile(r"^[0-9a-f]{128}$")
DECIMAL_RE = re.compile(r"^(0|[1-9][0-9]*)$")
ASCII_TOKEN_RE = re.compile(r"^[A-Za-z0-9._:/-]+$")

GENESIS_KEYS = {
    "schema",
    "network_id",
    "unit_label",
    "outputs",
    "status_authority",
    "genesis_id",
}
TRANSFER_KEYS = {
    "schema",
    "network_id",
    "genesis_id",
    "anchor_state_root",
    "nonce",
    "inputs",
    "outputs",
    "tx_id",
    "witnesses",
    "status_authority",
}
INPUT_KEYS = {"creating_tx_id", "output_index", "output_id"}
OUTPUT_KEYS = {"owner_public_key", "amount"}
WITNESS_KEYS = {"input_index", "owner_public_key", "signature"}


class ValueKernelError(NexusError):
    def __init__(self, code: str, detail: str) -> None:
        self.code = code
        self.detail = detail
        super().__init__(f"{code}: {detail}")


def _reject(code: str, detail: str) -> None:
    raise ValueKernelError(code, detail)


def _pairs_without_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            _reject("INVALID_JSON_DUPLICATE_KEY", f"Duplicate object key: {key}")
        result[key] = value
    return result


def strict_json(raw: bytes) -> Any:
    if raw.startswith(b"\xef\xbb\xbf"):
        _reject("INVALID_ENCODING", "UTF-8 BOM is not admitted.")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueKernelError("INVALID_ENCODING", "Input is not UTF-8.") from exc

    def reject_constant(value: str) -> None:
        _reject("INVALID_JSON_NONFINITE", f"Non-finite JSON number: {value}")

    def reject_number(value: str) -> None:
        _reject("INVALID_JSON_NUMBER", f"JSON numeric tokens are not admitted: {value[:32]}")

    try:
        return json.loads(
            text,
            object_pairs_hook=_pairs_without_duplicates,
            parse_int=reject_number,
            parse_float=reject_number,
            parse_constant=reject_constant,
        )
    except ValueKernelError:
        raise
    except json.JSONDecodeError as exc:
        raise ValueKernelError("INVALID_JSON", f"Invalid JSON: {exc.msg}") from exc
    except RecursionError as exc:
        raise ValueKernelError("JSON_DEPTH_EXCEEDED", "JSON nesting exceeds the R013 limit.") from exc


def _validate_profile_tree(value: Any, *, depth: int = 0) -> None:
    """Reject everything outside R013's bounded printable-ASCII JSON profile."""

    if depth > MAX_JSON_DEPTH:
        _reject("JSON_DEPTH_EXCEEDED", "JSON nesting exceeds the R013 limit.")
    if isinstance(value, str):
        if len(value) > MAX_JSON_STRING_CHARS:
            _reject("STRING_LIMIT_EXCEEDED", "JSON string exceeds the R013 limit.")
        if any(ord(character) < 0x20 or ord(character) > 0x7E for character in value):
            _reject("INVALID_STRING_ENCODING", "R013 admits printable ASCII strings only.")
        return
    if isinstance(value, list):
        for item in value:
            _validate_profile_tree(item, depth=depth + 1)
        return
    if isinstance(value, dict):
        for key, item in value.items():
            _validate_profile_tree(key, depth=depth + 1)
            _validate_profile_tree(item, depth=depth + 1)
        return
    _reject("SCHEMA_INVALID", "R013 admits only objects, arrays, and string scalars.")


def canonical_bytes(value: Any) -> bytes:
    """RFC 8785-compatible bytes for R013's closed ASCII/string-only schemas.

    This is deliberately not a general JCS implementation. Consensus objects
    reject arbitrary keys and every scalar field is a constrained ASCII string;
    therefore Python/ECMAScript number and UTF-16 ordering differences are
    outside the admitted language.
    """

    try:
        return json.dumps(
            value,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
            allow_nan=False,
        ).encode("utf-8")
    except (TypeError, ValueError, UnicodeEncodeError, RecursionError) as exc:
        raise ValueKernelError("SCHEMA_INVALID", f"Object is not canonicalizable: {exc}") from exc


def tagged_hash(tag: str, message: bytes) -> str:
    tag_hash = hashlib.sha256(tag.encode("ascii")).digest()
    return hashlib.sha256(tag_hash + tag_hash + message).hexdigest()


def _exact_keys(value: Any, expected: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        _reject("SCHEMA_INVALID", f"{label} must be an object.")
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing or extra:
        _reject(
            "SCHEMA_INVALID",
            f"{label} key mismatch; missing={missing}, extra={extra}.",
        )
    if any(not isinstance(key, str) or key.isascii() is False for key in value):
        _reject("SCHEMA_INVALID", f"{label} keys must be ASCII.")
    return value


def _token(value: Any, label: str) -> str:
    if not isinstance(value, str) or ASCII_TOKEN_RE.fullmatch(value) is None:
        _reject("SCHEMA_INVALID", f"{label} must be a non-empty ASCII token.")
    return value


def _hash(value: Any, label: str) -> str:
    if not isinstance(value, str) or HASH_RE.fullmatch(value) is None:
        _reject("SCHEMA_INVALID", f"{label} must be a lowercase SHA-256 digest.")
    return value


def _public_key(value: Any, label: str) -> str:
    key = _hash(value, label)
    if key not in ALLOWED_OWNER_KEYS:
        _reject("OWNER_KEY_INVALID", f"{label} is not one of the frozen synthetic owner keys.")
    return key


def _index(value: Any, label: str, *, maximum: int | None = None) -> int:
    if not isinstance(value, str) or DECIMAL_RE.fullmatch(value) is None:
        _reject("SCHEMA_INVALID", f"{label} must be a canonical unsigned decimal string.")
    if maximum is not None:
        limit = str(maximum)
        if len(value) > len(limit) or (len(value) == len(limit) and value > limit):
            _reject("SCHEMA_INVALID", f"{label} is out of range.")
    elif len(value) > 10:
        _reject("SCHEMA_INVALID", f"{label} is out of range.")
    number = int(value)
    return number


def _amount(value: Any, label: str) -> int:
    if not isinstance(value, str) or DECIMAL_RE.fullmatch(value) is None:
        _reject("INVALID_AMOUNT", f"{label} must be a canonical unsigned decimal string.")
    limit = str(GENESIS_SUPPLY)
    if value == "0" or len(value) > len(limit) or (len(value) == len(limit) and value > limit):
        _reject("INVALID_AMOUNT", f"{label} must be in 1..{GENESIS_SUPPLY}.")
    number = int(value)
    return number


def _subject_genesis(genesis: dict[str, Any]) -> dict[str, Any]:
    subject = deepcopy(genesis)
    subject["genesis_id"] = ""
    return subject


def genesis_id(genesis: dict[str, Any]) -> str:
    return tagged_hash("NEXUS/PCX/GENESIS/V0", canonical_bytes(_subject_genesis(genesis)))


def transaction_id(tx: dict[str, Any]) -> str:
    subject = {
        "schema": tx["schema"],
        "network_id": tx["network_id"],
        "genesis_id": tx["genesis_id"],
        "anchor_state_root": tx["anchor_state_root"],
        "nonce": tx["nonce"],
        "inputs": tx["inputs"],
        "outputs": tx["outputs"],
        "status_authority": tx["status_authority"],
    }
    return tagged_hash("NEXUS/PCX/TRANSACTION/V0", canonical_bytes(subject))


def transaction_hash(tx: dict[str, Any]) -> str:
    return tagged_hash("NEXUS/PCX/RETURN/V0", canonical_bytes(tx))


def output_id(creating_tx_id: str, output_index: int) -> str:
    message = bytes.fromhex(creating_tx_id) + output_index.to_bytes(4, "big")
    return tagged_hash("NEXUS/PCX/OUTPOINT/V0", message)


def signature_message(tx_id: str, input_index: int, out_id: str) -> bytes:
    message = (
        bytes.fromhex(PINNED_GENESIS_ID)
        + bytes.fromhex(tx_id)
        + input_index.to_bytes(4, "big")
        + bytes.fromhex(out_id)
    )
    return bytes.fromhex(tagged_hash("NEXUS/PCX/AUTHORIZATION/V0", message))


def state_root(utxos: dict[str, dict[str, str]]) -> str:
    records = [utxos[key] for key in sorted(utxos)]
    return tagged_hash("NEXUS/PCX/STATE/V0", canonical_bytes(records))


def _receipt_hash(receipt: dict[str, Any]) -> str:
    subject = deepcopy(receipt)
    subject["receipt_hash"] = ""
    return tagged_hash("NEXUS/PCX/DECISION/V0", canonical_bytes(subject))


def _checkpoint(
    *,
    state: dict[str, dict[str, str]],
    receipts: list[dict[str, Any]],
    initial_state_root: str,
) -> dict[str, Any]:
    current_root = state_root(state)
    checkpoint = {
        "schema": CHECKPOINT_SCHEMA,
        "network_id": NETWORK_ID,
        "genesis_id": PINNED_GENESIS_ID,
        "height": str(len(receipts)),
        "initial_state_root": initial_state_root,
        "state_root": current_root,
        "receipt_head": receipts[-1]["receipt_hash"] if receipts else "",
        "accepted_transaction_ids": [item["tx_id"] for item in receipts],
        "utxo_count": str(len(state)),
        "total_supply": str(sum(int(item["amount"]) for item in state.values())),
        "candidate_status": "CANDIDATE",
        "status_authority": "NONE",
    }
    checkpoint["checkpoint_id"] = tagged_hash(
        "NEXUS/PCX/CHECKPOINT/V0", canonical_bytes(checkpoint)
    )
    return checkpoint


def _openssl_verify(public_key: str, signature: str, message: bytes) -> bool:
    executable = shutil.which("openssl")
    if executable is None:
        raise NexusError("R013 requires the mature OpenSSL verifier; openssl was not found.")
    # RFC 8410 SubjectPublicKeyInfo prefix for a raw 32-byte Ed25519 key.
    public_der = bytes.fromhex("302a300506032b6570032100") + bytes.fromhex(public_key)
    with tempfile.TemporaryDirectory(prefix="nexus-r013-ed25519-") as tmp:
        root = Path(tmp)
        key_path = root / "public.der"
        message_path = root / "message.bin"
        signature_path = root / "signature.bin"
        key_path.write_bytes(public_der)
        message_path.write_bytes(message)
        signature_path.write_bytes(bytes.fromhex(signature))
        result = subprocess.run(
            [
                executable,
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
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
            timeout=5,
        )
    return result.returncode == 0


def _decode_raw(value: Any) -> bytes:
    if not isinstance(value, str):
        _reject("INVALID_ENCODING", "raw_b64 must be a string.")
    try:
        raw = base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueKernelError("INVALID_ENCODING", "raw_b64 is not canonical base64.") from exc
    if not raw or len(raw) > MAX_RAW_BYTES:
        _reject("INVALID_ENCODING", "Raw object is empty or exceeds its byte limit.")
    if base64.b64encode(raw).decode("ascii") != value:
        _reject("INVALID_ENCODING", "raw_b64 is not canonical base64.")
    return raw


def _validate_genesis(raw: bytes) -> tuple[dict[str, Any], dict[str, dict[str, str]], str]:
    value = strict_json(raw)
    _validate_profile_tree(value)
    if canonical_bytes(value) != raw:
        _reject("NON_CANONICAL_ENCODING", "Genesis bytes are not canonical R013 JCS-profile bytes.")
    genesis = _exact_keys(value, GENESIS_KEYS, "genesis")
    if genesis["schema"] != GENESIS_SCHEMA:
        _reject("SCHEMA_INVALID", "Unsupported genesis schema.")
    if genesis["network_id"] != NETWORK_ID or genesis["unit_label"] != UNIT_LABEL:
        _reject("GENESIS_MISMATCH", "Genesis domain or unit label is not pinned R013.")
    if genesis["status_authority"] != "NONE":
        _reject("SCHEMA_INVALID", "Genesis status_authority must be NONE.")
    supplied_id = _hash(genesis["genesis_id"], "genesis_id")
    computed_id = genesis_id(genesis)
    if supplied_id != computed_id or supplied_id != PINNED_GENESIS_ID:
        _reject("GENESIS_MISMATCH", "Genesis identity is not the frozen R013 genesis.")
    outputs = genesis["outputs"]
    if not isinstance(outputs, list) or not 1 <= len(outputs) <= MAX_OUTPUTS:
        _reject("SCHEMA_INVALID", "Genesis outputs are outside their bounds.")
    state: dict[str, dict[str, str]] = {}
    total = 0
    for index, raw_output in enumerate(outputs):
        output = _exact_keys(raw_output, OUTPUT_KEYS, f"genesis output {index}")
        owner = _public_key(output["owner_public_key"], f"genesis output {index} owner")
        amount = _amount(output["amount"], f"genesis output {index} amount")
        total += amount
        out_id = output_id(supplied_id, index)
        state[out_id] = {
            "output_id": out_id,
            "creating_tx_id": supplied_id,
            "output_index": str(index),
            "owner_public_key": owner,
            "amount": str(amount),
        }
    if total != GENESIS_SUPPLY:
        _reject("CONSERVATION_VIOLATION", "Genesis supply does not equal the frozen supply.")
    return genesis, state, state_root(state)


def _validate_transfer_shape(raw: bytes) -> dict[str, Any]:
    value = strict_json(raw)
    _validate_profile_tree(value)
    if canonical_bytes(value) != raw:
        _reject("NON_CANONICAL_ENCODING", "Transfer bytes are not canonical R013 JCS-profile bytes.")
    tx = _exact_keys(value, TRANSFER_KEYS, "transfer")
    if tx["schema"] != TRANSFER_SCHEMA:
        _reject("SCHEMA_INVALID", "Unsupported transfer schema.")
    if tx["network_id"] != NETWORK_ID:
        _reject("DOMAIN_MISMATCH", "Transfer network is not the pinned R013 domain.")
    if tx["genesis_id"] != PINNED_GENESIS_ID:
        _reject("GENESIS_MISMATCH", "Transfer is bound to another genesis.")
    if tx["status_authority"] != "NONE":
        _reject("SCHEMA_INVALID", "Transfer status_authority must be NONE.")
    _hash(tx["anchor_state_root"], "anchor_state_root")
    _hash(tx["nonce"], "nonce")
    _hash(tx["tx_id"], "tx_id")

    inputs = tx["inputs"]
    outputs = tx["outputs"]
    witnesses = tx["witnesses"]
    if not isinstance(inputs, list) or not 1 <= len(inputs) <= MAX_INPUTS:
        _reject("SCHEMA_INVALID", "Transfer inputs are outside their bounds.")
    if not isinstance(outputs, list) or not 1 <= len(outputs) <= MAX_OUTPUTS:
        _reject("SCHEMA_INVALID", "Transfer outputs are outside their bounds.")
    if not isinstance(witnesses, list) or len(witnesses) != len(inputs):
        _reject("AUTHORIZATION_SET_INVALID", "There must be one witness per input.")

    order: list[tuple[str, int]] = []
    for index, raw_input in enumerate(inputs):
        item = _exact_keys(raw_input, INPUT_KEYS, f"input {index}")
        creating = _hash(item["creating_tx_id"], f"input {index} creating_tx_id")
        output_index = _index(item["output_index"], f"input {index} output_index", maximum=MAX_OUTPUTS - 1)
        _hash(item["output_id"], f"input {index} output_id")
        order.append((creating, output_index))
    if order != sorted(order):
        _reject("INPUT_ORDER_INVALID", "Inputs are not in canonical outpoint order.")
    if len(order) != len(set(order)):
        _reject("DUPLICATE_INPUT", "Transfer repeats an input outpoint.")

    for index, raw_output in enumerate(outputs):
        output = _exact_keys(raw_output, OUTPUT_KEYS, f"output {index}")
        _public_key(output["owner_public_key"], f"output {index} owner_public_key")
        _amount(output["amount"], f"output {index} amount")

    for index, raw_witness in enumerate(witnesses):
        witness = _exact_keys(raw_witness, WITNESS_KEYS, f"witness {index}")
        if _index(witness["input_index"], f"witness {index} input_index", maximum=MAX_INPUTS - 1) != index:
            _reject("AUTHORIZATION_SET_INVALID", "Witnesses are not complete and canonically ordered.")
        _public_key(witness["owner_public_key"], f"witness {index} owner_public_key")
        if not isinstance(witness["signature"], str) or SIGNATURE_RE.fullmatch(witness["signature"]) is None:
            _reject("SIGNATURE_INVALID", f"Witness {index} signature is not 64-byte lowercase hex.")

    expected_id = transaction_id(tx)
    if tx["tx_id"] != expected_id:
        _reject("TRANSACTION_ID_MISMATCH", "Transfer transaction_id does not match its unsigned fields.")
    return tx


class _History:
    def __init__(self, state: dict[str, dict[str, str]], initial_root: str) -> None:
        self.state = deepcopy(state)
        self.initial_root = initial_root
        self.receipts: list[dict[str, Any]] = []
        self.accepted: dict[str, tuple[str, dict[str, Any]]] = {}

    def _case_result(
        self,
        *,
        case_id: str,
        raw_sha256: str,
        tx_id: str,
        decision: str,
        reason_code: str,
        prior_root: str,
        idempotent: bool = False,
        receipt_hash: str = "",
    ) -> dict[str, Any]:
        return {
            "case_id": case_id,
            "raw_sha256": raw_sha256,
            "tx_id": tx_id,
            "decision": decision,
            "reason_code": reason_code,
            "idempotent": "TRUE" if idempotent else "FALSE",
            "previous_state_root": prior_root,
            "next_state_root": state_root(self.state),
            "total_supply": str(sum(int(item["amount"]) for item in self.state.values())),
            "receipt_hash": receipt_hash,
        }

    def apply(self, case_id: str, raw: bytes) -> dict[str, Any]:
        prior_root = state_root(self.state)
        raw_sha256 = hashlib.sha256(raw).hexdigest()
        tx_id_hint = ""
        try:
            tx = _validate_transfer_shape(raw)
            tx_id_hint = tx["tx_id"]
            tx_hash = transaction_hash(tx)

            existing = self.accepted.get(tx_id_hint)
            if existing is not None:
                prior_hash, receipt = existing
                if prior_hash == tx_hash:
                    return self._case_result(
                        case_id=case_id,
                        raw_sha256=raw_sha256,
                        tx_id=tx_id_hint,
                        decision="CANDIDATE_ACCEPTED",
                        reason_code="EXACT_REPLAY",
                        prior_root=prior_root,
                        idempotent=True,
                        receipt_hash=receipt["receipt_hash"],
                    )
                _reject("TRANSACTION_ID_COLLISION", "Accepted transaction ID was reused with another envelope.")

            if tx["anchor_state_root"] != prior_root:
                _reject("PREDECESSOR_STATE_MISMATCH", "Transfer is not anchored to the current state root.")

            resolved: list[dict[str, str]] = []
            for index, item in enumerate(tx["inputs"]):
                out_id = item["output_id"]
                record = self.state.get(out_id)
                if record is None:
                    _reject("INPUT_NOT_UNSPENT", f"Input {index} is absent or already spent.")
                if (
                    record["creating_tx_id"] != item["creating_tx_id"]
                    or record["output_index"] != item["output_index"]
                    or output_id(item["creating_tx_id"], int(item["output_index"])) != out_id
                ):
                    _reject("CREATION_BINDING_MISMATCH", f"Input {index} does not match its creating transaction.")
                resolved.append(record)

            input_total = sum(int(item["amount"]) for item in resolved)
            output_total = sum(_amount(item["amount"], "output amount") for item in tx["outputs"])
            if input_total != output_total:
                _reject("CONSERVATION_VIOLATION", "Input and output quantities differ.")

            for index, (record, witness) in enumerate(zip(resolved, tx["witnesses"], strict=True)):
                if witness["owner_public_key"] != record["owner_public_key"]:
                    _reject("OWNER_KEY_MISMATCH", f"Witness {index} is not the prior output owner.")
                message = signature_message(tx_id_hint, index, record["output_id"])
                if not _openssl_verify(witness["owner_public_key"], witness["signature"], message):
                    _reject("SIGNATURE_INVALID", f"Witness {index} signature failed strict Ed25519 verification.")

            next_state = deepcopy(self.state)
            for record in resolved:
                del next_state[record["output_id"]]
            created: list[str] = []
            for index, output in enumerate(tx["outputs"]):
                out_id = output_id(tx_id_hint, index)
                if out_id in next_state:
                    _reject("OUTPUT_COLLISION", "Derived output ID already exists.")
                next_state[out_id] = {
                    "output_id": out_id,
                    "creating_tx_id": tx_id_hint,
                    "output_index": str(index),
                    "owner_public_key": output["owner_public_key"],
                    "amount": output["amount"],
                }
                created.append(out_id)
            if len(next_state) > MAX_LIVE_UTXOS:
                _reject(
                    "UTXO_LIMIT_EXCEEDED",
                    f"A candidate state may contain at most {MAX_LIVE_UTXOS} live outputs.",
                )
            next_root = state_root(next_state)
            if sum(int(item["amount"]) for item in next_state.values()) != GENESIS_SUPPLY:
                _reject("CONSERVATION_VIOLATION", "Post-state supply differs from genesis supply.")

            receipt = {
                "schema": RECEIPT_SCHEMA,
                "sequence": str(len(self.receipts) + 1),
                "network_id": NETWORK_ID,
                "genesis_id": PINNED_GENESIS_ID,
                "tx_id": tx_id_hint,
                "tx_hash": tx_hash,
                "decision": "CANDIDATE_ACCEPTED",
                "reason_code": "VALID_CONSERVED_TRANSFER",
                "spent_output_ids": [item["output_id"] for item in resolved],
                "created_output_ids": created,
                "previous_state_root": prior_root,
                "next_state_root": next_root,
                "previous_receipt_hash": self.receipts[-1]["receipt_hash"] if self.receipts else "",
                "status_authority": "NONE",
                "receipt_hash": "",
            }
            receipt["receipt_hash"] = _receipt_hash(receipt)
            self.state = next_state
            self.receipts.append(receipt)
            self.accepted[tx_id_hint] = (tx_hash, receipt)
            return self._case_result(
                case_id=case_id,
                raw_sha256=raw_sha256,
                tx_id=tx_id_hint,
                decision="CANDIDATE_ACCEPTED",
                reason_code="VALID_CONSERVED_TRANSFER",
                prior_root=prior_root,
                receipt_hash=receipt["receipt_hash"],
            )
        except ValueKernelError as exc:
            return self._case_result(
                case_id=case_id,
                raw_sha256=raw_sha256,
                tx_id=tx_id_hint,
                decision="REJECTED",
                reason_code=exc.code,
                prior_root=prior_root,
            )


def verify_suite(path: Path) -> dict[str, Any]:
    if not path.is_file() or path.stat().st_size > MAX_SUITE_BYTES:
        raise NexusError(f"R013 suite is missing or exceeds its size limit: {path}")
    suite = strict_json(path.read_bytes())
    _validate_profile_tree(suite)
    _exact_keys(suite, {"schema", "suite_id", "genesis_b64", "histories", "status_authority"}, "suite")
    if suite["schema"] != SUITE_SCHEMA or suite["status_authority"] != "NONE":
        raise NexusError("Unsupported or authoritative R013 conformance suite.")
    suite_id = _token(suite["suite_id"], "suite_id")
    genesis_raw = _decode_raw(suite["genesis_b64"])
    genesis, initial_state, initial_root = _validate_genesis(genesis_raw)
    histories = suite["histories"]
    if not isinstance(histories, list) or not 1 <= len(histories) <= MAX_HISTORIES:
        raise NexusError("R013 histories are outside their bounds.")
    reports: list[dict[str, Any]] = []
    seen_history_ids: set[str] = set()
    for raw_history in histories:
        history = _exact_keys(raw_history, {"history_id", "cases"}, "history")
        history_id = _token(history["history_id"], "history_id")
        if history_id in seen_history_ids:
            raise NexusError(f"Duplicate R013 history_id: {history_id}")
        seen_history_ids.add(history_id)
        cases = history["cases"]
        if not isinstance(cases, list) or not 1 <= len(cases) <= MAX_CASES:
            raise NexusError(f"R013 history {history_id} cases are outside their bounds.")
        machine = _History(initial_state, initial_root)
        case_reports: list[dict[str, Any]] = []
        seen_case_ids: set[str] = set()
        for raw_case in cases:
            case = _exact_keys(raw_case, {"case_id", "raw_b64"}, "case")
            case_id = _token(case["case_id"], "case_id")
            if case_id in seen_case_ids:
                raise NexusError(f"Duplicate R013 case_id in {history_id}: {case_id}")
            seen_case_ids.add(case_id)
            try:
                raw = _decode_raw(case["raw_b64"])
            except ValueKernelError as exc:
                prior = state_root(machine.state)
                case_reports.append(
                    machine._case_result(
                        case_id=case_id,
                        raw_sha256="",
                        tx_id="",
                        decision="REJECTED",
                        reason_code=exc.code,
                        prior_root=prior,
                    )
                )
                continue
            case_reports.append(machine.apply(case_id, raw))
        reports.append(
            {
                "history_id": history_id,
                "cases": case_reports,
                "checkpoint": _checkpoint(
                    state=machine.state,
                    receipts=machine.receipts,
                    initial_state_root=initial_root,
                ),
            }
        )
    return {
        "schema": REPORT_SCHEMA,
        "suite_id": suite_id,
        "genesis_id": genesis["genesis_id"],
        "genesis_raw_sha256": hashlib.sha256(genesis_raw).hexdigest(),
        "initial_state_root": initial_root,
        "histories": reports,
        "status_authority": "NONE",
    }


def report_bytes(report: dict[str, Any]) -> bytes:
    return canonical_bytes(report) + b"\n"


def r013_evidence_paths(repo_root: Path) -> dict[str, Path]:
    experiment = repo_root / "experiments" / "R013_PCX_CONSERVED_CLAIM"
    receipts = repo_root / "operations" / "receipts" / "R013_PCX_CONSERVED_CLAIM"
    proposal = repo_root / "operations" / "proposals" / "R013_PCX_CONSERVED_CLAIM"
    schemas = repo_root / "constitution" / "schemas"
    return {
        "suite": experiment / "fixtures" / "SUITE.json",
        "expected_report": experiment / "fixtures" / "EXPECTED_REPORT.json",
        "node_verifier": experiment / "independent_verifier.mjs",
        "vector_generator": experiment / "generate_vectors.mjs",
        "small_model": experiment / "exhaustive_model.py",
        "convergence_report": receipts / "CONVERGENCE_REPORT.json",
        "demo_report": receipts / "DEMO_REPORT.json",
        "model_report": receipts / "MODEL_CHECK_REPORT.json",
        "proposal_status": proposal / "STATUS.proposal.json",
        "genesis_schema": schemas / "pcx-genesis.schema.json",
        "transfer_schema": schemas / "pcx-transfer.schema.json",
        "receipt_schema": schemas / "pcx-value-receipt.schema.json",
        "checkpoint_schema": schemas / "pcx-checkpoint.schema.json",
    }


def require_r013_evidence_files(repo_root: Path) -> dict[str, Path]:
    paths = r013_evidence_paths(repo_root)
    missing = [str(path.relative_to(repo_root)) for path in paths.values() if not path.is_file()]
    if missing:
        raise NexusError("Declared R013 evidence is incomplete: " + ", ".join(missing))
    return paths


def validate_r013_saved_evidence(
    *,
    expected_bytes: bytes,
    saved_convergence: Any,
    check: dict[str, Any],
) -> dict[str, Any]:
    if (
        not isinstance(saved_convergence, dict)
        or saved_convergence != check
        or saved_convergence.get("status_authority") != "NONE"
    ):
        raise NexusError("Frozen R013 convergence report does not reproduce exactly.")
    if hashlib.sha256(expected_bytes).hexdigest() != check["report_sha256"]:
        raise NexusError("Frozen R013 expected report does not match the reproduced report.")
    try:
        expected = json.loads(expected_bytes)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise NexusError("Frozen R013 expected report is not valid UTF-8 JSON.") from exc
    if (
        expected.get("schema") != REPORT_SCHEMA
        or expected.get("suite_id") != check["suite_id"]
        or expected.get("genesis_id") != PINNED_GENESIS_ID
        or expected.get("status_authority") != "NONE"
    ):
        raise NexusError("Frozen R013 expected report identity or authority is invalid.")
    return expected


def validate_r013_claim_bindings(
    *,
    demo: Any,
    proposal_status: Any,
    check: dict[str, Any],
    suite_sha256: str,
    model_report: Any,
    model_report_sha256: str,
) -> None:
    expected_proposal = {
        "schema": "nexus.proposal-status/v1",
        "round": "R013",
        "mode": "R013_PCX_CONSERVED_CLAIM_REVIEW_READY",
        "disposition": "DEMONSTRATED_CONSERVATION_KERNEL_ON_SYNTHETIC_HISTORY",
        "canonical_status": "UNPROMOTED_STACKED_PROPOSAL",
        "base_head": "f28dc07bf1433bb22e4d992a7f523503387ea445",
        "status_authority": "NONE",
        "next_action": "USER_REVIEW_R012_AND_R013_WITH_SEPARATE_PROMOTION_DECISIONS",
    }
    if proposal_status != expected_proposal:
        raise NexusError("R013 proposal status is not the exact unpromoted review disposition.")
    if not isinstance(model_report, dict) or model_report.get("status_authority") != "NONE":
        raise NexusError("R013 bounded-model report is missing or claims authority.")
    expected_fixture = {
        "suite_id": check["suite_id"],
        "suite_path": "experiments/R013_PCX_CONSERVED_CLAIM/fixtures/SUITE.json",
        "suite_sha256": suite_sha256,
        "genesis_id": PINNED_GENESIS_ID,
        "fixed_supply": str(GENESIS_SUPPLY),
        "unit_label": UNIT_LABEL,
    }
    expected_convergence = {
        "report_sha256": check["report_sha256"],
        "implementations": [
            "PYTHON_ORCHESTRATION_WITH_OPENSSL_ED25519",
            "JAVASCRIPT_STATE_MACHINE_WITH_NOBLE_ED25519",
        ],
        "vector_signer": "NODE_NATIVE_ED25519",
        "independent_verifier_sha256": check["independent_verifier_sha256"],
        "byte_identical": True,
        "histories": check["history_count"],
        "accepted_transfers": check["accepted_transfer_count"],
        "rejected_attacks": check["rejected_attack_count"],
    }
    expected_model = {
        "report_path": "operations/receipts/R013_PCX_CONSERVED_CLAIM/MODEL_CHECK_REPORT.json",
        "report_sha256": model_report_sha256,
        "supply": model_report.get("parameters", {}).get("supply"),
        "max_depth": model_report.get("parameters", {}).get("max_depth"),
        "unique_states": model_report.get("unique_states_through_depth"),
        "valid_transitions": model_report.get("valid_transitions_checked"),
        "replay_rejections": model_report.get("replay_rejections"),
        "transition_digest": model_report.get("transition_digest"),
        "claim_scope": model_report.get("claim_scope"),
    }
    expected_demonstrated = [
        "The frozen synthetic quantity remained exactly 1000 after every accepted prefix.",
        "Split, merge, multi-owner and creating-transaction ancestry transitions were accepted under full-field Ed25519 authorization.",
        "The exact same two signed sibling spends were replayed in both orders; only the first candidate in each local order was accepted.",
        "Malformed, ambiguous, hostile-Unicode, oversized, stale, foreign, inflationary, forged-ancestry and signature-mutated candidates left state unchanged.",
        "The candidate state reached 64 live outputs and rejected further growth without changing state.",
        "Separate parsers and transition kernels emitted byte-identical decisions, receipt hashes and candidate checkpoint roots.",
        "A bounded abstract model exhaustively checked 115266 conserved transitions through depth four.",
    ]
    expected_non_claims = [
        "The synthetic claim is not money, a token, legal property, a security, a currency, a redeemable promise or an economically valuable asset.",
        "No work return, AI judgment, receipt, decision or checkpoint can mint quantity.",
        "This does not establish safe custody, key recovery, privacy, network consensus, global double-spend prevention, liveness, decentralization, Sybil resistance, market demand, purchasing-power preservation or regulatory compliance.",
        "Cross-implementation convergence on a frozen suite and a bounded abstract model are not an independent security audit or proof of general correctness.",
        "Checkpoint import, durable persistence, crash recovery, atomic external settlement and concurrent writers are not implemented or demonstrated.",
        "Every checkpoint remains CANDIDATE with status_authority NONE; only the user may promote canonical project state.",
    ]
    if not isinstance(demo, dict) or set(demo) != {
        "schema",
        "status",
        "status_authority",
        "dependency",
        "fixture",
        "convergence",
        "small_model",
        "demonstrated",
        "non_claims",
    }:
        raise NexusError("R013 demo report shape is invalid.")
    if (
        demo["schema"] != "nexus.r013-pcx-conserved-claim-demo/v0"
        or demo["status"] != "DEMONSTRATED_CONSERVATION_KERNEL_ON_SYNTHETIC_HISTORY"
        or demo["status_authority"] != "NONE"
        or demo["dependency"]
        != {
            "r012_branch_head": "f28dc07bf1433bb22e4d992a7f523503387ea445",
            "canonical_status": "UNPROMOTED_PROPOSAL_DEPENDENCY",
        }
        or demo["fixture"] != expected_fixture
        or demo["convergence"] != expected_convergence
        or demo["small_model"] != expected_model
        or demo["demonstrated"] != expected_demonstrated
        or demo["non_claims"] != expected_non_claims
    ):
        raise NexusError("R013 demo claims do not match the exact reproduced evidence.")


def verify_cross_implementation(
    suite_path: Path,
    *,
    node_verifier: Path,
    repo_root: Path,
) -> dict[str, Any]:
    expected_verifier = (
        repo_root
        / "experiments"
        / "R013_PCX_CONSERVED_CLAIM"
        / "independent_verifier.mjs"
    ).resolve()
    if node_verifier.resolve() != expected_verifier:
        raise NexusError("R013 convergence is restricted to the frozen independent verifier path.")
    verifier_bytes = expected_verifier.read_bytes()
    verifier_sha256 = hashlib.sha256(verifier_bytes).hexdigest()
    if verifier_sha256 != PINNED_NODE_VERIFIER_SHA256:
        raise NexusError("R013 independent verifier hash does not match the reviewed implementation.")
    python_report = verify_suite(suite_path)
    python_bytes = report_bytes(python_report)
    node = shutil.which("node")
    if node is None:
        raise NexusError("R013 convergence requires Node.js 20 or later.")
    result = subprocess.run(
        [node, str(node_verifier), str(suite_path)],
        cwd=repo_root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=30,
    )
    if result.returncode != 0:
        detail = result.stderr.decode("utf-8", errors="replace").strip()
        raise NexusError(f"Independent R013 verifier failed: {detail}")
    node_bytes = result.stdout
    if node_bytes != python_bytes:
        raise NexusError(
            "R013 cross-implementation mismatch: Python/OpenSSL and JavaScript/Noble reports differ."
        )
    accepted = sum(
        1
        for history in python_report["histories"]
        for case in history["cases"]
        if case["reason_code"] == "VALID_CONSERVED_TRANSFER"
    )
    rejected = sum(
        1
        for history in python_report["histories"]
        for case in history["cases"]
        if case["decision"] == "REJECTED"
    )
    return {
        "schema": "nexus.pcx-cross-implementation-check/v0",
        "status": "PASS",
        "suite_id": python_report["suite_id"],
        "report_sha256": hashlib.sha256(python_bytes).hexdigest(),
        "byte_identical": True,
        "history_count": len(python_report["histories"]),
        "accepted_transfer_count": accepted,
        "rejected_attack_count": rejected,
        "independent_verifier_sha256": verifier_sha256,
        "crypto_implementations": ["OPENSSL_ED25519", "NOBLE_ED25519"],
        "status_authority": "NONE",
        "claims": [
            "The two frozen implementations emitted byte-identical decisions and candidate roots for the frozen suite."
        ],
        "non_claims": [
            "This is synthetic local conformance, not money, economic value, custody, consensus, global finality, or an external security audit."
        ],
    }
