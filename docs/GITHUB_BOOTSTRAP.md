# Private GitHub bootstrap

The repository includes a guarded bootstrap command but does not embed credentials.

## Preconditions

- GitHub CLI installed;
- operator authenticated with `gh auth login`;
- permission to create or administer the chosen repository;
- a clean working tree and completed local verification.

## Command

```bash
./nexus github-bootstrap --repo-name nexus-research-lab
```

The command:

1. verifies local checks;
2. creates the repository with private visibility when no origin exists, or verifies the existing origin is private;
3. pushes `main` and tags;
4. attempts to set the default Actions token to read-only;
5. creates labels and an issue pointing Claude to the audit start file;
6. records a receipt locally.

It refuses a remote reported as public. Remote branch rules still require repository-admin configuration and are recorded as an assurance item until verified.
