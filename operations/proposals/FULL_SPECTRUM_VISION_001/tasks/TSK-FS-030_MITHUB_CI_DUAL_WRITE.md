# TSK-FS-030 — Mithub dual-write CI experiment

**status_authority:** NONE  
**Claims:** CLAIM-MIT-001…005, CLAIM-SEM-003  
**Done when:** documented how to run `check_claim_ids.sh` in CI; optional workflow file **only on this branch** if operator allows

## Goal

Piggyback GitHub Actions (or local pre-commit) so semantic IDs cannot drift silently from the register.

## Steps

1. Ensure `tools/check_claim_ids.sh` is executable and PASS.  
2. Propose (do not force-merge) `.github/workflows/full-spectrum-claims.yml` that runs the script on pack path changes.  
3. Document dual-write PR checklist in `MITHUB.md` or `tasks/PR_CHECKLIST_DUAL_WRITE.md`.  

## Non-claims

- Not a live Mithub product  
- Not replacing git  
