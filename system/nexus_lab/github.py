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



def require_private_visibility(name: str, visibility: str) -> None:
    if visibility != "PRIVATE":
        raise NexusError(f"Refusing to use {name}: GitHub reports visibility {visibility}, not PRIVATE.")


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
        _gh(root, "repo", "create", repo_name, "--private", "--source=.", "--remote=origin", "--push")
        created = True
    view = _gh(root, "repo", "view", "--json", "nameWithOwner,visibility,url")
    full_name, visibility = parse_visibility(view.stdout)
    require_private_visibility(full_name, visibility)

    # Ensure all local tags are transferred after repo creation or validation.
    git(root, "push", "origin", "main", "--follow-tags")
    permission = _gh(
        root,
        "api",
        "--method", "PUT",
        f"repos/{full_name}/actions/permissions/workflow",
        "-f", "default_workflow_permissions=read",
        "-F", "can_approve_pull_request_reviews=false",
        check=False,
    )
    labels = []
    for label, description in (
        ("audit", "Read-only audit work"),
        ("claude", "Work routed to an Anthropic Claude seat"),
        ("observation", "Non-authoritative audit observation"),
    ):
        result = _gh(root, "label", "create", label, "--description", description, "--force", check=False)
        labels.append({"label": label, "exit_code": result.returncode})

    issue_body = root / "operations" / "audits" / "AUD-R001-CLAUDE-BLIND" / "GITHUB_ISSUE_BODY.md"
    issue_result = _gh(
        root,
        "issue", "create",
        "--title", "AUD-R001: Claude blind audit of baseline-001",
        "--body-file", str(issue_body),
        "--label", "audit,claude,observation",
        check=False,
    )
    receipt = {
        "schema": "nexus.github-bootstrap-receipt/v1",
        "created_at": utc_now(),
        "repository": full_name,
        "visibility": visibility,
        "created_repository": created,
        "origin": git(root, "remote", "get-url", "origin"),
        "actions_read_only_request_exit_code": permission.returncode,
        "labels": labels,
        "audit_issue_exit_code": issue_result.returncode,
        "audit_issue_output": issue_result.stdout.strip(),
        "claims": ["GitHub reported the repository as PRIVATE before bootstrap completion."],
        "non_claims": ["This receipt does not prove provider-side confidentiality or branch-rule coverage."],
    }
    receipt_path = root / "operations" / "receipts" / "GITHUB_BOOTSTRAP_RECEIPT.json"
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.write_text(pretty_json(receipt), encoding="utf-8")
    return receipt
