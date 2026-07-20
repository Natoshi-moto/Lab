/**
 * Protocol parameters for Beneficial Genesis synthetic model.
 *
 * Domain-tag byte strings were not published in TECHNICAL_DESIGN.md (only
 * symbolic names). Values below were recovered as protocol parameters so a
 * second implementation can agree with committed fixtures. See
 * CLEANROOM_INTERPRETATION.md.
 */

export const PROTOCOL_VERSION = 1;
export const SCHEMA_ID = "nexus.beneficial-genesis.protocol/v0";

export const DOMAIN_CHARITY_SET = Buffer.from("BGEN-CHARITY-SET-v1");
export const DOMAIN_DONATION_COMMIT = Buffer.from("BGEN-DONATION-COMMIT-v1");
export const DOMAIN_NULLIFIER = Buffer.from("BGEN-NULLIFIER-v1");
export const DOMAIN_PQ_PK = Buffer.from("BGEN-SYNTH-PQ-PK-v1");
export const DOMAIN_PQ_SIG = Buffer.from("BGEN-SYNTH-PQ-SIG-v1");
export const DOMAIN_HEADER = Buffer.from("BGEN-SYNTH-HEADER-v1");
export const DOMAIN_TXID = Buffer.from("BGEN-SYNTH-TXID-v1");
export const DOMAIN_MERKLE = Buffer.from("BGEN-SYNTH-MERKLE-v1");
export const DOMAIN_SOURCE_AUTH = Buffer.from("BGEN-SYNTH-SOURCE-AUTH-v1");

export const DEFAULT_NEW_LEDGER_CHAIN_ID = "bgen-synth-ledger-v0";
export const DEFAULT_SOURCE_CHAIN = "bitcoin-mainnet-semantics-synthetic";
export const DEFAULT_EPOCH_ID = "epoch-synth-0001";
export const SYNTH_PQ_ALG = "SYNTHETIC_HMAC_SHA256_PQ_STANDIN_v1";
export const DEFAULT_MIN_CONFIRMATIONS = 6;
export const DEFAULT_FIXED_BITCOIN_GENESIS_POOL = 1_000_000_000;
export const MAX_SATS = (1n << 64n) - 1n;
export const MAX_U32 = (1n << 32n) - 1n;
export const MAX_SATS_NUM = Number(MAX_SATS);
export const MAX_U32_NUM = Number(MAX_U32);

/** Public fixture seeds — labelled test data, not secrets. */
export const PUBLIC_TEST_SEEDS = Object.freeze({
  pq_alice: "a11ce00000000000000000000000000000000000000000000000000000000001",
  pq_bob: "b0b0000000000000000000000000000000000000000000000000000000000002",
  pq_attacker: "a77ac00000000000000000000000000000000000000000000000000000000003",
  source_donor_1: "d0d0100000000000000000000000000000000000000000000000000000000001",
  source_donor_2: "d0d0200000000000000000000000000000000000000000000000000000000002",
  source_stolen: "57eae00000000000000000000000000000000000000000000000000000000004",
});

export const REJECTION_CODES = Object.freeze({
  ADDRESS_STRING_AMBIGUITY: "Address-string comparison is forbidden; use exact script bytes",
  ALLOCATION_EXCEEDS_POOL: "Total issuance would exceed the fixed genesis pool",
  ALLOCATION_NONCANONICAL: "Allocation record is not the canonical proportional result",
  AMOUNT_MISMATCH: "Claimed amount does not match donation output value",
  AMOUNT_NOT_POSITIVE: "Eligible donation amount is not a positive integer",
  ARITHMETIC_OVERFLOW: "Allocation arithmetic overflowed or used non-integer values",
  CHARITY_ID_UNKNOWN: "Charity identifier is not in the genesis set",
  CHARITY_INACTIVE: "Charity entry is outside its validity window",
  CHARITY_SCRIPT_MISMATCH: "Output script bytes do not match genesis entry",
  CHARITY_SET_COMMITMENT_INVALID: "Genesis charity-set commitment does not match its entries",
  CHECKPOINT_MISMATCH: "Supplied checkpoint height/hash does not match the validated tip",
  CLAIM_AFTER_CUTOFF: "Claim submitted after epoch close / last-clean checkpoint",
  COMMITMENT_FIELD_MISMATCH: "Commitment fields disagree with claim body",
  COMMITMENT_INVALID: "Donation commitment binding does not verify",
  CONFLICTING_CHECKPOINT: "Checkpoint conflicts with accepted ancestry",
  CROSS_CHAIN_REPLAY: "Claim attempts replay across chain identifiers",
  CROSS_EPOCH_REPLAY: "Claim attempts replay across migration epochs",
  DUPLICATE_CHARITY_ENTRY: "Genesis charity set contains a duplicate identifier",
  EPOCH_CLOSED: "Migration epoch is closed; no further claims admitted",
  EPOCH_NOT_CLOSED: "Allocation requires a validated closed epoch",
  HEADER_ANCESTRY_INVALID: "Source header is not in accepted checkpoint ancestry",
  INCLUSION_AFTER_CUTOFF: "Source inclusion height is after epoch cutoff",
  INCLUSION_PROOF_INVALID: "Merkle inclusion proof does not verify",
  INSUFFICIENT_CONFIRMATIONS: "Declared confirmations below required minimum",
  MALFORMED_CHARITY_ENTRY: "Genesis charity entry is malformed",
  MALFORMED_EPOCH: "Trusted epoch object is malformed",
  MISSING_FIELD: "Required protocol field is missing",
  NULLIFIER_ALREADY_CONSUMED: "Donation nullifier has already been consumed",
  NULLIFIER_COLLISION: "Nullifier collides under domain-omission or ambiguity attempt",
  NULLIFIER_DOMAIN_OMISSION: "Nullifier preimage omitted required domain separation",
  OK: "Claim admitted under the synthetic verifier model",
  PQ_ALGORITHM_UNSUPPORTED: "PQ algorithm tag is not supported by this verifier",
  PQ_DOMAIN_INVALID: "PQ signature domain separation is wrong or omitted",
  PQ_KEY_WRONG: "Signature does not match bound PQ destination public key",
  PQ_SIGNATURE_INVALID: "Post-quantum destination signature is invalid",
  QUANTUM_COMPROMISE_CUTOFF: "Classical source authorization after quantum-cutoff height",
  SCRIPT_SUBSTITUTION: "Output script differs from genesis-committed script",
  SOURCE_AUTH_INVALID: "Source-chain authorization does not demonstrate control",
  STALE_CHECKPOINT: "Checkpoint is stale relative to declared last-clean tip",
  TX_MALLEABILITY_REENCODING: "Transaction re-encoding changes identity under model rules",
  TYPE_ERROR: "Field has the wrong type or encoding",
  UNSUPPORTED_CLAIM_VERSION: "Claim version is not supported",
  UNSUPPORTED_SCRIPT_FORM: "Output script form is outside the synthetic model",
  UNSUPPORTED_SOURCE_CHAIN: "Source chain/version is not supported",
  UNSUPPORTED_TX_FORM: "Transaction form is outside the synthetic model",
  WRONG_OUTPUT_INDEX: "Commitment or claim points at the wrong output index",
});
