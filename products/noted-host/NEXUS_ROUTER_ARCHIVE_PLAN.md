# Nexus Router Archive Plan — v0.03

## Decision

Noted is the outer host. Nexus OS is the router/kernel. Every imported app becomes a Nexus block first, then Noted mounts the Nexus router.

This replaces the earlier “one Noted sidebar route per standalone HTML app” approach with:

```text
Noted desktop app
└── Nexus Router route: /nexus-router
    └── public/nexus/os/Nexus_OS.html
        ├── blocks/apps/nexus-agent-v0.12.html
        ├── blocks/apps/prompt-studio-v3.html
        ├── blocks/vibes/*
        ├── blocks/eidolon/*
        ├── blocks/world/*
        ├── blocks/forges/*
        ├── blocks/system/*
        └── engines/*
```

## What changed in this package

- Added `src/studios/nexusRouter/NexusRouterStudio.tsx`.
- Added Noted route `/nexus-router`.
- Changed `/` to land on `/nexus-router`.
- Made `Nexus Router` the visible Noted sidebar entry.
- Kept the old direct Noted routes `/nexus-agent` and `/prompt-studio-v3` as hidden fallback routes.
- Copied the uploaded Pokemon/Eidolon/Nexus OS archive into `public/nexus/os/`.
- Copied Nexus Agent and Prompt Studio v3 into `public/nexus/os/blocks/apps/`.
- Patched `public/nexus/os/Nexus_OS.html` so the Nexus launcher can open:
  - `Nexus Agent`
  - `Prompt Studio v3`
  - `Pokemon Engine Test`
  - `Nexus Lattice`
- Added `public/nexus/block-registry.json` as the first machine-readable archive map.

## Router rule

New apps should not be added directly to the Noted sidebar by default.

Use this layout:

```text
public/nexus/os/blocks/<category>/<block-name>.html
```

Then add a catalog entry in `public/nexus/os/Nexus_OS.html`.

Only add a Noted route when the app is a major host-level surface, not a normal block.

## Bridge phases

### Phase 1 — Visual/router merge

Status: done in this package.

Nexus routes blocks inside Noted. Blocks keep their own local storage and runtime assumptions.

### Phase 2 — Event bridge

Add a Noted ↔ Nexus bridge that forwards selected events:

- `noted.selection.export`
- `noted.note.created`
- `noted.prompt.saved`
- `ai.response.complete`
- `ai.agent.complete`
- `vibe.save`
- `eidolon.battle.result`

### Phase 3 — Shared object model

Map records between systems:

| Noted object | Nexus object |
|---|---|
| Note | document / reader file |
| Prompt | Prompt Studio snapshot |
| Project | Nexus session / mission |
| Scrap | Companion capture |
| Canvas node | Nexus block launch card |
| Atlas/World item | Vibes world / Eidolon environment |

### Phase 4 — Archive builder

Create a script that rebuilds the archive from a registry:

```text
tools/build-nexus-archive.mjs
```

The script should copy blocks, validate local script refs, generate `block-registry.json`, and fail if a Nexus catalog path points to a missing file.

## Guardrails

- Do not flatten `engines/`; Nexus blocks expect sibling relative paths.
- Do not move `blocks/<category>/<file>.html` without patching catalog paths.
- Keep standalone HTML blocks sovereign until their storage and event contracts are understood.
- Treat `Nexus_OS.html` as the router kernel, not as just another iframe payload.
