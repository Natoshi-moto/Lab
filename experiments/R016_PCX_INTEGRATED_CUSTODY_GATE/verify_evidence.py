#!/usr/bin/env python3
"""Fail-closed exact-byte gate for the bounded R016 custody proposal.

The gate freezes all 45 R015 predecessor objects, rebuilds the public vectors,
re-executes two independent transcript verifiers, exercises the real durable
store, reruns the bounded model and mutants, executes every focused R016 test,
and compares the complete evidence inventory with the saved demo report.
"""

from __future__ import annotations

import base64
import hashlib
import importlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

ROUND = ROOT / "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE"
FIXTURES = ROUND / "fixtures"
RECEIPTS = ROOT / "operations/receipts/R016_PCX_INTEGRATED_CUSTODY_GATE"
GENESIS = FIXTURES / "GENESIS.json"
TRANSCRIPT = FIXTURES / "CLOSED_TRANSCRIPT.json"
PYTHON_VERIFIER = ROUND / "verify_transcript.py"
NODE_VERIFIER = ROUND / "independent_verifier.mjs"
STORE_DEMO = ROUND / "run_store_demo.py"
MODEL = ROUND / "bounded_model.py"
DEMO = RECEIPTS / "DEMO_REPORT.json"

CLAIM = (
    "DEMONSTRATED_SYNTHETIC_CONTROLLER_BOUND_KEY_ROTATION_REVOCATION_"
    "AND_QUORUM_RECOVERY_UNDER_ONE_CRASH_CONSISTENT_LOCAL_ORDER"
)
BASELINE_REF = "8e23e76ea2808131f1683a50abccb48078afff35"
R015_DEMO_SHA256 = (
    "ab3e3d2b3c7c092eb4ea1e1e7526b4b497d86e4a30f3d492e0111b60872ca3d8"
)
R015_PROMOTION_SHA256 = (
    "ac5395360a93f7c0a7aa86e9ada4ed3f5cae2206d62f152d7b4d7bbabc539ca1"
)
R015_DEMO = (
    ROOT
    / "operations/receipts/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/DEMO_REPORT.json"
)
R015_PROMOTION = (
    ROOT
    / "operations/receipts/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/PROMOTION.json"
)

EXPECTED_TRANSCRIPT_ID = (
    "65937989cb22b041fc39c28f972dea5196b589cda931e1356d726d0d03af2ee3"
)
EXPECTED_INITIAL_ROOT = (
    "3c9cc0a0bad9df2d99ead2c109569b8ad4dff3a5df36a600ca2b7ee434f2013b"
)
EXPECTED_FINAL_ROOT = (
    "e272c98be2cd242d9a27762e256a5563cd7570e4a039e9bffe2bf1258587fb44"
)
EXPECTED_CROSS_REPORT_SHA256 = (
    "ca924ab85e0319711cfa45449e4913c592ff77ba0bbe1af7add505f6a4c20723"
)
EXPECTED_STORE_REPORT_SHA256 = (
    "71fe9ef38c9064d41906529615a0c57ddffad4e3a37750896dc1c110e240801a"
)

NOBLE_INTEGRITY = (
    "sha512-pfcObRY3CtvwfaG9Mt5XqZdKmAQppl37tHUeuBhDUbiwJBCVY4/"
    "A4lbMvb1xKhMDx96AqAqZpMWuBX1HulhX4g=="
)
NOBLE_INDEX_SHA256 = (
    "fe893bfb9286c67892a45c18537035eab3325bc723bb2855ddcb9e9cb57df9aa"
)
NOBLE_MANIFEST_SHA256 = (
    "870b40869cead323ebba8227d13d960a960cc7e7dca65b77bda85e3cf77247f2"
)

SCHEMA_IDS = {
    "constitution/schemas/pcx-custody-anchor.schema.json":
        "nexus.pcx-custody-durable-anchor/v0",
    "constitution/schemas/pcx-custody-closed-transcript.schema.json":
        "nexus.r016-custody-closed-transcript/v0",
    "constitution/schemas/pcx-custody-event.schema.json":
        "nexus.pcx-custody-event/v0",
    "constitution/schemas/pcx-custody-genesis.schema.json":
        "nexus.pcx-custody-genesis/v0",
    "constitution/schemas/pcx-custody-receipt.schema.json":
        "nexus.pcx-custody-receipt/v0",
}

