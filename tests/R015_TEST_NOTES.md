# R015 test notes

The R015 tests bind a deterministic four-record closed transcript, a separately
supplied but unauthenticated tip-anchor fixture, the cold-built Node verifier,
and the standalone abstract model.
Hostile transcript mutations are resealed at the outer transcript-ID layer so
they reach the intended inner invariant. Model self-tests deliberately enable
known-bad transition semantics and require every mutant to be killed.

The tests also freeze the promoted R014 hash-bound files. They do not test real
keys, money, backing, recovery, networks, power loss, storage hardware,
production availability, or external audit.
