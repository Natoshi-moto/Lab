# Legacy Eidolon Forges

These files were reintroduced during the Eidolon forge preservation pass on 2026-05-09 after the operator identified them as the original UX reference for Nexus creature/world/battle creation.

## Files

| File | Role | Runtime status |
|---|---|---|
| `eidolon-forge.html` | Single-creature axis forge. Sliders, editable labels, axis sweep, lockable randomization, JSON save/load. | Preserved reference; not wired into the launcher in this pass. |
| `eidolon-environment-forge.html` | Layered 16:9 environment forge with sky/far/mid/ground/foreground/ambient axes plus test creature silhouettes. | Preserved reference; not wired into the launcher in this pass. |
| `eidolon-multiforge.html` | 3x3 randomizer/template grid for creature and environment variants. | Preserved reference; not wired into the launcher in this pass. |
| `eidolon-battleforge.html` | 3x3 attack animation generator with phase scrubber, templates, replay speed, and attack axes. | Preserved reference; not wired into the launcher in this pass. |

## Canonical interpretation

These are not disposable prototypes. Treat them as UX canon for future Nexus creation surfaces:

- User-adjustable axes are the main interaction model.
- Randomization is live and inspectable, not a one-shot opaque roll.
- Every slider/axis should map to one visible behavior.
- Creature, environment, and attack creation should be animated by default.
- Saved outputs should remain plain JSON specs that can round-trip.
- Templates are player-authored randomizer anchors.
- The current in-app First Contact / Environment Forge / Compose Stage should evolve toward this feel rather than away from it.

See `docs/EIDOLON_FORGE_CANON.md` for the integration report and future implementation plan.
