# Nexus: A Sovereign Workspace for Thought, Creatures and Verifiable Play

**Pre-release white paper — draft 0.1 — 22 July 2026**

## Abstract

Nexus is an experimental local-first system for turning a personal knowledge workspace into an inspectable, routed environment for tools and creature assistants. Noted preserves the user's notes, canvases and projects. Nexus OS connects bounded applications, models and external transports through explicit capabilities. Eidolin gives the assistant a creature identity and a game-like development surface. An optional Nostr bridge enables public, user-signed exchange. Nex-Sim is intended to continuously attack the rules, permissions and evidence produced by the system.

The project takes its foundation from Bitcoin's ethos rather than from token issuance: sovereignty, voluntary participation, portable state, transparent rules, minimized trust, adversarial testing and respect for history. It issues no financial asset. All tips, ranks, energy, items and status are synthetic application data, non-transferable and non-redeemable. There is no official sale surface. The project's value proposition is the software and the creature relationship a person develops—not artificial scarcity or a promise that a balance will appreciate.

This paper states a direction, not a claim that every component is complete. Its central falsifiable thesis is that an explicitly bounded graph-and-spatial representation of a person's own work can support a more useful, legible and portable AI relationship than an unstructured chat history, while remaining under the user's control.

## 1. Operator statement

The software is intended as a free contribution. There is no presale, token generation event, investment contract, pooled capital scheme, yield, equity or promise of a payout. Reputation must come from tools strangers can use and claims strangers can attack.

The project's potential to spread is a product hypothesis, not evidence. The test is whether unaffiliated people install it, retain control of their work, get recurring utility from the creature interaction and contribute reproducible improvements. Attention without utility is not success.

## 2. The problem

Modern knowledge tools separate material that belongs together. Notes live in one application, diagrams in another, AI chats in disposable threads, automations behind opaque permissions, and social identity on platforms that can disappear. A model may sound personally informed while possessing no stable, inspectable representation of what the user actually wrote or how ideas relate.

Three failures follow:

1. **Context has no durable shape.** Chat history is linear, while real projects contain branches, gaps, clusters, chronology and spatial arrangement.
2. **Agency has weak boundaries.** Tools often combine reading, writing, networking and signing into one vague permission.
3. **Engagement becomes extraction.** Social and game mechanics are frequently attached to a financial promise or platform lock-in instead of genuine contribution.

Nexus proposes a different combination: local canonical material, explicit graph and spatial exports, routed capabilities, portable creatures and synthetic play that cannot officially become a cash claim.

## 3. The Bitcoin foundation

Bitcoin is the philosophical foundation and engineering inspiration for this project. The relevant inheritance is not a ticker symbol. It is a discipline:

- the user should be able to hold and export their own state;
- important rules should be inspectable;
- participants should not need personal trust in the operator;
- history and lineage should be visible;
- failure claims should be reproducible;
- participation should be voluntary;
- boundaries should be enforced by software where possible, not merely announced;
- independent implementations and forks should remain possible.

Nexus does not claim Bitcoin-level decentralization or security. It does not create consensus money. The analogy stops where the evidence stops. Bitcoin's ethos is used as a demand for sovereignty and verification, never as borrowed authority for an in-game unit.

## 4. The system thesis

The system has four main layers and one adversarial instrument.

**Noted remembers.** It is the user's stable archive and canvas: notes, projects, prompts, links, tags, spatial arrangements, exports and receipts.

**Nexus routes.** It mounts tools, validates event envelopes, brokers capabilities, selects model adapters and mediates writes back into Noted.

**Eidolin embodies.** A creature gives the assistant a persistent, playful and emotionally legible identity. It develops through use, learning, challenges, verified contributions and user choices.

**Nostr connects.** Approved public events can move across a user-selected relay fabric without making a central Nexus account the source of identity.

**Nex-Sim attacks.** Scenarios should attempt to break deterministic rules, permission boundaries, routing, receipts, migrations and social invariants before those claims are admitted.

## 5. A spatially legible assistant

The current Noted AI Brief Export can describe nodes and typed relationships. That already supports questions a plain document cannot answer well: Which ideas bridge otherwise separate clusters? Which claims have no supporting link? What has changed? Which summary hides unresolved branches?

The planned spatial layer adds the arrangement the user authored on a canvas. Position, grouping, distance and size may express emphasis or tentative association. They are signals, not truth. Nexus should send coordinates only when the user opts in, preserve their provenance and require the model to distinguish:

- an explicit user-created edge;
- spatial proximity without an edge;
- a semantic similarity computed by software;
- a relationship proposed by a model;
- a fact supported by underlying content.

The intended result is not “AI reads your thoughts.” It is “software reasons over a representation of your work that you can inspect, edit and withhold.” A useful response should point back to source nodes and explain why a pattern was inferred.

## 6. Creatures as the durable value

A creature is a personal assistant presented as a developing being rather than an interchangeable chat box. Its continuity can include a user-chosen name and appearance, lineage, learned preferences, approved summaries, skill history, battle outcomes and the receipts behind growth.

