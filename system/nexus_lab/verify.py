from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from .audit_integrity import verify_audit_integrity
from .doctor import run_doctor
from .exchange import verify_exchange_ledger, verify_exchange_pack
from .shadow import verify_cold_consumer_report
from .snapshot import verify_snapshot
from .route import verify_manifest_pack
from .util import NexusError, load_json
from .value_kernel import (
    require_r013_evidence_files,
    validate_r013_claim_bindings,
    validate_r013_saved_evidence,
    verify_cross_implementation,
)


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

    exchanges: list[dict[str, Any]] = []
    receipt_root = root / "operations" / "receipts"
    if receipt_root.exists():
        for demo_path in sorted(receipt_root.glob("*/DEMO_REPORT.json")):
            demo = load_json(demo_path)
            if not isinstance(demo, dict) or demo.get("schema") != "nexus.r012-bwx-demo/v0":
                continue
            route_value = demo.get("route")
            if not isinstance(route_value, str):
                raise NexusError(f"Exchange demo has no route binding: {demo_path}")
            route_path = (root / route_value).resolve()
            try:
                route_path.relative_to(root.resolve())
            except ValueError as exc:
                raise NexusError(f"Exchange demo route escapes repository: {demo_path}") from exc
            directory = demo_path.parent
            return_packs = sorted(directory.glob("*-RETURN.zip"))
            if len(return_packs) != 1:
                raise NexusError(f"Exchange demo must contain exactly one return pack: {directory}")
            ledger_path = directory / "SETTLEMENTS.jsonl"
            fixture_root = root / "experiments" / "R012_BOUNDED_WORK_EXCHANGE" / "fixtures" / "cognition_shadow"
            exchanges.append(
                {
                    "demo": str(demo_path.relative_to(root)),
                    "pack": verify_exchange_pack(return_packs[0], route_path=route_path),
                    "ledger": verify_exchange_ledger(ledger_path),
                    "cold_consumer": verify_cold_consumer_report(
                        fixture_root,
                        directory / "COLD_CONSUMER_REPORT.json",
                    ),
                    "reported_status": demo.get("status"),
                    "status_authority": demo.get("status_authority"),
                }
            )

    value_convergence: list[dict[str, Any]] = []
    value_models: list[dict[str, Any]] = []
    status = load_json(root / "STATUS.json")
    if not isinstance(status, dict):
        raise NexusError("STATUS.json must contain an object.")
    active_tasks = status.get("active_tasks", []) if isinstance(status, dict) else []
    r013_declared = (
        "TSK-R013-PCX-CONSERVED-CLAIM" in active_tasks
        or status.get("current_round") == "R013"
        or (root / "operations" / "tasks" / "TSK-R013-PCX-CONSERVED-CLAIM.json").exists()
        or (root / "operations" / "proposals" / "R013_PCX_CONSERVED_CLAIM" / "STATUS.proposal.json").exists()
    )
    if r013_declared:
        paths = require_r013_evidence_files(root)
        model_result = subprocess.run(
            [sys.executable, str(paths["small_model"])],
            cwd=root,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=60,
        )
        if model_result.returncode != 0:
            detail = model_result.stderr.decode("utf-8", errors="replace").strip()
            raise NexusError(f"R013 bounded exhaustive model failed: {detail}")
        model_bytes = paths["model_report"].read_bytes()
        if model_result.stdout != model_bytes:
            raise NexusError("R013 bounded-model report does not reproduce exactly.")
        model_report = load_json(paths["model_report"])
        check = verify_cross_implementation(
            paths["suite"],
            node_verifier=paths["node_verifier"],
            repo_root=root,
        )
        validate_r013_saved_evidence(
            expected_bytes=paths["expected_report"].read_bytes(),
            saved_convergence=load_json(paths["convergence_report"]),
            check=check,
        )
        validate_r013_claim_bindings(
            demo=load_json(paths["demo_report"]),
            proposal_status=load_json(paths["proposal_status"]),
            check=check,
            suite_sha256=hashlib.sha256(paths["suite"].read_bytes()).hexdigest(),
            model_report=model_report,
            model_report_sha256=hashlib.sha256(model_bytes).hexdigest(),
        )
        value_convergence.append(check)
        value_models.append(model_report)

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
        "exchanges": exchanges,
        "value_convergence": value_convergence,
        "value_models": value_models,
        "indexed_objects": object_count,
        "claims": ["All checks represented in this report passed."],
        "non_claims": ["This report does not establish semantic correctness, complete security or external audit."],
    }
