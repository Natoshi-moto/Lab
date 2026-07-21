// src/battle.ts
// ============================================================================
// S4 — Battle System
//
// Three player actions, three wild patterns, one stillness accumulator.
// Battle plays on the same terrain — no arena cut, no scene transition.
// The world stays live underneath; BreathState narrows the player's
// perception while simulation runs.
//
// FOUR DIRECTIVES:
//
//   1. fieldReadAdvantage manifests as INFORMATION, not a hidden modifier.
//      Above the reveal threshold, the player sees the wild's next pattern
//      before choosing — the shimmer is strategically relevant, the
//      memorize-the-temperament player wins most, the read-the-pattern
//      player wins consistently. The threshold is tunable; the mechanism
//      (revealed vs hidden) is fixed.
//
//   2. BreathState is purely PERCEPTUAL. It desaturates and slows the
//      visual layer ONLY. It does not pause simulation, freeze
//      accumulators, or alter state machines. The comment on
//      applyBreathState below is the canonical reminder.
//
//   3. Victory strings are part of the covenant: "It stills.",
//      "The Vessel may open." Hard-coded as named constants. Wrong tone
//      at this moment breaks the emotional contract the entire game
//      rests on. Not config, not template, not interpolated.
//
//   4. The wild pattern distribution lives next to the payoff matrix.
//      Both exported, both visible, both tunable as a pair. The matrix
//      tells you what wins; the distribution tells you what's likely.
//      Together they describe the entire skill curve.
// ============================================================================

import type {
  BattleAction,
  BattleState,
  BreathState,
  CreatureId,
  Temperament,
  WildPattern,
} from './types.js';

import { rand01, clamp } from './core/deterministic.js';


// ============================================================================
// Tunable constants
// ============================================================================

/** Stillness threshold to win the battle ("It stills."). */
export const STILLNESS_VICTORY_THRESHOLD = 1.0;

/** Stillness threshold below which the wild gives up and withdraws. */
export const STILLNESS_FLEE_THRESHOLD = -0.6;

/** Hard turn cap — failsafe against indefinite battles. Wild withdraws if reached. */
export const MAX_BATTLE_TURNS = 10;

/** Above this fieldReadAdvantage, the next wild pattern is revealed each turn. */
export const REVEAL_THRESHOLD = 0.5;

/** Watch-time (seconds) at which fieldReadAdvantage saturates to 1.0. */
export const OBSERVATION_FOR_FULL_ADVANTAGE_S = 4.0;


// ============================================================================
// The covenant strings (directive #3)
//
// These appear at the most charged moments in the game. The tone is the
// game. "Captured!" or "Defeated!" would be a different game with the
// same mechanics — and a worse one. Hard-coded, named, never templated.
// ============================================================================

/** Shown when stillness reaches the victory threshold. */
export const VICTORY_PHRASE = 'It stills.';

/** Shown when the bondable phase begins, after stillness, before Vessel use. */
export const VESSEL_OPEN_PHRASE = 'The Vessel may open.';

/** Shown when the wild flees (stillness floor reached, or turn cap). */
export const WILD_WITHDRAWS_PHRASE = 'It withdraws into the place.';


// ============================================================================
// The matrix and the distribution (directive #4)
//
// STILLNESS_PAYOFF[playerAction][wildPattern] = stillness delta this turn.
// WILD_DISTRIBUTION[temperament][wildPattern] = probability the wild plays
// that pattern this turn.
//
// The two tables together describe the entire skill curve:
//   - Memorize-the-temperament player picks the best response to the most
//     common pattern → wins ~70-80% of encounters.
//   - Read-the-shimmer player gets the next pattern revealed (when
//     advantage is high enough) and picks the perfect response → wins
//     ~95% of encounters.
//
// Both are correct play; the second is the skill ceiling.
//
// MUST be tuned together. If one shifts, the other should be re-checked
// — they describe the same game from two angles.
// ============================================================================

/**
 * Stillness delta per (player action, wild pattern) cell. Each row sums
 * to a different total; the *shape* is what matters — each player action
 * is strong against exactly one pattern, weak against another.
 */
export const STILLNESS_PAYOFF: Readonly<Record<BattleAction, Readonly<Record<WildPattern, number>>>> = {
  //         TEST          BURST         WITHDRAW
  HOLD:   { TEST: +0.10,  BURST: +0.30, WITHDRAW: -0.05 },
  PRESS:  { TEST: +0.30,  BURST: -0.10, WITHDRAW: +0.10 },
  YIELD:  { TEST: -0.05,  BURST: -0.05, WITHDRAW: +0.30 },
};

