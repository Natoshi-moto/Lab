# Verification report — housekeeping controller

status_authority: NONE

## Repository-prescribed verification

See BASELINE_REPORT.md for the full command/exit record. The decisive limitation is pre-existing Lab dependency absence: @noble/ed25519 is not installed in the isolated worktree, causing 11 R013/R015/R016 tests to fail or error and causing ./nexus verify to exit 2. Sandbox main passes its documented checks. No dependency installation or test repair was attempted.

## PR #110 adversarial review

The proposed workflow has read-only contents permission and no merge or status mutation step. It checks a Change-Origin line, a 40-character Sandbox-Commit, a Sandbox-Tag, and current git ls-remote equality. It does not fail closed on missing authority, allowed scope, evidence class, explicit non-claims, operator decision, canonical-status claims, or test-as-proof claims. It does not prove tags are immutable, distinguish annotated tag object SHA from peeled commit SHA, verify the package commit is the inspected tree, or prevent a branch from changing after package creation when the declared tag remains unchanged. Bot PRs are explicitly exempted by inferred origin. Documentation is not enforcement.

Negative-case results from isolated shell simulation of the extracted checks:

- Missing origin: rejected.
- Missing Sandbox commit/tag for Sandbox-origin path: rejected.
- Wrong SHA or tag resolving elsewhere: rejected when the live resolution differs.
- Missing authority: accepted by the current workflow — defect.
- Canonical-status claim in otherwise valid LAB_INTERNAL body: accepted — defect.
- Test result presented as proof: no check exists — defect.
- Attempted automatic Lab write: workflow token is contents: read, but the repository-wide absence of every other write path is UNABLE_TO_VERIFY.
- Sandbox branch changed after package creation: branch identity is not checked; only current tag resolution is checked — defect.

Verdict: BLOCKED, repairable. Do not merge #110. A repair must require all declared metadata, use immutable commit identity and explicit operator decision, fail closed, and retain no Sandbox-held Lab credential or automatic merge/status path.

## Board move review

Sandbox #2 contains one live board candidate and public thought entries. Lab #111 removes the old board files and leaves a pointer. Safe order is: first operator-authorized Sandbox #2 merge; re-check the resulting Sandbox main and public content; then operator-authorized Lab #111 merge. Expected result is one live board in Sandbox and one historical pointer in Lab. No exact merge SHA can be predicted before GitHub performs the merge. Rollback is a new revert PR in the affected repository, not force-push or history rewrite. Branch-protection differences are UNABLE_TO_VERIFY; no automatic Lab write path was found in Sandbox code, but remote settings remain unresolved.

## PR #112 gate review

The PR correctly says it does not outrank STATUS.json or the constitution and covers merge, approve, publish, push to main, delete and hard-to-reverse actions. It is unsafe as written because it says drafts are always safe and says only the go word changes the record. Public branches/PRs can expose sensitive data, trigger checks or external systems, and be difficult to retract. It also omits release, repository-setting changes, visibility changes, branch/tag deletion, external posting, secret/credential changes and irreversible migrations. Minimal correction required; no current-head merge recommendation.

## PR #8? No — no unrelated PR was changed

The requested privacy-stack comparison is #113 versus merged #114. No existing evidence was rewritten.

## Hermes PR #3 claim classification

No Hermes installer, binary, API key, model pull, terminal multiplexer, or agent was installed or executed by this operation.

| Material claim | Classification | Reason |
|---|---|---|
| Official repository is NousResearch/hermes-agent | VERIFIED_FROM_PRIMARY_SOURCE, as a repo link and official README claim; not installed | Official repository README is available and identifies the project. |
| Hermes licence MIT | VERIFIED_FROM_PRIMARY_SOURCE | Official GitHub README currently states MIT; keep source link in PR. |
| Herdr licence Apache-2.0 | INCORRECT_OR_STALE | Current official Herdr README says AGPL-3.0-or-later plus commercial licensing, not Apache-2.0. |
| Hermes install source/domain | VERIFIED_FROM_PRIMARY_SOURCE for the official repo's linked installer; installer safety itself UNVERIFIED | The PR documentation says the installer was read, but this operation did not fetch or execute it. |
| DeepSeek base URL and current model names | VERIFIED_FROM_PRIMARY_SOURCE | Current DeepSeek docs list https://api.deepseek.com and deepseek-v4-flash/deepseek-v4-pro; legacy names retire at 2026-07-24 15:59 UTC. Re-check before any future run. |
| Ollama OpenAI compatibility | VERIFIED_FROM_PRIMARY_SOURCE | Ollama documents /v1 compatibility, but this operation did not contact a local Ollama server. |
| DeepSeek + Ollama dual-provider config in Hermes | PROPOSED_ARCHITECTURE | Documentation indicates provider slots, but no install/config smoke test was run here. |
| Herdr identity, integration and exact detection registry | INCORRECT_OR_STALE / UNVERIFIED | PR text reports an installed binary and a no-Grok registry; current official README lists Grok CLI support, while the PR's own files disagree. |
| Claude Code and Codex alongside Hermes | PROPOSED_ARCHITECTURE | The composition is plausible and documented, not verified in this operation. |
| xAI/Grok tooling identity | UNVERIFIED_EXPECTATION | VERIFY_FIRST explicitly leaves the xAI tool unresolved; no exact binary/source is bound. |
| Desktop/browser/terminal-control claims | SEARCH_SUMMARY_ONLY / PROPOSED_ARCHITECTURE | Herdr is a terminal multiplexer; desktop/browser control and integrations are not verified here. |
| Security/isolation claims | UNVERIFIED_EXPECTATION | Read-only/no-credential claims are docs and proposed boundaries, not a security audit. |
| Results file says installed and working | TRANSCRIPT_ONLY / INCORRECT_OR_STALE relative to the PR's README/WHITEPAPER | The branch internally contradicts itself: README/RESULTS/HANDOFF say installed, while WHITEPAPER says proposal-only and BUILD_PLAN says pending. The operation deliberately did not resolve this by executing anything. |

Required prominent statement for PR #3:

> Design candidate. Nothing installed. Nothing operationally verified.

The current PR does not consistently carry that statement because README and RESULTS assert installation/operation. Keep PR #3 blocked until documentation is corrected on the PR branch and primary-source citations are stable. Do not merge.

## Final safety checks completed after report creation

- git diff --check — exit 0; added-file trailing-whitespace scan found no matches.
- ./nexus doctor — exit 0; expected WORKTREE_DIRTY warning because this report pack is untracked.
- Repository secret-pattern scan — PASS; no private-key/token/password patterns found in added files.
- Explicit local-path scan — no /home/anon, /tmp, file:// or token-like paths found in added files.
- Frozen-path diff check — no snapshots/, constitution/, STATUS.json, NEXUS.json, operations/receipts/, operations/merge_authorizations/ or hash files changed.
- No PR merged or closed, no branch/tag deleted, no settings changed, no direct push performed — confirmed by connector/local status.
