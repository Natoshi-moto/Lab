// src/vessel-ceremony.ts
// ============================================================================
// S5 — Vessel Ceremony
//
// Nine phases, exact timings, one emotional beat per phase. The whole
// design rests on holding that last rule: every "plus also" addition
// dilutes the beat it's added to. Resist.
//
// FIVE DIRECTIVES:
//
//   1. ONE emotional beat per phase. Communion: threads, nothing else.
//      Spatial Infusion: ground rising, nothing else. The vessel persists
//      across phases as STAGE, not as a beat — the beat is the new thing
//      this phase introduces, alone.
//
//   2. Spatial Infusion is compositionally distinct from Communion. They
//      cannot look like cousins or the player won't understand the place
//      participated. Different axis (vertical vs horizontal), different
//      color register (biome vs parental), different movement grammar
//      (rising particles vs streaming threads).
//
//   3. Inheritance Flash is sequential and accumulating. Three labels
//      (parentA, wildParent, spatial), each appearing in turn and staying.
//      The sequence IS the argument: here is what came from whom.
//
//   4. SILENCE_DURATION_MS = 500 is named. The half-second of silence
//      before Emergence is structurally load-bearing, not a magic number
//      buried in timing arithmetic.
//
//   5. The Crack fracture pattern is deterministic from the offspring's
//      content-addressed ID — the fracture is part of the creature's
//      identity, the same way the name is. And the bornAt assignment at
//      Crack is the ONE legitimate wall-clock write in the codebase.
//      Comment block on that line is the exception that proves the rule.
//
// Rendering: this module assumes S10 has already drawn the world (S7) and
// any creatures (S6) before calling renderVesselPhase. The veil layer is
// drawn ON TOP of the world, dimming it. S5 does not redraw terrain.
// ============================================================================

import type {
  BiomeId,
  BirthContext,
  CreatureDNA,
  CreatureNode,
  InheritedTrait,
  VesselPhase,
} from './types.js';

import {
  rand01,
  clamp,
  smoothstep,
} from './core/deterministic.js';


// ============================================================================
// Phase timings and tunable constants
//
// PHASE_TIMINGS is the source of truth. Anywhere else that needs phase
// boundaries reads from here. Don't hardcode 0.8 or 4.0 or 7.4 in render
// code — read it from this table.
// ============================================================================

export const PHASE_TIMINGS: Readonly<Record<VesselPhase, {
  readonly start: number;
  readonly end: number;
}>> = {
  hush:              { start: 0.0, end: 0.8 },
  offering:          { start: 0.8, end: 2.0 },
  communion:         { start: 2.0, end: 4.0 },
  spatial_infusion:  { start: 4.0, end: 5.0 },
  gestation:         { start: 5.0, end: 6.6 },
  inheritance_flash: { start: 6.6, end: 7.4 },
  crack:             { start: 7.4, end: 8.1 },
  silence_bloom:     { start: 8.1, end: 8.7 },
  naming:            { start: 8.7, end: 9.5 },
};

export const TOTAL_DURATION_S = 9.5;

/**
 * The structurally load-bearing pause before Emergence.
 *
 * silence_bloom phase is 600ms total: the FIRST 500ms is pure silence
 * (this constant), the remaining 100ms is the bloom transition. The
 * silence is the moment. Playtesting will reach for this number; it has
 * a name.
 */
export const SILENCE_DURATION_MS = 500;

/** How long the player must hold the skip key to fast-forward (skippable ceremonies only). */
export const SKIP_HOLD_DURATION_S = 1.0;


// ============================================================================
// State
// ============================================================================

export interface VesselCeremonyOptions {
  /**
   * False on the first instance of a given vessel type — the introduction
   * is unskippable; the player learns the ceremony's grammar. True on
   * subsequent instances; player can hold to skip. S10 reads SaveFileV1
   * to determine this and passes it in.
   */
  readonly skippable: boolean;
}

