# Threat/asset spine — Noted Project OS

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22
**Grounded against:** `main` @ `products/noted-host/`, `products/nexus-blocks/blocks/nexus-agent/` (verified files exist and match cited line content at time of writing; re-verify before acting — code moves)

Every T-ID below was checked against real files, not proposed from memory or generic OWASP habit. Where a claim is unverified, it says so. T-IDs are stable references — do not renumber; append new ones at the end.

---

**T-01 — Same-origin Agent iframe bypasses the postMessage bridge entirely**
- Surface: bridge / IDB / Agent — `src/studios/nexusAgent/NexusAgentStudio.tsx`
- Actor: compromised or malicious Agent iframe content; does not need to touch postMessage at all
- Impact (layman): the chat window embedded inside Noted could, if ever compromised, quietly read or rewrite every note/poem/project without going through any of the visible message-passing safety checks — because it runs at the same address as Noted itself.
- Impact (technical): `sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"` on an iframe served from a same-origin relative path (`./nexus/nexus-agent-v0.14-scrubbed.html`) restores the frame's true origin, granting `window.parent.indexedDB` / `window.parent.localStorage` access directly — independent of `src/bridges/nexusHostBridge.ts`'s origin/shape validation, which only guards the postMessage channel.
- Severity: **H**
- v1 assault scope: **yes**

**T-02 — Unpinned third-party CDN scripts inside the Agent iframe**
- Surface: CDN / Agent
- Actor: compromised CDN, or CDN-side supply-chain compromise
- Impact (layman): code that runs inside the Agent window is fetched fresh from public internet services every load, not shipped with Noted; if one of those services is ever compromised, that code runs with the same access as the Agent — directly amplifying T-01.
- Impact (technical): `cdn.tailwindcss.com`, `cdnjs.cloudflare.com` (marked, highlight.js, katex) loaded with no `integrity=` SRI hash, no vendoring, no CSP `script-src` restriction. `products/noted-host/NEXUS_AGENT_MERGE_NOTES.md` already lists "replace external CDN links with bundled local dependencies" as a known future item — this is a confirmed, self-acknowledged gap, not news.
- Severity: **H**
- v1 assault scope: **yes**

**T-03 — Public CORS proxy is a silent default, not opt-in, for four of eight providers**
- Surface: Agent / provider keys
- Actor: corsproxy.io operator, or anyone who can MITM/compromise that third-party service
- Impact (layman): for OpenAI, Groq, xAI, and DeepSeek, prompt text and the API key are routed through a free third-party proxy the moment you use one of those providers with no proxy configured of your own — not because you clicked "enable proxy," but because that's the automatic fallback.
- Impact (technical): `BROWSER_DIRECT = {anthropic, gemini, openrouter, ollama}` vs `PROXY_REQUIRED = [groq, openai, xai, deepseek]`. `const proxy = NEXUS.state.settings.corsProxyUrl || (needsProxy ? DEFAULT_PROXY : '')` — if `corsProxyUrl` is unset, `DEFAULT_PROXY` (`https://corsproxy.io/?`) is used automatically. A power-user "Kernel Inspector" panel does surface a warn-colored row for proxy-required routes, but there is no warning at the moment a key is entered.
- Severity: **H** (for the four affected providers)
- v1 assault scope: **yes**

**T-04 — Diagnostic export dumps all `verse-studio:`-prefixed localStorage, unredacted, unallowlisted**
- Surface: export / IDB
- Actor: anyone who receives, uploads, or screen-shares a diagnostic export file
- Impact (layman): the one-click diagnostic export meant for bug reports includes every saved preference in full, with no filter to catch a future feature that accidentally stores something sensitive under that prefix.
- Impact (technical): `src/diagnosticExporter.ts`'s `exportValidationBundle` loops `localStorage` keyed only on `.startsWith('verse-studio:')` — no allowlist, no value redaction. Keys observed today are UI-state only (theme, last-doc, panel-collapsed), not secrets. **This file is FROZEN** (Sweep 51, requires explicit UNFREEZE per its own header comment) — cannot be quietly patched.
- Severity: **M today / H on drift**
- v1 assault scope: **yes** — test today's export for surprises, then codify as a regression gate (see `ODS_SECURITY_CASES.md` ODS-SEC-005)

