# ORCH-001 T1 green verification receipt

- Date: 2026-07-22
- Task: `ORCH-001-T1-GREEN-VERIFY`
- Seat: `SEAT-CODEX-IMPLEMENT`
- Branch: `codex/orch-001-t1-green-verify`
- Base `main` SHA: `7026b66247f6989ec64e9eeef2d509bbbfc0ef54`
- Verification HEAD SHA: `7026b66247f6989ec64e9eeef2d509bbbfc0ef54`
- Receipt-containing proposal HEAD: reported by the PR and final operator handoff; a commit cannot embed its own SHA in its contents.
- Status authority: `NONE`

## Commands executed

```text
git fetch origin
git checkout main
git pull origin main
git checkout -b codex/orch-001-t1-green-verify
npm ci
./nexus doctor
./nexus verify
python3 -m unittest discover -s tests -v
```

The optional `products/noted-host` install and typecheck were not run.

## Outcomes

| Check | Outcome | Detail |
|---|---|---|
| Root `npm ci` | PASS | Added 1 package; audited 2 packages; 0 vulnerabilities reported; lockfile unchanged. |
| `./nexus doctor` | PASS | All reported doctor checks passed. |
| `./nexus verify` | PASS | Overall verifier status was `PASS`. |
| Unit tests | PASS | Ran 190 tests; 0 failures; 0 errors. |
| Noted-host typecheck | SKIPPED | Optional step was not run to keep this environment-restore task minimal. |

The unit run emitted a duplicate-ZIP warning and several unclosed-SQLite `ResourceWarning`s. They did not fail the suite. No product or test logic was changed because such changes are outside this task's declared write scope.

## Files actually inspected

- `AGENTS.md` (instructions supplied for this repository)
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

`corpus/raw/**` was not inspected. The repository's current control-plane pointers were observed as older campaign state and were deliberately not edited because ORCH-001 T1 forbids control-plane resynchronization.

## Non-claims

- Green checks do not establish security, privacy, semantic correctness, production readiness, or safety for money.
- This receipt and its proposal have `status_authority: NONE`; accepted Lab state changes only through human-authorized merge.
- Multi-model agreement is not proof, and same-provider accounts are not automatically independent corroboration.
