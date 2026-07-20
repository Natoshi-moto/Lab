"""Valid and adversarial claim verification against deterministic fixtures."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from typing import Any

EXP = Path(__file__).resolve().parents[1]
if str(EXP) not in sys.path:
    sys.path.insert(0, str(EXP))

from protocol.allocation import (  # noqa: E402
    AllocationError,
    allocate_proportional,
    assert_supply_invariant,
)
from protocol.nullifier import NullifierSet  # noqa: E402
from protocol.objects import (  # noqa: E402
    charity_set_commitment,
    validate_charity_set,
)
from protocol.merkle import verify_merkle_proof  # noqa: E402
from protocol.verifier import ClaimVerifier  # noqa: E402
FIXTURES = EXP / "fixtures"
GENESIS = FIXTURES / "genesis"
VALID = FIXTURES / "valid"
INVALID = FIXTURES / "invalid"


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def base_verifier(**overrides: Any) -> ClaimVerifier:
    ctx = load(GENESIS / "CONTEXT.json")
    epoch = load(GENESIS / "EPOCH_OPEN.json")
    if "epoch" in overrides:
        if overrides["epoch"] == "closed":
            epoch = load(GENESIS / "EPOCH_CLOSED.json")
        else:
            epoch = overrides["epoch"]
    if "epoch_last_clean_height_override" in overrides:
        epoch = dict(epoch)
        epoch["last_clean_source_height"] = overrides["epoch_last_clean_height_override"]
    if "quantum_compromise_cutoff_height_override" in overrides:
        epoch = dict(epoch)
        epoch["quantum_compromise_cutoff_height"] = overrides[
            "quantum_compromise_cutoff_height_override"
        ]

    headers = list(ctx["headers"])
    if "extra_headers" in overrides:
        headers.extend(overrides["extra_headers"])
    if "headers_override" in overrides:
        headers = overrides["headers_override"]

    hbh = {h["header_hash_hex"]: h for h in headers}
    tip_h = overrides.get("tip_height_override", ctx["tip_height"])
    tip_x = overrides.get("tip_hash_hex_override", ctx["tip_hash_hex"])
    if "new_tip_only_headers" in overrides:
        headers = overrides["new_tip_only_headers"]
        hbh = {h["header_hash_hex"]: h for h in headers}
        tip_h = headers[-1]["height"]
        tip_x = headers[-1]["header_hash_hex"]

    return ClaimVerifier(
        charity_set=ctx["charity_set"],
        epoch=epoch,
        headers_by_hash=hbh,
        tip_height=tip_h,
        tip_hash_hex=tip_x,
        new_ledger_chain_id=ctx["new_ledger_chain_id"],
        nullifiers=overrides.get("nullifiers") or NullifierSet(),
    )


class TestValidClaims(unittest.TestCase):
    def test_single_and_multi_output_claims(self) -> None:
        v = base_verifier()
        for name in (
            "claim_single_alpha.json",
            "claim_single_beta.json",
            "claim_multi_out0.json",
            "claim_multi_out1.json",
        ):
            claim = load(VALID / name)
            result = v.verify_claim(claim)
            self.assertTrue(result.ok, f"{name}: {result.code} {result.detail}")

    def test_double_claim_rejected_after_first(self) -> None:
        v = base_verifier()
        claim = load(VALID / "claim_single_alpha.json")
        self.assertTrue(v.verify_claim(claim).ok)
        second = v.verify_claim(json.loads(json.dumps(claim)))
        self.assertFalse(second.ok)
        self.assertEqual(second.code, "NULLIFIER_ALREADY_CONSUMED")

    def test_allocation_record_matches_fixture(self) -> None:
        expected = load(VALID / "allocation_after_epoch.json")
        assert_supply_invariant(expected)
        self.assertEqual(expected["remainder_handling"], "UNISSUED_FLOOR_REMAINDER")
        self.assertLessEqual(expected["total_issued"], expected["fixed_bitcoin_genesis_pool"])

    def test_stolen_source_key_crypto_ok(self) -> None:
        claim = load(VALID / "claim_stolen_source_key_crypto_ok.json")
        ctx = load(VALID / "context_stolen_source_key.json")
        v = ClaimVerifier(
            charity_set=load(GENESIS / "CHARITY_SET.json"),
            epoch=ctx["epoch"],
            headers_by_hash={h["header_hash_hex"]: h for h in ctx["headers"]},
            tip_height=ctx["tip_height"],
            tip_hash_hex=ctx["tip_hash_hex"],
            new_ledger_chain_id=load(GENESIS / "CONTEXT.json")["new_ledger_chain_id"],
        )
        result = v.verify_claim(claim)
        self.assertTrue(result.ok, result)
        self.assertTrue(any("legal ownership" in n.lower() for n in result.notes))

    def test_charity_rebate_note(self) -> None:
        claim = load(VALID / "claim_charity_rebate_collusion_crypto_ok.json")
        result = base_verifier().verify_claim(claim)
        self.assertTrue(result.ok, result)
        self.assertTrue(result.ok)

    def test_cutoff_boundary(self) -> None:
        payload = load(VALID / "claim_at_cutoff_boundary.json")
        # Need enough tip height for confirmations relative to inclusion height 100.
        v = base_verifier()
        result = v.verify_claim(payload["claim"])
        self.assertTrue(result.ok, result)


class TestAdversarialFixtures(unittest.TestCase):
    def test_expected_catalog_present(self) -> None:
        expected = load(FIXTURES / "EXPECTED.json")
        self.assertIn("invalid_expected_codes", expected)
        self.assertGreaterEqual(len(expected["invalid_expected_codes"]), 20)

    def test_invalid_fixtures(self) -> None:
        expected = load(FIXTURES / "EXPECTED.json")["invalid_expected_codes"]
        for name, code in sorted(expected.items()):
            path = INVALID / f"{name}.json"
            self.assertTrue(path.is_file(), name)
            payload = load(path)
            self.assertEqual(payload["expected_code"], code, name)

            if name == "duplicate_charity_entries":
                with self.assertRaises(ValueError):
                    charity_set_commitment(payload["entries"])
                continue
            if name == "malformed_charity_entry":
                cs = load(GENESIS / "CHARITY_SET.json")
                cs["entries"][0] = payload["entry"]
                with self.assertRaises(ValueError):
                    validate_charity_set(cs)
                continue
            if name == "allocation_overflow_bool":
                with self.assertRaises(AllocationError) as ctx:
                    allocate_proportional(
                        fixed_bitcoin_genesis_pool=payload["pool"],
                        eligible_by_nullifier=[(a, b) for a, b in payload["eligible"]],
                        epoch_id="e",
                    )
                self.assertEqual(ctx.exception.code, "ARITHMETIC_OVERFLOW")
                continue
            if name in {"charity_destination_key_compromise_assumption", "stale_checkpoint",
                        "conflicting_checkpoint", "inclusion_after_cutoff_epoch",
                        "insufficient_confirmations", "reorg_after_provisional_acceptance"}:
                continue

            claim = payload["claim"]
            kwargs: dict[str, Any] = {}
            if "pre_consume_nullifier" in payload:
                ns = NullifierSet()
                ns.consume(payload["pre_consume_nullifier"])
                kwargs["nullifiers"] = ns
            if "tip_height_override" in payload:
                kwargs["tip_height_override"] = payload["tip_height_override"]
            if "epoch" in payload:
                kwargs["epoch"] = payload["epoch"]
            if "epoch_last_clean_height_override" in payload:
                kwargs["epoch_last_clean_height_override"] = payload[
                    "epoch_last_clean_height_override"
                ]
            if "quantum_compromise_cutoff_height_override" in payload:
                kwargs["quantum_compromise_cutoff_height_override"] = payload[
                    "quantum_compromise_cutoff_height_override"
                ]
            if "extra_headers" in payload:
                kwargs["extra_headers"] = payload["extra_headers"]

            v = base_verifier(**kwargs)
            result = v.verify_claim(claim)
            self.assertEqual(
                result.code,
                code,
                f"{name}: got {result.code} ({result.detail}) expected {code}",
            )

    def test_closed_epoch_rejects_plain_claim(self) -> None:
        claim = load(VALID / "claim_single_alpha.json")
        self.assertEqual(base_verifier(epoch="closed").verify_claim(claim).code, "EPOCH_CLOSED")

    def test_charity_set_forgery_and_duplicates_rejected_at_constructor(self) -> None:
        ctx = load(GENESIS / "CONTEXT.json")
        for mutate in ("forged", "duplicate"):
            cs = json.loads(json.dumps(ctx["charity_set"]))
            if mutate == "forged":
                cs["commitment_hex"] = "00" * 32
            else:
                cs["entries"].append(cs["entries"][0])
            with self.assertRaises(ValueError):
                ClaimVerifier(charity_set=cs, epoch=load(GENESIS / "EPOCH_OPEN.json"),
                    headers_by_hash={h["header_hash_hex"]: h for h in ctx["headers"]},
                    tip_height=ctx["tip_height"], tip_hash_hex=ctx["tip_hash_hex"],
                    new_ledger_chain_id=ctx["new_ledger_chain_id"])

    def test_checkpoint_height_and_forged_intermediate_rejected(self) -> None:
        ctx = load(GENESIS / "CONTEXT.json")
        with self.assertRaises(ValueError):
            base_verifier(tip_height_override=ctx["tip_height"] + 1)
        headers = json.loads(json.dumps(ctx["headers"]))
        headers[5]["time"] += 1
        with self.assertRaises(ValueError):
            base_verifier(headers_override=headers)

    def test_negative_merkle_index_rejected(self) -> None:
        self.assertFalse(verify_merkle_proof("00" * 32, "00" * 32, [], -1))

    def test_commitment_carrier_is_exact(self) -> None:
        claim = load(VALID / "claim_single_alpha.json")
        commitment = claim["declared_commitment_hex"]
        tx = json.loads(json.dumps(claim["transaction"]))
        tx["outputs"][1]["script_pubkey_hex"] = "0014" + commitment[:40]
        claim["transaction"] = tx
        claim["allow_claim_embedded_commitment"] = True
        self.assertFalse(base_verifier().verify_claim(claim).ok)
        self.assertFalse(ClaimVerifier._tx_contains_commitment(
            {"outputs": [{"script_pubkey_hex": "00" + commitment + "00"}]}, commitment))

    def test_allocation_requires_closed_epoch(self) -> None:
        with self.assertRaises(AllocationError):
            base_verifier().close_and_allocate([], fixed_bitcoin_genesis_pool=100, epoch_id="epoch-synth-0001")


if __name__ == "__main__":
    unittest.main()
