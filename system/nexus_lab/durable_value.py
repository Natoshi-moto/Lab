from __future__ import annotations

import base64
import binascii
import fcntl
import hashlib
import json
import os
import re
import secrets
import shutil
import stat
import subprocess
from contextlib import contextmanager
from copy import deepcopy
from pathlib import Path
from typing import Any, Iterator

from .util import NexusError, canonical_json_bytes
from .value_kernel import (
    GENESIS_SUPPLY,
    MAX_RAW_BYTES,
    PINNED_GENESIS_ID,
    PINNED_NODE_VERIFIER_SHA256,
    _History,
    _checkpoint,
    _decode_raw,
    _exact_keys,
    _validate_genesis,
    _validate_profile_tree,
    canonical_bytes,
    strict_json,
    tagged_hash,
)


RECORD_SCHEMA = "nexus.pcx-durable-record/v0"
COMMIT_RESULT_SCHEMA = "nexus.pcx-durable-commit-result/v0"
RECOVERY_REPORT_SCHEMA = "nexus.pcx-durable-recovery/v0"
INDEPENDENT_REPORT_SCHEMA = "nexus.pcx-durable-independent-verification/v0"
SUITE_SCHEMA = "nexus.pcx-conformance-suite/v0"

GENESIS_FILE = "GENESIS.pcx"
LOCK_FILE = "LOCK"
RECORD_DIRECTORY = "records"
MAX_RECORDS = 256
MAX_PENDING_RECORDS = 32
MAX_RECORD_BYTES = 256 * 1024
MAX_LEDGER_BYTES = 6 * 1024 * 1024

RECORD_NAME_RE = re.compile(r"^(?P<sequence>[0-9]{8})-(?P<hash>[0-9a-f]{64})\.pcx$")
PENDING_NAME_RE = re.compile(r"^\.pending-[0-9]+-[0-9a-f]{32}$")
PINNED_R014_NODE_VERIFIER_SHA256 = "dee500baebf90651656a50e31c43d29f936f4e62ecaeaa6a31bb0dd1d3d0cc11"

RECORD_KEYS = {
    "schema",
    "sequence",
    "previous_record_hash",
    "transaction_raw_b64",
    "transaction_sha256",
    "tx_id",
    "previous_state_root",
    "next_state_root",
    "receipt",
    "checkpoint",
    "status_authority",
    "record_hash",
}


class SimulatedCrash(RuntimeError):
    """Test-only process-failure injection; never used as a protocol decision."""

    def __init__(self, stage: str) -> None:
        super().__init__(f"simulated crash at {stage}")
        self.stage = stage


def _fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _assert_plain_directory(path: Path, *, label: str) -> None:
    try:
        info = path.lstat()
    except FileNotFoundError:
        try:
            path.mkdir(mode=0o700, parents=False, exist_ok=False)
        except FileExistsError:
            # Another cooperative first writer may have created the directory
            # between lstat and mkdir. Validate that object below, then converge
            # on the same LOCK file.
            pass
        except FileNotFoundError as exc:
            raise NexusError(f"Parent directory must already exist for {label}: {path.parent}") from exc
        else:
            _fsync_directory(path.parent)
        try:
            info = path.lstat()
        except FileNotFoundError as exc:
            raise NexusError(f"{label} disappeared during creation: {path}") from exc
    if stat.S_ISLNK(info.st_mode) or not stat.S_ISDIR(info.st_mode):
        raise NexusError(f"{label} must be a real directory, not a link or special file: {path}")


def _read_plain_file(path: Path, *, maximum: int, label: str) -> bytes:
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0)
    try:
        descriptor = os.open(path, flags)
    except FileNotFoundError as exc:
        raise NexusError(f"Missing {label}: {path}") from exc
    except OSError as exc:
        raise NexusError(f"Cannot safely open {label} as a non-symlink file: {path}") from exc
    try:
        info = os.fstat(descriptor)
        if not stat.S_ISREG(info.st_mode):
            raise NexusError(f"{label} must be a regular non-symlink file: {path}")
        if info.st_size < 1 or info.st_size > maximum:
            raise NexusError(f"{label} is empty or exceeds {maximum} bytes: {path}")
        chunks: list[bytes] = []
        remaining = maximum + 1
        while remaining:
            chunk = os.read(descriptor, min(64 * 1024, remaining))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        raw = b"".join(chunks)
        if not raw or len(raw) > maximum:
            raise NexusError(f"{label} is empty or exceeds {maximum} bytes: {path}")
        return raw
    finally:
        os.close(descriptor)


def _atomic_write_once(path: Path, data: bytes) -> None:
    if path.exists() or path.is_symlink():
        raise NexusError(f"Refusing to replace an existing durable path: {path}")
    temporary = path.parent / f".pending-{os.getpid()}-{secrets.token_hex(16)}"
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(temporary, flags, 0o600)
    renamed = False
    try:
        try:
            view = memoryview(data)
            while view:
                written = os.write(descriptor, view)
                if written <= 0:
                    raise NexusError(f"Short durable write for {path}")
                view = view[written:]
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
        os.replace(temporary, path)
        renamed = True
        _fsync_directory(path.parent)
    except Exception:
        if not renamed:
            try:
                temporary.unlink()
            except FileNotFoundError:
                pass
        raise


