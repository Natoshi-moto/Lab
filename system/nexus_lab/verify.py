from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .audit_integrity import verify_audit_integrity
from .doctor import run_doctor
from .snapshot import verify_snapshot
from .route import verify_manifest_pack
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

    packs: list[dict[str, Any]] = []
    for pack in sorted((root / "operations" / "routes").glob("*.zip")):
        packs.append(verify_manifest_pack(pack))

    audits: list[dict[str, Any]] = []
    audit_root = root / "operations" / "audits"
    if audit_root.exists():
        for target_json in sorted(audit_root.glob("*/TARGET.json")):
            audit_id = target_json.parent.name
            audits.append(verify_audit_integrity(root, audit_id))
            audit_pack = target_json.parent / f"{audit_id}.zip"
            if audit_pack.is_file():
                packs.append(verify_manifest_pack(audit_pack))

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
        "packs": packs,
        "indexed_objects": object_count,
        "claims": ["All checks represented in this report passed."],
        "non_claims": ["This report does not establish semantic correctness, complete security or external audit."],
    }
