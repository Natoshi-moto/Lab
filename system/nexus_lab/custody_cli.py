"""Standalone, secret-free command surface for the R016 custody store.

The CLI accepts only an explicit public synthetic genesis, already-signed
events, databases, and caller-held anchors.  It has no key generation, seed,
private-key, signing, repair, import, or promotion command.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from .custody_kernel import CustodyKernelError, MAX_WIRE_BYTES
from .custody_store import (
    CustodyStoreError,
    apply_custody_event,
    audit_custody_store,
    export_custody_anchor,
    init_custody_store,
    load_custody_anchor,
)


def _emit(value: Any) -> None:
    print(json.dumps(value, indent=2, sort_keys=True, ensure_ascii=True))


def _event_bytes(path: Path) -> bytes:
    if path.is_symlink():
        raise CustodyStoreError("EVENT_PATH_INVALID", "Event input may not be a symlink.")
    try:
        with path.open("rb") as handle:
            raw = handle.read(MAX_WIRE_BYTES + 1)
    except OSError as exc:
        raise CustodyStoreError("EVENT_MISSING", str(path)) from exc
    if not raw or len(raw) > MAX_WIRE_BYTES:
        raise CustodyStoreError(
            "EVENT_ENCODING_INVALID", "Event is empty or exceeds 65536 bytes."
        )
    return raw


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="command", required=True)

    initialize = commands.add_parser(
        "store-init", help="Create a new append-only synthetic custody database"
    )
    initialize.add_argument("genesis", type=Path, help="Exact canonical R016 genesis JSON")
    initialize.add_argument("database", type=Path, help="New SQLite database path")

    apply = commands.add_parser(
        "store-apply", help="Replay and append one already-signed custody event"
    )
    apply.add_argument("genesis", type=Path)
    apply.add_argument("database", type=Path)
    apply.add_argument("event", type=Path)
    apply.add_argument("--expected-anchor", type=Path)

    audit = commands.add_parser(
        "store-audit", help="Integrity-check and fully replay a custody database"
    )
    audit.add_argument("genesis", type=Path)
    audit.add_argument("database", type=Path)
    audit.add_argument("--expected-anchor", type=Path)

    export = commands.add_parser(
        "store-export-anchor", help="Export a new caller-held prefix anchor"
    )
    export.add_argument("genesis", type=Path)
    export.add_argument("database", type=Path)
    export.add_argument("--output", required=True, type=Path)
    export.add_argument("--expected-anchor", type=Path)
    return root


def _optional_anchor(path: Path | None) -> dict[str, Any] | None:
    return load_custody_anchor(path) if path is not None else None


def main(argv: list[str] | None = None) -> int:
    arguments = parser().parse_args(argv)
    try:
        if arguments.command == "store-init":
            result = init_custody_store(arguments.genesis, arguments.database)
        elif arguments.command == "store-apply":
            result = apply_custody_event(
                arguments.genesis,
                arguments.database,
                _event_bytes(arguments.event),
                expected_anchor=_optional_anchor(arguments.expected_anchor),
            )
        elif arguments.command == "store-audit":
            result = audit_custody_store(
                arguments.genesis,
                arguments.database,
                expected_anchor=_optional_anchor(arguments.expected_anchor),
            )
        else:
            result = export_custody_anchor(
                arguments.genesis,
                arguments.database,
                arguments.output,
                expected_anchor=_optional_anchor(arguments.expected_anchor),
            )
        _emit(result)
        return 0
    except (CustodyStoreError, CustodyKernelError) as exc:
        code = getattr(exc, "code", "CUSTODY_ERROR")
        print(f"{code}: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
