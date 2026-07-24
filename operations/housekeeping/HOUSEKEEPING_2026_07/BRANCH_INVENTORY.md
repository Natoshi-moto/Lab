# Branch inventory — July 2026

status_authority: NONE

This inventory uses the locally cached remote-tracking refs, whose Lab and Sandbox main tips match the GitHub connector baseline. A network fetch was attempted and failed with DNS exit 128, so every row is dated from the cached ref and must be rechecked before any deletion. No branch was deleted.

Ahead/behind means relative to the cached origin/main. Unique files is the changed-file count in the three-dot comparison. A zero does not by itself prove a branch is disposable; the action column also requires PR ancestry/state review.

| Repository | Branch | Latest SHA | Last commit | Associated PR | Ahead/behind | Unique files | Evidence risk | Suggested action |
|---|---|---|---|---|---:|---:|---|---|
| Lab | agent/ctrl-001-control-plane-reconciliation | d2571c28be35a4ade9862ccc06d3cc519753823a | 2026-07-20T06:21:11+01:00 | #25 closed, merged | behind 169, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | agent/experimental-sandbox-promotion-gate | 11a18175537da067bf693d0ea9d777beaf1b0158 | 2026-07-23T18:21:35+01:00 | #110 open | behind 8, ahead 1 | 6 | Potential loss: 1 unique commit(s), 6 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | agent/r012-bounded-work-exchange | f28dc07bf1433bb22e4d992a7f523503387ea445 | 2026-07-13T11:08:13+01:00 | #12 closed, merged | behind 234, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | agent/r012-r013-promotion-closeout | e05c19dbe29bd9f4bb16746b19e92b0c4162dedf | 2026-07-13T14:10:01+01:00 | #15 closed, merged | behind 225, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | agent/r013-pcx-conserved-claim | 616f41ff8fb5b3b217e2287107e9718a8a0ea3bb | 2026-07-13T14:02:52+01:00 | #13 closed, merged | behind 232, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | agent/r014-pcx-durable-replay | 4c82ca8a5aea683fbe500fa0f73108e21bcf67e6 | 2026-07-13T15:00:09+01:00 | #16 closed, merged | behind 223, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | agent/r014-pcx-durable-settlement | b62fef7f267e6d3822b730d3a785fbd75d3c7c44 | 2026-07-13T13:52:08+01:00 | #14 open | behind 233, ahead 1 | 32 | Potential loss: 1 unique commit(s), 32 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | agent/r014-promotion-closeout | d0368261dbc44b9586d14c490c39f0661d6ceda5 | 2026-07-13T15:03:47+01:00 | #17 closed, merged | behind 221, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | agent/r015-pcx-independent-durability-verifier-model | 8558bfb5d74299f6be33b0a785eb16c9b6fa097b | 2026-07-13T16:28:12+01:00 | #18 closed, merged | behind 220, ahead 1 | 29 | Potential loss: 1 unique commit(s), 29 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | agent/r015-promotion-closeout | 3ffcb08309518895affc33d318d962dc14e17709 | 2026-07-13T16:38:55+01:00 | #19 closed, merged | behind 219, ahead 1 | 4 | Potential loss: 1 unique commit(s), 4 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | agent/r016-pcx-integrated-custody-gate | 75343b7f00d4ab38a11086180193b8fd26ccd435 | 2026-07-13T17:57:11+01:00 | #20 closed, merged | behind 178, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | agent/r016-promotion-closeout | 7cdd67c9a984d8016fd1d712d210f99f4b7c30e9 | 2026-07-14T06:38:56+01:00 | #21 closed, merged | behind 173, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | agent/r017-replication-fork-evidence | b8dca0e9be40dedd4f1ba6930ad34caec0167076 | 2026-07-14T07:52:33+01:00 | #22 open | behind 172, ahead 16 | 10 | Potential loss: 16 unique commit(s), 10 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | agent/r018-pq-hybrid-admission | 78dde8674c3e65c709f9075c3bb647d2a0b2e2d1 | 2026-07-15T07:43:19+01:00 | #23 open | behind 172, ahead 50 | 32 | Potential loss: 50 unique commit(s), 32 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | audit/ingest-r002-claude-results | 8739042253ace1c1c144b5a3a4fd790548c061a9 | 2026-07-12T23:54:28+01:00 | #2 closed, merged | behind 314, ahead 2 | 8 | Potential loss: 2 unique commit(s), 8 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | chatgpt/r008-r010-foundation-closeout | 63ee998a0dc7fc9939bea1a03e5944064d3ab163 | 2026-07-13T02:10:19+01:00 | #9 closed, merged | behind 276, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | chatgpt/r011-hard-vertical-slice | 18478e8d608c9e195b5bd4b0fc50d0c8085860f7 | 2026-07-13T06:52:58+01:00 | #10 closed, merged | behind 258, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | chatgpt/r011-promotion-closeout | f671a03447da36a8089367f6c6f78b15950d1989 | 2026-07-13T07:07:22+01:00 | #11 closed, merged | behind 253, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | claude/agent-resources-skills-draft-001 | a4496c95899854956521648783412ccc5638002f | 2026-07-22T11:26:14+01:00 | #94 open | behind 35, ahead 1 | 7 | Potential loss: 1 unique commit(s), 7 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | claude/beneficial-genesis-design-001 | 15df1623eddfaae60d612dd4218759840dabc8a1 | 2026-07-20T20:46:09+01:00 | #27 closed, merged | behind 159, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | claude/bgen-econ-redteam-001 | de5dcd728b9f99966a0fb5b9f37340bf1b830188 | 2026-07-21T12:58:34+01:00 | #35 closed, merged | behind 145, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | claude/external-web-audit-001 | a9255f42fccd506d9f9d417dc7d8f4a08ce9c3a6 | 2026-07-22T17:39:51+01:00 | #95 open | behind 35, ahead 1 | 1 | Potential loss: 1 unique commit(s), 1 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | claude/full-history-review-001 | 5be784b21987e221be44e01168ed19929d69bdad | 2026-07-21T17:58:43+01:00 | #53 closed, merged | behind 135, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | claude/loom-first-proper-chat-001 | 0fcbc5dba4d83e1164e65d3cff2b2cc572af1d98 | 2026-07-22T19:50:59+01:00 | #99 open | behind 35, ahead 1 | 2 | Potential loss: 1 unique commit(s), 2 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | claude/loom-test-c4-001 | ec095332271fae5dd02813e1ecd4ef77bbf5cc0e | 2026-07-22T20:03:28+01:00 | none found | behind 35, ahead 8 | 25 | Potential loss: 8 unique commit(s), 25 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | claude/loom-test-c5-001 | 9e50fd2e5b2a01427927439393149aef081ff5b7 | 2026-07-22T16:20:28+01:00 | none found | behind 35, ahead 1 | 4 | Potential loss: 1 unique commit(s), 4 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | claude/loom-v0-1-park-001 | b6d0a45b1d42a96e9771c7c93f5a0dcf70a8e968 | 2026-07-22T11:03:07+01:00 | #93 open | behind 35, ahead 1 | 2 | Potential loss: 1 unique commit(s), 2 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | claude/noted-adversary-block-001 | 654ca6db234ebc46ea63b9f8e9427fc2feea0322 | 2026-07-22T01:47:03+01:00 | #61 open | behind 97, ahead 1 | 8 | Potential loss: 1 unique commit(s), 8 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | claude/pub-build-plan-roadmap-001 | 1d2d6267200420dd26613f96b47ea73013f7019b | 2026-07-22T20:03:38+01:00 | #100 open | behind 29, ahead 1 | 2 | Potential loss: 1 unique commit(s), 2 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | claude/pub-noted-frontend-privacy-assault-001 | 964ba1482206aa204f6f51f5922d1d1f2a43bb76 | 2026-07-23T20:06:04+01:00 | #113 open | behind 8, ahead 3 | 28 | Potential loss: 3 unique commit(s), 28 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | claude/r005-retest-20260713 | 69ce3c120cfc1c11f45d711a573e184f92675798 | 2026-07-13T01:03:04+01:00 | #7 closed, merged | behind 310, ahead 1 | 1 | Potential loss: 1 unique commit(s), 1 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | claude/r007-remaining-adjudication | 10f8d19855167b2009cdd4bbc0ca032f5e5a4b23 | 2026-07-13T01:59:19+01:00 | #8 closed, merged | behind 296, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | claude/r017-gitbraid-proposal | adbbb9b02849372fb1123cddc30beec4182a723c | 2026-07-22T02:18:05+01:00 | #62 open | behind 97, ahead 1 | 6 | Potential loss: 1 unique commit(s), 6 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | claude/recovery-workspace-001 | 85532f488441f1edcf60a09e6b80a0c1c8aaf4bc | 2026-07-22T18:33:11+01:00 | #97 open | behind 35, ahead 1 | 20 | Potential loss: 1 unique commit(s), 20 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | claude/reddit-test-anchor-001 | ccf12c4fc24bd4283a023547362aa9c7b4a3bbf8 | 2026-07-23T07:52:52+01:00 | none found | behind 35, ahead 3 | 5 | Potential loss: 3 unique commit(s), 5 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | claude/sync-operator-disclosure-001 | be24201b18b990eee99a243b77291b88b7a246dd | 2026-07-22T19:18:48+01:00 | #98 open | behind 32, ahead 1 | 4 | Potential loss: 1 unique commit(s), 4 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | codex/adversarial-audit-recent-break-001 | 0af8e114ae76eca7a5e7107402b5ca5f3677ebb4 | 2026-07-22T06:35:48+01:00 | #78 open | behind 64, ahead 1 | 1 | Potential loss: 1 unique commit(s), 1 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | codex/beneficial-genesis-diff-repair-002 | 53966a8b45a42b120b265b0549f77dc0d98ea779 | 2026-07-20T20:45:37+01:00 | #30 closed, merged | behind 160, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | codex/bgen-dev-culture-challenge-001 | 20a9a68ae185f28e32d2942fe18fd300b7047494 | 2026-07-21T17:02:43+01:00 | #49 open | behind 142, ahead 1 | 3 | Potential loss: 1 unique commit(s), 3 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | codex/bgen-mechanism-audit-001 | d9a0d722b6848e2370aa88988b765723a182ab37 | 2026-07-21T15:42:25+01:00 | #44 open | behind 142, ahead 2 | 18 | Potential loss: 2 unique commit(s), 18 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | codex/bgen-r1-retest-001 | bcb60f0cfc1ddd51e81bd4ec36c8d89d1c6bc271 | 2026-07-21T17:43:47+01:00 | #52 closed, merged | behind 139, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | codex/bgen-technical-audit-001 | bdfee655d34fe9ff4740786cb2e865933a464367 | 2026-07-21T14:46:19+01:00 | #42 open | behind 142, ahead 2 | 6 | Potential loss: 2 unique commit(s), 6 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | codex/noted-ods-1-p0-complete | febaaaaa6896eb9d16785eb6636b62d29fefc560 | 2026-07-21T23:30:06+01:00 | #57 closed, merged | behind 111, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | codex/noted-phase-2-agent-prompt | 91f834ed9777bbe72846674f79850cab0c20cf65 | 2026-07-22T00:27:23+01:00 | #58 closed, merged | behind 104, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | dependabot/github_actions/actions/checkout-7.0.0 | 395f86063e52b07175ca37ff36f95361a379bb93 | 2026-07-12T22:04:27Z | none found | behind 314, ahead 1 | 1 | Potential loss: 1 unique commit(s), 1 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | docs/open-gate-v0-claim | f720c0e6795f630943acb5347e675824cf323b1d | 2026-07-15T17:49:49+01:00 | #24 open | behind 172, ahead 2 | 23 | Potential loss: 2 unique commit(s), 23 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | fable/bgen-dev-culture-memo-001 | 9c5146b487a5ccda9bdbe40a3a6988489456634f | 2026-07-21T16:54:18+01:00 | #47 open | behind 142, ahead 1 | 2 | Potential loss: 1 unique commit(s), 2 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | fable/bgen-epistemic-audit-001 | 22a236d4c2973395594050e49a61890c097be62b | 2026-07-21T13:48:00+01:00 | #40 open | behind 142, ahead 4 | 21 | Potential loss: 4 unique commit(s), 21 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | fable/bgen-integration-tribunal-001 | 542f68da02b662a8a60df76c80a9132989e51a1d | 2026-07-21T16:49:13+01:00 | #46 open | behind 142, ahead 2 | 19 | Potential loss: 2 unique commit(s), 19 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | fable/break-test-rigor-review-001 | 666bbeecb62f1922b60380d7468ba138e8c053f7 | 2026-07-22T04:14:33+01:00 | #70 closed, merged | behind 82, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | fable/commons-foundation-001 | eec314e842615338368e6ff2e54bb6038858e944 | 2026-07-23T17:24:13+01:00 | #107 open | behind 35, ahead 1 | 6 | Potential loss: 1 unique commit(s), 6 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | fable/handoffs-operator-and-helper-001 | 4cb8bd4d89a6a0a58056ba79581cc2eca8a994c7 | 2026-07-23T16:14:06+01:00 | #103 closed, merged | behind 34, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | fable/language-and-operating-standard-001 | 9e84ab31d7e729930e8c78d1551084c439463d0e | 2026-07-23T17:07:00+01:00 | #105 closed, merged | behind 34, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | fable/learning-record-20260723 | 9f8202a1ed67e174b93a3e8723b348d4665cde27 | 2026-07-23T17:24:16+01:00 | #109 open | behind 35, ahead 1 | 1 | Potential loss: 1 unique commit(s), 1 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | fable/operating-framework-and-record-001 | 1204db48aeea9097f2c724cb4a58d8f35b07133f | 2026-07-23T17:24:14+01:00 | #108 open | behind 35, ahead 1 | 1 | Potential loss: 1 unique commit(s), 1 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | fable/prerelease-ai-draft-redteam-001 | 5bc289b74e19a54f8e7d7d83041ce220860e4a83 | 2026-07-23T15:46:59+01:00 | none found | behind 35, ahead 9 | 31 | Potential loss: 9 unique commit(s), 31 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | fable/publish-unsealed-truth-audit-001 | 70816af5da05aaee731809290745639319bfa495 | 2026-07-23T15:57:32+01:00 | #102 closed, merged | behind 34, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | fable/toddler-proof-safety-kit-001 | b0cd80181c7c6ca966568eb4751bc8adacfd3fc9 | 2026-07-23T16:19:17+01:00 | #104 closed, merged | behind 34, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | fix/r003-secret-scan-env-coverage | 02c527af4bcc1bdb8e3eda1d2b1c09e63c89469e | 2026-07-13T00:29:54+01:00 | #3 closed, merged | behind 314, ahead 2 | 2 | Potential loss: 2 unique commit(s), 2 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | fix/r004-audit-integrity-scan-transparency | d4e704e67d9c699761905b1c17ee380fbe48cf96 | 2026-07-13T00:37:41+01:00 | #4 closed, merged | behind 312, ahead 6 | 6 | Potential loss: 6 unique commit(s), 6 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | fix/r006-bind-snapshot-payload-to-git-tree | 61f8996480780d3045f02a059dabf225ad3b5cb0 | 2026-07-13T01:14:42+01:00 | #6 closed, merged | behind 310, ahead 4 | 4 | Potential loss: 4 unique commit(s), 4 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | fix/visibility-policy-reconciliation | f5c4f4e7f5f449e41e89937299d57982e864e857 | 2026-07-21T21:30:07+01:00 | #54 closed, merged | behind 120, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/agent-resources-round-publication-001 | 8f2824dc238e4774970ce46325f6eb62f305c1d6 | 2026-07-23T17:12:23+01:00 | #96 closed, merged | behind 19, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/backup-tip-e6f5324-001 | 2b421685a098a625e6648edb6b4848704c3fc21b | 2026-07-22T09:22:07+01:00 | #90 closed, merged | behind 41, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/beneficial-genesis-breaker-repro-001 | 54bca3f827ab062dda0a5888590ebda924a673f5 | 2026-07-20T18:35:36+01:00 | #29 closed | behind 166, ahead 1 | 26 | Potential loss: 1 unique commit(s), 26 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | grok/beneficial-genesis-diff-retest-002 | 8b475a4799e6e716a3dfed5cd4a16b08ccefa3c9 | 2026-07-20T20:42:42+01:00 | #32 closed, merged | behind 161, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/bgen-econ-breaker-001 | 65fe9b20b2decf44746581d7ad9d71921bcda2dc | 2026-07-21T11:32:56+01:00 | #37 closed, merged | behind 154, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/bgen-econ-retest-003 | 2ce668856812938d71047ccff1a77716402bda14 | 2026-07-21T12:54:14+01:00 | #39 closed, merged | behind 146, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/bgen-mechanism-audit-001 | 81499ae895d63940d9ba973a0a1b9c98469ea36f | 2026-07-21T15:47:08+01:00 | #45 open | behind 142, ahead 4 | 40 | Potential loss: 4 unique commit(s), 40 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | grok/bgen-r1-synthesis-001 | a591167a4046ef73762c78080a27898450b0f1e4 | 2026-07-21T17:37:47+01:00 | #50 closed, merged | behind 140, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/bgen-technical-audit-001 | 6075fdca74b104168d67d648ac136b96ed47f525 | 2026-07-21T15:23:41+01:00 | #43 open | behind 142, ahead 4 | 29 | Potential loss: 4 unique commit(s), 29 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | grok/break-session-1-receipt | d9157a673fccdf133eedfc5daad6d9b0290c1dbc | 2026-07-22T03:42:34+01:00 | #68 closed | behind 89, ahead 1 | 3 | Potential loss: 1 unique commit(s), 3 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | grok/comms-research-clearance-001 | 980db924f811bfd7225f4397cddd6a74ddff4140 | 2026-07-22T09:28:20+01:00 | #91 closed, merged | behind 39, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/de-stale-t06-after-pr66 | d3e43c2daa0373c98ebfe132f796fe0e0430a40f | 2026-07-22T04:56:45+01:00 | #72 closed, merged | behind 75, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/emergency-operator-clarification-001 | f8cde8d72ab1bc534055ba59cad6b174aa67d57c | 2026-07-22T07:06:34+01:00 | #80 closed, merged | behind 61, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/emergency-stop-audit-001 | d5dd515f61958142a7fc0ac167d6b4bf78154554 | 2026-07-22T06:59:51+01:00 | #79 closed, merged | behind 63, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/full-spectrum-vision-pack-001 | bbbc7e90f4e8d836193f00806a41ebbb36769909 | 2026-07-23T17:46:26+01:00 | #101 open | behind 35, ahead 8 | 74 | Potential loss: 8 unique commit(s), 74 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | grok/hygiene-control-plane-backup-reconcile-001 | 123ab857c81a15ef9e9a5691fa3b169f540cb81b | 2026-07-22T09:16:19+01:00 | #89 closed, merged | behind 43, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/noted-membrane-hardening-001 | a910bee2e45755085c54f922fafd30e0f4e8846f | 2026-07-22T01:05:40+01:00 | #60 open | behind 97, ahead 1 | 10 | Potential loss: 1 unique commit(s), 10 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | grok/post-audit-unseal-and-control-plane-001 | 72aabf7fdad2c1cb8b4a207e6273a6624b080421 | 2026-07-22T08:18:12+01:00 | #86 closed, merged | behind 49, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/remove-accidental-fetch-head | e6b177b34f83767fb985318277de4540ee879189 | 2026-07-22T08:18:28+01:00 | #87 closed, merged | behind 47, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/reorient-sync-backup-001 | fb00f1ecaa527e0404418b41124397ab206c38ed | 2026-07-22T08:29:57+01:00 | #88 closed, merged | behind 45, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/session-close-t0-001 | 3fcff145fe5db4d4afa9b79497baad9edfd6b793 | 2026-07-22T09:37:30+01:00 | #92 closed, merged | behind 37, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/truth-audit-seal-and-prep-001 | c7499e120b8ad83e565bc3ac77bb4ffc80d3b620 | 2026-07-22T07:31:54+01:00 | #81 closed, merged | behind 59, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | grok/whoopsie-log-001 | 2961ecf33b18ac0f312287a60dec8a3455f94e21 | 2026-07-22T04:54:38+01:00 | #71 closed, merged | behind 77, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | lab/operator-public-board-001 | 709dca4aa97f26648997053e6f2a72ac69040d0b | 2026-07-23T17:21:26+01:00 | #106 closed, merged | behind 9, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | main | 50377abe84493a3f2c672c04cc689e5f94546f88 | 2026-07-23T21:56:50+01:00 | none found | behind 0, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | KEEP_ACTIVE |
| Lab | play/operator-abuse-sandbox | 7389e4c973f69144ad5436455f571405541a0d5d | 2026-07-23T17:09:15+01:00 | none found | behind 20, ahead 2 | 1 | Potential loss: 2 unique commit(s), 1 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Lab | remove-board-moved-to-sandbox | 47578a86e41267a2aa41c523b3b4297bd6d3becb | 2026-07-23T19:09:52+01:00 | #111 open | behind 8, ahead 1 | 10 | Potential loss: 1 unique commit(s), 10 changed file(s) | KEEP_FOR_OPEN_PR |
| Lab | seat/break-session-2-card-04 | 7fedceb341625dd9a3b62acd15cb8df984e7a626 | 2026-07-22T05:18:40+01:00 | #73 closed, merged | behind 73, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | seat/break-session-2-card-06-07 | 2a16c4cdd68ffc9b1b6c597f53e935f6632b13c4 | 2026-07-22T05:49:40+01:00 | #75 closed, merged | behind 69, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | seat/break-session-2-card-08-09 | 47e81179f87cb7fc3005008d10cfbbe38860a565 | 2026-07-22T05:55:50+01:00 | #76 closed, merged | behind 67, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | seat/break-session-2-card-11 | 9c87e18806360a54fc51642173406c3067441ba1 | 2026-07-22T06:03:43+01:00 | #77 closed, merged | behind 65, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | seat/break-session-2-card-13 | 07b1fb92850b723fcfdd54dfccf47b1f415a6d2d | 2026-07-22T05:33:27+01:00 | #74 closed, merged | behind 71, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | seat/emergency-truth-audit-grok-001 | 3a1419844488f6e3bf492dbbd9c54e52b963ab5f | 2026-07-22T07:34:39+01:00 | #82 closed, merged | behind 57, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | SAFE_DELETE_CANDIDATE |
| Lab | state/r005-audit-retest-adjudication | c44051efbd1c638220f692017eb6e67826058c17 | 2026-07-13T00:40:41+01:00 | #5 closed, merged | behind 311, ahead 10 | 10 | Potential loss: 10 unique commit(s), 10 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Sandbox | add-operator-board | 6c41888c2ed363cab9fa866a29aaa758b43069f7 | 2026-07-23T19:08:52+01:00 | #2 open | behind 0, ahead 1 | 11 | Potential loss: 1 unique commit(s), 11 changed file(s) | KEEP_FOR_OPEN_PR |
| Sandbox | agent/mithub-adjacent-assistant | 83042b3d8beb407d611e4b37ddfdfa2190ce5541 | 2026-07-23T18:33:30+01:00 | #1 closed, merged | behind 1, ahead 1 | 29 | Potential loss: 1 unique commit(s), 29 changed file(s) | ARCHIVE_BEFORE_DELETE |
| Sandbox | main | e88520ec6a0bf5bcff09f8d99b961e71afaaebc6 | 2026-07-23T18:35:11+01:00 | none found | behind 0, ahead 0 | 0 | No unique commits/files vs main; confirm remote before deletion | KEEP_ACTIVE |
| Sandbox | sandbox/experiment/hermes-prototype | 7943dcc089905d0d86ca0ef6a24ad5a3782e2d45 | 2026-07-23T23:45:04+01:00 | #3 open | behind 0, ahead 7 | 7 | Potential loss: 7 unique commit(s), 7 changed file(s) | KEEP_FOR_OPEN_PR |
| Sandbox | sandbox/thought/pcx-noted-review-proposal | 20ceb0b718b556b2da0aa96f19e26ee8f1f193d5 | 2026-07-23T18:51:22+01:00 | none found | behind 0, ahead 1 | 2 | Potential loss: 1 unique commit(s), 2 changed file(s) | ARCHIVE_BEFORE_DELETE |

