import type { PlayerSeed } from '../src/types.js';
import { manifestationSlotAt, wildForSlot } from '../src/manifestation.js';
import { buildBirthContext, deriveOffspring } from '../src/spatial-bonding.js';
import { copyBirthCertificateText, formatPilgrimageCoordinate } from '../src/ui-layer.js';
import { addCreatureToSave, createNewSave, exportLineageJSON } from '../src/persistence.js';

const realmSeed = 'Glassfen-91';
const playerSeed = 'Neo' as PlayerSeed;
let save = createNewSave(realmSeed, playerSeed);
const parent = Object.values(save.creatures)[0];
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
const offspring = deriveOffspring(parent, wild, context);
save = addCreatureToSave(addCreatureToSave(save, wild), offspring);

const certificateText = copyBirthCertificateText(offspring, save);
const pilgrimage = formatPilgrimageCoordinate(offspring);
const lineage = JSON.parse(exportLineageJSON(save, offspring.id)) as {
  creatureId: string;
  nodes: Array<{ id: string; trueName: string }>;
  edges: Array<{ child: string; parentA: string; wildParent: string; bondNonce: number }>;
  proof: { hash: string };
};

const requiredText = [
  'NEXUS LATTICE — Birth Record',
  offspring.trueName,
  'Generation: 1',
  'Birthplace: Glassfen-91, X=4827, surface',
  'Pilgrimage:',
  'Parents:',
  'Vessel: null_bloom',
  'Spatial mark:',
  'Traits:',
  `Proof hash: ${save.derivationProof.hash}`,
];
for (const token of requiredText) {
  if (!certificateText.includes(token)) throw new Error(`Certificate text missing: ${token}`);
}
if (!pilgrimage.includes('Go to Glassfen-91, X=4827.')) throw new Error('Pilgrimage coordinate malformed.');
if (lineage.creatureId !== offspring.id) throw new Error('Lineage export creatureId mismatch.');
if (lineage.nodes.length !== 3) throw new Error(`Expected 3 lineage nodes, got ${lineage.nodes.length}.`);
if (!lineage.edges.some(edge => edge.child === offspring.id && edge.parentA === parent.id && edge.wildParent === wild.id && edge.bondNonce === 1)) {
  throw new Error('Lineage export missing parent edge.');
}
if (lineage.proof.hash !== save.derivationProof.hash) throw new Error('Lineage proof hash mismatch.');

console.log(JSON.stringify({
  certificateLines: certificateText.split('\n').length,
  pilgrimage,
  lineageNodes: lineage.nodes.length,
  lineageEdges: lineage.edges.length,
  proofHash: lineage.proof.hash,
}, null, 2));
