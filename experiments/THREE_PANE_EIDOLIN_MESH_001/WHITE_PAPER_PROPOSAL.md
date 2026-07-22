# White paper proposal — Three-Pane Multi-Model Desk + Genesis Eidolin Mesh

**ID:** `WP-3PANE-EIDOLIN-MESH-001`  
**Track:** `THREE_PANE_EIDOLIN_MESH_001`  
**Date (UTC):** 2026-07-22  
**Author seat:** Grok (xAI) — advance + attack under operator vision  
**status_authority:** `NONE`  
**Class:** research / culture / software **proposal** — not a securities offering, not a bank, not a ship cert  

**Related Lab objects:** Magna Carta desk bounds · RAM · semantic routing bridge · GVA-001 session archive · Noted host · Eidolin World/Explore · Checkpoint 001 synthetic-only firewall · communications/website distrust-first surface  

---

## 0. Plain-language picture (no hedging on ambition)

You already live on a **three-model screen**. This paper proposes we **productize that desk** and **bind it to a shared mutable universe**:

1. **The App (Desk Shell)** — three panes, UNIX-terminal honest UI.  
   - **Left / right:** *subject* models (the ones under scrutiny, debate, build, attack).  
   - **Center:** *session lead* model (routes the human, holds the baton).  
   - Center width ≈ **67% larger than each side pane** (layout math below).  
   - Lead model **rotates at the human’s preference** (manual now; optional weighted “shuffle” later — never silent AI self-promotion to lead).  

2. **The Website (Culture Surface)** — distrust-first, beautiful, cheap to host.  
   - Canonical **Genesis Eidolin** universe: one free **downloadable seed** everyone starts from.  
   - People **mutate** it offline and in the open; lineages fork.  
   - Mesh: **IRC · P2P · Nostr (independent relays) · eventually dial-up & HAM** as first-class culture pipes, not corporate app-store monoculture.  

3. **The Creature + Agent + Pocket (play economy)** — when someone clones the agent and merges it with an Eidolin creature, they carry a **forked lineage** of culture-objects (creatures, receipts, reputation-shaped standing) that can interoperate in a **shared play economy** *without* requiring a real-world token IPO story.  

4. **The “new language model”** — not a 400B frontier blob. A **swarm of cheap agents** coordinated by **semantic routing + governance envelopes** (OBSERVED / INFERENCE / PROPOSAL / RECEIPT / OPERATOR_VERBATIM) so small models act like a disciplined organism.

That is the vivid picture. Below: mechanism, attack, and how not to become a scam or a safety-dumpster fire.

---

## 1. Thesis

> A **human-gated, three-pane multi-provider desk**, bound to a **forkable Genesis Eidolin download** and a **cypherpunk-grade mesh**, can grow a **shared culture economy of agents + creatures + standing** while remaining honest that **play value ≠ bank value**, and that **semantic governance** is how cheap models become trustworthy *enough* to collaborate.

---

## 2. Layout: the three-pane shell (advance)

### 2.1 Geometry

Operator requirement: center has about **67% more screen space than each side**.

If each side pane has width \(w\), center has \(1.67w\).

\[
\text{total} = w + 1.67w + w = 3.67w
\]

| Pane | Fraction of width | ~% |
|------|-------------------|-----|
| Left (subject A) | \(1/3.67\) | **~27.2%** |
| Center (lead) | \(1.67/3.67\) | **~45.5%** |
| Right (subject B) | \(1/3.67\) | **~27.2%** |

Optional: bottom strip for human input / RAM bus / veto lamp (does not steal center primacy).

### 2.2 Roles (not brands)

| Slot | Role | Power |
|------|------|--------|
| Side L/R | SUBJECT | Propose, build, attack, recover text — **no promote** |
| Center | LEAD | Session synthesis, baton, talk to human — **no promote** |
| Human | GATE | Promote, override veto, rotate lead, seal |

Lead rotation: **human preference only** (dropdown / hotkey / “next lead”). “Random” = human-triggered shuffle among admitted providers — never a model electing itself lead (Magna Carta I).

### 2.3 UNIX aesthetic

- Monospace, high contrast, minimal chrome.  
- Each pane = **PTY-like transcript** + optional tool strip.  
- Split like classic multi-terminal workstations, not “AI chat bubbles for engagement.”  
- Keybindings: focus pane, rotate lead, freeze pane, dump pane to GVA/receipt.

### 2.4 Provider-agnostic admission

