# Non-claims and open questions — BGEN-ECON-REDTEAM-001

## Non-claims

This package (`experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`, `operations/audits/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`, `operations/receipts/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`) does **not** establish:

- any real-world market price, adoption level, donation volume, or charity behavior — every "value," "multiplier," "discount," or "utility" figure is a declared modelling assumption applied to synthetic populations, never an empirical estimate or forecast;
- that modelled attacker strategies are empirically observed — they are worst-case rational-actor constructions used to test whether a mitigation exists in principle, not evidence that any real actor has attempted or will attempt them;
- a change to, or independent verification of, the Beneficial Genesis cryptographic verifier (`experiments/BENEFICIAL_GENESIS_DESIGN_001/protocol/**`) — this package's simulator is entirely separate code and touches no verifier path;
- legal conclusions of any kind — "legal/economic issue surfaces" identified here (e.g. the sale-like fixed-pool-regardless-of-demand behaviour in `MECHANISM_NECESSITY.md` §2, or the rebate/circularity findings) are flagged for qualified counsel review per Track F of issue #33, not adjudicated;
- authorization for live funds, real charity selection, public solicitation, token issuance, or any R-round assignment;
- status promotion, merge authority, or any change to `STATUS.json`;
- independence from a second-family Breaker review — none has occurred yet for this package (see "Second-family review" below);
- completeness of the adversarial scenario list — the required scenarios in issue #34 were each addressed by at least one manifest, but the space of possible strategic behavior is not exhaustively enumerable, and combinations of probes (e.g. a whale who is *also* Sybil-splitting *and* rebate-colluding *and* racing a compromise cutoff) were not jointly simulated;
- bit-identical reproducibility across all Python builds for the `CONCAVE_LOG` scheme specifically, since it uses `math.log1p` (IEEE-754 float); every other scheme and every metric use exact integer or `fractions.Fraction` arithmetic and are reproducible bit-for-bit on any conforming Python 3 implementation (verified by `tests/test_scenarios.py::TestScenarioDeterminism`, which re-runs every manifest twice and asserts identical output).

## Explicit modelling assumptions (restated from `FORMAL_MODEL.md`)

1. Token value is expressed only as a multiplier on a reference *breakeven* price `p0 = total_eligible_units / pool_units`; no absolute price is asserted.
2. The lock-up illiquidity discount (7%/month, capped at 70%) is an assumed parameter chosen to illustrate direction and rough sensitivity, not a calibrated or sourced number.
3. Synthetic donor populations are generated from a seeded `random.Random`, not sampled from any real donation data; population sizes and sat ranges were chosen to make concentration and attack effects legible, not to match any anticipated real distribution.
4. "Group" (beneficial owner) assignments for Sybil-split and exchange-omnibus scenarios are asserted by the manifest author (this seat), not inferred from any real on-chain heuristic — this package does not implement or claim any real entity-clustering technique.
5. Charity "honesty," "collusion," or "control" are boolean/parametric labels on synthetic donors for modelling purposes; no real charity is named, modelled, or implied.

## Open questions for later gates (Tracks B-F of issue #33)

1. **Does a governance cap, if adopted, remain enforced once tokens are transferable and any lock-up expires?** This requires a Track E (ledger integration/consensus boundary) answer this seat cannot provide; §3 of `FAILURE_CONDITIONS.md` treats this as unresolved rather than assuming either answer.
2. **Is sealed/precommitted donation (removing the denominator-timing exposure in FC-5) compatible with the real Bitcoin transaction model (Track B)?** Not evaluated here; this package works only in the abstract sats/units domain already used by `BENEFICIAL_GENESIS_DESIGN_001`.
3. **What is the real magnitude of the charity-rebate/circularity risk?** This package shows the attack is *unconditionally profitable in principle*; it does not and cannot estimate what fraction of a real donor base would find or create a colluding charity destination — that is a social/legal question for Track D/F, not a simulable economic one.
4. **Would a hybrid design (transferable economic unit, non-transferable/capped governance, non-transferable window, sealed commitment) fully resolve FC-1 through FC-6, or only some of them?** `ALTERNATIVES_COMPARISON.md` §5 proposes this combination as the least-bad *if* a token is retained at all, but it has not been simulated as a single integrated scheme — only its components have been tested individually.
5. **How does this analysis interact with Track B's real-Bitcoin and Track C's real-PQ work?** Not at all by design — this seat was explicitly scoped to change no cryptographic verifier field except where an economic assumption exposes a required protocol field or explicit non-claim, and no such exposure was found.

## Second-family review

Issue #34 requires "at least one second-family Breaker review before any gate pass." No such review has occurred as part of this submission. This is disclosed explicitly in the receipt (`operations/receipts/BENEFICIAL_GENESIS_ECON_REDTEAM_001/RECEIPT.json`) and in the audit report's recommendation section. Because this analysis's own recommendation is `REJECT_OR_REDESIGN` rather than `ECONOMIC_GATE_PASS`, the "before any gate pass" condition is not itself triggered by this submission, but the recommendation should still be treated as a single-seat (Designer/Red-Team) finding pending independent review before any operator decision relies on it.
