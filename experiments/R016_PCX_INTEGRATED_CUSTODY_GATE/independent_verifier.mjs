#!/usr/bin/env node
/** Independent Node/Noble replay verifier for the frozen R016 transcript. */

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyAsync } from '@noble/ed25519';

const NETWORK = 'NEXUS-R016-SYNTHETIC';
const PROFILE = 'CUSTODY-KERNEL-V1';
const VERSION = '1';
const STATUS_AUTHORITY = 'NONE';
const ZERO = '0'.repeat(64);
const THRESHOLD = '2';
const TRANSCRIPT_SCHEMA = 'nexus.r016-custody-closed-transcript/v0';
const REPORT_SCHEMA = 'nexus.r016-cross-implementation-report/v0';

const DOMAINS = {
  state: 'NEXUS/R016/COMBINED-STATE/v1',
  outpoint: 'NEXUS/R016/OUTPOINT/v1',
  receipt: 'NEXUS/R016/RECEIPT/v1',
  eventId: 'NEXUS/R016/EVENT-ID/v1',
  policy: 'NEXUS/R016/RECOVERY-POLICY/v1',
  transcript: 'NEXUS/R016/CLOSED-TRANSCRIPT/v1',
  controllers: 'NEXUS/R016/FINAL-CONTROLLERS/v1',
};
const SIGN_DOMAINS = {
  TRANSFER_ACTIVE: 'NEXUS/R016/SIGN/TRANSFER-ACTIVE/v1',
  ROTATE_ACTIVE: 'NEXUS/R016/SIGN/ROTATE-ACTIVE/v1',
  ROTATE_GUARDIAN: 'NEXUS/R016/SIGN/ROTATE-GUARDIAN/v1',
  ROTATE_NEW_KEY: 'NEXUS/R016/SIGN/ROTATE-NEW-KEY/v1',
  RECOVER_GUARDIAN: 'NEXUS/R016/SIGN/RECOVER-GUARDIAN/v1',
  RECOVER_NEW_KEY: 'NEXUS/R016/SIGN/RECOVER-NEW-KEY/v1',
  REVOKE_GUARDIAN: 'NEXUS/R016/SIGN/REVOKE-GUARDIAN/v1',
};

const fail = (message) => { throw new Error(message); };
const clone = (value) => structuredClone(value);

function assertJsonSubset(value, path = '$') {
  if (typeof value === 'string') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonSubset(item, `${path}[${index}]`));
    return;
  }
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    Object.entries(value).forEach(([key, item]) => assertJsonSubset(item, `${path}.${key}`));
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

function decodeExact(bytes, finalNewline = false) {
  let wire = Buffer.from(bytes);
  if (finalNewline) {
    if (wire.length < 2 || wire.at(-1) !== 0x0a || wire.at(-2) === 0x0a) fail('document must have exactly one final newline');
    wire = wire.subarray(0, wire.length - 1);
  }
  if ([...wire].some((byte) => byte > 0x7f)) fail('JSON is not ASCII');
  let value;
  try { value = JSON.parse(wire.toString('ascii')); } catch { fail('invalid JSON'); }
  if (value === null || Array.isArray(value) || typeof value !== 'object') fail('top-level JSON must be an object');
  if (!canonicalBytes(value).equals(wire)) fail('JSON bytes are not exact canonical encoding');
  return value;
}

function exact(value, fields, path) {
  if (value === null || Array.isArray(value) || typeof value !== 'object') fail(`expected object at ${path}`);
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(`exact schema mismatch at ${path}`);
  return value;
}

function string(value, path) {
  if (typeof value !== 'string' || value.length === 0) fail(`expected nonempty string at ${path}`);
  return value;
}

function hex32(value, path, nonzero = false) {
  value = string(value, path);
  if (!/^[0-9a-f]{64}$/.test(value) || (nonzero && value === ZERO)) fail(`invalid 32-byte hex at ${path}`);
  return value;
}

function signature(value, path) {
  value = string(value, path);
  if (!/^[0-9a-f]{128}$/.test(value)) fail(`invalid signature at ${path}`);
  return value;
}

function uint(value, path, positive = false) {
  if (typeof value !== 'string' || !(positive ? /^[1-9][0-9]*$/ : /^(0|[1-9][0-9]*)$/).test(value)) fail(`noncanonical decimal at ${path}`);
  const result = BigInt(value);
  if (result >= (1n << 128n)) fail(`integer exceeds R016 bound at ${path}`);
  return result;
}

