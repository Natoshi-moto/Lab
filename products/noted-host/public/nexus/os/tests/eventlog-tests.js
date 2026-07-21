#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { loadNexusContext, keyEvent } = require('./os-chrome-harness.js');
let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS eventlog '+name); }
    catch (e) { fail++; console.error('FAIL eventlog '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`EVENTLOG SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
}

add('simulated kernel EMIT route appends an entry to the ring buffer', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  const sub = h.mountTestSubscriber('verse-test', 'companion.canvas.export');
  h.routeForTest('companion-test', 'companion.canvas.export', { json:'{"nodes":[]}' });
  assert.strictEqual(sub.messages.length, 1, 'subscriber did not receive routed MSG');
  const entries = h.getEventLogEntries();
  assert.strictEqual(entries.length, 1, 'event log entry not appended');
  assert.strictEqual(entries[0].src, 'companion-test');
  assert.strictEqual(entries[0].dst, 'verse-test');
  assert.strictEqual(entries[0].channel, 'companion.canvas.export');
  assert.strictEqual(entries[0].ok, true);
});

add('Cmd-E toggle changes overlay visibility', () => {
  const { win, document } = loadNexusContext();
  const body = document.body;
  document.dispatch('keydown', keyEvent('e', { metaKey:true, target:body }));
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.isEventLogOpen(), true, 'event log did not open');
  assert(document.getElementById('nx-eventlog').classList.contains('open'), 'event log class not open');
  document.dispatch('keydown', keyEvent('e', { metaKey:true, target:body }));
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.isEventLogOpen(), false, 'event log did not close');
});

run();
