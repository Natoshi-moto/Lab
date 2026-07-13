from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import tempfile
from pathlib import Path
from typing import Any

from system.nexus_lab.durable_value import (
    commit_durable_transfer,
    genesis_from_suite,
    transfer_from_suite,
    verify_durable_ledger,
    verify_independent_durable_ledger,
)
from system.nexus_lab.util import NexusError, canonical_json_bytes


ROUND = "R014_PCX_DURABLE_SETTLEMENT"
VALID_CASES = [
    "VALID-T1-SPLIT",
    "VALID-T2-SPLIT",
    "VALID-T3-MERGE",
    "VALID-T4-CREATOR-REMAINS-T2",
]


def _write_json(path: Path, value: Any) -> None:
    path.write_bytes(canonical_json_bytes(value))


def _manifest(root: Path) -> dict[str, str]:
    return {
        str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(root.rglob("*"))
        if path.is_file()
    }


def build_demo(repo_root: Path, output: Path) -> dict[str, Any]:
    output.mkdir(parents=True, exist_ok=False)
    suite = repo_root / "experiments" / "R013_PCX_CONSERVED_CLAIM" / "fixtures" / "SUITE.json"
    r013_verifier = repo_root / "experiments" / "R013_PCX_CONSERVED_CLAIM" / "independent_verifier.mjs"
    r014_verifier = repo_root / "experiments" / ROUND / "independent_journal_verifier.mjs"
    genesis = genesis_from_suite(suite)
    ledger = output / "DEMO_LEDGER"
    commits = [
        commit_durable_transfer(ledger, genesis, transfer_from_suite(suite, case_id))
        for case_id in VALID_CASES
    ]
    exact_replay = commit_durable_transfer(
        ledger,
        genesis,
        transfer_from_suite(suite, VALID_CASES[-1]),
    )
    final_head = commits[-1]["record_hash"]
    local = verify_durable_ledger(
        ledger,
        genesis,
        expected_record_head=final_head,
    )
    independent = verify_independent_durable_ledger(
        ledger,
        genesis,
        node_verifier=r014_verifier,
        r013_verifier=r013_verifier,
        repo_root=repo_root,
    )
    schema_paths = [
        repo_root / "constitution" / "schemas" / name
        for name in (
            "pcx-checkpoint.schema.json",
            "pcx-durable-record.schema.json",
            "pcx-external-head-anchor.schema.json",
            "pcx-value-receipt.schema.json",
        )
    ]
    schema_sha256 = {
        path.name: hashlib.sha256(path.read_bytes()).hexdigest()
        for path in schema_paths
    }
    anchor = {
        "schema": "nexus.pcx-external-head-anchor/v0",
        "genesis_id": local["genesis_id"],
        "record_head": local["record_head"],
        "checkpoint_id": local["checkpoint_id"],
        "state_root": local["state_root"],
        "receipt_head": local["receipt_head"],
        "status_authority": "NONE",
        "instructions": [
            "Retain this value outside the ledger directory and require it on later verification or commit."
        ],
        "non_claims": [
            "This repository copy is a format demonstration, not an independently held or trusted timestamped anchor."
        ],
    }
    _write_json(output / "LOCAL_RECOVERY_REPORT.json", local)
    _write_json(output / "INDEPENDENT_REPLAY_REPORT.json", independent)
    _write_json(output / "EXTERNAL_HEAD_ANCHOR.json", anchor)

    ledger_manifest = _manifest(ledger)
    demo = {
        "schema": "nexus.r014-pcx-durable-settlement-demo/v0",
        "status": "DEMONSTRATED_DURABLE_SINGLE_HOST_SYNTHETIC_SETTLEMENT",
        "status_authority": "NONE",
        "dependencies": {
            "r012_head": "f28dc07bf1433bb22e4d992a7f523503387ea445",
            "r013_head": "33da36ae22457986c69d3aacdcdecd1a71335793",
            "canonical_status": "UNPROMOTED_STACKED_PROPOSALS",
        },
        "ledger": {
            "record_count": local["record_count"],
            "record_head": local["record_head"],
            "state_root": local["state_root"],
            "receipt_head": local["receipt_head"],
            "checkpoint_id": local["checkpoint_id"],
            "total_supply": local["total_supply"],
            "manifest": ledger_manifest,
        },
        "commits": [
            {
                "case_id": case_id,
                "decision": result["decision"],
                "sequence": result["sequence"],
                "tx_id": result["tx_id"],
                "record_hash": result["record_hash"],
                "receipt_hash": result["receipt_hash"],
            }
            for case_id, result in zip(VALID_CASES, commits, strict=True)
        ],
        "exact_replay": {
            "decision": exact_replay["decision"],
            "idempotent": exact_replay["idempotent"],
            "record_hash": exact_replay["record_hash"],
            "receipt_hash": exact_replay["receipt_hash"],
            "record_count_after": local["record_count"],
        },
        "verification": {
            "local_report_sha256": hashlib.sha256(
                (output / "LOCAL_RECOVERY_REPORT.json").read_bytes()
            ).hexdigest(),
            "independent_report_sha256": hashlib.sha256(
                (output / "INDEPENDENT_REPLAY_REPORT.json").read_bytes()
            ).hexdigest(),
            "external_anchor_sha256": hashlib.sha256(
                (output / "EXTERNAL_HEAD_ANCHOR.json").read_bytes()
            ).hexdigest(),
            "journal_verifier_sha256": independent["journal_verifier_sha256"],
            "state_verifier_sha256": independent["state_verifier_sha256"],
            "independent_replay": independent["status"],
            "external_head_anchor_checked": local["external_head_anchor_checked"],
            "schema_sha256": schema_sha256,
        },
        "tested_fault_model": [
            "PROCESS_FAILURE_BEFORE_TEMP_WRITE",
            "PROCESS_FAILURE_AFTER_TEMP_WRITE_BEFORE_FSYNC",
            "PROCESS_FAILURE_AFTER_TEMP_FSYNC_BEFORE_RENAME",
            "PROCESS_FAILURE_AFTER_RENAME_BEFORE_DIRECTORY_FSYNC",
            "PROCESS_FAILURE_AFTER_DIRECTORY_FSYNC_BEFORE_REPLY",
            "TWO_PROCESS_COMPETING_SIBLING_SPENDS",
            "CORRUPTED_MISSING_MISNAMED_OR_LINKED_RECORD",
            "LOCAL_TRUNCATION_WITH_AND_WITHOUT_EXTERNAL_HEAD_ANCHOR",
        ],
        "demonstrated": [
            "Four already-signed R013 transfers were committed as one fsynced write-once canonical record file per sequence and replayed from exact genesis bytes.",
            "An exact client retry after durable commit returned the original record and receipt without appending.",
            "Crash injection before and after the atomic rename recovered a valid old or new prefix; no partial state was acknowledged.",
            "Two processes racing signed sibling spends serialized through the ledger lock and at most one competing spend committed.",
            "Python/OpenSSL and a separate JavaScript process using the pinned R013 Noble verifier reproduced every durable receipt and checkpoint.",
            "A record head retained outside the ledger detects rollback below that observed head and blocks further commit.",
        ],
        "non_claims": [
            "The ledger remains a single-host synthetic experiment and is not money, a valuable token, a redeemable promise or production settlement.",
            "No network ordering, global double-spend prevention, consensus, liveness, independent operators or trusted time is established.",
            "Key generation, display, storage, backup, recovery, compromised-device resistance, privacy and legal ownership are not implemented.",
            "A local chain alone cannot detect deletion of its newest valid suffix; rollback detection depends on a genuinely independent retained head anchor.",
            "Fsync and rename tests exercise the stated Linux/POSIX fault model but are not proof against filesystem, kernel, firmware or hardware failure.",
            "R012, R013 and R014 remain separate unpromoted proposals; no report or checkpoint has canonical authority."
        ],
    }
    _write_json(output / "DEMO_REPORT.json", demo)
    return demo


