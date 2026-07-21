// src/creature-renderer.ts
// ============================================================================
// S6 — Creature Renderer
//
// Turning DNA into pixels. Gait clock is driven by world-X delta (not
// wall time) — a creature standing still doesn't bob, a creature moving
// fast bobs fast. Slope lean grounds the creature in the terrain it was
// born on. Compositing mode is the emergence grammar — `screen` blends
// into the world for cryptic, lerps to `source-over` as the creature
// resolves through watching → approaching.
//
// FOUR DIRECTIVES:
//
//   1. Ghost rendering uses `globalCompositeOperation = 'screen'` in the
//      cryptic state, lerping to `'source-over'` as the manifestation
//      resolves. The lerp progress (`opts.emergence`) is the
//      runtime-mapped projection of the manifestation state — S10 sets
//      it, S6 reads it. The compositing mode IS the emergence grammar:
//      `screen` blends with the world (creature is OF the place);
//      `source-over` paints over it (creature is IN the place).
//
//   2. Slope lean is required, not optional. The body tilts with terrain
//      gradient, clamped at MAX_SLOPE_VISUAL = 0.75. Without this,
//      creatures float above the terrain like sprites; with it, they're
//      grounded in the place they were born.
//
//   3. Four gait archetypes, visually distinct AT A GLANCE:
//        GLIDE   — water; smooth shallow oscillation, no squash
//        PULSE   — breath; stationary in y, dramatic squash/stretch
//        CREEP   — deliberate weight; small lifts, multi-limb out-of-phase
//        LOPE    — asymmetric bound; high bob, paired front/back limbs
//      Different from each other in axis, modulation shape, and limb
//      grammar — not just parameter values.
//
//   4. RenderAnimState initializes to neutral positions on first cache
//      entry. No pop on first frame: the spring settles from rest. The
//      cache itself is wall-time-dependent and render-only — same
//      hygiene rule as S2's watchTime/trackTime, marked at the Map
//      declaration.
// ============================================================================

import type {
  ActiveManifestation,
  BiomeBlend,
  BiomeId,
  CreatureDNA,
  CreatureId,
  CreatureNode,
  GaitArchetype,
  LocomotionTraits,
} from './types.js';

import {
  rand01,
  clamp,
  smoothstep,
} from './core/deterministic.js';

import { deriveGait } from './dna-name.js';
import { temperamentConfig } from './manifestation.js';
import type { CrypticTell } from './manifestation.js';


// ============================================================================
// Tunable constants
// ============================================================================

/**
 * Maximum slope value used for visual tilt. Slope is reported as dy/dx;
 * past this magnitude the lean clamps so creatures don't tip over on
 * extreme cliffs.
 */
export const MAX_SLOPE_VISUAL = 0.75;

/**
 * Maximum tilt angle (radians) at MAX_SLOPE_VISUAL × full slopeLeanFactor.
 * Roughly 23°. Beyond this the silhouette looks more comical than grounded.
 */
const MAX_LEAN_RADIANS = 0.4;

/** Tendril damping per frame at 60fps. Higher = stiffer trail; lower = looser. */
const TENDRIL_DAMPING = 0.88;

/** How strongly tendrils respond to body velocity. */
const TENDRIL_REACTIVITY = 0.4;


// ============================================================================
// Render traits
//
// DNA + LocomotionTraits → concrete pixel values. Pure derivation.
// ============================================================================

export interface RenderTraits {
  readonly bodyW: number;        // pixels
  readonly bodyH: number;
  readonly taper: number;        // 0..1 (preserved from DNA, used for shape)
  readonly color: string;        // primary HSL string
  readonly accentColor: string;  // for hueShift accent (eye rings, etc.)
  readonly translucency: number; // 0..1
  readonly eyeCount: number;     // integer 1..6
  readonly eyePixelSize: number;
  readonly eyeRinginess: number; // 0..1
  readonly tendrilCount: number; // integer 0..7 (from gait)
  readonly tendrilLength: number; // pixels
  readonly limbCount: number;    // integer
  readonly archetype: GaitArchetype;
  readonly strideLength: number;
  readonly bobAmplitude: number;
  readonly squashFactor: number;
  readonly slopeLeanFactor: number; // 0..1, from gait
  readonly gaitOffset: number;   // 0..1, deterministic per-creature
}

