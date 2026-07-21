# 🧪 SONNET-HAIKU META EXPERIMENT — BUILD LOG
**Hypothesis:** Separating architectural intent from implementation produces superior code.  
**Sonnet role:** Architect. 100% cognitive energy on WHAT and WHY. Zero on syntax.  
**Haiku role:** Coding monkey. Implements exactly what Sonnet describes. No decisions.  
**Sonnet discipline:** Every round, read this doc first. Then evolve it. Then instruct Haiku.

---

## WORKFLOW PROTOCOL

1. **Sonnet reads this doc** (full context recovery, no drift)
2. **Sonnet updates this doc** (adds decisions, evolves the plan)
3. **Sonnet produces a Haiku prompt** (the instruction block)
4. **User runs Haiku prompt** and pastes result back
5. **Sonnet reviews output**, notes corrections
6. **Repeat**

---

## CURRENT PROJECT: THE CRUCIBLE

An AI-powered adaptive tutoring system. Core concept: a learner has a **canonical voice asset** — a persistent, versioned profile of how they think, what they know, what language they use. Every session, the AI reads that profile and writes updates back to it. Over time, the tutor "knows" the learner deeply, precisely, in the learner's own terms.

### System Components (9 Chunks, 5 Phases)

**Phase 1 — Independent, parallel (build now):**
- Chunk 1: Canonical voice asset — schema, storage, read/write/version/supersede
- Chunk 2: FLOOR classifier — safety/crisis detection, Haiku call, fail-toward-activation
- Chunk 3: CPL classifier — cognitive-processing-load mode detection (~diverge/~converge/~cycle)

**Phase 2 — Depends on Phase 1:**
- Chunk 4: Orchestration layer — turn loop, transactional state writes, FLOOR/CPL gating, output eval

**Phase 3 — Independent of Chunk 4 except Tutor prompt assembly:**
- Chunk 5: Tutor prompt assembly — base prompt + canonical voice injection + CPL token + modules + Canvas
- Chunk 6: Peer thread — separate API instance, QUESTION/INSIGHT PACKET detection
- Chunk 7: Detection algorithms — stuck-state + high-velocity, run between turns

**Phase 4 — Depends on Phases 1-3:**
- Chunk 8: Move On Pack generation + canonical voice delta primary view + One Question ranking + session resume

**Phase 5 — Deferred until Phases 1-4 stable:**
- Chunk 9: Brain Council — 3 agents (parallel) + translation + synthesis + trigger conditions, 5 total calls, ~7-11s

---

## ARCHITECTURE DECISIONS (SONNET CALLS)

**Language/Runtime:** Python 3.11+. This is an API-orchestration system with async parallel calls. Python asyncio is the right substrate.

**Data modeling:** Pydantic v2. The canonical voice asset needs strict typing, JSON serialization, and validation. Pydantic gives all three. Every data structure in the system is a Pydantic model.

