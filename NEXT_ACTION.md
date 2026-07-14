# NEXT ACTION

Design R017 as a new reversible proposal round that tests multi-host replication and explicit fork evidence over the canonically promoted R016 synthetic custody kernel.

R017 should test deterministic replication, conflicting sibling histories, explicit fork detection, bounded reconciliation evidence, authenticated checkpoint exchange, replay from exact genesis, and fail-closed behavior under delay, duplication, reordering, omission, corruption, and competing writers.

R017 must not claim network consensus, fork choice, global double-spend prevention, global finality, Byzantine fault tolerance, availability, economic security, money, stable value, operational custody, deployment readiness, or authorization for live funds.

R016 is canonically promoted only at exact proposal head `75343b7f00d4ab38a11086180193b8fd26ccd435`, merged by commit `206cd013d5de59a5e12d861223278c0591f4758b`. Its bounded nonclaims remain controlling.
