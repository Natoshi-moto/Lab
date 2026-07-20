"""Protocol constants, domains, and deterministic rejection codes.

Synthetic design only. No live network identifiers are operational.
"""

from __future__ import annotations

PROTOCOL_VERSION = 1
SCHEMA_ID = "nexus.beneficial-genesis.protocol/v0"

# Domain-separated labels (ASCII). Used as hash-prefix domains only.
DOMAIN_CHARITY_SET = b"BGEN-CHARITY-SET-v1"
DOMAIN_DONATION_COMMIT = b"BGEN-DONATION-COMMIT-v1"
DOMAIN_NULLIFIER = b"BGEN-NULLIFIER-v1"
DOMAIN_PQ_PK = b"BGEN-SYNTH-PQ-PK-v1"
DOMAIN_PQ_SIG = b"BGEN-SYNTH-PQ-SIG-v1"
DOMAIN_HEADER = b"BGEN-SYNTH-HEADER-v1"
DOMAIN_TXID = b"BGEN-SYNTH-TXID-v1"
DOMAIN_MERKLE = b"BGEN-SYNTH-MERKLE-v1"
DOMAIN_SOURCE_AUTH = b"BGEN-SYNTH-SOURCE-AUTH-v1"

# Synthetic new-ledger / source-chain identifiers used by fixtures.
DEFAULT_NEW_LEDGER_CHAIN_ID = "bgen-synth-ledger-v0"
DEFAULT_SOURCE_CHAIN = "bitcoin-mainnet-semantics-synthetic"
DEFAULT_EPOCH_ID = "epoch-synth-0001"

# Synthetic PQ algorithm tag. NOT a real post-quantum primitive.
SYNTH_PQ_ALG = "SYNTHETIC_HMAC_SHA256_PQ_STANDIN_v1"
SYNTH_SOURCE_AUTH_ALG = "SYNTHETIC_SOURCE_HMAC_v1"
SUPPORTED_COMMITMENT_VERSION = 1

# Confirmations required under the bounded verifier model.
DEFAULT_MIN_CONFIRMATIONS = 6

# Fixed genesis pool for the Bitcoin migration allocation (integer units).
# Units are abstract "genesis quanta", not a price and not a token sale rate.
DEFAULT_FIXED_BITCOIN_GENESIS_POOL = 1_000_000_000

# Maximum satoshi value admitted by the synthetic model (uint64).
MAX_SATS = (1 << 64) - 1
MAX_U32 = (1 << 32) - 1

# Explicit deterministic rejection codes. Stable strings for fixtures/tests.
REJECTION_CODES: dict[str, str] = {
    "OK": "Claim admitted under the synthetic verifier model",
    "UNSUPPORTED_SOURCE_CHAIN": "Source chain/version is not supported",
    "UNSUPPORTED_CLAIM_VERSION": "Claim version is not supported",
    "UNSUPPORTED_TX_FORM": "Transaction form is outside the synthetic model",
    "UNSUPPORTED_SCRIPT_FORM": "Output script form is outside the synthetic model",
    "HEADER_ANCESTRY_INVALID": "Source header is not in accepted checkpoint ancestry",
    "STALE_CHECKPOINT": "Checkpoint is stale relative to declared last-clean tip",
    "CONFLICTING_CHECKPOINT": "Checkpoint conflicts with accepted ancestry",
    "INCLUSION_PROOF_INVALID": "Merkle inclusion proof does not verify",
    "INSUFFICIENT_CONFIRMATIONS": "Declared confirmations below required minimum",
    "INCLUSION_AFTER_CUTOFF": "Source inclusion height is after epoch cutoff",
    "CLAIM_AFTER_CUTOFF": "Claim submitted after epoch close / last-clean checkpoint",
    "EPOCH_CLOSED": "Migration epoch is closed; no further claims admitted",
    "CHARITY_ID_UNKNOWN": "Charity identifier is not in the genesis set",
    "CHARITY_INACTIVE": "Charity entry is outside its validity window",
    "CHARITY_SCRIPT_MISMATCH": "Output script bytes do not match genesis entry",
    "DUPLICATE_CHARITY_ENTRY": "Genesis charity set contains a duplicate identifier",
    "MALFORMED_CHARITY_ENTRY": "Genesis charity entry is malformed",
    "CHARITY_SET_COMMITMENT_INVALID": "Genesis charity-set commitment does not match its entries",
    "MALFORMED_EPOCH": "Trusted epoch object is malformed",
    "CHECKPOINT_MISMATCH": "Supplied checkpoint height/hash does not match the validated tip",
    "ADDRESS_STRING_AMBIGUITY": "Address-string comparison is forbidden; use exact script bytes",
    "SCRIPT_SUBSTITUTION": "Output script differs from genesis-committed script",
    "AMOUNT_NOT_POSITIVE": "Eligible donation amount is not a positive integer",
    "AMOUNT_MISMATCH": "Claimed amount does not match donation output value",
    "WRONG_OUTPUT_INDEX": "Commitment or claim points at the wrong output index",
    "COMMITMENT_INVALID": "Donation commitment binding does not verify",
    "COMMITMENT_FIELD_MISMATCH": "Commitment fields disagree with claim body",
    "COMMITMENT_VERSION_INVALID": "Commitment version is not the exact supported uint32 value",
    "COMMITMENT_MULTIPLICITY_INVALID": "Commitment carrier multiplicity is ambiguous or duplicated",
    "PQ_SIGNATURE_INVALID": "Post-quantum destination signature is invalid",
    "PQ_KEY_WRONG": "Signature does not match bound PQ destination public key",
    "PQ_ALGORITHM_UNSUPPORTED": "PQ algorithm tag is not supported by this verifier",
    "PQ_DOMAIN_INVALID": "PQ signature domain separation is wrong or omitted",
    "NULLIFIER_ALREADY_CONSUMED": "Donation nullifier has already been consumed",
    "NULLIFIER_COLLISION": "Nullifier collides under domain-omission or ambiguity attempt",
    "NULLIFIER_DOMAIN_OMISSION": "Nullifier preimage omitted required domain separation",
    "CROSS_CHAIN_REPLAY": "Claim attempts replay across chain identifiers",
    "CROSS_EPOCH_REPLAY": "Claim attempts replay across migration epochs",
    "TX_MALLEABILITY_REENCODING": "Transaction re-encoding changes identity under model rules",
    "ARITHMETIC_OVERFLOW": "Allocation arithmetic overflowed or used non-integer values",
    "ALLOCATION_EXCEEDS_POOL": "Total issuance would exceed the fixed genesis pool",
    "ALLOCATION_NONCANONICAL": "Allocation record is not the canonical proportional result",
    "EPOCH_NOT_CLOSED": "Allocation requires a validated closed epoch",
    "QUANTUM_COMPROMISE_CUTOFF": "Classical source authorization after quantum-cutoff height",
    "SOURCE_AUTH_INVALID": "Source-chain authorization does not demonstrate control",
    "MISSING_FIELD": "Required protocol field is missing",
    "TYPE_ERROR": "Field has the wrong type or encoding",
    "UNKNOWN_FIELD": "Consensus object contains an unexpected field",
    "NULLIFIER_INVALID": "Presented nullifier is malformed or disagrees with the canonical nullifier",
    "DUPLICATE_JSON_KEY": "Raw JSON contains a duplicate object key",
}

# Ordered list used by schemas and documentation.
REJECTION_CODE_LIST = sorted(REJECTION_CODES.keys())
