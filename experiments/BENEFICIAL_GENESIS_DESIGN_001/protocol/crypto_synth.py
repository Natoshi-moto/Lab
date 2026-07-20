"""Synthetic cryptography for deterministic fixtures.

IMPORTANT
---------
This module intentionally implements a NON-POST-QUANTUM stand-in so that
fixtures are pure-Python, deterministic, and dependency-free. The algorithm
tag SYNTHETIC_HMAC_SHA256_PQ_STANDIN_v1 must never be confused with real
Dilithium, SPHINCS+, or any production signature scheme.

Source-chain authorization is likewise synthetic: a domain-separated HMAC
demonstrates "fixture control" of a labelled source key seed. It is not
Bitcoin script evaluation and not ECDSA/Schnorr.
"""

from __future__ import annotations

import hashlib
import hmac
from typing import Final

from .constants import DOMAIN_PQ_PK, DOMAIN_PQ_SIG, DOMAIN_SOURCE_AUTH, SYNTH_PQ_ALG
from .encoding import domain_hash, require_hex, sha256_hex, u32_be


# Public test-only seeds. These are fixtures, not secrets.
PUBLIC_TEST_SEEDS: Final[dict[str, str]] = {
    # Pure lowercase hex fixture seeds — NOT operational secrets.
    "pq_alice": "a11ce00000000000000000000000000000000000000000000000000000000001",
    "pq_bob": "b0b0000000000000000000000000000000000000000000000000000000000002",
    "pq_attacker": "a77ac00000000000000000000000000000000000000000000000000000000003",
    "source_donor_1": "d0d0100000000000000000000000000000000000000000000000000000000001",
    "source_donor_2": "d0d0200000000000000000000000000000000000000000000000000000000002",
    "source_stolen": "57eae00000000000000000000000000000000000000000000000000000000004",
}


def derive_pq_public_key(secret_seed_hex: str) -> str:
    seed = require_hex("secret_seed_hex", secret_seed_hex, expected_bytes=32)
    return domain_hash(DOMAIN_PQ_PK, seed).hex()


def pq_sign(secret_seed_hex: str, message: bytes, *, domain: bytes = DOMAIN_PQ_SIG) -> str:
    seed = require_hex("secret_seed_hex", secret_seed_hex, expected_bytes=32)
    mac = hmac.new(seed, domain + b"\x00" + message, hashlib.sha256).digest()
    # Append public algorithm tag binding into signature blob (alg || mac).
    return (SYNTH_PQ_ALG.encode("ascii") + b"\x00" + mac).hex()


def pq_verify(
    public_key_hex: str,
    message: bytes,
    signature_hex: str,
    *,
    domain: bytes = DOMAIN_PQ_SIG,
    expected_public_key_hex: str | None = None,
) -> str | None:
    """Return None if valid, else a rejection code string."""

    try:
        pk = require_hex("public_key_hex", public_key_hex, expected_bytes=32)
        sig_raw = require_hex("signature_hex", signature_hex)
    except (TypeError, ValueError):
        return "PQ_SIGNATURE_INVALID"

    if expected_public_key_hex is not None and public_key_hex != expected_public_key_hex:
        return "PQ_KEY_WRONG"

    sep = sig_raw.find(b"\x00")
    if sep <= 0:
        return "PQ_SIGNATURE_INVALID"
    alg = sig_raw[:sep]
    mac = sig_raw[sep + 1 :]
    if alg != SYNTH_PQ_ALG.encode("ascii"):
        return "PQ_ALGORITHM_UNSUPPORTED"
    if len(mac) != 32:
        return "PQ_SIGNATURE_INVALID"

    # Verification without secret: re-derive is impossible for HMAC; fixtures
    # carry the seed only in generator context. For the verifier we accept a
    # synthetic verification oracle based on binding public key into the MAC
    # check via a published verification table OR recompute using a
    # public-test-seed reverse map for known fixture keys only.
    #
    # Design choice for this design pack: signature MAC is over
    # domain||0x00||message||pk so that verification can use a second form.
    # Actual scheme: MAC = HMAC(seed, domain||0x00||message). Verifier checks
    # by testing whether any known fixture seed derives this pk and validates.
    # For unknown keys, verification fails closed unless the expanded form
    # below is used.
    #
    # Expanded form used by this module:
    #   expanded_mac = SHA256(DOMAIN_PQ_SIG || 0x00 || pk || message || mac_from_seed)
    # Fixtures store the full signature as alg||0x00||seed_mac, and verify by
    # brute-force of PUBLIC_TEST_SEEDS only (deterministic design pack).
    for seed_hex in PUBLIC_TEST_SEEDS.values():
        if derive_pq_public_key(seed_hex) != public_key_hex:
            continue
        expected = bytes.fromhex(pq_sign(seed_hex, message, domain=domain))
        if hmac.compare_digest(expected, sig_raw):
            if domain != DOMAIN_PQ_SIG:
                return "PQ_DOMAIN_INVALID"
            return None
        # Wrong domain attempt
        if domain != DOMAIN_PQ_SIG:
            return "PQ_DOMAIN_INVALID"
        return "PQ_SIGNATURE_INVALID"

    # Unknown key outside fixture map: fail closed.
    _ = pk  # retained for clarity
    return "PQ_KEY_WRONG"


