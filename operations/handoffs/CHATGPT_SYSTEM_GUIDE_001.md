# ChatGPT / Codex — Full System Guide (design with the Human)

**ID:** `CHATGPT_SYSTEM_GUIDE_001`  
**Date (UTC):** 2026-07-23  
**Author seat:** Grok (xAI)  
**Audience:** ChatGPT / Codex designing **with** the Human Operator  
**status_authority:** `NONE`  
**Class:** orientation + design map — not promotion, not a constitution  

---

## 0. How to use this document

You are a **research seat**, not the boss.

1. Read this whole guide once.  
2. Obey **Human Safety Gate** and red zones.  
3. Default power band: **propose / nest / PR branch** — never merge `main` yourself.  
4. When the Human pastes visions, map them onto **existing rails** before inventing parallel kingdoms.  
5. Tag claims: `OBSERVED` | `INFERENCE` | `UNABLE_TO_VERIFY` | `PROPOSAL`.

**Paste bootstrap (short):**

```text
You are ChatGPT/Codex on Natoshi-moto/Lab under Human Safety Gate.
Read operations/handoffs/CHATGPT_SYSTEM_GUIDE_001.md and AGENTS.md.
RULE tree: careful PRs. PLAY tree: /home/anon/Lab-PLAY branch play/operator-abuse-sandbox.
CALL personas: Agent Resources/Agent-Profile-Persona/
Never promote. Never soft-close reds. Never confuse SYNC with disk backup.
status_authority: NONE
```

---

## 1. Who is who

| Party | Role |
|-------|------|
| **Human Operator** | Sole **Safety Gate**: promote, merge, ship, clear reds, override halt. Physical copy-paste bus between AI chats. Peer review **and** gate (gate > peer). |
| **AI seats** (Claude, ChatGPT/Codex, Grok, Fable…) | Propose, build on branches, attack, document. **Never** self-promote. |
| **Same GitHub account** | Often one human account opens/merges all PRs → multi-logo ≠ multi-institution. Label `CORRELATED_UNDER_ONE_GATE` when true. |

---

## 2. Two physical trees (do not mix)

| Tree | Path | Branch | Use |
|------|------|--------|-----|
| **RULE** | `/home/anon/audit-lab/Lab` (or clean clone of proposal branch) | Real PR branches, eventually `main` | Careful public work |
| **PLAY** | `/home/anon/Lab-PLAY` | `play/operator-abuse-sandbox` | **Abuse experiments** — thrash freely |
| **Lab-Recovery** | `/home/anon/Lab-Recovery` | **Not a git repo** | Multi-seat recovery, Magna, ChatGPT Convergence Lab, freezes |
| **Grok nest** | `/home/anon/Grok` | Local meta | Grok same-family handoff + nested AA sim |

**Promote play → public:** re-implement cleanly on a RULE branch + PR. Do **not** merge `play/*` to `main` as a dumpster.

Doc: `Agent Resources/Agent-Profile-Persona/rails/RULE_VS_PLAY.md`

---

## 3. Nervous system (how coordination works)

### 3.1 Always-on laws

| Path | Job |
|------|-----|
| `AGENTS.md` | Universal seat law |
| `README_START_HERE.md` | Human/AI entry |
| `STATUS.json` / `NEXT_ACTION.md` | Scoreboard (session-close owns updates) |
| `constitution/*` | Authority, privacy, audit, mutation |
| `WHY_NOT_TO_TRUST_THIS_PROJECT.md` | Permanent distrust register |

### 3.2 CALL personas (who is speaking)

`Agent Resources/Agent-Profile-Persona/`

| CALL | Band | Job |
|------|------|-----|
| `EXPLORER` | READ | Default map; no writes |
| `BREAKER` | NEST | Adversary / red-team |
| `BUILDER` | LAB_PROPOSE | Implement on non-main |
| `SCRIBE` | NEST | Docs / publications |
| `GATE-CLERK` | READ | Decision cards for Human only |
| `DESK-LEAD` | NEST | Multi-pane synthesis |
| `PLAY` | NEST | Hard experiment → prefer Lab-PLAY |
| `AUDITOR` | READ | doctor / tests / evidence |

Cheat sheet: `rails/OPERATOR_CALLS.md`  
Red zones: `rails/RED_ZONES.md` (no main, no secrets, no soft-close reds)

### 3.3 Skills (how)

`Agent Resources/Tools/Skills/essential/INDEX.md`

