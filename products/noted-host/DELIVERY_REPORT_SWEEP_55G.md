# DELIVERY_REPORT_SWEEP_55G — GitHub Readiness Gate for Noted

## FOR AI

BOOT-SEQUENCE-ACTIVE v1

### 1. Technical summary

Sweep 55-G prepared a GitHub-candidate source bundle for Noted without changing app behavior. Added public-facing docs, a repo `.gitignore`, publication checklist, source/artifact manifest, security/publication review, and this delivery report. Updated governance/state docs with the GitHub-readiness canon and evidence limits.

No UI, route, selector, DB/schema, storage-prefix, package manifest, dependency, migration, auth/privacy, diagnostic exporter, or build identity changes were made.

### 2. Archive/waiver status

No external archive was required by the Orchestrator packet. The supplied Sweep 55-R returned ZIP was used as source of truth. Existing governance docs did not contradict the packet on product identity or storage identity.

### 3. Files concerned

| File/path | Status | Purpose |
|---|---|---|
| `README.md` | added | GitHub-native technical orientation. |
| `NOOB_GUIDE.MD` | added | Beginner/non-technical guide. |
| `.gitignore` | added | GitHub-oriented ignore rules. |
| `.env.example` | added | Explicitly documents no env vars required for normal local dev. |
| `PUBLICATION_CHECKLIST.MD` | added | Owner-facing pre-publication gate. |
| `PUBLIC_REPO_MANIFEST.MD` | added | Source/generated/governance/installer classification. |
| `PUBLICATION_SECURITY_REVIEW.MD` | added | Scan interpretation and publication security result. |
| `DELIVERY_REPORT_SWEEP_55G.md` | added | Builder delivery report. |
| `PREFLIGHT.MD` | updated | Sweep 55-G canon/state note. |
| `AI_README.MD` | updated | Sweep 55-G maintainer note. |
| `AI_CODEBASE_HANDOFF.MD` | updated | Sweep 55-G handoff note. |
| `CONTROL_ROOM_STATE.MD` | updated | Retired-file informational note only. |
| `LANDMINES.MD` | updated | Publication gate landmines. |
| `HANDY_LESSONS.MD` | updated | Sweep 55-G lesson/canon note. |
| `dist/`, `noted-v0.01.html`, `verse-studio.html` | regenerated | Build output from `npm run build`. |

### 4. Protected invariants

- `package.json` remains `private: true` and package manifests are unchanged.
- `DB_VERSION = 10` and `SCHEMA_VERSION = 9` remain unchanged.
- `noted-v0.01` app identity remains protected.
- `verse-studio:*` storage prefixes remain protected.
- No routes/endpoints/selectors/UI behavior were changed.
- Diagnostic/export verification infrastructure was not changed.
- No dependencies or lockfile changes were made.

### 5. Evidence requested by Orchestrator

- Public-facing docs added and kept separate from AI/governance docs.
- Publication checklist includes owner decisions: license, governance doc visibility, generated HTML policy, Fedora installer policy, runtime attestation.
- Manifest classifies source, build tooling, generated outputs, installers, AI/governance docs, verification scripts, and icons/assets.
- Security scan run and interpreted: no unhandled credential/private-content finding identified.
- Typecheck/build passed.
- Audit run and existing findings recorded without fixes.
- Returned bundle uses `noted-v0.01-sweep55G/` top-level folder and `noted-v0.01-sweep55G-github-readiness-candidate.zip` filename.

### 6. Commands run and results

```bash
npm ci
```

Result: PASS.

