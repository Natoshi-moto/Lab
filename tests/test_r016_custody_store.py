"""Adversarial durability tests for the additive R016 custody store.

The custody kernel's real-signature behavior is covered separately.  These
tests replace only its OpenSSL verification call so they can focus narrowly on
ordering, replay, crash recovery, corruption handling, and external anchors.
No private key or secret fixture is created or committed here.
"""

from __future__ import annotations

import hashlib
import multiprocessing
import queue
import shutil
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import system.nexus_lab.custody_kernel as kernel
import system.nexus_lab.custody_store as store


def _ident(label: str) -> str:
    return hashlib.sha256(("r016-store-test:" + label).encode("ascii")).hexdigest()


def _accept_test_signature(*_args: object) -> None:
    """Test boundary: signature semantics are covered by the kernel suite."""


def _apply_worker(
    genesis: bytes,
    database: str,
    event: bytes,
    fault_stage: str | None,
    start: multiprocessing.synchronize.Event | None,
    results: multiprocessing.queues.Queue | None,
) -> None:
    """Process entry point used for real hard exits and writer races."""

    kernel._openssl_verify = _accept_test_signature
    if start is not None and not start.wait(10):
        if results is not None:
            results.put(("error", "START_TIMEOUT", "start gate did not open"))
        return
    try:
        result = store.apply_custody_event(
            genesis,
            Path(database),
            event,
            fault_stage=fault_stage,
        )
        if results is not None:
            results.put(
                (
                    "ok",
                    result["receipt"]["object_id"],
                    result["idempotent"],
                )
            )
    except BaseException as exc:  # process boundary reports typed failures
        if results is not None:
            results.put(("error", getattr(exc, "code", type(exc).__name__), str(exc)))


