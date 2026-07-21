// src/spatial-bonding.ts
// ============================================================================
// S3 — Spatial Bonding + Offspring Engine
//
// Where birth happens. Combines two parents (the player's companion and the
// encountered wild) with the place of birth (slope, biome, landmark) into
// a new offspring with traits inherited, biased, and explained.
//
// FIVE DIRECTIVES:
//
//   1. bondNonce increments on every Vessel ATTEMPT, not every success.
//      S8 owns the counter; S3 reads it via `context.bondNonce`. Failed
//      bonds still consume the nonce, so two attempts at the same X
//      produce different offspring IDs even if only the second succeeds.
//
//   2. birthX in any hash input MUST go through `serializeCoord` (which
//      is `toFixed(6)`). Float-to-string is platform-fragile across JS
//      engines; pinning precision once and routing every call through
//      one helper is the durable fix. Never write `.toFixed(6)` inline.
//
//   3. blendGene clamps output to [0, 1] EXPLICITLY before returning.
//      The prototype does this implicitly via downstream consumers;
//      production code makes the invariant visible at the boundary
//      where it's actually enforced.
//
//   4. Each spatial feature produces its OWN SpatialMark entry. Slope
//      gets one. Biome gets one. Landmark gets one. Three features,
//      three marks. S9 picks which surfaces on the certificate; S3
//      records all of them. Do NOT merge or summarize at this layer.
//
//   5. deriveOffspring is PURE. Parent DNA objects come out bit-identical
//      to how they came in. We clone defensively at the top, never mutate
//      parents, and never read wall-clock time.
// ============================================================================

import type {
  BiomeId,
  BirthContext,
  CreatureDNA,
  CreatureId,
  CreatureNode,
  InheritedTrait,
  Landmark,
  LandmarkType,
  LayerId,
  PlayerSeed,
  SpatialMark,
  VesselId,
} from './types.js';

import {
  hashString,
  rand01,
  clamp,
  lerp,
  smoothstep,
  biomeBlendAt,
  landmarkAt,
  terrainSlopeAt,
  LANDMARK_INFLUENCE_RADIUS,
} from './core/deterministic.js';

import {
  deriveName,
  derivePreRevealName,
  deriveTraitExplanations,
} from './dna-name.js';


// ============================================================================
// Tunable weights
//
// Per spec: parent 70%, vessel 15%, spatial 10%, mutation 5%. Exported for
// playtester tuning. The four constants MUST sum to 1.0 — sanity-checked
// at module load so you fail at import rather than silently producing
// weighted sums that don't equal 100%.
// ============================================================================

export const PARENT_WEIGHT   = 0.70;
export const VESSEL_WEIGHT   = 0.15;
export const SPATIAL_WEIGHT  = 0.10;
export const MUTATION_WEIGHT = 0.05;

/**
 * Default mutation strength used by deriveOffspring on every gene.
 * Range 0..1 — at 1.0, the full 5% mutation slice is random; at 0,
 * mutation falls through to parent value (no mutation).
 */
export const MUTATION_STRENGTH = 1.0;

/**
 * Slope magnitude (|dy/dx|) above which a slope/valley SpatialMark is
 * recorded. Below: the place isn't sloped enough to be worth marking.
 */
export const SLOPE_MARK_THRESHOLD = 0.4;

const _WEIGHT_SUM = PARENT_WEIGHT + VESSEL_WEIGHT + SPATIAL_WEIGHT + MUTATION_WEIGHT;
if (Math.abs(_WEIGHT_SUM - 1) > 1e-9) {
  throw new Error(`Birth weights must sum to 1.0; got ${_WEIGHT_SUM}`);
}


// ============================================================================
// Float serialization (directive #2)
//
// Every float that enters a hash input goes through serializeCoord.
// Centralizing it means one place to change the precision, one place
// to audit, and one place a typo could happen — never deviate.
// ============================================================================

const COORD_PRECISION = 6;
function serializeCoord(x: number): string {
  return x.toFixed(COORD_PRECISION);
}


// ============================================================================
// Numeric DNA gene keys
//
// Same set as in S1. Re-declared here to avoid circular-import dependency
// (S3 imports from S1's `dna-name`; introducing the reverse would couple
// the two segments unnecessarily).
// ============================================================================

