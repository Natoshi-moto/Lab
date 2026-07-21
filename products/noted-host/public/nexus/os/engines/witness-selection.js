/* Nexus Moot Witness Selection v1 — deterministic witness pool helpers. */
(function(root){
  'use strict';
  const nodeCrypto = typeof require === 'function' ? (()=>{ try { return require('crypto'); } catch (_) { return null; } })() : null;
  function canonical(v){
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k)+':'+canonical(v[k])).join(',') + '}';
  }
  function fnvHex(str){ let h=2166136261>>>0; for(let i=0;i<String(str).length;i++){ h^=String(str).charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(16).padStart(8,'0'); }
  function scoreHex(battle_id, pubkey){
    const input = String(battle_id||'') + '|' + String(pubkey||'') + '|witness';
    if (nodeCrypto) return nodeCrypto.createHash('sha256').update(input).digest('hex');
    return fnvHex(input) + fnvHex(input.split('').reverse().join(''));
  }
  function selectWitnesses({battle_id, candidate_pubkeys, n=5, m=3} = {}){
    const seen = new Set();
    const candidates = (Array.isArray(candidate_pubkeys) ? candidate_pubkeys : [])
      .map(String).map(s=>s.trim()).filter(Boolean).filter(p => { if(seen.has(p)) return false; seen.add(p); return true; });
    if (candidates.length < Number(m||0)) return [];
    return candidates.map(pubkey => ({pubkey, score: scoreHex(battle_id, pubkey)}))
      .sort((a,b)=>a.score.localeCompare(b.score) || a.pubkey.localeCompare(b.pubkey))
      .slice(0, Number(n)||5).map(x=>x.pubkey);
  }
  function resultCertWitnessBody(cert){
    return {
      battle_id: cert.battle_id,
      charter: cert.charter || null,
      realm: cert.realm || cert.realm_id || null,
      eidolon_a_hash: cert.eidolon_a_hash || cert.eidolon_a || null,
      eidolon_b_hash: cert.eidolon_b_hash || cert.eidolon_b || null,
      ranked: !!cert.ranked,
      lock_a: cert.lock_a || null,
      lock_b: cert.lock_b || null,
      transcript_hash: cert.transcript_hash,
      winner: cert.winner || null,
      ts: cert.ts
    };
  }
  function verifyWitnessQuorum(result_cert, m=3, verify){
    const cert = result_cert || {};
    const selected = new Set((cert.selected_witnesses || cert.witnesses_selected || []).map(w => typeof w === 'string' ? w : w && w.pubkey).filter(Boolean));
    const witnesses = Array.isArray(cert.witnesses) ? cert.witnesses : [];
    const seen = new Set();
    let valid = 0;
    const body = resultCertWitnessBody(cert);
    for (const w of witnesses) {
      if (!w || !w.pubkey || !w.sig || seen.has(w.pubkey)) continue;
      if (selected.size && !selected.has(w.pubkey)) continue;
      let ok = true;
      if (typeof verify === 'function') ok = !!verify(w.sig, body, w.pubkey, cert);
      seen.add(w.pubkey);
      if (ok) valid++;
    }
    return valid >= Number(m || 3);
  }
  function witnessAdvertisement({pubkey, realm, capacity=8, since} = {}){
    return {kind:30450, tags:[['d', String(pubkey||'')], ['realm', String(realm||'')]], content:{realm:String(realm||''), capacity:Number(capacity)||0, since: since || Math.floor(Date.now()/1000)}};
  }
  const api = { selectWitnesses, verifyWitnessQuorum, witnessAdvertisement, resultCertWitnessBody, _scoreHex:scoreHex, _canonical:canonical };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NexusWitnessSelection = api;
})(typeof window !== 'undefined' ? window : globalThis);
