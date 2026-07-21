#!/usr/bin/env node
'use strict';
// pokemon-engine-tests.js
// Tests for pokemon-engine.js that run headless in Node.
// Run: node tests/pokemon-engine-tests.js

// ── Shim browser globals needed by the engine ──────────────────────────────
const { createHash } = require('crypto');

// Node 19+ has globalThis.crypto built in with crypto.subtle.
// For older Node or if subtle is absent, patch just the subtle.digest method.
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  // Define as non-configurable safe assignment via Object.defineProperty
  try {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        subtle: {
          digest: function (algo, bytes) {
            const hash = createHash('sha256').update(Buffer.from(bytes)).digest();
            return Promise.resolve(hash.buffer.slice(hash.byteOffset, hash.byteOffset + hash.byteLength));
          }
        }
      },
      writable: true, configurable: true
    });
  } catch (_) {
    // Already defined by Node runtime with getter — patch subtle only
    globalThis.crypto.subtle = globalThis.crypto.subtle || {
      digest: function (algo, bytes) {
        const hash = createHash('sha256').update(Buffer.from(bytes)).digest();
        return Promise.resolve(hash.buffer.slice(hash.byteOffset, hash.byteOffset + hash.byteLength));
      }
    };
  }
} else if (!globalThis.crypto.subtle || typeof globalThis.crypto.subtle.digest !== 'function') {
  // Patch missing subtle.digest on existing crypto object
  try {
    globalThis.crypto.subtle = {
      digest: function (algo, bytes) {
        const hash = createHash('sha256').update(Buffer.from(bytes)).digest();
        return Promise.resolve(hash.buffer.slice(hash.byteOffset, hash.byteOffset + hash.byteLength));
      }
    };
  } catch (_) {}
}

// TextEncoder shim
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

// Minimal canvas shim (the engine does not call canvas in Node tests)
global.window   = global;
global.document = {
  createElement: function () { return {}; },
  addEventListener: function () {}
};

// Load engine
const PE = require('../engines/pokemon-engine.js');

// ── Test harness ────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function test(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      r.then(function () {
        pass++;
        console.log('PASS pokemon-engine ' + name);
      }).catch(function (e) {
        fail++;
        console.error('FAIL pokemon-engine ' + name + ' — ' + e.message);
      });
    } else {
      pass++;
      console.log('PASS pokemon-engine ' + name);
    }
  } catch (e) {
    fail++;
    console.error('FAIL pokemon-engine ' + name + ' — ' + e.message);
  }
}

const assert = require('assert');

// ── TileCamera ──────────────────────────────────────────────────────────────
test('TileCamera worldToScreen basic', function () {
  var cam = new PE.TileCamera(16);
  cam.x = 0; cam.y = 0;
  var s = cam.worldToScreen(3, 2);
  assert.strictEqual(s.x, 48);
  assert.strictEqual(s.y, 32);
});

test('TileCamera worldToScreen with offset', function () {
  var cam = new PE.TileCamera(16);
  cam.x = 32; cam.y = 16;
  var s = cam.worldToScreen(3, 2);
  assert.strictEqual(s.x, 16);   // 3*16 - 32 = 16
  assert.strictEqual(s.y, 16);   // 2*16 - 16 = 16
});

test('TileCamera centerOn', function () {
  var cam = new PE.TileCamera(16);
  cam.centerOn(10, 10, 320, 240);
  // camera.x = 10*16 - 320/2 + 8 = 160 - 160 + 8 = 8
  // camera.y = 10*16 - 240/2 + 8 = 160 - 120 + 8 = 48
  assert.strictEqual(cam.x, 8);
  assert.strictEqual(cam.y, 48);
});

test('TileCamera screenToTile', function () {
  var cam = new PE.TileCamera(16);
  cam.x = 0; cam.y = 0;
  var t = cam.screenToTile(24, 40);
  assert.strictEqual(t.tileX, 1);  // floor(24/16) = 1
  assert.strictEqual(t.tileY, 2);  // floor(40/16) = 2
});

