# Alternatives comparison — BGEN-ECON-BREAKER-001

Synthetic, qualitative + deterministic where coded. Not an empirical ranking of real-world welfare.

## Allocation rules (executable)

| Rule | Concentration | Sybil | Timing | Notes |
|------|---------------|-------|--------|-------|
| pro_rata | Preserves \(e_i\) concentration | Mass-invariant | Late mass dilutes | Design default |
| capped_pro_rata | Softens single-id whale | Broken if free IDs | Same | Needs identity layer |
| concave_sqrt / log | Softens large \(e\) | **Increases** under split | Same | Do not recommend without identity |
| time_weighted | — | — | Favors high \(\tau\) | Not a sealed commit |
| lottery_wo_replacement | High variance | Ticket ∝ \(e\) | Seeded | Not “with replacement winners” |
| no_token | n/a | n/a | n/a | Pure charity baseline |

## Mechanism structures

| Structure | Charity net | Migration proof | Speculative surface | Governance risk |
|-----------|-------------|-----------------|---------------------|-----------------|
| Direct donation | Full (minus ops) | Optional | None | None from token |
| Burn migration | Zero to charity | Strong destroy signal | Optional new unit | Depends |
| Snapshot airdrop | None | Weak | High if transferable | High if token gov |
| Nontransferable receipt | Full at source | Strong | Low | Separable |
| Transferable fixed pool | Full at source if no rebate | Strong | High | High if token gov |
| Hybrid econ≠gov | Full at source | Strong | Medium | Lower if gov capped/NT |
| Delayed convert | Full at source | Strong | Deferred | Deferred |

## Whale / exchange

- Linear pro-rata: 50/80/99% whale → ~same share of issued units (scenarios 01–03).  
- Exchange omnibus equals one large \(e_i\) (scenario 04).  
- Caps without identity: sybil reassembly (scenario 26).

## Rebate / circularity detectability

| Attack | In-protocol detectable? |
|--------|-------------------------|
| Same-asset rebate | No (off-chain) |
| Fiat rebate | No |
| Grants to donor-controlled entities | Social/legal audit only |
| Cross-charity loops | Statistical/social at best |
| Exchange–charity side deals | Out of protocol |

Immutable genesis set limits *adding* colluders but does not stop off-chain rebates from an already-included charity.

## Dominated cases (this seat)

If the product goal is **only** “prove donation to charity + bind PQ key,” then transferable fixed-pool allocation is **dominated** by non-transferable receipts (or pure donation + separate optional recognition).

If the product goal includes **bootstrapping a transferable ledger asset**, comparison must be completed under an explicit function list; this clean-room seat cannot invent those functions.
