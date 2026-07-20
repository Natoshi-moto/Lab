/**
 * Hostile differential inputs — every malformed input must typed-reject or constructor-fail.
 * Crashes / uncaught exceptions are recorded as findings.
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
import { donationCommitmentHex, computeNullifier, pqSign, pqMessageForClaim } from "../src/crypto.mjs";
import { requireHex } from "../src/encoding.mjs";
import { headerHash, verifyMerkleProof } from "../src/merkle.mjs";
import { DOMAIN_PQ_SIG, PUBLIC_TEST_SEEDS } from "../src/constants.mjs";
import { charitySetCommitment, validateCharitySet } from "../src/objects.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(__dirname, "../../BENEFICIAL_GENESIS_DESIGN_001/fixtures");
const HOSTILE_DIR = path.resolve(__dirname, "../hostile_fixtures");
const RESULTS = path.resolve(__dirname, "../results");

function load(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

function openVerifier(mutators = {}) {
  const ctx = load(path.join(DESIGN, "genesis/CONTEXT.json"));
  let epoch = load(path.join(DESIGN, "genesis/EPOCH_OPEN.json"));
  if (mutators.epoch) epoch = { ...epoch, ...mutators.epoch };
  let headers = [...ctx.headers];
  if (mutators.headers) headers = mutators.headers;
  if (mutators.extra_headers) headers = headers.concat(mutators.extra_headers);
  const tip_hash_hex = mutators.tip_hash_hex ?? ctx.tip_hash_hex;
  const tip_height = mutators.tip_height ?? ctx.tip_height;
  const hbh = Object.fromEntries(headers.map((h) => [h.header_hash_hex, h]));
  return new ClaimVerifier({
    charity_set: mutators.charity_set ?? ctx.charity_set,
    epoch,
    headers_by_hash: hbh,
    tip_height,
    tip_hash_hex,
    new_ledger_chain_id: ctx.new_ledger_chain_id,
    nullifiers: mutators.nullifiers || new NullifierSet(),
  });
}

function baseClaim() {
  return deepClone(load(path.join(DESIGN, "valid/claim_single_alpha.json")));
}

function typedReject(fn) {
  try {
    const r = fn();
    if (r && typeof r === "object" && "code" in r) return { kind: "result", code: r.code, ok: r.ok };
    return { kind: "value", value: r };
  } catch (e) {
    return { kind: "throw", code: e.code || e.message, error: e };
  }
}

const findings = [];

function recordFinding(name, detail) {
  findings.push({ name, ...detail });
}

test("hostile: unexpected properties ignored vs nullifier disagreement", () => {
  const v = openVerifier();
  const c = baseClaim();
  c.unexpected_extra_field = { evil: true };
  const r1 = v.verifyClaim(c);
  // Extra fields may be ignored by design (JSON open object) — record either OK or TYPE_ERROR
  assert.ok(r1.code === "OK" || r1.code === "TYPE_ERROR", r1.code);
  if (r1.code === "OK") {
    recordFinding("unexpected_properties_ignored", {
      severity: "INFO",
      code: "OK",
      note: "Unexpected properties do not cause rejection (open claim object).",
    });
  }

  const v2 = openVerifier();
  const c2 = baseClaim();
  c2.nullifier_hex = "ff".repeat(32);
  const r2 = v2.verifyClaim(c2);
  assert.equal(r2.code, "NULLIFIER_COLLISION");
});

test("hostile: commitment_version true / string / negative / oversized", () => {
  const cases = [
    [true, "TYPE_ERROR"],
    ["1", "TYPE_ERROR"],
    [-1, "TYPE_ERROR"],
    [2 ** 32, "TYPE_ERROR"],
  ];
  for (const [ver, expect] of cases) {
    const v = openVerifier();
    const c = baseClaim();
    c.commitment_version = ver;
    const r = typedReject(() => v.verifyClaim(c));
    assert.equal(r.kind, "result", `version=${ver} crashed`);
    assert.equal(r.code, expect, `version=${ver} got ${r.code}`);
  }
});

test("hostile: embedded NUL and Unicode in chain/epoch/charity ids", () => {
  const v = openVerifier();
  for (const field of ["new_ledger_chain_id", "epoch_id", "charity_id"]) {
    const c = baseClaim();
    c[field] = c[field] + "\u0000evil";
    const r = v.verifyClaim(c);
    // Must not crash; should reject as replay/unknown/commitment
    assert.ok(!r.ok, field);
    assert.ok(typeof r.code === "string" && r.code !== "OK", r.code);
  }
  const c2 = baseClaim();
  c2.charity_id = "CHARITY_ALPHA\u0301"; // Unicode lookalike
  const r2 = v.verifyClaim(c2);
  assert.ok(!r2.ok);
});

test("hostile: uppercase / malformed / odd-length / empty hex", () => {
  const fields = [
    ["donation_txid_hex", "AC3C1D41ABA49D7207C47D8927EF25D01B05A3570EF51E0614AE8599C5A1CF24"],
    ["donation_txid_hex", "zz".repeat(32)],
    ["donation_txid_hex", "abc"],
    ["donation_txid_hex", ""],
    ["pq_destination_public_key_hex", ""],
    ["commitment_nonce_hex", "A1".repeat(16)],
  ];
  for (const [field, val] of fields) {
    const v = openVerifier();
    const c = baseClaim();
    c[field] = val;
    const r = typedReject(() => v.verifyClaim(c));
    assert.notEqual(r.kind, "value");
    if (r.kind === "result") assert.notEqual(r.code, "OK");
    // throws are also acceptable typed constructor/type failures inside verify
    if (r.kind === "throw") {
      recordFinding(`hex_throw_${field}`, { severity: "FINDING", detail: r.code });
    }
  }
});

test("hostile: malformed PQ domain hex is typed rejection not crash", () => {
  const v = openVerifier();
  const c = baseClaim();
  c.pq_sig_domain_bytes = "GG"; // invalid hex
  const r = typedReject(() => v.verifyClaim(c));
  assert.equal(r.kind, "result", "malformed domain must not throw uncaught");
  assert.equal(r.code, "PQ_DOMAIN_INVALID");

  const c2 = baseClaim();
  c2.pq_sig_domain_bytes = "ab"; // odd? actually even but 1 byte wrong domain
  const r2 = v.verifyClaim(c2);
  assert.ok(["PQ_DOMAIN_INVALID", "PQ_SIGNATURE_INVALID", "PQ_KEY_WRONG"].includes(r2.code));
});

test("hostile: bool in integer fields", () => {
  const v = openVerifier();
  const c = baseClaim();
  c.amount_sats = true;
  assert.equal(v.verifyClaim(c).code, "TYPE_ERROR");
  const c2 = baseClaim();
  c2.donation_vout = false;
  assert.equal(v.verifyClaim(c2).code, "TYPE_ERROR");
});

test("hostile: missing and extra required keys", () => {
  const v = openVerifier();
  const c = baseClaim();
  delete c.pq_signature_hex;
  assert.equal(v.verifyClaim(c).code, "MISSING_FIELD");
});

test("hostile: exact and malformed OP_RETURN carriers", () => {
  const v = openVerifier();
  const c = baseClaim();
  // substring carrier: embed commitment in longer script — unsupported form
  const commit = c.declared_commitment_hex;
  c.transaction.outputs[1].script_pubkey_hex = "6a20" + commit + "00";
  // length no longer 68 / not supported
  let r = v.verifyClaim(c);
  assert.ok(["UNSUPPORTED_TX_FORM", "UNSUPPORTED_SCRIPT_FORM", "COMMITMENT_INVALID"].includes(r.code), r.code);

  const c2 = baseClaim();
  // wrong push opcode
  c2.transaction.outputs[1].script_pubkey_hex = "6a4c20" + commit;
  r = v.verifyClaim(c2);
  assert.notEqual(r.code, "OK");

  const c3 = baseClaim();
  // claim-only carrier: remove OP_RETURN
  c3.transaction.outputs = [c3.transaction.outputs[0]];
  // txid will change → malleability or commitment missing
  r = v.verifyClaim(c3);
  assert.notEqual(r.code, "OK");
});

test("hostile: duplicate and conflicting commitment outputs", () => {
  const v = openVerifier();
  const c = baseClaim();
  const carrier = c.transaction.outputs[1];
  c.transaction.outputs.push({ ...carrier }); // duplicate same commitment
  // identity changes
  let r = v.verifyClaim(c);
  assert.notEqual(r.code, "OK");

  const c2 = baseClaim();
  c2.transaction.outputs.push({
    script_pubkey_hex: "6a20" + "11".repeat(32),
    value_sats: 0,
  });
  r = v.verifyClaim(c2);
  assert.notEqual(r.code, "OK");
});

test("hostile: negative boolean oversized merkle indices and branches", () => {
  assert.equal(verifyMerkleProof("aa".repeat(32), "bb".repeat(32), [], -1), false);
  assert.equal(verifyMerkleProof("aa".repeat(32), "bb".repeat(32), [], true), false);
  assert.equal(verifyMerkleProof("aa".repeat(32), "bb".repeat(32), [], 2 ** 40), false);
  const longBranch = Array(65).fill("cc".repeat(32));
  assert.equal(verifyMerkleProof("aa".repeat(32), "bb".repeat(32), longBranch, 0), false);
  assert.equal(verifyMerkleProof("aa".repeat(32), "bb".repeat(32), ["zz"], 0), false);
});

test("hostile: truncated header ancestry / mismatched tip / forged intermediary", () => {
  const ctx = load(path.join(DESIGN, "genesis/CONTEXT.json"));
  // tip hash points to height 120 but supply tip_height 119
  const r1 = typedReject(() =>
    openVerifier({ tip_height: 119 }),
  );
  assert.equal(r1.kind, "throw");
  assert.equal(r1.code, "CHECKPOINT_MISMATCH");

  // forged intermediary: break prev link height
  const headers = deepClone(ctx.headers);
  const mid = headers.find((h) => h.height === 110);
  mid.height = 999; // breaks link and hash
  const r2 = typedReject(() =>
    openVerifier({
      headers,
      tip_height: ctx.tip_height,
      tip_hash_hex: ctx.tip_hash_hex,
    }),
  );
  assert.equal(r2.kind, "throw");

  // truncated chain: only tip header without ancestors still walks to missing prev
  const tip = headers[headers.length - 1] || ctx.headers[ctx.headers.length - 1];
  const onlyTip = [deepClone(ctx.headers[ctx.headers.length - 1])];
  // recompute — tip alone is OK if prev not in map (walk stops); height match required
  const r3 = typedReject(() =>
    openVerifier({
      headers: onlyTip,
      tip_height: onlyTip[0].height,
      tip_hash_hex: onlyTip[0].header_hash_hex,
      epoch: {
        ...load(path.join(DESIGN, "genesis/EPOCH_OPEN.json")),
        last_clean_source_height: onlyTip[0].height,
        last_clean_source_header_hash_hex: onlyTip[0].header_hash_hex,
      },
    }),
  );
  // Construction may succeed (ancestry walk ends when prev missing) — design risk
  if (r3.kind === "value" || r3.kind === "throw") {
    recordFinding("truncated_header_ancestry", {
      severity: "FINDING",
      note: "Truncated tip-only header map may construct successfully; inclusion of deep blocks then fails ancestry.",
      construct: r3.kind,
      code: r3.code,
    });
  }
  void tip;
});

test("hostile: insufficient confirmations with complete valid shorter chain", () => {
  // Build tip at height 104 with full ancestry 100..104 so min_conf=6 fails for height 100
  const ctx = load(path.join(DESIGN, "genesis/CONTEXT.json"));
  const headers = ctx.headers.filter((h) => h.height <= 104);
  const tip = headers[headers.length - 1];
  const epoch = {
    ...load(path.join(DESIGN, "genesis/EPOCH_OPEN.json")),
    last_clean_source_height: tip.height,
    last_clean_source_header_hash_hex: tip.header_hash_hex,
  };
  const v = openVerifier({
    headers,
    tip_height: tip.height,
    tip_hash_hex: tip.header_hash_hex,
    epoch,
  });
  const c = baseClaim();
  // inclusion at 100, tip 104 => conf = 5 < 6
  const r = v.verifyClaim(c);
  assert.equal(r.code, "INSUFFICIENT_CONFIRMATIONS");
});

test("hostile: stale and conflicting checkpoints via claimed_checkpoint", () => {
  const v = openVerifier();
  const c = baseClaim();
  c.claimed_checkpoint = {
    schema: "SourceHeaderCheckpoint",
    height: 100,
    header_hash_hex: ctxHeader(100),
    prev_hash_hex: "00".repeat(32),
    merkle_root_hex: "00".repeat(32),
  };
  assert.equal(v.verifyClaim(c).code, "STALE_CHECKPOINT");

  const c2 = baseClaim();
  c2.claimed_checkpoint = {
    height: 999,
    header_hash_hex: "ee".repeat(32),
  };
  assert.equal(v.verifyClaim(c2).code, "CONFLICTING_CHECKPOINT");
});

function ctxHeader(height) {
  const ctx = load(path.join(DESIGN, "genesis/CONTEXT.json"));
  return ctx.headers.find((h) => h.height === height).header_hash_hex;
}

test("hostile: cutoff boundary and cutoff plus one", () => {
  // Construct tip == last_clean == 100 with conf enough: need tip >= 105 for conf>=6 from 100
  // Boundary: inclusion height == last_clean admitted
  const ctx = load(path.join(DESIGN, "genesis/CONTEXT.json"));
  const headers = ctx.headers.filter((h) => h.height <= 120);
  // Use full chain tip 120, set last_clean to 100 by relaxing constructor? Design binds last_clean to tip.
  // So true boundary test: tip at 100 with min_confirmations reduced.
  const h100 = ctx.headers.find((h) => h.height === 100);
  const chain = [];
  // build synthetic chain heights 95..100? We only have from 100. Use single header tip 100, min_conf=1
  const epoch = {
    ...load(path.join(DESIGN, "genesis/EPOCH_OPEN.json")),
    last_clean_source_height: 100,
    last_clean_source_header_hash_hex: h100.header_hash_hex,
    min_confirmations: 1,
  };
  const v = openVerifier({
    headers: [h100],
    tip_height: 100,
    tip_hash_hex: h100.header_hash_hex,
    epoch,
  });
  const c = baseClaim();
  assert.equal(v.verifyClaim(c).code, "OK");

  // cutoff + 1: claim inclusion height 101 > last_clean 100
  const h101 = ctx.headers.find((h) => h.height === 101);
  const epoch2 = {
    ...epoch,
    last_clean_source_height: 100,
    // cannot bind tip 101 with last_clean 100 under constructor — use tip 101 and last_clean 101 then override check via inclusion on 101 with last_clean 100 impossible at construct
  };
  // Represent cutoff+1 by tip=101 last_clean=101 but claim height 101 is OK; instead mutate proof height mismatch path:
  // Use tip 101, last_clean 101, but we'll test INCLUSION_AFTER_CUTOFF by temporarily using verifier with last_clean 100 impossible.
  // Executable approach: open with tip=120 full chain, then verify with a claim whose block_height is 121 not in map → HEADER_ANCESTRY.
  // Better: fork constructor validation by building verifier then mutating epoch (simulates policy bug)
  const v3 = openVerifier();
  v3.epoch = { ...v3.epoch, last_clean_source_height: 100 };
  const c3 = baseClaim();
  // inclusion at 100 <= 100 OK
  assert.equal(v3.verifyClaim(c3).code, "OK");
  // For height 101 need a claim included at 101 — use multi-out which is at 101
  const multi = load(path.join(DESIGN, "valid/claim_multi_out0.json"));
  const r = v3.verifyClaim(multi);
  assert.equal(r.code, "INCLUSION_AFTER_CUTOFF");
  void headers;
  void h101;
  void epoch2;
});

test("hostile: admission followed by reorg and nullifier rollback", () => {
  const v = openVerifier();
  const c = baseClaim();
  const r = v.verifyClaim(c);
  assert.equal(r.ok, true);
  assert.ok(v.nullifiers.has(r.nullifier_hex));
  // Reorg: new tip without inclusion header
  const ctx = load(path.join(DESIGN, "genesis/CONTEXT.json"));
  const alien = {
    bits: 486604799,
    height: 120,
    merkle_root_hex: "99".repeat(32),
    prev_hash_hex: "00".repeat(32),
    time: 1700000999,
  };
  alien.header_hash_hex = headerHash(alien);
  const epoch = {
    ...load(path.join(DESIGN, "genesis/EPOCH_OPEN.json")),
    last_clean_source_height: 120,
    last_clean_source_header_hash_hex: alien.header_hash_hex,
  };
  // Historical re-verify under new tip should fail ancestry; nullifier should be rolled back by operator policy
  const v2 = openVerifier({
    headers: [alien],
    tip_height: 120,
    tip_hash_hex: alien.header_hash_hex,
    epoch,
    nullifiers: v.nullifiers,
  });
  const hist = v2.verifyHistoricalClaim(c);
  assert.equal(hist.code, "HEADER_ANCESTRY_INVALID");
  // Rollback nullifier after failed reorg check
  v.nullifiers.unconsume(r.nullifier_hex);
  assert.equal(v.nullifiers.has(r.nullifier_hex), false);
  void ctx;
});

test("hostile: allocation record mutations width overflow excess issuance", () => {
  const alloc = load(path.join(DESIGN, "valid/allocation_after_epoch.json"));
  assertSupplyInvariant(alloc);

  const mut = deepClone(alloc);
  mut.total_issued = mut.fixed_bitcoin_genesis_pool + 1;
  assert.throws(() => assertSupplyInvariant(mut), AllocationError);

  const mut2 = deepClone(alloc);
  mut2.claims[0].allocation += 1;
  assert.throws(() => assertSupplyInvariant(mut2), AllocationError);

  const mut3 = deepClone(alloc);
  mut3.claims = [...mut3.claims, mut3.claims[0]]; // duplicate nullifier
  assert.throws(() => assertSupplyInvariant(mut3), AllocationError);

  assert.throws(
    () =>
      allocateProportional({
        fixed_bitcoin_genesis_pool: 10,
        eligible_by_nullifier: [["aa".repeat(32), 3], ["bb".repeat(32), 7]],
        epoch_id: "e",
      }) &&
      assertSupplyInvariant({
        ...allocateProportional({
          fixed_bitcoin_genesis_pool: 10,
          eligible_by_nullifier: [["aa".repeat(32), 3], ["bb".repeat(32), 7]],
          epoch_id: "e",
        }),
        total_issued: 11,
        remainder_unissued: -1,
      }),
  );

  // excess issuance attempt
  const good = allocateProportional({
    fixed_bitcoin_genesis_pool: 1000,
    eligible_by_nullifier: [
      ["11".repeat(32), 1],
      ["22".repeat(32), 2],
      ["33".repeat(32), 3],
    ],
    epoch_id: "e",
  });
  assert.ok(good.total_issued <= 1000);
  assert.equal(good.total_issued + good.remainder_unissued, 1000);
});

test("hostile: duplicate JSON keys — document parser behavior", () => {
  // Node JSON.parse: last-key-wins
  const raw = '{"a":1,"a":2}';
  const parsed = JSON.parse(raw);
  assert.equal(parsed.a, 2);
  recordFinding("duplicate_json_keys_last_wins", {
    severity: "INFO",
    note: "Node JSON.parse last-key-wins; diverges from parsers that reject duplicates.",
  });
});

test("hostile: write minimized counterexamples and findings", () => {
  fs.mkdirSync(HOSTILE_DIR, { recursive: true });
  fs.mkdirSync(RESULTS, { recursive: true });

  const cases = {
    commitment_version_true: { commitment_version: true, expect: "TYPE_ERROR" },
    commitment_version_string: { commitment_version: "1", expect: "TYPE_ERROR" },
    nullifier_field_disagreement: { nullifier_hex: "ff".repeat(32), expect: "NULLIFIER_COLLISION" },
    pq_domain_malformed: { pq_sig_domain_bytes: "not-hex", expect: "PQ_DOMAIN_INVALID" },
    amount_bool: { amount_sats: true, expect: "TYPE_ERROR" },
  };
  const matrix = [];
  for (const [name, spec] of Object.entries(cases)) {
    const c = baseClaim();
    Object.assign(c, spec);
    delete c.expect;
    const v = openVerifier();
    const r = typedReject(() => v.verifyClaim(c));
    const entry = {
      name,
      expect: spec.expect,
      actual: r.kind === "result" ? r.code : r.kind === "throw" ? `THROW:${r.code}` : "VALUE",
      agree: r.kind === "result" && r.code === spec.expect,
    };
    matrix.push(entry);
    fs.writeFileSync(
      path.join(HOSTILE_DIR, `${name}.json`),
      JSON.stringify({ claim: c, expected_code: spec.expect, result: entry }, null, 2) + "\n",
    );
  }

  // Reference Python crash probe: pq_sig_domain_bytes invalid hex
  // Document expected differential if Python throws
  matrix.push({
    name: "python_pq_domain_hex_crash_probe",
    note: "Python reference uses bytes.fromhex(domain) without try/except in verify path — possible uncaught ValueError",
  });

  fs.writeFileSync(
    path.join(RESULTS, "HOSTILE_FINDINGS.json"),
    JSON.stringify({ findings, matrix }, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(RESULTS, "MINIMIZED_COUNTEREXAMPLES.json"),
    JSON.stringify(matrix, null, 2) + "\n",
  );

  for (const m of matrix) {
    if (m.agree === false) {
      recordFinding("hostile_mismatch_" + m.name, m);
    }
  }
});
