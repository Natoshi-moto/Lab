'use strict';
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); console.log('PASS', name); pass++; }
  catch(e) { console.log('FAIL', name, e.message); fail++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const forgePath = path.join(__dirname, '../blocks/forges/eidolon-forge.html');
const forgeText = fs.readFileSync(forgePath, 'utf8');

test('eidolon forge file exists at canonical path', () => {
  assert(fs.existsSync(forgePath), 'blocks/forges/eidolon-forge.html not found');
});
test('eidolon forge declares nexus-block managed', () => {
  assert(forgeText.includes('nexus-block') && forgeText.includes('managed'), 'missing nexus-block meta');
});
test('eidolon forge has DECLARE manifest', () => {
  assert(forgeText.includes('vibe.save') && forgeText.includes('DECLARE'), 'missing DECLARE or vibe.save');
});
test('eidolon forge has 36 axes', () => {
  const matches = forgeText.match(/group:/g);
  assert(matches && matches.length >= 30, `expected ≥30 axis group refs, got ${matches ? matches.length : 0}`);
});
test('eidolon forge has sweep and lock controls', () => {
  assert(forgeText.includes('axis-sweep') && forgeText.includes('axis-lock'), 'missing sweep or lock controls');
});
test('eidolon forge catalog entry exists in OS', () => {
  const os = fs.readFileSync(path.join(__dirname, '../Nexus_OS.html'), 'utf8');
  assert(os.includes('eidolon-forge') && os.includes('blocks/forges/eidolon-forge.html'), 'catalog entry missing');
});

console.log(`SWEEP20 SUMMARY pass=${pass} fail=${fail}`);
