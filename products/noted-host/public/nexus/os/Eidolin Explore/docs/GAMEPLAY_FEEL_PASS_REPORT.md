# Gameplay Feel Pass Report

## Goal

Make reading manifestations and battle choices feel earned rather than button-driven, while preserving deterministic derivation and the no-bundler browser ESM setup.

## Changes

- Removed the runtime's forced full battle read. `beginBattle()` now passes the actual manifestation `watchTime` into S4 instead of `Math.max(watchTime, 4)`.
- Added runtime field-read confidence, with thresholds for decoded cue and locked temperament read.
- Changed `Best read` / `R` so it only uses exact pattern information when S4 has revealed it. Below that threshold it only uses locked temperament, and with no reliable read it refuses to invent a hidden answer.
- Updated demo pilot to pause at the manifestation until read confidence is locked before starting battle.
- Reworked HUD messaging to show cue language first, not raw temperament labels.
- Added a field-read panel that teaches cue rhythm and displays read progress.
- Battle panel now distinguishes cue, locked temperament, and exact revealed pattern.

## Design line preserved

The player can still complete the vertical slice quickly, but the clean path is now:

```txt
approach → watch the tell → lock the read → battle with pattern advantage → still → Vessel
```

## Verification

Added `test/gameplay-read.ts` and `npm run gameplay-read`.

The test proves:

- zero observation starts blind
- below-threshold observation does not reveal a pattern
- full observation reveals every next pattern
- using revealed patterns stills the wild within the hard battle cap
