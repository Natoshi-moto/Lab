BOOT-SEQUENCE-ACTIVE v1

# Sweep 56-R Delivery Report — Nexus Panel Default-Open UX Correction

## 1. Technical summary

Implemented Sweep 56-R against the accepted Sweep 56 bundle. Nexus Panel now opens by default and performs a one-time correction for older auto-written closed defaults while preserving the existing user preference key and the ability to collapse/reopen the panel.

Changes made:

- `src/components/NexusPanel.tsx`
  - Preserved `verse-studio:nexus-panel:open` as the persisted user preference key (`'true' | 'false'`).
  - Added UI-only one-time marker `verse-studio:nexus-panel:default-open-applied`.
  - If marker is absent, the panel initializes open and writes both marker and open preference as `'true'`.
  - After marker exists, explicit user close/open choices are respected.
  - Missing/invalid preference now defaults open.
  - FocusContext-first / Workspace `activeRecord` fallback remains intact.
  - `data-focus-hide="nexus-panel"` remains intact.
  - Header microcopy now reads `Nexus` / `Relational context`; empty state clarifies connections, project, tags, snapshots, and lineage.
- Governance/public docs updated to record the new owner canon and supersede older collapsed-default wording.
- Build artifacts regenerated through the existing build pipeline.

## 2. Archive/waiver status

No external archive was required. The accepted Sweep 56 bundle was used as source of truth.

## 3. Files concerned

| File/path | Change |
|---|---|
| `src/components/NexusPanel.tsx` | Default-open behavior, one-time marker, small role/empty-state copy polish. |
| `PREFLIGHT.MD` | Active key table and Sweep 56-R canon/storage behavior. |
| `LANDMINES.MD` | Superseded old collapsed default; marker/key landmine. |
| `AI_README.MD` | Sweep 56-R maintainer note. |
| `AI_CODEBASE_HANDOFF.MD` | Handoff note for default-open behavior and marker. |
| `CONTROL_ROOM_STATE.MD` | Retired-ledger informational Sweep 56-R note. |
| `PUBLIC_REPO_MANIFEST.MD` | Manifest note for source/key classification. |
| `README.md` | User-facing Nexus Panel default-open note. |
| `NOOB_GUIDE.MD` | Beginner-facing Nexus Panel note. |
| `dist/`, `noted-v0.01.html`, `verse-studio.html` | Regenerated build outputs. |
| `verification/sweep56r/*` | Command logs and hash records. |

Selector delta: none. Existing Nexus selectors were preserved.

## 4. Protected invariants

| Invariant | Status |
|---|---|
| `DB_VERSION = 10` | Preserved |
| `SCHEMA_VERSION = 9` | Preserved |
| IDB stores / migrations | Unchanged |
| `noted-v0.01` app identity | Preserved |
| `verse-studio:*` prefix | Preserved |
| `verse-studio:nexus-panel:open` key name and value contract | Preserved |
| Package manifests/dependencies | Unchanged |
| Routes/selectors | No removals; no selector delta |
| Focus Mode hiding | Preserved via `data-focus-hide="nexus-panel"` |
| FocusContext-first behavior | Preserved |
| GitHub/publication/license gates | Unchanged |
| Network/API/AI calls | Not added |

## 5. Storage key behavior

Existing key:

- `verse-studio:nexus-panel:open`
  - Value contract remains `'true' | 'false'`.
  - Stores the user's explicit open/collapsed preference.
  - Missing/invalid now defaults to open after the one-time marker exists.

New UI-only migration marker:

- `verse-studio:nexus-panel:default-open-applied`
  - Value: `'true'`.
  - If absent, the app opens the panel once after this sweep and writes:
    - `verse-studio:nexus-panel:open = 'true'`
    - `verse-studio:nexus-panel:default-open-applied = 'true'`
  - After this marker exists, user close/open choices are respected normally.

## 6. Commands run and results

| Command | Result |
|---|---|
| `npm ci` | PASS — installed from existing lockfile; npm reports existing 2 moderate audit findings; no fix run. |
| `npm run typecheck` | PASS — `tsc --noEmit` clean. |
| `npm run build` | PASS — Vite build completed; `pack.js` emitted `verse-studio.html` + `noted-v0.01.html` at 860.9 KB. |
| Required localStorage/canon grep | PASS / reviewed. |
| Required collapsed/default wording grep | PASS / reviewed; remaining `collapsed by default` hits are unrelated Prompt Studio/lineage historical notes or explicit supersession notes. |
| Required FocusContext/focus-mode grep | PASS / reviewed. |
| Required DB/schema grep | PASS. |
| Network/API guard grep | PASS — no matches. |
| Package hash comparison | PASS — `package.json` and `package-lock.json` unchanged. |

