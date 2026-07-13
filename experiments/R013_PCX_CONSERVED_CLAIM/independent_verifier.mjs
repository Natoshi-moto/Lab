#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as ed from '@noble/ed25519';

const GENESIS_SCHEMA = 'nexus.pcx-genesis/v0';
const TRANSFER_SCHEMA = 'nexus.pcx-transfer/v0';
const RECEIPT_SCHEMA = 'nexus.pcx-value-receipt/v0';
const CHECKPOINT_SCHEMA = 'nexus.pcx-checkpoint/v0';
const REPORT_SCHEMA = 'nexus.pcx-conformance-report/v0';
const SUITE_SCHEMA = 'nexus.pcx-conformance-suite/v0';
const NETWORK_ID = 'NEXUS-R013-SYNTHETIC';
const UNIT_LABEL = 'R013-SYNTHETIC-CLAIM';
const GENESIS_SUPPLY = 1000n;
const MAX_INPUTS = 8;
const MAX_OUTPUTS = 8;
const MAX_LIVE_UTXOS = 64;
const MAX_RAW_BYTES = 64 * 1024;
const MAX_HISTORIES = 32;
const MAX_CASES = 256;
const MAX_JSON_DEPTH = 32;
const MAX_JSON_STRING_CHARS = 128 * 1024;
const PINNED_GENESIS_ID = '974cd4da89feb9f7ae8e14d7b4359f4b76d8697f55e5793219c52e38b627b7de';
const ALLOWED_OWNER_KEYS = new Set([
  'bd31dcf54d9b3255ab917685de56afd9a593c503086c9a02bc692bc40a28cdaa',
  'e213e0ad80924531679056653aabb4a6ad9937e42ecac3c5e0fe2c82c212b049',
  '0a207102823217b7e722847916ba90ffc1d249d77b7220f646fb633aacde54c7',
  'b5e14889a863987b67737e56699decaf8c62f5af1fc8e0773836a95782de4fec',
]);

const HASH_RE = /^[0-9a-f]{64}$/;
const SIGNATURE_RE = /^[0-9a-f]{128}$/;
const DECIMAL_RE = /^(0|[1-9][0-9]*)$/;
const ASCII_TOKEN_RE = /^[A-Za-z0-9._:/-]+$/;

const GENESIS_KEYS = ['genesis_id', 'network_id', 'outputs', 'schema', 'status_authority', 'unit_label'];
const TRANSFER_KEYS = [
  'anchor_state_root', 'genesis_id', 'inputs', 'network_id', 'nonce',
  'outputs', 'schema', 'status_authority', 'tx_id', 'witnesses',
];
const INPUT_KEYS = ['creating_tx_id', 'output_id', 'output_index'];
const OUTPUT_KEYS = ['amount', 'owner_public_key'];
const WITNESS_KEYS = ['input_index', 'owner_public_key', 'signature'];

class Reject extends Error {
  constructor(code, detail) {
    super(`${code}: ${detail}`);
    this.code = code;
  }
}

const reject = (code, detail) => { throw new Reject(code, detail); };
const sha256 = (bytes) => createHash('sha256').update(bytes).digest();
const taggedHash = (tag, message) => {
  const th = sha256(Buffer.from(tag, 'ascii'));
  return createHash('sha256').update(th).update(th).update(message).digest('hex');
};

class StrictJsonParser {
  constructor(raw) {
    if (raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
      reject('INVALID_ENCODING', 'UTF-8 BOM is not admitted.');
    }
    try {
      this.text = new TextDecoder('utf-8', { fatal: true }).decode(raw);
    } catch (error) {
      throw new Reject('INVALID_ENCODING', 'Input is not UTF-8.');
    }
    this.i = 0;
  }

  parse() {
    this.ws();
    const value = this.value(0);
    this.ws();
    if (this.i !== this.text.length) reject('INVALID_JSON', 'Trailing JSON bytes.');
    return value;
  }

