# Animation and Rendering Draft

## Current rendering claim

The TypeScript Lattice candidate uses Canvas 2D. `runtime.ts` owns the `requestAnimationFrame` loop and draw orchestration. `world-renderer.ts` paints continuous procedural terrain and atmosphere. `creature-renderer.ts` derives visual anatomy and gait from creature DNA. UI and ceremony rendering are separate modules. Older Nexus surfaces also animate desktop companions and backgrounds through shared JavaScript adapters.

This is procedural vector/canvas animation, not a sprite-sheet pipeline.

## Animation philosophy

Animation should make a creature's derivation legible. Weight, gait, hesitation, attention, terrain and temperament should affect motion in ways a player can learn. It should not merely add particles around an otherwise arbitrary rarity score.

The intended visual grammar is:

- **body:** mass, height, width, taper and translucency;
- **locomotion:** stride, bob, squash, limb/tendril motion, hover and slope lean;
- **attention:** gaze, turn, cryptic tell and approach/withdrawal;
- **world:** terrain slope, parallax, biome blend and landmark influence;
- **ceremony:** state-bound visual phases that do not determine the offspring;
- **battle:** effects that represent already resolved actions rather than choose outcomes.

## Deterministic versus presentational time

Simulation and identity MUST use seeded inputs and bounded simulation time. Rendering MAY use frame timestamps for interpolation, accessibility effects and display-only polish. A dropped frame MUST NOT alter DNA, encounter choice, battle outcome, birth traits or save proof.

Recommended loop:

```ts
accumulator += Math.min(frameDelta, MAX_FRAME_DELTA);
while (accumulator >= FIXED_STEP) {
  state = update(state, input, FIXED_STEP);
  accumulator -= FIXED_STEP;
}
draw(state, accumulator / FIXED_STEP);
```

The current runtime must be reviewed before claiming it follows this fixed-step form.

## Accessibility requirements

- Reduced-motion mode disables flicker, shake, rapid parallax and nonessential pulses.
- Meaning is never encoded by animation or colour alone.
- Battle and ceremony sequences can be skipped after canonical outcomes are fixed.
- Canvas has a meaningful label and a text/status alternative for important state.
- Flashing remains below accepted safety thresholds.
- Pause stops simulation where promised, not only the renderer.

## Asset strategy — planned

The current empty asset manifest provides a seam, not a production pipeline. A future asset reference should include ID, media type, digest, dimensions/duration, license/attribution and deterministic fallback. Missing art MUST fall back to procedural rendering without changing simulation identity.

## Animation tests

- Same seed/input produces identical simulation snapshots at 30, 60 and irregular FPS.
- Pausing and resuming does not advance canonical state unexpectedly.
- Reduced-motion mode preserves all controls and information.
- Renderer accepts extreme valid genes without NaN, clipping crashes or unbounded allocation.
- Resize and device-pixel-ratio changes do not change world coordinates.
- Battle effect order cannot alter battle resolution.
- Ceremony skip cannot produce a different offspring.
- Screenshot tests are treated as presentation evidence only.

## Questions for the operator

- Should creatures feel animal, spectral, mechanical or deliberately uncategorizable?
- Which motion should visibly develop as the assistant learns?
- Should the Noted canvas ever become a navigable creature landscape, or remain a separate cognitive surface?
- Which animations are signature identity and therefore portable across renderers?
