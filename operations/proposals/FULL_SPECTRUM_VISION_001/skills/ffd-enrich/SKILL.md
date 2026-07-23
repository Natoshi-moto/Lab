---
name: ffd-enrich
description: Walk real code and enrich with relevant engineer context (FFD bloat OK)
version: 0.1.0
metadata:
  hermes:
    tags: [ffd, enrichment, signal-saturation]
    category: full-spectrum-teacher
claims: [CLAIM-METH-001, CLAIM-SEM-001, CLAIM-SEM-002]
status_authority: NONE
---

# ffd-enrich

## When to use

Use when editing or reviewing code/docs under Full Spectrum: AI must re-read files and leave operational memory.

## Procedure

1. Open the exact files in scope (no memory-only edits).
2. Identify ring/zone (0/1/2), project ID, and any SEC-ID.
3. Enrich with **relevant** context only: why, failure modes, non-claims, verify path, landmines.
4. Plant or update **sparse** salient anchors (`@sec-id`, CLAIM-*, temporal `@verified` if known).
5. Prefer density that helps the next engineer over thin clever code.
6. Run allowlisted verify commands for the slice.
7. Record receipt or SESSION_LOG note: files, anchors, verify outcome.

## Non-claims

- Enrichment is not a security audit.
- Bloat without relevance is noise — discard it.
