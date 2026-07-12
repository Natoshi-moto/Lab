from __future__ import annotations

import hashlib
import json
import os
import re
import stat
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Iterable, Mapping, Sequence


class NexusError(RuntimeError):
    """Expected, user-actionable Nexus failure."""


IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")


def validate_identifier(value: str, *, label: str = "identifier") -> str:
    if not isinstance(value, str) or not IDENTIFIER_PATTERN.fullmatch(value):
        raise NexusError(f"Unsafe {label}: {value!r}. Use 1-128 ASCII letters, digits, dot, underscore or dash; start with a letter or digit.")
    return value


def find_repo_root(start: Path | None = None) -> Path:
    current = (start or Path.cwd()).resolve()
    for candidate in (current, *current.parents):
        if (candidate / "NEXUS.json").is_file():
            return candidate
    raise NexusError("No Nexus repository found (missing NEXUS.json in this path or its parents).")


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def canonical_json_bytes(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")


def pretty_json(value: Any) -> str:
    return json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
        handle.write(data)
        temp_name = handle.name
    os.replace(temp_name, path)


def atomic_write_text(path: Path, text: str) -> None:
    atomic_write_bytes(path, text.encode("utf-8"))


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise NexusError(f"Required JSON file is missing: {path}") from exc
    except json.JSONDecodeError as exc:
        raise NexusError(f"Invalid JSON in {path}: {exc}") from exc


def run(
    command: Sequence[str],
    *,
    cwd: Path,
    check: bool = True,
    input_text: str | None = None,
) -> subprocess.CompletedProcess[str]:
    try:
        result = subprocess.run(
            list(command),
            cwd=cwd,
            check=False,
            text=True,
            input=input_text,
            capture_output=True,
        )
    except FileNotFoundError as exc:
        raise NexusError(f"Required executable is unavailable: {command[0]}") from exc
    if check and result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or f"exit {result.returncode}"
        raise NexusError(f"Command failed: {' '.join(command)}\n{detail}")
    return result


def git(root: Path, *args: str, check: bool = True) -> str:
    return run(["git", *args], cwd=root, check=check).stdout.strip()


def resolve_commit(root: Path, ref: str) -> str:
    commit = git(root, "rev-parse", "--verify", f"{ref}^{{commit}}")
    if len(commit) != 40 or any(ch not in "0123456789abcdef" for ch in commit):
        raise NexusError(f"Git did not resolve {ref!r} to a full commit SHA.")
    return commit


def git_commit_time(root: Path, commit: str) -> str:
    return git(root, "show", "-s", "--format=%cI", commit)


def validate_relative_path(value: str) -> PurePosixPath:
    if not value or "\\" in value or any(ord(ch) < 32 or ord(ch) == 127 for ch in value):
        raise NexusError(f"Unsafe or empty repository path: {value!r}")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise NexusError(f"Unsafe repository path: {value!r}")
    if path.parts and path.parts[0] == ".git":
        raise NexusError("The .git directory cannot be routed or packaged.")
    return path


def safe_join(root: Path, relative: str) -> Path:
    rel = validate_relative_path(relative)
    candidate = (root / Path(*rel.parts)).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError as exc:
        raise NexusError(f"Path escapes repository root: {relative!r}") from exc
    return candidate


def parse_manifest(text: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for number, raw in enumerate(text.splitlines(), start=1):
        if not raw.strip():
            continue
        if "  " not in raw:
            raise NexusError(f"Malformed manifest line {number}: {raw!r}")
        digest, path = raw.split("  ", 1)
        if len(digest) != 64 or any(ch not in "0123456789abcdef" for ch in digest):
            raise NexusError(f"Malformed SHA-256 on manifest line {number}.")
        validate_relative_path(path)
        if path in result:
            raise NexusError(f"Duplicate manifest path: {path}")
        result[path] = digest
    return result


def render_manifest(entries: Mapping[str, bytes]) -> str:
    return "".join(f"{sha256_bytes(entries[path])}  {path}\n" for path in sorted(entries))


def zip_mode(executable: bool = False) -> int:
    mode = stat.S_IFREG | (0o755 if executable else 0o644)
    return mode << 16


def ensure_clean_worktree(root: Path) -> None:
    status = git(root, "status", "--short")
    if status:
        raise NexusError("Working tree is not clean; commit or stash changes before this operation.\n" + status)


def list_files(root: Path, *, exclude_dirs: Iterable[str] = ()) -> list[Path]:
    excluded = set(exclude_dirs)
    paths: list[Path] = []
    for path in root.rglob("*"):
        rel = path.relative_to(root)
        if any(part in excluded for part in rel.parts):
            continue
        if path.is_file():
            paths.append(path)
    return sorted(paths, key=lambda p: p.relative_to(root).as_posix())
