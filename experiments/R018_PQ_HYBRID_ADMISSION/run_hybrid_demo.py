#!/usr/bin/env python3
"""Run the bounded R018 R016-only-vs-hybrid differential experiment."""

from __future__ import annotations

import base64
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from system.nexus_lab.custody_kernel import Machine


EXPERIMENT = ROOT / "experiments" / "R018_PQ_HYBRID_ADMISSION"
FIXTURES = EXPERIMENT / "fixtures"
PRIMARY = ROOT / "system" / "nexus_lab" / "pq_admission.mjs"
COLD = EXPERIMENT / "independent_verifier.mjs"
GENESIS = ROOT / "experiments" / "R016_PCX_INTEGRATED_CUSTODY_GATE" / "fixtures" / "GENESIS.json"
EXPECTED = ROOT / "operations" / "receipts" / "R018_PQ_HYBRID_ADMISSION" / "PQ_ADMISSION_REPORT.json"
ZERO = "0" * 64
POLICY_DOMAIN = b"NEXUS/R018/PQ-ADMISSION-POLICY/v0"
PROOF_DOMAIN = b"NEXUS/R018/HYBRID-DEMO-PROOF/v0"


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode("ascii")


def content(path: Path) -> bytes:
    raw = path.read_bytes()
    return raw[:-1] if raw.endswith(b"\n") else raw


def frame(domain: bytes, payload: bytes) -> bytes:
    return len(domain).to_bytes(2, "big") + domain + len(payload).to_bytes(8, "big") + payload


def write_document(path: Path, value: Any) -> None:
    path.write_bytes(canonical_json(value) + b"\n")


def policy_id(policy: dict[str, Any]) -> str:
    subject = copy.deepcopy(policy)
    subject["policy_id"] = ZERO
    return hashlib.sha256(frame(POLICY_DOMAIN, canonical_json(subject))).hexdigest()


def run_verifier(script: Path, policy: Path, event: Path, authorization: Path) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["node", str(script), str(policy), str(event), str(authorization)],
        cwd=ROOT,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=30,
        check=False,
    )


def require_both_reject(name: str, policy: Path, event: Path, authorization: Path) -> str:
    results = [run_verifier(script, policy, event, authorization) for script in (PRIMARY, COLD)]
    if any(result.returncode == 0 or result.stdout for result in results):
        raise AssertionError(f"{name} was not rejected without a passing report")
    return "REJECTED_BY_BOTH"


def run_demo() -> dict[str, Any]:
    policy_path = FIXTURES / "POLICY.json"
    event_path = FIXTURES / "EVENT.json"
    authorization_path = FIXTURES / "AUTHORIZATION.json"
    expected = EXPECTED.read_bytes()
    positive = [run_verifier(script, policy_path, event_path, authorization_path) for script in (PRIMARY, COLD)]
    if any(result.returncode != 0 or result.stdout != expected for result in positive):
        raise AssertionError("independent PQ verifiers did not emit the frozen passing report")

    event_raw = content(event_path)
    baseline_receipt = Machine(content(GENESIS)).apply(event_raw)
    hybrid_receipt = Machine(content(GENESIS)).apply(event_raw)
    if baseline_receipt != hybrid_receipt:
        raise AssertionError("hybrid precheck altered the unchanged R016 transition")

    policy = json.loads(content(policy_path))
    event = json.loads(event_raw)
    authorization = json.loads(content(authorization_path))
    with tempfile.TemporaryDirectory(prefix="nexus-r018-demo-") as temporary:
        directory = Path(temporary)
        missing_path = directory / "missing.json"
        write_document(missing_path, {})
        missing = require_both_reject("missing authorization", policy_path, event_path, missing_path)

        tampered_event = copy.deepcopy(event)
        tampered_event["outputs"][0]["amount"] = "599"
        tampered_event_path = directory / "tampered-event.json"
        write_document(tampered_event_path, tampered_event)
        event_tamper = require_both_reject("event tamper", policy_path, tampered_event_path, authorization_path)

        tampered_authorization = copy.deepcopy(authorization)
        signature = bytearray(base64.b64decode(tampered_authorization["signature_base64"]))
        signature[-1] ^= 1
        tampered_authorization["signature_base64"] = base64.b64encode(signature).decode("ascii")
        tampered_authorization_path = directory / "tampered-authorization.json"
        write_document(tampered_authorization_path, tampered_authorization)
        signature_tamper = require_both_reject(
            "signature tamper", policy_path, event_path, tampered_authorization_path
        )

        weak_policy = copy.deepcopy(policy)
        weak_policy["fallback"] = "ALLOW_R016_ONLY"
        weak_policy["policy_id"] = policy_id(weak_policy)
        weak_authorization = copy.deepcopy(authorization)
        weak_authorization["policy_id"] = weak_policy["policy_id"]
        weak_policy_path = directory / "weak-policy.json"
        weak_authorization_path = directory / "weak-authorization.json"
        write_document(weak_policy_path, weak_policy)
        write_document(weak_authorization_path, weak_authorization)
        policy_weakening = require_both_reject(
            "policy weakening", weak_policy_path, event_path, weak_authorization_path
        )

    report: dict[str, Any] = {
        "attacks": {
            "event_byte_tamper": event_tamper,
            "missing_pq_authorization": missing,
            "policy_fallback_weakening": policy_weakening,
            "signature_bit_flip": signature_tamper,
        },
        "baseline": {
            "decision": "R016_ACCEPTED_WITHOUT_PQ_AUTHORIZATION",
            "object_id": baseline_receipt["object_id"],
            "state_root": baseline_receipt["after_root"],
        },
        "claims": [
            "The exact R016-valid event is rejected when the fixed R018 policy lacks its required ML-DSA-65 authorization.",
            "Node native and separately implemented Noble JavaScript ML-DSA-65 verifiers emit one byte-identical admission report.",
            "The admitted event still passes the unchanged R016 gate; PQ admission alone never accepts a state transition.",
            "Event tampering, signature tampering, and a self-consistent fallback-policy rewrite fail closed in both verifiers.",
        ],
        "event_sha256": hashlib.sha256(event_raw).hexdigest(),
        "hybrid": {
            "pq_cold_verifier": "PASS",
            "pq_native_verifier": "PASS",
            "r016_after_pq": "PASS",
            "r016_object_id": hybrid_receipt["object_id"],
            "r016_state_root": hybrid_receipt["after_root"],
        },
        "non_claims": [
            "This experiment does not prove ML-DSA-65 unbreakable or establish complete post-quantum security.",
            "It does not implement authenticated PQ-key enrollment, PQ-key rotation or recovery, wallet custody, secure hardware, or operational entropy.",
            "Nothing in this proposal makes the R018 wrapper mandatory; a caller can still invoke legacy R016 directly because no consensus or deployment policy selects R018.",
            "A repository maintainer can publish different code, but it cannot retain this exact policy ID and frozen proof while changing the committed V0 policy bytes.",
            "It does not establish consensus, fork choice, global finality, economic security, stable value, production readiness, or authorization for live funds.",
            "The public deterministic fixture seed and generated signature are test material, never operational credentials.",
        ],
        "policy_id": policy["policy_id"],
        "proof_id": ZERO,
        "schema": "nexus.r018-pq-hybrid-demo/v0",
        "status": "DEMONSTRATED_FIXED_PQ_ADMISSION_AND_UNCHANGED_R016_ALL_OF_GATE",
        "status_authority": "NONE",
    }
    report["proof_id"] = hashlib.sha256(frame(PROOF_DOMAIN, canonical_json(report))).hexdigest()
    return report


def main() -> int:
    print(json.dumps(run_demo(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
