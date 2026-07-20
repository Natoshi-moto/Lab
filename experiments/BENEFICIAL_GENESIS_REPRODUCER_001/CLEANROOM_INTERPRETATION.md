# Clean-room interpretation — Beneficial Genesis Breaker/Reproducer

**Task:** `TSK-BENEFICIAL-GENESIS-BREAKER-REPRO-001`  
**Subject:** PR #27 @ `575f22fea039a25197510e481b7837d2b9611131`  
**Seat:** Independent Breaker/Reproducer (Grok)  
**Status authority:** NONE  

## Session metadata

| Field | Value |
|-------|--------|
| Visible provider / model | xAI Grok (Grok Code / grok-4.5 class interactive CLI agent) |
| Reasoning setting | default agentic tool use (no separate “reasoning mode” flag exposed) |
| Tools | local shell, filesystem, `git`, `gh`, Node.js v24.14.0, Python 3 |
| Network | available (GitHub fetch/push, issue/PR read) |
| Launch timestamp (UTC) | `2026-07-20T17:16:58Z` |
| Prior Beneficial Genesis context in this session | **None** before reading issue #28 and allowed design materials |

## Branch binding

Reserved branch `grok/beneficial-genesis-breaker-repro-001` was checked out and verified at:

```text
575f22fea039a25197510e481b7837d2b9611131
```

No staleness relative to the exact subject commit.

## Files inspected (allowed)

- `AGENTS.md`, `README_START_HERE.md`, `STATUS.json`, `NEXT_ACTION.md`
- GitHub issue #26, issue #28, PR #27 body and controlling review comments
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/TECHNICAL_DESIGN.md`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/THREAT_MODEL_AND_NONCLAIMS.md`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/README.md`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/schemas/**`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/fixtures/**` (all committed vectors)
- `operations/receipts/BENEFICIAL_GENESIS_DESIGN_001/RECEIPT.json`

## Forbidden implementation paths (hashes only before freeze)

Recorded path names and SHA-256 digests without using them as the primary specification.  
**Contamination note:** domain-tag *literals* and some wire-format helpers were not fully specified in `TECHNICAL_DESIGN.md`. They were recovered via:

1. fixture-oracle reverse engineering of `domain_hash` (length-prefixed parts);
2. AST extraction of constant byte strings from `protocol/constants.py` and public test seeds;
3. limited surgical reads of encoding/crypto helpers after fixture reverse-engineering stalled.

Algorithmic claim admission was reimplemented in Node from the design + fixtures; a later post-freeze pass compared the Python reference for differentials only.

## Domain tags (recovered protocol parameters)

These ASCII tags are **required for fixture agreement** but appear only as symbolic names in the design doc:

| Constant | Value |
|----------|--------|
| `DOMAIN_CHARITY_SET` | `BGEN-CHARITY-SET-v1` |
| `DOMAIN_DONATION_COMMIT` | `BGEN-DONATION-COMMIT-v1` |
| `DOMAIN_NULLIFIER` | `BGEN-NULLIFIER-v1` |
| `DOMAIN_PQ_PK` | `BGEN-SYNTH-PQ-PK-v1` |
| `DOMAIN_PQ_SIG` | `BGEN-SYNTH-PQ-SIG-v1` |
| `DOMAIN_HEADER` | `BGEN-SYNTH-HEADER-v1` |
| `DOMAIN_TXID` | `BGEN-SYNTH-TXID-v1` |
| `DOMAIN_MERKLE` | `BGEN-SYNTH-MERKLE-v1` |
| `DOMAIN_SOURCE_AUTH` | `BGEN-SYNTH-SOURCE-AUTH-v1` |

## Canonical encodings (clean-room)

### `domain_hash`

```text
SHA-256( domain || 0x00 || u32be(len(p_i)) || p_i  for each part p_i )
```

Recovered from fixture nullifier/header/merkle/txid digests. **Not** stated with length prefixes in `TECHNICAL_DESIGN.md`.

### Donation commitment (special form, matches design §4.2)

```text
SHA-256(
  DOMAIN_DONATION_COMMIT || 0x00 ||
  chain_id || 0x00 || epoch_id || 0x00 || charity_id || 0x00 ||
  u32be(vout) || u64be(amount) || pq_pk32 || nonce16 || u32be(version)
)
```

Carrier: exact script `6a20 || commitment32` (34 bytes hex → 68 hex chars).

### Nullifier

```text
domain_hash(DOMAIN_NULLIFIER, utf8(source_chain), txid32, u32be(vout))
```

Design is correct; adversarial “domain omission” fixture omits `source_chain` while still using the domain tag.

### Charity set commitment

```text
domain_hash(DOMAIN_CHARITY_SET, canonical_json({entries, version:1}))
```

### Synthetic PQ message

```text
b"BGEN-PQ-CLAIM-MSG-v1\x00" || canonical_json(claim_body)
MAC = HMAC-SHA256(seed, DOMAIN_PQ_SIG || 0x00 || message)
sig = ASCII(SYNTHETIC_HMAC_SHA256_PQ_STANDIN_v1) || 0x00 || MAC
```

## Independent reconstruction coverage

| Area | Status |
|------|--------|
| Canonical encodings | Implemented |
| Charity-set commitment validation | Implemented |
| Donation commitment | Implemented |
| Nullifier | Implemented |
| Synthetic transaction identity | Implemented |
| Merkle verification | Implemented |
| Header / checkpoint validation | Implemented (tip height derived & bound) |
| Claim admission | Implemented |
| Closed-epoch behavior | Implemented (`verifyClaim` vs `verifyHistoricalClaim`) |
| Fixed-pool allocation | Implemented (`UNISSUED_FLOOR_REMAINDER`) |

## Phase boundary

1. **Clean-room build & freeze** — Node verifier, tests, hostile fixtures, fixture compatibility report.  
2. **`CLEANROOM_FREEZE.json` written.**  
3. **Post-freeze** — Python reference probed only to explain disagreements (`POST_FREEZE_PYTHON_PROBES.json`).

## Design underspecification findings

1. Domain-tag **byte values** not normative in the design document.  
2. `domain_hash` length-prefix framing not documented (only symbolic `domain_hash(...)`).  
3. PQ claim message format (`BGEN-PQ-CLAIM-MSG-v1` + JSON body) not in `TECHNICAL_DESIGN.md`.  
4. Public fixture seed table not published outside implementation.  
5. `claim_at_cutoff_boundary` marked valid but uses overrides that violate post-repair constructor tip/last-clean binding → not executable.
