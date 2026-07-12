from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .util import NexusError, git, list_files, load_json, sha256_file

REQUIRED_PATHS = [
    "NEXUS.json", "STATUS.json", "README_START_HERE.md", "NEXT_ACTION.md", "AGENTS.md", "CLAUDE.md",
    "constitution/AUTHORITY.md", "constitution/PRIVACY.md", "constitution/EVIDENCE.md",
    "constitution/ROUTING.md", "constitution/MUTATION.md", "constitution/CANONICALITY.md", "constitution/AUDIT.md",
    "system/nexus_lab/cli.py", "tests", ".github/workflows/nexus-audit.yml",
]
SECRET_PATTERNS = {
    "OPENAI_STYLE_KEY": re.compile(r"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b"),
    "ANTHROPIC_STYLE_KEY": re.compile(r"\bsk-ant-[A-Za-z0-9_-]{20,}\b"),
    "GITHUB_CLASSIC_TOKEN": re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    "GITHUB_FINE_GRAINED_TOKEN": re.compile(r"\bgithub_pat_[A-Za-z0-9_]{40,}\b"),
    "AWS_ACCESS_KEY": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "PRIVATE_KEY_BLOCK": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
}
TEXT_SUFFIXES = {".md", ".txt", ".json", ".jsonl", ".yaml", ".yml", ".py", ".toml", ".sh", ".csv", ".diff"}


def scan_secrets(root: Path) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for path in list_files(root, exclude_dirs={".git", "derived", "__pycache__"}):
        rel = path.relative_to(root).as_posix()
        if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {"nexus", ".gitignore", ".gitattributes"}:
            continue
        if path.stat().st_size > 5 * 1024 * 1024:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for label, pattern in SECRET_PATTERNS.items():
            for match in pattern.finditer(text):
                line = text.count("\n", 0, match.start()) + 1
                findings.append({"kind": label, "path": rel, "line": line})
    return findings


def run_doctor(root: Path) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    checks: list[dict[str, Any]] = []

    missing = [rel for rel in REQUIRED_PATHS if not (root / rel).exists()]
    if missing:
        errors.extend(f"MISSING_REQUIRED_PATH {rel}" for rel in missing)
    checks.append({"check": "required_paths", "status": "PASS" if not missing else "FAIL", "count": len(REQUIRED_PATHS)})

    json_count = 0
    jsonl_count = 0
    for path in list_files(root, exclude_dirs={".git", "derived", "__pycache__"}):
        rel = path.relative_to(root).as_posix()
        if path.suffix == ".json":
            json_count += 1
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                errors.append(f"INVALID_JSON {rel}: {exc}")
        elif path.suffix == ".jsonl":
            jsonl_count += 1
            for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
                if not line.strip():
                    continue
                try:
                    json.loads(line)
                except json.JSONDecodeError as exc:
                    errors.append(f"INVALID_JSONL {rel}:{number}: {exc}")
    checks.append({"check": "json_parse", "status": "PASS" if not any(e.startswith("INVALID_JSON") for e in errors) else "FAIL", "json_files": json_count, "jsonl_files": jsonl_count})

    secrets = scan_secrets(root)
    if secrets:
        errors.extend(f"POTENTIAL_SECRET {item['kind']} {item['path']}:{item['line']}" for item in secrets)
    checks.append({"check": "secret_patterns", "status": "PASS" if not secrets else "FAIL", "findings": len(secrets)})

    ignore = (root / ".gitignore").read_text(encoding="utf-8") if (root / ".gitignore").exists() else ""
    for required in ("corpus/local-only/*", ".env", "*.pem"):
        if required not in ignore:
            errors.append(f"GITIGNORE_MISSING_RULE {required}")
    checks.append({"check": "privacy_ignore_rules", "status": "PASS" if not any(e.startswith("GITIGNORE_MISSING_RULE") for e in errors) else "FAIL"})

    source_record = root / "corpus/records/sources/SRC-2026-000001.json"
    if source_record.exists():
        record = load_json(source_record)
        source = root / record["path"]
        if not source.exists():
            errors.append("HANDOFF_SOURCE_MISSING")
        elif sha256_file(source) != record["sha256"]:
            errors.append("HANDOFF_SOURCE_HASH_MISMATCH")
    checks.append({"check": "seed_handoff_binding", "status": "PASS" if not any(e.startswith("HANDOFF_") for e in errors) else "FAIL"})

    if (root / ".git").exists():
        status = git(root, "status", "--short", check=False)
        if status:
            warnings.append("WORKTREE_DIRTY")
        checks.append({"check": "git_repository", "status": "PASS", "worktree": "DIRTY" if status else "CLEAN"})
    else:
        warnings.append("GIT_NOT_INITIALIZED")
        checks.append({"check": "git_repository", "status": "WARN", "worktree": "UNAVAILABLE"})

    return {
        "schema": "nexus.doctor-report/v1",
        "status": "FAIL" if errors else "PASS",
        "checks": checks,
        "errors": errors,
        "warnings": warnings,
        "claims": ["Selected structural, parse, privacy-pattern and seed-source checks were executed."],
        "non_claims": ["A PASS is not an exhaustive security, privacy or semantic audit."],
    }
