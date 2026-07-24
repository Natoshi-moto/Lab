# Receipt schema — what gets recorded per attack run

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22

Follows the repo's existing two-commit self-binding receipt pattern (see audit history under `operations/receipts/`). Each attack run produces one receipt, whether triggered interactively or by the `ODS-SEC` CI case.

---

## Shape

```json
{
  "schema": "noted.adversary-receipt/v1",
  "attack_id": "ADV-01",
  "t_id": "T-01",
  "ods_sec_id": "ODS-SEC-001",
  "timestamp": "2026-07-22T00:00:00Z",
  "fixture_used": "fixture.note",
  "fixture_is_synthetic": true,
  "expected": "read attempt throws or returns null",
  "actual": "read attempt succeeded",
  "result": "FAIL",
  "data_accessed_preview": "SYNTHETIC-DO-NOT-TREAT-AS-REAL:...(truncated)",
  "snooper_armed": true,
  "snooper_events_during_attack": 0,
  "operator_notes": "",
  "status_authority": "NONE"
}
```

`data_accessed_preview` is always truncated and always sourced from a fixture tagged synthetic — never real user data, enforced at the fixture layer (see `CLAIMS_AND_NONCLAIMS.md`).

`snooper_events_during_attack` is the field that carries the whole point of the Snooper integration: for attacks #1, #2, #3, and #4 (T-01/T-02/T-03, all outside the bridge per `SNOOPER_IA.md`'s own stated scope), this should read `0` every time, with Snooper armed and its persistent indicator visibly on screen. That contrast — attack succeeded, monitoring tool saw nothing — is the receipt's most load-bearing line.

---

## Display requirement (interactive mode)

When run from the block's UI (not just CI), the receipt must render **side by side with a live Snooper panel** showing its event counter during the attack. This is not optional polish — it's the demonstration the whole packet exists to produce. A receipt with no visible Snooper contrast is a weaker artifact than one with it.

---

## Export

Receipts export as both:
- Raw JSON (for the CI/automated suite, same convention as `ods-p0.mjs` output)
- A human-readable Markdown summary + optional screen-recording hook, aimed at an operator who does not read code

## Non-claim on the receipt itself

Every receipt, interactive or automated, carries the line:

> This receipt proves a specific known issue reproduces today. It does not constitute a security audit, and a clean run of this block does not mean the system is safe for real value.
