```yaml
skill_id: emergency-multi-drive-snapshot
version: 1.0
status: ACTIVE
one_line: On operator request, spam Lab (+ Lab-Recovery) to every configured drive; keep 20 snaps rolling.
```

# Emergency multi-drive snapshot

**status_authority:** `NONE`

## When

Operator says any of:

- “emergency backup”  
- “spam the drives”  
- “snapshot all disks”  
- “USB backup now”  

## Steps

1. Confirm `operations/backup/targets.env` exists.  
2. List mounted targets (`df -h /mnt/backup /mnt/games`; `ls /run/media/$USER`).  
3. If USB just plugged: wait for mount; ensure writable.  
4. Run:

```bash
./operations/backup/emergency_snapshot.sh --reason "<operator phrase>"
```

5. Report: ok/fail/skipped counts + receipt path.  
6. Bus ALERT/DONE on RAM with destinations.  
7. Do **not** claim cloud backup unless a cloud target actually ran.

## Rolling delete

`MAX_SNAPSHOTS=20` per target — oldest `snap_*` dirs deleted after each successful write path.

## Cloud (not automatic yet)

See `user-disclosures/TODO_URGENT.md` U-003: research which seats can push to which clouds. Do not invent credentials.
