#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..');
const CLIENT_SRC = fs.readFileSync(path.join(ROOT, 'engines/nexus-block-client.js'), 'utf8');
const BREED_SRC = fs.readFileSync(path.join(ROOT, 'engines/breed-engine.js'), 'utf8');
const BATTLE_ENGINE_SRC = fs.readFileSync(path.join(ROOT, 'engines/battle-engine.js'), 'utf8');
const BATTLE_PROTOCOL_SRC = fs.readFileSync(path.join(ROOT, 'engines/battle-protocol.js'), 'utf8');
const WITNESS_SRC = fs.readFileSync(path.join(ROOT, 'engines/witness-selection.js'), 'utf8');
const EIDOLON_GENERATOR_SRC = fs.readFileSync(path.join(ROOT, 'engines/eidolon-generator.js'), 'utf8');
let pass = 0, fail = 0;

function log(ok, name, detail='') {
  if (ok) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.error(`FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}
async function test(name, fn) {
  try { await fn(); log(true, name); }
  catch (e) { log(false, name, e && e.stack ? e.stack.split('\n')[0] : String(e)); }
}
function assert(cond, msg='assertion failed') { if (!cond) throw new Error(msg); }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function createWindow(extra={}) {
  const listeners = new Map();
  const win = {
    console,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    Math,
    Date,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Error,
    Promise,
    Map,
    Set,
    WeakMap,
    Uint8Array,
    ArrayBuffer,
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval: () => {},
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      const set = listeners.get(type); if (set) set.delete(fn);
    },
    dispatchEvent(evt) {
      const set = listeners.get(evt.type); if (set) for (const fn of Array.from(set)) fn(evt);
    },
    location: { href: 'file:///protocol-harness.html' },
    navigator: { clipboard: { writeText: async () => {} } },
    ...extra,
  };
  win.window = win;
  win.self = win;
  win.globalThis = win;
  return win;
}

function loadClient(win) {
  vm.runInNewContext(CLIENT_SRC, win, { filename: 'nexus-block-client.js' });
  assert(win.NexusBlockClient, 'client not exported');
  return win.NexusBlockClient;
}

class KernelMock {
  constructor(win, opts={}) {
    this.win = win;
    this.handlers = opts.handlers || {};
    this.declared = null;
    this.subs = new Set();
    this.emits = [];
    this.msgs = [];
    this.blockPort = null;
    this.blockId = opts.blockId || 'test-block';
  }
  boot() {
    const kernel = this;
    this.blockPort = {
      onmessage: null,
      start() {},
      postMessage(msg) { kernel._fromBlock(msg); }
    };
    const bootEvent = { type:'message', data:{ type:'BOOT', blockId:this.blockId }, ports:[this.blockPort] };
    this.win.dispatchEvent(bootEvent);
  }
  _send(msg) {
    setTimeout(() => {
      if (this.blockPort && typeof this.blockPort.onmessage === 'function') this.blockPort.onmessage({ data: msg });
    }, 0);
  }
  _fromBlock(msg) {
    this.msgs.push(msg);
    if (!msg || !msg.type) return;
    if (msg.type === 'DECLARE') {
      this.declared = msg;
      this._send({ type:'MOUNT_CHALLENGE', nonce:'n1' });
    } else if (msg.type === 'MOUNT_ACK') {
      this._send({ type:'MOUNTED' });
    } else if (msg.type === 'SUB') {
      this.subs.add(msg.channel);
    } else if (msg.type === 'EMIT') {
      this.emits.push(msg);
      const slot = this.handlers[msg.channel];
      if (!slot) return;
      const fn = typeof slot === 'function' ? slot : slot.fn;
      const resultChannel = slot.resultChannel || `${msg.channel}.result`;
      Promise.resolve(fn(msg.payload || {}, msg)).then(payload => {
        if (payload === undefined) return;
        if (!this.subs.has(resultChannel)) return;
        const out = Object.assign({}, msg.payload && msg.payload._reqId !== undefined ? {_reqId: msg.payload._reqId} : {}, payload);
        this.dispatch(resultChannel, out, 'mock-kernel');
      }).catch(e => {
        if (!this.subs.has(resultChannel)) return;
        this.dispatch(resultChannel, { _reqId: msg.payload && msg.payload._reqId, ok:false, error:e.message }, 'mock-kernel');
      });
    }
  }
  dispatch(channel, payload={}, src='mock-src') {
    if (!this.subs.has(channel)) return false;
    this._send({ type:'MSG', channel, payload, src });
    return true;
  }
}

function makeElement(tag='div', id='') {
  const el = {
    tagName: tag.toUpperCase(), id, style:{}, dataset:{}, children:[], childNodes:[], attributes:{},
    className:'', textContent:'', value:'', checked:false, disabled:false, scrollTop:0, scrollHeight:0,
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(child){ this.children.push(child); this.childNodes.push(child); return child; },
    removeChild(child){ this.children = this.children.filter(c=>c!==child); this.childNodes = this.childNodes.filter(c=>c!==child); return child; },
    remove(){},
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){},
    querySelector(){ return makeElement('div'); }, querySelectorAll(){ return []; },
    setAttribute(k,v){ this.attributes[k]=String(v); }, getAttribute(k){ return this.attributes[k]; },
    getBoundingClientRect(){ return {left:0, top:0, width:800, height:600, right:800, bottom:600}; },
    focus(){}, blur(){}, click(){},
    getContext(){ return new Proxy({}, { get(){ return () => {}; } }); },
    cloneNode(){ return makeElement(tag, id); }
  };
  Object.defineProperty(el, 'innerHTML', { get(){ return this._html || ''; }, set(v){ this._html = String(v); } });
  return el;
}

function createDocument() {
  const ids = new Map();
  const doc = {
    body: makeElement('body', 'body'),
    documentElement: makeElement('html', 'html'),
    createElement: tag => makeElement(tag),
    createElementNS: (ns, tag) => makeElement(tag),
    createTextNode: text => ({ textContent: String(text) }),
    getElementById(id) { if (!ids.has(id)) ids.set(id, makeElement('div', id)); return ids.get(id); },
    querySelector() { return makeElement('div'); },
    querySelectorAll() { return []; },
    addEventListener(){}, removeEventListener(){},
  };
  doc.body.appendChild = function(child){ this.children.push(child); return child; };
  return doc;
}

function createIndexedDB() {
  const dbData = new Map();
  function makeStore(name) {
    if (!dbData.has(name)) dbData.set(name, new Map());
    const map = dbData.get(name);
    return {
      createIndex(){},
      put(obj){ const req={}; setTimeout(()=>{ map.set(obj.id || obj.key || obj.edgeId, obj); req.result=obj; req.onsuccess && req.onsuccess({target:req}); },0); return req; },
      delete(id){ const req={}; setTimeout(()=>{ map.delete(id); req.onsuccess && req.onsuccess({target:req}); },0); return req; },
      get(id){ const req={}; setTimeout(()=>{ req.result=map.get(id); req.onsuccess && req.onsuccess({target:req}); },0); return req; },
      getAll(){ const req={}; setTimeout(()=>{ req.result=Array.from(map.values()); req.onsuccess && req.onsuccess({target:req}); },0); return req; },
      index(){ return this; },
      openCursor(){ const req={}; setTimeout(()=>{ req.result=null; req.onsuccess && req.onsuccess({target:req}); },0); return req; },
    };
  }
  return {
    open(name, version) {
      const req = {};
      const objectStoreNames = { contains: n => dbData.has(n) };
      const db = {
        objectStoreNames,
        createObjectStore(n){ dbData.set(n, new Map()); return makeStore(n); },
        transaction(n){ return { objectStore: () => makeStore(Array.isArray(n) ? n[0] : n) }; }
      };
      setTimeout(() => { req.result = db; req.onupgradeneeded && req.onupgradeneeded({target:req}); req.onsuccess && req.onsuccess({target:req}); }, 0);
      return req;
    }
  };
}

function extractInlineScripts(html) {
  const out = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (!/\bsrc\s*=/.test(m[1])) out.push(m[2]);
  }
  return out;
}

async function bootHtmlBlock(file, opts={}) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const win = createWindow({
    document: createDocument(),
    localStorage: new MapStorage(),
    indexedDB: createIndexedDB(),
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    Blob: class Blob { constructor(parts, opts){ this.parts=parts; this.opts=opts; } },
    URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
    confirm: () => true,
    alert: () => {},
    WebSocket: undefined,
    IDBKeyRange: { upperBound: x => x },
    ResizeObserver: class ResizeObserver { constructor(fn){ this.fn = fn; } observe(){} unobserve(){} disconnect(){} },
  });
  loadClient(win);
  const ctx = vm.createContext(win);
  if (html.includes('./breed-engine.js') || html.includes('breed-engine.js')) vm.runInContext(BREED_SRC, ctx, { filename: 'breed-engine.js' });
  if (html.includes('./battle-engine.js') || html.includes('battle-engine.js')) vm.runInContext(BATTLE_ENGINE_SRC, ctx, { filename: 'battle-engine.js' });
  if (html.includes('./battle-protocol.js') || html.includes('battle-protocol.js')) vm.runInContext(BATTLE_PROTOCOL_SRC, ctx, { filename: 'battle-protocol.js' });
  if (html.includes('./witness-selection.js') || html.includes('witness-selection.js')) vm.runInContext(WITNESS_SRC, ctx, { filename: 'witness-selection.js' });
  if (html.includes('./eidolon-generator.js') || html.includes('eidolon-generator.js')) vm.runInContext(EIDOLON_GENERATOR_SRC, ctx, { filename: 'eidolon-generator.js' });
  for (const [i, src] of extractInlineScripts(html).entries()) {
    vm.runInContext(src, ctx, { filename: `${file}#script${i}` });
  }
  const kernel = new KernelMock(win, opts);
  kernel.boot();
  await waitFor(() => kernel.declared && kernel.subs.size > 0, 1000, `${file} did not subscribe`);
  kernel.win = win;
  return kernel;
}

