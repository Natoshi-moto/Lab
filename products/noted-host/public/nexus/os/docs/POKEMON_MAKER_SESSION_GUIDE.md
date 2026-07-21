# Session Guide — Pokémon Maker Build
**Your operating manual. Read this before every ChatGPT session.**

---

## The Rule That Never Changes

**Every ChatGPT session starts by attaching or pasting:**
1. `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` — the full spec
2. The file(s) produced by the previous session (so ChatGPT has context)

Then paste the prompt for the current session from this guide.

**Never skip step 1.** ChatGPT has no memory between sessions. Without the spec it will drift and improvise. The spec is the anchor.

**When something goes wrong:** don't try to fix it yourself. Bring the broken output back to Sonnet. It will diagnose and write a correction prompt.

---

## How to Know a Step is Done

A step is done when:
- ChatGPT has produced the file(s) described in the "Output" section of each session
- You can see the thing working (tile map scrolls, block loads, test passes, etc.)
- Sonnet has reviewed the output and said it's good

Don't move to the next session until all three are true.

---

## Session A — Infrastructure (Steps 2, 3a, 3b, 4)

**What this produces:** Working Nexus block handshake. Schema document. Test harness scaffold. Database upgrade.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `engines/nexus-block-client.js` + `blocks/system/nexus-db.html`

**Paste this prompt:**
```
The architecture spec is attached. Read it in full before doing anything. This is the permanent reference for the entire project — follow it exactly and flag any conflict with the codebase rather than improvising.

Step 1 is already complete: battle-engine.js has been traced and confirmed clean. We begin at Step 2.

Do all four of the following in one session. Each is small. Produce all four outputs before stopping.

STEP 2 — Hello-world Nexus block
Create a file at blocks/pokemon-player.html that:
- Imports engines/nexus-block-client.js
- Calls NexusBlockClient.bootBlock() with a minimal manifest (emits: ["pokemon.ready"], consumes: [], app: { name: "Pokemon Player", version: "0.1.0" })
- On MOUNTED, renders the text "Pokemon Player — block alive" to a div on the page
- Emits pokemon.ready with { ok: true }
Nothing else. No game code. Just prove the handshake works.

STEP 3a — Schema document
Create docs/POKEMON_MAKER_SCHEMA.md. This is a formal schema reference derived from the spec. It must define:
- Every field in the project format with its exact type, allowed range or enum values, and whether it is required or optional
- Every field in the save format with the same detail
- The DNA field rule: array of exactly 16 integers, each 0–255
- The hues field rule: array of 3–4 integers, each 0–359
- Tile ID 0 reserved as empty/transparent on all layers
- The branch/ifFlag default arm: required field, validator enforces
- Terrain palette struct fields and types
Write this as a reference document, not as code.

STEP 3b — Test harness scaffold
Create tests/battle-golden.js containing:
- An empty test runner structure with placeholder comments for the 12 required golden scenarios listed in the spec (Section 12)
- A simple pass/fail reporter that prints results to console
- A note that the actual test inputs will be added in Step 13
Run it with node tests/battle-golden.js — it should print "0 tests run, 0 failed" or equivalent and exit cleanly.

STEP 4 — Database migration
Edit blocks/system/nexus-db.html to bump DB_VERSION from 1 to 2.
In the onupgradeneeded handler, add these four new object stores when oldVersion < 2:
- game_drafts: keyPath "id", indexes on "name" and "updatedAt"
- game_projects: keyPath "manifestHash", indexes on "projectId", "name", and "savedAt"
- asset_blobs: keyPath "assetHash", no additional indexes
- save_games: keyPath "id", indexes on "projectManifestHash" and "savedAt"
Do NOT touch the existing social_events or config stores. Strictly additive.
After editing, confirm that the existing test suite still passes (run bash tests/run.sh or equivalent). Report the result.

Produce all four outputs. Report what each one does and confirm the test suite still passes after Step 4.
```

**Output you should see:**
- `blocks/pokemon-player.html` — loads in Nexus OS, handshake succeeds, shows "block alive"
- `docs/POKEMON_MAKER_SCHEMA.md` — readable schema reference document
- `tests/battle-golden.js` — runs with node, prints 0 tests, exits clean
- `blocks/system/nexus-db.html` — DB_VERSION = 2, four new stores, existing tests still pass

---

## Session B — Tile Engine (Step 5)

**What this produces:** A scrolling tile map you can open in a browser right now and walk around with WASD.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md`

**Paste this prompt:**
```
The architecture spec is attached. Read it before doing anything.

STEP 5 — TileRenderer + TileCamera + CollisionMap

