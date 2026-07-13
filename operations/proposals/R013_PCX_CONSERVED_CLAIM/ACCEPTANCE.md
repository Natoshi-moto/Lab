# R013 acceptance and kill criteria

R013 may be described only as
`DEMONSTRATED_CONSERVATION_KERNEL_ON_SYNTHETIC_HISTORY` when every gate below
passes on the exact proposal head.

## Required gates

1. The frozen genesis bytes reproduce the pinned genesis ID and exactly `1000`
   units.
2. Split, merge, multi-owner and later-spend ancestry transfers pass.
3. Every accepted prefix has supply `1000`; no rejection changes state.
4. Exact replay returns the original receipt without appending.
5. The exact same two signed sibling spends, replayed in both arrival orders,
   accept at most the first spend on that local branch.
6. Duplicate keys, BOMs, non-canonical bytes, every JSON number form, oversized
   decimal strings, booleans/nulls, hostile Unicode, excessive nesting, foreign domains,
   alternate genesis, stale roots, missing ancestry, creating-output mismatch,
   duplicate inputs, wrong owners, inflation and signature attacks fail with
   stable codes.
7. RFC 8032's one-byte published vector passes in OpenSSL and a mutation fails.
8. The native-crypto vector generator reproduces the committed suite bytes.
9. Python/OpenSSL and JavaScript/Noble emit byte-identical decisions, receipt
   hashes, state roots and checkpoint IDs for the complete frozen suite.
10. More than eight live UTXOs are exercised, the `64`-UTXO state cap is
    enforced, and every emitted checkpoint satisfies its committed schema.
11. The bounded exhaustive model preserves supply across every enumerated
    state and transition through its stated depth.
12. The independent verifier path and source hash are pinned by the normative
    convergence gate.
13. All R012 and repository regression tests pass on the exact head.
14. `./nexus verify` fails closed on missing R013 evidence and reproduces the
    expected report, convergence report and demo bindings.
15. Every R013 object and report retains `status_authority: NONE`; no promotion
    command exists.

## Immediate kill criteria

The version is falsified if either implementation accepts:

- quantity not originating in the frozen genesis;
- any mint, burn, fee, reward or work-derived issuance path;
- negative, zero, fractional, exponent, Boolean, leading-zero or out-of-range
  amount encoding;
- a duplicate, absent, already spent, foreign or creation-mismatched input;
- an invalid, mutated, high-S, truncated, wrong-owner or cross-domain
  signature;
- parser-ambiguous, duplicate-key, unknown-field or non-canonical bytes;
- a candidate state above `64` live outputs;
- the same signed object under another network, genesis or object kind;
- a checkpoint without full replayed data;
- time-dependent validity;
- canonical or promoted status without explicit user action.

Any byte-level disagreement between the two verifiers also kills V0. Repair
requires a versioned protocol change; expected results must not be moved to
match one implementation silently.

## Explicitly deferred

Passing does not authorize real keys, funds, issuance, rewards, fees, custody,
recovery, privacy claims, networking, consensus, fork choice, validators,
staking, governance, identity, Sybil claims, bridges, markets, redemption or
regulatory claims.
