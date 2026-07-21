/* tests/local-script-refs-tests.js
   Static check: every local <script src="..."> reference in Nexus_OS.html
   and blocks/ resolves inside this archive. This catches runtime drift that
   syntax-check cannot catch because it validates inline/extracted JS only,
   not whether the browser will be able to load shared engine scripts. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;

function record(ok, msg) {
  if (ok) { console.log(`PASS script-ref ${msg}`); pass++; }
  else    { console.log(`FAIL script-ref ${msg}`); fail++; }
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function isExternal(src) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(src)
      || /^(?:data|blob|about):/i.test(src);
}

function stripQueryAndHash(src) {
  return String(src || '').split('#', 1)[0].split('?', 1)[0];
}

const htmlFiles = [path.join(ROOT, 'Nexus_OS.html'), ...walk(path.join(ROOT, 'blocks'))];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(ROOT, file);
  const re = /<script\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    const srcMatch = /\bsrc\s*=\s*(["'])(.*?)\1/i.exec(attrs);
    if (!srcMatch) continue;

    const rawSrc = srcMatch[2].trim();
    if (!rawSrc || isExternal(rawSrc)) continue;

    const cleanSrc = stripQueryAndHash(rawSrc);
    const target = path.resolve(path.dirname(file), cleanSrc);
    const relTarget = path.relative(ROOT, target);

    if (relTarget.startsWith('..') || path.isAbsolute(relTarget)) {
      record(false, `${relFile} -> ${rawSrc} escapes archive root`);
    } else if (!fs.existsSync(target)) {
      record(false, `${relFile} -> ${rawSrc} missing (${relTarget})`);
    } else {
      record(true, `${relFile} -> ${rawSrc}`);
    }
  }
}

console.log(`SCRIPT-REF SUMMARY pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
