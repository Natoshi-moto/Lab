/**
 * Synthetic cryptography stand-ins (NOT real PQ / NOT Bitcoin script).
 */

import crypto from "node:crypto";
import {
  DOMAIN_DONATION_COMMIT,
  DOMAIN_NULLIFIER,
  DOMAIN_PQ_PK,
  DOMAIN_PQ_SIG,
  DOMAIN_SOURCE_AUTH,
  PUBLIC_TEST_SEEDS,
  SYNTH_PQ_ALG,
} from "./constants.mjs";
import {
  canonicalJsonBytes,
  domainHashHex,
  hmacSha256,
  requireHex,
  u32Be,
  u64Be,
} from "./encoding.mjs";

export function derivePqPublicKey(secretSeedHex) {
  const seed = requireHex("secret_seed_hex", secretSeedHex, { expectedBytes: 32 });
  return domainHashHex(DOMAIN_PQ_PK, seed);
}

export function sourcePublicKey(secretSeedHex) {
  const seed = requireHex("secret_seed_hex", secretSeedHex, { expectedBytes: 32 });
  return domainHashHex(DOMAIN_SOURCE_AUTH, Buffer.from("pk"), seed);
}

export function pqMessageForClaim({
  new_ledger_chain_id,
  epoch_id,
  charity_id,
  donation_txid_hex,
  donation_vout,
  amount_sats,
  commitment_hex,
  nullifier_hex,
}) {
  const body = {
    amount_sats,
    charity_id,
    commitment_hex,
    donation_txid_hex,
    donation_vout,
    epoch_id,
    new_ledger_chain_id,
    nullifier_hex,
    purpose: "beneficial-genesis-claim-v1",
  };
  return Buffer.concat([
    Buffer.from("BGEN-PQ-CLAIM-MSG-v1\x00", "utf8"),
    canonicalJsonBytes(body),
  ]);
}

export function pqSign(secretSeedHex, message, domain = DOMAIN_PQ_SIG) {
  const seed = requireHex("secret_seed_hex", secretSeedHex, { expectedBytes: 32 });
  const mac = hmacSha256(seed, Buffer.concat([domain, Buffer.from([0x00]), message]));
  return Buffer.concat([
    Buffer.from(SYNTH_PQ_ALG, "ascii"),
    Buffer.from([0x00]),
    mac,
  ]).toString("hex");
}

/** Return null if valid, else a rejection code string. */
export function pqVerify(
  publicKeyHex,
  message,
  signatureHex,
  { domain = DOMAIN_PQ_SIG, expectedPublicKeyHex = null } = {},
) {
  let pk;
  let sigRaw;
  try {
    pk = requireHex("public_key_hex", publicKeyHex, { expectedBytes: 32 });
    sigRaw = requireHex("signature_hex", signatureHex);
  } catch {
    return "PQ_SIGNATURE_INVALID";
  }

  if (expectedPublicKeyHex != null && publicKeyHex !== expectedPublicKeyHex) {
    return "PQ_KEY_WRONG";
  }

  const sep = sigRaw.indexOf(0x00);
  if (sep <= 0) return "PQ_SIGNATURE_INVALID";
  const alg = sigRaw.subarray(0, sep);
  const mac = sigRaw.subarray(sep + 1);
  if (!alg.equals(Buffer.from(SYNTH_PQ_ALG, "ascii"))) return "PQ_ALGORITHM_UNSUPPORTED";
  if (mac.length !== 32) return "PQ_SIGNATURE_INVALID";

  for (const seedHex of Object.values(PUBLIC_TEST_SEEDS)) {
    if (derivePqPublicKey(seedHex) !== publicKeyHex) continue;
    const expected = Buffer.from(pqSign(seedHex, message, domain), "hex");
    if (expected.equals(sigRaw)) {
      if (!domain.equals(DOMAIN_PQ_SIG)) return "PQ_DOMAIN_INVALID";
      return null;
    }
    if (!domain.equals(DOMAIN_PQ_SIG)) return "PQ_DOMAIN_INVALID";
    return "PQ_SIGNATURE_INVALID";
  }
  void pk;
  return "PQ_KEY_WRONG";
}

