# OPERATOR_DECLARATIONS.md — dated, numbered, on the record

Statements by the human operator that bind interpretation across all seats.
Append-only. Seats cite these by ID. Only the operator may add or amend
(amendments are new declarations, never edits).

---

## D-001 — What "canonical" means here (2026-07-22)

> **Canonical = "it is what it is." Identity, not endorsement.**

When something is declared canonical, the operator means exactly and only:
*these are the bytes, at this time, and we all point at the same ones.*

- Canonical does **not** mean it works.
- Canonical does **not** mean it is good, safe, finished, or correct.
- Canonical broken code is still canonical — it is *the* broken code,
  as opposed to five maybe-broken copies.

Note for the record: this matches the Lab repo's own `CANONICAL_AS_IS`
definition ("identifies exact bytes at a specific time; no claims about
correctness, security, or readiness"). The operator was not confused about
the concept — only briefly about whether declaring canonical implied
blessing. It does not. Adjudicating WHICH version becomes canonical is a
quality judgment; the canonical STATUS itself carries none.

## D-002 — MFT value doctrine (2026-07-22, stated live on record)

> "The value proposition is it MFTs — Moot Fun Tokens. They're literally
> nothing, but they are social lubricant. This is load-bearing and I'm
> stating it now. They are the animated creatures that people collect
> and trade. And battle, and breed."

Binding interpretation for all seats:

1. **MFT = Moot Fun Token = the animated creature itself.** The collectible,
   tradeable object of the synthetic economy — which people also **battle**
   (deterministic commit-reveal combat, `battle-engine.js`) and **breed**
   (lineage and inheritance, `breed-engine.js`, imprint-consumes-slot
   semantics already RUNTIME-ATTESTED at 61/61 tests). Not a currency, not a
   claim on anything, not redeemable for anything.
2. **"Literally nothing" is the design, not a disclaimer.** MFTs carry zero
   economic value *by construction and by intent*. Their entire function is
   social: play, status, gift, rivalry, lineage, conversation.
3. **"Load-bearing" means:** the project's legitimacy rests on this staying
   true. Any change that gives MFTs real-world economic value is not a pivot —
   it is the failure condition of the project.
4. **Open research question (seats must treat as unresolved, not solved):**
   scarcity + transferability historically produces emergent secondary
   markets even for objects designed as "nothing" (game skins, hats, cards).
   Engineering MFTs to *stay* nothing under adoption pressure is the central
   unsolved problem — this is what the BGEN econ red-team's residual risks
   (stolen-fund pathway, Sybil-exploitable allocation) are about. No seat may
   claim this is solved without RUNTIME-ATTESTED mechanism evidence.