Create engines/pokemon-engine.js. This is a pure JS library — no imports, no require, no Nexus dependency of any kind. It must run in a plain HTML file with no server.

Implement three classes in this file:

TileCamera:
- Properties: x, y (camera world position in pixels), tileSize
- Method: worldToScreen(tileX, tileY) → {x, y} using screenX = tileX * tileSize - this.x, screenY = tileY * tileSize - this.y
- Method: screenToWorld(screenX, screenY) → {tileX, tileY}
- Method: getVisibleTileRange(canvasWidth, canvasHeight) → {minX, minY, maxX, maxY} — the range of tile coordinates currently visible

TileRenderer:
- Constructor takes: canvas element, tileSize
- Method: loadTileset(imageElement) — stores the tileset image
- Method: drawLayer(layer, mapWidth, mapHeight, tileset, camera) — draws a flat array of tile IDs to the canvas. Tile ID 0 is skipped (empty/transparent). Tiles outside the visible range are culled (not drawn). Draws only the tiles visible in the camera's current view.
- Method: clear() — clears the canvas

CollisionMap:
- Constructor takes: terrainLayer (flat array), mapWidth, mapHeight, terrainPalette (array of terrain structs)
- Method: getTerrainAt(tileX, tileY) → the terrain palette entry for that tile, or the "blocked" entry if out of bounds
- Method: canMove(fromTileX, fromTileY, direction, capabilities) — returns true if an entity can move in that direction. Checks passable field. Checks jumpDir (a ledge in direction "south" can be entered from north moving south, not from south moving north). Checks requiresCap against capabilities array.

Then create a standalone test file: pokemon-engine-tile-test.html
This file must:
- Load a placeholder tileset (generate a simple 16x16 grid of coloured squares using a canvas and toDataURL — no external images needed)
- Create a 20x20 map where: all tiles are passable ground except a 5-tile-wide blocked wall running horizontally across y=10, with a single gap at x=10
- Render the map using TileRenderer
- Allow WASD movement. The player is a coloured rectangle (no sprite sheet yet). Movement is tile-by-tile. Camera follows the player. CollisionMap prevents walking through the blocked wall. Walking through the gap works.
- Show the player's current tile coordinates in the corner of the canvas

No Nexus. No IndexedDB. No battle engine. Just tiles, camera, and collision. Open this file in a browser by double-clicking and it must work immediately.

Produce both files. Describe exactly how to test it.
```

**Output you should see:**
- `engines/pokemon-engine.js` with TileCamera, TileRenderer, CollisionMap
- `pokemon-engine-tile-test.html` — open it, walk around, hit the wall, find the gap

---

## Session C — Characters and Sound (Step 6)

**What this produces:** A walking character sprite on the tile map with keyboard and touch controls and audio.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `engines/pokemon-engine.js` (from Session B) + `pokemon-engine-tile-test.html`

**Paste this prompt:**
```
The architecture spec and the current engine file are attached. Read both.

STEP 6 — SpriteAtlas + InputManager + AudioEngine

Add three more classes to engines/pokemon-engine.js. Do not break or modify TileCamera, TileRenderer, or CollisionMap.

SpriteAtlas:
- Constructor takes: imageElement (the sprite sheet), frameW, frameH
- Method: drawFrame(ctx, frameIndex, destX, destY) — draws a single frame from the sheet to canvas context ctx at pixel position destX,destY. Frames are indexed left-to-right, top-to-bottom starting at 0.
- Method: drawAnimation(ctx, animationFrames, animationStep, destX, destY) — draws the frame at animationFrames[animationStep % animationFrames.length]

InputManager:
- Tracks: up, down, left, right, interact, cancel as boolean states
- Keyboard bindings: W/ArrowUp=up, S/ArrowDown=down, A/ArrowLeft=left, D/ArrowRight=right, Z/Enter=interact, X/Esc=cancel
- Touch: render a D-pad overlay and A/B buttons directly onto the canvas (positions: D-pad bottom-left, buttons bottom-right). Touch targets are canvas-relative pixel regions, not DOM elements. Update the same boolean states from touch events.
- Method: getState() → { up, down, left, right, interact, cancel }

AudioEngine:
- Constructor takes no arguments
- Uses Web Audio API (AudioContext)
- Method: playMusic(audioBuffer, loop) — plays background music, stops any currently playing music first
- Method: playEffect(audioBuffer) — plays a one-shot sound effect
- Method: stop() — stops all audio
- Method: setVolume(level) — sets master gain 0.0–1.0
- Handles AudioContext suspended state (browsers require user interaction before audio plays — resume on first user input)

