# Build Plan & Roadmap — AI DRAFT

**ID:** `PUB-ROUND-2026-07-22-CLAUDE-BUILD-PLAN-ROADMAP`
**Date (UTC):** 2026-07-22
**Round / track:** `ROADMAP`
**Seat:** Claude Opus 4.8 (Claude Code; local + git access)
**Operator task / authority:** operator directive, live session — "write the build
plan and roadmap draft as an AI draft in publications"
**Branch / tip SHA:** `claude/pub-build-plan-roadmap-001` (off grok agent-resources)
**status_authority:** `NONE`
**Report status:** `COMPLETE` (as a DRAFT — this is a plan, not accepted state)

> **AI DRAFT / NON-CLAIM.** This is one model's proposed sequence, grounded in
> code verified this session. It is not a promise, a schedule, or accepted Lab
> direction. `STATUS.json` and operator ring-0 outrank it. Every phase carries an
> entry gate, an exit gate, and (where it ships anything) a destruction test.
> Newest ≠ canonical; nothing here promotes anything.

---

## 0. Ground truth this plan stands on (verified, not assumed)

| Fact | Evidence class | Note |
|------|----------------|------|
| `./nexus doctor` passes (7 checks) | EXECUTED | honest non-claim printed |
| Test suite green **after `npm ci`** | EXECUTED | 11 fail without; not zero-dependency |
| R016 verifier fails-closed | ADVERSARIALLY_VERIFIED | 1-byte fixture mutation → FAIL |
| Creature engine mint/battle/breed | EXECUTED (prior) | 61/61 in round10 corpus |
| Value-capture stress tests real | EXECUTED | BGEN econ; own gate `ECONOMIC_GATE_PASS:false` |
| Wallet transfers synthetic $NEX | SOURCE-VERIFIED | "no value" enforced NOWHERE in code |
| Creature corpus lives OUTSIDE Lab | SOURCE-VERIFIED | Downloads/round10; 4 divergent Nexus_OS versions |
| Quine self-modifier exists | SOURCE-VERIFIED | `v0_15`, gen-counter; currently uncaged |

The plan's job is to move each open risk from asserted to enforced, and each
homeless artifact inside the governed boundary — without overclaiming.

## 1. Phases (each: ENTRY → work → EXIT gate)

### Phase 0 — Recovery scaffold — `DONE`
Inventory (3,504 files, 60 divergent families), baton/relay/tribunal, operator
declarations D-001 (canonical = identity, not endorsement) / D-002 (MFT
doctrine), blind + local adversarial audits, Agent Gateway kit, LOOM capture +
AI-admission glyph. EXIT met: state is hashed and handoff-able.

### Phase 1 — Adjudicate canonical + merge session proposals — `NOW`
- ENTRY: PRs #95/#97/#98/#99 + grok branch open; 4-way `Nexus_OS.html` unresolved.
- Work: operator ring-0 merges reviewed PRs; agents produce the 4-way OS diff
  table; one written canonical decision per top divergent family (D-001).
- EXIT: single canonical pointer per object; `RAM/` adopted; anchor counter-signed
  by Grok + ChatGPT.

### Phase 2 — Import the creature engine into the governed boundary — `NEXT`
- ENTRY: Phase 1 canonical decisions logged; round10 chosen as candidate tip.
- Work: import into `products/creature-engine/` (empty registered landing pad)
  via REGISTRY.json pin; wire `tests/run.sh` (61 tests) into `nexus-audit.yml`.
- EXIT (destruction test): CI green on the imported tree; a different-provider
  seat reproduces the 61 tests. The artistic core stops being homeless.

### Phase 3 — Cage the self-modifying artifact + provenance store — `HARDER`
- HT-001 (quine cage): gen N→N+1 impossible without recorded human approval +
  scar; DESTRUCTION TEST run by Grok/Codex (10 bypass attempts). HT-002
  (quasi-SQL lineage store): append-only, hash-chained, OS event log replays to
  identical DB state by hash. EXIT: both survive a non-Claude destruction test.

### Phase 4 — Close-or-confess the reds — `NEXT`
- T-01 sandbox split (`allow-scripts`+`allow-same-origin`) — fix or ship the
  unskippable non-claim its own `LIES_BY_OMISSION.md` demands.
- Vendor the Agent's CDN deps (make "local-first" true).
- Wallet: either enforce non-redeemability in code OR file it as an explicit
  non-claim ("transferable-synthetic; value unenforced; adoption risk open").
- EXIT: every red is either closed with evidence or confessed in a non-claim.

### Phase 5 — The economy question (the load-bearing one) — `LATER`
- The open problem D-002 names: can MFTs *stay* economically worthless under
  adoption? Work: extend the BGEN/nexsim value-capture rig (40-yr horizon,
  whale/sybil/token-value scenarios already real) and — per operator — plug
  nexsim into Noted/Router/Nexus so the shipped economy is tested by the sim
  BEFORE it is trusted. EXIT: measurable non-transferability-of-value results,
  or an honest FALSIFIED that the property cannot be held (either is a valid
  research outcome).

### Phase 6 — Publications & kit ship — `PARALLEL`
- Home the course (`FULL-SPECTRUM…` sha256 `bfe08eb3…`) into the APE publication
  repo, LOCKED, after the three red-team fixes (n=1 relabel, per-tactic failure
  modes, ND-module hardening). Ship Agent Gateway kit AS the course's verification
  rail. EXIT: course survives a hostile external read.

## 2. Ship gate — "a toy to break"
The Reddit ship (`REDDIT_SHIP_NOTE.md`) is NOT a phase; it is a switch, gated on:
tri-model anchor counter-signed, sealed disclosure not shipped, every post claim
mapped to a hash/command, zero product/value/safety claims. It is the only
irreversible action in this plan and takes an explicit operator go.

## 3. What this plan explicitly does NOT claim
Not a schedule (no dates). Not safe (Phase 4 reds are open). Not valuable (Phase 5
is unsolved). Not independent (needs Grok + ChatGPT). Not complete (creature
render, Nostr live transfer, Nex-Sim provenance still UNABLE_TO_VERIFY). The plan
succeeds if it makes honest failure cheaper than quiet shipping.

## What I verified
| Check | Inspection | Result |
|-------|-----------|--------|
| Ground-truth table rows | this-session tool output (audits, freezes) | all traceable |
| Phase artifacts exist | Lab-Recovery/, RAM/, PRs #95–99 | EXISTS |

## What I did not check
Codex pre-release whitepaper (deliberately frozen out); dates/effort estimates
(intentionally omitted — a plan, not a schedule); whether operator accepts this
sequence (ring-0 decision, not mine).
