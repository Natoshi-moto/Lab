# Communications

**status_authority:** `NONE`  
**Purpose:** Outward-facing and durable human-readable materials that are *not* the control plane, *not* experiment evidence, and *not* product marketing as trust.

## What belongs here

| Kind | Examples | Path habit |
|------|----------|------------|
| **Statements** | Readiness declarations, public posture, press notes | `statements/` |
| **Publications** | **Mandatory** end-of-round seat reports (what / why / verified); cumulative evolution log | [`publications/`](publications/README.md) |
| **Tutorials** | How to enter the lab, how to run doctor/verify, how to file a return | `tutorials/` |
| **Docs for humans** | Plain-language explainers that may later leave the repo | `docs/` |
| **Press / external** | Drafts for journalists, partners, public posts | `press/` |
| **Templates** | Empty shapes for future comms | `templates/` |

### Publications (all AI seats)

At the end of every real work round, every AI files a report per  
[`Agent Resources/Tools/Skills/essential/round-close-publication.md`](../Agent%20Resources/Tools/Skills/essential/round-close-publication.md)  
into `publications/rounds/` and updates `publications/INDEX.md`.  
This is **not** STATUS authority and cannot soft-close reds.

## What does **not** belong here

- Secrets, credentials, unredacted private identity  
- Live keys, wallet seeds, or anything that implies **real-world economic value**  
- Soft-closing of security reds (T-01, CARD-11, etc.) by eloquence  
- Claims that multi-AI agreement is independent science  
- Replacement of `STATUS.json` / `NEXT_ACTION.md` as operator authority  

## Authority order (when in conflict)

1. Constitution + `STATUS.json` / `NEXT_ACTION.md`  
2. Load-bearing distrust: `WHY_NOT_TO_TRUST_THIS_PROJECT.md`  
3. Evidence receipts under `operations/receipts/`  
4. **This folder** — communication, not promotion of status  

A polished statement here **cannot** outrank a red on main.

## First statement

[`statements/2026-07-22_READY_FOR_SERIOUS_RESEARCH.md`](statements/2026-07-22_READY_FOR_SERIOUS_RESEARCH.md)

## Non-claims for the folder itself

Creating a communications tree is not a product launch, not a token, not a security certificate, and not a waiver of permanent distrust reasons.
