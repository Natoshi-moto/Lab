# Personal blind map — Codex

- **MAIN_SHA:** `83761fa251c89889a5f127a05d5e5594b8cb0210`
- **DATE_UTC:** `2026-07-22T07:32:40Z`
- **status_authority:** `NONE`

## 1) Where the project is (10 bullets max)

- Current `main` is in `REORIENTATION_POST_EPISODE`, round `R016`; there are no active tasks recorded in `STATUS.json`.
- The operator-side epistemic emergency is recorded as closed, but the product/research halt remains the default until the operator writes a formal lift.
- The three-seat emergency truth audit, its aggregate, the post-audit unseal, and Whoopsie 08 are recorded as complete; their agreement is explicitly not independent corroboration.
- The aggregate and operator self-diagnosis align on the broad shape: flow-state/multi-terminal control weakened, presentation drift occurred, and CARD-11 was intentional research evidence rather than the original terror object.
- No inspected record establishes malicious misconduct; that is not a finding of innocence.
- Noted remains research software, not a bank, wallet, custody product, certified secure system, or trust-bearing product.
- Session 2 converted T-01 from an expected/source-traced risk into an `EXECUTED` FAIL on a throwaway dev-server profile: the same-origin Agent iframe read and wrote host storage without the bridge.
- CARD-11 recorded an `EXECUTED` FAIL for plaintext provider-key persistence in the observed pre-activation state; normal-UI reachability of that state and the activated path were not live-tested there.
- The current control plane records zero open defect/assurance blocks, but also explicitly lists material reds; zero counters are not evidence that the product is safe.
- `STATUS.json` says sync/backup is pending, while `operations/receipts/BACKUP_20260722/RECEIPT.md` records a dual-drive backup. The receipt is newer evidence of performance, but I did not inspect either archive, so backup integrity beyond the receipt is `UNABLE_TO_VERIFY`.

## 2) What is red / open

| Rank | Red / open item | Current evidence and boundary |
|---:|---|---|
| 1 | Product/research halt | Still default. No new break work, fixes, phase promotion, or launch-shaped work is authorized without a formal operator lift. |
| 2 | T-01 / G-01 | T-01 is `EXECUTED` FAIL on the dev server: the same-origin iframe could read/write host `localStorage` and open host IndexedDB. G-01 remains red because this is not yet a rerunnable green security case. Built-output parity was not established by CARD-04. |
| 3 | CARD-11 pre-activation persistence | Synthetic provider key was stored verbatim in IndexedDB and localStorage through the persistence API. Normal UI reachability before activation remains unverified; the activated ciphertext path was source-traced but not live-tested. |
| 4 | Supply/network membrane | Unpinned public CDN and silent default proxy paths remain recorded. The inspected materials do not close them. |
| 5 | Browser/message membrane | No CSP and forgeable receipts remain recorded reds. Wildcard `postMessage` targets were found; separate bridge checks do compare `event.source`, so “no check at all” is inaccurate. |
| 6 | Evidence/control bus | Multi-seat agreement is correlated, historical executed-run authenticity was not rerun, and the aggregate records a flow-state delegation weakness. |
| 7 | Status staleness | `STATUS.json` still says backup pending despite a backup receipt merged in the same control-plane update. |

## 3) What is already done

| Item | What the inspected current-main record supports |
|---|---|
| Foundation cycle | Recorded operational; baseline `baseline-001` remains an immutable `CANONICAL_AS_IS` historical target, not a correctness claim. |
| Emergency truth audit | Claude, Codex, and Grok responses plus aggregate are on main; aggregate preserves disagreements and non-independence. |
| Unseal / operator resolution | Recorded complete after the blind seats filed; the aggregate compares the sealed self-diagnosis to their reports. |
| T-06 quarantine | Session 1 records the current launch-path check passing for removal of Agent v0.12; old bytes remain in Git history. |
| Session 1 mapping | CDN, default proxy, and wildcard `postMessage` findings were recorded; the sampled diagnostic export was clean that day, with residual allowlist risk. |
| Session 2 mapping | CARD-04 and CARD-11 FAIL receipts are on main, alongside deeper bridge results; no fix is implied. |
| Backup | A receipt records two identical-hash full-tree archives created at `2026-07-22T07:29:38Z`; archive existence/content was not independently inspected by this seat. |
| Permanent distrust register | `WHY_NOT_TO_TRUST_THIS_PROJECT.md` is load-bearing and explicitly remains applicable even if bugs close and tests pass. |

