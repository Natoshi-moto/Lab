import {
  ALLOCATION_CLAIM_KEYS,
  ALLOCATION_RECORD_KEYS,
  REJECTION,
  REMAINDER_HANDLING,
} from "./constants.mjs";
import { isLowerHex, requireExactKeys, requireU64 } from "./encoding.mjs";

/**
 * Proportional floor allocation with unissued remainder.
 * allocation_i = floor(pool * eligible_i / total)
 * Rejects non-integer / boolean weights as ARITHMETIC_OVERFLOW.
 */
export function computeAllocations(pool, eligibleRows) {
  // eligibleRows: [{ nullifier_hex, eligible_sats }, ...]
  if (typeof pool === "boolean" || typeof pool !== "number" || !Number.isInteger(pool) || pool < 0) {
    return { ok: false, code: REJECTION.ARITHMETIC_OVERFLOW };
  }
  if (!Array.isArray(eligibleRows)) {
    return { ok: false, code: REJECTION.TYPE_ERROR };
  }

  let total = 0;
  for (const row of eligibleRows) {
    const e = row.eligible_sats;
    if (typeof e === "boolean" || typeof e !== "number" || !Number.isInteger(e) || e < 0) {
      return { ok: false, code: REJECTION.ARITHMETIC_OVERFLOW };
    }
    total += e;
    if (!Number.isSafeInteger(total)) {
      return { ok: false, code: REJECTION.ARITHMETIC_OVERFLOW };
    }
  }

  if (total === 0) {
    return {
      ok: true,
      claims: [],
      total_eligible_sats: 0,
      total_issued: 0,
      remainder_unissued: pool,
    };
  }

  const claims = [];
  let issued = 0;
  for (const row of eligibleRows) {
    // floor(pool * e / total) via integer arithmetic
    const alloc = Math.floor((pool * row.eligible_sats) / total);
    if (!Number.isSafeInteger(alloc) || alloc < 0) {
      return { ok: false, code: REJECTION.ARITHMETIC_OVERFLOW };
    }
    claims.push({
      nullifier_hex: row.nullifier_hex,
      eligible_sats: row.eligible_sats,
      allocation: alloc,
    });
    issued += alloc;
  }

  if (issued > pool) {
    return { ok: false, code: REJECTION.ALLOCATION_EXCEEDS_POOL };
  }

  // Canonical ordering: nullifier_hex ascending
  const ordered = [...claims].sort((a, b) =>
    a.nullifier_hex < b.nullifier_hex ? -1 : a.nullifier_hex > b.nullifier_hex ? 1 : 0
  );

  return {
    ok: true,
    claims: ordered,
    total_eligible_sats: total,
    total_issued: issued,
    remainder_unissued: pool - issued,
  };
}

export function validateAllocationRecord(record, expectedBinding = null) {
  const shape = requireExactKeys(record, ALLOCATION_RECORD_KEYS, []);
  // epoch_checkpoint_binding is in required keys list
  if (!shape.ok) {
    // allow missing optional? schema has it as non-required in one view but present in fixtures
    if (shape.code === "MISSING_FIELD" && shape.field === "epoch_checkpoint_binding") {
      // still require for this retest against repaired fixtures
    }
    return { ok: false, code: shape.code === "UNKNOWN_FIELD" ? REJECTION.UNKNOWN_FIELD : REJECTION.TYPE_ERROR };
  }

  if (record.schema !== "GenesisAllocationRecord") {
    return { ok: false, code: REJECTION.TYPE_ERROR };
  }
  if (record.remainder_handling !== REMAINDER_HANDLING) {
    return { ok: false, code: REJECTION.ALLOCATION_NONCANONICAL };
  }
  const poolCheck = requireU64(record.fixed_bitcoin_genesis_pool);
  if (!poolCheck.ok) return { ok: false, code: REJECTION.ARITHMETIC_OVERFLOW };

  if (!Array.isArray(record.claims)) return { ok: false, code: REJECTION.TYPE_ERROR };

  const rows = [];
  let prev = null;
  const seen = new Set();
  for (const c of record.claims) {
    const cs = requireExactKeys(c, ALLOCATION_CLAIM_KEYS);
    if (!cs.ok) return { ok: false, code: REJECTION.UNKNOWN_FIELD };
    if (!isLowerHex(c.nullifier_hex, 32)) return { ok: false, code: REJECTION.TYPE_ERROR };
    if (seen.has(c.nullifier_hex)) return { ok: false, code: REJECTION.ALLOCATION_NONCANONICAL };
    seen.add(c.nullifier_hex);
    if (prev !== null && c.nullifier_hex < prev) {
      return { ok: false, code: REJECTION.ALLOCATION_NONCANONICAL };
    }
    prev = c.nullifier_hex;
    const e = requireU64(c.eligible_sats);
    const a = requireU64(c.allocation);
    if (!e.ok || !a.ok) return { ok: false, code: REJECTION.ARITHMETIC_OVERFLOW };
    rows.push({ nullifier_hex: c.nullifier_hex, eligible_sats: c.eligible_sats });
  }

  const computed = computeAllocations(record.fixed_bitcoin_genesis_pool, rows);
  if (!computed.ok) return computed;

  if (
    computed.total_eligible_sats !== record.total_eligible_sats ||
    computed.total_issued !== record.total_issued ||
    computed.remainder_unissued !== record.remainder_unissued
  ) {
    return { ok: false, code: REJECTION.ALLOCATION_NONCANONICAL };
  }

  for (let i = 0; i < computed.claims.length; i++) {
    if (
      computed.claims[i].nullifier_hex !== record.claims[i].nullifier_hex ||
      computed.claims[i].allocation !== record.claims[i].allocation ||
      computed.claims[i].eligible_sats !== record.claims[i].eligible_sats
    ) {
      return { ok: false, code: REJECTION.ALLOCATION_NONCANONICAL };
    }
  }

  if (expectedBinding) {
    const b = record.epoch_checkpoint_binding;
    if (!b || typeof b !== "object") return { ok: false, code: REJECTION.CHECKPOINT_MISMATCH };
    for (const k of [
      "accepted_source_tip_header_hash_hex",
      "accepted_source_tip_height",
      "last_eligible_inclusion_header_hash_hex",
      "last_eligible_inclusion_height",
    ]) {
      if (b[k] !== expectedBinding[k]) {
        return { ok: false, code: REJECTION.CHECKPOINT_MISMATCH };
      }
    }
  }

  return { ok: true, code: REJECTION.OK };
}
