# Pokémon-Style Game Maker/Player — Architecture Spec v3
**Status: CLOSED. Build against this. Do not redesign.**
**History: 4 rounds Sonnet+Opus adversarial review → v2 → Step 1 trace (battle engine clean) → genome model adoption → v3.**

---

## 0. What This Is

A Pokémon Red-style RPG game maker and player built as a new system inside Nexus OS. Does not modify Eidolin. Runs in two modes from one codebase:

- **Standalone Mode**: Canvas 2D + IndexedDB + Web Audio. No Nostr. No wallet. Exports a self-contained HTML file anyone can open in a browser by double-clicking.
- **Integrated Mode**: Same engine. Games published via Nostr. Creatures and items can carry wallet-enforced ownership. Identity is a Nostr pubkey.

The crypto layer is a plugin injected through a Host interface. The engine core has zero Nostr or wallet dependency.

---

## 1. The Four Components

### `engines/pokemon-engine.js`
Pure JS library. No Nexus dependency. No import of nexus-block-client.js, secp256k1, or any wallet/Nostr code. Runs identically in both modes. Contains:

- `TileRenderer` — draws layered tile map to Canvas 2D
- `SpriteAtlas` — slices sprite sheet image into named animation frames
- `TileCamera` — `screenX = tileX * tileSize - cameraX`, `screenY = tileY * tileSize - cameraY`
- `CollisionMap` — terrain type lookup per tile, entity capability checks
- `EventExecutor` — async command queue with fixed yield primitives and termination guards
- `DialogueEngine` — canvas-rendered text boxes, NPC conversation trees with choice branches
- `BattleEngine` — thin adapter over `NexusBattleEngine` (see Section 5). Implements zero combat rules.
- `AudioEngine` — thin Web Audio API wrapper (OGG primary, MP3 fallback)
- `InputManager` — keyboard (WASD + arrows + Z/X/Enter/Esc) + canvas-relative touch D-pad
- `ProjectValidator` — strict schema validator; runs before any project JSON touches the engine
- `ProjectFormat` — canonical load/save/hash logic

### `blocks/pokemon-player.html`
Nexus managed block. Loads a project by `manifestHash` from `game_projects` store, passes it to `pokemon-engine.js`, renders to Canvas. Receives advisory preview state over BroadcastChannel from maker. **Never writes to `game_drafts`, `game_projects`, or `asset_blobs`.**

### `blocks/pokemon-maker.html`
Nexus managed block. Map editor, sprite importer, DNA/genome creature editor, event scripter, NPC placer. **Sole writer to `game_drafts`, `game_projects`, and `asset_blobs`.** Sends project state deltas over BroadcastChannel to player for live preview. On save event, player rebases from IndexedDB. The creature editor exposes DNA byte sliders with a live derived-stat preview computed via `NexusBattleEngine.deriveStats/deriveMoves/deriveTypes`.

### `blocks/pokemon-publish.html`
Nexus managed block. Optional. Handles Nostr publishing, WoT-filtered game discovery, and wallet-locked creature/item pre-battle ownership verification. Has its own direct wallet access — does not route through the engine's Host. Engine does not know this block exists.

---

## 2. The Host Interface

The engine calls nothing outside this interface. Both modes inject a concrete Host at init.

```js
const host = {
  storage: {
    // Draft operations — maker use, mutable, keyed by project id
    loadDraft(id)                → Promise<ProjectJSON>,
    saveDraft(project)           → Promise<void>,
    listDrafts()                 → Promise<[{id, name, updatedAt}]>,

    // Project operations — player use, immutable, keyed by manifestHash
    loadProject(manifestHash)    → Promise<ProjectJSON>,
    saveProject(project)         → Promise<manifestHash>,
    // saveProject computes manifestHash, writes to game_projects, returns hash.
    // Called by maker when "publishing" a draft as a playable version.

    // Save game operations
    loadSave(saveId)             → Promise<SaveJSON>,
    saveSave(save)               → Promise<void>,
    listSaves(manifestHash)      → Promise<[SaveJSON]>
  },

  assets: {
    resolve(assetRef)            → Promise<Blob>
    // Validates blob hash against project manifest at load time.
    // Throws if hash mismatch — integrity chain broken.
  },

  input: {
    getState()                   → { up, down, left, right, interact, cancel }
  },

  audio: {
    playMusic(trackId)           → void,
    playEffect(soundId)          → void,
    stop()                       → void,
    setVolume(level)             → void
  },

  wallet: {
    checkOwnership(lockId)       → Promise<boolean>
    // Called at item/creature acquisition time only.
    // Returns true unconditionally in standalone mode.
    // verifyLocks() is NOT on the engine Host — it lives in the publish block,
    // which has its own direct wallet access for pre-battle protocol work.
  }
}
```

