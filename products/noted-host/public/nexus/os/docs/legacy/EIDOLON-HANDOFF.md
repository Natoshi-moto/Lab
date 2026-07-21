# EIDOLON / NEXUS — AI Handoff Document

**Audience:** Any AI joining this project mid-stream.
**Purpose:** Get you productive in 15 minutes. Read top-to-bottom; nothing is filler.

---

## 0 · The TL;DR

Eidolon is a **Pokémon-style creature/battle game engine** built as a constellation of single-HTML-file tools running inside a custom **browser microkernel OS** (Nexus OS). The user is a non-coder with strong design taste who has built ~10,000 lines of working forge tools through AI collaboration. They want everything to compose: creatures breed with creatures, environments stage battles, attacks attach to creatures, battles reference all of the above by id.

There is no server. No build step. No npm. Everything is single HTML files served via `file://` or any static web server. Storage is IndexedDB + the File System Access API.

Two top-level codebases coexist:

| Stack | Role |
|---|---|
| **Nexus OS** | Browser microkernel that hosts iframe-sandboxed apps via a strict IPC protocol. Real OS — has fs syscalls, an LLM-API gateway, rate limiters, a watchdog, persistent state. |
| **Eidolon Vibes Engine** | A subsystem of blocks running inside Nexus that handles creature/environment/attack/battle assets. Newest layer — added Round 4. |

The vocabulary you must know:

- **Vibe** — any saved asset (creature, environment, attack, kin set, battle). The user-facing name for what was originally going to be called "Type" or "Thing" — **Vibe** won the naming debate because it claims territory, fits the CRT/Eidolon aesthetic, and matches the affinity-merge mechanic.
- **Forge** — any authoring tool that creates a particular kind of vibe (Battleforge, Environment Forge, Kin Forge, Console, Multiforge).
- **Library** — the unified asset store. Owns IndexedDB, mirrors to filesystem, exposes the `vibe.*` channel surface.
- **Crucible** — the composer block. Takes a creature + environment + attacks → produces a battle vibe.
- **Arena** — the runner block. Plays a battle vibe inside Nexus, exports standalone HTML.
- **Codex** — *future* browse view (not built yet).
- **Block** — any sandboxed iframe app inside Nexus. Either *managed* (speaks the kernel protocol) or *legacy* (just an HTML file).

The user-facing name for the whole creature universe is **Eidolon**. The OS is **Nexus**. When in doubt, use both — "Eidolon Vibes Engine running on Nexus OS."

---

## 1 · Architectural insights you absolutely must internalize

### 1.1 Determinism is the load-bearing mechanic

**Creatures are 16 bytes of DNA + 3 hue floats** fed through `mulberry32(seed)` to deterministically generate every visual feature: body shape, plate count, eye position, gradients, animations. **Same DNA always renders the same creature, forever.**

This means:
- Vibes are tiny (~few hundred bytes each).
- A library of 10,000 creatures fits in a couple MB.
- "Save a creature" = save 16 bytes + hues. Don't save a snapshot.
- Breeding = byte-wise lerp on DNA arrays. Already implemented in `eidolon-console-v0_5-loop.html` line 1843.
- Any forge or runner can reconstruct any creature given its DNA. No image storage ever.

The same logic applies to **environments** (31 axes, deterministic from values), **attacks** (42 axes, same), **kin sets** (anchor + jitter spec).

If you find yourself reaching to save a rendered image, a particle config snapshot, or anything bigger than the seed — stop. Save the seed, render on demand.

### 1.2 The filesystem is the source of truth

The Library uses IndexedDB **as a fast index/cache**. The mounted folder is canonical. If IndexedDB dies, a rescan rebuilds the index from `.vibe.json` files on disk. This is the same pattern Git uses (filesystem = truth, `.git` = index).

Why this matters: vibes are *files* the user can see in their Downloads folder, back up, share, archive, drag between machines. The cache is convenience. Don't ever design something that *requires* IndexedDB to function.

### 1.3 The Library brokers; forges don't talk to NexusDB

There is a separate persistence block called **NexusDB** (`nexus-db.html`) — a quasi-SQL layer over IndexedDB. It exists for the Nostr/social side of the OS. **The Vibes Library does NOT use NexusDB.** The Library owns its own IndexedDB store (`VibesLibrary`).

This was a deliberate decision. NexusDB hardcodes table creation in its `onupgradeneeded`. Adding `vibes_*` tables there would couple our schema migrations to NexusDB's release cycle. Owning storage is simpler than multiplexing through a quasi-SQL primitive.

