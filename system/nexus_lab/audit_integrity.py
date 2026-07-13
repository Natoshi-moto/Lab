from __future__ import annotations

import zipfile
from pathlib import Path
from typing import Any

from .audit import check_audit
from .route import verify_manifest_pack
from .snapshot import verify_snapshot_against_git_tree
from .util import NexusError, git, load_json, parse_manifest, safe_join, sha256_file

_MUTABLE_AUDIT_PREFIXES = ("accepted/", "inbox/", "ledger/", "results/")


def _is_mutable_audit_path(relative: str) -> bool:
    return relative.startswith(_MUTABLE_AUDIT_PREFIXES)


def _critical_repo_paths(root: Path, audit_dir: Path, audit_id: str, target: dict[str, Any]) -> list[str]:
    paths = [
        audit_dir / "TARGET.json",
        audit_dir / "MANIFEST.sha256",
        audit_dir / f"{audit_id}.zip",
        audit_dir / f"{audit_id}.zip.sha256",
        safe_join(audit_dir, target["target_snapshot_path"]),
    ]
    target_sidecar = paths[-1].with_suffix(paths[-1].suffix + ".sha256")
    if target_sidecar.exists():
        paths.append(target_sidecar)

    route_record = target.get("route_pack")
    if route_record:
        route_path = safe_join(audit_dir, route_record["path"])
        paths.append(route_path)
        route_sidecar = route_path.with_suffix(route_path.suffix + ".sha256")
        if route_sidecar.exists():
            paths.append(route_sidecar)

    return sorted({path.relative_to(root).as_posix() for path in paths})


def verify_audit_integrity(root: Path, audit_id: str) -> dict[str, Any]:
    audit_dir = root / "operations" / "audits" / audit_id
    target = load_json(audit_dir / "TARGET.json")
    manifest_path = audit_dir / "MANIFEST.sha256"
    pack_path = audit_dir / f"{audit_id}.zip"
    snapshot_path = safe_join(audit_dir, target["target_snapshot_path"])

    if not manifest_path.is_file():
        raise NexusError(f"Audit manifest is missing: {manifest_path.relative_to(root)}")
    if not pack_path.is_file():
        raise NexusError(f"Audit pack is missing: {pack_path.relative_to(root)}")

    loose_manifest_bytes = manifest_path.read_bytes()
    manifest = parse_manifest(loose_manifest_bytes.decode("utf-8"))
    pack_verification = verify_manifest_pack(pack_path)

    try:
        with zipfile.ZipFile(pack_path, "r") as archive:
            packed_manifest_bytes = archive.read("MANIFEST.sha256")
    except (KeyError, zipfile.BadZipFile) as exc:
        raise NexusError("Audit pack does not contain a readable MANIFEST.sha256.") from exc

    if packed_manifest_bytes != loose_manifest_bytes:
        raise NexusError("Loose audit manifest differs from the manifest frozen inside the audit pack.")

    checked_manifest_files = 0
    for relative, expected_digest in manifest.items():
        if _is_mutable_audit_path(relative):
            continue
        path = safe_join(audit_dir, relative)
        if not path.is_file():
            raise NexusError(f"Audit manifest points to missing immutable file: {relative}")
        actual_digest = sha256_file(path)
        if actual_digest != expected_digest:
            raise NexusError(
                f"Audit immutable file differs from frozen manifest: {relative} "
                f"(expected {expected_digest}, got {actual_digest})."
            )
        checked_manifest_files += 1

    snapshot_verification = verify_snapshot_against_git_tree(
        root,
        snapshot_path,
        expected_commit=target["target_commit"],
        expected_sha256=target["target_archive_sha256"],
    )

    critical_paths = _critical_repo_paths(root, audit_dir, audit_id, target)
    git_status = git(root, "status", "--porcelain=v1", "--", *critical_paths, check=False)
    if git_status:
        raise NexusError(
            "Audit target-binding files differ from the Git index; commit or restore them before trusting audit-check:\n"
            + git_status
        )

    report = check_audit(root, audit_id)
    report["integrity_bindings"] = {
        "status": "PASS",
        "audit_pack_sha256": pack_verification["archive_sha256"],
        "manifest_files_checked": checked_manifest_files,
        "critical_git_paths_checked": len(critical_paths),
        "mutable_prefixes_excluded": list(_MUTABLE_AUDIT_PREFIXES),
        "snapshot_payload_git_tree": snapshot_verification["git_tree_binding"],
    }
    return report
