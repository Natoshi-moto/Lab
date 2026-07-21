#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { sexualBreed } = require('../engines/breed-engine.js');
let pass = 0, fail = 0;
function test(name, fn){ try{ fn(); pass++; console.log('PASS breed '+name); }catch(e){ fail++; console.error('FAIL breed '+name+' — '+e.message); } }
const input = { dnaA:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], dnaB:[201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216], huesA:[0,40,80,120], huesB:[180,220,260,300], jointSeed:'sha256:abc123' };
test('same inputs produce identical twins', () => { assert.deepStrictEqual(sexualBreed(input), sexualBreed(input)); });
test('output has two twins with 16-byte DNA', () => { const r=sexualBreed(input); assert.strictEqual(r.twin1.dna.length,16); assert.strictEqual(r.twin2.dna.length,16); });
test('twins share DNA pattern and differ in hue bias', () => { const r=sexualBreed(input); assert.deepStrictEqual(r.twin1.dna,r.twin2.dna); assert.notDeepStrictEqual(r.twin1.hues,r.twin2.hues); });
test('different seed changes output', () => { const a=sexualBreed(input); const b=sexualBreed({...input,jointSeed:'sha256:def456'}); assert.notDeepStrictEqual(a,b); });
test('hex DNA inputs normalize deterministically', () => { const r=sexualBreed({dnaA:'000102030405060708090a0b0c0d0e0f',dnaB:'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff',huesA:[],huesB:[],jointSeed:'x'}); assert.strictEqual(r.twin1.dna.length,16); });
console.log(`BREED SUMMARY pass=${pass} fail=${fail}`);
process.exitCode = fail ? 1 : 0;
