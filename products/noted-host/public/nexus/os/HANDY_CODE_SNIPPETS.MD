# HANDY_CODE_SNIPPETS

Canonical reusable patterns. Each snippet here exists in the codebase already; this document collects them in one place so you don't have to dig.

When a snippet drifts (an engine refactor, a protocol change), update it here in the same sweep.

---

## 1 · Canonical JSON

Used everywhere — content-addressed IDs, transcript hashing, signature payloads, vibe envelope `birthHash`. Object keys sorted; no whitespace.

```js
function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort()
    .map(k => JSON.stringify(k) + ':' + canonical(v[k]))
    .join(',') + '}';
}
```

The Console v0.5 was the first place this pattern shipped. The Library, the witness, the battle protocol, and the breed engine all use this exact form.

---

## 2 · SHA-256 hex

Browser and Node both supported via the `crypto.subtle` path; tests use `nodeCrypto` directly for speed.

```js
async function sha256Hex(input) {
  const str = typeof input === 'string' ? input : canonical(input);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

Node fallback:

```js
const nodeCrypto = require('crypto');
function sha256HexNode(s) {
  return nodeCrypto.createHash('sha256').update(s).digest('hex');
}
```

---

## 3 · The substrate function

The deterministic world primitive. Modifying this requires bumping `substrate_epoch` on every published realm — see `LANDMINES.md` #1.

```js
function mulberry32(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tileSeed(planetSeed, x, y) {
  const a = (planetSeed ^ Math.imul(x >>> 0, 0x46F1F4A1)) >>> 0;
  const b = (a ^ Math.imul(y >>> 0, 0xC2B2AE35)) >>> 0;
  return (b ^ (b >>> 16)) >>> 0;
}

function generateAt(planetSeed, x, y, density = 0.14, rarityTiers = 4) {
  const s = tileSeed(planetSeed, x, y);
  const rng = mulberry32(s);
  if (rng() > density) return null;
  const dna = new Uint8Array(16);
  for (let i = 0; i < 16; i++) dna[i] = Math.floor(rng() * 256);
  const hues = [rng() * 360, rng() * 360, rng() * 360];
  const rarity = dna[0] < 16 ? 3 : dna[0] < 64 ? 2 : dna[0] < 160 ? 1 : 0;
  return { dna, hues, rarity, seed: s };
}
```

Lives in `substrate.js`. Imported by `eidolon-os.html`, `eidolon-router.html`, `nexus-witness.html`.

---

## 4 · The vibe envelope

The canonical asset shape. All forge JSON nests inside `payload` verbatim.

```js
{
  format:    'vibe/1',
  id:        'v_creature_a3f1c8...',         // v_<type>_<16char-sha256-of-payload>
  type:      'creature',                      // creature|environment|attack|kin|battle|world|realm-charter|...
  subFormat: 'eidolon-creature/1',
  name:      'PHANTIVEX',
  tags:      ['forest', 'nocturnal'],
  parents:   ['v_creature_77a2...'],          // empty for originals
  birthHash: 'sha256:...',                    // sha256(canonical(payload))
  createdAt: '2026-05-03T...',
  source:    'battleforge',                   // forge that produced it
  payload:   { /* the original forge JSON, untouched */ }
}
```

ID generation:

```js
async function makeVibeId(type, payload) {
  const hash = await sha256Hex(canonical(payload));
  return 'v_' + type + '_' + hash.slice(0, 16);
}
```

Two saves of the same payload produce the same id → automatic dedup.

---

## 5 · Kernel handshake (managed block)

Every managed block must implement this. The single most common bug when writing a new block is forgetting the explicit `SUB` after `MOUNTED` (Landmine 3).

```js
let port = null;
let mounted = false;

window.addEventListener('message', e => {
  if (e.data?.type !== 'BOOT') return;
  port = e.ports[0];
  port.onmessage = handleKernelMessage;
  port.postMessage({
    type: 'DECLARE',
    manifest: {
      emits:    ['vibe.save', 'vibe.load', 'vibe.list'],
      consumes: ['vibe.result', 'vibe.notify']
    },
    app: { id: 'your-block', title: 'Your Block', icon: '◆' }
  });
});

function handleKernelMessage(e) {
  const m = e.data;
  if (m.type === 'MOUNT_CHALLENGE') {
    port.postMessage({ type: 'MOUNT_ACK', nonce: m.nonce });
    return;
  }
  if (m.type === 'MOUNTED') {
    mounted = true;
    // CRITICAL: explicit SUB for every channel in consumes.
    // Declaring in consumes is an allowlist, not a subscription.
    for (const ch of ['vibe.result', 'vibe.notify']) {
      port.postMessage({ type: 'SUB', channel: ch });
    }
    return;
  }
  if (m.type === 'PING') {
    port.postMessage({ type: 'PONG' });
    return;
  }
  if (m.type === 'MSG') {
    handleChannelMessage(m.channel, m.payload);
    return;
  }
}

function emit(channel, payload) {
  if (!mounted) return;
  port.postMessage({ type: 'EMIT', channel, payload });
}
```

For most blocks, prefer using `nexus-block-client.js` which encapsulates this. The raw form above is for understanding what the client is doing.

---

## 6 · Request/response correlation across the bus

The Library returns responses on `vibe.result` to *every* subscriber of that channel. Callers discriminate by `_reqId`. Pattern:

```js
const pending = new Map();   // _reqId -> {resolve, reject}

function makeReqId() {
  return 'r_' + crypto.randomUUID().slice(0, 12);
}

async function libraryCall(channel, payload) {
  const _reqId = makeReqId();
  return new Promise((resolve, reject) => {
    pending.set(_reqId, { resolve, reject });
    emit(channel, { ...payload, _reqId });
    setTimeout(() => {
      if (pending.has(_reqId)) {
        pending.delete(_reqId);
        reject(new Error('timeout: ' + channel));
      }
    }, 5000);
  });
}

// In the vibe.result handler:
function onVibeResult(payload) {
  const p = pending.get(payload._reqId);
  if (!p) return;          // not ours, ignore
  pending.delete(payload._reqId);
  if (payload.ok) p.resolve(payload);
  else p.reject(new Error(payload.error || 'unknown error'));
}
```

This is what makes `await Vibe.save(env)` work as if it were a promise.

---

## 7 · Commit-reveal joint randomness

Used for sexual breeding (`breed-engine.js`) and battle seeding (`battle-protocol.js`). Two parties produce a fair shared random value without a trusted third party.

The shape:

1. Each party picks a random 32-byte salt.
2. Each party publishes `commit_i = sha256(salt_i || pubkey_i || nonce)`.
3. After both commits land, each party publishes `reveal_i = salt_i`.
4. Each party verifies the other's commit by re-hashing.
5. The joint seed is `sha256(salt_a || salt_b || nonce)`.

If a party fails to commit or reveal in time, the protocol forfeits with a logged reason (`partner_no_commit`, `partner_no_reveal`).

`nexus-block-client.js` exposes `commitReveal(...)` as a generic primitive. Both engines call it through abstract broadcast/await injection points so they can be tested without a real Nostr relay.

---

## 8 · Standalone fallback for forges

Every forge that wants to graduate to managed mode keeps its standalone behavior. The pattern from `vibe-adapter.js`:

```js
let kernelBootSeen = false;

window.addEventListener('message', e => {
  if (e.data?.type === 'BOOT') {
    kernelBootSeen = true;
    // ... handshake as in snippet 5
  }
});

setTimeout(() => {
  if (!kernelBootSeen) {
    // Running standalone. Wire file-picker / Blob-download fallbacks.
    window.Vibe = makeStandaloneVibeApi();
  }
}, 800);
```

The 800ms timeout is the canonical value across the codebase. Don't change it without a reason.

---

## 9 · Engine hash binding for ranked play

When loading the battle engine, verify its hash matches the active realm charter's `engine_hash`. Refuse to start a ranked battle if they don't match.

```js
const charter = await Vibe.load(activeRealmId);
if (BattleEngine.ENGINE_HASH !== charter.payload.engine_hash) {
  throw new Error('engine hash mismatch — refusing ranked play');
}
```

This is what makes ranked multiplayer safe across machines: both sides verify they're running the same engine before the first move.

---

## 10 · UMD wrapper for shared engines

Shared `.js` modules in this codebase use a UMD-ish wrapper so they work in browser (`<script>`) and Node (`require`).

```js
(function(root){
  'use strict';

  // ... module body, defining `api` ...

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NexusYourEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

This is the pattern in `battle-engine.js`, `breed-engine.js`, `witness-selection.js`, `eidolon-generator.js`, `nexus-block-client.js`. New shared modules should match.

---

## 11 · Harness summary extraction

Use this after `bash tests/run.sh` to capture the current pass/fail surface without reading thousands of log lines:

```bash
bash tests/run.sh > /tmp/nexus-test.log 2>&1
grep -E 'SUMMARY|pass=|fail=' /tmp/nexus-test.log
```

Current expected output as of the 2026-05-09 boot calibration totals **473 passes / 0 fails**:

```text
NODE-MODE SUMMARY pass=2 fail=0
SYNTAX SUMMARY pass=81 fail=0
CATALOG SUMMARY pass=43 fail=0
SCRIPT-REF SUMMARY pass=39 fail=0
SANDBOX SUMMARY pass=3 fail=0
SUB-BURST SUMMARY pass=3 fail=0
WALLET SUMMARY pass=3 fail=0
CONTRACT SUMMARY pass=102 fail=0
COMPANION SUMMARY pass=2 fail=0
VERSE SUMMARY pass=2 fail=0
BREED SUMMARY pass=5 fail=0
BATTLE-ENGINE SUMMARY pass=12 fail=0
ROUTER-BATTLE SUMMARY pass=3 fail=0
OS-BATTLE SUMMARY pass=3 fail=0
CROSS-BLOCK SUMMARY pass=2 fail=0
PALETTE SUMMARY pass=3 fail=0
EVENTLOG SUMMARY pass=2 fail=0
SYSTEM-HEALTH SUMMARY pass=2 fail=0
NOTIFICATIONS SUMMARY pass=5 fail=0
PLAYER-THREAD SUMMARY pass=15 fail=0
SWEEP13 SUMMARY pass=14 fail=0
SWEEP14 SUMMARY pass=13 fail=0
UNDO SUMMARY pass=4 fail=0
DEADLETTER SUMMARY pass=3 fail=0
ROADMAP SUMMARY pass=4 fail=0
BATTLE-PROTOCOL SUMMARY pass=7 fail=0
SLOT SUMMARY pass=4 fail=0
BATTLE-STAKES SUMMARY pass=4 fail=0
WITNESS SUMMARY pass=5 fail=0
IMPRINT SUMMARY pass=7 fail=0
TOOLS SUMMARY pass=15 fail=0
SUMMARY pass=61 fail=0
```

If the total is lower and the sweep did not intentionally change test expectations, stop and fix or revert before packaging.

---

## 12 · Block handshake/migration audit snippet

Run from archive root. This gives the current protocol surface before a migration sweep, grouped by whether each block loads `engines/nexus-block-client.js` or still owns hand-rolled handshake code.

```bash
python3 - <<'PY'
from pathlib import Path
import re
root = Path('.')
for p in sorted(root.glob('blocks/**/*.html')):
    txt = p.read_text(errors='ignore')
    uses_client = 'nexus-block-client.js' in txt or 'NexusBlockClient' in txt
    module_scripts = len(re.findall(r'<script[^>]*type=["\']module["\']', txt))
    classic_scripts = len(re.findall(r'<script(?![^>]*type=["\']module["\'])', txt))
    sends_msg = any(k in txt for k in ['type:"MSG"', "type:'MSG'", 'type: "MSG"', "type: 'MSG'"])
    print(f'{str(p):52s} lines={len(txt.splitlines()):4d} client={str(uses_client):5s} module={module_scripts} classic={classic_scripts} typeMSG={str(sends_msg):5s}')
PY
```

Interpretation notes:

- `client=True` means the block is probably past the BOOT/DECLARE/MOUNT/PING plumbing risk, but still check channel manifests and handlers.
- `typeMSG=True` is not automatically a bug. It is legitimate in kernel-hosts such as `Nexus_OS.html` and `blocks/eidolon/eidolon-os.html`; it can also appear in comments documenting old bugs. Inspect before editing.
- Pure guide HTML may show `classic=0 module=0`; those files are skipped by the static contract analyzer.

---

## 13 · Harness readiness barrier for managed blocks

Use this shape when a test helper boots a managed block that has async startup work. The example is the Vibes Library helper after calibration sweep 2.

```js
async function bootLibraryForTest() {
  const k = await bootHtmlBlock('blocks/vibes/vibes-library.html', {
    handlers: {
      'fs.status': { resultChannel:'fs.result', fn: () => ({ok:true, mounted:false}) }
    }
  });
  await waitFor(() => k.win.__vibesTestHooks, 1000, 'library hooks missing');
  await waitFor(
    () => k.emits.some(e =>
      e.channel === 'system.block_ready' &&
      e.payload &&
      e.payload.blockId === 'vibes_library'
    ),
    1500,
    'library init did not complete'
  );
  k.win.__vibesTestHooks._setCurrentRealmForTest('realm_genesis_0');
  k.win.__vibesTestHooks._setSecpForTest({
    schnorr: { verify: () => true, sign: () => new Uint8Array(64) }
  });
  return k;
}
```

The load-bearing move is waiting for a semantic ready emit, not making the sleep longer.


## 14 · Local script reference audit

`tests/local-script-refs-tests.js` is now wired into `tests/run.sh`. Use the standalone call when a sweep moves blocks, engines, or folders and you want a fast check before the full harness:

```bash
node tests/local-script-refs-tests.js
```

Expected current summary:

```text
SCRIPT-REF SUMMARY pass=30 fail=0
```

What it catches: browser-load failures where an HTML file's local `<script src="../../engines/foo.js">` no longer points at a real file. `tests/syntax-check.js` can still pass in that situation because it extracts and checks inline scripts; it does not prove external local scripts are reachable.

---


---

## Sweep H · OS notification service snippets

### Consume an OS-level notification channel without creating a dead letter

```js
function deliverMessage(srcId, channel, payload) {
  const shellHandled = Notifications && Notifications.consumeChannel
    ? Notifications.consumeChannel(channel, payload, srcId)
    : false;
  const subs = CHANNEL_SUBS.get(channel);
  if (!subs || subs.size === 0) {
    if (!shellHandled) recordDeadLetter(srcId, channel, payload, 'no_subscribers');
    return;
  }
  // normal block delivery follows...
}
```

Use this pattern only for true OS services. Do not let ordinary blocks bypass dead-letter accounting.

### Custom block notification syscall

Blocks may emit `nexus.notify` only if their manifest declares it in `emits`. The kernel intercepts it and forwards the payload to the shell notification center. Prefer existing domain channels first; use `nexus.notify` sparingly for block-local notices that have no canonical event channel yet.

```js
nx.emit('nexus.notify', {
  className: 'info',
  title: 'Library updated',
  body: 'New creature tile available',
  route: 'library',
  actionLabel: 'View in library →'
});
```

### Motion-token usage

```css
.panel-entering { animation: nx-slide-in-right var(--motion-enter); }
.invalid-field { animation: nx-shake var(--motion-shake); }
.balance-credit { animation: nx-count-up var(--motion-count); }
```

Prefer semantic tokens over hard-coded timings so `prefers-reduced-motion` remains central. See `docs/MOTION.md`.


## Player Thread resolver skeleton

Use this pattern for future local-only guidance. Keep the resolver pure and side-effect free; route actions separately.

```js
function resolveCurrentThread(state, runtime) {
  const m = state.milestones || {};
  const hasMoot = Boolean(runtime.hasMoot || m.mootImprinted);
  if (runtime.pendingCount > 0) return threadAwaitConfirmation();
  if (runtime.unreadImportantCount > 0) return threadReviewRealmActivity();
  if (!hasMoot && !m.firstContactStarted) return threadBeginFirstContact();
  if (hasMoot && !m.libraryOpened) return threadViewYourMoot();
  if (!m.environmentSelected) return threadChooseEnvironment();
  if (m.libraryOpened && !m.atlasOpened && !m.walkerOpened) return threadWalkThePlanet();
  if (m.walletOpened && runtime.balance === 0 && !m.witnessOpened) return threadWitnessToEarn();
  if (hasMoot && !m.walletOpened) return threadOpenWallet();
  return threadExploreFreely();
}
```

Storage key: `nx-player-thread-${KERNEL_SECRET}`. History bound: 40 entries. Dismissal cooldown: 24 hours per thread ID.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

### Persist and apply selected environment

```js
const SELECTED_ENV_KEY = 'nexus:selected-environment:v1';
localStorage.setItem(SELECTED_ENV_KEY, JSON.stringify(world));
nx.emit('system.environment.selected', world);
```

The OS shell intercepts `system.environment.selected`, stores the world, updates desktop CSS variables, and emits a user notification.

### Zero-start wallet invariant

```js
if (GENESIS_OUTPUT && !CONSUMED.has(GENESIS_OUTPUT.id)) {
  log('Embedded genesis present but not auto-claimed — zero-start wallet canon','info');
}
```

Do not replace this with an automatic `claimGenesisOutput` call.

### Atlas local fallback pattern

```js
try {
  const res = await call('vibe.list', { type: 'world' });
} catch (err) {
  state.worlds = readLocalWorlds();
  renderCatalog();
}
```

## Sweep 14 snippets

### Safe local JSON read/write for UI-only bridges

```js
function safeGet(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch (_) { return fallback; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (_) {}
}
```

### Home-note bridge into Companion

```js
localStorage.setItem('nexus:home-note-inbox:v1', JSON.stringify({
  title: 'Home note',
  body,
  at: Date.now(),
  source: 'desktop-home-notes'
}));
```

### Forge save with Library-awake preference and local fallback

```js
const res = await nx.request('vibe.save', { envelope }, { timeout: 1200 }).catch(err => ({ ok:false, error:err.message }));
if (!res.ok) mirrorToLocalFallback(envelope);
```



## 2026-05-09 · Boot calibration snippets

### Check exact-case boot docs and canonical docs together

```bash
for f in README.MD CODEBASE_ORIENTATION.MD FREEDOM_REASONING_LOG.MD HANDY_CODE_SNIPPETS.MD HANDY_LESSONS.MD LANDMINES.MD AI_CODEBASE_HANDOFF.MD; do
  test -f "$f" || { echo "missing $f"; exit 1; }
done

for f in README.md AI_CODEBASE_HANDOFF.md docs/CODEBASE_ORIENTATION.md docs/FREEDOM_REASONING_LOG.md docs/HANDY_CODE_SNIPPETS.md docs/HANDY_LESSONS.md docs/LANDMINES.md; do
  test -f "$f" || { echo "missing canonical $f"; exit 1; }
done
```

The uppercase `.MD` files are calibrated boot indexes; the canonical detailed docs remain the linked lowercase/mixed-case files.

### Current block-surface sanity scan

```bash
for f in blocks/apps/companion.html blocks/system/Wallet_v4_nexus.html blocks/world/first-contact.html blocks/world/atlas.html blocks/forges/compose-stage.html blocks/forges/environment-forge.html; do
  node tools/block-inspect.js "$f"
done
```

Expected boot-calibrated broad surface: 35 block HTML files, 26 client-backed, 8 hand-rolled, 1 kernel-host, and 39 local script refs.

## Eidolon forge preservation paths

```text
legacy/eidolon-forges/eidolon-forge.html
legacy/eidolon-forges/eidolon-environment-forge.html
legacy/eidolon-forges/eidolon-multiforge.html
legacy/eidolon-forges/eidolon-battleforge.html
```

Use these as source references when adapting future active blocks. The high-level bridge is:

```js
// Future integration shape, not currently active code.
const selectedCreature = {
  format: 'eidolon-forge/1',
  axes: creatureAxes,
  labels: userLabels
};

const selectedEnvironment = {
  format: 'eidolon-environment/1',
  axes: environmentAxes,
  labels: userLabels
};

// Then wrap into the existing Nexus/Vibes envelope before `vibe.save`.
```

---

## Sweep 15 — Living Forge OS integration (2026-05-09)

Calibration baseline after this sweep: **526 passes / 0 fails** via `bash tests/run.sh`; `node tools/channel-atlas.js --check` passes with **67 channels across 35 blocks**.

Material user-facing changes:
- Added shared Eidolon UX/runtime adapters: `engines/eidolon-schema.js`, `engines/eidolon-creature-renderer.js`, `engines/eidolon-environment-renderer.js`, `engines/eidolon-battle-renderer.js`, `engines/eidolon-storage.js`.
- First Contact now uses the shared live creature/world forge renderers and emits both `system.companion.selected` and `system.environment.selected` on acceptance.
- The OS shell now renders the selected environment as an animated desktop canvas and the selected companion as an animated bottom-left inhabitant.
- Lattice Shell is now a real axis-level creature forge with editable labels, locks, sweeps, group randomize, and selected-companion persistence.
- Environment Forge is now a full axis-level world forge with presets, 16:9 live canvas, sweep controls, creature silhouette preview, Library save, and Atlas fallback.
- Compose Stage is now a Battleforge-style scrub/playback attack authoring surface with 3x3 candidates, phase bar, templates, and `system.attack.selected`.
- Web Viewer now has a persistent history stack, repaired back/forward routing, search fallback, and Delete/Backspace shielding in the URL bar.
- Companion imports canonical Eidolon `axes` specs and polls the Home Notes inbox for same-tab iframe writes.

Preserved invariants:
- Wallet remains zero-start and one visible NEX balance.
- No economy, witness, ranked-battle, or deterministic battle math was changed.
- Legacy Eidolon files remain preserved under `legacy/eidolon-forges/` as canon/source material.

## Sweep 16 calibration — First Hour UX

Sweep 16 adds the first-hour onboarding layer over Living Forge OS: active Nexus-native Multiforge, clearer First Contact outcome copy, companion first-time callout, visible Home Notes → Companion handoff, Wallet zero-start explanation, Web Viewer empty/blocked/disabled states, and Player Thread v2 guidance. Runtime scope remains UX/UI only; wallet canon remains one visible NEX balance starting at 0.


## 2026-05-17 · Minimal managed-block handshake reminder

The contract harness treats `MSG` as kernel-to-block traffic. A managed block should not send outbound `type:"MSG"` to the kernel. Use the mounted port protocol: declare, acknowledge challenge, subscribe, pong, and emit channels.

```js
port.postMessage({
  type: 'DECLARE',
  manifest: { emits: ['example.event'], consumes: ['example.command'], undoable: [] },
  app: { title: 'Example Block', icon: '◇', visible: true }
});

port.onmessage = (event) => {
  const msg = event.data || {};
  if (msg.type === 'MOUNT_CHALLENGE') {
    port.postMessage({ type: 'MOUNT_ACK', nonce: msg.nonce });
    return;
  }
  if (msg.type === 'MOUNTED') {
    port.postMessage({ type: 'SUB', channel: 'example.command' });
    return;
  }
  if (msg.type === 'PING') {
    port.postMessage({ type: 'PONG', nonce: msg.nonce });
    return;
  }
  if (msg.type === 'MSG' && msg.channel === 'example.command') {
    // Inbound kernel-routed message. Handle it here.
  }
};

function emitExample(payload) {
  port.postMessage({ type: 'EMIT', channel: 'example.event', payload });
}
```

Use this shape when repairing older standalone bridges that predate the current kernel contract.

---

## Hand-rolled block emit envelope

Use this only in blocks that are not migrated to `engines/nexus-block-client.js`. `MSG` is reserved for kernel-to-block delivery.

```js
function emit(channel, payload) {
  if (!port || state !== "MOUNTED") return;
  port.postMessage({ type: "EMIT", channel, payload });
}
```

If the block also permits queued/early emits during `DECLARED`, keep the envelope as `EMIT`; only the readiness guard may differ.

## Handy References — Eidolin Maker/Player Diagnostic (2026-05-17)

- Canvas boot/main loop: `blocks/Eidolin/src/runtime.ts:526-580`
- World draw orchestration: `blocks/Eidolin/src/runtime.ts:470-524`
- World renderer helpers: `blocks/Eidolin/src/world-renderer.ts`
- Manifestation slots/state machine: `blocks/Eidolin/src/manifestation.ts:219-280`, `blocks/Eidolin/src/manifestation.ts:352-476`
- Save/localStorage seam: `blocks/Eidolin/src/persistence.ts:21-23`, `blocks/Eidolin/src/persistence.ts:112-185`
- Asset manifest seam: `blocks/Eidolin/asset-manifest.json`, `blocks/Eidolin/src/types.ts:568-583`
- Vibes IndexedDB stores: `blocks/vibes/vibes-library.html:197-205`, `blocks/vibes/vibes-library.html:1343-1407`
- Quasi-SQL DB: `blocks/system/nexus-db.html:36-88`, `blocks/system/nexus-db.html:155-250`
- Sandbox/IPC: `Nexus_OS.html:1598-1685`, `Nexus_OS.html:1200-1310`
- Nostr signing/publish/subscribe: `blocks/vibes/vibes-library.html:572-640`, `blocks/vibes/vibes-library.html:1291-1340`
- Wallet lock API: `blocks/system/Wallet_v4_nexus.html:1172-1204`, `blocks/vibes/vibes-library.html:1176-1184`


---

## Minimal managed Nexus block template

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
        app: { title:'Game Maker', icon:'▣', description:'Canvas + IndexedDB game block', visible:true }
      }
    });
    nx.ready.then(() => nx.emit('game.ready', { ok:true, ts:Date.now() }));
  </script>