export function deriveRenderTraits(dna: CreatureDNA, gait: LocomotionTraits): RenderTraits {
  const bodyW = 30 + dna.bodyWidth * 40;     // 30..70
  const bodyH = 35 + dna.bodyHeight * 50;    // 35..85

  const hue = dna.hueBase * 360;
  const sat = 30 + dna.saturation * 60;
  const lit = 30 + dna.lightness * 50;
  const color = `hsl(${hue}, ${sat}%, ${lit}%)`;

  const accentHue = (hue + dna.hueShift * 180) % 360;
  const accentLit = Math.min(lit + 18, 88);
  const accentColor = `hsl(${accentHue}, ${sat}%, ${accentLit}%)`;

  // Eye count: gene 0..1 → integer 1..6.
  const eyeCount = 1 + Math.floor(dna.eyeCount * 5.999);
  const eyePixelSize = 2 + dna.eyeSize * 5;

  return {
    bodyW,
    bodyH,
    taper: dna.bodyTaper,
    color,
    accentColor,
    translucency: dna.translucency,
    eyeCount,
    eyePixelSize,
    eyeRinginess: dna.eyeRinginess,
    tendrilCount: gait.tendrilCount,
    tendrilLength: 10 + dna.tendrilLength * 30,
    limbCount: gait.limbCount,
    archetype: gait.archetype,
    strideLength: gait.strideLength,
    bobAmplitude: gait.bobAmplitude,
    squashFactor: gait.squashFactor,
    slopeLeanFactor: gait.slopeLeanFactor,
    gaitOffset: gait.gaitOffset,
  };
}


// ============================================================================
// Render animation state
// ============================================================================

interface TendrilSegmentOffset {
  x: number;
  y: number;
}

interface RenderAnimState {
  /**
   * Per-tendril, per-segment lag offsets. Initialized to {0, 0} on first
   * cache entry — the spring settles from rest, no pop on first frame.
   */
  tendrilOffsets: TendrilSegmentOffset[][];
  lastSx: number;
  lastSy: number;
  lastUpdateTime: number;
  /** False until first updateRenderAnim — protects against initial-frame velocity. */
  initialized: boolean;
}

// Pure-derivation cache — gait + traits depend only on DNA, never change.
// Just an optimization; not load-bearing for correctness.
const renderTraitsCache = new Map<CreatureId, {
  gait: LocomotionTraits;
  traits: RenderTraits;
}>();

/**
 * Per-creature render animation cache.
 *
 * THIS IS A WALL-TIME, RENDER-ONLY CACHE. It mirrors the S2 hygiene rule
 * for watchTime/trackTime: position history for spring-lag visual
 * effects is intrinsically wall-time dependent — fine for rendering,
 * forbidden anywhere in the derivation chain. The Map is keyed by
 * CreatureId, never persisted, never feeds anything except the next
 * frame of pixels.
 *
 * Initialization on first cache entry uses zero offsets so the spring
 * settles from rest. Anyone reaching for a value here outside a
 * renderer's draw path: stop. The thing you actually want is in the
 * deterministic CreatureNode (or the gait/traits derived from it),
 * not here.
 */
const renderAnimCache = new Map<CreatureId, RenderAnimState>();

const TENDRIL_SEGMENTS = 4;

function getOrCacheTraits(creature: CreatureNode): {
  gait: LocomotionTraits;
  traits: RenderTraits;
} {
  const cached = renderTraitsCache.get(creature.id);
  if (cached) return cached;
  const gait = deriveGait(creature.dna);
  const traits = deriveRenderTraits(creature.dna, gait);
  const entry = { gait, traits };
  renderTraitsCache.set(creature.id, entry);
  return entry;
}

