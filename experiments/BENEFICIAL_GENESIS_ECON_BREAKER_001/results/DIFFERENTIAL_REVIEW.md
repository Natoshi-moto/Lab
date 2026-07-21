# Post-freeze differential review — PR #35 vs independent reconstruction

**Freeze:** `results/CLEANROOM_FREEZE.json`  
**Subject:** PR #35 @ `b5887791338b146daad8f5233ce0e25bf24fe357`  
**Package opened only after freeze.**  

## 1. Scope and method

Compared Claude package paths under:

- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`
- `operations/audits/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`
- `operations/receipts/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`

against this seat’s independent model, the original design pack, issue #34 FCs, and controlling items REV-001…007.

## 2. Agreement matrix (preserve REV-007)

| Finding | Claude | Independent | Disposition |
|---------|--------|-------------|-------------|
| Linear pro-rata split-mass invariant; preserves concentration | Yes (scenario 06) | Yes | **AGREE** |
| Caps / concave Sybil-broken without identity | Yes (05, 26) | Yes | **AGREE** |
| Fixed pool ⇒ denominator uncertainty; undersubscription extreme issuance | Yes (19, 20) | Yes (tiny T gets ~full P) | **AGREE** |
| Conditional rebate reduces charity retention 1:1 | Yes (arithmetic) | Yes | **AGREE** on arithmetic |
| Crypto control ≠ legal ownership | Yes | Yes | **AGREE** |
| Transferability adds resale / re-concentration surface | Yes (qualitative) | Yes (qualitative) | **AGREE** (neither fully models secondary market) |
| Deterministic stdlib simulator; scope-clean paths | Yes | Yes | **AGREE** on engineering hygiene |
| Valuable adversarial package overall | Yes | Yes | **AGREE** — package is useful |

## 3. Disagreements tied to REV items

### REV-001 — stolen-asset opportunity cost — **CONFIRM controlling review**

Claude `model/scenario.py` hard-codes:

```text
laundering_gain = gross_token_value
true_economic_cost_borne_by_attacker = "0"
```

`results/10_stolen_key_donation.json` shows the same, while `donor_economics` charges full donated sats and reports **negative** utility at multiplier 1.0 — internal inconsistency exactly as REV-001 states.

Independent model separates legal basis, opportunity value, gross token, and net profit; under default opportunity assumptions net laundering can be **negative** even when legal basis is 0.

**Verdict:** Claude over-claims “zero-cost fully profitable laundering.” Pathway existence stands; profit does not.

### REV-002 — rebate behavioral prediction — **CONFIRM controlling review**

Claude FC-2: “rational profit-seeking donor behavior is predicted — not merely possible — to erode aggregate charity benefit” based on exogenous rebate rates with no access/enforcement/detection model. Genesis-set immutability is acknowledged weakly then overridden by “finding or creating one colluding charity.”

Independent: conditional 1:1 incidence holds; unconditional prediction does **not**.

**Verdict:** Claude FC-2 trigger is **too strong** for the executable evidence.

### REV-003 — governance as subject defect — **CONFIRM controlling review**

Claude FC-3 treats proportional governance as “default assumption absent an explicit design decision otherwise.” Design pack defines **allocation**, not ledger governance.

Independent: multi-rule comparison; FC-3 only under explicit integration rule.

**Verdict:** Claude over-charges the allocation subject; capture is a **conditional integration risk**.

### REV-004 — mechanism necessity / ledger functions — **CONFIRM controlling review**

Claude concludes transferability has **no** necessary function, treating liquidity/price discovery as mere investor convenience, without testing payment/staking/fee/bootstrap ledger functions.

Independent: transferability not necessary for **charity receipt**; necessity for a full ledger product is **open** until functions are specified.

**Verdict:** Claude’s absolute FC-1 “no necessary function” overreaches design scope; narrower “not necessary for charity+migration receipt” is supported.

### REV-005 — metric / implementation semantics — **CONFIRM controlling review**

| Issue | Evidence in Claude package |
|-------|----------------------------|
| `governance_weight` docs say “renormalized” | Implementation only `min(units, cap)`; **no** renorm (`allocation.py` L126–137) |
| `top_n_share` uses **pool** denominator | `metrics.top_n_share(..., pool)`; HHI uses sum(issued) — mixed denominators |
| Lottery “winners” | `rng.choices(..., k=winners)` — **with replacement** |
| Duplicate donor IDs | dict allocation would overwrite silently (no fail-closed unique-ID guard) |
| Tests encode assumptions | `test_stolen_key_laundering_gain_is_full_gross_value_at_zero_cost` asserts cost `"0"` rather than deriving opportunity economics |

Independent repairs each of these.

### REV-006 — sale / investment-contract wording — **CONFIRM controlling review**

Claude `MECHANISM_NECESSITY.md` §2: “defining behaviour of a **fixed-supply token sale with a floating implied price**” and “sale-like or investment-contract behaviour.”  
Issue #34 forbids legal conclusions; controlling review requires neutral wording.

Independent uses **fixed-pool floating implied exchange ratio** only.

### REV-007 — narrower findings — **PRESERVE**

All six narrower findings re-derived independently; see agreement matrix.

## 4. Additional differential notes

1. **Issue #34 FC list has 7 items** including “mitigation depends on unverifiable identity while claiming permissionless.” Claude’s `FAILURE_CONDITIONS.md` uses only 6 FCs and folds identity into narrative rather than a numbered FC — incomplete mapping of the task’s failure list (though Sybil evidence is strong).

2. **Claude recommendation `REJECT_OR_REDESIGN`** is directionally cautious and appropriate as a *provisional* package stance, but several triggers (FC-1 absolute, FC-2 predictive, FC-3 default gov, FC-4 zero-cost profit) exceed executable support. Controlling adjudication’s `INDEPENDENT_RECONSTRUCTION_REQUIRED` was correct.

3. **Engineering quality:** Fraction arithmetic, seed determinism, beneficial-owner grouping, and scenario breadth are strong. Those strengths do not repair load-bearing economic overclaims.

4. **No content was used from Claude package to build the independent model** (freeze inventory only). Differential used content after freeze.

## 5. Package decision (Claude PR #35)

```text
CLAUDE_PACKAGE_DECISION: HOLD_FOR_REPAIR
```

Not accepted as economic gate result. Not rejected as worthless. Requires repair of REV-001…006 overclaims and metric/implementation issues before any operator gate acceptance. Remains draft; no merge.

## 6. Underlying mechanism decision

```text
UNDERLYING_MECHANISM_DECISION: CONTINUE_WITH_CONDITIONS
```

Charitable-migration + claim-binding concept is not shown to be economically incoherent. Transferable fixed-pool units as currently underspecified should not be defended by default; redesign conditions are listed in this seat’s `FAILURE_CONDITIONS.md`.

Not `ECONOMIC_GATE_PASS`. Not a legal conclusion. Not live-funds authorization.
