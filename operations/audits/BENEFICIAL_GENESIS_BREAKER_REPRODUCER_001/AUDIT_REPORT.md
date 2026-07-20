# Audit report — TSK-BENEFICIAL-GENESIS-BREAKER-REPRO-001

## Authority

`status_authority: NONE`  
Does not promote, merge, assign R-rounds, or alter `STATUS.json`.

## Subject binding

| Item | Value |
|------|--------|
| Repository | Natoshi-moto/Lab |
| Designer PR | #27 |
| Exact subject commit | `575f22fea039a25197510e481b7837d2b9611131` |
| Reserved branch | `grok/beneficial-genesis-breaker-repro-001` |
| Branch tip at start | equal to subject commit (no staleness) |

## Seat identity

| Field | Value |
|-------|--------|
| Provider / model | xAI Grok (interactive CLI; grok-4.5 class) |
| Reasoning setting | default agentic |
| Tools / network | shell, git, gh, Node 24, Python 3; network available |
| Launch UTC | 2026-07-20T17:16:58Z |
| Prior Beneficial Genesis context | none in this session |

## Method

1. Read controlling issues/PR comments and design pack (schemas + fixtures).  
2. Did **not** treat Designer verifier as correct a priori.  
3. Built dependency-free Node.js clean-room verifier under `experiments/BENEFICIAL_GENESIS_REPRODUCER_001/**`.  
4. Ran full committed fixture catalog + hostile differential suite.  
5. **Froze** clean-room results (`results/CLEANROOM_FREEZE.json`).  
6. **Only then** probed Python reference to explain disagreements.

## What was reconstructed

Canonical encodings, charity-set commitment, donation commitment, nullifier, synthetic txid, Merkle verification, header/checkpoint validation, claim admission, closed-epoch vs historical replay, fixed-pool floor allocation with unissued remainder.

## Fixture compatibility (clean-room)

See `experiments/BENEFICIAL_GENESIS_REPRODUCER_001/results/FIXTURE_COMPATIBILITY_REPORT.json`.

- **Crashes on Designer fixtures:** 0  
- **Agreements:** 39 (after multi-out / stolen-context handling)  
- **Disagreements:** 4 — all constructor `CHECKPOINT_MISMATCH` under tip/last-clean overrides:
  - `valid/claim_at_cutoff_boundary.json` (listed valid but not constructible post BGEN-REV-004)
  - `invalid/inclusion_after_cutoff_epoch` (documentary)
  - `invalid/insufficient_confirmations` (documentary)
  - `invalid/reorg_after_provisional_acceptance` (documentary)

Clean-room **executable** reconstruction of insufficient-confirmations, cutoff boundary, and reorg paths succeeds when trusted context is built with a **consistent** shorter tip chain (see hostile tests), not via the Designer’s override fields that break constructor invariants.

## Critical differentials (post-freeze Python probes)

Source-bound to Python `protocol/verifier.py` and `protocol/crypto_synth.py` after freeze.

### F-001 — Uncaught exception on malformed `pq_sig_domain_bytes` (CRITICAL)

- **Clean-room:** typed `PQ_DOMAIN_INVALID`  
- **Python:** `bytes.fromhex(domain)` without try/except → **`ValueError` crash**  
- **Minimized:** `hostile_fixtures/pq_domain_malformed.json`  
- **Impact:** fail-closed claim path can abort the process instead of rejecting.

### F-002 — `commitment_version` type coercion false accept (HIGH)

- **Clean-room:** rejects `true`, `"1"`, negative, oversized as `TYPE_ERROR`  
- **Python:** `int(claim["commitment_version"])` accepts `True`→1 and `"1"`→1 → **admits valid claim**  
- **Minimized:** `hostile_fixtures/commitment_version_true.json`, `commitment_version_string.json`

### F-003 — `nullifier_hex` field disagreement ignored (HIGH)

