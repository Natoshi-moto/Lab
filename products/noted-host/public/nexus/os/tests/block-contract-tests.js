/* tests/block-contract-tests.js
   Static analyzer that catches the bug patterns Round 018 found
   by inspection — automatically, on every test run.

   For each HTML block under blocks/, extract the inline JS, scan
   for known anti-patterns:

     A. Block-side `type: "MSG"` in postMessage — kernel only accepts
        DECLARE/SUB/MOUNT_ACK/PONG/EMIT from blocks; "MSG" is the
        kernel→block direction. A block sending MSG is a silent
        protocol violation. (Found in i-was-wrong.html in Round 018.)

     B. PONG without nonce — `port.postMessage({type:'PONG'})` (no
        nonce field) fails kernel-side `typeof msg.nonce !== "string"`
        validation and is counted as a violation. (Found in
        nexus-witness.html in Round 018.)

     C. EMIT on a channel not in the manifest's emits[] declaration.
        kernel's handleEmit rejects `undeclared emit ${channel}`. We
        cross-check by parsing the DECLARE manifest from the same
        file and the channel literals used in EMIT calls. This is
        approximate — only catches static string-literal channels —
        but those are the ones that break.

   This is a static analyzer, not a runtime test. It cannot catch
   bugs that depend on runtime values. It DOES catch the kinds of
   mistakes that arise when blocks hand-roll the handshake instead
   of using engines/nexus-block-client.js.

   Blocks that use the shared client are exempt from rules A and B
   automatically — the client always sends valid types and includes
   the nonce. Rule C still applies to client-using blocks because
   manifest declarations and emit-call channels can drift independently.
*/

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;

function record(ok, msg) {
  if (ok) { console.log(`PASS contract ${msg}`); pass++; }
  else    { console.log(`FAIL contract ${msg}`); fail++; }
}

