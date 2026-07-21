// src/manifestation.ts
// ============================================================================
// S2 — Manifestation System
//
// Where the world's apparitions live. A slot is a place; the apparition in
// that slot is personal (depends on the player's seed). The state machine
// drives one creature from latent through battle to settled or fading.
//
// FOUR DIRECTIVES (in priority order):
//
//   1. Temperament must be readable from the cryptic tell alone — no UI
//      label, no tooltip. AMBUSH and SKITTISH should be distinguishable
//      by a player who has run 10 encounters. Each tell has a distinct
//      `kind` literal — that's the contract S6 branches on to render four
//      DIFFERENT effects, not four parameter sets of one effect.
//
//   2. Tracking cap is 8 seconds HARD. Not a soft suggestion. Not
//      configurable per-temperament. The harassment-loop risk is real —
//      a player holding distance while the creature follows is a worse
//      experience than the creature giving up. After 8s in tracking: fade.
//
//   3. Cadence parameters are exported constants at the top of this file.
//      Day-one playtesting needs to tune these without touching algorithm
//      logic. Find a number, change it, reload. No grep needed.
//
//   4. watchTime and trackTime are wall-time accumulators sourced from
//      the game loop's dt. They drive state transitions ONLY. They are
//      NOT part of the derivation chain. They never enter a hash function.
//      The canonical reminder lives on the field declarations in types.ts.
// ============================================================================

import type {
  ActiveManifestation,
  CreatureId,
  CreatureNode,
  Landmark,
  LayerId,
  ManifestationSlot,
  Temperament,
} from './types.js';

import {
  hashString,
  rand01,
  randRange,
  pick,
  clamp,
  biomeBlendAt,
  landmarkAt,
} from './core/deterministic.js';

import { dnaFromSeed, deriveSpatialName } from './dna-name.js';


// ============================================================================
// Tunable constants
//
// Every number a playtester might want to dial lives up here. If you find
// yourself hardcoding a number deeper in this file, it belongs here instead.
// ============================================================================

/** World units per slot. Slot index `i` covers x ∈ [i * SIZE, (i+1) * SIZE). */
export const MANIFEST_SLOT_SIZE = 768;

/**
 * How far ahead/behind to consider slots for waking. Should be ≥ the
 * largest perceptionRadius of any temperament so a player approaching
 * from afar can still trigger an AMBUSH.
 */
export const SLOT_SEARCH_RADIUS = 1500;

/** Time without an encounter before pressure starts increasing wake odds. */
export const DRY_WALK_WARNING_MS = 30_000;

/** Time without an encounter at which the next plausible slot is forced awake. */
export const DRY_WALK_FORCE_MS = 60_000;

/** Soft cap on simultaneously active manifestations — too many breaks attention. */
export const MAX_ACTIVE_MANIFESTATIONS = 3;

/**
 * HARD cap on tracking state, in seconds. Per spec — non-negotiable. Do NOT
 * extend per temperament. A player holding distance while the creature
 * follows is a harassment loop; the creature giving up is the right call.
 */
export const MAX_TRACKING_TIME_S = 8;

/** Distance at which 'approaching' transitions to 'tracking'. */
export const APPROACH_REACH_PROXIMITY = 80;

/** How long a fade phase lasts before the runtime returns the slot to latent. */
export const FADE_DURATION_MS = 1200;

/**
 * Hysteresis on the perception edge. Once a slot has woken, the player
 * must move this much PAST perceptionRadius to re-latent it. Prevents
 * flicker when the player walks parallel to a slot's edge.
 */
export const PERCEPTION_HYSTERESIS = 60;


// ============================================================================
// Temperament configuration
//
// Each temperament gets:
//   - distinct radii (perception → interest → critical)
//   - approach behavior (positive: closes; negative: flees; zero: waits)
//   - tracking persistence multiplier (within the 8s hard cap)
//   - a cryptic tell with a distinct `kind` literal for S6 to branch on
// ============================================================================

