"""Crash-consistent append-only storage for the R016 synthetic custody kernel.

The SQLite file is an evidence-preserving event log, not a state snapshot.
Every open and append reconstructs the complete :class:`custody_kernel.Machine`
from the caller-supplied exact genesis bytes and every stored exact event.  No
UTXO, controller, key, balance, or lifecycle table is persisted or trusted.

This is a bounded single-host research profile.  It deliberately excludes WAL,
repair, import, fork choice, private-key handling, networking, and live value.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import stat
import tempfile
from copy import deepcopy
from pathlib import Path
from typing import Any, TypeAlias

from .custody_kernel import (
    MAX_GENESIS_BYTES,
    MAX_WIRE_BYTES,
    NETWORK,
    PROFILE,
    PROTOCOL_VERSION,
    CustodyKernelError,
    Machine,
    canonical_json,
)


GenesisSource: TypeAlias = bytes | Path

STORE_SCHEMA = "nexus.pcx-custody-durable-store/v0"
RECORD_SCHEMA = "nexus.pcx-custody-durable-record/v0"
ANCHOR_SCHEMA = "nexus.pcx-custody-durable-anchor/v0"
AUDIT_SCHEMA = "nexus.pcx-custody-durable-audit/v0"
APPLY_SCHEMA = "nexus.pcx-custody-durable-apply/v0"

MAX_RECORDS = 256
MAX_ANCHOR_BYTES = 4096
BUSY_TIMEOUT_MS = 15_000
APPLICATION_ID = 0x4E583136  # ASCII "NX16"
USER_VERSION = 16

_HASH = re.compile(r"^[0-9a-f]{64}$")
_SEQUENCE = re.compile(
    r"^(?:0|[1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-6])$"
)


META_SQL = """CREATE TABLE meta (
    singleton INTEGER PRIMARY KEY NOT NULL CHECK (singleton = 1),
    schema TEXT NOT NULL,
    network TEXT NOT NULL,
    profile TEXT NOT NULL,
    protocol_version TEXT NOT NULL,
    genesis_raw BLOB NOT NULL,
    genesis_sha256 TEXT NOT NULL,
    initial_state_root TEXT NOT NULL,
    initial_supply TEXT NOT NULL,
    max_records INTEGER NOT NULL CHECK (max_records > 0),
    status_authority TEXT NOT NULL CHECK (status_authority = 'NONE'),
    created_with_sqlite TEXT NOT NULL
) STRICT"""

RECORDS_SQL = """CREATE TABLE records (
    sequence INTEGER PRIMARY KEY NOT NULL CHECK (sequence > 0),
    previous_record_hash TEXT NOT NULL,
    record_hash TEXT NOT NULL UNIQUE,
    object_id TEXT NOT NULL UNIQUE,
    event_raw BLOB NOT NULL UNIQUE CHECK (length(event_raw) BETWEEN 1 AND 65536),
    event_sha256 TEXT NOT NULL UNIQUE,
    previous_state_root TEXT NOT NULL,
    next_state_root TEXT NOT NULL,
    receipt_hash TEXT NOT NULL UNIQUE,
    receipt_raw BLOB NOT NULL UNIQUE,
    receipt_sha256 TEXT NOT NULL UNIQUE,
    status_authority TEXT NOT NULL CHECK (status_authority = 'NONE')
) STRICT"""

TRIGGER_SQL = {
    "meta_no_insert": """CREATE TRIGGER meta_no_insert BEFORE INSERT ON meta
WHEN (SELECT count(*) FROM meta) >= 1
BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY_META'); END""",
    "meta_no_update": """CREATE TRIGGER meta_no_update BEFORE UPDATE ON meta
BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY_META'); END""",
    "meta_no_delete": """CREATE TRIGGER meta_no_delete BEFORE DELETE ON meta
BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY_META'); END""",
    "records_no_update": """CREATE TRIGGER records_no_update BEFORE UPDATE ON records
BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY_RECORDS'); END""",
    "records_no_delete": """CREATE TRIGGER records_no_delete BEFORE DELETE ON records
BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY_RECORDS'); END""",
    "records_contiguous_insert": """CREATE TRIGGER records_contiguous_insert BEFORE INSERT ON records
WHEN NEW.sequence != COALESCE((SELECT max(sequence) + 1 FROM records), 1)
  OR NEW.previous_record_hash != COALESCE((SELECT record_hash FROM records ORDER BY sequence DESC LIMIT 1), '')
BEGIN SELECT RAISE(ABORT, 'NON_CONTIGUOUS_RECORD'); END""",
}