</body>
</html>
```

Manual protocol equivalent: wait for `{type:'BOOT'}` with a transferred port; send `{type:'DECLARE', manifest:{emits, consumes, undoable}, app}`; answer `{type:'MOUNT_ACK', nonce}` to `{type:'MOUNT_CHALLENGE', nonce}`; after `{type:'MOUNTED'}`, send `SUB` and `EMIT`; answer kernel `PING` with `PONG`.

---

## Pokemon engine — DB query pattern from a block

The DB block enforces that table names must start with the block's `appId`. Pokemon blocks use `appId: 'pokemon'`. Tables: `pokemon_drafts`, `pokemon_projects`, `pokemon_assets`, `pokemon_saves`.

```js
// In manifest:
// emits:   ['db.query', 'pokemon.ready'],
// consumes: ['db.result']
//
// After nx.ready:
// nx.subscribe('db.result');

async function dbQuery(query, params, filters, sort) {
  const r = await nx.request('db.query',
    { query, params, filters, sort, appId: 'pokemon' },
    { timeout: 8000 }
  );
  if (!r || !r.ok) throw new Error(r && r.error || 'DB error');
  return r.data;
}

// INSERT (upsert by keyPath):
await dbQuery('INSERT INTO pokemon_drafts', { id: 'proj_001', name: 'My Game', updatedAt: Date.now() });

