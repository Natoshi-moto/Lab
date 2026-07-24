# Prohibited capabilities

**status_authority:** `NONE`

Each capability below is a key in the manifest's `prohibited_capabilities`
object (`schema/closed_world_economy.schema.json`). Every key must be present
and set `true` (prohibited); the validator rejects a manifest that omits a
key or sets any of them `false`. This is deliberately rigid: these are not
tunable design parameters, they are the boundary of the whole framework.

| Key | Capability | Rationale (traced to `INVARIANTS.md`) |
|---|---|---|
| `cash_redemption` | Converting an internal object to cash | Invariant A.1 |
| `crypto_redemption` | Converting an internal object to cryptocurrency | Invariant A.2 |
| `external_goods_services_redemption` | Converting an internal object to external goods/services | Invariant A.3 |
| `revenue_entitlement` | Any claim on project revenue | Invariant A.4 |
| `ownership_claim` | Any claim of ownership over operator/project assets | Invariant A.5 |
| `debt_claim` | Any claim of debt owed by the operator/project | Invariant A.6 |
| `promised_appreciation` | Any promise an object will gain value | Invariant A.7 |
| `yield_or_interest` | Any yield/interest paid on holdings | Invariant A.8 |
| `official_exchange_rate` | Any operator-declared rate vs. external currency/asset | Invariant A.9 |
| `official_liquidity_provision` | Operator or project market-making | Invariant A.10 |
| `price_oracle` | Any official price feed for an internal object | Invariant A.11 |
| `external_wallet_withdrawal` | Withdrawal to an external wallet | Invariant B.1 |
| `blockchain_bridge` | Any bridge to a blockchain | Invariant B.2 |
| `exportable_bearer_instrument` | Any portable, redeemable-by-bearer object | Invariant B.3 |
| `external_trading_api` | Any API designed for external trading | Invariant B.4 |
| `operator_escrow_for_external_trade` | Operator-run escrow for external trades | Invariant B.5 |
| `official_otc_matching` | Operator-run buyer/seller introduction | Invariant B.6 |
| `account_sale_tooling` | Features built or marketed to enable account sales | Invariant B.7 |
| `collateral_or_lending` | Using internal objects as loan collateral | Invariant B.8 |
| `misleading_financial_promotion` | Marketing implying investment/profit/income/yield/cash-out/ownership/guaranteed scarcity value | Invariant C |
| `unbounded_transfer` | Peer transfer with no operator-declared bound (rate, recipient class, or review) for any category | Invariant E |
| `paid_random_transferable_rewards` | Chance mechanisms combining payment/valuable access, chance, prize, and transferability | Invariant D |

## Non-negotiable vs. reviewable

Every key in this table is non-negotiable for a system claiming this
framework's closure — there is no "prohibited unless justified" tier here.
A design that needs one of these capabilities is not a variant of a
closed-world economy; it is a different kind of system and falls outside
this proposal's scope entirely (and, per `HALT_AND_ESCALATION_RULES.md`,
would itself be a halt condition if introduced into a system already
claiming this framework).

## What is deliberately absent from this list

This list does not prohibit categories that are conditionally allowed under
narrower rules elsewhere, so they are not duplicated here:

- Bounded, non-transferable, or operator-mediated internal exchange of
  expressive/cosmetic objects — governed by `ALLOWED_INTERNAL_PRIMITIVES.md`
  and `EARNING_AND_RECOGNITION_MODEL.md`'s per-category property table, not
  blanket-prohibited.
- Chance mechanisms without a payment/valuable-access element and without
  transferability — see `INVARIANTS.md` §D's narrow carve-out.
- Internal, non-transferable governance participation — allowed in kind,
  prohibited only from being transferable/purchasable (already covered by
  `unbounded_transfer` and the category defaults in `INVARIANTS.md` §E).
