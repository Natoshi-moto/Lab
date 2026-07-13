from __future__ import annotations

import json
import unittest

from experiments.R013_PCX_CONSERVED_CLAIM.exhaustive_model import (
    MAX_DEPTH,
    MAX_INPUTS,
    MAX_OUTPUTS,
    OWNERS,
    SUPPLY,
    InvalidTransfer,
    apply_transfer,
    enumerate_transfers,
    exhaustive_summary,
    initial_state,
    report_bytes,
)


class R013SmallStateModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.summary = exhaustive_summary()

    def test_exhaustive_bounds_and_stable_counts(self) -> None:
        self.assertEqual(
            self.summary["parameters"],
            {
                "supply": SUPPLY,
                "owner_count": len(OWNERS),
                "max_inputs": MAX_INPUTS,
                "max_outputs": MAX_OUTPUTS,
                "max_depth": MAX_DEPTH,
            },
        )
        self.assertEqual(self.summary["states_by_depth"], [1, 30, 249, 1341, 4737])
        self.assertEqual(self.summary["unique_states_through_depth"], 5881)
        self.assertEqual(self.summary["valid_transitions_checked"], 115266)
        self.assertTrue(all(count > 0 for count in self.summary["states_by_depth"]))

    def test_every_reachable_transition_preserved_bounded_invariants(self) -> None:
        self.assertTrue(self.summary["all_live_outputs_positive"])
        self.assertTrue(self.summary["all_states_conserve_supply"])
        self.assertGreater(self.summary["valid_transitions_checked"], 0)

    def test_every_spent_selection_replay_was_rejected(self) -> None:
        self.assertTrue(self.summary["all_spent_selection_replays_rejected"])
        self.assertGreater(self.summary["replay_attempts"], 0)
        self.assertEqual(self.summary["replay_rejections"], self.summary["replay_attempts"])

        state = initial_state()
        transfer = next(enumerate_transfers(state))
        next_state = apply_transfer(state, transfer)
        with self.assertRaisesRegex(InvalidTransfer, "INPUT_NOT_UNSPENT"):
            apply_transfer(next_state, transfer)

    def test_summary_serialization_is_deterministic_and_non_authoritative(self) -> None:
        encoded = report_bytes()
        self.assertEqual(encoded, report_bytes())
        self.assertTrue(encoded.endswith(b"\n"))
        parsed = json.loads(encoded)
        self.assertEqual(parsed, self.summary)
        self.assertEqual(parsed["status_authority"], "NONE")
        self.assertEqual(parsed["claim_scope"], "BOUNDED_ABSTRACT_MODEL_ONLY")
        self.assertEqual(
            parsed["transition_digest"],
            "751ba92a967e3ebe93d1f9197f9d2a906bf16186901e87b117899d447d5c16fb",
        )


if __name__ == "__main__":
    unittest.main()
