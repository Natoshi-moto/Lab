# AUD-R002-CLAUDE-BLIND — hostile independent audit report

- Auditor: Claude (Anthropic), session label `second-account`, review class `SAME_FAMILY_DIFFERENTIAL`
- Audit phase: BLIND
- HEAD at start and end: `084b3b9ee6a1434e38a5bf23eee8266c43b3522d` (unchanged — confirmed clean before and after)
- Target commit: `7a8068fc6088b81cc9a7c94b49dc77e0abe592d8` (tag `baseline-001`)
- Target archive SHA-256: `33d3fb549d49e1ad02ac2b2880b5ab4336a6dc29a7142d3e33e4ec2694ad8603`
- `status_authority` for every observation below: `NONE`. Nothing here is self-promoting; all 18 observations are proposals only.

This report is a human-readable summary of the 18 machine-readable observation files produced alongside it. It does not supersede them. Per repo policy (`constitution/AUDIT.md`), a passing check is evidence only for the property it actually tests, and absence of a finding is reported as `NO_FINDING_WITH_SCOPE`, never as "correct."

## What was executed

- `./nexus doctor` — PASS (7/7 checks)
- `python3 -m unittest discover -s tests -v` — 29/29 tests passed
- `./nexus verify` — PASS
- `./nexus audit-check --audit-id AUD-R002-CLAUDE-BLIND` — PASS
- All required-attack categories from `CLAUDE_AUDIT_GUIDE.md` were attempted: hash recomputation, deterministic rebuild, archive substitution, tag movement, tag-object replacement, route/target mismatch, path traversal, malformed/self-promoting observations, secret-scan bypass classes, CI permissions review, operator-friction assessment, and claim-overreach challenges against `DEMONSTRATION.md` and `EXTERNAL_WITNESS_ARCHITECTURE.md`.
- All destructive/adversarial tests ran in throwaway `git clone` copies or standalone temp directories under this session's scratchpad — never against the source repository. Each attack clone was discarded after use; none were pushed anywhere.

## Summary of findings (18 observations, most significant first)

| ID | Classification | Severity | One-line summary |
|---|---|---|---|
| AUDOBS-0011 | SUSPECTED_DEFECT | **HIGH** | Secret scanner silently skips `.env`-named files (empty pathlib suffix) — exactly the file class `.gitignore` calls "secrets and credentials." Demonstrated with synthetic AKIA/sk-ant strings producing zero findings. |
| AUDOBS-0003 | SUSPECTED_DEFECT | MEDIUM | `audit-check` trusts `TARGET.json`'s own declared archive digest with no independent anchor; substituting the archive **and** self-consistently rewriting the declared digest in the same (uncommitted) working tree yields a false PASS. No git-cleanliness check gates this. |
| AUDOBS-0010 | SUSPECTED_DEFECT | MEDIUM | "Byte-identical deterministic rebuild" (DEMO-002) only holds within one toolchain. This environment's rebuild (zlib-ng) reproduces identical *decompressed content* but not identical *archive bytes* vs. the checked-in canonical snapshot. No test/CI step rebuilds-and-compares against the actual checked-in artifact. |
| AUDOBS-0012 | SUSPECTED_DEFECT | MEDIUM | Secret scanner silently skips any file >5MB, with no warning logged that a file was excluded. |
| AUDOBS-0014 | SUSPECTED_DEFECT | MEDIUM | (Source-inspection only, not executed) `github_bootstrap()`'s new-repo path pushes content as part of `gh repo create ... --push`, *before* the PRIVATE-visibility check runs. The visibility guard is unit-tested only as an isolated pure function, not end-to-end. |
| AUDOBS-0016 | PROCESS_CONTRADICTION | LOW | `STATUS.json`/`NEXT_ACTION.md` declare this very audit's remote-push precondition unmet and say "do not start the audit" until it is — yet the audit ran anyway via direct task instruction. |
| AUDOBS-0015 | ASSURANCE_GAP | LOW | `github_bootstrap()` swallows failures (`check=False`) for the Actions-permission lockdown, label creation, and issue creation; failures surface only as buried exit codes in a receipt. |
| AUDOBS-0001, 0002, 0004, 0005, 0006, 0007, 0008, 0009, 0013, 0017 | OBSERVATION / NO_FINDING_WITH_SCOPE | INFO | Positive confirmations: target/tag/archive/route binding holds; archive substitution, tag movement, tag-object replacement, and route/baseline mismatch are all correctly detected and rejected, including under adversarial self-consistent digest patching; path traversal is uniformly rejected across route building, pack verification, and observation ingestion; malformed/self-promoting observations (9 distinct mutations) are uniformly rejected; legitimate append + duplicate rejection + hash-chain tamper detection all work correctly in a clean clone; CI declares least-privilege permissions and pins actions to commit SHAs (authenticity of those SHAs UNABLE_TO_VERIFY, no network); `./nexus next` reliably surfaces one action. |
| AUDOBS-0018 | NO_FINDING_WITH_SCOPE | — | Explicit files-seen / files-not-seen declaration for this run. |

## Key findings in detail

### 1. Secret scanner has two silent, undisclosed blind spots (AUDOBS-0011, 0012)
`scan_secrets()` in `system/nexus_lab/doctor.py` only scans files whose `pathlib` suffix is in a fixed allowlist, or whose name is `nexus`/`.gitignore`/`.gitattributes`. `Path('.env').suffix` is `''` in Python, so **`.env` files are never scanned for secret patterns**, despite `.gitignore` explicitly calling out `.env`/`.env.*` under "Secrets and credentials." I demonstrated this in a throwaway copy of the repo: a force-added `.env` containing synthetic AWS- and Anthropic-style key strings produced **zero** findings from `scan_secrets()`, even though both strings match the tool's own regexes. Separately, any file over 5MB is skipped outright with no warning recorded anywhere in the doctor report — demonstrated the same way with a 6MB file. Both are backstop (defense-in-depth) failures, not primary-control failures — `.gitignore` itself was never bypassed, only the secondary scanner.

