# Emergency multi-drive snapshots

**status_authority:** `NONE`  
**Trigger:** operator says “emergency backup” / “spam the drives” / “snapshot everything”

## What it does

1. Copies configured **source trees** (Lab + Lab-Recovery by default) to **every writable target drive**.  
2. Names each run `snap_<UTC>_<gitshort>/`.  
3. Keeps only the newest **20** snapshots **per target** (rolling delete).  
4. Writes a receipt under `operations/receipts/EMERGENCY_SNAPSHOT_<UTC>/`.  
5. Also writes a `git bundle --all` of Lab when possible.

## Run

```bash
cd /path/to/Lab
./operations/backup/emergency_snapshot.sh --reason "operator emergency"
```

## Config

Edit `operations/backup/targets.env`:

- `SOURCE_*` — what to copy  
- `TARGET_*` — where to spam  
- `MAX_SNAPSHOTS=20`  
- `USB_AUTODISCOVER=1` — if a USB is mounted under `/run/media/$USER/*`, creates/uses `lab-emergency-snapshots/`

## USB stick (your note)

1. Plug in USB.  
2. Ensure it mounts (Files app or `ls /run/media/$USER`).  
3. Re-run the script — autodiscovers **or** set:

```bash
TARGET_usb=/run/media/anon/YOUR_LABEL/lab-emergency-snapshots
```

## Current machine targets (observed 2026-07-22)

| Path | Role |
|------|------|
| `/mnt/backup/lab-emergency-snapshots` | Dedicated BACKUP disk |
| `/mnt/games/lab-emergency-snapshots` | Second disk (GAMES) |
| `/home/anon/nexus-backup/lab-emergency-snapshots` | Home-side mirror |

## Skill

`Agent Resources/Tools/Skills/essential/emergency-multi-drive-snapshot.md`

## Space note

Default rsync **excludes** `gateway-freezes/`, `_quarantine/`, and `*.zip` so 20 rolling copies do not fill `/mnt/backup` (often tight). Those freezes stay on disk where they already live; emergency spam is for **live Lab + Lab-Recovery text/code**.

## Not this system

- Not STATUS authority  
- Not cloud push (see TODO research U-003)  
- Not a substitute for dual-drive **verified** operator ritual receipts  
- USB: plug stick → remount → re-run (U-004)
