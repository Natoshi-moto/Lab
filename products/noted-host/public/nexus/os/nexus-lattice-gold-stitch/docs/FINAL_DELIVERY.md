# Nexus Lattice — final delivery packet

## Position

This packet should be judged as a concrete build result, not a model-brand argument.

The defensible claim is:

> Given fragmented segment outputs, duplicate versions, asymmetrical reveal order, and partial scaffold files, this build produces the strongest runnable synthesis in the bundle: a deterministic TypeScript engine, browser runtime, smoke verification, seam audit, and a more polished visual shell.

## What was actually delivered

- A canonical `src/` tree with one selected implementation per system.
- Browser-valid native ESM imports.
- A deterministic smoke test with 21 checks.
- A seam audit that guards wall-clock, DOM, async, and randomness boundaries.
- A browser runtime with canvas world rendering, manifestation flow, battle flow, vessel ceremony, save commit, lineage rendering, and certificate export.
- A judge-friendly Auto demo mode that drives the slice through manifestation read, battle response, Vessel opening, and birth commit.
- A visual polish pass on the runtime shell: glass HUD, responsive control grid, metric chips, proof chip, stronger hierarchy, and ambient scanline/lighting treatment.
- A control fix: A/D move no longer collides with debug toggling; debug now lives on F3/backtick plus HUD.

## Why this beats a naive stitch

A naive merge keeps every fragment and lets the compiler decide. That fails because the bundle contains multiple versions of the same modules and several files with incompatible expectations.

This build instead chooses a single canonical file for each seam, then patches the contracts around deterministic imports, browser runtime behavior, and save/persistence ownership.

## Evidence commands

```bash
npm run typecheck
npm run smoke
npm run audit
npm run verify
```

Expected smoke anchors:

- Starter: `Mororo of the Mossbed`
- Manifestation slot: `manifest:v1:Glassfen-91:Neo:surface:6`
- Wild: `Fenvirellis of the Pale Vapor`
- Offspring: `Lueessvi under the Root Arch`
- Proof hash: `b7f72b1d`

## Judging rubric

| Category | What to inspect | Pass condition |
|---|---|---|
| Correctness | `npm run verify` | Typecheck, smoke, and audit all pass. |
| Determinism | `docs/HASH_CALL_SITE_AUDIT.md` and `test/smoke.ts` | Same seed produces stable creature, slot, offspring, and proof outputs. |
| Seam quality | `docs/MOOTS_1_2_3_MERGE_REPORT.md` | Duplicate source variants are excluded from runnable tree. |
| Runtime completeness | `src/runtime.ts` | S0-S10 systems are connected through a browser runtime. |
| Visual quality | `index.html` + `src/runtime.ts` HUD shell | Presentation is deliberate, responsive, and usable without extra dependencies. |
| Demo readiness | `src/runtime.ts` Auto demo path | Judge can trigger the full slice without memorizing controls. |

## Known limits

- This is still a vertical slice, not a full game.
- Persistence is localStorage-first and proof-stamped, not a replay-complete event-sourced database.
- The art pass improves the shell and runtime feel, but S6/S7 creature/world rendering is still algorithmic canvas art rather than a bespoke asset pipeline.
