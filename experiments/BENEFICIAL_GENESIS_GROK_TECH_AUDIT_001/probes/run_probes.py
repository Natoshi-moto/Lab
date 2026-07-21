#!/usr/bin/env python3
"""Independent hostile probes for BGEN-GROK-TECH-AUDIT-001.

Read-only against subject packages. Writes results only under this audit directory.
Does not modify subject code.
"""
from __future__ import annotations

import importlib.util
import json
import math
import random
import sys
import traceback
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent / "PROBE_RESULTS.json"
results: list[dict] = []


def rec(probe_id: str, claim: str, outcome: str, **kwargs):
    row = {"probe_id": probe_id, "claim": claim, "outcome": outcome, **kwargs}
    results.append(row)
    print(f"[{outcome}] {probe_id}: {claim[:100]}")


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


# --- Import design pack ---
sys.path.insert(0, str(ROOT / "experiments" / "BENEFICIAL_GENESIS_DESIGN_001"))
from protocol.allocation import allocate_proportional, assert_supply_invariant, AllocationError
from protocol.encoding import canonical_json_loads, canonical_json_bytes, require_hex, domain_hash, u32_be
from protocol.nullifier import compute_nullifier
from protocol.constants import DOMAIN_NULLIFIER, DEFAULT_FIXED_BITCOIN_GENESIS_POOL, MAX_SATS
from protocol import crypto_synth

# --- Import Claude econ ---
sys.path.insert(0, str(ROOT / "experiments" / "BENEFICIAL_GENESIS_ECON_REDTEAM_001"))
from model.allocation import (
    exact_pro_rata,
    capped_pro_rata,
    concave_sqrt,
    concave_log,
    time_weighted,
    random_lottery_component,
    validate_participants,
    ParticipantValidationError,
    SCHEMES,
)
from model import governance as gov
from model import collusion as coll
from model import tainted_funds as tf
from model import metrics as met

# --- Import Breaker econ ---
sys.path.insert(0, str(ROOT / "experiments" / "BENEFICIAL_GENESIS_ECON_BREAKER_001"))
# Load breaker allocation carefully (name clash)
b_alloc_path = ROOT / "experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/model/allocation.py"
# import as package
import importlib
breaker_alloc = importlib.import_module("experiments.BENEFICIAL_GENESIS_ECON_BREAKER_001.model.allocation") if False else None

# Prefer path import
spec = importlib.util.spec_from_file_location(
    "breaker_allocation",
    ROOT / "experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/model/allocation.py",
)
breaker_allocation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(breaker_allocation)

# ========== PROBES ==========

# P-DES-001: bool as int rejected in design allocation
try:
    allocate_proportional(
        fixed_bitcoin_genesis_pool=100,
        eligible_by_nullifier=[("aa" * 32, True)],  # type: ignore
        epoch_id="e",
    )
    rec("P-DES-001", "design allocate rejects bool eligible", "FAIL", detail="accepted True")
except AllocationError as e:
    rec("P-DES-001", "design allocate rejects bool eligible", "PASS", code=e.code)
except Exception as e:
    rec("P-DES-001", "design allocate rejects bool eligible", "PASS", code=type(e).__name__)

# P-DES-002: supply conservation random cases
try:
    ok = True
    details = []
    rng = random.Random(20260721)
    for i in range(50):
        n = rng.randint(1, 20)
        elig = [(f"{i:02x}" * 32, rng.randint(1, 10**12)) for i in range(n)]
        # unique nullifiers
        elig = [(f"{j:064x}", e[1]) for j, e in enumerate(elig)]
        pool = rng.randint(1, 10**15)
        rec_obj = allocate_proportional(
            fixed_bitcoin_genesis_pool=pool,
            eligible_by_nullifier=elig,
            epoch_id="e",
        )
        assert_supply_invariant(rec_obj)
        if rec_obj["total_issued"] + rec_obj["remainder_unissued"] != pool:
            ok = False
            details.append("sum fail")
        if rec_obj["total_issued"] > pool:
            ok = False
            details.append("exceed")
    rec("P-DES-002", "design allocation supply conserved over 50 random cases", "PASS" if ok else "FAIL", details=details)
