"""Exhaustive bounded-state conservation model for the R013 PCX kernel.

This is a deliberately tiny abstract model, not a claim about the full
implementation or a production monetary system.  It exhausts every ordered,
positive, conserved transfer reachable with supply 4, three owners, at most
two inputs, and at most two outputs through depth four.

Outpoint integers model UTXO identity.  A transfer always creates fresh
outpoints, so attempting to replay its consumed selection in the resulting
branch must fail even when the owner/amount shape happens to be unchanged.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from functools import lru_cache
from itertools import combinations, product
from typing import Iterator


SUPPLY = 4
OWNERS = (0, 1, 2)
MAX_INPUTS = 2
MAX_OUTPUTS = 2
MAX_DEPTH = 4


class InvalidTransfer(ValueError):
    """A stable rejection from the abstract transition function."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True, order=True)
class UTXO:
    outpoint: int
    owner: int
    amount: int


@dataclass(frozen=True, order=True)
class State:
    next_outpoint: int
    utxos: tuple[UTXO, ...]


@dataclass(frozen=True, order=True)
class Transfer:
    input_outpoints: tuple[int, ...]
    # Output order is significant because it determines fresh outpoint order.
    outputs: tuple[tuple[int, int], ...]  # (owner, positive amount)


def initial_state() -> State:
    """Return the single fixed abstract genesis state."""

    return State(next_outpoint=1, utxos=(UTXO(0, OWNERS[0], SUPPLY),))


def _assert_valid_state(state: State) -> None:
    if tuple(sorted(state.utxos)) != state.utxos:
        raise AssertionError("UTXOs are not in canonical outpoint order")
    outpoints = [utxo.outpoint for utxo in state.utxos]
    if len(outpoints) != len(set(outpoints)):
        raise AssertionError("duplicate live outpoint")
    if any(utxo.outpoint < 0 or utxo.outpoint >= state.next_outpoint for utxo in state.utxos):
        raise AssertionError("live outpoint is outside the allocated range")
    if any(utxo.owner not in OWNERS for utxo in state.utxos):
        raise AssertionError("owner is outside the bounded model")
    if any(utxo.amount <= 0 for utxo in state.utxos):
        raise AssertionError("non-positive live output")
    if sum(utxo.amount for utxo in state.utxos) != SUPPLY:
        raise AssertionError("abstract supply is not conserved")


def apply_transfer(state: State, transfer: Transfer) -> State:
    """Apply one transfer or reject it with a deterministic reason code."""

    _assert_valid_state(state)
    if not 1 <= len(transfer.input_outpoints) <= MAX_INPUTS:
        raise InvalidTransfer("INPUT_COUNT_INVALID")
    if transfer.input_outpoints != tuple(sorted(set(transfer.input_outpoints))):
        raise InvalidTransfer("INPUT_SELECTION_INVALID")
    if not 1 <= len(transfer.outputs) <= MAX_OUTPUTS:
        raise InvalidTransfer("OUTPUT_COUNT_INVALID")

    live = {utxo.outpoint: utxo for utxo in state.utxos}
    if any(outpoint not in live for outpoint in transfer.input_outpoints):
        raise InvalidTransfer("INPUT_NOT_UNSPENT")

    if any(owner not in OWNERS for owner, _amount in transfer.outputs):
        raise InvalidTransfer("OWNER_INVALID")
    if any(type(amount) is not int or amount <= 0 for _owner, amount in transfer.outputs):
        raise InvalidTransfer("AMOUNT_NOT_POSITIVE")

    input_total = sum(live[outpoint].amount for outpoint in transfer.input_outpoints)
    output_total = sum(amount for _owner, amount in transfer.outputs)
    if input_total != output_total:
        raise InvalidTransfer("CONSERVATION_VIOLATION")

    spent = set(transfer.input_outpoints)
    remaining = [utxo for utxo in state.utxos if utxo.outpoint not in spent]
    created = [
        UTXO(state.next_outpoint + index, owner, amount)
        for index, (owner, amount) in enumerate(transfer.outputs)
    ]
    next_state = State(
        next_outpoint=state.next_outpoint + len(created),
        utxos=tuple(sorted(remaining + created)),
    )
    _assert_valid_state(next_state)
    return next_state


def _positive_compositions(total: int, parts: int) -> Iterator[tuple[int, ...]]:
    if parts == 1:
        yield (total,)
        return
    if parts == 2:
        for first in range(1, total):
            yield (first, total - first)
        return
    raise AssertionError("the bounded model admits only one or two outputs")