function sortedUnique(values, path) {
  const sorted = [...values].sort();
  if (new Set(values).size !== values.length || values.some((item, index) => item !== sorted[index])) fail(`array is not sorted and unique at ${path}`);
}

function frame(domain, payload) {
  const name = Buffer.from(domain, 'ascii');
  const header = Buffer.alloc(10);
  header.writeUInt16BE(name.length, 0);
  header.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([header.subarray(0, 2), name, header.subarray(2), payload]);
}

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function hashValue(domain, value) { return sha256(frame(domain, canonicalBytes(value))); }
function policyHash(controller, keys) {
  return hashValue(DOMAINS.policy, { controller, recovery_keys: keys, threshold: THRESHOLD });
}
function deriveOutpoint(objectId, index) {
  return hashValue(DOMAINS.outpoint, { index: String(index), object_id: objectId });
}

function snapshot(controllers, utxos, height, last) {
  return {
    controllers: [...controllers.keys()].sort().map((key) => clone(controllers.get(key))),
    height: String(height),
    last_object_id: last,
    network: NETWORK,
    profile: PROFILE,
    status_authority: STATUS_AUTHORITY,
    utxos: [...utxos.keys()].sort().map((key) => clone(utxos.get(key))),
    version: VERSION,
  };
}
function stateRoot(controllers, utxos, height, last) {
  return hashValue(DOMAINS.state, snapshot(controllers, utxos, height, last));
}

const COMMON = new Set(['controller', 'controller_epoch', 'controller_head', 'kind', 'network', 'object_id', 'predecessor', 'profile', 'status_authority', 'version']);
const union = (...sets) => new Set(sets.flatMap((set) => [...set]));
const OP_FIELDS = {
  TRANSFER: union(COMMON, new Set(['inputs', 'outputs', 'proofs'])),
  ROTATE: union(COMMON, new Set(['new_key', 'proofs'])),
  RECOVER: union(COMMON, new Set(['new_key', 'proofs'])),
  REVOKE: union(COMMON, new Set(['proofs'])),
};

function unsigned(operation, zeroId = false) {
  const value = clone(operation);
  delete value.proofs;
  if (zeroId) value.object_id = ZERO;
  return value;
}
function operationId(operation) { return hashValue(DOMAINS.eventId, unsigned(operation, true)); }

function signatureMessage(operation, role, key, signedOutpoint = undefined) {
  const body = unsigned(operation);
  const context = {
    controller: body.controller,
    controller_epoch: body.controller_epoch,
    controller_head: body.controller_head,
    key,
    operation: body,
    predecessor: body.predecessor,
    role,
  };
  if (role === 'TRANSFER_ACTIVE') {
    const index = body.inputs.indexOf(signedOutpoint);
    if (signedOutpoint === undefined || index < 0) fail('transfer proof does not bind a live input');
    context.input_index = String(index);
    context.outpoint = signedOutpoint;
  } else if (signedOutpoint !== undefined) fail('non-transfer signature names an outpoint');
  return frame(SIGN_DOMAINS[role], canonicalBytes(context));
}

async function verifyEd25519(publicKey, proofSignature, message) {
  let valid = false;
  try {
    valid = await verifyAsync(
      Buffer.from(proofSignature, 'hex'),
      message,
      Buffer.from(publicKey, 'hex'),
    );
  } catch { valid = false; }
  if (!valid) fail('invalid Ed25519 signature');
}

function proofShape(value, path, withOutpoint = false) {
  exact(value, new Set(withOutpoint ? ['key', 'signature', 'outpoint'] : ['key', 'signature']), path);
  hex32(value.key, `${path}.key`, true);
  signature(value.signature, `${path}.signature`);
  if (withOutpoint) hex32(value.outpoint, `${path}.outpoint`);
  return value;
}

