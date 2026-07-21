#!/usr/bin/env node
/* tests/subscription-burst-tests.js
   Regression coverage for large service blocks like Vibes Library.
   They may declare many consume channels and subscribe to them in one
   startup burst. Valid declared SUBs should not be mistaken for spam. */
'use strict';

const assert = require('assert');
const { loadNexusContext } = require('./os-chrome-harness.js');

let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS sub-burst '+name); }
    catch (e) { fail++; console.error('FAIL sub-burst '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`SUB-BURST SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
}

function makeChannels(n){
  return Array.from({length:n}, (_, i) => `svc.channel.${i}`);
}

add('valid declared SUB startup burst does not cause violations', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  const consumes = makeChannels(24);
  const { block } = h.declareManagedBlockForTest('BIG-SERVICE', { emits:['svc.ready'], consumes });
  assert.strictEqual(block.state, 'DECLARED');
  for (const channel of consumes) h.processBlockMessageForTest('BIG-SERVICE', { type:'SUB', channel });
  assert.strictEqual(block.metrics.violations, 0, 'declared SUB burst should not count as violations');
  assert.strictEqual(block.desiredSubscriptions.size, consumes.length);
});

add('undeclared SUB still records a protocol violation', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  const { block } = h.declareManagedBlockForTest('BAD-SERVICE', { emits:['svc.ready'], consumes:['svc.allowed'] });
  h.processBlockMessageForTest('BAD-SERVICE', { type:'SUB', channel:'svc.not_declared' });
  assert.strictEqual(block.metrics.violations, 1);
});

add('declared SUBs still respect the max subscription cap', () => {
  const { win } = loadNexusContext();
  const h = win.__NEXUS_CHROME_TEST_HOOKS;
  const consumes = makeChannels(49); // SETTINGS.maxSubscriptionsPerBlock is 48
  const { block } = h.declareManagedBlockForTest('CAP-SERVICE', { emits:['svc.ready'], consumes });
  // Manifest itself caps at 48, so this block should have been evicted on bad DECLARE.
  assert.strictEqual(block.state, 'EVICTED');
});

run();
