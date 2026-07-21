// src/core/deterministic.ts
// ============================================================================
// S0 — DeterministicCore
//
// The math foundation of Nexus Lattice. Every other segment depends on this
// file producing exactly the same numbers, every time, on every machine.
//
// CONSTRAINTS (enforced by review, not the type system):
//   - No `Math.random()`, ever.
//   - No `Date.now()`, no `performance.now()`.
//   - No DOM, no Canvas, no Web APIs of any kind.
//   - No `async`/`await`, no Promises.
//   - Only IEEE-754-stable math: +, -, *, /, Math.floor/abs/min/max/imul/sign.
//     Avoid Math.sin/cos/exp/log — not bitwise-stable across engines.
//   - All hash inputs are serializable strings. No floats, dates, or objects.
//
// The single reason this file exists: same seed + same X = same world,
// always, everywhere, forever.
// ============================================================================

import type {
  BiomeId,
  BiomeBlend,
  InfluencingLandmark,
  Landmark,
  LandmarkType,
  LayerId,
} from '../types.js';


// ----------------------------------------------------------------------------
// Algorithm version
//
// Stamped into every save's DerivationProof. Bump on any change that
// produces different numbers from the same inputs — even a "bugfix" to
// terrain math is a breaking change for existing saves.
// ----------------------------------------------------------------------------

export const ALGO_VERSION = 'nl-algo-1.0.0';


// ----------------------------------------------------------------------------
// Tunable constants
//
// TERRAIN_STEP is sacred. 1024 / TERRAIN_STEP MUST be an integer, or the
// chunk-aligned renderer in S7 produces seams at multiples of 1024. The
// prototype shipped with 160 once. Don't.
// ----------------------------------------------------------------------------

export const TERRAIN_STEP = 128;

/**
 * Width of a landmark slot in world units. Each slot hosts at most one
 * landmark. Exported so S7 (renderer) and S3 (spatial bonding) read the
 * same number.
 */
export const LANDMARK_SLOT_SIZE = 2048;

/**
 * Distance over which a landmark's influence on a birth decays from 1 to 0.
 * Strictly smaller than LANDMARK_SLOT_SIZE — keeps the landmarkAt sweep
 * cheap (only the cell containing x and its two neighbors can ever produce
 * an in-range result).
 */
export const LANDMARK_INFLUENCE_RADIUS = 360;

const LANDMARK_PROBABILITY = 0.42;     // ~ 42% of slots host one
const BIOME_INFLUENCE_RADIUS = 4096;   // distance over which a biome falls off

/**
 * Per-biome "period" — average distance between this biome's centers along
 * the X axis. Slightly different prime-ish values keep biomes from
 * synchronizing into a repeating macro-pattern.
 */
const BIOME_PERIODS: Readonly<Record<BiomeId, number>> = {
  glassfen: 11_000,
  mosswake: 13_000,
  ashloom:  17_000,
};

/**
 * Per-layer terrain profile. Surface is the player's primary world; the
 * other three are architected so layered worlds in V2 don't require a
 * data-shape change.
 */
interface LayerProfile {
  readonly amplitude: number;   // peak deviation from baseHeight, world units
  readonly baseHeight: number;  // mid-line for this layer
}
const LAYER_PROFILES: Readonly<Record<LayerId, LayerProfile>> = {
  surface:    { amplitude:  80, baseHeight:    0 },
  understory: { amplitude:  60, baseHeight:  220 },
  canopy:     { amplitude:  45, baseHeight: -180 },
  deep:       { amplitude: 130, baseHeight:  520 },
};

const LANDMARK_TYPES: readonly LandmarkType[] = ['BENT_SPIRE', 'STILL_POOL', 'ROOT_ARCH'];
const BIOME_LIST:     readonly BiomeId[]      = ['glassfen', 'mosswake', 'ashloom'];


// ----------------------------------------------------------------------------
// Hashing
//
// FNV-1a 32-bit body + Murmur3 finalizer. The body gives us a fast,
// well-mixed walk through the input bytes; the finalizer fixes FNV's weak
// avalanche so single-bit input changes produce ~50% output bit changes.
//
// All math goes through `Math.imul` and `>>>` — both are spec-defined to
// produce identical 32-bit results across every JS engine.
// ----------------------------------------------------------------------------

export function hashString(str: string): number {
  // FNV-1a body
  let h = 0x811c9dc5; // 2166136261, FNV offset basis
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // 16777619, FNV prime
  }
  // Murmur3 finalizer — avalanche.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0; // unsigned 32-bit
}


// ----------------------------------------------------------------------------
// Stateless RNG
//
// rand01 is a *noise function*, not a generator. There is no internal
// counter — every call with the same namespace returns the same number.
// This is why every caller must build a unique namespace string ("biome:v1:
// {realmSeed}:{biome}:phase") instead of asking for "the next random number".
// ----------------------------------------------------------------------------

