# Eidolin Game Maker / Player Diagnostic

Date: 2026-05-17  
Sweep type: diagnostic/planning, no functional code edits.

This note answers the targeted architecture questions for planning a Pokémon-style game maker/player on top of the current Nexus/Eidolin codebase.

## 1. How Eidolin currently renders the game world

**Answer:** Eidolin renders through **Canvas 2D**, not WebGL, CSS tiles, or SVG.

Evidence:

- `blocks/Eidolin/index.html:15-17` mounts `<canvas id="game">` and loads `./dist/src/runtime.js`.
- `blocks/Eidolin/src/runtime.ts:104-116` creates/ensures the canvas shell.
- `blocks/Eidolin/src/runtime.ts:526-530` calls `canvas.getContext('2d')` and throws if Canvas 2D is unavailable.
- `blocks/Eidolin/src/runtime.ts:566-580` is the main `requestAnimationFrame(frame)` loop.
- `blocks/Eidolin/src/runtime.ts:470-524` is the main draw path: parallax, terrain, landmarks, creatures, cryptic tells, vessel ceremony, debug overlay, lineage journal.
- `blocks/Eidolin/src/world-renderer.ts:196-225` paints the parallax/sky layers using Canvas 2D gradients and fills.

**Main rendering files:**

- `blocks/Eidolin/src/runtime.ts` — boot, input, update loop, draw orchestration.
- `blocks/Eidolin/src/world-renderer.ts` — world/background/terrain/landmark rendering.
- `blocks/Eidolin/src/ui-layer.ts` — UI/HUD canvas-layer helpers.
- Built/minified shipped surfaces also exist in `nexus-lattice(1).html` and `blocks/nexus-lattice(1).html`.

## 2. How game assets are currently stored and retrieved

**Answer:** The current Eidolin runtime is mostly **procedural**, not asset-pack driven. There is an empty asset manifest seam, localStorage save/state, and a separate Vibes Library IndexedDB for game-data envelopes.

Current asset/storage surfaces:

- `blocks/Eidolin/asset-manifest.json:1-7` contains empty `creatures`, `biomes`, `vessels`, and `audio` maps.
- `blocks/Eidolin/src/types.ts:568-583` defines `AssetManifest` as string records intended for future drag/drop art/audio while falling back to procedural rendering.
- `blocks/Eidolin/src/persistence.ts:21-23` uses localStorage keys for save, pending save, and backup save.
- `blocks/Eidolin/src/persistence.ts:112-185` creates, loads, verifies, and commits JSON `SaveFileV1` to localStorage.
- `engines/eidolon-storage.js:1-12` stores selected companion/environment/attack and fallback collections in localStorage.
- `blocks/vibes/vibes-library.html:197-205` owns the `VibesLibrary` IndexedDB and game envelope families.
- `blocks/vibes/vibes-library.html:1343-1407` creates IndexedDB object stores and stores envelope objects with `putVibe(env)`.
- `blocks/vibes/vibes-library.html:1479-1565` imports `.vibe.json`, `.environment.json`, `.kin.json`, `.creature.json`, `.attack.json`, `.battle.json`, `.json`, and battle HTML files via the Nexus file-system bridge.
- `blocks/eidolon-asset-bay-v2.html:70-78` is a standalone/local asset-bay using localStorage under `eidolon.assetbay.mkii.v1`.

**Implication for Pokémon-style maker/player:** existing creature/environment/attack/battle envelopes can become authoring units, but there is no current sprite/tile/background asset pipeline consumed by the Eidolin runtime.

## 3. Quasi-SQL database shape

**Answer:** NexusDB is an IndexedDB-backed quasi-SQL service block. It is not a real SQL engine.

Evidence:

- `blocks/system/nexus-db.html:36-37` uses IndexedDB database `NexusOS_Data`, version `1`.
- `blocks/system/nexus-db.html:74-88` creates only two object stores: `social_events` and `config`.
- `social_events` has keyPath `id` and indexes `created_at` and `pubkey`.
- `config` has keyPath `key`.
- `blocks/system/nexus-db.html:155-166` parses basic table names from simple `INSERT INTO`, `DELETE FROM`, `UPDATE`, and `SELECT ... FROM` strings.
- `blocks/system/nexus-db.html:185-250` supports `INSERT`/`UPDATE` as `store.put(params)`, `DELETE` by `params.id`, `SELECT` via `getAll()` with exact-match filters and numeric sort, and `SUBSCRIBE`.

**Typing:** row objects are arbitrary structured-clone/JSON-like IndexedDB records at the object level. They are not strictly SQL typed. However, tables/stores are **not dynamically created** by the query path: only stores created during IndexedDB upgrade can be opened. The namespace guard allows app-prefixed/public tables by name, but without object-store creation such tables will error unless they already exist.

## 4. Sandboxing implementation

**Answer:** Nexus OS sandboxes blocks in **iframes** and gives protocol-aware blocks a private **MessageChannel** port. It is not primarily Web Worker sandboxing, though workers are used by compute services.

Evidence:

