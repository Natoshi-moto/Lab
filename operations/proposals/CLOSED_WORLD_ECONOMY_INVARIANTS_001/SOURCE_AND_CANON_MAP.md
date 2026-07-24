# Source and canon map

Every source is classified as one of: `ACCEPTED_MAIN`, `FROZEN_BASELINE`,
`MERGED_EVIDENCE`, `OPEN_PROPOSAL`, `HISTORICAL_ONLY`, `SUPERSEDED`,
`UNABLE_TO_VERIFY`. Classification reflects what a source's own header/receipt
claims for itself, cross-checked against `constitution/AUTHORITY.md` (main is
accepted working state, not certified truth; a proposal is `status_authority:
NONE` unless main records separate human authorization). **Not every document
in this repository is accepted state, and this table exists specifically so
this proposal does not treat every document in the repository as accepted
state.**

## Control plane

| Source | Classification | Why |
|---|---|---|
| `STATUS.json` | `ACCEPTED_MAIN` | Live control-plane file on `main`. `current_mode: RESEARCH_ASSESSMENT_CLEARED`, `current_round: R016`. Carries a **permanent** human-readable red: `NO_REAL_WORLD_TOKEN_OR_ECONOMIC_VALUE` — the single strongest load-bearing doctrine hit in the whole repo, because it lives in the control plane, not an experiment folder. |
| `NEXUS.json` | `ACCEPTED_MAIN` | Repo-shape config on `main`. Declares repo invariants (`no_silent_mutation`, `audit_overlays_do_not_rewrite_targets`, etc.) that this proposal's manifest schema must not contradict. |
| `WHY_NOT_TO_TRUST_THIS_PROJECT.md` | `ACCEPTED_MAIN` | `LOAD-BEARING / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`, explicitly non-deletable ("Do not delete this file to 'clean up for launch'"). §E item 28 directly states the checkpoint and non-claims forbid treating tips/ranks/NEX-like strings/run IDs as money. |
| `README_START_HERE.md` | `ACCEPTED_MAIN` | Entry-point doc on `main`; links the 2026-07-22 posture statement as "same epistemic stance, no token/value claim." |
| `AGENTS.md` / `CLAUDE.md` | `ACCEPTED_MAIN` | Standing seat instructions on `main`; both state a proposal has `status_authority: NONE` unless main records separate authorization — the exact posture this package must also hold. |
| `constitution/AUTHORITY.md`, `CANONICALITY.md`, `MUTATION.md`, `EVIDENCE.md`, `ROUTING.md`, `PRIVACY.md`, `AUDIT.md` | `ACCEPTED_MAIN` | Root governance layer. `AUTHORITY.md`'s principal/power table (human operator vs. AI seat vs. router vs. executor vs. GitHub vs. verifier) is the model this proposal's `USER_HARM_AND_POWER_MODEL.md` mirrors for economy operator powers. |
| `operations/LANGUAGE_STANDARD.md` | `OPEN_PROPOSAL` | Self-declared: "**status_authority:** `NONE` ... a proposal until the operator merges it." Not yet enforced by code (its own scope note admits the legacy `wallet`/`NEX`/`send`/`stake`/`mint` cleanup is a separate, unstarted task). Its banned-word table and `STRICT NO SALE` framing are used here as **doctrine to translate**, not as already-merged, already-enforced fact. |

## Beneficial Genesis economics program