class R016CustodyStoreTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        try:
            cls.processes = multiprocessing.get_context("fork")
        except ValueError as exc:  # pragma: no cover - this profile targets POSIX SQLite
            raise unittest.SkipTest("R016 crash tests require fork-capable POSIX") from exc

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="r016-store-")
        self.directory = Path(self.temporary.name)
        self.controller = _ident("controller")
        self.active_key = _ident("active-key")
        self.guardians = sorted(
            [_ident("guardian-1"), _ident("guardian-2"), _ident("guardian-3")]
        )
        self.genesis_outpoint = _ident("genesis-outpoint")
        self.genesis = kernel.canonical_json(
            {
                "controllers": [
                    {
                        "active_key": self.active_key,
                        "controller": self.controller,
                        "recovery_keys": self.guardians,
                    }
                ],
                "kind": "GENESIS",
                "network": kernel.NETWORK,
                "profile": kernel.PROFILE,
                "status_authority": kernel.STATUS_AUTHORITY,
                "utxos": [
                    {
                        "amount": "1000",
                        "controller": self.controller,
                        "outpoint": self.genesis_outpoint,
                    }
                ],
                "version": kernel.PROTOCOL_VERSION,
            }
        )
        self.database = self.directory / "custody.sqlite3"
        self.signature_patch = mock.patch.object(
            kernel, "_openssl_verify", _accept_test_signature
        )
        self.signature_patch.start()

    def tearDown(self) -> None:
        self.signature_patch.stop()
        self.temporary.cleanup()

    def _machine(self) -> kernel.Machine:
        return kernel.Machine(self.genesis)

    def _transfer(self, machine: kernel.Machine, *, split: bool = False) -> bytes:
        current = machine.controller(self.controller)
        input_item = next(
            item for item in machine.utxos() if item["controller"] == self.controller
        )
        amount = int(input_item["amount"])
        if split:
            first = amount // 3
            outputs = [
                {"amount": str(first), "controller": self.controller},
                {"amount": str(amount - first), "controller": self.controller},
            ]
        else:
            outputs = [{"amount": str(amount), "controller": self.controller}]
        operation = {
            "controller": self.controller,
            "controller_epoch": current["epoch"],
            "controller_head": current["head"],
            "inputs": [input_item["outpoint"]],
            "kind": "TRANSFER",
            "network": kernel.NETWORK,
            "object_id": kernel.ZERO_HEAD,
            "outputs": outputs,
            "predecessor": machine.state_root,
            "profile": kernel.PROFILE,
            "status_authority": kernel.STATUS_AUTHORITY,
            "version": kernel.PROTOCOL_VERSION,
        }
        operation["object_id"] = kernel.operation_id(operation)
        operation["proofs"] = [
            {
                "key": current["active_key"],
                "outpoint": input_item["outpoint"],
                "signature": "00" * 64,
            }
        ]
        return kernel.canonical_json(operation)

    def _two_events(self) -> tuple[bytes, bytes]:
        machine = self._machine()
        first = self._transfer(machine)
        machine.apply(first)
        return first, self._transfer(machine)

    def _init_with_one_record(self, path: Path) -> tuple[bytes, dict]:
        store.init_custody_store(self.genesis, path)
        event = self._transfer(self._machine())
        result = store.apply_custody_event(self.genesis, path, event)
        return event, result

    def _assert_store_error(self, code: str, callback: object, *args: object) -> None:
        with self.assertRaises(store.CustodyStoreError) as caught:
            callback(*args)  # type: ignore[operator]
        self.assertEqual(caught.exception.code, code)

    def _join(self, process: multiprocessing.Process) -> int | None:
        process.join(30)
        if process.is_alive():
            process.terminate()
            process.join(5)
            self.fail("child process did not terminate")
        return process.exitcode

    def test_exact_bytes_full_replay_and_retry_without_state_tables(self) -> None:
        created = store.init_custody_store(self.genesis, self.database)
        self.assertTrue(created["created"])
        self.assertEqual(created["record_count"], 0)
        self.assertEqual(
            created["storage"],
            {
                "integrity_check": "ok",
                "journal_mode": "DELETE",
                "synchronous": "EXTRA",
                "transaction": "BEGIN IMMEDIATE",
                "trusted_schema": "OFF",
            },
        )

        event = self._transfer(self._machine())
        accepted = store.apply_custody_event(self.genesis, self.database, event)
        self.assertEqual(accepted["status"], "ACKNOWLEDGED_AFTER_COMMIT")
        self.assertFalse(accepted["idempotent"])
        self.assertEqual(accepted["status_authority"], "NONE")
        self.assertEqual(accepted["receipt"]["status_authority"], "NONE")

        connection = sqlite3.connect(self.database)
        try:
            event_raw, receipt_raw = connection.execute(
                "SELECT event_raw, receipt_raw FROM records"
            ).fetchone()
            objects = {
                row[0]
                for row in connection.execute(
                    "SELECT name FROM sqlite_schema "
                    "WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                )
            }
        finally:
            connection.close()
        self.assertEqual(event_raw, event)
        self.assertEqual(receipt_raw, kernel.canonical_json(accepted["receipt"]))
        self.assertEqual(objects, {"meta", "records"})

        retry = store.apply_custody_event(self.genesis, self.database, event)
        self.assertTrue(retry["idempotent"])
        self.assertEqual(retry["reason_code"], "EXACT_REPLAY")
        self.assertEqual(retry["receipt"], accepted["receipt"])
        self.assertEqual(retry["anchor"], accepted["anchor"])
        self.assertEqual(store.audit_custody_store(self.genesis, self.database)["record_count"], 1)

        sibling = self._transfer(self._machine(), split=True)
        self._assert_store_error(
            "EVENT_REJECTED",
            store.apply_custody_event,
            self.genesis,
            self.database,
            sibling,
        )
        self.assertEqual(store.audit_custody_store(self.genesis, self.database)["record_count"], 1)

    def test_every_precommit_hard_exit_recovers_without_a_record(self) -> None:
        stages = (
            "BEFORE_BEGIN",
            "AFTER_BEGIN",
            "AFTER_REPLAY",
            "BEFORE_INSERT",
            "AFTER_INSERT",
            "BEFORE_COMMIT",
        )
        event = self._transfer(self._machine())
        for index, stage in enumerate(stages):
            with self.subTest(stage=stage):
                database = self.directory / f"precommit-{index}.sqlite3"
                store.init_custody_store(self.genesis, database)
                process = self.processes.Process(
                    target=_apply_worker,
                    args=(self.genesis, str(database), event, stage, None, None),
                )
                process.start()
                self.assertEqual(self._join(process), 97)
                report = store.audit_custody_store(self.genesis, database)
                self.assertEqual(report["status"], "PASS")
                self.assertEqual(report["record_count"], 0)

    def test_commit_before_lost_ack_is_durable_and_retry_is_exact(self) -> None:
        store.init_custody_store(self.genesis, self.database)
        event = self._transfer(self._machine())
        process = self.processes.Process(
            target=_apply_worker,
            args=(
                self.genesis,
                str(self.database),
                event,
                "AFTER_COMMIT_BEFORE_ACK",
                None,
                None,
            ),
        )
        process.start()
        self.assertEqual(self._join(process), 97)

        committed = store.audit_custody_store(self.genesis, self.database)
        self.assertEqual(committed["record_count"], 1)
        retry = store.apply_custody_event(self.genesis, self.database, event)
        self.assertTrue(retry["idempotent"])
        self.assertEqual(retry["reason_code"], "EXACT_REPLAY")
        self.assertEqual(retry["anchor"], committed["anchor"])
        self.assertEqual(store.audit_custody_store(self.genesis, self.database)["record_count"], 1)

    def test_competing_writers_serialize_one_ordered_prefix(self) -> None:
        store.init_custody_store(self.genesis, self.database)
        first = self._transfer(self._machine())
        sibling = self._transfer(self._machine(), split=True)
        start = self.processes.Event()
        results = self.processes.Queue()
        workers = [
            self.processes.Process(
                target=_apply_worker,
                args=(self.genesis, str(self.database), event, None, start, results),
            )
            for event in (first, sibling)
        ]
        for process in workers:
            process.start()
        start.set()
        for process in workers:
            self.assertEqual(self._join(process), 0)
        try:
            outcomes = [results.get(timeout=5), results.get(timeout=5)]
        except queue.Empty as exc:
            self.fail(f"writer did not report its outcome: {exc}")
        finally:
            results.close()
            results.join_thread()

        self.assertEqual([item[0] for item in outcomes].count("ok"), 1)
        errors = [item for item in outcomes if item[0] == "error"]
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0][1], "EVENT_REJECTED")
        report = store.audit_custody_store(self.genesis, self.database)
        self.assertEqual(report["record_count"], 1)
        self.assertEqual(report["height"], 1)

    def test_schema_record_chain_corruption_and_wal_fail_closed(self) -> None:
        record_db = self.directory / "record-tamper.sqlite3"
        self._init_with_one_record(record_db)
        connection = sqlite3.connect(record_db)
        try:
            connection.execute("DROP TRIGGER records_no_update")
            connection.execute(
                "UPDATE records SET previous_record_hash = ? WHERE sequence = 1",
                ("f" * 64,),
            )
            connection.execute(store.TRIGGER_SQL["records_no_update"])
            connection.commit()
        finally:
            connection.close()
        self._assert_store_error(
            "RECORD_CHAIN_INVALID", store.audit_custody_store, self.genesis, record_db
        )

        exact_db = self.directory / "record-exactness.sqlite3"
        self._init_with_one_record(exact_db)
        connection = sqlite3.connect(exact_db)
        try:
            connection.execute("DROP TRIGGER records_no_update")
            connection.execute(
                "UPDATE records SET event_sha256 = ? WHERE sequence = 1",
                ("e" * 64,),
            )
            connection.execute(store.TRIGGER_SQL["records_no_update"])
            connection.commit()
        finally:
            connection.close()
        self._assert_store_error(
            "RECORD_TAMPERED", store.audit_custody_store, self.genesis, exact_db
        )

        schema_db = self.directory / "schema-tamper.sqlite3"
        store.init_custody_store(self.genesis, schema_db)
        connection = sqlite3.connect(schema_db)
        try:
            connection.execute("CREATE TABLE surprise (value TEXT) STRICT")
            connection.commit()
        finally:
            connection.close()
        self._assert_store_error(
            "SCHEMA_TAMPERED", store.audit_custody_store, self.genesis, schema_db
        )

        wal_db = self.directory / "wal-sidecar.sqlite3"
        store.init_custody_store(self.genesis, wal_db)
        Path(str(wal_db) + "-wal").touch()
        self._assert_store_error(
            "STORAGE_PROFILE_MISMATCH",
            store.audit_custody_store,
            self.genesis,
            wal_db,
        )

        wal_header_db = self.directory / "wal-header.sqlite3"
        store.init_custody_store(self.genesis, wal_header_db)
        with wal_header_db.open("r+b") as handle:
            handle.seek(18)
            handle.write(b"\x02\x02")
            handle.flush()
        self._assert_store_error(
            "STORAGE_PROFILE_MISMATCH",
            store.audit_custody_store,
            self.genesis,
            wal_header_db,
        )

        truncated_db = self.directory / "truncated.sqlite3"
        store.init_custody_store(self.genesis, truncated_db)
        with truncated_db.open("r+b") as handle:
            handle.truncate(32)
        with self.assertRaises(store.CustodyStoreError) as caught:
            store.audit_custody_store(self.genesis, truncated_db)
        self.assertIn(
            caught.exception.code,
            {"STORE_HEADER_INVALID", "STORE_OPEN_FAILED", "DATABASE_CORRUPT"},
        )

    def test_fixed_capacity_preserves_retry_but_rejects_new_history(self) -> None:
        with mock.patch.object(store, "MAX_RECORDS", 1):
            store.init_custody_store(self.genesis, self.database)
            first, second = self._two_events()
            accepted = store.apply_custody_event(self.genesis, self.database, first)
            self.assertFalse(accepted["idempotent"])
            retry = store.apply_custody_event(self.genesis, self.database, first)
            self.assertTrue(retry["idempotent"])
            self._assert_store_error(
                "RECORD_LIMIT_EXCEEDED",
                store.apply_custody_event,
                self.genesis,
                self.database,
                second,
            )
            report = store.audit_custody_store(self.genesis, self.database)
            self.assertEqual(report["record_count"], 1)

    def test_external_anchors_detect_fork_and_rollback_and_never_replace(self) -> None:
        first, second = self._two_events()
        primary = self.directory / "primary.sqlite3"
        store.init_custody_store(self.genesis, primary)
        first_result = store.apply_custody_event(self.genesis, primary, first)
        anchor_path = self.directory / "retained-anchor.json"
        anchor_one = store.export_custody_anchor(
            self.genesis, primary, anchor_path
        )
        self.assertEqual(anchor_one, first_result["anchor"])
        self.assertEqual(anchor_path.read_bytes(), kernel.canonical_json(anchor_one))
        self.assertEqual(store.load_custody_anchor(anchor_path), anchor_one)
        self._assert_store_error(
            "ANCHOR_PATH_INVALID",
            store.export_custody_anchor,
            self.genesis,
            primary,
            anchor_path,
        )

        rolled_back = self.directory / "old-prefix.sqlite3"
        shutil.copy2(primary, rolled_back)
        second_result = store.apply_custody_event(
            self.genesis, primary, second, expected_anchor=anchor_one
        )
        self.assertEqual(second_result["rollback_check"], "ANCHORED_PREFIX_CONFIRMED")
        anchor_two = store.audit_custody_store(self.genesis, primary)["anchor"]
        self._assert_store_error(
            "ROLLBACK_DETECTED",
            store.audit_custody_store,
            self.genesis,
            rolled_back,
            anchor_two,
        )

        forked = self.directory / "forked.sqlite3"
        store.init_custody_store(self.genesis, forked)
        sibling = self._transfer(self._machine(), split=True)
        store.apply_custody_event(self.genesis, forked, sibling)
        self._assert_store_error(
            "FORK_OR_TAMPER_DETECTED",
            store.audit_custody_store,
            self.genesis,
            forked,
            anchor_one,
        )


if __name__ == "__main__":
    unittest.main()