test('TileCamera getVisibleRange covers viewport', function () {
  var cam = new PE.TileCamera(16);
  cam.x = 0; cam.y = 0;
  var r = cam.getVisibleRange(160, 128);
  assert.ok(r.minX <= 0);
  assert.ok(r.minY <= 0);
  assert.ok(r.maxX >= 10);  // 160/16 = 10
  assert.ok(r.maxY >= 8);   // 128/16 = 8
});

// ── CollisionMap ────────────────────────────────────────────────────────────
var TEST_PALETTE = [
  { id: 0, name: 'passable',   passable: true,  jumpDir: null,    encounters: false, requiresCap: null },
  { id: 1, name: 'blocked',    passable: false, jumpDir: null,    encounters: false, requiresCap: null },
  { id: 2, name: 'tall_grass', passable: true,  jumpDir: null,    encounters: true,  requiresCap: null },
  { id: 3, name: 'water',      passable: false, jumpDir: null,    encounters: false, requiresCap: 'surf' },
  { id: 4, name: 'ledge_s',    passable: true,  jumpDir: 'south', encounters: false, requiresCap: null }
];

function makeCollision(data, w, h) {
  return new PE.CollisionMap(data, w, h, TEST_PALETTE);
}

test('CollisionMap passable tile allows all directions', function () {
  var cmap = makeCollision([0,0,0,0,0,0,0,0,0], 3, 3);
  assert.ok(cmap.canMove(1, 1, 'up'));
  assert.ok(cmap.canMove(1, 1, 'down'));
  assert.ok(cmap.canMove(1, 1, 'left'));
  assert.ok(cmap.canMove(1, 1, 'right'));
});

test('CollisionMap blocked tile denies all directions', function () {
  // 3x3, center passable, surrounded by blocked
  var cmap = makeCollision([1,1,1,1,0,1,1,1,1], 3, 3);
  assert.ok(!cmap.canMove(1, 1, 'up'));
  assert.ok(!cmap.canMove(1, 1, 'down'));
  assert.ok(!cmap.canMove(1, 1, 'left'));
  assert.ok(!cmap.canMove(1, 1, 'right'));
});

test('CollisionMap ledge_s: can move south, not north', function () {
  // Row 0 = passable, Row 1 = ledge_s
  var cmap = makeCollision([0,0,0, 4,4,4, 0,0,0], 3, 3);
  assert.ok(cmap.canMove(1, 0, 'down'),  'should move south into ledge');
  assert.ok(!cmap.canMove(1, 2, 'up'),   'should NOT move north into ledge');
  assert.ok(!cmap.canMove(1, 1, 'left'), 'ledge: crossing east/west is blocked');
});

test('CollisionMap water blocked without surf, open with surf', function () {
  var cmap = makeCollision([0,3], 2, 1);
  assert.ok(!cmap.canMove(0, 0, 'right', []),       'blocked without surf');
  assert.ok(cmap.canMove(0, 0, 'right', ['surf']), 'open with surf');
});

test('CollisionMap out-of-bounds is blocked', function () {
  var cmap = makeCollision([0], 1, 1);
  assert.ok(!cmap.canMove(0, 0, 'up'));
  assert.ok(!cmap.canMove(0, 0, 'left'));
  assert.ok(!cmap.canMove(0, 0, 'right'));
  assert.ok(!cmap.canMove(0, 0, 'down'));
});

test('CollisionMap encounters detected', function () {
  var cmap = makeCollision([2], 1, 1);
  assert.ok(cmap.hasEncounters(0, 0));
});

test('CollisionMap no encounters on passable', function () {
  var cmap = makeCollision([0], 1, 1);
  assert.ok(!cmap.hasEncounters(0, 0));
});

// ── SpriteAtlas ─────────────────────────────────────────────────────────────
test('SpriteAtlas computes framesPerRow correctly', function () {
  // Fake image-like object
  var fakeImg = { width: 64, height: 16 };
  var atlas = new PE.SpriteAtlas(fakeImg, 16, 16);
  assert.strictEqual(atlas.framesPerRow, 4);
  assert.strictEqual(atlas.totalFrames, 4);
});

