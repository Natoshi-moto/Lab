/**
 * Normative constants for Beneficial Genesis retest verifier.
 * Bound to subject schemas/protocol_constants.json + TECHNICAL_DESIGN.md.
 * Public test seeds are intentionally empty until post-freeze recovery
 * (they are not published in protocol_constants.json).
 */

export const PROTOCOL_VERSION = 1;
export const COMMITMENT_VERSION = 1;
export const SUPPORTED_SOURCE_CHAIN = "bitcoin-mainnet-semantics-synthetic";
export const SUPPORTED_PQ_ALGORITHM = "SYNTHETIC_HMAC_SHA256_PQ_STANDIN_v1";
export const SUPPORTED_SOURCE_AUTH_ALGORITHM = "SYNTHETIC_SOURCE_HMAC_v1";
export const SOURCE_CONTROL_LABEL = "CRYPTOGRAPHIC_CONTROL_SYNTHETIC";
export const PQ_CLAIM_PURPOSE = "beneficial-genesis-claim-v1";
export const PQ_CLAIM_MESSAGE_PREFIX = "BGEN-PQ-CLAIM-MSG-v1";
export const REMAINDER_HANDLING = "UNISSUED_FLOOR_REMAINDER";
export const MAX_MERKLE_BRANCH = 64;

export const DOMAINS = Object.freeze({
  charity_set: "BGEN-CHARITY-SET-v1",
  donation_commitment: "BGEN-DONATION-COMMIT-v1",
  header: "BGEN-SYNTH-HEADER-v1",
  merkle: "BGEN-SYNTH-MERKLE-v1",
  nullifier: "BGEN-NULLIFIER-v1",
  pq_public_key: "BGEN-SYNTH-PQ-PK-v1",
  pq_signature: "BGEN-SYNTH-PQ-SIG-v1",
  source_authorization: "BGEN-SYNTH-SOURCE-AUTH-v1",
  transaction_id: "BGEN-SYNTH-TXID-v1",
});

/** Filled post-freeze from subject public test material only. */
export let PUBLIC_TEST_SEEDS = Object.freeze({});

export function setPublicTestSeeds(seeds) {
  PUBLIC_TEST_SEEDS = Object.freeze({ ...seeds });
}

export const CLAIM_KEYS = Object.freeze([
  "amount_sats",
  "charity_id",
  "commitment_nonce_hex",
  "commitment_version",
  "declared_commitment_hex",
  "donation_txid_hex",
  "donation_vout",
  "epoch_id",
  "inclusion_proof",
  "label",
  "new_ledger_chain_id",
  "nullifier_hex",
  "pq_destination_public_key_hex",
  "pq_signature_hex",
  "schema",
  "source_authorization",
  "source_chain",
  "transaction",
  "version",
]);

export const INCLUSION_PROOF_KEYS = Object.freeze([
  "block_header_hash_hex",
  "block_height",
  "merkle_branch_hex",
  "merkle_index",
  "schema",
]);

export const SOURCE_AUTH_KEYS = Object.freeze([
  "alg",
  "control_label",
  "public_key_hex",
  "sighash_hex",
  "signature_hex",
]);

export const TX_KEYS = Object.freeze([
  "inputs",
  "label",
  "locktime",
  "outputs",
  "version",
]);

export const TX_INPUT_KEYS = Object.freeze([
  "prev_txid_hex",
  "prev_vout",
  "script_sig_hex",
  "sequence",
]);

export const TX_OUTPUT_KEYS = Object.freeze([
  "script_pubkey_hex",
  "value_sats",
]);

export const EPOCH_KEYS = Object.freeze([
  "accepted_source_tip_header_hash_hex",
  "accepted_source_tip_height",
  "closed",
  "epoch_id",
  "last_eligible_inclusion_header_hash_hex",
  "last_eligible_inclusion_height",
  "min_confirmations",
  "schema",
  "version",
  // optional:
  // "quantum_compromise_cutoff_height"
]);

export const EPOCH_OPTIONAL_KEYS = Object.freeze([
  "quantum_compromise_cutoff_height",
]);

export const CHARITY_ENTRY_KEYS = Object.freeze([
  "attestation_commitment_hex",
  "charity_id",
  "script_pubkey_hex",
  "valid_from_height",
  "valid_until_height",
]);

export const CHARITY_SET_KEYS = Object.freeze([
  "commitment_hex",
  "entries",
  "schema",
  "version",
]);

export const ALLOCATION_RECORD_KEYS = Object.freeze([
  "claims",
  "epoch_checkpoint_binding",
  "epoch_id",
  "fixed_bitcoin_genesis_pool",
  "remainder_handling",
  "remainder_unissued",
  "schema",
  "total_eligible_sats",
  "total_issued",
  "version",
]);

export const ALLOCATION_CLAIM_KEYS = Object.freeze([
  "allocation",
  "eligible_sats",
  "nullifier_hex",
]);

