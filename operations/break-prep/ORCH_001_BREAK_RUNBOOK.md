# ORCH-001 — Break-prep runbook (synthetic only)

**Status:** `status_authority: NONE` / `RESEARCH_ONLY` / **synthetic data only**
**Date filed:** 2026-07-22
**Tracking:** https://github.com/Natoshi-moto/Lab/issues/63
**Grounded against:** `main` after PR #66 (T4 T-06 quarantine) merged — re-verify file paths and
line numbers before acting; code moves.

This is not a security audit, not a penetration test, not a certification, and not a claim that
any hole is closed. It is a checklist so a non-coder operator can poke Noted/Agent with fake data,
write down what actually happened, and hand the result to a human decision — nothing here promotes
itself to `ACTIVE` by existing.

Sister documents (do not repeat their content, only point at it):

- `WHY_NOT_TO_TRUST_THIS_PROJECT.md` — permanent distrust register
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md` — T-01…T-14
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/ODS_SECURITY_CASES.md` — spec-only probes
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/COLD_DROP_BAR.md` — cold-drop checklist
- `operations/proposals/NOTED_STOP_THE_LINE_001/HARD_GATES.md` — G-01…G-07 gate table

---

## 0. Evidence labels (mandatory for every result)

Every card result below must pick exactly **one** of these labels and cite the command, file:line,
or screenshot that backs it up. No result is recorded without a label.

| Label | Means |
|---|---|
| `EXECUTED` | You actually ran the probe (script, devtools console, manual click-through) and observed the outcome yourself, this session. |
| `SOURCE_TRACED` | You read the code and can point at the exact file:line that determines the behavior, but did not run it live this session. |
| `DECLARED_ONLY` | A doc, comment, or README claims this behavior/protection exists, but no code or test backs the claim up. |
| `PRESENT_UNREACHABLE` | The risky code/file exists in the tree but is not on any path a normal user or normal build can reach today. |
| `STUB_REFUSAL` | The feature is intentionally a stub that refuses/no-ops — confirmed by reading the stub, not by exploiting anything. |
| `CONTRADICTED` | The hypothesis (from a prior mining pass, a doc, or a prior claim) does not match what the code/behavior actually does. Say what it actually does instead. |
| `UNKNOWN` | You could not determine the answer this session. Say why (blocked, too risky, needs a build step you didn't run). Never leave this blank — write `UNKNOWN` explicitly rather than silence. |

`SOURCE_TRACED` is not weaker than `EXECUTED` by default — it just means "read, not run." Don't
upgrade a label to make a result sound stronger than what you actually did.

---

## 1. What BREAK means / does not mean

**BREAK means:** deliberately trying to make Noted/Agent misbehave using only fake, throwaway data,
on your own machine, so a real gap gets written down before a stranger finds it.

**BREAK does not mean:**

- a security certification, an audit, or a "passed" stamp
- anything to do with real money, real notes, or real identity
- attacking anyone else's computer, CDN, or service — everything here stays on your machine
- permission to merge anything — a card passing or failing changes nothing on `main` until a human
  says so
- "hacking" in the movie sense — most cards are reading code, running a script, or looking in your
  own browser's developer tools

If a card ever asks you to do something that reaches outside your own machine (attack a CDN,
probe someone else's server, use a real API key) — **stop and skip that card**. None of the cards
in this runbook are written to require that; if a future edit adds one, it's out of scope.

---

## 2. Safety DO NOTs

- **No real API keys, ever.** Every card that touches a provider key field uses a fake string like
  `sk-TEST-DO-NOT-USE-0000`. If a probe seems to need a working key to observe the behavior you
  want, skip it and mark `UNKNOWN` — don't substitute a real one.
- **Synthetic fixtures only.** No real notes, no real journal content, no real project data.
- **Back up before you start, even though there's no filesystem profile to copy.** Noted stores
  everything in the browser (`IndexedDB` under `nexus-kernel`, plus `localStorage` keys prefixed
  `verse-studio:` for the host and `nx:` for the Agent — see `NOOB_GUIDE.MD`, "Backups and
  diagnostics"). There is no `~/.config/noted-*` folder to snapshot. If you have real work loaded
  in the same browser profile, use the in-app **Export AI brief** / diagnostic export first, or
  better, run break sessions in a separate browser profile with nothing real in it.
- **Do not rename any `verse-studio:*` storage key.** `README.md` calls this out explicitly as
  intentional legacy naming — renaming breaks compatibility, it doesn't improve security.
- **Do not wire up any new effectful bridge channel during break week.** You are observing existing
  behavior, not building `agent.action.proposed` / `ui.patch.proposed` into something real (both are
  intentionally stub-only today — T-09).
- **T-06 residual note:** the deleted `nexus-agent-v0.12.html` bytes still exist in git history
  (old commits, old clones). That is not a launch path — nothing in the shipped app serves them —
  but it is not "gone" in the absolute sense either. Don't claim history was scrubbed; it wasn't,
  and this runbook doesn't ask you to try.

---

## 3. Prep checklist (operator + terminal)

Run these from the repo root unless a step says otherwise. Paste them one at a time; read the
output before moving to the next line.

```bash
git checkout main
git pull origin main
./nexus doctor
```

```bash
cd products/noted-host
npm ci
npm run t06:quarantine-check
```

Expect: `PASS T-06: nexus-agent-v0.12.html is absent from shipped files and references` and
`PASS T-06: live studio targets nexus-agent-v0.14-scrubbed.html`. If either line says `FAIL`,
**stop** — that means the T4 quarantine regressed, and no other card in this runbook should be run
until that's investigated separately.

If a card asks you to look at the running app (not just read source), start the dev server in the
same directory and leave it running in its own terminal tab:

```bash
npm run dev
```

This is Vite's dev server (from `products/noted-host/package.json`); it prints the local URL
(typically `http://localhost:5173`) — open that in your browser. `npm run preview` (after
`npm run build`) is the alternative if you specifically want to test the built output instead of
the dev server; most cards below don't need that distinction and say "dev server" generically.