const TWO_POW_32 = 0x1_0000_0000;

export function rand01(namespace: string): number {
  return hashString(namespace) / TWO_POW_32; // [0, 1)
}

export function randRange(namespace: string, min: number, max: number): number {
  return min + rand01(namespace) * (max - min);
}

export function pick<T>(namespace: string, arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error('pick: cannot pick from an empty array');
  }
  // Math.floor(1.0 * arr.length) === arr.length is impossible because
  // rand01 < 1, but we clamp defensively for floating-point paranoia.
  const idx = Math.floor(rand01(namespace) * arr.length);
  return arr[idx < arr.length ? idx : arr.length - 1];
}


// ----------------------------------------------------------------------------
// Numeric primitives
// ----------------------------------------------------------------------------

export function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}


// ----------------------------------------------------------------------------
// Cubic Hermite interpolation (Catmull–Rom flavor)
//
// Four control points; t ∈ [0, 1] parameterizes the segment between p1 and p2.
// Tangents at p1 and p2 are derived from the surrounding p0 and p3, giving
// C¹ continuity across segment boundaries — no slope discontinuities, no
// visible kinks where chunks meet.
//
// Slope queries use `hermiteDerivative` for the analytical derivative
// w.r.t. t. Numerical differencing of `hermite` would drift at segment
// boundaries — exactly the kind of float-comparison rounding that breaks
// determinism over long playtimes.
// ----------------------------------------------------------------------------

