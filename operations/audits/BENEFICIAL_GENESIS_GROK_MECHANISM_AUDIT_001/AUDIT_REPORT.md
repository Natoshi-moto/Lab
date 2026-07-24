# Sanitized audit report — BGEN-GROK-MECHANISM-AUDIT-001

| Field | Value |
|-------|--------|
| Audit ID | BGEN-GROK-MECHANISM-AUDIT-001 |
| Seat | Grok Mechanism (independent) |
| Repository | Natoshi-moto/Lab |
| Frozen subject | `8349de7a5978be6a9984aa33fd59ba3725ebaaca` |
| Working branch | `grok/bgen-mechanism-audit-001` |
| Status authority | NONE |
| Blinding breach | false |
| Subject drift | false |

## Binding checks (executed)

| Check | Result |
|-------|--------|
| `git rev-parse HEAD` at start | `8349de7a5978be6a9984aa33fd59ba3725ebaaca` |
| Branch | `grok/bgen-mechanism-audit-001` |
| `git status --short` | empty |
| Runtime | Linux fedora, Python 3.14.6, git, gh |
| Network | GitHub public repo reachable; gh authenticated |
| STATUS.json | observed only; current_round R016; not modified |

## Pre-freeze sources inspected

- Repository safety: `AGENTS.md` (and CLAUDE.md safety boundary)
- `STATUS.json`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/**` (README, TECHNICAL_DESIGN, THREAT_MODEL, allocation.py, constants.py)
- GitHub issue #33 (exact)
- GitHub issue #34 (exact)
- Controlling pasted contract

## Freeze

- Path: `experiments/BENEFICIAL_GENESIS_GROK_MECHANISM_AUDIT_001/PRE_AUDIT_FREEZE.json`
- Commit: `895f8b54d68349e470ebf853ab841de45c5a8269` (own commit before economics inspection)

## Post-freeze (authorized)

- Economics redteam / breaker / retest packages (partial differential)
- PR #35, #37, #39 metadata only as needed for subject lineage
- **Not** PR #40/#42/#43 or sibling 2×2 audit materials

## Independent work

- New models under `experiments/BENEFICIAL_GENESIS_GROK_MECHANISM_AUDIT_001/model/`
- No import of subject economics modules
- Commands:

```text
python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_GROK_MECHANISM_AUDIT_001/tests -v
# exit 0, 5 tests OK

python3 experiments/BENEFICIAL_GENESIS_GROK_MECHANISM_AUDIT_001/model/run_probes.py
# exit 0, ALL_PROBES_OK
```

## Strongest confirmed mechanism claims

1. Supply conservation of floor pro-rata + unissued remainder  
2. Linear split non-increase of splitter allocation  
3. Concave and capped rules Sybil-broken without identity  
4. Transferability not necessary for charity+migration receipt functions (F1–F4)  
5. Whale concentration is definitional under pro-rata  
6. Rebate/tainted severity is parameter-conditional; pathways are residual  

## Strongest defects / unresolved

1. Transferability necessity for expanded ledger functions unspecified  
2. Identity-free anti-concentration is a dead end  
3. Fixed pool / floating ratio participation game  
4. Out-of-protocol rebate and legal-title gaps  
5. Empirical \(\alpha\), \(v\), displacement magnitudes unknown  

## Exact verdicts

| Category | Value |
|----------|--------|
| UNDERLYING_MECHANISM | CONTINUE_WITH_CONDITIONS |
| TRANSFERABILITY_NECESSITY | NOT_DEMONSTRATED |
| EVIDENCE_STATE | SUFFICIENT_FOR_BOUNDED_DECISION |
| REAL_WORLD_READINESS | RESEARCH_ONLY |

## Highest-value next step

`BGEN-PRODUCT-FUNCTION-AND-TRANSFER-REGIME-LOCK-001` — bind v1 function matrix and default transfer regime.

## Non-claims

No legal conclusions; no live funds; no STATUS change; no R-round; no mainnet readiness; freeze ≠ perfect independence.
