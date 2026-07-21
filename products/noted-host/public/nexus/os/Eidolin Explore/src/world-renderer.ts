// src/world-renderer.ts
// ============================================================================
// S7 — World Renderer
//
// Sky, parallax, terrain, landmarks, debug overlay. The whole world that
// isn't a creature.
//
// FOUR DIRECTIVES:
//
//   1. Parallax samples the FORECAST biome (`x + FORECAST_OFFSET`),
//      not the current. Same offset as the sky. Without this, parallax
//      snaps to the new biome instantly while terrain hasn't caught up
//      — the forecast effect breaks at exactly the moment it should be
//      strongest.
//
//   2. Three landmark types, each visually earning its place:
//        BENT_SPIRE — tall, curved, glass/stone register, visible afar
//        STILL_POOL — flat reflective ellipse, mirrors the sky color
//        ROOT_ARCH  — the OPENING is the landmark as much as the arch
//      These are the words players use to describe where their
//      creatures were born. They need to be memorable enough to name.
//
//   3. Debug overlay is first-class. Terrain control points, slope,
//      biome weights at cursor, forecast sample point, slot ID,
//      manifestation state, proximity radii, dry-walk timer, next-slot
//      distance. The encounter cadence is the most dangerous untuned
//      number in the build. The overlay is how we tune it.
//
//   4. Terrain is ONE continuous path across the visible range. No
//      seams, no chunk boundaries in the draw. `terrainHeightAt` is a
//      smooth Hermite curve; the rendering honors that. A visible seam
//      is a rendering bug, not a terrain bug.
//
// SPEC DEVIATION: drawParallax and drawTerrain take `realmSeed` instead
// of `blend`. The spec passed `blend: BiomeBlend` for both, but parallax
// must sample forecast and terrain must sample current — passing one
// blend forces the caller to choose which is wrong. Cleaner to let S7
// own the dual sampling internally. drawLandmarks already takes
// realmSeed, so this aligns the three signatures.
// ============================================================================

import type {
  ActiveManifestation,
  BiomeBlend,
  BiomeId,
  BreathState,
  Landmark,
  LayerId,
  ManifestationSlot,
} from './types.js';

import {
  hashString,
  rand01,
  hermite,
  terrainHeightAt,
  biomeBlendAt,
  landmarkForCell,
  TERRAIN_STEP,
  LANDMARK_SLOT_SIZE,
  LANDMARK_INFLUENCE_RADIUS,
} from './core/deterministic.js';


// ============================================================================
// Tunable constants
// ============================================================================

/**
 * World-units-ahead-of-camera that the sky and parallax sample for
 * biome color. The terrain still samples at cameraX. The gap between
 * the two is what makes biome arrival feel like a sequence — the
 * "sky changes before the ground" effect.
 */
export const FORECAST_OFFSET = 360;

/** Vertical position of the ground line, as a fraction of canvas height. */
export const GROUND_LINE_FRACTION = 0.7;

/** Pixel step for terrain path sampling. Smaller = smoother (and slower). */
const TERRAIN_SAMPLE_STEP_PX = 2;

/** Pixel step for parallax sampling. Coarser since the layers are background. */
const PARALLAX_SAMPLE_STEP_PX = 4;


// ============================================================================
// Types
// ============================================================================

export interface CanvasDimensions {
  readonly width: number;
  readonly height: number;
}

export interface DebugOverlayState {
  readonly enabled: boolean;
  readonly cameraX: number;
  readonly cursorWorldX: number | null;
  readonly realmSeed: string;
  readonly playerSeed: string;
  readonly layer: LayerId;
  readonly currentBiome: BiomeBlend;
  readonly forecastBiome: BiomeBlend;
  readonly currentSlope: number;
  readonly activeManifestation: ActiveManifestation | null;
  readonly nearbySlots: readonly { readonly slot: ManifestationSlot; readonly distance: number }[];
  /** Wall-time ms since the last cryptic was triggered. */
  readonly dryWalkMs: number;
  /** World-units distance to the nearest unwoken slot. */
  readonly nextSlotDistance: number;
}