Do not run `npm run build` or touch `dist/` unless a card explicitly says to — that's out of scope
for break-prep.

---

## 4. Attack cards

Each card is independent. Do them in any order, but see §5 for a recommended first session.

### CARD-01 · T-06 residual — launch-path recheck
- **Threat links:** T-06, G-04 (`HARD_GATES.md`)
- **Goal (layman):** confirm the old, leaky test-data Agent file is really gone from anything the
  app can serve, now that PR #66 merged.
- **Preconditions:** repo on `main`, `npm ci` done in `products/noted-host`.
- **Steps:**
  1. `cd products/noted-host && npm run t06:quarantine-check`
  2. Separately confirm by eye: `find products/noted-host/public -iname "*nexus-agent-v0.12*"`
     should print nothing.
- **Expected result TODAY:** `PASS` on both — the script and the manual `find` should agree the
  file is absent from the shipped public tree. This is the **launch-path** claim only.
- **Evidence to capture:** paste the full script output.
- **Label to apply:** `EXECUTED` (you ran it) for the launch-path claim. The git-history residual
  (old commits still contain the deleted bytes) is `SOURCE_TRACED` at best — `git log --all
  --diff-filter=D -- '**/nexus-agent-v0.12.html'` will show the deleting commit and its parent,
  which still has the file; don't try to purge it, just note it exists.
- **What would count as FIXED later:** N/A — launch-path removal is the intended final state, not
  a bug to re-fix. If this card ever comes back `FAIL`, that's a regression, file it like any other
  break-session FAIL (§6).
- **Stop conditions:** if this fails, stop the whole session and report it before running any other
  card — later cards assume the quarantine holds.

---

### CARD-02 · T-02 unpinned CDN scripts (read-only)
- **Threat links:** T-02, G-02
- **Goal (layman):** confirm the Agent's chat window still loads its styling/formatting code fresh
  from the public internet every time, with no tamper-check.
