# Sweep I - Whitepaper Frame: The Archive as Operating System Seed

## 1. The system being specified

Noted Nexus Router is a local-first personal operating surface for thinking, writing, prompting, building, playing, syncing, and delegating. It is not merely a note app. It is a layered archive in which different classes of tools live at different authority levels.

Noted is the host. It owns the user’s canonical workspace: notes, prompts, scraps, projects, canvases, libraries, shelves, and other durable local objects. It already has a React/Vite/Electron shell, IndexedDB-backed workspace behavior, route structure, and local application framing. It should remain stable and boring.

Nexus is the router. It is where dynamic blocks, experimental tools, Gameboy-shell interactions, agents, forges, social modules, wallet modules, engines, and future Nostr connections belong. It is the membrane between stable personal archive and volatile tool ecosystem.

Nostr is the external event fabric. It should not be embedded separately into every block. The router translates internal Nexus events into Nostr events only when policy, identity, capability, signing, and relay rules say that should happen.

The AI agent is not a god-mode script runner. It is an actor inside the router. It proposes, requests, transforms, files, dispatches, and annotates. It can act online only through an action broker. It can change UX only through reversible UI patches. It can self-evolve only through reviewable diffs, tests, lineage, and rollback.

## 2. The Gameboy shell as a serious systems decision

The Gameboy style is important because this system can become cognitively huge. The shell gives the user a consistent interaction grammar:

- **Screen:** what is currently being played or operated.
- **Menu:** where routes and blocks become selectable cartridges.
- **Inventory:** objects the user owns: notes, prompts, agents, Eidolons, keys, workflows, receipts.
- **Link cable:** Nostr and other external event bridges.
- **Save slot:** Noted archive state and export snapshots.
- **Mission log:** agent proposals, receipts, failures, approvals, and history.
- **Evolution lab:** controlled self-improvement of agents, prompts, blocks, and UI layouts.

The visual metaphor controls complexity. Without it, the architecture risks becoming a developer dashboard. With it, everything can still be deep, but every operation has an understandable home.

## 3. The zip as load-bearing object

The archive is not an attachment. The archive is the continuity surface. The current session can vanish. The next AI may be a different model. The human may not remember why a path exists. Therefore the zip must carry its own operating memory.

The v0.04 archive should contain:

```text
PROJECT_NOTES.md
CONTEXT.md
BUILD_BLOCKS.md
HANDOFF.md
BLOCK_PROMPT_BB-00.md
specs/
  NOTED_NEXUS_AI_ASSISTED_TECHNICAL_SPEC_v0.04.md
  SWEEP_1_WHITEPAPER_THESIS.md
  SWEEP_2_LOAD_BEARING_CONTRACTS.md
  SWEEP_3_IMPLEMENTATION_DEMONSTRATION.md
  LOAD_BEARING_CODE_EXCERPTS.md
  AI_ASSISTED_DEVELOPMENT_DEMO.md
  SECURITY_AND_CAPABILITY_MODEL.md
  NOSTR_ROUTING_SPEC.md
  AGENT_ACTION_AND_UI_MUTATION_SPEC.md
public/nexus/registry/
  block-registry.v0.04.json
  channel-registry.v0.04.json
  capability-registry.v0.04.json
  action-registry.v0.04.json
  nostr-kind-registry.v0.04.json
public/nexus/bridges/
  nexus-event-envelope.schema.json
  agent-action.schema.json
  ui-patch.schema.json
  nostr-translation.schema.json
src/bridges/
  nexusBridgeTypes.ts
  nexusActionTypes.ts
  nostrBridgeTypes.ts
```

The point is not to add paperwork. The point is to make the app buildable by agents without losing architectural intent.

## 4. The language every app speaks

Every block must eventually speak the Nexus Event Envelope. Some legacy blocks can remain iframed leaf apps, but managed blocks speak through the router.

Canonical event flow:

```text
block emits event
→ Nexus validates source, channel, payload, and capability
→ Nexus routes event locally or to Noted bridge
→ optional: Nexus translates event to Nostr
→ optional: action broker proposes external operation
→ user approves where required
→ executor runs operation
→ receipt returns to Nexus
→ Noted archives receipt if durable
```

The same language covers notes, prompt snapshots, Forge results, agent plans, UI patches, Pokémon/Eidolon state, Nostr posts, relay sync, online actions, and self-evolution proposals.

## 5. Noted, Nexus, Nostr, agent: authority boundaries

| Layer | Authority | Should do | Should not do |
|---|---|---|---|
| Noted host | Stable personal archive | Store canonical user objects, expose bridge, run app shell | Become the router for every experimental block |
| Nexus router | Inner OS / event kernel | Mount blocks, validate channels, route events, broker actions | Write directly to Noted without a bridge receipt |
| Gameboy shell | Operator console | Make complex actions navigable and playful | Hide dangerous actions behind aesthetics |
| Blocks | Sovereign tools | Work locally, emit declared events, consume declared events | Invent private sync or mutate host state directly |
| Nostr bridge | External event adapter | Translate selected events to signed relay events | Become each block’s private network library |
| Agent | Delegated actor | Plan, propose, organize, transform, act through capabilities | Silently mutate data, publish, spend, sign, or rewrite itself |

## 6. Self-evolution stance

The agent self-evolves, but not by editing itself in secret. The self-evolution loop is:

```text
observe friction
→ propose improvement
→ classify mutation ring
→ generate diff or workflow
→ run tests / static checks
→ show preview
→ get approval if required
→ apply through controlled executor
→ write receipt
→ monitor behavior
→ rollback if bad
→ preserve lineage
```

This is the difference between an evolving system and an unsafe autonomous mutation machine.

## 7. The AI-assisted development thesis

AI-assisted development does not mean "ask an AI to code." In this system it means:

- architecture is captured as executable constraints,
- build blocks are small enough to verify,
- every archive carries the current project brain,
- every changed code file explains its scope and load-bearing surfaces,
- every future AI worker is forced to load Context / Scope / Verify before changing anything,
- risky regions are ring-classified,
- and no block is trusted until the gate passes.

The app itself becomes both product and method. It is a tool for organizing the user and a case study in making AI-generated software survive more than one chat window.

