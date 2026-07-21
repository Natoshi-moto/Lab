/**
 * substrate.js — Nexus Moot deterministic world substrate
 *
 * Load-bearing invariant. Any witness produced against a world must
 * use this exact implementation. Do not modify without bumping the
 * epoch on every published world and invalidating existing witnesses.
 *
 * Consumed by: eidolon-os.html, eidolon-router.html, nexus-witness.html
 */

function mulberry32(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tileSeed(planetSeed, x, y) {
  const a = (planetSeed ^ Math.imul(x >>> 0, 0x46F1F4A1)) >>> 0;
  const b = (a ^ Math.imul(y >>> 0, 0xC2B2AE35)) >>> 0;
  return (b ^ (b >>> 16)) >>> 0;
}

function generateAt(planetSeed, x, y, density, rarityTiers) {
  density     = (density     === undefined) ? 0.14 : density;
  rarityTiers = (rarityTiers === undefined) ? 4    : rarityTiers;
  const s   = tileSeed(planetSeed, x, y);
  const rng = mulberry32(s);
  if (rng() > density) return null;
  const dna = new Uint8Array(16);
  for (let i = 0; i < 16; i++) dna[i] = Math.floor(rng() * 256);
  const hues   = [rng() * 360, rng() * 360, rng() * 360];
  const rarity = dna[0] < 16 ? 3 : dna[0] < 64 ? 2 : dna[0] < 160 ? 1 : 0;
  return { dna, hues, rarity, seed: s };
}
