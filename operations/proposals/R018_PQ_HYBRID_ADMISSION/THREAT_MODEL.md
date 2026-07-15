# R018 threat model

## In scope

- removal of the PQ authorization from an otherwise valid R016 event;
- Ed25519-only downgrade under the R018 policy;
- algorithm, policy, controller, epoch, key, network, and event replay;
- event-byte and signature mutation;
- public-key substitution, including recomputed key and policy identifiers;
- self-consistent rewriting of the policy to add a classical-only fallback;
- unknown override fields and noncanonical or oversized inputs;
- one verifier accepting bytes rejected by the other;
- accidental addition of signing/private-key surface to the primary gate; and
- dependency or runtime drift away from pinned versions.

## Assumptions

- NIST FIPS 204 ML-DSA-65 remains cryptographically sound for the intended
  security horizon.
- the minor potential corrections identified in NIST's February 2026 FIPS 204
  planning note do not invalidate the exact tested encodings; any future
  semantic revision requires a new explicit R018 successor policy.
- Node 24.14.0 and Noble 0.6.1 correctly implement the tested algorithm and
  encodings.
- npm installs the exact R018-local lock entries whose registry integrity
  values and installed Noble manifest/entrypoint hashes are rechecked by the
  evidence gate.
- SHA-256 domain commitments and the canonical encoder behave as specified.
- the exact policy is obtained through an authentic channel and is not silently
  replaced before verification.
- R016 remains the authoritative transition evaluator after PQ precheck.

## Deliberate omissions

The controller-to-PQ-key binding is frozen public test data. R018 does not
establish how a real controller securely enrolls that key, proves migration
from an existing key, rotates it, recovers it, or stores its private half. It
does not test entropy, secure deletion, hardware devices, display integrity,
malware, coercion, social recovery, supply-chain compromise, timing leakage, or
fault injection.

The two verifiers run on one host in this experiment. Code separation and
different cryptographic implementations are not organizational independence,
independent deployment, or an external audit.

R018 does not prevent a caller from invoking the legacy R016 API directly. It
detects downgrade only inside the R018 verification profile; mandatory
network-wide selection of that profile is outside scope. Repository writers can
also publish new code or a new policy. The frozen identifier makes such a
change distinguishable; it does not make repository mutation impossible.

## Immediate kill criteria

The proposal fails if any of the following occurs:

- R016-only authorization passes the hybrid profile;
- a missing, unknown, or weakened policy reaches a PQ PASS;
- either verifier accepts event, key, signature, policy, controller, or epoch
  substitution;
- the PQ gate emits state-transition acceptance or bypasses R016;
- the two verifiers disagree on any frozen positive or attack vector;
- R018 rewrites the frozen predecessor root dependency manifest or lock;
- the experiment-local dependency manifest, lock, integrity, or installed
  Noble entrypoint differs from the pinned evidence;
- fixture regeneration is not byte-identical;
- the primary gate gains a signing/private-key/policy-update path; or
- any artifact claims unbreakability, complete post-quantum security, money,
  stable value, consensus, finality, production readiness, or live-fund safety.
