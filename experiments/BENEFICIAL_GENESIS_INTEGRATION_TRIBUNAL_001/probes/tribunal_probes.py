#!/usr/bin/env python3
"""Independent tribunal probes for BGEN-INTEGRATION-TRIBUNAL-001.

Read-only against subject packages at frozen commit
8349de7a5978be6a9984aa33fd59ba3725ebaaca. Writes results only under
experiments/BENEFICIAL_GENESIS_INTEGRATION_TRIBUNAL_001/results/.

These probes were written from the subject source alone, then compared
against the PR #42 and PR #43 audit claims. They deliberately search the
scheme-parameter domain (lottery_share_bps, early_bonus_bps, epoch bounds,
rng interface) that PR #43's probes did not cover, and re-execute the PR #42
counterexample independently rather than rerunning its committed probe file.
"""
from __future__ import annotations

import json
import random
import sys
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent.parent / "results" / "TRIBUNAL_PROBE_RESULTS.json"

sys.path.insert(0, str(ROOT / "experiments" / "BENEFICIAL_GENESIS_ECON_REDTEAM_001"))
from model.allocation import (  # noqa: E402
    ParticipantValidationError,
    exact_pro_rata,
    random_lottery_component,
    time_weighted,
)
from model import metrics  # noqa: E402

results: list[dict] = []


def rec(probe_id: str, claim: str, outcome: str, **kw) -> None:
    row = {"probe_id": probe_id, "claim": claim, "outcome": outcome, **kw}
    results.append(row)
    print(f"[{outcome}] {probe_id}: {claim}")


# T-001: PR #42 counterexample, independently re-implemented.
# pool=100, lottery_share_bps=-1000, well-formed sole donor, deterministic RNG.
try:
    donors = [("only_donor", 7)]
    alloc = random_lottery_component(donors, 100, random.Random(1), lottery_share_bps=-1000)
    issued = sum(alloc.values())
    unissued = metrics.unissued_remainder(alloc, 100)
    rec(
        "T-001",
        "negative lottery_share_bps over-issues pool (Codex CODEX-TECH-001)",
        "CONFIRMED" if (issued == 110 and unissued == -10) else "NOT_REPRODUCED",
        allocation=alloc,
        total_issued=issued,
        unissued_remainder=unissued,
        expected_if_defect={"total_issued": 110, "unissued_remainder": -10},
    )
except Exception as e:  # a rejection here would refute the finding
    rec("T-001", "negative lottery_share_bps over-issues pool", "NOT_REPRODUCED",
        error=repr(e))

# T-002: oversized lottery_share_bps (>10000).
try:
    alloc = random_lottery_component([("d", 7)], 100, random.Random(1), lottery_share_bps=20_000)
    rec("T-002", "lottery_share_bps=20000 accepted (fail-open)", "FAIL_OPEN",
        allocation=alloc, total_issued=sum(alloc.values()))
except ParticipantValidationError as e:
    rec("T-002", "lottery_share_bps=20000 rejected only accidentally via negative sub-pool",
        "FAIL_CLOSED_ACCIDENTAL", error=str(e)[:120],
        note="rejection comes from exact_pro_rata's pool>=0 check on the derived "
             "sub-pool, not from validating lottery_share_bps itself")
except Exception as e:
    rec("T-002", "lottery_share_bps=20000 behavior", "OTHER_EXCEPTION", error=repr(e))

# T-003: boolean lottery_share_bps (bool-as-int case the validator pattern
# elsewhere explicitly excludes).
try:
    alloc = random_lottery_component([("d", 7)], 100, random.Random(1), lottery_share_bps=True)
    rec("T-003", "lottery_share_bps=True silently accepted as 1 bps", "FAIL_OPEN",
        allocation=alloc, total_issued=sum(alloc.values()))
except Exception as e:
    rec("T-003", "lottery_share_bps=True rejected", "FAIL_CLOSED", error=repr(e))

# T-004: float lottery_share_bps.
try:
    alloc = random_lottery_component([("d", 7)], 100, random.Random(1), lottery_share_bps=250.5)
    rec("T-004", "float lottery_share_bps accepted", "FAIL_OPEN", allocation=alloc)
except ParticipantValidationError as e:
    rec("T-004", "float lottery_share_bps rejected accidentally via float sub-pool",
        "FAIL_CLOSED_ACCIDENTAL", error=str(e)[:120])
except Exception as e:
    rec("T-004", "float lottery_share_bps behavior", "OTHER_EXCEPTION", error=repr(e))

