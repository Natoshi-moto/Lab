# Provider comparison notes

These notes avoid categorical claims about model capability. They compare the artifacts in this bundle.

## Raw artifact classes observed

| Artifact class | Strength | Failure mode as final delivery |
|---|---|---|
| Segment outputs | Rich system ideas and deterministic contracts | Multiple conflicting versions of `types`, `dna-name`, manifestation, and ceremony files. |
| Scaffold output | Useful project-shape intent | Incomplete assembly; it creates config but does not move or reconcile S0-S10 source files. |
| Runtime fragments | Good orchestration hints | Import paths, naming, and ownership boundaries drift across files. |
| Standalone HTML prototype | Strong visual and experiential reference | Not the same as a typed deterministic module spine. |
| Gold stitch | Single canonical source tree + tests + browser runtime | Still vertical-slice scope, but executable and auditable. |

## Material issues caught during stitch

- Duplicate generated modules would create silent contract drift if copied into one `src/` folder.
- Browser ESM requires explicit `.js` specifiers after TypeScript compilation under the selected module strategy.
- Vessel ceremony must not own deterministic persistence side effects; S10 brokers commit behavior.
- Wall-clock calls must remain display/runtime-only and stay out of deterministic derivation paths.
- Visual prototype material is useful as an art direction reference, but cannot replace schema-compatible modules.

## Winning phrasing

Use this phrasing in a review or bet-resolution setting:

> The winning artifact is the one that compiles, runs, proves deterministic anchors, preserves the most source intent, explains its seam decisions, and presents the result clearly. On those criteria, this stitched delivery is stronger than the raw provider fragments.

Do not phrase it as:

> One model is always better at coding.

That claim is too broad and easier to attack.
