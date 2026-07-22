# Hard gates — stop the line

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`  
**Default state of all gates until evidence or waiver:** **RED**

Gates are **binary** for planning. “Mostly fine” is RED.

Closing a gate requires the assault **evidence bar**  
(probe → fix → same probe green → receipt) **or** a signed waiver in `WAIVER_PROTOCOL.md`.

T-IDs refer to `../NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md`.

---

## G-01 — Agent is not co-tenant of host secrets (T-01)

| Field | Rule |
|-------|------|
| **RED while** | Agent iframe retains `allow-same-origin` **and** is served same-origin such that parent `localStorage` / `indexedDB` are reachable from the frame (assault ODS-SEC-001/002 FAIL) |
| **GREEN only if** | ODS-SEC-001 and ODS-SEC-002 PASS on the shipped build **or** product permanently removes Agent-from-host embedding **or** waiver W-G01 |
| **Blocks** | Any claim “Agent cannot read host notes”; cold-drop “safe for private journals” marketing; Phase 3 channels that trust iframe honesty |

**Savage restatement:** Until G-01 is green, the chat widget is a raccoon with a key to the kitchen. Building more cabinets is not security.

---

## G-02 — No unpinned brain surgery from the public internet (T-02)

| Field | Rule |
|-------|------|
| **RED while** | Agent HTML loads remote scripts/styles without SRI **and** without full local vendor (ODS-SEC-003 FAIL) |
| **GREEN only if** | All runtime JS/CSS for Agent are vendored under Lab packages **or** every remote tag has `integrity=` + documented update process **or** waiver W-G02 |
| **Blocks** | Cold-drop “airgap-ish” story; “we ship what we audit” language |

**Savage restatement:** You do not get to call it a research membrane while Tailwind’s CDN can rewrite the membrane on a Tuesday.

---

## G-03 — No silent key+prompt exfil via default proxy (T-03)

| Field | Rule |
|-------|------|
| **RED while** | Any provider path uses `corsproxy.io` (or successor) **without explicit user enablement that turn** (ODS-SEC-004 FAIL) |
| **GREEN only if** | Default proxy removed; proxy-required providers hard-fail with UI that names the risk **or** user must toggle “I accept third-party proxy” before first call **or** waiver W-G03 |
| **Blocks** | “Keys stay on your machine” without asterisk; any demo that uses OpenAI/Groq/xAI/DeepSeek as if direct |

**Savage restatement:** Auto-proxy is not a convenience. It is a **default subpoena** to a free middleman.

---

## G-04 — No zombie Agent in the gift bag (T-06)

| Field | Rule |
|-------|------|
| **RED while** | `nexus-agent-v0.12.html` (either path) remains shipped/referenced for launch (ODS-SEC-006 FAIL) |
| **GREEN only if** | Files removed or moved to explicitly non-shipped archive path; registry + Nexus_OS launch entries gone; scrubbed path is sole entry; **and** a re-runnable check exists (prefer CI — see Fable meta G-08) **or** waiver W-G04 with “known dirty legacy” label on drop |
| **Blocks** | Cold drop W1; any “we scrubbed the Agent” absolute claim |
| **Launch-path note (2026-07-22)** | Tree/refs match the removal bar after PR #66 + CARD-01 PASS. **Do not** treat G-04 as fully GREEN for marketing while the only recheck is a **manual** `t06:quarantine-check` outside CI (homework can rot). |

**Savage restatement:** Leaving v0.12 in the tree is leaving a blood trail that says you only cleaned the room the guests were told to look at. Removing it once without a scheduled recheck is cleaning the room and throwing away the lock.

---

## G-05 — Diagnostics are not a secret sewer (T-04, T-05)

| Field | Rule |
|-------|------|
| **RED while** | `exportValidationBundle` dumps unallowlisted `verse-studio:*` and unconditional device fingerprint without consent label |
| **GREEN only if** | Allowlist + redaction policy shipped (UNFREEZE process honored) **or** export path removed from stranger builds **or** waiver W-G05 |
| **Blocks** | “Send us a diagnostic pack” as default support path without warning |

---

## G-06 — Approval is a door, not a sticker (T-08, T-14; T-09 watch)

| Field | Rule |
|-------|------|
| **RED while** | Effectful capabilities rely on per-feature UI only; double-submit drops pending import with no trace |
| **GREEN only if** | Central enforce or Phase 3 broker design that fails closed; pending queue not single-slot silent clobber — probes green **or** waiver W-G06 |
| **Blocks** | Phase 3 “action broker” as anything but **stub labeled dangerous** |

---

## G-07 — Language lockdown (LIES_BY_OMISSION)

| Field | Rule |
|-------|------|
| **RED while** | README / UI / drop root assert local-first or privacy absolutes without T-01–T-03 asterisks |
| **GREEN only if** | Copy audit pass recorded in a receipt listing every surface updated **or** waiver W-G07 (“we accept lying by omission until date X”) |

---

## Merge / planning matrix (proposed policy)

| Want to do | Minimum gates GREEN or waived |
|------------|-------------------------------|
| Merge more Agent features | G-01, G-02, G-03 |
| Announce cold drop | G-01, G-02, G-03, G-04, G-05, G-07 |
| Start Phase 3 broker as real (not stub) | G-01, G-06 |
| Claim “sovereignty assault complete” | All G-01…G-07 + assault W3/W5 or explicit residual register |

**Default if operator is silent:** treat matrix as **in force for Grok-drive recommendations**. Implementation still needs explicit go — but **no drive chat may recommend Phase 3 feature work as “natural next” without pasting this matrix.**
