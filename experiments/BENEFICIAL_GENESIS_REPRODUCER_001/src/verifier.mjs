/**
 * Clean-room Beneficial Genesis claim verifier (Node.js).
 * Built from TECHNICAL_DESIGN.md, schemas, fixtures, and recovered domain tags.
 */

import {
  DEFAULT_MIN_CONFIRMATIONS,
  DEFAULT_SOURCE_CHAIN,
  DOMAIN_PQ_SIG,
  PROTOCOL_VERSION,
  SYNTH_PQ_ALG,
} from "./constants.mjs";
import {
  donationCommitmentHex,
  computeNullifier,
  pqMessageForClaim,
  pqVerify,
  sourceVerify,
} from "./crypto.mjs";
import { requireHex } from "./encoding.mjs";
import {
  confirmations,
  headerHash,
  txidFromTx,
  verifyMerkleProof,
} from "./merkle.mjs";
import { NullifierSet } from "./nullifier.mjs";
import { validateCharitySet } from "./objects.mjs";
import { AllocationError, allocateProportional, assertSupplyInvariant } from "./allocation.mjs";

export class VerificationResult {
  constructor({ ok, code, detail = "", nullifier_hex = null, eligible_sats = null, notes = [] }) {
    this.ok = ok;
    this.code = code;
    this.detail = detail;
    this.nullifier_hex = nullifier_hex;
    this.eligible_sats = eligible_sats;
    this.notes = notes;
  }

  toDict() {
    return {
      code: this.code,
      detail: this.detail,
      eligible_sats: this.eligible_sats,
      notes: [...this.notes],
      nullifier_hex: this.nullifier_hex,
      ok: this.ok,
    };
  }
}

export class ClaimVerifier {
  constructor({
    charity_set,
    epoch,
    headers_by_hash,
    tip_height,
    tip_hash_hex,
    nullifiers = null,
    supported_source_chain = DEFAULT_SOURCE_CHAIN,
    new_ledger_chain_id,
  }) {
    this.charity_set = validateCharitySet(charity_set);
    this.epoch = ClaimVerifier._validateEpoch(epoch);
    this.headers_by_hash = headers_by_hash;
    this.tip_hash_hex = tip_hash_hex;
    this.tip_height = this._validateCheckpoint(tip_height);
    this.nullifiers = nullifiers || new NullifierSet();
    this.supported_source_chain = supported_source_chain;
    this.new_ledger_chain_id = new_ledger_chain_id;
    this._charity_index = Object.fromEntries(
      this.charity_set.entries.map((e) => [e.charity_id, e]),
    );
  }

  static _validateEpoch(epoch) {
    if (!epoch || typeof epoch !== "object" || typeof epoch.closed !== "boolean") {
      throw new Error("MALFORMED_EPOCH");
    }
    for (const name of ["last_clean_source_height", "min_confirmations"]) {
      if (typeof epoch[name] !== "number" || !Number.isInteger(epoch[name]) || epoch[name] < 0) {
        throw new Error("MALFORMED_EPOCH");
      }
    }
    if (typeof epoch.epoch_id !== "string" || !epoch.epoch_id) {
      throw new Error("MALFORMED_EPOCH");
    }
    const h = epoch.last_clean_source_header_hash_hex;
    if (typeof h !== "string" || h.length !== 64 || h !== h.toLowerCase()) {
      throw new Error("MALFORMED_EPOCH");
    }
    // Reject bool/non-int quantum cutoff if present
    if (
      "quantum_compromise_cutoff_height" in epoch &&
      epoch.quantum_compromise_cutoff_height != null
    ) {
      const q = epoch.quantum_compromise_cutoff_height;
      if (typeof q !== "number" || !Number.isInteger(q) || q < 0) {
        throw new Error("MALFORMED_EPOCH");
      }
    }
    return epoch;
  }

