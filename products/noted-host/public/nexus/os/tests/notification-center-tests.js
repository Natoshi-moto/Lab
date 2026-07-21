#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { loadNexusContext } = require('./os-chrome-harness.js');
let pass = 0;
let fail = 0;

function log(ok, name, detail='') {
  if (ok) { pass++; console.log(`PASS notifications ${name}`); }
  else { fail++; console.error(`FAIL notifications ${name}${detail ? ' — ' + detail : ''}`); }
}
function test(name, fn) {
  try { fn(); log(true, name); }
  catch (e) { log(false, name, e && e.stack ? e.stack.split('\n')[0] : String(e)); }
}

test('storage key is scoped by kernel secret prefix', () => {
  const { win } = loadNexusContext();
  const key = win.__NEXUS_CHROME_TEST_HOOKS.getNotificationStorageKeyForTest();
  assert(/^nx-notifications-[a-f0-9-]+$/.test(key), `bad key: ${key}`);
});

test('balance_changed emits reward notification and updates NEX chip', () => {
  const { win, document } = loadNexusContext();
  const ok = win.__NEXUS_CHROME_TEST_HOOKS.consumeNotificationForTest('economy.notify.balance_changed', { balance: 1250, delta: 250 }, 'wallet');
  assert.strictEqual(ok, true);
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.getNotificationUnreadForTest(), 1);
  const history = win.__NEXUS_CHROME_TEST_HOOKS.getNotificationHistoryForTest();
  assert.strictEqual(history[0].className, 'reward');
  assert(/\+250 NEX/.test(history[0].title));
  assert.strictEqual(document.getElementById('nx-nex-chip').textContent, 'NEX 1,250');
});

test('pending publish persists until succeeded transition resolves it', () => {
  const { win } = loadNexusContext();
  win.__NEXUS_CHROME_TEST_HOOKS.consumeNotificationForTest('economy.notify.publish_pending', { pendingId:'p1', kind:'mint' }, 'wallet');
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.getNotificationPendingCountForTest(), 1);
  win.__NEXUS_CHROME_TEST_HOOKS.consumeNotificationForTest('economy.notify.publish_succeeded_after_retry', { pendingId:'p1', kind:'mint' }, 'wallet');
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.getNotificationPendingCountForTest(), 0);
  const history = win.__NEXUS_CHROME_TEST_HOOKS.getNotificationHistoryForTest();
  assert(history.some(n => n.className === 'commit' && /confirmed/i.test(n.title)));
});

test('shell-consumed event does not create a dead letter when no block subscribes', () => {
  const { win } = loadNexusContext();
  win.__NEXUS_CHROME_TEST_HOOKS.routeForTest('wallet', 'economy.notify.epoch_closed', { epoch: 47, distributed: 4332 });
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.getDeadLetters().length, 0);
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.getNotificationHistoryForTest()[0].className, 'info');
});

test('notifications clear command empties history', () => {
  const { win } = loadNexusContext();
  win.__NEXUS_CHROME_TEST_HOOKS.notifyForTest({ className:'info', title:'Test', body:'body' });
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.getNotificationHistoryForTest().length, 1);
  win.__NEXUS_CHROME_TEST_HOOKS.executePaletteCommand('notifications clear');
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.getNotificationHistoryForTest().length, 0);
});

console.log(`NOTIFICATIONS SUMMARY pass=${pass} fail=${fail}`);
if (fail) process.exit(1);
