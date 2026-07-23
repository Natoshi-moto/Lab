# Genesis traceability

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE`  
**Cites:** CLAIM-GEN-001, CLAIM-GEN-002, OP-14  
**Draft tip:** `origin/main` @ `2a3c0685c2b6146a769e6eef089fb6514d8cd20d`  

---

## Why this file exists

**OP-14:** set everything up meticulously on record so the **whole development track and arc** is traceable back to the **genesis snapshot of the lab**.

---

## Genesis coordinates (Lab R001)

| Field | Value |
|-------|--------|
| Tag | `baseline-001` |
| Commit | `7a8068fc6088b81cc9a7c94b49dc77e0abe592d8` |
| Snapshot | `snapshots/canonical/NEXUS_LAB_R001_BASELINE_001.zip` |
| Snapshot SHA-256 | `33d3fb549d49e1ad02ac2b2880b5ab4336a6dc29a7142d3e33e4ec2694ad8603` |
| Payload manifest SHA-256 | `34e4337b94685c725e316db95b1c8caa3aac4e6cf1595a6bb8005728f16bfb24` |
| Class | `CANONICAL_AS_IS` — bytes frozen, not blessed as final product truth |

These values are taken from Lab `STATUS.json` `canonical_target` at pack draft time. Re-verify on promotion.

---

## Vision record coordinates

| Field | Value |
|-------|--------|
| Pack path | `operations/proposals/FULL_SPECTRUM_VISION_001/` |
| Branch (authoring) | `grok/full-spectrum-vision-pack-001` |
| Protocol | Three-Go mine (prepare → recheck → mine+write) |
| Manifest | `VISION_THREAD_MANIFEST.md` |
| Claims | `CLAIMS_REGISTER.md` |
| Raw chat hash | `EXPORT_PENDING` |

---

## How future work must cite

Every material Full Spectrum implementation PR should include in description or receipt:

```text
genesis: baseline-001 @ 7a8068fc6088b81cc9a7c94b49dc77e0abe592d8
vision:  operations/proposals/FULL_SPECTRUM_VISION_001/ (CLAIM-IDs: …)
loom:    record-hash or EXPORT_PENDING ref
```

Implementation without claim IDs is a **route without authority** — do not treat it as promoted doctrine.

---

## Chain of custody (target)

```text
baseline-001 freeze
    → Lab public history (R0xx, Noted, breaks, session-close, …)
    → this vision pack (CLAIM-* + OP/MGR cites)
    → LOOM records of subsequent sessions
    → implementation commits + receipts
    → REAL launch RESET event (future)
    → free Full Spectrum open package (future)
```

---

## Non-claims

- Traceability is not correctness.  
- Citing genesis does not inherit security certification.  
- This pack is not yet merged to `main` at write time.