  ws() {
    while (this.i < this.text.length && /[\x20\x09\x0a\x0d]/.test(this.text[this.i])) this.i += 1;
  }

  value(depth) {
    if (depth > MAX_JSON_DEPTH) reject('JSON_DEPTH_EXCEEDED', 'JSON nesting exceeds the R013 limit.');
    this.ws();
    const ch = this.text[this.i];
    if (ch === '{') return this.object(depth);
    if (ch === '[') return this.array(depth);
    if (ch === '"') return this.string();
    if (this.text.startsWith('true', this.i)) { this.i += 4; return true; }
    if (this.text.startsWith('false', this.i)) { this.i += 5; return false; }
    if (this.text.startsWith('null', this.i)) { this.i += 4; return null; }
    if (
      this.text.startsWith('NaN', this.i)
      || this.text.startsWith('Infinity', this.i)
      || this.text.startsWith('-Infinity', this.i)
    ) reject('INVALID_JSON_NONFINITE', 'Non-finite JSON number.');
    if (ch === '-' || (ch >= '0' && ch <= '9')) return this.number();
    reject('INVALID_JSON', `Unexpected JSON token at offset ${this.i}.`);
  }

  object(depth) {
    this.i += 1;
    const result = Object.create(null);
    const seen = new Set();
    this.ws();
    if (this.text[this.i] === '}') { this.i += 1; return result; }
    while (true) {
      this.ws();
      if (this.text[this.i] !== '"') reject('INVALID_JSON', 'Object key must be a string.');
      const key = this.string();
      if (seen.has(key)) reject('INVALID_JSON_DUPLICATE_KEY', `Duplicate object key: ${key}`);
      seen.add(key);
      this.ws();
      if (this.text[this.i] !== ':') reject('INVALID_JSON', 'Missing object colon.');
      this.i += 1;
      result[key] = this.value(depth + 1);
      this.ws();
      if (this.text[this.i] === '}') { this.i += 1; break; }
      if (this.text[this.i] !== ',') reject('INVALID_JSON', 'Missing object comma.');
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
      if (this.text[this.i] !== ',') reject('INVALID_JSON', 'Missing array comma.');
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
        const token = this.text.slice(start, this.i);
        try { return JSON.parse(token); } catch { reject('INVALID_JSON', 'Invalid JSON string.'); }
      }
      if (!escaped && code < 0x20) reject('INVALID_JSON', 'Unescaped control byte in string.');
      if (!escaped && code === 0x5c) escaped = true;
      else escaped = false;
      this.i += 1;
    }
    reject('INVALID_JSON', 'Unterminated JSON string.');
  }

  number() {
    const rest = this.text.slice(this.i);
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(rest);
    if (!match) reject('INVALID_JSON', 'Malformed JSON number.');
    this.i += match[0].length;
    reject('INVALID_JSON_NUMBER', 'JSON numeric tokens are not admitted.');
  }
}

const strictJson = (raw) => new StrictJsonParser(raw).parse();
const validateProfileTree = (value, depth = 0) => {
  if (depth > MAX_JSON_DEPTH) reject('JSON_DEPTH_EXCEEDED', 'JSON nesting exceeds the R013 limit.');
  if (typeof value === 'string') {
    if (value.length > MAX_JSON_STRING_CHARS) reject('STRING_LIMIT_EXCEEDED', 'JSON string exceeds the R013 limit.');
    for (let i = 0; i < value.length; i += 1) {
      const code = value.charCodeAt(i);
      if (code < 0x20 || code > 0x7e) reject('INVALID_STRING_ENCODING', 'R013 admits printable ASCII strings only.');
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => validateProfileTree(item, depth + 1));
    return;
  }
  if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      validateProfileTree(key, depth + 1);
      validateProfileTree(item, depth + 1);
    });
    return;
  }
  reject('SCHEMA_INVALID', 'R013 admits only objects, arrays, and string scalars.');
};
const sortValue = (value) => {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === 'object') {
    const result = Object.create(null);
    for (const key of Object.keys(value).sort()) result[key] = sortValue(value[key]);
    return result;
  }
  return value;
};
const canonicalBytes = (value) => Buffer.from(JSON.stringify(sortValue(value)), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));

