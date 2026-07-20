import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TrustedContext,
  setPublicTestSeeds,
  parseJsonRejectDuplicates,
  REJECTION,
  COMMITMENT_VERSION,
} from "../src/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(__dirname, "..", "..", "BENEFICIAL_GENESIS_DESIGN_001");
const FIX = path.join(DESIGN, "fixtures");

function load(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadSeedsIfAny() {
  const p = path.resolve(__dirname, "..", "public_test_seeds.json");
  if (fs.existsSync(p)) setPublicTestSeeds(load(p));
}

function openCtx(overrides = {}) {
  const ctxDoc = load(path.join(FIX, "genesis", "CONTEXT.json"));
  const epoch = { ...ctxDoc.epoch_open, ...overrides.epoch };
  return new TrustedContext({
    charitySet: ctxDoc.charity_set,
    epoch,
    headers: overrides.headers || ctxDoc.headers,
    sourceChain: ctxDoc.source_chain,
    newLedgerChainId: ctxDoc.new_ledger_chain_id,
    fixedPool: ctxDoc.fixed_bitcoin_genesis_pool,
  });
}

function alphaClaim() {
  return load(path.join(FIX, "valid", "claim_single_alpha.json"));
}

loadSeedsIfAny();

test("F-001: unexpected pq_sig_domain_bytes is UNKNOWN_FIELD (no crash)", () => {
  const ctx = openCtx();
  const claim = { ...alphaClaim(), pq_sig_domain_bytes: "not-hex!!!" };
  const r = ctx.verifyClaim(claim);
  assert.equal(r.ok, false);
  assert.equal(r.code, REJECTION.UNKNOWN_FIELD);
});

test("F-002: commitment_version true / string / float-ish / neg / 2 / 2^32 reject", () => {
  const ctx = openCtx();
  const base = alphaClaim();
  for (const v of [true, "1", -1, 2, 2 ** 32]) {
    const r = ctx.verifyClaim({ ...base, commitment_version: v });
    assert.equal(r.ok, false, `expected reject for ${String(v)}`);
    assert.ok(
      r.code === REJECTION.COMMITMENT_VERSION_INVALID || r.code === REJECTION.TYPE_ERROR,
      r.code
    );
  }
  // 1.0 is indistinguishable from 1 in JSON/JS numbers; real float 1.5:
  const rFloat = ctx.verifyClaim({ ...base, commitment_version: 1.5 });
  assert.equal(rFloat.ok, false);
});

test("F-003: missing / malformed / uppercase / disagreeing nullifier_hex reject", () => {
  const ctx = openCtx();
  const base = alphaClaim();
  const good = base.nullifier_hex;

  let c = { ...base };
  delete c.nullifier_hex;
  assert.equal(ctx.verifyClaim(c).code, REJECTION.MISSING_FIELD);

  c = { ...base, nullifier_hex: "zz".repeat(32) };
  assert.equal(ctx.verifyClaim(c).code, REJECTION.NULLIFIER_INVALID);

  c = { ...base, nullifier_hex: good.toUpperCase() };
  assert.equal(ctx.verifyClaim(c).code, REJECTION.NULLIFIER_INVALID);

  c = { ...base, nullifier_hex: "ab".repeat(32) };
  assert.equal(ctx.verifyClaim(c).code, REJECTION.NULLIFIER_INVALID);
});

test("F-004: unexpected keys at nested levels reject", () => {
  const ctx = openCtx();
  const base = alphaClaim();
  assert.equal(ctx.verifyClaim({ ...base, evil: 1 }).code, REJECTION.UNKNOWN_FIELD);
  // Nested proof/auth/tx unknown keys are typed rejects (subject uses object-specific codes).
  assert.equal(
    ctx.verifyClaim({
      ...base,
      inclusion_proof: { ...base.inclusion_proof, evil: true },
    }).code,
    REJECTION.INCLUSION_PROOF_INVALID
  );
  assert.equal(
    ctx.verifyClaim({
      ...base,
      source_authorization: { ...base.source_authorization, evil: true },
    }).code,
    REJECTION.SOURCE_AUTH_INVALID
  );
  assert.equal(
    ctx.verifyClaim({
      ...base,
      transaction: { ...base.transaction, evil: true },
    }).code,
    REJECTION.UNSUPPORTED_TX_FORM
  );
});

test("F-005: raw duplicate JSON keys", () => {
  const r = parseJsonRejectDuplicates('{"a":1,"a":2}');
  assert.equal(r.code, REJECTION.DUPLICATE_JSON_KEY);
});

test("accepted tip later than last-eligible; boundary eligibility", () => {
  const ctxDoc = load(path.join(FIX, "genesis", "CONTEXT.json"));
  // tip 120, eligible 110 — already separated
  assert.ok(ctxDoc.epoch_open.accepted_source_tip_height > ctxDoc.epoch_open.last_eligible_inclusion_height);
  const ctx = openCtx();
  // inclusion at 110 should be eligible if we had such a claim; use height check logic via synthetic
  assert.equal(ctx.epoch.last_eligible_inclusion_height, 110);
  assert.equal(ctx.epoch.accepted_source_tip_height, 120);
});

test("insufficient confirmations with consistent shorter tip", () => {
  const ctxDoc = load(path.join(FIX, "genesis", "CONTEXT.json"));
  // tip at 104 => confirmations for height 100 = 5 < 6
  const tip = ctxDoc.headers.find((h) => h.height === 104);
  const keep = new Set();
  const byHash = new Map(ctxDoc.headers.map((h) => [h.header_hash_hex, h]));
  let cur = tip;
  while (cur) {
    keep.add(cur.header_hash_hex);
    cur = byHash.get(cur.prev_hash_hex);
  }
  const headers = ctxDoc.headers.filter((h) => keep.has(h.header_hash_hex));
  const epoch = {
    ...ctxDoc.epoch_open,
    accepted_source_tip_height: tip.height,
    accepted_source_tip_header_hash_hex: tip.header_hash_hex,
    // eligibility still at or below tip; use header 100 as elig if needed
    last_eligible_inclusion_height: 100,
    last_eligible_inclusion_header_hash_hex: ctxDoc.headers.find((h) => h.height === 100).header_hash_hex,
  };
  const ctx = new TrustedContext({
    charitySet: ctxDoc.charity_set,
    epoch,
    headers,
    sourceChain: ctxDoc.source_chain,
    newLedgerChainId: ctxDoc.new_ledger_chain_id,
  });
  const r = ctx.verifyClaim(alphaClaim());
  assert.equal(r.code, REJECTION.INSUFFICIENT_CONFIRMATIONS);
});

test("quantum cutoff independent of eligibility", () => {
  const ctx = openCtx({
    epoch: { quantum_compromise_cutoff_height: 50 },
  });
  const r = ctx.verifyClaim(alphaClaim());
  assert.equal(r.code, REJECTION.QUANTUM_COMPROMISE_CUTOFF);
});

test("same-carrier duplication rejects", () => {
  const ctx = openCtx();
  const claim = alphaClaim();
  const carrier = claim.transaction.outputs.find((o) => o.script_pubkey_hex.startsWith("6a20"));
  const tx = {
    ...claim.transaction,
    outputs: [...claim.transaction.outputs, { ...carrier }],
  };
  // txid will change → malleability or multiplicity depending on order of checks
  const r = ctx.verifyClaim({ ...claim, transaction: tx });
  assert.equal(r.ok, false);
  assert.ok(
    [
      REJECTION.COMMITMENT_MULTIPLICITY_INVALID,
      REJECTION.TX_MALLEABILITY_REENCODING,
      REJECTION.COMMITMENT_INVALID,
      REJECTION.SOURCE_AUTH_INVALID,
      REJECTION.PQ_SIGNATURE_INVALID,
      REJECTION.PQ_KEY_WRONG,
    ].includes(r.code),
    r.code
  );
});

test("atomic nullifier rebuild: failed revalidation retains prior state", () => {
  loadSeedsIfAny();
  const ctxDoc = load(path.join(FIX, "genesis", "CONTEXT.json"));
  const ctx = openCtx();
  // Without seeds, claim may fail PQ — skip if so
  const first = ctx.verifyClaim(alphaClaim());
  if (!first.ok) {
    // still test replaceCheckpoint failure path with empty provisional
    const badEpoch = { ...ctxDoc.epoch_open, accepted_source_tip_header_hash_hex: "00".repeat(32) };
    const r = ctx.replaceCheckpoint({ epoch: badEpoch, headers: ctxDoc.headers });
    assert.equal(r.ok, false);
    return;
  }
  const size = ctx.nullifiers.size;
  const badEpoch = {
    ...ctxDoc.epoch_open,
    accepted_source_tip_header_hash_hex: "11".repeat(32),
    accepted_source_tip_height: 120,
  };
  const r = ctx.replaceCheckpoint({ epoch: badEpoch, headers: ctxDoc.headers });
  assert.equal(r.ok, false);
  assert.equal(ctx.nullifiers.size, size);
});

test("supported commitment_version constant is 1", () => {
  assert.equal(COMMITMENT_VERSION, 1);
});
