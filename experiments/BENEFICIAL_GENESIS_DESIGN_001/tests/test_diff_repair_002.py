"""Breaker-confirmed differential repairs D-001 through D-008."""

from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

EXP = Path(__file__).resolve().parents[1]
if str(EXP) not in sys.path:
    sys.path.insert(0, str(EXP))

from protocol.encoding import canonical_json_loads  # noqa: E402
from protocol.merkle import build_header_chain, merkle_root  # noqa: E402
from protocol.nullifier import NullifierSet  # noqa: E402
from protocol.verifier import ClaimVerifier  # noqa: E402

GENESIS = EXP / "fixtures/genesis"
VALID = EXP / "fixtures/valid"
INVALID = EXP / "fixtures/invalid"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def verifier(*, epoch=None, headers=None, tip=None, nullifiers=None):
    ctx = load(GENESIS / "CONTEXT.json")
    headers = headers or ctx["headers"]
    tip = tip or headers[-1]
    return ClaimVerifier(
        charity_set=ctx["charity_set"], epoch=epoch or ctx["epoch_open"],
        headers_by_hash={h["header_hash_hex"]: h for h in headers},
        tip_height=tip["height"], tip_hash_hex=tip["header_hash_hex"],
        new_ledger_chain_id=ctx["new_ledger_chain_id"], nullifiers=nullifiers,
    )


