# TSK-FS-000 — Promote, park, or open PR (operator decision)

**status_authority:** NONE  
**Claims:** CLAIM-GEN-001, TENSION-001  
**Assignee:** human operator (AI may only prepare options)  
**Done when:** one written decision recorded in SESSION_LOG.md

## Context

Pack `FULL_SPECTRUM_VISION_001` is a complete proposal. Lab STATUS may still forbid real-world token language.

## Options

| Choice | Meaning |
|--------|---------|
| **PARK** | Leave on branch; no PR; doctrine frozen for later |
| **DRAFT_PR** | Push branch + open draft PR using `PR_BODY.md` (merge still human) |
| **MERGE_PROPOSAL** | Merge to main as **proposal docs only** — does not launch NEX or clear reds |
| **COMMISSION** | Pick next TSK-FS-01x implementation task after park/merge |

## AI must not

- Merge without explicit operator words  
- Edit STATUS.json to clear token reds as part of this task  

## Output

SESSION_LOG entry: decision + date + who.