Then update pokemon-engine-tile-test.html to demonstrate all three:
- Generate a simple 16x32 pixel sprite sheet using canvas: 4 frames of a walking character (simple coloured shapes, no external images), laid out left-to-right. The player uses SpriteAtlas to render instead of a plain rectangle.
- Walking animates through the frames. Facing direction selects the right row (for now, just one row of 4 frames is fine).
- Touch D-pad and buttons are visible and functional on mobile or when resizing the window narrow.
- Generate a simple beep using Web Audio API oscillator for a step sound (play on each tile movement). No external audio files needed.

Produce the updated engine file and test file.
```

**Output you should see:**
- Updated `engines/pokemon-engine.js` with four classes
- Updated test file with walking sprite, touch controls, and step sound

---

## Session D — Events and Dialogue (Step 7)

**What this produces:** Walk into a tile and a text box appears. Make a choice. Something happens based on it.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + current `engines/pokemon-engine.js`

**Paste this prompt:**
```
The spec and current engine file are attached. Read both.

STEP 7 — EventExecutor + DialogueEngine

Add two more classes to engines/pokemon-engine.js. Do not modify existing classes.

DialogueEngine:
- Renders text boxes directly to the canvas — no DOM elements, no innerHTML
- Method: show(lines, choices, callback) — displays a text box at the bottom of the canvas. Lines is an array of strings. If choices is provided (array of strings), displays them as a selectable list below the text. Calls callback(selectedIndex) when player presses interact/confirm.
- Advances text on interact press (no choices). When choices are shown, up/down selects, interact confirms.
- Style: black border, white fill, dark text. Keep it simple. This is Pokémon Red aesthetic, not a fancy UI.
- Must render cleanly on top of the tile map without affecting the map render.

EventExecutor:
- An async command queue. Not a VM — just a queue with a switch and yield points.
- Constructor takes: { dialogueEngine, onBattle, onWarp, onSetFlag, onGiveItem, onGiveCreature, onCatch, onPlayMusic, onPlayEffect, onUnlockBadge, getFlagValue }
  All are callbacks the engine host provides. onBattle returns a Promise<"win"|"lose"|"flee">.
- Method: run(commands) → Promise — executes the command list, returns when complete
- Handles all commands in the closed set from the spec (Section 8): dialogue, branch, ifFlag, setFlag, giveItem, giveCreature, removeItem, startBattle, catch, warp, playMusic, playEffect, wait, unlockBadge
- lastResult rule: single slot, overwritten only by yield-point commands that produce a result. dialogue with choices sets it to the index string. startBattle sets it to "win"/"lose"/"flee". Other yield points do not set it.
- branch and ifFlag: the default arm is always present and executes when no case matches.
- Termination guards:
  1. Max 256 commands per run() call
  2. Re-entrancy depth cap: track depth, max 8. If exceeded, log a warning and halt.
  3. Warp-loop detection: if the same mapId would be warped to twice in one run(), log warning and halt.

Then update the test file to demonstrate events:
- Add two test tiles to the map:
  Tile at (5,5): onEnter trigger. Shows dialogue "Enter the cave?" with choices ["Yes","No"]. Branch on result: "0" shows "You entered!", "1" shows "You turned back."
  Tile at (8,8): onInteract trigger (press Z/Enter when standing on it). Shows "You found a potion!" with no choices. Sets a flag "found_potion". Shows a second dialogue "Potion count: 1" after.
- Show current flags state in the corner of the canvas so you can see flags being set.

Produce the updated engine and test files. Also produce tests/event-executor-test.js — a headless Node.js test that:
- Instantiates EventExecutor with mock callbacks
- Tests: basic dialogue yield, branch on lastResult, ifFlag branching, command budget guard (run 300 commands, confirm it halts at 256), warp-loop detection (warp to "map_a" then warp to "map_a" again in same sequence, confirm halt)
Run it with node tests/event-executor-test.js — all tests must pass and print clearly.
```

**Output you should see:**
- Updated engine with dialogue and events
- Test file where walking into tiles triggers dialogue and choices work
- `tests/event-executor-test.js` — all tests pass

---

## Session E — Validator (Step 8)

**What this produces:** A function that accepts or rejects project JSON before it touches the engine.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `docs/POKEMON_MAKER_SCHEMA.md`

**Paste this prompt:**
```
The spec and schema document are attached. Read both.

STEP 8 — ProjectValidator

Add a ProjectValidator class to engines/pokemon-engine.js.

Method: validate(projectJSON) → { valid: boolean, errors: string[] }

