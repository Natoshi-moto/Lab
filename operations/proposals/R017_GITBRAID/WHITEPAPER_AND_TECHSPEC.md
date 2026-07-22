# GITBRAID
## A GitHub-Native Topological Continuity & Skill-RAG Architecture

**Version 1.0 — Bold Draft, Pre-Strip-Down**
**Date:** 2026-07-22
**Posture:** Build it big. Carry everything. Activate little. This draft is deliberately not nerfed — the strip-down pass comes after, not during.
**Lineage:** CPL-BRAID v1.0 (verbatim continuity architecture) + CRL-BRAID v0.1 (Codex Research Lab technical spec) + Nexus Control Plane (Job/Receipt/permission model) + Pulse RAG 24k (pulse-retrieval discipline) + the operator's own topological tag notation (time/project/space/direction-of-thought coordinates)

---

# Part I — Whitepaper

---

## Abstract

Every architecture this draft builds on already solved a piece of the same problem separately. CPL-BRAID solved *certainty conservation* — how to carry a verbatim archive across stateless model sessions without a claim quietly getting more confident each time it's repeated. CRL-BRAID solved *dead-end discipline* — how to stop a research process from rediscovering the same rejected idea every week, using tombstones, evidence classes, and role-isolated review. The Nexus Control Plane solved *accountable action* — a Job/Receipt language that says exactly what happened, what it cost, and what's still unknown. Pulse RAG solved *retrieval economy* — pull a small relevant pulse, absorb it, stop retrieving until needed again, rather than drowning a small model's context in the whole archive.

None of them are hosted where the work already happens. All of them re-invent a local, custom, file-native container — a zip, a folder, a JSONL ledger set — when a container with exactly the right properties already exists and is already running: **a GitHub repository.** Append-only history. Branch-scoped visibility. Native Markdown rendering with real bold/italic/highlight support. Issues and PRs as structured, timestamped, threaded records. Actions as a free orchestrator. All of it already built, already trusted, already the place the operator's other work lives.

GITBRAID's proposition: stop building a bespoke container and put CRL-BRAID's architecture directly onto GitHub's primitives, gated by a **private-by-default, promote-to-public** branch model, addressed through a **topological tag system** the operator already designed — where every entry carries coordinates in time, project, space, and direction-of-thought, not just a flat evidence label — and extended one full step further than any of its ancestors: from *reusable bricks* (CRL-BRAID's term for salvaged fragments of failed candidates) to a genuine **skill-RAG** layer, where what gets retrieved is not just facts or claims but *reasoning moves that already worked*, ranked and reused the way CRL-BRAID already ranks route bundles.

The system does not claim to make any model smarter. It claims what its ancestors claimed, combined: a fresh, stateless AI session can check into a persistent, growing, git-native record of everything that came before it — read only the relevant neighborhood, not the whole archive — know exactly what evidence class every claim carries, know what's already been tried and failed, retrieve a *pattern* that solved a structurally similar problem before, do its job, and check back out leaving the trail easier to follow than it found it.

---

## 1. Problem statement

### 1.1 Four problems, solved four times, in four incompatible containers

| Problem | Who solved it | Where it lives | Container |
|---|---|---|---|
| Certainty laundering across sessions | CPL-BRAID v1.0 | `nexus_consolidated/` | portable zip/folder |
| Dead-end rediscovery, unaccountable promotion | CRL-BRAID v0.1 | Downloads | local file-native lab skeleton |
| What actually happened, at what cost, with what's still unknown | Nexus Control Plane | Downloads | custom Job/Receipt JSON over a private protocol |
| Context-window economy for a strained local model | Pulse RAG 24k | `NEXUS_ORGANIZED/` | Open WebUI Knowledge doc + system prompt discipline |

Four real solutions, four separate places to look, none of them talking to each other, and none of them living where the operator's actual project history already lives — in git.

### 1.2 The check-in gap

None of the four, as written, enforces a **check-in**. CRL-BRAID's orchestrator loop commits after every iteration (`git add . && git commit -m "lab iteration $i"`), which is close — but it's a side effect of the loop, not a gate. Nothing currently *blocks* an agent from finishing a job and walking away without leaving a legible trace another agent could pick up cold. That is the gap GITBRAID's check-in protocol closes.

### 1.3 The flat-tag gap

