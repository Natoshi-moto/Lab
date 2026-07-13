# Canonicality constitution

## Definition

`CANONICAL_AS_IS` means:

- these are the exact bytes;
- this was the declared state at a specific commit and time;
- the manifest and digest identify that state;
- later observations cannot rewrite it.

It does **not** mean correct, complete, secure, production-ready, independently verified or endorsed by later reviewers.

Every canonical snapshot carries this sentence:

> This artifact is canonical as a historical, methodological and governance record of exact bytes and declared status. It is not a claim that the contained system is correct, complete, secure or release-ready.

## Snapshot identity

The external SHA-256 of the deterministic ZIP is the transport identity. The package also contains manifests for included payload bytes and package metadata. Verification must check both the external digest and internal manifests.

## Successors

A later snapshot may supersede a target prospectively. It does not alter the historical target. The relationship is recorded in the canonicality graph or release ledger.
