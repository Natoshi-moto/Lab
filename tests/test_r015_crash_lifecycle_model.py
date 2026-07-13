from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODEL = (
    ROOT
    / "experiments"
    / "R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL"
    / "crash_lifecycle_model.py"
)
SAVED_MODEL = (
    ROOT
    / "operations"
    / "receipts"
    / "R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL"
    / "MODEL_CHECK_REPORT.json"
)
SAVED_SELF_TEST = SAVED_MODEL.with_name("MODEL_SELF_TEST_REPORT.json")


def _run(*args: str) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["python3", str(MODEL), *args],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=60,
    )


class R015CrashLifecycleModelTests(unittest.TestCase):
    def test_exhaustive_report_is_deterministic_and_bounded(self) -> None:
        first = _run()
        second = _run()
        self.assertEqual(first.returncode, 0, first.stderr.decode())
        self.assertEqual(second.returncode, 0, second.stderr.decode())
        self.assertEqual(first.stdout, second.stdout)
        self.assertEqual(first.stdout, SAVED_MODEL.read_bytes())
        report = json.loads(first.stdout)
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["status_authority"], "NONE")
        self.assertEqual(report["counts"]["states"], 1995)
        self.assertEqual(report["counts"]["transitions"], 29340)
        self.assertEqual(report["counts"]["invariant_checks"], 123453)
        self.assertEqual(report["counts"]["max_depth_reached"], 8)
        self.assertEqual(len(report["coverage"]), 26)
        self.assertEqual(
            report["transition_digest"],
            "bb819166a96a4b469bdf4d3feec150487bf1b98af444f5c5f9e0165b1ccf7330",
        )
        self.assertGreater(report["coverage"]["older_valid_history_unanchored"], 0)
        self.assertGreater(report["coverage"]["commit_crash_old_prefix"], 0)
        self.assertGreater(report["coverage"]["commit_crash_complete_new_prefix"], 0)
        self.assertEqual(report["coverage"]["declared_corruption_rejection_is_noop"], 5985)

    def test_self_test_kills_every_deliberate_mutant(self) -> None:
        result = _run("--self-test")
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        self.assertEqual(result.stdout, SAVED_SELF_TEST.read_bytes())
        report = json.loads(result.stdout)
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["status_authority"], "NONE")
        mutants = report["mutants"]
        self.assertGreaterEqual(len(mutants), 5)
        self.assertTrue(all(item["killed"] == "TRUE" for item in mutants), mutants)

    def test_model_is_standalone(self) -> None:
        source = MODEL.read_text(encoding="utf-8")
        self.assertNotIn("durable_store", source)
        self.assertNotIn("value_kernel", source)
        self.assertNotIn("sqlite3", source)
        self.assertNotIn("subprocess", source)


if __name__ == "__main__":
    unittest.main()
