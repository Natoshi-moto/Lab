# R001 threat model

## Protected properties

- exact identity of frozen targets;
- no path traversal when building routes or snapshots;
- audit observations bind to the declared target;
- audit ledgers are append-only and hash chained through the tool;
- secrets and local-only payloads are excluded by default;
- AI instructions cannot self-promote into accepted policy merely by appearing in raw corpus material.

## In-scope threats

- stale or over-broad AI context;
- prompt injection in archived conversations;
- accidental secret commits;
- mutation of audit targets;
- observation records aimed at a different target;
- misleading claims that a passing check proves more than tested;
- accidental creation or use of a public GitHub repository.

## Out of scope for R001

- compromise of GitHub, provider, operating system or user account;
- malicious repository administrators;
- side-channel leakage at an AI provider;
- complete semantic detection of sensitive content;
- cryptographic signing or hardware-rooted identity;
- sandboxing arbitrary untrusted code;
- production availability or disaster-recovery guarantees.