**Storage (Decision 2 from spec):** Local-first JSON files, one per learner_id. Path: `~/.crucible/voices/{learner_id}.json`. Optional cloud sync is out of scope for v1.0. Export-to-file is always available (it's just the JSON).

**Async pattern:** All API calls are `async def` using the Anthropic async client (`AsyncAnthropic`). Parallel calls use `asyncio.gather()`. The orchestration layer is fully async from the outside in.

**File structure:**
```
crucible/
  __init__.py
  models.py          # Pydantic models for all data structures
  voice_asset.py     # Chunk 1 — canonical voice asset storage
  floor.py           # Chunk 2 — FLOOR classifier
  cpl.py             # Chunk 3 — CPL classifier
  orchestrator.py    # Chunk 4 — turn loop and state management
  prompt_assembly.py # Chunk 5 — Tutor prompt builder
  peer.py            # Chunk 6 — Peer thread
  detection.py       # Chunk 7 — stuck/velocity detection
  move_on_pack.py    # Chunk 8 — pack generation and delta presentation
  brain_council.py   # Chunk 9 — multi-agent triangulation
  config.py          # API keys, model names, paths
  utils.py           # Shared helpers (async file I/O, logging)
```

**Model assignments (per spec):**
- FLOOR classifier: `claude-haiku-4-5-20251001`
- CPL classifier: `claude-haiku-4-5-20251001` (rule-based first pass, Haiku fallback)
- Tutor: `claude-sonnet-4-6`
- Output eval: `claude-haiku-4-5-20251001`
- Brain Council agents: `claude-sonnet-4-6`
- Brain Council translation: `claude-haiku-4-5-20251001`
- Brain Council synthesis: `claude-sonnet-4-6`
- Move On Pack delta step: `claude-haiku-4-5-20251001`
- Move On Pack User Pack step: `claude-sonnet-4-6`

**Session/Canvas architecture:** Canvas is session-local (not persisted in canonical voice asset). It lives in memory during a session and is stored only as part of a Move On Pack. The canonical voice asset stores only what persists across sessions.

**Transactional write model (from spec Section 3):**
- `voice_snapshot = read(learner_id)` at turn start — immutable during turn
- All writes go to `scratch = {}` during the turn
- `write(learner_id, scratch)` at turn_end — single atomic JSON write + version increment
- On failure: scratch preserved as `pending_writes_{session_id}_{turn_n}.json`, retried next turn

---

## SECTION 0 BLOCKERS (ARCHITECT MUST SUPPLY)

| Item | Status | Blocks |
|------|--------|--------|
| 13 Commitments | ⏳ AWAITING | Chunks 4, 5, 9 and all prompt content |
| WHO/Profile system (LLI/hypomanic etc.) | ⏳ AWAITING | Chunks 4, 5 |
| Replacement thesis + amended thesis | ⏳ AWAITING | Chunk 5 prompt content |
| The observables | ⏳ AWAITING | Chunk 5 prompt content |
| Brain Council prior prompts (A, B, C) | ⏳ AWAITING | Chunk 9 |
| Module library (20 modules, prompt content) | ⏳ AWAITING | Chunk 5, Chunk 4 |

**Unblocked right now:** Chunks 1, 2, 3 can build in parallel without any Section 0 content.

---

## COMPONENT REGISTRY

| Chunk | File | Status | Exports |
|-------|------|--------|---------|
| 1 | models.py + voice_asset.py | 🔄 Round 1 IN PROGRESS | read, write, version, supersede |
| 2 | floor.py | ⏳ Queued | classify(input) -> {triggered, reason} |
| 3 | cpl.py | ⏳ Queued | classify(voice, input, canvas) -> Mode |
| 4 | orchestrator.py | ⏳ Blocked (needs 1,2,3,5) | handle_turn(learner_id, input) |
| 5 | prompt_assembly.py | ⏳ Blocked (Section 0) | assemble_prompt(...) -> str |
| 6 | peer.py | ⏳ Queued | send_to_peer, detect_*_packet |
| 7 | detection.py | ⏳ Queued | detect_stuck, detect_high_velocity |
| 8 | move_on_pack.py | ⏳ Blocked (needs 1,5) | generate_pack, rank_one_question, render_primary_view |
| 9 | brain_council.py | ⏳ Deferred | run_council(...) -> CouncilResult |

---

## KNOWN ISSUES / CORRECTIONS

*(Populated as build progresses)*

---

## HAIKU INSTRUCTION QUEUE — ROUND 1

### TARGET: Chunk 1 — `crucible/models.py` + `crucible/voice_asset.py`

Paste the block below directly to Haiku (claude-haiku-4-5-20251001). No additional context needed.

---

```
You are a Python implementation engine. You receive precise specifications and write them exactly. You make zero architectural decisions. You implement what is described.

TASK: Implement two Python files for The Crucible tutoring system.

===========================
FILE 1: crucible/models.py
===========================

This file contains Pydantic v2 data models for the canonical voice asset layer.

Imports needed:
  from pydantic import BaseModel, Field
  from typing import Optional, Literal, List
  from datetime import datetime

Define these type aliases at the top:
  ConfirmationStatus = Literal['confirmed', 'unconfirmed', 'disputed']
  AcknowledgementStatus = Literal['pending', 'acknowledged', 'rejected']

MODEL: CognitivePattern
  id: str                          — unique identifier e.g. "cp_001"
  description: str                 — the pattern in plain language
  first_observed: int              — session number when first observed
  last_touched: int                — session number of most recent update
  frequency_count: int             — how many times this pattern has been observed
  confirmed: ConfirmationStatus    — default 'unconfirmed'
  examples: List[str]              — learner quotes illustrating the pattern, default []

MODEL: VoiceStandard
  id: str
  standard: str                    — the standard in plain language
  installed: int                   — session number when installed
  last_touched: int
  acknowledged: AcknowledgementStatus  — default 'pending'
  rationale: Optional[str]         — why this standard was installed, default None

MODEL: CurriculumEntry
  topic: str
  state: Literal['Exposed', 'Developing', 'Fluent', 'Mastered']
  session_first_exposed: int
  session_last_updated: int
  learner_endorsed: bool           — default False
  notes: Optional[str]             — default None

MODEL: CanonicalVoiceAsset
  learner_id: str
  version: int                     — starts at 0
  created_session: int             — session number when asset first created, default 1
  last_updated_session: int
  cognitive_patterns: List[CognitivePattern]         — default []
  installed_voice_standards: List[VoiceStandard]     — default []
  curriculum: List[CurriculumEntry]                  — default []
  raw_language: List[str]          — verbatim phrases to mirror, default []
  affective_baseline: Optional[str]                  — plain-language baseline affect, default None
  metadata: dict                   — arbitrary key-value store, default {}

MODEL: TurnScratch
  learner_id: str
  session_id: str
  turn_number: int
  cognitive_patterns_added: List[CognitivePattern]    — default []
  cognitive_patterns_updated: List[CognitivePattern]  — default []
  standards_added: List[VoiceStandard]                — default []
  standards_updated: List[VoiceStandard]              — default []
  curriculum_updates: List[CurriculumEntry]           — default []
  raw_language_additions: List[str]                   — default []
  affective_baseline_update: Optional[str]            — default None
  metadata_updates: dict                              — default {}

MODEL: PendingWrite
  learner_id: str
  session_id: str
  turn_number: int
  scratch: TurnScratch
  created_at: datetime             — default datetime.utcnow()
  retry_count: int                 — default 0

===========================
FILE 2: crucible/voice_asset.py
===========================

Imports: asyncio, json, os, pathlib.Path, typing.Optional, datetime.datetime, aiofiles
Import all models from crucible.models.

Module-level constants:
  VOICES_DIR = Path.home() / ".crucible" / "voices"
  PENDING_DIR = Path.home() / ".crucible" / "pending_writes"

Immediately after the constants, define and call _init_dirs():
  def _init_dirs():
      VOICES_DIR.mkdir(parents=True, exist_ok=True)
      PENDING_DIR.mkdir(parents=True, exist_ok=True)
  _init_dirs()

IMPLEMENT THESE FOUR PUBLIC ASYNC FUNCTIONS:

--- FUNCTION 1: read ---
async def read(learner_id: str) -> Optional[CanonicalVoiceAsset]:
  """Read and return the canonical voice asset for a learner. Returns None if not found."""
  - Path: VOICES_DIR / f"{learner_id}.json"
  - If file does not exist, return None
  - Read file async with aiofiles
  - Parse with json.loads() then CanonicalVoiceAsset.model_validate(data)
  - On ANY exception: print(f"[voice_asset] read error for {learner_id}: {e}") and return None

--- FUNCTION 2: write ---
async def write(learner_id: str, scratch: TurnScratch) -> int:
  """Apply a turn's scratch to the canonical voice asset atomically. Returns new version number."""
  Steps:
  1. Call read(learner_id). If None, create:
       asset = CanonicalVoiceAsset(learner_id=learner_id, version=0, last_updated_session=scratch.turn_number)
  2. Apply scratch to asset:
     a. asset.cognitive_patterns += scratch.cognitive_patterns_added
     b. For each p in scratch.cognitive_patterns_updated:
          find pattern in asset.cognitive_patterns where id matches, replace it entirely
     c. asset.installed_voice_standards += scratch.standards_added
     d. For each s in scratch.standards_updated:
          find standard in asset.installed_voice_standards where id matches, replace it
     e. For each entry in scratch.curriculum_updates:
          if entry.topic exists in asset.curriculum, replace it; else append
     f. Extend asset.raw_language with scratch.raw_language_additions, then deduplicate:
          asset.raw_language = list(dict.fromkeys(asset.raw_language))
     g. If scratch.affective_baseline_update is not None:
          asset.affective_baseline = scratch.affective_baseline_update
     h. asset.metadata.update(scratch.metadata_updates)
  3. asset.version += 1
  4. asset.last_updated_session = scratch.turn_number
  5. Atomic write: serialize to JSON, write to temp path first, then rename:
       path = VOICES_DIR / f"{learner_id}.json"
       tmp_path = VOICES_DIR / f"{learner_id}.json.tmp"
       async with aiofiles.open(tmp_path, 'w') as f:
           await f.write(json.dumps(asset.model_dump(mode='json'), indent=2))
       os.rename(tmp_path, path)
  6. Return asset.version
  7. On ANY exception before step 6: await _save_pending_write(scratch), then re-raise

--- FUNCTION 3: version ---
async def version(learner_id: str) -> int:
  """Return the current version number for a learner's canonical voice asset. Returns 0 if none exists."""
  - Call read(learner_id)
  - If None return 0
  - Return asset.version

--- FUNCTION 4: supersede ---
async def supersede(learner_id: str, entry_id: str, reason: str) -> None:
  """Mark a cognitive pattern or voice standard as superseded by the learner."""
  1. Call read(learner_id). If None: raise ValueError(f"No canonical voice asset found for {learner_id}")
  2. found = False
  3. Search asset.cognitive_patterns for id == entry_id:
       If found: pattern.description = f"[LEARNER SUPERSEDED: {reason}] {pattern.description}"
                 pattern.confirmed = 'disputed'
                 found = True
  4. If not found, search asset.installed_voice_standards for id == entry_id:
       If found: standard.standard = f"[LEARNER SUPERSEDED: {reason}] {standard.standard}"
                 standard.acknowledged = 'rejected'
                 found = True
  5. If still not found: raise ValueError(f"Entry {entry_id} not found in canonical voice asset for {learner_id}")
  6. Increment asset.version += 1
  7. Atomic write same as in write(): temp file then rename

PRIVATE HELPER:
async def _save_pending_write(scratch: TurnScratch) -> None:
  """Save a failed turn's scratch to disk for later retry. Never raises."""
  - Create: pending = PendingWrite(learner_id=scratch.learner_id, session_id=scratch.session_id, turn_number=scratch.turn_number, scratch=scratch)
  - Path: PENDING_DIR / f"pending_{scratch.session_id}_{scratch.turn_number}.json"
  - Write with aiofiles
  - Wrap everything in try/except — on failure print error and return silently

SMOKE TEST at bottom of voice_asset.py:
  if __name__ == "__main__":
      async def smoke_test():
          # Create a scratch
          from crucible.models import TurnScratch, CognitivePattern
          scratch = TurnScratch(
              learner_id="test_learner",
              session_id="session_001",
              turn_number=1,
              cognitive_patterns_added=[
                  CognitivePattern(id="cp_001", description="Thinks in analogies", first_observed=1, last_touched=1, frequency_count=1)
              ]
          )
          # Write
          v = await write("test_learner", scratch)
          print(f"Written. Version: {v}")
          # Read back
          asset = await read("test_learner")
          print(f"Read back. Patterns: {asset.cognitive_patterns}")
          # Version check
          v2 = await version("test_learner")
          print(f"Version via version(): {v2}")
          # Supersede
          await supersede("test_learner", "cp_001", "was too broad")
          asset2 = await read("test_learner")
          print(f"After supersede: {asset2.cognitive_patterns[0].description}")

      asyncio.run(smoke_test())

CRITICAL RULES:
- Do NOT add any functions, classes, or models not listed above
- Use aiofiles for ALL file I/O — never open() for writing
- The temp-file atomic write pattern (write to .tmp then os.rename) MUST be used in both write() and supersede()
- All Pydantic models must use default_factory=list for list fields, not default=[]
- Output both complete files with no placeholders or TODOs
```

---

## ROUNDS COMPLETED

| Round | What Was Built | Status |
|-------|---------------|--------|
| 0     | Framework established | ✅ |
| 1     | Chunk 1: models.py + voice_asset.py | 🔄 IN PROGRESS |
