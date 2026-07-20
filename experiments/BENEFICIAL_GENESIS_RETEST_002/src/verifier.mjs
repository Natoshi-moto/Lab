import {
  CLAIM_KEYS,
  INCLUSION_PROOF_KEYS,
  SOURCE_AUTH_KEYS,
  TX_KEYS,
  TX_INPUT_KEYS,
  TX_OUTPUT_KEYS,
  EPOCH_KEYS,
  EPOCH_OPTIONAL_KEYS,
  CHARITY_ENTRY_KEYS,
  CHARITY_SET_KEYS,
  COMMITMENT_VERSION,
  PROTOCOL_VERSION,
  REJECTION,
  SUPPORTED_SOURCE_CHAIN,
} from "./constants.mjs";
import {
  charitySetCommitmentHex,
  commitmentCarrierScript,
  donationCommitmentHex,
  headerHashHex,
  isLowerHex,
  isSupportedScriptHex,
  nullifierHex,
  parseHexStrict,
  requireExactKeys,
  requireU32,
  requireU64,
  syntheticTxidHex,
} from "./encoding.mjs";
import { verifyMerkleInclusion } from "./merkle.mjs";
import { pqVerify, sourceVerify } from "./crypto.mjs";
import { computeAllocations, validateAllocationRecord } from "./allocation.mjs";
import { parseJsonRejectDuplicates } from "./parser.mjs";

function fail(code, detail = null) {
  return { ok: false, code, detail };
}
function ok(extra = {}) {
  return { ok: true, code: REJECTION.OK, ...extra };
}

function validateCharitySet(charitySet) {
  const shape = requireExactKeys(charitySet, CHARITY_SET_KEYS);
  if (!shape.ok) {
    return fail(shape.code === "UNKNOWN_FIELD" ? REJECTION.UNKNOWN_FIELD : REJECTION.MALFORMED_CHARITY_ENTRY);
  }
  if (charitySet.schema !== "CharitySetCommitment" || charitySet.version !== 1) {
    return fail(REJECTION.MALFORMED_CHARITY_ENTRY);
  }
  if (!Array.isArray(charitySet.entries) || charitySet.entries.length === 0) {
    return fail(REJECTION.MALFORMED_CHARITY_ENTRY);
  }
  const ids = new Set();
  for (const e of charitySet.entries) {
    const es = requireExactKeys(e, CHARITY_ENTRY_KEYS);
    if (!es.ok) return fail(REJECTION.MALFORMED_CHARITY_ENTRY);
    if (typeof e.charity_id !== "string" || e.charity_id.length < 1) {
      return fail(REJECTION.MALFORMED_CHARITY_ENTRY);
    }
    if (ids.has(e.charity_id)) return fail(REJECTION.DUPLICATE_CHARITY_ENTRY);
    ids.add(e.charity_id);
    if (!isLowerHex(e.script_pubkey_hex) || !isSupportedScriptHex(e.script_pubkey_hex)) {
      return fail(REJECTION.MALFORMED_CHARITY_ENTRY);
    }
    if (!isLowerHex(e.attestation_commitment_hex, 32)) {
      return fail(REJECTION.MALFORMED_CHARITY_ENTRY);
    }
    if (!requireU32(e.valid_from_height).ok || !requireU32(e.valid_until_height).ok) {
      return fail(REJECTION.MALFORMED_CHARITY_ENTRY);
    }
  }
  let computed;
  try {
    computed = charitySetCommitmentHex(charitySet.entries, charitySet.version);
  } catch {
    return fail(REJECTION.MALFORMED_CHARITY_ENTRY);
  }
  if (computed !== charitySet.commitment_hex) {
    return fail(REJECTION.CHARITY_SET_COMMITMENT_INVALID);
  }
  return ok({ entries: charitySet.entries, byId: Object.fromEntries(charitySet.entries.map((e) => [e.charity_id, e])) });
}