Logs are included under `verification/sweep56r/`.

## 7. Required grep/check summary

### Storage/default-open keys

Found expected references in:

- `src/components/NexusPanel.tsx`
- `PREFLIGHT.MD`
- `LANDMINES.MD`
- `AI_README.MD`
- `AI_CODEBASE_HANDOFF.MD`
- `PUBLIC_REPO_MANIFEST.MD`
- `README.md`
- `NOOB_GUIDE.MD`

### Collapsed/default wording

Expected Sweep 56-R supersession notes are present. Remaining non-Nexus hits are unrelated historical notes for Prompt Studio controls, lineage section collapse, ScratchDrawer preference preservation, or false-positive `defaulted to false` wording for Atlas `aiLineage`.

### FocusContext / activeRecord / focus mode

Verified in `src/components/NexusPanel.tsx`:

- `useFocus` import/use remains.
- `focus.id && focus.type ? ... : ws.activeRecord` fallback remains.
- `data-focus-hide="nexus-panel"` remains.
- Existing `nexus-panel*` selectors remain.

Verified in `src/index.css`:

- `[data-focus-mode="true"] [data-focus-hide="nexus-panel"]` remains.

### DB/schema

`src/db.ts` still contains:

- `SCHEMA_VERSION = 9`
- `DB_VERSION = 10`

### Network/API guard

`rg -n "fetch\(|XMLHttpRequest|WebSocket|ollama:|openai|apiKey|Authorization" src` returned no matches.

## 8. Package/dependency status

No package or dependency changes. `package.json` and `package-lock.json` SHA-256 hashes are unchanged.

```text
7102f79732c6bc242ab11752441d02b78218ba45f9499e911d1c95297da90b63  package.json
2ef3937a8a4f7add3e917f3b1a4b0000cf99e8525d3a070d6f40c804ac0817fe  package-lock.json
```

## 9. Generated artifact hashes

```text
69e7cff3fe8d98c4b40c09c388f6f787ad8d852bdddde36bdc3b9b02b0057946  noted-v0.01.html
69e7cff3fe8d98c4b40c09c388f6f787ad8d852bdddde36bdc3b9b02b0057946  verse-studio.html
1a67369b45cd1b8a0c5189334c3e53ad8f87a71db8b2a26dcc864c3ff6d6f3ed  noted-v0.02.html
98d47c4070bac4d699b3a2a7366ce01036b67d0df095509d932de01e88e5a753  dist/assets/index-ClCahXOI.js
296d4c785dad5d5ca21053c54779d43d03dd1de0a235fd673886ea30df9a80f9  dist/assets/style-i_N973ii.css
```

## 10. Runtime status

Runtime pending / manual verification required. No browser/Electron smoke was run in this Builder pass.

## 11. Risks/deferred items

- Runtime behavior must be manually verified.
- Existing moderate Vite/esbuild audit findings remain unresolved because dependency changes were not authorized.
- GitHub candidate gates remain unchanged; no publication/release/license decision was made.
- The new marker key is localStorage-only UI state; if a user intentionally kept the panel closed before this sweep, it will open once after upgrade, then respect future closes.

## 12. Manual runtime instructions

1. Launch the built app from the new artifact.
2. Confirm the Nexus Panel is open/visible by default on first launch after this sweep.
3. Confirm the panel can be collapsed and reopened.
4. Reload after closing it and confirm the user's close choice persists.
5. Clear `verse-studio:nexus-panel:open` and `verse-studio:nexus-panel:default-open-applied`, reload, and confirm the panel opens by default.
6. Select/open a record in Notes and Prompt Studio and confirm panel context updates.
7. Enter Focus Mode and confirm the panel hides.
8. Confirm no network/API call occurs.

## 13. Bundle contents

The delivery bundle includes current project source/artifacts in scope, regenerated build outputs, updated docs/governance, this delivery report, verification logs, and known risks/deferred items.
