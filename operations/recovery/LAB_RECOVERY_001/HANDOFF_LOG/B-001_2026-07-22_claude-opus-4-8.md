# HANDOFF_CURRENT.md — the baton

> One live baton per project. When any agent stops — credits gone, context full,
> blocked, or done — this file IS the project state. The next agent (any
> provider) starts here after TO_DO_LIST.md. Previous batons are archived to
> `HANDOFF_LOG/` untouched; batons are never edited after archiving.

## BATON
- **id:** B-001
- **from-seat:** Claude Opus 4.8 (Claude Code, local filesystem access)
- **date-utc:** 2026-07-22
- **stop-reason:** HUMAN_PAUSED — operator handing the show to a successor
  Claude seat; this seat remains reachable in its original session if needed
- **baseline:** Lab repo `main` @ `2a3c068`; kit freeze
  `agent-gateway_2026-07-22_181744.zip` sha256 `55d3ebc2e8bf…0445f69`;
  inventory `Lab-Recovery/gateway-inventory/INVENTORY.json` (3,504 files)

## STATE — what is true right now
- [RUNTIME-ATTESTED] Nexus Moot round10 test suite: 61 pass / 0 fail
  (`tests/run.sh`, executed 2026-07-22 by this seat).
- [RUNTIME-ATTESTED] Inventory scan: 60 divergent families, 395 exact-dupe
  groups across round7(1), round10(1), NEXUS_ORGANIZED, nexus_consolidated.
- [SOURCE-VERIFIED] Four distinct `Nexus_OS.html` versions exist:
  `a86c8b9b` (round10, 07-09) · `4c0ba04f` (round7, 07-09) ·
  `799d87ad` (NEXUS_ORGANIZED, 06-28) · `d43e5fa3` (committed in Lab repo).
- [SOURCE-VERIFIED] Lab repo `products/creature-engine/` is an empty registered
  landing pad ("Phase 0 intentionally contains no engine code").
- [UNABLE_TO_VERIFY] Nostr relay path (two-peer live battle) — websocket
  unavailable in test environment; never exercised.
- [UNABLE_TO_VERIFY] Which OS version is functionally best — no runtime
  comparison performed; newest ≠ canonical (D-001).

## IN-FLIGHT — the task that was interrupted
- **task:** Stand up 3-provider relay (Grok 4.5 / Codex Sol / Claude) to
  execute Lab-Recovery TO_DO_LIST NOW items.
- **done so far:** protocol + baton + tribunal specs written [SOURCE-VERIFIED];
  relay openers drafted; declarations D-001/D-002 recorded.
- **NOT done, may look done:** the four-way Nexus_OS.html diff table (task
  exists, zero diffing performed); tribunal has never actually run; relay
  envelopes have never round-tripped through real Grok/Codex sessions.
- **next single concrete step:** operator pastes the two relay openers
  (`RELAY_OPENERS.md`) into Grok 4.5 and Codex Sol sessions.

## MISTAKES — committed as mistakes
- 2026-07-22 | Claude Opus 4.8 | Claimed "four divergent copies" of the
  engines in an audit segment; hashing proved the three engine files
  byte-identical across all four locations (divergence was real only for
  Nexus_OS.html and others). Corrected on record; original claim preserved
  in conversation/video.
- 2026-07-22 | Claude Opus 4.8 | Framed the corpus as "10 days old" from git
  genesis; operator corrected: ~6 years of pre-Lab work. Chronology inversion
  acknowledged; audit's structural findings unchanged.

## FOR THE NEXT SEAT
- **do not trust:** any claim about creature/OS *runtime behavior* beyond the
  61 listed tests — nothing visual/browser-side has been attested by anyone.
- **verify first:** re-run `bash tests/run.sh` in round10 and re-hash the four
  Nexus_OS.html files. If either check fails, this baton is stale — say so
  loudly in RELAY_LOG.md before doing anything else.
