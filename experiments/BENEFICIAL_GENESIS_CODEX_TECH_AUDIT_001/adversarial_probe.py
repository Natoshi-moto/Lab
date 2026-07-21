#!/usr/bin/env python3
"""Deterministic read-only adversarial probe for BGEN-CODEX-TECH-AUDIT-001."""

from __future__ import annotations

import json
import random
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SUBJECT = REPO / "experiments" / "BENEFICIAL_GENESIS_ECON_REDTEAM_001"
sys.path.insert(0, str(SUBJECT))

from model.allocation import random_lottery_component  # noqa: E402
from model.scenario import run_scenario  # noqa: E402


def main() -> int:
    pool = 100
    direct = random_lottery_component(
        [("only_donor", 1)],
        pool,
        random.Random(1),
        lottery_share_bps=-1_000,
        winners=1,
    )
    scenario = run_scenario(
        {
            "scenario_id": "codex_negative_lottery_share_probe",
            "seed": 1,
            "pool_units": pool,
            "allocation_scheme": "RANDOM_LOTTERY_COMPONENT",
            "scheme_params": {"lottery_share_bps": -1_000, "winners": 1},
            "donors": [{"id": "only_donor", "sats": 1}],
        }
    )
    result = {
        "schema": "bgen.codex-tech-audit.adversarial-results/v1",
        "subject_commit": "8349de7a5978be6a9984aa33fd59ba3725ebaaca",
        "probe": "NEGATIVE_LOTTERY_SHARE_SUPPLY_INVARIANT",
        "input": {
            "donors": [["only_donor", 1]],
            "pool": pool,
            "lottery_share_bps": -1_000,
            "winners": 1,
            "seed": 1,
        },
        "expected": "REJECT_INVALID_LOTTERY_SHARE_BPS",
        "actual": {
            "direct_allocation": direct,
            "direct_total_issued": sum(direct.values()),
            "scenario_unissued_remainder": scenario["unissued_remainder"],
        },
        "invariant": "total_issued <= pool and unissued_remainder >= 0",
        "invariant_holds": sum(direct.values()) <= pool
        and scenario["unissued_remainder"] >= 0,
        "status_authority": "NONE",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 1 if result["invariant_holds"] else 0


if __name__ == "__main__":
    raise SystemExit(main())

