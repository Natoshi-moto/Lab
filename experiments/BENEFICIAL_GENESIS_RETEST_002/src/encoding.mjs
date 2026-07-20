import crypto from "node:crypto";
import { DOMAINS } from "./constants.mjs";

export function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest();
}

export function u32be(n) {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 0xffffffff) {
    throw new TypeError("u32be range");
  }
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

export function u64be(n) {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || !Number.isSafeInteger(n)) {
    throw new TypeError("u64be range");
  }
  const b = Buffer.alloc(8);
  b.writeBigUInt64BE(BigInt(n));
  return b;
}

/** domain_hash(domain, parts...) = SHA256(domain || 0x00 || u32be(len)||part ...) */
export function domainHash(domain, parts) {
  const chunks = [Buffer.from(domain, "ascii"), Buffer.from([0x00])];
  for (const p of parts) {
    const pb = Buffer.isBuffer(p) ? p : Buffer.from(p);
    chunks.push(u32be(pb.length), pb);
  }
  return sha256(Buffer.concat(chunks));
}

/**
 * Canonical JSON: UTF-8, sorted keys, separators (",", ":"), ensure_ascii.
 * Matches Python json.dumps(sort_keys=True, separators=(',', ':'), ensure_ascii=True)
 * for the JSON subset used by fixtures (no non-ascii, no NaN).
 */
export function canonicalJson(value) {
  return canonicalize(value);
}

function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non-finite number");
    if (Object.is(value, -0)) return "0";
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalize(v)).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(",")}}`;
  }
  throw new TypeError(`unsupported JSON type ${typeof value}`);
}

export function isLowerHex(s, lenBytes = null) {
  if (typeof s !== "string") return false;
  if (!/^[0-9a-f]+$/.test(s)) return false;
  if (s.length % 2 !== 0) return false;
  if (lenBytes !== null && s.length !== lenBytes * 2) return false;
  return true;
}

export function parseHexStrict(s, lenBytes = null) {
  if (!isLowerHex(s, lenBytes)) {
    const err = new Error("malformed hex");
    err.code = "TYPE_ERROR";
    throw err;
  }
  return Buffer.from(s, "hex");
}

export function requireExactKeys(obj, requiredKeys, optionalKeys = []) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, code: "TYPE_ERROR" };
  }
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  for (const k of Object.keys(obj)) {
    if (!allowed.has(k)) return { ok: false, code: "UNKNOWN_FIELD", field: k };
  }
  for (const k of requiredKeys) {
    if (!(k in obj)) return { ok: false, code: "MISSING_FIELD", field: k };
  }
  return { ok: true };
}

/** Strict integer: typeof number, integer, not boolean, within [0, max]. */
export function requireUInt(value, max, { allowBoolean = false } = {}) {
  if (typeof value === "boolean" && !allowBoolean) {
    return { ok: false, code: "TYPE_ERROR" };
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { ok: false, code: "TYPE_ERROR" };
  }
  if (value < 0 || value > max) {
    return { ok: false, code: "TYPE_ERROR" };
  }
  return { ok: true };
}

export function requireU32(value) {
  return requireUInt(value, 0xffffffff);
}

export function requireU64(value) {
  return requireUInt(value, Number.MAX_SAFE_INTEGER);
}

export function isSupportedScriptHex(scriptHex) {
  if (!isLowerHex(scriptHex)) return false;
  // 0014 || program20  => 4 + 40 = 44 hex chars
  if (scriptHex.length === 44 && /^0014[0-9a-f]{40}$/.test(scriptHex)) return true;
  // 6a20 || digest32 => 4 + 64 = 68 hex chars
  if (scriptHex.length === 68 && /^6a20[0-9a-f]{64}$/.test(scriptHex)) return true;
  return false;
}

export function commitmentCarrierScript(commitmentHex) {
  return `6a20${commitmentHex}`;
}

export function donationCommitmentHex(fields) {
  // DOMAIN || 0x00 || chain || 0x00 || epoch || 0x00 || charity || 0x00 ||
  // u32be(vout) || u64be(amount) || pq_pk || nonce16 || u32be(version)
  const pre = Buffer.concat([
    Buffer.from(DOMAINS.donation_commitment, "ascii"),
    Buffer.from([0x00]),
    Buffer.from(fields.new_ledger_chain_id, "utf8"),
    Buffer.from([0x00]),
    Buffer.from(fields.epoch_id, "utf8"),
    Buffer.from([0x00]),
    Buffer.from(fields.charity_id, "utf8"),
    Buffer.from([0x00]),
    u32be(fields.donation_vout),
    u64be(fields.amount_sats),
    parseHexStrict(fields.pq_destination_public_key_hex, 32),
    parseHexStrict(fields.commitment_nonce_hex, 16),
    u32be(fields.commitment_version),
  ]);
  return sha256(pre).toString("hex");
}

export function charitySetCommitmentHex(entries, version = 1) {
  const body = { entries, version };
  return domainHash(DOMAINS.charity_set, [
    Buffer.from(canonicalJson(body), "utf8"),
  ]).toString("hex");
}

export function syntheticTxidHex(tx) {
  const identity = {
    inputs: tx.inputs,
    locktime: tx.locktime,
    outputs: tx.outputs,
    version: tx.version,
  };
  return domainHash(DOMAINS.transaction_id, [
    Buffer.from(canonicalJson(identity), "utf8"),
  ]).toString("hex");
}

export function headerHashHex(header) {
  const fields = {
    bits: header.bits,
    height: header.height,
    merkle_root_hex: header.merkle_root_hex,
    prev_hash_hex: header.prev_hash_hex,
    time: header.time,
  };
  return domainHash(DOMAINS.header, [
    Buffer.from(canonicalJson(fields), "utf8"),
  ]).toString("hex");
}

export function nullifierHex(sourceChain, txidHex, vout) {
  return domainHash(DOMAINS.nullifier, [
    Buffer.from(sourceChain, "utf8"),
    parseHexStrict(txidHex, 32),
    u32be(vout),
  ]).toString("hex");
}

export function pqClaimMessage(fields) {
  const obj = {
    amount_sats: fields.amount_sats,
    charity_id: fields.charity_id,
    commitment_hex: fields.commitment_hex,
    donation_txid_hex: fields.donation_txid_hex,
    donation_vout: fields.donation_vout,
    epoch_id: fields.epoch_id,
    new_ledger_chain_id: fields.new_ledger_chain_id,
    nullifier_hex: fields.nullifier_hex,
    purpose: fields.purpose,
  };
  return Buffer.concat([
    Buffer.from(PQ_CLAIM_MESSAGE_PREFIX_LOCAL, "ascii"),
    Buffer.from([0x00]),
    Buffer.from(canonicalJson(obj), "utf8"),
  ]);
}

// local alias to avoid circular import issues with constants re-export
const PQ_CLAIM_MESSAGE_PREFIX_LOCAL = "BGEN-PQ-CLAIM-MSG-v1";
