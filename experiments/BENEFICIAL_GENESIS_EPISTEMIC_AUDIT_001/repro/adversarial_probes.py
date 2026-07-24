#!/usr/bin/env python3
"""BGEN-EPISTEMIC-AUDIT-001 — adversarial probes against the subject packages.

Imports the subject implementations *only to attack them* (differential /
robustness testing). Never modifies subject files; the caller verifies
`git status` afterwards. Probes:

- duplicate participant identifiers;
- booleans accepted as integers;
- zero and negative values;
- very large integers;
- rounding / unissued remainders;
- participant ordering;
- lottery uniqueness and determinism;
- denominator choice (pool vs issued);
- governance normalization;
- design-pack allocation record validation.

Run from the repository root:
    python3 experiments/BENEFICIAL_GENESIS_EPISTEMIC_AUDIT_001/repro/adversarial_probes.py
"""

from __future__ import annotations

import importlib.util
import json
import random
import sys
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]

RESULTS: list[dict] = []


def record(name: str, ok: bool, detail: str) -> None:
    RESULTS.append({"probe": name, "ok": bool(ok), "detail": detail})
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail}")


def load(name: str, rel: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / rel)
    mod = importlib.util.module_from_spec(spec)
    # register so intra-package relative imports resolve if any
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


def expect_reject(name: str, fn, *args, **kwargs) -> None:
    try:
        fn(*args, **kwargs)
    except Exception as exc:  # noqa: BLE001 - probe wants any fail-closed signal
        record(name, True, f"rejected with {type(exc).__name__}: {exc}")
        return
    record(name, False, "ACCEPTED malformed input (should have rejected)")


