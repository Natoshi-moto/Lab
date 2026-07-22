# Creature Data, Lineage and Saves Draft

## Current model

The candidate source defines branded creature/realm/player identifiers, normalized DNA genes, derived locomotion, spatial marks, birth context, manifestation states, battle state and versioned save structures. Persistence uses browser localStorage with primary, pending and backup keys and verifies derivation proofs before committing.

That is a useful vertical-slice safety pattern. It is not yet a portable account or multi-device merge protocol.

## Proposed portable envelope

```json
{
  "schema": "eidolin-creature/1",
  "id": "c:example",
  "identity": {
    "name": "Example of the Glass Fen",
    "generation": 1,
    "origin": "born"
  },
  "dna": {},
  "lineage": {
    "parents": [],
    "birthContext": {},
    "derivationProof": "sha256:..."
  },
  "assistant": {
    "approvedPreferences": [],
    "skillEvidence": [],
    "privateMemoryRefs": []
  },
  "presentation": {
    "portableMotionTraits": []
  }
}
```

This example is proposed. Private Noted content and provider credentials MUST NOT be embedded in a shareable creature file.

## Data classes

| Class | Example | Export default |
|---|---|---|
| Identity | ID, name, DNA, lineage | Included |
| World proof | seed, coordinate, biome, derivation digest | Included |
| Presentation | appearance and portable motion traits | Included |
| Approved learning | user-approved preference with provenance | Private export only |
| Evidence | skill/run/repair receipt references | User-selected |
| Private memory | note excerpts and conversation summaries | Excluded from public card |
| Secrets | API/signing keys | Never |

## Save transaction

```text
validate current state
→ serialize canonical form
→ derive proof/digest
→ write pending
→ read and verify pending
→ move current to backup
→ commit pending as current
→ clear pending
```

Recovery should try a verified current save, then verified pending, then verified backup, without destroying any failed candidate. Errors must identify the failed invariant without printing private content.

## Migration and conflict rules

- Every persisted root carries a schema version.
- Migrations are pure and fixture-tested.
- Unknown future versions fail closed and remain exportable as raw bytes.
- Import previews additions, changes and conflicts.
- Two histories sharing an ID are never silently merged.
- Display timestamps do not participate in deterministic identity.
- Derivation proofs show reproducibility from declared inputs, not ownership or economic value.

## Assistant learning

A future creature preference must include source, time, scope, confidence and user approval. The user can inspect, edit, disable and delete it. Model-generated summaries are not silently promoted to memory. Switching model providers must preserve creature identity while allowing provider-specific caches to be discarded.

## Tests needed

- truncate and corrupt each save slot;
- alter one deterministic input without updating its proof;
- import unknown schema versions;
- merge conflicting histories;
- export/reimport without localStorage;
- remove private fields from public creature cards;
- switch model adapters without changing creature ID;
- delete one learned preference and prove it leaves future context.
