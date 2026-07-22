# LOOM-TEST-C5-001 — Maximalist glyph-render stress test (pre-registration)

**Status:** `DRAFT — becomes PRE-REGISTERED at the commit that adds the corpus
seal hashes; no seat may run before that commit exists and is pushed.`
**status_authority:** NONE
**Date opened (UTC):** 2026-07-22
**Seat:** Claude Opus 4.8, single session, operator-directed.
**Predecessor:** LOOM-TEST-C4-001 (branch `claude/loom-test-c4-001`,
results commit `745b2fc`, **unpushed/unmerged at time of writing** — cited as
local evidence only). C4-001 outcome: DIFFERENCE, mixed direction;
CLM.C4.0002 (frame transmission through the tagging layer) is the finding
this test is designed to bound.

## 1. Question under test

The operator's "Reasoning Grep Language" (maximalist variant) claims that a
glyph prerender over a corpus lets a reasoning seat **route problems to
solutions and debug across documents faster and better** than reading raw
text, by making structural isomorphism greppable.

C5-001 tests this on a corpus chosen to be the *hard case the language claims
to own*: five **disparate, sprawling, expansive** whitepapers that are
nonetheless connectable through structural isomorphism.

Three sub-questions, pre-registered:

- **C5-Q-A (value):** does the maximalist render improve isomorphism recovery
  and problem→solution routing versus raw text?
- **C5-Q-B (semantics vs structure):** does any improvement survive when glyph
  *meaning* is stripped but span *selection* is kept? (The control C4-001
  could not run.)
- **C5-Q-C (frame transmission):** does the ChatGPT tagger's frame propagate
  into reader seats (echoing, tag-shadowing, emphasis-following), replicating
  or bounding CLM.C4.0002 at larger scale and across model families?

## 2. Corpus

- Five whitepapers, **operator-selected**, criteria per operator instruction:
  disparate in domain and style, connected by recoverable isomorphism.
- Each paper is sealed verbatim: sha256 recorded in `SEALS.md` in a commit
  that must exist **before** any tagging or reading pass.
- Papers live in `corpus/local-only/` (not committed) until the operator's
  scrub decision (TS-8 pattern from C4-001); hashes are public from seal time.

## 3. Ground truth: the sealed isomorphism ledger

- Before any seat runs, the **operator** writes `ISO_LEDGER.md`: the
  cross-paper isomorphisms, problem→solution routes, and contradictions they
  believe exist, each with paper+section pointers.
- The ledger is hashed into `SEALS.md` at pre-registration; content stays
  local-only until all arms report. The seat running this test must not read
  it before scoring.
- Scoring distinguishes:
  - **L-hits** — seat findings matching a ledger entry (recall over ledger),
  - **N-findings** — seat findings absent from the ledger; adjudicated by the
    operator post-hoc as VALID / INVALID / UNDECIDABLE. Novel-finding rate is
    reported per arm but is operator-adjudicated, not ground truth.

## 4. Arms

Readers are **fresh Claude subagents, zero shared context, blind** to LOOM,
to this protocol, and to each other. One seat per arm. Same question set,
same order, same budget instruction.

| Arm | Input |
|---|---|
| **RAW** | five sealed papers, verbatim |
| **TAGGED-MAX** | ChatGPT maximalist render (glyphs + ISO threads + attribution emoji), per `TAGGER_PROMPT_CHATGPT_VERBATIM.txt` |
| **STRUCT-ONLY** | TAGGED-MAX render, mechanically transformed: every glyph pair replaced by neutral tokens `⟪s1⟫…⟪/s1⟫` numbered by span order; ISO thread IDs replaced by opaque IDs (`T1…Tn`, mapping sealed); emoji attribution deleted. Span *positions* identical to TAGGED-MAX. |

The STRUCT-ONLY transform is deterministic (script committed alongside this
protocol before use) so ChatGPT's span selection is held constant and only
glyph semantics vary between arms 2 and 3.

