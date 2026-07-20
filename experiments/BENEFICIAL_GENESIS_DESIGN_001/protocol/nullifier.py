"""One-time donation nullifier set for Beneficial Genesis claims."""

from __future__ import annotations

from typing import Iterable

from .objects import donation_nullifier_hex


class NullifierSet:
    """In-memory nullifier set with deterministic rejection codes."""

    def __init__(self) -> None:
        self._seen: set[str] = set()

    def __contains__(self, nullifier_hex: str) -> bool:
        return nullifier_hex in self._seen

    def consume(self, nullifier_hex: str) -> str | None:
        """Return None on success, else a rejection code."""

        if not isinstance(nullifier_hex, str) or len(nullifier_hex) != 64:
            return "TYPE_ERROR"
        if nullifier_hex in self._seen:
            return "NULLIFIER_ALREADY_CONSUMED"
        self._seen.add(nullifier_hex)
        return None

    def snapshot(self) -> list[str]:
        return sorted(self._seen)


def compute_nullifier(
    *,
    source_chain: str,
    donation_txid_hex: str,
    donation_vout: int,
) -> str:
    return donation_nullifier_hex(
        source_chain=source_chain,
        donation_txid_hex=donation_txid_hex,
        donation_vout=donation_vout,
    )


def domain_omission_attempt(
    *,
    donation_txid_hex: str,
    donation_vout: int,
) -> str:
    """Illicit nullifier that omits source_chain domain separation.

    Used only as an adversarial fixture input. The verifier must not accept
    this in place of the canonical nullifier.
    """

    from .constants import DOMAIN_NULLIFIER
    from .encoding import domain_hash_hex, require_hex, u32_be

    txid = require_hex("donation_txid_hex", donation_txid_hex, expected_bytes=32)
    # Wrong: omit source_chain part.
    return domain_hash_hex(DOMAIN_NULLIFIER, txid, u32_be(donation_vout))


def detect_collision_pair(n1: str, n2: str) -> str | None:
    if n1 == n2:
        return "NULLIFIER_COLLISION"
    return None


def bulk_consume(nullifiers: Iterable[str]) -> tuple[NullifierSet, list[tuple[str, str | None]]]:
    ns = NullifierSet()
    results = []
    for n in nullifiers:
        results.append((n, ns.consume(n)))
    return ns, results
