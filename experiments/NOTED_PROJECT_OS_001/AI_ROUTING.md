# AI routing — Codex implement · Claude debug · Grok drive

**Status:** `OPERATIONAL / STATUS_AUTHORITY: NONE`  
**Rule:** Same-provider agreement is **not** independent corroboration. Different seats are **roles**, not oracles.

---

## 1. Seat map

| Seat ID | Model class | Primary job | Forbidden |
|---------|-------------|-------------|-----------|
| `SEAT-CODEX-IMPLEMENT` | Codex CLI / implementer | Build packages, BB blocks, tests, registry tools | Rewrite doctrine; silent scope expand |
| `SEAT-CLAUDE-DEBUG` | Claude Code | Reproduce failures, bisect, fix bugs, harden bridges | Large greenfield without Codex baseline |
| `SEAT-GROK-DRIVE` | Grok (this family) | Operator co-pilot: plan turns, acceptance tests, tear-apart review, Lab receipts | Claim RUNTIME-ATTESTED without evidence |

Operator (human) is **Ring-0 authority** for approvals, publish, and fat-drop go/no-go.

---

## 2. Turn protocol (every session)

Each seat starts a turn with:

```text
CONTEXT: <package ids from REGISTRY + task id>
SCOPE:   <paths allowed to write>
VERIFY:  <commands that must pass>
BASELINE: <git SHA of Lab + nested pins>
```

Each seat ends a turn with:

```text
DONE:     <what changed>
EVIDENCE: SOURCE-VERIFIED | BUILD-VERIFIED | RUNTIME-ATTESTED | UNABLE_TO_VERIFY
RECEIPT:  operations/receipts/<TASK>/RECEIPT.json (or draft path)
NEXT:     <hand to which seat>
```

Silence is not a pass. `UNABLE_TO_VERIFY` is valid.

---

## 3. Handoff graph (default)

```text
                    ┌──────────────────┐
                    │  GROK-DRIVE      │
                    │  plan + accept  │
                    └────────┬─────────┘
                             │ task packet
                             ▼
                    ┌──────────────────┐
         ┌─────────│  CODEX-IMPLEMENT  │─────────┐
         │         │  build + unit     │         │
         │         └────────┬──────────┘         │
         │                  │ fails / flaky      │
         │                  ▼                    │
         │         ┌──────────────────┐          │
         │         │  CLAUDE-DEBUG    │          │
         │         │  repro + fix     │          │
         │         └────────┬─────────┘          │
         │                  │                    │
         └──────────────────┴────────────────────┘
                             │ green build
                             ▼
                    ┌──────────────────┐
                    │  GROK-DRIVE      │
                    │  adversarial QA  │
                    │  + Lab receipt   │
                    └──────────────────┘
```

### 3.1 When to skip edges

| Situation | Routing |
|-----------|---------|
| Pure docs / Checkpoint language | Grok only (or operator) |
| One-line obvious fix after Codex | Claude may fix without full replan |
| Security / secrets scare | Stop → operator; no seat “just patches keys into repo” |
| Nested git pin conflict | Codex registry fix → Grok verify containment |

---

## 4. Route packs (Lab operations/routes)

For each major phase, create a **route directory** that lists exact files:

```text
operations/routes/RT-NOTED-OS-PHASE-0/
  ROUTE.json          # baseline SHA, includes, excludes
  CONTEXT_MANIFEST.md # what seat must read
  OUTPUT_CONTRACT.md  # what seat must return
```

**Includes** only:

- `experiments/NOTED_PROJECT_OS_001/**`  
- listed `products/**` packages  
- relevant Checkpoint sister docs by path  

**Excludes** always:

- `NEXUS_ORGANIZED/05_unsorted/**`  
- secrets, `.env`, private keys  
- multi-GB recovery zips  

---

## 5. Independence discipline

| Pattern | Allowed as | Not allowed as |
|---------|------------|----------------|
| Codex build + Claude fix same bug | Engineering collaboration | “Two AIs proved security” |
| Grok acceptance after Codex | Operator-facing QA | Independent security audit |
| Second Grok session | Continuity | Different-family retest |

For claims that need different-family retest (Lab standard), commission an explicit seat outside this trio.

---

## 6. Prompt stubs (copy into seat tools)

### Codex

```text
You are SEAT-CODEX-IMPLEMENT for Lab programme NOTED_PROJECT_OS_001.
Read experiments/NOTED_PROJECT_OS_001/seats/CODEX_IMPLEMENTER.md and TECH_SPEC.md.
Implement only the active phase block. Do not expand scope.
Run VERIFY commands. Write a receipt draft under operations/receipts/.
status_authority: NONE. No real-world value surfaces.
```

### Claude Code

```text
You are SEAT-CLAUDE-DEBUG for Lab programme NOTED_PROJECT_OS_001.
Read experiments/NOTED_PROJECT_OS_001/seats/CLAUDE_DEBUGGER.md.
Reproduce the failing VERIFY command. Minimal fix. No greenfield features.
Document root cause. Hand back to GROK-DRIVE for acceptance.
```

### Grok drive

```text
You are SEAT-GROK-DRIVE for Lab programme NOTED_PROJECT_OS_001.
Read seats/GROK_DRIVER.md, LAUNCH_PLAN.md, CONTAINMENT.md.
Help the human sequence work, write tasks, run adversarial acceptance,
refuse false RUNTIME-ATTESTED claims, keep Checkpoint 001 firewall.
```
