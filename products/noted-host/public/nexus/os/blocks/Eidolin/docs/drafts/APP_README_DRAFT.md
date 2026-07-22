# Eidolin

> A deterministic creature world being developed into the living assistant layer of Nexus OS.

**Draft status:** experimental pre-release documentation. The current code is a vertical slice, not a finished game or AI assistant.

**Synthetic boundary:** `NON-TRANSFERABLE · NON-REDEEMABLE · STRICT NO SALE`

## What Eidolin is meant to become

Eidolin is where a Nexus creature lives, moves, develops and becomes understandable to its user. The long-term creature can provide a consistent identity for a local language model or a user-selected API model while keeping its portable history, preferences, lineage and earned skills under user control.

The creature is intended to become useful through interaction: helping inspect Noted projects, explaining topological relationships, challenging assumptions, learning approved preferences and surviving adversarial scenarios. It is not valuable because a balance, marketplace or sales pitch assigns it a price.

## What this component implements now

At `blocks/Eidolin`, the current TypeScript vertical slice includes:

- deterministic terrain and biome sampling;
- procedural creature DNA, names and gait traits;
- continuous horizontal exploration across world coordinates;
- manifestation and encounter state machines;
- a simple battle flow;
- a vessel/birth ceremony and offspring derivation;
- Canvas 2D creature and world rendering;
- local save, pending-save and backup-save slots;
- derivation-proof checks during persistence;
- lineage display and birth-certificate export.

These capabilities are source-level claims until the exact release copy is built and executed. Other similarly named directories cannot be assumed equivalent.

## What is not implemented here

- A conversational local-model or API assistant loop.
- Unified ingestion of Noted topology and canvas coordinates.
- A general tile-map editor or authored RPG world format.
- A production asset pipeline for sprites, tiles, audio and animation clips.
- Portable cross-device identity reconciliation.
- Approved Nostr publishing through an isolated signer.
- A compliant social/status layer with strict no-sale enforcement.
- A completed integration with Nex-Sim.

## Run the candidate vertical slice

From this directory:

```bash
npm install
npm run typecheck
npm run build
npm run smoke
```

Then serve the Nexus OS public directory over HTTP and open the component's `index.html`. Do not use `file://` as proof of host integration; iframe and module behavior differs across origins.

## Controls and play loop

The exact controls should be generated from the runtime before final publication. The intended loop is:

```text
explore deterministic terrain
→ notice a manifestation
→ approach, wait or withdraw
→ enter a bounded encounter
→ battle or resolve
→ preserve a creature/lineage outcome
→ export or continue
```

The app should explain why a creature looks and moves as it does. DNA, biome, slope, landmark, seed and lineage should remain inspectable rather than becoming hidden rarity machinery.

## Data and privacy

The current candidate stores saves in browser localStorage. Local storage is convenient, not a backup and not a secure key store. Keep exports. Valuable signing keys and API credentials must not be stored by Eidolin.

## Relationship to the larger system

Noted owns durable user material. Nexus OS mounts and routes tools. Eidolin provides the creature/world experience. A future model adapter may let a creature reason over an explicit, user-previewed Noted export. Model output returns as a proposal and cannot silently rewrite user-authored material.

## Contributing

The most useful contributions currently are:

- identify and eliminate duplicate source copies;
- make a clean build reproducible;
- document controls from code;
- add deterministic animation tests;
- test corrupted and conflicting saves;
- define the Router event contract;
- replace legacy financial metaphors with synthetic, non-transferable records;
- provide minimal reproducible failures rather than screenshots alone.

See the draft architecture and release documents beside this file before changing shared types or persistence.