Forges should never talk to NexusDB or to IndexedDB directly. They emit `vibe.*` channels; the Library is the broker. This isolates schema concerns to one place.

### 1.4 The kernel protocol is non-negotiable

The Nexus kernel implements a real microkernel discipline: every block is a sandboxed iframe communicating via MessageChannel. Strict handshake (DECLARE → MOUNT_CHALLENGE → MOUNT_ACK → MOUNTED). Rate limiters. Watchdog. Channel allowlists.

**Every managed block must:**
1. Listen for `BOOT` on `window.message`, grab `e.ports[0]`.
2. `port.postMessage({type:'DECLARE', manifest:{emits:[], consumes:[]}, app:{...}})`.
3. Respond to `MOUNT_CHALLENGE` with `MOUNT_ACK` (echoing the nonce).
4. After receiving `MOUNTED`, **send explicit `SUB` messages for every channel in `consumes`**. Declaring in `consumes` is an allowlist, not a subscription. This is the source of bug #10 fixed in `nexus-db.html` and the most common gotcha when writing new blocks.
5. Respond to `PING` with `PONG`.
6. Listen for `MSG` events with `msg.channel` and `msg.payload`.

Skip any of these and your block silently fails to receive messages.

### 1.5 fs.* is a syscall

The kernel intercepts emits on `fs.list`, `fs.read`, `fs.write`, `fs.delete`, `fs.status`, `fs.mkdir`. They are NOT pubsub; they're syscalls. The kernel responds via direct `port.postMessage` with `channel:"fs.result"`, payload `{requestChannel, _reqId, ok, ...data}`.

Mount state is checked via `fs.status` returning `{ok:true, mounted:bool, folderName:str|null}`. The kernel also broadcasts `fs.mounted` *to existing MOUNTED blocks* when the user mounts via the taskbar — but blocks that boot AFTER mount won't get the broadcast and must query `fs.status` themselves.

There is no syscall to *trigger* the folder picker. Only the kernel UI (taskbar) can. Blocks that need a folder mounted must either tell the user to click 📁 in the taskbar, or just gracefully degrade.

---

## 2 · The Vibe envelope (canonical asset shape)

```js
{
  format:    "vibe/1",                       // envelope version
  id:        "v_creature_a3f1c8...",         // content-addressed: v_<type>_<16chars-of-hash>
  type:      "creature",                     // creature|environment|attack|kin|battle
  subFormat: "eidolon-creature/1",           // the original forge's format string
  name:      "PHANTIVEX",
  tags:      ["forest","nocturnal"],
  parents:   ["v_creature_77a2..."],         // empty for originals
  birthHash: "sha256:...",                   // hash of canonical(payload)
  createdAt: "2026-05-03T...",
  source:    "battleforge",                  // forge that produced it
  payload:   { ... }                         // the original forge JSON, untouched
}
```

**The whole forge JSON nests inside `payload` verbatim.** Battleforge's 42 axes, Environment Forge's 31 axes, Console's `dna`/`hues`/`lineage` — all live unchanged inside `payload`. The envelope adds only what the Library needs: identity, type, tags, provenance, hash. Forges never need to know about envelopes — the bus adapter wraps on save and unwraps on load.

**id generation:** content-addressed. `id = "v_" + type + "_" + sha256(canonical(payload)).slice(0,16)`. Two saves of the same payload produce the same id → automatic dedup. Renames don't change id; only `payload` mutations do.

**Battle envelopes** store **references-by-id**, not snapshots:

```js
payload: {
  format: "eidolon-battle/1",
  participants: ["v_creature_aaa", "v_creature_bbb"],
  stage:        "v_environment_ccc",
  moveset:      ["v_attack_xxx", "v_attack_yyy"]
}
```

When you tweak a creature, every battle it's in inherits the tweak. Until you save the creature as a *new* vibe (different content → different id), at which point the battle still references the old one.

---

## 3 · The protocol surface

Every channel the Library handles is `vibe.*`. Twelve channels total:

