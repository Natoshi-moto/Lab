# Backup receipt — post-episode reorientation

**Date (UTC):** 2026-07-22T07:29:38Z  
**main_sha_at_backup:** 8409e4b5f808de729475b6f56e62d30f80d8395d  
**status_authority:** NONE  

## Archives (identical SHA-256)

- Games: `/mnt/games/lab-repo-backups/lab-adversary-pr-full-20260722T072938Z.zip`
- Backup: `/mnt/backup/lab-repo-backups/lab-adversary-pr-full-20260722T072938Z.zip`

```
bf524e703cce68cf8779877717b919fc08ebc86f6f8fadee15b7d591a845e669
```

Full tree zip (~48MB). Local sealed package included if present under `corpus/local-only/` on disk at zip time.

---

## Operator verification (append-only)

**Date (UTC):** 2026-07-22 (operator Step 1 paste; hygiene receipt records reconcile)  
**status_authority:** NONE  
**Does not:** claim tip-current main; replace the archive; prove full restore drill beyond list/hash

| Check | Result |
|--------|--------|
| Games path exists | YES (`/mnt/games/lab-repo-backups/lab-adversary-pr-full-20260722T072938Z.zip`, ~48M) |
| Backup path exists | YES (`/mnt/backup/lab-repo-backups/lab-adversary-pr-full-20260722T072938Z.zip`, ~48M) |
| Games SHA-256 | `bf524e703cce68cf8779877717b919fc08ebc86f6f8fadee15b7d591a845e669` |
| Backup SHA-256 | `bf524e703cce68cf8779877717b919fc08ebc86f6f8fadee15b7d591a845e669` |
| Match each other | YES |
| Match this receipt | YES |
| `unzip -l` spot-check | OK (full tree including `.git`) |
| Saw `STATUS.json` | YES |
| Saw `constitution/` | YES |
| Saw `NEXUS.json` | YES |

**Archive still pins** `main_sha_at_backup` = `8409e4b5f808de729475b6f56e62d30f80d8395d`.  
Commits after that tip (reorient + merge #88, then later hygiene) are **not** inside this zip as current HEAD. Re-zip post-hygiene tip is optional/recommended, not a failure of this archive.
