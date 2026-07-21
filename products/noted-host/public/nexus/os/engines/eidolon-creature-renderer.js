/* Nexus Eidolon Creature Renderer v1 — live companion canvas renderer. */
(function(root){
  'use strict';
  function fit(canvas){ const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : {width:canvas.width||400,height:canvas.height||400}; const d = Math.max(1, Math.min(2, root.devicePixelRatio || 1)); const w = Math.max(1, Math.round((rect.width || canvas.width || 400) * d)); const h = Math.max(1, Math.round((rect.height || canvas.height || 400) * d)); if (canvas.width !== w) canvas.width = w; if (canvas.height !== h) canvas.height = h; }
  function v(spec, id, fallback){ const n = spec && spec.axes && Number(spec.axes[id]); return Number.isFinite(n) ? n : fallback; }
  function hue(spec, id){ return Math.round((v(spec,id,128)/255)*360); }
  function drawCreature(canvas, input, time){
    if (!canvas || !canvas.getContext) return;
    const schema = root.NexusEidolonSchema;
    const spec = schema && schema.normalizeCreatureSpec ? schema.normalizeCreatureSpec(input || {}) : (input || {axes:{}});
    fit(canvas);
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, t = Number(time || 0) / 1000;
    const cx = W/2, cy = H/2;
    ctx.clearRect(0,0,W,H);
    const primary = hue(spec,'hue_primary');
    const accent = hue(spec,'hue_accent');
    const glow = hue(spec,'hue_glow');
    const sat = 38 + v(spec,'saturation',170)/255*54;
    const lit = 28 + v(spec,'lightness',130)/255*42;
    const baseR = Math.min(W,H) * (0.12 + v(spec,'body_radius',160)/255*0.18);
    const sx = 0.68 + v(spec,'body_stretch_x',128)/255*0.75;
    const sy = 0.72 + v(spec,'body_stretch_y',128)/255*0.8;
    const pulse = 0.96 + Math.sin(t*(0.8 + v(spec,'pulse_rate',128)/255*3.4))*0.035;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const particleCount = Math.round(v(spec,'particle_count',80)/255*42);
    for (let i=0;i<particleCount;i++){
      const a = i * 2.399 + t*(0.15 + v(spec,'particle_drift',100)/420);
      const rr = baseR * (1.35 + v(spec,'particle_radius',140)/255*1.8) + Math.sin(t+i)*18;
      const px = cx + Math.cos(a) * rr * sx;
      const py = cy + Math.sin(a*0.9) * rr * sy;
      ctx.fillStyle = `hsla(${(glow+i*9)%360} 90% 68% / .22)`;
      ctx.beginPath(); ctx.arc(px, py, 1.5 + v(spec,'particle_size',120)/255*4, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
    const arms = 2 + Math.round(v(spec,'arm_count',80)/255*12);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = `hsla(${glow} 95% 70% / .68)`;
    ctx.shadowBlur = 10 + v(spec,'glow_strength',140)/255*36;
    for (let i=0;i<arms;i++){
      const a = (i/arms)*Math.PI*2 + t*(0.15 + v(spec,'arm_wobble_rate',128)/500);
      const len = baseR * (1.1 + v(spec,'arm_length',128)/255*1.65);
      const wob = Math.sin(t*(1+v(spec,'arm_wobble_rate',128)/128)+i) * (v(spec,'arm_wobble',120)/255) * 0.55;
      ctx.strokeStyle = `hsla(${(accent+i*16)%360} ${sat}% ${lit+18}% / .72)`;
      ctx.lineWidth = 1.5 + v(spec,'arm_width',128)/255*9;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a)*baseR*0.55*sx, cy + Math.sin(a)*baseR*0.55*sy);
      ctx.quadraticCurveTo(cx+Math.cos(a+wob)*len*.68*sx, cy+Math.sin(a-wob)*len*.68*sy, cx+Math.cos(a+wob*.35)*len*sx, cy+Math.sin(a+wob*.35)*len*sy);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(sx*pulse, sy/pulse);
    const grd = ctx.createRadialGradient(-baseR*.25, -baseR*.28, baseR*.08, 0, 0, baseR*1.15);
    grd.addColorStop(0, `hsl(${primary} ${sat}% ${Math.min(lit+24,78)}%)`);
    grd.addColorStop(.62, `hsl(${primary} ${sat}% ${lit}%)`);
    grd.addColorStop(1, `hsl(${(primary+48)%360} ${Math.max(sat-18,32)}% ${Math.max(lit-18,12)}%)`);
    ctx.shadowColor = `hsla(${glow} 90% 68% / .75)`; ctx.shadowBlur = 16 + v(spec,'glow_radius',140)/255*40;
    ctx.fillStyle = grd;
    ctx.beginPath();
    const lumps = 8 + Math.round(v(spec,'body_lump_count',140)/255*14);
    for (let i=0;i<=lumps;i++){
      const a = (i/lumps)*Math.PI*2;
      const lump = 1 + Math.sin(a*(2+Math.round(v(spec,'body_lump_count',140)/64))+t*0.7) * (v(spec,'body_lumpiness',50)/255)*0.12;
      const x = Math.cos(a)*baseR*lump, y = Math.sin(a)*baseR*lump;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1 + v(spec,'body_outline',140)/255*5; ctx.strokeStyle = 'rgba(255,245,220,.32)'; ctx.stroke();
    ctx.restore();
    const eyes = 1 + Math.round(v(spec,'eye_count',128)/255*4);
    const eyeSize = baseR*(0.06 + v(spec,'eye_size',128)/255*0.12);
    const spacing = baseR*(0.16 + v(spec,'eye_spacing',128)/255*0.42);
    const ey = cy - baseR*(0.34 - v(spec,'eye_height',100)/255*0.55);
    for(let i=0;i<eyes;i++){
      const ex = cx + (i-(eyes-1)/2)*spacing;
      ctx.fillStyle = `hsla(${glow} 95% 82% / .95)`; ctx.shadowColor = `hsl(${glow} 95% 72%)`; ctx.shadowBlur = 6 + v(spec,'eye_glow',120)/255*18;
      ctx.beginPath(); ctx.ellipse(ex, ey, eyeSize, eyeSize*0.78, 0, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(5,5,9,.82)'; ctx.beginPath(); ctx.arc(ex, ey, eyeSize*(0.22+v(spec,'eye_pupil',140)/255*0.38),0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  const api = { drawCreature };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NexusEidolonCreatureRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);
