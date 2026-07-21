# Nexus Blocks

**Status:** Phase 0 scaffold  
**Parent programme:** `NOTED_PROJECT_OS_001`  
**Status authority:** `NONE`  
**Real-world value forbidden:** `true`

This registered package will contain the Nexus OS, Agent, prompt-studio, and
bridge blocks embedded by Noted. Phase 0 intentionally contains no runtime
blocks; later phases must add them through explicit tasks and receipts.

Lab is the corpus authority. This package does not claim production readiness
and must not expose money, token, custody, redemption, or investment features.

## Verify

```bash
python3 experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py
```

## Landmines

- Do not add personal exports, secrets, or unsanitized Agent HTML.
- Do not bypass the host action broker for effectful operations.
- Do not add a nested Git repository without a full pinned commit in REGISTRY.