export function hermite(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  // Catmull–Rom basis, expanded.
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

export function hermiteDerivative(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  return 0.5 * (
    (-p0 + p2) +
    2 * (2 * p0 - 5 * p1 + 4 * p2 - p3) * t +
    3 * (-p0 + 3 * p1 - 3 * p2 + p3) * t2
  );
}


// ----------------------------------------------------------------------------
// Terrain
//
// Control points sit at integer multiples of TERRAIN_STEP. At each control
// point, the height is bipolar noise scaled by the layer's amplitude. The
// curve through them is Catmull–Rom — smooth across boundaries, derivative
// is closed-form.
// ----------------------------------------------------------------------------

function controlHeight(realmSeed: string, layer: LayerId, i: number): number {
  // Bipolar: rand01 ∈ [0,1) → [-1, 1)
  const noise = rand01(`terrain:v1:${realmSeed}:${layer}:${i}`) * 2 - 1;
  const profile = LAYER_PROFILES[layer];
  return profile.baseHeight + noise * profile.amplitude;
}

export function terrainHeightAt(realmSeed: string, layer: LayerId, x: number): number {
  const i = Math.floor(x / TERRAIN_STEP);
  const t = (x - i * TERRAIN_STEP) / TERRAIN_STEP;

  const p0 = controlHeight(realmSeed, layer, i - 1);
  const p1 = controlHeight(realmSeed, layer, i);
  const p2 = controlHeight(realmSeed, layer, i + 1);
  const p3 = controlHeight(realmSeed, layer, i + 2);

  return hermite(p0, p1, p2, p3, t);
}

export function terrainSlopeAt(realmSeed: string, layer: LayerId, x: number): number {
  const i = Math.floor(x / TERRAIN_STEP);
  const t = (x - i * TERRAIN_STEP) / TERRAIN_STEP;

  const p0 = controlHeight(realmSeed, layer, i - 1);
  const p1 = controlHeight(realmSeed, layer, i);
  const p2 = controlHeight(realmSeed, layer, i + 1);
  const p3 = controlHeight(realmSeed, layer, i + 2);

  // dh/dx = (dh/dt) / (dx/dt). dx/dt = TERRAIN_STEP.
  return hermiteDerivative(p0, p1, p2, p3, t) / TERRAIN_STEP;
}


// ----------------------------------------------------------------------------
// Biomes
//
// Each biome has anchor positions placed periodically along X, with a
// per-biome phase offset so they don't all peak at the same coordinate.
// Each biome's raw weight at X is a smoothstep falloff from the nearest
// anchor; final weights are normalized to sum to 1.0.
// ----------------------------------------------------------------------------

function biomeRawWeight(biome: BiomeId, realmSeed: string, x: number): number {
  const period = BIOME_PERIODS[biome];
  // Phase is a deterministic 0..1 of `period`.
  const phaseOffset = rand01(`biome:v1:${realmSeed}:${biome}:phase`) * period;

  // Wrap (x - offset) into [0, period).
  const local = ((x - phaseOffset) % period + period) % period;
  // Distance to the nearest anchor (anchors live at 0 and `period` within local).
  const distance = Math.min(local, period - local);

  // Normalize against the influence radius and falloff.
  const normDist = clamp(distance / BIOME_INFLUENCE_RADIUS, 0, 1);
  return 1 - smoothstep(normDist); // 1 at center, 0 past the radius
}

export function biomeBlendAt(realmSeed: string, x: number): BiomeBlend {
  const wG = biomeRawWeight('glassfen', realmSeed, x);
  const wM = biomeRawWeight('mosswake', realmSeed, x);
  const wA = biomeRawWeight('ashloom', realmSeed, x);
  const total = wG + wM + wA;

  let weights: Record<BiomeId, number>;
  if (total < 1e-9) {
    // No biome's anchor is in range. Fall back to glassfen as the realm's
    // default coloring — ensures `dominant` is always defined.
    weights = { glassfen: 1, mosswake: 0, ashloom: 0 };
  } else {
    weights = {
      glassfen: wG / total,
      mosswake: wM / total,
      ashloom:  wA / total,
    };
  }

  // Find dominant. Comparison ties break in BIOME_LIST order, deterministic.
  let dominant: BiomeId = BIOME_LIST[0];
  for (const b of BIOME_LIST) {
    if (weights[b] > weights[dominant]) dominant = b;
  }

  return { weights, dominant };
}


// ----------------------------------------------------------------------------
// Landmarks
//
// World is divided into LANDMARK_SLOT_SIZE-wide slots. Each slot hosts at
// most one landmark, decided by a presence roll.
//
// Two query functions because two consumers want different things:
//
//   landmarkForCell(realmSeed, cellIndex) — unfiltered. Returns the slot's
//     landmark (or null) regardless of where the camera is. S7's draw loop
//     iterates visible cells with this; a player should see a Bent Spire
//     from 800 units away even though it only influences births within 360.
//
//   landmarkAt(realmSeed, x) — proximity-filtered. Returns null unless a
//     landmark sits within LANDMARK_INFLUENCE_RADIUS of x. The result
//     carries an `influence` field bounded [0, 1] for blending math. S3's
//     spatial bonding calls this.
//
// Forcing one consumer to wrap the other's result was the path that got
// us into the "what does landmarkAt actually mean?" question last turn.
// ----------------------------------------------------------------------------

export function landmarkForCell(realmSeed: string, cellIndex: number): Landmark | null {
  const presenceRoll = rand01(`landmark:v1:${realmSeed}:${cellIndex}:presence`);
  if (presenceRoll >= LANDMARK_PROBABILITY) return null;

  const positionRoll = rand01(`landmark:v1:${realmSeed}:${cellIndex}:position`);
  const landmarkX = cellIndex * LANDMARK_SLOT_SIZE + positionRoll * LANDMARK_SLOT_SIZE;

  const type = pick(`landmark:v1:${realmSeed}:${cellIndex}:type`, LANDMARK_TYPES);
  const amplitude = randRange(`landmark:v1:${realmSeed}:${cellIndex}:amplitude`, 0.4, 1.0);
  const blend = biomeBlendAt(realmSeed, landmarkX);

  return { type, x: landmarkX, amplitude, biome: blend.dominant };
}

export function landmarkAt(realmSeed: string, x: number): InfluencingLandmark | null {
  // INFLUENCE_RADIUS (360) << SLOT_SIZE (2048), so a ±1 cell sweep covers
  // every landmark that could possibly be in range of x.
  const centerCell = Math.floor(x / LANDMARK_SLOT_SIZE);
  let best: InfluencingLandmark | null = null;
  for (let dc = -1; dc <= 1; dc++) {
    const lm = landmarkForCell(realmSeed, centerCell + dc);
    if (!lm) continue;
    const distance = Math.abs(lm.x - x);
    if (distance >= LANDMARK_INFLUENCE_RADIUS) continue;
    const influence = 1 - smoothstep(distance / LANDMARK_INFLUENCE_RADIUS);
    if (best === null || influence > best.influence) {
      best = { ...lm, influence };
    }
  }
  return best;
}


// ----------------------------------------------------------------------------
// Determinism test runner
//
// Self-tests for the contract this file makes with the rest of the project:
//
//   1. The 1024/TERRAIN_STEP integer division invariant.
//   2. terrainHeightAt is stable across repeated calls (no hidden state).
//   3. hashString returns a finite number for any input, including "".
//   4. rand01 stays in [0, 1).
//   5. biomeBlendAt weights sum to 1.0.
//   6. terrainSlopeAt is finite across the golden X samples.
//   7. (optional) baseline match — if a baseline pack is supplied, every
//      sample must equal the baseline within float epsilon.
//
// Call from S10 at startup in dev builds; call from CI before every commit.
// ----------------------------------------------------------------------------

export interface GoldenSeedPack {
  readonly realmSeed: string;
  readonly xSamples: readonly number[];
  readonly baseline?: {
    readonly terrainSurface?: readonly number[];
    readonly biomeDominants?: readonly BiomeId[];
    readonly landmarksAtCells?: readonly (LandmarkType | null)[];
  };
}

export interface TestResult {
  readonly name: string;
  readonly passed: boolean;
  readonly detail?: string;
  readonly expected?: unknown;
  readonly actual?: unknown;
}

/** The canonical pack — the smallest set of samples that exercises the contract. */
export const GOLDEN_SEED_PACK: GoldenSeedPack = {
  realmSeed: 'Glassfen-91',
  xSamples: [-4096, -1024, 0, 4827.12, 8192, 16384],
};

const FLOAT_EPS = 1e-9;

export function runDeterminismTests(pack: GoldenSeedPack = GOLDEN_SEED_PACK): TestResult[] {
  const results: TestResult[] = [];

  // 1. TERRAIN_STEP integer division
  results.push({
    name: 'terrain-step-divides-1024',
    passed: 1024 % TERRAIN_STEP === 0,
    detail: `TERRAIN_STEP=${TERRAIN_STEP}, 1024 % TERRAIN_STEP=${1024 % TERRAIN_STEP}`,
  });

  // 2. Stable terrain across repeated calls
  for (const x of pack.xSamples) {
    const a = terrainHeightAt(pack.realmSeed, 'surface', x);
    const b = terrainHeightAt(pack.realmSeed, 'surface', x);
    const c = terrainHeightAt(pack.realmSeed, 'surface', x);
    results.push({
      name: `terrain-stable-x${x}`,
      passed: a === b && b === c,
      expected: a,
      actual: { a, b, c },
    });
  }

  // 3. Hash defined for empty string
  const emptyHash = hashString('');
  results.push({
    name: 'hash-empty-defined',
    passed: typeof emptyHash === 'number' && Number.isFinite(emptyHash),
    actual: emptyHash,
  });

  // 4. rand01 bounds
  const probe = rand01(`probe:${pack.realmSeed}`);
  results.push({
    name: 'rand01-in-half-open-unit',
    passed: probe >= 0 && probe < 1,
    actual: probe,
  });

  // 5. Biome weights sum to 1
  for (const x of pack.xSamples) {
    const blend = biomeBlendAt(pack.realmSeed, x);
    const sum = blend.weights.glassfen + blend.weights.mosswake + blend.weights.ashloom;
    results.push({
      name: `biome-weights-sum-x${x}`,
      passed: Math.abs(sum - 1) < FLOAT_EPS,
      expected: 1,
      actual: sum,
    });
  }

  // 6. Slope is finite
  for (const x of pack.xSamples) {
    const s = terrainSlopeAt(pack.realmSeed, 'surface', x);
    results.push({
      name: `slope-finite-x${x}`,
      passed: Number.isFinite(s),
      actual: s,
    });
  }

  // 7. Baseline match (optional)
  if (pack.baseline?.terrainSurface) {
    const expected = pack.baseline.terrainSurface;
    for (let i = 0; i < pack.xSamples.length; i++) {
      const x = pack.xSamples[i];
      const exp = expected[i];
      const act = terrainHeightAt(pack.realmSeed, 'surface', x);
      results.push({
        name: `baseline-terrain-x${x}`,
        passed: exp !== undefined && Math.abs(act - exp) < FLOAT_EPS,
        expected: exp,
        actual: act,
      });
    }
  }
  if (pack.baseline?.biomeDominants) {
    const expected = pack.baseline.biomeDominants;
    for (let i = 0; i < pack.xSamples.length; i++) {
      const x = pack.xSamples[i];
      const exp = expected[i];
      const act = biomeBlendAt(pack.realmSeed, x).dominant;
      results.push({
        name: `baseline-biome-x${x}`,
        passed: exp !== undefined && exp === act,
        expected: exp,
        actual: act,
      });
    }
  }

  return results;
}

/** Convenience: capture current outputs as a baseline for future runs. */
export function captureBaseline(pack: GoldenSeedPack): GoldenSeedPack['baseline'] {
  const terrainSurface = pack.xSamples.map(x => terrainHeightAt(pack.realmSeed, 'surface', x));
  const biomeDominants = pack.xSamples.map(x => biomeBlendAt(pack.realmSeed, x).dominant);
  // Use landmarkForCell on cell indices — landmarkAt is proximity-filtered
  // and would be null for most arbitrary X samples, useless as a baseline.
  const landmarksAtCells = pack.xSamples.map(x => {
    const cellIndex = Math.floor(x / LANDMARK_SLOT_SIZE);
    return landmarkForCell(pack.realmSeed, cellIndex)?.type ?? null;
  });
  return { terrainSurface, biomeDominants, landmarksAtCells };
}
