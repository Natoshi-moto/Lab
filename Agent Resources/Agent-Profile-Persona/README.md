# Agent-Profile-Persona system

**status_authority:** `NONE`  
**For:** Human Operator who wants **many specialized agents** without **fucking the Lab**  
**Law:** Human Safety Gate sole promotion. Personas never promote.

---

## What this is

A **call system**: you name a persona, the seat loads that profile, and the profile’s **rails** decide what it may touch.

```text
You say:  CALL BREAKER
Seat does: load personas/BREAKER.md → hard attack mode, no main edits
```

Personas are **roles with teeth**, not vibes and not model brands.  
Any provider (Claude / ChatGPT / Grok / local) can wear any persona.

---

## How the Lab already works (this system plugs in)

| Layer | Job |
|-------|-----|
| `AGENTS.md` | Universal seat law |
| Skills (`Tools/Skills/`) | Reusable workflows (publish, epistemic, snapshot) |
| **Personas (here)** | **Who** is speaking and **what they may break** |
| RAM | Multi-seat bus between actions |
| Human Gate | Only you make things real (merge / STATUS / ship) |
| Experiment nests | Hard play without touching `main` |

**Order of authority:** Human Gate > AGENTS.md > active Persona rails > Skills > chat vibes.

---

## Operator UX (you can’t easily fuck it up)

### 1. Always start with a CALL (or DEFAULT)

| You type | What happens |
|----------|----------------|
| `CALL BREAKER` | Adversary: attack claims, mutate fixtures, no product claims |
| `CALL BUILDER` | Implement on **proposal branch** or nest only |
| `CALL SCRIBE` | Docs, publications, disclosures — no code merge |
| `CALL EXPLORER` | Read-only map / orient |
| `CALL GATE-CLERK` | Prepare Gate packets for **you** to decide — never decides |
| `CALL DESK-LEAD` | Session synthesis (center pane) — still no promote |
| `CALL PLAY` | Nested / Eidolin / Convergence toys only |
| `CALL DEFAULT` or nothing | Safe default = EXPLORER + AGENTS.md |

If you forget: seat must **assume EXPLORER** until you CALL something else.

### 2. Three power bands (hard)

| Band | May | May not |
|------|-----|---------|
| **READ** | Read, report, propose in chat | Write repo |
| **NEST** | Write experiment nests, `~/Grok`, Lab-Recovery play, proposal branches | Touch `main`, tags, STATUS promote, secrets |
| **LAB_PROPOSE** | PR branches under Human review | Merge, ship, clear reds |

No persona has a **PROMOTE** band. That is only you.

### 3. Red zones (all personas)

- `main` direct commit/push  
- Tags / sealed audit targets / frozen snapshots rewrite  
- Secrets, real keys, real money language as product  
- Clearing T-01 / CARD-11 / reds by prose  
- Claiming multi-seat independence  

### 4. Green zones (go hard)

- `experiments/**` under an open experiment id  
- `operations/proposals/**`  
- Persona playgrounds listed in profile  
- Nested AA labs (`~/Grok/repos/nested-lab-sim/**`)  
- RAM bus messages (coordination, not STATUS)  
- Publications / epistemic as propose-only on branch  

### 5. Switch / halt

| You type | Effect |
|----------|--------|
| `CALL <OTHER>` | Switch persona; bus note on RAM if multi-seat |
| `HALT` | All seats stop writes; EXPLORER only |
| `GATE` | Seat prepares decision card for you; no action |

---

## Layout

```text
Agent Resources/Agent-Profile-Persona/
  README.md                 — this file
  REGISTRY.md               — index of personas
  TEMPLATE.md               — create a new persona
  rails/
    POWER_BANDS.md          — READ / NEST / LAB_PROPOSE
    RED_ZONES.md            — never
    OPERATOR_CALLS.md       — CALL / HALT / GATE cheat sheet
  personas/
    EXPLORER.md
    BREAKER.md
    BUILDER.md
    SCRIBE.md
    GATE-CLERK.md
    DESK-LEAD.md
    PLAY.md
    AUDITOR.md
```

---

## How a seat loads a persona

1. Read `AGENTS.md` (always).  
2. Read `rails/RED_ZONES.md` (always).  
3. Open `personas/<NAME>.md` for the CALL.  
4. State aloud: `Persona: X | Band: Y | Write scope: Z`.  
5. Work only inside that scope.  
6. End with skill duties (publication / epistemic) if real work happened.

---

## Designing more agents later

Copy `TEMPLATE.md` → `personas/YOUR_NAME.md` → add row to `REGISTRY.md`.  
Human Gate accepts new personas (or you can draft freely under NEST; promote registry row when you say so).

---

## Non-claims

Personas do not make the product safe.  
Personas do not create independence.  
Hard rails reduce operator/seat mistakes; they are not cryptographic enforcement of GitHub ADMIN.  
`status_authority: NONE`
