from __future__ import annotations

import base64
import json
import multiprocessing
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from system.nexus_lab import durable_value
from system.nexus_lab.durable_value import (
    SimulatedCrash,
    commit_durable_transfer,
    genesis_from_suite,
    initialise_durable_ledger,
    validate_r014_saved_evidence,
    verify_durable_ledger,
    verify_independent_durable_ledger,
)
from system.nexus_lab.util import NexusError


ROOT = Path(__file__).resolve().parents[1]
SUITE = ROOT / "experiments" / "R013_PCX_CONSERVED_CLAIM" / "fixtures" / "SUITE.json"
R013_VERIFIER = ROOT / "experiments" / "R013_PCX_CONSERVED_CLAIM" / "independent_verifier.mjs"
R014_VERIFIER = (
    ROOT
    / "experiments"
    / "R014_PCX_DURABLE_SETTLEMENT"
    / "independent_journal_verifier.mjs"
)


def _fixture_case(history_id: str, case_id: str) -> bytes:
    suite = json.loads(SUITE.read_text(encoding="utf-8"))
    for history in suite["histories"]:
        if history["history_id"] != history_id:
            continue
        for case in history["cases"]:
            if case["case_id"] == case_id:
                return base64.b64decode(case["raw_b64"], validate=True)
    raise AssertionError(f"Missing fixture case {history_id}/{case_id}")


def _race_worker(ledger: str, genesis: bytes, transaction: bytes, queue: multiprocessing.Queue) -> None:
    try:
        queue.put(commit_durable_transfer(Path(ledger), genesis, transaction))
    except Exception as exc:  # pragma: no cover - reported to the parent process
        queue.put({"worker_error": repr(exc)})


def _first_writer_worker(
    ledger: str,
    genesis: bytes,
    transaction: bytes,
    start: multiprocessing.Event,
    queue: multiprocessing.Queue,
) -> None:
    start.wait(10)
    _race_worker(ledger, genesis, transaction, queue)