function getOrInitAnim(creatureId: CreatureId, traits: RenderTraits): RenderAnimState {
  const existing = renderAnimCache.get(creatureId);
  if (existing) return existing;
  const tendrilOffsets: TendrilSegmentOffset[][] = [];
  for (let t = 0; t < traits.tendrilCount; t++) {
    const segs: TendrilSegmentOffset[] = [];
    for (let s = 0; s < TENDRIL_SEGMENTS; s++) {
      // Neutral initial position — the spring settles from rest, no pop
      // on first frame. Per directive #4.
      segs.push({ x: 0, y: 0 });
    }
    tendrilOffsets.push(segs);
  }
  const anim: RenderAnimState = {
    tendrilOffsets,
    lastSx: 0,
    lastSy: 0,
    lastUpdateTime: 0,
    initialized: false,
  };
  renderAnimCache.set(creatureId, anim);
  return anim;
}

function updateRenderAnim(
  anim: RenderAnimState,
  sx: number,
  sy: number,
  time: number,
): void {
  if (!anim.initialized) {
    anim.lastSx = sx;
    anim.lastSy = sy;
    anim.lastUpdateTime = time;
    anim.initialized = true;
    return; // no velocity on the first frame — prevents pop
  }

  // Cap dt to avoid huge jumps on tab refocus or frame drops.
  const dt = Math.max(0.001, Math.min(0.1, time - anim.lastUpdateTime));
  const dx = sx - anim.lastSx;
  const dy = sy - anim.lastSy;
  anim.lastSx = sx;
  anim.lastSy = sy;
  anim.lastUpdateTime = time;

  // Frame-rate-aware damping: TENDRIL_DAMPING is the per-60Hz value; scale
  // by actual dt so 30fps and 120fps look comparable.
  const dampingPerFrame = Math.pow(TENDRIL_DAMPING, dt * 60);

  for (let t = 0; t < anim.tendrilOffsets.length; t++) {
    const tendril = anim.tendrilOffsets[t];
    for (let s = 0; s < tendril.length; s++) {
      // Top segment (s=0) responds most to body motion; lower segments lag more.
      const reactivity = 1 - (s / Math.max(tendril.length - 1, 1)) * 0.6;
      tendril[s].x = tendril[s].x * dampingPerFrame - dx * reactivity * TENDRIL_REACTIVITY;
      tendril[s].y = tendril[s].y * dampingPerFrame - dy * reactivity * TENDRIL_REACTIVITY;
    }
  }
}


// ============================================================================
// drawCreature
// ============================================================================

export interface DrawCreatureOpts {
  /** Creature's current world X. Drives the gait clock — NOT wall time. */
  readonly worldX: number;
  /** Terrain slope at the creature's current position. */
  readonly slope: number;
  /**
   * 0..1 — ghost-to-resolved factor. 0 = full `screen` blend (creature
   * is OF the world), 1 = full `source-over` (creature is IN the world).
   * S10 maps manifestation state to this value.
   */
  readonly emergence: number;
  /** Overall alpha multiplier (e.g. for fading state). Defaults to 1. */
  readonly alpha?: number;
}

