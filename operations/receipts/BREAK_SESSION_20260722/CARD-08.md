# CARD-08 result — BREAK_SESSION_20260722 (session 2)

- Card: CARD-08 · Bridge — no replay detection / no payload size limit
- Threat links: bridge-gap (signal B)
- Seat: Claude Opus 4.8 (Anthropic) — `status_authority: NONE`
- Model family: Anthropic (same account/family as prior Claude seats — **NOT** independent corroboration)
- Date/time run (UTC): 2026-07-22 ~04:40
- main SHA at start: `676a1a46e2decc33f8cc4182b20c2c3933d86b17` (clean tree, on `main`)
- Result: **FOUND (expected)** — no replay/id-dedup guard, no payload size cap
- Evidence label: **SOURCE_TRACED** (static read this session; optional live replay via `diagnostic.ping` not run)

## What was tested (layman)

Would the bridge notice or care if the exact same message were sent twice, or if a message were
made enormous?

## Code read (verbatim, current SHA `676a1a4`)

`isNexusHostBridgeMessage` — `products/noted-host/src/bridges/nexusBridgeTypes.ts:81-103`:

```ts
export function isNexusHostBridgeMessage(value: unknown): value is NexusHostBridgeMessage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { type?: unknown; envelope?: unknown }
  if (candidate.type !== 'NEXUS_HOST_BRIDGE') return false
  if (!candidate.envelope || typeof candidate.envelope !== 'object') return false
  const envelope = candidate.envelope as Record<string, unknown>
  const source = envelope.source as Record<string, unknown> | null
  const policy = envelope.policy as Record<string, unknown> | null
  return (
    typeof envelope.id === 'string' && envelope.id.length > 0
    && typeof envelope.createdAt === 'string'
    && typeof envelope.channel === 'string' && envelope.channel.length > 0
    && typeof envelope.kind === 'string' && envelope.kind.length > 0
    && !!source && typeof source === 'object'
    && typeof source.kind === 'string' && typeof source.id === 'string'
    && Array.isArray(envelope.tags)
    && Array.isArray(envelope.refs)
    && !!policy && typeof policy === 'object'
    && typeof policy.requiresApproval === 'boolean'
    && typeof policy.reversible === 'boolean'
    && typeof policy.risk === 'string'
  )
}
```

`handleNexusEnvelopeStub` — `products/noted-host/src/bridges/nexusHostBridge.ts:95-133`: switches
on `envelope.channel`, returning a `makeReceipt(...)` for unknown-channel / unknown-capability /
`diagnostic.ping` / stubbed channels. No state is consulted or stored across calls.

## Finding

- **No replay / id-dedup guard.** `isNexusHostBridgeMessage` is a stateless structural type guard —
  it holds no set of previously-seen `envelope.id`s and never compares against past messages.
  `handleNexusEnvelopeStub` likewise keeps no history. The **same envelope `id` can be submitted
  repeatedly** and each pass is processed independently (the accepted/rejected counters would tick
  once per submission).
- **No payload size cap.** The type guard **never inspects `envelope.payload` at all** — `payload:
  TPayload` is unconstrained. The only `.length` checks present are minimum-presence guards
  (`envelope.id.length > 0`, `channel.length > 0`, `kind.length > 0`) — there is **no maximum**
  length/size ceiling anywhere on the envelope or its payload.
- Matches the signal-B hypothesis: no replay detection and no payload size limit.

## Optional live check (not run this session)

The runbook permits a safe live replay using only the `diagnostic.ping` channel
(`nexusHostBridge.ts:118-125`, documented "No mutation performed"), submitting the same `id`
twice and watching the accepted counter. Not executed this session — hence **SOURCE_TRACED**, not
EXECUTED. If run, it would only confirm the static finding above.

## Non-claims (tattoo)

- `status_authority: NONE`. A FOUND here is honest progress, not a fix.
- **NOT independent corroboration** — same Anthropic account/family as prior seats.
- Static read only; no live replay/oversize message sent. Only the mutation-free `diagnostic.ping`
  channel would be eligible for a live check — never an approval-gated channel.
- What would count as FIXED later (bounded id-seen set + payload ceiling, re-verified via
  `bridge:smoke`) is **out of scope** for this break session.
