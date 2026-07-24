# Model adequacy

## Discipline

| Result type | Meaning |
|-------------|---------|
| Mathematical deduction | Follows from stated rule + arithmetic |
| Reproduced executable | Deterministic probe in this package |
| Structural pathway | Mechanism permits channel; magnitude unknown |
| Conditional model | True under declared parameters (e.g. \(v\), \(\alpha\)) |
| Empirical hypothesis | Needs external data |
| Policy choice | Product/governance decision |
| Legal question | Out of seat; Track F |
| Unresolved | Cannot close with current evidence |

## Endogenous vs exogenous

| Variable | Often held fixed in synthetic models | Should respond? |
|----------|--------------------------------------|-----------------|
| Total donation volume \(D\) or \(T\) | yes | yes — to expected allocation value, status, tax, narrative |
| Participation rate | yes | yes |
| Donor composition (whale vs retail) | yes | yes |
| Charity selection | sometimes | yes if multi-charity + rebate access differs |
| Rebate access \(\alpha\) | parameter | endogenous to enforcement, reputation, set design |
| Speculative demand | assumed \(v\) | endogenous if transferable |
| Secondary liquidity | omitted | endogenous if transferable |
| Displaced baseline giving | omitted | welfare-critical |

**Implication (C10):** rankings that treat \(T\), \(\alpha\), and \(v\) as exogenous can reverse when agents optimize. Probes here map **possibility and direction under assumptions**, not equilibrium incidence.

## Accounting identities (not welfare)

Separate:

1. **Additional giving** — would not have been donated otherwise  
2. **Displaced giving** — redirected from other charities/causes  
3. **Mercenary flow** — net private EV positive under assumed \(v\)  
4. **Rebate-seeking flow** — driven by \(\alpha r\)  
5. **Tainted flow** — unauthorized source assets  
6. **Retained source value** — opportunity cost of not holding/selling  
7. **Charity net** — \(D -\) modeled rebates (not “impact”)  

Synthetic models can report (3)–(6) under assumptions; (1)–(2) and true social welfare require external data and normative weights.

## Major models — adequacy cards

### M1 Floor pro-rata allocation

| Item | Status |
|------|--------|
| Endogenous | none in pure math |
| Exogenous | \(P\), \(\{e_i\}\) |
| Unmeasured | who chooses \(e_i\) |
| Omitted | participation game, secondary market |
| Strength | supply conservation proven |
| Weakness | silent on fairness, welfare, transferability |

### M2 Concave / capped allocation

| Item | Status |
|------|--------|
| Critical assumption | durable identity |
| Countermodel | Sybil split without identity |
| Parameter region reverse | with perfect identity, caps work; without, fail |
| Verdict | **not** a permissionless fairness fix |

### M3 Rebate net

| Item | Status |
|------|--------|
| Pathway | structural, out-of-protocol |
| Direction | rebates reduce charity net |
| Magnitude | \(\alpha r\) — empirical |
| Inevitability | **not** shown; low-friction collusion is worst case |
| Sign sensitivity | net monotone in \(\alpha r\); no reversal |

### M4 Tainted EV

| Item | Status |
|------|--------|
| Pathway | crypto ≠ title (design residual) |
| Profitability | region of retention vs alloc value |
| Do not claim | predictable laundering volumes |

### M5 Whale+rebate+token value

| Item | Status |
|------|--------|
| Sign of whale net | **reverses** with assumed \(v\) (`results/15_sign_sensitivity.json`, `09_whale_charity_collusion.json`) |
| Low \(v\) | unprofitable in probe |
| High \(v\) | profitable under same rebate access |
| Lesson | do not call attack “predictable” merely because profitable once access and \(v\) assumed |

### M6 Governance

| Item | Status |
|------|--------|
| Capture by donation | iff token-weighted (or similar) rule adopted |
| Cap durability | fails under Sybil identity or post-transfer markets |
| Omitted | delegation markets, exchange custody voting |

## What more simulation cannot resolve

- Real participation elasticities  
- Charity-sector rebate norms and enforcement  
- Market microstructure of a non-existent token  
- Legal classification of floating allocation ratios  
- Real Bitcoin miner/censorship incidence  
- Real PQ security  

These require empirical work, domain experts, or qualified legal/engineering seats — not denser synthetic grids alone.

## Illustrative parameters

All numeric \(v\), \(\alpha\), lockups, and population sizes in this package are **illustrative**. They are not claimed realistic without external evidence.
