#!/usr/bin/env node
/** Cold R018 verifier using pure-JavaScript ML-DSA, not the native gate. */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

const POLICY_SCHEMA = 'nexus.r018-pq-admission-policy/v0';
const AUTHORIZATION_SCHEMA = 'nexus.r018-pq-authorization/v0';
const REPORT_SCHEMA = 'nexus.r018-pq-admission-report/v0';
const ALGORITHM = 'ML-DSA-65';
const NETWORK = 'NEXUS-R016-SYNTHETIC';
const PROFILE = 'CUSTODY-KERNEL-V1';
const R016_VERSION = '1';
const STATUS_AUTHORITY = 'NONE';
const ZERO = '0'.repeat(64);
const HASH = /^[0-9a-f]{64}$/;
const UINT = /^(0|[1-9][0-9]*)$/;
const POLICY_DOMAIN = 'NEXUS/R018/PQ-ADMISSION-POLICY/v0';
const KEY_DOMAIN = 'NEXUS/R018/ML-DSA-65-PUBLIC-KEY/v0';
const AUTHORIZATION_DOMAIN = 'NEXUS/R018/PQ-AUTHORIZATION/v0';

const fail = (message) => { throw new Error(message); };

function assertJsonSubset(value, path = '$', depth = 0) {
  if (depth > 32) fail(`JSON nesting exceeds limit at ${path}`);
  if (typeof value === 'string') return;
  if (Array.isArray(value)) {
    if (value.length > 256) fail(`array exceeds limit at ${path}`);
    value.forEach((item, index) => assertJsonSubset(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.entries(value);
    if (entries.length > 32) fail(`object exceeds field limit at ${path}`);
    entries.forEach(([key, item]) => assertJsonSubset(item, `${path}.${key}`, depth + 1));
    return;
  }
  fail(`non-string JSON scalar at ${path}`);
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

function canonicalBytes(value) {
  assertJsonSubset(value);
  return Buffer.from(canonicalString(value), 'ascii');
}

function contentBytes(raw, maximum) {
  let wire = Buffer.from(raw);
  if (wire.at(-1) === 0x0a) {
    if (wire.length < 2 || wire.at(-2) === 0x0a) fail('document has an invalid final newline');
    wire = wire.subarray(0, wire.length - 1);
  }
  if (wire.length === 0 || wire.length > maximum) fail('document is empty or oversized');
  return wire;
}

function decodeExact(raw, maximum) {
  const wire = contentBytes(raw, maximum);
  if ([...wire].some((byte) => byte > 0x7f)) fail('document is not ASCII');
  let value;
  try { value = JSON.parse(wire.toString('ascii')); } catch { fail('document is not JSON'); }
  if (value === null || Array.isArray(value) || typeof value !== 'object') fail('top-level value must be an object');
  if (!canonicalBytes(value).equals(wire)) fail('document is not exact canonical JSON');
  return value;
}

function exact(value, fields, path) {
  if (value === null || Array.isArray(value) || typeof value !== 'object') fail(`expected object at ${path}`);
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(`exact fields differ at ${path}`);
}

function hash(value, path) {
  if (typeof value !== 'string' || !HASH.test(value) || value === ZERO) fail(`invalid hash at ${path}`);
  return value;
}

function uint(value, path) {
  if (typeof value !== 'string' || !UINT.test(value)) fail(`invalid unsigned integer at ${path}`);
  return value;
}

function base64Exact(value, bytes, path) {
  if (typeof value !== 'string' || value.length === 0 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) fail(`invalid base64 at ${path}`);
  const decoded = Buffer.from(value, 'base64');
  if (decoded.length !== bytes || decoded.toString('base64') !== value) fail(`wrong or noncanonical base64 at ${path}`);
  return decoded;
}

function frame(domain, payload) {
  const name = Buffer.from(domain, 'ascii');
  const lengths = Buffer.alloc(10);
  lengths.writeUInt16BE(name.length, 0);
  lengths.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([lengths.subarray(0, 2), name, lengths.subarray(2), payload]);
}

const sha256 = (raw) => createHash('sha256').update(raw).digest('hex');
function policyId(policy) {
  const subject = structuredClone(policy);
  subject.policy_id = ZERO;
  return sha256(frame(POLICY_DOMAIN, canonicalBytes(subject)));
}
const keyId = (publicKey) => sha256(frame(KEY_DOMAIN, publicKey));

function verifyCold(policyRaw, eventRaw, authorizationRaw) {
  const policy = decodeExact(policyRaw, 32 * 1024);
  const eventBytes = contentBytes(eventRaw, 64 * 1024);
  const event = decodeExact(eventBytes, 64 * 1024);
  const authorization = decodeExact(authorizationRaw, 32 * 1024);

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
    || policy.decision !== 'ALL_OF_R016_AND_ML_DSA_65' || policy.fallback !== 'NONE'
    || policy.missing_authorization !== 'REJECT' || policy.unknown_policy !== 'REJECT'
  ) fail('policy profile differs');
  hash(policy.policy_id, '$policy.policy_id');
  if (policy.policy_id !== policyId(policy)) fail('policy_id mismatch');
  hash(policy.binding.controller, '$policy.binding.controller');
  uint(policy.binding.controller_epoch, '$policy.binding.controller_epoch');
  const publicKey = base64Exact(policy.binding.public_key_base64, ml_dsa65.lengths.publicKey, '$policy.binding.public_key_base64');
  hash(policy.binding.key_id, '$policy.binding.key_id');
  if (policy.binding.key_id !== keyId(publicKey)) fail('key_id mismatch');

  for (const field of ['controller', 'controller_epoch', 'network', 'profile', 'version']) {
    if (!(field in event)) fail(`event lacks ${field}`);
  }
  hash(event.controller, '$event.controller');
  uint(event.controller_epoch, '$event.controller_epoch');
  if (event.network !== NETWORK || event.profile !== PROFILE || event.version !== R016_VERSION) fail('event domain differs');
  const eventDigest = sha256(eventBytes);

  exact(authorization, [
    'algorithm', 'controller', 'controller_epoch', 'event_sha256', 'key_id',
    'network', 'policy_id', 'schema', 'signature_base64', 'status_authority',
  ], '$authorization');
  if (
    authorization.schema !== AUTHORIZATION_SCHEMA || authorization.algorithm !== ALGORITHM
    || authorization.network !== NETWORK || authorization.status_authority !== STATUS_AUTHORITY
  ) fail('authorization domain differs');
  for (const field of ['controller', 'controller_epoch']) {
    if (authorization[field] !== event[field] || authorization[field] !== policy.binding[field]) fail(`${field} binding differs`);
  }
  if (authorization.policy_id !== policy.policy_id) fail('policy downgrade');
  if (authorization.key_id !== policy.binding.key_id) fail('key substitution');
  if (authorization.event_sha256 !== eventDigest) fail('event digest mismatch');
  const signature = base64Exact(authorization.signature_base64, ml_dsa65.lengths.signature, '$authorization.signature_base64');
  const subject = structuredClone(authorization);
  subject.signature_base64 = '';
  const message = frame(AUTHORIZATION_DOMAIN, canonicalBytes(subject));
  if (!ml_dsa65.verify(signature, message, publicKey)) fail('ML-DSA-65 signature is invalid');

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

async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 3) fail('usage: independent_verifier.mjs POLICY.json EVENT.json AUTHORIZATION.json');
  const [policyRaw, eventRaw, authorizationRaw] = await Promise.all(argv.map((path) => readFile(path)));
  process.stdout.write(`${canonicalString(verifyCold(policyRaw, eventRaw, authorizationRaw))}\n`);
}

main().catch((error) => {
  process.stderr.write(`FAIL: ${error.message}\n`);
  process.exitCode = 2;
});
