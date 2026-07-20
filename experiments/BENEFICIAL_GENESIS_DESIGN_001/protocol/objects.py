"""Canonical protocol object builders and digests."""

from __future__ import annotations

from typing import Any

from .constants import (
    DEFAULT_EPOCH_ID,
    DEFAULT_NEW_LEDGER_CHAIN_ID,
    DEFAULT_SOURCE_CHAIN,
    DOMAIN_CHARITY_SET,
    DOMAIN_DONATION_COMMIT,
    DOMAIN_NULLIFIER,
    PROTOCOL_VERSION,
)
from .encoding import (
    canonical_json_bytes,
    domain_hash_hex,
    require_hex,
    u32_be,
    u64_be,
)


def charity_genesis_entry(
    *,
    charity_id: str,
    script_pubkey_hex: str,
    attestation_commitment_hex: str,
    valid_from_height: int,
    valid_until_height: int,
) -> dict[str, Any]:
    require_hex("script_pubkey_hex", script_pubkey_hex)
    require_hex("attestation_commitment_hex", attestation_commitment_hex, expected_bytes=32)
    if not charity_id or not isinstance(charity_id, str):
        raise ValueError("charity_id required")
    if valid_from_height < 0 or valid_until_height < valid_from_height:
        raise ValueError("invalid charity validity window")
    return {
        "attestation_commitment_hex": attestation_commitment_hex,
        "charity_id": charity_id,
        "script_pubkey_hex": script_pubkey_hex,
        "valid_from_height": valid_from_height,
        "valid_until_height": valid_until_height,
    }


def charity_set_commitment(entries: list[dict[str, Any]]) -> dict[str, Any]:
    ids = [e["charity_id"] for e in entries]
    if len(ids) != len(set(ids)):
        raise ValueError("DUPLICATE_CHARITY_ENTRY")
    ordered = sorted(entries, key=lambda e: e["charity_id"])
    digest = domain_hash_hex(
        DOMAIN_CHARITY_SET,
        canonical_json_bytes({"entries": ordered, "version": PROTOCOL_VERSION}),
    )
    return {
        "commitment_hex": digest,
        "entries": ordered,
        "schema": "CharitySetCommitment",
        "version": PROTOCOL_VERSION,
    }


def donation_commitment_preimage(
    *,
    new_ledger_chain_id: str,
    epoch_id: str,
    charity_id: str,
    donation_vout: int,
    amount_sats: int,
    pq_destination_public_key_hex: str,
    nonce_hex: str,
    commitment_version: int = 1,
) -> bytes:
    """Commitment preimage for the in-transaction OP_RETURN binding.

    Deliberately omits txid so the commitment can be placed inside the same
    transaction without a circular identity dependency. The nullifier and claim
    separately bind the concrete (txid, vout) once the txid is known.
    """

    pq = require_hex("pq_destination_public_key_hex", pq_destination_public_key_hex, expected_bytes=32)
    nonce = require_hex("nonce_hex", nonce_hex, expected_bytes=16)
    return b"".join(
        [
            DOMAIN_DONATION_COMMIT,
            b"\x00",
            new_ledger_chain_id.encode("utf-8"),
            b"\x00",
            epoch_id.encode("utf-8"),
            b"\x00",
            charity_id.encode("utf-8"),
            b"\x00",
            u32_be(donation_vout),
            u64_be(amount_sats),
            pq,
            nonce,
            u32_be(commitment_version),
        ]
    )


def donation_commitment_hex(**kwargs: Any) -> str:
    from .encoding import sha256_hex

    return sha256_hex(donation_commitment_preimage(**kwargs))


def donation_nullifier_hex(
    *,
    source_chain: str = DEFAULT_SOURCE_CHAIN,
    donation_txid_hex: str,
    donation_vout: int,
) -> str:
    txid = require_hex("donation_txid_hex", donation_txid_hex, expected_bytes=32)
    return domain_hash_hex(
        DOMAIN_NULLIFIER,
        source_chain.encode("utf-8"),
        txid,
        u32_be(donation_vout),
    )


def make_op_return_script(commitment_hex: str) -> str:
    """Synthetic OP_RETURN script: 0x6a || push32 || commitment."""

    c = require_hex("commitment_hex", commitment_hex, expected_bytes=32)
    return ("6a20" + c.hex()).lower()


def make_p2wpkh_like_script(program20_hex: str) -> str:
    """Synthetic v0 witness program script (exact bytes compared)."""

    prog = require_hex("program20_hex", program20_hex, expected_bytes=20)
    return ("0014" + prog.hex()).lower()


def source_header_checkpoint(header: dict[str, Any], *, note: str = "") -> dict[str, Any]:
    return {
        "header_hash_hex": header["header_hash_hex"],
        "height": header["height"],
        "merkle_root_hex": header["merkle_root_hex"],
        "note": note,
        "prev_hash_hex": header["prev_hash_hex"],
        "schema": "SourceHeaderCheckpoint",
        "time": header.get("time", 0),
    }


def migration_epoch_close(
    *,
    epoch_id: str = DEFAULT_EPOCH_ID,
    last_clean_source_height: int,
    last_clean_source_header_hash_hex: str,
    min_confirmations: int,
    closed: bool,
    quantum_compromise_cutoff_height: int | None = None,
) -> dict[str, Any]:
    require_hex(
        "last_clean_source_header_hash_hex",
        last_clean_source_header_hash_hex,
        expected_bytes=32,
    )
    obj: dict[str, Any] = {
        "closed": closed,
        "epoch_id": epoch_id,
        "last_clean_source_header_hash_hex": last_clean_source_header_hash_hex,
        "last_clean_source_height": last_clean_source_height,
        "min_confirmations": min_confirmations,
        "schema": "MigrationEpochClose",
        "version": PROTOCOL_VERSION,
    }
    if quantum_compromise_cutoff_height is not None:
        obj["quantum_compromise_cutoff_height"] = quantum_compromise_cutoff_height
    return obj


def genesis_allocation_record(
    *,
    epoch_id: str,
    fixed_bitcoin_genesis_pool: int,
    claim_rows: list[dict[str, Any]],
    total_eligible_sats: int,
    total_issued: int,
    remainder_unissued: int,
) -> dict[str, Any]:
    ordered = sorted(claim_rows, key=lambda r: r["nullifier_hex"])
    return {
        "claims": ordered,
        "epoch_id": epoch_id,
        "fixed_bitcoin_genesis_pool": fixed_bitcoin_genesis_pool,
        "remainder_handling": "UNISSUED_FLOOR_REMAINDER",
        "remainder_unissued": remainder_unissued,
        "schema": "GenesisAllocationRecord",
        "total_eligible_sats": total_eligible_sats,
        "total_issued": total_issued,
        "version": PROTOCOL_VERSION,
    }


def default_ids() -> dict[str, str]:
    return {
        "epoch_id": DEFAULT_EPOCH_ID,
        "new_ledger_chain_id": DEFAULT_NEW_LEDGER_CHAIN_ID,
        "source_chain": DEFAULT_SOURCE_CHAIN,
    }
