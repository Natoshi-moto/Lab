// src/types.ts
// ============================================================================
// Nexus Lattice — the constitution.
//
// Every segment imports this file (and only this file) for shared types.
// No logic. No functions. No imports. Pure types, type-level constants, and
// JSDoc explaining the WHY behind each shape.
//
// Rules:
//   - If a type appears in more than one segment, it lives here.
//   - If a type lives here, it has documentation explaining why it exists.
//   - No runtime values except `as const` literal unions used by types.
// ============================================================================


// ----------------------------------------------------------------------------
// Branded primitives
//
// Nominal types. A `RealmId` is structurally a `string`, but the type system
// will refuse to accept a `RealmId` where a `PlayerSeed` is expected, and
// vice versa. Five lines of insurance against an entire class of bug.
// ----------------------------------------------------------------------------

declare const __brand: unique symbol;
export type Branded<T, B extends string> = T & { readonly [__brand]: B };

export type CreatureId = Branded<string, 'CreatureId'>;
export type RealmId    = Branded<string, 'RealmId'>;
export type PlayerSeed = Branded<string, 'PlayerSeed'>;


// ----------------------------------------------------------------------------
// Wall-clock guard
//
// Every wall-clock timestamp lives inside `DisplayOnly`. You cannot pass a
// `DisplayOnly` into a hash function without explicitly unwrapping it —
// which is the moment you catch yourself doing the wrong thing. The whole
// determinism story depends on no wall-clock value ever reaching a derivation.
// ----------------------------------------------------------------------------

export interface DisplayOnly {
  /** Milliseconds since epoch. NEVER feeds derivation. UI/log use only. */
  readonly displayOnly: number;
}


// ----------------------------------------------------------------------------
// Layers
//
// Vertical bands of the world. Each manifestation slot belongs to one layer;
// the same X across two layers is a different ManifestationSlot.
// ----------------------------------------------------------------------------

export type LayerId = 'surface' | 'understory' | 'canopy' | 'deep';


// ----------------------------------------------------------------------------
// Biomes
//
// V1 biomes are the three named in the phoneme sets in S1's plan. New biomes
// are a one-line addition to the union — no migration needed because all
// biome lookups go through `BiomeBlend.weights` keyed by `BiomeId`.
// ----------------------------------------------------------------------------

export type BiomeId = 'glassfen' | 'mosswake' | 'ashloom';

export interface BiomeBlend {
  /** Weights per biome. MUST sum to 1.0. Implementations enforce. */
  readonly weights: Readonly<Record<BiomeId, number>>;
  /** The biome with the highest weight, precomputed at sample time. */
  readonly dominant: BiomeId;
}


// ----------------------------------------------------------------------------
// Landmarks
//
// Discrete, named features in the world. Placed deterministically by S0 from
// realmSeed alone (no player input). Used as anchors for naming and as
// spatial influence sources at birth.
// ----------------------------------------------------------------------------

export type LandmarkType = 'BENT_SPIRE' | 'STILL_POOL' | 'ROOT_ARCH';

export interface Landmark {
  readonly type: LandmarkType;
  readonly x: number;          // world coordinate
  readonly amplitude: number;  // 0..1, controls visual size and influence radius
  readonly biome: BiomeId;     // owning biome (for color/style)
}

/**
 * A landmark that's close enough to a query point to influence what happens
 * there. `influence` is 0..1 — 1 at the landmark's exact position, 0 at
 * `LANDMARK_INFLUENCE_RADIUS` distance, smoothstep falloff between.
 *
 * Returned by S0's `landmarkAt(realmSeed, x)`. Consumed by S3 when computing
 * spatial trait biases on offspring. Visual rendering uses bare `Landmark`
 * via `landmarkForCell` — a player sees a Bent Spire from far away even
 * though it doesn't influence a birth from there.
 */
export interface InfluencingLandmark extends Landmark {
  readonly influence: number;
}


// ----------------------------------------------------------------------------
// Locomotion
//
// V1 exposes four archetypes. SLITHER and SKITTER are architected so the
// gene→archetype mapping in S1 has somewhere to grow, but the DNA engine
// must never produce them in V1.
//
// LocomotionTraits is DERIVED from DNA. Values here are concrete (integers
// for counts, world-units for stride, etc.) — not normalized 0..1.
// ----------------------------------------------------------------------------

