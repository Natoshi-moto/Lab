# AI-GENERATED DESIGN BRIEF — Noted v0.01

**Status:** AI-generated design brief.  
**Authoring mode:** AI synthesis from the accepted Sweep 60.3 package baseline and Orchestrator acceptance context.  
**Canonical priority:** This brief is guidance only. If this document conflicts with source code, `ORCHESTRATION_STATE.MD`, `PREFLIGHT.MD`, `AI_CODEBASE_HANDOFF.MD`, or accepted delivery reports, those files win.

---

## 1. Product frame

Noted v0.01 is a private-first thinking workspace for writing, notes, project memory, prompt work, and relational context. The current identity is **Noted v0.01**; the storage identity intentionally remains `verse-studio` for compatibility.

The product should feel like a calm local studio rather than a cloud dashboard. It should help a user capture fragments, shape longer work, and see relationships between records without turning the interface into a noisy graph toy.

Core promise:

> A private workspace where notes, drafts, projects, prompts, and context stay connected without demanding constant organization.

---

## 2. Current canonical baseline

This brief assumes the accepted Sweep 60.3 package baseline.

```text
App identity:         Noted v0.01
Storage identity:     DB_NAME = 'verse-studio'
DB_VERSION:           11
SCHEMA_VERSION:       10
IDB store count:      28
build_commit:         83ebad57f9220ac57112f6bbc2ef3818c3a489015b141d4832e842587aded191
exporter_self_hash:   ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb
Canonical Canvas:     42 records / 67 links / 42 positions
Selector inventory:   646 data-test / 1 data-testid
Runtime class:        RUNTIME-UNVERIFIED until Gate 59.5 validation bundle is accepted
```

No runtime claim should be promoted from this brief.

---

## 3. Design principles

### 3.1 Private by default

Privacy is not decorative copy. Design decisions should bias toward local-first behavior, explicit export, minimal external assumptions, and clear diagnostic boundaries.

### 3.2 Calm hierarchy

The UI should reduce surface area by default. Hidden studios may remain directly routable and active internally, but the main navigation should emphasize the current core surfaces.

### 3.3 Context without coercion

Nexus should add relational awareness without forcing the user to maintain a perfect knowledge graph. Suggested context should feel like ambient tissue, not a task queue.

### 3.4 Preserve the user's chosen focus

Canvas default-to-Nexus is useful only when no deliberate user preference should override it. If a user intentionally selects another project, the product should preserve that selection.

### 3.5 Evidence before expansion

Schema, type, and layout foundation work should proceed only after package and runtime evidence is clean, or after an explicit owner risk decision.

---

## 4. Experience architecture

### Primary mental model

The app is a studio with connected work surfaces:

- **Canvas** — relational map and first-run orientation surface.
- **Writing** — longer draft work.
- **Notes** — atomic note capture and review.
- **Projects** — containers for active work and related records.
- **Prompt Studio** — structured prompt and pipeline work.
- **Nexus Panel** — ambient relational context across surfaces.
- **Settings / Diagnostic** — evidence export, runtime inspection, and app controls.

### Current default route posture

Canvas is the default landing surface. Nexus Mobile is the intended canonical first-run/default project when no deliberate preference should override it.

---

## 5. Visual language

### Desired feel

- Quiet, legible, restrained.
- More workshop than social feed.
- Strong enough structure to orient, light enough not to interrupt writing.

### Recommended visual traits

- Soft contrast and clear section boundaries.
- Typography that prioritizes reading and editing comfort.
- Minimal animation; all motion must respect reduced-motion expectations.
- Hub-and-spoke brand geometry should signal connected private knowledge.
- Focus states should remain visible and reliable, especially for keyboard workflows.

---

## 6. Nexus / relational behavior

Nexus should act as connective tissue across records, projects, links, tags, snapshots, recent views, conversion lineage, AI lineage markers, and Canvas placements.

Design direction:

- Default-open outside Focus Mode.
- Suppress or simplify in Focus Mode when it competes with writing.
- Prefer explainable context over opaque suggestions.
- Keep empty states useful and diagnostic: if context is missing, show why or what would create it.

---

## 7. Canvas behavior

Canvas is the first-run narrative surface and ongoing relational workspace.

Current design expectation:

- Cleared/fresh workspace seeds a meaningful Nexus Mobile canvas.
- Canonical source expectation is 42 records, 67 links, and 42 positions.
- Populated workspaces should avoid destructive or surprising reseeding.
- If `canvas:lastProject` is missing or stuck on Meridian seed defaults, Canvas should resolve to Nexus Mobile after boot.
- If the user deliberately selected a third project, preserve that selection.

---

## 8. Runtime validation boundary

The current final package is source/test verified, not runtime promoted.

Gate 59.5 requires a real diagnostic bundle exported from the rebuilt app:

```text
Settings → Diagnostic → Export validation bundle
```

Only a validation-grade `noted-diagnostic-bundle-*.json` with matching build/exporter hashes should promote runtime claims.

Workspace backup/export JSON is useful for data inspection, but it is not runtime validation evidence.

---

## 9. Next design-safe build route

Before major feature expansion:

1. Complete Gate 59.5 runtime validation, or record an explicit owner risk waiver.
2. Then begin Sweep 63 type/layout foundation work.
3. Keep Phase 0.5 changes tightly staged: type ontology first, then layout/team semantics, then visual/interaction polish.

Avoid mixing product behavior, schema changes, and visual polish in the same sweep unless the Orchestrator explicitly scopes it.

---

## 10. Non-goals for the next step

Do not use this design brief to justify:

- DB/schema changes outside the active sweep packet.
- Diagnostic exporter changes.
- Selector removals/renames.
- Storage identity renames.
- Cloud sync assumptions.
- Runtime claim promotion without a valid diagnostic bundle.
- Treating `noted-v0.02.html` as canonical for Noted v0.01.

---

## 11. One-line design north star

**Noted should feel like a private, local thinking room where every note can remain simple, but no note has to stay isolated.**
