# Proposal: Closed-world economy invariants and harm gates

**Operation ID:** `CLOSED_WORLD_ECONOMY_INVARIANTS_001`
**status_authority:** `NONE`
**Class:** `LAB_INTERNAL` proposal (`operations/process/EXPERIMENTAL_SANDBOX_PROMOTION.md` contract, `change_origin: LAB_INTERNAL`)
**Baseline:** `main` @ `6c3a1e806baba1183553221f5c2f00125ce2be29` (verified fresh against `origin/main` and the GitHub API before any file in this package was written)
**Author seat:** Claude Code (Sonnet 5), operator-directed
**Branch:** `claude/closed-world-economy-invariants-001`

## What this package is

A **proposed framework**, not an implementation, for any *future* internal
economy, Mithub system, university, game, reputation mechanism, recognition
mechanism, or creative-participation system the Lab or its programmes might
build. It translates the doctrine that already exists across this repository —
most load-bearingly `STATUS.json`'s permanent red
`NO_REAL_WORLD_TOKEN_OR_ECONOMIC_VALUE`, `BGEN-CANONICAL-CHECKPOINT-001`'s
"never endorse real-world economic value" mandate, and `operations/LANGUAGE_STANDARD.md`'s
`STRICT NO SALE` rule — into:

- mechanical invariants (not slogans);
- a capability allow/deny list with explicit, defaulted-to-prohibited properties;
- a threat model for how internal objects leak into real markets anyway;
- a harm model for the people the mechanism could hurt;
- an operator-power model with abuse risk and sunset per power;
- a halt/escalation ladder with receipts at every step;
- a machine-readable manifest schema, validator, and deterministic test vectors
  that check **internal consistency of declared invariants only** — nothing more.

## What this package is not

See `CLAIMS_AND_NONCLAIMS.md` for the full list. In short: not legal advice, not
regulatory clearance, not token-launch authorization, not permission to accept
real money or create redeemable assets, not evidence a closed-world economy
already exists or that users cannot build external markets anyway, not a
harm guarantee, not permission to deploy to real users, not permission to
weaken any existing Lab invariant, and not proof that a passing validator run
means legal, social, or economic safety.

## Central doctrine

> Closed-world intent is not established by labels. It must be maintained by
> architecture, incentives, communications, monitoring, enforcement, and
> willingness to halt.

> Capability growth increases the burden of proof.

> Discovery of external trade does not validate the economy; it triggers
> investigation, containment, redesign, restriction, or suspension.

> Sandbox activity may be canonical as history and shared context without being
> canonical as truth, safety, or Lab acceptance.

This is not new doctrine invented for this proposal — it is a restatement of
patterns already load-bearing elsewhere in the Lab (`constitution/AUTHORITY.md`'s
principal/power separation; `WHY_NOT_TO_TRUST_THIS_PROJECT.md`'s refusal to let
passing checks mint trust; `operations/process/EXPERIMENTAL_SANDBOX_PROMOTION.md`'s
refusal to let Sandbox activity self-promote). This package applies that same
posture specifically to internal economies.

## How to read this package

| File | Answers |
|---|---|
| `SOURCE_AND_CANON_MAP.md` | What already exists, and what status it actually holds |
| `THREAT_MODEL.md` | What "closed-world" means mechanically, and where the seams are |
| `INVARIANTS.md` | The hard invariants and the self-containment test |
| `PROHIBITED_CAPABILITIES.md` | What must never exist, with rationale |
| `ALLOWED_INTERNAL_PRIMITIVES.md` | What people may earn internally, and its default-prohibited properties |
| `EARNING_AND_RECOGNITION_MODEL.md` | What "earning" means, category by category |
| `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md` | How external trade happens anyway, and the response ladder |
| `USER_HARM_AND_POWER_MODEL.md` | Who gets hurt, how, and what power the operator holds over it |
| `HALT_AND_ESCALATION_RULES.md` | When to stop, and what due process a stop requires |
| `CLAIMS_AND_NONCLAIMS.md` | Exactly what this package does and does not establish |
| `IMPLEMENTATION_GATES.md` | What must happen before any of this touches real users |
| `CONTRADICTION_REGISTER.md` | Where the existing repo already contradicts this doctrine |
| `TEST_VECTORS.json` | Deterministic positive/negative manifests |
| `schema/closed_world_economy.schema.json` | The manifest shape |
| `tools/validate_closed_world_economy.py` | The fail-closed validator (stdlib only) |
| `tests/test_closed_world_economy.py` | Unit tests over the vectors and validator |
| `HANDOFF_ANY_AI.md` | Re-entry instructions for any future seat |
| `RECEIPT.json` | This operation's own receipt |

## Decision requested

See `RECEIPT.json` and the PR body. This proposal requests **review only**. It
does not request or contain merge authorization. Merge, if it ever happens,
is recorded separately per `operations/merge_authorizations/README.md` and is
the operator's sole call, made only after a plain-language explanation of what
merging this specific package would and would not do.
