from __future__ import annotations

import json
import tempfile
import unittest
import tomllib
from pathlib import Path

from system.nexus_lab.status import assurance_decision, enforce_assurance_blocks, render_status_markdown
from system.nexus_lab.util import NexusError


class StatusTests(unittest.TestCase):
    def test_pyproject_is_valid_toml(self) -> None:
        root = Path(__file__).resolve().parents[1]
        data = tomllib.loads((root / "pyproject.toml").read_text(encoding="utf-8"))
        self.assertEqual(data["project"]["name"], "nexus-research-lab")

    def test_status_render_names_source_next_action_and_typed_block(self) -> None:
        text = render_status_markdown({
            "lab_id": "LAB",
            "current_round": "R010",
            "current_mode": "TEST",
            "canonical_target": None,
            "active_tasks": ["TSK-1"],
            "assurance_blocks": [{
                "id": "BLOCK-1",
                "mode": "BLOCK",
                "commands": ["github-bootstrap"],
                "reason": "Private-boundary remediation is pending.",
            }],
            "open_defect_blocks": 0,
            "open_assurance_blocks": 1,
            "last_completed_action": "DONE",
            "next_action_id": "NEXT",
        })
        self.assertIn("Generated from `STATUS.json`", text)
        self.assertIn("`NEXT`", text)
        self.assertIn("`BLOCK-1`", text)
        self.assertIn("**BLOCK**", text)
        self.assertIn("`github-bootstrap`", text)

    def test_block_mode_refuses_scoped_command(self) -> None:
        decision = assurance_decision({
            "assurance_blocks": [{
                "id": "BLOCK-GH",
                "mode": "BLOCK",
                "commands": ["github-bootstrap"],
                "reason": "Bootstrap ordering is not yet accepted.",
            }]
        }, "github-bootstrap")
        self.assertEqual(decision["status"], "BLOCKED")
        self.assertEqual([item["id"] for item in decision["blocked"]], ["BLOCK-GH"])

    def test_warn_mode_surfaces_without_blocking(self) -> None:
        decision = assurance_decision({
            "assurance_blocks": [{
                "id": "WARN-ROUTE",
                "mode": "WARN",
                "commands": ["route"],
                "reason": "Route output needs operator review.",
            }]
        }, "route")
        self.assertEqual(decision["status"], "WARN")
        self.assertFalse(decision["blocked"])
        self.assertEqual([item["id"] for item in decision["warnings"]], ["WARN-ROUTE"])

    def test_legacy_string_remains_advisory_not_implicit_gate(self) -> None:
        decision = assurance_decision({"assurance_blocks": ["LEGACY-BLOCK"]}, "freeze")
        self.assertEqual(decision["status"], "PASS")
        self.assertEqual([item["id"] for item in decision["advisory"]], ["LEGACY-BLOCK"])

    def test_diagnostic_command_remains_available(self) -> None:
        decision = assurance_decision({
            "assurance_blocks": [{
                "id": "BLOCK-ALL",
                "mode": "BLOCK",
                "commands": ["*"],
                "reason": "Mutations are paused.",
            }]
        }, "status")
        self.assertEqual(decision["status"], "PASS")
        self.assertFalse(decision["blocked"])

    def test_enforce_reads_status_and_raises(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "STATUS.json").write_text(json.dumps({
                "assurance_blocks": [{
                    "id": "BLOCK-FREEZE",
                    "mode": "BLOCK",
                    "commands": ["freeze"],
                    "reason": "Snapshot invariant is unresolved.",
                }]
            }), encoding="utf-8")
            with self.assertRaisesRegex(NexusError, "BLOCK-FREEZE"):
                enforce_assurance_blocks(root, "freeze")


if __name__ == "__main__":
    unittest.main()
