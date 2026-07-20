# Clean-room interpretation — BENEFICIAL_GENESIS_DIFF_RETEST_002

**Status authority:** NONE  
**Phase:** clean-room (pre-freeze)  
**Subject commit:** `46a7de63fd800029a05793d7d8204a900690f68e`  
**Subject PR:** #30 (`codex/beneficial-genesis-diff-repair-002`)  
**Seat:** fresh Grok Code session (no PR #29 resume)

## Sources used before freeze

Inspected (contents opened):

- `TECHNICAL_DESIGN.md`
- `THREAT_MODEL_AND_NONCLAIMS.md`
- `README.md`
- `schemas/protocol_constants.json`
- `schemas/protocol_objects.schema.json`
- `schemas/rejection_codes.json`
- `fixtures/**` (genesis, valid, invalid, EXPECTED.json)
- Issues #26, #28, #31
- Controlling review summaries on PRs #27, #29, #30 (via `gh`)
- `operations/receipts/BENEFICIAL_GENESIS_DESIGN_001/RECEIPT.json` (path inventory / repair list)

**Not opened before freeze** (hash-inventoried only):

- `experiments/BENEFICIAL_GENESIS_DESIGN_001/protocol/**`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/tests/**`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/generate_fixtures.py`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/verify_evidence.py`
- `experiments/BENEFICIAL_GENESIS_REPRODUCER_001/**` (absent on subject tip; present only on PR #29 history)

## Reconstructed wire rules (fixture-proven)

These match committed fixture digests without reading implementation source:

| Construct | Rule |
|-----------|------|
| `domain_hash` | `SHA256(domain_ascii \|\| 0x00 \|\| u32be(len) \|\| part ...)` |
| Charity-set commitment | `domain_hash(BGEN-CHARITY-SET-v1, canonical_json({entries, version}))` |
| Donation commitment | `SHA256(DOMAIN \|\| 0x00 \|\| chain \|\| 0x00 \|\| epoch \|\| 0x00 \|\| charity \|\| 0x00 \|\| u32be(vout) \|\| u64be(amount) \|\| pk32 \|\| nonce16 \|\| u32be(version))` |
| Nullifier | `domain_hash(BGEN-NULLIFIER-v1, source_chain_utf8, txid32, u32be(vout))` |
| Txid | `domain_hash(BGEN-SYNTH-TXID-v1, canonical_json({inputs,locktime,outputs,version}))` |
| Header hash | `domain_hash(BGEN-SYNTH-HEADER-v1, canonical_json({bits,height,merkle_root_hex,prev_hash_hex,time}))` |
| Merkle parent | `domain_hash(BGEN-SYNTH-MERKLE-v1, left32, right32)` with odd-leaf duplication |
| PQ claim message | `ASCII(BGEN-PQ-CLAIM-MSG-v1) \|\| 0x00 \|\| canonical_json(9 keys)` |
| PQ signature envelope | `ASCII(SYNTHETIC_HMAC_SHA256_PQ_STANDIN_v1) \|\| 0x00 \|\| mac32` |
| Canonical JSON | sorted keys, separators `,` `:`, lowercase hex binary fields |

## Lifecycle interpretation (D-005)

Trusted epoch object carries **distinct**:

1. `accepted_source_tip_height/hash` — confirmation tip  
2. `last_eligible_inclusion_height/hash` — donation eligibility cutoff (must sit on tip ancestry)  
3. optional `quantum_compromise_cutoff_height` — independent classical-auth cutoff  

Confirmations: `tip_height - inclusion_height + 1 >= min_confirmations`.  
Eligibility: `inclusion_height <= last_eligible_inclusion_height`.  
Open epoch admits new claims; closed epoch rejects admission (`EPOCH_CLOSED`) and uses non-consuming historical replay.

## Commitment multiplicity

Exactly one output must equal `6a20 || commitment`. Duplicate identical carriers reject. Additional distinct `6a20` carriers are allowed only up to the count of non-carrier outputs (capacity for multi-donation txs).

## Parser / shape policy

- Raw JSON duplicate keys → `DUPLICATE_JSON_KEY` before object verification.  
- Exact key sets on claims and nested consensus objects; unexpected keys → `UNKNOWN_FIELD`.  
- No integer coercion: booleans/strings/floats are `TYPE_ERROR` or `COMMITMENT_VERSION_INVALID`.  
- Presented `nullifier_hex` is required and must equal recomputed nullifier.

## Allocation

`allocation_i = floor(pool * eligible_i / total)`; remainder unissued; rows ordered by `nullifier_hex` ascending; full record validation including epoch checkpoint binding.

## Known clean-room gaps (specification residual)

1. **`PUBLIC_TEST_SEEDS` values are not published in `protocol_constants.json`.**  
   Synthetic PQ and source-auth verification brute-force a public seed table living only under `protocol/crypto_synth.py`. Normative constants name domains/algorithms but not the seed map.  
   **Disposition before freeze:** verifier exposes `setPublicTestSeeds`; seed map left empty until **post-freeze** recovery of public test material for differential execution. This does **not** claim full clean-room PQ reproduction from constants alone.

2. **Exact HMAC data framing for source authorization** is under-specified in the design prose (only algorithm + domain tags). Clean-room implements a natural domain-separated HMAC parallel to the PQ scheme; post-freeze probes may correct framing if fixture verification disagrees.

3. Some invalid/valid fixtures still carry harness override fields (`tip_height_override`, `epoch_last_clean_height_override`, …). Clean-room default path uses repaired genesis `CONTEXT.json` (tip 120 / eligible 110). Override handling is applied only in the fixture harness, not as consensus fields.

## Non-claims

This interpretation does not claim Bitcoin consensus security, real PQ crypto, legal ownership, charity honesty, economic fairness, merge authority, R-round assignment, or status promotion.
