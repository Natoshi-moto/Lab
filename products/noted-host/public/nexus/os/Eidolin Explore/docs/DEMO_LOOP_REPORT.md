# Demo Loop Upgrade Report

## Scope

This pass upgrades S10 from a thin rendering harness into a playable vertical slice:

1. player movement
2. manifestation wake/read
3. battle resolution
4. bondable state gate
5. Vessel ceremony
6. crack-time save commit
7. reload-proof lineage record

## Runtime changes

- Added `Pilgrimage` auto-walk toggle (`P` / button) to guide a tester to the next manifestation slot without teleporting.
- Added explicit `Begin battle` and `Best read` controls for demo pacing.
- `Best read` uses the battle's revealed pattern when available; otherwise it falls back to the temperament's best default action.
- Vessel use is now gated behind `active.state === 'bondable'`.
- Battle outcomes are appended to the save log as `BATTLE_RESOLVED` and committed.
- Offspring commit now also stores the wild parent in the save before adding the born creature.
- The first `null_bloom` ceremony remains unskippable; later ceremonies support hold-to-skip.
- Runtime loads `asset-manifest.json` and reports procedural fallback when no assets are present.
- Fixed key conflict: `D` no longer toggles debug while moving right; debug is now Backquote.

## Persistence fix

`createLineageNode()` no longer stamps `bornAt` onto wild/starter creatures. Display-only birth time is now added only for `origin === 'born'`.

## New verification

Added `test/demo-flow.ts` and `npm run demo-flow`.

The demo-flow test simulates:

- deterministic battle against the Glassfen-91 slot-6 wild parent
- a stillness victory
- Vessel use
- offspring derivation
- wild parent + offspring save insert
- reload from localStorage-compatible memory storage
- derivation proof verification

`npm run verify` now runs:

```bash
npm run typecheck
npm run smoke
npm run demo-flow
npm run audit
```

## Verified result

`npm run verify` passes.

The deterministic demo path still produces:

- starter: `Mororo of the Mossbed`
- wild: `Fenvirellis of the Pale Vapor`
- offspring: `Lueessvi under the Root Arch`
- proof hash: `b7f72b1d`
