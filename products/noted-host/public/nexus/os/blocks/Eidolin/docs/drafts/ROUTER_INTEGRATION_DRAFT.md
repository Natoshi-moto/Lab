# Eidolin, Nexus Router and Noted Integration Draft

## Authority boundaries

| Layer | Owns | Must not own |
|---|---|---|
| Noted | Notes, projects, canvases, approved exports and durable receipts | Creature simulation ticks or arbitrary block state |
| Nexus OS | Block lifecycle, channels, capabilities, approvals and routing | User signing keys or silent canonical Noted writes |
| Eidolin Router | World/simulation events and bounded creature encounters | Nexus kernel policy or real-value settlement |
| Eidolin app | Creature presentation, play, local progression and assistant UX | Unpreviewed network publication |
| Model adapter | One bounded inference request | Creature identity, permission policy or canonical truth |

## Existing seams

Noted currently mounts `Nexus_OS.html` through `NexusRouterStudio.tsx`. The host bridge accepts traffic only from the mounted iframe window. Nexus OS then mounts managed and legacy HTML blocks. `eidolon-router.html` declares world, battle and Vibe channels; the TypeScript Lattice candidate has its own host/diagnostic adapter. These are overlapping seams, not yet one protocol.

## Proposed managed-block manifest

```json
{
  "id": "eidolin",
  "version": "0.1.0",
  "emits": [
    "eidolin.creature.selected",
    "eidolin.encounter.started",
    "eidolin.encounter.resolved",
    "eidolin.creature.born",
    "eidolin.export.requested",
    "assistant.proposal.created"
  ],
  "consumes": [
    "noted.context.approved",
    "assistant.response.ready",
    "nexus.route.visibility"
  ],
  "capabilities": [
    "noted.read.approved-export",
    "noted.propose.object",
    "model.infer.approved"
  ]
}
```

This manifest is a proposal. Existing channel names must be inventoried and migrated with compatibility tests.

## Noted-to-creature context flow

```text
user selects notes/canvas scope in Noted
→ Noted previews topology, content and optional positions
→ user selects local or remote model
→ Nexus issues a scoped inference capability
→ creature receives the response plus evidence references
→ Eidolin presents explanation/challenge/proposal
→ accepted proposals return to Noted with AI lineage
```

The creature MUST NOT receive the whole workspace by default. Spatial proximity MUST be labelled as placement evidence, not an explicit semantic edge. The model MUST NOT be able to publish, sign or write canonical state through prose instructions.

## Host lifecycle

1. Nexus creates an iframe and private message port.
2. Eidolin declares its exact channels and component version.
3. Nexus validates declaration and issues a mount challenge.
4. Eidolin acknowledges and receives only allowed subscriptions.
5. Pause/hidden routes suspend presentation and SHOULD suspend nonessential ticks.
6. Shutdown flushes an approved save and emits a final diagnostic receipt.

## Migration problem

Existing `eidolon.*`, `lattice.*`, `vibe.*`, battle and wallet-coupled channels cannot simply be renamed. Produce a channel atlas identifying producer, consumer, payload, persistence effect and test before removal. Economy-coupled battle paths require quarantine rather than silent translation.