**Nexus Host**: storage → IndexedDB via nexus-db; assets → `asset_blobs` store; wallet → kernel channel to Wallet block.

**Standalone Host**: storage → IndexedDB (works on `file://`); assets → inlined data URIs decoded at export time; wallet → `checkOwnership` returns `true` unconditionally.

---

## 3. IndexedDB Schema — `NexusOS_Data` v2

Migration from v1 to v2 is **strictly additive**. Only new stores are created. `social_events` and `config` are untouched. v1 blocks continue to work on a v2 database.

**Why two project stores**: the maker needs a stable mutable working draft (keyed by `id`, updated in place). The player needs immutable content-addressed versions so saves remain valid across project updates (keyed by `manifestHash`). Incompatible keyPath requirements → separate stores.

New stores added in `blocks/system/nexus-db.html` at DB_VERSION bump 1→2:

```
game_drafts
  keyPath: id                       // creator-assigned stable ID, updated in place
  indexes: name, updatedAt

game_projects
  keyPath: manifestHash             // content hash — immutable once written
  indexes: projectId, name, savedAt
  // Multiple versions of the same game coexist (different manifestHash).
  // Player always loads by manifestHash, never by projectId.

asset_blobs
  keyPath: assetHash                // SHA-256 of the blob content
  // Blobs deduplicated by content. Two projects sharing a tileset store it once.
  // Never deleted while any live project references the hash.

save_games
  keyPath: id                       // derived: sha256(projectManifestHash + ":" + playerName)
  indexes: projectManifestHash, savedAt
  // Same key derivation in standalone and integrated modes.
  // Prevents collision from creator-assigned projectId clashes.
```

This schema covers all stores needed through MVP. No further DB_VERSION bumps expected before MVP.

---

## 4. Project Format — `pkmaker/1`

**Assets are Blobs in `asset_blobs`, keyed by SHA-256 of their content. Project JSON carries only `assetRef` names. Data URIs are generated by the exporter at export time only — never stored.**

