/**
 * Fixed-pool proportional allocation with integer-only arithmetic.
 */

import { MAX_SATS_NUM, PROTOCOL_VERSION } from "./constants.mjs";
import { requireHex } from "./encoding.mjs";

export class AllocationError extends Error {
  constructor(code, detail = "") {
    super(detail || code);
    this.code = code;
    this.name = "AllocationError";
  }
}

function asNonNegInt(name, value) {
  if (typeof value === "boolean") {
    throw new AllocationError("ARITHMETIC_OVERFLOW", `${name} must be int`);
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new AllocationError("ARITHMETIC_OVERFLOW", `${name} must be int`);
  }
  if (value < 0 || value > MAX_SATS_NUM) {
    throw new AllocationError("ARITHMETIC_OVERFLOW", `${name} out of range`);
  }
  return value;
}

export function allocateProportional({
  fixed_bitcoin_genesis_pool,
  eligible_by_nullifier,
  epoch_id,
}) {
  const pool = asNonNegInt("fixed_bitcoin_genesis_pool", fixed_bitcoin_genesis_pool);
  if (pool === 0) throw new AllocationError("ARITHMETIC_OVERFLOW", "pool must be positive");

  const seen = new Set();
  const cleaned = [];
  for (const [nullifierHex, eligible] of eligible_by_nullifier) {
    if (typeof nullifierHex !== "string" || nullifierHex.length !== 64) {
      throw new AllocationError("TYPE_ERROR", "nullifier_hex");
    }
    if (seen.has(nullifierHex)) {
      throw new AllocationError("NULLIFIER_ALREADY_CONSUMED", nullifierHex);
    }
    seen.add(nullifierHex);
    const e = asNonNegInt("eligible_sats", eligible);
    if (e <= 0) throw new AllocationError("AMOUNT_NOT_POSITIVE", nullifierHex);
    cleaned.push([nullifierHex, e]);
  }

  cleaned.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const totalEligible = cleaned.reduce((s, [, e]) => s + e, 0);
  if (totalEligible <= 0 || totalEligible > MAX_SATS_NUM) {
    throw new AllocationError("AMOUNT_NOT_POSITIVE", "total_eligible");
  }

  const rows = [];
  let totalIssued = 0;
  for (const [nullifierHex, eligible] of cleaned) {
    // Use BigInt for intermediate product safety beyond Number precision for large pools.
    const alloc = Number((BigInt(pool) * BigInt(eligible)) / BigInt(totalEligible));
    totalIssued += alloc;
    rows.push({
      allocation: alloc,
      eligible_sats: eligible,
      nullifier_hex: nullifierHex,
    });
  }

  if (totalIssued > pool) throw new AllocationError("ALLOCATION_EXCEEDS_POOL");
  const remainder = pool - totalIssued;
  if (remainder < 0) throw new AllocationError("ALLOCATION_EXCEEDS_POOL");

  return {
    claims: rows,
    epoch_id,
    fixed_bitcoin_genesis_pool: pool,
    remainder_handling: "UNISSUED_FLOOR_REMAINDER",
    remainder_unissued: remainder,
    schema: "GenesisAllocationRecord",
    total_eligible_sats: totalEligible,
    total_issued: totalIssued,
    version: PROTOCOL_VERSION,
  };
}

export function assertSupplyInvariant(record) {
  const required = new Set([
    "claims",
    "epoch_id",
    "fixed_bitcoin_genesis_pool",
    "remainder_handling",
    "remainder_unissued",
    "schema",
    "total_eligible_sats",
    "total_issued",
    "version",
  ]);
  if (!record || typeof record !== "object" || ![...required].every((k) => k in record) ||
      Object.keys(record).length !== required.size) {
    // allow exact key set
    if (!record || typeof record !== "object" ||
        new Set(Object.keys(record)).size !== required.size ||
        ![...required].every((k) => k in record)) {
      throw new AllocationError("ALLOCATION_NONCANONICAL", "record shape");
    }
  }
  if (
    new Set(Object.keys(record)).size !== required.size ||
    ![...required].every((k) => Object.prototype.hasOwnProperty.call(record, k))
  ) {
    throw new AllocationError("ALLOCATION_NONCANONICAL", "record shape");
  }
  if (record.schema !== "GenesisAllocationRecord" || record.version !== PROTOCOL_VERSION) {
    throw new AllocationError("ALLOCATION_NONCANONICAL", "schema/version");
  }
  if (typeof record.epoch_id !== "string" || !record.epoch_id) {
    throw new AllocationError("TYPE_ERROR", "epoch_id");
  }
  if (record.remainder_handling !== "UNISSUED_FLOOR_REMAINDER") {
    throw new AllocationError("ALLOCATION_NONCANONICAL", "remainder handling");
  }
  const pool = asNonNegInt("fixed_bitcoin_genesis_pool", record.fixed_bitcoin_genesis_pool);
  const issued = asNonNegInt("total_issued", record.total_issued);
  const rem = asNonNegInt("remainder_unissued", record.remainder_unissued);
  const totalEligible = asNonNegInt("total_eligible_sats", record.total_eligible_sats);
  const claims = record.claims;
  if (!Array.isArray(claims) || !claims.length || totalEligible === 0) {
    throw new AllocationError("ALLOCATION_NONCANONICAL", "claims/total");
  }
  const nullifiers = [];
  let eligibleSum = 0;
  let allocationSum = 0;
  for (const row of claims) {
    if (
      !row ||
      typeof row !== "object" ||
      new Set(Object.keys(row)).size !== 3 ||
      !("allocation" in row && "eligible_sats" in row && "nullifier_hex" in row)
    ) {
      throw new AllocationError("ALLOCATION_NONCANONICAL", "row shape");
    }
    const n = row.nullifier_hex;
    try {
      requireHex("nullifier_hex", n, { expectedBytes: 32 });
    } catch {
      throw new AllocationError("TYPE_ERROR", "nullifier_hex");
    }
    if (n !== n.toLowerCase()) {
      throw new AllocationError("TYPE_ERROR", "nullifier_hex lowercase");
    }
    nullifiers.push(n);
    eligibleSum += asNonNegInt("eligible_sats", row.eligible_sats);
    allocationSum += asNonNegInt("allocation", row.allocation);
  }
  if (nullifiers.length !== new Set(nullifiers).size ||
      JSON.stringify(nullifiers) !== JSON.stringify([...nullifiers].sort())) {
    throw new AllocationError("ALLOCATION_NONCANONICAL", "nullifier order/uniqueness");
  }
  if (eligibleSum !== totalEligible) {
    throw new AllocationError("ALLOCATION_NONCANONICAL", "eligible sum mismatch");
  }
  if (issued + rem !== pool) {
    throw new AllocationError("ALLOCATION_EXCEEDS_POOL", "issued+remainder != pool");
  }
  if (issued > pool) throw new AllocationError("ALLOCATION_EXCEEDS_POOL");
  if (allocationSum !== issued) {
    throw new AllocationError("ALLOCATION_NONCANONICAL", "sum mismatch");
  }
  for (const row of claims) {
    const expected = Number(
      (BigInt(pool) * BigInt(row.eligible_sats)) / BigInt(totalEligible),
    );
    if (row.allocation !== expected) {
      throw new AllocationError("ALLOCATION_NONCANONICAL", row.nullifier_hex);
    }
  }
}
