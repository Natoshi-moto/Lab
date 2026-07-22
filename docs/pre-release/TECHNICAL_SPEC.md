# Nexus / Noted Pre-Release Technical Specification

**Version:** 0.1-draft

**Date:** 22 July 2026

**Normative terms:** MUST, MUST NOT, SHOULD and MAY carry their conventional requirements meaning.

**Scope:** the first externally usable raw release and the interfaces needed for later creature, model, Nostr and simulation work.

## 1. Conformance and status

A build conforms only when every MUST applicable to its declared feature set has an executable acceptance test. Planned behavior MUST NOT be displayed as operational. Every shipped component MUST declare one of `implemented`, `experimental`, `legacy` or `disabled`; documentation MAY additionally use `unable_to_verify` for unadmitted artifacts.

The current repository does not conform fully. Known failures include the missing Eidolin distribution artifact, legacy financial/transfer UI and an unsafe legacy Nostr key path.

## 2. Canonical vocabulary

| Term | Meaning |
|---|---|
| Noted | Local canonical workspace and host shell. |
| Nexus OS | Inner router/kernel and operator console mounted by Noted. |
| Block | A bounded tool mounted by Nexus. |
| Creature | Portable assistant identity and development history. |
| Eidolin | Canonical creature-world implementation name for this release line. |
| Model adapter | Replaceable local or remote inference interface. |
| Receipt | Immutable record of a request, decision, execution or verification. |
| Nex-Sim | Adversarial scenario runner, once admitted. |
| Tip | Non-transferable appreciation receipt; never a spendable unit. |

Older names—Eidolon, Edolin Creator, Vibes, Pokémon-derived labels and NEX wallet terminology—MUST be mapped in migration code or marked legacy. “NEX” MUST NOT name a currency or transferable balance in a conforming release.

## 3. Trust boundaries

```text
user-authored local state       trusted as user data, not necessarily fact
Noted host                       trusted persistence boundary
Nexus router                     trusted policy enforcement boundary
blocks                           untrusted by default
model output                     untrusted proposal
imported files/events            untrusted input
Nostr relays                     untrusted transport
signer                           separate high-trust boundary
Nex-Sim receipts                 evidence only after verifier admission
```

No iframe origin, block name, model response or Nostr signature grants host authority by itself. All boundary messages MUST validate origin/source identity, schema version, channel, capability, size and replay policy.

## 4. Architecture and event flow

The canonical flow is:

```text
block/model/user emits request
→ router validates envelope
→ policy evaluates capability and scope
→ approval UI appears when required
→ adapter executes
→ receipt is returned
→ Noted stores an approved durable change or receipt
```

The event envelope MUST contain:

```ts
interface NexusEnvelope<T = unknown> {
  schema: "nexus-envelope/1";
  id: string;
  correlationId?: string;
  timestamp: string;
  source: { blockId: string; instanceId: string };
  destination: "router" | "noted" | `block:${string}` | "nostr";
  type: string;
  capability?: string;
  payload: T;
  payloadDigest: string;
}
```

IDs MUST be collision-resistant. Digests MUST bind canonical serialized payload bytes. The router MUST reject unknown schema versions, undeclared event types, excessive payloads and duplicate non-idempotent IDs.

## 5. Capability model

Capabilities MUST be narrow verbs with scope, for example:

- `noted.read.selection`
- `noted.propose.object`
- `noted.write.approved-object`
- `model.infer.local`
- `model.infer.remote`
- `nostr.publish.approved`
- `signer.sign.approved-event`
- `system.open.approved-url`

Each grant records subject, capability, resource scope, duration, interaction mode and revocation ID. Remote inference, publication, deletion, signing and external process execution MUST require a visible approval unless a user has created a narrowly scoped, revocable standing rule. Blocks MUST NOT receive raw API keys or signing keys.

## 6. Noted data and export contract

Noted remains canonical for user-authored objects. Every object MUST carry an ID, type, schema version, created/updated time and lineage. AI proposals MUST remain distinguishable from user-authored state.

### 6.1 Topology export

The existing export is the basis for `noted-ai-brief/1`:

```ts
interface TopologyNode {
  id: string;
  type: string;
  title?: string;
  summary?: string;
  tags: string[];
  projectIds: string[];
  semanticColorId?: string;
  lineage: "user" | "imported" | "ai-proposed" | "ai-approved";
}

interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  directed: boolean;
  weight?: number;
}
```

An export MUST include selection rules, root/focus IDs, omitted-content counts, creation time and a digest. It MUST NOT silently include nodes outside the previewed boundary.

### 6.2 Spatial layer

The unified optional layer is:

```ts
interface SpatialPlacement {
  nodeId: string;
  canvasId: string;
  x: number; y: number; width: number; height: number;
  layer?: string;
  provenance: "user_positioned" | "auto" | "imported" | "stale";
}
```

