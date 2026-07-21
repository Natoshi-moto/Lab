#!/usr/bin/env node
/* tools/block-inspect.js — single-file block analyzer.

   Point at any block .html (or any path containing inline JS that boots
   a Nexus block) and get back its contract: declared manifest, app
   metadata, statically-detected emit/consume sites, drift between the
   manifest and the call sites, hand-rolled-vs-client-backed, size, and
   load-bearing imports.

   Companion to tests/block-contract-tests.js. The contract tests scan
   the whole tree on every test run; this is the surface for the moment
   when you're holding ONE block in your head and want a verdict in
   200ms.

   Usage:
     node tools/block-inspect.js blocks/apps/app-notepad.html
     node tools/block-inspect.js blocks/apps/app-notepad.html --json
     node tools/block-inspect.js blocks/apps/app-notepad.html --diff blocks/apps/app-files.html

   Exit codes:
     0 — block parsed and reported (drift findings are informational, not failure)
     1 — file unreadable or no parseable manifest
     2 — invalid CLI invocation
*/

'use strict';
const fs = require('fs');
const path = require('path');

// CLI parsing happens at the bottom inside the require.main === module guard.

// ── Inspector ────────────────────────────────────────────────────────────
function inspect(blockPath) {
  const abs = path.resolve(blockPath);
  if (!fs.existsSync(abs)) {
    console.error(`block-inspect: not found: ${blockPath}`);
    process.exit(1);
  }
  const html = fs.readFileSync(abs, 'utf8');
  const bytes = Buffer.byteLength(html, 'utf8');
  const lines = html.split('\n').length;

  const scripts = extractInlineScripts(html);
  const externalScripts = extractExternalScriptSrcs(html);

  const isClientBased = /nexus-block-client\.js/.test(html);
  const isKernelHost  = /\bfunction\s+(deliverMessage|kernelBroadcast)\s*\(/.test(html)
                     || /\bCHANNEL_SUBS\b.*new Map/.test(html);

  const manifest = extractManifest(scripts);
  const app      = extractAppMetadata(scripts);

  // Static call-site analysis (channel literals only — dynamic strings invisible).
  const usedEmits   = extractEmitSites(scripts);
  const usedSubs    = extractSubscribeSites(scripts);
  const usedHandles = extractHandleSites(scripts);

  // Drift: declared-but-unused, used-but-undeclared.
  const drift = computeDrift(manifest, usedEmits, usedSubs, usedHandles);

  return {
    path: path.relative(process.cwd(), abs),
    bytes,
    lines,
    inline_script_count: scripts.length,
    external_scripts: externalScripts,
    classification: {
      client_backed: isClientBased,
      kernel_host: isKernelHost,
      hand_rolled: !isClientBased && !isKernelHost
    },
    manifest,
    app,
    static_call_sites: {
      emits:    [...usedEmits].sort(),
      subscribes: [...usedSubs].sort(),
      handles:  [...usedHandles].sort()
    },
    drift
  };
}

function extractInlineScripts(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    out.push(m[2]);
  }
  return out;
}