export interface VesselCeremonyState {
  readonly phase: VesselPhase;
  readonly elapsed: number;            // seconds since ceremony start
  readonly offspring: CreatureNode;    // bornAt is null until Crack writes it
  readonly context: BirthContext;
  readonly skippable: boolean;
  readonly skipHoldTime: number;       // seconds the skip key has been held
  /** True once Crack has fired bornAt. Triggers S8's commitSave on the next runtime tick. */
  readonly committed: boolean;
}


// ============================================================================
// Phase progression helpers
// ============================================================================

const PHASE_ORDER: readonly VesselPhase[] = [
  'hush',
  'offering',
  'communion',
  'spatial_infusion',
  'gestation',
  'inheritance_flash',
  'crack',
  'silence_bloom',
  'naming',
];

function phaseAt(elapsed: number): VesselPhase {
  for (const phase of PHASE_ORDER) {
    if (elapsed < PHASE_TIMINGS[phase].end) return phase;
  }
  return 'naming'; // past the end; renderer treats this as "complete"
}

function phaseProgress(elapsed: number, phase: VesselPhase): number {
  const t = PHASE_TIMINGS[phase];
  return clamp((elapsed - t.start) / (t.end - t.start), 0, 1);
}


// ============================================================================
// Initialization
// ============================================================================

export function initVesselCeremony(
  offspring: CreatureNode,
  context: BirthContext,
  options: VesselCeremonyOptions = { skippable: false },
): VesselCeremonyState {
  return {
    phase: 'hush',
    elapsed: 0,
    offspring,
    context,
    skippable: options.skippable,
    skipHoldTime: 0,
    committed: false,
  };
}


// ============================================================================
// Tick
//
// Pure: state + dt + skipHeld → next state. Crack flips `committed` so S10/S8
// can write display-only save metadata outside the deterministic ceremony.
// ============================================================================

export function tickVesselCeremony(
  state: VesselCeremonyState,
  dt: number,
  skipHeld: boolean = false,
): VesselCeremonyState {
  if (isCeremonyComplete(state)) return state;

  // Skip handling: hold to fast-forward, only on skippable ceremonies.
  let skipHoldTime = state.skipHoldTime;
  let elapsed = state.elapsed;

  if (skipHeld && state.skippable) {
    skipHoldTime += dt;
    if (skipHoldTime >= SKIP_HOLD_DURATION_S) {
      // Jump to the end. The Crack-write below still fires if it hasn't
      // already — bornAt is required for save commit.
      elapsed = TOTAL_DURATION_S;
    } else {
      elapsed += dt;
    }
  } else {
    skipHoldTime = 0;
    elapsed += dt;
  }

  const newPhase = phaseAt(elapsed);

  let committed = state.committed;
  const offspring = state.offspring;
  if (!committed && elapsed >= PHASE_TIMINGS.crack.start) {
    committed = true;
  }

  return {
    ...state,
    elapsed,
    phase: newPhase,
    offspring,
    committed,
    skipHoldTime,
  };
}

export function isCeremonyComplete(state: VesselCeremonyState): boolean {
  return state.elapsed >= TOTAL_DURATION_S;
}


// ============================================================================
// Rendering
//
// renderVesselPhase is called by S10 after S7's terrain and S6's creature
// renders — the ceremony composes on top. Each phase function does ONE
// thing; the vessel persists across phases as STAGE, not as a beat.
// ============================================================================

export interface CanvasDimensions {
  readonly width: number;
  readonly height: number;
}

interface VesselGeometry {
  readonly cx: number;
  readonly top: number;     // y of vessel's narrow top
  readonly bottom: number;  // y of vessel's wide bottom (= ground line)
  readonly w: number;
  readonly h: number;
}

function vesselGeometry(dims: CanvasDimensions): VesselGeometry {
  const cx = dims.width / 2;
  const h = 140;
  const w = 90;
  const bottom = dims.height * 0.7;
  const top = bottom - h;
  return { cx, top, bottom, w, h };
}

