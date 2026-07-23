# Handoff — Claude → Codex (emergency frontend privacy assault, round 2)

**From:** Claude (Opus 4.8) adversarial-debug seat
**To:** Codex
**Date:** 2026-07-23
**Status:** `HANDOFF / PROPOSAL_ONLY / STATUS_AUTHORITY: NONE`
**Repository:** `/home/anon/Lab`

## Exact commit inspected

`47578a86e41267a2aa41c523b3b4297bd6d3becb` on branch `remove-board-moved-to-sandbox`.
Working tree clean except the untracked emergency packet/handoffs. Product code
UNCHANGED by this round.

## What I actually inspected / ran

- Read: `vite.config.ts`, `src/diagnosticExporter.ts`, `src/App.tsx`,
  `src/studios/promptStudioV3/PromptStudioV3.tsx`,
  `src/studios/nexusAgent/NexusAgentStudio.tsx`,
  `public/nexus/prompt-studio-v3.html`,
  `public/nexus/nexus-agent-v0.14-scrubbed.html`, plus greps across `src/` and
  `public/` for storage keys, credential handling, CSP, and proxy routing.
- Ran: `npm ci`; `npm run typecheck` (exit 0); `npm run build` (success);
  `node` synthetic harness reproducing the exporter selection loop
  (`scratchpad/exporter_boundary_probe.mjs`, synthetic data only).
- Env: Fedora, Node v24.14.0, npm 11.9.0.

## Confirmed

- **F-01** credential persistence (`ps3` localStorage) — and it is a **reachable
  shipped route** (`App.tsx:262` + iframe), not an artifact.
- **F-02** Gemini key in URL query string (both flagged pages).
- **F-03** exporter has no allowlist — CONFIRMED as code fact.
- **CLAUDE-F-01** default third-party CORS proxy `corsproxy.io` transits
  credential-bearing requests for `openai/groq/xai/deepseek` by default
  (resolves your F-06).
- **CLAUDE-F-02** 71 same-origin HTML apps, one shared localStorage, no CSP
  (resolves your F-09 as an absence; amplifies F-01).
- **F-05** two byte-identical `prompt-studio-v3.html` copies both ship in `dist/`.

## Falsified / re-scoped

- **F-03 worst case FALSIFIED**: exporter does NOT capture API keys (`ps3` prefix
  ≠ `verse-studio:`). Runtime-attested. It DOES leak user prompt drafts, project
  context, and **author identity** (`verse-studio:compile:author`). Finding
  re-scoped with evidence, not dismissed.
- **F-04 RESOLVED**: not a defect — typecheck and build pass here. It was a local
  tooling gap in the previous environment only.

## Could not verify (do not assume either way)

- **F-07** a concrete scriptable innerHTML/model-output sink in a specific page.
- **F-08** postMessage origin/ordering on the two iframes.
- corsproxy.io's actual header/body retention (forbidden to probe the live host).

## Strongest unresolved attack path

`CLAUDE-F-02 → F-07`: shared origin + no CSP + plaintext `ps3` credentials means a
**single** injection sink in any one of 71 co-resident pages (including
never-reviewed creature/game HTML) reads the API keys. Proving one real sink turns
this from "precondition" to "confirmed credential theft chain." That is the highest-
value next probe.

## Test/build environment blockers

None. `npm ci` + typecheck + build all succeeded. (Earlier `tsc: command not found`
was a missing local install, now resolved.)

## Proposed next bounded Codex task

`EMERGENCY-FRONTEND-PRIVACY-ASSAULT-001 / TASK CLAUDE-NEXT-01`: In a disposable
browser profile against a local build, (a) plant `SYNTHETIC-CREDENTIAL` in `ps3`;
(b) audit the 3 highest-traffic co-resident `public/nexus/*.html` pages for one
innerHTML / template / model-output sink that can read `localStorage['ps3']`;
(c) point `DEFAULT_PROXY` at a local echo server and record exactly what the proxy
leg receives for a `PROXY_REQUIRED` provider. Report only; no product fix.

## What Codex is explicitly forbidden to assume

- That green typecheck/build implies the credential/proxy/XSS paths are safe.
- That the exporter is "clean" because it omits credentials — it still leaks
  content + author identity.
- That corsproxy.io is safe or unsafe — its retention is untested.
- That Claude/Codex agreement is independent corroboration. It is not.

## Did Claude change any product code?

No.

```text
DONE: F-01/F-02/F-03 confirmed; F-03 worst-case falsified & re-scoped; F-04 resolved; CLAUDE-F-01/F-02/F-03 filed; F-05/F-06/F-09 resolved
EVIDENCE: operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/CLAUDE_ATTACK_REPORT.md; scratchpad/exporter_boundary_probe.mjs; npm ci/typecheck(exit0)/build(success)
PROPOSAL_PATH: operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/CLAUDE_ATTACK_REPORT.md
HANDOFF_PATH: operations/handoffs/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001_CLAUDE_TO_CODEX.md
BLOCKERS: none (build env healthy)
NEXT_FOR_CODEX: TASK CLAUDE-NEXT-01 — prove one same-origin XSS sink reading ps3; local echo-server proxy-leg capture
STATUS_AUTHORITY: NONE
```
