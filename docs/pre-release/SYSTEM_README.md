# System README

This document explains how the intended Nexus system fits together and where the present source tree does not yet match that intent.

## Status vocabulary

- **IMPLEMENTED:** present in the current source and exercised as part of the product.
- **EXPERIMENTAL:** runnable work whose interfaces or data may change.
- **PLANNED:** a design target, not a current feature.
- **LEGACY:** inherited code kept for evidence or migration, not an endorsed contract.
- **UNABLE_TO_VERIFY:** artifacts may exist, but provenance, execution or integration has not been established.

## One system, five responsibilities

```text
Noted host
├── local canonical workspace
├── notes, projects, canvas, exports
└── durable receipts
       │ explicit capability bridge
       ▼
Nexus OS router/kernel
├── block registry and event routing
├── capability and approval broker
├── local/API model adapters
├── optional Nostr adapter
└── creature runtime
       ├── Eidolin presentation and progression
       └── Nex-Sim adversarial scenarios
```

### Noted

Noted should remain the stable, comprehensible host. It owns user-authored material and exports. It must not silently become a remote service or let every experimental block write directly into canonical state.

### Nexus OS

Nexus is the membrane around volatile tools. Managed blocks declare what they emit, consume and request. The router validates envelopes and capabilities, asks for approval where required, executes through a narrow adapter, and returns a receipt.

### Creatures and Eidolin

“Creature” is the product-level concept: a user-grown assistant with identity, lineage, preferences, bounded memory and an inspectable development history. “Eidolin” is the current creature-world implementation line. Older Eidolon, Vibes, Edolin Creator and Pokémon-derived experiments are source history until migrated into one canonical vocabulary.

The creature is not valuable because a database says it has a price. It is valuable because the user has shaped a useful relationship: context, routines, explanations, challenges, battle-tested skills and a history they can export.

### Models

Models are replaceable reasoning engines, not authorities. A user can select a local model for privacy and independence or deliberately configure an API. Each request must preview its scope, identify the provider, estimate what will leave the machine and produce a receipt. Model output returns as a proposal with AI lineage, never as silent canonical truth.

### Nostr

Nostr is an optional social transport. Nexus—not each block independently—should translate approved internal events into signed Nostr events. A remote signer or equivalent isolated signer is preferred. Application storage must never hold a raw private key. Relay lists and publication scope belong to a visible profile policy.

## Topological and spatial cognition

The current AI Brief Export can preserve selected nodes, typed directed edges, edge weight, tags, projects, semantic colours, summaries, roots, focus and lineage. This lets a model reason about an authored graph: clusters, bridges, isolated ideas, unsupported claims and possible relationships.

Canvas geometry is a separate existing export. The planned unified contract adds an optional spatial layer:

```json
{
  "nodeId": "note-42",
  "x": 0.31,
  "y": 0.64,
  "width": 0.18,
  "height": 0.09,
  "canvasId": "research-map",
  "positionProvenance": "user_positioned"
}
```

Coordinates should be normalized and explicitly labelled as user-positioned, automatic, imported or stale. Spatial proximity is evidence about arrangement, not proof of meaning. The model must cite the node and edge data behind an inference and distinguish explicit links from inferred ones.

## The intended working loop

```text
user writes and arranges material
→ user chooses an export boundary
→ router sends the bounded representation to a chosen model
→ creature explains, questions or proposes
→ proposals return as separate AI-lineage objects
→ user accepts, rejects or rearranges
→ outcomes update creature history
→ Nex-Sim scenarios attack routing, permissions and assumptions
```

This can be useful to writers, researchers, builders and people who think visually. It should not be sold as objective cognitive diagnosis, mind reading, therapy, financial advice or autonomous decision-making.

## Synthetic social and game mechanics

The intended social economy records participation without constructing a financial claim.

- A **tip** is a signed, non-transferable appreciation receipt attached to work or a creature interaction.
- **Reputation** arises primarily when other people reproduce a run, confirm a break, use a repair or verify a contribution.
- **Progression** unlocks local expression, challenges or capabilities through bounded play and learning.
- **Authority** is scoped permission to curate or admit scenarios, never ownership or a claim on revenue.
- **Game energy** may be earned or regenerated but cannot be sold, sent, redeemed or bridged.

The scarce good is credible, reproducible contribution—not a balance. Public events can carry proofs, challenges, acknowledgements and creature cards; they must not carry an officially supported market listing or transferable claim.

## Known fractures before release

The current tree includes legacy Nexus UI that calls NEX a wallet balance, exposes send/stake/receive and transfer/mint wording, and includes a cosmetic sats reference. That behavior contradicts the strict no-sale design and must be removed, quarantined behind an unmistakable legacy fixture, or replaced before public release.

A legacy Nostr Vibes path stores a private key in local storage and signs directly. That is not compatible with the signer boundary.

The Eidolin source vertical slice exists, but its packaged HTML references a missing distribution file. The repository test command consequently does not establish a green release.

Nex-Sim material was located outside the repository in local bundles, guides, scripts and receipts. It is not yet an admitted dependency or verified component of this build.

## What strangers should be able to do

| Test | Release evidence required |
|---|---|
| Understand | One front door, vocabulary map, honest capability table. |
| Build | Clean-machine lockfile install and documented build with no private files. |
| Contribute | Issue/template, bounded task, tests and reproducible receipt format. |
| Fork safely | MIT license, local export, no required operator service or secret endpoint. |
| Trust boundaries | Capability prompts, signer isolation, network indicator, negative tests. |
| Leave | Human-readable export and deletion path without account permission. |

## Development rule

Every claim should become a path, schema, executable check, receipt or explicit `UNABLE_TO_VERIFY`. A verifier must be deliberately observed failing against a controlled mutation before its passing output is treated as evidence.
