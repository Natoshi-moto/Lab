# User disclosures (verbatim)

**status_authority:** `NONE`  
**Authority class:** **Human operator ring-0 only** for new entries.

## Purpose

A durable place for **verbatim disclosures from the human operator** — words they want preserved even if a chat dies, a PC crashes, or a screen recording is lost mid-session.

AI seats may:

- **read** this folder  
- **index / link** disclosures when relevant  
- **never invent** operator speech here  
- **never “improve” or paraphrase** a disclosure file into a “cleaner” replacement (append a seat note elsewhere if needed)

## Layout

```text
user-disclosures/
  README.md
  INDEX.md                 — newest first
  TODO_URGENT.md           — live operator/seat todos that must not evaporate
  templates/DISCLOSURE.md
  entries/                 — one file per disclosure (append-only)
```

## How the operator files

1. Copy `templates/DISCLOSURE.md` → `entries/<UTC-DATE>_<slug>.md`
2. Paste **verbatim** (or as close as the medium allows); mark any redaction explicitly
3. Add a row at the **top** of `INDEX.md`
4. Commit when able

## How AI seats treat this

- Operator text here outranks seat paraphrase of “what the user meant.”  
- Does **not** replace `STATUS.json` / `NEXT_ACTION.md`.  
- Does **not** authorize money, tokens, or product ship.  
- Secrets still must not land here (same as rest of public repo).

## Non-claims

Filing a disclosure is not a security certificate, not legal advice, and not multi-party attestation.
