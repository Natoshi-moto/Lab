# Technical specification — Noted Project OS

**Spec ID:** `NOTED-PROJECT-OS-001-TECH-SPEC-v0.1`  
**Status:** `BUILD_SPEC / NOT A PROTOCOL MONEY SPEC / STATUS_AUTHORITY: NONE`  
**Date:** 2026-07-21  
**Audience:** Codex (implement), Claude Code (debug), Grok (drive/test), human operator  
**Binds:** `BGEN-CANONICAL-CHECKPOINT-001`, Lab `AGENTS.md`, `PURPOSE_AND_NONCLAIMS.md`  
**Sister architecture (source lineage):** Noted Nexus Router BB-00–BB-14, host bridge, action broker, Nostr stubs  

---

## 0. One-sentence product

Build **Noted as the local-first host** in which the entire project is **worked ON** (knowledge + Lab links), **IN** (Agent, creature game, prompts), and **THROUGH** (receipted bridges + Nostr mesh) — with all software living as **registered packages inside Lab**, expanding without chaos, under Checkpoint 001’s synthetic-only firewall.

---

## 1. Goals and non-goals

### 1.1 Goals

| ID | Goal |
|----|------|
| G1 | Single host app (Noted) boots; all project work can stay inside it |
| G2 | Nexus Router embeds blocks (Agent, creature, Prompt Studio) via iframe + typed bridge |
| G3 | Effectful actions go through **propose → preview → approve → receipt** |
| G4 | Nostr is **one** bridge (identity/sign/read/write), never per-block SDKs |
| G5 | Creature/battle surfaces are **synthetic only** (authority, contribution, reputation, social tip) |
| G6 | Lab containment: `products/REGISTRY.json` + verify tool; no orphan packages |
| G7 | Fat drop: curated `drops/COLD_DROP_001/` people can work from immediately |
| G8 | Multi-seat AI routing with typed handoffs and VERIFY contracts |
| G9 | Free-contribution thesis: software usable without purchase or token |

### 1.2 Non-goals (explicit)

| ID | Non-goal |
|----|----------|
| N1 | Live charity rails, money transmission, or custodial BTC flows |
| N2 | Tradable token, redeem path, DEX listing, or “investment” surface |
| N3 | Importing whole `NEXUS_ORGANIZED` unsorted bulk |
| N4 | Claiming multi-AI agreement as independent security audit |
| N5 | Full native rewrite of Nexus Agent into React in v0.1 (iframe is correct first ship) |
| N6 | Production SaaS hosting / accounts / telemetry |

---

## 2. System context

```text
 Human operator
      │
      ▼
 ┌──────────────────────────────────────────┐
 │ Lab (git) — epistemic authority          │
 │  experiments/ · products/ · drops/       │
 │  operations/receipts · routes · seats    │
 └───────────────────┬──────────────────────┘
                     │ develops / pins
                     ▼
 ┌──────────────────────────────────────────┐
 │ products/noted-host  (Vite+React+IDB)    │
 │  ON: Projects Notes Canvas Prompts …     │
 │  Panel: relational spine                 │
 │  /nexus-router → iframe kernel           │
 │  bridges: host · broker · nostr · import │
 └───────────────────┬──────────────────────┘
                     │ postMessage + receipts
                     ▼
 ┌──────────────────────────────────────────┐
 │ products/nexus-blocks                    │
 │  agent HTML · prompt studio · OS shell   │
 └───────────────────┬──────────────────────┘
                     │
                     ▼
 ┌──────────────────────────────────────────┐
 │ products/creature-engine                 │
 │  battle-engine · breed · renderer        │
 │  synthetic stakes only                   │
 └──────────────────────────────────────────┘
```

### 2.1 Work modes (product language)

| Mode | Meaning | Surfaces |
|------|---------|----------|
| **ON** | Author and organize project knowledge | Projects, Notes, Writing, Longform, Canvas, App Design, links/tags |
| **IN** | Operate tools and game inside host | Nexus Router blocks: Agent, creature, Prompt Studio v3 |
| **THROUGH** | Externalize synthetic social / evidence | Nostr bridge (gated); diagnostic export; Lab receipts |

---

## 3. Package breakdown (implementable units)

### 3.1 `products/noted-host`

**Source seed:**  
`/home/anon/New Base/noted_nexus_router_bb02_host_adapter_v0.06 (Copy)/noted-v0.01-nexus-router-merge`  
(or newer owner-chosen Noted tip with same bridge lineage)

**Must preserve:**