R016_ROLES = {
    **{path: "R016_SCHEMA" for path in SCHEMA_IDS},
    "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/README.md": "R016_SPECIFICATION",
    "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/bounded_model.py": "R016_MODEL",
    "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/fixtures/CLOSED_TRANSCRIPT.json": "R016_FIXTURE",
    "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/fixtures/GENESIS.json": "R016_FIXTURE",
    "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/generate_vectors.py": "R016_IMPLEMENTATION",
    "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/independent_verifier.mjs": "R016_INDEPENDENT_VERIFIER",
    "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/run_store_demo.py": "R016_IMPLEMENTATION",
    "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/verify_evidence.py": "R016_EVIDENCE_GATE",
    "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/verify_transcript.py": "R016_INDEPENDENT_VERIFIER",
    "operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/ACCEPTANCE.md": "R016_SPECIFICATION",
    "operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/BUILD_PACKET.md": "R016_SPECIFICATION",
    "operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/CLAIM_MATRIX.md": "R016_SPECIFICATION",
    "operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/NEXT_ACTION.proposal.md": "R016_SPECIFICATION",
    "operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/PROTOCOL.md": "R016_SPECIFICATION",
    "operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/STATUS.proposal.json": "R016_SPECIFICATION",
    "operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/THREAT_MODEL.md": "R016_SPECIFICATION",
    "operations/receipts/R016_PCX_INTEGRATED_CUSTODY_GATE/CROSS_IMPLEMENTATION_REPORT.json": "R016_SAVED_REPORT",
    "operations/receipts/R016_PCX_INTEGRATED_CUSTODY_GATE/MODEL_CHECK_REPORT.json": "R016_SAVED_REPORT",
    "operations/receipts/R016_PCX_INTEGRATED_CUSTODY_GATE/MODEL_SELF_TEST_REPORT.json": "R016_SAVED_REPORT",
    "operations/receipts/R016_PCX_INTEGRATED_CUSTODY_GATE/STORE_DEMO_REPORT.json": "R016_SAVED_REPORT",
    "operations/tasks/TSK-R016-PCX-INTEGRATED-CUSTODY-GATE.json": "R016_SPECIFICATION",
    "system/nexus_lab/custody_cli.py": "R016_IMPLEMENTATION",
    "system/nexus_lab/custody_kernel.py": "R016_IMPLEMENTATION",
    "system/nexus_lab/custody_store.py": "R016_IMPLEMENTATION",
    "tests/R016_TEST_NOTES.md": "R016_TEST",
    "tests/test_r016_custody_kernel.py": "R016_TEST",
    "tests/test_r016_custody_model.py": "R016_TEST",
    "tests/test_r016_custody_store.py": "R016_TEST",
    "tests/test_r016_independent_verifier.py": "R016_TEST",
    "tests/test_r016_store_demo.py": "R016_TEST",
}

TEST_MODULES = (
    "tests.test_r016_custody_kernel",
    "tests.test_r016_custody_store",
    "tests.test_r016_custody_model",
    "tests.test_r016_independent_verifier",
    "tests.test_r016_store_demo",
)

EXPECTED_MODEL_COVERAGE = {
    "APPLY_RECOVER",
    "APPLY_REVOKE",
    "APPLY_ROTATE",
    "APPLY_TRANSFER",
    "BACKUP_AHEAD",
    "BACKUP_CONFLICTING",
    "BACKUP_RESTORABLE",
    "BACKUP_STALE",
    "BACKUP_UNANCHORED",
    "EVENT_ID_COLLISION_REJECTED",
    "EXACT_REPLAY_NOOP",
    "HISTORICAL_PREFIX_KEY",
    "LOCKED_TRANSFER_REJECTED",
    "MISSING_NEW_KEY_PROOF_REJECTED",
    "ONE_GUARDIAN_RECOVERY_REJECTED",
    "RACE_RECOVER_RECOVER_BOTH_ORDERS",
    "RACE_ROTATE_RECOVER_BOTH_ORDERS",
    "RACE_TRANSFER_RECOVER_BOTH_ORDERS",
    "RACE_TRANSFER_REVOKE_BOTH_ORDERS",
    "RACE_TRANSFER_ROTATE_BOTH_ORDERS",
    "RACE_TRANSFER_TRANSFER_BOTH_ORDERS",
    "RETIRED_KEY_REACTIVATION_REJECTED",
    "STALE_ROOT_REJECTED",
    "TWO_DISTINCT_GUARDIANS_ENFORCED",
    "WRONG_ACTIVE_KEY_REJECTED",
}

EXPECTED_MUTANTS = {
    "DUPLICATE_GUARDIAN_COUNTED_TWICE",
    "LIFECYCLE_SUPPLY_MUTATION",
    "LOCKED_TRANSFER",
    "MISSING_NEW_KEY_PROOF",
    "ONE_GUARDIAN_RECOVERY",
    "RETIRED_KEY_REACTIVATION",
    "SILENT_CONFLICT_REBASE",
    "STALE_BACKUP_ACTIVATION",
    "STALE_ROOT_ACCEPTANCE",
    "TIP_KEY_HISTORICAL_VALIDATION",
}


class EvidenceFailure(RuntimeError):
    """A stable fail-closed evidence-gate failure."""


