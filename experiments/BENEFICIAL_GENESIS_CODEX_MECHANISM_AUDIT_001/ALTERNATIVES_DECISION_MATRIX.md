# Alternatives decision matrix

| Alternative | Receipt binding | Recognition | Transfer/liquidity | Identity risk | Concentration/control risk | Decision |
|---|---:|---:|---:|---:|---:|---|
| Transferable allocation | yes | yes | immediate | no for linear; yes for caps | high if ownership/votes coupled | not necessary for specified functions |
| Delayed transfer | yes | yes | later | unchanged | postponed, not removed | only if a specified timing need exists |
| Non-transferable receipt | yes | yes | no | low if no per-identity redistribution | avoids market reacquisition | preferred bounded recognition test |
| No token | donation proof optional | optional | no | none | none from allocation | dominates if donation is sole objective |
| Snapshot/airdrop | migration | weak charity link | optional | depends | preserves source concentration | different objective |
| Burn migration | migration | no charity retention | optional | low for linear | preserves source concentration | fails charity objective |
| Charity-directed fees | ongoing benefit | no genesis reward needed | ledger-dependent | low | depends on ledger | requires an operating ledger |
| Concave/capped | yes | yes | optional | fatal without identity | lower only for honest identities | reject for permissionless v1 |

Payment, fees, staking, bonding, governance, bootstrap distribution, and store-of-value are not specified requirements. Therefore no transferable design can be called dominant. Governance should be separated from economic units; cap-then-renormalize is not a hard cap.
