# Hygiene receipt — control plane + backup reconcile

**ID:** `HYGIENE_20260722_CONTROL_PLANE`  
**Date (UTC filed):** 2026-07-22T08:13:53Z  
**Seat:** Grok (xAI) — operator-directed light hygiene  
**Branch:** `grok/hygiene-control-plane-backup-reconcile-001`  
**Baseline main:** `83761fa251c89889a5f127a05d5e5594b8cb0210`  
**status_authority:** `NONE`

## Why

`STATUS.json` still said `SYNC_AND_BACKUP_PENDING` after a dual-drive backup receipt existed and after operator Step 1 verified both archives. That is dashboard lag (same class of scar as the emergency episode), not a missing backup.

## Operator evidence used (not re-run by this seat)

- Step 1 backup integrity: dual-drive files exist; both SHA-256 = `bf524e703cce68cf8779877717b919fc08ebc86f6f8fadee15b7d591a845e669`; spot-list OK.
- Step 2 tip delta: local/origin main `83761fa…`; two commits since backup tip `8409e4b…`; only untracked Codex blind map.

## Changes in this pass

| Path | Action |
|------|--------|
| `operations/receipts/BACKUP_20260722/RECEIPT.md` | Append verification section only |
| `operations/handoffs/PERSONAL_BLIND_MAP_001_RESPONSE.codex.md` | Add (was untracked) |
| `operations/receipts/HYGIENE_20260722_CONTROL_PLANE/RECEIPT.md` | Create (this file) |
| `STATUS.json` | Clear false backup-pending; next_action → track menu or lift |
| `STATUS.md` | Regenerated via `./nexus render-status` |
| `NEXT_ACTION.md` | Sync/backup marked verified; next steps listed |

## Unchanged on purpose

- `canonical_target` / `baseline-001`
- `human_readable_reds` (product stop, T-01/G-01, CARD-11, bus weakness)
- `current_mode`: `REORIENTATION_POST_EPISODE`
- No formal emergency-stop lift
- No product / security code
- No new full-tree zip in this PR (optional after merge)

## Verification run (this seat)

| Check | Result |
|--------|--------|
| `./nexus render-status` | OK → `STATUS.md` |
| `./nexus doctor` with local `products/noted-host/node_modules` present | **FAIL** (ignored tree: symlinks + invalid JSON under `node_modules`) |
| `./nexus doctor` with that `node_modules` temporarily aside | **PASS** (WARN worktree dirty from this branch) |
| `python3 -m unittest discover -s tests` with `node_modules` present | 189 OK; 1 FAIL = `test_current_repository_doctor_has_no_errors` (same env cause) |
| Doctor unit test with `node_modules` aside | OK |

**Environment note:** `products/noted-host/node_modules` is gitignored and was restored after the clean doctor check. Hygiene does not delete operator install trees.

## Non-claims

- Not a security certificate, pen-test, or product readiness claim.
- Not a lift of `EMERGENCY_STOP_001`.
- Dual-drive verification does not prove long-term media health or a full restore drill.
- Codex blind map is operator reorientation aid; multi-seat agreement is not independence.
- Green doctor/tests mean control tools parse; they do not close reds.
- Temporary aside of local `node_modules` for doctor is not a product change and is not committed.