function validateEpoch(epoch) {
  const shape = requireExactKeys(epoch, EPOCH_KEYS, EPOCH_OPTIONAL_KEYS);
  if (!shape.ok) {
    return fail(shape.code === "UNKNOWN_FIELD" ? REJECTION.UNKNOWN_FIELD : REJECTION.MALFORMED_EPOCH);
  }
  if (epoch.schema !== "MigrationEpochClose") return fail(REJECTION.MALFORMED_EPOCH);
  if (typeof epoch.version !== "number" || !Number.isInteger(epoch.version) || epoch.version !== PROTOCOL_VERSION) {
    return fail(REJECTION.MALFORMED_EPOCH);
  }
  if (typeof epoch.epoch_id !== "string" || !epoch.epoch_id) return fail(REJECTION.MALFORMED_EPOCH);
  if (typeof epoch.closed !== "boolean") return fail(REJECTION.MALFORMED_EPOCH);
  if (!requireU32(epoch.accepted_source_tip_height).ok) return fail(REJECTION.MALFORMED_EPOCH);
  if (!requireU32(epoch.last_eligible_inclusion_height).ok) return fail(REJECTION.MALFORMED_EPOCH);
  if (!isLowerHex(epoch.accepted_source_tip_header_hash_hex, 32)) return fail(REJECTION.MALFORMED_EPOCH);
  if (!isLowerHex(epoch.last_eligible_inclusion_header_hash_hex, 32)) return fail(REJECTION.MALFORMED_EPOCH);
  if (typeof epoch.min_confirmations !== "number" || !Number.isInteger(epoch.min_confirmations) || epoch.min_confirmations < 1) {
    return fail(REJECTION.MALFORMED_EPOCH);
  }
  if ("quantum_compromise_cutoff_height" in epoch) {
    if (!requireU32(epoch.quantum_compromise_cutoff_height).ok) return fail(REJECTION.MALFORMED_EPOCH);
  }
  if (epoch.last_eligible_inclusion_height > epoch.accepted_source_tip_height) {
    return fail(REJECTION.MALFORMED_EPOCH);
  }
  return ok();
}

function buildHeaderIndex(headers) {
  const byHash = new Map();
  const byHeight = new Map();
  for (const h of headers) {
    if (!h || typeof h !== "object") return fail(REJECTION.HEADER_ANCESTRY_INVALID);
    const required = ["bits", "height", "merkle_root_hex", "prev_hash_hex", "time", "header_hash_hex"];
    for (const k of required) {
      if (!(k in h)) return fail(REJECTION.HEADER_ANCESTRY_INVALID);
    }
    // reject unknown keys on header fixtures? headers in context have txids_hex extra — trusted input, allow extras for trusted headers only
    if (!requireU32(h.height).ok || !requireU32(h.bits).ok) return fail(REJECTION.HEADER_ANCESTRY_INVALID);
    if (!isLowerHex(h.merkle_root_hex, 32) || !isLowerHex(h.prev_hash_hex, 32) || !isLowerHex(h.header_hash_hex, 32)) {
      return fail(REJECTION.HEADER_ANCESTRY_INVALID);
    }
    let computed;
    try {
      computed = headerHashHex(h);
    } catch {
      return fail(REJECTION.HEADER_ANCESTRY_INVALID);
    }
    if (computed !== h.header_hash_hex) return fail(REJECTION.HEADER_ANCESTRY_INVALID);
    byHash.set(h.header_hash_hex, h);
    byHeight.set(h.height, h);
  }
  return ok({ byHash, byHeight });
}

