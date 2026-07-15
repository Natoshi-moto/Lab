# R018 fixed hybrid post-quantum admission protocol

## Scope

R018 is a verifier-only admission layer over one exact R016 event. It does not
replace or weaken R016. A passing R018 result means only that an exact canonical
R016 event carries an authorization under one exact ML-DSA-65 policy and may be
submitted to the unchanged R016 gate.

## Canonical objects

### Policy

The policy is exact canonical ASCII JSON with schema
`nexus.r018-pq-admission-policy/v0`. Its `policy_id` is SHA-256 over a
length-framed, domain-separated canonical policy with `policy_id` set to 32
zero bytes. It commits:

- network, R016 profile, and R016 version;
- ML-DSA-65 as the only admitted algorithm;
- `ALL_OF_R016_AND_ML_DSA_65` as the decision;
- `NONE` as fallback;
- `REJECT` for missing authorization and unknown policy; and
- one exact controller, controller epoch, key ID, and raw public key binding.

The key ID separately commits the exact 1,952-byte FIPS 204 ML-DSA-65 public
key with its own length-framed domain.

### Authorization

The authorization is exact canonical ASCII JSON with schema
`nexus.r018-pq-authorization/v0`. It binds algorithm, network, controller,
controller epoch, event SHA-256, key ID, policy ID, authority, and signature.
The signed message is the full exact authorization with `signature_base64`
set to the empty string, length-framed under
`NEXUS/R018/PQ-AUTHORIZATION/v0`.

### Report

Both verifiers emit the exact same canonical report. Its decision is
`PQ_PRECHECK_PASS_R016_STILL_REQUIRED`. No report field declares event
acceptance, finality, value, or authority.

## Decision procedure

1. Enforce document bounds, ASCII, exact canonical JSON, string-only scalar
   types, exact field sets, and fixed byte lengths.
2. Recompute and compare `policy_id` and `key_id`.
3. Reject any policy semantic other than the compiled no-fallback profile.
4. Parse the exact R016 event and bind network, profile, version, controller,
   controller epoch, and exact event bytes.
5. Require authorization, event, and policy identifiers to agree exactly.
6. Verify ML-DSA-65 over the domain-separated authorization message.
7. Emit a PQ precheck report only.
8. Submit the original unmodified event bytes to the unchanged R016 gate.

There is no timeout-to-pass, single-verifier fallback, Ed25519-only fallback,
unknown-policy default, policy alias, key alias, manual override, repair,
signing, or promotion path.

This decision procedure is mandatory only for callers choosing the R018
wrapper. R018 does not disable the legacy R016 API or establish a consensus rule
requiring other machines to use this wrapper.

## Cryptographic implementation boundary

The native verifier uses the Node 24.14.0 ML-DSA-65 implementation. The cold
verifier uses Noble 0.6.1 from an R018-local exact lock and duplicates the
policy/envelope logic rather than importing the native gate. The predecessor
root package manifest and lock remain byte-identical to R015/R016. Bidirectional
generated-signature tests require each implementation to accept the other's
exact ML-DSA-65 encoding.

This establishes conformance between two implementations for the tested
vectors. It does not establish algorithmic security, implementation
correctness for every input, side-channel resistance, or certified operation.

## Version and migration rule

V0 has no migration mechanism. Any future algorithm, key, controller epoch,
binding, or policy semantic must use a new explicit policy and identifier. A
future proposal may add only a separately reviewed transition; it may not
reinterpret this policy ID or cause an existing V0 verifier to accept unknown
policy bytes.
