# RELAY_PROTOCOL.md — multi-provider relay, tribunal audits, credit-death handoffs

Three abilities, provider-agnostic. The human is the bus (copy-paste between
chat windows) and the only authority.

---

## 1. The relay bus (copy-paste envelopes)

Every message shuttled between seats uses this envelope — short enough to paste,
strict enough to audit:

```
=== RELAY | BATON B-### | SEAT <model name> | TURN <n> ===
BASELINE: <git SHA or freeze sha256 you worked from>
DID: <what you actually did this turn, 1-5 bullets, each tagged
     RUNTIME-ATTESTED / SOURCE-VERIFIED / UNABLE_TO_VERIFY>
CLAIM: <the one thing you assert is now true>
CHECK-REQUEST: <specific verification another seat must perform on your work>
NEXT: <the single next action, and which seat should take it>
=== END RELAY ===
```

**Rules of the bus**
- A seat may not verify its own CHECK-REQUEST. Every claim is checked by a
  *different provider* before it enters TO_DO_LIST's DONE log.
- Disagreement is recorded verbatim in `RELAY_LOG.md`, never smoothed over.
  Two seats agreeing from the same provider counts as ONE opinion.
- If a seat's reply doesn't parse as an envelope, the human pastes it back with
  "RESEND AS ENVELOPE." No exceptions — sloppy messages are how drift starts.
- The human may inject `OPERATOR:` lines anywhere. Operator lines outrank seats.

## 2. Credit-death handoff (the baton)

- Every seat keeps `HANDOFF/HANDOFF_CURRENT.md` (template in `templates/HANDOFF.md`)
  updated **as it works** — not at the end. Credits die without warning;
  the baton must always be ≤5 minutes stale.
- On any stop (credits, context, block): finalize the baton, archive a copy to
  `HANDOFF_LOG/B-###_<date>_<seat>.md`. The next seat — any provider — resumes
  from the baton, **re-verifies the baton's STATE claims before building on
  them**, and opens B-###+1.
- **Mistakes are committed as mistakes.** If a seat finds the previous seat's
  error: log it in the baton's MISTAKES section and in DONE, with the wrong
  version's hash preserved (quarantine, don't delete). The record must show
  what went wrong, who caught it, and what the truth turned out to be.
  Cleaning up a mistake silently is worse than the mistake.

## 3. The tribunal (periodic full audit)

**Trigger:** every freeze (`freeze.py`), every canonical declaration, and any
time the human calls it.

**Seats:** three different providers. (Reference implementation: Grok 4.5,
Fable 5 → fallback Opus 4.8, Codex Sol. Substitute whatever three unrelated
providers you have.)

**Procedure — each seat independently, without seeing the others' verdicts:**
1. Read the full handoff section: `HANDOFF_CURRENT.md` + entire `HANDOFF_LOG/`
   + TO_DO_LIST's DONE log.
2. Verify: (a) every baton's baseline hash exists and matches; (b) every
   RUNTIME-ATTESTED claim has a reproducible command — run it if you can;
   (c) DONE log matches actual files on disk; (d) MISTAKES sections are not
   empty across an implausibly clean history (zero recorded mistakes across
   many batons is itself a red flag).
3. File `TRIBUNAL/AUDIT_<date>_<seat>.md`: per-item verdict
   CONFIRMED / DISCREPANCY / UNABLE_TO_VERIFY, plus one overall line:
   `CHAIN_INTACT` or `CHAIN_BROKEN_AT_B-###`.

**After all three file:** the human reads all verdicts side by side.
Discrepancies become NOW tasks. Three CONFIRMED verdicts still prove only what
was checked — record `CHAIN_INTACT`, never "audited ✓ safe."

---

*Why three providers? Same-provider agreement is not independent corroboration —
models from one lab share blind spots. Three unrelated providers checking the
same hashes is the cheapest real independence a solo operator can buy.*
