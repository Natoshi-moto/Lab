# Draft PR body — FULL_SPECTRUM_VISION_001

**Do not merge without operator read.**  
`status_authority: NONE`

## Summary

- Adds `operations/proposals/FULL_SPECTRUM_VISION_001/`: genesis vision pack for Full Spectrum (doctrine, tech direction, roadmap, Nex sim/economy/Moots, Tails/CAGE research, FFD/LOOM/Mithub, website draft).
- Three-Go mined operator–Manager session with verbatim OP/MGR attribution.
- Machine-readable `PACK_INDEX.json`, `CLAIMS.json`, `HANDOFF_ANY_AI.md` so any seat can cold-start.
- Executable task stubs under `tasks/`; CI helper `tools/check_claim_ids.sh`.
- Pins development arc to Lab `baseline-001` / snapshot SHA in `GENESIS_TRACEABILITY.md`.

## Explicit non-claims

- Not token launch authorization; not investment advice.
- Not official Tails/Qubes/Ledger/Trezor/GitHub/Nous.
- Not quantum-proof.
- Does not clear Lab `NO_REAL_WORLD_TOKEN_OR_ECONOMIC_VALUE` red (TENSION-001).
- Multi-AI agreement ≠ independence.

## Test plan

- [ ] `bash operations/proposals/FULL_SPECTRUM_VISION_001/tools/check_claim_ids.sh` → PASS
- [ ] Operator skims `HANDOFF_ANY_AI.md` + `CLAIMS_REGISTER.md`
- [ ] Confirm no secrets in pack
- [ ] Decision: **park** / **merge as proposal only** / **commission task TSK-FS-***

## Claims introduced

See `CLAIMS.json` (CLAIM-FS-*, NEX-*, SIM-*, MOOT-*, HOST-*, SEM-*, METH-*, CAGE-*, GEN-*, MIT-*).