export class TrustedContext {
  constructor({
    charitySet,
    epoch,
    headers,
    sourceChain = SUPPORTED_SOURCE_CHAIN,
    newLedgerChainId,
    fixedPool = null,
    // Optional external tip binding (must equal epoch tip). Used to exercise
    // CHECKPOINT_MISMATCH constructor probes matching the subject evidence gate.
    tipHeight = null,
    tipHashHex = null,
  }) {
    const cs = validateCharitySet(charitySet);
    if (!cs.ok) {
      const err = new Error(cs.code);
      err.code = cs.code;
      throw err;
    }
    const ep = validateEpoch(epoch);
    if (!ep.ok) {
      const err = new Error(ep.code);
      err.code = ep.code;
      throw err;
    }
    const hi = buildHeaderIndex(headers);
    if (!hi.ok) {
      const err = new Error(hi.code);
      err.code = hi.code;
      throw err;
    }

    const suppliedTipHash = tipHashHex ?? epoch.accepted_source_tip_header_hash_hex;
    const suppliedTipHeight = tipHeight ?? epoch.accepted_source_tip_height;

    // tip binding — external tip must resolve and equal epoch tip fields
    const tip = hi.byHash.get(suppliedTipHash);
    if (!tip || tip.height !== suppliedTipHeight) {
      const err = new Error(REJECTION.CHECKPOINT_MISMATCH);
      err.code = REJECTION.CHECKPOINT_MISMATCH;
      throw err;
    }
    if (
      epoch.accepted_source_tip_height !== suppliedTipHeight ||
      epoch.accepted_source_tip_header_hash_hex !== suppliedTipHash
    ) {
      const err = new Error(REJECTION.CHECKPOINT_MISMATCH);
      err.code = REJECTION.CHECKPOINT_MISMATCH;
      throw err;
    }
    // eligibility header must be on ancestry of tip
    const elig = hi.byHash.get(epoch.last_eligible_inclusion_header_hash_hex);
    if (!elig || elig.height !== epoch.last_eligible_inclusion_height) {
      const err = new Error(REJECTION.CHECKPOINT_MISMATCH);
      err.code = REJECTION.CHECKPOINT_MISMATCH;
      throw err;
    }
    if (!headerOnAncestry(tip.header_hash_hex, elig.header_hash_hex, hi.byHash)) {
      const err = new Error(REJECTION.CHECKPOINT_MISMATCH);
      err.code = REJECTION.CHECKPOINT_MISMATCH;
      throw err;
    }

    this.charitySet = charitySet;
    this.charityById = cs.byId;
    this.epoch = epoch;
    this.headersByHash = hi.byHash;
    this.headersByHeight = hi.byHeight;
    this.sourceChain = sourceChain;
    this.newLedgerChainId = newLedgerChainId;
    this.fixedPool = fixedPool;
    this.nullifiers = new Set();
    this.provisionalClaims = []; // { claim, nullifier }
  }

  static fromGenesisContext(ctx, { closed = false } = {}) {
    const epoch = closed ? ctx.epoch_closed : ctx.epoch_open;
    return new TrustedContext({
      charitySet: ctx.charity_set,
      epoch,
      headers: ctx.headers,
      sourceChain: ctx.source_chain,
      newLedgerChainId: ctx.new_ledger_chain_id,
      fixedPool: ctx.fixed_bitcoin_genesis_pool,
    });
  }

  cloneWithEpoch(epoch, headers = null) {
    return new TrustedContext({
      charitySet: this.charitySet,
      epoch,
      headers: headers || [...this.headersByHash.values()],
      sourceChain: this.sourceChain,
      newLedgerChainId: this.newLedgerChainId,
      fixedPool: this.fixedPool,
    });
  }

  consumeNullifier(n) {
    if (this.nullifiers.has(n)) return false;
    this.nullifiers.add(n);
    return true;
  }

