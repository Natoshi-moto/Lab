#!/usr/bin/env python3
"""Independent bounded model of the R015 commit/crash/retry lifecycle.

This file is intentionally an abstract model, not a wrapper around either
implementation under test.  It explores a finite transition system with a
deterministic breadth-first search and checks every generated transition
before admitting its destination state.
"""

from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter, defaultdict, deque
from dataclasses import dataclass, replace
from typing import Any, Iterable, Optional


REPORT_SCHEMA = "nexus.r015-crash-lifecycle-model-report/v0"
SELF_TEST_SCHEMA = "nexus.r015-crash-lifecycle-model-self-test/v0"
STATUS_AUTHORITY = "NONE"
TOTAL_SUPPLY = 1000

SIBLING_A = "SIBLING_A"
SIBLING_B = "SIBLING_B"
SIBLINGS = (SIBLING_A, SIBLING_B)
FILLERS = ("FILLER_1", "FILLER_2")
KNOWN_TRANSACTIONS = frozenset(SIBLINGS + FILLERS)

CAPACITY = 3
MAX_FAILURES_PER_WRITER = 2
MAX_ACK_LOSSES_PER_WRITER = 2
MAX_RETRIES_PER_WRITER = 3
MAX_BFS_DEPTH = 12

PHASE_NEVER = "NEVER_REQUESTED"
PHASE_UNKNOWN = "CALLER_OUTCOME_UNKNOWN"
PHASE_ACKED = "EXACT_ACKNOWLEDGEMENT_RECEIVED"
PHASE_REJECTED = "REJECTION_RECEIVED"
CLIENT_PHASES = frozenset(
    (PHASE_NEVER, PHASE_UNKNOWN, PHASE_ACKED, PHASE_REJECTED)
)

INVARIANT_IDS = (
    "anchor_classifications_and_limitations",
    "atomic_recovery_no_hybrid",
    "cap_behavior",
    "collision_rejects_without_mutation",
    "conflict_honesty",
    "conservation_and_authority_none",
    "declared_corruption_rejection_is_noop",
    "deterministic_byte_output",
    "duplicate_retry_at_most_once",
    "exact_acknowledgement",
    "lost_ack_recovery",
    "no_ack_before_commit",
    "prefix_validity",
)

REQUIRED_COVERAGE = (
    "anchor_common_prefix_confirms_both_suffixes_without_selecting_fork",
    "anchor_divergent_existing",
    "anchor_exact_current",
    "anchor_exact_earlier",
    "anchor_future",
    "anchor_malformed",
    "anchor_none",
    "anchor_self_hash_invalid",
    "cap_exact_retry_succeeds",
    "cap_fresh_rejects",
    "collision_retry_rejects_without_mutation",
    "commit_crash_complete_new_prefix",
    "commit_crash_old_prefix",
    "declared_corruption_rejection_is_noop",
    "exact_retry_after_later_store_tip",
    "exact_retry_no_append",
    "fresh_success_ack",
    "invalid_retry_rejects_without_mutation",
    "lost_ack_eventual_exact_recovery",
    "older_valid_history_unanchored",
    "postcommit_preack_unknown",
    "precommit_crash_old_prefix",
    "precommit_crash_retry_appends_once",
    "precommit_crash_sibling_intervenes_retry_rejects",
    "repeated_lost_ack",
    "sibling_conflict_rejects",
)


class ModelViolation(Exception):
    """A fail-closed model or coverage violation."""

    def __init__(self, invariant: str, detail: str):
        super().__init__(detail)
        self.invariant = invariant
        self.detail = detail


@dataclass(frozen=True)
class Client:
    phase: str = PHASE_NEVER
    retries: int = 0
    failures: int = 0
    ack_losses: int = 0
    precommit_seen: bool = False


@dataclass(frozen=True)
class State:
    records: tuple[str, ...] = ()
    writer_a: Client = Client()
    writer_b: Client = Client()
    total_supply: int = TOTAL_SUPPLY
    status_authority: str = STATUS_AUTHORITY


@dataclass(frozen=True)
class AnchorProbe:
    kind: str
    present: bool
    sequence: int
    anchor_id: str
    well_formed: bool
    self_hash_valid: bool


@dataclass(frozen=True)
class Event:
    action: str
    semantic_class: str
    outcome: str
    tx: str = ""
    request_kind: str = "PROBE"
    response_receipt: str = ""
    response_transaction_anchor: str = ""
    anchor_probe: Optional[AnchorProbe] = None
    anchor_classification: str = ""


@dataclass(frozen=True)
class Step:
    event: Event
    destination: State


@dataclass(frozen=True)
class Semantics:
    mutant: str = "NONE"


@dataclass
class Exploration:
    states: dict[State, int]
    depths: dict[State, int]
    transitions: list[tuple[State, Event, State]]
    coverage: Counter[str]
    checks: Counter[str]
    max_depth: int


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value, ensure_ascii=True, allow_nan=False, separators=(",", ":"), sort_keys=True
    ).encode("ascii")


def canonical_line(value: Any) -> bytes:
    return canonical_bytes(value) + b"\n"