type NumericGeneKey =
  | 'bodyMass' | 'bodyHeight' | 'bodyWidth' | 'bodyTaper'
  | 'hueBase' | 'hueShift' | 'saturation' | 'lightness' | 'translucency'
  | 'eyeCount' | 'eyeSize' | 'eyeRinginess'
  | 'legPower' | 'hover' | 'tendrilDensity' | 'tendrilLength'
  | 'curiosity' | 'skittishness' | 'territoriality';


// ============================================================================
// Birth context construction
//
// Built at the moment the Vessel is used (S5 calls this at ceremony start).
// All fields are derived from inputs; `birthTick` is deterministic from
// (birthX, bondNonce) — explicitly NOT wall-clock.
// ============================================================================

export interface BirthContextParams {
  readonly realmSeed: string;
  readonly playerSeed: PlayerSeed;
  readonly layer: LayerId;
  readonly birthX: number;
  readonly vesselId: VesselId;
  readonly bondNonce: number;
}

export function buildBirthContext(params: BirthContextParams): BirthContext {
  const slope = terrainSlopeAt(params.realmSeed, params.layer, params.birthX);
  const biome = biomeBlendAt(params.realmSeed, params.birthX);
  const lm = landmarkAt(params.realmSeed, params.birthX);

  const nearestLandmark: Landmark | null = lm
    ? { type: lm.type, x: lm.x, amplitude: lm.amplitude, biome: lm.biome }
    : null;
  const distanceToLandmark = nearestLandmark
    ? Math.abs(nearestLandmark.x - params.birthX)
    : Infinity;

  // birthTick: deterministic, derived from (birthX, bondNonce). Acts as
  // a tie-breaker and ordering value for offspring at the same coordinate
  // across multiple bond attempts. NEVER wall-clock.
  const birthTick =
    hashString(`birth:v1:tick:${serializeCoord(params.birthX)}:${params.bondNonce}`) >>> 0;

  return {
    realmSeed: params.realmSeed,
    playerSeed: params.playerSeed,
    layer: params.layer,
    birthX: params.birthX,
    slope,
    biome,
    nearestLandmark,
    distanceToLandmark,
    vesselId: params.vesselId,
    bondNonce: params.bondNonce,
    birthTick,
  };
}


// ============================================================================
// Spatial influence (directive #4)
//
// Each feature gets its own GeneBias AND its own SpatialMark — three
// features, up to three of each. S3 does NOT merge marks at this layer;
// S9 picks one to surface for the birth certificate. The mark count is
// the truth, not a summary.
// ============================================================================

export interface GeneBias {
  readonly geneKey: NumericGeneKey;
  /** Target value in [0, 1] for this gene from this source. */
  readonly target: number;
}

export interface SpatialInfluence {
  readonly biases: readonly GeneBias[];
  readonly marks: readonly SpatialMark[];
}

const LANDMARK_EFFECTS: Readonly<Record<LandmarkType, {
  readonly geneKey: NumericGeneKey;
  readonly target: number;
  readonly detail: string;
}>> = {
  BENT_SPIRE: {
    geneKey: 'eyeRinginess',
    target: 0.85,
    detail: 'born under the Bent Spire; gaze took its rings',
  },
  STILL_POOL: {
    geneKey: 'translucency',
    target: 0.85,
    detail: 'born by the Still Pool; skin took its glassy fold',
  },
  ROOT_ARCH: {
    geneKey: 'tendrilDensity',
    target: 0.85,
    detail: 'born under the Root Arch; tendrils branched dense',
  },
};

const BIOME_HUE_TARGETS: Readonly<Record<BiomeId, number>> = {
  glassfen: 0.55,
  mosswake: 0.35,
  ashloom:  0.85,
};

const BIOME_DETAIL: Readonly<Record<BiomeId, string>> = {
  glassfen: 'born under Glassfen light; coloring drifted cool',
  mosswake: 'born in the Mosswake hour; coloring shaded green',
  ashloom:  'born at Ashloom dusk; coloring took ember warmth',
};

