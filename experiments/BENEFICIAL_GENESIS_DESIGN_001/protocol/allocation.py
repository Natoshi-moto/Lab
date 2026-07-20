"""Fixed-pool proportional allocation with integer-only arithmetic.

Rule (normative for this design pack):

    allocation_i = floor(fixed_bitcoin_genesis_pool * eligible_satoshis_i
                         / total_eligible_satoshis)

Remainder handling: UNISSUED_FLOOR_REMAINDER
    remainder_unissued = fixed_bitcoin_genesis_pool - sum(allocation_i)
    The remainder is never issued. This is deterministic, uses only integer
    arithmetic, and proves total issuance cannot exceed the fixed pool.

No BTC-to-token exchange rate is defined. Eligible satoshis are weights only.
"""

from __future__ import annotations

from typing import Iterable, Sequence

from .constants import MAX_SATS, PROTOCOL_VERSION
from .encoding import require_hex
from .objects import genesis_allocation_record


class AllocationError(ValueError):
    def __init__(self, code: str, detail: str = "") -> None:
        self.code = code
        super().__init__(detail or code)


def _as_nonneg_int(name: str, value: object) -> int:
    if type(value) is not int:  # reject bool subclasses too
        raise AllocationError("ARITHMETIC_OVERFLOW", f"{name} must be int")
    if value < 0 or value > MAX_SATS:
        raise AllocationError("ARITHMETIC_OVERFLOW", f"{name} out of range")
    return value


def allocate_proportional(
    *,
    fixed_bitcoin_genesis_pool: int,
    eligible_by_nullifier: Sequence[tuple[str, int]],
    epoch_id: str,
) -> dict:
    """Return a canonical GenesisAllocationRecord.

    eligible_by_nullifier: sequence of (nullifier_hex, eligible_sats).
    Duplicate nullifiers are rejected. Zero eligible is rejected.
    """

    pool = _as_nonneg_int("fixed_bitcoin_genesis_pool", fixed_bitcoin_genesis_pool)
    if pool == 0:
        raise AllocationError("ARITHMETIC_OVERFLOW", "pool must be positive")

    seen: set[str] = set()
    cleaned: list[tuple[str, int]] = []
    for nullifier_hex, eligible in eligible_by_nullifier:
        if not isinstance(nullifier_hex, str) or len(nullifier_hex) != 64:
            raise AllocationError("TYPE_ERROR", "nullifier_hex")
        if nullifier_hex in seen:
            raise AllocationError("NULLIFIER_ALREADY_CONSUMED", nullifier_hex)
        seen.add(nullifier_hex)
        e = _as_nonneg_int("eligible_sats", eligible)
        if e <= 0:
            raise AllocationError("AMOUNT_NOT_POSITIVE", nullifier_hex)
        cleaned.append((nullifier_hex, e))

    # Canonical order: nullifier ascending.
    cleaned.sort(key=lambda row: row[0])
    total_eligible = sum(e for _, e in cleaned)
    if total_eligible <= 0 or total_eligible > MAX_SATS:
        raise AllocationError("AMOUNT_NOT_POSITIVE", "total_eligible")

    rows: list[dict] = []
    total_issued = 0
    for nullifier_hex, eligible in cleaned:
        # floor(pool * eligible / total) with overflow-safe check.
        # pool * eligible may exceed 2^64; Python ints are unbounded, but we
        # still reject if either operand exceeds MAX_SATS (already checked) and
        # prove issued sum <= pool after.
        alloc = (pool * eligible) // total_eligible
        total_issued += alloc
        rows.append(
            {
                "allocation": alloc,
                "eligible_sats": eligible,
                "nullifier_hex": nullifier_hex,
            }
        )

    if total_issued > pool:
        raise AllocationError("ALLOCATION_EXCEEDS_POOL")

    remainder = pool - total_issued
    if remainder < 0:
        raise AllocationError("ALLOCATION_EXCEEDS_POOL")

    return genesis_allocation_record(
        epoch_id=epoch_id,
        fixed_bitcoin_genesis_pool=pool,
        claim_rows=rows,
        total_eligible_sats=total_eligible,
        total_issued=total_issued,
        remainder_unissued=remainder,
    )


