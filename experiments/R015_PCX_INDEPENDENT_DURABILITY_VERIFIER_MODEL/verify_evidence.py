#!/usr/bin/env python3
"""Fail-closed exact-byte gate for the bounded R015 evidence packet."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


ROUND = ROOT / "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL"
RECEIPTS = ROOT / "operations/receipts/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL"
TRANSCRIPT = ROUND / "fixtures/CLOSED_TRANSCRIPT.json"
ANCHOR = ROUND / "fixtures/EXTERNAL_ANCHOR.json"
NODE_VERIFIER = ROUND / "independent_transcript_verifier.mjs"
MODEL = ROUND / "crash_lifecycle_model.py"
DEMO = RECEIPTS / "DEMO_REPORT.json"

CLAIM = (
    "DEMONSTRATED_CROSS_IMPLEMENTATION_DURABILITY_TRANSCRIPT_VERIFICATION_"
    "AND_BOUNDED_CRASH_LIFECYCLE_CONSISTENCY"
)

R014_FROZEN_SHA256 = {
    "constitution/schemas/pcx-durable-anchor.schema.json": "3a5605890cbd24ef029ef6e4953d5130e534b276c245180639127ab32c1ac264",
    "experiments/R013_PCX_CONSERVED_CLAIM/fixtures/SUITE.json": "a6ab4fde497b64395767edd1c8e652994e1bfeff0ca258fc661913918329c27b",
    "operations/receipts/R014_PCX_DURABLE_REPLAY/DEMO_REPORT.json": "674a4f5ceecf2861a63b386fb723ba318342ae477cb006abc69bdcb77f47ee6f",
    "operations/receipts/R014_PCX_DURABLE_REPLAY/PROMOTION.json": "3f3db6f8b4629f2365b529ac9f25b599d883ff91b22ab1a72385fa9eeb87312c",
    "operations/tasks/TSK-R014-PCX-DURABLE-REPLAY.json": "28638c1950620593655209135d10b831f4d329d6f1ea8a826dd4ce01b12242d1",
    "system/nexus_lab/cli.py": "ba8e963a4f29330e565bbc4633ea710019ed878bd402392f03245dbade6a1a4f",
    "system/nexus_lab/durable_store.py": "738d8e0222d77741946db66d884689ec90223b28864816cea19e8d5c04c60113",
    "system/nexus_lab/status.py": "2ef1778234a7b03a47043087a097e362a9c9228f8944871c62274e05bbb01c55",
    "system/nexus_lab/verify.py": "c37430ae89933633aa50ac6925a02358e240c0a688aa5fbf56d7a8e86002dbfc",
    "tests/test_r014_durable_replay.py": "7297ad30a5da1cf14f275cf9b289e302f0847aa20e23e02a18abe712cae8eb99",
}

TRANSITIVE_FROZEN_SHA256 = {
    "constitution/schemas/pcx-genesis.schema.json": "20cafaeaa784c204229b5456e6372a43441afee07e8337ce2b1548ef5cd346f5",
    "constitution/schemas/pcx-transfer.schema.json": "8d6900d9b85e2828de4b744360d554d6daffe5c18ae71b99c30b62c3f29253cd",
    "constitution/schemas/pcx-value-receipt.schema.json": "58f8c4d60eedf51f71e684e5bd2af3a50771e9338889dcd7849402e351c485d0",
    "operations/proposals/R013_PCX_CONSERVED_CLAIM/PROTOCOL.md": "9cb641f2767e1d8192391a900058ae7adeefbed6779201bebacd2005b26b1bac",
    "package-lock.json": "dfc3bcb3c0fa067e7f8af3701ac4791f7be1ba265fbbd3b667cdacb0908957c5",
    "package.json": "fd5e21f974f50045d0a2b8284c2907e725c839ab2697b5b2638412e9a7261565",
    "system/nexus_lab/__init__.py": "7cb0079eb07971b5298efc16eb055c87d1304f6fedba09cdc9c3bfc2e0e05df0",
    "system/nexus_lab/util.py": "bdc3c730e49de9c532dfc146e11236a782f8faeefb938fa5d717dbc2bc14f7aa",
    "system/nexus_lab/value_kernel.py": "4a31fca6e6c25170331035124a8451a3dddf3d120ae63ca168dccdcbe98934f5",
}

R015_ROLES = {
    "constitution/schemas/pcx-closed-durable-transcript.schema.json": "R015_SPECIFICATION",
    "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/README.md": "R015_SPECIFICATION",
    "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/crash_lifecycle_model.py": "R015_IMPLEMENTATION",
    "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/export_closed_transcript.py": "R015_IMPLEMENTATION",
    "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/fixtures/CLOSED_TRANSCRIPT.json": "R015_FIXTURE",
    "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/fixtures/EXTERNAL_ANCHOR.json": "R015_FIXTURE",
    "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/generate_fixture.py": "R015_IMPLEMENTATION",
    "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/independent_transcript_verifier.mjs": "R015_IMPLEMENTATION",
    "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/verify_evidence.py": "R015_EVIDENCE_GATE",
    "operations/proposals/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/ACCEPTANCE.md": "R015_SPECIFICATION",
    "operations/proposals/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/BUILD_PACKET.md": "R015_SPECIFICATION",
    "operations/proposals/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/CLAIM_MATRIX.md": "R015_SPECIFICATION",
    "operations/proposals/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/NEXT_ACTION.proposal.md": "R015_SPECIFICATION",
    "operations/proposals/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/PROTOCOL.md": "R015_SPECIFICATION",
    "operations/proposals/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/STATUS.proposal.json": "R015_SPECIFICATION",
    "operations/proposals/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/THREAT_MODEL.md": "R015_SPECIFICATION",
    "operations/receipts/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/COLD_UNANCHORED_REPORT.json": "R015_SAVED_REPORT",
    "operations/receipts/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/COLD_VERIFIER_REPORT.json": "R015_SAVED_REPORT",
    "operations/receipts/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/MODEL_CHECK_REPORT.json": "R015_SAVED_REPORT",
    "operations/receipts/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/MODEL_SELF_TEST_REPORT.json": "R015_SAVED_REPORT",
    "operations/tasks/TSK-R015-PCX-INDEPENDENT-DURABILITY-VERIFIER-MODEL.json": "R015_SPECIFICATION",
    "tests/R015_TEST_NOTES.md": "R015_TEST",
    "tests/test_r015_crash_lifecycle_model.py": "R015_TEST",
    "tests/test_r015_independent_durability_verifier.py": "R015_TEST",
}

EXPECTED_COVERAGE = {
    "anchor_common_prefix_confirms_both_suffixes_without_selecting_fork",
    "anchor_divergent_existing",
    "anchor_exact_current",
    "anchor_exact_earlier",
    "anchor_future",
    "anchor_malformed",
    "anchor_none",
    "anchor_self_hash_invalid",
    "cap_exact_retry_succeeds",
    "cap_fresh_rejects",
    "collision_retry_rejects_without_mutation",
    "commit_crash_complete_new_prefix",
    "commit_crash_old_prefix",
    "declared_corruption_rejection_is_noop",
    "exact_retry_after_later_store_tip",
    "exact_retry_no_append",
    "fresh_success_ack",
    "invalid_retry_rejects_without_mutation",
    "lost_ack_eventual_exact_recovery",
    "older_valid_history_unanchored",
    "postcommit_preack_unknown",
    "precommit_crash_old_prefix",
    "precommit_crash_retry_appends_once",
    "precommit_crash_sibling_intervenes_retry_rejects",
    "repeated_lost_ack",
    "sibling_conflict_rejects",
}

EXPECTED_INVARIANTS = {
    "anchor_classifications_and_limitations",
    "atomic_recovery_no_hybrid",
    "cap_behavior",
    "collision_rejects_without_mutation",
    "conflict_honesty",
    "conservation_and_authority_none",
    "declared_corruption_rejection_is_noop",
    "deterministic_byte_output",
    "duplicate_retry_at_most_once",
    "exact_acknowledgement",
    "lost_ack_recovery",
    "no_ack_before_commit",
    "prefix_validity",
}

EXPECTED_MUTANTS = {
    "ACK_BEFORE_COMMIT",
    "BOTH_SIBLINGS_COMMIT",
    "DUPLICATE_RETRY_APPEND",
    "MALFORMED_ANCHOR_PASS",
    "PRECOMMIT_PERSISTS",
}

EXPECTED_DEMO_STATIC = {
    "baseline_ref": "5d765a3f01e718778a7195415430e7cffae42b57",
    "claims": [
        "A separately implemented Node/Noble verifier recomputed the exact bounded closed transcript rather than trusting producer-derived fields.",
        "The frozen anchored and unanchored reports reproduce byte-for-byte, including explicit unauthenticated-anchor limits.",
        "The standalone finite model exhausts its declared bounds and kills five preregistered lifecycle mutants.",
    ],
    "cold_builder_provenance": {
        "allowed_inputs": [
            "constitution/schemas/pcx-closed-durable-transcript.schema.json",
            "constitution/schemas/pcx-durable-anchor.schema.json",
            "constitution/schemas/pcx-genesis.schema.json",
            "constitution/schemas/pcx-transfer.schema.json",
            "constitution/schemas/pcx-value-receipt.schema.json",
            "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/fixtures/CLOSED_TRANSCRIPT.json",
            "experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/fixtures/EXTERNAL_ANCHOR.json",
            "operations/proposals/R013_PCX_CONSERVED_CLAIM/PROTOCOL.md",
            "operations/proposals/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/BUILD_PACKET.md",
            "operations/proposals/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/PROTOCOL.md",
        ],
        "builder_class": "SAME_PLATFORM_SEPARATE_COLD_AGENT",
        "excluded_inputs": [
            "GIT_HISTORY_AND_STALE_PR_14",
            "R013_EXISTING_JAVASCRIPT_VERIFIER",
            "R014_TESTS",
            "SYSTEM_NEXUS_LAB_PYTHON_IMPLEMENTATION",
        ],
        "strength": "PROCESS_ATTESTATION_NOT_CRYPTOGRAPHIC_PROOF_OR_EXTERNAL_AUDIT",
    },
    "dependency_profile": {
        "cold_runtime_imports": ["@noble/ed25519", "node:crypto", "node:fs/promises"],
        "lock_integrity_sha512": "sha512-pfcObRY3CtvwfaG9Mt5XqZdKmAQppl37tHUeuBhDUbiwJBCVY4/A4lbMvb1xKhMDx96AqAqZpMWuBX1HulhX4g==",
        "node_engine": ">=20",
        "package": "@noble/ed25519",
        "package_manifest_sha256": "870b40869cead323ebba8227d13d960a960cc7e7dca65b77bda85e3cf77247f2",
        "source_entrypoint": "node_modules/@noble/ed25519/index.js",
        "source_entrypoint_sha256": "fe893bfb9286c67892a45c18537035eab3325bc723bb2855ddcb9e9cb57df9aa",
        "version": "3.1.0",
    },
    "demonstrated": [
        "Four stored transfers, receipts, durable-record hashes, five prefix anchors, state roots, and synthetic supply converged exactly in a separate implementation.",
        "A matching caller-supplied tip anchor confirmed sequence 4 while the same transcript without a separate anchor retained all four records as an unconfirmed suffix.",
        "An older valid transcript passed as unanchored; a shared-prefix anchor confirmed two valid divergent suffixes without selecting either suffix.",
        "Malformed, duplicate, excessive, ahead-of-transcript, and transcript-mismatching caller anchors failed closed with non-authoritative classifications.",
        "Resealed inner mutation and malformed raw-input campaigns failed closed without changing input bytes.",
        "The finite model visited 1,995 states and 29,340 transitions, checked 26 coverage classes, and killed all five deliberate mutants.",
    ],
    "non_claims": [
        "The synthetic quantity is not money, economic value, legal property, backing, redemption, purchasing power, liquidity, or a safe store of value.",
        "No private key, wallet, signing, custody, recovery secret, real fund, network, consensus, or global finality is introduced.",
        "The repository anchor fixture is caller-supplied and unauthenticated; it does not prove external retention, freshness, rollback, fork, tampering, or independent custody.",
        "Cold-builder isolation is a process attestation in the same platform and project, not cryptographic proof of independent authorship or an external audit.",
        "The model is finite and abstract; it does not model corrupt bytes or detection, SQLite, Python, filesystems, hardware, power loss, networks, availability, or production operation.",
        "This is bounded research evidence, not formal verification, production security, regulatory approval, or authorization for a live pilot.",
    ],
    "observed": {
        "anchored_highest_confirmed_sequence": "4",
        "anchored_terminal_confirmed": "TRUE",
        "anchored_unconfirmed_suffix_count": "0",
        "final_state_root": "1b28ac32d6067a7b1bd2ec8b7097b341d891a2793a63c606da0c9eecf221598f",
        "model_coverage_classes": 26,
        "model_invariant_checks": 123453,
        "model_max_depth_reached": 8,
        "model_states": 1995,
        "model_transition_digest": "bb819166a96a4b469bdf4d3feec150487bf1b98af444f5c5f9e0165b1ccf7330",
        "model_transitions": 29340,
        "mutants_killed": 5,
        "mutants_survived": 0,
        "prefix_anchors": 5,
        "receipt_head": "fedc92b971f0ea59586678297a981c950d2ac8646e8cf30f79bffc7537893ffc",
        "record_count": "4",
        "record_head": "77e10a0c9be99d788dcaa4d72e96d35056431adda2f6d706b88d40c1464d4ad0",
        "synthetic_supply": "1000",
        "transcript_id": "1d1030d78190e1ed6e6ee6848b24470c9422f9e1941f9003cbb4fd27f4995a59",
        "unanchored_highest_confirmed_sequence": "",
        "unanchored_terminal_confirmed": "FALSE",
        "unanchored_unconfirmed_suffix_count": "4",
    },
    "reproducibility": {
        "anchored_runs": 2,
        "fixture_rebuilds": 2,
        "model_runs": 2,
        "self_test_runs": 2,
        "unanchored_runs": 2,
        "result": "ALL_EXACT_BYTE_MATCH",
    },
    "schema": "nexus.r015-independent-durability-verifier-model-demo/v0",
    "status": CLAIM,
    "status_authority": "NONE",
    "test_commands": [
        "python3 experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/verify_evidence.py",
        "python3 -m unittest -v tests.test_r015_independent_durability_verifier tests.test_r015_crash_lifecycle_model",
    ],
}


class EvidenceFailure(RuntimeError):
    pass


def require(condition: bool, code: str) -> None:
    if not condition:
        raise EvidenceFailure(code)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def no_duplicate_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise EvidenceFailure("DUPLICATE_JSON_KEY")
        result[key] = value
    return result


def load_json(path: Path, *, maximum: int, newline: bool) -> tuple[dict[str, Any], bytes]:
    require(path.is_file() and not path.is_symlink(), "EVIDENCE_PATH_INVALID")
    raw = path.read_bytes()
    require(0 < len(raw) <= maximum, "JSON_SIZE_INVALID")
    require(not raw.startswith(b"\xef\xbb\xbf"), "JSON_BOM_INVALID")
    try:
        value = json.loads(raw.decode("utf-8"), object_pairs_hook=no_duplicate_object)
    except EvidenceFailure:
        raise
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise EvidenceFailure("JSON_INVALID") from exc
    require(isinstance(value, dict), "JSON_OBJECT_REQUIRED")
    expected = canonical_bytes(value) + (b"\n" if newline else b"")
    require(raw == expected, "JSON_NOT_CANONICAL")
    return value, raw


def checked_path(relative: str) -> Path:
    require(relative == Path(relative).as_posix(), "EVIDENCE_PATH_INVALID")
    require(not relative.startswith("/") and ".." not in Path(relative).parts, "EVIDENCE_PATH_INVALID")
    path = ROOT / relative
    require(path.is_file() and not path.is_symlink(), "EVIDENCE_PATH_INVALID")
    require(path.resolve().is_relative_to(ROOT.resolve()), "EVIDENCE_PATH_INVALID")
    return path


def run(command: list[str]) -> bytes:
    environment = dict(os.environ)
    environment.update({"LC_ALL": "C", "PYTHONHASHSEED": "0", "TZ": "UTC"})
    result = subprocess.run(
        command,
        cwd=ROOT,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=180,
        env=environment,
    )
    require(result.returncode == 0, "SUBPROCESS_FAILED")
    require(result.stderr == b"", "SUBPROCESS_STDERR")
    return result.stdout


def run_twice_exact(command: list[str], expected: bytes) -> None:
    first = run(command)
    second = run(command)
    require(first == second == expected, "REPRODUCTION_MISMATCH")


def evidence_roles() -> dict[str, str]:
    roles = dict(R015_ROLES)
    for path in R014_FROZEN_SHA256:
        roles[path] = "R014_FROZEN_INPUT"
    for path in TRANSITIVE_FROZEN_SHA256:
        roles[path] = "TRANSITIVE_FROZEN_INPUT"
    require(len(roles) == len(R015_ROLES) + len(R014_FROZEN_SHA256) + len(TRANSITIVE_FROZEN_SHA256), "EVIDENCE_PATH_COLLISION")
    return roles


def expected_evidence() -> list[dict[str, str]]:
    return [
        {"path": path, "role": role, "sha256": sha256_file(checked_path(path))}
        for path, role in sorted(evidence_roles().items())
    ]


def verify_frozen_inputs() -> None:
    for relative, expected in {**R014_FROZEN_SHA256, **TRANSITIVE_FROZEN_SHA256}.items():
        require(sha256_file(checked_path(relative)) == expected, "FROZEN_INPUT_MISMATCH")


def verify_dependencies() -> None:
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
    require(package.get("engines") == {"node": ">=20"}, "DEPENDENCY_MANIFEST_INVALID")
    require(package.get("dependencies") == {"@noble/ed25519": "3.1.0"}, "DEPENDENCY_MANIFEST_INVALID")
    locked = lock.get("packages", {}).get("node_modules/@noble/ed25519", {})
    require(locked.get("version") == "3.1.0", "DEPENDENCY_LOCK_INVALID")
    require(
        locked.get("integrity") == EXPECTED_DEMO_STATIC["dependency_profile"]["lock_integrity_sha512"],
        "DEPENDENCY_LOCK_INVALID",
    )
    noble_index = ROOT / "node_modules/@noble/ed25519/index.js"
    noble_manifest = ROOT / "node_modules/@noble/ed25519/package.json"
    require(noble_index.is_file() and not noble_index.is_symlink(), "DEPENDENCY_INSTALL_MISSING")
    require(noble_manifest.is_file() and not noble_manifest.is_symlink(), "DEPENDENCY_INSTALL_MISSING")
    require(
        sha256_file(noble_index) == EXPECTED_DEMO_STATIC["dependency_profile"]["source_entrypoint_sha256"],
        "DEPENDENCY_SOURCE_MISMATCH",
    )
    require(
        sha256_file(noble_manifest) == EXPECTED_DEMO_STATIC["dependency_profile"]["package_manifest_sha256"],
        "DEPENDENCY_SOURCE_MISMATCH",
    )


def verify_fixture_rebuilds() -> None:
    from experiments.R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL.generate_fixture import (
        rebuild,
    )

    with tempfile.TemporaryDirectory(prefix="nexus-r015-evidence-") as work:
        root = Path(work)
        first = rebuild(ROOT, root / "first")
        second = rebuild(ROOT, root / "second")
        for label, frozen in (("transcript", TRANSCRIPT), ("anchor", ANCHOR)):
            first_bytes = first[label].read_bytes()
            second_bytes = second[label].read_bytes()
            require(first_bytes == second_bytes == frozen.read_bytes(), "FIXTURE_REBUILD_MISMATCH")


def verify_reports() -> None:
    anchored, anchored_bytes = load_json(
        RECEIPTS / "COLD_VERIFIER_REPORT.json", maximum=1024 * 1024, newline=True
    )
    unanchored, unanchored_bytes = load_json(
        RECEIPTS / "COLD_UNANCHORED_REPORT.json", maximum=1024 * 1024, newline=True
    )
    model, model_bytes = load_json(
        RECEIPTS / "MODEL_CHECK_REPORT.json", maximum=2 * 1024 * 1024, newline=True
    )
    self_test, self_test_bytes = load_json(
        RECEIPTS / "MODEL_SELF_TEST_REPORT.json", maximum=1024 * 1024, newline=True
    )

    run_twice_exact(["node", str(NODE_VERIFIER), str(TRANSCRIPT), str(ANCHOR)], anchored_bytes)
    run_twice_exact(["node", str(NODE_VERIFIER), str(TRANSCRIPT)], unanchored_bytes)
    run_twice_exact(["python3", str(MODEL)], model_bytes)
    run_twice_exact(["python3", str(MODEL), "--self-test"], self_test_bytes)

    require(anchored.get("status") == "PASS", "ANCHORED_REPORT_INVALID")
    require(
        anchored.get("claims")
        == [
            "SEPARATE_NODE_IMPLEMENTATION_RECOMPUTATION_OF_CLOSED_DURABLE_PREFIX",
            "GENESIS_TRANSFERS_RECEIPTS_RECORD_HASHES_AND_PREFIX_ANCHORS_MATCH",
        ]
        == unanchored.get("claims"),
        "COLD_REPORT_CLAIM_INVALID",
    )
    require(anchored.get("anchor_provenance") == "UNAUTHENTICATED_CALLER_SUPPLIED_INTEGRITY_OBSERVATION", "ANCHORED_REPORT_INVALID")
    require(anchored.get("highest_confirmed_sequence") == "4", "ANCHORED_REPORT_INVALID")
    require(anchored.get("terminal_anchor_confirmed") == "TRUE", "ANCHORED_REPORT_INVALID")
    require(anchored.get("unconfirmed_suffix_count") == "0", "ANCHORED_REPORT_INVALID")
    require(unanchored.get("rollback_check") == "UNANCHORED", "UNANCHORED_REPORT_INVALID")
    require(unanchored.get("highest_confirmed_sequence") == "", "UNANCHORED_REPORT_INVALID")
    require(unanchored.get("terminal_anchor_confirmed") == "FALSE", "UNANCHORED_REPORT_INVALID")
    require(unanchored.get("unconfirmed_suffix_count") == "4", "UNANCHORED_REPORT_INVALID")
    require(anchored.get("status_authority") == unanchored.get("status_authority") == "NONE", "AUTHORITY_INVALID")

    counts = model.get("counts", {})
    require(counts.get("states") == 1995, "MODEL_REPORT_INVALID")
    require(counts.get("transitions") == 29340, "MODEL_REPORT_INVALID")
    require(counts.get("invariant_checks") == 123453, "MODEL_REPORT_INVALID")
    require(counts.get("max_depth_reached") == 8, "MODEL_REPORT_INVALID")
    require(model.get("transition_digest") == EXPECTED_DEMO_STATIC["observed"]["model_transition_digest"], "MODEL_REPORT_INVALID")
    coverage = model.get("coverage", {})
    require(set(coverage) == EXPECTED_COVERAGE, "MODEL_COVERAGE_INVALID")
    require(all(isinstance(value, int) and value > 0 for value in coverage.values()), "MODEL_COVERAGE_INVALID")
    invariants = model.get("invariants", [])
    require({item.get("invariant") for item in invariants} == EXPECTED_INVARIANTS, "MODEL_INVARIANTS_INVALID")
    require(all(item.get("status") == "PASS" and item.get("checks", 0) > 0 for item in invariants), "MODEL_INVARIANTS_INVALID")
    mutants = self_test.get("mutants", [])
    require({item.get("mutant") for item in mutants} == EXPECTED_MUTANTS, "MODEL_MUTANTS_INVALID")
    require(all(item.get("killed") == "TRUE" for item in mutants), "MODEL_MUTANTS_INVALID")
    require(self_test.get("killed") == 5 and self_test.get("survived") == 0, "MODEL_MUTANTS_INVALID")
    require(model.get("status") == self_test.get("status") == "PASS", "MODEL_REPORT_INVALID")
    require(model.get("status_authority") == self_test.get("status_authority") == "NONE", "AUTHORITY_INVALID")


def verify_demo() -> str:
    demo, raw = load_json(DEMO, maximum=2 * 1024 * 1024, newline=True)
    require(set(demo) == set(EXPECTED_DEMO_STATIC) | {"evidence"}, "DEMO_SHAPE_INVALID")
    without_evidence = {key: value for key, value in demo.items() if key != "evidence"}
    require(without_evidence == EXPECTED_DEMO_STATIC, "DEMO_CLAIM_INVALID")
    require(demo["evidence"] == expected_evidence(), "DEMO_EVIDENCE_INVALID")
    return hashlib.sha256(raw).hexdigest()


def main() -> int:
    verify_frozen_inputs()
    verify_dependencies()
    verify_fixture_rebuilds()
    verify_reports()
    demo_sha256 = verify_demo()
    report = {
        "evidence_files": len(evidence_roles()),
        "frozen_predecessor_files": len(R014_FROZEN_SHA256),
        "schema": "nexus.r015-evidence-check/v0",
        "status": "PASS",
        "status_authority": "NONE",
        "demo_report_sha256": demo_sha256,
        "transitive_frozen_files": len(TRANSITIVE_FROZEN_SHA256),
    }
    sys.stdout.buffer.write(canonical_bytes(report) + b"\n")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except EvidenceFailure as error:
        sys.stderr.write(f"R015_EVIDENCE_FAIL:{error}\n")
        raise SystemExit(1)
    except Exception:
        sys.stderr.write("R015_EVIDENCE_FAIL:INTERNAL_ERROR\n")
        raise SystemExit(1)
