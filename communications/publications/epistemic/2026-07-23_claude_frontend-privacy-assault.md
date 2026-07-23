# Epistemic analysis — NOTED frontend privacy assault (Claude)

**ID:** `EPI-2026-07-23-CLAUDE-FRONTEND-PRIVACY-ASSAULT`
**Date (UTC):** 2026-07-23
**Author seat:** Claude (Opus 4.8)
**status_authority:** `NONE`
**Epistemic class of this document:** mostly **INFERENCE**; only § 1 is repo-checkable.

---

## 1. Observed (checkable)

| Item | Evidence |
|------|----------|
| Tips / PRs / paths inspected | commit `47578a8`; `vite.config.ts`, `src/diagnosticExporter.ts`, `src/App.tsx`, `PromptStudioV3.tsx`, `NexusAgentStudio.tsx`, `public/nexus/prompt-studio-v3.html`, `public/nexus/nexus-agent-v0.14-scrubbed.html` |
| Commands run | `npm ci`; `npm run typecheck` (exit 0); `npm run build` (success); `node exporter_boundary_probe.mjs` (synthetic) |

---

## 2. Prior models — epistemic performance (**INFERENCE**)

| Seat | What they optimized for (INFERENCE) | Honesty / non-claims (INFERENCE) | Failure mode (INFERENCE) | Confidence |
|------|-------------------------------------|----------------------------------|---------------------------|------------|
| Codex (F-01..F-04 author) | surfacing real credential-path cracks the green gates miss | strong — labeled severities, demanded runtime proof, refused to close on "looks okay" | slight over-alarm on F-03 (implied creds could be in the export path without proving the prefix boundary) | MED |

### Narrative risks from priors (**INFERENCE**)

- The emergency framing risks reading as a bigger fire than the evidence supports;
  I corrected by falsifying the worst-case F-03 reading while preserving the real,
  narrower leak.

---

## 3. Operator / user — epistemic performance (**INFERENCE**)

| Dimension | Inference | Grounding text/path | Confidence |
|-----------|-----------|---------------------|------------|
| Clarity of go/no-go | high — explicit "attack, prove or disprove, publish; don't touch lineage" | operator paste this session | HIGH |
| Handling of reds | seeks reds deliberately at a confident moment | commissioning an assault at `RESEARCH_ASSESSMENT_CLEARED` | MED |
| Multi-seat direction | uses Codex→Claude relay but does not treat agreement as independence | handoff structure | MED |
| Flow-state / presentation risk | injecting chaos may partly defer the standing `NEXT_TRACK` decision | `NEXT_ACTION.md` still unanswered | LOW-MED |

**Must not claim:** access to private intent beyond public disclosures and commits.

## 4. This seat (self) — contribution and lack

### What I contributed

- Runtime-attested the exporter boundary (falsified creds-in-export; confirmed
  content + author leak).
- Resolved the F-04 verification gap (typecheck + build).
- Two original structural findings: default third-party CORS proxy; 71-page
  shared-origin credential store with no CSP.

### What I lacked

- Did not prove a concrete XSS sink (left as strongest open path for Codex).
- Did not probe postMessage or live proxy retention.
- Same provider lineage as no other seat here, but I am one model; my agreement
  with Codex is correlated, not independent.

## 5. Gap + bridge

- **Gap:** structural/static confirmation ≠ demonstrated exploit; "credential in a
  shared drawer" is proven, "a co-resident page picks the drawer" is not.
- **Bridge:** the next bounded Codex task (`CLAUDE-NEXT-01`) converts precondition
  → demonstrated chain, or falsifies it, with a local synthetic sink.

**Non-independence:** Claude + Codex, one operator account — not corroboration.
`status_authority: NONE`.