const exactKeys = (value, expected, label) => {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    reject('SCHEMA_INVALID', `${label} must be an object.`);
  }
  const actual = Object.keys(value).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    reject('SCHEMA_INVALID', `${label} key mismatch.`);
  }
  if (actual.some((key) => !/^[\x00-\x7f]+$/.test(key))) reject('SCHEMA_INVALID', `${label} keys must be ASCII.`);
  return value;
};
const token = (value, label) => {
  if (typeof value !== 'string' || !ASCII_TOKEN_RE.test(value)) reject('SCHEMA_INVALID', `${label} must be an ASCII token.`);
  return value;
};
const hash = (value, label) => {
  if (typeof value !== 'string' || !HASH_RE.test(value)) reject('SCHEMA_INVALID', `${label} must be lowercase SHA-256 hex.`);
  return value;
};
const publicKey = (value, label) => {
  const key = hash(value, label);
  if (!ALLOWED_OWNER_KEYS.has(key)) reject('OWNER_KEY_INVALID', `${label} is not a frozen synthetic owner key.`);
  return key;
};
const indexValue = (value, label, maximum = null) => {
  if (typeof value !== 'string' || !DECIMAL_RE.test(value)) reject('SCHEMA_INVALID', `${label} must be a canonical decimal string.`);
  if (maximum !== null) {
    const limit = String(maximum);
    if (value.length > limit.length || (value.length === limit.length && value > limit)) reject('SCHEMA_INVALID', `${label} is out of range.`);
  } else if (value.length > 10) reject('SCHEMA_INVALID', `${label} is out of range.`);
  const number = BigInt(value);
  return Number(number);
};
const amountValue = (value, label) => {
  if (typeof value !== 'string' || !DECIMAL_RE.test(value)) reject('INVALID_AMOUNT', `${label} must be a canonical decimal string.`);
  const limit = String(GENESIS_SUPPLY);
  if (value === '0' || value.length > limit.length || (value.length === limit.length && value > limit)) {
    reject('INVALID_AMOUNT', `${label} is outside 1..1000.`);
  }
  const amount = BigInt(value);
  return amount;
};

const genesisId = (genesis) => {
  const subject = clone(genesis);
  subject.genesis_id = '';
  return taggedHash('NEXUS/PCX/GENESIS/V0', canonicalBytes(subject));
};
const transactionId = (tx) => taggedHash('NEXUS/PCX/TRANSACTION/V0', canonicalBytes({
  schema: tx.schema,
  network_id: tx.network_id,
  genesis_id: tx.genesis_id,
  anchor_state_root: tx.anchor_state_root,
  nonce: tx.nonce,
  inputs: tx.inputs,
  outputs: tx.outputs,
  status_authority: tx.status_authority,
}));
const transactionHash = (tx) => taggedHash('NEXUS/PCX/RETURN/V0', canonicalBytes(tx));
const outputId = (creatingTxId, outputIndex) => {
  const index = Buffer.alloc(4);
  index.writeUInt32BE(outputIndex);
  return taggedHash('NEXUS/PCX/OUTPOINT/V0', Buffer.concat([Buffer.from(creatingTxId, 'hex'), index]));
};
const signatureMessage = (txId, inputIndex, outId) => {
  const index = Buffer.alloc(4);
  index.writeUInt32BE(inputIndex);
  return Buffer.from(taggedHash('NEXUS/PCX/AUTHORIZATION/V0', Buffer.concat([
    Buffer.from(PINNED_GENESIS_ID, 'hex'), Buffer.from(txId, 'hex'), index, Buffer.from(outId, 'hex'),
  ])), 'hex');
};
const stateRoot = (state) => {
  const records = [...state.keys()].sort().map((key) => state.get(key));
  return taggedHash('NEXUS/PCX/STATE/V0', canonicalBytes(records));
};
const receiptHash = (receipt) => {
  const subject = clone(receipt);
  subject.receipt_hash = '';
  return taggedHash('NEXUS/PCX/DECISION/V0', canonicalBytes(subject));
};