export function renderVesselPhase(
  state: VesselCeremonyState,
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
): void {
  const t = phaseProgress(state.elapsed, state.phase);

  // Layer 1: ceremony veil — dims the world throughout the ceremony,
  // eases out during Naming.
  drawCeremonyVeil(ctx, dims, state.elapsed);

  // Layer 2: phase beat. Each branch is responsible for its own complete
  // visual — including the persistent vessel where applicable.
  switch (state.phase) {
    case 'hush':              break; // veil alone IS the beat
    case 'offering':          drawOffering(ctx, dims, state, t); break;
    case 'communion':         drawCommunion(ctx, dims, state, t); break;
    case 'spatial_infusion':  drawSpatialInfusion(ctx, dims, state, t); break;
    case 'gestation':         drawGestation(ctx, dims, state, t); break;
    case 'inheritance_flash': drawInheritanceFlash(ctx, dims, state, t); break;
    case 'crack':             drawCrack(ctx, dims, state, t); break;
    case 'silence_bloom':     drawSilenceBloom(ctx, dims, state, t); break;
    case 'naming':            drawNaming(ctx, dims, state, t); break;
  }
}


// ─── Veil ──────────────────────────────────────────────────────────────

function drawCeremonyVeil(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  elapsed: number,
): void {
  let alpha: number;
  if (elapsed < PHASE_TIMINGS.hush.end) {
    // Hush: veil deepens 0 → 0.7
    alpha = (elapsed / PHASE_TIMINGS.hush.end) * 0.7;
  } else if (elapsed < PHASE_TIMINGS.naming.start) {
    alpha = 0.7;
  } else {
    // Naming: veil eases 0.7 → 0
    const t = phaseProgress(elapsed, 'naming');
    alpha = 0.7 * (1 - t);
  }
  ctx.fillStyle = `rgba(8, 10, 16, ${alpha})`;
  ctx.fillRect(0, 0, dims.width, dims.height);
}


// ─── Vessel silhouette helpers ─────────────────────────────────────────

function drawVesselSilhouette(
  ctx: CanvasRenderingContext2D,
  cx: number, top: number, w: number, h: number,
  fill: string,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, top + h);
  ctx.bezierCurveTo(cx - w * 0.55, top + h * 0.5, cx - w * 0.4, top + h * 0.1, cx, top);
  ctx.bezierCurveTo(cx + w * 0.4, top + h * 0.1, cx + w * 0.55, top + h * 0.5, cx + w / 2, top + h);
  ctx.closePath();
  ctx.fill();
}

function clipToVesselShape(
  ctx: CanvasRenderingContext2D,
  cx: number, top: number, w: number, h: number,
): void {
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, top + h);
  ctx.bezierCurveTo(cx - w * 0.55, top + h * 0.5, cx - w * 0.4, top + h * 0.1, cx, top);
  ctx.bezierCurveTo(cx + w * 0.4, top + h * 0.1, cx + w * 0.55, top + h * 0.5, cx + w / 2, top + h);
  ctx.closePath();
  ctx.clip();
}


// ─── Phase: Offering ───────────────────────────────────────────────────
// Beat: the vessel rises from the ground. Solid silhouette, no glow.

function drawOffering(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  _state: VesselCeremonyState,
  t: number,
): void {
  const v = vesselGeometry(dims);
  const riseT = smoothstep(t);
  const animatedTop = v.bottom - v.h * riseT;
  drawVesselSilhouette(ctx, v.cx, animatedTop, v.w, v.h, '#000');
}


// ─── Phase: Communion ──────────────────────────────────────────────────
// Beat: parental threads enter horizontally. Two streams, two colors,
// nothing else. Biological, lateral.

