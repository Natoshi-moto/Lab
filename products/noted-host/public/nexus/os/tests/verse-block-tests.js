#!/usr/bin/env node
/* tests/verse-block-tests.js
   Focused contract tests for blocks/apps/verse-studio.html.
   Verse Studio is a large pre-built React/TS bundle imported as an opaque
   artifact, so these checks only assert the Nexus adapter contract: it loads
   without throwing under the harness and declares the expected managed-block
   event surface. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..');
const VERSE_PATH = path.join(ROOT, 'blocks/apps/verse-studio.html');
const CLIENT_PATH = path.join(ROOT, 'engines/nexus-block-client.js');
const HTML = fs.readFileSync(VERSE_PATH, 'utf8');

let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
function record(ok, msg) {
  if (ok) { console.log(`PASS verse ${msg}`); pass++; }
  else    { console.log(`FAIL verse ${msg}`); fail++; }
}
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); record(true, name); }
    catch (e) { record(false, `${name} — ${e && e.stack ? e.stack.split('\n')[0] : e}`); }
  }
  console.log(`VERSE SUMMARY pass=${pass} fail=${fail}`);
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
  const el = {
    nodeType: 1,
    nodeName: tag.toUpperCase(),
    tagName: tag.toUpperCase(),
    localName: String(tag).toLowerCase(),
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    id,
    style: {},
    dataset: {},
    children: [],
    childNodes: [],
    parentNode: null,
    ownerDocument: null,
    attributes: [],
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,
    className: '',
    title: '',
    href: '',
    download: '',
    rel: '',
    type: '',
    disabled: false,
    clientWidth: 1200,
    clientHeight: 800,
    width: 1200,
    height: 800,
    classList: makeClassList(),
    relList: { supports(){ return true; } },
    appendChild(c){ c.parentNode = this; c.ownerDocument = this.ownerDocument; this.children.push(c); this.childNodes.push(c); return c; },
    insertBefore(c, ref){ c.parentNode = this; c.ownerDocument = this.ownerDocument; const i = this.childNodes.indexOf(ref); if (i >= 0) { this.childNodes.splice(i,0,c); this.children.splice(i,0,c); } else { this.childNodes.push(c); this.children.push(c); } return c; },
    removeChild(c){ this.children = this.children.filter(x => x !== c); this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; return c; },
    replaceChild(c, old){ this.insertBefore(c, old); this.removeChild(old); return old; },
    setAttribute(name, value){ this[name] = String(value); this.attributes.push({name, value:String(value)}); },
    getAttribute(name){ return this[name] || null; },
    removeAttribute(name){ delete this[name]; },
    hasAttribute(name){ return Object.prototype.hasOwnProperty.call(this, name); },
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; },
    click(){}, focus(){}, blur(){}, select(){}, scrollIntoView(){},
    closest(){ return null; }, contains(){ return false; },
    querySelector(){ return makeElement(); }, querySelectorAll(){ return []; },
    getContext(){ return new Proxy({}, { get(){ return () => {}; } }); },
    getBoundingClientRect(){ return {left:0, top:0, width:1200, height:800, right:1200, bottom:800}; },
  };
  return el;
}

function makeDocument(){
  const ids = new Map();
  const doc = {
    nodeType: 9,
    readyState: 'complete',
    compatMode: 'CSS1Compat',
    visibilityState: 'visible',
    location: { href: 'file:///verse-studio.html', hash: '' },
    body: makeElement('body','body'),
    head: makeElement('head','head'),
    documentElement: makeElement('html','html'),
    createElement(tag){ const el = makeElement(tag); el.ownerDocument = doc; return el; },
    createElementNS(ns, tag){ const el = makeElement(tag); el.namespaceURI = ns; el.ownerDocument = doc; return el; },
    createTextNode(text){ return { nodeType:3, nodeName:'#text', textContent:String(text), parentNode:null, ownerDocument:doc }; },
    createComment(text){ return { nodeType:8, nodeName:'#comment', textContent:String(text), parentNode:null, ownerDocument:doc }; },
    createRange(){ return { selectNodeContents(){}, getBoundingClientRect(){ return {left:0, top:0, width:0, height:0}; } }; },
    getElementById(id){
      if (!ids.has(id)) ids.set(id, makeElement('div', id));
      const el = ids.get(id); el.ownerDocument = doc; return el;
    },
    getElementsByTagName(){ return []; },
    querySelector(){ return makeElement(); },
    querySelectorAll(){ return []; },
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; },
    execCommand(){ return true; }
  };
  doc.body.ownerDocument = doc;
  doc.head.ownerDocument = doc;
  doc.documentElement.ownerDocument = doc;
  doc.documentElement.appendChild(doc.head);
  doc.documentElement.appendChild(doc.body);
  return doc;
}

function makeLocalStorage(){
  const store = new Map();
  return {
    getItem(k){ return store.has(String(k)) ? store.get(String(k)) : null; },
    setItem(k, v){ store.set(String(k), String(v)); },
    removeItem(k){ store.delete(String(k)); },
    clear(){ store.clear(); },
    key(i){ return Array.from(store.keys())[i] || null; },
    get length(){ return store.size; }
  };
}

function makeIndexedDB(){
  class IDBRequest {
    constructor(){ this.result = null; this.error = null; this.readyState = 'done'; this.listeners = {}; }
    addEventListener(type, cb){ this.listeners[type] = cb; }
    removeEventListener(type){ delete this.listeners[type]; }
  }
  class IDBDatabase {
    constructor(){ this.objectStoreNames = { contains(){ return true; } }; }
    addEventListener(){}
    close(){}
    transaction(){ return new IDBTransaction(); }
    clear(){}
    getAll(){ return Promise.resolve([]); }
    get(){ return Promise.resolve(undefined); }
    put(){ return Promise.resolve(undefined); }
    delete(){ return Promise.resolve(undefined); }
  }
  class IDBTransaction {
    constructor(){ this.done = Promise.resolve(); this.objectStoreNames = []; this.store = new IDBObjectStore(); }
    addEventListener(){}
    objectStore(){ return new IDBObjectStore(); }
  }
  class IDBObjectStore {
    constructor(){ this.indexNames = { contains(){ return false; } }; }
    add(){ return new IDBRequest(); }
    put(){ return new IDBRequest(); }
    get(){ return new IDBRequest(); }
    getAll(){ const r = new IDBRequest(); r.result = []; return r; }
    delete(){ return new IDBRequest(); }
    clear(){ return new IDBRequest(); }
    index(){ return new IDBIndex(); }
  }
  class IDBIndex extends IDBObjectStore {}
  class IDBCursor { advance(){} continue(){} continuePrimaryKey(){} }
  return {
    classes: { IDBRequest, IDBDatabase, IDBTransaction, IDBObjectStore, IDBIndex, IDBCursor },
    indexedDB: {
      open(){ const req = new IDBRequest(); req.result = new IDBDatabase(); return req; },
      deleteDatabase(){ return new IDBRequest(); }
    }
  };
}

function makeWindow(){
  const doc = makeDocument();
  const idb = makeIndexedDB();
  function NoopObserver(){ this.observe = function(){}; this.disconnect = function(){}; this.unobserve = function(){}; }
  class Event { constructor(type, opts={}){ this.type = type; Object.assign(this, opts); } preventDefault(){ this.defaultPrevented = true; } }
  class CustomEvent extends Event { constructor(type, opts={}){ super(type, opts); this.detail = opts.detail; } }
  class Element {}
  class HTMLElement extends Element {}
  class HTMLIFrameElement extends HTMLElement {}
  class HTMLInputElement extends HTMLElement {}
  class HTMLTextAreaElement extends HTMLElement {}
  const win = {
    console,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    document: doc,
    navigator: { clipboard: { writeText(){ return Promise.resolve(); } }, userAgent: 'nexus-test' },
    localStorage: makeLocalStorage(),
    sessionStorage: makeLocalStorage(),
    indexedDB: idb.indexedDB,
    ...idb.classes,
    DOMException: global.DOMException || class DOMException extends Error {},
    MutationObserver: NoopObserver,
    ResizeObserver: NoopObserver,
    IntersectionObserver: NoopObserver,
    Element, HTMLElement, HTMLIFrameElement, HTMLInputElement, HTMLTextAreaElement,
    Node: { ELEMENT_NODE:1, TEXT_NODE:3, COMMENT_NODE:8, DOCUMENT_NODE:9 },
    Event, CustomEvent,
    location: { href: 'file:///verse-studio.html', origin: 'file://', pathname: '/verse-studio.html', search: '', hash: '' },
    history: { pushState(){}, replaceState(){}, state:null, scrollRestoration:'auto' },
    performance: { now: () => 0 },
    requestAnimationFrame: cb => 0,
    cancelAnimationFrame: () => {},
    requestIdleCallback: cb => 0,
    cancelIdleCallback: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    alert(){}, confirm(){ return true; }, prompt(){ return ''; },
    Blob: class Blob { constructor(parts, opts){ this.parts = parts; this.opts = opts; } },
    File: class File {},
    URL: class URL { constructor(value){ this.href = String(value); this.origin = 'file://'; this.pathname = '/verse-studio.html'; this.search = ''; this.hash = ''; } static createObjectURL(){ return 'blob:verse-test'; } static revokeObjectURL(){} },
    fetch(){ return Promise.resolve({ ok:true, text:()=>Promise.resolve(''), json:()=>Promise.resolve({}) }); },
    getComputedStyle(){ return { getPropertyValue(){ return ''; }, backgroundColor:'' }; },
    getSelection(){ return { removeAllRanges(){}, addRange(){} }; },
    matchMedia(){ return { matches:false, media:'', addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} }; },
    CSS: { supports(){ return false; } },
    Math, Date, JSON, Array, Object, String, Number, Boolean, Error, TypeError, Promise, Map, Set, WeakMap, WeakSet,
    Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, ArrayBuffer, DataView,
    RegExp, Symbol, parseInt, parseFloat, isFinite, isNaN, encodeURIComponent, decodeURIComponent,
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; }, postMessage(){},
  };
  win.window = win; win.self = win; win.globalThis = win; win.parent = win; win.top = win;
  doc.defaultView = win;
  return win;
}

function scriptsInOrder(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    const srcMatch = /\bsrc\s*=\s*(["'])(.*?)\1/i.exec(attrs);
    out.push(srcMatch ? {src: srcMatch[2], attrs} : {code: m[2] || '', attrs});
  }
  return out;
}

function loadVerseContext(){
  const win = makeWindow();
  const ctx = vm.createContext(win);
  for (const [idx, script] of scriptsInOrder(HTML).entries()) {
    if (script.src) {
      const srcPath = path.resolve(path.dirname(VERSE_PATH), script.src);
      assert.strictEqual(srcPath, CLIENT_PATH, `unexpected external script ${script.src}`);
      vm.runInContext(fs.readFileSync(srcPath, 'utf8'), ctx, { filename: path.relative(ROOT, srcPath) });
    } else {
      vm.runInContext(script.code, ctx, { filename: `blocks/apps/verse-studio.html#script${idx + 1}` });
    }
  }
  return win;
}

function extractVerseManifest(){
  const bootIdx = HTML.indexOf('window.NexusBlockClient.bootBlock');
  assert(bootIdx >= 0, 'bootBlock call not found');
  const moduleIdx = HTML.indexOf('<script type="module"', bootIdx);
  assert(moduleIdx > bootIdx, 'Verse module script not found after bootstrap');
  const bootstrap = HTML.slice(bootIdx, moduleIdx);
  const emitsMatch = bootstrap.match(/emits\s*:\s*\[([^\]]*)\]/);
  assert(emitsMatch, 'manifest emits not found');
  const consumesMatch = bootstrap.match(/consumes\s*:\s*\[([^\]]*)\]/);
  assert(consumesMatch, 'manifest consumes not found');
  const emits = [];
  const consumes = [];
  const strRe = /['"]([^'"]+)['"]/g;
  let m;
  while ((m = strRe.exec(emitsMatch[1])) !== null) emits.push(m[1]);
  while ((m = strRe.exec(consumesMatch[1])) !== null) consumes.push(m[1]);
  return { emits, consumes };
}

add('HTML loads under the block contract harness without throwing', async () => {
  const win = loadVerseContext();
  assert(win.NexusBlockClient, 'NexusBlockClient missing after external script load');
  assert(win.nx, 'Verse bootstrap did not create window.nx');
});

add('manifest declares verse ready state snapshot canvas imported emits and companion consume', async () => {
  const manifest = extractVerseManifest();
  assert.deepStrictEqual(manifest.emits, ['verse.ready', 'verse.state.snapshot', 'verse.canvas.imported']);
  assert.deepStrictEqual(manifest.consumes, ['companion.canvas.export', 'companion.canvas.export.undo']);
});

run();
