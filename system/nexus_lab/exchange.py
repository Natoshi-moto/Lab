from __future__ import annotations

import json
import os
import re
import stat
import threading
import zipfile
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any
from functools import wraps

from .util import (
    NexusError,
    atomic_write_text,
    canonical_json_bytes,
    pretty_json,
    render_manifest,
    safe_join,
    sha256_bytes,
    sha256_file,
    validate_identifier,
)


FIXED_ZIP_TIME = (1980, 1, 1, 0, 0, 0)
WORK_RETURN_SCHEMA = "nexus.work-return/v0"
EXCHANGE_RECEIPT_SCHEMA = "nexus.exchange-receipt/v0"
MAX_RETURN_PACK_BYTES = 1024 * 1024
MAX_RETURN_MEMBERS = 32
MAX_RETURN_MEMBER_BYTES = 256 * 1024
MAX_ROUTE_PACK_BYTES = 20 * 1024 * 1024
MAX_ROUTE_MEMBERS = 4096
MAX_ROUTE_MEMBER_BYTES = 5 * 1024 * 1024
ALLOWED_ARTIFACT_SUFFIXES = {".json", ".md", ".txt"}
ALLOWED_MEDIA_TYPES = {"application/json", "text/markdown", "text/plain"}
ALLOWED_DATA_CLASSES = {"PUBLIC_FIXTURE", "SYNTHETIC_FIXTURE", "LAB_PRIVATE_MINIMIZED"}
ALLOWED_INDEPENDENCE = {"NOT_CLAIMED", "CORRELATED", "INDEPENDENT_UNVERIFIED"}
ALLOWED_CLAIM_CLASSES = {"EVIDENCE", "INFERENCE", "HYPOTHESIS", "UNVERIFIED", "FALSIFIED"}
ALLOWED_DISSENT_STATES = {"OPEN", "ANSWERED", "FALSIFIER_VALID", "REJECTED"}
ALLOWED_DECISIONS = {"ACCEPTED", "REJECTED", "CHALLENGED", "STALE", "EXPIRED"}
HASH64 = re.compile(r"^[0-9a-f]{64}$")
HASH40 = re.compile(r"^[0-9a-f]{40}$")
EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
SECRET_PATTERNS = {
    "OPENAI_STYLE_KEY": re.compile(r"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b"),
    "ANTHROPIC_STYLE_KEY": re.compile(r"\bsk-ant-[A-Za-z0-9_-]{20,}\b"),
    "GITHUB_CLASSIC_TOKEN": re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    "GITHUB_FINE_GRAINED_TOKEN": re.compile(r"\bgithub_pat_[A-Za-z0-9_]{40,}\b"),
    "AWS_ACCESS_KEY": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "PRIVATE_KEY_BLOCK": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "SYNTHETIC_SECRET_CANARY": re.compile(r"\bNEXUS-SYNTHETIC-SECRET-[A-Z0-9]{6,}\b"),
}

RETURN_KEYS = {
    "schema",
    "exchange_id",
    "task_sha256",
    "route_sha256",
    "baseline_commit",
    "producer",
    "recipient",
    "epoch_id",
    "nonce",
    "created_at",
    "expires_at",
    "source_root",
    "data_classes",
    "artifacts",
    "claims",
    "non_claims",
    "dissent",
    "predecessor_state_hash",
    "status_authority",
    "return_hash",
}
RECEIPT_KEYS = {
    "schema",
    "receipt_id",
    "sequence",
    "exchange_id",
    "return_hash",
    "task_sha256",
    "route_sha256",
    "decision",
    "reason_codes",
    "previous_receipt_hash",
    "previous_state_hash",
    "next_state_hash",
    "created_at",
    "status_authority",
    "receipt_hash",
}
MAX_DRAFT_BYTES = 256 * 1024
MAX_LEDGER_BYTES = 8 * 1024 * 1024
MAX_LEDGER_LINE_BYTES = 64 * 1024
_LOCKS_GUARD = threading.Lock()
_LEDGER_LOCKS: dict[str, threading.Lock] = {}


class ExchangeError(NexusError):
    """Machine-classified bounded-exchange failure."""

    def __init__(self, code: str, detail: str) -> None:
        self.code = code
        self.detail = detail
        super().__init__(f"{code}: {detail}")


def _error_code(detail: str) -> str:
    lowered = detail.lower()
    rules = (
        ("instruction", "INSTRUCTION_CANARY_OBEYED"),
        ("secret-shaped", "SECRET_CANARY_LEAK"),
        ("personal data", "PII_CANARY_LEAK"),
        ("email-shaped", "PII_CANARY_LEAK"),
        ("member-count", "SIZE_LIMIT_EXCEEDED"),
        ("size limit", "SIZE_LIMIT_EXCEEDED"),
        ("exceeds", "SIZE_LIMIT_EXCEEDED"),
        ("duplicate member", "DUPLICATE_MEMBER"),
        ("unsafe archive", "UNSAFE_PATH"),
        ("non-canonical archive", "UNSAFE_PATH"),
        ("manifest", "MANIFEST_MISMATCH"),
        ("recipient", "RECIPIENT_MISMATCH"),
        ("different task", "TASK_BINDING_MISMATCH"),
        ("task_sha256", "TASK_BINDING_MISMATCH"),
        ("different route", "ROUTE_BINDING_MISMATCH"),
        ("route_sha256", "ROUTE_BINDING_MISMATCH"),
        ("different baseline", "BASELINE_MISMATCH"),
        ("artifact binding", "ARTIFACT_HASH_MISMATCH"),
        ("artifact is missing", "ARTIFACT_MISSING"),
        ("source", "SOURCE_BINDING_INVALID"),
        ("shadow", "SHADOW_BINDING_INVALID"),
        ("return_hash", "RETURN_HASH_MISMATCH"),
    )
    for fragment, code in rules:
        if fragment in lowered:
            return code
    return "SCHEMA_INVALID"