- **Preconditions:** none — this is a static file read, no dev server needed, no network request
  made by you.
- **Steps:**
  1. `grep -n 'cdn\.' products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html`
  2. Confirm none of the matching `<script src="...">` / `<link href="...">` tags carry an
     `integrity="..."` (SRI) attribute.
- **Expected result TODAY:** `cdn.tailwindcss.com` loads with no `integrity=` attribute (confirmed
  at `products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html:27`). This matches
  `THREAT_MODEL.md` T-02 and `ODS_SECURITY_CASES.md` ODS-SEC-003, both of which already record this
  as a known, disclosed gap (see `products/nexus-blocks/blocks/nexus-agent/README.md`) — this card
  is a recheck, not a discovery.
- **Evidence to capture:** the grep output; line number(s) found.
- **Label to apply:** `EXECUTED` (you ran the grep yourself). Do **not** attempt to contact or
  probe `cdn.tailwindcss.com` itself — that would be attacking a third party's infrastructure,
  which is forbidden. You are only reading the local HTML file.
- **What would count as FIXED later:** every external `<script>`/`<link>` either vendored locally
  under a Lab package, or carrying a verified `integrity=` hash plus a documented update process
  (per G-02's own GREEN condition) — not attempted in this runbook.
- **Stop conditions:** none — this card cannot cause harm.

---

### CARD-03 · T-03 default proxy / synthetic key only
- **Threat links:** T-03, G-03
- **Goal (layman):** confirm whether four specific AI providers still silently route your prompt
  and (fake) key through a free third-party proxy by default, with no click required.
- **Preconditions:** synthetic/fake key only; dev server optional.
- **Steps:**
  1. Static read (safe, no network): `grep -n "BROWSER_DIRECT\|DEFAULT_PROXY\|PROXY_REQUIRED"
     products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html`
  2. Confirm `BROWSER_DIRECT` lists only `anthropic, gemini, openrouter, ollama` and
     `PROXY_REQUIRED` lists `groq, openai, xai, deepseek` (currently at lines 2214 and 14540).
  3. **Optional, more hands-on:** open the dev server, open the Agent's provider settings, type
     `sk-TEST-DO-NOT-USE-0000` into one of the `PROXY_REQUIRED` providers (e.g. `groq`) with no
     custom proxy URL set, open your browser's Network tab, and send one chat message. Watch for
     an outbound request to `corsproxy.io` — it will fail (fake key), that's expected and fine;
     you're only checking *where* the request goes, not getting a real reply.
- **Expected result TODAY:** the fallback line `const proxy = NEXUS.state.settings.corsProxyUrl ||
  (needsProxy ? DEFAULT_PROXY : '')` (currently line 2253) means any `PROXY_REQUIRED` provider with
  no custom proxy set silently uses `https://corsproxy.io/?` — this matches `THREAT_MODEL.md` T-03
  and is expected to still be `FAIL` against the safe invariant (no silent default) in
  `ODS_SECURITY_CASES.md` ODS-SEC-004.
- **Evidence to capture:** grep output (step 1) is sufficient; Network-tab screenshot if you did
  step 3.
- **Label to apply:** `SOURCE_TRACED` if you only did step 1–2; `EXECUTED` if you did step 3 and
  observed the request in your own Network tab.
- **What would count as FIXED later:** default proxy removed, or a hard warning/opt-in gate before
  first use, per G-03's GREEN condition. Not attempted here.
- **Stop conditions:** if step 3, never enter anything but a fake key string; close the tab if you
  notice yourself about to paste a real one.

---

### CARD-04 · T-01 same-origin storage reach (hypothesis; careful)
- **Threat links:** T-01, G-01 — the highest-severity item on the spine
- **Goal (layman):** check whether the chat window, which runs at the *same address* as Noted
  itself, could reach Noted's saved notes directly, bypassing every visible safety check.
- **Preconditions:** dev server running; browser devtools comfort required — this is the most
  technical card in the set. If you're not comfortable with browser devtools, skip this one and
  mark it `UNKNOWN` for this session; it's not required for a first pass.
- **Steps:**
  1. Open the dev server, navigate to `#/nexus-agent`.
  2. Open browser devtools, find the Agent `<iframe>` (`data-test="nexus-agent-iframe"`) in the
     Elements/Inspector panel, and switch the devtools console context to that iframe's own frame
     (Chrome: the context dropdown at the top of the Console panel; Firefox: similar frame picker).
  3. From inside that frame's console, try: `window.parent.localStorage.getItem('verse-studio:theme')`
  4. Try: `window.parent.indexedDB.databases()` (or open a known store name if you can find one).
- **Expected result TODAY:** per `THREAT_MODEL.md` T-01 and `ODS_SECURITY_CASES.md` ODS-SEC-001/002
  (spec-only, not yet implemented as an automated case), the iframe's `sandbox` attribute includes
  `allow-same-origin` while being served from a same-origin relative path (confirmed at
  `products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx:125`: `sandbox="allow-scripts
  allow-forms allow-modals allow-popups allow-downloads allow-same-origin"`). The documented
  expectation is that step 3 and step 4 **succeed** (i.e., the frame can read parent storage),
  which is a `FAIL` against the safe invariant — but this runbook has not independently run steps
  3–4 live; treat the outcome as unconfirmed until you actually try it.
- **Evidence to capture:** exact console output (copy/paste text, or screenshot) for both step 3
  and step 4.
- **Label to apply:** `EXECUTED` if you ran steps 3–4 yourself and recorded the output;
  `SOURCE_TRACED` if you only confirmed the sandbox flag by reading the file and did not run the
  console commands.
- **What would count as FIXED later:** ODS-SEC-001/002 implemented as real, re-runnable Playwright
  cases (per `CHARTER.md` Wave A) showing the frame **cannot** reach parent storage — via removing
  `allow-same-origin`, serving the Agent from a genuinely different origin, or another design that
  makes the probe throw/return empty — followed by a receipt. None of that is done by this card.
- **Stop conditions:** if you're not sure which console context you're in, stop rather than risk
  running a command against the wrong (parent) frame by mistake — that would just read your own
  Noted data pointlessly, not harmful, but not the test either.

---

### CARD-05 · Bridge gap — wildcard `postMessage` target
- **Threat links:** bridge-gap (signal B); adjacent to T-01
- **Goal (layman):** check whether the host sends its reply messages to "anyone listening" instead
  of specifically the Agent window.
- **Preconditions:** none for the static read; dev server + devtools for the live check.
- **Steps:**
  1. `grep -n "postMessage(" products/noted-host/src/bridges/nexusHostBridge.ts
     products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx`
  2. Confirm the target-origin argument is the literal string `'*'` in both call sites.
- **Expected result TODAY:** confirmed — `nexusHostBridge.ts:144` (`postReceiptToNexus`) and
  `NexusAgentStudio.tsx:72` (the manual approve-import receipt) both call `targetWindow.postMessage(
  ..., '*')` / `iframeRef.current?.contentWindow?.postMessage(..., '*')`. This is a real,
  static-code-confirmed gap.
- **Evidence to capture:** grep output with line numbers.
- **Label to apply:** `SOURCE_TRACED`. To upgrade to `EXECUTED`, add a temporary
  `console.log(event.origin)` breakpoint in the iframe's own script context (same technique as
  CARD-04 step 2) while the host posts a receipt, and confirm the message arrives regardless of
  the iframe's actual origin — do not modify and commit any temporary debug code.
