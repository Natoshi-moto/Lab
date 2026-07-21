# Pokémon-Style Game Maker Diagnostic — Pass 2

Date: 2026-05-17
Scope: block boot contract, peer/block communication, storage ceilings, asset pipeline, Nostr hard limits, standalone feasibility, and reusable world/battle code.
Functional code changed: none.

## 1. BLOCK SYSTEM / NEW BUILDS

### Minimum managed Nexus block structure

A managed block is an HTML document loaded into a sandboxed iframe by `Nexus_OS.html`. The usual minimum is:

```html
<!doctype html>
<html>
<body>
  <script src="../../engines/nexus-block-client.js"></script>
  <script>
    const nx = window.NexusBlockClient.bootBlock({
      manifest: {
        emits: ['game.ready'],
        consumes: [],
        undoable: [],
        app: {
          title: 'Game Maker',
          icon: '▣',
          description: 'Tile-map game maker/player',
          visible: true
        }
      }
    });

    nx.ready.then(() => {
      nx.emit('game.ready', { ok: true, ts: Date.now() });
    });
  </script>
</body>
</html>
```

The helper in `engines/nexus-block-client.js` handles the boot handshake:

1. Kernel sends the iframe `{type:"BOOT", blockId}` and transfers a private `MessagePort`.
2. Block sends `{type:"DECLARE", manifest:{emits, consumes, undoable}, app}`.
3. Kernel validates channel lists and replies `{type:"MOUNT_CHALLENGE", nonce}`.
4. Block replies `{type:"MOUNT_ACK", nonce}`.
5. Kernel sends `{type:"MOUNTED"}`.
6. Block may then send `SUB` for declared consumes and `EMIT` for declared emits.
7. Kernel may send `PING`; block must answer `PONG` with the same nonce.

Handshake constraints from `Nexus_OS.html`:

- channel regex: `^[a-z0-9._-]{1,96}$`
- max emitted channels: 48
- max consumed channels: 48
- max undoable channels: 48
- approx manifest byte cap: 4096
- undoable channels must also be emitted
- app metadata is clipped by the kernel: title 64 chars, icon 4 chars, description 128 chars
- `visible:false` makes a service block/headless block possible

Working templates to inspect:

- `blocks/apps/verse-studio.html` — small visible managed block with standalone fallback.
- `blocks/vibes/kin-forge.html` — compact block using `NexusBlockClient.bootBlock`, `request`, and `ready`.
- `blocks/system/nexus-router.html` — service-style block with explicit `nx.handle` request handlers.

### Can two blocks communicate peer-to-peer?

Normal app messages do not go iframe-to-iframe directly. They route through the kernel channel bus:

- sender emits `{type:"EMIT", channel, payload}`
- kernel validates declaration and sanitizes payload
- kernel sends subscribers `{type:"MSG", src, channel, payload}`

There is one supported direct-data pattern: the router/stream broker.

`blocks/system/nexus-router.html` lets a producer register a stream kind. The router returns a `BroadcastChannel` name. The producer and consumer then talk directly over `BroadcastChannel`; the router handles discovery and lifecycle, not frame traffic.

This is useful for high-frequency streams such as terrain chunks. It is not a generic private peer MessagePort exchange; it is same-origin BroadcastChannel rendezvous.

### Block/file/memory size limits

No explicit HTML file-size cap was found. Practical caps are browser memory/CPU plus kernel runtime limits:

- max blocks: 64
- watchdog before mount: 12 s; first DECLARE grace: 90 s
- data plane token bucket: 100 burst, 50/s refill
- control plane token bucket: 10 burst, 5/s refill
- max lifetime reloads: 4
- kernel payload sanitizer:
  - string/key budget: 131,072 chars
  - max depth: 10
  - max object/array nodes: 1024
  - max object keys: 256
  - max array length: 512