| Source | Classification | Why |
|---|---|---|
| `experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/CANONICAL_CHECKPOINT_001.md` (`BGEN-CANONICAL-CHECKPOINT-001`) | `FROZEN_BASELINE` | Self-declared `CANONICAL_AS_RESEARCH_CHECKPOINT / NOT A PROTOCOL SPEC / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`. It freezes **doctrine and intent** ("never endorse real-world economic value... actively engineer against it"), explicitly **not** product readiness, **not** live-money authorization, and **not** status authority for itself or any model. `operations/receipts/BGEN_CANONICAL_CHECKPOINT_001/RECEIPT.json` confirms binding commit `7da34b3ce...` and `status_authority: NONE`. Treated here as the frozen doctrinal anchor this proposal must not contradict, while remembering "frozen" means *bytes preserved*, not *correct by virtue of being frozen* (`constitution/CANONICALITY.md`-style non-claim, restated explicitly in the checkpoint's own §7 non-claims). |
| `experiments/BENEFICIAL_GENESIS_DESIGN_001/` | `OPEN_PROPOSAL` | Self-declared `PROPOSE_ONLY / DESIGN_AND_SYNTHETIC_EVIDENCE`. Design pack only. |
| `experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/` (Grok red-team) | `MERGED_EVIDENCE` | `PROPOSE_ONLY / ECONOMIC_BREAKER`, merged as evidence of an adversarial pass. Disposition on the underlying mechanism: `CONTINUE_WITH_CONDITIONS`, `economic_gate_pass: false` — evidence of an **unresolved** economic gate, not a pass. |
| `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/` (Claude red-team) | `MERGED_EVIDENCE` | Same disposition (`CONTINUE_WITH_CONDITIONS` / `ECONOMIC_GATE_PASS: false`). Its `MECHANISM_NECESSITY.md` conclusion — transferability is *not necessary* for the specified functions and is implicated in the worst residual risks — is direct precedent for this proposal's transfer-policy defaults. |
| `experiments/BENEFICIAL_GENESIS_ECON_RETEST_003/`, `experiments/BENEFICIAL_GENESIS_ECON_RETEST_R1/` | `MERGED_EVIDENCE` | Both retests explicitly state they accept the repaired package as honest analysis but **do not** convert `CONTINUE_WITH_CONDITIONS` into `ECONOMIC_GATE_PASS`; residual risks (FC4 pathway, FC6/Sybil) remain controlling. |
| `experiments/BENEFICIAL_GENESIS_RETEST_002/` | `MERGED_EVIDENCE` | Retests the cryptographic verifier repair, not economic doctrine; included for completeness, not load-bearing for this proposal. |
| `experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/TO_SATOSHI_AND_THE_MAKERS_OF_BITCOIN.md` | `FROZEN_BASELINE` (sister doc, same checkpoint) | Its falsifiable side-path claim ("not money, not a claim on money, and not a step toward money... no vehicle in, no vehicle out") is quoted near-verbatim into `INVARIANTS.md`'s self-containment test. |

## Bounded work exchange (R012) — "earning" precedent

| Source | Classification | Why |
|---|---|---|
| `experiments/R012_BOUNDED_WORK_EXCHANGE/` | `HISTORICAL_ONLY` (as a directory) | No top-level README; contains only an adversarial fixture package (`fixtures/cognition_shadow/`), not doctrine text. |
| `operations/proposals/R012_BOUNDED_WORK_EXCHANGE/` (`CLAIM_MATRIX.md`, `THREAT_MODEL.md`, `NEXT_ACTION.proposal.md`, `STATUS.proposal.json`, `ACCEPTANCE.md`, `BUILD_PACKET.md`) | `OPEN_PROPOSAL` at time of writing, superseded in effect by its own promotion | The proposal's `CLAIM_MATRIX.md` explicitly rows: *"The unit is money, financially valuable, fungible or transferable — out of scope — non-claim"* and *"A receipt or test promotes canonical status — prohibited — false; user authority only."* |
| `operations/receipts/R012_BOUNDED_WORK_EXCHANGE/PROMOTION.json` | `ACCEPTED_MAIN` | `"decision": "PROMOTE_TO_MAIN"`, `authority: USER_EXPLICIT_PROMOTION` — this is a human-authorized, merged promotion. Its `not_promoted_as_empirical_truth` field lists `money-or-economic-value` first. This is the **strongest structural precedent** in the repo for "internal, non-financial, receipt-bound work exchange, explicitly promoted, explicitly not money" — the pattern `EARNING_AND_RECOGNITION_MODEL.md` generalizes. |

## PCX custody/durability series (R013–R016)

| Source | Classification | Why |
|---|---|---|
| `operations/proposals/R013_PCX_CONSERVED_CLAIM/` through `R016_PCX_INTEGRATED_CUSTODY_GATE/` | `OPEN_PROPOSAL` (each `STATUS.proposal.json` reads `"canonical_status": "UNPROMOTED_PROPOSAL"`, `"status_authority": "NONE"`) | Not economy doctrine per se (they model a synthetic claim/custody kernel), but every receipt in the chain (`operations/receipts/R013.../DEMO_REPORT.json` etc.) repeats the same non-claim: *"not money, a token, legal property, a security, a currency, a redeemable promise or an economically valuable asset."* Used here as corroborating, independently-worded restatements of the same anti-value doctrine across an unrelated technical track — evidence the doctrine is repo-wide, not confined to one experiment. |

## Sandbox and promotion gate (PR #110)

| Source | Classification | Why |
|---|---|---|
| `operations/process/EXPERIMENTAL_SANDBOX_PROMOTION.md`, `experimental-sandbox-promotion.schema.json`, `validate_promotion.py`, `test_validate_promotion.py` | `ACCEPTED_MAIN` | Merged through PR #110 (confirmed: `origin/main` HEAD commit message is *"Route public experiments through Experimental Sandbox (#110)"*, exactly matching the operation brief's "current promotion gate merged through PR #110"). Governing sentence: *"Sandbox makes experimentation cheap. Promotion makes claims expensive... A promotion package is a request for review, never an automatic bridge, copy operation, or status upgrade."* This proposal's own manifest schema, validator, and `LAB_INTERNAL` framing directly reuse this contract's shape (same `status_authority: NONE` const pattern, same "no merge/accept language" rule on `operator_decision_requested`). |
| `operations/process/PR110_PROMOTION_GATE_REPAIR_REPORT.md` | `ACCEPTED_MAIN` | Documents a fixed circular-exclusion bug in the validator; informative precedent that even accepted, tested gates can carry defects — reinforces this proposal's own non-claim that a passing validator run is not proof of safety. |
| `operations/merge_authorizations/` (`README.md`, `PR-110.json`, `PR-111.json`, `PR-114.json`, `PR-115.json`) | `ACCEPTED_MAIN` | The actual human-authorization mechanism this proposal's PR will be subject to; explains *why* GitHub's native review approval cannot substitute for operator sign-off here (single shared account). |

## Communications

| Source | Classification | Why |
|---|---|---|
| `communications/statements/2026-07-22_READY_FOR_SERIOUS_RESEARCH.md` | `ACCEPTED_MAIN` (as a filed statement), content is explicitly non-authoritative | `status_authority: NONE` by its own header; states research-readiness is "a human judgment about research readiness, not a claim that the software is safe to trust with money, identity, or liability," and repeats "No real-world economic value on project objects. No token endorsement. No price." Does not override reds, freezes, or the constitution (its own line 80). |

## Contradicting / superseded surfaces (full detail in `CONTRADICTION_REGISTER.md`)

| Source | Classification | Why |
|---|---|---|
| `products/noted-host/public/nexus/os/blocks/system/Wallet_v4_nexus.html` | `SUPERSEDED` in doctrine, but **live in the tree** | Shipped UI copy reads *"You begin at 0 NEX. NEX is earned through real realm activity... they are pieces of one balance — not extra wallets or extra currencies"* — uses exactly the words `LANGUAGE_STANDARD.md` bans (`wallet`, `balance`, `earn`) for a currency-like unit, in a file still present in the tree. `operations/handoffs/OPERATOR_STATE_OF_THE_REPO_001.md:54` names this precise gap: *"Declared ≠ enforced... an old wallet screen with Send/Stake buttons is still reachable."* This proposal treats that file as **doctrinally superseded but not yet code-removed** — a live example of exactly the failure mode `THREAT_MODEL.md` and `CONTRADICTION_REGISTER.md` are built to catch. |
| `products/noted-host/public/nexus/os/tests/battle-stakes-tests.js`, `wallet-handshake-tests.js` | `SUPERSEDED` | Tests for the same shipped wallet/stakes surface; same status as above. |

## Items in the brief not found, or found only as absence

| Item named in the operation brief | Finding |
|---|---|
| "`baseline-001`" | Resolves to Git tag `baseline-001`, bound in `STATUS.json.canonical_target` to commit `7a8068fc...` — `FROZEN_BASELINE`, distinct from and older than the current `main` tip; not re-verified byte-for-byte in this operation (out of scope — this proposal touches doctrine, not that snapshot). |
| "Full Spectrum/NEX proposals" | No file or directory matching "Full Spectrum" was found anywhere in the repository. `NEX` as a live, non-doctrine artifact resolves to the `Wallet_v4_nexus.html` surface above (see Contradiction Register) plus scattered mentions in `communications/website/DISTRIBUTED_SOCIAL_GAMIFIED.md` ("XP / rank / tips stay non-redeemable, non-investment (Checkpoint 001)") and `experiments/NOTED_PROJECT_OS_001/CANONICAL_DIRECTION.md` ("Tip / standing = synthetic appreciation (non-redeemable)"). Classified `UNABLE_TO_VERIFY` as a named source — it may be an informal or since-renamed reference the operator has in mind rather than a file in this repository at this commit. |
| "current Sandbox documentation" | The Sandbox repository itself (`Natoshi-moto/Experimental-Sandbox`) was **not** cloned or inspected in this operation — out of the declared write/read scope (`AGENTS.md` item 16 routes new experimentation there, not this Lab operation). Only the Lab-side promotion gate that governs Sandbox→Lab movement was inspected. Classified `UNABLE_TO_VERIFY` for the Sandbox repo's own internal documentation. |