export interface CrypticTell {
  /**
   * Discrete kind. S6 branches on this literal to draw four DIFFERENT
   * effects (not four parameter sets of one effect). The visual distinction
   * is the contract; the parameters below are tuning within that contract.
   */
  readonly kind: 'shimmer-tight' | 'pulse' | 'flicker' | 'shimmer-wide';
  /** Hz — how often the tell repeats. */
  readonly frequencyHz: number;
  /** 0..1 — how strong each repetition is. */
  readonly amplitude: number;
  /** 0..1 — directional bias. 0 = symmetric (hides direction), 1 = strongly off-axis. */
  readonly asymmetry: number;
  /** Color cast for the tell. */
  readonly colorCast: 'cool' | 'warm' | 'mixed';
}

export interface TemperamentConfig {
  /** distance at which entering player triggers 'cryptic' */
  readonly perceptionRadius: number;
  /** distance at which 'cryptic' → 'watching' */
  readonly interestRadius: number;
  /** distance at which 'watching' transitions outward (battle / approach / flee) */
  readonly criticalRadius: number;
  /** world units/sec; positive closes, negative flees, zero stays */
  readonly approachSpeed: number;
  /** multiplier on dt for trackTime accumulation. ALWAYS hard-capped at 8s. */
  readonly trackingPersistence: number;
  readonly crypticTell: CrypticTell;
}

const TEMPERAMENT_CONFIGS: Readonly<Record<Temperament, TemperamentConfig>> = {
  AMBUSH: {
    perceptionRadius: 600,    // sees you from far
    interestRadius:   400,
    criticalRadius:   120,    // strikes only at close range
    approachSpeed:    0,      // doesn't approach — waits
    trackingPersistence: 1.0,
    crypticTell: {
      kind:        'shimmer-tight',  // small, dense, focused — the predator's stillness
      frequencyHz: 0.4,              // slow, patient
      amplitude:   0.4,              // subtle — doesn't want to be found
      asymmetry:   0,                // symmetric — hides direction
      colorCast:   'cool',
    },
  },
  INVESTIGATOR: {
    perceptionRadius: 500,
    interestRadius:   350,
    criticalRadius:   200,    // happy to come close
    approachSpeed:    90,
    trackingPersistence: 1.2,
    crypticTell: {
      kind:        'pulse',          // rhythmic, like a heartbeat or curious blink
      frequencyHz: 1.5,
      amplitude:   0.7,              // visible — comfortable being seen
      asymmetry:   0.4,              // slightly directional
      colorCast:   'warm',
    },
  },
  SKITTISH: {
    perceptionRadius: 800,    // notices you very far away
    interestRadius:   250,
    criticalRadius:   100,
    approachSpeed:    -70,    // moves AWAY
    trackingPersistence: 0.6, // gives up faster
    crypticTell: {
      kind:        'flicker',        // fast on/off — unstable presence
      frequencyHz: 4.0,
      amplitude:   0.5,
      asymmetry:   0,                // could be anywhere
      colorCast:   'mixed',
    },
  },
  TERRITORIAL: {
    perceptionRadius: 350,    // narrow patrol
    interestRadius:   300,
    criticalRadius:   220,
    approachSpeed:    60,     // closes slowly but steadily
    trackingPersistence: 1.5,
    crypticTell: {
      kind:        'shimmer-wide',   // big, spread, claiming territory
      frequencyHz: 0.8,
      amplitude:   0.9,              // strong — wants you to know it's here
      asymmetry:   0.7,              // strongly directional — points at the territory
      colorCast:   'warm',
    },
  },
};

export function temperamentConfig(temp: Temperament): TemperamentConfig {
  return TEMPERAMENT_CONFIGS[temp];
}


// ============================================================================
// Slot derivation
//
// Place is shared, apparition is personal. The slot's anchorX uses
// realmSeed only — two players see slots in the same world positions. The
// temperament and creatureSeed use both seeds — different apparitions per
// player at the same place. These two seeds must NEVER collapse into one.
// ============================================================================

