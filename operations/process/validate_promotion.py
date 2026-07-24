#!/usr/bin/env python3
"""Fail-closed validation for the Lab promotion-package contract.

This module intentionally uses only Python's standard library. It parses one
JSON block from a PR body, checks declared scope, and reads only remote Git
metadata for Sandbox tags. It never checks out or executes Sandbox content.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Callable, Iterable
from urllib.parse import quote, unquote, urlparse

REPO = "Natoshi-moto/Experimental-Sandbox"
SCHEMA = "nexus.experimental-sandbox-promotion/v1"
SHA_RE = re.compile(r"^[0-9a-f]{40}$")
TAG_RE = re.compile(r"^[^\s~^:?*\\\[\]\.]+$")
AUTHORIZATION_DIR = "operations/merge_authorizations/"
AUTHORIZATION_PATH_RE = re.compile(r"^operations/merge_authorizations/PR-([1-9][0-9]*)\.json$")
DISPOSITIONS = {
    "COPIED",
    "REWRITTEN",
    "INDEPENDENT_REIMPLEMENTATION",
    "DOCUMENTATION_ONLY",
    "EVIDENCE_ONLY",
}
LAB_FIELDS = {
    "sandbox_repository",
    "sandbox_commit",
    "sandbox_tag",
    "sandbox_record_url",
    "sandbox_context",
}
REQUIRED = {
    "schema",
    "change_origin",
    "sandbox_repository",
    "sandbox_commit",
    "sandbox_tag",
    "sandbox_record_url",
    "sandbox_context",
    "task_or_route_id",
    "baseline_lab_commit",
    "authority_used",
    "allowed_write_scope",
    "files_proposed_for_lab",
    "claim",
    "falsifier",
    "evidence_class",
    "tests_run",
    "test_results",
    "known_failures",
    "known_unknowns",
    "non_claims",
    "adversarial_review",
    "rights_and_licences",
    "security_and_privacy_impact",
    "known_lab_red_impact",
    "operator_decision_requested",
    "status_authority",
}


class ContractError(ValueError):
    pass


def _no_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ContractError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def parse_json_object(text: str) -> dict[str, Any]:
    try:
        value = json.loads(text, object_pairs_hook=_no_duplicate_pairs)
    except (json.JSONDecodeError, ContractError) as exc:
        raise ContractError(f"malformed JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ContractError("promotion package must be a JSON object")
    return value


def parse_pr_body(body: str) -> dict[str, Any]:
    blocks = re.findall(r"```json\s*\n(.*?)```", body, flags=re.IGNORECASE | re.DOTALL)
    if len(blocks) != 1:
        raise ContractError("PR body must contain exactly one ```json``` promotion package")
    return parse_json_object(blocks[0])


def _text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ContractError(f"{field} must be a non-empty string")
    return value.strip()


def _list(value: Any, field: str) -> list[Any]:
    if not isinstance(value, list):
        raise ContractError(f"{field} must be an array")
    return value


def _relative_path(path: str, field: str) -> None:
    if not path or path.startswith("/") or "\\" in path or ".." in path.split("/"):
        raise ContractError(f"{field} contains an unsafe path: {path!r}")


def _validate_pr_number(pr_number: int | None) -> None:
    if pr_number is not None and (isinstance(pr_number, bool) or not isinstance(pr_number, int) or pr_number < 1):
        raise ContractError("trusted pull-request number must be a positive integer")


def split_changed_files(changed_files: list[str], pr_number: int | None) -> tuple[list[str], list[str]]:
    """Separate one exact current-PR authorization file from substantive files.

    The PR number is supplied by the trusted GitHub event context. Nothing in
    the promotion package can select or widen this exemption.
    """
    _validate_pr_number(pr_number)
    normalized: list[str] = []
    for item in changed_files:
        if not isinstance(item, str) or not item.strip():
            raise ContractError("changed file must be a non-empty string")
        if item != item.strip():
            raise ContractError(f"changed file contains leading or trailing whitespace: {item!r}")
        normalized.append(item)
    if len(set(normalized)) != len(normalized):
        raise ContractError("changed-file list contains duplicate paths")

    substantive: list[str] = []
    authorization: list[str] = []
    for path in normalized:
        if path.startswith(AUTHORIZATION_DIR):
            match = AUTHORIZATION_PATH_RE.fullmatch(path)
            if not match:
                raise ContractError(f"unexpected authorization bookkeeping path: {path!r}")
            if pr_number is None:
                raise ContractError("trusted pull-request number is required for authorization bookkeeping")
            if int(match.group(1)) != pr_number:
                raise ContractError(f"authorization bookkeeping is for a different PR: {path!r}")
            authorization.append(path)
        else:
            substantive.append(path)

    if len(authorization) > 1:
        raise ContractError("more than one current-PR authorization bookkeeping file is not allowed")
    return sorted(substantive), authorization


def _all_strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from _all_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from _all_strings(item)


def _reject_positive_authority_claims(package: dict[str, Any]) -> None:
    # Non-claims are explicitly where a package records that it is not
    # canonical. Exclude that field from this positive-claim heuristic.
    values = []
    for key, value in package.items():
        if key != "non_claims":
            values.extend(_all_strings(value))
    patterns = [
        r"\bis\s+canonical\b",
        r"\bcanonical\s+(?:lab\s+)?authority\b",
        r"\bpromoted\s+to\s+canonical\b",
        r"\baccepted\s+(?:lab\s+)?state\b",
        r"\bstatus_authority\s*[:=]\s*(?!NONE\b)",
    ]
    for value in values:
        for pattern in patterns:
            if re.search(pattern, value, flags=re.IGNORECASE):
                raise ContractError("free text attempts to claim canonical authority")


def _validate_common(
    package: dict[str, Any], changed_files: list[str] | None, pr_number: int | None
) -> list[str]:
    _validate_pr_number(pr_number)
    missing = sorted(REQUIRED - package.keys())
    extra = sorted(package.keys() - REQUIRED)
    if missing:
        raise ContractError(f"missing required fields: {', '.join(missing)}")
    if extra:
        raise ContractError(f"unexpected top-level fields: {', '.join(extra)}")
    if package["schema"] != SCHEMA:
        raise ContractError(f"schema must be {SCHEMA}")
    if package["change_origin"] not in {"LAB_INTERNAL", "SANDBOX_PROMOTION"}:
        raise ContractError("change_origin must be LAB_INTERNAL or SANDBOX_PROMOTION")
    if not SHA_RE.fullmatch(_text(package["baseline_lab_commit"], "baseline_lab_commit")):
        raise ContractError("baseline_lab_commit must be a full lowercase 40-character SHA")
    _text(package["task_or_route_id"], "task_or_route_id")
    _text(package["authority_used"], "authority_used")
    _text(package["claim"], "claim")
    _text(package["falsifier"], "falsifier")
    _text(package["evidence_class"], "evidence_class")
    _text(package["known_lab_red_impact"], "known_lab_red_impact")
    if package["status_authority"] != "NONE":
        raise ContractError("status_authority must be NONE")

    scope = [_text(item, "allowed_write_scope item") for item in _list(package["allowed_write_scope"], "allowed_write_scope")]
    for item in scope:
        _relative_path(item, "allowed_write_scope")

    proposed = _list(package["files_proposed_for_lab"], "files_proposed_for_lab")
    proposed_paths: list[str] = []
    for item in proposed:
        if not isinstance(item, dict) or set(item) != {"path", "disposition"}:
            raise ContractError("each files_proposed_for_lab item needs only path and disposition")
        path = _text(item["path"], "files_proposed_for_lab.path")
        _relative_path(path, "files_proposed_for_lab.path")
        if item["disposition"] not in DISPOSITIONS:
            raise ContractError(f"unsupported file disposition for {path}")
        proposed_paths.append(path)
    if len(set(proposed_paths)) != len(proposed_paths):
        raise ContractError("files_proposed_for_lab contains duplicate paths")

    tests = _list(package["tests_run"], "tests_run")
    for item in tests:
        if not isinstance(item, dict) or set(item) != {"command", "result", "details"}:
            raise ContractError("tests_run items require command, result, and details")
        for field in ("command", "result", "details"):
            _text(item[field], f"tests_run.{field}")
    if not isinstance(package["test_results"], list):
        raise ContractError("test_results must be an array")
    for field in ("known_failures", "known_unknowns"):
        values = _list(package[field], field)
        for item in values:
            if not isinstance(item, str):
                raise ContractError(f"{field} items must be strings")
    non_claims = _list(package["non_claims"], "non_claims")
    if not non_claims or any(not isinstance(item, str) or not item.strip() for item in non_claims):
        raise ContractError("non_claims must contain at least one non-empty string")

    review = package["adversarial_review"]
    if not isinstance(review, dict) or set(review) != {"performed", "summary", "findings", "limitations"}:
        raise ContractError("adversarial_review requires performed, summary, findings, and limitations")
    if not isinstance(review["performed"], bool):
        raise ContractError("adversarial_review.performed must be boolean")
    _text(review["summary"], "adversarial_review.summary")
    for field in ("findings", "limitations"):
        if not isinstance(review[field], list) or any(not isinstance(item, str) for item in review[field]):
            raise ContractError(f"adversarial_review.{field} must be an array of strings")

    rights = package["rights_and_licences"]
    rights_fields = {
        "original_author_or_source",
        "source_repository",
        "source_commit",
        "source_licence",
        "files_modified",
        "third_party_material",
        "submitter_rights",
        "lab_mit_compatibility",
        "exceptions",
    }
    if not isinstance(rights, dict) or set(rights) != rights_fields:
        raise ContractError("rights_and_licences is incomplete or has extra fields")
    for field in rights_fields:
        _text(rights[field], f"rights_and_licences.{field}")

    impact = package["security_and_privacy_impact"]
    impact_fields = {"summary", "secrets_checked", "personal_data_checked", "external_systems", "risks"}
    if not isinstance(impact, dict) or set(impact) != impact_fields:
        raise ContractError("security_and_privacy_impact is incomplete or has extra fields")
    for field in impact_fields:
        _text(impact[field], f"security_and_privacy_impact.{field}")

    decision = package["operator_decision_requested"]
    decision_fields = {"action", "rationale", "reversible", "stop_conditions"}
    if not isinstance(decision, dict) or set(decision) != decision_fields:
        raise ContractError("operator_decision_requested is incomplete or has extra fields")
    action = _text(decision["action"], "operator_decision_requested.action")
    if action.upper() in {"MERGE", "ACCEPT", "PROMOTE", "APPROVE"}:
        raise ContractError("operator_decision_requested cannot grant acceptance or merge")
    if not isinstance(decision["reversible"], bool) or not decision["reversible"]:
        raise ContractError("operator_decision_requested.reversible must be true")
    _text(decision["rationale"], "operator_decision_requested.rationale")
    _text(decision["stop_conditions"], "operator_decision_requested.stop_conditions")

    authorization_files: list[str] = []
    if changed_files is not None:
        actual, authorization_files = split_changed_files(changed_files, pr_number)
        if any(path in authorization_files for path in proposed_paths):
            raise ContractError("authorization bookkeeping must not be listed as proposed Lab content")
        if sorted(proposed_paths) != actual:
            raise ContractError(
                "files_proposed_for_lab must exactly match the substantive PR changed-file set; "
                f"declared={sorted(proposed_paths)} actual={actual}"
            )
        for path in actual:
            if not any(path == allowed or allowed.endswith("/**") and path.startswith(allowed[:-3]) for allowed in scope):
                raise ContractError(f"changed file outside allowed_write_scope: {path}")

    _reject_positive_authority_claims(package)
    return authorization_files


def _validate_record_url(url: str, sha: str, tag: str) -> None:
    parsed = urlparse(_text(url, "sandbox_record_url"))
    expected_host = "github.com"
    if parsed.scheme != "https" or parsed.netloc.lower() != expected_host or parsed.query or parsed.fragment:
        raise ContractError("sandbox_record_url must be a canonical HTTPS GitHub URL without query or fragment")
    prefix = f"/{REPO}/"
    if not parsed.path.startswith(prefix):
        raise ContractError("sandbox_record_url must point into the declared Sandbox repository")
    suffix = parsed.path[len(prefix):]
    expected = {f"commit/{sha}", f"releases/tag/{tag}", f"tree/{tag}"}
    if suffix not in expected:
        raise ContractError("sandbox_record_url must be an immutable commit or exact tag record, not a branch URL")
    if suffix in {"tree/main", "tree/HEAD", "tree/latest"}:
        raise ContractError("mutable Sandbox refs are not accepted as record URLs")


def _validate_tag_name(tag: str) -> None:
    if not TAG_RE.fullmatch(tag) or tag in {"main", "HEAD", "latest"} or tag.startswith("refs/"):
        raise ContractError("sandbox_tag is not an immutable-looking tag name")


def validate_package(
    package: dict[str, Any],
    *,
    changed_files: list[str] | None = None,
    pr_number: int | None = None,
    tag_resolver: Callable[[str, str], dict[str, Any]] | None = None,
) -> list[str]:
    authorization_files = _validate_common(package, changed_files, pr_number)
    origin = package["change_origin"]
    if origin == "LAB_INTERNAL":
        for field in LAB_FIELDS:
            if package[field] != "NOT_APPLICABLE":
                raise ContractError(f"{field} must be NOT_APPLICABLE for LAB_INTERNAL")
        return authorization_files

    if package["sandbox_repository"] != REPO:
        raise ContractError(f"sandbox_repository must be exactly {REPO}")
    sha = _text(package["sandbox_commit"], "sandbox_commit")
    if not SHA_RE.fullmatch(sha):
        raise ContractError("sandbox_commit must be a full lowercase 40-character SHA")
    tag = _text(package["sandbox_tag"], "sandbox_tag")
    _validate_tag_name(tag)
    if package["sandbox_context"] == "NOT_APPLICABLE":
        raise ContractError("sandbox_context cannot be NOT_APPLICABLE for Sandbox promotion")
    _validate_record_url(package["sandbox_record_url"], sha, tag)

    resolver = tag_resolver or resolve_tag_from_git
    try:
        result = resolver(REPO, tag)
    except Exception as exc:  # network and parser failures must fail closed
        raise ContractError(f"Sandbox provenance resolution failed closed: {exc}") from exc
    if not isinstance(result, dict) or result.get("ambiguous"):
        raise ContractError("Sandbox tag resolution is missing or ambiguous")
    resolved = result.get("commit")
    if not isinstance(resolved, str) or not SHA_RE.fullmatch(resolved):
        raise ContractError("Sandbox tag did not resolve to one full commit SHA")
    if resolved != sha:
        raise ContractError(f"Sandbox tag resolves to {resolved}, not declared {sha}")
    return authorization_files


def resolve_tag_from_git(repository: str, tag: str) -> dict[str, Any]:
    command = ["git", "ls-remote", "--tags", repository, f"refs/tags/{tag}", f"refs/tags/{tag}^{{}}"]
    completed = subprocess.run(command, check=False, capture_output=True, text=True, timeout=30)
    if completed.returncode != 0:
        raise ContractError(completed.stderr.strip() or "git ls-remote failed")
    rows: dict[str, str] = {}
    for line in completed.stdout.splitlines():
        parts = line.split()
        if len(parts) != 2:
            continue
        rows[parts[1]] = parts[0]
    direct = rows.get(f"refs/tags/{tag}")
    peeled = rows.get(f"refs/tags/{tag}^{{}}")
    if peeled:
        if not SHA_RE.fullmatch(peeled):
            raise ContractError("peeled tag target is not a commit SHA")
        return {"kind": "annotated", "tag_object": direct, "commit": peeled}
    if direct and SHA_RE.fullmatch(direct):
        return {"kind": "lightweight", "commit": direct}
    if direct:
        raise ContractError("annotated tag did not expose an unambiguous peeled commit")
    raise ContractError("tag missing")


def validate_files(body_file: Path, changed_files_file: Path | None, pr_number: int | None) -> None:
    package = parse_pr_body(body_file.read_text(encoding="utf-8"))
    changed = None
    if changed_files_file is not None:
        changed = changed_files_file.read_text(encoding="utf-8").splitlines()
    authorization_files = validate_package(package, changed_files=changed, pr_number=pr_number)
    print(f"Promotion contract PASS: {package['change_origin']}; status_authority=NONE")
    if authorization_files:
        print(
            "Excluded authorization bookkeeping from substantive scope: "
            f"{authorization_files[0]}; the Human merge authorization workflow validates it separately."
        )
    else:
        print("No authorization bookkeeping file was present in the PR diff.")
    print("Provenance was checked as declared metadata only; no Sandbox content was fetched or executed.")
    print("A passing contract check is not proof of safety, security, correctness, usefulness, rights, or deployment suitability.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--body-file", type=Path, required=True)
    parser.add_argument("--changed-files-file", type=Path)
    parser.add_argument("--pr-number", type=int, help="trusted GitHub pull-request number")
    args = parser.parse_args(argv)
    try:
        validate_files(args.body_file, args.changed_files_file, args.pr_number)
    except (ContractError, OSError) as exc:
        print(f"PROMOTION CONTRACT REJECTED: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