- **What would count as FIXED later:** `postMessage` target replaced with the iframe's actual
  expected origin string (not `'*'`), re-verified via `npm run bridge:smoke`.
- **Stop conditions:** none — read-only.

---

### CARD-06 · Bridge gap — window-identity check vs. "no origin check" claim
- **Threat links:** bridge-gap (signal B) — testing whether a prior mining pass's phrasing holds up
- **Goal (layman):** a prior review said the bridge does "no origin check" on incoming messages.
  Check whether that's literally true.
- **Preconditions:** none — static read.
- **Steps:**
  1. Read `products/noted-host/src/bridges/nexusHostBridge.ts` lines 174–178 and
     `products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx` line 33.
  2. Note what each actually checks before accepting a message.
- **Expected result TODAY:** **`CONTRADICTED`, precisely stated.** Neither file checks
  `event.origin` (a string) — but both check `event.source === <the iframe's own contentWindow
  object>`, which is a window-identity comparison, not nothing. A script running in some other tab
  or a different iframe cannot forge that equality; only the genuine Agent iframe's own window can
  pass it. The real residual risk is **not** "no check at all" — it's that this check provides zero
  protection if the Agent iframe's own content is compromised (T-01), because in that case the
  message really does come from that window. File this as: the bridge-gap hypothesis as originally
  phrased is `CONTRADICTED`; the underlying concern is real but belongs to T-01, not to a missing
  bridge check.
