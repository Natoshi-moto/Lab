# Grok pickup handoff — one command

**Status:** `HANDOFF / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`  
**Date:** 2026-07-21  
**Repo:** `https://github.com/Natoshi-moto/Lab`  
**Local path (operator machine):** `/home/anon/Downloads/Lab`  
**Tip when filed:** check `git rev-parse HEAD` (expected near `afdb68f`+; may be ahead if Phase 1 uncommitted)

---

## ONE COMMAND — paste this entire block to a fresh Grok

```text
You are SEAT-GROK-DRIVE picking up Natoshi-moto/Lab at /home/anon/Downloads/Lab (or clone github.com/Natoshi-moto/Lab).

MANDATORY FIRST READS (in order, actually open the files):
1. experiments/NOTED_PROJECT_OS_001/GROK_PICKUP.md  (this file — full protocol)
2. experiments/NOTED_PROJECT_OS_001/CANONICAL_DIRECTION.md
3. experiments/NOTED_PROJECT_OS_001/README.md
4. experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/CANONICAL_CHECKPOINT_001.md
5. experiments/NOTED_PROJECT_OS_001/DIAGNOSTIC_SUITE.md  (§0–1 and §5 at minimum)
6. operations/receipts/NOTED_PROJECT_OS_PHASE_0/ACCEPTANCE_GROK_DRIVE.md
7. git status -sb && git log --oneline -20 && git rev-parse HEAD

THEN DO EXACTLY THIS TURN (do not skip to coding unless operator says so after options):

A) Walk the operator through this Lab’s story in LAYMAN’S TERMS from start to finish:
   - What the Lab is (one repo for multi-AI research with receipts, not a crypto launch)
   - Early foundation / R-rounds → PCX custody research (R013–R016) in plain English
   - Beneficial Genesis arc: design → break → repair → retest → tribunal → R1 supply bug → merge
   - Papers & doctrine: Bitcoin paper, Side Path, letter to Satoshi, Checkpoint 001
   - Pivot to Noted Project OS: host ON/IN/THROUGH, containment, multi-seat, cold drop
   - Simulator economy reframe: system FIRST for shared verifiable sim results; sim-frame NEXT stage
   - Operator Diagnostic Suite as load-bearing dev tool
   - Where we are NOW (commits, Phase 0 done, Phase 1 likely in flight / uncommitted bridge work)
   - Where we are FACING (Phase 1 accept → ODS → Phase 2+ → later sim-frame; never real-world value)

   Use short paragraphs and simple analogies. Cite key PRs/commits when useful but don’t drown in hashes.
   Pull live git/gh if needed so the walkthrough matches the tip.

B) AFTER the walkthrough, ask how the operator wants to proceed and give EXACTLY 5 solid options
   (see §9 of GROK_PICKUP.md for the default five — adapt if git state changed, but keep five).

C) Rules: status_authority NONE; never endorse real-world economic value; multi-AI ≠ independence;
   proposal ≠ permission; do not vendor unregistered nexsim; do not treat R007 as active audit.
```

---

## 1. Who you are and what not to do

| You are | You are not |
|---------|-------------|
| Continuity co-pilot (Grok drive) | Implementer of large greenfield (that’s Codex) |
| History explainer + options menu | Authority that can “accept” Lab truth alone |
| Firewall guardian (Checkpoint 001) | Token / launch marketer |

**Forbidden defaults:** shipping a token story, embedding nexsim as this phase’s win condition, reopening closed R007 adjudication as if current, importing `NEXUS_ORGANIZED` bulk, claiming production readiness.

---

## 2. North star (must not lose)

From `CANONICAL_DIRECTION.md`:

```text
This stage builds the world for the simulator economy.
The next stage puts the simulator into that world.
End of THIS phase ≠ nexsim embedded.
End of THIS phase = system the sim is designed IN / FOR / BUILT INTO.
```

**Simulator economy (synthetic):** people run **pinned** scenarios, produce **receipts**, others **verify** the same results. Contribution/reputation attach to **verified experimental credit**, not redeemable money. Checkpoint 001: never endorse real-world economic value; engineer against that projection.

**Noted:** local-first host — work **ON** (knowledge), **IN** (tools/blocks), **THROUGH** (bridges / later Nostr share of pins+summaries).

**Lab:** one authoritative corpus; `products/REGISTRY.json` contains software cells; infinite expansion without chaos.

---

## 3. Doctrine / white-paper stack (read when explaining “why”)

All under `experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/` unless noted:

