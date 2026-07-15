#!/usr/bin/env python3
"""Generate the deterministic public R017 compound campaign fixture."""

from __future__ import annotations

import base64
import copy
import hashlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from experiments.R016_PCX_INTEGRATED_CUSTODY_GATE.generate_vectors import (  # noqa: E402
    Builder, PublicTestKeys, TRANSCRIPT_DOMAIN, TRANSCRIPT_SCHEMA, _hash,
)
from system.nexus_lab.custody_kernel import Machine, canonical_json  # noqa: E402
from system.nexus_lab.replication import (  # noqa: E402
    CHECKPOINT_SCHEMA, NETWORK, PROFILE, SCHEMA, STATUS_AUTHORITY, ZERO,
    checkpoint_message, run_campaign,
)


def signed_checkpoint(keys: PublicTestKeys, name: str, host: str, genesis_sha256: str,
                      height: str, root: str, session: str) -> dict[str, str]:
    value = {
        "genesis_sha256": genesis_sha256,
        "height": height,
        "host": host,
        "host_key": keys.public[name],
        "network": NETWORK,
        "payload_digest": "",
        "profile": PROFILE,
        "root": root,
        "schema": CHECKPOINT_SCHEMA,
        "session": session,
        "signature": "",
        "status_authority": STATUS_AUTHORITY,
    }
    payload = {k: value[k] for k in value if k not in {"payload_digest", "signature"}}
    value["payload_digest"] = hashlib.sha256(canonical_json(payload)).hexdigest()
    value["signature"] = keys.sign(name, checkpoint_message(value))
    return value


def closed_transcript(genesis: bytes, wires: list[bytes]) -> dict:
    machine = Machine(genesis)
    initial_root = machine.state_root
    records = []
    for index, wire in enumerate(wires, 1):
        event = __import__("json").loads(wire)
        receipt = machine.apply(wire)
        records.append({
            "event_b64": base64.b64encode(wire).decode("ascii"),
            "event_sha256": hashlib.sha256(wire).hexdigest(),
            "kind": event["kind"], "object_id": event["object_id"],
            "receipt": receipt, "sequence": str(index),
        })
    value = {
        "closure": "CLOSED_EXACT_PREFIX", "event_count": str(len(records)),
        "final_height": str(machine.height), "final_state": machine.public_state(),
        "final_state_root": machine.state_root,
        "genesis_b64": base64.b64encode(genesis).decode("ascii"),
        "genesis_sha256": hashlib.sha256(genesis).hexdigest(),
        "initial_state_root": initial_root, "network": "NEXUS-R016-SYNTHETIC",
        "profile": "CUSTODY-KERNEL-V1", "records": records,
        "schema": TRANSCRIPT_SCHEMA, "status_authority": STATUS_AUTHORITY,
        "synthetic_supply": "1000", "transcript_id": ZERO,
        "vector_provenance": {
            "derivation": "PUBLIC_LABEL_SHA256_TO_EPHEMERAL_ED25519_PKCS8_TEMPFILES",
            "operational_secrecy": "NONE", "retained_private_material": "FALSE",
            "signer": "OPENSSL_ED25519",
        }, "version": "1",
    }
    value["transcript_id"] = _hash(TRANSCRIPT_DOMAIN, value)
    return value