export function sourceAuthorize(secretSeedHex, txidHex, sighashHex) {
  const seed = requireHex("secret_seed_hex", secretSeedHex, { expectedBytes: 32 });
  const txid = requireHex("txid_hex", txidHex, { expectedBytes: 32 });
  const sighash = requireHex("sighash_hex", sighashHex, { expectedBytes: 32 });
  const mac = hmacSha256(
    seed,
    Buffer.concat([DOMAIN_SOURCE_AUTH, Buffer.from([0x00]), txid, sighash]),
  );
  return {
    alg: "SYNTHETIC_SOURCE_HMAC_v1",
    public_key_hex: sourcePublicKey(secretSeedHex),
    signature_hex: mac.toString("hex"),
    sighash_hex: sighashHex,
    control_label: "CRYPTOGRAPHIC_CONTROL_SYNTHETIC",
  };
}

export function sourceVerify(auth, txidHex) {
  if (!auth || typeof auth !== "object") return "SOURCE_AUTH_INVALID";
  if (auth.alg !== "SYNTHETIC_SOURCE_HMAC_v1") return "SOURCE_AUTH_INVALID";
  let pk;
  let sig;
  let sighash;
  try {
    pk = requireHex("public_key_hex", auth.public_key_hex, { expectedBytes: 32 });
    sig = requireHex("signature_hex", auth.signature_hex, { expectedBytes: 32 });
    sighash = requireHex("sighash_hex", auth.sighash_hex, { expectedBytes: 32 });
    requireHex("txid_hex", txidHex, { expectedBytes: 32 });
  } catch {
    return "SOURCE_AUTH_INVALID";
  }
  for (const seedHex of Object.values(PUBLIC_TEST_SEEDS)) {
    if (sourcePublicKey(seedHex) !== pk.toString("hex")) continue;
    const expected = Buffer.from(
      sourceAuthorize(seedHex, txidHex, sighash.toString("hex")).signature_hex,
      "hex",
    );
    if (expected.equals(sig)) return null;
    return "SOURCE_AUTH_INVALID";
  }
  return "SOURCE_AUTH_INVALID";
}

export function donationCommitmentPreimage({
  new_ledger_chain_id,
  epoch_id,
  charity_id,
  donation_vout,
  amount_sats,
  pq_destination_public_key_hex,
  nonce_hex,
  commitment_version = 1,
}) {
  const pq = requireHex("pq_destination_public_key_hex", pq_destination_public_key_hex, {
    expectedBytes: 32,
  });
  const nonce = requireHex("nonce_hex", nonce_hex, { expectedBytes: 16 });
  return Buffer.concat([
    DOMAIN_DONATION_COMMIT,
    Buffer.from([0x00]),
    Buffer.from(String(new_ledger_chain_id), "utf8"),
    Buffer.from([0x00]),
    Buffer.from(String(epoch_id), "utf8"),
    Buffer.from([0x00]),
    Buffer.from(String(charity_id), "utf8"),
    Buffer.from([0x00]),
    u32Be(donation_vout),
    u64Be(amount_sats),
    pq,
    nonce,
    u32Be(commitment_version),
  ]);
}

export function donationCommitmentHex(fields) {
  return crypto
    .createHash("sha256")
    .update(donationCommitmentPreimage(fields))
    .digest("hex");
}

export function computeNullifier({ source_chain, donation_txid_hex, donation_vout }) {
  const txid = requireHex("donation_txid_hex", donation_txid_hex, { expectedBytes: 32 });
  return domainHashHex(
    DOMAIN_NULLIFIER,
    Buffer.from(source_chain, "utf8"),
    txid,
    u32Be(donation_vout),
  );
}
