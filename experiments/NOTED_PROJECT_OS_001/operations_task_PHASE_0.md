# Task — PHASE_0 scaffold containment

**Task ID:** `TSK-NOTED-OS-PHASE-0`  
**Assignee default:** `SEAT-CODEX-IMPLEMENT`  
**Debugger:** `SEAT-CLAUDE-DEBUG`  
**Acceptance:** `SEAT-GROK-DRIVE` + human  

## Goal

Create Lab containment skeleton for Noted Project OS without importing unsorted bulk.

## Write scope

```text
products/
products/REGISTRY.json
products/REGISTRY.schema.json
products/noted-host/          # import Noted seed
products/nexus-blocks/
products/creature-engine/
drops/.gitkeep
experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py  # may already exist
operations/receipts/NOTED_PROJECT_OS_PHASE_0/
```

## Do not touch

- Doctrine papers rewrite  
- Live secrets  
- Wholesale `NEXUS_ORGANIZED` copy  
- Lab constitution  

## Done criteria

1. REGISTRY lists noted-host, nexus-blocks, creature-engine  
2. Each package has README + `real_world_value_forbidden: true`  
3. noted-host typecheck + build pass  
4. `python3 experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py` PASS  
5. Receipt filed  

## VERIFY

```bash
python3 experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py
cd products/noted-host && npm ci && npm run typecheck && npm run build
```