def main() -> int:
    # --- design pack allocation (loaded as a package for relative imports) ---
    import importlib
    sys.path.insert(0, str(ROOT / "experiments/BENEFICIAL_GENESIS_DESIGN_001"))
    dp = importlib.import_module("protocol.allocation")

    expect_reject("design.duplicate_nullifier", dp.allocate_proportional,
                  fixed_bitcoin_genesis_pool=100,
                  eligible_by_nullifier=[("aa" * 32, 5), ("aa" * 32, 5)], epoch_id="e")
    expect_reject("design.bool_eligible", dp.allocate_proportional,
                  fixed_bitcoin_genesis_pool=100,
                  eligible_by_nullifier=[("aa" * 32, True)], epoch_id="e")
    expect_reject("design.zero_eligible", dp.allocate_proportional,
                  fixed_bitcoin_genesis_pool=100,
                  eligible_by_nullifier=[("aa" * 32, 0)], epoch_id="e")
    expect_reject("design.negative_pool", dp.allocate_proportional,
                  fixed_bitcoin_genesis_pool=-5,
                  eligible_by_nullifier=[("aa" * 32, 1)], epoch_id="e")
    expect_reject("design.pool_bool", dp.allocate_proportional,
                  fixed_bitcoin_genesis_pool=True,
                  eligible_by_nullifier=[("aa" * 32, 1)], epoch_id="e")
    expect_reject("design.huge_eligible_over_MAX_SATS", dp.allocate_proportional,
                  fixed_bitcoin_genesis_pool=100,
                  eligible_by_nullifier=[("aa" * 32, 2**128)], epoch_id="e")

    # supply invariant + ordering canonicalization
    rec = dp.allocate_proportional(
        fixed_bitcoin_genesis_pool=10**9,
        eligible_by_nullifier=[("ff" * 32, 7), ("00" * 32, 3), ("aa" * 32, 5)],
        epoch_id="e",
    )
    dp.assert_supply_invariant(rec)
    ordered = [r["nullifier_hex"] for r in rec["claims"]]
    record("design.rows_sorted_by_nullifier", ordered == sorted(ordered), str(ordered[:1]) + "...")
    record("design.supply_conserved",
           rec["total_issued"] + rec["remainder_unissued"] == 10**9,
           f"issued={rec['total_issued']} rem={rec['remainder_unissued']}")

    # tamper with a record: validator must reject
    bad = json.loads(json.dumps(rec))
    bad["claims"][0]["allocation"] += 1
    expect_reject("design.tampered_record_rejected", dp.assert_supply_invariant, bad)
    bad2 = json.loads(json.dumps(rec))
    bad2["total_issued"] += 1
    expect_reject("design.tampered_totals_rejected", dp.assert_supply_invariant, bad2)

    # --- Claude econ model ---
    ca = load("claude_alloc", "experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/allocation.py")

    expect_reject("claude.duplicate_ids", ca.exact_pro_rata, [("d", 5), ("d", 5)], 100)
    expect_reject("claude.bool_weight", ca.exact_pro_rata, [("d", True)], 100)
    expect_reject("claude.negative_weight", ca.exact_pro_rata, [("d", -1)], 100)
    expect_reject("claude.empty_id", ca.exact_pro_rata, [("", 1)], 100)
    expect_reject("claude.non_string_id", ca.exact_pro_rata, [(7, 1)], 100)
    expect_reject("claude.negative_pool", ca.exact_pro_rata, [("d", 1)], -100)
    expect_reject("claude.bool_pool", ca.exact_pro_rata, [("d", 1)], True)
    expect_reject("claude.cap_bps_zero", ca.capped_pro_rata, [("d", 1)], 100, cap_bps=0)
    expect_reject("claude.cap_bps_over", ca.capped_pro_rata, [("d", 1)], 100, cap_bps=10_001)
    expect_reject("claude.winners_zero", ca.random_lottery_component,
                  [("d", 1)], 100, random.Random(1), winners=0)

    # zero-weight donor is allowed but gets zero; huge ints exact
    a = ca.exact_pro_rata([("z", 0), ("big", 2**200)], 10**18)
    record("claude.zero_weight_gets_zero_huge_int_exact",
           a["z"] == 0 and a["big"] == 10**18, f"{a['z']}, big=={a['big'] == 10**18}")

    # ordering invariance (allocation values must not depend on input order)
    donors = [(f"d{i}", (i * 7919) % 1000 + 1) for i in range(50)]
    shuffled = donors[::-1]
    r1v = ca.exact_pro_rata(donors, 999_999)
    r2v = ca.exact_pro_rata(shuffled, 999_999)
    record("claude.order_invariance", r1v == r2v, "same mapping under reversed input order")

    # lottery: determinism + winner uniqueness (without replacement)
    donors_l = [(f"d{i}", 10 + i) for i in range(30)]
    l1 = ca.random_lottery_component(donors_l, 1_000_000, random.Random(99), winners=10)
    l2 = ca.random_lottery_component(donors_l, 1_000_000, random.Random(99), winners=10)
    record("claude.lottery_deterministic_same_seed", l1 == l2, "identical results for seed 99")
    base = ca.exact_pro_rata(donors_l, 1_000_000 - (1_000_000 * 1_000) // 10_000)
    prize_winners = [k for k in l1 if l1[k] > base.get(k, 0)]
    prizes = {k: l1[k] - base.get(k, 0) for k in prize_winners}
    distinct = len(set(prizes.values())) <= 1  # equal prize per distinct winner
    record("claude.lottery_winners_distinct_equal_prize",
           len(prize_winners) == 10 and distinct,
           f"{len(prize_winners)} distinct winners, prizes={set(prizes.values())}")

    # supply never exceeded across schemes on random trials
    rng = random.Random(7)
    over = 0
    for _ in range(500):
        n = rng.randint(1, 30)
        ds = [(f"d{i}", rng.randint(0, 10**9)) for i in range(n)]
        pool = rng.randint(1, 10**12)
        for scheme, kwargs in (
            (ca.exact_pro_rata, {}),
            (ca.capped_pro_rata, {"cap_bps": rng.randint(1, 10_000)}),
            (ca.concave_sqrt, {}),
        ):
            if sum(v for k, v in scheme(ds, pool, **kwargs).items()) > pool:
                over += 1
    record("claude.no_scheme_overissues_500_trials", over == 0, f"violations={over}")

    # --- Grok breaker model (API: allocate(pool=, contributions=[{...}], rule=)) ---
    ga = load("grok_alloc", "experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/model/allocation.py")

    def grok_pro_rata(ds, pool):
        rec = ga.allocate(pool=pool, rule="pro_rata",
                          contributions=[{"donor_id": d, "eligible_sats": w} for d, w in ds])
        return {row["donor_id"]: row["allocation"] for row in rec["allocations"]}

    expect_reject("grok.duplicate_ids", grok_pro_rata, [("d", 5), ("d", 5)], 100)
    expect_reject("grok.bool_weight", grok_pro_rata, [("d", True)], 100)
    expect_reject("grok.negative_weight", grok_pro_rata, [("d", -1)], 100)
    expect_reject("grok.zero_weight_rejected_min1", grok_pro_rata, [("d", 0)], 100)
    expect_reject("grok.huge_int_over_MAX_SATS", grok_pro_rata, [("big", 2**200)], 10**18)
    d1 = grok_pro_rata(donors, 999_999)
    d2 = grok_pro_rata(shuffled, 999_999)
    record("grok.order_invariance", d1 == d2, "same mapping under reversed input order")

    # semantic difference note: Grok rejects zero weights and bounds inputs at
    # MAX_SATS (21e6 * 1e8); Claude allows zero weights and unbounded ints.
    record("grok.vs_claude_input_domain_differs", True,
           "documented semantic difference: zero weights and >MAX_SATS ints "
           "accepted by Claude model, rejected by Grok model (AUD-SEM-02)")

    # differential: Claude vs Grok pro-rata on shared random vectors
    diff = 0
    rng = random.Random(11)
    for _ in range(300):
        n = rng.randint(1, 25)
        ds = [(f"d{i}", rng.randint(1, 10**8)) for i in range(n)]
        pool = rng.randint(1, 10**10)
        if ca.exact_pro_rata(ds, pool) != grok_pro_rata(ds, pool):
            diff += 1
    record("differential.claude_vs_grok_pro_rata_300_vectors", diff == 0,
           f"disagreements={diff}")

    failures = [r for r in RESULTS if not r["ok"]]
    out = HERE / "adversarial_probe_results.json"
    out.write_text(json.dumps({
        "schema": "bgen.epistemic-audit.adversarial-probes/v1",
        "subject_commit": "8349de7a5978be6a9984aa33fd59ba3725ebaaca",
        "probes": RESULTS,
        "total": len(RESULTS),
        "failed": len(failures),
    }, indent=2) + "\n")
    print(f"\n{len(RESULTS) - len(failures)}/{len(RESULTS)} probes passed; report: {out}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
