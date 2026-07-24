# Hard invariants

**status_authority:** `NONE`

These are the minimum invariants a future closed-world economy must declare
and hold. They are enforced, where enforceable, by
`tools/validate_closed_world_economy.py` against a manifest in the shape of
`schema/closed_world_economy.schema.json`. A validator pass means the
declared manifest is internally consistent with these invariants — see
`CLAIMS_AND_NONCLAIMS.md` for what a pass does **not** mean.

## A. No official external value

A conforming system's official mechanisms must not provide:

1. No cash redemption.
2. No crypto redemption.
3. No external goods-or-services redemption.
4. No entitlement to project revenue.
5. No ownership claim over any operator or project asset.
6. No debt claim against the operator or project.
7. No promised appreciation of any internal object.
8. No yield or interest on any internal balance or holding.
9. No operator-supported exchange rate between an internal object and any
   external currency, token, or asset.
10. No official liquidity provision (operator or project-run market-making).
11. No price oracle for any internal object.

## B. No external transfer infrastructure

A conforming system must not build or operate:

1. No external wallet withdrawal path.
2. No blockchain bridge.
3. No exportable bearer instrument (anything portable and redeemable outside
   the system by whoever holds it).
4. No API designed for external trading (an API built for internal tooling
   that happens to be scraped is a leakage event, not a designed capability —
   see `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`).
5. No operator escrow service for external trades.
6. No official OTC matching (introducing buyers to sellers, even informally,
   even unpaid).
7. No account-sale tooling (transfer-of-identity/transfer-of-progress
   features marketed or built to enable account sales).
8. No collateral or lending mechanism using internal objects as security.

## C. No misleading promotion

A conforming system's official communications must not claim, or materially
imply, that participation is:

- an investment;
- a source of profit;
- a source of income;
- a source of passive earnings;
- an appreciating asset;
- a store of value;
- productive of yield;
- eventually "cashable out";
- an ownership stake;
- guaranteed to hold or gain scarcity value.

This restates `operations/LANGUAGE_STANDARD.md`'s banned-word table as a hard
invariant rather than a style guide. **Precise risk analysis, threat
modeling, and this document itself may still use these words** when assessing
whether a mechanism resembles them — the invariant binds official, outward
promotional communication, not internal analysis (mirrors
`operations/LANGUAGE_STANDARD.md`'s own "What this does NOT mean" carve-out
for history, receipts, audits, and itself).

## D. Chance and randomness

Any mechanism combining (a) payment or valuable access, (b) chance, (c) a
prize or scarce outcome, and (d) a transferable reward is **blocked pending
specialist review** — not designed around, not shipped with mitigations,
blocked. This specifically prohibits, without further internal design work:

- loot boxes;
- wagering;
- paid randomness;
- chance-based rewards that are also transferable.

A system may still use chance for purely cosmetic, non-transferable,
no-payment outcomes (e.g., a random compliment, a random cosmetic skin with
no market and no acquisition cost) — that combination lacks element (a) or
(d) above and is not blocked by this invariant, though it still passes
through `ALLOWED_INTERNAL_PRIMITIVES.md`'s general default-prohibited property
declarations.

## E. Transfer defaults

Default classification for common object categories (full model in
`ALLOWED_INTERNAL_PRIMITIVES.md` and `EARNING_AND_RECOGNITION_MODEL.md`):

| Category | Default |
|---|---|
| Recognition | non-transferable |
| Authorship record | non-transferable |
| Reputation | non-transferable and non-purchasable |
| Governance participation | non-transferable |
| Expressive/cosmetic objects | transferable **only** under explicit bounded analysis (see `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`) |
| Anything externally redeemable | prohibited outright — not a transfer-policy choice at all |

**Unspecified properties default to prohibited.** A manifest that does not
explicitly declare a property for a category has *not* implicitly allowed it —
the schema requires explicit declaration precisely so silence cannot later be
read as permission.

## F. Self-containment test

A candidate **fails** the self-containment test if any *official* mechanism
provides:

- redemption;
- external settlement;
- external transfer;
- guaranteed convertibility;
- operator-supported pricing;
- real-world debt or revenue rights;
- financial promotion;
- deliberate secondary-market facilitation.

The test distinguishes five categories, and only the first three matter for
whether the design itself passes:

1. **Official capability** — built and offered by the system. Any hit above
   in this category is an automatic fail.
2. **Tolerated workaround** — a gap the operator has chosen, for stated
   reasons and under monitoring, not to close yet. Does not fail the design
   test by itself but must be logged in `known_exceptions` and is subject to
   the response ladder in `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`.
3. **Prohibited workaround** — a gap that should have been closed and was not;
   an implementation defect, not a design property. Triggers
   `HALT_AND_ESCALATION_RULES.md` review of the gap, not of the doctrine.
4. **Observed external behaviour** — users doing something externally with no
   official or tolerated system support. Per `THREAT_MODEL.md` §4, this never
   validates the design; it feeds `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`.
5. **Operator facilitation** — the operator personally enabling external
   trade (even informally, even without profit motive). This is treated as
   equivalent to an official capability (category 1) regardless of intent,
   because `USER_HARM_AND_POWER_MODEL.md` treats operator action as
   system action.

Restated from `experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/TO_SATOSHI_AND_THE_MAKERS_OF_BITCOIN.md`'s
falsifiable framing, generalized beyond Beneficial Genesis: *what a participant receives is not
money, not a claim on money, and not a step toward money — no vehicle in
(cannot be purchased for appreciation, no claim on pool/yield/governance over
value), no vehicle out (no redeem/swap/wrap/bridge/convert path by design, not
"not yet"), and its meaning is internal to the specific system, not a parallel
bank.*

## G. Non-claims specific to this file

This invariant list is proposed, not adopted, and adopting it does not by
itself make any future system safe, legal, or harmless — see
`CLAIMS_AND_NONCLAIMS.md`.
