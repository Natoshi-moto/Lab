# Mechanism necessity — BGEN-ECON-BREAKER-001

**Status authority:** NONE  
**Evidence class:** structured comparison under declared assumptions; not empirical adoption proof  

## 1. What the design actually specifies

From `BENEFICIAL_GENESIS_DESIGN_001`:

- Charity-bound migration **receipt** proving control + payment + PQ destination binding.
- Fixed-pool proportional **allocation claim** after epoch close.
- No redemption promise, no oracle price, no mutable charity registry.

The design pack does **not** fully specify the target new ledger’s ongoing economic functions (payment medium, staking asset, fee token, etc.). Per REV-004, necessity of **transferability** cannot be closed without that specification.

## 2. Comparison set

| Alternative | Charity transfer | Migration binding | New economic unit | Transferable | Notes |
|-------------|------------------|-------------------|-------------------|--------------|-------|
| A. Direct donation, no token | yes | optional receipt | no | n/a | Maximizes simplicity; no new-ledger bootstrap |
| B. Proof-of-burn migration | burn not charity | yes | optional | optional | Destroys source value; weaker public-benefit story |
| C. Pro-rata snapshot airdrop, no donation | no | weak | yes | usually | No charity funding |
| D. Charity-directed protocol fees | ongoing | no genesis claim | fee unit | varies | Different time profile |
| E. Non-transferable recognition receipt | yes | yes | claim/reputation | no | Preserves receipt; blocks resale surface |
| F. Transferable fixed-pool allocation | yes | yes | yes | yes | Current default reading of “allocation units” if listed/traded |
| G. Hybrid: transferable econ unit, nontransferable gov | yes | yes | split | split | Separates FC3 surface |
| H. Nontransferable receipt → later convert under separate gate | yes | yes | delayed | delayed | Defers transferability to a later economic gate |

## 3. Functions that might require a transferable unit

These are **hypotheses about a future ledger**, not properties proven by the design pack:

1. **Payment medium** on the new ledger.  
2. **Staking / economic security** collateral.  
3. **Fee** payment for ledger resources.  
4. **Capital allocation** (collateral in markets).  
5. **Ownership distribution** bootstrap of a network.  
6. **Liquidity / price discovery** (often convenience, not public-good necessity).

A non-transferable receipt preserves (charity payment + migration binding) but does **not** automatically supply (1)–(5). Claiming that transferability is “unnecessary” without stating whether (1)–(5) are in scope **overreaches**. Claiming transferability is “required for charity” also overreaches — charity settlement is complete at source-chain payment.

## 4. What unique public benefit requires transferability?

**Strict answer under current design text:** none that is *necessary for the charitable migration receipt itself*.

**Open answer for a full ledger product:** transferability may be necessary for declared ledger functions (1)–(5). Those functions are not fixed in the subject design; therefore:

- **FC1 (token necessity)** remains an open redesign question, not a closed mathematical disproof.
- A transferable unit **does** add resale, secondary concentration, and speculative-demand surfaces (REV-007.6).
- If the program only needs migration receipts + charity settlement, alternatives A/E/H dominate on complexity and attack surface.

## 5. Recommendation on necessity (this seat)

| Question | Decision |
|----------|----------|
| Is a transferable token necessary for charity-bound migration receipts? | **No** (not necessary). |
| Is a transferable token ruled out for all new-ledger functions? | **No** (functions unspecified). |
| Does current design defend transferability as load-bearing for v1 scope? | **Weak / unspecified** — treat as redesign choice, not proven necessity. |

This supports **conditions** on any continuation (explicit ledger-function spec; consider E/G/H) rather than a pure cryptographic reject.
