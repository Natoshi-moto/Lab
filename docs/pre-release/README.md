# Nexus / Noted Pre-Release

> A local-first thinking environment, a routed tool system, and creatures that can grow into personal AI assistants.

**Status:** raw pre-release documentation, 22 July 2026. Expect broken edges, renamed parts, destructive experiments, and incompatible saves.

**Boundary:** `SYNTHETIC DATA · NON-TRANSFERABLE · NON-REDEEMABLE · STRICT NO SALE`

This is an early public door into a system being built in the open. It is not a polished product, a cryptocurrency, an investment, a financial network, or a promise of future value. The useful thing is meant to be the software: a workspace that preserves your material, exposes its relationships, routes tools safely, and lets you develop a creature assistant around the way you actually work.

## The shortest explanation

Noted is the durable local workspace. Nexus OS is the router and operator console inside it. Eidolin is the creature-facing experience under active consolidation. A chosen local language model—or an API only when the user configures one—can eventually help a creature reason over an explicit export of notes, links, tags, projects, and canvas structure. Nostr is an optional public event fabric. Nex-Sim is intended to attack the rules and integrations before anyone is asked to trust them.

```text
your notes and canvases
        ↓ explicit export
Noted ──→ Nexus router ──→ chosen model
  ↑             │                │
  └── receipts ─┴── creature conversation/proposals
                         │
                  optional Nostr sharing
```

The model does not read a mind. It receives a bounded representation the user chooses to export. The current AI Brief Export includes graph topology and semantic metadata. Canvas positions exist in a separate export; a unified spatial reasoning contract is planned, not shipped.

## What exists today

The labels in this table are deliberate.

| Part | Status | What that means |
|---|---|---|
| Noted host | **Implemented / experimental** | React/Vite/Electron workspace with notes, projects, canvas and local persistence. |
| AI Brief Export | **Implemented** | Exports selected nodes, typed edges, direction, weights, tags, projects, summaries and lineage for a model. |
| Canvas export | **Implemented separately** | Carries positioned canvas data, but is not yet the unified AI spatial contract. |
| Nexus OS shell/router | **Implemented / legacy-bearing** | Runs inside Noted and mounts tools, but inherited blocks still violate the intended release language and security boundary. |
| Eidolin vertical slice | **Experimental** | Deterministic terrain, creatures, battles, lineage and local saves exist; the packaged runtime currently references a missing build artifact. |
| Creature assistant | **Planned** | The durable identity, memory policy, model conversation and growth loop are not complete. |
| Nostr bridge | **Partly implemented / unsafe legacy path** | Some code connects to relays; raw private-key storage in a legacy path must be replaced by a signer boundary. |
| Synthetic tips/status | **Specified, not release-ready** | Intended as non-transferable appreciation and reproduced contribution records. Legacy wallet/transfer language remains a blocker. |
| Nex-Sim | **Located locally; unable to verify as integrated** | Bundles, scripts and receipts exist outside the canonical repo. They require provenance, import and adversarial admission. |

## What the first raw release is for

The first release should let a stranger:

1. install and open Noted without private context;
2. create, connect, arrange and export their own material;
3. understand exactly what leaves the machine;
4. mount Nexus without granting silent authority;
5. recover their work from a documented export;
6. see which creature, social and simulation features are demonstrations rather than promises;
7. break the system and submit a reproducible receipt.

Virality is a hypothesis. Utility is tested through successful onboarding, retained use, useful exports, recoverable data, voluntary creature interaction and reproducible third-party contributions—not views, rhetoric or an artificial balance.

## Try the current Noted host

Prerequisites are Node.js and npm. From the repository root:

```bash
cd products/noted-host
npm ci
npm run dev
```

For a release build:

```bash
npm run build
```

Run the repository checks from the root as documented by the current project:

```bash
bash tests/run.sh
```

At the time this document was drafted, the root script was not executable directly and the test run reported a missing `blocks/Eidolin/dist/src/runtime.js`. That is a release blocker, not an installation tip. Do not work around it and then report the tree as green.

## Bitcoin as foundation, not branding

Bitcoin supplies the engineering and social inspiration: user sovereignty, inspectable rules, portable state, minimized trust, adversarial verification, voluntary participation and history that is difficult to rewrite unnoticed. Nexus does not claim to be Bitcoin, does not issue an asset, and does not borrow Bitcoin's credibility to give synthetic points a price.

The official system must never provide a sale, cash-out, redemption, exchange rate, yield, on-ramp, off-ramp, wrap, bridge or transferable balance for its game data. Open-source code cannot prevent two people arranging an off-platform account sale; it can refuse to facilitate, endorse or design for one.

## Before trusting or contributing

Read:

- [System README](./SYSTEM_README.md) for the architecture and current fractures.
- [White Paper](./WHITEPAPER.md) for the product thesis, ethos and realistic utility.
- [Technical Specification](./TECHNICAL_SPEC.md) for schemas, trust boundaries and release gates.
- the repository's root `README_START_HERE.md`, `STATUS.md`, `NEXT_ACTION.md` and constitutional documents for current operations.

Contributions are strongest when they contain a failing case, a minimal repair and a receipt another stranger can reproduce. Governance prose, model output and internal reviews are evidence only to the extent that an independent person can rerun what they claim.

## License and risk

The repository currently carries an MIT license. This pre-release is research software. Keep backups, inspect network behavior, use test identities, do not place valuable keys in it, and do not treat creatures, tips, ranks, badges, proofs or NEX-labelled legacy data as money.