A large tile-map editor should keep large project data in IndexedDB and use small channel messages for IDs, chunks, dirty regions, summaries, and save notifications.

## 2. DATABASE / STORAGE CEILING

### Can NexusOS_Data add new object stores?

Yes, technically. `NexusOS_Data` is opened in `blocks/system/nexus-db.html` with:

```js
const DB_NAME = "NexusOS_Data";
const DB_VERSION = 1;
```

Object stores are created only inside `request.onupgradeneeded`. The schema owner for this DB is centralized in `blocks/system/nexus-db.html`. To add stores such as `game_projects`, `tile_maps`, or `sprites`, bump `DB_VERSION` and add guarded `createObjectStore` calls in that one file.

Current stores:

- `social_events`, keyPath `id`, indexes `created_at`, `pubkey`
- `config`, keyPath `key`

Caveat: the quasi-SQL query path does not create object stores dynamically. It extracts a table name from SQL-like strings and opens that existing object store. A query against a missing table fails.

Vibes Library is separate:

```js
const DB_NAME = 'VibesLibrary';
const DB_VERSION = 3;
```

It owns typed stores based on `TYPE_FAMILIES`: `vibes_creature`, `vibes_environment`, `vibes_attack`, `vibes_world`, etc. To add a new Vibes family, edit `TYPE_FAMILIES`, bump `DB_VERSION`, and ensure `typeFamily()` maps the new type to that family. Safer near-term path: use existing `world/*` envelopes for map/game projects.

### Practical single-record limit

The codebase imposes no explicit IndexedDB record-size limit. Real limits are browser quota/storage policy.

A 100×100 tile map can fit in one IndexedDB record as JSON if represented compactly. Example:

```js
{
  w: 100,
  h: 100,
  layers: {
    ground: [[0,1,2], ...],
    collision: [[0,0,1], ...]
  },
  events: [{ id:'e1', x:12, y:7, trigger:'onEnter', action:{ type:'dialogue', id:'d1' }}]
}
```

But there is a difference between **IndexedDB capacity** and **Nexus IPC capacity**:

- Direct IndexedDB write inside the same block: likely fine.
- Sending the whole map through `nx.emit` / `vibe.save`: constrained by the kernel payload sanitizer.
- A flat 10,000-item array fails `payloadMaxArrayLength:512`.
- 10,000 per-tile objects fail `payloadMaxNodes:1024`.
- Large stringified blobs can fail the 131,072 char payload budget.

Recommendation: store maps as chunk records, e.g. `projectId + mapId + chunkX + chunkY`, with 16×16 or 32×32 compact arrays. Use bus messages to say "chunk X changed", not to carry the whole project.

### Exact Vibes envelope shape

The canonical envelope pattern is:

```js
{
  format: 'vibe/1',
  id: 'v_world_<hash-stem>',
  type: 'world/pokemon-maker-1',
  subFormat: 'pokemon-maker-map/1',
  name: 'Starter Town',
  tags: ['game-project', 'map'],
  parents: [],
  birthHash: 'sha256:<canonical-payload-hash>',
  createdAt: '2026-05-17T00:00:00.000Z',
  source: 'editor',
  realm: 'realm_genesis_0',
  payload: {
    /* arbitrary project/map data */
  }
}
```

Fields observed in Vibes summary/output:

- `id`
- `type`
- `name`
- `tags`
- `parents`
- `createdAt`
- `source`
- `birthHash`
- `subFormat`
- `realm`
- `content_addr`
- `content_hash`
- `attestation`
- `payload`

`vibe.save` only strictly requires `id`, `type`, and `payload`, then normalizes realm where required. For `world` and `creature` families, `realm` is required or defaulted from the current realm.

## 3. ASSET PIPELINE

### Asset manifest consumption

The TypeScript type and JSON seam exist:

```json
{
  "version": 1,
  "creatures": {},
  "biomes": {},
  "vessels": {},
  "audio": {}
}
```

