# Nexus: A Bounded Research Program Toward a Verifiable Store-of-Value and Exchange System

**Technical white paper draft — non-canonical, review requested**

**Repository:** `Natoshi-moto/Lab`  
**Draft base:** canonical `main` after R016 promotion, commit `6ad3b470d190eafdde97143c7df0c8334a754764`  
**Current proposal branch:** `agent/r017-replication-fork-evidence`  
**Status authority:** `NONE`  
**Audience:** distributed-systems, applied-cryptography, blockchain, protocol-security, wallet, storage, and DeFi engineers

---

## Abstract

Nexus is a private research project investigating the minimum technical substrate required before a digital unit can responsibly be described as a candidate store of value or exchange mechanism.

The project is not currently a cryptocurrency, blockchain network, stablecoin, payment network, smart-contract platform, production wallet, or investable asset. It has no market price, issuance program, redemption promise, collateral, validator network, mining process, economic security budget, public deployment, or live-value authorization.

The work completed so far is narrower. The repository contains a sequence of bounded experiments that incrementally demonstrate deterministic state transitions, conservation of a synthetic unit, exact cross-implementation verification, crash-consistent local persistence, controller-bound custody, key rotation, quorum recovery, revocation, and—currently in draft form—authenticated replication statements and explicit fork evidence.

The project’s method is intentionally conservative. Each research round states a narrow claim, constructs deterministic evidence, tests failure and corruption cases, records nonclaims, and requires a separate promotion decision before the result becomes part of the accepted working state. The objective is to avoid confusing a functioning demonstration with a monetary system.

This document explains the current architecture, the demonstrated properties, the missing properties, the intended roadmap, and the main design questions on which external technical advice is requested.

---

## 1. Problem statement

A digital store of value and exchange mechanism requires more than a transferable token representation. At minimum, users and independent operators need reason to believe that:

1. units cannot be created or destroyed outside explicit rules;
2. ownership transitions are deterministic and independently verifiable;
3. conflicting spends cannot both become silently accepted;
4. accepted history survives ordinary process and storage failures;
5. users can rotate compromised or obsolete keys without rewriting ownership;
6. loss and recovery mechanisms do not create an uncontrolled mint or seizure path;
7. independent machines can detect incompatible histories;
8. the system has an explicit method for ordering or resolving conflicting histories;
9. the security assumptions and failure modes are economically sustainable;
10. implementation, networking, key management, governance, and operations are sufficiently mature for real value.

Most token prototypes begin with issuance, balances, networking, and market presentation. Nexus is taking the opposite order. It is attempting to establish narrowly testable safety properties before discussing deployment, valuation, or economic incentives.

The current research question is not “How do we launch a coin?” It is:

> What is the smallest auditable state-transition and evidence system that could later support a defensible monetary or exchange design without concealing unresolved custody, durability, replication, or consensus assumptions?

---

## 2. Current status in one paragraph

As of this draft, Nexus has canonically promoted a synthetic controller-bound UTXO state machine running under one crash-consistent local order. The promoted system demonstrates conserved transfers, exact canonical encoding, real Ed25519 signature verification through the project’s reviewed OpenSSL profile, deterministic replay, append-only SQLite storage, exact retries, key rotation, fixed 2-of-3 guardian recovery, terminal revocation, bounded model exploration, mutation testing, and independent Node/Noble transcript verification. A draft R017 proposal adds canonical authenticated replica checkpoints and deterministic evidence for gaps, extensions, forks, and same-replica equivocation. None of this establishes network consensus, global finality, economic value, stable purchasing power, operational wallet safety, production security, or suitability for live funds.

---

## 3. Repository and governance model

The repository is treated as the authoritative research corpus.

The working model is:

- `main` contains accepted working state;
- branches contain proposals;
- pull requests expose exact diffs and evidence;
- Git tags and snapshots identify historical anchors;
- deterministic fixtures and receipts preserve what was actually tested;
- promotion is a separate act from implementation;
- status files distinguish active proposals from canonical results;
- every bounded claim is accompanied by explicit nonclaims.