class MapStorage {
  constructor(){ this.m = new Map(); }
  getItem(k){ return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k,v){ this.m.set(k, String(v)); }
  removeItem(k){ this.m.delete(k); }
  clear(){ this.m.clear(); }
}
async function waitFor(pred, ms, msg) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (pred()) return;
    await delay(5);
  }
  throw new Error(msg || 'waitFor timeout');
}

async function coreClientTests() {
  await test('core bootBlock valid manifest resolves ready', async () => {
    const win = createWindow();
    const client = loadClient(win);
    const api = client.bootBlock({ manifest:{ emits:['x'], consumes:['y.result'] }});
    const k = new KernelMock(win);
    k.boot();
    await api.ready;
    assert(k.declared, 'DECLARE missing');
    assert(k.subs.has('y.result'), 'auto SUB missing');
  });
  await test('core emit reaches kernel', async () => {
    const win = createWindow(); const client = loadClient(win);
    const api = client.bootBlock({ manifest:{ emits:['note'], consumes:[] }});
    const k = new KernelMock(win); k.boot(); await api.ready;
    api.emit('note', {a:1}); await delay(5);
    assert(k.emits.some(e => e.channel === 'note' && e.payload.a === 1), 'emit not recorded');
  });
  await test('core request resolves matched _reqId response', async () => {
    const win = createWindow(); const client = loadClient(win);
    const api = client.bootBlock({ manifest:{ emits:['svc.echo'], consumes:['svc.result'] }});
    const k = new KernelMock(win, { handlers:{ 'svc.echo': { resultChannel:'svc.result', fn:p => ({ok:true, echo:p.value}) } }});
    k.boot(); await api.ready;
    const r = await api.request('svc.echo', {value:42}, {timeout:100});
    assert(r.ok && r.echo === 42 && r._reqId, 'bad response');
  });
  await test('core request times out without reply', async () => {
    const win = createWindow(); const client = loadClient(win);
    const api = client.bootBlock({ manifest:{ emits:['svc.none'], consumes:['svc.result'] }});
    const k = new KernelMock(win); k.boot(); await api.ready;
    let timedOut = false;
    try { await api.request('svc.none', {}, {timeout:20}); } catch(e) { timedOut = /timeout/.test(e.message); }
    assert(timedOut, 'request did not time out');
  });
  await test('core request resolves ok:false envelope without throwing', async () => {
    const win = createWindow(); const client = loadClient(win);
    const api = client.bootBlock({ manifest:{ emits:['svc.err'], consumes:['svc.result'] }});
    const k = new KernelMock(win, { handlers:{ 'svc.err': { resultChannel:'svc.result', fn:() => ({ok:false, error:'nope'}) } }});
    k.boot(); await api.ready;
    const r = await api.request('svc.err', {}, {timeout:100});
    assert(r.ok === false && r.error === 'nope', 'error envelope mismatch');
  });
  await test('core subscribe handler fires and unsubscribe stops it', async () => {
    const win = createWindow(); const client = loadClient(win);
    const api = client.bootBlock({ manifest:{ emits:[], consumes:['topic'] }});
    const k = new KernelMock(win); let n = 0;
    const off = api.subscribe('topic', () => { n++; });
    k.boot(); await api.ready;
    k.dispatch('topic', {a:1}); await delay(5);
    off(); k.dispatch('topic', {a:2}); await delay(5);
    assert(n === 1, `handler count ${n}`);
  });
  await test('core handle emits canonical default channel result', async () => {
    const win = createWindow(); const client = loadClient(win);
    const api = client.bootBlock({ manifest:{ emits:['rpc.do.result'], consumes:['rpc.do'] }});
    const k = new KernelMock(win); api.handle('rpc.do', req => ({ok:true, got:req.x}));
    k.boot(); await api.ready;
    k.dispatch('rpc.do', {_reqId:'h1', x:7}); await delay(10);
    assert(k.emits.some(e => e.channel === 'rpc.do.result' && e.payload._reqId === 'h1' && e.payload.got === 7), 'handle result missing');
  });
  await test('core equivocationProof canonical shape', async () => {
    const win = createWindow(); const client = loadClient(win);
    const p = client.equivocationProof({sig_a:'a', sig_b:'b', conflict_kind:'lock'});
    assert(p.type === 'equivocation_proof' && p.sig_a === 'a' && p.sig_b === 'b' && p.conflict_kind === 'lock' && typeof p.detected_at === 'number');
  });
}

