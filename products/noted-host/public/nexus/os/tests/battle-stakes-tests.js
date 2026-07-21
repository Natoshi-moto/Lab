#!/usr/bin/env node
'use strict';
const assert = require('assert');
const battle = require('../engines/battle-protocol.js');
const engine = require('../engines/battle-engine.js');
let pass=0, fail=0;
async function test(name, fn){ try{ await fn(); pass++; console.log('PASS battle-stakes '+name); } catch(e){ fail++; console.error('FAIL battle-stakes '+name+' — '+e.message); } }
const A={id:'a',content_hash:'sha256:a',payload:{dna:Array(16).fill(130)}};
const B={id:'b',content_hash:'sha256:b',payload:{dna:Array(16).fill(140)}};
function bus(){ const msgs=[],waiters=[]; return {broadcast:async m=>{msgs.push(m); for(const w of waiters.slice()){ if(w.pred(m)){clearTimeout(w.timer); waiters.splice(waiters.indexOf(w),1); w.resolve(m);}}}, awaitMessages:(pred,{timeout=200}={})=>{const f=msgs.find(pred); if(f)return Promise.resolve(f); return new Promise((resolve,reject)=>{const slot={pred,resolve,timer:setTimeout(()=>reject(new Error('timeout')),timeout)}; waiters.push(slot);});}}; }
function signer(pub){ return {sign:async m=>Object.assign({},m,{pubkey:pub,sig:'sig'}), verify:async(m,p)=>m.pubkey===p}; }
async function two(){ const t=bus(), a=signer('A'), b=signer('B'); return Promise.all([battle.startBattle({myEidolon:A,partnerPubkey:'B',partnerEidolon:B,charter:{engine_hash:engine.ENGINE_HASH},ranked:true,walletLock:async()=>({id:'lockA'}),partnerLock:{id:'lockB'},sign:a.sign,verify:a.verify,broadcast:t.broadcast,awaitMessages:t.awaitMessages}), battle.startBattle({myEidolon:B,partnerPubkey:'A',partnerEidolon:A,charter:{engine_hash:engine.ENGINE_HASH},ranked:true,walletLock:async()=>({id:'lockB'}),partnerLock:{id:'lockA'},sign:b.sign,verify:b.verify,broadcast:t.broadcast,awaitMessages:t.awaitMessages})]); }
(async()=>{
await test('ranked start requires wallet lock', async()=>{ let ok=false; try{ await battle.startBattle({myEidolon:A,partnerPubkey:'B',partnerEidolon:B,charter:{engine_hash:engine.ENGINE_HASH},ranked:true,broadcast:async()=>{},awaitMessages:async()=>{}});}catch(e){ok=/walletLock/.test(e.message);} assert(ok); });
await test('ranked result carries locks', async()=>{ const [s]=await two(); const rc=await s.resultContent(); assert(rc.ranked && (rc.lock_a||rc.lock_b)); });
await test('ranked transcript seed notes ranked', async()=>{ const [s]=await two(); assert(s.transcript[0].ranked); });
await test('partner lock verify can reject', async()=>{ let ok=false; try{ await battle.startBattle({myEidolon:A,partnerPubkey:'B',partnerEidolon:B,charter:{engine_hash:engine.ENGINE_HASH},ranked:true,walletLock:async()=>({id:'a'}),partnerLock:{id:'b'},walletVerifyLock:async()=>false,broadcast:async()=>{},awaitMessages:async()=>{}});}catch(e){ok=/LOCK invalid/.test(e.message);} assert(ok); });
console.log(`BATTLE-STAKES SUMMARY pass=${pass} fail=${fail}`); process.exitCode=fail?1:0;
})();