| Channel | Direction | Payload | Returns |
|---|---|---|---|
| `vibe.save` | forge → library | `{envelope, _reqId}` | `{ok, envelope}` via vibe.result |
| `vibe.load` | forge → library | `{id, _reqId}` | `{ok, envelope}` |
| `vibe.list` | forge → library | `{type?, tags?, sort?, _reqId}` | `{ok, data:[summary,…]}` |
| `vibe.search` | forge → library | `{q, type?, _reqId}` | `{ok, data:[summary,…]}` |
| `vibe.delete` | forge → library | `{id, _reqId}` | `{ok}` |
| `vibe.tag` | forge → library | `{id, add?, remove?, _reqId}` | `{ok, envelope}` |
| `vibe.lineage` | forge → library | `{id, depth?, _reqId}` | `{ok, data:{seed, ancestors[], descendants[]}}` |
| `vibe.subscribe` | forge → library | `{type?, tag?, _reqId}` | `{ok}` |
| `vibe.import-folder` | forge → library | `{_reqId}` | `{ok, data:{added, skipped, scanned}}` |
| `vibe.export-folder` | forge → library | `{ids?, _reqId}` | `{ok, data:{written}}` |
| `vibe.result` | library → forge | `{_reqId, ok, ...}` | (reply for all of the above) |
| `vibe.notify` | library → forge | `{op, envelope}` | (broadcast on save/delete/tag) |

**Request/response correlation:** every call carries a UUID `_reqId`. The Library echoes it back in `vibe.result`. Callers keep a `Map<_reqId, {resolve, reject}>` so they can `await Vibe.save(env)` and have it behave like a promise.

The Library broadcasts `vibe.result` to ALL subscribers of that channel. This is slightly wasteful (Crucible and Arena both see all responses), but `_reqId` discrimination handles it cleanly. Don't change this — fixing it would require kernel-level direct routing which is out of scope for the protocol layer.

---

## 4 · File-by-file reference

### 4.1 Nexus OS layer (already existed before Eidolon Vibes engine)

```
Nexus_OS.html            ← the kernel + shell. Read once; modify rarely.
nexus-db.html            ← quasi-SQL block; reference for protocol implementation
Social-Cosmos-r3.html    ← Nostr feed (uses NexusDB for events)
nexus-sim-controller.html ← AI agent simulation
nexus-messages.html      ← NIP-04 DMs
nexus-channels.html      ← NIP-28 community channels
blocks/app-terminal.html ← Kernel feed viewer; very useful for debugging
blocks/app-files.html    ← File browser using fs.* syscalls
blocks/app-notepad.html  ← Text editor
blocks/app-reader.html   ← Markdown viewer
blocks/app-about.html    ← System info
```

`Nexus_OS.html` is ~2,600 lines. The kernel logic lives roughly:
- Lines 595-870 — settings, channel regex, manifest validation, channel routing
- Lines 880-940 — DECLARE/SUB/MOUNT_ACK handlers
- Lines 980-1025 — EMIT handler (incl. fs syscall and api.call interception)
- Lines 1145-1155 — kernel→block broadcast helper
- Lines 1275-1380 — fs syscall handlers and folder mount
- Lines 1716-1747 — `BUILTIN_CATALOG` and `LEGACY_CATALOG` (where new apps register)

If you need to add a new managed block to the launcher, edit `BUILTIN_CATALOG`. If you need to register a new legacy/standalone HTML, edit `LEGACY_CATALOG`. Both arrays are right next to each other — they're trivial to find.

### 4.2 Eidolon legacy forges (pre-Vibes-engine)

```
eidolon-battleforge.html              ← 42-axis attack design + creature visuals (1,059 lines)
eidolon-multiforge.html               ← multi-mode template forge (748 lines)
eidolon-environment-forge_4_.html     ← 31-axis stage/biome design (838 lines)
kin-forge_1_.html                     ← spawn 8 jittered variants from anchor (1,393 lines)
eidolon-console-v0_5-loop.html        ← DNA editor + 8-slot tray + A/B morph (2,007 lines)
eidolon-battle-PHANTIVEX-gen01.html   ← reference battle runner (1,090 lines)
```

These are the user's hand-built forges. They run as **legacy blocks** — no kernel protocol, just standalone HTMLs in iframes. They save via Blob+download, load via file picker. They're going to keep working that way until they're individually graduated to adapter mode.

**Critical insight in `kin-forge_1_.html`:** there's a `KINDS` registry pattern around lines ~200-300 that maps format strings to `{axes, render, aspect}` configs. This is the closest existing analog to the Library's role. It's the user's intuition that "forges share a common shape" already manifesting in code. When you graduate forges, mine that pattern.

**Critical insight in `eidolon-console-v0_5-loop.html`:** has a working byte-wise lerp morph between two creatures (line ~1843), full provenance tracking (`nonce, birthHash, parentNonce, parentHash, lineage[], morphParents[]`), canonical JSON + SHA256 verification. The Library's hashing logic mirrors this exactly so envelopes from the Console interoperate.