- Local-first: IndexedDB `verse-studio` / Noted identity; no required cloud  
- Frozen-four discipline for schema: `src/db.ts`, `src/types.ts`, `src/context.tsx`, `src/seed.ts`  
- `npm run build` → `vite build && node pack.js` single-file offline contract  
- Nexus Panel + Focus + existing studios  

**Must implement / complete (phases map §6):**

| Module | Path (indicative) | Behavior |
|--------|-------------------|----------|
| Host bridge | `src/bridges/nexusHostBridge.ts` | Accept typed envelopes from Nexus iframe only; return receipts |
| Action broker | `src/bridges/nexusActionBroker.ts` | Preview/approve/execute stub→real per phase |
| Prompt import | `src/bridges/nexusPromptImportStub.ts` → real | Snapshot → Noted `prompts` store |
| Nostr bridge | `src/bridges/nexusNostrBridgeStub.ts` → real | Plan → sign gate → publish receipt |
| Router studio | `src/studios/nexusRouter/` | Default landing optional; loads OS |
| Agent studio | `src/studios/nexusAgent/` | iframe to scrubbed Agent block |
| Seed project pack | `src/seed.ts` or import pack | Checkpoint 001 project graph (see §7) |

### 3.2 `products/nexus-blocks`

**Contains:**

| Block ID | Asset | Notes |
|----------|-------|-------|
| `nexus-os` | `Nexus_OS.html` + block registry | Kernel desktop |
| `nexus-agent` | Scrubbed Agent HTML (prefer v0.14 patched lineage) | Strip embedded personal export; offline assets preferred |
| `prompt-studio-v3` | Existing HTML/block | Managed shim events |
| stubs | host-adapter, agent-action, nostr-link-cable | Promote per BB order |

**Agent scrub checklist (mandatory before drop):**

1. Empty or factory `embedded-data` / quine personal sessions  
2. No hardcoded API keys  
3. Document CDN vs offline  
4. Title/docs: tool, not wallet product; no real-world value endorsement  

### 3.3 `products/creature-engine`

**Source seed (extract, do not wholesale dump):**

- `battle-engine.js` (eidolon-core-1 lineage)  
- `breed-engine.js`, `creature-renderer.ts` / eidolon renderers  
- tests: `battle-engine-tests.js`, `battle-protocol-tests.js`, etc.  
- one playable HTML harness renamed **creature** (not Pokémon)

**Rules:**

- Public strings: **creature**, not Pokémon  
- Ranked/stakes: **synthetic locks only**; no redeem; no real wallet cash-out  
- If `walletLock` remains in API, document as **synthetic rank lock interface**, not custody of funds  
- Package exports pure functions + harness; loaded as Nexus block

### 3.4 `experiments/NOTED_PROJECT_OS_001` (this package)

Specs, seats, tools, launch plan — stays research/programme, not the runtime binary.

### 3.5 `drops/COLD_DROP_001`

**Generated/staged fat drop** — see `LAUNCH_PLAN.md`. Not a fourth product engine; an assembly of the above + curated docs.

---

## 4. Bridge contracts (load-bearing)

### 4.1 Host bridge message type

```ts
// Conceptual — align with existing nexusBridgeTypes.ts
type NexusHostBridgeMessage = {
  type: 'NEXUS_HOST_BRIDGE'
  envelope: NexusEventEnvelope
}

type NexusEventEnvelope = {
  id: string
  createdAt: string // ISO
  source: { kind: 'nexus-router' | 'block' | 'agent'; id: string }
  target: { kind: 'noted-host'; id: 'noted-host' }
  kind: string
  intent: string
  capability: string
  channel: string
  tags: string[]
  refs: string[]
  payload: unknown
  policy: {
    requiresApproval: boolean
    reversible: boolean
    risk: 'low' | 'medium' | 'high' | 'critical'
    capability: string
  }
}

type NexusHostBridgeReceipt = {
  type: 'NEXUS_HOST_BRIDGE_RECEIPT'
  envelopeId: string
  ok: boolean
  summary: string
  error?: string
  receiptId: string
  at: string
}
```

**Hard rules:**

1. Only accept messages from the known Nexus iframe `contentWindow`.  
2. Unknown channel → reject receipt.  
3. Effectful capability without approval when required → reject.  
4. Every accept/reject produces a receipt (in-memory + optional IDB log store later).  

### 4.2 Action broker states

```text
proposed → previewed → approved → executing → succeeded
                 ↘ rejected | failed | expired
```

Safe v0.1 actions (implement first):

- create note/scrap from agent text  
- create prompt draft from snapshot  
- tag/link records  
- draft Nostr event (no publish)  
- propose UI patch (preview only)