def pq_message_for_claim(
    *,
    new_ledger_chain_id: str,
    epoch_id: str,
    charity_id: str,
    donation_txid_hex: str,
    donation_vout: int,
    amount_sats: int,
    commitment_hex: str,
    nullifier_hex: str,
) -> bytes:
    """Canonical message signed by the bound PQ destination key."""

    body = {
        "amount_sats": amount_sats,
        "charity_id": charity_id,
        "commitment_hex": commitment_hex,
        "donation_txid_hex": donation_txid_hex,
        "donation_vout": donation_vout,
        "epoch_id": epoch_id,
        "new_ledger_chain_id": new_ledger_chain_id,
        "nullifier_hex": nullifier_hex,
        "purpose": "beneficial-genesis-claim-v1",
    }
    # Local import avoided: encoding is sibling module.
    from .encoding import canonical_json_bytes

    return b"BGEN-PQ-CLAIM-MSG-v1\x00" + canonical_json_bytes(body)


def source_public_key(secret_seed_hex: str) -> str:
    seed = require_hex("secret_seed_hex", secret_seed_hex, expected_bytes=32)
    return domain_hash(DOMAIN_SOURCE_AUTH, b"pk", seed).hex()


def source_authorize(secret_seed_hex: str, txid_hex: str, sighash_hex: str) -> dict:
    """Return a synthetic source authorization object for a donation tx."""

    seed = require_hex("secret_seed_hex", secret_seed_hex, expected_bytes=32)
    txid = require_hex("txid_hex", txid_hex, expected_bytes=32)
    sighash = require_hex("sighash_hex", sighash_hex, expected_bytes=32)
    mac = hmac.new(
        seed,
        DOMAIN_SOURCE_AUTH + b"\x00" + txid + sighash,
        hashlib.sha256,
    ).digest()
    return {
        "alg": "SYNTHETIC_SOURCE_HMAC_v1",
        "public_key_hex": source_public_key(secret_seed_hex),
        "signature_hex": mac.hex(),
        "sighash_hex": sighash_hex,
        # Label only — not a legal ownership claim.
        "control_label": "CRYPTOGRAPHIC_CONTROL_SYNTHETIC",
    }


def source_verify(auth: dict, txid_hex: str) -> str | None:
    if not isinstance(auth, dict):
        return "SOURCE_AUTH_INVALID"
    if set(auth) != {"alg", "public_key_hex", "signature_hex", "sighash_hex", "control_label"}:
        return "SOURCE_AUTH_INVALID"
    if auth.get("alg") != "SYNTHETIC_SOURCE_HMAC_v1":
        return "SOURCE_AUTH_INVALID"
    try:
        pk = require_hex("public_key_hex", auth["public_key_hex"], expected_bytes=32)
        sig = require_hex("signature_hex", auth["signature_hex"], expected_bytes=32)
        sighash = require_hex("sighash_hex", auth["sighash_hex"], expected_bytes=32)
        txid = require_hex("txid_hex", txid_hex, expected_bytes=32)
    except (KeyError, TypeError, ValueError):
        return "SOURCE_AUTH_INVALID"

    for seed_hex in PUBLIC_TEST_SEEDS.values():
        if source_public_key(seed_hex) != pk.hex():
            continue
        expected = bytes.fromhex(
            source_authorize(seed_hex, txid_hex, sighash.hex())["signature_hex"]
        )
        if hmac.compare_digest(expected, sig):
            return None
        return "SOURCE_AUTH_INVALID"
    _ = u32_be  # silence linters if unused in some builds
    _ = sha256_hex
    return "SOURCE_AUTH_INVALID"
