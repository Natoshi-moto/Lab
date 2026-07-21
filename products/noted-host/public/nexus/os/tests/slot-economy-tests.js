#!/usr/bin/env node
'use strict';
const assert = require('assert');
let pass=0, fail=0;
function test(name, fn){ try{ fn(); pass++; console.log('PASS slot '+name); } catch(e){ fail++; console.error('FAIL slot '+name+' — '+e.message); } }
function ensureSlots(env){ env.payload=env.payload||{}; env.payload.slots=env.payload.slots||{total:3,consumed:[]}; return env; }
function remaining(env){ ensureSlots(env); return env.payload.slots.total-env.payload.slots.consumed.length; }
function consume(env,id,type){ ensureSlots(env); if(remaining(env)<=0) return false; env.payload.slots.consumed.push({id,type,ts:1}); return true; }
test('birth has three slots', ()=>{ const e=ensureSlots({payload:{}}); assert.strictEqual(remaining(e),3); });
test('consume decrements', ()=>{ const e=ensureSlots({payload:{}}); consume(e,'b','battle'); assert.strictEqual(remaining(e),2); });
test('spent gate after three', ()=>{ const e=ensureSlots({payload:{}}); consume(e,'a'); consume(e,'b'); consume(e,'c'); assert.strictEqual(remaining(e),0); assert.strictEqual(consume(e,'d'),false); });
test('consumption records reason', ()=>{ const e=ensureSlots({payload:{}}); consume(e,'i','imprint'); assert.strictEqual(e.payload.slots.consumed[0].type,'imprint'); });
console.log(`SLOT SUMMARY pass=${pass} fail=${fail}`); process.exitCode=fail?1:0;