# T-005: string lottery_share_bps.
try:
    alloc = random_lottery_component([("d", 7)], 100, random.Random(1), lottery_share_bps="10")
    rec("T-005", "string lottery_share_bps accepted", "FAIL_OPEN", allocation=alloc)
except ParticipantValidationError as e:
    rec("T-005", "string lottery_share_bps rejected by validator", "FAIL_CLOSED",
        error=str(e)[:120])
except TypeError as e:
    rec("T-005", "string lottery_share_bps crashes with raw TypeError (not a "
        "domain rejection)", "FAIL_CLOSED_ACCIDENTAL", error=str(e)[:120])

# T-006: negative early_bonus_bps in time_weighted is silently accepted and
# inverts the documented "rewards earlier donations" semantics.
try:
    donors = [("early", 1000), ("late", 1000)]
    blocks = {"early": 0, "late": 100}
    a = time_weighted(donors, 1000, donor_blocks=blocks, epoch_open_block=0,
                      epoch_close_block=100, early_bonus_bps=-5000)
    outcome = "FAIL_OPEN_SEMANTIC_INVERSION" if a["late"] > a["early"] else "FAIL_OPEN"
    rec("T-006", "early_bonus_bps=-5000 accepted; late donor outearns early donor "
        "against documented semantics", outcome, allocation=a,
        total_issued=sum(a.values()), pool=1000,
        supply_invariant_held=sum(a.values()) <= 1000)
except Exception as e:
    rec("T-006", "negative early_bonus_bps rejected", "FAIL_CLOSED", error=repr(e))

# T-007: inverted epoch bounds (close < open) silently accepted.
try:
    donors = [("early", 1000), ("late", 1000)]
    blocks = {"early": 90, "late": 100}
    a = time_weighted(donors, 1000, donor_blocks=blocks, epoch_open_block=100,
                      epoch_close_block=0, early_bonus_bps=5000)
    rec("T-007", "epoch_close_block < epoch_open_block accepted without rejection",
        "FAIL_OPEN", allocation=a, total_issued=sum(a.values()),
        supply_invariant_held=sum(a.values()) <= 1000)
except Exception as e:
    rec("T-007", "inverted epoch bounds rejected", "FAIL_CLOSED", error=repr(e))

# T-008: rng interface is unvalidated duck typing (any object with randrange).
try:
    class NotARandom:
        def randrange(self, n):  # constant, biased "rng"
            return 0

    a = random_lottery_component([("a", 1), ("b", 1)], 1000, NotARandom(),
                                 lottery_share_bps=10_000, winners=1)
    rec("T-008", "arbitrary non-Random rng object accepted (winner fully "
        "attacker-chosen)", "FAIL_OPEN", allocation=a)
except Exception as e:
    rec("T-008", "non-Random rng rejected", "FAIL_CLOSED", error=repr(e))

# T-009: boolean winners is rejected (validated path, for contrast).
try:
    random_lottery_component([("d", 7)], 100, random.Random(1), winners=True)
    rec("T-009", "winners=True accepted", "FAIL_OPEN")
except ParticipantValidationError as e:
    rec("T-009", "winners=True rejected by validate_participants", "FAIL_CLOSED",
        error=str(e)[:120])

# T-010: scenario layer emits the impossible result without an invariant gate.
try:
    sys.path.insert(0, str(ROOT / "experiments" / "BENEFICIAL_GENESIS_ECON_REDTEAM_001"))
    from model import scenario as scen  # noqa: E402

    manifest = {
        "scenario_id": "TRIBUNAL_HOSTILE_LOTTERY",
        "description": "tribunal probe: negative lottery share via scheme_params",
        "allocation_scheme": "RANDOM_LOTTERY_COMPONENT",
        "scheme_params": {"lottery_share_bps": -1000, "winners": 1},
        "pool_units": 100,
        "seed": 1,
        "donors": [{"id": "only_donor", "sats": 7}],
    }
    out = scen.run_scenario(manifest)
    rec("T-010", "scenario runner accepts hostile manifest and emits "
        "unissued_remainder=-10",
        "CONFIRMED" if out.get("unissued_remainder") == -10 else "NOT_REPRODUCED",
        unissued_remainder=out.get("unissued_remainder"),
        total_issued=sum(out.get("allocation", {}).values()))
except Exception as e:
    rec("T-010", "scenario runner rejects hostile manifest", "NOT_REPRODUCED",
        error=repr(e), tb=traceback.format_exc()[-400:])