export function drawCreature(
  ctx: CanvasRenderingContext2D,
  creature: CreatureNode,
  sx: number,
  sy: number,
  time: number,
  opts: DrawCreatureOpts,
): void {
  const { traits } = getOrCacheTraits(creature);
  const anim = getOrInitAnim(creature.id, traits);
  updateRenderAnim(anim, sx, sy, time);

  const baseAlpha = opts.alpha ?? 1;
  const emergence = clamp(opts.emergence, 0, 1);

  // Cross-fade between compositing modes. At emergence=0 we draw with
  // 'screen' alone; at emergence=1, 'source-over' alone. In between, both
  // — the visual lerp the directive calls for. Cost is one extra draw
  // per creature only during transitions.
  const screenAlpha = (1 - emergence) * baseAlpha;
  const solidAlpha  = emergence * baseAlpha;

  if (screenAlpha > 0.001) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = screenAlpha;
    drawCreatureBody(ctx, sx, sy, traits, anim, opts);
    ctx.restore();
  }

  if (solidAlpha > 0.001) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = solidAlpha;
    drawCreatureBody(ctx, sx, sy, traits, anim, opts);
    ctx.restore();
  }
}

function drawCreatureBody(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  traits: RenderTraits,
  anim: RenderAnimState,
  opts: DrawCreatureOpts,
): void {
  // Gait phase from world-X delta — NOT time. A creature standing still
  // doesn't bob; a creature moving fast bobs fast.
  const gaitPhase = mod(opts.worldX / traits.strideLength + traits.gaitOffset, 1);
  const gaitMod = gaitModulation(traits.archetype, gaitPhase, traits);

  // Slope lean — directive #2. Tilts with terrain gradient.
  const clampedSlope = clamp(opts.slope, -MAX_SLOPE_VISUAL, MAX_SLOPE_VISUAL);
  const lean = clampedSlope * traits.slopeLeanFactor * (MAX_LEAN_RADIANS / MAX_SLOPE_VISUAL);

  ctx.save();
  ctx.translate(sx, sy + gaitMod.bobY * traits.bobAmplitude);
  ctx.rotate(-lean);
  ctx.scale(gaitMod.scaleX, gaitMod.scaleY);

  // Tendrils first (behind body)
  drawTendrils(ctx, traits, anim);
  // Body
  drawBody(ctx, traits);
  // Limbs (in front of body for legibility)
  drawLimbs(ctx, traits, gaitPhase);
  // Eyes (frontmost)
  drawEyes(ctx, traits);

  ctx.restore();
}


// ============================================================================
// Gait modulation per archetype (directive #3)
//
// Each archetype gets a distinct bob/squash signature. Combined with
// limb count and limb animation pattern, the four are visually
// distinguishable at a glance.
// ============================================================================

interface GaitMod {
  readonly bobY: number;     // -1..+1, scaled by traits.bobAmplitude
  readonly scaleX: number;
  readonly scaleY: number;
}

function gaitModulation(
  archetype: GaitArchetype,
  phase: number,
  traits: RenderTraits,
): GaitMod {
  const TWOPI = Math.PI * 2;

  switch (archetype) {
    case 'GLIDE': {
      // Water: smooth shallow oscillation, no squash, almost weightless.
      return {
        bobY: Math.sin(phase * TWOPI) * 0.35,
        scaleX: 1,
        scaleY: 1,
      };
    }
    case 'PULSE': {
      // Breath: stationary in y, dramatic in/out squash. Squash factor
      // tunes amplitude; envelope is a half-cosine for organic timing.
      const breath = (Math.cos(phase * TWOPI) + 1) / 2; // 0..1
      const squash = traits.squashFactor;
      return {
        bobY: 0,
        scaleX: 1 + breath * squash * 1.5,         // wide on inhale
        scaleY: 1 - breath * squash * 0.9,         // squashed vertically
      };
    }
    case 'CREEP': {
      // Deliberate weight: tiny one-way lifts (always positive bob),
      // small accompanying compression. Multi-limb walk reads the rest.
      const lift = Math.max(0, Math.sin(phase * TWOPI)) * 0.3;
      return {
        bobY: -lift,                                // upward only
        scaleX: 1 + lift * 0.05,
        scaleY: 1 - lift * 0.08,
      };
    }
    case 'LOPE': {
      // Asymmetric bound: heavy fall during stance, quick rise during
      // flight. Sawtooth-ish, biased toward stance.
      const stance = 0.6;
      const wave = phase < stance
        ? -phase / stance                            // -1..0 over stance
        :  (phase - stance) / (1 - stance);          //  0..+1 over flight
      return {
        bobY: -wave * 0.9,                           // amplitude high
        scaleX: 1,
        scaleY: 1,
      };
    }
    case 'SLITHER':
    case 'SKITTER':
    default:
      // V2 archetypes — pickArchetype in S1 never produces these in V1.
      return { bobY: 0, scaleX: 1, scaleY: 1 };
  }
}