export function computeSpatialInfluence(context: BirthContext): SpatialInfluence {
  const biases: GeneBias[] = [];
  const marks: SpatialMark[] = [];

  // ---- Slope ---------------------------------------------------------
  // Significant slope produces one mark. Rising slope biases hover up,
  // falling slope biases bodyMass up. Below threshold: no slope mark.
  if (Math.abs(context.slope) >= SLOPE_MARK_THRESHOLD) {
    const intensity = clamp(Math.abs(context.slope), 0, 1);
    if (context.slope > 0) {
      biases.push({ geneKey: 'hover', target: 0.78 });
      marks.push({
        source: 'slope',
        detail: 'born on a rising slope; carriage lifted',
        affectedGenes: ['hover'],
        intensity,
      });
    } else {
      biases.push({ geneKey: 'bodyMass', target: 0.78 });
      marks.push({
        source: 'valley',
        detail: 'born in a falling slope; weight gathered low',
        affectedGenes: ['bodyMass'],
        intensity,
      });
    }
  }

  // ---- Biome ---------------------------------------------------------
  // Biome ALWAYS produces a mark — the place colors every birth.
  const biome = context.biome.dominant;
  biases.push({ geneKey: 'hueBase', target: BIOME_HUE_TARGETS[biome] });
  marks.push({
    source: 'biome',
    detail: BIOME_DETAIL[biome],
    affectedGenes: ['hueBase'],
    intensity: context.biome.weights[biome],
  });

  // ---- Landmark ------------------------------------------------------
  // Landmark produces a mark only when in influence range.
  const lm = context.nearestLandmark;
  if (lm && context.distanceToLandmark < LANDMARK_INFLUENCE_RADIUS) {
    const intensity = 1 - smoothstep(context.distanceToLandmark / LANDMARK_INFLUENCE_RADIUS);
    const effect = LANDMARK_EFFECTS[lm.type];
    biases.push({ geneKey: effect.geneKey, target: effect.target });
    marks.push({
      source: 'landmark',
      detail: effect.detail,
      affectedGenes: [effect.geneKey],
      intensity,
    });
  }

  return { biases, marks };
}


// ============================================================================
// Vessel bias
//
// V1's null_bloom vessel has no inherent bias — offspring are shaped by
// parents and place, not by the vessel material. The other VesselIds
// exist as typed slots for V2; until then, every vessel is neutral.
// ============================================================================

function vesselBiasesFor(vesselId: VesselId): readonly GeneBias[] {
  // V2 will introduce material-typed vessels with their own biases.
  void vesselId;
  return [];
}


// ============================================================================
// Gene blending (directive #3 — explicit clamp)
//
// Implementation of the spec's weighted sum: parent 70 / vessel 15 /
// spatial 10 / mutation 5. Bias parameters are TARGET VALUES in [0, 1]
// (not offsets). When a source has "no preference" — pass undefined and
// the slice falls through to parent value, preserving the invariant
// that neutral biases produce parent value exactly.
// ============================================================================

export function blendGene(
  geneA: number,
  geneB: number,
  seed: string,
  spatialBias?: number,
  vesselBias?: number,
  mutation: number = 0,
): number {
  // Parent value: deterministic blend of A and B.
  const parentMix = rand01(`${seed}:parentmix`);
  const parentValue = lerp(geneA, geneB, parentMix);

  // Each non-parent slice contributes its weight times its target. When
  // the target is undefined, it falls through to parent value — so the
  // slice contributes `weight * parentValue`, leaving the gene undisturbed.
  const spatial = spatialBias !== undefined ? spatialBias : parentValue;
  const vessel  = vesselBias  !== undefined ? vesselBias  : parentValue;

  // Mutation: random target in [0, 1], scaled toward parent by strength.
  // At mutation=0, this slice IS parent. At mutation=1, it's pure noise.
  const mutationRandom = rand01(`${seed}:mutation`);
  const mutationValue = lerp(parentValue, mutationRandom, mutation);

  const blended =
    PARENT_WEIGHT  * parentValue +
    VESSEL_WEIGHT  * vessel +
    SPATIAL_WEIGHT * spatial +
    MUTATION_WEIGHT * mutationValue;

  // Explicit clamp per directive #3 — visible, not implicit.
  return clamp(blended, 0, 1);
}


// ============================================================================
// DNA cloning (directive #5)
//
// Parent objects come out of deriveOffspring identical to how they went
// in. We never mutate parent DNA — we read fields and produce a fresh
// object. The clone here is defensive: even if a future edit introduced
// a mutation, the clone protects the input.
//
// CreatureDNA is flat (only primitives + nullable parentIds), so spread
// is sufficient and faster than JSON round-trip. If CreatureDNA ever
// grows nested objects, switch to structured clone.
// ============================================================================