  /**
   * Replace trusted checkpoint: revalidate all provisional claims atomically.
   * On any failure, previous nullifier state is restored.
   */
  replaceCheckpoint({ epoch, headers }) {
    const prevNullifiers = new Set(this.nullifiers);
    const prevClaims = [...this.provisionalClaims];
    let next;
    try {
      next = new TrustedContext({
        charitySet: this.charitySet,
        epoch,
        headers,
        sourceChain: this.sourceChain,
        newLedgerChainId: this.newLedgerChainId,
        fixedPool: this.fixedPool,
      });
    } catch (e) {
      return fail(e.code || REJECTION.CHECKPOINT_MISMATCH, String(e.message || e));
    }

    const rebuilt = [];
    for (const { claim } of prevClaims) {
      const r = next.verifyClaim(claim, { consume: true, allowClosed: false });
      if (!r.ok) {
        // atomic: leave this context unchanged
        return fail(r.code, "revalidation failed; prior state retained");
      }
      rebuilt.push({ claim, nullifier: r.nullifier_hex });
    }
    // commit
    this.epoch = next.epoch;
    this.headersByHash = next.headersByHash;
    this.headersByHeight = next.headersByHeight;
    this.nullifiers = next.nullifiers;
    this.provisionalClaims = rebuilt;
    return ok({ retained: rebuilt.length });
  }

  verifyClaim(claim, { consume = true, allowClosed = false, historical = false } = {}) {
    try {
      return this._verifyClaim(claim, { consume, allowClosed, historical });
    } catch (e) {
      if (e && e.code) return fail(e.code, e.message);
      // typed rejection preferred over crash
      return fail(REJECTION.TYPE_ERROR, String(e && e.message ? e.message : e));
    }
  }

