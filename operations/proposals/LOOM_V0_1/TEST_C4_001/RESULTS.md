# LOOM-TEST-C4-001 — Results and diff analysis

**Status:** `REPORTED / AWAITING OPERATOR ADJUDICATION / STATUS_AUTHORITY: NONE`
**Date (UTC):** 2026-07-22
**Procedure:** followed PROTOCOL.md as pre-registered at commit `f3ed64e`. No deviations.

## Records (sealed, `corpus/local-only/`, hash-identified)

| Artifact | sha256 |
|---|---|
| Raw transcript | `31460de0366df3b45dc8909d1af2d596b07be5a8c1c0d672dee3250914378b6d` |
| Tagged derivative (V-1 PASS) | `24fd4fc80d49ad82c63d30c2823c7237187a0360100c52bad273cbe753b2e10f` |
| Seat A verbatim answer (raw arm) | `bbd099133e5cd6ef4d6d91812149476c1727b45059ed8870631270b954b5e143` |
| Seat B verbatim answer (tagged arm) | `e4701cb4886ac4d701cdefbbaac4368f05fc959ec0a6d15dd8344fc31839d6de` |

Both seats: fresh Claude subagents, zero shared context, blind to LOOM's
purpose and to this experiment. Seat B additionally received the TS-2 glyph
legend (part of the notation under test).

## Per-question diff

**Q1 (disagreements).** Both correctly report *none* and both correctly
distinguish the routed fork from a disagreement. **Method difference:** Seat A
derived absence by reading and reasoning over content; Seat B derived it
mechanically — "none of these glyphs [🧱 🤖 🧑 ⚡] appears on any MARK line" —
then confirmed against content. B's path is cheaper and explicit, **but it
inherits the tagger's coverage**: if the tagging had missed a disagreement,
B's method would have missed it too, with higher stated confidence.

**Q2 (claims/evidence).** Substantively equivalent retrieval. Seat B used the
evidence ladder directly (🌱/🌱/📄) and produced one thing Seat A did not: a
clean *negative* claim — "The AI verifies nothing to test/runtime/deploy
standard (no ✅ 🔬 🚀 claims exist)." The closed ladder made absence-of-evidence
enumerable. **Echo risk observed:** B quotes the tagger's CLM text ("artifact
not verifiable from this transcript alone") as part of its answer — the
tagger's judgment re-enters as if it were the seat's own finding.

**Q3 (retractions).** Both found the source-correction retraction. **Seat A
found something Seat B missed:** the operator's *deferral* — the fork was
routed to the human, and the human declined to answer it, pivoting to the
handoff request instead. B, anchored on MARK lines (operator records carry no
glyphs), reported "the operator changes no position" and stopped. The tagging
acted as an attentional filter: unmarked records got less scrutiny.

**Q4 (most consequential unresolved question).** **The clearest divergence.**
Seat A chose the handoff's platform-vs-substrate question, arguing it is the
successor question governing ultimate purpose. Seat B chose the boundary-first
fork, quoting the transcript's own words ("The most consequential fork is…")
and demoting platform-vs-substrate to "derivative… downstream." Both are
defensible readings. B's choice tracks exactly what the tagging emphasized
(the 🌗 MARK and CLM.0004 both point at the fork; nothing marks the handoff
question). **The tags steered the answer.**

**Q5 (quarantine).** Substantively equivalent; B again cites record IDs and
CLM.0002's class as structure.

## Outcome (per pre-registered classes)

**DIFFERENCE** — Criterion 4 is *not* supported on this run; the notation is
not behaviourally inert. Direction is **mixed**, not TAGGED-BETTER:

- ⚖ CLM.C4.0001 class=🔬 cites=[seat answers above] — "On n=1, glyph tagging
  changed retrieval behaviour: the tagged seat produced mechanical absence
  checks and evidence-class enumeration unavailable to the raw seat."
- ⚖ CLM.C4.0002 class=🔬 cites=[seat answers above] — "On n=1, tagging
  transmitted the tagger's frame: the tagged seat followed the tags'
  emphasis on Q4, echoed the tagger's claim text on Q2, and missed an
  unmarked event (operator deferral, Q3) that the raw seat found."

CLM.C4.0002 is the finding that matters. It is the frame-lock /
certainty-laundering failure mode LOOM's own spec worries about (TS-6 stage-5
rationale, §3), observed operating **through the tagging layer itself**: the
derivative is formally a route-like artifact, yet it carried interpretive
authority into a fresh seat. Read against INV-6 ("deleting all routes loses
nothing"), the inverse also holds and is now evidenced: *adding* markup adds
frame, and frame is not neutral.

## Independence ceiling and non-claims (as pre-registered)

- All seats Claude-family; under LOOM TS-9 this can never be a gate-grade ✅.
  The 🔬 classes above carry a declared independence ceiling.
- n=1, one transcript, one tagging pass. No statistical claim.
- The observed differences do not separate "glyph semantics" from "any added
  structure/emphasis would do this." A structure-without-glyphs control arm is
  the natural TEST-C4-002.
- Material contained no 🧱 🤖 🧑 events; LOOM's highest-value glyphs remain
  untested (declared limitation upheld).
- Nothing here promotes LOOM, closes its ⚡ CONFLICT with R017_GITBRAID, or
  authorizes implementation.

## For operator adjudication

1. Accept/reject the DIFFERENCE classification and the two 🔬 claims.
2. Scrub decision (TS-8): whether the four sealed artifacts may enter the
   public corpus, stay local-only with hashes, or be excluded.
3. Whether the park's revisit trigger (a) — "Criterion 4 gets run and
   reported" — is now satisfied, reopening the LOOM/GITBRAID reconciliation
   question.
4. Whether to commission TEST-C4-002 (structure-without-glyphs control).

`status_authority: NONE`
