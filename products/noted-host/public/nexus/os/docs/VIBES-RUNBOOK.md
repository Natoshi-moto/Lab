# EIDOLON VIBES ENGINE — Runbook v1

This is everything you need to get the unified system running on day one. Follow it in order.

---

## What you have now

After this round you have **four new files** plus a **patched Nexus OS**:

| File | What it is |
|---|---|
| `Nexus_OS.html` | Your existing OS with the new blocks added to the catalog |
| `vibes-library.html` | The asset library — owns storage, lineage, tags |
| `vibes-crucible.html` | The composer — picks creatures + environment + attacks → makes a battle |
| `vibes-arena.html` | The runner — plays battles inside Nexus, exports standalone HTML |
| `vibe-adapter.js` | Drop-in shim for graduating forges (use later, not day one) |

> **Current archive note (v1.4):** this runbook was first written when the Vibes files were still root-level. In the current archive, the Vibes blocks live under `blocks/vibes/` and shared adapters live under `engines/`. Use the actual paths in `docs/CODEBASE_ORIENTATION.md` when editing files.

---

## STEP 1 — File layout

The current archive is already laid out. `Nexus_OS.html` stays at root, Vibes blocks live under `blocks/vibes/`, shared engines/adapters live under `engines/`, and the catalog points at those paths. Older flat-folder notes below are historical context, not instructions to flatten the archive.

Your folder should look something like this (names of your existing forges may vary):

```
Nexus Moot v1.4/
├── Nexus_OS.html
├── engines/
│   ├── nexus-block-client.js
│   └── vibe-adapter.js
├── blocks/
│   ├── vibes/
│   │   ├── vibes-library.html
│   │   ├── vibes-crucible.html
│   │   ├── vibes-arena.html
│   │   └── kin-forge.html
│   ├── system/
│   │   └── nexus-db.html
│   └── forges/
│       └── ...
└── tests/
```

**Important:** the catalog references blocks by exact relative path. If a file is moved or renamed, update `BUILTIN_CATALOG` / `LEGACY_CATALOG` in `Nexus_OS.html`, then run `bash tests/run.sh`. `tests/catalog-paths-tests.js` catches catalog drift and `tests/local-script-refs-tests.js` catches broken local `<script src>` paths.

---

## STEP 2 — First boot

1. Double-click `Nexus_OS.html`. Nexus boots.
2. Click the launcher (taskbar). You should see all your apps including the three new ones: **Vibes Library** (◈), **Crucible** (⚒), **Arena** (⚔), plus all your forges showing as legacy.
3. **Mount your folder.** Click the folder icon in the taskbar. Pick the same folder where `Nexus_OS.html` lives. This grants Nexus permission to read your existing creature/env/etc files.

That's it. The system is up.

---

## STEP 3 — Populate the Library (the day-one flow)

Here's the sequence that takes you from "empty library" to "first composed battle":

### 3a. Open the Vibes Library

Click ◈ Vibes Library in the launcher. You'll see an empty grid with a drop zone.

### 3b. Pull in your existing files

Two ways:

**Option A — Rescan folder.** Click "↻ Rescan" (top-right). The Library walks your mounted folder, finds `.environment.json`, `.kin.json`, exported battle HTMLs, etc., wraps each as a Vibe, and indexes them. You'll see a toast like "Found 12 new vibes · skipped 3 of 47."

**Option B — Drag and drop.** Drag any `.json` file (or your exported PHANTIVEX-style battle HTMLs) directly onto the Library window. They'll be ingested live.

After this you should see cards for each Vibe — creatures, environments, attacks, kin sets, battles — sorted by recency, filterable by type via the left sidebar.

### 3c. Tag a few things

Click any card. The detail panel slides out on the right. Type a tag in the input ("forest", "boss", "phosphor", whatever) and press Enter. Tags appear in the sidebar; you can filter the grid by tag.

Tags are how you'll find things later when the library has hundreds of vibes. Tag liberally — they're cheap.

### 3d. Open the Crucible

Click ⚒ Crucible in the launcher. You'll see four slots: Protagonist, Opponent, Stage, Moveset (4 attack slots).

Click "browse" on the Protagonist slot. A picker pops up listing every creature Vibe in your library. Pick one. Repeat for Opponent. Optionally pick a Stage and 1–4 Attacks.

### 3e. Forge the battle

