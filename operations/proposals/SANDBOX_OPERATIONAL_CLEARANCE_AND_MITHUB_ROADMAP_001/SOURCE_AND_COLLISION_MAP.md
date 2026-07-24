# SOURCE AND COLLISION MAP

**Status authority:** `NONE`

**Purpose:** prevent the future roadmap operation from treating open proposals, chat memory or historical experiments as accepted Lab state.

All classifications below are observations made when this queue was created. They must be freshly verified at activation.

## Accepted Lab sources

| Source | Observed state | Classification | Permitted use |
|---|---|---|---|
| Lab `main` | `6c3a1e806baba1183553221f5c2f00125ce2be29` | `ACCEPTED_MAIN` | Historical baseline only; reverify current head |
| `STATUS.json` | Contains `NO_REAL_WORLD_TOKEN_OR_ECONOMIC_VALUE` | `ACCEPTED_MAIN` | Binding current red unless later accepted state explicitly changes it |
| `NEXUS.json` | Includes proposal/action/evidence/authority/no-silent-mutation invariants | `ACCEPTED_MAIN` | Governing process constraints |
| `WHY_NOT_TO_TRUST_THIS_PROJECT.md` | Permanent distrust register; research-only and anti-overclaim framing | `ACCEPTED_MAIN` | Load-bearing non-claims and adversarial posture |
| PR #110 | Merged Sandbox-to-Lab structured promotion gate | `MERGED_EVIDENCE` and accepted implementation | Reuse contract and validator; do not imply passing equals safety |
| PR #111 | Merged Lab board pointer to Sandbox | `MERGED_EVIDENCE` | Confirms the public operator board lives in Sandbox |
| PR #114 | Merged privacy assault proof-vault package | `MERGED_EVIDENCE` | Evidence that declared promises can exceed machine enforcement |
| PR #115 | Merged exact-SHA human merge-authorization mechanism | `MERGED_EVIDENCE` and accepted implementation | Preserve exact-SHA authorization and stale-approval invalidation |

## Accepted Experimental-Sandbox sources

| Source | Observed state | Classification | Permitted use |
|---|---|---|---|
| Sandbox `main` | `82b9a3b2a60f008ba31d2f4a9228c9074e126b1c` | `ACCEPTED_MAIN` within Sandbox only | Historical baseline; reverify current head |
| Sandbox `README.md` | Calls repository public, reversible and noncanonical; preserves Lab boundary | `ACCEPTED_MAIN` within Sandbox | Source of current wording that needs explicit reconciliation |
| Sandbox `CHARTER.md` | Defines `main` as append-only index/templates/accepted experiment records; prohibits silent evidence rewrite | `ACCEPTED_MAIN` within Sandbox | Source supporting canonical-history design |
| Mithub Adjacent router | Merged early natural-language router and Lab-boundary prototype | `ACCEPTED_MAIN` within Sandbox / experimental precursor | Reuse and evaluate; do not call it complete Mithub architecture |
| Public board | Merged through Sandbox PR #2 | `ACCEPTED_MAIN` within Sandbox | Existing operator-input surface; not Lab truth |

## Active dependency

| Source | Observed state | Classification | Required treatment |
|---|---|---|---|
| `CLOSED_WORLD_ECONOMY_INVARIANTS_001` | Sonnet operation running in isolated worktree/branch when queued | `UNABLE_TO_VERIFY` until final receipt and PR exist | Do not execute roadmap until source-bound adversarial review and disposition |

## Open proposals that must not be silently absorbed

| PR | Purpose | Classification | Collision rule |
|---|---|---|---|
| #101 | Broad Full Spectrum vision pack | `OPEN_PROPOSAL` | Mine as historical vision only; decompose rather than merge wholesale |
| #107 | Commons principles and signed authorship/recognition primitive | `OPEN_PROPOSAL` | Keep separate pending economy, rights, cryptography and threat review |
| #108 | Simulated Outside Adversary/Advisor role | `OPEN_PROPOSAL` | May inform role design; cannot satisfy independent permanent critic requirement |
| #109 | Personal learning record | `OPEN_PROPOSAL` with privacy decision | Do not quote, merge or reuse without fresh operator publication decision |
| #112 | Owner Plain-Language Gate | `OPEN_PROPOSAL` needing correction | Do not repeat the false universal claim that all drafts are safe; public branches and external effects can matter |
| #113 | Privacy publication stack partly superseded by #114 | `OPEN_PROPOSAL` / likely partly `SUPERSEDED` | Preserve unique publication files; do not duplicate landed proof-vault files |
| #116 | Housekeeping evidence pack | `OPEN_PROPOSAL` | Use its maps as proposal evidence only; reverify live state |

## Known conceptual collisions

### 1. `noncanonical` versus canonical history

Current Sandbox README wording broadly says the repository is noncanonical. Current charter says `main` contains accepted experiment records and that published evidence cannot be silently rewritten.

Required resolution:

> Sandbox `main` is canonical for shared history and context, but not canonical for truth, safety, correctness, legality, deployment or Lab acceptance.

This must be changed through a dedicated reviewed Sandbox operation, not by editing wording inside the Lab roadmap.

### 2. Fast experimentation versus public exposure

Fast and reversible Git mechanics do not make every action harmless. Public pushes, discussions, publications, secrets, personal data, rights violations and targeting can create immediate external effects.

Required resolution:

- fast default for bounded reversible internal/Sandbox drafts;
- stop before unclear public exposure, private data, rights problems, external targeting or material harm;
- absolute stop at Lab mutation and promotion authority.

### 3. Model diversity versus independence

Different model families can produce valuable differential review. They are not votes and do not automatically establish independence.

Required resolution:

- disclose provider/model relationship;
- assign different functions, not repeated agreement;
- require reviewers to inspect source rather than builder summaries;
- preserve `UNABLE_TO_VERIFY`.

### 4. Closed-world intent versus social markets

Removing price and transfer fields is useful but cannot alone prevent external markets, coercive status systems, paid access, off-platform exchange or financial interpretation.

Required resolution:

- architecture;
- incentives;
- communication;
- monitoring;
- enforcement;
- user-harm controls;
- halt/suspension willingness.

### 5. Critic freedom versus hostile conduct

Permanent opposition to Lab must be protected. Protection for criticism must not become permission for doxxing, threats, unlawful targeting, privacy violation or harassment.

Required resolution:

- attack claims and mechanisms, not people;
- preserve strongest good-faith arguments;
- permanent critic-controlled lineage;
- reasoned rejection and appeal;
- no direct Lab mutation authority.

## Required fresh checks at activation

1. current SHAs and PR states;
2. current branch protection and required checks where observable;
3. current economy operation state;
4. whether any source above has merged, closed, changed or been superseded;
5. current Sandbox history/merge settings;
6. current secret/privacy/right boundaries;
7. whether the missing `@noble/ed25519` dependency still blocks full verification;
8. whether newer accepted doctrine changes Phase A requirements.

If evidence conflicts, prefer current accepted repository bytes and record the contradiction. Do not silently reconcile it in prose.
