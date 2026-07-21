// src/dna-name.ts
// ============================================================================
// S1 — DNA Engine + Name Engine
//
// Turning a seed into a creature, and turning a creature + its birthplace
// into a name. The naming layer also produces the InheritedTrait records
// that show up on the birth certificate — so the language register here is
// load-bearing. A trait phrase is a naturalist's field observation, never
// a stat label.
//
//   Right:  "Auralis's slow tendril cadence"
//   Right:  "wild parent's ringed eye"
//   Wrong:  "cadence: 0.3 (inherited)"
//   Wrong:  "tendrilDensity gene from parentA"
//
// These strings go directly to the player. They must read like prose.
// ============================================================================

import type {
  BiomeId,
  BirthContext,
  CreatureDNA,
  CreatureId,
  CreatureNode,
  GaitArchetype,
  InheritedTrait,
  Landmark,
  LandmarkType,
  LocomotionTraits,
} from './types.js';

import {
  hashString,
  rand01,
  pick,
  clamp,
  lerp,
  smoothstep,
  LANDMARK_INFLUENCE_RADIUS,
} from './core/deterministic.js';


// ----------------------------------------------------------------------------
// DNA generation
//
// Every gene is a separate rand01 call with a per-gene namespace. Reproducing
// the DNA from a seed is "feed the seed back through dnaFromSeed", with no
// dependency on call order or hidden state.
// ----------------------------------------------------------------------------

const DNA_VERSION = 1 as const;

export function dnaFromSeed(
  seed: string,
  generation: number = 0,
  parentAId: CreatureId | null = null,
  parentBId: CreatureId | null = null,
): CreatureDNA {
  const ns = `dna:v1:${seed}`;
  return {
    version: DNA_VERSION,
    seed,

    // --- Body ---
    bodyMass:   rand01(`${ns}:bodyMass`),
    bodyHeight: rand01(`${ns}:bodyHeight`),
    bodyWidth:  rand01(`${ns}:bodyWidth`),
    bodyTaper:  rand01(`${ns}:bodyTaper`),

    // --- Color ---
    hueBase:      rand01(`${ns}:hueBase`),
    hueShift:     rand01(`${ns}:hueShift`),
    saturation:   rand01(`${ns}:saturation`),
    lightness:    rand01(`${ns}:lightness`),
    translucency: rand01(`${ns}:translucency`),

    // --- Eyes ---
    eyeCount:     rand01(`${ns}:eyeCount`),
    eyeSize:      rand01(`${ns}:eyeSize`),
    eyeRinginess: rand01(`${ns}:eyeRinginess`),

    // --- Limbs / locomotion drivers ---
    legPower:        rand01(`${ns}:legPower`),
    hover:           rand01(`${ns}:hover`),
    tendrilDensity:  rand01(`${ns}:tendrilDensity`),
    tendrilLength:   rand01(`${ns}:tendrilLength`),

    // --- Behavior ---
    curiosity:      rand01(`${ns}:curiosity`),
    skittishness:   rand01(`${ns}:skittishness`),
    territoriality: rand01(`${ns}:territoriality`),

    // --- Identity / variance ---
    // Top 8 bits of a hash give us a 0..255 bitfield. Plenty of room for
    // discrete mutation flags decoded by S6 at render time.
    mutationFlags: hashString(`${ns}:mutationFlags`) >>> 24,
    generation,
    parentAId,
    parentBId,
  };
}


// ----------------------------------------------------------------------------
// Gait derivation
//
// DNA → archetype → concrete locomotion traits with ±15% within-archetype
// variation so two GLIDE creatures don't move identically.
//
// V1 only exposes GLIDE / PULSE / CREEP / LOPE. SLITHER and SKITTER are
// architected (the profile table includes them) but `pickArchetype` never
// returns them.
// ----------------------------------------------------------------------------

interface ArchetypeProfile {
  readonly strideLength: number;
  readonly bobAmplitude: number;
  readonly squashFactor: number;
  readonly minLimbs: number;
  readonly maxLimbs: number;
}