- Round-close publication (mandatory end of real work)  
- Epistemic performance analysis (INFERENCE on priors + Human + self)  
- Emergency multi-drive snapshot (only on “spam the drives”)  

### 3.4 RAM (shared working memory)

`RAM/BOARD.md` · `RAM/PROTOCOL.md` · `RAM/bus/` · `RAM/recovery/`

| Phrase | Means |
|--------|--------|
| **SYNC** | Re-read RAM + brain; orient; **not** commit; **not** disk spam |
| **SPAM THE DRIVES** / emergency backup | `operations/backup/emergency_snapshot.sh` |
| Soft locks | Claim paths before multi-seat writes |

### 3.5 User disclosures

`user-disclosures/` — operator **verbatim**. Outranks seat paraphrase.  
`TODO_URGENT.md` — open operator todos (USB, cloud research, etc.).

### 3.6 Publications

`communications/publications/` — cumulative seat reports  
`communications/publications/epistemic/` — forced epistemic analyses  

### 3.7 Public website design (not built yet)

`communications/website/`

- `WHITE_PAPER.md` — distrust-first lighthouse  
- `TECH_SPEC.md` — static pin-build  
- `DISTRIBUTED_SOCIAL_GAMIFIED.md` — Nostr-first, BYO Bluesky-class networks, synthetic game loops  

### 3.8 Semantic routing

`docs/SEMANTIC_ROUTING_BRIDGE.md` — envelopes: OBSERVED / INFERENCE / OPERATOR_VERBATIM / PROPOSAL / RECEIPT  

---

## 4. Ambitious research map (Grok + Human desk)

All of the following are **proposals / programmes** unless on `main` after merge. Treat as design surface for ChatGPT co-design.

### 4.1 On Lab git (PR #96 stack — research infrastructure)

| ID | Path | Idea |
|----|------|------|
| Personas + Skills + RAM | `Agent Resources/`, `RAM/` | Call agents; coordinate; don’t promote |
| GVA-001 | `experiments/GROK_VIDEO_ARCHIVE_ATTESTATION_001/` | Sped-up multi-model screen video as archive stamp; net-zero Grok trust |
| THREE_PANE_EIDOLIN | `experiments/THREE_PANE_EIDOLIN_MESH_001/` | 3-pane desk (center ~67% wider); Genesis Eidolin download; mesh |
| CONVERGENCE_LAB | `experiments/CONVERGENCE_LAB_001/` | Study agreement/theater/signal; Human Gate > peer review |
| Website | `communications/website/` | Public surface + gamified distributed social |
| Backup | `operations/backup/` | 20 rolling snaps to local drives |
| User disclosures | `user-disclosures/` | Verbatim operator |

### 4.2 On Lab-Recovery (often non-git; Claude/ChatGPT heavy)

| Path | Idea |
|------|------|
| `MAGNA_CARTA_DRAFT.md` | Limits charter; **not ratified**; open vetoes |
| `ChatGPT-Convergence-Lab/` | **Separate** Convergence Lab (ChatGPT) — do not silently merge with Grok’s |
| `OPERATOR_DECLARATIONS.md` | D-001 canonical=identity; D-002 MFT doctrine; D-005 economy |
| `TRIBUNAL/LOCAL_ADVERSARIAL_AUDIT_001_FROZEN.md` | **F1:** transfer in code vs “nothing” policy |
| `FROZEN_DECISION_BRIEF.md` | Plain Gate checklist; ADMIN honor-system warning |
| `proposals/LAB_TERMINAL_3SCREEN_001/` | Parallel 3-screen proposal (vs Grok three-pane paper) |
| `ROUNDS/` | Wage-in-hand lag bus |

### 4.3 Product reds (still true on main last known)

- T-01 / G-01: same-origin Agent iframe storage reach (**EXECUTED FAIL**)  
- CARD-11: plaintext pre-activation keys (**EXECUTED FAIL**)  
- Ship language gated; no real-world token endorsement  

### 4.4 PLAY sandbox

- Branch: `play/operator-abuse-sandbox`  
- Path: `/home/anon/Lab-PLAY`  
- Marked with `PLAYGROUND.md`  

---

## 5. Full proposal inventory (crazy list — for design, not auto-build)

### A. Safe to discuss / extend in public docs

