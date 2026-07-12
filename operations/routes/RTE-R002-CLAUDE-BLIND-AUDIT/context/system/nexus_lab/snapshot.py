from __future__ import annotations

import json
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any

from .util import (
    NexusError,
    atomic_write_text,
    canonical_json_bytes,
    git,
    git_commit_time,
    parse_manifest,
    render_manifest,
    resolve_commit,
    sha256_bytes,
    sha256_file,
    validate_relative_path,
    zip_mode,
)

FIXED_ZIP_TIME = (1980, 1, 1, 0, 0, 0)
CANONICAL_NONCLAIM = (
    "This artifact is canonical as a historical, methodological and governance record "
    "of exact bytes and declared status. It is not a claim that the contained system is "
    "correct, complete, secure or release-ready."
)


def _git_tree_entries(root: Path, commit: str) -> dict[str, tuple[bytes, bool]]:
    output = git(root, "ls-tree", "-r", "-z", commit)
    # git() strips trailing NUL; preserve all records that remain.
    records = output.split("\x00") if output else []
    entries: dict[str, tuple[bytes, bool]] = {}
    for record in records:
        if not record:
            continue
        try:
            meta, path = record.split("\t", 1)
            mode, kind, object_id = meta.split(" ", 2)
        except ValueError as exc:
            raise NexusError(f"Unexpected git ls-tree record: {record!r}") from exc
        if kind != "blob":
            continue
        validate_relative_path(path)
        if mode == "120000":
            raise NexusError(f"Snapshots refuse symbolic links: {path}")
        data = git_blob(root, object_id)
        entries[path] = (data, mode == "100755")
    return entries


def git_blob(root: Path, object_id: str) -> bytes:
    import subprocess

    result = subprocess.run(
        ["git", "cat-file", "blob", object_id], cwd=root, check=False, capture_output=True
    )
    if result.returncode != 0:
        raise NexusError(result.stderr.decode("utf-8", errors="replace").strip())
    return result.stdout


