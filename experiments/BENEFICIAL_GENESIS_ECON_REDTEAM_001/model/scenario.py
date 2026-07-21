"""Scenario runner: turns a JSON manifest into a deterministic result dict.

A manifest describes a donor population (explicit or generated), an
allocation scheme, and zero or more adversarial "probes". The runner never
consults external data, wall-clock time, or unseeded randomness.

Repair history (BGEN-ECON-REPAIR-002, issue #38, E-001..E-009): see
FAILURE_CONDITIONS.md and CROSS_MODEL_COMPARISON.md for the full record.
Summary of behavioral changes from the original BGEN-ECON-REDTEAM-001
submission (PR #35 @ b588779):

- stolen-key donations now report a decomposed net-migration-profit
  estimate (model/tainted_funds.py) instead of an unconditional
  zero-cost "laundering_gain" (E-001);
- rebates report both the conditional (arrangement-exists) arithmetic and
  an access/enforcement/detection-frictions expected view
  (model/collusion.py), and no longer claim a predictable aggregate
  behavioral outcome (E-002);
- governance analysis is computed only when a scenario explicitly opts in
  via ``governance_rules``, under named rules with explicit transferability
  and renormalization semantics (model/governance.py), instead of
  defaulting every scenario to proportional governance (E-003);
- concentration reporting distinguishes share-of-pool from
  share-of-issued throughout (model/metrics.py) (E-005);
- duplicate donor identifiers are rejected rather than silently
  colliding (E-005).
"""

from __future__ import annotations

import random
from fractions import Fraction
from typing import Any

from . import allocation as alloc
from . import collusion
from . import governance as gov
from . import metrics
from . import population as pop
from . import tainted_funds


def _fr(x: str | float | int) -> Fraction:
    if isinstance(x, str):
        return Fraction(x)
    if isinstance(x, float):
        return Fraction(x).limit_denominator(1_000_000)
    return Fraction(x)


def _build_donors(manifest: dict[str, Any], rng: random.Random) -> list[dict[str, Any]]:
    donors: list[dict[str, Any]] = list(manifest.get("donors", []))
    for gen in manifest.get("generators", []):
        kind = gen["kind"]
        if kind == "small_donors":
            donors.extend(
                pop.generate_small_donors(
                    rng,
                    count=gen["count"],
                    sats_min=gen["sats_min"],
                    sats_max=gen["sats_max"],
                    id_prefix=gen.get("id_prefix", "small"),
                    group=gen.get("group"),
                    block=gen.get("block", 0),
                )
            )
        else:
            raise ValueError(f"unknown generator kind: {kind}")
    for probe in manifest.get("split_identity_probes", []):
        target_id = probe["donor_id"]
        target = next(d for d in donors if d["id"] == target_id)
        donors.remove(target)
        donors.extend(pop.split_identity(target, probe["into"]))
    for donor in donors:
        donor.setdefault("rebate_rate", 0)
        donor.setdefault("colluding_arrangement_exists", _fr(donor.get("rebate_rate", 0)) > 0)
        donor.setdefault("stolen", False)
        donor.setdefault("block", 0)
        donor.setdefault("group", donor["id"])

    # E-005: fail closed on duplicate donor identifiers instead of letting
    # later dict/lookup construction silently drop or misattribute one.
    seen: set[str] = set()
    for donor in donors:
        if donor["id"] in seen:
            raise ValueError(f"duplicate donor_id in scenario population: {donor['id']!r}")
        seen.add(donor["id"])

    return donors


def _lockup_discount(months: int) -> Fraction:
    """Illiquidity/opportunity-cost discount applied to gross token value
    for a holder who cannot transfer for ``months``. Purely an assumed
    modelling parameter (documented in FORMAL_MODEL.md), never an
    empirical price forecast: 7% per locked month, capped at 70%.
    """
    pct = min(months * 7, 70)
    return Fraction(100 - pct, 100)


def _group_totals(per_donor: dict[str, int], donors: list[dict[str, Any]]) -> dict[str, int]:
    group_of = {d["id"]: d.get("group", d["id"]) for d in donors}
    totals: dict[str, int] = {}
    for donor_id, value in per_donor.items():
        g = group_of.get(donor_id, donor_id)
        totals[g] = totals.get(g, 0) + value
    return totals


