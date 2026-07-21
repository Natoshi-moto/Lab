/* pokemon-engine.js — Nexus Pokémon-style RPG engine v0.1.0
   Pure JS library. No imports. No build step. Works from file://.
   Runs identically in standalone HTML and Nexus block contexts.

   The engine calls nothing outside a Host object injected at init.
   All storage, input, audio, and wallet access goes through Host.

   Exposed: window.PokemonEngine (also module.exports in Node for tests)

   Classes (all accessible via PokemonEngine.*):
     TileCamera       — viewport math, world↔screen coordinate transforms
     TileRenderer     — Canvas 2D layered tile drawing with culling
     SpriteAtlas      — sprite sheet frame slicing and animation
     CollisionMap     — terrain palette passability and ledge checks
     InputManager     — keyboard + canvas-relative touch D-pad
     AudioEngine      — Web Audio API wrapper, handles suspended state
     DialogueEngine   — canvas-rendered Pokémon-style text boxes
     EventExecutor    — async command queue with yield points + guards
     ProjectValidator — strict schema validation before engine contact
     ProjectFormat    — manifest hash, draft/project/save persistence via Host

   Engine version must match battle-engine.js ENGINE_VERSION for battle
   verification to work in integrated mode. */

(function (root) {
  'use strict';

  // ─────────────────────────────────────────────────
  // TileCamera
  // Tracks camera position in world-pixel space.
  // tileSize: pixels per tile (must be power of 2).
  // ─────────────────────────────────────────────────
  function TileCamera(tileSize) {
    this.x = 0;          // camera world-pixel position (top-left of viewport)
    this.y = 0;
    this.tileSize = tileSize;
  }

  TileCamera.prototype.centerOn = function (tileX, tileY, canvasW, canvasH) {
    this.x = Math.round(tileX * this.tileSize - canvasW / 2 + this.tileSize / 2);
    this.y = Math.round(tileY * this.tileSize - canvasH / 2 + this.tileSize / 2);
  };

  TileCamera.prototype.worldToScreen = function (tileX, tileY) {
    return {
      x: Math.round(tileX * this.tileSize - this.x),
      y: Math.round(tileY * this.tileSize - this.y)
    };
  };

  TileCamera.prototype.screenToTile = function (screenX, screenY) {
    return {
      tileX: Math.floor((screenX + this.x) / this.tileSize),
      tileY: Math.floor((screenY + this.y) / this.tileSize)
    };
  };

  TileCamera.prototype.getVisibleRange = function (canvasW, canvasH) {
    var ts = this.tileSize;
    return {
      minX: Math.floor(this.x / ts) - 1,
      minY: Math.floor(this.y / ts) - 1,
      maxX: Math.ceil((this.x + canvasW) / ts) + 1,
      maxY: Math.ceil((this.y + canvasH) / ts) + 1
    };
  };


  // ─────────────────────────────────────────────────
  // TileRenderer
  // Draws tile layers to a Canvas 2D context.
  // Tile ID 0 is always empty/transparent — skipped.
  // Tile IDs are 1-indexed into the tileset image.
  // ─────────────────────────────────────────────────
  function TileRenderer(canvas, tileSize) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = tileSize;
    this._tilesets = {};   // id → { image, tilesPerRow }
  }

  TileRenderer.prototype.loadTileset = function (id, image) {
    this._tilesets[id] = {
      image: image,
      tilesPerRow: Math.max(1, Math.floor(image.width / this.tileSize))
    };
  };

  TileRenderer.prototype.clear = function (color) {
    var ctx = this.ctx;
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  };

  TileRenderer.prototype.drawLayer = function (layer, mapWidth, mapHeight, tilesetId, camera) {
    var ts = this._tilesets[tilesetId];
    if (!ts) return;

    var image = ts.image;
    var tilesPerRow = ts.tilesPerRow;
    var tileSize = this.tileSize;
    var ctx = this.ctx;
    var canvasW = this.canvas.width;
    var canvasH = this.canvas.height;
    var range = camera.getVisibleRange(canvasW, canvasH);

    var minX = Math.max(0, range.minX);
    var minY = Math.max(0, range.minY);
    var maxX = Math.min(mapWidth - 1, range.maxX);
    var maxY = Math.min(mapHeight - 1, range.maxY);

    for (var ty = minY; ty <= maxY; ty++) {
      for (var tx = minX; tx <= maxX; tx++) {
        var tileId = layer[ty * mapWidth + tx];
        if (!tileId || tileId === 0) continue;  // 0 = empty/transparent

        var idx = tileId - 1;  // 1-indexed → 0-indexed
        var srcX = (idx % tilesPerRow) * tileSize;
        var srcY = Math.floor(idx / tilesPerRow) * tileSize;
        var pos = camera.worldToScreen(tx, ty);

        ctx.drawImage(image, srcX, srcY, tileSize, tileSize,
                      pos.x, pos.y, tileSize, tileSize);
      }
    }
  };

  // Draw a single sprite frame at screen position
  TileRenderer.prototype.drawSprite = function (atlas, frameIndex, screenX, screenY) {
    if (!atlas) return;
    atlas.drawFrame(this.ctx, frameIndex, screenX, screenY);
  };


  // ─────────────────────────────────────────────────
  // SpriteAtlas
  // Slices a sprite sheet into individually addressable frames.
  // Frames are indexed left-to-right, top-to-bottom from 0.
  // ─────────────────────────────────────────────────
  function SpriteAtlas(image, frameW, frameH) {
    this.image = image;
    this.frameW = frameW;
    this.frameH = frameH;
    this.framesPerRow = Math.max(1, Math.floor(image.width / frameW));
    this.totalFrames = this.framesPerRow * Math.max(1, Math.floor(image.height / frameH));
  }

  SpriteAtlas.prototype.drawFrame = function (ctx, frameIndex, destX, destY) {
    var fi = ((frameIndex % this.totalFrames) + this.totalFrames) % this.totalFrames;
    var srcX = (fi % this.framesPerRow) * this.frameW;
    var srcY = Math.floor(fi / this.framesPerRow) * this.frameH;
    ctx.drawImage(this.image, srcX, srcY, this.frameW, this.frameH,
                  Math.round(destX), Math.round(destY), this.frameW, this.frameH);
  };

  SpriteAtlas.prototype.drawAnimation = function (ctx, frames, tick, destX, destY) {
    if (!frames || frames.length === 0) return;
    var frameIndex = frames[tick % frames.length];
    this.drawFrame(ctx, frameIndex, destX, destY);
  };


  // ─────────────────────────────────────────────────
  // CollisionMap
  // Terrain-palette-based passability checks.
  // Palette entries: { passable, jumpDir, requiresCap, encounters, ... }
  // jumpDir: the ONE direction you can move THROUGH this tile.
  //   'south' = ledge you can jump down (enter moving south only)
  // ─────────────────────────────────────────────────
  function CollisionMap(terrainLayer, mapWidth, mapHeight, terrainPalette) {
    this.layer = terrainLayer;
    this.width = mapWidth;
    this.height = mapHeight;
    this.palette = terrainPalette;
    this._oob = { id: -1, name: 'oob', passable: false, jumpDir: null,
                  encounters: false, animation: null, requiresCap: null };
  }

  CollisionMap.prototype.getTerrainAt = function (tileX, tileY) {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return this._oob;
    }
    var idx = this.layer[tileY * this.width + tileX];
    return this.palette[idx] || this._oob;
  };

  // direction: 'up' | 'down' | 'left' | 'right'
  // capabilities: string[] e.g. ['surf', 'cut']
  CollisionMap.prototype.canMove = function (fromX, fromY, direction, capabilities) {
    capabilities = capabilities || [];
    var dx = direction === 'right' ? 1 : direction === 'left' ? -1 : 0;
    var dy = direction === 'down'  ? 1 : direction === 'up'   ? -1 : 0;
    var toX = fromX + dx;
    var toY = fromY + dy;

    var terrain = this.getTerrainAt(toX, toY);

    // Capability-gated terrain (e.g. water requires 'surf')
    if (!terrain.passable) {
      if (terrain.requiresCap && capabilities.indexOf(terrain.requiresCap) !== -1) return true;
      return false;
    }

    // Ledge direction check: jumpDir is the direction you CAN cross this tile
    if (terrain.jumpDir) {
      var dirToCompass = { up: 'north', down: 'south', left: 'west', right: 'east' };
      if (dirToCompass[direction] !== terrain.jumpDir) return false;
    }

    // Capability requirement on passable terrain (e.g. tall grass with cut)
    if (terrain.requiresCap && capabilities.indexOf(terrain.requiresCap) === -1) return false;

    return true;
  };

  CollisionMap.prototype.hasEncounters = function (tileX, tileY) {
    return this.getTerrainAt(tileX, tileY).encounters === true;
  };


  // ─────────────────────────────────────────────────
  // InputManager
  // Tracks keyboard state and renders a canvas touch D-pad.
  // Touch zones are recomputed each frame when drawOverlay is called.
  // getState() returns { up, down, left, right, interact, cancel }.
  // ─────────────────────────────────────────────────
  function InputManager(canvas) {
    this.canvas = canvas;
    this._kbd = { up: false, down: false, left: false, right: false,
                  interact: false, cancel: false };
    this._touch = { up: false, down: false, left: false, right: false,
                    interact: false, cancel: false };
    this._zones = null;
    this._activeTouches = {};  // identifier → zoneName
    this._bindKeyboard();
    this._bindTouch();
  }

  var KEY_MAP = {
    'w': 'up',      'arrowup': 'up',
    's': 'down',    'arrowdown': 'down',
    'a': 'left',    'arrowleft': 'left',
    'd': 'right',   'arrowright': 'right',
    'z': 'interact','enter': 'interact',
    'x': 'cancel',  'escape': 'cancel'
  };

  InputManager.prototype._bindKeyboard = function () {
    var self = this;
    document.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      if (KEY_MAP[k]) { self._kbd[KEY_MAP[k]] = true; e.preventDefault(); }
    });
    document.addEventListener('keyup', function (e) {
      var k = e.key.toLowerCase();
      if (KEY_MAP[k]) { self._kbd[KEY_MAP[k]] = false; }
    });
  };

  InputManager.prototype._getCanvasPos = function (touch) {
    var rect = this.canvas.getBoundingClientRect();
    var sx = this.canvas.width / rect.width;
    var sy = this.canvas.height / rect.height;
    return { x: (touch.clientX - rect.left) * sx,
             y: (touch.clientY - rect.top)  * sy };
  };

  InputManager.prototype._hitZone = function (pos) {
    if (!this._zones) return null;
    var zones = this._zones;
    for (var name in zones) {
      var z = zones[name];
      if (pos.x >= z.x && pos.x <= z.x + z.w &&
          pos.y >= z.y && pos.y <= z.y + z.h) return name;
    }
    return null;
  };

  InputManager.prototype._bindTouch = function () {
    var self = this;

    this.canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var zone = self._hitZone(self._getCanvasPos(t));
        if (zone) { self._activeTouches[t.identifier] = zone; self._touch[zone] = true; }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', function (e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var zone = self._activeTouches[t.identifier];
        if (zone) { delete self._activeTouches[t.identifier]; self._touch[zone] = false; }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var oldZone = self._activeTouches[t.identifier];
        var newZone = self._hitZone(self._getCanvasPos(t));
        if (oldZone !== newZone) {
          if (oldZone) self._touch[oldZone] = false;
          if (newZone) { self._activeTouches[t.identifier] = newZone; self._touch[newZone] = true; }
          else delete self._activeTouches[t.identifier];
        }
      }
    }, { passive: false });
  };

  InputManager.prototype.getState = function () {
    var k = this._kbd, t = this._touch;
    return {
      up:       k.up       || t.up,
      down:     k.down     || t.down,
      left:     k.left     || t.left,
      right:    k.right    || t.right,
      interact: k.interact || t.interact,
      cancel:   k.cancel   || t.cancel
    };
  };

  // Draw the touch D-pad overlay and update touch zones for hit testing.
  // Call once per frame before reading getState() for touch input.
  InputManager.prototype.drawOverlay = function (ctx, canvasW, canvasH) {
    var s = Math.min(canvasW, canvasH);
    var dpadOuter = Math.round(s * 0.22);
    var cell = Math.round(dpadOuter / 3);
    var pad = 14;
    var dpadX = pad;
    var dpadY = canvasH - dpadOuter - pad;

    var up    = { x: dpadX + cell,     y: dpadY,          w: cell, h: cell };
    var down  = { x: dpadX + cell,     y: dpadY + cell*2, w: cell, h: cell };
    var left  = { x: dpadX,            y: dpadY + cell,   w: cell, h: cell };
    var right = { x: dpadX + cell*2,   y: dpadY + cell,   w: cell, h: cell };
    var center= { x: dpadX + cell,     y: dpadY + cell,   w: cell, h: cell };

    var btnR  = Math.round(cell * 0.45);
    var btnX  = canvasW - pad - cell * 2;
    var btnY  = canvasH - pad - cell * 2;
    var aBtn  = { x: btnX + cell, y: btnY + cell, w: cell, h: cell };
    var bBtn  = { x: btnX,        y: btnY,        w: cell, h: cell };

    this._zones = { up: up, down: down, left: left, right: right,
                    interact: aBtn, cancel: bBtn };

    var t = this._touch;
    ctx.save();
    ctx.globalAlpha = 0.42;

    // D-pad cells
    var cells = [
      { z: up,     active: t.up,       label: '▲' },
      { z: down,   active: t.down,     label: '▼' },
      { z: left,   active: t.left,     label: '◀' },
      { z: right,  active: t.right,    label: '▶' },
      { z: center, active: false,      label: '' }
    ];
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      ctx.fillStyle = c.active ? '#9b8cff' : '#131722';
      ctx.strokeStyle = '#273044';
      ctx.lineWidth = 1;
      ctx.fillRect(c.z.x, c.z.y, c.z.w, c.z.h);
      ctx.strokeRect(c.z.x, c.z.y, c.z.w, c.z.h);
      if (c.label) {
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = '#e9eefc';
        ctx.font = Math.round(cell * 0.45) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.label, c.z.x + c.z.w / 2, c.z.y + c.z.h / 2);
        ctx.globalAlpha = 0.42;
      }
    }

    // Action buttons (circles)
    var btns = [
      { z: aBtn, active: t.interact, color: '#4ade80', label: 'A' },
      { z: bBtn, active: t.cancel,   color: '#fb7185', label: 'B' }
    ];
    for (var j = 0; j < btns.length; j++) {
      var btn = btns[j];
      var cx = btn.z.x + btn.z.w / 2;
      var cy = btn.z.y + btn.z.h / 2;
      ctx.fillStyle = btn.active ? btn.color : '#131722';
      ctx.strokeStyle = btn.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, btnR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#e9eefc';
      ctx.font = 'bold ' + Math.round(cell * 0.4) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, cx, cy);
      ctx.globalAlpha = 0.42;
    }

    ctx.restore();
  };


  // ─────────────────────────────────────────────────
  // AudioEngine
  // Thin Web Audio wrapper. Handles suspended AudioContext.
  // Must call resume() on first user gesture.
  // generateTone() creates a PCM buffer for testing without asset files.
  // ─────────────────────────────────────────────────
  function AudioEngine() {
    this._ctx = null;
    this._master = null;
    this._musicSrc = null;
    this._volume = 0.7;
  }

  AudioEngine.prototype._init = function () {
    if (!this._ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      this._ctx = new AC();
      this._master = this._ctx.createGain();
      this._master.gain.value = this._volume;
      this._master.connect(this._ctx.destination);
    }
    return true;
  };

  AudioEngine.prototype.resume = function () {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(function () {});
    }
  };

  AudioEngine.prototype.playMusic = function (buffer, loop) {
    if (!buffer || !this._init()) return;
    this.resume();
    if (this._musicSrc) {
      try { this._musicSrc.stop(); } catch (_) {}
    }
    var gainNode = this._ctx.createGain();
    gainNode.gain.value = 0.55;
    gainNode.connect(this._master);
    this._musicSrc = this._ctx.createBufferSource();
    this._musicSrc.buffer = buffer;
    this._musicSrc.loop = loop !== false;
    this._musicSrc.connect(gainNode);
    this._musicSrc.start();
  };

  AudioEngine.prototype.playEffect = function (buffer) {
    if (!buffer || !this._init()) return;
    this.resume();
    var src = this._ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this._master);
    src.start();
  };

  AudioEngine.prototype.stop = function () {
    if (this._musicSrc) {
      try { this._musicSrc.stop(); } catch (_) {}
      this._musicSrc = null;
    }
  };

  AudioEngine.prototype.setVolume = function (level) {
    this._volume = Math.max(0, Math.min(1, Number(level) || 0));
    if (this._master) this._master.gain.value = this._volume;
  };

  // Generate a simple beep buffer for testing (no asset files needed)
  AudioEngine.prototype.generateTone = function (freq, duration, type) {
    if (!this._init()) return null;
    var ctx = this._ctx;
    var rate = ctx.sampleRate;
    var len  = Math.floor(rate * (duration || 0.08));
    var buf  = ctx.createBuffer(1, len, rate);
    var data = buf.getChannelData(0);
    var f    = freq || 440;
    var wt   = type || 'square';
    for (var i = 0; i < len; i++) {
      var t = i / rate;
      var env = Math.max(0, 1 - t / (duration || 0.08));
      var raw = wt === 'square'
        ? (Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1)
        : Math.sin(2 * Math.PI * f * t);
      data[i] = raw * env * 0.18;
    }
    return buf;
  };


  // ─────────────────────────────────────────────────
  // DialogueEngine
  // Canvas-rendered Pokémon-style dialogue box.
  // Text appears character-by-character.
  // Choices render as a selectable list.
  //
  // Usage:
  //   dialogue.show(['Hello!', 'How are you?'], null, cb)
  //   dialogue.show(['Pick one:'], ['Yes','No'], cb) → cb(choiceIndex)
  //
  // Call update() once per frame, draw() after all other rendering,
  // handleInput() with current and previous input state each frame.
  // ─────────────────────────────────────────────────
  function DialogueEngine(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._active = false;
    this._lines = [];
    this._choices = null;
    this._lineIdx = 0;
    this._charIdx = 0;
    this._selectedChoice = 0;
    this._callback = null;
    this._animTick = 0;
    this._waitInput = false;
    this._waitChoice = false;
  }

  Object.defineProperty(DialogueEngine.prototype, 'isActive', {
    get: function () { return this._active; }
  });

  DialogueEngine.prototype.show = function (lines, choices, callback) {
    this._active        = true;
    this._lines         = lines || [];
    this._choices       = (choices && choices.length) ? choices : null;
    this._callback      = callback || null;
    this._lineIdx       = 0;
    this._charIdx       = 0;
    this._selectedChoice= 0;
    this._animTick      = 0;
    this._waitInput     = false;
    this._waitChoice    = false;
  };

  DialogueEngine.prototype.update = function () {
    if (!this._active || this._waitInput || this._waitChoice) return;
    this._charIdx++;
    this._animTick++;
    var line = this._lines[this._lineIdx] || '';
    if (this._charIdx >= line.length) {
      this._charIdx = line.length;
      this._waitInput = true;
    }
  };

  DialogueEngine.prototype.handleInput = function (now, prev) {
    if (!this._active) return false;

    var justDown = function (k) { return now[k] && !prev[k]; };

    if (this._waitChoice) {
      if (justDown('up'))       this._selectedChoice = Math.max(0, this._selectedChoice - 1);
      if (justDown('down'))     this._selectedChoice = Math.min((this._choices || []).length - 1, this._selectedChoice + 1);
      if (justDown('interact')) {
        var chosen = this._selectedChoice;
        this._active = false;
        if (this._callback) this._callback(chosen);
      }
      this._animTick++;
      return true;
    }

    if (this._waitInput) {
      // Holding interact skips to full text display
      if (now.interact && !justDown('interact')) {
        this._charIdx = (this._lines[this._lineIdx] || '').length;
      }
      if (justDown('interact')) {
        this._lineIdx++;
        if (this._lineIdx >= this._lines.length) {
          if (this._choices) {
            this._waitInput  = false;
            this._waitChoice = true;
          } else {
            this._active = false;
            if (this._callback) this._callback(null);
          }
        } else {
          this._charIdx   = 0;
          this._waitInput = false;
        }
        this._animTick++;
        return true;
      }
    }

    // Speed up text crawl when holding interact
    if (now.interact && !this._waitInput && !this._waitChoice) {
      this._charIdx = Math.min(this._charIdx + 3,
                               (this._lines[this._lineIdx] || '').length);
    }

    this._animTick++;
    return true;  // consume all input while dialogue is active
  };

  DialogueEngine.prototype.draw = function () {
    if (!this._active) return;

    var ctx  = this.ctx;
    var cw   = this.canvas.width;
    var ch   = this.canvas.height;
    var boxH = Math.round(ch * 0.28);
    var boxY = ch - boxH - 6;
    var boxX = 6;
    var boxW = cw - 12;
    var pad  = 10;
    var fontSize = Math.max(9, Math.round(Math.min(cw, ch) * 0.044));
    var lineH    = fontSize + 5;

    ctx.save();

    // Outer black border
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(boxX - 2, boxY - 2, boxW + 4, boxH + 4);

    // White border strip
    ctx.fillStyle = '#e9eefc';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Inner dark background
    ctx.fillStyle = '#131722';
    ctx.fillRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6);

    ctx.fillStyle = '#e9eefc';
    ctx.font = fontSize + 'px "Courier New",Courier,monospace';
    ctx.textBaseline = 'top';

    var innerX = boxX + pad;
    var innerY = boxY + pad;
    var maxW   = boxW - pad * 2;

    if (!this._waitChoice) {
      var line = (this._lines[this._lineIdx] || '').slice(0, this._charIdx);
      var y    = innerY;

      // Simple word-wrap
      var words = line.split(' ');
      var cur   = '';
      for (var i = 0; i < words.length; i++) {
        var word = words[i];
        var test = cur ? (cur + ' ' + word) : word;
        if (ctx.measureText(test).width > maxW && cur) {
          ctx.fillText(cur, innerX, y);
          y += lineH;
          cur = word;
        } else {
          cur = test;
        }
      }
      if (cur) ctx.fillText(cur, innerX, y);

      // Blinking cursor arrow
      if (this._waitInput && Math.floor(this._animTick / 14) % 2 === 0) {
        ctx.fillText('▼', boxX + boxW - pad - fontSize,
                         boxY + boxH - pad - fontSize);
      }

    } else {
      // Choice menu
      var prompt = (this._lines[this._lines.length - 1] || '');
      ctx.fillText(prompt, innerX, innerY);

      var choices = this._choices || [];
      for (var ci = 0; ci < choices.length; ci++) {
        var cy = innerY + lineH + ci * lineH;
        if (ci === this._selectedChoice) {
          ctx.fillStyle = '#9b8cff';
          ctx.fillText('▶', innerX, cy);
        }
        ctx.fillStyle = '#e9eefc';
        ctx.fillText(choices[ci], innerX + fontSize + 4, cy);
      }
    }

    ctx.restore();
  };


  // ─────────────────────────────────────────────────
  // EventExecutor
  // Async command queue with yield points and safety guards.
  // NOT a general VM — a queue with a switch and fixed yield primitives.
  //
  // Termination guards:
  //   1. 256-command budget per run() call
  //   2. Max re-entrancy depth 8
  //   3. Warp-loop detection (same mapId twice → halt)
  //
  // lastResult: single slot, written only by yield-point commands
  // that produce a result (dialogue+choices, startBattle).
  // Non-yielding commands never touch it.
  //
  // Callbacks (all optional, stubs return safe defaults):
  //   onDialogue(lines, choices, resolve)   → resolve(choiceIndex or null)
  //   onBattle(creatureId, resolve)         → resolve('win'|'lose'|'flee')
  //   onWarp(toMap, toX, toY)              → Promise or void
  //   onSetFlag(flag, value)
  //   getFlagValue(flag)                   → any
  //   onGiveItem(itemId)                   → Promise or void
  //   onGiveCreature(creatureId)           → Promise or void
  //   onRemoveItem(itemId)
  //   onCatch(creatureId)                  → Promise or void
  //   onPlayMusic(trackId)
  //   onPlayEffect(soundId)
  //   onUnlockBadge(badgeId)
  // ─────────────────────────────────────────────────
  function EventExecutor(callbacks) {
    this._cb   = callbacks || {};
    this._depth = 0;
    this._lastResult = null;
    this._warpHistory = [];
  }

  Object.defineProperty(EventExecutor.prototype, 'lastResult', {
    get: function () { return this._lastResult; }
  });

  EventExecutor.prototype.run = function (commands, _ctx) {
    var self = this;
    _ctx = _ctx || {};

    if (self._depth >= 8) {
      console.warn('[EventExecutor] max re-entrancy depth (8) reached — halting');
      return Promise.resolve();
    }

    self._depth++;
    var budget = 256;
    var warpHistory = _ctx.warpHistory ? _ctx.warpHistory.slice() : self._warpHistory.slice();

    function next(i) {
      if (i >= commands.length) return Promise.resolve();
      if (budget-- <= 0) {
        console.warn('[EventExecutor] command budget (256) exhausted — halting');
        return Promise.resolve();
      }

      var cmd = commands[i];
      return self._exec(cmd, warpHistory).then(function (halt) {
        if (halt === '__HALT__') return;
        return next(i + 1);
      });
    }

    return next(0).then(function () {
      self._depth--;
    }, function (err) {
      self._depth--;
      console.warn('[EventExecutor] error during command execution:', err && err.message || err);
    });
  };

  EventExecutor.prototype._exec = function (cmd, warpHistory) {
    var self = this;
    var cb   = self._cb;

    switch (cmd.cmd) {

      case 'dialogue':
        return new Promise(function (resolve) {
          if (cb.onDialogue) {
            cb.onDialogue(cmd.lines || [], cmd.choices || null, function (result) {
              if (cmd.choices && cmd.choices.length > 0) {
                self._lastResult = String(result !== null && result !== undefined ? result : '0');
              }
              resolve(null);
            });
          } else {
            resolve(null);
          }
        });

      case 'branch': {
        var key = cmd.on === 'lastResult' ? self._lastResult : String(cmd.on);
        var chosen = (cmd.cases && cmd.cases[key]) || cmd.default || [];
        return self.run(chosen, { warpHistory: warpHistory });
      }

      case 'ifFlag': {
        var val = cb.getFlagValue ? cb.getFlagValue(cmd.flag) : false;
        var branch = (cmd.cases && cmd.cases[String(val)]) || cmd.default || [];
        return self.run(branch, { warpHistory: warpHistory });
      }

      case 'setFlag':
        if (cb.onSetFlag) cb.onSetFlag(cmd.flag, cmd.value);
        return Promise.resolve();

      case 'giveItem':
        return Promise.resolve(cb.onGiveItem ? cb.onGiveItem(cmd.itemId) : null);

      case 'giveCreature':
        return Promise.resolve(cb.onGiveCreature ? cb.onGiveCreature(cmd.creatureId) : null);

      case 'removeItem':
        if (cb.onRemoveItem) cb.onRemoveItem(cmd.itemId);
        return Promise.resolve();

      case 'startBattle':
        return new Promise(function (resolve) {
          if (cb.onBattle) {
            cb.onBattle(cmd.creatureId, function (result) {
              self._lastResult = result || 'flee';
              resolve(null);
            });
          } else {
            self._lastResult = 'flee';
            resolve(null);
          }
        });

      case 'catch':
        return Promise.resolve(cb.onCatch ? cb.onCatch(cmd.creatureId) : null);

      case 'warp':
        if (warpHistory.indexOf(cmd.toMap) !== -1) {
          console.warn('[EventExecutor] warp loop detected (' + cmd.toMap + ') — halting');
          return Promise.resolve('__HALT__');
        }
        warpHistory.push(cmd.toMap);
        return Promise.resolve(cb.onWarp ? cb.onWarp(cmd.toMap, cmd.toX, cmd.toY) : null);

      case 'playMusic':
        if (cb.onPlayMusic) cb.onPlayMusic(cmd.trackId);
        return Promise.resolve();

      case 'playEffect':
        if (cb.onPlayEffect) cb.onPlayEffect(cmd.soundId);
        return Promise.resolve();

      case 'wait':
        return new Promise(function (resolve) {
          setTimeout(resolve, Math.round((cmd.frames || 60) * (1000 / 60)));
        });

      case 'unlockBadge':
        if (cb.onUnlockBadge) cb.onUnlockBadge(cmd.badgeId);
        return Promise.resolve();

      default:
        console.warn('[EventExecutor] unknown command:', cmd.cmd);
        return Promise.resolve();
    }
  };


  // ─────────────────────────────────────────────────
  // ProjectValidator
  // Validates project JSON before it touches the engine.
  // Returns { valid, errors[], warnings[] }.
  // ─────────────────────────────────────────────────
  function ProjectValidator() {}

  ProjectValidator.prototype.validate = function (project) {
    var errors = [], warnings = [];
    var e = errors, w = warnings;

    if (!project || typeof project !== 'object' || Array.isArray(project)) {
      return { valid: false, errors: ['project must be a plain object'], warnings: [] };
    }

    if (project.format !== 'pkmaker/1')
      e.push('format must be "pkmaker/1"');

    if (!project.engineVersion || typeof project.engineVersion !== 'string')
      e.push('engineVersion must be a non-empty string');

    if (!project.name || typeof project.name !== 'string')
      e.push('name must be a non-empty string');

    var ts = project.tileSize;
    if (!Number.isInteger(ts) || ts <= 0 || (ts & (ts - 1)) !== 0)
      e.push('tileSize must be a positive power of 2 (e.g. 8, 16, 32)');

    // Forbidden legacy fields
    if (project.moves)     e.push('"moves" array is not valid in pkmaker/1 — moves are derived from DNA by the engine');
    if (project.typeChart) e.push('"typeChart" is not valid in pkmaker/1 — type effectiveness is engine-internal');

    // Terrain palette
    if (!Array.isArray(project.tileTerrainPalette) || project.tileTerrainPalette.length === 0)
      e.push('tileTerrainPalette must be a non-empty array');

    // Maps
    if (!Array.isArray(project.maps) || project.maps.length === 0) {
      e.push('maps must be a non-empty array');
    } else {
      for (var mi = 0; mi < project.maps.length; mi++) {
        var m = project.maps[mi];
        var mp = 'maps[' + mi + ']';
        if (!m.id)   e.push(mp + '.id required');
        if (!Number.isInteger(m.width)  || m.width  < 1 || m.width  > 256) e.push(mp + '.width must be 1-256');
        if (!Number.isInteger(m.height) || m.height < 1 || m.height > 256) e.push(mp + '.height must be 1-256');

        var expectedLen = (m.width || 0) * (m.height || 0);
        var layerNames  = ['ground', 'detail', 'terrain', 'overhead'];
        for (var li = 0; li < layerNames.length; li++) {
          var ln    = layerNames[li];
          var layer = m.layers && m.layers[ln];
          if (!Array.isArray(layer)) {
            e.push(mp + '.layers.' + ln + ' must be an array');
          } else if (layer.length !== expectedLen) {
            e.push(mp + '.layers.' + ln + ' must have ' + expectedLen +
                   ' elements (' + m.width + '×' + m.height + '), got ' + layer.length);
          }
        }

        if (Array.isArray(m.events)) {
          for (var ei = 0; ei < m.events.length; ei++) {
            var evt = m.events[ei];
            var ep  = mp + '.events[' + ei + ']';
            if (!evt.id) e.push(ep + '.id required');
            if (['onEnter','onEnterOnce','onInteract'].indexOf(evt.trigger) === -1)
              e.push(ep + '.trigger must be onEnter, onEnterOnce, or onInteract');
            if (!Number.isInteger(evt.x) || !Number.isInteger(evt.y))
              e.push(ep + ' x/y must be integers');
            if (Array.isArray(evt.commands))
              this._validateCommands(evt.commands, ep, e, w);
          }
        }
      }
    }

    // Creatures
    if (Array.isArray(project.creatures)) {
      for (var ci = 0; ci < project.creatures.length; ci++) {
        var c   = project.creatures[ci];
        var cp  = 'creatures[' + ci + ']';
        if (!c.id) e.push(cp + '.id required');

        if (!Array.isArray(c.dna)) {
          e.push(cp + '.dna must be an array of exactly 16 integers (0-255)');
        } else {
          if (c.dna.length !== 16)
            e.push(cp + '.dna must have exactly 16 elements, got ' + c.dna.length);
          for (var di = 0; di < c.dna.length; di++) {
            if (!Number.isInteger(c.dna[di]) || c.dna[di] < 0 || c.dna[di] > 255)
              e.push(cp + '.dna[' + di + '] must be integer 0-255, got ' + c.dna[di]);
          }
        }

        if (c.hues !== undefined) {
          if (!Array.isArray(c.hues)) {
            e.push(cp + '.hues must be an array if present');
          } else {
            if (c.hues.length < 3 || c.hues.length > 4)
              e.push(cp + '.hues must have 3 or 4 elements');
            for (var hi = 0; hi < c.hues.length; hi++) {
              if (!Number.isInteger(c.hues[hi]) || c.hues[hi] < 0 || c.hues[hi] > 359)
                e.push(cp + '.hues[' + hi + '] must be integer 0-359, got ' + c.hues[hi]);
            }
          }
        }

        if (c.catchRate !== undefined &&
            (!Number.isInteger(c.catchRate) || c.catchRate < 0 || c.catchRate > 255))
          e.push(cp + '.catchRate must be integer 0-255 if present');
      }
    }

    // Logical events
    if (Array.isArray(project.logicalEvents)) {
      for (var lei = 0; lei < project.logicalEvents.length; lei++) {
        var le = project.logicalEvents[lei];
        if (Array.isArray(le.commands))
          this._validateCommands(le.commands, 'logicalEvents[' + lei + ']', e, w);
      }
    }

    return { valid: errors.length === 0, errors: errors, warnings: warnings };
  };

  ProjectValidator.prototype._validateCommands = function (commands, prefix, errors, warnings) {
    for (var i = 0; i < commands.length; i++) {
      var cmd = commands[i];
      var cp  = prefix + '.commands[' + i + ']';

      if (cmd.cmd === 'branch' || cmd.cmd === 'ifFlag') {
        if (cmd.default === undefined || cmd.default === null)
          errors.push(cp + ': ' + cmd.cmd + ' must have a "default" field (use [] to fall through silently)');
      }

      if (cmd.cmd === 'dialogue' && Array.isArray(cmd.lines)) {
        for (var li = 0; li < cmd.lines.length; li++) {
          var original = String(cmd.lines[li]);
          var stripped = original.replace(/<[^>]*>/g, '');
          if (stripped !== original) {
            warnings.push(cp + '.lines[' + li + ']: HTML tags stripped from dialogue text');
            cmd.lines[li] = stripped;
          }
        }
      }
    }
  };


  // ─────────────────────────────────────────────────
  // ProjectFormat
  // Manifest hash computation and save/load delegation to a Host.
  // Host interface:
  //   storage.saveDraft(project)        → Promise<void>
  //   storage.loadDraft(id)             → Promise<ProjectJSON>
  //   storage.listDrafts()              → Promise<[{id,name,updatedAt}]>
  //   storage.saveProject(project)      → Promise<manifestHash>
  //   storage.loadProject(manifestHash) → Promise<ProjectJSON>
  //   storage.saveSave(save)            → Promise<void>
  //   storage.loadSave(saveId)          → Promise<SaveJSON>
  //   storage.listSaves(manifestHash)   → Promise<[SaveJSON]>
  // ─────────────────────────────────────────────────
  function ProjectFormat(host) {
    this._host      = host;
    this._validator = new ProjectValidator();
  }

  // Canonical key-sorted JSON serialization (deterministic)
  ProjectFormat.prototype._stable = function (v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(this._stable.bind(this)).join(',') + ']';
    var self = this;
    return '{' + Object.keys(v).sort().map(function (k) {
      return JSON.stringify(k) + ':' + self._stable(v[k]);
    }).join(',') + '}';
  };

  ProjectFormat.prototype._sha256 = function (str) {
    var bytes = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', bytes).then(function (digest) {
      return 'sha256:' + Array.from(new Uint8Array(digest))
        .map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  };

  // Compute the manifest hash.
  // assetHashMap: { assetRef: 'sha256:...', ... }
  // manifestHash = sha256({ project: sha256(projectJSON), assets: assetHashMap })
  ProjectFormat.prototype.computeManifestHash = function (project, assetHashMap) {
    var self = this;
    assetHashMap = assetHashMap || {};
    var copy = Object.assign({}, project, { manifestHash: null });
    return self._sha256(self._stable(copy)).then(function (projectHash) {
      return self._sha256(self._stable({ project: projectHash, assets: assetHashMap }));
    });
  };

  // Derive a save file ID from manifest hash and player name
  ProjectFormat.prototype.computeSaveId = function (manifestHash, playerName) {
    return this._sha256(manifestHash + ':' + String(playerName || ''));
  };

  ProjectFormat.prototype.saveDraft = function (project) {
    var updated = Object.assign({}, project, { updatedAt: Date.now() });
    return this._host.storage.saveDraft(updated).then(function () { return updated; });
  };

  ProjectFormat.prototype.loadDraft = function (id) {
    var self = this;
    return self._host.storage.loadDraft(id).then(function (project) {
      var r = self._validator.validate(project);
      if (!r.valid) throw new Error('Invalid project: ' + r.errors.join('; '));
      return project;
    });
  };

  ProjectFormat.prototype.publishProject = function (project, assetHashMap) {
    var self = this;
    return self.computeManifestHash(project, assetHashMap).then(function (mh) {
      var published = Object.assign({}, project, { manifestHash: mh, updatedAt: Date.now() });
      return self._host.storage.saveProject(published).then(function () { return mh; });
    });
  };

  ProjectFormat.prototype.loadProject = function (manifestHash) {
    var self = this;
    return self._host.storage.loadProject(manifestHash).then(function (project) {
      var r = self._validator.validate(project);
      if (!r.valid) throw new Error('Invalid project: ' + r.errors.join('; '));
      return project;
    });
  };

  ProjectFormat.prototype.saveGame = function (save) {
    var updated = Object.assign({}, save, { savedAt: Date.now() });
    return this._host.storage.saveSave(updated).then(function () { return updated; });
  };

  ProjectFormat.prototype.loadGame = function (saveId, expectedManifestHash) {
    return this._host.storage.loadSave(saveId).then(function (save) {
      if (!save) throw new Error('Save not found: ' + saveId);
      if (save.projectManifestHash !== expectedManifestHash) {
        var err = new Error(
          'Save was created against project version ' + save.projectManifestHash + '. ' +
          'Current version is ' + expectedManifestHash + '. Migration required.'
        );
        err.name = 'MismatchError';
        err.saveManifestHash = save.projectManifestHash;
        err.expectedManifestHash = expectedManifestHash;
        throw err;
      }
      return save;
    });
  };


  // ─────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────
  var PokemonEngine = {
    TileCamera:       TileCamera,
    TileRenderer:     TileRenderer,
    SpriteAtlas:      SpriteAtlas,
    CollisionMap:     CollisionMap,
    InputManager:     InputManager,
    AudioEngine:      AudioEngine,
    DialogueEngine:   DialogueEngine,
    EventExecutor:    EventExecutor,
    ProjectValidator: ProjectValidator,
    ProjectFormat:    ProjectFormat,
    VERSION:          '0.1.0'
  };

  root.PokemonEngine = PokemonEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = PokemonEngine;

})(typeof window !== 'undefined' ? window : globalThis);