@contextmanager
def _ledger_lock(ledger: Path, *, exclusive: bool) -> Iterator[None]:
    try:
        parent_info = ledger.parent.lstat()
    except FileNotFoundError as exc:
        raise NexusError(f"Durable ledger parent does not exist: {ledger.parent}") from exc
    if stat.S_ISLNK(parent_info.st_mode) or not stat.S_ISDIR(parent_info.st_mode):
        raise NexusError(f"Durable ledger parent must be a real directory: {ledger.parent}")
    _assert_plain_directory(ledger, label="durable ledger")
    if exclusive:
        # A competing creator may have died after mkdir but before syncing the
        # parent entry. Any writer adopting that visible ledger repairs the
        # parent-directory durability before it can acknowledge a record.
        _fsync_directory(ledger.parent)
    lock_path = ledger / LOCK_FILE
    flags = os.O_CREAT | os.O_RDWR | getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(lock_path, flags, 0o600)
    try:
        info = os.fstat(descriptor)
        if not stat.S_ISREG(info.st_mode):
            raise NexusError("Durable ledger lock is not a regular file.")
        fcntl.flock(descriptor, fcntl.LOCK_EX if exclusive else fcntl.LOCK_SH)
        yield
    finally:
        try:
            fcntl.flock(descriptor, fcntl.LOCK_UN)
        finally:
            os.close(descriptor)


def _validate_expected_genesis(raw: bytes) -> tuple[dict[str, dict[str, str]], str]:
    _, state, initial_root = _validate_genesis(raw)
    return state, initial_root


def genesis_from_suite(path: Path) -> bytes:
    suite = strict_json(_read_plain_file(path, maximum=16 * 1024 * 1024, label="R014 genesis suite"))
    _validate_profile_tree(suite)
    _exact_keys(
        suite,
        {"schema", "suite_id", "genesis_b64", "histories", "status_authority"},
        "suite",
    )
    if suite["schema"] != SUITE_SCHEMA or suite["status_authority"] != "NONE":
        raise NexusError("R014 requires the non-authoritative R013 conformance suite.")
    return _decode_raw(suite["genesis_b64"])


def transfer_from_suite(path: Path, case_id: str) -> bytes:
    suite = strict_json(_read_plain_file(path, maximum=16 * 1024 * 1024, label="R014 transfer suite"))
    matches: list[bytes] = []
    for history in suite.get("histories", []):
        if not isinstance(history, dict):
            continue
        for case in history.get("cases", []):
            if isinstance(case, dict) and case.get("case_id") == case_id:
                matches.append(_decode_raw(case.get("raw_b64")))
    if len(matches) != 1:
        raise NexusError(f"Expected exactly one R013 case named {case_id!r}; found {len(matches)}.")
    return matches[0]


def read_transfer_file(path: Path) -> bytes:
    """Read one bounded transfer without following a final-component symlink."""

    return _read_plain_file(path, maximum=MAX_RAW_BYTES, label="R014 transfer")


def _root_pending_files(ledger: Path) -> list[Path]:
    pending: list[Path] = []
    for path in ledger.iterdir():
        if not PENDING_NAME_RE.fullmatch(path.name):
            continue
        info = path.lstat()
        if stat.S_ISLNK(info.st_mode) or not stat.S_ISREG(info.st_mode):
            raise NexusError(f"Durable ledger contains a linked or special pending member: {path.name}")
        if info.st_size > 256 * 1024:
            raise NexusError(f"Durable ledger pending member is oversized: {path.name}")
        pending.append(path)
    if len(pending) > 32:
        raise NexusError("Durable ledger contains too many pending genesis members.")
    return sorted(pending, key=lambda item: item.name)


def _remove_root_pending_unlocked(ledger: Path) -> None:
    pending = _root_pending_files(ledger)
    for path in pending:
        path.unlink()
    if pending:
        _fsync_directory(ledger)


def _ensure_layout_unlocked(ledger: Path, expected_genesis: bytes) -> None:
    _assert_plain_directory(ledger, label="durable ledger")
    _remove_root_pending_unlocked(ledger)
    records = ledger / RECORD_DIRECTORY
    _assert_plain_directory(records, label="durable record directory")
    genesis_path = ledger / GENESIS_FILE
    if genesis_path.exists() or genesis_path.is_symlink():
        actual = _read_plain_file(
            genesis_path,
            maximum=256 * 1024,
            label="durable genesis",
        )
        if actual != expected_genesis:
            raise NexusError("Durable ledger genesis bytes do not match the pinned expected genesis.")
    else:
        _validate_expected_genesis(expected_genesis)
        _atomic_write_once(genesis_path, expected_genesis)
    # Repair the uncertain window where GENESIS or records was renamed/created
    # but a process died (or fsync failed) before the ledger-directory entry was
    # durably recorded. No record commit may be acknowledged unless this passes.
    _fsync_directory(ledger)


def _require_layout_unlocked(ledger: Path, expected_genesis: bytes) -> None:
    _assert_plain_directory(ledger, label="durable ledger")
    allowed = {GENESIS_FILE, LOCK_FILE, RECORD_DIRECTORY}
    pending = {path.name for path in _root_pending_files(ledger)}
    unknown = sorted(path.name for path in ledger.iterdir() if path.name not in allowed | pending)
    if unknown:
        raise NexusError("Unknown durable ledger member(s): " + ", ".join(unknown))
    records = ledger / RECORD_DIRECTORY
    try:
        info = records.lstat()
    except FileNotFoundError as exc:
        raise NexusError("Durable record directory is missing.") from exc
    if stat.S_ISLNK(info.st_mode) or not stat.S_ISDIR(info.st_mode):
        raise NexusError("Durable record directory must be a real directory.")
    actual = _read_plain_file(
        ledger / GENESIS_FILE,
        maximum=256 * 1024,
        label="durable genesis",
    )
    if actual != expected_genesis:
        raise NexusError("Durable ledger genesis bytes do not match the pinned expected genesis.")