### 4.3 Vibes Engine layer (new — Round 4)

```
vibes-library.html       ← The Library. Managed block. ~900 lines.
vibes-crucible.html      ← The Crucible composer. Managed block. ~370 lines.
vibes-arena.html         ← The Arena runner. Managed block. ~610 lines.
vibe-adapter.js          ← Drop-in shim for graduating forges. ~230 lines.
VIBES-RUNBOOK.md         ← User-facing paint-by-numbers guide.
```

**vibes-library.html structure:**
- `openDB()` and `loadAllToCache()` — IndexedDB management
- `ingestText()` — auto-detects format on import (vibe envelope, env JSON, kin JSON, creature JSON, exported battle HTML)
- `handleSave/Load/List/Search/Delete/Tag/Lineage/Subscribe/ImportFolder/ExportFolder` — protocol handlers
- `refreshFsState()` — re-queries kernel for mount status (added in Round 4 patch v1.1 to fix mount-detection bug)
- `render()` and `renderDetail()` — UI

**vibes-crucible.html structure:**
- Three creature/env slots + 4 attack slots
- `openPicker()` queries Library via `vibe.list({type})`
- `forge` button computes battle hash, saves via `vibe.save`, then optionally `nexus.launch`es Arena and emits `arena.play`

**vibes-arena.html structure:**
- Subscribes to `arena.play` for direct hand-offs from Crucible
- `loadBattle(id)` resolves participants/stage/moveset via `vibe.load`
- Renders deterministic seeded silhouettes, simple attack timing
- AI auto-attacks every 1.5–3s
- Export-to-HTML produces self-contained bundle (currently data-preserving, full renderer port is future polish)

### 4.4 vibe-adapter.js (the graduation path)

When you graduate a forge from legacy to managed, drop this script tag at the top of the forge:

```html
<script>window.VIBE_FORGE_META = { title:"Battleforge", icon:"⚔" };</script>
<script src="vibe-adapter.js"></script>
```

This gives the forge `window.Vibe.{save,load,list,search,delete,tag,lineage,subscribe,importFolder,exportFolder,ready,isHosted}`. Standalone fallback (file picker / Blob download) when no kernel BOOT in 800ms — so the forge keeps working when opened directly outside Nexus.

The forge UI then needs two new buttons added: "Save to Library" calls `Vibe.save({type, name, payload})`, "Load from Library" calls `Vibe.list({type})` → chooser → `Vibe.load(id)` → existing forge load handler with `.payload`.

The adapter handles the kernel protocol entirely. The forge code that calls `await Vibe.save(env)` doesn't change between hosted and standalone modes.

---

## 5 · How to add a new block

### 5.1 New managed block (full kernel citizen)

1. Create `your-block.html`. Copy `vibes-crucible.html` as a template — it's the smallest managed block.
2. Implement the kernel handshake: BOOT listener, DECLARE, MOUNT_CHALLENGE→ACK, explicit SUBs after MOUNTED, PING→PONG.
3. Declare your `emits` and `consumes` in the manifest.
4. Add entry to `BUILTIN_CATALOG` in `Nexus_OS.html`:
   ```js
   { id:"your-block", path:"./your-block.html", icon:"◆", title:"Your Block", desc:"…" }
   ```
5. Test by launching it from the Nexus launcher and watching the Terminal block's kernel feed.

### 5.2 New legacy block (standalone HTML)

1. Add entry to `LEGACY_CATALOG` with `legacy:true`. That's it.
2. The block runs in a more permissive iframe sandbox. No protocol, no SUBs, no kernel awareness.
3. Use this for tools that aren't ready to graduate.

### 5.3 New vibe type

Suppose you want to add `vibes_aura` (some new asset class):

1. **Library schema:** add `'aura'` to `TYPES` array in `vibes-library.html`. The IndexedDB upgrade path will create a new `vibes_aura` object store on next DB version bump. (Bump `DB_VERSION` from 1 to 2.)
2. **Library UI:** add `'aura': 'Auras'` to `TYPE_LABELS`. Add CSS color tokens `--t-aura: #...` and `.t-aura {...}`.
3. **Library detection:** add a branch in `ingestText()` to detect aura JSON files (e.g. by `format.includes('aura')`).
4. **Crucible:** if auras compose into battles, add a slot. If they compose into something else, build a new composer.
5. **Forge:** if auras are authored by a specific forge, that forge should `Vibe.save({type:'aura', ...})`. Adapter handles the rest.

