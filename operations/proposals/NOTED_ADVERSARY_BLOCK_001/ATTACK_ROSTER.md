# Attack roster — six demonstrations

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22

Each row is a button in the block's UI. Each maps to an existing `ODS-SEC` case (`../NOTED_SOVEREIGNTY_ASSAULT_001/ODS_SECURITY_CASES.md`) so the interactive demo and the machine-checkable CI case are the same claim, checked two ways.

---

| # | Button label | Attack | T-ID | ODS-SEC | Build order |
|---|---|---|---|---|---|
| 1 | "Read your notes" | From inside the Agent frame, read a seeded synthetic note via `parent.localStorage` / `parent.indexedDB` | T-01 | ODS-SEC-001, 002 | Playwright-dependent |
| 2 | "Swap your toolkit" | Route-intercept a pinned CDN script, serve a benign proof-of-execution payload instead | T-02 | ODS-SEC-003 | Cheapest — static parse for the ODS-SEC case; interactive version needs Playwright route mocking |
| 3 | "Watch your key leave" | Seeded fake API key, one provider call with proxy unset, capture shows the request hit a **local mock** standing in for `corsproxy.io` | T-03 | ODS-SEC-004 | Playwright-dependent |
| 4 | "Steal your custody credential" | Same mechanism as #1, but the fixture is a synthetic secret shaped like what `R016_PCX_INTEGRATED_CUSTODY_GATE` would eventually store | T-01 | (new case, cite T-01) | Playwright-dependent; reuses #1's harness with a different fixture |
| 5 | "Ghost your import" | Fire two `prompt.snapshot.import.requested` envelopes back to back before approving either | T-14 | ODS-SEC-007 | Playwright-dependent |
| 6 | "Use the back door" | Direct navigation to the retired `nexus-agent-v0.12.html` entry point on a built artifact | T-06 | ODS-SEC-006 | Cheapest — pure filesystem/HTTP check, no browser interaction needed |

**Suggested implementation order:** #2 and #6 first (no live-attack browser automation required, fastest to land and review), then #1 and #3 (the two that produce the Snooper-silence demo — see `RECEIPT_SCHEMA.md`), then #4 (reuses #1's harness, but do not build it before #1 is reviewed — it's the highest-stakes fixture in this packet and deserves its own explicit sign-off), then #5.

---

## Fixtures (synthetic only — see CLAIMS_AND_NONCLAIMS.md)

| Fixture | Shape | Used by |
|---|---|---|
| `fixture.note` | A note-shaped record with an obviously-fake marker string (e.g. `SYNTHETIC-DO-NOT-TREAT-AS-REAL`) | #1 |
| `fixture.apiKey` | A key-shaped string that is not a valid credential for any real provider | #3 |
| `fixture.custodySecret` | A seed/credential-shaped synthetic value matching the storage shape `R016` would eventually use, never a real derivation | #4 |
| `fixture.importEnvelope` (×2) | Two distinct synthetic snapshot-import payloads, timestamped seconds apart | #5 |

No fixture is ever a real credential, real note content, or capable of a real outbound call. #3's "proxy" target is a local mock server started by the harness, not the real `corsproxy.io`.

---

## What each attack proves, in one sentence (for the CLAUDE_REVIEW_BRIEF and for non-technical readers)

1. The AI panel can read your saved notes without asking.
2. The AI panel's own code can be swapped out by anyone who compromises a CDN, and nothing here would notice.
3. Your API key leaves through a stranger's relay server by default.
4. Whatever this project ever stores for a wallet or custody feature would leak exactly like your notes do today.
5. Two things happening close together can silently erase one of them with no record.
6. The "removed" dangerous version isn't actually gone.