Rules to enforce (all named in the schema doc):
- format must be "pkmaker/1"
- engineVersion must be a non-empty string
- tileSize must be a positive integer that is a power of 2
- maps: array, each map width and height 1–256
- Every map layer (ground, detail, terrain, overhead) must be a flat array of exactly width*height integers
- Tile IDs in ground/detail/overhead must be non-negative integers
- Terrain layer values must be valid indices into tileTerrainPalette
- All events must have id (string), x/y (integers, within map bounds), trigger (one of: onEnter, onEnterOnce, onInteract), and commands (array)
- All branch and ifFlag commands must have a default field
- Dialogue lines must be an array of strings. No HTML, no script tags. Strip any tags found and record a sanitization warning (not an error).
- creatures: each must have id (string), dna (array of exactly 16 integers each 0–255)
- hues: if present, array of 3–4 integers each 0–359
- catchRate: if present, integer 0–255
- items: each must have id and name (strings)
- No unknown top-level fields that would indicate v2 data (moves array, typeChart) — if found, record an error explaining they are not valid in this engine version
- Map dimensions cap: max 256×256

Produce: the updated engines/pokemon-engine.js with ProjectValidator added.

Also produce tests/validator-test.js — headless Node.js tests covering:
- A minimal valid project passes with no errors
- Missing dna field on a creature → named error
- dna with 15 elements → named error
- dna with a value of 300 → named error
- branch command missing default field → named error
- map layer wrong length → named error
- A top-level "moves" array present → named error explaining it is not valid
- Dialogue containing a script tag → sanitization warning (not error), tag stripped
- Tile ID 0 in a layer → valid (0 is empty, allowed)

Run with node tests/validator-test.js — all pass, print clearly.
```

**Output you should see:**
- Updated engine with ProjectValidator
- `tests/validator-test.js` — all tests pass

---

## Session F — Storage and Saves (Step 9)

**What this produces:** Project draft save/load. Publish to immutable store. Save game with hash pinning.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + current `engines/pokemon-engine.js` + `blocks/system/nexus-db.html`

**Paste this prompt:**
```
The spec and current files are attached. Read the spec fully.

STEP 9 — ProjectFormat

Add a ProjectFormat class to engines/pokemon-engine.js.

This class handles all persistence via a Host object passed to its constructor. It never accesses IndexedDB directly — always through host.storage and host.assets.

Methods:

computeManifestHash(project, assetHashMap) → Promise<string>
  Computes: sha256({ project: sha256(JSON with manifestHash=null), assets: assetHashMap })
  assetHashMap is { assetRef: sha256OfBlob, ... }
  Uses SubtleCrypto (window.crypto.subtle) for hashing.
  Uses a canonical key-sorted JSON serialization (not JSON.stringify directly — sort keys).

saveDraft(project) → Promise<void>
  Sets project.updatedAt to Date.now()
  Calls host.storage.saveDraft(project)

loadDraft(id) → Promise<ProjectJSON>
  Calls host.storage.loadDraft(id)
  Runs ProjectValidator.validate() on result. If invalid, throws with error list.

publishProject(project, assetHashMap) → Promise<manifestHash>
  Computes manifestHash via computeManifestHash
  Sets project.manifestHash to result
  Calls host.storage.saveProject(project)
  Returns manifestHash

loadProject(manifestHash) → Promise<ProjectJSON>
  Calls host.storage.loadProject(manifestHash)
  Runs ProjectValidator.validate(). If invalid, throws.

saveGame(save) → Promise<void>
  Sets save.savedAt to Date.now()
  Calls host.storage.saveSave(save)

loadGame(saveId, expectedManifestHash) → Promise<SaveJSON>
  Calls host.storage.loadSave(saveId)
  If save.projectManifestHash !== expectedManifestHash, throws a MismatchError with message:
  "Save was created against project version [hash]. Current version is [hash]. Migration required."

computeSaveId(manifestHash, playerName) → Promise<string>
  Returns sha256(manifestHash + ":" + playerName) as a hex string.

Produce: updated engines/pokemon-engine.js.

Also produce tests/project-format-test.js — headless Node.js tests:
- computeManifestHash produces the same result regardless of key insertion order (order-independent test)
- saveDraft → loadDraft round-trips correctly
- publishProject returns a hash and the hash is present on the stored project
- loadGame with mismatched hash throws MismatchError
- computeSaveId for same inputs always returns same result

Note: these tests will need a mock Host. Implement a simple in-memory mock Host at the top of the test file.
Run with node tests/project-format-test.js — all pass.
```

**Output you should see:**
- Updated engine with ProjectFormat
- `tests/project-format-test.js` — all pass

---

## Session G — First Real Nexus Block (Step 10)

**What this produces:** A game actually running inside Nexus OS loaded from IndexedDB.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `engines/pokemon-engine.js` + `blocks/pokemon-player.html` (from Session A)

**Paste this prompt:**
```
The spec and current files are attached.