def initialise_durable_ledger(ledger: Path, expected_genesis: bytes) -> dict[str, Any]:
    _validate_expected_genesis(expected_genesis)
    with _ledger_lock(ledger, exclusive=True):
        _ensure_layout_unlocked(ledger, expected_genesis)
        recovered = _recover_unlocked(ledger, expected_genesis)
    return _public_recovery(recovered)


def _record_hash(record: dict[str, Any]) -> str:
    subject = deepcopy(record)
    subject["record_hash"] = ""
    return tagged_hash("NEXUS/PCX/DURABLE-RECORD/V0", canonical_bytes(subject))


def _canonical_base64(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def _decode_canonical_base64(value: Any) -> bytes:
    if not isinstance(value, str):
        raise NexusError("Durable transaction_raw_b64 must be a string.")
    try:
        raw = base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise NexusError("Durable transaction_raw_b64 is not canonical base64.") from exc
    if not raw or len(raw) > MAX_RECORD_BYTES or _canonical_base64(raw) != value:
        raise NexusError("Durable transaction bytes are empty, oversized or non-canonical base64.")
    return raw


def _record_paths(records: Path) -> tuple[list[Path], list[Path], int]:
    committed: list[Path] = []
    pending: list[Path] = []
    total = 0
    for path in records.iterdir():
        info = path.lstat()
        if stat.S_ISLNK(info.st_mode) or not stat.S_ISREG(info.st_mode):
            raise NexusError(f"Durable record directory contains a link or special file: {path.name}")
        total += info.st_size
        if total > MAX_LEDGER_BYTES:
            raise NexusError("Durable ledger exceeds its total byte bound.")
        if RECORD_NAME_RE.fullmatch(path.name):
            committed.append(path)
        elif PENDING_NAME_RE.fullmatch(path.name):
            pending.append(path)
        else:
            raise NexusError(f"Unknown durable record-directory member: {path.name}")
    committed.sort(key=lambda item: item.name)
    pending.sort(key=lambda item: item.name)
    if len(committed) > MAX_RECORDS:
        raise NexusError(f"Durable ledger exceeds {MAX_RECORDS} committed records.")
    if len(pending) > MAX_PENDING_RECORDS:
        raise NexusError(f"Durable ledger exceeds {MAX_PENDING_RECORDS} pending records.")
    return committed, pending, total


def _parse_record(raw: bytes, path: Path) -> dict[str, Any]:
    if len(raw) > MAX_RECORD_BYTES:
        raise NexusError(f"Durable record exceeds {MAX_RECORD_BYTES} bytes: {path.name}")
    try:
        value = strict_json(raw)
        _validate_profile_tree(value)
        record = _exact_keys(value, RECORD_KEYS, "durable record")
    except Exception as exc:
        if isinstance(exc, NexusError):
            raise
        raise NexusError(f"Invalid durable record JSON: {path.name}") from exc
    if canonical_bytes(record) != raw:
        raise NexusError(f"Durable record is not canonical R013-profile JSON: {path.name}")
    if record["schema"] != RECORD_SCHEMA or record["status_authority"] != "NONE":
        raise NexusError(f"Unsupported or authoritative durable record: {path.name}")
    return record


def _recover_unlocked(ledger: Path, expected_genesis: bytes) -> dict[str, Any]:
    _require_layout_unlocked(ledger, expected_genesis)
    genesis_path = ledger / GENESIS_FILE
    stored_genesis = _read_plain_file(
        genesis_path,
        maximum=256 * 1024,
        label="durable genesis",
    )
    if stored_genesis != expected_genesis:
        raise NexusError("Stored durable genesis differs from the expected pinned bytes.")
    initial_state, initial_root = _validate_expected_genesis(stored_genesis)
    machine = _History(initial_state, initial_root)
    paths, pending, record_bytes_total = _record_paths(ledger / RECORD_DIRECTORY)
    previous_record_hash = ""
    records: list[dict[str, Any]] = []
    by_tx_id: dict[str, dict[str, Any]] = {}
    for expected_sequence, path in enumerate(paths, start=1):
        match = RECORD_NAME_RE.fullmatch(path.name)
        assert match is not None
        if int(match.group("sequence")) != expected_sequence:
            raise NexusError(
                f"Durable record sequence gap: expected {expected_sequence:08d}, found {path.name}."
            )
        raw = _read_plain_file(path, maximum=MAX_RECORD_BYTES, label="durable record")
        record = _parse_record(raw, path)
        if record["sequence"] != str(expected_sequence):
            raise NexusError(f"Durable record payload sequence mismatch: {path.name}")
        if record["previous_record_hash"] != previous_record_hash:
            raise NexusError(f"Durable record hash-chain mismatch: {path.name}")
        computed_hash = _record_hash(record)
        if record["record_hash"] != computed_hash or match.group("hash") != computed_hash:
            raise NexusError(f"Durable record self-hash or filename mismatch: {path.name}")
        transaction_raw = _decode_canonical_base64(record["transaction_raw_b64"])
        if record["transaction_sha256"] != hashlib.sha256(transaction_raw).hexdigest():
            raise NexusError(f"Durable transaction byte hash mismatch: {path.name}")

        outcome = machine.apply(f"DURABLE-{expected_sequence:08d}", transaction_raw)
        if outcome["decision"] != "CANDIDATE_ACCEPTED" or outcome["idempotent"] != "FALSE":
            raise NexusError(
                f"Committed durable transaction no longer validates at sequence {expected_sequence}: "
                f"{outcome['reason_code']}"
            )
        receipt = machine.receipts[-1]
        checkpoint = _checkpoint(
            state=machine.state,
            receipts=machine.receipts,
            initial_state_root=initial_root,
        )
        if record["tx_id"] != outcome["tx_id"]:
            raise NexusError(f"Durable tx_id mismatch: {path.name}")
        if record["previous_state_root"] != outcome["previous_state_root"]:
            raise NexusError(f"Durable predecessor root mismatch: {path.name}")
        if record["next_state_root"] != outcome["next_state_root"]:
            raise NexusError(f"Durable next-state root mismatch: {path.name}")
        if record["receipt"] != receipt or record["checkpoint"] != checkpoint:
            raise NexusError(f"Durable receipt or checkpoint does not reproduce exactly: {path.name}")
        records.append(record)
        by_tx_id[record["tx_id"]] = record
        previous_record_hash = computed_hash

    checkpoint = _checkpoint(
        state=machine.state,
        receipts=machine.receipts,
        initial_state_root=initial_root,
    )
    return {
        "machine": machine,
        "initial_state_root": initial_root,
        "records": records,
        "by_tx_id": by_tx_id,
        "pending": pending,
        "record_bytes_total": record_bytes_total,
        "checkpoint": checkpoint,
        "record_head": previous_record_hash,
    }


def _require_external_head_anchor(recovered: dict[str, Any], expected_record_head: str | None) -> None:
    if expected_record_head is None:
        return
    if not isinstance(expected_record_head, str) or re.fullmatch(r"[0-9a-f]{64}", expected_record_head) is None:
        raise NexusError("Expected durable record head must be 64 lowercase hexadecimal characters.")
    observed = {record["record_hash"] for record in recovered["records"]}
    if expected_record_head not in observed:
        raise NexusError(
            "The independently retained durable record head is absent; the local ledger may be rolled back, replaced or incomplete."
        )


def _public_recovery(
    recovered: dict[str, Any],
    *,
    expected_record_head: str | None = None,
) -> dict[str, Any]:
    checkpoint = recovered["checkpoint"]
    return {
        "schema": RECOVERY_REPORT_SCHEMA,
        "status": "PASS",
        "genesis_id": PINNED_GENESIS_ID,
        "record_count": str(len(recovered["records"])),
        "record_head": recovered["record_head"],
        "state_root": checkpoint["state_root"],
        "receipt_head": checkpoint["receipt_head"],
        "checkpoint_id": checkpoint["checkpoint_id"],
        "utxo_count": checkpoint["utxo_count"],
        "total_supply": checkpoint["total_supply"],
        "uncommitted_temp_count": str(len(recovered["pending"])),
        "external_head_anchor_checked": "TRUE" if expected_record_head is not None else "FALSE",
        "external_head_anchor": expected_record_head or "",
        "status_authority": "NONE",
        "claims": [
            "The complete local durable-record prefix replayed from the pinned synthetic genesis."
        ],
        "non_claims": [
            "A valid local prefix does not prove that a later prefix was never deleted; rollback detection requires an independently held head anchor."
        ],
    }


def verify_durable_ledger(
    ledger: Path,
    expected_genesis: bytes,
    *,
    expected_record_head: str | None = None,
) -> dict[str, Any]:
    _validate_expected_genesis(expected_genesis)
    if not ledger.exists() or ledger.is_symlink() or not ledger.is_dir():
        raise NexusError(f"Durable ledger does not exist as a real directory: {ledger}")
    with _ledger_lock(ledger, exclusive=False):
        recovered = _recover_unlocked(ledger, expected_genesis)
        _require_external_head_anchor(recovered, expected_record_head)
    return _public_recovery(recovered, expected_record_head=expected_record_head)


def _fault(stage: str, requested: str | None) -> None:
    if requested == stage:
        raise SimulatedCrash(stage)


def _remove_pending_unlocked(records: Path) -> None:
    _, pending, _ = _record_paths(records)
    changed = False
    for path in pending:
        path.unlink()
        changed = True
    if changed:
        _fsync_directory(records)


def commit_durable_transfer(
    ledger: Path,
    expected_genesis: bytes,
    transaction_raw: bytes,
    *,
    fault_stage: str | None = None,
    expected_record_head: str | None = None,
) -> dict[str, Any]:
    """Validate and durably commit one R013 transfer.

    The only success acknowledgement is returned after the record file and its
    directory entry have both been fsynced. Test-only fault stages model process
    loss; a retry must then observe either the old valid prefix or the new record.
    """

    _validate_expected_genesis(expected_genesis)
    if not isinstance(transaction_raw, bytes) or not 1 <= len(transaction_raw) <= MAX_RAW_BYTES:
        raise NexusError(f"R014 transfer bytes must be 1..{MAX_RAW_BYTES} bytes.")
    with _ledger_lock(ledger, exclusive=True):
        _ensure_layout_unlocked(ledger, expected_genesis)
        records_path = ledger / RECORD_DIRECTORY
        _remove_pending_unlocked(records_path)
        recovered = _recover_unlocked(ledger, expected_genesis)
        _require_external_head_anchor(recovered, expected_record_head)
        machine: _History = recovered["machine"]
        before_count = len(recovered["records"])
        outcome = machine.apply(f"COMMIT-{before_count + 1:08d}", transaction_raw)
        if outcome["decision"] == "REJECTED":
            return {
                "schema": COMMIT_RESULT_SCHEMA,
                "decision": "REJECTED",
                "reason_code": outcome["reason_code"],
                "durable": "FALSE",
                "idempotent": "FALSE",
                "sequence": str(before_count),
                "tx_id": outcome["tx_id"],
                "record_hash": "",
                "receipt_hash": "",
                "state_root": outcome["next_state_root"],
                "status_authority": "NONE",
            }
        if outcome["idempotent"] == "TRUE":
            existing = recovered["by_tx_id"].get(outcome["tx_id"])
            if existing is None:
                raise NexusError("Exact replay had no corresponding durable record.")
            # The prior process may have died after rename but before its
            # record-directory fsync. Re-sync before turning a visible record
            # into a durable acknowledgement on retry.
            _fsync_directory(records_path)
            return {
                "schema": COMMIT_RESULT_SCHEMA,
                "decision": "EXACT_REPLAY",
                "reason_code": "EXACT_REPLAY",
                "durable": "TRUE",
                "idempotent": "TRUE",
                "sequence": existing["sequence"],
                "tx_id": existing["tx_id"],
                "record_hash": existing["record_hash"],
                "receipt_hash": existing["receipt"]["receipt_hash"],
                "state_root": existing["next_state_root"],
                "status_authority": "NONE",
            }

        if before_count >= MAX_RECORDS:
            raise NexusError(f"Durable ledger is at its {MAX_RECORDS}-record capacity.")
        receipt = machine.receipts[-1]
        checkpoint = _checkpoint(
            state=machine.state,
            receipts=machine.receipts,
            initial_state_root=recovered["initial_state_root"],
        )
        sequence = before_count + 1
        record = {
            "schema": RECORD_SCHEMA,
            "sequence": str(sequence),
            "previous_record_hash": recovered["record_head"],
            "transaction_raw_b64": _canonical_base64(transaction_raw),
            "transaction_sha256": hashlib.sha256(transaction_raw).hexdigest(),
            "tx_id": outcome["tx_id"],
            "previous_state_root": outcome["previous_state_root"],
            "next_state_root": outcome["next_state_root"],
            "receipt": receipt,
            "checkpoint": checkpoint,
            "status_authority": "NONE",
            "record_hash": "",
        }
        record["record_hash"] = _record_hash(record)
        record_bytes = canonical_bytes(record)
        if len(record_bytes) > MAX_RECORD_BYTES:
            raise NexusError("Generated durable record exceeds its byte bound.")
        if recovered["record_bytes_total"] + len(record_bytes) > MAX_LEDGER_BYTES:
            raise NexusError(f"Durable ledger would exceed its {MAX_LEDGER_BYTES}-byte capacity.")
        final_path = records_path / f"{sequence:08d}-{record['record_hash']}.pcx"
        pending = records_path / f".pending-{os.getpid()}-{secrets.token_hex(16)}"
        created = False
        renamed = False
        try:
            _fault("before_temp_write", fault_stage)
            flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0)
            descriptor = os.open(pending, flags, 0o600)
            created = True
            try:
                view = memoryview(record_bytes)
                while view:
                    written = os.write(descriptor, view)
                    if written <= 0:
                        raise NexusError("Short write while preparing a durable record.")
                    view = view[written:]
                _fault("after_temp_write_before_fsync", fault_stage)
                os.fsync(descriptor)
                _fault("after_temp_fsync_before_rename", fault_stage)
            finally:
                os.close(descriptor)
            if final_path.exists() or final_path.is_symlink():
                raise NexusError(f"Durable sequence path already exists: {final_path.name}")
            os.replace(pending, final_path)
            renamed = True
            _fault("after_rename_before_directory_fsync", fault_stage)
            _fsync_directory(records_path)
            _fault("after_directory_fsync_before_reply", fault_stage)
        except SimulatedCrash:
            # A simulated process loss deliberately bypasses ordinary cleanup so
            # recovery sees the same directory state a killed process would leave.
            raise
        except Exception:
            if created and not renamed:
                try:
                    pending.unlink()
                except FileNotFoundError:
                    pass
            raise
        return {
            "schema": COMMIT_RESULT_SCHEMA,
            "decision": "DURABLY_COMMITTED",
            "reason_code": "VALID_CONSERVED_TRANSFER",
            "durable": "TRUE",
            "idempotent": "FALSE",
            "sequence": str(sequence),
            "tx_id": record["tx_id"],
            "record_hash": record["record_hash"],
            "receipt_hash": receipt["receipt_hash"],
            "state_root": record["next_state_root"],
            "status_authority": "NONE",
        }


