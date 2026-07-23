---
name: mithub-pr-dual-write
description: Require code and semantic claims/anchors in the same PR
version: 0.1.0
metadata:
  hermes:
    tags: [mithub, dual-write, grep, pr]
    category: full-spectrum-teacher
claims: [CLAIM-MIT-001, CLAIM-MIT-002, CLAIM-MIT-003, CLAIM-MIT-004, CLAIM-MIT-005]
status_authority: NONE
---

# mithub-pr-dual-write

## When to use

Before opening or approving a Full Spectrum load-bearing PR; when teaching Mithub inbreeding rules.

## Procedure

1. Read `MITHUB.md` inbreeding rules R1–R6.
2. List files changed (bytes).
3. List CLAIM-IDs and SEC-IDs touched.
4. Ensure shared greppable strings exist on both sides when load-bearing.
5. Run:

```bash
bash operations/proposals/FULL_SPECTRUM_VISION_001/tools/check_claim_ids.sh
```

6. Paste dual-write checklist from `tasks/PR_CHECKLIST_DUAL_WRITE.md` into PR body.
7. Reject one-sided meaning-only or code-only changes on ring-0/1 without explicit waiver note.

## Non-claims

- Checklist pass is not merge authority.
- Mithub UI is a route; git + LOOM records outrank it.
