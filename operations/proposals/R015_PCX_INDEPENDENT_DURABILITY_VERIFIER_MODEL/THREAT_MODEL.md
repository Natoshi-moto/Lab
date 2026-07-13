# R015 threat model

## In scope

- correlated or dishonest fields in the exported transcript;
- malformed, duplicate-key, noncanonical, oversized or authority-escalating JSON;
- transfer, signature, receipt, root, sequence, linkage and anchor mutation;
- exact retry represented as an illicit second durable record;
- truncated, reordered, gapped and hybrid histories;
- future, divergent, malformed and stale caller anchors;
- lifecycle errors around begin, replay, stage, commit, acknowledgement loss,
  exact retry, sibling conflict and capacity;
- a verifier accidentally importing the producer or existing implementations;
- nondeterministic or insensitive abstract models;
- evidence or claim authority escalation.

Anchor mismatch classes describe relationships between caller-supplied bytes
and a transcript. Because the anchors are only self-hashed, those classes do
not establish that an operational rollback, fork, or tampering event occurred.

## Required attacker successes that must fail closed

An attacker may freely alter and reseal the transcript's outer ID, present a
self-consistent but divergent anchor, repeat an accepted signed transfer, splice
pre/post fields, or force every modeled crash point. No inner disagreement may
produce `PASS`, no failure may repair the input, and no acknowledged abstract
request may be absent from durable history.

## Outside the bounded claim

- the exporter, fixture anchor and repository are not independent trust domains;
- privileged host replacement without a genuinely external newer anchor;
- SQLite engine correctness and crash recovery internals;
- kernel/filesystem/controller bugs, dishonest fsync and physical power loss;
- key generation, wallet recovery, custody, theft and signing-device compromise;
- networking, Sybil resistance, ordering, consensus, finality and availability;
- backing, redemption, price, liquidity, law, regulation and economic value;
- external audit, unbounded proof and production readiness.
