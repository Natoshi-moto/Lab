from __future__ import annotations

import base64
import ast
import json
import multiprocessing
import queue
import re
import shutil
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from system.nexus_lab import durable_store
from system.nexus_lab.durable_store import (
    DurableStoreError,
    apply_transfer,
    audit_store,
    export_anchor,
    init_store,
    load_anchor,
)
from system.nexus_lab.status import assurance_decision
from system.nexus_lab.value_kernel import NETWORK_ID, PINNED_GENESIS_ID


ROOT = Path(__file__).resolve().parents[1]
SUITE_PATH = ROOT / "experiments" / "R013_PCX_CONSERVED_CLAIM" / "fixtures" / "SUITE.json"
EXPECTED_REPORT_PATH = (
    ROOT / "experiments" / "R013_PCX_CONSERVED_CLAIM" / "fixtures" / "EXPECTED_REPORT.json"
)
HASH_RE = re.compile(r"^[0-9a-f]{64}$")


def _concurrent_apply_worker(
    repo_root: str,
    db_path: str,
    raw: bytes,
    start: multiprocessing.synchronize.Event,
    results: multiprocessing.queues.Queue,
) -> None:
    """Apply one transfer in an independent process after a shared start signal."""

    start.wait(timeout=15)
    try:
        result = apply_transfer(Path(repo_root), Path(db_path), raw)
        results.put(
            {
                "ok": True,
                "decision": result["decision"],
                "reason_code": result["reason_code"],
                "anchor": result["anchor"],
            }
        )
    except Exception as exc:  # The parent asserts the precise admitted error type.
        results.put(
            {
                "ok": False,
                "error_type": type(exc).__name__,
                "error_code": getattr(exc, "code", None),
                "detail": str(exc),
            }
        )


def _fault_apply_worker(repo_root: str, db_path: str, raw: bytes, stage: str) -> None:
    """Enter a deliberate hard-exit fault stage in an expendable process."""

    apply_transfer(Path(repo_root), Path(db_path), raw, fault_stage=stage)


def _init_worker(
    repo_root: str,
    db_path: str,
    start: multiprocessing.synchronize.Event,
    results: multiprocessing.queues.Queue,
) -> None:
    start.wait(timeout=15)
    try:
        report = init_store(Path(repo_root), Path(db_path))
        results.put({"ok": True, "anchor": report["anchor"]})
    except Exception as exc:
        results.put({"ok": False, "error_type": type(exc).__name__, "detail": str(exc)})


def _export_worker(
    repo_root: str,
    db_path: str,
    output_path: str,
    start: multiprocessing.synchronize.Event,
    results: multiprocessing.queues.Queue,
) -> None:
    start.wait(timeout=15)
    try:
        anchor = export_anchor(Path(repo_root), Path(db_path), Path(output_path))
        results.put({"ok": True, "anchor": anchor})
    except Exception as exc:
        results.put({"ok": False, "error_type": type(exc).__name__, "detail": str(exc)})


