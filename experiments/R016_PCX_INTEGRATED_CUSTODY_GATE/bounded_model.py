#!/usr/bin/env python3
"""Standalone bounded model for the R016 integrated custody profile.

The model is deliberately independent of the implementation, persistence
layer, signature libraries, and operating system.  It exhausts a declared
finite state space in which one controller, one conserved output, and one
combined predecessor root are shared by transfers and custody lifecycle
events.  Public checkpoint classifications are modeled as observations; they
never restore secret material or select a fork.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import sys
from typing import Any, Iterable


SCHEMA = "nexus.r016-bounded-custody-model/v0"
SELF_TEST_SCHEMA = "nexus.r016-bounded-custody-model-self-test/v0"
STATUS_AUTHORITY = "NONE"

CONTROLLER = "C0"
GENESIS_KEY = "P0"
CANDIDATE_KEYS = ("P1", "P2")
GUARDIANS = ("G1", "G2", "G3")
THRESHOLD = 2
GENESIS_UTXO = "U0"
SUPPLY = 1000
MAX_ACCEPTED_DEPTH = 4
ZERO_HEAD = "0" * 64
FAKE_STALE_ROOT = "a" * 64
FAKE_CONFLICT_ROOT = "c" * 64
FAKE_UNANCHORED_ROOT = "e" * 64

LIFECYCLE_KINDS = frozenset({"ROTATE", "RECOVER", "REVOKE"})


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("ascii")


def canonical_line(value: Any) -> bytes:
    return canonical_bytes(value) + b"\n"


def digest(label: str, value: Any) -> str:
    framed = label.encode("ascii") + b"\x00" + canonical_bytes(value)
    return hashlib.sha256(framed).hexdigest()


@dataclass(frozen=True)
class Event:
    kind: str
    event_id: str
    envelope_id: str
    predecessor: str
    variant: str
    auth_key: str = ""
    guardians: tuple[str, ...] = ()
    new_key: str = ""
    new_key_proof: bool = False
    input_id: str = ""


@dataclass(frozen=True)
class Record:
    event: Event
    before_root: str
    after_root: str
    before_status: str
    after_status: str
    before_epoch: int
    after_epoch: int
    before_key: str
    after_key: str
    before_retired: tuple[str, ...]
    after_retired: tuple[str, ...]
    before_utxo: str
    after_utxo: str
    before_supply: int
    after_supply: int


@dataclass(frozen=True)
class State:
    height: int
    head: str
    status: str
    epoch: int
    current_key: str
    retired: tuple[str, ...]
    utxo_id: str
    supply: int
    history: tuple[Record, ...]


@dataclass(frozen=True)
class Semantics:
    stale_root_acceptance: bool = False
    duplicate_guardian_counts_twice: bool = False
    one_guardian_recovery: bool = False
    missing_new_key_proof: bool = False
    retired_key_reactivation: bool = False
    locked_transfer: bool = False
    lifecycle_supply_mutation: bool = False
    silent_conflict_rebase: bool = False
    stale_backup_activation: bool = False
    tip_key_historical_validation: bool = False


@dataclass(frozen=True)
class Decision:
    result: str
    reason: str
    source: State
    destination: State
    event: Event
    signed_predecessor: str
    applied_predecessor: str


@dataclass(frozen=True)
class BackupProbe:
    checkpoint_height: int
    checkpoint_root: str
    caller_anchor: str


@dataclass
class Exploration:
    states: set[State]
    transitions: list[dict[str, str]]
    coverage: dict[str, int]
    checker: "Checker"
    accepted: int = 0
    rejected: int = 0
    replayed: int = 0
    race_order_checks: int = 0


class ModelViolation(Exception):
    def __init__(self, invariant: str, detail: str) -> None:
        self.invariant = invariant
        self.detail = detail
        super().__init__(f"{invariant}: {detail}")


class Checker:
    def __init__(self) -> None:
        self.count = 0

    def require(self, condition: bool, invariant: str, detail: str) -> None:
        self.count += 1
        if not condition:
            raise ModelViolation(invariant, detail)


def initial_state() -> State:
    return State(
        height=0,
        head=ZERO_HEAD,
        status="ACTIVE",
        epoch=0,
        current_key=GENESIS_KEY,
        retired=(),
        utxo_id=GENESIS_UTXO,
        supply=SUPPLY,
        history=(),
    )


def state_subject(state: State) -> dict[str, Any]:
    return {
        "controller": {
            "controller_id": CONTROLLER,
            "current_key": state.current_key,
            "epoch": str(state.epoch),
            "guardians": list(GUARDIANS),
            "recovery_threshold": str(THRESHOLD),
            "retired_keys": list(state.retired),
            "status": state.status,
        },
        "height": str(state.height),
        "last_event_id": state.head,
        "supply": str(state.supply),
        "utxos": [
            {
                "amount": str(state.supply),
                "controller_id": CONTROLLER,
                "utxo_id": state.utxo_id,
            }
        ],
    }


def state_root(state: State) -> str:
    return digest("NEXUS/R016/ABSTRACT-COMBINED-STATE/v0", state_subject(state))


def event_subject(
    *,
    kind: str,
    predecessor: str,
    variant: str,
    auth_key: str,
    guardians: tuple[str, ...],
    new_key: str,
    new_key_proof: bool,
    input_id: str,
) -> dict[str, Any]:
    return {
        "auth_key": auth_key,
        "controller_id": CONTROLLER,
        "guardians": list(guardians),
        "input_id": input_id,
        "kind": kind,
        "new_key": new_key,
        "new_key_proof": "TRUE" if new_key_proof else "FALSE",
        "predecessor": predecessor,
        "variant": variant,
    }


def make_event(
    kind: str,
    predecessor: str,
    variant: str,
    *,
    auth_key: str = "",
    guardians: tuple[str, ...] = (),
    new_key: str = "",
    new_key_proof: bool = False,
    input_id: str = "",
    envelope_variant: str = "PRIMARY",
) -> Event:
    subject = event_subject(
        kind=kind,
        predecessor=predecessor,
        variant=variant,
        auth_key=auth_key,
        guardians=guardians,
        new_key=new_key,
        new_key_proof=new_key_proof,
        input_id=input_id,
    )
    event_id = digest("NEXUS/R016/ABSTRACT-EVENT/v0", subject)
    envelope_id = digest(
        "NEXUS/R016/ABSTRACT-ENVELOPE/v0",
        {
            "event_id": event_id,
            "proof_set": subject,
            "variant": envelope_variant,
        },
    )
    return Event(
        kind=kind,
        event_id=event_id,
        envelope_id=envelope_id,
        predecessor=predecessor,
        variant=variant,
        auth_key=auth_key,
        guardians=guardians,
        new_key=new_key,
        new_key_proof=new_key_proof,
        input_id=input_id,
    )


def accepted_envelopes(state: State) -> dict[str, str]:
    return {
        record.event.event_id: record.event.envelope_id
        for record in state.history
    }


def used_keys(state: State) -> set[str]:
    return {GENESIS_KEY, *GUARDIANS, state.current_key, *state.retired} - {""}


def known_roots(state: State) -> tuple[str, ...]:
    if not state.history:
        return (state_root(state),)
    return (state.history[0].before_root,) + tuple(
        record.after_root for record in state.history
    )


def previous_root(state: State) -> str:
    if state.history:
        return state.history[-1].before_root
    return FAKE_STALE_ROOT


def _rejected(state: State, event: Event, reason: str) -> Decision:
    return Decision(
        result="REJECTED",
        reason=reason,
        source=state,
        destination=state,
        event=event,
        signed_predecessor=event.predecessor,
        applied_predecessor="",
    )


def _replayed(state: State, event: Event) -> Decision:
    return Decision(
        result="EXACT_REPLAY",
        reason="EXACT_REPLAY",
        source=state,
        destination=state,
        event=event,
        signed_predecessor=event.predecessor,
        applied_predecessor=event.predecessor,
    )


def apply_event(state: State, event: Event, semantics: Semantics) -> Decision:
    existing = accepted_envelopes(state).get(event.event_id)
    if existing is not None:
        if existing == event.envelope_id:
            return _replayed(state, event)
        return _rejected(state, event, "EVENT_ID_COLLISION")

    live_root = state_root(state)
    applied_predecessor = event.predecessor
    if event.predecessor != live_root:
        if semantics.silent_conflict_rebase:
            applied_predecessor = live_root
        elif not semantics.stale_root_acceptance:
            return _rejected(state, event, "STALE_ROOT")

    if state.status != "ACTIVE":
        if not (semantics.locked_transfer and event.kind == "TRANSFER"):
            return _rejected(state, event, "CONTROLLER_LOCKED")

    next_status = state.status
    next_epoch = state.epoch
    next_key = state.current_key
    next_retired = state.retired
    next_utxo = state.utxo_id
    next_supply = state.supply

    if event.kind == "TRANSFER":
        if event.input_id != state.utxo_id:
            return _rejected(state, event, "INPUT_NOT_CURRENT")
        expected_key = state.current_key
        if state.status != "ACTIVE" and semantics.locked_transfer:
            expected_key = state.retired[-1] if state.retired else GENESIS_KEY
        if event.auth_key != expected_key:
            return _rejected(state, event, "KEY_NOT_ACTIVE")
        next_utxo = "U-" + event.event_id[:20]
    elif event.kind in {"ROTATE", "RECOVER"}:
        if event.kind == "ROTATE":
            if event.auth_key != state.current_key:
                return _rejected(state, event, "KEY_NOT_ACTIVE")
            if len(event.guardians) != 1 or event.guardians[0] not in GUARDIANS:
                return _rejected(state, event, "ROTATE_GUARDIAN_INVALID")
        else:
            guardians_in_policy = all(key in GUARDIANS for key in event.guardians)
            if not guardians_in_policy:
                return _rejected(state, event, "RECOVERY_GUARDIAN_INVALID")
            if semantics.duplicate_guardian_counts_twice:
                quorum = len(event.guardians) >= THRESHOLD
            elif semantics.one_guardian_recovery:
                quorum = len(set(event.guardians)) >= 1
            else:
                quorum = (
                    len(event.guardians) == THRESHOLD
                    and len(set(event.guardians)) == THRESHOLD
                )
            if not quorum:
                return _rejected(state, event, "RECOVERY_QUORUM_MISSING")
        if not event.new_key_proof and not semantics.missing_new_key_proof:
            return _rejected(state, event, "NEW_KEY_PROOF_MISSING")
        fresh = event.new_key not in used_keys(state)
        if not fresh:
            allow_retired = (
                semantics.retired_key_reactivation
                and event.new_key in state.retired
            )
            if not allow_retired:
                return _rejected(state, event, "KEY_NOT_FRESH")
        if event.new_key not in CANDIDATE_KEYS and event.new_key not in state.retired:
            return _rejected(state, event, "NEW_KEY_OUTSIDE_BOUND")
        next_retired = tuple(sorted((*state.retired, state.current_key)))
        next_key = event.new_key
        next_epoch += 1
    elif event.kind == "REVOKE":
        if (
            len(event.guardians) != THRESHOLD
            or len(set(event.guardians)) != THRESHOLD
            or not all(key in GUARDIANS for key in event.guardians)
        ):
            return _rejected(state, event, "REVOKE_QUORUM_MISSING")
        next_retired = tuple(sorted((*state.retired, state.current_key)))
        next_key = ""
        next_status = "LOCKED"
        next_epoch += 1
    else:
        return _rejected(state, event, "KIND_INVALID")

    if semantics.lifecycle_supply_mutation and event.kind in LIFECYCLE_KINDS:
        next_supply += 1

    provisional = State(
        height=state.height + 1,
        head=event.event_id,
        status=next_status,
        epoch=next_epoch,
        current_key=next_key,
        retired=next_retired,
        utxo_id=next_utxo,
        supply=next_supply,
        history=state.history,
    )
    after_root = state_root(provisional)
    record = Record(
        event=event,
        before_root=live_root,
        after_root=after_root,
        before_status=state.status,
        after_status=next_status,
        before_epoch=state.epoch,
        after_epoch=next_epoch,
        before_key=state.current_key,
        after_key=next_key,
        before_retired=state.retired,
        after_retired=next_retired,
        before_utxo=state.utxo_id,
        after_utxo=next_utxo,
        before_supply=state.supply,
        after_supply=next_supply,
    )
    destination = State(
        height=provisional.height,
        head=provisional.head,
        status=provisional.status,
        epoch=provisional.epoch,
        current_key=provisional.current_key,
        retired=provisional.retired,
        utxo_id=provisional.utxo_id,
        supply=provisional.supply,
        history=state.history + (record,),
    )
    return Decision(
        result="APPLIED",
        reason=f"{event.kind}_APPLIED",
        source=state,
        destination=destination,
        event=event,
        signed_predecessor=event.predecessor,
        applied_predecessor=applied_predecessor,
    )


def validate_state(state: State, semantics: Semantics, checker: Checker) -> None:
    checker.require(state.supply == SUPPLY, "SUPPLY_CONSERVED", "supply changed")
    checker.require(
        state.status in {"ACTIVE", "LOCKED"},
        "CONTROLLER_STATUS",
        "unknown controller status",
    )
    checker.require(
        (state.status == "ACTIVE" and bool(state.current_key))
        or (state.status == "LOCKED" and not state.current_key),
        "ONE_ACTIVE_KEY_OR_LOCKED",
        "status and active key disagree",
    )
    checker.require(
        tuple(sorted(set(state.retired))) == state.retired,
        "MONOTONIC_RETIREMENT",
        "retired keys are duplicated or unsorted",
    )
    checker.require(
        not state.current_key or state.current_key not in state.retired,
        "NO_RETIRED_KEY_REACTIVATION",
        "a retired key is active again",
    )
    checker.require(
        not set(GUARDIANS).intersection({state.current_key, *state.retired}),
        "GLOBAL_KEY_ROLE_UNIQUENESS",
        "a guardian entered an active-key role",
    )
    checker.require(
        state.height == len(state.history),
        "HEIGHT_MATCHES_HISTORY",
        "height does not equal accepted-record count",
    )
    checker.require(
        state.head == (state.history[-1].event.event_id if state.history else ZERO_HEAD),
        "HEAD_MATCHES_HISTORY",
        "last event head is not exact",
    )
    lifecycle_count = sum(
        1 for record in state.history if record.event.kind in LIFECYCLE_KINDS
    )
    checker.require(
        state.epoch == lifecycle_count,
        "EPOCH_MATCHES_LIFECYCLE",
        "epoch did not advance exactly once per lifecycle event",
    )
    prior_root = state.history[0].before_root if state.history else state_root(state)
    for record in state.history:
        checker.require(
            record.before_root == prior_root,
            "HISTORY_ROOT_CHAIN",
            "history root chain is discontinuous",
        )
        checker.require(
            record.event.predecessor == record.before_root,
            "HISTORICAL_EXACT_PREDECESSOR",
            "accepted history contains a stale signed predecessor",
        )
        if record.event.kind == "TRANSFER":
            expected = state.current_key if semantics.tip_key_historical_validation else record.before_key
            checker.require(
                record.event.auth_key == expected,
                "HISTORICAL_PREFIX_KEY",
                "historical transfer was not checked with its prefix key",
            )
        prior_root = record.after_root
    if state.history:
        checker.require(
            state.history[-1].after_root == state_root(state),
            "TIP_ROOT_MATCHES_HISTORY",
            "tip root differs from final historical root",
        )


def validate_decision(decision: Decision, semantics: Semantics, checker: Checker) -> None:
    source = decision.source
    destination = decision.destination
    event = decision.event
    if decision.result == "APPLIED":
        checker.require(
            decision.signed_predecessor == state_root(source),
            "EXACT_PREDECESSOR",
            "a stale signed predecessor was accepted",
        )
        checker.require(
            decision.applied_predecessor == decision.signed_predecessor,
            "NO_SILENT_REBASE",
            "a signed stale event was silently rebased",
        )
        checker.require(
            source.status == "ACTIVE",
            "LOCKED_CONTROLLER_TERMINAL",
            "a locked controller accepted another event",
        )
        checker.require(
            destination.height == source.height + 1,
            "ONE_EVENT_ONE_HEIGHT",
            "accepted event did not advance height exactly once",
        )
        checker.require(
            destination.head == event.event_id,
            "EVENT_HEAD_BOUND",
            "next state does not bind the accepted event",
        )
        if event.kind == "TRANSFER":
            checker.require(
                event.auth_key == source.current_key,
                "TRANSFER_CURRENT_KEY",
                "transfer was not authorized by the current key",
            )
            checker.require(
                destination.supply == source.supply,
                "TRANSFER_CONSERVES_SUPPLY",
                "transfer changed supply",
            )
            checker.require(
                (
                    destination.status,
                    destination.epoch,
                    destination.current_key,
                    destination.retired,
                )
                == (
                    source.status,
                    source.epoch,
                    source.current_key,
                    source.retired,
                ),
                "TRANSFER_PRESERVES_CONTROLLER",
                "transfer changed controller lifecycle state",
            )
        else:
            checker.require(
                destination.utxo_id == source.utxo_id,
                "LIFECYCLE_PRESERVES_UTXO",
                "lifecycle event changed the conserved output",
            )
            checker.require(
                destination.supply == source.supply,
                "LIFECYCLE_PRESERVES_SUPPLY",
                "lifecycle event changed supply",
            )
            if event.kind == "ROTATE":
                checker.require(
                    event.auth_key == source.current_key
                    and len(event.guardians) == 1
                    and event.guardians[0] in GUARDIANS,
                    "ROTATE_DUAL_CONTROL",
                    "rotation lacks active-plus-guardian authorization",
                )
            if event.kind == "RECOVER":
                checker.require(
                    len(event.guardians) == THRESHOLD
                    and len(set(event.guardians)) == THRESHOLD
                    and all(key in GUARDIANS for key in event.guardians),
                    "RECOVERY_TWO_DISTINCT_GUARDIANS",
                    "recovery lacks two distinct fixed guardians",
                )
            if event.kind in {"ROTATE", "RECOVER"}:
                checker.require(
                    event.new_key_proof,
                    "NEW_KEY_PROOF_REQUIRED",
                    "replacement key lacks proof of possession",
                )
                checker.require(
                    event.new_key not in used_keys(source),
                    "GLOBAL_FRESH_KEY",
                    "replacement key has appeared before",
                )
                checker.require(
                    source.current_key in destination.retired
                    and destination.current_key == event.new_key,
                    "ATOMIC_KEY_REPLACEMENT",
                    "old retirement and new activation are not atomic",
                )
            if event.kind == "REVOKE":
                checker.require(
                    len(event.guardians) == THRESHOLD
                    and len(set(event.guardians)) == THRESHOLD,
                    "REVOKE_TWO_DISTINCT_GUARDIANS",
                    "revocation lacks two guardians",
                )
                checker.require(
                    destination.status == "LOCKED"
                    and destination.current_key == ""
                    and source.current_key in destination.retired,
                    "ATOMIC_TERMINAL_REVOKE",
                    "revocation did not atomically lock and retire",
                )
    else:
        checker.require(
            destination == source,
            "REJECTION_AND_RETRY_NOOP",
            "a rejection or retry mutated state",
        )
        if decision.result == "EXACT_REPLAY":
            checker.require(
                accepted_envelopes(source).get(event.event_id) == event.envelope_id,
                "EXACT_REPLAY_BYTES",
                "retry did not match an exact accepted envelope",
            )
    validate_state(destination, semantics, checker)


def fresh_candidates(state: State) -> tuple[str, ...]:
    used = used_keys(state)
    return tuple(key for key in CANDIDATE_KEYS if key not in used)


def valid_events(state: State) -> tuple[Event, ...]:
    if state.status != "ACTIVE":
        return ()
    root = state_root(state)
    events: list[Event] = [
        make_event(
            "TRANSFER",
            root,
            variant,
            auth_key=state.current_key,
            input_id=state.utxo_id,
        )
        for variant in ("SIBLING-A", "SIBLING-B")
    ]
    candidates = fresh_candidates(state)
    for index, key in enumerate(candidates):
        events.append(
            make_event(
                "ROTATE",
                root,
                f"ROTATE-{key}",
                auth_key=state.current_key,
                guardians=(GUARDIANS[index % len(GUARDIANS)],),
                new_key=key,
                new_key_proof=True,
            )
        )
        pair = (GUARDIANS[index % 2], GUARDIANS[(index % 2) + 1])
        events.append(
            make_event(
                "RECOVER",
                root,
                f"RECOVER-{key}",
                guardians=pair,
                new_key=key,
                new_key_proof=True,
            )
        )
    events.append(
        make_event(
            "REVOKE",
            root,
            "REVOKE",
            guardians=(GUARDIANS[0], GUARDIANS[1]),
        )
    )
    return tuple(sorted(events, key=event_sort_key))


def hostile_events(state: State) -> tuple[Event, ...]:
    root = state_root(state)
    stale = previous_root(state)
    if stale == root:
        stale = FAKE_STALE_ROOT
    auth_key = state.current_key or (state.retired[-1] if state.retired else GENESIS_KEY)
    candidates = fresh_candidates(state)
    candidate = candidates[0] if candidates else CANDIDATE_KEYS[0]
    events = [
        make_event(
            "TRANSFER",
            stale,
            "STALE-SIGNED-TRANSFER",
            auth_key=auth_key,
            input_id=state.utxo_id,
        ),
        make_event(
            "TRANSFER",
            root,
            "WRONG-ACTIVE-KEY",
            auth_key=(CANDIDATE_KEYS[-1] if auth_key != CANDIDATE_KEYS[-1] else GENESIS_KEY),
            input_id=state.utxo_id,
        ),
        make_event(
            "RECOVER",
            root,
            "DUPLICATE-GUARDIAN",
            guardians=(GUARDIANS[0], GUARDIANS[0]),
            new_key=candidate,
            new_key_proof=True,
        ),
        make_event(
            "RECOVER",
            root,
            "ONE-GUARDIAN",
            guardians=(GUARDIANS[0],),
            new_key=candidate,
            new_key_proof=True,
        ),
        make_event(
            "RECOVER",
            root,
            "MISSING-NEW-KEY-PROOF",
            guardians=(GUARDIANS[0], GUARDIANS[1]),
            new_key=candidate,
            new_key_proof=False,
        ),
    ]
    if state.retired:
        events.append(
            make_event(
                "RECOVER",
                root,
                "REACTIVATE-RETIRED",
                guardians=(GUARDIANS[0], GUARDIANS[1]),
                new_key=state.retired[0],
                new_key_proof=True,
            )
        )
    if state.status == "LOCKED":
        events.append(
            make_event(
                "TRANSFER",
                root,
                "LOCKED-TRANSFER",
                auth_key=auth_key,
                input_id=state.utxo_id,
            )
        )
    return tuple(sorted(events, key=event_sort_key))


def all_events(state: State, *, include_valid: bool = True) -> tuple[Event, ...]:
    events = list(valid_events(state)) if include_valid else []
    events += list(hostile_events(state))
    if state.history:
        events.append(state.history[-1].event)
        original = state.history[-1].event
        events.append(
            Event(
                kind=original.kind,
                event_id=original.event_id,
                envelope_id=digest(
                    "NEXUS/R016/ABSTRACT-ENVELOPE-COLLISION/v0",
                    {"event_id": original.event_id},
                ),
                predecessor=original.predecessor,
                variant=original.variant + "-ALTERED-ENVELOPE",
                auth_key=original.auth_key,
                guardians=original.guardians,
                new_key=original.new_key,
                new_key_proof=original.new_key_proof,
                input_id=original.input_id,
            )
        )
    unique = {(event.event_id, event.envelope_id): event for event in events}
    return tuple(sorted(unique.values(), key=event_sort_key))


def event_sort_key(event: Event) -> tuple[Any, ...]:
    return (
        event.kind,
        event.variant,
        event.predecessor,
        event.auth_key,
        event.guardians,
        event.new_key,
        event.new_key_proof,
        event.input_id,
        event.event_id,
        event.envelope_id,
    )


def state_sort_key(state: State) -> bytes:
    return canonical_bytes(
        {
            "history": [record.event.event_id for record in state.history],
            "root": state_root(state),
        }
    )


def classify_backup(
    state: State,
    probe: BackupProbe,
    semantics: Semantics,
) -> str:
    roots = known_roots(state)
    current = state_root(state)
    if probe.checkpoint_height > state.height:
        return "AHEAD"
    if probe.caller_anchor != current:
        if probe.caller_anchor in roots:
            classification = "STALE"
        else:
            classification = "UNANCHORED"
    elif probe.checkpoint_root != probe.caller_anchor:
        if probe.checkpoint_root in roots or probe.checkpoint_height < state.height:
            classification = "STALE"
        elif probe.checkpoint_height == state.height:
            classification = "CONFLICTING"
        else:
            classification = "UNANCHORED"
    elif probe.checkpoint_height != state.height:
        classification = "CONFLICTING"
    else:
        classification = "RESTORABLE"
    if semantics.stale_backup_activation and classification == "STALE":
        return "RESTORABLE"
    return classification


def exercise_backups(
    state: State,
    semantics: Semantics,
    checker: Checker,
    coverage: dict[str, int],
) -> None:
    current = state_root(state)
    probes = [
        ("RESTORABLE", BackupProbe(state.height, current, current)),
        ("CONFLICTING", BackupProbe(state.height, FAKE_CONFLICT_ROOT, current)),
        ("AHEAD", BackupProbe(state.height + 1, FAKE_CONFLICT_ROOT, current)),
        ("UNANCHORED", BackupProbe(state.height, current, FAKE_UNANCHORED_ROOT)),
    ]
    if state.height:
        probes.append(("STALE", BackupProbe(0, known_roots(state)[0], current)))
    for expected, probe in probes:
        actual = classify_backup(state, probe, semantics)
        checker.require(
            actual == expected,
            "STALE_BACKUP_NON_RESTORABLE",
            f"expected {expected}, got {actual}",
        )
        coverage[f"BACKUP_{expected}"] += 1


COVERAGE_CLASSES = (
    "APPLY_RECOVER",
    "APPLY_REVOKE",
    "APPLY_ROTATE",
    "APPLY_TRANSFER",
    "BACKUP_AHEAD",
    "BACKUP_CONFLICTING",
    "BACKUP_RESTORABLE",
    "BACKUP_STALE",
    "BACKUP_UNANCHORED",
    "EVENT_ID_COLLISION_REJECTED",
    "EXACT_REPLAY_NOOP",
    "HISTORICAL_PREFIX_KEY",
    "LOCKED_TRANSFER_REJECTED",
    "MISSING_NEW_KEY_PROOF_REJECTED",
    "ONE_GUARDIAN_RECOVERY_REJECTED",
    "RACE_RECOVER_RECOVER_BOTH_ORDERS",
    "RACE_ROTATE_RECOVER_BOTH_ORDERS",
    "RACE_TRANSFER_RECOVER_BOTH_ORDERS",
    "RACE_TRANSFER_REVOKE_BOTH_ORDERS",
    "RACE_TRANSFER_ROTATE_BOTH_ORDERS",
    "RACE_TRANSFER_TRANSFER_BOTH_ORDERS",
    "RETIRED_KEY_REACTIVATION_REJECTED",
    "STALE_ROOT_REJECTED",
    "TWO_DISTINCT_GUARDIANS_ENFORCED",
    "WRONG_ACTIVE_KEY_REJECTED",
)


def empty_coverage() -> dict[str, int]:
    return {name: 0 for name in COVERAGE_CLASSES}


def update_transition_coverage(decision: Decision, coverage: dict[str, int]) -> None:
    if decision.result == "APPLIED":
        coverage[f"APPLY_{decision.event.kind}"] += 1
        if decision.event.kind == "RECOVER":
            coverage["TWO_DISTINCT_GUARDIANS_ENFORCED"] += 1
    elif decision.result == "EXACT_REPLAY":
        coverage["EXACT_REPLAY_NOOP"] += 1
    elif decision.reason == "STALE_ROOT":
        coverage["STALE_ROOT_REJECTED"] += 1
    elif decision.reason == "KEY_NOT_ACTIVE":
        coverage["WRONG_ACTIVE_KEY_REJECTED"] += 1
    elif decision.reason == "RECOVERY_QUORUM_MISSING":
        if decision.event.variant == "ONE-GUARDIAN":
            coverage["ONE_GUARDIAN_RECOVERY_REJECTED"] += 1
        else:
            coverage["TWO_DISTINCT_GUARDIANS_ENFORCED"] += 1
    elif decision.reason == "NEW_KEY_PROOF_MISSING":
        coverage["MISSING_NEW_KEY_PROOF_REJECTED"] += 1
    elif decision.reason == "KEY_NOT_FRESH" and decision.event.variant == "REACTIVATE-RETIRED":
        coverage["RETIRED_KEY_REACTIVATION_REJECTED"] += 1
    elif decision.reason == "CONTROLLER_LOCKED" and decision.event.kind == "TRANSFER":
        coverage["LOCKED_TRANSFER_REJECTED"] += 1
    elif decision.reason == "EVENT_ID_COLLISION":
        coverage["EVENT_ID_COLLISION_REJECTED"] += 1


def transition_descriptor(decision: Decision) -> dict[str, str]:
    return {
        "destination_root": state_root(decision.destination),
        "event_id": decision.event.event_id,
        "kind": decision.event.kind,
        "reason": decision.reason,
        "result": decision.result,
        "source_root": state_root(decision.source),
        "variant": decision.event.variant,
    }


def valid_event_by_kind(state: State, kind: str, ordinal: int = 0) -> Event:
    events = [event for event in valid_events(state) if event.kind == kind]
    if ordinal >= len(events):
        raise ModelViolation("RACE_BOUND", f"no {kind} event at ordinal {ordinal}")
    return events[ordinal]


RACE_SPECS = (
    ("TRANSFER_TRANSFER", ("TRANSFER", 0), ("TRANSFER", 1)),
    ("TRANSFER_ROTATE", ("TRANSFER", 0), ("ROTATE", 0)),
    ("TRANSFER_RECOVER", ("TRANSFER", 0), ("RECOVER", 0)),
    ("TRANSFER_REVOKE", ("TRANSFER", 0), ("REVOKE", 0)),
    ("ROTATE_RECOVER", ("ROTATE", 0), ("RECOVER", 1)),
    ("RECOVER_RECOVER", ("RECOVER", 0), ("RECOVER", 1)),
)


def exercise_races(
    state: State,
    semantics: Semantics,
    exploration: Exploration,
) -> None:
    for name, left_spec, right_spec in RACE_SPECS:
        left = valid_event_by_kind(state, *left_spec)
        right = valid_event_by_kind(state, *right_spec)
        for first, second in ((left, right), (right, left)):
            first_decision = apply_event(state, first, semantics)
            validate_decision(first_decision, semantics, exploration.checker)
            exploration.checker.require(
                first_decision.result == "APPLIED",
                "RACE_FIRST_EVENT_APPLIES",
                f"first {name} event did not apply",
            )
            second_decision = apply_event(first_decision.destination, second, semantics)
            validate_decision(second_decision, semantics, exploration.checker)
            exploration.checker.require(
                second_decision.result == "REJECTED"
                and second_decision.reason == "STALE_ROOT",
                "ONE_ROOT_ONE_SIBLING",
                f"both {name} siblings advanced one history",
            )
            exploration.race_order_checks += 1
        exploration.coverage[f"RACE_{name}_BOTH_ORDERS"] += 2


def explore(semantics: Semantics = Semantics()) -> Exploration:
    checker = Checker()
    coverage = empty_coverage()
    origin = initial_state()
    validate_state(origin, semantics, checker)
    states: set[State] = {origin}
    frontier: list[State] = [origin]
    transitions: list[dict[str, str]] = []
    exploration = Exploration(states, transitions, coverage, checker)

    for _depth in range(MAX_ACCEPTED_DEPTH + 1):
        next_frontier: set[State] = set()
        for state in sorted(frontier, key=state_sort_key):
            validate_state(state, semantics, checker)
            exercise_backups(state, semantics, checker, coverage)
            if any(
                record.event.kind == "TRANSFER"
                and any(
                    later.event.kind in {"ROTATE", "RECOVER", "REVOKE"}
                    for later in state.history[index + 1 :]
                )
                for index, record in enumerate(state.history)
            ):
                coverage["HISTORICAL_PREFIX_KEY"] += 1
            for event in all_events(
                state, include_valid=state.height < MAX_ACCEPTED_DEPTH
            ):
                decision = apply_event(state, event, semantics)
                validate_decision(decision, semantics, checker)
                transitions.append(transition_descriptor(decision))
                update_transition_coverage(decision, coverage)
                if decision.result == "APPLIED":
                    exploration.accepted += 1
                    if decision.destination.height <= MAX_ACCEPTED_DEPTH:
                        if decision.destination not in states:
                            states.add(decision.destination)
                            next_frontier.add(decision.destination)
                elif decision.result == "EXACT_REPLAY":
                    exploration.replayed += 1
                else:
                    exploration.rejected += 1
        frontier = sorted(next_frontier, key=state_sort_key)
        if not frontier:
            break

    exercise_races(origin, semantics, exploration)
    for name, count in sorted(coverage.items()):
        checker.require(count > 0, "COVERAGE_CLASS_NONZERO", f"{name} was not exercised")
    return exploration


def state_descriptor(state: State) -> dict[str, Any]:
    return {
        "event_ids": [record.event.event_id for record in state.history],
        "root": state_root(state),
        "state": state_subject(state),
    }


def graph_digests(exploration: Exploration) -> tuple[str, str, str]:
    state_rows = sorted(
        (canonical_bytes(state_descriptor(state)) for state in exploration.states)
    )
    transition_rows = sorted(
        canonical_bytes(item) for item in exploration.transitions
    )
    state_digest = hashlib.sha256(b"\n".join(state_rows)).hexdigest()
    transition_digest = hashlib.sha256(b"\n".join(transition_rows)).hexdigest()
    graph_digest = hashlib.sha256(
        canonical_bytes(
            {
                "state_digest": state_digest,
                "transition_digest": transition_digest,
                "coverage": {
                    key: str(value)
                    for key, value in sorted(exploration.coverage.items())
                },
            }
        )
    ).hexdigest()
    return state_digest, transition_digest, graph_digest


def build_model_report() -> dict[str, Any]:
    exploration = explore()
    state_digest, transition_digest, graph_digest = graph_digests(exploration)
    return {
        "accepted_transitions": str(exploration.accepted),
        "bound": {
            "accepted_depth": str(MAX_ACCEPTED_DEPTH),
            "candidate_replacement_keys": str(len(CANDIDATE_KEYS)),
            "controllers": "1",
            "guardians": str(len(GUARDIANS)),
            "recovery_threshold": str(THRESHOLD),
            "supply": str(SUPPLY),
            "utxos": "1",
        },
        "claims": [
            "The declared finite state space preserves one synthetic supply under one exact predecessor root.",
            "Within one modeled history, transfer and lifecycle siblings cannot both advance the same predecessor.",
            "Rotation, recovery, revocation, exact retry, historical-prefix authorization, and public checkpoint classifications are exercised.",
        ],
        "coverage": {
            key: str(value) for key, value in sorted(exploration.coverage.items())
        },
        "graph_digest": graph_digest,
        "invariant_checks": str(exploration.checker.count),
        "non_claims": [
            "This abstract model does not execute signatures, parsers, SQLite, filesystem synchronization, process crashes, or physical storage faults.",
            "Public checkpoint classification proves no backup secrecy, key custody, authenticated anchor provenance, rollback event, or fork choice.",
            "The finite model is not network consensus, global finality, production security, money, backing, redemption, or economic value.",
        ],
        "race_order_checks": str(exploration.race_order_checks),
        "rejected_transitions": str(exploration.rejected),
        "replayed_transitions": str(exploration.replayed),
        "schema": SCHEMA,
        "state_count": str(len(exploration.states)),
        "state_digest": state_digest,
        "status": "PASS",
        "status_authority": STATUS_AUTHORITY,
        "transition_count": str(len(exploration.transitions)),
        "transition_digest": transition_digest,
    }


MUTANTS = (
    ("STALE_ROOT_ACCEPTANCE", Semantics(stale_root_acceptance=True)),
    (
        "DUPLICATE_GUARDIAN_COUNTED_TWICE",
        Semantics(duplicate_guardian_counts_twice=True),
    ),
    ("ONE_GUARDIAN_RECOVERY", Semantics(one_guardian_recovery=True)),
    ("MISSING_NEW_KEY_PROOF", Semantics(missing_new_key_proof=True)),
    ("RETIRED_KEY_REACTIVATION", Semantics(retired_key_reactivation=True)),
    ("LOCKED_TRANSFER", Semantics(locked_transfer=True)),
    ("LIFECYCLE_SUPPLY_MUTATION", Semantics(lifecycle_supply_mutation=True)),
    ("SILENT_CONFLICT_REBASE", Semantics(silent_conflict_rebase=True)),
    ("STALE_BACKUP_ACTIVATION", Semantics(stale_backup_activation=True)),
    (
        "TIP_KEY_HISTORICAL_VALIDATION",
        Semantics(tip_key_historical_validation=True),
    ),
)


def build_self_test_report() -> dict[str, Any]:
    results: list[dict[str, str]] = []
    survivors: list[str] = []
    for name, semantics in MUTANTS:
        try:
            explore(semantics)
        except ModelViolation as exc:
            results.append(
                {
                    "detail_sha256": hashlib.sha256(
                        exc.detail.encode("utf-8")
                    ).hexdigest(),
                    "invariant": exc.invariant,
                    "killed": "TRUE",
                    "mutant": name,
                }
            )
        else:
            survivors.append(name)
            results.append(
                {
                    "detail_sha256": "",
                    "invariant": "",
                    "killed": "FALSE",
                    "mutant": name,
                }
            )
    report = {
        "limitations": [
            "Mutants test the abstract semantics only; they do not substitute for implementation, cryptographic, persistence, or external audit campaigns."
        ],
        "mutants_killed": str(len(MUTANTS) - len(survivors)),
        "mutants_required": str(len(MUTANTS)),
        "results": results,
        "schema": SELF_TEST_SCHEMA,
        "status": "PASS" if not survivors else "FAIL",
        "status_authority": STATUS_AUTHORITY,
        "survivors": survivors,
    }
    report["self_test_digest"] = digest(
        "NEXUS/R016/ABSTRACT-MODEL-SELF-TEST/v0", report
    )
    return report


def main(argv: Iterable[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if args in ([], ["--model"]):
        sys.stdout.buffer.write(canonical_line(build_model_report()))
        return 0
    if args == ["--self-test"]:
        report = build_self_test_report()
        sys.stdout.buffer.write(canonical_line(report))
        return 0 if report["status"] == "PASS" else 1
    sys.stderr.write("usage: bounded_model.py [--model|--self-test]\n")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
