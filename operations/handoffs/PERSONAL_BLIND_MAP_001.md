# Personal blind map (operator sanity — not project promotion)

**status_authority:** `NONE`  
**Purpose:** Fresh seat re-maps *current main* so the human can reorient.  
**Not:** emergency re-litigation, product fix, launch cert, or independence claim.

## Rules

- Read only from `main` after `git pull`.  
- Do not open `corpus/local-only/SEALED_*` unless operator says unseal already done and they want it (default: skip).  
- No product code changes. No long operator-verbatim theater.  
- Prefer tables: what is true, what is red, what is next.

## Read order (short)

1. `NEXT_ACTION.md`, `STATUS.json`  
2. `operations/handoffs/EMERGENCY_TRUTH_AUDIT_001_AGGREGATE.md`  
3. `operations/receipts/BREAK_SESSION_20260722/` (receipts list + CARD-04, CARD-11)  
4. `operations/break-prep/ORCH_001_BREAK_RUNBOOK.md` (skim)  
5. `WHY_NOT_TO_TRUST_THIS_PROJECT.md` (skim)  

## Output

`operations/handoffs/PERSONAL_BLIND_MAP_001_RESPONSE.<seat>.md`

```markdown
# Personal blind map — <seat>
- MAIN_SHA, DATE_UTC, status_authority: NONE
## 1) Where the project is (10 bullets max)
## 2) What is red / open (table)
## 3) What is already done (table)
## 4) Sane next single tasks (max 5, ranked)
## 5) What I did not verify
## 6) Non-claims
```

## Paste packet

```text
Personal blind map only for Natoshi-moto/Lab operator reorientation.
status_authority: NONE. Not a security cert. No fixes. No independence claim.
Read operations/handoffs/PERSONAL_BLIND_MAP_001.md and follow it.
git fetch && checkout main && pull. Record SHA.
Write PERSONAL_BLIND_MAP_001_RESPONSE.<your_seat>.md, PR optional, do not merge unless asked.
Main only. Skip sealed local-only by default.
```
