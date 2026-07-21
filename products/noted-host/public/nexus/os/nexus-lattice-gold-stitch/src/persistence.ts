import type {
  ActionRecord,
  CreatureId,
  CreatureNode,
  DerivationProof,
  DerivationSample,
  DisplayOnly,
  LineageEdge,
  PlayerSeed,
  SaveFileV1,
  VesselId,
} from './types.js';
import {
  ALGO_VERSION,
  biomeBlendAt,
  hashString,
  terrainHeightAt,
} from './core/deterministic.js';
import { createStarterCompanion } from './dna-name.js';

const SAVE_KEY = 'nexus-lattice:v1:save';
const SAVE_PENDING_KEY = 'nexus-lattice:v1:save:pending';
const SAVE_BACKUP_KEY = 'nexus-lattice:v1:save:backup';
const PROOF_SAMPLE_XS = [-4096, -1024, 0, 4827.12, 8192, 16384] as const;

function displayNow(): DisplayOnly {
  return { displayOnly: Date.now() };
}

function storageAvailable(): Storage | null {
  try {
    if (typeof globalThis.localStorage === 'undefined') return null;
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'number') {
    if (!Number.isFinite(value as number)) return String(value);
    return Number(value).toFixed(6);
  }
  if (t === 'string') return JSON.stringify(value);
  if (t === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (t === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
}

function proofHashPayload(proof: Omit<DerivationProof, 'hash'>): string {
  return stableStringify({
    algoVersion: proof.algoVersion,
    realmSeed: proof.realmSeed,
    playerSeed: proof.playerSeed,
    samples: proof.samples,
  });
}

export function buildDerivationProof(realmSeed: string, playerSeed: string): DerivationProof {
  const samples: DerivationSample[] = PROOF_SAMPLE_XS.map(x => {
    const biome = biomeBlendAt(realmSeed, x);
    return {
      x,
      terrainHeight: Number(terrainHeightAt(realmSeed, 'surface', x).toFixed(6)),
      biomeDominant: biome.dominant,
    };
  });

  const payload = {
    algoVersion: ALGO_VERSION,
    realmSeed,
    playerSeed: playerSeed as PlayerSeed,
    samples,
  } satisfies Omit<DerivationProof, 'hash'>;

  return {
    ...payload,
    hash: hashString(`proof:v1:${proofHashPayload(payload)}`).toString(16).padStart(8, '0'),
  };
}

export function verifyDerivationProof(
  proof: DerivationProof,
  realmSeed: string,
  playerSeed: string,
): boolean {
  if (proof.algoVersion !== ALGO_VERSION) return false;
  if (proof.realmSeed !== realmSeed) return false;
  if (proof.playerSeed !== playerSeed) return false;
  const expected = buildDerivationProof(realmSeed, playerSeed);
  return stableStringify(proof.samples) === stableStringify(expected.samples)
    && proof.hash === expected.hash;
}

function initialInventory(): SaveFileV1['inventory'] {
  const vessels: Record<VesselId, number> = {
    null_bloom: 3,
    ash_bell: 0,
    tide_chime: 0,
    glass_egg: 0,
  };
  return { vessels, nex: 0 };
}

export function createNewSave(realmSeed: string, playerSeed: string): SaveFileV1 {
  const starter = createStarterCompanion(playerSeed);
  const now = displayNow();
  return {
    schemaVersion: 1,
    algoVersion: ALGO_VERSION,
    realmSeed,
    playerSeed: playerSeed as PlayerSeed,
    bondNonce: 0,
    creatures: { [starter.id]: starter } as Readonly<Record<CreatureId, CreatureNode>>,
    lineage: [],
    actions: [],
    inventory: initialInventory(),
    derivationProof: buildDerivationProof(realmSeed, playerSeed),
    meta: {
      createdAt: now,
      lastSavedAt: now,
    },
  };
}

function assertSaveLike(value: unknown): SaveFileV1 | null {
  if (!value || typeof value !== 'object') return null;
  const save = value as Partial<SaveFileV1>;
  if (save.schemaVersion !== 1) return null;
  if (typeof save.realmSeed !== 'string') return null;
  if (typeof save.playerSeed !== 'string') return null;
  if (!save.derivationProof) return null;
  if (!verifyDerivationProof(save.derivationProof, save.realmSeed, save.playerSeed)) return null;
  return save as SaveFileV1;
}

export function loadSave(): SaveFileV1 | null {
  const storage = storageAvailable();
  if (!storage) return null;
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return assertSaveLike(JSON.parse(raw));
  } catch {
    return null;
  }
}

function withProofAndSaveTime(save: SaveFileV1): SaveFileV1 {
  return {
    ...save,
    algoVersion: ALGO_VERSION,
    derivationProof: buildDerivationProof(save.realmSeed, save.playerSeed),
    meta: {
      ...save.meta,
      lastSavedAt: displayNow(),
    },
  };
}

export function commitSave(save: SaveFileV1): void {
  const storage = storageAvailable();
  if (!storage) return;

  const normalized = withProofAndSaveTime(save);
  const encoded = JSON.stringify(normalized);
  const previous = storage.getItem(SAVE_KEY);

  storage.setItem(SAVE_PENDING_KEY, encoded);
  const parsed = assertSaveLike(JSON.parse(storage.getItem(SAVE_PENDING_KEY) ?? 'null'));
  if (!parsed) {
    storage.removeItem(SAVE_PENDING_KEY);
    throw new Error('Save verification failed before commit.');
  }

  if (previous !== null) storage.setItem(SAVE_BACKUP_KEY, previous);
  storage.setItem(SAVE_KEY, encoded);
  storage.removeItem(SAVE_PENDING_KEY);
}

export function appendAction(save: SaveFileV1, action: ActionRecord): SaveFileV1 {
  return withProofAndSaveTime({
    ...save,
    actions: [...save.actions, action],
  });
}

export function createLineageNode(offspring: CreatureNode): CreatureNode {
  return {
    ...offspring,
    bornAt: offspring.bornAt ?? displayNow(),
  };
}

function lineageEdgeFor(offspring: CreatureNode): LineageEdge | null {
  const parentA = offspring.dna.parentAId;
  const wildParent = offspring.dna.parentBId;
  const context = offspring.birthContext;
  if (!parentA || !wildParent || !context) return null;
  return {
    child: offspring.id,
    parentA,
    wildParent,
    bondNonce: context.bondNonce,
  };
}

export function addCreatureToSave(save: SaveFileV1, creature: CreatureNode): SaveFileV1 {
  const node = createLineageNode(creature);
  const edge = lineageEdgeFor(node);
  const lineage = edge && !save.lineage.some(e => e.child === edge.child)
    ? [...save.lineage, edge]
    : save.lineage;
  return withProofAndSaveTime({
    ...save,
    creatures: {
      ...save.creatures,
      [node.id]: node,
    } as Readonly<Record<CreatureId, CreatureNode>>,
    lineage,
  });
}

export function exportLineageJSON(save: SaveFileV1, creatureId: CreatureId): string {
  const visited = new Set<string>();
  const nodes: CreatureNode[] = [];
  const edges: LineageEdge[] = [];

  const visit = (id: CreatureId): void => {
    if (visited.has(id)) return;
    visited.add(id);
    const node = save.creatures[id];
    if (!node) return;
    nodes.push(node);
    for (const edge of save.lineage) {
      if (edge.child !== id) continue;
      edges.push(edge);
      visit(edge.parentA);
      visit(edge.wildParent);
    }
  };

  visit(creatureId);
  return JSON.stringify({
    schemaVersion: save.schemaVersion,
    algoVersion: save.algoVersion,
    realmSeed: save.realmSeed,
    creatureId,
    nodes,
    edges,
    proof: save.derivationProof,
  }, null, 2);
}

export const HASH_CALL_SITE_AUDIT = [
  'persistence.ts buildDerivationProof: proof:v1 hash covers algoVersion, realmSeed, playerSeed, and deterministic spot-check samples.',
] as const;
