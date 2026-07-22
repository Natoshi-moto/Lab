# ORCH-001 T5 break-prep receipt

- Task: `ORCH-001-T5-BREAK-PREP-RUNBOOK`
- Seat: Claude Code (docs / break-prep design)
- Baseline branch: `main`
- Baseline commit: `03c18ac60dac8a360d312b8a7f6583d75d8fde76` (after PR #66 / T4 merged)
- Proposal branch: `claude/orch-001-t5-break-runbook`
- Status authority: `NONE`

## Baseline gate check (per packet)

The task packet's "CAMPAIGN POSITION" section claimed T4 (T-06 quarantine) was already `MERGED`.
Verification at task start found this false relative to `main`:

- PR #66 was `DRAFT`, not merged.
- `operations/receipts/ORCH_001_T4_T06_QUARANTINE/RECEIPT.md` did not exist on `main`.
- `products/noted-host/public/nexus/nexus-agent-v0.12.html` and the `os/blocks/apps/` copy were
  still present in `main`'s public tree.

This was surfaced to the operator before any T5 writes began. The operator confirmed PR #66 had
since merged; re-verification after `git pull origin main` confirmed: PR #66 `MERGED` at
`2026-07-22T02:21:50Z`, the T4 receipt now exists on `main`, `npm run t06:quarantine-check` passes,
and no `nexus-agent-v0.12.html` remains under `products/noted-host/public/`. T5 work proceeded only
after this gate passed.

## What this receipt covers

Writing `operations/break-prep/ORCH_001_BREAK_RUNBOOK.md`: an operator-usable checklist of 11
attack cards (T-06 residual recheck, T-02 CDN, T-03 default proxy, T-01 same-origin storage reach,
five bridge-gap cards drawn from an external mining pass — signal only, re-derived against current
code rather than restated as fact — T-04 diagnostic export, and an open-question card on where a
provider key lands in storage), each requiring an evidence label, plus safety rules, a prep
checklist, a first-session priority order, a FAIL-filing template, and explicit non-claims.

## Files actually inspected

- `WHY_NOT_TO_TRUST_THIS_PROJECT.md`
- `AGENTS.md`
- `STATUS.json`, `NEXT_ACTION.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/CHARTER.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md` (T-01 through T-14)
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/ODS_SECURITY_CASES.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/COLD_DROP_BAR.md`
- `operations/proposals/NOTED_STOP_THE_LINE_001/HARD_GATES.md`
- `products/noted-host/README.md`, `NOOB_GUIDE.MD`, `package.json`
- `products/noted-host/src/bridges/nexusHostBridge.ts` (full file, including footer notes)
- `products/noted-host/src/bridges/nexusBridgeTypes.ts` (full file)
- `products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx` (full file)
- `products/noted-host/src/diagnosticExporter.ts` (targeted: `verse-studio:` scoping, lines ~108–163)
- `products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html` (targeted greps: CDN tags,
  `BROWSER_DIRECT`/`DEFAULT_PROXY`/`PROXY_REQUIRED`, `DB_NAME`/`LS_PREFIX`, `crypto:salt`/
  `crypto:escrow`, `STRIP_FROM_EXPORT` — not read end-to-end; this file is ~14,000+ lines)
- `products/noted-host/scripts/t06-quarantine-check.mjs` (full)
- `products/noted-host/scripts/bridge-smoke.mjs`, `agent-prompt-smoke.mjs`, `ods-p0.mjs` (grepped
  for assertion/structure, not read line-by-line)
- `operations/receipts/ORCH_001_T4_T06_QUARANTINE/RECEIPT.md` (full, for T4 disposition and style)
- `experiments/NOTED_PROJECT_OS_001/README.md` (read-order table only)
- PR #61 (`NOTED-ADVERSARY-BLOCK-001`) — title/body/file-list only via `gh pr view`/`gh pr diff
  --name-only`; contents not opened, per packet's "optional, docs only" scope and to avoid scope
  creep into a parallel proposal awaiting its own review

## What was NOT done

- No probe from any attack card was executed as part of writing this receipt — every card's
  "expected result today" is either a static code citation (`SOURCE_TRACED`) or a description of
  what an operator running the card themselves should expect, not a live-executed result recorded
  here. This runbook is prep material, not a completed break session.
- No code was changed. No fix, patch, or new bridge channel was implemented.
- The NWC candidate zip was not opened; its SHA-256 was not re-verified; no file from it was added
  to this repo.
- `verse-studio:*` storage keys were not renamed.
- `experiments/NOTED_PROJECT_OS_001/README.md`'s read-order table received one added pointer row
  to this runbook (see diff) — no other restructuring of that programme.

## Verification

- `./nexus doctor`: see command output below.
- `npm run t06:quarantine-check` (from `products/noted-host`): **PASS** (re-confirmed at T5 start).

## Residual risk / non-claims

- This receipt does not claim any T-ID from `THREAT_MODEL.md` is closed, tested, or fixed.
- It does not claim the bridge-gap hypotheses in the runbook are all confirmed — several are
  explicitly labeled `CONTRADICTED` or partially contradicted against current code (see CARD-06,
  CARD-07 in the runbook) rather than restated as fact from the external mining pass that produced
  them.
- It does not claim a BREAK session has been run; it claims the material to run one now exists.
- This branch and its pull request are proposals until human-authorized review and merge.
- Passing checks (doctor, t06 quarantine) establish only the properties those checks exercise, not
  an exhaustive audit.
