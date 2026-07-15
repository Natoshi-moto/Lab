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

from system.nexus_lab.custody_kernel import Machine


ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT = ROOT / "experiments" / "R018_PQ_HYBRID_ADMISSION"
FIXTURES = EXPERIMENT / "fixtures"
PRIMARY = ROOT / "system" / "nexus_lab" / "pq_admission.mjs"
COLD = EXPERIMENT / "independent_verifier.mjs"
GENERATOR = EXPERIMENT / "generate_fixture.mjs"
INTEROP = EXPERIMENT / "interop_self_test.mjs"
DEMO = EXPERIMENT / "run_hybrid_demo.py"
EVENT = FIXTURES / "EVENT.json"
POLICY = FIXTURES / "POLICY.json"
AUTHORIZATION = FIXTURES / "AUTHORIZATION.json"
GENESIS = ROOT / "experiments" / "R016_PCX_INTEGRATED_CUSTODY_GATE" / "fixtures" / "GENESIS.json"
EXPECTED = ROOT / "operations" / "receipts" / "R018_PQ_HYBRID_ADMISSION" / "PQ_ADMISSION_REPORT.json"
EXPECTED_INTEROP = ROOT / "operations" / "receipts" / "R018_PQ_HYBRID_ADMISSION" / "ML_DSA_INTEROP_REPORT.json"
EXPECTED_DEMO = ROOT / "operations" / "receipts" / "R018_PQ_HYBRID_ADMISSION" / "DEMO_REPORT.json"

ZERO = "0" * 64
POLICY_DOMAIN = b"NEXUS/R018/PQ-ADMISSION-POLICY/v0"
KEY_DOMAIN = b"NEXUS/R018/ML-DSA-65-PUBLIC-KEY/v0"


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("ascii")


def content(path: Path) -> bytes:
    raw = path.read_bytes()
    return raw[:-1] if raw.endswith(b"\n") else raw


def framed(domain: bytes, payload: bytes) -> bytes:
    return len(domain).to_bytes(2, "big") + domain + len(payload).to_bytes(8, "big") + payload


def recompute_policy_id(policy: dict[str, Any]) -> str:
    subject = copy.deepcopy(policy)
    subject["policy_id"] = ZERO
    return hashlib.sha256(framed(POLICY_DOMAIN, canonical_json(subject))).hexdigest()


def raw_key_id(public_key: bytes) -> str:
    return hashlib.sha256(framed(KEY_DOMAIN, public_key)).hexdigest()


def write_document(path: Path, value: Any) -> None:
    path.write_bytes(canonical_json(value) + b"\n")