class R014DurableReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.suite = json.loads(SUITE_PATH.read_text(encoding="utf-8"))
        cls.expected_report = json.loads(EXPECTED_REPORT_PATH.read_text(encoding="utf-8"))

    def setUp(self) -> None:
        self._temporary = tempfile.TemporaryDirectory(prefix="nexus-r014-store-")
        self.addCleanup(self._temporary.cleanup)
        self.work = Path(self._temporary.name)
        self.db = self.work / "pcx.sqlite3"

    @classmethod
    def _raw(cls, history_id: str, case_id: str) -> bytes:
        history = next(item for item in cls.suite["histories"] if item["history_id"] == history_id)
        case = next(item for item in history["cases"] if item["case_id"] == case_id)
        return base64.b64decode(case["raw_b64"], validate=True)

    @classmethod
    def _expected_history(cls, history_id: str) -> dict[str, object]:
        return next(
            item for item in cls.expected_report["histories"] if item["history_id"] == history_id
        )

    def assertAnchor(self, anchor: dict[str, object], *, sequence: int) -> None:  # noqa: N802
        self.assertEqual(anchor["schema"], "nexus.pcx-durable-anchor/v0")
        self.assertEqual(anchor["network_id"], NETWORK_ID)
        self.assertEqual(anchor["genesis_id"], PINNED_GENESIS_ID)
        self.assertEqual(anchor["sequence"], str(sequence))
        self.assertEqual(anchor["status_authority"], "NONE")
        self.assertRegex(str(anchor["state_root"]), HASH_RE)
        self.assertRegex(str(anchor["anchor_id"]), HASH_RE)
        if sequence:
            self.assertRegex(str(anchor["record_hash"]), HASH_RE)
            self.assertRegex(str(anchor["receipt_head"]), HASH_RE)
        else:
            self.assertEqual(anchor["record_hash"], "")
            self.assertEqual(anchor["receipt_head"], "")

    def assertAudit(
        self,
        audit: dict[str, object],
        *,
        records: int,
        rollback_check: str = "UNANCHORED",
    ) -> None:  # noqa: N802
        self.assertEqual(audit["schema"], "nexus.pcx-durable-audit/v0")
        self.assertEqual(audit["status"], "PASS")
        self.assertEqual(audit["record_count"], records)
        self.assertEqual(audit["rollback_check"], rollback_check)
        self.assertEqual(audit["status_authority"], "NONE")
        self.assertAnchor(audit["anchor"], sequence=records)
        storage = audit["storage"]
        self.assertEqual(storage["journal_mode"].lower(), "delete")
        self.assertEqual(storage["synchronous"], 3)

    def runFaultingApply(self, raw: bytes, stage: str) -> None:  # noqa: N802
        context = multiprocessing.get_context("spawn")
        process = context.Process(
            target=_fault_apply_worker,
            args=(str(ROOT), str(self.db), raw, stage),
        )
        process.start()
        process.join(timeout=30)
        if process.is_alive():
            process.terminate()
            process.join(timeout=5)
            self.fail(f"Fault-injected apply hung at {stage}")
        self.assertEqual(process.exitcode, 97, f"fault stage {stage} did not hard-exit as specified")

    def test_init_restart_and_full_frozen_history_replay(self) -> None:
        created = init_store(ROOT, self.db)
        self.assertTrue(created["created"])
        self.assertAudit(created, records=0)

        # Every public call opens and validates the database afresh. Auditing
        # after each commit therefore exercises restart-and-replay, not a cached
        # in-memory state.
        valid_cases = [
            "VALID-T1-SPLIT",
            "VALID-T2-SPLIT",
            "VALID-T3-MERGE",
            "VALID-T4-CREATOR-REMAINS-T2",
        ]
        for sequence, case_id in enumerate(valid_cases, start=1):
            result = apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", case_id))
            self.assertEqual(result["status"], "ACKNOWLEDGED_AFTER_COMMIT")
            self.assertEqual(result["decision"], "CANDIDATE_ACCEPTED")
            self.assertEqual(result["reason_code"], "VALID_CONSERVED_TRANSFER")
            self.assertFalse(result["idempotent"])
            self.assertEqual(result["status_authority"], "NONE")
            self.assertAnchor(result["anchor"], sequence=sequence)
            restarted = audit_store(ROOT, self.db)
            self.assertAudit(restarted, records=sequence)
            self.assertEqual(restarted["anchor"], result["anchor"])

        frozen = self._expected_history("VALID-CHAIN")["checkpoint"]
        final = audit_store(ROOT, self.db)
        self.assertEqual(final["anchor"]["state_root"], frozen["state_root"])
        self.assertEqual(final["anchor"]["receipt_head"], frozen["receipt_head"])
        self.assertEqual(frozen["total_supply"], "1000")

    def test_two_process_initialization_race_preserves_the_winning_store(self) -> None:
        context = multiprocessing.get_context("spawn")
        start = context.Event()
        results = context.Queue()
        processes = [
            context.Process(
                target=_init_worker,
                args=(str(ROOT), str(self.db), start, results),
            )
            for _ in range(2)
        ]
        for process in processes:
            process.start()
        start.set()
        outcomes: list[dict[str, object]] = []
        try:
            outcomes = [results.get(timeout=45) for _ in processes]
        finally:
            for process in processes:
                process.join(timeout=10)
                if process.is_alive():
                    process.terminate()
                    process.join(timeout=5)
            results.close()
            results.join_thread()

        self.assertTrue(all(process.exitcode == 0 for process in processes), outcomes)
        self.assertEqual(sum(bool(item["ok"]) for item in outcomes), 1, outcomes)
        failure = next(item for item in outcomes if not item["ok"])
        self.assertEqual(failure["error_type"], "DurableStoreError")
        self.assertAudit(audit_store(ROOT, self.db), records=0)

    def test_missing_or_invalid_frozen_genesis_leaves_no_reserved_database(self) -> None:
        for label, suite_bytes in (("missing", None), ("invalid", b"{}")):
            with self.subTest(label=label):
                fake_root = self.work / f"fake-root-{label}"
                suite = (
                    fake_root
                    / "experiments"
                    / "R013_PCX_CONSERVED_CLAIM"
                    / "fixtures"
                    / "SUITE.json"
                )
                if suite_bytes is not None:
                    suite.parent.mkdir(parents=True)
                    suite.write_bytes(suite_bytes)
                candidate = self.work / f"unreserved-{label}.sqlite3"
                with self.assertRaises(DurableStoreError):
                    init_store(fake_root, candidate)
                self.assertFalse(candidate.exists())

    def test_exact_retry_is_idempotent_and_does_not_append(self) -> None:
        init_store(ROOT, self.db)
        raw = self._raw("VALID-CHAIN", "VALID-T1-SPLIT")
        first = apply_transfer(ROOT, self.db, raw)
        retried = apply_transfer(ROOT, self.db, raw)

        self.assertEqual(first["reason_code"], "VALID_CONSERVED_TRANSFER")
        self.assertFalse(first["idempotent"])
        self.assertEqual(retried["status"], "ACKNOWLEDGED_AFTER_COMMIT")
        self.assertEqual(retried["reason_code"], "EXACT_REPLAY")
        self.assertTrue(retried["idempotent"])
        self.assertEqual(retried["anchor"], first["anchor"])
        self.assertEqual(retried["store_anchor"], first["anchor"])
        self.assertEqual(retried["receipt"]["receipt_hash"], first["receipt"]["receipt_hash"])
        self.assertAudit(audit_store(ROOT, self.db), records=1)

    def test_old_exact_retry_returns_original_result_and_current_store_tip(self) -> None:
        init_store(ROOT, self.db)
        first_raw = self._raw("VALID-CHAIN", "VALID-T1-SPLIT")
        first = apply_transfer(ROOT, self.db, first_raw)
        second = apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T2-SPLIT"))

        retried = apply_transfer(ROOT, self.db, first_raw)
        self.assertEqual(retried["reason_code"], "EXACT_REPLAY")
        self.assertTrue(retried["idempotent"])
        self.assertEqual(retried["anchor"], first["anchor"])
        self.assertEqual(retried["receipt"], first["receipt"])
        self.assertEqual(retried["store_anchor"], second["anchor"])
        self.assertNotEqual(retried["anchor"], retried["store_anchor"])
        self.assertAudit(audit_store(ROOT, self.db), records=2)

    def test_rejection_is_not_acknowledged_or_persisted(self) -> None:
        init_store(ROOT, self.db)
        accepted = apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T1-SPLIT"))
        with self.assertRaises(DurableStoreError):
            apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "TX-ID-COLLISION"))
        after = audit_store(ROOT, self.db)
        self.assertAudit(after, records=1)
        self.assertEqual(after["anchor"], accepted["anchor"])

    def test_malformed_foreign_and_noncanonical_transfers_append_nothing(self) -> None:
        init_store(ROOT, self.db)
        rejected_cases = (
            "DUPLICATE-JSON-KEY",
            "NON-CANONICAL-WHITESPACE",
            "UNKNOWN-FIELD",
            "ALTERNATE-GENESIS",
            "AUTHORITY-ESCALATION",
        )
        for case_id in rejected_cases:
            with self.subTest(case_id=case_id), self.assertRaises(DurableStoreError):
                apply_transfer(
                    ROOT,
                    self.db,
                    self._raw("HOSTILE-ENCODING-CRYPTO-ARITHMETIC", case_id),
                )
            self.assertAudit(audit_store(ROOT, self.db), records=0)

    def test_every_precommit_hard_exit_stage_leaves_no_record(self) -> None:
        raw = self._raw("VALID-CHAIN", "VALID-T1-SPLIT")
        stages = (
            "BEFORE_BEGIN",
            "AFTER_BEGIN",
            "AFTER_REPLAY",
            "BEFORE_INSERT",
            "AFTER_INSERT",
            "BEFORE_COMMIT",
        )
        for stage in stages:
            with self.subTest(stage=stage):
                self.db = self.work / f"precommit-{stage.lower()}.sqlite3"
                init_store(ROOT, self.db)
                self.runFaultingApply(raw, stage)
                self.assertAudit(audit_store(ROOT, self.db), records=0)

    def test_after_commit_before_ack_recovers_by_exact_retry(self) -> None:
        init_store(ROOT, self.db)
        raw = self._raw("VALID-CHAIN", "VALID-T1-SPLIT")
        self.runFaultingApply(raw, "AFTER_COMMIT_BEFORE_ACK")

        committed = audit_store(ROOT, self.db)
        self.assertAudit(committed, records=1)
        retry = apply_transfer(ROOT, self.db, raw)
        self.assertEqual(retry["reason_code"], "EXACT_REPLAY")
        self.assertTrue(retry["idempotent"])
        self.assertEqual(retry["anchor"], committed["anchor"])
        self.assertAudit(audit_store(ROOT, self.db), records=1)

    def test_competing_sibling_spends_in_two_processes_commit_only_one(self) -> None:
        init_store(ROOT, self.db)
        common = self._raw("COMPETING-C-FIRST", "VALID-COMMON-PARENT")
        sibling_c = self._raw("COMPETING-C-FIRST", "VALID-FIRST-SPEND-TO-C")
        sibling_d = self._raw("COMPETING-C-FIRST", "REJECT-SAME-SIBLING-D-SECOND")
        apply_transfer(ROOT, self.db, common)

        # Compute both individually valid terminal roots before racing them.
        reference_roots: set[str] = set()
        for name, sibling in (("c", sibling_c), ("d", sibling_d)):
            reference = self.work / f"reference-{name}.sqlite3"
            init_store(ROOT, reference)
            apply_transfer(ROOT, reference, common)
            reference_roots.add(apply_transfer(ROOT, reference, sibling)["anchor"]["state_root"])
        self.assertEqual(len(reference_roots), 2)

        context = multiprocessing.get_context("spawn")
        # Eight independent two-process races alternate submission order. This
        # is bounded enough for CI while still exercising fresh SQLite locks
        # and process scheduling rather than replaying one cached outcome.
        for round_number in range(8):
            with self.subTest(round=round_number):
                race_db = self.work / f"race-{round_number:02d}.sqlite3"
                shutil.copy2(self.db, race_db)
                start = context.Event()
                results = context.Queue()
                ordered_siblings = (
                    (sibling_c, sibling_d)
                    if round_number % 2 == 0
                    else (sibling_d, sibling_c)
                )
                processes = [
                    context.Process(
                        target=_concurrent_apply_worker,
                        args=(str(ROOT), str(race_db), raw, start, results),
                    )
                    for raw in ordered_siblings
                ]
                for process in processes:
                    process.start()
                start.set()
                outcomes: list[dict[str, object]] = []
                try:
                    for _ in processes:
                        outcomes.append(results.get(timeout=45))
                except queue.Empty as exc:
                    self.fail(f"Concurrent durable apply did not return: {exc}")
                finally:
                    for process in processes:
                        process.join(timeout=10)
                        if process.is_alive():
                            process.terminate()
                            process.join(timeout=5)
                    results.close()
                    results.join_thread()

                self.assertTrue(all(process.exitcode == 0 for process in processes), outcomes)
                successes = [item for item in outcomes if item["ok"]]
                failures = [item for item in outcomes if not item["ok"]]
                self.assertEqual(len(successes), 1, outcomes)
                self.assertEqual(len(failures), 1, outcomes)
                self.assertEqual(successes[0]["reason_code"], "VALID_CONSERVED_TRANSFER")
                self.assertEqual(failures[0]["error_type"], "DurableStoreError")
                if failures[0]["error_code"] == "TRANSFER_REJECTED":
                    self.assertIn(
                        "PREDECESSOR_STATE_MISMATCH",
                        failures[0]["detail"],
                    )
                else:
                    self.assertIn(
                        failures[0]["error_code"],
                        {"STORE_OPEN_FAILED", "STORE_APPLY_FAILED"},
                    )
                    self.assertRegex(failures[0]["detail"].lower(), r"busy|locked")

                final = audit_store(ROOT, race_db)
                self.assertAudit(final, records=2)
                self.assertIn(final["anchor"]["state_root"], reference_roots)

    def test_external_anchor_confirms_prefix_and_detects_rollback(self) -> None:
        init_store(ROOT, self.db)
        first = apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T1-SPLIT"))
        rolled_back = self.work / "rolled-back.sqlite3"
        shutil.copy2(self.db, rolled_back)
        second = apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T2-SPLIT"))

        confirmed = audit_store(ROOT, self.db, expected_anchor=first["anchor"])
        self.assertAudit(confirmed, records=2, rollback_check="ANCHORED_PREFIX_CONFIRMED")
        current = audit_store(ROOT, self.db, expected_anchor=second["anchor"])
        self.assertAudit(current, records=2, rollback_check="ANCHORED_PREFIX_CONFIRMED")
        with self.assertRaises(DurableStoreError):
            audit_store(ROOT, rolled_back, expected_anchor=second["anchor"])

    def test_external_anchor_detects_same_height_fork(self) -> None:
        left = self.work / "left.sqlite3"
        right = self.work / "right.sqlite3"
        init_store(ROOT, left)
        common = self._raw("COMPETING-C-FIRST", "VALID-COMMON-PARENT")
        common_result = apply_transfer(ROOT, left, common)
        shutil.copy2(left, right)

        left_tip = apply_transfer(
            ROOT,
            left,
            self._raw("COMPETING-C-FIRST", "VALID-FIRST-SPEND-TO-C"),
        )["anchor"]
        right_tip = apply_transfer(
            ROOT,
            right,
            self._raw("COMPETING-C-FIRST", "REJECT-SAME-SIBLING-D-SECOND"),
        )["anchor"]
        self.assertNotEqual(left_tip["record_hash"], right_tip["record_hash"])
        self.assertNotEqual(left_tip["state_root"], right_tip["state_root"])

        self.assertEqual(
            audit_store(ROOT, left, expected_anchor=common_result["anchor"])["rollback_check"],
            "ANCHORED_PREFIX_CONFIRMED",
        )
        self.assertEqual(
            audit_store(ROOT, right, expected_anchor=common_result["anchor"])["rollback_check"],
            "ANCHORED_PREFIX_CONFIRMED",
        )
        with self.assertRaises(DurableStoreError):
            audit_store(ROOT, left, expected_anchor=right_tip)
        with self.assertRaises(DurableStoreError):
            audit_store(ROOT, right, expected_anchor=left_tip)

    def test_exported_anchor_is_exact_canonical_json(self) -> None:
        init_store(ROOT, self.db)
        applied = apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T1-SPLIT"))
        output = self.work / "anchor.json"
        exported = export_anchor(ROOT, self.db, output)
        self.assertEqual(exported, applied["anchor"])
        self.assertEqual(json.loads(output.read_bytes()), exported)
        self.assertEqual(
            output.read_bytes(),
            json.dumps(exported, sort_keys=True, separators=(",", ":")).encode("utf-8"),
        )
        with self.assertRaises(DurableStoreError):
            export_anchor(ROOT, self.db, output)
        self.assertEqual(json.loads(output.read_bytes()), exported)

    def test_two_process_anchor_export_race_never_replaces_the_winner(self) -> None:
        init_store(ROOT, self.db)
        expected = apply_transfer(
            ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T1-SPLIT")
        )["anchor"]
        output = self.work / "raced-anchor.json"
        context = multiprocessing.get_context("spawn")
        start = context.Event()
        results = context.Queue()
        processes = [
            context.Process(
                target=_export_worker,
                args=(str(ROOT), str(self.db), str(output), start, results),
            )
            for _ in range(2)
        ]
        for process in processes:
            process.start()
        start.set()
        outcomes: list[dict[str, object]] = []
        try:
            outcomes = [results.get(timeout=45) for _ in processes]
        finally:
            for process in processes:
                process.join(timeout=10)
                if process.is_alive():
                    process.terminate()
                    process.join(timeout=5)
            results.close()
            results.join_thread()

        self.assertTrue(all(process.exitcode == 0 for process in processes), outcomes)
        self.assertEqual(sum(bool(item["ok"]) for item in outcomes), 1, outcomes)
        failure = next(item for item in outcomes if not item["ok"])
        self.assertEqual(failure["error_type"], "DurableStoreError")
        self.assertEqual(json.loads(output.read_bytes()), expected)

    def test_anchor_sequence_and_file_size_are_strictly_bounded(self) -> None:
        initialized = init_store(ROOT, self.db)
        oversized_sequence = dict(initialized["anchor"])
        oversized_sequence["sequence"] = "9" * 5000
        with self.assertRaises(DurableStoreError):
            audit_store(ROOT, self.db, expected_anchor=oversized_sequence)

        oversized_file = self.work / "oversized-anchor.json"
        oversized_file.write_bytes(b" " * 4097)
        with self.assertRaises(DurableStoreError):
            load_anchor(oversized_file)

    def test_operator_command_surface_and_assurance_gate_are_bound(self) -> None:
        cli_source = (ROOT / "system" / "nexus_lab" / "cli.py").read_text(encoding="utf-8")
        ast.parse(cli_source)
        for command in (
            "pcx-store-init",
            "pcx-store-apply",
            "pcx-store-audit",
            "pcx-store-export-anchor",
        ):
            self.assertGreaterEqual(cli_source.count(f'"{command}"'), 2, command)

        status = {
            "assurance_blocks": [
                {
                    "id": "TEST-R014-MUTATION-BLOCK",
                    "mode": "BLOCK",
                    "commands": [
                        "pcx-store-init",
                        "pcx-store-apply",
                        "pcx-store-audit",
                        "pcx-store-export-anchor",
                    ],
                    "reason": "test-only gate",
                }
            ]
        }
        self.assertEqual(assurance_decision(status, "pcx-store-audit")["status"], "PASS")
        self.assertEqual(assurance_decision(status, "pcx-store-init")["status"], "BLOCKED")
        self.assertEqual(assurance_decision(status, "pcx-store-apply")["status"], "BLOCKED")
        self.assertEqual(
            assurance_decision(status, "pcx-store-export-anchor")["status"],
            "BLOCKED",
        )

    def test_schema_tamper_fails_closed_without_silent_repair(self) -> None:
        init_store(ROOT, self.db)
        apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T1-SPLIT"))
        with sqlite3.connect(self.db) as connection:
            connection.execute("CREATE TABLE rogue_state (counterfeit TEXT NOT NULL) STRICT")

        with self.assertRaises(DurableStoreError):
            audit_store(ROOT, self.db)
        with sqlite3.connect(self.db) as connection:
            names = {
                row[0]
                for row in connection.execute(
                    "SELECT name FROM sqlite_schema WHERE type = 'table'"
                ).fetchall()
            }
        self.assertIn("rogue_state", names, "audit must reject, not silently repair, schema tampering")

    def test_table_constraint_tamper_fails_even_when_columns_are_unchanged(self) -> None:
        init_store(ROOT, self.db)
        with sqlite3.connect(self.db) as connection:
            original = connection.execute(
                "SELECT sql FROM sqlite_schema WHERE type='table' AND name='records'"
            ).fetchone()[0]
            altered = original.replace(
                "CHECK (sequence > 0)",
                "CHECK (sequence >= 0)",
            )
            self.assertNotEqual(original, altered)
            connection.execute("PRAGMA writable_schema=ON")
            connection.execute(
                "UPDATE sqlite_schema SET sql=? WHERE type='table' AND name='records'",
                (altered,),
            )
            connection.execute("PRAGMA writable_schema=OFF")
            version = connection.execute("PRAGMA schema_version").fetchone()[0]
            connection.execute(f"PRAGMA schema_version={version + 1}")
            connection.commit()

        with self.assertRaises(DurableStoreError):
            audit_store(ROOT, self.db)

    def test_offline_record_tamper_fails_closed(self) -> None:
        init_store(ROOT, self.db)
        apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T1-SPLIT"))
        with sqlite3.connect(self.db) as connection:
            sequence, original = connection.execute(
                "SELECT sequence, tx_raw FROM records ORDER BY sequence LIMIT 1"
            ).fetchone()
            with self.assertRaises(sqlite3.DatabaseError):
                connection.execute(
                    "UPDATE records SET tx_raw = tx_raw WHERE sequence = ?", (sequence,)
                )
            connection.rollback()

            triggers = connection.execute(
                "SELECT name, sql FROM sqlite_schema "
                "WHERE type = 'trigger' AND tbl_name = 'records' ORDER BY name"
            ).fetchall()
            self.assertTrue(triggers, "records must be protected by immutable-table triggers")
            for name, _ in triggers:
                quoted = '"' + name.replace('"', '""') + '"'
                connection.execute(f"DROP TRIGGER {quoted}")
            if isinstance(original, str):
                altered = original.encode("utf-8") + b"\x00"
            else:
                altered = bytes(original) + b"\x00"
            connection.execute(
                "UPDATE records SET tx_raw = ? WHERE sequence = ?",
                (sqlite3.Binary(altered), sequence),
            )
            for _, sql in triggers:
                self.assertIsNotNone(sql)
                connection.execute(sql)
            connection.commit()

        with self.assertRaises(DurableStoreError):
            audit_store(ROOT, self.db)

    def test_stored_derived_root_tamper_cannot_drive_recovered_state(self) -> None:
        init_store(ROOT, self.db)
        apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T1-SPLIT"))
        with sqlite3.connect(self.db) as connection:
            triggers = connection.execute(
                "SELECT name, sql FROM sqlite_schema "
                "WHERE type = 'trigger' AND tbl_name = 'records' ORDER BY name"
            ).fetchall()
            for name, _ in triggers:
                quoted = '"' + name.replace('"', '""') + '"'
                connection.execute(f"DROP TRIGGER {quoted}")
            connection.execute(
                "UPDATE records SET next_state_root = ? WHERE sequence = 1",
                ("0" * 64,),
            )
            for _, sql in triggers:
                connection.execute(sql)
            connection.commit()

        with self.assertRaises(DurableStoreError):
            audit_store(ROOT, self.db)

    def test_truncated_and_corrupt_database_files_fail_closed(self) -> None:
        init_store(ROOT, self.db)
        apply_transfer(ROOT, self.db, self._raw("VALID-CHAIN", "VALID-T1-SPLIT"))

        truncated = self.work / "truncated.sqlite3"
        shutil.copy2(self.db, truncated)
        with truncated.open("r+b") as stream:
            stream.truncate(max(64, truncated.stat().st_size // 2))

        corrupt = self.work / "corrupt.sqlite3"
        shutil.copy2(self.db, corrupt)
        with corrupt.open("r+b") as stream:
            stream.seek(0)
            stream.write(b"NOT-A-SQLITE-DB!")

        for damaged in (truncated, corrupt):
            with self.subTest(damaged=damaged.name), self.assertRaises(DurableStoreError):
                audit_store(ROOT, damaged)

    def test_storage_profile_is_delete_journal_and_extra_synchronous(self) -> None:
        report = init_store(ROOT, self.db)
        self.assertAudit(report, records=0)
        with sqlite3.connect(self.db) as connection:
            journal_mode = connection.execute("PRAGMA journal_mode").fetchone()[0]
        self.assertEqual(journal_mode.lower(), "delete")
        self.assertEqual(report["storage"]["synchronous"], 3)

    def test_wal_profile_is_rejected_without_silent_conversion(self) -> None:
        init_store(ROOT, self.db)
        with sqlite3.connect(self.db) as connection:
            changed = connection.execute("PRAGMA journal_mode=WAL").fetchone()[0]
        self.assertEqual(changed.lower(), "wal")

        with self.assertRaises(DurableStoreError):
            audit_store(ROOT, self.db)
        with sqlite3.connect(self.db) as connection:
            unchanged = connection.execute("PRAGMA journal_mode").fetchone()[0]
        self.assertEqual(unchanged.lower(), "wal", "audit must reject WAL, not convert it")

    def test_record_cap_rejects_new_transfer_but_allows_exact_retry(self) -> None:
        self.assertEqual(durable_store.MAX_RECORDS, 256)
        first_raw = self._raw("VALID-CHAIN", "VALID-T1-SPLIT")
        second_raw = self._raw("VALID-CHAIN", "VALID-T2-SPLIT")
        with mock.patch.object(durable_store, "MAX_RECORDS", 1):
            init_store(ROOT, self.db)
            first = apply_transfer(ROOT, self.db, first_raw)
            replay = apply_transfer(ROOT, self.db, first_raw)
            self.assertEqual(replay["reason_code"], "EXACT_REPLAY")
            self.assertEqual(replay["anchor"], first["anchor"])
            with self.assertRaises(DurableStoreError):
                apply_transfer(ROOT, self.db, second_raw)
            self.assertAudit(audit_store(ROOT, self.db), records=1)


if __name__ == "__main__":
    unittest.main()