export type GaitArchetype =
  | 'GLIDE'
  | 'PULSE'
  | 'CREEP'
  | 'LOPE'
  | 'SLITHER'   // architected, not exposed in V1
  | 'SKITTER';  // architected, not exposed in V1

export interface LocomotionTraits {
  readonly archetype: GaitArchetype;
  /** World units per gait cycle. Phase is `fract(worldX/strideLength + gaitOffset)`. */
  readonly strideLength: number;
  readonly bobAmplitude: number;     // pixels
  readonly squashFactor: number;     // typical 0..0.5
  readonly limbCount: number;        // integer
  readonly tendrilCount: number;     // integer
  readonly slopeLeanFactor: number;  // 0..1, body tilt with terrain gradient
  /** 0..1 phase offset, deterministic per-creature. Prevents synchronized motion. */
  readonly gaitOffset: number;
}


// ----------------------------------------------------------------------------
// DNA
//
// Every gene is a 0..1 normalized scalar. This is the contract that survives
// serialization. Discrete traits (eye count, limb count, gait archetype) are
// DERIVED from DNA at render/sim time and never stored as discrete values
// inside the DNA itself. This keeps mutation continuous and gene blending
// arithmetic simple.
// ----------------------------------------------------------------------------

export interface CreatureDNA {
  /** Schema version of the DNA shape. Bump on any structural change. */
  readonly version: 1;

  /** The seed string this DNA was derived from. Reproduces this DNA exactly. */
  readonly seed: string;

  // --- Body ---
  readonly bodyMass: number;      // 0..1
  readonly bodyHeight: number;    // 0..1
  readonly bodyWidth: number;     // 0..1
  readonly bodyTaper: number;     // 0..1, head-to-tail narrowing

  // --- Color (HSL components, normalized) ---
  readonly hueBase: number;       // 0..1, primary hue
  readonly hueShift: number;      // 0..1, secondary accent hue offset
  readonly saturation: number;    // 0..1
  readonly lightness: number;     // 0..1
  readonly translucency: number;  // 0..1, drives ghost / cryptic blend

  // --- Eyes ---
  readonly eyeCount: number;      // 0..1; renderer maps to integer 1..6
  readonly eyeSize: number;       // 0..1
  readonly eyeRinginess: number;  // 0..1, ring/halo intensity

  // --- Limbs and locomotion drivers ---
  readonly legPower: number;      // 0..1, drives bob amplitude and stride
  readonly hover: number;         // 0..1, anti-gravity tendency
  readonly tendrilDensity: number;// 0..1, drives tendril count
  readonly tendrilLength: number; // 0..1

  // --- Behavior tendencies (used by S2 for temperament biasing) ---
  readonly curiosity: number;        // 0..1
  readonly skittishness: number;     // 0..1
  readonly territoriality: number;   // 0..1

  // --- Identity / variance ---
  /** Bitfield of mutation flags packed into an integer. Decoded by S1. */
  readonly mutationFlags: number;
  readonly generation: number;        // 0 for starter, +1 per offspring
  readonly parentAId: CreatureId | null;
  readonly parentBId: CreatureId | null;
}


// ----------------------------------------------------------------------------
// Spatial bonding
//
// SpatialMark is a human-readable record of WHY an offspring's traits came
// out the way they did. Every spatial influence MUST produce one of these,
// or the player has no way to learn the world's grammar.
// ----------------------------------------------------------------------------

export interface SpatialMark {
  readonly source: 'slope' | 'valley' | 'landmark' | 'biome';
  /** Human-readable, e.g. "born on the slope of a Bent Spire". */
  readonly detail: string;
  /** Which DNA genes this mark biased. */
  readonly affectedGenes: readonly (keyof CreatureDNA)[];
  /** 0..1, how strongly the spatial bias was applied. */
  readonly intensity: number;
}


// ----------------------------------------------------------------------------
// Birth context
//
// Captured at the moment a Vessel is used. Locked at Vessel start, consumed
// during Gestation, persisted at Crack. `birthTick` is DERIVED from
// (birthX, bondNonce) — never wall-clock — so a reload reproduces the
// offspring exactly.
// ----------------------------------------------------------------------------