The whole thing is additive. You don't need to change the Library's protocol surface — `vibe.list({type:'aura'})` just works.

---

## 6 · Working with the user

The user is **not a coder.** They've built ~10,000 lines of working tools through extended AI collaboration. They have **excellent design taste** and **strong intuitions about architecture** that they sometimes underestimate. Their "no CS skills" framing has been called out in past sessions as an undersell — they understand more than they claim.

### What they value

- **Honest pushback over flattery.** If their idea is wrong, say so. They've explicitly asked for this. They will NOT be offended by disagreement; they WILL be annoyed by sycophancy.
- **Architectural reasoning.** When making decisions, explain *why*. They want to learn the structure, not just get code dumps.
- **Calling out when their framing is wrong.** Past example: they said "I want a Type for everything" — pushing back on "Type" (too generic, claims no territory) and proposing alternatives (Thing → eventually Vibe) was the right move.
- **Brevity at the start, depth on demand.** Open with the verdict; expand if asked.
- **Round structure.** They like multi-round work where each round has a "Go" gate. Don't ship 3 rounds of work in one response unprompted.
- **Specific, kind, technical.** The sweet spot is "I know what I'm doing, here's what I'd build, here's why, push back if you disagree."

### What they don't want

- Excessive disclaimers. ("I should note that...", "It's worth mentioning...")
- Asking permission for every micro-decision. Make calls and explain them.
- Hedging about being an AI. They know. They want a partner, not a chatbot.
- Walls of text where one paragraph would do.
- "Let me know if you want me to..." at the end of every message. Just say what's true and stop.

### Aesthetic and tone in code

The user's tools have a distinctive aesthetic: CRT scanlines, phosphor green / amber / rose palette, JetBrains Mono / Courier New, terminal-ish but not aggressively so. The newer Nexus OS uses Syne / Lora / JetBrains Mono with more refined design tokens.

When writing UI for this project:
- **System blocks** (Library, Crucible, Arena) match Nexus OS design tokens — refined, slightly muted, JetBrains Mono + Syne.
- **Forges** keep their own personality — they're authoring spaces, not system chrome.
- **Battle outputs** (PHANTIVEX-style) keep heavy CRT for the gameplay feel.

In code: prefer clarity over cleverness. The user reads it. Comments should explain *why*, not *what*. Never strip useful comments to save lines.

### Communication patterns that have worked

- **Naming negotiations** — when the user proposes a term, engage with it as a real proposal. Push back if it's bad. Build on it if it's good. Past round had 4 rounds of negotiation on what to call the saved-asset abstraction; the result was "Vibe" and the negotiation itself was generative.
- **"Round N" framing** — explicit round boundaries with status reports. The user introduced this in this project. Use it.
- **"Go" / "Continue" gates** — never auto-advance through rounds. Hit the gate and wait.
- **Honest scope flags** — when something is "minimum viable" vs "polished," say so explicitly. The Arena's renderer is honestly flagged as minimum viable. Don't oversell.

---

## 7 · Known limitations and future work

### Currently working
- Nexus OS kernel: rock-solid. Don't break it.
- Vibes Library: fully functional, all 12 channels live.
- Crucible: functional, composes battles correctly.
- Arena: minimum-viable rendering. Plays battles, deterministic, exports bundle.
- Adapter: tested, fallback works.
- Catalog patched, all forges launchable from Nexus.

### Known issues
1. **Crucible→Arena auto-launch race.** After forging a battle, Crucible emits `arena.play` 800ms after `nexus.launch`. If Arena boots slowly, the message lands before subscriptions are wired. Workaround: user picks the battle manually in Arena. Proper fix: Arena should subscribe to `vibe.notify` and offer a one-tap "play newest" or, alternatively, Crucible should listen for Arena's `system.block_ready` and only emit `arena.play` then.
2. **Arena standalone export is data-only.** The exported `.battle.html` preserves the bundle but doesn't yet include a full standalone renderer. Re-importing the file works. Playing the file outside Nexus shows the data, not a battle. Fix: port the in-Arena renderer into the export template, or wire the export to PHANTIVEX-style template.
3. **Battleforge produces both creature visuals AND attack effects** in one tool. When graduating it, decide whether to split it into two forges or have it save vibes of both `creature` and `attack` types. The user is aware of this tradeoff.
4. **No rename UI for vibes.** You can re-tag, but not change `name`. Trivial fix in the Library detail panel — just hasn't been done.
5. **Lineage walks are O(n) in cache size for descendants** because we don't have a parent→child reverse index. Fine for a few thousand vibes; rebuild as a separate index if it ever matters.