- **Evidence to capture:** the two file:line citations above, quoted verbatim.
- **Label to apply:** `CONTRADICTED` (for the literal "no origin check" phrasing) with a
  cross-reference note to T-01/CARD-04 (for the real residual risk).
- **What would count as FIXED later:** N/A for this card specifically — it's a phrasing correction,
  not a bug. The real fix path is CARD-04's.
- **Stop conditions:** none.

---

### CARD-07 · Bridge gap — null-target race on `getTargetWindow()`
- **Threat links:** bridge-gap (signal B)
- **Goal (layman):** a prior review flagged a possible race where, if the bridge doesn't know the
  Agent window yet, a forged message might sneak through as if it were trusted.
- **Preconditions:** none — static read; dynamic reload test is optional and harder.
- **Steps:**
  1. Read `products/noted-host/src/bridges/nexusHostBridge.ts` line 176:
     `const fromTarget = targetWindow !== null && event.source === targetWindow`.
  2. Trace what happens when `targetWindow` is `null` (e.g., before the iframe has mounted).
- **Expected result TODAY:** when `targetWindow` is `null`, `fromTarget` evaluates to `false`, which
  routes the message into the **untrusted** branch (lines 178–219) — it gets either silently
  ignored (non-bridge-shaped noise) or explicitly rejected with an `UNTRUSTED_SOURCE` receipt
  (bridge-shaped impersonation). It does **not** get treated as trusted-by-default. As stated, this
  hypothesis is `CONTRADICTED` by the current code.
- **Evidence to capture:** the file:line citation and the two-branch trace above.
- **Label to apply:** `CONTRADICTED` for the static-read claim. Leave a residual `UNKNOWN` for the
  *dynamic* case — e.g., whether a rapid iframe reload/remount could produce a moment where a stale
  `targetWindow` reference is treated as valid when it shouldn't be. This runbook does not attempt
  that timing test; flag it as a follow-up if someone wants to build a reload-race probe later.
- **What would count as FIXED later:** N/A unless the dynamic follow-up above ever turns up a real
  race — not confirmed here.
- **Stop conditions:** none.

---

### CARD-08 · Bridge gap — no replay detection / no payload size limit
- **Threat links:** bridge-gap (signal B)
- **Goal (layman):** check whether the bridge would notice or care if the exact same message were
  sent twice, or if it were made enormous.