```text
added 166 packages, and audited 167 packages in 11s

25 packages are looking for funding
  run `npm fund` for details

2 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

```bash
npm run typecheck
```

Result: PASS.

```text
> noted@0.0.1 typecheck
> tsc --noEmit
```

```bash
npm run build
```

Result: PASS.

```text
> noted@0.0.1 build
> vite build && node pack.js

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 282 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                 [39m[1m[2m  3.53 kB[22m[1m[22m[2m │ gzip:   1.41 kB[22m
[2mdist/[22m[2massets/[22m[35mstyle-i_N973ii.css  [39m[1m[2m 50.55 kB[22m[1m[22m[2m │ gzip:   9.45 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-CCe3378h.js   [39m[1m[2m815.07 kB[22m[1m[22m[2m │ gzip: 224.80 kB[22m
[32m✓ built in 5.73s[39m
OK  verse-studio.html + noted-v0.01.html  (849.2 KB)
```

```bash
npm audit --audit-level=moderate
```

Result: EXPECTED NONZERO / EXISTING FINDINGS RECORDED. No fix run.

```text
# npm audit report

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vite@8.0.14, which is a breaking change
node_modules/esbuild
  vite  <=6.4.1
  Depends on vulnerable versions of esbuild
  node_modules/vite


2 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force
EXIT:1
```

```bash
rg -n "Noted is a private knowledge foundry|private knowledge foundry|local-first" README.md NOOB_GUIDE.MD PUBLICATION_CHECKLIST.MD
```

Result: PASS. Hits found in `README.md` and `NOOB_GUIDE.MD`.

```bash
rg -n "LICENSE|license" README.md PUBLICATION_CHECKLIST.MD PUBLIC_REPO_MANIFEST.MD
```

Result: PASS. License gate references present; no license claim made.

```bash
rg -n "DB_VERSION|SCHEMA_VERSION" src/db.ts src/types.ts src/appMeta.ts
```

Result: PASS. `src/db.ts` still reports `SCHEMA_VERSION = 9` and `DB_VERSION = 10`.

```bash
rg -n "verse-studio:|noted-v0.01" src electron *.MD
```

Result: PASS. Existing protected storage/app identity references remain present and documented; no renames performed.

```bash
rg -n --hidden -S "(api[_-]?key|secret|token|password|passwd|OPENAI|ANTHROPIC|GEMINI|GOOGLE|AWS_|PRIVATE KEY|BEGIN RSA|BEGIN OPENSSH|sk-[A-Za-z0-9]|github_pat|ghp_)" . -g '!node_modules' -g '!dist' -g '!*.html' -g '!package-lock.json'
```

Result: REVIEWED. No real credential/private key/token values found. Hits are false positives from theme token terminology, tokenizer/search variable names, prompt token estimates, and this review's wording.

```bash
rg -n --hidden -S "(TODO|FIXME|HACK|XXX|personal|private|confidential|do not publish|localhost|127\.0\.0\.1)" . -g '!node_modules' -g '!dist' -g '!*.html' -g '!package-lock.json'
```

Result: REVIEWED. Hits are expected local verification `127.0.0.1`, intentional `private: true`, product positioning "private knowledge foundry", and publication-gate language. No unhandled blocker found.

```bash
find . -maxdepth 3 -type f | sort
find . -maxdepth 2 -type f | sort
```

Result: RUN. Full terminal output included many `node_modules` files because `npm ci` had been run. `PUBLIC_REPO_MANIFEST.MD` includes a clean pre-install top-level inventory snapshot.

### 7. Package/dependency status

`package.json` and `package-lock.json` are unchanged by hash comparison. No dependency changes were made. `npm audit --audit-level=moderate` reports the existing Vite/esbuild moderate advisory chain; fixes would require a breaking Vite upgrade and were not authorized.

### 8. Build identity/hash if relevant

Build identity/hash logic was not changed.

Generated root HTML SHA-256:

```text
c0c528c26e7b30c35565c6ad68d18c0991bc4ca0babc64ae65fe6e6954afb54d  noted-v0.01.html
c0c528c26e7b30c35565c6ad68d18c0991bc4ca0babc64ae65fe6e6954afb54d  verse-studio.html
1a67369b45cd1b8a0c5189334c3e53ad8f87a71db8b2a26dcc864c3ff6d6f3ed  noted-v0.02.html
```

### 9. Runtime status

No new runtime behavior was introduced by Sweep 55-G. Runtime status remains: **Runtime pending / manual verification required** for Sweep 55-R UI behavior.

### 10. Risks/deferred items

- License choice remains unresolved.
- Owner must decide whether AI/governance docs should be public.
- Owner must decide whether generated HTML artifacts belong in the public repo or only Releases.
- Owner must decide whether Fedora installer scripts are public-facing or internal artifacts.
- Existing moderate dependency audit findings remain unresolved by authorization boundary.
- Sweep 55-R runtime checks remain pending/manual.
- Legacy `nexus-notes` installer/docs remain naming debt and were documented, not renamed.

### 11. Runtime/manual instructions

For GitHub readiness, owner/human should review:

1. README voice and public positioning.
2. License decision.
3. AI/governance docs public/private handling.
4. Generated HTML commit vs Releases-only policy.
5. Fedora installer public/internal policy.
6. Sweep 55-R runtime checks: Prompt Studio title flow; Canvas zoom/map/layers/attribution behavior; ScratchDrawer banner/tab behavior.

### 12. Artifact bundle contents and path/name

Bundle target: `noted-v0.01-sweep55G-github-readiness-candidate.zip`.

Final ZIP SHA-256 is reported in chat after archive creation; embedding it here would change the archive hash.

Top-level folder: `noted-v0.01-sweep55G/`.

Expected included contents:

- project source in scope;
- generated outputs (`dist/`, root HTML artifacts);
- public docs and governance docs;
- installer scripts/docs;
- verification scripts;
- `DELIVERY_REPORT_SWEEP_55G.md`.

## FOR HUMAN

This gate prepares Noted for owner review as a possible GitHub source repository. It adds a README, beginner guide, publication checklist, repo manifest, security review, `.gitignore`, and governance notes.

It does not publish anything, does not choose a license, does not change app behavior, and does not claim runtime verification.

Next actions:

1. Read `README.md` and `NOOB_GUIDE.MD` for tone and public positioning.
2. Choose a license or keep the repo unpublished/unlicensed.
3. Decide whether AI/governance docs belong in a public repo.
4. Decide whether generated HTML files should be committed or attached only to Releases.
5. Decide whether installer scripts should be public-facing.
6. Run/relay the remaining Sweep 55-R manual runtime checks and export diagnostics if needed.
