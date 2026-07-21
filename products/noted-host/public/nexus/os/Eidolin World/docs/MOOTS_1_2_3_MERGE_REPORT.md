# Moots 1/2/3 merge report

## Input zips

- `Moots 1.zip`: S0/S1/S2 fragment set plus S4/S6.
- `Moots 2.zip`: S2 newer fragment, S3, early `types.ts`, and prototype reference files.
- `Moots 3.zip`: latest `types.ts`, S3, S5, S7, and prototype reference files.

## Canonical file choices

| Runtime file | Source selected | Notes |
|---|---|---|
| `src/types.ts` | `Moots 3/types(4).ts` | Latest and broadest schema. |
| `src/core/deterministic.ts` | `Moots 1/deterministic(1).ts` | Browser-safe `.js` import patched. |
| `src/dna-name.ts` | `Moots 1/dna-name(2).ts` | Browser-safe `.js` imports patched. |
| `src/manifestation.ts` | `Moots 2/manifestation(1).ts` | Browser-safe `.js` imports patched. |
| `src/spatial-bonding.ts` | `Moots 2/spatial-bonding.ts` | Browser-safe imports plus strict key cast patch. |
| `src/battle.ts` | `Moots 1/battle.ts` | Browser-safe imports plus exhaustive switch patch. |
| `src/vessel-ceremony.ts` | `Moots 3/vessel-ceremony.ts` | `performance.now()` removed; S10/S8 own display-only wall-clock. |
| `src/creature-renderer.ts` | `Moots 1/creature-renderer.ts` | Browser-safe imports patched. |
| `src/world-renderer.ts` | `Moots 3/world-renderer.ts` | Browser-safe imports patched. |
| `src/persistence.ts` | New seam implementation | S8 localStorage save/proof spine. |
| `src/ui-layer.ts` | New seam implementation | S9 journal/certificate spine. |
| `src/runtime.ts` | New seam implementation | S10 vertical-slice browser runtime. |

## Duplicate handling

The raw zips contain multiple generated variants such as `types.ts`, `types(1).ts`, `types(2).ts`, `types(3).ts`, `types(4).ts` and `dna-name.ts`, `dna-name(1).ts`, `dna-name(2).ts`.

Only one canonical version is allowed in `src/`. Raw duplicate files are intentionally excluded from the runnable tree to prevent segment drift.

## Prototype handling

`preview(2).html` and `nexus_lattice_vertical_slice_v_1.jsx` were treated as references, not runtime dependencies. The locked stack is TypeScript + Canvas 2D + native ES modules.

## Verified commands

```bash
npm run build
npm run smoke
npm run audit
```
