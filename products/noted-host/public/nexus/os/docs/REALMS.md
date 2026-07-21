# Realms

`realm-charter/1` is the Vibe schema for local realm context. A realm is not intrinsic to a sovereign creature artifact; it records how this user/library is using a creature, world, battle, or derivative inside a rules context.

## `realm-charter/1` envelope

```json
{
  "format": "vibe/1",
  "id": "<uuid-or-content-hash>",
  "type": "realm-charter/1",
  "name": "<human readable>",
  "payload": {
    "realm_id": "realm_genesis_0",
    "season": "s0",
    "ruleset": { "id": "eidolon-core", "version": "1.2" },
    "ruleset_hash": "<sha256:...>",
    "engine_hash": "sha256:<battle-engine.js>",
    "substrate_epoch": 1,
    "gen1_policy": {
      "method": "open",
      "notes": "open Gen-1 admission for genesis season"
    },
    "created_at": "<iso>",
    "notes": "Canonical genesis realm. Open admission. Ruleset: eidolon-core v1.2."
  }
}
```

## Shipped charter

The archive ships `realms/realm_genesis_0.json` as the built-in genesis charter. Vibes Library imports it once on first boot if no `realm-charter/1` vibes exist. If the user later deletes it, the Library does not recreate it unless local metadata is reset.

## Ruleset policy

Each ruleset change increments `ruleset.version` and recomputes `ruleset_hash`. Sweep 5 populates `engine_hash` with the platform battle engine hash. Existing local `realm_genesis_0` charters at ruleset v1.0/v1.1 are migrated in place to v1.2 on Library boot; the charter id remains stable.

Current genesis `engine_hash`:

```text
sha256:79cd0f7ce56120d4aee1aa6616e94c1adbda58d164ffd444e4201e2215ef65a9
```

Current genesis `ruleset_hash`:

```text
sha256:d2d9728ead1542f1b216b988bd93a8dc4e678b0e3ea6350661b8674cd212ec39
```


## Foreign creature stubs

`creature-stub/1` represents a creature observed through a valid birth-attestation event whose full artifact is not held locally.

```json
{
  "format": "vibe/1",
  "type": "creature-stub/1",
  "id": "v_stub_<hash>",
  "realm": "realm_genesis_0",
  "content_hash": "sha256:<creature_hash>",
  "parents": ["<local_parent_or_stub_id>"],
  "payload": {
    "creature_hash": "sha256:<creature_hash>",
    "generation": 2,
    "parents": ["<local_parent_or_stub_id>"],
    "attestations": [{ "pubkey": "<hex>", "event_id": "<hex>", "ts": 1777852800000 }],
    "discovered_at": "<iso>",
    "full_artifact": false
  }
}
```

Stubs participate in Vibes Library lineage exactly like full creatures because the canonical edges are still top-level `parents[]` entries. A later full-artifact import with the same `content_hash` can promote the stub while keeping the id stable so existing lineage edges remain traversable.

## Nostr birth attestations

Kind `30420` is reserved here for local creature birth acknowledgement under a realm.

Relay subscription filter used by Vibes Library:

```json
{
  "kinds": [30420],
  "#realm": ["realm_genesis_0"],
  "limit": 200
}
```

Events are client-side filtered by realm as well. Valid events must pass NIP-01 event-id recomputation and Schnorr signature verification before they mutate the Library.

## Battle engine binding

`realm_genesis_0` now declares `engine_hash` for `battle-engine.js` and ruleset `eidolon-core` version `1.2`. Multiplayer ranked battles must reject creatures that cannot provide the required engine surface (`dna`, derived moves/types/stats) or realms whose charter hash does not match the loaded engine. Standalone Eidolon HTML remains sovereign and read-only; platform multiplayer consumes Library entries only.

## Battle result vibes

`battle-result/1` stores co-signed platform battle results without creating lineage edges in v1.

```json
{
  "format": "vibe/1",
  "type": "battle-result/1",
  "realm": "realm_genesis_0",
  "payload": {
    "battle_id": "battle_<id>",
    "charter": "realm_genesis_0",
    "eidolon_a": "sha256:<hash>",
    "eidolon_b": "sha256:<hash>",
    "winner": "A",
    "transcript_hash": "sha256:<hash>",
    "sig_a": "<sig>",
    "sig_b": "<sig>",
    "ts": 1777852800000
  }
}
```
