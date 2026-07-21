import type {
  ActiveManifestation,
  BattleAction,
  BattleState,
  BreathState,
  CreatureId,
  CreatureNode,
  LayerId,
  PlayerSeed,
  SaveFileV1,
  Temperament,
  WildPattern,
  AssetManifest,
} from './types.js';
import {
  biomeBlendAt,
  clamp,
  rand01,
  smoothstep,
  terrainHeightAt,
  terrainSlopeAt,
} from './core/deterministic.js';
import {
  encounterCadenceStats,
  slotsNearPlayer,
  updateManifestationState,
  wildForSlot,
} from './manifestation.js';
import {
  buildBirthContext,
  deriveOffspring,
} from './spatial-bonding.js';
import {
  initBattle,
  isBattleResolved,
  processBattleAction,
  resolutionPhrase,
  VESSEL_OPEN_PHRASE,
} from './battle.js';
import {
  initVesselCeremony,
  isCeremonyComplete,
  renderVesselPhase,
  tickVesselCeremony,
  type VesselCeremonyState,
} from './vessel-ceremony.js';
import { drawCreature, drawCrypticTell } from './creature-renderer.js';
import {
  drawDebugOverlay,
  drawLandmarks,
  drawParallax,
  drawTerrain,
  FORECAST_OFFSET,
  GROUND_LINE_FRACTION,
  type CanvasDimensions,
} from './world-renderer.js';
import {
  addCreatureToSave,
  appendAction,
  commitSave,
  createNewSave,
  exportLineageJSON,
  loadSave,
} from './persistence.js';
import {
  copyBirthCertificateText,
  exportBirthCertificateImage,
  renderLineageJournal,
} from './ui-layer.js';

interface RuntimeState {
  save: SaveFileV1;
  layer: LayerId;
  playerX: number;
  playerVelocity: number;
  cameraX: number;
  companionX: number;
  debug: boolean;
  autoPilgrim: boolean;
  demoPilot: boolean;
  demoCooldown: number;
  targetX: number | null;
  lastCrypticAt: number;
  lastResolvedAt: number;
  active: ActiveManifestation | null;
  battle: BattleState | null;
  ceremony: VesselCeremonyState | null;
  pendingWildParent: CreatureNode | null;
  breath: BreathState | null;
  selectedCreatureId: CreatureId;
  message: string;
  log: string[];
  assetManifest: AssetManifest | null;
  readConfidence: number;
  readLock: Temperament | null;
}

interface InputState {
  left: boolean;
  right: boolean;
  hold: boolean;
  press: boolean;
  yield: boolean;
  vessel: boolean;
  skip: boolean;
  bestRead: boolean;
  beginBattle: boolean;
  toggleAuto: boolean;
  toggleDemo: boolean;
  selectNext: boolean;
  selectPrev: boolean;
}

const REALM_SEED = 'Glassfen-91';
const PLAYER_SEED = 'Neo' as PlayerSeed;
const MAX_SPEED = 180;
const AUTO_SPEED = 155;
const COMPANION_TRAIL = 72;
const CAMERA_LERP = 0.09;
const COMPANION_LERP = 0.075;
const AUTO_STOP_DISTANCE = 28;
const LOG_LIMIT = 6;
const READ_FULL_SECONDS = 4.0;
const READ_DECODE_THRESHOLD = 0.55;
const READ_LOCK_THRESHOLD = 0.82;

const RESPONSE_TO_PATTERN: Readonly<Record<WildPattern, BattleAction>> = {
  TEST: 'PRESS',
  BURST: 'HOLD',
  WITHDRAW: 'YIELD',
};

const TEMPERAMENT_DEFAULT_ACTION: Readonly<Record<Temperament, BattleAction>> = {
  AMBUSH: 'HOLD',
  INVESTIGATOR: 'PRESS',
  SKITTISH: 'YIELD',
  TERRITORIAL: 'HOLD',
};

function pushLog(state: RuntimeState, line: string): RuntimeState {
  return { ...state, log: [line, ...state.log].slice(0, LOG_LIMIT) };
}

function byId(save: SaveFileV1, id: CreatureId): CreatureNode {
  return save.creatures[id] ?? Object.values(save.creatures)[0];
}

function creatureIds(save: SaveFileV1): CreatureId[] {
  return Object.keys(save.creatures).sort() as CreatureId[];
}

function selectCreature(save: SaveFileV1, current: CreatureId, direction: 1 | -1): CreatureId {
  const ids = creatureIds(save);
  if (!ids.length) return current;
  const index = Math.max(0, ids.indexOf(current));
  return ids[(index + direction + ids.length) % ids.length];
}

