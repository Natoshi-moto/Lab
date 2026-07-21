# Seat packet — CODEX IMPLEMENTER

**Seat ID:** `SEAT-CODEX-IMPLEMENT`  
**Programme:** `NOTED_PROJECT_OS_001`  
**Job:** Build the system. Do not redesign doctrine. Do not expand scope past the active phase.

---

## Mandatory reading (in order)

1. `../README.md`  
2. **`../CANONICAL_DIRECTION.md`** — system first; sim-frame next stage; do not treat embed as Phase exit  
3. **`../DIAGNOSTIC_SUITE.md`** — load-bearing Operator Diagnostic Suite; implement ODS-0 with/after Phase 1  
4. `../CONTAINMENT.md`  
5. `../TECH_SPEC.md` §0–6, §8, §11  
6. `../LAUNCH_PLAN.md` §2–3  
7. Lab `AGENTS.md`  
8. Active phase task under `operations/tasks/` (when filed)  

---

## Standing orders

```text
CONTEXT: Lab main + products REGISTRY + active PHASE-N
SCOPE:   only paths listed in the active task
VERIFY:  commands listed in TECH_SPEC for that phase
BASELINE: git rev-parse HEAD before edits
```

1. Implement **one phase** at a time (TECH_SPEC §6).  
2. Prefer promoting existing stubs (Noted bridges) over inventing parallel systems.  
3. Every new directory under `products/` requires REGISTRY update **in the same commit**.  
4. Never commit secrets, nsec, API keys, or personal chat dumps.  
5. Scrub Agent HTML before adding to drop path.  
6. Creature public naming only — no Pokémon in user-visible strings you own.  
7. `status_authority: NONE` on all receipts you write.  
8. Real-world value surfaces are out of scope forever for this programme.  

---

## Phase 0 checklist (start here if nothing scaffolded)

- [ ] Create `products/REGISTRY.json` + schema  
- [ ] Create `products/noted-host` from Noted router-merge seed  
- [ ] Create `products/nexus-blocks` and `products/creature-engine` skeletons  
- [ ] Implement `experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py`  
- [ ] `npm ci && npm run typecheck && npm run build` in noted-host  
- [ ] Receipt: `operations/receipts/NOTED_PROJECT_OS_PHASE_0/RECEIPT.json`  

### VERIFY Phase 0

```bash
python3 experiments/NOTED_PROJECT_OS_001/tools/verify_registry.py
cd products/noted-host && npm ci && npm run typecheck && npm run build
# Lab still healthy:
./nexus doctor || true
```

---

## Phase 1+ 

Follow TECH_SPEC §6 exactly. Update BUILD progress in receipt `notes[]`.

When blocked, write `UNABLE_TO_VERIFY` or `BLOCKED` with reason; hand to `SEAT-CLAUDE-DEBUG` with failing command transcript.

---

## Output contract

Return:

1. Diff summary (paths)  
2. VERIFY command transcripts (pass/fail)  
3. Receipt JSON  
4. `NEXT:` Claude debug | Grok drive | next phase  

Do **not** open PR language that claims production readiness or economic launch.