def require(condition: bool, code: str) -> None:
    if not condition:
        raise EvidenceFailure(code)


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        allow_nan=False,
        ensure_ascii=True,
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


def checked_path(relative: str) -> Path:
    require(relative == Path(relative).as_posix(), "EVIDENCE_PATH_INVALID")
    require(not relative.startswith("/"), "EVIDENCE_PATH_INVALID")
    require(".." not in Path(relative).parts, "EVIDENCE_PATH_INVALID")
    path = ROOT / relative
    require(path.is_file() and not path.is_symlink(), "EVIDENCE_PATH_INVALID")
    require(path.resolve().is_relative_to(ROOT.resolve()), "EVIDENCE_PATH_INVALID")
    return path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(
    path: Path, *, maximum: int, newline: bool
) -> tuple[dict[str, Any], bytes]:
    require(path.is_file() and not path.is_symlink(), "JSON_PATH_INVALID")
    raw = path.read_bytes()
    require(0 < len(raw) <= maximum, "JSON_SIZE_INVALID")
    require(not raw.startswith(b"\xef\xbb\xbf"), "JSON_BOM_INVALID")
    try:
        value = json.loads(
            raw.decode("ascii"), object_pairs_hook=no_duplicate_object
        )
    except EvidenceFailure:
        raise
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise EvidenceFailure("JSON_INVALID") from exc
    require(type(value) is dict, "JSON_OBJECT_REQUIRED")
    expected = canonical_bytes(value) + (b"\n" if newline else b"")
    require(raw == expected, "JSON_NOT_CANONICAL")
    return value, raw


def load_schema(path: Path) -> dict[str, Any]:
    require(path.is_file() and not path.is_symlink(), "SCHEMA_PATH_INVALID")
    raw = path.read_bytes()
    require(0 < len(raw) <= 1024 * 1024, "SCHEMA_SIZE_INVALID")
    try:
        value = json.loads(
            raw.decode("utf-8"), object_pairs_hook=no_duplicate_object
        )
    except EvidenceFailure:
        raise
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise EvidenceFailure("SCHEMA_JSON_INVALID") from exc
    require(type(value) is dict, "SCHEMA_OBJECT_REQUIRED")
    return value


def run(command: list[str], *, timeout: int = 240) -> bytes:
    environment = dict(os.environ)
    environment.update({"LC_ALL": "C", "PYTHONHASHSEED": "0", "TZ": "UTC"})
    completed = subprocess.run(
        command,
        cwd=ROOT,
        env=environment,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=timeout,
    )
    require(completed.returncode == 0, "SUBPROCESS_FAILED")
    require(completed.stderr == b"", "SUBPROCESS_STDERR")
    return completed.stdout


def run_success(command: list[str], *, timeout: int = 300) -> None:
    environment = dict(os.environ)
    environment.update({"LC_ALL": "C", "PYTHONHASHSEED": "0", "TZ": "UTC"})
    completed = subprocess.run(
        command,
        cwd=ROOT,
        env=environment,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=timeout,
    )
    require(completed.returncode == 0, "FOCUSED_TEST_FAILED")


def run_twice_exact(command: list[str], expected: bytes) -> None:
    first = run(command)
    second = run(command)
    require(first == second == expected, "REPRODUCTION_MISMATCH")


def frozen_predecessor_roles() -> dict[str, str]:
    demo, raw = load_json(R015_DEMO, maximum=4 * 1024 * 1024, newline=True)
    require(hashlib.sha256(raw).hexdigest() == R015_DEMO_SHA256, "R015_DEMO_DRIFT")
    evidence = demo.get("evidence")
    require(type(evidence) is list and len(evidence) == 43, "R015_INVENTORY_INVALID")
    result: dict[str, str] = {}
    for item in evidence:
        require(
            type(item) is dict
            and set(item) == {"path", "role", "sha256"}
            and type(item["path"]) is str
            and type(item["role"]) is str
            and type(item["sha256"]) is str,
            "R015_INVENTORY_INVALID",
        )
        path = item["path"]
        require(path not in result, "R015_INVENTORY_DUPLICATE")
        require(sha256_file(checked_path(path)) == item["sha256"], "R015_OBJECT_DRIFT")
        result[path] = "R015_FROZEN_EVIDENCE"
    promotion = load_schema(R015_PROMOTION)
    promotion_raw = R015_PROMOTION.read_bytes()
    require(
        len(promotion_raw) <= 1024 * 1024 and promotion_raw.endswith(b"\n"),
        "R015_PROMOTION_FORMAT_INVALID",
    )
    require(
        hashlib.sha256(promotion_raw).hexdigest() == R015_PROMOTION_SHA256,
        "R015_PROMOTION_DRIFT",
    )
    require(demo.get("status_authority") == "NONE", "R015_AUTHORITY_INVALID")
    require(
        promotion.get("authority") == "USER_EXPLICIT_PROMOTION"
        and "status_authority" not in promotion,
        "R015_PROMOTION_AUTHORITY_INVALID",
    )
    result[R015_DEMO.relative_to(ROOT).as_posix()] = "R015_FROZEN_DEMO"
    result[R015_PROMOTION.relative_to(ROOT).as_posix()] = "R015_FROZEN_PROMOTION"
    require(len(result) == 45, "R015_FROZEN_COUNT_INVALID")
    return result


