# R014 claim matrix

| Claim | State | Evidence | Boundary |
|---|---|---|---|
| A valid signed R013 transfer is acknowledged only after local durable commit | DEMONSTRATED | fsync/rename implementation and fault tests | stated Linux/POSIX model only |
| Exact retry after restart appends nothing | DEMONSTRATED | committed demo and retry test | one local ledger |
| Process failure recovers an old or complete new prefix | DEMONSTRATED | five injected boundaries plus injected fsync-error repair tests | not arbitrary hardware failure |
| Competing cooperative writers serialize | DEMONSTRATED | two-process sibling-spend race | same host/path and cooperating lock users |
| Every durable prefix conserves 1000 synthetic units | DEMONSTRATED | full replay and independent verifier | inherited frozen R013 profile |
| Two language paths reproduce durable receipts/checkpoints | DEMONSTRATED | saved independent replay report and hash-bound schema checks | pinned demo and bounded histories |
| An externally retained head detects rollback below it | DEMONSTRATED | deletion and commit-gate tests | only when genuinely retained elsewhere |
| A local ledger alone detects deletion of its newest valid suffix | FALSE / NOT CLAIMED | explicit truncation test | needs external anchor/monotonic witness |
| Network consensus or global double-spend prevention exists | FALSE / NOT CLAIMED | no network | deferred |
| Safe key custody or recovery exists | FALSE / NOT CLAIMED | no wallet/key lifecycle | mandatory before real value |
| The unit has stable economic value or redemption | UNVERIFIED / NOT CLAIMED | none | requires explicit economic/legal design |
| R014 is suitable for real funds | FALSE / PROHIBITED | synthetic public test keys | zero-value research only |
| R012, R013 or R014 is canonical | FALSE | stacked draft proposals | separate user decisions required |
