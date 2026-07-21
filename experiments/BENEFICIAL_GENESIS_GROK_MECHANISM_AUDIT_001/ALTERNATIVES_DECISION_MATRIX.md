# Alternatives decision matrix

Product functions held constant for necessity tests:

| ID | Function |
|----|----------|
| F1 | Charity receives source-chain value at immutable scripts |
| F2 | Cryptographic migration/claim binding to new ledger destination |
| F3 | Finite, deterministic genesis pool distribution after epoch |
| F4 | Permissionless claim admission under fixed genesis parameters |

Optional (not specified as required by design pack):

| ID | Function |
|----|----------|
| F5 | Transferable economic unit / secondary market |
| F6 | Token-weighted governance |
| F7 | Ongoing staking/fees/payment medium on new ledger |

## Matrix

| Alternative | F1 | F2 | F3 | F4 | F5 | Whale by size | Sybil on anti-conc. | Rebate residual | Tainted resale | Complexity |
|-------------|----|----|----|----|----|---------------|---------------------|-----------------|----------------|------------|
| A. Direct donation, no token | Y | N | N | N | N | n/a alloc | n/a | possible off-chain | n/a claim | lowest |
| B. Proof-of-burn migration | N | Y | Y | Y | opt | high if pro-rata | if concave/cap | n/a charity | if transferable | med |
| C. Snapshot airdrop, no donation | N | weak | Y | Y | typ | high | if concave/cap | n/a | if transferable | med |
| D. Charity-directed fees | ongoing | N | N | N | native | different | different | different | different | high ops |
| E. Non-transferable receipt | Y | Y | Y | Y | N | high (pro-rata) | n/a if linear | yes residual | **low** | low–med |
| F. Delayed-transfer allocation | Y | Y | Y | Y | later | high | n/a if linear | yes | deferred | med |
| G. Transferable fixed-pool (default reading) | Y | Y | Y | Y | Y | high | n/a if linear | yes | **high** | med–high |
| H. Hybrid: transferable econ / nontransferable gov | Y | Y | Y | Y | Y | high econ | gov depends | yes | high econ | high |
| I. Cap/concave without identity | Y | Y | Y | Y | opt | **evaded** | **broken** | yes | depends | false safety |

## Dominance (careful)

- **Do not** call A dominant unless F2–F4 are dropped.  
- **Do not** call G dominant unless F5/F7 are required and held constant.  
- For **F1–F4 only**, E (and F with delay) **weakly dominate** G on attack surface: same specified functions, less immediate secondary-market and tainted-resale surface.  
- Linear pro-rata **dominates** concave/cap **as a permissionless formula** only in the sense of Sybil-robustness; it does **not** dominate on concentration.

## Transferability necessity

| Question | Answer |
|----------|--------|
| Necessary for F1? | **No** — payment completes on source chain |
| Necessary for F2–F4? | **No** — claim right need not be alienable |
| Necessary for some F7 instantiations? | **Possibly** — **open product decision** |
| Demonstrated necessary by design pack? | **NOT_DEMONSTRATED** |

## Mitigations: solve vs move risk

| Mitigation | Solves | Moves / creates |
|------------|--------|-----------------|
| Non-transferable receipt | resale, secondary gov buy-up | status markets, weaker liquidity bootstrap |
| Delayed transfer | immediate flip | forward markets, time-shifted speculation |
| Cap-then-renormalize | single-id whale at genesis | Sybil, coalition, post-transfer buy |
| Concave weights | single-id whale optics | severe Sybil |
| Sealed commit window | some timing games | complexity, UX, griefing |
| AML/policy gates | some tainted flow | permissioning tension with F4 |
| Nontransferable gov | gov capture via trade | economic plutocracy still if desired elsewhere |

## Product decisions that control the answer

1. Are F5/F6/F7 in v1 scope?  
2. Is permissionless identity-free operation non-negotiable?  
3. Is whale concentration acceptable if proportional to sacrifice?  
4. What enforcement exists for no-rebate norms?  
5. Is fixed \(P\) independent of \(D\) intended?

Until (1) is explicit, transferability remains a redesign fork, not a proven necessity.
