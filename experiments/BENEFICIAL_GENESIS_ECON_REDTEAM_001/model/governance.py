"""Governance-weight models under explicit, named ledger-integration rules.

Repair note (E-003 / BGEN-ECON-REV-003): the original package treated
governance weight as proportional to economic allocation "absent an
explicit design decision otherwise," and its capping helper claimed to
renormalize but did not (BGEN-ECON-REV-005). Beneficial Genesis, as
specified in ``experiments/BENEFICIAL_GENESIS_DESIGN_001``, is an initial
*allocation* mechanism; it does not itself specify how (or whether)
economic allocation becomes governance weight on the eventual new ledger.
That mapping is a separate, currently unspecified integration choice.

This module makes every governance-capture finding conditional on one of
five explicitly named rules, so no result is reported as "the" governance
outcome without saying which rule produced it. Weights are returned as
exact ``Fraction`` shares summing to 1 among holders with positive weight
(or 0 if none), since a capped-and-renormalized rule has no natural
"pool units" analogue.
"""

from __future__ import annotations

from fractions import Fraction
from typing import Any, Mapping

GOVERNANCE_RULES = (
    "none",
    "nontransferable_equal",
    "nontransferable_proportional",
    "token_weighted",
    "continuously_capped",
)


def governance_weights(
    economic_allocation: Mapping[str, int],
    rule: str,
    cap_bps: int | None = None,
) -> dict[str, Any]:
    """Compute governance weight shares under a named integration rule.

    - ``none``: no governance rights derive from allocation at all.
    - ``nontransferable_equal``: one equal vote per recipient with a
      positive allocation, frozen at genesis, independent of donation
      size, and not tradeable afterwards.
    - ``nontransferable_proportional``: weight proportional to allocation,
      fixed at genesis and not affected by any later transfer of the
      underlying economic token.
    - ``token_weighted``: numerically identical to
      ``nontransferable_proportional`` at the moment of computation, but
      labelled *transferable* — voting power moves with the token, so it
      is not durable across a secondary market the way the nontransferable
      rules are. The distinction is about durability, not the snapshot
      arithmetic (see ``NONCLAIMS_AND_OPEN_QUESTIONS.md``).
    - ``continuously_capped``: each holder's raw proportional weight is
      truncated at ``cap_bps`` (basis points of the pre-cap total), then
      the capped weights are renormalized to sum to 1.

    Returns a dict with ``weights`` (Fraction shares), ``rule``,
    ``transferable`` (bool), and ``notes``.
    """
    if rule not in GOVERNANCE_RULES:
        raise ValueError(f"unknown governance rule: {rule}")

    recipients = {k: v for k, v in economic_allocation.items() if v > 0}
    issued = sum(recipients.values())

    if rule == "none":
        return _pack(rule, {k: Fraction(0) for k in economic_allocation}, transferable=False,
                     notes=["no governance rights derive from allocation under this rule"])

    if rule == "nontransferable_equal":
        n = len(recipients)
        if n == 0:
            return _pack(rule, {}, transferable=False, notes=["no recipients; no votes"])
        w = Fraction(1, n)
        weights = {k: w for k in recipients}
        return _pack(
            rule,
            weights,
            transferable=False,
            notes=["one equal vote per recipient, independent of donation size, frozen at genesis"],
        )

    if rule in ("nontransferable_proportional", "token_weighted"):
        if issued == 0:
            weights = {k: Fraction(0) for k in recipients}
        else:
            weights = {k: Fraction(v, issued) for k, v in recipients.items()}
        transferable = rule == "token_weighted"
        return _pack(
            rule,
            weights,
            transferable=transferable,
            notes=[
                "weight proportional to allocation units",
                "transferable: voting power moves with the token on any secondary market"
                if transferable
                else "nontransferable: weight is fixed at genesis regardless of later token transfers",
            ],
        )

    if rule == "continuously_capped":
        if cap_bps is None:
            raise ValueError("continuously_capped requires cap_bps")
        if not 0 < cap_bps <= 10_000:
            raise ValueError("cap_bps must be in (0, 10000]")
        cap_fraction = Fraction(cap_bps, 10_000)
        if issued == 0:
            return _pack(rule, {}, transferable=False, notes=["nothing issued"])
        raw = {k: Fraction(v, issued) for k, v in recipients.items()}
        capped = {k: min(v, cap_fraction) for k, v in raw.items()}
        capped_sum = sum(capped.values())
        if capped_sum == 0:
            weights = {k: Fraction(0) for k in capped}
        else:
            weights = {k: v / capped_sum for k, v in capped.items()}
        truncated_holders = [k for k, v in raw.items() if v > cap_fraction]
        notes = [
            f"cap_bps={cap_bps} ({cap_fraction} of pre-cap issued weight)",
            "capped weights are renormalized so total governance weight sums to 1",
            "known property: when the capped total is well under 1 (several holders "
            "simultaneously truncated), renormalization can push an individual holder's "
            "final weight above the nominal per-identity cap fraction; this is disclosed, "
            "not hidden, and is a documented limitation of cap-then-renormalize schemes",
        ]
        return _pack(
            rule,
            weights,
            transferable=False,
            notes=notes,
            raw_proportional=raw,
            pre_normalization_capped=capped,
            truncated_holders=truncated_holders,
        )

    raise ValueError(rule)


def _pack(
    rule: str,
    weights: dict[str, Fraction],
    *,
    transferable: bool,
    notes: list[str],
    **extra: Any,
) -> dict[str, Any]:
    return {
        "rule": rule,
        "transferable": transferable,
        "weights": weights,
        "weight_sum": sum(weights.values()) if weights else Fraction(0),
        "notes": notes,
        **extra,
    }


def majority_threshold_control(
    weights: Mapping[str, Fraction], *, thresholds: tuple[Fraction, ...] = (Fraction(1, 2), Fraction(1, 3))
) -> dict[str, Any]:
    """Report the maximum single-holder governance share and whether it
    crosses each of the given control thresholds (default: simple majority
    and blocking third).
    """
    if not weights:
        return {
            "max_holder_share": "0",
            "max_holder": None,
            "crosses": {str(t): False for t in thresholds},
        }
    items = sorted(weights.items(), key=lambda kv: (-kv[1], kv[0]))
    max_holder, max_share = items[0]
    return {
        "max_holder_share": str(max_share),
        "max_holder": max_holder,
        "crosses": {str(t): max_share > t for t in thresholds},
    }
