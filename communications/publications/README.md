# Publications — cumulative seat reports

**status_authority:** `NONE`  
**Purpose:** A durable, public, append-only **story of what seats did and why**, collected over time as the Lab evolves.

This is **not** the control plane (`STATUS.json` / `NEXT_ACTION.md`).  
This is **not** experiment evidence (`operations/receipts/`, experiment fixtures).  
This is **not** marketing that soft-closes reds.

## Mandatory skill

Every AI that enters the repository must read and, at the end of each real work round, execute:

```text
Agent Resources/Tools/Skills/essential/round-close-publication.md
```

Routed from:

```text
Agent Resources/Tools/Skills/essential/INDEX.md
AGENTS.md
```

## Layout

```text
communications/publications/
  README.md                 — this file
  INDEX.md                  — newest-first ledger of all reports
  templates/ROUND_REPORT.md — copy shape for each filing
  rounds/<TRACK>/…          — one file per seat report
```

`<TRACK>` is usually `STATUS.json` `current_round` (e.g. `R016`) or a clear programme slug (`NOTED`, `BGEN`, `AUDIT`, `ORCH-001`).

## Authority order

Same as parent `communications/`: constitution and STATUS outrank anything here. A polished report cannot clear a red.

## Non-claims

Filing publications does not create independence, product readiness, tokens, or liability.
