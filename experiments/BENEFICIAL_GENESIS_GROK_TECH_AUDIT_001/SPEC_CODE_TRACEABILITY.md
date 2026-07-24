# Spec ↔ code traceability — BGEN-GROK-TECH-AUDIT-001

**Evidence classes used:** repository observation, reproduced executable result, mathematical deduction (floor inequality).

## Design pack (normative: `TECHNICAL_DESIGN.md` + schemas)

| Spec claim | Code locator | Status | Notes |
|------------|--------------|--------|-------|
| Canonical JSON: sorted keys, `,` `:`, `ensure_ascii=True`, no NaN | `protocol/encoding.py:59-68` `canonical_json_bytes` | **Match** | Probe P-DES-011 confirms `\u` escapes |
| Duplicate JSON keys rejected | `protocol/encoding.py:71-89` `object_pairs_hook` | **Match** | P-DES-003 PASS |
| Lowercase hex only | `protocol/encoding.py:48-56` `require_hex` | **Match** | P-DES-004/005 PASS |
| `domain_hash` length framing | `protocol/encoding.py:102-112` | **Match** | P-DES-006 PASS |
| Donation commitment preimage / OP_RETURN `6a20‖32` | `TECHNICAL_DESIGN.md` §4.2; verifier carrier checks | **Match** | Tests `test_commitment_carrier_is_exact`, D007 |
| Nullifier `domain_hash(DOMAIN_NULLIFIER, chain, txid, u32be(vout))` | `protocol/nullifier.py:41-50`; `objects.donation_nullifier_hex` | **Match** | Domain omission helper `domain_omission_attempt` L54-70; fixture expects `NULLIFIER_INVALID` not `NULLIFIER_DOMAIN_OMISSION` (see F-002) |
| Allocation `floor(pool*e/T)`, unissued remainder | `protocol/allocation.py:39-105` | **Match** | P-DES-002, design tests; supply invariant L108-171 |
| Bool not accepted as int | `allocation.py:31-36` `type(value) is not int` | **Match** | P-DES-001 |
| Claim exact key set / unknown fields | `verifier.py:27-32` `CLAIM_KEYS`; L193-197 | **Match** | D004 tests |
| Closed epoch rejects new admission | `verifier.py:177-181` | **Match** | adversarial tests |
| Historical non-consuming replay | `verifier.py:183-185` | **Match** | |
| Checkpoint ancestry / tip / last-eligible | `verifier.py:126-161` | **Match** | D005 tests |
| Quantum cutoff optional | epoch validation L113-115; claim path | **Match** | fixture `quantum_compromise_cutoff` |
| Supported scripts `0014‖20` / `6a20‖32` | constants schema + verifier | **Match** | fail-closed unsupported forms |

### Catalog / documentation drift

| Claim | Locator | Status |
|-------|---------|--------|
| README: “29 executable invalid vectors, 6 documentary-only” | `README.md:77-78` | **Mismatch** vs `fixtures/EXPECTED.json` (`documentary_only` length 1) and evidence gate (`executed=34`, `documentary=1`) — **F-001** |

### Rejection-code semantic mapping (behavior fail-closed; labels uneven)

From `fixtures/EXPECTED.json` `invalid_expected_codes`:

| Fixture stem | Expected code | Observation |
|--------------|---------------|-------------|
| `wrong_output_index` | `AMOUNT_MISMATCH` | Fail-closed, but code name does not mirror fixture attack label (F-002) |
| `unsupported_script_form` | `UNSUPPORTED_TX_FORM` | Same class of taxonomy looseness |
| `nullifier_domain_omission` | `NULLIFIER_INVALID` | `NULLIFIER_DOMAIN_OMISSION` exists in `constants.py:81` but catalog uses broader code |
| `inclusion_after_cutoff` | `HEADER_ANCESTRY_INVALID` | Distinct from `inclusion_after_cutoff_epoch` → `INCLUSION_AFTER_CUTOFF` |

These do not break fail-closed admission; they weaken operator taxonomy and automated code-name assertions.

## Economics (Claude repaired package)

| Spec / task claim (issue #34 + README) | Code locator | Status |
|----------------------------------------|--------------|--------|
| Integer floor pro-rata matching design | `model/allocation.py:92-95` `exact_pro_rata` | **Match** | P-COMP-001/002 |
| Shared fail-closed participant validator on every public allocator | `validate_participants` L29-83; each public fn calls it | **Match** | P-ECON-001; package tests |
| Lottery without replacement | `random_lottery_component` L166-214 | **Match** | P-ECON-002 |
| Metrics explicit denominators | `model/metrics.py` `top_n_share_of_issued` / `_of_pool` | **Match** | P-ECON-011 |
| Governance named rules; cap_then_renormalize three stages | `model/governance.py` | **Match** | P-ECON-005; retest V-002 |
| Tainted profit conditional | `model/tainted_funds.py` | **Match** (tests + structure) | |
| Rebate conditional on frictions | `model/collusion.py` | **Match** (tests) | |
| `SCHEMES` registry includes all schemes | `allocation.py:217-223` | **Partial** | Lottery omitted from `SCHEMES` (requires rng) — OBSERVED composition footgun, not silent wrong math |
| `ECONOMIC_GATE_PASS: false` | README + retest DECISION | **Match** | Preserved |

## Cross-model composition

| Check | Result |
|-------|--------|
| Claude `exact_pro_rata` vs design `allocate_proportional` on shared weights | **Numeric match** (P-COMP-001, P-COMP-002) |
| Breaker `allocate(...)` API | Different contribution shape (`Sequence[Mapping]`, rule names) — independent reimplementation; not byte-API compatible with Claude; intentional differential model |
| Design crypto verifier vs economics simulators | No import of design `protocol/` from economics (README claim); economics does not re-verify Bitcoin receipts |

## Differential verifier (RETEST_002 Node)

| Claim | Result |
|-------|--------|
| 43 agreements / 0 disagreements / 0 crashes on design fixtures | **Reproduced** (`verify.mjs`) |
| Hostile fixtures for dup keys, bool version, nullifier, domain | **Reproduced** (19 Node tests pass) |

## Unresolved / out of scope for technical correspondence

- Real Bitcoin serialization and consensus (explicit non-claim).
- Real ML-DSA/SLH-DSA (synthetic HMAC only).
- Whether `CONTINUE_WITH_CONDITIONS` is the “right” policy choice (policy; not technical equivalence).
