# Adversarial Publication Review — NEXUS-PRE-RELEASE-AI-DRAFT-REDTEAM-001

**Reviewer:** Claude Fable 5 (Anthropic), directed adversarial seat
**Reviewed commit:** `ec095332271fae5dd02813e1ecd4ef77bbf5cc0e` (local-only at review time)
**Date (UTC):** 2026-07-23
**Scope:** publication readiness of the Nexus / Noted pre-release documentation package only
**Status authority:** `NONE` — this review grants no canonical authority and is not independent (see [`../../receipts/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/FREEZE.md`](../../receipts/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/FREEZE.md)).

## Verdict

**INCOMPLETE** for any publication stronger than the draft's own self-label ("candidate for adversarial review; not final canon, not a release, not a security finding").

The package may be published **as exactly what it says it is** — an AI-authored draft awaiting independent review. It MUST NOT be described as validated, security-reviewed, or release-ready. The draft's own promotion rule already says this, and this review upholds it: the release gates the Technical Spec defines are not met by the current tree, and a few sentences in the human-facing README/whitepaper run slightly ahead of source.

The most important positive finding: **the draft is unusually honest.** It names its own blockers (legacy wallet UI, raw Nostr key, missing Eidolin artifact, unadmitted Nex-Sim) in a dedicated "Known contradictions" section rather than papering over them. Most of my adversarial checks confirmed the draft's own disclosures rather than contradicting them. The red-team value below is therefore concentrated in (a) claims that outrun the code, (b) enforcement the spec mandates but the tree does not yet contain, and (c) the independence/validation framing.

## What I ran (all commands and outcomes in the receipt)

- Clean re-entry: `./nexus doctor` → PASS (WARN worktree-dirty from my own receipt files only).
- Root Python suite: `python3 -m unittest discover -s tests` → **11 failures on a fresh tree**, all resolved by `npm ci` (missing `@noble/ed25519`); **190 tests PASS** after install. Verification does not mutate the tracked tree.
- `./nexus verify` → PASS (exit 0). `python3 -m unittest tests.test_control_plane` covered within discovery.
- `products/noted-host`: `npm ci && npm run build` → **PASS**, clean production build (`vite build && node pack.js`, 304 modules).
- `products/noted-host/public/nexus/os`: `bash tests/run.sh` → aborts at the script-ref stage on the missing Eidolin artifact (SCRIPT-REF fail=1). After building Eidolin, the full sweep runs; every summary is `fail=0` **except** `TOOLS SUMMARY pass=14 fail=1` (`channel-atlas --check` reports the atlas stale) — a pre-existing, non-blocking staleness check unrelated to the draft.
- Eidolin build: `npm install && npm run verify` inside the block → **regenerates `dist/src/runtime.js` and passes** typecheck + smoke + audit deterministically. The "missing artifact" is a packaging/checked-in-output gap, not a broken engine.
- Negative controls (see receipt): snapshot byte-corruption makes `./nexus verify` fail closed with a digest mismatch and restores exactly; a planted `AKIA…` key in a `.txt` file makes `./nexus doctor` FAIL; the **same key in a `.js` file is silently NOT flagged** (independently reproduces prior AUD-R002 finding).
- Full-history secret scan across sampled revisions: no live credentials; the only pattern hits are synthetic placeholders inside prior audit evidence files.

## Findings (severity-ranked)

### F1 — HIGH — "STRICT NO SALE" is declared everywhere and enforced nowhere

The four documents repeat `SYNTHETIC DATA · NON-TRANSFERABLE · NON-REDEEMABLE · STRICT NO SALE` as the central boundary, and the Technical Spec §9 states in normative MUST language: *"Automated release checks MUST scan shipped UI, schemas and route names for forbidden surfaces including `buy`, `sell`, `price`, `cashout`, `withdraw`, `yield`, `sats`, `wallet`, `send`, `transfer`, `wrap` and `redeem`"* and *"Tests MUST also submit forbidden events and observe rejection."*

