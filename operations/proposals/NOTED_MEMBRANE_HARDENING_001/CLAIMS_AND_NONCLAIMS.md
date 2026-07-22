# Claims and non-claims — membrane language lockdown

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`  
**Date:** 2026-07-22  
**Sister:** `../NOTED_STOP_THE_LINE_001/LIES_BY_OMISSION.md`  
**Gate:** G-07

---

## Permanent non-claims (never expire)

These stay true even if every ODS-SEC case turns green:

1. Research software; `status_authority: NONE`.  
2. Not a bank, wallet, custody product, or investment vehicle.  
3. No endorsement of real-world economic value (Checkpoint 001).  
4. Multi-AI agreement is not independent audit.  
5. Anonymous non-coder operator cannot personally certify cryptography or browser security.  
6. `WHY_NOT_TO_TRUST_THIS_PROJECT.md` remains linked; not deleted for launch comfort.  
7. Nexus does **not** make “the browser” generally more secure.

---

## Conditional claims (only after evidence)

| Claim you want to make | Minimum bar |
|------------------------|-------------|
| “Agent cannot read host notes via co-tenant storage” | ODS-SEC-001 + 002 PASS on shipped build (G-01) |
| “Agent runtime scripts are pinned/vendored” | ODS-SEC-003 PASS (G-02) |
| “No silent third-party proxy for provider keys/prompts” | ODS-SEC-004 PASS (G-03) |
| “We scrubbed legacy Agent from the drop” | ODS-SEC-006 PASS (G-04) |
| “Diagnostic export is allowlisted” | ODS-SEC-005 PASS (G-05) |
| “Snooper shows bridge traffic” | Snooper shipped **and** in-product gap text for T-01/T-02/T-03 |
| “Cold drop is shame-free” | COLD_DROP_BAR all-pass or explicit residual list |

Until bar met: use **residual risk language**, not absolutes.

---

## Preferred residual phrases (while RED)

Use language like:

- “Research host; Agent embed currently co-tenant of host storage unless isolation probes pass.”  
- “Some providers may route through a third-party proxy unless you configure otherwise — check settings before pasting keys.”  
- “Third-party scripts may load into the Agent UI unless vendored/SRI.”  
- “Passing ODS P0 does not mean security review complete.”  
- “Snooper watches the bridge only; it does not see direct storage, CDN, or provider network paths.”

---

## Overclaim hall of shame (reject in review)

- “Local-first and fully private.”  
- “Sandboxed, so notes are safe from the Agent.”  
- “Keys never leave your device.”  
- “Security hardened / production ready / audited.”  
- “Snooper proves no exfiltration.”  
- “Nexus hardens your browser.”  

Claude review should flag any of the above in this packet or in suggested UI copy.

---

*End claims and non-claims.*