  _verifyClaim(claim, { consume, allowClosed, historical }) {
    // Check order mirrors the subject reference verifier for stable rejection codes.
    if (this.epoch.closed && !allowClosed && !historical) {
      return fail(REJECTION.EPOCH_CLOSED);
    }

    if (!claim || typeof claim !== "object" || Array.isArray(claim)) {
      return fail(REJECTION.TYPE_ERROR, "claim not object");
    }
    const claimKeys = new Set(Object.keys(claim));
    const expectedKeys = new Set(CLAIM_KEYS);
    const unexpected = [...claimKeys].filter((k) => !expectedKeys.has(k));
    const missing = [...expectedKeys].filter((k) => !claimKeys.has(k));
    if (unexpected.length) return fail(REJECTION.UNKNOWN_FIELD, unexpected.join(","));
    if (missing.length) return fail(REJECTION.MISSING_FIELD, missing.join(","));

    if (typeof claim.version !== "number" || !Number.isInteger(claim.version) || claim.version !== PROTOCOL_VERSION) {
      return fail(REJECTION.UNSUPPORTED_CLAIM_VERSION);
    }
    if (claim.schema !== "BeneficialGenesisClaim" || typeof claim.label !== "string") {
      return fail(REJECTION.TYPE_ERROR);
    }

    if (claim.source_chain !== this.sourceChain) {
      if (claim.source_chain !== SUPPORTED_SOURCE_CHAIN) return fail(REJECTION.UNSUPPORTED_SOURCE_CHAIN);
      return fail(REJECTION.CROSS_CHAIN_REPLAY);
    }
    if (claim.new_ledger_chain_id !== this.newLedgerChainId) return fail(REJECTION.CROSS_CHAIN_REPLAY);
    if (claim.epoch_id !== this.epoch.epoch_id) return fail(REJECTION.CROSS_EPOCH_REPLAY);

    const charityId = claim.charity_id;
    const txid = claim.donation_txid_hex;
    const vout = claim.donation_vout;
    const amount = claim.amount_sats;
    if (typeof charityId !== "string" || !charityId) return fail(REJECTION.TYPE_ERROR, "charity_id");
    if (typeof vout !== "number" || !Number.isInteger(vout) || vout < 0 || vout > 0xffffffff) {
      return fail(REJECTION.TYPE_ERROR, "donation_vout");
    }
    if (typeof amount !== "number" || !Number.isInteger(amount)) return fail(REJECTION.TYPE_ERROR, "amount_sats");
    if (amount <= 0) return fail(REJECTION.AMOUNT_NOT_POSITIVE);

    const commitmentVersion = claim.commitment_version;
    if (
      typeof commitmentVersion === "boolean" ||
      typeof commitmentVersion !== "number" ||
      !Number.isInteger(commitmentVersion) ||
      commitmentVersion < 0 ||
      commitmentVersion > 0xffffffff ||
      commitmentVersion !== COMMITMENT_VERSION
    ) {
      return fail(REJECTION.COMMITMENT_VERSION_INVALID);
    }

    for (const [field, len] of [
      ["donation_txid_hex", 32],
      ["pq_destination_public_key_hex", 32],
      ["commitment_nonce_hex", 16],
      ["declared_commitment_hex", 32],
      ["nullifier_hex", 32],
    ]) {
      if (!isLowerHex(claim[field], len)) {
        return fail(field === "nullifier_hex" ? REJECTION.NULLIFIER_INVALID : REJECTION.TYPE_ERROR, field);
      }
    }
    if (typeof claim.pq_signature_hex !== "string" || !isLowerHex(claim.pq_signature_hex)) {
      return fail(REJECTION.TYPE_ERROR, "pq_signature_hex");
    }

    const tx = claim.transaction;
    if (!validTransaction(tx)) return fail(REJECTION.UNSUPPORTED_TX_FORM);

    let computedTxid;
    try {
      computedTxid = syntheticTxidHex(tx);
    } catch {
      return fail(REJECTION.UNSUPPORTED_TX_FORM);
    }
    if (computedTxid !== txid) return fail(REJECTION.TX_MALLEABILITY_REENCODING);

    if (vout >= tx.outputs.length) return fail(REJECTION.WRONG_OUTPUT_INDEX);
    const donationOut = tx.outputs[vout];
    if (typeof donationOut.value_sats !== "number" || donationOut.value_sats !== amount) {
      return fail(REJECTION.AMOUNT_MISMATCH);
    }
    if (!isSupportedScriptHex(donationOut.script_pubkey_hex)) {
      return fail(REJECTION.UNSUPPORTED_SCRIPT_FORM);
    }

    const entry = this.charityById[charityId];
    if (!entry) {
      for (const e of Object.values(this.charityById)) {
        if (e.script_pubkey_hex === donationOut.script_pubkey_hex) {
          return fail(REJECTION.CHARITY_ID_UNKNOWN, "script matched different id");
        }
      }
      return fail(REJECTION.CHARITY_ID_UNKNOWN);
    }
    if (donationOut.script_pubkey_hex !== entry.script_pubkey_hex) {
      return fail(REJECTION.CHARITY_SCRIPT_MISMATCH);
    }

    const ip = claim.inclusion_proof;
    if (!ip || typeof ip !== "object" || requireExactKeys(ip, INCLUSION_PROOF_KEYS).ok === false) {
      return fail(REJECTION.INCLUSION_PROOF_INVALID, "not object");
    }
    if (ip.schema !== "DonationInclusionProof") return fail(REJECTION.INCLUSION_PROOF_INVALID);
    if (typeof ip.block_height !== "number" || !Number.isInteger(ip.block_height) || ip.block_height < 0 || ip.block_height > 0xffffffff) {
      return fail(REJECTION.INCLUSION_PROOF_INVALID, "block_height");
    }
    if (typeof ip.merkle_index !== "number" || !Number.isInteger(ip.merkle_index)) {
      return fail(REJECTION.INCLUSION_PROOF_INVALID, "merkle_index");
    }
    if (!isLowerHex(ip.block_header_hash_hex, 32)) return fail(REJECTION.INCLUSION_PROOF_INVALID);
    if (!Array.isArray(ip.merkle_branch_hex)) return fail(REJECTION.INCLUSION_PROOF_INVALID);

    const inclHeader = this.headersByHash.get(ip.block_header_hash_hex);
    if (!inclHeader) return fail(REJECTION.HEADER_ANCESTRY_INVALID, "unknown header");
    if (inclHeader.height !== ip.block_height) return fail(REJECTION.HEADER_ANCESTRY_INVALID, "height mismatch");
    if (!headerOnAncestry(this.epoch.accepted_source_tip_header_hash_hex, ip.block_header_hash_hex, this.headersByHash)) {
      return fail(REJECTION.HEADER_ANCESTRY_INVALID, "not ancestor of tip");
    }

    const merkle = verifyMerkleInclusion(txid, ip.merkle_branch_hex, ip.merkle_index, inclHeader.merkle_root_hex);
    if (!merkle.ok) return fail(REJECTION.INCLUSION_PROOF_INVALID);

    const confirmations = this.epoch.accepted_source_tip_height - ip.block_height + 1;
    if (confirmations < this.epoch.min_confirmations) {
      return fail(REJECTION.INSUFFICIENT_CONFIRMATIONS);
    }
    if (ip.block_height > this.epoch.last_eligible_inclusion_height) {
      return fail(REJECTION.INCLUSION_AFTER_CUTOFF);
    }
    if (ip.block_height < entry.valid_from_height || ip.block_height > entry.valid_until_height) {
      return fail(REJECTION.CHARITY_INACTIVE);
    }
    if (
      Object.prototype.hasOwnProperty.call(this.epoch, "quantum_compromise_cutoff_height") &&
      ip.block_height > this.epoch.quantum_compromise_cutoff_height
    ) {
      return fail(REJECTION.QUANTUM_COMPROMISE_CUTOFF);
    }

    const sa = claim.source_authorization;
    if (!sa || typeof sa !== "object" || requireExactKeys(sa, SOURCE_AUTH_KEYS).ok === false) {
      return fail(REJECTION.SOURCE_AUTH_INVALID);
    }
    const src = sourceVerify(sa, txid);
    if (!src.ok) return fail(REJECTION.SOURCE_AUTH_INVALID);

    let commit;
    try {
      commit = donationCommitmentHex({
        new_ledger_chain_id: claim.new_ledger_chain_id,
        epoch_id: claim.epoch_id,
        charity_id: charityId,
        donation_vout: vout,
        amount_sats: amount,
        pq_destination_public_key_hex: claim.pq_destination_public_key_hex,
        commitment_nonce_hex: claim.commitment_nonce_hex,
        commitment_version: commitmentVersion,
      });
    } catch {
      return fail(REJECTION.TYPE_ERROR, "commitment fields");
    }
    if (claim.declared_commitment_hex !== commit) {
      return fail(REJECTION.COMMITMENT_INVALID, "declared mismatch");
    }

    const mult = commitmentCarrierStatus(tx, commit);
    if (mult !== "OK") return fail(mult, "commitment carrier policy");

    let nf;
    try {
      nf = nullifierHex(claim.source_chain, txid, vout);
    } catch {
      return fail(REJECTION.NULLIFIER_INVALID);
    }
    if (claim.nullifier_hex !== nf) return fail(REJECTION.NULLIFIER_INVALID, "presented nullifier mismatch");

    const pq = pqVerify(claim.pq_destination_public_key_hex, claim.pq_signature_hex, {
      amount_sats: amount,
      charity_id: charityId,
      commitment_hex: commit,
      donation_txid_hex: txid,
      donation_vout: vout,
      epoch_id: claim.epoch_id,
      new_ledger_chain_id: claim.new_ledger_chain_id,
      nullifier_hex: nf,
      purpose: "beneficial-genesis-claim-v1",
    });
    if (!pq.ok) return fail(pq.code || REJECTION.PQ_SIGNATURE_INVALID);

    if (consume && !historical) {
      if (this.nullifiers.has(nf)) return fail(REJECTION.NULLIFIER_ALREADY_CONSUMED);
      this.nullifiers.add(nf);
      this.provisionalClaims.push({ claim, nullifier: nf });
    } else if (!historical && this.nullifiers.has(nf)) {
      return fail(REJECTION.NULLIFIER_ALREADY_CONSUMED);
    }

    return ok({ nullifier_hex: nf, commitment_hex: commit, txid_hex: txid, confirmations, eligible_sats: amount });
  }