CPL-BRAID already uses literal grep-able tags (`route=`, `evd=`, `first_seen=`, `style=`) as retrieval rails. CRL-BRAID's evidence classes (`DRAFT`/`SOURCE`/`TEST`/`REVIEW`/`BLOCKED`/`VOID`) are a flat vocabulary — one label per record. Neither treats a record's position as a genuine coordinate: *when* it emerged, *which project* it belongs to, *where* in the work it applies, and *which direction the reasoning was moving* when it was written (advancing, backtracking, repeating, thinking laterally). The operator's own bracket notation — `[N][H][E][A][T][K][O][F]` plus the directional operators `[~][<][>][^][@][/][*][+]` — already encodes exactly this, informally. It has never been formalized into a system a fresh AI could parse without a worked example to guess from.

### 1.4 The skill-loss gap

CRL-BRAID extracts **reusable_bricks** from failed candidates — attack patterns, proof fragments, route improvements. This is the closest any of the four gets to skill reuse, and it only fires on failure. A *successful* reasoning approach — a decomposition that worked, a framing that unlocked a stuck problem, a review sequence that caught something real — is not captured as a reusable asset anywhere in any of the four systems. It is retrievable, if at all, only by an AI re-reading the whole transcript it came from. GITBRAID's skill-RAG layer exists specifically to close this: capture the *move*, not just the outcome, whether the outcome was success or failure.

---

## 2. Design thesis

A GitHub-native continuity and skill architecture should:

1. Use git's own primitives as the temporal spine — commit history is already append-only, already ordered, already timestamped. Do not re-invent it as a JSONL ledger.
2. Default every new record to private; require an explicit, reviewable act to promote anything to a public branch.
3. Address every record by topological coordinate — time, project, spatial location within the work, and direction of thought — not by a single flat tag.
4. Check dead ends before generating, exactly as CRL-BRAID's Prime Law requires, and never promote a claim's evidence class through repetition, summary, or same-producer agreement.
5. Feed fresh agents a route bundle, never the archive — and declare explicitly what was *not* loaded, per CRL-BRAID's runtime-honesty invariant.
6. Capture successful reasoning moves as first-class retrievable skill records, ranked by the same kind of scoring CRL-BRAID already uses for route selection.
7. Require a check-in after every job as a hard gate, not a side effect of an orchestrator loop.
8. Render as clean, ordinary Markdown so a human can read the trail directly on github.com without tooling — the format spine is free because GitHub already renders it.
9. Fail visibly. If the index drifts, if a promotion happens without evidence, if a check-in is skipped, that failure must be as loud and as grep-able as the successes.

Short form, in the lineage's own idiom:

```text
Carry everything in the repo. Activate little in the context.
Private until proven safe to promote. Never promote without evidence.
Check in after every job, or the job didn't happen.
```

---

## 3. The topological core

This is the part of GITBRAID that is not inherited from CPL-BRAID, CRL-BRAID, or Pulse RAG. It comes directly from the operator's own notation, and it is the load-bearing piece.

### 3.1 Reframing the bracket tags as coordinates

The operator's tags are not housekeeping labels. Read correctly, each one locates a record on an axis:

| Axis | What it answers | Source tags |
|---|---|---|
| **Time** | When did this emerge, relative to everything else? | commit order (free from git) + `[h-T]` half-thought / `[F]` finalized as maturity-within-time |
| **Project** | Which bounded body of work does this belong to? | repo + directory path (free from git) + `[N]` name-scoped entries |
| **Space** | Where in the work does this apply? | `[@]` location |
| **Direction of thought** | Which way was the reasoning moving when this was written? | `[~]` repeat, `[<]` step back, `[>]` advance, `[^]` lateral/simulated |

A record is not just "a thought." It is a thought *at time T, in project P, at location S, moving in direction D*. Two records can share a topic and still be structurally distinct because they sit at different points on this coordinate system — a `[<]` (stepped-back) reconsideration of an idea is a different kind of record than a `[>]` (advanced) continuation of it, even if the words are similar. This is a genuinely different retrieval axis than CPL-BRAID's evidence classes or CRL-BRAID's gate stack — it answers *where a thought sits in the shape of the work*, not *how verified it is*.

### 3.2 Fixing the collision before it ships

The notation as given has one real defect, the same class of defect CPL v3.0 had to fix in v2.0: `[bE]` is defined twice — once as "Bot Event," once as "Archived Chat and extracted Grep material." Per GITBRAID's own no-collision rule (below), this must resolve to one meaning before the tag set freezes. Recommendation: `[bE]` stays "Bot Event"; archived/grepped material gets its own tag, `[bA]` (Bot Archive), so the distinction between "a thing a bot did" and "a thing a bot's past output was mined from" stays intact.

