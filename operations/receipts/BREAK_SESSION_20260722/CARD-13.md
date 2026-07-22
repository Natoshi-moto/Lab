# CARD-13 result — BREAK_SESSION_20260722 (session 2)

- Card: CARD-13 · CSP presence (Fable-proposed, runbook §4.1)
- Threat links: amplifies T-01 and T-02; gate links G-01, G-02
- Seat: Claude Opus 4.8 (Anthropic) — `status_authority: NONE`
- Model family: Anthropic (same account/family as prior Claude seats — **NOT** independent corroboration)
- Date/time run (UTC): 2026-07-22 ~04:20
- main SHA at start: `cc901f8767b2d6bf631ba7151478b7a06a91c80a` (clean tree, on `main`; CARD-04 receipt already merged)
- Result: **FOUND (expected)** — no Content-Security-Policy present
- Evidence label: **EXECUTED** (grep run this session)

## What was tested (layman)

Does anything restrict which scripts the Agent window is allowed to load and run? A
Content-Security-Policy (CSP) is the browser-level control that could stop the iframe from
pulling arbitrary code off the internet. This card checks whether one exists at all.

## Commands run

```
$ grep -in "content-security-policy" \
    products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html \
    products/noted-host/index.html
(no match — exit 1)

$ grep -in "http-equiv|Content-Security|<meta" <both files>
products/noted-host/index.html:4:    <meta charset="UTF-8" />
products/noted-host/index.html:5:    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html:3:<meta charset="UTF-8">
products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html:4:<meta name="viewport" content="width=device-width, initial-scale=1.0">
products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html:6307: ... '<meta charset="UTF-8"><meta name="viewport" ...>'  (an export-template string, not a CSP)

$ grep -rin "content-security|csp|headers" products/noted-host/vite.config.*
(no vite.config CSP/header references)
```

## Evidence

- **No `Content-Security-Policy`** appears in the shipped Agent HTML
  (`nexus-agent-v0.14-scrubbed.html`) or in the host `index.html`.
- The only `<meta>` tags present in either file are `charset` and `viewport` (3 meta tags total
  in the Agent HTML; 2 in `index.html`). None is `http-equiv="Content-Security-Policy"`.
- No CSP set as an HTTP response header either — `vite.config.*` contains no `headers`/CSP config.

## What this means

There is **no CSP** governing the Agent iframe. Nothing at the browser-policy layer constrains
what origins the iframe may load scripts/styles from or connect to. This directly amplifies:

- **T-02** (CARD-02): the Agent loads `cdn.tailwindcss.com` unpinned (no SRI) — a CSP `script-src`
  allowlist would be the second line of defence, and it is absent.
- **T-01** (CARD-04, EXECUTED-FAIL this session): the same-origin iframe already has full host
  storage read/write; with no CSP there is also no `connect-src`/`script-src` restriction on what
  injected code inside that frame could then do.

## Non-claims (tattoo)

- This does not certify anything; `status_authority: NONE`. A FOUND here is honest progress.
- **NOT independent corroboration** — same Anthropic account/family as prior seats.
- Scope: this checks the shipped HTML files and the dev/build config. Static `dist/` output is
  served without an app server, so there is no runtime header layer to add a CSP either — but a
  built-output parity check (CARD-12) was **not** run here and remains UNKNOWN.
- No fix attempted. Adding a CSP (ODS-SEC-010, Fable §4.3) is out of scope for this break session.

## VETO checklist bearing (Fable §4.5)

- Confirms the "There is no CSP anywhere" observation Fable recorded (§3 point 6) by independent
  `EXECUTED` grep at current `main`.
- Leaves G-02 correctly **RED** and adds weight to the T-01 blast radius (G-01 RED).