function downloadTextFile(filename: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function nowDisplay() {
  return { displayOnly: Date.now() };
}

function ensureCommittedSave(): SaveFileV1 {
  const existing = loadSave();
  if (existing) return existing;
  const fresh = createNewSave(REALM_SEED, PLAYER_SEED);
  commitSave(fresh);
  return fresh;
}

async function loadAssetManifest(): Promise<AssetManifest | null> {
  try {
    const response = await fetch('./asset-manifest.json', { cache: 'no-store' });
    if (!response.ok) return null;
    const manifest = await response.json() as AssetManifest;
    return manifest.version === 1 ? manifest : null;
  } catch {
    return null;
  }
}

function ensureShell(): { canvas: HTMLCanvasElement; hud: HTMLDivElement } {
  document.body.style.margin = '0';
  document.body.style.background = 'radial-gradient(circle at 50% 18%, #18242a 0%, #091014 46%, #030506 100%)';
  document.body.style.overflow = 'hidden';
  document.body.style.fontVariantLigatures = 'common-ligatures';

  let canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'game';
    document.body.appendChild(canvas);
  }

  let hud = document.querySelector<HTMLDivElement>('#hud');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'hud';
    hud.innerHTML = `
      <div class="row">
        <button data-action="new">New save</button>
        <button data-action="auto">Pilgrimage</button>
        <button data-action="demo">Run demo</button>
        <button data-action="debug">Debug</button>
        <button data-action="battle">Begin battle</button>
        <button data-action="best">Best read</button>
        <button data-action="hold">HOLD</button>
        <button data-action="press">PRESS</button>
        <button data-action="yield">YIELD</button>
        <button data-action="vessel">Open Vessel</button>
        <button data-action="copy">Copy certificate</button>
        <button data-action="image">Export certificate</button>
        <button data-action="lineage">Export lineage JSON</button>
        <button data-action="prev">◀ Creature</button>
        <button data-action="next">Creature ▶</button>
      </div>
      <div id="status"></div>
      <div class="hint">←/→ or A/D move · G run demo · P pilgrimage · B battle · R best read · V vessel · [/] select creature · Backquote debug · Space hold-to-skip repeat ceremonies</div>
    `;
    Object.assign(hud.style, {
      position: 'fixed',
      left: '16px',
      top: '16px',
      color: '#eefaf2',
      font: '14px ui-sans-serif, system-ui, sans-serif',
      zIndex: '2',
      maxWidth: '760px',
      pointerEvents: 'auto',
    });
    const style = document.createElement('style');
    style.textContent = `
      canvas#game { display:block; width:100vw; height:100vh; image-rendering:auto; }
      #hud { text-shadow: 0 1px 2px rgba(0,0,0,.35); filter: drop-shadow(0 18px 30px rgba(0,0,0,.18)); }
      #hud .row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
      #hud button { background:linear-gradient(180deg,rgba(34,55,50,.94),rgba(11,18,18,.92)); color:#eefaf2; border:1px solid rgba(177,232,205,.30); padding:8px 10px; border-radius:999px; cursor:pointer; box-shadow:0 10px 22px rgba(0,0,0,.20), inset 0 1px rgba(255,255,255,.11); letter-spacing:.01em; }
      #hud button:hover { background:linear-gradient(180deg,rgba(46,76,66,.96),rgba(18,31,29,.94)); border-color:rgba(214,255,232,.48); transform:translateY(-1px); }
      #hud button:active { transform:translateY(0); }
      #hud #status { background:linear-gradient(180deg,rgba(4,8,9,.82),rgba(4,8,9,.58)); border:1px solid rgba(214,255,232,.18); padding:12px 14px; border-radius:18px; backdrop-filter: blur(12px) saturate(130%); line-height:1.38; box-shadow:0 18px 44px rgba(0,0,0,.34), inset 0 1px rgba(255,255,255,.06); }
      #hud .hint { color:#9fb3aa; font-size:12px; margin-top:7px; background:rgba(4,8,9,.38); padding:7px 10px; border:1px solid rgba(255,255,255,.06); border-radius:12px; }
      #hud .muted { color:#9fb3aa; }
      #hud .chip { display:inline-block; margin-right:6px; padding:2px 7px; border:1px solid rgba(214,255,232,.18); border-radius:999px; color:#d9f9e8; background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.025)); font-size:12px; }
      #hud .log { margin-top:7px; font-size:12px; color:#c6d8d0; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(hud);
  }

  return { canvas, hud };
}

function resizeCanvas(canvas: HTMLCanvasElement): CanvasDimensions {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }
  return { width: w, height: h };
}

function initialState(): RuntimeState {
  const save = ensureCommittedSave();
  const selectedCreatureId = Object.keys(save.creatures)[0] as CreatureId;
  return {
    save,
    layer: 'surface',
    playerX: 0,
    playerVelocity: 0,
    cameraX: 0,
    companionX: -COMPANION_TRAIL,
    debug: false,
    autoPilgrim: false,
    demoPilot: false,
    demoCooldown: 0,
    targetX: null,
    lastCrypticAt: performance.now(),
    lastResolvedAt: performance.now(),
    active: null,
    battle: null,
    ceremony: null,
    pendingWildParent: null,
    breath: null,
    selectedCreatureId,
    message: 'Walk. Watch the biome arrive before the ground. Every monster has coordinates.',
    log: ['Save loaded. Spine is live.'],
    assetManifest: null,
    readConfidence: 0,
    readLock: null,
  };
}

function currentWild(state: RuntimeState): CreatureNode | null {
  if (!state.active) return null;
  return wildForSlot(state.active.slot, state.save.realmSeed);
}

function nearestSlotTarget(state: RuntimeState): number {
  if (state.active && state.active.state !== 'fading' && state.active.state !== 'settled') {
    return state.active.slot.anchorX;
  }
  const slots = slotsNearPlayer(state.save.realmSeed, state.save.playerSeed, state.layer, state.playerX)
    .filter(slot => slot.anchorX >= state.playerX - 64)
    .sort((a, b) => Math.abs(a.anchorX - state.playerX) - Math.abs(b.anchorX - state.playerX));
  return (slots[0] ?? slotsNearPlayer(state.save.realmSeed, state.save.playerSeed, state.layer, state.playerX)[0]).anchorX;
}

function wakeNearestManifestation(state: RuntimeState): ActiveManifestation {
  const target = nearestSlotTarget(state);
  const nearest = slotsNearPlayer(state.save.realmSeed, state.save.playerSeed, state.layer, target)
    .sort((a, b) => Math.abs(a.anchorX - target) - Math.abs(b.anchorX - target))[0];
  const active: ActiveManifestation = {
    slot: nearest,
    state: 'latent',
    entryX: null,
    watchTime: 0,
    trackTime: 0,
    proximityBand: 'far',
  };
  return updateManifestationState(active, state.playerX, Math.abs(state.playerVelocity), 0);
}

function temperamentCue(temp: Temperament): string {
  switch (temp) {
    case 'AMBUSH': return 'dense stillness';
    case 'INVESTIGATOR': return 'rhythmic inquiry';
    case 'SKITTISH': return 'broken flicker';
    case 'TERRITORIAL': return 'wide claim';
  }
}

function readConfidenceFor(active: ActiveManifestation | null): number {
  if (!active) return 0;
  if (active.state === 'battle' || active.state === 'bondable') return clamp(active.watchTime / READ_FULL_SECONDS, 0, 1);
  if (!['watching', 'approaching', 'tracking'].includes(active.state)) return 0;
  return clamp(active.watchTime / READ_FULL_SECONDS, 0, 1);
}

function decodeRead(active: ActiveManifestation | null, debug = false): Temperament | null {
  if (!active) return null;
  if (debug) return active.slot.temperament;
  return readConfidenceFor(active) >= READ_LOCK_THRESHOLD ? active.slot.temperament : null;
}

function readablePattern(pattern: WildPattern | null): string {
  return pattern ?? 'unread';
}

function resolveAction(input: InputState, state: RuntimeState): BattleAction | null {
  const battle = state.battle;
  if (input.bestRead && battle) {
    if (battle.revealedNextPattern) return RESPONSE_TO_PATTERN[battle.revealedNextPattern];
    if (state.readLock) return TEMPERAMENT_DEFAULT_ACTION[state.readLock];
    return null;
  }
  if (input.hold) return 'HOLD';
  if (input.press) return 'PRESS';
  if (input.yield) return 'YIELD';
  return null;
}

function beginBattle(state: RuntimeState): RuntimeState {
  const wild = currentWild(state);
  if (!state.active || !wild) return { ...state, message: 'No manifestation is close enough to read.' };
  if (state.battle) return state;
  if (state.active.state === 'bondable') return { ...state, message: VESSEL_OPEN_PHRASE };

  const player = byId(state.save, state.selectedCreatureId);
  const battle = initBattle({
    playerCreatureId: player.id,
    wildCreatureId: wild.id,
    wildTemperament: state.active.slot.temperament,
    watchTimeAtTrigger: state.active.watchTime,
    battleSeed: `battle:v1:${state.active.slot.slotId}:${player.id}:${wild.id}`,
  });

  const confidence = clamp(battle.fieldReadAdvantage, 0, 1);
  const cue = temperamentCue(state.active.slot.temperament);
  const message = battle.revealedNextPattern
    ? `Battle opened. Pattern read: ${battle.revealedNextPattern}.`
    : confidence >= READ_DECODE_THRESHOLD
      ? `Battle opened from ${cue}. No exact pattern yet.`
      : 'Battle opened blind. Watch longer before pressing the field.';

  return pushLog({
    ...state,
    battle,
    active: { ...state.active, state: 'battle' },
    readConfidence: confidence,
    readLock: confidence >= READ_LOCK_THRESHOLD ? state.active.slot.temperament : null,
    breath: { intensity: 0.45, desaturation: 0.25, slowdown: 0.35, trigger: 'battle_start' },
    message,
  }, message);
}

function commitBattleResolution(state: RuntimeState, battle: BattleState): RuntimeState {
  if (battle.outcome === 'unresolved') return state;
  const wild = currentWild(state);
  let save = appendAction(state.save, {
    type: 'BATTLE_RESOLVED',
    at: nowDisplay(),
    creatureId: battle.wildCreatureId,
    outcome: battle.outcome,
  });
  commitSave(save);

  if (battle.outcome === 'still') {
    const message = `${resolutionPhrase(battle)} ${VESSEL_OPEN_PHRASE}`;
    return pushLog({
      ...state,
      save,
      active: state.active ? { ...state.active, state: 'bondable' } : state.active,
      pendingWildParent: wild,
      lastResolvedAt: performance.now(),
      breath: { intensity: 0.55, desaturation: 0.18, slowdown: 0.25, trigger: 'post_victory' },
      message,
    }, message);
  }

  const message = resolutionPhrase(battle);
  return pushLog({
    ...state,
    save,
    active: null,
    pendingWildParent: null,
    targetX: null,
    lastResolvedAt: performance.now(),
    breath: { intensity: 0.25, desaturation: 0.12, slowdown: 0.12, trigger: 'cryptic_resolve' },
    message,
  }, message);
}

function useVessel(state: RuntimeState): RuntimeState {
  const wild = state.pendingWildParent ?? currentWild(state);
  if (!state.active || state.active.state !== 'bondable' || !wild || state.ceremony) {
    return { ...state, message: 'No bondable wild nearby. Still it first.' };
  }
  const vessels = state.save.inventory.vessels.null_bloom;
  if (vessels <= 0) return { ...state, message: 'No null_bloom vessels remain.' };

  const parent = byId(state.save, state.selectedCreatureId);
  const bondNonce = state.save.bondNonce + 1;
  const context = buildBirthContext({
    realmSeed: state.save.realmSeed,
    playerSeed: state.save.playerSeed,
    layer: state.layer,
    birthX: state.playerX,
    vesselId: 'null_bloom',
    bondNonce,
  });
  const offspring = deriveOffspring(parent, wild, context);
  const firstVesselOfType = !state.save.actions.some(a => a.type === 'VESSEL_USED' && a.vesselId === 'null_bloom');
  const ceremony = initVesselCeremony(offspring, context, { skippable: !firstVesselOfType });
  const save = appendAction({
    ...state.save,
    bondNonce,
    inventory: {
      ...state.save.inventory,
      vessels: {
        ...state.save.inventory.vessels,
        null_bloom: vessels - 1,
      },
    },
  }, {
    type: 'VESSEL_USED',
    at: nowDisplay(),
    vesselId: 'null_bloom',
    bondNonce,
    birthX: state.playerX,
  });

  const message = firstVesselOfType
    ? 'Vessel opened. First null_bloom ceremony is unskippable. Save commits at Crack.'
    : 'Vessel opened. Hold Space to skip. Save commits at Crack.';

  return pushLog({
    ...state,
    save,
    ceremony,
    battle: null,
    pendingWildParent: wild,
    autoPilgrim: false,
    demoPilot: false,
    demoCooldown: 0,
    targetX: null,
    breath: { intensity: 0.55, desaturation: 0.2, slowdown: 0.5, trigger: 'vessel_rise' },
    message,
  }, message);
}

function commitCeremonyIfNeeded(state: RuntimeState): RuntimeState {
  const ceremony = state.ceremony;
  if (!ceremony || !ceremony.committed) return state;
  if (state.save.creatures[ceremony.offspring.id]) return state;

  let save = state.save;
  if (state.pendingWildParent && !save.creatures[state.pendingWildParent.id]) {
    save = addCreatureToSave(save, state.pendingWildParent);
  }
  save = addCreatureToSave(save, ceremony.offspring);
  save = appendAction(save, {
    type: 'OFFSPRING_BORN',
    at: nowDisplay(),
    creatureId: ceremony.offspring.id,
  });
  commitSave(save);

  const message = `${ceremony.offspring.trueName}. Born at X=${Math.round(ceremony.context.birthX)}. Demo complete; birth record survives reload.`;
  return pushLog({
    ...state,
    save,
    selectedCreatureId: ceremony.offspring.id,
    demoPilot: false,
    active: state.active ? { ...state.active, state: 'settled' } : state.active,
    pendingWildParent: null,
    lastResolvedAt: performance.now(),
    breath: { intensity: 0.7, desaturation: 0.1, slowdown: 0.2, trigger: 'crack' },
    message,
  }, message);
}

function applyDemoPilot(state: RuntimeState, input: InputState, dt: number): RuntimeState {
  let next = { ...state, demoCooldown: Math.max(0, state.demoCooldown - dt) };
  if (input.toggleDemo) {
    const enabled = !next.demoPilot;
    next = pushLog({
      ...next,
      demoPilot: enabled,
      autoPilgrim: enabled,
      targetX: enabled ? nearestSlotTarget(next) : next.targetX,
      message: enabled ? 'Demo pilot engaged. It will walk, read, still, open Vessel, and preserve the birth record.' : 'Demo pilot disengaged.',
    }, enabled ? 'Demo pilot engaged.' : 'Demo pilot disengaged.');
  }
  if (!next.demoPilot) return next;

  if (next.ceremony) {
    return next;
  }

  if (next.battle) {
    if (next.demoCooldown <= 0) {
      input.bestRead = true;
      next = { ...next, demoCooldown: 0.55 };
    }
    return next;
  }

  if (next.active?.state === 'bondable') {
    if (next.demoCooldown <= 0) {
      input.vessel = true;
      next = { ...next, demoCooldown: 0.75 };
    }
    return next;
  }

  const targetX = next.active?.slot.anchorX ?? next.targetX ?? nearestSlotTarget(next);
  const distance = Math.abs(targetX - next.playerX);
  next = {
    ...next,
    autoPilgrim: distance > AUTO_STOP_DISTANCE,
    targetX,
  };

  const confidence = readConfidenceFor(next.active);
  if (next.active && ['watching', 'approaching', 'tracking'].includes(next.active.state) && distance <= 120) {
    next = { ...next, autoPilgrim: false };
    if (confidence >= READ_LOCK_THRESHOLD && next.demoCooldown <= 0) {
      input.beginBattle = true;
      next = { ...next, demoCooldown: 0.75 };
    }
  }

  return next;
}

function applyMovement(state: RuntimeState, input: InputState, dt: number): RuntimeState {
  if (state.battle || state.ceremony) return { ...state, playerVelocity: 0 };

  let autoPilgrim = state.autoPilgrim;
  let targetX = state.targetX;
  if (input.toggleAuto) {
    autoPilgrim = !autoPilgrim;
    targetX = autoPilgrim ? nearestSlotTarget(state) : null;
  }
  if (autoPilgrim && targetX === null) targetX = nearestSlotTarget(state);

  let targetSpeed = input.left ? -MAX_SPEED : input.right ? MAX_SPEED : 0;
  if (autoPilgrim && targetX !== null && targetSpeed === 0) {
    const dx = targetX - state.playerX;
    if (Math.abs(dx) <= AUTO_STOP_DISTANCE) {
      targetSpeed = 0;
      autoPilgrim = false;
      targetX = null;
    } else {
      targetSpeed = Math.sign(dx) * AUTO_SPEED;
    }
  }

  return {
    ...state,
    autoPilgrim,
    targetX,
    playerVelocity: targetSpeed,
    playerX: state.playerX + targetSpeed * dt,
  };
}

function updateManifestation(state: RuntimeState, dt: number): RuntimeState {
  let next = state;
  if (!next.active) {
    const cadence = encounterCadenceStats({
      dryWalkMs: performance.now() - next.lastCrypticAt,
      timeSinceLastResolveMs: performance.now() - next.lastResolvedAt,
      activeManifestationCount: 0,
    });
    if (cadence.suggestion !== 'suppress') next = { ...next, active: wakeNearestManifestation(next) };
    return next;
  }

  if (!next.battle && !next.ceremony) {
    const before = next.active.state;
    const active = updateManifestationState(next.active, next.playerX, Math.abs(next.playerVelocity), dt);
    next = { ...next, active };
    const confidence = readConfidenceFor(active);
    const readLock = decodeRead(active, next.debug);
    next = { ...next, readConfidence: confidence, readLock };
    if (before !== 'cryptic' && active.state === 'cryptic') {
      next = pushLog({
        ...next,
        lastCrypticAt: performance.now(),
        breath: { intensity: 0.22, desaturation: 0.1, slowdown: 0.1, trigger: 'cryptic_resolve' },
        message: `A tell appears at X=${Math.round(active.slot.anchorX)}. Read its rhythm before beginning battle.`,
      }, `Cryptic tell: ${temperamentCue(active.slot.temperament)}.`);
    }
    if (before !== 'watching' && active.state === 'watching') {
      next = pushLog({ ...next, breath: { intensity: 0.32, desaturation: 0.14, slowdown: 0.16, trigger: 'watching_lock' }, message: `Watching. Cue: ${temperamentCue(active.slot.temperament)}.` }, 'Watching lock acquired.');
    }
    if (confidence >= READ_LOCK_THRESHOLD && !state.readLock && active.state !== 'battle') {
      next = pushLog({ ...next, readLock: active.slot.temperament, message: `Field read locked: ${temperamentCue(active.slot.temperament)}.` }, `Read locked: ${active.slot.temperament}.`);
    }
    if (active.state === 'battle') next = beginBattle(next);
    if (active.state === 'fading') {
      next = pushLog({ ...next, active: null, targetX: null, readConfidence: 0, readLock: null, message: 'It withdraws into the place.' }, 'Manifestation faded.');
    }
  }
  return next;
}

function update(state: RuntimeState, input: InputState, dt: number): RuntimeState {
  let next = state;
  if (input.selectNext) {
    const selectedCreatureId = selectCreature(next.save, next.selectedCreatureId, 1);
    next = pushLog({ ...next, selectedCreatureId, message: `Selected ${byId(next.save, selectedCreatureId).trueName}.` }, 'Journal selection advanced.');
  }
  if (input.selectPrev) {
    const selectedCreatureId = selectCreature(next.save, next.selectedCreatureId, -1);
    next = pushLog({ ...next, selectedCreatureId, message: `Selected ${byId(next.save, selectedCreatureId).trueName}.` }, 'Journal selection reversed.');
  }
  next = applyDemoPilot(next, input, dt);
  next = applyMovement(next, input, dt);

  next = {
    ...next,
    cameraX: next.cameraX + (next.playerX - next.cameraX) * CAMERA_LERP,
    companionX: next.companionX + ((next.playerX - COMPANION_TRAIL * Math.sign(next.playerVelocity || 1)) - next.companionX) * COMPANION_LERP,
  };

  next = updateManifestation(next, dt);
  if (input.beginBattle) next = beginBattle(next);

  const action = resolveAction(input, next);
  if (next.battle && input.bestRead && !action) {
    next = { ...next, message: 'No reliable read yet. Choose manually or observe longer next time.' };
  }

  if (next.battle && action) {
    const battle = processBattleAction(next.battle, action);
    let message = `You chose ${action}. Wild ${battle.lastWildPattern}. Stillness ${battle.stillness.toFixed(2)}.`;
    next = { ...next, battle, message };
    if (isBattleResolved(battle)) {
      next = commitBattleResolution(next, battle);
      next = { ...next, battle: null };
    } else if (battle.revealedNextPattern) {
      next = { ...next, message: `${message} Next read: ${battle.revealedNextPattern}.` };
    }
  }

  if (input.vessel) next = useVessel(next);

  if (next.ceremony) {
    const ceremony = tickVesselCeremony(next.ceremony, dt, input.skip);
    next = { ...next, ceremony };
    next = commitCeremonyIfNeeded(next);
    if (isCeremonyComplete(ceremony)) {
      next = pushLog({ ...next, ceremony: null, breath: { intensity: 0.5, desaturation: 0.05, slowdown: 0.15, trigger: 'true_name' } }, 'True Name resolved.');
    }
  }

  if (next.breath) {
    const intensity = Math.max(0, next.breath.intensity - dt * 0.35);
    next = { ...next, breath: intensity <= 0.01 ? null : { ...next.breath, intensity } };
  }

  return next;
}

function drawPlayerMarker(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const groundY = dims.height * GROUND_LINE_FRACTION;
  const sx = state.playerX - state.cameraX + dims.width / 2;
  const sy = groundY - terrainHeightAt(state.save.realmSeed, state.layer, state.playerX);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 34);
  ctx.lineTo(sx - 10, sy - 8);
  ctx.lineTo(sx + 10, sy - 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTargetMarker(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const targetX = state.targetX ?? state.active?.slot.anchorX ?? null;
  if (targetX === null) return;
  const groundY = dims.height * GROUND_LINE_FRACTION;
  const sx = targetX - state.cameraX + dims.width / 2;
  if (sx < -40 || sx > dims.width + 40) return;
  const sy = groundY - terrainHeightAt(state.save.realmSeed, state.layer, targetX);
  ctx.save();
  ctx.strokeStyle = state.autoPilgrim ? 'rgba(240,255,210,0.85)' : 'rgba(180,220,255,0.45)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(sx, sy - 80);
  ctx.lineTo(sx, sy + 20);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = 'rgba(240,255,210,0.9)';
  ctx.fillText(state.autoPilgrim ? 'pilgrimage' : 'slot', sx + 8, sy - 62);
  ctx.restore();
}


function drawCoordinateRibbon(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const x = 22;
  const y = dims.height - 86;
  const w = Math.min(560, dims.width - 44);
  const h = 56;
  const biome = biomeBlendAt(state.save.realmSeed, state.playerX);
  const glass = biome.weights.glassfen;
  const moss = biome.weights.mosswake;
  const ash = biome.weights.ashloom;

  ctx.save();
  ctx.globalAlpha = 0.9;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, `rgba(${Math.round(70 + glass * 80)}, ${Math.round(120 + moss * 80)}, ${Math.round(125 + ash * 60)}, .30)`);
  grad.addColorStop(1, 'rgba(6, 10, 12, .72)');
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(230,255,240,.16)';
  ctx.stroke();

  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = 'rgba(230,255,240,.70)';
  ctx.fillText('PILGRIMAGE COORDINATE', x + 18, y + 20);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  const activeText = state.active
    ? ` · ${state.readLock ?? temperamentCue(state.active.slot.temperament)} ${state.active.state}`
    : '';
  ctx.fillText(`${state.save.realmSeed} · X=${Math.round(state.playerX)}${activeText}`, x + 18, y + 43);
  ctx.restore();
}

function drawBreathAndMood(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const breath = state.breath;
  const battle = state.battle;
  const ceremony = state.ceremony;
  const intensity = clamp((breath?.intensity ?? 0) + (battle ? 0.18 : 0) + (ceremony ? 0.28 : 0), 0, 1);
  if (intensity <= 0.01) return;

  ctx.save();
  const cx = dims.width / 2;
  const cy = dims.height * 0.58;
  const r = Math.max(dims.width, dims.height) * (0.55 + intensity * 0.18);
  const grad = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
  grad.addColorStop(0, `rgba(255,255,255,0)`);
  grad.addColorStop(0.72, `rgba(10,14,16,${0.05 + intensity * 0.08})`);
  grad.addColorStop(1, `rgba(0,0,0,${0.38 + intensity * 0.22})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, dims.width, dims.height);

  if (breath) {
    ctx.globalAlpha = 0.08 + breath.intensity * 0.13;
    ctx.strokeStyle = breath.trigger === 'true_name' ? 'rgba(255,255,255,.88)' : 'rgba(210,255,235,.75)';
    ctx.lineWidth = 1.2;
    const rings = 3;
    for (let i = 0; i < rings; i++) {
      const pulse = (performance.now() / 1800 + i / rings) % 1;
      const rr = 90 + smoothstep(pulse) * 260;
      ctx.globalAlpha = (1 - pulse) * (0.16 + breath.intensity * 0.16);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFieldReadGuide(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const active = state.active;
  if (!active || state.battle || state.ceremony || active.state === 'bondable' || active.state === 'settled') return;
  const x = dims.width - 302;
  const y = 24;
  const w = 278;
  const h = 82;
  const confidence = readConfidenceFor(active);
  const cue = temperamentCue(active.slot.temperament);
  const decoded = state.readLock ?? (state.debug ? active.slot.temperament : null);
  ctx.save();
  ctx.fillStyle = 'rgba(5,10,12,.72)';
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = confidence >= READ_LOCK_THRESHOLD ? 'rgba(226,255,210,.42)' : 'rgba(240,255,235,.18)';
  ctx.stroke();
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = 'rgba(210,235,224,.78)';
  ctx.fillText('FIELD READ', x + 16, y + 22);
  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  ctx.fillText(decoded ?? cue, x + 16, y + 45);
  ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(210,235,224,.68)';
  ctx.fillText(confidence >= READ_LOCK_THRESHOLD ? 'locked · begin battle when ready' : 'hold close and watch before battle', x + 16, y + 64);
  const barW = w - 32;
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  roundRect(ctx, x + 16, y + 70, barW, 7, 4);
  ctx.fill();
  ctx.fillStyle = confidence >= READ_LOCK_THRESHOLD ? 'rgba(226,255,210,.95)' : 'rgba(143,205,255,.85)';
  roundRect(ctx, x + 16, y + 70, barW * confidence, 7, 4);
  ctx.fill();
  ctx.restore();
}

function drawBattleMeter(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const battle = state.battle;
  if (!battle) return;
  const x = dims.width - 302;
  const y = 24;
  const w = 278;
  const h = 70;
  ctx.save();
  ctx.fillStyle = 'rgba(5,10,12,.74)';
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,255,235,.18)';
  ctx.stroke();
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = 'rgba(210,235,224,.78)';
  ctx.fillText('FIELD READ', x + 16, y + 22);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  const pattern = readablePattern(battle.revealedNextPattern);
  const readName = battle.fieldReadAdvantage >= READ_LOCK_THRESHOLD ? battle.wildTemperament : temperamentCue(battle.wildTemperament);
  ctx.fillText(`${readName} · ${pattern}`, x + 16, y + 44);
  const barW = w - 32;
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  roundRect(ctx, x + 16, y + 54, barW, 8, 4);
  ctx.fill();
  const fill = clamp(battle.stillness, 0, 1) * barW;
  const grad = ctx.createLinearGradient(x + 16, y + 54, x + 16 + barW, y + 54);
  grad.addColorStop(0, 'rgba(143,205,255,.9)');
  grad.addColorStop(1, 'rgba(226,255,210,.95)');
  ctx.fillStyle = grad;
  roundRect(ctx, x + 16, y + 54, fill, 8, 4);
  ctx.fill();
  ctx.restore();
}

function drawCeremonyBadge(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const ceremony = state.ceremony;
  if (!ceremony) return;
  const x = dims.width / 2 - 190;
  const y = 28;
  const w = 380;
  const h = 58;
  const pct = clamp(ceremony.elapsed / 9.5, 0, 1);
  ctx.save();
  ctx.fillStyle = 'rgba(7,8,13,.78)';
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.stroke();
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = 'rgba(220,235,245,.75)';
  ctx.fillText('VESSEL CEREMONY', x + 18, y + 21);
  ctx.font = '21px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  ctx.fillText(ceremony.phase.replace(/_/g, ' '), x + 18, y + 45);
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  roundRect(ctx, x + 210, y + 28, 148, 9, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(210,255,235,.88)';
  roundRect(ctx, x + 210, y + 28, 148 * pct, 9, 5);
  ctx.fill();
  ctx.restore();
}

function drawWorldLattice(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState, visualTime: number): void {
  const blend = biomeBlendAt(state.save.realmSeed, state.playerX + FORECAST_OFFSET);
  const hue = Math.round(196 * blend.weights.glassfen + 118 * blend.weights.mosswake + 28 * blend.weights.ashloom);
  const sat = Math.round(34 * blend.weights.glassfen + 45 * blend.weights.mosswake + 62 * blend.weights.ashloom);
  const count = Math.max(7, Math.floor(dims.width / 180));
  const yBase = dims.height * 0.18;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < count; i++) {
    const lane = Math.floor((state.cameraX / 380) + i) - 2;
    const ns = `lattice:v2:${state.save.realmSeed}:${lane}`;
    const px = ((lane * 380 - state.cameraX * 0.18) % (dims.width + 260)) - 130;
    const y = yBase + rand01(`${ns}:y`) * dims.height * 0.24 + Math.sin(visualTime * 0.12 + lane) * 10;
    const length = 90 + rand01(`${ns}:len`) * 170;
    const tilt = (rand01(`${ns}:tilt`) - 0.5) * 70;
    ctx.lineWidth = 0.75 + rand01(`${ns}:w`) * 0.65;
    ctx.strokeStyle = `hsla(${hue}, ${sat}%, 78%, ${0.055 + rand01(`${ns}:a`) * 0.055})`;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + length, y + tilt);
    ctx.stroke();

    const nodes = 3;
    for (let n = 0; n < nodes; n++) {
      const t = n / (nodes - 1);
      const nx = px + length * t;
      const ny = y + tilt * t;
      const pulse = 0.55 + Math.sin(visualTime * 0.7 + lane + n) * 0.45;
      ctx.globalAlpha = 0.12 + pulse * 0.08;
      ctx.fillStyle = `hsl(${hue}, ${sat}%, 82%)`;
      ctx.beginPath();
      ctx.arc(nx, ny, 1.2 + pulse * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function drawPilgrimageTether(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState, visualTime: number): void {
  const targetX = state.active?.slot.anchorX ?? state.targetX;
  if (targetX === null || targetX === undefined) return;
  const distance = Math.abs(targetX - state.playerX);
  if (distance > 980) return;
  const groundY = dims.height * GROUND_LINE_FRACTION;
  const playerSx = state.playerX - state.cameraX + dims.width / 2;
  const targetSx = targetX - state.cameraX + dims.width / 2;
  const playerSy = groundY - terrainHeightAt(state.save.realmSeed, state.layer, state.playerX) - 18;
  const targetSy = groundY - terrainHeightAt(state.save.realmSeed, state.layer, targetX) - 22;
  const alpha = state.autoPilgrim || state.demoPilot ? 0.36 : 0.16;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = `rgba(214,255,232,${alpha})`;
  ctx.lineWidth = state.autoPilgrim || state.demoPilot ? 1.5 : 0.8;
  ctx.setLineDash([2, 11]);
  ctx.lineDashOffset = -visualTime * 18;
  ctx.beginPath();
  ctx.moveTo(playerSx, playerSy);
  ctx.quadraticCurveTo((playerSx + targetSx) / 2, Math.min(playerSy, targetSy) - 70, targetSx, targetSy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawActiveGlyph(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState, visualTime: number): void {
  const active = state.active;
  if (!active) return;
  const sx = active.slot.anchorX - state.cameraX + dims.width / 2;
  if (sx < -160 || sx > dims.width + 160) return;
  const groundY = dims.height * GROUND_LINE_FRACTION;
  const sy = groundY - terrainHeightAt(state.save.realmSeed, state.layer, active.slot.anchorX);
  const confidence = readConfidenceFor(active);
  const r = 34 + confidence * 46;
  const hue: Record<Temperament, number> = { AMBUSH: 28, INVESTIGATOR: 204, SKITTISH: 294, TERRITORIAL: 118 };
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(sx, sy - 10);
  ctx.rotate(visualTime * 0.15 * (active.slot.temperament === 'SKITTISH' ? -1 : 1));
  ctx.strokeStyle = `hsla(${hue[active.slot.temperament]}, 76%, 72%, ${0.16 + confidence * 0.26})`;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const rr = r + i * 15 + Math.sin(visualTime * 1.1 + i) * 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rr, rr * 0.28, i * Math.PI / 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = `hsla(${hue[active.slot.temperament]}, 88%, 78%, ${0.10 + confidence * 0.18})`;
  ctx.beginPath();
  ctx.arc(0, 0, 3 + confidence * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCinematicFrame(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const intensity = clamp((state.battle ? 0.55 : 0) + (state.ceremony ? 0.8 : 0) + (state.readLock ? 0.12 : 0), 0, 1);
  if (intensity <= 0.01) return;
  const bar = 22 + intensity * 38;
  ctx.save();
  const top = ctx.createLinearGradient(0, 0, 0, bar);
  top.addColorStop(0, `rgba(0,0,0,${0.55 * intensity})`);
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, dims.width, bar);
  const bottom = ctx.createLinearGradient(0, dims.height - bar, 0, dims.height);
  bottom.addColorStop(0, 'rgba(0,0,0,0)');
  bottom.addColorStop(1, `rgba(0,0,0,${0.55 * intensity})`);
  ctx.fillStyle = bottom;
  ctx.fillRect(0, dims.height - bar, dims.width, bar);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function draw(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const groundY = dims.height * GROUND_LINE_FRACTION;
  const visualTime = performance.now() / 1000 * (state.breath ? Math.max(0.25, 1 - state.breath.slowdown) : 1);
  drawParallax(ctx, state.cameraX, dims, state.save.realmSeed, state.breath);
  drawWorldLattice(ctx, dims, state, visualTime);
  drawTerrain(ctx, state.cameraX, dims, state.save.realmSeed);
  drawLandmarks(ctx, state.cameraX, dims, state.save.realmSeed);
  drawPilgrimageTether(ctx, dims, state, visualTime);
  drawTargetMarker(ctx, dims, state);
  drawPlayerMarker(ctx, dims, state);
  drawActiveGlyph(ctx, dims, state, visualTime);

  const blend = biomeBlendAt(state.save.realmSeed, state.playerX);
  const player = byId(state.save, state.selectedCreatureId);
  const companionSx = state.companionX - state.cameraX + dims.width / 2;
  const companionSy = groundY - terrainHeightAt(state.save.realmSeed, state.layer, state.companionX) - 18;
  drawCreature(ctx, player, companionSx, companionSy, visualTime, {
    worldX: state.companionX,
    slope: terrainSlopeAt(state.save.realmSeed, state.layer, state.companionX),
    emergence: 1,
  });

  if (state.active) {
    const sx = state.active.slot.anchorX - state.cameraX + dims.width / 2;
    const sy = groundY - terrainHeightAt(state.save.realmSeed, state.layer, state.active.slot.anchorX) - 26;
    if (state.active.state === 'cryptic' || state.active.state === 'watching') {
      drawCrypticTell(ctx, state.active, sx, sy, visualTime, blend);
    }
    if (['approaching', 'tracking', 'battle', 'bondable', 'settled'].includes(state.active.state)) {
      const wild = wildForSlot(state.active.slot, state.save.realmSeed);
      drawCreature(ctx, wild, sx, sy, visualTime, {
        worldX: state.active.slot.anchorX,
        slope: terrainSlopeAt(state.save.realmSeed, state.layer, state.active.slot.anchorX),
        emergence: state.active.state === 'settled' ? 0.35 : 0.85,
        alpha: state.active.state === 'settled' ? 0.35 : 1,
      });
    }
  }

  if (state.ceremony) renderVesselPhase(state.ceremony, ctx, dims);

  drawBreathAndMood(ctx, dims, state);
  drawFieldReadGuide(ctx, dims, state);
  drawBattleMeter(ctx, dims, state);
  drawCeremonyBadge(ctx, dims, state);
  drawCoordinateRibbon(ctx, dims, state);
  drawCinematicFrame(ctx, dims, state);

  drawDebugOverlay(ctx, dims, {
    enabled: state.debug,
    cameraX: state.cameraX,
    cursorWorldX: null,
    realmSeed: state.save.realmSeed,
    playerSeed: state.save.playerSeed,
    layer: state.layer,
    currentBiome: biomeBlendAt(state.save.realmSeed, state.playerX),
    forecastBiome: biomeBlendAt(state.save.realmSeed, state.playerX + FORECAST_OFFSET),
    currentSlope: terrainSlopeAt(state.save.realmSeed, state.layer, state.playerX),
    activeManifestation: state.active,
    nearbySlots: slotsNearPlayer(state.save.realmSeed, state.save.playerSeed, state.layer, state.playerX).map(slot => ({ slot, distance: Math.abs(slot.anchorX - state.playerX) })),
    dryWalkMs: performance.now() - state.lastCrypticAt,
    nextSlotDistance: state.active ? Math.abs(state.active.slot.anchorX - state.playerX) : Math.abs(nearestSlotTarget(state) - state.playerX),
  });

  renderLineageJournal(ctx, state.save, state.selectedCreatureId);
}

function statusHTML(state: RuntimeState): string {
  const active = state.active;
  const battle = state.battle;
  const creatureCount = Object.keys(state.save.creatures).length;
  const nextRead = battle?.revealedNextPattern ? ` · next read <b>${battle.revealedNextPattern}</b>` : '';
  const readPct = Math.round(state.readConfidence * 100);
  const activeRead = active ? (state.readLock ? `<b>${state.readLock}</b>` : `${temperamentCue(active.slot.temperament)}${state.readConfidence >= READ_DECODE_THRESHOLD ? ' · nearly resolved' : ''}`) : 'none';
  const target = state.targetX !== null ? ` · target X=${Math.round(state.targetX)}` : '';
  const assets = state.assetManifest ? 'asset manifest loaded' : 'procedural fallback';
  const selected = byId(state.save, state.selectedCreatureId);
  const demo = state.demoPilot ? ' · demo pilot ON' : '';
  const ceremony = state.ceremony ? ` · ceremony <b>${state.ceremony.phase.replace(/_/g, ' ')}</b>` : '';
  return `
    <div><span class="chip">Nexus Lattice</span><span class="chip">${state.save.realmSeed}</span><span class="chip">X=${Math.round(state.playerX)}</span><b>${state.message}</b></div>
    <div class="muted">${assets}${target}${demo}${ceremony}</div>
    <div>Selected: <b>${selected.trueName}</b> · origin ${selected.origin} · generation ${selected.dna.generation}</div>
    <div>Manifestation: <b>${active?.state ?? 'none'}</b> ${active ? `· read ${readPct}% · ${activeRead} · slot ${active.slot.slotIndex}` : ''}</div>
    <div>Battle: <b>${battle?.outcome ?? 'none'}</b>${battle ? ` · stillness ${battle.stillness.toFixed(2)} · field ${Math.round(battle.fieldReadAdvantage * 100)}%${nextRead}` : ''}</div>
    <div>Inventory: null_bloom ${state.save.inventory.vessels.null_bloom} · creatures ${creatureCount} · proof ${state.save.derivationProof.hash}</div>
    <div class="log">${state.log.map(line => `◇ ${line}`).join('<br>')}</div>
  `;
}

function resetTransientInput(input: InputState): void {
  input.hold = false;
  input.press = false;
  input.yield = false;
  input.vessel = false;
  input.bestRead = false;
  input.beginBattle = false;
  input.toggleAuto = false;
  input.toggleDemo = false;
  input.selectNext = false;
  input.selectPrev = false;
}

function boot(): void {
  const { canvas, hud } = ensureShell();
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable.');
  const status = hud.querySelector<HTMLDivElement>('#status');
  let state = initialState();
  const input: InputState = {
    left: false,
    right: false,
    hold: false,
    press: false,
    yield: false,
    vessel: false,
    skip: false,
    bestRead: false,
    beginBattle: false,
    toggleAuto: false,
    toggleDemo: false,
    selectNext: false,
    selectPrev: false,
  };

  loadAssetManifest().then(assetManifest => {
    state = pushLog({ ...state, assetManifest }, assetManifest ? 'Asset manifest loaded.' : 'Asset manifest missing; procedural fallback.');
  });

  const key = (e: KeyboardEvent, down: boolean) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') input.left = down;
    if (k === 'arrowright' || k === 'd') input.right = down;
    if (down && e.key === '`') state = { ...state, debug: !state.debug };
    if (down && k === 'p') input.toggleAuto = true;
    if (down && k === 'g') input.toggleDemo = true;
    if (down && e.key === ']') input.selectNext = true;
    if (down && e.key === '[') input.selectPrev = true;
    if (down && k === 'b') input.beginBattle = true;
    if (down && k === 'r') input.bestRead = true;
    if (down && k === 'v') input.vessel = true;
    if (e.key === ' ') input.skip = down;
  };
  window.addEventListener('keydown', e => key(e, true));
  window.addEventListener('keyup', e => key(e, false));

  hud.addEventListener('click', async (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'new') {
      const fresh = createNewSave(REALM_SEED, PLAYER_SEED);
      commitSave(fresh);
      state = pushLog({ ...initialState(), save: fresh, selectedCreatureId: Object.keys(fresh.creatures)[0] as CreatureId }, 'New save committed.');
    }
    if (action === 'auto') input.toggleAuto = true;
    if (action === 'demo') input.toggleDemo = true;
    if (action === 'debug') state = { ...state, debug: !state.debug };
    if (action === 'battle') input.beginBattle = true;
    if (action === 'best') input.bestRead = true;
    if (action === 'hold') input.hold = true;
    if (action === 'press') input.press = true;
    if (action === 'yield') input.yield = true;
    if (action === 'vessel') input.vessel = true;
    if (action === 'copy') {
      const text = copyBirthCertificateText(byId(state.save, state.selectedCreatureId), state.save);
      await navigator.clipboard?.writeText(text);
      state = pushLog({ ...state, message: 'Birth certificate text copied.' }, 'Certificate copied.');
    }
    if (action === 'image') exportBirthCertificateImage(byId(state.save, state.selectedCreatureId), state.save);
    if (action === 'lineage') {
      const creature = byId(state.save, state.selectedCreatureId);
      downloadTextFile(`${String(creature.id).replace(/[^a-z0-9_-]/gi, '_')}-lineage.json`, exportLineageJSON(state.save, creature.id));
      state = pushLog({ ...state, message: 'Lineage JSON exported.' }, 'Lineage JSON exported.');
    }
    if (action === 'next') input.selectNext = true;
    if (action === 'prev') input.selectPrev = true;
  });

  let last = performance.now();
  const frame = (t: number) => {
    const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
    last = t;
    const dims = resizeCanvas(canvas);
    state = update(state, input, dt);
    resetTransientInput(input);
    ctx.clearRect(0, 0, dims.width, dims.height);
    draw(ctx, dims, state);
    if (status) status.innerHTML = statusHTML(state);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

if (typeof window !== 'undefined') boot();
