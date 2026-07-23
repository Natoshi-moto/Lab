# HANDOFF — any AI seat can take over from here

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE`  
**Pack:** `operations/proposals/FULL_SPECTRUM_VISION_001/`  
**Authoring branch:** `grok/full-spectrum-vision-pack-001`  
**Purpose of this file:** Cold-start in one read. Do not improvise programme law from chat memory.

---

## 0. You are not special

- Same-provider or multi-model agreement is **not** independence.  
- This pack does **not** authorize merges to `main`, token launches, or Tails trademarks.  
- `STATUS.json` on tip may still list `NO_REAL_WORLD_TOKEN_OR_ECONOMIC_VALUE` — **TENSION-001** in `CLAIMS_REGISTER.md`. Do not silent-clear reds.  
- Operator ring-0 for promotion. Vision seats (Grok/ChatGPT) vs architecture (Claude under boot epistemics): see `SEAT_ROLES.md`.

---

## 1. What exists (complete unit)

| Item | Location |
|------|----------|
| Doctrine + roadmap + website draft + claims | This directory (see `PACK_INDEX.json`) |
| Verbatim OP/MGR quotes | `VISION_THREAD_MANIFEST.md` |
| Greppable claims | `CLAIMS_REGISTER.md` + `CLAIMS.json` |
| Mithub dual-forge portal | `MITHUB.md` |
| Genesis pins | `GENESIS_TRACEABILITY.md` + `PACK_INDEX.json` |
| First executable tasks | `tasks/*.md` |
| Dual-write CI stub | `tools/check_claim_ids.sh` |
| Suggested PR body | `PR_BODY.md` |

**Read order if cold:**  
`HANDOFF_ANY_AI.md` → `TASK_BOARD.json` → `PACK_INDEX.json` → `README.md` → `CLAIMS_REGISTER.md` → task you are assigned.  

**Operator decision card:** `READY_FOR_OPERATOR.md`

---

## 2. Genesis pins (re-verify on `origin/main` before promote)

```text
tag:     baseline-001
commit:  7a8068fc6088b81cc9a7c94b49dc77e0abe592d8
zip:     snapshots/canonical/NEXUS_LAB_R001_BASELINE_001.zip
sha256:  33d3fb549d49e1ad02ac2b2880b5ab4336a6dc29a7142d3e33e4ec2694ad8603
```

Every material PR: cite `genesis` + `CLAIM-*` IDs (see `GENESIS_TRACEABILITY.md`).

---

## 3. Programme one-liner

Full Spectrum: glass research civilisation — epoch-0 NEX (resets) + Moots (rights/work) + Nex sim + GitHub/LOOM records + Tails-first host research + semantic layer (saturation/anchors/grep) + **Mithub** portal piggybacking git/GitHub so code and semantic language co-evolve. Free simultaneous open release of method/tools/course **later**. Not airdrop theater.

---

## 4. Safe next actions (pick ONE task file)

Do not start two tracks. Operator or Manager assigns; default priority:

| Priority | Task file | Output | State |
|----------|-----------|--------|--------|
| 1 | `tasks/TSK-FS-000_PROMOTE_OR_PARK.md` | Human: park / merge proposal / commission | **OPEN (human)** |
| 2 | `tasks/TSK-FS-001_PUSH_AND_PR.md` | Remote branch + draft PR | **DONE** — PR #101 |
| 3 | `tasks/TSK-FS-002_EXPORT_CHAT_HASH.md` | Seal vision chat + pack hashes | **PARTIAL** — pack tree hashed; chat still `EXPORT_PENDING` (`receipts/TSK-FS-002_PARTIAL.md`) |
| 4 | `tasks/TSK-FS-010_TAILS_WORKLOAD_001.md` | Research report only | OPEN (needs Tails) |
| 5 | `tasks/TSK-FS-020_NEXSIM_RECEIPT_SPEC.md` | Receipt schema + example | **DONE** — `receipts/TSK-FS-020_DONE.md` |
| 6 | `tasks/TSK-FS-030_MITHUB_CI_DUAL_WRITE.md` | CI workflow + checklist | **DONE** — `receipts/TSK-FS-030_DONE.md` |
| 7 | `tasks/TSK-FS-040_HERMES_TEACHER_SKILLS_V0.md` | Skill stubs | **DONE** — `receipts/TSK-FS-040_DONE.md` |
| 8 | `tasks/TSK-FS-050_SITE_MARKDOWN_V0.md` | Static site markdown | **DONE** — `receipts/TSK-FS-050_DONE.md` |

**Draft PR:** https://github.com/Natoshi-moto/Lab/pull/101  
**Operator skim:** `OPERATOR_ONE_PAGE.md`  
**LOOM pack genesis record:** `LOOM_RECORD_001_PACK_GENESIS.md`  
**One-shot verify:** `bash operations/proposals/FULL_SPECTRUM_VISION_001/tools/verify_pack.sh`  

**Next open work for agents:** wait for **TSK-FS-000** (human) · finish chat export (**TSK-FS-002**) · **TSK-FS-010** if Tails available.

Architecture seats: implement only from a task file + CLAIM-IDs. Vision seats: extend doctrine only with OP attribution or new OP quote.

---

## 5. Forbidden without explicit human GO

- Merging this pack as if Lab already sells NEX  
- Calling anything official Tails / quantum-proof / investment-grade  
- `git push --force` to `main`  
- Clearing `human_readable_reds` without session-close honesty  
- Shipping token contracts as “final money”  
- Bulk-renaming Eidolon→Moot across product without a task  

---

## 6. Verify this pack integrity

```bash
# from repo root — prefer one-shot
bash operations/proposals/FULL_SPECTRUM_VISION_001/tools/verify_pack.sh
# or only claims:
bash operations/proposals/FULL_SPECTRUM_VISION_001/tools/check_claim_ids.sh
```

Expected: exit 0. Optional: `bash …/tools/hash_pack.sh` to refresh `PACK_TREE.sha256`.

---

## 7. Continuity for the next model

When you finish a turn, append to `operations/proposals/FULL_SPECTRUM_VISION_001/SESSION_LOG.md`:

```text
## <ISO-UTC> <seat-id>
- did:
- files:
- claims touched:
- next task id:
- blocked on:
- non-claims restated: yes/no
```

If `SESSION_LOG.md` missing, create it. Do not delete prior entries.

---

## 8. Contact with operator intent

Primary vision source: operator + Grok/ChatGPT.  
This pack is the **on-disk law** until a newer pack supersedes it with explicit version bump.

**Pack version field:** see `PACK_INDEX.json` → `pack_version`.