def exchange_boundary(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except ExchangeError:
            raise
        except NexusError as exc:
            raise ExchangeError(_error_code(str(exc)), str(exc)) from exc

    return wrapped


def _object_without_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    value: dict[str, Any] = {}
    for key, item in pairs:
        if key in value:
            raise NexusError(f"Duplicate JSON object key: {key}")
        value[key] = item
    return value


def strict_json_bytes(data: bytes, *, label: str) -> Any:
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise NexusError(f"{label} is not UTF-8.") from exc
    try:
        def reject_constant(value: str) -> None:
            raise NexusError(f"{label} contains non-finite JSON number {value}.")

        return json.loads(
            text,
            object_pairs_hook=_object_without_duplicate_keys,
            parse_constant=reject_constant,
        )
    except json.JSONDecodeError as exc:
        raise NexusError(f"Invalid JSON in {label}: {exc}") from exc


def _require_exact_keys(value: dict[str, Any], expected: set[str], *, label: str) -> None:
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing:
        raise NexusError(f"{label} is missing required keys: {', '.join(missing)}")
    if extra:
        raise NexusError(f"{label} has undeclared keys: {', '.join(extra)}")


def _require_hash(value: Any, *, label: str, empty_allowed: bool = False) -> str:
    if empty_allowed and value == "":
        return value
    if not isinstance(value, str) or HASH64.fullmatch(value) is None:
        raise NexusError(f"{label} must be a lowercase SHA-256 digest.")
    return value


def _parse_time(value: Any, *, label: str) -> datetime:
    if not isinstance(value, str) or not value:
        raise NexusError(f"{label} must be a non-empty timestamp.")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise NexusError(f"{label} must be an ISO-8601 timestamp.") from exc
    if parsed.tzinfo is None:
        raise NexusError(f"{label} must include a timezone.")
    return parsed.astimezone(timezone.utc)


def _iso_z(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _canonical_member_name(name: str) -> str:
    if not name or name.endswith("/") or "//" in name or "\\" in name:
        raise NexusError(f"Unsafe archive member path: {name!r}")
    path = PurePosixPath(name)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise NexusError(f"Unsafe archive member path: {name!r}")
    if path.as_posix() != name or path.parts[0] == ".git":
        raise NexusError(f"Non-canonical archive member path: {name!r}")
    return name


def _read_zip(
    path: Path,
    *,
    max_archive_bytes: int,
    max_members: int,
    max_member_bytes: int,
) -> dict[str, bytes]:
    if not path.is_file():
        raise NexusError(f"Pack is missing: {path}")
    if path.stat().st_size > max_archive_bytes:
        raise NexusError(f"Pack exceeds compressed-size limit: {path}")
    entries: dict[str, bytes] = {}
    total = 0
    try:
        archive = zipfile.ZipFile(path, "r")
    except zipfile.BadZipFile as exc:
        raise NexusError(f"Invalid ZIP pack: {path}") from exc
    with archive:
        infos = archive.infolist()
        names = [info.filename for info in infos]
        if len(infos) > max_members:
            raise NexusError(f"Pack exceeds member-count limit: {path}")
        if len(names) != len(set(names)):
            raise NexusError(f"Pack contains duplicate member names: {path}")
        if names != sorted(names):
            raise NexusError(f"Pack member order is not deterministic: {path}")
        for info in infos:
            name = _canonical_member_name(info.filename)
            if info.flag_bits & 0x1:
                raise NexusError(f"Encrypted archive members are forbidden: {name}")
            if info.compress_type != zipfile.ZIP_DEFLATED:
                raise NexusError(f"Pack member uses unsupported compression: {name}")
            mode = (info.external_attr >> 16) & 0xFFFF
            if stat.S_ISLNK(mode):
                raise NexusError(f"Pack contains a symbolic link: {name}")
            if not stat.S_ISREG(mode):
                raise NexusError(f"Pack member type is not a regular file: {name}")
            if info.date_time != FIXED_ZIP_TIME:
                raise NexusError(f"Pack member timestamp is not deterministic: {name}")
            if info.file_size > max_member_bytes:
                raise NexusError(f"Pack member exceeds size limit: {name}")
            total += info.file_size
            if total > max_archive_bytes:
                raise NexusError(f"Pack exceeds uncompressed-size limit: {path}")
            with archive.open(info, "r") as handle:
                data = handle.read(max_member_bytes + 1)
            if len(data) != info.file_size or len(data) > max_member_bytes:
                raise NexusError(f"Pack member failed bounded read: {name}")
            entries[name] = data
    return entries


def _parse_manifest(data: bytes) -> dict[str, str]:
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise NexusError("MANIFEST.sha256 is not UTF-8.") from exc
    result: dict[str, str] = {}
    for line_number, raw in enumerate(text.splitlines(), start=1):
        if not raw:
            continue
        if "  " not in raw:
            raise NexusError(f"Malformed manifest line {line_number}.")
        digest, name = raw.split("  ", 1)
        _require_hash(digest, label=f"manifest line {line_number}")
        _canonical_member_name(name)
        if name in result:
            raise NexusError(f"Duplicate manifest path: {name}")
        result[name] = digest
    return result


def _verify_manifest(entries: dict[str, bytes]) -> None:
    if "MANIFEST.sha256" not in entries:
        raise NexusError("Pack has no MANIFEST.sha256.")
    manifest = _parse_manifest(entries["MANIFEST.sha256"])
    subject = {name: data for name, data in entries.items() if name != "MANIFEST.sha256"}
    if set(manifest) != set(subject):
        raise NexusError("Pack manifest member set does not match the archive.")
    for name, expected in manifest.items():
        if sha256_bytes(subject[name]) != expected:
            raise NexusError(f"Pack manifest digest mismatch for {name}.")


def _scan_text(data: bytes, *, label: str) -> str:
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise NexusError(f"{label} is not UTF-8 text.") from exc
    for kind, pattern in SECRET_PATTERNS.items():
        if pattern.search(text):
            raise NexusError(f"{label} contains forbidden secret-shaped content: {kind}")
    if EMAIL.search(text):
        raise NexusError(f"{label} contains email-shaped personal data.")
    return text


def _write_deterministic_zip(path: Path, entries: dict[str, bytes]) -> None:
    if path.exists():
        raise NexusError(f"Refusing to overwrite exchange pack: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in sorted(entries):
            _canonical_member_name(name)
            info = zipfile.ZipInfo(name, FIXED_ZIP_TIME)
            info.create_system = 3
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            info.flag_bits |= 0x800
            archive.writestr(info, entries[name], compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def _return_exchange_id(record: dict[str, Any]) -> str:
    subject = {
        "schema": WORK_RETURN_SCHEMA,
        "task_sha256": record["task_sha256"],
        "route_sha256": record["route_sha256"],
        "baseline_commit": record["baseline_commit"],
        "producer_seat_id": record["producer"]["seat_id"],
        "recipient": record["recipient"],
        "epoch_id": record["epoch_id"],
        "nonce": record["nonce"],
    }
    return sha256_bytes(canonical_json_bytes(subject))


def _return_hash(record: dict[str, Any]) -> str:
    subject = dict(record)
    subject["return_hash"] = ""
    return sha256_bytes(canonical_json_bytes(subject))


def _validate_work_return(record: Any) -> dict[str, Any]:
    if not isinstance(record, dict):
        raise NexusError("WORK_RETURN.json root must be an object.")
    _require_exact_keys(record, RETURN_KEYS, label="Work return")
    if record["schema"] != WORK_RETURN_SCHEMA:
        raise NexusError("Unsupported work-return schema.")
    for key in ("task_sha256", "route_sha256", "source_root", "return_hash", "exchange_id"):
        _require_hash(record[key], label=key)
    _require_hash(record["predecessor_state_hash"], label="predecessor_state_hash", empty_allowed=True)
    if not isinstance(record["baseline_commit"], str) or HASH40.fullmatch(record["baseline_commit"]) is None:
        raise NexusError("baseline_commit must be a lowercase 40-character Git commit.")
    for key in ("recipient", "epoch_id", "nonce"):
        validate_identifier(record[key], label=key)
    created = _parse_time(record["created_at"], label="created_at")
    expires = _parse_time(record["expires_at"], label="expires_at")
    if expires <= created:
        raise NexusError("expires_at must be later than created_at.")
    if record["status_authority"] != "NONE":
        raise NexusError("Work returns must declare status_authority NONE.")

    producer = record["producer"]
    if not isinstance(producer, dict):
        raise NexusError("producer must be an object.")
    _require_exact_keys(producer, {"seat_id", "provider_family", "session_label", "independence"}, label="producer")
    for key in ("seat_id", "provider_family", "session_label"):
        validate_identifier(producer[key], label=f"producer.{key}")
    if producer["independence"] not in ALLOWED_INDEPENDENCE:
        raise NexusError("producer.independence is unsupported; verified independence is not a V0 claim.")

    data_classes = record["data_classes"]
    if not isinstance(data_classes, list) or not data_classes or len(data_classes) != len(set(data_classes)):
        raise NexusError("data_classes must be a non-empty unique list.")
    if any(item not in ALLOWED_DATA_CLASSES for item in data_classes):
        raise NexusError("Work return declares a forbidden data class.")

    artifacts = record["artifacts"]
    if not isinstance(artifacts, list) or not artifacts or len(artifacts) > 16:
        raise NexusError("artifacts must contain between 1 and 16 records.")
    artifact_paths: set[str] = set()
    for index, artifact in enumerate(artifacts):
        if not isinstance(artifact, dict):
            raise NexusError(f"artifact {index} must be an object.")
        _require_exact_keys(artifact, {"path", "sha256", "bytes", "media_type"}, label=f"artifact {index}")
        path = _canonical_member_name(artifact["path"])
        if not path.startswith("artifacts/") or PurePosixPath(path).suffix.lower() not in ALLOWED_ARTIFACT_SUFFIXES:
            raise NexusError(f"artifact {index} has a forbidden path or type.")
        if path in artifact_paths:
            raise NexusError(f"Duplicate artifact path: {path}")
        artifact_paths.add(path)
        _require_hash(artifact["sha256"], label=f"artifact {index} sha256")
        if not isinstance(artifact["bytes"], int) or isinstance(artifact["bytes"], bool) or not 0 <= artifact["bytes"] <= MAX_RETURN_MEMBER_BYTES:
            raise NexusError(f"artifact {index} has an invalid byte count.")
        if artifact["media_type"] not in ALLOWED_MEDIA_TYPES:
            raise NexusError(f"artifact {index} has a forbidden media type.")

    claims = record["claims"]
    if not isinstance(claims, list):
        raise NexusError("claims must be a list.")
    claim_ids: set[str] = set()
    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            raise NexusError(f"claim {index} must be an object.")
        _require_exact_keys(claim, {"claim_id", "statement", "classification", "evidence_refs"}, label=f"claim {index}")
        validate_identifier(claim["claim_id"], label=f"claim {index} id")
        if claim["claim_id"] in claim_ids:
            raise NexusError(f"Duplicate claim_id: {claim['claim_id']}")
        claim_ids.add(claim["claim_id"])
        if not isinstance(claim["statement"], str) or not claim["statement"].strip():
            raise NexusError(f"claim {index} statement must be non-empty.")
        if claim["classification"] not in ALLOWED_CLAIM_CLASSES:
            raise NexusError(f"claim {index} has an invalid classification.")
        if not isinstance(claim["evidence_refs"], list) or not all(isinstance(item, str) and item for item in claim["evidence_refs"]):
            raise NexusError(f"claim {index} evidence_refs must be strings.")
        if claim["classification"] == "EVIDENCE" and not claim["evidence_refs"]:
            raise NexusError(f"claim {index} labels evidence without an evidence reference.")

    if not isinstance(record["non_claims"], list) or not all(isinstance(item, str) and item.strip() for item in record["non_claims"]):
        raise NexusError("non_claims must be a list of non-empty strings.")
    dissent = record["dissent"]
    if not isinstance(dissent, list):
        raise NexusError("dissent must be a list.")
    dissent_ids: set[str] = set()
    for index, item in enumerate(dissent):
        if not isinstance(item, dict):
            raise NexusError(f"dissent {index} must be an object.")
        _require_exact_keys(item, {"dissent_id", "claim_id", "status", "reason", "evidence_refs"}, label=f"dissent {index}")
        validate_identifier(item["dissent_id"], label=f"dissent {index} id")
        if item["dissent_id"] in dissent_ids:
            raise NexusError(f"Duplicate dissent_id: {item['dissent_id']}")
        dissent_ids.add(item["dissent_id"])
        if item["claim_id"] not in claim_ids:
            raise NexusError(f"dissent {index} references an unknown claim.")
        if item["status"] not in ALLOWED_DISSENT_STATES:
            raise NexusError(f"dissent {index} has an invalid status.")
        if not isinstance(item["reason"], str) or not item["reason"].strip():
            raise NexusError(f"dissent {index} reason must be non-empty.")
        if not isinstance(item["evidence_refs"], list) or not all(isinstance(ref, str) and ref for ref in item["evidence_refs"]):
            raise NexusError(f"dissent {index} evidence_refs must be strings.")

    expected_exchange = _return_exchange_id(record)
    if record["exchange_id"] != expected_exchange:
        raise NexusError(f"exchange_id is invalid; computed {expected_exchange}.")
    expected_return = _return_hash(record)
    if record["return_hash"] != expected_return:
        raise NexusError(f"return_hash is invalid; computed {expected_return}.")
    return record


def _inspect_route_pack(path: Path) -> dict[str, Any]:
    entries = _read_zip(
        path,
        max_archive_bytes=MAX_ROUTE_PACK_BYTES,
        max_members=MAX_ROUTE_MEMBERS,
        max_member_bytes=MAX_ROUTE_MEMBER_BYTES,
    )
    _verify_manifest(entries)
    for required in ("TASK.json", "ROUTE.json", "OUTPUT_SCHEMA.json"):
        if required not in entries:
            raise NexusError(f"Route pack is missing {required}.")
    task = strict_json_bytes(entries["TASK.json"], label="route TASK.json")
    route = strict_json_bytes(entries["ROUTE.json"], label="route ROUTE.json")
    strict_json_bytes(entries["OUTPUT_SCHEMA.json"], label="route OUTPUT_SCHEMA.json")
    if not isinstance(task, dict) or not isinstance(route, dict):
        raise NexusError("Route task and route roots must be objects.")
    if task.get("schema") != "nexus.task/v1" or route.get("schema") != "nexus.route/v1":
        raise NexusError("Unsupported task or route schema.")
    task_hash = sha256_bytes(canonical_json_bytes(task))
    if route.get("task_sha256") != task_hash:
        raise NexusError("Route TASK.json does not match task_sha256.")
    baseline = route.get("baseline_commit")
    if not isinstance(baseline, str) or HASH40.fullmatch(baseline) is None:
        raise NexusError("Route baseline_commit is invalid.")
    included = route.get("included")
    if not isinstance(included, list):
        raise NexusError("Route included must be a list.")
    for index, item in enumerate(included):
        if not isinstance(item, dict) or not isinstance(item.get("path"), str) or not isinstance(item.get("sha256"), str):
            raise NexusError(f"Route included record {index} has the wrong shape.")
        member = "context/" + _canonical_member_name(item["path"])
        if member not in entries or sha256_bytes(entries[member]) != item["sha256"]:
            raise NexusError(f"Route included-context binding failed for {item['path']}.")
    output_contract = task.get("output_contract")
    if not isinstance(output_contract, dict):
        raise NexusError("Route task output_contract must be an object.")
    return {
        "route_id": route.get("route_id"),
        "task_id": route.get("task_id"),
        "task_sha256": task_hash,
        "baseline_commit": baseline,
        "route_sha256": sha256_file(path),
        "member_count": len(entries),
        "task": task,
        "route": route,
        "entries": entries,
        "output_contract": output_contract,
    }


@exchange_boundary
def verify_route_pack(path: Path) -> dict[str, Any]:
    inspected = _inspect_route_pack(path)
    return {key: value for key, value in inspected.items() if key not in {"task", "route", "entries", "output_contract"}}


def _exchange_contract(route: dict[str, Any]) -> dict[str, Any]:
    contract = route["output_contract"].get("exchange_contract")
    if not isinstance(contract, dict):
        raise NexusError("Route task has no hash-bound exchange contract/offer anchor.")
    expected = {
        "producer_seat",
        "recipient",
        "epoch_id",
        "source_profile",
        "sources",
        "source_root",
        "forbidden_output_literals",
    }
    _require_exact_keys(contract, expected, label="Exchange contract")
    for key in ("producer_seat", "recipient", "epoch_id"):
        validate_identifier(contract[key], label=f"exchange contract {key}")
    if contract["source_profile"] != "EXACT_ROUTE_CONTEXT":
        raise NexusError("Unsupported exchange-contract source profile.")
    if not isinstance(contract["sources"], list) or not contract["sources"]:
        raise NexusError("Exchange contract must declare a non-empty source list.")
    _require_hash(contract["source_root"], label="exchange contract source_root")
    literals = contract["forbidden_output_literals"]
    if not isinstance(literals, list) or len(literals) != len(set(literals)) or not all(
        isinstance(item, str) and item for item in literals
    ):
        raise NexusError("Exchange contract forbidden_output_literals must be unique strings.")
    return contract


def _verify_useful_work(
    record: dict[str, Any],
    entries: dict[str, bytes],
    route: dict[str, Any],
) -> dict[str, Any]:
    from .shadow import source_root_for, validate_cognition_shadow

    contract = _exchange_contract(route)
    if record["producer"]["seat_id"] != contract["producer_seat"]:
        raise NexusError("Work-return producer seat does not match the route-bound offer.")
    if record["recipient"] != contract["recipient"]:
        raise NexusError("Work-return recipient does not match the route-bound offer.")
    if record["epoch_id"] != contract["epoch_id"]:
        raise NexusError("Work-return epoch does not match the route-bound offer.")
    if record["source_root"] != contract["source_root"]:
        raise NexusError("Work-return source_root binding does not match the route-bound offer.")
    if source_root_for(contract["sources"]) != contract["source_root"]:
        raise NexusError("Route-bound exchange contract has an invalid source_root.")

    source_entries: dict[str, bytes] = {}
    for source in contract["sources"]:
        if not isinstance(source, dict) or not isinstance(source.get("path"), str):
            raise NexusError("Route-bound exchange source contract has the wrong shape.")
        member = "context/" + _canonical_member_name(source["path"])
        if member not in route["entries"]:
            raise NexusError(f"Route-bound exchange source is missing from context: {source['path']}")
        source_entries[source["path"]] = route["entries"][member]

    shadow_name = "artifacts/SHADOW.json"
    if shadow_name not in entries:
        raise NexusError("Bounded work return has no artifacts/SHADOW.json useful-work output.")
    invariants = route["output_contract"].get("required_invariants", [])
    if not isinstance(invariants, list):
        raise NexusError("Route output contract required_invariants must be a list.")
    shadow_report = validate_cognition_shadow(
        entries[shadow_name],
        source_entries,
        source_contract=contract["sources"],
        expected_source_root=contract["source_root"],
        expected_exchange_id=record["exchange_id"],
        required_invariants=invariants,
        forbidden_literals=tuple(contract["forbidden_output_literals"]),
    )

    falsifiers: dict[str, bool] = {}
    for artifact in record["artifacts"]:
        name = artifact["path"]
        if not name.endswith("FALSIFIER.json"):
            continue
        value = strict_json_bytes(entries[name], label=name)
        if not isinstance(value, dict):
            raise NexusError(f"Falsifier artifact root must be an object: {name}")
        _require_exact_keys(
            value,
            {"schema", "falsifier_id", "invariant_id", "assertion", "evidence_refs"},
            label=f"Falsifier artifact {name}",
        )
        if value["schema"] != "nexus.falsifier/v0":
            raise NexusError(f"Unsupported falsifier schema: {name}")
        falsifier_id = validate_identifier(value["falsifier_id"], label="falsifier_id")
        invariant_id = validate_identifier(value["invariant_id"], label="falsifier invariant_id")
        invariant_result = shadow_report["invariant_results"].get(invariant_id)
        if invariant_result is None:
            raise NexusError(f"Falsifier targets an unknown task invariant: {invariant_id}")
        expected_assertion = "SATISFIED" if invariant_result else "FAILED"
        if value["assertion"] != expected_assertion:
            raise NexusError(f"Falsifier assertion does not match machine recomputation: {falsifier_id}")
        if value["evidence_refs"] != [shadow_name]:
            raise NexusError(f"Falsifier evidence_refs do not bind the cognition shadow: {falsifier_id}")
        if falsifier_id in falsifiers:
            raise NexusError(f"Duplicate falsifier id: {falsifier_id}")
        falsifiers[falsifier_id] = not invariant_result

    declared_valid = [item for item in record["dissent"] if item["status"] == "FALSIFIER_VALID"]
    if declared_valid:
        referenced = {
            ref
            for item in declared_valid
            for ref in item["evidence_refs"]
            if isinstance(ref, str) and ref.endswith("FALSIFIER.json")
        }
        if not referenced or any(ref not in entries for ref in referenced):
            raise NexusError("FALSIFIER_VALID dissent has no bound falsifier artifact.")

    return {
        "shadow": shadow_report,
        "valid_falsifier_ids": sorted(key for key, failed in falsifiers.items() if failed),
        "recomputed_falsifier_count": len(falsifiers),
    }


def _fill_or_match(record: dict[str, Any], key: str, expected: str) -> None:
    supplied = record.get(key)
    if supplied not in ("", expected):
        raise NexusError(f"Work-return {key} does not match the route pack.")
    record[key] = expected


@exchange_boundary
def build_exchange_pack(
    draft_path: Path,
    *,
    artifact_root: Path,
    route_path: Path,
    output_path: Path,
) -> dict[str, Any]:
    if not draft_path.is_file() or draft_path.stat().st_size > MAX_DRAFT_BYTES:
        raise NexusError(f"Work-return draft is missing or exceeds its size limit: {draft_path}")
    with draft_path.open("rb") as handle:
        draft_bytes = handle.read(MAX_DRAFT_BYTES + 1)
    draft = strict_json_bytes(draft_bytes, label=str(draft_path))
    if not isinstance(draft, dict):
        raise NexusError("Work-return draft must be an object.")
    _require_exact_keys(draft, RETURN_KEYS, label="Work-return draft")
    route = _inspect_route_pack(route_path)
    _fill_or_match(draft, "task_sha256", route["task_sha256"])
    _fill_or_match(draft, "route_sha256", route["route_sha256"])
    _fill_or_match(draft, "baseline_commit", route["baseline_commit"])
    contract = _exchange_contract(route)
    if draft.get("recipient") != contract["recipient"]:
        raise NexusError("Work-return draft recipient does not match the route-bound offer.")
    if not isinstance(draft.get("producer"), dict) or draft["producer"].get("seat_id") != contract["producer_seat"]:
        raise NexusError("Work-return draft producer seat does not match the route-bound offer.")
    if draft.get("epoch_id") != contract["epoch_id"]:
        raise NexusError("Work-return draft epoch does not match the route-bound offer.")
    if draft.get("source_root") != contract["source_root"]:
        raise NexusError("Work-return draft source_root does not match the route-bound offer.")
    draft["exchange_id"] = _return_exchange_id(draft)

    artifact_entries: dict[str, bytes] = {}
    for artifact in draft["artifacts"]:
        if not isinstance(artifact, dict) or set(artifact) != {"path", "sha256", "bytes", "media_type"}:
            raise NexusError("Work-return draft artifact records have the wrong shape.")
        name = _canonical_member_name(artifact["path"])
        source = safe_join(artifact_root, name)
        if not source.is_file() or source.is_symlink():
            raise NexusError(f"Artifact is missing or not a regular file: {name}")
        with source.open("rb") as handle:
            data = handle.read(MAX_RETURN_MEMBER_BYTES + 1)
        if len(data) > MAX_RETURN_MEMBER_BYTES:
            raise NexusError(f"Artifact exceeds size limit: {name}")
        if PurePosixPath(name).suffix.lower() == ".json":
            value = strict_json_bytes(data, label=name)
            if name == "artifacts/SHADOW.json":
                if not isinstance(value, dict):
                    raise NexusError("Cognition shadow root must be an object.")
                if value.get("exchange_id") not in ("", "BOUND_BY_RETURN", draft["exchange_id"]):
                    raise NexusError("Cognition shadow exchange_id conflicts with the work-return draft.")
                value["exchange_id"] = draft["exchange_id"]
                value["shadow_root"] = ""
                value["shadow_root"] = sha256_bytes(canonical_json_bytes(value))
                data = canonical_json_bytes(value)
        _scan_text(data, label=name)
        artifact["sha256"] = sha256_bytes(data)
        artifact["bytes"] = len(data)
        artifact_entries[name] = data

    draft["return_hash"] = _return_hash(draft)
    _validate_work_return(draft)
    work_return = canonical_json_bytes(draft)
    subject = {"WORK_RETURN.json": work_return, **artifact_entries}
    utility = _verify_useful_work(draft, subject, route)
    entries = {**subject, "MANIFEST.sha256": render_manifest(subject).encode("utf-8")}
    _write_deterministic_zip(output_path, entries)
    digest = sha256_file(output_path)
    atomic_write_text(output_path.with_suffix(output_path.suffix + ".sha256"), f"{digest}  {output_path.name}\n")
    return {
        "schema": "nexus.exchange-pack-build/v0",
        "status": "PASS",
        "exchange_id": draft["exchange_id"],
        "return_hash": draft["return_hash"],
        "pack_sha256": digest,
        "pack_path": str(output_path),
        "artifact_count": len(artifact_entries),
        "utility": utility,
    }


def _read_exchange_pack(
    pack_path: Path,
    route_path: Path,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    entries = _read_zip(
        pack_path,
        max_archive_bytes=MAX_RETURN_PACK_BYTES,
        max_members=MAX_RETURN_MEMBERS,
        max_member_bytes=MAX_RETURN_MEMBER_BYTES,
    )
    _verify_manifest(entries)
    if "WORK_RETURN.json" not in entries:
        raise NexusError("Exchange pack is missing WORK_RETURN.json.")
    record = _validate_work_return(strict_json_bytes(entries["WORK_RETURN.json"], label="WORK_RETURN.json"))
    expected_members = {"WORK_RETURN.json", "MANIFEST.sha256", *(item["path"] for item in record["artifacts"])}
    if set(entries) != expected_members:
        raise NexusError("Exchange pack members do not match the declared artifacts.")
    for artifact in record["artifacts"]:
        name = artifact["path"]
        data = entries[name]
        if len(data) != artifact["bytes"] or sha256_bytes(data) != artifact["sha256"]:
            raise NexusError(f"Artifact binding failed for {name}.")
        _scan_text(data, label=name)
        if PurePosixPath(name).suffix.lower() == ".json":
            strict_json_bytes(data, label=name)
    route = _inspect_route_pack(route_path)
    if record["task_sha256"] != route["task_sha256"]:
        raise NexusError("Work return is bound to a different task.")
    if record["route_sha256"] != route["route_sha256"]:
        raise NexusError("Work return is bound to a different route pack.")
    if record["baseline_commit"] != route["baseline_commit"]:
        raise NexusError("Work return is bound to a different baseline commit.")
    utility = _verify_useful_work(record, entries, route)
    return record, route, utility


@exchange_boundary
def verify_exchange_pack(pack_path: Path, *, route_path: Path) -> dict[str, Any]:
    record, route, utility = _read_exchange_pack(pack_path, route_path)
    return {
        "schema": "nexus.exchange-pack-verification/v0",
        "status": "PASS",
        "exchange_id": record["exchange_id"],
        "return_hash": record["return_hash"],
        "task_sha256": route["task_sha256"],
        "route_sha256": route["route_sha256"],
        "baseline_commit": route["baseline_commit"],
        "artifact_count": len(record["artifacts"]),
        "utility": utility,
        "claims": ["The declared route, baseline, return envelope and artifact bytes are hash-bound."],
        "non_claims": [
            "This does not establish semantic truth, producer authorship, provider independence, financial value, Sybil resistance or global uniqueness."
        ],
    }


def _receipt_hash(receipt: dict[str, Any]) -> str:
    subject = dict(receipt)
    subject["receipt_hash"] = ""
    return sha256_bytes(canonical_json_bytes(subject))


def _accepted_state_hash(previous: str, exchange_id: str, return_hash: str) -> str:
    return sha256_bytes(canonical_json_bytes({
        "schema": "nexus.exchange-state/v0",
        "previous_state_hash": previous,
        "exchange_id": exchange_id,
        "return_hash": return_hash,
    }))


def _validate_receipt(receipt: Any) -> dict[str, Any]:
    if not isinstance(receipt, dict):
        raise NexusError("Exchange receipt must be an object.")
    _require_exact_keys(receipt, RECEIPT_KEYS, label="Exchange receipt")
    if receipt["schema"] != EXCHANGE_RECEIPT_SCHEMA:
        raise NexusError("Unsupported exchange-receipt schema.")
    validate_identifier(receipt["receipt_id"], label="receipt_id")
    if not isinstance(receipt["sequence"], int) or isinstance(receipt["sequence"], bool) or receipt["sequence"] < 1:
        raise NexusError("Receipt sequence must be a positive integer.")
    for key in ("exchange_id", "return_hash", "task_sha256", "route_sha256", "receipt_hash"):
        _require_hash(receipt[key], label=key)
    for key in ("previous_receipt_hash", "previous_state_hash", "next_state_hash"):
        _require_hash(receipt[key], label=key, empty_allowed=True)
    if receipt["decision"] not in ALLOWED_DECISIONS:
        raise NexusError("Exchange receipt has an invalid decision.")
    if not isinstance(receipt["reason_codes"], list) or not receipt["reason_codes"] or not all(isinstance(item, str) and item for item in receipt["reason_codes"]):
        raise NexusError("Exchange receipt reason_codes must be non-empty strings.")
    _parse_time(receipt["created_at"], label="receipt.created_at")
    if receipt["status_authority"] != "NONE":
        raise NexusError("Exchange receipts must declare status_authority NONE.")
    expected = _receipt_hash(receipt)
    if receipt["receipt_hash"] != expected:
        raise NexusError(f"Exchange receipt hash is invalid; computed {expected}.")
    return receipt


def _load_exchange_ledger(path: Path) -> tuple[list[dict[str, Any]], str, str]:
    records: list[dict[str, Any]] = []
    previous_receipt = ""
    accepted_state = ""
    if not path.exists():
        return records, previous_receipt, accepted_state
    if not path.is_file() or path.is_symlink() or path.stat().st_size > MAX_LEDGER_BYTES:
        raise NexusError(f"Exchange ledger is unsafe or exceeds its size limit: {path}")
    data = path.read_bytes()
    if data and not data.endswith(b"\n"):
        raise NexusError("Exchange ledger is not canonical JSONL (missing final LF).")
    for line_number, raw in enumerate(data.splitlines(), start=1):
        if not raw.strip():
            raise NexusError(f"Exchange ledger contains a blank line at {line_number}.")
        if len(raw) > MAX_LEDGER_LINE_BYTES:
            raise NexusError(f"Exchange ledger line {line_number} exceeds its size limit.")
        receipt = _validate_receipt(strict_json_bytes(raw, label=f"exchange ledger line {line_number}"))
        if canonical_json_bytes(receipt) != raw + b"\n":
            raise NexusError(f"Exchange ledger line {line_number} is not canonical JSON.")
        if receipt["sequence"] != len(records) + 1:
            raise NexusError(f"Exchange ledger sequence break on line {line_number}.")
        if receipt["previous_receipt_hash"] != previous_receipt:
            raise NexusError(f"Exchange ledger receipt-chain break on line {line_number}.")
        if receipt["previous_state_hash"] != accepted_state:
            raise NexusError(f"Exchange ledger state-chain break on line {line_number}.")
        expected_state = (
            _accepted_state_hash(accepted_state, receipt["exchange_id"], receipt["return_hash"])
            if receipt["decision"] == "ACCEPTED"
            else accepted_state
        )
        if receipt["next_state_hash"] != expected_state:
            raise NexusError(f"Exchange ledger next-state hash mismatch on line {line_number}.")
        records.append(receipt)
        previous_receipt = receipt["receipt_hash"]
        accepted_state = receipt["next_state_hash"]
    return records, previous_receipt, accepted_state


@contextmanager
def _locked_ledger(path: Path):
    """Serialize local writers with both a process lock and an OS advisory lock."""
    key = str(path.resolve())
    with _LOCKS_GUARD:
        process_lock = _LEDGER_LOCKS.setdefault(key, threading.Lock())
    with process_lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        lock_path = path.with_suffix(path.suffix + ".lock")
        with lock_path.open("a+b") as handle:
            try:
                import fcntl
            except ImportError as exc:  # pragma: no cover - the Nexus lab runtime is POSIX.
                raise NexusError("Atomic exchange settlement requires POSIX advisory locks.") from exc
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


@exchange_boundary
def verify_exchange_ledger(path: Path) -> dict[str, Any]:
    records, head, state = _load_exchange_ledger(path)
    accepted = sum(1 for item in records if item["decision"] == "ACCEPTED")
    return {
        "schema": "nexus.exchange-ledger-verification/v0",
        "status": "PASS",
        "receipt_count": len(records),
        "accepted_count": accepted,
        "ledger_head": head,
        "accepted_state_hash": state,
        "non_claims": ["Replay handling is local to this ledger and does not establish global double-spend prevention."],
    }


@exchange_boundary
def accept_exchange(
    pack_path: Path,
    *,
    route_path: Path,
    ledger_path: Path,
    now: datetime | None = None,
) -> dict[str, Any]:
    record, _, utility = _read_exchange_pack(pack_path, route_path)
    with _locked_ledger(ledger_path):
        receipts, receipt_head, accepted_state = _load_exchange_ledger(ledger_path)
        for existing in receipts:
            if existing["exchange_id"] == record["exchange_id"] and existing["return_hash"] == record["return_hash"]:
                return {"idempotent": True, "receipt": existing, "ledger": str(ledger_path), "utility": utility}

        decision = "ACCEPTED"
        reason_codes = ["VALID_BOUNDED_RETURN"]
        if any(item["exchange_id"] == record["exchange_id"] for item in receipts):
            decision = "REJECTED"
            reason_codes = ["EXCHANGE_ID_COLLISION"]
        else:
            current = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
            if current >= _parse_time(record["expires_at"], label="expires_at"):
                decision = "EXPIRED"
                reason_codes = ["EXPIRED_RETURN"]
            elif record["predecessor_state_hash"] != accepted_state:
                consumed_predecessor = any(
                    item["decision"] == "ACCEPTED"
                    and item["previous_state_hash"] == record["predecessor_state_hash"]
                    for item in receipts
                )
                if consumed_predecessor:
                    decision = "CHALLENGED"
                    reason_codes = ["COMPETING_RETURN"]
                else:
                    decision = "STALE"
                    reason_codes = ["PREDECESSOR_STATE_MISMATCH"]
            elif utility["valid_falsifier_ids"]:
                decision = "CHALLENGED"
                reason_codes = ["FALSIFIER_VALID"]

        sequence = len(receipts) + 1
        previous_state = accepted_state
        next_state = (
            _accepted_state_hash(previous_state, record["exchange_id"], record["return_hash"])
            if decision == "ACCEPTED"
            else previous_state
        )
        created = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
        receipt = {
            "schema": EXCHANGE_RECEIPT_SCHEMA,
            "receipt_id": f"BWX-RCPT-{sequence:06d}",
            "sequence": sequence,
            "exchange_id": record["exchange_id"],
            "return_hash": record["return_hash"],
            "task_sha256": record["task_sha256"],
            "route_sha256": record["route_sha256"],
            "decision": decision,
            "reason_codes": reason_codes,
            "previous_receipt_hash": receipt_head,
            "previous_state_hash": previous_state,
            "next_state_hash": next_state,
            "created_at": _iso_z(created),
            "status_authority": "NONE",
            "receipt_hash": "",
        }
        receipt["receipt_hash"] = _receipt_hash(receipt)
        _validate_receipt(receipt)
        existing_text = ledger_path.read_text(encoding="utf-8") if ledger_path.exists() else ""
        atomic_write_text(ledger_path, existing_text + canonical_json_bytes(receipt).decode("utf-8"))
        return {"idempotent": False, "receipt": receipt, "ledger": str(ledger_path), "utility": utility}


@exchange_boundary
def write_exchange_template(
    path: Path,
    *,
    created_at: str,
    expires_at: str,
    route_path: Path | None = None,
) -> dict[str, Any]:
    route: dict[str, Any] | None = None
    contract: dict[str, Any] | None = None
    if route_path is not None:
        route = _inspect_route_pack(route_path)
        contract = _exchange_contract(route)
    template = {
        "schema": WORK_RETURN_SCHEMA,
        "exchange_id": "",
        "task_sha256": "",
        "route_sha256": "",
        "baseline_commit": "",
        "producer": {
            "seat_id": "producer-seat",
            "provider_family": "DECLARED",
            "session_label": "cold-context",
            "independence": "NOT_CLAIMED",
        },
        "recipient": "nexus-coordinator",
        "epoch_id": "R012-E001",
        "nonce": "replace-with-unique-nonce",
        "created_at": created_at,
        "expires_at": expires_at,
        "source_root": "0" * 64,
        "data_classes": ["SYNTHETIC_FIXTURE"],
        "artifacts": [{"path": "artifacts/SHADOW.json", "sha256": "", "bytes": 0, "media_type": "application/json"}],
        "claims": [],
        "non_claims": ["This return does not establish semantic truth, authorship, independence, financial value or canonical promotion."],
        "dissent": [],
        "predecessor_state_hash": "",
        "status_authority": "NONE",
        "return_hash": "",
    }
    if route is not None and contract is not None:
        template["task_sha256"] = route["task_sha256"]
        template["route_sha256"] = route["route_sha256"]
        template["baseline_commit"] = route["baseline_commit"]
        template["producer"]["seat_id"] = contract["producer_seat"]
        template["recipient"] = contract["recipient"]
        template["epoch_id"] = contract["epoch_id"]
        template["source_root"] = contract["source_root"]
        template["exchange_id"] = _return_exchange_id(template)
    atomic_write_text(path, pretty_json(template))
    return {
        "schema": "nexus.exchange-template-build/v0",
        "status": "PASS",
        "path": str(path),
        "exchange_id": template["exchange_id"],
        "route_bound": route_path is not None,
    }
