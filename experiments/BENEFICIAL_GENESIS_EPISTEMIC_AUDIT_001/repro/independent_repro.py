#!/usr/bin/env python3
"""BGEN-EPISTEMIC-AUDIT-001 — independent reproduction of load-bearing results.

Fresh, minimal implementations written from the *stated equations* in
TECHNICAL_DESIGN.md, FORMAL_MODEL.md, FAILURE_CONDITIONS.md and the scenario
manifests. The subject model implementations
(experiments/BENEFICIAL_GENESIS_{DESIGN,ECON_REDTEAM,ECON_BREAKER}_001) are
NOT imported here. The only subject data used are:

- scenario manifests (inputs, published seeds) — input data, not model code;
- committed results/*.json — loaded read-only for the differential comparison
  step only, after this script's own numbers are computed.

Population regeneration deliberately mirrors the published generator contract
(random.Random(seed).randint(sats_min, sats_max) per donor in order): the
population is part of the *input specification*, so reproducing it is input
reconstruction, not implementation reuse. Everything downstream (allocation,
splitting, rebate, tainted-fund, governance arithmetic) is re-derived here
from the equations alone, in exact Fraction/int arithmetic.

Run from the repository root:

    python3 experiments/BENEFICIAL_GENESIS_EPISTEMIC_AUDIT_001/repro/independent_repro.py

Exit code 0 iff every reproduction matches expectations; a JSON report is
written next to this script.
"""

from __future__ import annotations

import json
import math
import random
import sys
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CLAUDE = ROOT / "experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001"
GROK = ROOT / "experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001"

CHECKS: list[dict] = []


def check(name: str, ok: bool, expected, actual, note: str = "") -> None:
    CHECKS.append(
        {
            "name": name,
            "ok": bool(ok),
            "expected": str(expected),
            "actual": str(actual),
            "note": note,
        }
    )
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}: expected={expected} actual={actual} {note}")


# ---------------------------------------------------------------------------
# Input reconstruction (population = published input contract)
# ---------------------------------------------------------------------------

def regen_population(scenario: dict) -> list[tuple[str, int]]:
    """Rebuild the deterministic donor list exactly as the manifest publishes
    it: fixed donors in manifest order, then generated small donors from the
    published seed."""
    rng = random.Random(scenario["seed"])
    donors: list[tuple[str, int]] = [
        (d["id"], d["sats"]) for d in scenario.get("donors", [])
    ]
    for gen in scenario.get("generators", []):
        assert gen["kind"] == "small_donors"
        prefix = gen.get("id_prefix", "small")
        for i in range(gen["count"]):
            donors.append((f"{prefix}_{i:06d}", rng.randint(gen["sats_min"], gen["sats_max"])))
    return donors


def split_donor(donors: list[tuple[str, int]], donor_id: str, into: int) -> list[tuple[str, int]]:
    """Split one donor's mass across `into` identities, floor-dividing with the
    remainder on the first clone (per the published split contract)."""
    out: list[tuple[str, int]] = []
    for d_id, sats in donors:
        if d_id != donor_id:
            out.append((d_id, sats))
            continue
        base = sats // into
        rem = sats - base * into
        for i in range(into):
            out.append((f"{d_id}_split_{i:03d}", base + (rem if i == 0 else 0)))
    return out


# ---------------------------------------------------------------------------
# Independent re-implementations (from equations only)
# ---------------------------------------------------------------------------

