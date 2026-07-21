#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadNexusContext } = require('./os-chrome-harness.js');

let pass = 0;
let fail = 0;
function log(ok, name, detail = '') {
  if (ok) { pass++; console.log(`PASS player-thread ${name}`); }
  else { fail++; console.error(`FAIL player-thread ${name}${detail ? ' — ' + detail : ''}`); }
}
function test(name, fn) {
  try { fn(); log(true, name); }
  catch (e) { log(false, name, e && e.stack ? e.stack.split('\n')[0] : String(e)); }
}

function resolveWith(milestones = {}, runtime = {}) {
  const { win } = loadNexusContext();
  const state = {
    version: 1,
    milestones: Object.assign({
      welcomeSeen:false, firstContactStarted:false, mootImprinted:false, environmentSelected:true,
      desktopReached:true, libraryOpened:false, atlasOpened:false, walkerOpened:false,
      walletOpened:false, witnessOpened:false, firstNotificationSeen:false, firstNotificationActionClicked:false, companionMet:false, homeNoteSent:false, multiforgeOpened:false, battleforgeOpened:false
    }, milestones),
    dismissals: {},
    history: []
  };
  return win.__NEXUS_CHROME_TEST_HOOKS.resolvePlayerThreadForTest(state, Object.assign({
    hasMoot:false, balance:0, pendingCount:0, unreadImportantCount:0,
    hasOpenWindows:false, notificationDrawerOpen:false
  }, runtime));
}

test('storage key is scoped by kernel secret prefix', () => {
  const { win } = loadNexusContext();
  const key = win.__NEXUS_CHROME_TEST_HOOKS.getPlayerThreadStorageKeyForTest();
  assert(/^nx-player-thread-[a-f0-9-]+$/.test(key), `bad key: ${key}`);
});

test('default taskbar chip renders current thread metadata', () => {
  const { document } = loadNexusContext();
  const chip = document.getElementById('nx-thread-chip');
  assert.strictEqual(chip.dataset.threadId, 'begin-first-contact');
  assert.strictEqual(chip.getAttribute('aria-label'), 'Current thread: Begin First Contact');
});

test('no moot resolves to begin first contact', () => {
  assert.strictEqual(resolveWith({}, { hasMoot:false }).id, 'begin-first-contact');
});

test('moot imprinted resolves to meet companion before library opens', () => {
  assert.strictEqual(resolveWith({ mootImprinted:true }, { hasMoot:true }).id, 'meet-your-companion');
});

test('library opened resolves to Multiforge before atlas or walker opens', () => {
  assert.strictEqual(resolveWith({ mootImprinted:true, companionMet:true, homeNoteSent:true, libraryOpened:true }, { hasMoot:true }).id, 'try-multiforge');
});

test('wallet opened with zero balance resolves to witness guidance after first-hour steps', () => {
  assert.strictEqual(resolveWith({ mootImprinted:true, companionMet:true, homeNoteSent:true, libraryOpened:true, multiforgeOpened:true, atlasOpened:true, walletOpened:true }, { hasMoot:true, balance:0 }).id, 'witness-to-earn');
});

test('pending publish overrides ordinary guidance', () => {
  assert.strictEqual(resolveWith({ mootImprinted:true, libraryOpened:true }, { hasMoot:true, pendingCount:2 }).id, 'await-confirmation');
});

test('unread notification overrides normal guidance but not pending', () => {
  assert.strictEqual(resolveWith({ mootImprinted:true, libraryOpened:true }, { hasMoot:true, unreadImportantCount:1 }).id, 'review-realm-activity');
  assert.strictEqual(resolveWith({ mootImprinted:true, libraryOpened:true }, { hasMoot:true, unreadImportantCount:1, pendingCount:1 }).id, 'await-confirmation');
});

test('completed early path resolves to explore freely after Battleforge is seen', () => {
  const t = resolveWith({ mootImprinted:true, companionMet:true, homeNoteSent:true, libraryOpened:true, multiforgeOpened:true, atlasOpened:true, walletOpened:true, witnessOpened:true, battleforgeOpened:true }, { hasMoot:true, balance:10 });
  assert.strictEqual(t.id, 'explore-freely');
});

test('lattice imprint records milestone without dead letter', () => {
  const { win } = loadNexusContext();
  win.__NEXUS_CHROME_TEST_HOOKS.routeForTest('library', 'lattice.imprint', { id:'moot-1' });
  const state = win.__NEXUS_CHROME_TEST_HOOKS.getPlayerThreadStateForTest();
  assert.strictEqual(state.milestones.mootImprinted, true);
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.getDeadLetters().length, 0);
});

test('history is bounded to forty entries', () => {
  const { win } = loadNexusContext();
  for (let i = 0; i < 45; i++) win.__NEXUS_CHROME_TEST_HOOKS.recordPlayerThreadForTest(`event-${i}`, { i });
  const state = win.__NEXUS_CHROME_TEST_HOOKS.getPlayerThreadStateForTest();
  assert.strictEqual(state.history.length, 40);
  assert.strictEqual(state.history[0].id, 'event-5');
});

test('palette exposes next and what now commands', () => {
  const os = fs.readFileSync(path.join(__dirname, '..', 'Nexus_OS.html'), 'utf8');
  assert(os.includes("name:'next'"), 'next command missing');
  assert(os.includes("name:'what now'"), 'what now command missing');
  assert(os.includes("name:'current thread'"), 'current thread command missing');
});

test('target routing keeps first-contact active when its repaired block exists', () => {
  const { win } = loadNexusContext();
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.choosePlayerThreadTargetForTest('first-contact'), 'first-contact');
});

test('wallet and genesis polish classes are present', () => {
  const wallet = fs.readFileSync(path.join(__dirname, '..', 'blocks/system/Wallet_v4_nexus.html'), 'utf8');
  assert(wallet.includes('wallet-thread-card'), 'wallet thread card missing');
  assert(wallet.includes('genesis-ritual'), 'genesis ritual card missing');
  assert(wallet.includes('Every balance needs an origin.'), 'genesis copy missing');
});

test('standalone genesis verifier has trust-grid polish', () => {
  const genesis = fs.readFileSync(path.join(__dirname, '..', 'blocks/system/nexus-genesis-verifier.html'), 'utf8');
  assert(genesis.includes('trust-grid'), 'trust grid missing');
  assert(genesis.includes('verifier-input-card'), 'verifier input card missing');
});

console.log(`PLAYER-THREAD SUMMARY pass=${pass} fail=${fail}`);
if (fail) process.exit(1);