## 4) Sane next single tasks (max 5, ranked)

| Rank | One bounded task | Why this is sane now |
|---:|---|---|
| 1 | Reconcile the control-plane backup status in one documentary-only task. | Removes the concrete `STATUS.json` / backup-receipt contradiction without touching product state. |
| 2 | Operator chooses whether to keep the default halt or writes the short formal lift. | This is the authority boundary for any resumed build/break work and cannot be supplied by an AI seat. |
| 3 | If lifted, make session-close status reconciliation the first process task. | Directly addresses the observed multi-terminal/flow-state weakness before increasing technical velocity. |
| 4 | If lifted, convert the already-developed Fable card improvements into one bounded runbook task. | Improves repeatable adversarial procedure without claiming a product fix. |
| 5 | If lifted and only after the process task, commission one T-01 fix-and-rerun task with dev/build parity and the same falsifiable probe. | Targets the highest red while preserving probe → fix → same-probe evidence discipline. |

## 5) What I did not verify

- I did not open any `corpus/local-only/` path, sealed payload, raw conversation, or `corpus/raw/**` content.
- I did not inspect the backup archives at `/mnt/games/...` or `/mnt/backup/...`; their existence, bytes, inclusion set, and recoverability are `UNABLE_TO_VERIFY` beyond the receipt.
- I did not rerun CARD-04, CARD-11, any historical break probe, or any claimed historical execution.
- I did not inspect the throwaway Playwright scripts or screenshots referenced by the card receipts.
- I did not test built `dist/` parity, browser variance, CSP behavior, CDN integrity, proxy traffic, receipt forgery, activated-key encryption, or normal-UI pre-activation key reachability.
- I did not inspect every receipt in `BREAK_SESSION_20260722`; I inspected the receipt listing/summary, session note, CARD-04, CARD-11, next note, and seat-routing note.
- I did not inspect the three individual emergency audit responses or Whoopsie 08; I inspected their aggregate only.
- I did not verify remote branch protections, GitHub administrative controls, legal claims, cryptographic soundness, or production suitability.
- I did not run the standard checks because this task commissioned a personal current-state map, not implementation or verification; therefore their current result is `UNABLE_TO_VERIFY` in this response.

### Files actually inspected

- `AGENTS.md`
- `README_START_HERE.md`
- `STATUS.json`
- `STATUS.md`
- `NEXT_ACTION.md`
- `AUDIT_START_HERE.md`
- `constitution/AUDIT.md`
- `constitution/AUTHORITY.md`
- `constitution/CANONICALITY.md`
- `constitution/EVIDENCE.md`
- `constitution/MUTATION.md`
- `constitution/PRIVACY.md`
- `constitution/ROUTING.md`
- `operations/handoffs/PERSONAL_BLIND_MAP_001.md`
- `operations/handoffs/EMERGENCY_TRUTH_AUDIT_001_AGGREGATE.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-RESULTS.md`
- `operations/receipts/BREAK_SESSION_20260722/SESSION.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-04.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-11.md`
- `operations/receipts/BREAK_SESSION_20260722/NEXT.md`
- `operations/receipts/BREAK_SESSION_20260722/SEAT_ROUTING_NOTE.md`
- `operations/receipts/BACKUP_20260722/RECEIPT.md`
- `operations/break-prep/ORCH_001_BREAK_RUNBOOK.md` (skimmed, with CARD-04/CARD-11 and filing/non-claim sections inspected)
- `WHY_NOT_TO_TRUST_THIS_PROJECT.md` (skimmed)

Repository existence, search hits, and filenames listed by `find` are not represented here as inspected content. Constitution schema files were enumerated and partially emitted by a truncated command; they are not relied upon or claimed as fully inspected.

## 6) Non-claims

- This is a personal orientation map for the Natoshi-moto/Lab operator only.
- `status_authority: NONE`.
- Not a security certificate, safety finding, launch recommendation, fix, authorization, or promotion.
- No independence claim; this Codex seat is another correlated AI reviewer, not independent corroboration.
- No claim that silence, zero block counters, merged receipts, green checks, or multi-seat agreement establish correctness.
- No claim that CARD-04 or CARD-11 generalizes beyond the exact recorded environment and probe boundaries.
- No product code, frozen snapshot, tag, accepted evidence, or sealed/local-only state was changed.
