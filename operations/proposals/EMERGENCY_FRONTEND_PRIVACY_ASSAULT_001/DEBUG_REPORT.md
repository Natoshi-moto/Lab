# Emergency debug report — frontend privacy paths

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Audit seat:** Codex
**Target commit:** `47578a86e41267a2aa41c523b3b4297bd6d3becb`
**Date:** 2026-07-23

## Executive result

The repository's core operator gates pass, but they do not cover the public
static browser surfaces. Three concrete cracks require adversarial follow-up:

1. provider API keys are stored in browser `localStorage`;
2. a Gemini API key is placed in a request URL; and
3. the diagnostic exporter copies all `verse-studio:` local-storage values
   verbatim without an allowlist.

The frontend typecheck could not be completed in the current environment:
`npm run typecheck --prefix products/noted-host` failed with `tsc: command not
found`. This is a verification gap, not evidence that TypeScript is broken.

## Reproduction evidence

### F-01 — browser credential persistence

**Severity:** `HIGH / CONFIRMED BY CODE`

`products/noted-host/public/nexus/prompt-studio-v3.html:397-402` reads and
writes `PS.apiKeys`, `PS.customApiKey`, endpoint, and model settings through a
single `localStorage` record named `ps3`.

The same file's `:1052-1069` reconstructs the stored values into the settings
form and saves them after the user clicks “SAVE KEYS”. Any same-origin script,
browser extension with page access, compromised dependency, or XSS can read the
values. The code's UI note says keys are “stored in localStorage”, so this is
not an accidental scanner-only finding; it is an explicit design choice.

**Questions for follow-up models:**

- Is this file a shipped route, a historical artifact, or both? Prove the answer
  from the Vite entrypoints and public navigation, not its filename.
- Do any other public HTML copies persist keys under different keys or storage
  adapters?
- Can a synthetic same-origin script read the value after a reload and after a
  route transition?
- Does the current product promise local-first privacy strongly enough that this
  must be treated as a release blocker rather than a documented tradeoff?

### F-02 — credential in URL

**Severity:** `HIGH / CONFIRMED BY CODE`

`prompt-studio-v3.html:568-578` constructs the Gemini endpoint with the key in
the query string. The analogous Agent copy at
`products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html:2133` and
`:2238-2240` uses the same URL-key pattern. URL credentials can enter provider,
proxy, browser diagnostic, intermediary, or server logs. Exact exposure depends
on the browser/provider transport path and must be measured with a synthetic
canary, never a live key.

**Required probe:** intercept the request at the browser boundary and at a
local synthetic HTTP endpoint; assert where the canary appears in URL, headers,
referrer, console, error, and exported state. Do not infer absence from a
successful fetch alone.

### F-03 — diagnostic export has no local-storage allowlist

**Severity:** `MEDIUM TODAY / HIGH IF STORAGE DRIFTS`

`products/noted-host/src/diagnosticExporter.ts:102-109` documents that the
bundle contains all `verse-studio:` local-storage values. Lines `159-165`
iterate over every matching key and copy the full raw string into
`payload.localstorage`. There is no maintained key allowlist and no value
redaction in this exporter.

The nearby ODS diagnostic UI claims its own exported pack redacts known secret
shapes and excludes private notes (`DiagnosticsStudio.tsx:217-228`). That is a
different export path; models must not treat that claim as covering
`exportValidationBundle`.

**Required probe:** seed a temporary browser profile with known synthetic values
under expected and unexpected `verse-studio:` keys, call the exporter, and
compare output against a proposed allowlist. Check whether notes, prompts,
author names, endpoint URLs, or future credential-shaped values can land there.

### F-04 — frontend verification is currently unavailable

**Severity:** `MEDIUM / REPRODUCED ENVIRONMENT GAP`

The product has `products/noted-host/package-lock.json`, but
`npm run typecheck --prefix products/noted-host` currently fails because the
`tsc` executable is not installed in the available `node_modules`. Offline
`npm audit --package-lock-only --prefix products/noted-host` reported zero
known vulnerabilities, but this does not replace typecheck or a browser build.

Follow-up models should record Node/npm versions, install mode, lockfile
integrity, typecheck, build, and browser smoke results separately.

## Controls that passed, with limits

The following passed on the target checkout:

- `./nexus doctor`
- `./nexus verify`
- `python3 -m unittest discover -s tests -q`
- `python3 -m compileall -q system experiments tests`
- `git diff --check`
- heuristic current-tree secret scan

These controls do not prove browser credential safety, URL hygiene, export
privacy, dependency installation, CSP behavior, or runtime route coverage.

## Severity discipline

Do not collapse F-01 through F-04 into one score. F-01/F-02 are credential
handling issues; F-03 is an export-contract drift issue; F-04 is a reproducible
verification gap. A model may downgrade a finding only with direct evidence and
must preserve the original observation and reason for disposition.

## No-fix boundary

This report intentionally does not patch the product. The exporter header says
it is frozen and requires an explicit unfreeze process. Any fix must be a new,
human-authorized task with compatibility decisions, migration behavior, and
retests recorded separately.
