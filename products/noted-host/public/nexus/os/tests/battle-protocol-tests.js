#!/usr/bin/env node
'use strict';
const assert = require('assert');
const battle = require('../engines/battle-protocol.js');
const client = require('../engines/nexus-block-client.js');
const engine = require('../engines/battle-engine.js');
let pass=0, fail=0;
async function test(name, fn){ try{ await fn(); pass++; console.log('PASS battle-protocol '+name); } catch(e){ fail++; console.error('FAIL battle-protocol '+name+' — '+(e.reason||e.message)); } }
const dnaA=[201,140,200,180,170,120,110,220,130,150,160,190,200,180,210,170];
const dnaB=[99,230,190,80,240,210,200,180,220,131,90,199,140,222,135,144];
const A={id:'a',content_hash:'sha256:a',payload:{dna:dnaA,hues:[0,90,180]}};
const B={id:'b',content_hash:'sha256:b',payload:{dna:dnaB,hues:[20,140,260]}};
const charter={engine_hash:engine.ENGINE_HASH, id:'realm'};
function makeBus(){ const messages=[]; const waiters=[]; return {broadcast:async m=>{ messages.push(m); for(const w of waiters.slice()){ if(w.pred(m)){ clearTimeout(w.timer); waiters.splice(waiters.indexOf(w),1); w.resolve(m); } }}, awaitMessages:(pred,{timeout=100}={})=>{ const found=messages.find(pred); if(found) return Promise.resolve(found); return new Promise((resolve,reject)=>{ const slot={pred,resolve,reject,timer:null}; slot.timer=setTimeout(()=>{ const i=waiters.indexOf(slot); if(i>=0) waiters.splice(i,1); reject(Object.assign(new Error('timeout'),{reason:'timeout'}));},timeout); waiters.push(slot); }); } }; }
function signer(pub){ return { sign: async msg => Object.assign({}, msg, {pubkey:pub, sig:'sig:'+pub+':'+msg.type+':'+(msg.turn||'')}), verify: async (msg,pubkey)=> msg && msg.pubkey===pubkey && String(msg.sig||'').startsWith('sig:'+pubkey+':') }; }
async function makeSessions(){ const bus=makeBus(), sa=signer('A'), sb=signer('B'); const [sA,sB]=await Promise.all([ battle.startBattle({myEidolon:A,partnerPubkey:'B',partnerEidolon:B,charter,sign:sa.sign,verify:sa.verify,broadcast:bus.broadcast,awaitMessages:bus.awaitMessages,timeout:500}), battle.startBattle({myEidolon:B,partnerPubkey:'A',partnerEidolon:A,charter,sign:sb.sign,verify:sb.verify,broadcast:bus.broadcast,awaitMessages:bus.awaitMessages,timeout:500}) ]); return {sA,sB,bus}; }
(async()=>{
await test('full mock battle two parties same transcript hash', async()=>{ const {sA,sB}=await makeSessions(); for(let i=0;i<4;i++) await Promise.all([sA.submitMove(i%4), sB.submitMove((i+1)%4)]); const ra=await sA.resultContent(), rb=await sB.resultContent(); assert.strictEqual(ra.transcript_hash, rb.transcript_hash); });
await test('startBattle no seed commit times out', async()=>{ const bus=makeBus(), sa=signer('A'); let reason=''; try{ await battle.startBattle({myEidolon:A,partnerPubkey:'B',partnerEidolon:B,charter,sign:sa.sign,verify:sa.verify,broadcast:bus.broadcast,awaitMessages:bus.awaitMessages,timeout:20}); }catch(e){ reason=e.reason; } assert.strictEqual(reason,'partner_no_commit'); });
await test('turn no commit forfeits', async()=>{ const {sA}=await makeSessions(); const r=await sA.submitMove(0); assert.strictEqual(r.reason,'partner_no_commit'); });
await test('commit hash is deterministic', async()=>{ assert.strictEqual(await battle._commitForMove(1,'salt','battle',2), await battle._commitForMove(1,'salt','battle',2)); });
await test('invalid charter engine rejected', async()=>{ let ok=false; try{ await battle.startBattle({myEidolon:A,partnerPubkey:'B',partnerEidolon:B,charter:{engine_hash:'sha256:wrong'},sign:async m=>m,verify:async()=>true,broadcast:async()=>{},awaitMessages:async()=>{}}); }catch(e){ ok=/engine_hash/.test(e.message); } assert(ok); });
await test('equivocation proof construction', async()=>{ const p=client.equivocationProof({sig_a:{turn:1,move:0},sig_b:{turn:1,move:2},conflict_kind:'battle_reveal'}); assert.strictEqual(p.type,'equivocation_proof'); assert.strictEqual(p.conflict_kind,'battle_reveal'); });
await test('state hash stable', async()=>{ const x=await battle._stateHash({hp:1},{hp:2},1); const y=await battle._stateHash({hp:1},{hp:2},1); assert.strictEqual(x,y); });
console.log(`BATTLE-PROTOCOL SUMMARY pass=${pass} fail=${fail}`);
process.exitCode = fail ? 1 : 0;
})();
