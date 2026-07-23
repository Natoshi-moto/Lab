# Claude adversarial attack report — frontend privacy paths

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Seat:** Claude (Opus 4.8) — adversarial-debug pickup of `EMERGENCY_FRONTEND_PRIVACY_ASSAULT_001_CLAUDE_PICKUP.md`
**Target commit:** `47578a86e41267a2aa41c523b3b4297bd6d3becb`
**Target branch:** `remove-board-moved-to-sandbox`
**Environment:** Fedora Linux, Node `v24.14.0`, npm `11.9.0`
**Product code changed:** NO. All work was read/inspect, synthetic-fixture, install/typecheck/build. Only gitignored artifacts (`node_modules/`, `dist/`) were produced.
**Independence note:** This seat is Claude; the prior seat was Codex. Same operator account. **Agreement between us is NOT independent corroboration.**

---

## Executive result

Codex's three core cracks (F-01, F-02, F-03) are **CONFIRMED at the code level**,
and the two flagged pages are **confirmed reachable, shipped product surfaces** —
not archived artifacts. F-04 (verification gap) is **RESOLVED**: I installed from
the committed lockfile, and `tsc` typecheck and `vite build` both pass.

Two corrections tighten the picture:

1. **The scariest reading of F-03 is FALSIFIED.** The diagnostic exporter does
   **not** capture the provider API keys. The credential page stores under key
   `ps3`; the exporter only sweeps `verse-studio:`-prefixed keys. Runtime probe
   confirms credentials do not cross the export boundary — but **user prompt
   drafts, project context, and the author's name do.**
2. **The credential exposure is broader than "localStorage" and "URL."** I
   confirmed (a) a **default third-party CORS proxy** (`corsproxy.io`) that
   transits credential-bearing requests for four providers, and (b) a
   **shared-origin architecture**: 71 standalone HTML apps ship on one origin with
   one localStorage and **no CSP**, so the credential blob's security ceiling is
   set by the weakest of 71 pages.

The correct headline is not "the app is malicious." It is: **the shipped browser
product's real credential- and content-handling contradicts the project's
sovereign / local-first / your-keys-are-yours language, and no code enforces the
promise.** Same disease as `STRICT NO SALE`: declared, not enforced.

---

## Disposition of Codex findings F-01 – F-04

| ID | Codex severity | Claude disposition | Basis |
|----|----------------|--------------------|-------|
| F-01 credential persistence in localStorage | HIGH | **CONFIRMED + reachability upgraded** | Code at `prompt-studio-v3.html:396-402`; **shipped route** `App.tsx:262` + iframe `PromptStudioV3.tsx` |
| F-02 credential in URL | HIGH | **CONFIRMED (both pages)** | `prompt-studio-v3.html:570`; `nexus-agent-v0.14-scrubbed.html:2133,2238-2240` |
| F-03 export has no localStorage allowlist | MED/HIGH | **CONFIRMED as code fact; scope corrected** — leaks content+author, NOT credentials | Runtime probe (below); prefix `verse-studio:` ≠ `ps3` |
| F-04 frontend verification unavailable | MED (env gap) | **RESOLVED — not a defect** | `npm ci` ok, `tsc --noEmit` exit 0, `vite build` success |

---

## Confirmed / new cases (Claude IDs continue from Codex, do not renumber)

```text
case_id: CLAUDE-F-01
target_commit: 47578a86e41267a2aa41c523b3b4297bd6d3becb
files_and_lines: public/nexus/nexus-agent-v0.14-scrubbed.html:2214 (BROWSER_DIRECT),
  :2215 (DEFAULT_PROXY='https://corsproxy.io/?'), :2252-2254 (auto-proxy apply),
  :14540 (PROXY_REQUIRED=['groq','openai','xai','deepseek'])
probe_command: static read + grep of provider routing sets; no live request issued
synthetic_fixture: n/a (routing is unconditional in code; no live key used)
observed_result: For any provider NOT in BROWSER_DIRECT (i.e. openai, groq, xai,
  deepseek), and with no user-set proxy, the credential-bearing request is routed
  through the hardcoded third party corsproxy.io by default
  (url = 'https://corsproxy.io/?' + encodeURIComponent(url)). The user never
  chose this host. The in-product error string (:2276) confirms it is the intended
  default path ("The free proxy (corsproxy.io) may be down").
expected_safe_invariant: A "sovereign / local-first / your-keys-are-yours" product
  must not route any credential-bearing request through an unreviewed third-party
  host by default; any proxy must be an explicit, informed user choice with a
  visible warning.
severity: HIGH
confidence: CONFIRMED (routing through third party is unconditional in code).
  The downstream logging/retention behavior of corsproxy.io is NOT tested and
  must not be asserted.
limitations: No live request issued (forbidden). Whether corsproxy.io forwards
  Authorization headers verbatim is a documented behavior of that service, not
  verified here; the confirmed fact is that the request transits it at all.
recommended_next_task: Local synthetic probe — point DEFAULT_PROXY at a local
  echo server, send a SYNTHETIC-CREDENTIAL request for a PROXY_REQUIRED provider,
  and record exactly which headers/body the proxy leg receives.
```

