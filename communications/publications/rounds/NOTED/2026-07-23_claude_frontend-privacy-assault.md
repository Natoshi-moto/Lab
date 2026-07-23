# Round report — NOTED frontend privacy assault (Claude adversarial pickup)

**ID:** `PUB-ROUND-2026-07-23-CLAUDE-NOTED-FRONTEND-PRIVACY-ASSAULT`
**Date (UTC):** 2026-07-23
**Round / track:** `NOTED`
**Seat:** Claude (Opus 4.8) — adversarial-debug seat
**Operator task / authority:** `operations/handoffs/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001_CLAUDE_PICKUP.md` (Codex → Claude handoff) + operator verbal direction to attack, reason, and publish
**Branch / tip SHA:** `claude/pub-noted-frontend-privacy-assault-001` (branched off `main`)
**PR(s) if any:** proposal PR to `Natoshi-moto/Lab` (this branch)
**status_authority:** `NONE`
**Report status:** `COMPLETE`

---

## What I did

- Executed the adversarial debug handoff against the shipped Noted browser product
  at target commit `47578a86e41267a2aa41c523b3b4297bd6d3becb`, synthetic data only.
- Filed the full case report at
  `operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/CLAUDE_ATTACK_REPORT.md`
  and the continuation handoff at
  `operations/handoffs/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001_CLAUDE_TO_CODEX.md`.
- Confirmed Codex F-01/F-02/F-03, resolved F-04, and filed three new cases
  (CLAUDE-F-01/02/03).

## Why

- The emergency trigger is a mismatch between the Lab's strong "sovereign /
  local-first / your-keys-are-yours" language and the browser product's actual
  credential and content handling. The green Nexus/Python gates do not exercise
  these paths. Operator directed an adversarial round, explicitly: do not reassure.

## What I verified

| Check | Command or inspection | Result |
|-------|------------------------|--------|
| Credential persistence (F-01) | read `public/nexus/prompt-studio-v3.html:396-402`; route `src/App.tsx:262` + iframe | CONFIRMED; **reachable shipped route**, not an artifact |
| Key in URL (F-02) | read `prompt-studio-v3.html:570`, `nexus-agent-v0.14-scrubbed.html:2133,2238-2240` | CONFIRMED (both pages) |
| Export allowlist (F-03) | synthetic Node harness reproducing exporter loop `diagnosticExporter.ts:160-166` | CONFIRMED as fact; **worst case (creds) FALSIFIED**; leaks content + author |
| Verification gap (F-04) | `npm ci`; `npm run typecheck` (tsc --noEmit); `npm run build` | RESOLVED — exit 0 / build success |
| Default third-party proxy (CLAUDE-F-01) | read `nexus-agent-...:2214-2215,2252-2254,14540` | CONFIRMED — `corsproxy.io` default for openai/groq/xai/deepseek |
| Shared origin / no CSP (CLAUDE-F-02) | `find dist/nexus -name '*.html'` → 71; CSP grep → none | CONFIRMED — 71 apps, one localStorage, no CSP |
| Author leak (CLAUDE-F-03) | synthetic harness; `CompilePanel.tsx:5` | RUNTIME-ATTESTED — `verse-studio:compile:author` crosses export |

Environment: Fedora, Node `v24.14.0`, npm `11.9.0`.

## What I did not check

- A concrete exploitable XSS/innerHTML sink in a specific co-resident page (F-07) —
  precondition established, sink not proven.
- postMessage origin/ordering on the two iframes (F-08).
- corsproxy.io's real header/body retention (forbidden to probe the live host).
- The full built bundle end-to-end for the exporter (harness reproduces the
  selection loop faithfully, not the whole app).

## What changed in the project (evolution note)

After this round, the Lab has, for the first time, **runtime-attested evidence that
its flagship browser product's real credential/content handling contradicts its
privacy language** — filed as a reproducible, falsifiable case report rather than a
verdict. The scariest hypothesis (API keys leaking through the diagnostic export)
was disproven with a synthetic probe; a narrower real leak (private drafts +
author identity) and two new structural gaps (a default third-party CORS proxy and
a 71-page shared-origin credential store with no CSP) were confirmed. No product
code changed. This converts the "privacy" claim from asserted toward tested, and
gives the operator concrete information to resolve the swan-song-vs-keep-building
fork on evidence instead of instinct.

## Files / paths touched

| Path | Intent |
|------|--------|
| `operations/proposals/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001/CLAUDE_ATTACK_REPORT.md` | new — case evidence |
| `operations/handoffs/EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001_CLAUDE_TO_CODEX.md` | new — continuation handoff |
| `communications/publications/rounds/NOTED/2026-07-23_claude_frontend-privacy-assault.md` | new — this report |
| `communications/publications/epistemic/2026-07-23_claude_frontend-privacy-assault.md` | new — epistemic analysis |
| `communications/publications/INDEX.md` | +1 row (top) |
| `communications/publications/epistemic/INDEX.md` | +1 row (top) |

No frozen snapshot, tag, receipt, canonical target, `STATUS.json`, or `NEXUS.json`
was touched. Cryptographic lineage unchanged.

## Open reds / scars still true

| Item | Still true? |
|------|-------------|
| T-01 / G-01 red | Yes (unrelated to this round) |
| CARD-11 preactivation plaintext fail | Yes |
| PRODUCT_LAUNCH_AND_SHIP_LANGUAGE_STILL_GATED | Yes |
| Declared ≠ enforced (privacy) | **Newly evidenced** — this round adds the browser-privacy strain to STRICT-NO-SALE and review-required |
| No token / no real-world economic value | Yes |

## Non-claims

- Not a product launch or security certificate. Not a penetration test.
- Not real-world economic value / token authorization.
- Multi-seat agreement (Claude + Codex, same operator account) is **not**
  independent corroboration.
- A confirmed static/structural finding is not a closed vulnerability; closure
  requires an authorized fix + rerun + receipt.
- This report is not `STATUS.json` authority.
- `status_authority: NONE`

## Follow-ups proposed (not authorized by this file)

- Codex `TASK CLAUDE-NEXT-01`: prove one same-origin XSS sink reading `ps3`;
  local echo-server capture of the proxy leg.
- Bounded fix task (separate authorization): CSP + isolate the `ps3` credential
  surface + exporter allowlist + remove default `corsproxy.io`.