- **Preconditions:** dev server running for the live replay check; static read needs nothing.
- **Steps:**
  1. Read `products/noted-host/src/bridges/nexusBridgeTypes.ts`'s `isNexusHostBridgeMessage` (full
     function) and `products/noted-host/src/bridges/nexusHostBridge.ts`'s `handleNexusEnvelopeStub`.
     Look for any tracking of previously-seen envelope `id`s, or any length/size check on
     `payload`.
  2. **Optional live check:** from the Agent iframe's own console context (see CARD-04 step 2),
     construct and `window.parent.postMessage(...)` a `diagnostic.ping`-channel envelope twice with
     the *same* `id`, and watch the host bridge's `accepted` counter (visible in its UI state) to
     see if it increments twice for what should be one logical event. `diagnostic.ping` is
     deliberately the safest channel to use here — its handler explicitly does nothing but reply
     ("No mutation performed" — see `nexusHostBridge.ts:118-125`).
- **Expected result TODAY:** no `id`-dedup set or replay guard exists anywhere in
  `isNexusHostBridgeMessage` or `handleNexusEnvelopeStub` — every structurally valid envelope is
  processed independently. No length/size cap exists on `envelope.payload` either — the type
  guard only checks that required string/array/boolean fields are present and non-empty, never
  their size. This matches the signal-B hypothesis.
- **Evidence to capture:** the two file citations; live-check counter values before/after if you
  ran step 2.
- **Label to apply:** `SOURCE_TRACED` for the static claim; `EXECUTED` if you completed step 2 and
  recorded the counter behavior.
- **What would count as FIXED later:** an `id`-seen set (bounded, with eviction) rejecting repeats,
  and an explicit payload size ceiling, both re-verified via `npm run bridge:smoke` plus a new case.
- **Stop conditions:** only ever use the `diagnostic.ping` channel for this live check — it is the
  one channel documented to perform no mutation. Do not attempt replay against `noted.write` or any
  approval-gated channel.

---

### CARD-09 · Bridge gap — forgeable plain receipts
- **Threat links:** bridge-gap (signal B); adjacent to T-01
- **Goal (layman):** check whether a "receipt" (the host's proof that it processed something) could
  be faked by anything that can run code inside the Agent window.
- **Preconditions:** none — static read.
- **Steps:**
  1. Read the `ActionReceipt` type in `products/noted-host/src/bridges/nexusBridgeTypes.ts` and
     `makeReceipt` in `nexusHostBridge.ts` (lines 49–70).
  2. Look for any signature, HMAC, nonce, or other unforgeable marker on the receipt object.
- **Expected result TODAY:** `ActionReceipt` is a plain JSON-shaped object (`id`, `ok`, `actor`,
  `capability`, `summary`, `createdAt`, etc.) with no signature or cryptographic marker of any kind.
  Anything that can execute inside the trusted iframe's window (i.e., anything that has already won
  T-01) can construct an identical-looking receipt and post it anywhere it likes — the receipt's
  authenticity today rests entirely on *who sent the message* (the window-identity check from
  CARD-06), not on the receipt's own contents. This matches the signal-B hypothesis.
- **Evidence to capture:** the two file citations.
- **Label to apply:** `SOURCE_TRACED`.
- **What would count as FIXED later:** this is arguably not worth fixing in isolation — it's a
  restatement of T-01's blast radius, not an independent hole. Note that cross-reference rather
  than treating it as its own repair target.
- **Stop conditions:** none.

---

### CARD-10 · T-04 diagnostic export surprise check
- **Threat links:** T-04, G-05
- **Goal (layman):** check what the one-click "send us a diagnostic bundle" export actually
  contains today, since it's meant for bug reports but has no filter on what it scoops up.
- **Preconditions:** dev server running; synthetic data in the workspace is fine (this card is
  about what the export *contains*, not about protecting real data).
- **Steps:**
  1. Open the dev server, navigate to the Diagnostics studio, trigger the validation
     bundle/diagnostic export (see `src/diagnosticExporter.ts` for the function name
     `exportValidationBundle` if you want to confirm which UI button calls it).
  2. Open the downloaded JSON and list every key under `payload.localstorage`.
  3. Confirm every key starts with `verse-studio:` and none of them look like a secret (theme,
     last-doc, panel-collapsed are the documented examples).