class CustodyStoreError(Exception):
    """Stable machine-classified storage failure."""

    def __init__(self, code: str, detail: str) -> None:
        self.code = code
        self.detail = detail
        super().__init__(f"{code}: {detail}")


def _fail(code: str, detail: str) -> None:
    raise CustodyStoreError(code, detail)


def _tagged_hash(tag: str, payload: bytes) -> str:
    tag_hash = hashlib.sha256(tag.encode("ascii")).digest()
    return hashlib.sha256(tag_hash + tag_hash + payload).hexdigest()


def _require_hash(value: Any, label: str, *, allow_empty: bool = False) -> str:
    if allow_empty and value == "":
        return ""
    if not isinstance(value, str) or _HASH.fullmatch(value) is None:
        _fail("RECORD_ENCODING_INVALID", f"{label} must be a lowercase SHA-256 digest.")
    return value


def _read_genesis(source: GenesisSource) -> tuple[bytes, Machine, int]:
    if type(source) is bytes:
        raw = source
    else:
        path = Path(source)
        if path.is_symlink():
            _fail("GENESIS_INVALID", "Genesis input may not be a symlink.")
        try:
            with path.open("rb") as handle:
                raw = handle.read(MAX_GENESIS_BYTES + 1)
        except OSError as exc:
            raise CustodyStoreError("GENESIS_MISSING", str(path)) from exc
    if not raw or len(raw) > MAX_GENESIS_BYTES:
        _fail("GENESIS_INVALID", "Genesis is empty or exceeds its byte bound.")
    try:
        machine = Machine(raw)
    except CustodyKernelError as exc:
        raise CustodyStoreError("GENESIS_INVALID", f"{exc.code}: {exc}") from exc
    supply = sum(int(item["amount"]) for item in machine.utxos())
    if supply <= 0:
        _fail("GENESIS_INVALID", "Genesis supply must be positive.")
    return raw, machine, supply


def _validate_store_path(path: Path, *, creating: bool) -> Path:
    candidate = Path(path).absolute()
    try:
        parent = candidate.parent.resolve(strict=True)
    except OSError as exc:
        raise CustodyStoreError("PATH_INVALID", str(exc)) from exc
    if parent != candidate.parent.absolute():
        _fail("PATH_SYMLINK_REJECTED", "Database directory components may not be symlinks.")
    if creating:
        if candidate.exists() or candidate.is_symlink():
            _fail("STORE_EXISTS", "Refusing to replace an existing database path.")
        return candidate
    if candidate.is_symlink():
        _fail("PATH_SYMLINK_REJECTED", "Database path may not be a symlink.")
    try:
        status = candidate.stat(follow_symlinks=False)
    except FileNotFoundError as exc:
        raise CustodyStoreError("STORE_MISSING", str(candidate)) from exc
    except OSError as exc:
        raise CustodyStoreError("PATH_INVALID", str(exc)) from exc
    if not stat.S_ISREG(status.st_mode):
        _fail("PATH_INVALID", "Database path must be a regular file.")
    return candidate


def _reserve_store_path(path: Path) -> tuple[int, int]:
    flags = os.O_CREAT | os.O_EXCL | os.O_RDWR
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    try:
        descriptor = os.open(path, flags, 0o600)
    except FileExistsError as exc:
        raise CustodyStoreError("STORE_EXISTS", "Database path already exists.") from exc
    except OSError as exc:
        raise CustodyStoreError("STORE_RESERVATION_FAILED", str(exc)) from exc
    try:
        status = os.fstat(descriptor)
        os.fsync(descriptor)
        return status.st_dev, status.st_ino
    finally:
        os.close(descriptor)


def _cleanup_reservation(path: Path, identity: tuple[int, int]) -> None:
    try:
        status = path.stat(follow_symlinks=False)
    except OSError:
        return
    if (status.st_dev, status.st_ino) != identity:
        return
    for suffix in ("-journal", "-wal", "-shm"):
        try:
            Path(str(path) + suffix).unlink(missing_ok=True)
        except OSError:
            pass
    try:
        path.unlink()
    except OSError:
        pass