class TestDiffRepair002(unittest.TestCase):
    def setUp(self):
        self.claim = load(VALID / "claim_single_alpha.json")
        self.ctx = load(GENESIS / "CONTEXT.json")

    def test_d001_domain_field_unknown_and_wrong_domain_signature_fails(self):
        hostile = copy.deepcopy(self.claim)
        hostile["pq_sig_domain_bytes"] = "zz"
        self.assertEqual(verifier().verify_claim(hostile).code, "UNKNOWN_FIELD")
        wrong_domain = load(INVALID / "pq_wrong_domain.json")["claim"]
        self.assertEqual(verifier().verify_claim(wrong_domain).code, "PQ_SIGNATURE_INVALID")

    def test_d002_commitment_version_is_exact_uint32_without_coercion(self):
        for value in (True, "1", 1.0, -1, 1 << 32, 2):
            hostile = copy.deepcopy(self.claim)
            hostile["commitment_version"] = value
            self.assertEqual(verifier().verify_claim(hostile).code,
                             "COMMITMENT_VERSION_INVALID", repr(value))

    def test_d002_bool_integer_fields_are_rejected(self):
        mutations = [
            ("donation_vout", True, "TYPE_ERROR"),
            ("amount_sats", True, "TYPE_ERROR"),
        ]
        for key, value, code in mutations:
            hostile = copy.deepcopy(self.claim)
            hostile[key] = value
            self.assertEqual(verifier().verify_claim(hostile).code, code)
        hostile = copy.deepcopy(self.claim)
        hostile["inclusion_proof"]["block_height"] = True
        self.assertEqual(verifier().verify_claim(hostile).code, "INCLUSION_PROOF_INVALID")

    def test_d003_nullifier_is_required_lowercase_exact_and_no_alias(self):
        cases = []
        mismatch = copy.deepcopy(self.claim); mismatch["nullifier_hex"] = "00" * 32
        uppercase = copy.deepcopy(self.claim); uppercase["nullifier_hex"] = self.claim["nullifier_hex"].upper()
        malformed = copy.deepcopy(self.claim); malformed["nullifier_hex"] = "abc"
        alias = copy.deepcopy(self.claim); alias["presented_nullifier_hex"] = alias.pop("nullifier_hex")
        cases.extend([(mismatch, "NULLIFIER_INVALID"), (uppercase, "NULLIFIER_INVALID"),
                      (malformed, "NULLIFIER_INVALID"), (alias, "UNKNOWN_FIELD")])
        for hostile, code in cases:
            self.assertEqual(verifier().verify_claim(hostile).code, code)

    def test_d004_unknown_nested_keys_and_duplicate_raw_keys(self):
        for path in (("claim",), ("transaction",), ("inclusion_proof",),
                     ("source_authorization",)):
            hostile = copy.deepcopy(self.claim)
            target = hostile if path == ("claim",) else hostile[path[0]]
            target["unexpected"] = 1
            expected = "UNKNOWN_FIELD" if path == ("claim",) else (
                "UNSUPPORTED_TX_FORM" if path == ("transaction",) else
                "INCLUSION_PROOF_INVALID" if path == ("inclusion_proof",) else "SOURCE_AUTH_INVALID")
            self.assertEqual(verifier().verify_claim(hostile).code, expected)
        with self.assertRaisesRegex(ValueError, "duplicate JSON object key"):
            canonical_json_loads('{"version":1,"version":2}')

    def test_d005_cutoff_boundary_and_cutoff_plus_one(self):
        self.assertTrue(verifier().verify_claim(self.claim).ok)
        epoch = copy.deepcopy(self.ctx["epoch_open"])
        cutoff = self.ctx["headers"][0]
        epoch["last_eligible_inclusion_height"] = cutoff["height"]
        epoch["last_eligible_inclusion_header_hash_hex"] = cutoff["header_hash_hex"]
        claim_plus_one = load(VALID / "claim_single_beta.json")
        self.assertEqual(verifier(epoch=epoch).verify_claim(claim_plus_one).code,
                         "INCLUSION_AFTER_CUTOFF")

    def test_d005_complete_short_chain_is_insufficient(self):
        headers = self.ctx["headers"][:5]  # heights 100..104 => five confirmations
        epoch = copy.deepcopy(self.ctx["epoch_open"])
        epoch["accepted_source_tip_height"] = headers[-1]["height"]
        epoch["accepted_source_tip_header_hash_hex"] = headers[-1]["header_hash_hex"]
        epoch["last_eligible_inclusion_height"] = headers[0]["height"]
        epoch["last_eligible_inclusion_header_hash_hex"] = headers[0]["header_hash_hex"]
        self.assertEqual(verifier(epoch=epoch, headers=headers).verify_claim(self.claim).code,
                         "INSUFFICIENT_CONFIRMATIONS")

    def test_d005_checkpoint_conflict_and_post_reorg_rollback(self):
        with self.assertRaisesRegex(ValueError, "CHECKPOINT_MISMATCH"):
            verifier(tip=self.ctx["headers"][-2])
        fork = build_header_chain(
            start_height=100, prev_hash_hex="44" * 32,
            blocks=[{"merkle_root_hex": merkle_root([f"{i + 40:02x}" * 32])}
                    for i in range(16)],
        )
        epoch = copy.deepcopy(self.ctx["epoch_open"])
        epoch["accepted_source_tip_height"] = fork[-1]["height"]
        epoch["accepted_source_tip_header_hash_hex"] = fork[-1]["header_hash_hex"]
        epoch["last_eligible_inclusion_height"] = fork[10]["height"]
        epoch["last_eligible_inclusion_header_hash_hex"] = fork[10]["header_hash_hex"]
        ns = NullifierSet(); ns.consume(self.claim["nullifier_hex"])
        replacement = verifier(epoch=epoch, headers=fork, nullifiers=ns)
        results = replacement.revalidate_admitted_claims([self.claim])
        self.assertEqual(results[0].code, "HEADER_ANCESTRY_INVALID")
        self.assertEqual(ns.snapshot(), [])

    def test_d007_carrier_multiplicity_and_multi_donation(self):
        multi = load(VALID / "claim_multi_out0.json")
        self.assertTrue(verifier().verify_claim(multi).ok)
        commitment = self.claim["declared_commitment_hex"]
        duplicate = copy.deepcopy(self.claim["transaction"])
        duplicate["outputs"].append({"script_pubkey_hex": "6a20" + commitment, "value_sats": 0})
        self.assertEqual(ClaimVerifier._commitment_carrier_status(duplicate, commitment),
                         "COMMITMENT_MULTIPLICITY_INVALID")
        conflict = copy.deepcopy(self.claim["transaction"])
        conflict["outputs"].append({"script_pubkey_hex": "6a20" + "ff" * 32, "value_sats": 0})
        self.assertEqual(ClaimVerifier._commitment_carrier_status(conflict, commitment),
                         "COMMITMENT_MULTIPLICITY_INVALID")

    def test_d008_malformed_hex_is_contained(self):
        for key, value, code in (
            ("pq_signature_hex", "0", "PQ_SIGNATURE_INVALID"),
            ("pq_signature_hex", "AA", "PQ_SIGNATURE_INVALID"),
            ("commitment_nonce_hex", "zz", "TYPE_ERROR"),
            ("donation_txid_hex", "00", "TYPE_ERROR"),
        ):
            hostile = copy.deepcopy(self.claim); hostile[key] = value
            result = verifier().verify_claim(hostile)
            self.assertEqual(result.code, code)


if __name__ == "__main__":
    unittest.main()
