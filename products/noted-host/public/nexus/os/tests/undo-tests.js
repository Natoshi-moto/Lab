#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');
const { ROOT, loadNexusContext } = require('./os-chrome-harness.js');

let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS undo '+name); }
    catch (e) { fail++; console.error('FAIL undo '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`UNDO SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
}

function makeClientContext(){
  const win = {
    console,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    document: { addEventListener(){}, removeEventListener(){} },
    setTimeout(){ return 0; }, clearTimeout(){},
    Math, Date, JSON, Array, Object, String, Number, Boolean, Error, Promise, Map, Set, WeakMap,
    addEventListener(){}, removeEventListener(){}, postMessage(){},
  };
  win.window = win; win.self = win; win.globalThis = win;
  const ctx = vm.createContext(win);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'engines/nexus-block-client.js'), 'utf8'), ctx, { filename:'engines/nexus-block-client.js' });
  return win;
}

add('normalizeManifest accepts undoable and rejects channels not in emits', () => {
  const win = makeClientContext();
  assert.doesNotThrow(() => win.NexusBlockClient.bootBlock({ manifest:{ emits:['alpha.event'], consumes:[], undoable:['alpha.event'] } }));
  assert.throws(
    () => win.NexusBlockClient.bootBlock({ manifest:{ emits:['alpha.event'], consumes:[], undoable:['beta.event'] } }),
    /undoable channel must also be emitted/
  );
});

add('handleDeclare records UNDOABLE_CHANNELS', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  h.declareManagedBlockForTest('companion-declare-test', {
    emits:['companion.canvas.export'],
    consumes:[],
    undoable:['companion.canvas.export']
  });
  assert.deepStrictEqual(h.getUndoableChannels('companion-declare-test'), ['companion.canvas.export']);
});

add('eventlog entry from undoable emit carries undoable true', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  h.declareUndoableForTest('companion-test', ['companion.canvas.export']);
  h.mountTestSubscriber('verse-test', 'companion.canvas.export');
  h.routeForTest('companion-test', 'companion.canvas.export', { json:'{}', _reqId:'req-u1' });
  const entries = h.getEventLogEntries();
  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].ok, true);
  assert.strictEqual(entries[0].undoable, true);
});

add('triggering undo button emits correlated .undo envelope', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  h.declareUndoableForTest('companion-test', ['companion.canvas.export']);
  h.mountTestSubscriber('verse-test', 'companion.canvas.export');
  const undoSub = h.mountTestSubscriber('verse-undo-test', 'companion.canvas.export.undo');
  h.routeForTest('companion-test', 'companion.canvas.export', { json:'{}', _reqId:'req-u2' });
  const entry = h.getEventLogEntries()[0];
  h.emitUndoForEvent(entry);
  assert.strictEqual(undoSub.messages.length, 1, 'undo subscriber did not receive envelope');
  const msg = undoSub.messages[0];
  assert.strictEqual(msg.type, 'MSG');
  assert.strictEqual(msg.src, '_kernel');
  assert.strictEqual(msg.channel, 'companion.canvas.export.undo');
  assert.strictEqual(msg.payload._reqId, 'req-u2');
  assert.strictEqual(typeof msg.payload.originalTs, 'number');
  assert.strictEqual(typeof msg.payload.ts, 'number');
});

run();
