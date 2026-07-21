#!/usr/bin/env node
/* tests/companion-block-tests.js
   Focused contract tests for blocks/apps/companion.html.
   Companion is imported from an external vanilla HTML app, so these checks
   only assert the Nexus adapter contract: it loads without throwing under the
   harness and declares the expected managed-block event surface. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..');
const COMPANION_PATH = path.join(ROOT, 'blocks/apps/companion.html');
const CLIENT_PATH = path.join(ROOT, 'engines/nexus-block-client.js');
const HTML = fs.readFileSync(COMPANION_PATH, 'utf8');

let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
function record(ok, msg) {
  if (ok) { console.log(`PASS companion ${msg}`); pass++; }
  else    { console.log(`FAIL companion ${msg}`); fail++; }
}
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); record(true, name); }
    catch (e) { record(false, `${name} — ${e && e.stack ? e.stack.split('\n')[0] : e}`); }
  }
  console.log(`COMPANION SUMMARY pass=${pass} fail=${fail}`);
  if (fail > 0) process.exit(1);
}

function makeClassList(){
  const set = new Set();
  return {
    add(...names){ for (const n of names) set.add(n); },
    remove(...names){ for (const n of names) set.delete(n); },
    toggle(name, force){
      const shouldAdd = force === undefined ? !set.has(name) : !!force;
      if (shouldAdd) set.add(name); else set.delete(name);
      return shouldAdd;
    },
    contains(name){ return set.has(name); }
  };
}
function makeElement(tag='div', id='') {
  return {
    tagName: tag.toUpperCase(), id, style:{}, dataset:{}, children:[], childNodes:[],
    textContent:'', innerHTML:'', value:'', checked:false, className:'', title:'', href:'', download:'',
    disabled:false, clientWidth:800, clientHeight:600, width:800, height:600,
    classList: makeClassList(),
    appendChild(c){ this.children.push(c); this.childNodes.push(c); return c; },
    removeChild(c){ this.children = this.children.filter(x => x !== c); this.childNodes = this.childNodes.filter(x => x !== c); return c; },
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; },
    click(){}, focus(){}, blur(){}, select(){},
    closest(){ return null; }, contains(){ return false; },
    querySelector(){ return makeElement(); }, querySelectorAll(){ return []; },
    getContext(){ return new Proxy({}, { get(){ return () => {}; } }); },
    getBoundingClientRect(){ return {left:0, top:0, width:800, height:600, right:800, bottom:600}; },
  };
}
function makeDocument(){
  const ids = new Map();
  const doc = {
    readyState: 'loading',
    body: makeElement('body','body'),
    documentElement: makeElement('html','html'),
    createElement(tag){ return makeElement(tag); },
    createTextNode(text){ return { nodeType:3, textContent:String(text) }; },
    createRange(){ return { selectNodeContents(){} }; },
    getElementById(id){
      if (!ids.has(id)) ids.set(id, makeElement(id.includes('canvas') ? 'canvas' : 'div', id));
      return ids.get(id);
    },
    querySelector(){ return makeElement(); },
    querySelectorAll(){ return []; },
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; },
    execCommand(){ return true; }
  };
  doc.body.ownerDocument = doc;
  return doc;
}
function makeLocalStorage(){
  const store = new Map();
  return {
    getItem(k){ return store.has(String(k)) ? store.get(String(k)) : null; },
    setItem(k, v){ store.set(String(k), String(v)); },
    removeItem(k){ store.delete(String(k)); },
    clear(){ store.clear(); }
  };
}
function makeWindow(){
  const win = {
    console,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    document: makeDocument(),
    navigator: { clipboard: { writeText(){ return Promise.resolve(); } } },
    localStorage: makeLocalStorage(),
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    alert(){}, confirm(){ return true; },
    Blob: class Blob { constructor(parts, opts){ this.parts = parts; this.opts = opts; } },
    URL: { createObjectURL(){ return 'blob:companion-test'; }, revokeObjectURL(){} },
    getComputedStyle(){ return { getPropertyValue(){ return ''; }, backgroundColor:'' }; },
    getSelection(){ return { removeAllRanges(){}, addRange(){} }; },
    Math, Date, JSON, Array, Object, String, Number, Boolean, Error, Promise, Map, Set, WeakMap,
    Uint8Array, ArrayBuffer, RegExp, Symbol, parseInt, parseFloat, isFinite, encodeURIComponent, decodeURIComponent,
    addEventListener(){}, removeEventListener(){}, postMessage(){},
  };
  win.window = win; win.self = win; win.globalThis = win;
  return win;
}
function scriptsInOrder(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    const srcMatch = /\bsrc\s*=\s*(["'])(.*?)\1/i.exec(attrs);
    out.push(srcMatch ? {src: srcMatch[2]} : {code: m[2] || ''});
  }
  return out;
}
function loadCompanionContext(){
  const win = makeWindow();
  const ctx = vm.createContext(win);
  for (const [idx, script] of scriptsInOrder(HTML).entries()) {
    if (script.src) {
      const srcPath = path.resolve(path.dirname(COMPANION_PATH), script.src);
      assert.strictEqual(srcPath, CLIENT_PATH, `unexpected external script ${script.src}`);
      vm.runInContext(fs.readFileSync(srcPath, 'utf8'), ctx, { filename: path.relative(ROOT, srcPath) });
    } else {
      vm.runInContext(script.code, ctx, { filename: `blocks/apps/companion.html#script${idx + 1}` });
    }
  }
  return win;
}
function extractCompanionManifest(){
  const match = HTML.match(/window\.NexusBlockClient\.bootBlock\s*\(\s*\{[\s\S]*?manifest\s*:\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\}\s*\)/);
  assert(match, 'bootBlock manifest not found');
  const body = match[1];
  const emitsMatch = body.match(/emits\s*:\s*\[([^\]]*)\]/);
  assert(emitsMatch, 'manifest emits not found');
  const undoableMatch = body.match(/undoable\s*:\s*\[([^\]]*)\]/);
  assert(undoableMatch, 'manifest undoable not found');
  const strRe = /['"]([^'"]+)['"]/g;
  function strings(src){
    const out = [];
    let m;
    strRe.lastIndex = 0;
    while ((m = strRe.exec(src)) !== null) out.push(m[1]);
    return out;
  }
  return { emits: strings(emitsMatch[1]), undoable: strings(undoableMatch[1]) };
}

add('HTML loads under the block contract harness without throwing', async () => {
  const win = loadCompanionContext();
  assert(win.NexusBlockClient, 'NexusBlockClient missing after external script load');
  assert(win.nx, 'Companion bootstrap did not create window.nx');
});

add('manifest declares exactly companion canvas export and brief copied emits', async () => {
  const manifest = extractCompanionManifest();
  assert.deepStrictEqual(manifest.emits, ['companion.canvas.export', 'companion.brief.copied']);
  assert.deepStrictEqual(manifest.undoable, ['companion.canvas.export']);
});

run();
