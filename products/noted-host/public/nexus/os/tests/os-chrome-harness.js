'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto, randomUUID } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..');
const OS_HTML = fs.readFileSync(path.join(ROOT, 'Nexus_OS.html'), 'utf8');

function extractInlineScripts(html) {
  const out = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) if (!/\bsrc\s*=/.test(m[1])) out.push(m[2]);
  return out;
}

class ClassList {
  constructor(el){ this.el = el; this.set = new Set(); }
  _sync(){ this.el.className = Array.from(this.set).join(' '); }
  add(...names){ for (const n of names) if (n) this.set.add(String(n)); this._sync(); }
  remove(...names){ for (const n of names) this.set.delete(String(n)); this._sync(); }
  toggle(name, force){
    if (force === true) { this.set.add(String(name)); this._sync(); return true; }
    if (force === false) { this.set.delete(String(name)); this._sync(); return false; }
    if (this.set.has(String(name))) { this.set.delete(String(name)); this._sync(); return false; }
    this.set.add(String(name)); this._sync(); return true;
  }
  contains(name){ return this.set.has(String(name)); }
}

function makeElement(tag='div', id='') {
  const listeners = {};
  const el = {
    tagName: tag.toUpperCase(), id, style:{}, children:[], childNodes:[], dataset:{}, attributes:{},
    _text:'', innerHTML:'', onclick:null, disabled:false, className:'', value:'', scrollTop:0, scrollHeight:0,
    clientWidth:800, clientHeight:600, offsetLeft:0, offsetTop:0, offsetWidth:800, offsetHeight:600,
    width:800, height:600, parentNode:null,
    classList:null,
    set textContent(v){ this._text = String(v); if (v === '') { this.children = []; this.childNodes = []; } },
    get textContent(){ return this._text + this.children.map(c => c.textContent || '').join(''); },
    appendChild(c){ c.parentNode = this; this.children.push(c); this.childNodes.push(c); this.scrollHeight = this.children.length * 16; return c; },
    append(...nodes){ for (const n of nodes) this.appendChild(typeof n === 'string' ? makeText(n) : n); },
    remove(){ if (this.parentNode) { this.parentNode.children = this.parentNode.children.filter(c => c !== this); this.parentNode.childNodes = this.parentNode.childNodes.filter(c => c !== this); } },
    addEventListener(type, fn){ if (!listeners[type]) listeners[type] = []; listeners[type].push(fn); },
    removeEventListener(type, fn){ if (listeners[type]) listeners[type] = listeners[type].filter(x => x !== fn); },
    dispatchEvent(evt){ for (const fn of listeners[evt.type] || []) fn(evt); },
    setAttribute(k,v){ this.attributes[k] = String(v); },
    getAttribute(k){ return this.attributes[k]; },
    focus(){ this.focused = true; },
    scrollIntoView(){},
    querySelector(){ return makeElement(); },
    querySelectorAll(){ return []; },
    getContext(){ return new Proxy({}, { get(){ return () => {}; } }); },
    getBoundingClientRect(){ return {left:0, top:0, width:800, height:600}; },
  };
  el.classList = new ClassList(el);
  return el;
}
function makeText(txt){ const el = makeElement('#text'); el.textContent = txt; return el; }

function makeDocument() {
  const ids = new Map();
  const listeners = {};
  const body = makeElement('body', 'body');
  function byId(id) {
    if (!ids.has(id)) {
      const tag = id.includes('input') || id.endsWith('search') || id === 'nx-palette-input' ? 'input'
        : id.includes('canvas') ? 'canvas' : 'div';
      ids.set(id, makeElement(tag, id));
    }
    return ids.get(id);
  }
  return {
    body,
    createElement: tag => makeElement(tag),
    getElementById: byId,
    querySelectorAll(){ return []; },
    querySelector(){ return makeElement(); },
    addEventListener(type, fn){ if (!listeners[type]) listeners[type] = []; listeners[type].push(fn); },
    removeEventListener(type, fn){ if (listeners[type]) listeners[type] = listeners[type].filter(x => x !== fn); },
    dispatch(type, evt){ for (const fn of listeners[type] || []) fn(evt); },
    _ids: ids,
    _listeners: listeners,
  };
}

function keyEvent(key, opts = {}) {
  return {
    type:'keydown', key, ctrlKey:!!opts.ctrlKey, metaKey:!!opts.metaKey,
    target: opts.target || makeElement('body'),
    defaultPrevented:false,
    preventDefault(){ this.defaultPrevented = true; },
    stopPropagation(){},
  };
}

function loadNexusContext() {
  const storage = new Map();
  const intervals = [];
  const document = makeDocument();
  const cryptoObj = {
    randomUUID,
    subtle: webcrypto.subtle,
    getRandomValues: arr => webcrypto.getRandomValues(arr)
  };
  const win = {
    console,
    crypto: cryptoObj,
    TextEncoder,
    TextDecoder,
    document,
    navigator: { storage: { persist: async () => true } },
    location: { protocol:'http:', href:'http://localhost/Nexus_OS.html', origin:'http://localhost' },
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setInterval: (fn, ms) => { intervals.push({fn, ms}); return intervals.length; },
    clearInterval: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    localStorage: { getItem:k => storage.has(k) ? storage.get(k) : null, setItem:(k,v) => storage.set(k, String(v)), removeItem:k => storage.delete(k) },
    URL,
    Math, Date, JSON, Array, Object, String, Number, Boolean, Error, Promise, Map, Set, WeakMap, WeakSet, Uint8Array, ArrayBuffer,
    addEventListener(){}, removeEventListener(){}, postMessage(){},
    MessageChannel: class { constructor(){ this.port1 = { onmessage:null, postMessage(){}, close(){}, start(){} }; this.port2 = { onmessage:null, postMessage(){}, close(){}, start(){} }; } },
  };
  win.window = win; win.self = win; win.globalThis = win;
  const ctx = vm.createContext(win);
  for (const [i, raw] of extractInlineScripts(OS_HTML).entries()) {
    vm.runInContext(raw, ctx, { filename: `Nexus_OS.html#script${i}` });
  }
  assert(win.__NEXUS_CHROME_TEST_HOOKS, 'Nexus chrome test hooks missing');
  return { win, document, intervals, keyEvent };
}

module.exports = { ROOT, OS_HTML, loadNexusContext, keyEvent };