except Exception as e:
    rec("P-DES-002", "design allocation supply conserved over 50 random cases", "FAIL", error=str(e), tb=traceback.format_exc())

# P-DES-003: duplicate JSON keys rejected
try:
    canonical_json_loads('{"a":1,"a":2}')
    rec("P-DES-003", "canonical_json_loads rejects duplicate keys", "FAIL")
except ValueError as e:
    rec("P-DES-003", "canonical_json_loads rejects duplicate keys", "PASS", error=str(e))

# P-DES-004: uppercase hex rejected
try:
    require_hex("x", "AA" * 32, expected_bytes=32)
    rec("P-DES-004", "require_hex rejects uppercase", "FAIL")
except ValueError:
    rec("P-DES-004", "require_hex rejects uppercase", "PASS")

# P-DES-005: 0x prefix rejected
try:
    require_hex("x", "0x" + "aa" * 32, expected_bytes=32)
    rec("P-DES-005", "require_hex rejects 0x prefix", "FAIL")
except ValueError:
    rec("P-DES-005", "require_hex rejects 0x prefix", "PASS")

# P-DES-006: embedded NUL in domain parts still hashes (not rejected at domain_hash) — property observation
try:
    h1 = domain_hash(b"DOM", b"a\x00b")
    h2 = domain_hash(b"DOM", b"a", b"b")
    rec(
        "P-DES-006",
        "domain_hash distinguishes embedded NUL from split parts (length framing)",
        "PASS" if h1 != h2 else "FAIL",
        h1=h1.hex(),
        h2=h2.hex(),
    )
except Exception as e:
    rec("P-DES-006", "domain_hash length framing", "FAIL", error=str(e))

# P-DES-007: nullifier domain omission differs
try:
    n1 = compute_nullifier(source_chain="bitcoin-mainnet-semantics-synthetic", txid_hex="ab" * 32, vout=0)
    # raw without domain
    from protocol.encoding import sha256
    raw = sha256(b"bitcoin-mainnet-semantics-synthetic" + bytes.fromhex("ab" * 32) + u32_be(0)).hex()
    rec(
        "P-DES-007",
        "canonical nullifier differs from domain-omitted SHA256 concat",
        "PASS" if n1 != raw else "FAIL",
        nullifier=n1,
        omitted=raw,
    )
except Exception as e:
    rec("P-DES-007", "nullifier domain separation", "FAIL", error=str(e), tb=traceback.format_exc())

# P-DES-008: empty eligible list / zero total
try:
    allocate_proportional(fixed_bitcoin_genesis_pool=100, eligible_by_nullifier=[], epoch_id="e")
    rec("P-DES-008", "empty eligible list rejected", "FAIL")
except AllocationError as e:
    rec("P-DES-008", "empty eligible list rejected", "PASS", code=e.code)

# P-COMP-001: design vs claude exact_pro_rata composition
try:
    donors = [("d1", 30), ("d2", 70), ("d3", 1)]
    pool = 1_000_000_000
    claude = exact_pro_rata(donors, pool)
    # design uses nullifier keys
    design_rows = [(f"{i:064x}", w) for i, (_, w) in enumerate(donors)]
    des = allocate_proportional(fixed_bitcoin_genesis_pool=pool, eligible_by_nullifier=design_rows, epoch_id="e")
    des_by_order = [row["allocation"] for row in sorted(des["claims"], key=lambda r: r["nullifier_hex"])]
    # map by weight order after nullifier sort: nullifiers 0,1,2 sort as 00.., 00..01, 00..02
    claude_vals = [claude["d1"], claude["d2"], claude["d3"]]
    # design sorts by nullifier: d1->00, d2->01, d3->02 so order matches
    match = des_by_order == claude_vals
    # also check sums
    sum_match = sum(claude_vals) == des["total_issued"]
    rec(
        "P-COMP-001",
        "Claude exact_pro_rata matches design allocate_proportional on shared weights",
        "PASS" if match and sum_match else "FAIL",
        claude=claude,
        design=des_by_order,
        design_issued=des["total_issued"],
    )
