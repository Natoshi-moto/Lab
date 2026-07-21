#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
let pass = 0, fail = 0;
function ok(name, fn){ try{ fn(); pass++; console.log(`PASS sweep15 ${name}`); } catch(e){ fail++; console.error(`FAIL sweep15 ${name} — ${e && e.message ? e.message : e}`); } }
const schema = require('../engines/eidolon-schema.js');
const battle = require('../engines/eidolon-battle-renderer.js');

ok('schema exports full creature, environment, and battle axes', () => {
  assert(schema.CREATURE_AXES.length >= 40);
  assert(schema.ENVIRONMENT_AXES.length >= 32);
  assert(schema.BATTLE_AXES.length >= 40);
});
ok('creature randomizer preserves locked axes', () => {
  const base = schema.createDefaultCreatureSpec(1);
  base.axes.hue_primary = 44; base.locked.hue_primary = true;
  const next = schema.randomizeCreatureSpec(2, base.locked, base);
  assert.strictEqual(next.axes.hue_primary, 44);
});
ok('environment randomizer preserves locked axes', () => {
  const base = schema.createDefaultEnvironmentSpec(1);
  base.axes.sky_top_hue = 77; base.locked.sky_top_hue = true;
  const next = schema.randomizeEnvironmentSpec(2, base.locked, base);
  assert.strictEqual(next.axes.sky_top_hue, 77);
});
ok('canonical specs normalize legacy vals arrays', () => {
  const c = schema.normalizeCreatureSpec({ seed: 3, vals: Array(40).fill(128) });
  const e = schema.normalizeEnvironmentSpec({ seed: 4, vals: Array(32).fill(64) });
  assert.strictEqual(c.axes.body_radius, 128);
  assert.strictEqual(e.axes.sky_top_hue, 64);
});
ok('battle phase helper exposes anticipation strike impact recovery', () => {
  const spec = schema.randomizeAttackSpec(5);
  const phases = battle.getPhases(spec).segments.map(s => s[0]);
  assert.deepStrictEqual(phases, ['ant','str','imp','rec']);
});
ok('battle phase selection is bounded', () => {
  const spec = schema.randomizeAttackSpec(5);
  assert.strictEqual(battle.phaseAt(spec, -1)[0], 'ant');
  assert.strictEqual(battle.phaseAt(spec, 2)[0], 'rec');
});
ok('first contact is engine-backed dual live forge', () => {
  const h = read('blocks/world/first-contact.html');
  assert(h.includes('eidolon-schema.js'));
  assert(h.includes('NexusEidolonCreatureRenderer.drawCreature'));
  assert(h.includes('NexusEidolonEnvironmentRenderer.drawEnvironment'));
  assert(h.includes('system.companion.selected'));
});
ok('first contact still saves creature and world envelopes', () => {
  const h = read('blocks/world/first-contact.html');
  assert(h.includes("buildEnvelope('creature/eidolon-1'"));
  assert(h.includes("buildEnvelope('world'"));
  assert(h.includes('mirrorAtlasWorld(worldEnv)'));
});
ok('environment forge now exposes legacy-style axis controls', () => {
  const h = read('blocks/forges/environment-forge.html');
  assert(h.includes('groupAxes(NexusEidolonSchema.ENVIRONMENT_AXES)'));
  assert(h.includes('axis-label'));
  assert(h.includes('axis-sweep'));
  assert(h.includes('creature-toggle'));
});
ok('environment forge uses shared environment renderer', () => {
  const h = read('blocks/forges/environment-forge.html');
  assert(h.includes('eidolon-environment-renderer.js'));
  assert(h.includes('NexusEidolonEnvironmentRenderer.drawEnvironment'));
  assert(h.includes('preview desktop'));
});
ok('lattice shell now exposes axis locks sweeps and group randomize', () => {
  const h = read('blocks/forges/lattice-shell.html');
  assert(h.includes('axis-lock'));
  assert(h.includes('axis-sweep'));
  assert(h.includes('roll group'));
  assert(h.includes('system.companion.selected'));
});
ok('lattice shell uses shared creature renderer', () => {
  const h = read('blocks/forges/lattice-shell.html');
  assert(h.includes('eidolon-creature-renderer.js'));
  assert(h.includes('NexusEidolonCreatureRenderer.drawCreature'));
});
ok('compose stage is upgraded into battleforge grid not just router', () => {
  const h = read('blocks/forges/compose-stage.html');
  assert(h.includes('NexusEidolonBattleRenderer.drawAttackPreview'));
  assert(h.includes('phase-bar-panel'));
  assert(h.includes('scrubber'));
  assert(h.includes('randomize grid'));
});
ok('compose stage saves selected attacks', () => {
  const h = read('blocks/forges/compose-stage.html');
  assert(h.includes('nexus:selected-attack:v1'));
  assert(h.includes('system.attack.selected'));
  assert(h.includes('eidolon:attack-templates:v1'));
});
ok('OS loads shared Eidolon renderers', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes('engines/eidolon-schema.js'));
  assert(os.includes('engines/eidolon-creature-renderer.js'));
  assert(os.includes('engines/eidolon-environment-renderer.js'));
});
ok('OS has animated environment canvas layer', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes('nx-environment-background'));
  assert(os.includes('liveEnvironmentSpec'));
  assert(os.includes('NexusEidolonEnvironmentRenderer.drawEnvironment'));
});
ok('OS has live companion shell inhabitant', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes('nx-live-companion'));
  assert(os.includes('liveCompanionSpec'));
  assert(os.includes('NexusEidolonCreatureRenderer.drawCreature'));
});
ok('OS consumes companion selected without dead lettering', () => {
  const os = read('Nexus_OS.html');
  assert(os.includes("msg.channel === 'system.companion.selected'"));
  assert(os.includes("localStorage.setItem('nexus:selected-companion:v1'"));
});
ok('Companion accepts canonical axes object selections', () => {
  const c = read('blocks/apps/companion.html');
  assert(c.includes('raw.axes && typeof raw.axes ==='));
  assert(c.includes('raw.payload && raw.payload.axes'));
});
ok('Companion polls same-tab home-note inbox', () => {
  const c = read('blocks/apps/companion.html');
  assert(c.includes('same-tab iframe fallback'));
  assert(c.includes('setInterval(importHomeNoteInbox, 1500)'));
});
ok('webviewer has persistent history stack and real back-forward helpers', () => {
  const w = read('blocks/apps/nexus-webviewer.html');
  assert(w.includes('nx-webviewer-history-v2'));
  assert(w.includes('function goToHistory'));
  assert(w.includes("btn-back').onclick = () => goToHistory"));
  assert(w.includes("btn-fwd').onclick = () => goToHistory"));
});
ok('webviewer treats text searches as search not broken URL', () => {
  const w = read('blocks/apps/nexus-webviewer.html');
  assert(w.includes('duckduckgo.com/?q='));
  assert(w.includes('normalizeUrl'));
});
ok('webviewer shields Delete Backspace in URL bar', () => {
  const w = read('blocks/apps/nexus-webviewer.html');
  assert(w.includes("e.key === 'Delete' || e.key === 'Backspace'"));
  assert(w.includes('e.stopPropagation()'));
});
ok('legacy Eidolon source files remain preserved', () => {
  ['eidolon-forge.html','eidolon-environment-forge.html','eidolon-multiforge.html','eidolon-battleforge.html'].forEach(f => assert(fs.existsSync(path.join(ROOT,'legacy/eidolon-forges',f)), f));
});
ok('channel atlas includes new companion and attack selection channels', () => {
  const atlas = read('docs/CHANNEL_ATLAS.md');
  assert(atlas.includes('system.companion.selected'));
  assert(atlas.includes('system.attack.selected'));
});
console.log(`SWEEP15 SUMMARY pass=${pass} fail=${fail}`);
if (fail) process.exit(1);
