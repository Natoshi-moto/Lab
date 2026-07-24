# Model handoff — emergency frontend privacy assault

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`

## Assignment

Act as an adversarial debug seat. Reproduce or falsify F-01 through F-04 from
`DEBUG_REPORT.md`, then search for adjacent cracks without broadening into an
unauthorized production fix.

## First-pass questions

1. Which public HTML entrypoints are actually reachable from the current app?
2. Where can an attacker-controlled same-origin script execute, including
   embedded Agent frames, imported HTML, markdown/preview surfaces, and build
   output?
3. Which storage namespaces contain user content, endpoints, provider metadata,
   or credentials? Map `localStorage`, IndexedDB, session storage, URL query,
   clipboard, downloads, and console/error paths.
4. Does any export, diagnostic, share, snapshot, or bridge path cross those
   namespaces without a reviewed allowlist?
5. Are CSP, iframe sandbox flags, postMessage origin checks, and external URL
   allowlists present on the actual shipped path, not merely in drafts?
6. Can the product be installed and typechecked from the committed lockfiles in
   a clean environment? Record failures as failures, not as assumed passes.

## Safe reproduction rules

- Use synthetic canaries such as `SYNTHETIC-CREDENTIAL-DO-NOT-USE`.
- Never paste a real API key into the browser, repository, logs, screenshots, or
  test fixture.
- Prefer a local HTTP listener and Playwright route interception over external
  providers.
- Use a disposable browser profile and remove it after the run.
- Do not test third-party hosts, public proxies, or other people's systems.
- Do not modify frozen receipts, historical targets, or the product while in the
  proposal phase.

## Evidence format

For every case, report:

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

A case is not closed by a prose recommendation. Closure requires the original
probe, an authorized patch, the same probe passing after the patch, and a
receipt. If the current behavior is intentional, require an explicit human
decision and rewrite the user-facing privacy claim rather than silently
relabeling the behavior safe.

## Suggested case extensions

- `F-05`: public navigation reaches stale or duplicate Agent builds.
- `F-06`: default proxy or custom endpoint sends prompts/keys to an unreviewed
  host.
- `F-07`: dynamic `innerHTML` or template interpolation turns storage or model
  output into scriptable markup.
- `F-08`: postMessage accepts messages from an uncontrolled origin or loses
  request ordering under concurrent prompts.
- `F-09`: CSP and iframe sandbox policy differ between source HTML, Vite output,
  and the deployed/static path.
- `F-10`: diagnostic fingerprint or export contents can be correlated across
  users or silently uploaded by a later integration.

## Independence warning

Seats from the same account, provider, or model family are correlated. Label
each report with the actual model/provider and do not convert agreement into
independent corroboration.
