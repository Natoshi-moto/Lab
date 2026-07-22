# Whoopsie log

**What this is:** a public, non-shaming record of times the **human operator** and/or an **AI seat** accidentally fucked up — and whether anyone noticed **then**, **never**, or **only later**.

**status_authority:** `NONE`  
**Tone:** honest, plain English, no hero polish  
**Not:** a bug tracker, a blame court, a security cert, or a waiver of hard gates  

---

## Why this exists

Pretty demos and multi-AI agreement hide how often the Lab is held together by duct tape and late “oh shit.”

This folder is the opposite of that. If something went sideways — wrong model sold as the right one, stale docs saying both PASS and FAIL, a PR that claimed “one file” when it wasn’t, a gate that pointed at tests that were never built — it belongs here.

**Caught by AI** and **owned by human** are both allowed.  
**Didn’t realize until later** is first-class.  
**Still not sure** is allowed if labeled `UNSURE`.

---

## Rules

1. **No rewriting history to look clever.** Append a correction entry if you learn more.  
2. **Say who fucked up:** `HUMAN` / `AI` / `BOTH` / `UNCLEAR`. Name the seat if known (Fable, Grok, Codex, …).  
3. **Say when it was realized:** `IMMEDIATE` / `LATER` / `NOT_YET` / `UNKNOWN`.  
4. **Verbatim operator quotes** go in quote blocks when the human wants their words locked.  
5. **Do not** use this log to soft-close a T-ID or HARD_GATE. A whoopsie is not a fix.  
6. **Do not** put secrets, real API keys, or private identity here.  
7. New entries: copy `TEMPLATE.md`, file as `entries/WHOOP-YYYYMMDD-##.md`, add a row to `INDEX.md`.

---

## Start here

| File | Job |
|------|-----|
| [`INDEX.md`](INDEX.md) | All whoopsies at a glance |
| [`TEMPLATE.md`](TEMPLATE.md) | Blank form for a new one |
| [`entries/`](entries/) | The actual stories |

---

## Non-claims

- Completeness is not claimed. Missing a whoopsie is itself a future whoopsie.  
- Listing a fuckup does not mean the underlying risk is fixed.  
- Multi-seat agreement that “we all noticed” is not independent corroboration.
