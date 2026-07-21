"""Scenario runner: turns a JSON manifest into a deterministic result dict.

A manifest describes a donor population (explicit or generated), an
allocation scheme, and zero or more adversarial "probes". The runner never
consults external data, wall-clock time, or unseeded randomness.
"""

from __future__ import annotations

import random
from fractions import Fraction
from typing import Any

from . import allocation as alloc
from . import metrics
from . import population as pop


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
        donor.setdefault("secret_rebate", False)
        donor.setdefault("stolen", False)
        donor.setdefault("block", 0)
        donor.setdefault("group", donor["id"])
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
    return {
        "by_account": {
            "gini": str(metrics.gini(allocation)),
            "hhi": str(metrics.hhi(allocation, pool)),
            "top1_share": str(metrics.top_n_share(allocation, pool, 1)),
            "top10_share": str(metrics.top_n_share(allocation, pool, 10)),
            "holder_count": len(allocation),
        },
        "by_beneficial_owner": {
            "gini": str(metrics.gini(grouped)),
            "hhi": str(metrics.hhi(grouped, pool)),
            "top1_share": str(metrics.top_n_share(grouped, pool, 1)),
            "top10_share": str(metrics.top_n_share(grouped, pool, 10)),
            "owner_count": len(grouped),
        },
    }


def run_scenario(manifest: dict[str, Any]) -> dict[str, Any]:
    rng = random.Random(manifest["seed"])
    donors = _build_donors(manifest, rng)
    pool = manifest["pool_units"]
    scheme_name = manifest["allocation_scheme"]
    scheme_params = dict(manifest.get("scheme_params", {}))

    weight_pairs = [(d["id"], d["sats"]) for d in donors]
    total_eligible = sum(w for _, w in weight_pairs)

    if scheme_name == "NO_TOKEN":
        allocation = {donor_id: 0 for donor_id, _ in weight_pairs}
    elif scheme_name == "RANDOM_LOTTERY_COMPONENT":
        allocation = alloc.random_lottery_component(weight_pairs, pool, rng, **scheme_params)
    elif scheme_name == "TIME_WEIGHTED":
        donor_blocks = {d["id"]: d.get("block", 0) for d in donors}
        allocation = alloc.time_weighted(weight_pairs, pool, donor_blocks=donor_blocks, **scheme_params)
    else:
        allocation = alloc.SCHEMES[scheme_name](weight_pairs, pool, **scheme_params)

    unissued = metrics.unissued_remainder(allocation, pool)
    concentration = _concentration_block(allocation, pool, donors)

    governance_cap_bps = manifest.get("governance_cap_bps", "PROPORTIONAL")
    governance_block = None
    if governance_cap_bps != "DISABLED":
        cap = None if governance_cap_bps == "PROPORTIONAL" else governance_cap_bps
        gov_weights = alloc.governance_weight(allocation, cap, pool)
        governance_block = _concentration_block(gov_weights, pool, donors)
        majority_owner_share = max(
            (Fraction(v, sum(gov_weights.values()) or 1) for v in _group_totals(gov_weights, donors).values()),
            default=Fraction(0),
        )
        governance_block["max_owner_governance_share"] = str(majority_owner_share)
        governance_block["crosses_simple_majority"] = majority_owner_share > Fraction(1, 2)
        governance_block["crosses_blocking_third"] = majority_owner_share > Fraction(1, 3)

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
        m = _fr(manifest.get("token_value_multipliers", [1.0])[0])
        token_value_per_unit = m * baseline_price
        rows = {}
        for d in rebate_probe_donors:
            honest_utility = token_value_per_unit * allocation.get(d["id"], 0) - Fraction(d["sats"])
            rebate_rate = _fr(d["rebate_rate"])
            rebated_utility = (
                token_value_per_unit * allocation.get(d["id"], 0)
                - (Fraction(d["sats"]) - rebate_rate * d["sats"])
            )
            rows[d["id"]] = {
                "rebate_rate": str(rebate_rate),
                "secret": d.get("secret_rebate", False),
                "honest_utility": str(honest_utility),
                "rebated_utility": str(rebated_utility),
                "rebate_attack_gain": str(rebated_utility - honest_utility),
                "charity_loss": str(rebate_rate * d["sats"]),
            }
        attack_analysis["rebate_attack"] = rows

    stolen_donors = [d for d in donors if d.get("stolen")]
    if stolen_donors:
        m = _fr(manifest.get("token_value_multipliers", [1.0])[0])
        token_value_per_unit = m * baseline_price
        rows = {}
        for d in stolen_donors:
            gross_value = token_value_per_unit * allocation.get(d["id"], 0)
            rows[d["id"]] = {
                "laundering_gain": str(gross_value),
                "true_economic_cost_borne_by_attacker": "0",
                "note": "attacker's cost basis is the theft victim's loss, not the attacker's; "
                "the protocol allocates identically to an honest donor of equal sats",
            }
        attack_analysis["stolen_key_laundering"] = rows

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
                "single_identity_share": str(single_share),
                "split_into": p["into"],
                "split_total_share": str(split_share),
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
            "pre_shock_share": str(pre_share),
            "post_shock_share": str(post_share),
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
                "total_rebated": str(v["rebate"]),
                "net_retained": str(v["donated"] - v["rebate"]),
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
