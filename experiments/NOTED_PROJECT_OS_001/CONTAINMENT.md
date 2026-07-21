# Containment model — infinite expansion without chaos

**Status:** `LOAD-BEARING / STATUS_AUTHORITY: NONE`  
**Principle:** Expand like the synthetic economy: **rich inside, firewalled outside, registered always.**

---

## 1. Problem this solves

From this point forward, the project will accumulate:

- Noted host source  
- Nexus router + blocks (Agent, creature engines, Prompt Studio)  
- Lab research experiments  
- Cold-drop fat material for contributors  
- Future modules without bound  

Without containment, that becomes another `NEXUS_ORGANIZED`-style dump: high value, unusable, epistemically noisy.

## 2. Law: one Lab, many packages, zero orphan roots

Lab contract remains:

```text
one repository = one authoritative corpus namespace
main           = accepted working state
```

**Expansion rule:** every new software or research unit is a **registered package** under a fixed tree. Nothing may live at random paths and claim canonicity.

### 2.1 Canonical tree (target)

```text
Lab/   (this repo — sole authority)
├── constitution/ … existing
├── experiments/ … research experiments (existing pattern)
├── operations/  … routes, receipts, seats, tasks
├── programmes/  … multi-experiment programmes (optional spine)
├── products/                    ← NEW: software products (contained expansion)
│   ├── REGISTRY.json            ← load-bearing index
│   ├── REGISTRY.schema.json
│   ├── noted-host/              ← package: host app
│   ├── nexus-blocks/            ← package: agent, creature, prompt shells
│   ├── creature-engine/         ← package: pure battle/creature libs
│   └── <future-id>/             ← only after REGISTRY entry + receipt
├── drops/                       ← NEW: fat-drop assembly (build output + curated corpus)
│   ├── DROP_MANIFEST.json
│   └── COLD_DROP_001/           ← publishable slice (generated or staged)
└── experiments/NOTED_PROJECT_OS_001/  ← this programme (specs + seats)
```

### 2.2 What is forbidden

| Forbidden | Why |
|-----------|-----|
| New top-level junk folders without REGISTRY | Chaos |
| Unregistered nested git with independent “truth” | Split authority |
| Duplicating Lab papers into product without hash bind | Epistemic drift |
| Wallet/token product packages as default landing | Checkpoint 001 violation |
| Fat-drop including `05_unsorted`-class bulk | Unusable gift |

### 2.3 What is allowed (infinite expansion)

| Allowed | How |
|---------|-----|
| New experiment under `experiments/<ID>/` | Existing Lab pattern + receipt |
| New product under `products/<id>/` | REGISTRY entry + package README + non-claims |
| Nested git repo **inside** a product | Only if registered; Lab pins commit SHA in REGISTRY |
| New block under `products/nexus-blocks/blocks/<name>/` | Block registry + capability declaration |
| New drop under `drops/COLD_DROP_NNN/` | Manifest + scrub checklist pass |

**Infinity = new registry rows, not new physics.**

---

## 3. Package registry (load-bearing)

Every entry in `products/REGISTRY.json`:

```json
{
  "id": "noted-host",
  "path": "products/noted-host",
  "kind": "host|blocks|engine|tool|drop-slice",
  "ring": 0,
  "status": "scaffold|build|runtime-pending|drop-ready",
  "status_authority": "NONE",
  "parent_programme": "NOTED_PROJECT_OS_001",
  "checkpoint_bind": "BGEN-CANONICAL-CHECKPOINT-001",
  "nested_git": {
    "enabled": false,
    "remote": null,
    "pinned_commit": null
  },
  "ai_default_seat": "codex|claude|grok|any",
  "fat_drop_include": true,
  "synthetic_economy_surface": false,
  "real_world_value_forbidden": true,
  "readme": "products/noted-host/README.md"
}
```

### 3.1 Nested git rules (sub-repos without chaos)

If `nested_git.enabled = true`:

