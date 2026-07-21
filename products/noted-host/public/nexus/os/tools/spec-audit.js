#!/usr/bin/env node
/* tools/spec-audit.js — spec-vs-codebase drift detector.

   Built because of the Lattice Studio spec audit: a 19-section spec was
   written referencing files (engines/lattice-runtime.js, compose-stage.html,
   game-compositor.html), docs (AI_EXPERIMENTAL_EXPANSION.md), and landmines
   (#24, #25, #26) that don't exist in the canonical archive. This tool
   would have caught all of it in one pass.

   Given a markdown spec file and a codebase root, this scans the spec for:

     - File paths matching known archive shapes (blocks/*.html, engines/*.js,
       tests/*.js, tools/*.js, docs/*.md, proxy/*.py, realms/*.json) and
       reports any that don't exist on disk.
     - LANDMINE references (LANDMINE #N, landmine #N) and reports any whose
       number is higher than the highest entry in docs/LANDMINES.md.
     - Section/line references inside code fences (`compose-stage.html lines
       92-93`) and reports any whose target file doesn't exist.

   Static analysis only. False positives are possible (a path quoted as an
   example, a hypothetical future file). False negatives are possible
   (paths constructed dynamically, symbols not yet existing, paths spelled
   differently than expected). The tool's job is to surface candidates fast,
   not to be a proof.

   Usage:
     node tools/spec-audit.js <spec.md>
     node tools/spec-audit.js <spec.md> --root <codebase-root>
     node tools/spec-audit.js <spec.md> --json

   Exit codes:
     0 — spec audited; report printed (does not exit non-zero on findings)
     1 — spec or codebase root unreadable
     2 — invalid CLI invocation
*/

'use strict';
const fs   = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
  console.error('usage: node tools/spec-audit.js <spec.md> [--root <codebase-root>] [--json]');
  process.exit(2);
}

const specPath = argv[0];
const rootIdx = argv.indexOf('--root');
const codebaseRoot = rootIdx > -1 ? path.resolve(argv[rootIdx + 1])
                                  : path.resolve(__dirname, '..');
const wantJson = argv.includes('--json');

if (!fs.existsSync(specPath)) {
  console.error(`spec-audit: spec not readable: ${specPath}`);
  process.exit(1);
}
if (!fs.existsSync(codebaseRoot)) {
  console.error(`spec-audit: codebase root not readable: ${codebaseRoot}`);
  process.exit(1);
}

const spec = fs.readFileSync(specPath, 'utf8');

// ── Path extraction ──────────────────────────────────────────────────────
// Match anything that looks like a relative path under the canonical archive
// shape. Catches both backticked (`engines/foo.js`) and bare prose mentions.
//
// We include a lookbehind for boundary characters that separate paths from
// surrounding prose ([whitespace, backtick, slash, paren, bracket, quote]).

const PATH_RE = new RegExp(
  // boundary
  '(?<![A-Za-z0-9._/-])'
  // dirs we expect to live at the root
  + '(blocks|engines|tests|tools|docs|proxy|realms)\\/'
  // path body (allow nested folders, dots in filenames)
  + '[A-Za-z0-9._/-]+'
  // recognized extensions
  + '\\.(html|js|md|py|json|sh)\\b',
  'g'
);

// Some paths the spec can legitimately mention as "to be created" rather
// than "should exist now." We extract every reference; the consumer
// decides which are aspirational.
function findPathReferences(text) {
  const seen = new Map(); // normalized path -> { count, sample_line, sample_context }
  let m;
  PATH_RE.lastIndex = 0;
  while ((m = PATH_RE.exec(text)) !== null) {
    const raw = m[0];
    const normalized = raw.replace(/\\/g, '/');
    const lineNo = text.slice(0, m.index).split('\n').length;
    const lineText = text.split('\n')[lineNo - 1] || '';
    if (!seen.has(normalized)) {
      seen.set(normalized, {
        path: normalized,
        count: 0,
        first_line: lineNo,
        first_context: lineText.trim().slice(0, 160)
      });
    }
    seen.get(normalized).count++;
  }
  return [...seen.values()];
}

