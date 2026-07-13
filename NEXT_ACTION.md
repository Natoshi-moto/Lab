# NEXT ACTION

Review R012 and the stacked R013 proposal separately, then decide whether either
should be promoted into `main`.

R012 demonstrates one non-financial bounded work exchange. R013 depends on its
proposal head but uses a separate value-conservation kernel: one frozen
synthetic genesis, transfer-only Ed25519 authorization, creating-transaction
outpoints, exact conservation, competing-spend rejection and byte-identical
Python/OpenSSL versus JavaScript/Noble results. The normative verifier is
path/hash pinned, evidence fails closed, and a bounded abstract model adds
exhaustive conservation coverage without claiming general correctness.

Promotion of R013 would accept only
`DEMONSTRATED_CONSERVATION_KERNEL_ON_SYNTHETIC_HISTORY` as project history. It
would not create money, economic value, backing, redemption, custody, network
consensus, global double-spend prevention, production readiness or a new
canonical snapshot.

Do not merge or promote either proposal without explicit user approval. If a
kill criterion or implementation disagreement appears, preserve the evidence
and keep the affected round unpromoted.