  _validateCheckpoint(suppliedTipHeight) {
    if (
      !this.headers_by_hash ||
      typeof this.headers_by_hash !== "object" ||
      !(this.tip_hash_hex in this.headers_by_hash)
    ) {
      throw new Error("HEADER_ANCESTRY_INVALID");
    }
    let current = this.tip_hash_hex;
    const seen = new Set();
    let tipHeight = null;
    while (current in this.headers_by_hash) {
      if (seen.has(current)) throw new Error("HEADER_ANCESTRY_INVALID");
      seen.add(current);
      const header = this.headers_by_hash[current];
      if (!header || typeof header !== "object" || header.header_hash_hex !== current) {
        throw new Error("HEADER_ANCESTRY_INVALID");
      }
      const required = ["bits", "height", "merkle_root_hex", "prev_hash_hex", "time"];
      if (required.some((k) => !(k in header)) || typeof header.height !== "number" ||
          !Number.isInteger(header.height)) {
        throw new Error("HEADER_ANCESTRY_INVALID");
      }
      const fields = Object.fromEntries(required.map((k) => [k, header[k]]));
      if (headerHash(fields) !== current) throw new Error("HEADER_ANCESTRY_INVALID");
      if (tipHeight === null) tipHeight = header.height;
      const prev = header.prev_hash_hex;
      if (
        prev in this.headers_by_hash &&
        this.headers_by_hash[prev].height !== header.height - 1
      ) {
        throw new Error("HEADER_ANCESTRY_INVALID");
      }
      current = prev;
    }
    if (
      tipHeight === null ||
      typeof suppliedTipHeight !== "number" ||
      !Number.isInteger(suppliedTipHeight) ||
      suppliedTipHeight !== tipHeight
    ) {
      throw new Error("CHECKPOINT_MISMATCH");
    }
    if (
      this.epoch.last_clean_source_height !== tipHeight ||
      this.epoch.last_clean_source_header_hash_hex !== this.tip_hash_hex
    ) {
      throw new Error("CHECKPOINT_MISMATCH");
    }
    return tipHeight;
  }

  _fail(code, detail = "", extra = {}) {
    return new VerificationResult({ ok: false, code, detail, ...extra });
  }

  verifyClaim(claim, { consume = true } = {}) {
    if (this.epoch.closed) return this._fail("EPOCH_CLOSED");
    return this._verifyClaimHistorical(claim, { consume });
  }

  verifyHistoricalClaim(claim) {
    return this._verifyClaimHistorical(claim, { consume: false });
  }

