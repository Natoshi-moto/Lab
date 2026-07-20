# BENEFICIAL_GENESIS_RETEST_002

Fresh independent Grok clean-room retest of Codex repair PR #30 at

```text
46a7de63fd800029a05793d7d8204a900690f68e
```

**Authority:** `PROPOSE_ONLY / FRESH_INDEPENDENT_RETEST / STATUS_AUTHORITY_NONE`

Does not merge, promote, assign R-rounds, or modify subject branches.

## Layout

| Path | Role |
|------|------|
| `CLEANROOM_INTERPRETATION.md` | Pre-freeze reconstruction notes |
| `src/` | Dependency-free Node.js verifier |
| `tests/` | Core + hostile probes |
| `verify.mjs` | Fixture compatibility gate |
| `public_test_seeds.json` | Post-freeze public test seeds (if present) |
| `results/` | Freeze marker, matrix, probes |

## Commands

```bash
node --test experiments/BENEFICIAL_GENESIS_RETEST_002/tests/*.test.mjs
node experiments/BENEFICIAL_GENESIS_RETEST_002/verify.mjs
```
