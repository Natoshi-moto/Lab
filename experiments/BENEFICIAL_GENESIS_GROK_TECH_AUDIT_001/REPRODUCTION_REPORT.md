# Reproduction report — BGEN-GROK-TECH-AUDIT-001

**Evidence class:** reproduced executable result (commands below) + repository observation.

**Subject:** `8349de7a5978be6a9984aa33fd59ba3725ebaaca`  
**Clean worktree:** `/tmp/bgen-grok-tech-clean-*` detached at subject commit  
**Runtime:** Linux fedora, Python 3.14.6, Node v24.14.0, git, gh  

## Prerequisites determined from repository evidence

| Surface | Documented prerequisites | Observed |
|---------|--------------------------|----------|
| Design pack | Python 3 stdlib; `unittest`; no third-party Python deps | Sufficient |
| Claude economics | Python 3 stdlib | Sufficient |
| Breaker economics | Python 3 stdlib | Sufficient |
| Differential retest (Node) | Node.js; no npm packages in RETEST_002 | Sufficient |
| Full lab tests / `./nexus verify` | Node verifiers import `@noble/ed25519` (R013/R015/R016) | **Missing** — package not installed; R016 README documents only Python evidence gate, not `npm install` |

**Missing prerequisite documentation (lab-level, not BGEN package code):** how to install `@noble/ed25519` for independent Node verifiers used by R013/R015/R016 and by `./nexus verify` / full `tests/`.

## Command matrix

| Command | Environment | Exit | Result |
|---------|-------------|------|--------|
| `git rev-parse HEAD` | workspace | 0 | `8349de7a5978be6a9984aa33fd59ba3725ebaaca` |
| `git branch --show-current` | workspace | 0 | `grok/bgen-technical-audit-001` |
| `git status --short` (binding) | workspace | 0 | empty |
| `python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_DESIGN_001/tests -v` | clean worktree | 0 | **37 tests OK** |
| `python3 experiments/BENEFICIAL_GENESIS_DESIGN_001/verify_evidence.py` | clean worktree | 0 | **PASS** (`executable_invalid_cases=34`, `documentary_only_cases=1`, `residual_risks=8`) |
| `python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests -v` | clean worktree | 0 | **72 tests OK** |
| `python3 experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/simulate.py` | clean worktree | 0 | **27 scenarios**; tracked results unchanged |
| `python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/tests -v` | clean worktree | 0 | **25 tests OK** |
| `python3 experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/simulate.py` | clean worktree | 0 | **28 scenarios OK** |
| `node --test experiments/BENEFICIAL_GENESIS_RETEST_002/tests/*.test.mjs` | clean worktree | 0 | **19 tests pass** |
| `node experiments/BENEFICIAL_GENESIS_RETEST_002/verify.mjs` | clean worktree | 0 | `{"agreements":43,"disagreements":0,"crashes":0}` |
| `python3 -m unittest discover -s tests -v` | workspace | 1 | **FAILED** 9 failures + 2 errors — all R013/R015/R016 Node/`@noble/ed25519` |
| `./nexus doctor` | workspace | 0 | **PASS** (WARN `WORKTREE_DIRTY` after audit writes) |
| `./nexus verify` | workspace | 2 | **FAIL** — Independent R013 verifier missing `@noble/ed25519` |
| `git diff --check` | workspace | 0 | clean |

Captured logs: `results/*.out`.

## Environmental vs product failures

| Failure | Classification | Notes |
|---------|----------------|-------|
| Missing `@noble/ed25519` for R013/R015/R016 Node verifiers | **Environmental / lab prerequisite** | Not a Beneficial Genesis design/economics package defect. Blocks full-suite and `./nexus verify` on this host without npm install. |
| Design / economics / breaker / retest_002 suites | **Product path** | All passed. |
| Design README fixture counts (29/6) | **Documentation product defect** | Executable gate uses 34/1; see FINDINGS F-001. |

## Subject path integrity after simulators

After design tests, economics simulate, breaker simulate, and retest verify:

- `git status --short` under subject packages in clean worktree: **empty**
- Tracked-file aggregates unchanged (see `results/SUBJECT_INTEGRITY_POST.json`)
- Untracked `__pycache__` may appear; not part of git subject

## Independent probes

```bash
python3 experiments/BENEFICIAL_GENESIS_GROK_TECH_AUDIT_001/probes/run_probes.py
# Results: probes/PROBE_RESULTS.json
```

Outcome counts (final run): **26 PASS**, **10 OBSERVED**, **1 FAIL** (documentation catalog drift F-001).

## Non-claims

- Passing BGEN unit tests does not prove production Bitcoin script, real PQ, or economic gate pass.
- Full lab suite failure does not falsify BGEN package executability under documented Python/Node-stdlib paths.
- `ECONOMIC_GATE_PASS: false` and `CONTINUE_WITH_CONDITIONS` remain the preserved mechanism disposition from the frozen economics record.
