#!/usr/bin/env node
'use strict';
const assert = require('assert');
const engine = require('../engines/battle-engine.js');
let pass=0, fail=0;
function test(name, fn){ try{ fn(); pass++; console.log('PASS battle-engine '+name); } catch(e){ fail++; console.error('FAIL battle-engine '+name+' — '+e.message); } }
const dnaA=[201,140,200,180,170,120,110,220,130,150,160,190,200,180,210,170];
const dnaB=[99,230,190,80,240,210,200,180,220,131,90,199,140,222,135,144];
test('deriveStats deterministic',()=>{ assert.deepStrictEqual(engine.deriveStats(dnaA), engine.deriveStats(dnaA)); });
test('deriveMoves idempotent and max 4',()=>{ const a=engine.deriveMoves(dnaA), b=engine.deriveMoves(dnaA); assert.deepStrictEqual(a,b); assert.strictEqual(a.length,4); });
test('deriveTypes deterministic 1-2 known types',()=>{ const t=engine.deriveTypes(dnaA); assert(t.length>=1 && t.length<=2); t.forEach(x=>assert(engine.TYPE_NAMES.includes(x))); });
test('type matrix each type beats exactly 2',()=>{ for(const t of engine.TYPE_NAMES){ assert.strictEqual((engine.TYPE_MATRIX[t]||[]).length,2,t); } });

test('PHANTIVEX stats mapping exact',()=>{ assert.deepStrictEqual(engine.deriveStats([0,0,255,255,128,64,32,255,1,2,3,4,5,6,7,8]), {maxHp:105, atk:75, def:33, spAtk:47, spDef:26, spd:75}); });
test('PHANTIVEX moves strict threshold sort and base padding',()=>{ const dna=[129,128,200,0,0,0,0,0,0,0,0,0,0,0,0,0]; const moves=engine.deriveMoves(dna); assert.deepStrictEqual(moves.map(m=>m.name), ['SWARM RUSH','VENOM STING','PULSE','STRIKE']); assert(!('type' in moves[0]), 'donor moves do not store explicit type'); });
test('PHANTIVEX default and secondary type derivation exact',()=>{ assert.deepStrictEqual(engine.deriveTypes(new Array(16).fill(0)), ['SPECTRAL']); assert.deepStrictEqual(engine.deriveTypes([200,190,0,0,0,0,0,0,0,0,0,0,0,0,0,0]), ['TOXIC','SPECTRAL']); assert.deepStrictEqual(engine.deriveTypes([200,0,0,0,0,0,0,0,0,0,0,0,0,180,0,0]), ['TOXIC']); });
test('PHANTIVEX effectiveness has no resistance floor',()=>{ assert.strictEqual(engine.effectiveness('TOXIC',['ANCIENT','WILD']), 4); assert.strictEqual(engine.effectiveness('TOXIC',['VOID']), 1); });
test('PHANTIVEX stage multiplier table exact',()=>{ assert.deepStrictEqual(engine.STAGE_MULTS, [.25,.28,.33,.4,.5,.67,1,1.5,2,2.5,3,3.5,4]); });
test('resolveTurn deterministic for same seed',()=>{ const init=engine.initBattle({eidolonA:{payload:{dna:dnaA,hues:[1,2,3]}}, eidolonB:{payload:{dna:dnaB,hues:[4,5,6]}}, battleSeed:'s'}); const r1=engine.resolveTurn({stateA:init.stateA,stateB:init.stateB,moveA:0,moveB:1,turnSeed:'turn'}); const r2=engine.resolveTurn({stateA:init.stateA,stateB:init.stateB,moveA:0,moveB:1,turnSeed:'turn'}); assert.deepStrictEqual(r1,r2); });
test('1000 mock turns no drift',()=>{ let a=engine.initBattle({eidolonA:{payload:{dna:dnaA}}, eidolonB:{payload:{dna:dnaB}}, battleSeed:'x'}); let b=engine.initBattle({eidolonA:{payload:{dna:dnaA}}, eidolonB:{payload:{dna:dnaB}}, battleSeed:'x'}); for(let i=0;i<1000;i++){ const r1=engine.resolveTurn({stateA:a.stateA,stateB:a.stateB,moveA:i%4,moveB:(i+1)%4,turnSeed:'t'+i}); const r2=engine.resolveTurn({stateA:b.stateA,stateB:b.stateB,moveA:i%4,moveB:(i+1)%4,turnSeed:'t'+i}); assert.deepStrictEqual(r1,r2); a.stateA=r1.newStateA; a.stateB=r1.newStateB; b.stateA=r2.newStateA; b.stateB=r2.newStateB; } });
test('full battle replay deterministic transcript',()=>{ const r1=engine.replay({eidolonA:{payload:{dna:dnaA,hues:[1,2,3]}},eidolonB:{payload:{dna:dnaB,hues:[4,5,6]}},battleSeed:'battle'}); const r2=engine.replay({eidolonA:{payload:{dna:dnaA,hues:[1,2,3]}},eidolonB:{payload:{dna:dnaB,hues:[4,5,6]}},battleSeed:'battle'}); assert.deepStrictEqual(r1,r2); });
console.log(`BATTLE-ENGINE SUMMARY pass=${pass} fail=${fail}`);
process.exitCode = fail ? 1 : 0;