class IndependentMachine {
  constructor(genesis) {
    exact(genesis, new Set(['controllers', 'kind', 'network', 'profile', 'status_authority', 'utxos', 'version']), '$genesis');
    if ([genesis.kind, genesis.network, genesis.profile, genesis.status_authority, genesis.version].join('|') !== ['GENESIS', NETWORK, PROFILE, STATUS_AUTHORITY, VERSION].join('|')) fail('genesis profile or authority mismatch');
    if (!Array.isArray(genesis.controllers) || genesis.controllers.length === 0) fail('genesis controllers must be nonempty');
    this.controllers = new Map();
    this.seenKeys = new Set();
    const controllerOrder = [];
    for (const [index, item] of genesis.controllers.entries()) {
      exact(item, new Set(['active_key', 'controller', 'recovery_keys']), `$genesis.controllers[${index}]`);
      const controller = hex32(item.controller, 'controller', true);
      const active = hex32(item.active_key, 'active_key', true);
      if (!Array.isArray(item.recovery_keys) || item.recovery_keys.length !== 3) fail('genesis requires exactly three recovery keys');
      const keys = item.recovery_keys.map((key) => hex32(key, 'recovery_key', true));
      sortedUnique(keys, 'recovery_keys');
      const local = new Set([active, ...keys]);
      if (local.size !== 4 || [...local].some((key) => this.seenKeys.has(key)) || this.controllers.has(controller)) fail('genesis key/controller uniqueness failure');
      local.forEach((key) => this.seenKeys.add(key));
      controllerOrder.push(controller);
      this.controllers.set(controller, {
        active_key: active,
        controller,
        epoch: '0',
        head: ZERO,
        recovery_policy_hash: policyHash(controller, keys),
        recovery_keys: keys,
        recovery_threshold: THRESHOLD,
        retired_keys: [],
        status: 'ACTIVE',
      });
    }
    sortedUnique(controllerOrder, 'controllers');
    if (!Array.isArray(genesis.utxos) || genesis.utxos.length === 0) fail('genesis UTXOs must be nonempty');
    this.utxos = new Map();
    const outpointOrder = [];
    for (const [index, item] of genesis.utxos.entries()) {
      exact(item, new Set(['amount', 'controller', 'outpoint']), `$genesis.utxos[${index}]`);
      const identifier = hex32(item.outpoint, 'outpoint');
      const controller = hex32(item.controller, 'controller', true);
      uint(item.amount, 'amount', true);
      if (this.utxos.has(identifier) || !this.controllers.has(controller)) fail('genesis UTXO identity/owner failure');
      outpointOrder.push(identifier);
      this.utxos.set(identifier, clone(item));
    }
    sortedUnique(outpointOrder, 'utxos');
    this.seenOutpoints = new Set(this.utxos.keys());
    this.height = 0;
    this.last = ZERO;
    this.root = stateRoot(this.controllers, this.utxos, 0, ZERO);
  }

  get supply() { return [...this.utxos.values()].reduce((sum, item) => sum + uint(item.amount, 'amount', true), 0n); }

  validateOperation(op) {
    const kind = string(op.kind, 'kind');
    if (!(kind in OP_FIELDS)) fail('unsupported operation kind');
    exact(op, OP_FIELDS[kind], '$event');
    if ([op.network, op.profile, op.status_authority, op.version].join('|') !== [NETWORK, PROFILE, STATUS_AUTHORITY, VERSION].join('|')) fail('event profile or authority mismatch');
    hex32(op.object_id, 'object_id', true);
    hex32(op.predecessor, 'predecessor');
    hex32(op.controller, 'controller', true);
    uint(op.controller_epoch, 'controller_epoch');
    hex32(op.controller_head, 'controller_head');
    if (kind === 'TRANSFER') {
      if (!Array.isArray(op.inputs) || op.inputs.length < 1 || op.inputs.length > 64) fail('invalid transfer inputs');
      const inputs = op.inputs.map((item) => hex32(item, 'input'));
      sortedUnique(inputs, 'inputs');
      if (!Array.isArray(op.outputs) || op.outputs.length < 1 || op.outputs.length > 64) fail('invalid transfer outputs');
      op.outputs.forEach((output) => {
        exact(output, new Set(['amount', 'controller']), 'output');
        uint(output.amount, 'amount', true);
        hex32(output.controller, 'controller', true);
      });
      if (!Array.isArray(op.proofs) || op.proofs.length !== inputs.length) fail('transfer proofs do not match inputs');
      const proofs = op.proofs.map((item) => proofShape(item, 'proof', true));
      if (proofs.some((item, index) => item.outpoint !== inputs[index])) fail('transfer proof order mismatch');
    } else if (kind === 'ROTATE') {
      hex32(op.new_key, 'new_key', true);
      exact(op.proofs, new Set(['active', 'guardian', 'new_key']), 'proofs');
      ['active', 'guardian', 'new_key'].forEach((name) => proofShape(op.proofs[name], `proofs.${name}`));
    } else if (kind === 'RECOVER') {
      hex32(op.new_key, 'new_key', true);
      exact(op.proofs, new Set(['guardians', 'new_key']), 'proofs');
      if (!Array.isArray(op.proofs.guardians) || op.proofs.guardians.length !== 2) fail('recovery requires two proofs');
      const guardians = op.proofs.guardians.map((item) => proofShape(item, 'guardian'));
      sortedUnique(guardians.map((item) => item.key), 'guardian proofs');
      proofShape(op.proofs.new_key, 'proofs.new_key');
    } else {
      exact(op.proofs, new Set(['guardians']), 'proofs');
      if (!Array.isArray(op.proofs.guardians) || op.proofs.guardians.length !== 2) fail('revocation requires two proofs');
      const guardians = op.proofs.guardians.map((item) => proofShape(item, 'guardian'));
      sortedUnique(guardians.map((item) => item.key), 'guardian proofs');
    }
  }

