# Publication Checklist — Noted v0.01

This is a GitHub-readiness gate, not a publish authorization.

## Required before public GitHub upload

- Owner reviews this entire bundle for private or sensitive content.
- Owner chooses a license and adds a top-level `LICENSE` file, or explicitly keeps the repository unlicensed/private.
- Owner decides whether AI/governance docs should be public, private, or moved to a separate internal bundle.
- Owner decides whether generated HTML artifacts belong in the public repo or only in GitHub Releases.
- Owner decides whether Fedora installer scripts are public-facing or internal artifacts.
- Sweep 55-R runtime checks are completed or clearly marked pending in the repository status.

## Owner decisions still needed

| Decision | Current state | Required owner action |
|---|---|---|
| License choice | No top-level `LICENSE` file present. | Choose and add a license, or keep publication gated. |
| Governance docs | AI/governance docs are included in this candidate bundle. | Decide public vs private/internal handling. |
| Generated HTML artifacts | Root HTML artifacts and `dist/` are included in delivery ZIPs. | Decide repo commit vs Releases-only handling. |
| Fedora installers | Noted and legacy Nexus installer scripts both exist. | Decide whether these should be public-facing. |
| Runtime attestation | Sweep 55-R runtime is pending/manual. | Run manual checks and attach diagnostics if needed. |

## Technical checks passed in this Builder gate

- `npm ci` passed from the existing lockfile.
- `npm run typecheck` passed.
- `npm run build` passed.
- Required publication scans were run and interpreted.
- Package manifests remained unchanged.

## Runtime checks still required

No new runtime functionality was introduced by Sweep 55-G. The pending Sweep 55-R runtime checks remain:

1. Prompt Studio first-block title flow.
2. Canvas zoom controls, Map/Layers defaults, and React Flow attribution removal.
3. ScratchDrawer banner/tabs/open-height behavior.

## Known naming debts / legacy names

- Storage compatibility still uses `verse-studio:*` keys.
- Some root scripts/docs retain `nexus-notes` names for historical installer/reference compatibility.
- The returned ZIP root has been renamed to `noted-v0.01-sweep55G/`, but legacy files are not broadly renamed in this gate.

## Known dependency audit findings

`npm audit --audit-level=moderate` reports existing moderate findings in the Vite/esbuild chain. This sweep does not authorize dependency changes or `npm audit fix`.

## Files/folders to consider excluding later

- `dist/` if generated outputs are moved to Releases.
- Root generated HTML artifacts if Releases-only distribution is preferred.
- AI/governance docs if the owner wants a public-user-only repo.
- Legacy Nexus installer scripts/docs if installer identity is cleaned in a later authorized sweep.

## Suggested first GitHub commit message

```text
Prepare Noted v0.01 GitHub readiness candidate
```

## Sweep 56 gate note

Sweep 56 adds product functionality after the GitHub-candidate gate. It does not authorize publication, release, license selection, or dependency/security finalization. Before any public upload, the owner still needs to decide how AI Brief Export should be described publicly and whether generated `noted-ai-brief-*.json` files should be explicitly excluded from user checkouts/releases.
