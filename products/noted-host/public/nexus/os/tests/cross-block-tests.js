#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto, createHash } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..');
const SUBSTRATE_SRC = fs.readFileSync(path.join(ROOT, 'engines/substrate.js'), 'utf8');
const BATTLE_ENGINE_SRC = fs.readFileSync(path.join(ROOT, 'engines/battle-engine.js'), 'utf8');
const ROUTER_HTML = fs.readFileSync(path.join(ROOT, 'blocks/eidolon/eidolon-router.html'), 'utf8');
const OS_HTML = fs.readFileSync(path.join(ROOT, 'blocks/eidolon/eidolon-os.html'), 'utf8');
const NEXUS_CLIENT_SRC = fs.readFileSync(path.join(ROOT, 'engines/nexus-block-client.js'), 'utf8');
const VERSE_STUDIO_HTML = fs.readFileSync(path.join(ROOT, 'blocks/apps/verse-studio.html'), 'utf8');
const COMPANION_HTML = fs.readFileSync(path.join(ROOT, 'blocks/apps/companion.html'), 'utf8');
let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS cross-block '+name); }
    catch (e) { fail++; console.error('FAIL cross-block '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`CROSS-BLOCK SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
}

function extractInlineScripts(html) {
  const out = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) if (!/\bsrc\s*=/.test(m[1])) out.push(m[2]);
  return out;
}
function makeElement(tag='div', id='') {
  return {
    tagName: tag.toUpperCase(), id, style:{}, children:[], childNodes:[], textContent:'', innerHTML:'', onclick:null,
    disabled:false, className:'', clientWidth:800, clientHeight:600, width:800, height:600,
    classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(c){ this.children.push(c); this.childNodes.push(c); return c; },
    addEventListener(){}, removeEventListener(){},
    querySelector(){ return makeElement(); }, querySelectorAll(){ return []; },
    getContext(){ return new Proxy({}, { get(){ return () => {}; } }); },
    getBoundingClientRect(){ return {left:0, top:0, width:800, height:600}; },
  };
}
function makeDocument(){
  const ids = new Map();
  return {
    body: makeElement('body','body'),
    createElement: tag => makeElement(tag),
    getElementById(id){ if (!ids.has(id)) ids.set(id, makeElement(id.includes('canvas') || id === 'map-canvas' ? 'canvas' : 'div', id)); return ids.get(id); },
    querySelectorAll(){ return []; },
    addEventListener(){}, removeEventListener(){},
  };
}
function baseWindow({immediateTimeout=false}={}) {
  const win = {
    console,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    document: makeDocument(),
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: immediateTimeout ? ((fn) => { if (typeof fn === 'function') fn(); return 0; }) : (() => 0),
    clearTimeout: () => {},
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
    Uint8Array,
    ArrayBuffer,
    addEventListener(){}, removeEventListener(){}, postMessage(){},
  };
  win.window = win; win.self = win; win.globalThis = win;
  return win;
}

function extractVerseBootstrapScript(){
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(VERSE_STUDIO_HTML)) !== null) {
    const attrs = m[1] || '';
    const code = m[2] || '';
    if (!/\bsrc\s*=/.test(attrs) && !/\btype\s*=\s*(["'])module\1/i.test(attrs) && code.includes('window.NexusBlockClient.bootBlock')) {
      return code;
    }
  }
  throw new Error('Verse Studio bootstrap script not found');
}

function makeVerseBridgeHarness(){
  assert(COMPANION_HTML.includes("nx.emit('companion.canvas.export', { json:"), 'Companion export payload no longer includes json');
  const listeners = { message: [] };
  const intervals = [];
  const posted = [];
  const win = baseWindow();
  win.addEventListener = function(type, fn){
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(fn);
  };
  win.removeEventListener = function(type, fn){
    if (!listeners[type]) return;
    listeners[type] = listeners[type].filter(x => x !== fn);
  };
  win.setInterval = function(fn){ intervals.push(fn); return intervals.length; };
  win.clearInterval = function(){};
  const ctx = vm.createContext(win);
  vm.runInContext(NEXUS_CLIENT_SRC, ctx, { filename: 'engines/nexus-block-client.js' });
  vm.runInContext(extractVerseBootstrapScript(), ctx, { filename: 'blocks/apps/verse-studio.html#bootstrap' });
  assert.strictEqual(typeof win.NexusBlockClient, 'object', 'NexusBlockClient did not load');
  assert(win.nx, 'Verse bootstrap did not create window.nx');

  const port = {
    onmessage: null,
    postMessage(msg){ posted.push(msg); },
    start(){}
  };
  for (const fn of listeners.message) {
    fn({ data: { type: 'BOOT', blockId: 'verse-studio-test' }, ports: [port] });
  }
  assert.strictEqual(typeof port.onmessage, 'function', 'boot did not attach port.onmessage');
  port.onmessage({ data: { type: 'MOUNTED' } });

  return {
    win,
    posted,
    port,
    tickIntervals(){ for (const fn of intervals.slice()) fn(); },
    route(channel, payload){ port.onmessage({ data: { type: 'MSG', channel, payload, src: 'companion-test' } }); }
  };
}

function loadRouterContext() {
  const win = baseWindow();
  const ctx = vm.createContext(win);
  vm.runInContext(SUBSTRATE_SRC, ctx, { filename: 'substrate.js' });
  vm.runInContext(BATTLE_ENGINE_SRC, ctx, { filename: 'battle-engine.js' });
  for (const [i, raw] of extractInlineScripts(ROUTER_HTML).entries()) {
    vm.runInContext(raw.replace(/\nboot\(\);\s*$/, '\n'), ctx, { filename: `eidolon-router.html#script${i}` });
  }
  assert(win.__eidolonRouterTestHooks, 'router test hooks missing');
  return win;
}
function loadOsContext() {
  const win = baseWindow({immediateTimeout:true});
  const ctx = vm.createContext(win);
  vm.runInContext(SUBSTRATE_SRC, ctx, { filename: 'substrate.js' });
  vm.runInContext(BATTLE_ENGINE_SRC, ctx, { filename: 'battle-engine.js' });
  for (const [i, raw] of extractInlineScripts(OS_HTML).entries()) {
    const src = raw.replace(/\n\/\/ ── Boot[\s\S]*?boot\(\)\.catch\([\s\S]*?\);\s*$/, '\n');
    vm.runInContext(src, ctx, { filename: `eidolon-os.html#script${i}` });
  }
  assert(win.__eidolonOsTestHooks, 'OS test hooks missing');
  return win;
}
function canonical(v){
  if(v===null||v===undefined)return JSON.stringify(v);
  if(typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
function sha256Hex(str){ return createHash('sha256').update(String(str)).digest('hex'); }
function sharedTurnSeed(battle_id, turn){ return 'sha256:' + sha256Hex(canonical({battle_id, turn})); }
function makeCreature(id, name, dna, hues){ return {id, name, dna, hues, hp:null}; }
function digest(state){
  return {
    hp: state.hp,
    maxHp: state.maxHp,
    status: state.status,
    dodging: state.dodging,
    accDown: state.accDown,
    atkSt: state.atkSt,
    defSt: state.defSt,
    spASt: state.spASt,
    spDSt: state.spDSt,
    spdSt: state.spdSt,
    turn: state.turn
  };
}
function scriptedMoves(length=80){
  return {
    player: Array.from({length}, (_,i)=>i % 4),
    enemy: Array.from({length}, (_,i)=>(i + 3) % 4)
  };
}
async function routerRun(pair, battleId, moves) {
  const win = loadRouterContext();
  const h = win.__eidolonRouterTestHooks;
  h._setWorldForTest(0xD00DFEED);
  let turnIndex = 0;
  win.chooseRouterMove = (state) => {
    const side = state && state.side;
    if (side === 'A') return moves.player[turnIndex % moves.player.length];
    const move = moves.enemy[turnIndex % moves.enemy.length];
    turnIndex += 1;
    return move;
  };
  win.routerTurnSeed = async (_battleIndex, turn) => sharedTurnSeed(battleId, turn);
  const out = await h.simulateBattle(pair.a, pair.b, { battleIndex: 1, battleSeed: battleId });
  return {winner:out.winner === 'a' ? 'player' : 'enemy', turns:out.turns, finalHp:{player:out.finalHp.a, enemy:out.finalHp.b}};
}
async function osRun(pair, battleId, moves) {
  const win = loadOsContext();
  const h = win.__eidolonOsTestHooks;
  let turnIndex = 0;
  win.chooseEnemyMoveIndex = () => moves.enemy[turnIndex % moves.enemy.length];
  win.osTurnSeed = async (_battleId, turn) => sharedTurnSeed(battleId, turn);
  h._setBattleForTest(pair.a.dna, pair.a.hues, pair.a.name, 1, pair.b.dna, pair.b.hues, pair.b.name, 1, { battleId });
  while (h._getState().battlePhase !== 'end' && turnIndex < 80) {
    const move = moves.player[turnIndex % moves.player.length];
    await h.executeTurn(move);
    h._drainLogsForTest();
    turnIndex += 1;
  }
  const s = h._getState();
  return {
    winner: s.player.hp > 0 && s.enemy.hp <= 0 ? 'player' : (s.enemy.hp > 0 && s.player.hp <= 0 ? 'enemy' : (s.player.hp >= s.enemy.hp ? 'player' : 'enemy')),
    turns: s.battleTurnCount,
    finalHp:{player:s.player.hp, enemy:s.enemy.hp},
    state:{player:digest(s.player), enemy:digest(s.enemy)}
  };
}

const pairs = [
  {a:makeCreature('cx-a1','CXA1',[201,140,200,180,170,120,110,220,130,150,160,190,200,180,210,170],[1,2,3]), b:makeCreature('cx-b1','CXB1',[99,230,190,80,240,210,200,180,220,131,90,199,140,222,135,144],[20,40,60])},
  {a:makeCreature('cx-a2','CXA2',[13,27,41,55,69,83,97,111,125,139,153,167,181,195,209,223],[30,150,270]), b:makeCreature('cx-b2','CXB2',[223,209,195,181,167,153,139,125,111,97,83,69,55,41,27,13],[300,60,180])},
];

add('router and OS produce identical final outcomes for scripted battles', async () => {
  for (let i=0; i<pairs.length; i++) {
    const battleId = `cross-block-${i+1}`;
    const moves = scriptedMoves();
    const router = await routerRun(pairs[i], battleId, moves);
    const os = await osRun(pairs[i], battleId, moves);
    assert.deepStrictEqual({winner:os.winner, turns:os.turns, finalHp:os.finalHp}, router, `pair ${i+1}`);
  }
});

add('companion canvas export auto-imports into verse studio', async () => {
  const h = makeVerseBridgeHarness();
  const declare = h.posted.find(m => m && m.type === 'DECLARE');
  assert(declare, 'Verse did not declare managed-block manifest');
  assert.deepStrictEqual(Array.from(declare.manifest.consumes), ['companion.canvas.export', 'companion.canvas.export.undo']);
  assert.deepStrictEqual(Array.from(declare.manifest.emits), ['verse.ready', 'verse.state.snapshot', 'verse.canvas.imported']);
  assert(h.posted.some(m => m && m.type === 'SUB' && m.channel === 'companion.canvas.export'), 'Verse did not subscribe to companion.canvas.export on mount');

  const canvasJson = JSON.stringify({ nodes: [{ id: 'thought-1', text: 'first bridge payload' }], edges: [] });
  h.route('companion.canvas.export', { json: canvasJson, ts: 101, _reqId: 'req-bridge-1' });

  const imports = [];
  h.win.__verseStudio = {
    getState(){ return { ok: true }; },
    importCompanionCanvas(json){ imports.push(json); }
  };
  h.tickIntervals();

  assert.deepStrictEqual(imports, [canvasJson], 'Verse importCompanionCanvas did not receive the companion JSON payload');
  const emitted = h.posted.filter(m => m && m.type === 'EMIT').map(m => ({ channel: m.channel, payload: m.payload }));
  const importedIdx = emitted.findIndex(m => m.channel === 'verse.canvas.imported' && m.payload && m.payload.ok === true);
  const readyIdx = emitted.findIndex(m => m.channel === 'verse.ready');
  assert(importedIdx >= 0, 'verse.canvas.imported ok=true was not emitted');
  assert.strictEqual(emitted[importedIdx].payload._reqId, 'req-bridge-1');
  assert(readyIdx >= 0, 'verse.ready was not emitted');
  assert(importedIdx < readyIdx, 'pending import should drain before verse.ready is emitted');
});

run();
