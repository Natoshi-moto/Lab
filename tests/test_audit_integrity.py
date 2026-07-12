from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from system.nexus_lab.audit import build_audit_pack
from system.nexus_lab.audit_integrity import verify_audit_integrity
from system.nexus_lab.snapshot import build_snapshot
from system.nexus_lab.util import NexusError, pretty_json, sha256_file
from tests.helpers import commit_all, init_git_repo


class AuditIntegrityTests(unittest.TestCase):
    def make_committed_audit(self, root: Path) -> str:
        root.mkdir(parents=True, exist_ok=True)
        (root / "NEXUS.json").write_text("{}\n", encoding="utf-8")
        (root / "docs").mkdir()
        (root / "docs" / "CLAUDE_AUDIT_GUIDE.md").write_text("# Test plan\n", encoding="utf-8")
        (root / "payload.txt").write_text("target\n", encoding="utf-8")
        target_commit = init_git_repo(root)

        snapshot = root / "snapshots" / "target.zip"
        build_snapshot(root, ref=target_commit, snapshot_id="AUDIT-TARGET", output=snapshot)
        build_audit_pack(root, audit_id="AUD-TEST", target_snapshot=snapshot)
        commit_all(root, "add audit apparatus")
        return target_commit

    def test_committed_audit_integrity_passes(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_committed_audit(root)
            report = verify_audit_integrity(root, "AUD-TEST")
            self.assertEqual(report["status"], "PASS")
            self.assertEqual(report["integrity_bindings"]["status"], "PASS")
            self.assertGreater(report["integrity_bindings"]["manifest_files_checked"], 0)

    def test_self_consistent_archive_and_target_rewrite_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_committed_audit(root)
            audit_dir = root / "operations" / "audits" / "AUD-TEST"
            target_path = audit_dir / "TARGET.json"
            target = json.loads(target_path.read_text(encoding="utf-8"))
            snapshot = audit_dir / target["target_snapshot_path"]

            with snapshot.open("ab") as handle:
                handle.write(b"forged trailing bytes")
            target["target_archive_sha256"] = sha256_file(snapshot)
            target_path.write_text(pretty_json(target), encoding="utf-8")

            with self.assertRaisesRegex(NexusError, "manifest|Git index"):
                verify_audit_integrity(root, "AUD-TEST")

    def test_manifest_rewrite_cannot_override_frozen_pack_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_committed_audit(root)
            audit_dir = root / "operations" / "audits" / "AUD-TEST"
            manifest_path = audit_dir / "MANIFEST.sha256"
            manifest_path.write_text(manifest_path.read_text(encoding="utf-8") + "\n", encoding="utf-8")

            with self.assertRaisesRegex(NexusError, "frozen inside the audit pack|Git index"):
                verify_audit_integrity(root, "AUD-TEST")


if __name__ == "__main__":
    unittest.main()
