from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from system.nexus_lab.route import build_route, verify_manifest_pack
from system.nexus_lab.util import NexusError
from tests.helpers import init_git_repo


class RouteTests(unittest.TestCase):
    def make_repo(self, root: Path) -> str:
        (root / "NEXUS.json").write_text('{}\n', encoding="utf-8")
        (root / "docs").mkdir()
        (root / "docs" / "a.md").write_text("A\n", encoding="utf-8")
        (root / "docs" / "b.md").write_text("B\n", encoding="utf-8")
        (root / "schema.json").write_text('{"type":"object"}\n', encoding="utf-8")
        return init_git_repo(root)

    def task(self, root: Path, commit: str) -> Path:
        task = {
            "schema": "nexus.task/v1",
            "task_id": "TSK-TEST-001",
            "route_id": "RTE-TEST-001",
            "objective": "Inspect declared docs",
            "baseline_ref": commit,
            "requested_role": "reviewer",
            "seat": "test-seat",
            "authority": "OBSERVE_ONLY",
            "allowed_read": ["docs"],
            "allowed_write": ["returns/test"],
            "include_paths": ["docs"],
            "exclude_paths": ["private"],
            "data_classes": ["LAB_PRIVATE"],
            "output_contract": {"type": "object", "schema_path": "schema.json"},
            "approval_required": True,
        }
        path = root / "task.json"
        path.write_text(json.dumps(task), encoding="utf-8")
        return path

    def test_route_declares_exact_context_and_exclusions(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            commit = self.make_repo(root)
            out = root / "routes"
            result = build_route(root, self.task(root, commit), output_root=out)
            self.assertEqual(result["included_count"], 2)
            route = json.loads((out / "RTE-TEST-001" / "ROUTE.json").read_text(encoding="utf-8"))
            self.assertEqual(route["baseline_commit"], commit)
            self.assertEqual(len(route["task_sha256"]), 64)
            self.assertTrue((out / "RTE-TEST-001" / "TASK.json").is_file())
            self.assertEqual([x["path"] for x in route["included"]], ["docs/a.md", "docs/b.md"])
            self.assertIn("private", route["excluded"])
            with zipfile.ZipFile(out / "RTE-TEST-001.zip") as archive:
                self.assertIn("context/docs/a.md", archive.namelist())
                self.assertIn("READ_SCOPE.md", archive.namelist())
                self.assertIn("EXCLUSIONS.md", archive.namelist())
            verified = verify_manifest_pack(out / "RTE-TEST-001.zip")
            self.assertEqual(verified["kind"], "route")

    def test_output_schema_is_read_from_tagged_baseline_not_live_worktree(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            commit = self.make_repo(root)
            task_path = self.task(root, commit)
            (root / "schema.json").write_text('{"changed":true}\n', encoding="utf-8")
            out = root / "routes"
            build_route(root, task_path, output_root=out)
            schema = json.loads((out / "RTE-TEST-001" / "OUTPUT_SCHEMA.json").read_text(encoding="utf-8"))
            self.assertEqual(schema, {"type": "object"})

    def test_existing_route_id_is_not_overwritten(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            commit = self.make_repo(root)
            task_path = self.task(root, commit)
            out = root / "routes"
            build_route(root, task_path, output_root=out)
            with self.assertRaises(NexusError):
                build_route(root, task_path, output_root=out)

    def test_route_rejects_path_traversal(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            commit = self.make_repo(root)
            task_path = self.task(root, commit)
            task = json.loads(task_path.read_text(encoding="utf-8"))
            task["include_paths"] = ["../outside"]
            task_path.write_text(json.dumps(task), encoding="utf-8")
            with self.assertRaises(NexusError):
                build_route(root, task_path, output_root=root / "routes")

    def test_route_refuses_secret_data_class(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            commit = self.make_repo(root)
            task_path = self.task(root, commit)
            task = json.loads(task_path.read_text(encoding="utf-8"))
            task["data_classes"] = ["SECRET"]
            task_path.write_text(json.dumps(task), encoding="utf-8")
            with self.assertRaises(NexusError):
                build_route(root, task_path, output_root=root / "routes")


if __name__ == "__main__":
    unittest.main()