Coordinates MUST be normalized to `[0,1]` within an identified canvas. Exporters MUST preserve raw coordinates only in an optional extension. Consumers MUST NOT interpret proximity as an explicit relationship. Model responses SHOULD attach evidence references and an inference class.

### 6.3 Proposal import

Model-created nodes and edges MUST enter a preview collection first. Acceptance MUST preserve the model/provider, prompt/export digest, time and approving user action. Rejection MAY be retained locally as creature learning data only with user consent.

## 7. Model adapter contract

```ts
interface ModelRequest {
  requestId: string;
  adapterId: string;
  purpose: "explain" | "challenge" | "summarize" | "propose";
  context: { exportDigest: string; content: unknown };
  systemPolicyVersion: string;
  maxOutputTokens: number;
}

interface ModelResponse {
  requestId: string;
  provider: string;
  model: string;
  local: boolean;
  output: unknown;
  evidenceRefs: string[];
  startedAt: string;
  completedAt: string;
}
```

Local adapters MUST work without network access after model installation. Remote adapters MUST preview destination, selected context and secret source. Logs MUST redact secrets and SHOULD store digests instead of full prompts. A provider change MUST not change creature identity.

Prompt injection in note content MUST be treated as untrusted content, not router instructions. Model output cannot directly call a privileged capability; it creates an action proposal subject to ordinary policy.

## 8. Creature and Eidolin contract

Creature state MUST be portable, versioned and independent of a particular model vendor:

```ts
interface CreatureState {
  schema: "nexus-creature/1";
  id: string;
  name: string;
  createdAt: string;
  appearance: Record<string, string>;
  lineage: { parentIds: string[]; ceremonyReceipt?: string };
  preferences: ApprovedPreference[];
  skills: SkillEvidence[];
  progression: ProgressionState;
  historyDigest: string;
}
```

Preferences MUST show provenance and support edit/delete. Growth MUST cite an outcome or explicit user choice. The runtime MUST NOT represent purchased power, tradable creatures or cash value. Export/import MUST preserve identity and detect conflicting histories without silently overwriting either branch.

The current Eidolin deterministic world/battle/save work MAY be admitted after its build artifact is generated reproducibly, its tests run from the root and its naming/schema are migrated. Until then it remains experimental.

## 9. Synthetic economy invariants

All conforming UI displaying synthetic state MUST make the boundary discoverable:

`SYNTHETIC DATA · NON-TRANSFERABLE · NON-REDEEMABLE · STRICT NO SALE`

The official protocol and interfaces MUST NOT implement:

- purchase, sale, auction or exchange-rate fields;
- transfer of tips, reputation, credentials, ranks, creatures or game balances;
- redemption, withdrawal, cash-out, payout or yield;
- fiat, cryptocurrency or Bitcoin-denominated value;
- wrap, bridge, on-ramp or off-ramp;
- founder allocation framed as profit or investment inventory.

A tip is an appreciation event:

```ts
interface AppreciationReceipt {
  schema: "nexus-appreciation/1";
  id: string;
  from: string;
  subject: { type: "artifact" | "run" | "repair" | "creature"; id: string };
  message?: string;
  createdAt: string;
  signature?: string;
}
```

There is intentionally no amount, owner, spend, transfer or redemption field. Rate limits and anti-Sybil measures MAY affect display but MUST NOT pretend to prove personhood. Reputation calculations MUST be explainable and SHOULD privilege independently reproduced runs, confirmed breaks and accepted repairs over raw acknowledgements.

Automated release checks MUST scan shipped UI, schemas and route names for forbidden surfaces including `buy`, `sell`, `price`, `cashout`, `withdraw`, `yield`, `sats`, `wallet`, `send`, `transfer`, `wrap` and `redeem`. Allowlisted educational or migration occurrences require explicit context. Tests MUST also submit forbidden events and observe rejection.

## 10. Nostr adapter

Blocks emit internal events; only the Nexus Nostr adapter translates them. A publication request includes internal event digest, target kind, selected relays, public payload preview and approval reference.

The signer MUST be external to block and ordinary application storage. Preferred implementations are a remote signer protocol or an isolated OS-backed signer. Raw private keys MUST NOT enter localStorage, IndexedDB, logs, exported workspaces or block messages.

Relay input MUST be bounded, deduplicated, schema-validated and treated as hostile. Publishing MUST be opt-in. Receiving MUST NOT grant write authority. Full notes, topology exports, spatial layouts, prompts and private creature memory MUST be private by default.

Permitted initial public objects are signed summaries, scenario definitions, run digests, reproduction attestations, repair references, creature cards without private memory and appreciation receipts. Market and transfer events for synthetic state MUST be rejected.

## 11. Nex-Sim admission and interface

Nex-Sim is not a dependency until an admission packet establishes:

1. source and author/provenance;
2. exact version and source digest;
3. dependency lock and clean build;
4. deterministic seed behavior or documented nondeterminism;
5. scenario, receipt and summary schemas;
6. verifier semantics and negative controls;
7. license compatibility;
8. current Nexus interface mapping.

