#!/usr/bin/env node
/* tests/node-mode-tests.js
   Ensures the archive is immune to parent-folder package.json type:module drift. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function test(name, fn){
  try { fn(); pass++; console.log('PASS node-mode '+name); }
  catch(e){ fail++; console.error('FAIL node-mode '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
}

test('project-local package.json pins CommonJS without dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.type, 'commonjs');
  assert.strictEqual(pkg.private, true);
  assert(!pkg.dependencies, 'package.json must not introduce dependencies');
  assert(!pkg.devDependencies, 'package.json must not introduce devDependencies');
  assert(!pkg.scripts, 'package.json must not introduce npm scripts/build steps');
});

test('CommonJS require is available to the test runner', () => {
  assert.strictEqual(typeof require, 'function');
  assert.strictEqual(typeof module.exports, 'object');
});

console.log(`NODE-MODE SUMMARY pass=${pass} fail=${fail}`);
if (fail) process.exit(1);
