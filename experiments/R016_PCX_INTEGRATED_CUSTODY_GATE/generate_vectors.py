#!/usr/bin/env python3
"""Build deterministic public R016 test vectors without retaining key material.

The derivation labels are intentionally public test data. Private Ed25519 seed
bytes exist only in a temporary directory for the duration of this process.
They provide reproducibility, not secrecy or entropy evidence.
"""

from __future__ import annotations

import base64
import copy
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

from system.nexus_lab.custody_kernel import (  # noqa: E402
    NETWORK,
    PROFILE,
    PROTOCOL_VERSION,
    STATUS_AUTHORITY,
    ZERO_HEAD,
    Machine,
    canonical_json,
    derive_outpoint,
    operation_id,
    signature_message,
)


TRANSCRIPT_SCHEMA = "nexus.r016-custody-closed-transcript/v0"
TRANSCRIPT_DOMAIN = "NEXUS/R016/CLOSED-TRANSCRIPT/v1"
KEY_LABEL_DOMAIN = "NEXUS-R016-PUBLIC-TEST-VECTOR:"
PKCS8_ED25519_PREFIX = bytes.fromhex("302e020100300506032b657004220420")


def _frame(domain: str, payload: bytes) -> bytes:
    raw = domain.encode("ascii")
    return len(raw).to_bytes(2, "big") + raw + len(payload).to_bytes(8, "big") + payload


def _hash(domain: str, value: Any) -> str:
    return hashlib.sha256(_frame(domain, canonical_json(value))).hexdigest()


def ident(label: str) -> str:
    return hashlib.sha256(("NEXUS-R016-ID:" + label).encode("ascii")).hexdigest()


