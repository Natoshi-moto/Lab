/* Nexus Moot Battle Protocol — commit-reveal per turn, transport-neutral. */
(function(root){
  'use strict';

  const nodeCrypto = typeof require === 'function' ? (()=>{ try { return require('crypto'); } catch (_) { return null; } })() : null;
  const BattleEngine = root.NexusBattleEngine || (typeof require === 'function' ? require('./battle-engine.js') : null);
  const BlockClient = root.NexusBlockClient || (typeof require === 'function' ? require('./nexus-block-client.js') : null);
  const KINDS = { INTENT:30431, COMMIT:30432, REVEAL:30433, RESULT:30434 };

  function stable(v){
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k)+':'+stable(v[k])).join(',') + '}';
  }
  function bytesToHex(bytes){ return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join(''); }
  async function sha256Hex(data){
    const s = typeof data === 'string' ? data : stable(data);
    if (nodeCrypto) return nodeCrypto.createHash('sha256').update(s).digest('hex');
    const enc = new TextEncoder().encode(s);
    const d = await root.crypto.subtle.digest('SHA-256', enc);
    return bytesToHex(new Uint8Array(d));
  }
  function randomSalt(saltProvider){
    if (typeof saltProvider === 'function') {
      const supplied = saltProvider();
      if (supplied instanceof Uint8Array) return bytesToHex(supplied);
      const hex = String(supplied || '').replace(/^0x/, '').replace(/^sha256:/, '');
      if (/^[0-9a-f]{64}$/i.test(hex)) return hex.toLowerCase();
      throw new Error('invalid_salt_provider_output');
    }
    const b = new Uint8Array(32);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(b);
    else if (nodeCrypto) b.set(nodeCrypto.randomBytes(32));
    else throw new Error('crypto.getRandomValues required for battle salt');
    return bytesToHex(b);
  }
  function normalizeHash(x){ return String(x || '').startsWith('sha256:') ? String(x) : 'sha256:' + String(x || ''); }
  async function hashEidolon(e){
    if (!e) return 'sha256:' + await sha256Hex('null');
    return e.content_hash || e.content_addr || e.birthHash || e.id || ('sha256:' + await sha256Hex({dna:(e.payload&&e.payload.dna)||e.dna,hues:(e.payload&&e.payload.hues)||e.hues,name:e.name||''}));
  }
  async function signMsg(sign, msg){
    if (typeof sign !== 'function') return msg;
    const r = await sign(msg);
    if (r && typeof r === 'object') return Object.assign({}, msg, r);
    return Object.assign({}, msg, {sig:r});
  }
  function makeEmitter(){
    const map = new Map();
    return { on(ev, fn){ if(!map.has(ev)) map.set(ev,new Set()); map.get(ev).add(fn); return () => map.get(ev).delete(fn); }, emit(ev, data){ const set=map.get(ev); if(set) for(const fn of Array.from(set)) try{fn(data);}catch(e){setTimeout(()=>{throw e;},0);} } };
  }
  async function waitFor(awaitMessages, pred, opts){
    if (typeof awaitMessages !== 'function') throw Object.assign(new Error('awaitMessages required'), {reason:'await_messages_required'});
    return awaitMessages(pred, opts);
  }
  async function commitForMove(moveIndex, salt, battleId, turn){ return 'sha256:' + await sha256Hex({battleId, turn, moveIndex:Number(moveIndex), salt}); }
  async function stateHash(stateA, stateB, turn){ return 'sha256:' + await sha256Hex({turn, stateA, stateB}); }
  async function transcriptHash(transcript){ return 'sha256:' + await sha256Hex(transcript); }
  function assertConforms(e, charter){
    if (!BattleEngine) throw new Error('battle engine unavailable');
    const engineHash = charter && (charter.engine_hash || (charter.payload && charter.payload.engine_hash));
    if (engineHash && BattleEngine.ENGINE_HASH && engineHash !== BattleEngine.ENGINE_HASH) throw new Error('charter engine_hash mismatch');
    const p = e && e.payload ? e.payload : e;
    if (!p || !Array.isArray(p.dna) || p.dna.length < 16) throw new Error('eidolon missing 16-byte dna');
    return true;
  }

  async function startBattle({myEidolon, partnerPubkey, partnerEidolon, charter={}, sign, verify, broadcast, awaitMessages, timeout=15000, ranked=false, request_witnesses=false, selected_witnesses=[], walletLock, walletVerifyLock, partnerLock=null, saltProvider, timestampProvider} = {}){
    if (!partnerPubkey) throw new Error('partnerPubkey required');
    if (typeof broadcast !== 'function') throw new Error('broadcast required');
    if (typeof awaitMessages !== 'function') throw new Error('awaitMessages required');
    assertConforms(myEidolon, charter); assertConforms(partnerEidolon, charter);
    const myHash = await hashEidolon(myEidolon);
    const partnerHash = await hashEidolon(partnerEidolon);
    const ordered = [myHash, partnerHash].sort();
    const battle_id = 'battle_' + (await sha256Hex({ordered, charter:charter.id || charter.realm_id || charter.payload || charter, engine_hash:BattleEngine.ENGINE_HASH})).slice(0,24);
    const mySide = myHash <= partnerHash ? 'A' : 'B';
    const emitter = makeEmitter();
    let localLock = null, remoteLock = partnerLock || null;
    if (ranked) {
      if (typeof walletLock !== 'function') throw new Error('ranked battle requires walletLock');
      const terms_raw = `eidolon:slot:${myEidolon.id || myHash}:battle:${battle_id}`;
      localLock = await walletLock({battle_id, eidolon_id: myEidolon.id || myHash, eidolon_hash: myHash, terms_raw, side: mySide});
      if (!localLock || !(localLock.output_id || localLock.lock_id || localLock.id)) throw new Error('wallet LOCK failed');
      if (remoteLock && walletVerifyLock && !(await walletVerifyLock(remoteLock, {battle_id, partnerPubkey, partnerEidolon, partnerHash}))) throw new Error('partner LOCK invalid');
    }

    const seedCR = await BlockClient.commitReveal({
      contextTag: `${battle_id}:seed`, partnerPubkey, timeout,
      sign: msg => signMsg(sign, Object.assign({}, msg, {battle_id, kind:'battle_seed'})),
      verify,
      broadcast,
      awaitMessages,
      saltProvider,
      timestampProvider: timestampProvider || (() => Date.now())
    });
    const battleSeed = seedCR.jointSeed;
    const init = mySide === 'A'
      ? BattleEngine.initBattle({eidolonA:myEidolon, eidolonB:partnerEidolon, battleSeed})
      : BattleEngine.initBattle({eidolonA:partnerEidolon, eidolonB:myEidolon, battleSeed});
    let stateA = init.stateA, stateB = init.stateB, turn = 0, over = null;
    const transcript = [{kind:'battle_seed', battle_id, battleSeed, seedTranscript:seedCR.transcript, mySide, eidolon_a:ordered[0], eidolon_b:ordered[1], engine_hash:BattleEngine.ENGINE_HASH, ranked:!!ranked, lock_local:localLock, lock_partner:remoteLock, witnesses:selected_witnesses}];

    async function submitMove(moveIndex){
      if (over) return {turnResult:null, transcript, isOver:over};
      const localMoves = mySide === 'A' ? stateA.moves : stateB.moves;
      if (!Number.isInteger(Number(moveIndex)) || moveIndex < 0 || moveIndex >= localMoves.length) throw new Error('invalid move index');
      const nextTurn = turn + 1;
      const salt = randomSalt(saltProvider);
      const commit = await commitForMove(moveIndex, salt, battle_id, nextTurn);
      const myCommit = await signMsg(sign, {type:'battle_commit', battle_id, turn:nextTurn, commit, ts:Date.now()});
      await broadcast(myCommit); emitter.emit('partner_committed', {turn:nextTurn, local:true});
      let partnerCommit;
      try {
        partnerCommit = await waitFor(awaitMessages, m => m && m.type === 'battle_commit' && m.battle_id === battle_id && Number(m.turn) === nextTurn && m.pubkey === partnerPubkey, {timeout, phase:'battle_commit', battle_id, turn:nextTurn});
      } catch (e) { over = mySide === 'A' ? 'A' : 'B'; return {turnResult:null, transcript, isOver:over, reason:'partner_no_commit'}; }
      if (verify && !(await verify(partnerCommit, partnerPubkey))) throw Object.assign(new Error('partner_invalid_commit'), {reason:'partner_invalid_commit', evidence:partnerCommit});
      emitter.emit('partner_committed', {turn:nextTurn, local:false});

      const myReveal = await signMsg(sign, {type:'battle_reveal', battle_id, turn:nextTurn, moveIndex:Number(moveIndex), salt, commit, ts:Date.now()});
      await broadcast(myReveal);
      let partnerReveal;
      try {
        partnerReveal = await waitFor(awaitMessages, m => m && m.type === 'battle_reveal' && m.battle_id === battle_id && Number(m.turn) === nextTurn && m.pubkey === partnerPubkey, {timeout, phase:'battle_reveal', battle_id, turn:nextTurn});
      } catch (e) { over = mySide === 'A' ? 'A' : 'B'; return {turnResult:null, transcript, isOver:over, reason:'partner_no_reveal'}; }
      if (verify && !(await verify(partnerReveal, partnerPubkey))) throw Object.assign(new Error('partner_invalid_reveal_signature'), {reason:'partner_invalid_reveal_signature', evidence:partnerReveal});
      const expected = await commitForMove(partnerReveal.moveIndex, partnerReveal.salt, battle_id, nextTurn);
      if (expected !== partnerCommit.commit) throw Object.assign(new Error('partner_invalid_reveal'), {reason:'partner_invalid_reveal', evidence:{partnerCommit, partnerReveal}});
      const pair = [{salt, commit, moveIndex:Number(moveIndex)}, {salt:partnerReveal.salt, commit:partnerCommit.commit, moveIndex:Number(partnerReveal.moveIndex)}].sort((a,b)=>a.commit.localeCompare(b.commit));
      const turnSeed = 'sha256:' + await sha256Hex({battleSeed, turn:nextTurn, reveals:pair});
      const moveA = mySide === 'A' ? Number(moveIndex) : Number(partnerReveal.moveIndex);
      const moveB = mySide === 'A' ? Number(partnerReveal.moveIndex) : Number(moveIndex);
      const r = BattleEngine.resolveTurn({stateA, stateB, moveA, moveB, turnSeed});
      stateA = r.newStateA; stateB = r.newStateB; turn = nextTurn;
      over = BattleEngine.isOver({stateA,stateB});
      const sh = await stateHash(stateA, stateB, turn);
      const stateSig = await signMsg(sign, {type:'battle_state', battle_id, turn, state_hash:sh, ts:Date.now()});
      const turnResult = {turn, moveA, moveB, turnSeed, state_hash:sh, state_sig:stateSig, stateA, stateB, eventsA:r.eventsA, eventsB:r.eventsB, winner:over};
      transcript.push({kind:'turn', battle_id, turn, myCommit, partnerCommit, myReveal, partnerReveal, turnResult});
      emitter.emit('turn_resolved', turnResult);
      return {turnResult, transcript, isOver:over};
    }
    async function forfeit(){
      over = mySide === 'A' ? 'B' : 'A';
      const msg = await signMsg(sign, {type:'battle_forfeit', battle_id, turn, reason:'forfeit', ts:Date.now()});
      await broadcast(msg);
      transcript.push({kind:'forfeit', msg});
      return {transcript, reason:'forfeit'};
    }
    async function resultContent(){
      const publicTranscript = {
        battle_id, battleSeed, engine_hash:BattleEngine.ENGINE_HASH, eidolon_a:ordered[0], eidolon_b:ordered[1],
        turns: transcript.filter(x => x.kind === 'turn').map(x => ({turn:x.turn, moveA:x.turnResult.moveA, moveB:x.turnResult.moveB, turnSeed:x.turnResult.turnSeed, state_hash:x.turnResult.state_hash, winner:x.turnResult.winner || null}))
      };
      const lockId = x => x && (x.output_id || x.lock_id || x.id || (x.lock && x.lock.id)) || null;
      const lock_a = mySide === 'A' ? lockId(localLock) : lockId(remoteLock);
      const lock_b = mySide === 'B' ? lockId(localLock) : lockId(remoteLock);
      return {battle_id, engine_hash:BattleEngine.ENGINE_HASH, eidolon_a:ordered[0], eidolon_b:ordered[1], eidolon_a_hash:ordered[0], eidolon_b_hash:ordered[1], ranked:!!ranked, lock_a, lock_b, selected_witnesses, witnesses:[], winner:over, transcript_hash:await transcriptHash(publicTranscript), ts:Date.now()};
    }
    return {battle_id, battleSeed, mySide, get stateA(){return stateA;}, get stateB(){return stateB;}, get transcript(){return transcript;}, submitMove, forfeit, on:emitter.on, resultContent};
  }

  const api = {KINDS, startBattle, _stable:stable, _sha256Hex:sha256Hex, _commitForMove:commitForMove, _stateHash:stateHash, _randomSalt:randomSalt};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NexusBattleProtocol = api;
})(typeof window !== 'undefined' ? window : globalThis);
