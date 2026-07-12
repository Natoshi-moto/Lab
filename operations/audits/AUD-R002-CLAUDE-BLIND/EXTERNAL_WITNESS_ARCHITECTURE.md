# External-witness architecture

## Construction

The immutable audit subject is the Git tree identified by the annotated tag `baseline-001` and target commit `7a8068fc6088b81cc9a7c94b49dc77e0abe592d8`. Its deterministic transport archive has SHA-256 `33d3fb549d49e1ad02ac2b2880b5ab4336a6dc29a7142d3e33e4ec2694ad8603`.

R002 is a later, append-only audit overlay. It stores a copy of that archive, the digest declaration, target declaration, route pack, charter, test plan, return contract, empty inbox, empty ledger, and pack manifests. The archive is intentionally not required to exist inside the tree it snapshots: including the completed archive within its own payload would require a digest-dependent self-reference.

## Required bindings

The overlay is valid only when independently checked properties agree:

- `baseline-001` resolves to `TARGET.json.target_commit`;
- the recorded annotated tag object has not been replaced;
- the snapshot's embedded source commit equals `TARGET.json.target_commit`;
- the archive bytes equal `TARGET.json.target_archive_sha256`;
- the route pack digest and route baseline equal the target declaration;
- each observation repeats the exact target commit and archive digest;
- the observation ledger remains append-only and hash-chained.

Substitution, tag movement or replacement, digest mismatch, and ambiguous route/target binding are failure conditions, not acceptable alternative constructions.

## Non-claims

This architecture does not claim that the target is correct, complete, secure, release-ready, or independently corroborated. It does not claim that Git tags cannot be moved, only that checked movement or replacement is detectable. It does not make the later overlay part of the earlier subject tree. A passing verifier establishes only its implemented bindings and checks. A second Anthropic account is differential review, not automatically independent corroboration.
