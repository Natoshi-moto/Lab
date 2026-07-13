# NEXT ACTION

Commission R014 `PCX_DURABLE_REPLAY` from the post-promotion `main` head.

R012 and R013 are now bounded demonstrated project history under separate
user-authorized promotion receipts. Their frozen proposal-time status and
reports remain immutable evidence; the root status and promotion receipts are
the live disposition. The R001 canonical snapshot remains unchanged.

R014 must test whether the R013 synthetic conserved state can survive process
failure and restart without loss, duplication, inflation, hybrid state or
silent repair. Use an append-only local rollback-journal database, rebuild state
by exact replay from the frozen genesis, acknowledge only after durable commit,
and expose caller-held anchors so rollback detection is testable when an
independent anchor is supplied.

Keep the experiment synthetic and local. Do not add real funds, real custody,
key generation, issuance, backing, redemption, networking or consensus. A pass
may support only a bounded crash-consistent local-recovery claim under the
declared runtime, filesystem and fault model.
