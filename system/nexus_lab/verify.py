from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .audit import check_audit
from .doctor import run_doctor
from .snapshot import verify_snapshot
from .util import NexusError, load_json, sha256_file


def verify_repository(root: Path, *, snapshot: Path | None = None) -> dict[str, Any]:
    doctor = run_doctor(root)
    if doctor["status"] != "PASS":
        raise NexusError("Doctor checks failed:\n" + "\n".join(doctor["errors"]))

    snapshots: list[dict[str, Any]] = []
    targets = [snapshot] if snapshot else sorted((root / "snapshots" / "canonical").glob("*.zip"))
    for path in targets:
        if path is None:
            continue
        sidecar = path.with_suffix(path.suffix + ".sha256")
        expected = None
        if sidecar.is_file():
            first = sidecar.read_text(encoding="utf-8").strip().split()
            if first:
                expected = first[0]
        snapshots.append(verify_snapshot(path, expected_sha256=expected))

    audits: list[dict[str, Any]] = []
    audit_root = root / "operations" / "audits"
    if audit_root.exists():
        for target_json in sorted(audit_root.glob("*/TARGET.json")):
            audits.append(check_audit(root, target_json.parent.name))

    # Index identity and referential checks.
    object_index = root / "corpus" / "indexes" / "objects.jsonl"
    object_count = 0
    if object_index.exists():
        for line_number, line in enumerate(object_index.read_text(encoding="utf-8").splitlines(), start=1):
            if not line.strip():
                continue
            record = json.loads(line)
            object_count += 1
            path = root / record["path"]
            if not path.is_file():
                raise NexusError(f"Object index line {line_number} points to missing file: {record['path']}")

    return {
        "schema": "nexus.verification/v1",
        "status": "PASS",
        "doctor": doctor,
        "snapshots": snapshots,
        "audits": audits,
        "indexed_objects": object_count,
        "claims": ["All checks represented in this report passed."],
        "non_claims": ["This report does not establish semantic correctness, complete security or external audit."],
    }
