from __future__ import annotations

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


def verify(_replica_id: str, _message: bytes, signature: str) -> bool:
    return signature == "valid"


def make(replica_id: str, height: int, state_root: str, record_hash: str, receipt_head: str, parent_history: str):
    payload = checkpoint_payload(
        replica_id=replica_id,
        height=height,
        state_root=state_root,
        record_hash=record_hash,
        receipt_head=receipt_head,
        parent_history=parent_history,
        genesis_sha256=GENESIS,
    )
    return decode_checkpoint(encode_checkpoint(payload, "valid"), verify)


class ReplicationEvidenceTests(unittest.TestCase):
    def test_two_replicas_attesting_same_history_are_agreement_not_fork(self) -> None:
        alpha = make("alpha", 0, ROOT0, "", "", "")
        beta = make("beta", 0, ROOT0, "", "", "")
        self.assertEqual(alpha.history_id, beta.history_id)
        self.assertNotEqual(alpha.checkpoint_id, beta.checkpoint_id)
        log = ReplicaEvidenceLog(GENESIS)
        self.assertEqual(log.observe(alpha)["observation"]["relation"], "GENESIS_HISTORY")
        result = log.observe(beta)
        self.assertEqual(result["observation"]["relation"], "AGREEMENT_ATTESTATION")
        self.assertIsNone(result["fork_proof"])

    def test_exact_duplicate_attestation_is_classified(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        log = ReplicaEvidenceLog(GENESIS)
        log.observe(zero)
        self.assertEqual(log.observe(zero)["observation"]["relation"], "DUPLICATE_ATTESTATION")

    def test_known_parent_history_extension(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        one = make("beta", 1, ROOT1, RECORD1, RECEIPT1, zero.history_id)
        log = ReplicaEvidenceLog(GENESIS)
        log.observe(zero)
        self.assertEqual(log.observe(one)["observation"]["relation"], "EXTENDS_KNOWN_HISTORY")

    def test_out_of_order_history_is_gap(self) -> None:
        one = make("beta", 1, ROOT1, RECORD1, RECEIPT1, "cc" * 32)
        self.assertEqual(ReplicaEvidenceLog(GENESIS).observe(one)["observation"]["relation"], "GAP")

    def test_conflicting_history_siblings_have_order_independent_proof(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        left = make("beta", 1, ROOT1, RECORD1, RECEIPT1, zero.history_id)
        right = make("gamma", 1, ROOT2A, RECORD2A, RECEIPT2A, zero.history_id)
        first = ReplicaEvidenceLog(GENESIS)
        first.observe(zero); first.observe(left)
        proof_a = first.observe(right)["fork_proof"]
        second = ReplicaEvidenceLog(GENESIS)
        second.observe(zero); second.observe(right)
        proof_b = second.observe(left)["fork_proof"]
        self.assertEqual(proof_a, proof_b)
        self.assertEqual(proof_a["reason"], "CONFLICTING_SIBLING_HISTORIES")

    def test_same_replica_same_height_different_history_is_equivocation(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        left = make("beta", 1, ROOT1, RECORD1, RECEIPT1, zero.history_id)
        right = make("beta", 1, ROOT2A, RECORD2A, RECEIPT2A, zero.history_id)
        log = ReplicaEvidenceLog(GENESIS)
        log.observe(zero); log.observe(left)
        with self.assertRaises(EquivocationError):
            log.observe(right)
        self.assertEqual(log.observations[-1]["relation"], "EQUIVOCATION")

    def test_tampered_history_id_fails_closed(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        obj = json.loads(zero.raw)
        obj["history_id"] = "ff" * 32
        with self.assertRaises(EncodingError):
            decode_checkpoint(canonical_json(obj), verify)

    def test_tampered_checkpoint_id_fails_closed(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        obj = json.loads(zero.raw)
        obj["checkpoint_id"] = "ff" * 32
        with self.assertRaises(EncodingError):
            decode_checkpoint(canonical_json(obj), verify)

    def test_bad_signature_fails_closed(self) -> None:
        payload = checkpoint_payload(replica_id="alpha", height=0, state_root=ROOT0, record_hash="", receipt_head="", parent_history="", genesis_sha256=GENESIS)
        with self.assertRaises(AuthenticationError):
            decode_checkpoint(encode_checkpoint(payload, "bad"), verify)

    def test_noncanonical_wire_fails_closed(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        with self.assertRaises(EncodingError):
            decode_checkpoint(json.dumps(json.loads(zero.raw), indent=2).encode("ascii"), verify)

    def test_wrong_genesis_rejected(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        with self.assertRaises(SchemaError):
            ReplicaEvidenceLog("dd" * 32).observe(zero)

    def test_no_winner_or_canonical_output(self) -> None:
        zero = make("alpha", 0, ROOT0, "", "", "")
        left = make("beta", 1, ROOT1, RECORD1, RECEIPT1, zero.history_id)
        right = make("gamma", 1, ROOT2B, RECORD2B, RECEIPT2B, zero.history_id)
        log = ReplicaEvidenceLog(GENESIS)
        log.observe(zero); log.observe(left)
        result = log.observe(right)
        self.assertNotIn("winner", result)
        self.assertNotIn("canonical", result)
        self.assertEqual(result["observation"]["relation"], "FORK_OBSERVED")


if __name__ == "__main__":
    unittest.main()
