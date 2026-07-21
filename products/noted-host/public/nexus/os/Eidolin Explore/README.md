# Nexus Lattice — Beauty Pass Build

Runnable stitched prototype for the Nexus Lattice segment stack, upgraded with a beauty pass: richer atmosphere, stronger creature presence, ceremonial polish, and preserved deterministic seams.

## Run

```bash
npm install
npm run verify
python3 -m http.server 5173
```

Open:

```txt
http://localhost:5173/
```

## Controls

| Control | Action |
|---|---|
| `A/D` or `←/→` | Move |
| `G` | Run demo pilot |
| `P` | Pilgrimage auto-walk |
| `B` | Begin battle |
| `R` | Best read battle action |
| `V` | Open Vessel when bondable |
| `[` / `]` | Select journal creature |
| Backquote | Debug overlay |
| Space | Hold-to-skip repeat vessel ceremonies |

## What the demo pilot does

The demo pilot walks to the nearest manifestation, reads it, starts battle, uses best-read actions, opens the Vessel, and stops after the offspring is committed to the save at Crack.

## Verification

`npm run verify` runs:

- strict TypeScript typecheck
- deterministic smoke test
- battle → vessel → save demo-flow test
- certificate/lineage share-export test
- determinism and browser-ESM audit

See `docs/BEAUTY_PASS_REPORT.md`, `docs/GAMEPLAY_FEEL_PASS_REPORT.md`, `docs/FEEL_PASS_REPORT.md`, and `docs/VERIFY_RUN.log`.