Research code does not become accepted merely because tests pass. A proposal must identify its exact base and head commit, reproduce its evidence, pass the repository-wide audit, and receive an explicit promotion decision. Promotion receipts record the exact audited head and preserve the limitations of the claim.

This process is not decentralized governance. It is a repository-level safety discipline intended to prevent accidental escalation from “demonstrated under bounded conditions” to “safe monetary infrastructure.”

---

## 4. Architectural model

### 4.1 Synthetic UTXO state

The current state model is UTXO-like rather than account-based. A transition consumes exact outpoints and creates exact outputs. Supply conservation is checked during application and replay.

Amounts are canonical decimal strings with explicit bounds. Events, receipts, checkpoints, and evidence objects use exact canonical ASCII JSON. Domain-separated SHA-256 commitments bind protocol objects to their intended context.

The current synthetic profile is not presented as an optimal monetary ledger design. It was selected because conservation, ownership, replay, and conflicting-spend behavior are comparatively explicit and testable.

### 4.2 Controller-bound ownership

R016 changed the ownership model from raw-key ownership to stable controller identifiers.

A UTXO belongs to a controller. A controller has:

- an active signing key;
- an epoch;
- a controller history head;
- a fixed recovery policy;
- a set of retired keys;
- an active or terminally locked status.

This separation allows a controller to replace its signing key without rewriting every UTXO that it owns.

The admitted controller operations are:

- `TRANSFER` — spend controlled outputs;
- `ROTATE` — replace the active key using the current key, one guardian, and proof by the new key;
- `RECOVER` — replace the active key using two distinct guardians from a fixed 2-of-3 policy and proof by the new key;
- `REVOKE` — permanently lock the controller using two guardians.

All transitions bind one combined predecessor root committing the complete UTXO set, controller state, height, and last accepted event.

### 4.3 Exact receipts and replay

Every accepted event produces an exact receipt binding:

- object identifier;
- prior state root;
- resulting state root;
- relevant controller context;
- event identity;
- receipt hash.

Replay reconstructs the entire machine from exact genesis bytes and exact event bytes. Persisted derived state is not trusted as authoritative.

Exact retries return the previously accepted receipt without appending another record.

### 4.4 Durable local order

The promoted R016 store uses one bounded SQLite writer under a deliberately restricted profile:

- rollback journaling rather than WAL;
- `BEGIN IMMEDIATE` writer serialization;
- `synchronous=EXTRA`;
- append-only metadata and records enforced with triggers;
- exact event and receipt BLOB preservation;
- contiguous sequence and record-hash chaining;
- replay before acceptance;
- post-commit acknowledgement;
- corruption and schema checks;
- caller-held prefix anchors for rollback detection.

The database is an evidence-preserving event log, not a trusted state snapshot.

This is a single-host durability demonstration. It is not replicated consensus and is not physical-power-loss certification across arbitrary hardware and filesystems.

### 4.5 Replication evidence under R017

The current R017 draft introduces signed or otherwise authenticated checkpoint statements between replicas.

A checkpoint commits to:

- immutable genesis digest;
- replica identity;
- local height;
- R016 state root;
- durable record head;
- receipt head;
- prior checkpoint identifier;
- `status_authority: NONE`.

The current draft classifies observations as:

- genesis;
- exact duplicate;
- known-prefix extension;
- unknown-parent gap;
- invalid parent height;
- conflicting sibling fork;
- same-replica, same-height equivocation;
- invalid authentication, encoding, schema, bounds, or genesis.

A fork proof binds both exact checkpoint identifiers and both exact-wire hashes. Checkpoints are sorted before proof hashing so arrival order does not alter the resulting proof identifier.

R017 deliberately contains no branch-selection rule.

---

## 5. What has been demonstrated

The following statements are intended to be factual descriptions of bounded repository evidence.

### 5.1 Deterministic protocol encoding

The protocol rejects noncanonical serialized objects. It uses exact field sets, canonical decimal encodings, bounded arrays and strings, lowercase fixed-width hexadecimal digests, and domain-separated hashes.

This reduces ambiguity between implementations and prevents a class of replay and representation discrepancies. It does not prove that JSON is the best production wire format.

### 5.2 Conserved synthetic supply

