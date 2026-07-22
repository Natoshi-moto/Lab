# Semantic Routing Bridge v0

**ID:** `SRB-001`  
**Date (UTC):** 2026-07-22  
**status_authority:** `NONE`  
**Purpose:** Fill the void between multi-seat chatter, RAM, STATUS, route packs, publications, and strangers — by routing **meaning classes**, not only paths.

---

## Problem

The Lab already has:

- physical routes (`operations/routes/`)  
- scoreboard (`STATUS.json`)  
- working memory (`RAM/`)  
- publications + epistemic analyses  
- operator verbatim (`user-disclosures/`)

What it lacks is a **shared type system for claims** as they hop seats. Without it:

- Inference is read as fact  
- Seat agreement is read as independence  
- FAIL receipts do not auto-bind to next work  
- Website/marketing copy invents authority  

---

## Typed envelope (every cross-seat packet)

```json
{
  "schema": "nexus.semantic-envelope/v0",
  "envelope_id": "ENV-…",
  "utc": "ISO-8601",
  "from_seat": "grok|claude|codex|operator|…",
  "to": "seat:…|bus|status|public",
  "semantic_class": "OBSERVED|INFERENCE|OPERATOR_VERBATIM|PROPOSAL|RECEIPT|ALERT|HANDOFF",
  "authority_class": "NONE|OPERATOR_RING0|SCOREBOARD|RECEIPT_ONLY",
  "subject_paths": ["…"],
  "claims": [{ "text": "…", "falsifier": "command or file:line or UNABLE_TO_VERIFY" }],
  "non_claims": ["…"],
  "status_authority": "NONE"
}
```

### Class rules

| Class | May do | Must not |
|-------|--------|----------|
| `OBSERVED` | Cite command output, SHAs, API | Mind-read seats/operator |
| `INFERENCE` | Score epistemic performance | Imply proof |
| `OPERATOR_VERBATIM` | Quote only from `user-disclosures/` or explicit paste | Paraphrase into policy |
| `PROPOSAL` | Suggest work | Self-merge authority |
| `RECEIPT` | Bind evidence | Clear reds by prose |
| `ALERT` | Stop line / conflict | Soft-close product |

---

## Bridge topology

```text
                    ┌─────────────────────┐
                    │  OPERATOR_VERBATIM  │
                    │  user-disclosures/  │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────▼─────────────────────┐
         │              SEMANTIC ROUTER               │
         │  (convention + optional future CLI)        │
         └─┬─────────┬──────────┬──────────┬─────────┘
           │         │          │          │
     ┌─────▼───┐ ┌───▼───┐ ┌────▼────┐ ┌───▼────┐
     │  RAM    │ │STATUS │ │ Routes  │ │ Public │
     │  bus    │ │NEXT   │ │ packs   │ │ site   │
     └─────────┘ └───────┘ └─────────┘ └────────┘
           │                        │
     seats read/write         read-only projector
```

**Rule:** Public site and publications **project** envelopes; they never upgrade `INFERENCE` → fact.

---

## v0 implementation (no new runtime required)

1. **RAM bus messages** include `semantic_class` + `falsifier` lines (PROTOCOL update).  
2. **Epistemic skill** forces INFERENCE labeling.  
3. **Round-close publication** links one epistemic file.  
4. **Website** (see tech spec) renders envelopes from git, color-coded by class.  
5. Later optional: `./nexus envelope-check` validates JSON envelopes in `RAM/bus/messages/*.json`.

---

## Success metrics

| Metric | Pass |
|--------|------|
| Seat handoff without lost class | Receiver can state class of each claim |
| Stranger audit | Can list what is OBSERVED vs INFERENCE from site |
| Emergency replay | Wrong fear-object class detectable as INFERENCE overclaim |

---

## Non-claims

- Not multi-party crypto routing  
- Not proof of model independence  
- Not a product security control for T-01  
- `status_authority: NONE`
