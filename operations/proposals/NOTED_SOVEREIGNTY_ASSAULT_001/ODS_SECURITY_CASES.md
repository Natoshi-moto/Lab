# ODS security case stubs (spec only)

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22

Spec-only — no implementation here. These are designed to slot into the existing `scripts/agent-prompt-smoke.mjs` / `npm run ods:p1` Playwright harness idiom (same `data-test` selector pattern, same `assert(condition, message)` helper), not a new test framework.

Each case asserts the **safe invariant**, not today's behavior. Most are expected to fail right now — a failing case here is the evidence `CHARTER.md`'s Wave A needs; turning it green is the fix's acceptance bar.

| Case ID | Targets | Probe | Assertion | Expected today |
|---|---|---|---|---|
| **ODS-SEC-001** | T-01 | From inside the Agent frame: `window.parent.localStorage.getItem('verse-studio:theme')` | Throws / returns null — parent storage must be unreachable from the frame | **FAIL** (currently readable) |
| **ODS-SEC-002** | T-01 | From inside the Agent frame: attempt `window.parent.indexedDB.open('verse-studio')` and read a known store | Must throw or return empty — no direct IDB access outside the bridge | **FAIL** |
| **ODS-SEC-003** | T-02 | Static parse of `nexus-agent-v0.14-scrubbed.html` `<script src>` / `<link href>` tags pointing at external hosts | Every external script/stylesheet has a non-empty `integrity=` (SRI) attribute | **FAIL** (none have one) |
| **ODS-SEC-004** | T-03 | Playwright route-intercept during a simulated `openai`/`groq`/`xai`/`deepseek` call with no custom proxy configured | Outbound request host is never `corsproxy.io` unless the user explicitly set a proxy | **FAIL** (silent default fallback) |
| **ODS-SEC-005** | T-04 | Call `exportValidationBundle`, diff `Object.keys(bundle.payload.localstorage)` against a maintained allowlist | New/unexpected key fails loud, forcing a reviewed update to the allowlist rather than silent inclusion | **FAIL** (no allowlist exists yet — write it as part of closing this case) |
| **ODS-SEC-006** | T-06 | File-existence + registry check | `nexus-agent-v0.12.html` (either path) is absent from shipped output; not referenced in `block-registry.json` or `Nexus_OS.html` | **PASS on launch path (2026-07-22)** — files/refs gone after PR #66; recheck with `npm run t06:quarantine-check`. Case itself still **unimplemented** in `odsCases.ts` (spec-only IOU). Git history residual is out of scope for this case. |
| **ODS-SEC-007** | T-14 | Send two `prompt.snapshot.import.requested` envelopes back-to-back before approving either | Neither ever imports without an explicit click; the second envelope must not silently overwrite the first's pending preview with no trace that it happened | **Untested** — likely fails today: single `pending` state means envelope #2 silently replaces envelope #1's preview |
| **ODS-SEC-008** | T-13 | Trigger `window.open('file:///etc/passwd')` (or platform-safe equivalent) from within the Agent frame in the Electron build | `shell.openExternal` must not be called for non-http(s) schemes | **FAIL** — conditional on first confirming the Electron shell actually ships (see T-13's open question) |

## Regression clause (W5)

Once implemented, every case here re-runs automatically whenever the Agent HTML is regenerated/re-scrubbed or the bridge registry changes — not just once at close time.
