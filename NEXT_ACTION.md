# NEXT ACTION

Commission R015: an independent cold verifier for R014 durable records and
caller-held anchors, plus a bounded crash-lifecycle model.

R014 is now bounded demonstrated project history under a separate
user-authorized promotion receipt. Its frozen proposal status and evidence
remain `status_authority: NONE`; promotion changes repository disposition, not
the authority of any receipt, anchor or report. The R001 canonical snapshot
remains unchanged.

R015 should consume an exported, closed transcript without importing the
Python durability implementation, reproduce every record and anchor hash, and
model the allowed pre-commit/post-commit/retry states across bounded failure
schedules. Any disagreement, hybrid state, duplicate retry, invalid prefix or
anchor mismatch must fail closed.

Do not introduce even synthetic signing or recovery keys until this independent
durability gate passes. Continue to exclude real funds, custody, backing,
redemption, networking, consensus and production claims.