/**
 * Wild pattern distribution per temperament. Each row sums to 1.0
 * (sanity-checked at module load). The dominant pattern in each row is
 * what gives the temperament its in-fiction signature:
 *   AMBUSH bursts. INVESTIGATOR tests. SKITTISH withdraws. TERRITORIAL
 *   alternates between testing and bursting.
 */
export const WILD_DISTRIBUTION: Readonly<Record<Temperament, Readonly<Record<WildPattern, number>>>> = {
  //              TEST          BURST         WITHDRAW
  AMBUSH:       { TEST: 0.15,  BURST: 0.70,  WITHDRAW: 0.15 },
  INVESTIGATOR: { TEST: 0.65,  BURST: 0.20,  WITHDRAW: 0.15 },
  SKITTISH:     { TEST: 0.15,  BURST: 0.10,  WITHDRAW: 0.75 },
  TERRITORIAL:  { TEST: 0.40,  BURST: 0.45,  WITHDRAW: 0.15 },
};

// Sanity check: each row of WILD_DISTRIBUTION must sum to 1.0. Better to
// fail at import than to silently produce a nondeterministic pick.
for (const temp of Object.keys(WILD_DISTRIBUTION) as Temperament[]) {
  const row = WILD_DISTRIBUTION[temp];
  const sum = row.TEST + row.BURST + row.WITHDRAW;
  if (Math.abs(sum - 1) > 1e-9) {
    throw new Error(`WILD_DISTRIBUTION[${temp}] must sum to 1.0; got ${sum}`);
  }
}


// ============================================================================
// Renderer state (consumed by S6/S7 via S10)
//
// Kept here because S4 owns BreathState application. If renderer state
// grows complex, it migrates to types.ts; for now this is the minimal
// shape that captures what BreathState modulates.
// ============================================================================

export interface RendererState {
  /** 0..1 — color desaturation; 1 = grayscale. */
  readonly desaturation: number;
  /** 0..1 — visual time scale; 1 = normal, 0 = frozen visuals (NOT sim). */
  readonly speedMultiplier: number;
  /** 0..1 — peripheral attenuation toward the focal point. */
  readonly attentionNarrowing: number;
}

/** A neutral renderer state — full color, full speed, no narrowing. */
export const NEUTRAL_RENDERER_STATE: RendererState = {
  desaturation: 0,
  speedMultiplier: 1,
  attentionNarrowing: 0,
};


// ============================================================================
// Battle context and initialization
// ============================================================================

export interface BattleContext {
  readonly playerCreatureId: CreatureId;
  readonly wildCreatureId: CreatureId;
  readonly wildTemperament: Temperament;
  /** Composite seed for this battle's pattern sequence. Caller constructs. */
  readonly battleSeed: string;
  /** S2's watchTime at the moment battle was triggered. Drives field-read advantage. */
  readonly watchTimeAtTrigger: number;
}

const WILD_PATTERNS_ORDERED: readonly WildPattern[] = ['TEST', 'BURST', 'WITHDRAW'];

/**
 * Deterministic weighted pick of a wild pattern. Same (battleSeed, turn,
 * temperament) always returns the same pattern — battles are replayable.
 */
function pickWildPattern(
  battleSeed: string,
  turn: number,
  temperament: Temperament,
): WildPattern {
  const r = rand01(`${battleSeed}:turn:${turn}`);
  const dist = WILD_DISTRIBUTION[temperament];
  let cumulative = 0;
  for (const pattern of WILD_PATTERNS_ORDERED) {
    cumulative += dist[pattern];
    if (r < cumulative) return pattern;
  }
  // Float-epsilon safety: if r somehow lands beyond the cumulative sum
  // due to rounding, return the last pattern. Should never trigger
  // because rand01 < 1 and the row sums to 1.0 (checked at module load).
  return WILD_PATTERNS_ORDERED[WILD_PATTERNS_ORDERED.length - 1];
}

/**
 * Decide whether the next pattern is revealed this turn based on
 * fieldReadAdvantage. Pulled out into a helper so the rule (single
 * threshold) lives in exactly one place.
 */
function revealedPatternFor(
  battleSeed: string,
  turn: number,
  temperament: Temperament,
  fieldReadAdvantage: number,
): WildPattern | null {
  if (fieldReadAdvantage < REVEAL_THRESHOLD) return null;
  return pickWildPattern(battleSeed, turn, temperament);
}

