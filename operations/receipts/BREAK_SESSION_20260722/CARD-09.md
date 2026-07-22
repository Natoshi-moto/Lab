# CARD-09 result — BREAK_SESSION_20260722 (session 2)

- Card: CARD-09 · Bridge — forgeable plain receipts
- Threat links: bridge-gap (signal B); adjacent to / restatement of T-01
- Seat: Claude Opus 4.8 (Anthropic) — `status_authority: NONE`
- Model family: Anthropic (same account/family as prior Claude seats — **NOT** independent corroboration)
- Date/time run (UTC): 2026-07-22 ~04:40
- main SHA at start: `676a1a46e2decc33f8cc4182b20c2c3933d86b17` (clean tree, on `main`)
- Result: **FOUND (expected)** — receipts carry no unforgeable marker
- Evidence label: **SOURCE_TRACED** (static read this session)

## What was tested (layman)

Could a "receipt" (the host's proof it processed something) be faked by anything that can run
code inside the Agent window?

## Code read (verbatim, current SHA `676a1a4`)

`ActionReceipt` — `products/noted-host/src/bridges/nexusBridgeTypes.ts:41-53`:

```ts
export type ActionReceipt = {
  id: string
  actionId?: string
  ok: boolean
  actor: NexusActorRef
  capability?: string
  target?: NexusRef
  summary: string
  createdAt: string
  reversible: boolean
  error?: string
  refs?: NexusRef[]
}
```

`makeReceipt` — `products/noted-host/src/bridges/nexusHostBridge.ts:49-70`:

```ts
function makeReceipt(params: {...}): ActionReceipt {
  return {
    id: makeId('receipt'),
    actionId: params.inbound?.id,
    ok: params.ok,
    actor: NOTED_HOST_ACTOR,
    capability: params.capability ?? params.inbound?.capability,
    target: params.inbound?.refs[0],
    summary: params.summary,
    createdAt: nowIso(),
    reversible: params.reversible ?? false,
    error: params.error,
    refs: params.inbound?.refs,
  }
}
```

`makeId` — `nexusHostBridge.ts:39-42`:

```ts
function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}
```

## Finding

- `ActionReceipt` is a **plain JSON-shaped object** with **no signature, HMAC, nonce, or any
  cryptographic marker**. Every field (`id`, `ok`, `actor`, `capability`, `summary`, `createdAt`,
  `reversible`, …) is trivially constructible.
- The `id` is **not** an authenticity token — `makeId` is `Math.random()` + `Date.now()` in
  base-36. It is a collision-avoidance identifier, not an unforgeable nonce, and can be reproduced
  by any code.
- Therefore anything that can execute inside the trusted iframe window can **construct an
  identical-looking receipt** and post it anywhere. A receipt's authenticity today rests entirely
  on **who sent the message** (the window-identity check — CARD-06), not on the receipt's own
  contents. Matches the signal-B hypothesis.

## Cross-reference (scope honesty)

This is **arguably not an independent hole** — it is a restatement of **T-01's** blast radius
(CARD-04, EXECUTED-FAIL). Once code runs inside the trusted iframe (T-01), forging a receipt is a
downstream consequence, not a separate defect. Recorded as a cross-reference to T-01, not as its
own repair target.

## Non-claims (tattoo)

- `status_authority: NONE`. A FOUND here is honest progress, not a fix.
- **NOT independent corroboration** — same Anthropic account/family as prior seats.
- Static read only. No forged receipt was constructed or posted this session.
- Signing receipts in isolation would not close T-01; the real fix path is CARD-04's.