test('SpriteAtlas frame index wraps with totalFrames', function () {
  var fakeImg = { width: 48, height: 16 };
  var atlas = new PE.SpriteAtlas(fakeImg, 16, 16);
  assert.strictEqual(atlas.totalFrames, 3);
  // No crash on high frame index (wrapping handled in drawFrame)
});

// ── ProjectValidator ─────────────────────────────────────────────────────────
function minimalProject() {
  var ground = new Array(4).fill(1);  // 2x2
  return {
    format: 'pkmaker/1',
    engineVersion: 'eidolon-core-1',
    name: 'Test',
    tileSize: 16,
    tileTerrainPalette: [{ id: 0, name: 'passable', passable: true }],
    maps: [{
      id: 'map_001',
      width: 2, height: 2,
      tileset: 'ts_001',
      layers: {
        ground:   ground.slice(),
        detail:   new Array(4).fill(0),
        terrain:  new Array(4).fill(0),
        overhead: new Array(4).fill(0),
        objects:  []
      },
      events: [], encounters: [],
      connections: { north: null, south: null, east: null, west: null }
    }],
    logicalEvents: [],
    startMap: 'map_001', startX: 0, startY: 0,
    tilesets: [{ id: 'ts_001', name: 'Test', assetRef: 'asset_001', tileW: 16, tileH: 16 }],
    sprites: [], creatures: [], items: [],
    audio: { music: [], effects: [] },
    flags: {}
  };
}

var validator = new PE.ProjectValidator();

test('ProjectValidator valid project passes', function () {
  var r = validator.validate(minimalProject());
  assert.ok(r.valid, 'should be valid; errors: ' + r.errors.join('; '));
  assert.strictEqual(r.errors.length, 0);
});

test('ProjectValidator wrong format fails', function () {
  var p = minimalProject();
  p.format = 'pkmaker/2';
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('format'); }));
});

test('ProjectValidator missing dna fails', function () {
  var p = minimalProject();
  p.creatures = [{ id: 'c1' }];
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('dna'); }));
});

test('ProjectValidator dna wrong length fails', function () {
  var p = minimalProject();
  p.creatures = [{ id: 'c1', dna: [1,2,3] }];
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('exactly 16'); }));
});

test('ProjectValidator dna out of range fails', function () {
  var p = minimalProject();
  p.creatures = [{ id: 'c1', dna: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,300] }];
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('0-255'); }));
});

test('ProjectValidator hues wrong length fails', function () {
  var p = minimalProject();
  p.creatures = [{ id: 'c1', dna: new Array(16).fill(128), hues: [0, 180] }];
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('hues'); }));
});

test('ProjectValidator hues out of range fails', function () {
  var p = minimalProject();
  p.creatures = [{ id: 'c1', dna: new Array(16).fill(128), hues: [0, 180, 400] }];
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('0-359'); }));
});

test('ProjectValidator branch missing default fails', function () {
  var p = minimalProject();
  p.maps[0].events = [{
    id: 'e1', x: 0, y: 0, trigger: 'onEnter',
    commands: [{ cmd: 'branch', on: 'lastResult', cases: {} }]  // no default
  }];
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('"default"'); }));
});

test('ProjectValidator map layer wrong length fails', function () {
  var p = minimalProject();
  p.maps[0].layers.ground = [1, 2, 3];  // should be 4 (2x2)
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('4 elements'); }));
});

test('ProjectValidator tile ID 0 in layer is valid', function () {
  var p = minimalProject();
  p.maps[0].layers.ground = [0, 0, 0, 0];  // all empty - valid
  var r = validator.validate(p);
  assert.ok(r.valid, 'tile ID 0 (empty) should be allowed; errors: ' + r.errors.join('; '));
});

