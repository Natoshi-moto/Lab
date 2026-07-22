# Mutual distrust — host ↔ Nexus doctrine

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`  
**Date:** 2026-07-22  
**Binds T-IDs:** primarily T-01, T-02, T-03, T-08, T-14; informs Snooper scope

---

## Problem with the old story

Informal product language drifts toward:

> “Local-first Noted + sandboxed Agent + bridge approvals = private notes.”

Actual ship state (assault-grounded, re-verify before acting):

| Story fragment | Reality |
|----------------|---------|
| Sandboxed Agent | iframe has `allow-same-origin` **and** same-origin document → co-tenant of parent storage (**T-01**) |
| We ship what we audit | Unpinned CDN scripts/styles inside Agent (**T-02**) |
| Keys stay on your machine | Four providers default through public CORS proxy if unset (**T-03**) |
| Approvals protect writes | Mostly per-feature; pending import can clobber (**T-08 / T-14**) |
| Snooper will show leaks | Membrane Snooper sees **bridge only** — not T-01/T-02/T-03 |

The bridge is a **polite door**. Co-tenancy is a **missing wall**.

---

## Correct mental model (three layers)

```text
[ Browser ]     ← real landlord: origins, sandbox flags, network, CSP
      │
[ Noted host ]  ← high-value: notes, projects, IDB, diagnostics
      │  only walkie-talkie if isolation is real
[ Nexus Agent ] ← high-power: scripts, providers, prompts, future actions
```

### Doctrine statements

1. **The browser is the only real cop.** App code must not disable the cop (e.g. by restoring same-origin to an untrusted frame).
2. **Host does not trust Agent.** Compromised CDN, malicious prompt path, buggy Agent build, or hostile future channel must not equal full note access without an explicit, fail-closed path.
3. **Agent may distrust host embedding.** Research-valid: refuse to arm / refuse network / fail closed if embed flags are unsafe (optional H3 hardening; not required for v1 measurement).
4. **Network and CDN are third adversaries.** Vendor + SRI; no silent public proxy.
5. **Observation ≠ isolation.** Snooper is a multimeter on the bridge, not a house camera.

---

## What “Nexus hardens security” may mean (allowed)

| Allowed meaning | Example |
|-----------------|---------|
| Hardens **this app session** | Drop co-tenant storage; pin scripts; kill default proxy |
| Hardens **honesty** | Loud disclosure; ODS-SEC red tests; cold-drop bar |
| Hardens **process** | Stop-the-line tax; waivers only when red is red |
| **Self-assault** | Controlled probes that attack the *embed* to prove FAIL/PASS |

## What it must not mean (forbidden slogans)

| Forbidden | Why |
|-----------|-----|
| “Nexus makes the browser more secure” | Wrong power level; other tabs/sites/extensions untouched |
| “Agent cannot read host notes” while T-01 open | False today |
| “Keys never leave your machine” while T-03 default proxy open | False for four providers |
| “Snooper shows all exfil” | False by design (membrane v1) |
| “Multi-model review certified us” | Multi-AI ≠ independence; status_authority NONE |

---

## Primary war (for planning)

**Primary duty:** protect host high-value data from Agent path and from Agent-loaded code.

**Secondary research duty:** treat unsafe host embedding as an attack surface the Agent may detect and refuse.

**Not a duty of this programme:** general-purpose browser hardening, EDR, or OS security.

This matches stop-the-line **G-01 / G-02 / G-03** as the productivity choke, not Phase 3 chrome.

---

## Tension map binding

From `../NOTED_SOVEREIGNTY_ASSAULT_001/TENSION_MAP.md`:

| Option | Mutual-distrust fit |
|--------|---------------------|
| **A** — status quo + loud disclosure | Honesty only; co-tenancy remains; weak sovereignty claim |
| **B** — vendor CDN + kill default proxy | Removes two external adversaries (T-02/T-03 partial) |
| **C** — drop `allow-same-origin` / split trust | Structural win on T-01; Agent storage redesign required |
| **B-then-C** | Recommended **when** fix PRs start (measurement first) |
| **DEFER** | Measurement harnesses only — correct until operator picks A/B/C |

---

## Snooper warning law (unchanged; do not soften)

Opt-in; multi-warning; constant ON reminder; 3× distinct **DEFINITELY STOP WARNING**; daily force remind; redacted export default; **must disclose** non-coverage of T-01/T-02/T-03.

Building Snooper before Wave A measurement is optional theater. Spec remains law when scheduled.

---

*End mutual distrust doctrine.*