def sha256_hex(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def client_dict(client: Client) -> dict[str, Any]:
    return {
        "ack_losses": client.ack_losses,
        "failures": client.failures,
        "phase": client.phase,
        "precommit_seen": "TRUE" if client.precommit_seen else "FALSE",
        "retries": client.retries,
    }


def state_dict(state: State) -> dict[str, Any]:
    return {
        "records": list(state.records),
        "status_authority": state.status_authority,
        "total_supply": state.total_supply,
        "writer_a": client_dict(state.writer_a),
        "writer_b": client_dict(state.writer_b),
    }


def anchor_probe_dict(probe: Optional[AnchorProbe]) -> Any:
    if probe is None:
        return None
    return {
        "anchor_id": probe.anchor_id,
        "kind": probe.kind,
        "present": "TRUE" if probe.present else "FALSE",
        "self_hash_valid": "TRUE" if probe.self_hash_valid else "FALSE",
        "sequence": probe.sequence,
        "well_formed": "TRUE" if probe.well_formed else "FALSE",
    }


def event_dict(event: Event) -> dict[str, Any]:
    return {
        "action": event.action,
        "anchor_classification": event.anchor_classification,
        "anchor_probe": anchor_probe_dict(event.anchor_probe),
        "outcome": event.outcome,
        "request_kind": event.request_kind,
        "response_receipt": event.response_receipt,
        "response_transaction_anchor": event.response_transaction_anchor,
        "semantic_class": event.semantic_class,
        "tx": event.tx,
    }


def client_key(client: Client) -> tuple[Any, ...]:
    return (
        client.phase,
        client.retries,
        client.failures,
        client.ack_losses,
        client.precommit_seen,
    )


def state_key(state: State) -> tuple[Any, ...]:
    return (
        state.records,
        client_key(state.writer_a),
        client_key(state.writer_b),
        state.total_supply,
        state.status_authority,
    )


def event_key(event: Event) -> tuple[Any, ...]:
    probe = event.anchor_probe
    probe_key: tuple[Any, ...] = ()
    if probe is not None:
        probe_key = (
            probe.kind,
            probe.present,
            probe.sequence,
            probe.anchor_id,
            probe.well_formed,
            probe.self_hash_valid,
        )
    return (
        event.action,
        event.semantic_class,
        event.outcome,
        event.tx,
        event.request_kind,
        event.response_receipt,
        event.response_transaction_anchor,
        probe_key,
        event.anchor_classification,
    )


def transition_dict(source: State, event: Event, destination: State) -> dict[str, Any]:
    return {
        "destination": state_dict(destination),
        "event": event_dict(event),
        "source": state_dict(source),
    }


def client_for(state: State, tx: str) -> Client:
    if tx == SIBLING_A:
        return state.writer_a
    if tx == SIBLING_B:
        return state.writer_b
    raise ValueError("not a writer transaction")


def with_client(state: State, tx: str, client: Client) -> State:
    if tx == SIBLING_A:
        return replace(state, writer_a=client)
    if tx == SIBLING_B:
        return replace(state, writer_b=client)
    raise ValueError("not a writer transaction")


def sibling_of(tx: str) -> str:
    if tx == SIBLING_A:
        return SIBLING_B
    if tx == SIBLING_B:
        return SIBLING_A
    raise ValueError("not a sibling transaction")


def append_record(state: State, tx: str) -> State:
    return replace(state, records=state.records + (tx,))


def prefix_anchor_id(records: tuple[str, ...], sequence: int) -> str:
    subject = {
        "prefix": list(records[:sequence]),
        "sequence": sequence,
        "status_authority": STATUS_AUTHORITY,
    }
    return sha256_hex(b"NEXUS/R015/ABSTRACT-PREFIX/V0\x00" + canonical_bytes(subject))


def response_for(records: tuple[str, ...], tx: str) -> tuple[str, str]:
    index = records.index(tx)
    sequence = index + 1
    subject = {
        "previous_anchor": prefix_anchor_id(records, index),
        "sequence": sequence,
        "transaction": tx,
        "transaction_anchor": prefix_anchor_id(records, sequence),
    }
    receipt = sha256_hex(b"NEXUS/R015/ABSTRACT-RECEIPT/V0\x00" + canonical_bytes(subject))
    return receipt, subject["transaction_anchor"]


def classification_expected(probe: AnchorProbe, records: tuple[str, ...]) -> str:
    if not probe.present:
        return "UNANCHORED"
    if not probe.well_formed or not probe.self_hash_valid:
        return "ANCHOR_INVALID"
    if probe.sequence > len(records):
        return "ANCHOR_AHEAD_OF_TRANSCRIPT"
    if probe.anchor_id == prefix_anchor_id(records, probe.sequence):
        return "ANCHORED_PREFIX_CONFIRMED"
    return "ANCHOR_TRANSCRIPT_MISMATCH"


def classify_anchor(
    probe: AnchorProbe, records: tuple[str, ...], semantics: Semantics
) -> str:
    if semantics.mutant == "MALFORMED_ANCHOR_PASS" and (
        not probe.well_formed or not probe.self_hash_valid
    ):
        return "ANCHORED_PREFIX_CONFIRMED"
    return classification_expected(probe, records)


def updated_unknown_client(
    client: Client,
    *,
    retry_increment: int,
    failure_increment: int,
    ack_loss_increment: int = 0,
    precommit: bool = False,
) -> Client:
    return replace(
        client,
        phase=PHASE_UNKNOWN,
        retries=client.retries + retry_increment,
        failures=client.failures + failure_increment,
        ack_losses=client.ack_losses + ack_loss_increment,
        precommit_seen=client.precommit_seen or precommit,
    )


def exact_retry_steps(state: State, tx: str, semantics: Semantics) -> list[Step]:
    client = client_for(state, tx)
    is_unknown = client.phase == PHASE_UNKNOWN
    request_kind = "RETRY" if is_unknown else "EXACT_REPLAY_AFTER_ACK"
    retry_increment = 1 if is_unknown else 0
    if is_unknown and client.retries >= MAX_RETRIES_PER_WRITER:
        return []

    if semantics.mutant == "DUPLICATE_RETRY_APPEND":
        destination = append_record(state, tx)
        destination = with_client(
            destination,
            tx,
            replace(client, phase=PHASE_ACKED, retries=client.retries + retry_increment),
        )
        receipt, anchor = response_for(state.records, tx)
        return [
            Step(
                Event(
                    action=f"{request_kind}_{tx}_ACK",
                    semantic_class="EXACT_ACK",
                    outcome="ACKNOWLEDGED_ORIGINAL_RECEIPT",
                    tx=tx,
                    request_kind=request_kind,
                    response_receipt=receipt,
                    response_transaction_anchor=anchor,
                ),
                destination,
            )
        ]

    receipt, anchor = response_for(state.records, tx)
    acknowledged = with_client(
        state,
        tx,
        replace(client, phase=PHASE_ACKED, retries=client.retries + retry_increment),
    )
    steps = [
        Step(
            Event(
                action=f"{request_kind}_{tx}_ACK",
                semantic_class="EXACT_ACK",
                outcome="ACKNOWLEDGED_ORIGINAL_RECEIPT",
                tx=tx,
                request_kind=request_kind,
                response_receipt=receipt,
                response_transaction_anchor=anchor,
            ),
            acknowledged,
        )
    ]

    if (
        is_unknown
        and client.failures < MAX_FAILURES_PER_WRITER
        and client.ack_losses < MAX_ACK_LOSSES_PER_WRITER
    ):
        lost_client = updated_unknown_client(
            client,
            retry_increment=1,
            failure_increment=1,
            ack_loss_increment=1,
        )
        steps.append(
            Step(
                Event(
                    action=f"RETRY_{tx}_ACK_LOST_AGAIN",
                    semantic_class="EXACT_ACK_LOSS",
                    outcome="COMMITTED_CALLER_OUTCOME_UNKNOWN",
                    tx=tx,
                    request_kind="RETRY",
                ),
                with_client(state, tx, lost_client),
            )
        )
    return steps


def request_steps(state: State, tx: str, semantics: Semantics) -> list[Step]:
    client = client_for(state, tx)
    if client.phase in (PHASE_ACKED, PHASE_REJECTED):
        if client.phase == PHASE_ACKED and tx in state.records:
            return exact_retry_steps(state, tx, semantics)
        return []

    is_retry = client.phase == PHASE_UNKNOWN
    if is_retry and client.retries >= MAX_RETRIES_PER_WRITER:
        return []
    retry_increment = 1 if is_retry else 0
    request_kind = "RETRY" if is_retry else "INITIAL"

    if tx in state.records:
        return exact_retry_steps(state, tx, semantics)

    sibling = sibling_of(tx)
    if sibling in state.records:
        if semantics.mutant == "BOTH_SIBLINGS_COMMIT":
            destination = append_record(state, tx)
            new_client = replace(
                client, phase=PHASE_ACKED, retries=client.retries + retry_increment
            )
            destination = with_client(destination, tx, new_client)
            receipt, anchor = response_for(destination.records, tx)
            return [
                Step(
                    Event(
                        action=f"{request_kind}_{tx}_WITH_SIBLING_PRESENT",
                        semantic_class="SIBLING_CONFLICT",
                        outcome="MUTANT_SECOND_SIBLING_COMMITTED",
                        tx=tx,
                        request_kind=request_kind,
                        response_receipt=receipt,
                        response_transaction_anchor=anchor,
                    ),
                    destination,
                )
            ]
        rejected = with_client(
            state,
            tx,
            replace(
                client,
                phase=PHASE_REJECTED,
                retries=client.retries + retry_increment,
            ),
        )
        return [
            Step(
                Event(
                    action=f"{request_kind}_{tx}_WITH_SIBLING_PRESENT",
                    semantic_class="SIBLING_CONFLICT",
                    outcome="SIBLING_CONFLICT_REJECTED",
                    tx=tx,
                    request_kind=request_kind,
                ),
                rejected,
            )
        ]

    if len(state.records) >= CAPACITY:
        rejected = with_client(
            state,
            tx,
            replace(
                client,
                phase=PHASE_REJECTED,
                retries=client.retries + retry_increment,
            ),
        )
        return [
            Step(
                Event(
                    action=f"{request_kind}_{tx}_AT_CAP",
                    semantic_class="CAP_REJECT",
                    outcome="CAP_REACHED_REJECTED",
                    tx=tx,
                    request_kind=request_kind,
                ),
                rejected,
            )
        ]

    steps: list[Step] = []
    if client.failures < MAX_FAILURES_PER_WRITER:
        precommit_client = updated_unknown_client(
            client,
            retry_increment=retry_increment,
            failure_increment=1,
            precommit=True,
        )
        precommit_destination = with_client(state, tx, precommit_client)
        precommit_receipt = ""
        precommit_anchor = ""
        if semantics.mutant == "ACK_BEFORE_COMMIT":
            precommit_destination = with_client(
                state,
                tx,
                replace(
                    precommit_client,
                    phase=PHASE_ACKED,
                ),
            )
            precommit_receipt = "MUTANT_ACK_WITHOUT_COMMIT"
            precommit_anchor = "MUTANT_ACK_WITHOUT_COMMIT"
        if semantics.mutant == "PRECOMMIT_PERSISTS":
            precommit_destination = append_record(precommit_destination, tx)
        steps.append(
            Step(
                Event(
                    action=f"{request_kind}_{tx}_PRE_COMMIT_CRASH",
                    semantic_class="PRECOMMIT_CRASH",
                    outcome="OLD_PREFIX_CALLER_OUTCOME_UNKNOWN",
                    tx=tx,
                    request_kind=request_kind,
                    response_receipt=precommit_receipt,
                    response_transaction_anchor=precommit_anchor,
                ),
                precommit_destination,
            )
        )

        commit_crash_client = updated_unknown_client(
            client,
            retry_increment=retry_increment,
            failure_increment=1,
        )
        steps.append(
            Step(
                Event(
                    action=f"{request_kind}_{tx}_COMMIT_CRASH_OLD",
                    semantic_class="COMMIT_CRASH_OLD",
                    outcome="OLD_PREFIX_CALLER_OUTCOME_UNKNOWN",
                    tx=tx,
                    request_kind=request_kind,
                ),
                with_client(state, tx, commit_crash_client),
            )
        )
        committed_unknown = with_client(
            append_record(state, tx), tx, commit_crash_client
        )
        steps.append(
            Step(
                Event(
                    action=f"{request_kind}_{tx}_COMMIT_CRASH_NEW",
                    semantic_class="COMMIT_CRASH_NEW",
                    outcome="COMPLETE_NEW_PREFIX_CALLER_OUTCOME_UNKNOWN",
                    tx=tx,
                    request_kind=request_kind,
                ),
                committed_unknown,
            )
        )

        postcommit_client = updated_unknown_client(
            client,
            retry_increment=retry_increment,
            failure_increment=1,
            ack_loss_increment=1,
        )
        steps.append(
            Step(
                Event(
                    action=f"{request_kind}_{tx}_POST_COMMIT_PRE_ACK_LOSS",
                    semantic_class="POSTCOMMIT_ACK_LOSS",
                    outcome="COMMITTED_CALLER_OUTCOME_UNKNOWN",
                    tx=tx,
                    request_kind=request_kind,
                ),
                with_client(append_record(state, tx), tx, postcommit_client),
            )
        )

    committed = append_record(state, tx)
    acknowledged_client = replace(
        client,
        phase=PHASE_ACKED,
        retries=client.retries + retry_increment,
    )
    committed = with_client(committed, tx, acknowledged_client)
    receipt, anchor = response_for(committed.records, tx)
    steps.append(
        Step(
            Event(
                action=f"{request_kind}_{tx}_SUCCESS_ACK",
                semantic_class="FRESH_ACK",
                outcome="COMMITTED_AND_ACKNOWLEDGED",
                tx=tx,
                request_kind=request_kind,
                response_receipt=receipt,
                response_transaction_anchor=anchor,
            ),
            committed,
        )
    )
    return steps


def anchor_steps(state: State, semantics: Semantics) -> list[Step]:
    record_count = len(state.records)
    probes = [
        AnchorProbe("NONE", False, 0, "", True, True),
        AnchorProbe(
            "EXACT_CURRENT",
            True,
            record_count,
            prefix_anchor_id(state.records, record_count),
            True,
            True,
        ),
        AnchorProbe(
            "FUTURE",
            True,
            record_count + 1,
            sha256_hex(b"SELF-CONSISTENT-FUTURE" + canonical_bytes(list(state.records))),
            True,
            True,
        ),
        AnchorProbe(
            "MALFORMED",
            True,
            record_count,
            prefix_anchor_id(state.records, record_count),
            False,
            False,
        ),
        AnchorProbe(
            "SELF_HASH_INVALID",
            True,
            record_count,
            prefix_anchor_id(state.records, record_count),
            True,
            False,
        ),
    ]
    if record_count:
        earlier = record_count - 1
        probes.append(
            AnchorProbe(
                "EXACT_EARLIER",
                True,
                earlier,
                prefix_anchor_id(state.records, earlier),
                True,
                True,
            )
        )
        divergent_subject = {
            "alternate_prefix": ["SELF_CONSISTENT_DIVERGENCE"],
            "sequence": record_count,
        }
        probes.append(
            AnchorProbe(
                "DIVERGENT_EXISTING",
                True,
                record_count,
                sha256_hex(
                    b"NEXUS/R015/ABSTRACT-PREFIX/V0\x00"
                    + canonical_bytes(divergent_subject)
                ),
                True,
                True,
            )
        )

    steps = []
    for probe in probes:
        classification = classify_anchor(probe, state.records, semantics)
        steps.append(
            Step(
                Event(
                    action=f"CLASSIFY_EXTERNAL_ANCHOR_{probe.kind}",
                    semantic_class="ANCHOR_CLASSIFICATION",
                    outcome=classification,
                    anchor_probe=probe,
                    anchor_classification=classification,
                ),
                state,
            )
        )
    return steps


def other_probe_steps(state: State) -> list[Step]:
    steps: list[Step] = []
    for tx in SIBLINGS:
        if tx in state.records:
            steps.extend(
                (
                    Step(
                        Event(
                            action=f"CONFLICTING_RETRY_{tx}_SAME_ID_DIFFERENT_BYTES",
                            semantic_class="COLLISION_REJECT",
                            outcome="TRANSACTION_ID_COLLISION_REJECTED",
                            tx=tx,
                        ),
                        state,
                    ),
                    Step(
                        Event(
                            action=f"INVALID_RETRY_{tx}",
                            semantic_class="INVALID_REJECT",
                            outcome="INVALID_REQUEST_REJECTED",
                            tx=tx,
                        ),
                        state,
                    ),
                )
            )

    for filler_index, filler in enumerate(FILLERS):
        # Fillers are a deliberately ordered capacity witness, not additional
        # concurrent writers.  Their ordering keeps the abstract state focused
        # on the two sibling writers while still allowing an original receipt
        # to be retried after later records and at the cap.
        if filler_index and FILLERS[filler_index - 1] not in state.records:
            continue
        if filler not in state.records and len(state.records) < CAPACITY:
            destination = append_record(state, filler)
            receipt, anchor = response_for(destination.records, filler)
            steps.append(
                Step(
                    Event(
                        action=f"COMMIT_{filler}",
                        semantic_class="FILLER_COMMIT",
                        outcome="COMMITTED_AND_ACKNOWLEDGED",
                        tx=filler,
                        response_receipt=receipt,
                        response_transaction_anchor=anchor,
                    ),
                    destination,
                )
            )

    if len(state.records) == CAPACITY:
        steps.append(
            Step(
                Event(
                    action="FRESH_VALID_TRANSACTION_AT_CAP",
                    semantic_class="CAP_REJECT",
                    outcome="CAP_REACHED_REJECTED",
                    tx="FRESH_CAP_PROBE",
                ),
                state,
            )
        )

    for declared_class in ("AUTHORITY_FIELD", "RECORD_SHAPE", "PREFIX_LENGTH"):
        steps.append(
            Step(
                Event(
                    action=f"DECLARED_CORRUPTION_REJECTION_{declared_class}_NOOP",
                    semantic_class="DECLARED_CORRUPTION_REJECTION_IS_NOOP",
                    outcome="DECLARED_CORRUPTION_REJECTION_IS_NOOP",
                ),
                state,
            )
        )
    return steps


def successors(state: State, semantics: Semantics) -> list[Step]:
    steps = []
    for tx in SIBLINGS:
        steps.extend(request_steps(state, tx, semantics))
    steps.extend(other_probe_steps(state))
    steps.extend(anchor_steps(state, semantics))
    return sorted(steps, key=lambda step: (event_key(step.event), state_key(step.destination)))


def require(condition: bool, invariant: str, detail: str) -> None:
    if not condition:
        raise ModelViolation(invariant, detail)


def assert_state_shape(state: State) -> None:
    require(
        len(state.records) <= CAPACITY,
        "prefix_validity",
        "durable prefix exceeded the configured cap",
    )
    require(
        all(record in KNOWN_TRANSACTIONS for record in state.records),
        "prefix_validity",
        "durable prefix contains an unknown or hybrid record",
    )
    require(
        len(set(state.records)) == len(state.records),
        "prefix_validity",
        "durable prefix contains a duplicate transaction",
    )
    require(
        not ({SIBLING_A, SIBLING_B} <= set(state.records)),
        "prefix_validity",
        "both conflicting siblings occur in one durable prefix",
    )
    require(
        state.total_supply == TOTAL_SUPPLY,
        "conservation_and_authority_none",
        "abstract supply changed",
    )
    require(
        state.status_authority == STATUS_AUTHORITY,
        "conservation_and_authority_none",
        "status authority changed",
    )
    for client in (state.writer_a, state.writer_b):
        require(client.phase in CLIENT_PHASES, "prefix_validity", "unknown client phase")
        require(
            0 <= client.retries <= MAX_RETRIES_PER_WRITER,
            "prefix_validity",
            "retry bound exceeded",
        )
        require(
            0 <= client.failures <= MAX_FAILURES_PER_WRITER,
            "prefix_validity",
            "failure bound exceeded",
        )
        require(
            0 <= client.ack_losses <= MAX_ACK_LOSSES_PER_WRITER,
            "prefix_validity",
            "ack-loss bound exceeded",
        )
        require(
            client.ack_losses <= client.failures,
            "prefix_validity",
            "ack losses exceed total failures",
        )


def expected_response(destination: State, tx: str) -> tuple[str, str]:
    require(
        tx in destination.records,
        "no_ack_before_commit",
        "acknowledgement was emitted before its transaction was durable",
    )
    return response_for(destination.records, tx)


def validate_transition(
    source: State, event: Event, destination: State, checks: Counter[str]
) -> None:
    # Check acknowledgement causality before generic prefix checks so the
    # corresponding mutation is killed by the precise invariant.
    for tx in SIBLINGS:
        client = client_for(destination, tx)
        if client.phase == PHASE_ACKED:
            require(
                tx in destination.records,
                "no_ack_before_commit",
                "client has an acknowledgement for a non-durable transaction",
            )
    if event.response_receipt or event.response_transaction_anchor:
        expected_receipt, expected_anchor = expected_response(destination, event.tx)
        require(
            event.response_receipt == expected_receipt
            and event.response_transaction_anchor == expected_anchor,
            "exact_acknowledgement",
            "response is not the transaction's original receipt and anchor",
        )
    checks["no_ack_before_commit"] += 1

    if event.semantic_class == "PRECOMMIT_CRASH":
        require(
            destination.records == source.records,
            "atomic_recovery_no_hybrid",
            "pre-commit crash persisted a record",
        )
        require(
            not event.response_receipt,
            "no_ack_before_commit",
            "pre-commit crash returned an acknowledgement",
        )
        checks["atomic_recovery_no_hybrid"] += 1
    elif event.semantic_class == "COMMIT_CRASH_OLD":
        require(
            destination.records == source.records,
            "atomic_recovery_no_hybrid",
            "old crash branch did not recover the exact old prefix",
        )
        checks["atomic_recovery_no_hybrid"] += 1
    elif event.semantic_class == "COMMIT_CRASH_NEW":
        require(
            destination.records == source.records + (event.tx,),
            "atomic_recovery_no_hybrid",
            "new crash branch did not recover one complete new prefix",
        )
        checks["atomic_recovery_no_hybrid"] += 1
    elif event.semantic_class == "POSTCOMMIT_ACK_LOSS":
        require(
            destination.records == source.records + (event.tx,)
            and client_for(destination, event.tx).phase == PHASE_UNKNOWN
            and not event.response_receipt,
            "lost_ack_recovery",
            "post-commit/pre-ack loss was not durable with unknown caller outcome",
        )
        checks["lost_ack_recovery"] += 1

    if event.semantic_class in ("EXACT_ACK", "EXACT_ACK_LOSS"):
        require(
            destination.records == source.records,
            "duplicate_retry_at_most_once",
            "exact retry appended another durable record",
        )
        require(
            source.records.count(event.tx) == 1,
            "duplicate_retry_at_most_once",
            "exact retry did not begin from one durable occurrence",
        )
        checks["duplicate_retry_at_most_once"] += 1
        if event.semantic_class == "EXACT_ACK":
            expected_receipt, expected_anchor = response_for(source.records, event.tx)
            require(
                event.response_receipt == expected_receipt
                and event.response_transaction_anchor == expected_anchor,
                "exact_acknowledgement",
                "exact retry did not return the original receipt and transaction anchor",
            )
            require(
                client_for(destination, event.tx).phase == PHASE_ACKED,
                "exact_acknowledgement",
                "exact retry acknowledgement did not resolve caller state",
            )
            checks["exact_acknowledgement"] += 1
            if client_for(source, event.tx).ack_losses:
                checks["lost_ack_recovery"] += 1
        else:
            require(
                client_for(destination, event.tx).phase == PHASE_UNKNOWN
                and not event.response_receipt,
                "lost_ack_recovery",
                "lost retry acknowledgement was exposed as resolved",
            )
            checks["lost_ack_recovery"] += 1

    if event.semantic_class == "SIBLING_CONFLICT":
        require(
            destination.records == source.records
            and event.outcome == "SIBLING_CONFLICT_REJECTED"
            and client_for(destination, event.tx).phase == PHASE_REJECTED,
            "conflict_honesty",
            "a sibling conflict was hidden or committed",
        )
        checks["conflict_honesty"] += 1

    if event.semantic_class in ("COLLISION_REJECT", "INVALID_REJECT"):
        invariant = "collision_rejects_without_mutation"
        require(
            destination == source,
            invariant,
            "same-id-different-bytes or invalid retry mutated state",
        )
        expected_outcome = (
            "TRANSACTION_ID_COLLISION_REJECTED"
            if event.semantic_class == "COLLISION_REJECT"
            else "INVALID_REQUEST_REJECTED"
        )
        require(event.outcome == expected_outcome, invariant, "retry was not rejected honestly")
        checks[invariant] += 1

    if event.semantic_class == "CAP_REJECT":
        require(destination == source or event.tx in SIBLINGS, "cap_behavior", "cap probe mutated state")
        require(
            destination.records == source.records
            and event.outcome == "CAP_REACHED_REJECTED",
            "cap_behavior",
            "fresh request at cap was not rejected without append",
        )
        checks["cap_behavior"] += 1
    if event.semantic_class == "EXACT_ACK" and len(source.records) == CAPACITY:
        require(
            event.outcome == "ACKNOWLEDGED_ORIGINAL_RECEIPT",
            "cap_behavior",
            "cap blocked an exact retry",
        )
        checks["cap_behavior"] += 1

    if event.semantic_class == "ANCHOR_CLASSIFICATION":
        require(event.anchor_probe is not None, "anchor_classifications_and_limitations", "missing anchor probe")
        expected = classification_expected(event.anchor_probe, source.records)
        require(
            event.anchor_classification == expected and destination == source,
            "anchor_classifications_and_limitations",
            "external anchor was misclassified or changed the prefix",
        )
        checks["anchor_classifications_and_limitations"] += 1

    if event.semantic_class == "DECLARED_CORRUPTION_REJECTION_IS_NOOP":
        require(
            destination == source
            and event.outcome == "DECLARED_CORRUPTION_REJECTION_IS_NOOP",
            "declared_corruption_rejection_is_noop",
            "an externally declared rejection changed abstract state",
        )
        checks["declared_corruption_rejection_is_noop"] += 1

    # Every acknowledgement-bearing transition, including fresh and filler
    # commits, must carry the receipt anchored at that transaction rather than
    # at a later store tip.
    if event.response_receipt:
        checks["exact_acknowledgement"] += 1

    assert_state_shape(destination)
    checks["prefix_validity"] += 1
    checks["conservation_and_authority_none"] += 1


def update_coverage(
    coverage: Counter[str], source: State, event: Event, destination: State
) -> None:
    semantic = event.semantic_class
    if semantic == "PRECOMMIT_CRASH":
        coverage["precommit_crash_old_prefix"] += 1
    elif semantic == "COMMIT_CRASH_OLD":
        coverage["commit_crash_old_prefix"] += 1
    elif semantic == "COMMIT_CRASH_NEW":
        coverage["commit_crash_complete_new_prefix"] += 1
        if client_for(source, event.tx).precommit_seen and event.request_kind == "RETRY":
            coverage["precommit_crash_retry_appends_once"] += 1
    elif semantic == "POSTCOMMIT_ACK_LOSS":
        coverage["postcommit_preack_unknown"] += 1
        if client_for(source, event.tx).precommit_seen and event.request_kind == "RETRY":
            coverage["precommit_crash_retry_appends_once"] += 1
    elif semantic == "FRESH_ACK":
        coverage["fresh_success_ack"] += 1
        if client_for(source, event.tx).precommit_seen and event.request_kind == "RETRY":
            coverage["precommit_crash_retry_appends_once"] += 1
    elif semantic in ("EXACT_ACK", "EXACT_ACK_LOSS"):
        coverage["exact_retry_no_append"] += 1
        tx_index = source.records.index(event.tx)
        if tx_index < len(source.records) - 1:
            coverage["exact_retry_after_later_store_tip"] += 1
        if semantic == "EXACT_ACK_LOSS" and client_for(source, event.tx).ack_losses:
            coverage["repeated_lost_ack"] += 1
        if semantic == "EXACT_ACK" and client_for(source, event.tx).ack_losses:
            coverage["lost_ack_eventual_exact_recovery"] += 1
        if len(source.records) == CAPACITY and semantic == "EXACT_ACK":
            coverage["cap_exact_retry_succeeds"] += 1
    elif semantic == "SIBLING_CONFLICT":
        coverage["sibling_conflict_rejects"] += 1
        client = client_for(source, event.tx)
        if client.precommit_seen and event.request_kind == "RETRY":
            coverage["precommit_crash_sibling_intervenes_retry_rejects"] += 1
    elif semantic == "CAP_REJECT":
        coverage["cap_fresh_rejects"] += 1
    elif semantic == "COLLISION_REJECT":
        coverage["collision_retry_rejects_without_mutation"] += 1
    elif semantic == "INVALID_REJECT":
        coverage["invalid_retry_rejects_without_mutation"] += 1
    elif semantic == "DECLARED_CORRUPTION_REJECTION_IS_NOOP":
        coverage["declared_corruption_rejection_is_noop"] += 1
    elif semantic == "ANCHOR_CLASSIFICATION" and event.anchor_probe is not None:
        names = {
            "NONE": "anchor_none",
            "EXACT_CURRENT": "anchor_exact_current",
            "EXACT_EARLIER": "anchor_exact_earlier",
            "FUTURE": "anchor_future",
            "DIVERGENT_EXISTING": "anchor_divergent_existing",
            "MALFORMED": "anchor_malformed",
            "SELF_HASH_INVALID": "anchor_self_hash_invalid",
        }
        coverage[names[event.anchor_probe.kind]] += 1


def validate_global_properties(exploration: Exploration, semantics: Semantics) -> None:
    branch_outcomes: defaultdict[bytes, set[str]] = defaultdict(set)
    for source, event, _destination in exploration.transitions:
        if event.semantic_class in ("COMMIT_CRASH_OLD", "COMMIT_CRASH_NEW"):
            operation = canonical_bytes(
                {
                    "request_kind": event.request_kind,
                    "source": state_dict(source),
                    "tx": event.tx,
                }
            )
            branch_outcomes[operation].add(event.semantic_class)
    require(bool(branch_outcomes), "atomic_recovery_no_hybrid", "no commit crash branch was explored")
    for outcomes in branch_outcomes.values():
        require(
            outcomes == {"COMMIT_CRASH_OLD", "COMMIT_CRASH_NEW"},
            "atomic_recovery_no_hybrid",
            "a commit crash did not branch to both exact old and complete new prefixes",
        )
        exploration.checks["atomic_recovery_no_hybrid"] += 1

    # No external anchor means an older valid prefix remains honestly
    # UNANCHORED; the model must not invent freshness or ahead-of-transcript
    # evidence.
    none_probe = AnchorProbe("NONE", False, 0, "", True, True)
    require(
        classify_anchor(none_probe, (SIBLING_A,), semantics) == "UNANCHORED",
        "anchor_classifications_and_limitations",
        "older valid history without an anchor did not remain unanchored",
    )
    exploration.coverage["older_valid_history_unanchored"] += 1
    exploration.checks["anchor_classifications_and_limitations"] += 1

    # The same genesis-prefix anchor confirms two later divergent suffixes but
    # returns no fork-selection result.
    common_id = prefix_anchor_id((), 0)
    common_probe = AnchorProbe("COMMON_PREFIX", True, 0, common_id, True, True)
    left = classify_anchor(common_probe, (SIBLING_A,), semantics)
    right = classify_anchor(common_probe, (SIBLING_B,), semantics)
    require(
        left == right == "ANCHORED_PREFIX_CONFIRMED",
        "anchor_classifications_and_limitations",
        "common-prefix anchor selected or rejected one divergent suffix",
    )
    exploration.coverage[
        "anchor_common_prefix_confirms_both_suffixes_without_selecting_fork"
    ] += 1
    exploration.checks["anchor_classifications_and_limitations"] += 1

    for coverage_name in REQUIRED_COVERAGE:
        require(
            exploration.coverage[coverage_name] > 0,
            "prefix_validity",
            f"required bounded scenario was not covered: {coverage_name}",
        )


def explore(semantics: Semantics = Semantics()) -> Exploration:
    initial = State()
    assert_state_shape(initial)
    states = {initial: 0}
    depths = {initial: 0}
    queue: deque[State] = deque((initial,))
    transitions: list[tuple[State, Event, State]] = []
    coverage: Counter[str] = Counter()
    checks: Counter[str] = Counter()
    max_depth = 0

    while queue:
        source = queue.popleft()
        source_depth = depths[source]
        max_depth = max(max_depth, source_depth)
        for step in successors(source, semantics):
            validate_transition(source, step.event, step.destination, checks)
            transitions.append((source, step.event, step.destination))
            update_coverage(coverage, source, step.event, step.destination)
            if step.destination not in states:
                new_depth = source_depth + 1
                require(
                    new_depth <= MAX_BFS_DEPTH,
                    "prefix_validity",
                    "declared BFS depth was insufficient for the bounded state space",
                )
                states[step.destination] = len(states)
                depths[step.destination] = new_depth
                queue.append(step.destination)

    exploration = Exploration(states, depths, transitions, coverage, checks, max_depth)
    validate_global_properties(exploration, semantics)
    return exploration


def transition_digest(exploration: Exploration) -> str:
    digest = hashlib.sha256()
    digest.update(b"NEXUS/R015/BOUNDED-TRANSITION-GRAPH/V0\x00")
    for state, state_id in exploration.states.items():
        encoded = canonical_bytes({"id": state_id, "state": state_dict(state)})
        digest.update(str(len(encoded)).encode("ascii") + b":" + encoded)
    for source, event, destination in exploration.transitions:
        encoded = canonical_bytes(
            {
                "destination": exploration.states[destination],
                "event": event_dict(event),
                "source": exploration.states[source],
            }
        )
        digest.update(str(len(encoded)).encode("ascii") + b":" + encoded)
    return digest.hexdigest()


def state_digest(exploration: Exploration) -> str:
    digest = hashlib.sha256()
    digest.update(b"[")
    for index, (state, depth) in enumerate(exploration.depths.items()):
        if index:
            digest.update(b",")
        digest.update(canonical_bytes({"depth": depth, "state": state_dict(state)}))
    digest.update(b"]")
    return digest.hexdigest()


def semantic_fingerprint(exploration: Exploration, graph_digest: str) -> bytes:
    return canonical_bytes(
        {
            "coverage": dict(sorted(exploration.coverage.items())),
            "state_digest": state_digest(exploration),
            "transition_digest": graph_digest,
            "transition_count": len(exploration.transitions),
        }
    )


def build_report() -> dict[str, Any]:
    first = explore()
    first_transition_digest = transition_digest(first)
    first_fingerprint = semantic_fingerprint(first, first_transition_digest)
    second = explore()
    second_transition_digest = transition_digest(second)
    require(
        first_fingerprint == semantic_fingerprint(second, second_transition_digest),
        "deterministic_byte_output",
        "two deterministic BFS runs produced different bytes",
    )
    first.checks["deterministic_byte_output"] += 1

    outcome_counts = Counter(
        event.outcome for _source, event, _destination in first.transitions
    )
    report = {
        "bounds": {
            "abstract_total_supply": TOTAL_SUPPLY,
            "bfs_depth": MAX_BFS_DEPTH,
            "capacity_records": CAPACITY,
            "filler_transfers": len(FILLERS),
            "max_ack_losses_per_writer": MAX_ACK_LOSSES_PER_WRITER,
            "max_failure_events_per_writer": MAX_FAILURES_PER_WRITER,
            "max_retries_per_writer": MAX_RETRIES_PER_WRITER,
            "sibling_transfers": len(SIBLINGS),
            "writers": 2,
        },
        "claims": [
            "Deterministic exhaustive BFS covers the declared finite abstract state and transition bounds.",
            "Within those bounds, recovery is an exact old prefix or one complete new prefix, never a hybrid.",
            "Within those bounds, acknowledgement, retry, sibling-conflict, capacity, and external-anchor classifications satisfy the listed invariants.",
            "For events declared by the environment to be corruption rejections, the model checks only that the declared rejection leaves abstract state unchanged.",
        ],
        "counts": {
            "invariant_checks": sum(first.checks.values()),
            "max_depth_reached": first.max_depth,
            "outcomes": dict(sorted(outcome_counts.items())),
            "states": len(first.states),
            "transitions": len(first.transitions),
        },
        "coverage": dict(sorted(first.coverage.items())),
        "disposition": "DEMONSTRATED_BOUNDED_CRASH_LIFECYCLE_CONSISTENCY",
        "invariants": [
            {
                "checks": first.checks[invariant],
                "invariant": invariant,
                "status": "PASS",
            }
            for invariant in INVARIANT_IDS
        ],
        "non_claims": [
            "No claim of unbounded formal verification or equivalence to a concrete implementation.",
            "No claim about physical power loss, filesystems, SQLite, hardware, networking, or production operation.",
            "No corrupt bytes or corrupt durable states are represented; corruption detection, parsing, validation, and repair are not tested.",
            "No claim of money, economic value, backing, redemption, safe custody, consensus, global finality, or security.",
            "No claim that an external anchor exists, is fresh, selects a fork, or confirms any suffix after its sequence.",
        ],
        "schema": REPORT_SCHEMA,
        "status": "PASS",
        "status_authority": STATUS_AUTHORITY,
        "transition_digest": first_transition_digest,
        "transition_digest_algorithm": "SHA256_LENGTH_PREFIXED_CANONICAL_JSON_BOUNDED_BFS_GRAPH",
    }
    return report


def run_self_test() -> tuple[dict[str, Any], bool]:
    mutants = (
        "ACK_BEFORE_COMMIT",
        "PRECOMMIT_PERSISTS",
        "DUPLICATE_RETRY_APPEND",
        "BOTH_SIBLINGS_COMMIT",
        "MALFORMED_ANCHOR_PASS",
    )
    results = []
    all_killed = True
    for mutant in mutants:
        try:
            explore(Semantics(mutant))
        except ModelViolation as error:
            results.append(
                {
                    "killed": "TRUE",
                    "killed_by_invariant": error.invariant,
                    "mutant": mutant,
                }
            )
        else:
            all_killed = False
            results.append(
                {
                    "killed": "FALSE",
                    "killed_by_invariant": "",
                    "mutant": mutant,
                }
            )

    report = {
        "killed": sum(result["killed"] == "TRUE" for result in results),
        "mutants": results,
        "schema": SELF_TEST_SCHEMA,
        "status": "PASS" if all_killed else "FAIL",
        "status_authority": STATUS_AUTHORITY,
        "survived": sum(result["killed"] == "FALSE" for result in results),
    }
    return report, all_killed


def main(argv: Iterable[str]) -> int:
    arguments = list(argv)
    if arguments == ["--self-test"]:
        report, passed = run_self_test()
        sys.stdout.buffer.write(canonical_line(report))
        return 0 if passed else 1
    if arguments:
        sys.stderr.write("MODEL_ERROR:USAGE\n")
        return 2
    try:
        report = build_report()
    except ModelViolation as error:
        sys.stderr.write(f"MODEL_ERROR:{error.invariant.upper()}\n")
        return 1
    sys.stdout.buffer.write(canonical_line(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
