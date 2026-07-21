# Load-bearing design — Operator Diagnostic Suite (ODS)

**Spec ID:** `NOTED-PROJECT-OS-001-DIAGNOSTIC-SUITE-v0.1`  
**Status:** `BUILD_SPEC / LOAD-BEARING FOR DEVELOPMENT / STATUS_AUTHORITY: NONE`  
**Date:** 2026-07-21  
**Programme:** `NOTED_PROJECT_OS_001`  
**Binds:** `CANONICAL_DIRECTION.md`, `TECH_SPEC.md`, `BGEN-CANONICAL-CHECKPOINT-001`  

---

## 0. Why this document exists

The programme’s critical path is a **local-first host + bridges + future sim-frame**.  
Most failures that matter are **runtime, interactive, and multi-surface** (iframe, postMessage, IDB, approval UI, packed single-file HTML).  

**Load-bearing development tool** for this stage is therefore not only `npm test` in CI — it is an **Operator Diagnostic Suite (ODS)** that you can:

1. open in the browser,  
2. press buttons / toggle knobs / paste payloads,  
3. force good and bad paths,  
4. **print one machine-readable + human-readable dump** that Codex / Claude / Grok can use to diagnose without re-deriving your machine state from chat.

This is the same *epistemic idea* as sim receipts: **shared, checkable evidence** — applied to **host development**, not only economy simulation.

---

## 1. Does a manual press-and-change suite help development?

### 1.1 Yes — materially — for these classes

| Class | Why manual / interactive helps |
|-------|--------------------------------|
| **Iframe + postMessage bridges** | Timing, `contentWindow` identity, origin, packed vs dev paths — unit mocks miss real browser behavior |
| **Approval / broker UX** | “What does the human see and click?” is the product; pure functions can’t show queue/reject friction |
| **IDB / localStorage persistence** | Schema migrations, first-run seed, corrupt state recovery |
| **Single-file pack vs `npm run dev`** | pack.js / asset path bugs only show in production-shaped artifacts |
| **Agent / block iframe surfaces** | CDN load, file:// quirks, embedded-data leaks |
| **Operator → AI handoff** | A **diagnostic dump** is higher signal than “it broke” in chat |
| **Adversarial UI paths** | Foreign postMessage, double-click race, spam ping, deny paths |
| **Future sim-frame** | Same pattern: run → verify → export pack (Studio lineage) |

### 1.2 No — not a substitute — for these classes

| Class | Prefer automated |
|-------|------------------|
| Pure ledger / hash / canonjson math | Unit tests, golden files |
| Registry containment | `verify_registry.py` |
| Type errors | `tsc` |
| Supply identity over 350k checkpoints | Headless sim runners |
| Secret scanning | Scripted `rg` / scanners |

### 1.3 Rule (canonical)

```text
Automated tests prove pure logic and package integrity.
ODS proves the living system and produces diagnosis packs for humans and AIs.
Neither replaces the other.
ODS is load-bearing for THIS stage because the stage is system fitness, not sim embed.
```

**Manual does not mean unsystematic.** Every button maps to a **case ID**, expected outcome, and export field. You are the adversarial operator; the suite is the instrument panel.

---

## 2. Product placement

### 2.1 Where it lives

| Path | Role |
|------|------|
| `products/noted-host/src/studios/diagnostics/` (or `src/dev/OperatorDiagnosticSuite.tsx`) | Interactive UI (dev + optional gated prod build) |
| `products/noted-host/scripts/` or package root `ods-*.mjs` | Headless Playwright runners that **drive the same case IDs** |
| `products/noted-host/public/ods/` | Static fixtures / sample envelopes |
| Export download | `ods-pack-YYYYMMDD-HHMMSS.json` (+ optional `.md` summary) |

**Route:** `#/diagnostics` or `#/ods`  
**Sidebar:** “Diagnostics” — visible when `import.meta.env.DEV` **or** Settings → “Enable operator diagnostics” (default off in cold drop unless `fat_drop_include` flag).

### 2.2 REGISTRY / package note

ODS is part of **`noted-host`** (not a fourth product) until it grows a pure runner core — then extract `products/ods-runner/` only if needed. Avoid package sprawl.

### 2.3 Cold drop

| Audience | Include? |
|----------|----------|
| Internal / research drop | **Yes** — primary “how we develop and diagnose” |
| Public stranger drop | **Optional** — if included, label research tool; no secrets; non-claims banner |