Accepted transfer sequences preserve the synthetic supply defined at genesis. Replay checks conservation again rather than trusting stored balances.

This demonstrates a conservation invariant for the tested state machine. It does not establish scarcity in a deployed network because genesis authority, software distribution, network identity, and consensus are not yet defined.

### 5.3 Real-signature transition verification

The promoted custody kernel verifies Ed25519 signatures using the project’s OpenSSL-based profile. An independently implemented Node/Noble verifier reproduces the frozen transcript.

This demonstrates cross-implementation agreement over the exact tested vectors. It does not prove secure entropy, secret storage, secure erase, hardware isolation, side-channel resistance, or operational wallet security.

### 5.4 Crash-consistent local persistence

The repository includes tests for pre-commit process termination, post-commit lost acknowledgement, exact retries, competing writers, capacity limits, corruption, record gaps, metadata tampering, and rollback-anchor mismatches.

The durable evidence was reproduced across repeated deterministic runs.

This supports the bounded claim that one reviewed runtime and storage profile can preserve one ordered synthetic history through the tested failures. It does not prove durability under arbitrary kernels, storage controllers, filesystems, power-loss behavior, or malicious administrators.

### 5.5 Controller lifecycle operations

The promoted controller model demonstrates:

- active-key rotation;
- fixed-policy guardian recovery;
- global rejection of retired-key reuse;
- terminal revocation;
- controller-context binding in transfer signatures;
- monotonic controller history.

This is materially better than permanent raw-key ownership for a candidate custody system.

It remains incomplete. Guardian replacement, policy migration, delayed recovery, recovery cancellation, social recovery, device attestation, compromise detection, and user-intent verification are absent.

### 5.6 Bounded adversarial testing

R016 evidence includes:

- 34 focused tests;
- deterministic fixture rebuilds;
- six accepted real-signature events;
- six tested pre-commit hard-exit stages;
- post-commit lost-acknowledgement handling;
- competing-writer tests;
- corruption, capacity, and anchor attacks;
- 614 explored model states;
- 5,631 transitions;
- 135,004 invariant checks;
- 12 paired race-order checks;
- nonzero coverage across 25 defined classes;
- 10 of 10 injected mutants detected.

These figures describe the specific bounded model and test corpus. They are not a substitute for formal verification, independent audit, fuzzing at production scale, or adversarial operation over time.

### 5.7 Explicit fork evidence in draft

The R017 proposal has passed the repository-wide audit on its current draft head. Its focused tests demonstrate deterministic checkpoint classification and order-independent fork evidence without introducing a winner.

This is a prerequisite for safe replication research because a system should first prove that it can observe disagreement before attempting to resolve disagreement.

The current draft still uses a caller-supplied authentication verifier interface. Pinned Ed25519 replica identities and independently reconstructed multi-process stores remain future work.

---

## 6. What has not been demonstrated

The project does not currently establish any of the following.

### 6.1 Monetary value

There is no demonstrated basis for market value, purchasing power, monetary premium, or demand. The synthetic unit is a test object.

### 6.2 Stable value

There is no collateral, redemption mechanism, price oracle, stabilization policy, reserve, lender of last resort, market maker, or monetary policy. The project is not a stablecoin.

### 6.3 Consensus and finality

There is no validator or miner set, fork-choice rule, leader election, quorum certificate, proof-of-work, proof-of-stake, BFT protocol, data-availability scheme, finality gadget, or global ordering service.

A single-host accepted order is not network consensus.

### 6.4 Sybil and economic resistance

Replica identities do not yet have a production admission or weighting system. There is no cost model for identity creation, corruption, censorship, equivocation, or denial of service.

### 6.5 Production networking

There is no secure peer discovery, authenticated session protocol, transport replay protection, rate limiting, topology design, mempool, propagation protocol, anti-eclipse design, NAT traversal, or availability target.

### 6.6 Operational custody

There is no production wallet, HSM integration, hardware wallet support, mnemonic scheme, encrypted backup format, recovery UX, guardian communication system, secure signing ceremony, or incident-response procedure.

### 6.7 Smart-contract execution

The project does not currently expose a general-purpose VM, contract language, gas model, synchronous composability model, contract upgrade process, reentrancy boundary, or application-layer asset standard.