Neither exists in the shipped tree:
- No forbidden-surface scanner in `tests/` or `system/nexus_lab/` (the only `forbidden`-token code targets prompt-injection canaries and custody sidecars, not economic vocabulary).
- No `STRICT NO SALE` / `NON-TRANSFERABLE` boundary string rendered anywhere in the Nexus OS runtime JS.
- The legacy `blocks/system/Wallet_v4_nexus.html` ("NX4 UTXO wallet — $NEX") is **registered and launchable** from the OS shell (`Nexus_OS.html:2317`), exposing `Send`, `Stake`, `Receive` tabs; the kernel emits `economy.notify.balance_changed`, `nexus.wallet.state`, and `economy.notify.mint_published` → "Mint published … NEX landed" (`Nexus_OS.html:2567`–`2574`); a `+21 sats` string ships in `Nexus Social v0.02.html:1760`.

**Why it matters for publication:** the draft's core promise is that the boundary is *enforced by software, not merely announced.* Today it is announced. The draft partially discloses this ("legacy … must be removed, quarantined or replaced"), so it is not a lie — but a reader who trusts the normative MUSTs would reasonably believe an enforcement layer exists. It does not. Publication must not imply the invariant is active.

**Reproduce:** `grep -rn "STRICT NO SALE" products/noted-host/public/nexus/os` (empty); open Wallet from the OS launcher entry at `Nexus_OS.html:2317`.

### F2 — MEDIUM — Raw Nostr private key in browser storage (legacy Vibes path), disclosed but live

`products/noted-host/public/nexus/os/blocks/vibes/vibes-library.html:549`–`591` reads a private key directly from `localStorage` (`nx.soc.identity`, `nx.forum.identity`, `nx.channels.identity`, `nx.iww.identity`) and signs Nostr events in-page with `secp.schnorr.sign(ev.id, ident.privkey)`. This directly violates Technical Spec §10 ("Raw private keys MUST NOT enter localStorage, IndexedDB, logs …"). The draft discloses it as a blocker; I confirm it is present and reachable, not already quarantined. Hardcoded relays (`wss://relay.damus.io`, `wss://nos.lol`, `wss://relay.nostr.band`) ship in the same paths.

### F3 — MEDIUM — Release-gate preconditions (Gate 0/1/2) are unmet, so no "release" language is supportable

- **Gate 0 (truth/inventory):** the release README does *not* enumerate network destinations. Shipped blocks hardcode `esm.sh`, `fonts.googleapis.com`/`gstatic.com`, `api.groq.com/openai/v1/chat/completions`, and `api.anthropic.com/v1/messages`. No consolidated network/CDN inventory accompanies the draft, though Gate 0 and Whitepaper §12 require it.
- **Gate 1 (clean stranger build):** the documented root command `bash tests/run.sh` **fails on a clean tree** (exit 1) until Eidolin is built — and the README itself flags this. So Gate 1 is honestly disclosed as failing, which means the package is pre-Gate-1 by its own definition.
- **Gate 2 (negative controls):** partially real. `./nexus verify` and `./nexus doctor` fail closed on snapshot corruption and on planted secrets *in scanned file types*; but the forbidden-economic-event rejection test (F1) does not exist, and the secret scanner has documented blind spots (F5).

None of this contradicts the draft — it contradicts any future attempt to call the draft a *release*.

### F4 — LOW — "React/Vite/Electron workspace" overstates the desktop story

`docs/pre-release/README.md:32` and SYSTEM/spec text describe an Electron workspace. Electron is **not a dependency** of `products/noted-host` (`package.json` deps are React/Vite/dnd-kit/xyflow/idb only; the sole lockfile hit is the transitive `electron-to-chromium`). The code has defensive `window.electronAPI?` hooks (`src/main.tsx:9`, `src/components/TopBar.tsx:25`) for a *future* desktop shell that is not built today. The app is a web build. Downgrade the claim to "web (Vite/React), desktop shell planned."