---

## 3. Architecture

```text
┌────────────────────────────────────────────────────────────┐
│  Operator Diagnostic Suite (UI)                            │
│  - Case catalog (press / toggle / paste)                   │
│  - Live event log                                          │
│  - Environment probe                                       │
│  - Export diagnosis pack                                   │
└───────────────┬────────────────────────────────────────────┘
                │ uses same APIs as product
                ▼
┌──────────────────┐    postMessage     ┌──────────────────┐
│ Host bridges     │◄──────────────────►│ Nexus iframe /   │
│ broker · host    │                    │ blocks (when     │
│ prompt import    │                    │ present)         │
└──────────────────┘                    └──────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────────┐
│  Diagnosis pack (JSON + MD)                                 │
│  env · cases · timeline · receipts · console · IDB summary │
│  → paste to Claude/Codex/Grok or attach to Lab receipt     │
└────────────────────────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────────┐
│  Headless ODS runner (Playwright)                           │
│  Same case IDs; CI + seat VERIFY                            │
└────────────────────────────────────────────────────────────┘
```

**Load-bearing contract:** UI cases and headless cases share **one case catalog** (`ods.cases.json` or TS module). No “button that only exists in the UI with no automated twin” for P0 cases — except cases marked `human_only: true` (explicit).

---

## 4. Case catalog (v0.1 — implement in order)

### 4.1 Case record schema

```ts
type OdsCase = {
  id: string                    // e.g. "ODS-BR-001"
  title: string
  surface: 'host' | 'bridge' | 'broker' | 'agent' | 'creature' | 'sim' | 'drop' | 'security'
  phase_min: number             // earliest programme phase that owns this case
  human_only: boolean
  steps: string[]               // what the operator presses / changes
  expected: string[]            // observable pass criteria
  collect: string[]             // fields that must land in the diagnosis pack
  risk: 'low' | 'medium' | 'high'
}
```

### 4.2 P0 cases (Phase 1 — bridge / host) — **must ship with Phase 1 or immediately after**

| ID | Operator action | Expected | Collect |
|----|-----------------|----------|---------|
| **ODS-ENV-001** | Open suite | Shows build commit, mode (dev/prod), route, userAgent | `env.*` |
| **ODS-HOST-001** | “Probe mount” | Router studio + iframe selectors present | DOM probes |
| **ODS-BR-001** | “Send diagnostic.ping (as iframe)” | `ok: true` receipt; status counter ++ | last receipt, bridge status text |
| **ODS-BR-002** | “Send ping from parent (foreign)” | rejected; `ok: false` or ignore + logged | reject reason |
| **ODS-BR-003** | “Send malformed envelope” | reject; no crash | error summary |
| **ODS-BR-004** | “Send unknown channel” | reject | channel, receipt |
| **ODS-BR-005** | Spam 20 pings | host stays responsive; log truncated safely | timing, error count |
| **ODS-PATH-001** | Show iframe `src` | `./nexus/os/Nexus_OS.html` (or documented prod path) | src string |
| **ODS-PACK-001** | Note build kind | dev server vs single-file pack | `env.buildKind` |

### 4.3 P1 cases (Phase 2–3)

| ID | Action | Expected |
|----|--------|----------|
| **ODS-AG-001** | Open Agent block | loads; dump whether embedded personal export empty |
| **ODS-AG-002** | “Scan agent HTML for scrub markers” | no personal session names if scrubbed |
| **ODS-PR-001** | Import fixture prompt snapshot | Noted prompt record appears; show id |
| **ODS-BK-001** | Propose safe action | appears in queue |
| **ODS-BK-002** | Reject action | receipt rejected; no write |
| **ODS-BK-003** | Approve low-risk create-note | note exists; receipt succeeded |

### 4.4 P2 cases (Phase 4 + sim-frame stage)

| ID | Action | Expected |
|----|--------|----------|
| **ODS-CR-001** | Run local creature battle seed S | deterministic outcome hash |
| **ODS-SIM-001** | (when sim-frame exists) Run fixture scenario | run_id + verify pass |
| **ODS-SIM-002** | Tamper receipt one byte | verify fail |
| **ODS-FW-001** | Scan UI strings for invest/redeem/airdrop CTAs | zero primary CTAs |