test('ProjectValidator top-level moves array rejected', function () {
  var p = minimalProject();
  p.moves = [{ id: 'tackle', name: 'Tackle' }];
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('"moves"'); }));
});

test('ProjectValidator typeChart rejected', function () {
  var p = minimalProject();
  p.typeChart = { fire: { grass: 2.0 } };
  var r = validator.validate(p);
  assert.ok(!r.valid);
  assert.ok(r.errors.some(function (e) { return e.includes('"typeChart"'); }));
});

test('ProjectValidator dialogue HTML stripped (warning, not error)', function () {
  var p = minimalProject();
  p.maps[0].events = [{
    id: 'e1', x: 0, y: 0, trigger: 'onEnter',
    commands: [{ cmd: 'dialogue', lines: ['<script>alert(1)</script>Hello'] }]
  }];
  var r = validator.validate(p);
  assert.ok(r.valid, 'HTML in dialogue should warn, not error');
  assert.ok(r.warnings.some(function (w) { return w.includes('stripped'); }));
});

test('ProjectValidator non-object input fails gracefully', function () {
  var r = validator.validate(null);
  assert.ok(!r.valid);
  var r2 = validator.validate('not an object');
  assert.ok(!r2.valid);
});

// ── EventExecutor ────────────────────────────────────────────────────────────
test('EventExecutor dialogue sets lastResult for choices', function () {
  var results = [];
  var ex = new PE.EventExecutor({
    onDialogue: function (lines, choices, resolve) {
      // Simulate user picking choice 1
      if (choices) resolve(1);
      else resolve(null);
    }
  });
  return ex.run([
    { cmd: 'dialogue', lines: ['Pick:'], choices: ['A', 'B'] }
  ]).then(function () {
    assert.strictEqual(ex.lastResult, '1');
  });
});

test('EventExecutor dialogue without choices does not set lastResult', function () {
  var ex = new PE.EventExecutor({
    onDialogue: function (lines, choices, resolve) { resolve(null); }
  });
  ex._lastResult = 'previous';
  return ex.run([
    { cmd: 'dialogue', lines: ['Hello'] }  // no choices
  ]).then(function () {
    assert.strictEqual(ex.lastResult, 'previous', 'lastResult should not change');
  });
});

test('EventExecutor branch on lastResult routes correctly', function () {
  var seen = [];
  var ex = new PE.EventExecutor({
    onDialogue: function (lines, choices, resolve) {
      if (choices) resolve(0);  // pick 'Yes'
      else resolve(null);
    },
    onSetFlag: function (flag, val) { seen.push(flag + '=' + val); }
  });
  return ex.run([
    { cmd: 'dialogue', lines: ['Go?'], choices: ['Yes', 'No'] },
    { cmd: 'branch', on: 'lastResult', cases: {
        '0': [{ cmd: 'setFlag', flag: 'went', value: true }],
        '1': [{ cmd: 'setFlag', flag: 'stayed', value: true }]
      },
      default: []
    }
  ]).then(function () {
    assert.ok(seen.includes('went=true'), 'Yes branch should fire; seen: ' + seen);
    assert.ok(!seen.includes('stayed=true'), 'No branch should not fire');
  });
});

test('EventExecutor ifFlag branches on flag value', function () {
  var seen = [];
  var ex = new PE.EventExecutor({
    getFlagValue: function (flag) { return flag === 'unlocked'; },
    onSetFlag: function (flag, val) { seen.push(flag); }
  });
  return ex.run([
    { cmd: 'ifFlag', flag: 'unlocked', cases: {
        'true':  [{ cmd: 'setFlag', flag: 'entered', value: true }],
        'false': [{ cmd: 'setFlag', flag: 'blocked', value: true }]
      },
      default: []
    }
  ]).then(function () {
    assert.ok(seen.includes('entered'));
    assert.ok(!seen.includes('blocked'));
  });
});

