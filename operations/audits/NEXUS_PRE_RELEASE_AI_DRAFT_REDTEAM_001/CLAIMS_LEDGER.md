# Claims Ledger — NEXUS-PRE-RELEASE-AI-DRAFT-REDTEAM-001

Reviewed commit `ec09533`. Classifications: `IMPLEMENTED_AND_EXECUTED`, `IMPLEMENTED_NOT_EXECUTED`, `LISTED_ONLY`, `PLANNED`, `CONTRADICTED`, `UNABLE_TO_VERIFY`. status_authority: `NONE`.

| # | Claim (source) | Classification | Evidence |
|---|---|---|---|
| C1 | Noted is a React/Vite/**Electron** workspace (README:32) | **CONTRADICTED** (partial) | `package.json` has no electron dep; only transitive `electron-to-chromium` in lockfile; `window.electronAPI?` guards in `src/main.tsx:9`, `TopBar.tsx:25`. Web build only. Desktop shell = PLANNED. |
| C2 | AI Brief Export ships graph nodes, typed/directed/weighted edges, tags, projects, summaries, lineage (README table; Appendix A) | **IMPLEMENTED_AND_EXECUTED** | `src/topology/aiBriefExport.ts` builds exactly these fields; `npm run build` compiles it. |
| C3 | Canvas positions are a **separate** export; unified spatial contract "planned, not shipped"; model does **not** receive coordinates today (README:25; SYSTEM §topology; WP §5) | **VERIFIED / PLANNED** | `aiBriefExport.ts` has zero x/y/position fields; x/y appear only in `studios/canvas/Canvas.tsx`. Accurate. |
| C4 | Nexus OS mounts through an iframe + host bridge; "iframe alone ≠ capability security" (Appendix A) | **IMPLEMENTED_AND_EXECUTED** | `NexusRouterStudio.tsx:58,65` sandboxed iframe; kernel routes via MessageChannel `Nexus_OS.html:1662`. |
| C5 | Legacy runtime contains wallet/NEX/balance/send/stake/mint/sats language and tests expecting some of it (README table; SYSTEM §fractures; Appendix A) | **IMPLEMENTED_AND_EXECUTED** (as a *blocker*) | `Wallet_v4_nexus.html` registered at `Nexus_OS.html:2317`; Send/Stake/Receive tabs; `economy.notify.*`/`nexus.wallet.state` at `:2567–2574`; `+21 sats` `Nexus Social v0.02.html:1760`; WALLET test suite pass=3. |
| C6 | `STRICT NO SALE` / non-transferable is a design **invariant** enforced by official builds; release checks MUST scan forbidden surfaces; tests MUST reject forbidden events (TECH_SPEC §9; WP §8) | **CONTRADICTED / LISTED_ONLY** | No forbidden-surface scanner in `tests/` or `system/`; no boundary string in OS runtime JS; forbidden-event rejection test absent. Declared, not enforced. **F1.** |
| C7 | Raw private key MUST NOT enter localStorage; signer is isolated (TECH_SPEC §10; WP §9) — legacy Vibes path violates this (SYSTEM §fractures) | **CONTRADICTED** (spec) / disclosed blocker | `vibes-library.html:549–591` loads `privkey` from localStorage and schnorr-signs in-page. Present & reachable. **F2.** |
| C8 | Eidolin deterministic terrain/creature/battle/lineage/save vertical slice exists; packaged `dist/src/runtime.js` is **missing** (README table; TECH_SPEC §8/§16; Appendix A) | **IMPLEMENTED_NOT_EXECUTED (as shipped)** → build reproduces it | Artifact absent on clean tree (script-ref fail=1); `npm install && npm run verify` inside block regenerates `dist/src/runtime.js`, smoke+audit PASS. Accurate disclosure. |
| C9 | Root test command not directly runnable / reports the missing Eidolin file; "not a green release" (README:79; TECH_SPEC §16) | **VERIFIED** | `bash tests/run.sh` exits 1 at SCRIPT-REF stage on clean tree; documented honestly. |
| C10 | Nex-Sim material located locally, not admitted into canonical build; `UNABLE_TO_VERIFY` (all four docs; WP §10) | **UNABLE_TO_VERIFY** (correctly) | Local dirs exist (`/home/anon/nexsim-local`, `nexsim-tools`, `nexus_sim`); no `products/`/`system/` import. |
| C11 | Creature-engine declares synthetic-only non-redeemable progression; is a **scaffold** (Appendix A) | **LISTED_ONLY / PLANNED** | `products/creature-engine/README.md`: "Phase 0 scaffold … intentionally contains no engine code." |
| C12 | History commits `7da34b3`, `50523e4`, `09673bc` recorded checkpoint/import/direction (Appendix A) | **VERIFIED** | All three resolve with the described subjects. |
| C13 | Local-first: release MUST enumerate every network path & CDN dependency (WP §12; TECH_SPEC Gate 0) | **PLANNED / not met** | No network inventory ships with the draft; blocks hardcode esm.sh, Google Fonts, api.groq.com, api.anthropic.com. **F3.** |
| C14 | `./nexus doctor` / `./nexus verify` fail closed on corruption (implied by "negative controls," Gate 2) | **IMPLEMENTED_AND_EXECUTED** (partial) | Snapshot byte-flip → `verify` exit 2 "Snapshot digest mismatch"; planted AKIA in `.txt` → `doctor` FAIL. But `.js`/`.env`/>5MB exempt (**F5**). |
| C15 | Repo carries MIT license (README:100) | **VERIFIED** | `origin/main` commit `2a3c068` "Add MIT LICENSE"; `LICENSE` present. |
| C16 | Draft is AI-authored, not independently validated; must not be called validated until an unaffiliated reviewer files evidence (index; promotion rule) | **VERIFIED / upheld** | This review is directed and non-independent (same operator/account). Promotion rule stands. |
| C17 | 190 root tests pass; suite does not mutate tree | **IMPLEMENTED_AND_EXECUTED** | After `npm ci`: `Ran 190 tests … OK`; `git status` clean post-run (excluding my receipts). 11 pre-`npm ci` failures were missing `@noble/ed25519`. |

## One-line summary per class
- **Enforced today:** graph export (C2), iframe routing (C4), snapshot/secret fail-closed verifiers within scanned types (C14), full Python suite (C17), MIT license (C15).
- **Real but disclosed blockers:** legacy wallet surfaces (C5), localStorage key (C7), missing Eidolin package (C8/C9).
- **Declared, not built:** strict-no-sale enforcement (C6), network inventory (C13), spatial layer (C3), creature engine (C11), Nex-Sim admission (C10).
- **Overstated:** Electron workspace (C1).
