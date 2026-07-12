from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path
from typing import Any

from .route import _write_deterministic_zip
from .snapshot import verify_snapshot
from .util import (
    NexusError,
    atomic_write_text,
    canonical_json_bytes,
    load_json,
    pretty_json,
    render_manifest,
    sha256_bytes,
    sha256_file,
    safe_join,
    utc_now,
    validate_identifier,
)

ALLOWED_CLASSIFICATIONS = {
    "OBSERVATION",
    "SUSPECTED_DEFECT",
    "ASSURANCE_GAP",
    "PROCESS_CONTRADICTION",
    "PHILOSOPHICAL_TENSION",
    "ROUTING_FAILURE",
    "UNABLE_TO_VERIFY",
    "NO_FINDING_WITH_SCOPE",
    "NONCOMPLIANT_MUTATION",
    "RECLASSIFICATION_CANDIDATE",
}
ALLOWED_PHASES = {"BLIND", "BRIEFED"}
ALLOWED_LAYERS = {"ARCHIVE", "APPARATUS", "METHODOLOGY", "PHILOSOPHY", "ROUTING", "PRIVACY", "OPERATOR_FRICTION", "OTHER"}
ALLOWED_SEVERITIES = {"UNASSESSED", "INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"}
ALLOWED_CONFIDENCE = {"NON_AUTHORITATIVE", "LOW", "MEDIUM", "HIGH"}
REQUIRED_OBSERVATION_KEYS = {
    "schema", "observation_id", "audit_id", "target_archive_sha256", "target_commit",
    "audit_phase", "audit_layer", "auditor", "classification", "claim", "exact_location",
    "files_seen", "files_not_seen", "evidence_refs", "reproduction", "expected", "actual",
    "severity", "confidence", "limitations", "suggested_next_test", "recommended_future_change",
    "status_authority", "created_at", "previous_record_hash", "record_hash",
}


def _record_hash(record: dict[str, Any]) -> str:
    subject = dict(record)
    subject["record_hash"] = ""
    return sha256_bytes(canonical_json_bytes(subject))


def _audit_dir(root: Path, audit_id: str) -> Path:
    validate_identifier(audit_id, label="audit_id")
    return root / "operations" / "audits" / audit_id


