"""Rebuild the deterministic R015 closed-transcript and external-anchor fixture."""

from __future__ import annotations

import argparse
import base64
import json
import tempfile
from pathlib import Path

from system.nexus_lab.durable_store import apply_transfer, export_anchor, init_store

from .export_closed_transcript import export_closed_transcript


VALID_CASES = (
    "VALID-T1-SPLIT",
    "VALID-T2-SPLIT",
    "VALID-T3-MERGE",
    "VALID-T4-CREATOR-REMAINS-T2",
)


def rebuild(root: Path, output_dir: Path) -> dict[str, Path]:
    root = Path(root).resolve()
    output_dir = Path(output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    suite_path = (
        root
        / "experiments"
        / "R013_PCX_CONSERVED_CLAIM"
        / "fixtures"
        / "SUITE.json"
    )
    suite = json.loads(suite_path.read_text(encoding="utf-8"))
    valid_history = next(item for item in suite["histories"] if item["history_id"] == "VALID-CHAIN")
    cases = {item["case_id"]: item["raw_b64"] for item in valid_history["cases"]}
    transcript_path = output_dir / "CLOSED_TRANSCRIPT.json"
    anchor_path = output_dir / "EXTERNAL_ANCHOR.json"
    if transcript_path.exists() or anchor_path.exists():
        raise FileExistsError("Fixture rebuild never replaces existing output files.")
    with tempfile.TemporaryDirectory(prefix="nexus-r015-") as work:
        db = Path(work) / "r014.sqlite3"
        init_store(root, db)
        for case_id in VALID_CASES:
            apply_transfer(root, db, base64.b64decode(cases[case_id], validate=True))
        export_anchor(root, db, anchor_path)
        export_closed_transcript(root, db, transcript_path, expected_anchor=json.loads(anchor_path.read_text()))
    return {"transcript": transcript_path, "anchor": anchor_path}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    for label, path in rebuild(args.root, args.output_dir).items():
        print(f"{label}={path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

