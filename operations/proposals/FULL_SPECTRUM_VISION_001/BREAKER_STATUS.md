# Breaker status and bounty loop

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE`  
**Cites:** CLAIM-NEX-003, CLAIM-NEX-004, OP-13  
**Genesis:** `baseline-001`

---

## Loop

```text
Play epoch-0
    → someone PROVABLY wrecks the system
    → HARD NEX reset for all balances
    → breaker keeps SMALL NEX award (still wiped at REAL launch)
    → breaker accrues STATUS: helped break (make) the system
    → STATUS lives on GitHub/LOOM forever as reputation, not money
```

**OP-13** is the source text.

---

## Proof standard

| Required | Rejected |
|----------|----------|
| Reproducible proof | Vibes, private DM flex |
| Public artifact on GitHub | “Trust me I broke it” |
| Bound to sim/host version hashes | Unversioned anecdote |

Self-attack and external bounty use the **same** gates.

---

## Status ≠ money

| Status | Epoch-0 NEX dust |
|--------|------------------|
| Survives REAL launch as honor record | Dies at REAL launch |
| May die/rebased on hard resets only if constitution says so for balances — **status rows remain** | Subject to hard reset rules for amounts |

Do not implement status as a shadow coin that cash-converts after wipe.

---

## Design intent

The economy **wants** public wreckage and rebuild. That is Full Spectrum anti-cosplay: green lies die when breakers are paid in **honor + temporary dust**, not when bugs are hidden.
