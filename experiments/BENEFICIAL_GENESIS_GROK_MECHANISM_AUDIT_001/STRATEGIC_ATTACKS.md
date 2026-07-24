# Strategic actors and combined attacks

Evidence classes labeled per claim.

## Actors

| Actor | Goal (stylized) | Main levers |
|-------|-----------------|-------------|
| Small self-custody donor | recognition / migration / altruism | small \(e_i\) |
| Whale | allocation share, gov, EV | large \(e\), possible rebate access |
| Sybil identities | evade caps/concavity | many nullifiers / keys |
| Exchange / custodian | omnibus claim, timing, custody gov | aggregation, mempool visibility |
| Miner / cutoff influence | include/exclude near tip | block content, reorg risk |
| Honest charity | retain funds for mission | operational policy |
| Colluding charity | rebate / side deals | out-of-protocol payments |
| Donor-controlled entity | circular funding | control both sides |
| Stolen/tainted source actor | monetize dirty control | crypto-valid claim |
| Speculator | secondary price | transferable unit |
| Secondary accumulator | post-genesis concentration | buy float |
| Governance coalition | majority | split ids + delegate |
| Delegators | convenience | exchange/protocol staking |

## Combined strategies

### A. Whale + charity rebate

**Structure:** large donation + secret rebate rate \(r\) + allocation \(a \approx P e/T\).  
**Conditional EV:** \(a\cdot v + r\cdot e - e\) (source units under assumed \(v\)).  
**Probe:** `results/09_whale_charity_collusion.json` — unprofitable at \(v=0,1/100\); profitable at \(v=1/10,1\).  
**Class:** conditional model.  
**Crypto detectability:** no (design residual).

### B. Exchange + timing advantage

**Structure:** observe denominator trajectory; concentrate late donations; omnibus claim.  
**Allocation math:** linear — equal total \(e\) ⇒ equal total \(a\) whether 1 or 10k outputs (`results/13_exchange_omnibus.json`).  
**Real harm channels:** custody of claim keys, governance aggregation, mempool/timing privilege, UX coercion of users.  
**Class:** structural (custody/timing), not share-inflation vs pro-rata.

### C. Tainted funds + rebate

**Pathway:** stolen-key fixture crypto-ok (design residual) + optional rebate.  
**Profitability:** requires low retention value of tainted asset and/or high \(v\) (`results/10_tainted_sensitivity.json`).  
**Class:** residual risk surface + conditional profitability.  
**Mitigation not in crypto verifier:** AML/policy gates, non-transferable claims reduce resale.

### D. Sybil splitting + governance acquisition

**Allocation:** useless under pure pro-rata (no gain).  
**Useful under:** concave weights, per-id caps, cap-then-renormalize gov.  
**Probe:** whale gov share \(1/2 \to 9/10\) under 10% cap when split vs rest (`results/11_governance.json`).  
**Class:** mathematical/structural under weak identity.

### E. Undersubscription + speculative coordination

**Structure:** small \(T\) ⇒ huge quanta per sat; public undersub signals rush.  
**Class:** structural pathway; magnitude needs participation model.  
**Related product choice:** fixed \(P\) independent of \(D\) creates floating implied ratio (not a legal label here).

### F. Miner influence + late denominator shock

**Structure:** inclusion near cutoff alters eligible set; early donors diluted (`results/05_denominator_uncertainty.json`).  
**Class:** structural on real chain; synthetic header model only bounds confirmations.  
**Mitigation candidates:** sealed precommitment windows, longer confirmation, clearer nonclaims on miner neutrality.

### G. Charity-set capture + off-chain side agreements

**Structure:** genesis set design + collusion outside protocol.  
**Class:** social/governance residual (design: genesis operator honesty out of scope).  
**Crypto:** exact script binding only.

### H. Secondary-market accumulation + token-weighted governance

**Structure:** even fair genesis distribution re-concentrates if units transferable and gov follows holdings.  
**Class:** structural; not simulated order book.  
**Mitigation:** nontransferable gov, continuous caps with identity, delayed transfer — each moves risk (identity, lockup markets).

## What is cryptographically detectable vs not

| Attack element | On-protocol? |
|----------------|--------------|
| Double claim same (txid,vout) | yes (nullifier) |
| Wrong charity script | yes |
| Front-run different PQ key | yes (commitment bind) |
| Rebate | **no** |
| Tainted legal title | **no** |
| Sybil without identity layer | **no** |
| Secondary buy-up | **no** (post-allocation) |
| Side agreements | **no** |

## Combined-attack summary

No single probe proves “the mechanism always collapses.” Several probes prove **permissionless anti-concentration formulas fail**, **transferability is not required for stated receipt functions**, and **worst-case rebate/tainted pathways exist** with severity controlled by product choices (\(\alpha\), transfer regime, gov rule) and external parameters (\(v\), enforcement).