STEP 10 — pokemon-player.html (full implementation)

Upgrade blocks/pokemon-player.html from the Session A hello-world to a real player block.

The block must:

1. Boot via NexusBlockClient with this manifest:
   emits: ["pokemon.player.ready", "pokemon.player.state"]
   consumes: ["pokemon.load", "pokemon.preview"]
   app: { name: "Pokemon Player", version: "0.1.0" }

2. On MOUNTED:
   - Create a Nexus Host object that implements the full host.storage interface using IndexedDB (NexusOS_Data v2 stores game_projects and save_games)
   - Create a Nexus Host object that implements host.assets (reads from asset_blobs store, resolves assetRef → Blob)
   - Create InputManager and AudioEngine
   - Inject the Host into the engine
   - Emit pokemon.player.ready

3. On receiving "pokemon.load" message (payload: { manifestHash, saveId }):
   - Load the project from game_projects using manifestHash
   - Run ProjectValidator — if invalid, show an error state, do not crash
   - Load the save from save_games using saveId (if no save found, start a new game at startMap/startX/startY)
   - Check projectManifestHash on save matches — if mismatch, show a warning overlay and offer to start a new game
   - Begin the game loop: render tile map, handle input, fire events

4. On receiving "pokemon.preview" message (payload: { projectDelta }):
   - Apply the delta to the currently loaded project state (advisory only — do not write to IndexedDB)
   - Re-render immediately

5. The game loop:
   - requestAnimationFrame loop
   - Each frame: read InputManager state, move player if direction held (tile-by-tile, respect CollisionMap), update camera, render all layers in order (ground, detail, overhead above player), render player sprite
   - On entering a new tile: check events for onEnter/onEnterOnce triggers, run EventExecutor if matched
   - On interact press: check events for onInteract at current position, run EventExecutor if matched

For now, the EventExecutor callbacks (onBattle, onWarp, etc.) can be stubs that log to console — battle and warp will be wired in later steps.

To test: manually add a record to game_projects in the browser DevTools (or write a small seed script) with a minimal valid project from the spec. Then send a pokemon.load message from the kernel. The game should render.

Produce the updated blocks/pokemon-player.html. Also write a brief test-plan comment at the top of the file describing how to manually verify it works in Nexus OS.
```

**Output you should see:**
- `blocks/pokemon-player.html` — loads in Nexus OS, renders a tile map from IndexedDB

---

## Session H — Standalone Export Proof (Step 11)

**What this produces:** A single HTML file you double-click and a game plays. No server. No Nexus.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `engines/pokemon-engine.js`

**Paste this prompt:**
```
The spec and engine are attached.

STEP 11 — Standalone export spike

Create a standalone exporter script: tools/export-standalone.js

This is a Node.js script that takes a project JSON file path and an asset directory, and outputs a single self-contained HTML file.

It must:
1. Read the project JSON from the given path
2. For each assetRef in the project (tilesets, sprites, audio), read the corresponding file from the asset directory and convert to a data URI (base64 encoded with correct MIME type)
3. Replace all assetRef values in the project JSON with their data URIs
4. Read engines/pokemon-engine.js
5. Output a single HTML file that:
   - Embeds the full engine JS inline in a script tag
   - Embeds the project JSON (with inlined data URIs) as a JS variable
   - Creates a Standalone Host:
     storage: uses IndexedDB directly (same API as Nexus Host but without block client). Save key derived as sha256(manifestHash + ":" + playerName).
     assets: resolve(assetRef) returns a Promise that resolves to a Blob from the inlined data URI map
     input: same InputManager
     audio: same AudioEngine
     wallet: checkOwnership always returns true
   - Boots the engine with the Standalone Host
   - Shows a "Enter your name" prompt before starting (to generate the save ID)
   - Runs the game
   - Has no dependencies on Nexus, block client, relays, or any external URL

To test this spike, create a minimal test project: tools/test-project/project.json with one 10x10 map, a placeholder tileset (a 160x160 PNG of solid colour squares generated by a small Node canvas script), and one creature with a valid 16-byte DNA. Run the exporter. Open the output HTML by double-clicking. The game should run with no console errors and no network requests.

Produce: tools/export-standalone.js and tools/test-project/project.json and tools/test-project/generate-tileset.js (the tileset generator). Document how to run the full test.
```

**Output you should see:**
- Running `node tools/export-standalone.js` produces a single HTML file
- Double-clicking it plays the game in a browser with no server

---

## Session I — The Maker (Step 12)

**This is the biggest session. May need to be split into I-a (map editor) and I-b (DNA editor + events).**

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `engines/pokemon-engine.js` + `blocks/pokemon-player.html`

**Paste this prompt:**
```
The spec and current files are attached. This is the largest step. Build it in this order: map editor first, then creature genome editor, then event placer. Produce a working block at each sub-step — do not leave any part half-built.