function cloneDNA(dna: CreatureDNA): CreatureDNA {
  return { ...dna };
}


// ============================================================================
// Content-addressed creature ID
//
// hash(realmId, parentIds, vessel, coord, bondNonce, dna) → c:{8-hex}.
// birthX serialized via serializeCoord (directive #2). DNA serialized
// with sorted keys and toFixed(6) for floats — engine-independent, stable
// across reloads.
// ============================================================================

function serializeDNAStable(dna: CreatureDNA): string {
  const keys = Object.keys(dna).sort() as Array<Extract<keyof CreatureDNA, string>>;
  return keys.map(k => {
    const v = dna[k];
    if (typeof v === 'number') return `${k}=${v.toFixed(COORD_PRECISION)}`;
    if (v === null) return `${k}=null`;
    return `${k}=${v}`;
  }).join('|');
}

export function contentAddressedId(
  dna: CreatureDNA,
  parentAId: string,
  wildParentId: string,
  vesselId: string,
  realmId: string,
  birthX: number,
  bondNonce: number,
): CreatureId {
  const input = [
    'c:v1',
    realmId,
    parentAId,
    wildParentId,
    vesselId,
    serializeCoord(birthX),
    String(bondNonce),
    serializeDNAStable(dna),
  ].join(':');
  const hex = hashString(input).toString(16).padStart(8, '0');
  return (`c:${hex}`) as CreatureId;
}


