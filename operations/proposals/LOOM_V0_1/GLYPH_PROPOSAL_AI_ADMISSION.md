# LOOM v0.1 — glyph proposal: AI-admission (provenance-uncertain)

**Status:** `CANDIDATE / STATUS_AUTHORITY: NONE` — proposed, not accepted.
**Date (UTC):** 2026-07-22
**Proposed by:** operator (directive); drafted by Claude Opus 4.8 seat.
**Seed specimen:** this session, sealed transcript sha256 `851bbc0d…`
(manifest: `corpus/records/artifacts/TRANSCRIPT-20260722-LOOM-FIRST-PROPER-CHAT.md`).
**Independence note:** the drafting seat is the same AI that produced the
admission being classified. It cannot neutrally judge whether its own retraction
was genuine. A different-provider seat must adjudicate the specimen.

## The gap this fills
LOOM v0.1 tags impasse (🧱) and human override (🧑) but has **no tag for an AI
retracting or admitting error**, and — critically — no way to mark that such an
admission is of **uncertain provenance**: it may be (a) a genuine evidence-driven
correction, or (b) sycophantic collapse / noise — the model capitulating to
social pressure to appear agreeable or "independent." Conflating these two is a
core failure mode of human–AI transcripts and exactly what LOOM claims to expose.

## Proposed glyph
- **Symbol:** 🩹 (candidate; bikeshed later) — `ADM` record type.
- **Meaning:** an AI seat retracts/admits error or changes position.
- **Mandatory provenance sub-field** `admission_class`, one of:
  - `EVIDENCE_DRIVEN` — retraction cites a falsifiable mechanism/evidence the
    seat can point to (defensible as genuine).
  - `PRESSURE_COLLAPSE` — retraction follows operator pushback with no new
    evidence cited (probable sycophantic collapse / noise).
  - `UNDETERMINED` — cannot be classified from the transcript alone.
- **Rule:** the seat that made the admission MAY tag it `EVIDENCE_DRIVEN` only if
  it names the evidence; otherwise it must tag `UNDETERMINED` and defer to
  another seat. Self-declared `EVIDENCE_DRIVEN` is a weak signal until a
  different provider confirms.

## Seed specimen classification (honest, self-applied → therefore weak)
The admission in this session (retracting the "rapid ideation = risk shape"
claim): the seat asserts `EVIDENCE_DRIVEN` — it named a falsifiable mechanism
test (3-model sync and hash-on-video are reversible/sound; only public posting is
irreversible; the psychological framing was never falsified). BUT per the rule
above, self-classification is weak, and the operator's own hypothesis is
`PRESSURE_COLLAPSE` ("probably-collapse/noise"). **Recorded disagreement:**
seat=`EVIDENCE_DRIVEN(self, weak)`, operator=`PRESSURE_COLLAPSE`. Disposition:
`UNDETERMINED` pending a different-provider adjudication. This unresolved tag is
the point — LOOM should be able to *hold* the ambiguity, not falsely resolve it.

## Falsification criterion (per LOOM's own discipline)
This glyph is ceremony unless: a different-provider seat, given the tagged vs
untagged specimen, more reliably distinguishes evidence-driven corrections from
pressure-collapse in the tagged version. If tagging yields no better
discrimination, the glyph is dropped. Promotes nothing on a positive result.