def verify_independent_durable_ledger(
    ledger: Path,
    expected_genesis: bytes,
    *,
    node_verifier: Path,
    r013_verifier: Path,
    repo_root: Path,
) -> dict[str, Any]:
    expected_path = (
        repo_root
        / "experiments"
        / "R014_PCX_DURABLE_SETTLEMENT"
        / "independent_journal_verifier.mjs"
    ).resolve()
    if node_verifier.resolve() != expected_path:
        raise NexusError("R014 independent replay is restricted to its canonical verifier path.")
    verifier_bytes = _read_plain_file(
        expected_path,
        maximum=2 * 1024 * 1024,
        label="R014 independent journal verifier",
    )
    verifier_sha256 = hashlib.sha256(verifier_bytes).hexdigest()
    if verifier_sha256 != PINNED_R014_NODE_VERIFIER_SHA256:
        raise NexusError("R014 independent journal verifier hash is not the pinned reviewed source.")
    expected_r013_path = (
        repo_root
        / "experiments"
        / "R013_PCX_CONSERVED_CLAIM"
        / "independent_verifier.mjs"
    ).resolve()
    if r013_verifier.resolve() != expected_r013_path:
        raise NexusError("R014 independent replay is restricted to the canonical R013 verifier path.")
    r013_bytes = _read_plain_file(
        expected_r013_path,
        maximum=2 * 1024 * 1024,
        label="R013 independent state verifier",
    )
    if hashlib.sha256(r013_bytes).hexdigest() != PINNED_NODE_VERIFIER_SHA256:
        raise NexusError("R014 independent replay requires the pinned reviewed R013 verifier source.")
    python_report = verify_durable_ledger(ledger, expected_genesis)
    node = shutil.which("node")
    if node is None:
        raise NexusError("R014 independent durable replay requires Node.js 20 or later.")
    result = subprocess.run(
        [node, str(node_verifier), str(ledger), str(r013_verifier)],
        cwd=repo_root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=60,
    )
    if result.returncode != 0:
        detail = result.stderr.decode("utf-8", errors="replace").strip()
        raise NexusError(f"Independent R014 durable verifier failed: {detail}")
    try:
        node_report = json.loads(result.stdout)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise NexusError("Independent R014 verifier returned invalid JSON.") from exc
    expected_projection = {
        "record_count": python_report["record_count"],
        "record_head": python_report["record_head"],
        "state_root": python_report["state_root"],
        "receipt_head": python_report["receipt_head"],
        "checkpoint_id": python_report["checkpoint_id"],
        "total_supply": python_report["total_supply"],
    }
    actual_projection = {key: node_report.get(key) for key in expected_projection}
    if actual_projection != expected_projection:
        raise NexusError("Python and independent JavaScript durable replay reports disagree.")
    if (
        node_report.get("schema") != INDEPENDENT_REPORT_SCHEMA
        or node_report.get("status") != "PASS"
        or node_report.get("status_authority") != "NONE"
        or node_report.get("journal_verifier_sha256") != verifier_sha256
    ):
        raise NexusError("Independent R014 report identity, authority or source binding is invalid.")
    return node_report