### 4.5 Human-only cases (no full automation required)

| ID | Why human |
|----|-----------|
| **ODS-H-001** | Subjective: “Is non-claims banner understandable?” |
| **ODS-H-002** | Accessibility / focus trap in modal |
| **ODS-H-003** | “Would I trust this cold drop README in 15 min?” |

---

## 5. Diagnosis pack (the thing you print for AIs)

### 5.1 File: `ods-pack-<timestamp>.json`

```json
{
  "schema": "noted.ods-pack/v1",
  "status_authority": "NONE",
  "created_at": "ISO-8601",
  "programme": "NOTED_PROJECT_OS_001",
  "checkpoint_bind": "BGEN-CANONICAL-CHECKPOINT-001",
  "env": {
    "lab_git_head": "optional if injected at build",
    "noted_build_commit": "from vite define",
    "build_kind": "dev|preview|pack",
    "href": "...",
    "userAgent": "...",
    "viewport": { "w": 0, "h": 0 },
    "odssuite_version": "0.1.0"
  },
  "cases_run": [
    {
      "id": "ODS-BR-001",
      "result": "PASS|FAIL|SKIP|ERROR",
      "started_at": "...",
      "finished_at": "...",
      "expected": ["..."],
      "observed": ["..."],
      "artifacts": {}
    }
  ],
  "timeline": [
    { "t": "...", "source": "bridge|ui|console|iframe", "level": "info|warn|error", "msg": "...", "data": {} }
  ],
  "bridge": {
    "status_text": "...",
    "ok_count": 0,
    "fail_count": 0,
    "last_receipts": []
  },
  "console": {
    "errors": [],
    "warnings": []
  },
  "storage": {
    "idb_db_name": "verse-studio",
    "idb_version": null,
    "store_counts": {},
    "localStorage_keys_sample": []
  },
  "security_notes": [
    "No secrets intentionally included",
    "Operator should redact API keys if Agent settings were open"
  ],
  "operator_notes": "",
  "non_claims": [
    "This pack is diagnostic evidence, not a security audit",
    "Passing ODS does not mean production readiness or sim-frame complete"
  ]
}
```

### 5.2 Companion: `ods-pack-<timestamp>.md`

Auto-generated short form for chat paste:

```markdown
# ODS pack summary
- env: ...
- PASS: n  FAIL: n  SKIP: n
## Failures
- ODS-BR-002: ...
## Last bridge receipt
...
## Console errors
...
## Operator notes
...
```

### 5.3 Redaction rules (mandatory)

Before download:

- Strip values matching `sk-`, `xai-`, `Bearer `, long hex that looks like nsec if pattern-matched  
- Checkbox: “I may have typed secrets — scrub known key fields”  
- Never include full Agent conversation history by default (opt-in, size-capped)

---

## 6. UI specification (what you press)

### 6.1 Layout

```text
┌──────────────┬─────────────────────────────────────────┐
│ Case list    │ Active case                             │
│ by surface   │ Title · steps · expected                │
│              │ [Run case] [Mark pass] [Mark fail]      │
│              │ Knobs: seed, channel, payload JSON      │
├──────────────┼─────────────────────────────────────────┤
│              │ Live timeline (filterable)              │
├──────────────┴─────────────────────────────────────────┤
│ Env strip: build · route · bridge status               │
│ [Run P0 suite] [Export JSON] [Export MD] [Copy MD]     │
│ [Clear log] [Reset counters]                           │
└────────────────────────────────────────────────────────┘
```

### 6.2 Knobs that materially help diagnosis

| Knob | Why |
|------|-----|
| Payload JSON editor | Replay exact failing envelope for Claude |
| “Impersonate iframe” vs “from parent” | Proves source guard |
| Delay ms before send | Race conditions |
| Repeat count | Stress |
| Target route | host vs router vs agent |
| Seed (creature/sim later) | Determinism checks |
| Build note (dev/pack) | Operator labels which artifact |

### 6.3 Non-claims banner (always visible on ODS)

```text
Operator Diagnostic Suite — research tool.
Does not authorize live funds or real-world value.
Passing cases ≠ production readiness.
status_authority: NONE
```

---

## 7. Headless twin (seats / CI)

```bash
# products/noted-host
npm run ods:p0          # Playwright: ODS-ENV-001 … ODS-PACK-001
npm run ods:export-check  # ensures last pack schema validates
```