async function blockBootTests() {
  const mockHandlers = {
    'vibe.list': { resultChannel:'vibe.result', fn: () => ({ok:true, data:[]}) },
    'vibe.load': { resultChannel:'vibe.result', fn: () => ({ok:false, error:'not found'}) },
    'vibe.realm.current': { resultChannel:'vibe.result', fn: () => ({ok:true, realm_id:'realm_genesis_0', charter_summary:null}) },
    'fs.status': { resultChannel:'fs.result', fn: () => ({ok:true, mounted:false}) },
  };
  for (const f of ['blocks/world/atlas.html','blocks/vibes/vibes-crucible.html','blocks/vibes/vibes-arena.html','blocks/system/mission-control.html','blocks/system/nexus-db.html','blocks/vibes/vibes-library.html']) {
    await test(`block boot ${f}`, async () => {
      const k = await bootHtmlBlock(f, { handlers: mockHandlers });
      assert(k.declared && k.declared.manifest, 'DECLARE missing');
      assert(k.subs.size > 0, 'no subscriptions registered');
      if (f === 'blocks/vibes/vibes-library.html') {
        k.dispatch('vibe.realm.current', {_reqId:'lib-current'});
        await waitFor(() => k.emits.some(e => e.channel === 'vibe.result' && e.payload._reqId === 'lib-current' && e.payload.ok === true), 1000, 'library did not answer vibe.realm.current');
      }
    });
  }
}


