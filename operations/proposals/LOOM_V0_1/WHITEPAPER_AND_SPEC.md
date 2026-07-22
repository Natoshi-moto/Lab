# LOOM v0.1 — Whitepaper & Technical Specification

**A continuity substrate for stateless intelligences, reduced to three layers.**

| Field | Value |
|---|---|
| Status | `DRAFTED` — submitted for owner acceptance |
| Authority | `status_authority: NONE` |
| Seat | Claude Opus 4.8, single session, 2026-07-22 |
| Independence | **None claimed.** Single seat, single family, single context. |
| Supersedes | Nothing. Candidate only. |
| Inputs | CPL-BRAID v1.0, CPL-BRAID MAX v0.1, `cpl_braid_lab_starter`, operator bracket notation, BUILDER PROMPTS 00–04, OMEGA Control Room, Lab `operations/` conventions |
| Prior art in repo | `operations/proposals/R017_GITBRAID` (PR #62, open, unread by this seat beyond its README) |

> **Read this first.** This document was produced by one model in one sitting. Under its own rules it is `🌱 DRAFTED` and nothing in it is more than that. It has not been reviewed, tested at scale, or run against a real corpus. Its author has a documented interest in its adoption and cannot audit its own reasoning for that bias. Attack it.

---

# PART I — WHITEPAPER

## 1. The problem this actually solves

The operator has five continuity architectures. All five are internally coherent. None of them talk to each other. Together they define roughly **106 distinct vocabulary items** that a fresh AI seat would need to hold to work correctly:

| System | Vocabulary items (approx.) |
|---|---|
| CPL-BRAID v1.0 | 7 spines, 13 record types, 10 user commands = **30** |
| Operator bracket notation | 17 tags, 8 operators, open composite grammar = **25** |
| OMEGA Control Room | 11 evidence classes, 5 qualifiers, 4 artifacts, 4 windows, 3 route rungs = **27** |
| BUILDER PROMPTS | 4 planning files, 6 footer fields, 3 block states, Context/Scope/Verify = **16** |
| Lab `operations/` | receipts, freezes, rounds, T-IDs, whoopsies, non-claims, status_authority, canonicality = **8** |
| **Total** | **≈ 106** |

This is not a criticism of any one of them. It is an arithmetic fact about the set. A sixth system that adds vocabulary is not a synthesis — it is accretion wearing a synthesis label.

**LOOM's binding constraint, declared before anything else:** the merged vocabulary must be *smaller* than the sum of its inputs. LOOM defines **3 layers + 23 glyphs + 5 stage names = 31 items**. That is a 71% reduction. If a later revision pushes it back above ~40, the revision has failed regardless of what it adds.

## 2. The reduction: everything is one of three things

Read all five systems closely and every artifact in them collapses into one of three categories:

**📜 RECORD** — a fact about what happened. A conversation turn. A file at a commit. A command's output. A receipt. A whoopsie. Records are **verbatim, immutable, append-only, and hash-addressed.** They are never edited, never summarised in place, never deleted. A record is not true — it is *what was said or done*. A perfectly preserved record of a false statement is a correct record.

**⚖ CLAIM** — an assertion that something is the case. A decision. A finding. A verdict. A design conclusion. Claims carry an **evidence class** and a pointer to the records that support them. Claims can rise only by acquiring evidence, and can fall. A claim with no record pointer is `🌱 DRAFTED` by definition.

**🧭 ROUTE** — a way of finding records and claims. An index. A tag. A handoff document. A block prompt. A summary. Routes are **derived, disposable, and carry no authority whatsoever.**

That's it. Three layers. Every one of the 106 items above is a field, a state, or a special case of one of these.

## 3. The load-bearing idea: routes have no authority

This is the one genuinely new thing in LOOM and everything else follows from it.

CPL-BRAID treats index drift as a failure mode to be detected — §15 lists "if the index drifts silently, the system fails." That framing makes the index authoritative enough to be *wrong*, which means every index mutation needs validation, versioning, and reconciliation. That is a large, permanent maintenance surface, and it is the surface most likely to rot in a project maintained by one anonymous person with a day job.

LOOM inverts it: **a route is never authoritative, so a route can never be wrong — only stale or useless.** The correct response to a suspect index is not to audit it. It is to `rm` it and regenerate from records and claims.

Consequences:

- **Index reconciliation ceases to exist as a task.** There is nothing to reconcile. Delete and rebuild.
- **A hallucinated route is self-limiting.** It points at a record ID that either resolves or doesn't. Resolution is mechanical.
- **Routes may be lossy, opinionated, duplicated, and mutually contradictory.** Five different routes over the same records is a feature. They cost nothing and none of them can lie about the underlying material.
- **A seat may generate a throwaway route for one task and discard it.** No ceremony, no receipt, no approval.
- **Certainty laundering has nowhere to land.** In every system that fails this way, the summary layer quietly becomes canonical. Here it *structurally cannot*, because claims may only cite records, never routes.

The single rule that enforces all of it:

> **A claim may cite a record. A claim may never cite a route.**

That rule is one grep. It is the cheapest high-value validator in the system.

## 4. Resolving the contradiction: forward and backward continuity

The operator's own documents contradict each other on the unit of trust:

- `BUILDER_PROMPTS/00_README.md`: *"The conversation is throwaway; the planning docs and the archive are the unit of trust."*
- CPL-BRAID v1.0 §1.2: the conversation is the source; summaries launder certainty.

Both are right about different questions, and the contradiction only exists because they share a word.

- **Forward continuity** answers *what do I build next?* Its correct artifact is the planning doc — small, current, decision-shaped. BUILDER PROMPTS proved this works: it produced Noted.
- **Backward continuity** answers *why is it like this, and where did we disagree?* Its correct artifact is the verbatim transcript. A planning doc cannot answer it, because planning docs record conclusions and delete the argument.

The join is the **claim layer**. A claim points *backward* to the records that produced it and *forward* to the work that implements it:

```
📜 records ──cited by──> ⚖ claim ──implements──> 📜 records (commits, tests, receipts)
                            │
                            └──indexed by──> 🧭 routes (disposable)
```

The transcript is not thrown away and the planning doc is not the source of truth. The planning doc is a **route** — regenerable from claims. The claim is the durable object. The transcript is the evidence.

## 5. On glyphs — the honest argument

The operator proposed emoji as emotional-salience markers. The emotional argument is the weaker one. Three stronger arguments, one of them measured:

**They don't collide. Measured, this session.** Against realistic mixed content (TypeScript, markdown checkboxes, regex character classes, reference links, footnotes), single-character bracket tags produced false positives at a **100% rate** — `[T]` matched `arr[T]`, `[K]` matched `map[K]`, `[^]` collides with both regex negation and markdown footnote syntax. The same test against single-codepoint glyphs produced **zero** false positives. The entire collision class the bracket notation must defend against simply does not exist for glyphs, because no programming language and no markup format uses astral-plane pictographs as syntax.

**They are pre-grounded.** A model already knows 🚧 means blocked without a legend. `[B]` means nothing until the legend is loaded. This is free semantic grounding that survives legend loss — which matters, because CPL-BRAID §38 correctly notes that future you is a stranger.

**They survive visual scanning.** An operator scrolling a tagged transcript sees structure. `[b-h-t-r-t-a=F]` does not scan; 🌗🔥 does.

The costs are real and are handled normatively in TS-2: multi-codepoint sequences break substring matching (measured: `👨` matches inside `👨‍💻`), which is why ZWJ sequences, skin-tone modifiers, and variation selectors are **forbidden** in the glyph set. Every LOOM glyph is exactly one codepoint, 4 UTF-8 bytes, no modifiers.

## 6. Copy-paste fatigue as a first-class constraint

The operator has identified paste burden as a real, recurring failure driver, and the repo history supports it: WHOOP-08 is a multi-terminal context-loss event under high velocity. A protocol that is correct and exhausting will be skipped at 2am, and CPL-BRAID §15 already names this: *"if the protocol becomes too ceremonial to use, the system fails."*

LOOM therefore commits to a hard budget:

- **Boot layer ≤ 4KB.** One paste. Contains the three layers, the glyph table, and the honesty protocol. Nothing else.
- **One handoff file.** Not four. `LOOM.md` at repo root.
- **The glyph table is the legend.** No separate legend document to keep in sync.
- **Every ceremony must survive the skip test:** if the operator skips it once, does the system detect the skip, or does it silently degrade? Ceremonies that fail the skip test are removed, not documented harder.

---

# PART II — TECHNICAL SPECIFICATION

## TS-1 — Layer model (normative)

```
Layer 1  📜 RECORD   immutable · verbatim · hash-addressed · append-only
Layer 2  ⚖ CLAIM    evidence-classed · cites records · may fall
Layer 3  🧭 ROUTE    derived · disposable · zero authority
```

**Invariants:**

| ID | Invariant | Enforced by |
|---|---|---|
| INV-1 | A record is never modified after write. | `loom verify` (hash) |
| INV-2 | A claim cites ≥1 record, or is `🌱 DRAFTED`. | `loom lint` |
| INV-3 | **A claim never cites a route.** | `loom lint` (grep) |
| INV-4 | A route is regenerable from records + claims alone. | `loom rebuild --check` |
| INV-5 | Evidence class rises only with new record evidence. | `loom lint` (diff) |
| INV-6 | Deleting all routes loses nothing. | design property |

INV-6 is the acceptance test for the whole architecture. If deleting `routes/` loses information, something authoritative leaked into Layer 3 and the design is broken.

## TS-2 — Glyph set (normative, closed)

**Encoding rules:** exactly one codepoint. No ZWJ. No skin-tone modifiers. No variation selectors. 4 UTF-8 bytes. Any glyph violating these is not a LOOM glyph.

**Extension rule:** the set is closed at 23. Adding a glyph requires retiring one, or a written burden-of-proof thesis explaining why the vocabulary budget in §1 no longer binds.

### Layer (3)

| Glyph | Name | Meaning |
|---|---|---|
| 📜 | RECORD | Immutable verbatim material |
| ⚖ | CLAIM | Evidence-classed assertion |
| 🧭 | ROUTE | Derived, disposable navigation |

### Evidence ladder (8)

Ordered. Promotion requires new record evidence; see INV-5.

| Glyph | Class | Requires |
|---|---|---|
| 🌱 | DRAFTED | nothing — proposed only |
| 👤 | OWNER-CANON | explicit operator acceptance (record) |
| 📄 | SOURCE-VERIFIED | pointer to inspected source span |
| ✅ | TEST-VERIFIED | deterministic tool output (record) |
| 🔬 | RUNTIME-VERIFIED | observed behaviour, logs, diagnostics |
| 🚀 | DEPLOY-VERIFIED | confirmed in target environment |
| 🚧 | BLOCKED | required evidence unavailable — **a complete answer** |
| 🪦 | FALLEN | was held, no longer; supersession pointer required |

`🌱 → 👤` requires an operator record. `📄 → ✅` requires tool output. `✅ → 🔬` requires observation. No promotion by rewording, repetition, confidence, or seat agreement.

### Epistemic events (8)

The retrieval targets. These are what the corpus exists to make findable.

| Glyph | Name | Meaning |
|---|---|---|
| 🧱 | IMPASSE | Unresolved. Both positions on record. Nobody conceded. |
| 🤖 | SEAT-PUSHBACK | An AI disagreed with the operator. |
| 🧑 | OWNER-OVERRIDE | The operator overrode an AI. |
| 🔄 | REVERSAL | A position changed, with pointer to what changed it. |
| 🔥 | REDTEAM | Attacked deliberately. Survival ≠ truth. |
| ⚡ | CONFLICT | Two records or claims disagree. Preserved, not resolved. |
| 🩹 | WHOOPSIE | Someone erred. Recorded, not blamed. |
| 🌅 | FIRST-SEEN | First emergence of a concept in the corpus. |

🧱 and 🤖/🧑 are the highest-value glyphs in the set and have **no equivalent in any input system**. They are the only mechanical way to retrieve *disagreement*, which the operator named as the primary purpose of the corpus.

🤝 CONVERGENCE is deliberately **excluded**. Multi-seat agreement is not evidence and giving it a glyph would invite treating it as such. Agreement is recorded as ordinary records; it earns no marker.

### Thought-state and operators (4)

| Glyph | Name | Meaning |
|---|---|---|
| 🌗 | HALF-THOUGHT | Incomplete reasoning, preserved deliberately |
| 💭 | SPECULATION | Simulated for data, not asserted as truth |
| 🎯 | NORTH-STAR | Guiding principle / product will |
| 🔗 | DEPENDS-ON | Dependency edge to another ID |

**Total: 23.**

## TS-3 — Record format

```
📜 REC id=<TYPE>.<YYYYMMDD>.<session>.<seq> ts=<ISO8601> actor=<id> privacy=<GATE> sha256=<hex>
<<<FENCE-<sha256[0:12]>
...exact bytes, unaltered...
FENCE-<sha256[0:12]>
```

**The fence delimiter is content-addressed.** It is derived from the hash of the payload, so it cannot appear inside the payload it delimits. This closes BREAK-1 from the starter package, where a payload beginning with a bare `RAW` line silently truncated the record because the escape guard checked only for `\nRAW\n` and `endswith('\nRAW')`.

**Parsers must be fence-aware.** Everything between the opening and closing fence is opaque bytes. No LOOM tool may interpret glyphs, IDs, or structure inside a fence. This closes BREAK-2, where the starter's linter false-positived on any transcript that quoted CPL syntax — a fatal flaw for a project whose corpus is conversations *about* CPL syntax.

## TS-4 — Claim format

```
⚖ CLM id=CLM.<nnnn> class=<glyph> cites=[REC.…,REC.…] supersedes=<CLM.…|none>
text="<one sentence>"
```

`cites` may contain record IDs only. A route ID in `cites` is an INV-3 violation and fails lint.

## TS-5 — Route format

```
🧭 RTE id=RTE.<slug> generated=<ISO8601> from=[REC.…,CLM.…] ttl=<none|ISO8601>
```

Routes need no approval, no receipt, and no review. They may be deleted at any time by anyone. `loom rebuild` regenerates the canonical set.

## TS-6 — The five-stage tagging pass

The operator's forced-five is retained. The count is arbitrary; the *fixedness* is the mechanism — a known budget forces a seat to plan against the shape of the material rather than making one shallow pass and declaring done.

Stages are a pipeline, not repetitions. Later stages seeing earlier ones is correct.

| Stage | Name | Job |
|---|---|---|
| 1 | SURVEY | Shape only. Length, phases, participants. **No tagging.** |
| 2 | RECORD | Segment into records. Verbatim preserved. IDs assigned. |
| 3 | MARK | Apply epistemic-event glyphs. 🧱 🤖 🧑 🔄 ⚡ 🩹 🌅 |
| 4 | CLAIM | Extract claims. Assign evidence class. Cite records. |
| 5 | ADVERSARY | **Attack stages 1–4.** Not additive. |

Stage 5 is adversarial by construction. Its output is a list of what stages 1–4 got wrong, missed, or over-claimed — not more tags. This addresses the frame-lock risk: without it, stage 1's framing gets four coats of polish and arrives looking thoroughly processed. WHOOP-07 is that failure mode with only one coat.

**Yield metric (required output of stage 5):** new tags added per stage, and *revisions to prior stages' tags* per stage. If stage 5 is mostly revision rather than new coverage, the fixed count has begun eating its own output on this transcript length, and the count should scale with material.

## TS-7 — Validators (executable, not doctrinal)

Five validators. Each closes a measured break in the starter package.

| ID | Validator | Closes |
|---|---|---|
| V-1 | **Stripper.** Remove all glyphs and wrappers from the tagged derivative; hash; compare to raw transcript. Byte-identical or FAIL. | Silent source mutation during tagging |
| V-2 | **Completeness.** Every record in raw has ≥1 tag in derivative. | Context exhaustion mid-pass, reported as complete |
| V-3 | **Bidirectional manifest.** Walk the tree *and* the manifest; diff both directions. | BREAK-3 — starter verifier cannot detect **added** files; measured, a smuggled record passed with exit 0 |
| V-4 | **Global ID registry.** IDs unique across the whole corpus, not per-file. | BREAK-4 — starter linter's ID map is function-local |
| V-5 | **Claim-cites-record.** Grep every `cites=` for route IDs. | INV-3 |

V-1 is the highest-value validator in the system and it exists only because the tagged derivative is separate from the raw source. If the tagged document is the *only* copy, V-1 is impossible and a model that quietly improves a sentence while annotating it is undetectable.

**Storage requirement:** raw transcripts are stored unmodified. The tagged derivative is a separate artifact. Non-negotiable — V-1 depends on it.

## TS-8 — The scrub gate (fail-closed)

The starter package has **no privacy gate**. `cpl_capture_jsonl_to_turn_raw.py` hardcodes `privacy=DEFAULT` on every record and there is no scrub stage anywhere in the pipeline. CPL-BRAID v1.0 defines `SEAL`, `REDACT`, and `DELETE` as *user commands to a model* — which cannot work, because a model cannot delete a file it is not operating on and certainly cannot delete one from git history.

LOOM makes the gate a mandatory pipeline stage between capture and commit:

```
capture → SCRUB → commit
```

**Fail-closed default:** a record with `privacy=UNSET` is treated as `SEALED` and does not enter the public corpus. Absence of a decision is not permission.

**Scrub targets:** credentials and key material; third parties who did not consent; identity-linking detail (locations, timing, idiom, health); anything the operator flags.

**Deletion honesty:** in a git repository, `DELETE` is **logical only**. Anything committed persists in history. LOOM must not offer a command implying otherwise. `🪦 FALLEN` marks superseded material; it does not remove it. The only real deletion is not committing in the first place — which is why the gate is *before* commit, not after.

**The gate must survive the skip test.** If the operator skips it, V-6 (`loom verify --scrub`) fails on the next run and blocks the corpus. A gate that depends on the operator remembering at 2am is the exact mechanism WHOOP-08 documents.

## TS-9 — Seat independence (normative)

`03_VERIFICATION_GATE.md` explicitly permits an AI to run the gate and specifies provider independence **only for the next build block** — where it matters least — and is silent for the gate itself, where it matters most.

> **A verification gate must not be run by the same model family that produced the artifact under verification. If no second family is available, the gate result is `🚧 BLOCKED`, never `✅`.**

Combined with TS-10, this closes a loop that is currently open: AI builds, same-family AI verifies, and the only human in the chain cannot audit implementation. Nothing independent checks anything, and WHOOP-01 — gates citing tests that were never built, HIGH, still open — is that loop's first recorded output.

Multi-seat agreement remains not-evidence. Independence is a *necessary* condition for a gate result to mean anything; it is never sufficient.

## TS-10 — Operator capability declaration

Replaces OMEGA §2.1, which currently instructs every seat to *"assume the human can understand architectural tradeoffs, review code, run commands, inspect logs"* and *"do not assume helplessness"* — in direct contradiction of `WHY_NOT_TO_TRUST_THIS_PROJECT.md` §A and of `02_CODING_WORKER_PROMPT.md`'s *"the user cannot code in this session."*

This matters behaviourally, not cosmetically: a seat told there is a competent reviewer downstream self-checks less.

```markdown
## The Human — Product Owner and Evidence Transport

Owns: product vision, taste, priority, acceptable risk, business constraints,
external reality, repo access, running commands, secrets, final go/no-go,
long-term artifact storage.

### Can verify @load-bearing
- Reasoning coherence — whether an argument holds and answers the question asked
- Scope drift — whether you did the task or something adjacent
- Framing and tone — whether a response was shaped to please rather than inform
  (this is a real detector; it has caught real failures in this project)
- Contradiction against the record

Your reasoning will be audited. Write as if it will be.

### Cannot verify @load-bearing
- Implementation correctness
- Cryptography, browser security models, supply chains, distributed systems
- Whether a test is meaningful or covers what it claims
- Whether code does what its comments say

The human cannot write code and has no CS training. Do not present
implementation claims as though they will be checked downstream.
**You are the last check on your own implementation work.**

### Evidence transport @load-bearing
The human runs commands, reads output, returns it. That transport is the only
source of ✅ evidence this system has. Transport is not adjudication — the human
supplies output but cannot judge whether the test was the right test.

### Honest failure is not failure @load-bearing
🚧 BLOCKED, UNABLE_TO_VERIFY, and UNABLE_TO_RUN are complete, acceptable answers.
They do not count against you.

Fabricated exit codes, assumed test results, and claimed runtime behaviour you
did not observe are the most serious defect class in this system.

State execution capability BEFORE the verification step, not after.

### Not licensed
Non-coder does not mean: simplify the technical content, withhold tradeoffs,
or decide product direction on the human's behalf. Structure complexity.
Do not remove it.
```

**Companion fix:** `02_CODING_WORKER_PROMPT.md` Step 2 must add `Execution environment: available | unavailable` to its Context block. Step 6 currently asks for exit codes without ever asking whether the worker can execute, which structurally rewards fabrication.

---

# PART III — WHAT LOOM CUTS

Per MAX's no-strip doctrine, each cut carries a burden-of-proof thesis.

**Format spine (`FORMAT_SPAN`, `FORMAT_DENSITY`) — CUT.**
Measured: the only capture path in the starter takes a flat JSONL `content` string. Bold, highlight, and colour cannot be recovered from plain text; they were never captured. The spine is currently unpopulatable. *Restore when a capture path exists that carries format (docx, HTML export, editor integration) — not before.*

**User pattern index (`USER_FACT`, `SPEECH_SIGNAL`, `PATTERN_CLAIM`) — CUT.**
Its own invariant says it must not become covert psychoanalysis. In a public repo, maintained by an anonymous operator who also runs a chronic-pain research project, a stored index of speech markers and cognitive moves is simultaneously a de-anonymisation surface and a sensitive artifact. The routing benefit does not justify it while the corpus is public. *Restore only in a private corpus, with the operator as sole reader.*

**Composite tag grammar (`[b-h-t-r-t-a=F]`) — CUT.**
Measured ambiguity: the tag has six segments; its own gloss has three content slots that appear nowhere in it. Two unrelated events with the same shape produce byte-identical tags. `r` means "revised" in one composite and "resolved" in another. It encodes a type, not an identifier. Replaced by multiple single glyphs on one record, which composes without ambiguity. *Restore if a parseable grammar with declared positional semantics is written.*

**`[D]` don't-read and `[G]` graveyard as notation — CUT as notation, KEPT as retrieval.**
By the time a model reads "don't read this," it has read it and been billed for it. Token savings require exclusion at *fetch* time. This is a retrieval-layer filter, not a tag. 🪦 FALLEN preserves the graveyard's intent — nothing deleted, only deprioritised — and the filter lives in `loom route --exclude`.

**🤝 convergence marker — CUT deliberately.** See TS-2.

**Four auxiliary windows (OMEGA §2) — DEFERRED, not cut.**
Sound design; costs operator paste burden, which §6 makes a first-class constraint. *Restore when a route exists that generates auxiliary prompts without the operator hand-assembling context.*

---

# PART IV — FALSIFICATION

LOOM should be killed if any of these hold after honest testing:

1. **V-1 fails routinely.** If tagging passes mutate source often enough that stripper checks become noise, verbatim capture is not achievable in this workflow and the premise dies.
2. **Deleting `routes/` loses information.** INV-6 broken means authority leaked into Layer 3 and the central idea is wrong.
3. **The token crossover never arrives.** If boot + route + retrieval never costs less than full reload at realistic corpus size, the efficiency claim is false. *Currently unmeasured. This is the single most important unrun experiment.*
4. **Glyph tagging doesn't change model behaviour.** Testable now, cheaply: same transcript tagged and untagged, same downstream question, compare answers. If no difference, the notation is ceremony.
5. **The scrub gate gets skipped and nobody notices.** If V-6 can be bypassed under velocity, the public-corpus risk is unmanaged and the corpus should be private.
6. **🧱 IMPASSE is never used.** If real disagreements don't get marked in practice, the corpus's stated primary purpose is not being served and the rest is overhead.

Criterion 4 is the cheapest and should run first. Criterion 3 is the most important.

---

# PART V — NON-CLAIMS

LOOM does **not**:

- claim empirical validation of any kind
- claim independence — one seat, one family, one session, author invested in adoption
- claim any model becomes more capable using it; it is external structure, not capability
- claim to solve truth; it separates integrity (auditable) from veracity (not)
- claim the operator can verify its implementation
- claim multi-seat agreement is evidence
- close any T-ID, G-ID, or open red in the Lab
- authorise implementation. **Proposal ≠ permission.**
- supersede `operations/proposals/R017_GITBRAID`, which this seat has read only at README level and which may already solve some of this better

**Known unreviewed overlap:** GITBRAID (PR #62) claims to have fixed the `[bE]` collision and built a compound-tag grammar. This document reaches different conclusions on both. That disagreement is `⚡ CONFLICT` and should be preserved, not resolved by whichever document is read second.

`status_authority: NONE`

---

*Attack it until only the load-bearing structure remains.*