export const REJECTION = Object.freeze({
  ADDRESS_STRING_AMBIGUITY: "ADDRESS_STRING_AMBIGUITY",
  ALLOCATION_EXCEEDS_POOL: "ALLOCATION_EXCEEDS_POOL",
  ALLOCATION_NONCANONICAL: "ALLOCATION_NONCANONICAL",
  AMOUNT_MISMATCH: "AMOUNT_MISMATCH",
  AMOUNT_NOT_POSITIVE: "AMOUNT_NOT_POSITIVE",
  ARITHMETIC_OVERFLOW: "ARITHMETIC_OVERFLOW",
  CHARITY_ID_UNKNOWN: "CHARITY_ID_UNKNOWN",
  CHARITY_INACTIVE: "CHARITY_INACTIVE",
  CHARITY_SCRIPT_MISMATCH: "CHARITY_SCRIPT_MISMATCH",
  CHARITY_SET_COMMITMENT_INVALID: "CHARITY_SET_COMMITMENT_INVALID",
  CHECKPOINT_MISMATCH: "CHECKPOINT_MISMATCH",
  CLAIM_AFTER_CUTOFF: "CLAIM_AFTER_CUTOFF",
  COMMITMENT_FIELD_MISMATCH: "COMMITMENT_FIELD_MISMATCH",
  COMMITMENT_INVALID: "COMMITMENT_INVALID",
  COMMITMENT_MULTIPLICITY_INVALID: "COMMITMENT_MULTIPLICITY_INVALID",
  COMMITMENT_VERSION_INVALID: "COMMITMENT_VERSION_INVALID",
  CONFLICTING_CHECKPOINT: "CONFLICTING_CHECKPOINT",
  CROSS_CHAIN_REPLAY: "CROSS_CHAIN_REPLAY",
  CROSS_EPOCH_REPLAY: "CROSS_EPOCH_REPLAY",
  DUPLICATE_CHARITY_ENTRY: "DUPLICATE_CHARITY_ENTRY",
  DUPLICATE_JSON_KEY: "DUPLICATE_JSON_KEY",
  EPOCH_CLOSED: "EPOCH_CLOSED",
  EPOCH_NOT_CLOSED: "EPOCH_NOT_CLOSED",
  HEADER_ANCESTRY_INVALID: "HEADER_ANCESTRY_INVALID",
  INCLUSION_AFTER_CUTOFF: "INCLUSION_AFTER_CUTOFF",
  INCLUSION_PROOF_INVALID: "INCLUSION_PROOF_INVALID",
  INSUFFICIENT_CONFIRMATIONS: "INSUFFICIENT_CONFIRMATIONS",
  MALFORMED_CHARITY_ENTRY: "MALFORMED_CHARITY_ENTRY",
  MALFORMED_EPOCH: "MALFORMED_EPOCH",
  MISSING_FIELD: "MISSING_FIELD",
  NULLIFIER_ALREADY_CONSUMED: "NULLIFIER_ALREADY_CONSUMED",
  NULLIFIER_COLLISION: "NULLIFIER_COLLISION",
  NULLIFIER_DOMAIN_OMISSION: "NULLIFIER_DOMAIN_OMISSION",
  NULLIFIER_INVALID: "NULLIFIER_INVALID",
  OK: "OK",
  PQ_ALGORITHM_UNSUPPORTED: "PQ_ALGORITHM_UNSUPPORTED",
  PQ_DOMAIN_INVALID: "PQ_DOMAIN_INVALID",
  PQ_KEY_WRONG: "PQ_KEY_WRONG",
  PQ_SIGNATURE_INVALID: "PQ_SIGNATURE_INVALID",
  QUANTUM_COMPROMISE_CUTOFF: "QUANTUM_COMPROMISE_CUTOFF",
  SCRIPT_SUBSTITUTION: "SCRIPT_SUBSTITUTION",
  SOURCE_AUTH_INVALID: "SOURCE_AUTH_INVALID",
  STALE_CHECKPOINT: "STALE_CHECKPOINT",
  TX_MALLEABILITY_REENCODING: "TX_MALLEABILITY_REENCODING",
  TYPE_ERROR: "TYPE_ERROR",
  UNKNOWN_FIELD: "UNKNOWN_FIELD",
  UNSUPPORTED_CLAIM_VERSION: "UNSUPPORTED_CLAIM_VERSION",
  UNSUPPORTED_SCRIPT_FORM: "UNSUPPORTED_SCRIPT_FORM",
  UNSUPPORTED_SOURCE_CHAIN: "UNSUPPORTED_SOURCE_CHAIN",
  UNSUPPORTED_TX_FORM: "UNSUPPORTED_TX_FORM",
  WRONG_OUTPUT_INDEX: "WRONG_OUTPUT_INDEX",
});