def evidence_roles() -> dict[str, str]:
    roles = frozen_predecessor_roles()
    require(set(roles).isdisjoint(R016_ROLES), "EVIDENCE_PATH_COLLISION")
    roles.update(R016_ROLES)
    return roles


def expected_evidence() -> list[dict[str, str]]:
    return [
        {
            "path": path,
            "role": role,
            "sha256": sha256_file(checked_path(path)),
        }
        for path, role in sorted(evidence_roles().items())
    ]


def verify_dependencies() -> None:
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
    require(package.get("engines") == {"node": ">=20"}, "DEPENDENCY_MANIFEST_INVALID")
    require(
        package.get("dependencies") == {"@noble/ed25519": "3.1.0"},
        "DEPENDENCY_MANIFEST_INVALID",
    )
    noble = lock.get("packages", {}).get("node_modules/@noble/ed25519", {})
    require(noble.get("version") == "3.1.0", "DEPENDENCY_LOCK_INVALID")
    require(noble.get("integrity") == NOBLE_INTEGRITY, "DEPENDENCY_LOCK_INVALID")
    index = ROOT / "node_modules/@noble/ed25519/index.js"
    manifest = ROOT / "node_modules/@noble/ed25519/package.json"
    require(index.is_file() and not index.is_symlink(), "DEPENDENCY_MISSING")
    require(manifest.is_file() and not manifest.is_symlink(), "DEPENDENCY_MISSING")
    require(sha256_file(index) == NOBLE_INDEX_SHA256, "DEPENDENCY_SOURCE_DRIFT")
    require(
        sha256_file(manifest) == NOBLE_MANIFEST_SHA256,
        "DEPENDENCY_SOURCE_DRIFT",
    )


def verify_schemas() -> None:
    for relative, identifier in sorted(SCHEMA_IDS.items()):
        schema = load_schema(checked_path(relative))
        require(
            schema.get("$schema")
            == "https://json-schema.org/draft/2020-12/schema",
            "SCHEMA_DRAFT_INVALID",
        )
        require(schema.get("$id") == identifier, "SCHEMA_ID_INVALID")
    genesis_schema = load_schema(
        checked_path("constitution/schemas/pcx-custody-genesis.schema.json")
    )
    transcript_schema = load_schema(
        checked_path(
            "constitution/schemas/pcx-custody-closed-transcript.schema.json"
        )
    )
    require(genesis_schema.get("additionalProperties") is False, "SCHEMA_OPEN")
    require(transcript_schema.get("additionalProperties") is False, "SCHEMA_OPEN")
    provenance = transcript_schema.get("$defs", {}).get("vectorProvenance", {})
    require(
        provenance.get("properties", {})
        .get("retained_private_material", {})
        .get("const")
        == "FALSE",
        "SCHEMA_PROVENANCE_INVALID",
    )
    controller = transcript_schema.get("$defs", {}).get("stateController", {})
    require(
        controller.get("properties", {}).get("status", {}).get("enum")
        == ["ACTIVE", "LOCKED"],
        "SCHEMA_CONTROLLER_STATUS_INVALID",
    )


def verify_fixture_rebuilds() -> None:
    from experiments.R016_PCX_INTEGRATED_CUSTODY_GATE.generate_vectors import build

    frozen = {
        "GENESIS.json": GENESIS.read_bytes(),
        "CLOSED_TRANSCRIPT.json": TRANSCRIPT.read_bytes(),
    }
    require(not frozen["GENESIS.json"].endswith(b"\n"), "GENESIS_WIRE_NEWLINE")
    require(frozen["CLOSED_TRANSCRIPT.json"].endswith(b"\n"), "TRANSCRIPT_NEWLINE")
    with tempfile.TemporaryDirectory(prefix="nexus-r016-vectors-") as temporary:
        directory = Path(temporary)
        first = directory / "first"
        second = directory / "second"
        first_result = build(first)
        second_result = build(second)
        require(
            first_result["retained_private_material"]
            == second_result["retained_private_material"]
            == "FALSE",
            "VECTOR_PRIVATE_MATERIAL_INVALID",
        )
        for name, expected in frozen.items():
            require(
                (first / name).read_bytes()
                == (second / name).read_bytes()
                == expected,
                "FIXTURE_REBUILD_MISMATCH",
            )