It is therefore not currently a smart-contract layer.

### 6.8 Privacy

There is no transaction privacy, confidential amount scheme, anonymity set, private recovery process, network-layer privacy, or metadata protection.

### 6.9 Governance and legal status

There is no decentralized governance design, foundation, issuer, operator agreement, legal characterization, regulatory analysis, tax model, sanctions process, consumer-protection framework, or dispute-resolution mechanism.

### 6.10 External assurance

There has been no independent security audit, formal proof, public testnet campaign, bug bounty, red-team engagement, reproducible-build review, supply-chain audit, or long-duration adversarial operation.

---

## 7. Intended destination

The project’s plausible destination is a narrowly scoped, auditable settlement substrate for conserved digital claims with strong custody and evidence semantics.

A responsible end state would require four distinct layers:

1. **Deterministic asset layer**  
   Defines units, conservation, ownership, transition validity, receipts, and state commitments.

2. **Custody and authorization layer**  
   Defines active authority, key rotation, recovery, revocation, policy migration, backup semantics, and operational signing profiles.

3. **Replication and consensus layer**  
   Defines replica identity, data propagation, fork evidence, ordering, finality, fault assumptions, availability, and economic attack cost.

4. **Economic and institutional layer**  
   Defines issuance or acquisition, monetary purpose, backing or non-backing, redemption if any, fee policy, operator incentives, governance, legal responsibilities, and conditions under which the unit could rationally hold value.

The repository currently has bounded evidence in the first two layers and an early proposal in the third. The fourth layer is largely undefined.

A smart-contract environment, if pursued, should be treated as an additional layer above settlement rather than assumed to be part of the current kernel. The present kernel may eventually serve as a settlement object or asset primitive for a contract system, but that conclusion has not been established.

---

## 8. Roadmap

The roadmap below is directional and non-canonical. Advancement should remain contingent on evidence, not schedule.

### Phase A — Complete R017 replication evidence

Target properties:

- pinned Ed25519 replica identities;
- direct export of exact R016 durable-store anchors;
- deterministic checkpoint generation;
- independent multi-process replica stores;
- duplication, omission, delay, reordering, corruption, partition, and healing schedules;
- identical fork proofs across independent observers;
- evidence persistence across restart;
- explicit stale-prefix and rollback detection;
- cross-implementation checkpoint verification.

Exit criterion:

> Independent hosts can exchange authenticated statements about exact R016 histories and produce identical evidence of agreement, gaps, forks, and equivocation without choosing a winner.

### Phase B — Specify consensus candidates without implementation commitment

Before implementing consensus, the project should compare candidate models against explicit requirements.

Candidate families may include:

- crash-fault-tolerant replicated state machine consensus for a permissioned research network;
- Byzantine fault-tolerant quorum consensus with a fixed or governed validator set;
- proof-of-stake with accountable finality;
- proof-of-work with objective fork choice;
- hybrid checkpointing or externally anchored settlement;
- a non-sovereign model that relies on an existing base layer.

The comparison should quantify:

- safety threshold;
- liveness threshold;
- synchrony assumptions;
- validator admission and removal;
- equivocation evidence;
- long-range attack resistance;
- weak subjectivity requirements;
- state-sync security;
- data availability;
- censorship resistance;
- recovery from catastrophic consensus failure;
- operating cost;
- implementation complexity;
- economic security budget.

Exit criterion:

> One consensus model is selected because its assumptions match the intended deployment and monetary purpose, not because it is fashionable or easy to market.

### Phase C — Implement a bounded consensus prototype

A prototype should begin with a fixed, explicitly permissioned environment unless there is a compelling reason to introduce open membership immediately.

Required evidence should include:

- deterministic replicated execution;
- conflicting proposal and vote handling;
- validator equivocation proofs;
- view or leader changes;
- partition safety;
- bounded liveness recovery;
- state-sync verification from genesis or authenticated checkpoints;
- replay and duplicate-message handling;
- crash recovery;
- Byzantine message mutation tests;
- model checking against the selected fault threshold;
- no silent finalization of conflicting histories.

This phase still would not authorize live value.

