#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  closeSync,
  constants,
  fstatSync,
  mkdtempSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const RECORD_SCHEMA = 'nexus.pcx-durable-record/v0';
const REPORT_SCHEMA = 'nexus.pcx-durable-independent-verification/v0';
const SUITE_SCHEMA = 'nexus.pcx-conformance-suite/v0';
const RECEIPT_SCHEMA = 'nexus.pcx-value-receipt/v0';
const CHECKPOINT_SCHEMA = 'nexus.pcx-checkpoint/v0';
const NETWORK_ID = 'NEXUS-R013-SYNTHETIC';
const GENESIS_ID = '974cd4da89feb9f7ae8e14d7b4359f4b76d8697f55e5793219c52e38b627b7de';
const GENESIS_SUPPLY = '1000';
const MAX_RECORDS = 256;
const MAX_PENDING_RECORDS = 32;
const MAX_RECORD_BYTES = 256 * 1024;
const MAX_LEDGER_BYTES = 6 * 1024 * 1024;
const MAX_GENESIS_BYTES = 256 * 1024;
const MAX_VERIFIER_BYTES = 2 * 1024 * 1024;
const MAX_JSON_DEPTH = 32;
const MAX_JSON_STRING_CHARS = 512 * 1024;
const HASH_RE = /^[0-9a-f]{64}$/;
const RECORD_NAME_RE = /^(?<sequence>[0-9]{8})-(?<hash>[0-9a-f]{64})\.pcx$/;
const PENDING_NAME_RE = /^\.pending-[0-9]+-[0-9a-f]{32}$/;
const R013_VERIFIER_SHA256 = 'fd547ec4e5aa4961ec8b238ad1cd3688bd02d47273a56a4d3cb5cabe1163c52c';

const RECORD_KEYS = [
  'checkpoint', 'next_state_root', 'previous_record_hash', 'previous_state_root',
  'receipt', 'record_hash', 'schema', 'sequence', 'status_authority',
  'transaction_raw_b64', 'transaction_sha256', 'tx_id',
];
const RECEIPT_KEYS = [
  'created_output_ids', 'decision', 'genesis_id', 'network_id', 'next_state_root',
  'previous_receipt_hash', 'previous_state_root', 'reason_code', 'receipt_hash',
  'schema', 'sequence', 'spent_output_ids', 'status_authority', 'tx_hash', 'tx_id',
];
const CHECKPOINT_KEYS = [
  'accepted_transaction_ids', 'candidate_status', 'checkpoint_id', 'genesis_id',
  'height', 'initial_state_root', 'network_id', 'receipt_head', 'schema', 'state_root',
  'status_authority', 'total_supply', 'utxo_count',
];

class Reject extends Error {}
const reject = (message) => { throw new Reject(message); };
const sha256 = (bytes) => createHash('sha256').update(bytes).digest();
const sha256Hex = (bytes) => sha256(bytes).toString('hex');
const taggedHash = (tag, message) => {
  const tagHash = sha256(Buffer.from(tag, 'ascii'));
  return createHash('sha256').update(tagHash).update(tagHash).update(message).digest('hex');
};

class StrictJsonParser {
  constructor(raw) {
    if (raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
      reject('UTF-8 BOM is not admitted.');
    }
    try {
      this.text = new TextDecoder('utf-8', { fatal: true }).decode(raw);
    } catch {
      reject('Input is not valid UTF-8.');
    }
    this.i = 0;
  }

  parse() {
    this.ws();
    const result = this.value(0);
    this.ws();
    if (this.i !== this.text.length) reject('Trailing JSON bytes.');
    return result;
  }

  ws() {
    while (this.i < this.text.length && /[\x20\x09\x0a\x0d]/.test(this.text[this.i])) this.i += 1;
  }

  value(depth) {
    if (depth > MAX_JSON_DEPTH) reject('JSON nesting exceeds the R014 bound.');
    this.ws();
    const ch = this.text[this.i];
    if (ch === '{') return this.object(depth);
    if (ch === '[') return this.array(depth);
    if (ch === '"') return this.string();
    reject(`Only object, array and string JSON values are admitted at offset ${this.i}.`);
  }