def verify_cross_implementation() -> dict[str, Any]:
    report, raw = load_json(
        RECEIPTS / "CROSS_IMPLEMENTATION_REPORT.json",
        maximum=2 * 1024 * 1024,
        newline=True,
    )
    require(
        hashlib.sha256(raw).hexdigest() == EXPECTED_CROSS_REPORT_SHA256,
        "CROSS_REPORT_DRIFT",
    )
    run_twice_exact(
        [sys.executable, str(PYTHON_VERIFIER), str(GENESIS), str(TRANSCRIPT)],
        raw,
    )
    run_twice_exact(
        ["node", str(NODE_VERIFIER), str(GENESIS), str(TRANSCRIPT)],
        raw,
    )
    require(report.get("status") == "PASS", "CROSS_REPORT_INVALID")
    require(report.get("status_authority") == "NONE", "AUTHORITY_INVALID")
    require(
        report.get("implementations")
        == ["NODE_NOBLE_ED25519", "PYTHON_OPENSSL_ED25519"],
        "CROSS_IMPLEMENTATIONS_INVALID",
    )
    require(report.get("event_count") == "6", "CROSS_EVENT_COUNT_INVALID")
    require(report.get("final_height") == "6", "CROSS_HEIGHT_INVALID")
    require(report.get("synthetic_supply") == "1000", "CROSS_SUPPLY_INVALID")
    require(
        report.get("initial_state_root") == EXPECTED_INITIAL_ROOT
        and report.get("final_state_root") == EXPECTED_FINAL_ROOT
        and report.get("transcript_id") == EXPECTED_TRANSCRIPT_ID,
        "CROSS_ROOT_INVALID",
    )
    require(
        report.get("operation_counts")
        == {"RECOVER": "1", "REVOKE": "1", "ROTATE": "1", "TRANSFER": "3"},
        "CROSS_OPERATION_COUNTS_INVALID",
    )
    locked = report.get("final_locked_controller", {})
    require(
        locked.get("status") == "LOCKED"
        and locked.get("active_key") == "0" * 64
        and locked.get("epoch") == "3"
        and locked.get("retired_key_count") == "3",
        "CROSS_LOCK_INVALID",
    )
    require(
        report.get("claims")
        == [
            "CLOSED_TRANSCRIPT_REPLAYED_IDENTICALLY_BY_INDEPENDENT_PYTHON_OPENSSL_AND_NODE_NOBLE_IMPLEMENTATIONS",
            "SYNTHETIC_SUPPLY_CONSERVED_ACROSS_THE_ACCEPTED_PREFIX",
            "CONTROLLER_ROTATION_QUORUM_RECOVERY_AND_TERMINAL_LOCK_REPLAYED",
        ],
        "CROSS_CLAIM_INVALID",
    )
    return report


def verify_store_demonstration() -> dict[str, Any]:
    report, raw = load_json(
        RECEIPTS / "STORE_DEMO_REPORT.json",
        maximum=2 * 1024 * 1024,
        newline=True,
    )
    require(
        hashlib.sha256(raw).hexdigest() == EXPECTED_STORE_REPORT_SHA256,
        "STORE_REPORT_DRIFT",
    )
    run_twice_exact([sys.executable, str(STORE_DEMO)], raw)
    require(
        report.get("status")
        == "DEMONSTRATED_REAL_SIGNATURE_DURABLE_REPLAY_AND_ANCHORED_EXACT_RETRY",
        "STORE_REPORT_INVALID",
    )
    require(report.get("status_authority") == "NONE", "AUTHORITY_INVALID")
    require(
        report.get("execution")
        == {
            "anchored_audit": "PASS",
            "anchored_rollback_check": "ANCHORED_PREFIX_CONFIRMED",
            "exact_retries": "6",
            "initial_applies": "6",
            "post_retry_record_count": "6",
            "reopen_audit": "PASS",
            "reopen_rollback_check": "ANCHORED_PREFIX_CONFIRMED",
        },
        "STORE_EXECUTION_INVALID",
    )
    final = report.get("final", {})
    require(
        final.get("anchor_sequence") == "6"
        and final.get("height") == "6"
        and final.get("state_root") == EXPECTED_FINAL_ROOT
        and final.get("synthetic_supply") == "1000",
        "STORE_FINAL_INVALID",
    )
    require(
        report.get("storage_profile")
        == {
            "integrity_check": "ok",
            "journal_mode": "DELETE",
            "max_records": "256",
            "synchronous": "EXTRA",
            "transaction": "BEGIN IMMEDIATE",
            "trusted_schema": "OFF",
        },
        "STORE_PROFILE_INVALID",
    )
    operations = report.get("operations")
    require(type(operations) is list and len(operations) == 6, "STORE_OPERATIONS_INVALID")
    require(
        [item.get("kind") for item in operations]
        == ["TRANSFER", "ROTATE", "TRANSFER", "RECOVER", "TRANSFER", "REVOKE"],
        "STORE_OPERATIONS_INVALID",
    )
    nonclaims = " ".join(report.get("non_claims", [])).lower()
    for phrase in ("not money", "not network consensus", "physical power-loss", "not formal verification"):
        require(phrase in nonclaims, "STORE_NONCLAIM_INVALID")
    return report


