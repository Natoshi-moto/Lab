# Security and Capability Model v0.04

## Threat model

The system mounts arbitrary and semi-arbitrary HTML blocks inside a larger local-first workspace. Some blocks may request network operations, signing, storage, prompt execution, UI mutation, or source mutation. The risk is not only malicious code. The larger risk is confused-deputy behavior: a block or agent does something the user did not intend because boundaries were informal.

## Capability classes

| Capability | Description | Default |
|---|---|---|
| `noted.read` | Read selected Noted objects | gated by user scope |
| `noted.write` | Create or update Noted objects | receipt required |
| `nexus.emit` | Emit declared Nexus events | manifest required |
| `nostr.read` | Fetch from configured relays | configured relay policy |
| `nostr.sign` | Request signer signature | approval / signer confirmation |
| `nostr.publish` | Publish signed events | approval default |
| `online.fetch` | Fetch arbitrary URL | approval or allowlist |
| `online.send` | Send to external service | approval default |
| `ui.patch` | Propose UI mutation | preview + rollback |
| `agent.evolve` | Propose code/prompt/policy mutation | high-friction review |

## Capability principle

Capability is not equivalent to JavaScript access. A block running in a permissive iframe still does not have semantic permission to mutate the archive. The router must treat capability as an application-level permission layer.

## Receipts

Every effectful action produces a receipt. Receipts are the bridge between trust and memory.

A receipt should include:

- action id,
- actor,
- capability used,
- target,
- input digest where useful,
- output summary,
- timestamp,
- approval status,
- executor,
- reversibility,
- errors,
- references to created objects.

## Forbidden default

No new persistence, network, signing, SDK import, background worker, telemetry, eval, shell execution, or external auth may be introduced unless a build block explicitly authorizes it.

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Defines the capability and receipt security model for v0.04 onward.
LOAD-BEARING: capability gates and action receipts mediate all effectful actions.
DECISIONS:
  - Risk is treated as confused deputy as much as malicious code.
  - Capabilities are semantic permissions beyond iframe sandbox permissions.
  - Receipts are mandatory for effectful actions.
OPEN: Exact UI for permission policy is deferred to the action broker block.
VERIFY: Compare capability names against capability-registry.v0.04.json.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · drafted capability model.
───────────────────────────────────────────────────────────── -->