def r014_evidence_paths(repo_root: Path) -> dict[str, Path]:
    experiment = repo_root / "experiments" / "R014_PCX_DURABLE_SETTLEMENT"
    receipts = repo_root / "operations" / "receipts" / "R014_PCX_DURABLE_SETTLEMENT"
    proposal = repo_root / "operations" / "proposals" / "R014_PCX_DURABLE_SETTLEMENT"
    return {
        "suite": repo_root
        / "experiments"
        / "R013_PCX_CONSERVED_CLAIM"
        / "fixtures"
        / "SUITE.json",
        "r013_verifier": repo_root
        / "experiments"
        / "R013_PCX_CONSERVED_CLAIM"
        / "independent_verifier.mjs",
        "node_verifier": experiment / "independent_journal_verifier.mjs",
        "demo_builder": experiment / "build_demo.py",
        "ledger": receipts / "DEMO_LEDGER",
        "local_report": receipts / "LOCAL_RECOVERY_REPORT.json",
        "independent_report": receipts / "INDEPENDENT_REPLAY_REPORT.json",
        "external_anchor": receipts / "EXTERNAL_HEAD_ANCHOR.json",
        "demo_report": receipts / "DEMO_REPORT.json",
        "proposal_status": proposal / "STATUS.proposal.json",
        "record_schema": repo_root / "constitution" / "schemas" / "pcx-durable-record.schema.json",
        "anchor_schema": repo_root
        / "constitution"
        / "schemas"
        / "pcx-external-head-anchor.schema.json",
        "receipt_schema": repo_root
        / "constitution"
        / "schemas"
        / "pcx-value-receipt.schema.json",
        "checkpoint_schema": repo_root
        / "constitution"
        / "schemas"
        / "pcx-checkpoint.schema.json",
    }


