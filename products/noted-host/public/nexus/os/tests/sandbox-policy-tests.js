#!/usr/bin/env node
/* tests/sandbox-policy-tests.js
   Regression coverage for browser sandbox affordances and client mount races.
   Fedora/browser smoke surfaced two user-visible issues:
   - managed iframes needed allow-downloads for Companion's canvas export;
   - Verse could emit ready before MOUNT_ACK, causing an EMIT-before-mounted violation. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..');
const OS_HTML = fs.readFileSync(path.join(ROOT, 'Nexus_OS.html'), 'utf8');
const CLIENT_JS = fs.readFileSync(path.join(ROOT, 'engines/nexus-block-client.js'), 'utf8');

let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS sandbox '+name); }
    catch (e) { fail++; console.error('FAIL sandbox '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`SANDBOX SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
}

function makeClientContext(){
  const listeners = {};
  const win = {
    console,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    setTimeout(){ return 0; }, clearTimeout(){},
    Math, Date, JSON, Array, Object, String, Number, Boolean, Error, Promise, Map, Set, WeakMap,
    addEventListener(type, fn){ listeners[type] = fn; },
    removeEventListener(type){ delete listeners[type]; },
    postMessage(){},
  };
  win.window = win; win.self = win; win.globalThis = win;
  const ctx = vm.createContext(win);
  vm.runInContext(CLIENT_JS, ctx, { filename:'engines/nexus-block-client.js' });
  return { win, listeners };
}

function managedSandboxLiteral(){
  const match = OS_HTML.match(/iframe\.sandbox\s*=\s*"([^"]*allow-scripts[^"]*)";\n\s*}\n\s*iframe\.referrerPolicy/);
  assert(match, 'managed sandbox literal not found near referrerPolicy');
  return match[1];
}

add('managed block sandbox allows user-initiated downloads', () => {
  const sandbox = managedSandboxLiteral();
  assert(sandbox.includes('allow-scripts'), 'managed sandbox lost allow-scripts');
  assert(sandbox.includes('allow-same-origin'), 'managed sandbox lost allow-same-origin');
  assert(sandbox.includes('allow-downloads'), 'managed sandbox must allow downloads for Companion exports');
});

add('legacy sandbox still allows downloads', () => {
  const matches = Array.from(OS_HTML.matchAll(/iframe\.sandbox\s*=\s*"([^"]+)";/g)).map(m => m[1]);
  assert(matches.some(s => s.includes('allow-popups') && s.includes('allow-downloads')), 'legacy sandbox download allowance missing');
});

add('NexusBlockClient queues emits until MOUNTED then flushes', () => {
  const { win, listeners } = makeClientContext();
  const api = win.NexusBlockClient.bootBlock({
    manifest: { emits:['alpha.ready'], consumes:['beta.in'] }
  });
  const posted = [];
  const port = {
    postMessage(msg){ posted.push(msg); },
    start(){ posted.push({type:'PORT_STARTED'}); },
    onmessage: null
  };
  assert.strictEqual(api.emit('alpha.ready', { beforeBoot:true }), false, 'emit before BOOT should still be standalone-safe false');
  listeners.message({ data:{ type:'BOOT', blockId:'TEST-BLOCK' }, ports:[port] });
  assert(posted.some(m => m.type === 'DECLARE'), 'DECLARE was not posted on BOOT');
  posted.length = 0;
  assert.strictEqual(api.emit('alpha.ready', { queued:true }), true, 'emit with port before mounted should queue and return true');
  assert(!posted.some(m => m.type === 'EMIT'), 'EMIT leaked before MOUNTED');
  port.onmessage({ data:{ type:'MOUNTED' } });
  const emit = posted.find(m => m.type === 'EMIT' && m.channel === 'alpha.ready');
  assert(emit, 'queued EMIT did not flush after MOUNTED');
  assert.deepStrictEqual(emit.payload, { queued:true });
});

run();