  object(depth) {
    this.i += 1;
    const result = Object.create(null);
    const seen = new Set();
    this.ws();
    if (this.text[this.i] === '}') { this.i += 1; return result; }
    while (true) {
      this.ws();
      if (this.text[this.i] !== '"') reject('Object key must be a string.');
      const key = this.string();
      if (seen.has(key)) reject(`Duplicate object key: ${key}`);
      seen.add(key);
      this.ws();
      if (this.text[this.i] !== ':') reject('Missing object colon.');
      this.i += 1;
      result[key] = this.value(depth + 1);
      this.ws();
      if (this.text[this.i] === '}') { this.i += 1; break; }
      if (this.text[this.i] !== ',') reject('Missing object comma.');
      this.i += 1;
    }
    return result;
  }

  array(depth) {
    this.i += 1;
    const result = [];
    this.ws();
    if (this.text[this.i] === ']') { this.i += 1; return result; }
    while (true) {
      result.push(this.value(depth + 1));
      this.ws();
      if (this.text[this.i] === ']') { this.i += 1; break; }
      if (this.text[this.i] !== ',') reject('Missing array comma.');
      this.i += 1;
    }
    return result;
  }

  string() {
    const start = this.i;
    this.i += 1;
    let escaped = false;
    while (this.i < this.text.length) {
      const code = this.text.charCodeAt(this.i);
      if (!escaped && code === 0x22) {
        this.i += 1;
        try { return JSON.parse(this.text.slice(start, this.i)); }
        catch { reject('Invalid JSON string.'); }
      }
      if (!escaped && code < 0x20) reject('Unescaped control byte in string.');
      if (!escaped && code === 0x5c) escaped = true;
      else escaped = false;
      this.i += 1;
    }
    reject('Unterminated JSON string.');
  }
}

const strictJson = (raw) => new StrictJsonParser(raw).parse();
const validateProfile = (value, depth = 0) => {
  if (depth > MAX_JSON_DEPTH) reject('JSON nesting exceeds the R014 bound.');
  if (typeof value === 'string') {
    if (value.length > MAX_JSON_STRING_CHARS) reject('JSON string exceeds the R014 bound.');
    for (let i = 0; i < value.length; i += 1) {
      const code = value.charCodeAt(i);
      if (code < 0x20 || code > 0x7e) reject('Only printable ASCII strings are admitted.');
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => validateProfile(item, depth + 1));
    return;
  }
  if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      validateProfile(key, depth + 1);
      validateProfile(item, depth + 1);
    });
    return;
  }
  reject('Only object, array and string JSON values are admitted.');
};

const sortValue = (value) => {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === 'object') {
    const output = Object.create(null);
    for (const key of Object.keys(value).sort()) output[key] = sortValue(value[key]);
    return output;
  }
  return value;
};
const canonicalBytes = (value) => Buffer.from(JSON.stringify(sortValue(value)), 'utf8');
const exactKeys = (value, expected, label) => {
  if (value === null || Array.isArray(value) || typeof value !== 'object') reject(`${label} must be an object.`);
  const actual = Object.keys(value).sort();
  if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) reject(`${label} key mismatch.`);
  return value;
};
const assertPlainDirectory = (path, label) => {
  const info = lstatSync(path, { throwIfNoEntry: true });
  if (info.isSymbolicLink() || !info.isDirectory()) reject(`${label} must be a real directory.`);
};
const readPlainFile = (path, maximum, label) => {
  let descriptor;
  try {
    descriptor = openSync(
      path,
      constants.O_RDONLY | (constants.O_CLOEXEC ?? 0) | (constants.O_NOFOLLOW ?? 0),
    );
  } catch (error) {
    reject(`Cannot safely open ${label}: ${error?.code || error}`);
  }
  try {
    const info = fstatSync(descriptor);
    if (!info.isFile() || info.size < 1 || info.size > maximum) {
      reject(`${label} must be a bounded regular non-symlink file.`);
    }
    const raw = readFileSync(descriptor);
    if (raw.length < 1 || raw.length > maximum) reject(`${label} changed outside its size bound while reading.`);
    return raw;
  } finally {
    closeSync(descriptor);
  }
};
const hash = (value, label, empty = false) => {
  if (empty && value === '') return value;
  if (typeof value !== 'string' || !HASH_RE.test(value)) reject(`${label} must be lowercase SHA-256 hex.`);
  return value;
};
const decodeBase64 = (value) => {
  if (typeof value !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    reject('transaction_raw_b64 is not canonical base64.');
  }
  const raw = Buffer.from(value, 'base64');
  if (raw.length < 1 || raw.length > MAX_RECORD_BYTES || raw.toString('base64') !== value) {
    reject('transaction_raw_b64 is empty, oversized or non-canonical.');
  }
  return raw;
};
const recordHash = (record) => {
  const subject = structuredClone(record);
  subject.record_hash = '';
  return taggedHash('NEXUS/PCX/DURABLE-RECORD/V0', canonicalBytes(subject));
};
const receiptHash = (receipt) => {
  const subject = structuredClone(receipt);
  subject.receipt_hash = '';
  return taggedHash('NEXUS/PCX/DECISION/V0', canonicalBytes(subject));
};
const outputId = (txId, index) => {
  const encoded = Buffer.alloc(36);
  Buffer.from(txId, 'hex').copy(encoded, 0);
  encoded.writeUInt32BE(index, 32);
  return taggedHash('NEXUS/PCX/OUTPOINT/V0', encoded);
};
const checkpointId = (checkpoint) => taggedHash('NEXUS/PCX/CHECKPOINT/V0', canonicalBytes(checkpoint));

