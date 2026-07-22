# CARD-04 result — BREAK_SESSION_20260722 (session 2)

- Card: CARD-04 · T-01 same-origin storage reach
- Threat links: T-01 (highest severity on the spine), G-01
- Seat: Claude Opus 4.8 (Anthropic) — `status_authority: NONE`
- Model family: Anthropic (same account/family as prior Claude seats — **NOT** independent corroboration)
- Date/time run (UTC): 2026-07-22 ~04:05–04:12
- main SHA at start: `5070688faee289524990a9b756d956ba651d5c54` (clean tree, on `main`)
- Result: **FAIL** (against the safe invariant "the Agent iframe cannot reach host storage")
- Evidence label: **EXECUTED** (live probe run this session; also SOURCE_TRACED for the sandbox flag)

## What was tested (layman)

Can the Agent chat window (an `<iframe>` served from the *same web address* as Noted)
read or write Noted's saved browser storage directly, bypassing the intended bridge?

## How it was run (synthetic only)

- **Fresh throwaway Playwright chromium context** (empty storage — no real operator notes,
  no real keys). This is the runbook's "clean browser profile" rule satisfied by construction.
- Started the real Noted host app on the Vite dev server (`http://localhost:5174`).
- Seeded **synthetic** parent (host) localStorage canaries:
  `verse-studio:CARD04-canary = "SYNTHETIC-PARENT-SECRET-DO-NOT-USE-0000"`, plus a synthetic
  IndexedDB db.
- Navigated to `#/nexus-agent`, located the real Agent iframe
  (`iframe[data-test="nexus-agent-iframe"]`), took its `contentFrame`, and ran the probe
  **inside the sandboxed iframe's own JS context** — i.e. exactly CARD-04 steps 3–4, but driven
  headlessly instead of by hand.
- Probe scripts (throwaway, not committed to product):
  `scratchpad/card04_probe.js`, `scratchpad/card04_blast.js`.

## SOURCE_TRACED preconditions (re-verified at current SHA `5070688`)

- `products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx:125`
  `sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"`
- `NexusAgentStudio.tsx:13` `NEXUS_AGENT_SRC = './nexus/nexus-agent-v0.14-scrubbed.html'`
  → relative path = **same origin** as host.
- Same-origin serve + `allow-same-origin` in sandbox ⇒ the sandbox imposes **no origin
  boundary**. Parent and child share one origin's storage bucket.

## EXECUTED evidence (observed live, from inside the iframe)

```json
{
  "sandbox_attr": "allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin",
  "iframe_src": "./nexus/nexus-agent-v0.14-scrubbed.html",
  "frame_origin": "http://localhost:5174",
  "parent_origin": "http://localhost:5174",
  "parent_secret (my synthetic canary, read from child)": "SYNTHETIC-PARENT-SECRET-DO-NOT-USE-0000",
  "parent_ls_keys enumerated from child": 32,
  "parent_idb_databases enumerated from child": ["nexus-kernel", "verse-studio"],
  "parent_write from child": "SUCCEEDED",
  "host readback of iframe's write": "IFRAME-WAS-HERE"
}
```

Blast-radius follow-up (crypto key material the enumeration exposed — read from the child;
presence/length/prefix captured, full bytes deliberately not dumped even though synthetic):

```json
{
  "nx:crypto:keypair (read from child)": {"type":"string","length":345,"prefix":"{\"pub\":\"BKUXjBJALbds7uj7"},
  "nx:crypto:meta (read from child)":    {"type":"string","length":226,"prefix":"{\"alg\":\"ECDSA-P256\",\"nod"},
  "host nexus-kernel IndexedDB opened from child": "SUCCEEDED",
  "nexus-kernel object stores enumerated from child": ["kv"]
}
```

## What this proves

From inside the Agent iframe, with **no bridge involved**, the frame could:

1. **Read** any host `localStorage` value (confirmed via a parent-only synthetic canary).
2. **Enumerate all 32** host localStorage keys — including `nx:crypto:keypair`, `nx:crypto:meta`.
3. **Read** the host's crypto key-material JSON strings directly.
4. **Enumerate and open** the host's real IndexedDB databases (`nexus-kernel`, `verse-studio`)
   and read their object-store list (`kv`).
5. **Write** into host `localStorage` (host read the injected value back).

There is no storage boundary between the Agent iframe and the host — they are literally the
same origin's storage. The window-identity bridge check (CARD-06) is irrelevant to this path:
this reaches storage directly via `window.parent`, never touching the bridge.

## Residual risk

**High, and now EXECUTED-confirmed (no longer UNKNOWN).** Any code that runs inside the Agent
iframe — including its unpinned CDN script (T-02, no SRI) or anything that reaches the iframe's
JS context — inherits full read/write over host notes storage and can read the host's crypto
key-material key values. T-01 is the enabling primitive under CARDs 09/06's "if the iframe is
compromised" caveats: this session shows that compromise yields total storage access.

## Non-claims (tattoo)

- This does not certify anything; `status_authority: NONE`. A FAIL here is honest progress.
- **NOT independent corroboration** — same Anthropic account/family as prior seats.
- This is not a crypto audit: whether the private portion of `nx:crypto:keypair` is plaintext
  vs wrapped is **T-07's deferred question**, not answered here. This card only proves the key
  *material string is fully readable from the iframe*, which is itself the T-01 finding.
- Probe ran against the **dev server**, not the built `dist/` output. Build-parity is CARD-12
  (Fable) and remains **UNKNOWN** — a stranger unpacks `dist`, not this dev server.
- Fix (removing `allow-same-origin`, cross-origin serve, or ODS-SEC-001/002 as re-runnable CI
  cases) is **out of scope** for this break session and was not attempted.

## VETO checklist bearing (Fable §4.5)

- Clears the "T-01 sits UNKNOWN forever" trap (rule R2 / VETO-10): T-01 is now EXECUTED-FAIL.
- G-01 remains **RED with no achievable green path** — this is a one-off manual/headless poke,
  not a re-runnable ODS-SEC-001/002 CI case. Per Fable §4.2, this poke does **not** satisfy G-01.
- Does not touch VETO-08 (no independence claimed).