def pro_rata(donors: list[tuple[str, int]], pool: int) -> dict[str, int]:
    """allocation_i = floor(pool * w_i / total)."""
    total = sum(w for _, w in donors)
    if total <= 0:
        return {d: 0 for d, _ in donors}
    return {d: (pool * w) // total for d, w in donors}


def capped_pro_rata(donors: list[tuple[str, int]], pool: int, cap_bps: int) -> dict[str, int]:
    cap_units = (pool * cap_bps) // 10_000
    return {d: min(a, cap_units) for d, a in pro_rata(donors, pool).items()}


def concave_sqrt(donors: list[tuple[str, int]], pool: int) -> dict[str, int]:
    weights = [(d, math.isqrt(w)) for d, w in donors]
    return pro_rata(weights, pool)


def group_share_of_pool(allocation: dict[str, int], pool: int, prefix: str) -> Fraction:
    return Fraction(sum(v for k, v in allocation.items() if k.startswith(prefix)), pool)


def rebate_incidence(
    donated: int,
    rate: Fraction,
    arrangement_exists: bool,
    access_p: Fraction,
    arrangement_cost: Fraction,
    enforcement_p: Fraction,
    detection_p: Fraction,
    detection_loss_frac: Fraction,
) -> dict[str, Fraction]:
    face = Fraction(donated)
    conditional_rebate = face * rate
    p_access = Fraction(1) if arrangement_exists else access_p
    expected_rebate = face * rate * p_access * enforcement_p
    expected_detection_loss = face * detection_loss_frac * detection_p * p_access
    return {
        "conditional_rebate": conditional_rebate,
        "conditional_retained": face - conditional_rebate,
        "expected_rebate": expected_rebate,
        "expected_retained": face - expected_rebate,
        "expected_donor_net": expected_rebate - expected_detection_loss - arrangement_cost * p_access,
    }


def tainted_net_profit(
    donated: int,
    allocation_units: int,
    token_value_per_unit: Fraction,
    alt_realization: Fraction,
    seize_alt: Fraction = Fraction(3, 10),
    seize_mig: Fraction = Fraction(1, 5),
    haircut: Fraction = Fraction(3, 20),
    lockup_months: int = 0,
    legal_basis: Fraction = Fraction(0),
    txcost: Fraction = Fraction(0),
) -> Fraction:
    opportunity = Fraction(donated) * alt_realization * (1 - seize_alt)
    gross = Fraction(allocation_units) * token_value_per_unit
    risk_adj = gross * (1 - haircut) * (1 - seize_mig)
    lock_disc = Fraction(100 - min(lockup_months * 7, 70), 100)
    realizable = risk_adj * lock_disc
    return realizable - opportunity - legal_basis - txcost


def governance(rule: str, allocation: dict[str, int], cap_bps: int | None = None) -> dict[str, Fraction]:
    holders = {k: v for k, v in allocation.items() if v > 0}
    issued = sum(holders.values())
    if rule == "none":
        return {k: Fraction(0) for k in allocation}
    if rule == "equal":
        n = len(holders)
        return {k: Fraction(1, n) for k in holders} if n else {}
    if rule in ("proportional", "token_weighted"):
        return {k: Fraction(v, issued) for k, v in holders.items()} if issued else {}
    if rule == "cap_then_renormalize":
        assert cap_bps is not None
        cap = Fraction(cap_bps, 10_000)
        raw = {k: Fraction(v, issued) for k, v in holders.items()}
        clipped = {k: min(v, cap) for k, v in raw.items()}
        s = sum(clipped.values())
        return {k: v / s for k, v in clipped.items()} if s else clipped
    raise ValueError(rule)


# ---------------------------------------------------------------------------
# R1 — proportional allocation, supply conservation, split invariance
# ---------------------------------------------------------------------------

def r1() -> None:
    # Floor-sum inequality: randomized deterministic trials in exact ints.
    rng = random.Random(4242)
    violations = 0
    for _ in range(2000):
        n = rng.randint(1, 40)
        pool = rng.randint(1, 10**12)
        ws = [rng.randint(1, 10**10) for _ in range(n)]
        alloc = pro_rata([(f"d{i}", w) for i, w in enumerate(ws)], pool)
        issued = sum(alloc.values())
        if issued > pool or issued + (pool - issued) != pool:
            violations += 1
    check("R1.floor_sum_never_exceeds_pool_2000_trials", violations == 0, 0, violations)

    # Scenario 06: linear pro-rata split near-invariance (exact repro).
    sc = json.load(open(CLAUDE / "scenarios/06_sybil_split_control_pro_rata.json"))
    donors = regen_population(sc)
    pool = sc["pool_units"]
    single = pro_rata(donors, pool)
    split = pro_rata(split_donor(donors, "attacker", 400), pool)
    single_share = group_share_of_pool(single, pool, "attacker")
    split_share = group_share_of_pool(split, pool, "attacker")
    gain = split_share - single_share
    check("R1.scn06_single_identity_share", single_share == Fraction(10791953, 25000000),
          Fraction(10791953, 25000000), single_share)
    check("R1.scn06_split_gain_is_tiny_negative", gain == Fraction(-53, 25000000),
          Fraction(-53, 25000000), gain,
          "floor residue only; linear pro-rata is split-mass invariant up to floors")

    # Independent worked micro-example: splitting never increases linear
    # pro-rata by more than the floor residue (exact bound: loss < into units).
    micro = [("a", 999), ("b", 1)]
    pool2 = 1000
    one = pro_rata(micro, pool2)["a"]
    many = sum(v for k, v in pro_rata(split_donor(micro, "a", 3), pool2).items() if k.startswith("a"))
    check("R1.micro_split_no_gain", many <= one, f"<={one}", many)


# ---------------------------------------------------------------------------
# R2 — anti-concentration alternatives are Sybil-exploitable
# ---------------------------------------------------------------------------

def r2() -> None:
    sc = json.load(open(CLAUDE / "scenarios/05_sybil_split_concave.json"))
    donors = regen_population(sc)
    pool = sc["pool_units"]
    single = concave_sqrt(donors, pool)
    split = concave_sqrt(split_donor(donors, "attacker", 400), pool)
    s1 = group_share_of_pool(single, pool, "attacker")
    s2 = group_share_of_pool(split, pool, "attacker")
    check("R2.scn05_concave_single_share", s1 == Fraction(3849009, 100000000),
          Fraction(3849009, 100000000), s1)
    check("R2.scn05_concave_split_share", s2 == Fraction(111119, 250000),
          Fraction(111119, 250000), s2)
    check("R2.scn05_split_gain", s2 - s1 == Fraction(40598591, 100000000),
          Fraction(40598591, 100000000), s2 - s1, "+40.6pp from free 400-way split")

    # Mathematical core, independent of any population: sqrt is strictly
    # concave, so sum_i sqrt(w/k) = k*sqrt(w/k) = sqrt(k*w) > sqrt(w) for k>1.
    w = 40_000_000
    k = 400
    gain_factor = Fraction(math.isqrt(w // k) * k, math.isqrt(w))
    check("R2.sqrt_split_weight_multiplier", gain_factor > 1, ">1", gain_factor,
          "splitting multiplies concave weight ~sqrt(k)-fold")

    sc26 = json.load(open(CLAUDE / "scenarios/26_sybil_split_capped_pro_rata.json"))
    donors26 = regen_population(sc26)
    pool26 = sc26["pool_units"]
    cap_bps = sc26["scheme_params"]["cap_bps"]
    s1c = group_share_of_pool(capped_pro_rata(donors26, pool26, cap_bps), pool26, "attacker")
    s2c = group_share_of_pool(
        capped_pro_rata(split_donor(donors26, "attacker", 20), pool26, cap_bps), pool26, "attacker")
    check("R2.scn26_cap_single_share", s1c == Fraction(1, 10), Fraction(1, 10), s1c)
    check("R2.scn26_cap_split_gain", s2c - s1c == Fraction(176241, 250000),
          Fraction(176241, 250000), s2c - s1c, "+70.5pp: 20 identities x 10% cap")


# ---------------------------------------------------------------------------
# R3 — fixed-pool denominator / undersubscription
# ---------------------------------------------------------------------------

def r3() -> None:
    # Scenario 19: a single 1,000-sat donor receives the entire pool.
    alloc = pro_rata([("only_donor", 1000)], 100_000_000)
    check("R3.scn19_single_tiny_donor_gets_full_pool", alloc["only_donor"] == 100_000_000,
          100_000_000, alloc["only_donor"],
          "realized-total denominator: pool issues in full regardless of subscription")

    # The design pack's denominator is the realized total, not a target:
    # with any T > 0, issued == pool - (floor residue). There is no
    # undersubscription floor in the specified rule.
    for total, expect_full in ((1, True), (10**15, True)):
        a = pro_rata([("d", total)], 10**9)
        check(f"R3.full_issuance_T={total}", (sum(a.values()) == 10**9) == expect_full,
              expect_full, sum(a.values()) == 10**9)

    # Zero-participant epoch: nothing issued (0/0 guarded).
    check("R3.zero_participants_zero_issued", pro_rata([], 10**9) == {}, {}, pro_rata([], 10**9))

    # Dust exclusion by floors: a donor below total/pool gets exactly 0.
    a = pro_rata([("whale", 10**12), ("dust", 1)], 100)
    check("R3.dust_donor_floors_to_zero", a["dust"] == 0, 0, a["dust"],
          "floors silently zero out donors below total_eligible/pool per unit")


# ---------------------------------------------------------------------------
# R4 — rebate/collusion incidence
# ---------------------------------------------------------------------------

def r4() -> None:
    fr = dict(
        access_p=Fraction(1, 20),
        arrangement_cost=Fraction(200000),
        enforcement_p=Fraction(4, 5),
        detection_p=Fraction(3, 10),
        detection_loss_frac=Fraction(1, 2),
    )
    arb = rebate_incidence(5_000_000, Fraction(1, 2), False, **fr)
    col = rebate_incidence(5_000_000, Fraction(1, 2), True, **fr)
    check("R4.conditional_rebate_one_for_one", arb["conditional_rebate"] == 2_500_000,
          2_500_000, arb["conditional_rebate"])
    check("R4.expected_rebate_arbitrary_donor", arb["expected_rebate"] == 100_000,
          100_000, arb["expected_rebate"],
          "5% access x 80% enforcement collapses 2.5M conditional to 100k expected")
    check("R4.expected_rebate_colluding_donor", col["expected_rebate"] == 2_000_000,
          2_000_000, col["expected_rebate"])
    check("R4.colluding_donor_net", col["expected_donor_net"] == 1_050_000,
          1_050_000, col["expected_donor_net"])
    # Identity: charity retention loss equals rebate paid, at every rate.
    ok = all(
        rebate_incidence(10**7, Fraction(r, 100), True, **fr)["conditional_retained"]
        == 10**7 - 10**7 * Fraction(r, 100)
        for r in range(0, 101)
    )
    check("R4.retention_identity_all_rates_0_100", ok, True, ok)


# ---------------------------------------------------------------------------
# R5 — tainted-source opportunity-cost sensitivity
# ---------------------------------------------------------------------------

def r5() -> None:
    sc = json.load(open(CLAUDE / "scenarios/10_stolen_key_donation.json"))
    donors = regen_population(sc)
    pool = sc["pool_units"]
    total = sum(w for _, w in donors)
    check("R5.scn10_total_eligible", total == 62_847_081, 62_847_081, total)
    alloc = pro_rata(donors, pool)["stolen_key_attacker"]
    check("R5.scn10_attacker_allocation", alloc == 15_911_637, 15_911_637, alloc)
    unit_value = Fraction(total, pool)  # multiplier 1.0 anchor: donated/pool
    net = tainted_net_profit(10_000_000, alloc, unit_value, Fraction(7, 10))
    check("R5.scn10_net_profit_default_cell", net == Fraction(4749998969487149, 2500000000),
          Fraction(4749998969487149, 2500000000), net)
    # Sign flip across the published grid: profitable and unprofitable cells
    # both exist -> profitability is assumption-conditional, not automatic.
    signs = set()
    grid_repro = []
    for mult in (Fraction(1, 2), Fraction(1), Fraction(3, 2)):
        for altf in (Fraction(0), Fraction(3, 10), Fraction(7, 10), Fraction(1)):
            n = tainted_net_profit(10_000_000, alloc, unit_value * mult, altf)
            signs.add(n > 0)
            grid_repro.append(((str(mult), str(altf)), n > 0))
    check("R5.grid_has_both_signs", signs == {True, False}, {True, False}, signs,
          "laundering profitability flips sign inside the published grid")
    # Differential vs the committed Claude grid. NOTE (audit finding
    # AUD-SEM-01): the committed grid's "token_value_per_unit" column holds
    # the *multiplier* value used directly as an absolute per-unit token value
    # (0.5 / 1 / 1.5 sats per unit), whereas the headline decomposition above
    # uses anchor(total_donated/pool) x multiplier (~0.628 at 1.0). Same
    # manifest key, two semantics. Both interpretations produce sign flips,
    # so the qualitative conclusion stands, but the grid cells are not
    # numerically comparable to the headline cell.
    committed = json.load(open(CLAUDE / "results/10_stolen_key_donation.json"))
    grid = committed["attack_analysis"]["tainted_fund_sensitivity_grid"]
    mismatches = []
    for row in grid:
        mult = Fraction(row["token_value_per_unit"])
        altf = Fraction(row["alternative_realization_fraction"])
        mine_net = tainted_net_profit(10_000_000, alloc, mult, altf)
        if str(mine_net) != row["net_migration_profit"] or (mine_net > 0) != row["profitable"]:
            mismatches.append(row)
    check("R5.grid_differential_vs_claude_absolute_semantics", not mismatches,
          "0 mismatches", f"{len(mismatches)} mismatches",
          "grid reproduced exactly under absolute-unit-value semantics (AUD-SEM-01)")


# ---------------------------------------------------------------------------
# R6 — governance-weight integration semantics
# ---------------------------------------------------------------------------

def r6() -> None:
    sc = json.load(open(CLAUDE / "scenarios/13_governance_rules_comparison.json"))
    donors = regen_population(sc)
    alloc = pro_rata(donors, sc["pool_units"])
    prop = governance("proportional", alloc)
    whale = prop["whale_01"]
    check("R6.scn13_proportional_whale_share", whale == Fraction(13121911, 24999936),
          Fraction(13121911, 24999936), whale, "~52.49%, crosses simple majority")
    check("R6.scn13_crosses_majority", whale > Fraction(1, 2), True, whale > Fraction(1, 2))
    eq = governance("equal", alloc)
    check("R6.scn13_equal_rule_share", max(eq.values()) == Fraction(1, 501),
          Fraction(1, 501), max(eq.values()), "501 recipients with positive allocation")
    check("R6.scn13_none_rule", max(governance("none", alloc).values()) == 0, 0,
          max(governance("none", alloc).values()))
    check("R6.weights_sum_to_1_proportional", sum(prop.values()) == 1, 1, sum(prop.values()))


# ---------------------------------------------------------------------------
# R7 — cap-then-renormalize behavior
# ---------------------------------------------------------------------------

def r7() -> None:
    sc = json.load(open(CLAUDE / "scenarios/14_governance_cap_then_renormalize.json"))
    donors = regen_population(sc)
    alloc = pro_rata(donors, sc["pool_units"])
    w500 = governance("cap_then_renormalize", alloc, cap_bps=500)
    committed = json.load(open(CLAUDE / "results/14_governance_cap_then_renormalize.json"))
    mine_max = max(w500.values())
    got = committed["governance"]["cap_then_renormalize_500bps"]["final_normalized_weights"]["whale_01"]
    check("R7.scn14_500bps_whale_final_weight_matches_committed",
          str(mine_max) == got or mine_max == Fraction(got), got, mine_max)
    check("R7.scn14_final_exceeds_nominal_cap", mine_max > Fraction(500, 10_000),
          "> 1/20", mine_max, "renormalization pushes final share above the nominal 5% clip")
    check("R7.scn14_sums_to_1", sum(w500.values()) == 1, 1, sum(w500.values()))

    # Boundary constructions (independent of any scenario):
    one = governance("cap_then_renormalize", {"a": 100}, cap_bps=500)
    check("R7.single_holder_renormalizes_to_1", one["a"] == 1, 1, one["a"],
          "a 5% 'cap' still yields 100% final weight for a lone holder")
    two = governance("cap_then_renormalize", {"a": 90, "b": 10}, cap_bps=500)
    check("R7.two_holders_both_at_50pct", two["a"] == Fraction(1, 2) == two["b"],
          Fraction(1, 2), (two["a"], two["b"]),
          "both clipped to 5%, renormalized to 50/50: final >> nominal cap")


def main() -> int:
    for fn in (r1, r2, r3, r4, r5, r6, r7):
        print(f"--- {fn.__name__} ---")
        fn()
    failures = [c for c in CHECKS if not c["ok"]]
    report = {
        "schema": "bgen.epistemic-audit.independent-repro/v1",
        "subject_commit": "8349de7a5978be6a9984aa33fd59ba3725ebaaca",
        "checks": CHECKS,
        "total": len(CHECKS),
        "failed": len(failures),
    }
    out = HERE / "independent_repro_results.json"
    out.write_text(json.dumps(report, indent=2, default=str) + "\n")
    print(f"\n{len(CHECKS) - len(failures)}/{len(CHECKS)} checks passed; report: {out}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
