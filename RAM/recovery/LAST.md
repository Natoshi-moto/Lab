# LAST recovery pointer

**status_authority:** `NONE`  
**Updated UTC:** 2026-07-22  
**Seat:** grok

## Last known good coordination state

- **RAM plane:** exists at repo root  
- **Protocol:** `RAM/PROTOCOL.md`  
- **Board:** `RAM/BOARD.md` + `BOARD.json`  
- **Branch context (when written):** `grok/agent-resources-round-publication-001`  
- **Open research:** GVA-001 multi-model session video archive (proposal)  
- **Urgent operator:** `user-disclosures/TODO_URGENT.md` (recording sync if applicable)  

## If you are a new seat and confused

```bash
git status -sb
git rev-parse --short HEAD
head -80 RAM/BOARD.md
head -40 RAM/bus/INDEX.md
head -40 user-disclosures/TODO_URGENT.md
head -40 STATUS.json
head -40 NEXT_ACTION.md
```

Then bus a `RECOVERED` message before taking locks.