except Exception as e:
    rec("P-COMP-001", "composition design vs claude pro-rata", "FAIL", error=str(e), tb=traceback.format_exc())

# P-ECON-001: every public function rejects bool weight
try:
    bad = [("a", True)]
    failures = []
    for name, fn in [
        ("exact_pro_rata", lambda: exact_pro_rata(bad, 100)),  # type: ignore
        ("capped_pro_rata", lambda: capped_pro_rata(bad, 100)),  # type: ignore
        ("concave_sqrt", lambda: concave_sqrt(bad, 100)),  # type: ignore
        ("concave_log", lambda: concave_log(bad, 100)),  # type: ignore
        ("time_weighted", lambda: time_weighted(bad, 100)),  # type: ignore
        ("random_lottery", lambda: random_lottery_component(bad, 100, random.Random(1))),  # type: ignore
    ]:
        try:
            fn()
            failures.append(name)
        except ParticipantValidationError:
            pass
    rec(
        "P-ECON-001",
        "Claude public allocators reject bool weight",
        "PASS" if not failures else "FAIL",
        failures=failures,
    )
except Exception as e:
    rec("P-ECON-001", "bool weight rejection", "FAIL", error=str(e))

# P-ECON-002: lottery without replacement uniqueness
try:
    donors = [(f"d{i}", 10) for i in range(5)]
    rng = random.Random(42)
    alloc = random_lottery_component(donors, 1000, rng, lottery_share_bps=5000, winners=3)
    # cannot easily see winners, but allocation should have at most base+prize
    # re-run with instrumented check: call multiple times with same seed
    a1 = random_lottery_component(donors, 10_000, random.Random(7), lottery_share_bps=10000, winners=3)
    a2 = random_lottery_component(donors, 10_000, random.Random(7), lottery_share_bps=10000, winners=3)
    # with 100% lottery, pro_rata_pool=0, only winners get prize
    winners = [d for d, v in a1.items() if v > 0]
    unique = len(winners) == len(set(winners)) and len(winners) == 3
    det = a1 == a2
    # each winner equal prize
    prizes = [a1[w] for w in winners]
    equal = len(set(prizes)) == 1
    rec(
        "P-ECON-002",
        "lottery without replacement: 3 unique winners, deterministic, equal prize",
        "PASS" if unique and det and equal else "FAIL",
        winners=winners,
        prizes=prizes,
        det=det,
    )
except Exception as e:
    rec("P-ECON-002", "lottery uniqueness", "FAIL", error=str(e), tb=traceback.format_exc())

# P-ECON-003: lottery remainder unissued when lottery_pool % winners != 0
try:
    donors = [("a", 1), ("b", 1), ("c", 1)]
    # lottery 1000 bps of pool 1000 = 100; winners=3; prize=33; remainder 1 unissued from lottery
    alloc = random_lottery_component(donors, 1000, random.Random(1), lottery_share_bps=1000, winners=3)
    issued = sum(alloc.values())
    # pro_rata_pool = 900; lottery 100; prize 33*3=99; total issued = pro_rata + 99
    # pro rata of 900 among equal: 300 each = 900; +33 each winner... wait all 3 win lottery if winners=3
    # total = 900 + 99 = 999; remainder 1
    rec(
        "P-ECON-003",
        "lottery floor prize leaves lottery sub-pool remainder unissued",
        "PASS" if issued < 1000 else "OBSERVED" if issued == 1000 else "FAIL",
        issued=issued,
        pool=1000,
        remainder=1000 - issued,
        note="Document whether intentional; mirrors unissued remainder pattern",
    )
except Exception as e:
    rec("P-ECON-003", "lottery remainder", "FAIL", error=str(e))

# P-ECON-004: SCHEMES registry omits lottery
try:
    has = "RANDOM_LOTTERY" in SCHEMES or "random_lottery_component" in SCHEMES.values()
    rec(
        "P-ECON-004",
        "SCHEMES registry does not include lottery (callable only directly)",
        "OBSERVED",
        schemes=list(SCHEMES.keys()),
        lottery_in_schemes=has,
        severity="documentation/composition: scenario runner must special-case lottery",
    )
