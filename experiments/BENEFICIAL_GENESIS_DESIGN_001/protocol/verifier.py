"""Reference claim verifier for Beneficial Genesis synthetic receipts.

Fail-closed: every mandatory predicate must hold. Rejection codes are stable
strings defined in constants.REJECTION_CODES.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .allocation import AllocationError, allocate_proportional, assert_supply_invariant
from .constants import (
    DEFAULT_MIN_CONFIRMATIONS,
    DEFAULT_SOURCE_CHAIN,
    PROTOCOL_VERSION,
    SYNTH_PQ_ALG,
)
from .crypto_synth import pq_message_for_claim, pq_verify, source_verify
from .merkle import confirmations, header_hash, txid_from_tx, verify_merkle_proof
from .nullifier import NullifierSet, compute_nullifier
from .objects import donation_commitment_hex, validate_charity_set


@dataclass
class VerificationResult:
    ok: bool
    code: str
    detail: str = ""
    nullifier_hex: str | None = None
    eligible_sats: int | None = None
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "code": self.code,
            "detail": self.detail,
            "eligible_sats": self.eligible_sats,
            "notes": list(self.notes),
            "nullifier_hex": self.nullifier_hex,
            "ok": self.ok,
        }


class ClaimVerifier:
    """Bounded synthetic verifier.

    Parameters
    ----------
    charity_set : CharitySetCommitment object
    epoch : MigrationEpochClose object
    headers_by_hash : map header_hash_hex -> header objects forming ancestry
    tip_height / tip_hash : accepted source tip under the bounded model
    nullifiers : optional shared NullifierSet
    """

    def __init__(
        self,
        *,
        charity_set: dict[str, Any],
        epoch: dict[str, Any],
        headers_by_hash: dict[str, dict[str, Any]],
        tip_height: int,
        tip_hash_hex: str,
        nullifiers: NullifierSet | None = None,
        supported_source_chain: str = DEFAULT_SOURCE_CHAIN,
        new_ledger_chain_id: str,
    ) -> None:
        self.charity_set = validate_charity_set(charity_set)
        self.epoch = self._validate_epoch(epoch)
        self.headers_by_hash = headers_by_hash
        self.tip_hash_hex = tip_hash_hex
        self.tip_height = self._validate_checkpoint(tip_height)
        self.nullifiers = nullifiers or NullifierSet()
        self.supported_source_chain = supported_source_chain
        self.new_ledger_chain_id = new_ledger_chain_id
        self._charity_index = {e["charity_id"]: e for e in self.charity_set["entries"]}

    @staticmethod
    def _validate_epoch(epoch: object) -> dict[str, Any]:
        if not isinstance(epoch, dict) or type(epoch.get("closed")) is not bool:
            raise ValueError("MALFORMED_EPOCH")
        for name in ("last_clean_source_height", "min_confirmations"):
            if type(epoch.get(name)) is not int or epoch[name] < 0:
                raise ValueError("MALFORMED_EPOCH")
        if not isinstance(epoch.get("epoch_id"), str) or not epoch["epoch_id"]:
            raise ValueError("MALFORMED_EPOCH")
        h = epoch.get("last_clean_source_header_hash_hex")
        if not isinstance(h, str) or len(h) != 64 or h != h.lower():
            raise ValueError("MALFORMED_EPOCH")
        return epoch

    def _validate_checkpoint(self, supplied_tip_height: int) -> int:
        if not isinstance(self.headers_by_hash, dict) or self.tip_hash_hex not in self.headers_by_hash:
            raise ValueError("HEADER_ANCESTRY_INVALID")
        current = self.tip_hash_hex
        seen: set[str] = set()
        tip_height: int | None = None
        while current in self.headers_by_hash:
            if current in seen:
                raise ValueError("HEADER_ANCESTRY_INVALID")
            seen.add(current)
            header = self.headers_by_hash[current]
            if not isinstance(header, dict) or header.get("header_hash_hex") != current:
                raise ValueError("HEADER_ANCESTRY_INVALID")
            required = ("bits", "height", "merkle_root_hex", "prev_hash_hex", "time")
            if any(k not in header for k in required) or type(header["height"]) is not int:
                raise ValueError("HEADER_ANCESTRY_INVALID")
            if header_hash({k: header[k] for k in required}) != current:
                raise ValueError("HEADER_ANCESTRY_INVALID")
            if tip_height is None:
                tip_height = header["height"]
            prev = header["prev_hash_hex"]
            if prev in self.headers_by_hash and self.headers_by_hash[prev].get("height") != header["height"] - 1:
                raise ValueError("HEADER_ANCESTRY_INVALID")
            current = prev
        if tip_height is None or type(supplied_tip_height) is not int or supplied_tip_height != tip_height:
            raise ValueError("CHECKPOINT_MISMATCH")
        if (self.epoch["last_clean_source_height"] != tip_height or
                self.epoch["last_clean_source_header_hash_hex"] != self.tip_hash_hex):
            raise ValueError("CHECKPOINT_MISMATCH")
        return tip_height

    def _fail(self, code: str, detail: str = "", **kwargs: Any) -> VerificationResult:
        return VerificationResult(ok=False, code=code, detail=detail, **kwargs)

    def verify_claim(self, claim: dict[str, Any], *, consume: bool = True) -> VerificationResult:
        """Verify and admit a new claim; a trusted closed epoch always rejects."""
        if self.epoch["closed"]:
            return self._fail("EPOCH_CLOSED")
        return self._verify_claim_historical(claim, consume=consume)

    def verify_historical_claim(self, claim: dict[str, Any]) -> VerificationResult:
        """Replay verification that never consumes/admit a nullifier."""
        return self._verify_claim_historical(claim, consume=False)

    def _verify_claim_historical(self, claim: dict[str, Any], *, consume: bool) -> VerificationResult:
        notes: list[str] = []

        # --- structural ---
        if not isinstance(claim, dict):
            return self._fail("TYPE_ERROR", "claim not object")
        version = claim.get("version")
        if version != PROTOCOL_VERSION:
            return self._fail("UNSUPPORTED_CLAIM_VERSION", str(version))

        source_chain = claim.get("source_chain")
        if source_chain != self.supported_source_chain:
            return self._fail("UNSUPPORTED_SOURCE_CHAIN", str(source_chain))

        if claim.get("new_ledger_chain_id") != self.new_ledger_chain_id:
            return self._fail("CROSS_CHAIN_REPLAY", "new_ledger_chain_id mismatch")

        if claim.get("epoch_id") != self.epoch.get("epoch_id"):
            return self._fail("CROSS_EPOCH_REPLAY", "epoch_id mismatch")

        # Required fields
        required = [
            "charity_id",
            "donation_txid_hex",
            "donation_vout",
            "amount_sats",
            "pq_destination_public_key_hex",
            "pq_signature_hex",
            "commitment_nonce_hex",
            "commitment_version",
            "inclusion_proof",
            "source_authorization",
            "transaction",
        ]
        for key in required:
            if key not in claim:
                return self._fail("MISSING_FIELD", key)

        try:
            charity_id = claim["charity_id"]
            txid = claim["donation_txid_hex"]
            vout = claim["donation_vout"]
            amount = claim["amount_sats"]
            if type(vout) is not int or vout < 0:
                return self._fail("TYPE_ERROR", "donation_vout")
            if type(amount) is not int:
                return self._fail("TYPE_ERROR", "amount_sats")
            if amount <= 0:
                return self._fail("AMOUNT_NOT_POSITIVE")
        except Exception as exc:  # noqa: BLE001
            return self._fail("TYPE_ERROR", str(exc))

        # Address-string path forbidden
        if "charity_address_string" in claim:
            return self._fail("ADDRESS_STRING_AMBIGUITY")

        # --- transaction identity / malleability ---
        tx = claim["transaction"]
        if not self._valid_transaction(tx):
            return self._fail("UNSUPPORTED_TX_FORM")

        computed_txid = txid_from_tx(tx)
        if computed_txid != txid:
            return self._fail("TX_MALLEABILITY_REENCODING", f"{computed_txid} != {txid}")

        outputs = tx["outputs"]
        if not isinstance(outputs, list) or vout >= len(outputs):
            return self._fail("WRONG_OUTPUT_INDEX")
        out = outputs[vout]
        if not isinstance(out, dict) or "script_pubkey_hex" not in out or "value_sats" not in out:
            return self._fail("UNSUPPORTED_TX_FORM")

        if type(out["value_sats"]) is not int or out["value_sats"] != amount:
            return self._fail("AMOUNT_MISMATCH")

        script = out["script_pubkey_hex"]
        if not self._supported_script(script):
            return self._fail("UNSUPPORTED_SCRIPT_FORM")

        # --- charity binding (exact script bytes) ---
        entry = self._charity_index.get(charity_id)
        if entry is None:
            # Wrong charity id even if script happens to match another entry.
            # Also detect script-only match for clearer adversarial codes.
            for e in self._charity_index.values():
                if e["script_pubkey_hex"] == script:
                    return self._fail("CHARITY_ID_UNKNOWN", "script matched different id")
            return self._fail("CHARITY_ID_UNKNOWN")

        if script != entry["script_pubkey_hex"]:
            return self._fail("CHARITY_SCRIPT_MISMATCH")

        # --- inclusion proof ---
        proof = claim["inclusion_proof"]
        if not isinstance(proof, dict):
            return self._fail("INCLUSION_PROOF_INVALID", "not object")
        block_hash = proof.get("block_header_hash_hex")
        block_height = proof.get("block_height")
        if block_hash not in self.headers_by_hash:
            return self._fail("HEADER_ANCESTRY_INVALID", "unknown header")
        header = self.headers_by_hash[block_hash]
        if header.get("height") != block_height:
            return self._fail("HEADER_ANCESTRY_INVALID", "height mismatch")

        # Ancestry walk to tip (bounded).
        if not self._header_in_ancestry(block_hash):
            return self._fail("HEADER_ANCESTRY_INVALID", "not ancestor of tip")

        if header_hash({k: header[k] for k in ("bits", "height", "merkle_root_hex", "prev_hash_hex", "time") if k in header or k in ("bits", "time")}) != block_hash:
            # Recompute carefully with required fields.
            rebuilt = {
                "bits": header.get("bits", 0),
                "height": header["height"],
                "merkle_root_hex": header["merkle_root_hex"],
                "prev_hash_hex": header["prev_hash_hex"],
                "time": header.get("time", 0),
            }
            if header_hash(rebuilt) != block_hash:
                return self._fail("HEADER_ANCESTRY_INVALID", "header hash mismatch")

        if not verify_merkle_proof(
            txid,
            header["merkle_root_hex"],
            proof.get("merkle_branch_hex", []),
            proof.get("merkle_index", -1),
        ):
            return self._fail("INCLUSION_PROOF_INVALID")

        # Confirmations & cutoff
        min_conf = int(self.epoch.get("min_confirmations", DEFAULT_MIN_CONFIRMATIONS))
        conf = confirmations(int(block_height), self.tip_height)
        if conf < min_conf:
            return self._fail("INSUFFICIENT_CONFIRMATIONS", f"{conf}<{min_conf}")

        last_clean_h = int(self.epoch["last_clean_source_height"])
        if int(block_height) > last_clean_h:
            return self._fail("INCLUSION_AFTER_CUTOFF")

        # Charity validity window
        if not (entry["valid_from_height"] <= int(block_height) <= entry["valid_until_height"]):
            return self._fail("CHARITY_INACTIVE")

        # Quantum-compromise cutoff: classical source auth after cutoff rejected.
        qcut = self.epoch.get("quantum_compromise_cutoff_height")
        if qcut is not None and int(block_height) > int(qcut):
            if claim.get("source_authorization", {}).get("alg") == "SYNTHETIC_SOURCE_HMAC_v1":
                return self._fail("QUANTUM_COMPROMISE_CUTOFF")

        # Source authorization (cryptographic control, not legal ownership)
        auth_err = source_verify(claim["source_authorization"], txid)
        if auth_err:
            return self._fail(auth_err)
        if claim.get("source_authorization", {}).get("control_label") == "CRYPTOGRAPHIC_CONTROL_SYNTHETIC":
            notes.append(
                "Demonstrates synthetic cryptographic control only; not legal ownership."
            )

        # --- commitment binding ---
        # The commitment must be an exact OP_RETURN push32 output in this transaction.
        commitment_hex = donation_commitment_hex(
            new_ledger_chain_id=claim["new_ledger_chain_id"],
            epoch_id=claim["epoch_id"],
            charity_id=charity_id,
            donation_vout=vout,
            amount_sats=amount,
            pq_destination_public_key_hex=claim["pq_destination_public_key_hex"],
            nonce_hex=claim["commitment_nonce_hex"],
            commitment_version=int(claim["commitment_version"]),
        )

        # Commitment must appear in the same transaction as an OP_RETURN payload
        # or match claim.declared_commitment_hex when testing binding failures.
        declared = claim.get("declared_commitment_hex", commitment_hex)
        if declared != commitment_hex:
            return self._fail("COMMITMENT_INVALID", "declared mismatch")

        if not self._tx_contains_commitment(tx, commitment_hex):
            return self._fail("COMMITMENT_INVALID", "commitment not in exact transaction carrier")

        # --- nullifier ---
        nullifier = compute_nullifier(
            source_chain=source_chain,
            donation_txid_hex=txid,
            donation_vout=vout,
        )
        if claim.get("presented_nullifier_hex") and claim["presented_nullifier_hex"] != nullifier:
            return self._fail("NULLIFIER_COLLISION", "presented nullifier mismatch")

        # --- PQ destination control ---
        if claim.get("pq_alg") and claim.get("pq_alg") != SYNTH_PQ_ALG:
            return self._fail("PQ_ALGORITHM_UNSUPPORTED")

        msg = pq_message_for_claim(
            new_ledger_chain_id=claim["new_ledger_chain_id"],
            epoch_id=claim["epoch_id"],
            charity_id=charity_id,
            donation_txid_hex=txid,
            donation_vout=vout,
            amount_sats=amount,
            commitment_hex=commitment_hex,
            nullifier_hex=nullifier,
        )
        domain = claim.get("pq_sig_domain_bytes")
        from .constants import DOMAIN_PQ_SIG

        use_domain = DOMAIN_PQ_SIG if domain is None else bytes.fromhex(domain)
        pq_err = pq_verify(
            claim["pq_destination_public_key_hex"],
            msg,
            claim["pq_signature_hex"],
            domain=use_domain,
            expected_public_key_hex=claim.get("expected_pq_key_hex"),
        )
        if pq_err:
            return self._fail(pq_err)

        # Front-run / copy: commitment binds a different PQ key than signer.
        # Handled by commitment_hex including pq key + signature check on that key.

        if consume:
            nerr = self.nullifiers.consume(nullifier)
            if nerr:
                return self._fail(nerr, nullifier_hex=nullifier)

        return VerificationResult(
            ok=True,
            code="OK",
            nullifier_hex=nullifier,
            eligible_sats=amount,
            notes=notes,
        )

    def _header_in_ancestry(self, block_hash: str) -> bool:
        """Walk prev links from tip to genesis-bound window."""

        seen = 0
        current = self.tip_hash_hex
        while current and seen < 10_000:
            if current == block_hash:
                return True
            header = self.headers_by_hash.get(current)
            if header is None:
                return False
            current = header.get("prev_hash_hex")
            seen += 1
        return False

    @staticmethod
    def _tx_contains_commitment(tx: dict[str, Any], commitment_hex: str) -> bool:
        needle = "6a20" + commitment_hex
        for out in tx.get("outputs", []):
            spk = out.get("script_pubkey_hex", "")
            if spk == needle:
                return True
        return False

    @staticmethod
    def _supported_script(script: object) -> bool:
        if not isinstance(script, str) or script != script.lower():
            return False
        try:
            bytes.fromhex(script)
        except ValueError:
            return False
        return (len(script) == 44 and script.startswith("0014")) or (
            len(script) == 68 and script.startswith("6a20")
        )

    @classmethod
    def _valid_transaction(cls, tx: object) -> bool:
        if not isinstance(tx, dict) or set(tx) not in ({"version", "locktime", "inputs", "outputs", "label"},
                                                      {"version", "locktime", "inputs", "outputs"}):
            return False
        if type(tx["version"]) is not int or type(tx["locktime"]) is not int:
            return False
        if not isinstance(tx["inputs"], list) or not tx["inputs"] or not isinstance(tx["outputs"], list) or not tx["outputs"]:
            return False
        for i in tx["inputs"]:
            if not isinstance(i, dict) or set(i) != {"prev_txid_hex", "prev_vout", "script_sig_hex", "sequence"}:
                return False
            if type(i["prev_vout"]) is not int or i["prev_vout"] < 0 or type(i["sequence"]) is not int:
                return False
            try:
                if len(bytes.fromhex(i["prev_txid_hex"])) != 32 or not isinstance(i["script_sig_hex"], str):
                    return False
                bytes.fromhex(i["script_sig_hex"])
            except (TypeError, ValueError):
                return False
        for out in tx["outputs"]:
            if not isinstance(out, dict) or set(out) != {"script_pubkey_hex", "value_sats"}:
                return False
            if type(out["value_sats"]) is not int or out["value_sats"] < 0 or not cls._supported_script(out["script_pubkey_hex"]):
                return False
        return True

    def close_and_allocate(
        self,
        admitted: list[VerificationResult],
        *,
        fixed_bitcoin_genesis_pool: int,
        epoch_id: str,
    ) -> dict[str, Any]:
        if not self.epoch["closed"]:
            raise AllocationError("EPOCH_NOT_CLOSED")
        if epoch_id != self.epoch["epoch_id"]:
            raise AllocationError("TYPE_ERROR", "epoch_id mismatch")
        rows = []
        for r in admitted:
            if not r.ok or r.nullifier_hex is None or r.eligible_sats is None:
                raise AllocationError("TYPE_ERROR", "non-admitted row")
            rows.append((r.nullifier_hex, r.eligible_sats))
        record = allocate_proportional(
            fixed_bitcoin_genesis_pool=fixed_bitcoin_genesis_pool,
            eligible_by_nullifier=rows,
            epoch_id=epoch_id,
        )
        assert_supply_invariant(record)
        return record
