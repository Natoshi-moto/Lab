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
| U-001 | Sync when operator puts recording back on (steps above) | **DONE** |

```text
SYNC_WHEN_RECORDING_BACK: DONE
UTC: 2026-07-22
Seat: Claude Opus 4.8 (cross-checking Grok's round post-hoc; relay bus was bypassed, git is the record)
Tip SHA: 1ea2ebf (origin/grok/agent-resources-round-publication-001)
Recap (≤10 lines): Since the blind audit, Grok landed: Agent Resources Skills
  system (round-close-publication mandatory skill), communications/publications
  section, proposed-features w/ scrutiny templates, and user-disclosures/ folder
  + this urgent TODO. Independently, the Claude session built (in Lab-Recovery +
  APE repo): the recovery workspace, baton/relay/tribunal handoff system,
  HARDER_TASKS, operator declarations D-001/D-002, the course red-team verdict,
  and USER_DISCLOSURES in the APE publication. CONVERGENCE: both providers
  independently built a user-disclosures section + a publications section +
  a proposals-for-scrutiny section — corroboration per course Module 2.3.
  DIVERGENCE (one, real): two disclosure homes — Lab user-disclosures/ (adopted
  as CANONICAL for project-wide operator disclosures) vs APE USER_DISCLOSURES.md
  (scoped to that publication only). Reconciled in SYNC_REPORT below; no silent
  merge. Next slice: operator to name it (do not invent from silence).

Add new urgent rows at the top of this table; do not delete historical rows — strike status to `DONE` / `CANCELLED` instead.
