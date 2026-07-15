#!/usr/bin/env node
/**
 * R018 verifier-only post-quantum admission gate.
 *
 * A PASS means only that one exact canonical R016 event has the pinned
 * ML-DSA-65 authorization required by one exact policy. The event must still
 * pass the unchanged R016 state-transition gate. This module has no signing,
 * private-key, policy-update, fallback, override, or promotion path.
 */

import { createHash, createPublicKey, verify as nativeVerify } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const POLICY_SCHEMA = 'nexus.r018-pq-admission-policy/v0';
export const AUTHORIZATION_SCHEMA = 'nexus.r018-pq-authorization/v0';
export const REPORT_SCHEMA = 'nexus.r018-pq-admission-report/v0';
export const ALGORITHM = 'ML-DSA-65';
export const NETWORK = 'NEXUS-R016-SYNTHETIC';
export const PROFILE = 'CUSTODY-KERNEL-V1';
export const R016_VERSION = '1';
export const STATUS_AUTHORITY = 'NONE';
export const PUBLIC_KEY_BYTES = 1952;
export const SIGNATURE_BYTES = 3309;
export const MAX_EVENT_BYTES = 64 * 1024;
export const MAX_DOCUMENT_BYTES = 32 * 1024;

const POLICY_DOMAIN = 'NEXUS/R018/PQ-ADMISSION-POLICY/v0';
const KEY_DOMAIN = 'NEXUS/R018/ML-DSA-65-PUBLIC-KEY/v0';
const AUTHORIZATION_DOMAIN = 'NEXUS/R018/PQ-AUTHORIZATION/v0';
const ZERO = '0'.repeat(64);
const HASH = /^[0-9a-f]{64}$/;
const UINT = /^(0|[1-9][0-9]*)$/;
const SPKI_PREFIX = Buffer.from('308207b2300b0609608648016503040312038207a100', 'hex');

export class AdmissionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AdmissionError';
    this.code = code;
  }
}

const fail = (code, message) => { throw new AdmissionError(code, message); };

