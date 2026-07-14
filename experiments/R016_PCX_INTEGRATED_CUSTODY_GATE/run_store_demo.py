#!/usr/bin/env python3
"""Run the frozen R016 transcript through the real durable custody gate.

Only the exact public genesis and already-signed closed-transcript events are
inputs.  The demonstration creates its SQLite database and caller-held anchor
in a temporary directory and emits no runtime paths or runtime-version fields.
"""

from __future__ import annotations

import base64
import hashlib
import json
import sys
import tempfile
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from system.nexus_lab.custody_kernel import Machine, canonical_json
from system.nexus_lab.custody_store import (
    apply_custody_event,
    audit_custody_store,
    export_custody_anchor,
    init_custody_store,
    load_custody_anchor,
)


FIXTURE_DIRECTORY = (
    ROOT / "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/fixtures"
)
GENESIS_PATH = FIXTURE_DIRECTORY / "GENESIS.json"
TRANSCRIPT_PATH = FIXTURE_DIRECTORY / "CLOSED_TRANSCRIPT.json"

REPORT_SCHEMA = "nexus.r016-pcx-integrated-custody-store-demo/v0"
STATUS_AUTHORITY = "NONE"


class StoreDemoError(Exception):
    """The frozen demonstration did not reproduce its exact contract."""


def _require(condition: bool, detail: str) -> None:
    if not condition:
        raise StoreDemoError(detail)


def _unique_pairs(items: list[tuple[str, Any]]) -> dict[str, Any]:
    value: dict[str, Any] = {}
    for key, item in items:
        if key in value:
            raise StoreDemoError(f"duplicate JSON key: {key}")
        value[key] = item
    return value


def _load_exact_object(path: Path, *, final_newline: bool) -> tuple[bytes, dict[str, Any]]:
    raw = path.read_bytes()
    body = raw
    if final_newline:
        _require(raw.endswith(b"\n") and not raw.endswith(b"\n\n"), f"{path.name} newline")
        body = raw[:-1]
    else:
        _require(not raw.endswith(b"\n"), f"{path.name} must have no final newline")
    try:
        value = json.loads(body.decode("ascii"), object_pairs_hook=_unique_pairs)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise StoreDemoError(f"{path.name} is not canonical ASCII JSON") from exc
    _require(type(value) is dict, f"{path.name} must contain one object")
    _require(canonical_json(value) == body, f"{path.name} is not exact canonical JSON")
    return raw, value


def _load_inputs() -> tuple[bytes, bytes, dict[str, Any], list[bytes]]:
    genesis_raw, genesis = _load_exact_object(GENESIS_PATH, final_newline=False)
    transcript_raw, transcript = _load_exact_object(
        TRANSCRIPT_PATH, final_newline=True
    )
    try:
        embedded_genesis = base64.b64decode(
            transcript["genesis_b64"], validate=True
        )
    except (KeyError, ValueError) as exc:
        raise StoreDemoError("transcript genesis_b64 is invalid") from exc
    _require(embedded_genesis == genesis_raw, "transcript embeds different genesis bytes")
    _require(
        hashlib.sha256(genesis_raw).hexdigest() == transcript["genesis_sha256"],
        "transcript genesis hash differs",
    )
    _require(genesis["status_authority"] == STATUS_AUTHORITY, "genesis claims authority")
    _require(transcript["status_authority"] == STATUS_AUTHORITY, "transcript claims authority")
    records = transcript.get("records")
    _require(type(records) is list and len(records) == 6, "transcript must contain six records")
    _require(transcript.get("event_count") == "6", "transcript event count differs")

    events: list[bytes] = []
    for sequence, record in enumerate(records, start=1):
        _require(type(record) is dict, f"record {sequence} is not an object")
        _require(record.get("sequence") == str(sequence), "record sequence is not contiguous")
        try:
            event = base64.b64decode(record["event_b64"], validate=True)
        except (KeyError, ValueError) as exc:
            raise StoreDemoError(f"record {sequence} event_b64 is invalid") from exc
        _require(
            hashlib.sha256(event).hexdigest() == record.get("event_sha256"),
            f"record {sequence} event hash differs",
        )
        events.append(event)
    return genesis_raw, transcript_raw, transcript, events


