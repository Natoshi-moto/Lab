# Hash call-site audit

The determinism rule is: every hash input must be a serializable string with a versioned namespace. No floats, objects, dates, or wall-clock values should be passed directly.

## S0 `core/deterministic.ts`

- `hashString(str)` is the primitive.
- `rand01(namespace)`, `randRange(namespace, ...)`, and `pick(namespace, ...)` derive deterministic randomness from namespaced strings.
- Terrain uses `terrain:v1:*` namespaces.
- Biome uses `biome:v1:*` namespaces.
- Landmarks use `landmark:v1:*` namespaces.
- Golden sample coverage uses `Glassfen-91` and X samples `[-4096, -1024, 0, 4827.12, 8192, 16384]`.

## S1 `dna-name.ts`

- DNA generation uses deterministic seed namespaces.
- Naming uses `name:v1:*` namespaces.
- Starter, wild, and offspring names do not use wall-clock values.

## S2 `manifestation.ts`

- Slots use `manifest:v1:{realmSeed}:{playerSeed}:{layer}:{slotIndex}`.
- Place anchor uses realm seed; apparition identity uses both realm and player seed.

## S3 `spatial-bonding.ts`

- Birth tick uses `birth:v1:tick:{birthX}:{bondNonce}` with coordinate serialization.
- Offspring blending uses `birth:v1:*` seed namespaces.
- Creature ID uses stable DNA serialization plus parent IDs, vessel, realm, coordinate, and bond nonce.

## S4 `battle.ts`

- Battle pattern sequence is derived from the caller-provided `battleSeed` and turn number.

## S8 `persistence.ts`

- Derivation proof hash uses `proof:v1:*` over sorted, stable JSON-like serialization of algo version, realm seed, player seed, and deterministic samples.

## Wall-clock guard

- `Date.now()` is restricted to display-only metadata in S8/S10.
- `performance.now()` is restricted to S10 game loop/rendering timing.
