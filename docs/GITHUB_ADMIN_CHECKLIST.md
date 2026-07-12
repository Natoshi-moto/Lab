# GitHub administrator checklist

The bootstrap command creates or verifies a **private** repository, pushes `main` and tags, requests read-only default Actions permissions, creates audit labels and opens the Claude audit issue.

After bootstrap, verify in GitHub:

- repository visibility is Private;
- only intended accounts and applications have access;
- Actions default token permission is read-only;
- `Nexus Audit` succeeds on `main`;
- `baseline-001`, `preaudit-001`, `preaudit-002` and `handoff-claude-r001` tags exist;
- rules protect `main` from deletion and force-push;
- pull-request review is required for non-operator contributors where the GitHub plan supports it;
- no secret is stored in repository files or workflow YAML;
- the second Claude account can read `AUDIT_START_HERE.md`.

Remote settings are administrative evidence and should be recorded in a later receipt. They are not inferred from local files.