### Phase D — Operational custody profile

The research controller model must be converted into an operational custody design.

Work items include:

- key-generation requirements;
- hardware-backed signing;
- deterministic or documented key derivation;
- encrypted backups;
- secure restore tests;
- guardian replacement and policy rotation;
- configurable recovery delays;
- recovery cancellation and challenge paths;
- compromise and loss procedures;
- multi-device support;
- transaction-intent display;
- anti-phishing and anti-substitution controls;
- wallet state synchronization;
- disaster-recovery exercises.

Exit criterion:

> Independent users can lose or replace devices, rotate keys, recover under controlled conditions, and verify intended transactions without relying on test-vector secrets or repository operators.

### Phase E — Economic specification

No unit should be presented as a store of value until its economic purpose is explicit.

Questions include:

- Is the unit intended to be a scarce bearer asset, a redeemable claim, a settlement credit, a fee token, or something else?
- Who creates units and under what rule?
- Is supply fixed, scheduled, demand-responsive, or collateralized?
- What gives the unit value beyond software-enforced conservation?
- What secures the network after initial issuance?
- What prevents governance capture or arbitrary dilution?
- What is the fee market?
- What happens during low usage?
- What are the legal rights of a holder?
- Is there redemption, and against what?
- How are insolvency and reserve failure handled?

This phase should produce an economic threat model rather than a token-distribution announcement.

### Phase F — Adversarial public test network

Only after the preceding layers have bounded evidence should the project consider a public test network.

Required controls include:

- worthless test units;
- reproducible node builds;
- signed releases;
- dependency pinning and provenance;
- telemetry boundaries;
- fault injection;
- public fork and outage reporting;
- external node operators;
- documented upgrade procedures;
- no implication that test units will convert to valuable units;
- a bug bounty or structured external review.

### Phase G — External audit and formal analysis

The project would require independent review of:

- cryptographic use;
- state-machine safety;
- storage durability;
- consensus implementation;
- networking;
- wallet and recovery design;
- software supply chain;
- reproducible builds;
- governance and upgrade controls;
- economic assumptions.

Formal methods should target the final protocol rather than only the current bounded experiments.

### Phase H — Limited-value pilot, only if justified

A limited pilot should occur only after external review and should use explicit value caps, participant eligibility, incident procedures, rollback or compensation policy, monitoring, and legal review.

The default decision should remain not to launch if the security and economic case is inadequate.

---

## 9. Potential relationship to DeFi and smart contracts

A DeFi engineer evaluating Nexus should not treat it as an application platform today.

The current work is closer to a settlement-kernel research program. Its possible value to a future smart-contract system would be in providing:

- deterministic conserved asset primitives;
- controller-based authorization separate from raw keys;
- exact receipts and state commitments;
- durable replayable history;
- explicit fork and equivocation evidence;
- narrow, inspectable transition semantics.

Possible future integration models include:

1. **Native settlement layer** — Nexus becomes the base replicated state machine and later hosts a restricted contract VM.
2. **Asset subsystem** — the custody and conserved-claim kernel operates as a privileged module inside a broader execution environment.
3. **Rollup or application-specific layer** — Nexus state transitions are executed off-chain and anchored to an existing consensus layer.
4. **Custody protocol only** — controller and recovery semantics are adapted for assets settled elsewhere.
5. **Research artifact** — the work informs another system but is never deployed as an independent network.

The project has not selected among these models.

For a general smart-contract platform, substantial additional work would be required on execution determinism, resource accounting, state access, parallelism, contract authentication, upgrade semantics, composability, oracle boundaries, MEV, bridge security, and application isolation.

---

## 10. Main technical risks

### 10.1 Research-to-production gap

The current evidence is unusually explicit for a small research project, but it remains evidence over bounded fixtures and environments. The production gap is large.

### 10.2 Recovery centralization

A fixed 2-of-3 guardian policy means two compromised guardians can recover or revoke. Guardian independence is assumed rather than demonstrated.

### 10.3 First-accepted attacker transitions

Recovery cannot reverse a transfer that an attacker validly authorizes and commits before recovery occurs. This is a general custody-timing issue and needs explicit operational mitigation.

