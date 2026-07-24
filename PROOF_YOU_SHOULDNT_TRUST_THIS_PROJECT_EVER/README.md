# PROOF YOU SHOULDN'T TRUST THIS PROJECT — EVER

**Status:** `LOAD-BEARING / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Companion to:** [`../WHY_NOT_TO_TRUST_THIS_PROJECT.md`](../WHY_NOT_TO_TRUST_THIS_PROJECT.md)

---

## What this is

This directory is the **deep evidence vault** for the distrust register.

- `../WHY_NOT_TO_TRUST_THIS_PROJECT.md` is the **short, readable index** — the
  permanent structural reasons + a tight, scannable list of evidenced serious
  universal vulnerabilities. It is deliberately kept short so people **actually
  read it**.
- **This vault is the opposite by design.** It is where the **full, verbatim
  adversarial reports go — no matter how much bloat.** Nothing here is
  summarised, softened, or trimmed for comfort. If the short index says "a thing
  was found," the *whole receipt of finding it* lives here, in the seat's own
  words, forever.

The two are a pair: **the index tells you a wall exists; the vault lets you walk
up and touch it.**

## The rule (do not violate)

1. **Verbatim only.** Reports are copied in bit-for-bit. Every report folder has a
   `PROVENANCE.md` recording the source path, author seat, and `sha256` so anyone
   can prove the vault copy is a faithful copy and was not edited to flatter.
2. **Append-only.** You may **add** reports. You do **not** delete, rewrite, or
   sanitise an existing one. A superseded finding is annotated by adding a *new*
   report, never by editing the old.
3. **Bloat is allowed here, nowhere else.** Length is not a defect in this vault.
   Keep the *index* short; let the *proof* be as long as the truth requires.
4. **Falsified findings stay in.** A report that later got disproven is evidence
   too — it stays, marked, as proof the process kills its own bad claims.
5. **No status promotion.** Presence here promotes nothing. `status_authority:
   NONE`. A confirmed static finding is not a closed vulnerability.

## How it's organised

```
PROOF_YOU_SHOULDNT_TRUST_THIS_PROJECT_EVER/
├── README.md            ← this file (what/why/rules)
├── INDEX.md             ← ledger of every report, newest first
└── reports/
    └── <UTC-DATE>_<TRACK>_<slug>/
        ├── PROVENANCE.md   ← source paths + sha256 + author seats
        └── <verbatim report files…>
```

To add a report: create `reports/<date>_<track>_<slug>/`, copy the verbatim
file(s) in, write `PROVENANCE.md` with `sha256sum` of each, and add **one** row to
`INDEX.md` (top) and **one** short line to the index file
`../WHY_NOT_TO_TRUST_THIS_PROJECT.md` under "Evidenced serious universal
vulnerabilities."

## Why this exists

Anonymous, non-coder-directed, AI-built projects can gaslight themselves into
looking trustworthy through pretty demos and multi-seat agreement. This vault is
the antidote: **the raw adversarial record, unedited, hash-anchored, and loud.**
If the project is ever tempted to believe its own marketing, this is the drawer
you open to remember why you shouldn't.

**`status_authority: NONE` — permanently.**
