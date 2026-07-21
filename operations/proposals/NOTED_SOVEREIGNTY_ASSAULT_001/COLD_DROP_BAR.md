# Cold-drop privacy bar

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22

Checklist gating "strangers can unpack this repo without shame." References T-IDs in `THREAT_MODEL.md`; does not repeat their content.

| Item | Status | Note |
|---|---|---|
| No stale unscrubbed Agent build in the tree | **FAIL** | T-06 — two copies of `nexus-agent-v0.12.html` still committed, still cross-referenced by `block-registry.json` and `Nexus_OS.html` |
| CDN dependencies vendored or explicitly disclosed | **Partial** | T-02 — disclosed as a non-claim in `products/nexus-blocks/blocks/nexus-agent/README.md`, not vendored; acceptable only if that disclosure stays loud, not buried |
| Diagnostic export reviewed for scope drift | **Unknown → needs action** | T-04 — exporter file is frozen; needs an UNFREEZE-gated allowlist decision, not a silent patch |
| `crypto:*` keys never appear in any export | **Pass** | Agent's own `STRIP_FROM_EXPORT` list plus host exporter's `verse-studio:`-only prefix scoping both hold; worth turning into a named, tested guarantee (ODS-SEC-005) rather than an observed accident |
| No `.env`/secrets committed | **Pass** | verified via `.gitignore` + direct search, none found |
| No real provider API keys embedded in any committed file | **Pass, but needs a human eyeball pass** | v0.12's embedded blob is synthetic test data (agent "Tesst," dummy session) — automated search found nothing key-shaped, but that is not a substitute for one human actually looking before strangers unpack this |
| Private-repo design mismatch disclosed to cold-drop readers | **Unknown** | T-10 — `HUMAN_DECISION_REQUIRED` per Lab `CLAUDE.md`; currently undisclosed to an outside reader who would otherwise assume the privacy docs describe current reality |

**W1 (`CHARTER.md`) is blocked today** on rows 1 and 6. Nothing else here is a hard blocker as of this writing.