## Deletion candidates (not executed)

The following branches satisfied the conservative local test: associated PR is merged, branch tip is an ancestor of cached main, and the three-dot comparison reports zero changed files. They remain only candidates until a fresh ref fetch, final SHA check, and operator authorization:

- Lab agent/ctrl-001-control-plane-reconciliation
- Lab agent/r012-bounded-work-exchange
- Lab agent/r012-r013-promotion-closeout
- Lab agent/r013-pcx-conserved-claim
- Lab agent/r014-pcx-durable-replay
- Lab agent/r014-promotion-closeout
- Lab agent/r016-pcx-integrated-custody-gate
- Lab agent/r016-promotion-closeout
- Lab chatgpt/r008-r010-foundation-closeout
- Lab chatgpt/r011-hard-vertical-slice
- Lab chatgpt/r011-promotion-closeout
- Lab claude/beneficial-genesis-design-001
- Lab claude/bgen-econ-redteam-001
- Lab claude/full-history-review-001
- Lab claude/r007-remaining-adjudication
- Lab codex/beneficial-genesis-diff-repair-002
- Lab codex/bgen-r1-retest-001
- Lab codex/noted-ods-1-p0-complete
- Lab codex/noted-phase-2-agent-prompt
- Lab fable/break-test-rigor-review-001
- Lab fable/handoffs-operator-and-helper-001
- Lab fable/language-and-operating-standard-001
- Lab fable/publish-unsealed-truth-audit-001
- Lab fable/toddler-proof-safety-kit-001
- Lab fix/visibility-policy-reconciliation
- Lab grok/agent-resources-round-publication-001
- Lab grok/backup-tip-e6f5324-001
- Lab grok/beneficial-genesis-diff-retest-002
- Lab grok/bgen-econ-breaker-001
- Lab grok/bgen-econ-retest-003
- Lab grok/bgen-r1-synthesis-001
- Lab grok/comms-research-clearance-001
- Lab grok/de-stale-t06-after-pr66
- Lab grok/emergency-operator-clarification-001
- Lab grok/emergency-stop-audit-001
- Lab grok/hygiene-control-plane-backup-reconcile-001
- Lab grok/post-audit-unseal-and-control-plane-001
- Lab grok/remove-accidental-fetch-head
- Lab grok/reorient-sync-backup-001
- Lab grok/session-close-t0-001
- Lab grok/truth-audit-seal-and-prep-001
- Lab grok/whoopsie-log-001
- Lab lab/operator-public-board-001
- Lab seat/break-session-2-card-04
- Lab seat/break-session-2-card-06-07
- Lab seat/break-session-2-card-08-09
- Lab seat/break-session-2-card-11
- Lab seat/break-session-2-card-13
- Lab seat/emergency-truth-audit-grok-001

Branches marked ARCHIVE_BEFORE_DELETE or UNKNOWN_DO_NOT_TOUCH may contain unique evidence or lack enough provenance. Keep them until separately adjudicated. Open-PR branches remain KEEP_FOR_OPEN_PR regardless of apparent overlap.
