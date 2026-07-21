# Nexus OS Patch — path normalization for managed-block resolution

**File:** `Nexus_OS.html`
**Why:** When a block is launched via the file browser or `nexus.launch`, the kernel checks `MANAGED_PATHS.has(path)` to decide managed vs legacy. The catalog entries use `./atlas.html` but launches arrive as `atlas.html` — exact-string comparison fails, the block falls to legacy mode, no BOOT, amber dot forever. This is a kernel hygiene bug.

**Severity:** Low risk. Three edits, all in the same logical area. None of them touch the kernel handshake (DECLARE / MOUNT_CHALLENGE / MOUNT_ACK / MOUNTED), the watchdog, the rate limiters, or persistence. Pure path-string normalization.

**Test after:** Re-launch Atlas. Live dot should turn green within 1–2 seconds. Terminal feed should show `spawn ATLAS-… → atlas.html` *without* `[legacy]` and then `DECLARE received`, `MOUNT_ACK received`, `mounted`, then the SUB lines for `vibe.result` / `vibe.notify`.

---

## Edit 1 of 3 — Add a path-normalization helper

**Find** (around line 1753, just before the `MANAGED_PATHS` definition):

```js
  // MANAGED_PATHS: paths that must always spawn as managed blocks regardless of
  // what an emitting block's nexus.launch payload says. Prevents any block from
  // forcing a managed app (wallet, files, etc.) into legacy mode by passing
  // legacy:true to nexus.launch.
  const MANAGED_PATHS = new Set(BUILTIN_CATALOG.filter(a => !a.legacy).map(a => a.path));
```

**Replace with:**

```js
  // MANAGED_PATHS: paths that must always spawn as managed blocks regardless of
  // what an emitting block's nexus.launch payload says. Prevents any block from
  // forcing a managed app (wallet, files, etc.) into legacy mode by passing
  // legacy:true to nexus.launch.
  //
  // Path normalization: catalog entries can be written as "./atlas.html" or
  // "atlas.html" or "/atlas.html" — they should all resolve to the same managed
  // block. Without this, a launch path of "atlas.html" against a catalog of
  // "./atlas.html" silently falls through to legacy mode (the bug fixed here).
  const normalizeBlockPath = p => String(p || '').replace(/^\.?\//, '');
  const MANAGED_PATHS = new Set(
    BUILTIN_CATALOG.filter(a => !a.legacy).map(a => normalizeBlockPath(a.path))
  );
```

---

## Edit 2 of 3 — Use normalization in the `nexus.launch` emit handler

**Find** (around line 1003, inside `handleEmit`):

```js
        const id = makeId((title || 'app').toUpperCase().replace(/[^A-Z0-9]/g, '-'));
        const effectiveLegacy = MANAGED_PATHS.has(path) ? false : !!legacy;
```

**Replace with:**

```js
        const id = makeId((title || 'app').toUpperCase().replace(/[^A-Z0-9]/g, '-'));
        const effectiveLegacy = MANAGED_PATHS.has(normalizeBlockPath(path)) ? false : !!legacy;
```

---

## Edit 3 of 3 — Use normalization in `fbLaunchPath`

**Find** (around lines 2305–2308 and 2325–2326 — there are two near-identical occurrences of this pattern, patch both):

```js
const isManaged = MANAGED_PATHS.has(entry.path) ||
  BUILTIN_CATALOG.some(b => entry.path.endsWith(b.path.replace(/^.*\//, '')));
```

**Replace both with:**

```js
const isManaged = MANAGED_PATHS.has(normalizeBlockPath(entry.path)) ||
  BUILTIN_CATALOG.some(b => normalizeBlockPath(entry.path).endsWith(normalizeBlockPath(b.path).replace(/^.*\//, '')));
```

---

## Why this is safe

- `normalizeBlockPath` only strips leading `./` or `/`. It can't introduce false positives — a path that wasn't in `MANAGED_PATHS` before still won't be after, only paths that *should have matched* now do.
- Both reads (catalog entries) and lookups (launch paths) go through the same normalizer, so they can't drift.
- The kernel handshake, sandbox attributes, watchdog timers, and rate limiters are untouched.
- Legacy blocks remain legacy. The fix only affects paths that were *intended* to be managed but missed because of leading-slash mismatch.

## Forward compatibility

The patched `atlas.html` also includes a `<meta name="nexus-block" content="managed">` tag in its head. A future kernel patch could read that tag and auto-promote any block declaring it, removing the requirement for a `BUILTIN_CATALOG` entry entirely. Out of scope for this round, but the seed is planted — a self-declaring block is the natural endpoint of "sovereignty-first" architecture.

That's the whole patch. Apply and re-launch.
