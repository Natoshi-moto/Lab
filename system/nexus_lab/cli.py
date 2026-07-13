from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from .audit import build_audit_pack, ingest_observation
from .audit_integrity import verify_audit_integrity
from .doctor import run_doctor
from .exchange import (
    accept_exchange,
    build_exchange_pack,
    verify_exchange_ledger,
    verify_exchange_pack,
    write_exchange_template,
)
from .github import github_bootstrap
from .route import build_route
from .shadow import build_cognition_shadow, verify_cognition_shadow, verify_cold_consumer_report
from .snapshot import build_snapshot, verify_snapshot
from .status import enforce_assurance_blocks, render_status_file
from .util import NexusError, find_repo_root, load_json, pretty_json
from .verify import verify_repository


def emit(value: Any, *, json_output: bool = False) -> None:
    if json_output or isinstance(value, (dict, list)):
        print(json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False))
    else:
        print(value)


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="nexus", description="Nexus private research-lab operator shell")
    p.add_argument("--root", type=Path, help="Repository root (normally auto-detected)")
    sub = p.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="Show machine and generated status")
    sub.add_parser("next", help="Show exactly one next action")
    doctor = sub.add_parser("doctor", help="Run structural, parse and privacy-pattern diagnostics")
    doctor.add_argument("--json", action="store_true", dest="as_json")
    verify = sub.add_parser("verify", help="Verify repository, snapshots and audit ledgers")
    verify.add_argument("--snapshot", type=Path)

    sub.add_parser("render-status", help="Regenerate STATUS.md from STATUS.json")

    freeze = sub.add_parser("freeze", help="Build a deterministic CANONICAL_AS_IS snapshot from a Git ref")
    freeze.add_argument("--ref", required=True)
    freeze.add_argument("--snapshot-id", required=True)
    freeze.add_argument("--output", required=True, type=Path)
    freeze.add_argument("--profile", default="full-private-git")

    route = sub.add_parser("route", help="Compile a provider-neutral route pack")
    route.add_argument("task", help="Task ID or JSON path")

    audit_pack = sub.add_parser("audit-pack", help="Build a read-only audit pack")
    audit_pack.add_argument("--audit-id", required=True)
    audit_pack.add_argument("--target", required=True, type=Path)
    audit_pack.add_argument("--route-zip", type=Path)

    audit_ingest = sub.add_parser("audit-ingest", help="Validate or append one audit observation")
    audit_ingest.add_argument("--audit-id", required=True)
    audit_ingest.add_argument("--check-only", action="store_true")
    audit_ingest.add_argument("observation", type=Path)

    audit_check = sub.add_parser("audit-check", help="Verify target, immutable bindings and append-only audit ledger")
    audit_check.add_argument("--audit-id", required=True)

    exchange_template = sub.add_parser(
        "exchange-template",
        help="Create a route-bound bounded-work return template",
    )
    exchange_template.add_argument("--route-zip", required=True, type=Path, help="Exact generated route ZIP")
    exchange_template.add_argument("--created-at", required=True, help="ISO-8601 creation timestamp")
    exchange_template.add_argument("--expires-at", required=True, help="ISO-8601 expiry timestamp")
    exchange_template.add_argument("--output", required=True, type=Path, help="New return-draft JSON")

    exchange_pack = sub.add_parser(
        "exchange-pack",
        help="Build one deterministic bounded-work return pack",
    )
    exchange_pack.add_argument("draft", type=Path, help="Work-return draft JSON")
    exchange_pack.add_argument(
        "--artifact-root",
        required=True,
        type=Path,
        help="Root containing the draft's artifact paths",
    )
    exchange_pack.add_argument("--route-zip", required=True, type=Path, help="Exact generated route ZIP")
    exchange_pack.add_argument("--output", required=True, type=Path, help="New return-pack ZIP")

    exchange_verify = sub.add_parser(
        "exchange-verify",
        help="Verify a bounded-work return without settling it",
    )
    exchange_verify.add_argument("pack", type=Path, help="Return-pack ZIP")
    exchange_verify.add_argument("--route-zip", required=True, type=Path, help="Exact generated route ZIP")

    exchange_accept = sub.add_parser(
        "exchange-accept",
        help="Verify and settle one bounded-work return in a local ledger",
    )
    exchange_accept.add_argument("pack", type=Path, help="Return-pack ZIP")
    exchange_accept.add_argument("--route-zip", required=True, type=Path, help="Exact generated route ZIP")
    exchange_accept.add_argument(
        "--ledger",
        required=True,
        type=Path,
        help="Append-only local settlement ledger",
    )

    exchange_ledger_check = sub.add_parser(
        "exchange-ledger-check",
        help="Verify the local exchange receipt and accepted-state chains",
    )
    exchange_ledger_check.add_argument("ledger", type=Path, help="Settlement ledger JSONL")

    shadow_build = sub.add_parser(
        "shadow-build",
        help="Build the frozen R012 cognition-shadow workload",
    )
    shadow_build.add_argument("--corpus-root", required=True, type=Path, help="Frozen fixture corpus root")
    shadow_build.add_argument("--exchange-id", required=True, help="Bound exchange SHA-256 identifier")
    shadow_build.add_argument("--source-prefix", default="", help="Repository-relative prefix for routed source paths")
    shadow_build.add_argument("--output", required=True, type=Path, help="New SHADOW.json path")

    shadow_verify = sub.add_parser(
        "shadow-verify",
        help="Rebuild and verify the frozen R012 cognition shadow",
    )
    shadow_verify.add_argument("shadow", type=Path, help="SHADOW.json to verify")
    shadow_verify.add_argument("--corpus-root", required=True, type=Path, help="Frozen fixture corpus root")
    shadow_verify.add_argument("--exchange-id", required=True, help="Expected exchange SHA-256 identifier")
    shadow_verify.add_argument("--source-prefix", default="", help="Repository-relative prefix for routed source paths")

    cold_check = sub.add_parser(
        "cold-consumer-check",
        help="Verify the frozen R012 cold-context decision brief",
    )
    cold_check.add_argument("report", type=Path, help="Cold-consumer report JSON")
    cold_check.add_argument("--corpus-root", required=True, type=Path, help="Frozen fixture corpus root")

    github = sub.add_parser("github-bootstrap", help="Create or verify a private GitHub repository and push")
    github.add_argument("--repo-name", default="nexus-research-lab")
    return p


