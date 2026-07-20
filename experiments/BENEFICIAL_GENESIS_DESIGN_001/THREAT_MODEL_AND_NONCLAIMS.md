# Threat model and non-claims — Beneficial Genesis design pack

**Task:** `TSK-BENEFICIAL-GENESIS-DESIGN-001`  
**Evidence class:** synthetic design / adversarial fixture coverage  
**Authority:** none over canonical lab status  

---

## 1. Assets under consideration (synthetic)

| Asset | Notes |
|-------|--------|
| Fixed genesis allocation pool | Abstract integer units; not money |
| Donation nullifier uniqueness | Prevents double-claim of one output |
| Charity script binding | Exact bytes at genesis |
| PQ destination binding | Who receives the *allocation claim right* |
| Source inclusion under tip model | Bounded reorg/confirmation policy |

Not modelled as protected assets: real BTC, legal title, tax status, charity honesty, market price.

---

## 2. Adversaries

1. **Front-runner** who sees a donation tx and tries to claim to their own PQ key.
2. **Double-claimer** who reuses the same `(txid, vout)`.
3. **Script/address confuser** who relies on address-string normalization.
4. **Checkpoint liar** who presents stale or conflicting source tips.
5. **Merkle forger** who mutates inclusion branches.
6. **Malleation adversary** who re-encodes the transaction.
7. **Cross-domain replay adversary** (chain id / epoch / nullifier domain).
8. **Arithmetic adversary** (overflow, float, bool, remainder gaming).
9. **Quantum adversary (policy)** who can break classical source auth after a declared cutoff height.
10. **Stolen-key adversary** who controls source keys without legal ownership.
11. **Colluding charity** that rebates donors out-of-protocol.

---

## 3. Mitigations implemented in the synthetic model

| Attack | Mitigation | Fixture / code |
|--------|------------|----------------|
| Front-run different PQ key | Commitment binds PQ pk; OP_RETURN must match | `front_run_*` |
| Double claim | Nullifier set | `double_claim_same_output` |
| Multi-output | Distinct nullifiers per vout | `claim_multi_out*` |
| Wrong output index | Commitment vout + attack/path checks | `wrong_output_index` |
| Amount mismatch | Exact output value check | `amount_mismatch` |
| Wrong charity id | id + exact script | `wrong_charity_id_*` |
| Address-string ambiguity | Forbidden comparison path | `address_string_ambiguity` |
| Script substitution | Exact script bytes | `script_substitution*` |
| Malformed/duplicate charities | Set construction rejects | `duplicate_*`, `malformed_*` |
| Insufficient confirmations | tip − height + 1 | `insufficient_confirmations` |
| After cutoff / epoch closed | height and close flags | `claim_after_cutoff`, `inclusion_after_cutoff_*` |
| Boundary inclusion | `height == last_clean` allowed | `claim_at_cutoff_boundary` |
| Stale/conflicting checkpoints | tip ancestry + checkpoint checks | `stale_checkpoint`, `conflicting_checkpoint` |
| Invalid Merkle | recompute root | `invalid_merkle_branch` |
| Tx malleability | recompute txid | `tx_malleability_reencoding` |
| Unsupported forms | fail closed | `unsupported_*` |
| Nullifier domain omission | canonical nullifier only | `nullifier_domain_omission` |
| PQ sig mutation/alg/key/domain | verify fail closed | `pq_*` |
| Cross-chain/epoch | id equality | `cross_*_replay` |
| Arithmetic attacks | int-only + overflow codes | allocation tests + fixtures |
| Quantum cutoff | reject classical auth after height | `quantum_compromise_cutoff` |
| Reorg before/after acceptance | ancestry vs tip | `reorg_*` |

---

## 4. Explicit residual risks and out-of-protocol limitations

These are **not** solved by this design pack and must not be silently omitted:

1. **Charity rebate / collusion** — A charity can return value off-chain to large donors. The protocol sees only script payment. Represented as residual risk; crypto claim may still verify (`claim_charity_rebate_collusion_crypto_ok`).
2. **Stolen source keys** — Cryptographic control ≠ legal ownership. Fixture admits crypto control with an explicit note (`claim_stolen_source_key_crypto_ok`).
3. **Charity operational honesty** — No assurance funds are used beneficially after receipt.
4. **Bitcoin consensus / deep reorgs** — The header model is bounded and synthetic. Real SPV security, eclipse attacks, and miner collusion are out of scope.
5. **Real PQ cryptography** — Stand-in HMAC scheme is deliberately not quantum-safe.
6. **Real Bitcoin script / sighash / SegWit / Taproot** — Not implemented; synthetic identity only.
7. **Sybil / whale concentration** — Proportional-to-donated-sats can concentrate allocation; economics review is a separate seat.
8. **Denial of service** — Flooding claims, large proofs, or epoch griefing not rate-limited here.
9. **Privacy** — Donations and claims are linkable by design in this pack.
10. **Second implementation gap** — Only one reference verifier exists; independent reproduction is required before any promotion claim.
11. **Genesis operator honesty** — Who publishes the genesis charity set and pool is a social/governance problem outside the receipt verifier.
12. **Quantum cutoff governance** — Declaring `quantum_compromise_cutoff_height` is a policy input; the model only enforces it once set.

---

## 5. Non-claims (mandatory)

Beneficial Genesis (this design and any artifacts in this directory) does **not** establish:

- backing, collateral, redemption, guaranteed value, purchasing power, liquidity, or stable value;
- legal ownership of donated assets rather than cryptographic control;
- charitable tax treatment;
- legal or regulatory compliance;
- honest charity operation, absence of rebates, or beneficial use after receipt;
- quantum safety of Bitcoin or of the whole new ledger;
- network consensus, fork choice, global finality, Sybil resistance, or economic security;
- secure operational keys, wallets, hardware, entropy, recovery, or deployment;
- authorization for live funds, public solicitation, token issuance, or a mainnet launch;
- independence of review merely because multiple same-provider accounts inspected the work;
- promotion of R017/R018 or any change to lab `STATUS.json`.

---

## 6. Known attack surface still open for Breaker seat

Recommended focus for an independent Breaker task:

1. Craft a claim that passes the reference verifier while binding a PQ key that did not appear in the true donation commitment bytes (encoding tricks, Unicode, hex case, duplicate JSON keys if a non-canonical parser is introduced).
2. Find a multi-claim allocation remainder strategy that issues more than the pool under a buggy reimplementation.
3. Construct two different source_chain labels that collapse under a careless nullifier domain mix-up in a second implementation.
4. Abuse cutoff boundary off-by-one (`height == last_clean + 1` admitted).
5. Reorg races: provisional admit then tip switch that still leaves a stale nullifier consumed.

---

## 7. Interpretation of fixture outcomes

- `ok: true` means: admitted under the **synthetic** validation predicate.
- It does not mean: economically fair, legally clean, quantum-safe, or mainnet-ready.
- Invalid fixtures must fail with the **catalogued** rejection code in `fixtures/EXPECTED.json`.

The repaired evidence catalog distinguishes executable invalid vectors from
documentary scenarios. Documentary cases do not count as verifier passes.
Residual risks are independently enumerated in `EXPECTED.json`; they remain
limitations even when all executable vectors pass.
