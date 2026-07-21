#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function ok(name, fn){try{fn();pass++;console.log(`PASS sweep14 ${name}`)}catch(e){fail++;console.error(`FAIL sweep14 ${name} — ${e && e.message ? e.message : e}`)}}
const read = p => fs.readFileSync(path.join(ROOT,p),'utf8');

ok('first contact writes Library envelopes and Atlas fallback mirrors', () => {
  const html = read('blocks/world/first-contact.html');
  assert(html.includes("vibe.save"));
  assert(html.includes("vibe.result"));
  assert(html.includes("buildEnvelope('creature/eidolon-1'"));
  assert(html.includes("buildEnvelope('world'"));
  assert(html.includes("ATLAS_LOCAL_KEY='atlas:worlds:fallback:v1'"));
  assert(html.includes('mirrorAtlasWorld(worldEnv)'));
});

ok('first contact gives user lockable reroll control', () => {
  const html = read('blocks/world/first-contact.html');
  assert(html.includes('lock-companion'));
  assert(html.includes('lock-world'));
  assert(html.includes('randomize unlocked'));
  assert(html.includes('companionLocked'));
  assert(html.includes('worldLocked'));
});

ok('first contact canonical zero-start copy remains explicit', () => {
  const html = read('blocks/world/first-contact.html');
  assert(html.includes('Wallet balance starts at 0 NEX'));
  assert(html.includes('No NEX is granted'));
});

ok('environment forge writes Vibes Library and Atlas fallback', () => {
  const html = read('blocks/forges/environment-forge.html');
  assert(html.includes('vibe.save'));
  assert(html.includes('ATLAS_LOCAL_KEY'));
  assert(html.includes('mirrorAtlas(e)'));
  assert(html.includes('saveLibrary(e)'));
  assert(html.includes('system.environment.selected'));
});

ok('environment forge exposes human presets for control', () => {
  const html = read('blocks/forges/environment-forge.html');
  assert(html.includes('PRESETS'));
  assert(html.includes('Amber Steppe'));
  assert(html.includes('Glass Reef'));
  assert(html.includes('Moss Canopy'));
});

ok('compose stage is a guided ingredient flow', () => {
  const html = read('blocks/forges/compose-stage.html');
  assert(html.includes('Make the ingredients, then enter The Room'));
  assert(html.includes('companion-status'));
  assert(html.includes('world-status'));
  assert(html.includes('Open The Room'));
  assert(html.includes('setInterval(refresh'));
});

ok('OS desktop home notes bridge exists and launches Companion', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes('nx-home-notes'));
  assert(os.includes('HOME_NOTE_INBOX_KEY'));
  assert(os.includes('nexus:home-note-inbox:v1'));
  assert(os.includes('initHomeNotesBridge'));
  assert(os.includes('Companion will import it as a movable note'));
});

ok('OS has global Delete Backspace shield for focused text inputs', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes("document.addEventListener('keydown'"));
  assert(os.includes("e.key === 'Delete' || e.key === 'Backspace'"));
  assert(os.includes("matches?.('input, textarea"));
});

ok('Companion imports desktop home-note inbox as movable note', () => {
  const c = read('blocks/apps/companion.html');
  assert(c.includes('HOME_NOTE_INBOX_KEY'));
  assert(c.includes('importHomeNoteInbox'));
  assert(c.includes('Imported from desktop home notes'));
  assert(c.includes('localStorage.removeItem(HOME_NOTE_INBOX_KEY)'));
});

ok('Wallet is one-wallet NEX UX instead of ATT/default ambiguity', () => {
  const w = read('blocks/system/Wallet_v4_nexus.html');
  assert(w.includes('Wallet v4 · One NEX Balance'));
  assert(w.includes('one wallet · v4'));
  assert(w.includes('id="sym-top">NEX</span>'));
  assert(w.includes('ONE WALLET · BITCOIN-STYLE OUTPUTS'));
});

ok('Wallet proof outputs are clarified as advanced UTXO machinery', () => {
  const w = read('blocks/system/Wallet_v4_nexus.html');
  assert(w.includes('Proof Outputs <span class="badge b-new">BITCOIN-STYLE UTXO · ADVANCED</span>'));
  assert(w.includes('outputs are the proof machinery behind one visible NEX balance'));
  assert(w.includes('Spendable Outputs'));
  assert(w.includes('Locked Proof Outputs'));
  assert(w.includes('Spent Source IDs'));
});

ok('Wallet send panel duplicate button row was removed', () => {
  const w = read('blocks/system/Wallet_v4_nexus.html');
  const dup = '      <div class="btn-row" style="margin-top:8px">\n      <div class="btn-row" style="margin-top:8px">';
  assert(!w.includes(dup));
});

ok('Files app also shields text Delete Backspace propagation', () => {
  const f = read('blocks/apps/app-files.html');
  assert(f.includes('document.addEventListener("keydown"'));
  assert(f.includes('e.key === "Delete" || e.key === "Backspace"'));
  assert(f.includes('e.stopPropagation()'));
});

console.log(`SWEEP14 SUMMARY pass=${pass} fail=${fail}`);
if (fail) process.exit(1);
