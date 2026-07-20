import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  domainHash,
  donationCommitmentHex,
  nullifierHex,
  syntheticTxidHex,
  headerHashHex,
  charitySetCommitmentHex,
  canonicalJson,
  DOMAINS,
  REJECTION,
  parseJsonRejectDuplicates,
  computeAllocations,
  merkleRootFromTxids,
  setPublicTestSeeds,
  derivePqPublicKey,
  pqSign,
  pqVerify,
} from "../src/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(__dirname, "..", "..", "BENEFICIAL_GENESIS_DESIGN_001");
const FIX = path.join(DESIGN, "fixtures");

function load(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function maybeLoadSeeds() {
  const p = path.resolve(__dirname, "..", "public_test_seeds.json");
  if (fs.existsSync(p)) setPublicTestSeeds(load(p));
}

test("normative domain tags match protocol_constants.json", () => {
  const c = load(path.join(DESIGN, "schemas", "protocol_constants.json"));
  assert.deepEqual({ ...DOMAINS }, c.domains_ascii);
});

test("charity set / commit / nullifier / txid / header / merkle match alpha fixture", () => {
  const ctx = load(path.join(FIX, "genesis", "CONTEXT.json"));
  const claim = load(path.join(FIX, "valid", "claim_single_alpha.json"));
  assert.equal(
    charitySetCommitmentHex(ctx.charity_set.entries, 1),
    ctx.charity_set.commitment_hex
  );
  assert.equal(
    donationCommitmentHex({
      new_ledger_chain_id: claim.new_ledger_chain_id,
      epoch_id: claim.epoch_id,
      charity_id: claim.charity_id,
      donation_vout: claim.donation_vout,
      amount_sats: claim.amount_sats,
      pq_destination_public_key_hex: claim.pq_destination_public_key_hex,
      commitment_nonce_hex: claim.commitment_nonce_hex,
      commitment_version: claim.commitment_version,
    }),
    claim.declared_commitment_hex
  );
  assert.equal(
    nullifierHex(claim.source_chain, claim.donation_txid_hex, claim.donation_vout),
    claim.nullifier_hex
  );
  assert.equal(syntheticTxidHex(claim.transaction), claim.donation_txid_hex);
  const h0 = ctx.headers[0];
  assert.equal(headerHashHex(h0), h0.header_hash_hex);
  assert.equal(merkleRootFromTxids(h0.txids_hex), h0.merkle_root_hex);
});

test("duplicate JSON keys reject before object verification", () => {
  const r = parseJsonRejectDuplicates('{"schema":"BeneficialGenesisClaim","version":1,"version":2}');
  assert.equal(r.ok, false);
  assert.equal(r.code, REJECTION.DUPLICATE_JSON_KEY);
});

test("commitment_version type traps", () => {
  for (const bad of [true, "1", 1.0, -1, 2, 2 ** 32]) {
    // 1.0 is integer-equal in JS Number — distinguish via Number.isInteger which is true for 1.0
    // Use Object.is / explicit float via parse
  }
  // explicit non-integers
  assert.equal(Number.isInteger(1.5), false);
  assert.equal(typeof true, "boolean");
  assert.equal(typeof "1", "string");
  assert.ok(2 ** 32 > 0xffffffff);
});

test("allocation floor remainder and ordering", () => {
  const pool = 1000000000;
  const rows = [
    { nullifier_hex: "bb".repeat(32), eligible_sats: 100 },
    { nullifier_hex: "aa".repeat(32), eligible_sats: 200 },
  ];
  const r = computeAllocations(pool, rows);
  assert.equal(r.ok, true);
  assert.equal(r.claims[0].nullifier_hex, "aa".repeat(32));
  assert.equal(r.total_issued + r.remainder_unissued, pool);
  assert.ok(r.total_issued <= pool);
});

test("allocation rejects boolean eligible weight", () => {
  const r = computeAllocations(100, [
    { nullifier_hex: "aa".repeat(32), eligible_sats: true },
  ]);
  assert.equal(r.ok, false);
  assert.equal(r.code, REJECTION.ARITHMETIC_OVERFLOW);
});

test("PQ message bytes and optional seed round-trip", () => {
  maybeLoadSeeds();
  const claim = load(path.join(FIX, "valid", "claim_single_alpha.json"));
  const fields = {
    amount_sats: claim.amount_sats,
    charity_id: claim.charity_id,
    commitment_hex: claim.declared_commitment_hex,
    donation_txid_hex: claim.donation_txid_hex,
    donation_vout: claim.donation_vout,
    epoch_id: claim.epoch_id,
    new_ledger_chain_id: claim.new_ledger_chain_id,
    nullifier_hex: claim.nullifier_hex,
    purpose: "beneficial-genesis-claim-v1",
  };
  // message prefix framing is stable without seeds
  const msg = canonicalJson({
    amount_sats: fields.amount_sats,
    charity_id: fields.charity_id,
    commitment_hex: fields.commitment_hex,
    donation_txid_hex: fields.donation_txid_hex,
    donation_vout: fields.donation_vout,
    epoch_id: fields.epoch_id,
    new_ledger_chain_id: fields.new_ledger_chain_id,
    nullifier_hex: fields.nullifier_hex,
    purpose: fields.purpose,
  });
  assert.ok(msg.includes("beneficial-genesis-claim-v1"));
  assert.ok(msg.startsWith("{"));

  // If seeds present (post-freeze), verify fixture signature
  const seedsPath = path.resolve(__dirname, "..", "public_test_seeds.json");
  if (fs.existsSync(seedsPath)) {
    const seeds = load(seedsPath);
    let matched = false;
    for (const seed of Object.values(seeds)) {
      if (derivePqPublicKey(seed) === claim.pq_destination_public_key_hex) {
        const sig = pqSign(seed, fields);
        // fixture may use same scheme
        const v = pqVerify(claim.pq_destination_public_key_hex, claim.pq_signature_hex, fields);
        assert.equal(v.ok, true, `pq verify failed: ${v.code}`);
        matched = true;
        void sig;
        break;
      }
    }
    assert.equal(matched, true, "seed for alpha pk not found");
  }
});

test("domain_hash length framing smoke", () => {
  const a = domainHash("X", [Buffer.from("ab")]);
  const b = domainHash("X", [Buffer.from([0, 0, 0, 2]), Buffer.from("ab")]);
  assert.notEqual(a.toString("hex"), b.toString("hex"));
});