def _fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _preflight_header(path: Path) -> None:
    for suffix in ("-wal", "-shm"):
        sidecar = Path(str(path) + suffix)
        if sidecar.exists() or sidecar.is_symlink():
            _fail("STORAGE_PROFILE_MISMATCH", f"Forbidden SQLite sidecar exists: {sidecar.name}")
    flags = os.O_RDONLY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    try:
        descriptor = os.open(path, flags)
        try:
            header = os.read(descriptor, 100)
        finally:
            os.close(descriptor)
    except OSError as exc:
        raise CustodyStoreError("STORE_HEADER_UNREADABLE", str(exc)) from exc
    if len(header) != 100 or header[:16] != b"SQLite format 3\x00":
        _fail("STORE_HEADER_INVALID", "Database header is truncated or not SQLite 3.")
    if header[18:20] != b"\x01\x01":
        _fail("STORAGE_PROFILE_MISMATCH", "Only rollback-journal header format 1/1 is admitted.")
    if int.from_bytes(header[60:64], "big") != USER_VERSION:
        _fail("SCHEMA_TAMPERED", "SQLite user_version does not match R016.")
    if int.from_bytes(header[68:72], "big") != APPLICATION_ID:
        _fail("SCHEMA_TAMPERED", "SQLite application_id does not match R016.")


def _configure_connection(path: Path, *, creating: bool) -> sqlite3.Connection:
    if not creating:
        _preflight_header(path)
    try:
        connection = sqlite3.connect(
            path,
            isolation_level=None,
            timeout=BUSY_TIMEOUT_MS / 1000,
        )
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA trusted_schema=OFF")
        journal = connection.execute("PRAGMA journal_mode=DELETE").fetchone()[0]
        connection.execute("PRAGMA synchronous=EXTRA")
        connection.execute(f"PRAGMA busy_timeout={BUSY_TIMEOUT_MS}")
        connection.execute("PRAGMA foreign_keys=OFF")
        synchronous = connection.execute("PRAGMA synchronous").fetchone()[0]
        trusted = connection.execute("PRAGMA trusted_schema").fetchone()[0]
        if str(journal).lower() != "delete" or synchronous != 3 or trusted != 0:
            connection.close()
            _fail(
                "STORAGE_PROFILE_MISMATCH",
                "Required DELETE/EXTRA/trusted_schema=OFF profile is unavailable.",
            )
        return connection
    except CustodyStoreError:
        raise
    except sqlite3.Error as exc:
        raise CustodyStoreError("STORE_OPEN_FAILED", str(exc)) from exc


def _create_schema(connection: sqlite3.Connection) -> None:
    connection.execute(META_SQL)
    connection.execute(RECORDS_SQL)
    for name in sorted(TRIGGER_SQL):
        connection.execute(TRIGGER_SQL[name])
    connection.execute(f"PRAGMA application_id={APPLICATION_ID}")
    connection.execute(f"PRAGMA user_version={USER_VERSION}")


def _normalize_sql(value: str | None) -> str:
    return " ".join((value or "").split())


def _verify_schema(connection: sqlite3.Connection) -> None:
    expected = {
        ("table", "meta", "meta"): _normalize_sql(META_SQL),
        ("table", "records", "records"): _normalize_sql(RECORDS_SQL),
        **{
            ("trigger", name, "meta" if name.startswith("meta_") else "records"):
            _normalize_sql(sql)
            for name, sql in TRIGGER_SQL.items()
        },
    }
    rows = connection.execute(
        "SELECT type, name, tbl_name, sql FROM sqlite_schema "
        "WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name"
    ).fetchall()
    actual = {
        (row["type"], row["name"], row["tbl_name"]): _normalize_sql(row["sql"])
        for row in rows
    }
    if actual != expected:
        _fail("SCHEMA_TAMPERED", "SQLite schema objects or definitions differ from R016.")
    if connection.execute("PRAGMA application_id").fetchone()[0] != APPLICATION_ID:
        _fail("SCHEMA_TAMPERED", "SQLite application_id changed.")
    if connection.execute("PRAGMA user_version").fetchone()[0] != USER_VERSION:
        _fail("SCHEMA_TAMPERED", "SQLite user_version changed.")


def _integrity_and_profile(connection: sqlite3.Connection) -> dict[str, Any]:
    databases = connection.execute("PRAGMA database_list").fetchall()
    if [(row[1], row[2]) for row in databases] != [("main", databases[0][2])]:
        _fail("ATTACH_REJECTED", "Only the main SQLite database may be attached.")
    results = [row[0] for row in connection.execute("PRAGMA integrity_check").fetchall()]
    if results != ["ok"]:
        _fail("DATABASE_CORRUPT", "SQLite integrity_check did not return exactly 'ok'.")
    journal = str(connection.execute("PRAGMA journal_mode").fetchone()[0]).lower()
    synchronous = connection.execute("PRAGMA synchronous").fetchone()[0]
    trusted = connection.execute("PRAGMA trusted_schema").fetchone()[0]
    if journal != "delete" or synchronous != 3 or trusted != 0:
        _fail("STORAGE_PROFILE_MISMATCH", "SQLite profile drifted after open.")
    _verify_schema(connection)
    return {
        "integrity_check": "ok",
        "journal_mode": "DELETE",
        "synchronous": "EXTRA",
        "trusted_schema": "OFF",
        "transaction": "BEGIN IMMEDIATE",
    }


