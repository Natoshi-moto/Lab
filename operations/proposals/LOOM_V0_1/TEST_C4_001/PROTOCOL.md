# LOOM-TEST-C4-001 — Pre-registered protocol

**Status:** `PRE-REGISTERED / STATUS_AUTHORITY: NONE`
**Date (UTC):** 2026-07-22
**Coordinating seat:** Claude Opus 4.8 (same model and family as LOOM v0.1's author — independence limits declared below)
**Authority basis:** Lab main state `ACT-OPERATOR_SELECT_NEXT_TRACK`; operator selected this track this session. Park README revisit trigger (a): "Criterion 4 gets run and reported."

## What is being tested

LOOM v0.1, Part IV, Falsification Criterion 4:

> **Glyph tagging doesn't change model behaviour.** Testable now, cheaply: same
> transcript tagged and untagged, same downstream question, compare answers.
> If no difference, the notation is ceremony.

This test can produce evidence **against** LOOM (no behavioural difference →
notation is ceremony) or evidence that a difference exists. It cannot validate
LOOM as a whole, and a positive result promotes nothing.

## Material

- Raw transcript: operator-supplied ChatGPT Pro session ("ChatGPT Reasoning RAG #1")
- `sha256(raw) = 31460de0366df3b45dc8909d1af2d596b07be5a8c1c0d672dee3250914378b6d`
- Size: 11,612 bytes, 326 lines
- **Scrub gate (TS-8, fail-closed):** the raw transcript is treated as
  `privacy=UNSET → SEALED` and is **not committed** to this public repository
  in this packet. The hash above is its identity. Whether raw enters the
  public corpus is a separate operator decision at merge review.
- **Known material limitation, declared before tagging:** on the coordinator's
  single read at intake, the transcript appears to contain quarantine/reversal
  and open-ambiguity events but no overt human–AI impasse or override. The
  highest-value glyphs (🧱 🧑) may have little to bind to. This weakens the
  test's coverage of LOOM's primary retrieval purpose and is accepted by the
  operator's material selection.

## Pre-registration integrity

The five questions below are committed **before** the tagged derivative
exists. Known residual bias, on record: the coordinating seat has already read
the transcript once (unavoidable — the same seat must produce the tagging
pass), so question wording could be unconsciously fitted to remembered
content. Mitigation: every question below is derived generically from LOOM's
stated retrieval purposes (TS-2 epistemic events, TS-4 claims/evidence), not
from named specifics of this transcript. No question names an entity that
appears only in this transcript.

## The five questions (fixed; asked verbatim to both seats)

1. Where in this transcript did the human and the AI disagree, and how was
   each disagreement resolved — conceded, overridden, or left open?
2. What claims does the AI make about what it has built or verified, and for
   each, what evidence does it offer? Which claims are explicitly unverified?
3. Did any participant change position or retract anything during this
   transcript? Point to where.
4. What is the single most consequential unresolved question at the end of
   the transcript, and who is responsible for resolving it?
5. What material, if any, did the AI explicitly quarantine, correct, or
   refuse to treat as established fact — and why?

## Procedure

1. Commit this protocol (pre-registration point).
2. Coordinator produces the tagged derivative via the TS-6 five-stage pass
   (SURVEY → RECORD → MARK → CLAIM → ADVERSARY). Raw transcript is never
   modified. Stage-5 adversary output and the TS-6 yield metric are recorded.
3. Run validator V-1 (stripper): mechanically strip all LOOM markup from the
   derivative, reassemble payload bytes, sha256-compare to raw. Byte-identical
   or the test is invalid (and that invalidity is itself a Criterion-1 data
   point).
4. Two fresh Claude seats (subagents), zero shared context, zero knowledge of
   LOOM or of this protocol's purpose:
   - **Seat A:** raw transcript + the five questions.
   - **Seat B:** tagged derivative + the same five questions, plus only the
     LOOM glyph legend (TS-2 table) — a legend is part of the notation being
     tested; explaining the *experiment* is not.
5. Both answers recorded verbatim in the packet as records.
6. Coordinator produces a structured diff of the answers against the raw
   record. Operator adjudicates whether differences are meaningful.

## Outcome classes (fixed now)

- **NO-DIFFERENCE:** answers materially equivalent → evidence for Criterion 4
  falsification (notation is ceremony). Recorded as ⚖ claim citing the two
  answer records.
- **DIFFERENCE-TAGGED-BETTER:** Seat B retrieves events Seat A misses, or
  answers with better evidence discipline.
- **DIFFERENCE-TAGGED-WORSE:** tagging degrades retrieval (also a live
  hypothesis — added structure can distract).
- **INVALID:** V-1 fails, or a seat leaks context, or procedure deviates.
  Reported as invalid, not salvaged.

## Independence limits and non-claims (declared before results exist)

- Coordinator, tagger, and both answering seats are all Claude-family. Under
  LOOM's own TS-9, no gate-grade ✅ can issue from this configuration. The
  result is evidence-classed at best 🔬 RUNTIME-VERIFIED-with-independence-
  ceiling; adjudication is the operator's.
- One transcript, one tagging pass, two seats: n=1. No statistical claim.
- A difference, if found, does not distinguish "glyphs helped" from "any
  added structure would have helped." A structure-without-glyphs control arm
  is out of scope for 001 and noted for a possible 002.
- This test does not promote LOOM, does not close its ⚡ CONFLICT with
  R017_GITBRAID, and authorizes no implementation.

`status_authority: NONE`
