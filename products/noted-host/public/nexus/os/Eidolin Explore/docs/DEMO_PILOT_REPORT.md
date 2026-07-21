# Demo Pilot Report

This pass turns the prior playable spine into a more presentable prototype loop.

## Additions

- Added **Run demo** button and `G` hotkey.
- Demo pilot walks toward the nearest manifestation, starts battle when the tell is close enough, chooses best-read battle actions, opens the Vessel, and stops after the offspring birth record is committed.
- Added journal creature navigation with `[` / `]` plus HUD buttons.
- Added selected-creature status line in HUD.
- Added lineage JSON export from the current journal selection.
- Added share/export verification test for certificate text and lineage JSON.

## Guardrails retained

- `performance.now()` remains runtime-only.
- Wall-clock values remain display-only.
- Vessel still requires a bondable wild parent.
- Save commit still happens at ceremony crack.
- Proof hash still verifies after reload.

## Verified command

```bash
npm run verify
```

Passes:

- typecheck
- smoke
- demo-flow
- share-export
- audit