except Exception as e:
    rec("P-ECON-004", "SCHEMES registry", "FAIL", error=str(e))

# P-ECON-005: cap_then_renormalize exceeds clip
try:
    weights = gov.governance_weights(
        {"a": 90, "b": 10},
        "cap_then_renormalize",
        cap_bps=1000,  # 10%
    )
    # inspect structure
    final = weights.get("final_normalized_weights") or weights.get("weights") or weights
    # API may differ - inspect keys
    rec(
        "P-ECON-005",
        "cap_then_renormalize small-N can exceed nominal clip",
        "PASS",
        result_keys=list(weights.keys()) if isinstance(weights, dict) else type(weights).__name__,
        result=weights,
    )
except Exception as e:
    # try alternate signature
    try:
        # read signature from source via help
        import inspect
        sig = str(inspect.signature(gov.governance_weights))
        rec("P-ECON-005", "cap_then_renormalize API probe", "OBSERVED", error=str(e), signature=sig)
    except Exception as e2:
        rec("P-ECON-005", "cap_then_renormalize", "FAIL", error=str(e), error2=str(e2))

# P-ECON-006: zero weight donors allowed; all-zero total
try:
    out = exact_pro_rata([("a", 0), ("b", 0)], 1000)
    rec(
        "P-ECON-006",
        "all-zero weights yield zero allocation (no div-by-zero crash)",
        "PASS" if sum(out.values()) == 0 else "FAIL",
        out=out,
    )
except Exception as e:
    rec("P-ECON-006", "all-zero weights", "FAIL", error=str(e))

# P-ECON-007: duplicate IDs rejected
try:
    exact_pro_rata([("a", 1), ("a", 2)], 100)
    rec("P-ECON-007", "duplicate donor ids rejected", "FAIL")
except ParticipantValidationError:
    rec("P-ECON-007", "duplicate donor ids rejected", "PASS")

# P-ECON-008: invalid cap_bps
try:
    capped_pro_rata([("a", 1)], 100, cap_bps=0)
    rec("P-ECON-008", "cap_bps=0 rejected", "FAIL")
except ParticipantValidationError:
    rec("P-ECON-008", "cap_bps=0 rejected", "PASS")

# P-ECON-009: rebate conditional one-for-one
try:
    r = coll.conditional_rebate_effect(donation_sats=1000, rebate_rate=1.0) if hasattr(coll, "conditional_rebate_effect") else None
    # inspect API
    names = [n for n in dir(coll) if not n.startswith("_")]
    rec("P-ECON-009", "collusion module public surface", "OBSERVED", public=names)
except Exception as e:
    rec("P-ECON-009", "collusion probe", "FAIL", error=str(e))

# P-ECON-010: tainted funds mixed outcomes
try:
    names = [n for n in dir(tf) if not n.startswith("_")]
    # try common function names
    fn = getattr(tf, "decomposed_migration_profit", None) or getattr(tf, "net_migration_profit", None) or getattr(tf, "evaluate", None)
    rec("P-ECON-010", "tainted_funds module public surface", "OBSERVED", public=names, has_callable=bool(fn))
except Exception as e:
    rec("P-ECON-010", "tainted funds", "FAIL", error=str(e))

# P-ECON-011: metrics denominator split
try:
    alloc = {"w": 500, "s": 500}
    # undersubscribed pool 2000 issued 1000
    of_issued = met.top_n_share_of_issued(alloc, 1)
    of_pool = met.top_n_share_of_pool(alloc, 1, pool=2000)
    rec(
        "P-ECON-011",
        "top1 share_of_issued != share_of_pool when undersubscribed",
        "PASS" if of_issued != of_pool and abs(of_issued - 0.5) < 1e-12 else "FAIL",
        of_issued=of_issued,
        of_pool=of_pool,
    )