export function initBattle(context: BattleContext): BattleState {
  const fieldReadAdvantage = clamp(
    context.watchTimeAtTrigger / OBSERVATION_FOR_FULL_ADVANTAGE_S,
    0, 1,
  );

  const turn = 0;
  const revealedNextPattern = revealedPatternFor(
    context.battleSeed,
    turn,
    context.wildTemperament,
    fieldReadAdvantage,
  );

  return {
    phase: 'opening',
    playerCreatureId: context.playerCreatureId,
    wildCreatureId: context.wildCreatureId,
    wildTemperament: context.wildTemperament,
    turn,
    stillness: 0,
    fieldReadAdvantage,
    revealedNextPattern,
    battleSeed: context.battleSeed,
    lastWildPattern: null,
    lastPlayerAction: null,
    outcome: 'unresolved',
  };
}


// ============================================================================
// Action processing
//
// processBattleAction is pure: given previous state and the player's
// chosen action, returns the next state. The wild's pattern for this
// turn is computed deterministically from (battleSeed, turn, temperament)
// — the same battle replays identically.
// ============================================================================

export function processBattleAction(
  state: BattleState,
  action: BattleAction,
): BattleState {
  if (state.phase === 'resolved') return state;

  // Wild's pattern for this turn (deterministic).
  const wildPattern = pickWildPattern(
    state.battleSeed,
    state.turn,
    state.wildTemperament,
  );

  // Stillness delta from the matrix.
  const delta = STILLNESS_PAYOFF[action][wildPattern];
  const newStillness = state.stillness + delta;

  // Resolution check.
  let outcome: BattleState['outcome'] = 'unresolved';
  let phase: BattleState['phase'] = 'choosing';

  if (newStillness >= STILLNESS_VICTORY_THRESHOLD) {
    outcome = 'still';
    phase = 'resolved';
  } else if (newStillness <= STILLNESS_FLEE_THRESHOLD) {
    outcome = 'flee';
    phase = 'resolved';
  } else if (state.turn + 1 >= MAX_BATTLE_TURNS) {
    // Turn cap reached without victory. Wild withdraws.
    outcome = 'flee';
    phase = 'resolved';
  }

  // Compute next turn's revealed pattern (only if battle continues).
  const nextTurn = state.turn + 1;
  const revealedNextPattern = phase === 'resolved'
    ? null
    : revealedPatternFor(
        state.battleSeed,
        nextTurn,
        state.wildTemperament,
        state.fieldReadAdvantage,
      );

  return {
    ...state,
    phase,
    turn: phase === 'resolved' ? state.turn : nextTurn,
    stillness: newStillness,
    revealedNextPattern,
    lastWildPattern: wildPattern,
    lastPlayerAction: action,
    outcome,
  };
}


// ============================================================================
// applyBreathState  (directive #2)
//
// BreathState is purely PERCEPTUAL.
//
//   It desaturates color. It slows visual time. It narrows attention.
//
//   It does NOT pause simulation ticks.
//   It does NOT freeze watchTime or trackTime accumulators.
//   It does NOT affect the manifestation state machine in S2.
//   It does NOT alter battle resolution or stillness accumulation.
//
// Simulation runs underneath. BreathState is something S10 hands to the
// renderers (S6 creature, S7 world) so they can dim color, slow visual
// tweens, narrow the focal field. Nothing else reads it.
//
// If you find yourself reaching for BreathState anywhere outside a
// renderer's draw path: stop. The thing you actually want is a
// simulation-side flag — add one, don't reuse this.
// ============================================================================

export function applyBreathState(
  config: BreathState,
  rendererState: RendererState,
): RendererState {
  // The function COMBINES base renderer state with the breath modulation.
  // Maxes for cumulative effects (desaturation, narrowing); min on speed
  // because slower stacks (a slower base * a slower breath = even slower).
  return {
    desaturation: Math.max(rendererState.desaturation, config.desaturation),
    speedMultiplier: Math.min(rendererState.speedMultiplier, 1 - config.slowdown),
    attentionNarrowing: Math.max(rendererState.attentionNarrowing, config.intensity),
  };
}


// ============================================================================
// Resolution check
// ============================================================================

export function isBattleResolved(state: BattleState): boolean {
  return state.phase === 'resolved';
}

/**
 * The covenant phrase to display at battle resolution. Pulled out into a
 * function so the matching logic lives in one place — adding a new
 * outcome means updating exactly here, not searching for string sites.
 */
export function resolutionPhrase(state: BattleState): string {
  switch (state.outcome) {
    case 'still': return VICTORY_PHRASE;
    case 'flee':  return WILD_WITHDRAWS_PHRASE;
    case 'lost':  return WILD_WITHDRAWS_PHRASE; // V1: 'lost' folds into withdraw.
    case 'unresolved': return '';
    default: return '';
  }
}
