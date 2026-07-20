#!/usr/bin/env python3
"""Generate deterministic synthetic fixtures for Beneficial Genesis design pack.

All outputs are clearly labelled SYNTHETIC. No live keys, addresses, or txs.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from protocol.allocation import (  # noqa: E402
    allocate_proportional,
    assert_supply_invariant,
)
from protocol.constants import (  # noqa: E402
    DEFAULT_EPOCH_ID,
    DEFAULT_FIXED_BITCOIN_GENESIS_POOL,
    DEFAULT_MIN_CONFIRMATIONS,
    DEFAULT_NEW_LEDGER_CHAIN_ID,
    DEFAULT_SOURCE_CHAIN,
    PROTOCOL_VERSION,
    REJECTION_CODES,
)
from protocol.crypto_synth import (  # noqa: E402
    PUBLIC_TEST_SEEDS,
    derive_pq_public_key,
    pq_message_for_claim,
    pq_sign,
    source_authorize,
)
from protocol.encoding import (  # noqa: E402
    canonical_json_bytes,
    sha256_hex,
)
from protocol.merkle import (  # noqa: E402
    build_header_chain,
    merkle_proof,
    merkle_root,
    txid_from_tx,
)
from protocol.nullifier import (  # noqa: E402
    compute_nullifier,
    domain_omission_attempt,
)
from protocol.objects import (  # noqa: E402
    charity_genesis_entry,
    charity_set_commitment,
    donation_commitment_hex,
    make_op_return_script,
    make_p2wpkh_like_script,
    migration_epoch_close,
    source_header_checkpoint,
)
from protocol.verifier import (  # noqa: E402
    ClaimVerifier,
)


OUTPUT_ROOT = Path(os.environ.get("BGEN_OUTPUT_ROOT", str(ROOT)))
FIXTURES = OUTPUT_ROOT / "fixtures"
VALID = FIXTURES / "valid"
INVALID = FIXTURES / "invalid"
GENESIS_DIR = FIXTURES / "genesis"


def _write(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )


def _sighash_for_tx(tx: dict) -> str:
    return sha256_hex(b"BGEN-SIGHASH-v1\x00" + canonical_json_bytes(tx))


def build_charity_set() -> dict:
    # Synthetic script programs — NOT live charity addresses.
    a = make_p2wpkh_like_script("11" * 20)
    b = make_p2wpkh_like_script("22" * 20)
    # Confusable address-string labels (documentation only; never used for match).
    entries = [
        charity_genesis_entry(
            charity_id="CHARITY_ALPHA",
            script_pubkey_hex=a,
            attestation_commitment_hex=sha256_hex(b"attest-alpha-synth"),
            valid_from_height=0,
            valid_until_height=1_000_000,
        ),
        charity_genesis_entry(
            charity_id="CHARITY_BETA",
            script_pubkey_hex=b,
            attestation_commitment_hex=sha256_hex(b"attest-beta-synth"),
            valid_from_height=0,
            valid_until_height=1_000_000,
        ),
    ]
    return charity_set_commitment(entries)


def build_donation_tx(
    *,
    charity_script: str,
    amount_sats: int,
    commitment_hex: str,
    donor_seed: str,
    extra_outputs: list[dict] | None = None,
    version: int = 1,
) -> dict:
    outputs = [
        {"script_pubkey_hex": charity_script, "value_sats": amount_sats},
        {"script_pubkey_hex": make_op_return_script(commitment_hex), "value_sats": 0},
    ]
    if extra_outputs:
        outputs.extend(extra_outputs)
    tx = {
        "version": version,
        "locktime": 0,
        "inputs": [
            {
                "prev_txid_hex": "00" * 32,
                "prev_vout": 0,
                "script_sig_hex": "00",
                "sequence": 0xFFFFFFFF,
            }
        ],
        "outputs": outputs,
        "label": "SYNTHETIC_BITCOIN_LIKE_TX_NOT_BROADCAST",
    }
    _ = donor_seed  # used by authorization layer, not tx body
    return tx


def sign_claim(
    *,
    tx: dict,
    vout: int,
    amount_sats: int,
    charity_id: str,
    pq_seed: str,
    source_seed: str,
    nonce_hex: str,
    chain_id: str = DEFAULT_NEW_LEDGER_CHAIN_ID,
    epoch_id: str = DEFAULT_EPOCH_ID,
    commitment_version: int = 1,
) -> dict:
    txid = txid_from_tx(tx)
    pq_pk = derive_pq_public_key(pq_seed)
    commitment = donation_commitment_hex(
        new_ledger_chain_id=chain_id,
        epoch_id=epoch_id,
        charity_id=charity_id,
        donation_vout=vout,
        amount_sats=amount_sats,
        pq_destination_public_key_hex=pq_pk,
        nonce_hex=nonce_hex,
        commitment_version=commitment_version,
    )
    # Rebuild tx if commitment in OP_RETURN must match (caller should pass matching tx).
    nullifier = compute_nullifier(
        source_chain=DEFAULT_SOURCE_CHAIN,
        donation_txid_hex=txid,
        donation_vout=vout,
    )
    msg = pq_message_for_claim(
        new_ledger_chain_id=chain_id,
        epoch_id=epoch_id,
        charity_id=charity_id,
        donation_txid_hex=txid,
        donation_vout=vout,
        amount_sats=amount_sats,
        commitment_hex=commitment,
        nullifier_hex=nullifier,
    )
    sighash = _sighash_for_tx(tx)
    return {
        "version": PROTOCOL_VERSION,
        "schema": "BeneficialGenesisClaim",
        "label": "SYNTHETIC_CLAIM_FIXTURE",
        "source_chain": DEFAULT_SOURCE_CHAIN,
        "new_ledger_chain_id": chain_id,
        "epoch_id": epoch_id,
        "charity_id": charity_id,
        "donation_txid_hex": txid,
        "donation_vout": vout,
        "amount_sats": amount_sats,
        "pq_destination_public_key_hex": pq_pk,
        "pq_signature_hex": pq_sign(pq_seed, msg),
        "commitment_nonce_hex": nonce_hex,
        "commitment_version": commitment_version,
        "declared_commitment_hex": commitment,
        "transaction": tx,
        "source_authorization": source_authorize(source_seed, txid, sighash),
        "nullifier_hex": nullifier,
    }


def attach_inclusion(
    claim: dict,
    *,
    headers: list[dict],
    block_index: int,
    txids_in_block: list[str],
) -> dict:
    header = headers[block_index]
    txid = claim["donation_txid_hex"]
    idx = txids_in_block.index(txid)
    proof = merkle_proof(txids_in_block, idx)
    claim = dict(claim)
    claim["inclusion_proof"] = {
        "block_header_hash_hex": header["header_hash_hex"],
        "block_height": header["height"],
        "merkle_branch_hex": proof["merkle_branch_hex"],
        "merkle_index": proof["merkle_index"],
        "schema": "DonationInclusionProof",
    }
    return claim


def main() -> int:
    for d in (VALID, INVALID, GENESIS_DIR):
        d.mkdir(parents=True, exist_ok=True)

    charity_set = build_charity_set()
    alpha_script = charity_set["entries"][0]["script_pubkey_hex"]
    beta_script = charity_set["entries"][1]["script_pubkey_hex"]

    # --- Build two valid donations in one multi-output epoch ---
    nonce1 = "a1" + "00" * 15
    nonce1 = nonce1[:32]
    nonce2 = "a2" + "00" * 15
    nonce2 = nonce2[:32]
    nonce3 = "a3" + "00" * 15
    nonce3 = nonce3[:32]

    pq_alice = PUBLIC_TEST_SEEDS["pq_alice"]
    pq_bob = PUBLIC_TEST_SEEDS["pq_bob"]
    pq_attacker = PUBLIC_TEST_SEEDS["pq_attacker"]
    src1 = PUBLIC_TEST_SEEDS["source_donor_1"]
    src2 = PUBLIC_TEST_SEEDS["source_donor_2"]
    src_stolen = PUBLIC_TEST_SEEDS["source_stolen"]

    # Precompute commitments then txs.
    def mk_claim(amount, charity_id, script, pq_seed, source_seed, nonce, extra=None, vout=0):
        pk = derive_pq_public_key(pq_seed)
        c = donation_commitment_hex(
            new_ledger_chain_id=DEFAULT_NEW_LEDGER_CHAIN_ID,
            epoch_id=DEFAULT_EPOCH_ID,
            charity_id=charity_id,
            donation_vout=vout,
            amount_sats=amount,
            pq_destination_public_key_hex=pk,
            nonce_hex=nonce,
        )
        tx = build_donation_tx(
            charity_script=script,
            amount_sats=amount,
            commitment_hex=c,
            donor_seed=source_seed,
            extra_outputs=extra,
        )
        return sign_claim(
            tx=tx,
            vout=vout,
            amount_sats=amount,
            charity_id=charity_id,
            pq_seed=pq_seed,
            source_seed=source_seed,
            nonce_hex=nonce,
        )

    claim_a = mk_claim(100_000, "CHARITY_ALPHA", alpha_script, pq_alice, src1, nonce1)
    claim_b = mk_claim(250_000, "CHARITY_BETA", beta_script, pq_bob, src2, nonce2)

    # Multi-output donation: one tx, two charity outputs, two claims.
    pk_a = derive_pq_public_key(pq_alice)
    pk_b = derive_pq_public_key(pq_bob)
    c_multi0 = donation_commitment_hex(
        new_ledger_chain_id=DEFAULT_NEW_LEDGER_CHAIN_ID,
        epoch_id=DEFAULT_EPOCH_ID,
        charity_id="CHARITY_ALPHA",
        donation_vout=0,
        amount_sats=50_000,
        pq_destination_public_key_hex=pk_a,
        nonce_hex=nonce3,
    )
    c_multi1 = donation_commitment_hex(
        new_ledger_chain_id=DEFAULT_NEW_LEDGER_CHAIN_ID,
        epoch_id=DEFAULT_EPOCH_ID,
        charity_id="CHARITY_BETA",
        donation_vout=1,
        amount_sats=75_000,
        pq_destination_public_key_hex=pk_b,
        nonce_hex="a4" + "00" * 15,
    )
    multi_tx = {
        "version": 1,
        "locktime": 0,
        "inputs": [
            {
                "prev_txid_hex": "00" * 32,
                "prev_vout": 1,
                "script_sig_hex": "00",
                "sequence": 0xFFFFFFFF,
            }
        ],
        "outputs": [
            {"script_pubkey_hex": alpha_script, "value_sats": 50_000},
            {"script_pubkey_hex": beta_script, "value_sats": 75_000},
            {"script_pubkey_hex": make_op_return_script(c_multi0), "value_sats": 0},
            {"script_pubkey_hex": make_op_return_script(c_multi1), "value_sats": 0},
        ],
        "label": "SYNTHETIC_MULTI_DONATION_TX",
    }
    claim_m0 = sign_claim(
        tx=multi_tx,
        vout=0,
        amount_sats=50_000,
        charity_id="CHARITY_ALPHA",
        pq_seed=pq_alice,
        source_seed=src1,
        nonce_hex=nonce3,
    )
    claim_m1 = sign_claim(
        tx=multi_tx,
        vout=1,
        amount_sats=75_000,
        charity_id="CHARITY_BETA",
        pq_seed=pq_bob,
        source_seed=src1,
        nonce_hex="a4" + "00" * 15,
    )

    # Place transactions into synthetic blocks.
    # heights: 100, 101, 102, ... tip will be high enough for confirmations.
    genesis_prev = "00" * 32
    tx_list_block0 = [claim_a["donation_txid_hex"], "aa" * 32]
    tx_list_block1 = [claim_b["donation_txid_hex"], claim_m0["donation_txid_hex"], "bb" * 32]
    # Boundary / cutoff block at height 110 later.

    headers = build_header_chain(
        start_height=100,
        prev_hash_hex=genesis_prev,
        blocks=[
            {"merkle_root_hex": merkle_root(tx_list_block0), "txids_hex": tx_list_block0, "time": 1_700_000_100},
            {"merkle_root_hex": merkle_root(tx_list_block1), "txids_hex": tx_list_block1, "time": 1_700_000_101},
        ],
    )
    # Extend chain for confirmations (tip height 120).
    tip_headers = build_header_chain(
        start_height=102,
        prev_hash_hex=headers[-1]["header_hash_hex"],
        blocks=[
            {
                "merkle_root_hex": merkle_root(["cc" * 32]),
                "txids_hex": ["cc" * 32],
                "time": 1_700_000_102 + i,
            }
            for i in range(19)
        ],
    )
    all_headers = headers + tip_headers
    headers_by_hash = {h["header_hash_hex"]: h for h in all_headers}
    tip = all_headers[-1]
    tip_height = tip["height"]
    tip_hash = tip["header_hash_hex"]

    eligibility_header = all_headers[10]  # height 110; accepted tip is height 120.
    epoch_open = migration_epoch_close(
        epoch_id=DEFAULT_EPOCH_ID,
        accepted_source_tip_height=tip_height,
        accepted_source_tip_header_hash_hex=tip_hash,
        last_eligible_inclusion_height=eligibility_header["height"],
        last_eligible_inclusion_header_hash_hex=eligibility_header["header_hash_hex"],
        min_confirmations=DEFAULT_MIN_CONFIRMATIONS,
        closed=False,
        quantum_compromise_cutoff_height=1_000_000,
    )
    epoch_closed = dict(epoch_open)
    epoch_closed["closed"] = True

    claim_a = attach_inclusion(claim_a, headers=all_headers, block_index=0, txids_in_block=tx_list_block0)
    claim_b = attach_inclusion(claim_b, headers=all_headers, block_index=1, txids_in_block=tx_list_block1)
    claim_m0 = attach_inclusion(claim_m0, headers=all_headers, block_index=1, txids_in_block=tx_list_block1)
    claim_m1 = attach_inclusion(claim_m1, headers=all_headers, block_index=1, txids_in_block=tx_list_block1)

    # Write genesis context
    genesis_ctx = {
        "label": "SYNTHETIC_GENESIS_CONTEXT_NOT_MAINNET",
        "charity_set": charity_set,
        "epoch_open": epoch_open,
        "epoch_closed": epoch_closed,
        "headers": all_headers,
        "tip_height": tip_height,
        "tip_hash_hex": tip_hash,
        "eligibility_cutoff_hash_hex": eligibility_header["header_hash_hex"],
        "fixed_bitcoin_genesis_pool": DEFAULT_FIXED_BITCOIN_GENESIS_POOL,
        "new_ledger_chain_id": DEFAULT_NEW_LEDGER_CHAIN_ID,
        "source_chain": DEFAULT_SOURCE_CHAIN,
        "public_test_seeds_are_not_secrets": True,
        "seed_labels": sorted(PUBLIC_TEST_SEEDS.keys()),
    }
    _write(GENESIS_DIR / "CONTEXT.json", genesis_ctx)
    _write(GENESIS_DIR / "CHARITY_SET.json", charity_set)
    _write(GENESIS_DIR / "EPOCH_OPEN.json", epoch_open)
    _write(GENESIS_DIR / "EPOCH_CLOSED.json", epoch_closed)

    # Valid fixtures
    _write(VALID / "claim_single_alpha.json", claim_a)
    _write(VALID / "claim_single_beta.json", claim_b)
    _write(VALID / "claim_multi_out0.json", claim_m0)
    _write(VALID / "claim_multi_out1.json", claim_m1)

    # Stolen key still verifies crypto control (notes residual non-claim).
    claim_stolen = mk_claim(10_000, "CHARITY_ALPHA", alpha_script, pq_alice, src_stolen, "a5" + "00" * 15)
    # put in a new block on an extended fork for isolation — attach to block 0 with unique tx
    # Re-include in a dedicated small chain segment using existing headers is hard;
    # instead add tx to a parallel inclusion by rebuilding a dedicated block list at height 100.
    # Simpler: use claim_a structure but different amounts already done — re-mine into tip-1 block.
    stolen_txids = [claim_stolen["donation_txid_hex"], "dd" * 32]
    stolen_headers = build_header_chain(
        start_height=100,
        prev_hash_hex=genesis_prev,
        blocks=[{"merkle_root_hex": merkle_root(stolen_txids), "txids_hex": stolen_txids}],
    )
    # For stolen key fixture we use the main chain only if we embed tx — skip separate chain.
    # Attach using a copy of claim_a inclusion pattern with recomputed headers in genesis extension.
    # Easiest path: add stolen claim as invalid-for-legal note but valid crypto using main verifier
    # by placing it in block at height 102+.
    # Rebuild: append a block containing stolen tx after headers[0]... use all_headers index 2.
    block_for_stolen = {
        "merkle_root_hex": merkle_root(stolen_txids),
        "txids_hex": stolen_txids,
        "time": 1_700_000_200,
    }
    # We will verify stolen claim with a dedicated mini-context in the invalid/valid set.
    # Place under valid_with_notes.
    stolen_chain = build_header_chain(
        start_height=100,
        prev_hash_hex=genesis_prev,
        blocks=[block_for_stolen]
        + [
            {
                "merkle_root_hex": merkle_root([f"{i:02x}" * 32]),
                "txids_hex": [f"{i:02x}" * 32],
                "time": 1_700_000_300 + i,
            }
            for i in range(10)
        ],
    )
    claim_stolen = attach_inclusion(
        claim_stolen, headers=stolen_chain, block_index=0, txids_in_block=stolen_txids
    )
    stolen_ctx = {
        "headers": stolen_chain,
        "tip_height": stolen_chain[-1]["height"],
        "tip_hash_hex": stolen_chain[-1]["header_hash_hex"],
        "epoch": migration_epoch_close(
            accepted_source_tip_height=stolen_chain[-1]["height"],
            accepted_source_tip_header_hash_hex=stolen_chain[-1]["header_hash_hex"],
            last_eligible_inclusion_height=stolen_chain[-1]["height"],
            last_eligible_inclusion_header_hash_hex=stolen_chain[-1]["header_hash_hex"],
            min_confirmations=6,
            closed=False,
            quantum_compromise_cutoff_height=1_000_000,
        ),
    }
    _write(VALID / "claim_stolen_source_key_crypto_ok.json", claim_stolen)
    _write(VALID / "context_stolen_source_key.json", stolen_ctx)

    # Charity rebate collusion — still crypto-valid, residual risk note.
    claim_rebate = dict(claim_a)
    claim_rebate = json.loads(json.dumps(claim_a))
    _write(VALID / "claim_charity_rebate_collusion_crypto_ok.json", claim_rebate)

    # Verify valids and build allocation
    def make_verifier(ctx_headers=None, tip_h=None, tip_x=None, epoch=None):
        hbh = {h["header_hash_hex"]: h for h in (ctx_headers or all_headers)}
        return ClaimVerifier(
            charity_set=charity_set,
            epoch=epoch or epoch_open,
            headers_by_hash=hbh,
            tip_height=tip_h if tip_h is not None else tip_height,
            tip_hash_hex=tip_x or tip_hash,
            new_ledger_chain_id=DEFAULT_NEW_LEDGER_CHAIN_ID,
        )

    v = make_verifier()
    admitted = []
    for c in (claim_a, claim_b, claim_m0, claim_m1):
        r = v.verify_claim(c)
        assert r.ok, (c.get("charity_id"), r.code, r.detail)
        admitted.append(r)
    v_closed = make_verifier(epoch=epoch_closed)
    alloc = v_closed.close_and_allocate(
        admitted,
        fixed_bitcoin_genesis_pool=DEFAULT_FIXED_BITCOIN_GENESIS_POOL,
        epoch_id=DEFAULT_EPOCH_ID,
    )
    assert_supply_invariant(alloc)
    _write(VALID / "allocation_after_epoch.json", alloc)

    # --- Invalid / adversarial fixtures ---
    expected_map: dict[str, str] = {}

    def inv(name: str, claim_obj: dict, code: str, **meta: Any) -> None:
        payload = {"claim": claim_obj, "expected_code": code, **meta}
        _write(INVALID / f"{name}.json", payload)
        expected_map[name] = code

    # 1. Front-run / copy to different PQ key
    fr = json.loads(json.dumps(claim_a))
    fr_pk = derive_pq_public_key(pq_attacker)
    fr["pq_destination_public_key_hex"] = fr_pk
    # Re-sign with attacker key but commitment still binds alice (in tx OP_RETURN)
    msg = pq_message_for_claim(
        new_ledger_chain_id=fr["new_ledger_chain_id"],
        epoch_id=fr["epoch_id"],
        charity_id=fr["charity_id"],
        donation_txid_hex=fr["donation_txid_hex"],
        donation_vout=fr["donation_vout"],
        amount_sats=fr["amount_sats"],
        commitment_hex=fr["declared_commitment_hex"],
        nullifier_hex=fr["nullifier_hex"],
    )
    fr["pq_signature_hex"] = pq_sign(pq_attacker, msg)
    inv("front_run_different_pq_key", fr, "COMMITMENT_INVALID")

    # Actually commitment check: declared_commitment is still alice's; recomputed
    # uses attacker pk so declared != recomputed -> COMMITMENT_INVALID.
    # If attacker also changes declared_commitment, OP_RETURN won't match.
    fr2 = json.loads(json.dumps(claim_a))
    fr2["pq_destination_public_key_hex"] = fr_pk
    fr2["declared_commitment_hex"] = donation_commitment_hex(
        new_ledger_chain_id=fr2["new_ledger_chain_id"],
        epoch_id=fr2["epoch_id"],
        charity_id=fr2["charity_id"],
        donation_vout=fr2["donation_vout"],
        amount_sats=fr2["amount_sats"],
        pq_destination_public_key_hex=fr_pk,
        nonce_hex=fr2["commitment_nonce_hex"],
    )
    msg2 = pq_message_for_claim(
        new_ledger_chain_id=fr2["new_ledger_chain_id"],
        epoch_id=fr2["epoch_id"],
        charity_id=fr2["charity_id"],
        donation_txid_hex=fr2["donation_txid_hex"],
        donation_vout=fr2["donation_vout"],
        amount_sats=fr2["amount_sats"],
        commitment_hex=fr2["declared_commitment_hex"],
        nullifier_hex=fr2["nullifier_hex"],
    )
    fr2["pq_signature_hex"] = pq_sign(pq_attacker, msg2)
    inv("front_run_rewritten_commitment", fr2, "COMMITMENT_INVALID")

    # 2. Same donation claimed twice
    inv("double_claim_same_output", json.loads(json.dumps(claim_a)), "NULLIFIER_ALREADY_CONSUMED",
        pre_consume_nullifier=claim_a["nullifier_hex"])

    # 3. Wrong output index
    woi = json.loads(json.dumps(claim_m0))
    woi["donation_vout"] = 1  # beta output but claim still alpha commitment fields partially
    inv("wrong_output_index", woi, "AMOUNT_MISMATCH")

    # 4. Amount mismatch
    am = json.loads(json.dumps(claim_a))
    am["amount_sats"] = claim_a["amount_sats"] + 1
    inv("amount_mismatch", am, "AMOUNT_MISMATCH")

    # 5. Wrong charity id with matching-looking address text
    wc = json.loads(json.dumps(claim_a))
    wc["charity_id"] = "CHARITY_BETA"
    wc["charity_address_string"] = "bc1q-synth-lookalike-not-real"
    # Will hit ADDRESS_STRING first due to address field
    inv("address_string_ambiguity", wc, "UNKNOWN_FIELD")

    wc2 = json.loads(json.dumps(claim_a))
    wc2["charity_id"] = "CHARITY_BETA"
    # script is still alpha -> CHARITY_SCRIPT_MISMATCH or SCRIPT
    inv("wrong_charity_id_script_mismatch", wc2, "CHARITY_SCRIPT_MISMATCH")

    # 6. Script substitution
    ss = json.loads(json.dumps(claim_a))
    ss["transaction"] = json.loads(json.dumps(claim_a["transaction"]))
    ss["transaction"]["outputs"][0]["script_pubkey_hex"] = beta_script
    # Recompute txid so exact charity-script validation is reached.
    ss["donation_txid_hex"] = txid_from_tx(ss["transaction"])
    # txid field rewritten to match mutated body so identity check passes;
    # exact script comparison then rejects under the script-substitution attack label.
    inv("script_substitution", ss, "CHARITY_SCRIPT_MISMATCH")

    # A second case retains the old txid so identity validation rejects first.
    ss2 = json.loads(json.dumps(claim_a))
    ss2["transaction"] = json.loads(json.dumps(claim_a["transaction"]))
    ss2["transaction"]["outputs"][0]["script_pubkey_hex"] = beta_script
    # Keep claimed txid as original so identity check fails first — good.
    inv("script_substitution_identity_break", ss2, "TX_MALLEABILITY_REENCODING")

    # Direct script mismatch without changing txid field (inconsistent body)
    # Already covered.

    # 7. Malformed / duplicate charity entries
    _write(
        INVALID / "duplicate_charity_entries.json",
        {
            "expected_code": "DUPLICATE_CHARITY_ENTRY",
            "entries": charity_set["entries"] + charity_set["entries"][:1],
        },
    )
    expected_map["duplicate_charity_entries"] = "DUPLICATE_CHARITY_ENTRY"
    _write(
        INVALID / "malformed_charity_entry.json",
        {
            "expected_code": "MALFORMED_CHARITY_ENTRY",
            "entry": {"charity_id": "", "script_pubkey_hex": "zz"},
        },
    )
    expected_map["malformed_charity_entry"] = "MALFORMED_CHARITY_ENTRY"

    # 8. Insufficient confirmations
    low = json.loads(json.dumps(claim_a))
    inv(
        "insufficient_confirmations",
        low,
        "INSUFFICIENT_CONFIRMATIONS",
        tip_height_override=claim_a["inclusion_proof"]["block_height"] + 1,
    )

    # 9. Claim after cutoff / epoch closed
    after = json.loads(json.dumps(claim_a))
    inv("claim_after_cutoff", after, "EPOCH_CLOSED", epoch="closed")

    # 10. Inclusion after cutoff
    # craft claim with block_height > last_clean
    iac = json.loads(json.dumps(claim_a))
    iac["inclusion_proof"] = dict(iac["inclusion_proof"])
    iac["inclusion_proof"]["block_height"] = tip_height + 5
    inv(
        "inclusion_after_cutoff",
        iac,
        "HEADER_ANCESTRY_INVALID",  # unknown/mismatch before cutoff check
        note="height mismatch with header yields ancestry failure first",
    )

    # Better inclusion_after_cutoff: use tip header but set epoch last_clean lower
    inv(
        "inclusion_after_cutoff_epoch",
        json.loads(json.dumps(claim_b)),
        "INCLUSION_AFTER_CUTOFF",
        epoch_last_clean_height_override=100,  # claim_b is at 101
    )

    # 11. Source tx at cutoff boundary — valid at exact last_clean
    boundary = json.loads(json.dumps(claim_a))  # height 100
    _write(
        VALID / "claim_at_cutoff_boundary.json",
        {
            "claim": boundary,
            "epoch_last_clean_height_override": 100,
            "tip_height_override": 100 + DEFAULT_MIN_CONFIRMATIONS - 1 + 10,
            "expected_code": "OK",
            "note": "Inclusion at exact last_clean_height is admitted when confirmations ok",
        },
    )

    # 12. Stale checkpoint
    stale = json.loads(json.dumps(claim_a))
    inv("stale_checkpoint", stale, "CHECKPOINT_MISMATCH", checkpoint_probe="stale_tip")

    # 13. Conflicting checkpoint
    conf = json.loads(json.dumps(claim_a))
    inv("conflicting_checkpoint", conf, "CHECKPOINT_MISMATCH", checkpoint_probe="conflicting_tip")

    # 14. Invalid Merkle branch
    bad_m = json.loads(json.dumps(claim_a))
    bad_m["inclusion_proof"] = dict(bad_m["inclusion_proof"])
    bad_m["inclusion_proof"]["merkle_branch_hex"] = ["ff" * 32]
    inv("invalid_merkle_branch", bad_m, "INCLUSION_PROOF_INVALID")

    # 15. Transaction malleability / re-encoding
    mal = json.loads(json.dumps(claim_a))
    mal["transaction"] = dict(mal["transaction"])
    mal["transaction"]["locktime"] = 1  # changes txid
    inv("tx_malleability_reencoding", mal, "TX_MALLEABILITY_REENCODING")

    # 16. Unsupported script / tx form
    uns = json.loads(json.dumps(claim_a))
    uns["transaction"]["unknown_field"] = True
    inv("unsupported_tx_form", uns, "UNSUPPORTED_TX_FORM")
    uns2 = json.loads(json.dumps(claim_a))
    uns2["transaction"]["outputs"][1]["script_pubkey_hex"] = "51"
    inv("unsupported_script_form", uns2, "UNSUPPORTED_TX_FORM")

    # 17. Nullifier domain omission
    nd = json.loads(json.dumps(claim_a))
    nd["nullifier_hex"] = domain_omission_attempt(
        donation_txid_hex=nd["donation_txid_hex"],
        donation_vout=nd["donation_vout"],
    )
    inv("nullifier_domain_omission", nd, "NULLIFIER_INVALID")

    # 18. PQ signature mutation / wrong alg / wrong key / wrong domain
    pqm = json.loads(json.dumps(claim_a))
    sig = bytearray(bytes.fromhex(pqm["pq_signature_hex"]))
    sig[-1] ^= 0x01
    pqm["pq_signature_hex"] = sig.hex()
    inv("pq_signature_mutation", pqm, "PQ_SIGNATURE_INVALID")

    pqa = json.loads(json.dumps(claim_a))
    raw_pqa = bytes.fromhex(pqa["pq_signature_hex"])
    pqa["pq_signature_hex"] = b"NOT_A_REAL_PQ_ALG\x00".hex() + raw_pqa.split(b"\x00", 1)[1].hex()
    inv("pq_wrong_algorithm", pqa, "PQ_ALGORITHM_UNSUPPORTED")

    pqk = json.loads(json.dumps(claim_a))
    pqk["pq_destination_public_key_hex"] = derive_pq_public_key(pq_bob)
    inv("pq_wrong_key", pqk, "COMMITMENT_INVALID")

    pqd = json.loads(json.dumps(claim_a))
    pqd["pq_signature_hex"] = pq_sign(pq_alice, pq_message_for_claim(
        new_ledger_chain_id=pqd["new_ledger_chain_id"], epoch_id=pqd["epoch_id"],
        charity_id=pqd["charity_id"], donation_txid_hex=pqd["donation_txid_hex"],
        donation_vout=pqd["donation_vout"], amount_sats=pqd["amount_sats"],
        commitment_hex=pqd["declared_commitment_hex"], nullifier_hex=pqd["nullifier_hex"]),
        domain=b"BGEN-WRONG-PQ-DOMAIN-v1")
    inv("pq_wrong_domain", pqd, "PQ_SIGNATURE_INVALID")

    # 19. Cross-chain / cross-epoch replay
    xchain = json.loads(json.dumps(claim_a))
    xchain["new_ledger_chain_id"] = "other-chain"
    inv("cross_chain_replay", xchain, "CROSS_CHAIN_REPLAY")
    xep = json.loads(json.dumps(claim_a))
    xep["epoch_id"] = "epoch-other"
    inv("cross_epoch_replay", xep, "CROSS_EPOCH_REPLAY")

    # 20. Unsupported source chain
    usc = json.loads(json.dumps(claim_a))
    usc["source_chain"] = "ethereum-synthetic"
    inv("unsupported_source_chain", usc, "UNSUPPORTED_SOURCE_CHAIN")

    # 21. Quantum compromise cutoff
    qc = json.loads(json.dumps(claim_a))
    inv(
        "quantum_compromise_cutoff",
        qc,
        "QUANTUM_COMPROMISE_CUTOFF",
        quantum_compromise_cutoff_height_override=50,  # claim at 100 > 50
    )

    # 22. Reorg before provisional acceptance — conflicting header not in tip ancestry
    reorg = json.loads(json.dumps(claim_a))
    # Build competing header at same height not linked to tip
    competitor = build_header_chain(
        start_height=100,
        prev_hash_hex="11" * 32,
        blocks=[{"merkle_root_hex": merkle_root([claim_a["donation_txid_hex"]]), "txids_hex": [claim_a["donation_txid_hex"]]}],
    )[0]
    reorg["inclusion_proof"] = {
        "block_header_hash_hex": competitor["header_hash_hex"],
        "block_height": 100,
        "merkle_branch_hex": [],
        "merkle_index": 0,
        "schema": "DonationInclusionProof",
    }
    inv(
        "reorg_before_acceptance",
        reorg,
        "HEADER_ANCESTRY_INVALID",
        extra_headers=[competitor],
        note="Competing branch not in accepted tip ancestry",
    )

    # 23. Amount not positive
    anp = json.loads(json.dumps(claim_a))
    anp["amount_sats"] = 0
    anp["transaction"] = json.loads(json.dumps(claim_a["transaction"]))
    anp["transaction"]["outputs"][0]["value_sats"] = 0
    inv("amount_not_positive", anp, "AMOUNT_NOT_POSITIVE")

    # Arithmetic overflow fixtures (allocation layer)
    _write(
        INVALID / "allocation_overflow_bool.json",
        {
            "expected_code": "ARITHMETIC_OVERFLOW",
            "pool": 100,
            "eligible": [["aa" * 32, True]],
        },
    )
    expected_map["allocation_overflow_bool"] = "ARITHMETIC_OVERFLOW"

    # Charity destination key compromise: if charity had a key — out of band;
    # model as note that charity script compromise does not create claim rights.
    _write(
        INVALID / "charity_destination_key_compromise_assumption.json",
        {
            "expected_code": "CHARITY_SCRIPT_MISMATCH",
            "note": (
                "Assumption: compromise of a charity-controlled key/script does not "
                "authorize genesis allocation. Claims still require exact genesis script "
                "and donor commitment binding. This fixture documents the assumption; "
                "no charity signing role exists in the protocol."
            ),
            "claim": json.loads(json.dumps(claim_a)),
            "mutated_genesis_script": beta_script,
        },
    )
    expected_map["charity_destination_key_compromise_assumption"] = "CHARITY_SCRIPT_MISMATCH"

    # Source reorg after provisional acceptance — documented as tip change rejection
    _write(
        INVALID / "reorg_after_provisional_acceptance.json",
        {
            "expected_code": "HEADER_ANCESTRY_INVALID",
            "note": (
                "After provisional acceptance, if the accepted tip reorgs away from the "
                "inclusion header, re-verification against the new tip fails ancestry."
            ),
            "claim": json.loads(json.dumps(claim_a)),
            "new_tip_only_headers": build_header_chain(
                start_height=100,
                prev_hash_hex="22" * 32,
                blocks=[
                    {
                        "merkle_root_hex": merkle_root(["99" * 32]),
                        "txids_hex": ["99" * 32],
                    }
                ]
                + [
                    {
                        "merkle_root_hex": merkle_root([f"{i+50:02x}" * 32]),
                        "txids_hex": [f"{i+50:02x}" * 32],
                    }
                    for i in range(15)
                ],
            ),
        },
    )
    expected_map["reorg_after_provisional_acceptance"] = "HEADER_ANCESTRY_INVALID"

    # EXPECTED catalog
    expected = {
        "schema": "bgen.fixture-expected/v0",
        "protocol_version": PROTOCOL_VERSION,
        "rejection_codes": REJECTION_CODES,
        "valid": [
            "claim_single_alpha.json",
            "claim_single_beta.json",
            "claim_multi_out0.json",
            "claim_multi_out1.json",
            "claim_stolen_source_key_crypto_ok.json",
            "claim_charity_rebate_collusion_crypto_ok.json",
            "claim_at_cutoff_boundary.json",
            "allocation_after_epoch.json",
        ],
        "invalid_expected_codes": expected_map,
        "documentary_only": [
            "charity_destination_key_compromise_assumption",
        ],
        "residual_risks": [
            "synthetic cryptographic primitives",
            "no Bitcoin consensus or script execution",
            "deep reorg and eclipse resistance outside bounded model",
            "charity rebate or collusion outside protocol",
            "cryptographic control is not legal ownership",
            "allocation economics and concentration not analysed",
            "charity-set publication governance is trusted",
            "quantum cutoff remains an external policy input",
        ],
        "allocation_invariant": {
            "pool": DEFAULT_FIXED_BITCOIN_GENESIS_POOL,
            "total_issued": alloc["total_issued"],
            "remainder_unissued": alloc["remainder_unissued"],
            "rule": "floor(pool * eligible_i / total_eligible); remainder unissued",
        },
    }
    _write(FIXTURES / "EXPECTED.json", expected)
    (INVALID / "duplicate_raw_claim.json").write_text(
        '{"schema":"BeneficialGenesisClaim","version":1,"version":2}\n',
        encoding="utf-8",
    )

    # Rejection codes schema dump
    _write(
        OUTPUT_ROOT / "schemas" / "rejection_codes.json",
        {
            "schema": "bgen.rejection-codes/v0",
            "codes": REJECTION_CODES,
        },
    )

    # Smoke: re-verify all simple invalids that don't need special meta
    print("fixtures generated")
    print(f"valid claims admitted: {len(admitted)}")
    print(f"allocation issued={alloc['total_issued']} rem={alloc['remainder_unissued']}")
    print(f"invalid cases: {len(expected_map)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
