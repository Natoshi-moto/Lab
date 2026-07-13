# R015 acceptance and kill criteria

R015 may carry only
`DEMONSTRATED_CROSS_IMPLEMENTATION_DURABILITY_TRANSCRIPT_VERIFICATION_AND_BOUNDED_CRASH_LIFECYCLE_CONSISTENCY`
when every item below passes on one exact proposal head.

## Required gates

1. Every R014 hash-bound file and receipt remains byte-identical to its promoted
   form.
2. The untrusted producer captures one canonical, bounded, closed prefix while
   the R014 writer lock is held, then publishes those bytes without replacement.
3. A process-attested fresh Node/Noble verifier built from the cold packet
   imports or invokes no Python, SQLite, Nexus implementation, existing
   verifier, or network code. This is build-process provenance, not a runtime
   proof of authorship or independence.
4. The separate verifier reconstructs exact genesis, every transaction,
   signature, state transition, receipt byte string, record hash, embedded
   prefix anchor, terminal anchor, and fixed supply.
5. The four-record fixture converges to state root
   `1b28ac32d6067a7b1bd2ec8b7097b341d891a2793a63c606da0c9eecf221598f`
   and receipt head
   `fedc92b971f0ea59586678297a981c950d2ac8646e8cf30f79bffc7537893ffc`.
6. A separately supplied tip anchor confirms the exact prefix and explicitly
   reports the highest confirmed sequence, whether the terminal anchor matched,
   and the unconfirmed suffix length. Without a separate anchor the same
   transcript reports `UNANCHORED`, an empty highest sequence, and the whole
   record set as unconfirmed. Caller-supplied anchor bytes are not authenticated
   provenance or proof of independent retention.
7. Resealed inner mutations covering bytes, roots, receipts, sequence, record
   linkage, embedded anchors, terminal anchor, authority, and duplicate rows
   all fail closed without changing the input.
8. Ahead-of-transcript, divergent, malformed, self-hash-invalid, duplicate, and
   excessive separate anchors fail with their exact class. An earlier matching
   prefix confirms only that prefix and does not claim freshness or fork choice.
   These are unauthenticated caller-input classifications, not proof that a
   rollback, fork, or tampering event occurred.
9. The standalone abstract model exhausts its declared finite state space and
   checks precommit, uncertain commit, postcommit/pre-ack, lost acknowledgement,
   exact retries, conflicting siblings, capacity, declared corruption-rejection
   no-op handling, and anchors. It does not model corruption detection.
10. The model explicitly admits both old and complete-new recovery during an
    abstract crash in commit, and admits no hybrid state.
11. Five or more deliberate lifecycle mutants are killed by the same model
    invariants.
12. Two executions of each verifier/model produce byte-identical reports, and
    the checked-in evidence gate compares exact bytes, including a separately
    saved unanchored report.
13. All reports and fixtures retain `status_authority: NONE`; the R001 canonical
    snapshot remains unchanged; no promotion command exists.

## Immediate kill criteria

Any task `kill_on` condition falsifies the proposal. In particular, a green CI
run cannot excuse a rewritten R014 evidence file, correlated cold-verifier
implementation, accepted hybrid, duplicate append, false anchor claim, or
broader economic/security language.

## Explicit limits

The producer and fixture anchor share this repository and failure domain. The
test demonstrates exact separate-input handling, not real external retention.
The model is a protocol-lifecycle model, not a model of SQLite, Python, the OS,
kernel, filesystem, storage firmware, power loss, malicious host compromise,
network ordering, or economic behavior.