def build_audit_pack(
    root: Path,
    *,
    audit_id: str,
    target_snapshot: Path,
    route_zip: Path | None = None,
) -> dict[str, Any]:
    verification = verify_snapshot(target_snapshot)
    audit_dir = _audit_dir(root, audit_id)
    if audit_dir.exists() and any(audit_dir.iterdir()):
        raise NexusError(f"Audit directory already exists for {audit_id}; never overwrite an audit history in place.")
    audit_dir.mkdir(parents=True, exist_ok=True)
    target_dir = audit_dir / "target"
    target_dir.mkdir(parents=True, exist_ok=True)
    target_copy = target_dir / target_snapshot.name
    shutil.copyfile(target_snapshot, target_copy)
    sidecar_source = target_snapshot.with_suffix(target_snapshot.suffix + ".sha256")
    if sidecar_source.is_file():
        shutil.copyfile(sidecar_source, target_dir / sidecar_source.name)
    route_record = None
    if route_zip:
        from .route import verify_manifest_pack
        route_verification = verify_manifest_pack(route_zip)
        shutil.copyfile(route_zip, audit_dir / route_zip.name)
        route_sidecar = route_zip.with_suffix(route_zip.suffix + ".sha256")
        if route_sidecar.is_file():
            shutil.copyfile(route_sidecar, audit_dir / route_sidecar.name)
        route_record = {"path": route_zip.name, "sha256": route_verification["archive_sha256"], "route_id": route_verification.get("route_id")}

    target = {
        "schema": "nexus.audit-target/v1",
        "audit_id": audit_id,
        "audit_phase": "BLIND",
        "target_status": "CANONICAL_AS_IS",
        "target_snapshot_path": f"target/{target_snapshot.name}",
        "target_archive_sha256": verification["archive_sha256"],
        "target_commit": verification["source_commit"],
        "snapshot_id": verification["snapshot_id"],
        "review_class": "SAME_FAMILY_DIFFERENTIAL",
        "mutation_authority": "NONE",
        "route_pack": route_record,
        "nonclaim": "The target digest identifies bytes; it does not establish correctness, security or completeness.",
    }
    (audit_dir / "TARGET.json").write_text(pretty_json(target), encoding="utf-8")
    charter = f"""# Blind audit charter — {audit_id}\n\nAudit the exact snapshot `{target_snapshot.name}` with SHA-256 `{verification['archive_sha256']}` and source commit `{verification['source_commit']}`.\n\nDo not modify the target. Do not inherit the builder's conclusions. Return append-only observations with `status_authority: NONE`. A passing check is evidence only for the property checked.\n"""
    (audit_dir / "AUDIT_CHARTER.md").write_text(charter, encoding="utf-8")
    test_plan_source = root / "docs" / "CLAUDE_AUDIT_GUIDE.md"
    shutil.copyfile(test_plan_source, audit_dir / "CLAUDE_TEST_PLAN.md")

    template = {
        "schema": "nexus.audit-observation/v1",
        "observation_id": "AUDOBS-R001-CLAUDE-0001",
        "audit_id": audit_id,
        "target_archive_sha256": verification["archive_sha256"],
        "target_commit": verification["source_commit"],
        "audit_phase": "BLIND",
        "audit_layer": "APPARATUS",
        "auditor": {"provider": "Anthropic", "model_family": "Anthropic", "model_name": "", "session_label": "second-account"},
        "classification": "OBSERVATION",
        "claim": "",
        "exact_location": [],
        "files_seen": [],
        "files_not_seen": [],
        "evidence_refs": [],
        "reproduction": [],
        "expected": "",
        "actual": "",
        "severity": "UNASSESSED",
        "confidence": "NON_AUTHORITATIVE",
        "limitations": [],
        "suggested_next_test": "",
        "recommended_future_change": "",
        "status_authority": "NONE",
        "created_at": "",
        "previous_record_hash": "",
        "record_hash": "",
    }
    (audit_dir / "OBSERVATION_TEMPLATE.json").write_text(pretty_json(template), encoding="utf-8")
    (audit_dir / "RETURN_INSTRUCTIONS.md").write_text(
        "# Return instructions\n\nPlace one JSON file per observation under `inbox/claude/`. Validate with `./nexus audit-ingest --audit-id "
        + audit_id + " --check-only <file>`. Do not edit the target, ledger, or implementation during the blind pass.\n",
        encoding="utf-8",
    )
    (audit_dir / "GITHUB_ISSUE_BODY.md").write_text(
        f"# {audit_id}: blind audit\n\nRead `AUDIT_START_HERE.md` and `operations/audits/{audit_id}/TARGET.json`. Run `/nexus-audit` from Claude Code, or inspect the target and latest `Nexus Audit` workflow from GitHub. Return observations only; do not mutate the target.\n",
        encoding="utf-8",
    )
    ledger_dir = audit_dir / "ledger"
    ledger_dir.mkdir(exist_ok=True)
    ledger = ledger_dir / "AUDIT_OBSERVATIONS.jsonl"
    ledger.touch(exist_ok=True)
    (audit_dir / "inbox" / "claude").mkdir(parents=True, exist_ok=True)
    (audit_dir / "inbox" / "claude" / ".gitkeep").touch()

    pack_entries: dict[str, tuple[bytes, bool]] = {}
    for path in sorted(audit_dir.rglob("*")):
        if not path.is_file() or path.name == f"{audit_id}.zip":
            continue
        rel = path.relative_to(audit_dir).as_posix()
        pack_entries[rel] = (path.read_bytes(), False)
    manifest = render_manifest({name: data for name, (data, _) in pack_entries.items()}).encode("utf-8")
    (audit_dir / "MANIFEST.sha256").write_bytes(manifest)
    pack_entries["MANIFEST.sha256"] = (manifest, False)
    pack_path = audit_dir / f"{audit_id}.zip"
    _write_deterministic_zip(pack_path, pack_entries)
    atomic_write_text(pack_path.with_suffix(".zip.sha256"), f"{sha256_file(pack_path)}  {pack_path.name}\n")
    return {**target, "audit_pack_path": pack_path.relative_to(root).as_posix(), "audit_pack_sha256": sha256_file(pack_path)}


