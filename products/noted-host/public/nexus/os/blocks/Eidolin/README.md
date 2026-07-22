# Nexus Lattice — gold stitch build

> **Documentation note:** this README describes the inherited gold-stitch vertical slice. It is not yet the canonical public Eidolin app README. The proposed documentation structure and replacement drafts begin at [`docs/drafts/README.md`](docs/drafts/README.md).

This is a seam-stabilized TypeScript build made from the uploaded fragmented segment outputs, with a final visual polish pass and judging packet.

## What changed

- Canonicalized the source tree under `src/`.
- Moved deterministic core to `src/core/deterministic.ts`.
- Removed duplicate segment versions from the runnable tree.
- Converted relative imports to browser-valid `.js` ESM specifiers under `moduleResolution: NodeNext`.
- Removed the `performance.now()` dependency from S5 Vessel Ceremony. Wall-clock values are now restricted to runtime/display-only persistence paths.
- Added missing S8 `persistence.ts`.
- Added missing S9 `ui-layer.ts`.
- Added S10-style `runtime.ts` and `index.html` vertical slice.
- Added `test/smoke.ts` for deterministic seam verification.
- Upgraded the runtime shell with a responsive glass HUD, stronger hierarchy, and proof-oriented presentation.
- Added `docs/FINAL_DELIVERY.md` and `docs/PROVIDER_COMPARISON.md` for judging.

## Commands

```bash
npm install
npm run typecheck
npm run build
npm run smoke
```

To run in a browser:

```bash
npm run build
python3 -m http.server 5173
```

Then open `http://localhost:5173/`.

## Current vertical slice

The build supports:

- deterministic terrain and biome rendering
- starter companion derivation
- manifestation slot derivation
- wild creature derivation
- simple battle action flow
- vessel ceremony flow
- offspring derivation at a coordinate
- localStorage save commit with derivation proof verification
- lineage journal rendering
- birth certificate text/image export

This is not a finished game. It is the runnable spine needed before expanding S8/S9/S10 into full production systems.
