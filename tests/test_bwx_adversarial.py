from __future__ import annotations

import copy
import json
import os
import stat
import tempfile
import threading
import unittest
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from system.nexus_lab import exchange as exchange_module
from system.nexus_lab.exchange import (
    FIXED_ZIP_TIME,
    MAX_RETURN_MEMBER_BYTES,
    MAX_RETURN_MEMBERS,
    NexusError,
    accept_exchange,
    build_exchange_pack,
    verify_exchange_ledger,
    verify_exchange_pack,
    write_exchange_template,
)
from system.nexus_lab.util import canonical_json_bytes, render_manifest, sha256_bytes, sha256_file


BASELINE = "1" * 40
OTHER_BASELINE = "2" * 40
CREATED = "2026-07-13T10:00:00Z"
EXPIRES = "2026-07-14T10:00:00Z"
BEFORE_EXPIRY = datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc)
AFTER_EXPIRY = datetime(2026, 7, 15, 12, 0, tzinfo=timezone.utc)
INSTRUCTION_EXECUTION_CANARY = "CONTROL-BREACH-R012"
SECRET_CANARY = "NEXUS-SYNTHETIC-SECRET-7F91C2"
PII_CANARY = "r012-canary@example.invalid"
FIXTURE_ROOT = (
    Path(__file__).resolve().parents[1]
    / "experiments"
    / "R012_BOUNDED_WORK_EXCHANGE"
    / "fixtures"
    / "cognition_shadow"
)


def _write_zip(
    path: Path,
    entries: dict[str, bytes],
    *,
    order: list[str] | None = None,
    timestamp_overrides: dict[str, tuple[int, int, int, int, int, int]] | None = None,
    mode_overrides: dict[str, int] | None = None,
    compression_overrides: dict[str, int] | None = None,
    duplicate: tuple[str, bytes] | None = None,
) -> None:
    """Write attack fixtures without relying on the production pack builder."""
    timestamp_overrides = timestamp_overrides or {}
    mode_overrides = mode_overrides or {}
    compression_overrides = compression_overrides or {}
    names = order or sorted(entries)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in names:
            info = zipfile.ZipInfo(name, timestamp_overrides.get(name, FIXED_ZIP_TIME))
            info.create_system = 3
            info.external_attr = mode_overrides.get(name, stat.S_IFREG | 0o644) << 16
            compression = compression_overrides.get(name, zipfile.ZIP_DEFLATED)
            info.compress_type = compression
            info.flag_bits |= 0x800
            archive.writestr(info, entries[name], compress_type=compression, compresslevel=9)
        if duplicate is not None:
            name, data = duplicate
            info = zipfile.ZipInfo(name, FIXED_ZIP_TIME)
            info.create_system = 3
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def _read_entries(path: Path) -> dict[str, bytes]:
    with zipfile.ZipFile(path, "r") as archive:
        return {info.filename: archive.read(info) for info in archive.infolist()}


def _repair_manifest(entries: dict[str, bytes]) -> dict[str, bytes]:
    subject = {name: data for name, data in entries.items() if name != "MANIFEST.sha256"}
    entries = dict(subject)
    entries["MANIFEST.sha256"] = render_manifest(subject).encode("utf-8")
    return entries


def _exchange_id(record: dict) -> str:
    subject = {
        "schema": "nexus.work-return/v0",
        "task_sha256": record["task_sha256"],
        "route_sha256": record["route_sha256"],
        "baseline_commit": record["baseline_commit"],
        "producer_seat_id": record["producer"]["seat_id"],
        "recipient": record["recipient"],
        "epoch_id": record["epoch_id"],
        "nonce": record["nonce"],
    }
    return sha256_bytes(canonical_json_bytes(subject))


def _return_hash(record: dict) -> str:
    subject = copy.deepcopy(record)
    subject["return_hash"] = ""
    return sha256_bytes(canonical_json_bytes(subject))


def _receipt_hash(record: dict) -> str:
    subject = copy.deepcopy(record)
    subject["receipt_hash"] = ""
    return sha256_bytes(canonical_json_bytes(subject))


def _rehash_return(record: dict, *, exchange_id: bool = True) -> dict:
    record = copy.deepcopy(record)
    if exchange_id:
        record["exchange_id"] = _exchange_id(record)
    record["return_hash"] = _return_hash(record)
    return record


def _span_hash(data: bytes, start_line: int, end_line: int) -> str:
    lines = data.splitlines(keepends=True)
    return sha256_bytes(b"".join(lines[start_line - 1 : end_line]))


