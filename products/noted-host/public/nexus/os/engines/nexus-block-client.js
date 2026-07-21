/* Nexus Block Client v1 — shared managed-block IPC adapter.
   Exposes window.NexusBlockClient.bootBlock() and equivocationProof().
   Classic script intentionally: works from file:// without module/CORS constraints. */
(function(global){
  'use strict';

  function reqId(){
    // METADATA: display only, not content-addressed
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return 'r_' + global.crypto.randomUUID().slice(0, 12);
    }
    return 'r_' + Math.random().toString(36).slice(2, 14);
  }


  function bytesToHex(bytes){
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function hexToBytes(hex){
    const clean = String(hex || '').replace(/^0x/, '').replace(/^sha256:/, '');
    const out = new Uint8Array(Math.floor(clean.length / 2));
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i*2, i*2+2), 16) || 0;
    return out;
  }
  function stable(v){
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k)+':'+stable(v[k])).join(',') + '}';
  }
  async function sha256Hex(data){
    let bytes;
    if (data instanceof Uint8Array) bytes = data;
    else if (Array.isArray(data)) bytes = new Uint8Array(data);
    else bytes = new TextEncoder().encode(String(data));
    const digest = await global.crypto.subtle.digest('SHA-256', bytes);
    return bytesToHex(new Uint8Array(digest));
  }
  function concatBytes(parts){
    const arrays = parts.map(p => p instanceof Uint8Array ? p : /^[0-9a-f]+$/i.test(String(p||'')) ? hexToBytes(p) : new TextEncoder().encode(String(p||'')));
    const len = arrays.reduce((n,a)=>n+a.length,0);
    const out = new Uint8Array(len);
    let off = 0; for (const a of arrays) { out.set(a, off); off += a.length; }
    return out;
  }
  function randomSaltHex(saltProvider){
    if (typeof saltProvider === 'function') {
      const supplied = saltProvider();
      if (supplied instanceof Uint8Array) return bytesToHex(supplied);
      const hex = String(supplied || '').replace(/^0x/, '').replace(/^sha256:/, '');
      if (/^[0-9a-f]{64}$/i.test(hex)) return hex.toLowerCase();
      throw new Error('invalid_salt_provider_output');
    }
    const b = new Uint8Array(32);
    if (global.crypto && typeof global.crypto.getRandomValues === 'function') global.crypto.getRandomValues(b);
    else throw new Error('crypto.getRandomValues required for commit-reveal salt');
    return bytesToHex(b);
  }
  function waitForMessage(awaitMessages, predicate, opts){
    if (typeof awaitMessages !== 'function') return Promise.reject(Object.assign(new Error('awaitMessages required'), {reason:'await_messages_required'}));
    return Promise.resolve(awaitMessages(predicate, opts));
  }
  async function defaultSign(sign, unsigned){
    if (typeof sign !== 'function') return unsigned;
    const r = await sign(unsigned);
    if (r && typeof r === 'object') return Object.assign({}, unsigned, r);
    return Object.assign({}, unsigned, {sig: r});
  }

  async function commitReveal({contextTag, partnerPubkey, timeout = 15000, sign, verify, broadcast, awaitMessages, saltProvider, timestampProvider} = {}) {
    if (!contextTag) throw new Error('contextTag required');
    if (!partnerPubkey) throw new Error('partnerPubkey required');
    if (typeof broadcast !== 'function') throw new Error('broadcast required');
    if (typeof awaitMessages !== 'function') throw new Error('awaitMessages required');
    const transcript = [];
    const nextTs = () => {
      if (typeof timestampProvider !== 'function') throw new Error('timestampProvider required for commit-reveal message ts');
      const n = Number(timestampProvider());
      if (!Number.isFinite(n)) throw new Error('invalid_commit_reveal_ts');
      return n;
    };
    const mySalt = randomSaltHex(saltProvider);
    const myCommit = await sha256Hex(concatBytes([mySalt, String(contextTag)]));
    const commitUnsigned = { type:'breed_commit', contextTag:String(contextTag), partnerPubkey:String(partnerPubkey), commit:myCommit, ts:nextTs() };
    const commitSigned = await defaultSign(sign, commitUnsigned);
    transcript.push({direction:'out', message:commitSigned});
    await broadcast(commitSigned);

    let partnerCommit;
    try {
      partnerCommit = await waitForMessage(awaitMessages, m => m && m.type === 'breed_commit' && m.contextTag === String(contextTag) && m.pubkey === String(partnerPubkey), {timeout, phase:'commit', contextTag, partnerPubkey});
    } catch (e) {
      throw Object.assign(new Error('partner_no_commit'), {reason:'partner_no_commit', evidence:e});
    }
    if (verify && !(await verify(partnerCommit, partnerPubkey))) throw Object.assign(new Error('partner_invalid_commit'), {reason:'partner_invalid_commit', evidence:partnerCommit});
    transcript.push({direction:'in', message:partnerCommit});

    const revealUnsigned = { type:'breed_reveal', contextTag:String(contextTag), partnerPubkey:String(partnerPubkey), salt:mySalt, commit:myCommit, ts:nextTs() };
    const revealSigned = await defaultSign(sign, revealUnsigned);
    transcript.push({direction:'out', message:revealSigned});
    await broadcast(revealSigned);

    let partnerReveal;
    try {
      partnerReveal = await waitForMessage(awaitMessages, m => m && m.type === 'breed_reveal' && m.contextTag === String(contextTag) && m.pubkey === String(partnerPubkey), {timeout, phase:'reveal', contextTag, partnerPubkey});
    } catch (e) {
      throw Object.assign(new Error('partner_no_reveal'), {reason:'partner_no_reveal', evidence:e});
    }
    if (verify && !(await verify(partnerReveal, partnerPubkey))) throw Object.assign(new Error('partner_invalid_reveal_signature'), {reason:'partner_invalid_reveal', evidence:partnerReveal});
    const partnerExpected = await sha256Hex(concatBytes([partnerReveal.salt, String(contextTag)]));
    if (partnerExpected !== partnerCommit.commit) throw Object.assign(new Error('partner_invalid_reveal'), {reason:'partner_invalid_reveal', evidence:{partnerCommit, partnerReveal}});
    transcript.push({direction:'in', message:partnerReveal});

    // Canonicalize ordering so both parties derive the same seed.
    const pair = [
      {salt: mySalt, commit: myCommit},
      {salt: partnerReveal.salt, commit: partnerCommit.commit}
    ].sort((a,b) => a.commit.localeCompare(b.commit));
    const jointSeed = 'sha256:' + await sha256Hex(concatBytes([pair[0].salt, pair[1].salt, pair[0].commit, pair[1].commit]));
    return {jointSeed, mySalt, partnerSalt: partnerReveal.salt, myCommit, partnerCommit: partnerCommit.commit, transcript};
  }

  function equivocationProof({sig_a, sig_b, conflict_kind}) {
    return {
      type: 'equivocation_proof',
      sig_a,
      sig_b,
      conflict_kind,
      detected_at: Date.now() // METADATA: display only, not content-addressed
    };
  }

  function normalizeManifest(raw){
    const input = raw || {};
    const app = input.app || null;
    const emits = Array.isArray(input.emits) ? input.emits.slice() : [];
    const consumes = Array.isArray(input.consumes) ? input.consumes.slice() : [];
    const undoable = Array.isArray(input.undoable) ? input.undoable.slice() : [];
    const emitted = new Set(emits);
    for (const channel of undoable) {
      if (!emitted.has(channel)) {
        throw new Error(`manifest undoable channel must also be emitted: ${channel}`);
      }
    }
    return {
      manifest: { emits, consumes, undoable },
      app
    };
  }

  function bootBlock({manifest, onMessage} = {}) {
    const declared = normalizeManifest(manifest);
    const consumes = new Set(declared.manifest.consumes);
    const handlers = new Map();
    const requestHandlers = new Map();
    const pending = new Map();
    const requestedSubs = new Set(consumes);
    const queuedEmits = [];

    let port = null;
    let mounted = false;
    let blockId = null;
    let readyResolve;
    const ready = new Promise(resolve => { readyResolve = resolve; });

    function post(msg){
      if (port) port.postMessage(msg);
    }

    function subscribe(channel, handler){
      if (typeof channel !== 'string' || !channel) throw new Error('subscribe: channel required');
      if (!consumes.has(channel)) {
        throw new Error(`subscribe: undeclared consume channel ${channel}`);
      }
      if (!handlers.has(channel)) handlers.set(channel, new Set());
      if (handler) handlers.get(channel).add(handler);
      if (!requestedSubs.has(channel)) requestedSubs.add(channel);
      if (port && mounted) post({type:'SUB', channel});
      return function unsubscribe(){
        const set = handlers.get(channel);
        if (set && handler) set.delete(handler);
      };
    }

    function emit(channel, payload){
      if (!port) return false;
      const msg = {type:'EMIT', channel, payload};
      if (!mounted) {
        queuedEmits.push(msg);
        return true;
      }
      post(msg);
      return true;
    }

    function emitResponse(channel, req, response, resultChannel){
      if (response === undefined) return;
      const payload = Object.assign(
        {},
        req && req._reqId !== undefined ? {_reqId: req._reqId} : {},
        response && typeof response === 'object' ? response : {ok:true, data: response}
      );
      emit(resultChannel || `${channel}.result`, payload);
    }

    function handle(channel, handler, opts = {}){
      if (typeof channel !== 'string' || !channel) throw new Error('handle: channel required');
      if (typeof handler !== 'function') throw new Error('handle: handler required');
      if (!consumes.has(channel)) {
        throw new Error(`handle: undeclared consume channel ${channel}`);
      }
      requestHandlers.set(channel, {handler, resultChannel: opts.resultChannel || `${channel}.result`});
      if (!requestedSubs.has(channel)) requestedSubs.add(channel);
      if (port && mounted) post({type:'SUB', channel});
      return function unhandle(){ requestHandlers.delete(channel); };
    }


    function request(channel, payload = {}, opts = {}){
      const timeout = Number.isFinite(opts.timeout) ? opts.timeout : 8000;
      const _reqId = reqId();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(_reqId);
          reject(new Error(`timeout: ${channel}`));
        }, timeout);
        pending.set(_reqId, {resolve, reject, timer, channel});
        try {
          emit(channel, Object.assign({}, payload, {_reqId}));
        } catch (err) {
          clearTimeout(timer);
          pending.delete(_reqId);
          reject(err);
        }
      });
    }

    function handleMsg(channel, payload, src, raw){
      const p = payload || {};
      if (p._reqId && pending.has(p._reqId)) {
        const slot = pending.get(p._reqId);
        clearTimeout(slot.timer);
        pending.delete(p._reqId);
        slot.resolve(p);
      }
      const rh = requestHandlers.get(channel);
      if (rh) {
        Promise.resolve()
          .then(() => rh.handler(p, src, raw))
          .then(res => emitResponse(channel, p, res, rh.resultChannel))
          .catch(err => emitResponse(channel, p, {ok:false, error: err && err.message ? err.message : String(err)}, rh.resultChannel));
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
})(typeof window !== 'undefined' ? window : globalThis);
