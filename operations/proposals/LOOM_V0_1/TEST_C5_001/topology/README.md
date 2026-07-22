# TEST-C5-001 knowledge tree — route-layer topology (draft)

**This entire tree is a ROUTE.** Per LOOM §3 it carries no authority, may be
lossy, opinionated, duplicated, or deleted and regenerated at any time. No
claim may cite a path in this tree; claims cite sealed record hashes only.
"Yet to be canonically designed" is therefore a permanent, acceptable state:
a route cannot be wrong, only stale or useless.

## Design: parallel axes as sibling directory trees

GitHub renders nested directories cheaply and greps them cheaply. We exploit
that by publishing the SAME corpus under multiple contradictory topologies
simultaneously — one directory tree per *axis of thought*. Five trees over
one corpus is a feature, not drift.

```
TEST_C5_001/
  corpus/            # records: sealed papers (hashes public, bodies per scrub)
  renders/
    chatgpt/         # tagged derivative + PROVENANCE.md + THREAD_INDEX
    struct-only/     # mechanical de-semanticized control render
  topology/          # ← everything below is disposable
    by-thread/       # one dir per ISO thread
      ISO.0001-append-only-log/
        P1.ptr  P3.ptr  P4.ptr
    by-skill/        # lateral skill/aptitude a passage exercises
      constraint-propagation/
      failure-mode-enumeration/
      vocabulary-compression/
    by-lateral/      # topological layers of lateral connection
      layer-0-surface-vocab/     # papers that share words
      layer-1-shared-mechanism/  # papers that share machinery
      layer-2-shared-shape/      # papers isomorphic in structure only
      layer-3-shared-failure/    # papers that break the same way
    by-defect-class/
```

## Pointer files (`*.ptr`)

A pointer file is one line:

```
<record-sha256> <paper-id> <section-anchor> [thread-ids...]
```

No content is duplicated into the tree — GitHub's nesting gives you the
lateral layering, the pointer gives you the grep target, and `grep -r
ISO.0007 topology/` is the whole retrieval engine. Deleting `topology/`
loses nothing (LOOM INV-6); regenerate from renders.

## Depth-as-laterality convention

Deeper nesting = further from surface similarity. `layer-3-shared-failure/`
sits deeper than `layer-0-surface-vocab/` on purpose: a reader descending
the tree moves from "these look alike" to "these break alike," which is the
direction of increasing insight and increasing tagger opinion. The deeper
the directory, the less you should trust it and the more it may be worth.

## Non-claims

- This layout is not canonical and must not be ratified as such by merge;
  ratifying a route contradicts LOOM §3.
- Axis names above are seed suggestions; seats and the operator may add,
  rename, or delete axes without ceremony, receipt, or review.
