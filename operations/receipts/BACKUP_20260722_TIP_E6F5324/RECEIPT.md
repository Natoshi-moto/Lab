# Backup receipt — tip-current after hygiene merge

**Date (UTC):** 2026-07-22T08:20:30Z (archive stamp)  
**main_sha_at_backup:** `e6f5324420e4691b916d7ac84d6ea85dea5912a9`  
**status_authority:** NONE  
**Prior good freeze (kept):** `operations/receipts/BACKUP_20260722/` @ `8409e4b` / hash `bf524e…`

## Archives (identical SHA-256)

- Games: `/mnt/games/lab-repo-backups/lab-adversary-pr-full-20260722T082030Z.zip`
- Backup: `/mnt/backup/lab-repo-backups/lab-adversary-pr-full-20260722T082030Z.zip`

```
5140b9f35540d5b5dc16d372939aab66549dd0324adaa6d936c719868d031e90
```

Size ~13M (smaller than prior ~48M freeze because rebuildable trees were excluded).

## Zip policy (this archive)

Included: full worktree + `.git` (restore-capable history).  
**Excluded by design:**

- `products/noted-host/node_modules/*`
- `**/__pycache__/*`
- `**/.pytest_cache/*`
- top-level `node_modules/*` if present

## Spot-check (operator + seat confirm)

| Check | Result |
|--------|--------|
| Dual-drive files exist | YES |
| Hashes match each other | YES |
| Hash matches this receipt | YES |
| `STATUS.json` | YES |
| `HYGIENE_20260722_CONTROL_PLANE` | YES |
| `PERSONAL_BLIND_MAP_001_RESPONSE.codex.md` | YES |
| `BACKUP_20260722` (prior receipt) | YES |
| `constitution/` / `NEXUS.json` | YES |

## Non-claims

- Not a full restore drill (extract + `git status` on a clean machine not run here).
- Not a claim that excluded `node_modules` is worthless — only that it is rebuildable and was omitted to keep the archive small and doctor-clean.
- Does not supersede or delete the `8409e4b` / `bf524e…` freeze; that remains a valid historical dual-drive copy.
- Not a security cert or emergency-stop lift.