```js
{
  // Identity
  id: "proj_abc123",                  // creator-assigned, stable across all edits
  format: "pkmaker/1",
  engineVersion: "eidolon-core-1",   // must match NexusBattleEngine.ENGINE_VERSION
  name: "My Game",
  description: "",
  createdAt: 1710000000000,
  updatedAt: 1710000000000,

  // Manifest hash — computed on "publish", null/absent on drafts.
  // manifestHash = sha256({
  //   project: sha256(this JSON with manifestHash field set to null),
  //   assets: { "asset_ts_001": blobHash, "asset_spr_001": blobHash, ... }
  // })
  // Swapping any asset blob changes this hash. Integrity chain is unbroken.
  manifestHash: "sha256:...",

  tileSize: 16,                       // pixels per tile, must be power of 2

  // Terrain palette — terrain layer stores indices into this array.
  // Struct encoding prevents combinatorial explosion (e.g. ledge variants).
  tileTerrainPalette: [
    { id: 0, name: "passable",   passable: true,  jumpDir: null,    encounters: false, animation: null,     requiresCap: null   },
    { id: 1, name: "blocked",    passable: false, jumpDir: null,    encounters: false, animation: null,     requiresCap: null   },
    { id: 2, name: "tall_grass", passable: true,  jumpDir: null,    encounters: true,  animation: null,     requiresCap: null   },
    { id: 3, name: "water",      passable: false, jumpDir: null,    encounters: true,  animation: "ripple", requiresCap: "surf" },
    { id: 4, name: "ledge_s",    passable: true,  jumpDir: "south", encounters: false, animation: null,     requiresCap: null   }
    // Add custom entries freely. Flat integers are never used directly — always index into this palette.
  ],

  maps: [
    {
      id: "map_001",
      name: "Pallet Town",
      width: 20,                      // max 256
      height: 20,                     // max 256

      // V1 CONSTRAINT: one tileset per map.
      // Upgrade path: replace with tilesets[] array in a future engine version.
      tileset: "ts_001",

      layers: {
        ground:    [],  // flat array, width*height tile IDs. 0 = empty/transparent.
        detail:    [],  // above ground, below player/NPCs. 0 = empty.
        terrain:   [],  // terrain palette indices, width*height.
        overhead:  [],  // renders above player (trees, roofs). 0 = empty.
        objects:   []   // sparse: [{x, y, spriteId, facing, type, data}]
      },

      // Wild encounter table — fires on movement through tiles where palette entry has encounters:true.
      // Weights are relative. minDna/maxDna are optional per-byte constraints on random DNA generation.
      encounters: [
        { creatureId: "creature_001", weight: 60 },
        { creatureId: "creature_002", weight: 40, minDna: [128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                                   maxDna: [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255] }
      ],

      // Spatial events — fire from specific tile coordinates on this map.
      events: [
        {
          id: "e1",
          x: 5, y: 3,
          trigger: "onEnter",           // onEnter | onEnterOnce | onInteract
          condition: { flag: "got_starter", is: false },  // optional guard
          commands: [
            { cmd: "dialogue", lines: ["Take this creature?"], choices: ["Accept", "Decline"] },
            { cmd: "branch", on: "lastResult", cases: {
                "0": [
                  { cmd: "giveCreature", creatureId: "creature_001" },
                  { cmd: "setFlag", flag: "got_starter", value: true },
                  { cmd: "dialogue", lines: ["Good luck out there!"] }
                ],
                "1": [
                  { cmd: "dialogue", lines: ["Come back if you change your mind."] }
                ]
              },
              default: []
            }
          ]
        },
        {
          id: "e2",
          x: 10, y: 10,
          trigger: "onInteract",
          commands: [
            { cmd: "startBattle", creatureId: "creature_001" },
            { cmd: "branch", on: "lastResult", cases: {
                "win":  [{ cmd: "dialogue", lines: ["You won!"] }],
                "lose": [{ cmd: "dialogue", lines: ["Blacked out..."] }],
                "flee": [{ cmd: "dialogue", lines: ["Got away safely."] }]
              },
              default: []
            }
          ]
        }
      ],

      // Edge connections — seamless scroll, auto-triggered on step-off.
      // Does not use the event/command system.
      connections: { north: null, south: "map_003", east: null, west: null }
    }
  ],

  // Project-global logical events.
  // NOT nested in maps. Fire on global flag/state changes regardless of player location.
  logicalEvents: [
    {
      id: "le1",
      trigger: "onFlagSet",
      flag: "beat_gym_1",
      commands: [{ cmd: "unlockBadge", badgeId: "boulder" }]
    }
  ],

  // Map transition rules (mutually exclusive, non-overlapping):
  //   connections  → seamless edge scroll
  //   warp command → discrete teleport (doors, caves, buildings)
  //   startMap/X/Y → initial spawn for new game only, never used again

  startMap: "map_001",
  startX: 5,
  startY: 5,

  // Assets — assetRef is a stable name; blob stored in asset_blobs by SHA-256.
  // Manifest covers both project JSON hash and ordered asset blob hashes.
  tilesets: [
    { id: "ts_001", name: "Overworld", assetRef: "asset_ts_001", tileW: 16, tileH: 16 }
    // Tile ID 0 is always empty/transparent. First usable tile is index 1.
  ],

  sprites: [
    { id: "spr_001", name: "Player", assetRef: "asset_spr_001",
      frameW: 16, frameH: 16,
      animations: {
        walk_down:  [0,1,2,3],
        walk_up:    [4,5,6,7],
        walk_left:  [8,9,10,11],
        walk_right: [12,13,14,15]
      }
    }
  ],

  // Creatures — defined by DNA only. Stats, moves, and types are DERIVED by
  // NexusBattleEngine from the DNA. Creators do not author stats or moves.
  // The maker's creature editor is a DNA/genome editor with live derived-stat preview.
  creatures: [
    {
      id: "creature_001",             // stable project-local ID
      name: "Flameling",              // display name override; engine uses makeName(dna) if absent
      dna: [120,200,64,255,12,88,240,150,30,199,5,210,77,140,9,188],
                                      // CANONICAL: array of exactly 16 integers, each 0–255.
                                      // Stats, moves, and types are pure functions of this array.
                                      // Derived bounds: HP 45–105, atk/def/spAtk/spDef 20–75, spd 15–75.
                                      // Moveset: up to 4 from the 16 trait-moves + 4 base-move fallbacks.
                                      // Types: 1–2 from a fixed set of 8 (TOXIC,SPECTRAL,WILD,IRON,VOID,ANCIENT,LIGHT,SHADOW).
      hues: [180, 260, 320],          // optional cosmetic, 3–4 integers 0–359
      spriteRef: "spr_002",           // overworld sprite — maker concern, not a battle input
      catchRate: 45,                  // used by overworld catch mechanic, never a battle input
      ownership: null                 // null | { kind: "wallet-lock", lockId: "..." }
    }
  ],

  // NO top-level moves table. Moves are derived from DNA by the engine.
  // NO typeChart. The type effectiveness matrix is hardcoded in battle-engine.js
  // and therefore covered by ENGINE_HASH. Custom types are not possible.

  items: [
    {
      id: "potion_001",
      name: "Potion",
      effect: { kind: "heal", target: "self", amount: 20 },
      ownership: null
    }
  ],

  audio: {
    music: [
      { id: "mus_001", name: "Pallet Town", assetRef: "asset_mus_001", loop: true }
    ],
    effects: [
      { id: "sfx_hit", name: "Hit", assetRef: "asset_sfx_hit", loop: false }
    ]
  },

  // Global flags registry — definitions only. Runtime state lives in the save.
  flags: {
    "got_starter": false,
    "beat_gym_1": false
  }
}
```

