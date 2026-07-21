# Nexus Blocks

**Status:** Phase 2 build
**Parent programme:** `NOTED_PROJECT_OS_001`  
**Status authority:** `NONE`  
**Real-world value forbidden:** `true`

This registered package contains the canonical scrubbed Nexus Agent v0.14 block
source under `blocks/nexus-agent/`. Noted serves a byte-identical HTML mirror
from `products/noted-host/public/nexus/` because Vite cannot serve assets outside
the host package root. The block README records scrub decisions, network limits,
and mirror paths.

Lab is the corpus authority. This package does not claim production readiness
and must not expose money, token, custody, redemption, or investment features.

## Verify

```bash
python3 experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py
cd products/noted-host && npm run agent:prompt-smoke
```

## Landmines

- Do not add personal exports, secrets, or unsanitized Agent HTML.
- Do not bypass the host action broker for effectful operations.
- Do not add a nested Git repository without a full pinned commit in REGISTRY.
