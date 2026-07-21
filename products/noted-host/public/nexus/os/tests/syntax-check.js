#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes:true })) {
    if (['node_modules','.git','.venv','__pycache__'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile()) out.push(p);
  }
  return out;
}
function typeOf(attrs) {
  const m = attrs.match(/\btype\s*=\s*(['"])(.*?)\1/i);
  return m ? m[2].trim().toLowerCase() : 'classic';
}
function shouldCheck(attrs) {
  if (/\bsrc\s*=/.test(attrs)) return false;
  const t = typeOf(attrs);
  return t === 'classic' || t === '' || t === 'text/javascript' || t === 'application/javascript' || t === 'module';
}
function isModule(attrs) { return typeOf(attrs) === 'module'; }
function label(ok, label, detail='') {
  if (ok) { pass++; console.log(`PASS syntax ${label}`); }
  else { fail++; console.error(`FAIL syntax ${label}${detail ? ' — ' + detail : ''}`); }
}
function checkCode(code, labelText, mode) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-syntax-'));
  const tmp = path.join(dir, `script${mode === 'module' ? '.mjs' : '.js'}`);
  fs.writeFileSync(tmp, code, 'utf8');
  const r = spawnSync(process.execPath, ['--check', tmp], { encoding:'utf8' });
  fs.rmSync(dir, { recursive:true, force:true });
  label(r.status === 0, labelText, (r.stderr || r.stdout || '').trim().split('\n')[0]);
}
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (file.toLowerCase().endsWith('.html')) {
    const html = fs.readFileSync(file, 'utf8');
    const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    let m, idx = 0;
    while ((m = re.exec(html))) {
      idx++;
      const attrs = m[1] || '';
      if (!shouldCheck(attrs)) continue;
      checkCode(m[2] || '', `${rel}#script${idx} ${isModule(attrs) ? 'module' : 'classic'}`, isModule(attrs) ? 'module' : 'classic');
    }
  } else if (file.toLowerCase().endsWith('.js')) {
    checkCode(fs.readFileSync(file, 'utf8'), `${rel} file`, file.endsWith('.mjs') ? 'module' : 'classic');
  }
}
console.log(`SYNTAX SUMMARY pass=${pass} fail=${fail}`);
process.exitCode = fail ? 1 : 0;
