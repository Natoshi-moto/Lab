#!/usr/bin/env python3
"""Verify the exact bounded R018 evidence without rewriting tracked files."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
EXPERIMENT = ROOT / "experiments" / "R018_PQ_HYBRID_ADMISSION"
FIXTURES = EXPERIMENT / "fixtures"
RECEIPTS = ROOT / "operations" / "receipts" / "R018_PQ_HYBRID_ADMISSION"
PRIMARY = ROOT / "system" / "nexus_lab" / "pq_admission.mjs"
COLD = EXPERIMENT / "independent_verifier.mjs"


def run(*command: str, timeout: int = 60) -> bytes:
    result = subprocess.run(
        list(command),
        cwd=ROOT,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"command failed ({result.returncode}): {' '.join(command)}\n"
            + result.stderr.decode("utf-8", errors="replace")
        )
    return result.stdout


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    node_version = run("node", "-p", "process.versions.node").decode("ascii").strip()
    if node_version != "24.14.0":
        raise RuntimeError(f"exact Node 24.14.0 required, got {node_version}")

    package_lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
    pq_package = package_lock["packages"]["node_modules/@noble/post-quantum"]
    if pq_package["version"] != "0.6.1":
        raise RuntimeError("@noble/post-quantum must remain pinned at 0.6.1")

    event = FIXTURES / "EVENT.json"
    policy = FIXTURES / "POLICY.json"
    authorization = FIXTURES / "AUTHORIZATION.json"
    expected = (RECEIPTS / "PQ_ADMISSION_REPORT.json").read_bytes()
    for verifier in (PRIMARY, COLD):
        actual = run("node", str(verifier), str(policy), str(event), str(authorization))
        if actual != expected:
            raise RuntimeError(f"{verifier} did not reproduce the frozen admission report")

    with tempfile.TemporaryDirectory(prefix="nexus-r018-evidence-") as temporary:
        output = Path(temporary)
        run("node", str(EXPERIMENT / "generate_fixture.mjs"), str(event), str(output))
        for name in ("AUTHORIZATION.json", "EVENT.json", "POLICY.json"):
            if (output / name).read_bytes() != (FIXTURES / name).read_bytes():
                raise RuntimeError(f"fixture rebuild differs: {name}")

    if run("node", str(EXPERIMENT / "interop_self_test.mjs")) != (
        RECEIPTS / "ML_DSA_INTEROP_REPORT.json"
    ).read_bytes():
        raise RuntimeError("bidirectional implementation interoperability report differs")
    if run(sys.executable, str(EXPERIMENT / "run_hybrid_demo.py"), timeout=90) != (
        RECEIPTS / "DEMO_REPORT.json"
    ).read_bytes():
        raise RuntimeError("hybrid differential demo report differs")

    run(
        sys.executable,
        "-m",
        "unittest",
        "tests.test_r018_pq_hybrid_admission",
        "-q",
        timeout=120,
    )

    primary_source = PRIMARY.read_text(encoding="utf-8")
    cold_source = COLD.read_text(encoding="utf-8")
    if "@noble/post-quantum" in primary_source or "pq_admission" in cold_source:
        raise RuntimeError("the two verification paths are no longer structurally separate")
    if "generateKeyPair" in primary_source or "privateKey" in primary_source:
        raise RuntimeError("the primary verifier acquired a key-generation or private-key surface")

    report = {
        "artifact_sha256": {
            "authorization": sha256(authorization),
            "demo_report": sha256(RECEIPTS / "DEMO_REPORT.json"),
            "event": sha256(event),
            "interop_report": sha256(RECEIPTS / "ML_DSA_INTEROP_REPORT.json"),
            "policy": sha256(policy),
            "pq_admission_report": sha256(RECEIPTS / "PQ_ADMISSION_REPORT.json"),
        },
        "checks": {
            "bidirectional_ml_dsa_implementation_interop": "PASS",
            "deterministic_public_fixture_rebuild": "PASS",
            "fixed_no_fallback_policy": "PASS",
            "focused_attack_tests": "10_PASS",
            "hybrid_r016_all_of_demo": "PASS",
            "native_and_cold_report_equivalence": "PASS",
            "verifier_only_primary_surface": "PASS",
        },
        "node": node_version,
        "noble_post_quantum": pq_package["version"],
        "schema": "nexus.r018-evidence-gate-report/v0",
        "status": "PASS",
        "status_authority": "NONE",
    }
    rendered = (json.dumps(report, indent=2, sort_keys=True) + "\n").encode("ascii")
    frozen_gate = RECEIPTS / "EVIDENCE_GATE_REPORT.json"
    if frozen_gate.exists() and frozen_gate.read_bytes() != rendered:
        raise RuntimeError("frozen R018 evidence-gate report differs")
    sys.stdout.buffer.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
