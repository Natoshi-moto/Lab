# Implementation gates

**status_authority:** `NONE`

These are **proposed gates, not proof.** Clearing all twelve does not make a
live economy safe, legal, or harmless — it means the specific reviews below
were performed and recorded. No future implementation should treat gate
completion as a substitute for the ongoing monitoring and willingness to
halt that `THREAT_MODEL.md` §2 requires continuously, after launch as much
as before it.

Before any live internal economy in scope of this framework:

1. **Canonical invariant approval** — an operator-authorized merge of the
   invariants this proposal (or its successor) declares, recorded per
   `operations/merge_authorizations/README.md`, not merely a passing
   validator run on a draft manifest.
2. **Specialist economics or game-economy review** — independent review of
   the specific manifest's incentive structure, scarcity design, and
   farming/hoarding surface (see `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`).
3. **Consumer-harm review** — independent review of
   `USER_HARM_AND_POWER_MODEL.md` Part 1 as applied to the specific design,
   with particular attention to the rows this document marked unresolved.
4. **Security review** — of the actual implementation against its manifest;
   confirms the code does not implement a `PROHIBITED_CAPABILITIES.md` entry
   the manifest declares absent.
5. **Rights and licensing review** — of any creator-produced or
   authorship-bound material the system will hold or display.
6. **Minor and vulnerable-user review** — specifically addressing the
   unresolved age-verification and vulnerable-user questions in
   `USER_HARM_AND_POWER_MODEL.md`.
7. **Secondary-market simulation** — a bounded, synthetic test of the
   threat catalog in `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md` against the
   actual design, analogous in spirit to this Lab's existing Beneficial
   Genesis economic red-team/retest pattern
   (`experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/`,
   `BENEFICIAL_GENESIS_ECON_RETEST_003/`).
8. **Abuse testing** — adversarial attempts to trigger each threat in the
   catalog against a non-production instance.
9. **Closed-world failure drills** — deliberately induce each halt condition
   in `HALT_AND_ESCALATION_RULES.md` in a non-production environment and
   confirm the response ladder actually fires with a receipt.
10. **Halt and recovery drill** — exercise `HALT_ECONOMY` and confirm the
    system can actually stop, and that a due-process-compliant unwind or
    resumption is possible.
11. **Plain-English operator card** — a short, non-technical explanation of
    what the live system does, what powers the operator holds over it, and
    what happens in a halt, written so a non-coder operator (this Lab's own
    operator, per `WHY_NOT_TO_TRUST_THIS_PROJECT.md` §A, is exactly this
    audience) can understand it before authorizing launch — mirroring this
    Lab's own standing rule that irreversible/outward-facing actions get a
    plain-language explanation first.
12. **External legal review before real users** — jurisdiction-aware legal
    review specifically covering gambling law (if any chance mechanic
    survives gate 6), securities/money-transmitter classification risk, and
    consumer-protection law, before the system is exposed to real, non-test
    users.

## Gate ordering

Gates 1–3 are prerequisites for any further design work proceeding past a
paper proposal. Gates 4–10 apply to a specific implementation and must be
repeated (at least in reduced form) for any material redesign. Gates 11–12
are the final pre-launch checkpoint and must be the last gates cleared, not
performed in parallel with earlier gates as a formality.

## What clearing all twelve does not mean

It does not mean the system is bug-free, unhackable, legally compliant in
every jurisdiction, incapable of harming a user, or guaranteed to stay
closed after launch. See `CLAIMS_AND_NONCLAIMS.md`.
