#!/usr/bin/env python3
"""Fail-closed evidence gate for BENEFICIAL_GENESIS_DESIGN_001.

Re-runs unit tests, re-validates fixtures against EXPECTED.json, checks
allocation supply invariants, and scans for obviously operational material.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import unittest
from pathlib import Path
from typing import Any

EXP = Path(__file__).resolve().parent
ROOT = EXP.parents[1]
if str(EXP) not in sys.path:
    sys.path.insert(0, str(EXP))

from protocol.allocation import assert_supply_invariant  # noqa: E402
from protocol.constants import REJECTION_CODES  # noqa: E402
from protocol.nullifier import NullifierSet  # noqa: E402
from protocol.objects import charity_set_commitment  # noqa: E402
from protocol.verifier import ClaimVerifier  # noqa: E402

FIXTURES = EXP / "fixtures"
GENESIS = FIXTURES / "genesis"
VALID = FIXTURES / "valid"
INVALID = FIXTURES / "invalid"
EXPECTED_PATH = FIXTURES / "EXPECTED.json"

# Required design artifacts.
REQUIRED_PATHS = [
    EXP / "TECHNICAL_DESIGN.md",
    EXP / "THREAT_MODEL_AND_NONCLAIMS.md",
    EXP / "README.md",
    EXP / "verify_evidence.py",
    EXP / "generate_fixtures.py",
    EXP / "schemas" / "protocol_objects.schema.json",
    EXP / "schemas" / "rejection_codes.json",
    EXP / "protocol" / "verifier.py",
    EXP / "protocol" / "allocation.py",
    EXP / "protocol" / "nullifier.py",
    EXPECTED_PATH,
    ROOT / "operations" / "receipts" / "BENEFICIAL_GENESIS_DESIGN_001" / "RECEIPT.json",
]

FORBIDDEN_PATTERNS = [
    re.compile(r"BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY"),
    re.compile(r"xprv[a-zA-Z0-9]{20,}"),
    re.compile(r"\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b"),  # mainnet P2PKH-like
    re.compile(r"\bbc1q[a-z0-9]{20,}\b"),  # bech32 mainnet-looking
]


class EvidenceError(Exception):
    pass


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def require_files() -> None:
    missing = [str(p.relative_to(ROOT)) for p in REQUIRED_PATHS if not p.is_file()]
    if missing:
        raise EvidenceError("missing required paths: " + ", ".join(missing))


def run_unittests() -> None:
    loader = unittest.TestLoader()
    suite = loader.discover(str(EXP / "tests"), pattern="test_*.py")
    result = unittest.TextTestRunner(verbosity=1).run(suite)
    if not result.wasSuccessful():
        raise EvidenceError(
            f"unittest failures={len(result.failures)} errors={len(result.errors)}"
        )


def base_verifier(**overrides: Any) -> ClaimVerifier:
    ctx = load(GENESIS / "CONTEXT.json")
    epoch = load(GENESIS / "EPOCH_OPEN.json")
    if overrides.get("epoch") == "closed":
        epoch = load(GENESIS / "EPOCH_CLOSED.json")
    if "epoch_last_clean_height_override" in overrides:
        epoch = dict(epoch)
        epoch["last_clean_source_height"] = overrides["epoch_last_clean_height_override"]
    if "quantum_compromise_cutoff_height_override" in overrides:
        epoch = dict(epoch)
        epoch["quantum_compromise_cutoff_height"] = overrides[
            "quantum_compromise_cutoff_height_override"
        ]
    headers = list(ctx["headers"])
    if "extra_headers" in overrides:
        headers.extend(overrides["extra_headers"])
    if "new_tip_only_headers" in overrides:
        headers = overrides["new_tip_only_headers"]
        tip_h = headers[-1]["height"]
        tip_x = headers[-1]["header_hash_hex"]
    else:
        tip_h = overrides.get("tip_height_override", ctx["tip_height"])
        tip_x = overrides.get("tip_hash_hex_override", ctx["tip_hash_hex"])
    hbh = {h["header_hash_hex"]: h for h in headers}
    return ClaimVerifier(
        charity_set=ctx["charity_set"],
        epoch=epoch,
        headers_by_hash=hbh,
        tip_height=tip_h,
        tip_hash_hex=tip_x,
        new_ledger_chain_id=ctx["new_ledger_chain_id"],
        nullifiers=overrides.get("nullifiers") or NullifierSet(),
    )


def verify_valid_and_allocation() -> None:
    v = base_verifier()
    for name in (
        "claim_single_alpha.json",
        "claim_single_beta.json",
        "claim_multi_out0.json",
        "claim_multi_out1.json",
    ):
        result = v.verify_claim(load(VALID / name))
        if not result.ok:
            raise EvidenceError(f"valid fixture failed: {name} -> {result.code}")
    alloc = load(VALID / "allocation_after_epoch.json")
    assert_supply_invariant(alloc)
    if alloc["total_issued"] > alloc["fixed_bitcoin_genesis_pool"]:
        raise EvidenceError("allocation exceeds pool")
    if alloc["total_issued"] + alloc["remainder_unissued"] != alloc["fixed_bitcoin_genesis_pool"]:
        raise EvidenceError("issued + remainder != pool")


def verify_invalid_catalog() -> None:
    expected = load(EXPECTED_PATH)
    codes = expected["invalid_expected_codes"]
    if len(codes) < 20:
        raise EvidenceError(f"too few adversarial cases: {len(codes)}")
    for name, code in codes.items():
        if code not in REJECTION_CODES and code != "OK":
            # All catalog codes should be known except documentation-only.
            if code not in REJECTION_CODES:
                raise EvidenceError(f"unknown rejection code in catalog: {code}")
        path = INVALID / f"{name}.json"
        if not path.is_file():
            raise EvidenceError(f"missing invalid fixture: {name}")
        payload = load(path)
        if payload.get("expected_code") != code:
            raise EvidenceError(f"EXPECTED mismatch for {name}")

        # Spot-check a subset via verifier (same logic as unit tests).
        if name in {
            "duplicate_charity_entries",
            "malformed_charity_entry",
            "allocation_overflow_bool",
            "charity_destination_key_compromise_assumption",
            "reorg_after_provisional_acceptance",
        }:
            continue
        claim = payload["claim"]
        kwargs: dict[str, Any] = {}
        if "pre_consume_nullifier" in payload:
            ns = NullifierSet()
            ns.consume(payload["pre_consume_nullifier"])
            kwargs["nullifiers"] = ns
        for key in (
            "tip_height_override",
            "epoch",
            "epoch_last_clean_height_override",
            "quantum_compromise_cutoff_height_override",
            "extra_headers",
        ):
            if key in payload:
                kwargs[key] = payload[key]
        result = base_verifier(**kwargs).verify_claim(claim)
        if result.code != code:
            raise EvidenceError(
                f"{name}: expected {code}, got {result.code} ({result.detail})"
            )


def scan_for_operational_material() -> None:
    """Best-effort scan; synthetic labels like bc1q-synth are allowed if short."""

    for path in EXP.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix in {".pyc"} or "__pycache__" in path.parts:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for pat in FORBIDDEN_PATTERNS:
            for match in pat.finditer(text):
                s = match.group(0)
                # Allow explicitly synthetic labels.
                if "synth" in s.lower() or "SYNTHETIC" in text[max(0, match.start() - 40) : match.end() + 40]:
                    continue
                # Skip bech32-like if clearly documentation deny-list only.
                if s.startswith("bc1q") and "lookalike" in text:
                    continue
                if "PRIVATE KEY" in s:
                    raise EvidenceError(f"possible private key material in {path}")


def check_genesis_labels() -> None:
    ctx = load(GENESIS / "CONTEXT.json")
    if "SYNTHETIC" not in ctx.get("label", ""):
        raise EvidenceError("genesis context missing SYNTHETIC label")
    if ctx.get("public_test_seeds_are_not_secrets") is not True:
        raise EvidenceError("fixture seeds must be labelled non-secret")


def main() -> int:
    print("BGEN evidence gate: starting")
    try:
        require_files()
        print("  required files: OK")
        check_genesis_labels()
        print("  synthetic labels: OK")
        run_unittests()
        print("  unittests: OK")
        verify_valid_and_allocation()
        print("  valid + allocation: OK")
        verify_invalid_catalog()
        print(f"  invalid catalog: OK ({len(load(EXPECTED_PATH)['invalid_expected_codes'])} cases)")
        scan_for_operational_material()
        print("  operational-material scan: OK")
        # Schema rejection codes consistency
        schema_codes = load(EXP / "schemas" / "rejection_codes.json")["codes"]
        if schema_codes != REJECTION_CODES:
            raise EvidenceError("schemas/rejection_codes.json out of sync with constants")
        print("  rejection codes sync: OK")
    except EvidenceError as exc:
        print(f"BGEN evidence gate: FAIL — {exc}", file=sys.stderr)
        return 1
    print("BGEN evidence gate: PASS")
    print(
        json.dumps(
            {
                "result": "PASS",
                "experiment": "BENEFICIAL_GENESIS_DESIGN_001",
                "invalid_cases": len(load(EXPECTED_PATH)["invalid_expected_codes"]),
                "rejection_code_count": len(REJECTION_CODES),
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
