/* Nexus Eidolon Storage v1 — local UX state helpers. */
(function(root){
  'use strict';
  const KEYS = { companion:'nexus:selected-companion:v1', environment:'nexus:selected-environment:v1', attack:'nexus:selected-attack:v1', companionCollection:'companion:collection:v1', atlasFallback:'atlas:worlds:fallback:v1', attacksFallback:'eidolon:attacks:fallback:v1' };
  function safeGet(key, fallback){ try{ const raw = root.localStorage && root.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(_){ return fallback; } }
  function safeSet(key, value){ try{ if(root.localStorage) root.localStorage.setItem(key, JSON.stringify(value)); return true; }catch(_){ return false; } }
  function pushUnique(key, item, limit){ const arr = safeGet(key, []); const id = item && item.id; const next = Array.isArray(arr) ? arr.filter(x => x && (!id || x.id !== id)) : []; next.push(item); safeSet(key, next.slice(-(limit||80))); return next.slice(-(limit||80)); }
  function setSelectedCompanion(spec){ safeSet(KEYS.companion, spec); pushUnique(KEYS.companionCollection, spec, 80); return spec; }
  function setSelectedEnvironment(spec){ safeSet(KEYS.environment, spec); pushUnique(KEYS.atlasFallback, spec, 80); return spec; }
  function setSelectedAttack(spec){ safeSet(KEYS.attack, spec); pushUnique(KEYS.attacksFallback, spec, 80); return spec; }
  const api={KEYS,safeGet,safeSet,pushUnique,setSelectedCompanion,setSelectedEnvironment,setSelectedAttack}; if(typeof module!=='undefined'&&module.exports)module.exports=api; root.NexusEidolonStorage=api;
})(typeof window !== 'undefined' ? window : globalThis);
