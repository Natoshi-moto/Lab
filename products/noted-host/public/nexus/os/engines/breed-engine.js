/* Nexus Breed Engine v1 — deterministic sexual recombination.
   Classic script + CommonJS export. No Math.random. */
(function(global){
  'use strict';

  function toBytes(input, size) {
    if (input instanceof Uint8Array) return Array.from(input).slice(0, size || input.length);
    if (Array.isArray(input)) return input.map(n => clampByte(n)).slice(0, size || input.length);
    const s = String(input || '');
    const hex = s.replace(/^sha256:/, '').replace(/^0x/, '');
    if (/^[0-9a-f]+$/i.test(hex) && hex.length >= 2) {
      const out = [];
      for (let i = 0; i < hex.length - 1; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
      return out.slice(0, size || out.length);
    }
    return Array.from(new TextEncoder().encode(s)).slice(0, size || s.length);
  }
  function normalizeDna(dna) {
    const b = toBytes(dna, 16);
    while (b.length < 16) b.push(0);
    return b.slice(0, 16).map(clampByte);
  }
  function normalizeHues(hues) {
    const h = Array.isArray(hues) || hues instanceof Uint8Array ? Array.from(hues) : [];
    while (h.length < 4) h.push(0);
    return h.slice(0, 4).map(n => wrapHue(Number(n) || 0));
  }
  function clampByte(n) { return Math.max(0, Math.min(255, Math.round(Number(n) || 0))); }
  function wrapHue(n) { n = Number(n) || 0; return ((n % 360) + 360) % 360; }
  function mixHue(a, b, wa) {
    const ar = wrapHue(a) * Math.PI / 180;
    const br = wrapHue(b) * Math.PI / 180;
    const wb = 1 - wa;
    const x = Math.cos(ar) * wa + Math.cos(br) * wb;
    const y = Math.sin(ar) * wa + Math.sin(br) * wb;
    return Math.round(wrapHue(Math.atan2(y, x) * 180 / Math.PI));
  }
  function seedState(seed) {
    const bytes = toBytes(seed);
    let h = 2166136261 >>> 0;
    for (const b of bytes) { h ^= b; h = Math.imul(h, 16777619) >>> 0; }
    if (h === 0) h = 0x9e3779b9;
    return h >>> 0;
  }
  function prng(seed) {
    let x = seedState(seed);
    return function next() {
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17; x >>>= 0;
      x ^= x << 5; x >>>= 0;
      return (x >>> 0) / 4294967296;
    };
  }
  function sexualBreed({dnaA, dnaB, huesA, huesB, jointSeed} = {}) {
    const a = normalizeDna(dnaA);
    const b = normalizeDna(dnaB);
    const ha = normalizeHues(huesA);
    const hb = normalizeHues(huesB);
    const rnd = prng(jointSeed || '');
    const twinDna = [];
    for (let i = 0; i < 16; i++) {
      let v = rnd() < 0.5 ? a[i] : b[i];
      if (rnd() < (1 / 32)) {
        const delta = Math.floor(rnd() * 5) - 2;
        v = clampByte(v + (delta === 0 ? 1 : delta));
      }
      twinDna.push(v);
    }
    const twin1Hues = [];
    const twin2Hues = [];
    for (let i = 0; i < 4; i++) {
      const jitter1 = (rnd() - 0.5) * 4;
      const jitter2 = (rnd() - 0.5) * 4;
      twin1Hues.push(wrapHue(mixHue(ha[i], hb[i], 0.60) + jitter1));
      twin2Hues.push(wrapHue(mixHue(ha[i], hb[i], 0.40) + jitter2));
    }
    return {
      twin1: { dna: twinDna.slice(), hues: twin1Hues.map(n => Math.round(n)) },
      twin2: { dna: twinDna.slice(), hues: twin2Hues.map(n => Math.round(n)) }
    };
  }

  const api = { sexualBreed, _test: { normalizeDna, normalizeHues, prng } };
  global.NexusBreedEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