**T-05 — Diagnostic bundle ships a device fingerprint unconditionally**
- Surface: export
- Actor: recipient of an export, if ever aggregated across users
- Impact (layman): every export includes a fairly specific device fingerprint (user agent, screen, timezone, core count). Fine for one bug report; starts to look like tracking if collected centrally.
- Impact (technical): the `environment` block in `ValidationBundle` — no consent gate, no in-export label explaining what it is.
- Severity: **L/M**
- v1 assault scope: **maybe** (copy/consent fix, not urgent)

**T-06 — Stale unscrubbed Agent build (launch path closed; history residual remains)**
- Surface: Agent / git / cold-drop
- Actor: anyone who digs **git history** or an old clone that still has deleted paths
- Impact (layman): An older, non-scrubbed Agent used to sit in the shipped tree with synthetic embedded test data. **Launch path (2026-07-22):** after PR #66 quarantine + BREAK session 1 CARD-01, those files are **gone** from `products/noted-host/public/`, and they are **not** referenced in `block-registry.json` or `Nexus_OS.html`. Live studio serves `nexus-agent-v0.14-scrubbed.html` only. **This is not “history scrubbed.”** Old commits can still contain the deleted bytes.
- Impact (technical): **Was (pre-#66):** two committed copies under `public/nexus/` (+ OS blocks path), `legacyPath` / OS launcher refs, embedded tier1 blob. **Is (post-#66, re-verified Phase B de-stale):** no `*v0.12*` under `public/`; no registry/OS string refs; `npm run t06:quarantine-check` is the manual launch-path recheck (not yet wired into CI — see Fable G-08 / CARD-19). Residual risk = **git history + stale clones**, not the current gift bag.
- Severity: **M** on launch path (closed for current tree); **H residual** only if someone serves history blobs or old checkouts as if current
- v1 assault scope: **yes** — regression watch via CARD-01 / ODS-SEC-006; do not re-open as “still in public/” without re-verify
- **Doc note (2026-07-22):** earlier text claiming “two copies still committed / still cross-referenced” is **STALE** after #66; corrected here (Whoopsie WHOOP-20260722-02)

**T-07 — Escrow-based password recovery for encrypted provider keys, unverified**
- Surface: Agent / crypto
- Actor: anyone attempting to weaken or bypass the recovery path
- Impact (layman): provider API keys are encrypted at rest, but there's also a password-recovery mechanism. If that recovery path is weak, the encryption promise is weaker than it looks.
- Impact (technical): `NEXUS.storage` wraps AES-256-GCM; `crypto:escrow` / `crypto:salt` are read unencrypted pre-activation, then a recovery key decrypts the escrow to recover the master key. Strength depends on recovery-key entropy and salt handling — **not independently verified**, read from source only.
- Severity: **M (unverified)**
- v1 assault scope: **maybe** — better as its own dedicated crypto sub-review (Wave D) than folded into membrane-v1

**T-08 — Capability/approval policy is declarative metadata, not centrally enforced**
- Surface: bridge / architecture
- Actor: a future channel implementer who forgets to wire the gate correctly
- Impact (layman): the rule "some Agent actions always need your approval" is currently just a label in a config file — each new feature has to build the actual approval popup itself, the way prompt-import did.
- Impact (technical): `src/bridges/nexusBridgeRegistry.ts`'s `NEXUS_CAPABILITIES` carries `defaultApproval` as data; the only real enforcement point for `noted.write` today is the hand-written `pending`/button gate in `NexusAgentStudio.tsx`. Nothing generic checks that a new effectful channel actually honors `defaultApproval`.
- Severity: **M**
- v1 assault scope: **yes** — design/regression check ahead of Phase 3's action broker

**T-09 — `agent.action.proposed` / `ui.patch.proposed` are stub-only today (future blast radius)**
- Surface: bridge / future
- Actor: N/A yet — placeholder for Phase 3/4
- Impact: not exploitable yet. Flagged so this spine gets re-checked the moment these channels go from stub to effectful, since T-08's gap applies directly to them.
- Severity: **TBD**
- v1 assault scope: **no** (not built) — must stay on the spine as an auto-recheck trigger when Phase 3/4 land

**T-10 — Private-repo privacy design vs. observed public repo**
- Surface: git
- Actor: N/A — structural, not adversarial
- Impact (layman): some of this project's privacy rules assume nobody outside the team can see the repo. That's no longer true — it's public — and nobody has yet decided what changes as a result.
- Impact (technical): `constitution/PRIVACY.md` / `NEXUS.json` encode a private-repo threat model; Lab `CLAUDE.md` flags this mismatch as `HUMAN_DECISION_REQUIRED`, unresolved as of this writing.
- Severity: **H** (structural — blocks any clean "private by design" claim until resolved)
- v1 assault scope: **no** — explicitly reserved for the operator, not an assault target

**T-11 — Frozen historical material must not be mutated or reinterpreted**
- Surface: git / process
- Actor: assault tooling itself, or an overeager agent
- Impact: this is a boundary the assault must respect, not something to attack — `corpus/raw/**`, receipts, tags stay untouched no matter what a "test" seems to call for.
- Severity: **M** (process integrity)
- v1 assault scope: **no** — a guardrail for `CHARTER.md`, not a target

**T-12 — ODS diagnostic pack export: no network egress observed (positive control)**
- Surface: ODS pack
- Actor: N/A
- Impact: checked `src/studios/diagnostics/odsCases.ts` and `DiagnosticsStudio.tsx` for `fetch`/upload calls — none found. Export appears local-file-only today. Recorded as a baseline so a future change adding any network call to ODS gets compared against this.
- Severity: **—** (control confirmed, not a finding)
- v1 assault scope: **yes** (regression watch only, see ODS-SEC pattern)

**T-13 — Electron shell: unconditional `shell.openExternal` on any `window.open`, no scheme allowlist**
- Surface: Electron shell — `products/noted-host/electron/main.cjs`
- Actor: the Agent iframe, or any embedded/note content, calling `window.open(...)` with an attacker-chosen URL
- Impact (layman): if this desktop-app shell is actually in use, a link or script inside the Agent window could ask the operating system to open something like a local file or an installed program's custom link handler, and the app would forward that request without checking what kind of link it is first.
- Impact (technical): `win.webContents.setWindowOpenHandler(({url}) => { shell.openExternal(url); return {action:'deny'} })` applies to all `window.open` calls in the WebContents, including from iframes, with no scheme/host validation before calling `shell.openExternal`. **Mitigating context:** the shell itself is otherwise well-built — `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, and a minimal preload exposing only `toggleMaximize`. **Open question, not a claim:** `electron` is not listed in `products/noted-host/package.json` dependencies at all — unclear from the repo alone whether this shell currently ships or is dormant scaffolding.
- Severity: **M** (conditional on shipping status — needs a build-orchestrator answer)
- v1 assault scope: **maybe**

**T-14 — Prompt-import approval UI silently drops a pending request if a second one arrives first**
- Surface: bridge / UX-trust
- Actor: a fast or repeated sender on `prompt.snapshot.import.requested` (malicious or just buggy)
- Impact (layman): if the Agent sends a second "please import this" request before you've responded to the first, the first one disappears from view with no trace — nothing gets imported without a click, but you'd never know a request went missing.
- Impact (technical): `NexusAgentStudio.tsx` holds exactly one `pending` React state value; a second inbound envelope on the watched channel overwrites it before the first is acted on. Not an approval bypass (nothing imports without an explicit click) but an audit/trust gap — worth its own line rather than folding into T-08.
- Severity: **L/M**
- v1 assault scope: **yes** (see ODS-SEC-007)

---

## Coverage note for Snooper design

T-01/T-02/T-03 all happen **outside** the postMessage channel (direct same-origin storage access, script execution, and outbound network calls respectively). A membrane-only Power Snooper (`SNOOPER_IA.md`) that watches only bridge traffic will not see any of them. That gap must be stated in the Snooper's own UI copy, not just in this document.