  _verifyClaimHistorical(claim, { consume }) {
    const notes = [];

    if (!claim || typeof claim !== "object") {
      return this._fail("TYPE_ERROR", "claim not object");
    }
    if (claim.version !== PROTOCOL_VERSION) {
      return this._fail("UNSUPPORTED_CLAIM_VERSION", String(claim.version));
    }

    const sourceChain = claim.source_chain;
    if (sourceChain !== this.supported_source_chain) {
      return this._fail("UNSUPPORTED_SOURCE_CHAIN", String(sourceChain));
    }
    if (claim.new_ledger_chain_id !== this.new_ledger_chain_id) {
      return this._fail("CROSS_CHAIN_REPLAY", "new_ledger_chain_id mismatch");
    }
    if (claim.epoch_id !== this.epoch.epoch_id) {
      return this._fail("CROSS_EPOCH_REPLAY", "epoch_id mismatch");
    }

    // Optional claim-supplied checkpoint checks (design residual / documentary paths)
    if (claim.claimed_checkpoint) {
      const cp = claim.claimed_checkpoint;
      if (
        typeof cp !== "object" ||
        typeof cp.height !== "number" ||
        typeof cp.header_hash_hex !== "string"
      ) {
        return this._fail("CONFLICTING_CHECKPOINT", "malformed claimed_checkpoint");
      }
      if (cp.header_hash_hex !== this.tip_hash_hex && !(cp.header_hash_hex in this.headers_by_hash)) {
        return this._fail("CONFLICTING_CHECKPOINT");
      }
      if (
        cp.height < this.epoch.last_clean_source_height &&
        cp.header_hash_hex !== this.tip_hash_hex
      ) {
        // Stale relative to last-clean tip policy
        if (cp.height < this.tip_height && cp.header_hash_hex !== this.tip_hash_hex) {
          return this._fail("STALE_CHECKPOINT");
        }
      }
      if (cp.header_hash_hex !== this.tip_hash_hex && cp.height === this.tip_height) {
        return this._fail("CONFLICTING_CHECKPOINT");
      }
      if (
        cp.header_hash_hex !== this.tip_hash_hex &&
        cp.height !== this.tip_height &&
        !(cp.header_hash_hex in this.headers_by_hash)
      ) {
        return this._fail("CONFLICTING_CHECKPOINT");
      }
      // Explicit conflicting hash not in ancestry
      if (!(cp.header_hash_hex in this.headers_by_hash)) {
        return this._fail("CONFLICTING_CHECKPOINT");
      }
      if (cp.height < this.tip_height && cp.header_hash_hex !== this.tip_hash_hex) {
        // present in chain but not tip → stale if treated as claimed tip
        return this._fail("STALE_CHECKPOINT");
      }
    }

    const required = [
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
    ];
    for (const key of required) {
      if (!(key in claim)) return this._fail("MISSING_FIELD", key);
    }

    let charityId;
    let txid;
    let vout;
    let amount;
    try {
      charityId = claim.charity_id;
      txid = claim.donation_txid_hex;
      vout = claim.donation_vout;
      amount = claim.amount_sats;
      if (typeof vout !== "number" || !Number.isInteger(vout) || vout < 0) {
        return this._fail("TYPE_ERROR", "donation_vout");
      }
      if (typeof amount === "boolean" || typeof amount !== "number" || !Number.isInteger(amount)) {
        return this._fail("TYPE_ERROR", "amount_sats");
      }
      if (amount <= 0) return this._fail("AMOUNT_NOT_POSITIVE");
    } catch (exc) {
      return this._fail("TYPE_ERROR", String(exc));
    }

    // commitment_version must be strict integer (reject bool / string coercion traps)
    if (
      typeof claim.commitment_version === "boolean" ||
      typeof claim.commitment_version !== "number" ||
      !Number.isInteger(claim.commitment_version)
    ) {
      return this._fail("TYPE_ERROR", "commitment_version");
    }
    if (claim.commitment_version < 0 || claim.commitment_version > 0xffffffff) {
      return this._fail("TYPE_ERROR", "commitment_version range");
    }

    if ("charity_address_string" in claim) {
      return this._fail("ADDRESS_STRING_AMBIGUITY");
    }

    const tx = claim.transaction;
    if (!ClaimVerifier._validTransaction(tx)) {
      return this._fail("UNSUPPORTED_TX_FORM");
    }

    const computedTxid = txidFromTx(tx);
    if (computedTxid !== txid) {
      return this._fail("TX_MALLEABILITY_REENCODING", `${computedTxid} != ${txid}`);
    }

    const outputs = tx.outputs;
    if (!Array.isArray(outputs) || vout >= outputs.length) {
      return this._fail("WRONG_OUTPUT_INDEX");
    }
    const out = outputs[vout];
    if (!out || typeof out !== "object" || !("script_pubkey_hex" in out) || !("value_sats" in out)) {
      return this._fail("UNSUPPORTED_TX_FORM");
    }
    if (typeof out.value_sats !== "number" || !Number.isInteger(out.value_sats) || out.value_sats !== amount) {
      return this._fail("AMOUNT_MISMATCH");
    }

    const script = out.script_pubkey_hex;
    if (!ClaimVerifier._supportedScript(script)) {
      return this._fail("UNSUPPORTED_SCRIPT_FORM");
    }

    const entry = this._charity_index[charityId];
    if (!entry) {
      for (const e of Object.values(this._charity_index)) {
        if (e.script_pubkey_hex === script) {
          return this._fail("CHARITY_ID_UNKNOWN", "script matched different id");
        }
      }
      return this._fail("CHARITY_ID_UNKNOWN");
    }
    if (script !== entry.script_pubkey_hex) {
      return this._fail("CHARITY_SCRIPT_MISMATCH");
    }

    const proof = claim.inclusion_proof;
    if (!proof || typeof proof !== "object") {
      return this._fail("INCLUSION_PROOF_INVALID", "not object");
    }
    const blockHash = proof.block_header_hash_hex;
    const blockHeight = proof.block_height;
    if (!(blockHash in this.headers_by_hash)) {
      return this._fail("HEADER_ANCESTRY_INVALID", "unknown header");
    }
    const header = this.headers_by_hash[blockHash];
    if (header.height !== blockHeight) {
      return this._fail("HEADER_ANCESTRY_INVALID", "height mismatch");
    }
    if (!this._headerInAncestry(blockHash)) {
      return this._fail("HEADER_ANCESTRY_INVALID", "not ancestor of tip");
    }
    const rebuilt = {
      bits: header.bits ?? 0,
      height: header.height,
      merkle_root_hex: header.merkle_root_hex,
      prev_hash_hex: header.prev_hash_hex,
      time: header.time ?? 0,
    };
    if (headerHash(rebuilt) !== blockHash) {
      return this._fail("HEADER_ANCESTRY_INVALID", "header hash mismatch");
    }

    if (
      !verifyMerkleProof(
        txid,
        header.merkle_root_hex,
        proof.merkle_branch_hex ?? [],
        proof.merkle_index ?? -1,
      )
    ) {
      return this._fail("INCLUSION_PROOF_INVALID");
    }

    const minConf = Number(this.epoch.min_confirmations ?? DEFAULT_MIN_CONFIRMATIONS);
    const conf = confirmations(Number(blockHeight), this.tip_height);
    if (conf < minConf) {
      return this._fail("INSUFFICIENT_CONFIRMATIONS", `${conf}<${minConf}`);
    }

    const lastCleanH = Number(this.epoch.last_clean_source_height);
    if (Number(blockHeight) > lastCleanH) {
      return this._fail("INCLUSION_AFTER_CUTOFF");
    }

    if (!(entry.valid_from_height <= Number(blockHeight) && Number(blockHeight) <= entry.valid_until_height)) {
      return this._fail("CHARITY_INACTIVE");
    }

    const qcut = this.epoch.quantum_compromise_cutoff_height;
    if (qcut != null && Number(blockHeight) > Number(qcut)) {
      if (claim.source_authorization?.alg === "SYNTHETIC_SOURCE_HMAC_v1") {
        return this._fail("QUANTUM_COMPROMISE_CUTOFF");
      }
    }

    const authErr = sourceVerify(claim.source_authorization, txid);
    if (authErr) return this._fail(authErr);
    if (claim.source_authorization?.control_label === "CRYPTOGRAPHIC_CONTROL_SYNTHETIC") {
      notes.push(
        "Demonstrates synthetic cryptographic control only; not legal ownership.",
      );
    }

    let commitmentHex;
    try {
      commitmentHex = donationCommitmentHex({
        new_ledger_chain_id: claim.new_ledger_chain_id,
        epoch_id: claim.epoch_id,
        charity_id: charityId,
        donation_vout: vout,
        amount_sats: amount,
        pq_destination_public_key_hex: claim.pq_destination_public_key_hex,
        nonce_hex: claim.commitment_nonce_hex,
        commitment_version: claim.commitment_version,
      });
    } catch (e) {
      return this._fail("TYPE_ERROR", String(e.message || e));
    }

    const declared = claim.declared_commitment_hex ?? commitmentHex;
    if (declared !== commitmentHex) {
      return this._fail("COMMITMENT_INVALID", "declared mismatch");
    }
    if (!ClaimVerifier._txContainsCommitment(tx, commitmentHex)) {
      return this._fail("COMMITMENT_INVALID", "commitment not in exact transaction carrier");
    }

    // Multi-output donations may embed several distinct OP_RETURN commitments.
    // Only the commitment for this claim's (vout, fields) must be present exactly.
    // Hostile tests cover malformed carriers separately.

    let nullifier;
    try {
      nullifier = computeNullifier({
        source_chain: sourceChain,
        donation_txid_hex: txid,
        donation_vout: vout,
      });
    } catch (e) {
      return this._fail("TYPE_ERROR", String(e.message || e));
    }

    // Nullifier field disagreement: claim.nullifier_hex if present must match computed
    if ("nullifier_hex" in claim && claim.nullifier_hex != null && claim.nullifier_hex !== nullifier) {
      return this._fail("NULLIFIER_COLLISION", "nullifier_hex field disagreement");
    }
    if (claim.presented_nullifier_hex && claim.presented_nullifier_hex !== nullifier) {
      return this._fail("NULLIFIER_COLLISION", "presented nullifier mismatch");
    }

    if (claim.pq_alg && claim.pq_alg !== SYNTH_PQ_ALG) {
      return this._fail("PQ_ALGORITHM_UNSUPPORTED");
    }

    const msg = pqMessageForClaim({
      new_ledger_chain_id: claim.new_ledger_chain_id,
      epoch_id: claim.epoch_id,
      charity_id: charityId,
      donation_txid_hex: txid,
      donation_vout: vout,
      amount_sats: amount,
      commitment_hex: commitmentHex,
      nullifier_hex: nullifier,
    });

    let useDomain = DOMAIN_PQ_SIG;
    if (claim.pq_sig_domain_bytes != null) {
      try {
        useDomain = requireHex("pq_sig_domain_bytes", claim.pq_sig_domain_bytes);
      } catch {
        return this._fail("PQ_DOMAIN_INVALID", "malformed pq_sig_domain_bytes");
      }
    }

    const pqErr = pqVerify(claim.pq_destination_public_key_hex, msg, claim.pq_signature_hex, {
      domain: useDomain,
      expectedPublicKeyHex: claim.expected_pq_key_hex ?? null,
    });
    if (pqErr) return this._fail(pqErr);

    if (consume) {
      const nerr = this.nullifiers.consume(nullifier);
      if (nerr) return this._fail(nerr, "", { nullifier_hex: nullifier });
    }

    return new VerificationResult({
      ok: true,
      code: "OK",
      nullifier_hex: nullifier,
      eligible_sats: amount,
      notes,
    });
  }

