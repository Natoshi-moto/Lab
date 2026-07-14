from __future__ import annotations

import hashlib
import json
import unittest

from system.nexus_lab.replication_evidence import (
    AuthenticationError,
    EncodingError,
    EquivocationError,
    ReplicaEvidenceLog,
    SchemaError,
    canonical_json,
    checkpoint_payload,
    decode_checkpoint,
    encode_checkpoint,
)


GENESIS = "11" * 32
ROOT0 = "22" * 32
ROOT1 = "33" * 32
ROOT2A = "44" * 32
ROOT2B = "55" * 32
RECORD1 = "66" * 32
RECORD2A = "77" * 32
RECORD2B = "88" * 32
RECEIPT1 = "99" * 32
RECEIPT2A = "aa" * 32
RECEIPT2B = "bb" * 32
SECRETS = {"alpha": b"alpha-secret", "beta": b"beta-secret", "gamma": b"gamma-secret"}


def sign(replica_id: str, payload: bytes) -> str:
    return hashlib.sha256(SECRETS[replica_id] + payload).hexdigest()


def verify(replica_id: str, payload: bytes, signature: str) -> bool:
    secret = SECRETS.get(replica_id)
    return secret is not None and hashlib.sha256(secret + payload).hexdigest() == signature


def make(
    replica_id: str,
    height: int,
    state_root: str,
    record_hash: str,
    receipt_head: str,
    parent_checkpoint: str,
):
    payload = checkpoint_payload(
        replica_id=replica_id,
        height=height,
        state_root=state_root,
        record_hash=record_hash,
        receipt_head=receipt_head,
        parent_checkpoint=parent_checkpoint,
        genesis_sha256=GENESIS,
    )
    return decode_checkpoint(encode_checkpoint(payload, sign(replica_id, canonical_json(payload))), verify)


class ReplicationEvidenceTests(unittest.TestCase):
    def test_exact_duplicate_is_idempotently_classified(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        log = ReplicaEvidenceLog(GENESIS)
        self.assertEqual(log.observe(zero)["observation"]["relation"], "GENESIS")
        self.assertEqual(log.observe(zero)["observation"]["relation"], "DUPLICATE")
        self.assertEqual(len(log.observations), 2)

    def test_known_parent_extension_is_explicit(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        one = make("beta", 1, ROOT1, RECORD1, RECEIPT1, zero.checkpoint_id)
        log = ReplicaEvidenceLog(GENESIS)
        log.observe(zero)
        result = log.observe(one)
        self.assertEqual(result["observation"]["relation"], "EXTENDS_KNOWN_PREFIX")
        self.assertIsNone(result["fork_proof"])

    def test_out_of_order_checkpoint_is_preserved_as_gap(self) -> None:
        fake_parent = "cc" * 32
        one = make("beta", 1, ROOT1, RECORD1, RECEIPT1, fake_parent)
        log = ReplicaEvidenceLog(GENESIS)
        result = log.observe(one)
        self.assertEqual(result["observation"]["relation"], "GAP")
        self.assertIsNone(result["fork_proof"])

    def test_conflicting_siblings_produce_order_independent_proof(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        left = make("beta", 1, ROOT1, RECORD1, RECEIPT1, zero.checkpoint_id)
        right = make("gamma", 1, ROOT2A, RECORD2A, RECEIPT2A, zero.checkpoint_id)

        first = ReplicaEvidenceLog(GENESIS)
        first.observe(zero)
        first.observe(left)
        proof_a = first.observe(right)["fork_proof"]

        second = ReplicaEvidenceLog(GENESIS)
        second.observe(zero)
        second.observe(right)
        proof_b = second.observe(left)["fork_proof"]

        self.assertIsNotNone(proof_a)
        self.assertEqual(proof_a, proof_b)
        self.assertEqual(proof_a["reason"], "CONFLICTING_SIBLING_CHECKPOINTS")

    def test_same_replica_same_height_is_equivocation(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        left = make("beta", 1, ROOT1, RECORD1, RECEIPT1, zero.checkpoint_id)
        right = make("beta", 1, ROOT2A, RECORD2A, RECEIPT2A, zero.checkpoint_id)
        log = ReplicaEvidenceLog(GENESIS)
        log.observe(zero)
        log.observe(left)
        with self.assertRaises(EquivocationError):
            log.observe(right)
        self.assertEqual(log.observations[-1]["relation"], "EQUIVOCATION")

    def test_tampered_checkpoint_id_fails_closed(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        obj = json.loads(zero.raw)
        obj["checkpoint_id"] = "ff" * 32
        with self.assertRaises(EncodingError):
            decode_checkpoint(canonical_json(obj), verify)

    def test_tampered_signature_fails_closed(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        obj = json.loads(zero.raw)
        obj["signature"] = "00" * 32
        with self.assertRaises(AuthenticationError):
            decode_checkpoint(canonical_json(obj), verify)

    def test_noncanonical_wire_fails_closed(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        obj = json.loads(zero.raw)
        noncanonical = json.dumps(obj, indent=2).encode("ascii")
        with self.assertRaises(EncodingError):
            decode_checkpoint(noncanonical, verify)

    def test_genesis_mismatch_is_rejected(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        log = ReplicaEvidenceLog("dd" * 32)
        with self.assertRaises(SchemaError):
            log.observe(zero)

    def test_height_zero_requires_empty_heads(self) -> None:
        with self.assertRaises(SchemaError):
            checkpoint_payload(
                replica_id="alpha",
                height=0,
                state_root=ROOT0,
                record_hash=RECORD1,
                receipt_head="",
                parent_checkpoint="",
                genesis_sha256=GENESIS,
            )

    def test_fork_evidence_does_not_select_a_winner(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        left = make("beta", 1, ROOT1, RECORD1, RECEIPT1, zero.checkpoint_id)
        right = make("gamma", 1, ROOT2B, RECORD2B, RECEIPT2B, zero.checkpoint_id)
        log = ReplicaEvidenceLog(GENESIS)
        log.observe(zero)
        log.observe(left)
        result = log.observe(right)
        self.assertNotIn("winner", result)
        self.assertNotIn("canonical", result)
        self.assertEqual(result["observation"]["relation"], "FORK_OBSERVED")


if __name__ == "__main__":
    unittest.main()
