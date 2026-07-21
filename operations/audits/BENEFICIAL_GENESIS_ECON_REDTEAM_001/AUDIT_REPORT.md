# Audit report — TSK-BGEN-ECON-REDTEAM-001

## Authority

`status_authority: NONE`
Does not promote, merge, assign R-rounds, alter `STATUS.json`, authorize live funds, select real charities, or make legal conclusions.

## Subject binding

| Item | Value |
|---|---|
| Repository | Natoshi-moto/Lab |
| Parent program issue | #33 (`BENEFICIAL-GENESIS-PROGRAM-001`) |
| This task's issue | #34 (`BGEN-ECON-REDTEAM-001`) |
| Merged Beneficial Genesis research base (exact subject) | `22ce8c11297ad4c08606277ee83dc845797ba220` |
| Branch | `claude/bgen-econ-redteam-001` |
| Staleness check | branch tip equals `origin/main` tip at time of this report; `git merge-base main HEAD` confirms the branch sits exactly on the merged base cited in issue #34 |

## Seat identity

| Field | Value |
|---|---|
| Seat | Economics Designer / Red-Team |
| Role scope | issue #34 only — locked scope per issue: Bitcoin-only Beneficial Genesis v1, synthetic agents and scenarios only, no market-price prediction, no live charity addresses/donors/funds/solicitation, no legal advice, no cryptographic verifier changes |

## Method

1. Read issue #33 (program roadmap) and issue #34 (this task's exact requirements) in full before writing any code.
2. Read the existing Beneficial Genesis design pack (`experiments/BENEFICIAL_GENESIS_DESIGN_001`) and its threat model to ground the economic model in the subject's *own* stated allocation rule (`floor(pool * eligible_i / total_eligible)`) rather than inventing a different mechanism to critique.
3. Built a deterministic, stdlib-only Python simulator (`experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/`) implementing: the required allocation alternatives, concentration/welfare metrics, and adversarial probes (Sybil identity-split, rebate/circularity, stolen-key laundering, denominator shock, governance capture, charity-selection breakdown).
4. Authored 26 scenario manifests covering every required adversarial scenario from issue #34 (whale shares 50/80/99%, exchange-omnibus vs. 10,000 small donors, identity splitting under three allocation rules, rebate sweep 0-100%, secret rebate, denominator surge, stolen-key donation, compromise-cutoff race, token value below/equal/above breakeven, governance proportional vs. capped, non-transferability at 0/3/12 months, single vs. multiple charity destinations, undersubscribed and oversubscribed pools).
5. Ran the simulator, wrote a 26-test `unittest` suite asserting both general invariants (allocation never exceeds pool, every scenario is bit-reproducible from its seed) and the specific direction of each adversarial finding, then re-ran the full existing lab test suite to confirm no interference.
6. Wrote `MECHANISM_NECESSITY.md`, `FORMAL_MODEL.md`, `ALTERNATIVES_COMPARISON.md`, `FAILURE_CONDITIONS.md`, and `NONCLAIMS_AND_OPEN_QUESTIONS.md` under the experiment directory, each citing concrete figures pulled from `results/*.json` rather than asserted from memory.

## What was tested (evidence, not narrative)

See `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/README.md` "Headline findings" for the summary and the linked documents for full detail. In brief, executable evidence supports:

- the fixed pool issues in full regardless of subscription level (sale-like behaviour, independent of transferability);
- every allocation rule that meaningfully reduces whale concentration for honest single identities is severely Sybil-split-exploitable in a permissionless, identity-free design; linear pro-rata is split-invariant but does not reduce whale concentration;
- rebate/circularity attacks are unconditionally profitable, exactly equal to the rebate amount, and cryptographically undetectable;
- stolen-key donations fully launder at zero attacker cost;
- proportional governance lets a single honest whale cross simple majority by size alone; an independent cap prevents this at allocation time only (continuous post-genesis enforcement is unverified and out of this seat's scope).

## Failure-condition disposition

See `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/FAILURE_CONDITIONS.md` for the full per-condition evidence. Summary:

| Failure condition | Status |
|---|---|
| FC-1 transferable token has no necessary function beyond rewarding donation | **TRIGGERED** |
| FC-2 rational donor behavior predictably destroys charity net benefit through rebates | **TRIGGERED** |
| FC-3 one actor can obtain practical governance control by donation alone | **TRIGGERED** (mitigable only with an out-of-scope continuous-enforcement guarantee) |
| FC-4 mechanism materially incentivizes stolen/tainted-fund laundering | **TRIGGERED** |
| FC-5 timing/cutoff games produce non-deterministic or privileged allocation | Partially triggered; real but bounded, separately addressable |
| FC-6 social benefit dominated by a simpler non-token mechanism | **TRIGGERED** |

Four of six conditions trigger without a defensible mitigation identified in this analysis; a fifth is mitigable only conditionally.

## Commands and results

| Command | Result |
|---|---|
| `python3 experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/simulate.py` | 26 scenarios executed; `results/*.json` + `results/TABLES.md` written |
| `python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests -v` | 26 tests OK |
| `python3 -m unittest discover -s tests -v` | 185 tests OK (existing lab suite; unaffected) |
| `./nexus doctor` | PASS (`WORKTREE_DIRTY` warning while uncommitted, expected) |
| `git status --short` (pre-commit) | only paths under the three authorized directories |

`./nexus verify` and `./nexus audit-check` were not run as part of this task: `./nexus verify` is scoped to the R-round custody/exchange kernels and this task explicitly does not assign an R-round; `audit-check --audit-id` targets the R001/R002 blind-audit ledgers, which this task does not touch and must not reopen. Re-running them was judged out of scope rather than silently skipped.

## Independence qualification

This is a single-seat (Economics Designer/Red-Team) result. No second-family Breaker review has occurred for this package, and issue #34 requires one "before any gate pass." Because the recommendation below is `REJECT_OR_REDESIGN`, not a gate pass, this condition is disclosed rather than blocking, but the recommendation should be treated as provisional pending independent review.

## Gate recommendation

```text
REJECT_OR_REDESIGN
```

The transferable, fixed-pool allocation token as specified in the merged Beneficial Genesis research base should not proceed past the economic-necessity gate as currently designed. This is not a claim that Beneficial Genesis as a charitable migration *concept* is unsound — `MECHANISM_NECESSITY.md` §5 and `ALTERNATIVES_COMPARISON.md` §5 identify specific, less complex redesign directions (a non-transferable or delayed-transfer claim right, governance decoupled from and independently/continuously capped relative to economic allocation, sealed/precommitted donation amounts) that address most of the triggered conditions without abandoning the migration-coordination function. Evaluating any such redesign is future work for a subsequent, separately authorized task, not something this seat is authorized to bless.

## Non-claims

No merge authority, no R-round assignment, no status promotion, no market-price prediction, no live funds or real charity claims, no legal conclusions, no claim of cross-family independent review, no claim that this analysis exhaustively enumerates every possible strategic behavior against the mechanism.
