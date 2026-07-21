#!/usr/bin/env node
/* tests/wallet-handshake-tests.js
   Regression coverage for Wallet v4 as a managed block. The wallet installs
   its BOOT listener before async key/DB boot so it does not miss the kernel's
   MessagePort handshake. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OS_HTML = fs.readFileSync(path.join(ROOT, 'Nexus_OS.html'), 'utf8');
const WALLET_HTML = fs.readFileSync(path.join(ROOT, 'blocks/system/Wallet_v4_nexus.html'), 'utf8');

let pass = 0, fail = 0;
const tests = [];
function add(name, fn){ tests.push([name, fn]); }
async function run(){
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS wallet '+name); }
    catch (e) { fail++; console.error('FAIL wallet '+name+' — '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  console.log(`WALLET SUMMARY pass=${pass} fail=${fail}`);
  process.exitCode = fail ? 1 : 0;
}

add('catalog hosts Wallet v4 as a managed block, not legacy', () => {
  const entry = OS_HTML.match(/\{ id:"wallet",[^\n]+\}/);
  assert(entry, 'wallet catalog entry missing');
  assert(!/legacy\s*:\s*true/.test(entry[0]), 'wallet should not be catalogued as legacy');
});

add('wallet kernel IPC init is guarded against duplicate listeners', () => {
  assert(/let\s+_kernelIPCStarted\s*=\s*false/.test(WALLET_HTML), 'guard state missing');
  assert(/if\s*\(\s*_kernelIPCStarted\s*\)\s*return/.test(WALLET_HTML), 'duplicate-listener guard missing');
});

add('wallet installs BOOT listener before async boot begins', () => {
  const initIdx = WALLET_HTML.lastIndexOf('initKernelIPC();');
  const bootIdx = WALLET_HTML.lastIndexOf('boot();');
  assert(initIdx >= 0, 'explicit initKernelIPC() call missing');
  assert(bootIdx >= 0, 'boot() call missing');
  assert(initIdx < bootIdx, 'initKernelIPC() must run before boot()');
});

run();