def _write_zip(path: Path, entries: dict[str, tuple[bytes, bool]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in sorted(entries):
            data, executable = entries[name]
            info = zipfile.ZipInfo(name, FIXED_ZIP_TIME)
            info.create_system = 3
            info.external_attr = zip_mode(executable)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.flag_bits |= 0x800  # UTF-8
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def build_snapshot(
    root: Path,
    *,
    ref: str,
    snapshot_id: str,
    output: Path,
    profile: str = "full-private-git",
) -> dict[str, Any]:
    commit = resolve_commit(root, ref)
    tree = _git_tree_entries(root, commit)
    payload_bytes = {path: data for path, (data, _) in tree.items()}
    payload_manifest = render_manifest(payload_bytes).encode("utf-8")
    metadata = {
        "schema": "nexus.snapshot/v1",
        "snapshot_id": snapshot_id,
        "status": "CANONICAL_AS_IS",
        "profile": profile,
        "source_ref": ref,
        "source_commit": commit,
        "source_commit_time": git_commit_time(root, commit),
        "payload_file_count": len(payload_bytes),
        "payload_manifest_sha256": sha256_bytes(payload_manifest),
        "nonclaim": CANONICAL_NONCLAIM,
        "determinism": {
            "member_order": "UTF8_PATH_SORT",
            "member_timestamp": "1980-01-01T00:00:00Z",
            "compression": "DEFLATE_LEVEL_9",
            "permissions": "GIT_EXECUTABLE_BIT_ONLY",
        },
    }
    meta_bytes = canonical_json_bytes(metadata)
    package_entries = dict(payload_bytes)
    package_entries["_nexus/PAYLOAD_MANIFEST.sha256"] = payload_manifest
    package_entries["_nexus/SNAPSHOT_METADATA.json"] = meta_bytes
    package_manifest = render_manifest(package_entries).encode("utf-8")

    zip_entries: dict[str, tuple[bytes, bool]] = dict(tree)
    zip_entries["_nexus/PAYLOAD_MANIFEST.sha256"] = (payload_manifest, False)
    zip_entries["_nexus/SNAPSHOT_METADATA.json"] = (meta_bytes, False)
    zip_entries["_nexus/PACKAGE_MANIFEST.sha256"] = (package_manifest, False)
    _write_zip(output, zip_entries)

    digest = sha256_file(output)
    sidecar = output.with_suffix(output.suffix + ".sha256")
    atomic_write_text(sidecar, f"{digest}  {output.name}\n")
    return {
        **metadata,
        "archive_path": output.relative_to(root).as_posix() if output.is_relative_to(root) else str(output),
        "archive_sha256": digest,
        "sidecar_path": sidecar.relative_to(root).as_posix() if sidecar.is_relative_to(root) else str(sidecar),
    }


def _safe_zip_name(name: str) -> None:
    if "\\" in name:
        raise NexusError(f"ZIP member uses backslashes: {name!r}")
    path = PurePosixPath(name)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise NexusError(f"Unsafe ZIP member path: {name!r}")


def verify_snapshot(path: Path, *, expected_sha256: str | None = None) -> dict[str, Any]:
    if not path.is_file():
        raise NexusError(f"Snapshot is missing: {path}")
    digest = sha256_file(path)
    if expected_sha256 and digest != expected_sha256:
        raise NexusError(f"Snapshot digest mismatch: expected {expected_sha256}, got {digest}")

    with zipfile.ZipFile(path, "r") as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise NexusError("Snapshot contains duplicate ZIP member names.")
        if names != sorted(names):
            raise NexusError("Snapshot members are not in deterministic sorted order.")
        entries: dict[str, bytes] = {}
        for info in archive.infolist():
            _safe_zip_name(info.filename)
            mode = (info.external_attr >> 16) & 0xFFFF
            if (mode & 0o170000) == 0o120000:
                raise NexusError(f"Snapshot contains a symbolic link: {info.filename}")
            if info.date_time != FIXED_ZIP_TIME:
                raise NexusError(f"Snapshot member timestamp is not deterministic: {info.filename}")
            entries[info.filename] = archive.read(info)

    for required in (
        "_nexus/PAYLOAD_MANIFEST.sha256",
        "_nexus/SNAPSHOT_METADATA.json",
        "_nexus/PACKAGE_MANIFEST.sha256",
    ):
        if required not in entries:
            raise NexusError(f"Snapshot is missing {required}")

    package_manifest = parse_manifest(entries["_nexus/PACKAGE_MANIFEST.sha256"].decode("utf-8"))
    package_subject = {k: v for k, v in entries.items() if k != "_nexus/PACKAGE_MANIFEST.sha256"}
    if set(package_manifest) != set(package_subject):
        raise NexusError("Package manifest member set does not match ZIP contents.")
    for member, expected in package_manifest.items():
        actual = sha256_bytes(package_subject[member])
        if actual != expected:
            raise NexusError(f"Package manifest mismatch for {member}: expected {expected}, got {actual}")

    payload_manifest = parse_manifest(entries["_nexus/PAYLOAD_MANIFEST.sha256"].decode("utf-8"))
    payload_subject = {k: v for k, v in entries.items() if not k.startswith("_nexus/")}
    if set(payload_manifest) != set(payload_subject):
        raise NexusError("Payload manifest member set does not match payload contents.")
    for member, expected in payload_manifest.items():
        actual = sha256_bytes(payload_subject[member])
        if actual != expected:
            raise NexusError(f"Payload manifest mismatch for {member}: expected {expected}, got {actual}")

    try:
        metadata = json.loads(entries["_nexus/SNAPSHOT_METADATA.json"])
    except json.JSONDecodeError as exc:
        raise NexusError(f"Invalid snapshot metadata JSON: {exc}") from exc
    if metadata.get("status") != "CANONICAL_AS_IS":
        raise NexusError("Snapshot metadata does not declare CANONICAL_AS_IS.")
    if metadata.get("payload_manifest_sha256") != sha256_bytes(entries["_nexus/PAYLOAD_MANIFEST.sha256"]):
        raise NexusError("Snapshot metadata payload-manifest digest does not match.")
    return {
        "path": str(path),
        "archive_sha256": digest,
        "file_count": len(payload_subject),
        "snapshot_id": metadata.get("snapshot_id"),
        "source_commit": metadata.get("source_commit"),
        "status": metadata.get("status"),
    }
