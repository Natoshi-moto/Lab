#!/usr/bin/env node

// Frozen-vector generator only. Every private seed below is public test data.
// This file deliberately does not import either verifier or Noble Ed25519.

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as nativeSign,
} from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const NETWORK_ID = 'NEXUS-R013-SYNTHETIC';
const UNIT_LABEL = 'R013-SYNTHETIC-CLAIM';
const GENESIS_SCHEMA = 'nexus.pcx-genesis/v0';
const TRANSFER_SCHEMA = 'nexus.pcx-transfer/v0';
const SUITE_SCHEMA = 'nexus.pcx-conformance-suite/v0';

const sortValue = (value) => {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === 'object') {
    const result = {};
    for (const key of Object.keys(value).sort()) result[key] = sortValue(value[key]);
    return result;
  }
  return value;
};
const canonical = (value) => Buffer.from(JSON.stringify(sortValue(value)), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest();
const taggedHash = (tag, message) => {
  const th = sha256(Buffer.from(tag, 'ascii'));
  return createHash('sha256').update(th).update(th).update(message).digest('hex');
};
const nonce = (label) => sha256(Buffer.from(`NEXUS-R013-NONCE:${label}`, 'ascii')).toString('hex');
const b64 = (raw) => Buffer.from(raw).toString('base64');
const asCase = (caseId, raw) => ({ case_id: caseId, raw_b64: b64(raw) });

const keyFor = (label) => {
  const seed = sha256(Buffer.from(`NEXUS-R013-PUBLIC-TEST-PRIVATE-SEED:${label}`, 'ascii'));
  const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
  const privateKey = createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
  const spki = createPublicKey(privateKey).export({ format: 'der', type: 'spki' });
  return { label, seed: seed.toString('hex'), privateKey, publicKey: spki.subarray(-32).toString('hex') };
};

const KEYS = Object.fromEntries(['A', 'B', 'C', 'D'].map((label) => [label, keyFor(label)]));

const genesis = {
  schema: GENESIS_SCHEMA,
  network_id: NETWORK_ID,
  unit_label: UNIT_LABEL,
  outputs: [{ owner_public_key: KEYS.A.publicKey, amount: '1000' }],
  status_authority: 'NONE',
  genesis_id: '',
};
genesis.genesis_id = taggedHash('NEXUS/PCX/GENESIS/V0', canonical(genesis));
const GENESIS_ID = genesis.genesis_id;

const outputId = (creatingTxId, outputIndex) => {
  const index = Buffer.alloc(4);
  index.writeUInt32BE(outputIndex);
  return taggedHash('NEXUS/PCX/OUTPOINT/V0', Buffer.concat([Buffer.from(creatingTxId, 'hex'), index]));
};
const stateRoot = (state) => taggedHash(
  'NEXUS/PCX/STATE/V0',
  canonical([...state.keys()].sort().map((key) => state.get(key))),
);
const transactionId = (tx) => taggedHash('NEXUS/PCX/TRANSACTION/V0', canonical({
  schema: tx.schema,
  network_id: tx.network_id,
  genesis_id: tx.genesis_id,
  anchor_state_root: tx.anchor_state_root,
  nonce: tx.nonce,
  inputs: tx.inputs,
  outputs: tx.outputs,
  status_authority: tx.status_authority,
}));
const signatureMessage = (txId, inputIndex, outId, tag = 'NEXUS/PCX/AUTHORIZATION/V0') => {
  const index = Buffer.alloc(4);
  index.writeUInt32BE(inputIndex);
  return Buffer.from(taggedHash(tag, Buffer.concat([
    Buffer.from(GENESIS_ID, 'hex'), Buffer.from(txId, 'hex'), index, Buffer.from(outId, 'hex'),
  ])), 'hex');
};

const initialState = () => {
  const outId = outputId(GENESIS_ID, 0);
  return new Map([[outId, {
    output_id: outId,
    creating_tx_id: GENESIS_ID,
    output_index: '0',
    owner_public_key: KEYS.A.publicKey,
    amount: '1000',
  }]]);
};

const txFor = ({
  state,
  spend,
  outputs,
  label,
  anchor = null,
  networkId = NETWORK_ID,
  genesisIdValue = GENESIS_ID,
  statusAuthority = 'NONE',
  sortInputs = true,
  signingTag = 'NEXUS/PCX/AUTHORIZATION/V0',
}) => {
  let selected = spend.map(({ record, key }) => ({ record: clone(record), key }));
  if (sortInputs) {
    selected = selected.sort((a, b) => {
      const left = `${a.record.creating_tx_id}:${a.record.output_index}`;
      const right = `${b.record.creating_tx_id}:${b.record.output_index}`;
      return left < right ? -1 : left > right ? 1 : 0;
    });
  }
  const tx = {
    schema: TRANSFER_SCHEMA,
    network_id: networkId,
    genesis_id: genesisIdValue,
    anchor_state_root: anchor ?? stateRoot(state),
    nonce: nonce(label),
    inputs: selected.map(({ record }) => ({
      creating_tx_id: record.creating_tx_id,
      output_index: record.output_index,
      output_id: record.output_id,
    })),
    outputs: outputs.map(({ key, amount }) => ({ owner_public_key: key.publicKey, amount: String(amount) })),
    tx_id: '',
    witnesses: [],
    status_authority: statusAuthority,
  };
  tx.tx_id = transactionId(tx);
  tx.witnesses = selected.map(({ record, key }, inputIndex) => ({
    input_index: String(inputIndex),
    owner_public_key: key.publicKey,
    signature: nativeSign(null, signatureMessage(tx.tx_id, inputIndex, record.output_id, signingTag), key.privateKey).toString('hex'),
  }));
  return tx;
};

const apply = (state, tx) => {
  for (const input of tx.inputs) state.delete(input.output_id);
  tx.outputs.forEach((output, outputIndex) => {
    const outId = outputId(tx.tx_id, outputIndex);
    state.set(outId, {
      output_id: outId,
      creating_tx_id: tx.tx_id,
      output_index: String(outputIndex),
      owner_public_key: output.owner_public_key,
      amount: output.amount,
    });
  });
};
const byOwnerAmount = (state, key, amount) => {
  const found = [...state.values()].find((item) => item.owner_public_key === key.publicKey && item.amount === String(amount));
  if (!found) throw new Error(`Missing fixture output ${key.label}/${amount}`);
  return found;
};

const validHistory = () => {
  const state = initialState();
  const cases = [];
  const t1 = txFor({
    state, spend: [{ record: [...state.values()][0], key: KEYS.A }],
    outputs: [{ key: KEYS.B, amount: 600 }, { key: KEYS.A, amount: 400 }], label: 'valid-t1',
  });
  cases.push(asCase('VALID-T1-SPLIT', canonical(t1)));
  apply(state, t1);
  cases.push(asCase('EXACT-REPLAY-T1', canonical(t1)));
  const collision = clone(t1);
  collision.witnesses[0].signature = `${collision.witnesses[0].signature[0] === '0' ? '1' : '0'}${collision.witnesses[0].signature.slice(1)}`;
  cases.push(asCase('TX-ID-COLLISION', canonical(collision)));

  const t2 = txFor({
    state, spend: [{ record: byOwnerAmount(state, KEYS.B, 600), key: KEYS.B }],
    outputs: [{ key: KEYS.C, amount: 250 }, { key: KEYS.B, amount: 350 }], label: 'valid-t2',
  });
  cases.push(asCase('VALID-T2-SPLIT', canonical(t2)));
  apply(state, t2);
  const t3 = txFor({
    state,
    spend: [
      { record: byOwnerAmount(state, KEYS.A, 400), key: KEYS.A },
      { record: byOwnerAmount(state, KEYS.B, 350), key: KEYS.B },
    ],
    outputs: [{ key: KEYS.D, amount: 750 }], label: 'valid-t3',
  });
  cases.push(asCase('VALID-T3-MERGE', canonical(t3)));
  apply(state, t3);
  const t4 = txFor({
    state, spend: [{ record: byOwnerAmount(state, KEYS.C, 250), key: KEYS.C }],
    outputs: [{ key: KEYS.A, amount: 250 }], label: 'valid-t4',
  });
  cases.push(asCase('VALID-T4-CREATOR-REMAINS-T2', canonical(t4)));
  return { history_id: 'VALID-CHAIN', cases };
};

const competingHistories = () => {
  const state = initialState();
  const t1 = txFor({
    state, spend: [{ record: [...state.values()][0], key: KEYS.A }],
    outputs: [{ key: KEYS.B, amount: 600 }, { key: KEYS.A, amount: 400 }], label: 'fork-common-parent',
  });
  apply(state, t1);
  const contested = clone(byOwnerAmount(state, KEYS.B, 600));
  const toC = txFor({
    state, spend: [{ record: contested, key: KEYS.B }],
    outputs: [{ key: KEYS.C, amount: 600 }], label: 'fork-sibling-c',
  });
  const toD = txFor({
    state, spend: [{ record: contested, key: KEYS.B }],
    outputs: [{ key: KEYS.D, amount: 600 }], label: 'fork-sibling-d',
  });
  const parentRaw = canonical(t1);
  const cRaw = canonical(toC);
  const dRaw = canonical(toD);
  return [
    {
      history_id: 'COMPETING-C-FIRST',
      cases: [
        asCase('VALID-COMMON-PARENT', parentRaw),
        asCase('VALID-FIRST-SPEND-TO-C', cRaw),
        asCase('REJECT-SAME-SIBLING-D-SECOND', dRaw),
      ],
    },
    {
      history_id: 'COMPETING-D-FIRST',
      cases: [
        asCase('VALID-COMMON-PARENT', parentRaw),
        asCase('VALID-FIRST-SPEND-TO-D', dRaw),
        asCase('REJECT-SAME-SIBLING-C-SECOND', cRaw),
      ],
    },
  ];
};

const attackHistory = () => {
  const state = initialState();
  const genesisRecord = [...state.values()][0];
  const valid = txFor({
    state, spend: [{ record: genesisRecord, key: KEYS.A }],
    outputs: [{ key: KEYS.B, amount: 1000 }], label: 'attack-template',
  });
  const cases = [];
  const validText = canonical(valid).toString('utf8');
  cases.push(asCase('DUPLICATE-JSON-KEY', Buffer.from(validText.replace('{', '{"schema":"nexus.pcx-transfer/v0",'), 'utf8')));
  cases.push(asCase('UTF8-BOM', Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(validText, 'utf8')])));
  cases.push(asCase('NON-CANONICAL-WHITESPACE', Buffer.from(` ${validText}`, 'utf8')));
  const loneSurrogate = validText.replace(`"network_id":"${NETWORK_ID}"`, '"network_id":"\\ud800"');
  cases.push(asCase('LONE-SURROGATE', Buffer.from(loneSurrogate, 'utf8')));
  const unicodeCanary = clone(valid);
  unicodeCanary['\ufffd'] = 'x';
  unicodeCanary['😀'] = 'y';
  cases.push(asCase('UNICODE-KEY-ORDER-CANARY', canonical(unicodeCanary)));
  const deep = Buffer.from(validText.replace('{', `{"unexpected":${'['.repeat(40)}"x"${']'.repeat(40)},`), 'utf8');
  cases.push(asCase('JSON-DEPTH-LIMIT', deep));
  const unknown = clone(valid); unknown.unexpected = 'field'; cases.push(asCase('UNKNOWN-FIELD', canonical(unknown)));
  const wrongVersion = clone(valid); wrongVersion.schema = 'nexus.pcx-transfer/v1';
  cases.push(asCase('VERSION-REPLAY', canonical(wrongVersion)));
  const wrongDomain = clone(valid); wrongDomain.network_id = 'OTHER-NETWORK'; cases.push(asCase('CROSS-DOMAIN-REPLAY', canonical(wrongDomain)));
  const wrongGenesis = clone(valid); wrongGenesis.genesis_id = 'f'.repeat(64); cases.push(asCase('ALTERNATE-GENESIS', canonical(wrongGenesis)));
  const wrongId = clone(valid); wrongId.tx_id = '0'.repeat(64); cases.push(asCase('TX-ID-MISMATCH', canonical(wrongId)));
  const stale = txFor({
    state, spend: [{ record: genesisRecord, key: KEYS.A }], outputs: [{ key: KEYS.B, amount: 1000 }],
    label: 'stale-anchor', anchor: '1'.repeat(64),
  });
  cases.push(asCase('STALE-ANCHOR', canonical(stale)));

  const duplicateInput = txFor({
    state,
    spend: [{ record: genesisRecord, key: KEYS.A }, { record: genesisRecord, key: KEYS.A }],
    outputs: [{ key: KEYS.B, amount: 1000 }], label: 'duplicate-input',
  });
  cases.push(asCase('DUPLICATE-INPUT', canonical(duplicateInput)));
  const duplicateAndWrongId = clone(duplicateInput); duplicateAndWrongId.tx_id = '0'.repeat(64);
  cases.push(asCase('PRECEDENCE-DUPLICATE-BEFORE-TX-ID', canonical(duplicateAndWrongId)));
  const fakeRecord = {
    output_id: '2'.repeat(64), creating_tx_id: '3'.repeat(64), output_index: '0',
    owner_public_key: KEYS.A.publicKey, amount: '1000',
  };
  const missing = txFor({
    state, spend: [{ record: fakeRecord, key: KEYS.A }], outputs: [{ key: KEYS.B, amount: 1000 }], label: 'missing-input',
  });
  cases.push(asCase('MISSING-ANCESTRY', canonical(missing)));
  const mismatchedRecord = clone(genesisRecord); mismatchedRecord.creating_tx_id = '4'.repeat(64);
  const binding = txFor({
    state, spend: [{ record: mismatchedRecord, key: KEYS.A }], outputs: [{ key: KEYS.B, amount: 1000 }], label: 'creation-binding',
  });
  cases.push(asCase('CREATION-BINDING-MISMATCH', canonical(binding)));
  const wrongOwner = clone(valid);
  wrongOwner.witnesses[0].owner_public_key = KEYS.B.publicKey;
  wrongOwner.witnesses[0].signature = nativeSign(
    null, signatureMessage(wrongOwner.tx_id, 0, genesisRecord.output_id), KEYS.B.privateKey,
  ).toString('hex');
  cases.push(asCase('WRONG-OWNER-KEY', canonical(wrongOwner)));
  const inflation = txFor({
    state, spend: [{ record: genesisRecord, key: KEYS.A }],
    outputs: [{ key: KEYS.B, amount: 700 }, { key: KEYS.A, amount: 400 }], label: 'inflation',
  });
  cases.push(asCase('INFLATION', canonical(inflation)));
  const badSignature = clone(valid);
  badSignature.witnesses[0].signature = `${badSignature.witnesses[0].signature.slice(0, -2)}00`;
  cases.push(asCase('SIGNATURE-MUTATION', canonical(badSignature)));
  const truncated = clone(valid); truncated.witnesses[0].signature = truncated.witnesses[0].signature.slice(0, -2);
  cases.push(asCase('TRUNCATED-SIGNATURE', canonical(truncated)));
  for (const [caseId, token] of [
    ['JSON-NUMBER-INTEGER', '1'],
    ['JSON-NUMBER-FRACTION', '1.5'],
    ['JSON-NUMBER-INTEGRAL-FLOAT', '1.0'],
    ['JSON-NUMBER-NEGATIVE-ZERO', '-0'],
    ['JSON-NUMBER-EXPONENT', '1e9999'],
    ['JSON-NUMBER-ABOVE-2P53', '9007199254740993'],
    ['JSON-NUMBER-HUGE', '9'.repeat(4301)],
  ]) {
    cases.push(asCase(caseId, Buffer.from(validText.replace('"amount":"1000"', `"amount":${token}`), 'utf8')));
  }
  cases.push(asCase('BOOLEAN-AMOUNT', Buffer.from(validText.replace('"amount":"1000"', '"amount":false'), 'utf8')));
  cases.push(asCase('NULL-AMOUNT', Buffer.from(validText.replace('"amount":"1000"', '"amount":null'), 'utf8')));
  cases.push(asCase('HUGE-DECIMAL-STRING', Buffer.from(validText.replace('"amount":"1000"', `"amount":"${'9'.repeat(5000)}"`), 'utf8')));
  cases.push(asCase('HUGE-INDEX-STRING', Buffer.from(validText.replace('"output_index":"0"', `"output_index":"${'9'.repeat(5000)}"`), 'utf8')));
  const leadingZero = clone(valid); leadingZero.outputs[0].amount = '01000';
  leadingZero.tx_id = transactionId(leadingZero); cases.push(asCase('LEADING-ZERO-AMOUNT', canonical(leadingZero)));
  const zero = clone(valid); zero.outputs[0].amount = '0'; zero.tx_id = transactionId(zero);
  cases.push(asCase('ZERO-AMOUNT', canonical(zero)));
  const outOfRange = clone(valid); outOfRange.outputs[0].amount = '1001';
  outOfRange.tx_id = transactionId(outOfRange); cases.push(asCase('OUT-OF-RANGE-AMOUNT', canonical(outOfRange)));
  const invalidAmountAndWrongId = clone(valid); invalidAmountAndWrongId.outputs[0].amount = '0';
  invalidAmountAndWrongId.tx_id = '0'.repeat(64);
  cases.push(asCase('PRECEDENCE-AMOUNT-BEFORE-TX-ID', canonical(invalidAmountAndWrongId)));
  const malformedWitnessAndWrongId = clone(valid); malformedWitnessAndWrongId.witnesses[0].signature = '00';
  malformedWitnessAndWrongId.tx_id = '0'.repeat(64);
  cases.push(asCase('PRECEDENCE-WITNESS-BEFORE-TX-ID', canonical(malformedWitnessAndWrongId)));
  const unknownOwner = clone(valid);
  unknownOwner.outputs[0].owner_public_key = '0'.repeat(64);
  unknownOwner.tx_id = transactionId(unknownOwner);
  cases.push(asCase('UNKNOWN-OR-SMALL-ORDER-OUTPUT-KEY', canonical(unknownOwner)));
  const nonfinite = Buffer.from(validText.replace('"amount":"1000"', '"amount":NaN'), 'utf8');
  cases.push(asCase('NONFINITE-AMOUNT', nonfinite));

  const highS = clone(valid);
  const sig = Buffer.from(highS.witnesses[0].signature, 'hex');
  const L = 2n ** 252n + 27742317777372353535851937790883648493n;
  let s = 0n;
  for (let i = 0; i < 32; i += 1) s += BigInt(sig[32 + i]) << (8n * BigInt(i));
  s += L;
  for (let i = 0; i < 32; i += 1) sig[32 + i] = Number((s >> (8n * BigInt(i))) & 0xffn);
  highS.witnesses[0].signature = sig.toString('hex');
  cases.push(asCase('HIGH-S-MALLEABILITY', canonical(highS)));

  const altered = clone(valid);
  altered.outputs = [{ owner_public_key: KEYS.C.publicKey, amount: '1000' }];
  altered.tx_id = transactionId(altered);
  cases.push(asCase('SEMANTIC-MUTATION-AFTER-SIGNING', canonical(altered)));
  const wrongTag = txFor({
    state, spend: [{ record: genesisRecord, key: KEYS.A }], outputs: [{ key: KEYS.B, amount: 1000 }],
    label: 'wrong-signature-domain', signingTag: 'NEXUS/PCX/OTHER/V0',
  });
  cases.push(asCase('SIGNATURE-DOMAIN-SUBSTITUTION', canonical(wrongTag)));
  const authority = clone(valid); authority.status_authority = 'CANONICAL';
  cases.push(asCase('AUTHORITY-ESCALATION', canonical(authority)));
  cases.push({ case_id: 'INVALID-BASE64', raw_b64: '%%%' });
  return { history_id: 'HOSTILE-ENCODING-CRYPTO-ARITHMETIC', cases };
};