def require_r014_evidence_files(repo_root: Path) -> dict[str, Path]:
    paths = r014_evidence_paths(repo_root)
    invalid: list[str] = []
    for name, path in paths.items():
        try:
            info = path.lstat()
        except FileNotFoundError:
            invalid.append(str(path.relative_to(repo_root)))
            continue
        expected = stat.S_ISDIR(info.st_mode) if name == "ledger" else stat.S_ISREG(info.st_mode)
        if stat.S_ISLNK(info.st_mode) or not expected:
            invalid.append(str(path.relative_to(repo_root)))
    if invalid:
        raise NexusError(
            "Declared R014 evidence is missing or not a real file/directory of the required type: "
            + ", ".join(invalid)
        )
    return paths


def _load_exact_canonical_report(path: Path) -> dict[str, Any]:
    raw = path.read_bytes()
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise NexusError(f"Invalid saved R014 JSON: {path}") from exc
    if not isinstance(value, dict) or canonical_json_bytes(value) != raw:
        raise NexusError(f"Saved R014 JSON is not exact canonical JSON with one LF: {path}")
    return value


def _load_json_object(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_bytes())
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise NexusError(f"Invalid saved R014 JSON: {path}") from exc
    if not isinstance(value, dict):
        raise NexusError(f"Saved R014 JSON must contain an object: {path}")
    return value


def _load_schema(path: Path, expected_id: str) -> tuple[dict[str, Any], bytes]:
    raw = _read_plain_file(path, maximum=256 * 1024, label=f"R014 schema {path.name}")
    try:
        schema = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise NexusError(f"Invalid R014 JSON Schema: {path}") from exc
    if (
        not isinstance(schema, dict)
        or schema.get("$schema") != "https://json-schema.org/draft/2020-12/schema"
        or schema.get("$id") != expected_id
    ):
        raise NexusError(f"R014 JSON Schema dialect or identity mismatch: {path}")
    return schema, raw


