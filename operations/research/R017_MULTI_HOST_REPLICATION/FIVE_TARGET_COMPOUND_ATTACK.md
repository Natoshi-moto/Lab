# R017 five-target compound adversarial campaign

Status: `DRAFT`  
Status authority: `NONE`  
Baseline inspected: `6ad3b470d190eafdde97143c7df0c8334a754764` (`experiment/r019-vdf-quantum-break-demo`)  
Controlling accepted round: `R016`  
Next-action binding: `ACT-R017_DESIGN_MULTI_HOST_REPLICATION_AND_EXPLICIT_FORK_EVIDENCE`

## Purpose

This artifact specifies one reversible, synthetic campaign that attacks five
high-value gaps between the R016 single-history custody kernel and the proposed
R017 multi-host replication experiment. It is a design and preregistration
artifact, not execution evidence. No result is a pass until an implementation,
fixture set, deterministic runner, and machine-readable receipt exist and are
independently reproduced.

The campaign uses three isolated logical hosts (`A`, `B`, and `C`), the exact
R016 genesis bytes, deterministic event envelopes, authenticated checkpoint
messages, and an adversarial delivery schedule. Hosts share no database and no
mutable filesystem state.

## Why these five targets

| Target | High-value failure sought | Required oracle |
|---|---|---|
| T1 replica determinism | Identical admitted prefixes produce different roots, receipts, or public state | Byte-identical ordered prefixes must yield byte-identical roots, receipts, checkpoints, and classifications |
| T2 explicit sibling-fork evidence | Two valid children of one predecessor are hidden, overwritten, or silently rebased | Both child IDs and the shared predecessor are preserved in a deterministic fork-evidence object; neither branch is selected |
| T3 authenticated checkpoint exchange | A checkpoint is accepted with forged identity, wrong domain, replayed session, or altered payload | Signature, sender, protocol domain, genesis ID, height, root, and payload digest must all bind; any mismatch fails closed |
| T4 exact-genesis replay | A host imports state, skips a prefix, or replays from a lookalike genesis while reporting equivalence | Every reported state must replay from byte-identical frozen genesis through a contiguous verified envelope prefix |
| T5 hostile delivery and writers | Delay, duplication, reordering, omission, corruption, or competing writers causes silent convergence, loss, or equivocation | Each input is deterministically admitted, rejected, buffered within a declared bound, or emitted as explicit conflict evidence |

## Single compound attack artifact

The executable successor to this document should be one canonical JSON object,
`COMPOUND_CAMPAIGN.json`, with this top-level shape:

```json
{
  "schema": "nexus.r017-compound-campaign/v0",
  "genesis_sha256": "<sha256 of exact R016 genesis bytes>",
  "hosts": ["A", "B", "C"],
  "events": ["<canonical signed envelope bytes, base64>"],
  "checkpoints": ["<canonical authenticated checkpoint bytes, base64>"],
  "schedule": ["<deterministic delivery/action record>"],
  "expected": {
    "host_tips": {},
    "fork_evidence": [],
    "rejections": [],
    "buffered": []
  }
}
```

The artifact is content-addressed. Its digest, exact baseline commit, runner
version, and invocation must be recorded in the execution receipt. Randomness,
wall-clock time, network access, implicit retries, and host-dependent ordering
are forbidden in the evidence run.

## Compound schedule

One run attacks all five targets rather than treating them as independent happy
paths:

1. Initialize `A`, `B`, and `C` independently from the exact frozen R016
   genesis bytes. Assert identical initial roots and checkpoint bytes.
2. Deliver the same first accepted envelope to all three hosts through three
   different schedules: direct to `A`, duplicated to `B`, delayed then replayed
   to `C`. Assert one identical admitted record per host.
3. Partition `A` and `B`. Give each a different, correctly signed child of the
   same predecessor. The children must conflict by intent (transfer versus
   recovery is preferred) while remaining individually valid on cloned state.
4. Have `A` and `B` authenticate and exchange checkpoints through `C`. Inject,
   in deterministic order, a payload-bit corruption, sender substitution,
   wrong protocol domain, wrong genesis digest, stale-session replay, duplicate,
   and reordered predecessor/child delivery.
5. Release the partition. Deliver both sibling histories and every checkpoint
   to every host, including omissions followed by late delivery. No host may
   silently rebase an envelope or claim a unique winner. Each must preserve
   equivalent explicit fork evidence after receiving the same set.