const orderHistory = () => {
  const state = initialState();
  const cases = [];
  const t1 = txFor({
    state, spend: [{ record: [...state.values()][0], key: KEYS.A }],
    outputs: [{ key: KEYS.B, amount: 600 }, { key: KEYS.A, amount: 400 }], label: 'order-t1',
  });
  cases.push(asCase('VALID-SETUP', canonical(t1))); apply(state, t1);
  const inputA = byOwnerAmount(state, KEYS.A, 400);
  const inputB = byOwnerAmount(state, KEYS.B, 600);
  const unsorted = txFor({
    state,
    spend: [{ record: inputB, key: KEYS.B }, { record: inputA, key: KEYS.A }],
    outputs: [{ key: KEYS.C, amount: 1000 }], label: 'unsorted-inputs', sortInputs: false,
  });
  const canonicalOrder = [...unsorted.inputs].map((item) => `${item.creating_tx_id}:${item.output_index}`);
  if (JSON.stringify(canonicalOrder) === JSON.stringify([...canonicalOrder].sort())) {
    unsorted.inputs.reverse();
    unsorted.tx_id = transactionId(unsorted);
    const keyByOut = new Map([[inputA.output_id, KEYS.A], [inputB.output_id, KEYS.B]]);
    unsorted.witnesses = unsorted.inputs.map((input, i) => ({
      input_index: String(i), owner_public_key: keyByOut.get(input.output_id).publicKey,
      signature: nativeSign(null, signatureMessage(unsorted.tx_id, i, input.output_id), keyByOut.get(input.output_id).privateKey).toString('hex'),
    }));
  }
  cases.push(asCase('UNSORTED-INPUTS', canonical(unsorted)));
  const missingWitness = clone(unsorted); missingWitness.inputs = [missingWitness.inputs[0]]; missingWitness.witnesses = [];
  missingWitness.tx_id = transactionId(missingWitness); cases.push(asCase('MISSING-WITNESS', canonical(missingWitness)));
  const validMerge = txFor({
    state,
    spend: [{ record: inputA, key: KEYS.A }, { record: inputB, key: KEYS.B }],
    outputs: [{ key: KEYS.C, amount: 1000 }], label: 'valid-ordered-merge',
  });
  cases.push(asCase('VALID-ORDERED-MERGE', canonical(validMerge)));
  return { history_id: 'ORDER-AND-MULTI-OWNER', cases };
};

