# Seat-routing event log — Fable 5 safeguard flag, Opus switch, Grok turn cancel

**status_authority:** `NONE`  
**Research only**  
**Date (operator day):** 2026-07-22  
**Filed by:** Grok (xAI) drive seat, after operator instruction to log  
**Does not:** lift emergency stop, change threat findings, promote rounds, or claim product safety  

---

## Why this file exists

The operator ordered that this event be logged **in the Lab corpus** (not only in a chat), **clearly**, and in **every place it is pertinent**. A prior Grok turn that was writing this log was **canceled mid-turn**; this file completes that obligation.

---

## Event A — Fable 5 safeguard flag → switched to Opus 4.8

### Operator-reported product banner (verbatim)

> Fable 5's safeguards flagged this message. The safeguards are intentionally broad right now and may flag safe and routine coding, cybersecurity, or biology work. These measures let us bring you Mythos-level capabilities sooner, and we're working to refine them. Switched to Opus 4.8. Send feedback with /feedback or learn more

### Plain English

- The operator was trying to hand work to **Fable 5**.  
- The product **refused/flagged** the message under **broad safeguards**.  
- The product message itself admits flags may hit **safe and routine** coding / **cybersecurity** work.  
- The session was **automatically switched to Opus 4.8**.  
- Lab break/security research (synthetic host probing, threat cards) is exactly the kind of work this banner says may be false-flagged.

### Provenance implications (must not be washed)

| Field | Value |
|--------|--------|
| Intended seat product | Fable 5 |
| Actual seat after switch | Opus 4.8 |
| Model-family note | Treat **intended vs actual** as different routing facts; do **not** silently label later Opus work as “Fable 5 output.” If both map to the same provider family, they are **not** independent corroboration of each other. |
| Independence | A safeguard-forced switch is **not** an operator-chosen second auditor. |
| Relation to Lab work | Context was Lab BREAK / security-honesty work (synthetic, own app). Not third-party attack instructions. |

### What this is **not**

- Not proof that the Lab content is criminal or out of scope  
- Not a finding that T-IDs closed or reopened  
- Not permission to skip emergency stop or truth-audit rules on `main`  

---

## Event B — Grok logging turn canceled

### What happened

1. Operator first asked to log Event A “not just with the full verbatim conversation here but also clearly wherever pertinent.”  
2. Grok began a logging turn (branch/status check toward writing receipts).  
3. That turn was **interrupted / canceled** before the durable Lab files landed.  
4. Operator then said: **“Make sure to log it the turn got canceled.”**  

### What must be true after this receipt

- Event A is on record in-repo.  
- Event B (the cancel) is on record so seats do not invent a silent successful log from the canceled turn.  
- Any “we already logged the Fable switch” claim from the canceled turn alone is **false** until this (or an equivalent) file is on `main`.

### Label

`EXECUTED` for this filing turn (this document’s creation).  
`SOURCE_TRACED` for the Fable banner text (operator paste; product UI not re-captured by Grok as a screenshot).

---

## Where else this must be visible (pointers)

Same event is pointed from:

1. `operations/receipts/BREAK_SESSION_20260722/SEAT_ROUTING_NOTE.md`  
2. `operations/handoffs/BREAK_SESSION_2_HANDOFF.md` (§ seat substitution)  
3. `operations/handoffs/EMERGENCY_STOP_AND_AUDIT_001.md` (related-events append) if present  
4. GitHub issue #63 comment (when network allows at file time)  

If a pointer file is missing on an older checkout, **this receipt remains the canonical record**.

---

## Operator bus (one line)

```text
FABLE5_SAFEGUARD_FLAGGED → SWITCHED_TO_OPUS_4_8; GROK_LOG_TURN_CANCELED_ONCE; THIS_RECEIPT_COMPLETES_LOG; status_authority NONE
```

---

## Non-claims

- Does not evaluate whether Fable’s safeguard policy is correct.  
- Does not claim Opus 4.8 completed or failed any Lab task.  
- Does not unseal `corpus/local-only/` material.  
- Does not lift `EMERGENCY STOP`.  
