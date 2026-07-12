from __future__ import annotations

import os
import subprocess
from pathlib import Path


def run(command: list[str], cwd: Path, *, env: dict[str, str] | None = None) -> str:
    merged = os.environ.copy()
    if env:
        merged.update(env)
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True, env=merged, check=False)
    if result.returncode != 0:
        raise AssertionError(f"command failed: {' '.join(command)}\nstdout={result.stdout}\nstderr={result.stderr}")
    return result.stdout.strip()


def init_git_repo(root: Path) -> str:
    root.mkdir(parents=True, exist_ok=True)
    run(["git", "init", "-b", "main"], root)
    run(["git", "config", "user.name", "Nexus Test"], root)
    run(["git", "config", "user.email", "nexus-test@local.invalid"], root)
    return commit_all(root, "initial")


def commit_all(root: Path, message: str) -> str:
    run(["git", "add", "-A"], root)
    env = {
        "GIT_AUTHOR_DATE": "2026-07-12T12:00:00+00:00",
        "GIT_COMMITTER_DATE": "2026-07-12T12:00:00+00:00",
    }
    run(["git", "commit", "--allow-empty", "-m", message], root, env=env)
    return run(["git", "rev-parse", "HEAD"], root)
