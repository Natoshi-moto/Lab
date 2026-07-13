# R015 claim matrix

| Claim | State | Required evidence |
|---|---|---|
| A separately implemented Node verifier reproduces the frozen four-record R014 transcript | CANDIDATE | Exact canonical cold report and hostile mutation tests |
| Every embedded record, receipt and prefix anchor is recomputed rather than trusted | CANDIDATE | Per-record hashes and prefix-anchor IDs in the cold report |
| A separately supplied matching anchor is classified as an exact prefix | CANDIDATE | Anchored fixture run plus ahead/divergent/malformed failures; classification does not authenticate provenance |
| No separate anchor proves freshness | FALSIFIED BY DESIGN | Required `UNANCHORED` result and explicit nonclaim |
| The bounded abstract crash/retry lifecycle satisfies preregistered invariants | CANDIDATE | Deterministic exhaustive model report and killed mutants |
| R014 is independently externally audited | UNVERIFIED | Same project/provider and synthetic fixtures are insufficient |
| Physical power-loss durability | UNVERIFIED | No device, kernel, filesystem or power-cut campaign |
| Safe store of economic value | UNVERIFIED | No value, backing, custody, keys, recovery or market evidence |
| Network double-spend prevention or global finality | UNVERIFIED | No network or consensus protocol |
| Production security or availability | UNVERIFIED | Bounded research prototype only |

All candidate evidence has `status_authority: NONE`. Only a later explicit user
decision may promote the bounded research disposition; it cannot convert a
nonclaim into evidence.
