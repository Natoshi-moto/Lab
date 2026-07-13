from __future__ import annotations

import base64
import copy
import hashlib
import json
import random
import re
import subprocess
import tempfile
import unittest
from pathlib import Path

from system.nexus_lab.util import NexusError
from system.nexus_lab.value_kernel import (
    GENESIS_SUPPLY,
    MAX_LIVE_UTXOS,
    PINNED_GENESIS_ID,
    _openssl_verify,
    report_bytes,
    require_r013_evidence_files,
    r013_evidence_paths,
    validate_r013_claim_bindings,
    validate_r013_saved_evidence,
    verify_cross_implementation,
    verify_suite,
)


ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT = ROOT / "experiments" / "R013_PCX_CONSERVED_CLAIM"
SUITE = EXPERIMENT / "fixtures" / "SUITE.json"
NODE_VERIFIER = EXPERIMENT / "independent_verifier.mjs"
GENERATOR = EXPERIMENT / "generate_vectors.mjs"


class R013PCXConvergenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.suite = json.loads(SUITE.read_text(encoding="utf-8"))
        cls.report = verify_suite(SUITE)

    def test_frozen_genesis_is_exactly_pinned(self) -> None:
        self.assertEqual(
            PINNED_GENESIS_ID,
            "974cd4da89feb9f7ae8e14d7b4359f4b76d8697f55e5793219c52e38b627b7de",
        )
        self.assertEqual(self.report["genesis_id"], PINNED_GENESIS_ID)

    def test_rfc8032_vector_verifies_in_openssl(self) -> None:
        # RFC 8032 section 7.1, TEST 2. OpenSSL's pkeyutl rejects a
        # zero-byte input file, so the one-byte vector is used here.
        public_key = "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c"
        signature = (
            "92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da"
            "085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00"
        )
        self.assertTrue(_openssl_verify(public_key, signature, bytes.fromhex("72")))
        mutated = signature[:-2] + ("00" if signature[-2:] != "00" else "01")
        self.assertFalse(_openssl_verify(public_key, mutated, bytes.fromhex("72")))

    def test_every_candidate_checkpoint_conserves_exact_supply(self) -> None:
        for history in self.report["histories"]:
            for case in history["cases"]:
                self.assertEqual(int(case["total_supply"]), GENESIS_SUPPLY)
            checkpoint = history["checkpoint"]
            self.assertEqual(int(checkpoint["total_supply"]), GENESIS_SUPPLY)
            self.assertEqual(checkpoint["candidate_status"], "CANDIDATE")
            self.assertEqual(checkpoint["status_authority"], "NONE")

    def test_rejection_never_changes_state(self) -> None:
        for history in self.report["histories"]:
            for case in history["cases"]:
                if case["decision"] == "REJECTED":
                    self.assertEqual(case["previous_state_root"], case["next_state_root"], case["case_id"])

    def test_exact_replay_is_idempotent(self) -> None:
        cases = self.report["histories"][0]["cases"]
        replay = next(item for item in cases if item["case_id"] == "EXACT-REPLAY-T1")
        first = next(item for item in cases if item["case_id"] == "VALID-T1-SPLIT")
        self.assertEqual(replay["reason_code"], "EXACT_REPLAY")
        self.assertEqual(replay["idempotent"], "TRUE")
        self.assertEqual(replay["receipt_hash"], first["receipt_hash"])
        self.assertEqual(replay["previous_state_root"], replay["next_state_root"])

    def test_attack_classes_are_exercised(self) -> None:
        reasons = {
            case["reason_code"]
            for history in self.report["histories"]
            for case in history["cases"]
        }
        required = {
            "INVALID_JSON_DUPLICATE_KEY",
            "NON_CANONICAL_ENCODING",
            "DOMAIN_MISMATCH",
            "GENESIS_MISMATCH",
            "TRANSACTION_ID_MISMATCH",
            "PREDECESSOR_STATE_MISMATCH",
            "DUPLICATE_INPUT",
            "INPUT_NOT_UNSPENT",
            "CREATION_BINDING_MISMATCH",
            "OWNER_KEY_MISMATCH",
            "CONSERVATION_VIOLATION",
            "SIGNATURE_INVALID",
            "INVALID_AMOUNT",
            "INVALID_JSON_NONFINITE",
            "INVALID_JSON_NUMBER",
            "INVALID_STRING_ENCODING",
            "JSON_DEPTH_EXCEEDED",
            "OWNER_KEY_INVALID",
            "INPUT_ORDER_INVALID",
            "AUTHORIZATION_SET_INVALID",
            "TRANSACTION_ID_COLLISION",
            "UTXO_LIMIT_EXCEEDED",
        }
        self.assertTrue(required <= reasons, sorted(required - reasons))

    def test_both_competing_orders_accept_only_the_first_spend(self) -> None:
        frozen = {
            history["history_id"]: history["cases"]
            for history in self.suite["histories"]
            if history["history_id"].startswith("COMPETING-")
        }
        self.assertEqual(frozen["COMPETING-C-FIRST"][0]["raw_b64"], frozen["COMPETING-D-FIRST"][0]["raw_b64"])
        self.assertEqual(frozen["COMPETING-C-FIRST"][1]["raw_b64"], frozen["COMPETING-D-FIRST"][2]["raw_b64"])
        self.assertEqual(frozen["COMPETING-C-FIRST"][2]["raw_b64"], frozen["COMPETING-D-FIRST"][1]["raw_b64"])
        for history in self.report["histories"]:
            if history["history_id"].startswith("COMPETING-"):
                cases = history["cases"]
                self.assertEqual(cases[1]["reason_code"], "VALID_CONSERVED_TRANSFER")
                self.assertEqual(cases[2]["reason_code"], "PREDECESSOR_STATE_MISMATCH")
                self.assertEqual(cases[2]["decision"], "REJECTED")

    def test_live_utxo_bound_and_checkpoint_schema_agree(self) -> None:
        history = next(item for item in self.report["histories"] if item["history_id"] == "LIVE-UTXO-BOUND")
        checkpoint = history["checkpoint"]
        self.assertEqual(checkpoint["utxo_count"], str(MAX_LIVE_UTXOS))
        self.assertGreater(int(checkpoint["utxo_count"]), 8)
        self.assertEqual(history["cases"][-1]["reason_code"], "UTXO_LIMIT_EXCEEDED")
        schema = json.loads((ROOT / "constitution" / "schemas" / "pcx-checkpoint.schema.json").read_text(encoding="utf-8"))
        pattern = schema["properties"]["utxo_count"]["pattern"]
        self.assertIsNotNone(re.fullmatch(pattern, checkpoint["utxo_count"]))
        self.assertIsNone(re.fullmatch(pattern, str(MAX_LIVE_UTXOS + 1)))

    def test_multi_fault_precedence_is_frozen(self) -> None:
        history = next(item for item in self.report["histories"] if item["history_id"].startswith("HOSTILE-"))
        reasons = {item["case_id"]: item["reason_code"] for item in history["cases"]}
        self.assertEqual(reasons["PRECEDENCE-DUPLICATE-BEFORE-TX-ID"], "DUPLICATE_INPUT")
        self.assertEqual(reasons["PRECEDENCE-AMOUNT-BEFORE-TX-ID"], "INVALID_AMOUNT")
        self.assertEqual(reasons["PRECEDENCE-WITNESS-BEFORE-TX-ID"], "SIGNATURE_INVALID")

    def test_frozen_vector_generator_is_reproducible(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r013-vectors-") as tmp:
            generated = Path(tmp) / "SUITE.json"
            result = subprocess.run(
                ["node", str(GENERATOR), str(generated)],
                cwd=ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr.decode("utf-8", errors="replace"))
            self.assertEqual(generated.read_bytes(), SUITE.read_bytes())

    def test_independent_verifiers_emit_byte_identical_report(self) -> None:
        result = subprocess.run(
            ["node", str(NODE_VERIFIER), str(SUITE)],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr.decode("utf-8", errors="replace"))
        self.assertEqual(result.stdout, report_bytes(self.report))

    def test_convergence_gate_summary(self) -> None:
        result = verify_cross_implementation(
            SUITE,
            node_verifier=NODE_VERIFIER,
            repo_root=ROOT,
        )
        self.assertEqual(result["status"], "PASS")
        self.assertTrue(result["byte_identical"])
        self.assertEqual(result["history_count"], 6)
        self.assertEqual(result["accepted_transfer_count"], 19)
        self.assertEqual(result["rejected_attack_count"], 49)
        self.assertEqual(result["status_authority"], "NONE")

    def test_convergence_gate_rejects_an_unpinned_verifier(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r013-unpinned-") as tmp:
            impostor = Path(tmp) / "verifier.mjs"
            impostor.write_text("process.stdout.write('counterfeit')\n", encoding="utf-8")
            with self.assertRaisesRegex(NexusError, "frozen independent verifier path"):
                verify_cross_implementation(SUITE, node_verifier=impostor, repo_root=ROOT)

    def test_convergence_gate_rejects_wrong_hash_at_canonical_path(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r013-wrong-hash-") as tmp:
            fake_root = Path(tmp)
            canonical = (
                fake_root
                / "experiments"
                / "R013_PCX_CONSERVED_CLAIM"
                / "independent_verifier.mjs"
            )
            canonical.parent.mkdir(parents=True)
            canonical.write_text("process.stdout.write('counterfeit')\n", encoding="utf-8")
            with self.assertRaisesRegex(NexusError, "verifier hash"):
                verify_cross_implementation(SUITE, node_verifier=canonical, repo_root=fake_root)

    def test_every_declared_evidence_file_is_fail_closed(self) -> None:
        labels = list(r013_evidence_paths(ROOT))
        for omitted in labels:
            with self.subTest(omitted=omitted), tempfile.TemporaryDirectory(prefix="nexus-r013-missing-") as tmp:
                fake_root = Path(tmp)
                paths = r013_evidence_paths(fake_root)
                for path in paths.values():
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_text("placeholder", encoding="utf-8")
                paths[omitted].unlink()
                with self.assertRaisesRegex(NexusError, "evidence is incomplete"):
                    require_r013_evidence_files(fake_root)

    def test_saved_and_claim_evidence_bindings_are_fail_closed(self) -> None:
        check = verify_cross_implementation(SUITE, node_verifier=NODE_VERIFIER, repo_root=ROOT)
        expected_bytes = (EXPERIMENT / "fixtures" / "EXPECTED_REPORT.json").read_bytes()
        convergence_path = ROOT / "operations" / "receipts" / "R013_PCX_CONSERVED_CLAIM" / "CONVERGENCE_REPORT.json"
        saved = json.loads(convergence_path.read_text(encoding="utf-8"))
        validate_r013_saved_evidence(expected_bytes=expected_bytes, saved_convergence=saved, check=check)
        bad_saved = copy.deepcopy(saved)
        bad_saved["accepted_transfer_count"] += 1
        with self.assertRaises(NexusError):
            validate_r013_saved_evidence(expected_bytes=expected_bytes, saved_convergence=bad_saved, check=check)
        with self.assertRaises(NexusError):
            validate_r013_saved_evidence(expected_bytes=expected_bytes + b" ", saved_convergence=saved, check=check)

        receipt_root = ROOT / "operations" / "receipts" / "R013_PCX_CONSERVED_CLAIM"
        proposal_root = ROOT / "operations" / "proposals" / "R013_PCX_CONSERVED_CLAIM"
        demo = json.loads((receipt_root / "DEMO_REPORT.json").read_text(encoding="utf-8"))
        proposal = json.loads((proposal_root / "STATUS.proposal.json").read_text(encoding="utf-8"))
        model_bytes = (receipt_root / "MODEL_CHECK_REPORT.json").read_bytes()
        model = json.loads(model_bytes)
        kwargs = {
            "proposal_status": proposal,
            "check": check,
            "suite_sha256": hashlib.sha256(SUITE.read_bytes()).hexdigest(),
            "model_report": model,
            "model_report_sha256": hashlib.sha256(model_bytes).hexdigest(),
        }
        validate_r013_claim_bindings(demo=demo, **kwargs)
        mutations = [
            (("status",), "UNVERIFIED"),
            (("status_authority",), "CANONICAL"),
            (("dependency", "r012_branch_head"), "0" * 40),
            (("fixture", "suite_id"), "OTHER"),
            (("fixture", "suite_path"), "elsewhere.json"),
            (("fixture", "suite_sha256"), "0" * 64),
            (("fixture", "genesis_id"), "0" * 64),
            (("fixture", "fixed_supply"), "1001"),
            (("fixture", "unit_label"), "OTHER"),
            (("convergence", "implementations"), ["ONE"]),
            (("convergence", "vector_signer"), "OTHER"),
            (("convergence", "independent_verifier_sha256"), "0" * 64),
            (("convergence", "report_sha256"), "0" * 64),
            (("convergence", "histories"), 0),
            (("small_model", "transition_digest"), "0" * 64),
            (("non_claims",), []),
        ]
        for path, replacement in mutations:
            with self.subTest(path=path):
                altered = copy.deepcopy(demo)
                target = altered
                for key in path[:-1]:
                    target = target[key]
                target[path[-1]] = replacement
                with self.assertRaises(NexusError):
                    validate_r013_claim_bindings(demo=altered, **kwargs)
        altered_proposal = copy.deepcopy(proposal)
        altered_proposal["canonical_status"] = "CANONICAL"
        with self.assertRaises(NexusError):
            validate_r013_claim_bindings(demo=demo, **{**kwargs, "proposal_status": altered_proposal})

    def test_deterministic_byte_mutation_fuzz_converges(self) -> None:
        suite = json.loads(SUITE.read_text(encoding="utf-8"))
        original_case = suite["histories"][0]["cases"][0]
        original = base64.b64decode(original_case["raw_b64"], validate=True)
        rng = random.Random(0xC013)
        cases = []
        for index in range(128):
            mutated = bytearray(original)
            position = rng.randrange(len(mutated))
            replacement = rng.randrange(256)
            if replacement == mutated[position]:
                replacement = (replacement + 1) % 256
            mutated[position] = replacement
            cases.append(
                {
                    "case_id": f"MUTATION-{index:03d}",
                    "raw_b64": base64.b64encode(mutated).decode("ascii"),
                }
            )
        suite["histories"] = [{"history_id": "DETERMINISTIC-BYTE-MUTATIONS", "cases": cases}]
        with tempfile.TemporaryDirectory(prefix="nexus-r013-fuzz-") as tmp:
            path = Path(tmp) / "SUITE.json"
            path.write_text(json.dumps(suite, indent=2) + "\n", encoding="utf-8")
            python_bytes = report_bytes(verify_suite(path))
            node = subprocess.run(
                ["node", str(NODE_VERIFIER), str(path)],
                cwd=ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
            )
            self.assertEqual(node.returncode, 0, node.stderr.decode("utf-8", errors="replace"))
            self.assertEqual(node.stdout, python_bytes)

    def test_saved_expected_report_matches_frozen_suite(self) -> None:
        expected = EXPERIMENT / "fixtures" / "EXPECTED_REPORT.json"
        self.assertTrue(expected.is_file())
        self.assertEqual(expected.read_bytes(), report_bytes(self.report))
        parsed = json.loads(expected.read_text(encoding="utf-8"))
        self.assertEqual(parsed["status_authority"], "NONE")


if __name__ == "__main__":
    unittest.main()
