# EIDOLON_FORGE_CANON

## Purpose

This document preserves and interprets the four recovered Eidolon forge files as UX canon for Nexus. They are currently archived under `legacy/eidolon-forges/` and are intentionally not wired into the launcher in this pass. The next implementation sweep should use them as the source material for turning the current Nexus creature/world/battle creation UX into something live, animated, customizable, and player-controlled.

## Reintroduced source files

| Preserved file | Original uploaded file | Canonical role |
|---|---|---|
| `legacy/eidolon-forges/eidolon-forge.html` | `eidolon-forge(2).html` | Creature forge reference. |
| `legacy/eidolon-forges/eidolon-multiforge.html` | `eidolon-multiforge.html` | Creature/environment randomizer grid and template reference. |
| `legacy/eidolon-forges/eidolon-battleforge.html` | `eidolon-battleforge.html` | Battle/attack forge reference. |
| `legacy/eidolon-forges/eidolon-environment-forge.html` | `eidolon-environment-forge(2).html` | Environment forge reference. |

## What these files prove

### 1. Creation should be live and canvas-first

The old tools put the visual stage first and keep controls adjacent. The user does not pick from static cards; they watch the artifact animate while they adjust it. Future Nexus surfaces should stop using static/amber placeholder cards where an animated canvas can show the actual creature, world, or attack.

### 2. Randomization must be steerable

The canonical pattern is not “randomize once and accept.” It is:

1. generate a grid or full candidate,
2. inspect live previews,
3. select a candidate,
4. lock or template what works,
5. reroll around it,
6. save the result.

This should replace the current weak First Contact / Environment Forge experience.

### 3. Axes are better than fake presets

The environment forge explicitly states that each axis should do one visible thing and avoids bundled biome/weather abstractions. This is the right game feel: user-facing creation should expose meaningful axes rather than hide five changes behind one vague preset.

### 4. Labels belong to the user

The creature forge allows axis labels to be renamed and saves those labels. That is not cosmetic; it lets the player invent their own language for what the creature is. Nexus should carry this forward into library/spec views.

### 5. Templates are player-authored mechanics

Multiforge and Battleforge both use saved templates as custom randomizer anchors. This gives the player control without requiring expert manual tuning every time. Future Nexus should treat templates as first-class user creations.

### 6. Battle creation is animation design, not a form

Battleforge includes phase playback, scrubber, replay speed, phase colors, grid variants, and attack templates. Compose Stage should be refactored around this model. A human should be able to see anticipation/strike/impact/recovery, scrub it, and save attacks.

### 7. World and companion must be linked visually

The environment forge includes test creature silhouettes for compatibility. That is the missing Nexus behavior: when selecting a world, the player should see how their companion exists in it. When selecting a companion, the player should see the home world behind it.

## Required future integration direction

### First Contact

First Contact should become a gentle wrapper over the recovered creation grammar:

- left side: live companion canvas;
- right side: live world canvas;
- controls: randomize, lock companion, lock world, edit name, advanced axes;
- save: writes selected companion/world specs to the same Nexus storage keys already used by the current app;
- no NEX grant.

### Companion

The bottom-left companion should render from the same creature spec / axes model rather than from a static or simplified placeholder. It should animate at idle, react to notifications, and later become the API-backed assistant surface without changing the underlying identity model.

### Desktop / world background

The selected environment should render from the environment forge axes and remain alive: sky pulse, stars, parallax silhouettes, fog, particles, and foreground drift. Static CSS gradients are acceptable only as temporary fallbacks.

### Environment Forge

The current in-app environment forge should be replaced or deeply refactored using `legacy/eidolon-forges/eidolon-environment-forge.html` as the source. Preserve:

- 16:9 stage;
- sky/far/mid/ground/foreground/ambient axis groups;
- axis sweep;
- editable labels;
- save/load plain JSON;
- optional creature silhouettes.

### Creature Forge / Lattice Shell

The current Lattice Shell should move toward `eidolon-forge.html`:

