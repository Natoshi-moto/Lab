# Nostr Routing Specification v0.04

## Purpose

Nostr is the external relay network for selected Nexus events. It is not the internal bus. Nexus remains the internal router. Blocks speak Nexus Event Language. The Nostr bridge decides which events become signed relay events.

## Translation layers

```text
NexusEventEnvelope
→ NostrTranslationPlan
→ UnsignedNostrEvent
→ SignRequest
→ SignedNostrEvent
→ RelayPublishAttempt
→ ActionReceipt
```

## Proposed mappings

| Nexus kind | Default Nostr target | Notes |
|---|---|---|
| `prompt.snapshot.created` | `kind:30078` | app-specific data; address by `d` tag |
| `agent.receipt.created` | `kind:30078` | private or public depending on policy |
| `ui.patch.receipt` | local by default | publish only if user syncs settings |
| `eidolon.creature.snapshot` | `kind:30078` | game state / collection object |
| `mission.log.entry` | local by default | sensitive; only publish if explicitly enabled |
| `public.note.created` | regular Nostr note or app kind | depends on user intent |

## Signing policy

Private keys must not be placed inside arbitrary blocks. The preferred future path is remote signing. The bridge asks a signer to sign prepared events. Blocks never receive the user’s private key.

## Relay policy

Relay choices belong in a profile-level relay policy. Blocks can request publication or sync, but the router chooses relays based on user configuration, relay-list metadata, and action policy.

## Failure behavior

Relay publish is not success until receipt exists. Failed publishes must return receipts with:

- event id attempted,
- relay attempted,
- error message,
- retry policy,
- whether content was signed,
- whether user action is needed.

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Defines how Nexus events are translated into Nostr-facing operations.
LOAD-BEARING: Nostr bridge translates router events; blocks do not publish directly.
DECISIONS:
  - NIP-78-style app data is the default for private app state sync.
  - Signing is brokered so blocks never hold private keys.
  - Relay policy is profile-level, not block-owned.
OPEN: Exact encryption model for private app data is deferred to BB-08/BB-09.
VERIFY: Read alongside nostr-kind-registry.v0.04.json and nostrBridgeTypes.ts.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · drafted Nostr routing contract.
───────────────────────────────────────────────────────────── -->
