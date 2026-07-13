"""Reproducibility tests for the real-signature R016 durable-store demo."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO_PATH = (
    ROOT / "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/run_store_demo.py"
)
GENESIS_PATH = (
    ROOT
    / "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/fixtures/GENESIS.json"
)
TRANSCRIPT_PATH = (
    ROOT
    / "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/fixtures/CLOSED_TRANSCRIPT.json"
)
REPORT_PATH = (
    ROOT
    / "operations/receipts/R016_PCX_INTEGRATED_CUSTODY_GATE/STORE_DEMO_REPORT.json"
)


def load_demo():
    spec = importlib.util.spec_from_file_location("r016_store_demo", DEMO_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError("unable to load R016 store demo")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class R016StoreDemoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if shutil.which("openssl") is None:
            raise unittest.SkipTest("OpenSSL is required for the real-signature demo")
        cls.demo = load_demo()
        cls.first = cls.demo.canonical_line(cls.demo.build_report())
        with tempfile.TemporaryDirectory(prefix="r016-store-demo-cwd-") as temporary:
            completed = subprocess.run(
                [sys.executable, str(DEMO_PATH)],
                cwd=temporary,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=120,
                check=False,
            )
        if completed.returncode != 0:
            raise AssertionError(
                "standalone store demo failed: "
                + completed.stderr.decode("utf-8", errors="replace")
            )
        cls.second = completed.stdout
        cls.saved = REPORT_PATH.read_bytes()
        cls.report = json.loads(cls.saved)
        cls.transcript_raw = TRANSCRIPT_PATH.read_bytes()
        cls.transcript = json.loads(cls.transcript_raw)

    def test_two_fresh_real_signature_runs_are_byte_identical_and_saved(self) -> None:
        self.assertEqual(self.first, self.second)
        self.assertEqual(self.first, self.saved)
        self.assertEqual(
            hashlib.sha256(self.first).hexdigest(),
            hashlib.sha256(self.second).hexdigest(),
        )

    def test_saved_report_is_canonical_compact_and_runtime_independent(self) -> None:
        self.assertTrue(self.saved.endswith(b"\n"))
        self.assertNotIn(b"\n", self.saved[:-1])
        self.assertEqual(self.saved, self.demo.canonical_line(self.report))
        self.assertNotIn(b"/tmp/", self.saved)
        self.assertNotIn(b"sqlite_version", self.saved.lower())
        self.assertNotIn(b"temporary", self.saved.lower())
        self.assertEqual(
            self.report["reproducibility"],
            {
                "encoding": "SORTED_COMPACT_ASCII_JSON_PLUS_LF",
                "required_independent_runs": "2",
                "runtime_paths_in_report": "NONE",
                "runtime_version_fields": "NONE",
            },
        )

    def test_report_matches_the_exact_current_fixtures_and_final_state(self) -> None:
        genesis = GENESIS_PATH.read_bytes()
        self.assertFalse(genesis.endswith(b"\n"))
        self.assertTrue(self.transcript_raw.endswith(b"\n"))
        self.assertEqual(
            self.report["fixtures"]["genesis_sha256"],
            hashlib.sha256(genesis).hexdigest(),
        )
        self.assertEqual(
            self.report["fixtures"]["closed_transcript_sha256"],
            hashlib.sha256(self.transcript_raw).hexdigest(),
        )
        self.assertEqual(
            self.report["fixtures"]["transcript_id"],
            self.transcript["transcript_id"],
        )
        self.assertEqual(self.report["final"]["height"], "6")
        self.assertEqual(self.report["final"]["anchor_sequence"], "6")
        self.assertEqual(self.report["final"]["synthetic_supply"], "1000")
        self.assertEqual(
            self.report["final"]["state_root"], self.transcript["final_state_root"]
        )
        self.assertEqual(
            self.report["final"]["receipt_head"],
            self.transcript["records"][-1]["receipt"]["receipt_hash"],
        )

    def test_all_six_transcript_events_and_receipts_are_evidenced(self) -> None:
        operations = self.report["operations"]
        records = self.transcript["records"]
        self.assertEqual(len(operations), 6)
        self.assertEqual(
            [item["sequence"] for item in operations],
            [str(index) for index in range(1, 7)],
        )
        for operation, record in zip(operations, records, strict=True):
            self.assertEqual(operation["event_sha256"], record["event_sha256"])
            self.assertEqual(operation["kind"], record["kind"])
            self.assertEqual(operation["object_id"], record["object_id"])
            self.assertEqual(
                operation["receipt_hash"], record["receipt"]["receipt_hash"]
            )
            self.assertEqual(len(operation["record_hash"]), 64)
        self.assertEqual(self.report["execution"]["initial_applies"], "6")
        self.assertEqual(self.report["execution"]["exact_retries"], "6")
        self.assertEqual(self.report["execution"]["post_retry_record_count"], "6")
        self.assertEqual(self.report["execution"]["reopen_audit"], "PASS")
        self.assertEqual(
            self.report["execution"]["reopen_rollback_check"],
            "ANCHORED_PREFIX_CONFIRMED",
        )

    def test_claims_are_bounded_and_no_authority_or_secret_path_is_added(self) -> None:
        self.assertEqual(self.report["status_authority"], "NONE")
        self.assertEqual(
            self.report["status"],
            "DEMONSTRATED_REAL_SIGNATURE_DURABLE_REPLAY_AND_ANCHORED_EXACT_RETRY",
        )
        self.assertGreaterEqual(len(self.report["claims"]), 4)
        self.assertGreaterEqual(len(self.report["non_claims"]), 5)
        non_claims = " ".join(self.report["non_claims"]).lower()
        for boundary in (
            "not money",
            "private key",
            "not network consensus",
            "physical power-loss",
            "not formal verification",
        ):
            self.assertIn(boundary, non_claims)

        source = DEMO_PATH.read_text(encoding="utf-8")
        self.assertNotIn("_openssl_verify", source)
        self.assertNotIn("mock.patch", source)
        self.assertNotIn("private_key", source)
        self.assertNotIn("signature_patch", source)


if __name__ == "__main__":
    unittest.main()
