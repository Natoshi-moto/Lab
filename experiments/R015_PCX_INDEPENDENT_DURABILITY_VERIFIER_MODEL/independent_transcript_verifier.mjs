import { createHash } from "node:crypto";
import { open } from "node:fs/promises";

import * as ed25519 from "@noble/ed25519";

const NETWORK_ID = "NEXUS-R013-SYNTHETIC";
const GENESIS_ID =
  "974cd4da89feb9f7ae8e14d7b4359f4b76d8697f55e5793219c52e38b627b7de";
const UNIT_LABEL = "R013-SYNTHETIC-CLAIM";
const STATUS_AUTHORITY = "NONE";
const TOTAL_SUPPLY = 1000;
const MAX_RECORDS = 256;
const MAX_LIVE_OUTPUTS = 64;
const MAX_VALUE_BYTES = 65_536;
const MAX_TRANSCRIPT_BYTES = 32 * 1024 * 1024;

const OWNER_KEYS = new Set([
  "bd31dcf54d9b3255ab917685de56afd9a593c503086c9a02bc692bc40a28cdaa",
  "e213e0ad80924531679056653aabb4a6ad9937e42ecac3c5e0fe2c82c212b049",
  "0a207102823217b7e722847916ba90ffc1d249d77b7220f646fb633aacde54c7",
  "b5e14889a863987b67737e56699decaf8c62f5af1fc8e0773836a95782de4fec",
]);

const TAG = Object.freeze({
  genesis: "NEXUS/PCX/GENESIS/V0",
  transaction: "NEXUS/PCX/TRANSACTION/V0",
  return: "NEXUS/PCX/RETURN/V0",
  outpoint: "NEXUS/PCX/OUTPOINT/V0",
  authorization: "NEXUS/PCX/AUTHORIZATION/V0",
  state: "NEXUS/PCX/STATE/V0",
  decision: "NEXUS/PCX/DECISION/V0",
  durableRecord: "NEXUS/PCX/DURABLE-RECORD/V0",
  durableAnchor: "NEXUS/PCX/DURABLE-ANCHOR/V0",
  transcript: "NEXUS/PCX/CLOSED-DURABLE-TRANSCRIPT/V0",
});

const HASH_RE = /^[0-9a-f]{64}$/;
const SIGNATURE_RE = /^[0-9a-f]{128}$/;
const AMOUNT_RE = /^(?:[1-9]|[1-9][0-9]{1,2}|1000)$/;
const INDEX_RE = /^[0-7]$/;
const SEQUENCE_RE = /^(?:0|[1-9][0-9]?|1[0-9]{2}|2[0-4][0-9]|25[0-6])$/;
const BASE64_RE =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const TRANSCRIPT_FIELDS = [
  "schema",
  "network_id",
  "genesis_id",
  "genesis_b64",
  "genesis_raw_sha256",
  "initial_state_root",
  "max_records",
  "record_count",
  "records",
  "anchors",
  "terminal_anchor",
  "closure",
  "status_authority",
  "transcript_id",
];

const RECORD_FIELDS = [
  "schema",
  "sequence",
  "previous_record_hash",
  "record_hash",
  "tx_id",
  "tx_b64",
  "tx_sha256",
  "previous_state_root",
  "next_state_root",
  "receipt_hash",
  "receipt_b64",
  "receipt_raw_sha256",
  "status_authority",
];

const ANCHOR_FIELDS = [
  "schema",
  "network_id",
  "genesis_id",
  "sequence",
  "record_hash",
  "state_root",
  "receipt_head",
  "status_authority",
  "anchor_id",
];

const GENESIS_FIELDS = [
  "schema",
  "network_id",
  "unit_label",
  "outputs",
  "status_authority",
  "genesis_id",
];

const TRANSFER_FIELDS = [
  "schema",
  "network_id",
  "genesis_id",
  "anchor_state_root",
  "nonce",
  "inputs",
  "outputs",
  "tx_id",
  "witnesses",
  "status_authority",
];

class VerificationError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function fail(code = "TRANSCRIPT_INVALID") {
  throw new VerificationError(code);
}

function requireCondition(condition, code = "TRANSCRIPT_INVALID") {
  if (!condition) fail(code);
}

