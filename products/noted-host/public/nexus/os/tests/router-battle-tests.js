#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto, createHash } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..');
const ROUTER_PATH = path.join(ROOT, 'blocks/eidolon/eidolon-router.html');
const ROUTER_HTML = fs.readFileSync(ROUTER_PATH, 'utf8');
const SUBSTRATE_SRC = fs.readFileSync(path.join(ROOT, 'engines/substrate.js'), 'utf8');
const BATTLE_ENGINE_SRC = fs.readFileSync(path.join(ROOT, 'engines/battle-engine.js'), 'utf8');
const engine = require('../engines/battle-engine.js');
let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS router-battle '+name); }
    catch (e) { fail++; console.error('FAIL router-battle '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`ROUTER-BATTLE SUMMARY pass=${pass} fail=${fail}`);
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
    getElementById(id){ if (!ids.has(id)) ids.set(id, makeElement(id === 'map-canvas' ? 'canvas' : 'div', id)); return ids.get(id); },
    querySelectorAll(){ return []; },
    addEventListener(){}, removeEventListener(){},
  };
}
function loadRouterContext() {
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
    setTimeout: () => 0,
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
  };
  win.window = win; win.self = win; win.globalThis = win;
  const ctx = vm.createContext(win);
  vm.runInContext(SUBSTRATE_SRC, ctx, { filename: 'substrate.js' });
  vm.runInContext(BATTLE_ENGINE_SRC, ctx, { filename: 'battle-engine.js' });
  for (const [i, raw] of extractInlineScripts(ROUTER_HTML).entries()) {
    const src = raw.replace(/\nboot\(\);\s*$/, '\n');
    vm.runInContext(src, ctx, { filename: `eidolon-router.html#script${i}` });
  }
  assert(win.__eidolonRouterTestHooks, 'router test hooks missing');
  return win;
}
function canonical(v){
  if(v===null||v===undefined)return JSON.stringify(v);
  if(typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
function sha256Hex(str){ return createHash('sha256').update(str).digest('hex'); }
function directTurnSeed(world_seed, battle_index, turn){ return 'sha256:' + sha256Hex(canonical({world_seed, battle_index, turn})); }
function directChoose(state){
  let best = 0, bestPower = -1;
  for (let i=0; i<state.moves.length; i++) {
    const power = Number(state.moves[i] && state.moves[i].power) || 0;
    if (power > bestPower) { best = i; bestPower = power; }
  }
  return best;
}
function makeCreature(id, name, dna, hues=[1,2,3]){ return {id, name, dna, hues, hp:null}; }
function directBattle(cA, cB, world_seed, battle_index) {
  const battleSeed = `router:${world_seed}:${battle_index}`;
  let { stateA, stateB } = engine.initBattle({
    eidolonA: { id:cA.id, name:cA.name, payload:{dna:cA.dna, hues:cA.hues, name:cA.name} },
    eidolonB: { id:cB.id, name:cB.name, payload:{dna:cB.dna, hues:cB.hues, name:cB.name} },
    battleSeed
  });
  if (cA.hp !== null && cA.hp !== undefined && Number.isFinite(Number(cA.hp))) stateA.hp = Math.max(0, Math.min(stateA.maxHp, Math.floor(Number(cA.hp))));
  if (cB.hp !== null && cB.hp !== undefined && Number.isFinite(Number(cB.hp))) stateB.hp = Math.max(0, Math.min(stateB.maxHp, Math.floor(Number(cB.hp))));
  let turns = 0;
  while(!engine.isOver({stateA,stateB}) && turns<80){
    turns++;
    const r = engine.resolveTurn({stateA,stateB,moveA:directChoose(stateA),moveB:directChoose(stateB),turnSeed:directTurnSeed(world_seed,battle_index,turns)});
    stateA = r.newStateA; stateB = r.newStateB;
  }
  const over = engine.isOver({stateA,stateB});
  const winner = over ? over.toLowerCase() : (stateA.hp >= stateB.hp ? 'a' : 'b');
  return {winner, turns, finalHp:{a:stateA.hp, b:stateB.hp}};
}

add('router driven outcomes match canonical direct for fixed pairs', async () => {
  const win = loadRouterContext();
  const h = win.__eidolonRouterTestHooks;
  const worldSeed = 0x1a2b3c4d;
  h._setWorldForTest(worldSeed);
  const pairs = [
    [makeCreature('a1','A1',[201,140,200,180,170,120,110,220,130,150,160,190,200,180,210,170]), makeCreature('b1','B1',[99,230,190,80,240,210,200,180,220,131,90,199,140,222,135,144])],
    [makeCreature('a2','A2',[129,128,200,0,0,0,0,255,0,0,0,0,0,0,0,0]), makeCreature('b2','B2',[0,220,0,255,128,64,32,180,1,2,3,4,5,6,7,8])],
    [makeCreature('a3','A3',[13,27,41,55,69,83,97,111,125,139,153,167,181,195,209,223]), makeCreature('b3','B3',[223,209,195,181,167,153,139,125,111,97,83,69,55,41,27,13])],
  ];
  for (let i=0; i<pairs.length; i++) {
    const battleIndex = i + 1;
    const router = await h.simulateBattle(pairs[i][0], pairs[i][1], { battleIndex });
    const direct = directBattle(pairs[i][0], pairs[i][1], worldSeed, battleIndex);
    assert.deepStrictEqual(JSON.parse(JSON.stringify({winner:router.winner, turns:router.turns, finalHp:router.finalHp})), direct, `pair ${i+1}`);
  }
});

add('router battle is reproducible for identical inputs', async () => {
  const win = loadRouterContext();
  const h = win.__eidolonRouterTestHooks;
  const worldSeed = 0x0badcafe;
  const a = makeCreature('ra','RA',[180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195]);
  const b = makeCreature('rb','RB',[90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105]);
  h._setWorldForTest(worldSeed);
  const one = await h.simulateBattle(a, b, { battleIndex: 7 });
  h._setWorldForTest(worldSeed);
  const two = await h.simulateBattle(a, b, { battleIndex: 7 });
  assert.strictEqual(JSON.stringify(one), JSON.stringify(two), 'router outcomes drifted');
});

add('router no longer defines duplicate battle math symbols', () => {
  const src = extractInlineScripts(ROUTER_HTML).join('\n');
  const forbidden = [
    /\bfunction\s+simCalcDmg\s*\(/,
    /\bfunction\s+computeStats\s*\(/,
    /\bfunction\s+deriveMoves\s*\(/,
    /\bfunction\s+deriveTypes\s*\(/,
    /\bconst\s+BASE_MOVES\s*=/,
    /\bconst\s+TRAIT_MOVES\s*=/,
    /\bconst\s+BEATS\s*=/,
  ];
  for (const re of forbidden) assert(!re.test(src), `forbidden duplicate remains: ${re}`);
  assert(/window\.NexusBattleEngine/.test(src), 'router does not require canonical battle engine');
});

run();