### 10.4 Rollback anchors

Caller-held anchors detect some rollback conditions only if the caller securely retains and authenticates them. Public checkpoint distribution and authenticated import are incomplete.

### 10.5 Consensus design risk

The most consequential architectural choice remains unresolved. A poor consensus choice could invalidate assumptions made by custody, durability, or economics.

### 10.6 Economic-security mismatch

A technically correct ledger can still fail as a store of value if the cost to attack, censor, or capture it is lower than the value secured.

### 10.7 Complexity accumulation

Each additional recovery rule, validator mechanism, bridge, contract feature, and governance process increases the trusted computing and social base. The project may need to remain deliberately narrow.

---

## 11. Review questions

External reviewers are specifically asked to challenge the following.

### State machine and cryptography

- Are the canonical encoding and domain-separation rules sufficient and sensibly scoped?
- Does the controller model introduce hidden replay, substitution, or cross-role signing risks?
- Is stable controller identity preferable to directly versioned key ownership in this architecture?
- Are the rotation, recovery, and revocation authorization sets defensible?
- What custody-policy migration model avoids permanent guardian lock-in without creating an authority-escalation path?

### Storage

- Is replay-from-genesis with an append-only event log a reasonable safety baseline?
- Are the SQLite restrictions and durability claims correctly bounded?
- Which additional power-loss, filesystem, storage-controller, and hostile-local-admin tests are essential?
- Should durable records include stronger external commitments or periodic compact authenticated snapshots?

### Replication and consensus

- Is the R017 checkpoint object sufficient to establish objective fork and equivocation evidence?
- What fields are missing for safe state sync and consensus integration?
- Should replica checkpoint chains be separate from ledger history or derived directly from consensus certificates?
- Which consensus family best fits a small network prioritizing safety, auditability, and reversible development?
- Would using an existing base layer be materially safer than designing sovereign consensus?

### Economics

- Is there any credible monetary role for this system that is not better served by an existing asset or settlement layer?
- What economic security model could support the expected value at risk?
- Should the project avoid a native floating-value token entirely?
- Would a fully reserved claim or externally collateralized unit be more defensible?
- What evidence would be required before describing any unit as a store of value?

### Smart-contract positioning

- Is this kernel a useful base-layer primitive, an application-specific rollup kernel, or mainly a custody experiment?
- What minimum execution environment would add real utility without overwhelming the current safety model?
- Which DeFi use cases, if any, justify the additional attack surface?

### Governance and operations

- Which repository governance controls should become protocol governance controls, and which should not?
- What upgrade and emergency-stop powers are unavoidable during early operation?
- How can those powers be made visible, bounded, and progressively removable?

---

## 12. Requested review format

A useful review does not need to endorse the project.

The preferred response is a factual critique containing:

1. the reviewer’s interpretation of what the project currently is;
2. the strongest demonstrated property;
3. the most serious invalid or overstated assumption;
4. the first design decision that should be reversed or reconsidered;
5. the best candidate deployment model;
6. the minimum additional evidence required before consensus work;
7. the minimum additional evidence required before any live-value pilot;
8. a recommendation to continue, narrow, reuse an existing base layer, or stop.

Reviewers are encouraged to reproduce the repository evidence and attack the exact proposal branches rather than review this document in isolation.

---

## 13. Conclusion

Nexus has not produced a real store of value or exchange network.

It has produced a progressively stronger local state-transition and custody demonstration with unusually explicit limits. The current canonical state conserves a synthetic unit, verifies exact signed transitions across independent implementations, persists one ordered history under tested crash conditions, and supports controller-bound key rotation, recovery, and revocation. The current draft work begins to preserve objective evidence when independent replicas disagree.

The largest unresolved questions are consensus, operational custody, economic purpose, and whether a new sovereign network is justified at all.

The project should be judged less by the quantity of code than by whether each new layer reduces uncertainty without silently importing stronger claims than the evidence supports.

**Advice is requested from distributed-systems, applied-cryptography, blockchain, wallet, storage, and DeFi engineers. The most valuable feedback is a concrete argument that a claimed layer is unnecessary, incorrectly specified, or safer to inherit from an existing system.**