def enumerate_transfers(state: State) -> Iterator[Transfer]:
    """Yield every valid transfer from ``state`` in deterministic order."""

    _assert_valid_state(state)
    for input_count in range(1, min(MAX_INPUTS, len(state.utxos)) + 1):
        for selected in combinations(state.utxos, input_count):
            input_total = sum(utxo.amount for utxo in selected)
            input_outpoints = tuple(utxo.outpoint for utxo in selected)
            for output_count in range(1, min(MAX_OUTPUTS, input_total) + 1):
                for amounts in _positive_compositions(input_total, output_count):
                    for owners in product(OWNERS, repeat=output_count):
                        yield Transfer(
                            input_outpoints=input_outpoints,
                            outputs=tuple(zip(owners, amounts)),
                        )


def _state_data(state: State) -> dict[str, object]:
    return {
        "next_outpoint": state.next_outpoint,
        "utxos": [
            [utxo.outpoint, utxo.owner, utxo.amount]
            for utxo in state.utxos
        ],
    }


def _transfer_data(transfer: Transfer) -> dict[str, object]:
    return {
        "inputs": list(transfer.input_outpoints),
        "outputs": [list(output) for output in transfer.outputs],
    }


def _canonical_line(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode("ascii") + b"\n"


def _compute_summary(max_depth: int) -> dict[str, object]:
    """Explore all layer-reachable states and return deterministic report data.

    States are deduplicated within each depth.  If the same state is reachable
    at two different depths, it remains in both layers because the report is a
    bounded path-depth exploration.  Every available transfer from every
    unique state in a layer is nevertheless evaluated exactly once.
    """

    if type(max_depth) is not int or not 0 <= max_depth <= MAX_DEPTH:
        raise ValueError(f"max_depth must be in 0..{MAX_DEPTH}")

    layers: list[set[State]] = [{initial_state()}]
    transition_digest = hashlib.sha256()
    depth_digests: list[str] = []
    transition_count = 0
    replay_attempts = 0
    replay_rejections = 0

    for depth in range(max_depth + 1):
        layer = layers[depth]
        layer_digest = hashlib.sha256()
        for state in sorted(layer):
            _assert_valid_state(state)
            layer_digest.update(_canonical_line(_state_data(state)))
        depth_digests.append(layer_digest.hexdigest())

        if depth == max_depth:
            break

        next_layer: set[State] = set()
        for state in sorted(layer):
            for transfer in enumerate_transfers(state):
                next_state = apply_transfer(state, transfer)
                next_layer.add(next_state)
                transition_count += 1

                transition_digest.update(
                    _canonical_line(
                        {
                            "depth": depth,
                            "source": _state_data(state),
                            "transfer": _transfer_data(transfer),
                            "target": _state_data(next_state),
                        }
                    )
                )

                replay_attempts += 1
                try:
                    apply_transfer(next_state, transfer)
                except InvalidTransfer as exc:
                    if exc.code != "INPUT_NOT_UNSPENT":
                        raise AssertionError(f"unexpected replay rejection: {exc.code}") from exc
                    replay_rejections += 1
                else:
                    raise AssertionError("spent input selection was replayable")

        if not next_layer:
            raise AssertionError("bounded exploration unexpectedly terminated")
        layers.append(next_layer)

    all_states = set().union(*layers)
    summary: dict[str, object] = {
        "schema": "nexus.r013-pcx-small-state-model/v0",
        "parameters": {
            "supply": SUPPLY,
            "owner_count": len(OWNERS),
            "max_inputs": MAX_INPUTS,
            "max_outputs": MAX_OUTPUTS,
            "max_depth": max_depth,
        },
        "states_by_depth": [len(layer) for layer in layers],
        "unique_states_through_depth": len(all_states),
        "valid_transitions_checked": transition_count,
        "replay_attempts": replay_attempts,
        "replay_rejections": replay_rejections,
        "all_live_outputs_positive": True,
        "all_states_conserve_supply": True,
        "all_spent_selection_replays_rejected": replay_attempts == replay_rejections,
        "depth_state_digests": depth_digests,
        "transition_digest": transition_digest.hexdigest(),
        "status_authority": "NONE",
        "claim_scope": "BOUNDED_ABSTRACT_MODEL_ONLY",
    }
    return summary


@lru_cache(maxsize=MAX_DEPTH + 1)
def _cached_report_bytes(max_depth: int) -> bytes:
    return _canonical_line(_compute_summary(max_depth))


def exhaustive_summary(max_depth: int = MAX_DEPTH) -> dict[str, object]:
    """Return fresh deterministic report data for the exhaustive exploration."""

    # Decode the immutable cached report so callers cannot mutate shared state.
    return json.loads(_cached_report_bytes(max_depth))


def report_bytes(max_depth: int = MAX_DEPTH) -> bytes:
    """Return the deterministic summary as canonical, newline-ended JSON."""

    return _cached_report_bytes(max_depth)


if __name__ == "__main__":
    print(report_bytes().decode("ascii"), end="")
