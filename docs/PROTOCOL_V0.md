# OPEN-GATE Protocol v0

**This is the public bet.**

| Field | Value |
|---|---|
| **Name** | OPEN-GATE |
| **Version** | v0 |
| **Full title** | Open Post-Quantum Admitted Conserved Transitions |
| **Home** | [Natoshi-moto/Lab](https://github.com/Natoshi-moto/Lab) |
| **License intent** | Open source — Apache-2.0 for code and fixtures; CC-BY-4.0 for this specification text (repository-root `LICENSE` files to be added when promoted) |
| **Status authority** | `NONE` until a user-authorized promotion records otherwise in `STATUS.json` |
| **Maturity** | Research demonstration. Not production. Not money. |

---

## One-sentence claim

**OPEN-GATE v0 is an open protocol for conserved state transitions that Bitcoin cannot express in-protocol: dual independent verification, fail-closed versioned admission policy, and a fixed post-quantum hybrid precheck in front of an unchanged custody transition gate.**

It does **not** claim to be better money than Bitcoin. It claims to be **strictly better at properties Bitcoin refuses or cannot adopt without breaking its own social contract.**

---

## What is better than Bitcoin (narrow, falsifiable)

| Property | Bitcoin (today) | OPEN-GATE v0 target |
|---|---|---|
| **In-protocol post-quantum controller authorization** | No native PQ signature path; any change is consensus politics | Fixed `ML-DSA-65` hybrid precheck; missing or unknown policy **rejects** |
| **Dual independent verification of the same transition** | One network, one script interpreter class; social/economic trust elsewhere | Two cold implementations must converge on frozen fixtures or the gate fails |
| **Fail-closed, content-addressed policy ID** | Soft forks, miner/user politics, implicit defaults | Exact policy hash; `fallback: NONE`; unknown policy → `REJECT` |
| **Conserved synthetic supply with signed controller lifecycle** | UTXO conservation yes; rotation/recovery/revoke as first-class shared root with transfers is application-layer | R016: transfer, rotate, recover, revoke share one combined root and local order |
| **Public attack fixtures + independent verifier hashes** | BIPs and test vectors; limited dual-runtime research culture | Lab evidence gates pin generator, verifier, and expected reports |

If a property cannot be demonstrated by an independent party from public artifacts alone, it is **not** part of the v0 claim.

---

## Explicit non-claims (controlling)

OPEN-GATE v0 and this Lab **do not claim**:

- that this is money, currency, a Bitcoin replacement, or a better store of value;
- global consensus, fork choice, network finality, availability, or Byzantine fault tolerance;
- global double-spend prevention across cloned histories or competing writers;
- economic security, market demand, stable purchasing power, or live-fund safety;
- that ML-DSA (or any algorithm) is “quantum-proof” — only that the **policy requires** a standardized PQ algorithm under a security assumption;
- wallet/HSM safety, secure entropy, key enrollment UX, recovery against real adversaries, or production custody;
- that a green CI check, Git commit, or model agreement proves truth;
- deployment readiness, regulatory approval, or authorization to hold real value.

**A caller can still invoke legacy non-PQ paths where implemented.** The PQ profile is an admission policy, not a magic network mandate, until a future version proves otherwise under a **new** policy ID.

Changing v0 policy is **detectable** (new policy ID), not impossible. Detectability is the guarantee; immutability-of-the-universe is not.

---

## Normative composition (what v0 is made of)

OPEN-GATE v0 is a **composition of Lab research objects**, not a new cryptocurrency.

| Layer | Lab artifact | Role in OPEN-GATE v0 |
|---|---|---|
| Conservation kernel | `experiments/R013_PCX_CONSERVED_CLAIM/` | Fixed-supply synthetic UTXO; dual Ed25519 verifiers; conservation + local double-spend rejection |
| Independent durability | `experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/` | Closed transcripts, crash lifecycle bounds, external-style verification |
| Custody transition gate | `experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/` | Controller-owned outputs; transfer/rotate/recover/revoke; combined state root; dual verifiers |
| R016 protocol prose | `operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/PROTOCOL.md` | Normative custody event and authorization rules for the promoted gate |
| R016 claim matrix | `operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/CLAIM_MATRIX.md` | Disposition of every statement (demonstrate vs non-claim) |
| Schemas | `constitution/schemas/pcx-*.schema.json` | Machine-checkable envelopes (genesis, transfer, custody, durable transcripts, receipts) |
| Operator honesty | `PURPOSE_AND_NONCLAIMS.md`, `STATUS.json` | Lab-wide nonclaims and accepted working state |
| PQ hybrid admission (draft) | PR [#23](https://github.com/Natoshi-moto/Lab/pull/23) `R018_PQ_HYBRID_ADMISSION` | Target profile: `ALL_OF_R016_AND_ML_DSA_65`; emits `PQ_PRECHECK_PASS_R016_STILL_REQUIRED` only |

### Promotion map (do not blur)

| Piece | Lab status (as of this document) | OPEN-GATE v0 stance |
|---|---|---|
| R016 custody gate | **User-authorized promotion merged** on `main` | **Baseline gate** |
| R018 PQ hybrid precheck | **Draft proposal** (CI-green research PR) | **Target admission profile** — not canonical until promoted under Lab process |
| R017 replication / fork evidence | Proposal / design track | **Out of v0 core** (future multi-host layer) |

v0 is honest only if readers can see **what is promoted** vs **what is proposed**.

---

## Locked policy sketch (R018 target profile)

When the PQ profile is active, a positive admission requires **all** of:

1. Node-native `ML-DSA-65` verification passes;
2. Cold independent Noble JS `ML-DSA-65` verification passes;
3. Unchanged R016 transition gate passes.

Locked parameters (from R018 proposal; re-check exact head before citing as frozen):

| Parameter | Value |
|---|---|
| Decision | `ALL_OF_R016_AND_ML_DSA_65` |
| Fallback | `NONE` |
| Missing authorization | `REJECT` |
| Unknown policy | `REJECT` |
| Algorithm | exactly `ML-DSA-65` |
| Policy ID | `a17b46de0a98dd4462997350c7730006ba4eeb2024130de5cb6d0c0b76a4aa55` |
| Public fixture key ID | `e81fced8ea5b13397b50344ecc9ff0519edee40033c99616f10ec68c17c8fa02` |
| Precheck success code | `PQ_PRECHECK_PASS_R016_STILL_REQUIRED` (precheck never alone accepts a transition) |

The precheck **never** accepts a state transition by itself. R016 remains required.

---

## How to verify (public, no trust required)

From a clean clone of this repository:

```bash
./nexus doctor
python3 -m unittest discover -s tests -v

# R013 conservation convergence (when deps installed)
# npm ci --ignore-scripts
# ./nexus pcx-convergence-check experiments/R013_PCX_CONSERVED_CLAIM/fixtures/SUITE.json

# R016 custody evidence
python3 experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/verify_evidence.py
```

Hosted check: GitHub Actions workflow **Nexus Audit** (`.github/workflows/nexus-audit.yml`).

A green check demonstrates only that **the declared gates passed on the declared head**. It does not demonstrate money, safety, or production readiness.

---

## Artifact checklist (what must stay public)

For OPEN-GATE v0 to remain a fair open protocol:

1. Spec text (this file) and linked claim matrices  
2. Frozen fixtures and expected reports under `experiments/R013_*` and `R016_*`  
3. Independent verifier sources with pinned hashes in evidence gates  
4. Attack / fail-closed tests (missing auth, tamper, signature flip, policy weaken)  
5. Explicit nonclaims in the same tree as the code  
6. No operational private keys, live seeds, or fund-bearing material in Git  

`LOCAL_ONLY` payloads stay out of Git. Public repo material must remain suitable for unrestricted disclosure.

---

## How value is captured without selling the protocol

The protocol and reference artifacts are **open**. Fair commercial surfaces (optional, non-exclusive):

| Surface | What buyers pay for |
|---|---|
| Independent verification / certification | “This external implementation matches v0 fixtures and policy ID” |
| Private Nexus operator deployments | Audit-grade multi-AI research control plane around the open gate |
| Security design review | Threat models and gate reviews for integrators |
| Hosted dual-verifier (non-custodial) | Convenience, not secrets |

**A token is not required for v0 and is not part of this claim.** Any future economic layer needs a **new** named version, new nonclaims review, and external implementers first.

---

## Success criteria for v0 (definition of done)

OPEN-GATE v0 is “real” when **all** hold:

1. This document is linked from the repository root README.  
2. R016 baseline evidence gate passes from a clean public clone.  
3. R018 (or successor) PQ profile is either **promoted** under Lab process or clearly labeled **proposed** with exact head.  
4. An external party (not the original author session) can fail the gate by tampering a fixture and pass it on the canonical fixtures.  
5. Nonclaims remain in-tree and are not contradicted by marketing.  
6. Repository license files exist for code and for this specification.

Until item 6, treat license intent as **declared**, not yet filed.

---

## Relation to Nexus Lab

Nexus Lab is the **forge**: multi-model research OS, proposals, audits, status, and human-authorized promotion.

OPEN-GATE is the **extractable protocol**: the conserved-transition + dual-verifier + fail-closed admission bet that can outlive any single chat, agent, or branch.

```text
Nexus Lab (process + corpus + operator shell)
        │
        ▼
OPEN-GATE v0 (public protocol claim)
        │
        ├── R013 conservation semantics
        ├── R016 custody transition gate   ← promoted baseline
        └── R018 PQ hybrid admission       ← target profile (promote separately)
```

---

## Document control

| Field | Value |
|---|---|
| Schema | `nexus.protocol_claim/v0` |
| Authority | Human operator of Natoshi-moto/Lab |
| Effect | **Declarative public bet only** — does not mutate `STATUS.json`, does not promote R018, does not authorize live funds |
| Supersession | A future `PROTOCOL_V1.md` (or renumbered policy ID) must cite this file and state what changed |

If this document and a marketing sentence disagree, **this document wins.**
