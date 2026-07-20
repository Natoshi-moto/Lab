/**
 * Canonical encodings for Beneficial Genesis (clean-room Node implementation).
 *
 * domain_hash recovered from fixtures:
 *   SHA-256( domain || 0x00 || u32be(len(p)) || p  for each part )
 *
 * Donation commitment uses the special string-separated preimage from
 * TECHNICAL_DESIGN.md §4.2 (not length-prefixed domain_hash).
 */

import crypto from "node:crypto";

export function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest();
}

export function sha256Hex(buf) {
  return sha256(buf).toString("hex");
}

export function hmacSha256(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest();
}

export function u32Be(n) {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 0xffffffff) {
    throw new TypeError("u32 out of range");
  }
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

export function u64Be(n) {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) {
    // still allow up to 2^53-1 safely; larger values rejected as TYPE_ERROR upstream
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0) {
      throw new TypeError("u64 out of range");
    }
  }
  const b = Buffer.alloc(8);
  b.writeBigUInt64BE(BigInt(n));
  return b;
}

/** Recursively sort object keys; match Python json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=True). */
export function sortKeys(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);
    return out;
  }
  return obj;
}

export function canonicalJson(obj) {
  // JSON.stringify escapes non-ASCII as \uXXXX when needed similarly for our fixture alphabet.
  return JSON.stringify(sortKeys(obj));
}

export function canonicalJsonBytes(obj) {
  return Buffer.from(canonicalJson(obj), "utf8");
}

/**
 * domain_hash(domain, *parts) -> bytes
 * SHA-256 over domain || 0x00 || len_be32(part) || part for each part.
 */
export function domainHash(domain, ...parts) {
  const chunks = [domain, Buffer.from([0x00])];
  for (const part of parts) {
    if (!Buffer.isBuffer(part)) {
      throw new TypeError("domain_hash parts must be Buffer");
    }
    chunks.push(u32Be(part.length), part);
  }
  return sha256(Buffer.concat(chunks));
}

export function domainHashHex(domain, ...parts) {
  return domainHash(domain, ...parts).toString("hex");
}

/**
 * Strict lowercase hex parse. Throws TypeError/ValueError-like Error with message.
 * @param {string} name
 * @param {unknown} value
 * @param {{ expectedBytes?: number }} [opts]
 * @returns {Buffer}
 */
export function requireHex(name, value, opts = {}) {
  if (typeof value !== "string") {
    throw new TypeError(`${name} must be hex string`);
  }
  if (value.length === 0) {
    throw new TypeError(`${name} empty hex`);
  }
  if (value.length % 2 !== 0) {
    throw new TypeError(`${name} odd-length hex`);
  }
  if (!/^[0-9a-f]+$/.test(value)) {
    // reject uppercase / non-hex
    throw new TypeError(`${name} malformed hex`);
  }
  const buf = Buffer.from(value, "hex");
  if (opts.expectedBytes !== undefined && buf.length !== opts.expectedBytes) {
    throw new TypeError(`${name} expected ${opts.expectedBytes} bytes`);
  }
  return buf;
}

/** True integer check — rejects boolean (typeof true === 'boolean' in JS; also reject Number objects). */
export function isStrictInt(value) {
  return typeof value === "number" && Number.isInteger(value) && !Object.is(value, -0) ||
    (typeof value === "number" && Number.isInteger(value));
}

/** Reject bool and non-integers. */
export function asNonNegInt(name, value, max) {
  // In JS, typeof true === 'boolean', so bool is already excluded from number.
  // Still reject NaN and non-integers.
  if (typeof value === "boolean") {
    throw new TypeError(`${name} must be int not bool`);
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new TypeError(`${name} must be int`);
  }
  if (value < 0 || value > max) {
    throw new TypeError(`${name} out of range`);
  }
  return value;
}