test('EventExecutor branch default fires when no case matches', function () {
  var seen = [];
  var ex = new PE.EventExecutor({
    onSetFlag: function (flag) { seen.push(flag); }
  });
  ex._lastResult = 'unknown_result';
  return ex.run([
    { cmd: 'branch', on: 'lastResult', cases: { 'win': [{ cmd: 'setFlag', flag: 'won', value: true }] },
      default: [{ cmd: 'setFlag', flag: 'default_fired', value: true }] }
  ]).then(function () {
    assert.ok(seen.includes('default_fired'), 'default arm should fire');
    assert.ok(!seen.includes('won'));
  });
});

test('EventExecutor command budget halts at 256', function () {
  var count = 0;
  var cmds = [];
  for (var i = 0; i < 300; i++) {
    cmds.push({ cmd: 'setFlag', flag: 'f' + i, value: true });
  }
  var ex = new PE.EventExecutor({
    onSetFlag: function () { count++; }
  });
  return ex.run(cmds).then(function () {
    assert.ok(count <= 256, 'should halt at 256, executed: ' + count);
  });
});

test('EventExecutor re-entrancy depth cap at 8', function () {
  // Each run calls itself recursively via warp callbacks
  var depths = 0;
  function makeDeepCommands(n) {
    return [{ cmd: 'warp', toMap: 'map_' + n, toX: 0, toY: 0 }];
  }
  var ex = new PE.EventExecutor({
    onWarp: function (toMap, toX, toY) {
      depths++;
      if (depths < 20) {
        return ex.run(makeDeepCommands(depths));
      }
    }
  });
  return ex.run(makeDeepCommands(0)).then(function () {
    assert.ok(depths <= 8, 'depth cap should halt recursion; depth: ' + depths);
  });
});

test('EventExecutor warp loop detection halts', function () {
  var warped = [];
  var ex = new PE.EventExecutor({
    onWarp: function (toMap) { warped.push(toMap); }
  });
  return ex.run([
    { cmd: 'warp', toMap: 'map_a', toX: 0, toY: 0 },
    { cmd: 'warp', toMap: 'map_a', toX: 0, toY: 0 }  // same map again → loop
  ]).then(function () {
    assert.strictEqual(warped.length, 1, 'should halt on warp loop; warped: ' + warped);
  });
});

// ── ProjectFormat (async) ────────────────────────────────────────────────────
function makeMemoryHost() {
  var drafts   = {};
  var projects = {};
  var saves    = {};
  return {
    storage: {
      saveDraft:    function (p)  { drafts[p.id] = JSON.parse(JSON.stringify(p)); return Promise.resolve(); },
      loadDraft:    function (id) { return Promise.resolve(JSON.parse(JSON.stringify(drafts[id] || null))); },
      listDrafts:   function ()   { return Promise.resolve(Object.values(drafts).map(function (p) { return { id: p.id, name: p.name, updatedAt: p.updatedAt }; })); },
      saveProject:  function (p)  { projects[p.manifestHash] = JSON.parse(JSON.stringify(p)); return Promise.resolve(); },
      loadProject:  function (mh) { return Promise.resolve(JSON.parse(JSON.stringify(projects[mh] || null))); },
      listProjects: function ()   { return Promise.resolve(Object.values(projects)); },
      saveSave:     function (s)  { saves[s.id] = JSON.parse(JSON.stringify(s)); return Promise.resolve(); },
      loadSave:     function (id) { return Promise.resolve(saves[id] ? JSON.parse(JSON.stringify(saves[id])) : null); },
      listSaves:    function ()   { return Promise.resolve(Object.values(saves)); }
    }
  };
}

test('ProjectFormat computeManifestHash is deterministic', function () {
  var host = makeMemoryHost();
  var pf   = new PE.ProjectFormat(host);
  var proj = minimalProject();
  return pf.computeManifestHash(proj, {}).then(function (h1) {
    return pf.computeManifestHash(proj, {}).then(function (h2) {
      assert.strictEqual(h1, h2, 'same inputs must produce same hash');
      assert.ok(h1.startsWith('sha256:'), 'hash must start with sha256:');
    });
  });
});