**VERIFY contract for Phase 1+ (updated):**

```bash
python3 experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py
cd products/noted-host && npm ci && npm run typecheck && npm run build
cd products/noted-host && npm run ods:p0
```

Operator path when AI is stuck:

```text
1. Open #/diagnostics
2. Run P0 suite (or single failing case)
3. Export pack JSON + MD
4. Paste MD into Claude/Codex/Grok with "diagnose this pack"
```

---

## 8. How ODS serves the canonical direction

| Direction | ODS role |
|-----------|----------|
| System **for** simulator economy | ODS proves host/bridge/broker **fitness** before sim-frame |
| Shared results culture | Diagnosis packs practice **exportable evidence** |
| Not “embed nexsim as phase end” | ODS cases for sim are **P2 / next stage**, not Phase 1 exit |
| Multi-seat | Pack is the common language between you and AIs |
| Cold drop | Strangers (or future you) can re-run the same case IDs |

When sim-frame arrives, **extend the same suite** with ODS-SIM-* cases rather than inventing a second diagnostics culture.

---

## 9. Implementation phases (Codex)

### ODS-0 — Skeleton (immediately after / with Phase 1)

- Route `#/diagnostics`  
- Case catalog module with P0 IDs  
- Timeline + env probe  
- Export JSON/MD (even if only ENV + HOST cases work)  
- Wire BR-001/002 using real host bridge APIs  

### ODS-1 — P0 complete + headless twin

- All P0 cases  
- `npm run ods:p0` green  
- Document in Phase 1 or Phase 1.1 receipt  

### ODS-2 — P1 cases (Agent, prompt, broker)

- As those product phases land  

### ODS-3 — Creature + sim-frame cases

- Next stage; bind to verified run objects  

---

## 10. Acceptance criteria for “ODS is load-bearing”

ODS is accepted when:

1. Operator can run **P0 suite in one click** and get PASS/FAIL per case.  
2. **Export pack** opens in a text editor and validates against schema.  
3. At least one real bug was diagnosed via pack (process proof) **or** seat VERIFY requires `ods:p0`.  
4. Headless twin covers all non-`human_only` P0 cases.  
5. Redaction rules exist and are tested with a fixture containing a fake `sk-` string.  
6. Non-claims banner present.  
7. Docs tell seats: “prefer ODS pack over freeform ‘it broke’.”

---

## 11. Anti-patterns

| Don’t | Why |
|-------|-----|
| Only Playwright, no human UI | You lose knobs, payload edit, subjective trust |
| Only human UI, no case IDs | AIs can’t map failures; no CI twin |
| Dump entire IDB by default | Secrets / private notes leak |
| Call ODS “security audit” | Overclaim |
| Block Phase 1 forever on perfect ODS | Ship ODS-0 with bridge; harden ASAP |
| Separate “Claude diagnostics” format | One pack schema for all seats |

---

## 12. Seat instructions (add to packets)

### Operator (you)

```text
When something breaks:
1. #/diagnostics → Run P0 or the relevant case
2. Export MD + JSON
3. Paste MD to the debugging seat with the case id
```

### Codex

```text
Implement ODS per DIAGNOSTIC_SUITE.md.
P0 cases share IDs with npm run ods:p0.
Do not skip export pack schema.
```

### Claude

```text
Prefer an attached ods-pack JSON over guessing.
Reproduce by case id; minimal fix; re-run that case + P0 suite.
```

### Grok drive

```text
Acceptance includes ods:p0 or documented human P0 export.
Refuse RUNTIME-ATTESTED without pack or smoke evidence.
```

---

## 13. Relationship to TECH_SPEC §8

This document **supersedes** ad-hoc “manual A1–A10 only” as the primary human path.  
A1–A10 remain **acceptance themes**; each maps into ODS case IDs over time (e.g. A3 → ODS-BR-001).

`TECH_SPEC.md` §8 should reference this file as load-bearing.

---

## 14. Non-claims

- ODS is not a substitute for Lab `./nexus verify` or PCX replay demos.  
- ODS does not implement the simulator economy.  
- Passing ODS does not authorize production or real-world value.  
- `status_authority: NONE`.

---

*End of DIAGNOSTIC_SUITE v0.1. Implement ODS-0 as soon as bridge smoke exists.*