Forbidden without later explicit phase:

- Nostr publish  
- network side effects beyond user-configured model providers inside Agent block  
- writing outside approved stores  
- git commit from agent  

### 4.3 Nostr bridge

Align with existing `NOSTR_ROUTING_SPEC.md` in Noted specs.

| Phase | Behavior |
|-------|----------|
| Plan only | Translation plan stub (exists) |
| Identity | Local nsec or remote signer config; never commit secrets |
| Read | Selected app-data kinds into router inbox |
| Write | Human-only default for publish |

**Kinds:** use registry file; app-data (e.g. 30078 class) for synthetic standing — **not** payment kinds.

**Checkpoint bind:** any UI copy near Nostr states: synthetic culture mesh; not money.

---

## 5. Capability registry (must ship as data)

```text
products/nexus-blocks/registry/capabilities.v0.1.json
```

Each capability:

```json
{
  "id": "noted.prompt.import",
  "risk": "low",
  "defaultApproval": "ask-once",
  "effectful": true,
  "ring": 1,
  "implementedIn": "PHASE-2"
}
```

Minimum set:

| Capability | Approval default |
|------------|------------------|
| `diagnostic.ping` | none |
| `noted.prompt.import` | ask-once |
| `noted.record.create` | ask-once |
| `agent.action.proposed` | always |
| `ui.patch.preview` | ask-once |
| `nostr.event.draft` | ask-once |
| `nostr.sign` | human-only |
| `nostr.publish` | human-only |
| `creature.battle.run` | none (local synthetic) |
| `creature.tip.synthetic` | ask-once |

---

## 6. Phased delivery (Codex active blocks)

### Phase 0 — Scaffold containment (week 0)

**Codex delivers:**

1. Create `products/`, `drops/` trees  
2. `products/REGISTRY.json` + schema  
3. `tools/verify_registry.py` (or `node` script)  
4. Import Noted tree into `products/noted-host` (clean `.git` decision per CONTAINMENT)  
5. Skeleton `nexus-blocks` + `creature-engine` with README stubs  
6. Lab receipt `operations/receipts/NOTED_PROJECT_OS_PHASE_0/`  

**VERIFY:**

```bash
cd products/noted-host && npm ci && npm run typecheck && npm run build
python3 experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py
./nexus doctor   # if applicable; do not break Lab
```

### Phase 1 — Host + bridge smoke (BB-01/02 solidify)

**Codex delivers:**

1. `/nexus-router` loads OS from package path  
2. Host bridge accepts diagnostic.ping + returns receipt  
3. Reject foreign windows  
4. Document manual console smoke (from BASE_STUB map)  

**Claude debug:** any iframe origin / path / pack.js failures  

**Grok drive:** acceptance checklist run; write RUNTIME notes honestly  

**VERIFY:** typecheck, build, documented bridge smoke (screenshot or log in receipt)

### Phase 2 — Prompt import + Agent block (BB-03/04 + agent scrub)

**Codex delivers:**

1. Scrubbed Agent HTML as block (v0.14 lineage preferred)  
2. Prompt snapshot → Noted prompt record path  
3. Agent studio route works  

**VERIFY:** import creates IDB prompt; no secrets in repo; build offline-or-document CDN

### Phase 3 — Action broker dry-run UX (BB-05–07)

**Codex delivers:**

1. Queue UI for proposed actions  
2. Preview / approve / reject  
3. Receipt list in host  

**VERIFY:** unit tests for state machine; no silent writes

### Phase 4 — Creature engine block

**Codex delivers:**

1. Extracted engine package  
2. Creature harness block in OS  
3. Rename public Pokémon → creature  
4. Synthetic-only stakes documentation  

**VERIFY:** engine tests pass under node; harness opens from router

### Phase 5 — Nostr read path (BB-08/09) optional for first drop

**Minimum for drop:** stubs + UI copy + config schema  
**Full publish:** only if operator prioritizes; human-only sign

### Phase 6 — Fat drop assembly

See `LAUNCH_PLAN.md`. Codex builds drop assembler script; Grok validates manifest; human go/no-go.

---

## 7. Seed graph — project pack inside Noted (fat drop content)

On first run (or “Import Project Pack”):

**Project:** `Lab — Noted Project OS`  

**Linked notes (content copied or linked by path hash):**