function drawCommunion(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: VesselCeremonyState,
  t: number,
): void {
  const v = vesselGeometry(dims);
  drawVesselSilhouette(ctx, v.cx, v.top, v.w, v.h, '#000');

  const parentAColor = parentSignatureColor(state.offspring.inheritedTraits, 'parentA');
  const wildColor    = parentSignatureColor(state.offspring.inheritedTraits, 'wildParent');

  const threadCount = 6;
  ctx.lineWidth = 1.5;

  for (let i = 0; i < threadCount; i++) {
    // Each thread starts at a slightly different time within the phase.
    const stagger = i / threadCount;
    const threadT = clamp((t - stagger) * 1.5, 0, 1);
    if (threadT <= 0) continue;
    const reach = smoothstep(threadT);

    // Vertical position of this thread, distributed across vessel height.
    const yFraction = (i + 0.5) / threadCount;
    const y = v.top + v.h * (0.2 + yFraction * 0.6);

    // Left thread (parentA)
    const leftStart = -50;
    const leftEnd   = v.cx - v.w / 2 + 5;
    ctx.strokeStyle = parentAColor;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(leftStart, y);
    ctx.lineTo(leftStart + (leftEnd - leftStart) * reach, y);
    ctx.stroke();

    // Right thread (wild)
    const rightStart = dims.width + 50;
    const rightEnd   = v.cx + v.w / 2 - 5;
    ctx.strokeStyle = wildColor;
    ctx.beginPath();
    ctx.moveTo(rightStart, y);
    ctx.lineTo(rightStart - (rightStart - rightEnd) * reach, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}


// ─── Phase: Spatial Infusion ───────────────────────────────────────────
// Beat: the place rises into the vessel. Vertical, biome-colored
// particles emerging from the ground at the birth coordinate. The whole
// covenant of the game lives in this phase being clearly distinct from
// Communion — different axis, different color register, different
// movement grammar.

function drawSpatialInfusion(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: VesselCeremonyState,
  t: number,
): void {
  const v = vesselGeometry(dims);
  drawVesselSilhouette(ctx, v.cx, v.top, v.w, v.h, '#000');

  const color = biomeColor(state.context.biome.dominant, 0.85);
  ctx.fillStyle = color;

  const particleCount = 14;
  const targetY = v.top + v.h * 0.5; // particles rise into the vessel's center

  for (let i = 0; i < particleCount; i++) {
    const ns = `spatial:v1:${state.offspring.id}:${i}`;
    const stagger = rand01(`${ns}:stagger`);
    const localT = clamp((t - stagger * 0.5) * 1.3, 0, 1);
    if (localT <= 0) continue;

    const xJitter = (rand01(`${ns}:x`) - 0.5) * v.w * 0.6;
    const x = v.cx + xJitter;
    const y = v.bottom - (v.bottom - targetY) * smoothstep(localT);
    const radius = 1.5 + rand01(`${ns}:r`) * 2.0;

    ctx.globalAlpha = (1 - localT) * 0.7 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}


// ─── Phase: Gestation ──────────────────────────────────────────────────
// Beat: the fill becomes the creature. The color rising in the vessel
// IS the offspring's DNA color resolving — not a placeholder lit later.

function drawGestation(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: VesselCeremonyState,
  t: number,
): void {
  const v = vesselGeometry(dims);
  drawVesselSilhouette(ctx, v.cx, v.top, v.w, v.h, '#000');

  ctx.save();
  clipToVesselShape(ctx, v.cx, v.top, v.w, v.h);

  // Base interior — dim
  ctx.fillStyle = 'hsl(0, 0%, 14%)';
  ctx.fillRect(v.cx - v.w, v.top, v.w * 2, v.h);

  // DNA-colored fill rises from the bottom
  const fillLevel = smoothstep(t);
  const fillTop = v.top + v.h * (1 - fillLevel);
  ctx.fillStyle = dnaColor(state.offspring.dna, 1);
  ctx.fillRect(v.cx - v.w, fillTop, v.w * 2, v.h);

  ctx.restore();
}


// ─── Phase: Inheritance Flash ──────────────────────────────────────────
// Beat: the argument of inheritance, in three labels. Sequential, each
// holds and stays — the player ends the phase reading all three together.

function drawInheritanceFlash(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: VesselCeremonyState,
  t: number,
): void {
  const v = vesselGeometry(dims);

  // Vessel held in fully-gestated state
  drawVesselSilhouette(ctx, v.cx, v.top, v.w, v.h, '#000');
  ctx.save();
  clipToVesselShape(ctx, v.cx, v.top, v.w, v.h);
  ctx.fillStyle = dnaColor(state.offspring.dna, 1);
  ctx.fillRect(v.cx - v.w, v.top, v.w * 2, v.h);
  ctx.restore();

  // Three labels — sequential reveal, accumulating.
  const traits = state.offspring.inheritedTraits.slice(0, 3);
  const labelY = v.bottom + 50;
  const lineHeight = 28;

  ctx.font = '20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';

  for (let i = 0; i < traits.length; i++) {
    const slotStart = i / 3;
    if (t < slotStart) break; // not yet appeared
    // Quick fade-in over the first ~80ms of each slot
    const fadeIn = clamp((t - slotStart) * 12, 0, 1);
    ctx.globalAlpha = fadeIn;
    ctx.fillText(traits[i].explanation, dims.width / 2, labelY + i * lineHeight);
  }
  ctx.globalAlpha = 1;
}


// ─── Phase: Crack ──────────────────────────────────────────────────────
// Beat: rupture. White fracture lines spreading. The pattern is
// deterministic from offspring.id — the same creature cracks the same way
// every time. Math.cos/sin here are bitwise-stable on a given engine;
// any cross-engine drift in the 7th decimal of an angle is acceptable
// (the offspring is the same creature regardless of where it's rendered).

function drawCrack(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: VesselCeremonyState,
  t: number,
): void {
  const v = vesselGeometry(dims);

  // Vessel + DNA fill remain visible
  drawVesselSilhouette(ctx, v.cx, v.top, v.w, v.h, '#000');
  ctx.save();
  clipToVesselShape(ctx, v.cx, v.top, v.w, v.h);
  ctx.fillStyle = dnaColor(state.offspring.dna, 1);
  ctx.fillRect(v.cx - v.w, v.top, v.w * 2, v.h);
  ctx.restore();

  // Fracture lines, deterministic from offspring ID
  const lines = generateFractureLines(state.offspring.id, 8);
  const visibleCount = Math.floor(t * lines.length) + 1;

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.2;
  const cy = v.top + v.h / 2;
  for (let i = 0; i < Math.min(visibleCount, lines.length); i++) {
    const line = lines[i];
    ctx.beginPath();
    ctx.moveTo(v.cx + line.x1 * v.w, cy + line.y1 * v.h);
    ctx.lineTo(v.cx + line.x2 * v.w, cy + line.y2 * v.h);
    ctx.stroke();
  }
}

function generateFractureLines(
  offspringId: string,
  count: number,
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 0; i < count; i++) {
    const ns = `crack:v1:${offspringId}:${i}`;
    const startAngle = rand01(`${ns}:startA`) * Math.PI * 2;
    const endAngle = startAngle + (rand01(`${ns}:endA`) - 0.5) * Math.PI * 0.6;
    const startR = 0.05 + rand01(`${ns}:startR`) * 0.15;
    const endR = 0.30 + rand01(`${ns}:endR`) * 0.40;
    lines.push({
      x1: Math.cos(startAngle) * startR,
      y1: Math.sin(startAngle) * startR,
      x2: Math.cos(endAngle) * endR,
      y2: Math.sin(endAngle) * endR,
    });
  }
  return lines;
}


// ─── Phase: Silence / Bloom ────────────────────────────────────────────
// Beat: the half-second of silence (literally nothing happens) then a
// growing disc of the offspring's DNA color. The silence is the moment.

function drawSilenceBloom(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: VesselCeremonyState,
  t: number,
): void {
  const phaseDurationMs =
    (PHASE_TIMINGS.silence_bloom.end - PHASE_TIMINGS.silence_bloom.start) * 1000;
  const silenceFraction = SILENCE_DURATION_MS / phaseDurationMs;

  if (t < silenceFraction) {
    // Pure silence. No vessel, no glow. Just dark.
    ctx.fillStyle = 'rgba(8, 10, 16, 0.96)';
    ctx.fillRect(0, 0, dims.width, dims.height);
    return;
  }

  // Bloom: a growing disc from where the vessel was.
  ctx.fillStyle = 'rgba(8, 10, 16, 0.92)';
  ctx.fillRect(0, 0, dims.width, dims.height);

  const bloomT = (t - silenceFraction) / (1 - silenceFraction);
  const v = vesselGeometry(dims);
  const cx = v.cx;
  const cy = v.top + v.h / 2;
  const radius = bloomT * v.w * 1.3;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, dnaColor(state.offspring.dna, 0.95));
  grad.addColorStop(1, dnaColor(state.offspring.dna, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}


// ─── Phase: Naming ─────────────────────────────────────────────────────
// Beat: the name resolves. Pre-reveal text fades, true name fades in.

function drawNaming(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDimensions,
  state: VesselCeremonyState,
  t: number,
): void {
  const v = vesselGeometry(dims);
  const cx = v.cx;
  const cy = v.top + v.h / 2;

  // Offspring silhouette in DNA color
  ctx.fillStyle = dnaColor(state.offspring.dna, 1);
  ctx.beginPath();
  ctx.arc(cx, cy, v.w * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Cross-fade pre-reveal → true name
  const labelY = v.bottom + 60;
  ctx.font = '24px Georgia, serif';
  ctx.textAlign = 'center';

  // Pre-reveal fading out (visible for first half)
  ctx.globalAlpha = clamp(1 - t * 2.2, 0, 1);
  ctx.fillStyle = '#aaa';
  ctx.fillText(state.offspring.preRevealName, dims.width / 2, labelY);

  // True name fading in (visible from ~40%)
  ctx.globalAlpha = clamp((t - 0.4) * 2.2, 0, 1);
  ctx.fillStyle = '#fff';
  ctx.fillText(state.offspring.trueName, dims.width / 2, labelY);

  ctx.globalAlpha = 1;
}


// ─── Color helpers ─────────────────────────────────────────────────────

function dnaColor(dna: CreatureDNA, alpha: number): string {
  const hue = dna.hueBase * 360;
  const sat = 30 + dna.saturation * 60;   // 30..90 %
  const lit = 30 + dna.lightness * 50;    // 30..80 %
  return `hsla(${hue}, ${sat}%, ${lit}%, ${alpha})`;
}

const BIOME_COLOR_HSL: Readonly<Record<BiomeId, readonly [number, number, number]>> = {
  glassfen: [200, 30, 75],
  mosswake: [110, 40, 55],
  ashloom:  [25,  60, 55],
};

function biomeColor(biome: BiomeId, alpha: number): string {
  const [h, s, l] = BIOME_COLOR_HSL[biome];
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

/**
 * Distinct color for a parent's contribution in Communion. Warm hues for
 * parentA, cool for wildParent — biased by the actual inherited gene
 * value so two ceremonies with different inheritance look different.
 */
function parentSignatureColor(
  traits: readonly InheritedTrait[],
  source: 'parentA' | 'wildParent',
): string {
  const trait = traits.find(tr => tr.source === source);
  const baseHue = source === 'parentA' ? 30 : 210;
  if (!trait) return `hsl(${baseHue}, 60%, 60%)`;
  const hueOffset = (trait.geneValue - 0.5) * 60;
  return `hsl(${baseHue + hueOffset}, 70%, 62%)`;
}