- **Clean-room:** if `claim.nullifier_hex` present and ≠ computed → `NULLIFIER_COLLISION`  
- **Python:** ignores `nullifier_hex`; only `presented_nullifier_hex` compared → **admits**  
- **Minimized:** `hostile_fixtures/nullifier_field_disagreement.json`  
- **Impact:** presentation/binding field can lie while admission still succeeds.

### F-004 — Documentary / override fixtures non-executable under repaired constructor (MEDIUM)

Post BGEN-REV-004, `tip_height` must match tip header and epoch last-clean. Fixtures that only override tip height (or last-clean height) without recomputing tip hash/header binding yield `CHECKPOINT_MISMATCH` instead of labeled codes. Designer marks several as documentary; however `claim_at_cutoff_boundary` remains in the **valid** list while unconstructible.

### F-005 — Domain tags / `domain_hash` framing underspecified (MEDIUM)

Independent implementers cannot match fixtures from `TECHNICAL_DESIGN.md` alone; length-prefixed `domain_hash` and tag byte strings live only in implementation constants.

### F-006 — Duplicate JSON keys (MEDIUM residual)

Both Node `JSON.parse` and Python `json.loads` last-key-wins. No rejection. Cross-parser risk remains for any future strict parser.

## Hostile coverage

Hostile tests cover: duplicate JSON keys; unexpected properties; nullifier disagreement; commitment_version type traps; NUL/Unicode ids; hex malformations; PQ domain hex; bool integers; missing keys; OP_RETURN carriers; multi commitment outputs; Merkle index/branch extremes; truncated/forged headers; insufficient confirmations with consistent shorter chain; stale/conflicting claimed checkpoints; cutoff boundary and +1; admit→reorg→nullifier rollback; allocation mutations / excess issuance.

Every hostile malformed input produced **typed rejection** or **constructor throw** in the clean-room (no hang, no unclean crash).

## Commands run

```bash
node --test experiments/BENEFICIAL_GENESIS_REPRODUCER_001/tests/*.test.mjs
# → 30/30 pass

node experiments/BENEFICIAL_GENESIS_REPRODUCER_001/verify.mjs
# → report written; 0 crashes; disagreements as above

python3 experiments/BENEFICIAL_GENESIS_DESIGN_001/verify_evidence.py
# → PASS (Designer's own gate; does not exercise F-001..F-003)

# plus lab standard checks (doctor / unittest / nexus verify / git)
```

## Limitations

- Synthetic model only; not Bitcoin consensus, not real PQ.  
- Clean-room PQ verification uses the same public-test-seed map as the design pack (required for synthetic HMAC verify).  
- Some early session tool use touched implementation paths for constant recovery; interpretation documents this contamination.  
- Did not run live network Bitcoin validation.  
- Did not merge or modify Designer files.

## Final gate recommendation

### **REPAIR_AND_RETEST**

**Not** `DESIGNER_GATE_PASS`: the Designer evidence gate passes while the reference still **crashes** on malformed PQ domain bytes and **false-accepts** coerced `commitment_version` and disagreeing `nullifier_hex`.

**Not** pure `BLOCK` on design architecture: core commitment/nullifier/Merkle/allocation mechanics reproduce and executable adversarial coverage is largely coherent after constructor repairs.

### Required repairs before independent gate pass

1. Catch malformed `pq_sig_domain_bytes` → `PQ_DOMAIN_INVALID` (never raise).  
2. Require `commitment_version` to be a JSON integer in range (reject bool/str).  
3. If `nullifier_hex` is present on the claim, require equality with the computed nullifier.  
4. Publish domain tags + `domain_hash` framing in `TECHNICAL_DESIGN.md` or schemas.  
5. Fix or reclassify `claim_at_cutoff_boundary` so valid fixtures are constructible under tip/last-clean binding; regenerate documentary cases as fully executable trusted-context mutations where possible.

After repairs: re-run Designer tests + evidence gate + this clean-room suite against the new subject commit.