---

## 5. The Battle Engine — `NexusBattleEngine`

`engines/battle-engine.js` is a **frozen, dependency-free UMD module**. It exports `NexusBattleEngine` globally. It has zero imports, zero Nostr/crypto/wallet code, zero internal codebase dependencies.

**Identity (frozen):**
```
ENGINE_VERSION = "eidolon-core-1"
ENGINE_HASH    = "sha256:79cd0f7ce56120d4aee1aa6616e94c1adbda58d164ffd444e4201e2215ef65a9"
```

**Fixed tables (hardcoded in engine, covered by ENGINE_HASH):**
- 8 types: `TOXIC, SPECTRAL, WILD, IRON, VOID, ANCIENT, LIGHT, SHADOW`
- Hardcoded effectiveness matrix — `×2` per match, no `×0.5`, no custom entries
- 16 trait-names, 16 trait-moves, trait→type mapping
- 4 base-move fallbacks: `PULSE, STRIKE, SHIELD, MEND`
- Stage multiplier table (13 entries)

**Derivation (pure functions of a 16-byte DNA array `d`):**
```
deriveStats(dna):
  maxHp  = 45 + floor(d[7]/255 * 60)   → 45–105
  atk    = 20 + floor(d[3]/255 * 55)   → 20–75
  def      uses d[5]
  spAtk    uses d[4]
  spDef    uses d[6]
  spd    = 15 + floor(d[2]/255 * 60)   → 15–75

deriveMoves(dna) → up to 4 moves from traits where d[i] > 128, sorted by value, padded from BASE_MOVES

deriveTypes(dna) → 1–2 types from top expressed traits
```