def _record_hash(
    *,
    sequence: int,
    previous_record_hash: str,
    object_id: str,
    event_raw: bytes,
    previous_state_root: str,
    next_state_root: str,
    receipt_hash: str,
    receipt_raw: bytes,
) -> str:
    subject = {
        "event_sha256": hashlib.sha256(event_raw).hexdigest(),
        "network": NETWORK,
        "next_state_root": next_state_root,
        "object_id": object_id,
        "previous_record_hash": previous_record_hash,
        "previous_state_root": previous_state_root,
        "profile": PROFILE,
        "protocol_version": PROTOCOL_VERSION,
        "receipt_hash": receipt_hash,
        "receipt_sha256": hashlib.sha256(receipt_raw).hexdigest(),
        "schema": RECORD_SCHEMA,
        "sequence": str(sequence),
        "status_authority": "NONE",
    }
    return _tagged_hash(
        "NEXUS/PCX/CUSTODY-DURABLE-RECORD/V0", canonical_json(subject)
    )


def _anchor_subject(anchor: dict[str, Any]) -> dict[str, Any]:
    subject = deepcopy(anchor)
    subject["anchor_id"] = ""
    return subject


def _make_anchor(
    *, sequence: int, record_hash: str, state_root: str, receipt_head: str
) -> dict[str, Any]:
    anchor = {
        "anchor_id": "",
        "network": NETWORK,
        "profile": PROFILE,
        "protocol_version": PROTOCOL_VERSION,
        "receipt_head": receipt_head,
        "record_hash": record_hash,
        "schema": ANCHOR_SCHEMA,
        "sequence": str(sequence),
        "state_root": state_root,
        "status_authority": "NONE",
    }
    anchor["anchor_id"] = _tagged_hash(
        "NEXUS/PCX/CUSTODY-DURABLE-ANCHOR/V0",
        canonical_json(_anchor_subject(anchor)),
    )
    return anchor


def _validate_anchor(value: Any) -> dict[str, Any]:
    expected = {
        "anchor_id",
        "network",
        "profile",
        "protocol_version",
        "receipt_head",
        "record_hash",
        "schema",
        "sequence",
        "state_root",
        "status_authority",
    }
    if not isinstance(value, dict) or set(value) != expected:
        _fail("ANCHOR_INVALID", "Anchor shape is not exact.")
    if (
        value["schema"] != ANCHOR_SCHEMA
        or value["network"] != NETWORK
        or value["profile"] != PROFILE
        or value["protocol_version"] != PROTOCOL_VERSION
        or value["status_authority"] != "NONE"
    ):
        _fail("ANCHOR_INVALID", "Anchor domain or authority is invalid.")
    sequence_raw = value["sequence"]
    if not isinstance(sequence_raw, str) or _SEQUENCE.fullmatch(sequence_raw) is None:
        _fail("ANCHOR_INVALID", "Anchor sequence is outside the fixed bound.")
    sequence = int(sequence_raw)
    _require_hash(value["state_root"], "state_root")
    _require_hash(value["anchor_id"], "anchor_id")
    _require_hash(value["record_hash"], "record_hash", allow_empty=sequence == 0)
    _require_hash(value["receipt_head"], "receipt_head", allow_empty=sequence == 0)
    if sequence == 0 and (value["record_hash"] != "" or value["receipt_head"] != ""):
        _fail("ANCHOR_INVALID", "Genesis anchor heads must be empty.")
    expected_id = _tagged_hash(
        "NEXUS/PCX/CUSTODY-DURABLE-ANCHOR/V0",
        canonical_json(_anchor_subject(value)),
    )
    if value["anchor_id"] != expected_id:
        _fail("ANCHOR_INVALID", "Anchor identity does not match its exact fields.")
    return deepcopy(value)


