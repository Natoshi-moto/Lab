# STREAMING_PATTERN

How `nexus-compute`, `nexus-router`, and consumer blocks (`nexus-render-demo` and any future analog) talk to each other for high-bandwidth, off-main-thread workloads. This is a reusable pattern: any block that wants to produce a continuous stream of typed-array data to one or more consumers should follow it.

This document complements `HANDY_LESSONS.md` (which has the "why") and the inline comments in the three blocks (which have the "what").

---

## Why streams need their own channel

The kernel's IPC bus (managed by `engines/nexus-block-client.js`) is designed for **discrete, structured-cloned messages**. Every `nx.emit` goes:

```
block A  →  block A's MessagePort  →  kernel  →  block B's MessagePort  →  block B
```

The kernel's `post()` calls `port.postMessage(msg)` — **one argument only**, no transferables list. That means typed-array payloads going through the kernel are always structured-cloned. For a single message this is fine. For a 60Hz stream of 4KB payloads it's wasteful and the kernel becomes a hot path.

For continuous, high-rate, large-payload traffic, blocks should bypass the kernel and use `BroadcastChannel` directly. The kernel handles the **rendezvous**; the data flows around it.

---

## The pattern, end to end

### 1. Producer registers with the router

```javascript
const r = await nx.request('router.register', {
  kind: 'compute.stream.terrain-strip',
  blockId: 'nexus_compute',
  description: 'Streaming terrain strips from the worker pool'
}, { timeout: 1500 });

if (r.ok) {
  const { sessionId, channelName } = r;
  // channelName looks like: nexus-stream-compute.stream.terrain-strip-s_xxxxxxx
}
```

`kind` is a free-form string identifying what the producer offers. Existing conventions:
- `compute.stream.*` for computational streams from the worker pool
- (room for future: `simulation.stream.*`, `audio.stream.*`, etc.)

The router returns a **session-scoped BroadcastChannel name**. The producer opens that channel and starts listening.

### 2. Producer opens its BroadcastChannel and serves

```javascript
const bc = new BroadcastChannel(channelName);
bc.onmessage = (e) => {
  const m = e.data;
  if (m.type !== 'request') return;
  // run the work (e.g. via worker pool), then:
  bc.postMessage({
    type: 'frame',
    requesterId: m.requesterId,
    reqSeq: m.reqSeq,
    data: { /* the result */ }
  });
};
```

### 3. Producer heartbeats

```javascript
setInterval(() => {
  nx.emit('router.heartbeat', { sessionId });
}, 5000);  // HEARTBEAT_MS
```

Without heartbeats, the router will evict the producer after 15s of silence. Heartbeats go through the kernel (they're tiny and infrequent, so it's fine).

### 4. Consumer discovers via the router

```javascript
const r = await nx.request('router.connect', {
  kind: 'compute.stream.terrain-strip',
  consumerId: nx.blockId
}, { timeout: 1500 });

if (r.ok) {
  const bc = new BroadcastChannel(r.channelName);
  // ready to talk to producer
}
```

### 5. Consumer pulls frames

```javascript
const requesterId = 'rd-' + Math.random().toString(36).slice(2, 8);
let reqSeq = 0;

bc.onmessage = (e) => {
  const m = e.data;
  if (m.type !== 'frame') return;
  if (m.requesterId !== requesterId) return;  // filter to our own frames
  // m.data is the result
};

function requestNext(payload) {
  reqSeq++;
  bc.postMessage({
    type: 'request',
    requesterId,
    reqSeq,
    payload
  });
}
```

**Critical:** the consumer MUST filter by its own `requesterId` because every consumer on the same channel receives every frame the producer broadcasts. Without filtering, two consumers would each process double the work.

### 6. Transferring buffers to internal workers

When the consumer receives a frame on the BroadcastChannel, the typed arrays inside it have been freshly **structured-cloned** by the channel. They are independent of the producer's originals. The consumer can therefore **transfer their buffers** to internal Web Workers (e.g., an OffscreenCanvas render worker) for true zero-copy:

```javascript
bc.onmessage = (e) => {
  const m = e.data;
  if (m.type !== 'frame' || m.requesterId !== requesterId) return;
  const d = m.data;
  renderWorker.postMessage(
    { type: 'chunk', heights: d.heights, biomes: d.biomes, /* ... */ },
    [d.heights.buffer, d.biomes.buffer]   // transferables — zero-copy
  );
};
```

Note: BroadcastChannel itself **does not accept a transferables list**. The copy from producer to consumer is always a structured-clone. The savings are on the worker boundary, not the BroadcastChannel boundary.

---

## Registration lifecycle nuances

**Producer boots before router:** the producer's initial `nx.request('router.register', ...)` will time out. The producer should retry a finite number of times (5 attempts at 1s in `nexus-compute`), then **subscribe to `system.block_ready`** and re-attempt whenever it sees the router come online:

```javascript
nx.subscribe('system.block_ready', (p) => {
  if (p && p.blockId === 'nexus_router' && !state.registered) {
    tryRegisterWithRouter();
  }
});
```

This means future blocks emitting `system.block_ready` should include their `blockId` so other blocks can react to specific peers coming up.

**Router restarts mid-session:** the producer's heartbeats start returning to a router that has no record of the producer's session. The router silently drops unknown-session heartbeats. The producer eventually re-registers via the same `system.block_ready` mechanism. There may be a brief window where consumers can't find the producer; they should retry `router.connect` every 2s (as `nexus-render-demo` does).

**Consumer reconnects mid-stream:** if a consumer reconnects and gets a new channel name (because the producer re-registered), the old BroadcastChannel reference is now stale. Consumers should close the old `bc` before opening the new one.

**Producer dies without deregister:** heartbeat-based eviction kicks in after 15s. Consumers' next `router.connect` will return "no producer." They retry.

---

## When to use this pattern

**Use it for:**
- Streams of typed-array data (terrain heights, audio frames, simulation deltas).
- One-producer, multiple-consumer fan-out.
- Anywhere kernel IPC would create a structured-clone bottleneck.
- Any case where producers and consumers want to operate independently of kernel routing for hot-path traffic.

**Don't use it for:**
- Discrete request/response (use `nx.handle` / `nx.request` instead — they're built for that).
- Low-volume control messages (kernel IPC is fine).
- Anything that needs the kernel's lifecycle/auth/visibility guarantees.

---

## Naming conventions

- **Kind:** `<domain>.stream.<thing>` — e.g. `compute.stream.terrain-strip`. The `.stream.` infix marks it as a producer kind, not a one-shot RPC channel.
- **BroadcastChannel name:** `nexus-stream-${kind}-${sessionId}` (auto-generated by the router; producer and consumer should not construct it themselves).
- **Channel namespaces in the kernel:** `router.*` for router IPC, `compute.*` for compute IPC, `<consumer-name>.*` for consumer-specific metrics. Keep namespaces flat under the dot.

---

## Why a router at all (vs. peer discovery on a well-known channel)

Two blocks could in principle discover each other by both listening on a well-known BroadcastChannel like `nexus-router-control` and exchanging "I'm here / I want you" messages directly. The router adds:

1. **Single point of visibility** — open `nexus-router.html`, see every producer in one list.
2. **Lifecycle enforcement** — heartbeat eviction, explicit deregister, age tracking.
3. **A clear seat for future features** — auth, priority queues, multi-producer load balancing, capability filters. None of these belong on the bare BroadcastChannel.
4. **Debuggability** — `router.debug` emits every register/connect/deregister event with sessionId, kind, and reason. Drop a logger on it and you have a complete audit trail.

The router is the discovery + governance layer; BroadcastChannel is the transport.