**API:**
```js
NexusBattleEngine.initBattle({eidolonA, eidolonB, battleSeed})
  → {stateA, stateB, battleSeed}   // fighters start at FULL HP

NexusBattleEngine.resolveTurn({stateA, stateB, moveA, moveB, turnSeed})
  → {newStateA, newStateB, eventsA, eventsB}
  // moveA/moveB are indices 0–3. Deterministic RNG from turnSeed.

NexusBattleEngine.isOver({stateA, stateB})
  → "A" | "B" | null
  // Double-KO tiebreak: stateA.hp >= stateB.hp ? "A" : "B"

NexusBattleEngine.replay({eidolonA, eidolonB, battleSeed, movesA, movesB, maxTurns=80})
  → {stateA, stateB, winner, transcript}

NexusBattleEngine._stable(v)
  → canonical deterministic JSON string
  // ALWAYS use this for battle hashing. Do not invent another serializer.
```

**Fighter input shape:**
```js
{ id, name, dna, hues }
// Engine also accepts { payload: { id, name, dna, hues } }. Maker emits the flat form.
```

**Event stream kinds:** `move, damage, miss, status, status_tick, multi, recoil, heal, stage, dodge`

**Frozen constraint:** `engines/battle-engine.js` is never modified. Any change to stat formulas, trait/move tables, the type matrix, the damage formula, or the RNG changes `ENGINE_HASH` and constitutes a new engine version requiring a version bump. The CI golden-test enforces this.

---

## 6. BattleEngine Adapter (inside `pokemon-engine.js`)

`BattleEngine` is a thin adapter over `NexusBattleEngine`. It implements zero combat rules.

Responsibilities:
1. Convert project creature `{id, name, dna, hues}` to the eidolon input shape
2. Manage party HP, PP, and status persistence between battles (wrapper-side state, committed to save)
3. Inject persisted HP/status into `initBattle` output before first `resolveTurn` (setting fields only, changing no rules)
4. Run the interactive turn loop: show move menu (moves derived from `deriveMoves(dna)` — creator never picks moves), collect player's move-index choice, call `resolveTurn`, feed event stream to battle UI
5. Track PP depletion across turns (engine does not do this)
6. Return `"win" | "lose" | "flee"` to the `EventExecutor` `startBattle` yield point

The battle UI maps the event stream (`move, damage, miss, status, status_tick, multi, recoil, heal, stage, dodge`) to animations and text. No combat math in the UI layer.

---

## 7. Save Format

```js
{
  // id = sha256(projectManifestHash + ":" + playerName)
  // Prevents collision from creator-assigned projectId clashes. Same derivation both modes.
  id: "sha256:derived...",

  projectId: "proj_abc123",
  projectManifestHash: "sha256:...",  // MUST match loaded project's manifestHash on load
  engineVersion: "eidolon-core-1",    // must match NexusBattleEngine.ENGINE_VERSION

  playerName: "Ash",
  currentMap: "map_001",
  x: 5, y: 3,
  facing: "down",

  flags: {
    "got_starter": true,
    "beat_gym_1": false
  },

  party: [
    {
      creatureId: "creature_001",     // references creatures[].id in the project
      nickname: null,
      // NO level, NO exp — the engine has no level concept. Creatures are fixed power.
      // Post-MVP: if leveling is added, it must become a committed data_hash input.
      hp: 30,                         // current HP — persisted and committed to battle data_hash
      maxHp: 45,                      // derived from dna at load time; stored for reference
      statusCondition: null,          // persisted and committed to battle data_hash
      moves: [                        // derived from dna; PP is wrapper-tracked
        { id: "PULSE",  pp: 8,  maxPp: 10 },
        { id: "STRIKE", pp: 10, maxPp: 10 }
      ]
    }
  ],

  inventory: [
    { itemId: "potion_001", quantity: 3, lockId: null }
  ],

  badges: [],
  playtime: 3600,
  savedAt: 1710000000000
}
```

**On load:** player checks `projectManifestHash` against the loaded project. On mismatch: attempt migration (using version-paired migrator shipped with each engine version), load with explicit warning, or refuse.

---

## 8. EventExecutor

Async command queue with fixed yield primitives. Not a VM. ~200 lines of JS.

### Yield-point commands

| Command | Suspends until | Sets `lastResult` to |
|---------|---------------|----------------------|
| `dialogue` with `choices` | Player selects | choice index as string: `"0"`, `"1"`... |
| `dialogue` without `choices` | Player dismisses | (does not set — `lastResult` unchanged) |
| `startBattle` | Battle resolves | `"win"`, `"lose"`, `"flee"` |
| `warp` | New map loads | (does not set). Subsequent commands run in new map context. |
| `wait` | N frames elapsed | (does not set) |