```text
case_id: CLAUDE-F-02
target_commit: 47578a86e41267a2aa41c523b3b4297bd6d3becb
files_and_lines: vite.config.ts:52-54 (base './', public/ shipped verbatim);
  dist/nexus/*.html (71 files); prompt-studio-v3.html:396-402 (ps3 creds);
  absence of any Content-Security-Policy in index.html / dist / public
probe_command: `find dist/nexus -name '*.html' | wc -l` -> 71;
  `grep -rniE 'content-security-policy' dist index.html public` -> none
synthetic_fixture: n/a (architectural)
observed_result: The React app and 71 standalone HTML apps (prompt-studio,
  nexus-agent, verse-studio, Nexus_OS, and dozens of eidolon/creature/game pages)
  are all served from ONE origin, sharing ONE localStorage/IndexedDB partition,
  with NO CSP. The plaintext ps3 credential blob and all verse-studio: user
  content are readable by any same-origin script in ANY of the 71 pages. Several
  of those pages are creature/game builds never subjected to a credential-handling
  review. The credential's security ceiling is therefore set by the single weakest
  co-resident page's XSS / model-output-injection posture.
expected_safe_invariant: Credentials should be isolated from unreviewed co-resident
  code (separate origin, or not persisted, or stored via a boundary not readable by
  arbitrary same-origin pages), and untrusted model output must render under a CSP
  that blocks script execution.
severity: HIGH (architectural; amplifies F-01)
confidence: CONFIRMED BY CODE for shared origin + no CSP. Specific XSS sinks in
  individual pages are UNABLE_TO_VERIFY here (see F-07 in NEXT_FOR_CODEX).
limitations: I did not enumerate an exploitable injection sink in a specific page;
  I established the precondition (shared origin, no CSP, plaintext creds).
recommended_next_task: Pick the 3 highest-traffic co-resident pages and audit
  every innerHTML / template-interpolation / model-output insertion path for a
  scriptable sink that can read localStorage['ps3'].
```

```text
case_id: CLAUDE-F-03
target_commit: 47578a86e41267a2aa41c523b3b4297bd6d3becb
files_and_lines: src/diagnosticExporter.ts:159-166 (selection loop);
  src/components/CompilePanel.tsx:5 (verse-studio:compile:author writer)
probe_command: node scratch harness reproducing the verbatim selection loop
  against a synthetic store (scratchpad/exporter_boundary_probe.mjs)
synthetic_fixture: planted ps3 credential blob + verse-studio:prompts:drafts,
  verse-studio:projectContext, verse-studio:compile:author, plus benign UI keys,
  all SYNTHETIC
observed_result: RUNTIME-ATTESTED. Export payload.localstorage collected:
  {prompts:drafts, projectContext, compile:author, theme, sidebar:collapsed}.
  Credential blob (ps3): NOT present (prefix mismatch). Synthetic author name and
  synthetic prompt/context text: PRESENT in the bundle. So a user who shares a
  "diagnostic" bundle unknowingly ships their private draft content and their
  authored identity, but not their API keys.
expected_safe_invariant: A diagnostic/validation bundle should carry a maintained
  allowlist of structural keys only; free-text user content and author identity
  must be excluded or redacted by default.
severity: MEDIUM today, HIGH if a future key-shaped value ever lands under a
  verse-studio: key (the prefix, not a value scan, is the only gate)
confidence: CONFIRMED (code) + RUNTIME-ATTESTED (synthetic harness)
limitations: Harness reproduces the exporter's selection logic, not the full app;
  it is faithful to lines 160-166 but is not the built bundle end-to-end.
recommended_next_task: In a disposable browser profile, seed the real app, call
  the real exportValidationBundle path, and diff output against a proposed
  structural allowlist.
```

### Note on the exporter falsifying the worst case (kept explicitly)

Codex correctly flagged F-03 as an allowlist gap. My probe **falsifies** the most
alarming interpretation (credentials in the export) and **confirms** a real but
narrower one (content + author identity in the export). Both facts are preserved;
the finding is not "downgraded to safe," it is **re-scoped with evidence**, per the
severity-discipline rule.

---

## Mapping to Codex's suggested extensions F-05 – F-10

| Suggested | Status from this round |
|-----------|------------------------|
| F-05 stale/duplicate Agent builds reachable | **Partially confirmed** — `prompt-studio-v3.html` ships as **two byte-identical copies** (`public/nexus/` and `public/nexus/os/blocks/apps/`, sha256 `ab596a39…`), both in `dist/`. |
| F-06 default proxy / endpoint sends keys to unreviewed host | **CONFIRMED** — see `CLAUDE-F-01` (corsproxy.io default). |
| F-07 innerHTML / model output becomes scriptable markup | **Unresolved / strongest open path** — precondition set by `CLAUDE-F-02` (no CSP, shared origin, plaintext creds); specific sink not yet proven. |
| F-08 postMessage origin / ordering | **UNABLE_TO_VERIFY** — not probed this round (iframes: `PromptStudioV3.tsx`, `NexusAgentStudio.tsx`). |
| F-09 CSP differs source vs build vs deployed | **CONFIRMED (as absence)** — no CSP in source, `dist/`, or public copies. |
| F-10 export correlation / silent upload | **Partially addressed** — export carries a stable environment fingerprint + author identity (`CLAUDE-F-03`); no upload path in the exporter itself (it returns a bundle to the caller). Downstream callers not audited. |

---

## Controls that passed this round (with limits)

- `npm ci` (from `products/noted-host/package-lock.json`): clean.
- `npm run typecheck` (`tsc --noEmit`): exit 0.
- `npm run build` (`vite build && node pack.js`): success, 304 modules, `dist/` produced.

These prove the product compiles and type-checks. They do **not** prove browser
credential safety, proxy hygiene, XSS resistance, or export privacy — the very
paths F-01/F-02/F-03/CLAUDE-F-01/CLAUDE-F-02 live on. Green build ≠ safe surface.

## No-fix boundary

No product code, warning, exporter contract, CSP, or dependency was changed. No
real credential or third-party system was used. `status_authority: NONE`.