export interface BirthContext {
  readonly realmSeed: string;
  readonly playerSeed: PlayerSeed;
  readonly layer: LayerId;
  readonly birthX: number;
  readonly slope: number;
  readonly biome: BiomeBlend;
  readonly nearestLandmark: Landmark | null;
  readonly distanceToLandmark: number;  // world units; Infinity if none in range
  readonly vesselId: VesselId;
  readonly bondNonce: number;
  /** Deterministic, derived from birthX and bondNonce. NEVER wall-clock. */
  readonly birthTick: number;
}

export interface SpatialBondingContext {
  readonly slope: number;
  readonly biome: BiomeBlend;
  readonly nearestLandmark: Landmark | null;
  readonly distanceToLandmark: number;
}


// ----------------------------------------------------------------------------
// Manifestation
//
// A ManifestationSlot is SHARED (place-bound, derived from realmSeed). The
// CREATURE inside the slot is PERSONAL (apparition-bound, derived from both
// realmSeed and playerSeed). These two seeds must NEVER collapse into one
// — the entire game design rests on this distinction.
// ----------------------------------------------------------------------------

export type Temperament = 'AMBUSH' | 'INVESTIGATOR' | 'SKITTISH' | 'TERRITORIAL';

/**
 * Manifestation lifecycle. Valid transitions:
 *
 *   latent ──▶ cryptic ──▶ watching ──▶ approaching ──▶ tracking ──▶ battle
 *                                                            │           │
 *                                                          fading      │
 *                                                                       ▼
 *                                                                   bondable ──▶ settled
 *                                                                       │
 *                                                                     fading
 *
 * Tracking is hard-capped at 8 seconds (`MANIFEST_TRACKING_CAP_S`).
 */
export type ManifestationState =
  | 'latent'
  | 'cryptic'
  | 'watching'
  | 'approaching'
  | 'tracking'
  | 'battle'
  | 'bondable'
  | 'fading'
  | 'settled';

export interface ManifestationSlot {
  /** Composite ID: `${realmSeed}:${playerSeed}:${layer}:${slotIndex}`. */
  readonly slotId: string;
  readonly slotIndex: number;
  readonly layer: LayerId;
  readonly anchorX: number;        // center of slot in world coords
  readonly temperament: Temperament;
  /** Apparition seed. Derived from BOTH realmSeed and playerSeed. */
  readonly creatureSeed: string;
  readonly perceptionRadius: number;
  readonly interestRadius: number;
  readonly criticalRadius: number;
}

/** Runtime-only state for a manifestation that's currently active. NOT persisted. */
export interface ActiveManifestation {
  readonly slot: ManifestationSlot;
  readonly state: ManifestationState;
  readonly entryX: number | null;         // x at which player triggered cryptic
  /**
   * Wall-time accumulators in seconds. Driven by `dt` from the game loop.
   * They drive state transitions ONLY:
   *   - watchTime grows while in 'watching'; resets on major transitions
   *   - trackTime grows while in 'tracking'; HARD-capped at 8s (see S2's
   *     MAX_TRACKING_TIME_S — non-negotiable, no per-temperament exception)
   *
   * These fields are NOT part of the derivation chain. They MUST NEVER be
   * passed to hashString, included in a namespace, or mixed into any
   * deterministic seed. Future-you reaching for these to seed something:
   * stop. Use bondNonce, birthX, or a slot-derived value instead.
   */
  readonly watchTime: number;
  readonly trackTime: number;
  readonly proximityBand: 'far' | 'perceptive' | 'interest' | 'critical';
}


// ----------------------------------------------------------------------------
// Inherited traits
//
// Every offspring carries an explicit list of WHY it looks the way it does.
// Three sources, every birth: parentA, wildParent, spatial. The Inheritance
// Flash in S5 displays exactly one trait from each source.
// ----------------------------------------------------------------------------

export interface InheritedTrait {
  readonly source: 'parentA' | 'wildParent' | 'spatial';
  readonly geneKey: keyof CreatureDNA;
  readonly geneValue: number;
  /** Human-readable, e.g. "Glow ring inherited from parent A". */
  readonly explanation: string;
}


// ----------------------------------------------------------------------------
// Battle
//
// Three player actions, three wild patterns. Temperament biases the wild's
// pattern distribution. Reading the field gives REAL mechanical advantage,
// not cosmetic. Victory tone is "It stills." — never "Captured!" or
// "Defeated!"
// ----------------------------------------------------------------------------

