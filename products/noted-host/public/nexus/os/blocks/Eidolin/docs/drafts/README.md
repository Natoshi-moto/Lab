# Eidolin Documentation Drafts

**Status:** working drafts; no authority over runtime behavior
**Component root under review:** `products/noted-host/public/nexus/os/blocks/Eidolin/`
**Last reviewed:** 22 July 2026

This directory is the staging area for a coherent public documentation set for Eidolin and its relationship to Nexus OS and Noted. It exists here because `blocks/Eidolin` is the strongest TypeScript application candidate in the current tree. The documents should move to stable locations only after the duplicate implementations and names have been resolved.

## Proposed documentation map

| Draft | Intended eventual location | Audience |
|---|---|---|
| [`APP_README_DRAFT.md`](APP_README_DRAFT.md) | `blocks/Eidolin/README.md` | Players, evaluators, newcomers |
| [`ARCHITECTURE_DRAFT.md`](ARCHITECTURE_DRAFT.md) | `blocks/Eidolin/docs/ARCHITECTURE.md` | Maintainers and reviewers |
| [`ROUTER_INTEGRATION_DRAFT.md`](ROUTER_INTEGRATION_DRAFT.md) | `nexus/os/docs/EIDOLIN_ROUTER_INTEGRATION.md` | Nexus/Noted integrators |
| [`ANIMATION_AND_RENDERING_DRAFT.md`](ANIMATION_AND_RENDERING_DRAFT.md) | `blocks/Eidolin/docs/ANIMATION_AND_RENDERING.md` | Runtime and visual contributors |
| [`CREATURE_DATA_AND_SAVES_DRAFT.md`](CREATURE_DATA_AND_SAVES_DRAFT.md) | `blocks/Eidolin/docs/CREATURE_DATA_AND_SAVES.md` | Engine and migration contributors |
| [`SOCIAL_AND_SYNTHETIC_ECONOMY_DRAFT.md`](SOCIAL_AND_SYNTHETIC_ECONOMY_DRAFT.md) | `nexus/os/docs/SOCIAL_AND_SYNTHETIC_ECONOMY.md` | Product, safety and protocol reviewers |
| [`TESTING_AND_RELEASE_DRAFT.md`](TESTING_AND_RELEASE_DRAFT.md) | `blocks/Eidolin/docs/TESTING_AND_RELEASE.md` | Release engineers and red teams |

## Proposed canonical product language

- **Eidolin** is the user-facing creature world and assistant identity layer.
- **Creature** is the portable entity the user grows.
- **Nexus Lattice** is the deterministic world/creature engine inside Eidolin, not a competing product name.
- **Eidolin Router** is a Nexus-managed world simulation block. It is not the whole Nexus kernel.
- **Nexus OS** mounts and routes blocks.
- **Noted** is the durable host workspace and user-data boundary.

“Eidolon,” “Edolin,” “Eidolin Explore,” “Eidolin World,” “gold stitch,” and copied forge names remain historical implementation labels until a migration inventory proves which bytes are canonical.

## Current-source warning

At least four near-copies of the TypeScript Lattice source exist under the Nexus OS public tree, alongside older single-file forges and separate router/battle apps. Documentation MUST name the exact path it describes. A passing test in one copy does not establish the behavior of another copy or the app launched by `Nexus_OS.html`.

## Documentation rules

Every feature statement must be labelled:

- `IMPLEMENTED` — present at the named path;
- `EXECUTED` — run during the named verification;
- `EXPERIMENTAL` — present but unstable or isolated;
- `PLANNED` — intended but absent;
- `LEGACY` — retained for migration/reference;
- `UNABLE_TO_VERIFY` — evidence is insufficient.

These drafts deliberately avoid claiming that creature assistants learn today, that spatial Noted data reaches Eidolin today, or that synthetic economy restrictions are already enforced throughout the inherited runtime.
