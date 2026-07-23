---
name: isomorphism-check
description: Fail closed when story, code, and verify disagree
version: 0.1.0
metadata:
  hermes:
    tags: [isomorphism, security, claims]
    category: full-spectrum-teacher
claims: [CLAIM-FS-004, CLAIM-SEM-003, CLAIM-MIT-004]
status_authority: NONE
---

# isomorphism-check

## When to use

Use before calling anything green, before epoch-0 NEX UI copy, before Mithub/portal claims, or after a break.

## Procedure

1. List claims or marketing sentences under review.
2. For each, find greppable code/config path (`rg` CLAIM-ID, SEC-ID, or mechanism).
3. Find verify path: test, receipt, break card, or explicit UNVERIFIED.
4. Fail if story exists without mechanism, or mechanism without verify/UNVERIFIED.
5. Fail if NEX balance UI lacks EPOCH-0 RESET / hard-reset language (when such UI exists).
6. Fail if Mithub/portal claims outrank git or LOOM records.
7. Emit a short table: claim | path | verify | pass/fail.

## Non-claims

- Pass is not certification.
- UNVERIFIED is honest; silent green is not.