def verify_model() -> tuple[dict[str, Any], dict[str, Any]]:
    model, model_raw = load_json(
        RECEIPTS / "MODEL_CHECK_REPORT.json",
        maximum=2 * 1024 * 1024,
        newline=True,
    )
    self_test, self_test_raw = load_json(
        RECEIPTS / "MODEL_SELF_TEST_REPORT.json",
        maximum=2 * 1024 * 1024,
        newline=True,
    )
    run_twice_exact([sys.executable, str(MODEL)], model_raw)
    run_twice_exact([sys.executable, str(MODEL), "--self-test"], self_test_raw)
    require(
        model.get("status") == self_test.get("status") == "PASS",
        "MODEL_STATUS_INVALID",
    )
    require(
        model.get("status_authority")
        == self_test.get("status_authority")
        == "NONE",
        "AUTHORITY_INVALID",
    )
    require(
        model.get("state_count") == "614"
        and model.get("transition_count") == "5631"
        and model.get("accepted_transitions") == "613"
        and model.get("rejected_transitions") == "4405"
        and model.get("replayed_transitions") == "613"
        and model.get("invariant_checks") == "135004"
        and model.get("race_order_checks") == "12",
        "MODEL_COUNTS_INVALID",
    )
    require(
        model.get("graph_digest")
        == "74c97fb5a4bf33cf8245086322577fd9d059fb7f12047a079bc56bc8641a164c"
        and model.get("state_digest")
        == "ae0d19b5287b051392330aeff5ed00dfef56e692632dfd60a19b08a48abe0bb2"
        and model.get("transition_digest")
        == "19efc4f11701e081da360fe7d9b39494b0bfef746e884c052cadda76069f6393",
        "MODEL_DIGEST_INVALID",
    )
    coverage = model.get("coverage", {})
    require(set(coverage) == EXPECTED_MODEL_COVERAGE, "MODEL_COVERAGE_INVALID")
    require(
        all(type(value) is str and value.isdigit() and int(value) > 0 for value in coverage.values()),
        "MODEL_COVERAGE_INVALID",
    )
    results = self_test.get("results")
    require(type(results) is list and len(results) == 10, "MODEL_MUTANTS_INVALID")
    require(
        {item.get("mutant") for item in results} == EXPECTED_MUTANTS
        and all(item.get("killed") == "TRUE" for item in results)
        and self_test.get("mutants_killed") == "10"
        and self_test.get("mutants_required") == "10"
        and self_test.get("survivors") == [],
        "MODEL_MUTANTS_INVALID",
    )
    return model, self_test


def walk_objects(value: Any) -> Iterable[tuple[str, Any]]:
    if type(value) is dict:
        for key, item in value.items():
            yield key, item
            yield from walk_objects(item)
    elif type(value) is list:
        for item in value:
            yield from walk_objects(item)


def verify_authority_and_artifact_secrecy() -> None:
    artifact_paths = [
        GENESIS,
        TRANSCRIPT,
        RECEIPTS / "CROSS_IMPLEMENTATION_REPORT.json",
        RECEIPTS / "STORE_DEMO_REPORT.json",
        RECEIPTS / "MODEL_CHECK_REPORT.json",
        RECEIPTS / "MODEL_SELF_TEST_REPORT.json",
    ]
    forbidden_keys = {
        "mnemonic",
        "passphrase",
        "password",
        "private_key",
        "private_key_hex",
        "recovery_code",
        "secret",
        "seed",
        "seed_hex",
    }
    authority_count = 0
    for path in artifact_paths:
        raw = path.read_bytes()
        lowered = raw.lower()
        require(b"-----begin private key-----" not in lowered, "PRIVATE_MATERIAL_FOUND")
        require(b"-----begin openssh private key-----" not in lowered, "PRIVATE_MATERIAL_FOUND")
        body = raw[:-1] if raw.endswith(b"\n") else raw
        try:
            value = json.loads(body.decode("ascii"), object_pairs_hook=no_duplicate_object)
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise EvidenceFailure("ARTIFACT_JSON_INVALID") from exc
        for key, item in walk_objects(value):
            require(key.lower() not in forbidden_keys, "PRIVATE_FIELD_FOUND")
            if key == "status_authority":
                authority_count += 1
                require(item == "NONE", "AUTHORITY_INVALID")
    transcript, _ = load_json(TRANSCRIPT, maximum=4 * 1024 * 1024, newline=True)
    require(
        transcript.get("vector_provenance", {}).get("retained_private_material")
        == "FALSE",
        "VECTOR_PRIVATE_MATERIAL_INVALID",
    )
    for record in transcript.get("records", []):
        try:
            event = json.loads(
                base64.b64decode(record["event_b64"], validate=True).decode("ascii"),
                object_pairs_hook=no_duplicate_object,
            )
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise EvidenceFailure("EVENT_ARTIFACT_INVALID") from exc
        for key, item in walk_objects(event):
            require(key.lower() not in forbidden_keys, "PRIVATE_FIELD_FOUND")
            if key == "status_authority":
                authority_count += 1
                require(item == "NONE", "AUTHORITY_INVALID")
    require(authority_count == 19, "AUTHORITY_EVIDENCE_MISSING")


