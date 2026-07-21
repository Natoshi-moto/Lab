import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const srcDir = join(root, 'src');
const failures = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) out.push(...walk(path));
    else if (name.endsWith('.ts')) out.push(path);
  }
  return out;
}

const files = walk(srcDir);

for (const file of files) {
  const rel = relative(root, file);
  const text = readFileSync(file, 'utf8');
  const body = text.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');

  if (/\bMath\.random\s*\(/.test(body)) failures.push(`${rel}: forbidden Math.random()`);

  if (/\bperformance\.now\s*\(/.test(body) && rel !== 'src/runtime.ts') {
    failures.push(`${rel}: performance.now() outside runtime`);
  }

  if (/\bDate\.now\s*\(/.test(body) && rel !== 'src/runtime.ts' && rel !== 'src/persistence.ts') {
    failures.push(`${rel}: Date.now() outside display-only runtime/persistence paths`);
  }

  const importRegex = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(text))) {
    const spec = match[1];
    if (!spec.endsWith('.js')) failures.push(`${rel}: relative import lacks .js specifier: ${spec}`);
  }
}

const duplicateNames = files
  .map(file => relative(srcDir, file))
  .filter(name => /\(\d+\)\.ts$/.test(name));
for (const name of duplicateNames) failures.push(`src/${name}: duplicate generated variant in runnable tree`);

if (failures.length) {
  console.error('Audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checkedFiles: files.length }, null, 2));
