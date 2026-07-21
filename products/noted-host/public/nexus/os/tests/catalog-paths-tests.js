/* tests/catalog-paths-tests.js
   Static check: every BUILTIN_CATALOG / LEGACY_CATALOG entry in Nexus_OS.html
   either (a) points at a file that exists in the archive, or
   (b) is explicitly marked `disabled:true`. Catches the silent drift documented
   in LANDMINES.md #11. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'Nexus_OS.html'), 'utf8');

// Match catalog object literals that have both an id and a path.
const re = /\{[^{}]*?\bid\s*:\s*"([^"]+)"[^{}]*?\bpath\s*:\s*"([^"]+)"[^{}]*?\}/g;

let pass = 0, fail = 0;
const norm = p => String(p || '').replace(/^\.\//, '');
const requiredActivePaths = ['blocks/apps/companion.html', 'blocks/apps/verse-studio.html'];
const seenActivePaths = new Set();

let m;
while ((m = re.exec(html)) !== null) {
  const block = m[0];
  const id = m[1];
  const p = m[2];
  const disabled = /\bdisabled\s*:\s*true\b/.test(block);
  if (!disabled) seenActivePaths.add(norm(p));

  // Parent-relative external paths must be marked disabled.
  if (p.startsWith('../')) {
    if (disabled) { console.log(`PASS catalog ${id} external file is disabled`); pass++; }
    else { console.log(`FAIL catalog ${id} external path "${p}" not disabled`); fail++; }
    continue;
  }

  const candidate = path.join(ROOT, norm(p));
  const exists = fs.existsSync(candidate);

  if (exists && disabled) {
    console.log(`FAIL catalog ${id} disabled but file exists at "${p}" — un-disable or delete`);
    fail++;
  } else if (!exists && !disabled) {
    console.log(`FAIL catalog ${id} active but file missing at "${p}"`);
    fail++;
  } else if (exists) {
    console.log(`PASS catalog ${id} active and present`);
    pass++;
  } else {
    console.log(`PASS catalog ${id} disabled with missing file (expected)`);
    pass++;
  }
}

for (const requiredPath of requiredActivePaths) {
  if (seenActivePaths.has(requiredPath)) {
    console.log(`PASS catalog required active path ${requiredPath}`);
    pass++;
  } else {
    console.log(`FAIL catalog required active path ${requiredPath} missing from active catalog`);
    fail++;
  }
}

console.log(`CATALOG SUMMARY pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