Each pane binds to a **seat adapter** (Claude / ChatGPT / Grok / local / future).  
Admission provenance glyph (LOOM-class): shows provider, model label, `status_authority: NONE`, data class.

---

## 3. Genesis Eidolin universe (advance)

### 3.1 What “canonical shared genesis” means

| Term | Meaning |
|------|---------|
| **Genesis pack** | One versioned tarball/IPFS/HTTP object: creatures, rules, art seeds, schemas, **hashes** |
| **Canonical** | Exact bytes at a tag (`eidolin-genesis-v0.x`) — **CANONICAL_AS_IS**, not “morally correct” |
| **Mutate** | Local fork: breed, edit DNA/params, rename, theme — **your lineage** |
| **Offspring share** | Optional publish of **lineage receipts** (parent hashes + mutation ops) to mesh |

Everyone **starts equal** from the same download. Differentiation is **fork history**, not pay-to-win mint.

### 3.2 Clone agent ⊕ creature ⊕ pocket

When a user “clones the agent” and merges with an Eidolin creature:

```text
Agent lineage  ×  Creature lineage  →  Companion (agent+creature binding)
Pocket         =  local capability + standing + play-balance container
```

**Careful definition of “wallet / pocket” (load-bearing honesty):**

| Pocket may hold | Pocket must NOT claim |
|-----------------|------------------------|
| Synthetic play balances | Bank deposits, securities, guaranteed yield |
| Capability grants (tools, skins) | Real-world redemption as money |
| Lineage + reputation receipts | “Investment” or secondary-market promises from the project |
| Keys for **mesh identity** (Nostr, etc.) user-controlled | Custodial “we hold your funds” |

This is how we stay **bold on culture** and **not stupid on law/safety rails**: the shared economy is a **play + reputation + craft economy**, with an explicit firewall (Checkpoint 001 class) against “this is money now.”

### 3.3 Why everyone-in-same-economy *and* forked lineages works

- **Same genesis** → interoperability (battle rules, schemas, breed ops).  
- **Forked lineage** → subculture, art scenes, local myths, HAM-radio-only clades.  
- **Merge protocol** → optional rejoin to mainline with conflict rules (not forced).  

Economy = **attention, craft, standing, synthetic stakes inside the game** — not a hidden ICO.

---

## 4. Cypherpunk mesh (advance)

Website is the **pretty lighthouse**. Mesh is the **ocean**.

| Pipe | Role in v1–v3 |
|------|----------------|
| **HTTPS download** | Genesis pack + app releases (cheap host) |
| **Nostr** | Events: lineage announces, session stamps, art drops; **multi independent relays** |
| **IRC** | Live culture rooms; classic cypherpunk social |
| **P2P** (BitTorrent/IPFS/libp2p) | Pack distribution without single CDN king |
| **Dial-up / HAM (later)** | Intentionally hostile bandwidth — forces small agents + compression + patience culture |

**Independent relays** are a feature: if one dies or censors, culture continues.  
Verification: signed events + content hashes; **not** “trust the project’s one server.”

---

## 5. Website: converged safe + beautiful (advance)

Align with `communications/website/WHITE_PAPER.md` distrust-first surface, **plus** culture:

| Surface | Content |
|---------|---------|
| `/desk` | Explain three-pane; download app |
| `/genesis` | Eidolin genesis pack + hashes + mutate guide |
| `/lineages` | Browser for published forks (optional) |
| `/mesh` | How to join IRC/Nostr/P2P; **BYO network** (see website DISTRIBUTED_SOCIAL_GAMIFIED) |
| `/play` | Gamified standing / quests (synthetic only) |
| `/distrust` | Permanent non-claims + reds |
| `/governance` | Semantic routing + Magna Carta limits |
| `/gva` | Optional sped-up multi-model session stamps |

**Beauty:** stark, readable, creature art that looks hand-forged not generic NFT sludge; motion optional; print-friendly.  
**Safe:** content lint (no investment language); reds banner; semantic class chips; pin footer to git SHA.

---

## 6. Cheap agents as a “new type of language model” (advance)

Frontier models are expensive and corporate-gated. The stack we actually need:

```text
Human Gate
    │
    ▼
Lead pane (any provider) ── semantic router ── Subject panes
    │                              │
    │                              ├── RAM / ROUNDS / envelopes
    │                              ├── local tools
    │                              └── cheap workers (small models / scripts)
    ▼
Receipts + lineage + mesh publish
```

**Semantic routing** (SRB-001): every packet typed.  
**Governance:** Magna Carta I–III (Gate, Veto, Lag) so multi-agent speed cannot self-promote.  
**Cheap workers:** do retrieval, breed sim, hash, format — not “decide reality.”