const decodeRaw = (value) => {
  if (typeof value !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    reject('INVALID_ENCODING', 'raw_b64 is not canonical base64.');
  }
  const raw = Buffer.from(value, 'base64');
  if (raw.length < 1 || raw.length > MAX_RAW_BYTES || raw.toString('base64') !== value) {
    reject('INVALID_ENCODING', 'Raw object is empty, oversized, or non-canonical base64.');
  }
  return raw;
};

const validateGenesis = (raw) => {
  const genesis = strictJson(raw);
  validateProfileTree(genesis);
  if (!canonicalBytes(genesis).equals(raw)) reject('NON_CANONICAL_ENCODING', 'Genesis bytes are not canonical.');
  exactKeys(genesis, GENESIS_KEYS, 'genesis');
  if (genesis.schema !== GENESIS_SCHEMA) reject('SCHEMA_INVALID', 'Unsupported genesis schema.');
  if (genesis.network_id !== NETWORK_ID || genesis.unit_label !== UNIT_LABEL) reject('GENESIS_MISMATCH', 'Genesis domain mismatch.');
  if (genesis.status_authority !== 'NONE') reject('SCHEMA_INVALID', 'Genesis authority must be NONE.');
  hash(genesis.genesis_id, 'genesis_id');
  if (genesisId(genesis) !== genesis.genesis_id || genesis.genesis_id !== PINNED_GENESIS_ID) {
    reject('GENESIS_MISMATCH', 'Genesis identity is not pinned.');
  }
  if (!Array.isArray(genesis.outputs) || genesis.outputs.length < 1 || genesis.outputs.length > MAX_OUTPUTS) {
    reject('SCHEMA_INVALID', 'Genesis outputs are outside bounds.');
  }
  const state = new Map();
  let total = 0n;
  genesis.outputs.forEach((rawOutput, i) => {
    const output = exactKeys(rawOutput, OUTPUT_KEYS, `genesis output ${i}`);
    const owner = publicKey(output.owner_public_key, `genesis owner ${i}`);
    const amount = amountValue(output.amount, `genesis amount ${i}`);
    total += amount;
    const outId = outputId(genesis.genesis_id, i);
    state.set(outId, {
      output_id: outId,
      creating_tx_id: genesis.genesis_id,
      output_index: String(i),
      owner_public_key: owner,
      amount: String(amount),
    });
  });
  if (total !== GENESIS_SUPPLY) reject('CONSERVATION_VIOLATION', 'Genesis supply mismatch.');
  return { genesis, state, initialRoot: stateRoot(state) };
};