test('ProjectFormat computeManifestHash is order-independent for assets', function () {
  var host   = makeMemoryHost();
  var pf     = new PE.ProjectFormat(host);
  var proj   = minimalProject();
  var assets = { 'asset_a': 'sha256:aaa', 'asset_b': 'sha256:bbb' };
  var assets2= { 'asset_b': 'sha256:bbb', 'asset_a': 'sha256:aaa' };
  return pf.computeManifestHash(proj, assets).then(function (h1) {
    return pf.computeManifestHash(proj, assets2).then(function (h2) {
      assert.strictEqual(h1, h2, 'asset key order must not affect hash');
    });
  });
});

test('ProjectFormat saveDraft/loadDraft round-trips', function () {
  var host = makeMemoryHost();
  var pf   = new PE.ProjectFormat(host);
  var proj = minimalProject();
  return pf.saveDraft(proj).then(function (saved) {
    return pf.loadDraft(proj.id).then(function (loaded) {
      assert.strictEqual(loaded.id, proj.id);
      assert.strictEqual(loaded.name, proj.name);
      assert.ok(loaded.updatedAt > 0, 'updatedAt should be set');
    });
  });
});

test('ProjectFormat publishProject writes manifestHash', function () {
  var host = makeMemoryHost();
  var pf   = new PE.ProjectFormat(host);
  var proj = minimalProject();
  return pf.publishProject(proj, {}).then(function (mh) {
    assert.ok(mh.startsWith('sha256:'), 'manifest hash must be sha256:...');
    return host.storage.loadProject(mh).then(function (stored) {
      assert.strictEqual(stored.manifestHash, mh, 'manifestHash must be stored in project');
    });
  });
});

test('ProjectFormat loadGame with matching hash succeeds', function () {
  var host = makeMemoryHost();
  var pf   = new PE.ProjectFormat(host);
  var proj = minimalProject();
  return pf.publishProject(proj, {}).then(function (mh) {
    var save = { id: 'save_001', projectManifestHash: mh, playerName: 'Ash',
                 currentMap: 'map_001', x: 0, y: 0, flags: {}, party: [],
                 inventory: [], badges: [], playtime: 0, savedAt: Date.now() };
    return pf.saveGame(save).then(function (savedSave) {
      return pf.loadGame('save_001', mh).then(function (loaded) {
        assert.strictEqual(loaded.id, 'save_001');
      });
    });
  });
});

test('ProjectFormat loadGame with mismatched hash throws MismatchError', function () {
  var host = makeMemoryHost();
  var pf   = new PE.ProjectFormat(host);
  var save = { id: 'save_bad', projectManifestHash: 'sha256:oldversion',
               playerName: 'Ash', currentMap: 'map_001', x: 0, y: 0,
               flags: {}, party: [], inventory: [], badges: [],
               playtime: 0, savedAt: Date.now() };
  host.storage.saves = { save_bad: save };
  // inject directly since saveGame would overwrite savedAt
  host.storage.saveSave(save);
  return pf.loadGame('save_bad', 'sha256:newversion').then(function () {
    throw new Error('should have thrown');
  }).catch(function (err) {
    assert.strictEqual(err.name, 'MismatchError');
    assert.ok(err.message.includes('Migration required'));
  });
});

test('ProjectFormat computeSaveId is deterministic and sha256 prefixed', function () {
  var host = makeMemoryHost();
  var pf   = new PE.ProjectFormat(host);
  return pf.computeSaveId('sha256:abc123', 'Ash').then(function (id1) {
    return pf.computeSaveId('sha256:abc123', 'Ash').then(function (id2) {
      assert.strictEqual(id1, id2);
      assert.ok(id1.startsWith('sha256:'));
    });
  });
});

// ── Summary ──────────────────────────────────────────────────────────────────
// The async tests resolve via Promises — wait for event loop drain
setTimeout(function () {
  console.log('POKEMON-ENGINE SUMMARY pass=' + pass + ' fail=' + fail);
  process.exitCode = fail ? 1 : 0;
}, 1000);