  checkActive(controller, proof) { if (proof.key !== controller.active_key) fail('proof is not from current active key'); }
  checkGuardian(controller, proof) { if (!controller.recovery_keys.includes(proof.key)) fail('proof is not from fixed recovery policy'); }
  async verify(op, role, proof, signedOutpoint = undefined) {
    await verifyEd25519(proof.key, proof.signature, signatureMessage(op, role, proof.key, signedOutpoint));
  }

  async apply(op) {
    this.validateOperation(op);
    if (op.object_id !== operationId(op)) fail('event content address mismatch');
    if (op.predecessor !== this.root) fail('event predecessor is not exact combined root');
    if (!this.controllers.has(op.controller)) fail('unknown controller');
    const live = this.controllers.get(op.controller);
    if (live.status !== 'ACTIVE') fail('locked controller cannot act');
    if (op.controller_epoch !== live.epoch || op.controller_head !== live.head) fail('stale controller context');

    const controllers = new Map([...this.controllers].map(([key, value]) => [key, clone(value)]));
    const utxos = new Map([...this.utxos].map(([key, value]) => [key, clone(value)]));
    const staged = controllers.get(op.controller);
    if (op.kind === 'TRANSFER') {
      let totalIn = 0n;
      for (let index = 0; index < op.inputs.length; index += 1) {
        const identifier = op.inputs[index];
        const proof = op.proofs[index];
        if (!this.utxos.has(identifier) || this.utxos.get(identifier).controller !== op.controller) fail('unknown or foreign transfer input');
        this.checkActive(live, proof);
        await this.verify(op, 'TRANSFER_ACTIVE', proof, identifier);
        totalIn += uint(this.utxos.get(identifier).amount, 'input amount', true);
      }
      let totalOut = 0n;
      const additions = [];
      for (const [index, output] of op.outputs.entries()) {
        const recipient = output.controller;
        if (!this.controllers.has(recipient) || this.controllers.get(recipient).status !== 'ACTIVE') fail('transfer recipient unavailable');
        totalOut += uint(output.amount, 'output amount', true);
        const identifier = deriveOutpoint(op.object_id, index);
        if (this.seenOutpoints.has(identifier)) fail('derived outpoint has existed before');
        additions.push({ amount: output.amount, controller: recipient, outpoint: identifier });
      }
      if (totalIn !== totalOut) fail('transfer violates conservation');
      op.inputs.forEach((identifier) => utxos.delete(identifier));
      additions.forEach((item) => { utxos.set(item.outpoint, item); this.seenOutpoints.add(item.outpoint); });
    } else if (op.kind === 'ROTATE') {
      const proofs = op.proofs;
      if (this.seenKeys.has(op.new_key)) fail('new key has already appeared');
      this.checkActive(live, proofs.active);
      this.checkGuardian(live, proofs.guardian);
      if (proofs.new_key.key !== op.new_key) fail('new-key possession proof mismatch');
      await this.verify(op, 'ROTATE_ACTIVE', proofs.active);
      await this.verify(op, 'ROTATE_GUARDIAN', proofs.guardian);
      await this.verify(op, 'ROTATE_NEW_KEY', proofs.new_key);
      staged.retired_keys.push(staged.active_key);
      staged.retired_keys.sort();
      staged.active_key = op.new_key;
      staged.epoch = String(BigInt(staged.epoch) + 1n);
      staged.head = op.object_id;
      this.seenKeys.add(op.new_key);
    } else if (op.kind === 'RECOVER') {
      const proofs = op.proofs;
      if (this.seenKeys.has(op.new_key)) fail('recovery key has already appeared');
      for (const proof of proofs.guardians) {
        this.checkGuardian(live, proof);
        await this.verify(op, 'RECOVER_GUARDIAN', proof);
      }
      if (new Set(proofs.guardians.map((item) => item.key)).size !== 2) fail('recovery quorum is not distinct');
      if (proofs.new_key.key !== op.new_key) fail('recovery possession proof mismatch');
      await this.verify(op, 'RECOVER_NEW_KEY', proofs.new_key);
      staged.retired_keys.push(staged.active_key);
      staged.retired_keys.sort();
      staged.active_key = op.new_key;
      staged.epoch = String(BigInt(staged.epoch) + 1n);
      staged.head = op.object_id;
      this.seenKeys.add(op.new_key);
    } else {
      const guardians = op.proofs.guardians;
      for (const proof of guardians) {
        this.checkGuardian(live, proof);
        await this.verify(op, 'REVOKE_GUARDIAN', proof);
      }
      if (new Set(guardians.map((item) => item.key)).size !== 2) fail('revocation quorum is not distinct');
      staged.retired_keys.push(staged.active_key);
      staged.retired_keys.sort();
      staged.active_key = ZERO;
      staged.status = 'LOCKED';
      staged.epoch = String(BigInt(staged.epoch) + 1n);
      staged.head = op.object_id;
    }

    const before = this.root;
    const height = this.height + 1;
    const after = stateRoot(controllers, utxos, height, op.object_id);
    const receiptBase = {
      after_root: after,
      before_root: before,
      height: String(height),
      kind: op.kind,
      object_id: op.object_id,
      result: 'APPLIED',
      status_authority: STATUS_AUTHORITY,
    };
    const receipt = { ...receiptBase, receipt_hash: hashValue(DOMAINS.receipt, receiptBase) };
    this.controllers = controllers;
    this.utxos = utxos;
    this.height = height;
    this.last = op.object_id;
    this.root = after;
    return receipt;
  }
}