### 2. The archive-digest binding is only as strong as working-tree hygiene, and nothing enforces that (AUDOBS-0003)
`EXTERNAL_WITNESS_ARCHITECTURE.md` lists "the archive bytes equal `TARGET.json.target_archive_sha256`" as a required, checked binding. In an isolated clone, I substituted the target archive's bytes **and** rewrote `TARGET.json.target_archive_sha256` to match the forged bytes (both are ordinary tracked files an operator or CI editor could touch without committing). `./nexus audit-check` reported `PASS`. By contrast, the **route-pack-to-target-commit** binding (AUDOBS-0006) *does* independently re-derive `baseline_commit` from `ROUTE.json` and survived the identical style of attack — so the tooling is capable of stronger, self-verifying checks; the archive binding just doesn't use one. `check_audit()`/`verify_repository()` never call the existing `ensure_clean_worktree()` helper, so a dirty/tampered-but-uncommitted working tree is never flagged before being trusted.

### 3. "Byte-identical deterministic rebuild" is environment-dependent (AUDOBS-0010)
Rebuilding `baseline-001` twice in this session produced identical bytes to each other (genuine same-process determinism, matching `test_snapshot.py`'s existing coverage) — but neither rebuild matched the **checked-in** canonical/target archive byte-for-byte, despite the decompressed payload and its manifest hash matching exactly. This environment runs `zlib-ng 1.3.1`, a different DEFLATE implementation than stock zlib is likely to be, which can legitimately produce different (but equally valid) compressed bytes for identical input. No test or CI step actually rebuilds `baseline-001` from the tagged commit and diffs it against the checked-in artifact — `test_snapshot.py` only compares two builds performed in the same process. DEMO-002's phrasing ("byte-identical ZIPs") doesn't scope this to a fixed toolchain, which is exactly the kind of overreach the audit brief asked me to hunt for.

### 4. GitHub bootstrap push-before-visibility-check ordering (AUDOBS-0014, 0015 — source inspection only)
I did not execute `github_bootstrap()` — no `gh` authentication exists in this sandbox, and creating real remote repository/push state is outside a read-only blind audit's scope. From reading `system/nexus_lab/github.py`: for a brand-new repository, `gh repo create ... --push` pushes content as part of the same call that requests `--private`; the `require_private_visibility()` guard only runs afterward via a separate `gh repo view`. `tests/test_github.py` covers only the pure guard functions, not this ordering. Separately, the Actions-permission lockdown PUT and label/issue creation all use `check=False` and fail silently into a receipt field nobody is forced to read.

### 5. Self-declared operator gate was bypassed by task instruction (AUDOBS-0016)
`STATUS.json` reports `current_mode: "R002_AUDIT_READY_LOCAL_NOT_STARTED"` with an open assurance block `R002_REMOTE_PUSH_NOT_YET_RECORDED`, and `NEXT_ACTION.md` literally says "Do not start the audit before the push/tag verification receipt exists." This audit proceeded anyway on direct task instruction. I take no position on which instruction source should have won — that's outside `status_authority: NONE` — but it's a real, observable contradiction between the repo's own stated precondition and what actually happened.

## What worked well (do not lose this in the negative findings above)
Every adversarial attack aimed at the *audit apparatus's core integrity claims* — archive-byte substitution (detected), tag movement (detected), tag-object replacement even with an unchanged target commit (detected), route/target baseline mismatch even under self-consistent digest patching (detected), path traversal across route building/pack verification/observation ingestion (rejected in all 8 tested variants), and 9 distinct malformed-or-self-promoting observation submissions (all rejected) — behaved exactly as documented. The append-only, hash-chained ledger correctly detected both in-place content tampering and line-reordering in a clean isolated clone. This is a materially more adversarially-tested apparatus than the unit test suite alone demonstrates, and it held up on every test except the two archive/rebuild-related gaps above.

## Explicit non-claims of this report
- A passing test or a rejected attack proves only the specific property exercised; it is not a general security or correctness guarantee (per `constitution/AUDIT.md`).
- This is a `SAME_FAMILY_DIFFERENTIAL` review, not independent corroboration from a different model family.
- Several areas were not inspected at all this pass — see AUDOBS-0018's `files_not_seen` for the explicit list (notably `constitution/AUTHORITY.md`, `constitution/PRIVACY.md`, `constitution/EVIDENCE.md`, `constitution/ROUTING.md`, `docs/R001_BUILD_REPORT.md`, and all of `corpus/**`, `domains/**`, `programmes/**`, `registry/**`).
- `github_bootstrap()` findings (AUDOBS-0014, 0015) are static-analysis only; I could not execute that code path.
- CI action-pin authenticity (AUDOBS-0013) is UNABLE_TO_VERIFY — no network access in this sandbox to confirm the pinned SHAs against real upstream `actions/checkout` / `actions/setup-python`.

## Repository state confirmation
```
$ git status --short
(clean)
$ git rev-parse HEAD
084b3b9ee6a1434e38a5bf23eee8266c43b3522d
```
Unchanged from the start of this audit. No file inside the source repository (including `operations/audits/AUD-R002-CLAUDE-BLIND/`) was modified, committed, tagged, or pushed during this run. All 18 observation files were both written to and validated from a temporary directory outside the repository; validation used `--root` pointed at the live repository only to check observations against the real `TARGET.json`/ledger, via `--check-only`, which performs no writes.
