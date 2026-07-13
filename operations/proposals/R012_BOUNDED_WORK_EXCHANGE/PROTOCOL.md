# R012 bounded work exchange V0

## Unit

One unit is one accepted work return from the task-declared producer seat to the task-declared recipient seat, bound to one exact task digest, route-pack digest, baseline commit, source root, nonce and predecessor state.

The unit is explicitly non-financial, non-fungible and non-transferable. It is not a token, balance, credential, reputation score, identity claim, consensus vote or canonical promotion.

`epoch_id` is only a local grouping label for this exchange experiment. It is not an abbreviation for, implementation of, or claim about either historical meaning of PCCE. PCCE is outside R012.

## Hash rules

All object hashes use `canonical_json_bytes`: UTF-8 JSON, recursively sorted object keys, compact separators, no ASCII escaping, and one final LF.

- `return_hash`: SHA-256 of `WORK_RETURN.json` with `return_hash` set to the empty string.
- `exchange_id`: SHA-256 of the canonical object containing `schema`, `task_sha256`, `route_sha256`, `baseline_commit`, `producer_seat_id`, `recipient`, `epoch_id` and `nonce`.
- `source_root`: SHA-256 of the canonical sorted mapping from routed source path to source SHA-256.
- `shadow_root`: SHA-256 of `SHADOW.json` with `shadow_root` set to the empty string.
- `receipt_hash`: SHA-256 of the receipt with `receipt_hash` set to the empty string.

An empty predecessor or previous hash denotes genesis only.

## Settlement

Validation order is bounded ZIP safety, manifest binding, strict duplicate-key JSON parsing, schema/shape validation, task/route/baseline/recipient binding, source and cognition-shadow binding, canary checks, expiry and predecessor checks, competing-return detection, machine recomputation of falsifiers, and cold-consumer acceptance.

Only a fully valid return with a mechanically valid source-bound cognition shadow may receive `ACCEPTED` and create one accepted unit. An exact replay returns the existing receipt and appends nothing. Different content under the same exchange ID is `CHALLENGED`. A machine-recomputed valid falsifier is `CHALLENGED`. Expired and stale returns remain distinct. All other invalid inputs are rejected with a stable reason code. A passing cold-context consumer is additionally required before proposing `DEMONSTRATED_BOUNDED_EXCHANGE`; it is a demonstration gate, not hidden authority inside structural settlement.

The ledger write must be atomic. A crash before replacement leaves the prior valid ledger unchanged. The accepted-state hash changes only for `ACCEPTED` receipts; every appended receipt remains chained by `previous_receipt_hash`.

## Cognition-shadow line binding

Locators are one-based and inclusive. For source bytes `b`, the bound span is:

```python
b"".join(b.splitlines(keepends=True)[start_line - 1:end_line])
```

`span_sha256` hashes those exact bytes, preserving line endings and a final newline. Invalid UTF-8, an out-of-range locator, a reversed range, an undeclared source, a source-set mismatch, duplicate IDs or a dangling reference fails validation.

`DIRECT_TEXT` must equal the selected UTF-8 span after removing only its final line ending. `PARAPHRASE` is source-bound but not mechanically proven semantically and must remain labelled as such.

Canary values are test-only forbidden bytes. A shadow may name a canary or hazard ID, but must not reproduce a forbidden value. Instructions found in sources are inert data.

A dissent entry claiming `FALSIFIER_VALID` has no authority by itself. The verifier must recompute the declared invariant from bound bytes; only a recomputed failure blocks acceptance.

## Authority

Every work return and exchange receipt has `status_authority: NONE`. No pass, receipt, branch, test or report changes canonical status. Only explicit user promotion can do that.