class R014DurableSettlementTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="nexus-r014-test-")
        self.root = Path(self.temporary.name)
        self.ledger = self.root / "ledger"
        self.genesis = genesis_from_suite(SUITE)
        self.t1 = _fixture_case("VALID-CHAIN", "VALID-T1-SPLIT")
        self.t2 = _fixture_case("VALID-CHAIN", "VALID-T2-SPLIT")
        self.t3 = _fixture_case("VALID-CHAIN", "VALID-T3-MERGE")
        self.t4 = _fixture_case("VALID-CHAIN", "VALID-T4-CREATOR-REMAINS-T2")
        self.collision = _fixture_case("VALID-CHAIN", "TX-ID-COLLISION")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def _record_files(self, ledger: Path | None = None) -> list[Path]:
        directory = (ledger or self.ledger) / "records"
        if not directory.exists():
            return []
        return sorted(path for path in directory.iterdir() if not path.name.startswith(".pending-"))

    def test_01_verification_does_not_create_a_missing_ledger(self) -> None:
        with self.assertRaises(NexusError):
            verify_durable_ledger(self.ledger, self.genesis)
        self.assertFalse(self.ledger.exists())

    def test_01b_commit_refuses_to_create_missing_path_ancestry(self) -> None:
        nested = self.root / "missing-parent" / "ledger"
        with self.assertRaisesRegex(NexusError, "parent does not exist"):
            commit_durable_transfer(nested, self.genesis, self.t1)
        self.assertFalse(nested.parent.exists())

    def test_02_initialisation_pins_exact_genesis_and_empty_state(self) -> None:
        report = initialise_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(report["record_count"], "0")
        self.assertEqual(report["total_supply"], "1000")
        self.assertEqual((self.ledger / "GENESIS.pcx").read_bytes(), self.genesis)
        wrong = self.genesis[:-1] + (b" " if self.genesis[-1:] != b" " else b"\n")
        with self.assertRaises(NexusError):
            initialise_durable_ledger(self.ledger, wrong)

    def test_03_valid_transfer_is_acknowledged_only_as_durable(self) -> None:
        result = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertEqual(result["decision"], "DURABLY_COMMITTED")
        self.assertEqual(result["durable"], "TRUE")
        self.assertEqual(result["sequence"], "1")
        report = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(report["record_count"], "1")
        self.assertEqual(report["record_head"], result["record_hash"])
        self.assertEqual(report["state_root"], result["state_root"])
        self.assertEqual(report["total_supply"], "1000")

    def test_04_exact_retry_after_restart_returns_original_receipt_without_append(self) -> None:
        first = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        second = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertEqual(second["decision"], "EXACT_REPLAY")
        self.assertEqual(second["idempotent"], "TRUE")
        self.assertEqual(second["record_hash"], first["record_hash"])
        self.assertEqual(second["receipt_hash"], first["receipt_hash"])
        self.assertEqual(len(self._record_files()), 1)

    def test_05_rejected_collision_changes_no_durable_byte(self) -> None:
        commit_durable_transfer(self.ledger, self.genesis, self.t1)
        before = {path.name: path.read_bytes() for path in self._record_files()}
        before_report = verify_durable_ledger(self.ledger, self.genesis)
        rejected = commit_durable_transfer(self.ledger, self.genesis, self.collision)
        after = {path.name: path.read_bytes() for path in self._record_files()}
        after_report = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(rejected["decision"], "REJECTED")
        self.assertEqual(rejected["durable"], "FALSE")
        self.assertEqual(before, after)
        self.assertEqual(before_report, after_report)

    def test_06_full_valid_chain_recovers_to_identical_root(self) -> None:
        results = [
            commit_durable_transfer(self.ledger, self.genesis, transaction)
            for transaction in (self.t1, self.t2, self.t3, self.t4)
        ]
        self.assertTrue(all(item["decision"] == "DURABLY_COMMITTED" for item in results))
        first = verify_durable_ledger(self.ledger, self.genesis)
        second = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(first, second)
        self.assertEqual(first["record_count"], "4")
        self.assertEqual(first["total_supply"], "1000")

    def test_07_crash_before_temp_write_leaves_old_prefix(self) -> None:
        with self.assertRaises(SimulatedCrash):
            commit_durable_transfer(
                self.ledger,
                self.genesis,
                self.t1,
                fault_stage="before_temp_write",
            )
        report = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(report["record_count"], "0")
        self.assertEqual(report["uncommitted_temp_count"], "0")

    def test_08_crash_after_temp_fsync_ignores_uncommitted_file_and_retry_commits_once(self) -> None:
        with self.assertRaises(SimulatedCrash):
            commit_durable_transfer(
                self.ledger,
                self.genesis,
                self.t1,
                fault_stage="after_temp_fsync_before_rename",
            )
        crashed = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(crashed["record_count"], "0")
        self.assertEqual(crashed["uncommitted_temp_count"], "1")
        retry = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertEqual(retry["decision"], "DURABLY_COMMITTED")
        self.assertEqual(verify_durable_ledger(self.ledger, self.genesis)["record_count"], "1")

    def test_08b_crash_after_temp_write_before_fsync_recovers_old_prefix(self) -> None:
        with self.assertRaises(SimulatedCrash):
            commit_durable_transfer(
                self.ledger,
                self.genesis,
                self.t1,
                fault_stage="after_temp_write_before_fsync",
            )
        crashed = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(crashed["record_count"], "0")
        self.assertEqual(crashed["uncommitted_temp_count"], "1")
        self.assertEqual(commit_durable_transfer(self.ledger, self.genesis, self.t1)["decision"], "DURABLY_COMMITTED")

    def test_09_crash_after_rename_recovers_new_prefix_and_retry_is_exact(self) -> None:
        with self.assertRaises(SimulatedCrash):
            commit_durable_transfer(
                self.ledger,
                self.genesis,
                self.t1,
                fault_stage="after_rename_before_directory_fsync",
            )
        recovered = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(recovered["record_count"], "1")
        retry = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertEqual(retry["decision"], "EXACT_REPLAY")
        self.assertEqual(len(self._record_files()), 1)

    def test_10_crash_after_directory_fsync_recovers_one_commit(self) -> None:
        with self.assertRaises(SimulatedCrash):
            commit_durable_transfer(
                self.ledger,
                self.genesis,
                self.t1,
                fault_stage="after_directory_fsync_before_reply",
            )
        recovered = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(recovered["record_count"], "1")
        self.assertEqual(commit_durable_transfer(self.ledger, self.genesis, self.t1)["decision"], "EXACT_REPLAY")

    def test_10b_retry_repairs_failed_record_directory_fsync_before_durable_ack(self) -> None:
        original = durable_value._fsync_directory
        failed = False

        def fail_first_record_directory_sync(path: Path) -> None:
            nonlocal failed
            if path == self.ledger / "records" and not failed:
                failed = True
                raise OSError("injected record-directory fsync failure")
            original(path)

        with mock.patch.object(durable_value, "_fsync_directory", fail_first_record_directory_sync):
            with self.assertRaisesRegex(OSError, "record-directory"):
                commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertTrue(failed)
        self.assertEqual(len(self._record_files()), 1)

        synced: list[Path] = []

        def observe_sync(path: Path) -> None:
            synced.append(path)
            original(path)

        with mock.patch.object(durable_value, "_fsync_directory", observe_sync):
            retry = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertEqual(retry["decision"], "EXACT_REPLAY")
        self.assertEqual(retry["durable"], "TRUE")
        self.assertIn(self.ledger / "records", synced)

    def test_10c_retry_repairs_failed_genesis_directory_fsync_before_commit_ack(self) -> None:
        original = durable_value._fsync_directory
        ledger_syncs = 0

        def fail_post_genesis_ledger_sync(path: Path) -> None:
            nonlocal ledger_syncs
            if path == self.ledger:
                ledger_syncs += 1
                if ledger_syncs == 2:
                    raise OSError("injected genesis-directory fsync failure")
            original(path)

        with mock.patch.object(durable_value, "_fsync_directory", fail_post_genesis_ledger_sync):
            with self.assertRaisesRegex(OSError, "genesis-directory"):
                commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertTrue((self.ledger / "GENESIS.pcx").is_file())
        self.assertEqual(len(self._record_files()), 0)

        synced: list[Path] = []

        def observe_sync(path: Path) -> None:
            synced.append(path)
            original(path)

        with mock.patch.object(durable_value, "_fsync_directory", observe_sync):
            result = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertEqual(result["decision"], "DURABLY_COMMITTED")
        self.assertIn(self.ledger, synced)
        self.assertIn(self.ledger / "records", synced)

    def test_10d_first_writer_repairs_visible_unsynced_ledger_parent_entry(self) -> None:
        original = durable_value._fsync_directory
        failed = False

        def fail_creator_parent_sync(path: Path) -> None:
            nonlocal failed
            if path == self.root and not failed:
                failed = True
                raise OSError("injected ledger-parent fsync failure")
            original(path)

        with mock.patch.object(durable_value, "_fsync_directory", fail_creator_parent_sync):
            with self.assertRaisesRegex(OSError, "ledger-parent"):
                commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertTrue(self.ledger.is_dir())
        self.assertEqual(len(self._record_files()), 0)

        synced: list[Path] = []

        def observe_sync(path: Path) -> None:
            synced.append(path)
            original(path)

        with mock.patch.object(durable_value, "_fsync_directory", observe_sync):
            result = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        self.assertEqual(result["decision"], "DURABLY_COMMITTED")
        self.assertIn(self.root, synced)

    def test_11_two_processes_racing_sibling_spends_commit_at_most_one(self) -> None:
        common = _fixture_case("COMPETING-C-FIRST", "VALID-COMMON-PARENT")
        spend_c = _fixture_case("COMPETING-C-FIRST", "VALID-FIRST-SPEND-TO-C")
        spend_d = _fixture_case("COMPETING-D-FIRST", "VALID-FIRST-SPEND-TO-D")
        self.assertEqual(commit_durable_transfer(self.ledger, self.genesis, common)["decision"], "DURABLY_COMMITTED")
        context = multiprocessing.get_context("fork")
        queue = context.Queue()
        workers = [
            context.Process(target=_race_worker, args=(str(self.ledger), self.genesis, spend, queue))
            for spend in (spend_c, spend_d)
        ]
        for worker in workers:
            worker.start()
        for worker in workers:
            worker.join(20)
            self.assertFalse(worker.is_alive())
            self.assertEqual(worker.exitcode, 0)
        outcomes = [queue.get(timeout=5), queue.get(timeout=5)]
        self.assertFalse(any("worker_error" in item for item in outcomes), outcomes)
        self.assertEqual(sum(item["decision"] == "DURABLY_COMMITTED" for item in outcomes), 1)
        self.assertEqual(sum(item["decision"] == "REJECTED" for item in outcomes), 1)
        self.assertEqual(verify_durable_ledger(self.ledger, self.genesis)["record_count"], "2")

    def test_11b_two_first_writers_converge_on_one_missing_ledger(self) -> None:
        context = multiprocessing.get_context("fork")
        queue = context.Queue()
        start = context.Event()
        workers = [
            context.Process(
                target=_first_writer_worker,
                args=(str(self.ledger), self.genesis, self.t1, start, queue),
            )
            for _ in range(2)
        ]
        for worker in workers:
            worker.start()
        start.set()
        for worker in workers:
            worker.join(20)
            self.assertFalse(worker.is_alive())
            self.assertEqual(worker.exitcode, 0)
        outcomes = [queue.get(timeout=5), queue.get(timeout=5)]
        self.assertFalse(any("worker_error" in item for item in outcomes), outcomes)
        self.assertEqual(sum(item["decision"] == "DURABLY_COMMITTED" for item in outcomes), 1)
        self.assertEqual(sum(item["decision"] == "EXACT_REPLAY" for item in outcomes), 1)
        self.assertEqual(verify_durable_ledger(self.ledger, self.genesis)["record_count"], "1")

    def test_11c_record_count_capacity_is_checked_before_append(self) -> None:
        with mock.patch.object(durable_value, "MAX_RECORDS", 1):
            first = commit_durable_transfer(self.ledger, self.genesis, self.t1)
            before = {path.name: path.read_bytes() for path in self._record_files()}
            replay = commit_durable_transfer(self.ledger, self.genesis, self.t1)
            self.assertEqual(replay["decision"], "EXACT_REPLAY")
            self.assertEqual(replay["record_hash"], first["record_hash"])
            with self.assertRaisesRegex(NexusError, "record capacity"):
                commit_durable_transfer(self.ledger, self.genesis, self.t2)
            after = {path.name: path.read_bytes() for path in self._record_files()}
            self.assertEqual(before, after)
            self.assertEqual(verify_durable_ledger(self.ledger, self.genesis)["record_count"], "1")

    def test_11d_record_byte_capacity_is_checked_before_append(self) -> None:
        commit_durable_transfer(self.ledger, self.genesis, self.t1)
        before = {path.name: path.read_bytes() for path in self._record_files()}
        existing_bytes = sum(len(raw) for raw in before.values())
        with mock.patch.object(durable_value, "MAX_LEDGER_BYTES", existing_bytes + 1):
            with self.assertRaisesRegex(NexusError, "byte capacity"):
                commit_durable_transfer(self.ledger, self.genesis, self.t2)
            self.assertEqual(verify_durable_ledger(self.ledger, self.genesis)["record_count"], "1")
        after = {path.name: path.read_bytes() for path in self._record_files()}
        self.assertEqual(before, after)

    def test_12_tampered_record_halts_recovery(self) -> None:
        commit_durable_transfer(self.ledger, self.genesis, self.t1)
        record = self._record_files()[0]
        raw = bytearray(record.read_bytes())
        raw[len(raw) // 2] ^= 1
        record.write_bytes(raw)
        with self.assertRaises(NexusError):
            verify_durable_ledger(self.ledger, self.genesis)

    def test_13_missing_or_misnamed_record_halts_recovery(self) -> None:
        commit_durable_transfer(self.ledger, self.genesis, self.t1)
        commit_durable_transfer(self.ledger, self.genesis, self.t2)
        second = self._record_files()[1]
        second.rename(second.with_name("00000003-" + second.name.split("-", 1)[1]))
        with self.assertRaises(NexusError):
            verify_durable_ledger(self.ledger, self.genesis)

    def test_14_unknown_or_symlink_members_fail_closed(self) -> None:
        initialise_durable_ledger(self.ledger, self.genesis)
        (self.ledger / "records" / "unexpected").write_text("x", encoding="utf-8")
        with self.assertRaises(NexusError):
            verify_durable_ledger(self.ledger, self.genesis)
        (self.ledger / "records" / "unexpected").unlink()
        link_name = "00000001-" + "0" * 64 + ".pcx"
        os.symlink(self.ledger / "GENESIS.pcx", self.ledger / "records" / link_name)
        with self.assertRaises(NexusError):
            verify_durable_ledger(self.ledger, self.genesis)

    def test_14a_too_many_pending_records_fail_closed(self) -> None:
        initialise_durable_ledger(self.ledger, self.genesis)
        records = self.ledger / "records"
        for index in range(durable_value.MAX_PENDING_RECORDS + 1):
            (records / f".pending-{index}-{index:032x}").touch()
        with self.assertRaisesRegex(NexusError, "pending records"):
            verify_durable_ledger(self.ledger, self.genesis)
        with self.assertRaisesRegex(NexusError, "pending records"):
            commit_durable_transfer(self.ledger, self.genesis, self.t1)

    def test_14b_replaced_genesis_halts_recovery(self) -> None:
        commit_durable_transfer(self.ledger, self.genesis, self.t1)
        genesis_path = self.ledger / "GENESIS.pcx"
        altered = bytearray(genesis_path.read_bytes())
        altered[len(altered) // 2] ^= 1
        genesis_path.write_bytes(altered)
        with self.assertRaises(NexusError):
            verify_durable_ledger(self.ledger, self.genesis)

    def test_15_independent_javascript_replay_matches_every_committed_prefix(self) -> None:
        for transaction in (self.t1, self.t2, self.t3, self.t4):
            commit_durable_transfer(self.ledger, self.genesis, transaction)
        report = verify_independent_durable_ledger(
            self.ledger,
            self.genesis,
            node_verifier=R014_VERIFIER,
            r013_verifier=R013_VERIFIER,
            repo_root=ROOT,
        )
        python = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["record_head"], python["record_head"])
        self.assertEqual(report["state_root"], python["state_root"])
        self.assertEqual(report["checkpoint_id"], python["checkpoint_id"])
        self.assertEqual(report["total_supply"], "1000")

    def test_16_unpinned_independent_verifier_is_rejected(self) -> None:
        commit_durable_transfer(self.ledger, self.genesis, self.t1)
        copy = self.root / "copy.mjs"
        shutil.copyfile(R014_VERIFIER, copy)
        with self.assertRaises(NexusError):
            verify_independent_durable_ledger(
                self.ledger,
                self.genesis,
                node_verifier=copy,
                r013_verifier=R013_VERIFIER,
                repo_root=ROOT,
            )

    def test_16b_unpinned_r013_state_verifier_is_rejected(self) -> None:
        commit_durable_transfer(self.ledger, self.genesis, self.t1)
        copy = self.root / "r013-copy.mjs"
        shutil.copyfile(R013_VERIFIER, copy)
        with self.assertRaises(NexusError):
            verify_independent_durable_ledger(
                self.ledger,
                self.genesis,
                node_verifier=R014_VERIFIER,
                r013_verifier=copy,
                repo_root=ROOT,
            )

    def test_17_local_prefix_does_not_claim_rollback_detection(self) -> None:
        commit_durable_transfer(self.ledger, self.genesis, self.t1)
        report = verify_durable_ledger(self.ledger, self.genesis)
        joined = " ".join(report["non_claims"]).lower()
        self.assertIn("rollback detection", joined)
        self.assertIn("independently held head anchor", joined)

    def test_18_out_of_band_head_anchor_detects_local_truncation(self) -> None:
        first = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        second = commit_durable_transfer(self.ledger, self.genesis, self.t2)
        self._record_files()[-1].unlink()
        # A bare local replay cannot distinguish this valid old prefix from the
        # complete history. A head retained outside the ledger can.
        self.assertEqual(verify_durable_ledger(self.ledger, self.genesis)["record_head"], first["record_hash"])
        with self.assertRaisesRegex(NexusError, "rolled back"):
            verify_durable_ledger(
                self.ledger,
                self.genesis,
                expected_record_head=second["record_hash"],
            )

    def test_19_commit_refuses_to_build_on_a_missing_external_head_anchor(self) -> None:
        first = commit_durable_transfer(self.ledger, self.genesis, self.t1)
        second = commit_durable_transfer(self.ledger, self.genesis, self.t2)
        self._record_files()[-1].unlink()
        before = verify_durable_ledger(self.ledger, self.genesis)
        with self.assertRaisesRegex(NexusError, "rolled back"):
            commit_durable_transfer(
                self.ledger,
                self.genesis,
                self.t2,
                expected_record_head=second["record_hash"],
            )
        after = verify_durable_ledger(self.ledger, self.genesis)
        self.assertEqual(before, after)
        self.assertEqual(after["record_head"], first["record_hash"])

    def test_20_saved_demo_and_claim_bindings_reproduce(self) -> None:
        report = validate_r014_saved_evidence(ROOT)
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["status_authority"], "NONE")
        self.assertEqual(report["local"]["record_count"], "4")
        self.assertEqual(report["independent"]["status"], "PASS")


if __name__ == "__main__":
    unittest.main()