The model behind the creature is replaceable. The creature's portable history belongs to the user. A local model may handle private work; a configured API may provide stronger reasoning for a bounded task. Changing providers must not erase the creature or secretly transmit its entire history.

Growth should track demonstrated usefulness:

- explaining a graph accurately;
- finding a contradiction the user confirms;
- completing a routine within permission;
- surviving a simulation scenario;
- helping produce a reproducible repair;
- learning a preference that remains visible and reversible.

Growth must not be purchased. Cosmetic and game progression may make continued use enjoyable, but the project should never confuse addiction metrics with assistance quality.

## 7. Routing and bounded agency

Every managed block speaks through a common envelope. Reading notes, proposing a note, writing canonical state, contacting a model, publishing to Nostr and invoking an operating-system action are separate capabilities.

An agent may propose. It does not silently publish, spend, sign, delete, rewrite itself or convert an inference into user-authored truth. Risky actions show a preview and require approval. Execution returns a receipt containing the actor, capability, input digest, outcome and time. Reversible operations should include a rollback reference.

This architecture makes automation slower at the dangerous edge and faster inside an already approved, narrow loop. That is a feature, not friction to be hidden.

## 8. Social connection without a financial claim

Nexus can support connectivity, recognition and play without creating a market.

A person may publish a creature card, challenge, result digest, proof, repair or acknowledgement. Another person may reproduce a result and sign that fact. A tip may express appreciation. A rank may summarize scoped participation. None of these creates a transferable instrument.

The design invariant is:

> `SYNTHETIC DATA · NON-TRANSFERABLE · NON-REDEEMABLE · STRICT NO SALE`

Official builds provide no purchase, sale, cash-out, exchange rate, redemption, yield, wrap, bridge, wage, credit or crypto/fiat payout. Tips cannot be re-tipped or spent. Reputation is not reducible to tip count and should be weighted toward independent reproduction. Authority is scoped moderation or scenario admission, not ownership.

Because the source is open, no technical measure can stop two people making an external arrangement around accounts or forks. The project can still make the official protocol hostile to that use: no transfer primitive, no sale metadata, no price display, no supported identity handoff, visible warnings and tests that reject forbidden events. Attempts to establish an emergent official price narrative should be treated as safety incidents.

## 9. Nostr as an optional mesh

Nostr is useful here as a portable, relay-based event fabric. It may carry public summaries and proofs while the rich workspace remains local. Nexus should translate internal events centrally so that blocks do not each invent signing and relay rules.

Private keys must remain outside application storage. The user selects a signer and relay profile, previews publication and receives a local receipt. Private notes, full topology exports and model prompts are not public by default. “Connected” must always be a visible state.

Nostr is not required for the core product. A person should be able to use Noted, a local model and a creature entirely offline.

## 10. Nex-Sim and the duty to break the system

The simulator's purpose is not to generate impressive volumes of output. It should falsify claims. A scenario defines a seed, initial state, actions, expected invariants and failure oracle. A run produces machine-readable receipts and a summary tied to code and scenario digests.

For every claimed verifier, the project should preserve evidence that a controlled mutation made it fail. Example attacks include forged receipts, replayed tips, transferred credentials, altered snapshots, reordered events, missing approvals, compromised blocks, relay duplication, model prompt injection and nondeterministic creature battles.

Nex-Sim artifacts have been located locally but have not been admitted into the canonical repository and current build. Until their source, dependencies, deterministic behavior and relationship to current interfaces are independently established, their integration status is `UNABLE_TO_VERIFY`.

## 11. Realistic utility

The near-term useful product is narrower than the complete vision.

For a writer or researcher, Noted can become a durable project map whose selected structure is exportable to a chosen model. For a builder, Nexus can provide a consistent place to mount tools and inspect their permissions. For a local-AI user, a creature can eventually preserve an assistant identity across model changes. For an open-source contributor, simulation receipts can turn criticism into reproducible work. For a small community, synthetic acknowledgement can make verification and repair visible without attaching money.

People should not use this pre-release for valuable keys, financial activity, safety-critical decisions, confidential material sent to an untrusted API, clinical interpretation or authoritative claims about cognition. They should expect migration and data loss unless they keep exports.

## 12. Security, privacy and sovereignty

Local-first is a default, not a magic word. The release must enumerate every network path, identify CDN dependencies, show when a model or relay is contacted and let the user disable the network. Secrets must be held by a dedicated signer or operating-system facility, not local storage. Imported blocks are untrusted and receive least privilege.

Exports must be documented, versioned and human-inspectable. Deletion must not require an online account. Receipts must not include private content when a digest is sufficient. Logs must be bounded and clearable.

No security claim is accepted because an internal AI or maintainer wrote an audit. Independent reproduction and failing negative controls determine evidentiary weight.

## 13. Cold release and contribution

The intended release posture is a cold drop: publish code and claims without a presale, investment campaign or manufactured financial expectation; invite strangers to run, fork, criticize and destroy assumptions; repair what they can reproduce.