### F5 — LOW/INFORMATIONAL — Secret-scanner blind spots weaken the "secrets scanned" posture (independently reproduced)

`./nexus doctor`'s `scan_secrets` gates on an extension allowlist (`TEXT_SUFFIXES`) plus a 5 MB cap (`system/nexus_lab/doctor.py:16`–`27`). I planted an `AKIA…` key: flagged in a `.txt`, **silently ignored in a `.js` file**. This reproduces prior finding AUDOBS-R002-CLAUDE-0011/0012 (`.env` dotfiles and >5 MB files also exempt). The Whitepaper §12 / Threat-model §13 lean on secret scanning; the control is real but narrower than a reader would assume. Not a draft defect, but the security-posture prose should not imply exhaustive coverage.

## Claims that VERIFIED accurate (draft credibility)

- **"Coordinates not sent to the model today."** `products/noted-host/src/topology/aiBriefExport.ts` exports nodes/typed-directed-weighted edges/tags/projects/summaries/lineage and has **zero** `x`/`y`/position fields. Canvas x/y live only in the separate `Canvas.tsx` export. The "spatial analysis is planned, not shipped" framing is correct.
- **Eidolin vertical slice is real and deterministic.** Builds reproducibly; smoke run emits stable creature/lineage/save output with a `proofHash`. Draft's "experimental, packaged artifact missing" is exact.
- **Nex-Sim is located, not integrated.** Local dirs `/home/anon/nexsim-local`, `/home/anon/nexsim-tools`, `/home/anon/nexus_sim` exist; nothing under `products/` or `system/` imports them. `UNABLE_TO_VERIFY` is the correct label.
- **Cited history commits exist:** `7da34b3` (anti-real-world-value checkpoint), `50523e4` (Noted Phase 0), `09673bc` (canonical direction) all resolve with the described subjects.
- **Iframe-mounted router with sandbox + single trusted source** (`NexusRouterStudio.tsx:65`) matches the Appendix-A caveat that "an iframe alone does not establish capability security."

## Three findings I would defend under hostile cross-examination

1. **F1 — the strict-no-sale invariant is documentation, not a control.** No scanner, no runtime boundary string, and a live launchable NEX wallet with Send/Stake/mint events. The project's headline safety property is currently unenforced.
2. **F3/Gate-1 — the package is pre-release by its own gate definitions.** The documented stranger build command fails on a clean checkout; the network inventory Gate 0 requires does not ship. It cannot be called a release.
3. **F2 — a raw private key is signed from `localStorage` in a reachable legacy block**, directly against the spec's own MUST NOT, and it is present rather than quarantined.

## The single biggest unknown

**Whether "strict no sale" can be enforced at all in an open, forkable, MIT-licensed system — and what "enforcement" would even mean.** The draft concedes that open source cannot stop off-platform deals and pledges only that *official builds* will refuse sale/transfer/price primitives. But no official build currently refuses them; the enforcement layer is entirely future work. I could not evaluate a mechanism that does not yet exist, so the central social-economy safety claim remains untested in code.

## Explicit unchecked list

- Did not run the live Noted UI in a browser or exercise the AI Brief export against a real model endpoint (no keys, and remote calls are out of scope for a docs review).
- Did not execute Nex-Sim (outside the repo; admission gate not attempted — that is a separate bounded task).
- Did not line-audit the full 4,164-line `Nexus_OS.html` kernel; inspected routing, wallet registration, message handling and origin checks only.
- Did not fuzz the Nostr relay input path or attempt replay/duplication live.
- Did not verify export/reimport/deletion on a fresh Noted profile (Gate 3) — no running instance.
- Secret-history scan sampled 5 revisions across 431 commits, not all 431.
- Reviewed the local-only commit; behavior on the eventual pushed/tagged artifact is not established.