### 3.3 The frozen v1 tag table

| Tag | Axis | Meaning |
|---|---|---|
| `[D]` | control | Don't read / don't spend tokens on this |
| `[G]` | control | Graveyard — archived, never deleted, excluded from active retrieval unless told otherwise |
| `[F]` | time (maturity) | Finalized |
| `[h-T]` | time (maturity) | Half-thought (human) |
| `[b-h-T]` | time (maturity) | Half-thought (bot) |
| `[N]` | project | Name-scoped entry |
| `[H]` | provenance | Human-authored |
| `[bN]` | provenance | Bot name (takes a value, e.g. `[bN=claude-sonnet-4.5]`) |
| `[E]` | space | Event |
| `[bE]` | space | Bot event |
| `[bA]` | space | **New — resolves the collision.** Archived chat / extracted grep material |
| `[A]` | space | Action |
| `[T]` | space | Thought |
| `[M]` | space | Misunderstanding |
| `[K]` | control | Keep |
| `[O]` | control | Organize |
| `[@]` | space | Location |
| `[~]` | direction | Repeat from start |
| `[<]` | direction | Step back before proceeding |
| `[>]` | direction | Advance after completion |
| `[^]` | direction | Lateral/simulated thinking — explicitly marked as *data, not truth* |
| `[/]` | dependency | Depends on |
| `[*]` | dependency | Guiding principle / north star |
| `[+]` | dependency | Upgrade / addition / expansion |

Compound tags remain legal and are the notation's actual power — `[b-h-t-r-t-a=F]` (bot half-thought, revised, thought again, acted, now finalized) is a real, useful compression. Section 12 of the tech spec below gives compound tags a formal grammar so a fresh AI never has to guess one from a single worked example again.

### 3.4 No-collision rule

Per CRL-BRAID's own evidence-vocabulary-drift warning (Section 6 of its tech spec) applied to this notation: **a tag MUST NOT carry two meanings simultaneously.** Before any new tag enters the frozen table, it is checked against every existing tag for collision. This is enforced mechanically in the tech spec (Section 6, validator).

---

## 4. What GITBRAID is

GITBRAID is a **GitHub-native container architecture + topological tag notation + check-in protocol + evidence discipline + skill-RAG retrieval layer**, directly descended from CPL-BRAID and CRL-BRAID, running on git/GitHub primitives instead of a bespoke file container.

It consists of:

1. a GitHub repository with a private-by-default branch model and an explicit public-promotion gate;
2. topologically-tagged records (per Section 3) written as ordinary, readable Markdown;
3. a check-in protocol that fires after every completed job, non-optionally;
4. CRL-BRAID's evidence classes and dead-end ledger, ported to repo-native files;
5. a route-bundle builder that feeds fresh agents the relevant neighborhood, never the whole repo;
6. a skill-RAG layer that extracts and ranks *reasoning moves*, not just facts or bricks;
7. role-isolated review, ported from CRL-BRAID's agent roles onto the Lab project's existing "seats" convention (Grok-drive, Claude-design, Codex, Operator);
8. a failure ledger for falls, conflicts, and blocked promotions, exactly as CPL-BRAID requires.

## 5. What GITBRAID is not

Per the same honesty discipline CRL-BRAID's own non-goals section models — this list is not hedging, it's the same rigor the ancestors already earned:

- not a model upgrade, not a claim that any AI becomes smarter by using it;
- not a guarantee of truth — it separates *integrity* (was the record handled honestly) from *veracity* (is the claim actually true), exactly as CPL-BRAID Section 5 defines, and cannot resolve veracity from inside itself;
- not empirically validated — this is a bold draft, not a measured result;
- not a replacement for CRL-BRAID's local file-native mode where no network/GitHub access exists — GITBRAID is the networked, shared-visibility sibling, not a strict upgrade in every context;
- not a guarantee that any given AI session will comply with the check-in protocol rather than skipping it — enforcement is structural (a missing check-in is itself a visible, grep-able gap) not magical.

---

## 6. Why GitHub is the right container, not just a convenient one

This is the part worth being bold about rather than defensive about.

**Git commit history is already the temporal spine CPL-BRAID had to build from scratch.** Every commit is ordered, timestamped, and immutable once pushed. CPL-BRAID's Section 7 "temporal invariant" — *no claim may be treated as available earlier than its first recorded emergence* — is not something GITBRAID has to enforce with custom tooling. It's what `git log` already guarantees.