def _compare_trees(expected: Path, actual: Path) -> None:
    expected_files = {
        str(path.relative_to(expected)): path.read_bytes()
        for path in expected.rglob("*")
        if path.is_file()
    }
    actual_files = {
        str(path.relative_to(actual)): path.read_bytes()
        for path in actual.rglob("*")
        if path.is_file()
    }
    if expected_files != actual_files:
        missing = sorted(set(expected_files) - set(actual_files))
        extra = sorted(set(actual_files) - set(expected_files))
        changed = sorted(
            path
            for path in set(expected_files) & set(actual_files)
            if expected_files[path] != actual_files[path]
        )
        raise NexusError(
            f"R014 demo does not reproduce exactly; missing={missing}, extra={extra}, changed={changed}"
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.write == args.check:
        raise SystemExit("choose exactly one of --write or --check")
    repo_root = Path(__file__).resolve().parents[2]
    saved = repo_root / "operations" / "receipts" / ROUND
    with tempfile.TemporaryDirectory(prefix="nexus-r014-demo-") as temporary:
        generated = Path(temporary) / ROUND
        build_demo(repo_root, generated)
        if args.check:
            if not saved.is_dir():
                raise NexusError(f"Saved R014 evidence is missing: {saved}")
            _compare_trees(generated, saved)
        else:
            if saved.exists():
                raise NexusError(f"Refusing to replace existing R014 evidence: {saved}")
            saved.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(generated, saved)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
