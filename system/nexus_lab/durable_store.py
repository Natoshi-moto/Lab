"""Crash-consistent local replay store for the synthetic R013 value kernel.

This module deliberately does less than a wallet or a ledger service.  It has
no key generation, signing, minting, networking, repair, snapshot import or
fork-choice operation.  It stores at most ``MAX_RECORDS`` exact, already-signed
R013 transfer envelopes and derives every state transition by replaying them
from the frozen synthetic genesis.

The database profile is intentionally conservative for the runtime reviewed by
R014: SQLite rollback journaling in DELETE mode, synchronous=EXTRA, one writer
obtained with BEGIN IMMEDIATE, and acknowledgement only after COMMIT returns.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import tempfile
from copy import deepcopy
from pathlib import Path
from typing import Any

from .util import NexusError
from .value_kernel import (
    GENESIS_SUPPLY,
    MAX_RAW_BYTES,
    MAX_SUITE_BYTES,
    NETWORK_ID,
    PINNED_GENESIS_ID,
    SUITE_SCHEMA,
    ValueKernelError,
    _History,
    _decode_raw,
    _validate_genesis,
    canonical_bytes,
    strict_json,
    tagged_hash,
)


STORE_SCHEMA = "nexus.pcx-durable-store/v0"
RECORD_SCHEMA = "nexus.pcx-durable-record/v0"
ANCHOR_SCHEMA = "nexus.pcx-durable-anchor/v0"
AUDIT_SCHEMA = "nexus.pcx-durable-audit/v0"
APPLY_SCHEMA = "nexus.pcx-durable-apply/v0"
MAX_RECORDS = 256
APPLICATION_ID = 0x4E585034  # ASCII-ish "NXP4", reserved for this prototype.
USER_VERSION = 14
BUSY_TIMEOUT_MS = 15_000
HASH_RE = re.compile(r"^[0-9a-f]{64}$")
ANCHOR_SEQUENCE_RE = re.compile(
    r"^(?:0|[1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-6])$"
)
MAX_ANCHOR_BYTES = 4096


META_SQL = """CREATE TABLE meta (
    singleton INTEGER PRIMARY KEY NOT NULL CHECK (singleton = 1),
    schema TEXT NOT NULL,
    network_id TEXT NOT NULL,
    genesis_id TEXT NOT NULL,
    genesis_raw BLOB NOT NULL,
    genesis_raw_sha256 TEXT NOT NULL,
    initial_state_root TEXT NOT NULL,
    status_authority TEXT NOT NULL CHECK (status_authority = 'NONE'),
    max_records INTEGER NOT NULL CHECK (max_records > 0),
    created_with_sqlite TEXT NOT NULL
) STRICT"""

RECORDS_SQL = """CREATE TABLE records (
    sequence INTEGER PRIMARY KEY NOT NULL CHECK (sequence > 0),
    previous_record_hash TEXT NOT NULL,
    record_hash TEXT NOT NULL UNIQUE,
    tx_id TEXT NOT NULL UNIQUE,
    tx_raw BLOB NOT NULL UNIQUE CHECK (length(tx_raw) BETWEEN 1 AND 65536),
    tx_sha256 TEXT NOT NULL,
    previous_state_root TEXT NOT NULL,
    next_state_root TEXT NOT NULL,
    receipt_hash TEXT NOT NULL UNIQUE,
    receipt_raw BLOB NOT NULL,
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

EXPECTED_COLUMNS = {
    "meta": (
        (0, "singleton", "INTEGER", 1, None, 1, 0),
        (1, "schema", "TEXT", 1, None, 0, 0),
        (2, "network_id", "TEXT", 1, None, 0, 0),
        (3, "genesis_id", "TEXT", 1, None, 0, 0),
        (4, "genesis_raw", "BLOB", 1, None, 0, 0),
        (5, "genesis_raw_sha256", "TEXT", 1, None, 0, 0),
        (6, "initial_state_root", "TEXT", 1, None, 0, 0),
        (7, "status_authority", "TEXT", 1, None, 0, 0),
        (8, "max_records", "INTEGER", 1, None, 0, 0),
        (9, "created_with_sqlite", "TEXT", 1, None, 0, 0),
    ),
    "records": (
        (0, "sequence", "INTEGER", 1, None, 1, 0),
        (1, "previous_record_hash", "TEXT", 1, None, 0, 0),
        (2, "record_hash", "TEXT", 1, None, 0, 0),
        (3, "tx_id", "TEXT", 1, None, 0, 0),
        (4, "tx_raw", "BLOB", 1, None, 0, 0),
        (5, "tx_sha256", "TEXT", 1, None, 0, 0),
        (6, "previous_state_root", "TEXT", 1, None, 0, 0),
        (7, "next_state_root", "TEXT", 1, None, 0, 0),
        (8, "receipt_hash", "TEXT", 1, None, 0, 0),
        (9, "receipt_raw", "BLOB", 1, None, 0, 0),
        (10, "status_authority", "TEXT", 1, None, 0, 0),
    ),
}


class DurableStoreError(NexusError):
    """Stable fail-closed error from the R014 durability boundary."""

    def __init__(self, code: str, detail: str) -> None:
        self.code = code
        self.detail = detail
        super().__init__(f"{code}: {detail}")


def _fail(code: str, detail: str) -> None:
    raise DurableStoreError(code, detail)


def _hash(value: Any, label: str, *, allow_empty: bool = False) -> str:
    if allow_empty and value == "":
        return ""
    if not isinstance(value, str) or HASH_RE.fullmatch(value) is None:
        _fail("ANCHOR_INVALID", f"{label} must be a lowercase SHA-256 digest.")
    return value


def _fault(stage: str, selected: str | None) -> None:
    """Hard-exit only when an explicit test-only fault stage is selected."""

    if selected == stage:
        os._exit(97)


def _validate_store_path(path: Path, *, creating: bool) -> Path:
    candidate = Path(path)
    if candidate.name in {"", ".", ".."}:
        _fail("PATH_INVALID", "The store path must name one database file.")
    parent = candidate.parent
    if creating:
        parent.mkdir(parents=True, exist_ok=True)
    if not parent.is_dir():
        _fail("PATH_INVALID", "The store parent is not a directory.")
    if parent.resolve() != parent.absolute():
        _fail("PATH_SYMLINK_REJECTED", "Symlinked store-directory components are not admitted.")
    if candidate.is_symlink():
        _fail("PATH_SYMLINK_REJECTED", "A durable store may not be a symlink.")
    if creating and candidate.exists():
        _fail("STORE_EXISTS", "Refusing to replace an existing path.")
    if not creating and not candidate.is_file():
        _fail("STORE_MISSING", "The durable store does not exist or is not a regular file.")
    return candidate.absolute()


def _reserve_store_path(path: Path) -> tuple[int, int]:
    """Atomically reserve a new database path and return its device/inode."""

    flags = os.O_CREAT | os.O_EXCL | os.O_RDWR
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    try:
        descriptor = os.open(path, flags, 0o600)
    except FileExistsError as exc:
        raise DurableStoreError("STORE_EXISTS", "Refusing to replace an existing path.") from exc
    except OSError as exc:
        raise DurableStoreError("STORE_RESERVATION_FAILED", str(exc)) from exc
    try:
        reserved = os.fstat(descriptor)
        os.fsync(descriptor)
        return reserved.st_dev, reserved.st_ino
    finally:
        os.close(descriptor)


def _cleanup_reserved_store(path: Path, identity: tuple[int, int]) -> None:
    """Clean only this process's failed reservation, with database unlinked last."""

    try:
        current = path.stat(follow_symlinks=False)
    except FileNotFoundError:
        return
    except OSError:
        return
    if (current.st_dev, current.st_ino) != identity:
        return
    try:
        Path(str(path) + "-journal").unlink(missing_ok=True)
    except OSError:
        pass
    try:
        path.unlink()
    except OSError:
        return


def _atomic_create_bytes(path: Path, data: bytes) -> None:
    """Atomically publish a complete new file without replacement semantics."""

    path.parent.mkdir(parents=True, exist_ok=True)
    temp_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
            temp_name = handle.name
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        try:
            os.link(temp_name, path)
        except FileExistsError as exc:
            raise DurableStoreError(
                "ANCHOR_PATH_INVALID", "Existing anchors are never replaced."
            ) from exc
        directory_fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    except DurableStoreError:
        raise
    except OSError as exc:
        raise DurableStoreError("ANCHOR_WRITE_FAILED", str(exc)) from exc
    finally:
        if temp_name is not None:
            try:
                Path(temp_name).unlink(missing_ok=True)
            except OSError:
                pass


def _load_frozen_genesis(root: Path) -> tuple[bytes, dict[str, dict[str, str]], str]:
    suite_path = (
        Path(root)
        / "experiments"
        / "R013_PCX_CONSERVED_CLAIM"
        / "fixtures"
        / "SUITE.json"
    )
    try:
        with suite_path.open("rb") as handle:
            raw_suite = handle.read(MAX_SUITE_BYTES + 1)
    except OSError as exc:
        raise DurableStoreError("FROZEN_GENESIS_MISSING", str(suite_path)) from exc
    if not raw_suite or len(raw_suite) > MAX_SUITE_BYTES:
        _fail("FROZEN_GENESIS_INVALID", "The R013 suite is empty or exceeds its bound.")
    try:
        suite = strict_json(raw_suite)
        if not isinstance(suite, dict) or set(suite) != {
            "schema",
            "suite_id",
            "genesis_b64",
            "histories",
            "status_authority",
        }:
            _fail("FROZEN_GENESIS_INVALID", "The R013 suite envelope is not exact.")
        if suite["schema"] != SUITE_SCHEMA or suite["status_authority"] != "NONE":
            _fail("FROZEN_GENESIS_INVALID", "The R013 suite identity or authority changed.")
        genesis_raw = _decode_raw(suite["genesis_b64"])
        _genesis, initial_state, initial_root = _validate_genesis(genesis_raw)
    except ValueKernelError as exc:
        raise DurableStoreError("FROZEN_GENESIS_INVALID", str(exc)) from exc
    return genesis_raw, initial_state, initial_root


def _preflight_rollback_header(path: Path) -> None:
    """Reject WAL/corrupt headers before invoking SQLite recovery code."""

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
        raise DurableStoreError("STORE_HEADER_UNREADABLE", str(exc)) from exc
    if len(header) != 100 or header[:16] != b"SQLite format 3\x00":
        _fail("DATABASE_CORRUPT", "The file has no complete SQLite database header.")
    if header[18] != 1 or header[19] != 1:
        _fail(
            "STORAGE_PROFILE_MISMATCH",
            "SQLite header read/write versions are not rollback-journal format; SQLite was not opened.",
        )
    if Path(str(path) + "-wal").exists() or Path(str(path) + "-shm").exists():
        _fail(
            "STORAGE_PROFILE_MISMATCH",
            "WAL sidecar files are not admitted; SQLite was not opened.",
        )


def _configure_connection(path: Path, *, creating: bool) -> sqlite3.Connection:
    if not creating:
        _preflight_rollback_header(path)
    try:
        connection = sqlite3.connect(
            str(path),
            timeout=BUSY_TIMEOUT_MS / 1000,
            isolation_level=None,
        )
        connection.row_factory = sqlite3.Row
        connection.enable_load_extension(False)
        connection.execute(f"PRAGMA busy_timeout={BUSY_TIMEOUT_MS}")
        connection.execute("PRAGMA trusted_schema=OFF")
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA temp_store=MEMORY")

        existing_mode = str(connection.execute("PRAGMA journal_mode").fetchone()[0]).lower()
        if not creating and existing_mode != "delete":
            _fail(
                "STORAGE_PROFILE_MISMATCH",
                f"journal_mode must already be DELETE, not {existing_mode!r}; no conversion was attempted.",
            )
        configured_mode = str(
            connection.execute("PRAGMA journal_mode=DELETE").fetchone()[0]
        ).lower()
        if configured_mode != "delete":
            _fail("STORAGE_PROFILE_MISMATCH", "SQLite did not enter DELETE journal mode.")
        connection.execute("PRAGMA synchronous=EXTRA")
        synchronous = int(connection.execute("PRAGMA synchronous").fetchone()[0])
        trusted_schema = int(connection.execute("PRAGMA trusted_schema").fetchone()[0])
        if synchronous != 3 or trusted_schema != 0:
            _fail("STORAGE_PROFILE_MISMATCH", "EXTRA synchronization and trusted_schema=OFF are required.")
        databases = connection.execute("PRAGMA database_list").fetchall()
        if any(str(row[1]) not in {"main", "temp"} for row in databases):
            _fail("ATTACH_REJECTED", "Attached databases are outside the R014 boundary.")
        return connection
    except DurableStoreError:
        try:
            connection.close()
        except (UnboundLocalError, sqlite3.Error):
            pass
        raise
    except (OSError, sqlite3.Error) as exc:
        try:
            connection.close()
        except (UnboundLocalError, sqlite3.Error):
            pass
        raise DurableStoreError("STORE_OPEN_FAILED", str(exc)) from exc


def _create_schema(connection: sqlite3.Connection) -> None:
    connection.execute(META_SQL)
    connection.execute(RECORDS_SQL)
    for sql in TRIGGER_SQL.values():
        connection.execute(sql)
    connection.execute(f"PRAGMA application_id={APPLICATION_ID}")
    connection.execute(f"PRAGMA user_version={USER_VERSION}")


def _schema_signature(connection: sqlite3.Connection) -> dict[str, Any]:
    objects = [
        (str(row[0]), str(row[1]), str(row[2]))
        for row in connection.execute(
            "SELECT type, name, tbl_name FROM sqlite_schema "
            "WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name"
        ).fetchall()
    ]
    expected_objects = sorted(
        [("table", "meta", "meta"), ("table", "records", "records")]
        + [("trigger", name, "meta" if name.startswith("meta_") else "records") for name in TRIGGER_SQL]
    )
    if objects != expected_objects:
        _fail("SCHEMA_TAMPERED", f"Unexpected SQLite objects: {objects!r}")

    tables = {
        str(row[0]): str(row[1])
        for row in connection.execute(
            "SELECT name, sql FROM sqlite_schema WHERE type='table' ORDER BY name"
        ).fetchall()
        if not str(row[0]).startswith("sqlite_")
    }
    if tables != {"meta": META_SQL, "records": RECORDS_SQL}:
        _fail("SCHEMA_TAMPERED", "Exact STRICT table definitions changed.")

    columns: dict[str, tuple[tuple[Any, ...], ...]] = {}
    for table, expected in EXPECTED_COLUMNS.items():
        actual = tuple(tuple(row) for row in connection.execute(f"PRAGMA table_xinfo({table})"))
        if actual != expected:
            _fail("SCHEMA_TAMPERED", f"Column contract changed for {table}.")
        columns[table] = actual

    table_list = {
        str(row[1]): (str(row[2]), int(row[4]), int(row[5]))
        for row in connection.execute("PRAGMA table_list").fetchall()
        if str(row[1]) in {"meta", "records"}
    }
    if table_list != {"meta": ("table", 0, 1), "records": ("table", 0, 1)}:
        _fail("SCHEMA_TAMPERED", "The R014 tables are not exact STRICT tables.")

    triggers = {
        str(row[0]): str(row[1])
        for row in connection.execute(
            "SELECT name, sql FROM sqlite_schema WHERE type='trigger' ORDER BY name"
        ).fetchall()
    }
    if triggers != TRIGGER_SQL:
        _fail("SCHEMA_TAMPERED", "Append-only trigger definitions changed.")

    signature = {
        "objects": [list(item) for item in objects],
        "columns": {name: [list(item) for item in value] for name, value in columns.items()},
        "table_sha256": {
            name: hashlib.sha256(sql.encode("utf-8")).hexdigest()
            for name, sql in sorted(tables.items())
        },
        "trigger_sha256": {
            name: hashlib.sha256(sql.encode("utf-8")).hexdigest()
            for name, sql in sorted(triggers.items())
        },
    }
    return signature


def _integrity_and_profile(connection: sqlite3.Connection) -> dict[str, Any]:
    try:
        integrity_rows = [str(row[0]) for row in connection.execute("PRAGMA integrity_check")]
        if integrity_rows != ["ok"]:
            _fail("DATABASE_CORRUPT", "; ".join(integrity_rows[:8]))
        if connection.execute("PRAGMA foreign_key_check").fetchall():
            _fail("DATABASE_CORRUPT", "Foreign-key check returned violations.")
        journal_mode = str(connection.execute("PRAGMA journal_mode").fetchone()[0]).lower()
        synchronous = int(connection.execute("PRAGMA synchronous").fetchone()[0])
        trusted_schema = int(connection.execute("PRAGMA trusted_schema").fetchone()[0])
        application_id = int(connection.execute("PRAGMA application_id").fetchone()[0])
        user_version = int(connection.execute("PRAGMA user_version").fetchone()[0])
        if (
            journal_mode != "delete"
            or synchronous != 3
            or trusted_schema != 0
            or application_id != APPLICATION_ID
            or user_version != USER_VERSION
        ):
            _fail("STORAGE_PROFILE_MISMATCH", "The exact R014 SQLite profile is not active.")
        signature = _schema_signature(connection)
        return {
            "engine": "sqlite",
            "sqlite_version": sqlite3.sqlite_version,
            "journal_mode": journal_mode,
            "synchronous": synchronous,
            "trusted_schema": trusted_schema,
            "application_id": application_id,
            "user_version": user_version,
            "integrity_check": "ok",
            "schema_sha256": hashlib.sha256(canonical_bytes(signature)).hexdigest(),
            "filesystem_scope": "UNVERIFIED_REQUIRED_ASSUMPTION_LOCAL_HONEST_FILESYSTEM",
        }
    except DurableStoreError:
        raise
    except sqlite3.Error as exc:
        raise DurableStoreError("DATABASE_CORRUPT", str(exc)) from exc


def _anchor_subject(anchor: dict[str, Any]) -> dict[str, Any]:
    subject = deepcopy(anchor)
    subject["anchor_id"] = ""
    return subject


def _make_anchor(
    *,
    sequence: int,
    record_hash: str,
    state_root: str,
    receipt_head: str,
) -> dict[str, Any]:
    anchor = {
        "schema": ANCHOR_SCHEMA,
        "network_id": NETWORK_ID,
        "genesis_id": PINNED_GENESIS_ID,
        "sequence": str(sequence),
        "record_hash": record_hash,
        "state_root": state_root,
        "receipt_head": receipt_head,
        "status_authority": "NONE",
        "anchor_id": "",
    }
    anchor["anchor_id"] = tagged_hash(
        "NEXUS/PCX/DURABLE-ANCHOR/V0", canonical_bytes(_anchor_subject(anchor))
    )
    return anchor


def _validate_anchor(value: Any) -> dict[str, Any]:
    expected_keys = {
        "schema",
        "network_id",
        "genesis_id",
        "sequence",
        "record_hash",
        "state_root",
        "receipt_head",
        "status_authority",
        "anchor_id",
    }
    if not isinstance(value, dict) or set(value) != expected_keys:
        _fail("ANCHOR_INVALID", "The caller anchor shape is not exact.")
    if (
        value["schema"] != ANCHOR_SCHEMA
        or value["network_id"] != NETWORK_ID
        or value["genesis_id"] != PINNED_GENESIS_ID
        or value["status_authority"] != "NONE"
    ):
        _fail("ANCHOR_INVALID", "The caller anchor domain or authority is invalid.")
    sequence_raw = value["sequence"]
    if (
        not isinstance(sequence_raw, str)
        or ANCHOR_SEQUENCE_RE.fullmatch(sequence_raw) is None
        or int(sequence_raw) > MAX_RECORDS
    ):
        _fail("ANCHOR_INVALID", "Anchor sequence is not a bounded canonical decimal string.")
    sequence = int(sequence_raw)
    _hash(value["state_root"], "state_root")
    _hash(value["anchor_id"], "anchor_id")
    _hash(value["record_hash"], "record_hash", allow_empty=sequence == 0)
    _hash(value["receipt_head"], "receipt_head", allow_empty=sequence == 0)
    if sequence == 0 and (value["record_hash"] != "" or value["receipt_head"] != ""):
        _fail("ANCHOR_INVALID", "Genesis anchor heads must be empty.")
    expected_id = tagged_hash(
        "NEXUS/PCX/DURABLE-ANCHOR/V0", canonical_bytes(_anchor_subject(value))
    )
    if value["anchor_id"] != expected_id:
        _fail("ANCHOR_INVALID", "Anchor identity does not match its exact fields.")
    return deepcopy(value)


def load_anchor(path: Path) -> dict[str, Any]:
    """Load one exact canonical caller-held anchor without repairing it."""

    try:
        anchor_path = Path(path)
        if anchor_path.is_symlink():
            _fail("ANCHOR_INVALID", "Anchor input may not be a symlink.")
        with anchor_path.open("rb") as handle:
            raw = handle.read(MAX_ANCHOR_BYTES + 1)
    except OSError as exc:
        raise DurableStoreError("ANCHOR_MISSING", str(path)) from exc
    if not 1 <= len(raw) <= MAX_ANCHOR_BYTES:
        _fail("ANCHOR_INVALID", "Anchor file is empty or exceeds 4096 bytes.")
    try:
        value = strict_json(raw)
    except ValueKernelError as exc:
        raise DurableStoreError("ANCHOR_INVALID", str(exc)) from exc
    if canonical_bytes(value) != raw:
        _fail("ANCHOR_INVALID", "Anchor file is not exact canonical JSON.")
    return _validate_anchor(value)


def _record_hash(
    *,
    sequence: int,
    previous_record_hash: str,
    tx_id: str,
    tx_raw: bytes,
    previous_state_root: str,
    next_state_root: str,
    receipt_hash: str,
    receipt_raw: bytes,
) -> str:
    subject = {
        "schema": RECORD_SCHEMA,
        "network_id": NETWORK_ID,
        "genesis_id": PINNED_GENESIS_ID,
        "sequence": str(sequence),
        "previous_record_hash": previous_record_hash,
        "tx_id": tx_id,
        "tx_sha256": hashlib.sha256(tx_raw).hexdigest(),
        "previous_state_root": previous_state_root,
        "next_state_root": next_state_root,
        "receipt_hash": receipt_hash,
        "receipt_raw_sha256": hashlib.sha256(receipt_raw).hexdigest(),
        "status_authority": "NONE",
    }
    return tagged_hash("NEXUS/PCX/DURABLE-RECORD/V0", canonical_bytes(subject))


def _verify_expected_anchor(
    expected_anchor: dict[str, Any] | None,
    prefix_anchors: list[dict[str, Any]],
) -> str:
    if expected_anchor is None:
        return "UNANCHORED"
    supplied = _validate_anchor(expected_anchor)
    sequence = int(supplied["sequence"])
    if sequence >= len(prefix_anchors):
        _fail(
            "ROLLBACK_DETECTED",
            "The database is shorter than the independently held anchor.",
        )
    if supplied != prefix_anchors[sequence]:
        _fail(
            "FORK_OR_TAMPER_DETECTED",
            "The database does not contain the independently held anchored prefix.",
        )
    return "ANCHORED_PREFIX_CONFIRMED"


def _replay_locked(
    root: Path,
    connection: sqlite3.Connection,
    *,
    expected_anchor: dict[str, Any] | None,
) -> tuple[dict[str, Any], _History, list[dict[str, Any]]]:
    storage = _integrity_and_profile(connection)
    genesis_raw, initial_state, initial_root = _load_frozen_genesis(root)

    meta_rows = connection.execute("SELECT * FROM meta ORDER BY singleton").fetchall()
    if len(meta_rows) != 1:
        _fail("META_TAMPERED", "The store must contain exactly one metadata row.")
    meta = dict(meta_rows[0])
    expected_meta = {
        "singleton": 1,
        "schema": STORE_SCHEMA,
        "network_id": NETWORK_ID,
        "genesis_id": PINNED_GENESIS_ID,
        "genesis_raw": genesis_raw,
        "genesis_raw_sha256": hashlib.sha256(genesis_raw).hexdigest(),
        "initial_state_root": initial_root,
        "status_authority": "NONE",
        "max_records": MAX_RECORDS,
        "created_with_sqlite": sqlite3.sqlite_version,
    }
    if meta != expected_meta:
        _fail("META_TAMPERED", "Store metadata differs from the exact runtime and frozen genesis.")

    machine = _History(initial_state, initial_root)
    prefix_anchors = [
        _make_anchor(
            sequence=0,
            record_hash="",
            state_root=initial_root,
            receipt_head="",
        )
    ]
    rows = connection.execute("SELECT * FROM records ORDER BY sequence").fetchall()
    if len(rows) > MAX_RECORDS:
        _fail("RECORD_LIMIT_EXCEEDED", "The durable history exceeds its reviewed bound.")

    previous_record_hash = ""
    for expected_sequence, raw_row in enumerate(rows, start=1):
        row = dict(raw_row)
        if row["sequence"] != expected_sequence:
            _fail("RECORD_SEQUENCE_INVALID", "Durable sequence is not contiguous.")
        if row["previous_record_hash"] != previous_record_hash:
            _fail("RECORD_CHAIN_INVALID", "Durable record hash chain is broken.")
        tx_raw = row["tx_raw"]
        receipt_raw = row["receipt_raw"]
        if not isinstance(tx_raw, bytes) or not isinstance(receipt_raw, bytes):
            _fail("RECORD_ENCODING_INVALID", "Exact transaction and receipt bytes must be BLOBs.")
        if row["status_authority"] != "NONE":
            _fail("AUTHORITY_ESCALATION", "A durable record claimed authority.")

        result = machine.apply(f"DURABLE-{expected_sequence:06d}", tx_raw)
        if (
            result["decision"] != "CANDIDATE_ACCEPTED"
            or result["reason_code"] != "VALID_CONSERVED_TRANSFER"
            or result["idempotent"] != "FALSE"
        ):
            _fail(
                "REPLAY_REJECTED",
                f"Stored transaction {expected_sequence} no longer replays: {result['reason_code']}.",
            )
        receipt = machine.receipts[-1]
        expected_receipt_raw = canonical_bytes(receipt)
        expected_record_hash = _record_hash(
            sequence=expected_sequence,
            previous_record_hash=previous_record_hash,
            tx_id=result["tx_id"],
            tx_raw=tx_raw,
            previous_state_root=result["previous_state_root"],
            next_state_root=result["next_state_root"],
            receipt_hash=receipt["receipt_hash"],
            receipt_raw=expected_receipt_raw,
        )
        expected_fields = {
            "sequence": expected_sequence,
            "previous_record_hash": previous_record_hash,
            "record_hash": expected_record_hash,
            "tx_id": result["tx_id"],
            "tx_raw": tx_raw,
            "tx_sha256": hashlib.sha256(tx_raw).hexdigest(),
            "previous_state_root": result["previous_state_root"],
            "next_state_root": result["next_state_root"],
            "receipt_hash": receipt["receipt_hash"],
            "receipt_raw": expected_receipt_raw,
            "status_authority": "NONE",
        }
        if row != expected_fields:
            _fail("RECORD_TAMPERED", f"Durable record {expected_sequence} is not exact.")
        previous_record_hash = expected_record_hash
        prefix_anchors.append(
            _make_anchor(
                sequence=expected_sequence,
                record_hash=expected_record_hash,
                state_root=result["next_state_root"],
                receipt_head=receipt["receipt_hash"],
            )
        )

    if sum(int(item["amount"]) for item in machine.state.values()) != GENESIS_SUPPLY:
        _fail("SUPPLY_DIVERGENCE", "Recovered state does not conserve the frozen supply.")
    rollback_check = _verify_expected_anchor(expected_anchor, prefix_anchors)
    report = {
        "schema": AUDIT_SCHEMA,
        "status": "PASS",
        "record_count": len(rows),
        "anchor": prefix_anchors[-1],
        "rollback_check": rollback_check,
        "storage": storage,
        "status_authority": "NONE",
        "claims": [
            "Every stored synthetic transfer replayed from the frozen R013 genesis and the exact hash chain matched."
        ],
        "non_claims": [
            "An unanchored local audit does not detect replacement by an older valid whole-database snapshot.",
            "This is not money, custody, backing, redemption, consensus, finality, power-loss certification or production security.",
        ],
    }
    return report, machine, prefix_anchors


def init_store(root: Path, db_path: Path) -> dict[str, Any]:
    """Create a new empty R014 store without replacing any existing path."""

    path = _validate_store_path(Path(db_path), creating=True)
    genesis_raw, _initial_state, initial_root = _load_frozen_genesis(Path(root))
    reserved_identity = _reserve_store_path(path)
    connection: sqlite3.Connection | None = None
    committed = False
    try:
        connection = _configure_connection(path, creating=True)
        connection.execute("BEGIN IMMEDIATE")
        _create_schema(connection)
        connection.execute(
            "INSERT INTO meta (singleton, schema, network_id, genesis_id, genesis_raw, "
            "genesis_raw_sha256, initial_state_root, status_authority, max_records, "
            "created_with_sqlite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                1,
                STORE_SCHEMA,
                NETWORK_ID,
                PINNED_GENESIS_ID,
                sqlite3.Binary(genesis_raw),
                hashlib.sha256(genesis_raw).hexdigest(),
                initial_root,
                "NONE",
                MAX_RECORDS,
                sqlite3.sqlite_version,
            ),
        )
        connection.execute("COMMIT")
        committed = True
        connection.execute("BEGIN IMMEDIATE")
        report, _machine, _anchors = _replay_locked(Path(root), connection, expected_anchor=None)
        connection.execute("COMMIT")
        return {**report, "created": True}
    except DurableStoreError:
        if connection is not None and connection.in_transaction:
            connection.execute("ROLLBACK")
        raise
    except (OSError, sqlite3.Error) as exc:
        if connection is not None and connection.in_transaction:
            connection.execute("ROLLBACK")
        raise DurableStoreError("STORE_INIT_FAILED", str(exc)) from exc
    finally:
        if connection is not None:
            connection.close()
        if not committed:
            _cleanup_reserved_store(path, reserved_identity)