const readCommittedRecords = (ledger) => {
  const recordDirectory = join(ledger, 'records');
  assertPlainDirectory(recordDirectory, 'Durable record directory');
  const names = readdirSync(recordDirectory);
  if (names.length > MAX_RECORDS + MAX_PENDING_RECORDS) reject('Durable record directory exceeds its entry bound.');
  const committed = [];
  let pendingCount = 0;
  let totalBytes = 0;
  for (const name of names) {
    const info = lstatSync(join(recordDirectory, name), { throwIfNoEntry: true });
    if (info.isSymbolicLink() || !info.isFile()) reject(`Non-file or linked durable record member: ${name}`);
    totalBytes += info.size;
    if (totalBytes > MAX_LEDGER_BYTES) reject(`Durable ledger exceeds ${MAX_LEDGER_BYTES} bytes.`);
    if (PENDING_NAME_RE.test(name)) {
      pendingCount += 1;
      if (pendingCount > MAX_PENDING_RECORDS) reject(`Durable ledger exceeds ${MAX_PENDING_RECORDS} pending records.`);
      continue;
    }
    const match = RECORD_NAME_RE.exec(name);
    if (!match) reject(`Unknown durable record member: ${name}`);
    committed.push({ name, match });
  }
  committed.sort((a, b) => a.name.localeCompare(b.name));
  if (committed.length > MAX_RECORDS) reject(`Independent replay is bounded to ${MAX_RECORDS} records.`);
  return committed.map(({ name, match }, index) => {
    const sequence = index + 1;
    if (Number.parseInt(match.groups.sequence, 10) !== sequence) reject(`Record sequence gap at ${name}.`);
    const raw = readPlainFile(join(recordDirectory, name), MAX_RECORD_BYTES, `durable record ${name}`);
    const record = strictJson(raw);
    validateProfile(record);
    exactKeys(record, RECORD_KEYS, 'durable record');
    if (!raw.equals(canonicalBytes(record))) reject(`Record is not canonical JSON: ${name}`);
    if (record.schema !== RECORD_SCHEMA || record.status_authority !== 'NONE') reject(`Record authority/profile failed: ${name}`);
    if (record.sequence !== String(sequence)) reject(`Payload sequence mismatch: ${name}`);
    hash(record.record_hash, 'record_hash');
    const computed = recordHash(record);
    if (computed !== record.record_hash || match.groups.hash !== computed) reject(`Record hash mismatch: ${name}`);
    const transactionRaw = decodeBase64(record.transaction_raw_b64);
    if (record.transaction_sha256 !== sha256Hex(transactionRaw)) reject(`Transaction byte hash mismatch: ${name}`);
    return { name, record, transactionRaw };
  });
};