def _task_path(root: Path, value: str) -> Path:
    direct = Path(value)
    if direct.is_file():
        return direct.resolve()
    candidate = root / "operations" / "tasks" / (value if value.endswith(".json") else value + ".json")
    if not candidate.is_file():
        raise NexusError(f"Task not found: {value}")
    return candidate


def _repo_path(root: Path, value: Path) -> Path:
    """Resolve operator paths consistently relative to the selected repository."""
    return value.resolve() if value.is_absolute() else root / value


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        root = args.root.resolve() if args.root else find_repo_root()
        gate = enforce_assurance_blocks(root, args.command)
        for warning in gate["warnings"]:
            print(
                f"NEXUS WARN: assurance gate {warning['id']} for `{args.command}`: {warning['reason']}",
                file=sys.stderr,
            )

        if args.command == "status":
            status = load_json(root / "STATUS.json")
            print(pretty_json(status), end="")
        elif args.command == "next":
            print((root / "NEXT_ACTION.md").read_text(encoding="utf-8"), end="")
        elif args.command == "doctor":
            report = run_doctor(root)
            if args.as_json:
                emit(report, json_output=True)
            else:
                print(f"NEXUS DOCTOR: {report['status']}")
                for check in report["checks"]:
                    print(f"  {check['status']:4} {check['check']}")
                for item in report["errors"]:
                    print(f"  ERROR {item}")
                for item in report["warnings"]:
                    print(f"  WARN  {item}")
                print("NON-CLAIM: A pass is not an exhaustive security, privacy or semantic audit.")
            return 0 if report["status"] == "PASS" else 2
        elif args.command == "verify":
            snapshot = args.snapshot
            if snapshot and not snapshot.is_absolute():
                snapshot = root / snapshot
            emit(verify_repository(root, snapshot=snapshot))
        elif args.command == "render-status":
            emit({"status_file": str(render_status_file(root).relative_to(root))})
        elif args.command == "freeze":
            output = args.output if args.output.is_absolute() else root / args.output
            emit(build_snapshot(root, ref=args.ref, snapshot_id=args.snapshot_id, output=output, profile=args.profile))
        elif args.command == "route":
            emit(build_route(root, _task_path(root, args.task)))
        elif args.command == "audit-pack":
            target = args.target if args.target.is_absolute() else root / args.target
            route_zip = args.route_zip
            if route_zip and not route_zip.is_absolute():
                route_zip = root / route_zip
            emit(build_audit_pack(root, audit_id=args.audit_id, target_snapshot=target, route_zip=route_zip))
        elif args.command == "audit-ingest":
            observation = args.observation if args.observation.is_absolute() else root / args.observation
            emit(ingest_observation(root, args.audit_id, observation, check_only=args.check_only))
        elif args.command == "audit-check":
            emit(verify_audit_integrity(root, args.audit_id))
        elif args.command == "exchange-template":
            emit(
                write_exchange_template(
                    _repo_path(root, args.output),
                    created_at=args.created_at,
                    expires_at=args.expires_at,
                    route_path=_repo_path(root, args.route_zip),
                )
            )
        elif args.command == "exchange-pack":
            emit(
                build_exchange_pack(
                    _repo_path(root, args.draft),
                    artifact_root=_repo_path(root, args.artifact_root),
                    route_path=_repo_path(root, args.route_zip),
                    output_path=_repo_path(root, args.output),
                )
            )
        elif args.command == "exchange-verify":
            emit(
                verify_exchange_pack(
                    _repo_path(root, args.pack),
                    route_path=_repo_path(root, args.route_zip),
                )
            )
        elif args.command == "exchange-accept":
            emit(
                accept_exchange(
                    _repo_path(root, args.pack),
                    route_path=_repo_path(root, args.route_zip),
                    ledger_path=_repo_path(root, args.ledger),
                )
            )
        elif args.command == "exchange-ledger-check":
            emit(verify_exchange_ledger(_repo_path(root, args.ledger)))
        elif args.command == "shadow-build":
            emit(
                build_cognition_shadow(
                    _repo_path(root, args.corpus_root),
                    _repo_path(root, args.output),
                    exchange_id=args.exchange_id,
                    source_prefix=args.source_prefix,
                )
            )
        elif args.command == "shadow-verify":
            emit(
                verify_cognition_shadow(
                    _repo_path(root, args.corpus_root),
                    _repo_path(root, args.shadow),
                    exchange_id=args.exchange_id,
                    source_prefix=args.source_prefix,
                )
            )
        elif args.command == "cold-consumer-check":
            emit(
                verify_cold_consumer_report(
                    _repo_path(root, args.corpus_root),
                    _repo_path(root, args.report),
                )
            )
        elif args.command == "github-bootstrap":
            emit(github_bootstrap(root, repo_name=args.repo_name))
        else:
            raise NexusError(f"Unhandled command: {args.command}")
        return 0
    except NexusError as exc:
        print(f"NEXUS ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