interface ParallaxLayerConfig {
  readonly idx: number;            // for noise namespace
  readonly parallaxFactor: number; // 0..1 — 0 stationary, 1 moves with camera
  readonly yBase: number;          // canvas-height fraction
  readonly amplitude: number;      // pixels of vertical noise variation
  readonly lightness: number;      // HSL lightness for layer fill
  readonly alpha: number;
}

const PARALLAX_LAYERS: readonly ParallaxLayerConfig[] = [
  // Far → near. Higher idx = closer to camera, less parallax (moves more).
  { idx: 0, parallaxFactor: 0.10, yBase: 0.45, amplitude: 28, lightness: 80, alpha: 0.55 },
  { idx: 1, parallaxFactor: 0.25, yBase: 0.55, amplitude: 36, lightness: 65, alpha: 0.7  },
  { idx: 2, parallaxFactor: 0.50, yBase: 0.62, amplitude: 30, lightness: 50, alpha: 0.85 },
];


// ============================================================================
// Color helpers
// ============================================================================

const BIOME_BASE_HUE: Readonly<Record<BiomeId, number>> = {
  glassfen: 200,
  mosswake: 110,
  ashloom:  20,
};

const BIOME_BASE_SAT: Readonly<Record<BiomeId, number>> = {
  glassfen: 25,
  mosswake: 40,
  ashloom:  55,
};

function blendHue(blend: BiomeBlend): number {
  // Weighted hue blend across the three biomes.
  let h = 0;
  for (const b of ['glassfen', 'mosswake', 'ashloom'] as BiomeId[]) {
    h += BIOME_BASE_HUE[b] * blend.weights[b];
  }
  return h;
}

function blendSat(blend: BiomeBlend): number {
  let s = 0;
  for (const b of ['glassfen', 'mosswake', 'ashloom'] as BiomeId[]) {
    s += BIOME_BASE_SAT[b] * blend.weights[b];
  }
  return s;
}

function skyTopColor(blend: BiomeBlend): string {
  const h = blendHue(blend);
  const s = blendSat(blend) * 0.7;
  return `hsl(${h}, ${s}%, 30%)`;
}

function skyHorizonColor(blend: BiomeBlend): string {
  const h = blendHue(blend);
  const s = blendSat(blend);
  return `hsl(${h}, ${s}%, 60%)`;
}

function parallaxLayerColor(blend: BiomeBlend, lightness: number, alpha: number): string {
  const h = blendHue(blend);
  const s = blendSat(blend) * 0.6;
  return `hsla(${h}, ${s}%, ${lightness}%, ${alpha})`;
}

function terrainColor(blend: BiomeBlend): string {
  const h = blendHue(blend);
  const s = blendSat(blend);
  return `hsl(${h}, ${s}%, 35%)`;
}


// ============================================================================
// Parallax
//
// Sky and parallax layers all sample biome at cameraX + FORECAST_OFFSET.
// Layer Y silhouettes are Hermite noise, deterministic from realmSeed.
// ============================================================================

export function drawParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  dims: CanvasDimensions,
  realmSeed: string,
  breathState: BreathState | null,
): void {
  // Forecast: same offset that drives sky color drives parallax color.
  const forecast = biomeBlendAt(realmSeed, cameraX + FORECAST_OFFSET);

  ctx.save();
  // BreathState desaturates. Slowdown affects no static content, so it's
  // ignored here — that knob is for animated layers (creatures, particles).
  if (breathState && breathState.desaturation > 0) {
    ctx.filter = `saturate(${1 - breathState.desaturation})`;
  }

  // Sky gradient — top-of-canvas to horizon.
  const skyGrad = ctx.createLinearGradient(0, 0, 0, dims.height * GROUND_LINE_FRACTION);
  skyGrad.addColorStop(0, skyTopColor(forecast));
  skyGrad.addColorStop(1, skyHorizonColor(forecast));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, dims.width, dims.height);

  drawSkyMotes(ctx, cameraX, dims, realmSeed, forecast);
  drawForecastVeil(ctx, dims, forecast);

  // Parallax layers — far to near, each silhouette using forecast color.
  for (const layer of PARALLAX_LAYERS) {
    drawParallaxLayer(ctx, cameraX, dims, realmSeed, layer, forecast);
  }

  ctx.restore();
}