export type BattleAction = 'HOLD' | 'PRESS' | 'YIELD';
export type WildPattern  = 'TEST' | 'BURST' | 'WITHDRAW';

export interface BattleState {
  readonly phase: 'opening' | 'reading' | 'choosing' | 'resolving' | 'resolved';
  readonly playerCreatureId: CreatureId;
  readonly wildCreatureId: CreatureId;
  readonly wildTemperament: Temperament;
  readonly turn: number;
  /** 0..1 — accumulates toward 1.0 = "It stills." Negative → wild flees. */
  readonly stillness: number;
  /**
   * 0..1 — pre-battle observation reward, fixed at battle init from
   * S2's watchTime. Above S4's reveal threshold, the wild's next pattern
   * is exposed to the player via `revealedNextPattern` BEFORE they
   * choose their action. Below threshold, the player chooses blind.
   * This is the *information* form of the advantage — the shimmer is
   * strategically relevant, not atmospheric.
   */
  readonly fieldReadAdvantage: number;
  /**
   * The wild's pre-revealed next pattern, or null if the player chooses
   * blind this turn. This field is the manifestation of
   * fieldReadAdvantage in the player's perception.
   */
  readonly revealedNextPattern: WildPattern | null;
  /** Deterministic seed for the battle's pattern sequence. */
  readonly battleSeed: string;
  readonly lastWildPattern: WildPattern | null;
  readonly lastPlayerAction: BattleAction | null;
  /** 'unresolved' until phase = 'resolved'; then one of still/flee/lost. */
  readonly outcome: 'unresolved' | 'still' | 'flee' | 'lost';
}


// ----------------------------------------------------------------------------
// Breath
//
// A perception modifier. NEVER affects simulation, physics, or input —
// applied at render time only. Triggers are listed exhaustively because
// adding one requires intentional audio/visual design.
// ----------------------------------------------------------------------------

export type BreathTrigger =
  | 'cryptic_resolve'
  | 'watching_lock'
  | 'battle_start'
  | 'post_victory'
  | 'vessel_rise'
  | 'crack'
  | 'true_name';

export interface BreathState {
  readonly intensity: number;     // 0..1
  readonly desaturation: number;  // 0..1
  readonly slowdown: number;      // 0..1, render-time only
  readonly trigger: BreathTrigger;
}


// ----------------------------------------------------------------------------
// Vessels
//
// V1 set. `null_bloom` is the starter vessel and the only one shown to
// players in V1; the others exist as typed slots so SaveFileV1's economy
// hooks have somewhere to point. Adding new vessels later is a one-line
// union extension plus a save migration only if economy state changes shape.
// ----------------------------------------------------------------------------

export type VesselId = 'null_bloom' | 'ash_bell' | 'tide_chime' | 'glass_egg';

/**
 * 9-phase ceremony, exact durations in S5:
 *
 *   hush              0.0 – 0.8 s
 *   offering          0.8 – 2.0 s
 *   communion         2.0 – 4.0 s
 *   spatial_infusion  4.0 – 5.0 s
 *   gestation         5.0 – 6.6 s   ← offspring DNA computed during this phase
 *   inheritance_flash 6.6 – 7.4 s   ← three readable labels shown
 *   crack             7.4 – 8.1 s   ← save committed at start of crack
 *   silence_bloom     8.1 – 8.7 s   ← the half-second of silence
 *   naming            8.7 – 9.5 s
 */
export type VesselPhase =
  | 'hush'
  | 'offering'
  | 'communion'
  | 'spatial_infusion'
  | 'gestation'
  | 'inheritance_flash'
  | 'crack'
  | 'silence_bloom'
  | 'naming';


// ----------------------------------------------------------------------------
// Creature node
//
// The persisted record for a single creature. `birthContext` is null for
// starter and wild creatures (only `'born'` origin has a birth context).
// `bornAt` is wall-clock and DisplayOnly-wrapped — never used in derivation.
// ----------------------------------------------------------------------------