`Eidolin Explore/src/runtime.ts` fetches `./asset-manifest.json` and stores it on state. The UI/status line reports "asset manifest loaded" vs "procedural fallback".

No active renderer path was found that uses `manifest.creatures`, `manifest.biomes`, `manifest.vessels`, or `manifest.audio` to load images/audio and draw them. Current creature/world drawing remains procedural Canvas 2D.

Conclusion: the manifest is a live seam, not a functional asset pipeline.

### Existing sprite-sheet handling

There is export-oriented sprite sheet code, not runtime sprite-sheet consumption.

Found:

- `blocks/eidolon-asset-bay-v2.html` has `spriteSheet()` that renders 12 procedural attack frames to a PNG sheet.
- `blocks/eidolon-battle-theatre.html` has `exportSpritesheet()` that captures battle frames to a sheet.

No general loader was found that takes an image sprite sheet, slices grid frames, and animates them in the game runtime.

### Image formats/sources in sandboxed iframes

Managed iframes currently use:

```js
iframe.sandbox = "allow-scripts allow-same-origin allow-downloads";
```

Implications:

- Same-origin files should be safe when served over local HTTP.
- `data:` URIs are already used for inline SVG favicon patterns.
- Blob URLs are allowed for block launch by `isAllowedBlockUrl()` and are also used for downloads/exports.
- Drag/drop `File` → `Blob` / `data:` / object URL is the safest route for local user assets.
- Cross-origin image URLs can load only if normal browser CORS permits them. Drawing cross-origin images to Canvas without CORS will taint the canvas and break export/readback.

For the Pokémon-style maker: prefer local imported assets stored as blobs/data URLs in IndexedDB or same-origin project asset files. Avoid remote image dependencies for exportable games.

## 4. NOSTR / CRYPTO HARD LIMITS

### Event content size

The code has no explicit `ev.content` size check. It signs and publishes whatever `JSON.stringify(contentObj)` returns.

However, relay limits are external. The current code does not fetch NIP-11 relay information documents, so it does not discover `max_message_length` before publishing. NIP-11 defines `limitation.max_message_length` as the maximum incoming JSON WebSocket message size a relay will process; this effectively caps event size.

Default relays used by code:

- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`

Recommendation: do not put full game packages or full maps in single Nostr events. Use a small addressable manifest event that references chunk events and/or external content-addressed blobs. For compressed small maps, test against relay NIP-11 limits first.

### Custom 304xx kind registration/collision risk

The 304xx kinds are informal in this codebase. No local registry file beyond constants in `blocks/vibes/vibes-library.html` was found.

Existing constants:

- 30420 birth / creature attestation
- 30421 breed offer
- 30422 breed commit
- 30423 breed reveal
- 30424 breed receipt
- 30431 battle intent
- 30432 battle commit
- 30433 battle reveal
- 30434 battle result
- 30450 witness ad

Nostr addressable events use the 30000-39999 range plus a `d` tag identity. Adding `30460` / `30461` would probably work mechanically, but collision risk is real unless this project maintains a local registry and uses distinctive `d` tags and tags such as `app`, `format`, `realm`, and `engine_hash`.

Recommendation: create a registry doc before adding more kinds, e.g. `docs/NOSTR_KIND_REGISTRY.md`, and reserve a contiguous range for game maker data.

### Can it fetch other people's events by kind without pubkey?

Yes. The current subscription filter can omit `authors` entirely.

`startAttestationRelaySubscription()` builds either:

```js
{ kinds, '#realm':[realm], since, limit:200 }
```

or:

```js
{ kinds, since, limit:200 }
```

That means it can receive events from any pubkey matching kind and optional realm. Separate partner-targeted filters exist for offers/intents when the local pubkey is known.

## 5. STANDALONE TRACK FEASIBILITY

### New block with no Nostr/wallet

Yes. The kernel does not force wallet or Nostr into every block. A managed block can declare only local channels or no channels and still function.

A Canvas 2D + IndexedDB block can work fully inside Nexus OS with:

- `engines/nexus-block-client.js` for optional OS handshake
- local IndexedDB for projects/assets
- Canvas 2D for runtime/editor
- no wallet channels
- no Nostr identity
- no relays

Crypto dependencies only appear if the block imports or calls wallet/Nostr/Vibes/battle-protocol paths.

### Self-contained HTML export outside Nexus OS

Feasible, but not already implemented as a general exporter.

A self-contained exported player should inline or bundle:

- project JSON
- tiles/sprites as data URLs or embedded compressed strings
- Canvas 2D renderer
- input loop
- save-state fallback using `localStorage`

It should not depend on `NexusBlockClient`, IndexedDB, Nostr, wallet, or `Nexus_OS.html`. Existing code already shows local export patterns using Blob/object URLs, but a game-project-to-standalone-HTML exporter would be new work.

## 6. EXISTING REUSABLES

### world-renderer.ts camera/viewport logic

Reusable pieces exist, but they are 1D side-scroller oriented.

World-to-screen X transform appears repeatedly as:

```js
screenX = worldX - cameraX + dims.width / 2;
```

`drawParallax`, `drawTerrain`, and `drawLandmarks` all accept `cameraX` and `dims`. Terrain samples visible X across the canvas and maps deterministic world height to screen Y.

Reusable for a tile engine:

- camera-centered transform idea
- parallax layer sampling
- visible-range culling
- deterministic terrain/world sampling style
- debug overlay concept

Not directly reusable for Pokémon maps:

- no cameraY
- no tile grid
- no tile-to-pixel transform
- no map layers
- no collision/passability
- no tile object/NPC/event layer

A tile engine should implement `cameraX/cameraY`, `tileSize`, and `worldToScreen(tileX,tileY)` directly, borrowing only ideas from the current renderer.

### Battle engine data-driven/moddability

There are two battle surfaces:

1. `blocks/Eidolin/src/battle.ts`: local stillness battle, mostly hardcoded but with exported tunable tables.
2. `engines/battle-engine.js`: platform battle engine, pure deterministic JSON-in/JSON-out.

`blocks/Eidolin/src/battle.ts` exposes data tables:

- `STILLNESS_PAYOFF`
- `WILD_DISTRIBUTION`

But the actions/patterns/victory strings/turn flow are hardcoded.

`engines/battle-engine.js` is more data-shaped:

- `TYPE_NAMES`
- `TRAIT_NAMES`
- `TYPE_MATRIX`
- `TYPE_FROM_TRAIT`
- `TRAIT_MOVES`
- `BASE_MOVES`
- `STAGE_MULTS`
- `deriveStats(dna)`
- `deriveMoves(dna)`
- `deriveTypes(dna)`
- `resolveTurn(...)`
- `replay(...)`

However these tables are constants inside the engine file. There is no external move database JSON, no mod loader, and the engine hash is fixed. Changing the tables changes canonical behavior and should produce a new engine version/hash.

Current moddability rating: moderate for internal code edits, low for user-created mods. For Pokémon-style maker/player, extract battle definitions into a versioned ruleset JSON and treat current engine as a reference.

## Planning conclusions

Best path for a Pokémon-style maker/player:

1. Build a new managed block, not a retrofit of Eidolin runtime.
2. Use Canvas 2D.
3. Store large project data directly in that block's IndexedDB, chunked by map/region/layer.
4. Use Nexus bus for coordination, not bulk map transfer.
5. Use Vibes `world/*` envelopes only for summaries/exports until a dedicated storage service exists.
6. Keep Nostr optional: publish compact manifests/chunks only after local maker/player is complete.
7. Keep wallet optional: enable ranked/battle/market modes later, not in MVP.
8. Create a formal Nostr kind registry before adding new 304xx kinds.
