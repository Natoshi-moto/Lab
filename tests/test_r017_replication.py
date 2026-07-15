from __future__ import annotations

import base64
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from system.nexus_lab.custody_kernel import canonical_json
from system.nexus_lab.replication import (
    AuthenticationError, CorruptEnvelopeError, GenesisMismatchError,
    fork_evidence, load_campaign, run_campaign, verify_checkpoint,
)


ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT = ROOT / "experiments" / "R017_REPLICATION_FORK_EVIDENCE"
CAMPAIGN = EXPERIMENT / "fixtures" / "COMPOUND_CAMPAIGN.json"
EXPECTED = EXPERIMENT / "fixtures" / "EXPECTED_REPORT.json"
RUNNER = EXPERIMENT / "run_campaign.py"
GENERATOR = EXPERIMENT / "generate_campaign.py"
NODE = EXPERIMENT / "independent_verifier.mjs"
R016_NODE = ROOT / "experiments" / "R016_PCX_INTEGRATED_CUSTODY_GATE" / "independent_verifier.mjs"


class R017ReplicationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.campaign = load_campaign(CAMPAIGN)
        self.expected = EXPECTED.read_bytes()

    def test_python_and_node_reports_converge_exactly(self) -> None:
        python = subprocess.run([sys.executable, str(RUNNER), str(CAMPAIGN)], cwd=ROOT,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        node = subprocess.run(["node", str(NODE), str(CAMPAIGN), str(EXPECTED)], cwd=ROOT,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        self.assertEqual(python.returncode, 0, python.stderr.decode())
        self.assertEqual(node.returncode, 0, node.stderr.decode())
        self.assertEqual(python.stdout, self.expected)
        self.assertEqual(node.stdout, self.expected)

    def test_generator_is_byte_reproducible(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r017-generate-") as temporary:
            result = subprocess.run([sys.executable, str(GENERATOR), temporary], cwd=ROOT,
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
            self.assertEqual(result.returncode, 0, result.stderr.decode())
            self.assertEqual((Path(temporary) / CAMPAIGN.name).read_bytes(), CAMPAIGN.read_bytes())
            self.assertEqual((Path(temporary) / EXPECTED.name).read_bytes(), EXPECTED.read_bytes())

    def test_both_closed_branches_replay_in_independent_r016_verifier(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r017-branches-") as temporary:
            root = Path(temporary)
            genesis = root / "GENESIS.json"
            genesis.write_bytes(base64.b64decode(self.campaign["genesis_b64"]))
            reports = []
            for index, transcript in enumerate(self.campaign["branch_transcripts"]):
                path = root / f"BRANCH-{index}.json"
                path.write_bytes(canonical_json(transcript) + b"\n")
                result = subprocess.run(["node", str(R016_NODE), str(genesis), str(path)], cwd=ROOT,
                                        stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
                self.assertEqual(result.returncode, 0, result.stderr.decode())
                reports.append(json.loads(result.stdout))
        self.assertNotEqual(reports[0]["transcript_id"], reports[1]["transcript_id"])
        self.assertEqual({item["status"] for item in reports}, {"PASS"})

    def test_sender_session_domain_payload_and_signature_mutations_fail(self) -> None:
        original = self.campaign["checkpoints"][0]
        mutations = []
        for field, value in [
            ("host", "B"), ("session", "f" * 64), ("profile", "WRONG"),
            ("genesis_sha256", "e" * 64), ("payload_digest", "d" * 64),
            ("signature", "0" * 128),
        ]:
            item = copy.deepcopy(original); item[field] = value; mutations.append(item)
        for item in mutations:
            with self.subTest(field=[key for key in item if item[key] != original.get(key)]):
                with self.assertRaises((AuthenticationError, GenesisMismatchError)):
                    verify_checkpoint(item, host_keys=self.campaign["host_keys"],
                                      genesis_sha256=self.campaign["genesis_sha256"],
                                      session=self.campaign["session"])

    def test_corrupt_sibling_and_lookalike_genesis_fail_closed(self) -> None:
        corrupt = copy.deepcopy(self.campaign)
        corrupt["siblings"][0]["event_sha256"] = "0" * 64
        with self.assertRaises(CorruptEnvelopeError):
            run_campaign(corrupt)
        lookalike = copy.deepcopy(self.campaign)
        lookalike["genesis_sha256"] = "0" * 64
        with self.assertRaises(GenesisMismatchError):
            run_campaign(lookalike)

    def test_duplicate_checkpoint_is_deterministic_and_selects_no_branch(self) -> None:
        report = run_campaign(self.campaign)
        self.assertEqual(report["fork_evidence"]["classification"], "SIBLING_FORK_OBSERVED")
        self.assertEqual(report["fork_evidence"]["branch_selection"], "NONE")
        reordered = fork_evidence(
            genesis_sha256=self.campaign["genesis_sha256"],
            predecessor=report["fork_evidence"]["predecessor"],
            children=list(reversed(report["fork_evidence"]["children"])),
            checkpoints=list(reversed(self.campaign["checkpoints"])),
        )
        self.assertEqual(reordered, report["fork_evidence"])

    def test_report_is_non_authoritative_and_binds_all_deliveries(self) -> None:
        report = json.loads(self.expected)
        self.assertEqual(report["status_authority"], "NONE")
        self.assertEqual(report["fork_evidence"]["status_authority"], "NONE")
        self.assertEqual(int(report["accounted_deliveries"]), len(self.campaign["schedule"]))
        forbidden = {"winner", "preferred", "canonical_branch", "final"}
        self.assertTrue(forbidden.isdisjoint(report["fork_evidence"]))


if __name__ == "__main__":
    unittest.main()