const ARCHETYPE_PROFILES: Readonly<Record<GaitArchetype, ArchetypeProfile>> = {
  GLIDE:   { strideLength: 200, bobAmplitude:  2, squashFactor: 0.05, minLimbs: 0, maxLimbs: 2 },
  PULSE:   { strideLength:  80, bobAmplitude:  8, squashFactor: 0.30, minLimbs: 0, maxLimbs: 0 },
  CREEP:   { strideLength:  60, bobAmplitude:  3, squashFactor: 0.10, minLimbs: 4, maxLimbs: 8 },
  LOPE:    { strideLength: 140, bobAmplitude: 14, squashFactor: 0.18, minLimbs: 2, maxLimbs: 4 },
  // V2 placeholders, never selected by V1 pickArchetype.
  SLITHER: { strideLength: 100, bobAmplitude:  4, squashFactor: 0.08, minLimbs: 0, maxLimbs: 0 },
  SKITTER: { strideLength:  50, bobAmplitude:  2, squashFactor: 0.06, minLimbs: 6, maxLimbs: 8 },
};

function pickArchetype(dna: CreatureDNA): GaitArchetype {
  // Decision tree on hover, legPower, tendrilDensity. Tuned by hand;
  // boundaries are approximate quartiles.
  if (dna.hover > 0.65) return 'GLIDE';
  if (dna.tendrilDensity > 0.60 && dna.legPower < 0.40) return 'CREEP';
  if (dna.legPower > 0.65) return 'LOPE';
  return 'PULSE';
}

export function deriveGait(dna: CreatureDNA): LocomotionTraits {
  const archetype = pickArchetype(dna);
  const profile = ARCHETYPE_PROFILES[archetype];

  // ±15% within-archetype variation, biased by relevant DNA dimensions.
  const VARIANCE = 0.15;
  const massScale  = 0.5 + dna.bodyMass;       // 0.5..1.5
  const powerScale = 0.5 + dna.legPower;       // 0.5..1.5
  const heightTilt = lerp(1 - VARIANCE, 1 + VARIANCE, dna.bodyHeight);

  const strideLength = profile.strideLength * massScale * heightTilt;
  const bobAmplitude = profile.bobAmplitude * powerScale;
  const squashFactor = profile.squashFactor * lerp(0.7, 1.3, dna.legPower);

  // Discrete counts: split [minLimbs, maxLimbs] by legPower; tendrils 0..7
  // by tendrilDensity. The 0.999 tail keeps the inclusive max from being
  // unreachable due to floor.
  const limbCount    = profile.minLimbs +
                       Math.floor(dna.legPower * (profile.maxLimbs - profile.minLimbs + 0.999));
  const tendrilCount = Math.floor(dna.tendrilDensity * 7.999);

  // Heavier, less-hovering creatures lean into slope more.
  const slopeLeanFactor = clamp(dna.bodyMass - dna.hover * 0.6, 0, 1);

  // Per-creature gait offset so a forest of glides isn't synchronized.
  const gaitOffset = rand01(`gait:v1:${dna.seed}:offset`);

  return {
    archetype,
    strideLength,
    bobAmplitude,
    squashFactor,
    limbCount,
    tendrilCount,
    slopeLeanFactor,
    gaitOffset,
  };
}


// ----------------------------------------------------------------------------
// Creature ID
//
// All IDs share the same shape — `c:` + 8 hex chars. The hash inputs differ
// by origin (starter / wild / born), keeping namespaces from colliding.
// S3's content-addressed scheme will fill in `born:` IDs; S2 will fill in
// `wild:` IDs from manifestation slot seeds.
// ----------------------------------------------------------------------------

function makeCreatureId(input: string): CreatureId {
  const hex = hashString(input).toString(16).padStart(8, '0');
  return (`c:${hex}`) as CreatureId;
}


// ----------------------------------------------------------------------------
// Starter companion
//
// One companion per player, deterministic from playerSeed alone. No birth
// context, no spatial marks, no inherited traits — generation 0. The name
// is resolved at creation time (the starter has no Vessel ceremony to wait
// through).
// ----------------------------------------------------------------------------

export function createStarterCompanion(playerSeed: string): CreatureNode {
  const seed = `starter:v1:${playerSeed}`;
  const dna = dnaFromSeed(seed, 0, null, null);
  const id = makeCreatureId(seed);
  const trueName = deriveStarterName(id, dna);

  return {
    id,
    dna,
    trueName,
    preRevealName: trueName, // already revealed
    birthContext: null,
    spatialMarks: [],
    inheritedTraits: [],
    origin: 'starter',
    bornAt: null,
  };
}


// ----------------------------------------------------------------------------
// Names — phoneme banks
//
// Each biome has a syllable bank. Names are 2–4 syllables concatenated and
// capitalized. Two creatures from the same biome should sound *like* they
// share a place; cross-biome names should sound distinct.
// ----------------------------------------------------------------------------

