#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function ok(name, fn){try{fn();pass++;console.log(`PASS sweep13 ${name}`)}catch(e){fail++;console.error(`FAIL sweep13 ${name} — ${e && e.message ? e.message : e}`)}}
const read = p => fs.readFileSync(path.join(ROOT,p),'utf8');
const exists = p => fs.existsSync(path.join(ROOT,p));

ok('missing console 404 paths now exist', () => {
  ['blocks/world/first-contact.html','blocks/system/welcome.html','blocks/forges/lattice-shell.html','blocks/forges/compose-stage.html','blocks/forges/environment-forge.html'].forEach(p=>assert(exists(p), p));
});
ok('first contact is live companion and world randomizer', () => {
  const html = read('blocks/world/first-contact.html');
  assert(html.includes('SELECTED_COMPANION_KEY'));
  assert(html.includes('SELECTED_ENV_KEY'));
  assert(html.includes("system.environment.selected"));
  assert(html.includes("lattice.imprint"));
  assert(html.includes("requestAnimationFrame(loop)"));
});
ok('environment forge applies selected desktop world', () => {
  const html = read('blocks/forges/environment-forge.html');
  assert(html.includes("nexus:selected-environment:v1"));
  assert(html.includes("system.environment.selected"));
  assert(html.includes('requestAnimationFrame(draw)'));
});
ok('lattice shell imprints selected companion', () => {
  const html = read('blocks/forges/lattice-shell.html');
  assert(html.includes("nexus:selected-companion:v1"));
  assert(html.includes("lattice.imprint"));
  assert(html.includes("lattice.library.changed"));
});
ok('compose stage routes to working legacy battle generator', () => {
  const html = read('blocks/forges/compose-stage.html');
  assert(html.includes('blocks/forges/the-room.html'));
  assert(html.includes('Battle forging starts in The Room'));
});
ok('OS catalog includes repaired active forge routes', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes('blocks/world/first-contact.html'));
  assert(os.includes('blocks/forges/compose-stage.html'));
  assert(os.includes('blocks/forges/lattice-shell.html'));
  assert(os.includes('blocks/forges/environment-forge.html'));
  assert(os.includes('path:"blocks/forges/the-room.html"')); // the-room is The Crucible AI (renamed from battleforge)
});
ok('OS applies selected environment to desktop background', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes('function applyDesktopEnvironment'));
  assert(os.includes("system.environment.selected"));
  assert(os.includes('--desktop-env-top'));
  assert(os.includes('dataset.envName'));
});
ok('launcher and file-browser search shield Delete and Backspace', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes('launcherSearch.addEventListener("keydown"'));
  assert(os.includes('fbSearch.addEventListener("keydown"'));
  assert((os.match(/stopPropagation\(\)/g)||[]).length >= 2);
});
ok('wallet is canonical zero-start NEX and no auto genesis claim runs on boot', () => {
  const wallet = read('blocks/system/Wallet_v4_nexus.html');
  assert(wallet.includes("TOKEN_SYM = 'NEX'"));
  assert(wallet.includes('One NEX Balance'));
  assert(wallet.includes('Zero-start canonical'));
  assert(!wallet.includes('await claimGenesisOutput(GENESIS_OUTPUT);'));
  assert(wallet.includes('not auto-claimed'));
});
ok('wallet developer genesis tool is labeled advanced and non-default', () => {
  const wallet = read('blocks/system/Wallet_v4_nexus.html');
  assert(wallet.includes('Developer Genesis Tool'));
  assert(wallet.includes('value="0"'));
  assert(wallet.includes('Developer: Issue &amp; Claim Local Genesis'));
});
ok('companion links to selected home state and avoids pasted-note expansion', () => {
  const c = read('blocks/apps/companion.html');
  assert(c.includes('SELECTED_ENV_KEY'));
  assert(c.includes('SELECTED_COMPANION_KEY'));
  assert(c.includes('layerFromStored'));
  assert(c.includes('height: 132px'));
  assert(c.includes('bodyEl.addEventListener(\'paste\''));
  assert(c.includes('node-header'));
  assert(c.includes('startNodeDrag(e, node, el)'));
});
ok('companion defaults creature zone to bottom-left for fresh sessions', () => {
  const c = read('blocks/apps/companion.html');
  assert(c.includes('x: 24'));
  assert(c.includes('window.innerHeight - 304'));
});
ok('vibes library text contrast and search delete shielding are present', () => {
  const v = read('blocks/vibes/vibes-library.html');
  assert(v.includes('--ink:#f2eadb'));
  assert(v.includes("$('search').addEventListener('keydown'"));
  assert(v.includes('e.stopPropagation()'));
});
ok('atlas degrades locally when vibe.list is unavailable', () => {
  const a = read('blocks/world/atlas.html');
  assert(a.includes('ATLAS_LOCAL_KEY'));
  assert(a.includes('readLocalWorlds'));
  assert(a.includes('writeLocalWorlds'));
  assert(a.includes("system.environment.selected"));
});
console.log(`SWEEP13 SUMMARY pass=${pass} fail=${fail}`);
if (fail) process.exit(1);
