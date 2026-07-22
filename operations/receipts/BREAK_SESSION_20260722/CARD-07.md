# CARD-07 result — BREAK_SESSION_20260722 (session 2)

- Card: CARD-07 · Bridge null-target race on `getTargetWindow()`
- Threat links: bridge-gap (signal B)
- Seat: Claude Opus 4.8 (Anthropic) — `status_authority: NONE`
- Model family: Anthropic (same account/family as prior Claude seats — **NOT** independent corroboration)
- Date/time run (UTC): 2026-07-22 ~04:30
- main SHA at start: `82cef4aa1242bb7462ef08bd6ab33bb54df00756` (clean tree, on `main`)
- Result: **CONTRADICTED** (static claim) with a residual **UNKNOWN** for the dynamic reload-race
- Evidence label: **CONTRADICTED** (static read this session); dynamic timing case explicitly **UNKNOWN**

## What was tested (layman)

A prior review flagged a possible race: if the bridge doesn't know the Agent window yet
(`targetWindow` is `null`), could a forged message sneak through as if it were trusted?

## Code read (verbatim, current SHA `82cef4a`)

`products/noted-host/src/bridges/nexusHostBridge.ts:175-219`:

```ts
const targetWindow = options.getTargetWindow()
const fromTarget = targetWindow !== null && event.source === targetWindow

if (!fromTarget) {
  if (!isNexusHostBridgeMessage(event.data)) {
    // Untrusted origin sending unrelated noise: nothing to reject, just drop it.
    ... ignored ...
    return
  }
  // Untrusted origin impersonating the bridge protocol: reject with a receipt,
  // but never postMessage the receipt back to a window we don't trust.
  const receipt = makeReceipt({ ..., ok: false, error: 'UNTRUSTED_SOURCE' })
  ... rejected ...
  return
}
```

## Finding (static trace)

When `targetWindow` is `null`:

1. `fromTarget = targetWindow !== null && ...` short-circuits on the first conjunct → **`false`**.
2. `if (!fromTarget)` is therefore **true** → control enters the **untrusted** branch.
3. Within it: non-bridge-shaped noise is **ignored** (line 179-194); a bridge-shaped
   impersonation is **rejected** with an `UNTRUSTED_SOURCE` receipt and the receipt is
   deliberately **not** posted back (lines 196-219).

So a `null` `targetWindow` routes messages to the **untrusted** path, never trusted-by-default.
The hypothesis "forged message sneaks through while target is null" is **CONTRADICTED** by the
current code — a null target makes *every* incoming message untrusted, which is fail-safe.

## Residual UNKNOWN (dynamic, not tested)

The static trace does not cover a **timing/reload race**: whether a rapid iframe
remount/reload could momentarily leave `getTargetWindow()` returning a **stale** window reference
that is treated as valid when it shouldn't be (e.g., old iframe window object still `===` the
cached target after a swap). This runbook/session did **not** build a reload-race probe. Marked
**UNKNOWN** — flagged as a follow-up if someone wants a timing test later.

## Non-claims (tattoo)

- `status_authority: NONE`. A CONTRADICTED here corrects a hypothesis; it is not a fix and does
  not certify the bridge.
- **NOT independent corroboration** — same Anthropic account/family as prior seats. Independently
  re-verifies the runbook's predicted CONTRADICTED at current `main`.
- The static fail-safe here is **orthogonal to T-01**: a genuine (non-null, identity-matching)
  compromised iframe still passes (see CARD-06 / CARD-04). Do not read this as "bridge is safe."
- Dynamic reload-race remains open (UNKNOWN), not proven absent.