function drawForecastVeil(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  forecast: BiomeBlend,
): void {
  const h = blendHue(forecast);
  const s = blendSat(forecast);
  const y = dims.height * GROUND_LINE_FRACTION;
  const grad = ctx.createLinearGradient(0, y - 190, 0, y + 60);
  grad.addColorStop(0, `hsla(${h}, ${s}%, 76%, 0)`);
  grad.addColorStop(0.62, `hsla(${h}, ${s}%, 74%, 0.12)`);
  grad.addColorStop(1, `hsla(${h}, ${s}%, 45%, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 190, dims.width, 260);
}

function drawSkyMotes(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  dims: CanvasDimensions,
  realmSeed: string,
  forecast: BiomeBlend,
): void {
  const hue = blendHue(forecast);
  const sat = blendSat(forecast);
  const count = Math.max(18, Math.floor(dims.width / 70));
  ctx.save();
  for (let i = 0; i < count; i++) {
    const ns = `sky-mote:v1:${realmSeed}:${i}`;
    const depth = 0.08 + rand01(`${ns}:depth`) * 0.34;
    const lane = rand01(`${ns}:lane`);
    const period = 360 + rand01(`${ns}:period`) * 420;
    const world = cameraX * depth + i * period;
    const wrap = ((world % (dims.width + period)) + dims.width + period) % (dims.width + period);
    const sx = wrap - period * 0.5;
    const sy = dims.height * (0.08 + lane * 0.42);
    const r = 0.9 + rand01(`${ns}:r`) * 2.4;
    const twinkle = 0.45 + 0.35 * Math.sin((cameraX * 0.003 + i) * Math.PI * 2);
    ctx.globalAlpha = twinkle * 0.32;
    ctx.fillStyle = `hsla(${hue}, ${sat}%, 88%, 1)`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function parallaxNoise(
  realmSeed: string,
  layerIdx: number,
  worldX: number,
  amplitude: number,
): number {
  // Coarser sampling than terrain (256 vs 128) — parallax features are
  // larger and we don't need pixel-perfect shape. Hermite for smoothness.
  const STEP = 256;
  const i = Math.floor(worldX / STEP);
  const t = (worldX - i * STEP) / STEP;
  const ns = `parallax:v1:${realmSeed}:${layerIdx}`;
  const sample = (idx: number) => (rand01(`${ns}:${idx}`) - 0.5) * 2;
  return hermite(sample(i - 1), sample(i), sample(i + 1), sample(i + 2), t) * amplitude;
}

function drawParallaxLayer(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  dims: CanvasDimensions,
  realmSeed: string,
  layer: ParallaxLayerConfig,
  forecast: BiomeBlend,
): void {
  const groundY = dims.height * layer.yBase;

  // The layer's effective camera moves at parallaxFactor of real camera.
  // Worlds further out (smaller factor) drift less as the player walks.
  const layerWorldOffset = cameraX * layer.parallaxFactor;

  ctx.beginPath();
  for (let sx = 0; sx <= dims.width; sx += PARALLAX_SAMPLE_STEP_PX) {
    const worldX = layerWorldOffset + (sx - dims.width / 2);
    const offset = parallaxNoise(realmSeed, layer.idx, worldX, layer.amplitude);
    const sy = groundY + offset;
    if (sx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  // Close along the bottom of the canvas
  ctx.lineTo(dims.width, dims.height);
  ctx.lineTo(0, dims.height);
  ctx.closePath();

  ctx.fillStyle = parallaxLayerColor(forecast, layer.lightness, layer.alpha);
  ctx.fill();
}


// ============================================================================
// Terrain
//
// One continuous path across the entire visible range. Sample step is
// 2px; the underlying Hermite curve in S0 is C¹-continuous, so the
// piecewise-linear screen path is smooth at any sane sample step.
// ============================================================================

export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  dims: CanvasDimensions,
  realmSeed: string,
): void {
  const layer: LayerId = 'surface';
  const blend = biomeBlendAt(realmSeed, cameraX); // CURRENT biome (not forecast)
  const groundY = dims.height * GROUND_LINE_FRACTION;

  // Build one continuous path. No chunks, no seams.
  ctx.beginPath();
  for (let sx = 0; sx <= dims.width; sx += TERRAIN_SAMPLE_STEP_PX) {
    const worldX = cameraX + (sx - dims.width / 2);
    const h = terrainHeightAt(realmSeed, layer, worldX);
    const sy = groundY - h;
    if (sx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.lineTo(dims.width, dims.height);
  ctx.lineTo(0, dims.height);
  ctx.closePath();

  ctx.fillStyle = terrainColor(blend);
  ctx.fill();
  drawGroundTexture(ctx, cameraX, dims, realmSeed, blend);

  // Subtle contour on the ridgeline for definition.
  ctx.strokeStyle = `hsla(${blendHue(blend)}, ${blendSat(blend)}%, 25%, 0.6)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let sx = 0; sx <= dims.width; sx += TERRAIN_SAMPLE_STEP_PX) {
    const worldX = cameraX + (sx - dims.width / 2);
    const h = terrainHeightAt(realmSeed, layer, worldX);
    const sy = groundY - h;
    if (sx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
}



function drawGroundTexture(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  dims: CanvasDimensions,
  realmSeed: string,
  blend: BiomeBlend,
): void {
  const layer: LayerId = 'surface';
  const hue = blendHue(blend);
  const sat = blendSat(blend);
  const groundY = dims.height * GROUND_LINE_FRACTION;

  // Inner glow just below the ridge: makes the terrain feel like material,
  // not a flat polygon.
  const glow = ctx.createLinearGradient(0, groundY - 20, 0, dims.height);
  glow.addColorStop(0, `hsla(${hue}, ${sat}%, 78%, .10)`);
  glow.addColorStop(0.18, `hsla(${hue}, ${sat}%, 48%, .06)`);
  glow.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, groundY - 24, dims.width, dims.height - groundY + 24);

  // Small deterministic stalks/mineral splinters along the ridge.
  const startWorld = Math.floor((cameraX - dims.width / 2) / 34) * 34;
  ctx.save();
  ctx.lineCap = 'round';
  for (let wx = startWorld; wx < cameraX + dims.width / 2 + 34; wx += 34) {
    const ns = `ridge-detail:v1:${realmSeed}:${Math.floor(wx / 34)}`;
    const sx = wx - cameraX + dims.width / 2 + (rand01(`${ns}:x`) - 0.5) * 16;
    const sy = groundY - terrainHeightAt(realmSeed, layer, wx);
    const height = 5 + rand01(`${ns}:h`) * 18;
    const tilt = (rand01(`${ns}:tilt`) - 0.5) * 8;
    const alpha = 0.16 + rand01(`${ns}:a`) * 0.22;
    ctx.strokeStyle = `hsla(${hue}, ${sat}%, 72%, ${alpha})`;
    ctx.lineWidth = 1 + rand01(`${ns}:w`) * 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 1);
    ctx.lineTo(sx + tilt, sy - height);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// Landmarks (directive #2)
//
// Three types, three distinct visual identities. The opening of a Root
// Arch matters as much as the arch itself; a Still Pool's reflectance
// IS its character, not decoration; a Bent Spire's curve is what
// distinguishes it from a generic spike.
// ============================================================================

export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  dims: CanvasDimensions,
  realmSeed: string,
): void {
  const layer: LayerId = 'surface';
  const groundY = dims.height * GROUND_LINE_FRACTION;

  // Iterate visible cells. landmarkForCell — unfiltered — returns the
  // cell's landmark (or null). Visible from far, even if not influencing.
  const screenLeft = cameraX - dims.width / 2;
  const screenRight = cameraX + dims.width / 2;
  const leftCell = Math.floor(screenLeft / LANDMARK_SLOT_SIZE) - 1;
  const rightCell = Math.ceil(screenRight / LANDMARK_SLOT_SIZE) + 1;

  for (let cellIdx = leftCell; cellIdx <= rightCell; cellIdx++) {
    const lm = landmarkForCell(realmSeed, cellIdx);
    if (!lm) continue;

    const screenX = lm.x - cameraX + dims.width / 2;
    if (screenX < -100 || screenX > dims.width + 100) continue;

    const groundH = terrainHeightAt(realmSeed, layer, lm.x);
    const lmGroundY = groundY - groundH;

    switch (lm.type) {
      case 'BENT_SPIRE': drawBentSpire(ctx, screenX, lmGroundY, lm); break;
      case 'STILL_POOL': drawStillPool(ctx, screenX, lmGroundY, lm, realmSeed, cameraX); break;
      case 'ROOT_ARCH':  drawRootArch(ctx, screenX, lmGroundY, lm); break;
    }
  }
}

function landmarkColor(biome: BiomeId, kind: 'spire' | 'arch'): string {
  const h = BIOME_BASE_HUE[biome];
  const s = BIOME_BASE_SAT[biome];
  const l = kind === 'spire' ? 60 : 25; // spires light, arches dark
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function drawBentSpire(
  ctx: CanvasRenderingContext2D,
  x: number, groundY: number, lm: Landmark,
): void {
  // Tall, curved, narrow toward tip. Glass/stone register — solid fill
  // with a subtle highlight along the convex side. Bend direction
  // deterministic from the landmark's coordinate so it's stable across
  // reloads.
  const height = 80 + lm.amplitude * 60;
  const baseW = 14;
  const tipBend = (20 + lm.amplitude * 25) * (rand01(`spire:v1:${lm.x}:bend`) > 0.5 ? 1 : -1);
  const tipY = groundY - height;
  const tipX = x + tipBend;

  // Spire body
  ctx.fillStyle = landmarkColor(lm.biome, 'spire');
  ctx.beginPath();
  ctx.moveTo(x - baseW / 2, groundY);
  ctx.bezierCurveTo(
    x - baseW / 2,        groundY - height * 0.5,
    tipX - 5,             tipY + 8,
    tipX,                 tipY,
  );
  ctx.bezierCurveTo(
    tipX + 5,             tipY + 8,
    x + baseW / 2,        groundY - height * 0.5,
    x + baseW / 2,        groundY,
  );
  ctx.closePath();
  ctx.fill();

  // Highlight on the convex (bend-direction) side
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const sideX = tipBend > 0 ? x + baseW / 2 : x - baseW / 2;
  ctx.moveTo(sideX, groundY);
  ctx.bezierCurveTo(
    sideX,                groundY - height * 0.5,
    tipX,                 tipY + 8,
    tipX,                 tipY,
  );
  ctx.stroke();
}

function drawStillPool(
  ctx: CanvasRenderingContext2D,
  x: number, groundY: number, lm: Landmark,
  realmSeed: string, cameraX: number,
): void {
  // Flat reflective ellipse at ground level. The fill is the FORECAST
  // sky color — the pool reflects the sky, and the sky is forecast.
  // That's what makes the pool feel mirror-like rather than just a
  // colored oval.
  const w = 40 + lm.amplitude * 50;
  const h = 8 + lm.amplitude * 4;

  const forecast = biomeBlendAt(realmSeed, cameraX + FORECAST_OFFSET);
  const reflectColor = skyHorizonColor(forecast);

  // Pool body — sky-colored reflective surface
  ctx.fillStyle = reflectColor;
  ctx.beginPath();
  ctx.ellipse(x, groundY - 1, w, h, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner specular highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x - w * 0.15, groundY - 2, w * 0.55, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Edge — darker rim for grounding
  ctx.strokeStyle = `hsla(${BIOME_BASE_HUE[lm.biome]}, 30%, 20%, 0.7)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x, groundY - 1, w, h, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawRootArch(
  ctx: CanvasRenderingContext2D,
  x: number, groundY: number, lm: Landmark,
): void {
  // Two curved pillars meeting at an apex. The OPENING between them is
  // the landmark's identity — drawn as negative space. To make the
  // framing legible, we draw a faint vignette inside the opening so the
  // background reads as "framed."
  const archH = 60 + lm.amplitude * 40;
  const archW = 40 + lm.amplitude * 30;
  const apexX = x;
  const apexY = groundY - archH;

  // Faint highlight inside the opening — frames the background through it
  const vignetteGrad = ctx.createRadialGradient(apexX, groundY - archH * 0.5, 5,
                                                apexX, groundY - archH * 0.5, archW * 0.6);
  vignetteGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  vignetteGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = vignetteGrad;
  ctx.beginPath();
  ctx.ellipse(apexX, groundY - archH * 0.5, archW * 0.55, archH * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = landmarkColor(lm.biome, 'arch');

  // Left pillar
  ctx.beginPath();
  ctx.moveTo(x - archW / 2 - 4, groundY);
  ctx.bezierCurveTo(
    x - archW / 2 - 4, groundY - archH * 0.7,
    x - archW * 0.20, apexY + 5,
    apexX,             apexY,
  );
  ctx.bezierCurveTo(
    x - archW * 0.20 + 6, apexY + 5,
    x - archW / 2 + 4,    groundY - archH * 0.7,
    x - archW / 2 + 4,    groundY,
  );
  ctx.closePath();
  ctx.fill();

  // Right pillar
  ctx.beginPath();
  ctx.moveTo(x + archW / 2 + 4, groundY);
  ctx.bezierCurveTo(
    x + archW / 2 + 4, groundY - archH * 0.7,
    x + archW * 0.20, apexY + 5,
    apexX,             apexY,
  );
  ctx.bezierCurveTo(
    x + archW * 0.20 - 6, apexY + 5,
    x + archW / 2 - 4,    groundY - archH * 0.7,
    x + archW / 2 - 4,    groundY,
  );
  ctx.closePath();
  ctx.fill();
}


// ============================================================================
// Debug overlay (directive #3)
//
// First-class, not optional. Two parts:
//   - World-space overlays (control points, radii, forecast line)
//     drawn over the world but under the panel.
//   - Right-hand panel with text values, all the numbers that need
//     tuning.
// ============================================================================

export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: DebugOverlayState,
): void {
  if (!state.enabled) return;

  drawDebugWorld(ctx, dims, state);
  drawDebugPanel(ctx, dims, state);
}

function drawDebugWorld(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: DebugOverlayState,
): void {
  const groundY = dims.height * GROUND_LINE_FRACTION;
  const screenLeft = state.cameraX - dims.width / 2;
  const screenRight = state.cameraX + dims.width / 2;

  // --- Terrain control points ---
  const firstCp = Math.floor(screenLeft / TERRAIN_STEP);
  const lastCp = Math.ceil(screenRight / TERRAIN_STEP);
  ctx.fillStyle = 'rgba(255, 200, 100, 0.7)';
  for (let i = firstCp; i <= lastCp; i++) {
    const cpX = i * TERRAIN_STEP;
    const cpScreenX = cpX - state.cameraX + dims.width / 2;
    const cpH = terrainHeightAt(state.realmSeed, state.layer, cpX);
    ctx.beginPath();
    ctx.arc(cpScreenX, groundY - cpH, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Forecast sample line (vertical, where biome/parallax sample) ---
  const forecastScreenX = FORECAST_OFFSET + dims.width / 2;
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(forecastScreenX, 0);
  ctx.lineTo(forecastScreenX, dims.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // --- Active manifestation proximity radii ---
  const am = state.activeManifestation;
  if (am) {
    const cx = am.slot.anchorX - state.cameraX + dims.width / 2;
    const cy = groundY - 40; // slightly above ground for legibility

    const drawRing = (radius: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    };
    drawRing(am.slot.perceptionRadius, 'rgba(100, 200, 255, 0.45)');
    drawRing(am.slot.interestRadius,   'rgba(255, 220, 100, 0.55)');
    drawRing(am.slot.criticalRadius,   'rgba(255, 100, 100, 0.65)');

    // Anchor crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy);
    ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6);
    ctx.stroke();
  }

  // --- Nearby slots: small markers ---
  for (const { slot, distance } of state.nearbySlots) {
    if (am && slot.slotId === am.slot.slotId) continue;
    const sx = slot.anchorX - state.cameraX + dims.width / 2;
    if (sx < 0 || sx > dims.width) continue;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(sx, groundY - 4, 2, 0, Math.PI * 2);
    ctx.fill();
    void distance; // shown in panel
  }

  // --- Cursor world-X marker ---
  if (state.cursorWorldX !== null) {
    const sx = state.cursorWorldX - state.cameraX + dims.width / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, 0); ctx.lineTo(sx, dims.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

const PANEL_WIDTH = 270;
const PANEL_PADDING = 12;
const PANEL_LINE = 14;

function drawDebugPanel(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: DebugOverlayState,
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(8, 8, PANEL_WIDTH, dims.height - 16);

  ctx.font = '11px ui-monospace, Menlo, monospace';
  ctx.textBaseline = 'top';

  let y = 8 + PANEL_PADDING;
  const x = 8 + PANEL_PADDING;

  const heading = (text: string) => {
    y += 4;
    ctx.fillStyle = '#7adfff';
    ctx.fillText(text, x, y);
    y += PANEL_LINE;
    ctx.fillStyle = '#fff';
  };
  const line = (text: string) => {
    ctx.fillText(text, x, y);
    y += PANEL_LINE;
  };
  const kv = (k: string, v: string) => {
    line(`${k.padEnd(12)} ${v}`);
  };

  heading('— Position');
  kv('cameraX',  state.cameraX.toFixed(2));
  kv('layer',    state.layer);
  if (state.cursorWorldX !== null) kv('cursor', state.cursorWorldX.toFixed(2));
  kv('slope',    state.currentSlope.toFixed(4));

  heading('— Biome (current)');
  for (const b of ['glassfen', 'mosswake', 'ashloom'] as BiomeId[]) {
    kv(b, state.currentBiome.weights[b].toFixed(3));
  }
  kv('dominant', state.currentBiome.dominant);

  heading('— Biome (forecast +360)');
  for (const b of ['glassfen', 'mosswake', 'ashloom'] as BiomeId[]) {
    kv(b, state.forecastBiome.weights[b].toFixed(3));
  }
  kv('dominant', state.forecastBiome.dominant);

  if (state.activeManifestation) {
    const am = state.activeManifestation;
    heading('— Active Manifestation');
    kv('slot', shortSlotId(am.slot.slotId));
    kv('temp',  am.slot.temperament);
    kv('state', am.state);
    kv('band',  am.proximityBand);
    kv('watch', `${am.watchTime.toFixed(2)}s`);
    kv('track', `${am.trackTime.toFixed(2)}s`);
    kv('anchor', am.slot.anchorX.toFixed(0));
    kv('P/I/C', `${am.slot.perceptionRadius}/${am.slot.interestRadius}/${am.slot.criticalRadius}`);
  }

  heading('— Cadence');
  kv('dry walk', `${(state.dryWalkMs / 1000).toFixed(1)}s`);
  kv('next slot', `${state.nextSlotDistance.toFixed(0)}u`);
  kv('nearby', `${state.nearbySlots.length}`);

  ctx.restore();
}

function shortSlotId(slotId: string): string {
  // realmSeed:playerSeed:layer:slotIndex — show last two segments
  const parts = slotId.split(':');
  if (parts.length < 2) return slotId;
  return parts.slice(-2).join(':');
}


// ============================================================================
// Sanity check on the FORECAST_OFFSET
//
// If FORECAST_OFFSET ever drops below ~LANDMARK_INFLUENCE_RADIUS (360),
// the parallax forecast becomes meaningless because the player is
// already in the forecast biome by the time they see it shift. Sanity-
// fail at module load — same pattern as S3's weight check.
// ============================================================================

if (FORECAST_OFFSET < LANDMARK_INFLUENCE_RADIUS) {
  throw new Error(
    `FORECAST_OFFSET (${FORECAST_OFFSET}) must be >= LANDMARK_INFLUENCE_RADIUS ` +
    `(${LANDMARK_INFLUENCE_RADIUS}). Smaller and the forecast effect collapses.`,
  );
}

// Suppress unused-import warning for hashString — kept available for
// future use (e.g. seedable parallax cloud variations).
void hashString;