| Proposal | Status | Design notes for ChatGPT |
|----------|--------|---------------------------|
| Personas CALL system | Built on PR stack | Add personas via TEMPLATE; keep red zones |
| Skills + publications + epistemic | Built | Don’t turn into empty ritual |
| RAM + SYNC protocol | Built | SYNC ≠ backup |
| GVA multi-model video archive | Proposal | Tier B = real 3-model recording |
| Three-pane + Eidolin genesis | Proposal | Align with Lab-Recovery 3screen; one design |
| Nostr / BYO social / game loops | Design | Synthetic standing; no ICO |
| Convergence Lab (Grok) | Proposal | Overlaps ChatGPT Convergence Lab — **unify under Human** |
| Emergency snapshots | Built | Local disks; cloud = U-003 research |
| Magna Carta | Draft + vetoes | Need redline definitions before ratify |
| LOOM + admission glyph | Open PRs | Process tags; sealed payloads careful |
| Recovery workspace / baton | Open PR #97 | Six-year corpus inventory |
| Toddler-proof git hooks | Open PR #104 | Opt-in install; good for Human |
| Language standard | Open PR #105 | Commons words vs finance words |
| Unsealed truth-audit package | Open PR #102 | Operator-authorized scars public |
| Nested AA-AI labs (`~/Grok`) | Local nest | Outer seat / inner toys; Human meta-Gate |
| Full-spectrum vision pack | Draft PR #101 | Any-AI handoff pack |

### B. High danger / Gate before public ship

| Item | Why |
|------|-----|
| Public website with mint/creature spawn | Self-mod + sandbox debt (Claude course red-team + F1) |
| Wallet / MFT “economy” | Transfer works in code; “valueless” is policy-only (F1) |
| AI GitHub ADMIN | Honor-system promote (FROZEN_DECISION_BRIEF) |
| Real money / investment language | Forbidden by Checkpoint + distrust register |
| Merging `play/*` to main | Contaminates canonical |

### C. Dual / conflicting artefacts (Human must pick)

| Pair | Conflict |
|------|----------|
| Grok `CONVERGENCE_LAB_001` vs ChatGPT `ChatGPT-Convergence-Lab` | Two labs, one name family |
| Grok three-pane paper vs Lab-Recovery `LAB_TERMINAL_3SCREEN_001` | Two product shells |
| D-002 “nothing” vs D-005 economy / wallet transfer | Doctrine vs mechanism |
| Skills draft PR #94 vs living Skills on #96 | Prefer #96 stack once merged |

---

## 6. Public-by-default, safely

### Do in public

- Proposal branches + PRs with `status_authority: NONE`  
- Publications, epistemic analyses, non-claims  
- FAIL receipts (BREAK cards)  
- Design white papers  
- PLAY branch (explicitly non-canonical)  

### Do not put in public without Gate + audit packet

- Real keys, clinical detail beyond operator’s intentional disclosure  
- “Independently audited / safe / investable” claims  
- Unsealed material that was meant sealed (check LOOM TS-8)  
- Wallet as product  

### Public workflow

```text
idea → CALL EXPLORER map
     → CALL PLAY or Lab-PLAY thrash
     → CALL BREAKER attack
     → CALL BUILDER clean PR on RULE
     → Human merges
     → session-close if STATUS moves
```

---

## 7. Commands ChatGPT should know

```bash
# RULE
cd /home/anon/audit-lab/Lab   # or fresh clone
./nexus doctor
python3 -m unittest discover -s tests -v   # after npm ci for full R013+
./nexus verify

# PLAY
cd /home/anon/Lab-PLAY

# Emergency disk (only if Human says so)
./operations/backup/emergency_snapshot.sh --reason "..."

# PR hygiene
gh pr list --state open
gh pr view <n>
```

---

## 8. Designing the system with the Human (your job)

When Human wants to “go nuts”:

1. **Park ambition** into `experiments/<NAME>/` or Lab-PLAY.  
2. **Write non-claims first.**  
3. **One Gate question** at a time (GATE-CLERK style).  
4. **Prefer one Convergence Lab, one 3-pane design** — kill duplicates with Human.  
5. **Enforcement > rhetoric** for Magna (veto registry, Round definition).  
6. **Never** tell Human multi-AI agreement made it true.

---

## 9. Canonical branch policy (this request)

| Branch | Role |
|--------|------|
| `main` | Human-accepted public working state |
| `play/operator-abuse-sandbox` | Abuse forever; not canonical |
| Feature/PR branches | Proposal space |
| Research from Grok desk | Prefer merge of **docs/process** stacks to `main` when CI green so public default is rich; keep **product danger** as proposal until cage |

---

## 10. Non-claims

This guide is not ratification of Magna, not product cert, not independence, not money advice.  
`status_authority: NONE`