def audit_store(
    root: Path,
    db_path: Path,
    expected_anchor: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Open, integrity-check and fully replay one store without repairing it."""

    path = _validate_store_path(Path(db_path), creating=False)
    connection = _configure_connection(path, creating=False)
    try:
        connection.execute("BEGIN IMMEDIATE")
        report, _machine, _anchors = _replay_locked(
            Path(root), connection, expected_anchor=expected_anchor
        )
        connection.execute("COMMIT")
        return report
    except DurableStoreError:
        if connection.in_transaction:
            connection.execute("ROLLBACK")
        raise
    except sqlite3.Error as exc:
        if connection.in_transaction:
            connection.execute("ROLLBACK")
        raise DurableStoreError("STORE_AUDIT_FAILED", str(exc)) from exc
    finally:
        connection.close()


def apply_transfer(
    root: Path,
    db_path: Path,
    raw_bytes: bytes,
    expected_anchor: dict[str, Any] | None = None,
    fault_stage: str | None = None,
) -> dict[str, Any]:
    """Validate and durably append one signed synthetic transfer.

    An acknowledgement object is constructed only after COMMIT returns.  The
    optional ``fault_stage`` is an internal destructive-test hook and hard-exits
    the current process with status 97; it is not exposed by the CLI.
    """

    if not isinstance(raw_bytes, bytes) or not 1 <= len(raw_bytes) <= MAX_RAW_BYTES:
        _fail("TRANSFER_ENCODING_INVALID", "Transfer must be 1..65536 exact bytes.")
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
        _fail("FAULT_STAGE_INVALID", "Unknown internal R014 fault stage.")

    path = _validate_store_path(Path(db_path), creating=False)
    connection = _configure_connection(path, creating=False)
    committed = False
    try:
        _fault("BEFORE_BEGIN", fault_stage)
        connection.execute("BEGIN IMMEDIATE")
        _fault("AFTER_BEGIN", fault_stage)
        audit, machine, prefix_anchors = _replay_locked(
            Path(root), connection, expected_anchor=expected_anchor
        )
        _fault("AFTER_REPLAY", fault_stage)

        result = machine.apply(f"APPLY-{len(machine.receipts) + 1:06d}", raw_bytes)
        if result["decision"] != "CANDIDATE_ACCEPTED":
            _fail("TRANSFER_REJECTED", result["reason_code"])

        if result["reason_code"] == "EXACT_REPLAY":
            original_sequence = next(
                index
                for index, receipt in enumerate(machine.receipts, start=1)
                if receipt["tx_id"] == result["tx_id"]
            )
            original_receipt = machine.receipts[original_sequence - 1]
            original_anchor = prefix_anchors[original_sequence]
            _fault("BEFORE_COMMIT", fault_stage)
            connection.execute("COMMIT")
            committed = True
            _fault("AFTER_COMMIT_BEFORE_ACK", fault_stage)
            return {
                "schema": APPLY_SCHEMA,
                "status": "ACKNOWLEDGED_AFTER_COMMIT",
                "decision": "CANDIDATE_ACCEPTED",
                "reason_code": "EXACT_REPLAY",
                "idempotent": True,
                "receipt": original_receipt,
                "anchor": original_anchor,
                "store_anchor": prefix_anchors[-1],
                "rollback_check": audit["rollback_check"],
                "status_authority": "NONE",
            }

        if result["reason_code"] != "VALID_CONSERVED_TRANSFER":
            _fail("TRANSFER_REJECTED", result["reason_code"])
        sequence = len(prefix_anchors)
        if sequence > MAX_RECORDS:
            _fail("RECORD_LIMIT_EXCEEDED", f"At most {MAX_RECORDS} records are admitted.")
        receipt = machine.receipts[-1]
        receipt_raw = canonical_bytes(receipt)
        previous_record_hash = prefix_anchors[-1]["record_hash"]
        record_hash = _record_hash(
            sequence=sequence,
            previous_record_hash=previous_record_hash,
            tx_id=result["tx_id"],
            tx_raw=raw_bytes,
            previous_state_root=result["previous_state_root"],
            next_state_root=result["next_state_root"],
            receipt_hash=receipt["receipt_hash"],
            receipt_raw=receipt_raw,
        )
        _fault("BEFORE_INSERT", fault_stage)
        connection.execute(
            "INSERT INTO records (sequence, previous_record_hash, record_hash, tx_id, tx_raw, "
            "tx_sha256, previous_state_root, next_state_root, receipt_hash, receipt_raw, "
            "status_authority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                sequence,
                previous_record_hash,
                record_hash,
                result["tx_id"],
                sqlite3.Binary(raw_bytes),
                hashlib.sha256(raw_bytes).hexdigest(),
                result["previous_state_root"],
                result["next_state_root"],
                receipt["receipt_hash"],
                sqlite3.Binary(receipt_raw),
                "NONE",
            ),
        )
        next_anchor = _make_anchor(
            sequence=sequence,
            record_hash=record_hash,
            state_root=result["next_state_root"],
            receipt_head=receipt["receipt_hash"],
        )
        _fault("AFTER_INSERT", fault_stage)
        _fault("BEFORE_COMMIT", fault_stage)
        connection.execute("COMMIT")
        committed = True
        _fault("AFTER_COMMIT_BEFORE_ACK", fault_stage)
        return {
            "schema": APPLY_SCHEMA,
            "status": "ACKNOWLEDGED_AFTER_COMMIT",
            "decision": "CANDIDATE_ACCEPTED",
            "reason_code": "VALID_CONSERVED_TRANSFER",
            "idempotent": False,
            "receipt": receipt,
            "anchor": next_anchor,
            "store_anchor": next_anchor,
            "rollback_check": audit["rollback_check"],
            "status_authority": "NONE",
        }
    except DurableStoreError:
        if not committed and connection.in_transaction:
            connection.execute("ROLLBACK")
        raise
    except sqlite3.Error as exc:
        if not committed and connection.in_transaction:
            connection.execute("ROLLBACK")
        raise DurableStoreError("STORE_APPLY_FAILED", str(exc)) from exc
    finally:
        connection.close()


def export_anchor(
    root: Path,
    db_path: Path,
    output_path: Path,
    expected_anchor: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Write the current watch-only anchor as exact canonical JSON."""

    db = _validate_store_path(Path(db_path), creating=False)
    output = Path(output_path).absolute()
    if output == db or output.is_symlink() or output.exists():
        _fail(
            "ANCHOR_PATH_INVALID",
            "The external anchor must be a new, separate, non-symlink path; existing anchors are never replaced.",
        )
    if output.parent.resolve() != output.parent.absolute():
        _fail("ANCHOR_PATH_INVALID", "Symlinked anchor-directory components are not admitted.")
    report = audit_store(Path(root), db, expected_anchor=expected_anchor)
    anchor = report["anchor"]
    _atomic_create_bytes(output, canonical_bytes(anchor))
    return anchor