function canonicalJson(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const members = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${members.join(",")}}`;
  }
  fail("INTERNAL_ERROR");
}

class ClosedJsonParser {
  constructor(text, errorCode) {
    this.text = text;
    this.errorCode = errorCode;
    this.offset = 0;
  }

  reject() {
    fail(this.errorCode);
  }

  skipWhitespace() {
    while (this.offset < this.text.length) {
      const code = this.text.charCodeAt(this.offset);
      if (code !== 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
        break;
      }
      this.offset += 1;
    }
  }

  parse() {
    this.skipWhitespace();
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.offset !== this.text.length) this.reject();
    return value;
  }

  parseValue(depth) {
    const character = this.text[this.offset];
    if (character === '"') return this.parseString();
    if (character === "{") return this.parseObject(depth + 1);
    if (character === "[") return this.parseArray(depth + 1);
    this.reject();
  }

  parseString() {
    const start = this.offset;
    this.offset += 1;
    let escaped = false;
    while (this.offset < this.text.length) {
      const character = this.text[this.offset];
      if (!escaped && character === '"') {
        this.offset += 1;
        let value;
        try {
          value = JSON.parse(this.text.slice(start, this.offset));
        } catch {
          this.reject();
        }
        if (typeof value !== "string" || !/^[\x20-\x7e]*$/.test(value)) {
          this.reject();
        }
        return value;
      }
      if (!escaped && character === "\\") {
        escaped = true;
      } else {
        escaped = false;
      }
      this.offset += 1;
    }
    this.reject();
  }

  parseObject(depth) {
    if (depth > 32) this.reject();
    const result = Object.create(null);
    const keys = new Set();
    this.offset += 1;
    this.skipWhitespace();
    if (this.text[this.offset] === "}") {
      this.offset += 1;
      return result;
    }
    while (this.offset < this.text.length) {
      if (this.text[this.offset] !== '"') this.reject();
      const key = this.parseString();
      if (keys.has(key)) this.reject();
      keys.add(key);
      this.skipWhitespace();
      if (this.text[this.offset] !== ":") this.reject();
      this.offset += 1;
      this.skipWhitespace();
      result[key] = this.parseValue(depth);
      this.skipWhitespace();
      const delimiter = this.text[this.offset];
      if (delimiter === "}") {
        this.offset += 1;
        return result;
      }
      if (delimiter !== ",") this.reject();
      this.offset += 1;
      this.skipWhitespace();
    }
    this.reject();
  }

  parseArray(depth) {
    if (depth > 32) this.reject();
    const result = [];
    this.offset += 1;
    this.skipWhitespace();
    if (this.text[this.offset] === "]") {
      this.offset += 1;
      return result;
    }
    while (this.offset < this.text.length) {
      result.push(this.parseValue(depth));
      this.skipWhitespace();
      const delimiter = this.text[this.offset];
      if (delimiter === "]") {
        this.offset += 1;
        return result;
      }
      if (delimiter !== ",") this.reject();
      this.offset += 1;
      this.skipWhitespace();
    }
    this.reject();
  }
}

function parseCanonicalJson(raw, maximumBytes, errorCode) {
  requireCondition(
    Buffer.isBuffer(raw) && raw.length <= maximumBytes,
    errorCode,
  );
  requireCondition(
    !(raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf),
    errorCode,
  );
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  } catch {
    fail(errorCode);
  }
  const value = new ClosedJsonParser(text, errorCode).parse();
  requireCondition(Buffer.from(canonicalJson(value), "utf8").equals(raw), errorCode);
  return value;
}

async function readBounded(path, maximumBytes, errorCode) {
  let handle;
  try {
    handle = await open(path, "r");
    const metadata = await handle.stat();
    requireCondition(metadata.isFile() && metadata.size <= maximumBytes, errorCode);
    const raw = await handle.readFile();
    requireCondition(raw.length <= maximumBytes, errorCode);
    return raw;
  } catch (error) {
    if (error instanceof VerificationError) throw error;
    fail(errorCode);
  } finally {
    if (handle !== undefined) {
      try {
        await handle.close();
      } catch {
        // A read result is still verified entirely in memory; closing is best effort.
      }
    }
  }
}

function requireExactObject(value, fields, errorCode = "TRANSCRIPT_INVALID") {
  requireCondition(
    value !== null && typeof value === "object" && !Array.isArray(value),
    errorCode,
  );
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  requireCondition(
    actual.length === expected.length &&
      actual.every((key, index) => key === expected[index]),
    errorCode,
  );
}

function requireString(value, errorCode = "TRANSCRIPT_INVALID") {
  requireCondition(typeof value === "string", errorCode);
}

function requireHash(value, errorCode = "TRANSCRIPT_INVALID") {
  requireCondition(typeof value === "string" && HASH_RE.test(value), errorCode);
}

function requireSequence(value, errorCode = "TRANSCRIPT_INVALID") {
  requireCondition(typeof value === "string" && SEQUENCE_RE.test(value), errorCode);
}

function requireArrayBounds(value, minimum, maximum, errorCode) {
  requireCondition(
    Array.isArray(value) && value.length >= minimum && value.length <= maximum,
    errorCode,
  );
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest();
}

function sha256Hex(bytes) {
  return sha256(bytes).toString("hex");
}

function taggedHash(tag, message) {
  const tagHash = sha256(Buffer.from(tag, "ascii"));
  return sha256(Buffer.concat([tagHash, tagHash, Buffer.from(message)]));
}

function taggedHashHex(tag, message) {
  return taggedHash(tag, message).toString("hex");
}

function canonicalHash(tag, value) {
  return taggedHashHex(tag, Buffer.from(canonicalJson(value), "utf8"));
}

function decodeCanonicalBase64(
  encoded,
  maximumEncodedLength,
  errorCode = "TRANSCRIPT_INVALID",
) {
  requireCondition(
    typeof encoded === "string" &&
      encoded.length <= maximumEncodedLength &&
      encoded.length % 4 === 0 &&
      BASE64_RE.test(encoded),
    errorCode,
  );
  const raw = Buffer.from(encoded, "base64");
  requireCondition(
    raw.length <= MAX_VALUE_BYTES && raw.toString("base64") === encoded,
    errorCode,
  );
  const value = parseCanonicalJson(raw, MAX_VALUE_BYTES, errorCode);
  return { raw, value };
}

function outpointId(creatingTransactionId, outputIndex) {
  const indexBytes = Buffer.alloc(4);
  indexBytes.writeUInt32BE(outputIndex);
  return taggedHashHex(
    TAG.outpoint,
    Buffer.concat([Buffer.from(creatingTransactionId, "hex"), indexBytes]),
  );
}

function authorizationMessage(genesisId, transactionId, inputIndex, outputId) {
  const indexBytes = Buffer.alloc(4);
  indexBytes.writeUInt32BE(inputIndex);
  return taggedHash(
    TAG.authorization,
    Buffer.concat([
      Buffer.from(genesisId, "hex"),
      Buffer.from(transactionId, "hex"),
      indexBytes,
      Buffer.from(outputId, "hex"),
    ]),
  );
}

function validateOutput(output, errorCode = "TRANSCRIPT_INVALID") {
  requireExactObject(output, ["owner_public_key", "amount"], errorCode);
  requireCondition(
    typeof output.owner_public_key === "string" &&
      HASH_RE.test(output.owner_public_key) &&
      OWNER_KEYS.has(output.owner_public_key),
    errorCode,
  );
  requireCondition(
    typeof output.amount === "string" && AMOUNT_RE.test(output.amount),
    errorCode,
  );
}

function validateGenesis(genesis) {
  requireExactObject(genesis, GENESIS_FIELDS);
  requireCondition(genesis.schema === "nexus.pcx-genesis/v0");
  requireCondition(genesis.network_id === NETWORK_ID);
  requireCondition(genesis.unit_label === UNIT_LABEL);
  requireCondition(genesis.status_authority === STATUS_AUTHORITY);
  requireCondition(genesis.genesis_id === GENESIS_ID);
  requireArrayBounds(genesis.outputs, 1, 8, "TRANSCRIPT_INVALID");
  for (const output of genesis.outputs) validateOutput(output);

  const genesisSubject = { ...genesis, genesis_id: "" };
  requireCondition(canonicalHash(TAG.genesis, genesisSubject) === GENESIS_ID);
  const supply = genesis.outputs.reduce(
    (sum, output) => sum + Number(output.amount),
    0,
  );
  requireCondition(supply === TOTAL_SUPPLY);
}

function initialState(genesis) {
  const state = new Map();
  genesis.outputs.forEach((output, index) => {
    const outputId = outpointId(GENESIS_ID, index);
    requireCondition(!state.has(outputId));
    state.set(outputId, {
      creating_tx_id: GENESIS_ID,
      output_index: String(index),
      output_id: outputId,
      owner_public_key: output.owner_public_key,
      amount: output.amount,
    });
  });
  return state;
}

function stateRoot(state) {
  const outputs = [...state.values()].sort((left, right) =>
    left.output_id < right.output_id ? -1 : left.output_id > right.output_id ? 1 : 0,
  );
  return canonicalHash(TAG.state, outputs);
}

function stateSupply(state) {
  return [...state.values()].reduce(
    (sum, output) => sum + Number(output.amount),
    0,
  );
}

function validateRecordShape(record) {
  requireExactObject(record, RECORD_FIELDS);
  requireCondition(record.schema === "nexus.pcx-durable-record/v0");
  requireSequence(record.sequence);
  requireCondition(
    typeof record.previous_record_hash === "string" &&
      (record.previous_record_hash === "" || HASH_RE.test(record.previous_record_hash)),
  );
  requireHash(record.record_hash);
  requireHash(record.tx_id);
  requireCondition(typeof record.tx_b64 === "string" && record.tx_b64.length <= 87_384);
  requireHash(record.tx_sha256);
  requireHash(record.previous_state_root);
  requireHash(record.next_state_root);
  requireHash(record.receipt_hash);
  requireCondition(
    typeof record.receipt_b64 === "string" && record.receipt_b64.length <= 87_384,
  );
  requireHash(record.receipt_raw_sha256);
  requireCondition(record.status_authority === STATUS_AUTHORITY);
}

function validateAnchor(anchor, errorCode) {
  requireExactObject(anchor, ANCHOR_FIELDS, errorCode);
  requireCondition(anchor.schema === "nexus.pcx-durable-anchor/v0", errorCode);
  requireCondition(anchor.network_id === NETWORK_ID, errorCode);
  requireCondition(anchor.genesis_id === GENESIS_ID, errorCode);
  requireSequence(anchor.sequence, errorCode);
  requireHash(anchor.state_root, errorCode);
  requireCondition(anchor.status_authority === STATUS_AUTHORITY, errorCode);
  requireHash(anchor.anchor_id, errorCode);
  if (anchor.sequence === "0") {
    requireCondition(anchor.record_hash === "" && anchor.receipt_head === "", errorCode);
  } else {
    requireHash(anchor.record_hash, errorCode);
    requireHash(anchor.receipt_head, errorCode);
  }
  const subject = { ...anchor, anchor_id: "" };
  requireCondition(
    canonicalHash(TAG.durableAnchor, subject) === anchor.anchor_id,
    errorCode,
  );
}

function makeAnchor(sequence, recordHash, root, receiptHead) {
  const anchor = {
    schema: "nexus.pcx-durable-anchor/v0",
    network_id: NETWORK_ID,
    genesis_id: GENESIS_ID,
    sequence: String(sequence),
    record_hash: recordHash,
    state_root: root,
    receipt_head: receiptHead,
    status_authority: STATUS_AUTHORITY,
    anchor_id: "",
  };
  anchor.anchor_id = canonicalHash(TAG.durableAnchor, anchor);
  return anchor;
}

function equalCanonical(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function validateTransferShape(transfer) {
  requireExactObject(transfer, TRANSFER_FIELDS);
  requireCondition(transfer.schema === "nexus.pcx-transfer/v0");
  requireCondition(transfer.network_id === NETWORK_ID);
  requireCondition(transfer.genesis_id === GENESIS_ID);
  requireHash(transfer.anchor_state_root);
  requireHash(transfer.nonce);
  requireHash(transfer.tx_id);
  requireCondition(transfer.status_authority === STATUS_AUTHORITY);
  requireArrayBounds(transfer.inputs, 1, 8, "TRANSCRIPT_INVALID");
  requireArrayBounds(transfer.outputs, 1, 8, "TRANSCRIPT_INVALID");
  requireArrayBounds(transfer.witnesses, 1, 8, "TRANSCRIPT_INVALID");
  requireCondition(transfer.witnesses.length === transfer.inputs.length);

  let previousInputKey = null;
  transfer.inputs.forEach((input) => {
    requireExactObject(input, ["creating_tx_id", "output_index", "output_id"]);
    requireHash(input.creating_tx_id);
    requireCondition(typeof input.output_index === "string" && INDEX_RE.test(input.output_index));
    requireHash(input.output_id);
    requireCondition(
      outpointId(input.creating_tx_id, Number(input.output_index)) === input.output_id,
    );
    const inputKey = `${input.creating_tx_id}:${input.output_index}`;
    requireCondition(previousInputKey === null || previousInputKey < inputKey);
    previousInputKey = inputKey;
  });

  for (const output of transfer.outputs) validateOutput(output);

  transfer.witnesses.forEach((witness, index) => {
    requireExactObject(witness, ["input_index", "owner_public_key", "signature"]);
    requireCondition(witness.input_index === String(index) && INDEX_RE.test(witness.input_index));
    requireCondition(
      typeof witness.owner_public_key === "string" &&
        HASH_RE.test(witness.owner_public_key) &&
        OWNER_KEYS.has(witness.owner_public_key),
    );
    requireCondition(
      typeof witness.signature === "string" && SIGNATURE_RE.test(witness.signature),
    );
  });

  const { tx_id: ignoredId, witnesses: ignoredWitnesses, ...transactionSubject } =
    transfer;
  void ignoredId;
  void ignoredWitnesses;
  requireCondition(
    canonicalHash(TAG.transaction, transactionSubject) === transfer.tx_id,
  );
}

async function applyTransfer(transfer, rawTransfer, state, acceptedIds) {
  validateTransferShape(transfer);
  requireCondition(!acceptedIds.has(transfer.tx_id));

  const previousRoot = stateRoot(state);
  requireCondition(transfer.anchor_state_root === previousRoot);

  let inputAmount = 0;
  const spentOutputs = [];
  for (let index = 0; index < transfer.inputs.length; index += 1) {
    const input = transfer.inputs[index];
    const witness = transfer.witnesses[index];
    const unspent = state.get(input.output_id);
    requireCondition(unspent !== undefined);
    requireCondition(
      unspent.creating_tx_id === input.creating_tx_id &&
        unspent.output_index === input.output_index &&
        unspent.output_id === input.output_id,
    );
    requireCondition(witness.owner_public_key === unspent.owner_public_key);

    const message = authorizationMessage(
      GENESIS_ID,
      transfer.tx_id,
      index,
      input.output_id,
    );
    let signatureValid = false;
    try {
      signatureValid = await ed25519.verifyAsync(
        Uint8Array.from(Buffer.from(witness.signature, "hex")),
        Uint8Array.from(message),
        Uint8Array.from(Buffer.from(witness.owner_public_key, "hex")),
        { zip215: false },
      );
    } catch {
      signatureValid = false;
    }
    requireCondition(signatureValid === true);
    inputAmount += Number(unspent.amount);
    spentOutputs.push(input.output_id);
  }

  const outputAmount = transfer.outputs.reduce(
    (sum, output) => sum + Number(output.amount),
    0,
  );
  requireCondition(inputAmount === outputAmount);

  const nextState = new Map(state);
  for (const outputId of spentOutputs) {
    requireCondition(nextState.delete(outputId));
  }
  const createdOutputs = [];
  transfer.outputs.forEach((output, index) => {
    const outputId = outpointId(transfer.tx_id, index);
    requireCondition(!nextState.has(outputId));
    nextState.set(outputId, {
      creating_tx_id: transfer.tx_id,
      output_index: String(index),
      output_id: outputId,
      owner_public_key: output.owner_public_key,
      amount: output.amount,
    });
    createdOutputs.push(outputId);
  });

  requireCondition(nextState.size <= MAX_LIVE_OUTPUTS);
  requireCondition(stateSupply(nextState) === TOTAL_SUPPLY);

  return {
    nextState,
    previousRoot,
    nextRoot: stateRoot(nextState),
    spentOutputs,
    createdOutputs,
    returnHash: taggedHashHex(TAG.return, rawTransfer),
  };
}

function makeReceipt(
  sequence,
  transfer,
  transition,
  previousReceiptHash,
) {
  const receipt = {
    schema: "nexus.pcx-value-receipt/v0",
    sequence: String(sequence),
    network_id: NETWORK_ID,
    genesis_id: GENESIS_ID,
    tx_id: transfer.tx_id,
    tx_hash: transition.returnHash,
    decision: "CANDIDATE_ACCEPTED",
    reason_code: "VALID_CONSERVED_TRANSFER",
    spent_output_ids: transition.spentOutputs,
    created_output_ids: transition.createdOutputs,
    previous_state_root: transition.previousRoot,
    next_state_root: transition.nextRoot,
    previous_receipt_hash: previousReceiptHash,
    status_authority: STATUS_AUTHORITY,
    receipt_hash: "",
  };
  receipt.receipt_hash = canonicalHash(TAG.decision, receipt);
  return receipt;
}

function durableRecordHash(
  sequence,
  previousRecordHash,
  transferId,
  transferRawHash,
  previousRoot,
  nextRoot,
  receiptHash,
  receiptRawHash,
) {
  const subject = {
    schema: "nexus.pcx-durable-record/v0",
    network_id: NETWORK_ID,
    genesis_id: GENESIS_ID,
    sequence: String(sequence),
    previous_record_hash: previousRecordHash,
    tx_id: transferId,
    tx_sha256: transferRawHash,
    previous_state_root: previousRoot,
    next_state_root: nextRoot,
    receipt_hash: receiptHash,
    receipt_raw_sha256: receiptRawHash,
    status_authority: STATUS_AUTHORITY,
  };
  return canonicalHash(TAG.durableRecord, subject);
}

async function verifyTranscript(rawTranscript) {
  const transcript = parseCanonicalJson(
    rawTranscript,
    MAX_TRANSCRIPT_BYTES,
    "TRANSCRIPT_INVALID",
  );
  requireExactObject(transcript, TRANSCRIPT_FIELDS);
  requireCondition(transcript.schema === "nexus.pcx-closed-durable-transcript/v0");
  requireCondition(transcript.network_id === NETWORK_ID);
  requireCondition(transcript.genesis_id === GENESIS_ID);
  requireCondition(transcript.max_records === String(MAX_RECORDS));
  requireCondition(transcript.closure === "CLOSED_EXPORTED_PREFIX");
  requireCondition(transcript.status_authority === STATUS_AUTHORITY);
  requireHash(transcript.genesis_raw_sha256);
  requireHash(transcript.initial_state_root);
  requireHash(transcript.transcript_id);
  requireSequence(transcript.record_count);
  requireCondition(
    typeof transcript.genesis_b64 === "string" &&
      transcript.genesis_b64.length <= 87_384,
  );

  const recordCount = Number(transcript.record_count);
  requireCondition(
    Array.isArray(transcript.records) &&
      transcript.records.length === recordCount &&
      transcript.records.length <= MAX_RECORDS,
  );
  requireCondition(
    Array.isArray(transcript.anchors) &&
      transcript.anchors.length === recordCount + 1 &&
      transcript.anchors.length <= MAX_RECORDS + 1,
  );
  for (const record of transcript.records) validateRecordShape(record);
  for (const anchor of transcript.anchors) validateAnchor(anchor, "TRANSCRIPT_INVALID");
  validateAnchor(transcript.terminal_anchor, "TRANSCRIPT_INVALID");
  requireCondition(
    equalCanonical(
      transcript.terminal_anchor,
      transcript.anchors[transcript.anchors.length - 1],
    ),
  );

  const transcriptSubject = { ...transcript, transcript_id: "" };
  requireCondition(
    canonicalHash(TAG.transcript, transcriptSubject) === transcript.transcript_id,
  );

  const decodedGenesis = decodeCanonicalBase64(transcript.genesis_b64, 87_384);
  requireCondition(
    sha256Hex(decodedGenesis.raw) === transcript.genesis_raw_sha256,
  );
  validateGenesis(decodedGenesis.value);
  let state = initialState(decodedGenesis.value);
  let currentStateRoot = stateRoot(state);
  requireCondition(currentStateRoot === transcript.initial_state_root);
  requireCondition(stateSupply(state) === TOTAL_SUPPLY);
  requireCondition(state.size <= MAX_LIVE_OUTPUTS);

  const generatedAnchors = [makeAnchor(0, "", currentStateRoot, "")];
  requireCondition(equalCanonical(generatedAnchors[0], transcript.anchors[0]));

  let recordHead = "";
  let receiptHead = "";
  const acceptedIds = new Set();
  const recordHashes = [];
  const receiptHashes = [];

  for (let index = 0; index < transcript.records.length; index += 1) {
    const sequence = index + 1;
    const record = transcript.records[index];
    requireCondition(record.sequence === String(sequence));
    requireCondition(record.previous_record_hash === recordHead);
    requireCondition(record.previous_state_root === currentStateRoot);

    const decodedTransfer = decodeCanonicalBase64(record.tx_b64, 87_384);
    const transferRawHash = sha256Hex(decodedTransfer.raw);
    requireCondition(transferRawHash === record.tx_sha256);
    const transfer = decodedTransfer.value;
    const transition = await applyTransfer(
      transfer,
      decodedTransfer.raw,
      state,
      acceptedIds,
    );
    requireCondition(transfer.tx_id === record.tx_id);
    requireCondition(transition.previousRoot === record.previous_state_root);
    requireCondition(transition.nextRoot === record.next_state_root);

    const receipt = makeReceipt(sequence, transfer, transition, receiptHead);
    const receiptRaw = Buffer.from(canonicalJson(receipt), "utf8");
    const decodedReceipt = decodeCanonicalBase64(record.receipt_b64, 87_384);
    requireCondition(decodedReceipt.raw.equals(receiptRaw));
    requireCondition(receipt.receipt_hash === record.receipt_hash);
    const receiptRawHash = sha256Hex(receiptRaw);
    requireCondition(receiptRawHash === record.receipt_raw_sha256);

    const computedRecordHash = durableRecordHash(
      sequence,
      recordHead,
      transfer.tx_id,
      transferRawHash,
      transition.previousRoot,
      transition.nextRoot,
      receipt.receipt_hash,
      receiptRawHash,
    );
    requireCondition(computedRecordHash === record.record_hash);

    const anchor = makeAnchor(
      sequence,
      computedRecordHash,
      transition.nextRoot,
      receipt.receipt_hash,
    );
    requireCondition(equalCanonical(anchor, transcript.anchors[sequence]));

    state = transition.nextState;
    currentStateRoot = transition.nextRoot;
    recordHead = computedRecordHash;
    receiptHead = receipt.receipt_hash;
    acceptedIds.add(transfer.tx_id);
    recordHashes.push(computedRecordHash);
    receiptHashes.push(receipt.receipt_hash);
    generatedAnchors.push(anchor);
  }

  requireCondition(equalCanonical(transcript.terminal_anchor, generatedAnchors.at(-1)));
  requireCondition(stateSupply(state) === TOTAL_SUPPLY);
  requireCondition(state.size <= MAX_LIVE_OUTPUTS);

  return {
    transcript,
    recordCount,
    finalStateRoot: currentStateRoot,
    recordHead,
    receiptHead,
    recordHashes,
    receiptHashes,
    generatedAnchors,
  };
}

async function parseExternalAnchor(path) {
  const raw = await readBounded(path, MAX_VALUE_BYTES, "ANCHOR_INVALID");
  const anchor = parseCanonicalJson(raw, MAX_VALUE_BYTES, "ANCHOR_INVALID");
  validateAnchor(anchor, "ANCHOR_INVALID");
  return anchor;
}

async function verifyExternalAnchors(paths, verifiedTranscript) {
  if (paths.length > MAX_RECORDS + 1) fail("ANCHOR_INVALID");
  if (paths.length === 0) {
    return {
      rollbackCheck: "UNANCHORED",
      confirmedIds: [],
      matchedAnchors: [],
      highestConfirmedSequence: "",
      terminalAnchorConfirmed: "FALSE",
      unconfirmedSuffixCount: String(verifiedTranscript.recordCount),
    };
  }

  const externalAnchors = [];
  for (const path of paths) externalAnchors.push(await parseExternalAnchor(path));

  const observedSequences = new Set();
  const observedAnchorIds = new Set();
  for (const anchor of externalAnchors) {
    if (
      observedSequences.has(anchor.sequence) ||
      observedAnchorIds.has(anchor.anchor_id)
    ) {
      fail("ANCHOR_INVALID");
    }
    observedSequences.add(anchor.sequence);
    observedAnchorIds.add(anchor.anchor_id);
  }

  if (
    externalAnchors.some(
      (anchor) => Number(anchor.sequence) > verifiedTranscript.recordCount,
    )
  ) {
    fail("ANCHOR_AHEAD_OF_TRANSCRIPT");
  }

  for (const anchor of externalAnchors) {
    const expected = verifiedTranscript.generatedAnchors[Number(anchor.sequence)];
    if (!equalCanonical(anchor, expected)) fail("ANCHOR_TRANSCRIPT_MISMATCH");
  }

  const matchedAnchors = externalAnchors
    .map((anchor) => ({
      anchor_id: anchor.anchor_id,
      sequence: anchor.sequence,
    }))
    .sort(
      (left, right) =>
        Number(left.sequence) - Number(right.sequence) ||
        left.anchor_id.localeCompare(right.anchor_id),
    );
  const highestConfirmedSequence = matchedAnchors.at(-1).sequence;
  const highestConfirmedNumber = Number(highestConfirmedSequence);

  return {
    rollbackCheck: "ANCHORED_PREFIX_CONFIRMED",
    confirmedIds: externalAnchors.map((anchor) => anchor.anchor_id),
    matchedAnchors,
    highestConfirmedSequence,
    terminalAnchorConfirmed:
      highestConfirmedNumber === verifiedTranscript.recordCount ? "TRUE" : "FALSE",
    unconfirmedSuffixCount: String(
      verifiedTranscript.recordCount - highestConfirmedNumber,
    ),
  };
}

function makeReport(verified, external) {
  return {
    schema: "nexus.r015-cold-verifier-report/v0",
    status: "PASS",
    transcript_id: verified.transcript.transcript_id,
    record_count: verified.transcript.record_count,
    genesis_id: GENESIS_ID,
    initial_state_root: verified.transcript.initial_state_root,
    final_state_root: verified.finalStateRoot,
    receipt_head: verified.receiptHead,
    record_head: verified.recordHead,
    total_supply: String(TOTAL_SUPPLY),
    record_hashes: verified.recordHashes,
    receipt_hashes: verified.receiptHashes,
    prefix_anchor_ids: verified.generatedAnchors.map((anchor) => anchor.anchor_id),
    embedded_anchor_check: "ALL_PREFIXES_MATCH",
    rollback_check: external.rollbackCheck,
    confirmed_external_anchor_ids: external.confirmedIds,
    anchor_provenance: "UNAUTHENTICATED_CALLER_SUPPLIED_INTEGRITY_OBSERVATION",
    matched_external_anchors: external.matchedAnchors,
    highest_confirmed_sequence: external.highestConfirmedSequence,
    terminal_anchor_confirmed: external.terminalAnchorConfirmed,
    unconfirmed_suffix_count: external.unconfirmedSuffixCount,
    status_authority: STATUS_AUTHORITY,
    claims: [
      "SEPARATE_NODE_IMPLEMENTATION_RECOMPUTATION_OF_CLOSED_DURABLE_PREFIX",
      "GENESIS_TRANSFERS_RECEIPTS_RECORD_HASHES_AND_PREFIX_ANCHORS_MATCH",
    ],
    non_claims: [
      "MONEY",
      "ECONOMIC_VALUE",
      "SAFE_CUSTODY",
      "BACKING",
      "REDEMPTION",
      "NETWORK_CONSENSUS",
      "GLOBAL_FINALITY",
      "PHYSICAL_POWER_LOSS_PROOF",
      "PRODUCTION_SECURITY",
      "EXTERNAL_AUDIT",
      "UNBOUNDED_FORMAL_VERIFICATION",
    ],
  };
}

async function main() {
  const [transcriptPath, ...anchorPaths] = process.argv.slice(2);
  if (transcriptPath === undefined) fail("USAGE");
  const rawTranscript = await readBounded(
    transcriptPath,
    MAX_TRANSCRIPT_BYTES,
    "TRANSCRIPT_INVALID",
  );
  const verified = await verifyTranscript(rawTranscript);
  const external = await verifyExternalAnchors(anchorPaths, verified);
  const report = makeReport(verified, external);
  process.stdout.write(`${canonicalJson(report)}\n`);
}

try {
  await main();
} catch (error) {
  const code =
    error instanceof VerificationError &&
    [
      "USAGE",
      "TRANSCRIPT_INVALID",
      "ANCHOR_INVALID",
      "ANCHOR_AHEAD_OF_TRANSCRIPT",
      "ANCHOR_TRANSCRIPT_MISMATCH",
      "INTERNAL_ERROR",
    ].includes(error.code)
      ? error.code
      : "TRANSCRIPT_INVALID";
  process.stderr.write(`${code}\n`);
  process.exitCode = 1;
}
