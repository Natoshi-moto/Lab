# Public Repo Manifest — Noted v0.01

This manifest classifies the current candidate bundle. It does not delete or rename files.

| Category | Examples | Purpose | Include in GitHub repo? | Reason | Risk/notes |
|---|---|---|---|---|---|
| Source code | `src/`, `electron/` | Application source and Electron wrapper. | yes | Core maintainable source. | Keep app identity/storage invariants unchanged. |
| Build tooling | `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `pack.js` | Install, typecheck, build, and single-file packing. | yes | Needed for reproducible local development. | `package.json` should remain `private: true`. |
| Generated outputs | `dist/`, `noted-v0.01.html`, `verse-studio.html`, `noted-v0.02.html` | Built app and single-file artifacts. | maybe | Useful in ZIP deliveries and Releases. | Owner should decide repo commit vs Release assets. |
| Installer scripts | `install-noted-v0.01-fedora.sh`, `install-nexus-notes-v0.01-3-fedora.sh`, `reset-nexus-notes-v0.01-data.sh`, install command docs | Local desktop install/reset helpers. | maybe | Useful for supported local installs. | Legacy Nexus names may confuse public readers. Do not rename without an installer identity sweep. |
| AI/governance docs | `AI_README.MD`, `AI_CODEBASE_HANDOFF.MD`, `PREFLIGHT.MD`, `LANDMINES.MD`, `HANDY_LESSONS.MD`, `CONTROL_ROOM_STATE.MD` | Maintainer handoff, invariants, state, and warnings. | maybe | Useful for AI-assisted maintenance. | May expose process noise/history; owner decision required. |
| Verification scripts | `verify-sweep*.mjs`, `smoke-prompts.mjs` | Historical and targeted validation scripts. | maybe | Useful for regression evidence and archaeology. | Some scripts are sweep-specific and may confuse new contributors. |
| Icons/assets | `icons/` | App branding assets. | yes | Needed for installer/app identity. | Contains legacy Nexus icons retained for history/compatibility. |
| Public-facing docs | `README.md`, `NOOB_GUIDE.MD`, `PUBLICATION_CHECKLIST.MD`, `PUBLIC_REPO_MANIFEST.MD`, `PUBLICATION_SECURITY_REVIEW.MD` | GitHub orientation and publication gate docs. | yes | Created specifically for this candidate. | Keep these separate from relay/governance dumps. |

## Current top-level file inventory snapshot

`find . -maxdepth 2 -type f | sort` produced 78 entries before this document set was added. Snapshot:

```text
./AI_CODEBASE_HANDOFF.MD
./AI_README.MD
./ARCHIVE_INDEX.MD
./CODEBASE_ORIENTATION.MD
./CONTROL_ROOM_STATE.MD
./DELIVERY_REPORT_SWEEP_55R.md
./FREEDOM_REASONING_LOG.MD
./HANDY_CODE_SNIPPETS.MD
./HANDY_LESSONS.MD
./LANDMINES.MD
./NEXUS_NOTES_INSTALL_COMMANDS.MD
./NEXUS_NOTES_V0.01-3_INSTALL.MD
./NOTED_V0.01_INSTALL_COMMANDS.MD
./PREFLIGHT.MD
./Quick Install Command Fedora 43.txt
./ZIP_DELIVERY_RULE.MD
./dist/index.html
./electron/main.cjs
./electron/preload.cjs
./icons/nexus-notes-v0.01-128.png
./icons/nexus-notes-v0.01-256.png
./icons/nexus-notes-v0.01-512.png
./icons/nexus-notes-v0.01-64.png
./icons/nexus-notes-v0.01.svg
./icons/noted-v0.01-128.png
./icons/noted-v0.01-256.png
./icons/noted-v0.01-512.png
./icons/noted-v0.01-64.png
./icons/noted-v0.01.svg
./index.html
./install-nexus-notes-v0.01-3-fedora.sh
./install-noted-v0.01-fedora.sh
./noted-v0.01.html
./noted-v0.02.html
./pack.js
./package-lock.json
./package.json
./postcss.config.js
./reset-nexus-notes-v0.01-data.sh
./smoke-prompts.mjs
./src/App.tsx
./src/appMeta.ts
./src/build-constants.d.ts
./src/context.tsx
./src/db.ts
./src/diagnosticExporter.ts
./src/index.css
./src/main.tsx
./src/seed.ts
./src/theme.ts
./src/types.ts
./tailwind.config.js
./tsconfig.json
./verify-sweep10.mjs
./verify-sweep11.mjs
./verify-sweep12.mjs
./verify-sweep13.mjs
./verify-sweep14.mjs
./verify-sweep15.mjs
./verify-sweep16.mjs
./verify-sweep17.mjs
./verify-sweep18.mjs
./verify-sweep19.mjs
./verify-sweep20.mjs
./verify-sweep21.mjs
./verify-sweep22.mjs
./verify-sweep23.mjs
./verify-sweep24.mjs
./verify-sweep25.mjs
./verify-sweep26.mjs
./verify-sweep27.mjs
./verify-sweep28.mjs
./verify-sweep29.mjs
./verify-sweep7.mjs
./verify-sweep8.mjs
./verify-sweep9.mjs
./verse-studio.html
./vite.config.ts
```

## Manifest conclusion

The candidate is understandable enough for owner review, but publication remains gated by license choice, public/private handling of governance docs, generated artifact policy, installer policy, runtime attestation, and final owner go/no-go.

## Sweep 56 additions

| Category | Examples | Purpose | Include in GitHub repo? | Reason | Risk/notes |
|---|---|---|---|---|---|
| Focus foundation | `src/focus/FocusContext.tsx` | Ephemeral cross-studio UI focus for Nexus Panel architecture. | yes | Required source-level app foundation. | Must remain UI state; do not persist without authorization. |
| AI brief export helper | `src/topology/aiBriefExport.ts` | Generates local export-only `NEXUS TOPOLOGY EXPORT` JSON. | yes | Core source for the new export feature. | Exported files may contain private snippets; no import/writeback/network path is authorized. |
| Generated AI brief downloads | `noted-ai-brief-*.json` created by users at runtime | User-created local exports for AI review. | no | These are user data, not repo source. | Must not be committed accidentally if created inside a checkout. |

Sweep 56 does not change the GitHub candidate gate. Publication remains blocked on owner decisions listed in `PUBLICATION_CHECKLIST.MD`.


## Sweep 56-R manifest note

| Category | Examples | Purpose | Include in GitHub repo? | Reason | Risk/notes |
|---|---|---|---|---|---|
| Nexus Panel default-open UX | `src/components/NexusPanel.tsx`, `verse-studio:nexus-panel:open`, `verse-studio:nexus-panel:default-open-applied` | Makes the relational context panel visible by default while preserving collapse persistence. | yes | Source behavior is part of core UX. | Runtime verification remains pending; marker is UI-only localStorage, not schema. |

Sweep 56-R does not alter GitHub publication gates, license status, package dependencies, DB/schema, or public release posture.


## Sweep 57 manifest note

| Category | Examples | Purpose | Include in GitHub repo? | Reason | Risk/notes |
|---|---|---|---|---|---|
| DB v11/schema v10 alignment | `src/db.ts`, `src/types.ts`, `src/context.tsx`, `src/topology/aiBriefExport.ts` | Formalizes canonical lineage/AI/export fields and workspace schema 10. | yes | Core source model. | Migration runtime must be verified over existing user data before stronger claims. |
| Verification logs | `verification/sweep57/` | Captures source-audit and command outputs for this schema sweep. | maybe | Useful for review bundles. | Not usually part of a clean public repo history unless owner wants audit trail public. |

Sweep 57 does not alter GitHub publication gates, license status, package dependencies, app identity, or storage prefixes.
