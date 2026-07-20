import crypto from "node:crypto";
import {
  DOMAINS,
  PUBLIC_TEST_SEEDS,
  PQ_CLAIM_PURPOSE,
  SUPPORTED_PQ_ALGORITHM,
  SUPPORTED_SOURCE_AUTH_ALGORITHM,
  SOURCE_CONTROL_LABEL,
} from "./constants.mjs";
import {
  domainHash,
  parseHexStrict,
  pqClaimMessage,
  canonicalJson,
  isLowerHex,
} from "./encoding.mjs";

function seedBytes(seedHex) {
  return parseHexStrict(seedHex, 32);
}

export function derivePqPublicKey(seedHex) {
  return domainHash(DOMAINS.pq_public_key, [seedBytes(seedHex)]).toString("hex");
}

export function deriveSourcePublicKey(seedHex) {
  // Post-freeze confirmed: domain_hash(DOMAIN_SOURCE_AUTH, b"pk", seed)
  return domainHash(DOMAINS.source_authorization, [
    Buffer.from("pk", "utf8"),
    seedBytes(seedHex),
  ]).toString("hex");
}

/**
 * Clean-room synthetic PQ sign/verify.
 * Spec-derived scheme (TECHNICAL_DESIGN §4.4 + domain constants):
 *   message = ASCII(prefix) || 0x00 || canonical_json(fields)
 *   mac = HMAC-SHA256(seed, DOMAIN_PQ_SIG || 0x00 || message)
 *   sig = ASCII(alg) || 0x00 || mac32
 *
 * Seed table is required for verification in this stand-in model.
 */
export function pqSign(seedHex, messageFields) {
  const message = pqClaimMessage({ ...messageFields, purpose: PQ_CLAIM_PURPOSE });
  const data = Buffer.concat([
    Buffer.from(DOMAINS.pq_signature, "ascii"),
    Buffer.from([0x00]),
    message,
  ]);
  const mac = crypto.createHmac("sha256", seedBytes(seedHex)).update(data).digest();
  return Buffer.concat([
    Buffer.from(SUPPORTED_PQ_ALGORITHM, "ascii"),
    Buffer.from([0x00]),
    mac,
  ]).toString("hex");
}

export function pqVerify(publicKeyHex, signatureHex, messageFields) {
  if (typeof signatureHex !== "string" || !isLowerHex(signatureHex)) {
    return { ok: false, code: "PQ_SIGNATURE_INVALID" };
  }
  let sigBuf;
  try {
    sigBuf = Buffer.from(signatureHex, "hex");
  } catch {
    return { ok: false, code: "PQ_SIGNATURE_INVALID" };
  }
  // Subject framing: alg_ascii || 0x00 || mac32 (alg length is variable).
  const sep = sigBuf.indexOf(0x00);
  if (sep <= 0) return { ok: false, code: "PQ_SIGNATURE_INVALID" };
  const alg = sigBuf.subarray(0, sep);
  const mac = sigBuf.subarray(sep + 1);
  if (mac.length !== 32) return { ok: false, code: "PQ_SIGNATURE_INVALID" };
  if (!alg.equals(Buffer.from(SUPPORTED_PQ_ALGORITHM, "ascii"))) {
    return { ok: false, code: "PQ_ALGORITHM_UNSUPPORTED" };
  }

  for (const seedHex of Object.values(PUBLIC_TEST_SEEDS)) {
    let pk;
    try {
      pk = derivePqPublicKey(seedHex);
    } catch {
      continue;
    }
    if (pk !== publicKeyHex) continue;
    const expectedFull = Buffer.from(pqSign(seedHex, messageFields), "hex");
    if (crypto.timingSafeEqual(expectedFull, sigBuf)) {
      return { ok: true };
    }
    return { ok: false, code: "PQ_SIGNATURE_INVALID" };
  }
  return { ok: false, code: "PQ_KEY_WRONG" };
}

/**
 * Post-freeze confirmed source stand-in:
 *   pk = domain_hash(DOMAIN, b"pk", seed)
 *   mac = HMAC-SHA256(seed, DOMAIN || 0x00 || txid32 || sighash32)
 * The subject verifier does not re-derive sighash from tx body; it checks the
 * presented sighash is bound into the MAC with the txid.
 */
export function sourceSign(seedHex, txidHex, sighashHex) {
  const txid = parseHexStrict(txidHex, 32);
  const sighash = parseHexStrict(sighashHex, 32);
  const mac = crypto
    .createHmac("sha256", seedBytes(seedHex))
    .update(
      Buffer.concat([
        Buffer.from(DOMAINS.source_authorization, "ascii"),
        Buffer.from([0x00]),
        txid,
        sighash,
      ])
    )
    .digest()
    .toString("hex");
  return {
    alg: SUPPORTED_SOURCE_AUTH_ALGORITHM,
    control_label: SOURCE_CONTROL_LABEL,
    public_key_hex: deriveSourcePublicKey(seedHex),
    sighash_hex: sighashHex,
    signature_hex: mac,
  };
}

export function sourceVerify(auth, txidHex) {
  if (!auth || typeof auth !== "object") {
    return { ok: false, code: "SOURCE_AUTH_INVALID" };
  }
  if (auth.alg !== SUPPORTED_SOURCE_AUTH_ALGORITHM) {
    return { ok: false, code: "SOURCE_AUTH_INVALID" };
  }
  if (auth.control_label !== SOURCE_CONTROL_LABEL) {
    return { ok: false, code: "SOURCE_AUTH_INVALID" };
  }
  if (!isLowerHex(auth.public_key_hex, 32) || !isLowerHex(auth.sighash_hex, 32) || !isLowerHex(auth.signature_hex, 32)) {
    return { ok: false, code: "SOURCE_AUTH_INVALID" };
  }
  for (const seedHex of Object.values(PUBLIC_TEST_SEEDS)) {
    let pk;
    try {
      pk = deriveSourcePublicKey(seedHex);
    } catch {
      continue;
    }
    if (pk !== auth.public_key_hex) continue;
    const expected = sourceSign(seedHex, txidHex, auth.sighash_hex);
    if (expected.signature_hex === auth.signature_hex) {
      return { ok: true };
    }
    return { ok: false, code: "SOURCE_AUTH_INVALID" };
  }
  return { ok: false, code: "SOURCE_AUTH_INVALID" };
}

// silence unused import if tree-shaken
void canonicalJson;