const BIOME_PHONEMES: Readonly<Record<BiomeId, readonly string[]>> = {
  glassfen: ['vi', 'rel', 'sha', 'lue', 'fen', 'aur', 'lis', 'gla', 'mir', 'ess'],
  mosswake: ['mo', 'ru', 'nam', 'sse', 'wak', 'lim', 'oss', 'ro',  'lev', 'an'],
  ashloom:  ['ash', 'ka',  'om',  'lo',  'em',  'ar',  'ren', 'tho', 'kar', 'ul'],
};

const EPITHETS: Readonly<Record<BiomeId, readonly string[]>> = {
  glassfen: ['Blue Glass', 'Quiet Fen', 'Pale Vapor', 'Slow Light', 'Cold Mirror', 'Glass Ash'],
  mosswake: ['Soft Wake',  'Green Hour', 'Mossbed',   'Drift Loam', 'Wet Stone',   'Long Shade'],
  ashloom:  ['Old Ash',    'Burnt Bell', 'Ember Coil','Hush',       'Charcoal Wind','Slow Smoke'],
};

const LANDMARK_DISPLAY: Readonly<Record<LandmarkType, string>> = {
  BENT_SPIRE: 'Bent Spire',
  STILL_POOL: 'Still Pool',
  ROOT_ARCH:  'Root Arch',
};

function buildRoot(creatureId: string, biome: BiomeId): string {
  const phonemes = BIOME_PHONEMES[biome];
  // 2..4 syllables. The 2.999 tail keeps 4 reachable without hitting 5.
  const numPhonemes = 2 + Math.floor(rand01(`name:v1:${creatureId}:rootlen`) * 2.999);
  let root = '';
  for (let i = 0; i < numPhonemes; i++) {
    root += pick(`name:v1:${creatureId}:phoneme:${i}`, phonemes);
  }
  return root.charAt(0).toUpperCase() + root.slice(1);
}

/**
 * Spatial naming primitive. Same logic as `deriveName`, but takes the
 * spatial fields directly so callers without a full BirthContext (e.g.
 * wild creatures derived from a manifestation slot) can use it without
 * synthesizing one. `deriveName` is now a thin wrapper.
 */
export function deriveSpatialName(
  creatureId: string,
  biome: BiomeId,
  nearestLandmark: Landmark | null,
  distanceToLandmark: number,
): string {
  const root = buildRoot(creatureId, biome);

  // If a landmark is meaningfully close, the name belongs to it.
  if (nearestLandmark && distanceToLandmark < LANDMARK_INFLUENCE_RADIUS) {
    return `${root} under the ${LANDMARK_DISPLAY[nearestLandmark.type]}`;
  }

  const epithet = pick(`name:v1:${creatureId}:epithet`, EPITHETS[biome]);
  return `${root} of the ${epithet}`;
}

export function deriveName(creatureId: string, context: BirthContext): string {
  return deriveSpatialName(
    creatureId,
    context.biome.dominant,
    context.nearestLandmark,
    context.distanceToLandmark,
  );
}

function deriveStarterName(id: string, dna: CreatureDNA): string {
  // Starters have no birthplace. Use hueBase to assign a thematic biome
  // for naming purposes — the player's first companion is colored by the
  // starter seed itself.
  const biome: BiomeId =
    dna.hueBase < 0.34 ? 'glassfen' :
    dna.hueBase < 0.67 ? 'mosswake' : 'ashloom';
  const root = buildRoot(id, biome);
  const epithet = pick(`name:v1:${id}:epithet`, EPITHETS[biome]);
  return `${root} of the ${epithet}`;
}


// ----------------------------------------------------------------------------
// Pre-reveal names
//
// Used during the Vessel ceremony before the 'naming' phase resolves the
// true name. Three forms — one is a redacted version of the true root,
// one is a biome-keyed mystery, one is the placeholder. Picked
// deterministically per-creature so a given offspring's pre-reveal is
// stable across reloads.
// ----------------------------------------------------------------------------

const PRE_REVEAL_FORMS = ['mystery', 'glyph', 'kin'] as const;

export function derivePreRevealName(creatureId: string, context: BirthContext): string {
  const form = pick(`name:v1:${creatureId}:prereveal:form`, PRE_REVEAL_FORMS);

  if (form === 'mystery') {
    // "??? of the Blue Glass"
    const epithet = pick(`name:v1:${creatureId}:epithet`, EPITHETS[context.biome.dominant]);
    return `??? of the ${epithet}`;
  }

  if (form === 'glyph') {
    // "Virel" -> "V_r_l" — first char kept, vowels redacted to underscores
    const root = buildRoot(creatureId, context.biome.dominant);
    let out = root.charAt(0);
    for (let i = 1; i < root.length; i++) {
      out += /[aeiouAEIOU]/.test(root[i]) ? '_' : root[i];
    }
    return out;
  }

  return 'Unresolved Kin';
}