function extractExternalScriptSrcs(html) {
  const out = [];
  const re = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

// Pull the first plausible manifest object out of a script body.
// Returns {emits, consumes, undoable, source: 'bootBlock'|'declare'|null}.
function extractManifest(scripts) {
  const empty = { emits: [], consumes: [], undoable: [], source: null };

  for (const src of scripts) {
    // Pattern 1: bootBlock({manifest: {...}, app: {...}}) — client-backed.
    const m1 = src.match(/bootBlock\s*\(\s*\{([\s\S]*?)\}\s*\)/);
    if (m1) {
      const inside = m1[1];
      const fields = parseManifestFields(inside);
      if (fields.emits.length || fields.consumes.length) {
        return { ...fields, source: 'bootBlock' };
      }
    }

    // Pattern 2: postMessage({type:'DECLARE', manifest:{...}, app:{...}})  — hand-rolled.
    const m2 = src.match(/postMessage\s*\(\s*\{[^{}]*\btype\s*:\s*["']DECLARE["'][\s\S]*?\}\s*\)/);
    if (m2) {
      const fields = parseManifestFields(m2[0]);
      if (fields.emits.length || fields.consumes.length) {
        return { ...fields, source: 'declare' };
      }
    }
  }
  return empty;
}

// Pull emits/consumes/undoable arrays out of a substring. Tolerant of nested
// braces because the regex captures from the field name to the closing
// bracket of the array literal.
function parseManifestFields(text) {
  const fields = { emits: [], consumes: [], undoable: [] };
  for (const key of ['emits', 'consumes', 'undoable']) {
    const re = new RegExp(`\\b${key}\\s*:\\s*\\[([^\\]]*)\\]`);
    const m = text.match(re);
    if (!m) continue;
    const literals = [];
    const strRe = /["']([a-z0-9._-]+)["']/gi;
    let s;
    while ((s = strRe.exec(m[1])) !== null) literals.push(s[1]);
    fields[key] = literals;
  }
  return fields;
}

function extractAppMetadata(scripts) {
  for (const src of scripts) {
    const m = src.match(/\bapp\s*:\s*\{([\s\S]*?)\}/);
    if (!m) continue;
    const inside = m[1];
    const grab = key => {
      const r = new RegExp(`\\b${key}\\s*:\\s*["']([^"']+)["']`);
      const mm = inside.match(r);
      return mm ? mm[1] : null;
    };
    const visMatch = inside.match(/\bvisible\s*:\s*(true|false)/);
    return {
      title:       grab('title'),
      icon:        grab('icon'),
      description: grab('description'),
      visible:     visMatch ? visMatch[1] === 'true' : null
    };
  }
  return null;
}

function extractEmitSites(scripts) {
  const out = new Set();
  for (const src of scripts) {
    const r1 = /\b(?:nx\s*\.\s*emit|nx\s*\.\s*request|emit|emitToKernel)\s*\(\s*["']([a-z0-9._-]+)["']/gi;
    let m;
    while ((m = r1.exec(src)) !== null) out.add(m[1]);
    const r2 = /postMessage\s*\(\s*\{[^}]*\btype\s*:\s*["']EMIT["'][^}]*\bchannel\s*:\s*["']([a-z0-9._-]+)["']/g;
    while ((m = r2.exec(src)) !== null) out.add(m[1]);
  }
  return out;
}

function extractSubscribeSites(scripts) {
  const out = new Set();
  for (const src of scripts) {
    const r1 = /\bnx\s*\.\s*subscribe\s*\(\s*["']([a-z0-9._-]+)["']/g;
    let m;
    while ((m = r1.exec(src)) !== null) out.add(m[1]);
    const r2 = /postMessage\s*\(\s*\{[^}]*\btype\s*:\s*["']SUB["'][^}]*\bchannel\s*:\s*["']([a-z0-9._-]+)["']/g;
    while ((m = r2.exec(src)) !== null) out.add(m[1]);
  }
  return out;
}

function extractHandleSites(scripts) {
  const out = new Set();
  for (const src of scripts) {
    const r = /\bnx\s*\.\s*handle\s*\(\s*["']([a-z0-9._-]+)["']/g;
    let m;
    while ((m = r.exec(src)) !== null) out.add(m[1]);
  }
  return out;
}

// "Drift" = the gap between what the manifest declares and what the code
// actually does. None of these are necessarily bugs (manifest may include
// channels the block consumes via onMessage rather than nx.subscribe; emit
// channel literals can be computed dynamically). They are *signals*.
function computeDrift(manifest, usedEmits, usedSubs, usedHandles) {
  const declaredEmits    = new Set(manifest.emits);
  const declaredConsumes = new Set(manifest.consumes);
  const declaredUndoable = new Set(manifest.undoable);

  const emitsUsedNotDeclared = [...usedEmits].filter(c => !declaredEmits.has(c)).sort();
  const emitsDeclaredNotUsed = [...declaredEmits].filter(c => !usedEmits.has(c)).sort();
  const subsUsedNotDeclared  = [...new Set([...usedSubs, ...usedHandles])]
    .filter(c => !declaredConsumes.has(c)).sort();
  const undoableNotEmitted   = [...declaredUndoable].filter(c => !declaredEmits.has(c)).sort();

  return {
    emits_used_not_declared:    emitsUsedNotDeclared,
    emits_declared_not_used:    emitsDeclaredNotUsed,
    subscribes_used_not_declared: subsUsedNotDeclared,
    undoable_not_in_emits:      undoableNotEmitted
  };
}

// ── Renderers ────────────────────────────────────────────────────────────
function renderHuman(report) {
  const L = [];
  L.push(`${report.path}`);
  L.push(`  ${report.bytes.toLocaleString()} bytes · ${report.lines.toLocaleString()} lines · ${report.inline_script_count} inline script(s)`);
  const cls = report.classification;
  const tag = cls.kernel_host ? 'kernel-host'
           : cls.client_backed ? 'client-backed'
           : cls.hand_rolled  ? 'hand-rolled' : 'unknown';
  L.push(`  classification: ${tag}`);
  if (report.app) {
    L.push(`  app: ${report.app.title || '(no title)'} ${report.app.icon ? '· ' + report.app.icon : ''} ${report.app.visible === false ? '· hidden' : ''}`);
    if (report.app.description) L.push(`       ${report.app.description}`);
  } else {
    L.push(`  app: (no app metadata — likely a kernel-host or pure utility)`);
  }
  L.push('');
  L.push(`  manifest (${report.manifest.source || 'none found'}):`);
  L.push(`    emits     [${report.manifest.emits.length}]: ${fmtList(report.manifest.emits)}`);
  L.push(`    consumes  [${report.manifest.consumes.length}]: ${fmtList(report.manifest.consumes)}`);
  L.push(`    undoable  [${report.manifest.undoable.length}]: ${fmtList(report.manifest.undoable)}`);
  L.push('');
  L.push(`  static call sites:`);
  L.push(`    emit()       [${report.static_call_sites.emits.length}]: ${fmtList(report.static_call_sites.emits)}`);
  L.push(`    subscribe()  [${report.static_call_sites.subscribes.length}]: ${fmtList(report.static_call_sites.subscribes)}`);
  L.push(`    handle()     [${report.static_call_sites.handles.length}]: ${fmtList(report.static_call_sites.handles)}`);
  L.push('');
  const d = report.drift;
  const anyDrift = d.emits_used_not_declared.length || d.emits_declared_not_used.length
                || d.subscribes_used_not_declared.length || d.undoable_not_in_emits.length;
  L.push(`  drift signals${anyDrift ? '' : ': none ✓'}`);
  if (d.emits_used_not_declared.length)
    L.push(`    ⚠ emits used but not declared: ${fmtList(d.emits_used_not_declared)}`);
  if (d.subscribes_used_not_declared.length)
    L.push(`    ⚠ subscribes/handles on channels not in manifest.consumes: ${fmtList(d.subscribes_used_not_declared)}`);
  if (d.undoable_not_in_emits.length)
    L.push(`    ⚠ undoable channels not in emits: ${fmtList(d.undoable_not_in_emits)}`);
  if (d.emits_declared_not_used.length)
    L.push(`    · emits declared but no static call site: ${fmtList(d.emits_declared_not_used)} (may be dynamic)`);
  if (report.external_scripts.length) {
    L.push('');
    L.push(`  external <script src> imports (${report.external_scripts.length}):`);
    for (const s of report.external_scripts) L.push(`    - ${s}`);
  }
  return L.join('\n');
}

function fmtList(arr) {
  if (!arr.length) return '—';
  return arr.join(', ');
}

function renderDiff(a, b) {
  const L = [];
  L.push(`A: ${a.path}`);
  L.push(`B: ${b.path}`);
  L.push('');
  const cmp = (label, listA, listB) => {
    const setA = new Set(listA), setB = new Set(listB);
    const onlyA = [...setA].filter(x => !setB.has(x)).sort();
    const onlyB = [...setB].filter(x => !setA.has(x)).sort();
    const both  = [...setA].filter(x => setB.has(x)).sort();
    L.push(`  ${label}:`);
    L.push(`    only in A: ${fmtList(onlyA)}`);
    L.push(`    only in B: ${fmtList(onlyB)}`);
    L.push(`    in both:   ${fmtList(both)}`);
  };
  cmp('manifest.emits',    a.manifest.emits,    b.manifest.emits);
  cmp('manifest.consumes', a.manifest.consumes, b.manifest.consumes);
  cmp('manifest.undoable', a.manifest.undoable, b.manifest.undoable);
  return L.join('\n');
}

// ── Run (CLI only — silent when require()d as a module) ─────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.error('usage: node tools/block-inspect.js <block.html> [--json] [--diff <other-block.html>]');
    process.exit(2);
  }
  const target = args[0];
  const wantJson = args.includes('--json');
  const diffIdx = args.indexOf('--diff');
  const diffTarget = diffIdx > -1 ? args[diffIdx + 1] : null;
  if (diffIdx > -1 && !diffTarget) {
    console.error('--diff requires a path argument');
    process.exit(2);
  }

  const report = inspect(target);
  if (diffTarget) {
    const b = inspect(diffTarget);
    if (wantJson) {
      process.stdout.write(JSON.stringify({ a: report, b }, null, 2) + '\n');
    } else {
      process.stdout.write(renderHuman(report) + '\n\n');
      process.stdout.write(renderHuman(b) + '\n\n');
      process.stdout.write('── DIFF ────────────────────────────────────────────────\n');
      process.stdout.write(renderDiff(report, b) + '\n');
    }
  } else {
    if (wantJson) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    else process.stdout.write(renderHuman(report) + '\n');
  }
}

module.exports = { inspect };
