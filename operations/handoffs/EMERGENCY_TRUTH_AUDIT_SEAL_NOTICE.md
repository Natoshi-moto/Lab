# SEAL NOTICE — conversation archive sealed from three-seat auditors

**status_authority:** `NONE`  
**Date (UTC day):** 2026-07-22  
**main_sha_when_notice_filed:** (see merge commit)  

## What is sealed

A **local-only** package (gitignored under `corpus/local-only/`) contains:

- Full session conversation record (user verbatim + assistant continuity)  
- Operator **final** self-diagnosis message (last pre-audit message)  

Auditors on this truth audit **MUST NOT** open:

```text
corpus/local-only/SEALED_UNTIL_THREE_SEAT_TRUTH_AUDIT_COMPLETE/**
```

If you opened it: **DISQUALIFY** yourself, say so in your response, and stop.

## Why sealed

Operator order: three seats (Claude, Codex, fresh Grok) must file findings **without** seeing the sealed full conversation / final self-diagnosis, so non-contamination is **provable**. After all three responses are on main (or merged), operator may unseal and publish the whoopsie.

## Hashes at seal time (local package)

```text
aad3c12bb4aeb3eabe1a36d7280636116a2a40a3cfdb9df3f50b46715be420fd  README_SEAL.md
4182ff93ff7fe2525d7540aad903367d88fa7b4ab4ab0ec14430dc044156ea7b  OPERATOR_FINAL_SELF_DIAGNOSIS_SEALED.md
70872bfdfcb4b60122f97f0513c94e68df1ecdcd562be98d2b310b5f20108bed  CONVERSATION_VERBATIM_SEALED.md
```

Unseal later: re-hash local files; must match, or log mismatch.

## What auditors MAY use

Everything **on main** only, especially:

- `EMERGENCY_TRUTH_AUDIT_THREE_SEAT_001.md`  
- `EMERGENCY_JUDGMENT_LAPSE_INVESTIGATION_001.md` (§9 stark warning is public)  
- `EMERGENCY_STOP_AND_AUDIT_001.md`  
- Session 2 receipts, Fable response, break-glass, Whoopsie 00–07, STATUS/NEXT_ACTION  
- PR history metadata  

§9 already says: CARD-11 merge intentional; fear is presentation drift / smell — **without** the later sealed “I know exactly: cocky terminals” monologue.

## After three responses

Operator path:

1. Merge three `EMERGENCY_TRUTH_AUDIT_001_RESPONSE.*.md`  
2. Unseal local package; publish as Whoopsie / receipt with cockiness label if still endorsed  
3. Swan song v0.0.1 **or** keep building upward — operator choice  

## Non-claims

Seal is not proof of guilt or innocence. It is anti-contamination for an epistemic test.
