#!/usr/bin/env node
/** Independent R017 envelope/checkpoint verifier plus independent R016 branch replay. */

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyAsync } from '@noble/ed25519';

const ZERO = '0'.repeat(64);
const CHECKPOINT_DOMAIN = 'NEXUS/R017/CHECKPOINT/v0';
const FORK_DOMAIN = 'NEXUS/R017/FORK-EVIDENCE/v0';
const REPORT_DOMAIN = 'NEXUS/R017/COMPOUND-REPORT/v0';
const fail = (message) => { throw new Error(message); };

function canonical(value) {
  if (typeof value === 'string') return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map((key) => `${canonical(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  fail('protocol JSON permits only strings, arrays, and objects');
}
const bytes = (value) => Buffer.from(canonical(value), 'ascii');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
function frame(domain, payload) {
  const d = Buffer.from(domain, 'ascii');
  const a = Buffer.alloc(2); a.writeUInt16BE(d.length);
  const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(payload.length));
  return Buffer.concat([a, d, b, payload]);
}
const hashValue = (domain, value) => sha256(frame(domain, bytes(value)));
function decodeDocument(raw) {
  if (raw.at(-1) !== 0x0a) fail('document lacks final newline');
  const body = raw.subarray(0, raw.length - 1);
  const value = JSON.parse(body.toString('ascii'));
  if (!bytes(value).equals(body)) fail('document is not canonical JSON');
  return value;
}
function checkpointMessage(checkpoint) {
  const subject = structuredClone(checkpoint); subject.signature = '';
  return frame(CHECKPOINT_DOMAIN, bytes(subject));
}
async function verifyCheckpoint(checkpoint, campaign) {
  if (checkpoint.schema !== 'nexus.r017-checkpoint/v0' || checkpoint.network !== 'NEXUS-R016-SYNTHETIC' || checkpoint.profile !== 'R017-REPLICATION-FORK-EVIDENCE-V0') fail('checkpoint domain mismatch');
  if (checkpoint.status_authority !== 'NONE' || checkpoint.session !== campaign.session || checkpoint.genesis_sha256 !== campaign.genesis_sha256) fail('checkpoint binding mismatch');
  if (campaign.host_keys[checkpoint.host] !== checkpoint.host_key) fail('checkpoint sender substitution');
  const subject = structuredClone(checkpoint); subject.signature = '';
  const payload = Object.fromEntries(Object.entries(subject).filter(([key]) => !['payload_digest', 'signature'].includes(key)));
  if (checkpoint.payload_digest !== sha256(bytes(payload))) fail('checkpoint payload digest mismatch');
  if (!await verifyAsync(Buffer.from(checkpoint.signature, 'hex'), checkpointMessage(checkpoint), Buffer.from(checkpoint.host_key, 'hex'))) fail('checkpoint signature invalid');
}

async function verify(campaignPath, expectedPath) {
  const campaign = decodeDocument(await readFile(campaignPath));
  const expected = decodeDocument(await readFile(expectedPath));
  if (campaign.schema !== 'nexus.r017-compound-campaign/v0' || campaign.status_authority !== 'NONE') fail('campaign envelope mismatch');
  const genesis = Buffer.from(campaign.genesis_b64, 'base64');
  if (sha256(genesis) !== campaign.genesis_sha256) fail('genesis digest mismatch');
  await Promise.all(campaign.checkpoints.map((checkpoint) => verifyCheckpoint(checkpoint, campaign)));

  {
    if (!Array.isArray(campaign.branch_transcripts) || campaign.branch_transcripts.length !== 2) fail('exactly two closed branch transcripts required');
    for (const transcript of campaign.branch_transcripts) {
      if (transcript.genesis_sha256 !== campaign.genesis_sha256 || transcript.status_authority !== 'NONE' || transcript.closure !== 'CLOSED_EXACT_PREFIX') fail('branch transcript binding mismatch');
    }
    const firstWires = campaign.branch_transcripts.map((item) => item.records[0].event_b64);
    if (new Set(firstWires).size !== 1) fail('branches lack an exact common event');
    const siblingRecords = campaign.branch_transcripts.map((item) => item.records[1]);
    const predecessors = siblingRecords.map((record) => JSON.parse(Buffer.from(record.event_b64, 'base64')).predecessor);
    if (new Set(predecessors).size !== 1 || new Set(siblingRecords.map((record) => record.object_id)).size !== 2) fail('branches are not distinct siblings');
    const branchRoots = siblingRecords.map((record) => record.receipt.after_root).sort();
    if (canonical(branchRoots) !== canonical(expected.branch_roots)) fail('branch roots mismatch');

    const children = siblingRecords.map((record) => ({ event_id: record.object_id, event_sha256: record.event_sha256 }))
      .sort((a, b) => Buffer.from(a.event_sha256, 'hex').compare(Buffer.from(b.event_sha256, 'hex')));
    const observations = campaign.checkpoints.map((checkpoint) => ({ checkpoint_digest: sha256(bytes(checkpoint)), host: checkpoint.host }))
      .sort((a, b) => a.host.localeCompare(b.host) || a.checkpoint_digest.localeCompare(b.checkpoint_digest));
    const evidence = {
      branch_selection: 'NONE', checkpoint_observations: observations, children,
      classification: 'SIBLING_FORK_OBSERVED', evidence_id: ZERO,
      genesis_sha256: campaign.genesis_sha256, network: 'NEXUS-R016-SYNTHETIC',
      predecessor: predecessors[0], profile: 'R017-REPLICATION-FORK-EVIDENCE-V0',
      schema: 'nexus.r017-fork-evidence/v0', status_authority: 'NONE',
    };
    evidence.evidence_id = hashValue(FORK_DOMAIN, evidence);
    const report = {
      accounted_deliveries: String(campaign.schedule.length), branch_roots: branchRoots,
      checkpoint_count: String(campaign.checkpoints.length), fork_evidence: evidence,
      genesis_sha256: campaign.genesis_sha256, host_count: String(Object.keys(campaign.host_keys).length),
      report_id: ZERO, schema: 'nexus.r017-compound-report/v0', status: 'PASS', status_authority: 'NONE',
    };
    report.report_id = hashValue(REPORT_DOMAIN, report);
    if (canonical(report) !== canonical(expected)) fail('independent R017 report mismatch');
    return report;
  }
}

if (process.argv.length !== 4) fail('usage: independent_verifier.mjs COMPOUND_CAMPAIGN.json EXPECTED_REPORT.json');
const report = await verify(process.argv[2], process.argv[3]);
process.stdout.write(`${canonical(report)}\n`);
