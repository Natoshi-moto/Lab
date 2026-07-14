from __future__ import annotations

import unittest

from experiments.R017_REPLICATION_FORK_EVIDENCE.run_partition_demo import run_demo


class PartitionDemoTests(unittest.TestCase):
    def test_process_separated_valid_sibling_histories(self) -> None:
        report = run_demo()
        self.assertEqual(
            report["status"],
            "DEMONSTRATED_PROCESS_SEPARATED_VALID_SIBLING_HISTORIES_AND_ORDER_INDEPENDENT_FORK_EVIDENCE",
        )
        self.assertEqual(report["status_authority"], "NONE")
        self.assertNotEqual(report["left"]["history_id"], report["right"]["history_id"])
        self.assertNotEqual(report["left"]["state_root"], report["right"]["state_root"])
        self.assertEqual(report["fork_proof"]["reason"], "CONFLICTING_SIBLING_HISTORIES")
        self.assertNotIn("winner", report)
        self.assertNotIn("canonical", report)

    def test_two_runs_are_deterministic(self) -> None:
        first = run_demo()
        second = run_demo()
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