**`lastResult` rule:** single slot. Only overwritten by yield-point commands that produce a result. Non-yielding commands never touch it. After two consecutive result-producing yield commands, `lastResult` holds the most recently completed one.

### Branching — unified vocabulary, all use `cases`

```js
{ cmd: "branch", on: "lastResult", cases: {
    "win": [...], "lose": [...], "flee": [...]
  },
  default: []   // REQUIRED. Validator enforces presence. [] = fall through silently.
}

{ cmd: "ifFlag", flag: "got_starter", cases: {
    true: [...], false: [...]
  },
  default: []
}
```

Choices use `dialogue` + `choices` array. No standalone `choice` command exists.

### Available commands (closed set)
```
dialogue    { lines[], choices[]? }
branch      { on, cases, default }
ifFlag      { flag, cases, default }
setFlag     { flag, value }
giveItem    { itemId }
giveCreature { creatureId }
removeItem  { itemId }
startBattle { creatureId }
catch       { creatureId }   — overworld catch attempt, uses creature.catchRate
warp        { toMap, toX, toY }
playMusic   { trackId }
playEffect  { soundId }
wait        { frames }
unlockBadge { badgeId }
```

### Termination guards (runtime)
1. Per-sequence command budget: max 256 commands per trigger
2. Re-entrancy depth cap: max 8 nested triggers
3. Warp-loop detection: abort if same `mapId` appears twice in one sequence's warp history

### Spatial vs logical triggers
- **Spatial:** `x/y` on a specific map → `map.events[]`
- **Logical:** global flag/state change → `project.logicalEvents[]`
Separate tables. Both feed the same EventExecutor. Logical events have no `x/y` field.

---

## 9. Battle Verification

A battle is fully determined by `ENGINE_HASH`, both DNAs, `battleSeed`, starting HP/status, and the two move-index sequences. Because stats, moves, and types are pure functions of DNA, committing the DNA commits everything derived from it. The v2 "typeChart is data the hash doesn't cover" concern is **void** — the type matrix is hardcoded in `battle-engine.js` and therefore already inside `ENGINE_HASH`.

**Commitment bundle:**
```js
data_hash = sha256( NexusBattleEngine._stable({
  engine_hash:     "sha256:79cd...",    // covers all rules, tables, formulas, RNG
  dnaA:            [...16 bytes...],
  dnaB:            [...16 bytes...],
  startHpA,        startHpB,            // persisted HP is a committed input
  startStatusA,    startStatusB,        // persisted status is a committed input
  battleSeed,
  movesA:          [0,1,2,...],         // move index sequence actually played
  movesB:          [0,1,2,...],
  lock_attestations: [{lockId, ownerPubkey, verified}]  // if wallet-locked creatures/items
  // hues are cosmetic and do not affect battle output — omitted from data_hash
}) )
```

Kind 30431 (battle intent) carries `engine_version: "eidolon-core-1"` and `data_hash`. Both parties sign before the turn exchange begins.

**`_stable()` is mandatory for serialization.** The engine ships the canonical serializer. Do not use `JSON.stringify` — key ordering is not guaranteed.

**Cross-project PvP:** out of scope for MVP. Note: it is no longer blocked by a data-model problem — any two clients with the same `battle-engine.js` can verify any battle, since DNA fully determines all derived values. The protocol slot exists but is not implemented.

**Pre-battle wallet verification (publish block only, not engine):**
Before signing kind 30431, the publish block calls wallet directly to verify lock ownership for any wallet-locked creatures or items in both parties' lineups. Attestations `[{lockId, ownerPubkey, verified}]` are committed into `data_hash`. Ownership is point-in-time at battle-start, analogous to physical card game verification. The engine never calls wallet during the deterministic turn exchange.

---

## 10. Nostr Distribution

**Principle: Nostr carries the address, not the game.**

