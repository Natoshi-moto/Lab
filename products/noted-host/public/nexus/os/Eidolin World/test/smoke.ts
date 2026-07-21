import { runDeterminismTests } from '../src/core/deterministic.js';
import { createStarterCompanion } from '../src/dna-name.js';
import { manifestationSlotAt, wildForSlot } from '../src/manifestation.js';
import { buildBirthContext, deriveOffspring } from '../src/spatial-bonding.js';
import { createNewSave, addCreatureToSave, appendAction, verifyDerivationProof } from '../src/persistence.js';
import type { PlayerSeed } from '../src/types.js';

const realmSeed = 'Glassfen-91';
const playerSeed = 'Neo' as PlayerSeed;

const determinism = runDeterminismTests();
const failed = determinism.filter(t => !t.passed);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  throw new Error(`${failed.length} deterministic checks failed.`);
}

const starter = createStarterCompanion(playerSeed);
const slot = manifestationSlotAt(realmSeed, playerSeed, 'surface', 6);
const wild = wildForSlot(slot, realmSeed);
const context = buildBirthContext({
  realmSeed,
  playerSeed,
  layer: 'surface',
  birthX: 4827.12,
  vesselId: 'null_bloom',
  bondNonce: 1,
});
const offspring = deriveOffspring(starter, wild, context);

let save = createNewSave(realmSeed, playerSeed);
save = addCreatureToSave(save, wild);
save = addCreatureToSave(save, offspring);
save = appendAction(save, {
  type: 'OFFSPRING_BORN',
  at: { displayOnly: 0 },
  creatureId: offspring.id,
});

if (!verifyDerivationProof(save.derivationProof, save.realmSeed, save.playerSeed)) {
  throw new Error('Derivation proof did not verify.');
}

console.log(JSON.stringify({
  deterministicChecks: determinism.length,
  starter: { id: starter.id, name: starter.trueName },
  slot: { slotId: slot.slotId, anchorX: slot.anchorX, temperament: slot.temperament },
  wild: { id: wild.id, name: wild.trueName },
  offspring: {
    id: offspring.id,
    name: offspring.trueName,
    generation: offspring.dna.generation,
    birthX: offspring.birthContext?.birthX,
    spatialMarks: offspring.spatialMarks.map(m => m.detail),
  },
  save: {
    creatureCount: Object.keys(save.creatures).length,
    lineageCount: save.lineage.length,
    proofHash: save.derivationProof.hash,
  },
}, null, 2));
