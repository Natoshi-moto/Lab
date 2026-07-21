"""Scenario runner composing allocation, metrics, rebate, laundering, governance."""

from __future__ import annotations

from typing import Any

from .allocation import DEFAULT_POOL, allocate, prove_concave_sybil_gain, prove_split_invariance_pro_rata
from .governance import governance_weights, majority_threshold_control
from .laundering import laundering_economics, laundering_sensitivity_grid
from .metrics import concentration_report
from .rebate import conditional_rebate_outcome, rebate_rate_sweep


def _implied_token_sats_per_unit(pool: int, total_eligible: int) -> float:
    """Floating implied exchange: sats of eligible weight per issued unit face.

    Under pro-rata, allocation_i ≈ pool * e_i / T, so e_i / allocation_i ≈ T / pool.
    The implied "sats contributed per unit received" is T/pool when issued ~ pool.
    Token *value* is not determined by this ratio; it is an external assumption.
    """
    if pool <= 0:
        return 0.0
    return float(total_eligible) / float(pool)


def run_scenario(spec: dict[str, Any]) -> dict[str, Any]:
    """Execute one scenario manifest and return a machine-readable result."""
    sid = spec["id"]
    pool = int(spec.get("pool", DEFAULT_POOL))
    rule = spec.get("allocation_rule", "pro_rata")
    contributions = spec["contributions"]

    alloc = allocate(
        pool=pool,
        contributions=contributions,
        rule=rule,
        cap_sats_per_identity=spec.get("cap_sats_per_identity"),
        lottery_seed=int(spec.get("lottery_seed", 0)),
        lottery_winner_slots=spec.get("lottery_winner_slots"),
    )

    conc = concentration_report(
        alloc["allocations"],
        pool=alloc["pool"],
        total_issued=alloc["total_issued"],
    )

    # Denominator / floating implied ratio (neutral wording; not a legal classification).
    implied_ratio = _implied_token_sats_per_unit(pool, alloc["total_eligible_sats"])
    denominator = {
        "fixed_pool": pool,
        "total_eligible_sats": alloc["total_eligible_sats"],
        "total_issued": alloc["total_issued"],
        "remainder_unissued": alloc["remainder_unissued"],
        "fixed_pool_floating_implied_exchange_ratio_sats_per_unit": implied_ratio,
        "ratio_note": (
            "This is the model-implied eligible-sats weight per unit face under "
            "full issuance approximation (T/pool). It is not a promised redemption "
            "rate, market price, or legal classification."
        ),
        "undersubscribed": alloc["total_eligible_sats"] < pool,
        "oversubscribed": alloc["total_eligible_sats"] > pool,
    }

    # Governance comparisons (always multi-rule; capture is conditional).
    gov_rules = spec.get(
        "governance_rules",
        [
            "none",
            "nontransferable_equal",
            "nontransferable_proportional",
            "token_weighted",
            "continuously_capped",
        ],
    )
    gov_out = {}
    for gr in gov_rules:
        gw = governance_weights(
            allocations=alloc["allocations"],
            rule=gr,
            cap_fraction_of_issued=float(spec.get("gov_cap_fraction", 0.05)),
            delegates=spec.get("delegates"),
        )
        maj = majority_threshold_control(gw["weights"], threshold=float(spec.get("gov_threshold", 0.5)))
        gov_out[gr] = {"weights_summary": _weight_summary(gw["weights"]), "majority": maj, "notes": gw["notes"]}

    # Rebate block (optional).
    rebate_out = None
    if "rebate" in spec:
        rb = spec["rebate"]
        rebate_out = conditional_rebate_outcome(
            donations_by_charity=rb["donations_by_charity"],
            access_probability=float(rb.get("access_probability", 0.0)),
            arrangement_cost_sats=float(rb.get("arrangement_cost_sats", 0.0)),
            enforcement_probability=float(rb.get("enforcement_probability", 1.0)),
            detection_probability=float(rb.get("detection_probability", 0.0)),
            detection_loss_fraction=float(rb.get("detection_loss_fraction", 0.5)),
            rebate_rate_if_colluding=float(rb.get("rebate_rate_if_colluding", 0.0)),
        )
        if rb.get("include_rate_sweep"):
            rebate_out["rate_sweep"] = rebate_rate_sweep(
                int(rb.get("sweep_donated_sats", 1_000_000)),
                [0.0, 0.25, 0.5, 0.75, 1.0],
            )

    # Laundering block (optional).
    launder_out = None
    if "laundering" in spec:
        ln = spec["laundering"]
        attacker_id = ln["attacker_donor_id"]
        row = next(a for a in alloc["allocations"] if a["donor_id"] == attacker_id)
        # Default token value assumption: 1.0 means modeler sets unit EV equal to 1 sat
        # of source value — pure assumption, not a prediction.
        token_mult = float(ln.get("token_value_per_unit_in_sats", 1.0))
        launder_out = laundering_economics(
            donated_sats=int(row["eligible_sats"]),
            allocation_units=int(row["allocation"]),
            token_value_per_unit_in_sats=token_mult,
            legal_cost_basis_sats=float(ln.get("legal_cost_basis_sats", 0.0)),
            alternative_realization_fraction=float(ln.get("alternative_realization_fraction", 0.7)),
            seizure_probability_if_spend_source=float(ln.get("seizure_probability_if_spend_source", 0.3)),
            seizure_probability_if_migrate=float(ln.get("seizure_probability_if_migrate", 0.2)),
            liquidation_haircut_on_token=float(ln.get("liquidation_haircut_on_token", 0.15)),
            lockup_months=float(ln.get("lockup_months", 0.0)),
            monthly_discount_rate=float(ln.get("monthly_discount_rate", 0.01)),
            transaction_risk_cost_sats=float(ln.get("transaction_risk_cost_sats", 0.0)),
        )
        if ln.get("include_sensitivity"):
            # Map multipliers relative to donated face / allocation for readability.
            launder_out["sensitivity"] = laundering_sensitivity_grid(
                donated_sats=int(row["eligible_sats"]),
                allocation_units=int(row["allocation"]),
                token_multipliers=list(ln.get("token_multipliers", [0.1, 0.5, 1.0, 2.0])),
                opportunity_fractions=list(ln.get("opportunity_fractions", [0.2, 0.5, 0.7, 1.0])),
            )

    # Sybil probes (optional flags).
    probes = {}
    if spec.get("probe_split_invariance"):
        probes["pro_rata_split"] = prove_split_invariance_pro_rata(
            pool, list(spec.get("split_parts", [100, 200, 300]))
        )
    if spec.get("probe_concave_sybil"):
        probes["concave_sybil"] = prove_concave_sybil_gain(
            pool,
            int(spec.get("sybil_sats", 10_000)),
            int(spec.get("sybil_splits", 10)),
        )

    # Donor utility under declared assumptions only.
    donor_economics = _donor_economics(alloc, spec)

    return {
        "id": sid,
        "title": spec.get("title", sid),
        "allocation": alloc,
        "concentration": conc,
        "denominator": denominator,
        "governance": gov_out,
        "rebate": rebate_out,
        "laundering": launder_out,
        "probes": probes,
        "donor_economics": donor_economics,
        "failure_condition_flags": _fc_flags(alloc, gov_out, rebate_out, launder_out, spec),
        "evidence_class": "deterministic_synthetic_simulation",
        "nonclaims": [
            "not empirical prediction",
            "not market price forecast",
            "not legal conclusion",
            "not live funds",
        ],
    }


