#!/usr/bin/env node
/** Generate the public, deterministic, non-secret R018 conformance fixture. */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

const ZERO = '0'.repeat(64);
const POLICY_DOMAIN = 'NEXUS/R018/PQ-ADMISSION-POLICY/v0';
const KEY_DOMAIN = 'NEXUS/R018/ML-DSA-65-PUBLIC-KEY/v0';
const AUTHORIZATION_DOMAIN = 'NEXUS/R018/PQ-AUTHORIZATION/v0';

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

const canonicalBytes = (value) => Buffer.from(canonicalString(value), 'ascii');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function frame(domain, payload) {
  const name = Buffer.from(domain, 'ascii');
  const lengths = Buffer.alloc(10);
  lengths.writeUInt16BE(name.length, 0);
  lengths.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([lengths.subarray(0, 2), name, lengths.subarray(2), payload]);
}

function decodeEvent(raw) {
  let wire = Buffer.from(raw);
  if (wire.at(-1) === 0x0a) wire = wire.subarray(0, wire.length - 1);
  if (wire.length === 0 || wire.length > 64 * 1024 || [...wire].some((byte) => byte > 0x7f)) throw new Error('event bytes invalid');
  const event = JSON.parse(wire.toString('ascii'));
  if (!canonicalBytes(event).equals(wire)) throw new Error('event must be exact canonical JSON');
  if (
    event.network !== 'NEXUS-R016-SYNTHETIC' || event.profile !== 'CUSTODY-KERNEL-V1'
    || event.version !== '1' || typeof event.controller !== 'string'
    || typeof event.controller_epoch !== 'string'
  ) throw new Error('event is not in the fixed R016 profile');
  return { event, wire };
}

export function buildFixture(eventRaw) {
  const { event, wire: eventBytes } = decodeEvent(Buffer.from(eventRaw));
  const seed = createHash('sha256').update('NEXUS/R018/PUBLIC-TEST-SEED/ML-DSA-65/v0', 'ascii').digest();
  const keys = ml_dsa65.keygen(seed);
  seed.fill(0);
  const publicKey = Buffer.from(keys.publicKey);
  const bindingKeyId = sha256(frame(KEY_DOMAIN, publicKey));
  const policy = {
    algorithm: 'ML-DSA-65',
    base_event_profile: 'CUSTODY-KERNEL-V1',
    base_event_version: '1',
    binding: {
      controller: event.controller,
      controller_epoch: event.controller_epoch,
      key_id: bindingKeyId,
      public_key_base64: publicKey.toString('base64'),
    },
    decision: 'ALL_OF_R016_AND_ML_DSA_65',
    fallback: 'NONE',
    missing_authorization: 'REJECT',
    network: 'NEXUS-R016-SYNTHETIC',
    policy_id: ZERO,
    schema: 'nexus.r018-pq-admission-policy/v0',
    status_authority: 'NONE',
    unknown_policy: 'REJECT',
    version: '0',
  };
  policy.policy_id = sha256(frame(POLICY_DOMAIN, canonicalBytes(policy)));
  const authorization = {
    algorithm: 'ML-DSA-65',
    controller: event.controller,
    controller_epoch: event.controller_epoch,
    event_sha256: sha256(eventBytes),
    key_id: bindingKeyId,
    network: 'NEXUS-R016-SYNTHETIC',
    policy_id: policy.policy_id,
    schema: 'nexus.r018-pq-authorization/v0',
    signature_base64: '',
    status_authority: 'NONE',
  };
  const message = frame(AUTHORIZATION_DOMAIN, canonicalBytes(authorization));
  const signature = ml_dsa65.sign(message, keys.secretKey, { extraEntropy: false });
  keys.secretKey.fill(0);
  authorization.signature_base64 = Buffer.from(signature).toString('base64');
  return {
    'AUTHORIZATION.json': canonicalBytes(authorization),
    'EVENT.json': eventBytes,
    'POLICY.json': canonicalBytes(policy),
  };
}

async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2) throw new Error('usage: generate_fixture.mjs EVENT.json OUTPUT_DIRECTORY');
  const [eventPath, outputDirectory] = argv;
  const fixture = buildFixture(await readFile(eventPath));
  await mkdir(outputDirectory, { recursive: true });
  for (const [name, bytes] of Object.entries(fixture)) await writeFile(`${outputDirectory}/${name}`, Buffer.concat([bytes, Buffer.from('\n')]));
  const hashes = Object.fromEntries(Object.entries(fixture).map(([name, bytes]) => [name, sha256(Buffer.concat([bytes, Buffer.from('\n')]))]));
  process.stdout.write(`${JSON.stringify(hashes, Object.keys(hashes).sort())}\n`);
}

if (process.argv[1]?.endsWith('generate_fixture.mjs')) {
  main().catch((error) => {
    process.stderr.write(`FAIL: ${error.message}\n`);
    process.exitCode = 2;
  });
}