def build() -> tuple[dict, dict]:
    builder = Builder()
    host_keys = PublicTestKeys(["r017-host-a", "r017-host-b", "r017-host-c"])
    try:
        genesis = builder.genesis()
        machine = Machine(genesis)
        common = builder.transfer(
            machine, builder.alice, [builder.alice_genesis_outpoint],
            [(builder.alice, "600")], "alice-active-0",
        )
        common_wire = canonical_json(common)
        machine.apply(common_wire)
        sibling_rotate = builder.rotate(
            machine, "alice-active-1", "alice-active-0", "alice-guardian-0"
        )
        sibling_recover = builder.recover(
            machine, "alice-active-2", ("alice-guardian-1", "alice-guardian-2")
        )
        sibling_wires = [canonical_json(sibling_rotate), canonical_json(sibling_recover)]
        roots = []
        for wire in sibling_wires:
            branch = Machine(genesis)
            branch.apply(common_wire)
            branch.apply(wire)
            roots.append(branch.state_root)
        genesis_sha256 = hashlib.sha256(genesis).hexdigest()
        session = hashlib.sha256(b"NEXUS-R017-PUBLIC-TEST-SESSION").hexdigest()
        names = ["r017-host-a", "r017-host-b", "r017-host-c"]
        hosts = ["A", "B", "C"]
        checkpoints = [
            signed_checkpoint(host_keys, names[0], hosts[0], genesis_sha256, "2", roots[0], session),
            signed_checkpoint(host_keys, names[1], hosts[1], genesis_sha256, "2", roots[1], session),
            signed_checkpoint(host_keys, names[2], hosts[2], genesis_sha256, "1", machine.state_root, session),
        ]
        rotate_machine = Machine(genesis)
        rotate_machine.apply(common_wire)
        rotate_machine.apply(sibling_wires[0])
        rotate_revoke = canonical_json(builder.revoke(
            rotate_machine, ("alice-guardian-0", "alice-guardian-1")
        ))
        recover_machine = Machine(genesis)
        recover_machine.apply(common_wire)
        recover_machine.apply(sibling_wires[1])
        recover_revoke = canonical_json(builder.revoke(
            recover_machine, ("alice-guardian-0", "alice-guardian-2")
        ))
        schedule = [
            {"action": "DELIVER", "host": "A", "object": "COMMON"},
            {"action": "DELIVER_DUPLICATE", "host": "B", "object": "COMMON"},
            {"action": "DELIVER_DELAYED", "host": "C", "object": "COMMON"},
            {"action": "PARTITION_DELIVER", "host": "A", "object": "SIBLING_ROTATE"},
            {"action": "PARTITION_DELIVER", "host": "B", "object": "SIBLING_RECOVER"},
            {"action": "EXCHANGE_CHECKPOINT", "host": "C", "object": "CHECKPOINT_A"},
            {"action": "EXCHANGE_CHECKPOINT", "host": "C", "object": "CHECKPOINT_B"},
            {"action": "RELEASE_PARTITION", "host": "A", "object": "SIBLING_RECOVER"},
            {"action": "RELEASE_PARTITION", "host": "B", "object": "SIBLING_ROTATE"},
            {"action": "REPLAY_FROM_GENESIS", "host": "C", "object": "BOTH_BRANCHES"},
        ]
        campaign = {
            "branch_transcripts": [
                closed_transcript(genesis, [common_wire, sibling_wires[0], rotate_revoke]),
                closed_transcript(genesis, [common_wire, sibling_wires[1], recover_revoke]),
            ],
            "checkpoints": checkpoints,
            "common_event_b64": base64.b64encode(common_wire).decode("ascii"),
            "genesis_b64": base64.b64encode(genesis).decode("ascii"),
            "genesis_sha256": genesis_sha256,
            "host_keys": {host: host_keys.public[name] for host, name in zip(hosts, names, strict=True)},
            "schedule": schedule,
            "schema": SCHEMA,
            "session": session,
            "siblings": [
                {"event_b64": base64.b64encode(wire).decode("ascii"),
                 "event_sha256": hashlib.sha256(wire).hexdigest()}
                for wire in sibling_wires
            ],
            "status_authority": STATUS_AUTHORITY,
            "vector_provenance": {
                "operational_secrecy": "NONE",
                "retained_private_material": "FALSE",
                "signer": "OPENSSL_ED25519",
            },
        }
        return campaign, run_campaign(campaign)
    finally:
        builder.close()
        host_keys.close()


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        raise SystemExit("usage: generate_campaign.py OUTPUT_DIRECTORY")
    output = Path(argv[1])
    output.mkdir(parents=True, exist_ok=True)
    campaign, report = build()
    (output / "COMPOUND_CAMPAIGN.json").write_bytes(canonical_json(campaign) + b"\n")
    (output / "EXPECTED_REPORT.json").write_bytes(canonical_json(report) + b"\n")
    sys.stdout.buffer.write(canonical_json({"report_id": report["report_id"], "status": "PASS"}) + b"\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
