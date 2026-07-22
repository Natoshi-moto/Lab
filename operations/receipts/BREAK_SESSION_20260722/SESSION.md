# BREAK session 1 — plain-language record

**Date:** 2026-07-22  
**Tracking:** https://github.com/Natoshi-moto/Lab/issues/63  
**Operator:** human (non-coder) with Grok drive + terminal  
**status_authority:** `NONE`  
**Research only / synthetic-safe checks**

---

## What this session was

A first intentional poke at Noted after the Lab was cleaned and given a break checklist.

Not a security certificate.  
Not a claim that holes are fixed.  
Not about real money or attacking other people’s systems.

---

## Lab state when we started session 1

Already on `main` before this session:

| Step | Meaning |
|------|---------|
| ORCH T1 | Health checks green (doctor / verify / tests) after install |
| ORCH T2 | “What’s next” dashboard pointed at break-prep, not old PR #22 |
| ORCH T4 | Old Agent v0.12 removed from shipped paths + launch lists |
| ORCH T5 | Break runbook published (`operations/break-prep/ORCH_001_BREAK_RUNBOOK.md`) |

---

## What we ran (session 1 = top five safe cards)

| Card | Check (plain English) | Result | How we know |
|------|------------------------|--------|-------------|
| CARD-01 | Is the old leaky Agent still shipped? | **PASS** | `npm run t06:quarantine-check` — both checks PASS |
| CARD-02 | Does the Agent still load styles from the public internet with no lock? | **FOUND (expected)** | `grep` showed `cdn.tailwindcss.com` in Agent HTML |
| CARD-03 | Does code still default some providers through a free public proxy? | **FOUND (expected)** | `grep` showed `DEFAULT_PROXY` = corsproxy.io and `PROXY_REQUIRED` list |
| CARD-05 | Does host reply messaging use a wide target (`*`)? | **FOUND (expected)** | Code at `nexusHostBridge.ts` `postMessage(..., '*')` |
| CARD-10 | What does diagnostic export contain today? | **RAN — clean sample** | Full file: `/home/anon/Downloads/noted-diagnostic-bundle-2026-07-22T02-39-42.json` |

Harder cards (same-origin storage poke, deeper bridge live tests, key storage) were **not** run this session. Left for a later session.

---

## Evidence labels (simple)

| Card | Label | Notes |
|------|--------|--------|
| CARD-01 | EXECUTED | Script run by operator |
| CARD-02 | EXECUTED | Grep run by operator |
| CARD-03 | EXECUTED | Grep run by operator |
| CARD-05 | EXECUTED / SOURCE_TRACED | Grep found call site; `'*'` confirmed in source |
| CARD-10 | EXECUTED | Full validation bundle opened; 20 `verse-studio:` keys, UI prefs only, no secret-shaped names |

---

## CARD-10 detail (what “proper” meant)

Operator first shared a short summary and an ODS pack. Those were related but not the full validation bundle.

The real file already existed:

`/home/anon/Downloads/noted-diagnostic-bundle-2026-07-22T02-39-42.json`

That file has `payload.localstorage` with full values. All keys start with `verse-studio:`. Values look like theme, sidebar, last selection, canvas layout — not API keys.

**Still open as design risk (not a dirty export today):** host exporter scoops all `verse-studio:` keys without a hard allowlist for the future.

---

## What we are *not* claiming

- Noted is secure or production-ready  
- T-01 / T-02 / T-03 / bridge gaps are fixed  
- Green unit tests or ODS PASS means safety  
- Multi-AI agreement is independent proof  
- Git history no longer contains old v0.12 bytes (history still has them; launch path does not)

---

## Session outcome in one line

Quarantine holds; three known soft spots reconfirmed on purpose; diagnostic export looked clean today.

---

## Next phase (after this receipt)

See `NEXT.md` in this folder.
