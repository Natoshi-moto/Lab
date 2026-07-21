#!/usr/bin/env python3
"""Verify products/REGISTRY.json containment rules.

Fail closed: missing registry, unregistered product dirs, missing paths,
nested_git pin mismatches (when enabled).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

LAB_ROOT = Path(__file__).resolve().parents[3]
PRODUCTS = LAB_ROOT / "products"
REGISTRY = PRODUCTS / "REGISTRY.json"
SCHEMA = PRODUCTS / "REGISTRY.schema.json"
REQUIRED_PACKAGE_FIELDS = {
    "id", "path", "kind", "ring", "status", "status_authority",
    "parent_programme", "checkpoint_bind", "nested_git", "ai_default_seat",
    "fat_drop_include", "synthetic_economy_surface",
    "real_world_value_forbidden", "readme",
}
KINDS = {"host", "blocks", "engine", "tool", "drop-slice"}
STATUSES = {"scaffold", "build", "runtime-pending", "drop-ready"}


def main() -> int:
    errors: list[str] = []

    if not PRODUCTS.is_dir():
        # Phase 0 may not have created products yet — soft skip with message
        print("NOTE: products/ does not exist yet (Phase 0 not started).")
        print("PASS (pre-scaffold)")
        return 0

    if not REGISTRY.is_file():
        errors.append(f"missing {REGISTRY.relative_to(LAB_ROOT)}")
        return fail(errors)

    if not SCHEMA.is_file():
        errors.append(f"missing {SCHEMA.relative_to(LAB_ROOT)}")
        return fail(errors)

    try:
        data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"REGISTRY.json invalid JSON: {e}")
        return fail(errors)

    try:
        json.loads(SCHEMA.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"REGISTRY.schema.json invalid JSON: {e}")
        return fail(errors)

    if data.get("schema") != "nexus.products-registry/v1":
        errors.append("registry schema must be nexus.products-registry/v1")
    if data.get("status_authority") != "NONE":
        errors.append("registry status_authority must be NONE")

    packages = data.get("packages")
    if not isinstance(packages, list):
        errors.append("REGISTRY.json must contain packages: []")
        return fail(errors)

    registered_paths: set[str] = set()
    registered_ids: set[str] = set()
    for i, pkg in enumerate(packages):
        if not isinstance(pkg, dict):
            errors.append(f"packages[{i}] not an object")
            continue
        pid = pkg.get("id")
        path = pkg.get("path")
        missing = sorted(REQUIRED_PACKAGE_FIELDS - pkg.keys())
        if missing:
            errors.append(f"packages[{i}] missing fields: {', '.join(missing)}")
        if not pid or not path:
            errors.append(f"packages[{i}] missing id or path")
            continue
        if pid in registered_ids:
            errors.append(f"duplicate package id: {pid}")
        registered_ids.add(pid)
        if path in registered_paths:
            errors.append(f"duplicate package path: {path}")
        registered_paths.add(path.rstrip("/"))
        if path != f"products/{pid}":
            errors.append(f"package {pid}: path must be products/{pid}")
        if pkg.get("kind") not in KINDS:
            errors.append(f"package {pid}: invalid kind")
        if pkg.get("status") not in STATUSES:
            errors.append(f"package {pid}: invalid status")
        if pkg.get("ring") not in range(4):
            errors.append(f"package {pid}: ring must be an integer from 0 to 3")
        if pkg.get("parent_programme") != "NOTED_PROJECT_OS_001":
            errors.append(f"package {pid}: invalid parent_programme")
        if pkg.get("checkpoint_bind") != "BGEN-CANONICAL-CHECKPOINT-001":
            errors.append(f"package {pid}: invalid checkpoint_bind")
        p = LAB_ROOT / path
        if not p.is_dir():
            errors.append(f"package {pid}: path missing: {path}")
            continue
        readme_path = pkg.get("readme")
        readme = LAB_ROOT / readme_path if isinstance(readme_path, str) else p / "README.md"
        if not readme.is_file():
            errors.append(f"package {pid}: missing declared README.md")
        elif readme != p / "README.md":
            errors.append(f"package {pid}: readme must be {path}/README.md")
        if pkg.get("real_world_value_forbidden") is not True:
            errors.append(f"package {pid}: real_world_value_forbidden must be true")
        if pkg.get("status_authority") != "NONE":
            errors.append(f"package {pid}: status_authority must be NONE")
        nested = pkg.get("nested_git") or {}
        if nested.get("enabled"):
            pin = nested.get("pinned_commit")
            if not pin or len(str(pin)) < 40:
                errors.append(f"package {pid}: nested_git requires full pinned_commit")
            else:
                git_dir = p / ".git"
                if git_dir.exists():
                    try:
                        head = subprocess.check_output(
                            ["git", "-C", str(p), "rev-parse", "HEAD"],
                            text=True,
                        ).strip()
                        if not head.startswith(str(pin)[:40]) and head != pin:
                            # allow pin equality full sha
                            if head != pin:
                                errors.append(
                                    f"package {pid}: nested HEAD {head} != pin {pin}"
                                )
                    except subprocess.CalledProcessError as e:
                        errors.append(f"package {pid}: git rev-parse failed: {e}")

    # Unregistered directories directly under products/
    for child in sorted(PRODUCTS.iterdir()):
        if not child.is_dir():
            continue
        if child.name.startswith("."):
            continue
        rel = str(child.relative_to(LAB_ROOT))
        if rel not in registered_paths:
            errors.append(f"unregistered directory under products/: {rel}")

    if errors:
        return fail(errors)

    print(f"PASS registry: {len(packages)} package(s) ok")
    return 0


def fail(errors: list[str]) -> int:
    print("FAIL verify_registry:")
    for e in errors:
        print(f"  - {e}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
