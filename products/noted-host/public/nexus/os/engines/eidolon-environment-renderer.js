/* Nexus Eidolon Environment Renderer v1 — animated home-world canvas renderer. */
(function(root){
  'use strict';
  function fit(canvas){ const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : {width:canvas.width||1280,height:canvas.height||720}; const d = Math.max(1, Math.min(2, root.devicePixelRatio || 1)); const w = Math.max(1, Math.round((rect.width || canvas.width || 1280) * d)); const h = Math.max(1, Math.round((rect.height || canvas.height || 720) * d)); if (canvas.width !== w) canvas.width = w; if (canvas.height !== h) canvas.height = h; }
  function v(spec,id,fallback){ const n = spec && spec.axes && Number(spec.axes[id]); return Number.isFinite(n) ? n : fallback; }
  function hueByte(spec,id){ return Math.round((v(spec,id,128)/255)*360); }
  function rng(seed){ let t = Number(seed || 0) >>> 0; return function(){ t = (t + 0x6D2B79F5) >>> 0; let r = t; r = Math.imul(r ^ (r >>> 15), r | 1); r ^= r + Math.imul(r ^ (r >>> 7), r | 61); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function drawRidge(ctx,W,H,seed,count,height,dark,hue,yBase,parallax,t){ const r = rng(seed); ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,yBase); const steps = Math.max(5, count); for(let i=0;i<=steps;i++){ const x = (i/steps)*W; const n = Math.sin(i*1.7+seed*.001+t*parallax)*0.5+Math.sin(i*3.1+seed*.003)*0.35+r()*0.15; const y = yBase - height*(0.35+n*0.65); ctx.lineTo(x,y); } ctx.lineTo(W,H); ctx.closePath(); ctx.fillStyle = `hsla(${hue} 32% ${Math.max(4,22-dark)}% / .72)`; ctx.fill(); }
  function drawEnvironment(canvas, input, time){
    if (!canvas || !canvas.getContext) return;
    const schema = root.NexusEidolonSchema;
    const spec = schema && schema.normalizeEnvironmentSpec ? schema.normalizeEnvironmentSpec(input || {}) : (input || {axes:{}});
    fit(canvas);
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, t = Number(time || 0)/1000;
    const topH = hueByte(spec,'sky_top_hue'), botH = hueByte(spec,'sky_bot_hue');
    const sat = 26 + v(spec,'sky_saturation',120)/255*58;
    const topL = 5 + v(spec,'sky_top_lightness',45)/255*42;
    const botL = 8 + v(spec,'sky_bot_lightness',120)/255*46;
    const pulse = Math.sin(t*(v(spec,'sky_pulse_rate',0)/255*2.2))*2.5;
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, `hsl(${topH} ${sat}% ${topL+pulse}%)`);
    g.addColorStop(Math.max(.2, Math.min(.82, v(spec,'sky_band_position',140)/255)), `hsl(${Math.round((topH+botH)/2)} ${Math.max(sat-12,18)}% ${Math.max(topL,botL)-3}%)`);
    g.addColorStop(1, `hsl(${botH} ${Math.max(sat-18,18)}% ${botL}%)`);
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    const starCount = Math.round(v(spec,'star_count',0)/255*120); const sr = rng(spec.seed + 17);
    for(let i=0;i<starCount;i++){ const x=sr()*W, y=sr()*H*.55; const a=.18 + v(spec,'star_brightness',128)/255*.68; ctx.fillStyle=`rgba(235,250,255,${a*(.45+sr()*.55)})`; ctx.fillRect(x,y,1+(sr()*2),1+(sr()*2)); }
    const farHue = (topH + 24) % 360; const midHue = (botH + 340) % 360;
    drawRidge(ctx,W,H,spec.seed+101, 5+Math.round(v(spec,'far_count',80)/255*18), H*(.08+v(spec,'far_height',100)/255*.2), v(spec,'far_darkness',140)/12, farHue, H*(.58+v(spec,'far_jitter',140)/255*.08), .18, t);
    ctx.fillStyle = `hsla(${topH} 65% 76% / ${v(spec,'far_haze',120)/255*.22})`; ctx.fillRect(0,0,W,H);
    drawRidge(ctx,W,H,spec.seed+303, 4+Math.round(v(spec,'mid_count',60)/255*14), H*(.12+v(spec,'mid_height',140)/255*.26), v(spec,'mid_darkness',180)/10, midHue, H*(.70+v(spec,'mid_jitter',150)/255*.06), .26, t);
    const groundY = H*(.48+v(spec,'ground_y',170)/255*.38);
    const groundHue = hueByte(spec,'ground_hue'), groundL = 7 + v(spec,'ground_lightness',80)/255*30;
    const gg = ctx.createLinearGradient(0,groundY,0,H); gg.addColorStop(0,`hsl(${groundHue} 42% ${groundL+10}%)`); gg.addColorStop(1,`hsl(${groundHue} 32% ${Math.max(3,groundL-8)}%)`); ctx.fillStyle=gg; ctx.fillRect(0,groundY,W,H-groundY);
    const tex = Math.round(v(spec,'ground_texture',80)/255*80); const tr = rng(spec.seed+707); ctx.strokeStyle=`hsla(${groundHue} 72% 72% / .08)`; for(let i=0;i<tex;i++){ const x=tr()*W, y=groundY+tr()*(H-groundY); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+20+tr()*80,y+tr()*8-4); ctx.stroke(); }
    ctx.strokeStyle=`hsla(${groundHue} 95% 72% / ${v(spec,'ground_glow',40)/255*.35})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,groundY); ctx.lineTo(W,groundY); ctx.stroke();
    const fogHue = hueByte(spec,'fog_hue'); const fog = v(spec,'fog_density',30)/255; for(let i=0;i<4;i++){ ctx.fillStyle=`hsla(${fogHue} 80% 78% / ${fog*.055})`; ctx.fillRect(0,H*(.34+i*.12)+Math.sin(t*.2+i)*12,W,H*.1); }
    const fgCount = Math.round(v(spec,'fg_count',30)/255*70); const dir = (v(spec,'fg_direction',128)/255)*Math.PI*2; const speed = (v(spec,'fg_speed',128)/255)*30; const opacity = v(spec,'fg_opacity',140)/255*.32; const pr = rng(spec.seed+909);
    ctx.fillStyle=`hsla(${(fogHue+80)%360} 90% 76% / ${opacity})`;
    for(let i=0;i<fgCount;i++){ let x=(pr()*W + Math.cos(dir)*speed*t*(1+i%5))%W; if(x<0)x+=W; let y=(pr()*H + Math.sin(dir)*speed*t*(1+i%4))%H; if(y<0)y+=H; const s=1+v(spec,'fg_size',120)/255*5*pr(); ctx.beginPath(); ctx.arc(x,y,s,0,Math.PI*2); ctx.fill(); }
    const vig = v(spec,'vignette',80)/255; if(vig>0){ const rg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.1,W/2,H/2,Math.max(W,H)*.72); rg.addColorStop(0,'rgba(0,0,0,0)'); rg.addColorStop(1,`rgba(0,0,0,${vig*.58})`); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H); }
  }
  const api = { drawEnvironment };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NexusEidolonEnvironmentRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);
