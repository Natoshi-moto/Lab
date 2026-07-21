# Sweep III - Implementation Demonstration and Build Packet

This sweep turns the spec into a work program that a coding AI can execute. The point is not to finish every feature in one burst. The point is to make the archive ready for disciplined forward motion.

## 1. What v0.04 adds to the archive

The v0.04 spec-bearing archive adds three classes of material:

1. **Human-readable doctrine:** the whitepaper and technical spec.
2. **Machine-readable contracts:** TypeScript bridge types, JSON schemas, and registries.
3. **AI-worker continuity files:** project notes, context, build blocks, handoff, and the first block prompt.

This means a future coding worker can open the zip and start from the archive itself, not from this chat.

## 2. First implementation milestone

The first real implementation should not be Nostr publish or online action execution. The first milestone should be a local bridge loop:

```text
Prompt Studio v3 emits prompt.snapshot.created
→ Nexus Router receives it
→ Nexus forwards it to Noted bridge
→ Noted creates or updates a Prompt record
→ Noted returns a receipt
→ Nexus displays confirmation
→ receipt is archived
```

This proves the whole architecture locally without requiring relay keys, signing, remote permissions, or online actions.

## 3. Build block sequence

| ID | Name | Primary outcome |
|---|---|---|
| BB-00 | Spec-bearing scaffold | Add bridge types, schemas, registries, planning packet, no behavior mutation |
| BB-01 | Noted bridge listener | Add typed host-side `postMessage` listener and receipt channel |
| BB-02 | Nexus host adapter | Add Nexus-side adapter that can target Noted host events |
| BB-03 | Prompt Studio managed shim | Wrap Prompt Studio v3 emission into managed event language |
| BB-04 | Prompt snapshot import | Convert `prompt.snapshot.created` into Noted prompt records |
| BB-05 | Action broker dry run | Add proposed action queue, preview, approval state, receipts |
| BB-06 | UI patch preview | Add reversible UI patch model for Gameboy shell only |
| BB-07 | Agent action proposal | Let Nexus Agent propose local organization actions, no external execution |
| BB-08 | Nostr identity/signer config | Add NIP-46 oriented signer configuration and relay list policy |
| BB-09 | Nostr read bridge | Read selected app events from configured relays |
| BB-10 | Nostr write bridge | Publish approved app-specific events and receipts |
| BB-11 | Online action adapters | Add webhook/GitHub/email/calendar adapters as approval-gated mocks first |
| BB-12 | Self-evolution lab | Add patch proposal, diff, test command, approval, rollback receipts |
| BB-13 | Gameboy UX integration | Make actions, inventory, mission log, link cable, and evolution lab navigable |
| BB-14 | Package and audit | Produce final verified archive/artifact with docs and clean run path |

## 4. Verification philosophy

Every block must verify three things:

1. **The app still builds.** `npm run typecheck` and `npm run build` must pass.
2. **The contract did not drift.** Grep or script checks must confirm no silent changes to `@load-bearing` lines, no unauthorized new persistence, no unauthorized network calls, and no SDK imports outside approved blocks.
3. **The behavior works.** A short manual or automated smoke test must prove the block’s event path.

## 5. The demonstration narrative

The product demo should eventually show this path:

```text
User writes rough prompt in Noted
→ Send to Nexus / Prompt Studio
→ Prompt Studio analyzes and forges improved prompt
→ Agent proposes filing result into project
→ User approves
→ Noted stores it as prompt artifact
→ Nexus mission log records receipt
→ Optional: publish encrypted or app-specific sync event to Nostr
→ Another device pulls event and restores the prompt artifact
```

This demo proves the architecture as product and method:

- Noted remembers.
- Nexus routes.
- Prompt Studio transforms.
- Agent organizes.
- User approves.
- Nostr transports.
- Archive preserves.
- Verification keeps the system from drifting.

## 6. Security stance for online actions

Online actions are not browser automation free-for-all. The system must represent online actions as adapter-specific capabilities.

```text
online.fetchUrl.preview
online.fetchUrl.execute
nostr.publish.preview
nostr.publish.execute
github.issue.createDraft
github.issue.submit
email.draft.create
calendar.event.createDraft
```

High-risk actions require confirmation every time until the user changes policy. Credentials must be stored only through explicitly specified blocks. Blocks cannot sneak in SDKs or auth headers. Any new provider adapter must have a mock mode and a receipt mode before real execution.

## 7. The UX mutation demonstration

A safe UI mutation demo:

```text
Agent observes: user repeatedly sends notes to Forge.
Agent proposes: add “Forge this” action to note cards.
Router classifies: UI patch, workspace scope, reversible.
User previews: button placement and behavior.
User approves.
Gameboy shell / Noted host applies patch.
Receipt records patch ID and revert path.
```

Unsafe version:

```text
Agent directly rewrites JSX, changes note card behavior, and stores hidden preference.
```

The spec forbids the unsafe version.

## 8. The self-evolution demonstration

A safe self-evolution demo:

```text
Agent finds that Prompt Studio snapshots do not include analysis score.
Agent proposes schema extension: add optional `analysisScore`.
Router classifies as ring1 because event payload shape changes.
Spec shows diff and affected consumers.
Tests prove backward compatibility.
User approves.
Patch applies.
Receipt records old schema, new schema, test results, rollback path.
```

This is the principle: self-evolution is not magic. It is disciplined patch flow with stronger UX.

## 9. What must not happen next

Do not add five more iframes directly to Noted. Do not add Nostr separately to Prompt Studio, Agent, Lattice, and Pokémon engines. Do not let the agent bypass the router. Do not let UI mutation become hidden DOM mutation. Do not let self-evolution happen outside receipts.

The next phase is small, local, and provable: Prompt Studio snapshot to Noted prompt through Nexus Router.

