# Independent reproduction report

**Task:** BGEN-EPISTEMIC-AUDIT-001 · **Subject:** `8349de7a5978be6a9984aa33fd59ba3725ebaaca` · **Authority:** none

Code: `repro/independent_repro.py` (35 checks), `repro/adversarial_probes.py`
(33 probes). Machine-readable results committed beside each script. All
arithmetic in the reproductions uses exact integers/`Fraction`. The subject
model implementations were **not** imported for the reproductions; they were
imported only inside `adversarial_probes.py`, explicitly to attack them and
run the differential. Populations are regenerated from the published seeds
and generator parameters (input reconstruction, not implementation reuse).
After every run, `git status` confirmed zero changes under any subject path.

## Subject commands re-executed first

| Command | Result |
|---|---|
| DESIGN_001 unit tests | 37 OK |
| DESIGN_001 verify_evidence.py | PASS (34 executable invalid vectors; byte-stable fixture regeneration) |
| ECON_REDTEAM simulate.py + tests | 27 scenarios, byte-identical regeneration; 72 tests OK |
| ECON_BREAKER simulate.py + tests | 28 scenarios, byte-identical regeneration; 25 tests OK |
| Full lab suite | **9 failures + 2 errors on a fresh worktree** (missing `node_modules`); 185/185 OK after `npm ci`. Environmental, but receipts do not record the prerequisite |
| RETEST_002 verify.mjs | 43 agreements / 0 disagreements / 0 crashes (matches issue #33's lineage claim exactly) |
| ./nexus doctor, git diff --check | PASS / clean |

## Independent reproductions (fresh code, stated equations only)

| ID | Result reproduced | Method | Outcome |
|---|---|---|---|
| R1 | Supply conservation & pro-rata split invariance | floor-sum property over 2,000 exact-integer randomized trials; exact reproduction of scenario 06 (single share 10791953/25000000; 400-way split gain **-53/25,000,000**) | **Exact match** |
| R2 | Concave & capped Sybil exploits | fresh `isqrt`/cap implementations; scenario 05 single 3849009/10⁸ → split 111119/250000 (gain +40598591/10⁸); scenario 26 cap gain +176241/250000; pure-math sqrt(k) multiplier check | **Exact match** |
| R3 | Fixed-pool denominator / undersubscription | single 1,000-sat donor → full 10⁸ pool; full issuance at T=1 and T=10¹⁵; zero at T=0; dust donor floors to 0 | **Exact match** |
| R4 | Rebate incidence | identity at all rates 0–100%; scenario 27 exact figures (conditional 2,500,000 vs expected 100,000 at 5% access × 80% enforcement; colluding-donor net 1,050,000) | **Exact match** |
| R5 | Tainted-fund opportunity-cost sensitivity | fresh decomposition; scenario 10 default cell net profit 4749998969487149/2500000000; all 12 grid cells match sign and exact value | **Exact match**, with finding **AUD-SEM-01** (below) |
| R6 | Governance integration semantics | scenario 13: token-weighted whale 13121911/24999936 (>1/2), equal rule 1/501, none rule 0; weights sum to 1 | **Exact match** |
| R7 | Cap-then-renormalize | scenario 14 whale final weight 99999749/1023769849 (≈9.768%, exceeds the 500bps nominal clip); audit-constructed degenerate cases: lone holder → 100%, two holders → 50%/50% under a 5% clip | **Exact match** |

## Adversarial probes (33/33 pass)

- **Design pack:** duplicate nullifiers, bool/zero/negative/oversized
  eligible values, bool/negative pool all reject; rows canonically sorted;
  supply conserved; tampered records and tampered totals rejected.
- **Claude econ model:** duplicate/empty/non-string IDs, bool weights,
  bool/negative pool, cap_bps ∈ {0, 10001}, winners=0 all reject; zero-weight
  donor allowed with zero allocation; 2²⁰⁰-sat weights handled exactly;
  ordering invariance; lottery deterministic per seed with 10 distinct
  winners and equal prizes (without replacement, as repaired); 500
  randomized trials across three schemes never over-issue.
- **Grok breaker model:** duplicate IDs, bool/negative/zero weights,
  >MAX_SATS values all reject; ordering invariance.
- **Differential:** Claude vs Grok pro-rata agree exactly on 300 shared
  random vectors within the common input domain.

## Verified pre-repair defect claims

Each defect the controlling review and repair narrative allege against the
original submission was verified against the actual bytes at `b588779`:

| Alleged defect | Verified present? |
|---|---|
| Lottery sampled with replacement (`rng.choices`) | Yes (orig allocation.py L120) |
| "Renormalized" documented, `min(units, cap)` implemented, no renorm | Yes (L130 vs L137) |
| `true_economic_cost_borne_by_attacker = "0"` hard-coded | Yes (orig scenario.py L207) |
| "predicted — not merely possible" rebate language | Yes (orig FAILURE_CONDITIONS.md) |
| Only 6 of issue #34's 7 failure conditions mapped | Yes |
| Original recommendation REJECT_OR_REDESIGN | Yes |

## Audit-original findings

- **AUD-SEM-01 (minor, disclosed here first):** in
  `10_stolen_key_donation.json`, the headline decomposition uses
  `token_value_per_unit = (total_donated/pool) × multiplier` (≈0.628 at 1.0),
  while the sensitivity grid passes the multiplier **directly** as an
  absolute per-unit value (0.5/1/1.5). Same field name, two semantics; grid
  cells are not numerically comparable to the headline cell. Both
  interpretations still produce sign flips, so the qualitative conclusion
  (profitability is assumption-conditional) stands.
- **AUD-SEM-02 (minor):** the two economics models have different input
  domains (zero weights and unbounded ints accepted by Claude, rejected by
  Grok; Grok bounds at 21e6·10⁸). Agreement claims are therefore scoped to
  the intersection domain. Inside it, agreement is exact.

## What reproduction does and does not establish

Reproduction establishes that the committed numbers follow from the
committed inputs under the stated equations — i.e., **the packages compute
what they say they compute**. It does not establish that the equations model
the real world (see MODEL_ADEQUACY.md), and it cannot establish who or what
authored the packages (see PROCESS_AND_PROVENANCE_AUDIT.md).