def test_case_counts() -> dict[str, str]:
    loader = unittest.TestLoader()
    result: dict[str, str] = {}
    for module_name in TEST_MODULES:
        module = importlib.import_module(module_name)
        count = loader.loadTestsFromModule(module).countTestCases()
        require(count > 0, "FOCUSED_TEST_DISCOVERY_FAILED")
        result[module_name.rsplit(".", 1)[-1]] = str(count)
    return result


def verify_focused_tests() -> None:
    run_success(
        [sys.executable, "-m", "unittest", "-q", *TEST_MODULES],
        timeout=420,
    )


def _read_saved_reports() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    cross, _ = load_json(
        RECEIPTS / "CROSS_IMPLEMENTATION_REPORT.json",
        maximum=2 * 1024 * 1024,
        newline=True,
    )
    store, _ = load_json(
        RECEIPTS / "STORE_DEMO_REPORT.json",
        maximum=2 * 1024 * 1024,
        newline=True,
    )
    model, _ = load_json(
        RECEIPTS / "MODEL_CHECK_REPORT.json",
        maximum=2 * 1024 * 1024,
        newline=True,
    )
    mutants, _ = load_json(
        RECEIPTS / "MODEL_SELF_TEST_REPORT.json",
        maximum=2 * 1024 * 1024,
        newline=True,
    )
    return cross, store, model, mutants


