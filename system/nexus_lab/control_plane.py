from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


ROUND_RE = re.compile(r"^R\d{3}$")
REVIEW_WORDS = {"review", "adjudicat", "rebase", "replac"}
REQUIRED_CONTROL_FILES = (
    "AGENTS.md",
    "README.md",
    "README_START_HERE.md",
    "CLAUDE.md",
    "NEXT_ACTION.md",
    "STATUS.json",
    "STATUS.md",
    "PROJECT_INDEX.json",
    "NEXUS.json",
    "programmes/research-lab-bootstrap/STATE.json",
    "operations/receipts/TSK-LABOPS-CTRL-001/OPEN_PULL_REQUESTS.json",
)


def _load_json(path: Path, issues: list[str]) -> dict[str, Any] | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        issues.append(f"malformed or missing control file {path}: {exc}")
        return None
    if not isinstance(value, dict):
        issues.append(f"control file must contain a JSON object: {path}")
        return None
    return value


def _read_text(path: Path, issues: list[str]) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError as exc:
        issues.append(f"malformed or missing control file {path}: {exc}")
        return ""


def check_control_plane(root: Path) -> list[str]:
    issues: list[str] = []
    for relative in REQUIRED_CONTROL_FILES:
        if not (root / relative).is_file():
            issues.append(f"malformed or missing control file: {relative}")

    status = _load_json(root / "STATUS.json", issues)
    index = _load_json(root / "PROJECT_INDEX.json", issues)
    nexus = _load_json(root / "NEXUS.json", issues)
    programme = _load_json(root / "programmes/research-lab-bootstrap/STATE.json", issues)
    proposals = _load_json(
        root / "operations/receipts/TSK-LABOPS-CTRL-001/OPEN_PULL_REQUESTS.json", issues
    )
    if not all((status, index, nexus, programme, proposals)):
        return sorted(set(issues))

    assert status is not None and index is not None and nexus is not None
    assert programme is not None and proposals is not None

    entrypoints = index.get("entrypoints")
    if not isinstance(entrypoints, dict):
        issues.append("PROJECT_INDEX.json entrypoints must be an object")
    else:
        for name, relative in entrypoints.items():
            if not isinstance(relative, str) or not relative or not (root / relative).is_file():
                issues.append(f"entrypoint {name!r} references malformed or missing control file: {relative!r}")

    for field in ("status_path", "next_action_path"):
        relative = nexus.get(field)
        if not isinstance(relative, str) or not relative or not (root / relative).is_file():
            issues.append(f"NEXUS.json {field} references malformed or missing control file: {relative!r}")

    rounds = {
        "STATUS.json": status.get("current_round"),
        "PROJECT_INDEX.json": index.get("current_round"),
        "programmes/research-lab-bootstrap/STATE.json": programme.get("round"),
    }
    malformed_rounds = {path: value for path, value in rounds.items() if not isinstance(value, str) or not ROUND_RE.fullmatch(value)}
    if malformed_rounds:
        issues.append(f"malformed active round identifiers: {malformed_rounds}")
    elif len(set(rounds.values())) != 1:
        issues.append(f"conflicting active round identifiers: {rounds}")

    status_tasks = status.get("active_tasks")
    if not isinstance(status_tasks, list) or any(not isinstance(item, str) or not item for item in status_tasks):
        issues.append("STATUS.json active_tasks must be a list of non-empty strings")
        status_tasks = []
    task_sets = {
        "STATUS.json": set(status_tasks),
        "PROJECT_INDEX.json": {index["active_task"]} if index.get("active_task") else set(),
        "programmes/research-lab-bootstrap/STATE.json": {programme["active_task"]} if programme.get("active_task") else set(),
    }
    if len({frozenset(value) for value in task_sets.values()}) != 1:
        issues.append(f"conflicting active task identifiers: {task_sets}")

    visibility = nexus.get("observed_repository_visibility")
    if visibility not in {"PUBLIC", "PRIVATE"}:
        issues.append("NEXUS.json observed_repository_visibility must be PUBLIC or PRIVATE")
    visibility_texts = {
        relative: _read_text(root / relative, issues)
        for relative in ("README.md", "README_START_HERE.md", "CLAUDE.md")
    }
    for relative, text in visibility_texts.items():
        public = bool(re.search(r"repository visibility:\s*`?PUBLIC`?", text, re.IGNORECASE))
        private = bool(re.search(r"repository visibility:\s*`?PRIVATE`?", text, re.IGNORECASE))
        if public == private or (public and visibility != "PUBLIC") or (private and visibility != "PRIVATE"):
            issues.append(f"public/private contradiction in active entrypoint {relative}")

    next_action = _read_text(root / "NEXT_ACTION.md", issues).lower()
    proposal_items = proposals.get("pull_requests")
    if not isinstance(proposal_items, list):
        issues.append("OPEN_PULL_REQUESTS.json pull_requests must be a list")
    else:
        for proposal in proposal_items:
            if not isinstance(proposal, dict):
                issues.append("OPEN_PULL_REQUESTS.json contains a malformed pull request record")
                continue
            round_id = proposal.get("round")
            state = proposal.get("state")
            if state not in {"OPEN", "DRAFT"} or not isinstance(round_id, str):
                continue
            if round_id.lower() not in next_action:
                continue
            if not any(word in next_action for word in REVIEW_WORDS):
                issues.append(
                    f"next action names {round_id} work already represented by open PR #{proposal.get('number')} without review/adjudication/rebase/replacement labeling"
                )

    return sorted(set(issues))


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    issues = check_control_plane(root)
    if issues:
        for issue in issues:
            print(f"CONTROL_PLANE_DRIFT: {issue}")
        return 1
    print("CONTROL_PLANE_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