def _concentration_block(allocation: dict[str, int], pool: int, donors: list[dict[str, Any]]) -> dict[str, Any]:
    grouped = _group_totals(allocation, donors)
    total_issued = sum(allocation.values())
    grouped_issued = sum(grouped.values())
    return {
        "by_account": {
            "holder_count": len(allocation),
            "total_issued": total_issued,
            "gini_of_issued": str(metrics.gini(allocation)),
            "hhi_of_issued": str(metrics.hhi(allocation)),
            "top1_share_of_issued": str(metrics.top_n_share_of_issued(allocation, 1)),
            "top1_share_of_pool": str(metrics.top_n_share_of_pool(allocation, pool, 1)),
            "top10_share_of_issued": str(metrics.top_n_share_of_issued(allocation, 10)),
            "top10_share_of_pool": str(metrics.top_n_share_of_pool(allocation, pool, 10)),
        },
        "by_beneficial_owner": {
            "owner_count": len(grouped),
            "total_issued": grouped_issued,
            "gini_of_issued": str(metrics.gini(grouped)),
            "hhi_of_issued": str(metrics.hhi(grouped)),
            "top1_share_of_issued": str(metrics.top_n_share_of_issued(grouped, 1)),
            "top1_share_of_pool": str(metrics.top_n_share_of_pool(grouped, pool, 1)),
            "top10_share_of_issued": str(metrics.top_n_share_of_issued(grouped, 10)),
            "top10_share_of_pool": str(metrics.top_n_share_of_pool(grouped, pool, 10)),
        },
        "denominator_note": (
            "*_of_issued divides by the actually issued total; *_of_pool divides by the "
            "fixed pool and also reflects any unissued remainder. Gini/HHI are defined "
            "over the issued distribution only. Do not mix the two denominators."
        ),
    }


def _governance_block(allocation: dict[str, int], donors: list[dict[str, Any]], rule_requests: list[dict[str, Any]]) -> dict[str, Any]:
    grouped = _group_totals(allocation, donors)
    out: dict[str, Any] = {}
    for req in rule_requests:
        rule = req["rule"]
        cap_bps = req.get("cap_bps")
        weights = gov.governance_weights(grouped, rule, cap_bps=cap_bps)
        control = gov.majority_threshold_control(weights["weights"])
        entry = {
            "rule": weights["rule"],
            "transferable": weights["transferable"],
            "notes": weights["notes"],
            "gini_of_weights": str(metrics.gini(weights["weights"])) if weights["weights"] else "0",
            "hhi_of_weights": str(metrics.hhi(weights["weights"])) if weights["weights"] else "0",
            "max_holder_share": control["max_holder_share"],
            "max_holder": control["max_holder"],
            "crosses_simple_majority": control["crosses"].get(str(Fraction(1, 2)), False),
            "crosses_blocking_third": control["crosses"].get(str(Fraction(1, 3)), False),
        }
        if rule == "cap_then_renormalize":
            # Report all three stages explicitly (micro-repair item 2): this
            # is a cap-THEN-renormalize rule, not a hard final per-holder
            # cap, and renormalization can push a holder's final weight
            # back above the nominal cap fraction.
            entry["raw_proportional_weights"] = {
                k: str(v) for k, v in weights["raw_proportional_weights"].items()
            }
            entry["pre_normalization_clipped_weights"] = {
                k: str(v) for k, v in weights["pre_normalization_clipped_weights"].items()
            }
            entry["final_normalized_weights"] = {k: str(v) for k, v in weights["weights"].items()}
            entry["clipped_holders"] = weights["clipped_holders"]
            entry["holders_exceeding_nominal_cap_after_renormalization"] = weights[
                "holders_exceeding_nominal_cap_after_renormalization"
            ]
        out[rule if cap_bps is None else f"{rule}_{cap_bps}bps"] = entry
    return out


