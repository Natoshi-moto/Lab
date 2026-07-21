#!/usr/bin/env node
'use strict';
const assert = require('assert');
const gen = require('../engines/eidolon-generator.js');
let pass=0, fail=0;
async function test(name, fn){ try{ await fn(); pass++; console.log('PASS imprint '+name); } catch(e){ fail++; console.error('FAIL imprint '+name+' — '+e.message); } }
(async()=>{
  await test('descendant payload accumulates scar', async ()=>{ const p=await gen.descendantPayload({source:{id:'p',payload:{dna:Array(16).fill(1),hues:[1,2,3],scars:[]}},battle_id:'b'}); assert.strictEqual(p.scars.length,1); assert(p.lineage.includes('p')); });
  await test('generated html embeds creature-dna', async ()=>{ const html=await gen.generateEidolonHtml({dna:Array(16).fill(2),hues:[1,2,3],name:'X'}); assert(html.includes('id="creature-dna"')); assert(html.includes('canvas')); });
  await test('generated html bridges creature-dna JSON into GENE_DATA', async ()=>{
    const html=await gen.generateEidolonHtml({dna:Array(16).fill(3),hues:[4,5,6],name:'Bridge'});
    assert(html.includes("const GENE_DATA=JSON.parse(document.getElementById('creature-dna').textContent)"), 'GENE_DATA bridge missing');
    assert(html.indexOf('id="creature-dna"') < html.indexOf('const GENE_DATA=JSON.parse'), 'bridge appears before JSON writer');
  });
  await test('scar is deterministic data shape', async ()=>{ const s=gen.makeScar({battle_id:'b',position_seed:'x'}); assert.strictEqual(s.battle_id,'b'); assert.strictEqual(s.style,'fracture'); });
  await test('normalizes short dna without throwing', async ()=>{ const html=await gen.generateEidolonHtml({dna:[1,2],hues:[1],name:'Y'}); assert(html.includes('creature-dna')); });
  await test('same parent battle scars produce same imprint nonce and html bytes', async ()=>{
    const source={id:'p',createdAt:'2026-01-01T00:00:00.000Z',content_hash:'sha256:parent',payload:{dna:Array(16).fill(4),hues:[10,20,30],scars:[]}};
    const a=await gen.descendantPayload({source,battle_id:'battle_same',name:'Same'});
    const b=await gen.descendantPayload({source,battle_id:'battle_same',name:'Same'});
    assert.strictEqual(a.nonce,b.nonce);
    const ha=await gen.generateEidolonHtml(a);
    const hb=await gen.generateEidolonHtml(b);
    assert.strictEqual(ha,hb);
  });
  await test('makeScar fails closed without battle_id or position_seed', async ()=>{ assert.throws(()=>gen.makeScar({}), /battle_id_or_position_seed_required/); });
  console.log(`IMPRINT SUMMARY pass=${pass} fail=${fail}`); process.exitCode=fail?1:0;
})();
