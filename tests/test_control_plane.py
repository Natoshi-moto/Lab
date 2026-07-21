from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path

from system.nexus_lab.control_plane import check_control_plane


class ControlPlaneTests(unittest.TestCase):
    def setUp(self) -> None:
        self.root = Path(__file__).resolve().parents[1]

    def _copy_controls(self) -> tuple[tempfile.TemporaryDirectory[str], Path]:
        temporary = tempfile.TemporaryDirectory()
        target = Path(temporary.name)
        for relative in (
            "AGENTS.md", "README.md", "README_START_HERE.md", "CLAUDE.md",
            "NEXT_ACTION.md", "STATUS.json", "STATUS.md", "PROJECT_INDEX.json", "NEXUS.json",
            "programmes/research-lab-bootstrap/STATE.json",
            "operations/receipts/TSK-LABOPS-CTRL-001/OPEN_PULL_REQUESTS.json",
        ):
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(self.root / relative, destination)
        return temporary, target

    @staticmethod
    def _rewrite_json(path: Path, **updates: object) -> None:
        data = json.loads(path.read_text(encoding="utf-8"))
        data.update(updates)
        path.write_text(json.dumps(data), encoding="utf-8")

    def test_repository_control_plane_is_consistent(self) -> None:
        self.assertEqual(check_control_plane(self.root), [])

    def test_detects_round_and_task_drift(self) -> None:
        temporary, root = self._copy_controls()
        with temporary:
            self._rewrite_json(root / "PROJECT_INDEX.json", current_round="R007", active_task="TSK-OLD")
            issues = check_control_plane(root)
            self.assertTrue(any("conflicting active round" in issue for issue in issues))
            self.assertTrue(any("conflicting active task" in issue for issue in issues))

    def test_detects_visibility_drift(self) -> None:
        temporary, root = self._copy_controls()
        with temporary:
            (root / "CLAUDE.md").write_text("Repository visibility: `PRIVATE`\n", encoding="utf-8")
            self.assertTrue(any("public/private contradiction" in issue for issue in check_control_plane(root)))

    def test_detects_redundant_design_next_action(self) -> None:
        temporary, root = self._copy_controls()
        with temporary:
            (root / "NEXT_ACTION.md").write_text("# NEXT ACTION\n\nDesign R017.\n", encoding="utf-8")
            self.assertTrue(any("already represented by open PR #22" in issue for issue in check_control_plane(root)))

    def test_detects_missing_and_malformed_references(self) -> None:
        temporary, root = self._copy_controls()
        with temporary:
            (root / "STATUS.json").write_text("{", encoding="utf-8")
            (root / "NEXT_ACTION.md").unlink()
            issues = check_control_plane(root)
            self.assertTrue(any("malformed or missing control file" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