### Kind 30460 — Game Metadata
```js
{
  kind: 30460,
  tags: [
    ["d", "proj_abc123"],
    ["name", "My Game"],
    ["description", "..."],
    ["engine_version", "eidolon-core-1"],
    ["manifest_hash", "sha256:abc..."],
    ["genre", "rpg"],
    ["realm", "nexus"]
  ],
  content: JSON.stringify({
    blobs: [
      { url: "https://blossom.example.com/sha256abc...", hash: "sha256:abc...", size: 48291 },
      { url: "https://mirror.example.com/sha256abc...",  hash: "sha256:abc...", size: 48291 }
    ]
    // Multiple mirrors, same hash. Client tries each, verifies hash.
    // All asset hashes in manifest → swapping a blob at any mirror fails check.
    // Content-addressing gives free dedup across games sharing assets.
  })
}
```

Kind 30461 does not exist. All game data goes through the BlobStore abstraction.

### BlobStore Interface (publish block)
```js
blobStore.upload(blob, hash)    → Promise<[{url, hash}]>
blobStore.fetch(urlArray, hash) → Promise<Blob>           // tries each, verifies hash
```
Implementations: Blossom BUD-01/02/03 (primary), IPFS, HTTP. Client tries mirrors in order.

### Discovery
- Raw: `kinds: [30460]`, no author filter
- Default: WoT-filtered (pubkeys within 2 hops of user's social graph)
- Cold-start: curated relay list for users with zero follows (post-MVP)

---

## 11. Wallet-Locked Creatures and Items

**Phase 1 — Acquisition gate (engine Host):**
`host.wallet.checkOwnership(lockId)` at acquisition time only. `false` → item/creature not received. Returns `true` unconditionally in standalone mode. Standalone exports strip wallet-locked content or unlock it — creator's documented choice.

**Phase 2 — Battle gate (publish block only, not engine):**
Publish block calls wallet directly via `verifyLocks(lockIds[])` before constructing kind 30431. Attestations committed into `data_hash`. Engine untouched during battle.

---

## 12. Testing

### Golden tests for `battle-engine.js`
Fixed inputs (DNA pairs + battleSeed + move-index sequences) → assert exact outputs. Run headless: `node tests/battle-golden.js`.

Required scenarios (≥10):
1. `deriveStats` for a known DNA — assert exact stat block
2. `deriveMoves` — trait expression and `BASE_MOVES` padding
3. `deriveTypes` — 1-type creature
4. `deriveTypes` — 2-type creature
5. Full `replay` — known winner and transcript
6. Type effectiveness ×2
7. Poison tick damage
8. Burn tick damage
9. Recoil damage
10. Dodge (miss)
11. Speed-tie rule (A acts first when speeds equal)
12. `isOver` double-KO tiebreak (higher HP wins)

**Regression rule:** any change to `battle-engine.js` that alters a golden output is a breaking change. The version string and hash must be updated. CI enforces this before any merge.

### Headless unit tests for engine subsystems
- `CollisionMap` — terrain lookup, ledge direction, `requiresCap`
- `EventExecutor` — branching, `lastResult` slot, all three termination guards
- `ProjectValidator` — valid project passes; each invalid case fails with a named error
- `ProjectFormat` — manifest hash is stable and order-independent

Test harness: Node.js, no browser required. All tests pass before any engine change ships.

---

## 13. Build Order

**STEP 1 — COMPLETE.** `engines/battle-engine.js` traced. Zero imports. Zero Nostr/crypto/wallet dependencies. UMD IIFE, `module.exports` only. `ENGINE_HASH` is a passive string constant. `battle-engine-core.js` will NOT be created. The engine is wrapped directly.

**Step 2** — Hello-world Nexus block. HTML + `nexus-block-client.js` + DECLARE/MOUNT_ACK handshake. Renders "block alive." Proves sandbox and handshake before any game code.

**Step 3a** — Schema spec: `docs/POKEMON_MAKER_SCHEMA.md`. Exact field types, ranges, enums, sentinel values. Source of truth for all subsystems. No implementation.

**Step 3b** — Test harness scaffold. Empty golden test file + Node runner. Confirms test infrastructure runs before anything to test.

**Step 4** — DB_VERSION 1→2 migration. Adds `game_drafts`, `game_projects`, `asset_blobs`, `save_games` to `blocks/system/nexus-db.html`. Strictly additive. All existing blocks verified to still pass tests after bump.

**Step 5** — `TileRenderer` + `TileCamera` + `CollisionMap` (terrain palette). Pure standalone HTML test harness, no Nexus. Scrolling tile map, WASD movement, terrain collision. Proven before wrapping in a block.

**Step 6** — `SpriteAtlas` + `InputManager` (keyboard + touch) + `AudioEngine` (OGG/MP3). Player character renders and walks on tile map with audio.

**Step 7** — `EventExecutor` + `DialogueEngine`. Walk into tile, text box appears. Branching choice works. Termination guards in place. Headless tests passing.

**Step 8** — `ProjectValidator`. Validates project JSON against Step 3a schema before it touches the engine. DNA: length 16, each 0–255. Hues: length 3–4, each 0–359. `default` arm required on `branch`/`ifFlag`. Dialogue for canvas text. Tests passing.

**Step 9** — `ProjectFormat`. Draft save/load (`game_drafts`). Publish to `game_projects` with manifest hash computation. Save game load/save with hash-pinning and mismatch detection.

**Step 10** — `pokemon-player.html` Nexus block. Wire engine to real Nexus Host. Load a hardcoded `manifestHash` from `game_projects`, render it. Live BroadcastChannel preview from a test sender.

**Step 11** — Standalone export spike (throwaway). Inline engine JS + project + assets as data URIs into one HTML file. Open by double-click, no server, no Nexus. Proves the export path.

**Step 12** — `pokemon-maker.html`. Map editor first: paint tiles, place NPCs, place events. Then the DNA/genome creature editor: 16 byte-sliders, live derived-stat/move/type preview via `NexusBattleEngine.deriveStats/deriveMoves/deriveTypes`. Save draft. Publish. Open in player. Live preview working.

**Step 13** — `BattleEngine` adapter (unblocked by Step 1 — engine is clean). Thin adapter over `NexusBattleEngine`: eidolon-shape conversion, HP/PP/status persistence, `resolveTurn` turn loop, event→UI mapping, `"win"|"lose"|"flee"` → EventExecutor. Battle golden tests passing.

**Step 14** — Nostr distribution spike (throwaway). Publish as kind 30460 via Blossom. Subscribe and reconstruct. Verify manifest hash. Confirm relay size and Blossom work.

**Step 15** — `pokemon-publish.html`. WoT-filtered game browser. Download and play from Nostr.

**Step 16** — Wallet-locked creatures/items. Acquisition gate (engine Host) + pre-battle verification gate (publish block). Additive. Tested in isolation.

---

## 14. Key Constraints — Never Violate

- Large map data lives in IndexedDB only. Never through the Nexus message bus (limits: 128KB strings, 512-element arrays, depth 10, 1024 nodes, 256 object keys). Only IDs, `manifestHash` values, and small deltas go over the bus.
- BroadcastChannel carries project state deltas. Player has its own engine instance and re-renders from state — not pixels.
- Maker is sole writer to `game_drafts`, `game_projects`, `asset_blobs`. Player never writes these.
- All tileset/sprite sources must be Blob or data URI before canvas draw. Never cross-origin URLs (canvas taint breaks export).
- Tile ID `0` is reserved empty/transparent on all layers. First usable tile is index `1`.
- `engines/battle-engine.js` is frozen and never modified. ENGINE_HASH certifies this.
- Stat derivation, moveset, and type are pure functions of DNA. Creators tune DNA, not stats/moves/types.
- No top-level `moves` table. No `typeChart`. Types and moves are engine-internal.
- DB migration is strictly additive. Never alter or delete existing stores.
- The engine calls nothing outside the Host interface.
- Schema validator runs before any project JSON reaches the engine.
- `branch` and `ifFlag` must have a `default` field. Validator enforces.
- `_stable()` is the only serializer used for battle hashing.
- `verifyLocks` is a publish-block capability, not an engine Host method.
- Cross-project PvP is out of scope for MVP.
- Golden battle tests must pass before any change to the battle layer ships.
- No `level` or `exp` in the save format. Creatures are fixed power at MVP.