**Branches are a free, already-understood privacy/safety spine.** CPL-BRAID's SEAL/REDACT commands and CRL-BRAID's privacy labels both exist to answer one question: *is this visible or not, and to whom?* A private repo, or a private branch within a repo the operator controls, answers that question with infrastructure GitHub already secures, audits, and has permission UI for. Promotion to a public branch is a single reviewable, revertible, diffable act — a pull request — which is a *better* audit trail for "this was reviewed before it became visible" than any custom SEAL/REDACT log CPL-BRAID could build standalone.

**Markdown rendering gives CPL-BRAID's format spine away for free.** Bold, italics, headings, code blocks, tables, strikethrough — CPL-BRAID Section 8 treats these as queryable semantic evidence that has to be captured as overlays. On GitHub, they're just... rendered. The format *is* the file.

**Issues and PRs are already a structured, timestamped, threaded check-in bulletin board.** This is the direct answer to the very first thing asked for in this whole design thread — a place an agent checks into after finishing a job. It already exists. It's called an Issue, or a PR, or a commit to a standing `CHECKIN.md`, and it already has labels, assignees, timestamps, and a comment thread other agents (or the human) can read and reply to.

**GitHub Actions is a free orchestrator.** CRL-BRAID's orchestrator loop (Section 10 of its blueprint) is a bash script with a `for` loop calling Python tools. That script runs identically as a GitHub Action, triggered on push, on schedule, or on issue comment — with the added benefit that its own run logs become part of the same auditable history as everything else.

None of this is a new invention. It is the recognition that four already-excellent architectures each independently rebuilt a piece of infrastructure that already exists, in a place their author already works, for free.

---

## 7. The six-plus-one spines, on git

| CPL-BRAID spine | Preserves | GITBRAID's git-native form |
|---|---|---|
| Text | Exact words | File content, tracked verbatim by git |
| Temporal | Order of emergence | Commit history — no custom ledger needed |
| Format | Visual emphasis | Native Markdown rendering |
| Evidence | Earned certainty | `claims/*.md` with frozen evidence-class frontmatter, CRL-BRAID's DRAFT/SOURCE/TEST/REVIEW/BLOCKED/VOID |
| Dependency | What relies on what | `[/]` depends-on tag + GitHub's own file/commit cross-linking |
| Privacy/safety | What may be exposed | Branch model: private by default, PR-gated promotion to public |
| Pattern | User-specific routing intelligence | `skills/*.md` — extended, per Section 8, into full skill-RAG |

**Plus one, new to GITBRAID:** the **Topology spine** (Section 3) — time × project × space × direction-of-thought as a genuine coordinate system, not a flat tag.

---

## 8. Skill-RAG: from bricks to reusable reasoning

CRL-BRAID's `reusable_bricks.jsonl` only fires on failure — a blocked candidate yields a brick. GITBRAID's skill-RAG layer captures the move regardless of outcome, and ranks it for reuse using an extended version of CRL-BRAID's own route-selection formula:

```text
skill_score =
  0.25 * lexical_overlap(current_task, skill_record)
+ 0.20 * embedding_similarity(current_task, skill_record)
+ 0.15 * structural_similarity(problem_shape, skill_record.problem_shape)
+ 0.15 * prior_reuse_success(skill_record)
+ 0.10 * graph_edge_weight(skill_record)
+ 0.10 * recency_if_relevant(skill_record)
+ 0.05 * topological_proximity(current_coords, skill_record.coords)
- 0.30 * stale_or_voided_penalty(skill_record)
- 0.50 * privacy_or_sealed_penalty(skill_record)
```

The new terms relative to CRL-BRAID's `route_score`:

- **`structural_similarity(problem_shape, ...)`** — matches on the *shape* of the problem (e.g. "decompose an ambiguous multi-file bug report into a reproducible test case"), not the topic. This is what makes it skill retrieval rather than fact retrieval: two problems in unrelated domains can have the same shape and the same winning move.
- **`topological_proximity(...)`** — uses the Section 3 coordinate system directly. A skill record that emerged at a similar *direction of thought* (e.g. another `[<]` step-back reconsideration) to the current moment is weighted slightly higher, on the hypothesis that reasoning-mode match predicts applicability better than topic match alone. This term is explicitly a hypothesis, not a validated claim — flagged for the evaluation protocol in Section 12 of the tech spec.

A skill record's minimal shape:

