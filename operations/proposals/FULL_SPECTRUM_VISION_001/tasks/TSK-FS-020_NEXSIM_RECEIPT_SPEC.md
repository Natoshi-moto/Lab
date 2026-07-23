# TSK-FS-020 — Nex sim receipt schema

**status_authority:** NONE  
**Claims:** CLAIM-SIM-001, CLAIM-SIM-002, CLAIM-SIM-003  
**Done when:** schema file + one example receipt (synthetic ok)

## Deliverables

1. `schemas/nexsim-run-receipt.schema.json` (in this pack or lab schemas — prefer pack `schemas/` first)  
2. `examples/nexsim-run-receipt.example.json`  
3. Short README: how local runner should emit receipt; GitHub path convention  

## Required receipt fields (minimum)

```text
schema, sim_version_hash, seed, config_hash, output_hash,
started_at, finished_at, host_class (desktop|tails|other),
opt_in_data (bool), operator_note, status_authority: NONE
```

## Non-claims

- Spec ≠ shipping nexsim binary  
- Does not define REAL launch NEX  
