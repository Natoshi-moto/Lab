# Contradiction register

**status_authority:** `NONE`

Searched (this operation, fresh, against `main` @
`6c3a1e806baba1183553221f5c2f00125ce2be29`): `token`, `coin`, `money`,
`price`, `market`, `wallet`, `mining`, `reward`, `yield`, `exchange`,
`transfer`, `sale`, `cash`, `profit`, `income`, `investment`, `ownership`,
`collateral`, `lending`, `insurance`, `staking`, `crowdfunding`, `KYC`,
`real-world value`, `play-to-earn`, `earn`. For each high-signal item:
location, source classification, exact meaning, conflict level, whether
canon already subordinates it, required future action, or
`NO_ACTION_REQUIRED`. This register does not mass-edit history — every row
below is a finding, not a change.

## Conflict-level key

`NONE` — consistent with doctrine. `LOW` — uses a flagged word but in a
non-live, historical, or already-caveated context. `MEDIUM` — a proposal or
experiment uses value-adjacent language that requires care but is already
scoped `status_authority: NONE`. `HIGH` — a live/shipped surface uses
doctrine-banned language or implements a doctrine-banned mechanic.

| # | Term / location | Source classification | Exact meaning found | Conflict level | Already subordinated by canon? | Required action |
|---|---|---|---|---|---|---|
| CR-01 | `NO_REAL_WORLD_TOKEN_OR_ECONOMIC_VALUE` — `STATUS.json` line 25 (`human_readable_reds`) | `ACCEPTED_MAIN` | A permanent, open red flag at the control-plane level | `NONE` — this is the doctrine itself, not a conflict with it | — | `NO_ACTION_REQUIRED`; this proposal treats this red as its anchor, not as something to close |
| CR-02 | `wallet`, `balance`, `earn` — `products/noted-host/public/nexus/os/blocks/system/Wallet_v4_nexus.html` (e.g. line 197 `<sub>one wallet · v4</sub>`, line 244 `"You begin at 0 NEX. NEX is earned through real realm activity... they are pieces of one balance"`) | `SUPERSEDED` in doctrine, live in tree | A shipped UI screen names a currency-like unit ("NEX"), calls it a wallet, and uses "earned"/"balance" exactly as `operations/LANGUAGE_STANDARD.md` bans | `HIGH` | Partially — `operations/handoffs/OPERATOR_STATE_OF_THE_REPO_001.md:54` already names this exact gap ("an old wallet screen with Send/Stake buttons is still reachable") | Retire or rewrite this surface under `operations/LANGUAGE_STANDARD.md`'s scope note ("a separate, bounded cleanup task"); until then, this file remains the concrete proof that declared doctrine and shipped code diverge |
| CR-03 | `battle-stakes-tests.js`, `wallet-handshake-tests.js` — `products/noted-host/public/nexus/os/tests/` | `SUPERSEDED`, live in tree | Test files exercising the same wallet/stakes surface as CR-02 | `HIGH` | Same as CR-02 | Same as CR-02; tests should be retired alongside the surface they test, not left green against banned mechanics |
| CR-04 | "Declared ≠ enforced" — `operations/handoffs/OPERATOR_STATE_OF_THE_REPO_001.md:54,88` | `ACCEPTED_MAIN` (handoff doc) | Explicit internal admission: *"Your headline safety promise, `STRICT NO SALE`, is written everywhere but enforced nowhere in code yet: no automatic check blocks the forbidden money-words"* | `HIGH` (as a standing admission, not a new finding) | Yes — this is the canon's own self-report | `NO_ACTION_REQUIRED` for this proposal beyond citing it; a future mechanical banned-word scanner (already called for in `operations/LANGUAGE_STANDARD.md`'s "Mechanically (proposed)" section) is out of this proposal's scope |
| CR-05 | "D-002 'nothing' vs D-005 economy / wallet transfer — Doctrine vs mechanism" — `operations/handoffs/CHATGPT_SYSTEM_GUIDE_001.md:213` | `ACCEPTED_MAIN` (handoff doc) | Another internal document independently naming the same doctrine/mechanism split | `HIGH` (corroborating) | Yes | `NO_ACTION_REQUIRED`; corroborates CR-02/CR-04 |
| CR-06 | `redeemable` (negative form) — 8 files including `communications/website/DISTRIBUTED_SOCIAL_GAMIFIED.md:74`, `experiments/.../THE_SIDE_PATH_PAPER.md:54`, `products/creature-engine/README.md:12` | Mixed: `ACCEPTED_MAIN` (comms), `FROZEN_BASELINE` (BGEN), `HISTORICAL_ONLY`/`OPEN_PROPOSAL` (creature-engine) | All uses are **negations** — "non-redeemable," "must be... non-redeemable" | `NONE` | Yes, self-consistent | `NO_ACTION_REQUIRED` |
| CR-07 | `redemption` — 89 hits, ~50 files, dense in R013–R016 PCX series and BGEN design/breaker/redteam docs | `OPEN_PROPOSAL` / `MERGED_EVIDENCE` throughout | Overwhelmingly negations ("no redemption," "not... a redeemable promise") repeated as a standard non-claims clause across unrelated technical tracks | `NONE` | Yes | `NO_ACTION_REQUIRED`; the density itself is corroborating evidence the doctrine is repo-wide, cited in `SOURCE_AND_CANON_MAP.md` |
| CR-08 | `staking` — 23 hits, 14 files, including `products/noted-host/public/nexus/os/blocks/system/Wallet_v4_nexus.html` and `.../tests/battle-stakes-tests.js` | Mixed: most are `OPEN_PROPOSAL` negations (e.g. `S1_INPUT_BRIEF.md:26` "Staking / operator bond \| optional \| Maybe"); the Wallet/tests hits are the same `SUPERSEDED`-live-in-tree surface as CR-02/CR-03 | Doctrine text treats staking as an open, unresolved question (not yet designed, not yet rejected); shipped code implements a "battle stakes" mechanic already | `HIGH` for the shipped subset; `MEDIUM` for the open-question subset | Partial — the open-question subset is honestly marked unresolved; the shipped subset is not flagged in its own files | Shipped "stakes" mechanic should be scoped against `INVARIANTS.md` §D (chance+value+prize+transfer) before any further build; open-question docs should stay `OPEN_PROPOSAL` until a `PROMOTE_TO_MAIN`-style decision like R012's is made |
| CR-09 | `yield` — 124 hits, but the overwhelming majority are the Python/JS/TS `yield` keyword and "yield point" async terminology in engine/tooling code (e.g. `products/noted-host/.../Eidolin/src/battle.ts`, `system/nexus_lab/exchange.py`) | N/A (not economics language) | Programming-language keyword, unrelated to financial yield | `NONE` | N/A | `NO_ACTION_REQUIRED`; flagged here only so a future scanner does not false-positive on this term without this same disambiguation |
| CR-10 | `yield` (economically relevant subset) — `CANONICAL_CHECKPOINT_001.md:72`, `THE_SIDE_PATH_PAPER.md:32,44`, `TO_SATOSHI...md:115`, `THREE_PANE_EIDOLIN_MESH_001/WHITE_PAPER_PROPOSAL.md:113`, `LANGUAGE_STANDARD.md:39` | `FROZEN_BASELINE` / `OPEN_PROPOSAL` | All contrast-table or banned-word entries: "Investment, equity, yield" listed as the *forbidden* meaning, or "no... yield" as an explicit non-claim | `NONE` | Yes | `NO_ACTION_REQUIRED` |
| CR-11 | `KYC` — 3 files: `WHY_NOT_TO_TRUST_THIS_PROJECT.md:132`, `BENEFICIAL_GENESIS_ECON_REDTEAM_001/FAILURE_CONDITIONS.md:114`, `.../MECHANISM_NECESSITY.md:73` | `ACCEPTED_MAIN` / `MERGED_EVIDENCE` | Consistently framed as an *absence* ("No KYC, no entity, no insurance") or an *open tension* ("cannot simultaneously claim permissionless, identity-free operation and resistance to whale concentration") | `MEDIUM` (open tension, not a contradiction with stated doctrine, but an acknowledged unresolved design problem) | Partially — named as unresolved, not resolved | Carried forward into this proposal's `USER_HARM_AND_POWER_MODEL.md` "opaque rankings"/Sybil-adjacent unresolved questions; no repo edit required |
| CR-12 | `crowdfund`, `play-to-earn`, `loot box`, `wager` | N/A | Zero hits repo-wide for all four terms | `NONE` | N/A | `NO_ACTION_REQUIRED`; recorded so a future audit does not need to re-run these specific greps expecting a different result without cause |
| CR-13 | "STRICT NO SALE" itself | `OPEN_PROPOSAL` (named and used across multiple docs, e.g. `operations/LANGUAGE_STANDARD.md:18`, `WHY_NOT_TO_TRUST_THIS_PROJECT.md`, `PROOF_YOU_SHOULDNT_TRUST_THIS_PROJECT_EVER/reports/2026-07-23_NOTED_frontend-privacy-assault/CLAUDE_ATTACK_REPORT.md:37`) but **no single canonical definition document was found** under that exact name | `UNABLE_TO_VERIFY` as a standalone doctrine document | Used as a widely-referenced shorthand for "the project's own core rule" against sale/monetization | `LOW` | The rule's *substance* is well-attested across many files even without one canonical definition file | Note for a future seat: if a dedicated `STRICT_NO_SALE.md` doctrine file is later created, this proposal's `INVARIANTS.md` should be checked against it for consistency |

## Summary

The single highest-signal contradiction found (CR-02/CR-03/CR-04/CR-05,
corroborating each other) is that **this Lab's own repository already
contains a live, shipped example of exactly the failure mode this proposal
exists to prevent**: a named, currency-like unit ("NEX") with wallet/balance/
earn language and a "battle stakes" mechanic, present in the tree at the
verified baseline commit, while the doctrine that would prohibit it
(`operations/LANGUAGE_STANDARD.md`, `BGEN-CANONICAL-CHECKPOINT-001`) remains
an unmerged or narrowly-scoped proposal. This is not a hypothetical risk this
framework guards against — it is a documented, present-tense instance,
already self-reported by this Lab's own `OPERATOR_STATE_OF_THE_REPO_001.md`.
This proposal does not fix CR-02/CR-03 (out of its declared write scope) but
records them here as the clearest evidence that `THREAT_MODEL.md` §2's "not
established by labels" claim is not academic.
