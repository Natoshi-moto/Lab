# Nexus Public Research Lab

**Observed repository visibility: `PUBLIC`.**

**Public, one-repository research infrastructure for human-directed collaboration across ChatGPT, Claude, local tools, GitHub, terminal workflows, and future interfaces.**

➡️ Begin with [`README_START_HERE.md`](README_START_HERE.md).

## Public operator board (spam zone)

Articles, tweets, thoughts, plans, sketches — **public by design**, polish optional:  
[`board/`](board/README.md) · firehose [`board/INBOX.md`](board/INBOX.md)

## Safe lab mode (go nuts off main)

Parallel thrash branches with auto CI; **main stays clean**:  
[`lab/README.md`](lab/README.md) · registry [`lab/BRANCHES.md`](lab/BRANCHES.md)  
Abuse worktree: `/home/anon/Lab-PLAY` · branch `play/operator-abuse-sandbox`

## Communications

Press notes, tutorials, and human-facing statements: [`communications/`](communications/README.md).  
Research-readiness statement (human judgment; not a product cert):  
[`communications/statements/2026-07-22_READY_FOR_SERIOUS_RESEARCH.md`](communications/statements/2026-07-22_READY_FOR_SERIOUS_RESEARCH.md).

## Why not to trust this project

**Load-bearing.** Read [`WHY_NOT_TO_TRUST_THIS_PROJECT.md`](WHY_NOT_TO_TRUST_THIS_PROJECT.md) before treating anything here as safe, authoritative, or product-ready. It lists permanent reasons rooted in anonymous non-coder operation, AI seats, research-only doctrine, and structural limits that **do not go away** when tests pass.

## Repository contract

```text
one repository = one authoritative corpus namespace
Git branches     = proposal spaces
main             = accepted working state
Git tags         = exact historical anchors
snapshots        = deterministic CANONICAL_AS_IS artifacts
audit overlays   = append-only observations bound to target hashes
AI accounts      = replaceable, attributed research seats
```

Repository visibility was resolved as `PUBLIC` by
[`DEC-2026-000002`](corpus/records/decisions/DEC-2026-000002.md), and the
constitutional privacy model was reconciled accordingly. Public visibility does
not waive `LOCAL_ONLY`, `SECRET`, provider-routing, or redaction rules.

## Demonstrated in R001

R001 implements a working operator shell, deterministic snapshot creation and verification, provider-neutral route packs, a read-only Claude audit pack, hash-chained observation ingestion, GitHub Actions checks, privacy/secret scanning, and one-command GitHub bootstrap logic.

Read [`docs/DEMONSTRATION.md`](docs/DEMONSTRATION.md) for the claim-to-artifact map.