def _weight_summary(weights: dict[str, float]) -> dict[str, Any]:
    if not weights:
        return {"n": 0, "max": 0.0, "max_id": None}
    mid, mw = max(weights.items(), key=lambda kv: (kv[1], kv[0]))
    return {"n": len(weights), "max": mw, "max_id": mid, "sum": sum(weights.values())}


def _donor_economics(alloc: dict[str, Any], spec: dict[str, Any]) -> list[dict[str, Any]]:
    """Simple utility: u = token_value * units - donated_sats + rebate_received.

    token_value_per_unit_in_sats is a declared assumption from the scenario.
    """
    tv = float(spec.get("token_value_per_unit_in_sats", 1.0))
    rebate_by_donor = spec.get("rebate_by_donor", {})
    out = []
    for a in alloc["allocations"]:
        rebate = float(rebate_by_donor.get(a["donor_id"], 0.0))
        donated = float(a["eligible_sats"])
        units = float(a["allocation"])
        u = tv * units - donated + rebate
        out.append(
            {
                "donor_id": a["donor_id"],
                "donated_sats": donated,
                "allocation_units": units,
                "assumed_token_value_per_unit_in_sats": tv,
                "rebate_received_sats": rebate,
                "utility_sats_equivalent": u,
                "note": "utility under declared token-value assumption only",
            }
        )
    return out