export interface CreatureNode {
  readonly id: CreatureId;
  readonly dna: CreatureDNA;
  /** Resolved name. Pre-naming, this equals `preRevealName`. */
  readonly trueName: string;
  /** Shown before naming completes: "??? of Blue Glass", "V_r_l", etc. */
  readonly preRevealName: string;
  readonly birthContext: BirthContext | null;     // null for starter / wild
  readonly spatialMarks: readonly SpatialMark[];
  readonly inheritedTraits: readonly InheritedTrait[];
  readonly origin: 'starter' | 'wild' | 'born';
  readonly bornAt: DisplayOnly | null;
}


// ----------------------------------------------------------------------------
// Lineage
// ----------------------------------------------------------------------------

export interface LineageEdge {
  readonly child: CreatureId;
  readonly parentA: CreatureId;
  readonly wildParent: CreatureId;
  readonly bondNonce: number;
}


// ----------------------------------------------------------------------------
// Derivation proof
//
// Spot-check evidence that the world this save claims to describe is the
// world the current code derives. Verified on every load, regenerated on
// every commit. `algoVersion` is part of the proof — a proof made by algo
// v1.2 cannot silently verify under v2.0; the version mismatch is caught
// before any state is loaded.
// ----------------------------------------------------------------------------

export interface DerivationSample {
  readonly x: number;
  readonly terrainHeight: number;
  readonly biomeDominant: BiomeId;
}

export interface DerivationProof {
  readonly algoVersion: string;
  readonly realmSeed: string;
  readonly playerSeed: PlayerSeed;
  readonly samples: readonly DerivationSample[];
  /** Hash of (algoVersion + realmSeed + playerSeed + samples), via S0.hashString. */
  readonly hash: string;
}


// ----------------------------------------------------------------------------
// Action log
//
// Append-only history. Discriminated union — exhaustiveness checking on
// `type` lets every consumer fail-closed when a new action variant is added.
// All timestamps are DisplayOnly.
// ----------------------------------------------------------------------------

export type ActionRecord =
  | {
      readonly type: 'BATTLE_RESOLVED';
      readonly at: DisplayOnly;
      readonly creatureId: CreatureId;
      readonly outcome: 'still' | 'flee' | 'lost';
    }
  | {
      readonly type: 'VESSEL_USED';
      readonly at: DisplayOnly;
      readonly vesselId: VesselId;
      readonly bondNonce: number;
      readonly birthX: number;
    }
  | {
      readonly type: 'OFFSPRING_BORN';
      readonly at: DisplayOnly;
      readonly creatureId: CreatureId;
    }
  | {
      readonly type: 'LANDMARK_DISCOVERED';
      readonly at: DisplayOnly;
      readonly landmarkType: LandmarkType;
      readonly x: number;
    };


// ----------------------------------------------------------------------------
// Save file (V1)
//
// Save the diff, not the world. Anything re-derivable from
// (realmSeed, playerSeed, actions[]) is NOT stored. The schemaVersion +
// algoVersion pair is what makes future migrations possible without losing
// existing players.
// ----------------------------------------------------------------------------

export interface SaveFileV1 {
  readonly schemaVersion: 1;
  readonly algoVersion: string;
  readonly realmSeed: string;
  readonly playerSeed: PlayerSeed;
  /** Increments on every Vessel attempt. Feeds offspring ID derivation. */
  readonly bondNonce: number;
  readonly creatures: Readonly<Record<CreatureId, CreatureNode>>;
  readonly lineage: readonly LineageEdge[];
  readonly actions: readonly ActionRecord[];
  readonly inventory: {
    readonly vessels: Readonly<Record<VesselId, number>>;
    readonly nex: number;
  };
  readonly derivationProof: DerivationProof;
  readonly meta: {
    readonly createdAt: DisplayOnly;
    readonly lastSavedAt: DisplayOnly;
  };
}


// ----------------------------------------------------------------------------
// Asset manifest
//
// Drag-and-drop art/audio later, no code change. Slots exist as typed string
// keys; S10 reads this manifest at startup and falls back to procedural
// rendering when an asset isn't present. Keeping the keys as plain `string`
// inside Records (rather than literal unions) is intentional — it lets new
// assets be added without a code change.
// ----------------------------------------------------------------------------

export interface AssetManifest {
  readonly version: 1;
  readonly creatures: Readonly<Record<string, string>>;
  readonly biomes: Readonly<Record<string, string>>;
  readonly vessels: Readonly<Record<string, string>>;
  readonly audio: Readonly<Record<string, string>>;
}
