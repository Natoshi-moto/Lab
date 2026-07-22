# URGENT TODO — operator / seats

**status_authority:** `NONE`  
**Updated:** 2026-07-22  
**Owner:** human operator (ring-0); seats execute only when operator is back on record

---

## URGENT — sync when recording is back on

**Status:** `OPEN`  
**Why:** Operator is stopping to **save the screen recording** in case the PC crashes, then will **start recording again immediately** and continue building. Context between segments must not be lost.

### When the operator says recording is back / continues

Seat(s) must **sync up** before new feature work:

1. **Confirm** `user-disclosures/` exists and this file still says OPEN or mark `DONE` with timestamp.  
2. **Restate** last committed tip + open PR (`#96` / branch `grok/agent-resources-round-publication-001` if still live).  
3. **Recap in ≤10 lines** what landed since the blind audit (skills, publications, proposed-features, this folder).  
4. **Ask** what the next build slice is (do not invent a track from silence).  
5. **Link** the new recording segment in a disclosure or session note if the operator pastes a path/title — optional, only if they give one.  
6. Mark this item:

```text
SYNC_WHEN_RECORDING_BACK: DONE
UTC:
Seat:
Tip SHA:
```

### Do not

- Soft-close product reds while “syncing”  
- Treat a missing recording as proof nothing happened — git is the backup  
- Block on the recording file itself if git already has the work  

---

## Open urgent queue

| ID | Item | Status |
|----|------|--------|
| U-001 | Sync when operator puts recording back on (steps above) | **OPEN** |

Add new urgent rows at the top of this table; do not delete historical rows — strike status to `DONE` / `CANCELLED` instead.
