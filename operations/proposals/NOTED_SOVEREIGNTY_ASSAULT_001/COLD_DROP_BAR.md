# Cold-drop privacy bar

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`  
**Date:** 2026-07-22  
**Last de-stale:** 2026-07-22 (Phase B after PR #66 / session 1 / Fable WHOOP-20260722-02)

Checklist gating "strangers can unpack this repo without shame." References T-IDs in `THREAT_MODEL.md`; does not repeat their content.

| Item | Status | Note |
|---|---|---|
| No stale unscrubbed Agent build in the **shipped tree** | **PASS (launch path)** | T-06 — after PR #66: no `nexus-agent-v0.12*` under `public/`; no refs in `block-registry.json` or `Nexus_OS.html`; session 1 CARD-01 EXECUTED PASS. **Not** a claim that git history was purged. |
| CDN dependencies vendored or explicitly disclosed | **Partial** | T-02 — disclosed as a non-claim in `products/nexus-blocks/blocks/nexus-agent/README.md`, not vendored; acceptable only if that disclosure stays loud, not buried |
| Diagnostic export reviewed for scope drift | **Unknown → needs action** | T-04 — exporter file is frozen; needs an UNFREEZE-gated allowlist decision, not a silent patch |
| `crypto:*` keys never appear in any export | **Pass** | Agent's own `STRIP_FROM_EXPORT` list plus host exporter's `verse-studio:`-only prefix scoping both hold; worth turning into a named, tested guarantee (ODS-SEC-005) rather than an observed accident |
| No `.env`/secrets committed | **Pass** | verified via `.gitignore` + direct search, none found |
| No real provider API keys embedded in any committed **current** file | **Pass, but needs a human eyeball pass** | Automated search found nothing key-shaped in current tree; human eyeball before strangers unpack still required. (Pre-#66 note about v0.12 embedded blob is historical — file no longer in shipped tree.) |
| Private-repo design mismatch disclosed to cold-drop readers | **Unknown** | T-10 — `HUMAN_DECISION_REQUIRED` per Lab `CLAUDE.md`; currently undisclosed to an outside reader who would otherwise assume the privacy docs describe current reality |

**W1 (`CHARTER.md`) residual blockers today:** row 7 (T-10 disclosure) and any marketing that ignores open T-02/T-03/T-01. Row 1 is **no longer** a W1 blocker on the launch path. Row 6 still wants a human eyeball before a real stranger drop.

**Non-claims:** PASS on row 1 does not make G-04 “CI-green,” does not clear other gates, and does not authorize cold-drop “safe” language while G-01/G-02/G-03 remain red.