def _validate_schema_instance(
    instance: Any,
    schema: dict[str, Any],
    *,
    root_schema: dict[str, Any],
    external_schemas: dict[str, dict[str, Any]],
    label: str,
) -> None:
    """Evaluate the bounded JSON Schema subset used by the R013/R014 artifacts."""

    if not isinstance(schema, dict):
        raise NexusError(f"Malformed JSON Schema node while validating {label}.")
    reference = schema.get("$ref")
    if reference is not None:
        if not isinstance(reference, str):
            raise NexusError(f"Malformed JSON Schema reference while validating {label}.")
        if reference.startswith("#/$defs/"):
            name = reference.removeprefix("#/$defs/")
            definitions = root_schema.get("$defs")
            if not isinstance(definitions, dict) or name not in definitions:
                raise NexusError(f"Unresolved local JSON Schema reference {reference!r} for {label}.")
            _validate_schema_instance(
                instance,
                definitions[name],
                root_schema=root_schema,
                external_schemas=external_schemas,
                label=label,
            )
            return
        target = external_schemas.get(reference)
        if target is None:
            raise NexusError(f"Unresolved external JSON Schema reference {reference!r} for {label}.")
        _validate_schema_instance(
            instance,
            target,
            root_schema=target,
            external_schemas=external_schemas,
            label=label,
        )
        return

    if "const" in schema and instance != schema["const"]:
        raise NexusError(f"JSON Schema const failed for {label}.")
    declared_type = schema.get("type")
    if declared_type == "object":
        if not isinstance(instance, dict):
            raise NexusError(f"JSON Schema object type failed for {label}.")
        required = schema.get("required", [])
        properties = schema.get("properties", {})
        if not isinstance(required, list) or not all(isinstance(item, str) for item in required):
            raise NexusError(f"Malformed JSON Schema required list for {label}.")
        if not isinstance(properties, dict):
            raise NexusError(f"Malformed JSON Schema properties for {label}.")
        missing = [key for key in required if key not in instance]
        if missing:
            raise NexusError(f"JSON Schema required key(s) missing for {label}: {missing}")
        if schema.get("additionalProperties") is False:
            extra = sorted(set(instance) - set(properties))
            if extra:
                raise NexusError(f"JSON Schema additional key(s) for {label}: {extra}")
        for key, child_schema in properties.items():
            if key in instance:
                _validate_schema_instance(
                    instance[key],
                    child_schema,
                    root_schema=root_schema,
                    external_schemas=external_schemas,
                    label=f"{label}.{key}",
                )
    elif declared_type == "array":
        if not isinstance(instance, list):
            raise NexusError(f"JSON Schema array type failed for {label}.")
        minimum = schema.get("minItems")
        maximum = schema.get("maxItems")
        if isinstance(minimum, int) and len(instance) < minimum:
            raise NexusError(f"JSON Schema minItems failed for {label}.")
        if isinstance(maximum, int) and len(instance) > maximum:
            raise NexusError(f"JSON Schema maxItems failed for {label}.")
        item_schema = schema.get("items")
        if item_schema is not None:
            for index, item in enumerate(instance):
                _validate_schema_instance(
                    item,
                    item_schema,
                    root_schema=root_schema,
                    external_schemas=external_schemas,
                    label=f"{label}[{index}]",
                )
    elif declared_type == "string":
        if not isinstance(instance, str):
            raise NexusError(f"JSON Schema string type failed for {label}.")
        minimum = schema.get("minLength")
        maximum = schema.get("maxLength")
        if isinstance(minimum, int) and len(instance) < minimum:
            raise NexusError(f"JSON Schema minLength failed for {label}.")
        if isinstance(maximum, int) and len(instance) > maximum:
            raise NexusError(f"JSON Schema maxLength failed for {label}.")
        pattern = schema.get("pattern")
        if pattern is not None:
            if not isinstance(pattern, str):
                raise NexusError(f"Malformed JSON Schema pattern for {label}.")
            try:
                matched = re.search(pattern, instance) is not None
            except re.error as exc:
                raise NexusError(f"Invalid JSON Schema regular expression for {label}.") from exc
            if not matched:
                raise NexusError(f"JSON Schema pattern failed for {label}.")
    elif declared_type is not None:
        raise NexusError(f"Unsupported JSON Schema type {declared_type!r} for {label}.")


def _validate_r014_schema_evidence(
    paths: dict[str, Path],
    anchor: dict[str, Any],
) -> dict[str, str]:
    specifications = {
        "pcx-durable-record.schema.json": (paths["record_schema"], RECORD_SCHEMA),
        "pcx-external-head-anchor.schema.json": (
            paths["anchor_schema"],
            "nexus.pcx-external-head-anchor/v0",
        ),
        "pcx-value-receipt.schema.json": (
            paths["receipt_schema"],
            "nexus.pcx-value-receipt/v0",
        ),
        "pcx-checkpoint.schema.json": (
            paths["checkpoint_schema"],
            "nexus.pcx-checkpoint/v0",
        ),
    }
    schemas: dict[str, dict[str, Any]] = {}
    raw_schemas: dict[str, bytes] = {}
    for filename, (path, expected_id) in specifications.items():
        schema, raw = _load_schema(path, expected_id)
        schemas[filename] = schema
        raw_schemas[filename] = raw

    _validate_schema_instance(
        anchor,
        schemas["pcx-external-head-anchor.schema.json"],
        root_schema=schemas["pcx-external-head-anchor.schema.json"],
        external_schemas=schemas,
        label="external head anchor",
    )
    record_paths, pending, _ = _record_paths(paths["ledger"] / RECORD_DIRECTORY)
    if pending:
        raise NexusError("Saved R014 evidence must not contain uncommitted record files.")
    for path in record_paths:
        raw = _read_plain_file(path, maximum=MAX_RECORD_BYTES, label="saved R014 durable record")
        record = _parse_record(raw, path)
        _validate_schema_instance(
            record,
            schemas["pcx-durable-record.schema.json"],
            root_schema=schemas["pcx-durable-record.schema.json"],
            external_schemas=schemas,
            label=f"durable record {path.name}",
        )
    return {
        filename: hashlib.sha256(raw_schemas[filename]).hexdigest()
        for filename in sorted(raw_schemas)
    }


