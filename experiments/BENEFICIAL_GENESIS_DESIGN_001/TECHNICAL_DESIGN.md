# Beneficial Genesis — Technical Design (Bitcoin-only, synthetic)

**Task:** `TSK-BENEFICIAL-GENESIS-DESIGN-001`  
**Status authority:** none (`PROPOSE_ONLY / DESIGN_AND_SYNTHETIC_EVIDENCE`)  
**Round assignment:** none (must not be labelled R-next)  
**Source chain scope:** Bitcoin mainnet *semantics* only, via synthetic fixtures  
**Implementation:** Python standard library only  

This document defines the smallest internally coherent protocol for **charity-bound post-quantum migration receipts**. It is a design-and-evidence pack, not a mainnet deployment, wallet, bridge, token sale, or consensus mechanism.

---

## 1. Research question and core hypothesis

Can a new post-quantum ledger distribute a finite genesis allocation by accepting independently verifiable receipts that prove a participant:

1. cryptographically controlled a source-chain asset at donation time;
2. transferred value to an exact genesis-committed charity output script;
3. bound that donation to a post-quantum destination on the new ledger

—all within one source-chain transaction structure (plus a PQ claim signature)?

**Hypothesis under test:** yes, under a bounded synthetic Bitcoin-like model with fail-closed validation, one-time nullifiers, and fixed-pool proportional allocation after epoch close.

---

## 2. Architecture boundary

Beneficial Genesis is an **initial allocation and migration mechanism**, not ongoing consensus.

| Is | Is not |
|----|--------|
| Genesis allocation admission rule | Ongoing block production |
| Consumer of later PQ admission/custody components | A modification of promoted R016 |
| Synthetic evidence pack | Live funds / mainnet ops |
| Receipt verifier + fixtures | Production node / RPC client |

Open R017/R018 proposals are **not** canonical dependencies of this design.

---

## 3. Locked first-design scope

- Source chain: Bitcoin mainnet semantics only (synthetic model).
- No live transactions, operational charity addresses, or donor data.
- Finite donation/migration epoch.
- Immutable genesis charity set.
- Compare **exact output-script bytes**, never displayed address strings.
- Each charity entry binds: stable id, exact script, attestation commitment, validity window.
- Donation commitment binds: new-ledger chain id, epoch, charity id, output index, amount, PQ destination public key, nonce, version.
- Claim requires a PQ (stand-in) signature from the bound destination key.
- Inclusion via synthetic block-header + Merkle-proof model.
- One-time nullifier per `(source_chain, txid, vout)`.
- Fixed Bitcoin genesis pool; proportional weights; no fixed BTC↔token rate.
- No oracle, bridge custody, mutable charity registry, administrator approval, or redemption promise.

---

## 4. Canonical protocol objects

Versioned encodings (see `schemas/protocol_objects.schema.json` and `protocol/objects.py`):

| Object | Role |
|--------|------|
| `CharityGenesisEntry` | One immutable charity destination |
| `CharitySetCommitment` | Ordered set + domain-separated digest |
| `DonationCommitment` | In-tx binding (OP_RETURN payload) |
| `SourceHeaderCheckpoint` | Bounded source tip / ancestry point |
| `DonationInclusionProof` | Merkle branch under a header |
| `BeneficialGenesisClaim` | Full claim presented to the new ledger |
| `DonationNullifier` | One-time spend of a donation output claim right |
| `GenesisAllocationRecord` | Post-epoch proportional issuance |
| `MigrationEpochClose` | Cutoff, confirmations, optional quantum cutoff |

### 4.1 Encoding rules

- Canonical JSON for digests: UTF-8, sorted keys, separators `,` `:`, `ensure_ascii=True`, no NaN.
- Binary fields: lowercase hex, no `0x`.
- Multi-byte integers in preimages: **big-endian**.
- Duplicate JSON object keys are invalid at the raw parser boundary; consensus
  objects then reject every key not enumerated by their schema.
- `domain_hash(domain, parts...) = SHA256(domain || 0x00 ||
  u32be(len(part_0)) || part_0 || ...)`.
- Normative ASCII domain bytes are: `BGEN-CHARITY-SET-v1`,
  `BGEN-DONATION-COMMIT-v1`, `BGEN-NULLIFIER-v1`,
  `BGEN-SYNTH-PQ-PK-v1`, `BGEN-SYNTH-PQ-SIG-v1`,
  `BGEN-SYNTH-HEADER-v1`, `BGEN-SYNTH-TXID-v1`,
  `BGEN-SYNTH-MERKLE-v1`, and `BGEN-SYNTH-SOURCE-AUTH-v1`.
  These and the supported versions/tags are duplicated in the normative
  machine-readable `schemas/protocol_constants.json`.

