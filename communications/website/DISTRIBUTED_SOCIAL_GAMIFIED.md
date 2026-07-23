# Website evolution — Gamified distributed social (Nostr-first, Bluesky-class self-host)

**ID:** `WP-NEXUS-DISTRO-SOCIAL-001`  
**Date (UTC):** 2026-07-22  
**Author seat:** Grok  
**status_authority:** `NONE`  
**Parents:** [`WHITE_PAPER.md`](WHITE_PAPER.md) · [`TECH_SPEC.md`](TECH_SPEC.md) · [`experiments/THREE_PANE_EIDOLIN_MESH_001/WHITE_PAPER_PROPOSAL.md`](../../experiments/THREE_PANE_EIDOLIN_MESH_001/WHITE_PAPER_PROPOSAL.md) · Checkpoint 001 synthetic firewall  

**Class:** design proposal — culture mesh + game loops on a distrust-first site. **Not** a token white paper. **Not** “we’re the next Bluesky company.”

---

## 0. Picture

The public site is not only a docs projector. It becomes a **portal into a game of culture**:

- You download **Genesis Eidolin** (shared universe seed).  
- You run a **local client** (Noted-class host / three-pane desk later).  
- You own a **mesh identity** (Nostr keys; optional Bluesky/AT Proto DID when self-hosted).  
- Your **social graph is yours**: follows, lists, relays, PDS/AppView choices — not rented from one ad company.  
- **Game loops** (creatures, quests, verified runs, lineage merges) emit **receipts** that can optionally publish to **your** network.  
- The project website is a **pretty lighthouse + directory + genesis host** — not the only feed, not the only relay, not the bank.

```text
                    ┌─────────────────────────────┐
                    │  nexus.example (lighthouse) │
                    │  distrust · genesis · map   │
                    └─────────────┬───────────────┘
                                  │ discover
           ┌──────────────────────┼──────────────────────┐
           ▼                      ▼                      ▼
    Your Nostr relays      Your AT Proto PDS         IRC / P2P / HAM
    (or friends')          (Bluesky-class self-host)   culture pipes
           │                      │                      │
           └──────────────────────┴──────────────────────┘
                                  │
                    Local host + agent + Eidolin pocket
```

---

## 1. Thesis

> **Gamification without capture:** progress is measured in **verified craft and lineage**, broadcast over **user-chosen distributed social pipes** (Nostr first; Bluesky-class personal networks second), while the project website remains a **non-sovereign** entrance — beautiful, honest, and impossible to mistake for “the platform that owns your friends list.”

---

## 2. Why Nostr *and* Bluesky-shaped networks

| System | What we steal | What we refuse |
|--------|---------------|----------------|
| **Nostr** | Key-owned identity, multi-relay, simple events, cypherpunk default | Single “official” relay monopoly |
| **Bluesky / AT Proto** | Personal Data Server idea, portable handle, app views over data | Depending only on bsky.app corporate AppView |
| **Classic social** | Familiar follows / posts / replies | Engagement addiction dark patterns as core metric |
| **Web2 game platforms** | Quests, XP, cosmetics | Pay-to-win real-money rails |

**Design rule:** every social feature answers: *“If the lighthouse site dies tomorrow, does the user’s graph and pack still work?”* If no → redesign.

---

## 3. Gamification layer (honest loops)

### 3.1 Currencies of progress (synthetic membrane)

| Loop | Player action | Proof | Display |
|------|---------------|-------|---------|
| **Genesis claim** | Download + hash-verify pack | Local verify receipt | Badge: `GENESIS_BOUND` |
| **Lineage** | Mutate / breed / fork Eidolin | Parent hashes + op log | Creature card + tree |
| **Quest** | Complete published challenge (battle seed, re-run experiment, break card *synthetic*) | Deterministic outcome hash | XP **in-pack only** |
| **Verify others** | Re-run someone’s public run-pack | Match/mismatch receipt | **Reputation** (reproducibility credit) |
| **Desk stamp** | Optional GVA / session publish | Content hash + event id | “Was there” stamp — not truth oracle |
| **Mesh publish** | Post lineage/quest event to *your* relays | Signed event | Appears in your network |

**XP / rank / tips** stay **non-redeemable, non-investment** (Checkpoint 001). UI copy near scores: *synthetic standing*.

### 3.2 Anti-dark-pattern rules

- No infinite scroll as primary loop on lighthouse.  
- No “streak guilt” that punishes offline/HAM life.  
- No paid boost of ranking on project-operated surfaces.  
- Leaderboards optional, **forkable**, and clearly local-to-pack.  
- Mute/block are client-side first (user sovereignty).

### 3.3 Creature + agent as social objects

Publishing is optional:

```text
kind: eidolin.lineage.announce
content: { genesis_hash, lineage_root, creature_id, agent_binding?, pocket_standing? }
sig: user nostr key
```

Friends’ clients can pull, re-verify, and battle **without** the lighthouse intermediating every move.

---

## 4. Distributed social architecture

### 4.1 Identity

| Layer | Mechanism |
|-------|-----------|
| Default | **Nostr npub** (user generates locally; project never custodians) |
| Optional | AT Proto DID + handle on **user’s PDS** or friendly co-op PDS |
| Lab seats | Separate; never confuse AI seat keys with user keys |

Human **sign** and **publish** stay gated in host (Noted: `nostr.sign` / `nostr.publish` human-only).

### 4.2 Nostr event kinds (proposed namespace)

Use replaceable/parameterized kinds as NIP practice evolves; conceptual types:

