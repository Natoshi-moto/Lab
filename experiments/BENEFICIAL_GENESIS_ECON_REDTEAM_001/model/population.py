"""Deterministic synthetic donor population generation.

Populations are built only from a published integer seed plus manifest
parameters. No real donor, address, or transaction data is used anywhere
in this package.
"""

from __future__ import annotations

import random
from typing import Any


def generate_small_donors(
    rng: random.Random,
    count: int,
    sats_min: int,
    sats_max: int,
    id_prefix: str = "small",
    group: str | None = None,
    block: int = 0,
) -> list[dict[str, Any]]:
    donors = []
    for i in range(count):
        donors.append(
            {
                "id": f"{id_prefix}_{i:06d}",
                "sats": rng.randint(sats_min, sats_max),
                "role": "small_donor",
                "group": group or f"{id_prefix}_{i:06d}",
                "block": block,
                "rebate_rate": 0,
                "stolen": False,
            }
        )
    return donors


def split_identity(
    donor: dict[str, Any], into: int, id_prefix: str | None = None
) -> list[dict[str, Any]]:
    """Splits one donor's sats across ``into`` synthetic sibling identities,
    floor-dividing so the sum never exceeds the original amount. Used to
    probe whether concave allocation weighting can be recovered/gamed by
    address-splitting under one true beneficial owner (tracked via
    ``group``).
    """
    base = donor["sats"] // into
    remainder = donor["sats"] - base * into
    prefix = id_prefix or f"{donor['id']}_split"
    out = []
    for i in range(into):
        sats = base + (remainder if i == 0 else 0)
        clone = dict(donor)
        clone["id"] = f"{prefix}_{i:03d}"
        clone["sats"] = sats
        clone["group"] = donor.get("group", donor["id"])
        out.append(clone)
    return out
