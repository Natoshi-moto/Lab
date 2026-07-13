# R015 independent durability-verification protocol V0

## Purpose and bounded claim

R015 tests whether a second implementation can consume a closed export of one
R014 SQLite history and separately reproduce the frozen R013 genesis,
every signed transfer, every receipt, every durable-record hash, and every
prefix anchor.  It also models the abstract commit/crash/acknowledgement/retry
lifecycle under an explicit finite bound.

The only admissible combined disposition is:

```text
DEMONSTRATED_CROSS_IMPLEMENTATION_DURABILITY_TRANSCRIPT_VERIFICATION_AND_BOUNDED_CRASH_LIFECYCLE_CONSISTENCY
```

This is not money, economic value, safe custody, backing, redemption, network
consensus, global finality, physical power-loss proof, production security,
external audit, or unbounded formal verification.

## Frozen boundary

The R014 Python store, CLI, status module, repository verifier, R014 tests,
schemas, task, and receipts are immutable inputs.  R015 must not modify them.
The transcript exporter is an untrusted projection producer in a new R015
file.  Passing depends on the cold verifier's recomputation, never on trusting
the exporter.

The cold verifier may read only this protocol, the closed transcript schema,
the closed transcript, separately supplied anchor files, the public R013 V0
protocol/schemas, and the pinned public cryptographic dependency.  It must not
read, import, invoke, translate, or inspect `system/nexus_lab/durable_store.py`,
the R014 tests, the R013 implementation files, or obsolete PR #14's journal.

## Canonical profile and hashes

Use R013's closed printable-ASCII canonical JSON profile: exact UTF-8 without
BOM, compact separators, recursively sorted object keys, closed shapes,
duplicate-key rejection, no numbers/booleans/null, canonical base64, and exact
received-byte equality.  Transcript input is bounded to 32 MiB, records to
256, and transaction/receipt raw values to 65536 bytes each.

Tagged hashes use:

```text
SHA256(SHA256(ASCII(tag)) || SHA256(ASCII(tag)) || message)
```

R013 semantics and tags are defined by
`operations/proposals/R013_PCX_CONSERVED_CLAIM/PROTOCOL.md` and its genesis,
transfer, receipt, and anchor schemas.  Four admitted synthetic owner keys are:

```text
bd31dcf54d9b3255ab917685de56afd9a593c503086c9a02bc692bc40a28cdaa
e213e0ad80924531679056653aabb4a6ad9937e42ecac3c5e0fe2c82c212b049
0a207102823217b7e722847916ba90ffc1d249d77b7220f646fb633aacde54c7
b5e14889a863987b67737e56699decaf8c62f5af1fc8e0773836a95782de4fec
```

## Closed transcript

The exact schema is
`constitution/schemas/pcx-closed-durable-transcript.schema.json`.
The top-level fields are exactly:

```text
schema, network_id, genesis_id, genesis_b64, genesis_raw_sha256,
initial_state_root, max_records, record_count, records, anchors,
terminal_anchor, closure, status_authority, transcript_id
```

`closure` is `CLOSED_EXPORTED_PREFIX`; it means only that the file contains a
complete exported database prefix.  It does not prove that no later database
suffix existed or that the export is fresh.  `anchors` contains exactly
`record_count + 1` entries, starting with sequence zero, and
`terminal_anchor` exactly duplicates its last entry.  Embedded anchors prove
internal convergence only.

The transcript ID is the tagged hash using
`NEXUS/PCX/CLOSED-DURABLE-TRANSCRIPT/V0` over canonical transcript bytes with
`transcript_id` replaced by the empty string.

Each transcript record has exactly:

```text
schema, sequence, previous_record_hash, record_hash, tx_id, tx_b64,
tx_sha256, previous_state_root, next_state_root, receipt_hash, receipt_b64,
receipt_raw_sha256, status_authority
```

The durable-record hash subject has exactly these fields:

```text
schema = nexus.pcx-durable-record/v0
network_id = NEXUS-R013-SYNTHETIC
genesis_id = 974cd4da89feb9f7ae8e14d7b4359f4b76d8697f55e5793219c52e38b627b7de
sequence
previous_record_hash
tx_id
tx_sha256
previous_state_root
next_state_root
receipt_hash
receipt_raw_sha256
status_authority = NONE
```

Hash it with tag `NEXUS/PCX/DURABLE-RECORD/V0`.

