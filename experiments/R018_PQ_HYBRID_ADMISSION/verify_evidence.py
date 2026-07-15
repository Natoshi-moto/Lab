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
ROOT_PACKAGE_SHA256 = "fd5e21f974f50045d0a2b8284c2907e725c839ab2697b5b2638412e9a7261565"
ROOT_LOCK_SHA256 = "dfc3bcb3c0fa067e7f8af3701ac4791f7be1ba265fbbd3b667cdacb0908957c5"
R018_PACKAGE_SHA256 = "c8d20b08824f7f20db0109e7a81d80c9a4774799e34871d8b819ce349b73e0fb"
R018_LOCK_SHA256 = "9469bcc1257d48441b572dfc4d3d94c3a6801c7bb78595a1f288b99e637374a0"
NOBLE_MANIFEST_SHA256 = "40963a943deda8d07352543d7263316b7bac48b04bab121d3cf4d6fcce5a47f9"
NOBLE_ENTRYPOINT_SHA256 = "210a020b4933275edf89201e2a5168ee404190f2d5cfa676d0cb13b7a1072276"
LOCKED_PACKAGES = {
    "node_modules/@noble/ciphers": (
        "2.2.0",
        "sha512-Z6pjIZ/8IJcCGzb2S/0Px5J81yij85xASuk1teLNeg75bfT07MV3a/O2Mtn1I2se43k3lkVEcFaR10N4cgQcZA==",
    ),
    "node_modules/@noble/curves": (
        "2.2.0",
        "sha512-T/BoHgFXirb0ENSPBquzX0rcjXeM6Lo892a2jlYJkqk83LqZx0l1Of7DzlKJ6jkpvMrkHSnAcgb5JegL8SeIkQ==",
    ),
    "node_modules/@noble/hashes": (
        "2.2.0",
        "sha512-IYqDGiTXab6FniAgnSdZwgWbomxpy9FtYvLKs7wCUs2a8RkITG+DFGO1DM9cr+E3/RgADRpFjrKVaJ1z6sjtEg==",
    ),
    "node_modules/@noble/post-quantum": (
        "0.6.1",
        "sha512-+pormrDZwjRw05U8ADK4JpHejo87+gBd+muRBB/ozztH5yhDLMDF4jHQWN3NQQAsu1zBNPWTG0ZwVI0CR29H0A==",
    ),
}


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

    if sha256(ROOT / "package.json") != ROOT_PACKAGE_SHA256:
        raise RuntimeError("frozen predecessor package.json changed")
    if sha256(ROOT / "package-lock.json") != ROOT_LOCK_SHA256:
        raise RuntimeError("frozen predecessor package-lock.json changed")
    if sha256(EXPERIMENT / "package.json") != R018_PACKAGE_SHA256:
        raise RuntimeError("R018 package.json differs from the fixed manifest")
    if sha256(EXPERIMENT / "package-lock.json") != R018_LOCK_SHA256:
        raise RuntimeError("R018 package-lock.json differs from the fixed lock")

    package = json.loads((EXPERIMENT / "package.json").read_text(encoding="utf-8"))
    if package != {
        "name": "nexus-r018-pq-hybrid-admission",
        "version": "0.0.0",
        "private": True,
        "type": "module",
        "engines": {"node": "24.14.0"},
        "dependencies": {"@noble/post-quantum": "0.6.1"},
    }:
        raise RuntimeError("R018 dependency manifest semantics changed")
    package_lock = json.loads((EXPERIMENT / "package-lock.json").read_text(encoding="utf-8"))
    locked = package_lock.get("packages", {})
    if set(locked) != {"", *LOCKED_PACKAGES}:
        raise RuntimeError("R018 dependency lock contains an unknown or missing package")
    if locked[""].get("dependencies") != {"@noble/post-quantum": "0.6.1"}:
        raise RuntimeError("R018 root dependency lock changed")
    for path, (version, integrity) in LOCKED_PACKAGES.items():
        if locked[path].get("version") != version or locked[path].get("integrity") != integrity:
            raise RuntimeError(f"R018 dependency lock changed: {path}")

    noble_root = EXPERIMENT / "node_modules/@noble/post-quantum"
    noble_manifest = noble_root / "package.json"
    noble_entrypoint = noble_root / "ml-dsa.js"
    for path in (noble_manifest, noble_entrypoint):
        if not path.is_file() or path.is_symlink():
            raise RuntimeError(f"installed Noble dependency is missing or linked: {path.name}")
    if sha256(noble_manifest) != NOBLE_MANIFEST_SHA256:
        raise RuntimeError("installed Noble package manifest differs")
    if sha256(noble_entrypoint) != NOBLE_ENTRYPOINT_SHA256:
        raise RuntimeError("installed Noble ML-DSA entrypoint differs")
    pq_package = locked["node_modules/@noble/post-quantum"]

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
            "predecessor_package_lock": ROOT_LOCK_SHA256,
            "predecessor_package_manifest": ROOT_PACKAGE_SHA256,
            "r018_package_lock": R018_LOCK_SHA256,
            "r018_package_manifest": R018_PACKAGE_SHA256,
        },
        "checks": {
            "bidirectional_ml_dsa_implementation_interop": "PASS",
            "deterministic_public_fixture_rebuild": "PASS",
            "experiment_local_dependency_lock": "PASS",
            "fixed_no_fallback_policy": "PASS",
            "focused_attack_tests": "10_PASS",
            "hybrid_r016_all_of_demo": "PASS",
            "native_and_cold_report_equivalence": "PASS",
            "predecessor_root_dependencies_byte_exact": "PASS",
            "verifier_only_primary_surface": "PASS",
        },
        "node": node_version,
        "noble_post_quantum": pq_package["version"],
        "noble_post_quantum_entrypoint_sha256": NOBLE_ENTRYPOINT_SHA256,
        "noble_post_quantum_integrity_sha512": pq_package["integrity"],
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
