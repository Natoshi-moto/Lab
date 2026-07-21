# Launch plan — clean fat drop inside Lab

**Drop ID:** `COLD_DROP_001`  
**Status:** `PLAN / STATUS_AUTHORITY: NONE`  
**Goal:** Strangers and collaborators open one folder, understand the thesis in minutes, and work ON/IN/THROUGH without archaeology.

---

## 1. Launch philosophy

```text
Not: zip the hard drive.
Yes: membrane-bound gift — dense, ordered, attackable.
```

| Principle | Practice |
|-----------|----------|
| Fat but neat | Full working host + blocks + seed knowledge; no unsorted recovery |
| Doctrine first | Checkpoint 001 non-claims at drop root |
| Runnable second | One README path to boot |
| Tear-apart welcome | Issues/PRs against Lab; no investment theater |
| Free contribution | No paywall, no token, no founder allocation story |

---

## 2. Fat drop layout (`drops/COLD_DROP_001/`)

```text
COLD_DROP_001/
├── 00_READ_ME_FIRST.md          ← human entry (2–3 min)
├── 01_NON_CLAIMS.md             ← Checkpoint 001 extract
├── 02_HOW_TO_WORK.md            ← ON / IN / THROUGH
├── 03_AI_SEATS.md               ← how Codex/Claude/Grok route
├── DROP_MANIFEST.json           ← hashes, versions, includes
├── software/
│   ├── noted-host/              ← runnable source (or release build)
│   ├── nexus-blocks/            ← agent + os + stubs
│   └── creature-engine/         ← pure engine + harness
├── knowledge/                   ← curated markdown (hash-bound copies)
│   ├── CANONICAL_CHECKPOINT_001.md
│   ├── THE_SIDE_PATH_PAPER.md
│   ├── TO_SATOSHI_AND_THE_MAKERS_OF_BITCOIN.md
│   ├── NOTED_PROJECT_OS_TECH_SPEC_SUMMARY.md
│   └── OPERATING_MAP_ONE_PAGE.md
├── project_pack/                ← importable seed for Noted IDB
│   └── lab-project-os.pack.json
├── verify/
│   ├── VERIFY.sh                ← one script: install, typecheck, unit
│   └── EXPECTED.md
└── licenses/
    └── OWNER_LICENSE_TODO.md    ← do not assume OSS until chosen
```

### 2.1 Explicitly excluded from drop

- `NEXUS_ORGANIZED/05_unsorted/**`  
- Multi-GB audit zips / RAG recoveries  
- Personal chat harvests  
- Wallet marketing surfaces as primary entry  
- Duplicate `(1)(2)` HTML forests  
- Nested secrets, `.env`, nsec files  
- Live Lab `.git` history (optional: include shallow pin note only)

---

## 3. Assembly pipeline (Codex implements)

```bash
# From Lab root
python3 experiments/NOTED_PROJECT_OS_001/tools/assemble_cold_drop.py \
  --out drops/COLD_DROP_001 \
  --pin-registry products/REGISTRY.json
```

Assembler must:

1. Copy only `fat_drop_include: true` packages  
2. Run Agent scrub checklist  
3. Rewrite Pokémon → creature in user-visible drop strings where package owns them  
4. Write `DROP_MANIFEST.json` with SHA-256 of every included file  
5. Generate `00_READ_ME_FIRST.md` from template  
6. Fail if registry verify fails  
7. Fail if secret patterns match (configurable allowlist)

---

## 4. Clean launch sequence (operator)

### T−3: Containment green

- [ ] Phase 0–2 complete (minimum)  
- [ ] `verify_registry.py` pass  
- [ ] Human reviewed NON_CLAIMS  

### T−2: QA seats

- [ ] Claude: no known P0 on boot/bridge  
- [ ] Grok: A1–A10 acceptance table filled  
- [ ] Adversarial secret scan clean  

### T−1: Assemble drop

- [ ] `assemble_cold_drop.py` green  
- [ ] Spot-check import project_pack  
- [ ] License decision recorded (even if “all rights reserved research preview”)  

### T0: Publish

**Preferred:** Lab `main` contains `drops/COLD_DROP_001` + GitHub Release zip from that path  

**Message template (public):**

```text
Cold drop: Noted Project OS research preview.

Local-first host for working ON / IN / THROUGH this Lab.
Synthetic game + credentials only — we never endorse real-world
economic value on project objects and engineer against that projection.

Not a token. Not a bank. Not legal advice. status_authority: NONE.
Tear it apart. Improve it. Free tools for human contribution.
```

### T+1: Intake

- [ ] Issues labeled `drop-feedback`, `bridge`, `creature`, `agent`  
- [ ] Route pack for external contributors (read-only knowledge + software paths)  

---

## 5. Contributor day-1 path (must be real)

```text
1. Read 00_READ_ME_FIRST.md
2. cd software/noted-host && npm ci && npm run dev
3. Open /nexus-router → Agent and Creature blocks
4. Import project_pack (or use seed)
5. Write a note; link Checkpoint; optional bridge ping
6. File breaks against Lab with receipt-style repro
```

If step 2 fails on a clean machine, **drop is not ready**.

---

## 6. Infinite expansion after launch

New work **does not** bloat the drop automatically.

| Change | Drop impact |
|--------|-------------|
| New experiment in Lab | Knowledge link next drop; not forced into COLD_DROP_001 |
| New product package | REGISTRY + optional `fat_drop_include` for COLD_DROP_002 |
| Nested sub-repo pin bump | Manifest pin update; changelog in receipt |

**Versioning:** `COLD_DROP_001`, `002`, … immutable once published; new drops are new folders + tags.

---

## 7. Success metrics (honest)

| Metric | Target |
|--------|--------|
| Time to first boot | < 15 min for technical user |
| Containment violations | 0 unregistered product dirs |
| Secret scan | 0 high findings |
| Doctrine present | Checkpoint non-claims in root |
| False money UX | 0 primary CTAs to buy/redeem/invest |
| Seat usability | Codex can implement next package without full-disk search |

---

## 8. Rollback

If drop is bad: delete Release, leave folder but mark `DROP_MANIFEST.json` `"yanked": true` with reason receipt. Do not rewrite history of published hashes without a new drop id.
