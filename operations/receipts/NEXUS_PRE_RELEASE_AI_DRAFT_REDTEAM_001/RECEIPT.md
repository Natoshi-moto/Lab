# Execution receipt — NEXUS-PRE-RELEASE-AI-DRAFT-REDTEAM-001

status_authority: `NONE`. Reviewed commit `ec095332271fae5dd02813e1ecd4ef77bbf5cc0e`. See [`FREEZE.md`](FREEZE.md) for freeze state, toolchain, file hashes and independence declaration.

## Commands and outcomes

| # | Command (cwd = worktree root unless noted) | Exit | Result |
|---|---|---|---|
| 1 | `./nexus doctor` | 0 | PASS; only WARN = `WORKTREE_DIRTY` (my own receipt files). |
| 2 | `python3 -m unittest discover -s tests` (clean tree, pre-install) | 0¹ | `Ran 190 tests` — **FAILED (failures=9, errors=2)**; all from missing `@noble/ed25519` (ERR_MODULE_NOT_FOUND). ¹unittest returns 0 here; failures in body. |
| 3 | `npm ci` (root) | 0 | 0 vulnerabilities; installs `@noble/ed25519`. |
| 4 | `python3 -m unittest discover -s tests` (post-install) | 0 | `Ran 190 tests … OK`. |
| 5 | `./nexus verify` | 0 | PASS; R013 PCX model emitted, 115266 transitions checked. |
| 6 | `cd products/noted-host && npm ci && npm run build` | 0 | `vite build && node pack.js`; 304 modules; `dist/` produced; `OK … (961.7 KB)`. |
| 7 | `products/noted-host/public/nexus/os$ bash tests/run.sh` (clean, no Eidolin dist) | 1 | Aborts at SCRIPT-REF: `FAIL … blocks/Eidolin/index.html -> ./dist/src/runtime.js missing`; SCRIPT-REF SUMMARY pass=67 fail=1. |
| 8 | `…/blocks/Eidolin$ npm install && npm run verify` | 0 | typecheck+smoke+audit PASS; **regenerates `dist/src/runtime.js`** (20462 B); smoke emits deterministic creature/lineage/save with `proofHash`. |
| 9 | `products/noted-host/public/nexus/os$ bash tests/run.sh` (Eidolin built) | 1 | Every SUMMARY `fail=0` except `TOOLS SUMMARY pass=14 fail=1` → `channel-atlas --check` reports atlas stale (pre-existing, unrelated to draft). |

## Negative controls (verifier falsification)

| Control | Action | Verifier response | Restored |
|---|---|---|---|
| Snapshot integrity | `dd` one byte into `snapshots/canonical/NEXUS_LAB_R001_BASELINE_001.zip` | `./nexus verify` exit **2**, `Snapshot digest mismatch: expected 33d3f… got 69fd1…` | Yes — sha256 back to `33d3fb549d49e1ad…`, `verify` exit 0. |
| Secret scan (positive) | plant a valid `AKIA`-form AWS key (redacted here to avoid tripping the scanner on this receipt) in `corpus/fake_secret_test.txt` | `./nexus doctor` **FAIL secret_patterns** → `POTENTIAL_SECRET AWS_ACCESS_KEY …:1` | Yes — removed, doctor exit 0. |
| Secret scan (blind spot) | same key in a `.js` file (`corpus/fake_secret_only.js`) | `./nexus doctor` exit **0 — NOT flagged** (`.js` not in `TEXT_SUFFIXES`). Reproduces AUDOBS-R002-CLAUDE-0011. | Yes — removed. |

## Integrity / mutation check

- Snapshot sha256 at receipt close: `33d3fb549d49e1ad02ac2b28…` — unchanged from freeze.
- `git status --porcelain` at close: only files under `operations/audits/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/` and `operations/receipts/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/` (the deliverables). No audit target, snapshot, tag, or historical receipt modified.
- Verification-generated artifacts (`node_modules/`, `dist/`, Eidolin `dist/`+`node_modules/`+`package-lock.json`) were removed after runs; all are git-ignored and were never part of the tracked tree.

## Non-claims

- This review is **directed and not independent** (same operator + GitHub account as all other seats). It carries no canonical authority and does not promote the draft.
- A PASS on any verifier here proves only what that verifier checks; see per-finding limits in the report.
- Verdict **INCOMPLETE** applies to publication readiness only, per the handoff return contract.

## Return package

- Report: [`../../audits/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/REPORT.md`](../../audits/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/REPORT.md)
- Claims ledger: [`../../audits/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/CLAIMS_LEDGER.md`](../../audits/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/CLAIMS_LEDGER.md)
- Public summary: [`../../audits/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/PUBLIC_SUMMARY.md`](../../audits/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/PUBLIC_SUMMARY.md)
- **Status: INCOMPLETE** (publication readiness only; no canonical authority granted).