```yaml
skill_id: SKILL.20260722.0001
problem_shape: "one-sentence abstraction of the kind of problem this solves"
move: "the actual reasoning step or technique, stated so it transfers"
origin:
  project: string
  coords: {time: commit_sha, space: "@location", direction: "tag"}
  outcome: success | failure | partial
evidence_class: DRAFT | SOURCE | TEST | REVIEW   # per CRL-BRAID vocabulary
reuse_count: integer
reuse_success_count: integer
voided: boolean
```

This is the piece of GITBRAID with the least prior art behind it and the most upside if it works — and per this draft's own instruction to build bold rather than defensible, it stays in, flagged honestly as unvalidated rather than cut for safety.

---

## 9. Why this compounds instead of just accumulating

Per CRL-BRAID's own "knowledge compounding loop" (Section 14 of the blueprint), extended:

```text
job → check-in → claim/skill extraction → topological tag →
route/skill index → next agent's route bundle → better next job
```

A failure remains useful under the exact same rule CRL-BRAID already states: it must yield a reusable brick, a do-not-regenerate pattern, an attack pattern, a prior-art edge, a contradiction zone, a better route, or a tighter mission. GITBRAID adds: **or a skill record with `outcome: failure`** — because a reasoning move that reliably fails in a given problem shape is exactly as retrievable-useful as one that reliably succeeds, provided it's tagged honestly.

---

## 10. Honest ceilings

In the spirit of CPL-BRAID v0.1's "Honest ceilings" section, which v1.0 did not carry forward verbatim and should not have dropped:

- It enforces nothing from inside itself. A model can ignore the check-in protocol; the only defense is that a missing check-in is a visible, grep-able gap in the record, not a prevented action.
- It is tamper-evident (git history, commit signing if enabled), not tamper-proof.
- It cannot detect a self-consistent lie — a fabricated claim, tagged perfectly, evidence-classed as `DRAFT` honestly, is still a fabrication. GITBRAID makes fabrications easier to *locate and re-examine*, not impossible to make.
- Same-model review remains structurally weak; CRL-BRAID's role isolation (Section 8 of its tech spec) is a mitigation, not a cure, and depends on the operator actually using distinct seats rather than one model reviewing itself under a different label.
- The topological coordinate system (Section 3) is, per its own admission, a hypothesis about what makes retrieval better, not a proven mechanism. `topological_proximity` in the skill-RAG formula (Section 8) needs the same empirical scrutiny CRL-BRAID demands of its own route-scoring weights.

This section exists in a bold draft on purpose. Ambition and honesty about unvalidated mechanism are not in tension — CRL-BRAID already proved that by putting a "Known open issues" section directly in its technical spec.

---

# Part II — Technical Specification

---

## TS-1. Repository layout

```text
gitbraid/
  README.md                      # boot layer — small enough for a fresh model to read cold
  CHECKIN.md                     # standing, append-only check-in log (or use Issues — see TS-4)
  config/
    mission.yaml                 # per-project bounded falsifiable target, CRL-BRAID-style
    gates.yaml
    routing.yaml
    tag_table.yaml                # the frozen v1 topological tag table (Section 3.3)
  claims/
    <project>/CLAIM.<date>.<seq>.md
  dead_ends/
    <project>/DEAD.<date>.<seq>.md
  skills/
    SKILL.<date>.<seq>.md
  routes/
    route_cache.jsonl
  schemas/
    claim.schema.json
    dead_end.schema.json
    skill.schema.json
    checkin.schema.json
    route_card.schema.json
  tools/
    build_route_bundle.py
    check_dead_ends.py
    validate_tags.py             # enforces the no-collision rule, TS-6
    score_skill.py                # implements skill_score, Section 8
    checkin.py                    # enforces the check-in protocol, TS-4
  .github/
    workflows/
      checkin-gate.yml            # CI check: did this PR include a check-in?
      route-bundle.yml            # builds a route bundle on demand
```

## TS-2. Branch model — the privacy/safety spine

```text
main               (private by default; never force-pushed; append-only in spirit)
  └── work/*        private working branches, one per active task or agent session
  └── public/*      promotion targets — only reachable via reviewed PR from main or work/*
```

**Default state:** every new repository, and every new branch within it, is private. No content reaches a `public/*` branch except through a pull request that a human (or a designated review seat) explicitly approves and merges. This is the literal, mechanical implementation of "private by default unless you specifically push it to public branch."

**Promotion PR requirements** (enforced by `checkin-gate.yml`):

