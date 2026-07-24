# Operator decision cards — July 2026

status_authority: NONE

These cards are separate approvals. A vague “looks good” authorizes none of them.

## Card 1 — Sandbox board merge

Action: merge Experimental-Sandbox PR #2, head 6c41888c2ed363cab9fa866a29aaa758b43069f7, into Sandbox main.

What changes: the Sandbox main branch gains the public board scaffold and two thought entries.

What does not change: Lab main, Lab PRs, Lab credentials, frozen snapshots, tags, and branch settings remain untouched. No Sandbox content becomes canonical.

Public or irreversible effects: the board and entries become public on Sandbox main; GitHub history records the merge and copies may persist even after a revert.

Evidence: PR #2 changed 11 files; Sandbox main verification passes; no obvious secret pattern was found in the inspected content.

Remaining uncertainty: remote branch-protection settings and every claim inside the board thought entry are UNABLE_TO_VERIFY; final merge SHA is unknown until GitHub performs it.

Exact authorization phrase: AUTHORIZE SANDBOX BOARD MERGE

Continuation prompt: “Merge only Experimental-Sandbox PR #2 into Sandbox main. Re-check the resulting SHA and public-content scan. Do not touch Lab.”

## Card 2 — Lab board pointer merge

Action: merge Lab PR #111, head 47578a86e41267a2aa41c523b3b4297bd6d3becb, after Card 1 is complete.

What changes: Lab board scaffold files are replaced by a pointer to the live Sandbox board.

What does not change: Lab STATUS, NEXUS, constitution, snapshots, tags, receipts, and accepted product code remain untouched; no Sandbox content is copied into Lab.

Public or irreversible effects: the old Lab board paths become pointer content on public main; the merge is recorded and the old bytes remain in Git history.

Evidence: PR #111 changes only 10 board files; its head resolves; it overlaps Sandbox #2 as intended.

Remaining uncertainty: branch protections and post-Card-1 mergeability are UNABLE_TO_VERIFY; the PR was based on an older main and must be rechecked.

Exact authorization phrase: AUTHORIZE LAB BOARD POINTER MERGE

Continuation prompt: “After confirming Sandbox PR #2 is merged, re-check Lab PR #111 against current main, then merge only PR #111. Do not close or delete anything.”

## Card 3 — Promotion gate repair and eventual merge

Action: repair Lab PR #110 so it fails closed, then consider merging the corrected head.

What changes: the workflow and accompanying promotion contract would require complete provenance/authority/scope/evidence/operator metadata and prevent automatic promotion claims.

What does not change: no Sandbox content is promoted automatically; no credentials are granted; no frozen target or status authority changes.

Public or irreversible effects: a merged workflow becomes part of Lab's public control plane and may gate future PRs; mistakes could block or misclassify future work.

Evidence: current head checks only origin/SHA/tag equality and misses required fields and immutability.

Remaining uncertainty: exact remote protection and all repository workflows are not fully verified; repair scope needs a fresh diff.

Exact authorization phrase: AUTHORIZE PROMOTION GATE MERGE

Continuation prompt: “Prepare and run the negative-test repair for Lab PR #110. Show me a new decision card for the corrected head; do not merge until I say AUTHORIZE PROMOTION GATE MERGE.”

## Card 4 — Close superseded PR #113

Action: close Lab PR #113 as partly superseded by merged PR #114.

What changes: PR #113's open state becomes closed; its branch and commits remain unless separately deleted.

What does not change: no files, commits, tags, or accepted state are deleted or rewritten. The three unique publication files remain available on the branch.

Public or irreversible effects: the PR conversation state changes publicly and closing may affect workflow/index views; reopening is possible, but not all external copies can be retracted.

Evidence: 15 of 18 changed paths are already in current main through #114; three publication/index files are unique and flagged sensitive.

Remaining uncertainty: whether the operator wants those three unique publication files published later.

Exact authorization phrase: AUTHORIZE CLOSE PR 113 AS SUPERSEDED

Continuation prompt: “Close only Lab PR #113 with the prepared supersession comment. Do not delete its branch.”

## Card 5 — Corrected owner gate merge

Action: apply the minimal wording correction to PR #112 and, only after review, merge the corrected PR.

What changes: policy text distinguishes non-accepted state from public exposure and lists all outward/irreversible actions.

What does not change: constitution, STATUS authority, canonical snapshots, and merge authorization rules remain higher authority.

Public or irreversible effects: the policy becomes public Lab process guidance and may shape later agent/operator decisions.

Evidence: current PR #112 explicitly says drafts are always safe; this is false under a public repository and the requested invariants.

Remaining uncertainty: exact wording accepted by the operator and whether GitHub reports the corrected PR mergeable/check state.

Exact authorization phrase: AUTHORIZE OWNER GATE MERGE AFTER CORRECTION

Continuation prompt: “Review the minimal corrected PR #112 diff. Do not merge until I say AUTHORIZE OWNER GATE MERGE AFTER CORRECTION.”

## Card 6 — Personal learning record

Action: merge Lab PR #109, which contains a personal learning record.

What changes: one personal-content document becomes accepted Lab main content.

What does not change: no other PR or file is merged; no status or snapshot changes are implied.

Public or irreversible effects: personal material is already on a public branch/PR and would become part of accepted main; copies may persist.

Evidence: PR body explicitly identifies personal content and says it is held for an explicit operator nod.

Remaining uncertainty: I have not reproduced or quoted the personal content; only the minimum privacy fact is recorded.

Exact authorization phrase: AUTHORIZE MERGE PR 109 PERSONAL LEARNING RECORD

Continuation prompt: “If and only if I say AUTHORIZE MERGE PR 109 PERSONAL LEARNING RECORD, re-open the privacy review and merge only PR #109.”

## Card 7 — Branch deletion candidates

Action: delete only the branches listed as SAFE_DELETE_CANDIDATE in BRANCH_INVENTORY.md, after a fresh ref/ancestry check.

What changes: selected remote branch refs are deleted.

What does not change: commits reachable from main, tags, PR conversations, files, Lab/Sandbox main, and all branches not listed remain untouched.

Public or irreversible effects: branch names and direct reachability disappear; commits may remain reachable from merges/PRs but deletion is not fully reversible without another ref.

Evidence: each listed candidate had a merged PR, tip ancestor of cached main, and zero unique files in the cached three-dot comparison.

Remaining uncertainty: the fetch was blocked, so the remote must be rechecked immediately before deletion; never use this card based only on the cached inventory.

Exact authorization phrase: AUTHORIZE DELETE MERGED BRANCHES LISTED IN CARD 7

Continuation prompt: “Fresh-fetch both repositories. Show the exact candidate list and current SHAs again. Delete only the branches I explicitly confirm from that refreshed list.”

## Not an authorization card: Hermes

Hermes remains the first post-housekeeping experiment candidate, but this operation did not install or execute it. Any future install, API-key configuration, model pull, terminal-control integration, or external write needs a new plain-language card after PR #3 documentation is corrected.
