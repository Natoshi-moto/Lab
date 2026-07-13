# R014 threat model

## Protected in this round

- a ledger beneath a real, pre-existing parent whose own directory entry the
  caller has already made durable;
- exact R013 genesis and fixed synthetic supply;
- accepted signed-transfer bytes and creating-transaction ancestry;
- exactly-once local commit and idempotent client retry;
- hash-linked record, receipt, state-root and checkpoint continuity;
- recovery to the same candidate state after the stated process-failure points;
- serialization of cooperative processes using the same local lock;
- detection of rollback below a record head genuinely retained elsewhere.

## Exercised adversaries and faults

- simulated process loss/fault injection before write, after write, after file
  fsync, after rename and after directory fsync;
- two processes racing sibling spends anchored to the same state;
- exact retry after a lost reply;
- byte tampering, missing/misnamed records, sequence gaps and linked/special
  members;
- replacement genesis or unknown ledger members;
- unpinned or disagreeing independent verifier;
- local suffix deletion tested both without and with an out-of-band head.

## Still dangerous and out of scope

- non-cooperating software can ignore `flock`; permissions and process
  isolation are not a hostile multi-tenant security boundary;
- a privileged attacker can replace the program, ledger and any anchor stored
  in the same failure domain;
- filesystem, kernel, firmware and storage hardware can violate assumed
  durability semantics;
- missing or newly created path ancestry above the required ledger parent is
  outside the durability claim; R014 refuses to create a missing parent;
- global ordering, data availability, network partitions, fork choice and
  finality do not exist;
- private-key custody, transaction display, backup, recovery, coercion and
  compromised-device signing are absent;
- no backing, liability, redemption, market or purchasing-power design exists;
- privacy, traffic analysis, governance, distribution and regulation are
  unaddressed.

R014 must never be used with real keys or value. Its record-head anchor is a
rollback-detection input, not a timestamp, signature, consensus certificate or
proof that the ledger remained available.
