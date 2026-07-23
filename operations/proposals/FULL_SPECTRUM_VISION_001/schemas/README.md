# Schemas — Full Spectrum vision pack

**status_authority:** NONE

## nexsim-run-receipt

- Schema: `nexsim-run-receipt.schema.json`  
- Example: `../examples/nexsim-run-receipt.example.json`  
- Task: TSK-FS-020  

### Local runner convention (proposed)

1. After a sim finishes, write a receipt JSON validating against the schema.  
2. `sim_version_hash` = hash of the sim binary or package tree used.  
3. `output_hash` = hash of primary result artifact.  
4. Commit or attach under GitHub path recorded in `github_path`.  
5. Epoch-0 NEX pay (if any) must cite receipt hashes — never vibes.

### GitHub path suggestion

```text
operations/receipts/NEXSIM_RUNS/<UTC-date>/<run-id>/receipt.json
```

Until that tree exists, examples live in this pack only.
