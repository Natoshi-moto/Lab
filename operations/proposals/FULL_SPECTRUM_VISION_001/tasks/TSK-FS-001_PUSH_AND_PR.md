# TSK-FS-001 — Push branch and open draft PR

**status_authority:** NONE  
**Claims:** CLAIM-GEN-001, CLAIM-SIM-003  
**Requires:** operator GO (shared remote visible action)  
**Done when:** draft PR URL exists; CI note includes check script

## Steps

```bash
cd <lab-root>
git checkout grok/full-spectrum-vision-pack-001
bash operations/proposals/FULL_SPECTRUM_VISION_001/tools/check_claim_ids.sh
git push -u origin grok/full-spectrum-vision-pack-001
gh pr create --draft --title "docs: FULL_SPECTRUM_VISION_001 genesis vision pack" \
  --body-file operations/proposals/FULL_SPECTRUM_VISION_001/PR_BODY.md
```

## Non-claims

- Draft PR ≠ adoption of epoch-0 token economics  
- Does not implement Mithub product  

## Output

PR URL + SESSION_LOG entry.
