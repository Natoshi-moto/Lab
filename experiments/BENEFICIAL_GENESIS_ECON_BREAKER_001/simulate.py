#!/usr/bin/env python3
"""Deterministic scenario runner for BGEN-ECON-BREAKER-001.

Usage (from repository root):
  python3 experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/simulate.py
  python3 experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/simulate.py --scenario 01_whale_50
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from model.scenario import run_scenario  # noqa: E402


def load_scenarios(scenarios_dir: Path) -> list[dict]:
    files = sorted(scenarios_dir.glob("*.json"))
    out = []
    for f in files:
        with f.open("r", encoding="utf-8") as fh:
            out.append(json.load(fh))
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="BGEN econ breaker simulator")
    parser.add_argument("--scenario", help="Run a single scenario id (filename stem or id field)")
    parser.add_argument("--scenarios-dir", type=Path, default=ROOT / "scenarios")
    parser.add_argument("--results-dir", type=Path, default=ROOT / "results")
    args = parser.parse_args(argv)

    args.results_dir.mkdir(parents=True, exist_ok=True)
    scenarios = load_scenarios(args.scenarios_dir)
    if not scenarios:
        print("ERROR: no scenarios found", file=sys.stderr)
        return 2

    if args.scenario:
        scenarios = [
            s
            for s in scenarios
            if s.get("id") == args.scenario or s.get("id", "").startswith(args.scenario)
        ]
        if not scenarios:
            print(f"ERROR: scenario not found: {args.scenario}", file=sys.stderr)
            return 2

    summary = []
    for spec in scenarios:
        result = run_scenario(spec)
        out_path = args.results_dir / f"{result['id']}.json"
        with out_path.open("w", encoding="utf-8") as fh:
            json.dump(result, fh, indent=2, sort_keys=True)
            fh.write("\n")
        summary.append(
            {
                "id": result["id"],
                "title": result["title"],
                "rule": result["allocation"]["rule"],
                "total_eligible_sats": result["allocation"]["total_eligible_sats"],
                "total_issued": result["allocation"]["total_issued"],
                "remainder_unissued": result["allocation"]["remainder_unissued"],
                "top1_share_of_issued": result["concentration"]["top1_share_of_issued"],
                "gini_of_issued_units": result["concentration"]["gini_of_issued_units"],
                "hhi_of_issued_units": result["concentration"]["hhi_of_issued_units"],
                "path": str(out_path.relative_to(ROOT)),
            }
        )
        print(f"OK {result['id']}: issued={result['allocation']['total_issued']} "
              f"top1_issued={result['concentration']['top1_share_of_issued']:.4f}")

    summary_path = args.results_dir / "SUMMARY.json"
    with summary_path.open("w", encoding="utf-8") as fh:
        json.dump(
            {
                "schema": "bgen.econ-breaker-001.summary/v1",
                "n_scenarios": len(summary),
                "scenarios": summary,
            },
            fh,
            indent=2,
            sort_keys=True,
        )
        fh.write("\n")

    # Markdown tables
    lines = [
        "# Concentration / welfare tables (synthetic)",
        "",
        "Evidence class: deterministic synthetic simulation. Not empirical.",
        "",
        "| id | rule | eligible_sats | issued | remainder | top1_share_of_issued | gini | HHI |",
        "|----|------|---------------|--------|-----------|----------------------|------|-----|",
    ]
    for s in summary:
        lines.append(
            f"| {s['id']} | {s['rule']} | {s['total_eligible_sats']} | {s['total_issued']} | "
            f"{s['remainder_unissued']} | {s['top1_share_of_issued']:.6f} | "
            f"{s['gini_of_issued_units']:.6f} | {s['hhi_of_issued_units']:.6f} |"
        )
    lines.append("")
    lines.append("Denominator note: `top1_share_of_issued` uses actually issued units, not the fixed pool.")
    lines.append("")
    tables_path = args.results_dir / "TABLES.md"
    tables_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {summary_path} and {tables_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
