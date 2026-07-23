# Handoff to Claude — emergency frontend privacy assault

**From:** Codex
**To:** Claude adversarial-debug seat
**Date:** 2026-07-23
**Status:** `HANDOFF / PROPOSAL_ONLY / STATUS_AUTHORITY: NONE`
**Repository:** `/home/anon/Lab`
**Target commit:** `47578a86e41267a2aa41c523b3b4297bd6d3becb`
**Target branch at handoff:** `remove-board-moved-to-sandbox`

## Mission

Take the existing emergency packet and attack the actual Noted browser product
hard enough to falsify it, extend it, or make its limits unmistakable:

`operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/`

Do not reassure the operator. Do not assume the documented privacy posture is
implemented. Trace and, where safe, execute the real public paths under
`products/noted-host/`. Look for cracks in credential handling, storage
boundaries, exports, embedded Agent surfaces, network routing, message bridges,
HTML injection, CSP/sandbox behavior, and stale or duplicate shipped builds.

The goal is evidence, not a dramatic verdict. If a proposed finding is wrong,
kill it cleanly. If it is right, make it reproducible and identify the narrowest
next task needed to investigate or fix it.

## Mandatory reading order

1. `README_START_HERE.md`
2. `STATUS.json`
3. `NEXT_ACTION.md`
4. `constitution/`
5. `AGENTS.md`
6. `WHY_NOT_TO_TRUST_THIS_PROJECT.md`
7. `AUDIT_START_HERE.md`
8. `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/README.md`
9. `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md`
10. `operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/README.md`
11. `operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/DEBUG_REPORT.md`
12. This handoff

If any baseline or file is missing, report `UNABLE_TO_VERIFY`; do not silently
substitute another checkout or branch.

## Allowed work

- Read and statically inspect the current product and its build configuration.
- Run local tests, typechecks, builds, and browser probes with synthetic data.
- Use a disposable browser profile and local HTTP endpoints.
- Add or update proposal evidence and the required handoff artifacts below.
- Record exact commands, target commit, runtime versions, and limitations.

## Forbidden work

- No real API keys, personal notes, private content, or production credentials.
- No probing third-party providers, public proxies, CDNs, or other systems.
- No product fixes, dependency upgrades, telemetry, CSP changes, or behavior
  changes unless the operator separately authorizes an implementation task.
- No edits to frozen snapshots, historical receipts, tags, or accepted control
  plane files.
- No claims of security certification, innocence, maliciousness, or independent
  corroboration from model agreement.
- No `git reset --hard`, force-push, destructive cleanup, or branch replacement.

## Attack plan

### A. Establish the actual shipped surface

- Map Vite entrypoints, routes, public HTML, iframe embeds, block registries,
  static copies, and generated output.
- Determine whether `prompt-studio-v3.html` and
  `nexus-agent-v0.14-scrubbed.html` are reachable product surfaces or merely
  archived artifacts.
- Search for duplicate Agent builds and stale references.

### B. Credential attack using canaries

Use a value such as `SYNTHETIC-CREDENTIAL-DO-NOT-USE` only.

- Test persistence across reload, route transitions, and browser restart.
- Test every provider adapter for keys in localStorage, IndexedDB, session
  storage, DOM, query strings, headers, errors, console output, downloads, and
  exports.
- Intercept Gemini and other provider requests locally. Record whether the
  canary appears in URL, referrer, request headers, body, logs, or error text.

### C. Export and storage attack

- Seed expected and unexpected `verse-studio:` local-storage keys.
- Call every diagnostic, snapshot, share, export, and download path.
- Compare actual output against an explicit proposed allowlist.
- Check whether user prompts, author names, endpoint URLs, or credential-shaped
  values cross an export boundary.

### D. Trust-boundary attack

- Inspect iframe sandbox flags and same-origin behavior.
- Test postMessage origin, source-window, replay, ordering, and payload checks.
- Inspect dynamic `innerHTML`, template interpolation, markdown rendering, and
  model-output insertion for scriptable paths.
- Check CSP presence and whether source/build/deployed paths differ.

### E. Verification attack

- Attempt a clean install/typecheck/build from committed lockfiles.
- Run existing browser smoke scripts where dependencies permit.
- Separate “not vulnerable,” “not reachable,” “not built,” and
  `UNABLE_TO_VERIFY`.

## Required output 1 — adversarial proposal

Write or append a report at:

`operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/CLAUDE_ATTACK_REPORT.md`

For each case use this exact shape:

```text
case_id:
target_commit:
files_and_lines:
probe_command:
synthetic_fixture:
observed_result:
expected_safe_invariant:
severity:
confidence: CONFIRMED | FALSIFIED | UNABLE_TO_VERIFY
limitations:
recommended_next_task:
```

Append new stable IDs rather than renumbering Codex's F-01 through F-10. Name
new cases `CLAUDE-F-01`, `CLAUDE-F-02`, and so on. Include a short disposition
table for Codex's original findings, even if the disposition is unchanged.

## Required output 2 — continuation handoff

Write:

`operations/handoffs/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001_CLAUDE_TO_CODEX.md`

That handoff must tell Codex:

- the exact commit inspected;
- files and commands actually inspected/run;
- findings Claude confirmed, falsified, or could not verify;
- the strongest unresolved attack path;
- any test/build environment blocker;
- the proposed next bounded Codex task;
- what Codex is explicitly forbidden to assume;
- whether Claude changed any product code (expected answer: no).

End it with:

```text
DONE:
EVIDENCE:
PROPOSAL_PATH:
HANDOFF_PATH:
BLOCKERS:
NEXT_FOR_CODEX:
STATUS_AUTHORITY: NONE
```

## Evidence bar

Do not close a case because the code “looks okay.” Closure requires the same
probe to reproduce the original behavior, an authorized fix, the same probe to
pass after the fix, and a receipt. This Claude round is proposal/debug work;
it must leave product behavior unchanged.

## Operator-facing pickup text

```text
Claude: read operations/handoffs/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001_CLAUDE_PICKUP.md in full.
Use only synthetic browser credentials and local endpoints.
Attack products/noted-host and the public Agent surfaces. Do not patch product code.
Write CLAUDE_ATTACK_REPORT.md and EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001_CLAUDE_TO_CODEX.md.
Return the exact paths, commands, evidence labels, blockers, and next bounded task.
status_authority: NONE.
```
