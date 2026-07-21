# Agent Action and UI Mutation Specification v0.04

## Principle

The AI agent can control parts of the application only through declared actions. It cannot silently mutate canonical data, publish online, or rewrite UI. Control is mediated by the router.

## Action states

```text
proposed → previewed → approved → executing → succeeded
                   ↘ rejected
                   ↘ failed
                   ↘ expired
```

## Agent action envelope

```ts
type AgentAction = {
  id: string
  proposedBy: NexusActorRef
  actionType: string
  capability: string
  target: NexusRef
  input: unknown
  risk: 'low' | 'medium' | 'high' | 'critical'
  approval: 'none' | 'ask-once' | 'always' | 'human-only'
  preview: ActionPreview
}
```

## Safe examples

- classify inbox items into projects,
- create prompt drafts from notes,
- propose a Forge run,
- draft a Nostr event without publishing,
- propose a UI shortcut,
- propose a schema-compatible patch,
- generate a test plan.

## Dangerous examples

- publishing to Nostr without approval,
- sending email without approval,
- committing code without diff review,
- storing API keys through a block that was not authorized to introduce credentials,
- rewriting source files without a verified patch flow,
- changing event names without ring1 review.

## UI mutation policy

UI mutation is reversible patching. It must include:

- target surface,
- rationale,
- preview,
- diff or patch body,
- scope,
- rollback path,
- receipt.

The agent may propose a layout change because the user repeatedly follows a pattern. The agent may not silently personalize the app until the UI becomes impossible to audit.

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Defines agent-mediated actions and reversible UI mutation rules.
LOAD-BEARING: agents act through Action Broker; UI changes are reversible patches.
DECISIONS:
  - Proposal is separated from execution.
  - Online and self-evolution actions default to explicit approval.
  - UI mutation is represented as data before it becomes behavior.
OPEN: Policy editor UX is deferred to BB-05 and BB-06.
VERIFY: Compare with agent-action.schema.json and ui-patch.schema.json.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · drafted action and UI mutation spec.
───────────────────────────────────────────────────────────── -->
