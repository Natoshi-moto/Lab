# Waiver protocol — the only escape hatch

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`

You may proceed with feature work while gates are RED **only** via this protocol.  
Silence is **not** a waiver. Chat vibes are **not** a waiver. “We’ll circle back” is **not** a waiver.

---

## Form (copy into `operations/receipts/` when used)

```text
WAIVER_ID: W-G0X-YYYYMMDD-##
GATE: G-0X
T_IDS: T-0X, …
OPERATOR: <name/handle>
DATE_UTC: …
EXPIRES_UTC: …          # hard expiry; default ≤ 14 days
SCOPE: <exactly which PRs / phases are allowed under this waiver>
RESIDUAL_RISK: <layman paragraph a stranger could understand>
PUBLIC_LANGUAGE: <exact non-claim text that MUST appear in UI or README while waiver live>
FORBIDDEN_CLAIMS: <phrases banned for the waiver duration>
RETEST_TRIGGER: <what event forces re-open even before expiry>
status_authority: NONE
```

File as:

`operations/receipts/NOTED_STOP_THE_LINE_WAIVER_<GATE>_<DATE>/RECEIPT.json`  
(or `.md` if JSON is overkill — but must be in `operations/receipts/`)

---

## Rules

1. **One gate per waiver** (do not bulk-waive G-01…G-07 in one shrug).  
2. **Expiry ≤ 14 days** unless operator explicitly sets longer and states why.  
3. **Expired waiver = RED again** with no grace for “we forgot.”  
4. **Grok-drive must paste active waivers** at the start of any planning turn.  
5. Waivers **never** authorize real-world value, tokens, or secret commits.  
6. Waivers **never** soften Power Snooper warning law if Snooper ships.

---

## Shame clause (intentional)

A waiver is a **confession** that the product is shipping known membrane failure modes.  
That is allowed. Hiding the confession is not.