- **Expected result TODAY:** per `COLD_DROP_BAR.md`, this should currently be clean — the exporter
  scopes strictly to the `verse-studio:` prefix (`diagnosticExporter.ts:163`,
  `.startsWith('verse-studio:')`) and today's actual keys are UI-state only. **Important scoping
  note:** this host-side exporter has no visibility into the Agent iframe's own storage at all —
  the Agent keeps its own data under a separate `IndexedDB` database (`nexus-kernel`) and
  `localStorage` prefix (`nx:`), including its own `crypto:escrow` / `crypto:salt` keys, which the
  Agent's own internal export path (a different code path, inside the HTML file, with its own
  `STRIP_FROM_EXPORT` list) is responsible for — not this file. Don't conflate the two exporters.
  The real gap (per T-04) is that host's `verse-studio:` filter has **no allowlist** — a future
  feature could add a sensitive key under that prefix and nothing would catch it, because
  `exportValidationBundle` is frozen and can't be quietly patched (ODS-SEC-005 spec exists but
  isn't implemented).
- **Evidence to capture:** the list of keys you saw in the exported JSON.
- **Label to apply:** `EXECUTED` for what today's export actually contains; `SOURCE_TRACED` for the
  "no allowlist exists" gap (confirmed by reading the exporter, not by waiting for a real drift to
  happen).
- **What would count as FIXED later:** an UNFREEZE-gated allowlist added to `exportValidationBundle`
  per ODS-SEC-005, so a new unexpected key fails loud instead of exporting silently.
- **Stop conditions:** none — this is a local file you generate and read yourself.

---

### CARD-11 · Open question — where would a provider key live (synthetic only)
- **Threat links:** signal-B open question; adjacent to T-07 (not a crypto audit — see
  `THREAT_MODEL.md` T-07, explicitly deferred to Wave D, "not independently verified")
- **Goal (layman):** without doing any real cryptography review, just observe *where* a saved
  provider key physically lands in browser storage, so "wallet local-only?" stops being a guess.
- **Preconditions:** synthetic/fake key only, dev server running.
- **Steps:**
  1. Open the Agent, go to provider settings, save `sk-TEST-DO-NOT-USE-0000` against any provider.
  2. Open devtools → Application/Storage tab. Look under IndexedDB for a database named
     `nexus-kernel` (confirmed at `nexus-agent-v0.14-scrubbed.html:1230`), and under localStorage
     for keys prefixed `nx:` (confirmed at line 1233).
  3. Look specifically for `crypto:salt` and `crypto:escrow` entries (the encrypted-key machinery,
     per T-07) and confirm the provider key value itself is not sitting anywhere as a readable
     plaintext string next to a provider name.
