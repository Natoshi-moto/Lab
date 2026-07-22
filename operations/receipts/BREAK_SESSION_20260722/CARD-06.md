# CARD-06 result — BREAK_SESSION_20260722 (session 2)

- Card: CARD-06 · Bridge window-identity check vs. "no origin check" claim
- Threat links: bridge-gap (signal B); real residual belongs to T-01
- Seat: Claude Opus 4.8 (Anthropic) — `status_authority: NONE`
- Model family: Anthropic (same account/family as prior Claude seats — **NOT** independent corroboration)
- Date/time run (UTC): 2026-07-22 ~04:30
- main SHA at start: `82cef4aa1242bb7462ef08bd6ab33bb54df00756` (clean tree, on `main`)
- Result: **CONTRADICTED** (the "no origin check → no check at all" phrasing does not match the code)
- Evidence label: **CONTRADICTED** (static read this session), cross-referenced to T-01/CARD-04

## What was tested (layman)

A prior mining pass said the bridge does "no origin check" on incoming messages. Is that
literally true, and does it mean the bridge accepts messages from anyone?

## Code read (verbatim, current SHA `82cef4a`)

Host bridge listener — `products/noted-host/src/bridges/nexusHostBridge.ts:174-178`:

```ts
function onMessage(event: MessageEvent<unknown>) {
  const targetWindow = options.getTargetWindow()
  const fromTarget = targetWindow !== null && event.source === targetWindow

  if (!fromTarget) {
```

Studio import listener — `products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx:33`:

```ts
if (event.source !== iframeRef.current?.contentWindow || !isNexusHostBridgeMessage(event.data)) return
```

## Finding

- **Literally, neither file inspects `event.origin`** (the string origin). To that narrow extent,
  "no origin check" is true.
- **But both perform a window-identity check**: `event.source === targetWindow` (bridge) and
  `event.source === iframeRef.current?.contentWindow` (studio). `event.source` is the **Window
  object** that sent the message. A script in another tab, or a different iframe, **cannot forge
  equality** with the genuine Agent iframe's own `contentWindow` — only that exact window can pass.
- Therefore the hypothesis as phrased ("no check at all / accepts from anyone") is **CONTRADICTED**.
  The check is a window-identity comparison, not nothing.

## Where the real risk lives

The window-identity check provides **zero** protection if the Agent iframe's own content is
compromised — because then the message genuinely *does* originate from that window and passes the
check honestly. That is exactly **T-01 (CARD-04, EXECUTED-FAIL this session)**: anything running
inside the iframe already owns host storage directly and can also emit bridge messages that pass
`event.source === targetWindow`. So the residual concern is real, but it belongs to **T-01**, not
to a "missing bridge check."

## Non-claims (tattoo)

- `status_authority: NONE`. Correcting a phrasing is honest progress, not a fix.
- **NOT independent corroboration** — same Anthropic account/family as prior seats. This
  independently re-verifies the runbook's own predicted CONTRADICTED at current `main`.
- Static read only; no live message-forgery attempted this session.
- The `event.source` identity check is **not** a defence against T-01; do not read this
  CONTRADICTED as "bridge is safe."