def _strict_canonical_object(raw: bytes, *, label: str) -> dict[str, Any]:
    def pairs(items: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, item in items:
            if key in result:
                _fail("ANCHOR_INVALID", f"{label} contains duplicate JSON key {key}.")
            result[key] = item
        return result

    try:
        value = json.loads(raw.decode("ascii"), object_pairs_hook=pairs)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise CustodyStoreError("ANCHOR_INVALID", f"{label} is not canonical JSON.") from exc
    if not isinstance(value, dict) or canonical_json(value) != raw:
        _fail("ANCHOR_INVALID", f"{label} is not exact canonical JSON.")
    return value


def load_custody_anchor(path: Path) -> dict[str, Any]:
    anchor_path = Path(path)
    if anchor_path.is_symlink():
        _fail("ANCHOR_INVALID", "Anchor input may not be a symlink.")
    try:
        with anchor_path.open("rb") as handle:
            raw = handle.read(MAX_ANCHOR_BYTES + 1)
    except OSError as exc:
        raise CustodyStoreError("ANCHOR_MISSING", str(path)) from exc
    if not raw or len(raw) > MAX_ANCHOR_BYTES:
        _fail("ANCHOR_INVALID", "Anchor is empty or exceeds 4096 bytes.")
    return _validate_anchor(_strict_canonical_object(raw, label="anchor"))


def _verify_expected_anchor(
    expected_anchor: dict[str, Any] | None,
    prefix_anchors: list[dict[str, Any]],
) -> str:
    if expected_anchor is None:
        return "UNANCHORED"
    supplied = _validate_anchor(expected_anchor)
    sequence = int(supplied["sequence"])
    if sequence >= len(prefix_anchors):
        _fail("ROLLBACK_DETECTED", "Database is shorter than the retained anchor.")
    if supplied != prefix_anchors[sequence]:
        _fail(
            "FORK_OR_TAMPER_DETECTED",
            "Database does not contain the exact retained anchored prefix.",
        )
    return "ANCHORED_PREFIX_CONFIRMED"


def _replay_locked(
    genesis_raw: bytes,
    expected_machine: Machine,
    initial_supply: int,
    connection: sqlite3.Connection,
    *,
    expected_anchor: dict[str, Any] | None,
) -> tuple[
    dict[str, Any],
    Machine,
    list[dict[str, Any]],
    dict[str, tuple[bytes, dict[str, str], dict[str, Any]]],
]:
    storage = _integrity_and_profile(connection)
    meta_rows = connection.execute("SELECT * FROM meta ORDER BY singleton").fetchall()
    if len(meta_rows) != 1:
        _fail("META_TAMPERED", "Store must contain exactly one metadata row.")
    meta = dict(meta_rows[0])
    if isinstance(meta.get("genesis_raw"), memoryview):
        meta["genesis_raw"] = bytes(meta["genesis_raw"])
    expected_meta = {
        "singleton": 1,
        "schema": STORE_SCHEMA,
        "network": NETWORK,
        "profile": PROFILE,
        "protocol_version": PROTOCOL_VERSION,
        "genesis_raw": genesis_raw,
        "genesis_sha256": hashlib.sha256(genesis_raw).hexdigest(),
        "initial_state_root": expected_machine.state_root,
        "initial_supply": str(initial_supply),
        "max_records": MAX_RECORDS,
        "status_authority": "NONE",
        "created_with_sqlite": sqlite3.sqlite_version,
    }
    if meta != expected_meta:
        _fail("META_TAMPERED", "Store metadata differs from explicit genesis or runtime.")

    machine = Machine(genesis_raw)
    prefix_anchors = [
        _make_anchor(
            sequence=0,
            record_hash="",
            state_root=machine.state_root,
            receipt_head="",
        )
    ]
    accepted: dict[str, tuple[bytes, dict[str, str], dict[str, Any]]] = {}
    rows = connection.execute("SELECT * FROM records ORDER BY sequence").fetchall()
    if len(rows) > MAX_RECORDS:
        _fail("RECORD_LIMIT_EXCEEDED", "Durable history exceeds the fixed bound.")
    previous_record_hash = ""
    for expected_sequence, raw_row in enumerate(rows, start=1):
        row = dict(raw_row)
        for field in ("event_raw", "receipt_raw"):
            if isinstance(row[field], memoryview):
                row[field] = bytes(row[field])
        if row["sequence"] != expected_sequence:
            _fail("RECORD_SEQUENCE_INVALID", "Record sequence is not contiguous.")
        if row["previous_record_hash"] != previous_record_hash:
            _fail("RECORD_CHAIN_INVALID", "Record hash chain is broken.")
        event_raw = row["event_raw"]
        receipt_raw = row["receipt_raw"]
        if type(event_raw) is not bytes or type(receipt_raw) is not bytes:
            _fail("RECORD_ENCODING_INVALID", "Event and receipt fields must be exact BLOB bytes.")
        if row["status_authority"] != "NONE":
            _fail("AUTHORITY_ESCALATION", "A durable record claimed authority.")
        before_root = machine.state_root
        before_height = machine.height
        try:
            receipt = machine.apply(event_raw)
        except CustodyKernelError as exc:
            raise CustodyStoreError(
                "REPLAY_REJECTED", f"record {expected_sequence}: {exc.code}: {exc}"
            ) from exc
        if machine.height != before_height + 1:
            _fail("REPLAY_REJECTED", "Stored record replayed as an exact retry.")
        expected_receipt_raw = canonical_json(receipt)
        expected_record_hash = _record_hash(
            sequence=expected_sequence,
            previous_record_hash=previous_record_hash,
            object_id=receipt["object_id"],
            event_raw=event_raw,
            previous_state_root=before_root,
            next_state_root=machine.state_root,
            receipt_hash=receipt["receipt_hash"],
            receipt_raw=expected_receipt_raw,
        )
        expected_fields = {
            "sequence": expected_sequence,
            "previous_record_hash": previous_record_hash,
            "record_hash": expected_record_hash,
            "object_id": receipt["object_id"],
            "event_raw": event_raw,
            "event_sha256": hashlib.sha256(event_raw).hexdigest(),
            "previous_state_root": before_root,
            "next_state_root": machine.state_root,
            "receipt_hash": receipt["receipt_hash"],
            "receipt_raw": expected_receipt_raw,
            "receipt_sha256": hashlib.sha256(expected_receipt_raw).hexdigest(),
            "status_authority": "NONE",
        }
        if row != expected_fields:
            _fail("RECORD_TAMPERED", f"Durable record {expected_sequence} is not exact.")
        if sum(int(item["amount"]) for item in machine.utxos()) != initial_supply:
            _fail("SUPPLY_DIVERGENCE", "Replayed synthetic supply changed.")
        previous_record_hash = expected_record_hash
        anchor = _make_anchor(
            sequence=expected_sequence,
            record_hash=expected_record_hash,
            state_root=machine.state_root,
            receipt_head=receipt["receipt_hash"],
        )
        prefix_anchors.append(anchor)
        accepted[receipt["object_id"]] = (event_raw, receipt, anchor)

    rollback_check = _verify_expected_anchor(expected_anchor, prefix_anchors)
    report = {
        "anchor": prefix_anchors[-1],
        "claims": [
            "Every stored event and receipt replayed from the explicit synthetic genesis under one ordered prefix."
        ],
        "height": machine.height,
        "non_claims": [
            "This local synthetic log is not money, production custody, network consensus, physical-power-loss proof, or rollback resistance without an independent anchor."
        ],
        "record_count": len(rows),
        "rollback_check": rollback_check,
        "schema": AUDIT_SCHEMA,
        "state_root": machine.state_root,
        "status": "PASS",
        "status_authority": "NONE",
        "storage": storage,
    }
    return report, machine, prefix_anchors, accepted


def init_custody_store(genesis: GenesisSource, db_path: Path) -> dict[str, Any]:
    genesis_raw, machine, initial_supply = _read_genesis(genesis)
    path = _validate_store_path(Path(db_path), creating=True)
    identity = _reserve_store_path(path)
    connection: sqlite3.Connection | None = None
    committed = False
    try:
        connection = _configure_connection(path, creating=True)
        connection.execute("BEGIN IMMEDIATE")
        _create_schema(connection)
        connection.execute(
            "INSERT INTO meta (singleton, schema, network, profile, protocol_version, "
            "genesis_raw, genesis_sha256, initial_state_root, initial_supply, max_records, "
            "status_authority, created_with_sqlite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                1,
                STORE_SCHEMA,
                NETWORK,
                PROFILE,
                PROTOCOL_VERSION,
                sqlite3.Binary(genesis_raw),
                hashlib.sha256(genesis_raw).hexdigest(),
                machine.state_root,
                str(initial_supply),
                MAX_RECORDS,
                "NONE",
                sqlite3.sqlite_version,
            ),
        )
        connection.execute("COMMIT")
        committed = True
        _fsync_directory(path.parent)
        connection.execute("BEGIN IMMEDIATE")
        report, _machine, _anchors, _accepted = _replay_locked(
            genesis_raw,
            machine,
            initial_supply,
            connection,
            expected_anchor=None,
        )
        connection.execute("COMMIT")
        return {**report, "created": True}
    except CustodyStoreError:
        if connection is not None and connection.in_transaction:
            connection.execute("ROLLBACK")
        raise
    except (OSError, sqlite3.Error) as exc:
        if connection is not None and connection.in_transaction:
            connection.execute("ROLLBACK")
        raise CustodyStoreError("STORE_INIT_FAILED", str(exc)) from exc
    finally:
        if connection is not None:
            connection.close()
        if not committed:
            _cleanup_reservation(path, identity)