const independentlyReplay = (ledger, r013Verifier, records, genesisRaw) => {
  const suite = {
    schema: SUITE_SCHEMA,
    suite_id: 'R014-DURABLE-INDEPENDENT-REPLAY',
    genesis_b64: genesisRaw.toString('base64'),
    histories: [{
      history_id: 'DURABLE-PREFIX',
      cases: records.map(({ record }, index) => ({
        case_id: `DURABLE-${String(index + 1).padStart(8, '0')}`,
        raw_b64: record.transaction_raw_b64,
      })),
    }],
    status_authority: 'NONE',
  };
  const temporary = mkdtempSync(join(tmpdir(), 'nexus-r014-independent-'));
  try {
    const suitePath = join(temporary, 'SUITE.json');
    writeFileSync(suitePath, canonicalBytes(suite));
    const result = spawnSync(process.execPath, [r013Verifier, suitePath], {
      cwd: resolve(ledger, '..'),
      encoding: null,
      timeout: 30000,
      maxBuffer: 16 * 1024 * 1024,
    });
    if (result.status !== 0) reject(`R013 independent state replay failed: ${result.stderr?.toString('utf8') || result.status}`);
    const report = strictJson(result.stdout);
    validateProfile(report);
    return report;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
};

const verify = (ledger, r013Verifier) => {
  assertPlainDirectory(ledger, 'Durable ledger');
  const r013VerifierRaw = readPlainFile(r013Verifier, MAX_VERIFIER_BYTES, 'R013 independent verifier');
  const r013VerifierSha256 = sha256Hex(r013VerifierRaw);
  if (r013VerifierSha256 !== R013_VERIFIER_SHA256) reject('R013 independent verifier source is not pinned.');
  const genesisRaw = readPlainFile(join(ledger, 'GENESIS.pcx'), MAX_GENESIS_BYTES, 'stored genesis');
  const genesis = strictJson(genesisRaw);
  validateProfile(genesis);
  if (!genesisRaw.equals(canonicalBytes(genesis))) reject('Stored genesis is not canonical exact bytes.');
  if (genesis.genesis_id !== GENESIS_ID || genesis.status_authority !== 'NONE') reject('Stored genesis identity/authority failed.');
  if (!Array.isArray(genesis.outputs)) reject('Stored genesis outputs are invalid.');

  const records = readCommittedRecords(ledger);
  let previousRecordHash = '';
  for (const { record, name } of records) {
    if (record.previous_record_hash !== previousRecordHash) reject(`Record hash-chain mismatch: ${name}`);
    previousRecordHash = record.record_hash;
  }

  if (records.length === 0) {
    reject('Independent R014 evidence requires at least one durable record.');
  }
  const stateReport = independentlyReplay(ledger, r013Verifier, records, genesisRaw);
  if (stateReport.genesis_id !== GENESIS_ID || stateReport.status_authority !== 'NONE') reject('R013 replay report identity failed.');
  if (!Array.isArray(stateReport.histories) || stateReport.histories.length !== 1) reject('R013 replay report history shape failed.');
  const history = stateReport.histories[0];
  if (!Array.isArray(history.cases) || history.cases.length !== records.length) reject('R013 replay case count failed.');

  let priorReceiptHash = '';
  let utxoCount = genesis.outputs.length;
  const acceptedTxIds = [];
  records.forEach(({ record, transactionRaw, name }, index) => {
    const outcome = history.cases[index];
    if (
      outcome.decision !== 'CANDIDATE_ACCEPTED'
      || outcome.reason_code !== 'VALID_CONSERVED_TRANSFER'
      || outcome.idempotent !== 'FALSE'
    ) reject(`Committed record did not independently replay as a fresh valid transfer: ${name}`);
    const tx = strictJson(transactionRaw);
    validateProfile(tx);
    if (!transactionRaw.equals(canonicalBytes(tx))) reject(`Transaction is not canonical: ${name}`);
    if (tx.tx_id !== outcome.tx_id || record.tx_id !== outcome.tx_id) reject(`Transaction identity mismatch: ${name}`);
    const txHash = taggedHash('NEXUS/PCX/RETURN/V0', canonicalBytes(tx));
    const spent = tx.inputs.map((input) => input.output_id);
    const created = tx.outputs.map((_, outputIndex) => outputId(tx.tx_id, outputIndex));
    const receipt = {
      schema: RECEIPT_SCHEMA,
      sequence: String(index + 1),
      network_id: NETWORK_ID,
      genesis_id: GENESIS_ID,
      tx_id: tx.tx_id,
      tx_hash: txHash,
      decision: 'CANDIDATE_ACCEPTED',
      reason_code: 'VALID_CONSERVED_TRANSFER',
      spent_output_ids: spent,
      created_output_ids: created,
      previous_state_root: outcome.previous_state_root,
      next_state_root: outcome.next_state_root,
      previous_receipt_hash: priorReceiptHash,
      status_authority: 'NONE',
      receipt_hash: '',
    };
    receipt.receipt_hash = receiptHash(receipt);
    exactKeys(record.receipt, RECEIPT_KEYS, 'receipt');
    if (!canonicalBytes(record.receipt).equals(canonicalBytes(receipt))) reject(`Receipt did not independently reproduce: ${name}`);
    if (receipt.receipt_hash !== outcome.receipt_hash) reject(`Independent receipt hash mismatch: ${name}`);

    utxoCount += tx.outputs.length - tx.inputs.length;
    acceptedTxIds.push(tx.tx_id);
    const checkpoint = {
      schema: CHECKPOINT_SCHEMA,
      network_id: NETWORK_ID,
      genesis_id: GENESIS_ID,
      height: String(index + 1),
      initial_state_root: stateReport.initial_state_root,
      state_root: outcome.next_state_root,
      receipt_head: receipt.receipt_hash,
      accepted_transaction_ids: [...acceptedTxIds],
      utxo_count: String(utxoCount),
      total_supply: GENESIS_SUPPLY,
      candidate_status: 'CANDIDATE',
      status_authority: 'NONE',
    };
    checkpoint.checkpoint_id = checkpointId(checkpoint);
    exactKeys(record.checkpoint, CHECKPOINT_KEYS, 'checkpoint');
    if (!canonicalBytes(record.checkpoint).equals(canonicalBytes(checkpoint))) reject(`Checkpoint did not independently reproduce: ${name}`);
    if (
      record.previous_state_root !== outcome.previous_state_root
      || record.next_state_root !== outcome.next_state_root
    ) reject(`Record state roots disagree with independent replay: ${name}`);
    priorReceiptHash = receipt.receipt_hash;
  });

  const finalCheckpoint = records.at(-1).record.checkpoint;
  if (!canonicalBytes(history.checkpoint).equals(canonicalBytes(finalCheckpoint))) reject('Final R013 checkpoint differs from durable checkpoint.');
  const ownPath = fileURLToPath(import.meta.url);
  return {
    schema: REPORT_SCHEMA,
    status: 'PASS',
    record_count: String(records.length),
    record_head: records.at(-1).record.record_hash,
    state_root: finalCheckpoint.state_root,
    receipt_head: finalCheckpoint.receipt_head,
    checkpoint_id: finalCheckpoint.checkpoint_id,
    total_supply: finalCheckpoint.total_supply,
    journal_verifier_sha256: sha256Hex(readPlainFile(ownPath, MAX_VERIFIER_BYTES, 'R014 journal verifier')),
    state_verifier_sha256: r013VerifierSha256,
    status_authority: 'NONE',
    claims: [
      'A separate JavaScript process reproduced every committed receipt and checkpoint from the exact signed transfer bytes.',
    ],
    non_claims: [
      'This is single-host synthetic crash-recovery evidence, not external anchoring, global finality, custody security or economic value.',
    ],
  };
};

if (process.argv.length !== 4) {
  process.stderr.write('usage: node independent_journal_verifier.mjs LEDGER_DIR R013_VERIFIER\n');
  process.exit(2);
}

try {
  const report = verify(resolve(process.argv[2]), resolve(process.argv[3]));
  process.stdout.write(Buffer.concat([canonicalBytes(report), Buffer.from('\n')]));
} catch (error) {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exit(2);
}
