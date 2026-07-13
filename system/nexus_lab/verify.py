from __future__ import annotations

import hashlib
import json
import platform
import sqlite3
import subprocess
import sys
from pathlib import Path
from typing import Any

from .audit_integrity import verify_audit_integrity
from .doctor import run_doctor
from .exchange import verify_exchange_ledger, verify_exchange_pack
from .shadow import verify_cold_consumer_report
from .snapshot import verify_snapshot
from .route import verify_manifest_pack
from .util import NexusError, load_json
from .value_kernel import (
    require_r013_evidence_files,
    validate_r013_claim_bindings,
    validate_r013_saved_evidence,
    verify_cross_implementation,
)


def _sha256_path(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _verify_r014_evidence(root: Path) -> dict[str, Any]:
    paths = {
        "implementation": root / "system" / "nexus_lab" / "durable_store.py",
        "cli": root / "system" / "nexus_lab" / "cli.py",
        "status_module": root / "system" / "nexus_lab" / "status.py",
        "verifier": root / "system" / "nexus_lab" / "verify.py",
        "tests": root / "tests" / "test_r014_durable_replay.py",
        "anchor_schema": root / "constitution" / "schemas" / "pcx-durable-anchor.schema.json",
        "suite": root / "experiments" / "R013_PCX_CONSERVED_CLAIM" / "fixtures" / "SUITE.json",
        "task": root / "operations" / "tasks" / "TSK-R014-PCX-DURABLE-REPLAY.json",
        "proposal": root / "operations" / "proposals" / "R014_PCX_DURABLE_REPLAY" / "STATUS.proposal.json",
        "demo": root / "operations" / "receipts" / "R014_PCX_DURABLE_REPLAY" / "DEMO_REPORT.json",
    }
    missing = [str(path.relative_to(root)) for path in paths.values() if not path.is_file()]
    if missing:
        raise NexusError("Declared R014 evidence is incomplete: " + ", ".join(missing))

    proposal = load_json(paths["proposal"])
    expected_proposal = {
        "schema": "nexus.proposal-status/v1",
        "round": "R014",
        "mode": "R014_PCX_DURABLE_REPLAY_REVIEW_READY",
        "disposition": "DEMONSTRATED_CRASH_CONSISTENT_LOCAL_RECOVERY_OF_SYNTHETIC_CONSERVED_STATE",
        "canonical_status": "UNPROMOTED_PROPOSAL",
        "base_head": "69bbe07843e0d400d53e696b7516d8f3bcf55e3e",
        "status_authority": "NONE",
        "next_action": "USER_REVIEW_AND_SEPARATE_PROMOTION_DECISION",
    }
    if proposal != expected_proposal:
        raise NexusError("R014 proposal status is not the exact review-ready prepromotion disposition.")

    result = subprocess.run(
        [sys.executable, "-m", "unittest", "-q", "tests.test_r014_durable_replay"],
        cwd=root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=180,
    )
    if result.returncode != 0:
        detail = result.stderr.decode("utf-8", errors="replace").strip()
        raise NexusError(f"R014 durability acceptance tests failed: {detail}")

    expected_demo = {
        "baseline_ref": "69bbe07843e0d400d53e696b7516d8f3bcf55e3e",
        "demonstrated": [
            "Every open and apply integrity-checked the exact SQLite schema and replayed exact stored R013 transfers from the frozen synthetic genesis.",
            "Six pre-commit hard-exit boundaries recovered the complete prior prefix without a durable record.",
            "A hard exit after commit but before acknowledgement recovered the complete new prefix, and exact retry returned the existing result without another record.",
            "Eight fresh two-process races over the same signed sibling pair committed exactly one sibling per local history.",
            "Matching caller-held anchors proved exact prefixes; shorter and same-height divergent database copies failed closed.",
            "Concurrent initialization and anchor-export path races each produced one winner without deleting or replacing the winning artifact.",
            "Five malformed, non-canonical, unknown-field, foreign-genesis or authority-escalating transfers appended nothing; altered stored derived state also failed closed.",
            "Schema changes, row mutation, truncation, header corruption and WAL mode failed without silent repair or conversion.",
            "The four-transfer frozen valid chain recovered the byte-converged R013 state root and receipt head with synthetic supply exactly 1000.",
        ],
        "evidence": {
            "anchor_schema_path": "constitution/schemas/pcx-durable-anchor.schema.json",
            "anchor_schema_sha256": _sha256_path(paths["anchor_schema"]),
            "cli_path": "system/nexus_lab/cli.py",
            "cli_sha256": _sha256_path(paths["cli"]),
            "implementation_path": "system/nexus_lab/durable_store.py",
            "implementation_sha256": _sha256_path(paths["implementation"]),
            "r013_suite_path": "experiments/R013_PCX_CONSERVED_CLAIM/fixtures/SUITE.json",
            "r013_suite_sha256": _sha256_path(paths["suite"]),
            "task_path": "operations/tasks/TSK-R014-PCX-DURABLE-REPLAY.json",
            "task_sha256": _sha256_path(paths["task"]),
            "test_path": "tests/test_r014_durable_replay.py",
            "test_sha256": _sha256_path(paths["tests"]),
            "status_module_path": "system/nexus_lab/status.py",
            "status_module_sha256": _sha256_path(paths["status_module"]),
            "verifier_path": "system/nexus_lab/verify.py",
            "verifier_sha256": _sha256_path(paths["verifier"]),
        },
        "fault_model": {
            "filesystem": "UNVERIFIED_REQUIRED_ASSUMPTION_HONEST_LOCAL_FILESYSTEM",
            "injected_process_hard_exit_stages": [
                "BEFORE_BEGIN",
                "AFTER_BEGIN",
                "AFTER_REPLAY",
                "BEFORE_INSERT",
                "AFTER_INSERT",
                "BEFORE_COMMIT",
                "AFTER_COMMIT_BEFORE_ACK",
            ],
            "not_injected": [
                "physical-power-loss",
                "dishonest-fsync-or-storage-controller",
                "kernel-or-filesystem-bug",
                "malicious-host-replacement-without-external-anchor",
            ],
        },
        "non_claims": [
            "The synthetic quantity is not money, economic value, legal property, backing, redemption, purchasing power or a safe store of value.",
            "No private key, signing, wallet, custody, recovery secret or real fund enters the store.",
            "Single-host SQLite serialization is not network consensus, global double-spend prevention or finality.",
            "Injected process exits do not prove physical power-loss durability, honest fsync behavior, availability or production security.",
            "A local hash chain cannot detect replacement by an older valid whole-database snapshot unless an independently retained anchor is supplied.",
            "The R014 durability wrapper has one implementation and no independent storage-envelope verifier or exhaustive crash-lifecycle model.",
            "Eight sibling-spend races are bounded scheduling evidence, not an exhaustive concurrency proof.",
            "This bounded test campaign is not a formal proof, external security audit, regulatory determination or authorization for a live pilot.",
        ],
        "observed": {
            "accepted_valid_chain_transfers": 4,
            "concurrent_sibling_race_rounds": 8,
            "fixed_max_records": 256,
            "initialization_path_races": 1,
            "postcommit_preack_hard_exits": 1,
            "precommit_hard_exit_boundaries": 6,
            "anchor_export_path_races": 1,
            "rejected_transfer_classes": 5,
            "stored_derived_metadata_tamper": 1,
            "recovered_receipt_head": "fedc92b971f0ea59586678297a981c950d2ac8646e8cf30f79bffc7537893ffc",
            "recovered_state_root": "1b28ac32d6067a7b1bd2ec8b7097b341d891a2793a63c606da0c9eecf221598f",
            "synthetic_supply": "1000",
            "unit_tests": 24,
        },
        "runtime_model": {
            "database_version_binding": "SQLITE_VERSION_AT_INIT_MUST_EQUAL_SQLITE_VERSION_ON_REOPEN",
            "evidence_creation_observation": {
                "kernel": "Linux 6.12.47 x86_64",
                "node": "24.14.0",
                "openssl": "3.0.13",
                "python": "3.12.13",
                "sqlite": "3.50.4",
            },
            "observation_scope": "FROZEN_LOCAL_RUN_ONLY_CURRENT_VERIFICATION_RUNTIME_IS_REPORTED_SEPARATELY",
        },
        "schema": "nexus.r014-pcx-durable-replay-demo/v0",
        "status": "DEMONSTRATED_CRASH_CONSISTENT_LOCAL_RECOVERY_OF_SYNTHETIC_CONSERVED_STATE",
        "status_authority": "NONE",
        "storage_profile": {
            "journal_mode": "DELETE",
            "max_records": 256,
            "transaction": "BEGIN IMMEDIATE",
            "synchronous": "EXTRA",
            "trusted_schema": "OFF",
        },
        "test_command": "python3 -m unittest -q tests.test_r014_durable_replay",
    }
    demo = load_json(paths["demo"])
    if demo != expected_demo:
        raise NexusError("R014 durability demonstration report does not match reproduced evidence bindings.")
    return {
        "schema": "nexus.r014-evidence-check/v0",
        "status": "PASS",
        "demonstration_status": demo["status"],
        "frozen_demo": demo,
        "verification_runtime": {
            "platform": platform.platform(),
            "python": platform.python_version(),
            "sqlite": sqlite3.sqlite_version,
        },
        "status_authority": "NONE",
        "non_claims": [
            "The current verification runtime is evidence metadata, not a portability or physical durability proof."
        ],
    }


def verify_repository(root: Path, *, snapshot: Path | None = None) -> dict[str, Any]:
    doctor = run_doctor(root)
    if doctor["status"] != "PASS":
        raise NexusError("Doctor checks failed:\n" + "\n".join(doctor["errors"]))

    snapshots: list[dict[str, Any]] = []
    targets = [snapshot] if snapshot else sorted((root / "snapshots" / "canonical").glob("*.zip"))
    for path in targets:
        if path is None:
            continue
        sidecar = path.with_suffix(path.suffix + ".sha256")
        expected = None
        if sidecar.is_file():
            first = sidecar.read_text(encoding="utf-8").strip().split()
            if first:
                expected = first[0]
        snapshots.append(verify_snapshot(path, expected_sha256=expected))

    packs: list[dict[str, Any]] = []
    for pack in sorted((root / "operations" / "routes").glob("*.zip")):
        packs.append(verify_manifest_pack(pack))

    audits: list[dict[str, Any]] = []
    audit_root = root / "operations" / "audits"
    if audit_root.exists():
        for target_json in sorted(audit_root.glob("*/TARGET.json")):
            audit_id = target_json.parent.name
            audits.append(verify_audit_integrity(root, audit_id))
            audit_pack = target_json.parent / f"{audit_id}.zip"
            if audit_pack.is_file():
                packs.append(verify_manifest_pack(audit_pack))

    exchanges: list[dict[str, Any]] = []
    receipt_root = root / "operations" / "receipts"
    if receipt_root.exists():
        for demo_path in sorted(receipt_root.glob("*/DEMO_REPORT.json")):
            demo = load_json(demo_path)
            if not isinstance(demo, dict) or demo.get("schema") != "nexus.r012-bwx-demo/v0":
                continue
            route_value = demo.get("route")
            if not isinstance(route_value, str):
                raise NexusError(f"Exchange demo has no route binding: {demo_path}")
            route_path = (root / route_value).resolve()
            try:
                route_path.relative_to(root.resolve())
            except ValueError as exc:
                raise NexusError(f"Exchange demo route escapes repository: {demo_path}") from exc
            directory = demo_path.parent
            return_packs = sorted(directory.glob("*-RETURN.zip"))
            if len(return_packs) != 1:
                raise NexusError(f"Exchange demo must contain exactly one return pack: {directory}")
            ledger_path = directory / "SETTLEMENTS.jsonl"
            fixture_root = root / "experiments" / "R012_BOUNDED_WORK_EXCHANGE" / "fixtures" / "cognition_shadow"
            exchanges.append(
                {
                    "demo": str(demo_path.relative_to(root)),
                    "pack": verify_exchange_pack(return_packs[0], route_path=route_path),
                    "ledger": verify_exchange_ledger(ledger_path),
                    "cold_consumer": verify_cold_consumer_report(
                        fixture_root,
                        directory / "COLD_CONSUMER_REPORT.json",
                    ),
                    "reported_status": demo.get("status"),
                    "status_authority": demo.get("status_authority"),
                }
            )

    value_convergence: list[dict[str, Any]] = []
    value_models: list[dict[str, Any]] = []
    status = load_json(root / "STATUS.json")
    if not isinstance(status, dict):
        raise NexusError("STATUS.json must contain an object.")
    active_tasks = status.get("active_tasks", []) if isinstance(status, dict) else []
    r013_declared = (
        "TSK-R013-PCX-CONSERVED-CLAIM" in active_tasks
        or status.get("current_round") == "R013"
        or (root / "operations" / "tasks" / "TSK-R013-PCX-CONSERVED-CLAIM.json").exists()
        or (root / "operations" / "proposals" / "R013_PCX_CONSERVED_CLAIM" / "STATUS.proposal.json").exists()
    )
    if r013_declared:
        paths = require_r013_evidence_files(root)
        model_result = subprocess.run(
            [sys.executable, str(paths["small_model"])],
            cwd=root,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=60,
        )
        if model_result.returncode != 0:
            detail = model_result.stderr.decode("utf-8", errors="replace").strip()
            raise NexusError(f"R013 bounded exhaustive model failed: {detail}")
        model_bytes = paths["model_report"].read_bytes()
        if model_result.stdout != model_bytes:
            raise NexusError("R013 bounded-model report does not reproduce exactly.")
        model_report = load_json(paths["model_report"])
        check = verify_cross_implementation(
            paths["suite"],
            node_verifier=paths["node_verifier"],
            repo_root=root,
        )
        validate_r013_saved_evidence(
            expected_bytes=paths["expected_report"].read_bytes(),
            saved_convergence=load_json(paths["convergence_report"]),
            check=check,
        )
        validate_r013_claim_bindings(
            demo=load_json(paths["demo_report"]),
            proposal_status=load_json(paths["proposal_status"]),
            check=check,
            suite_sha256=hashlib.sha256(paths["suite"].read_bytes()).hexdigest(),
            model_report=model_report,
            model_report_sha256=hashlib.sha256(model_bytes).hexdigest(),
        )
        value_convergence.append(check)
        value_models.append(model_report)

    durable_replay: list[dict[str, Any]] = []
    r014_declared = (
        "TSK-R014-PCX-DURABLE-REPLAY" in active_tasks
        or status.get("current_round") == "R014"
        or (root / "operations" / "tasks" / "TSK-R014-PCX-DURABLE-REPLAY.json").exists()
        or (root / "operations" / "proposals" / "R014_PCX_DURABLE_REPLAY" / "STATUS.proposal.json").exists()
    )
    if r014_declared:
        durable_replay.append(_verify_r014_evidence(root))

    # Index identity and referential checks.
    object_index = root / "corpus" / "indexes" / "objects.jsonl"
    object_count = 0
    if object_index.exists():
        for line_number, line in enumerate(object_index.read_text(encoding="utf-8").splitlines(), start=1):
            if not line.strip():
                continue
            record = json.loads(line)
            object_count += 1
            path = root / record["path"]
            if not path.is_file():
                raise NexusError(f"Object index line {line_number} points to missing file: {record['path']}")

    return {
        "schema": "nexus.verification/v1",
        "status": "PASS",
        "doctor": doctor,
        "snapshots": snapshots,
        "audits": audits,
        "packs": packs,
        "exchanges": exchanges,
        "value_convergence": value_convergence,
        "value_models": value_models,
        "durable_replay": durable_replay,
        "indexed_objects": object_count,
        "claims": ["All checks represented in this report passed."],
        "non_claims": ["This report does not establish semantic correctness, complete security or external audit."],
    }
