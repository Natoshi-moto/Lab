"""Governance weight models conditional on ledger integration rules.

Addresses BGEN-ECON-REV-003:

Beneficial Genesis is an initial allocation mechanism. It does not itself
establish that economic allocation becomes governance weight. Capture risk is
conditional on a specified integration rule.
"""

from __future__ import annotations

from typing import Any, Sequence


GOVERNANCE_RULES = (
    "none",
    "nontransferable_equal",
    "nontransferable_proportional",
    "token_weighted",
    "continuously_capped",
    "delegated_capped",
)


def governance_weights(
    *,
    allocations: Sequence[dict[str, Any]],
    rule: str = "none",
    cap_fraction_of_issued: float = 0.05,
    delegates: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Compute governance weights under an explicit integration rule.

    For continuously_capped: each identity's raw proportional weight is capped at
    cap_fraction_of_issued of *pre-cap* total, then **renormalized** so weights sum
    to 1.0 among holders with positive weight (or 0 if none).
    """
    if rule not in GOVERNANCE_RULES:
        raise ValueError(f"unknown governance rule: {rule}")

    rows = list(allocations)
    issued = sum(int(a["allocation"]) for a in rows)
    n = len(rows)

    if rule == "none":
        weights = {a["donor_id"]: 0.0 for a in rows}
        return _pack(rule, weights, issued, notes=["no governance rights from allocation"])

    if rule == "nontransferable_equal":
        if n == 0:
            return _pack(rule, {}, issued, notes=["empty"])
        w = 1.0 / n
        weights = {a["donor_id"]: w for a in rows}
        return _pack(
            rule,
            weights,
            issued,
            notes=["one equal nontransferable vote per recipient; not proportional to donation"],
        )

    if rule in ("nontransferable_proportional", "token_weighted"):
        if issued == 0:
            weights = {a["donor_id"]: 0.0 for a in rows}
        else:
            weights = {a["donor_id"]: int(a["allocation"]) / issued for a in rows}
        return _pack(
            rule,
            weights,
            issued,
            notes=[
                "proportional to allocation units",
                "token_weighted implies transferability of voting power with tokens"
                if rule == "token_weighted"
                else "nontransferable_proportional freezes weights at genesis",
            ],
        )

    if rule == "continuously_capped":
        if not 0.0 < cap_fraction_of_issued <= 1.0:
            raise ValueError("cap_fraction_of_issued in (0,1]")
        if issued == 0:
            weights = {a["donor_id"]: 0.0 for a in rows}
            return _pack(rule, weights, issued, notes=["nothing issued"])
        raw = {a["donor_id"]: int(a["allocation"]) / issued for a in rows}
        capped = {k: min(v, cap_fraction_of_issued) for k, v in raw.items()}
        s = sum(capped.values())
        if s == 0:
            weights = {k: 0.0 for k in capped}
        else:
            # Explicit renormalization after cap (REV-005 alignment).
            weights = {k: v / s for k, v in capped.items()}
        return _pack(
            rule,
            weights,
            issued,
            notes=[
                f"cap_fraction_of_issued={cap_fraction_of_issued}",
                "capped weights are renormalized to sum to 1.0",
                "cap is continuous on weight, not a one-time soft suggestion",
            ],
            pre_norm_capped=capped,
            raw_proportional=raw,
        )

    if rule == "delegated_capped":
        # Start from continuously capped, then sum into delegates.
        base = governance_weights(
            allocations=rows,
            rule="continuously_capped",
            cap_fraction_of_issued=cap_fraction_of_issued,
        )
        delegates = delegates or {}
        agg: dict[str, float] = {}
        for donor_id, w in base["weights"].items():
            target = delegates.get(donor_id, donor_id)
            agg[target] = agg.get(target, 0.0) + w
        return _pack(
            rule,
            agg,
            issued,
            notes=[
                "delegated then continuously capped base weights",
                f"cap_fraction_of_issued={cap_fraction_of_issued}",
            ],
        )

    raise ValueError(rule)


def _pack(
    rule: str,
    weights: dict[str, float],
    issued: int,
    notes: list[str],
    **extra: Any,
) -> dict[str, Any]:
    return {
        "rule": rule,
        "weights": weights,
        "weight_sum": sum(weights.values()),
        "total_issued_units": issued,
        "notes": notes,
        **extra,
    }


def majority_threshold_control(
    weights: dict[str, float],
    *,
    threshold: float = 0.5,
) -> dict[str, Any]:
    """Identify whether any single actor meets a control threshold."""
    if not weights:
        return {
            "threshold": threshold,
            "any_single_actor_controls": False,
            "controllers": [],
            "max_weight": 0.0,
            "max_actor": None,
        }
    items = sorted(weights.items(), key=lambda kv: (-kv[1], kv[0]))
    controllers = [k for k, v in items if v > threshold]
    max_actor, max_w = items[0]
    return {
        "threshold": threshold,
        "any_single_actor_controls": len(controllers) > 0,
        "controllers": controllers,
        "max_weight": max_w,
        "max_actor": max_actor,
        "top3": items[:3],
    }