// Recursively find all .html files under blocks/
function findBlocks(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...findBlocks(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

// Extract inline <script>...</script> bodies (skipping <script src=...>).
function extractInlineScripts(html, blockPath) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;   // external script — skip

    // Verse Studio is an opaque pre-built React/TS module bundle. It contains
    // unrelated framework/library `emit("...")` calls that are not Nexus IPC.
    // The Nexus contract lives in the classic bootstrap script inserted above
    // the bundle, so Rule C should scan that adapter but not the opaque module.
    if (path.relative(ROOT, blockPath) === 'blocks/apps/verse-studio.html'
        && /\btype\s*=\s*(["'])module\1/i.test(attrs)) continue;

    out.push(m[2]);
  }
  return out;
}

// Whether this block uses the shared kernel-block client.
function usesClient(html) {
  return /nexus-block-client\.js/.test(html);
}

// Whether this file is itself a kernel-host (it routes MSGs to its own
// hosted blocks). For these, type:"MSG" in postMessage is CORRECT — it's
// the kernel→block direction. Detected by the presence of kernel-router
// functions like deliverMessage/kernelBroadcast/router that postMessage to
// other blocks' ports. Currently matches Nexus_OS.html (the main kernel)
// and blocks/eidolon/eidolon-os.html (the sovereign game-cartridge kernel).
function isKernelHost(html) {
  return /\bfunction\s+(deliverMessage|kernelBroadcast)\s*\(/.test(html)
      || /\bCHANNEL_SUBS\b.*new Map/.test(html);
}

// ── Rule A: type:"MSG" sent from a block ─────────────────────────────────
// kernel router only handles DECLARE/SUB/MOUNT_ACK/PONG/EMIT from blocks.
// A block sending {type:'MSG', ...} hits the "unknown type" violation path.
function checkRuleA(blockPath, scripts, isClientBased, isKernel) {
  if (isClientBased) {
    record(true, `${path.relative(ROOT, blockPath)} — rule A (client-based, exempt)`);
    return;
  }
  if (isKernel) {
    record(true, `${path.relative(ROOT, blockPath)} — rule A (kernel-host, type:"MSG" is correct in kernel→block direction)`);
    return;
  }
  const offenders = [];
  for (const src of scripts) {
    // Match `type:'MSG'` or `type:"MSG"` near a postMessage call.
    const re = /postMessage\s*\(\s*\{[^}]*\btype\s*:\s*["']MSG["']/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const lineNo = src.slice(0, m.index).split('\n').length;
      offenders.push(`line ~${lineNo}`);
    }
  }
  const ok = offenders.length === 0;
  record(ok, ok
    ? `${path.relative(ROOT, blockPath)} — rule A (no block-side type:"MSG")`
    : `${path.relative(ROOT, blockPath)} — rule A: block sends type:"MSG" at ${offenders.join(', ')} (kernel only accepts DECLARE/SUB/MOUNT_ACK/PONG/EMIT from blocks)`);
}

// ── Rule B: PONG without nonce ───────────────────────────────────────────
// kernel handlePong validates `typeof msg.nonce !== "string"`. Sending
// `port.postMessage({type:'PONG'})` (no nonce) is a silent violation.
function checkRuleB(blockPath, scripts, isClientBased) {
  if (isClientBased) {
    record(true, `${path.relative(ROOT, blockPath)} — rule B (client-based, exempt)`);
    return;
  }
  const offenders = [];
  for (const src of scripts) {
    // Look for {type:'PONG'} that does NOT also contain `nonce` in the same braces.
    const re = /postMessage\s*\(\s*\{([^{}]*\btype\s*:\s*["']PONG["'][^{}]*)\}/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const inner = m[1];
      if (!/\bnonce\b/.test(inner)) {
        const lineNo = src.slice(0, m.index).split('\n').length;
        offenders.push(`line ~${lineNo}`);
      }
    }
  }
  const ok = offenders.length === 0;
  record(ok, ok
    ? `${path.relative(ROOT, blockPath)} — rule B (PONG sends nonce when present)`
    : `${path.relative(ROOT, blockPath)} — rule B: PONG without nonce at ${offenders.join(', ')} (kernel will count this as a violation)`);
}

// ── Rule C: EMIT channel not declared in manifest.emits ──────────────────
// Approximate: grep manifest.emits literals (string array) and EMIT-call
// channel literals; warn on any literal channel emitted that isn't declared.
// Misses dynamic channels (computed strings) — those pass silently. The
// goal is to catch the static-typo class of bug, not all of them.
function checkRuleC(blockPath, scripts, isClientBased) {
  // Find ALL string-literal channel references in the manifest's emits[] list.
  const declaredEmits = new Set();
  for (const src of scripts) {
    // Match `emits: [...]` declarations. There may be more than one
    // (e.g. the APP constant + a duplicated bootBlock literal); union them.
    const re = /\bemits\s*:\s*\[([^\]]*)\]/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const inside = m[1];
      const strRe = /["']([a-z0-9._-]+)["']/gi;
      let s;
      while ((s = strRe.exec(inside)) !== null) declaredEmits.add(s[1]);
    }
  }

  // If we found no manifest at all, the block is either standalone-only
  // or the manifest is constructed dynamically. Skip rule C; not our class.
  if (declaredEmits.size === 0) {
    record(true, `${path.relative(ROOT, blockPath)} — rule C (no static manifest, skipped)`);
    return;
  }

  // Find every static channel literal passed to an EMIT-shaped call.
  // Patterns we look for:
  //   nx.emit('channel', ...)
  //   emit('channel', ...)              (block-local helper)
  //   port.postMessage({type:'EMIT', channel:'channel', ...})
  //   nx.request('channel', ...)        (request also EMITs)
  const usedChannels = new Set();
  for (const src of scripts) {
    const r1 = /\b(?:nx\s*\.\s*emit|nx\s*\.\s*request|emit|emitToKernel)\s*\(\s*["']([a-z0-9._-]+)["']/gi;
    let m;
    while ((m = r1.exec(src)) !== null) usedChannels.add(m[1]);

    // postMessage({type:'EMIT', channel:'X'}) — hand-rolled emit
    const r2 = /postMessage\s*\(\s*\{[^}]*\btype\s*:\s*["']EMIT["'][^}]*\bchannel\s*:\s*["']([a-z0-9._-]+)["']/g;
    while ((m = r2.exec(src)) !== null) usedChannels.add(m[1]);
  }

  const undeclared = [];
  for (const ch of usedChannels) {
    // Some channels are kernel-intercepted regardless of manifest:
    // 'nexus.launch' is handled by the kernel directly, 'api.call' goes to
    // the LLM proxy. The kernel still requires them in manifest.emits to
    // route them, but conceptually they're system channels — we only flag
    // them if they're being emitted at all without being declared.
    if (!declaredEmits.has(ch)) undeclared.push(ch);
  }

  const ok = undeclared.length === 0;
  record(ok, ok
    ? `${path.relative(ROOT, blockPath)} — rule C (every emitted channel is declared)`
    : `${path.relative(ROOT, blockPath)} — rule C: emits ${JSON.stringify(undeclared)} but manifest.emits declares ${JSON.stringify([...declaredEmits])}`);
}

// ── Run ──────────────────────────────────────────────────────────────────
const blockDir = path.join(ROOT, 'blocks');
const blocks = findBlocks(blockDir);

for (const blockPath of blocks) {
  const html = fs.readFileSync(blockPath, 'utf8');
  const scripts = extractInlineScripts(html, blockPath);
  if (scripts.length === 0) continue;            // pure-HTML block (e.g. iww-nexus-guide)
  const isClientBased = usesClient(html);
  const isKernel = isKernelHost(html);
  checkRuleA(blockPath, scripts, isClientBased, isKernel);
  checkRuleB(blockPath, scripts, isClientBased);
  checkRuleC(blockPath, scripts, isClientBased);
}

console.log(`CONTRACT SUMMARY pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