Type a name into the title field at the top (or leave blank — it'll auto-name `[A] vs [B]`). Click **FORGE BATTLE**.

A new Battle Vibe appears in your library, with parents linking back to every component you picked. The Crucible offers to open it in the Arena.

### 3f. Run it in the Arena

Click yes (or open Arena ⚔ from the launcher and pick the battle). The two creatures appear in the stage, the environment renders behind them, attacks fire automatically, HP bars deplete, one wins.

This is the **minimum viable** Arena — deterministic seeded silhouettes, simple attack timing, working knockback and damage. It's not as polished as your standalone PHANTIVEX-style exports. That's by design — see Step 4.

### 3g. Export to standalone HTML

Click "↓ Export HTML" in the Arena. You get a `.battle.html` file containing the full bundle (battle + both creatures + environment + every attack). It's portable — share it, archive it, drop it back into the Library to re-import.

---

## STEP 4 — The Arena vs. PHANTIVEX-style exports

Be honest about what you have:

- **Arena (in-Nexus)** is for *quick previewing* — does this composition feel right?
- **PHANTIVEX-style standalone exports** are your *finished battles* — they have full rendering, particle effects, polished animation.

Right now Arena's export embeds the battle data but uses a minimal renderer. To get a full polished battle, you still use Battleforge → save → export route you already know. The Arena's job is to make the *composition step* fast: pick parts, see them fight, iterate, save.

A future round can port the PHANTIVEX renderer into Arena's export path so the in-Nexus Arena and the standalone export look identical. That's a polish pass, not a structural change.

---

## STEP 5 — When something breaks

**Library shows zero vibes after rescan.** Confirm folder is mounted (taskbar should show the folder name). Open Terminal in Nexus and you should see the Library's `[block_ready]` log. If not, the iframe never finished booting — try closing and reopening Vibes Library.

**Crucible's "browse" returns empty even though Library has items.** The Crucible needs Library running. Make sure Vibes Library window is open at least once in the session — the Library subscribes its handlers on first mount.

**Forges don't appear in the launcher.** Open `Nexus_OS.html` in a text editor. Search for "Eidolon Forges" — you'll find the `LEGACY_CATALOG` entries. Make sure each `path:` matches a real file in your folder.

**Imported a creature but it shows as "Untitled".** That JSON didn't have a `name` field at the top level. The import names from filename instead — fine, you can rename via the Library detail panel (click the name? — actually, in v1 you'd just re-tag and search by tag; renaming via UI is a future polish).

**Arena says "load failed" for a battle.** The battle's referenced creatures/environment/attacks don't exist in the library. This happens if you delete a creature that's referenced by a battle — battles store references-by-id, not snapshots. Solutions: don't delete components of saved battles, or rebuild the battle in Crucible.

---

## STEP 6 — Graduating forges to adapter mode (future, optional)

Right now your forges run in **legacy mode** — they save files via download, the Library picks them up via folder rescan. This works but the round-trip is clunky.

**Adapter mode** = forge has direct "Save to Library" and "Load from Library" buttons that talk to the Library live. No file dance.

To graduate one forge:

1. In a future session, open the forge HTML in a text editor.
2. For a forge under `blocks/<category>/`, add these scripts at the top of the `<body>` in this order:

   ```html
   <script src="../../engines/nexus-block-client.js"></script>
   <script src="../../engines/vibe-adapter.js"></script>
   ```

   If the forge lives somewhere else, adjust the relative paths. Do not use the old root-level `vibe-adapter.js` path unless the file has actually been copied there.
3. Add `window.VIBE_FORGE_META = { title:"Battleforge", icon:"⚔", description:"..." };` *before* that script tag.
4. Add two buttons to the UI: "Save to Library" calls `Vibe.save({type, name, payload})` with the forge's current state. "Load from Library" calls `Vibe.list({type})`, shows a chooser, then `Vibe.load(id)` and feeds `.payload` to the forge's existing load handler.
5. Remove the `legacy: true` flag from that forge's catalog entry in `Nexus_OS.html`. Now it boots as a managed block with the full kernel protocol.

We do this one forge at a time. Environment Forge is the simplest place to start (smallest state, simplest schema). Battleforge and Console come last because they're most complex.

The forges' existing "Save as File" / "Load File" buttons stay. They keep working as standalone HTMLs forever. The adapter is *additive* — new buttons, no removed functionality.

---

## STEP 7 — What each new block actually does

### Vibes Library ◈
- Owns its own IndexedDB store (`VibesLibrary`), separate from NexusDB.
- The mounted folder is the source of truth — IndexedDB is a fast index/cache. If the cache ever dies, rescan rebuilds it from the folder.
- Exposes 12 channels on the Nexus bus (all `vibe.*`): save, load, list, search, delete, tag, lineage, subscribe, import-folder, export-folder + result + notify.
- Auto-detects file format on import: vibe envelopes, environment JSON, kin JSON, creature JSON, exported battle HTMLs.
- Computes content-addressed IDs so duplicates dedupe automatically.
- Lineage view walks both ancestors and descendants up to 8 generations.

### Crucible ⚒
- Pure composer. Doesn't *create* assets, only references them.
- Battle Vibes store references-by-id, not snapshots. If you tweak a creature, every battle it's in inherits the tweak (until you save the creature as a new vibe with a new id).
- Auto-inherits union of component tags onto the battle.
- Launches Arena via `nexus.launch` + `arena.play` channel after forging.

### Arena ⚔
- Subscribes to `arena.play` for direct hand-offs from the Crucible.
- Renders deterministically from creature DNA bytes (same DNA → same silhouette every time, forever).
- AI auto-attacks every 1.5–3s, picks randomly from moveset.
- Export bundles the battle + all referenced vibes into a self-contained HTML file.

### vibe-adapter.js
- Sits unused on day one.
- When you graduate forges (Step 6), this is the file that gives them `window.Vibe.{save,load,list,...}` API.
- Handles BOOT/DECLARE/MOUNT/PING/PONG/SUB protocol transparently.
- Falls back to file picker / Blob download when running outside Nexus, so your forges keep working as standalone HTMLs.

---

## What's next

Round 4 is done. The unified system works end-to-end. From here, future sessions will:

1. Graduate the Environment Forge to adapter mode (smallest, simplest first).
2. Port the PHANTIVEX renderer into Arena export so in-Nexus battles match standalone exports visually.
3. Add a Codex view (browse mode for the Library — visualize the lineage graph as an actual tree).
4. Generalize Kin Forge's variation engine to work on attacks and environments, not just creatures.
5. Add multi-tag search & saved queries.
6. Handle Battleforge's dual creature/attack output (probably split it or add output-type tagging at save time).

None of those are blocking. You can start using what's here today.
