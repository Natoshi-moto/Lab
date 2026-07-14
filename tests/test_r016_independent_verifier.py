from __future__ import annotations

import base64
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT = ROOT / "experiments" / "R016_PCX_INTEGRATED_CUSTODY_GATE"
GENESIS = EXPERIMENT / "fixtures" / "GENESIS.json"
TRANSCRIPT = EXPERIMENT / "fixtures" / "CLOSED_TRANSCRIPT.json"
PYTHON_VERIFIER = EXPERIMENT / "verify_transcript.py"
NODE_VERIFIER = EXPERIMENT / "independent_verifier.mjs"
FROZEN_REPORT = (
    ROOT
    / "operations"
    / "receipts"
    / "R016_PCX_INTEGRATED_CUSTODY_GATE"
    / "CROSS_IMPLEMENTATION_REPORT.json"
)
ZERO = "0" * 64
TRANSCRIPT_DOMAIN = "NEXUS/R016/CLOSED-TRANSCRIPT/v1"


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value, ensure_ascii=True, sort_keys=True, separators=(",", ":")
    ).encode("ascii")


def transcript_hash(value: dict[str, Any]) -> str:
    subject = copy.deepcopy(value)
    subject["transcript_id"] = ZERO
    payload = canonical_json(subject)
    domain = TRANSCRIPT_DOMAIN.encode("ascii")
    frame = (
        len(domain).to_bytes(2, "big")
        + domain
        + len(payload).to_bytes(8, "big")
        + payload
    )
    return hashlib.sha256(frame).hexdigest()


class R016IndependentVerifierTests(unittest.TestCase):
    maxDiff = None

    @staticmethod
    def run_python(transcript: Path = TRANSCRIPT) -> subprocess.CompletedProcess[bytes]:
        return subprocess.run(
            [sys.executable, str(PYTHON_VERIFIER), str(GENESIS), str(transcript)],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=30,
        )

    @staticmethod
    def run_node(transcript: Path = TRANSCRIPT) -> subprocess.CompletedProcess[bytes]:
        return subprocess.run(
            ["node", str(NODE_VERIFIER), str(GENESIS), str(transcript)],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=30,
        )

    def test_verifiers_match_saved_report_and_repeat_exactly(self) -> None:
        python_first = self.run_python()
        python_second = self.run_python()
        node_first = self.run_node()
        node_second = self.run_node()
        for result in (python_first, python_second, node_first, node_second):
            self.assertEqual(result.returncode, 0, result.stderr.decode())
        expected = FROZEN_REPORT.read_bytes()
        self.assertEqual(python_first.stdout, expected)
        self.assertEqual(python_second.stdout, expected)
        self.assertEqual(node_first.stdout, expected)
        self.assertEqual(node_second.stdout, expected)

    def test_report_commits_final_state_supply_and_lifecycle_counts(self) -> None:
        report = json.loads(FROZEN_REPORT.read_text(encoding="ascii"))
        transcript = json.loads(TRANSCRIPT.read_text(encoding="ascii"))
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["status_authority"], "NONE")
        self.assertEqual(report["synthetic_supply"], "1000")
        self.assertEqual(report["event_count"], "6")
        self.assertEqual(report["final_height"], transcript["final_state"]["height"])
        self.assertEqual(report["final_state_root"], transcript["final_state_root"])
        self.assertEqual(report["transcript_id"], transcript["transcript_id"])
        self.assertEqual(
            report["operation_counts"],
            {"RECOVER": "1", "REVOKE": "1", "ROTATE": "1", "TRANSFER": "3"},
        )
        self.assertEqual(report["final_locked_controller"]["status"], "LOCKED")
        self.assertEqual(report["final_locked_controller"]["active_key"], ZERO)

    def test_both_verifiers_fail_closed_on_a_validly_reframed_bad_signature(self) -> None:
        transcript = json.loads(TRANSCRIPT.read_text(encoding="ascii"))
        event = json.loads(base64.b64decode(transcript["records"][0]["event_b64"]))
        old_signature = event["proofs"][0]["signature"]
        replacement = "0" if old_signature[-1] != "0" else "1"
        event["proofs"][0]["signature"] = old_signature[:-1] + replacement
        event_wire = canonical_json(event)
        transcript["records"][0]["event_b64"] = base64.b64encode(event_wire).decode("ascii")
        transcript["records"][0]["event_sha256"] = hashlib.sha256(event_wire).hexdigest()
        transcript["transcript_id"] = transcript_hash(transcript)
        with tempfile.TemporaryDirectory(prefix="nexus-r016-bad-signature-") as temporary:
            path = Path(temporary) / "CLOSED_TRANSCRIPT.json"
            path.write_bytes(canonical_json(transcript) + b"\n")
            python_result = self.run_python(path)
            node_result = self.run_node(path)
        self.assertNotEqual(python_result.returncode, 0)
        self.assertNotEqual(node_result.returncode, 0)
        self.assertIn(b"invalid Ed25519 signature", python_result.stderr)
        self.assertIn(b"invalid Ed25519 signature", node_result.stderr)


if __name__ == "__main__":
    unittest.main()