STEP 12 — pokemon-maker.html

Create blocks/pokemon-maker.html as a Nexus managed block.

Manifest:
  emits: ["pokemon.project.updated", "pokemon.preview"]
  consumes: ["pokemon.player.ready"]
  app: { name: "Pokemon Maker", version: "0.1.0" }

This block is the SOLE WRITER to game_drafts, game_projects, and asset_blobs in IndexedDB.

PART A — Map editor
- A sidebar showing: list of layers (ground, detail, terrain, overhead, objects), tileset tiles as a clickable palette, terrain types from the palette as a selectable list
- A main canvas showing the current map
- Click/drag on the map to paint the selected tile or terrain type onto the selected layer
- Buttons: New Map, Save Draft, Publish (→ writes to game_projects, emits pokemon.project.updated with { manifestHash })
- When Save Draft is pressed: call ProjectFormat.saveDraft(), emit pokemon.preview with the full current project state delta so the player block re-renders immediately
- Import tileset: file input that accepts PNG, converts to Blob, stores in asset_blobs by SHA-256, adds assetRef to the project

PART B — Creature genome editor
- A section in the sidebar: "Creatures"
- For each creature in the project: show its name, a "Edit DNA" button
- DNA editor: 16 sliders (0–255 each, labeled Byte 0 through Byte 15)
- Live preview panel updated on every slider change using NexusBattleEngine.deriveStats(dna), deriveMoves(dna), deriveTypes(dna):
  Shows: HP range, atk, def, spAtk, spDef, spd (as derived numbers), type(s) (as type names), move list (as move names)
- "Add Creature" button: generates a random 16-byte DNA, adds to project
- Creator never types stats or moves directly. DNA is the only input.

PART C — Event placer
- Click on any tile in the map editor to open an event panel for that tile
- Panel shows existing events at that tile (if any)
- "Add Event" opens a simple form: trigger type (dropdown), optional condition (flag name + expected value), command list (add commands one by one from a dropdown of available commands, fill in their fields)
- Commands available match the closed set in the spec
- branch and ifFlag commands: the form must require a default field (cannot save without it)

General:
- The block maintains one active draft project at a time
- Project state is in memory; IndexedDB writes happen only on explicit Save Draft or Publish
- All bus payloads are IDs and small deltas only — never full map data

Produce blocks/pokemon-maker.html. Test: open both maker and player blocks in Nexus OS. Edit a map in the maker, press Save Draft, confirm the player updates live. Create a creature, adjust DNA, confirm derived stats update. Add a dialogue event, publish, load in player, walk into the tile, confirm dialogue fires.
```

**Output you should see:**
- `blocks/pokemon-maker.html` — working in Nexus OS
- Live preview from maker to player working
- DNA editor with live stat/move preview working
- Basic event placement working

---

## Session J — Battle Adapter (Step 13)

**What this produces:** Creatures battle each other inside the game when events trigger it.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `engines/pokemon-engine.js` + `engines/battle-engine.js`

**Paste this prompt:**
```
The spec and both engine files are attached. battle-engine.js is clean and dependency-free — it exports NexusBattleEngine globally. Read both files carefully before writing anything.

STEP 13 — BattleEngine adapter

Add a BattleEngine class to engines/pokemon-engine.js. This is a THIN ADAPTER. It implements zero combat rules. All combat logic comes from NexusBattleEngine.

The adapter must:

1. Conversion: convert a project creature {id, name, dna, hues} to the eidolon input shape {id, name, dna, hues} (in this case they are already compatible — note this in a comment)

2. Party management:
   - Method: loadParty(partyData) — takes save.party array, stores current HP, PP, and status for each creature
   - Method: saveParty() → partyData — returns the current party state for saving
   - HP and status are persisted across battles (committed to battle data_hash)
   - PP is tracked per-battle by the adapter; reset to maxPP between battles is not automatic — it depends on items used

3. Method: runBattle(attackerCreatureId, defenderCreatureId, project, battleSeed) → Promise<"win"|"lose"|"flee">
   - Gets attacker from party, defender from project.creatures by id
   - Calls NexusBattleEngine.initBattle({eidolonA: attacker, eidolonB: defender, battleSeed})
   - IMPORTANT: after initBattle, inject the attacker's persisted HP into stateA.hp (not full HP — persisted HP). Same for status. This is the wrapper's only modification to the init state.
   - The move menu shown to the player comes from NexusBattleEngine.deriveMoves(attacker.dna) — the player picks from these, they cannot choose other moves
   - Turn loop: show move menu → wait for player input → call resolveTurn → map events to UI → check isOver → repeat
   - On "flee" attempt: 50% chance (use a deterministic RNG seeded from the current turn seed). If successful, resolve "flee". If not, continue battle.
   - On battle end: update party HP and status from final state. Return "win", "lose", or "flee".

