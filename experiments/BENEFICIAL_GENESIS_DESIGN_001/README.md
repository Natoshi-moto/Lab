# BENEFICIAL_GENESIS_DESIGN_001

Bitcoin-only **Beneficial Genesis** protocol design and deterministic synthetic evidence pack for GitHub issue [#26](https://github.com/Natoshi-moto/Lab/issues/26).

**Authority:** propose / design only. Does not alter canonical status. Not an R-round.

All fixtures are **SYNTHETIC**. No live keys, charity addresses, credentials, donor data, or broadcast transactions.

## What this demonstrates

A single synthetic Bitcoin-like transaction can bind three facts used by a claim verifier:

1. source-chain cryptographic control (synthetic auth);
2. payment to exact genesis-committed charity script bytes;
3. commitment to a post-quantum destination on a new ledger (synthetic PQ stand-in).

After epoch close, a fixed genesis pool is distributed with integer-only proportional allocation; remainder is unissued so total issuance cannot exceed the pool.

## What this does not demonstrate

See `THREAT_MODEL_AND_NONCLAIMS.md`. In particular: no backing, legal ownership, quantum safety, network consensus, live funds, or regulatory compliance.

## Layout

| Path | Role |
|------|------|
| `TECHNICAL_DESIGN.md` | Normative design |
| `THREAT_MODEL_AND_NONCLAIMS.md` | Attacks, residuals, non-claims |
| `protocol/` | Reference verifier (stdlib Python) |
| `schemas/` | Machine-readable object + rejection codes |
| `fixtures/` | Valid/invalid deterministic vectors |
| `generate_fixtures.py` | Regenerates fixtures |
| `verify_evidence.py` | Fail-closed evidence gate |
| `tests/` | unittest suite |

## Exact reproduction commands

From the repository root:

```bash
# Regenerate fixtures (optional; committed fixtures should already match)
python3 experiments/BENEFICIAL_GENESIS_DESIGN_001/generate_fixtures.py

# Unit tests
python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_DESIGN_001/tests -v

# Evidence gate
python3 experiments/BENEFICIAL_GENESIS_DESIGN_001/verify_evidence.py
```

## Cryptography labels

- PQ signatures: `SYNTHETIC_HMAC_SHA256_PQ_STANDIN_v1` (not real PQ).
- Source auth: `SYNTHETIC_SOURCE_HMAC_v1` (not Bitcoin script/ECDSA).
- Fixture seeds under `protocol/crypto_synth.PUBLIC_TEST_SEEDS` are public test data.

## Allocation rule (summary)

```text
allocation_i = floor(pool * eligible_sats_i / total_eligible_sats)
remainder_unissued = pool - sum(allocation_i)   # never issued
```

## Related receipt

`operations/receipts/BENEFICIAL_GENESIS_DESIGN_001/RECEIPT.json`
