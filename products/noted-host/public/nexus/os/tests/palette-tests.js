#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { OS_HTML, loadNexusContext, keyEvent } = require('./os-chrome-harness.js');
let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS palette '+name); }
    catch (e) { fail++; console.error('FAIL palette '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`PALETTE SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
}

add('palette element mounts in OS DOM', () => {
  assert(OS_HTML.includes('id="nx-palette"'), 'missing #nx-palette');
  assert(OS_HTML.includes('id="nx-palette-input"'), 'missing #nx-palette-input');
  assert(OS_HTML.includes('id="nx-palette-results"'), 'missing #nx-palette-results');
});

add('Cmd-K open/close toggle works', () => {
  const { win, document } = loadNexusContext();
  const body = document.body;
  document.dispatch('keydown', keyEvent('k', { metaKey:true, target:body }));
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.isPaletteOpen(), true, 'palette did not open');
  assert(document.getElementById('nx-palette').classList.contains('open'), 'palette class not open');
  document.dispatch('keydown', keyEvent('k', { metaKey:true, target:body }));
  assert.strictEqual(win.__NEXUS_CHROME_TEST_HOOKS.isPaletteOpen(), false, 'palette did not close');
});

add('blocks command lists Companion and Verse Studio', () => {
  const { win, document } = loadNexusContext();
  win.__NEXUS_CHROME_TEST_HOOKS.openPalette();
  win.__NEXUS_CHROME_TEST_HOOKS.executePaletteCommand('blocks');
  const txt = document.getElementById('nx-palette-results').textContent;
  assert(txt.includes('companion'), 'Companion id missing');
  assert(txt.includes('Companion'), 'Companion title missing');
  assert(txt.includes('verse-studio'), 'Verse Studio id missing');
  assert(txt.includes('Verse Studio'), 'Verse Studio title missing');
});

run();
