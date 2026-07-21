# S1 input brief — product/ledger function menu

**Authority:** NONE. Complete **after R1 retest**. Do not start S1 implementation until R1 lands.

## Required questions S1 must answer

For each candidate function: **must / should / must-not**, and whether it requires:

- non-transferable receipt only  
- delayed convertibility  
- transferable unit  
- no token at all  

## Starter matrix (edit in S1; do not treat as final)

| Function | Default stance | Token needed? | Notes |
|----------|----------------|---------------|-------|
| Prove charitable/public contribution payment | **MUST** | No | Core protocol |
| Bind claim / migration destination fail-closed | **MUST** | No | Nullifier / PQ bind in design pack |
| Conserve declared allocation pool under accepted inputs | **MUST** | No | **R1 enforces model-side** |
| Independent verification without operator trust | **MUST** | No | Open receipts + tests |
| Non-transferable contributor credential | **SHOULD** | No (credential ≠ coin) | NTIR-class |
| Permissionless claim submission | **SHOULD** | No | Sybil policy explicit in S4 |
| Network bootstrap ownership distribution | optional | Delayed maybe | Not default transferable |
| Fee payment for services | optional | Maybe | Classic money function — justify |
| Staking / operator bond | optional | Maybe | Operators ≠ donors |
| Store of value / private stable | **MUST-NOT for v1** | Would need full research program | Haven hard problem |
| Immediate liquid donor reward | **MUST-NOT for v1** | Yes — reject | Farming surface |
| Unencrypted public quadratic ballot | **MUST-NOT until justified** | — | Dual-use / MEV / bribes |

## Transfer decision rule (S2)

```text
IF every MUST function is achievable without alienable units
  THEN keep NONTRANSFERABLE_OR_DELAYED_DEFAULT
ELSE
  attach executable necessity proof per alienable feature
  + falsifier that would reverse it
```

## What to take from Gemini (allowed)

- Non-transferable impact credential framing  
- Staged convertibility as a *later* option  
- Evidence ladder shape  
- Anti-patterns: liquid rewards, un-preregistered pilots, AI-agreement-as-science  
- Industry surfaces: OSS grants, carbon verification, municipal DPI — as **adoption hypotheses**

## What to reject from Gemini for now

- Immediate $100k field pilot  
- MACI/Passport/biometrics as mandatory v1  
- Confidence “0.88” as calibrated  
- “Structurally eliminates side contracts”

## Empirics (S6) only after S1

Measure the product you specified — not a generic lottery narrative.
