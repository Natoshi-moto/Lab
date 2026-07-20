# BENEFICIAL_GENESIS_REPRODUCER_001

Independent clean-room **Node.js** verifier and breaker suite for Designer PR #27
(`TSK-BENEFICIAL-GENESIS-BREAKER-REPRO-001` / issue #28).

**Authority:** none. Does not modify Designer files or lab status.

## Layout

| Path | Role |
|------|------|
| `src/` | Dependency-free verifier modules |
| `tests/` | `node:test` suite (core + hostile) |
| `hostile_fixtures/` | Minimized counterexamples |
| `results/` | Compatibility report, freeze marker, differentials |
| `CLEANROOM_INTERPRETATION.md` | Encoding interpretation & session metadata |
| `verify.mjs` | Fixture compatibility runner |

## Commands

```bash
node --test experiments/BENEFICIAL_GENESIS_REPRODUCER_001/tests/*.test.mjs
node experiments/BENEFICIAL_GENESIS_REPRODUCER_001/verify.mjs
```

## Non-claims

Same synthetic non-claims as the Designer pack: no backing, legal ownership,
quantum safety, mainnet authorization, or consensus security.
