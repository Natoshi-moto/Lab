# Provenance — 2026-07-23 NOTED frontend privacy assault

**status_authority:** `NONE`
**Track:** NOTED | **Emergency packet:** `EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001`
**Target of the reports:** Noted browser product at commit `47578a86e41267a2aa41c523b3b4297bd6d3becb`
**Seats:** Codex (audit + F-01..F-04), Claude Opus 4.8 (attack + confirm/falsify + 3 new cases)

These are **verbatim, bit-for-bit copies**. Verify any file with `sha256sum`; the
value must equal the row below AND its live source. Same operator account across
seats — **multi-seat agreement is NOT independent corroboration.**

| Vault file | sha256 | Copied verbatim from |
|------------|--------|----------------------|
| `CODEX_DEBUG_REPORT.md` | `73cf579f00be3953fedcff4198ee18c9d4a8ec62a3a806bf98c996790a52bf62` | `operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/DEBUG_REPORT.md` |
| `CLAUDE_ATTACK_REPORT.md` | `3cab7d865a0ea79ebe1969428ea2df9ad9e2606f11ca0e0beafabed1249b0616` | `operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/CLAUDE_ATTACK_REPORT.md` |
| `CLAUDE_TO_CODEX_HANDOFF.md` | `54b9d17814584d5944e20bd8da954f9e971cc12fc6b93ce5423fe0341887c8e2` | `operations/handoffs/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001_CLAUDE_TO_CODEX.md` |

## One-paragraph plain summary (the index links here, not to this paragraph)

Two AI seats attacked the Noted browser product. Confirmed: provider API keys are
stored in browser `localStorage` and (for Gemini) placed in the request URL; four
providers are routed by **default through a third-party CORS proxy**
(`corsproxy.io`); 71 standalone HTML apps ship on **one origin with one shared
localStorage and no CSP**, so the weakest of 71 pages sets the security ceiling for
the credential; and the "diagnostic" export copies user prompt drafts and the
author's name with no allowlist. **Falsified:** the export does not leak the API
keys (prefix mismatch). **Resolved:** the earlier "can't typecheck" gap — it now
typechecks and builds. No product code was changed; only synthetic canary values
were used. Green Python/Nexus gates never touch any of these browser paths.