| Note | Source |
|------|--------|
| Canonical Checkpoint 001 | `experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/CANONICAL_CHECKPOINT_001.md` |
| Side Path Paper | `.../THE_SIDE_PATH_PAPER.md` |
| To Satoshi letter | `.../TO_SATOSHI_AND_THE_MAKERS_OF_BITCOIN.md` |
| This TECH_SPEC summary | short in-app version |
| How to work ON/IN/THROUGH | operator one-pager |

**Canvas:** operating map nodes — Host / Router / Agent / Creature / Lab / Nostr  

**Prompts:** seat prompts from `AI_ROUTING.md`  

**Tags:** `checkpoint-001`, `synthetic-only`, `no-real-world-value`, `cold-drop`

Import must record `source_path` + `content_hash` on each note for epistemic binding.

---

## 8. Testing strategy

### 8.1 Automated

| Layer | Owner seat | Commands |
|-------|------------|----------|
| Host typecheck/build | Codex | `npm run typecheck && npm run build` |
| Creature engine unit | Codex | `node` test runners extracted |
| Registry verify | Codex | `verify_registry.py` |
| Lab doctor | any | `./nexus doctor` (must stay green) |
| Bridge unit tests | Codex + Claude | mock iframe postMessage |

### 8.2 Manual acceptance (Grok + human)

| ID | Test | Pass criteria |
|----|------|---------------|
| A1 | Boot Noted host | UI loads, no console hard errors |
| A2 | Open Nexus Router | OS iframe visible |
| A3 | Bridge ping | ok receipt |
| A4 | Open Agent block | chat UI; no leaked personal export |
| A5 | Creature harness | battle runs locally |
| A6 | Prompt import | record appears in Prompt Studio/Notes |
| A7 | Action propose | appears in queue; reject works |
| A8 | Non-claims visible | Checkpoint banner or seed note present |
| A9 | Drop unpack | stranger can follow DROP_README in <15 min |
| A10 | Anti-value | no UI path to “sell/redeem/list token” |

### 8.3 Adversarial (Grok drive)

- Attempt postMessage from parent page (must ignore)  
- Attempt Nostr publish without approval (must fail)  
- Search drop for `sk-`, mnemonic dumps, private keys  
- Search for Pokémon branding in user-visible strings  
- Attempt to interpret tip as money in docs — docs must refuse  

---

## 9. Security and privacy

1. No secrets in git. `.env.example` only.  
2. Agent keys stay in block localStorage/IDB of user machine.  
3. Diagnostic export may contain private titles — label as user data.  
4. `file://` limitations documented; prefer `npm run dev` or desktop installer.  
5. CORS proxies in Agent (e.g. corsproxy.io) must be documented as risk; prefer local models for drop narrative.  
6. Nested git pins prevent supply-chain “silent tip moves.”  

---

## 10. Acceptance for “v0.1 Project OS”

Ship is acceptable when:

1. Phase 0–2 complete (containment + bridge smoke + agent + prompt import)  
2. Phase 4 creature block present **or** explicitly deferred in DROP_MANIFEST with reason  
3. Cold drop builds and A9 passes  
4. Checkpoint 001 non-claims present in drop root  
5. `verify_registry.py` green  
6. Receipts filed for each phase  
7. Operator signs human go/no-go (not an AI)

Phase 3 broker UX and Phase 5 Nostr publish may ship as `RUNTIME-PENDING` with stubs if labeled honestly.

---

## 11. File deliverables checklist (Codex)

- [ ] `products/REGISTRY.json`  
- [ ] `products/noted-host/**` (imported + patches)  
- [ ] `products/nexus-blocks/**`  
- [ ] `products/creature-engine/**`  
- [ ] `experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py`  
- [ ] `experiments/NOTED_PROJECT_OS_001/tools/assemble_cold_drop.py`  
- [ ] `drops/COLD_DROP_001/` + `DROP_MANIFEST.json`  
- [ ] `operations/receipts/NOTED_PROJECT_OS_PHASE_*`  
- [ ] Tests for bridge + broker state machine  
- [ ] `products/*/README.md` + non-claims  

---

## 12. References (gather list for seats)

| Path | Why |
|------|-----|
| This package | Spec + seats |
| `experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/*` | Doctrine |
| Noted tree: bridges, BUILD_BLOCKS, CONTEXT, specs/* | Implementation lineage |
| `/home/anon/Downloads/Nexus_Agent_v0_14_patched.html` | Agent tip candidate |
| Creature files under NEXUS_ORGANIZED `01_code` / pokemon-engine project | Engine extract |
| Lab `AGENTS.md`, `README_START_HERE.md` | Lab seat law |

---

*End of TECH_SPEC v0.1. Promote only via Lab PR + receipt. status_authority: NONE.*
