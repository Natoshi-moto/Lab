#!/usr/bin/env python3
"""Run two independent R016 stores through a deterministic partition/fork demo.

The two stores start from byte-identical genesis, independently audit the same
height-zero history, then accept different valid signed spends of Alice's same
genesis outpoint while isolated. After "healing", two observers receive the
signed attestations in opposite orders and must derive one byte-identical fork
proof. No history is selected, merged, rolled back, or rewritten.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from experiments.R016_PCX_INTEGRATED_CUSTODY_GATE.generate_vectors import Builder, PublicTestKeys
from system.nexus_lab.custody_kernel import Machine, canonical_json
from system.nexus_lab.replication_auth import ReplicaKeyRegistry, checkpoint_payload_from_r016_audit
from system.nexus_lab.replication_evidence import (
    ReplicaEvidenceLog,
    _checkpoint_id,
    decode_checkpoint,
    encode_checkpoint,
)

CLI = [sys.executable, "-m", "system.nexus_lab.custody_cli"]
REPORT_SCHEMA = "nexus.r017-process-partition-demo/v0"


def _run(*args: str) -> dict[str, Any]:
    completed = subprocess.run(
        [*CLI, *args],
        cwd=ROOT,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=45,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.decode("utf-8", errors="replace"))
    return json.loads(completed.stdout)


def _write(path: Path, raw: bytes) -> None:
    path.write_bytes(raw)


def _signed_checkpoint(
    *, replica_id: str, payload: dict[str, str], keys: PublicTestKeys, registry: ReplicaKeyRegistry
):
    message = canonical_json({**payload, "checkpoint_id": _checkpoint_id(payload)})
    raw = encode_checkpoint(payload, keys.sign(replica_id, message))
    return decode_checkpoint(raw, registry.verify)


def run_demo() -> dict[str, Any]:
    builder = Builder()
    replica_keys = PublicTestKeys(["replica-alpha", "replica-beta"])
    try:
        genesis = builder.genesis()
        initial = Machine(genesis)
        left_event = builder.transfer(
            initial,
            builder.alice,
            [builder.alice_genesis_outpoint],
            [(builder.alice, "500"), (builder.bob, "100")],
            "alice-active-0",
        )
        right_event = builder.transfer(
            initial,
            builder.alice,
            [builder.alice_genesis_outpoint],
            [(builder.alice, "450"), (builder.bob, "150")],
            "alice-active-0",
        )
        left_raw = canonical_json(left_event)
        right_raw = canonical_json(right_event)
        if left_event["object_id"] == right_event["object_id"]:
            raise AssertionError("sibling operations unexpectedly share an object id")

        registry = ReplicaKeyRegistry(
            {
                "replica-alpha": replica_keys.public["replica-alpha"],
                "replica-beta": replica_keys.public["replica-beta"],
            }
        )

        with tempfile.TemporaryDirectory(prefix="nexus-r017-partition-") as temp:
            directory = Path(temp)
            genesis_path = directory / "GENESIS.json"
            left_event_path = directory / "left-event.json"
            right_event_path = directory / "right-event.json"
            left_db = directory / "alpha.sqlite"
            right_db = directory / "beta.sqlite"
            _write(genesis_path, genesis)
            _write(left_event_path, left_raw)
            _write(right_event_path, right_raw)

            # Separate process invocations reconstruct and operate each store.
            _run("store-init", str(genesis_path), str(left_db))
            _run("store-init", str(genesis_path), str(right_db))
            left_zero_audit = _run("store-audit", str(genesis_path), str(left_db))
            right_zero_audit = _run("store-audit", str(genesis_path), str(right_db))

            alpha_zero_payload = checkpoint_payload_from_r016_audit(
                replica_id="replica-alpha",
                genesis_raw=genesis,
                audit_report=left_zero_audit,
                parent_checkpoint="",
            )
            beta_zero_payload = checkpoint_payload_from_r016_audit(
                replica_id="replica-beta",
                genesis_raw=genesis,
                audit_report=right_zero_audit,
                parent_checkpoint="",
            )
            alpha_zero = _signed_checkpoint(
                replica_id="replica-alpha", payload=alpha_zero_payload, keys=replica_keys, registry=registry
            )
            beta_zero = _signed_checkpoint(
                replica_id="replica-beta", payload=beta_zero_payload, keys=replica_keys, registry=registry
            )
            if alpha_zero.history_id != beta_zero.history_id:
                raise AssertionError("identical genesis stores did not produce one history id")

            # Partition: each isolated process accepts a different valid sibling spend.
            _run("store-apply", str(genesis_path), str(left_db), str(left_event_path))
            _run("store-apply", str(genesis_path), str(right_db), str(right_event_path))
            left_audit = _run("store-audit", str(genesis_path), str(left_db))
            right_audit = _run("store-audit", str(genesis_path), str(right_db))

            alpha_payload = checkpoint_payload_from_r016_audit(
                replica_id="replica-alpha",
                genesis_raw=genesis,
                audit_report=left_audit,
                parent_checkpoint=alpha_zero.history_id,
            )
            beta_payload = checkpoint_payload_from_r016_audit(
                replica_id="replica-beta",
                genesis_raw=genesis,
                audit_report=right_audit,
                parent_checkpoint=beta_zero.history_id,
            )
            alpha_one = _signed_checkpoint(
                replica_id="replica-alpha", payload=alpha_payload, keys=replica_keys, registry=registry
            )
            beta_one = _signed_checkpoint(
                replica_id="replica-beta", payload=beta_payload, keys=replica_keys, registry=registry
            )
            if alpha_one.history_id == beta_one.history_id:
                raise AssertionError("different valid sibling stores did not diverge")

            # Healing: independent observers receive opposite delivery orders.
            observer_a = ReplicaEvidenceLog(alpha_zero.genesis_sha256)
            observer_a.observe(alpha_zero)
            observer_a.observe(beta_zero)
            observer_a.observe(alpha_one)
            proof_a = observer_a.observe(beta_one)["fork_proof"]

            observer_b = ReplicaEvidenceLog(alpha_zero.genesis_sha256)
            observer_b.observe(beta_zero)
            observer_b.observe(alpha_zero)
            observer_b.observe(beta_one)
            proof_b = observer_b.observe(alpha_one)["fork_proof"]

            if proof_a is None or proof_a != proof_b:
                raise AssertionError("observers did not derive identical fork evidence")
            if proof_a["reason"] != "CONFLICTING_SIBLING_HISTORIES":
                raise AssertionError("unexpected fork classification")

            # Reopen after evidence exchange: neither store has been rewritten.
            left_reopen = _run("store-audit", str(genesis_path), str(left_db))
            right_reopen = _run("store-audit", str(genesis_path), str(right_db))
            if left_reopen["anchor"] != left_audit["anchor"] or right_reopen["anchor"] != right_audit["anchor"]:
                raise AssertionError("healing rewrote a local store")

        return {
            "claims": [
                "Two separately invoked R016 stores reconstructed one exact genesis history.",
                "During isolation, each store accepted a different valid Ed25519-signed spend of the same genesis outpoint.",
                "After evidence exchange, two observers receiving opposite message orders produced one identical fork proof.",
                "Evidence exchange selected, merged, rolled back, and rewrote neither local history.",
            ],
            "fork_proof": proof_a,
            "genesis_history_id": alpha_zero.history_id,
            "left": {
                "checkpoint_id": alpha_one.checkpoint_id,
                "history_id": alpha_one.history_id,
                "object_id": left_event["object_id"],
                "state_root": left_audit["state_root"],
            },
            "non_claims": [
                "This process-separated deterministic experiment is not networking, consensus, fork choice, finality, availability, or Byzantine fault tolerance.",
                "Public deterministic vector keys are not operational key security.",
                "The fork is detected but not resolved.",
                "No live value or deployment is authorized.",
            ],
            "registry_id": registry.registry_id,
            "right": {
                "checkpoint_id": beta_one.checkpoint_id,
                "history_id": beta_one.history_id,
                "object_id": right_event["object_id"],
                "state_root": right_audit["state_root"],
            },
            "schema": REPORT_SCHEMA,
            "status": "DEMONSTRATED_PROCESS_SEPARATED_VALID_SIBLING_HISTORIES_AND_ORDER_INDEPENDENT_FORK_EVIDENCE",
            "status_authority": "NONE",
        }
    finally:
        replica_keys.close()
        builder.keys.close()


def main() -> int:
    print(json.dumps(run_demo(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