4. Event mapping: map the engine event stream to visual output on the canvas:
   - damage → show damage number floating up, HP bar animates
   - miss → show "Miss!" text
   - status → show status name text (burn!, paralyzed!, etc.)
   - status_tick → show tick damage number
   - move → show move name at top of battle screen
   - heal → show heal number
   - stage → show stat change indicator

5. Wire the BattleEngine into the player block's EventExecutor onBattle callback.

Now add the battle golden tests. Fill in tests/battle-golden.js with the 12 required scenarios from the spec. For each scenario, construct fixed DNA arrays and battleSeeds that will produce the expected outcomes, run them against NexusBattleEngine, and assert the exact outputs. All 12 must pass. Run with node tests/battle-golden.js.

Produce: updated engines/pokemon-engine.js, updated tests/battle-golden.js with all 12 passing.
```

**Output you should see:**
- Battles trigger and resolve in the player block
- 12 golden tests all pass

---

## Session K — Nostr Distribution Proof (Step 14)

**What this produces:** A game published to Nostr via Blossom, fetched back, verified.

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `blocks/vibes/vibes-library.html` (for Nostr relay code reference)

**Paste this prompt:**
```
The spec is attached. Also attached is the existing vibes-library.html for reference on how Nostr relay connections and signing are implemented in this codebase. Read both.

STEP 14 — Nostr distribution spike (throwaway prototype)

Create tools/nostr-publish-test.js — a Node.js script that proves Nostr publishing and Blossom blob storage work end to end.