const TEMPERAMENTS: readonly Temperament[] =
  ['AMBUSH', 'INVESTIGATOR', 'SKITTISH', 'TERRITORIAL'];

export function manifestationSlotAt(
  realmSeed: string,
  playerSeed: string,
  layer: LayerId,
  slotIndex: number,
): ManifestationSlot {
  // The composite slot ID. Both seeds participate. Place + apparition.
  const slotId = `manifest:v1:${realmSeed}:${playerSeed}:${layer}:${slotIndex}`;

  // anchorX uses realmSeed alone — slots are world-fixed places.
  const placeNs = `place:v1:${realmSeed}:${layer}:${slotIndex}`;
  const jitter = randRange(`${placeNs}:jitter`, 0.2, 0.8);
  const anchorX = (slotIndex + jitter) * MANIFEST_SLOT_SIZE;

  // Temperament + creature seed use both seeds — apparition is personal.
  const temperament = pick(`${slotId}:temperament`, TEMPERAMENTS);
  const config = TEMPERAMENT_CONFIGS[temperament];
  const creatureSeed = `${slotId}:creature`;

  return {
    slotId,
    slotIndex,
    layer,
    anchorX,
    temperament,
    creatureSeed,
    perceptionRadius: config.perceptionRadius,
    interestRadius:   config.interestRadius,
    criticalRadius:   config.criticalRadius,
  };
}

/**
 * Iterate slots near a player position. The runtime in S10 calls this each
 * frame to decide which slots to consider for waking.
 */
export function slotsNearPlayer(
  realmSeed: string,
  playerSeed: string,
  layer: LayerId,
  playerX: number,
): ManifestationSlot[] {
  const centerSlotIndex = Math.floor(playerX / MANIFEST_SLOT_SIZE);
  const radiusInSlots = Math.ceil(SLOT_SEARCH_RADIUS / MANIFEST_SLOT_SIZE);
  const slots: ManifestationSlot[] = [];
  for (let dc = -radiusInSlots; dc <= radiusInSlots; dc++) {
    slots.push(manifestationSlotAt(realmSeed, playerSeed, layer, centerSlotIndex + dc));
  }
  return slots;
}


// ============================================================================
// Wild creature derivation
//
// Wild creatures live in slots; they're never "born" via Vessel ceremony.
// They serve as the wild parent in offspring derivation later, and they
// show up in the lineage view — so they get a real, place-flavored name
// the same way an offspring would, via S1's deriveSpatialName.
// ============================================================================

export function wildForSlot(slot: ManifestationSlot, realmSeed: string): CreatureNode {
  const dna = dnaFromSeed(slot.creatureSeed, 0, null, null);
  const id = (`c:${hashString(slot.creatureSeed).toString(16).padStart(8, '0')}`) as CreatureId;

  // Resolve spatial name directly from the slot's place — no synthetic
  // BirthContext, no placeholder fields. This was the seam the S1 refactor
  // closed.
  const blend = biomeBlendAt(realmSeed, slot.anchorX);
  const lm = landmarkAt(realmSeed, slot.anchorX);
  const nearestLandmark: Landmark | null = lm
    ? { type: lm.type, x: lm.x, amplitude: lm.amplitude, biome: lm.biome }
    : null;
  const distanceToLandmark = nearestLandmark
    ? Math.abs(nearestLandmark.x - slot.anchorX)
    : Infinity;

  const trueName = deriveSpatialName(id, blend.dominant, nearestLandmark, distanceToLandmark);

  return {
    id,
    dna,
    trueName,
    preRevealName: trueName,    // wild creatures aren't "revealed" — they just are
    birthContext:  null,
    spatialMarks:  [],
    inheritedTraits: [],
    origin:        'wild',
    bornAt:        null,
  };
}


