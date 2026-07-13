# Private GitHub bootstrap

The repository includes a guarded bootstrap command but does not embed credentials.

## Preconditions

- GitHub CLI installed;
- operator authenticated with `gh auth login`;
- permission to create or administer the chosen repository;
- a clean working tree and completed local verification;
- no active typed assurance block targeting `github-bootstrap`.

## Command

```bash
./nexus github-bootstrap --repo-name nexus-research-lab
```

## Safety order

The command:

1. verifies the local repository and clean working tree;
2. when no `origin` exists, creates an empty GitHub repository with `--private` **without** `--push`;
3. queries GitHub and refuses to proceed unless visibility is reported as `PRIVATE`;
4. requests read-only default Actions workflow-token permissions;
5. stops before pushing and writes a `FAILED` receipt if that required permission request fails;
6. only after those checks, pushes `main` and tags;
7. attempts optional label and audit-issue setup;
8. returns `PARTIAL` with explicit warnings if optional setup fails;
9. records `operations/receipts/GITHUB_BOOTSTRAP_RECEIPT.json` locally.

The GitHub CLI documents `--push` as the flag that transfers local commits during `gh repo create`. Nexus deliberately omits it from repository creation and performs a separate Git push only after visibility and mandatory permission checks.

## Receipt meanings

- `PASS` — privacy was reported as private, the mandatory permission request returned exit code 0, content was pushed, and optional setup succeeded.
- `PARTIAL` — mandatory checks passed and content was pushed, but one or more optional labels or the audit issue failed. Inspect `warnings`.
- `FAILED` — a mandatory pre-push condition failed. For Actions-permission failure, a receipt is written and no Nexus-managed content push is attempted.

## Limits

The command refuses a remote reported as public. It does not independently attest GitHub's provider-side confidentiality, organization policy, branch rules, administrator actions or future visibility changes. A successful API request is evidence that the CLI call returned exit code 0, not a separate provider-state proof.
