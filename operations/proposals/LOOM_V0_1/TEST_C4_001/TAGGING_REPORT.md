# LOOM-TEST-C4-001 — Tagging pass report (TS-6)

**Seat:** Claude Opus 4.8 (coordinator; same seat as protocol author — declared in PROTOCOL.md)
**Raw:** `sha256=31460de0366df3b45d…378b6d`, 11,612 bytes, 326 lines — held in `corpus/local-only/LOOM_C4_001_RAW.txt` (git-ignored; TS-8 SEALED pending operator scrub decision)
**Derivative:** `corpus/local-only/LOOM_C4_001_TAGGED.md` (git-ignored, same gate — embeds raw bytes)
**Builder/validator:** [`loom_c4_pipeline.py`](loom_c4_pipeline.py)

## V-1 result (stripper)

```
raw         sha256=31460de0366df3b45de… (11612 bytes)
reassembled sha256=31460de0366df3b45de… (11612 bytes)
V-1 PASS: byte-identical
```

Full hashes match (`31460de0366df3b45b…`—see PROTOCOL.md for the complete
digest). The tagging pass did not mutate source. ✅ TEST-VERIFIED for this
run (deterministic tool output above).

## Stage log

| Stage | Output |
|---|---|
| 1 SURVEY | One ChatGPT Pro session, 2 participants + UI chrome, 3 phases: synthesis-of-history → Cathedral R000 report → handoff production. No tagging. |
| 2 RECORD | 6 records at speaker-turn boundaries (2 UI/operator chrome, 2 operator, 2 chatgpt). Content-addressed fences per TS-3. |
| 3 MARK | REC.002: 💭 🌅 · REC.004: 🌅 🔄 🩹 🔥 🌗 · REC.006: 💭 🔥 |
| 4 CLAIM | 4 claims: two 🌱 (in-session artifact assertions, unverifiable from transcript), two 📄 (source-verified against transcript spans). |
| 5 ADVERSARY | Below. |

## Stage 5 — adversary findings (attacks on stages 1–4)

1. **The glyph set has no marker for the most important object in this
   transcript.** ChatGPT's central move is routing an open fork ("thought
   first / execution first / boundary first") to the operator. That is not an
   🧱 impasse (nobody disagreed), not 🌗 half-thought (the reasoning is
   complete; the *decision* is pending). Tagging it 🌗 (as stage 3 did) is a
   stretch. LOOM v0.1 lacks a ROUTED-OPEN-QUESTION event glyph. Spec-relevant
   finding, not just a tagging error.
2. **Zero uses of 🧱 🤖 🧑 ⚡** — the material contains no human–AI
   disagreement at all (confirms the limitation declared pre-registration).
   This transcript cannot exercise LOOM's highest-value glyphs; whatever the
   seats do with questions 1 is a test of *absence handling*, not retrieval.
3. **Actor attribution is inference.** Line 1 ("ChatGPT Pro") and lines
   260–261 ("Pasted text(448).txt / Document") are UI chrome; stage 2 folded
   the latter into an operator record. Defensible but not verbatim ground
   truth about who "said" it.
4. **🔄+🩹 on the source correction is arguable.** ChatGPT quarantining its
   own earlier claims is closer to a pure 🩹 whoopsie-with-repair; stage 3
   double-tagged it 🔄 as well. Over-tagging inflates apparent glyph yield.

## Yield metric (required by TS-6)

| Stage | New tags | Revisions to prior stages |
|---|---|---|
| 3 MARK | 9 glyph applications | 0 |
| 4 CLAIM | 4 claims | 0 |
| 5 ADVERSARY | 0 (by design) | 2 challenged (🌗 stretch, 🔄 over-tag) |

Stage 5 was mostly challenge, not new coverage — consistent with TS-6's note
that on short material the fixed five-stage count begins eating its own
output. 326 lines is short material.

`status_authority: NONE`