### 4.2 Donation commitment preimage

```text
DOMAIN_DONATION_COMMIT || 0x00 ||
  new_ledger_chain_id || 0x00 ||
  epoch_id || 0x00 ||
  charity_id || 0x00 ||
  u32be(vout) || u64be(amount_sats) ||
  pq_destination_pk || nonce16 || u32be(version)
commitment = SHA256(preimage)
```

**txid is intentionally omitted** from the commitment so the payload can sit inside the same transaction without a circular identity dependency. The claim + nullifier bind the concrete `(txid, vout)` after the synthetic txid is computed.

On-wire carrier (synthetic): `scriptPubKey = OP_RETURN || OP_PUSH32 || commitment` (`6a20` ‖ 32-byte digest).

### 4.3 Nullifier

```text
nullifier = domain_hash(
  DOMAIN_NULLIFIER,
  source_chain,
  txid32,
  u32be(vout)
)
```

Domain omission attempts are rejected (`NULLIFIER_DOMAIN_OMISSION`).

### 4.4 PQ claim message and synthetic cryptography (non-operational)

The exact message is ASCII `BGEN-PQ-CLAIM-MSG-v1`, then `0x00`, then canonical
JSON of exactly these keys: `amount_sats`, `charity_id`, `commitment_hex`,
`donation_txid_hex`, `donation_vout`, `epoch_id`, `new_ledger_chain_id`,
`nullifier_hex`, and `purpose` (fixed to `beneficial-genesis-claim-v1`). The
signature blob is `ASCII(SYNTHETIC_HMAC_SHA256_PQ_STANDIN_v1) || 0x00 ||
mac32`. Signing always uses the fixed `BGEN-SYNTH-PQ-SIG-v1` domain; no claim
field can replace it.

| Tag | Purpose |
|-----|---------|
| `SYNTHETIC_HMAC_SHA256_PQ_STANDIN_v1` | PQ destination signature stand-in |
| `SYNTHETIC_SOURCE_HMAC_v1` | Source-chain control stand-in |

These exist so the design pack is stdlib-only and deterministic. They are **not** post-quantum, not Bitcoin script, and not production algorithms. A promotion-grade design must replace them with real PQ signatures and a precise Bitcoin script/sighash model.

Public fixture seeds in `protocol/crypto_synth.py` are labelled test data, not secrets.

### 4.5 Synthetic transaction identity and Merkle model

- Transaction objects contain exactly `version`, `locktime`, `inputs`,
  `outputs`, and `label`. Tx identity excludes only `label` and hashes canonical
  JSON of exactly `inputs`, `locktime`, `outputs`, `version` in that semantic
  object. Inputs contain exactly `prev_txid_hex`, `prev_vout`,
  `script_sig_hex`, `sequence`; outputs contain exactly `script_pubkey_hex`,
  `value_sats`.
- `txid = domain_hash(DOMAIN_TXID, canonical_json(identity_fields))`
- Merkle parent = `domain_hash(DOMAIN_MERKLE, left, right)` with Bitcoin-like odd-leaf duplication.
- Merkle leaves are 32-byte txids. A parent is
  `domain_hash(DOMAIN_MERKLE, left32, right32)`; an odd final leaf is duplicated
  at every level. Proof indices are non-negative u32 values and branches contain
  at most 64 lowercase 32-byte hashes.
- Header identity fields are exactly `bits`, `height`, `merkle_root_hex`,
  `prev_hash_hex`, `time`; header hash is
  `domain_hash(DOMAIN_HEADER, canonical_json(header_fields))`.
- Supported scripts are exactly lowercase `0014 || program20` or
  `6a20 || digest32`. Other script forms are invalid in this synthetic model.
- Ancestry: header must appear on the walk of `prev_hash` links from the accepted tip.

This is a **bounded verifier model**, not Bitcoin consensus.

---

## 5. Validation predicate (fail closed)

A claim is admitted only if all hold:

1. Supported source-chain/version.
2. Accepted header ancestry under the bounded tip.
3. Valid Merkle inclusion proof.
4. Confirmations derive from the bound accepted tip and are ≥
   `min_confirmations`; inclusion height is ≤ `last_eligible_inclusion_height`.
5. Exact charity `script_pubkey` matches an active genesis entry for the claimed `charity_id`.
6. Positive eligible amount; amount equals output value.
7. Commitment binds chain, epoch, charity, vout, amount, version, nonce, PQ key; present in the same tx.
8. PQ signature verifies under the bound destination key and domain.
9. Nullifier not previously consumed.
10. (At epoch close) allocation arithmetic is canonical and supply-conserving.
11. No admission after epoch close.
12. Optional: classical source authorization after `quantum_compromise_cutoff_height` is rejected.