Contribution standing should arise from verified runs, breaks and repairs. The maintainer remains accountable for what official builds ship and must not use “community governance” to escape that responsibility. Forking remains a safety valve.

## 14. Falsifiers and measurements

The thesis weakens if any of the following persist:

- a clean stranger cannot build the documented release;
- meaningful use requires a private operator service;
- exports cannot recover the user's core material;
- model output cannot cite the graph it interpreted;
- users cannot tell what left the machine;
- creature continuity depends on one model vendor;
- synthetic mechanics develop an official transfer or price surface;
- simulation verifiers pass corrupted evidence;
- engagement grows while recurring useful outcomes do not.

Release metrics should include clean-install completion, time to first useful topology export, opt-in model success, export/reimport success, permission denial behavior, retention tied to user-defined useful sessions, independently reproduced scenarios and confirmed repairs. Stars and views are context, not proof.

## 15. Roadmap

**Phase A — honest raw release:** make installation deterministic; remove or quarantine wallet and transfer language; fix Eidolin packaging; inventory network behavior; ship export/recovery guidance.

**Phase B — bounded cognition:** unify topology and optional spatial exports; implement local/API adapters; preserve citations and AI lineage; add reversible proposal import.

**Phase C — creature continuity:** canonicalize naming and schemas; implement portable creature state, memory controls, progression and model switching.

**Phase D — adversarial admission:** import Nex-Sim through a provenance gate; define scenario and receipt schemas; prove verifiers fail controlled mutations.

**Phase E — voluntary mesh:** isolate signing; implement Nostr profiles; publish proofs and acknowledgements; enforce synthetic-economy rejection rules.

## Conclusion

Nexus is an attempt to make AI assistance personal without making it opaque, social without making it extractive, and playful without pretending that game data is money. Its strongest idea is also its simplest: the user owns the workspace and the creature; tools receive bounded authority; claims survive only when strangers can reproduce them.

The project will earn credibility only in working software. Until then, this paper is a map of promises that must be turned into tests.

## Appendix A — source and history basis

This draft was derived from repository source and committed project history, not from the white paper alone. Paths below are relative to the repository root and should be inspected in the release commit rather than trusted through this summary.

| Evidence | What it establishes | What it does not establish |
|---|---|---|
| `products/noted-host/src/topology/aiBriefExport.ts` | Current AI Brief code exports graph nodes, typed/directed/weighted edges, semantic metadata, lineage and focus/root context. | It does not establish unified canvas-coordinate export or accurate model interpretation. |
| `products/noted-host/src/studios/canvas/Canvas.tsx` | A separate canvas export includes positioned objects. | It does not establish that positions are currently sent through the AI Brief. |
| `products/noted-host/src/studios/nexusRouter/NexusRouterStudio.tsx` | Noted currently mounts Nexus OS through an iframe and host bridge. | An iframe alone does not establish capability security. |
| `products/noted-host/specs/NOSTR_ROUTING_SPEC.md` | The intended design separates internal routing, translation, signing and relay policy. | It does not prove the current Vibes implementation follows that design. |
| `blocks/Eidolin/src/` and `blocks/Eidolin/tests/` | A deterministic creature/world/battle/save vertical slice and tests exist. | The public package is not complete while its referenced `dist/src/runtime.js` is absent. |
| `products/creature-engine/README.md` | Creature-engine direction declares synthetic-only, non-redeemable progression. | It explicitly remains a scaffold rather than an engine implementation. |
| `experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/CANONICAL_CHECKPOINT_001.md` | The canonical checkpoint permits synthetic tips, reputation, status and game economy while forbidding investment, payout, transfer, redemption, wrapping and bridges. It records the creature-first and cold-drop intent. | Policy text does not enforce the runtime. |
| `experiments/NOTED_PROJECT_OS_001/CANONICAL_DIRECTION.md` | The system direction defines Noted as host, Lab as epistemic container, verified results as contribution and a hard firewall against real-world value. | It also states that the simulator frame was not yet runtime-attested there. |
| `products/noted-host/public/nexus/os/` | The inherited runtime contains wallet, balance, mint, transfer, stake and sats language, and tests that expect several of those surfaces. | “Display-only” does not make those metaphors aligned with the stricter new boundary. |

Relevant history on 21 July 2026 is visible in the repository log:

- commit `7da34b3` recorded the canonical anti-real-world-value checkpoint;
- commit `50523e4` imported Noted Phase 0;
- commit `09673bc` recorded the canonical direction for the simulator economy.

Those commits show that the strict boundary and current host were brought together in history; they do not show that the older Nexus runtime was fully migrated afterward. The white paper therefore treats the doctrine as the intended rule and the conflicting runtime as a release blocker.

Nex-Sim-named scripts, guides, bundles and receipt sets were located elsewhere on the drafting machine. Because they are outside this repository and were not fully executed and traced during this documentation task, this paper cites their existence only as `located`; their correctness and integration remain `UNABLE_TO_VERIFY`.