const validateTransfer = (raw) => {
  const tx = strictJson(raw);
  validateProfileTree(tx);
  if (!canonicalBytes(tx).equals(raw)) reject('NON_CANONICAL_ENCODING', 'Transfer bytes are not canonical.');
  exactKeys(tx, TRANSFER_KEYS, 'transfer');
  if (tx.schema !== TRANSFER_SCHEMA) reject('SCHEMA_INVALID', 'Unsupported transfer schema.');
  if (tx.network_id !== NETWORK_ID) reject('DOMAIN_MISMATCH', 'Transfer network mismatch.');
  if (tx.genesis_id !== PINNED_GENESIS_ID) reject('GENESIS_MISMATCH', 'Transfer genesis mismatch.');
  if (tx.status_authority !== 'NONE') reject('SCHEMA_INVALID', 'Transfer authority must be NONE.');
  hash(tx.anchor_state_root, 'anchor_state_root'); hash(tx.nonce, 'nonce'); hash(tx.tx_id, 'tx_id');
  if (!Array.isArray(tx.inputs) || tx.inputs.length < 1 || tx.inputs.length > MAX_INPUTS) reject('SCHEMA_INVALID', 'Input bounds.');
  if (!Array.isArray(tx.outputs) || tx.outputs.length < 1 || tx.outputs.length > MAX_OUTPUTS) reject('SCHEMA_INVALID', 'Output bounds.');
  if (!Array.isArray(tx.witnesses) || tx.witnesses.length !== tx.inputs.length) reject('AUTHORIZATION_SET_INVALID', 'Witness count mismatch.');
  const order = tx.inputs.map((rawInput, i) => {
    const input = exactKeys(rawInput, INPUT_KEYS, `input ${i}`);
    const creating = hash(input.creating_tx_id, `input ${i} creating_tx_id`);
    const outputIndex = indexValue(input.output_index, `input ${i} output_index`, MAX_OUTPUTS - 1);
    hash(input.output_id, `input ${i} output_id`);
    return `${creating}:${String(outputIndex).padStart(3, '0')}`;
  });
  if (JSON.stringify(order) !== JSON.stringify([...order].sort())) reject('INPUT_ORDER_INVALID', 'Input order is not canonical.');
  if (new Set(order).size !== order.length) reject('DUPLICATE_INPUT', 'Input outpoint is duplicated.');
  tx.outputs.forEach((rawOutput, i) => {
    const output = exactKeys(rawOutput, OUTPUT_KEYS, `output ${i}`);
    publicKey(output.owner_public_key, `output ${i} owner`);
    amountValue(output.amount, `output ${i} amount`);
  });
  tx.witnesses.forEach((rawWitness, i) => {
    const witness = exactKeys(rawWitness, WITNESS_KEYS, `witness ${i}`);
    if (indexValue(witness.input_index, `witness ${i} input_index`, MAX_INPUTS - 1) !== i) {
      reject('AUTHORIZATION_SET_INVALID', 'Witness order is not canonical.');
    }
    publicKey(witness.owner_public_key, `witness ${i} owner`);
    if (typeof witness.signature !== 'string' || !SIGNATURE_RE.test(witness.signature)) reject('SIGNATURE_INVALID', 'Malformed signature.');
  });
  if (transactionId(tx) !== tx.tx_id) reject('TRANSACTION_ID_MISMATCH', 'Transaction ID mismatch.');
  return tx;
};

const checkpoint = (state, receipts, initialRoot) => {
  const cp = {
    schema: CHECKPOINT_SCHEMA,
    network_id: NETWORK_ID,
    genesis_id: PINNED_GENESIS_ID,
    height: String(receipts.length),
    initial_state_root: initialRoot,
    state_root: stateRoot(state),
    receipt_head: receipts.length ? receipts.at(-1).receipt_hash : '',
    accepted_transaction_ids: receipts.map((receipt) => receipt.tx_id),
    utxo_count: String(state.size),
    total_supply: String([...state.values()].reduce((sum, item) => sum + BigInt(item.amount), 0n)),
    candidate_status: 'CANDIDATE',
    status_authority: 'NONE',
  };
  cp.checkpoint_id = taggedHash('NEXUS/PCX/CHECKPOINT/V0', canonicalBytes(cp));
  return cp;
};

class History {
  constructor(initialState, initialRoot) {
    this.state = new Map([...initialState].map(([key, value]) => [key, clone(value)]));
    this.initialRoot = initialRoot;
    this.receipts = [];
    this.accepted = new Map();
  }

  caseResult({ caseId, rawSha256, txId = '', decision, reasonCode, priorRoot, idempotent = false, receiptHashValue = '' }) {
    return {
      case_id: caseId,
      raw_sha256: rawSha256,
      tx_id: txId,
      decision,
      reason_code: reasonCode,
      idempotent: idempotent ? 'TRUE' : 'FALSE',
      previous_state_root: priorRoot,
      next_state_root: stateRoot(this.state),
      total_supply: String([...this.state.values()].reduce((sum, item) => sum + BigInt(item.amount), 0n)),
      receipt_hash: receiptHashValue,
    };
  }