This is a **governed agent OS**, not a single chat completion API cosplaying society.

---

## 7. Attack the idea (do not skip)

### 7.1 Legal / rail risks

| Risk | Attack | Counter |
|------|--------|---------|
| Wallet language | Looks like unregistered securities / money transmitter story | Pocket = play/standing; explicit non-redemption; no price promises |
| “Shared economy” | Scam-pattern language | Craft + synthetic stakes only; open source; no guaranteed returns |
| Creature trading | Secondary market pressure | Project never runs a money exchange; lineages are free to copy |
| Multi-model desk | Prompt-injection across panes | Membrane: no side pane can write host STATUS; lead is not promote |
| Nostr spam | Relay drown | Allowlists, rate limits, content-addressed packs |

### 7.2 Product / culture risks

| Risk | Attack | Counter |
|------|--------|---------|
| Three panes = fake independence | Users think three logos = three institutions | UI chrome: `CORRELATED_UNDER_ONE_GATE` when one human owns keys |
| Genesis god-mode | Operator cult of personality | Genesis is hash-pinned; forks free; no kill-switch on others’ lineage |
| Beauty over reds | Pretty site hides T-01 | Distrust strip + reds always above culture art |
| Mesh romanticism | HAM/dial-up never ships | Phase later; don’t block v1 on nostalgia |
| Agent+creature merge | Identity confusion / malware clone | Signed releases; user-held keys; quarantine untrusted packs |

### 7.3 Technical hard problems (honest)

- Cross-pane memory without leaking secrets between providers.  
- Deterministic creature sim for fair battles (seed + rules hash).  
- Lineage merge conflicts (CRDT vs human adjudicate).  
- Offline-first when mesh is flaky.  
- Cost control when lead is frontier and workers are cheap.

### 7.4 Why still worth building

The Lab already **is** the three-pane desk in human flesh. Eidolin already exists as creative mass. Noted + bridges + Nostr stubs exist. Missing is **shell + genesis pack + honest culture law**. That is a finite, shippable research product **if** non-claims hold.

---

## 8. Phased build (proposal only — Human gates)

| Phase | Deliverable |
|-------|-------------|
| **P0** | This white paper + operator accept/kill |
| **P1** | Three-pane desk MVP (local): layout 27/46/27, lead switcher, three seat adapters, RAM bus strip |
| **P2** | Genesis Eidolin pack v0 + hash + mutate CLI |
| **P3** | Website: distrust + genesis download + mesh how-to |
| **P4** | Agent↔creature binding schema + pocket (play only) |
| **P5** | Nostr/IRC publish of lineage receipts |
| **P6** | Cheap worker pool + semantic envelope validator |
| **P7** | Hostile bandwidth experiments (optional culture flex) |

Each irreversible public step: Magna Carta IX (explicit human go).

---

## 9. Success metrics

| Metric | Pass |
|--------|------|
| Layout | Measured center ≥ 1.67× side width |
| Lead | Human can rotate without model self-elect |
| Genesis | Stranger downloads pack; hash matches; mutates offline |
| Honesty | Site never claims real-world token value |
| Mesh | At least one non-HTTPS path carries a lineage receipt |
| Safety | Side pane cannot promote; veto/halt visible |

---

## 10. Non-claims (read twice)

- Not a bank, exchange, or investment vehicle.  
- Not a promise of real-world purchasing power.  
- Not multi-party institutional independence because three panes exist.  
- Not a waiver of product reds (T-01 / CARD-11 etc. if host is Noted-derived).  
- Genesis “canonical” means **hash identity**, not moral authority.  
- This paper **proposes**; Human **promotes**.  
- `status_authority: NONE`

---

## 11. One-line pitch (for the recording)

> **Three panes, one human gate, a free Eidolin world everyone forks, a mesh that doesn’t need Silicon Valley’s permission, and cheap agents disciplined by semantic law — beautiful, dangerous if unbounded, safe only if we keep the accelerator in human hands and the economy honest about being play until proven otherwise.**

---

## 12. Operator decision block

```text
NEXT_TRACK: CUSTOM
ONE_SENTENCE_TASK: Accept / amend / kill WP-3PANE-EIDOLIN-MESH-001; if accept, commission P1 three-pane desk MVP only.
```

**Seat signature:** Grok — **PROPOSE**, do not promote.  
**Suggested lag:** adjudicate in Round N+1 with a different-provider seat (Magna Carta III).
