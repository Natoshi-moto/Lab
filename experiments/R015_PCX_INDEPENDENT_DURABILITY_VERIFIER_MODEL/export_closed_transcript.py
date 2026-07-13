"""Export one immutable, self-hashed view of an R014 durable-store prefix.

This is an untrusted producer for the R015 cold-verification experiment.  It
deliberately reuses R014's locked replay boundary to obtain a consistent view,
but its output is not accepted on that basis.  The separate Node verifier must
recompute the genesis, every transfer, receipt, durable record, and prefix
anchor without importing or invoking this module or the R014 Python store.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import os
import sqlite3
import tempfile
from copy import deepcopy
from pathlib import Path
from typing import Any

from system.nexus_lab import durable_store
from system.nexus_lab.durable_store import DurableStoreError
from system.nexus_lab.util import NexusError
from system.nexus_lab.value_kernel import (
    NETWORK_ID,
    PINNED_GENESIS_ID,
    canonical_bytes,
    tagged_hash,
)


TRANSCRIPT_SCHEMA = "nexus.pcx-closed-durable-transcript/v0"
TRANSCRIPT_HASH_TAG = "NEXUS/PCX/CLOSED-DURABLE-TRANSCRIPT/V0"
CLOSURE = "CLOSED_EXPORTED_PREFIX"
MAX_TRANSCRIPT_BYTES = 32 * 1024 * 1024


def _transcript_subject(value: dict[str, Any]) -> dict[str, Any]:
    subject = deepcopy(value)
    subject["transcript_id"] = ""
    return subject


def _atomic_create(path: Path, data: bytes) -> None:
    """Publish complete bytes once; never replace an earlier export."""

    output = Path(path).absolute()
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists() or output.is_symlink():
        raise NexusError("Closed transcript output must be a new non-symlink path.")
    if output.parent.resolve() != output.parent.absolute():
        raise NexusError("Symlinked transcript-directory components are not admitted.")
    temp_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(dir=output.parent, delete=False) as handle:
            temp_name = handle.name
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        try:
            os.link(temp_name, output)
        except FileExistsError as exc:
            raise NexusError("Closed transcript output was won by another writer.") from exc
        directory_fd = os.open(output.parent, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        if temp_name is not None:
            Path(temp_name).unlink(missing_ok=True)


def _build_transcript(
    root: Path,
    connection: sqlite3.Connection,
    prefix_anchors: list[dict[str, Any]],
) -> dict[str, Any]:
    genesis_raw, _initial_state, initial_root = durable_store._load_frozen_genesis(root)
    rows = connection.execute("SELECT * FROM records ORDER BY sequence").fetchall()
    records: list[dict[str, Any]] = []
    for raw_row in rows:
        row = dict(raw_row)
        tx_raw = row["tx_raw"]
        receipt_raw = row["receipt_raw"]
        if not isinstance(tx_raw, bytes) or not isinstance(receipt_raw, bytes):
            raise DurableStoreError(
                "TRANSCRIPT_ENCODING_INVALID",
                "R014 transaction and receipt fields must remain exact BLOB bytes.",
            )
        records.append(
            {
                "schema": durable_store.RECORD_SCHEMA,
                "sequence": str(row["sequence"]),
                "previous_record_hash": row["previous_record_hash"],
                "record_hash": row["record_hash"],
                "tx_id": row["tx_id"],
                "tx_b64": base64.b64encode(tx_raw).decode("ascii"),
                "tx_sha256": row["tx_sha256"],
                "previous_state_root": row["previous_state_root"],
                "next_state_root": row["next_state_root"],
                "receipt_hash": row["receipt_hash"],
                "receipt_b64": base64.b64encode(receipt_raw).decode("ascii"),
                "receipt_raw_sha256": hashlib.sha256(receipt_raw).hexdigest(),
                "status_authority": row["status_authority"],
            }
        )
    transcript = {
        "schema": TRANSCRIPT_SCHEMA,
        "network_id": NETWORK_ID,
        "genesis_id": PINNED_GENESIS_ID,
        "genesis_b64": base64.b64encode(genesis_raw).decode("ascii"),
        "genesis_raw_sha256": hashlib.sha256(genesis_raw).hexdigest(),
        "initial_state_root": initial_root,
        "max_records": str(durable_store.MAX_RECORDS),
        "record_count": str(len(records)),
        "records": records,
        "anchors": deepcopy(prefix_anchors),
        "terminal_anchor": deepcopy(prefix_anchors[-1]),
        "closure": CLOSURE,
        "status_authority": "NONE",
        "transcript_id": "",
    }
    transcript["transcript_id"] = tagged_hash(
        TRANSCRIPT_HASH_TAG,
        canonical_bytes(_transcript_subject(transcript)),
    )
    encoded = canonical_bytes(transcript)
    if len(encoded) > MAX_TRANSCRIPT_BYTES:
        raise NexusError("Closed transcript exceeds the R015 32 MiB verification bound.")
    return transcript


def export_closed_transcript(
    root: Path,
    db_path: Path,
    output_path: Path,
    *,
    expected_anchor: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Replay under the R014 writer lock, then export one closed prefix."""

    root = Path(root).resolve()
    db = durable_store._validate_store_path(Path(db_path), creating=False)
    output = Path(output_path).absolute()
    sqlite_namespace = {
        db,
        Path(str(db) + "-journal"),
        Path(str(db) + "-wal"),
        Path(str(db) + "-shm"),
    }
    if output in sqlite_namespace:
        raise NexusError(
            "The transcript must be outside the database and its reserved SQLite sidecar namespace."
        )
    connection = durable_store._configure_connection(db, creating=False)
    try:
        connection.execute("BEGIN IMMEDIATE")
        _report, _machine, prefix_anchors = durable_store._replay_locked(
            root,
            connection,
            expected_anchor=expected_anchor,
        )
        transcript = _build_transcript(root, connection, prefix_anchors)
        connection.execute("COMMIT")
    except Exception:
        if connection.in_transaction:
            connection.execute("ROLLBACK")
        raise
    finally:
        connection.close()
    _atomic_create(output, canonical_bytes(transcript))
    return transcript


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--database", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--expected-anchor", type=Path)
    args = parser.parse_args()
    expected = (
        durable_store.load_anchor(args.expected_anchor)
        if args.expected_anchor is not None
        else None
    )
    transcript = export_closed_transcript(
        args.root,
        args.database,
        args.output,
        expected_anchor=expected,
    )
    print(canonical_bytes(transcript).decode("utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