const CLAIMS = [
  'CLOSED_TRANSCRIPT_REPLAYED_IDENTICALLY_BY_INDEPENDENT_PYTHON_OPENSSL_AND_NODE_NOBLE_IMPLEMENTATIONS',
  'SYNTHETIC_SUPPLY_CONSERVED_ACROSS_THE_ACCEPTED_PREFIX',
  'CONTROLLER_ROTATION_QUORUM_RECOVERY_AND_TERMINAL_LOCK_REPLAYED',
];
const NONCLAIMS = [
  'NO_CLAIM_OF_MONEY_ECONOMIC_VALUE_PURCHASING_POWER_VALUE_STABILITY_BACKING_OR_REDEMPTION',
  'NO_CLAIM_OF_PRODUCTION_KEY_SECRECY_ENTROPY_SECURE_ERASURE_HSM_OR_DEVICE_SAFETY',
  'NO_CLAIM_OF_GUARDIAN_INDEPENDENCE_AND_NO_AUTOMATIC_LOSS_OR_COMPROMISE_DETECTION',
  'NO_REVERSAL_OF_AN_ATTACKER_TRANSFER_COMMITTED_FIRST',
  'NO_CONSENSUS_FORK_CHOICE_OR_GLOBAL_FINALITY',
  'NO_PHYSICAL_POWER_LOSS_PROOF',
  'NO_EXTERNAL_AUDIT_FORMAL_VERIFICATION_REGULATORY_APPROVAL_OR_LIVE_PILOT',
];

