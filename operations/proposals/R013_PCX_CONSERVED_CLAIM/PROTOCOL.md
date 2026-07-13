# R013 PCX conserved-claim protocol V0

## Purpose

R013 is the smallest conserved synthetic-quantity state machine that can be
tested without creating live value. It freezes one synthetic genesis of `1000`
`R013-SYNTHETIC-CLAIM` units, permits `TRANSFER` only, and requires two
separately implemented verifiers to reach byte-identical decisions and candidate
roots.

The unit has no financial, legal, redemption, governance, identity or market
semantics. It is a laboratory quantity used to falsify inflation, forged
ancestry, double-spend and implementation-divergence paths before any economic
design is allowed.

## Relationship to proof-carrying exchange

The R013 conservation profile realizes the four PCX roles as follows:

| PCX role | R013 object |
|---|---|
| OFFER | complete unsigned `nexus.pcx-transfer/v0` fields |
| RETURN | the transfer plus one Ed25519 witness per input |
| DECISION | deterministic candidate acceptance or rejection code |
| CHECKPOINT | recomputed UTXO root, receipt head and fixed supply |

These roles do not define general PCX. R013 exercises one closed transition
class only. BWX work receipts may be evidence references in a later protocol;
they cannot issue, transfer, destroy or finalize R013 quantity.

## Frozen policy

- network: `NEXUS-R013-SYNTHETIC`
- genesis ID: `974cd4da89feb9f7ae8e14d7b4359f4b76d8697f55e5793219c52e38b627b7de`
- unit label: `R013-SYNTHETIC-CLAIM`
- supply: exactly `1000`
- decimals: `0`
- amount representation: canonical unsigned decimal strings in `1..1000`
- maximum inputs: `8`
- maximum outputs: `8`
- maximum live outputs in a candidate state: `64`
- owners: four frozen, conspicuously synthetic Ed25519 fixture keys
- transition kind: transfer only
- status authority: `NONE`

There is no runtime genesis builder, mint, fee, burn, reward, slashing,
redemption, bridge, script, wallet, recovery, network or promotion command.

## Canonical bytes

R013 uses a deliberately closed profile of RFC 8785 JSON canonicalization:

- UTF-8 bytes with no BOM;
- at most `65536` raw bytes and `32` levels of JSON nesting;
- exact, closed ASCII property names;
- exact schema keys; unknown keys fail;
- all admitted scalars are printable ASCII strings;
- compact separators and recursively sorted object names;
- no numeric JSON tokens, floats, booleans or nulls in admitted objects;
- duplicate keys, every JSON numeric token, and non-finite numeric tokens fail
  during parsing; booleans and null fail profile validation;
- received bytes must equal canonical re-encoding before hashing or signature
  verification.

This is not advertised as a general JCS implementation. Restricting the
language removes Python/ECMAScript numeric serialization and Unicode key-order
ambiguities. Fixture transport uses canonical base64 around the exact bytes.

RFC 8785 is the external encoding reference:
<https://www.rfc-editor.org/info/rfc8785/>.

## Domain-separated hashes

R013 uses the BIP 340 tagged-hash construction:

```text
tagged_hash(tag, message) =
  SHA256(SHA256(UTF8(tag)) || SHA256(UTF8(tag)) || message)
```

Tags are fixed per object kind:

```text
NEXUS/PCX/GENESIS/V0
NEXUS/PCX/TRANSACTION/V0
NEXUS/PCX/RETURN/V0
NEXUS/PCX/OUTPOINT/V0
NEXUS/PCX/AUTHORIZATION/V0
NEXUS/PCX/STATE/V0
NEXUS/PCX/DECISION/V0
NEXUS/PCX/CHECKPOINT/V0
```

## Creating-transaction ancestry

An input names exactly:

```json
{
  "creating_tx_id": "<64hex>",
  "output_index": "<canonical decimal string>",
  "output_id": "<64hex>"
}
```

`output_id` is recomputed from the creating transaction ID and four-byte
big-endian output index. The kernel then resolves the actual record from its
replayed UTXO state and requires its creating ID and index to match. A supplied
output shape is never trusted. Outputs surviving a checkpoint within one
continuous replay retain the transaction that created them; a checkpoint never
becomes their creator. Checkpoint import or restart is not implemented in V0.

This follows the UTXO principle that an input spends a specific previous
output: <https://developer.bitcoin.org/devguide/transactions.html>.

## Transaction identity and authorization

The transaction ID commits to schema, network, exact genesis, anchor state
root, nonce, ordered inputs, ordered outputs and `status_authority`. Witnesses
are excluded from the transaction ID and included in the return hash.

Each input has one witness. The Ed25519 message is a tagged hash binding:

- exact genesis ID;
- complete transaction ID;
- input index;
- exact output ID.

Because the transaction ID commits to every input and output, this is an
all-fields authorization mode. There is no signature flag or algorithm
negotiation. Raw keys and signatures follow RFC 8032:
<https://www.rfc-editor.org/info/rfc8032/>.

Fixture signatures are created by Node's native Ed25519 implementation.
Verifier A uses OpenSSL Ed25519 through a Python orchestration/state machine.
Verifier B separately implements parsing/state transitions in JavaScript and
uses pinned `@noble/ed25519` with strict RFC 8032 verification. No private key
enters either verifier or any operator command. The generator contains only
publicly disclosed synthetic test seeds; no production or undisclosed key is
admitted.

## Deterministic transition

Validation order is stable:

1. bounded base64 and UTF-8 decoding;
2. strict JSON, duplicate-key, numeric-token, nesting and printable-ASCII
   profile rejection;
3. canonical byte equality;
4. exact top-level schema and network/genesis/authority binding;
5. hash formats and input/output/witness collection bounds;
6. input shape, canonical order and uniqueness;
7. output owner/amount shape and witness completeness/order/signature shape;
8. transaction-ID recomputation;
9. exact replay or transaction-ID collision handling;
10. predecessor state-root binding;
11. UTXO presence and creating-transaction binding;
12. exact input/output conservation;
13. owner-key equality and Ed25519 verification;
14. remove inputs, create deterministic outputs, enforce the `64`-UTXO cap,
    recompute supply and state root;
15. emit a candidate receipt and checkpoint.

An exact replay returns the existing receipt and mutates nothing. A different
envelope under an accepted transaction ID is rejected. Every rejection leaves
the UTXO state and receipt chain unchanged.

No system time, timezone, wall clock, model output, confidence score or host
ordering heuristic participates in validity.

## Conservation invariant

After genesis and every accepted prefix:

```text
sum(all unspent output amounts) == 1000
```

Every accepted input is present once and removed once. Every new output derives
only from a valid accepted transfer. There is no path for OFFER, RETURN,
DECISION, receipt, checkpoint, BWX work or AI output to change supply.

## Checkpoint authority

A checkpoint is a recomputed candidate containing the state root, receipt
head, accepted transaction IDs, UTXO count and total supply. Its only admitted
status is `CANDIDATE`; `status_authority` is always `NONE`.

User approval is necessary for repository promotion but cannot make an invalid
transition valid. R013 contains no canonicalization, promotion, consensus,
fork-choice or automatic reorganization rule.

Checkpoints are recomputed summaries at the end of a complete in-memory replay.
V0 does not implement checkpoint import, durable state persistence, crash
recovery, atomic external settlement or concurrent writers.