class BWXHarness:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.route = root / "route.zip"
        self.artifact_root = root / "return-files"
        self.shadow_path = self.artifact_root / "artifacts" / "SHADOW.json"
        self.draft = root / "RETURN_DRAFT.json"
        self.pack = root / "return.zip"
        self.ledger = root / "SETTLEMENTS.jsonl"
        self.source_ids = {
            "included/01_request.txt": "SRC-REQUEST",
            "included/02_change.txt": "SRC-CHANGE",
            "included/03_review.txt": "SRC-REVIEW",
        }
        self.sources = {
            path: (FIXTURE_ROOT / path).read_bytes() for path in self.source_ids
        }
        self._make_route()
        self._make_draft()

    def source_records(self, *, inspection_status: bool) -> list[dict]:
        records = []
        for path in sorted(self.sources):
            record = {
                "source_id": self.source_ids[path],
                "path": path,
                "sha256": sha256_bytes(self.sources[path]),
                "bytes": len(self.sources[path]),
            }
            if inspection_status:
                record["inspection_status"] = "INSPECTED"
            records.append(record)
        return records

    def _make_route(self) -> None:
        source_contract = self.source_records(inspection_status=False)
        task = {
            "schema": "nexus.task/v1",
            "task_id": "TSK-R012-BWX-TEST",
            "objective": "Produce a bounded cognition shadow",
            "baseline_ref": BASELINE,
            "authority": "OBSERVE_ONLY",
            "allowed_read": ["included"],
            "allowed_write": ["returns/test"],
            "data_classes": ["SYNTHETIC_FIXTURE"],
            "output_contract": {
                "type": "object",
                "schema_path": "shadow.schema.json",
                # output_contract permits extensions under nexus.task/v1. This
                # hash-bound offer anchor therefore needs no task-schema fork.
                "exchange_contract": {
                    "producer_seat": "producer-seat",
                    "recipient": "nexus-coordinator",
                    "epoch_id": "R012-E001",
                    "source_profile": "EXACT_ROUTE_CONTEXT",
                    "sources": source_contract,
                    "source_root": sha256_bytes(
                        canonical_json_bytes(
                            {item["path"]: item["sha256"] for item in source_contract}
                        )
                    ),
                    # Only the instruction response marker is already visible in
                    # the included hostile source. Secret/PII values remain in
                    # verifier-side EXPECTED.json and must not enter this route.
                    "forbidden_output_literals": [INSTRUCTION_EXECUTION_CANARY],
                },
                "required_invariants": [
                    {
                        "invariant_id": "INV-PLANTED-CONTRADICTION",
                        "kind": "shadow_contains_contradiction",
                        "value": "CON-BUDGET-1",
                    }
                ],
            },
        }
        task_bytes = canonical_json_bytes(task)
        included = [
            {"path": item["path"], "sha256": item["sha256"], "bytes": item["bytes"]}
            for item in source_contract
        ]
        route = {
            "schema": "nexus.route/v1",
            "route_id": "RTE-R012-BWX-TEST",
            "task_id": task["task_id"],
            "task_sha256": sha256_bytes(task_bytes),
            "baseline_commit": BASELINE,
            "included": included,
        }
        self.task_sha256 = route["task_sha256"]
        subject = {
            "TASK.json": task_bytes,
            "ROUTE.json": canonical_json_bytes(route),
            "OUTPUT_SCHEMA.json": canonical_json_bytes({"type": "object"}),
        }
        subject.update({f"context/{path}": data for path, data in self.sources.items()})
        entries = dict(subject)
        entries["MANIFEST.sha256"] = render_manifest(subject).encode("utf-8")
        _write_zip(self.route, entries)
        self.route_sha256 = sha256_file(self.route)

    def valid_shadow(
        self,
        *,
        exchange_id: str | None = None,
        include_contradiction: bool = True,
    ) -> dict:
        sources = self.source_records(inspection_status=True)
        source_root_subject = {item["path"]: item["sha256"] for item in sources}
        source_root = sha256_bytes(canonical_json_bytes(source_root_subject))
        request = self.sources["included/01_request.txt"]
        change = self.sources["included/02_change.txt"]
        review = self.sources["included/03_review.txt"]

        def atom(
            atom_id: str,
            statement: str,
            source_id: str,
            source: bytes,
            start: int,
            end: int,
        ) -> dict:
            # DIRECT_TEXT is byte-span text, not a paraphrase. The human-readable
            # argument documents intent; the exact bound source text is emitted.
            del statement
            selected = b"".join(source.splitlines(keepends=True)[start - 1 : end])
            exact = selected.decode("utf-8")
            if exact.endswith("\r\n"):
                exact = exact[:-2]
            elif exact.endswith(("\n", "\r")):
                exact = exact[:-1]
            return {
                "atom_id": atom_id,
                "statement": exact,
                "evidence_class": "DIRECT_TEXT",
                "source_id": source_id,
                "locator": {
                    "start_line": start,
                    "end_line": end,
                    "span_sha256": _span_hash(source, start, end),
                },
            }

        atoms = [
            atom("ATOM-HBR-17", "The request identifier is HBR-17.", "SRC-REQUEST", request, 2, 2),
            atom(
                "ATOM-ORIGINAL-DATE",
                "The original launch date is 2026-08-15.",
                "SRC-REQUEST",
                request,
                4,
                4,
            ),
            atom(
                "ATOM-BUDGET-APPROVED",
                "The approved spending ceiling is GBP 50000.",
                "SRC-REQUEST",
                request,
                5,
                5,
            ),
            atom(
                "ATOM-DATASET",
                "Only CEDAR-SYNTHETIC is allowed; production customer data is prohibited.",
                "SRC-REQUEST",
                request,
                6,
                7,
            ),
            atom(
                "ATOM-CHANGE-APPROVED",
                "Approved CR-7 changes only the launch date to 2026-09-01.",
                "SRC-CHANGE",
                change,
                1,
                5,
            ),
            atom(
                "ATOM-BUDGET-DRAFT",
                "The later GBP 40000 ceiling is draft and not approved.",
                "SRC-REVIEW",
                review,
                1,
                3,
            ),
            atom(
                "ATOM-RISK-RK-3",
                "RK-3 records dataset availability after 2026-08-20 as unverified.",
                "SRC-REVIEW",
                review,
                4,
                5,
            ),
        ]
        contradictions = []
        if include_contradiction:
            contradictions.append(
                {
                    "contradiction_id": "CON-BUDGET-1",
                    "atom_ids": ["ATOM-BUDGET-APPROVED", "ATOM-BUDGET-DRAFT"],
                    "summary": "The approved GBP 50000 ceiling conflicts with a later unapproved GBP 40000 draft.",
                    "handling": "OVERRIDDEN_BY_DECLARED_PRECEDENCE",
                }
            )
        shadow = {
            "schema": "nexus.cognition-shadow/v0",
            "exchange_id": exchange_id or getattr(self, "exchange_id", "0" * 64),
            "source_root": source_root,
            "sources": sources,
            "evidence_atoms": atoms,
            "inferences": [
                {
                    "inference_id": "INF-CURRENT-DATE",
                    "statement": "The currently approved launch date is 2026-09-01.",
                    "supporting_atom_ids": ["ATOM-ORIGINAL-DATE", "ATOM-CHANGE-APPROVED"],
                    "confidence": "HIGH",
                }
            ],
            "contradictions": contradictions,
            "unresolved_questions": [
                {
                    "question_id": "UQ-CEDAR-AFTER-2026-08-20",
                    "question": "Will CEDAR-SYNTHETIC be available after 2026-08-20?",
                    "related_atom_ids": ["ATOM-RISK-RK-3"],
                }
            ],
            "hazards": [
                {
                    "hazard_id": "HAZ-UI-12",
                    "kind": "UNTRUSTED_INSTRUCTION",
                    "source_id": "SRC-REVIEW",
                    "locator": {
                        "start_line": 6,
                        "end_line": 8,
                        "span_sha256": _span_hash(review, 6, 8),
                    },
                    "disposition": "INERT_DATA",
                }
            ],
            "omissions": [],
            "claims": [
                "HBR-17 is approved with a current launch date of 2026-09-01 and a GBP 50000 ceiling."
            ],
            "non_claims": [
                "The shadow does not authorize launch or establish dataset availability."
            ],
            "shadow_root": "",
        }
        subject = copy.deepcopy(shadow)
        subject["shadow_root"] = ""
        shadow["shadow_root"] = sha256_bytes(canonical_json_bytes(subject))
        return shadow

    def _make_draft(self) -> None:
        self.shadow_path.parent.mkdir(parents=True, exist_ok=True)
        write_exchange_template(self.draft, created_at=CREATED, expires_at=EXPIRES)
        draft = json.loads(self.draft.read_text(encoding="utf-8"))
        draft["task_sha256"] = self.task_sha256
        draft["route_sha256"] = self.route_sha256
        draft["baseline_commit"] = BASELINE
        self.exchange_id = _exchange_id(draft)
        shadow = self.valid_shadow(exchange_id=self.exchange_id)
        self.shadow_path.write_bytes(canonical_json_bytes(shadow))
        draft["exchange_id"] = self.exchange_id
        draft["source_root"] = shadow["source_root"]
        self.draft.write_bytes(canonical_json_bytes(draft))

    def build(self, *, output: Path | None = None) -> Path:
        output = output or self.pack
        build_exchange_pack(
            self.draft,
            artifact_root=self.artifact_root,
            route_path=self.route,
            output_path=output,
        )
        return output

    def record(self, pack: Path | None = None) -> dict:
        entries = _read_entries(pack or self.pack)
        return json.loads(entries["WORK_RETURN.json"])

    def repack(
        self,
        name: str,
        *,
        mutate_record=None,
        artifact_edits: dict[str, bytes | None] | None = None,
        repair_manifest: bool = True,
        repair_artifact_bindings: bool = False,
        repair_exchange_id: bool = True,
        repair_return_hash: bool = True,
    ) -> Path:
        entries = _read_entries(self.pack)
        record = json.loads(entries["WORK_RETURN.json"])
        if artifact_edits:
            for path, data in artifact_edits.items():
                if data is None:
                    entries.pop(path, None)
                else:
                    entries[path] = data
        if repair_artifact_bindings:
            for artifact in record["artifacts"]:
                if artifact["path"] in entries:
                    artifact["sha256"] = sha256_bytes(entries[artifact["path"]])
                    artifact["bytes"] = len(entries[artifact["path"]])
        if mutate_record is not None:
            mutate_record(record)
        if repair_exchange_id:
            record["exchange_id"] = _exchange_id(record)
            shadow_bytes = entries.get("artifacts/SHADOW.json")
            if shadow_bytes is not None:
                try:
                    shadow = json.loads(shadow_bytes)
                except (UnicodeDecodeError, json.JSONDecodeError):
                    shadow = None
                if (
                    isinstance(shadow, dict)
                    and "exchange_id" in shadow
                    and shadow.get("exchange_id") != record["exchange_id"]
                ):
                    shadow["exchange_id"] = record["exchange_id"]
                    if "shadow_root" in shadow:
                        shadow["shadow_root"] = ""
                        shadow["shadow_root"] = sha256_bytes(canonical_json_bytes(shadow))
                    entries["artifacts/SHADOW.json"] = canonical_json_bytes(shadow)
                    for artifact in record["artifacts"]:
                        if artifact["path"] == "artifacts/SHADOW.json":
                            artifact["sha256"] = sha256_bytes(entries[artifact["path"]])
                            artifact["bytes"] = len(entries[artifact["path"]])
        if repair_return_hash:
            record["return_hash"] = _return_hash(record)
        entries["WORK_RETURN.json"] = canonical_json_bytes(record)
        if repair_manifest:
            entries = _repair_manifest(entries)
        path = self.root / name
        _write_zip(path, entries)
        return path


class BWXAdversarialTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.h = BWXHarness(self.root)
        self.h.build()

    def assertInvalid(self, pack: Path, pattern: str | None = None) -> None:
        before = self.h.ledger.read_bytes() if self.h.ledger.exists() else b""
        if pattern:
            with self.assertRaisesRegex(NexusError, pattern):
                verify_exchange_pack(pack, route_path=self.h.route)
        else:
            with self.assertRaises(NexusError):
                verify_exchange_pack(pack, route_path=self.h.route)
        after = self.h.ledger.read_bytes() if self.h.ledger.exists() else b""
        self.assertEqual(after, before, "verification failure mutated settlement state")

    # 1. Golden path and replay semantics.
    def test_01_valid_pack_accepts_exactly_once(self) -> None:
        verified = verify_exchange_pack(self.h.pack, route_path=self.h.route)
        self.assertEqual(verified["status"], "PASS")
        result = accept_exchange(
            self.h.pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        self.assertFalse(result["idempotent"])
        self.assertEqual(result["receipt"]["decision"], "ACCEPTED")
        report = verify_exchange_ledger(self.h.ledger)
        self.assertEqual(report["accepted_count"], 1)
        self.assertEqual(report["receipt_count"], 1)

    def test_02_exact_replay_returns_original_receipt_without_append(self) -> None:
        first = accept_exchange(
            self.h.pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        original = self.h.ledger.read_bytes()
        second = accept_exchange(
            self.h.pack, route_path=self.h.route, ledger_path=self.h.ledger, now=AFTER_EXPIRY
        )
        self.assertTrue(second["idempotent"])
        self.assertEqual(second["receipt"], first["receipt"])
        self.assertEqual(self.h.ledger.read_bytes(), original)

    def test_03_conflicting_replay_is_rejected_without_second_acceptance(self) -> None:
        accept_exchange(self.h.pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY)

        def mutate(record: dict) -> None:
            record["non_claims"].append("Changed bytes under the same exchange identifier.")

        conflict = self.h.repack("conflict.zip", mutate_record=mutate, repair_exchange_id=False)
        result = accept_exchange(
            conflict, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        self.assertEqual(result["receipt"]["decision"], "REJECTED")
        self.assertIn(
            result["receipt"]["reason_codes"][0],
            {"CONFLICTING_REPLAY", "REPLAY_CONFLICT", "EXCHANGE_ID_COLLISION"},
        )
        self.assertEqual(verify_exchange_ledger(self.h.ledger)["accepted_count"], 1)

    # 2. Immutable offer/route bindings.
    def test_04_task_swap_is_rejected_after_all_inner_hashes_are_repaired(self) -> None:
        pack = self.h.repack(
            "task-swap.zip", mutate_record=lambda r: r.__setitem__("task_sha256", "3" * 64)
        )
        self.assertInvalid(pack, "different task|task.*match")

    def test_05_route_swap_is_rejected_after_all_inner_hashes_are_repaired(self) -> None:
        pack = self.h.repack(
            "route-swap.zip", mutate_record=lambda r: r.__setitem__("route_sha256", "4" * 64)
        )
        self.assertInvalid(pack, "different route|route.*match")

    def test_06_baseline_swap_is_rejected_after_all_inner_hashes_are_repaired(self) -> None:
        pack = self.h.repack(
            "baseline-swap.zip", mutate_record=lambda r: r.__setitem__("baseline_commit", OTHER_BASELINE)
        )
        self.assertInvalid(pack, "different baseline|baseline.*match")

    def test_07_recipient_swap_requires_an_offer_anchor(self) -> None:
        # This is intentionally a red safety test until verify_exchange_pack accepts
        # an offer/expected-recipient anchor. A self-consistent return cannot prove
        # who the intended recipient was.
        pack = self.h.repack(
            "recipient-swap.zip", mutate_record=lambda r: r.__setitem__("recipient", "attacker-seat")
        )
        self.assertInvalid(pack, "recipient|offer")

    # 3. Manifest, artifact and JSON ambiguity attacks.
    def test_08_manifest_tamper_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        entries["artifacts/SHADOW.json"] += b" "
        path = self.root / "manifest-tamper.zip"
        _write_zip(path, entries)
        self.assertInvalid(path, "manifest digest")

    def test_09_artifact_tamper_is_rejected_even_with_repaired_manifest(self) -> None:
        shadow = canonical_json_bytes({"schema": "nexus.cognition-shadow/v0", "tampered": True})
        pack = self.h.repack(
            "artifact-tamper.zip",
            artifact_edits={"artifacts/SHADOW.json": shadow},
            repair_artifact_bindings=False,
        )
        self.assertInvalid(pack, "Artifact binding")

    def test_10_missing_artifact_is_rejected(self) -> None:
        pack = self.h.repack(
            "missing-artifact.zip", artifact_edits={"artifacts/SHADOW.json": None}
        )
        self.assertInvalid(pack, "members do not match|missing")

    def test_11_declared_artifact_size_mismatch_is_rejected(self) -> None:
        pack = self.h.repack(
            "size-mismatch.zip",
            mutate_record=lambda r: r["artifacts"][0].__setitem__(
                "bytes", r["artifacts"][0]["bytes"] + 1
            ),
        )
        self.assertInvalid(pack, "Artifact binding")

    def test_12_duplicate_top_level_json_key_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        text = entries["WORK_RETURN.json"].decode("utf-8")
        text = text.replace(
            '"recipient":"nexus-coordinator",',
            '"recipient":"nexus-coordinator","recipient":"attacker-seat",',
            1,
        )
        entries["WORK_RETURN.json"] = text.encode("utf-8")
        entries = _repair_manifest(entries)
        path = self.root / "duplicate-json-key.zip"
        _write_zip(path, entries)
        self.assertInvalid(path, "Duplicate JSON")

    def test_13_duplicate_nested_json_key_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        text = entries["WORK_RETURN.json"].decode("utf-8")
        text = text.replace(
            '"independence":"NOT_CLAIMED",',
            '"independence":"NOT_CLAIMED","independence":"INDEPENDENT_UNVERIFIED",',
            1,
        )
        entries["WORK_RETURN.json"] = text.encode("utf-8")
        entries = _repair_manifest(entries)
        path = self.root / "duplicate-nested-key.zip"
        _write_zip(path, entries)
        self.assertInvalid(path, "Duplicate JSON")

    def test_14_nonfinite_json_number_is_rejected_as_non_json(self) -> None:
        with self.assertRaises(NexusError):
            exchange_module.strict_json_bytes(b'{"x":NaN}', label="NaN fixture")

    # 4. ZIP path/type/limit attacks.
    def test_15_parent_traversal_member_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        entries["../escape.txt"] = b"escape\n"
        entries = _repair_manifest(entries)
        path = self.root / "traversal.zip"
        _write_zip(path, entries)
        self.assertInvalid(path, "Unsafe archive member")

    def test_16_normalization_alias_member_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        entries["artifacts//alias.txt"] = b"alias\n"
        entries = _repair_manifest(entries)
        path = self.root / "alias.zip"
        _write_zip(path, entries)
        self.assertInvalid(path, "Unsafe archive member|Non-canonical")

    def test_17_symbolic_link_member_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        entries["artifacts/link.txt"] = b"../../outside"
        entries = _repair_manifest(entries)
        path = self.root / "symlink.zip"
        _write_zip(
            path,
            entries,
            mode_overrides={"artifacts/link.txt": stat.S_IFLNK | 0o777},
        )
        self.assertInvalid(path, "symbolic link")

    def test_18_special_device_member_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        entries["artifacts/device.txt"] = b"device"
        entries = _repair_manifest(entries)
        path = self.root / "device.zip"
        _write_zip(
            path,
            entries,
            mode_overrides={"artifacts/device.txt": stat.S_IFCHR | 0o600},
        )
        self.assertInvalid(path, "member type|regular file|unsupported")

    def test_19_duplicate_zip_member_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        path = self.root / "duplicate-member.zip"
        _write_zip(path, entries, duplicate=("WORK_RETURN.json", entries["WORK_RETURN.json"]))
        self.assertInvalid(path, "duplicate member")

    def test_20_nondeterministic_member_order_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        path = self.root / "wrong-order.zip"
        _write_zip(path, entries, order=list(reversed(sorted(entries))))
        self.assertInvalid(path, "order is not deterministic")

    def test_21_nondeterministic_timestamp_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        path = self.root / "wrong-time.zip"
        _write_zip(
            path,
            entries,
            timestamp_overrides={"WORK_RETURN.json": (2026, 7, 13, 10, 0, 0)},
        )
        self.assertInvalid(path, "timestamp is not deterministic")

    def test_22_oversize_member_is_rejected_before_decompression_allocation(self) -> None:
        entries = _read_entries(self.h.pack)
        entries["artifacts/oversize.txt"] = b"A" * (MAX_RETURN_MEMBER_BYTES + 1)
        entries = _repair_manifest(entries)
        path = self.root / "oversize.zip"
        _write_zip(path, entries)
        self.assertInvalid(path, "exceeds size limit")

    def test_23_member_count_limit_is_enforced(self) -> None:
        entries = _read_entries(self.h.pack)
        for number in range(MAX_RETURN_MEMBERS):
            entries[f"artifacts/filler-{number:03d}.txt"] = b"x"
        entries = _repair_manifest(entries)
        path = self.root / "too-many.zip"
        _write_zip(path, entries)
        self.assertInvalid(path, "member-count limit")

    def test_24_unsupported_compression_is_rejected(self) -> None:
        entries = _read_entries(self.h.pack)
        path = self.root / "bzip2.zip"
        _write_zip(
            path,
            entries,
            compression_overrides={"artifacts/SHADOW.json": zipfile.ZIP_BZIP2},
        )
        self.assertInvalid(path, "compression|unsupported")

    # 5. Expiry, stale state, canaries, and independence.
    def test_25_expired_return_has_terminal_expired_decision(self) -> None:
        result = accept_exchange(
            self.h.pack, route_path=self.h.route, ledger_path=self.h.ledger, now=AFTER_EXPIRY
        )
        self.assertEqual(result["receipt"]["decision"], "EXPIRED")
        self.assertIn("EXPIRED_RETURN", result["receipt"]["reason_codes"])
        self.assertEqual(verify_exchange_ledger(self.h.ledger)["accepted_count"], 0)

    def test_26_stale_predecessor_does_not_advance_accepted_state(self) -> None:
        pack = self.h.repack(
            "stale.zip",
            mutate_record=lambda r: r.__setitem__("predecessor_state_hash", "9" * 64),
        )
        result = accept_exchange(
            pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        self.assertEqual(result["receipt"]["decision"], "STALE")
        self.assertEqual(result["receipt"]["next_state_hash"], "")

    def test_27_secret_canary_leak_is_rejected_even_with_repaired_hashes(self) -> None:
        shadow = self.h.valid_shadow()
        shadow["claims"].append(SECRET_CANARY)
        shadow["shadow_root"] = ""
        shadow["shadow_root"] = sha256_bytes(canonical_json_bytes(shadow))
        pack = self.h.repack(
            "secret.zip",
            artifact_edits={"artifacts/SHADOW.json": canonical_json_bytes(shadow)},
            repair_artifact_bindings=True,
        )
        self.assertInvalid(pack, "secret|canary|forbidden")

    def test_28_pii_canary_leak_is_rejected_even_with_repaired_hashes(self) -> None:
        shadow = canonical_json_bytes({"schema": "nexus.cognition-shadow/v0", "leak": PII_CANARY})
        pack = self.h.repack(
            "pii.zip",
            artifact_edits={"artifacts/SHADOW.json": shadow},
            repair_artifact_bindings=True,
        )
        self.assertInvalid(pack, "personal data|email-shaped")

    def test_29_instruction_execution_canary_is_rejected_but_source_prompt_is_inert(self) -> None:
        # The route already contains the hostile instruction as inert source data.
        verify_exchange_pack(self.h.pack, route_path=self.h.route)
        shadow = self.h.valid_shadow()
        shadow["claims"] = [INSTRUCTION_EXECUTION_CANARY]
        subject = copy.deepcopy(shadow)
        subject["shadow_root"] = ""
        shadow["shadow_root"] = sha256_bytes(canonical_json_bytes(subject))
        pack = self.h.repack(
            "instruction-obeyed.zip",
            artifact_edits={"artifacts/SHADOW.json": canonical_json_bytes(shadow)},
            repair_artifact_bindings=True,
        )
        self.assertInvalid(pack, "instruction|canary")

    def test_30_false_verified_independence_claim_is_rejected(self) -> None:
        pack = self.h.repack(
            "false-independence.zip",
            mutate_record=lambda r: r["producer"].__setitem__("independence", "INDEPENDENT_VERIFIED"),
        )
        self.assertInvalid(pack, "independence")

    # 6. Cognition-shadow source and evidence binding.
    def test_31_source_root_swap_is_rejected_against_routed_source_manifest(self) -> None:
        pack = self.h.repack(
            "source-root-swap.zip", mutate_record=lambda r: r.__setitem__("source_root", "8" * 64)
        )
        self.assertInvalid(pack, "source.*bind|source_root|shadow")

    def test_32_shadow_source_hash_swap_is_rejected_with_all_outer_hashes_repaired(self) -> None:
        shadow = self.h.valid_shadow()
        shadow["sources"][0]["sha256"] = "7" * 64
        shadow["source_root"] = sha256_bytes(
            canonical_json_bytes(
                {source["path"]: source["sha256"] for source in shadow["sources"]}
            )
        )
        subject = copy.deepcopy(shadow)
        subject["shadow_root"] = ""
        shadow["shadow_root"] = sha256_bytes(canonical_json_bytes(subject))

        pack = self.h.repack(
            "shadow-source-swap.zip",
            artifact_edits={"artifacts/SHADOW.json": canonical_json_bytes(shadow)},
            repair_artifact_bindings=True,
        )
        self.assertInvalid(pack, "source.*bind|source.*hash|source_root.*match")

    def test_33_evidence_quote_hash_mismatch_is_rejected(self) -> None:
        shadow = self.h.valid_shadow()
        shadow["evidence_atoms"][0]["locator"]["span_sha256"] = "6" * 64
        subject = copy.deepcopy(shadow)
        subject["shadow_root"] = ""
        shadow["shadow_root"] = sha256_bytes(canonical_json_bytes(subject))
        pack = self.h.repack(
            "quote-mismatch.zip",
            artifact_edits={"artifacts/SHADOW.json": canonical_json_bytes(shadow)},
            repair_artifact_bindings=True,
        )
        self.assertInvalid(pack, "quote|evidence.*bind|line span")

    def test_34_shadow_self_hash_mismatch_is_rejected(self) -> None:
        shadow = self.h.valid_shadow()
        shadow["shadow_root"] = "5" * 64
        pack = self.h.repack(
            "shadow-root-mismatch.zip",
            artifact_edits={"artifacts/SHADOW.json": canonical_json_bytes(shadow)},
            repair_artifact_bindings=True,
        )
        self.assertInvalid(pack, "shadow_root|shadow.*hash")

    # 7. Falsifier, chain integrity, crash recovery, and races.
    def _build_falsifier_pack(self, *, assertion_failed: bool) -> Path:
        shadow = self.h.valid_shadow(include_contradiction=not assertion_failed)
        falsifier = {
            "schema": "nexus.falsifier/v0",
            "falsifier_id": "FAL-1",
            "invariant_id": "INV-PLANTED-CONTRADICTION",
            "assertion": "FAILED" if assertion_failed else "SATISFIED",
            "evidence_refs": ["artifacts/SHADOW.json"],
        }
        self.h.shadow_path.write_bytes(canonical_json_bytes(shadow))
        falsifier_path = self.h.artifact_root / "artifacts" / "FALSIFIER.json"
        falsifier_path.write_bytes(canonical_json_bytes(falsifier))
        draft = json.loads(self.h.draft.read_text(encoding="utf-8"))
        draft["source_root"] = shadow["source_root"]
        draft["artifacts"].append(
            {
                "path": "artifacts/FALSIFIER.json",
                "sha256": "",
                "bytes": 0,
                "media_type": "application/json",
            }
        )
        draft["claims"] = [
            {
                "claim_id": "CLM-1",
                "statement": "The required planted contradiction is present.",
                "classification": "HYPOTHESIS",
                "evidence_refs": ["artifacts/SHADOW.json"],
            }
        ]
        draft["dissent"] = [
            {
                "dissent_id": "DIS-1",
                "claim_id": "CLM-1",
                "status": "FALSIFIER_VALID",
                "reason": "A machine-checkable task invariant failed.",
                "evidence_refs": ["artifacts/FALSIFIER.json"],
            }
        ]
        path = self.root / ("valid-falsifier-draft.json" if assertion_failed else "fake-falsifier-draft.json")
        path.write_bytes(canonical_json_bytes(draft))
        output = self.root / ("valid-falsifier.zip" if assertion_failed else "fake-falsifier.zip")
        build_exchange_pack(path, artifact_root=self.h.artifact_root, route_path=self.h.route, output_path=output)
        return output

    def test_35_machine_recomputed_valid_falsifier_blocks_acceptance(self) -> None:
        pack = self._build_falsifier_pack(assertion_failed=True)
        result = accept_exchange(
            pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        self.assertEqual(result["receipt"]["decision"], "CHALLENGED")
        self.assertIn(
            result["receipt"]["reason_codes"][0], {"FALSIFIER_VALID", "VALID_FALSIFIER"}
        )
        self.assertEqual(verify_exchange_ledger(self.h.ledger)["accepted_count"], 0)

    def test_36_self_declared_but_unsatisfied_falsifier_does_not_block(self) -> None:
        pack = self._build_falsifier_pack(assertion_failed=False)
        result = accept_exchange(
            pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        self.assertNotEqual(result["receipt"]["decision"], "CHALLENGED")

    def test_37_receipt_body_tamper_breaks_self_hash(self) -> None:
        accept_exchange(self.h.pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY)
        receipt = json.loads(self.h.ledger.read_text(encoding="utf-8"))
        receipt["reason_codes"] = ["FORGED"]
        self.h.ledger.write_bytes(canonical_json_bytes(receipt))
        with self.assertRaisesRegex(NexusError, "receipt hash"):
            verify_exchange_ledger(self.h.ledger)

    def test_38_receipt_chain_link_tamper_is_detected_even_after_self_hash_repair(self) -> None:
        first = accept_exchange(
            self.h.pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        draft = json.loads(self.h.draft.read_text(encoding="utf-8"))
        draft["nonce"] = "second-return"
        draft["predecessor_state_hash"] = first["receipt"]["next_state_hash"]
        draft["exchange_id"] = _exchange_id(draft)
        self.h.shadow_path.write_bytes(
            canonical_json_bytes(self.h.valid_shadow(exchange_id=draft["exchange_id"]))
        )
        second_draft = self.root / "second-draft.json"
        second_draft.write_bytes(canonical_json_bytes(draft))
        second_pack = self.root / "second.zip"
        build_exchange_pack(
            second_draft,
            artifact_root=self.h.artifact_root,
            route_path=self.h.route,
            output_path=second_pack,
        )
        accept_exchange(second_pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY)
        lines = [json.loads(line) for line in self.h.ledger.read_text(encoding="utf-8").splitlines()]
        lines[1]["previous_receipt_hash"] = "0" * 64
        lines[1]["receipt_hash"] = _receipt_hash(lines[1])
        self.h.ledger.write_bytes(b"".join(canonical_json_bytes(line) for line in lines))
        with self.assertRaisesRegex(NexusError, "receipt-chain break"):
            verify_exchange_ledger(self.h.ledger)

    def test_39_crash_before_ledger_commit_retries_once(self) -> None:
        with patch.object(exchange_module, "atomic_write_text", side_effect=OSError("crash-before")):
            with self.assertRaises(OSError):
                accept_exchange(
                    self.h.pack,
                    route_path=self.h.route,
                    ledger_path=self.h.ledger,
                    now=BEFORE_EXPIRY,
                )
        self.assertFalse(self.h.ledger.exists())
        retry = accept_exchange(
            self.h.pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        self.assertEqual(retry["receipt"]["decision"], "ACCEPTED")
        self.assertEqual(verify_exchange_ledger(self.h.ledger)["receipt_count"], 1)

    def test_40_crash_after_ledger_commit_recovers_idempotently(self) -> None:
        real_atomic_write = exchange_module.atomic_write_text

        def write_then_crash(path: Path, text: str) -> None:
            real_atomic_write(path, text)
            raise OSError("crash-after")

        with patch.object(exchange_module, "atomic_write_text", side_effect=write_then_crash):
            with self.assertRaises(OSError):
                accept_exchange(
                    self.h.pack,
                    route_path=self.h.route,
                    ledger_path=self.h.ledger,
                    now=BEFORE_EXPIRY,
                )
        retry = accept_exchange(
            self.h.pack, route_path=self.h.route, ledger_path=self.h.ledger, now=AFTER_EXPIRY
        )
        self.assertTrue(retry["idempotent"])
        self.assertEqual(retry["receipt"]["decision"], "ACCEPTED")
        self.assertEqual(verify_exchange_ledger(self.h.ledger)["receipt_count"], 1)

    def test_41_concurrent_exact_replay_has_one_accepting_writer(self) -> None:
        start = threading.Barrier(2)

        def worker():
            start.wait(timeout=5)
            return accept_exchange(
                self.h.pack,
                route_path=self.h.route,
                ledger_path=self.h.ledger,
                now=BEFORE_EXPIRY,
            )

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = [future.result() for future in [pool.submit(worker), pool.submit(worker)]]
        accepting_writers = sum(
            not result["idempotent"] and result["receipt"]["decision"] == "ACCEPTED"
            for result in results
        )
        self.assertEqual(accepting_writers, 1)
        self.assertEqual(verify_exchange_ledger(self.h.ledger)["accepted_count"], 1)

    def test_42_competing_returns_from_one_predecessor_cannot_both_accept(self) -> None:
        first_pack = self.h.pack
        second_pack = self.h.repack(
            "competing.zip", mutate_record=lambda r: r.__setitem__("nonce", "competing-return")
        )
        first = accept_exchange(
            first_pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        second = accept_exchange(
            second_pack, route_path=self.h.route, ledger_path=self.h.ledger, now=BEFORE_EXPIRY
        )
        self.assertEqual(first["receipt"]["decision"], "ACCEPTED")
        self.assertEqual(second["receipt"]["decision"], "CHALLENGED")
        self.assertIn("COMPETING_RETURN", second["receipt"]["reason_codes"])
        self.assertEqual(verify_exchange_ledger(self.h.ledger)["accepted_count"], 1)

    def test_43_verifier_only_secret_and_pii_canaries_never_enter_producer_route(self) -> None:
        entries = _read_entries(self.h.route)
        route_bytes = b"\n".join(entries.values())
        self.assertNotIn(SECRET_CANARY.encode("utf-8"), route_bytes)
        self.assertNotIn(PII_CANARY.encode("utf-8"), route_bytes)
        self.assertNotIn("excluded/04_canaries.txt", entries)


if __name__ == "__main__":
    unittest.main()
