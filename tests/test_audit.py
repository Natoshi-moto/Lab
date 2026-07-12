from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from system.nexus_lab.audit import build_audit_pack, check_audit, ingest_observation
from system.nexus_lab.snapshot import build_snapshot
from system.nexus_lab.route import verify_manifest_pack
from system.nexus_lab.util import NexusError
from tests.helpers import init_git_repo


class AuditTests(unittest.TestCase):
    def make_audit(self, root: Path) -> tuple[str, dict]:
        (root / "NEXUS.json").write_text('{}\n', encoding="utf-8")
        (root / "docs").mkdir()
        (root / "docs" / "CLAUDE_AUDIT_GUIDE.md").write_text("# Test plan\n", encoding="utf-8")
        (root / "payload.txt").write_text("target\n", encoding="utf-8")
        commit = init_git_repo(root)
        snapshot = root / "snapshots" / "target.zip"
        result = build_snapshot(root, ref=commit, snapshot_id="AUDIT-TARGET", output=snapshot)
        target = build_audit_pack(root, audit_id="AUD-TEST", target_snapshot=snapshot)
        verified_pack = verify_manifest_pack(root / target["audit_pack_path"])
        if verified_pack["status"] != "PASS":
            raise AssertionError("audit pack verification failed")
        return commit, target

    def observation(self, root: Path) -> dict:
        target = json.loads((root / "operations/audits/AUD-TEST/TARGET.json").read_text(encoding="utf-8"))
        template = json.loads((root / "operations/audits/AUD-TEST/OBSERVATION_TEMPLATE.json").read_text(encoding="utf-8"))
        template.update({
            "observation_id": "AUDOBS-TEST-0001",
            "claim": "The target is bound to the recorded archive digest.",
            "files_seen": ["TARGET.json"],
            "reproduction": ["Recomputed SHA-256"],
            "expected": target["target_archive_sha256"],
            "actual": target["target_archive_sha256"],
            "created_at": "2026-07-12T12:00:00Z",
        })
        return template

    def test_valid_observation_appends_and_chain_verifies(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_audit(root)
            first = root / "one.json"
            first.write_text(json.dumps(self.observation(root)), encoding="utf-8")
            checked = ingest_observation(root, "AUD-TEST", first, check_only=True)
            self.assertTrue(checked["valid"])
            accepted = ingest_observation(root, "AUD-TEST", first)
            self.assertTrue(accepted["record_hash"])

            second_data = self.observation(root)
            second_data["observation_id"] = "AUDOBS-TEST-0002"
            second_data["claim"] = "A second independent claim is stored after the first."
            second = root / "two.json"
            second.write_text(json.dumps(second_data), encoding="utf-8")
            ingest_observation(root, "AUD-TEST", second)
            report = check_audit(root, "AUD-TEST")
            self.assertEqual(report["observation_count"], 2)
            self.assertEqual(report["status"], "PASS")

    def test_target_substitution_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_audit(root)
            observation = self.observation(root)
            observation["target_archive_sha256"] = "0" * 64
            path = root / "bad.json"
            path.write_text(json.dumps(observation), encoding="utf-8")
            with self.assertRaises(NexusError):
                ingest_observation(root, "AUD-TEST", path, check_only=True)

    def test_self_promoting_observation_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_audit(root)
            observation = self.observation(root)
            observation["status_authority"] = "PROMOTE"
            path = root / "bad.json"
            path.write_text(json.dumps(observation), encoding="utf-8")
            with self.assertRaises(NexusError):
                ingest_observation(root, "AUD-TEST", path, check_only=True)

    def test_chain_tampering_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.make_audit(root)
            path = root / "one.json"
            path.write_text(json.dumps(self.observation(root)), encoding="utf-8")
            ingest_observation(root, "AUD-TEST", path)
            ledger = root / "operations/audits/AUD-TEST/ledger/AUDIT_OBSERVATIONS.jsonl"
            record = json.loads(ledger.read_text(encoding="utf-8"))
            record["claim"] = "mutated"
            ledger.write_text(json.dumps(record) + "\n", encoding="utf-8")
            with self.assertRaises(NexusError):
                check_audit(root, "AUD-TEST")


if __name__ == "__main__":
    unittest.main()