class PublicTestKeys:
    def __init__(self, names: list[str]) -> None:
        self._temporary = tempfile.TemporaryDirectory(prefix="nexus-r016-public-vectors-")
        self.directory = Path(self._temporary.name)
        self.private_paths: dict[str, Path] = {}
        self.public: dict[str, str] = {}
        for name in names:
            seed = hashlib.sha256((KEY_LABEL_DOMAIN + name).encode("ascii")).digest()
            path = self.directory / f"{name}.der"
            path.write_bytes(PKCS8_ED25519_PREFIX + seed)
            os.chmod(path, 0o600)
            public_der = subprocess.run(
                [
                    "openssl",
                    "pkey",
                    "-inform",
                    "DER",
                    "-in",
                    str(path),
                    "-pubout",
                    "-outform",
                    "DER",
                ],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
                timeout=10,
            ).stdout
            self.private_paths[name] = path
            self.public[name] = public_der[-32:].hex()

    def sign(self, name: str, message: bytes) -> str:
        message_path = self.directory / "message.bin"
        signature_path = self.directory / "signature.bin"
        message_path.write_bytes(message)
        subprocess.run(
            [
                "openssl",
                "pkeyutl",
                "-sign",
                "-inkey",
                str(self.private_paths[name]),
                "-keyform",
                "DER",
                "-rawin",
                "-in",
                str(message_path),
                "-out",
                str(signature_path),
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            check=True,
            timeout=10,
        )
        return signature_path.read_bytes().hex()

    def close(self) -> None:
        self._temporary.cleanup()


class Builder:
    def __init__(self) -> None:
        self.keys = PublicTestKeys(
            [
                "alice-active-0",
                "alice-guardian-0",
                "alice-guardian-1",
                "alice-guardian-2",
                "bob-active-0",
                "bob-guardian-0",
                "bob-guardian-1",
                "bob-guardian-2",
                "alice-active-1",
                "alice-active-2",
            ]
        )
        self.alice = ident("controller-alice")
        self.bob = ident("controller-bob")
        self.alice_genesis_outpoint = ident("alice-genesis-output")
        self.bob_genesis_outpoint = ident("bob-genesis-output")

    def genesis(self) -> bytes:
        controllers = [
            {
                "active_key": self.keys.public["alice-active-0"],
                "controller": self.alice,
                "recovery_keys": sorted(
                    [
                        self.keys.public["alice-guardian-0"],
                        self.keys.public["alice-guardian-1"],
                        self.keys.public["alice-guardian-2"],
                    ]
                ),
            },
            {
                "active_key": self.keys.public["bob-active-0"],
                "controller": self.bob,
                "recovery_keys": sorted(
                    [
                        self.keys.public["bob-guardian-0"],
                        self.keys.public["bob-guardian-1"],
                        self.keys.public["bob-guardian-2"],
                    ]
                ),
            },
        ]
        utxos = [
            {
                "amount": "600",
                "controller": self.alice,
                "outpoint": self.alice_genesis_outpoint,
            },
            {
                "amount": "400",
                "controller": self.bob,
                "outpoint": self.bob_genesis_outpoint,
            },
        ]
        return canonical_json(
            {
                "controllers": sorted(controllers, key=lambda item: item["controller"]),
                "kind": "GENESIS",
                "network": NETWORK,
                "profile": PROFILE,
                "status_authority": STATUS_AUTHORITY,
                "utxos": sorted(utxos, key=lambda item: item["outpoint"]),
                "version": PROTOCOL_VERSION,
            }
        )

    def base(self, machine: Machine, kind: str, controller: str) -> dict[str, Any]:
        current = machine.controller(controller)
        return {
            "controller": controller,
            "controller_epoch": current["epoch"],
            "controller_head": current["head"],
            "kind": kind,
            "network": NETWORK,
            "object_id": ZERO_HEAD,
            "predecessor": machine.state_root,
            "profile": PROFILE,
            "status_authority": STATUS_AUTHORITY,
            "version": PROTOCOL_VERSION,
        }

    @staticmethod
    def finalize(operation: dict[str, Any]) -> dict[str, Any]:
        operation["object_id"] = operation_id(operation)
        return operation

    def proof(
        self,
        operation: dict[str, Any],
        role: str,
        name: str,
        outpoint: str | None = None,
    ) -> dict[str, str]:
        public_key = self.keys.public[name]
        message = signature_message(
            operation, role, key=public_key, outpoint=outpoint
        )
        result = {
            "key": public_key,
            "signature": self.keys.sign(name, message),
        }
        if outpoint is not None:
            result["outpoint"] = outpoint
        return result

    def transfer(
        self,
        machine: Machine,
        controller: str,
        inputs: list[str],
        outputs: list[tuple[str, str]],
        active_name: str,
    ) -> dict[str, Any]:
        operation = self.base(machine, "TRANSFER", controller)
        operation["inputs"] = sorted(inputs)
        operation["outputs"] = [
            {"amount": amount, "controller": owner} for owner, amount in outputs
        ]
        self.finalize(operation)
        operation["proofs"] = [
            self.proof(
                operation,
                "TRANSFER_ACTIVE",
                active_name,
                outpoint=outpoint,
            )
            for outpoint in operation["inputs"]
        ]
        return operation

    def rotate(
        self,
        machine: Machine,
        new_name: str,
        active_name: str,
        guardian_name: str,
    ) -> dict[str, Any]:
        operation = self.base(machine, "ROTATE", self.alice)
        operation["new_key"] = self.keys.public[new_name]
        self.finalize(operation)
        operation["proofs"] = {
            "active": self.proof(operation, "ROTATE_ACTIVE", active_name),
            "guardian": self.proof(
                operation, "ROTATE_GUARDIAN", guardian_name
            ),
            "new_key": self.proof(operation, "ROTATE_NEW_KEY", new_name),
        }
        return operation

    def recover(
        self,
        machine: Machine,
        new_name: str,
        guardian_names: tuple[str, str],
    ) -> dict[str, Any]:
        operation = self.base(machine, "RECOVER", self.alice)
        operation["new_key"] = self.keys.public[new_name]
        self.finalize(operation)
        guardians = [
            self.proof(operation, "RECOVER_GUARDIAN", name)
            for name in guardian_names
        ]
        operation["proofs"] = {
            "guardians": sorted(guardians, key=lambda item: item["key"]),
            "new_key": self.proof(operation, "RECOVER_NEW_KEY", new_name),
        }
        return operation

    def revoke(
        self, machine: Machine, guardian_names: tuple[str, str]
    ) -> dict[str, Any]:
        operation = self.base(machine, "REVOKE", self.alice)
        self.finalize(operation)
        guardians = [
            self.proof(operation, "REVOKE_GUARDIAN", name)
            for name in guardian_names
        ]
        operation["proofs"] = {
            "guardians": sorted(guardians, key=lambda item: item["key"])
        }
        return operation

    def build_transcript(self) -> tuple[bytes, bytes, dict[str, Any]]:
        genesis = self.genesis()
        machine = Machine(genesis)
        initial_root = machine.state_root
        records: list[dict[str, Any]] = []

        def append(operation: dict[str, Any]) -> None:
            wire = canonical_json(operation)
            receipt = machine.apply(wire)
            records.append(
                {
                    "event_b64": base64.b64encode(wire).decode("ascii"),
                    "event_sha256": hashlib.sha256(wire).hexdigest(),
                    "kind": operation["kind"],
                    "object_id": operation["object_id"],
                    "receipt": receipt,
                    "sequence": str(len(records) + 1),
                }
            )

        first = self.transfer(
            machine,
            self.alice,
            [self.alice_genesis_outpoint],
            [(self.alice, "600")],
            "alice-active-0",
        )
        append(first)
        alice_outpoint = derive_outpoint(first["object_id"], 0)

        append(
            self.rotate(
                machine,
                "alice-active-1",
                "alice-active-0",
                "alice-guardian-0",
            )
        )

        second = self.transfer(
            machine,
            self.alice,
            [alice_outpoint],
            [(self.alice, "500"), (self.bob, "100")],
            "alice-active-1",
        )
        append(second)
        alice_outpoint = derive_outpoint(second["object_id"], 0)

        append(
            self.recover(
                machine,
                "alice-active-2",
                ("alice-guardian-0", "alice-guardian-1"),
            )
        )

        third = self.transfer(
            machine,
            self.alice,
            [alice_outpoint],
            [(self.alice, "500")],
            "alice-active-2",
        )
        append(third)

        append(
            self.revoke(
                machine, ("alice-guardian-1", "alice-guardian-2")
            )
        )

        transcript: dict[str, Any] = {
            "closure": "CLOSED_EXACT_PREFIX",
            "event_count": str(len(records)),
            "final_height": str(machine.height),
            "final_state": machine.public_state(),
            "final_state_root": machine.state_root,
            "genesis_b64": base64.b64encode(genesis).decode("ascii"),
            "genesis_sha256": hashlib.sha256(genesis).hexdigest(),
            "initial_state_root": initial_root,
            "network": NETWORK,
            "profile": PROFILE,
            "records": records,
            "schema": TRANSCRIPT_SCHEMA,
            "status_authority": STATUS_AUTHORITY,
            "synthetic_supply": "1000",
            "transcript_id": ZERO_HEAD,
            "vector_provenance": {
                "derivation": "PUBLIC_LABEL_SHA256_TO_EPHEMERAL_ED25519_PKCS8_TEMPFILES",
                "operational_secrecy": "NONE",
                "retained_private_material": "FALSE",
                "signer": "OPENSSL_ED25519",
            },
            "version": PROTOCOL_VERSION,
        }
        transcript["transcript_id"] = _hash(TRANSCRIPT_DOMAIN, transcript)
        return genesis, canonical_json(transcript) + b"\n", transcript

    def close(self) -> None:
        self.keys.close()


def build(output_directory: Path) -> dict[str, Any]:
    builder = Builder()
    try:
        genesis, transcript_bytes, transcript = builder.build_transcript()
        output_directory.mkdir(parents=True, exist_ok=True)
        genesis_path = output_directory / "GENESIS.json"
        transcript_path = output_directory / "CLOSED_TRANSCRIPT.json"
        # Genesis is a strict wire artifact. A trailing newline would make the
        # human-readable file unusable by the exact canonical parser and CLI.
        genesis_path.write_bytes(genesis)
        transcript_path.write_bytes(transcript_bytes)
        return {
            "event_count": transcript["event_count"],
            "final_state_root": transcript["final_state_root"],
            "genesis_path": str(genesis_path),
            "genesis_sha256": transcript["genesis_sha256"],
            "retained_private_material": "FALSE",
            "status_authority": STATUS_AUTHORITY,
            "transcript_id": transcript["transcript_id"],
            "transcript_path": str(transcript_path),
        }
    finally:
        builder.close()


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        raise SystemExit("usage: generate_vectors.py OUTPUT_DIRECTORY")
    result = build(Path(argv[1]))
    sys.stdout.buffer.write(canonical_json(result) + b"\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
