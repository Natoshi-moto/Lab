from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from .util import NexusError, ensure_clean_worktree, git, pretty_json, run, utc_now
from .verify import verify_repository


def _gh(root: Path, *args: str, check: bool = True, input_text: str | None = None):
    return run(["gh", *args], cwd=root, check=check, input_text=input_text)


def parse_visibility(payload: str) -> tuple[str, str]:
    try:
        data = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise NexusError(f"GitHub CLI returned invalid repository JSON: {exc}") from exc
    visibility = str(data.get("visibility", "")).upper()
    name = str(data.get("nameWithOwner", ""))
    if not name or visibility not in {"PRIVATE", "PUBLIC", "INTERNAL"}:
        raise NexusError("GitHub repository JSON omitted nameWithOwner or visibility.")
    return name, visibility


def require_public_visibility(name: str, visibility: str) -> None:
    if visibility != "PUBLIC":
        raise NexusError(f"Refusing to use {name}: GitHub reports visibility {visibility}, not PUBLIC.")


def _result_detail(result: Any) -> str:
    return result.stderr.strip() or result.stdout.strip() or f"exit {result.returncode}"


def _warning(code: str, operation: str, result: Any) -> dict[str, Any]:
    return {
        "code": code,
        "operation": operation,
        "exit_code": result.returncode,
        "detail": _result_detail(result),
    }


def _write_receipt(root: Path, receipt: dict[str, Any]) -> Path:
    receipt_path = root / "operations" / "receipts" / "GITHUB_BOOTSTRAP_RECEIPT.json"
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.write_text(pretty_json(receipt), encoding="utf-8")
    return receipt_path


def github_bootstrap(root: Path, *, repo_name: str) -> dict[str, Any]:
    if shutil.which("gh") is None:
        raise NexusError("GitHub CLI (gh) is not installed. Install it and authenticate, then rerun this command.")
    auth = _gh(root, "auth", "status", check=False)
    if auth.returncode != 0:
        raise NexusError("GitHub CLI is not authenticated. Run `gh auth login`, then rerun this command.")
    ensure_clean_worktree(root)
    verify_repository(root)

    origin = git(root, "remote", "get-url", "origin", check=False)
    created = False
    if not origin:
        # Deliberately omit --push. Content must not cross the remote boundary
        # until GitHub independently reports the newly-created repository PUBLIC.
        _gh(root, "repo", "create", repo_name, "--public", "--source=.", "--remote=origin")
        created = True

    view = _gh(root, "repo", "view", "--json", "nameWithOwner,visibility,url")
    full_name, visibility = parse_visibility(view.stdout)
    require_public_visibility(full_name, visibility)
    origin_url = git(root, "remote", "get-url", "origin")

    # Restrict workflow-token permissions before uploading the repository's
    # workflow files. A failure is mandatory and stops the content push.
    permission = _gh(
        root,
        "api",
        "--method", "PUT",
        f"repos/{full_name}/actions/permissions/workflow",
        "-f", "default_workflow_permissions=read",
        "-F", "can_approve_pull_request_reviews=false",
        check=False,
    )
    if permission.returncode != 0:
        warning = _warning(
            "ACTIONS_PERMISSION_LOCKDOWN_FAILED",
            "set default Actions workflow permissions to read-only",
            permission,
        )
        receipt = {
            "schema": "nexus.github-bootstrap-receipt/v3",
            "status": "FAILED",
            "created_at": utc_now(),
            "repository": full_name,
            "visibility": visibility,
            "created_repository": created,
            "origin": origin_url,
            "content_push_performed": False,
            "actions_read_only_request_exit_code": permission.returncode,
            "labels": [],
            "audit_issue_exit_code": None,
            "audit_issue_output": "",
            "warnings": [warning],
            "claims": [
                "GitHub reported the repository as PUBLIC before any Nexus-managed content push.",
                "No Nexus-managed content push was attempted after the required Actions-permission request failed."
            ],
            "non_claims": [
                "This receipt does not prove provider-side confidentiality or branch-rule coverage.",
                "A successful visibility query does not establish all provider-side privacy properties."
            ],
        }
        receipt_path = _write_receipt(root, receipt)
        relative_receipt = receipt_path.relative_to(root).as_posix()
        raise NexusError(
            "GitHub bootstrap stopped before pushing content because the required Actions-permission "
            f"lockdown failed. Receipt written to {relative_receipt}."
        )

    # Privacy and mandatory workflow-permission preconditions have passed.
    git(root, "push", "origin", "main", "--follow-tags")

    warnings: list[dict[str, Any]] = []
    labels = []
    for label, description in (
        ("audit", "Read-only audit work"),
        ("claude", "Work routed to an Anthropic Claude seat"),
        ("observation", "Non-authoritative audit observation"),
    ):
        result = _gh(root, "label", "create", label, "--description", description, "--force", check=False)
        labels.append({"label": label, "exit_code": result.returncode})
        if result.returncode != 0:
            warnings.append(_warning("LABEL_CREATE_FAILED", f"create label {label}", result))

    issue_body = root / "operations" / "audits" / "AUD-R002-CLAUDE-BLIND" / "GITHUB_ISSUE_BODY.md"
    issue_result = _gh(
        root,
        "issue", "create",
        "--title", "AUD-R002: Claude blind audit of baseline-001",
        "--body-file", str(issue_body),
        "--label", "audit,claude,observation",
        check=False,
    )
    if issue_result.returncode != 0:
        warnings.append(_warning("AUDIT_ISSUE_CREATE_FAILED", "create audit issue", issue_result))

    receipt = {
        "schema": "nexus.github-bootstrap-receipt/v3",
        "status": "PARTIAL" if warnings else "PASS",
        "created_at": utc_now(),
        "repository": full_name,
        "visibility": visibility,
        "created_repository": created,
        "origin": origin_url,
        "content_push_performed": True,
        "actions_read_only_request_exit_code": permission.returncode,
        "labels": labels,
        "audit_issue_exit_code": issue_result.returncode,
        "audit_issue_output": issue_result.stdout.strip(),
        "warnings": warnings,
        "claims": [
            "GitHub reported the repository as PUBLIC before the Nexus-managed content push.",
            "The required Actions workflow-permission request returned exit code 0 before the content push."
        ],
        "non_claims": [
            "This receipt does not prove provider-side confidentiality or branch-rule coverage.",
            "An exit code 0 from the permission request is not independent provider-state attestation."
        ],
    }
    _write_receipt(root, receipt)
    return receipt