  verifyHistoricalClaim(claim) {
    if (!this.epoch.closed) return fail(REJECTION.EPOCH_NOT_CLOSED);
    return this.verifyClaim(claim, { consume: false, allowClosed: true, historical: true });
  }

  allocate(admittedEligibleRows) {
    if (!this.epoch.closed) return fail(REJECTION.EPOCH_NOT_CLOSED);
    if (this.fixedPool === null || this.fixedPool === undefined) return fail(REJECTION.TYPE_ERROR);
    return computeAllocations(this.fixedPool, admittedEligibleRows);
  }

  validateAllocationRecord(record) {
    if (!this.epoch.closed) return fail(REJECTION.EPOCH_NOT_CLOSED);
    return validateAllocationRecord(record, {
      accepted_source_tip_header_hash_hex: this.epoch.accepted_source_tip_header_hash_hex,
      accepted_source_tip_height: this.epoch.accepted_source_tip_height,
      last_eligible_inclusion_header_hash_hex: this.epoch.last_eligible_inclusion_header_hash_hex,
      last_eligible_inclusion_height: this.epoch.last_eligible_inclusion_height,
    });
  }
}

function headerOnAncestry(tipHash, targetHash, byHash) {
  if (tipHash === targetHash) return true;
  let cur = byHash.get(tipHash);
  const seen = new Set();
  while (cur) {
    if (seen.has(cur.header_hash_hex)) return false; // cycle
    seen.add(cur.header_hash_hex);
    if (cur.header_hash_hex === targetHash) return true;
    if (cur.prev_hash_hex === targetHash) return true;
    if (cur.prev_hash_hex === "0".repeat(64)) return cur.header_hash_hex === targetHash;
    cur = byHash.get(cur.prev_hash_hex);
  }
  return false;
}