  async apply(caseId, raw) {
    const priorRoot = stateRoot(this.state);
    const rawSha256 = sha256(raw).toString('hex');
    let txId = '';
    try {
      const tx = validateTransfer(raw);
      txId = tx.tx_id;
      const txHash = transactionHash(tx);
      if (this.accepted.has(txId)) {
        const existing = this.accepted.get(txId);
        if (existing.txHash === txHash) {
          return this.caseResult({
            caseId, rawSha256, txId, decision: 'CANDIDATE_ACCEPTED', reasonCode: 'EXACT_REPLAY',
            priorRoot, idempotent: true, receiptHashValue: existing.receipt.receipt_hash,
          });
        }
        reject('TRANSACTION_ID_COLLISION', 'Accepted transaction ID was reused.');
      }
      if (tx.anchor_state_root !== priorRoot) reject('PREDECESSOR_STATE_MISMATCH', 'State anchor mismatch.');

      const resolved = tx.inputs.map((input, i) => {
        const record = this.state.get(input.output_id);
        if (!record) reject('INPUT_NOT_UNSPENT', `Input ${i} is missing or spent.`);
        if (
          record.creating_tx_id !== input.creating_tx_id
          || record.output_index !== input.output_index
          || outputId(input.creating_tx_id, Number(input.output_index)) !== input.output_id
        ) reject('CREATION_BINDING_MISMATCH', `Input ${i} creation binding mismatch.`);
        return record;
      });
      const inputTotal = resolved.reduce((sum, item) => sum + BigInt(item.amount), 0n);
      const outputTotal = tx.outputs.reduce((sum, item) => sum + amountValue(item.amount, 'output amount'), 0n);
      if (inputTotal !== outputTotal) reject('CONSERVATION_VIOLATION', 'Input/output quantities differ.');

      for (let i = 0; i < resolved.length; i += 1) {
        const record = resolved[i];
        const witness = tx.witnesses[i];
        if (witness.owner_public_key !== record.owner_public_key) reject('OWNER_KEY_MISMATCH', `Witness ${i} owner mismatch.`);
        let valid = false;
        try {
          valid = await ed.verifyAsync(
            Buffer.from(witness.signature, 'hex'),
            signatureMessage(txId, i, record.output_id),
            Buffer.from(witness.owner_public_key, 'hex'),
            { zip215: false },
          );
        } catch { valid = false; }
        if (!valid) reject('SIGNATURE_INVALID', `Witness ${i} signature failed.`);
      }

      const nextState = new Map([...this.state].map(([key, value]) => [key, clone(value)]));
      resolved.forEach((record) => nextState.delete(record.output_id));
      const created = [];
      tx.outputs.forEach((output, i) => {
        const outId = outputId(txId, i);
        if (nextState.has(outId)) reject('OUTPUT_COLLISION', 'Derived output already exists.');
        nextState.set(outId, {
          output_id: outId, creating_tx_id: txId, output_index: String(i),
          owner_public_key: output.owner_public_key, amount: output.amount,
        });
        created.push(outId);
      });
      if (nextState.size > MAX_LIVE_UTXOS) reject('UTXO_LIMIT_EXCEEDED', `A candidate state may contain at most ${MAX_LIVE_UTXOS} live outputs.`);
      const nextRoot = stateRoot(nextState);
      const supply = [...nextState.values()].reduce((sum, item) => sum + BigInt(item.amount), 0n);
      if (supply !== GENESIS_SUPPLY) reject('CONSERVATION_VIOLATION', 'Post-state supply mismatch.');
      const receipt = {
        schema: RECEIPT_SCHEMA,
        sequence: String(this.receipts.length + 1),
        network_id: NETWORK_ID,
        genesis_id: PINNED_GENESIS_ID,
        tx_id: txId,
        tx_hash: txHash,
        decision: 'CANDIDATE_ACCEPTED',
        reason_code: 'VALID_CONSERVED_TRANSFER',
        spent_output_ids: resolved.map((item) => item.output_id),
        created_output_ids: created,
        previous_state_root: priorRoot,
        next_state_root: nextRoot,
        previous_receipt_hash: this.receipts.length ? this.receipts.at(-1).receipt_hash : '',
        status_authority: 'NONE',
        receipt_hash: '',
      };
      receipt.receipt_hash = receiptHash(receipt);
      this.state = nextState;
      this.receipts.push(receipt);
      this.accepted.set(txId, { txHash, receipt });
      return this.caseResult({
        caseId, rawSha256, txId, decision: 'CANDIDATE_ACCEPTED',
        reasonCode: 'VALID_CONSERVED_TRANSFER', priorRoot, receiptHashValue: receipt.receipt_hash,
      });
    } catch (error) {
      if (!(error instanceof Reject)) throw error;
      return this.caseResult({
        caseId, rawSha256, txId, decision: 'REJECTED', reasonCode: error.code, priorRoot,
      });
    }
  }
}