// ----------------------------------------------------------------------------
// Trait explanations
//
// The naturalist register is the contract here. Each phrase reads as a
// field observation by someone who has spent time with the animal, not as
// a stat readout. Test: would this phrase look right hand-lettered on a
// museum specimen card? If no, rewrite.
//
// One trait from parentA, one from wild, one from the spatial context.
// Three is the magic number — enough that the player can see inheritance,
// few enough that the certificate stays readable.
// ----------------------------------------------------------------------------

/** The subset of CreatureDNA keys that are numeric 0..1 genes. */
type NumericGeneKey =
  | 'bodyMass' | 'bodyHeight' | 'bodyWidth' | 'bodyTaper'
  | 'hueBase' | 'hueShift' | 'saturation' | 'lightness' | 'translucency'
  | 'eyeCount' | 'eyeSize' | 'eyeRinginess'
  | 'legPower' | 'hover' | 'tendrilDensity' | 'tendrilLength'
  | 'curiosity' | 'skittishness' | 'territoriality';

const NUMERIC_GENE_KEYS: readonly NumericGeneKey[] = [
  'bodyMass', 'bodyHeight', 'bodyWidth', 'bodyTaper',
  'hueBase', 'hueShift', 'saturation', 'lightness', 'translucency',
  'eyeCount', 'eyeSize', 'eyeRinginess',
  'legPower', 'hover', 'tendrilDensity', 'tendrilLength',
  'curiosity', 'skittishness', 'territoriality',
];

interface GenePhrase {
  readonly high: string;
  readonly low: string;
  readonly mid: string;
}

/**
 * Phrase bank. Each value reads as an observation, not a measurement.
 * Boring phrases get rewritten until they don't. If a player wouldn't
 * underline this on first read of a birth certificate, it's not done.
 */
const GENE_PHRASES: Readonly<Record<NumericGeneKey, GenePhrase>> = {
  bodyMass:        { high: 'massive build',           low: 'lithe frame',             mid: 'middling weight' },
  bodyHeight:      { high: 'tall silhouette',         low: 'low-slung body',          mid: 'even stature' },
  bodyWidth:       { high: 'broad shoulders',         low: 'narrow profile',          mid: 'plain width' },
  bodyTaper:       { high: 'long taper to the tail',  low: 'blunt rear',              mid: 'soft taper' },

  hueBase:         { high: 'warm coloring',           low: 'cool coloring',           mid: 'plain coloring' },
  hueShift:        { high: 'shifted accent',          low: 'matched accent',          mid: 'subtle accent' },
  saturation:      { high: 'vivid color',             low: 'washed coloring',         mid: 'muted tones' },
  lightness:       { high: 'pale glow',               low: 'dark coat',               mid: 'mid-tone shading' },
  translucency:    { high: 'glassy translucency',     low: 'solid skin',              mid: 'hazy surface' },

  eyeCount:        { high: 'many eyes',               low: 'single watchful eye',     mid: 'paired eyes' },
  eyeSize:         { high: 'wide pupils',             low: 'pinprick eyes',           mid: 'careful gaze' },
  eyeRinginess:    { high: 'ringed eye',              low: 'unmarked iris',           mid: 'faint halo' },

  legPower:        { high: 'powerful stride',         low: 'shuffling gait',          mid: 'steady step' },
  hover:           { high: 'hovering carriage',       low: 'grounded weight',         mid: 'half-lifted poise' },
  tendrilDensity:  { high: 'dense tendril fringe',    low: 'sparse tendrils',         mid: 'modest fringe' },
  tendrilLength:   { high: 'long trailing tendrils',  low: 'short tendril stubs',     mid: 'medium tendrils' },

  curiosity:       { high: 'forward-leaning curiosity', low: 'cautious distance',     mid: 'watchful interest' },
  skittishness:    { high: 'flighty bearing',         low: 'steady nerve',            mid: 'measured calm' },
  territoriality:  { high: 'territorial stance',      low: 'wandering ease',          mid: 'guarded presence' },
};

function geneTier(value: number): 'high' | 'low' | 'mid' {
  if (value > 0.66) return 'high';
  if (value < 0.33) return 'low';
  return 'mid';
}

function describeGene(key: NumericGeneKey, value: number): string {
  return GENE_PHRASES[key][geneTier(value)];
}

