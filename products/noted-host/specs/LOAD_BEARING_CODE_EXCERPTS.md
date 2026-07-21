# Load-Bearing Code Excerpts v0.04

These excerpts bind the technical spec to observed code reality.

## App route seam

```tsx
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <div key={routeKey} className="n-route-transition h-full">
                <Routes>
                  <Route path="/" element={<Navigate to="/nexus-router" replace />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/writing/*" element={<WritingStudio />} />
                  <Route path="/notes/*" element={<NotesStudio />} />
                  <Route path="/poetry/*" element={<PoetryStudio />} />
                  <Route path="/longform/*" element={<LongformStudio />} />
                  <Route path="/app-design/*" element={<AppDesignStudio />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/prompts" element={<PromptStudio />} />
                  <Route path="/canvas" element={<Canvas />} />
                  <Route path="/nexus-router" element={<NexusRouterStudio />} />
                  <Route path="/nexus-agent" element={<NexusAgentStudio />} />
                  <Route path="/prompt-studio-v3" element={<PromptStudioV3 />} />
                  <Route path="/atlas" element={<Atlas />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/shelf/*" element={<Shelf />} />
                  <Route path="/scraps" element={<ScrapsStudio />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/canvas" replace />} />
                </Routes>
```

## Nexus Router iframe seam

```tsx
const NEXUS_ROUTER_SRC = './nexus/os/Nexus_OS.html'

export function NexusRouterStudio(): JSX.Element {
  function openStandalone() {
    window.open(NEXUS_ROUTER_SRC, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="h-full min-h-0 flex flex-col bg-bg" data-test="nexus-router-studio">
      <header className="shrink-0 border-b border-line bg-surface/80 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">Kernel router</div>
          <h1 className="text-sm font-semibold text-ink mt-0.5">Nexus Router</h1>
          <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
            Noted is the host. Nexus OS is the router/kernel. Nexus Agent, Prompt Studio v3, Pokémon/Eidolon engines, and other HTML blocks launch inside the Nexus desktop.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <a
            href={NEXUS_ROUTER_SRC}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-line px-3 py-1.5 text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          >
            Open tab
          </a>
          <button
            type="button"
            onClick={openStandalone}
            className="rounded border border-line bg-surface-2 px-3 py-1.5 text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          >
            Pop out
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 bg-black">
        <iframe
          title="Nexus Router"
          src={NEXUS_ROUTER_SRC}
          className="block h-full w-full border-0 bg-black"
          data-test="nexus-router-iframe"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-same-origin"
        />
      </div>
    </section>
  )
}
```

## Nexus kernel settings

```js
  const SETTINGS = Object.freeze({
    watchdogMs:           12000,
    maxRetries:           1,      // only 1 retry (2 total attempts) — 3-flash bug was maxRetries:2
    stableMountResetMs:   5000,
    reaperIntervalMs:     5000,
    pongDeadlineMs:       20000,  // was 9000 — much more generous
    firstPongGraceMs:     90000, // 90s grace for blocks that have never PONGed yet
    pingGraceMs:          25000,
    pingIntervalFloorMs:  4000,
    payloadLimitBytes:    131072,   // raised from 8192 — apps need more headroom
    payloadMaxDepth:      10,
    payloadMaxNodes:      1024,
    payloadMaxKeysPerObject: 256,
    payloadMaxArrayLength: 512,
    dataLimiterCapacity:  100,
    dataLimiterRefillPerSec: 50,
    controlLimiterCapacity: 10,
    controlLimiterRefillPerSec: 5,
    maxRateStrikes:       8,
    maxManifestChannels:  48,
    maxSubscriptionsPerBlock: 48,
    maxChannelNameLen:    96,
    maxManifestBytes:     4096,
```

## Managed block handshake