### Future rounds (in rough priority order)
1. Graduate Environment Forge to adapter mode (smallest scope, simplest schema).
2. Port Arena renderer into export so standalone bundles play self-contained.
3. Build the Codex (browse view — visualize lineage as a tree, not just a list).
4. Generalize Kin Forge's variation engine so it works on attacks and environments, not just creatures.
5. Multi-tag search and saved queries.
6. Battleforge graduation (handle the dual creature/attack output).
7. Console graduation (most complex — has its own tray, A/B morph, full provenance).
8. Cross-machine vibe sharing (drop a `.vibe.json` file, get the asset; should already work via the import path but needs UX).

---

## 8 · Debugging cheat sheet

**A new block doesn't appear in the launcher.** Check `BUILTIN_CATALOG` or `LEGACY_CATALOG` entry. The path must be relative to `Nexus_OS.html`'s location.

**A managed block boots but doesn't receive messages.** Almost always: missing explicit `SUB` after `MOUNTED`. Declaring in `consumes` is an allowlist, not a subscription.

**A block emits but nobody hears it.** The emitting block's `manifest.emits` must include the channel, and at least one block must have SUB'd to it. Check the Terminal block's kernel feed for `[block_id] → channel_name` lines.

**fs.* syscall hangs.** Check that the channel is declared in `emits`. Check that a folder is actually mounted. Try `fs.status` first to confirm.

**Library says "no folder mounted" when one is.** Was the bug fixed in vibes-library.html v1.1. The fix is: every mount-related action calls `refreshFsState()` to re-query the kernel rather than trusting cached state. If you see this again, look at `refreshFsState()` and the boot-time `MOUNTED` handler.

**Block dies under watchdog.** Watchdog timeout = block didn't send DECLARE within ~5s. Usually means a JS error before the BOOT listener attaches. Check the browser console.

**Chrome silently drops MessagePort transfers.** This happens with `file://` + sandboxed iframes. Symptom: block stays in LOADING state. Fix: serve via local web server (`python3 -m http.server 8080`).

**The user mounted a folder but rescan shows zero vibes.** Check that the file extensions match what `ingestText()` recognizes: `.vibe.json`, `.environment.json`, `.kin.json`, `.creature.json`, `.attack.json`, `.battle.json`, `.json` (heuristic), `.html` containing `#creature-dna` script tag. Adjust detection in `ingestText()` if the user's file naming is different.

---

## 9 · Things to never do

- **Never store rendered images** — store seeds, render on demand.
- **Never bypass the protocol** — no direct `parent.postMessage` from a managed block; everything goes through the channel.
- **Never modify the kernel handshake** — DECLARE → MOUNT_CHALLENGE → ACK → MOUNTED is sacred. The user has tested it. Don't touch.
- **Never introduce a build step** — single HTML files, vanilla JS, no transpilation. Ever.
- **Never introduce npm/React/TypeScript** — out of scope. Vanilla all the way down.
- **Never silently catch errors** — log them. The Terminal block displays the kernel feed.
- **Never assume an iframe is loaded before BOOT** — wait for the proper handshake.
- **Never break standalone mode** — every forge must keep working when opened outside Nexus. The adapter handles this; don't undo it.
- **Never use copyrighted IP** — the user's creatures are original; keep them that way.
- **Never reach for big-name packages** — the appeal of this stack is that it's *small*. Twenty thousand lines of original code, no dependencies. Respect that.

---

## 10 · Quick orientation for your first response

If you're a future AI starting to help on this project:

1. **Read this document fully.** It's ~600 lines for a reason.
2. **Read `Nexus_OS.html` lines 595-1380** — the kernel protocol implementation. It's authoritative.
3. **Read `nexus-db.html` end-to-end** — it's the smallest complete managed block. Internalize its handshake and SUB pattern.
4. **Read `vibes-library.html`'s message handler section** — that's how a "broker" managed block looks.
5. **Open Nexus OS, mount a folder, open Terminal block** — the kernel feed is the best debugging surface.
6. **When in doubt, ask the user before changing anything in `Nexus_OS.html`.** That file is load-bearing.

The user prefers: short verdict → architectural reasoning → code/files → handoff. They will ask for more depth when they want it.

Welcome to the stack. It's smaller than it looks and bigger than it sounds.