def audit_custody_store(
    genesis: GenesisSource,
    db_path: Path,
    expected_anchor: dict[str, Any] | None = None,
) -> dict[str, Any]:
    genesis_raw, machine, initial_supply = _read_genesis(genesis)
    path = _validate_store_path(Path(db_path), creating=False)
    connection = _configure_connection(path, creating=False)
    try:
        connection.execute("BEGIN IMMEDIATE")
        report, _machine, _anchors, _accepted = _replay_locked(
            genesis_raw,
            machine,
            initial_supply,
            connection,
            expected_anchor=expected_anchor,
        )
        connection.execute("COMMIT")
        return report
    except CustodyStoreError:
        if connection.in_transaction:
            connection.execute("ROLLBACK")
        raise
    except sqlite3.Error as exc:
        if connection.in_transaction:
            connection.execute("ROLLBACK")
        raise CustodyStoreError("STORE_AUDIT_FAILED", str(exc)) from exc
    finally:
        connection.close()


def _fault(stage: str, selected: str | None) -> None:
    if stage == selected:
        os._exit(97)


def apply_custody_event(
    genesis: GenesisSource,
    db_path: Path,
    raw_event: bytes,
    expected_anchor: dict[str, Any] | None = None,
    fault_stage: str | None = None,
) -> dict[str, Any]:
    if type(raw_event) is not bytes or not 1 <= len(raw_event) <= MAX_WIRE_BYTES:
        _fail("EVENT_ENCODING_INVALID", "Event must be 1..65536 exact bytes.")
    admitted_stages = {
        None,
        "BEFORE_BEGIN",
        "AFTER_BEGIN",
        "AFTER_REPLAY",
        "BEFORE_INSERT",
        "AFTER_INSERT",
        "BEFORE_COMMIT",
        "AFTER_COMMIT_BEFORE_ACK",
    }
    if fault_stage not in admitted_stages:
        _fail("FAULT_STAGE_INVALID", "Unknown internal fault stage.")
    genesis_raw, initial_machine, initial_supply = _read_genesis(genesis)
    path = _validate_store_path(Path(db_path), creating=False)
    connection = _configure_connection(path, creating=False)
    committed = False
    try:
        _fault("BEFORE_BEGIN", fault_stage)
        connection.execute("BEGIN IMMEDIATE")
        _fault("AFTER_BEGIN", fault_stage)
        audit, machine, prefix_anchors, accepted = _replay_locked(
            genesis_raw,
            initial_machine,
            initial_supply,
            connection,
            expected_anchor=expected_anchor,
        )
        _fault("AFTER_REPLAY", fault_stage)
        before_root = machine.state_root
        before_height = machine.height
        try:
            receipt = machine.apply(raw_event)
        except CustodyKernelError as exc:
            raise CustodyStoreError("EVENT_REJECTED", f"{exc.code}: {exc}") from exc

        if machine.height == before_height:
            existing = accepted.get(receipt["object_id"])
            if existing is None or existing[0] != raw_event or existing[1] != receipt:
                _fail("EVENT_RETRY_INVALID", "Kernel retry did not match one exact stored record.")
            _fault("BEFORE_COMMIT", fault_stage)
            connection.execute("COMMIT")
            committed = True
            _fault("AFTER_COMMIT_BEFORE_ACK", fault_stage)
            return {
                "anchor": existing[2],
                "decision": "ACCEPTED",
                "idempotent": True,
                "reason_code": "EXACT_REPLAY",
                "receipt": receipt,
                "rollback_check": audit["rollback_check"],
                "schema": APPLY_SCHEMA,
                "status": "ACKNOWLEDGED_AFTER_COMMIT",
                "status_authority": "NONE",
                "store_anchor": prefix_anchors[-1],
            }
        if machine.height != before_height + 1 or receipt["before_root"] != before_root:
            _fail("KERNEL_TRANSITION_INVALID", "Accepted event did not advance exactly one state.")
        if machine.state_root != receipt["after_root"]:
            _fail("KERNEL_TRANSITION_INVALID", "Receipt next root differs from kernel state.")
        if sum(int(item["amount"]) for item in machine.utxos()) != initial_supply:
            _fail("SUPPLY_DIVERGENCE", "Accepted event changed synthetic supply.")
        sequence = len(prefix_anchors)
        if sequence > MAX_RECORDS:
            _fail("RECORD_LIMIT_EXCEEDED", f"At most {MAX_RECORDS} records are admitted.")
        receipt_raw = canonical_json(receipt)
        previous_record_hash = prefix_anchors[-1]["record_hash"]
        record_hash = _record_hash(
            sequence=sequence,
            previous_record_hash=previous_record_hash,
            object_id=receipt["object_id"],
            event_raw=raw_event,
            previous_state_root=before_root,
            next_state_root=machine.state_root,
            receipt_hash=receipt["receipt_hash"],
            receipt_raw=receipt_raw,
        )
        _fault("BEFORE_INSERT", fault_stage)
        connection.execute(
            "INSERT INTO records (sequence, previous_record_hash, record_hash, object_id, "
            "event_raw, event_sha256, previous_state_root, next_state_root, receipt_hash, "
            "receipt_raw, receipt_sha256, status_authority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                sequence,
                previous_record_hash,
                record_hash,
                receipt["object_id"],
                sqlite3.Binary(raw_event),
                hashlib.sha256(raw_event).hexdigest(),
                before_root,
                machine.state_root,
                receipt["receipt_hash"],
                sqlite3.Binary(receipt_raw),
                hashlib.sha256(receipt_raw).hexdigest(),
                "NONE",
            ),
        )
        next_anchor = _make_anchor(
            sequence=sequence,
            record_hash=record_hash,
            state_root=machine.state_root,
            receipt_head=receipt["receipt_hash"],
        )
        _fault("AFTER_INSERT", fault_stage)
        _fault("BEFORE_COMMIT", fault_stage)
        connection.execute("COMMIT")
        committed = True
        _fault("AFTER_COMMIT_BEFORE_ACK", fault_stage)
        return {
            "anchor": next_anchor,
            "decision": "ACCEPTED",
            "idempotent": False,
            "reason_code": "VALID_CUSTODY_EVENT",
            "receipt": receipt,
            "rollback_check": audit["rollback_check"],
            "schema": APPLY_SCHEMA,
            "status": "ACKNOWLEDGED_AFTER_COMMIT",
            "status_authority": "NONE",
            "store_anchor": next_anchor,
        }
    except CustodyStoreError:
        if not committed and connection.in_transaction:
            connection.execute("ROLLBACK")
        raise
    except sqlite3.Error as exc:
        if not committed and connection.in_transaction:
            connection.execute("ROLLBACK")
        raise CustodyStoreError("STORE_APPLY_FAILED", str(exc)) from exc
    finally:
        connection.close()