function makeCommitBus() {
  const messages = [];
  const waiters = [];
  function notify(msg) {
    messages.push(msg);
    for (const w of waiters.slice()) {
      if (w.predicate(msg)) { clearTimeout(w.timer); waiters.splice(waiters.indexOf(w), 1); w.resolve(msg); }
    }
  }
  return {
    broadcast(msg){ setTimeout(() => notify(msg), 0); return Promise.resolve(); },
    awaitMessages(predicate, opts={}) {
      const found = messages.find(predicate);
      if (found) return Promise.resolve(found);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), opts.timeout || 50);
        waiters.push({predicate, resolve, reject, timer});
      });
    }
  };
}
function signer(pubkey) {
  return {
    sign: msg => Object.assign({}, msg, {pubkey, sig:`sig:${pubkey}:${msg.type}:${msg.commit || msg.salt || ''}`}),
    verify: (msg, expected) => msg && msg.pubkey === expected && String(msg.sig || '').startsWith(`sig:${expected}:`)
  };
}
async function commitRevealTests() {
  await test('commitReveal happy path two parties share seed', async () => {
    const win = createWindow(); const client = loadClient(win); const bus = makeCommitBus();
    const A = signer('A'), B = signer('B');
    const [ra, rb] = await Promise.all([
      client.commitReveal({contextTag:'breed-1', partnerPubkey:'B', timeout:500, sign:A.sign, verify:A.verify, broadcast:bus.broadcast, awaitMessages:bus.awaitMessages, timestampProvider:()=>1700000000000}),
      client.commitReveal({contextTag:'breed-1', partnerPubkey:'A', timeout:500, sign:B.sign, verify:B.verify, broadcast:bus.broadcast, awaitMessages:bus.awaitMessages, timestampProvider:()=>1700000000000})
    ]);
    assert(ra.jointSeed === rb.jointSeed && ra.jointSeed.startsWith('sha256:'), 'seed mismatch');
  });
  await test('commitReveal partner commit timeout', async () => {
    const win = createWindow(); const client = loadClient(win); const bus = makeCommitBus(); const A = signer('A');
    let reason = '';
    try { await client.commitReveal({contextTag:'breed-2', partnerPubkey:'B', timeout:20, sign:A.sign, verify:A.verify, broadcast:bus.broadcast, awaitMessages:bus.awaitMessages, timestampProvider:()=>1700000000000}); }
    catch(e) { reason = e.reason; }
    assert(reason === 'partner_no_commit', `reason ${reason}`);
  });
  await test('commitReveal partner reveal timeout', async () => {
    const win = createWindow(); const client = loadClient(win); const bus = makeCommitBus(); const A = signer('A');
    bus.broadcast({type:'breed_commit', contextTag:'breed-3', pubkey:'B', commit:'abc', sig:'sig:B:breed_commit'});
    let reason = '';
    try { await client.commitReveal({contextTag:'breed-3', partnerPubkey:'B', timeout:30, sign:A.sign, verify:()=>true, broadcast:bus.broadcast, awaitMessages:bus.awaitMessages, timestampProvider:()=>1700000000000}); }
    catch(e) { reason = e.reason; }
    assert(reason === 'partner_no_reveal', `reason ${reason}`);
  });
  await test('commitReveal invalid reveal rejected', async () => {
    const win = createWindow(); const client = loadClient(win); const bus = makeCommitBus(); const A = signer('A');
    bus.broadcast({type:'breed_commit', contextTag:'breed-4', pubkey:'B', commit:'notmatching', sig:'sig:B:breed_commit'});
    bus.broadcast({type:'breed_reveal', contextTag:'breed-4', pubkey:'B', salt:'00', sig:'sig:B:breed_reveal'});
    let reason = '';
    try { await client.commitReveal({contextTag:'breed-4', partnerPubkey:'B', timeout:80, sign:A.sign, verify:()=>true, broadcast:bus.broadcast, awaitMessages:bus.awaitMessages, timestampProvider:()=>1700000000000}); }
    catch(e) { reason = e.reason; }
    assert(reason === 'partner_invalid_reveal', `reason ${reason}`);
  });
  await test('commitReveal salt fails closed without WebCrypto', async () => {
    const win = createWindow({crypto:{}});
    const client = loadClient(win);
    let threw=false; try { client._randomSaltHex(); } catch(e) { threw=/crypto\.getRandomValues required/.test(e.message); } assert(threw, 'client salt fallback did not throw');
  });
  await test('battle protocol salt fails closed without crypto fallback', async () => {
    const win = createWindow({crypto:{}, NexusBattleEngine:{ENGINE_HASH:'sha256:test'}});
    vm.runInNewContext(BATTLE_PROTOCOL_SRC, win, {filename:'battle-protocol.js'});
    let threw=false; try { win.NexusBattleProtocol._randomSalt(); } catch(e) { threw=/crypto\.getRandomValues required/.test(e.message); } assert(threw, 'battle salt fallback did not throw');
  });
  await test('sexualBreed deterministic through harness', async () => {
    const win = createWindow(); vm.runInNewContext(BREED_SRC, win, {filename:'breed-engine.js'});
    const input = {dnaA:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], dnaB:[101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116], huesA:[0,90,180,270], huesB:[30,120,210,300], jointSeed:'sha256:x'};
    assert(JSON.stringify(win.NexusBreedEngine.sexualBreed(input)) === JSON.stringify(win.NexusBreedEngine.sexualBreed(input)), 'nondeterministic');
  });
}
async function sha256ForEvent(obj) {
  const enc = new TextEncoder().encode(JSON.stringify(obj));
  const d = await webcrypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function makeNostrEvent(kind, pubkey, tags, contentObj, sig='sig') {
  const ev = {pubkey, created_at:Math.floor(Date.now()/1000), kind, tags, content:JSON.stringify(contentObj)};
  ev.id = await sha256ForEvent([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content]);
  ev.sig = sig;
  return ev;
}
async function bootLibraryForTest() {
  const k = await bootHtmlBlock('blocks/vibes/vibes-library.html', {
    handlers: {
      'fs.status': { resultChannel:'fs.result', fn: () => ({ok:true, mounted:false}) }
    }
  });
  await waitFor(() => k.win.__vibesTestHooks, 1000, 'library hooks missing');
  // The library's nx.ready initializer is asynchronous: open IndexedDB, load
  // cache, import/migrate the built-in realm, reload cache, ask fs.status, then
  // emit system.block_ready. Waiting for the final emit avoids races where a
  // test mutates cache while the initializer's last loadAllToCache clears it.
  await waitFor(() => k.emits.some(e => e.channel === 'system.block_ready' && e.payload && e.payload.blockId === 'vibes_library'), 1500, 'library init did not complete');
  k.win.__vibesTestHooks._setCurrentRealmForTest('realm_genesis_0');
  k.win.__vibesTestHooks._setSecpForTest({schnorr:{verify:() => true, sign:() => new Uint8Array(64)}});
  return k;
}
async function libraryLineageTests() {
  await test('library 30420 creates foreign creature stub', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const ev = await makeNostrEvent(30420, 'p1', [['realm','realm_genesis_0'], ['d','sha256:c1']], {creature_hash:'sha256:c1', realm_id:'realm_genesis_0', generation:1, parents:[], ts:Date.now()});
    const ok = await h.handleNostrAttestationEvent(ev, 'mock');
    assert(ok && Array.from(h.cache.values()).some(e=>e.type==='creature-stub/1' && e.content_hash==='sha256:c1'), 'stub missing');
  });
  await test('library 30420 merges attestation to existing creature', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    await h.handleSave({envelope:{format:'vibe/1', id:'v_creature_x', type:'creature/eidolon-1', realm:'realm_genesis_0', content_hash:'sha256:c2', parents:[], payload:{dna:Array(16).fill(2), hues:[]}}});
    const ev = await makeNostrEvent(30420, 'p2', [['realm','realm_genesis_0'], ['d','sha256:c2']], {creature_hash:'sha256:c2', realm_id:'realm_genesis_0', generation:1, parents:[], ts:Date.now()});
    const ok = await h.handleNostrAttestationEvent(ev, 'mock');
    assert(ok && h.getAttestations(h.cache.get('v_creature_x')).length === 1, 'attestation not merged');
  });
  await test('library bad signature attestation ignored', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks; h._setSecpForTest({schnorr:{verify:() => false}});
    const ev = await makeNostrEvent(30420, 'p3', [['realm','realm_genesis_0'], ['d','sha256:bad']], {creature_hash:'sha256:bad', realm_id:'realm_genesis_0'});
    const ok = await h.handleNostrAttestationEvent(ev, 'mock');
    assert(!ok && !Array.from(h.cache.values()).some(e=>e.content_hash==='sha256:bad'), 'bad sig accepted');
  });
  await test('library wrong realm attestation ignored', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const ev = await makeNostrEvent(30420, 'p4', [['realm','other'], ['d','sha256:wrongrealm']], {creature_hash:'sha256:wrongrealm', realm_id:'other'});
    const ok = await h.handleNostrAttestationEvent(ev, 'mock');
    assert(!ok && !Array.from(h.cache.values()).some(e=>e.content_hash==='sha256:wrongrealm'), 'wrong realm accepted');
  });
  await test('library attestation rejects missing created_at', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const ev = await makeNostrEvent(30420, 'p7', [['realm','realm_genesis_0'], ['d','sha256:no-ts']], {creature_hash:'sha256:no-ts', realm_id:'realm_genesis_0'});
    delete ev.created_at;
    ev.id = await sha256ForEvent([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content]);
    const ok = await h.handleNostrAttestationEvent(ev, 'mock');
    assert(!ok && !Array.from(h.cache.values()).some(e=>e.content_hash==='sha256:no-ts'), 'missing created_at attestation accepted');
  });
  await test('library stub-then-import resolves external parent ref', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const ev = await makeNostrEvent(30420, 'p5', [['realm','realm_genesis_0'], ['d','sha256:parent']], {creature_hash:'sha256:parent', realm_id:'realm_genesis_0'});
    await h.handleNostrAttestationEvent(ev, 'mock');
    const stub = Array.from(h.cache.values()).find(e=>e.content_hash==='sha256:parent');
    const r = await h.handleSave({envelope:{format:'vibe/1', id:'child', type:'creature/eidolon-1', realm:'realm_genesis_0', parents:['external:sha256:parent'], payload:{dna:Array(16).fill(5), hues:[]}}});
    assert(r.ok && h.cache.get('child').parents.includes(stub.id), 'parent not resolved to stub');
  });
  await test('library import-then-stub forward-resolves external parent ref', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    await h.handleSave({envelope:{format:'vibe/1', id:'child2', type:'creature/eidolon-1', realm:'realm_genesis_0', parents:['external:sha256:later'], payload:{dna:Array(16).fill(6), hues:[]}}});
    const ev = await makeNostrEvent(30420, 'p6', [['realm','realm_genesis_0'], ['d','sha256:later']], {creature_hash:'sha256:later', realm_id:'realm_genesis_0'});
    await h.handleNostrAttestationEvent(ev, 'mock');
    const stub = Array.from(h.cache.values()).find(e=>e.content_hash==='sha256:later');
    assert(h.cache.get('child2').parents.includes(stub.id), 'forward resolve missing');
  });
  await test('library breed receipt with missing parents creates twin stubs', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const content = {breed_id:'b1', parent_a:'sha256:pa', parent_b:'sha256:pb', joint_seed:'sha256:s', twin1_hash:'sha256:t1', twin2_hash:'sha256:t2', breeder_a:'a', breeder_b:'b', sig_a:'sa', sig_b:'sb', ts:Date.now()};
    const ev = await makeNostrEvent(30424, 'breeder', [['realm','realm_genesis_0'], ['d','b1']], content);
    const ok = await h.handleNostrBreedReceiptEvent(ev);
    assert(ok && Array.from(h.cache.values()).filter(e=>e.type==='creature-stub/1' && String(e.name).includes('Foreign bred twin')).length === 2, 'twin stubs missing');
  });
  await test('library breed inbox records offer event', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const ev = await makeNostrEvent(30421, 'offerer', [['d','offer1'], ['partner','me'], ['realm','realm_genesis_0'], ['parent_a','sha256:a'], ['parent_b','sha256:b']], {offer_id:'offer1', partner:'me', parent_a:'sha256:a', parent_b:'sha256:b', realm_id:'realm_genesis_0'});
    const ok = await h.handleNostrBreedOfferEvent(ev, 'mock');
    assert(ok && h.breedState.offers.has('offer1'), 'offer not recorded');
  });
  await test('library breed offer id deterministic with nonce', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    k.win.localStorage.setItem('nx.soc.identity', JSON.stringify({privkey:'a'.repeat(64), pubkey:'b'.repeat(64)}));
    const req = {parent_a_hash:'sha256:a', parent_b_hash:'sha256:b', partner_pubkey:'c'.repeat(64), nonce:'offer-nonce-1', ts:1700000000000, expires:1700000900};
    const a = await h.handleBreedOffer(req);
    const b = await h.handleBreedOffer(req);
    assert(a.ok && b.ok && a.data.offer.id === b.data.offer.id, 'breed offer id drifted');
  });
  await test('library breed offer requires nonce', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    k.win.localStorage.setItem('nx.soc.identity', JSON.stringify({privkey:'a'.repeat(64), pubkey:'b'.repeat(64)}));
    const r = await h.handleBreedOffer({parent_a_hash:'sha256:a', parent_b_hash:'sha256:b', partner_pubkey:'c'.repeat(64), ts:1700000000000, expires:1700000900});
    assert(!r.ok && r.error === 'nonce_required', 'missing nonce did not fail closed');
  });
}