- body/appendage/eye/surface/particle/glow/color axes;
- lockable randomization;
- group randomization;
- axis sweep;
- editable labels;
- JSON save/load;
- live animated canvas.

### Compose Stage / Battle Forge

The current Compose Stage should not remain a static router long term. It should either embed or launch a Nexus-integrated version of `eidolon-battleforge.html`:

- 3x3 attack candidate grid;
- anticipation/strike/impact/recovery phase model;
- phase scrubber;
- replay speeds;
- jitter slider;
- attack templates;
- save attack specs to library.

### Multiforge

`eidolon-multiforge.html` should become the fast ideation mode:

- creature/environment mode switch;
- 3x3 random grid;
- click-to-select;
- save templates;
- jitter around saved templates.

It should be available after First Contact or from Library/Forge surfaces.

## Integration rules

- Do not bulk-copy these files into active blocks without adapting the Nexus block protocol.
- Do not lose the directness of their UI while adapting them.
- Do not replace axes with vague presets.
- Do not make creation static.
- Do not generate NEX or economy state from creation.
- Do preserve plain JSON round-trips.
- Do preserve deterministic rendering and local regeneration.
- Do preserve user control: sliders, locks, sweep, templates, save/load.

## Immediate bug/UX report implications

The user’s current complaints align with gaps these files solve:

- Static companion/world cards should become animated forge canvases.
- Environment pick should show the actual world, not just metadata.
- Creature pick should show the actual companion, not a proxy card.
- Compose Stage confusion should be resolved by using Battleforge’s phase/grid/playback model.
- “Everything boring” is mostly a lack of visible live feedback; the old forges are already built around feedback.
- Home background should be the selected world renderer, not a loosely themed wallpaper.
- Companion should be the selected creature renderer, not a separate decoration.

## Open implementation questions for next sweep

- Should the active Nexus block implementations import renderer logic from these preserved files, or should renderer logic be extracted into shared `engines/` modules first?
- Should First Contact embed simplified creature/environment axes, or open advanced forge panes after initial randomization?
- What is the exact JSON bridge between `eidolon-forge/1`, `eidolon-environment/1`, current `vibe.save` envelopes, and `nexus:selected-*` keys?
- Should Multiforge become one active block, or should its grid/template logic be folded separately into Creature Forge and Environment Forge?
- How should the selected companion’s idle animation be rendered in OS chrome without duplicating canvas logic across blocks?

---

## Sweep 15 — Living Forge OS integration (2026-05-09)

Calibration baseline after this sweep: **526 passes / 0 fails** via `bash tests/run.sh`; `node tools/channel-atlas.js --check` passes with **67 channels across 35 blocks**.

Material user-facing changes:
- Added shared Eidolon UX/runtime adapters: `engines/eidolon-schema.js`, `engines/eidolon-creature-renderer.js`, `engines/eidolon-environment-renderer.js`, `engines/eidolon-battle-renderer.js`, `engines/eidolon-storage.js`.
- First Contact now uses the shared live creature/world forge renderers and emits both `system.companion.selected` and `system.environment.selected` on acceptance.
- The OS shell now renders the selected environment as an animated desktop canvas and the selected companion as an animated bottom-left inhabitant.
- Lattice Shell is now a real axis-level creature forge with editable labels, locks, sweeps, group randomize, and selected-companion persistence.
- Environment Forge is now a full axis-level world forge with presets, 16:9 live canvas, sweep controls, creature silhouette preview, Library save, and Atlas fallback.
- Compose Stage is now a Battleforge-style scrub/playback attack authoring surface with 3x3 candidates, phase bar, templates, and `system.attack.selected`.
- Web Viewer now has a persistent history stack, repaired back/forward routing, search fallback, and Delete/Backspace shielding in the URL bar.
- Companion imports canonical Eidolon `axes` specs and polls the Home Notes inbox for same-tab iframe writes.

Preserved invariants:
- Wallet remains zero-start and one visible NEX balance.
- No economy, witness, ranked-battle, or deterministic battle math was changed.
- Legacy Eidolon files remain preserved under `legacy/eidolon-forges/` as canon/source material.