// ============================================================================
// State machine
//
// Pure function: given the previous ActiveManifestation and the current
// frame's player position/speed/dt, returns the next ActiveManifestation.
//
// Lifecycle (transitions, not all states):
//
//   latent ──▶ cryptic ──▶ watching ──▶ approaching ──▶ tracking ──▶ battle
//                                  │           │           │           │
//                                  ▼           ▼           ▼           ▼
//                                fading      fading      fading     bondable ──▶ settled
//                                                                       │
//                                                                       ▼
//                                                                     fading
//
// The runtime in S10 owns the ActiveManifestation collection and calls
// this each frame for each active slot.
// ============================================================================

type ProximityBand = ActiveManifestation['proximityBand'];

function computeProximityBand(
  distance: number,
  config: TemperamentConfig,
  alreadyAwake: boolean,
): ProximityBand {
  // Hysteresis only on the perception edge — that's where flicker matters.
  const perceptionEdge = alreadyAwake
    ? config.perceptionRadius + PERCEPTION_HYSTERESIS
    : config.perceptionRadius;

  if (distance >= perceptionEdge)         return 'far';
  if (distance < config.criticalRadius)   return 'critical';
  if (distance < config.interestRadius)   return 'interest';
  return 'perceptive';
}

const SLOW_PLAYER_THRESHOLD = 5; // world units/sec; below this, the player has stopped

export function updateManifestationState(
  active: ActiveManifestation,
  playerX: number,
  playerSpeed: number,
  dt: number,
): ActiveManifestation {
  const config = TEMPERAMENT_CONFIGS[active.slot.temperament];
  const distance = Math.abs(playerX - active.slot.anchorX);

  const alreadyAwake =
    active.state !== 'latent' &&
    active.state !== 'fading' &&
    active.state !== 'settled';

  const band = computeProximityBand(distance, config, alreadyAwake);

  // Wall-time accumulators. (Reminder: NEVER feeds derivation. See the
  // field comment on ActiveManifestation in types.ts.)
  const watchTime = active.state === 'watching'
    ? active.watchTime + dt
    : 0;
  const trackTime = active.state === 'tracking'
    ? active.trackTime + dt * config.trackingPersistence
    : 0;

  // ── HARD CAP ──────────────────────────────────────────────────────────
  // 8 seconds in tracking forces fade. No exceptions. No per-temperament
  // override. This is the harassment-loop guardrail.
  if (active.state === 'tracking' && trackTime >= MAX_TRACKING_TIME_S) {
    return { ...active, state: 'fading', watchTime, trackTime, proximityBand: band };
  }

  // ── Per-state transitions ─────────────────────────────────────────────
  switch (active.state) {
    case 'latent':
      if (band !== 'far') {
        return {
          ...active,
          state: 'cryptic',
          entryX: playerX,
          watchTime: 0,
          trackTime: 0,
          proximityBand: band,
        };
      }
      return { ...active, watchTime: 0, trackTime: 0, proximityBand: band };

    case 'cryptic':
      if (band === 'far') {
        return { ...active, state: 'fading', watchTime, trackTime, proximityBand: band };
      }
      if (band === 'interest' || band === 'critical') {
        return {
          ...active,
          state: 'watching',
          watchTime: 0,
          trackTime: 0,
          proximityBand: band,
        };
      }
      return { ...active, watchTime, trackTime, proximityBand: band };

    case 'watching':
      if (band === 'far') {
        return { ...active, state: 'fading', watchTime, trackTime, proximityBand: band };
      }
      if (band === 'critical') {
        // Branch on temperament: AMBUSH strikes, SKITTISH flees, others approach.
        if (active.slot.temperament === 'AMBUSH') {
          return { ...active, state: 'battle',  watchTime, trackTime, proximityBand: band };
        }
        if (active.slot.temperament === 'SKITTISH') {
          return { ...active, state: 'fading',  watchTime, trackTime, proximityBand: band };
        }
        return   { ...active, state: 'approaching', watchTime, trackTime, proximityBand: band };
      }
      return { ...active, watchTime, trackTime, proximityBand: band };

    case 'approaching':
      if (band === 'far') {
        return { ...active, state: 'fading', watchTime, trackTime, proximityBand: band };
      }
      if (distance < APPROACH_REACH_PROXIMITY) {
        return {
          ...active,
          state: 'tracking',
          watchTime,
          trackTime: 0,
          proximityBand: band,
        };
      }
      return { ...active, watchTime, trackTime, proximityBand: band };

    case 'tracking':
      if (band === 'far') {
        return { ...active, state: 'fading', watchTime, trackTime, proximityBand: band };
      }
      // Player has stopped moving while at critical proximity — engage.
      if (Math.abs(playerSpeed) < SLOW_PLAYER_THRESHOLD && band === 'critical') {
        return { ...active, state: 'battle', watchTime, trackTime, proximityBand: band };
      }
      return { ...active, watchTime, trackTime, proximityBand: band };

    case 'battle':
      // S4 owns battle resolution and transitions us to 'bondable' or 'fading'.
      return { ...active, watchTime, trackTime, proximityBand: band };

    case 'bondable':
      if (band === 'far') {
        return { ...active, state: 'fading', watchTime, trackTime, proximityBand: band };
      }
      // Otherwise wait for Vessel use; S5 transitions us to 'settled'.
      return { ...active, watchTime, trackTime, proximityBand: band };

    case 'fading':
      // Stay in fading; the runtime decides when to drop the slot or
      // return it to latent based on FADE_DURATION_MS elapsed in S10.
      return { ...active, watchTime, trackTime, proximityBand: band };

    case 'settled':
      // Terminal state. Slot is "satisfied" for this player.
      return active;
  }
}


