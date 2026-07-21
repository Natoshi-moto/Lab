#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from system.nexus_lab.custody_kernel import canonical_json  # noqa: E402
from system.nexus_lab.replication import load_campaign, run_campaign  # noqa: E402


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        raise SystemExit("usage: run_campaign.py COMPOUND_CAMPAIGN.json")
    report = run_campaign(load_campaign(Path(argv[1])))
    sys.stdout.buffer.write(canonical_json(report) + b"\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