class R018PostQuantumHybridAdmissionTests(unittest.TestCase):
    maxDiff = None

    @classmethod
    def setUpClass(cls) -> None:
        version = subprocess.run(
            ["node", "-p", "process.versions.node"],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=10,
        )
        if version.returncode != 0:
            raise unittest.SkipTest("Node is required for R018")
        major = int(version.stdout.decode("ascii").split(".", 1)[0])
        if major < 24:
            raise unittest.SkipTest("Node 24+ native ML-DSA-65 is required for R018")

    @staticmethod
    def run_verifier(
        script: Path,
        policy: Path = POLICY,
        event: Path = EVENT,
        authorization: Path = AUTHORIZATION,
    ) -> subprocess.CompletedProcess[bytes]:
        return subprocess.run(
            ["node", str(script), str(policy), str(event), str(authorization)],
            cwd=ROOT,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=30,
        )

    def assert_both_reject(
        self,
        policy: Path,
        event: Path,
        authorization: Path,
    ) -> tuple[subprocess.CompletedProcess[bytes], subprocess.CompletedProcess[bytes]]:
        primary = self.run_verifier(PRIMARY, policy, event, authorization)
        cold = self.run_verifier(COLD, policy, event, authorization)
        self.assertNotEqual(primary.returncode, 0, primary.stdout.decode())
        self.assertNotEqual(cold.returncode, 0, cold.stdout.decode())
        self.assertEqual(primary.stdout, b"")
        self.assertEqual(cold.stdout, b"")
        return primary, cold

    def test_exact_fixture_passes_two_verifiers_byte_for_byte(self) -> None:
        primary_first = self.run_verifier(PRIMARY)
        primary_second = self.run_verifier(PRIMARY)
        cold_first = self.run_verifier(COLD)
        cold_second = self.run_verifier(COLD)
        expected = EXPECTED.read_bytes()
        for result in (primary_first, primary_second, cold_first, cold_second):
            self.assertEqual(result.returncode, 0, result.stderr.decode())
            self.assertEqual(result.stdout, expected)

    def test_fixture_rebuild_is_exact_and_public(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r018-rebuild-") as temporary:
            output = Path(temporary)
            result = subprocess.run(
                ["node", str(GENERATOR), str(EVENT), str(output)],
                cwd=ROOT,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
                timeout=30,
            )
            self.assertEqual(result.returncode, 0, result.stderr.decode())
            for name in ("AUTHORIZATION.json", "EVENT.json", "POLICY.json"):
                self.assertEqual((output / name).read_bytes(), (FIXTURES / name).read_bytes())

    def test_native_and_cold_implementations_interoperate_both_directions(self) -> None:
        result = subprocess.run(
            ["node", str(INTEROP)],
            cwd=ROOT,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=30,
        )
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        self.assertEqual(result.stdout, EXPECTED_INTEROP.read_bytes())

    def test_hybrid_differential_demo_repeats_exact_frozen_report(self) -> None:
        results = [
            subprocess.run(
                [sys.executable, str(DEMO)],
                cwd=ROOT,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
                timeout=45,
            )
            for _ in range(2)
        ]
        expected = EXPECTED_DEMO.read_bytes()
        for result in results:
            self.assertEqual(result.returncode, 0, result.stderr.decode())
            self.assertEqual(result.stdout, expected)

    def test_positive_path_is_an_and_gate_with_unchanged_r016(self) -> None:
        for verifier in (PRIMARY, COLD):
            result = self.run_verifier(verifier)
            self.assertEqual(result.returncode, 0, result.stderr.decode())
        machine = Machine(content(GENESIS))
        receipt = machine.apply(content(EVENT))
        self.assertEqual(receipt["object_id"], json.loads(content(EVENT))["object_id"])
        self.assertEqual(receipt["status_authority"], "NONE")

    def test_r016_only_baseline_accepts_while_missing_pq_authorization_fails(self) -> None:
        baseline = Machine(content(GENESIS))
        baseline.apply(content(EVENT))
        with tempfile.TemporaryDirectory(prefix="nexus-r018-missing-") as temporary:
            missing = Path(temporary) / "AUTHORIZATION.json"
            write_document(missing, {})
            self.assert_both_reject(POLICY, EVENT, missing)

    def test_tamper_downgrade_replay_and_encoding_matrix_fails_closed(self) -> None:
        policy = json.loads(content(POLICY))
        event = json.loads(content(EVENT))
        authorization = json.loads(content(AUTHORIZATION))
        signature = bytearray(base64.b64decode(authorization["signature_base64"]))
        signature[-1] ^= 1

        cases: list[tuple[str, dict[str, Any], dict[str, Any], dict[str, Any], bytes | None]] = []
        mutated_event = copy.deepcopy(event)
        mutated_event["outputs"][0]["amount"] = "599"
        cases.append(("event-byte-tamper", policy, mutated_event, authorization, None))
        wrong_policy = copy.deepcopy(authorization)
        wrong_policy["policy_id"] = "11" * 32
        cases.append(("policy-downgrade", policy, event, wrong_policy, None))
        wrong_controller = copy.deepcopy(authorization)
        wrong_controller["controller"] = "22" * 32
        cases.append(("controller-replay", policy, event, wrong_controller, None))
        wrong_epoch = copy.deepcopy(authorization)
        wrong_epoch["controller_epoch"] = "1"
        cases.append(("epoch-replay", policy, event, wrong_epoch, None))
        wrong_algorithm = copy.deepcopy(authorization)
        wrong_algorithm["algorithm"] = "Ed25519"
        cases.append(("algorithm-downgrade", policy, event, wrong_algorithm, None))
        bad_signature = copy.deepcopy(authorization)
        bad_signature["signature_base64"] = base64.b64encode(signature).decode("ascii")
        cases.append(("signature-bit-flip", policy, event, bad_signature, None))
        unknown_field = copy.deepcopy(authorization)
        unknown_field["override"] = "ALLOW"
        cases.append(("unknown-override-field", policy, event, unknown_field, None))
        cases.append(("noncanonical-leading-space", policy, event, authorization, b" "))

        for name, case_policy, case_event, case_authorization, prefix in cases:
            with self.subTest(name=name), tempfile.TemporaryDirectory(prefix="nexus-r018-case-") as temporary:
                directory = Path(temporary)
                policy_path = directory / "POLICY.json"
                event_path = directory / "EVENT.json"
                authorization_path = directory / "AUTHORIZATION.json"
                write_document(policy_path, case_policy)
                write_document(event_path, case_event)
                write_document(authorization_path, case_authorization)
                if prefix is not None:
                    authorization_path.write_bytes(prefix + authorization_path.read_bytes())
                self.assert_both_reject(policy_path, event_path, authorization_path)

    def test_self_consistent_policy_weakening_is_rejected_before_signature(self) -> None:
        policy = json.loads(content(POLICY))
        authorization = json.loads(content(AUTHORIZATION))
        policy["fallback"] = "ALLOW_R016_ONLY"
        policy["policy_id"] = recompute_policy_id(policy)
        authorization["policy_id"] = policy["policy_id"]
        with tempfile.TemporaryDirectory(prefix="nexus-r018-weaken-") as temporary:
            directory = Path(temporary)
            policy_path = directory / "POLICY.json"
            authorization_path = directory / "AUTHORIZATION.json"
            write_document(policy_path, policy)
            write_document(authorization_path, authorization)
            primary, cold = self.assert_both_reject(policy_path, EVENT, authorization_path)
        self.assertIn(b"POLICY:", primary.stderr)
        self.assertIn(b"policy profile differs", cold.stderr)

    def test_key_substitution_with_recomputed_ids_still_needs_a_new_signature(self) -> None:
        policy = json.loads(content(POLICY))
        authorization = json.loads(content(AUTHORIZATION))
        public_key = bytearray(base64.b64decode(policy["binding"]["public_key_base64"]))
        public_key[0] ^= 1
        policy["binding"]["public_key_base64"] = base64.b64encode(public_key).decode("ascii")
        policy["binding"]["key_id"] = raw_key_id(bytes(public_key))
        policy["policy_id"] = recompute_policy_id(policy)
        authorization["key_id"] = policy["binding"]["key_id"]
        authorization["policy_id"] = policy["policy_id"]
        with tempfile.TemporaryDirectory(prefix="nexus-r018-key-substitution-") as temporary:
            directory = Path(temporary)
            policy_path = directory / "POLICY.json"
            authorization_path = directory / "AUTHORIZATION.json"
            write_document(policy_path, policy)
            write_document(authorization_path, authorization)
            primary, cold = self.assert_both_reject(policy_path, EVENT, authorization_path)
        self.assertIn(b"INVALID_SIGNATURE", primary.stderr)
        self.assertIn(b"signature is invalid", cold.stderr)

    def test_primary_has_no_signing_or_private_key_surface_and_cold_is_separate(self) -> None:
        primary = PRIMARY.read_text(encoding="utf-8")
        cold = COLD.read_text(encoding="utf-8")
        self.assertNotIn("generateKeyPair", primary)
        self.assertNotIn("privateKey", primary)
        self.assertNotIn("@noble/post-quantum", primary)
        self.assertNotIn("system/nexus_lab", cold)
        self.assertNotIn("pq_admission", cold)
        self.assertIn("@noble/post-quantum/ml-dsa.js", cold)


if __name__ == "__main__":
    unittest.main()