// ============================================================================
// Encounter cadence
//
// Spec calls for `encounterCadenceStats(state: SimulationState)`. SimulationState
// isn't formalized yet — S10 owns it. Until then, we take a focused input
// shape that the runtime constructs from its full state. When S10 lands and
// SimulationState is named, this becomes a one-line type alias.
// ============================================================================

export interface CadenceInput {
  /** Wall-time since the last cryptic was triggered, in ms. */
  readonly dryWalkMs: number;
  /** Wall-time since any encounter resolved (battle / fade / settle), in ms. */
  readonly timeSinceLastResolveMs: number;
  /** Currently-active manifestations (state ∉ {latent, settled}). */
  readonly activeManifestationCount: number;
}

export interface CadenceStats {
  /** 0..1 — strength of the "we should wake something" pressure. */
  readonly dryWalkPressure: number;
  /** True when at or above MAX_ACTIVE_MANIFESTATIONS — suppress new wakes. */
  readonly atActiveCap: boolean;
  /**
   * What the runtime should do this frame:
   *   idle          — no special pressure; wake on natural triggers only
   *   consider-wake — over warning threshold; favor wakes
   *   force-wake    — over force threshold; bias the next plausible slot awake
   *   suppress      — too many active; skip wake checks entirely
   */
  readonly suggestion: 'idle' | 'consider-wake' | 'force-wake' | 'suppress';
}

export function encounterCadenceStats(input: CadenceInput): CadenceStats {
  if (input.activeManifestationCount >= MAX_ACTIVE_MANIFESTATIONS) {
    return { dryWalkPressure: 0, atActiveCap: true, suggestion: 'suppress' };
  }

  const dryWalkPressure = clamp(input.dryWalkMs / DRY_WALK_FORCE_MS, 0, 1);

  if (input.dryWalkMs >= DRY_WALK_FORCE_MS) {
    return { dryWalkPressure: 1, atActiveCap: false, suggestion: 'force-wake' };
  }
  if (input.dryWalkMs >= DRY_WALK_WARNING_MS) {
    return { dryWalkPressure, atActiveCap: false, suggestion: 'consider-wake' };
  }
  return { dryWalkPressure, atActiveCap: false, suggestion: 'idle' };
}