| Type | Purpose |
|------|---------|
| `nexus.profile` | Display name, genesis bound, preferred relays |
| `nexus.lineage` | Creature/agent lineage announce |
| `nexus.quest.result` | Quest outcome + verify hash |
| `nexus.receipt.pointer` | Link to content-addressed receipt (IPFS/HTTP) |
| `nexus.relay.hint` | Community relay recommendations (not mandate) |
| `nexus.desk.stamp` | Optional GVA/session hash pointer |

All events: **status_authority none**; no “official truth” tag that overrides local verify.

### 4.3 Personal network = user configuration

Like Bluesky’s “my data, many apps,” each user has:

```text
~/.config/nexus-mesh/
  identity.json      # paths to keys — never in git
  relays.json        # THEIR relay list
  follows.json       # optional local social graph cache
  pds.json           # optional AT Proto endpoint
```

Lighthouse ships **example** relay lists and co-op PDS links. Users replace them.

### 4.4 Multi-homing (not monoculture)

A post can fan out:

1. Nostr relays (user list)  
2. Optional AT Proto record  
3. Optional IRC notice bot (user-run)  
4. Optional pure file drop (USB / HAM store-and-forward)

**Convergence Lab note:** multi-pipe publish is good for resilience; multi-pipe *agreement* is still not multi-institution science.

### 4.5 Independent relays & “counterculture internet”

Project stance:

- Document how to run a **minimal Nostr relay** and a **minimal PDS**.  
- Prefer **many small** over one big official.  
- IRC for live culture; Nostr for async signed objects; P2P for packs.  
- Future: bandwidth-hostile modes (dial-up/HAM) force small agents + compressed events — a **feature** for subculture, not a v1 blocker.

---

## 5. Website surfaces (additions to prior map)

| Route | Role |
|-------|------|
| `/play` | How gamification works; non-redeemable standing explained |
| `/genesis` | Download pack + hashes + mutate guide |
| `/mesh` | Nostr + PDS + IRC + P2P setup; **bring your own network** |
| `/relays` | Community-curated list (clearly non-mandatory) |
| `/lineages` | Optional explorer of **public** lineage events (client-side fetch from *user-chosen* relays) |
| `/quests` | Published challenges bound to pack version |
| `/verify` | Paste a run-pack / event id → local or WASM verify if possible |
| `/distrust` | Unchanged supremacy strip |
| `/social-not` | Explicit page: we are **not** your only social network |

**`/lineages` risk:** becomes fake Twitter. Mitigate: default to **opt-in follow graph**, no global algorithmic feed on lighthouse v1. Algorithmic feeds only in **user-run AppViews**.

---

## 6. Client responsibilities (local host)

Website discovers; **client plays**:

| Feature | Where |
|---------|--------|
| Keygen / sign / publish | Local host only |
| Creature sim / battles | Local / pack |
| Three-pane desk | Local app (later) |
| Relay choice | User settings |
| Quest runner | Local + optional publish |

Align with existing Noted Nostr bridge gates (draft → human sign → human publish).

---

## 7. Gamification × Convergence Lab

| Convergence object | Social/game surface |
|--------------------|---------------------|
| Agreement theater | Quest: “label this packet CORRELATED_UNDER_ONE_GATE” |
| Breaker survival | Quest: re-break a published claim |
| Epistemic filing | Optional publish of epistemic summary **as INFERENCE-tagged event** |
| Human Safety Gate | No multi-user vote can promote Lab STATUS |

Community can **play** at epistemology without seizing the Gate.

---

## 8. Attack section

| Attack | Mitigation |
|--------|------------|
| We become Bluesky-but-worse monoculture | No mandatory project AppView; BYO relays/PDS |
| Tokenization pressure on XP | Hard non-claims; no market UI; lint |
| Relay operator censorship | Multi-relay; teach self-host |
| Impersonation | Keys local; verify signatures; never “login with project” custody |
| Spam lineages | Rate limits client-side; optional web-of-trust later |
| Kids / safety | Age-gate culture content if needed; no dark patterns |
| Corporate rail confusion | Docs say research/culture mesh; not investment platform |
| Social graph as product hostage | Export follows; die-alive test quarterly |

---

## 9. Phased delivery

| Phase | Deliverable |
|-------|-------------|
| **S0** | This design doc (done) |
| **S1** | Lighthouse pages `/mesh` `/play` `/genesis` (static) |
| **S2** | Client: Nostr keygen + draft event + human publish for `nexus.lineage` |
| **S3** | Quest runner v0 bound to genesis pack |
| **S4** | Optional AT Proto publish path (user PDS) |
| **S5** | Community relay/PDS cookbook; no official monopoly |
| **S6** | Lineage explorer that **asks which relays** before fetch |

Human Safety Gate promotes each phase.

---

## 10. Success metrics

| Metric | Pass |
|--------|------|
| Die-alive | User can post lineage with lighthouse offline (relays up) |
| BYO network | User changes all relays; site still usable as download portal |
| No money story | Lint clean; standing labeled synthetic |
| Game fun | One complete quest loop offline |
| Gate intact | No social vote writes Lab STATUS |

---

## 11. One-line pitch

> **A beautiful lighthouse for a free Eidolin world — where your social graph lives on Nostr and self-hosted Bluesky-class networks you choose, progress is craft and verified runs, and nobody has to rent their friends list from us.**

---

## 12. Non-claims

- Not a securities offering or real-world currency.  
- Not a guarantee of relay uptime or global free speech.  
- Not multi-party institutional independence from multi-pipe posts.  
- Not a replacement for product security reds on host software.  
- `status_authority: NONE`
