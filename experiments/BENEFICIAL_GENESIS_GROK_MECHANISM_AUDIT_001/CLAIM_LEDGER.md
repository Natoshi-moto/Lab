# Claim ledger

Confidence is claim-specific. Classes: `math`, `reproduced`, `structural`, `conditional`, `empirical_open`, `policy`, `legal_out_of_scope`.

| ID | Claim | Class | Confidence | Status |
|----|-------|-------|------------|--------|
| CL1 | Floor pro-rata + unissued remainder never issues more than \(P\) | math, reproduced | high | CONFIRMED |
| CL2 | Linear split does not increase splitter’s total allocation (may decrease) | math, reproduced | high | CONFIRMED |
| CL3 | Concave weights without identity are Sybil-exploitable vs competitors | math, reproduced | high | CONFIRMED |
| CL4 | Per-identity caps without durable identity are Sybil-evaded | math, reproduced | high | CONFIRMED |
| CL5 | Cap-then-renormalize gov still fails under multi-id whale vs outsiders | reproduced, structural | high | CONFIRMED |
| CL6 | Pro-rata concentrates allocation exactly with weight share (floor dust) | math, reproduced | high | CONFIRMED |
| CL7 | Denominator growth dilutes fixed early \(e\) | math, reproduced | high | CONFIRMED |
| CL8 | Fixed \(P\) makes quanta-per-sat sensitive to \(T\) (under/over subscription) | math, structural | high | CONFIRMED |
| CL9 | Transferability not necessary for F1–F4 | structural | high | CONFIRMED |
| CL10 | Transferability may be needed for some unspecified F7 functions | policy open | medium | UNRESOLVED_SCOPE |
| CL11 | Rebates reduce charity net proportional to access×rate | conditional model | high (math of model) | CONFIRMED_IN_MODEL |
| CL12 | Rational donors will always destroy charity net via rebates | empirical_open | low as universal | NOT_ESTABLISHED |
| CL13 | Tainted crypto-valid claims can be admitted | structural (design residual) | high | CONFIRMED_PATHWAY |
| CL14 | Tainted donation-for-claim is always profitable | conditional | low as universal | NOT_ESTABLISHED |
| CL15 | Token-weighted gov enables majority by large donation alone | structural conditional on rule | high if rule chosen | CONDITIONAL |
| CL16 | Exchange omnibus increases pro-rata allocation vs equal total self-custody | math | high | FALSE (equal total \(e\) ⇒ equal total \(a\)) |
| CL17 | Exchange omnibus concentrates custody/control | structural | high | CONFIRMED_CHANNEL |
| CL18 | Mechanism is mainnet-ready | empirical/engineering | n/a | REJECTED — RESEARCH_ONLY |
| CL19 | Social benefit exceeds simpler non-token alternatives under F1-only | policy + empirical | low | UNDERDETERMINED |
| CL20 | Non-transferable receipt can serve F1–F4 | structural | high | CONFIRMED |
| CL21 | Prior econ packages’ CONTINUE_WITH_CONDITIONS aligns with this seat | post-freeze differential | medium-high | AGREED_DIFFERENTIAL |
| CL22 | Sibling 2×2 audits validate this seat | n/a | n/a | NOT_USED (blind) |

## Falsifiers (selected)

- CL1: integers with \(\sum \lfloor P e_i/T\rfloor > P\).  
- CL3: concave \(f\) with no Sybil gain for all partitions against competitors.  
- CL9: specified v1 function unachievable without alienable units, F1–F4 held.  
- CL12: would need behavioral evidence; currently open.  
- CL16: already falsified by probe `13_exchange_omnibus.json` for pure allocation totals.