def validate_r014_saved_evidence(repo_root: Path) -> dict[str, Any]:
    paths = require_r014_evidence_files(repo_root)
    genesis = genesis_from_suite(paths["suite"])
    anchor = _load_exact_canonical_report(paths["external_anchor"])
    if (
        anchor.get("schema") != "nexus.pcx-external-head-anchor/v0"
        or anchor.get("genesis_id") != PINNED_GENESIS_ID
        or anchor.get("status_authority") != "NONE"
    ):
        raise NexusError("R014 external-head anchor specimen identity or authority is invalid.")
    schema_sha256 = _validate_r014_schema_evidence(paths, anchor)
    expected_head = anchor.get("record_head")
    local = verify_durable_ledger(
        paths["ledger"],
        genesis,
        expected_record_head=expected_head,
    )
    independent = verify_independent_durable_ledger(
        paths["ledger"],
        genesis,
        node_verifier=paths["node_verifier"],
        r013_verifier=paths["r013_verifier"],
        repo_root=repo_root,
    )
    if _load_exact_canonical_report(paths["local_report"]) != local:
        raise NexusError("Saved R014 local recovery report does not reproduce exactly.")
    if _load_exact_canonical_report(paths["independent_report"]) != independent:
        raise NexusError("Saved R014 independent replay report does not reproduce exactly.")
    if (
        anchor.get("record_head") != local["record_head"]
        or anchor.get("checkpoint_id") != local["checkpoint_id"]
        or anchor.get("state_root") != local["state_root"]
        or anchor.get("receipt_head") != local["receipt_head"]
    ):
        raise NexusError("R014 external-head anchor does not bind the reproduced ledger head.")

    manifest = {
        str(path.relative_to(paths["ledger"])): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(paths["ledger"].rglob("*"))
        if path.is_file()
    }
    demo = _load_exact_canonical_report(paths["demo_report"])
    proposal_status = _load_json_object(paths["proposal_status"])
    if proposal_status != {
        "schema": "nexus.proposal-status/v1",
        "round": "R014",
        "mode": "R014_PCX_DURABLE_SETTLEMENT_REVIEW_READY",
        "disposition": "DEMONSTRATED_DURABLE_SINGLE_HOST_SYNTHETIC_SETTLEMENT",
        "canonical_status": "UNPROMOTED_STACKED_PROPOSAL",
        "base_head": "33da36ae22457986c69d3aacdcdecd1a71335793",
        "status_authority": "NONE",
        "next_action": "USER_REVIEW_R012_R013_R014_WITH_SEPARATE_PROMOTION_DECISIONS",
    }:
        raise NexusError("R014 proposal status is not the exact unpromoted stacked disposition.")
    if (
        demo.get("schema") != "nexus.r014-pcx-durable-settlement-demo/v0"
        or demo.get("status") != "DEMONSTRATED_DURABLE_SINGLE_HOST_SYNTHETIC_SETTLEMENT"
        or demo.get("status_authority") != "NONE"
        or demo.get("dependencies")
        != {
            "r012_head": "f28dc07bf1433bb22e4d992a7f523503387ea445",
            "r013_head": "33da36ae22457986c69d3aacdcdecd1a71335793",
            "canonical_status": "UNPROMOTED_STACKED_PROPOSALS",
        }
        or demo.get("ledger", {}).get("manifest") != manifest
        or demo.get("ledger", {}).get("record_count") != local["record_count"]
        or demo.get("ledger", {}).get("record_head") != local["record_head"]
        or demo.get("ledger", {}).get("state_root") != local["state_root"]
        or demo.get("ledger", {}).get("checkpoint_id") != local["checkpoint_id"]
        or demo.get("ledger", {}).get("total_supply") != str(GENESIS_SUPPLY)
        or demo.get("exact_replay", {}).get("decision") != "EXACT_REPLAY"
        or demo.get("exact_replay", {}).get("record_count_after") != local["record_count"]
        or demo.get("verification", {}).get("journal_verifier_sha256")
        != independent["journal_verifier_sha256"]
        or demo.get("verification", {}).get("state_verifier_sha256")
        != independent["state_verifier_sha256"]
        or demo.get("verification", {}).get("external_head_anchor_checked") != "TRUE"
        or demo.get("verification", {}).get("schema_sha256") != schema_sha256
    ):
        raise NexusError("R014 demo claims do not match the exact reproduced durable evidence.")
    return {
        "schema": "nexus.r014-saved-evidence-check/v0",
        "status": "PASS",
        "local": local,
        "independent": independent,
        "schema_sha256": schema_sha256,
        "demo_sha256": hashlib.sha256(paths["demo_report"].read_bytes()).hexdigest(),
        "status_authority": "NONE",
    }
