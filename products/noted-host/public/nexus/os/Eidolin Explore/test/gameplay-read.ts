import type { BattleAction, PlayerSeed, WildPattern } from '../src/types.js';
import { manifestationSlotAt, wildForSlot } from '../src/manifestation.js';
import { createStarterCompanion } from '../src/dna-name.js';
import { initBattle, isBattleResolved, processBattleAction } from '../src/battle.js';

const RESPONSE_TO_PATTERN: Readonly<Record<WildPattern, BattleAction>> = {
  TEST: 'PRESS',
  BURST: 'HOLD',
  WITHDRAW: 'YIELD',
};

const realmSeed = 'Glassfen-91';
const playerSeed = 'Neo' as PlayerSeed;
const parent = createStarterCompanion(playerSeed);
const slot = manifestationSlotAt(realmSeed, playerSeed, 'surface', 6);
const wild = wildForSlot(slot, realmSeed);
const battleSeed = `battle:v1:${slot.slotId}:${parent.id}:${wild.id}`;

const blind = initBattle({
  playerCreatureId: parent.id,
  wildCreatureId: wild.id,
  wildTemperament: slot.temperament,
  watchTimeAtTrigger: 0,
  battleSeed,
});
if (blind.fieldReadAdvantage !== 0) throw new Error('Blind battle should have zero field-read advantage.');
if (blind.revealedNextPattern !== null) throw new Error('Blind battle should not reveal the next pattern.');

const partial = initBattle({
  playerCreatureId: parent.id,
  wildCreatureId: wild.id,
  wildTemperament: slot.temperament,
  watchTimeAtTrigger: 1.8,
  battleSeed,
});
if (partial.fieldReadAdvantage >= 0.5) throw new Error('Partial read fixture should remain below reveal threshold.');
if (partial.revealedNextPattern !== null) throw new Error('Below-threshold read should not reveal a pattern.');

let read = initBattle({
  playerCreatureId: parent.id,
  wildCreatureId: wild.id,
  wildTemperament: slot.temperament,
  watchTimeAtTrigger: 4,
  battleSeed,
});
if (read.fieldReadAdvantage !== 1) throw new Error('Four seconds of observation should saturate field-read advantage.');
if (!read.revealedNextPattern) throw new Error('Full read should reveal the first pattern.');

const turns: Array<{ action: BattleAction; pattern: WildPattern | null; stillness: number }> = [];
while (!isBattleResolved(read)) {
  if (!read.revealedNextPattern) throw new Error('Full-read battle lost its pattern reveal midstream.');
  const action = RESPONSE_TO_PATTERN[read.revealedNextPattern];
  read = processBattleAction(read, action);
  turns.push({ action, pattern: read.lastWildPattern, stillness: read.stillness });
  if (turns.length > 10) throw new Error('Read battle exceeded hard turn cap.');
}
if (read.outcome !== 'still') throw new Error(`Expected field-read play to still the wild, got ${read.outcome}.`);

console.log(JSON.stringify({
  blind: {
    advantage: blind.fieldReadAdvantage,
    revealed: blind.revealedNextPattern,
  },
  partial: {
    advantage: partial.fieldReadAdvantage,
    revealed: partial.revealedNextPattern,
  },
  fullRead: {
    advantage: read.fieldReadAdvantage,
    outcome: read.outcome,
    turns,
  },
}, null, 2));