def _atomic_create_bytes(path: Path, data: bytes) -> None:
    output = Path(path).absolute()
    try:
        parent = output.parent.resolve(strict=True)
    except OSError as exc:
        raise CustodyStoreError("ANCHOR_PATH_INVALID", str(exc)) from exc
    if parent != output.parent.absolute() or output.exists() or output.is_symlink():
        _fail("ANCHOR_PATH_INVALID", "Anchor output must be a new non-symlink path.")
    temporary: str | None = None
    try:
        with tempfile.NamedTemporaryFile(dir=parent, delete=False) as handle:
            temporary = handle.name
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        try:
            os.link(temporary, output)
        except FileExistsError as exc:
            raise CustodyStoreError("ANCHOR_PATH_INVALID", "Anchor output race was lost.") from exc
        _fsync_directory(parent)
    except CustodyStoreError:
        raise
    except OSError as exc:
        raise CustodyStoreError("ANCHOR_WRITE_FAILED", str(exc)) from exc
    finally:
        if temporary is not None:
            try:
                Path(temporary).unlink(missing_ok=True)
            except OSError:
                pass


def export_custody_anchor(
    genesis: GenesisSource,
    db_path: Path,
    output_path: Path,
    expected_anchor: dict[str, Any] | None = None,
) -> dict[str, Any]:
    db = _validate_store_path(Path(db_path), creating=False)
    output = Path(output_path).absolute()
    if output in {
        db,
        Path(str(db) + "-journal"),
        Path(str(db) + "-wal"),
        Path(str(db) + "-shm"),
    }:
        _fail("ANCHOR_PATH_INVALID", "Anchor must be outside the SQLite namespace.")
    report = audit_custody_store(
        genesis, db, expected_anchor=expected_anchor
    )
    anchor = report["anchor"]
    _atomic_create_bytes(output, canonical_json(anchor))
    return anchor


__all__ = [
    "STORE_SCHEMA",
    "RECORD_SCHEMA",
    "ANCHOR_SCHEMA",
    "AUDIT_SCHEMA",
    "APPLY_SCHEMA",
    "MAX_RECORDS",
    "CustodyStoreError",
    "init_custody_store",
    "audit_custody_store",
    "apply_custody_event",
    "load_custody_anchor",
    "export_custody_anchor",
]
