# Seam audit

## Preserved

- `TERRAIN_STEP = 128`.
- S0 has no browser APIs, async, `Math.random()`, wall clock, or DOM access.
- Manifestation slots preserve the shared-place/personal-apparition split.
- Offspring ID remains content-addressed through S3.
- Save file keeps `schemaVersion: 1`, `algoVersion`, inventory hooks, and derivation proof.
- `performance.now()` appears only in S10 runtime timing/rendering paths.

## Intentional contract decisions

### S7 renderer contract

The uploaded S7 changed `drawParallax` and `drawTerrain` to accept `realmSeed` instead of a precomputed `BiomeBlend`.

Decision: accepted.

Reason: S7 owns the visual distinction between forecast biome sampling and current terrain biome sampling. Passing only one blend would hide the “sky changes before the ground” rule from the renderer.

### S6 dependency on S2

The uploaded S6 imports `temperamentConfig` from S2 to render cryptic tells.

Decision: accepted for now.

Reason: it compiles and avoids duplicating temperament visual thresholds. If dependency loops appear later, move the tell config into a shared pure data module.

## Remaining risks

- S10 is a vertical-slice runtime, not the final 800-line game runtime.
- S8 persistence is localStorage-first and schema-stable, but it does not yet replay every action to reconstruct creatures from an action log.
- S9 certificate is functional and legible, but not art-final.
- The existing S0/S1/S2 files have minor duplicate object keys in comments/code style inherited from segment generation; they compile but should be cleaned in a style pass.
