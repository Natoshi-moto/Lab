#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const roadmapPath = path.join(ROOT, 'docs', 'ROADMAP_STATUS.md');
const osPath = path.join(ROOT, 'Nexus_OS.html');

let pass = 0;
let fail = 0;

function ok(condition, name, detail = '') {
  if (condition) {
    pass++;
    console.log(`PASS roadmap ${name}`);
  } else {
    fail++;
    console.error(`FAIL roadmap ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

const roadmap = fs.existsSync(roadmapPath) ? read(roadmapPath) : '';
const os = read(osPath);

ok(
  fs.existsSync(roadmapPath) &&
  roadmap.includes('# ROADMAP_STATUS') &&
  roadmap.includes('## Audit method') &&
  roadmap.includes('## Ranked backlog') &&
  roadmap.includes('## False positives / not-work items'),
  'audit document exists with required sections'
);

const requiredIds = ['R-001', 'R-002', 'R-003', 'R-004', 'R-005', 'R-006', 'R-007'];
ok(
  requiredIds.every(id => roadmap.includes(`### ${id}`)) && roadmap.includes('Next implementation sweep should be **R-001'),
  'ranked backlog covers the active top-level roadmap clusters'
);

ok(
  roadmap.includes('companion.canvas.export.undo') &&
  roadmap.includes('blocks/world/atlas.html') &&
  roadmap.includes('docs/COMMUNITY_BLOCKS_DESIGN.md') &&
  roadmap.includes('docs/BATTLE_ENGINE_PARITY.md'),
  'audit references bridge undo, Atlas placeholders, community sandboxing, and battle timestamp deferrals'
);

const disabledCount = (os.match(/disabled:true/g) || []).length;
ok(
  disabledCount === 7 && roadmap.includes('7 disabled catalog entries') && roadmap.includes('R-003 — Catalog graveyard cleanup'),
  'disabled catalog graveyard is counted and triaged'
);

console.log(`ROADMAP SUMMARY pass=${pass} fail=${fail}`);
process.exitCode = fail ? 1 : 0;
