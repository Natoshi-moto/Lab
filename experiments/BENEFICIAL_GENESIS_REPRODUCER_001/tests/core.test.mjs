/**
 * Clean-room unit tests — encodings, allocation, nullifier, basic claims.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ClaimVerifier,
  NullifierSet,
  allocateProportional,
  assertSupplyInvariant,
  AllocationError,
} from "../src/verifier.mjs";
import {
  computeNullifier,
  donationCommitmentHex,
  derivePqPublicKey,
  pqMessageForClaim,
  pqSign,
  pqVerify,
} from "../src/crypto.mjs";
import { domainHashHex, canonicalJsonBytes, requireHex } from "../src/encoding.mjs";
import { headerHash, txidFromTx, verifyMerkleProof, merkleRoot } from "../src/merkle.mjs";
import {
  DOMAIN_CHARITY_SET,
  DOMAIN_HEADER,
  DOMAIN_MERKLE,
  DOMAIN_NULLIFIER,
  DOMAIN_TXID,
  PUBLIC_TEST_SEEDS,
} from "../src/constants.mjs";
import { charitySetCommitment, validateCharitySet } from "../src/objects.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(__dirname, "../../BENEFICIAL_GENESIS_DESIGN_001/fixtures");

function load(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function openVerifier(extra = {}) {
  const ctx = load(path.join(DESIGN, "genesis/CONTEXT.json"));
  const epoch = load(path.join(DESIGN, "genesis/EPOCH_OPEN.json"));
  const hbh = Object.fromEntries(ctx.headers.map((h) => [h.header_hash_hex, h]));
  return new ClaimVerifier({
    charity_set: ctx.charity_set,
    epoch: extra.epoch || epoch,
    headers_by_hash: hbh,
    tip_height: ctx.tip_height,
    tip_hash_hex: ctx.tip_hash_hex,
    new_ledger_chain_id: ctx.new_ledger_chain_id,
    nullifiers: extra.nullifiers || new NullifierSet(),
  });
}

test("donation commitment matches claim_single_alpha", () => {
  const claim = load(path.join(DESIGN, "valid/claim_single_alpha.json"));
  const h = donationCommitmentHex({
    new_ledger_chain_id: claim.new_ledger_chain_id,
    epoch_id: claim.epoch_id,
    charity_id: claim.charity_id,
    donation_vout: claim.donation_vout,
    amount_sats: claim.amount_sats,
    pq_destination_public_key_hex: claim.pq_destination_public_key_hex,
    nonce_hex: claim.commitment_nonce_hex,
    commitment_version: claim.commitment_version,
  });
  assert.equal(h, claim.declared_commitment_hex);
});

test("nullifier matches claim_single_alpha", () => {
  const claim = load(path.join(DESIGN, "valid/claim_single_alpha.json"));
  const n = computeNullifier({
    source_chain: claim.source_chain,
    donation_txid_hex: claim.donation_txid_hex,
    donation_vout: claim.donation_vout,
  });
  assert.equal(n, claim.nullifier_hex);
});

test("txid and merkle and header match context", () => {
  const claim = load(path.join(DESIGN, "valid/claim_single_alpha.json"));
  const ctx = load(path.join(DESIGN, "genesis/CONTEXT.json"));
  assert.equal(txidFromTx(claim.transaction), claim.donation_txid_hex);
  const h0 = ctx.headers[0];
  assert.equal(merkleRoot(h0.txids_hex), h0.merkle_root_hex);
  assert.equal(
    headerHash({
      bits: h0.bits,
      height: h0.height,
      merkle_root_hex: h0.merkle_root_hex,
      prev_hash_hex: h0.prev_hash_hex,
      time: h0.time,
    }),
    h0.header_hash_hex,
  );
  assert.equal(
    verifyMerkleProof(
      claim.donation_txid_hex,
      h0.merkle_root_hex,
      claim.inclusion_proof.merkle_branch_hex,
      claim.inclusion_proof.merkle_index,
    ),
    true,
  );
});

test("charity set commitment matches genesis", () => {
  const cs = load(path.join(DESIGN, "genesis/CHARITY_SET.json"));
  const recomputed = charitySetCommitment(cs.entries);
  assert.equal(recomputed.commitment_hex, cs.commitment_hex);
  const validated = validateCharitySet(cs);
  assert.equal(validated.commitment_hex, cs.commitment_hex);
});

test("pq alice key and signature verify", () => {
  const claim = load(path.join(DESIGN, "valid/claim_single_alpha.json"));
  assert.equal(derivePqPublicKey(PUBLIC_TEST_SEEDS.pq_alice), claim.pq_destination_public_key_hex);
  const nullifier = computeNullifier({
    source_chain: claim.source_chain,
    donation_txid_hex: claim.donation_txid_hex,
    donation_vout: claim.donation_vout,
  });
  const msg = pqMessageForClaim({
    new_ledger_chain_id: claim.new_ledger_chain_id,
    epoch_id: claim.epoch_id,
    charity_id: claim.charity_id,
    donation_txid_hex: claim.donation_txid_hex,
    donation_vout: claim.donation_vout,
    amount_sats: claim.amount_sats,
    commitment_hex: claim.declared_commitment_hex,
    nullifier_hex: nullifier,
  });
  assert.equal(pqVerify(claim.pq_destination_public_key_hex, msg, claim.pq_signature_hex), null);
  const signed = pqSign(PUBLIC_TEST_SEEDS.pq_alice, msg);
  assert.equal(signed, claim.pq_signature_hex);
});

test("valid single alpha admits", () => {
  const claim = load(path.join(DESIGN, "valid/claim_single_alpha.json"));
  const v = openVerifier();
  const r = v.verifyClaim(claim);
  assert.equal(r.ok, true);
  assert.equal(r.code, "OK");
});

test("closed epoch rejects new admission", () => {
  const claim = load(path.join(DESIGN, "valid/claim_single_alpha.json"));
  const closed = load(path.join(DESIGN, "genesis/EPOCH_CLOSED.json"));
  const v = openVerifier({ epoch: closed });
  const r = v.verifyClaim(claim);
  assert.equal(r.code, "EPOCH_CLOSED");
  const hist = v.verifyHistoricalClaim(claim);
  assert.equal(hist.ok, true);
});

test("double claim consumes nullifier", () => {
  const claim = load(path.join(DESIGN, "valid/claim_single_alpha.json"));
  const v = openVerifier();
  assert.equal(v.verifyClaim(claim).ok, true);
  assert.equal(v.verifyClaim(claim).code, "NULLIFIER_ALREADY_CONSUMED");
});

test("allocation supply invariant and floor remainder", () => {
  const alloc = load(path.join(DESIGN, "valid/allocation_after_epoch.json"));
  assertSupplyInvariant(alloc);
  assert.equal(alloc.total_issued + alloc.remainder_unissued, alloc.fixed_bitcoin_genesis_pool);
  assert.equal(alloc.remainder_unissued, 3);
});

test("bool eligible rejected as ARITHMETIC_OVERFLOW", () => {
  assert.throws(
    () =>
      allocateProportional({
        fixed_bitcoin_genesis_pool: 100,
        eligible_by_nullifier: [["aa".repeat(32), true]],
        epoch_id: "e",
      }),
    (e) => e instanceof AllocationError && e.code === "ARITHMETIC_OVERFLOW",
  );
});

test("requireHex rejects uppercase and odd length", () => {
  assert.throws(() => requireHex("x", "AA", { expectedBytes: 1 }));
  assert.throws(() => requireHex("x", "abc"));
  assert.throws(() => requireHex("x", ""));
  assert.equal(requireHex("x", "ab", { expectedBytes: 1 }).toString("hex"), "ab");
});

test("domain_hash length-prefix structure", () => {
  const n = domainHashHex(
    DOMAIN_NULLIFIER,
    Buffer.from("bitcoin-mainnet-semantics-synthetic"),
    Buffer.from("ac3c1d41aba49d7207c47d8927ef25d01b05a3570ef51e0614ae8599c5a1cf24", "hex"),
    Buffer.from([0, 0, 0, 0]),
  );
  const claim = load(path.join(DESIGN, "valid/claim_single_alpha.json"));
  assert.equal(n, claim.nullifier_hex);
  void DOMAIN_CHARITY_SET;
  void DOMAIN_HEADER;
  void DOMAIN_MERKLE;
  void DOMAIN_TXID;
  void canonicalJsonBytes;
});
