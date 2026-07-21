#!/usr/bin/env node
/* tests/tools-tests.js — smoke tests for the dev tools under tools/.

   These verify the tools load, produce structurally-correct output on
   real inputs from the archive, and the channel-atlas registers itself
   with --check. Not exhaustive — full behavior is verified by running
   the tools against the real codebase, which the test suite does as a
   side effect of running channel-atlas in --check mode.
*/

'use strict';
const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');

const ROOT  = path.resolve(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools');

let pass = 0, fail = 0;
function record(ok, msg) {
  if (ok) { console.log(`PASS tools ${msg}`); pass++; }
  else    { console.log(`FAIL tools ${msg}`); fail++; }
}

function run(cmd, args, opts = {}) {
  const r = cp.spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  return { stdout: r.stdout || '', stderr: r.stderr || '', code: r.status };
}

// ── block-inspect ────────────────────────────────────────────────────────
{
  // require() should not trigger CLI exit.
  let mod;
  try {
    mod = require('../tools/block-inspect');
    record(typeof mod.inspect === 'function', 'block-inspect exports inspect()');
  } catch (e) {
    record(false, `block-inspect require failed: ${e.message}`);
  }

  // Inspect a known small client-backed block.
  if (mod) {
    const report = mod.inspect(path.join(ROOT, 'blocks/apps/app-notepad.html'));
    record(report.classification.client_backed === true,
      'app-notepad classified as client-backed');
    record(report.manifest.emits.includes('fs.write'),
      'app-notepad manifest.emits contains fs.write');
    record(report.manifest.consumes.includes('fs.result'),
      'app-notepad manifest.consumes contains fs.result');
    record(report.drift.emits_used_not_declared.length === 0,
      'app-notepad has no undeclared emits');
  }

  // CLI invocation smoke (--json mode for stable parsing).
  const r = run('node', [
    path.join(TOOLS, 'block-inspect.js'),
    path.join(ROOT, 'blocks/apps/app-notepad.html'),
    '--json'
  ]);
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch (_) {}
  record(r.code === 0 && parsed && parsed.path,
    'block-inspect CLI --json produces valid JSON with path field');
}

// ── channel-atlas ────────────────────────────────────────────────────────
{
  // --json mode produces a well-formed registry.
  const r = run('node', [path.join(TOOLS, 'channel-atlas.js'), '--json']);
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch (_) {}
  record(r.code === 0 && parsed && typeof parsed.channels === 'object',
    'channel-atlas --json produces valid registry');
  record(parsed && parsed.channel_count > 10,
    `channel-atlas finds >10 channels (found ${parsed?.channel_count ?? '?'})`);
  record(parsed && parsed.block_count > 10,
    `channel-atlas finds >10 blocks (found ${parsed?.block_count ?? '?'})`);

  // --check verifies CHANNEL_ATLAS.md is up to date. If this fails, it
  // means someone added a manifest channel without regenerating the atlas;
  // that's a real bug, not a test bug.
  const c = run('node', [path.join(TOOLS, 'channel-atlas.js'), '--check']);
  record(c.code === 0,
    'channel-atlas --check passes (atlas is up to date with current manifests)');
}

// ── spec-audit ──────────────────────────────────────────────────────────
{
  // Write a tiny inline spec that references one real path and one fake
  // path, plus one real LANDMINE and one out-of-range LANDMINE.
  const tmp = path.join(ROOT, 'tests', '_spec-audit-fixture.md');
  fs.writeFileSync(tmp, [
    '# Tiny test spec',
    'References `engines/substrate.js` (real).',
    'References `engines/totally-fake.js` (not real).',
    'Per LANDMINE #1 we never modify substrate.',
    'Per LANDMINE #999 something hypothetical.',
    ''
  ].join('\n'));

  try {
    const r = run('node', [path.join(TOOLS, 'spec-audit.js'), tmp, '--json']);
    let parsed = null;
    try { parsed = JSON.parse(r.stdout); } catch (_) {}
    record(r.code === 0 && parsed,
      'spec-audit --json produces valid JSON');

    const missingPaths = parsed?.paths?.missing?.map(m => m.path) ?? [];
    record(missingPaths.includes('engines/totally-fake.js'),
      'spec-audit flags engines/totally-fake.js as missing');
    record(!missingPaths.includes('engines/substrate.js'),
      'spec-audit does not flag engines/substrate.js (it exists)');

    const out999 = parsed?.landmines?.find(l => l.number === 999);
    record(out999 && out999.exists === false,
      'spec-audit flags LANDMINE #999 as out-of-range');
    const in1 = parsed?.landmines?.find(l => l.number === 1);
    record(in1 && in1.exists === true,
      'spec-audit confirms LANDMINE #1 exists');
  } finally {
    fs.unlinkSync(tmp);
  }
}

console.log(`TOOLS SUMMARY pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
