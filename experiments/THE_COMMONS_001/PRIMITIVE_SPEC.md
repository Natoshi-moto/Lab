# The Commons — authorship primitive (spec)

**status_authority:** `NONE`. Reference implementation: `commons/authorship.py`.
Vocabulary governed by `PRINCIPLES.md`.

## Two records, both signed, neither transferable

### 1. Authorship — "a steward made this"

```json
{
  "kind": "authorship",
  "title": "A Work",
  "work_hash": "<sha256 of the work's bytes>",   // provenance anchor
  "author": "<ed25519 public key hex>",          // the steward; identity, never an owner slot
  "lineage": ["<parent work_hash>", "..."],       // provenance / descent
  "terms": "made freely; attribution kept",       // a note in native words, NOT a legal license
  "made_at": "2026-07-23T00:00:00Z",
  "signature": "<ed25519 over the canonical record, minus this field>"
}
```

`verify_authorship(record, content=?)` → true iff the signature matches the
stated author key over the exact record, and (if the content is supplied) the
content still hashes to `work_hash`.

### 2. Recognition — "another steward attests to this work"

```json
{
  "kind": "recognition",
  "recognizes": "<digest of the authorship record>",
  "by": "<recognizer public key hex>",
  "note": "reproduced | verified | admired",
  "at": "2026-07-23T00:00:00Z",
  "signature": "<ed25519 over the canonical attestation, minus this field>"
}
```

`verify_recognition(recognition, authorship_record)` → true iff validly signed
by its stated steward AND it actually points at that authorship record.

## Invariants (why STRICT NO SALE is structural, not promised)

- There is **no** `owner`, `amount`, `price`, `to`, `transfer`, or `balance` field
  anywhere. Authorship cannot be reassigned; recognition cannot be spent. There is
  nothing to sell because the surface to sell it does not exist.
- Canonical serialization is deterministic (`json.dumps(sort_keys, compact)`), so a
  signature binds exact bytes; any edit invalidates it.
- No chain, no gas, no token. Ed25519 signatures over content hashes. Records are
  portable JSON a steward can keep, export, and publish anywhere (e.g. over Nostr).

## What this does NOT claim

Evidence of authorship, not a court order. Non-contamination and Sybil-resistance
of the *recognition graph* are future work with their own falsifiers — see
`PRINCIPLES.md` → "Proof without power".
