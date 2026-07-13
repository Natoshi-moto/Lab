# R013 claim matrix

| Claim | State | Evidence | Boundary |
|---|---|---|---|
| One pinned synthetic genesis contains exactly 1000 units | DEMONSTRATED | frozen genesis ID, both replay reports | only the frozen fixture |
| Accepted transfers conserve supply | DEMONSTRATED | every accepted-prefix checkpoint reports 1000; invariant tests | local ordered histories only |
| Creating-transaction outpoints are resolved from replayed state | DEMONSTRATED | valid ancestry chain plus missing/mismatched ancestry attacks | no stateless proof or pruning |
| Full-field Ed25519 ownership authorization is enforced | DEMONSTRATED | Node-native signatures, OpenSSL and Noble verification, mutation/high-S/domain attacks | frozen synthetic keys only |
| A local branch accepts at most the first competing spend | DEMONSTRATED | the exact same signed sibling pair in both arrival orders | not global double-spend prevention |
| Candidate state growth is bounded | DEMONSTRATED | valid growth to 64 UTXOs; attempted growth to 71 rejected | not a network resource market |
| Two implementations converge | DEMONSTRATED | byte-identical 38,186-byte report, SHA-256 `77c97a72…76fbd1` | frozen suite, not all possible histories |
| Conservation holds in a bounded abstract state space | DEMONSTRATED | 5,881 states and 115,266 transitions through depth four | supply 4 abstraction, not full implementation equivalence |
| The PCX four-role decomposition is usable for one conserved claim | CANDIDATE | genesis/transfer/decision/checkpoint profile | not general PCX correctness |
| R013 units have economic value | UNVERIFIED / NOT CLAIMED | none | no backing, market, redemption or scarcity claim outside fixture rules |
| R013 is a safe store of value | UNVERIFIED / NOT CLAIMED | none | custody, consensus, economics and law are absent |
| Network consensus or global finality exists | UNVERIFIED / NOT CLAIMED | none | no network or fork choice |
| R013 is production cryptography | UNVERIFIED / NOT CLAIMED | standards and two libraries only | no independent cryptographic audit |
| R013 or R012 is canonically promoted | FALSE | both branches remain proposals | only user-authorized merge can promote project state |