6. Start two writers against each host's local admission boundary with a fixed
   barrier and both sibling children. Repeat with reversed writer arrival. The
   local winner may follow the declared serialization order, but the losing
   sibling must remain explicit evidence and may not mutate signed intent.
7. Destroy derived state on `C`; rebuild only from the exact genesis and its
   admitted canonical byte prefix. Compare the rebuilt result byte-for-byte
   with the pre-destruction result. Then repeat with one omitted envelope, one
   corrupted envelope, and a lookalike genesis; all three must fail closed.
8. Redeliver the complete multiset in at least two deterministic permutations.
   Once each host has the same authenticated objects, compare their set-derived
   fork evidence. Equality of evidence is required; convergence to a selected
   branch is neither required nor claimed.

## Required fork-evidence object

The minimum evidence object is canonical, content-addressed, and contains:

- network, profile, protocol version, and exact genesis digest;
- shared predecessor root and height;
- both or all distinct child event IDs and envelope digests, sorted by raw
  digest bytes only for encoding determinism;
- the first local observation record for each child;
- checkpoint sender identities and verified checkpoint digests that exposed
  the conflict;
- classification `SIBLING_FORK_OBSERVED`;
- `status_authority: NONE` and `branch_selection: NONE`.

Sorting is an encoding rule, never a fork-choice rule. The evidence object must
not contain fields named `winner`, `preferred`, `canonical_branch`, `final`, or
equivalents.

## Fail-closed gates

The campaign fails if any of the following occurs:

- identical exact prefixes yield non-identical public outputs;
- a signature verifies outside its checkpoint domain, sender, genesis, height,
  root, session, or payload digest;
- a malformed or unverifiable object mutates admitted state;
- a child is silently rewritten against a new predecessor;
- a sibling is discarded merely because another child arrived first;
- a host reports fork evidence without retaining both conflicting exact bytes;
- replay begins from imported derived state or a non-identical genesis;
- missing, corrupt, or non-contiguous history produces an apparently valid tip;
- duplication creates a second admission or a second semantic receipt;
- schedule order changes the set-derived fork-evidence bytes after all valid
  objects have arrived;
- any report promotes itself beyond `TEST` evidence or claims branch authority.

## Measurement and receipts

The runner should emit one canonical report containing, per target, attack-case
counts, exercised rejection codes, admitted prefix digests, final host roots,
checkpoint-verification outcomes, fork-evidence digests, replay comparisons,
and any `UNABLE_TO_VERIFY` result. A zero finding is
`NO_FINDING_WITH_SCOPE`, never proof of security.

The minimum acceptance bar is:

- every scheduled mutation and delivery is accounted for exactly once;
- all five target oracles execute in the same compound run;
- at least one valid sibling fork is observed and preserved;
- every declared corrupt/authentication-negative case is rejected before state
  mutation;
- exact-prefix replicas and exact-genesis replays match byte-for-byte;
- an independent implementation verifies the campaign and report without
  importing the producer's state-transition code.

## Bounded reconciliation evidence

R017 reconciliation means only exchange and deterministic comparison of exact
objects until hosts expose the same conflict set within a declared finite
schedule. It does not select, merge, discard, or reverse a branch. If a schedule
ends with omitted objects, the report records the incomplete view; it must not
infer global absence.

## Deliberate nonclaims

This campaign does not establish network consensus, fork choice, global
double-spend prevention, global finality, Byzantine fault tolerance,
availability, liveness under unbounded delay, Sybil resistance, economic
security, money, stable value, operational custody, production security,
deployment readiness, or authorization for live funds. Authentication does not
prove host independence, honest key custody, physical device identity, or
freshness beyond the explicitly bound synthetic session model.

## Inspected inputs

The authoring pass actually inspected `AGENTS.md`, `README_START_HERE.md`,
`STATUS.json`, `STATUS.md`, `NEXT_ACTION.md`, all seven Markdown files under
`constitution/`, `PROJECT_INDEX.json`,
`system/nexus_lab/custody_kernel.py`,
`experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/bounded_model.py`,
`experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/README.md`, and the R016
`THREAT_MODEL.md` and `PROTOCOL.md`. Repository files not named here were not
treated as inspected merely because they were listed by an index or file scan.
