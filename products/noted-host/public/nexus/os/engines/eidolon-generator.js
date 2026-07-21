/* Nexus Moot Eidolon Generator v1 — creates sovereign descendant HTML artifacts. */
(function(root){
  'use strict';
  const nodeCrypto = typeof require === 'function' ? (()=>{ try { return require('crypto'); } catch (_) { return null; } })() : null;
  const DETERMINISTIC_CREATED_AT = '1970-01-01T00:00:00.000Z';
  function canonical(v){ if(v===null||typeof v!=='object') return JSON.stringify(v); if(Array.isArray(v)) return '['+v.map(canonical).join(',')+']'; return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}'; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function bytesToHex(bytes){ return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join(''); }
  async function sha256Hex(s){
    const input = typeof s === 'string' ? s : canonical(s);
    if (nodeCrypto) return nodeCrypto.createHash('sha256').update(input).digest('hex');
    if (!root.crypto || !root.crypto.subtle) throw new Error('crypto.subtle required for eidolon hashing');
    const d = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return bytesToHex(new Uint8Array(d));
  }
  function normDna(dna){ const a=Array.isArray(dna)?dna:[]; const out=[]; for(let i=0;i<16;i++) out.push(Math.max(0,Math.min(255,Number(a[i]||0)|0))); return out; }
  function normHues(hues){ const a=Array.isArray(hues)?hues:[]; const out=a.map(Number).filter(Number.isFinite).slice(0,6); while(out.length<3) out.push((out[out.length-1]||120)+120); return out.map(h=>((h%360)+360)%360); }
  function scarSvgScript(){ return `
const GENE_DATA=JSON.parse(document.getElementById('creature-dna').textContent);
function fnv1a(s){let h=2166136261>>>0;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let t=fnv1a(seed);return function(){t=(t+0x6D2B79F5)>>>0;let r=t;r=Math.imul(r^(r>>>15),r|1);r^=r+Math.imul(r^(r>>>7),r|61);return ((r^(r>>>14))>>>0)/4294967296;};}
function draw(){const c=document.getElementById('eidolon');const x=c.getContext('2d');const g=GENE_DATA;const hues=g.hues||[200,280,20];x.clearRect(0,0,c.width,c.height);const grd=x.createRadialGradient(180,160,20,180,160,120);grd.addColorStop(0,'hsl('+hues[0]+',90%,65%)');grd.addColorStop(1,'hsl('+hues[1]+',80%,28%)');x.fillStyle=grd;x.beginPath();x.arc(180,170,92,0,Math.PI*2);x.fill();x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=4;x.stroke();for(const scar of (g.scars||[])){const r=rng((scar.battle_id||'')+':' +(scar.position_seed||''));const cx=90+r()*180, cy=90+r()*150, len=22+Math.floor(r()*34), ang=r()*Math.PI*2;const intensity=Math.max(.2,Math.min(1,Number(scar.intensity||.7)));x.strokeStyle='rgba(255,245,210,'+intensity+')';x.lineWidth=2+intensity*3;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);x.stroke();x.lineWidth=1;x.beginPath();x.moveTo(cx+6,cy-4);x.lineTo(cx+Math.cos(ang+.8)*len*.45,cy+Math.sin(ang+.8)*len*.45);x.stroke();}}
window.addEventListener('load',draw);`; }
  async function buildGeneData({dna,hues,name,parentNonce,parentHash,lineage,scars,battle_id,createdAt}={}){
    const normScars = Array.isArray(scars) ? scars.slice() : [];
    const parent = parentHash || null;
    const nonce = 'imprint_' + (await sha256Hex(canonical({parentHash:parent, battle_id:battle_id||null, scars:normScars}))).slice(0,16);
    const data = {format:'eidolon-creature/1', name:String(name||'Imprinted Eidolon'), nonce, dna:normDna(dna), hues:normHues(hues), parentNonce:parentNonce||null, parentHash:parent, lineage:Array.isArray(lineage)?lineage.slice():[], scars:normScars, createdAt:String(createdAt || DETERMINISTIC_CREATED_AT)};
    return data;
  }
  async function generateEidolonHtml(input={}){
    const data = input && input.format === 'eidolon-creature/1' ? input : await buildGeneData(input);
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(data.name)}</title><style>body{margin:0;background:#090a12;color:#eef;font:16px system-ui;display:grid;place-items:center;min-height:100vh}.card{padding:24px;border:1px solid #2d3358;border-radius:18px;background:#111528;box-shadow:0 18px 60px #0008;text-align:center}canvas{width:360px;height:320px;image-rendering:auto}.meta{opacity:.75;font-size:12px;max-width:540px;word-break:break-all}</style></head><body><div class="card"><h1>${esc(data.name)}</h1><canvas id="eidolon" width="360" height="320"></canvas><p class="meta">parent: ${esc(data.parentHash||'none')}</p></div><script id="creature-dna" type="application/json">${JSON.stringify(data,null,2)}</script><script>${scarSvgScript()}</script></body></html>`;
  }
  function makeScar({battle_id,intensity=0.75,position_seed}={}){
    if (!battle_id && !position_seed) throw new Error('battle_id_or_position_seed_required');
    return {battle_id:String(battle_id||''), intensity:Number(intensity)||0.75, position_seed:String(position_seed||battle_id), style:'fracture'};
  }
  async function descendantPayload({source,battle_id,name,createdAt}={}){
    if (!battle_id) throw new Error('battle_id_required');
    const p = source && source.payload ? source.payload : (source||{});
    const scars = Array.isArray(p.scars) ? p.scars.slice() : [];
    scars.push(makeScar({battle_id, position_seed:battle_id}));
    const parentHash = (source && (source.content_hash||source.content_addr||source.birthHash||source.id)) || null;
    return buildGeneData({dna:p.dna,hues:p.hues,name:name || ((source && source.name) ? source.name + ' — imprinted' : 'Imprinted Eidolon'), parentNonce:p.nonce || null, parentHash, battle_id, createdAt:createdAt || (source && source.createdAt) || p.createdAt || DETERMINISTIC_CREATED_AT, lineage:[...new Set([...(Array.isArray(p.lineage)?p.lineage:[]), source && source.id].filter(Boolean))], scars});
  }
  const api={generateEidolonHtml, makeScar, descendantPayload, _canonical:canonical, _sha256Hex:sha256Hex, _buildGeneData:buildGeneData};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NexusEidolonGenerator = api;
})(typeof window !== 'undefined' ? window : globalThis);
