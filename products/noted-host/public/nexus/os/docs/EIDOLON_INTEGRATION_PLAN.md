# EIDOLON_INTEGRATION_PLAN

## Status

Sweep 15 has moved the recovered Eidolon forge material from passive archive into active Nexus UX/runtime infrastructure.

Verification:

```text
bash tests/run.sh
526 passes / 0 fails
```

```text
node tools/channel-atlas.js --check
docs/CHANNEL_ATLAS.md is up to date
```

## Canonical adapter layer

The integration layer is now:

```text
engines/eidolon-schema.js
engines/eidolon-creature-renderer.js
engines/eidolon-environment-renderer.js
engines/eidolon-battle-renderer.js
engines/eidolon-storage.js
```

These files provide the canonical UI data shapes and live canvas renderers for player-created creatures, worlds, and attacks. They are intentionally UI/runtime adapters. They do not change wallet/economy/witness/battle-outcome math.

## Active UX integrations

- `blocks/world/first-contact.html` uses live creature + world canvases and stores canonical selected specs.
- `Nexus_OS.html` renders the selected world as an animated desktop background and the selected companion as a bottom-left animated inhabitant.
- `blocks/forges/lattice-shell.html` is the axis-level creature forge.
- `blocks/forges/environment-forge.html` is the axis-level world forge.
- `blocks/forges/compose-stage.html` is now a Battleforge-style attack authoring surface.
- `blocks/apps/companion.html` can read canonical `axes` specs and imports Home Notes more reliably.
- `blocks/apps/nexus-webviewer.html` has repaired back/forward history behavior.

## Still future work

- Turn Multiforge into an active fast 3×3 creature/world candidate surface rather than only preserving the legacy file.
- Replace/adapt `the-room.html` internals with the shared battle preview engine where safe.
- Add deeper player controls for saving/loading templates across Library/Atlas surfaces.
- Audit all amber UI signals and move non-warning decorative amber toward cyan/ink.

## Rule

Do not remove `legacy/eidolon-forges/`. It is the canon reference library for interaction feel, not dead debris.

## Sweep 16 calibration — First Hour UX

Sweep 16 adds the first-hour onboarding layer over Living Forge OS: active Nexus-native Multiforge, clearer First Contact outcome copy, companion first-time callout, visible Home Notes → Companion handoff, Wallet zero-start explanation, Web Viewer empty/blocked/disabled states, and Player Thread v2 guidance. Runtime scope remains UX/UI only; wallet canon remains one visible NEX balance starting at 0.
