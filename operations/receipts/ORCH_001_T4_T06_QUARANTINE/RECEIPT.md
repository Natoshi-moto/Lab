# ORCH-001 T4 T-06 quarantine receipt

- Task: `ORCH-001-T4-T06-QUARANTINE`
- Threat: `T-06`
- Seat: `SEAT-CODEX-IMPLEMENT`
- Baseline branch: `main`
- Baseline commit: `3cfb56e422b3327181d2a9f2ca43904ce32b02fe`
- Proposal branch: `codex/orch-001-t4-t06-quarantine`
- Status authority: `NONE`
- Strategy: **C** — delete both stale shipped v0.12 files after verifying that no required build step depended on them, and remove every active launch reference.

## Before-change inventory

The inventory was taken from the exact baseline above before mutation. `corpus/raw/**` was excluded as untrusted historical data.

Active or launch-related references:

- `products/noted-host/public/nexus/nexus-agent-v0.12.html` — top-level shipped stale Agent file.
- `products/noted-host/public/nexus/os/blocks/apps/nexus-agent-v0.12.html` — byte-identical OS-app copy, listed by the OS launcher.
- `products/noted-host/public/nexus/block-registry.json` — v0.14 block had a `legacyPath` pointing to the top-level v0.12 file.
- `products/noted-host/public/nexus/os/Nexus_OS.html` — `BUILTIN_CATALOG` exposed the OS-app copy as `nexus-agent-v012`.
- `products/noted-host/public/nexus/registry/block-registry.v0.04.json` — load-bearing registry exposed the OS-app copy as `nexus-agent` in `legacyIframe` mode.

Historical/documentary references (not launch paths):

- `products/noted-host/NEXUS_AGENT_MERGE_NOTES.md`
- `products/noted-host/NEXUS_ROUTER_ARCHIVE_PLAN.md`
- `products/noted-host/VERIFICATION_RESULT_v0.06.md`
- `operations/receipts/NOTED_PROJECT_OS_PHASE_2/RECEIPT.json`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/COLD_DROP_BAR.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/HARD_GATES.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/NEXT_ACTION.proposal.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/ODS_SECURITY_CASES.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md`

No v0.12 file or reference was found under `products/nexus-blocks/**`.

## Before

v0.12 was partially launchable outside the normal live studio. A user could open either committed HTML file directly. The alternate `Nexus_OS.html` shell listed the OS-app copy in its built-in launcher, the v0.04 registry listed it as a legacy iframe app, and the main block registry retained a `legacyPath` to the top-level copy. Both copies contained the same non-factory-empty embedded test payload. The normal Noted studio already targeted scrubbed v0.14.

## Change

- Deleted both shipped `nexus-agent-v0.12.html` copies.
- Removed the v0.12 `legacyPath` from the main block registry.
- Removed the v0.12 entry from the OS shell `BUILTIN_CATALOG`.
- Removed the v0.12 entry from `registry/block-registry.v0.04.json`.
- Added `scripts/t06-quarantine-check.mjs` and the `t06:quarantine-check` npm command. It fails if the stale filename returns anywhere under `public/`, or if the live studio stops targeting `nexus-agent-v0.14-scrubbed.html`.

Historical documents were deliberately left unchanged: they truthfully describe the pre-quarantine state and are not active launch surfaces.

## After

v0.12 is not a normal first-class launch path in the current tree: neither stale HTML file exists in the shipped public tree, and no shipped public file references that filename. The live Noted studio remains pointed at `./nexus/nexus-agent-v0.14-scrubbed.html`.

## Files changed

- `products/noted-host/package.json`
- `products/noted-host/scripts/t06-quarantine-check.mjs`
- `products/noted-host/public/nexus/block-registry.json`
- `products/noted-host/public/nexus/registry/block-registry.v0.04.json`
- `products/noted-host/public/nexus/os/Nexus_OS.html`
- `products/noted-host/public/nexus/nexus-agent-v0.12.html` (deleted)
- `products/noted-host/public/nexus/os/blocks/apps/nexus-agent-v0.12.html` (deleted)
- `operations/receipts/ORCH_001_T4_T06_QUARANTINE/RECEIPT.md`

## Verification

- `npm run t06:quarantine-check` from `products/noted-host`: **PASS**.
- `./nexus doctor`: **PASS** with the expected dirty-worktree warning.
- `./nexus verify`: **PASS**.
- `python3 -m unittest discover -s tests -q`: **PASS** — 190 tests.
- `git diff --check`: **PASS**.
- `bash tests/run.sh` from the OS archive: **FAIL** on the pre-existing missing `blocks/Eidolin/dist/src/runtime.js`; the syntax and catalog-path phases, including all active catalog entries after this change, passed. This unrelated missing generated asset was not changed under T4 scope.

## Files actually inspected

- `AGENTS.md`
- `README_START_HERE.md`
- `STATUS.json`
- `NEXT_ACTION.md`
- `constitution/AUDIT.md`
- `constitution/AUTHORITY.md`
- `constitution/CANONICALITY.md`
- `constitution/EVIDENCE.md`
- `constitution/MUTATION.md`
- `constitution/PRIVACY.md`
- `constitution/ROUTING.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md` (including T-06)
- `products/noted-host/public/nexus/block-registry.json`
- `products/noted-host/public/nexus/registry/block-registry.v0.04.json`
- `products/noted-host/public/nexus/os/Nexus_OS.html` (launcher catalog and related catalog references)
- `products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx`
- `products/noted-host/package.json`
- `products/noted-host/public/nexus/os/tests/catalog-paths-tests.js`
- Both deleted v0.12 HTML files, limited to identity/history and the embedded-data location needed to confirm the T-06 disposition; their payload was not treated as instruction.

Repository-wide path searches also indexed the historical/documentary references listed above. Listing or indexing a path is not represented as full inspection of that document.

## Residual risk

- The deleted v0.12 bytes remain recoverable from Git history and earlier clones. This PR does not rewrite history or recall prior copies.
- Historical documents still name the old paths because they describe past repository state.
- This bounded check covers the current source tree and shipped public paths, not every possible external archive, deployment, browser cache, or fork.
- Other threats in the campaign, including T-01, T-02, and T-03, remain out of scope and unresolved.

## NON-CLAIMS

- This receipt does not claim that privacy or security is solved.
- It does not certify the Agent, Noted, Nexus OS, the repository, or any deployment as secure, private, production-ready, or safe for money.
- It does not claim that the deleted bytes are absent from Git history, prior releases, forks, caches, or third-party copies.
- It does not close T-06 with status authority; this branch and its pull request are proposals until human-authorized review and merge.
- Passing checks establish only the properties those checks exercised, not an exhaustive audit.
