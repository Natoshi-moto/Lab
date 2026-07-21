#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { loadNexusContext } = require('./os-chrome-harness.js');

let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS deadletter '+name); }
    catch (e) { fail++; console.error('FAIL deadletter '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`DEADLETTER SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
}

add('EMIT with no subscriber appends to DEAD_LETTERS and eventlog ok false', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  h.routeForTest('lonely-block', 'ghost.channel', { n:1 });
  const dead = h.getDeadLetters();
  assert.strictEqual(dead.length, 1);
  assert.strictEqual(dead[0].srcId, 'lonely-block');
  assert.strictEqual(dead[0].channel, 'ghost.channel');
  assert.strictEqual(dead[0].reason, 'no_subscribers');
  const entries = h.getEventLogEntries();
  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].ok, false);
  assert.strictEqual(entries[0].channel, 'ghost.channel');
});

add('requeue retries deliverMessage and recaptures only if still unsubscribed', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  h.routeForTest('sender-a', 'retry.channel', { ok:1 });
  let dead = h.getDeadLetters();
  assert.strictEqual(dead.length, 1);
  const sub = h.mountTestSubscriber('receiver-a', 'retry.channel');
  h.requeueDeadLetter(dead[0]);
  assert.strictEqual(sub.messages.length, 1, 'requeue did not deliver after subscriber mounted');
  assert.strictEqual(h.getDeadLetters().length, 0, 'delivered requeue should remove dead letter');

  h.routeForTest('sender-b', 'still.dead', { ok:2 });
  dead = h.getDeadLetters();
  assert.strictEqual(dead.length, 1);
  h.requeueDeadLetter(dead[0]);
  const recaptured = h.getDeadLetters();
  assert.strictEqual(recaptured.length, 1, 'unsubscribed requeue should recapture');
  assert.strictEqual(recaptured[0].channel, 'still.dead');
});

add('discard removes entry from DEAD_LETTERS', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  h.routeForTest('sender-c', 'discard.channel', { ok:3 });
  const entry = h.getDeadLetters()[0];
  h.discardDeadLetter(entry);
  assert.strictEqual(h.getDeadLetters().length, 0);
});

run();
