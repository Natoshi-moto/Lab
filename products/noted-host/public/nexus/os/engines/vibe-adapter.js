/* ════════════════════════════════════════════════════════════════════
   VIBE ADAPTER v2
   ──────────────────────────────────────────────────────────────────
   Drop this <script> into any forge and it gains:
     await Vibe.save({type, name, tags, parents, payload})  -> envelope
     await Vibe.load(id)                                     -> envelope
     await Vibe.list({type, tags, sort})                     -> summary[]
     await Vibe.search(q, {type})                            -> summary[]
     await Vibe.delete(id)
     await Vibe.tag(id, {add, remove})
     await Vibe.lineage(id, {depth})                         -> graph
     Vibe.subscribe({type, tag}, cb)                         -> unsubscribe
     await Vibe.importFolder()
     await Vibe.exportFolder({ids})

   v2 (Round 018) is rebuilt on top of engines/nexus-block-client.js.
   The public API is byte-identical to v1; only the internals changed.
   Previously this file hand-rolled its own BOOT/DECLARE/MOUNT_ACK/PING
   handshake and pending-call map, duplicating ~70 lines of plumbing
   that already exists in nexus-block-client. Eliminating that drift
   surface is the entire point of this rewrite.

   Behaviour preserved verbatim:
   - Idempotent on repeat load (early return if window.Vibe is set).
   - Auto-computes birthHash + id from canonical(payload) at save time.
   - Falls back to file-picker / Blob-download when running standalone.
   - Resolves `Vibe.ready` even in standalone mode (after 800ms grace),
     so awaiters can proceed instead of hanging forever.
   - Vibe.subscribe filters delivered notifications client-side by type/tag.

   Loading order requirement: this script must come AFTER
   engines/nexus-block-client.js. If NexusBlockClient is missing,
   v2 logs a warning and installs a degraded API where only the
   standalone fallbacks work (Vibe.save → blob download, Vibe.load
   → file picker). v1 used to fail silently when the client was missing.
   ──────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.Vibe) return; // idempotent if loaded twice

  const Client = window.NexusBlockClient;
  if (!Client || typeof Client.bootBlock !== 'function') {
    console.warn('[vibe-adapter] window.NexusBlockClient missing — load engines/nexus-block-client.js BEFORE engines/vibe-adapter.js');
    // We still install the degraded API below so standalone fallbacks work.
  }

  // ── Canonical JSON (matches the codebase's canonicalize convention) ───────
  function canonical(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    return '{' + Object.keys(v).sort()
      .map(k => JSON.stringify(k) + ':' + canonical(v[k]))
      .join(',') + '}';
  }
  async function sha256Hex(str) {
    const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── Envelope construction (unchanged from v1) ────────────────────────────
  async function buildEnvelope(input) {
    if (!input || typeof input !== 'object') throw new Error('Vibe.save requires an object');
    if (!input.type)    throw new Error('Vibe.save requires .type');
    if (!input.payload) throw new Error('Vibe.save requires .payload');
    const payloadStr = canonical(input.payload);
    const birthHash  = 'sha256:' + await sha256Hex(payloadStr);
    const idStem     = birthHash.slice(7, 23);
    return {
      format:    'vibe/1',
      id:        input.id || `v_${input.type}_${idStem}`,
      type:      input.type,
      subFormat: input.subFormat || `eidolon-${input.type}/1`,
      name:      String(input.name || 'Untitled').slice(0, 96),
      tags:      Array.isArray(input.tags)    ? input.tags.slice(0, 32).map(String) : [],
      parents:   Array.isArray(input.parents) ? input.parents.slice(0, 16)          : [],
      birthHash,
      createdAt: input.createdAt || new Date().toISOString(),
      source:    input.source || (window.VIBE_FORGE_NAME || 'unknown'),
      payload:   input.payload
    };
  }

  // ── Standalone fallbacks (unchanged from v1) ─────────────────────────────
  async function fallbackSave(env) {
    const json = JSON.stringify(env, null, 2);
    const safe = (env.name || 'untitled').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${safe}.vibe.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return env;
  }
  function fallbackLoad() {
    return new Promise((resolve, reject) => {
      const inp = document.createElement('input');
      inp.type   = 'file';
      inp.accept = '.json,.vibe.json,application/json';
      inp.onchange = async () => {
        const f = inp.files && inp.files[0];
        if (!f) { reject(new Error('no file selected')); return; }
        try {
          const text = await f.text();
          const env  = JSON.parse(text);
          if (env && env.format && env.format.startsWith('vibe/')) { resolve(env); return; }
          // Best-effort import: wrap unrecognized files as creature/environment/etc.
          const subFormat = env.format || 'unknown';
          const wrapped = await buildEnvelope({
            type: subFormat.includes('environment') ? 'environment'
                : subFormat.includes('kin')         ? 'kin'
                : subFormat.includes('attack')      ? 'attack'
                : subFormat.includes('battle')      ? 'battle'
                : 'creature',
            name:      env.name || f.name.replace(/\.[^.]+$/, ''),
            payload:   env,
            subFormat
          });
          resolve(wrapped);
        } catch (err) { reject(err); }
      };
      inp.click();
    });
  }
  function fallbackList() { return Promise.resolve([]); }

  // ── Boot the underlying client ───────────────────────────────────────────
  const SUBS = new Map();    // subId -> {filter, callback}
  let subCounter = 0;

  let nx = null;
  let mounted = false;
  let mountResolve;
  const ready = new Promise(r => { mountResolve = r; });

  if (Client && typeof Client.bootBlock === 'function') {
    nx = Client.bootBlock({
      manifest: {
        emits: [
          'vibe.save', 'vibe.load', 'vibe.list', 'vibe.search',
          'vibe.delete', 'vibe.tag', 'vibe.lineage', 'vibe.subscribe',
          'vibe.import-folder', 'vibe.export-folder'
        ],
        consumes: ['vibe.result', 'vibe.notify'],
        app: ((meta) => ({
          title:       meta.title       || document.title || 'Forge',
          icon:        meta.icon        || '◆',
          description: meta.description || 'Vibe forge',
          visible:     true
        }))(window.VIBE_FORGE_META || {})
      },
      // The block-client correlates _reqId→Promise for `request()` calls
      // automatically. The only inbound message we still need to dispatch
      // ourselves is vibe.notify — fan it out to local subscribers.
      onMessage({ channel, payload }) {
        if (channel === 'vibe.notify') dispatchNotify(payload);
      }
    });

    if (nx) {
      nx.ready.then(() => {
        mounted = true;
        nx.subscribe('vibe.result');
        nx.subscribe('vibe.notify');
        mountResolve();
        // Forge code that boots faster than the kernel handshake can listen
        // for this event instead of awaiting Vibe.ready.
        window.dispatchEvent(new Event('vibe-ready'));
      });
    }
  }

  // Standalone fallback: if nothing mounts within 800ms, resolve `ready`
  // anyway so awaiters can fall through to the file-picker / blob-download
  // paths. Same threshold as v1.
  setTimeout(() => { if (!mounted) mountResolve(); }, 800);

  // ── Notification fan-out (filters by type/tag like v1) ───────────────────
  function dispatchNotify(payload) {
    const env = payload && payload.envelope;
    if (!env) return;
    for (const { filter, callback } of SUBS.values()) {
      if (filter.type && filter.type !== env.type) continue;
      if (filter.tag  && !(env.tags || []).includes(filter.tag)) continue;
      try { callback(payload.op, env); }
      catch (err) { console.warn('[vibe-adapter] subscriber threw', err); }
    }
  }

  // ── Helper: typed request through the kernel ─────────────────────────────
  // `nx.request(channel, payload)` resolves with the broker's reply object;
  // shape is {ok, ...} so we adapt that into Vibe's API contract.
  async function call(channel, payload) {
    if (!nx || !mounted) throw new Error('vibe-adapter: not mounted');
    return nx.request(channel, payload, { timeout: 10000 });
  }

  // ── Public API (interface byte-identical to v1) ──────────────────────────
  const Vibe = {
    ready,
    get isHosted()     { return mounted; },
    get isStandalone() { return !mounted; },

    async save(input) {
      const env = await buildEnvelope(input);
      if (!mounted) return fallbackSave(env);
      const res = await call('vibe.save', { envelope: env });
      if (!res.ok) throw new Error(res.error || 'save failed');
      return res.envelope || env;
    },

    async load(id) {
      if (!mounted) return fallbackLoad();
      const res = await call('vibe.load', { id });
      if (!res.ok) throw new Error(res.error || 'load failed');
      return res.envelope;
    },

    async list(opts = {}) {
      if (!mounted) return fallbackList();
      const res = await call('vibe.list', opts);
      if (!res.ok) throw new Error(res.error || 'list failed');
      return res.data || [];
    },

    async search(q, opts = {}) {
      if (!mounted) return fallbackList();
      const res = await call('vibe.search', Object.assign({ q }, opts));
      if (!res.ok) throw new Error(res.error || 'search failed');
      return res.data || [];
    },

    async delete(id) {
      if (!mounted) throw new Error('delete only available when hosted');
      const res = await call('vibe.delete', { id });
      if (!res.ok) throw new Error(res.error || 'delete failed');
    },

    async tag(id, mut) {
      if (!mounted) throw new Error('tag only available when hosted');
      const res = await call('vibe.tag', Object.assign({ id }, mut));
      if (!res.ok) throw new Error(res.error || 'tag failed');
    },

    async lineage(id, opts = {}) {
      if (!mounted) throw new Error('lineage only available when hosted');
      const res = await call('vibe.lineage', Object.assign({ id }, opts));
      if (!res.ok) throw new Error(res.error || 'lineage failed');
      return res.data;
    },

    subscribe(filter, callback) {
      const subId = ++subCounter;
      SUBS.set(subId, { filter: filter || {}, callback });
      // Tell the library we want notifications (broker treats this as idempotent).
      if (mounted && nx) {
        try { nx.emit('vibe.subscribe', filter || {}); }
        catch (_) { /* broker subscription is best-effort */ }
      }
      return () => SUBS.delete(subId);
    },

    async importFolder() {
      if (!mounted) throw new Error('importFolder only available when hosted');
      const res = await call('vibe.import-folder', {});
      if (!res.ok) throw new Error(res.error || 'import failed');
      return res.data;
    },

    async exportFolder(opts = {}) {
      if (!mounted) throw new Error('exportFolder only available when hosted');
      const res = await call('vibe.export-folder', opts);
      if (!res.ok) throw new Error(res.error || 'export failed');
      return res.data;
    }
  };
  Object.freeze(Vibe);
  window.Vibe = Vibe;
})();
