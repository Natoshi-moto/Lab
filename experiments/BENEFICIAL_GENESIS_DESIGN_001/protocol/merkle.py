"""Synthetic Bitcoin-like transaction identity, headers, and Merkle proofs.

This is a bounded model for inclusion proofs. It is not a Bitcoin full node
and does not speak to mainnet consensus, reorg policy beyond fixtures, or
script execution.
"""

from __future__ import annotations

from typing import Any, Iterable, Sequence

from .constants import DOMAIN_HEADER, DOMAIN_MERKLE, DOMAIN_TXID
from .encoding import canonical_json_bytes, domain_hash, domain_hash_hex, require_hex, sha256


def txid_from_tx(tx: dict[str, Any]) -> str:
    """Compute synthetic txid from the canonical transaction object.

    Only the identity-relevant fields are hashed. Witness-like fields that are
    not part of the synthetic identity surface are excluded to model a stable
    txid under non-malleable encoding rules of this pack.
    """

    identity = {
        "inputs": tx.get("inputs"),
        "locktime": tx.get("locktime", 0),
        "outputs": tx.get("outputs"),
        "version": tx.get("version", 1),
    }
    return domain_hash_hex(DOMAIN_TXID, canonical_json_bytes(identity))


def merkle_parent(left: bytes, right: bytes) -> bytes:
    return domain_hash(DOMAIN_MERKLE, left, right)


def merkle_root(txids_hex: Sequence[str]) -> str:
    if not txids_hex:
        raise ValueError("empty merkle tree")
    level = [require_hex("txid", t, expected_bytes=32) for t in txids_hex]
    while len(level) > 1:
        if len(level) % 2 == 1:
            level.append(level[-1])
        nxt = []
        for i in range(0, len(level), 2):
            nxt.append(merkle_parent(level[i], level[i + 1]))
        level = nxt
    return level[0].hex()


def merkle_proof(txids_hex: Sequence[str], index: int) -> dict[str, Any]:
    if index < 0 or index >= len(txids_hex):
        raise IndexError("merkle index out of range")
    level = [require_hex("txid", t, expected_bytes=32) for t in txids_hex]
    branch: list[str] = []
    idx = index
    while len(level) > 1:
        if len(level) % 2 == 1:
            level.append(level[-1])
        if idx % 2 == 0:
            sibling = level[idx + 1]
        else:
            sibling = level[idx - 1]
        branch.append(sibling.hex())
        nxt = []
        for i in range(0, len(level), 2):
            nxt.append(merkle_parent(level[i], level[i + 1]))
        level = nxt
        idx //= 2
    return {
        "merkle_branch_hex": branch,
        "merkle_index": index,
        "merkle_root_hex": level[0].hex() if level else merkle_root(txids_hex),
    }


def verify_merkle_proof(
    txid_hex: str,
    merkle_root_hex: str,
    branch_hex: Sequence[str],
    index: int,
) -> bool:
    try:
        h = require_hex("txid", txid_hex, expected_bytes=32)
        root = require_hex("merkle_root", merkle_root_hex, expected_bytes=32)
        idx = index
        for sib_hex in branch_hex:
            sib = require_hex("branch", sib_hex, expected_bytes=32)
            if idx % 2 == 0:
                h = merkle_parent(h, sib)
            else:
                h = merkle_parent(sib, h)
            idx //= 2
        return h == root
    except (TypeError, ValueError):
        return False


def header_hash(header: dict[str, Any]) -> str:
    body = {
        "bits": header.get("bits", 0),
        "height": header["height"],
        "merkle_root_hex": header["merkle_root_hex"],
        "prev_hash_hex": header["prev_hash_hex"],
        "time": header.get("time", 0),
    }
    return domain_hash_hex(DOMAIN_HEADER, canonical_json_bytes(body))


def build_header_chain(
    *,
    start_height: int,
    prev_hash_hex: str,
    blocks: Iterable[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Build a synthetic header chain. Each block needs merkle_root_hex and time."""

    chain: list[dict[str, Any]] = []
    height = start_height
    prev = prev_hash_hex
    for block in blocks:
        header = {
            "height": height,
            "prev_hash_hex": prev,
            "merkle_root_hex": block["merkle_root_hex"],
            "time": block.get("time", 1_700_000_000 + height),
            "bits": block.get("bits", 0x1D00FFFF),
        }
        hh = header_hash(header)
        header["header_hash_hex"] = hh
        header["txids_hex"] = list(block.get("txids_hex", []))
        chain.append(header)
        prev = hh
        height += 1
    return chain


def confirmations(inclusion_height: int, tip_height: int) -> int:
    if tip_height < inclusion_height:
        return 0
    return tip_height - inclusion_height + 1
