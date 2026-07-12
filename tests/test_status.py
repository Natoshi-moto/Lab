from __future__ import annotations

import unittest
import tomllib
from pathlib import Path

from system.nexus_lab.status import render_status_markdown


class StatusTests(unittest.TestCase):
    def test_pyproject_is_valid_toml(self) -> None:
        root = Path(__file__).resolve().parents[1]
        data = tomllib.loads((root / "pyproject.toml").read_text(encoding="utf-8"))
        self.assertEqual(data["project"]["name"], "nexus-research-lab")

    def test_status_render_names_source_and_next_action(self) -> None:
        text = render_status_markdown({
            "lab_id": "LAB",
            "current_round": "R001",
            "current_mode": "TEST",
            "canonical_target": None,
            "active_tasks": ["TSK-1"],
            "assurance_blocks": ["BLOCK-1"],
            "open_defect_blocks": 0,
            "open_assurance_blocks": 1,
            "last_completed_action": "DONE",
            "next_action_id": "NEXT",
        })
        self.assertIn("Generated from `STATUS.json`", text)
        self.assertIn("`NEXT`", text)
        self.assertIn("`BLOCK-1`", text)


if __name__ == "__main__":
    unittest.main()
