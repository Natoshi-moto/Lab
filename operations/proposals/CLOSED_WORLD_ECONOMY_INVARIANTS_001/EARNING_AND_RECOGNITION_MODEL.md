# Earning and recognition model

**status_authority:** `NONE`

"Earn" is not used as an undefined word anywhere else in this package. This
file defines it: **earning is the act of causing an internal object from
`ALLOWED_INTERNAL_PRIMITIVES.md` to be granted to an account, through a
declared internal mechanism, with no path to external value.** "Earn the
unit" (the phrase this Lab already uses in
`experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/CANONICAL_CHECKPOINT_001.md`'s
compass, *"Adopt the protocol. Prove the receipt. Earn the unit. Only then
talk like Haven"*) means **earn standing in the synthetic system — never
mistake that standing for dollars** (that document's own gloss, generalized
here to every category, not just the Beneficial Genesis unit).

## Required property declaration

For every category a manifest declares under `allowed_primitives`, it must
explicitly set each of the following properties to `true` or `false`.
**A property not present in the manifest is not silently permitted — the
schema requires the key to be present, precisely so a gap is a validation
failure, not a loophole.**

| Property | Question it answers |
|---|---|
| `transferable` | Can one account move this to another account at all? |
| `giftable` | Can it be given away with no exchange expected in return? |
| `sellable` | Can it be exchanged for anything of value, internal or external? |
| `redeemable` | Can it be converted to cash, crypto, goods, services, or any external value? |
| `purchasable` | Can it be acquired by paying real money or crypto? |
| `scarce` | Is supply deliberately limited, creating potential speculative pressure? |
| `inheritable` | Does it pass to another account/person on the original holder's account closure or death? |
| `collateralizable` | Can it be pledged as security for anything? |
| `usable_for_governance` | Does holding it grant a vote or decision-making weight? |
| `obtainable_through_chance` | Can it be acquired via a random-outcome mechanism? |
| `convertible_to_external_value` | Can it be converted into labour, services, debt relief, ownership, revenue, or any other external benefit, by any official path? |

## Default recommendations by category

| Category | transferable | giftable | sellable | redeemable | purchasable | scarce | inheritable | collateralizable | usable_for_governance | obtainable_through_chance | convertible_to_external_value |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `recognition` | false | false | false | false | false | false | false | false | false | false | false |
| `reputation` | false | false | false | false | false | false | false | false | false | false | false |
| `authorship_record` | false | false | false | false | false | false | false | false | false | false | false |
| `access` | false | false | false | false | false | false | false | false | false | false | false |
| `creative_permissions` | false | false | false | false | false | false | false | false | false | false | false |
| `participation_rights` | false | false | false | false | false | false | false | false | false* | false | false |
| `non_transferable_status` | false | false | false | false | false | false | false | false | false | false | false |
| `cosmetic_or_expressive_resources` | false† | false† | false | false | false | possibly | false | false | false | false | false |
| `internal_consumable_resources` | false | false | false | false | false | false | false | false | false | false | false |
| `stewardship_responsibilities` | false | false | false | false | false | false | false | false | true‡ | false | false |

`*` — `participation_rights` may itself constitute governance participation
(e.g., a vote), but the object should not be a separately transferable
governance *token*; `usable_for_governance` here asks whether holding the
object grants weight *beyond* the participation right itself, which should
default false to avoid a governance-weight secondary market forming around it.

`†` — `cosmetic_or_expressive_resources` may set `transferable`/`giftable`
true **only** after the explicit bounded analysis required by
`SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`; the default before that analysis is
false.

`‡` — `stewardship_responsibilities` legitimately carries governance-like
authority (moderation, curation decisions) as its defining feature, not as
an add-on; this is a designed exception to the general default, still
subject to `USER_HARM_AND_POWER_MODEL.md`'s operator-power scrutiny.

**No category may set `redeemable`, `purchasable`, `collateralizable`, or
`convertible_to_external_value` to `true` under this framework at all.**
These four properties are effectively locked to `false` by
`PROHIBITED_CAPABILITIES.md`'s `cash_redemption`, `crypto_redemption`,
`external_goods_services_redemption`, and `collateral_or_lending` entries; a
manifest that sets any of them `true` for any category fails validation
regardless of category (see `tools/validate_closed_world_economy.py`'s
contradiction check).

## Chance interacts with everything above

`obtainable_through_chance: true` is permitted only where
`purchasable: false` **and** `transferable: false` for that same category —
otherwise the combination becomes the loot-box/wagering pattern
`INVARIANTS.md` §D blocks outright. The validator enforces this combination
rule directly.

## Worked example: bounded non-financial work recognition

Modeled on `operations/receipts/R012_BOUNDED_WORK_EXCHANGE/PROMOTION.json`'s
already-accepted pattern (a settlement receipt confirming a bounded work
exchange occurred, explicitly not promoted as `money-or-economic-value`):
a `recognition` object granted when a bounded task is verified complete,
recorded as a receipt, non-transferable, non-purchasable, not usable for
governance, not chance-based. See `TEST_VECTORS.json`'s
`valid_bounded_work_recognition` vector for the literal manifest fragment.