async function milestoneCTests() {
  await test('witness selection deterministic and top 5', async () => {
    const win = createWindow(); vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'engines/witness-selection.js'),'utf8'), win, {filename:'witness-selection.js'});
    const pool = ['p9','p1','p3','p5','p7','p2'];
    const a = win.NexusWitnessSelection.selectWitnesses({battle_id:'b', candidate_pubkeys:pool, n:5, m:3});
    const b = win.NexusWitnessSelection.selectWitnesses({battle_id:'b', candidate_pubkeys:pool.slice().reverse(), n:5, m:3});
    assert(JSON.stringify(a) === JSON.stringify(b) && a.length === 5, 'selection unstable');
  });
  await test('witness quorum accepts 3 selected signatures', async () => {
    const win = createWindow(); vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'engines/witness-selection.js'),'utf8'), win, {filename:'witness-selection.js'});
    const cert = {battle_id:'b', selected_witnesses:['a','b','c','d','e'], witnesses:[{pubkey:'a',sig:'s'},{pubkey:'b',sig:'s'},{pubkey:'c',sig:'s'}]};
    assert(win.NexusWitnessSelection.verifyWitnessQuorum(cert, 3), 'quorum rejected');
  });
  await test('witness quorum rejects below threshold', async () => {
    const win = createWindow(); vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'engines/witness-selection.js'),'utf8'), win, {filename:'witness-selection.js'});
    const cert = {battle_id:'b', selected_witnesses:['a','b','c'], witnesses:[{pubkey:'a',sig:'s'},{pubkey:'b',sig:'s'}]};
    assert(!win.NexusWitnessSelection.verifyWitnessQuorum(cert, 3), 'quorum accepted too few');
  });
  await test('witness advertisement shape reserved kind', async () => {
    const win = createWindow(); vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'engines/witness-selection.js'),'utf8'), win, {filename:'witness-selection.js'});
    const ad = win.NexusWitnessSelection.witnessAdvertisement({pubkey:'p', realm:'r', capacity:3, since:1});
    assert(ad.kind === 30450 && ad.tags.some(t => t[0] === 'realm' && t[1] === 'r'), 'bad ad shape');
  });
  await test('library witness ad enters pool', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const ev = await makeNostrEvent(30450, 'wp1', [['d','wp1'], ['realm','realm_genesis_0']], {realm:'realm_genesis_0', capacity:4, since:1});
    const ok = h.handleNostrWitnessAdEvent(ev, 'mock');
    assert(ok && h.battleState.witnessPool.has('wp1'), 'witness not pooled');
  });
  await test('library slot init on creature save', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    await h.handleSave({envelope:{format:'vibe/1', id:'slotA', type:'creature/eidolon-1', realm:'realm_genesis_0', parents:[], payload:{dna:Array(16).fill(1), hues:[]}}});
    const r = h.handleCreatureSlots({id:'slotA'});
    assert(r.ok && r.total === 3 && r.remaining === 3, 'slots not initialized');
  });
  await test('library creature spent false at birth', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    await h.handleSave({envelope:{format:'vibe/1', id:'slotB', type:'creature/eidolon-1', realm:'realm_genesis_0', parents:[], payload:{dna:Array(16).fill(2), hues:[]}}});
    const r = h.handleCreatureSpent({id:'slotB'});
    assert(r.ok && r.spent === false, 'fresh creature spent');
  });
  await test('library slot consumption makes spent after 3', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const env = {format:'vibe/1', id:'slotC', type:'creature/eidolon-1', realm:'realm_genesis_0', parents:[], payload:{dna:Array(16).fill(3), hues:[], slots:{total:3, consumed:[{id:'a'},{id:'b'},{id:'c'}]}}};
    await h.handleSave({envelope:env});
    const r = h.handleCreatureSpent({id:'slotC'});
    assert(r.ok && r.spent === true, 'spent not detected');
  });
  await test('library ranked start rejects spent creature before wallet', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const env = {format:'vibe/1', id:'spentLocal', type:'creature/eidolon-1', realm:'realm_genesis_0', content_hash:'sha256:spentlocal', parents:[], payload:{dna:Array(16).fill(4), hues:[], slots:{total:3, consumed:[{id:'a'},{id:'b'},{id:'c'}]}}};
    await h.handleSave({envelope:env});
    const r = await h.handleBattleStartRanked({partner_pubkey:'p', my_eidolon:'spentLocal', partner_eidolon:'sha256:other'});
    assert(!r.ok && /spent/.test(r.error), 'spent ranked battle not rejected');
  });
  await test('library ranked result consumes loser slot', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const loser = {format:'vibe/1', id:'loser', type:'creature/eidolon-1', realm:'realm_genesis_0', content_hash:'sha256:loser', parents:[], payload:{dna:Array(16).fill(5), hues:[]}};
    await h.handleSave({envelope:loser});
    const r = await h.applyBattleSlotResult({battle_id:'battleLose', ranked:true, winner:'A', eidolon_a_hash:'sha256:winner', eidolon_b_hash:'sha256:loser', ts:1});
    const slots = h.handleCreatureSlots({id:'loser'});
    assert(r.ok && slots.remaining === 2, 'loser slot not consumed');
  });
  await test('library imprint creates descendant and consumes source slot', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const src = {format:'vibe/1', id:'winner', type:'creature/eidolon-1', realm:'realm_genesis_0', content_hash:'sha256:winner', parents:[], payload:{name:'Win', dna:Array(16).fill(6), hues:[1,2,3], nonce:'n', scars:[]}};
    await h.handleSave({envelope:src});
    await h._put({format:'vibe/1', id:'br', type:'battle-result/1', realm:'realm_genesis_0', payload:{battle_id:'battleWin', winner:'A', eidolon_a_hash:'sha256:winner', eidolon_b_hash:'sha256:other'}});
    const out = await h.handleImprintCreate({battle_id:'battleWin', source_eidolon_id:'winner'});
    const slots = h.handleCreatureSlots({id:'winner'});
    assert(out.ok && out.envelope.parents.includes('winner') && slots.remaining === 2, 'imprint failed');
  });
  await test('library imprint rejects non-winner source', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const src = {format:'vibe/1', id:'notwinner', type:'creature/eidolon-1', realm:'realm_genesis_0', content_hash:'sha256:notwinner', parents:[], payload:{dna:Array(16).fill(7), hues:[]}};
    await h.handleSave({envelope:src});
    await h._put({format:'vibe/1', id:'br2', type:'battle-result/1', realm:'realm_genesis_0', payload:{battle_id:'battleNo', winner:'B', eidolon_a_hash:'sha256:notwinner', eidolon_b_hash:'sha256:other'}});
    const out = await h.handleImprintCreate({battle_id:'battleNo', source_eidolon_id:'notwinner'});
    assert(!out.ok && /winner/.test(out.error), 'non-winner imprint accepted');
  });
  await test('eidolon generator emits creature-dna JSON and scar script', async () => {
    const gen = require('../engines/eidolon-generator.js');
    const html = await gen.generateEidolonHtml({dna:Array(16).fill(8), hues:[10,20,30], name:'Scar', scars:[{battle_id:'b', intensity:.7, position_seed:'b'}]});
    assert(html.includes('id="creature-dna"') && html.includes('draw()') && html.includes('scars'), 'bad generator html');
  });
  await test('battle protocol battle_id deterministic for same inputs', async () => {
    const battle = require('../engines/battle-protocol.js');
    const engine = require('../engines/battle-engine.js');
    const run = async () => {
      const bus = {msgs:[], waiters:[], broadcast:async m=>{ bus.msgs.push(m); for(const w of bus.waiters.slice()){ if(w.pred(m)){ clearTimeout(w.timer); bus.waiters.splice(bus.waiters.indexOf(w),1); w.resolve(m); } }}, awaitMessages:(pred,{timeout=300}={})=>{ const f=bus.msgs.find(pred); if(f) return Promise.resolve(f); return new Promise((resolve,reject)=>{ const slot={pred,resolve,reject,timer:setTimeout(()=>reject(new Error('timeout')),timeout)}; bus.waiters.push(slot); }); }};
      const sign = pub => async msg => Object.assign({}, msg, {pubkey:pub, sig:'sig:'+pub});
      const verify = pub => async (m,p) => m.pubkey === p;
      const A={id:'a',content_hash:'sha256:a',payload:{dna:Array(16).fill(11)}};
      const B={id:'b',content_hash:'sha256:b',payload:{dna:Array(16).fill(12)}};
      const salt = () => '01'.repeat(32);
      const [sa] = await Promise.all([
        battle.startBattle({myEidolon:A,partnerPubkey:'B',partnerEidolon:B,charter:{engine_hash:engine.ENGINE_HASH},sign:sign('A'),verify:verify('A'),broadcast:bus.broadcast,awaitMessages:bus.awaitMessages,saltProvider:salt}),
        battle.startBattle({myEidolon:B,partnerPubkey:'A',partnerEidolon:A,charter:{engine_hash:engine.ENGINE_HASH},sign:sign('B'),verify:verify('B'),broadcast:bus.broadcast,awaitMessages:bus.awaitMessages,saltProvider:salt})
      ]);
      return sa.battle_id;
    };
    assert((await run()) === (await run()), 'battle_id drifted');
  });
  await test('battle protocol ranked requires walletLock', async () => {
    const battle = require('../engines/battle-protocol.js');
    let msg='';
    try { await battle.startBattle({myEidolon:{id:'a',payload:{dna:Array(16).fill(9)}},partnerPubkey:'p',partnerEidolon:{id:'b',payload:{dna:Array(16).fill(10)}},charter:{engine_hash:require('../engines/battle-engine.js').ENGINE_HASH},ranked:true,broadcast:async()=>{},awaitMessages:async()=>{}}); } catch(e) { msg=e.message; }
    assert(/walletLock/.test(msg), 'ranked did not require wallet lock');
  });
  await test('battle protocol result content carries ranked cert fields', async () => {
    const battle = require('../engines/battle-protocol.js');
    const engine = require('../engines/battle-engine.js');
    const client = require('../engines/nexus-block-client.js');
    const bus = {msgs:[], waiters:[], broadcast:async m=>{ bus.msgs.push(m); for(const w of bus.waiters.slice()){ if(w.pred(m)){ clearTimeout(w.timer); bus.waiters.splice(bus.waiters.indexOf(w),1); w.resolve(m); } }}, awaitMessages:(pred,{timeout=300}={})=>{ const f=bus.msgs.find(pred); if(f) return Promise.resolve(f); return new Promise((resolve,reject)=>{ const slot={pred,resolve,reject,timer:setTimeout(()=>reject(Object.assign(new Error('timeout'),{reason:'timeout'})),timeout)}; bus.waiters.push(slot); }); }};
    const sign = pub => async msg => Object.assign({}, msg, {pubkey:pub, sig:'sig:'+pub});
    const verify = pub => async (m,p) => m.pubkey === p;
    const A={id:'a',content_hash:'sha256:a',payload:{dna:Array(16).fill(11)}};
    const B={id:'b',content_hash:'sha256:b',payload:{dna:Array(16).fill(12)}};
    const [sa,sb] = await Promise.all([
      battle.startBattle({myEidolon:A,partnerPubkey:'B',partnerEidolon:B,charter:{engine_hash:engine.ENGINE_HASH},ranked:true,walletLock:async()=>({id:'lockA'}),partnerLock:{id:'lockB'},sign:sign('A'),verify:verify('A'),broadcast:bus.broadcast,awaitMessages:bus.awaitMessages, timestampProvider:()=>1700000000000}),
      battle.startBattle({myEidolon:B,partnerPubkey:'A',partnerEidolon:A,charter:{engine_hash:engine.ENGINE_HASH},ranked:true,walletLock:async()=>({id:'lockB'}),partnerLock:{id:'lockA'},sign:sign('B'),verify:verify('B'),broadcast:bus.broadcast,awaitMessages:bus.awaitMessages, timestampProvider:()=>1700000000000})
    ]);
    const rc = await sa.resultContent();
    assert(rc.ranked && (rc.lock_a || rc.lock_b) && Array.isArray(rc.witnesses), 'ranked cert fields missing');
  });
}

