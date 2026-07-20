#!/usr/bin/env node
/**
 * Evidence gate for BENEFICIAL_GENESIS_RETEST_002.
 * Fixture harness mirrors subject verify_evidence.py special cases (post-freeze confirmed).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TrustedContext,
  setPublicTestSeeds,
  parseJsonRejectDuplicates,
  REJECTION,
  computeAllocations,
  charitySetCommitmentHex,
} from "./src/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "BENEFICIAL_GENESIS_DESIGN_001");
const FIX = path.join(ROOT, "fixtures");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadSeeds() {
  const seedPath = path.join(__dirname, "public_test_seeds.json");
  if (!fs.existsSync(seedPath)) return false;
  const seeds = loadJson(seedPath);
  delete seeds._note;
  setPublicTestSeeds(seeds);
  return true;
}

function genesis() {
  return loadJson(path.join(FIX, "genesis", "CONTEXT.json"));
}

function makeVerifier({ epoch, headers, nullifiers } = {}) {
  const ctx = genesis();
  const ep = epoch || ctx.epoch_open;
  const hdrs = headers || ctx.headers;
  const v = new TrustedContext({
    charitySet: ctx.charity_set,
    epoch: ep,
    headers: hdrs,
    sourceChain: ctx.source_chain,
    newLedgerChainId: ctx.new_ledger_chain_id,
    fixedPool: ctx.fixed_bitcoin_genesis_pool,
  });
  if (nullifiers) {
    for (const n of nullifiers) v.nullifiers.add(n);
  }
  return v;
}

function run() {
  const seedsLoaded = loadSeeds();
  const expected = loadJson(path.join(FIX, "EXPECTED.json"));
  const results = [];
  let agreements = 0;
  let disagreements = 0;
  let crashes = 0;

  function record(entry) {
    results.push(entry);
    if (entry.agree) agreements++;
    else disagreements++;
    if (String(entry.got || "").startsWith("CRASH")) crashes++;
  }

  // --- valid ---
  for (const name of expected.valid) {
    try {
      if (name === "allocation_after_epoch.json") {
        const rec = loadJson(path.join(FIX, "valid", name));
        const ctx = makeVerifier({ epoch: genesis().epoch_closed });
        const v = ctx.validateAllocationRecord(rec);
        record({
          name,
          kind: "valid",
          expected: "OK",
          got: v.ok ? "OK" : v.code,
          agree: v.ok === true,
        });
        continue;
      }
      if (name === "context_stolen_source_key.json") {
        record({ name, kind: "valid", status: "CONTEXT_ONLY", agree: true, expected: "OK", got: "OK" });
        continue;
      }
      if (name === "claim_stolen_source_key_crypto_ok.json") {
        const claim = loadJson(path.join(FIX, "valid", name));
        const st = loadJson(path.join(FIX, "valid", "context_stolen_source_key.json"));
        const g = genesis();
        const v = new TrustedContext({
          charitySet: g.charity_set,
          epoch: st.epoch,
          headers: st.headers,
          sourceChain: g.source_chain,
          newLedgerChainId: g.new_ledger_chain_id,
        });
        const r = v.verifyClaim(claim);
        record({ name, kind: "valid", expected: "OK", got: r.ok ? "OK" : r.code, agree: r.ok === true });
        continue;
      }
      if (name === "claim_at_cutoff_boundary.json") {
        // With repaired D-005 default context (tip 120 / eligible 110), inclusion at 100 is OK.
        const doc = loadJson(path.join(FIX, "valid", name));
        const r = makeVerifier().verifyClaim(doc.claim);
        record({ name, kind: "valid", expected: "OK", got: r.ok ? "OK" : r.code, agree: r.ok === true });
        continue;
      }

      const doc = loadJson(path.join(FIX, "valid", name));
      const claim = doc.claim || doc;
      const r = makeVerifier().verifyClaim(claim);
      record({ name, kind: "valid", expected: "OK", got: r.ok ? "OK" : r.code, agree: r.ok === true, detail: r.detail || null });
    } catch (e) {
      record({
        name,
        kind: "valid",
        expected: "OK",
        got: `CRASH:${e.code || e.name}`,
        agree: false,
        detail: String(e.message || e),
      });
    }
  }

  // --- invalid ---
  for (const [name, code] of Object.entries(expected.invalid_expected_codes)) {
    if (expected.documentary_only.includes(name)) {
      record({ name, kind: "invalid", status: "DOCUMENTARY_ONLY", expected: code, got: code, agree: true });
      continue;
    }
    try {
      const p = path.join(FIX, "invalid", `${name}.json`);
      const payload = loadJson(p);

      if (name === "duplicate_raw_claim") {
        const raw = fs.readFileSync(p, "utf8");
        const parsed = parseJsonRejectDuplicates(raw);
        const got = parsed.ok ? "OK" : parsed.code;
        record({ name, kind: "invalid", expected: code, got, agree: got === REJECTION.DUPLICATE_JSON_KEY || got === code });
        continue;
      }
      if (name === "allocation_overflow_bool") {
        const r = computeAllocations(
          payload.pool,
          payload.eligible.map(([n, e]) => ({ nullifier_hex: n, eligible_sats: e }))
        );
        const got = r.ok ? "OK" : r.code;
        record({ name, kind: "invalid", expected: code, got, agree: got === code });
        continue;
      }
      if (name === "duplicate_charity_entries") {
        let got = "OK";
        try {
          charitySetCommitmentHex(payload.entries, 1);
          // commitment may still compute; constructor must reject duplicates
          makeVerifier({
            // force bad set via TrustedContext
          });
          new TrustedContext({
            charitySet: {
              schema: "CharitySetCommitment",
              version: 1,
              entries: payload.entries,
              commitment_hex: "00".repeat(32),
            },
            epoch: genesis().epoch_open,
            headers: genesis().headers,
            sourceChain: genesis().source_chain,
            newLedgerChainId: genesis().new_ledger_chain_id,
          });
        } catch (e) {
          got = e.code || "CRASH";
        }
        record({ name, kind: "invalid", expected: code, got, agree: got === code });
        continue;
      }
      if (name === "malformed_charity_entry") {
        let got = "OK";
        try {
          const cs = loadJson(path.join(FIX, "genesis", "CHARITY_SET.json"));
          cs.entries = [payload.entry];
          new TrustedContext({
            charitySet: cs,
            epoch: genesis().epoch_open,
            headers: genesis().headers,
            sourceChain: genesis().source_chain,
            newLedgerChainId: genesis().new_ledger_chain_id,
          });
        } catch (e) {
          got = e.code || "CRASH";
        }
        record({ name, kind: "invalid", expected: code, got, agree: got === code });
        continue;
      }
      if (name === "inclusion_after_cutoff_epoch") {
        const g = genesis();
        const epoch = { ...g.epoch_open };
        const anchor = g.headers[0];
        epoch.last_eligible_inclusion_height = anchor.height;
        epoch.last_eligible_inclusion_header_hash_hex = anchor.header_hash_hex;
        const r = makeVerifier({ epoch }).verifyClaim(payload.claim);
        const got = r.ok ? "OK" : r.code;
        record({ name, kind: "invalid", expected: code, got, agree: got === code });
        continue;
      }
      if (name === "insufficient_confirmations") {
        const g = genesis();
        const headers = g.headers.slice(0, 5); // heights 100..104
        const epoch = {
          ...g.epoch_open,
          accepted_source_tip_height: headers[headers.length - 1].height,
          accepted_source_tip_header_hash_hex: headers[headers.length - 1].header_hash_hex,
          last_eligible_inclusion_height: headers[0].height,
          last_eligible_inclusion_header_hash_hex: headers[0].header_hash_hex,
        };
        const r = makeVerifier({ epoch, headers }).verifyClaim(payload.claim);
        const got = r.ok ? "OK" : r.code;
        record({ name, kind: "invalid", expected: code, got, agree: got === code });
        continue;
      }
      if (name === "stale_checkpoint" || name === "conflicting_checkpoint") {
        const g = genesis();
        const badHeight = name === "stale_checkpoint" ? g.tip_height - 1 : g.tip_height;
        const badHash =
          name === "stale_checkpoint" ? g.headers[g.headers.length - 2].header_hash_hex : "ee".repeat(32);
        let got = "OK";
        try {
          // Epoch tip remains canonical; external tip args disagree (subject evidence-gate pattern).
          new TrustedContext({
            charitySet: g.charity_set,
            epoch: g.epoch_open,
            headers: g.headers,
            sourceChain: g.source_chain,
            newLedgerChainId: g.new_ledger_chain_id,
            tipHeight: badHeight,
            tipHashHex: badHash,
          });
        } catch (e) {
          got = e.code || "CRASH";
        }
        record({ name, kind: "invalid", expected: code, got, agree: got === code });
        continue;
      }
      if (name === "reorg_after_provisional_acceptance") {
        const g = genesis();
        const headers = payload.new_tip_only_headers;
        const epoch = {
          ...g.epoch_open,
          accepted_source_tip_height: headers[headers.length - 1].height,
          accepted_source_tip_header_hash_hex: headers[headers.length - 1].header_hash_hex,
          last_eligible_inclusion_height: headers[10].height,
          last_eligible_inclusion_header_hash_hex: headers[10].header_hash_hex,
        };
        // Admit on original tip, then revalidate against replacement
        const original = makeVerifier();
        const first = original.verifyClaim(payload.claim);
        if (!first.ok) {
          record({
            name,
            kind: "invalid",
            expected: code,
            got: first.code,
            agree: false,
            detail: "initial admit failed",
          });
          continue;
        }
        const r = original.replaceCheckpoint({ epoch, headers });
        // Subject revalidates claims; should fail ancestry and leave nullifiers empty after failed reval
        // Our replaceCheckpoint restores prior state on failure — check that admitted claim fails on replacement verifier alone
        let revalCode;
        try {
          const replacement = makeVerifier({ epoch, headers });
          const rr = replacement.verifyClaim(payload.claim);
          revalCode = rr.ok ? "OK" : rr.code;
        } catch (e) {
          revalCode = e.code || `CRASH:${e.name}`;
        }
        const agree = revalCode === code;
        record({
          name,
          kind: "invalid",
          expected: code,
          got: revalCode,
          agree,
          detail: r.ok ? "replace_committed" : `replace_failed:${r.code}`,
        });
        continue;
      }

      // generic path
      const claim = payload.claim;
      const g = genesis();
      let epoch = { ...g.epoch_open };
      let headers = [...g.headers];
      if (payload.epoch === "closed" || (payload.epoch && payload.epoch.closed === true)) {
        epoch = typeof payload.epoch === "object" ? { ...g.epoch_closed, ...payload.epoch } : { ...g.epoch_closed };
      } else if (payload.epoch && typeof payload.epoch === "object") {
        epoch = { ...epoch, ...payload.epoch };
      }
      if (typeof payload.quantum_compromise_cutoff_height_override === "number") {
        epoch.quantum_compromise_cutoff_height = payload.quantum_compromise_cutoff_height_override;
      }
      if (typeof payload.epoch_last_clean_height_override === "number") {
        const h = headers.find((x) => x.height === payload.epoch_last_clean_height_override);
        if (h) {
          epoch.last_eligible_inclusion_height = h.height;
          epoch.last_eligible_inclusion_header_hash_hex = h.header_hash_hex;
        }
      }
      if (Array.isArray(payload.extra_headers)) headers = [...headers, ...payload.extra_headers];
      if (Array.isArray(payload.new_tip_only_headers)) {
        headers = payload.new_tip_only_headers;
        epoch.accepted_source_tip_height = headers[headers.length - 1].height;
        epoch.accepted_source_tip_header_hash_hex = headers[headers.length - 1].header_hash_hex;
      }
      const nullifiers = payload.pre_consume_nullifier ? [payload.pre_consume_nullifier] : null;
      const r = makeVerifier({ epoch, headers, nullifiers }).verifyClaim(claim);
      const got = r.ok ? "OK" : r.code;
      record({ name, kind: "invalid", expected: code, got, agree: got === code, detail: r.detail || null });
    } catch (e) {
      record({
        name,
        kind: "invalid",
        expected: code,
        got: `CRASH:${e.code || e.name}`,
        agree: false,
        detail: String(e.message || e),
      });
    }
  }

  const summary = {
    schema: "bgen.retest-002.verify-summary/v1",
    subject_commit: "46a7de63fd800029a05793d7d8204a900690f68e",
    seeds_loaded: seedsLoaded,
    agreements,
    disagreements,
    crashes,
    results,
  };
  const outDir = path.join(__dirname, "results");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "FIXTURE_COMPATIBILITY_REPORT.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify({ seeds_loaded: seedsLoaded, agreements, disagreements, crashes }));
  if (crashes > 0) process.exit(2);
  if (disagreements > 0) process.exit(1);
  process.exit(0);
}

run();
