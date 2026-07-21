#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { loadNexusContext } = require('./os-chrome-harness.js');
let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS system-health '+name); }
    catch (e) { fail++; console.error('FAIL system-health '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`SYSTEM-HEALTH SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
}

add('system.health payload structure matches schema after simulated interval tick', () => {
  const { win, intervals } = loadNexusContext();
  const healthTimer = intervals.find(x => x.ms === 5000 && String(x.fn).includes('publishSystemHealth'));
  assert(healthTimer, '5s system health interval not registered');
  healthTimer.fn();
  const payload = win.__NEXUS_CHROME_TEST_HOOKS.buildSystemHealthPayload();
  assert.strictEqual(typeof payload.uptime, 'number');
  assert.strictEqual(typeof payload.queueDepth, 'number');
  assert.strictEqual(typeof payload.blockCount, 'number');
  assert.strictEqual(typeof payload.persisted, 'boolean');
  assert.strictEqual(typeof payload.ts, 'number');
});

add('subscribed test client receives at least one system.health tick', () => {
  const { win, intervals } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  const sub = h.mountTestSubscriber('health-test', 'system.health');
  const healthTimer = intervals.find(x => x.ms === 5000 && String(x.fn).includes('publishSystemHealth'));
  assert(healthTimer, '5s system health interval not registered');
  healthTimer.fn();
  assert(sub.messages.length >= 1, 'subscriber did not receive system.health');
  const msg = sub.messages[0];
  assert.strictEqual(msg.type, 'MSG');
  assert.strictEqual(msg.src, '_kernel');
  assert.strictEqual(msg.channel, 'system.health');
  assert.strictEqual(typeof msg.payload.uptime, 'number');
  assert.strictEqual(typeof msg.payload.persisted, 'boolean');
});

run();