async function verify(genesisPath, transcriptPath) {
  const genesisWire = await readFile(genesisPath);
  const genesis = decodeExact(genesisWire);
  const transcript = decodeExact(await readFile(transcriptPath), true);
  exact(transcript, new Set([
    'closure', 'event_count', 'final_height', 'final_state', 'final_state_root',
    'genesis_b64', 'genesis_sha256', 'initial_state_root', 'network', 'profile',
    'records', 'schema', 'status_authority', 'synthetic_supply', 'transcript_id',
    'vector_provenance', 'version',
  ]), '$transcript');
  if ([transcript.closure, transcript.network, transcript.profile, transcript.schema, transcript.status_authority, transcript.version].join('|') !== ['CLOSED_EXACT_PREFIX', NETWORK, PROFILE, TRANSCRIPT_SCHEMA, STATUS_AUTHORITY, VERSION].join('|')) fail('transcript envelope mismatch');
  const provenance = {
    derivation: 'PUBLIC_LABEL_SHA256_TO_EPHEMERAL_ED25519_PKCS8_TEMPFILES',
    operational_secrecy: 'NONE',
    retained_private_material: 'FALSE',
    signer: 'OPENSSL_ED25519',
  };
  if (canonicalString(transcript.vector_provenance) !== canonicalString(provenance)) fail('vector provenance mismatch');
  const embeddedGenesis = Buffer.from(transcript.genesis_b64, 'base64');
  if (embeddedGenesis.toString('base64') !== transcript.genesis_b64 || !embeddedGenesis.equals(genesisWire) || sha256(genesisWire) !== transcript.genesis_sha256) fail('embedded genesis/hash mismatch');
  const transcriptSubject = clone(transcript);
  transcriptSubject.transcript_id = ZERO;
  if (transcript.transcript_id !== hashValue(DOMAINS.transcript, transcriptSubject)) fail('transcript content address mismatch');

  const machine = new IndependentMachine(genesis);
  const initialRoot = machine.root;
  const initialSupply = machine.supply;
  if (transcript.initial_state_root !== initialRoot) fail('initial state root mismatch');
  if (!Array.isArray(transcript.records) || uint(transcript.event_count, 'event_count') !== BigInt(transcript.records.length)) fail('event count mismatch');
  const counts = { RECOVER: 0, REVOKE: 0, ROTATE: 0, TRANSFER: 0 };
  for (const [zeroIndex, record] of transcript.records.entries()) {
    exact(record, new Set(['event_b64', 'event_sha256', 'kind', 'object_id', 'receipt', 'sequence']), `$records[${zeroIndex}]`);
    if (record.sequence !== String(zeroIndex + 1)) fail('record sequence mismatch');
    const eventWire = Buffer.from(record.event_b64, 'base64');
    if (eventWire.toString('base64') !== record.event_b64) fail('invalid event base64');
    const event = decodeExact(eventWire);
    if (sha256(eventWire) !== record.event_sha256) fail('event byte hash mismatch');
    if (event.kind !== record.kind || event.object_id !== record.object_id) fail('record event identity mismatch');
    const receipt = await machine.apply(event);
    if (canonicalString(receipt) !== canonicalString(record.receipt)) fail('independently derived receipt mismatch');
    if (machine.supply !== initialSupply) fail('synthetic supply changed');
    counts[event.kind] += 1;
  }
  if (machine.root !== transcript.final_state_root || String(machine.height) !== transcript.final_height || String(initialSupply) !== transcript.synthetic_supply) fail('final state/supply mismatch');
  if (canonicalString(snapshot(machine.controllers, machine.utxos, machine.height, machine.last)) !== canonicalString(transcript.final_state)) fail('embedded final state mismatch');
  const locked = [...machine.controllers.values()].filter((item) => item.status === 'LOCKED');
  if (locked.length !== 1 || locked[0].active_key !== ZERO) fail('expected exactly one terminally locked controller');
  const finalControllers = [...machine.controllers.keys()].sort().map((key) => machine.controllers.get(key));
  const lockedController = locked[0];
  return {
    claims: CLAIMS,
    event_count: String(transcript.records.length),
    final_controller_set_hash: hashValue(DOMAINS.controllers, finalControllers),
    final_height: String(machine.height),
    final_locked_controller: {
      active_key: lockedController.active_key,
      controller: lockedController.controller,
      epoch: lockedController.epoch,
      head: lockedController.head,
      retired_key_count: String(lockedController.retired_keys.length),
      status: lockedController.status,
    },
    final_state_root: machine.root,
    implementations: ['NODE_NOBLE_ED25519', 'PYTHON_OPENSSL_ED25519'],
    initial_state_root: initialRoot,
    nonclaims: NONCLAIMS,
    operation_counts: Object.fromEntries(Object.keys(counts).sort().map((key) => [key, String(counts[key])])),
    schema: REPORT_SCHEMA,
    status: 'PASS',
    status_authority: STATUS_AUTHORITY,
    synthetic_supply: String(initialSupply),
    transcript_id: transcript.transcript_id,
  };
}

if (process.argv.length !== 4) fail('usage: independent_verifier.mjs GENESIS.json CLOSED_TRANSCRIPT.json');
const report = await verify(process.argv[2], process.argv[3]);
process.stdout.write(`${canonicalString(report)}\n`);

export { canonicalString, verify };