// SELECT with filter:
const rows = await dbQuery('SELECT * FROM pokemon_drafts', null, { id: 'proj_001' });

// SELECT all:
const all = await dbQuery('SELECT * FROM pokemon_drafts', null, null, { column: 'updatedAt', direction: 'DESC' });

// DELETE:
await dbQuery('DELETE FROM pokemon_drafts', { id: 'proj_001' });
```

---

## Pokemon engine — minimal player block skeleton

```html
<!doctype html>
<html>
<head><meta charset="UTF-8"><title>Pokémon Player</title></head>
<body>
<canvas id="game" width="320" height="240"></canvas>
<script src="../../engines/nexus-block-client.js"></script>
<script src="../../engines/pokemon-engine.js"></script>
<script>
'use strict';
const PE = window.PokemonEngine;
const canvas = document.getElementById('game');
let nx, currentProject, currentMap, camera, renderer, input, audio, dialogue, executor;

nx = window.NexusBlockClient.bootBlock({
  manifest: {
    emits:    ['pokemon.player.ready', 'db.query'],
    consumes: ['pokemon.load', 'pokemon.preview', 'db.result'],
    app: { title: 'Pokémon Player', icon: '▣', visible: true,
           description: 'Play Pokémon-style RPG games', version: '0.1.0' }
  }
});

