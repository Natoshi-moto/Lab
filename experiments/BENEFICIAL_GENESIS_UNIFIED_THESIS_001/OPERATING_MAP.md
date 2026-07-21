# Operating map — single queue

## Authority order (highest first)

1. **Executable tests / frozen counterexamples** (e.g. TRIB-F-001 supply break)
2. **Tribunal repair acceptance plan** (`BGEN-INTEGRATION-TRIBUNAL-001`)
3. **Mechanism necessity under specified product functions** (S1)
4. **External research** (Gemini, literature) — inputs only
5. **Opinion memos** (#47/#49) — design notes only
6. **Token / live-money narrative** — not authorized until S1 + later gates

## Sequence (frozen)

```text
R1  scheme-parameter validation + supply-invariant gate   ← NOW
    ↓ independent different-family retest of exact commit
R2/R3/R4  evidence hygiene (can parallel after R1)
    ↓
S1  product / ledger function specification               ← Gemini + thesis feed HERE
S2  transfer default = NONTRANSFERABLE_OR_DELAYED (until falsified)
S3–S5  issuance policy, identity stance, governance separation
S6  preregistered empirical design (only after S1)
    ↓ only if functions demand it
Optional later: staged convertibility / network unit research
    (Haven-class ambition — NOT a launch plan)
```

## Anti-drift freezes

| Freeze | Why |
|--------|-----|
| No merge of #40–#49 as “truth” | Evidence overlays, not promotion |
| No liquid speculative reward v1 | Tribunal + Gemini + dump base rates |
| No $100k field pilot this phase | Package still finishing R1; RESEARCH_ONLY |
| No mint/burn private stable sprint | Haven hard problem; out of R1 scope |
| No new broad audit | Tribunal closed that phase |
| No STATUS.json self-promotion | status_authority NONE |

## Track routing

| Input | Routes to |
|-------|-----------|
| Lottery over-issuance | **R1** (this branch) |
| Transfer necessity | **S1 → S2** |
| Donor motives / openness | **S6 design notes** (after S1) |
| MACI / Passport / biometrics | Optional **post-S1 modules** only if allocation privacy/Sybil is required |
| Carbon / DPI / OSS grants industries | **S1 adoption surfaces**, not immediate code |
| Haven-class money promise | **Delayed unit thesis** only after protocol adoption + function necessity |

## Definition of done for *this* push

- [x] R1 fail-closed gates land in econ redteam package
- [x] Regression test for negative `lottery_share_bps`
- [x] Unified thesis + S1 brief filed
- [ ] Draft PR open, unmerged
- [ ] Fresh different-family retest commissioned (follow-on task; not this commit)
