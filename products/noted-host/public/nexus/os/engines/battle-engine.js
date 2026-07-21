/* Nexus Moot Battle Engine — eidolon-core-1
   Canonical platform extraction from PHANTIVEX battle surfaces.
   Pure JSON-in/JSON-out deterministic battle primitives. */
(function(root){
  'use strict';

  const ENGINE_VERSION = 'eidolon-core-1';
  const ENGINE_HASH = 'sha256:79cd0f7ce56120d4aee1aa6616e94c1adbda58d164ffd444e4201e2215ef65a9';
  const TYPE_NAMES = ['TOXIC','SPECTRAL','WILD','IRON','VOID','ANCIENT','LIGHT','SHADOW'];
  const TRAIT_NAMES = [
    'venomous','spectral','swarming','titanic','murky','resonant','vital','volatile',
    'ethereal','crystalline','feral','ancient','luminous','toxic','phantom','armored'
  ];
  const MOVE_TRAIT_THRESHOLD = 128;
  const MAX_MOVES = 4;
  const TYPE_MATRIX = {
    TOXIC:['ANCIENT','WILD'], SPECTRAL:['ANCIENT','VOID'], WILD:['IRON','VOID'],
    IRON:['SPECTRAL','LIGHT'], VOID:['LIGHT','SHADOW'], ANCIENT:['SHADOW','SPECTRAL'],
    LIGHT:['TOXIC','ANCIENT'], SHADOW:['VOID','TOXIC']
  };
  const TYPE_FROM_TRAIT = {
    venomous:'TOXIC', spectral:'SPECTRAL', swarming:'WILD', titanic:'IRON',
    murky:'VOID', resonant:'SPECTRAL', vital:'WILD', volatile:'IRON',
    ethereal:'VOID', crystalline:'IRON', feral:'WILD', ancient:'ANCIENT',
    luminous:'LIGHT', toxic:'TOXIC', phantom:'SHADOW', armored:'IRON'
  };
  const TRAIT_MOVES = {
    venomous:    {name:'VENOM STING',   power:35,  cat:'physical', acc:100, pp:15, effect:'poison'},
    spectral:    {name:'SPECTRAL RAY',  power:65,  cat:'special',  acc:90,  pp:10, effect:null},
    swarming:    {name:'SWARM RUSH',    power:22,  cat:'physical', acc:100, pp:20, effect:'multi'},
    titanic:     {name:'SEISMIC SLAM',  power:90,  cat:'physical', acc:80,  pp:5,  effect:null},
    murky:       {name:'MURK CLOUD',    power:0,   cat:'status',   acc:100, pp:15, effect:'acc-'},
    resonant:    {name:'RESONANCE',     power:55,  cat:'special',  acc:100, pp:10, effect:null},
    vital:       {name:'VITAL SURGE',   power:0,   cat:'status',   acc:100, pp:5,  effect:'heal+'},
    volatile:    {name:'DETONATION',    power:110, cat:'physical', acc:90,  pp:5,  effect:'recoil'},
    ethereal:    {name:'PHASE SLIP',    power:0,   cat:'status',   acc:100, pp:10, effect:'dodge'},
    crystalline: {name:'CRYSTAL LANCE', power:50,  cat:'special',  acc:100, pp:15, effect:null},
    feral:       {name:'FERAL CLAWS',   power:28,  cat:'physical', acc:100, pp:15, effect:'multi'},
    ancient:     {name:'ANCIENT POWER', power:60,  cat:'special',  acc:100, pp:10, effect:'boost'},
    luminous:    {name:'FLASH BURST',   power:40,  cat:'special',  acc:100, pp:15, effect:'acc-'},
    toxic:       {name:'ACID STREAM',   power:50,  cat:'special',  acc:100, pp:15, effect:'burn'},
    phantom:     {name:'PHANTOM CLAW',  power:70,  cat:'physical', acc:95,  pp:10, effect:null},
    armored:     {name:'IRON WALL',     power:0,   cat:'status',   acc:100, pp:10, effect:'def+'}
  };
  const BASE_MOVES = [
    {name:'PULSE',  power:40, cat:'special',  acc:100, pp:20, effect:null},
    {name:'STRIKE', power:45, cat:'physical', acc:95,  pp:20, effect:null},
    {name:'SHIELD', power:0,  cat:'status',   acc:100, pp:10, effect:'def+'},
    {name:'MEND',   power:0,  cat:'status',   acc:100, pp:10, effect:'heal'}
  ];
  const STAGE_MULTS = [.25,.28,.33,.4,.5,.67,1,1.5,2,2.5,3,3.5,4];
  const CONSTANTS = {ENGINE_VERSION, ENGINE_HASH, TYPE_NAMES, TRAIT_NAMES, TRAIT_MOVES, BASE_MOVES, TYPE_FROM_TRAIT, TYPE_MATRIX, MOVE_TRAIT_THRESHOLD, MAX_MOVES, STAGE_MULTS};

  function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
  function normDna(dna){
    if (typeof dna === 'string') {
      const clean = dna.replace(/^sha256:/,'').replace(/^0x/,'').replace(/[^0-9a-f]/gi,'');
      const out = [];
      for (let i=0; i<clean.length && out.length<16; i+=2) out.push(parseInt(clean.slice(i,i+2),16)||0);
      while(out.length<16) out.push(0);
      return out.slice(0,16);
    }
    const arr = Array.from(dna || []).slice(0,16).map(x => clamp(Number(x)||0,0,255));
    while(arr.length<16) arr.push(0);
    return arr;
  }
  function normHues(hues){
    const arr = Array.from(hues || []).slice(0,4).map(x => ((Number(x)||0)%360+360)%360);
    if (!arr.length) return [180,260,320];
    while(arr.length<3) arr.push((arr[arr.length-1]+120)%360);
    return arr;
  }
  function stable(v){
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k)+':'+stable(v[k])).join(',') + '}';
  }
  function fnv1a(str){ let h=2166136261>>>0; for(let i=0;i<String(str).length;i++){ h^=String(str).charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function mulberry32(seed){ let t=seed>>>0; return function(){ t=(t+0x6D2B79F5)>>>0; let r=t; r=Math.imul(r^(r>>>15), r|1); r^=r+Math.imul(r^(r>>>7), r|61); return ((r^(r>>>14))>>>0)/4294967296; }; }
  function rngFrom(seed){ return mulberry32(fnv1a(typeof seed === 'string' ? seed : stable(seed))); }
  function stageM(s){ return STAGE_MULTS[clamp((Number(s)||0)+6,0,12)]; }

  function deriveStats(dna){
    const d = normDna(dna);
    return {
      maxHp: 45 + Math.floor(d[7]/255*60),
      atk:   20 + Math.floor(d[3]/255*55),
      def:   20 + Math.floor(d[5]/255*55),
      spAtk: 20 + Math.floor(d[4]/255*55),
      spDef: 20 + Math.floor(d[6]/255*55),
      spd:   15 + Math.floor(d[2]/255*60)
    };
  }
  function expressedTraits(dna){
    const d = normDna(dna);
    return TRAIT_NAMES.map((name,i)=>({name, val:d[i]})).filter(t=>t.val>MOVE_TRAIT_THRESHOLD).sort((a,b)=>b.val-a.val || TRAIT_NAMES.indexOf(a.name)-TRAIT_NAMES.indexOf(b.name));
  }
  function deriveMoves(dna){
    const moves = expressedTraits(dna).slice(0,MAX_MOVES).map(t => Object.assign({}, TRAIT_MOVES[t.name]));
    let bi=0;
    while(moves.length<MAX_MOVES) moves.push(Object.assign({}, BASE_MOVES[bi++]));
    return moves;
  }
  function deriveTypes(dna){
    const exp = expressedTraits(dna);
    const p = exp.length ? TYPE_FROM_TRAIT[exp[0].name] : 'SPECTRAL';
    const s = exp.length > 1 ? TYPE_FROM_TRAIT[exp[1].name] : null;
    return (s && s !== p) ? [p,s] : [p];
  }
  function effectiveness(attackerType, defenderTypes){
    let m = 1;
    for (const t of (defenderTypes || [])) if ((TYPE_MATRIX[attackerType] || []).includes(t)) m *= 2;
    return m;
  }
  function makeName(dna){
    const d=normDna(dna), P=['PHAN','VEX','AETH','KRON','LUMI','ETH','ARC','SPEC','ZYN','NETH','GLYPH','OMNI'], M=['TI','LA','VO','RU','NI','KA','MO','EL','SI','RA','PHI','SU'], S=['EX','ON','IX','AR','UM','AN','OX','IS','OR','EN','AX','UR'];
    return P[d[0]%P.length]+M[d[1]%M.length]+S[d[2]%S.length];
  }
  function initFighter(eidolon, side){
    const payload = eidolon && eidolon.payload ? eidolon.payload : (eidolon || {});
    const dna = normDna(payload.dna || eidolon.dna);
    const hues = normHues(payload.hues || eidolon.hues);
    const base = deriveStats(dna);
    return {
      side, id: eidolon.id || payload.id || side, name: eidolon.name || payload.name || makeName(dna),
      dna, hues, types: deriveTypes(dna), moves: deriveMoves(dna),
      maxHp: base.maxHp, hp: base.maxHp,
      base,
      atkSt:0, defSt:0, spASt:0, spDSt:0, spdSt:0,
      status:null, dodging:false, accDown:false, turn:0
    };
  }
  function initBattle({eidolonA, eidolonB, battleSeed} = {}){
    return {stateA:initFighter(eidolonA||{}, 'A'), stateB:initFighter(eidolonB||{}, 'B'), battleSeed:String(battleSeed||'')};
  }
  function cloneState(s){ return JSON.parse(JSON.stringify(s)); }
  function calcDamage(attacker, defender, move, rng, isCrit){
    if (!move || move.power === 0) return 0;
    const isPhys = move.cat === 'physical';
    const atk = attacker.base[isPhys?'atk':'spAtk'] * stageM(isPhys ? attacker.atkSt : attacker.spASt);
    const def = defender.base[isPhys?'def':'spDef'] * stageM(isPhys ? defender.defSt : defender.spDSt);
    const eff = effectiveness(attacker.types[0], defender.types);
    const rand = 0.85 + rng()*0.15;
    const critMult = isCrit ? 1.5 : 1;
    const raw = Math.floor((atk/Math.max(1,def)*move.power/50 + 2) * rand * eff * critMult);
    return Math.max(1, raw);
  }
  function event(events, msg, extra){ events.push(Object.assign({msg}, extra||{})); }
  function applyMove(attacker, defender, move, rng, events){
    move = move || attacker.moves[0];
    event(events, `${attacker.name} used ${move.name}.`, {kind:'move', actor:attacker.side, move:move.name});
    if (defender.dodging) { defender.dodging=false; event(events, `${defender.name} phased through it.`, {kind:'miss', reason:'dodge'}); return; }
    if (defender.accDown && rng() < 0.3) { event(events, `${attacker.name} missed through glare.`, {kind:'miss', reason:'accDown'}); return; }
    defender.dodging = false;
    if (rng()*100 > (move.acc == null ? 100 : move.acc)) { event(events, `${attacker.name} missed.`, {kind:'miss', reason:'accuracy'}); return; }
    const dmg = calcDamage(attacker, defender, move, rng, false);
    if (dmg > 0) {
      defender.hp = clamp(defender.hp - dmg, 0, defender.maxHp);
      event(events, `${defender.name} took ${dmg} damage.`, {kind:'damage', amount:dmg, target:defender.side, effectiveness:effectiveness(attacker.types[0], defender.types)});
    }
    switch(move.effect){
      case 'poison': if(!defender.status && rng()<0.4){ defender.status='poison'; event(events, `${defender.name} is poisoned.`, {kind:'status', status:'poison'}); } break;
      case 'burn': if(!defender.status && rng()<0.3){ defender.status='burn'; event(events, `${defender.name} is burned.`, {kind:'status', status:'burn'}); } break;
      case 'multi': event(events, `Hit again indicator.`, {kind:'multi'}); break;
      case 'recoil': { const r=Math.floor(dmg*0.33); attacker.hp=clamp(attacker.hp-r,0,attacker.maxHp); event(events, `${attacker.name} took ${r} recoil.`, {kind:'recoil', amount:r}); } break;
      case 'heal+': { const h=Math.floor(attacker.maxHp*0.4); attacker.hp=clamp(attacker.hp+h,0,attacker.maxHp); event(events, `${attacker.name} restored ${h} HP.`, {kind:'heal', amount:h}); } break;
      case 'heal': { const h=Math.floor(attacker.maxHp*0.25); attacker.hp=clamp(attacker.hp+h,0,attacker.maxHp); event(events, `${attacker.name} recovered ${h} HP.`, {kind:'heal', amount:h}); } break;
      case 'acc-': defender.accDown=true; event(events, `${defender.name}'s accuracy fell.`, {kind:'stage', stat:'accuracy'}); break;
      case 'dodge': attacker.dodging=true; event(events, `${attacker.name} phased out.`, {kind:'dodge'}); break;
      case 'def+': attacker.defSt=clamp(attacker.defSt+2,-6,6); event(events, `${attacker.name}'s defense rose.`, {kind:'stage', stat:'defense'}); break;
      case 'boost': if(rng()<0.1){ attacker.atkSt=clamp(attacker.atkSt+1,-6,6); attacker.defSt=clamp(attacker.defSt+1,-6,6); attacker.spASt=clamp(attacker.spASt+1,-6,6); event(events, `${attacker.name} is boosted.`, {kind:'stage', stat:'boost'}); } break;
    }
  }
  function statusTick(s, events){
    if (s.status === 'poison') { const dmg=Math.floor(s.maxHp*0.1); s.hp=clamp(s.hp-dmg,0,s.maxHp); event(events, `${s.name} is hurt by poison.`, {kind:'status_tick', status:'poison', amount:dmg, target:s.side}); }
    if (s.status === 'burn') { const dmg=Math.floor(s.maxHp*0.06); s.hp=clamp(s.hp-dmg,0,s.maxHp); event(events, `${s.name} is hurt by burn.`, {kind:'status_tick', status:'burn', amount:dmg, target:s.side}); }
  }
  function resolveTurn({stateA, stateB, moveA, moveB, turnSeed} = {}){
    const a = cloneState(stateA), b = cloneState(stateB);
    const eventsA = [], eventsB = [];
    a.turn = (a.turn||0) + 1; b.turn = (b.turn||0) + 1;
    const rng = rngFrom(turnSeed || `${a.id}:${b.id}:${a.turn}`);
    const ma = typeof moveA === 'number' ? a.moves[clamp(moveA,0,a.moves.length-1)] : (moveA || a.moves[0]);
    const mb = typeof moveB === 'number' ? b.moves[clamp(moveB,0,b.moves.length-1)] : (moveB || b.moves[0]);
    const spA = a.base.spd * stageM(a.spdSt), spB = b.base.spd * stageM(b.spdSt);
    const aFirst = spA === spB ? true : spA > spB;
    const first = aFirst ? {att:a,def:b,move:ma,events:eventsA} : {att:b,def:a,move:mb,events:eventsB};
    const second = aFirst ? {att:b,def:a,move:mb,events:eventsB} : {att:a,def:b,move:ma,events:eventsA};
    applyMove(first.att, first.def, first.move, rng, first.events);
    if (second.att.hp > 0 && second.def.hp > 0) applyMove(second.att, second.def, second.move, rng, second.events);
    statusTick(a, eventsA); statusTick(b, eventsB);
    return {newStateA:a, newStateB:b, eventsA, eventsB};
  }
  function isOver({stateA, stateB} = {}){
    const a = stateA && stateA.hp <= 0, b = stateB && stateB.hp <= 0;
    if (a && b) return stateA.hp >= stateB.hp ? 'A' : 'B';
    if (a) return 'B';
    if (b) return 'A';
    return null;
  }
  function replay({eidolonA, eidolonB, battleSeed, movesA, movesB, maxTurns=80} = {}){
    let {stateA, stateB} = initBattle({eidolonA,eidolonB,battleSeed});
    const transcript = [];
    for(let turn=0; turn<maxTurns && !isOver({stateA,stateB}); turn++){
      const moveA = Array.isArray(movesA) ? movesA[turn] : (turn % MAX_MOVES);
      const moveB = Array.isArray(movesB) ? movesB[turn] : ((turn+1) % MAX_MOVES);
      const r = resolveTurn({stateA,stateB,moveA,moveB,turnSeed:`${battleSeed}:turn:${turn}:${moveA}:${moveB}`});
      stateA=r.newStateA; stateB=r.newStateB;
      transcript.push({turn:turn+1, moveA, moveB, stateA:{hp:stateA.hp,status:stateA.status}, stateB:{hp:stateB.hp,status:stateB.status}, eventsA:r.eventsA, eventsB:r.eventsB});
    }
    return {stateA,stateB,winner:isOver({stateA,stateB}), transcript};
  }
  const api = {ENGINE_VERSION, ENGINE_HASH, TYPE_MATRIX, TYPE_NAMES, TRAIT_NAMES, TRAIT_MOVES, BASE_MOVES, TYPE_FROM_TRAIT, MOVE_TRAIT_THRESHOLD, MAX_MOVES, STAGE_MULTS, CONSTANTS, deriveStats, deriveMoves, deriveTypes, effectiveness, resolveTurn, isOver, initBattle, replay, _stable:stable, _stageM:stageM};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NexusBattleEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
