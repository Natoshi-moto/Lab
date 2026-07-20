# Audit report — TSK-BENEFICIAL-GENESIS-DIFF-RETEST-002

## Authority

`status_authority: NONE`  
Does not promote, merge, assign R-rounds, alter `STATUS.json`, or modify subject branches.

## Subject binding

| Item | Value |
|------|--------|
| Repository | Natoshi-moto/Lab |
| Codex repair PR | #30 |
| Exact subject commit | `46a7de63fd800029a05793d7d8204a900690f68e` |
| Subject branch | `codex/beneficial-genesis-diff-repair-002` |
| Retest branch | `grok/beneficial-genesis-diff-retest-002` |
| Staleness check | PR #30 head still equals exact subject commit at capture |

## Seat identity

| Field | Value |
|-------|--------|
| Provider / model | xAI Grok interactive CLI (grok-4.5 class) |
| Tools | shell, git, gh, Node v24.14.0, Python 3.14.6 |
| Network | available |
| Launch UTC | 2026-07-20T19:26:38Z |
| Prior Beneficial Genesis session state | none (fresh session; not a resume of PR #29) |

## Method

1. Read issue #31 and controlling issue/PR summaries (#26, #28, #27, #29, #30).  
2. **Clean-room phase:** reconstruct verifier from design docs, schemas, fixtures only. Hash-inventoried forbidden `protocol/**`, `tests/**`, generators.  
3. Wrote `CLEANROOM_INTERPRETATION.md` and hash-bound `results/CLEANROOM_FREEZE.json`.  
4. **Post-freeze phase:** recovered public test seeds and confirmed source-auth HMAC framing from subject `crypto_synth.py` solely to complete differential execution and explain residuals.  
5. Ran independent Node suite + fixture matrix; ran subject Python evidence gate; ran repo doctor/unittests/verify.

## What was reconstructed

- Duplicate-key rejecting raw JSON parser  
- Exact consensus-object key sets  
- Normative domain bytes / `domain_hash` framing  
- Charity-set commitment, donation commitment, nullifier, synthetic txid, Merkle, header hashes  
- Distinct accepted tip, last-eligible inclusion checkpoint, optional quantum cutoff  
- Open admission vs closed historical path  
- Commitment carrier multiplicity  
- Provisional claim revalidation / atomic nullifier rebuild  
- Closed-epoch fixed-pool allocation record validation  

## Fixture compatibility

See `experiments/BENEFICIAL_GENESIS_RETEST_002/results/FIXTURE_COMPATIBILITY_REPORT.json`.

- **Agreements:** 43  
- **Disagreements:** 0  
- **Crashes:** 0  
- Seeds loaded post-freeze: yes  

## Breaker findings retest (original F-001…F-006)

| ID | Subject status |
|----|----------------|
| F-001 pq_sig_domain_bytes crash | **REPAIRED** → `UNKNOWN_FIELD`, no crash |
| F-002 commitment_version coercion | **REPAIRED** → `COMMITMENT_VERSION_INVALID` |
| F-003 nullifier_hex ignored | **REPAIRED** → required + recomputed equality |
| F-004 tip/cutoff conflation | **REPAIRED** (D-005 epoch fields) |
| F-005 incomplete normative encoding | **MOSTLY REPAIRED**; domains/framing published |
| F-006 parser / unknown keys | **REPAIRED** duplicate-key loader + exact keys |

No new repair blockers found against the subject.

## Residual (non-blocking)

1. `PUBLIC_TEST_SEEDS` remain only in `protocol/crypto_synth.py` (public test data). Independent verifiers still need that map for synthetic HMAC verify. Recommend publishing into `schemas/protocol_constants.json` in a future polish pass—not a gate blocker for this repair retest.  
2. Synthetic cryptography and Bitcoin-model non-claims unchanged (expected).

## Commands and results

| Command | Result |
|---------|--------|
| `node --test experiments/BENEFICIAL_GENESIS_RETEST_002/tests/*.test.mjs` | 19 pass, 0 fail |
| `node experiments/BENEFICIAL_GENESIS_RETEST_002/verify.mjs` | 43 agreements, 0 disagreements, 0 crashes |
| `python3 experiments/BENEFICIAL_GENESIS_DESIGN_001/verify_evidence.py` | PASS (34 executable invalid, 1 documentary, 37 unittests) |
| `git diff --check` | clean |
| `./nexus doctor` | PASS (`WORKTREE_DIRTY` warning while uncommitted) |
| `python3 -m unittest discover -s tests -v` | 185 OK (after `npm ci` for env) |
| `./nexus verify` | PASS (after `npm ci`) |
| `git status --short` | only authorized retest paths (pre-commit) |

### Environmental note

Initial `./nexus verify` / root unittest failure was missing `node_modules/@noble/ed25519` (R013 dependency). Resolved with `npm ci`. **Environmental**, not a subject defect.

## Independence qualification

Clean-room encodings (commitments, nullifiers, txids, headers, Merkle, charity-set, PQ message framing) were fixture-proven without reading forbidden implementation.  
**Post-freeze only:** public test seed hex values and source-auth MAC framing (`domain_hash(..., b"pk", seed)` and `HMAC(seed, DOMAIN\|\|0x00\|\|txid\|\|sighash)`) were confirmed from subject `crypto_synth.py` because seeds are not in `protocol_constants.json`.

This is an honest independent retest of the repaired subject, not a contamination-free claim that seeds were reconstructed from normative constants alone.

## Gate recommendation

**`DIFF_RETEST_PASS`**

The Codex repair at `46a7de63fd800029a05793d7d8204a900690f68e` closes the Breaker-confirmed blockers that motivated PR #30. Residual seed-publication polish is optional and does not re-open F-001…F-004.

## Non-claims

No merge authority, no R-round assignment, no status promotion, no production crypto or Bitcoin consensus claims, no legal ownership or charity honesty claims.
