import type { BattleAction, PlayerSeed, WildPattern } from '../src/types.js';
import { manifestationSlotAt, wildForSlot } from '../src/manifestation.js';
import { initBattle, isBattleResolved, processBattleAction } from '../src/battle.js';
import { buildBirthContext, deriveOffspring } from '../src/spatial-bonding.js';
import {
  addCreatureToSave,
  appendAction,
  commitSave,
  createNewSave,
  loadSave,
  verifyDerivationProof,
} from '../src/persistence.js';

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();
  get length(): number { return this.map.size; }
  clear(): void { this.map.clear(); }
  getItem(key: string): string | null { return this.map.get(key) ?? null; }
  key(index: number): string | null { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string): void { this.map.delete(key); }
  setItem(key: string, value: string): void { this.map.set(key, value); }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
});

const RESPONSE_TO_PATTERN: Readonly<Record<WildPattern, BattleAction>> = {
  TEST: 'PRESS',
  BURST: 'HOLD',
  WITHDRAW: 'YIELD',
};

const realmSeed = 'Glassfen-91';
const playerSeed = 'Neo' as PlayerSeed;
let save = createNewSave(realmSeed, playerSeed);
commitSave(save);

const parent = Object.values(save.creatures)[0];
const slot = manifestationSlotAt(realmSeed, playerSeed, 'surface', 6);
const wild = wildForSlot(slot, realmSeed);
let battle = initBattle({
  playerCreatureId: parent.id,
  wildCreatureId: wild.id,
  wildTemperament: slot.temperament,
  watchTimeAtTrigger: 5,
  battleSeed: `battle:v1:${slot.slotId}:${parent.id}:${wild.id}`,
});

const turns: Array<{ action: BattleAction; pattern: WildPattern | null; stillness: number }> = [];
while (!isBattleResolved(battle)) {
  const action = battle.revealedNextPattern
    ? RESPONSE_TO_PATTERN[battle.revealedNextPattern]
    : 'HOLD';
  battle = processBattleAction(battle, action);
  turns.push({ action, pattern: battle.lastWildPattern, stillness: battle.stillness });
  if (turns.length > 10) throw new Error('Battle exceeded hard turn cap.');
}

if (battle.outcome !== 'still') {
  throw new Error(`Expected still battle, got ${battle.outcome}.`);
}

save = appendAction(save, {
  type: 'BATTLE_RESOLVED',
  at: { displayOnly: 0 },
  creatureId: wild.id,
  outcome: battle.outcome,
});

const bondNonce = save.bondNonce + 1;
const birthX = 4827.12;
const context = buildBirthContext({
  realmSeed,
  playerSeed,
  layer: 'surface',
  birthX,
  vesselId: 'null_bloom',
  bondNonce,
});
const offspring = deriveOffspring(parent, wild, context);
save = appendAction({
  ...save,
  bondNonce,
  inventory: {
    ...save.inventory,
    vessels: { ...save.inventory.vessels, null_bloom: save.inventory.vessels.null_bloom - 1 },
  },
}, {
  type: 'VESSEL_USED',
  at: { displayOnly: 0 },
  vesselId: 'null_bloom',
  bondNonce,
  birthX,
});
save = addCreatureToSave(save, wild);
save = addCreatureToSave(save, offspring);
save = appendAction(save, {
  type: 'OFFSPRING_BORN',
  at: { displayOnly: 0 },
  creatureId: offspring.id,
});
commitSave(save);

const loaded = loadSave();
if (!loaded) throw new Error('Save did not reload.');
if (!loaded.creatures[wild.id]) throw new Error('Wild lineage parent missing from save.');
if (!loaded.creatures[offspring.id]) throw new Error('Offspring missing from save.');
if (!loaded.lineage.some(edge => edge.child === offspring.id && edge.wildParent === wild.id)) {
  throw new Error('Lineage edge missing or malformed.');
}
if (!verifyDerivationProof(loaded.derivationProof, loaded.realmSeed, loaded.playerSeed)) {
  throw new Error('Reloaded derivation proof failed.');
}

console.log(JSON.stringify({
  battle: {
    outcome: battle.outcome,
    turns,
  },
  birth: {
    parent: parent.trueName,
    wild: wild.trueName,
    offspring: offspring.trueName,
    birthX: offspring.birthContext?.birthX,
    bondNonce: offspring.birthContext?.bondNonce,
  },
  save: {
    creatures: Object.keys(loaded.creatures).length,
    lineage: loaded.lineage.length,
    actions: loaded.actions.map(action => action.type),
    proofHash: loaded.derivationProof.hash,
  },
}, null, 2));
