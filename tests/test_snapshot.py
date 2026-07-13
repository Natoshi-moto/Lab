from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
import zlib
from pathlib import Path

from system.nexus_lab.snapshot import build_snapshot, verify_snapshot
from system.nexus_lab.util import NexusError, sha256_file
from tests.helpers import commit_all, init_git_repo, run


class SnapshotTests(unittest.TestCase):
    def make_repo(self, root: Path) -> str:
        (root / "NEXUS.json").write_text('{"schema":"test"}\n', encoding="utf-8")
        (root / "a.txt").write_text("alpha\n", encoding="utf-8")
        script = root / "run.sh"
        script.write_text("#!/bin/sh\necho test\n", encoding="utf-8")
        script.chmod(0o755)
        return init_git_repo(root)

    def test_same_toolchain_commit_produces_byte_identical_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            commit = self.make_repo(root)
            one = root / "one.zip"
            two = root / "two.zip"
            first = build_snapshot(root, ref=commit, snapshot_id="TEST-001", output=one)
            second = build_snapshot(root, ref=commit, snapshot_id="TEST-001", output=two)
            self.assertEqual(one.read_bytes(), two.read_bytes())
            self.assertEqual(first["archive_sha256"], second["archive_sha256"])
            self.assertEqual(
                first["determinism"]["outer_archive_scope"],
                "SAME_PYTHON_ZIPFILE_AND_ZLIB_RUNTIME",
            )
            self.assertEqual(
                first["determinism"]["cross_toolchain_identity"],
                "GIT_TREE_AND_PAYLOAD_MANIFEST",
            )
            self.assertEqual(first["toolchain"]["zlib_runtime_version"], zlib.ZLIB_RUNTIME_VERSION)
            verified = verify_snapshot(one, expected_sha256=first["archive_sha256"])
            self.assertEqual(verified["source_commit"], commit)
            self.assertEqual(verified["status"], "CANONICAL_AS_IS")
            self.assertEqual(verified["payload_manifest_sha256"], first["payload_manifest_sha256"])
            self.assertEqual(verified["toolchain"], first["toolchain"])

    def test_snapshot_metadata_contains_toolchain_scope(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            commit = self.make_repo(root)
            snapshot = root / "snapshot.zip"
            build_snapshot(root, ref=commit, snapshot_id="TEST-SCOPE", output=snapshot)
            with zipfile.ZipFile(snapshot, "r") as archive:
                metadata = json.loads(archive.read("_nexus/SNAPSHOT_METADATA.json"))
            self.assertEqual(
                metadata["determinism"]["outer_archive_scope"],
                "SAME_PYTHON_ZIPFILE_AND_ZLIB_RUNTIME",
            )
            self.assertEqual(metadata["toolchain"]["zlib_compile_version"], zlib.ZLIB_VERSION)
            self.assertEqual(metadata["toolchain"]["zlib_runtime_version"], zlib.ZLIB_RUNTIME_VERSION)

    def test_tampered_member_fails_internal_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            commit = self.make_repo(root)
            original = root / "original.zip"
            build_snapshot(root, ref=commit, snapshot_id="TEST-002", output=original)
            tampered = root / "tampered.zip"
            with zipfile.ZipFile(original, "r") as source, zipfile.ZipFile(tampered, "w") as target:
                for info in source.infolist():
                    data = source.read(info)
                    if info.filename == "a.txt":
                        data = b"tampered\n"
                    target.writestr(info, data)
            with self.assertRaises(NexusError):
                verify_snapshot(tampered)

    def test_external_digest_mismatch_fails(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            commit = self.make_repo(root)
            snapshot = root / "snapshot.zip"
            build_snapshot(root, ref=commit, snapshot_id="TEST-003", output=snapshot)
            with self.assertRaises(NexusError):
                verify_snapshot(snapshot, expected_sha256="0" * 64)

    def test_tracked_symlink_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "NEXUS.json").write_text('{}\n', encoding="utf-8")
            (root / "target.txt").write_text("target\n", encoding="utf-8")
            init_git_repo(root)
            (root / "link.txt").symlink_to("target.txt")
            commit = commit_all(root, "add symlink")
            with self.assertRaises(NexusError):
                build_snapshot(root, ref=commit, snapshot_id="TEST-004", output=root / "bad.zip")


if __name__ == "__main__":
    unittest.main()