  _headerInAncestry(blockHash) {
    let seen = 0;
    let current = this.tip_hash_hex;
    while (current && seen < 10000) {
      if (current === blockHash) return true;
      const header = this.headers_by_hash[current];
      if (!header) return false;
      current = header.prev_hash_hex;
      seen += 1;
    }
    return false;
  }

  static _txContainsCommitment(tx, commitmentHex) {
    const needle = "6a20" + commitmentHex;
    for (const out of tx.outputs || []) {
      if (out.script_pubkey_hex === needle) return true;
    }
    return false;
  }

  static _supportedScript(script) {
    if (typeof script !== "string" || script !== script.toLowerCase()) return false;
    try {
      Buffer.from(script, "hex");
    } catch {
      return false;
    }
    if (!/^[0-9a-f]+$/.test(script)) return false;
    return (
      (script.length === 44 && script.startsWith("0014")) ||
      (script.length === 68 && script.startsWith("6a20"))
    );
  }

  static _validTransaction(tx) {
    if (!tx || typeof tx !== "object") return false;
    const keys = new Set(Object.keys(tx));
    const okSets = [
      new Set(["version", "locktime", "inputs", "outputs", "label"]),
      new Set(["version", "locktime", "inputs", "outputs"]),
    ];
    if (!okSets.some((s) => s.size === keys.size && [...s].every((k) => keys.has(k)))) {
      return false;
    }
    if (typeof tx.version !== "number" || !Number.isInteger(tx.version)) return false;
    if (typeof tx.locktime !== "number" || !Number.isInteger(tx.locktime)) return false;
    if (!Array.isArray(tx.inputs) || !tx.inputs.length) return false;
    if (!Array.isArray(tx.outputs) || !tx.outputs.length) return false;
    for (const i of tx.inputs) {
      if (
        !i ||
        typeof i !== "object" ||
        new Set(Object.keys(i)).size !== 4 ||
        !(
          "prev_txid_hex" in i &&
          "prev_vout" in i &&
          "script_sig_hex" in i &&
          "sequence" in i
        )
      ) {
        return false;
      }
      if (
        typeof i.prev_vout !== "number" ||
        !Number.isInteger(i.prev_vout) ||
        i.prev_vout < 0 ||
        typeof i.sequence !== "number" ||
        !Number.isInteger(i.sequence)
      ) {
        return false;
      }
      try {
        if (requireHex("prev_txid", i.prev_txid_hex, { expectedBytes: 32 }).length !== 32) {
          return false;
        }
        if (typeof i.script_sig_hex !== "string") return false;
        requireHex("script_sig", i.script_sig_hex);
      } catch {
        return false;
      }
    }
    for (const out of tx.outputs) {
      if (
        !out ||
        typeof out !== "object" ||
        new Set(Object.keys(out)).size !== 2 ||
        !("script_pubkey_hex" in out && "value_sats" in out)
      ) {
        return false;
      }
      if (
        typeof out.value_sats !== "number" ||
        !Number.isInteger(out.value_sats) ||
        out.value_sats < 0 ||
        !ClaimVerifier._supportedScript(out.script_pubkey_hex)
      ) {
        return false;
      }
    }
    return true;
  }

  closeAndAllocate(admitted, { fixed_bitcoin_genesis_pool, epoch_id }) {
    if (!this.epoch.closed) throw new AllocationError("EPOCH_NOT_CLOSED");
    if (epoch_id !== this.epoch.epoch_id) {
      throw new AllocationError("TYPE_ERROR", "epoch_id mismatch");
    }
    const rows = [];
    for (const r of admitted) {
      if (!r.ok || r.nullifier_hex == null || r.eligible_sats == null) {
        throw new AllocationError("TYPE_ERROR", "non-admitted row");
      }
      rows.push([r.nullifier_hex, r.eligible_sats]);
    }
    const record = allocateProportional({
      fixed_bitcoin_genesis_pool,
      eligible_by_nullifier: rows,
      epoch_id,
    });
    assertSupplyInvariant(record);
    return record;
  }
}

export { AllocationError, allocateProportional, assertSupplyInvariant, NullifierSet };