Minimum scenario form:

```ts
interface NexSimScenario {
  schema: "nexsim-scenario/1";
  id: string;
  seed: string;
  initialState: unknown;
  actions: unknown[];
  invariants: { id: string; oracle: string }[];
  limits: { steps: number; wallMs: number; memoryMb: number };
}
```

A run receipt MUST bind scenario digest, engine digest, seed, environment, ordered event digest, invariant results and exit status. A verifier MUST be observed failing at least one controlled corruption of each protected property. Hash sidecars prove byte correspondence only; they do not prove correctness, authorship or execution.

Required attack families include capability escalation, forged source identity, replay, reordered events, stale approvals, malicious model output, prompt injection, signer leakage, relay duplication, topology over-export, spatial overinterpretation, synthetic transfer attempts, receipt tampering, save migration and nondeterministic battle outcomes.

## 12. Persistence, portability and recovery

The release MUST document every persistence store. A full user export MUST be versioned and include canonical objects, graph edges, canvas placement, creature state, user-approved preferences and receipt indexes. Secrets, raw model credentials and signing keys MUST be excluded.

Import MUST validate schemas and digests, preview changes, preserve unknown fields where safe and never silently destroy a conflicting branch. At least one human-readable representation MUST accompany binary or database state. Users MUST be able to delete local state without contacting a service.

## 13. Threat model

The minimum threats are:

- malicious or compromised blocks;
- hostile imported notes and prompt injection;
- over-broad model context export;
- compromised remote model provider;
- stolen API or signing keys;
- untrusted Nostr relays and replayed events;
- forged simulation evidence;
- Sybil manipulation of reputation;
- UI language that encourages financial interpretation;
- dependency/CDN compromise;
- schema downgrade and save corruption;
- maintainer or AI claims unsupported by execution.

Controls include least privilege, schema validation, content limits, isolated signing, network visibility, explicit approvals, provenance, digests, negative tests, deterministic builds, dependency pinning, portable exports and independent reproduction. The release MUST say which threats remain open.

## 14. Receipts and auditability

A receipt records what happened; it does not prove that the action was wise. Every privileged action receipt MUST contain request ID, actor, capability, scoped target, input/output digests, policy decision, user approval where applicable, implementation version, time, status and error class. Receipts SHOULD be append-only and exportable as JSON Lines.

Internal AI reviews MUST identify their producer and direction. They MUST NOT be labelled independent. A passing verifier has evidentiary weight only after its protected property and observed negative control are documented.

## 15. Release gates

### Gate 0 — truth and inventory

- One canonical component/status manifest.
- All network destinations and CDN dependencies enumerated.
- Legacy wallet, sats, transfer, mint, stake and raw-key paths removed from the shipped route or visibly quarantined and unreachable by default.
- Nex-Sim labelled unadmitted until its admission packet passes.

### Gate 1 — clean stranger build

- Clean clone and lockfile install succeed on documented platforms.
- Root health command, full tests, all CI verifier steps and production build pass.
- Commands do not require private files or undocumented deviations.
- Verification leaves the worktree unchanged.

### Gate 2 — negative controls

- Each verifier is observed failing a controlled mutation.
- Forbidden synthetic-economy events are rejected.
- Over-scope topology export fails.
- Unauthorized host write, signing and publication fail.
- Corrupted saves and receipts fail without destroying good state.

### Gate 3 — sovereignty

- Core Noted use works offline.
- Local model path is documented when offered.
- Remote context preview and network indicator work.
- Full export/reimport and deletion tests pass.
- No raw valuable key is required for demonstrations.

### Gate 4 — creature and mesh

- Creature survives model adapter change and export/import.
- Growth cites evidence and preferences are reversible.
- Nostr signing occurs through isolated signer.
- Relay replay and duplicate handling pass.
- Public objects expose no private workspace content by default.

## 16. Current migration requirements

Before the first raw public tag:

1. build and package `products/noted-host/public/nexus/os/blocks/Eidolin/dist/src/runtime.js` reproducibly or remove its broken entry point;
2. make the root test command executable or document invocation consistently;
3. remove/quarantine legacy NEX wallet, balance, send, transfer, receive, stake, mint and sats surfaces;
4. replace raw localStorage Nostr keys with the signer interface;
5. unify topology and optional spatial export without expanding default scope;
6. publish component status and network inventory in the release artifact;
7. import Nex-Sim only through the admission gate;
8. add forbidden-surface and adversarial event tests;
9. prove export/reimport on a fresh profile;
10. retain this specification beside the tagged code and record deviations.

## 17. Definition of the first useful release

The release is useful when an unaffiliated person can create and arrange material in Noted, export an understandable bounded graph, choose whether any model sees it, receive cited proposals without surrendering canonical control, recover their state and identify every experimental boundary. Creature presentation may be limited. Nostr and Nex-Sim may remain disabled. Honesty and recovery are release features.

The larger vision is admitted incrementally. No roadmap item becomes a fact because it appears in this specification.
