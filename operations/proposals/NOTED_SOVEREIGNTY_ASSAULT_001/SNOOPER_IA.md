# Power Snooper — information architecture (membrane v1)

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22
**Locked by operator — do not soften:** opt-in only, default OFF; three escalating warnings before arming; constant reminder while armed; three deliberate clicks of a distinct "DEFINITELY STOP WARNING" control before in-session nags quiet; even then, one forced reminder per calendar day; redacted export is the default, full export needs its own separate scary confirm.

## Scope statement (load-bearing — state this in-product, not just here)

Snooper v1 watches **postMessage traffic across the Nexus host bridge only** — the channel `src/bridges/nexusHostBridge.ts` already logs internally (`accepted`/`rejected`/`ignored`, channel, capability, ok/error). It does **not** see:
- same-origin direct DOM/storage access (`THREAT_MODEL.md` T-01),
- CDN script execution inside the Agent iframe (T-02),
- Agent→provider/proxy network calls (T-03).

A user arming Snooper expecting full visibility and not getting it is worse than no Snooper at all — the in-product copy must say this plainly, not bury it in a README.

## Warning state machine

```
S0 DISABLED (default)
  └─ user clicks "Enable Snooper" ─▶ S1

S1 WARNING 1/3  "What this does"
     (capture scope, default OFF, opt-in, states the coverage gap above)
  ├─ Cancel ─▶ S0
  └─ Continue ─▶ S2

S2 WARNING 2/3  "What it can expose"
     (may include prompt text / envelope payloads; redacted export is
     the default; full export needs a second, separate confirm later)
  ├─ Cancel ─▶ S0
  └─ Continue ─▶ S3

S3 WARNING 3/3  "Arm confirmation"
     (explicit button: "Arm Snooper" — no soft default)
  ├─ Cancel ─▶ S0
  └─ Arm ─▶ S4

S4 ARMED
  ├─ ALWAYS: a persistent, non-dismissible micro-indicator stays visible
  │    in the chrome for the entire time Snooper is armed (screen-recording
  │    red-dot pattern). This is never subject to the 3-click quieting below —
  │    only disabling Snooper removes it.
  ├─ SEPARATELY: a recurring in-session reminder banner appears on an
  │    interval
  │    ├─ dismiss click #1 ─▶ nagCount=1, banner reappears next interval
  │    ├─ dismiss click #2 ─▶ nagCount=2, stronger copy "(2 of 3)"
  │    └─ dismiss click #3 ─▶ routes to a visually DISTINCT control,
  │         not the same button relabeled: "DEFINITELY STOP WARNING"
  │         ─▶ nagsQuieted=true (quiets ONLY the recurring banner —
  │         the persistent badge above is unaffected)
  ├─ regardless of nagsQuieted: first app-open of each calendar day
  │    while armed ─▶ forces exactly one reminder, unskippable,
  │    unrelated to the 3-click flow
  └─ user disables Snooper ─▶ back to S0; nagCount and nagsQuieted both
       reset. Re-arming later replays S1→S2→S3 in full — no memory of
       prior "I understand" clicks ever bypasses the arm-time warnings.
```

**Persistence decision (explicit, not left implicit):** the ARMED state persists across page reloads/app restarts within the same install — a power user doesn't need to re-arm every refresh. This is precisely why the daily forced reminder exists: it is the safety valve for "armed silently survived a restart and got forgotten."

## Log contents

- **Shape-only** (default even while armed): timestamp, direction, channel, capability, ok/error, envelope id, ref ids. No payload bodies. Extends the existing `NexusBridgeLogEntry` shape already in `nexusHostBridge.ts` — mostly "make the existing internal log user-visible and retained," not new plumbing.
- **Full payload** (a separate, explicit opt-in beyond arming — its own single extra warning, not folded into S1–S3): includes `envelope.payload` verbatim.
- **Redaction filter applies to every string field, not just `payload`** — `id`/`ref` fields can themselves be content-bearing (e.g. a ref id that encodes a title). Even in full-payload mode, strings shaped like secrets (`sk-…`, `Bearer …`, long hex/base64 runs, `x-api-key` values) get masked.

## Retention

In-memory ring buffer only, same bounded-`maxLogEntries` pattern the bridge already uses. Cleared on reload. Not written to IndexedDB or localStorage by default — no new persistent sensitive-data store gets created just to support this feature.

## Export

- Default export = shape-only, redacted.
- Full/raw export requires its own scary confirm, separate from the arm-time warnings: *"Export UNREDACTED capture? May include full prompt text and anything sent to or received from the Agent."* The confirm should also state how many secret-shaped strings were found-and-masked, so the user understands the actual delta between redacted and raw, not just a generic warning sentence.

## Placement

A dedicated sub-panel under `#/diagnostics`, not a global hotkey.

Framing for future docs: **ODS is the scripted exam; Snooper is the multimeter left clipped on.**

## Relationship to Lab receipts

Raw/full captures are never attached to a receipt by default. Only a redacted shape-only summary (counts by channel, accepted/rejected/ignored totals) may be cited, and only when explicitly chosen.