1. Nested root **must** be exactly `products/<id>/` (not deeper freestyle).  
2. Lab `REGISTRY.json` **must** pin `pinned_commit` (full SHA).  
3. Nested repo **must not** claim Lab authority; its README states `status_authority: NONE` and “Lab is corpus authority.”  
4. CI on Lab verifies: registry pin matches submodule/nested HEAD **or** fail.  
5. Default contribution path: PR to Lab that updates pin + receipt — not silent nested pushes only.  
6. Prefer **subtree or monorepo package** first; nested git only when package size/velocity demands it.

**Mental model:** nested repos are **cells in a membrane**, not peer galaxies.

---

## 4. Rings (mutation cost) — same spirit as Noted/Nexus specs

| Ring | Contents | Mutation rule |
|------|----------|----------------|
| **0** | Host bridge, action broker, REGISTRY, Checkpoint binds, pack.js offline contract | Explicit task + dual seat review |
| **1** | IDB schema, Nostr bridge, capability registry, drop manifest schema | Explicit task + receipt |
| **2** | Individual blocks (agent HTML, creature engine), UI studios | Normal PR; broker for agent-driven edits |
| **3** | Docs, seat notes, non-load-bearing experiments | Fast path |

Agent-driven changes never skip rings via eloquence.

---

## 5. Epistemic discipline (how packages add signal)

Each package **must** ship:

1. `README.md` — purpose, non-claims, verify commands  
2. `LANDMINES.md` or section — what not to break  
3. `RECEIPT` path under `operations/receipts/` when promoted  
4. Evidence class honesty: SOURCE / BUILD / RUNTIME separately  
5. No STATUS self-promotion (`status_authority: NONE`)

Packages **must not** ship:

- Unredacted secrets, live keys, personal chat dumps  
- Unscoped “everything” zips as canonical  
- Conflicting second constitutions  

---

## 6. Smart AI routing (contained by design)

Routing is **declared**, not vibed:

| Work type | Default seat | Write scope |
|-----------|--------------|-------------|
| Greenfield implement BB-*, host, blocks | **Codex** | `products/**`, listed tests |
| Debug failures, flaky tests, bridge bugs | **Claude Code** | Same + repro notes |
| Drive operator plan, acceptance, adversarial test | **Grok** | `operations/**`, seat reports; limited code |
| Doctrine / checkpoint language | Operator + Grok draft | `experiments/**` papers |

See `AI_ROUTING.md` and `seats/*`.

Route packs (Lab `operations/routes/`) should include **only** the packages in REGISTRY for that task — never whole-disk harvests.

---

## 7. Synthetic-economy parallel (intentional metaphor)

| Economy rule | Repo rule |
|--------------|-----------|
| No vehicle to real money | No package becomes external truth without Lab pin |
| Credential = synthetic standing | Package status ≠ product launch |
| Active anti-value engineering | Active anti-dump engineering (REGISTRY, rings) |
| Infinite play inside membrane | Infinite packages inside `products/` + `experiments/` |
| Cold drop to be torn apart | Drop is a **manifested slice**, not the whole Lab |

---

## 8. Migration from existing material

| Source (today) | Target package |
|----------------|----------------|
| Noted router merge tree | `products/noted-host/` |
| `public/nexus/**`, agent HTML | `products/nexus-blocks/` |
| battle-engine, creature renderers | `products/creature-engine/` |
| Thesis + Checkpoint papers | Stay in `experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/` (linked, not forked) |
| `NEXUS_ORGANIZED` | **Mine only** — extract into packages; do not import wholesale |
| Nexus Agent v0.14 patched | Block asset under nexus-blocks after scrub |

---

## 9. Verify containment

```bash
# From Lab root after scaffold exists:
python3 experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py
# Must fail if:
# - path missing
# - unregistered dir under products/
# - nested_git pin mismatch
# - fat_drop_include package missing DROP_MANIFEST fields
```

Codex implements `verify_registry.py` as part of Phase 0.
