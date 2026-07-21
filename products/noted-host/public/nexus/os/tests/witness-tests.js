#!/usr/bin/env node
'use strict';
const assert = require('assert');
const witness = require('../engines/witness-selection.js');
let pass=0, fail=0;
function test(name, fn){ try{ fn(); pass++; console.log('PASS witness '+name); } catch(e){ fail++; console.error('FAIL witness '+name+' — '+e.message); } }
test('selection deterministic', ()=>{ const a=witness.selectWitnesses({battle_id:'b',candidate_pubkeys:['c','a','b','d','e','f'],n:5}); const b=witness.selectWitnesses({battle_id:'b',candidate_pubkeys:['f','e','d','c','b','a'],n:5}); assert.deepStrictEqual(a,b); });
test('selection requires quorum-sized pool', ()=>{ assert.deepStrictEqual(witness.selectWitnesses({battle_id:'b',candidate_pubkeys:['a','b'],n:5,m:3}), []); });
test('quorum accepts three', ()=>{ assert(witness.verifyWitnessQuorum({selected_witnesses:['a','b','c'], witnesses:[{pubkey:'a',sig:'s'},{pubkey:'b',sig:'s'},{pubkey:'c',sig:'s'}]},3)); });
test('quorum rejects duplicates', ()=>{ assert(!witness.verifyWitnessQuorum({selected_witnesses:['a','b','c'], witnesses:[{pubkey:'a',sig:'s'},{pubkey:'a',sig:'s2'},{pubkey:'b',sig:'s'}]},3)); });
test('advertisement shape', ()=>{ const ad=witness.witnessAdvertisement({pubkey:'p',realm:'r'}); assert.strictEqual(ad.kind,30450); assert(ad.tags.some(t=>t[0]==='realm'&&t[1]==='r')); });
console.log(`WITNESS SUMMARY pass=${pass} fail=${fail}`); process.exitCode=fail?1:0;