function validTransaction(tx) {
  if (!tx || typeof tx !== "object" || Array.isArray(tx)) return false;
  if (requireExactKeys(tx, TX_KEYS).ok === false) return false;
  if (!requireU32(tx.version).ok || !requireU32(tx.locktime).ok) return false;
  if (typeof tx.label !== "string") return false;
  if (!Array.isArray(tx.inputs) || !tx.inputs.length || !Array.isArray(tx.outputs) || !tx.outputs.length) return false;
  for (const inp of tx.inputs) {
    if (requireExactKeys(inp, TX_INPUT_KEYS).ok === false) return false;
    if (!isLowerHex(inp.prev_txid_hex, 32) || !isLowerHex(inp.script_sig_hex)) return false;
    if (!requireU32(inp.prev_vout).ok || !requireU32(inp.sequence).ok) return false;
  }
  for (const out of tx.outputs) {
    if (requireExactKeys(out, TX_OUTPUT_KEYS).ok === false) return false;
    if (!requireU64(out.value_sats).ok) return false;
    if (!isSupportedScriptHex(out.script_pubkey_hex)) return false;
  }
  return true;
}

function commitmentCarrierStatus(tx, commitmentHex) {
  const carriers = tx.outputs
    .map((o) => o.script_pubkey_hex)
    .filter((s) => typeof s === "string" && s.startsWith("6a20"));
  const needle = commitmentCarrierScript(commitmentHex);
  const count = carriers.filter((c) => c === needle).length;
  if (count === 0) return REJECTION.COMMITMENT_INVALID;
  if (count !== 1 || carriers.length !== new Set(carriers).size) {
    return REJECTION.COMMITMENT_MULTIPLICITY_INVALID;
  }
  const donationOutputs = tx.outputs.filter((o) => !String(o.script_pubkey_hex).startsWith("6a20"));
  if (carriers.length > donationOutputs.length) return REJECTION.COMMITMENT_MULTIPLICITY_INVALID;
  return "OK";
}

export function verifyRawClaimJson(rawText, ctx, opts) {
  const parsed = parseJsonRejectDuplicates(rawText);
  if (!parsed.ok) return fail(parsed.code, parsed.detail || parsed.key);
  return ctx.verifyClaim(parsed.value, opts);
}

export { parseJsonRejectDuplicates, fail, ok };