const verifySuite = async (path) => {
  const suiteRaw = readFileSync(path);
  const suite = strictJson(suiteRaw);
  validateProfileTree(suite);
  exactKeys(suite, ['genesis_b64', 'histories', 'schema', 'status_authority', 'suite_id'], 'suite');
  if (suite.schema !== SUITE_SCHEMA || suite.status_authority !== 'NONE') throw new Error('Unsupported suite.');
  token(suite.suite_id, 'suite_id');
  const genesisRaw = decodeRaw(suite.genesis_b64);
  const { genesis, state: initialState, initialRoot } = validateGenesis(genesisRaw);
  if (!Array.isArray(suite.histories) || suite.histories.length < 1 || suite.histories.length > MAX_HISTORIES) throw new Error('History bounds.');
  const reports = [];
  const seenHistories = new Set();
  for (const rawHistory of suite.histories) {
    const history = exactKeys(rawHistory, ['cases', 'history_id'], 'history');
    const historyId = token(history.history_id, 'history_id');
    if (seenHistories.has(historyId)) throw new Error(`Duplicate history: ${historyId}`);
    seenHistories.add(historyId);
    if (!Array.isArray(history.cases) || history.cases.length < 1 || history.cases.length > MAX_CASES) throw new Error('Case bounds.');
    const machine = new History(initialState, initialRoot);
    const caseReports = [];
    const seenCases = new Set();
    for (const rawCase of history.cases) {
      const item = exactKeys(rawCase, ['case_id', 'raw_b64'], 'case');
      const caseId = token(item.case_id, 'case_id');
      if (seenCases.has(caseId)) throw new Error(`Duplicate case: ${caseId}`);
      seenCases.add(caseId);
      let raw;
      try { raw = decodeRaw(item.raw_b64); }
      catch (error) {
        if (!(error instanceof Reject)) throw error;
        const priorRoot = stateRoot(machine.state);
        caseReports.push(machine.caseResult({
          caseId, rawSha256: '', decision: 'REJECTED', reasonCode: error.code, priorRoot,
        }));
        continue;
      }
      caseReports.push(await machine.apply(caseId, raw));
    }
    reports.push({
      history_id: historyId,
      cases: caseReports,
      checkpoint: checkpoint(machine.state, machine.receipts, initialRoot),
    });
  }
  return {
    schema: REPORT_SCHEMA,
    suite_id: suite.suite_id,
    genesis_id: genesis.genesis_id,
    genesis_raw_sha256: sha256(genesisRaw).toString('hex'),
    initial_state_root: initialRoot,
    histories: reports,
    status_authority: 'NONE',
  };
};

if (process.argv.length !== 3) {
  process.stderr.write('usage: node independent_verifier.mjs SUITE.json\n');
  process.exit(2);
}

try {
  const report = await verifySuite(process.argv[2]);
  process.stdout.write(Buffer.concat([canonicalBytes(report), Buffer.from('\n')]));
} catch (error) {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exit(2);
}