nx.ready.then(() => {
  nx.subscribe('db.result');
  nx.subscribe('pokemon.load');
  nx.subscribe('pokemon.preview');

  // Build engine instances
  camera   = new PE.TileCamera(16);
  renderer = new PE.TileRenderer(canvas, 16);
  input    = new PE.InputManager(canvas);
  audio    = new PE.AudioEngine();
  dialogue = new PE.DialogueEngine(canvas);
  executor = new PE.EventExecutor({ /* callbacks wired below */ });

  nx.emit('pokemon.player.ready', { ok: true, ts: Date.now() });
});

nx.subscribe('pokemon.load', async ({ manifestHash, saveId }) => {
  try {
    const r = await nx.request('db.query',
      { query: 'SELECT * FROM pokemon_projects', filters: { manifestHash }, appId: 'pokemon' },
      { timeout: 8000 });
    if (!r.ok || !r.data || !r.data.length) throw new Error('Project not found: ' + manifestHash);
    const validator = new PE.ProjectValidator();
    const result = validator.validate(r.data[0]);
    if (!result.valid) throw new Error('Invalid project: ' + result.errors[0]);
    currentProject = r.data[0];
    currentMap = currentProject.maps.find(m => m.id === currentProject.startMap);
    // ... build collision map, load tileset, start game loop
  } catch (e) {
    console.warn('[pokemon-player] load error:', e.message);
  }
});
</script>
</body>
</html>
```

---

## Pokemon engine — Nexus Host implementation

The Host object bridges the engine to Nexus OS services. Pass it to ProjectFormat.

```js
function makeNexusHost(nx) {
  return {
    storage: {
      saveDraft(project) {
        return nx.request('db.query', {
          query: 'INSERT INTO pokemon_drafts',
          params: project, appId: 'pokemon'
        }, { timeout: 8000 }).then(r => { if (!r.ok) throw new Error(r.error); });
      },
      loadDraft(id) {
        return nx.request('db.query', {
          query: 'SELECT * FROM pokemon_drafts',
          filters: { id }, appId: 'pokemon'
        }, { timeout: 8000 }).then(r => {
          if (!r.ok) throw new Error(r.error);
          return r.data && r.data[0] || null;
        });
      },
      listDrafts() {
        return nx.request('db.query', {
          query: 'SELECT * FROM pokemon_drafts',
          sort: { column: 'updatedAt', direction: 'DESC' }, appId: 'pokemon'
        }, { timeout: 8000 }).then(r => r.data || []);
      },
      saveProject(project) {
        return nx.request('db.query', {
          query: 'INSERT INTO pokemon_projects',
          params: project, appId: 'pokemon'
        }, { timeout: 8000 }).then(r => { if (!r.ok) throw new Error(r.error); });
      },
      loadProject(manifestHash) {
        return nx.request('db.query', {
          query: 'SELECT * FROM pokemon_projects',
          filters: { manifestHash }, appId: 'pokemon'
        }, { timeout: 8000 }).then(r => r.data && r.data[0] || null);
      },
      saveSave(save) {
        return nx.request('db.query', {
          query: 'INSERT INTO pokemon_saves',
          params: save, appId: 'pokemon'
        }, { timeout: 8000 }).then(r => { if (!r.ok) throw new Error(r.error); });
      },
      loadSave(saveId) {
        return nx.request('db.query', {
          query: 'SELECT * FROM pokemon_saves',
          filters: { id: saveId }, appId: 'pokemon'
        }, { timeout: 8000 }).then(r => r.data && r.data[0] || null);
      },
      listSaves(manifestHash) {
        return nx.request('db.query', {
          query: 'SELECT * FROM pokemon_saves',
          filters: { projectManifestHash: manifestHash }, appId: 'pokemon'
        }, { timeout: 8000 }).then(r => r.data || []);
      }
    },
    assets: {
      resolve(assetRef) {
        // Assets stored as pokemon_assets records with assetRef as id, blob as data
        // For now: assets are base64 data URIs stored in the project JSON directly
        // Full blob store implementation is a later step
        return Promise.reject(new Error('Asset store not yet implemented — use project-inline assets'));
      }
    },
    input: { getState() { return input ? input.getState() : {}; } },
    audio: {
      playMusic(trackId)  { /* lookup trackId in project.audio.music, call audio.playMusic(buffer) */ },
      playEffect(soundId) { /* lookup soundId in project.audio.effects */ },
      stop()              { if (audio) audio.stop(); },
      setVolume(level)    { if (audio) audio.setVolume(level); }
    },
    wallet: {
      checkOwnership(lockId) {
        return nx.request('wallet.lock.verify', { lockId }, { timeout: 5000 })
          .then(r => !!(r && r.ok)).catch(() => false);
      }
    }
  };
}
```

---

## Pokemon engine — DB_VERSION migration pattern

In `blocks/system/nexus-db.html`, bump `DB_VERSION` from 1 to 2 and add new stores inside `onupgradeneeded`. The migration is STRICTLY ADDITIVE — never alter or delete existing stores.

```js
const DB_VERSION = 2;  // bumped from 1