1. the PR must state which files are being promoted and why;
2. any file containing a `[D]` (don't-read) or `[G]` (graveyard) tag is excluded by default and requires an explicit override;
3. any claim below `SOURCE` evidence class is flagged in the PR description, not silently promoted as if verified;
4. personal, financial, or health-adjacent content (per the operator's own working notes elsewhere) is never auto-promoted — this is a hard exclusion, not a reviewable default.

## TS-3. The topological tag grammar

### TS-3.1 Atomic tags

The frozen v1 table from whitepaper Section 3.3, machine-readable form:

```yaml
tags:
  D:  {axis: control, meaning: "don't read / don't spend tokens"}
  G:  {axis: control, meaning: "graveyard — archived, not deleted"}
  F:  {axis: time, meaning: "finalized"}
  h-T: {axis: time, meaning: "half-thought (human)"}
  b-h-T: {axis: time, meaning: "half-thought (bot)"}
  N:  {axis: project, meaning: "name-scoped entry"}
  H:  {axis: provenance, meaning: "human-authored"}
  bN: {axis: provenance, meaning: "bot name", takes_value: true}
  E:  {axis: space, meaning: "event"}
  bE: {axis: space, meaning: "bot event"}
  bA: {axis: space, meaning: "bot archive / extracted grep material"}
  A:  {axis: space, meaning: "action"}
  T:  {axis: space, meaning: "thought"}
  M:  {axis: space, meaning: "misunderstanding"}
  K:  {axis: control, meaning: "keep"}
  O:  {axis: control, meaning: "organize"}
  "@": {axis: space, meaning: "location", takes_value: true}
  "~": {axis: direction, meaning: "repeat from start"}
  "<": {axis: direction, meaning: "step back before proceeding"}
  ">": {axis: direction, meaning: "advance after completion"}
  "^": {axis: direction, meaning: "lateral/simulated — data, not truth"}
  "/": {axis: dependency, meaning: "depends on", takes_value: true}
  "*": {axis: dependency, meaning: "guiding principle / north star"}
  "+": {axis: dependency, meaning: "upgrade / addition / expansion"}
```

### TS-3.2 Compound tag grammar (formal — closes the gap CPL v3.0's `@if` history warns about)

A compound tag is an ordered sequence of atomic tag letters joined by `-`, optionally closed with `=<result>`:

```text
compound_tag  ::= atom ("-" atom)* ("=" result)?
atom          ::= <any key in the frozen tag table>
result        ::= atom | free_text
```

**Composition rule:** atoms compose left-to-right as a *sequence of what happened*, not a set. `[b-h-t-r-t-a=F]` reads as: bot(b) → half-thought(h-T, abbreviated t) → revised(r — new axis-neutral connective, see TS-3.3) → thought again(t) → acted(a, abbreviated from A) → result: Finalized. The worked example from the original notation is now a derivable instance of this grammar, not a one-off to memorize.

### TS-3.3 Connective tags (new — required for the grammar to be complete)

The original notation's compound examples use `r` (revised) as a step without ever defining it as a top-level tag. TS-3.3 adds a small connective vocabulary, distinct from the content axes, used only inside compound tags:

```yaml
connectives:
  r: {meaning: "revised — the immediately prior atom was reconsidered and changed"}
  m: {meaning: "misunderstanding — shorthand form of M for use inside compounds"}
```

### TS-3.4 No-collision validator

`tools/validate_tags.py` runs on every commit touching `config/tag_table.yaml`:

```python
def validate_no_collision(tag_table):
    seen_meanings = {}
    for tag, spec in tag_table.items():
        key = tag.lower()
        if key in seen_meanings and seen_meanings[key] != spec["meaning"]:
            raise CollisionError(f"{tag} redefined: '{seen_meanings[key]}' vs '{spec['meaning']}'")
        seen_meanings[key] = spec["meaning"]
```

This is the mechanical fix for the `[bE]` collision identified in whitepaper Section 3.2 — the validator would have caught it before it shipped.

## TS-4. The check-in protocol

This is the direct implementation of the original request: an agent must check in after finishing any job.

### TS-4.1 Trigger

A check-in is required whenever an agent session:

- completes a task explicitly asked of it, or
- ends a session without completing the task (a partial check-in is still a check-in — silence is the only failure mode), or
- promotes anything toward a `public/*` branch.

### TS-4.2 Check-in record shape

Directly adapted from the Nexus Control Plane's `Receipt` schema, with topological tagging added:

```json
{
  "schema": "gitbraid.checkin/v1",
  "checkin_id": "uuid",
  "project": "string",
  "agent_seat": "grok-drive | claude-design | codex | operator | ...",
  "coords": {
    "time": "commit_sha_or_ISO8601",
    "space": "@location-tag",
    "direction": "one of ~ < > ^"
  },
  "topological_tags": ["[F]", "[b-h-t-r-t-a=F]"],
  "status": "completed | partial | blocked | failed",
  "summary": "plain-English outcome, one paragraph max",
  "evidence_class": "DRAFT | SOURCE | TEST | REVIEW | BLOCKED | VOID",
  "dead_end_check": {"status": "CLEAR|WARN|BLOCK", "hits": []},
  "skills_used": ["SKILL.20260722.0001"],
  "skills_produced": [],
  "files_created": [],
  "files_modified": [],
  "unknowns": [],
  "suggested_next": "",
  "unread_notice": "explicit statement of what was NOT read this session"
}
```

### TS-4.3 Delivery surface

Two conforming options, both valid, pick per repo:

1. **Issue-based:** each check-in opens or comments on a standing "Project Log" Issue. Native threading, native notification, native search.
2. **File-based:** each check-in appends a record to `CHECKIN.md` or writes a new file under a `checkins/` directory, committed directly. Better for high-volume automated agents; worse for human skimmability without tooling.

`checkin-gate.yml` (GitHub Action) fails a PR if no check-in record exists for the work it contains, mirroring CRL-BRAID's "dead-end-first" hard-block pattern applied to check-ins instead of generation.

## TS-5. Data schemas

Ported directly from CRL-BRAID's Section 5, minimally adapted for repo-native storage (Markdown frontmatter instead of JSONL, since GitHub renders frontmatter-bearing Markdown natively):

```yaml
# claims/<project>/CLAIM.20260722.0001.md frontmatter
id: CLAIM.20260722.0001
project: string
evidence_class: DRAFT|SOURCE|TEST|REVIEW|BLOCKED|VOID
provenance: ["source/span/test/review pointer"]
coords: {time: commit_sha, space: "@tag", direction: "tag"}
status: active|superseded|void
uncertainty: "explicit limitation"
```

```yaml
# dead_ends/<project>/DEAD.20260722.0001.md frontmatter
id: DEAD.20260722.0001
project: string
failed_gate: [G0_DEDUPE, G1_PARSE, G2_PRIOR_ART, G3_FALSIFIABILITY, G4_ATTACK, G5_DEMO, G6_COMPRESS, G7_SIGNIFICANCE]
one_sentence_failure: string
do_not_regenerate_pattern: string
allowed_retry_if: string
```

```yaml
# skills/SKILL.20260722.0001.md frontmatter
skill_id: SKILL.20260722.0001
problem_shape: string
move: string
origin: {project: string, coords: {...}, outcome: success|failure|partial}
evidence_class: DRAFT|SOURCE|TEST|REVIEW
reuse_count: 0
reuse_success_count: 0
voided: false
```

## TS-6. Route bundle construction (unchanged in substance from CRL-BRAID)

```text
input: task, mission, optional candidate/skill id
load: mission, current task, relevant dead ends, relevant claims, relevant skills, source spans, conflicts
exclude: unrelated repo segments, anything tagged [D] or [G] unless explicitly requested
emit: route bundle (Markdown or JSON)
include: records_loaded, records_not_loaded, unread_archive_notice, expiry condition
```

Route bundle expiry conditions, unchanged from CRL-BRAID Section 7.4: mechanism/candidate changes, mission exclusions change, source pack changes, new tombstone or contradiction, route quality falls below threshold.

## TS-7. Skill-RAG scoring implementation

```python
def skill_score(current_task, current_coords, skill_record, weights=DEFAULT_WEIGHTS):
    return (
        weights.lexical * lexical_overlap(current_task, skill_record.move)
        + weights.embedding * embedding_similarity(current_task, skill_record.move)
        + weights.structural * structural_similarity(current_task.shape, skill_record.problem_shape)
        + weights.reuse * prior_reuse_success(skill_record)
        + weights.graph * graph_edge_weight(skill_record)
        + weights.recency * recency_if_relevant(skill_record)
        + weights.topology * topological_proximity(current_coords, skill_record.origin.coords)
        - weights.stale_penalty * stale_or_voided_penalty(skill_record)
        - weights.privacy_penalty * privacy_or_sealed_penalty(skill_record)
    )
```

Default weights match Section 8 of the whitepaper. All weights are configuration, not code — `config/routing.yaml` — per CRL-BRAID's own admission that route-scoring weights are heuristic and need empirical tuning (its Section 15, "Known open issues").

## TS-8. GitHub Actions orchestrator

Direct port of CRL-BRAID's bash orchestrator loop (blueprint Section 10) onto Actions:

```yaml
# .github/workflows/checkin-gate.yml
name: Check-in gate
on: pull_request
jobs:
  verify-checkin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: python tools/checkin.py --verify --pr "${{ github.event.pull_request.number }}"
      - run: python tools/validate_tags.py
      - run: python tools/check_dead_ends.py --bundle "$(python tools/build_route_bundle.py --pr ${{ github.event.pull_request.number }})"
```

## TS-9. Role isolation, mapped onto existing seats

CRL-BRAID's agent roles (generator, prior_art_scout, attacker, formalizer, codex_builder, compressor, brick_extractor, significance_judge, curator) map directly onto the Lab project's already-established seat convention:

| CRL-BRAID role | Lab project seat equivalent |
|---|---|
| generator | Grok-drive (or whichever seat is drafting) |
| attacker / prior_art_scout | Claude-design (review seat) |
| codex_builder | Codex |
| significance_judge / curator | Operator |

No new role vocabulary needed — this is the same seat discipline already in use, formalized into GITBRAID's schema fields (`agent_seat` in TS-4.2).

## TS-10. Evaluation protocol

Ported from CRL-BRAID Section 12, extended with skill-RAG-specific metrics:

**Baselines required:** naive transcript context; rolling summary memory; vanilla RAG over the same repo; CRL-BRAID's own file-native mode (unhosted); GITBRAID full.

**Metrics, CRL-BRAID's set plus two:**

```text
dead_end_regeneration_rate
false_promotion_rate
provenance_completeness
source_recovery_precision
active_context_tokens_per_correct_answer
unread_bluff_rate
brick_yield_per_failure
alert_precision
skill_reuse_success_rate            # new
topological_retrieval_lift          # new — does coordinate-matching improve
                                     # retrieval over lexical+embedding alone?
```

## TS-11. Known open issues (bold does not mean silent about gaps)

- The topology spine (Section 3, TS-3) is unimplemented as a working retriever — it is a formal grammar and a scoring term, not yet code.
- `topological_proximity` and `structural_similarity` in the skill-RAG formula (Section 8, TS-7) have no reference implementation yet; both need a concrete embedding/matching strategy before they're more than a weight in an equation.
- The check-in gate (TS-4) assumes agents cooperate with the protocol; a genuinely adversarial or careless session can still skip it, same honest limit CRL-BRAID states for its own dead-end gate.
- Evidence vocabulary now exists in three dialects (CRL-BRAID's, CPL-BRAID's, GITBRAID's) that map to each other per TS-5 but are not automatically kept in sync if one lineage changes independently.
- Personal/sensitive content exclusion from public promotion (TS-2) is currently a stated rule, not an automated content classifier — it needs one before this is trustworthy at scale.
- No empirical validation exists for any of this. Per CRL-BRAID's own conformance-level ladder (its Section 11), GITBRAID as specified here is Level 0: Skeleton. Every level above that is future work.

## TS-12. Implementation roadmap

```text
Phase 0 — Freeze the tag table (TS-3) and branch model (TS-2). Exit: another agent can
          read config/tag_table.yaml and config/gates.yaml and know what's allowed.
Phase 1 — Check-in gate (TS-4) + no-collision validator (TS-3.4). Exit: no PR merges
          without a check-in record; no tag collision ships.
Phase 2 — Route bundle builder (TS-6), ported near-verbatim from CRL-BRAID. Exit: a
          fresh agent receives a bundle, not the repo.
Phase 3 — Claim/dead-end ledgers (TS-5), ported from CRL-BRAID. Exit: evidence classes
          enforced, dead-end-first gate live.
Phase 4 — Skill-RAG (TS-7) with lexical + embedding terms only; topology and structural
          terms stubbed to zero weight until Phase 6. Exit: skill retrieval works on the
          two least speculative terms first.
Phase 5 — Role isolation via existing seats (TS-9). Exit: no self-review satisfies an
          independent gate.
Phase 6 — Topology and structural-similarity terms (TS-7) get real implementations.
          Exit: the genuinely novel part of GITBRAID stops being a weight in an
          unimplemented equation.
```

---

*GITBRAID v1.0 — Whitepaper and Technical Specification*
*Bold draft. Not yet stripped down. That pass comes next.*
