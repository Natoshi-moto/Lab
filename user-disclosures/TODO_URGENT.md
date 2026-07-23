# URGENT TODO — operator / seats

**status_authority:** `NONE`  
**Updated:** 2026-07-22  
**Owner:** human operator (ring-0); seats execute only when operator is back on record

---

## URGENT — U-002 EMERGENCY video stop/start (NOW)

**Status:** `OPEN`  
**Logged UTC:** `2026-07-22T19:51:20Z`  
**Disclosure:** `entries/2026-07-22_emergency-video-snapshot-stop-start.md`

Operator declared **emergency video snapshot**: stopping recording, saving, starting again **immediately**.

When new segment is live, seat should:

1. Confirm this file + disclosure still present  
2. Bus `RECOVERED` / note new segment rolling  
3. Mark U-002:

```text
U-002_EMERGENCY_VIDEO_BOUNDARY: DONE
UTC:
Seat:
```

---

## URGENT — U-001 sync when recording is back on

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
| **U-004** | **Plug USB stick** and run emergency snapshot so USB autodiscovers `lab-emergency-snapshots/` | **OPEN** |
| **U-003** | **Research:** which AIs can push to which cloud services (when/how); fit as skill/tool — see section below | **OPEN** |
| **U-002** | **EMERGENCY video boundary 2026-07-22T19:51:20Z** — stop snapshot / start new segment; sync when new segment rolling | **OPEN** |
| U-001 | Sync when operator puts recording back on (steps above) | **OPEN** |

---

## U-003 — Cloud push capability research (TODO)

**Status:** `OPEN`  
**Ask:** Which seats / tools can push Lab backups to which clouds, **when**, **how**, and how that becomes an automatic skill without stuffing secrets in git.

| Provider / surface | Likely seat/tool path | Auth model | Fit | Notes to verify |
|--------------------|----------------------|------------|-----|-----------------|
| GitHub (private backup repo) | Any seat with `gh` + human PAT/SSH | Human-held credential | Strong | Mirror push of bundle or private repo |
| Cloudflare R2 / S3 | Local CLI (`aws`/`rclone`) not “the model” | Keys in env / rclone config **off-repo** | Strong for automation | Skill runs `rclone sync` if configured |
| Google Drive | rclone / human browser | OAuth local | Medium | AI should not hold OAuth long-term |
| Dropbox | rclone | OAuth | Medium | same |
| iCloud | generally poor for automation on Linux | — | Weak | Prefer USB + local disks |
| xAI / Grok | **no** generic “upload my disk” API for seats | — | N/A | Chat cannot be the backup bus |
| Claude / ChatGPT | Files API / project uploads **not** full-repo disaster recovery | Provider limits | Weak for full repo | OK for small receipts only |
| Self-host (Syncthing, Nextcloud) | Local daemons | Device trust | Strong | Best “automatic” after setup |

**Workflow fit (proposal):**

1. **Primary:** `emergency_snapshot.sh` → all local + USB disks (this skill).  
2. **Secondary (optional):** post-hook `operations/backup/cloud_push.sh` that only runs if `~/.config/lab-backup/rclone.conf` exists **outside git**.  
3. **Never:** commit cloud keys; never ask a chat model to “remember” passwords.  
4. **Seat role:** detect operator phrase → run local spam → if cloud hook present, run it → receipt lists destinations.

**Deliverable when done:** short `operations/backup/CLOUD_PUSH_RESEARCH.md` + optional hook script stub.

Add new urgent rows at the top of this table; do not delete historical rows — strike status to `DONE` / `CANCELLED` instead.