def _fc_flags(
    alloc: dict[str, Any],
    gov_out: dict[str, Any],
    rebate_out: dict[str, Any] | None,
    launder_out: dict[str, Any] | None,
    spec: dict[str, Any],
) -> dict[str, Any]:
    """Map observations to issue #34 failure-condition *flags* (not automatic verdicts)."""
    # FC-3 only if proportional/token-weighted governance is the *specified* integration
    # under test AND a single actor controls majority.
    gov_rule_under_test = spec.get("governance_rule_under_test", "none")
    fc3 = False
    fc3_note = "FC-3 not charged against allocation mechanism alone"
    if gov_rule_under_test in ("token_weighted", "nontransferable_proportional"):
        maj = gov_out.get(gov_rule_under_test, {}).get("majority", {})
        fc3 = bool(maj.get("any_single_actor_controls"))
        fc3_note = (
            f"conditional on integration rule={gov_rule_under_test}; "
            f"controls={maj.get('controllers')}"
        )

    fc2 = False
    fc2_note = "rebate destruction not claimed as unconditional behavioral prediction"
    if rebate_out is not None:
        # Only flag if scenario asserts high-access zero-friction and high rates.
        exp = rebate_out["expected_with_frictions"]
        cond = rebate_out["conditional"]
        donated = float(rebate_out["total_donated_sats"])
        if (
            exp["access_probability_default"] >= 0.99
            and exp["detection_probability"] <= 0.01
            and donated > 0
            and cond["total_rebate_sats"] / donated >= 0.5
        ):
            fc2 = True
            fc2_note = "triggered only under high-access, low-detection, high-rate assumptions"

    fc4 = False
    fc4_note = "laundering pathway exists but profitable laundering not unconditionally proven"
    if launder_out is not None:
        if launder_out["interpretation"]["profitable_under_these_assumptions"]:
            fc4 = True
            fc4_note = "profitable under the scenario's stated opportunity/token assumptions"
        # Pathway always exists as cryptographic fact of the design residual.
        fc4_note += "; pathway_exists=true regardless of net profit"

    return {
        "FC1_token_necessity_unresolved": True,  # always open until ledger functions fixed
        "FC2_rebate_destroys_charity_benefit": {
            "flagged": fc2,
            "note": fc2_note,
            "conditional_arithmetic_reduction": True if rebate_out else None,
        },
        "FC3_governance_capture_by_donation": {
            "flagged": fc3,
            "note": fc3_note,
            "rule_under_test": gov_rule_under_test,
        },
        "FC4_stolen_fund_incentive": {
            "flagged": fc4,
            "note": fc4_note,
        },
        "FC5_timing_privileged_allocation": {
            "flagged": bool(spec.get("timing_game_present", False)),
            "note": spec.get(
                "timing_note",
                "cutoff is deterministic given tip; miner influence on cutoff is residual",
            ),
        },
        "FC6_identity_dependency": {
            "flagged": alloc["rule"] in ("capped_pro_rata", "concave_sqrt", "concave_log")
            and not spec.get("identity_layer", False),
            "note": "caps/concavity without identity layer are Sybil-exploitable",
        },
        "FC7_dominated_by_simpler_mechanism": {
            "flagged": None,
            "note": "policy comparison; see MECHANISM_NECESSITY.md — not auto-decided here",
        },
    }