def _load_ledger(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    if not path.exists():
        return records
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            raise NexusError(f"Invalid audit ledger JSON on line {line_number}: {exc}") from exc
        records.append(record)
    return records


def validate_observation(root: Path, audit_id: str, observation: dict[str, Any], *, check_chain: bool = True) -> dict[str, Any]:
    audit_dir = _audit_dir(root, audit_id)
    target = load_json(audit_dir / "TARGET.json")
    missing = sorted(REQUIRED_OBSERVATION_KEYS - set(observation))
    extra = sorted(set(observation) - REQUIRED_OBSERVATION_KEYS)
    if missing:
        raise NexusError("Observation is missing required keys: " + ", ".join(missing))
    if extra:
        raise NexusError("Observation has undeclared keys: " + ", ".join(extra))
    validate_identifier(observation.get("observation_id", ""), label="observation_id")
    if observation["schema"] != "nexus.audit-observation/v1":
        raise NexusError("Unsupported observation schema.")
    if observation["audit_id"] != audit_id:
        raise NexusError("Observation audit_id does not match the selected audit.")
    if observation["target_archive_sha256"] != target["target_archive_sha256"]:
        raise NexusError("Observation target archive digest does not match TARGET.json.")
    if observation["target_commit"] != target["target_commit"]:
        raise NexusError("Observation target commit does not match TARGET.json.")
    if observation["status_authority"] != "NONE":
        raise NexusError("Audit observations must declare status_authority NONE.")
    if observation["audit_phase"] not in ALLOWED_PHASES:
        raise NexusError("Invalid audit phase.")
    if observation["classification"] not in ALLOWED_CLASSIFICATIONS:
        raise NexusError("Invalid observation classification.")
    if observation["audit_layer"] not in ALLOWED_LAYERS:
        raise NexusError("Invalid audit layer.")
    if observation["severity"] not in ALLOWED_SEVERITIES:
        raise NexusError("Invalid observation severity.")
    if observation["confidence"] not in ALLOWED_CONFIDENCE:
        raise NexusError("Invalid observation confidence.")
    if not isinstance(observation["claim"], str) or not observation["claim"].strip():
        raise NexusError("Observation claim must be one non-empty claim.")
    if not isinstance(observation["auditor"], dict) or set(observation["auditor"]) != {"provider", "model_family", "model_name", "session_label"}:
        raise NexusError("Observation auditor object has the wrong shape.")
    if not all(isinstance(value, str) for value in observation["auditor"].values()):
        raise NexusError("Observation auditor fields must be strings.")
    for key in ("exact_location", "files_seen", "files_not_seen", "evidence_refs", "reproduction", "limitations"):
        if not isinstance(observation[key], list) or not all(isinstance(x, str) for x in observation[key]):
            raise NexusError(f"Observation field {key} must be a list of strings.")
    if not observation["created_at"]:
        observation["created_at"] = utc_now()

    ledger_path = audit_dir / "ledger" / "AUDIT_OBSERVATIONS.jsonl"
    if not check_chain:
        computed = _record_hash(observation)
        if observation.get("record_hash") != computed:
            raise NexusError(f"Observation record_hash is invalid; computed {computed}.")
        return observation

    records = _load_ledger(ledger_path)
    previous = records[-1]["record_hash"] if records else ""
    supplied_previous = observation.get("previous_record_hash", "")
    if supplied_previous not in ("", previous):
        raise NexusError(f"Observation previous_record_hash does not match ledger head {previous!r}.")
    observation["previous_record_hash"] = previous
    computed = _record_hash(observation)
    supplied_hash = observation.get("record_hash", "")
    if supplied_hash not in ("", computed):
        raise NexusError(f"Observation record_hash is invalid; computed {computed}.")
    observation["record_hash"] = computed
    if any(record.get("observation_id") == observation["observation_id"] for record in records):
        raise NexusError(f"Duplicate observation_id: {observation['observation_id']}")
    return observation


def ingest_observation(root: Path, audit_id: str, path: Path, *, check_only: bool = False) -> dict[str, Any]:
    observation = load_json(path)
    if not isinstance(observation, dict):
        raise NexusError("Observation root must be a JSON object.")
    validated = validate_observation(root, audit_id, observation)
    if check_only:
        return {"valid": True, "check_only": True, "record_hash": validated["record_hash"]}
    ledger = _audit_dir(root, audit_id) / "ledger" / "AUDIT_OBSERVATIONS.jsonl"
    with ledger.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(canonical_json_bytes(validated).decode("utf-8"))
    accepted_dir = _audit_dir(root, audit_id) / "accepted"
    accepted_dir.mkdir(exist_ok=True)
    (accepted_dir / f"{validated['observation_id']}.json").write_text(pretty_json(validated), encoding="utf-8")
    return {"valid": True, "check_only": False, "record_hash": validated["record_hash"], "ledger": str(ledger)}


def check_audit(root: Path, audit_id: str) -> dict[str, Any]:
    audit_dir = _audit_dir(root, audit_id)
    target = load_json(audit_dir / "TARGET.json")
    snapshot = safe_join(audit_dir, target["target_snapshot_path"])
    verification = verify_snapshot(snapshot, expected_sha256=target["target_archive_sha256"])
    route_record = target.get("route_pack")
    if route_record:
        from .route import verify_manifest_pack
        route_path = safe_join(audit_dir, route_record["path"])
        route_verification = verify_manifest_pack(route_path)
        if route_verification["archive_sha256"] != route_record["sha256"]:
            raise NexusError("Audit route pack digest does not match TARGET.json.")
    records = _load_ledger(audit_dir / "ledger" / "AUDIT_OBSERVATIONS.jsonl")
    previous = ""
    seen: set[str] = set()
    for index, record in enumerate(records, start=1):
        if record.get("observation_id") in seen:
            raise NexusError(f"Duplicate observation ID on audit ledger line {index}.")
        seen.add(record.get("observation_id", ""))
        if record.get("previous_record_hash") != previous:
            raise NexusError(f"Audit ledger chain break on line {index}.")
        expected = _record_hash(record)
        if record.get("record_hash") != expected:
            raise NexusError(f"Audit ledger record hash mismatch on line {index}.")
        validate_observation(root, audit_id, dict(record), check_chain=False)
        previous = record["record_hash"]
    return {
        "audit_id": audit_id,
        "target_sha256": verification["archive_sha256"],
        "target_commit": verification["source_commit"],
        "observation_count": len(records),
        "ledger_head": previous,
        "status": "PASS",
    }