// ============================================================================
// Offspring derivation (directive #5 — pure, no parent mutation)
//
// Combines parentA (the player's companion) with wild (the encountered
// creature) at the place described by context, producing a new
// CreatureNode. PURE: no mutation of inputs, no wall-clock, fully
// deterministic from inputs.
// ============================================================================

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export function deriveOffspring(
  parentA: CreatureNode,
  wild: CreatureNode,
  context: BirthContext,
): CreatureNode {
  // Defensive clones. Parents come out of this function bit-identical
  // to how they came in — the clones absorb any mutation that future
  // code might accidentally introduce.
  const aDna = cloneDNA(parentA.dna);
  const bDna = cloneDNA(wild.dna);

  // Spatial + vessel influences.
  const spatial = computeSpatialInfluence(context);
  const vesselBiases = vesselBiasesFor(context.vesselId);

  // Gene → bias-target maps for fast lookup during gene-by-gene blending.
  const spatialMap = new Map<NumericGeneKey, number>();
  for (const b of spatial.biases) spatialMap.set(b.geneKey, b.target);
  const vesselMap = new Map<NumericGeneKey, number>();
  for (const b of vesselBiases) vesselMap.set(b.geneKey, b.target);

  // Common namespace for all gene blends. Each blendGene call appends
  // its own gene name as a sub-namespace.
  const blendSeed = [
    'birth:v1',
    context.realmSeed,
    context.playerSeed,
    serializeCoord(context.birthX),
    context.bondNonce,
  ].join(':');

  // Build offspring DNA gene-by-gene via blendGene.
  const offspringSeed = `${blendSeed}:dna`;
  const dna: Mutable<CreatureDNA> = {
    version: aDna.version,
    seed: offspringSeed,

    bodyMass:       blendGene(aDna.bodyMass,       bDna.bodyMass,       `${blendSeed}:bodyMass`,       spatialMap.get('bodyMass'),       vesselMap.get('bodyMass'),       MUTATION_STRENGTH),
    bodyHeight:     blendGene(aDna.bodyHeight,     bDna.bodyHeight,     `${blendSeed}:bodyHeight`,     spatialMap.get('bodyHeight'),     vesselMap.get('bodyHeight'),     MUTATION_STRENGTH),
    bodyWidth:      blendGene(aDna.bodyWidth,      bDna.bodyWidth,      `${blendSeed}:bodyWidth`,      spatialMap.get('bodyWidth'),      vesselMap.get('bodyWidth'),      MUTATION_STRENGTH),
    bodyTaper:      blendGene(aDna.bodyTaper,      bDna.bodyTaper,      `${blendSeed}:bodyTaper`,      spatialMap.get('bodyTaper'),      vesselMap.get('bodyTaper'),      MUTATION_STRENGTH),

    hueBase:        blendGene(aDna.hueBase,        bDna.hueBase,        `${blendSeed}:hueBase`,        spatialMap.get('hueBase'),        vesselMap.get('hueBase'),        MUTATION_STRENGTH),
    hueShift:       blendGene(aDna.hueShift,       bDna.hueShift,       `${blendSeed}:hueShift`,       spatialMap.get('hueShift'),       vesselMap.get('hueShift'),       MUTATION_STRENGTH),
    saturation:     blendGene(aDna.saturation,     bDna.saturation,     `${blendSeed}:saturation`,     spatialMap.get('saturation'),     vesselMap.get('saturation'),     MUTATION_STRENGTH),
    lightness:      blendGene(aDna.lightness,      bDna.lightness,      `${blendSeed}:lightness`,      spatialMap.get('lightness'),      vesselMap.get('lightness'),      MUTATION_STRENGTH),
    translucency:   blendGene(aDna.translucency,   bDna.translucency,   `${blendSeed}:translucency`,   spatialMap.get('translucency'),   vesselMap.get('translucency'),   MUTATION_STRENGTH),

    eyeCount:       blendGene(aDna.eyeCount,       bDna.eyeCount,       `${blendSeed}:eyeCount`,       spatialMap.get('eyeCount'),       vesselMap.get('eyeCount'),       MUTATION_STRENGTH),
    eyeSize:        blendGene(aDna.eyeSize,        bDna.eyeSize,        `${blendSeed}:eyeSize`,        spatialMap.get('eyeSize'),        vesselMap.get('eyeSize'),        MUTATION_STRENGTH),
    eyeRinginess:   blendGene(aDna.eyeRinginess,   bDna.eyeRinginess,   `${blendSeed}:eyeRinginess`,   spatialMap.get('eyeRinginess'),   vesselMap.get('eyeRinginess'),   MUTATION_STRENGTH),

    legPower:       blendGene(aDna.legPower,       bDna.legPower,       `${blendSeed}:legPower`,       spatialMap.get('legPower'),       vesselMap.get('legPower'),       MUTATION_STRENGTH),
    hover:          blendGene(aDna.hover,          bDna.hover,          `${blendSeed}:hover`,          spatialMap.get('hover'),          vesselMap.get('hover'),          MUTATION_STRENGTH),
    tendrilDensity: blendGene(aDna.tendrilDensity, bDna.tendrilDensity, `${blendSeed}:tendrilDensity`, spatialMap.get('tendrilDensity'), vesselMap.get('tendrilDensity'), MUTATION_STRENGTH),
    tendrilLength:  blendGene(aDna.tendrilLength,  bDna.tendrilLength,  `${blendSeed}:tendrilLength`,  spatialMap.get('tendrilLength'),  vesselMap.get('tendrilLength'),  MUTATION_STRENGTH),

    curiosity:      blendGene(aDna.curiosity,      bDna.curiosity,      `${blendSeed}:curiosity`,      spatialMap.get('curiosity'),      vesselMap.get('curiosity'),      MUTATION_STRENGTH),
    skittishness:   blendGene(aDna.skittishness,   bDna.skittishness,   `${blendSeed}:skittishness`,   spatialMap.get('skittishness'),   vesselMap.get('skittishness'),   MUTATION_STRENGTH),
    territoriality: blendGene(aDna.territoriality, bDna.territoriality, `${blendSeed}:territoriality`, spatialMap.get('territoriality'), vesselMap.get('territoriality'), MUTATION_STRENGTH),

    mutationFlags: hashString(`${blendSeed}:mutationFlags`) >>> 24,
    generation: aDna.generation + 1,
    parentAId: parentA.id,
    parentBId: wild.id,
  };

  // Content-addressed offspring ID.
  const id = contentAddressedId(
    dna,
    parentA.id,
    wild.id,
    context.vesselId,
    context.realmSeed,
    context.birthX,
    context.bondNonce,
  );

  // Names.
  const trueName = deriveName(id, context);
  const preRevealName = derivePreRevealName(id, context);

  // Inherited trait explanations — three records, one per source.
  const inheritedTraits: readonly InheritedTrait[] =
    deriveTraitExplanations(parentA, wild, context);

  return {
    id,
    dna,
    trueName,
    preRevealName,
    birthContext: context,
    spatialMarks: spatial.marks,    // ALL marks per directive #4 — S9 picks one
    inheritedTraits,
    origin: 'born',
    bornAt: null,                    // S5 / S8 fills wall-clock at save time
  };
}