// ============================================================================
// Body / Eyes / Limbs / Tendrils
// ============================================================================

function drawBody(ctx: CanvasRenderingContext2D, traits: RenderTraits): void {
  const w = traits.bodyW;
  const h = traits.bodyH;

  // Translucency: lower alpha for "glassy" creatures. Translucency 1.0
  // halves the body's opacity (still visible, just transparent).
  ctx.globalAlpha *= 1 - traits.translucency * 0.5;

  ctx.fillStyle = traits.color;
  ctx.beginPath();
  // Tapered ellipse: front (top) wider when taper < 0.5; rear narrower
  // when taper > 0.5. Approximation via two quadratic curves.
  const taperFactor = traits.taper;
  ctx.moveTo(-w / 2, 0);
  ctx.quadraticCurveTo(-w / 2, -h / 2, 0, -h / 2);
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, 0);
  ctx.quadraticCurveTo(w / 2 * (1 - taperFactor * 0.4), h / 2,
                       0, h / 2);
  ctx.quadraticCurveTo(-w / 2 * (1 - taperFactor * 0.4), h / 2,
                       -w / 2, 0);
  ctx.closePath();
  ctx.fill();
}

function drawEyes(ctx: CanvasRenderingContext2D, traits: RenderTraits): void {
  const eyeY = -traits.bodyH * 0.18;
  const spread = traits.bodyW * 0.55;
  const count = traits.eyeCount;

  for (let i = 0; i < count; i++) {
    // Distribute symmetrically across spread.
    const t = count === 1 ? 0.5 : i / (count - 1);
    const eyeX = -spread / 2 + t * spread;

    // Optional ring (eyeRinginess). Drawn first so eye sits on top.
    if (traits.eyeRinginess > 0.25) {
      ctx.strokeStyle = traits.accentColor;
      ctx.lineWidth = 1 + traits.eyeRinginess * 1.5;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, traits.eyePixelSize + 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, traits.eyePixelSize, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, traits.eyePixelSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLimbs(
  ctx: CanvasRenderingContext2D,
  traits: RenderTraits,
  gaitPhase: number,
): void {
  if (traits.limbCount === 0) return;

  const TWOPI = Math.PI * 2;

  switch (traits.archetype) {
    case 'CREEP': {
      // Multi-limb out-of-phase walk. Each limb at a fraction of the cycle.
      const limbW = 3;
      const limbBase = traits.bodyH * 0.32;
      const lift = 5;
      const pitch = traits.bodyW / (traits.limbCount + 1);
      ctx.fillStyle = traits.color;
      for (let i = 0; i < traits.limbCount; i++) {
        const localPhase = mod(gaitPhase + i / traits.limbCount, 1);
        const lifted = Math.max(0, Math.sin(localPhase * TWOPI)) * lift;
        const x = (i - (traits.limbCount - 1) / 2) * pitch;
        ctx.fillRect(x - limbW / 2, limbBase - lifted, limbW, traits.bodyH * 0.32);
      }
      return;
    }
    case 'LOPE': {
      // Front pair + back pair, half-cycle apart — bounding gallop.
      const limbW = 4;
      const limbBase = traits.bodyH * 0.36;
      const lift = 8;
      const frontLift = Math.max(0, Math.sin(gaitPhase * TWOPI)) * lift;
      const backLift  = Math.max(0, Math.sin((gaitPhase + 0.5) * TWOPI)) * lift;
      const frontX = -traits.bodyW * 0.3;
      const backX  =  traits.bodyW * 0.3;
      ctx.fillStyle = traits.color;
      ctx.fillRect(frontX - limbW / 2, limbBase - frontLift, limbW, traits.bodyH * 0.36);
      ctx.fillRect(backX  - limbW / 2, limbBase - backLift,  limbW, traits.bodyH * 0.36);
      return;
    }
    case 'GLIDE':
    case 'PULSE':
    default: {
      // Minimal limbs, gentle alternating sway.
      const limbW = 3;
      const limbBase = traits.bodyH * 0.40;
      const sway = Math.sin(gaitPhase * TWOPI) * 1.5;
      ctx.fillStyle = traits.color;
      for (let i = 0; i < traits.limbCount; i++) {
        const baseX = (i - (traits.limbCount - 1) / 2) * (traits.bodyW * 0.4);
        const x = baseX + sway * (i % 2 === 0 ? 1 : -1);
        ctx.fillRect(x - limbW / 2, limbBase, limbW, traits.bodyH * 0.22);
      }
      return;
    }
  }
}

function drawTendrils(
  ctx: CanvasRenderingContext2D,
  traits: RenderTraits,
  anim: RenderAnimState,
): void {
  if (traits.tendrilCount === 0) return;

  const segLen = traits.tendrilLength / TENDRIL_SEGMENTS;

  ctx.strokeStyle = traits.color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  for (let t = 0; t < traits.tendrilCount; t++) {
    // Attach around the rear half of the body. Spread evenly across
    // an arc rather than a full circle so tendrils don't shoot out
    // from the eye-side.
    const fraction = traits.tendrilCount === 1 ? 0.5 : t / (traits.tendrilCount - 1);
    const attachAngle = Math.PI * 0.6 + fraction * Math.PI * 0.8;
    const baseX = Math.cos(attachAngle) * traits.bodyW * 0.45;
    const baseY = Math.sin(attachAngle) * traits.bodyH * 0.4;

    // Direction tendril hangs (down + away from body, normalized).
    let dirX = Math.cos(attachAngle);
    let dirY = Math.sin(attachAngle) + 0.3; // gentle gravity-like
    const dlen = Math.sqrt(dirX * dirX + dirY * dirY);
    dirX /= dlen;
    dirY /= dlen;

    const segments = anim.tendrilOffsets[t];
    if (!segments) continue;

    ctx.beginPath();
    ctx.moveTo(baseX, baseY);

    let curX = baseX;
    let curY = baseY;
    for (let s = 0; s < TENDRIL_SEGMENTS; s++) {
      curX += dirX * segLen;
      curY += dirY * segLen;
      const lag = segments[s];
      ctx.lineTo(curX + lag.x, curY + lag.y);
    }
    ctx.stroke();
  }
}


// ============================================================================
// drawCrypticTell — temperament-readable shimmer
//
// Four kinds, four genuinely different visual languages. The player who
// has run 10 encounters should be able to pattern-match the tell to the
// temperament without UI. That's the contract S2 made when it gave each
// CrypticTell a discrete `kind` literal — S6 honors it by branching
// here, not by tweening parameters of one effect.
// ============================================================================

export function drawCrypticTell(
  ctx: CanvasRenderingContext2D,
  active: ActiveManifestation,
  sx: number,
  sy: number,
  time: number,
  blend: BiomeBlend,
): void {
  const tell = temperamentConfig(active.slot.temperament).crypticTell;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  switch (tell.kind) {
    case 'shimmer-tight': drawShimmerTight(ctx, sx, sy, time, tell, blend); break;
    case 'pulse':         drawPulse(ctx, sx, sy, time, tell, blend);        break;
    case 'flicker':       drawFlicker(ctx, sx, sy, time, tell, blend);      break;
    case 'shimmer-wide':  drawShimmerWide(ctx, sx, sy, time, tell, blend);  break;
  }

  ctx.restore();
}

// AMBUSH — small, dense, focused. The predator's stillness.
function drawShimmerTight(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, time: number,
  tell: CrypticTell, blend: BiomeBlend,
): void {
  const radius = 12;
  const points = 8;
  const phase = (Math.sin(time * Math.PI * 2 * tell.frequencyHz) + 1) / 2;
  ctx.fillStyle = tellColor(tell.colorCast, blend, time);
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = radius * (0.7 + 0.3 * Math.sin(time * 3 + i));
    const x = sx + Math.cos(a) * r;
    const y = sy + Math.sin(a) * r;
    ctx.globalAlpha = phase * tell.amplitude;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// INVESTIGATOR — rhythmic ring expanding/contracting like a heartbeat.
function drawPulse(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, time: number,
  tell: CrypticTell, blend: BiomeBlend,
): void {
  const baseR = 20;
  const phase = (Math.sin(time * Math.PI * 2 * tell.frequencyHz) + 1) / 2;
  const r = baseR * (1 + phase * 0.5);
  ctx.strokeStyle = tellColor(tell.colorCast, blend, time);
  ctx.lineWidth = 2;
  ctx.globalAlpha = (1 - phase * 0.4) * tell.amplitude;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// SKITTISH — fast on/off, scattered. Unstable presence.
function drawFlicker(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, time: number,
  tell: CrypticTell, blend: BiomeBlend,
): void {
  const beat = mod(time * tell.frequencyHz, 1);
  // On for two short windows per cycle — two-flick rhythm.
  const visible = beat < 0.35 || (beat > 0.55 && beat < 0.78);
  if (!visible) return;
  const radius = 25;
  const points = 5;
  ctx.fillStyle = tellColor(tell.colorCast, blend, time);
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2 + time * 0.7;
    const r = radius * (0.5 + 0.5 * (i % 2));
    ctx.globalAlpha = tell.amplitude;
    ctx.beginPath();
    ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// TERRITORIAL — big, spread, directional. Claiming territory.
function drawShimmerWide(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, time: number,
  tell: CrypticTell, blend: BiomeBlend,
): void {
  const radius = 40;
  const points = 14;
  const wave = (Math.sin(time * Math.PI * 2 * tell.frequencyHz) + 1) / 2;
  // Asymmetry biases the cluster off-center, giving the tell direction.
  const xOffset = tell.asymmetry * radius * 0.5;
  ctx.fillStyle = tellColor(tell.colorCast, blend, time);
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = radius * (0.5 + 0.5 * Math.sin(time + i * 0.7));
    ctx.globalAlpha = wave * tell.amplitude;
    ctx.beginPath();
    ctx.arc(sx + Math.cos(a) * r + xOffset, sy + Math.sin(a) * r, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const BIOME_TINT_HUE: Readonly<Record<BiomeId, number>> = {
  glassfen: 200,
  mosswake: 110,
  ashloom: 25,
};

function tellColor(
  cast: 'cool' | 'warm' | 'mixed',
  blend: BiomeBlend,
  time: number,
): string {
  // Cast determines base hue; biome tints it slightly so the tell feels
  // OF the place even while distinguishable across temperaments.
  let baseHue: number;
  if (cast === 'cool') baseHue = 220;
  else if (cast === 'warm') baseHue = 30;
  else {
    // 'mixed' — gentle oscillation between cool and warm. Time-driven
    // wobble keeps it animated without random flicker.
    const t = (Math.sin(time * 1.7) + 1) / 2;
    baseHue = 30 + t * 190;
  }
  const biomeHue = BIOME_TINT_HUE[blend.dominant];
  const hue = baseHue * 0.8 + biomeHue * 0.2;
  return `hsla(${hue}, 65%, 70%, 1)`;
}


// ============================================================================
// Numeric helpers
// ============================================================================

function mod(x: number, m: number): number {
  return ((x % m) + m) % m;
}
