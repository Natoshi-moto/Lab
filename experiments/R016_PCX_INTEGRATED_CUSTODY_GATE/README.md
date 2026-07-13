# R016 integrated synthetic custody gate

This experiment introduces a new synthetic controller-owned transfer profile.
It deliberately does not modify or alias R013 outputs. Key lifecycle state and
UTXOs share one state root and one local durable order, so rotation, recovery,
revocation, and spends cannot bypass each other inside one accepted history.

The fixture seeds are publicly derivable test data, not secrets. No operational
private key, wallet, fund, network, consensus, or value claim belongs here.

Run the exact evidence gate:

```bash
python3 experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/verify_evidence.py
```
