from __future__ import annotations

import hashlib
import subprocess
import tempfile
import unittest
from pathlib import Path

from system.nexus_lab.custody_kernel import NETWORK, PROFILE, PROTOCOL_VERSION, canonical_json
from system.nexus_lab.replication_auth import ReplicaKeyRegistry, checkpoint_payload_from_r016_audit
from system.nexus_lab.replication_evidence import SchemaError, decode_checkpoint, encode_checkpoint


SEED = "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60"
PUBLIC = "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"
GENESIS = b'{"synthetic":"genesis"}'
STATE_ROOT = "22" * 32
RECORD_HASH = "33" * 32
RECEIPT_HEAD = "44" * 32


def tagged_hash(tag: str, payload: bytes) -> str:
    tag_hash = hashlib.sha256(tag.encode("ascii")).digest()
    return hashlib.sha256(tag_hash + tag_hash + payload).hexdigest()


def anchor(sequence: str = "1") -> dict[str, str]:
    result = {
        "anchor_id": "",
        "network": NETWORK,
        "profile": PROFILE,
        "protocol_version": PROTOCOL_VERSION,
        "receipt_head": RECEIPT_HEAD,
        "record_hash": RECORD_HASH,
        "schema": "nexus.pcx-custody-durable-anchor/v0",
        "sequence": sequence,
        "state_root": STATE_ROOT,
        "status_authority": "NONE",
    }
    result["anchor_id"] = tagged_hash(
        "NEXUS/PCX/CUSTODY-DURABLE-ANCHOR/V0", canonical_json(result)
    )
    return result


def audit_report() -> dict[str, object]:
    return {
        "anchor": anchor(),
        "height": 1,
        "state_root": STATE_ROOT,
        "status": "PASS",
        "status_authority": "NONE",
    }


def sign(message: bytes) -> str:
    private_der = bytes.fromhex("302e020100300506032b657004220420" + SEED)
    with tempfile.TemporaryDirectory(prefix="nexus-r017-sign-test-") as temp:
        directory = Path(temp)
        key_path = directory / "private.der"
        message_path = directory / "message.bin"
        signature_path = directory / "signature.bin"
        key_path.write_bytes(private_der)
        message_path.write_bytes(message)
        completed = subprocess.run(
            [
                "openssl", "pkeyutl", "-sign", "-inkey", str(key_path),
                "-keyform", "DER", "-rawin", "-in", str(message_path),
                "-out", str(signature_path),
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=10,
            check=False,
        )
        if completed.returncode != 0:
            raise RuntimeError(completed.stderr.decode("utf-8", errors="replace"))
        return signature_path.read_bytes().hex()


class ReplicationAuthTests(unittest.TestCase):
    def test_pinned_registry_verifies_exact_checkpoint(self) -> None:
        registry = ReplicaKeyRegistry({"alpha": PUBLIC})
        payload = checkpoint_payload_from_r016_audit(
            replica_id="alpha",
            genesis_raw=GENESIS,
            audit_report=audit_report(),
            parent_checkpoint="55" * 32,
        )
        signature = sign(canonical_json(payload))
        checkpoint = decode_checkpoint(encode_checkpoint(payload, signature), registry.verify)
        self.assertEqual(checkpoint.replica_id, "alpha")
        self.assertEqual(checkpoint.height, 1)
        self.assertEqual(checkpoint.state_root, STATE_ROOT)

    def test_unknown_replica_fails_authentication(self) -> None:
        registry = ReplicaKeyRegistry({"alpha": PUBLIC})
        self.assertFalse(registry.verify("beta", b"message", "00" * 64))

    def test_registry_rejects_key_aliasing(self) -> None:
        with self.assertRaises(SchemaError):
            ReplicaKeyRegistry({"alpha": PUBLIC, "beta": PUBLIC})

    def test_adapter_rejects_partial_anchor(self) -> None:
        report = audit_report()
        del report["anchor"]["anchor_id"]  # type: ignore[index]
        with self.assertRaises(SchemaError):
            checkpoint_payload_from_r016_audit(
                replica_id="alpha",
                genesis_raw=GENESIS,
                audit_report=report,
                parent_checkpoint="55" * 32,
            )

    def test_adapter_rejects_tampered_anchor_id(self) -> None:
        report = audit_report()
        report["anchor"]["anchor_id"] = "ff" * 32  # type: ignore[index]
        with self.assertRaises(SchemaError):
            checkpoint_payload_from_r016_audit(
                replica_id="alpha",
                genesis_raw=GENESIS,
                audit_report=report,
                parent_checkpoint="55" * 32,
            )

    def test_adapter_rejects_summary_anchor_disagreement(self) -> None:
        report = audit_report()
        report["height"] = 2
        with self.assertRaises(SchemaError):
            checkpoint_payload_from_r016_audit(
                replica_id="alpha",
                genesis_raw=GENESIS,
                audit_report=report,
                parent_checkpoint="55" * 32,
            )

    def test_registry_id_is_order_independent(self) -> None:
        second = "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c"
        left = ReplicaKeyRegistry({"alpha": PUBLIC, "beta": second})
        right = ReplicaKeyRegistry({"beta": second, "alpha": PUBLIC})
        self.assertEqual(left.registry_id, right.registry_id)


if __name__ == "__main__":
    unittest.main()
