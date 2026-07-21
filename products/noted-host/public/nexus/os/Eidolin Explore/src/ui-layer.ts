import type {
  CreatureId,
  CreatureNode,
  InheritedTrait,
  SaveFileV1,
  SpatialMark,
} from './types.js';
import { deriveGait } from './dna-name.js';
import type { VesselCeremonyState } from './vessel-ceremony.js';
import { drawCreature } from './creature-renderer.js';
import { exportLineageJSON } from './persistence.js';

const CERT_WIDTH = 1080;
const CERT_HEIGHT = 1920;

function traitLine(t: InheritedTrait): string {
  const source = t.source === 'parentA' ? 'Parent A' : t.source === 'wildParent' ? 'Wild parent' : 'Place';
  return `${source}: ${t.explanation}`;
}

function firstSpatialMark(creature: CreatureNode): SpatialMark | null {
  return creature.spatialMarks[0] ?? null;
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = value.split(/\s+/g);
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function birthplace(creature: CreatureNode): string {
  const c = creature.birthContext;
  if (!c) return 'First companion. No recorded birthplace.';
  return `${c.realmSeed}, X=${Math.round(c.birthX)}, ${c.layer}`;
}

function parents(creature: CreatureNode, save: SaveFileV1): string {
  const parentA = creature.dna.parentAId ? save.creatures[creature.dna.parentAId]?.trueName ?? creature.dna.parentAId : '—';
  const wild = creature.dna.parentBId ? save.creatures[creature.dna.parentBId]?.trueName ?? creature.dna.parentBId : '—';
  return `${parentA} × ${wild}`;
}

function proofHash(save: SaveFileV1): string {
  return save.derivationProof.hash;
}

export function formatPilgrimageCoordinate(creature: CreatureNode): string {
  const c = creature.birthContext;
  if (!c) return 'Begin again at the first waking place.';
  const x = Math.round(c.birthX);
  const hint = c.nearestLandmark
    ? `near the ${c.nearestLandmark.type.toLowerCase().replace(/_/g, ' ')}`
    : c.biome.dominant === 'glassfen'
      ? 'watch the fog before the ridge'
      : c.biome.dominant === 'mosswake'
        ? 'listen under the mossline'
        : 'wait where the ash light thins';
  return `Go to ${c.realmSeed}, X=${x}. ${hint.charAt(0).toUpperCase()}${hint.slice(1)}.`;
}

export function copyBirthCertificateText(creature: CreatureNode, save: SaveFileV1): string {
  const mark = firstSpatialMark(creature);
  const traits = creature.inheritedTraits.slice(0, 3).map(traitLine).join('\n');
  return [
    `NEXUS LATTICE — Birth Record`,
    `Creature: ${creature.trueName}`,
    `ID: ${creature.id}`,
    `Generation: ${creature.dna.generation}`,
    `Birthplace: ${birthplace(creature)}`,
    `Pilgrimage: ${formatPilgrimageCoordinate(creature)}`,
    `Parents: ${parents(creature, save)}`,
    `Vessel: ${creature.birthContext?.vesselId ?? '—'}`,
    mark ? `Spatial mark: ${mark.detail}` : `Spatial mark: —`,
    traits ? `Traits:\n${traits}` : `Traits: —`,
    `Proof hash: ${proofHash(save)}`,
  ].join('\n');
}

export function renderBirthCertificate(creature: CreatureNode, save: SaveFileV1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CERT_WIDTH;
  canvas.height = CERT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.fillStyle = '#101416';
  ctx.fillRect(0, 0, CERT_WIDTH, CERT_HEIGHT);
  ctx.fillStyle = '#e8f6ee';
  ctx.font = '700 56px Georgia, serif';
  ctx.fillText('Nexus Lattice', 80, 120);
  ctx.font = '28px Georgia, serif';
  ctx.fillText('Naturalist Birth Record', 82, 164);

  ctx.save();
  ctx.translate(CERT_WIDTH / 2, 430);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.arc(0, 0, 260, 0, Math.PI * 2);
  ctx.fill();
  const gait = deriveGait(creature.dna);
  void gait;
  drawCreature(ctx, creature, 0, 40, 0, { worldX: creature.birthContext?.birthX ?? 0, slope: creature.birthContext?.slope ?? 0, emergence: 1 });
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 64px Georgia, serif';
  let y = text(ctx, creature.trueName, 80, 780, 920, 72);
  ctx.font = '26px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = '#b8c9c0';
  y = text(ctx, `${creature.id}`, 80, y + 12, 920, 34);

  ctx.font = '32px Georgia, serif';
  ctx.fillStyle = '#e8f6ee';
  y = text(ctx, `Born / ${birthplace(creature)}`, 80, y + 58, 920, 44);
  y = text(ctx, `Witnessed / ${formatPilgrimageCoordinate(creature)}`, 80, y + 24, 920, 44);
  y = text(ctx, `Lineage / ${parents(creature, save)}`, 80, y + 24, 920, 44);
  y = text(ctx, `Vessel / ${creature.birthContext?.vesselId ?? '—'}`, 80, y + 24, 920, 44);

  const mark = firstSpatialMark(creature);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px Georgia, serif';
  ctx.fillText('Three visible inheritances', 80, y + 70);
  y += 118;
  ctx.fillStyle = '#dfeee7';
  ctx.font = '30px Georgia, serif';
  for (const line of creature.inheritedTraits.slice(0, 3).map(traitLine)) {
    y = text(ctx, line, 100, y, 860, 40);
  }
  if (mark) y = text(ctx, `Place: ${mark.detail}`, 100, y + 8, 860, 40);

  ctx.fillStyle = '#9fb3aa';
  ctx.font = '24px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`proof ${proofHash(save)} · schema v${save.schemaVersion} · ${save.algoVersion}`, 80, CERT_HEIGHT - 88);
  return canvas;
}

export function exportBirthCertificateImage(creature: CreatureNode, save: SaveFileV1): void {
  const canvas = renderBirthCertificate(creature, save);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${String(creature.id).replace(/[^a-z0-9_-]/gi, '_')}-birth-record.png`;
  a.click();
}

export function exportVesselClipMetadata(state: VesselCeremonyState): string {
  return JSON.stringify({
    kind: 'nexus-lattice-vessel-clip',
    creatureId: state.offspring.id,
    trueName: state.offspring.trueName,
    vesselId: state.context.vesselId,
    realmSeed: state.context.realmSeed,
    birthX: state.context.birthX,
    phase: state.phase,
    elapsed: Number(state.elapsed.toFixed(3)),
    spatialMarks: state.offspring.spatialMarks,
  }, null, 2);
}

export function renderLineageJournal(
  ctx: CanvasRenderingContext2D,
  save: SaveFileV1,
  selected: CreatureId,
): void {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  const creature = save.creatures[selected] ?? Object.values(save.creatures)[0];
  if (!creature) return;

  ctx.save();
  ctx.fillStyle = 'rgba(8, 12, 14, 0.72)';
  ctx.fillRect(Math.max(0, w - 380), 0, 380, h);
  ctx.translate(Math.max(0, w - 350), 34);

  ctx.fillStyle = '#f4fff8';
  ctx.font = '700 22px Georgia, serif';
  ctx.fillText('Field Journal', 0, 0);
  ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = '#9fb3aa';
  ctx.fillText(`proof ${save.derivationProof.hash}`, 0, 24);

  ctx.save();
  ctx.translate(170, 126);
  drawCreature(ctx, creature, 0, 0, 0, { worldX: creature.birthContext?.birthX ?? 0, slope: creature.birthContext?.slope ?? 0, emergence: 1 });
  ctx.restore();

  let y = 250;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px Georgia, serif';
  y = text(ctx, creature.trueName, 0, y, 320, 34);
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = '#dbe8e2';
  y = text(ctx, `Born: ${birthplace(creature)}`, 0, y + 14, 320, 22);
  y = text(ctx, `Generation: ${creature.dna.generation}`, 0, y + 6, 320, 22);
  y = text(ctx, `Vessel: ${creature.birthContext?.vesselId ?? '—'}`, 0, y + 6, 320, 22);
  y = text(ctx, `Coordinate: ${formatPilgrimageCoordinate(creature)}`, 0, y + 6, 320, 22);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px Georgia, serif';
  ctx.fillText('Lineage', 0, y + 24);
  y += 54;
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = '#dbe8e2';
  y = text(ctx, parents(creature, save), 0, y, 320, 20);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px Georgia, serif';
  ctx.fillText('Inherited traits', 0, y + 26);
  y += 56;
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = '#dbe8e2';
  for (const tr of creature.inheritedTraits.slice(0, 3)) {
    y = text(ctx, traitLine(tr), 0, y, 320, 20);
  }

  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = '#789087';
  ctx.fillText(`lineage bytes ${exportLineageJSON(save, creature.id).length}`, 0, h - 70);
  ctx.restore();
}