```js
  }

  // Protocol handlers
  function handleDeclare(block, msg) {
    pushFeed("INFO", `${block.id} ← DECLARE received (state was ${block.state})`);
    if (block.state !== "LOADING") { violation(block, "unexpected DECLARE"); return; }
    try {
      block.manifest = normalizeManifest(msg.manifest);
      UNDOABLE_CHANNELS.set(block.id, new Set(block.manifest.undoable || []));
      if (msg.app && typeof msg.app === "object") {
        block.appMeta = {
          title:       String(msg.app.title       || block.id).slice(0, 64),
          icon:        String(msg.app.icon        || "▪").slice(0, 4),
          description: String(msg.app.description || "").slice(0, 128),
          visible:     msg.app.visible !== false
        };
      }
      block.state = "DECLARED";
      block.mountNonce = crypto.randomUUID();
      noteAccepted(block, "DECLARE");
      pushFeed("INFO", `${block.id} declared [${block.manifest.emits.join(",")||"∅"}] / [${block.manifest.consumes.join(",")||"∅"}]`);
      block.port.postMessage({ type: "MOUNT_CHALLENGE", nonce: block.mountNonce });
      if (block.appMeta.visible && !block.windowEl) {
        Shell.createWindow(block);
      }
      Shell.scheduleRender();
    } catch (err) {
      pushFeed("BAD", `${block.id} bad DECLARE: ${err.message}`);
      evictBlock(block.id, "bad DECLARE");
    }
  }

  function handleSub(block, msg) {
    if (block.state !== "DECLARED" && block.state !== "MOUNTED") { violation(block, "SUB wrong state"); return; }
    if (typeof msg.channel !== "string") { violation(block, "SUB missing channel"); return; }
    if (!block.manifest.consumes.includes(msg.channel)) { violation(block, `undeclared consume ${msg.channel}`); return; }
    if (block.desiredSubscriptions.has(msg.channel)) { noteAccepted(block, "SUB_NOOP"); return; }
    if (block.desiredSubscriptions.size >= SETTINGS.maxSubscriptionsPerBlock) { violation(block, "sub cap"); return; }
    block.desiredSubscriptions.add(msg.channel);
    if (block.state === "MOUNTED") activateSubscriptions(block);
    persistBlockState(block);
    noteAccepted(block, "SUB");
    pushFeed("INFO", `${block.id} sub ${msg.channel}`);
    Shell.scheduleRender();
  }

  function handleMountAck(block, msg) {
    pushFeed("INFO", `${block.id} ← MOUNT_ACK received`);
    if (block.state !== "DECLARED") { violation(block, "unexpected MOUNT_ACK"); return; }
    if (!msg || msg.nonce !== block.mountNonce) { violation(block, "invalid MOUNT_ACK nonce"); return; }
    block.state = "MOUNTED";
    block.mountNonce = null;
    block.lastPongAt = Date.now();
    block.outstandingPings.clear();
    // Notify the block that the handshake is complete. Managed blocks that gate
    // kernel-IPC on this signal (e.g. wallet _ipcMounted) depend on this message.
    try {
      block.port.postMessage({ type: "MOUNTED" });
    } catch (err) {
      pushFeed("BAD", `${block.id} MOUNTED ack failed: ${err.message}`);
    }
    activateSubscriptions(block);
    noteAccepted(block, "MOUNT_ACK");

    // Create window for visible managed blocks on successful handshake completion.
    // Legacy blocks create their window in iframe.onload — managed blocks must do it here,
```

## Nexus block client boot adapter

```js
      }
      const set = handlers.get(channel);
      if (set) {
        for (const fn of Array.from(set)) {
          try { fn(p, src, raw); }
          catch (err) { console.error('[nexus-block-client] handler failed', channel, err); }
        }
      }
      if (typeof onMessage === 'function') {
        try { onMessage({channel, payload: p, src, raw}); }
        catch (err) { console.error('[nexus-block-client] onMessage failed', channel, err); }
      }
    }

    function onBoot(e){
      if (!e.data || e.data.type !== 'BOOT') return;
      port = e.ports && e.ports[0];
      blockId = e.data.blockId || blockId;
      if (!port) return;

      post({
        type: 'DECLARE',
        manifest: declared.manifest,
        app: declared.app || undefined
      });

      port.onmessage = ev => {
        const msg = ev.data;
        if (!msg || typeof msg.type !== 'string') return;
        if (msg.type === 'MOUNT_CHALLENGE') {
          post({type:'MOUNT_ACK', nonce: msg.nonce});
        } else if (msg.type === 'MOUNTED') {
          mounted = true;
          for (const channel of requestedSubs) post({type:'SUB', channel});
          while (queuedEmits.length) post(queuedEmits.shift());
          readyResolve(api);
        } else if (msg.type === 'PING') {
          post({type:'PONG', nonce: msg.nonce});
        } else if (msg.type === 'MSG') {
          handleMsg(msg.channel, msg.payload || {}, msg.src, msg);
        }
      };
      if (typeof port.start === 'function') port.start();
    }

    global.addEventListener('message', onBoot);

    const api = {
      emit,
      request,
      handle,
      subscribe,
      unsubscribe(channel, handler){
        const set = handlers.get(channel);
        if (set && handler) set.delete(handler);
      },
      ready,
      get mounted(){ return mounted; },
      get blockId(){ return blockId; },
      _debug: { pending, handlers, requestHandlers, requestedSubs, queuedEmits }
    };
    return api;
  }

  global.NexusBlockClient = { bootBlock, equivocationProof, commitReveal, _stable: stable, _sha256Hex: sha256Hex, _randomSaltHex: randomSaltHex };
if (typeof module !== 'undefined' && module.exports) module.exports = global.NexusBlockClient;
```

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Preserves observed code excerpts that anchor the v0.04 technical specification.
LOAD-BEARING: route seam, iframe seam, managed block handshake, block client adapter.
DECISIONS:
  - Excerpts are copied from the current v0.03 archive to prevent abstract spec drift.
  - Excerpts are documentation-only; source files remain the executable source of truth.
  - Future changes to these seams must update this document and add a breadcrumb.
OPEN: Re-run excerpt regeneration after any bridge implementation block.
VERIFY: grep for each referenced path and confirm snippets still match source.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · generated load-bearing excerpt map.
───────────────────────────────────────────────────────────── -->