def _run_once() -> dict[str, Any]:
    genesis_raw, transcript_raw, transcript, events = _load_inputs()
    records = transcript["records"]

    with tempfile.TemporaryDirectory(prefix="r016-custody-store-demo-") as temporary:
        directory = Path(temporary)
        database = directory / "custody.sqlite3"
        anchor_path = directory / "caller-held-anchor.json"

        initialized = init_custody_store(genesis_raw, database)
        _require(initialized["record_count"] == 0, "new store is not empty")
        _require(initialized["status_authority"] == STATUS_AUTHORITY, "store init claimed authority")

        operation_evidence: list[dict[str, str]] = []
        for sequence, (record, event) in enumerate(zip(records, events, strict=True), start=1):
            result = apply_custody_event(genesis_raw, database, event)
            _require(result["decision"] == "ACCEPTED", f"event {sequence} was rejected")
            _require(result["idempotent"] is False, f"event {sequence} was not a new append")
            _require(result["receipt"] == record["receipt"], f"event {sequence} receipt differs")
            _require(
                result["receipt"]["object_id"] == record["object_id"],
                f"event {sequence} object ID differs",
            )
            _require(
                result["status_authority"] == STATUS_AUTHORITY
                and result["receipt"]["status_authority"] == STATUS_AUTHORITY,
                f"event {sequence} claimed authority",
            )
            operation_evidence.append(
                {
                    "event_sha256": record["event_sha256"],
                    "kind": record["kind"],
                    "object_id": record["object_id"],
                    "receipt_hash": record["receipt"]["receipt_hash"],
                    "record_hash": result["anchor"]["record_hash"],
                    "sequence": str(sequence),
                }
            )

        exported_anchor = export_custody_anchor(
            genesis_raw, database, anchor_path
        )
        loaded_anchor = load_custody_anchor(anchor_path)
        _require(loaded_anchor == exported_anchor, "exported anchor did not round-trip")
        _require(exported_anchor["sequence"] == "6", "final anchor is not sequence six")
        _require(exported_anchor["status_authority"] == STATUS_AUTHORITY, "anchor claimed authority")

        anchored = audit_custody_store(
            genesis_raw, database, expected_anchor=loaded_anchor
        )
        _require(anchored["status"] == "PASS", "anchored audit failed")
        _require(
            anchored["rollback_check"] == "ANCHORED_PREFIX_CONFIRMED",
            "caller-held final anchor was not confirmed",
        )
        _require(anchored["record_count"] == 6, "anchored audit record count differs")

        for sequence, (record, event) in enumerate(zip(records, events, strict=True), start=1):
            retry = apply_custody_event(
                genesis_raw,
                database,
                event,
                expected_anchor=loaded_anchor,
            )
            _require(retry["idempotent"] is True, f"event {sequence} retry appended")
            _require(retry["reason_code"] == "EXACT_REPLAY", f"event {sequence} retry differs")
            _require(retry["receipt"] == record["receipt"], f"event {sequence} retry receipt differs")
            _require(retry["anchor"]["sequence"] == str(sequence), "retry returned wrong prefix anchor")
            _require(retry["store_anchor"] == loaded_anchor, "retry changed the store tip")

        reopened = audit_custody_store(
            genesis_raw, database, expected_anchor=loaded_anchor
        )
        _require(reopened["status"] == "PASS", "reopen audit failed")
        _require(reopened["record_count"] == 6, "exact retries changed record count")
        _require(
            reopened["rollback_check"] == "ANCHORED_PREFIX_CONFIRMED",
            "reopen audit did not confirm final anchor",
        )

    machine = Machine(genesis_raw)
    for sequence, (record, event) in enumerate(zip(records, events, strict=True), start=1):
        receipt = machine.apply(event)
        _require(receipt == record["receipt"], f"independent replay receipt {sequence} differs")
    synthetic_supply = sum(int(item["amount"]) for item in machine.utxos())
    _require(synthetic_supply == 1000, "final synthetic supply is not 1000")
    _require(transcript["synthetic_supply"] == "1000", "transcript supply differs")
    _require(machine.height == 6 and transcript["final_height"] == "6", "final height differs")
    _require(machine.state_root == transcript["final_state_root"], "final state root differs")
    _require(machine.public_state() == transcript["final_state"], "final public state differs")
    _require(reopened["height"] == 6, "reopened store height differs")
    _require(reopened["state_root"] == transcript["final_state_root"], "reopened root differs")
    _require(reopened["anchor"] == loaded_anchor, "reopened anchor differs")

    return {
        "claims": [
            "The exact no-newline GENESIS and all six already-signed CLOSED_TRANSCRIPT events passed the real OpenSSL Ed25519 custody gate and were durably ordered by one SQLite store.",
            "Full replay from the explicit genesis converged to transcript height 6, its exact final state root, and conserved synthetic supply 1000.",
            "The exported caller-held final anchor round-tripped exactly and an anchored reopen confirmed the complete six-record prefix.",
            "Exact retry of every accepted event returned its existing receipt and prefix anchor without increasing the six-record history.",
        ],
        "execution": {
            "anchored_audit": anchored["status"],
            "anchored_rollback_check": anchored["rollback_check"],
            "exact_retries": "6",
            "initial_applies": "6",
            "post_retry_record_count": str(reopened["record_count"]),
            "reopen_audit": reopened["status"],
            "reopen_rollback_check": reopened["rollback_check"],
        },
        "final": {
            "anchor_id": loaded_anchor["anchor_id"],
            "anchor_sequence": loaded_anchor["sequence"],
            "height": str(reopened["height"]),
            "receipt_head": loaded_anchor["receipt_head"],
            "record_head": loaded_anchor["record_hash"],
            "state_root": reopened["state_root"],
            "synthetic_supply": str(synthetic_supply),
        },
        "fixtures": {
            "closed_transcript_path": "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/fixtures/CLOSED_TRANSCRIPT.json",
            "closed_transcript_sha256": hashlib.sha256(transcript_raw).hexdigest(),
            "genesis_path": "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/fixtures/GENESIS.json",
            "genesis_sha256": hashlib.sha256(genesis_raw).hexdigest(),
            "transcript_id": transcript["transcript_id"],
        },
        "non_claims": [
            "The conserved synthetic quantity is not money, legal property, backing, redemption, purchasing power, liquidity, or a safe store of value.",
            "The demonstration introduces no private key, signing service, wallet, recovery secret, real fund, or live custody operation.",
            "Single-host SQLite ordering is not network consensus, global double-spend prevention, economic finality, or external anchor retention.",
            "Successful process-level replay does not prove physical power-loss durability, honest hardware or filesystem behavior, availability, or production security.",
            "This six-event demonstration is bounded research evidence, not formal verification, an external security audit, regulatory approval, or authorization for a live pilot.",
        ],
        "operations": operation_evidence,
        "reproducibility": {
            "encoding": "SORTED_COMPACT_ASCII_JSON_PLUS_LF",
            "required_independent_runs": "2",
            "runtime_paths_in_report": "NONE",
            "runtime_version_fields": "NONE",
        },
        "schema": REPORT_SCHEMA,
        "status": "DEMONSTRATED_REAL_SIGNATURE_DURABLE_REPLAY_AND_ANCHORED_EXACT_RETRY",
        "status_authority": STATUS_AUTHORITY,
        "storage_profile": {
            "integrity_check": anchored["storage"]["integrity_check"],
            "journal_mode": anchored["storage"]["journal_mode"],
            "max_records": "256",
            "synchronous": anchored["storage"]["synchronous"],
            "transaction": anchored["storage"]["transaction"],
            "trusted_schema": anchored["storage"]["trusted_schema"],
        },
    }


def build_report() -> dict[str, Any]:
    """Build one deterministic report from one fresh temporary store."""

    return _run_once()


def canonical_line(value: dict[str, Any]) -> bytes:
    """Encode the report as canonical compact ASCII JSON plus one LF."""

    return canonical_json(value) + b"\n"


def main() -> int:
    sys.stdout.buffer.write(canonical_line(build_report()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
