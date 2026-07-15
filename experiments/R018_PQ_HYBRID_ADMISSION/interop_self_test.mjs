#!/usr/bin/env node
/** Bidirectional ML-DSA-65 interoperability check: Node native <-> Noble JS. */

import { generateKeyPairSync, createPublicKey, sign as nativeSign, verify as nativeVerify } from 'node:crypto';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

const SPKI_PREFIX = Buffer.from('308207b2300b0609608648016503040312038207a100', 'hex');
const MESSAGE = Buffer.from('NEXUS/R018/ML-DSA-65/INTEROP/v0\x00public deterministic conformance message', 'ascii');

function canonical(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

const nodeKeys = generateKeyPairSync('ml-dsa-65');
const nodeSpki = nodeKeys.publicKey.export({ format: 'der', type: 'spki' });
if (!nodeSpki.subarray(0, SPKI_PREFIX.length).equals(SPKI_PREFIX)) throw new Error('unexpected Node ML-DSA-65 SPKI encoding');
const nodeRawPublic = nodeSpki.subarray(SPKI_PREFIX.length);
const nodeSignature = nativeSign(null, MESSAGE, nodeKeys.privateKey);
if (!ml_dsa65.verify(nodeSignature, MESSAGE, nodeRawPublic)) throw new Error('Noble rejected Node signature');

const publicSeed = new Uint8Array(ml_dsa65.lengths.seed).fill(0x42);
const nobleKeys = ml_dsa65.keygen(publicSeed);
const nobleSignature = ml_dsa65.sign(MESSAGE, nobleKeys.secretKey, { extraEntropy: false });
const importedNobleKey = createPublicKey({
  key: Buffer.concat([SPKI_PREFIX, Buffer.from(nobleKeys.publicKey)]),
  format: 'der',
  type: 'spki',
});
if (!nativeVerify(null, MESSAGE, importedNobleKey, nobleSignature)) throw new Error('Node rejected Noble signature');
publicSeed.fill(0);
nobleKeys.secretKey.fill(0);

process.stdout.write(`${canonical({
  algorithm: 'ML-DSA-65',
  native_to_noble: 'PASS',
  noble_to_native: 'PASS',
  public_key_bytes: String(ml_dsa65.lengths.publicKey),
  schema: 'nexus.r018-ml-dsa-65-interop-report/v0',
  signature_bytes: String(ml_dsa65.lengths.signature),
  status: 'PASS',
  status_authority: 'NONE',
})}\n`);