def assert_supply_invariant(record: dict) -> None:
    required = {"claims", "epoch_id", "fixed_bitcoin_genesis_pool", "remainder_handling",
                "remainder_unissued", "schema", "total_eligible_sats", "total_issued", "version"}
    if not isinstance(record, dict) or set(record) not in (required, required | {"epoch_checkpoint_binding"}):
        raise AllocationError("ALLOCATION_NONCANONICAL", "record shape")
    if record["schema"] != "GenesisAllocationRecord" or record["version"] != PROTOCOL_VERSION:
        raise AllocationError("ALLOCATION_NONCANONICAL", "schema/version")
    if not isinstance(record["epoch_id"], str) or not record["epoch_id"]:
        raise AllocationError("TYPE_ERROR", "epoch_id")
    if record["remainder_handling"] != "UNISSUED_FLOOR_REMAINDER":
        raise AllocationError("ALLOCATION_NONCANONICAL", "remainder handling")
    if "epoch_checkpoint_binding" in record:
        binding = record["epoch_checkpoint_binding"]
        expected_keys = {"accepted_source_tip_header_hash_hex", "accepted_source_tip_height",
                         "last_eligible_inclusion_header_hash_hex", "last_eligible_inclusion_height"}
        if not isinstance(binding, dict) or set(binding) != expected_keys:
            raise AllocationError("ALLOCATION_NONCANONICAL", "checkpoint binding shape")
        for key in ("accepted_source_tip_header_hash_hex", "last_eligible_inclusion_header_hash_hex"):
            try:
                require_hex(key, binding[key], expected_bytes=32)
            except (TypeError, ValueError) as exc:
                raise AllocationError("ALLOCATION_NONCANONICAL", key) from exc
        for key in ("accepted_source_tip_height", "last_eligible_inclusion_height"):
            value = binding[key]
            if type(value) is not int or not 0 <= value <= 0xFFFFFFFF:
                raise AllocationError("ALLOCATION_NONCANONICAL", key)
    pool = _as_nonneg_int("fixed_bitcoin_genesis_pool", record["fixed_bitcoin_genesis_pool"])
    issued = _as_nonneg_int("total_issued", record["total_issued"])
    rem = _as_nonneg_int("remainder_unissued", record["remainder_unissued"])
    total_eligible = _as_nonneg_int("total_eligible_sats", record["total_eligible_sats"])
    claims = record["claims"]
    if not isinstance(claims, list) or not claims or total_eligible == 0:
        raise AllocationError("ALLOCATION_NONCANONICAL", "claims/total")
    nullifiers: list[str] = []
    eligible_sum = 0
    allocation_sum = 0
    for row in claims:
        if not isinstance(row, dict) or set(row) != {"allocation", "eligible_sats", "nullifier_hex"}:
            raise AllocationError("ALLOCATION_NONCANONICAL", "row shape")
        n = row["nullifier_hex"]
        try:
            require_hex("nullifier_hex", n, expected_bytes=32)
        except (TypeError, ValueError) as exc:
            raise AllocationError("TYPE_ERROR", "nullifier_hex") from exc
        if n != n.lower():
            raise AllocationError("TYPE_ERROR", "nullifier_hex lowercase")
        nullifiers.append(n)
        eligible_sum += _as_nonneg_int("eligible_sats", row["eligible_sats"])
        allocation_sum += _as_nonneg_int("allocation", row["allocation"])
    if len(nullifiers) != len(set(nullifiers)) or nullifiers != sorted(nullifiers):
        raise AllocationError("ALLOCATION_NONCANONICAL", "nullifier order/uniqueness")
    if eligible_sum != total_eligible:
        raise AllocationError("ALLOCATION_NONCANONICAL", "eligible sum mismatch")
    if issued + rem != pool:
        raise AllocationError("ALLOCATION_EXCEEDS_POOL", "issued+remainder != pool")
    if issued > pool:
        raise AllocationError("ALLOCATION_EXCEEDS_POOL")
    if allocation_sum != issued:
        raise AllocationError("ALLOCATION_NONCANONICAL", "sum mismatch")
    # Recompute each floor.
    for row in claims:
        expected = (pool * row["eligible_sats"]) // total_eligible
        if row["allocation"] != expected:
            raise AllocationError("ALLOCATION_NONCANONICAL", row["nullifier_hex"])


def try_overflow_attack_vectors() -> list[dict]:
    """Return descriptive results for known arithmetic attack attempts."""

    results = []
    # Product that would overflow uint64 if naively multiplied in fixed width.
    big = MAX_SATS
    try:
        rec = allocate_proportional(
            fixed_bitcoin_genesis_pool=big,
            eligible_by_nullifier=[
                ("aa" * 32, big),
                ("bb" * 32, 1),
            ],
            epoch_id="epoch-overflow-test",
        )
        assert_supply_invariant(rec)
        results.append({"case": "large_product_floor", "ok": True, "issued": rec["total_issued"]})
    except AllocationError as exc:
        results.append({"case": "large_product_floor", "ok": False, "code": exc.code})

    # Negative / bool / float rejections.
    for label, kwargs in [
        ("negative_pool", {"fixed_bitcoin_genesis_pool": -1, "eligible_by_nullifier": [("aa" * 32, 1)], "epoch_id": "e"}),
        ("bool_eligible", {"fixed_bitcoin_genesis_pool": 100, "eligible_by_nullifier": [("aa" * 32, True)], "epoch_id": "e"}),  # type: ignore[list-item]
        ("float_eligible", {"fixed_bitcoin_genesis_pool": 100, "eligible_by_nullifier": [("aa" * 32, 1.5)], "epoch_id": "e"}),  # type: ignore[list-item]
    ]:
        try:
            allocate_proportional(**kwargs)  # type: ignore[arg-type]
            results.append({"case": label, "ok": False, "note": "should have rejected"})
        except (AllocationError, TypeError, ValueError) as exc:
            code = getattr(exc, "code", type(exc).__name__)
            results.append({"case": label, "ok": True, "rejected_as": code})

    return results


def sum_allocations(records: Iterable[dict]) -> int:
    return sum(int(r["allocation"]) for r in records)