request.onupgradeneeded = (e) => {
  const db = e.target.result;
  const oldVersion = e.oldVersion;

  // Existing v1 stores — never touch these
  if (!db.objectStoreNames.contains('social_events')) {
    const store = db.createObjectStore('social_events', { keyPath: 'id' });
    store.createIndex('created_at', 'created_at', { unique: false });
    store.createIndex('pubkey', 'pubkey', { unique: false });
  }
  if (!db.objectStoreNames.contains('config')) {
    db.createObjectStore('config', { keyPath: 'key' });
  }

  // New v2 stores (pokemon game maker)
  if (oldVersion < 2) {
    // Mutable working drafts — keyed by creator-assigned project id
    if (!db.objectStoreNames.contains('pokemon_drafts')) {
      const drafts = db.createObjectStore('pokemon_drafts', { keyPath: 'id' });
      drafts.createIndex('name', 'name', { unique: false });
      drafts.createIndex('updatedAt', 'updatedAt', { unique: false });
    }
    // Immutable published versions — keyed by content hash
    if (!db.objectStoreNames.contains('pokemon_projects')) {
      const projects = db.createObjectStore('pokemon_projects', { keyPath: 'manifestHash' });
      projects.createIndex('projectId', 'id', { unique: false });
      projects.createIndex('name', 'name', { unique: false });
      projects.createIndex('savedAt', 'savedAt', { unique: false });
    }
    // Blob assets — keyed by SHA-256 of content, deduplicated
    if (!db.objectStoreNames.contains('pokemon_assets')) {
      db.createObjectStore('pokemon_assets', { keyPath: 'assetHash' });
    }
    // Save games — keyed by sha256(manifestHash + ':' + playerName)
    if (!db.objectStoreNames.contains('pokemon_saves')) {
      const saves = db.createObjectStore('pokemon_saves', { keyPath: 'id' });
      saves.createIndex('projectManifestHash', 'projectManifestHash', { unique: false });
      saves.createIndex('savedAt', 'savedAt', { unique: false });
    }
  }
};
```

---

## Pokemon engine — BUILTIN_CATALOG entry pattern

In `Nexus_OS.html`, find `BUILTIN_CATALOG` and add entries for new pokemon blocks. Find an existing entry to see the exact shape required by the kernel.

```js
// Add to BUILTIN_CATALOG array in Nexus_OS.html:
{
  id: 'pokemon-player',
  title: 'Pokémon Player',
  icon: '▣',
  description: 'Play Pokémon-style RPG games',
  url: 'blocks/pokemon-player.html',
  visible: true,
  tags: ['game', 'pokemon']
},
{
  id: 'pokemon-maker',
  title: 'Pokémon Maker',
  icon: '✎',
  description: 'Create Pokémon-style RPG worlds',
  url: 'blocks/pokemon-maker.html',
  visible: true,
  tags: ['game', 'maker', 'pokemon']
},
```