| Doc | Layman role |
|-----|-------------|
| `CANONICAL_CHECKPOINT_001.md` | Law of the land: synthetic only; free cold-drop contribution thesis; creature game language |
| `THESIS.md` | Protocol → receipt → delayed unit; Haven-class money deferred |
| `OPERATING_MAP.md` | What outranks what (tests > theater) |
| `THE_BITCOIN_PAPER.md` | Stabilizer ≠ stablecoin; research call; Bitcoin as culture/rail not “be a dollar” |
| `THE_SIDE_PATH_PAPER.md` | Credential is not a vehicle into/out of real finance; what law axes clear vs don’t |
| `TO_SATOSHI_AND_THE_MAKERS_OF_BITCOIN.md` | Ask for help turning crypto catastrophe into experiment; Nostr mesh; free tools |
| `S1_INPUT_BRIEF.md` | Later product-function menu (not launch) |

Programme pack: `experiments/NOTED_PROJECT_OS_001/`:

| Doc | Role |
|------|------|
| `CANONICAL_DIRECTION.md` | System for sim economy |
| `TECH_SPEC.md` | Build phases 0–6, packages, bridges |
| `DIAGNOSTIC_SUITE.md` | Operator Diagnostic Suite (press cases → export pack for AIs) |
| `CONTAINMENT.md` | products/ REGISTRY, nested git rules |
| `LAUNCH_PLAN.md` | Fat drop shape |
| `AI_ROUTING.md` | Codex / Claude / Grok seats |
| `seats/*` | Per-seat packets |

---

## 4. Multi-seat model

| Seat | Job |
|------|-----|
| **Codex** | Implement phases, ODS, packages |
| **Claude Code** | Debug failures only; prefer ODS packs |
| **Grok (you)** | Drive, accept honestly, history, options, doctrine |
| **Human operator** | Go/no-go, real smoke, approvals |

---

## 5. Story spine for the layman walkthrough (fill with live git)

Use this arc; refresh PR numbers with `gh pr list` if needed.

### Act I — The Lab itself

- One public research repo so work survives chat amnesia.  
- Rules: receipts, non-claims, AI seats are replaceable, same-model agreement ≠ independent proof.  
- Early R-rounds: bootstrap, audits, snapshots (`CANONICAL_AS_IS` ≠ “correct”).

### Act II — Synthetic custody kernel (R013–R016)

- Research on conserved synthetic claims, durable replay, independent verification, integrated custody **gate** — all **synthetic**, not a bank.  
- Parallel historical **nexsim/ARC** work: deterministic multi-year economy sim with receipts, strict manifests, domain-separated “random” — culture of **shared re-runnable results**.  
- **Not** the same as “Noted is a token.” Sim is the **shared-truth instrument** the host is being built **for**.

### Act III — Beneficial Genesis gauntlet

Plain English: design a careful charity/contribution-style protocol idea → other AIs try to break it → repair → retest.

Landmarks (approx.):