/**
 * Distinctiveness: how far the gene is from the boring middle. Picking the
 * most distinctive gene gives the player the trait that's most visibly
 * "from" that parent — which is the entire point of the explanation.
 */
function geneDistinctiveness(value: number): number {
  return Math.abs(value - 0.5) * 2; // 0 at 0.5, 1 at 0 or 1
}

function pickDistinctiveGene(dna: CreatureDNA, namespace: string): NumericGeneKey {
  let best: NumericGeneKey = NUMERIC_GENE_KEYS[0];
  let bestScore = -1;
  for (const key of NUMERIC_GENE_KEYS) {
    const value = dna[key];
    // Tiny deterministic perturbation breaks ties stably across reloads.
    const score = geneDistinctiveness(value) + rand01(`${namespace}:tie:${key}`) * 0.001;
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best;
}


// --- Spatial summary --------------------------------------------------------
//
// S3 owns the canonical SpatialMark[] (the *math*). This function picks the
// single most-storyworthy spatial influence and describes it for the
// inheritance flash. The two are allowed to diverge in detail: S3 might
// record three small influences; this picks one to *tell* the player about.
//
// === S3 WIRE-UP POINT =======================================================
// The `geneValue` literals below (0.72, 0.55) are PLACEHOLDERS. When S3
// lands, deriveTraitExplanations should take an `offspring: CreatureNode`
// parameter and populate spatial geneValue from offspring.dna[geneKey].
// Search for "S3 WIRE-UP POINT" — this is the only location to change.
// ============================================================================

interface SpatialSummary {
  readonly geneKey: NumericGeneKey;
  readonly geneValue: number;
  readonly explanation: string;
}

function summarizeSpatial(context: BirthContext): SpatialSummary {
  const lm = context.nearestLandmark;
  const lmInRange = lm && context.distanceToLandmark < LANDMARK_INFLUENCE_RADIUS;

  // Strongest first: in-range landmark beats slope beats biome.
  if (lmInRange && lm) {
    if (lm.type === 'BENT_SPIRE') {
      return {
        geneKey: 'eyeRinginess',
        geneValue: 0.72,
        explanation: 'ringed gaze drawn from the Bent Spire',
      };
    }
    if (lm.type === 'STILL_POOL') {
      return {
        geneKey: 'translucency',
        geneValue: 0.72,
        explanation: 'translucency caught from the Still Pool',
      };
    }
    if (lm.type === 'ROOT_ARCH') {
      return {
        geneKey: 'tendrilDensity',
        geneValue: 0.72,
        explanation: 'tendril fringe shaped by the Root Arch',
      };
    }
  }

  if (Math.abs(context.slope) > 0.5) {
    return context.slope > 0
      ? { geneKey: 'hover',    geneValue: 0.72, explanation: 'lifted carriage from the rising slope' }
      : { geneKey: 'bodyMass', geneValue: 0.72, explanation: 'low-set weight gathered from the falling slope' };
  }

  // Fallback: biome's quiet effect on coloring. Lower confidence (0.55)
  // than the landmark/slope cases because nothing dramatic shaped this birth.
  const biome = context.biome.dominant;
  const phrase =
    biome === 'glassfen' ? 'pale Glassfen light'  :
    biome === 'mosswake' ? 'green Mosswake hour'  :
                           'ashen Ashloom dusk';
  return {
    geneKey: 'hueBase',
    geneValue: 0.55,
    explanation: `coloring of the ${phrase}`,
  };
}


export function deriveTraitExplanations(
  parentA: CreatureNode,
  wild: CreatureNode,
  context: BirthContext,
): InheritedTrait[] {
  const aGene = pickDistinctiveGene(parentA.dna, `traits:v1:${parentA.id}:A`);
  const wGene = pickDistinctiveGene(wild.dna,    `traits:v1:${wild.id}:W`);
  const spatial = summarizeSpatial(context);

  const aValue = parentA.dna[aGene];
  const wValue = wild.dna[wGene];

  return [
    {
      source: 'parentA',
      geneKey: aGene,
      geneValue: aValue,
      explanation: `${parentA.trueName}'s ${describeGene(aGene, aValue)}`,
    },
    {
      source: 'wildParent',
      geneKey: wGene,
      geneValue: wValue,
      explanation: `wild parent's ${describeGene(wGene, wValue)}`,
    },
    {
      source: 'spatial',
      geneKey: spatial.geneKey,
      geneValue: spatial.geneValue,
      explanation: spatial.explanation,
    },
  ];
}
