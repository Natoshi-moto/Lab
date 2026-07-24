# Claims and non-claims

**status_authority:** `NONE`

## What this package claims

1. It is an internally consistent proposed framework: its invariants,
   prohibited capabilities, allowed primitives, and manifest schema do not
   contradict each other (checked mechanically by
   `tools/validate_closed_world_economy.py` against `TEST_VECTORS.json`).
2. It accurately classifies the existing Lab sources it inspected
   (`SOURCE_AND_CANON_MAP.md`) as of the stated commit, with citations.
3. It surfaces at least one concrete, already-existing contradiction between
   this Lab's declared anti-value doctrine and shipped surfaces
   (`CONTRADICTION_REGISTER.md`), rather than assuming the doctrine is
   already enforced.
4. Passing `tools/validate_closed_world_economy.py` against a candidate
   manifest means **exactly this and nothing more**:

   > The submitted manifest is internally consistent with selected declared
   > invariants.

## What this package does not claim (restated from the operation brief,
   verbatim in substance)

This work is:

- not legal advice;
- not regulatory clearance;
- not token-launch authorization;
- not permission to accept real money;
- not permission to create redeemable assets;
- not evidence that a closed-world economy already exists;
- not proof that users cannot create external markets;
- not a guarantee against harm;
- not permission to deploy to real users;
- not permission to weaken `NO_REAL_WORLD_TOKEN_OR_ECONOMIC_VALUE`
  (`STATUS.json`'s standing red) or any other existing Lab invariant;
- not evidence that passing tests proves legal, social, or economic safety.

## Specific non-claims about the validator and test vectors

- A manifest that passes validation has not been reviewed by a security
  specialist, an economist, a lawyer, or a harm-reduction specialist.
- A manifest that passes validation may still describe a system that is
  boring, unfair, exploitative in ways this schema doesn't capture, or
  simply a bad idea — internal consistency is not a quality or ethics bar.
- The validator checks the shape and stated content of a manifest. It
  cannot check whether an actual implementation matches its manifest — that
  is `IMPLEMENTATION_GATES.md`'s job, and even that is a proposed gate list,
  not a guarantee.
- Test vectors in `TEST_VECTORS.json` are synthetic. Passing all of them
  demonstrates the validator behaves as designed against known cases; it
  does not demonstrate the validator catches every possible violation an
  adversarial manifest author might construct.

## Specific non-claims about the canon research in this package

- `SOURCE_AND_CANON_MAP.md` reflects sources as read at the stated commit by
  this seat, on this date. It is not a claim that no other relevant source
  exists elsewhere in the Lab's history, in the Sandbox repository, or in
  material not indexed by the searches performed.
- Classification as `FROZEN_BASELINE`, `ACCEPTED_MAIN`, etc. describes each
  source's *own stated status*, cross-checked against `constitution/
  AUTHORITY.md`. It is not this proposal's independent legal or
  epistemological judgment about whether that stated status is deserved.

## Relationship to existing Lab doctrine

This package does not supersede, weaken, or amend `WHY_NOT_TO_TRUST_THIS_PROJECT.md`,
`STATUS.json`, `constitution/`, `BGEN-CANONICAL-CHECKPOINT-001`, or
`operations/LANGUAGE_STANDARD.md`. Where this package restates their
doctrine, it does so as translation and elaboration for future
implementations, not as a replacement text. Any conflict between this
package and those sources should be resolved in favor of those sources
until an operator-authorized amendment says otherwise.
