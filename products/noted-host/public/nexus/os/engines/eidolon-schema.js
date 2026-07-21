/* Nexus Eidolon Schema v1 — canonical UI/runtime specs for living creatures, worlds, and attacks. */
(function(root){
  'use strict';
  const now = () => Date.now ? Date.now() : 0;
  const clampByte = v => Math.max(0, Math.min(255, Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0));
  function mulberry32(seed){ let t = Number(seed || 0) >>> 0; return function(){ t = (t + 0x6D2B79F5) >>> 0; let r = t; r = Math.imul(r ^ (r >>> 15), r | 1); r ^= r + Math.imul(r ^ (r >>> 7), r | 61); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function nextSeed(seed){ const r = mulberry32(seed || (Math.random()*0xffffffff)); return Math.floor(r() * 0xffffffff) >>> 0; }
  const CREATURE_AXES = [
    ['body_radius','body','body radius',160],['body_stretch_x','body','body width',128],['body_stretch_y','body','body height',128],['body_lumpiness','body','body lumpiness',50],['body_lump_count','body','body lump count',140],['body_outline','body','outline weight',140],['body_shadow','body','shadow band',140],
    ['arm_count','appendages','appendage count',80],['arm_length','appendages','appendage length',128],['arm_width','appendages','appendage width',128],['arm_taper','appendages','appendage taper',160],['arm_wobble','appendages','appendage wobble',120],['arm_wobble_rate','appendages','wobble speed',128],['arm_curl','appendages','appendage curl',60],['arm_droop','appendages','appendage angle',128],
    ['eye_count','eyes','eye count',128],['eye_size','eyes','eye size',128],['eye_spacing','eyes','eye spacing',128],['eye_height','eyes','eye position',100],['eye_pupil','eyes','pupil size',140],['eye_glow','eyes','eye glow',120],
    ['mark_runes','surface','rune marks',40],['mark_spots','surface','glow spots',40],['mark_drips','surface','surface drips',0],['mark_facets','surface','crystal facets',0],
    ['particle_count','particles','particle count',80],['particle_radius','particles','orbit radius',140],['particle_size','particles','particle size',120],['particle_drift','particles','drift speed',100],['particle_turb','particles','particle turbulence',60],
    ['glow_radius','glow','outer glow radius',140],['glow_strength','glow','outer glow strength',140],['core_size','glow','core size',120],['core_brightness','glow','core brightness',160],['pulse_rate','glow','pulse rate',128],
    ['hue_primary','color','primary hue',200],['hue_accent','color','accent hue',80],['hue_glow','color','glow hue',140],['saturation','color','saturation',170],['lightness','color','lightness',130]
  ];
  const ENVIRONMENT_AXES = [
    ['sky_top_hue','deep_bg','sky top hue',148],['sky_top_lightness','deep_bg','sky top lightness',45],['sky_bot_hue','deep_bg','sky bottom hue',200],['sky_bot_lightness','deep_bg','sky bottom lightness',120],['sky_saturation','deep_bg','sky saturation',120],['sky_band_position','deep_bg','sky horizon band',140],['sky_pulse_rate','deep_bg','sky pulse rate',0],['star_count','deep_bg','star count',0],['star_brightness','deep_bg','star brightness',128],
    ['far_count','far','far shape count',80],['far_height','far','far shape height',100],['far_jitter','far','far shape variance',140],['far_darkness','far','far shape darkness',140],['far_haze','far','atmospheric haze',120],
    ['mid_count','mid','mid shape count',60],['mid_height','mid','mid shape height',140],['mid_jitter','mid','mid shape variance',150],['mid_darkness','mid','mid shape darkness',180],
    ['ground_y','ground','ground horizon y',170],['ground_hue','ground','ground hue',128],['ground_lightness','ground','ground lightness',80],['ground_texture','ground','ground texture density',80],['ground_glow','ground','ground rim glow',40],
    ['fg_count','foreground','foreground particle count',30],['fg_size','foreground','foreground particle size',120],['fg_speed','foreground','foreground drift speed',128],['fg_direction','foreground','foreground drift direction',128],['fg_opacity','foreground','foreground opacity',140],
    ['fog_density','ambient','fog density',30],['fog_hue','ambient','fog hue',150],['vignette','ambient','vignette amount',80],['scene_tint','ambient','scene tint strength',60]
  ];
  const BATTLE_AXES = [
    ['duration','timing','duration',120],['anticipation_time','timing','anticipation time',80],['strike_time','timing','strike time',90],['impact_hold','timing','impact hold',80],['recovery_time','timing','recovery time',120],['hitstop','timing','hitstop',90],
    ['lunge_distance','attacker','lunge distance',140],['lunge_arc','attacker','lunge arc',128],['windup_pullback','attacker','windup pullback',80],['attacker_squash','attacker','attacker squash',80],['attacker_stretch','attacker','attacker stretch',110],['recoil_distance','attacker','recoil distance',70],
    ['attack_type','attack','attack type blend',80],['arc_width','attack','arc width',160],['arc_height','attack','arc height',110],['trail_length','attack','trail length',150],['trail_thickness','attack','trail thickness',120],['trail_curve','attack','trail curve',120],
    ['impact_flash_size','impact','impact flash size',140],['impact_flash_brightness','impact','impact brightness',170],['spark_count','impact','spark count',120],['spark_spread','impact','spark spread',150],['shockwave_radius','impact','shockwave radius',110],['screen_shake','impact','screen shake',80],
    ['knockback_distance','damage','knockback distance',120],['knockback_angle','damage','knockback angle',110],['defender_squash','damage','defender squash',100],['defender_stretch','damage','defender stretch',100],['stagger_wobble','damage','stagger wobble',100],['damage_flash','damage','damage flash',160],['damage_flash_decay','damage','flash decay',120],
    ['debris_count','particles','debris count',90],['debris_speed','particles','debris speed',120],['debris_gravity','particles','debris gravity',120],['debris_lifetime','particles','debris lifetime',120],['dust_amount','particles','dust amount',70],['dust_spread','particles','dust spread',90],
    ['attack_hue','color','attack hue',10],['impact_hue','color','impact hue',40],['damage_hue','color','damage hue',0],['saturation','color','saturation',180],['lightness','color','lightness',150],['afterimage_opacity','color','afterimage opacity',90]
  ];
  const CREATURE_A = ['Tal','Vor','Eli','Nym','Oro','Senn','Vaal','Iri','Kesh','Mo','Sael','Aun'];
  const CREATURE_B = ['vanee','mora','thir','lune','kesh','rill','dessa','nox','ari','moot','lyr','voss'];
  const WORLD_A = ['Amber','Umbral','Glass','Moss','Salt','Blue','Ash','Pearl','Iron','Violet','Hollow','Auric'];
  const WORLD_B = ['Steppe','Reef','Canopy','Basin','Spire','Hollow','Orbit','Fen','Cradle','Drift','Mantle','Cairn'];
  const ATTACK_A = ['Amber','Hollow','Glass','Quiet','Violet','Moss','Iron','Blue'];
  const ATTACK_B = ['Lunge','Cleave','Bloom','Snap','Arc','Rush','Pulse','Break'];
  function axesDefaults(list){ const out = {}; for (const a of list) out[a[0]] = a[3]; return out; }
  function labelsDefaults(list){ const out = {}; for (const a of list) out[a[0]] = a[2]; return out; }
  function normalizeAxes(input, list){
    const out = axesDefaults(list);
    const ids = list.map(a => a[0]);
    if (Array.isArray(input)) ids.forEach((id, i) => { if (i < input.length) out[id] = clampByte(input[i]); });
    else if (input && typeof input === 'object') ids.forEach(id => { if (Object.prototype.hasOwnProperty.call(input, id)) out[id] = clampByte(input[id]); });
    return out;
  }
  function axesArray(spec, list){ const axes = normalizeAxes(spec && (spec.axes || spec.vals), list); return list.map(a => axes[a[0]]); }
  function makeId(kind, seed){ return String(kind || 'eidolon').replace(/[^a-z0-9-]/gi,'-') + '-' + (Number(seed || 0) >>> 0).toString(16).padStart(8,'0'); }
  function nameCreature(seed, axes){ const a = Number(axes.eye_count || seed) >>> 0; const b = Number(axes.hue_primary || (seed >>> 8)) >>> 0; return CREATURE_A[a % CREATURE_A.length] + CREATURE_B[b % CREATURE_B.length]; }
  function nameWorld(seed, axes){ const a = Number(axes.sky_top_hue || seed) >>> 0; const b = Number(axes.ground_hue || (seed >>> 8)) >>> 0; return WORLD_A[a % WORLD_A.length] + ' ' + WORLD_B[b % WORLD_B.length]; }
  function nameAttack(seed, axes){ const a = Number(axes.attack_hue || seed) >>> 0; const b = Number(axes.lunge_distance || (seed >>> 8)) >>> 0; return ATTACK_A[a % ATTACK_A.length] + ' ' + ATTACK_B[b % ATTACK_B.length]; }
  function randomAxes(seed, list, locks, prev){ const r = mulberry32(seed); const out = {}; for (const a of list) { const id = a[0]; out[id] = locks && locks[id] && prev && prev[id] !== undefined ? clampByte(prev[id]) : Math.floor(r()*256); } return out; }
  function createSpec(kind, list, seed, nameFn){ seed = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : nextSeed(Date.now()); const axes = axesDefaults(list); const labels = labelsDefaults(list); const spec = { kind, version:1, id:makeId(kind.split('.').pop(), seed), name:'', seed, axes, labels, locked:{}, createdAt:now(), updatedAt:now() }; spec.name = nameFn(seed, axes); return spec; }
  function randomizeSpec(input, kind, list, nameFn, seed, locks){ const base = normalizeSpec(input, kind, list, nameFn); seed = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : nextSeed(base.seed + now()); const effectiveLocks = locks || base.locked || {}; const axes = randomAxes(seed, list, effectiveLocks, base.axes); const spec = Object.assign({}, base, { seed, axes, updatedAt:now(), locked:Object.assign({}, effectiveLocks) }); spec.id = makeId(kind.split('.').pop(), seed); spec.name = nameFn(seed, axes); return spec; }
  function normalizeSpec(input, kind, list, nameFn){ const seed = Number(input && input.seed) >>> 0; const axes = normalizeAxes(input && (input.axes || input.vals || input.payload && (input.payload.axes || input.payload.vals)), list); const labels = Object.assign(labelsDefaults(list), (input && input.labels) || {}); const locked = Object.assign({}, (input && input.locked) || {}); const spec = { kind, version:1, id:String((input && input.id) || makeId(kind.split('.').pop(), seed)), name:String((input && input.name) || nameFn(seed, axes)), seed, axes, labels, locked, createdAt:Number(input && input.createdAt) || now(), updatedAt:Number(input && input.updatedAt) || now() };
    if (input && input.thumbnail) spec.thumbnail = String(input.thumbnail);
    return spec;
  }
  function createDefaultCreatureSpec(seed){ return createSpec('eidolon.creature', CREATURE_AXES, seed, nameCreature); }
  function createDefaultEnvironmentSpec(seed){ return createSpec('eidolon.environment', ENVIRONMENT_AXES, seed, nameWorld); }
  function createDefaultAttackSpec(seed){ return createSpec('eidolon.attack', BATTLE_AXES, seed, nameAttack); }
  function randomizeCreatureSpec(seed, locks, prev){ return randomizeSpec(prev || createDefaultCreatureSpec(seed), 'eidolon.creature', CREATURE_AXES, nameCreature, seed, locks); }
  function randomizeEnvironmentSpec(seed, locks, prev){ return randomizeSpec(prev || createDefaultEnvironmentSpec(seed), 'eidolon.environment', ENVIRONMENT_AXES, nameWorld, seed, locks); }
  function randomizeAttackSpec(seed, locks, prev){ return randomizeSpec(prev || createDefaultAttackSpec(seed), 'eidolon.attack', BATTLE_AXES, nameAttack, seed, locks); }
  function normalizeCreatureSpec(input){ return normalizeSpec(input, 'eidolon.creature', CREATURE_AXES, nameCreature); }
  function normalizeEnvironmentSpec(input){ return normalizeSpec(input, 'eidolon.environment', ENVIRONMENT_AXES, nameWorld); }
  function normalizeAttackSpec(input){ return normalizeSpec(input, 'eidolon.attack', BATTLE_AXES, nameAttack); }
  function normalizeEidolonSpec(input){ const k = String((input && (input.kind || input.type || input.format || input.subFormat)) || '').toLowerCase(); if (k.includes('environment') || k === 'world') return normalizeEnvironmentSpec(input); if (k.includes('attack') || k.includes('battle')) return normalizeAttackSpec(input); return normalizeCreatureSpec(input); }
  function groupAxes(list){ const groups = []; const seen = {}; for (const a of list) { if (!seen[a[1]]) { seen[a[1]] = { name:a[1], axes:[] }; groups.push(seen[a[1]]); } seen[a[1]].axes.push({ id:a[0], group:a[1], label:a[2], default:a[3] }); } return groups; }
  const api = { CREATURE_AXES, ENVIRONMENT_AXES, BATTLE_AXES, groupAxes, mulberry32, axesArray, normalizeAxes, createDefaultCreatureSpec, createDefaultEnvironmentSpec, createDefaultAttackSpec, randomizeCreatureSpec, randomizeEnvironmentSpec, randomizeAttackSpec, normalizeCreatureSpec, normalizeEnvironmentSpec, normalizeAttackSpec, normalizeEidolonSpec };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NexusEidolonSchema = api;
})(typeof window !== 'undefined' ? window : globalThis);
