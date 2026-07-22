# Eidolin Architecture Draft

## Scope

This document describes the proposed relationship among existing Eidolin-related code. It does not declare a canonical implementation.

## Present implementation families

```text
Noted React host
└── NexusRouterStudio iframe
    └── Nexus_OS.html
        ├── shared Eidolon renderer/storage adapters
        ├── forge and battle HTML blocks
        ├── blocks/eidolon/eidolon-router.html
        ├── blocks/eidolon/eidolon-os.html
        └── TypeScript Lattice candidates
            ├── blocks/Eidolin/
            ├── Eidolin World/
            ├── Eidolin Explore/
            └── nexus-lattice-gold-stitch/
```

The duplicated TypeScript candidates share filenames and concepts but MUST be compared by digest and behavior before consolidation. The older forge/adapters are not automatically obsolete: some are the paths actually mounted by Nexus OS.

## Proposed responsibility split

### Deterministic core

Pure functions only: seeded hashing/randomness, terrain, biomes, DNA, naming, manifestation slots, battle resolution and offspring derivation. The same seed and inputs MUST yield the same result independent of frame rate and wall clock.

### Simulation state

Explicit state machines for exploration, manifestation, battle and ceremony. State transitions consume bounded inputs and simulation delta. Display time MUST NOT affect identity or derivation.

### Renderer

Canvas 2D presentation of world, creature, HUD and effects. Rendering reads state and does not decide canonical outcomes. Visual interpolation MAY vary by device; simulation results MUST NOT.

### Persistence

Versioned creature, world and run state; pending/backup commit path; proof verification; migration; export/import. Browser storage is an adapter, not the data model.

### Nexus adapter

Declares channels and translates internal actions into the Nexus envelope. It MUST NOT expose persistence internals or accept unvalidated host messages.

### Assistant adapter — planned

Connects a creature identity to a chosen model, bounded Noted context and reversible proposals. It is outside the deterministic game core.

## Proposed package boundaries

```text
src/core/          deterministic functions and types
src/sim/           state machines and reducers
src/render/        Canvas 2D and animation presentation
src/persistence/   schemas, migrations, browser adapter, export
src/nexus/         managed-block client and event translation
src/assistant/     model-neutral creature interaction contracts
src/runtime/       boot, input and composition
test/              unit, property, integration and mutation tests
```

This is a target layout. Existing files should not be moved until import graphs, launched paths and copy differences are recorded.

## Invariants

- Identity derivation never consumes wall-clock time.
- Renderer state cannot change battle truth.
- A user can export a creature without exporting a model credential.
- AI-generated memories and graph proposals retain provenance.
- A block cannot write Noted state without a routed, receipted capability.
- Tips, ranks and progression cannot be sold, sent, redeemed or wrapped.
- Unknown schema versions fail without destroying the last good save.

## Open decisions

- Which TypeScript copy becomes canonical?
- Is `Eidolin Router` retained as a separate headless simulation block?
- Which forge schemas survive migration?
- Is the primary world continuous-X, an authored tile map, or two modes?
- Which animation parameters are deterministic state versus presentation?
- What creature history is portable without exposing private Noted material?
