from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from system.nexus_lab.audit import build_audit_pack
from system.nexus_lab.audit_integrity import verify_audit_integrity
from system.nexus_lab.route import _write_deterministic_zip
from system.nexus_lab.snapshot import _write_zip, build_snapshot
from system.nexus_lab.util import (
    NexusError,
    atomic_write_text,
    canonical_json_bytes,
    pretty_json,
    render_manifest,
    sha256_bytes,
    sha256_file,
)
from tests.helpers import commit_all, init_git_repo, run


class AuditGitTreeBindingTests(unittest.TestCase):
    def make_audit(self, root: Path) -> str:
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

    @staticmethod
    def replace_snapshot_payload(snapshot: Path) -> None:
        entries: dict[str, tuple[bytes, bool]] = {}
        with zipfile.ZipFile(snapshot, "r") as archive:
            for info in archive.infolist():
                mode = (info.external_attr >> 16) & 0xFFFF
                entries[info.filename] = (archive.read(info), bool(mode & 0o111))

        entries["payload.txt"] = (b"replacement payload\n", False)
        payload_bytes = {
            name: data for name, (data, _) in entries.items() if not name.startswith("_nexus/")
        }
        payload_manifest = render_manifest(payload_bytes).encode("utf-8")
        metadata = json.loads(entries["_nexus/SNAPSHOT_METADATA.json"][0])
        metadata["payload_manifest_sha256"] = sha256_bytes(payload_manifest)
        entries["_nexus/PAYLOAD_MANIFEST.sha256"] = (payload_manifest, False)
        entries["_nexus/SNAPSHOT_METADATA.json"] = (canonical_json_bytes(metadata), False)
        package_bytes = {
            name: data
            for name, (data, _) in entries.items()
            if name != "_nexus/PACKAGE_MANIFEST.sha256"
        }
        entries["_nexus/PACKAGE_MANIFEST.sha256"] = (
            render_manifest(package_bytes).encode("utf-8"),
            False,
        )
        _write_zip(snapshot, entries)

    @staticmethod
    def rebuild_audit_pack(audit_dir: Path, audit_id: str) -> None:
        entries: dict[str, tuple[bytes, bool]] = {}
        excluded = {f"{audit_id}.zip", f"{audit_id}.zip.sha256", "MANIFEST.sha256"}
        for path in sorted(audit_dir.rglob("*")):
            if path.is_file() and path.name not in excluded:
                entries[path.relative_to(audit_dir).as_posix()] = (path.read_bytes(), False)
        manifest = render_manifest({name: data for name, (data, _) in entries.items()}).encode("utf-8")
        (audit_dir / "MANIFEST.sha256").write_bytes(manifest)
        entries["MANIFEST.sha256"] = (manifest, False)
        pack = audit_dir / f"{audit_id}.zip"
        _write_deterministic_zip(pack, entries)
        atomic_write_text(pack.with_suffix(".zip.sha256"), f"{sha256_file(pack)}  {pack.name}\n")

    def test_clean_committed_replacement_does_not_match_target_commit_tree(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            target_commit = self.make_audit(root)
            audit_dir = root / "operations/audits/AUD-TEST"
            target_path = audit_dir / "TARGET.json"
            target = json.loads(target_path.read_text(encoding="utf-8"))
            self.assertEqual(target["target_commit"], target_commit)
            snapshot = audit_dir / target["target_snapshot_path"]

            self.replace_snapshot_payload(snapshot)
            digest = sha256_file(snapshot)
            target["target_archive_sha256"] = digest
            target_path.write_text(pretty_json(target), encoding="utf-8")
            atomic_write_text(snapshot.with_suffix(".zip.sha256"), f"{digest}  {snapshot.name}\n")
            self.rebuild_audit_pack(audit_dir, "AUD-TEST")
            commit_all(root, "commit replacement audit overlay")
            self.assertEqual(run(["git", "status", "--porcelain=v1"], root), "")

            with self.assertRaisesRegex(NexusError, "immutable Git tree at target_commit"):
                verify_audit_integrity(root, "AUD-TEST")


if __name__ == "__main__":
    unittest.main()