const utxoLimitHistory = () => {
  const state = initialState();
  const cases = [];
  const largest = () => [...state.values()].sort((left, right) => {
    const a = BigInt(left.amount);
    const b = BigInt(right.amount);
    return a > b ? -1 : a < b ? 1 : 0;
  })[0];
  for (let step = 1; step <= 9; step += 1) {
    const record = clone(largest());
    const remainder = BigInt(record.amount) - 7n;
    const outputs = [
      ...Array.from({ length: 7 }, () => ({ key: KEYS.A, amount: 1 })),
      { key: KEYS.A, amount: remainder },
    ];
    const tx = txFor({
      state,
      spend: [{ record, key: KEYS.A }],
      outputs,
      label: `utxo-growth-${step}`,
    });
    cases.push(asCase(`VALID-GROWTH-TO-${1 + (7 * step)}-UTXOS`, canonical(tx)));
    apply(state, tx);
  }
  const record = clone(largest());
  const rejected = txFor({
    state,
    spend: [{ record, key: KEYS.A }],
    outputs: [
      ...Array.from({ length: 7 }, () => ({ key: KEYS.A, amount: 1 })),
      { key: KEYS.A, amount: BigInt(record.amount) - 7n },
    ],
    label: 'utxo-growth-over-limit',
  });
  cases.push(asCase('REJECT-GROWTH-TO-71-UTXOS', canonical(rejected)));
  return { history_id: 'LIVE-UTXO-BOUND', cases };
};

const siblingHistories = competingHistories();

const suite = {
  schema: SUITE_SCHEMA,
  suite_id: 'R013-PCX-CONSERVED-CLAIM-FROZEN-001',
  genesis_b64: b64(canonical(genesis)),
  histories: [validHistory(), ...siblingHistories, attackHistory(), orderHistory(), utxoLimitHistory()],
  status_authority: 'NONE',
};

if (process.argv.length !== 3) {
  process.stderr.write('usage: node generate_vectors.mjs OUTPUT.json\n');
  process.exit(2);
}

const output = resolve(process.argv[2]);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(suite, null, 2)}\n`, { encoding: 'utf8', flag: 'w' });
process.stdout.write(`${JSON.stringify({
  output,
  genesis_id: GENESIS_ID,
  genesis_raw_sha256: sha256(canonical(genesis)).toString('hex'),
  public_keys: Object.fromEntries(Object.entries(KEYS).map(([label, key]) => [label, key.publicKey])),
  disclosed_test_seeds: Object.fromEntries(Object.entries(KEYS).map(([label, key]) => [label, key.seed])),
}, null, 2)}\n`);
