# R013 threat model

## Assets protected in this round

- integrity of one frozen synthetic genesis;
- exact conservation of its `1000` test units;
- correct ownership authorization for frozen test keys;
- creating-transaction ancestry and local unspent-state integrity;
- deterministic decisions and candidate roots across two implementations;
- separation between candidate evidence and user-controlled promotion.

## Adversaries exercised

- malformed or ambiguous JSON producer;
- attacker replaying an object into another network/genesis/domain;
- producer attempting inflation, output substitution or forged ancestry;
- owner/witness substitution and signature mutation;
- competing local spends in either arrival order;
- stale candidate producer;
- implementation monoculture or canonicalization divergence;
- parser resource abuse through deep nesting or oversized numeric forms;
- report or checkpoint attempting authority escalation.

## Fail-closed posture

Unknown fields, unavailable ancestry, malformed signatures, alternate genesis,
unexpected owner keys and non-canonical bytes reject. A rejection never edits
state. Checkpoints recompute supply and roots; they cannot assert them into
existence.

## Out of scope and still dangerous

- global ordering and double-spend prevention;
- distributed data availability and liveness;
- checkpoint import/restart, durable persistence, crash recovery, atomic
  external settlement and concurrent writers;
- key generation, storage, backup, recovery and human confirmation;
- compromised-device signing and transaction-display attacks;
- privacy and graph analysis;
- economic backing, solvency, redemption, liquidity and purchasing power;
- fair issuance, fees, incentives, validator selection and Sybil resistance;
- governance capture, software distribution, upgrade coordination and supply
  chain compromise;
- legal ownership, consumer protection and financial regulation.

The committed private seeds are publicly disclosed test fixtures. They must
never protect real value. Key loss in a future design would freeze an output;
key compromise would authorize theft. R013 supplies no recovery override.

## Dependency risks

R013 is stacked on unpromoted R012 head
`f28dc07bf1433bb22e4d992a7f523503387ea445`. R012's BWX ledger is not reused as
a value ledger. Its wall-clock expiry, POSIX lock and Python-specific ZIP logic
remain confined to its non-financial claim.

The two R013 signature verifiers are OpenSSL and Noble Ed25519. Convergence is
stronger than one implementation, but it is not a cryptographic audit. The npm
dependency is exactly pinned and lockfile-bound; a future production design
requires dependency review, reproducible builds and independent audit.