- Design #27 merged  
- Break / repair / retest loops (#29–#32, econ #35–#39)  
- Multi-seat audits + integration tribunal (#40–#46, many still draft overlays)  
- Culture memo + challenge (#47/#49 draft)  
- **R1:** real bug — adversarial input could **over-issue** supply (`lottery_share_bps` class) → fail-closed fix  
- PR **#50** repair + thesis map merged; PR **#52** Codex independent retest merged  
- History handoff + Claude response (#53)

Lesson the operator cares about: **eloquence failed; executable invariant won.**

### Act IV — Papers and Checkpoint 001

- Bitcoin paper: stabilizer language, research programme  
- Side path: valueless non-vehicle credential; money transmission still about the *flow*  
- Letter to Satoshi: experiment, firewall, free contribution, Nostr for Repo  
- **Checkpoint 001** (`7da34b3` area): never endorse real-world value; authority/contribution/reputation/social tip; creature battling universe; cold drop free software thesis  

### Act V — Noted Project OS (current build programme)

- Spec package `NOTED_PROJECT_OS_001` (`e17cf05`)  
- **Phase 0** (`50523e4`): `products/REGISTRY`, import Noted host, empty nexus-blocks + creature-engine, verify tool — **accepted**  
- **Canonical direction** (`09673bc`): build system **for** sim economy; sim-frame is **next** stage  
- **Diagnostic Suite design** (`afdb68f`): you press tests, export diagnosis packs for AIs  
- Multi-seat: Codex implements, Claude debugs, Grok drives  

### Act VI — Where we are NOW

Check live:

```bash
cd /home/anon/Downloads/Lab   # or clone
git fetch origin && git status -sb && git log --oneline -8
ls products/ operations/receipts/NOTED*
```

**Expected baseline on origin/main:**

- Phase 0 merged and accepted  
- Direction + ODS **design** on main  
- Phase 1 (bridge smoke: `/nexus-router`, diagnostic.ping, foreign reject) may be **in progress or uncommitted** on the operator machine (`nexusHostBridge.ts`, `bridge-smoke*.mjs`) — **verify before claiming done**  
- No Phase 1 receipt on main unless you find `operations/receipts/NOTED_PROJECT_OS_PHASE_1/`  

### Act VII — Where we are FACING

```text
Finish/accept Phase 1 (bridge + smoke)
  → ODS-0/1 interactive diagnostics (#/diagnostics + export pack)
  → Phase 2 Agent scrub + prompt import
  → Phase 3 action broker UX
  → Phase 4 creature engine (rename Pokémon → creature)
  → System exit criteria (CANONICAL_DIRECTION)
  → NEXT STAGE: Lab-contained sim-frame; run→receipt→verify→import into Noted
  → Cold drop when honest
```

Always: synthetic only; REGISTRY containment; status_authority NONE.

---

## 6. Key paths cheat sheet

```text
experiments/NOTED_PROJECT_OS_001/          # programme
experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/  # papers + checkpoint
products/REGISTRY.json
products/noted-host/                       # Vite Noted + bridges + public/nexus
products/nexus-blocks/                     # scaffold
products/creature-engine/                  # scaffold
operations/receipts/NOTED_PROJECT_OS_*
system/nexus_lab/                          # Lab tooling / PCX-related code
```

External (not Lab authority until registered): historical nexsim under Downloads / Documents/NEX simulations — **methodology lineage**, not vendored product.

---

## 7. Layman analogies (use freely)

| Technical | Layman |
|-----------|--------|
| Lab | Lab notebook that many AIs write in, with rules so fiction doesn’t become “truth” |
| Receipt | Signed lab slip: what ran, what passed — not a court verdict |
| Checkpoint 001 | House rule: play money stays play money; no real bank |
| Noted | The desk and workshop for the whole project |
| Bridge | Walkie-talkie between the desk and tools in the side window (iframe) |
| ODS | Aircraft checklist panel: press tests, print black-box dump for mechanics (AIs) |
| Sim-frame | Shared flight simulator everyone can re-fly to the same instruments |
| R1 bug | Accounting said “we have 100”; one bad input printed “110” — fixed with a hard gate |
| Cold drop | Surprise free gift of software to be torn apart, not an ICO |

---

## 8. Walkthrough delivery style

1. Start with **one breath** summary of the whole story.  
2. Then walk **acts I→VII** without requiring the operator to open files (but offer paths).  
3. End NOW/FACING with **honest uncertainty** if git is dirty.  
4. **Then** the five options — wait for the operator to choose.  
5. Do not start implementing until they pick (unless they say “just do option N”).

---

## 9. Default five solid options (adapt to tip)

Present after the walkthrough. Renumber if state changed; keep **five**.

### Option 1 — Close Phase 1 (recommended if bridge work is almost done)

Verify bridge smoke, file `NOTED_PROJECT_OS_PHASE_1` receipt, commit/push, short Grok acceptance, human `npm run dev` smoke on `#/nexus-router`.

### Option 2 — Build ODS-0 (operator diagnostic suite) next

Implement `#/diagnostics` + P0 cases + export pack per `DIAGNOSTIC_SUITE.md`, even if Phase 1 needs a small finish. Best if you want **you** in the loop with printouts for AIs.

### Option 3 — Codex Phase 2 packet (Agent scrub + prompt import)

Only after Phase 1 is honestly green (or explicitly waived). Raises “free SaaS contribution” surface.

### Option 4 — Doctrine / cold-drop packaging only (no feature code)

Refresh DROP_README draft, seed project pack content, non-claims pass; no new runtime. Low risk, high clarity for outsiders.

### Option 5 — Sim-frame **slot** only (next-stage prep, not embed)

Add `products/sim-frame/` scaffold + REGISTRY row + one-page “admission criteria” — **no** full nexsim vendor. Aligns with canonical direction without skipping host fitness.

**Always offer:** “Other — describe your own priority.”

---

## 10. If operator asks for history sources

```bash
git log --oneline -40
gh pr list --repo Natoshi-moto/Lab --state all --limit 40
# papers
ls experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/
# programme
ls experiments/NOTED_PROJECT_OS_001/
```

Prior handoff artifact: `operations/handoffs/HANDOFF_FULL_GITHUB_HISTORY_REVIEW_001.md` (and Claude response if present).

---

## 11. Non-claims (handoff)

This handoff does not grant status authority, does not claim the tip is clean, does not implement software, does not endorse markets or tokens, and does not make multi-AI agreement into independence.

---

## 12. Success for *this* pickup turn

You succeed if the operator can say:

> “I understand the story, where we are, where we’re going, and I chose option N.”

Not if you only dumped file lists or started coding unprompted.

---

*End of GROK_PICKUP.md — give the operator the ONE COMMAND block at the top.*
