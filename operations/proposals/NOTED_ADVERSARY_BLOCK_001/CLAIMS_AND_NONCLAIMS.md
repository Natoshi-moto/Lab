# Claims and non-claims — adversary block

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22
**Sister:** `../NOTED_MEMBRANE_HARDENING_001/CLAIMS_AND_NONCLAIMS.md`

---

## Permanent non-claims (never expire)

1. This block is a demonstration tool, not a penetration-testing framework or vulnerability scanner.
2. Research software; `status_authority: NONE`.
3. Running all six attacks cleanly does not mean the system is safe — it means six specific, already-known issues reproduce. Absence of a seventh attack here is not evidence of absence of a seventh issue.
4. Multi-AI agreement is not independent audit.
5. **This block, and the app it lives in, must not be used with real money, real credentials, or real private data. Ever, until every attack in `ATTACK_ROSTER.md` fails to reproduce and the underlying T-IDs are closed with evidence, not with this block's silence.**

---

## Data handling — hard constraints, not preferences

- Every fixture used by every attack is synthetic and tagged as such at creation (see `ATTACK_ROSTER.md`). Enforce this at the fixture-generation layer, not by convention: fixture values should be structurally impossible to confuse with real data (fixed marker prefix, fixed impossible-in-production shape).
- No attack makes a real outbound network call to a real third-party service. The "leaked to a stranger" demo (#3) targets a local mock, never `corsproxy.io` itself.
- No attack is ever run against a build containing real user data. If this block ships inside a build that also contains real notes, it does not run — hard block, not a warning dialog.

---

## In-product language requirements

- A persistent, non-dismissible banner while this block is open: **"DO NOT USE FOR REAL MONEY."** Same visual weight as Snooper's armed-state indicator (`SNOOPER_IA.md`) — not a toast that fades.
- Every receipt (see `RECEIPT_SCHEMA.md`) carries its own non-claim line.
- The block's own entry in `block-registry.json` role/description field states plainly what it is: an adversary demonstration, not a feature.

---

## Overclaim hall of shame (reject in review)

- "We built our own attack tool, so we're taking security seriously" *(building the demo is not the same as fixing what it demonstrates)*
- "All six attacks documented and reproducible" *(true and also not a safety claim — the opposite)*
- "Adversary block passed" *(there is no passing state for this block; every successful attack is by definition the expected, embarrassing result until the underlying T-ID closes)*
- "Nexus hardens security" / any phrasing already forbidden in `../NOTED_MEMBRANE_HARDENING_001/CLAIMS_AND_NONCLAIMS.md`

Claude review should flag any of the above in this packet, in the block's UI copy, or in any release notes describing it.

---

*End claims and non-claims.*