function assertJsonSubset(value, path = '$', depth = 0) {
  if (depth > 32) fail('BOUNDS', `JSON nesting exceeds limit at ${path}`);
  if (typeof value === 'string') return;
  if (Array.isArray(value)) {
    if (value.length > 256) fail('BOUNDS', `array exceeds limit at ${path}`);
    value.forEach((item, index) => assertJsonSubset(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.entries(value);
    if (entries.length > 32) fail('BOUNDS', `object exceeds field limit at ${path}`);
    entries.forEach(([key, item]) => assertJsonSubset(item, `${path}.${key}`, depth + 1));
    return;
  }
  fail('SCHEMA', `non-string JSON scalar at ${path}`);
}

function escapedString(value) {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function canonicalString(value) {
  if (typeof value === 'string') return escapedString(value);
  if (Array.isArray(value)) return `[${value.map(canonicalString).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${escapedString(key)}:${canonicalString(value[key])}`).join(',')}}`;
}

export function canonicalBytes(value) {
  assertJsonSubset(value);
  return Buffer.from(canonicalString(value), 'ascii');
}

export function contentBytes(raw, maximum = MAX_DOCUMENT_BYTES) {
  let wire = Buffer.from(raw);
  if (wire.at(-1) === 0x0a) {
    if (wire.length < 2 || wire.at(-2) === 0x0a) fail('NON_CANONICAL', 'document has an invalid final newline');
    wire = wire.subarray(0, wire.length - 1);
  }
  if (wire.length === 0 || wire.length > maximum) fail('BOUNDS', 'document is empty or oversized');
  return wire;
}

export function decodeExact(raw, maximum = MAX_DOCUMENT_BYTES) {
  const wire = contentBytes(raw, maximum);
  if ([...wire].some((byte) => byte > 0x7f)) fail('NON_CANONICAL', 'document is not ASCII');
  let value;
  try { value = JSON.parse(wire.toString('ascii')); } catch { fail('NON_CANONICAL', 'document is not JSON'); }
  if (value === null || Array.isArray(value) || typeof value !== 'object') fail('SCHEMA', 'top-level value must be an object');
  if (!canonicalBytes(value).equals(wire)) fail('NON_CANONICAL', 'document is not exact canonical JSON');
  return value;
}

function exact(value, fields, path) {
  if (value === null || Array.isArray(value) || typeof value !== 'object') fail('SCHEMA', `expected object at ${path}`);
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail('SCHEMA', `exact fields differ at ${path}`);
  }
}

function nonempty(value, path) {
  if (typeof value !== 'string' || value.length === 0) fail('SCHEMA', `expected nonempty string at ${path}`);
  return value;
}

function hash(value, path, allowZero = false) {
  if (typeof value !== 'string' || !HASH.test(value) || (!allowZero && value === ZERO)) fail('SCHEMA', `invalid hash at ${path}`);
  return value;
}

function uint(value, path) {
  if (typeof value !== 'string' || !UINT.test(value)) fail('SCHEMA', `invalid unsigned integer at ${path}`);
  return value;
}

function base64Exact(value, bytes, path) {
  if (typeof value !== 'string' || value.length === 0 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    fail('SCHEMA', `invalid base64 at ${path}`);
  }
  const decoded = Buffer.from(value, 'base64');
  if (decoded.length !== bytes || decoded.toString('base64') !== value) fail('SCHEMA', `wrong or noncanonical base64 at ${path}`);
  return decoded;
}

export function frame(domain, payload) {
  const name = Buffer.from(domain, 'ascii');
  const lengths = Buffer.alloc(10);
  lengths.writeUInt16BE(name.length, 0);
  lengths.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([lengths.subarray(0, 2), name, lengths.subarray(2), payload]);
}

function sha256(raw) { return createHash('sha256').update(raw).digest('hex'); }
export function policyId(policy) {
  const subject = structuredClone(policy);
  subject.policy_id = ZERO;
  return sha256(frame(POLICY_DOMAIN, canonicalBytes(subject)));
}
export function keyId(publicKey) { return sha256(frame(KEY_DOMAIN, publicKey)); }

function validatePolicy(policy) {
  exact(policy, [
    'algorithm', 'base_event_profile', 'base_event_version', 'binding', 'decision',
    'fallback', 'missing_authorization', 'network', 'policy_id', 'schema',
    'status_authority', 'unknown_policy', 'version',
  ], '$policy');
  exact(policy.binding, ['controller', 'controller_epoch', 'key_id', 'public_key_base64'], '$policy.binding');
  if (
    policy.schema !== POLICY_SCHEMA || policy.algorithm !== ALGORITHM || policy.network !== NETWORK
    || policy.base_event_profile !== PROFILE || policy.base_event_version !== R016_VERSION
    || policy.version !== '0' || policy.status_authority !== STATUS_AUTHORITY
    || policy.decision !== 'ALL_OF_R016_AND_ML_DSA_65'
    || policy.fallback !== 'NONE' || policy.missing_authorization !== 'REJECT'
    || policy.unknown_policy !== 'REJECT'
  ) fail('POLICY', 'policy attempts to change the fixed fail-closed profile');
  hash(policy.policy_id, '$policy.policy_id');
  if (policy.policy_id !== policyId(policy)) fail('POLICY_ID', 'policy_id does not bind the exact policy');
  hash(policy.binding.controller, '$policy.binding.controller');
  uint(policy.binding.controller_epoch, '$policy.binding.controller_epoch');
  const publicKey = base64Exact(policy.binding.public_key_base64, PUBLIC_KEY_BYTES, '$policy.binding.public_key_base64');
  hash(policy.binding.key_id, '$policy.binding.key_id');
  if (policy.binding.key_id !== keyId(publicKey)) fail('KEY_ID', 'key_id does not bind the exact public key');
  return publicKey;
}

function validateEvent(event, eventRaw) {
  for (const field of ['controller', 'controller_epoch', 'network', 'profile', 'version']) {
    if (!(field in event)) fail('EVENT_SCHEMA', `R016 event lacks ${field}`);
  }
  hash(event.controller, '$event.controller');
  uint(event.controller_epoch, '$event.controller_epoch');
  if (event.network !== NETWORK || event.profile !== PROFILE || event.version !== R016_VERSION) {
    fail('EVENT_DOMAIN', 'event is outside the fixed R016 domain');
  }
  return sha256(eventRaw);
}

function validateAuthorization(authorization, policy, event, eventDigest) {
  exact(authorization, [
    'algorithm', 'controller', 'controller_epoch', 'event_sha256', 'key_id',
    'network', 'policy_id', 'schema', 'signature_base64', 'status_authority',
  ], '$authorization');
  if (
    authorization.schema !== AUTHORIZATION_SCHEMA || authorization.algorithm !== ALGORITHM
    || authorization.network !== NETWORK || authorization.status_authority !== STATUS_AUTHORITY
  ) fail('AUTHORIZATION_DOMAIN', 'authorization domain is invalid');
  for (const field of ['controller', 'controller_epoch']) {
    if (authorization[field] !== event[field] || authorization[field] !== policy.binding[field]) {
      fail('BINDING', `${field} differs across event, policy, and authorization`);
    }
  }
  if (authorization.policy_id !== policy.policy_id) fail('DOWNGRADE', 'authorization names another policy');
  if (authorization.key_id !== policy.binding.key_id) fail('KEY_SUBSTITUTION', 'authorization names another key');
  if (authorization.event_sha256 !== eventDigest) fail('EVENT_TAMPER', 'authorization does not bind the exact event bytes');
  return base64Exact(authorization.signature_base64, SIGNATURE_BYTES, '$authorization.signature_base64');
}

export function authorizationMessage(authorization) {
  const subject = structuredClone(authorization);
  subject.signature_base64 = '';
  return frame(AUTHORIZATION_DOMAIN, canonicalBytes(subject));
}

export function verifyAdmission(policyRaw, eventRaw, authorizationRaw) {
  const policy = decodeExact(policyRaw);
  const eventBytes = contentBytes(eventRaw, MAX_EVENT_BYTES);
  const event = decodeExact(eventBytes, MAX_EVENT_BYTES);
  const authorization = decodeExact(authorizationRaw);
  const publicKey = validatePolicy(policy);
  const eventDigest = validateEvent(event, eventBytes);
  const signature = validateAuthorization(authorization, policy, event, eventDigest);
  let valid = false;
  try {
    const key = createPublicKey({ key: Buffer.concat([SPKI_PREFIX, publicKey]), format: 'der', type: 'spki' });
    valid = key.asymmetricKeyType === 'ml-dsa-65'
      && nativeVerify(null, authorizationMessage(authorization), key, signature);
  } catch (error) {
    if (error?.code === 'ERR_OSSL_UNSUPPORTED' || error?.code === 'ERR_CRYPTO_UNKNOWN_CIPHER') {
      fail('VERIFICATION_UNAVAILABLE', 'native ML-DSA-65 verification is unavailable');
    }
    valid = false;
  }
  if (!valid) fail('INVALID_SIGNATURE', 'ML-DSA-65 signature is invalid');
  return {
    algorithm: ALGORITHM,
    controller: event.controller,
    controller_epoch: event.controller_epoch,
    decision: 'PQ_PRECHECK_PASS_R016_STILL_REQUIRED',
    event_sha256: eventDigest,
    key_id: policy.binding.key_id,
    policy_id: policy.policy_id,
    schema: REPORT_SCHEMA,
    status: 'PASS',
    status_authority: STATUS_AUTHORITY,
  };
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 3) fail('USAGE', 'usage: pq_admission.mjs POLICY.json EVENT.json AUTHORIZATION.json');
  const [policyRaw, eventRaw, authorizationRaw] = await Promise.all(argv.map((path) => readFile(path)));
  process.stdout.write(`${canonicalString(verifyAdmission(policyRaw, eventRaw, authorizationRaw))}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const code = error instanceof AdmissionError ? error.code : 'UNEXPECTED';
    process.stderr.write(`${code}: ${error.message}\n`);
    process.exitCode = 2;
  });
}