def run_scenario(manifest: dict[str, Any]) -> dict[str, Any]:
    rng = random.Random(manifest["seed"])
    donors = _build_donors(manifest, rng)
    pool = manifest["pool_units"]
    scheme_name = manifest["allocation_scheme"]
    scheme_params = dict(manifest.get("scheme_params", {}))

    weight_pairs = [(d["id"], d["sats"]) for d in donors]
    total_eligible = sum(w for _, w in weight_pairs)

    if type(pool) is not int or pool < 0:
        raise alloc.ParticipantValidationError(
            f"pool_units must be a non-negative int, got {pool!r}"
        )

    if scheme_name == "NO_TOKEN":
        allocation = {donor_id: 0 for donor_id, _ in weight_pairs}
    elif scheme_name == "RANDOM_LOTTERY_COMPONENT":
        allocation = alloc.random_lottery_component(weight_pairs, pool, rng, **scheme_params)
    elif scheme_name == "TIME_WEIGHTED":
        donor_blocks = {d["id"]: d.get("block", 0) for d in donors}
        allocation = alloc.time_weighted(weight_pairs, pool, donor_blocks=donor_blocks, **scheme_params)
    else:
        if scheme_name not in alloc.SCHEMES:
            raise ValueError(f"unknown allocation scheme: {scheme_name!r}")
        allocation = alloc.SCHEMES[scheme_name](weight_pairs, pool, **scheme_params)

    # R1 / TRIB-F-001: refuse any result that leaves the closed interval [0, pool].
    alloc.enforce_supply_invariant(allocation, pool)
    unissued = metrics.unissued_remainder(allocation, pool)
    if unissued < 0:
        raise alloc.ParticipantValidationError(
            f"supply invariant violated: unissued_remainder={unissued} is negative"
        )
    concentration = _concentration_block(allocation, pool, donors)

    governance_block = None
    governance_rules = manifest.get("governance_rules")
    if governance_rules:
        governance_block = _governance_block(allocation, donors, governance_rules)

    named_donor_ids = {d["id"] for d in manifest.get("donors", [])}
    for probe in manifest.get("split_identity_probes", []):
        named_donor_ids.discard(probe["donor_id"])
        named_donor_ids.update(d["id"] for d in donors if d.get("group") == probe["donor_id"])

    baseline_price = Fraction(total_eligible, pool) if pool > 0 else Fraction(0)
    donor_economics = {}
    for multiplier in manifest.get("token_value_multipliers", [1.0]):
        m = _fr(multiplier)
        token_value_per_unit = m * baseline_price
        per_multiplier = {}
        summary_utilities = []
        for donor_id, sats in weight_pairs:
            donor = next(d for d in donors if d["id"] == donor_id)
            rebate_rate = _fr(donor.get("rebate_rate", 0))
            rebate_received = rebate_rate * sats
            net_cost = Fraction(sats) - rebate_received
            gross_value = token_value_per_unit * allocation.get(donor_id, 0)
            discount = _lockup_discount(manifest.get("lockup_months", 0))
            liquid_value = gross_value * discount
            utility = liquid_value - net_cost
            summary_utilities.append(utility)
            if len(weight_pairs) <= 64 or donor_id in named_donor_ids:
                per_multiplier[donor_id] = {
                    "net_cost": str(net_cost),
                    "gross_token_value": str(gross_value),
                    "liquid_token_value": str(liquid_value),
                    "utility": str(utility),
                }
        donor_economics[str(multiplier)] = {
            "token_value_per_unit": str(token_value_per_unit),
            "per_donor": per_multiplier if per_multiplier else "omitted_for_large_population",
            "mean_utility": str(sum(summary_utilities, Fraction(0)) / len(summary_utilities))
            if summary_utilities
            else "0",
            "profitable_donor_count": sum(1 for u in summary_utilities if u > 0),
            "unprofitable_donor_count": sum(1 for u in summary_utilities if u < 0),
        }

    attack_analysis: dict[str, Any] = {}

    rebate_probe_donors = [d for d in donors if _fr(d.get("rebate_rate", 0)) > 0]
    if rebate_probe_donors:
        friction_defaults = manifest.get("rebate_friction_assumptions", {})
        rows = {}
        for d in rebate_probe_donors:
            params = {
                "access_probability": _fr(d.get("access_probability", friction_defaults.get("access_probability", 1))),
                "arrangement_cost_sats": _fr(d.get("arrangement_cost_sats", friction_defaults.get("arrangement_cost_sats", 0))),
                "enforcement_probability": _fr(d.get("enforcement_probability", friction_defaults.get("enforcement_probability", 1))),
                "detection_probability": _fr(d.get("detection_probability", friction_defaults.get("detection_probability", 0))),
                "detection_loss_fraction": _fr(d.get("detection_loss_fraction", friction_defaults.get("detection_loss_fraction", "1/2"))),
            }
            rows[d["id"]] = collusion.conditional_and_expected_rebate(
                donated_sats=d["sats"],
                rebate_rate=_fr(d["rebate_rate"]),
                colluding_arrangement_exists=bool(d.get("colluding_arrangement_exists", True)),
                **params,
            )
        attack_analysis["rebate_and_collusion"] = rows

    stolen_donors = [d for d in donors if d.get("stolen")]
    if stolen_donors:
        m = _fr(manifest.get("token_value_multipliers", [1.0])[0])
        token_value_per_unit = m * baseline_price
        tf_defaults = manifest.get("tainted_fund_assumptions", {})
        rows = {}
        for d in stolen_donors:
            kwargs: dict[str, Any] = {
                "donated_sats": d["sats"],
                "allocation_units": allocation.get(d["id"], 0),
                "token_value_per_unit": token_value_per_unit,
                "lockup_months": manifest.get("lockup_months", 0),
            }
            for key in (
                "legal_cost_basis",
                "alternative_realization_fraction",
                "seizure_probability_alternative_path",
                "seizure_probability_migration_path",
                "liquidation_haircut",
                "transaction_cost_sats",
            ):
                if key in tf_defaults or key in d:
                    kwargs[key] = _fr(d.get(key, tf_defaults.get(key)))
            rows[d["id"]] = tainted_funds.decompose_tainted_fund_economics(**kwargs)
        attack_analysis["tainted_fund_migration"] = rows

        grid_spec = manifest.get("tainted_fund_sensitivity_grid")
        if grid_spec:
            target = stolen_donors[0]
            attack_analysis["tainted_fund_sensitivity_grid"] = tainted_funds.tainted_fund_sensitivity_grid(
                donated_sats=target["sats"],
                allocation_units=allocation.get(target["id"], 0),
                token_value_multipliers=[_fr(v) for v in grid_spec["token_value_multipliers"]],
                alternative_realization_fractions=[_fr(v) for v in grid_spec["alternative_realization_fractions"]],
            )

    probe = manifest.get("split_identity_probes")
    if probe:
        rows = {}
        for p in probe:
            target_id = p["donor_id"]
            single_donors = _build_donors(
                {**manifest, "split_identity_probes": []}, random.Random(manifest["seed"])
            )
            single_weight_pairs = [(d["id"], d["sats"]) for d in single_donors]
            if scheme_name in alloc.SCHEMES:
                single_result_allocation = alloc.SCHEMES[scheme_name](single_weight_pairs, pool, **scheme_params)
            else:
                single_result_allocation = {d_id: 0 for d_id, _ in single_weight_pairs}
            single_share = Fraction(single_result_allocation.get(target_id, 0), pool) if pool else Fraction(0)
            split_ids = [d["id"] for d in donors if d.get("group") == target_id and d["id"].startswith(f"{target_id}_split")]
            split_share = Fraction(sum(allocation.get(i, 0) for i in split_ids), pool) if pool else Fraction(0)
            rows[target_id] = {
                "single_identity_share_of_pool": str(single_share),
                "split_into": p["into"],
                "split_total_share_of_pool": str(split_share),
                "split_gain": str(split_share - single_share),
                "sybil_split_is_profitable": split_share > single_share,
            }
        attack_analysis["sybil_split"] = rows

    shock = manifest.get("denominator_shock")
    if shock:
        pre_manifest = {k: v for k, v in manifest.items() if k != "donors"}
        pre_donors = [d for d in manifest.get("donors", []) if d["id"] not in shock["add_donor_ids"]]
        pre_manifest["donors"] = pre_donors
        pre_donors_built = _build_donors(pre_manifest, random.Random(manifest["seed"]))
        pre_weight_pairs = [(d["id"], d["sats"]) for d in pre_donors_built]
        pre_total = sum(w for _, w in pre_weight_pairs)
        if scheme_name in alloc.SCHEMES:
            pre_allocation = alloc.SCHEMES[scheme_name](pre_weight_pairs, pool, **scheme_params)
        else:
            pre_allocation = {d_id: 0 for d_id, _ in pre_weight_pairs}
        ref_id = shock["reference_donor_id"]
        pre_share = Fraction(pre_allocation.get(ref_id, 0), pool) if pool else Fraction(0)
        post_share = Fraction(allocation.get(ref_id, 0), pool) if pool else Fraction(0)
        attack_analysis["denominator_shock"] = {
            "reference_donor_id": ref_id,
            "pre_shock_total_eligible": pre_total,
            "post_shock_total_eligible": total_eligible,
            "pre_shock_share_of_pool": str(pre_share),
            "post_shock_share_of_pool": str(post_share),
            "dilution": str(pre_share - post_share),
        }

    if manifest.get("track_charity_breakdown"):
        charity_totals: dict[str, dict[str, Fraction]] = {}
        for d in donors:
            charity_id = d.get("charity_id", "unspecified")
            bucket = charity_totals.setdefault(
                charity_id, {"donated": Fraction(0), "rebate": Fraction(0)}
            )
            rebate_rate = _fr(d.get("rebate_rate", 0))
            bucket["donated"] += Fraction(d["sats"])
            bucket["rebate"] += rebate_rate * d["sats"]
        attack_analysis["charity_breakdown"] = {
            charity_id: {
                "total_donated": str(v["donated"]),
                "total_rebated_conditional": str(v["rebate"]),
                "net_retained_conditional": str(v["donated"] - v["rebate"]),
            }
            for charity_id, v in charity_totals.items()
        }

    return {
        "scenario_id": manifest["scenario_id"],
        "seed": manifest["seed"],
        "allocation_scheme": scheme_name,
        "scheme_params": scheme_params,
        "pool_units": pool,
        "total_eligible_units": total_eligible,
        "donor_count": len(donors),
        "unissued_remainder": unissued,
        "baseline_breakeven_price": str(baseline_price),
        "concentration": concentration,
        "governance": governance_block,
        "donor_economics": donor_economics,
        "attack_analysis": attack_analysis,
    }