def build_demo_report() -> dict[str, Any]:
    cross, store, model, mutants = _read_saved_reports()
    roles = evidence_roles()
    tests = test_case_counts()
    return {
        "baseline_ref": BASELINE_REF,
        "claims": [
            "On a new synthetic profile, stable controller IDs rather than rotating raw keys own outputs, while transfer and key-lifecycle events share one combined predecessor root and local durable order.",
            "Python/OpenSSL and a separately implemented Node/Noble verifier independently reproduced all six accepted envelopes, signatures, content IDs, receipts, controller states, state roots, and conserved synthetic supply.",
            "The bounded local SQLite store, crash/race tests, exhaustive finite model, and deliberate mutants reproduced the declared rotation, recovery, revocation, rejection, retry, and anchoring behavior.",
        ],
        "demonstrated": [
            "Three transfers, one active-key rotation, one 2-of-3 guardian recovery with new-key proof, and one terminal 2-of-3 revocation formed one exact six-event prefix.",
            "The stable controller retained its outputs across rotation and recovery, retired three active keys monotonically, and finished LOCKED with no active key.",
            "All lifecycle events and transfers preserved exactly 1000 synthetic units; transfer signatures bound their input index and exact outpoint.",
            "The real-signature store reopened at height 6, confirmed the separately supplied final prefix anchor, and returned all six exact retries without a seventh record.",
            "Six injected precommit hard exits recovered the old prefix; postcommit lost acknowledgement, competing writers, capacity, schema/record/header/WAL tampering, and external-anchor fork/rollback cases are covered by focused tests.",
            "The finite model visited 614 states and 5,631 transitions, checked 135,004 invariants plus 12 paired race orders, exercised all 25 coverage classes, and killed all 10 preregistered mutants.",
            "All 45 predecessor objects from the promoted R015 evidence packet remained byte-exact.",
        ],
        "dependency_profile": {
            "independent_runtime_imports": [
                "@noble/ed25519",
                "node:crypto",
                "node:fs/promises",
            ],
            "lock_integrity_sha512": NOBLE_INTEGRITY,
            "node_engine": ">=20",
            "package": "@noble/ed25519",
            "package_manifest_sha256": NOBLE_MANIFEST_SHA256,
            "source_entrypoint": "node_modules/@noble/ed25519/index.js",
            "source_entrypoint_sha256": NOBLE_INDEX_SHA256,
            "version": "3.1.0",
        },
        "evidence": expected_evidence(),
        "non_claims": [
            "The synthetic quantity is not money, economic value, legal property, backing, redemption, purchasing power, liquidity, value stability, or a safe store of value.",
            "Public fixture labels deterministically create temporary test signing files; this proves no operational key secrecy, entropy, secure erase, HSM, device, wallet, backup, or real-fund safety.",
            "The three guardian keys are fixed in V0: guardian rotation, replacement, recovery-policy migration, and social-recovery operations are not implemented; two compromised guardians can recover or revoke.",
            "Loss, compromise, guardian independence, and user intent are not cryptographically detected, and recovery does not reverse a competing attacker transfer that committed first.",
            "One single-host ordered history is not network consensus, fork choice, global double-spend prevention, global finality, availability, or multi-host replication.",
            "Caller anchors are unauthenticated; they do not prove independent retention, freshness, rollback, fork, or tampering, and public checkpoint state import is not implemented.",
            "The local durability evidence assumes an honest reviewed runtime/filesystem profile and no adversarial path swap during open; injected exits are not physical power-loss proof.",
            "This is bounded research evidence, not formal verification, production security, an external audit, regulatory approval, deployment authorization, or authorization for a live pilot.",
        ],
        "observed": {
            "crash_precommit_stages": "6",
            "evidence_files": str(len(roles)),
            "event_count": cross["event_count"],
            "exact_store_retries": store["execution"]["exact_retries"],
            "final_anchor_id": store["final"]["anchor_id"],
            "final_controller_set_hash": cross["final_controller_set_hash"],
            "final_height": cross["final_height"],
            "final_locked_controller": cross["final_locked_controller"],
            "final_state_root": cross["final_state_root"],
            "frozen_predecessor_files": "45",
            "model_coverage_classes": str(len(model["coverage"])),
            "model_graph_digest": model["graph_digest"],
            "model_invariant_checks": model["invariant_checks"],
            "model_race_order_checks": model["race_order_checks"],
            "model_state_count": model["state_count"],
            "model_transition_count": model["transition_count"],
            "model_transition_digest": model["transition_digest"],
            "mutants_killed": mutants["mutants_killed"],
            "mutants_survived": str(len(mutants["survivors"])),
            "operation_counts": cross["operation_counts"],
            "store_record_count": store["execution"]["post_retry_record_count"],
            "synthetic_supply": cross["synthetic_supply"],
            "test_cases": tests,
            "test_cases_total": str(sum(int(value) for value in tests.values())),
            "transcript_id": cross["transcript_id"],
        },
        "predecessor": {
            "base_head": BASELINE_REF,
            "r015_demo_sha256": R015_DEMO_SHA256,
            "r015_frozen_objects": "45",
            "r015_promotion_sha256": R015_PROMOTION_SHA256,
            "stale_pr_14_dependency": "NONE",
        },
        "reproducibility": {
            "fixture_rebuilds": "2",
            "model_runs": "2",
            "model_self_test_runs": "2",
            "node_verifier_runs": "2",
            "python_verifier_runs": "2",
            "result": "ALL_EXACT_BYTE_MATCH",
            "store_demo_runs": "2",
        },
        "schema": "nexus.r016-integrated-custody-gate-demo/v0",
        "status": CLAIM,
        "status_authority": "NONE",
        "test_commands": [
            "python3 experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/verify_evidence.py",
            "python3 -m unittest -v tests.test_r016_custody_kernel tests.test_r016_custody_store tests.test_r016_custody_model tests.test_r016_independent_verifier tests.test_r016_store_demo",
        ],
    }


def verify_demo() -> str:
    demo, raw = load_json(DEMO, maximum=4 * 1024 * 1024, newline=True)
    require(demo == build_demo_report(), "DEMO_REPORT_MISMATCH")
    return hashlib.sha256(raw).hexdigest()


def verify_all() -> str:
    roles = evidence_roles()
    require(len(roles) == 80, "EVIDENCE_COUNT_INVALID")
    verify_dependencies()
    verify_schemas()
    verify_fixture_rebuilds()
    verify_cross_implementation()
    verify_store_demonstration()
    verify_model()
    verify_authority_and_artifact_secrecy()
    verify_focused_tests()
    return verify_demo()


def main(argv: list[str]) -> int:
    if argv == ["--build-demo"]:
        sys.stdout.buffer.write(canonical_bytes(build_demo_report()) + b"\n")
        return 0
    if argv:
        raise EvidenceFailure("USAGE")
    demo_sha256 = verify_all()
    report = {
        "demo_report_sha256": demo_sha256,
        "evidence_files": str(len(evidence_roles())),
        "frozen_predecessor_files": "45",
        "schema": "nexus.r016-evidence-check/v0",
        "status": "PASS",
        "status_authority": "NONE",
    }
    sys.stdout.buffer.write(canonical_bytes(report) + b"\n")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except EvidenceFailure as error:
        sys.stderr.write(f"R016_EVIDENCE_FAIL:{error}\n")
        raise SystemExit(1)
    except Exception:
        sys.stderr.write("R016_EVIDENCE_FAIL:INTERNAL_ERROR\n")
        raise SystemExit(1)