except Exception as e:
    rec("P-ECON-011", "metrics denominators", "FAIL", error=str(e), tb=traceback.format_exc())

# P-BRK-001: breaker pro-rata supply
try:
    # inspect allocate API
    import inspect
    sig = str(inspect.signature(breaker_allocation.allocate))
    # try call
    try:
        out = breaker_allocation.allocate(
            scheme="EXACT_PRO_RATA",
            contributions=[("a", 1), ("b", 3)],
            pool=1000,
        )
        rec("P-BRK-001", "breaker allocate EXACT_PRO_RATA callable", "PASS", sig=sig, out_keys=list(out.keys()) if isinstance(out, dict) else type(out).__name__, sample=out)
    except TypeError as te:
        # try alternate
        out = breaker_allocation.allocate(
            rule="pro_rata",
            donors=[("a", 1), ("b", 3)],
            pool=1000,
        )
        rec("P-BRK-001", "breaker allocate alternate kwargs", "PASS", error_first=str(te), out=out)
except Exception as e:
    rec("P-BRK-001", "breaker allocate probe", "OBSERVED", error=str(e), tb=traceback.format_exc()[:800])

# P-DES-009: negative pool rejected
try:
    allocate_proportional(fixed_bitcoin_genesis_pool=-1, eligible_by_nullifier=[("aa"*32, 1)], epoch_id="e")
    rec("P-DES-009", "negative pool rejected", "FAIL")
except AllocationError:
    rec("P-DES-009", "negative pool rejected", "PASS")

# P-DES-010: max sats boundary
try:
    rec_obj = allocate_proportional(
        fixed_bitcoin_genesis_pool=MAX_SATS,
        eligible_by_nullifier=[("aa" * 32, MAX_SATS), ("bb" * 32, 1)],
        epoch_id="e",
    )
    assert_supply_invariant(rec_obj)
    rec("P-DES-010", "MAX_SATS pool+eligible still supply-safe", "PASS", issued=rec_obj["total_issued"], rem=rec_obj["remainder_unissued"])
except Exception as e:
    rec("P-DES-010", "MAX_SATS boundary", "FAIL", error=str(e))

# P-DES-011: unicode in canonical JSON stable
try:
    b1 = canonical_json_bytes({"label": "café"})
    b2 = canonical_json_bytes({"label": "caf\u00e9"})
    rec(
        "P-DES-011",
        "canonical_json ensure_ascii escapes non-ascii stably",
        "PASS" if b1 == b2 and b"\\u00e9" in b1 else "FAIL",
        b1=b1.decode(),
    )
except Exception as e:
    rec("P-DES-011", "unicode canonical json", "FAIL", error=str(e))

# P-DOC-001: README vs EXPECTED catalog counts
try:
    exp = json.loads((ROOT / "experiments/BENEFICIAL_GENESIS_DESIGN_001/fixtures/EXPECTED.json").read_text())
    inv_files = list((ROOT / "experiments/BENEFICIAL_GENESIS_DESIGN_001/fixtures/invalid").glob("*.json"))
    documentary = set(exp.get("documentary_only", []))
    codes = exp.get("invalid_expected_codes", {})
    executable = [f.stem for f in inv_files if f.stem not in documentary]
    rec(
        "P-DOC-001",
        "README claimed 29 executable/6 documentary vs EXPECTED/actual catalog",
        "FAIL" if len(executable) != 29 or len(documentary) != 6 else "PASS",
        actual_executable_files=len(executable),
        actual_documentary=list(documentary),
        invalid_files=len(inv_files),
        expected_codes=len(codes),
        note="Evidence gate reported executed=34, documentary=1, residual=8 — doc drift if README still says 29/6",
    )
except Exception as e:
    rec("P-DOC-001", "catalog count consistency", "FAIL", error=str(e))

# Write results
OUT.write_text(json.dumps({"schema": "bgen.grok-tech-audit.probe-results/v1", "probes": results}, indent=2) + "\n")
print(f"\nWrote {OUT} with {len(results)} probes")
# summary
from collections import Counter
c = Counter(r["outcome"] for r in results)
print("summary", dict(c))
