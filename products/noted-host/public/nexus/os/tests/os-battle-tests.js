#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto, createHash } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..');
const OS_PATH = path.join(ROOT, 'blocks/eidolon/eidolon-os.html');
const OS_HTML = fs.readFileSync(OS_PATH, 'utf8');
const SUBSTRATE_SRC = fs.readFileSync(path.join(ROOT, 'engines/substrate.js'), 'utf8');
const BATTLE_ENGINE_SRC = fs.readFileSync(path.join(ROOT, 'engines/battle-engine.js'), 'utf8');
const engine = require('../engines/battle-engine.js');
let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS os-battle '+name); }
    catch (e) { fail++; console.error('FAIL os-battle '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`OS-BATTLE SUMMARY pass=${pass} fail=${fail}`);
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
    disabled: false, clientWidth: 800, clientHeight: 600, width: 800, height: 600,
    className: '',
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
    getElementById(id){
      if (!ids.has(id)) ids.set(id, makeElement(id.includes('canvas') ? 'canvas' : 'div', id));
      return ids.get(id);
    },
    querySelectorAll(){ return []; },
    addEventListener(){}, removeEventListener(){},
  };
}
function makeMath(randomValues) {
  const math = Object.create(Math);
  let i = 0;
  math.random = () => {
    if (!randomValues.length) return 0;
    const v = randomValues[Math.min(i, randomValues.length - 1)];
    i += 1;
    return v;
  };
  return math;
}
function loadOsContext(randomValues = []) {
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
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0; },
    clearTimeout: () => {},
    Math: makeMath(randomValues),
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
    window: null,
    addEventListener(){}, removeEventListener(){}, postMessage(){},
  };
  win.window = win; win.self = win; win.globalThis = win;
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
function directTurnSeed(battle_id, turn){ return 'sha256:' + sha256Hex(canonical({battle_id, turn})); }
function makeEidolon(id, name, dna, hues){ return { id, name, payload:{dna, hues, name} }; }
function stateDigest(s){
  return {
    hp: s.hp, maxHp: s.maxHp, status: s.status, dodging: s.dodging, accDown: s.accDown,
    atkSt: s.atkSt, defSt: s.defSt, spASt: s.spASt, spDSt: s.spDSt, spdSt: s.spdSt,
    turn: s.turn, moves: s.moves.map(m => m.name), types: s.types
  };
}
async function setupAndTurn(win, pair, battleId, playerMove, enemyRandom) {
  win.Math.random = () => enemyRandom;
  const h = win.__eidolonOsTestHooks;
  h._setBattleForTest(pair.a.dna, pair.a.hues, pair.a.name, 1, pair.b.dna, pair.b.hues, pair.b.name, 1, {battleId});
  await h.executeTurn(playerMove);
  const s = h._getState();
  return {player: stateDigest(s.player), enemy: stateDigest(s.enemy), raw:s};
}
function directOneTurn(pair, battleId, playerMove, enemyMove) {
  const init = engine.initBattle({
    eidolonA: makeEidolon('player', pair.a.name, pair.a.dna, pair.a.hues),
    eidolonB: makeEidolon('enemy', pair.b.name, pair.b.dna, pair.b.hues),
    battleSeed: battleId
  });
  const r = engine.resolveTurn({stateA:init.stateA, stateB:init.stateB, moveA:playerMove, moveB:enemyMove, turnSeed:directTurnSeed(battleId, 1)});
  return {player: stateDigest(r.newStateA), enemy: stateDigest(r.newStateB)};
}

const pairs = [
  {a:{name:'A1', dna:[201,140,200,180,170,120,110,220,130,150,160,190,200,180,210,170], hues:[1,2,3]}, b:{name:'B1', dna:[99,230,190,80,240,210,200,180,220,131,90,199,140,222,135,144], hues:[20,40,60]}},
  {a:{name:'A2', dna:[129,128,200,0,0,0,0,255,0,0,0,0,0,0,0,0], hues:[100,120,140]}, b:{name:'B2', dna:[0,220,0,255,128,64,32,180,1,2,3,4,5,6,7,8], hues:[200,220,240]}},
  {a:{name:'A3', dna:[13,27,41,55,69,83,97,111,125,139,153,167,181,195,209,223], hues:[30,150,270]}, b:{name:'B3', dna:[223,209,195,181,167,153,139,125,111,97,83,69,55,41,27,13], hues:[300,60,180]}},
];

add('OS driven turns match canonical direct for fixed pairs', async () => {
  for (let i=0; i<pairs.length; i++) {
    const battleId = `os-test-${i+1}`;
    const playerMove = i % 4;
    const enemyMove = (i + 1) % 4;
    const enemyRandom = (enemyMove + 0.1) / 4;
    const actual = await setupAndTurn(loadOsContext(), pairs[i], battleId, playerMove, enemyRandom);
    const expected = directOneTurn(pairs[i], battleId, playerMove, enemyMove);
    assert.deepStrictEqual({player:actual.player, enemy:actual.enemy}, expected, `pair ${i+1}`);
  }
});

add('OS battle turn is reproducible for identical fixed enemy picks', async () => {
  const pair = pairs[0];
  const battleId = 'os-repro';
  const oneWin = loadOsContext();
  const twoWin = loadOsContext();
  const one = await setupAndTurn(oneWin, pair, battleId, 2, 0.76);
  const two = await setupAndTurn(twoWin, pair, battleId, 2, 0.76);
  assert.strictEqual(JSON.stringify({player:one.player, enemy:one.enemy}), JSON.stringify({player:two.player, enemy:two.enemy}));
});

add('OS no longer defines duplicate battle math symbols', () => {
  const src = extractInlineScripts(OS_HTML).join('\n');
  const forbidden = [
    /\bfunction\s+computeStats\s*\(/,
    /\bfunction\s+deriveMoves\s*\(/,
    /\bfunction\s+deriveTypes\s*\(/,
    /\bfunction\s+calcDmg\s*\(/,
    /\bfunction\s+statusTick\s*\(/,
    /\bconst\s+BASE_MOVES\s*=/,
    /\bconst\s+TRAIT_MOVES\s*=/,
    /\bconst\s+BEATS\s*=/,
  ];
  for (const re of forbidden) assert(!re.test(src), `forbidden duplicate remains: ${re}`);
  assert(/window\.NexusBattleEngine/.test(src), 'OS does not require canonical battle engine');
});

run();