An anchor has exactly the fields in
`constitution/schemas/pcx-durable-anchor.schema.json`.  Its `anchor_id` is the
tagged hash `NEXUS/PCX/DURABLE-ANCHOR/V0` over the canonical complete anchor
with `anchor_id` empty.  Sequence zero requires empty record and receipt
heads.  Later anchors use that record's hash, next state root, and receipt
hash.

## Independent replay

For each record in sequence order, the verifier must:

1. decode and validate exact transcript shape, count, chain, authority, and
   transcript ID;
2. decode canonical genesis bytes and reproduce the pinned genesis ID, supply
   `1000`, initial UTXO state, and initial state root;
3. decode canonical transfer bytes, reproduce transaction ID and return hash,
   verify every Ed25519 witness with pinned `@noble/ed25519` strict mode, and
   apply the R013 transition to the replayed UTXO state;
4. require a fresh `VALID_CONSERVED_TRANSFER`; a repeated accepted transaction
   is not a valid second durable row;
5. reconstruct the exact R013 receipt, compare its canonical bytes byte-for-
   byte with `receipt_b64`, and reproduce both receipt hash and raw SHA-256;
6. compare every stored derived field rather than using it to drive state;
7. reproduce the durable-record hash and the corresponding prefix anchor;
8. require all embedded prefix anchors and the terminal anchor to match;
9. retain supply exactly `1000` and no more than 64 live outputs.

The verifier must be a standalone Node ESM file.  Its only imports may be
Node standard-library modules and `@noble/ed25519`.  It must not import or
spawn Python, SQLite, Nexus implementation modules, or another verifier.

## Separately supplied anchor

The CLI accepts the transcript path followed by zero or more anchor paths.
Every anchor is parsed and self-hash-checked independently.

- no separate anchor: `UNANCHORED`;
- exact anchor at sequence `k <= record_count`: confirm only that prefix;
- sequence beyond the transcript: `ANCHOR_AHEAD_OF_TRANSCRIPT`;
- different valid anchor value at an existing sequence:
  `ANCHOR_TRANSCRIPT_MISMATCH`;
- malformed or noncanonical anchor: `ANCHOR_INVALID`.

At most 257 separate anchors are admitted, and each sequence may appear only
once. These codes classify inconsistency between unauthenticated caller input
and the transcript. They do not prove that a real rollback, fork, or tampering
event occurred.

A common-prefix anchor may confirm two divergent later suffixes.  It does not
select a fork.  An older internally valid transcript must pass as `UNANCHORED`
without a separate newer anchor.  These are required honest limitations.

## Canonical verifier report

On success stdout is exactly one canonical JSON object plus a newline:

```text
schema = nexus.r015-cold-verifier-report/v0
status = PASS
transcript_id
record_count
genesis_id
initial_state_root
final_state_root
receipt_head
record_head
total_supply
record_hashes
receipt_hashes
prefix_anchor_ids
embedded_anchor_check = ALL_PREFIXES_MATCH
rollback_check = UNANCHORED | ANCHORED_PREFIX_CONFIRMED
confirmed_external_anchor_ids
anchor_provenance = UNAUTHENTICATED_CALLER_SUPPLIED_INTEGRITY_OBSERVATION
matched_external_anchors = [{anchor_id, sequence}, ...]
highest_confirmed_sequence = "" | 0..record_count
terminal_anchor_confirmed = TRUE | FALSE
unconfirmed_suffix_count = record_count - highest_confirmed_sequence
status_authority = NONE
claims
non_claims
```

`matched_external_anchors` is sorted by numeric sequence and then anchor ID.
With no separate anchor the highest sequence is the empty string and the whole
transcript is an unconfirmed suffix. These fields report integrity observations
from caller-supplied bytes; they do not authenticate provenance, prove external
retention, establish freshness, or choose between forks after a shared prefix.

Any disagreement writes no report to stdout and exits nonzero with one stable
error code on stderr.

## Fail-closed campaign

Hostile tests must reseal the outer transcript ID after inner mutations so
the intended inner check is exercised.  Reject malformed/noncanonical input,
domain or authority change, count/gap/reorder/duplicate, raw-byte hash change,
invalid signature or transfer, exact-replay row, receipt-byte divergence,
hybrid roots, record-hash divergence, missing/extra/altered embedded anchor,
terminal mismatch, malformed/future/forked separate anchor, and oversized
input.  A failing verification must not mutate any input.