- **Expected result TODAY:** the key should land inside the encrypted storage path (`crypto:*`
  entries), not as a bare plaintext value — but this runbook has not independently verified the
  encryption's strength (that's T-07's separate, deferred crypto sub-review). This card only
  answers "does it look encrypted at rest," not "is the encryption actually sound."
  `STRIP_FROM_EXPORT` (inside the Agent's own export path, line ~2361) already lists
  `crypto:keypair, crypto:escrow, crypto:salt, crypto:verifier, crypto:meta` as excluded from that
  export — consistent with treating them as sensitive.
- **Evidence to capture:** screenshot of the IndexedDB/localStorage inspector showing the key
  names you found (not the values, if you're worried about screenshotting ciphertext — it's fake
  data either way, so it doesn't matter here, but keep the habit for real sessions).
- **Label to apply:** `SOURCE_TRACED` for the "storage location" claim if you only read the code;
  `EXECUTED` if you actually saved a synthetic key and inspected storage yourself.
- **What would count as FIXED later:** N/A — this card is observational, not a bug hunt. If you spot
  the fake key sitting anywhere as obvious plaintext, that would be a real `FAIL` worth its own
  break-session report (§6) and a much bigger deal than anything else in this runbook.
- **Stop conditions:** if step 3 turns up the key in plaintext, stop, capture the evidence, and file
  it immediately as a FAIL — don't keep exploring further into that storage out of curiosity.

---

## 5. Priority order for first BREAK session

Cheapest, safest, most-`EXECUTED`-friendly first. Max 5 cards for session 1:

1. **CARD-01** — T-06 residual recheck (one script, must pass before anything else matters)
2. **CARD-02** — T-02 unpinned CDN (grep only, zero risk)
3. **CARD-03** — T-03 default proxy (grep first; devtools step optional)
4. **CARD-05** — bridge wildcard target (grep only)
5. **CARD-10** — T-04 diagnostic export (one export button, one file read)

Save CARD-04 (same-origin storage reach), CARD-06/07/08/09 (deeper bridge internals), and CARD-11
(key-storage inspection) for session 2 once you're comfortable with devtools from session 1.

---

## 6. How to file a FAIL

For any card result — pass, fail, or unknown — create a receipt-style note under:

```
operations/receipts/BREAK_SESSION_YYYYMMDD/CARD-NN.md
```

(use the actual date, e.g. `BREAK_SESSION_20260722/CARD-01.md`). Template:

```markdown
# CARD-NN result — BREAK_SESSION_YYYYMMDD

- Card: CARD-NN · <title>
- Threat links: <T-xx / bridge-gap-x>
- Date/time run:
- Result: PASS / FAIL / UNKNOWN
- Evidence label: EXECUTED / SOURCE_TRACED / DECLARED_ONLY / PRESENT_UNREACHABLE / STUB_REFUSAL / CONTRADICTED / UNKNOWN
- Evidence: <command output, file:line, or screenshot path>
- Non-claims: this result does not certify security; status_authority NONE
```

Don't merge, delete, or "clean up" anything based on a FAIL — a filed FAIL is the deliverable. What
happens next (whether it becomes a bounded fix task) is a human/Grok-drive decision, not something
this runbook authorizes.

---

## 7. Explicit non-claims + ACTIVE:FORBIDDEN pattern

- Passing a card is not a security promotion. A `PASS` here means "this specific probe, run this
  specific way, produced this specific result today" — nothing more.
- The app reporting its own safety (a green `npm run t06:quarantine-check`, a clean diagnostic
  export, a code comment saying something is safe) is **weak evidence**, not proof — it's the
  system grading its own homework. Borrowed from the NWC candidate's own stage discipline: a
  self-receipt can be protocol-valid but semantically weak, and status-only promotion (declaring
  something safe without a probe that could have failed) is treated as a negative control, not
  progress.
- **A status recommendation, `ACTIVE`, and a `VETO` are three different things.** Any seat — Claude,
  Codex, Grok — can *recommend* a status. Only the operator can move something to `ACTIVE`. Nothing
  in this runbook, and no card result it produces, sets anything to `ACTIVE` by itself.
- This runbook does not claim any T-ID from `THREAT_MODEL.md` is closed. Closing a T-ID requires the
  full evidence bar from `CHARTER.md`: probe → fix → same probe green → receipt, with operator (or
  Grok-drive-with-operator) sign-off — not a code read, and not this document existing.

---

## 8. Out of scope for this runbook

- NWC (`NWC_FORMALIZED_CANDIDATE_v0.2`) build gates, promotion, or file import — not referenced
  further than the pattern borrowed in §7; the zip is not part of this repo and was not opened for
  this task.
- GITBRAID, BGEN money/economy stories, Phase 3 broker features — none of these are touched,
  implemented, or evaluated here.
- Any actual bridge fix, T-01 code patch, CDN vendoring, Snooper UI, or the parallel
  `NOTED_ADVERSARY_BLOCK_001` proposal (PR #61, still open, awaiting its own design review) — this
  runbook is the break-prep checklist only; implementing any repair belongs to a separate, bounded
  task with its own receipt.

---

*End of ORCH_001_BREAK_RUNBOOK.*
