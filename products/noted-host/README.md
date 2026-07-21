# Noted

**Lab package:** `noted-host`  
**Parent programme:** `NOTED_PROJECT_OS_001`  
**Status authority:** `NONE`  
**Real-world value forbidden:** `true`

Lab is the corpus authority for this package. This Phase 0 import is a
buildable local-first host seed, not a production release and not a surface
for money, tokens, custody, redemption, or other real-world economic value.

**Status:** early v0.01 source/build candidate — not a polished public release.

Noted is a private knowledge foundry: a local-first creative workspace for complex ideas, prompts, notes, longform work, canvas thinking, and project context.

**Tagline:** Private by default. Relational by design. Portable by right.

## What this is

Noted is designed as a personal workspace rather than a hosted service. In the current architecture:

- no account is required;
- no server is required for normal local use;
- no cloud sync is required;
- no telemetry pipeline is present in the app architecture reviewed for this bundle.

The internal app ID remains `noted-v0.01`. Some compatibility storage names still use the legacy `verse-studio:*` prefix. That is intentional and should not be renamed casually.

## Current evidence level

This repository candidate has source and build verification from the latest Builder sweep. Runtime UI verification for the preceding UX sweep may still be pending unless a later diagnostic/runtime attestation is supplied.

Do not treat this as production-ready software. Back up important work before experimenting.

## Development

```bash
npm ci
npm run dev
npm run typecheck
npm run build
```

`npm run preview` is also available for previewing the Vite build output.


## AI Brief Export

Prompt Studio includes **Export AI brief**, a local JSON download that summarizes the current Noted topology for AI review. It does **not** send data anywhere, does not run an AI model, and does not import or write anything back into the workspace. The exported file may contain private titles and snippets, so treat it like user data.

## Build outputs

The build uses Vite and then `pack.js` creates single-file HTML artifacts:

- `dist/` — Vite output.
- `verse-studio.html` — compatibility single-file HTML artifact.
- `noted-v0.01.html` — Noted single-file HTML artifact.
- `noted-v0.02.html` may exist as a carried generated artifact from prior packaging work.

The generated HTML files are included in delivery ZIPs for inspection/use. Whether they belong in a public GitHub repo or only in GitHub Releases is still an owner decision.

## New-user guide

See [`NOOB_GUIDE.MD`](NOOB_GUIDE.MD) for plain-language setup and usage notes.

## AI-assisted maintenance

AI maintainers should start with:

- [`AI_README.MD`](AI_README.MD)
- [`AI_CODEBASE_HANDOFF.MD`](AI_CODEBASE_HANDOFF.MD)
- [`PREFLIGHT.MD`](PREFLIGHT.MD)

These files are operational governance. They are not product marketing copy.



## Nexus Panel

The Nexus Panel is the right-side relational context panel. It is open by default so connections, tags, snapshots, and lineage are visible while you work. You can collapse it and Noted will remember your choice locally.


## Schema status

Current internal database/schema constants are `DB_VERSION = 11` and `SCHEMA_VERSION = 10` after Sweep 57. This is a local data-model alignment, not a public release or license decision. Older workspace exports up to schema 10 remain accepted by import.

## License

No owner-selected LICENSE file is present in this bundle. Do not assume an open-source license until the owner chooses one and adds it explicitly.