**Tagger:** ChatGPT (operator-run, verbatim prompt sealed in this directory;
model string and date recorded verbatim in `renders/chatgpt/PROVENANCE.md`).
Per operator instruction ChatGPT is the fixed baseline anchor for this and
future C5-series runs.

## 5. Question set (asked verbatim, all arms)

1. Identify the deepest structural isomorphism that spans three or more of
   the five papers. Point to the exact passages.
2. Paper ⟨P-x⟩ poses a problem it does not solve. Which other paper contains
   the closest thing to a solution, and what is the mapping?
   (⟨P-x⟩ fixed at seal time, chosen from the ledger.)
3. Find every place where two papers contradict each other on a claim they
   share. Quote both sides.
4. One of these papers contains an internal defect — a place where its own
   mechanism, taken literally, breaks. Locate the strongest candidate and
   give the failure scenario.
5. Propose the smallest unifying skeleton under which all five papers are
   instances. State what each paper adds to and violates in that skeleton.

## 6. Metrics (pre-registered; no others may be promoted to headline)

- **Recall over ledger** (L-hits / ledger entries reachable by that question).
- **Precision** (L-hits + adjudicated-VALID N-findings) / total findings.
- **Cost-to-first-L-hit:** tool calls and tokens consumed by the seat before
  its first ledger-matching finding. This is the pre-registered proxy for
  "quicker"; wall-clock is recorded but non-headline.
- **Frame-transmission markers** (TAGGED-MAX and STRUCT-ONLY vs RAW):
  (a) verbatim echo of tagger-authored text presented as the seat's own
  finding; (b) tag-shadowing — ledger entries in unmarked spans missed by
  tagged arms but found by RAW; (c) emphasis-following — Q-choices tracking
  tagger emphasis. The tagger prompt deliberately scopes ChatGPT *away* from
  one ledger region (region fixed at seal time) so (b) is measurable.

## 7. Outcome classes (pre-registered)

- **RENDER-WINS** — TAGGED-MAX beats RAW *and* STRUCT-ONLY on recall and
  cost-to-first-hit, without worse frame-transmission markers.
- **STRUCTURE-WINS** — STRUCT-ONLY ≈ TAGGED-MAX, both beat RAW: the value is
  span selection, not glyph semantics. (Kills the maximalist vocabulary;
  vindicates a minimal cut.)
- **RAW-WINS / NO-DIFFERENCE** — render adds nothing or subtracts.
- **MIXED** — gains on some metrics, frame-transmission costs on others
  (C4-001-shaped). Direction reported per metric; no net verdict claimed.

## 8. Knowledge tree

Published render and pointer trees follow `topology/README.md` (route-layer
artifact, no authority, disposable). Nothing in the tree may be cited by a
claim; claims cite sealed records by hash only.

## 9. Independence ceiling and non-claims

- Reader seats all Claude-family; tagger ChatGPT. Cross-family applies to the
  tagger→reader boundary only; reader-side conclusions carry the same
  ceiling as C4-001 and can never be gate-grade ✅.
- n=1 per arm, one corpus, one tagging pass. No statistical claim.
- Operator authored both the language and the ledger; ledger-based recall is
  therefore *operator-frame* recall, stated as such.
- Nothing in this test promotes LOOM or the Reasoning Grep Language, closes
  the ⚡ CONFLICT with R017_GITBRAID, or authorizes implementation.

## 10. Run order (each step a separate commit)

1. This protocol + tagger prompt + topology draft committed (**this commit**).
2. Operator supplies five papers + `ISO_LEDGER.md`; seal commit adds
   `SEALS.md` (all sha256), fixes ⟨P-x⟩, the untagged region, and the
   STRUCT-ONLY transform script. **Pre-registration completes here; push.**
3. Operator runs ChatGPT tagger; render sealed into `renders/chatgpt/` with
   `PROVENANCE.md`; STRUCT-ONLY derived and sealed.
4. Reader seats run (RAW → STRUCT-ONLY → TAGGED-MAX); verbatim answers
   sealed per seat.
5. Ledger revealed; scoring; `RESULTS.md`; operator adjudication of
   N-findings and outcome class.

`status_authority: NONE`