The script must:
1. Load the test project from tools/test-project/project.json
2. Run the standalone exporter (tools/export-standalone.js logic) to get the full inlined project JSON
3. Compute the SHA-256 of the project JSON blob
4. Upload the blob to a public Blossom server (use https://blossom.primal.net or another public endpoint). Use the BUD-01 PUT /upload endpoint. Document which server was used.
5. Construct a kind 30460 Nostr event per the spec, signed with a throwaway test keypair (generate a fresh keypair for this test using the same secp256k1 code used in vibes-library.html). Tags include: d, name, description, engine_version, manifest_hash, genre, realm. Content includes the blobs array with the Blossom URL and SHA-256.
6. Publish the event to a public relay (use wss://relay.damus.io or another public relay).
7. Immediately subscribe to kinds: [30460] from that relay to confirm the event is received back.
8. Fetch the blob from the Blossom URL returned in step 4 and verify its SHA-256 matches.
9. Print a clear success or failure report for each step.

This is a throwaway spike — it does not need to be integrated into the block system. Its only job is to confirm that the distribution pipeline works in practice and that relay sizes are not a problem.

Run it and report exactly what happened at each step, including any size limits or errors encountered.
```

**Output you should see:**
- Script runs, blob uploads, event publishes, event received back, blob fetched and hash verified
- Or a clear failure report so we can adapt

---

## Session L — Full Publish Block (Step 15)

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `engines/pokemon-engine.js` + `blocks/vibes/vibes-library.html`

**Paste this prompt:**
```
The spec and relevant files are attached.

STEP 15 — pokemon-publish.html

Create blocks/pokemon-publish.html as a Nexus managed block.

Manifest:
  emits: ["pokemon.publish.ready", "pokemon.load"]
  consumes: ["pokemon.project.updated"]
  app: { name: "Pokemon Publish", version: "0.1.0" }

This block has its own direct wallet access via kernel channel (for pre-battle lock verification in Step 16). For now, wallet calls are stubbed.

The block must implement:

1. Game browser — main view:
   - Subscribe to Nostr relays for kinds: [30460]
   - Default view is WoT-filtered: only show events from pubkeys within 2 hops of the logged-in user's social graph. Derive the social graph from the user's follow list (kind 3 events from their pubkey).
   - Cold-start (no follows): show all kind 30460 events unfiltered with a banner "Showing all games — follow creators to filter your feed"
   - Each game card shows: name, description, creator pubkey (shortened), engine_version badge
   - "Play" button: fetch the blob from the blobs array (try each URL, verify SHA-256), store in game_projects, emit pokemon.load with { manifestHash }

2. Publisher — triggered on receiving pokemon.project.updated:
   - Show a "Publish to Nostr" button
   - On click: load the project from game_projects (by manifestHash from the message), upload blob to Blossom, publish kind 30460 event signed with user's Nostr key (from wallet/identity layer)
   - Show publish status (uploading → signing → publishing → done)

3. Engine version pinning:
   - When loading a game for play, check engine_version tag against NexusBattleEngine.ENGINE_VERSION
   - If mismatch: show a warning "This game was made for engine version X. You have version Y. It may not play correctly."

Produce blocks/pokemon-publish.html.
```

**Output you should see:**
- Games appear in the discovery feed
- Clicking Play loads and launches the game in the player block
- Publishing a made game works

---

## Session M — Wallet-Locked Items (Step 16)

**Files to attach:** `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` + `engines/pokemon-engine.js` + `blocks/pokemon-publish.html`

**Paste this prompt:**
```
The spec and files are attached. This is the final step. It is fully additive — nothing built so far should break.

STEP 16 — Wallet-locked creatures and items

Two phases. Keep them cleanly separate.

PHASE 1 — Acquisition gate (engine Host)
In the Nexus Host (inside pokemon-player.html):
- Implement host.wallet.checkOwnership(lockId) → Promise<boolean>
- This calls the Nexus kernel channel to the Wallet block using the existing wallet.lock.verify channel pattern (reference Wallet_v4_nexus.html for the channel name and message format)
- Returns true if the lock is currently held by the logged-in user's pubkey, false otherwise

In the engine's event handling (EventExecutor giveItem and giveCreature commands):
- Before adding an item/creature to the player's inventory, check if it has ownership: { kind: "wallet-lock", lockId }
- If lockId is present, call host.wallet.checkOwnership(lockId)
- If false, show dialogue "You don't own this item" and do not add it
- If true, add it normally

In the Standalone Host: checkOwnership always returns true (standalone games cannot enforce wallet locks).

PHASE 2 — Pre-battle verification (publish block)
In pokemon-publish.html, before constructing kind 30431 (battle intent):
- Collect all wallet-locked creatures and items from both parties' lineups
- For each lockId, call the wallet block directly (not through the engine Host) to verify current ownership
- Collect attestations: [{lockId, ownerPubkey, verified}]
- Include attestations in the data_hash bundle per the spec (Section 9)

To test:
- In the maker, add a creature with ownership: { kind: "wallet-lock", lockId: "test_lock_001" }
- Place a giveCreature event in a map
- In the player, walk into the tile
- With the lock held: creature is received
- Without the lock: dialogue shows "You don't own this item"
- Document how to create and hold a test lock using the existing wallet block

Produce: updated pokemon-player.html (Nexus Host with wallet.checkOwnership), updated pokemon-publish.html (pre-battle attestations). All existing tests still pass.
```

**Output you should see:**
- Wallet-locked items only received by owners
- Pre-battle attestations included in battle intent events

---

## Quick Reference — Files That Matter

| File | Purpose | Who touches it |
|------|---------|---------------|
| `POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` | Master spec — attach to every session | Read-only after today |
| `engines/pokemon-engine.js` | The game engine library | Added to in every session A-M |
| `engines/battle-engine.js` | NexusBattleEngine — FROZEN | Never modified |
| `blocks/pokemon-player.html` | Game player block | Sessions A, G, J, M |
| `blocks/pokemon-maker.html` | Game editor block | Session I |
| `blocks/pokemon-publish.html` | Nostr discovery + publish | Sessions L, M |
| `blocks/system/nexus-db.html` | Database — DB_VERSION bump | Session A only |
| `docs/POKEMON_MAKER_SCHEMA.md` | Schema reference | Session A |
| `tests/battle-golden.js` | Battle regression tests | Sessions A (scaffold), J (filled) |
| `tests/event-executor-test.js` | EventExecutor tests | Session D |
| `tests/validator-test.js` | Validator tests | Session E |
| `tests/project-format-test.js` | ProjectFormat tests | Session F |
| `tools/export-standalone.js` | Standalone HTML exporter | Session H |
| `tools/nostr-publish-test.js` | Nostr/Blossom spike | Session K |

---

## What to Do When Things Go Wrong

**ChatGPT produces code that doesn't work:** Paste the broken code to Sonnet with a description of what went wrong. Sonnet writes a correction prompt. Paste it into the same ChatGPT session (not a new one).

**ChatGPT drifts from the spec:** Show Sonnet the specific section it got wrong. Sonnet writes a targeted correction.

**A step is too big for one session:** Sonnet will split it. Already anticipated for Session I.

**Something in the spec turns out to be wrong when you try to implement it:** Bring it to Sonnet immediately. Do not let ChatGPT improvise a fix. Architecture changes go through Sonnet, not ChatGPT.

**The test suite breaks after a change:** Do not proceed to the next session. Fix it first.