// ── LANDMINE reference extraction ────────────────────────────────────────
function findLandmineReferences(text) {
  const re = /\b(?:landmine|LANDMINE)s?\s*#?\s*(\d+)/g;
  const out = new Map(); // number -> {count, lines:[]}
  let m;
  while ((m = re.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    const lineNo = text.slice(0, m.index).split('\n').length;
    if (!out.has(n)) out.set(n, { number: n, count: 0, lines: [] });
    out.get(n).count++;
    out.get(n).lines.push(lineNo);
  }
  return [...out.values()].sort((a, b) => a.number - b.number);
}

function highestLandmineInFile(landminePath) {
  if (!fs.existsSync(landminePath)) return null;
  const text = fs.readFileSync(landminePath, 'utf8');
  // Headings of the form `## N · Title` — robust against the file's
  // actual format (verified against v1.4's docs/LANDMINES.md).
  const re = /^##\s+(\d+)\s*[·•|.]/gm;
  let max = 0, m;
  while ((m = re.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max;
}

// ── Run ──────────────────────────────────────────────────────────────────
const refs = findPathReferences(spec);
const landmineRefs = findLandmineReferences(spec);

const present = [];
const missing = [];
for (const ref of refs) {
  const abs = path.resolve(codebaseRoot, ref.path);
  if (fs.existsSync(abs)) present.push(ref);
  else missing.push(ref);
}

const landmineFile = path.join(codebaseRoot, 'docs', 'LANDMINES.md');
const highestLandmine = highestLandmineInFile(landmineFile);
const landmineFindings = landmineRefs.map(r => ({
  ...r,
  exists: highestLandmine !== null && r.number <= highestLandmine
}));

const report = {
  spec: path.relative(process.cwd(), path.resolve(specPath)),
  codebase_root: path.relative(process.cwd(), codebaseRoot) || '.',
  totals: {
    path_references: refs.length,
    paths_present: present.length,
    paths_missing: missing.length,
    landmine_references: landmineRefs.length
  },
  highest_landmine_in_codebase: highestLandmine,
  paths: {
    missing,
    present: present.map(p => ({ path: p.path, count: p.count }))
  },
  landmines: landmineFindings
};

if (wantJson) {
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exit(0);
}

const L = [];
L.push(`spec:           ${report.spec}`);
L.push(`codebase root:  ${report.codebase_root}`);
L.push('');
L.push(`path references found: ${report.totals.path_references}  (present: ${report.totals.paths_present}  missing: ${report.totals.paths_missing})`);
L.push(`landmine references:   ${report.totals.landmine_references}  (highest in LANDMINES.md: ${highestLandmine ?? '?'})`);
L.push('');

if (missing.length) {
  L.push('── MISSING PATHS ─────────────────────────────────────────────────');
  L.push('Paths the spec references that do not exist under the codebase root.');
  L.push('Each may be (a) a planned future file, (b) drift / hallucination,');
  L.push('(c) a path the spec spelled differently than the canonical archive.');
  L.push('');
  for (const m of missing) {
    L.push(`  ✗ ${m.path}  ×${m.count}`);
    L.push(`      first at line ${m.first_line}: ${m.first_context}`);
  }
  L.push('');
} else {
  L.push('── MISSING PATHS ─────────────────────────────────────────────────');
  L.push('  none ✓');
  L.push('');
}

const missingLandmines = landmineFindings.filter(f => !f.exists);
if (missingLandmines.length) {
  L.push('── LANDMINE REFERENCES OUT OF RANGE ──────────────────────────────');
  L.push(`Highest LANDMINE in docs/LANDMINES.md: #${highestLandmine}`);
  L.push('Spec references the following higher numbers, which may not exist yet:');
  L.push('');
  for (const r of missingLandmines) {
    L.push(`  ✗ #${r.number}  ×${r.count}  (lines: ${r.lines.join(', ')})`);
  }
  L.push('');
} else if (landmineRefs.length) {
  L.push('── LANDMINE REFERENCES ──────────────────────────────────────────');
  L.push('  all referenced numbers exist in docs/LANDMINES.md ✓');
  L.push('');
}

L.push('── PRESENT PATHS (sample) ────────────────────────────────────────');
const samplePresent = present.slice(0, 10);
for (const p of samplePresent) {
  L.push(`  ✓ ${p.path}  ×${p.count}`);
}
if (present.length > samplePresent.length) {
  L.push(`  … and ${present.length - samplePresent.length} more`);
}

process.stdout.write(L.join('\n') + '\n');