# T-011: normative design allocation surface is NOT affected — the design
# pack has no lottery/bps parameter and enforces its own supply invariant.
try:
    sys.path.insert(0, str(ROOT / "experiments" / "BENEFICIAL_GENESIS_DESIGN_001"))
    from protocol.allocation import (  # noqa: E402
        AllocationError,
        allocate_proportional,
        assert_supply_invariant,
    )

    rng = random.Random(20260721)
    violations = []
    for _ in range(200):
        n = rng.randint(1, 12)
        elig = [(f"{i:064x}", rng.randint(1, 10**12)) for i in range(n)]
        pool = rng.randint(0, 10**15)
        r = allocate_proportional(fixed_bitcoin_genesis_pool=pool,
                                  eligible_by_nullifier=elig, epoch_id="e")
        assert_supply_invariant(r)
        if r["total_issued"] > pool or r["total_issued"] + r["remainder_unissued"] != pool:
            violations.append(r)
    neg_rejected = False
    try:
        allocate_proportional(fixed_bitcoin_genesis_pool=-1,
                              eligible_by_nullifier=[("a" * 64, 1)], epoch_id="e")
    except AllocationError:
        neg_rejected = True
    rec("T-011", "design-pack allocate_proportional conserves supply over 200 "
        "random cases and rejects negative pool",
        "CONFIRMED" if (not violations and neg_rejected) else "NOT_REPRODUCED",
        random_cases=200, violations=len(violations),
        negative_pool_rejected=neg_rejected)
except Exception as e:
    rec("T-011", "design-pack allocation invariant", "NOT_REPRODUCED",
        error=repr(e), tb=traceback.format_exc()[-400:])

# T-012: Breaker package's lottery surface validates its parameters
# (contrast with the REDTEAM package).
try:
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "breaker_allocation",
        ROOT / "experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/model/allocation.py",
    )
    br = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(br)
    try:
        br.allocate(
            pool=100,
            contributions=[{"donor_id": "d", "sats": 7}],
            rule="lottery_without_replacement",
            lottery_winner_slots=-3,
        )
        rec("T-012", "Breaker allocate accepts negative lottery_winner_slots",
            "FAIL_OPEN")
    except Exception as e:
        rec("T-012", "Breaker allocate rejects out-of-range lottery params",
            "FAIL_CLOSED", error=str(e)[:160])
except Exception as e:
    rec("T-012", "Breaker allocate surface probe", "OTHER_EXCEPTION", error=repr(e))

# T-013: fixed-pool undersubscription sole-donor case — a single donor with
# the minimum positive contribution captures the entire pool under the
# normative floor pro-rata rule (structural property, both mechanism audits).
try:
    a = exact_pro_rata([("sole", 1)], 1_000_000_000)
    from protocol.allocation import allocate_proportional as design_alloc  # noqa: E402

    d = design_alloc(fixed_bitcoin_genesis_pool=1_000_000_000,
                     eligible_by_nullifier=[("ab" * 32, 1)], epoch_id="e")
    rec("T-013", "1-sat sole donor receives the entire fixed pool in both the "
        "REDTEAM model and the normative design pack",
        "CONFIRMED" if (a["sole"] == 1_000_000_000
                        and d["total_issued"] == 1_000_000_000) else "NOT_REPRODUCED",
        redteam_alloc=a["sole"], design_total_issued=d["total_issued"])
except Exception as e:
    rec("T-013", "sole-donor undersubscription capture", "NOT_REPRODUCED",
        error=repr(e))

# T-014: extreme oversubscription — tiny contributors floor to zero while
# supply conservation still holds (no counterexample; boundary behavior).
try:
    donors = [("whale", 10**12)] + [(f"d{i}", 1) for i in range(100)]
    a = exact_pro_rata(donors, 1000)
    zeros = sum(1 for k, v in a.items() if k != "whale" and v == 0)
    rec("T-014", "oversubscription floors 1-sat donors to zero allocation; "
        "supply conserved",
        "CONFIRMED" if (zeros == 100 and sum(a.values()) <= 1000) else "NOT_REPRODUCED",
        zero_allocated_small_donors=zeros, total_issued=sum(a.values()))
except Exception as e:
    rec("T-014", "oversubscription boundary", "NOT_REPRODUCED", error=repr(e))

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"schema": "bgen.tribunal.probe-results/v1",
                           "subject": "8349de7a5978be6a9984aa33fd59ba3725ebaaca",
                           "probes": results}, indent=2, sort_keys=False) + "\n")
print(f"\nwrote {OUT.relative_to(ROOT)} ({len(results)} probes)")
