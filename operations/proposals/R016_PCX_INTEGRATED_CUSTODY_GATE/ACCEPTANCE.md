# R016 acceptance and kill criteria

R016 may carry only
`DEMONSTRATED_SYNTHETIC_CONTROLLER_BOUND_KEY_ROTATION_REVOCATION_AND_QUORUM_RECOVERY_UNDER_ONE_CRASH_CONSISTENT_LOCAL_ORDER`
when every gate below passes on one exact proposal head.

## Required gates

1. All 45 pinned R015 predecessor objects and the R001 canonical target remain
   exact.
2. Frozen genesis and fixture vectors rebuild byte-for-byte from publicly
   labeled derivation using process-scoped temporary key files that are deleted
   and never included in an artifact.
3. Python/OpenSSL and separately implemented Node/Noble replay emit identical
   decisions, receipts, roots, controller states, and supply for the frozen
   suite and closed durable transcript.
4. UTXOs bind stable controllers; the combined root commits complete UTXO and
   controller state, height, and last event.
5. Transfers and all three lifecycle event kinds use one predecessor-root and
   durable writer order.
6. Rotation requires active + guardian + new-key proof; recovery requires two
   distinct guardians + new-key proof; revocation requires two guardians and
   locks terminally.
7. Old, retired, locked, stale-epoch, foreign-role, duplicate, malformed, and
   insufficient-quorum authorization fails without mutation.
8. Lifecycle-only events preserve UTXOs and synthetic supply exactly `1000`;
   transfers preserve controller state.
9. Every paired race is exercised in both arrival orders. At most one sibling
   appends, and no signed envelope is silently rebased.
10. Full replay validates historical events with the key active at each prefix,
    not with the tip key.
11. Precommit hard exits recover the old prefix; postcommit/pre-ack exits recover
    the complete new prefix; exact retry appends at most once.
12. Schema, record, receipt, row, header, and mode mutation fails closed without
    repair.
13. Exact caller anchors classify matching, stale, divergent, ahead, and
    unanchored checkpoints without claiming authenticated provenance.
14. The declared bounded model exhausts its finite state space and kills every
    preregistered mutant.
15. Verifier, model, self-test, fixture rebuild, and evidence-gate runs are
    deterministic and exact-byte reproducible.
16. All reports retain `status_authority: NONE`; no merge or promotion command
    exists.

## Immediate kill

Any task `kill_on` condition falsifies the proposal. In particular, a green run
cannot excuse raw-key ownership, sidecar-only revocation, two sibling commits,
silent rebase, key reactivation, quorum downgrade, quantity mutation, trusted
derived state, a predecessor evidence rewrite, or a broader safety/value claim.