Rejection codes are the stable strings in `protocol/constants.py` / `schemas/rejection_codes.json`.

---

## 6. Allocation rule

For the Bitcoin migration pool:

```text
allocation_i = floor(
    fixed_bitcoin_genesis_pool * eligible_satoshis_i
    / total_eligible_satoshis
)
```

**Remainder handling:** `UNISSUED_FLOOR_REMAINDER`

```text
remainder_unissued = fixed_bitcoin_genesis_pool - sum_i(allocation_i)
```

The remainder is never issued. Integer arithmetic only. Proof sketch:

- Each `allocation_i` is a non-negative integer by construction of floor division.
- `sum_i floor(P * e_i / T) ≤ floor(P * sum e_i / T) = floor(P) = P` when `sum e_i = T` and `P` integer — more tightly, `sum floor(P e_i / T) ≤ P` always holds for non-negative integers (standard floor-sum inequality).
- Therefore `total_issued ≤ pool` and `issued + remainder = pool`.

There is **no** fixed exchange rate from BTC to new-ledger units. Eligible satoshis are proportional weights only.

Claim rows in `GenesisAllocationRecord` are ordered by `nullifier_hex` ascending.

---

## 7. Epoch lifecycle

1. **Genesis:** commit charity set, pool size, epoch id, min confirmations, optional quantum cutoff.
2. **Open epoch:** admit claims under the validation predicate; consume nullifiers.
3. **Close:** freeze the exact accepted tip height/hash and the distinct exact
   last-eligible height/hash; set `closed=true`.
4. **Allocate:** run proportional rule once over admitted eligible satoshis; publish `GenesisAllocationRecord`.

---

## 8. Multi-output donations

One source transaction may contain several qualifying charity outputs. Each `(txid, vout)` has its own commitment binding, nullifier, and claim. Fixtures `claim_multi_out0` / `claim_multi_out1` demonstrate this.

V1 requires exactly one carrier matching the claim commitment. Duplicate
identical carriers reject. Distinct `6a20` carriers are permitted only up to the
number of independently claimable non-carrier donation outputs, so a single
donation output plus an unrelated/conflicting carrier is rejected as ambiguous.

---

## 9. Independent verifier plan

| Seat | Deliverable |
|------|-------------|
| This design pack | One reference Python verifier + vectors |
| Reproducer (future) | Second implementation (e.g. different language) must accept/reject the same fixtures byte-stably |
| Breaker (future) | Attempt false/duplicated/replayed/misallocated claims against the vectors |

No promotion claim is made from a single implementation.

---

## 10. Repository layout

```text
experiments/BENEFICIAL_GENESIS_DESIGN_001/
  TECHNICAL_DESIGN.md
  THREAT_MODEL_AND_NONCLAIMS.md
  README.md
  generate_fixtures.py
  verify_evidence.py
  protocol/          # reference implementation (stdlib)
  schemas/           # machine-readable object + rejection codes
  fixtures/          # deterministic valid/invalid vectors
  tests/             # unittest suite
operations/receipts/BENEFICIAL_GENESIS_DESIGN_001/
  RECEIPT.json       # sanitized task receipt
```

---

## 11. Explicit non-goals for this task

- Production blockchain, wallet, token sale, price mechanism.
- Source-chain RPC or network service.
- Live charity addresses, donor data, credentials, real keys.
- Changing `STATUS.json`, constitutions, workflows, lockfiles, or other experiments.
- Assigning an R-round number or claiming independent review.

---

## 12. Trusted-context and lifecycle invariants

- Constructor validation is fail-closed for the full canonical charity set,
  its commitment, the epoch object, every traversed header hash, every link,
  and the accepted tip height/hash.
- `accepted_source_tip_height/hash` identify the validated confirmation tip.
  `last_eligible_inclusion_height/hash` independently bind a header in that
  ancestry. The tip may be later so a boundary donation can mature.
- `quantum_compromise_cutoff_height`, when present, independently rejects
  source authorizations included later than that height.
- New admission is open-epoch-only. Closed-epoch replay uses the explicitly
  non-consuming historical verifier path.
- The only supported commitment carrier is the exact 34-byte script
  `6a20 || commitment`; substring and claim-only carriers are invalid.
- Allocation requires the validated epoch to be closed and validates the full
  canonical record, widths, sums, ordering, uniqueness, floors, and remainder.
- A replacement trusted checkpoint revalidates all provisional claims and
  atomically rebuilds nullifier state; claims reorged out are rolled back.
