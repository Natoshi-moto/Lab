#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
let pass=0, fail=0;
function ok(name, fn){try{fn();pass++;console.log(`PASS sweep16 ${name}`)}catch(e){fail++;console.error(`FAIL sweep16 ${name} — ${e.message||e}`)}}

ok('active Multiforge block exists and uses shared Eidolon renderers', () => {
  const h = read('blocks/forges/multiforge.html');
  assert(h.includes('meta name="nexus-block" content="managed"'));
  assert(h.includes('NexusEidolonCreatureRenderer.drawCreature'));
  assert(h.includes('NexusEidolonEnvironmentRenderer.drawEnvironment'));
  assert(h.includes('Nine living options.'));
});
ok('OS catalog exposes Nexus-native Multiforge and no disabled legacy duplicate', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes('id:"multiforge", path:"blocks/forges/multiforge.html"'));
  assert(!os.includes('multiforge-legacy'));
});
ok('First Contact explains first-hour outcome and routes to Multiforge', () => {
  const h = read('blocks/world/first-contact.html');
  assert(h.includes('What happens next:'));
  assert(h.includes('9 options'));
  assert(h.includes("blocks/forges/multiforge.html"));
  assert(h.includes('Wallet balance starts at 0 NEX') || h.includes('0 NEX'));
});
ok('OS has companion first-time callout and visible note handoff', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes('nx-companion-callout'));
  assert(os.includes('Your companion is here.'));
  assert(os.includes('note-received'));
  assert(os.includes('homeNoteSent'));
});
ok('Player Thread v2 includes first-hour guidance sequence', () => {
  const os = read('Nexus_OS.html');
  ['meet-your-companion','send-a-note','try-multiforge','shape-an-attack','understand-wallet'].forEach(id => assert(os.includes(id), id));
});
ok('Wallet first-hour copy clarifies zero start and proof outputs', () => {
  const w = read('blocks/system/Wallet_v4_nexus.html');
  assert(w.includes('You begin at <b>0 NEX</b>'));
  assert(w.includes('Advanced proof outputs'));
  assert(w.includes('not separate balances'));
});
ok('Web Viewer empty and disabled states are human-readable', () => {
  const w = read('blocks/apps/nexus-webviewer.html');
  assert(w.includes('Enter a URL or search term.'));
  assert(w.includes('No previous page'));
  assert(w.includes('No next page'));
  assert(w.includes('Some sites block embedded browsers'));
});
ok('First-hour documentation exists', () => {
  assert(fs.existsSync(path.join(ROOT,'docs/FIRST_HOUR_ONBOARDING.md')));
  assert(fs.existsSync(path.join(ROOT,'docs/FORGE_UX_CANON.md')));
});
console.log(`SWEEP16 SUMMARY pass=${pass} fail=${fail}`);
if(fail) process.exit(1);
