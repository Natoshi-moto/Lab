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
} from './types.js';
import {
  biomeBlendAt,
  terrainHeightAt,
  terrainSlopeAt,
} from './core/deterministic.js';
import {
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
  lastCrypticAt: number;
  active: ActiveManifestation | null;
  battle: BattleState | null;
  ceremony: VesselCeremonyState | null;
  breath: BreathState | null;
  selectedCreatureId: CreatureId;
  message: string;
  demoMode: boolean;
  demoIntent: string;
}

interface InputState {
  left: boolean;
  right: boolean;
  hold: boolean;
  press: boolean;
  yield: boolean;
  vessel: boolean;
  skip: boolean;
}

const REALM_SEED = 'Glassfen-91';
const PLAYER_SEED = 'Neo' as PlayerSeed;
const MAX_SPEED = 180;
const COMPANION_TRAIL = 72;
const CAMERA_LERP = 0.09;
const COMPANION_LERP = 0.075;

function byId(save: SaveFileV1, id: CreatureId): CreatureNode {
  return save.creatures[id] ?? Object.values(save.creatures)[0];
}

function nowDisplay() {
  return { displayOnly: Date.now() };
}

function ensureShell(): { canvas: HTMLCanvasElement; hud: HTMLDivElement } {
  document.body.style.margin = '0';
  document.body.style.background = '#02050a';
  document.body.style.overflow = 'hidden';
  document.body.style.color = '#ecfeff';

  let canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'game';
    document.body.appendChild(canvas);
  }
  canvas.style.display = 'block';

  let hud = document.querySelector<HTMLDivElement>('#hud');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'hud';
    hud.innerHTML = `
      <section class="hud-shell" aria-live="polite">
        <div class="masthead">
          <div>
            <div class="eyebrow">NEXUS LATTICE · GOLD STITCH</div>
            <h1>Every creature has coordinates.</h1>
          </div>
          <div class="proof-chip">verified spine</div>
        </div>
        <div id="status" class="status-card"></div>
        <div class="controls-grid">
          <button data-action="new">New save</button>
          <button data-action="debug">Debug</button>
          <button data-action="demo" class="accent">Auto demo</button>
          <button data-action="hold">HOLD</button>
          <button data-action="press">PRESS</button>
          <button data-action="yield">YIELD</button>
          <button data-action="vessel" class="primary">Open Vessel</button>
          <button data-action="copy">Copy certificate</button>
          <button data-action="image">Export certificate</button>
        </div>
        <div class="hint">←/→ or A/D move · B battle · V vessel · F3 debug · Space skips ceremony</div>
      </section>
    `;
    Object.assign(hud.style, {
      position: 'fixed',
      left: '18px',
      top: '18px',
      zIndex: '3',
      width: 'min(720px, calc(100vw - 36px))',
      pointerEvents: 'auto',
    });
    const style = document.createElement('style');
    style.textContent = `
      :root {
        color-scheme: dark;
        --nl-ink: #effcff;
        --nl-soft: rgba(224, 252, 255, .72);
        --nl-dim: rgba(190, 214, 216, .58);
        --nl-line: rgba(165, 243, 252, .18);
        --nl-line-strong: rgba(165, 243, 252, .34);
        --nl-panel: rgba(2, 9, 17, .56);
        --nl-panel-strong: rgba(3, 12, 24, .74);
        --nl-aqua: #a5f3fc;
        --nl-mint: #bbf7d0;
        --nl-rose: #f0abfc;
      }
      html, body { height: 100%; }
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        background:
          radial-gradient(circle at 18% 22%, rgba(165,243,252,.16), transparent 28%),
          radial-gradient(circle at 76% 8%, rgba(240,171,252,.10), transparent 24%),
          linear-gradient(180deg, rgba(2,6,23,.12), rgba(2,6,23,.36));
      }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 4;
        opacity: .18;
        background: repeating-linear-gradient(0deg, rgba(255,255,255,.18) 0, rgba(255,255,255,.18) 1px, transparent 1px, transparent 4px);
        mix-blend-mode: overlay;
      }
      canvas#game { width: 100vw; height: 100vh; background: #02050a; }
      .hud-shell {
        color: var(--nl-ink);
        font: 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        border: 1px solid var(--nl-line);
        background: linear-gradient(135deg, var(--nl-panel-strong), var(--nl-panel));
        box-shadow: 0 26px 80px rgba(0,0,0,.36), inset 0 1px 0 rgba(255,255,255,.08);
        border-radius: 28px;
        padding: 16px;
        backdrop-filter: blur(18px) saturate(1.15);
      }
      .masthead { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
      .eyebrow { color: var(--nl-aqua); font-size: 11px; font-weight: 850; letter-spacing: .22em; text-transform: uppercase; }
      h1 { margin: 4px 0 0; font-size: clamp(24px, 4vw, 44px); letter-spacing: -.06em; line-height: .96; }
      .proof-chip {
        white-space: nowrap;
        border: 1px solid rgba(187,247,208,.28);
        background: rgba(187,247,208,.10);
        color: var(--nl-mint);
        border-radius: 999px;
        padding: 7px 10px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .12em;
      }
      .status-card {
        margin-top: 14px;
        border: 1px solid var(--nl-line);
        background: rgba(0,0,0,.22);
        border-radius: 18px;
        padding: 12px 14px;
        color: var(--nl-soft);
        line-height: 1.45;
      }
      .status-line { color: var(--nl-ink); font-weight: 760; }
      .status-sub { margin-top: 8px; color: var(--nl-dim); font-size: 12px; }
      .metric-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
      .metric-row span { border: 1px solid var(--nl-line); background: rgba(255,255,255,.045); border-radius: 999px; padding: 5px 8px; color: var(--nl-soft); font-size: 12px; }
      .metric-row b { color: var(--nl-aqua); font-size: 10px; text-transform: uppercase; letter-spacing: .12em; margin-right: 5px; }
      .controls-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin-top: 12px;
      }
      #hud button {
        appearance: none;
        color: var(--nl-ink);
        background: rgba(255,255,255,.055);
        border: 1px solid var(--nl-line);
        padding: 10px 11px;
        border-radius: 14px;
        cursor: pointer;
        font: 800 12px ui-sans-serif, system-ui, sans-serif;
        letter-spacing: .05em;
        transition: transform .12s ease, border-color .12s ease, background .12s ease, box-shadow .12s ease;
      }
      #hud button:hover {
        transform: translateY(-1px);
        border-color: var(--nl-line-strong);
        background: rgba(255,255,255,.09);
        box-shadow: 0 10px 28px rgba(165,243,252,.08);
      }
      #hud button.accent {
        border-color: rgba(187,247,208,.45);
        background: rgba(187,247,208,.11);
        color: var(--nl-mint);
      }
      #hud button.primary {
        color: #041014;
        border-color: rgba(165,243,252,.70);
        background: linear-gradient(135deg, #a5f3fc, #f0abfc);
      }
      .hint { margin-top: 10px; color: var(--nl-dim); font-size: 12px; }
      @media (max-width: 680px) {
        #hud { left: 10px !important; top: 10px !important; width: calc(100vw - 20px) !important; }
        .hud-shell { border-radius: 22px; padding: 13px; }
        .controls-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .proof-chip { display: none; }
      }
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
  const save = loadSave() ?? createNewSave(REALM_SEED, PLAYER_SEED);
  const selectedCreatureId = Object.keys(save.creatures)[0] as CreatureId;
  return {
    save,
    layer: 'surface',
    playerX: 0,
    playerVelocity: 0,
    cameraX: 0,
    companionX: -COMPANION_TRAIL,
    debug: false,
    lastCrypticAt: performance.now(),
    active: null,
    battle: null,
    ceremony: null,
    breath: null,
    selectedCreatureId,
    message: 'Walk. Watch the biome arrive before the ground. Every monster has coordinates.',
    demoMode: false,
    demoIntent: 'manual',
  };
}

function currentWild(state: RuntimeState): CreatureNode | null {
  if (!state.active) return null;
  return wildForSlot(state.active.slot, state.save.realmSeed);
}

function wakeNearestManifestation(state: RuntimeState): ActiveManifestation {
  const slots = slotsNearPlayer(state.save.realmSeed, state.save.playerSeed, state.layer, state.playerX);
  const nearest = [...slots].sort((a, b) => Math.abs(a.anchorX - state.playerX) - Math.abs(b.anchorX - state.playerX))[0];
  const active: ActiveManifestation = {
    slot: nearest,
    state: 'latent',
    entryX: null,
    watchTime: 0,
    trackTime: 0,
    proximityBand: 'far',
  };
  return updateManifestationState(active, state.playerX, state.playerVelocity, 0);
}

function resolveAction(input: InputState): BattleAction | null {
  if (input.hold) return 'HOLD';
  if (input.press) return 'PRESS';
  if (input.yield) return 'YIELD';
  return null;
}
function bestBattleAction(state: BattleState): BattleAction {
  if (state.revealedNextPattern === 'TEST') return 'PRESS';
  if (state.revealedNextPattern === 'BURST') return 'HOLD';
  if (state.revealedNextPattern === 'WITHDRAW') return 'YIELD';
  if (state.wildTemperament === 'AMBUSH') return 'HOLD';
  if (state.wildTemperament === 'INVESTIGATOR') return 'PRESS';
  if (state.wildTemperament === 'SKITTISH') return 'YIELD';
  return 'HOLD';
}

function demoDirection(state: RuntimeState): -1 | 0 | 1 {
  if (!state.demoMode || state.battle || state.ceremony) return 0;
  const target = state.active?.slot.anchorX ?? state.playerX;
  const delta = target - state.playerX;
  if (Math.abs(delta) < 32) return 0;
  return delta > 0 ? 1 : -1;
}


function beginBattle(state: RuntimeState): RuntimeState {
  const wild = currentWild(state);
  if (!state.active || !wild) return state;
  const player = byId(state.save, state.selectedCreatureId);
  const battle = initBattle({
    playerCreatureId: player.id,
    wildCreatureId: wild.id,
    wildTemperament: state.active.slot.temperament,
    watchTimeAtTrigger: state.active.watchTime,
    battleSeed: `battle:v1:${state.active.slot.slotId}:${player.id}:${wild.id}`,
  });
  return {
    ...state,
    battle,
    active: { ...state.active, state: 'battle' },
    breath: { intensity: 0.45, desaturation: 0.25, slowdown: 0.35, trigger: 'battle_start' },
    message: `Battle opened. ${state.active.slot.temperament}. Choose HOLD, PRESS, or YIELD.`,
  };
}

function useVessel(state: RuntimeState): RuntimeState {
  const wild = currentWild(state);
  if (!wild || state.ceremony) return { ...state, message: 'No bondable wild nearby.' };
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
  const ceremony = initVesselCeremony(offspring, context, { skippable: state.save.actions.some(a => a.type === 'VESSEL_USED' && a.vesselId === 'null_bloom') });
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

  return {
    ...state,
    save,
    ceremony,
    battle: null,
    breath: { intensity: 0.55, desaturation: 0.2, slowdown: 0.5, trigger: 'vessel_rise' },
    message: 'Vessel opened. Save commits at Crack.',
  };
}

function commitCeremonyIfNeeded(state: RuntimeState): RuntimeState {
  const ceremony = state.ceremony;
  if (!ceremony || !ceremony.committed) return state;
  if (state.save.creatures[ceremony.offspring.id]) return state;

  let save = addCreatureToSave(state.save, ceremony.offspring);
  save = appendAction(save, {
    type: 'OFFSPRING_BORN',
    at: nowDisplay(),
    creatureId: ceremony.offspring.id,
  });
  commitSave(save);

  return {
    ...state,
    save,
    selectedCreatureId: ceremony.offspring.id,
    active: state.active ? { ...state.active, state: 'settled' } : state.active,
    breath: { intensity: 0.7, desaturation: 0.1, slowdown: 0.2, trigger: 'crack' },
    message: `${ceremony.offspring.trueName}. Born at X=${Math.round(ceremony.context.birthX)}.`,
  };
}

function update(state: RuntimeState, input: InputState, dt: number): RuntimeState {
  let next = state;

  if (!next.battle && !next.ceremony) {
    const autoDir = demoDirection(next);
    const targetSpeed = input.left ? -MAX_SPEED : input.right ? MAX_SPEED : autoDir * MAX_SPEED;
    next = {
      ...next,
      playerVelocity: targetSpeed,
      playerX: next.playerX + targetSpeed * dt,
      demoIntent: next.demoMode
        ? autoDir === 0
          ? 'holding at the manifestation seam'
          : `walking toward slot ${next.active?.slot.slotIndex ?? '—'}`
        : 'manual',
    };
  }

  next = {
    ...next,
    cameraX: next.cameraX + (next.playerX - next.cameraX) * CAMERA_LERP,
    companionX: next.companionX + ((next.playerX - COMPANION_TRAIL * Math.sign(next.playerVelocity || 1)) - next.companionX) * COMPANION_LERP,
  };

  if (!next.active) next = { ...next, active: wakeNearestManifestation(next) };
  else if (!next.battle && !next.ceremony) {
    const active = updateManifestationState(next.active, next.playerX, Math.abs(next.playerVelocity), dt);
    next = { ...next, active };
    if (active.state === 'cryptic') next = { ...next, lastCrypticAt: performance.now() };
    if (active.state === 'battle') next = beginBattle(next);
  }

  const action = resolveAction(input) ?? (next.demoMode && next.battle ? bestBattleAction(next.battle) : null);
  if (next.battle && action) {
    const battle = processBattleAction(next.battle, action);
    let message = `You chose ${action}. Stillness ${battle.stillness.toFixed(2)}.`;
    if (isBattleResolved(battle)) message = resolutionPhrase(battle);
    next = { ...next, battle, message };
    if (battle.outcome === 'still') next = { ...next, active: next.active ? { ...next.active, state: 'bondable' } : next.active };
  }

  if (next.demoMode && next.active?.state === 'bondable' && !next.ceremony) {
    next = useVessel(next);
  }

  if (input.vessel) next = useVessel(next);

  if (next.ceremony) {
    const ceremony = tickVesselCeremony(next.ceremony, dt, input.skip);
    next = { ...next, ceremony };
    next = commitCeremonyIfNeeded(next);
    if (isCeremonyComplete(ceremony)) next = { ...next, ceremony: null };
  }

  if (next.breath) {
    const intensity = Math.max(0, next.breath.intensity - dt * 0.35);
    next = { ...next, breath: intensity <= 0.01 ? null : { ...next.breath, intensity } };
  }

  return next;
}

function draw(ctx: CanvasRenderingContext2D, dims: CanvasDimensions, state: RuntimeState): void {
  const groundY = dims.height * GROUND_LINE_FRACTION;
  drawParallax(ctx, state.cameraX, dims, state.save.realmSeed, state.breath);
  drawTerrain(ctx, state.cameraX, dims, state.save.realmSeed);
  drawLandmarks(ctx, state.cameraX, dims, state.save.realmSeed);

  const blend = biomeBlendAt(state.save.realmSeed, state.playerX);
  const player = byId(state.save, state.selectedCreatureId);
  const companionSx = state.companionX - state.cameraX + dims.width / 2;
  const companionSy = groundY - terrainHeightAt(state.save.realmSeed, state.layer, state.companionX) - 18;
  drawCreature(ctx, player, companionSx, companionSy, performance.now() / 1000, {
    worldX: state.companionX,
    slope: terrainSlopeAt(state.save.realmSeed, state.layer, state.companionX),
    emergence: 1,
  });

  if (state.active) {
    const sx = state.active.slot.anchorX - state.cameraX + dims.width / 2;
    const sy = groundY - terrainHeightAt(state.save.realmSeed, state.layer, state.active.slot.anchorX) - 26;
    if (state.active.state === 'cryptic' || state.active.state === 'watching') {
      drawCrypticTell(ctx, state.active, sx, sy, performance.now() / 1000, blend);
    }
    if (['approaching', 'tracking', 'battle', 'bondable', 'settled'].includes(state.active.state)) {
      const wild = wildForSlot(state.active.slot, state.save.realmSeed);
      drawCreature(ctx, wild, sx, sy, performance.now() / 1000, {
        worldX: state.active.slot.anchorX,
        slope: terrainSlopeAt(state.save.realmSeed, state.layer, state.active.slot.anchorX),
        emergence: state.active.state === 'settled' ? 0.35 : 0.85,
        alpha: state.active.state === 'settled' ? 0.35 : 1,
      });
    }
  }

  if (state.ceremony) {
    renderVesselPhase(state.ceremony, ctx, dims);
  }

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
    nextSlotDistance: state.active ? Math.abs(state.active.slot.anchorX - state.playerX) : 0,
  });

  renderLineageJournal(ctx, state.save, state.selectedCreatureId);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch] ?? ch));
}

function boot(): void {
  const { canvas, hud } = ensureShell();
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable.');
  const status = hud.querySelector<HTMLDivElement>('#status');
  let state = initialState();
  const input: InputState = { left: false, right: false, hold: false, press: false, yield: false, vessel: false, skip: false };

  const key = (e: KeyboardEvent, down: boolean) => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') input.left = down;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') input.right = down;
    if (down && (e.key === 'F3' || e.key === '`')) state = { ...state, debug: !state.debug };
    if (down && e.key.toLowerCase() === 'b') state = beginBattle(state);
    if (down && e.key.toLowerCase() === 'v') input.vessel = true;
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
      state = { ...initialState(), save: fresh, selectedCreatureId: Object.keys(fresh.creatures)[0] as CreatureId };
    }
    if (action === 'debug') state = { ...state, debug: !state.debug };
    if (action === 'demo') state = { ...state, demoMode: !state.demoMode, message: state.demoMode ? 'Auto demo paused.' : 'Auto demo armed: walking, reading, stilling, birthing.' };
    if (action === 'hold') input.hold = true;
    if (action === 'press') input.press = true;
    if (action === 'yield') input.yield = true;
    if (action === 'vessel') input.vessel = true;
    if (action === 'copy') {
      await navigator.clipboard?.writeText(copyBirthCertificateText(byId(state.save, state.selectedCreatureId), state.save));
      state = { ...state, message: 'Birth certificate text copied.' };
    }
    if (action === 'image') exportBirthCertificateImage(byId(state.save, state.selectedCreatureId), state.save);
  });

  let last = performance.now();
  const frame = (t: number) => {
    const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
    last = t;
    const dims = resizeCanvas(canvas);
    state = update(state, input, dt);
    input.hold = input.press = input.yield = input.vessel = false;
    ctx.clearRect(0, 0, dims.width, dims.height);
    draw(ctx, dims, state);
    if (status) {
      const creature = byId(state.save, state.selectedCreatureId);
      const activeState = state.active?.state ?? 'none';
      const temperament = state.active?.slot.temperament ?? '—';
      const slot = state.active?.slot.slotIndex ?? '—';
      const stillness = state.battle ? state.battle.stillness.toFixed(2) : '—';
      status.innerHTML = `
        <div class="status-line">${escapeHtml(state.message)}</div>
        <div class="metric-row">
          <span><b>X</b>${Math.round(state.playerX)}</span>
          <span><b>slot</b>${slot}</span>
          <span><b>state</b>${escapeHtml(activeState)}</span>
          <span><b>wild</b>${escapeHtml(temperament)}</span>
          <span><b>still</b>${stillness}</span>
          <span><b>proof</b>${escapeHtml(state.save.derivationProof.hash)}</span>
        </div>
        <div class="status-sub">Selected: ${escapeHtml(creature.trueName)} · ${state.demoMode ? escapeHtml(state.demoIntent) : 'manual control'}</div>
      `;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

if (typeof window !== 'undefined') {
  boot();
}