async function libraryBattleTests() {
  await test('library battle intent records inbox event', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const ev = await makeNostrEvent(30431, 'challenger', [['d','battle1'], ['partner','me'], ['realm','realm_genesis_0'], ['eidolon_a','sha256:a'], ['eidolon_b','sha256:b']], {battle_id:'battle1', partner:'me', eidolon_a:'sha256:a', eidolon_b:'sha256:b', realm_id:'realm_genesis_0', engine_hash:k.win.NexusBattleEngine.ENGINE_HASH});
    const ok = await h.handleNostrBattleIntentEvent(ev, 'mock');
    assert(ok && h.battleState.intents.has('battle1'), 'battle intent missing');
  });
  await test('library battle intent id deterministic with nonce', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    k.win.localStorage.setItem('nx.soc.identity', JSON.stringify({privkey:'d'.repeat(64), pubkey:'e'.repeat(64)}));
    const req = {partner_pubkey:'f'.repeat(64), eidolon_a_hash:'sha256:a', eidolon_b_hash:'sha256:b', nonce:'battle-nonce-1', ts:1700000000000, expires:1700000900};
    const a = await h.handleBattleIntent(req);
    const b = await h.handleBattleIntent(req);
    assert(a.ok && b.ok && a.data.intent.id === b.data.intent.id, 'battle intent id drifted');
  });
  await test('library battle intent requires nonce', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    k.win.localStorage.setItem('nx.soc.identity', JSON.stringify({privkey:'d'.repeat(64), pubkey:'e'.repeat(64)}));
    const r = await h.handleBattleIntent({partner_pubkey:'f'.repeat(64), eidolon_a_hash:'sha256:a', eidolon_b_hash:'sha256:b', ts:1700000000000, expires:1700000900});
    assert(!r.ok && r.error === 'nonce_required', 'missing battle nonce did not fail closed');
  });
  await test('library wrong realm battle intent ignored', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const ev = await makeNostrEvent(30431, 'challenger', [['d','battle2'], ['partner','me'], ['realm','other']], {battle_id:'battle2', partner:'me', realm_id:'other'});
    const ok = await h.handleNostrBattleIntentEvent(ev, 'mock');
    assert(!ok && !h.battleState.intents.has('battle2'), 'wrong realm battle accepted');
  });
  await test('library battle protocol message queues', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const ev = await makeNostrEvent(30432, 'p', [['d','battle3'], ['realm','realm_genesis_0']], {type:'battle_commit', battle_id:'battle3', turn:1, commit:'sha256:c', pubkey:'p'});
    const ok = await h.handleNostrBattleProtocolEvent(ev);
    assert(ok && h.battleState.messages.some(m => m.battle_id === 'battle3'), 'battle commit not queued');
  });
  await test('library battle result saves battle-result vibe', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const content = {battle_id:'battle4', realm_id:'realm_genesis_0', charter:'realm_genesis_0', eidolon_a:'sha256:a', eidolon_b:'sha256:b', winner:'A', transcript_hash:'sha256:t', pubkey_a:'pa', pubkey_b:'pb', sig_a:'sa', sig_b:'sb', ts:Date.now()};
    const ev = await makeNostrEvent(30434, 'pa', [['d','battle4'], ['realm','realm_genesis_0']], content);
    const ok = await h.handleNostrBattleResultEvent(ev);
    assert(ok && Array.from(h.cache.values()).some(e => e.type === 'battle-result/1' && e.payload.battle_id === 'battle4'), 'battle result not saved');
  });
  await test('library bad signature battle result ignored', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks; h._setSecpForTest({schnorr:{verify:() => false, sign:() => new Uint8Array(64)}});
    const content = {battle_id:'battle5', realm_id:'realm_genesis_0', eidolon_a:'a', eidolon_b:'b', winner:'A', transcript_hash:'sha256:t', pubkey_a:'pa', pubkey_b:'pb', sig_a:'sa', sig_b:'sb', ts:Date.now()};
    const ev = await makeNostrEvent(30434, 'pa', [['d','battle5'], ['realm','realm_genesis_0']], content);
    const ok = await h.handleNostrBattleResultEvent(ev);
    assert(!ok && !Array.from(h.cache.values()).some(e => e.type === 'battle-result/1' && e.payload.battle_id === 'battle5'), 'bad battle result accepted');
  });
  await test('library charter v1.0/v1.1 migrates to v1.2 engine hash', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const old = {format:'vibe/1', id:'v_realm_c85fe8b5cb6941eb', type:'realm-charter/1', name:'Genesis Realm', tags:['realm'], parents:[], createdAt:'2026-05-04T00:00:00.000Z', source:'test', payload:{realm_id:'realm_genesis_0', season:'s0', ruleset:{id:'eidolon-core', version:'1'}, ruleset_hash:'sha256:old', engine_hash:null, substrate_epoch:1}};
    await h._put(old);
    const migrated = await h.migrateGenesisRealmCharter();
    const env = h.cache.get(old.id);
    assert(migrated && env.payload.ruleset.version === '1.2' && env.payload.engine_hash === k.win.NexusBattleEngine.ENGINE_HASH, 'charter not migrated');
  });
  await test('library battle results channel returns stored summaries', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const env = {format:'vibe/1', id:'v_battle_result_x', type:'battle-result/1', name:'Result X', payload:{battle_id:'x'}, createdAt:new Date().toISOString()};
    await h._put(env); h.cache.set(env.id, env);
    const r = h.handleBattleResults({});
    assert(r.ok && r.data.some(x => x.id === env.id), 'result summary missing');
  });
  await test('library exposes battle engine hash to tests', async () => {
    const k = await bootLibraryForTest();
    assert(/^sha256:[0-9a-f]{64}$/.test(k.win.NexusBattleEngine.ENGINE_HASH), 'engine hash missing');
  });
  await test('genesis realm charter engine hash matches canonical engine', async () => {
    const expected = 'sha256:79cd0f7ce56120d4aee1aa6616e94c1adbda58d164ffd444e4201e2215ef65a9';
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const charter = Array.from(h.cache.values()).find(e => e && e.type === 'realm-charter/1' && e.payload && e.payload.realm_id === 'realm_genesis_0');
    assert(charter, 'genesis charter missing');
    assert(k.win.NexusBattleEngine.ENGINE_HASH === expected, 'canonical engine hash drifted');
    assert(charter.payload.engine_hash === expected, 'genesis charter engine hash drifted');
    assert(charter.payload.engine_hash === k.win.NexusBattleEngine.ENGINE_HASH, 'charter/engine hash mismatch');
    assert(String(charter.payload.ruleset.version) === '1.2', 'ruleset version drifted');
  });
  await test('battle protocol resolves under genesis charter and emits matching engine hash', async () => {
    const k = await bootLibraryForTest(); const h = k.win.__vibesTestHooks;
    const battle = require('../engines/battle-protocol.js');
    const engine = require('../engines/battle-engine.js');
    const charterEnv = Array.from(h.cache.values()).find(e => e && e.type === 'realm-charter/1' && e.payload && e.payload.realm_id === 'realm_genesis_0');
    assert(charterEnv && charterEnv.payload.engine_hash === engine.ENGINE_HASH, 'genesis charter not bound to canonical engine');
    const bus = {msgs:[], waiters:[], broadcast:async m=>{ bus.msgs.push(m); for(const w of bus.waiters.slice()){ if(w.pred(m)){ clearTimeout(w.timer); bus.waiters.splice(bus.waiters.indexOf(w),1); w.resolve(m); } }}, awaitMessages:(pred,{timeout=300}={})=>{ const f=bus.msgs.find(pred); if(f) return Promise.resolve(f); return new Promise((resolve,reject)=>{ const slot={pred,resolve,reject,timer:setTimeout(()=>reject(Object.assign(new Error('timeout'),{reason:'timeout'})),timeout)}; bus.waiters.push(slot); }); }};
    const sign = pub => async msg => Object.assign({}, msg, {pubkey:pub, sig:'sig:'+pub});
    const verify = pub => async (m,p) => m.pubkey === p;
    const A={id:'ga',content_hash:'sha256:ga',payload:{dna:[201,140,200,180,170,120,110,220,130,150,160,190,200,180,210,170]}};
    const B={id:'gb',content_hash:'sha256:gb',payload:{dna:[99,230,190,80,240,210,200,180,220,131,90,199,140,222,135,144]}};
    const saltA = (() => { let i=0; return () => String(++i).padStart(2,'0').repeat(32); })();
    const saltB = (() => { let i=50; return () => String(++i).padStart(2,'0').slice(0,2).repeat(32); })();
    const [sa,sb] = await Promise.all([
      battle.startBattle({myEidolon:A,partnerPubkey:'B',partnerEidolon:B,charter:charterEnv.payload,sign:sign('A'),verify:verify('A'),broadcast:bus.broadcast,awaitMessages:bus.awaitMessages,saltProvider:saltA}),
      battle.startBattle({myEidolon:B,partnerPubkey:'A',partnerEidolon:A,charter:charterEnv.payload,sign:sign('B'),verify:verify('B'),broadcast:bus.broadcast,awaitMessages:bus.awaitMessages,saltProvider:saltB})
    ]);
    let over = null;
    for (let t=0; t<80 && !over; t++) {
      const [ra, rb] = await Promise.all([sa.submitMove(t % 4), sb.submitMove((t + 1) % 4)]);
      over = ra.isOver || rb.isOver;
    }
    assert(over, 'battle did not resolve within cap');
    const result = await sa.resultContent();
    assert(result.engine_hash === charterEnv.payload.engine_hash, 'result engine hash does not match charter');
    assert(result.transcript_hash && /^sha256:[0-9a-f]{64}$/.test(result.transcript_hash), 'result transcript hash missing');
  });
  await test('battle protocol rejects mismatched charter engine hash', async () => {
    const battle = require('../engines/battle-protocol.js');
    let msg='';
    try {
      await battle.startBattle({myEidolon:{id:'a',payload:{dna:Array(16).fill(1)}},partnerPubkey:'p',partnerEidolon:{id:'b',payload:{dna:Array(16).fill(2)}},charter:{engine_hash:'sha256:'+'0'.repeat(64)},broadcast:async()=>{},awaitMessages:async()=>{}});
    } catch (e) { msg = e.message; }
    assert(/engine_hash mismatch/.test(msg), 'mismatched charter engine hash was not rejected');
  });
}

(async () => {
  await coreClientTests();
  await commitRevealTests();
  await blockBootTests();
  await libraryLineageTests();
  await libraryBattleTests();
  await milestoneCTests();
  console.log(`SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
})();