- `Nexus_OS.html:1598-1605` explains BOOT delivery uses `targetOrigin='*'` because sandboxed iframe origins can be opaque/null, with the MessagePort as the security boundary.
- `Nexus_OS.html:1607-1685` spawns blocks as iframes.
- `Nexus_OS.html:1615-1618` gives legacy apps a broader sandbox.
- `Nexus_OS.html:1620-1628` gives managed blocks `allow-scripts allow-same-origin allow-downloads`.
- `Nexus_OS.html:1656-1667` creates a `MessageChannel` and transfers `port2` to the iframe in a `BOOT` message.
- `Nexus_OS.html:1200-1310` enforces the handshake: `DECLARE` → `MOUNT_CHALLENGE` → `MOUNT_ACK` → mounted subscriptions.
- `Nexus_OS.html:1293-1305` validates block-origin `EMIT` messages against mounted state, rate limits, declared channels, and sanitized payloads.

## 5. Tile-map concept

**Answer:** Current Eidolin does **not** have a 2D tile-map/grid world. It is a continuous side-scrolling/procedural world over `worldX`.

Evidence:

- `blocks/Eidolin/src/runtime.ts:282-300` runtime state has `layer`, `playerX`, `playerVelocity`, `cameraX`, and `companionX`; it does not maintain `playerY`, tile coordinates, chunk maps, collision tiles, or map layers.
- `blocks/Eidolin/src/runtime.ts:421-427` movement updates `playerX` using left/right velocity.
- `blocks/Eidolin/src/core/deterministic.ts:39-50` defines terrain sampling constants such as `TERRAIN_STEP`.
- `blocks/Eidolin/src/core/deterministic.ts:279-360` derives biome blends and landmarks from continuous X/cell sampling.
- `blocks/Eidolin/src/manifestation.ts:62-64` defines manifestation slots as world-unit X intervals, not grid tiles.
- `blocks/Eidolin/src/manifestation.ts:219-268` derives a slot `anchorX` and slots near the player.

**Implication:** a Pokémon-style maker needs a new tile-map data model, map renderer, collision/passability layer, encounter zones, and authoring format. Eidolin’s deterministic seed/biome/slot system can inspire procedural generation but is not already a tile-map engine.

## 6. Event/trigger system

**Answer:** There is no general declarative trigger system like `when player enters zone, do X`. Current gameplay uses frame-driven state machines and kernel channels.

Existing trigger-like mechanisms:

- Manifestation proximity state machine:
  - `blocks/Eidolin/src/manifestation.ts:1-8` describes slots and apparition lifecycle.
  - `blocks/Eidolin/src/manifestation.ts:352-476` transitions active manifestations through latent/cryptic/watching/approaching/tracking/battle/bondable/settled/fading based on distance, speed, temperament, and dt.
  - `blocks/Eidolin/src/runtime.ts:436-442` wakes/updates manifestations each frame and starts battle when the state reaches `battle`.
- Kernel event bus:
  - Blocks declare/sub/emit named channels through Nexus OS.
  - This is suitable for app-level events, but it is not a map-script trigger editor.

**Implication:** build a dedicated trigger layer for the maker/player: region enter/exit, interact, item obtained, battle finished, flag set, NPC dialogue complete, etc.

## 7. Nostr publishing/reading implementation

**Answer:** Nostr is implemented with direct WebSocket relay connections and hand-written event signing/verification. It does not use a high-level Nostr wrapper library.

Evidence:

- `blocks/vibes/vibes-library.html:532-541` loads secp/schnorr from local `./libs/secp256k1.js` or remote `@noble/curves`.
- `blocks/vibes/vibes-library.html:549-562` loads identity from localStorage keys such as `nx.soc.identity`, `nx.forum.identity`, `nx.channels.identity`, `nx.iww.identity`.
- `blocks/vibes/vibes-library.html:563-571` loads relays from localStorage or defaults to public relays.
- `blocks/vibes/vibes-library.html:572-585` builds and signs NIP-01-style events by hashing `[0,pubkey,created_at,kind,tags,content]` and Schnorr-signing the id.
- `blocks/vibes/vibes-library.html:622-640` publishes via direct `new WebSocket(url)` and sends `['EVENT', ev]`.
- `blocks/vibes/vibes-library.html:1291-1340` subscribes via direct WebSockets and sends `['REQ', subId, filter, ...]`.
- `blocks/vibes/vibes-library.html:679-688` verifies event kind, id, and Schnorr signature.

## 8. Nostr event format for game data

**Answer:** Game data uses **custom Nostr kinds in the 304xx range** with custom tags and JSON content.

Kinds defined in `blocks/vibes/vibes-library.html:210-219`:

- `30420` birth/creature attestation
- `30421` breed offer
- `30422` breed commit
- `30423` breed reveal
- `30424` breed receipt
- `30431` battle intent
- `30432` battle commit
- `30433` battle reveal
- `30434` battle result
- `30450` witness ad

Examples:

- `blocks/vibes/vibes-library.html:602-620` builds a birth attestation with tags `d`, `realm`, `gen`, `parents`, and optional ancestor `e` tags; content includes `creature_hash`, `realm_id`, `generation`, `parents`, `ts`.
- `blocks/vibes/vibes-library.html:872-888` builds a breed offer with tags `d`, `parent_a`, `parent_b`, `partner`, `realm`, `expires` and JSON content.
- `blocks/vibes/vibes-library.html:1235-1263` builds a battle intent with tags `d`, `partner`, `realm`, `eidolon_a`, `eidolon_b`, `engine_hash`, `lock_a`, `lock_b`, `expires` and JSON content.
- `engines/witness-selection.js:57-59` defines witness advertisement kind `30450` with `d` and `realm` tags.

## 9. Wallet/crypto interaction with the game

**Answer:** The wallet/crypto layer is more than identity. It has local cryptographic token/lock mechanics used by social staking and ranked battle flows.

Evidence:

- `blocks/system/Wallet_v4_nexus.html:565-580` documents wallet v4 security fixes and transport assumptions.
- `blocks/system/Wallet_v4_nexus.html:620-723` manages per-tab wallet slots, local keypair/state storage, BroadcastChannel fallback, and localStorage outbox.
- `blocks/system/Wallet_v4_nexus.html:1172-1204` exposes `wallet.lock.create`, `wallet.lock.resolve`, and `wallet.lock.verify` request channels.
- `blocks/system/Wallet_v4_nexus.html:1357-1439` accepts and applies `SPEND`, `LOCK`, and `RESOLVE` transactions.
- `blocks/system/Wallet_v4_nexus.html:1441-1452` emits `nexus.wallet.state`.
- `blocks/vibes/vibes-library.html:1176-1184` requests wallet locks/resolves through `nx.request(...)`.
- `blocks/vibes/vibes-library.html:1235-1263` ranked battle intent creates a wallet lock if one is missing and includes lock IDs in the Nostr battle event.

**Boundary:** this is browser-local/application-level cryptographic accounting, not confirmed external blockchain settlement.

## 10. Tab/window communication model

**Answer:** The primary Nexus block communication model is a bespoke OS channel bus over per-block `MessageChannel` ports. Additional systems use BroadcastChannel/localStorage where appropriate.

Primary OS bus:

- `Nexus_OS.html:815-835` defines channel subscriptions and allowed block-origin control messages.
- `Nexus_OS.html:1038-1065` delivers subscribed messages as kernel-side `MSG` payloads through each block’s private port.
- `Nexus_OS.html:1293-1305` handles block-origin `EMIT` messages.
- `Nexus_OS.html:1656-1667` creates/transfers the private MessageChannel port during BOOT.

BroadcastChannel surfaces:

- `blocks/system/nexus-router.html:144-152` is a direct-channel broker: producers and consumers discover each other through the router, then stream directly over BroadcastChannel.
- `blocks/system/nexus-compute.html:180-195` uses Web Workers for compute jobs and BroadcastChannel for continuous terrain-strip streams.
- `blocks/system/Wallet_v4_nexus.html:576-580` explicitly removed a public `BroadcastChannel('nexus-kernel')` pattern, but keeps `BroadcastChannel('nexus-v4-transitions')` for wallet fallback.
- `blocks/system/Wallet_v4_nexus.html:696-723` uses kernel transport if mounted, BroadcastChannel fallback, and localStorage outbox/storage events for cross-tab late-join delivery.

LocalStorage is also used for selected companion/environment preferences and small cross-app persistence, but it is not the main OS event bus.

## Planning conclusion for a Pokémon-style maker/player

Current Eidolin provides useful pieces:

- Canvas 2D runtime shell.
- Deterministic procedural world/creature derivation.
- Manifestation/encounter state machine concepts.
- Vibes envelope storage/import/export.
- Nostr attestation/battle/breeding event flow.
- Wallet lock/stake mechanics.
- Nexus iframe sandbox and channel bus.

Missing or immature for Pokémon-style maker/player:

- 2D tile-map schema and editor.
- Tile/chunk renderer.
- Sprite/tile/background asset ingestion consumed by runtime.
- Collision/passability and pathfinding.
- Declarative event/trigger scripting.
- NPC/dialogue/signpost system.
- Project/package format for a playable authored world.
- Versioned migration path for maps/assets/scripts.

Recommended next architecture step: create a minimal `pokemon-maker` schema around `WorldProject`, `MapDefinition`, `TilesetDefinition`, `EntityDefinition`, `TriggerDefinition`, and `AssetRef`, store authored projects in Vibes Library envelopes first, then build a Canvas 2D tile renderer/player that runs as a managed Nexus block.


---

## Pass 2 addendum — block/storage/Nostr/standalone ceilings

See `docs/POKEMON_MAKER_SECOND_DIAGNOSTIC.md` for the detailed second diagnostic pass. Key update: a Pokémon-style editor/player can be built as a new managed Nexus block with Canvas 2D + IndexedDB and no Nostr/wallet dependency. The main architectural warning is to avoid bulk map/project transfer through the Nexus bus because kernel payload sanitization is much stricter than IndexedDB storage capacity.
