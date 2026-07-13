from __future__ import annotations

import base64
import hashlib
import json
import re
import subprocess
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

from experiments.R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL.export_closed_transcript import (
    export_closed_transcript,
)
from experiments.R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL.generate_fixture import rebuild
from system.nexus_lab.durable_store import apply_transfer, audit_store, init_store
from system.nexus_lab.util import NexusError
from system.nexus_lab.value_kernel import canonical_bytes, tagged_hash


ROOT = Path(__file__).resolve().parents[1]
ROUND = ROOT / "experiments" / "R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL"
VERIFIER = ROUND / "independent_transcript_verifier.mjs"
TRANSCRIPT = ROUND / "fixtures" / "CLOSED_TRANSCRIPT.json"
ANCHOR = ROUND / "fixtures" / "EXTERNAL_ANCHOR.json"
COLD_REPORT = (
    ROOT
    / "operations/receipts/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL"
    / "COLD_VERIFIER_REPORT.json"
)
UNANCHORED_REPORT = COLD_REPORT.with_name("COLD_UNANCHORED_REPORT.json")

R014_FROZEN_SHA256 = {
    "system/nexus_lab/durable_store.py": "738d8e0222d77741946db66d884689ec90223b28864816cea19e8d5c04c60113",
    "system/nexus_lab/cli.py": "ba8e963a4f29330e565bbc4633ea710019ed878bd402392f03245dbade6a1a4f",
    "system/nexus_lab/status.py": "2ef1778234a7b03a47043087a097e362a9c9228f8944871c62274e05bbb01c55",
    "system/nexus_lab/verify.py": "c37430ae89933633aa50ac6925a02358e240c0a688aa5fbf56d7a8e86002dbfc",
    "tests/test_r014_durable_replay.py": "7297ad30a5da1cf14f275cf9b289e302f0847aa20e23e02a18abe712cae8eb99",
    "constitution/schemas/pcx-durable-anchor.schema.json": "3a5605890cbd24ef029ef6e4953d5130e534b276c245180639127ab32c1ac264",
    "experiments/R013_PCX_CONSERVED_CLAIM/fixtures/SUITE.json": "a6ab4fde497b64395767edd1c8e652994e1bfeff0ca258fc661913918329c27b",
    "operations/tasks/TSK-R014-PCX-DURABLE-REPLAY.json": "28638c1950620593655209135d10b831f4d329d6f1ea8a826dd4ce01b12242d1",
    "operations/receipts/R014_PCX_DURABLE_REPLAY/DEMO_REPORT.json": "674a4f5ceecf2861a63b386fb723ba318342ae477cb006abc69bdcb77f47ee6f",
    "operations/receipts/R014_PCX_DURABLE_REPLAY/PROMOTION.json": "3f3db6f8b4629f2365b529ac9f25b599d883ff91b22ab1a72385fa9eeb87312c",
}


def _run_cold(transcript: Path, *anchors: Path) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["node", str(VERIFIER), str(transcript), *(str(item) for item in anchors)],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=60,
    )


def _reseal_transcript(value: dict[str, object]) -> None:
    value["transcript_id"] = ""
    value["transcript_id"] = tagged_hash(
        "NEXUS/PCX/CLOSED-DURABLE-TRANSCRIPT/V0",
        canonical_bytes(value),
    )


def _reseal_anchor(value: dict[str, object]) -> None:
    value["anchor_id"] = ""
    value["anchor_id"] = tagged_hash(
        "NEXUS/PCX/DURABLE-ANCHOR/V0",
        canonical_bytes(value),
    )


def _record_hash(record: dict[str, object], transcript: dict[str, object]) -> str:
    subject = {
        "schema": "nexus.pcx-durable-record/v0",
        "network_id": transcript["network_id"],
        "genesis_id": transcript["genesis_id"],
        "sequence": record["sequence"],
        "previous_record_hash": record["previous_record_hash"],
        "tx_id": record["tx_id"],
        "tx_sha256": record["tx_sha256"],
        "previous_state_root": record["previous_state_root"],
        "next_state_root": record["next_state_root"],
        "receipt_hash": record["receipt_hash"],
        "receipt_raw_sha256": record["receipt_raw_sha256"],
        "status_authority": "NONE",
    }
    return tagged_hash("NEXUS/PCX/DURABLE-RECORD/V0", canonical_bytes(subject))


def _replace_encoded_json(
    record: dict[str, object],
    field: str,
    mutate: object,
    *,
    update_raw_hash: bool = True,
) -> None:
    raw = base64.b64decode(str(record[field]))
    value = json.loads(raw)
    mutate(value)
    changed = canonical_bytes(value)
    record[field] = base64.b64encode(changed).decode("ascii")
    if update_raw_hash:
        hash_field = "tx_sha256" if field == "tx_b64" else "receipt_raw_sha256"
        record[hash_field] = hashlib.sha256(changed).hexdigest()


class R015IndependentDurabilityVerifierTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.good = json.loads(TRANSCRIPT.read_text(encoding="utf-8"))
        cls.tip = json.loads(ANCHOR.read_text(encoding="utf-8"))

    def _write_json(self, directory: Path, name: str, value: object) -> Path:
        path = directory / name
        path.write_bytes(canonical_bytes(value))
        return path

    def _export_history(
        self,
        directory: Path,
        history_id: str,
        accepted_case_ids: tuple[str, ...],
        stem: str,
    ) -> tuple[Path, dict[str, object]]:
        suite = json.loads(
            (ROOT / "experiments/R013_PCX_CONSERVED_CLAIM/fixtures/SUITE.json").read_text()
        )
        history = next(item for item in suite["histories"] if item["history_id"] == history_id)
        cases = {item["case_id"]: item["raw_b64"] for item in history["cases"]}
        db = directory / (stem + ".sqlite3")
        output = directory / (stem + ".json")
        init_store(ROOT, db)
        for case_id in accepted_case_ids:
            apply_transfer(ROOT, db, base64.b64decode(cases[case_id], validate=True))
        export_closed_transcript(ROOT, db, output)
        return output, json.loads(output.read_text(encoding="utf-8"))

    def test_r014_hash_bound_inputs_remain_exact(self) -> None:
        for relative, expected in R014_FROZEN_SHA256.items():
            with self.subTest(path=relative):
                path = ROOT / relative
                self.assertTrue(path.is_file(), relative)
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), expected)

    def test_untrusted_fixture_export_rebuilds_byte_for_byte(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r015-rebuild-") as work:
            paths = rebuild(ROOT, Path(work) / "fixture")
            self.assertEqual(paths["transcript"].read_bytes(), TRANSCRIPT.read_bytes())
            self.assertEqual(paths["anchor"].read_bytes(), ANCHOR.read_bytes())

    def test_outer_resealer_reproduces_frozen_transcript_id(self) -> None:
        value = deepcopy(self.good)
        expected = value["transcript_id"]
        _reseal_transcript(value)
        self.assertEqual(value["transcript_id"], expected)

    def test_transcript_export_rejects_sqlite_sidecar_namespace(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r015-sidecars-") as work:
            db = Path(work) / "store.sqlite3"
            init_store(ROOT, db)
            for suffix in ("", "-journal", "-wal", "-shm"):
                with self.subTest(suffix=suffix):
                    output = Path(str(db) + suffix)
                    with self.assertRaises(NexusError):
                        export_closed_transcript(ROOT, db, output)
                    if suffix:
                        self.assertFalse(output.exists())
                    else:
                        self.assertTrue(db.is_file())
                    self.assertEqual(audit_store(ROOT, db)["status"], "PASS")

    def test_cold_verifier_converges_anchored_and_unanchored(self) -> None:
        anchored = _run_cold(TRANSCRIPT, ANCHOR)
        self.assertEqual(anchored.returncode, 0, anchored.stderr.decode())
        self.assertEqual(anchored.stdout, COLD_REPORT.read_bytes())
        anchored_report = json.loads(anchored.stdout)
        self.assertEqual(anchored.stdout, canonical_bytes(anchored_report) + b"\n")
        self.assertEqual(anchored_report["status"], "PASS")
        self.assertEqual(anchored_report["rollback_check"], "ANCHORED_PREFIX_CONFIRMED")
        self.assertEqual(anchored_report["record_count"], "4")
        self.assertEqual(
            anchored_report["final_state_root"],
            "1b28ac32d6067a7b1bd2ec8b7097b341d891a2793a63c606da0c9eecf221598f",
        )
        self.assertEqual(
            anchored_report["receipt_head"],
            "fedc92b971f0ea59586678297a981c950d2ac8646e8cf30f79bffc7537893ffc",
        )
        self.assertEqual(anchored_report["total_supply"], "1000")
        self.assertEqual(anchored_report["status_authority"], "NONE")
        self.assertEqual(
            anchored_report["anchor_provenance"],
            "UNAUTHENTICATED_CALLER_SUPPLIED_INTEGRITY_OBSERVATION",
        )
        self.assertEqual(anchored_report["highest_confirmed_sequence"], "4")
        self.assertEqual(anchored_report["terminal_anchor_confirmed"], "TRUE")
        self.assertEqual(anchored_report["unconfirmed_suffix_count"], "0")
        self.assertEqual(
            anchored_report["matched_external_anchors"],
            [{"anchor_id": self.tip["anchor_id"], "sequence": "4"}],
        )

        unanchored = _run_cold(TRANSCRIPT)
        self.assertEqual(unanchored.returncode, 0, unanchored.stderr.decode())
        self.assertEqual(unanchored.stdout, UNANCHORED_REPORT.read_bytes())
        unanchored_report = json.loads(unanchored.stdout)
        self.assertEqual(unanchored_report["rollback_check"], "UNANCHORED")
        self.assertEqual(unanchored_report["confirmed_external_anchor_ids"], [])
        self.assertEqual(unanchored_report["matched_external_anchors"], [])
        self.assertEqual(unanchored_report["highest_confirmed_sequence"], "")
        self.assertEqual(unanchored_report["terminal_anchor_confirmed"], "FALSE")
        self.assertEqual(unanchored_report["unconfirmed_suffix_count"], "4")

    def test_resealed_inner_mutations_fail_without_touching_input(self) -> None:
        def invalid_signature(value: dict[str, object]) -> None:
            _replace_encoded_json(
                value["records"][0],
                "tx_b64",
                lambda tx: tx["witnesses"][0].__setitem__("signature", "0" * 128),
            )

        def invalid_amount(value: dict[str, object]) -> None:
            _replace_encoded_json(
                value["records"][0],
                "tx_b64",
                lambda tx: tx["outputs"][0].__setitem__("amount", "1001"),
            )

        def invalid_index(value: dict[str, object]) -> None:
            _replace_encoded_json(
                value["records"][0],
                "tx_b64",
                lambda tx: tx["inputs"][0].__setitem__("output_index", "8"),
            )

        def divergent_receipt(value: dict[str, object]) -> None:
            _replace_encoded_json(
                value["records"][0],
                "receipt_b64",
                lambda receipt: receipt.__setitem__("reason_code", "ALTERED_REASON"),
            )

        def altered_embedded_anchor(value: dict[str, object]) -> None:
            value["anchors"][2]["state_root"] = "0" * 64
            _reseal_anchor(value["anchors"][2])

        def altered_terminal_anchor(value: dict[str, object]) -> None:
            value["terminal_anchor"]["state_root"] = "0" * 64
            _reseal_anchor(value["terminal_anchor"])

        def altered_embedded_terminal(value: dict[str, object]) -> None:
            changed = deepcopy(value["anchors"][-1])
            changed["state_root"] = "0" * 64
            _reseal_anchor(changed)
            value["anchors"][-1] = changed
            value["terminal_anchor"] = deepcopy(changed)

        mutations = {
            "wrong-count": lambda value: value.__setitem__("record_count", "3"),
            "alternate-domain": lambda value: value.__setitem__("network_id", "OTHER"),
            "hybrid-root": lambda value: value["records"][1].__setitem__("next_state_root", "0" * 64),
            "broken-link": lambda value: value["records"][2].__setitem__("previous_record_hash", "1" * 64),
            "record-hash": lambda value: value["records"][1].__setitem__("record_hash", "0" * 64),
            "tx-raw-sha": lambda value: value["records"][0].__setitem__("tx_sha256", "0" * 64),
            "receipt-raw-sha": lambda value: value["records"][0].__setitem__("receipt_raw_sha256", "0" * 64),
            "invalid-base64": lambda value: value["records"][0].__setitem__("tx_b64", "!"),
            "sequence-gap": lambda value: value["records"][1].__setitem__("sequence", "3"),
            "sequence-duplicate": lambda value: value["records"][1].__setitem__("sequence", "1"),
            "record-reorder": lambda value: value["records"].__setitem__(slice(1, 3), [value["records"][2], value["records"][1]]),
            "authority": lambda value: value["records"][0].__setitem__("status_authority", "PROMOTED"),
            "missing-prefix-anchor": lambda value: value["anchors"].pop(2),
            "extra-prefix-anchor": lambda value: value["anchors"].append(deepcopy(value["anchors"][-1])),
            "valid-altered-prefix-anchor": altered_embedded_anchor,
            "valid-altered-terminal-anchor": altered_terminal_anchor,
            "valid-altered-embedded-terminal": altered_embedded_terminal,
            "invalid-signature-with-updated-raw-sha": invalid_signature,
            "invalid-amount-with-updated-raw-sha": invalid_amount,
            "invalid-index-with-updated-raw-sha": invalid_index,
            "canonical-receipt-divergence-with-updated-raw-sha": divergent_receipt,
        }
        with tempfile.TemporaryDirectory(prefix="nexus-r015-hostile-") as work:
            directory = Path(work)
            for name, mutate in mutations.items():
                with self.subTest(name=name):
                    value = deepcopy(self.good)
                    mutate(value)
                    _reseal_transcript(value)
                    path = self._write_json(directory, name + ".json", value)
                    before = path.read_bytes()
                    result = _run_cold(path)
                    self.assertNotEqual(result.returncode, 0, result.stdout)
                    self.assertEqual(result.stdout, b"")
                    self.assertEqual(path.read_bytes(), before)

    def test_malformed_and_oversized_raw_inputs_fail_without_touching_input(self) -> None:
        raw = TRANSCRIPT.read_bytes()
        duplicate_key = (
            b'{"schema":"nexus.pcx-closed-durable-transcript/v0",'
            b'"schema":"nexus.pcx-closed-durable-transcript/v0",' + raw[1:]
        )
        cases = {
            "bom": b"\xef\xbb\xbf" + raw,
            "duplicate-key": duplicate_key,
            "leading-whitespace": b" " + raw,
            "trailing-whitespace": raw + b"\n",
            "invalid-utf8": b"\xff" + raw,
            "oversized": b" " * (32 * 1024 * 1024 + 1),
        }
        with tempfile.TemporaryDirectory(prefix="nexus-r015-raw-") as work:
            directory = Path(work)
            for name, hostile in cases.items():
                with self.subTest(name=name):
                    path = directory / (name + ".json")
                    path.write_bytes(hostile)
                    before = hashlib.sha256(hostile).digest()
                    result = _run_cold(path)
                    self.assertNotEqual(result.returncode, 0, result.stdout)
                    self.assertEqual(result.stdout, b"")
                    self.assertEqual(hashlib.sha256(path.read_bytes()).digest(), before)

    def test_duplicate_exact_retry_cannot_be_a_second_durable_record(self) -> None:
        value = deepcopy(self.good)
        duplicate = deepcopy(value["records"][-1])
        duplicate["sequence"] = "5"
        duplicate["previous_record_hash"] = value["records"][-1]["record_hash"]
        duplicate["previous_state_root"] = value["records"][-1]["next_state_root"]
        duplicate["next_state_root"] = value["records"][-1]["next_state_root"]
        duplicate["record_hash"] = _record_hash(duplicate, value)
        value["records"].append(duplicate)
        extra_anchor = {
            "schema": "nexus.pcx-durable-anchor/v0",
            "network_id": value["network_id"],
            "genesis_id": value["genesis_id"],
            "sequence": "5",
            "record_hash": duplicate["record_hash"],
            "state_root": duplicate["next_state_root"],
            "receipt_head": duplicate["receipt_hash"],
            "status_authority": "NONE",
            "anchor_id": "",
        }
        _reseal_anchor(extra_anchor)
        value["anchors"].append(extra_anchor)
        value["terminal_anchor"] = deepcopy(extra_anchor)
        value["record_count"] = "5"
        _reseal_transcript(value)
        with tempfile.TemporaryDirectory(prefix="nexus-r015-retry-") as work:
            path = self._write_json(Path(work), "duplicate-retry.json", value)
            result = _run_cold(path)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, b"")

    def test_external_anchor_classification_and_honest_prefix_limit(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r015-anchor-") as work:
            directory = Path(work)
            earlier = self._write_json(directory, "earlier.json", self.good["anchors"][2])
            confirmed = _run_cold(TRANSCRIPT, earlier)
            self.assertEqual(confirmed.returncode, 0, confirmed.stderr.decode())
            earlier_report = json.loads(confirmed.stdout)
            self.assertEqual(earlier_report["rollback_check"], "ANCHORED_PREFIX_CONFIRMED")
            self.assertEqual(earlier_report["highest_confirmed_sequence"], "2")
            self.assertEqual(earlier_report["terminal_anchor_confirmed"], "FALSE")
            self.assertEqual(earlier_report["unconfirmed_suffix_count"], "2")

            genesis = self._write_json(directory, "genesis.json", self.good["anchors"][0])
            genesis_confirmed = _run_cold(TRANSCRIPT, genesis)
            self.assertEqual(genesis_confirmed.returncode, 0, genesis_confirmed.stderr.decode())
            genesis_report = json.loads(genesis_confirmed.stdout)
            self.assertEqual(genesis_report["highest_confirmed_sequence"], "0")
            self.assertEqual(genesis_report["terminal_anchor_confirmed"], "FALSE")
            self.assertEqual(genesis_report["unconfirmed_suffix_count"], "4")

            future_value = deepcopy(self.tip)
            future_value["sequence"] = "5"
            _reseal_anchor(future_value)
            future = self._write_json(directory, "future.json", future_value)
            rolled_back = _run_cold(TRANSCRIPT, future)
            self.assertNotEqual(rolled_back.returncode, 0)
            self.assertEqual(rolled_back.stderr, b"ANCHOR_AHEAD_OF_TRANSCRIPT\n")

            fork_value = deepcopy(self.tip)
            fork_value["state_root"] = "0" * 64
            _reseal_anchor(fork_value)
            fork = self._write_json(directory, "fork.json", fork_value)
            divergent = _run_cold(TRANSCRIPT, fork)
            self.assertNotEqual(divergent.returncode, 0)
            self.assertEqual(divergent.stderr, b"ANCHOR_TRANSCRIPT_MISMATCH\n")

            malformed_value = deepcopy(self.tip)
            malformed_value["anchor_id"] = "0" * 64
            malformed = self._write_json(directory, "malformed.json", malformed_value)
            invalid = _run_cold(TRANSCRIPT, malformed)
            self.assertNotEqual(invalid.returncode, 0)
            self.assertEqual(invalid.stderr, b"ANCHOR_INVALID\n")

            malformed_shape_value = deepcopy(self.tip)
            malformed_shape_value.pop("status_authority")
            malformed_shape = self._write_json(
                directory, "malformed-shape.json", malformed_shape_value
            )
            invalid_shape = _run_cold(TRANSCRIPT, malformed_shape)
            self.assertNotEqual(invalid_shape.returncode, 0)
            self.assertEqual(invalid_shape.stderr, b"ANCHOR_INVALID\n")

            duplicate = _run_cold(TRANSCRIPT, ANCHOR, ANCHOR)
            self.assertNotEqual(duplicate.returncode, 0)
            self.assertEqual(duplicate.stdout, b"")
            self.assertEqual(duplicate.stderr, b"ANCHOR_INVALID\n")

            excessive = _run_cold(TRANSCRIPT, *([ANCHOR] * 258))
            self.assertNotEqual(excessive.returncode, 0)
            self.assertEqual(excessive.stdout, b"")
            self.assertEqual(excessive.stderr, b"ANCHOR_INVALID\n")

    def test_older_valid_transcript_passes_unanchored_but_newer_anchor_is_ahead(self) -> None:
        value = deepcopy(self.good)
        value["records"] = value["records"][:2]
        value["anchors"] = value["anchors"][:3]
        value["terminal_anchor"] = deepcopy(value["anchors"][-1])
        value["record_count"] = "2"
        _reseal_transcript(value)
        with tempfile.TemporaryDirectory(prefix="nexus-r015-older-") as work:
            path = self._write_json(Path(work), "older.json", value)
            unanchored = _run_cold(path)
            self.assertEqual(unanchored.returncode, 0, unanchored.stderr.decode())
            report = json.loads(unanchored.stdout)
            self.assertEqual(report["record_count"], "2")
            self.assertEqual(report["rollback_check"], "UNANCHORED")
            self.assertEqual(report["highest_confirmed_sequence"], "")
            self.assertEqual(report["unconfirmed_suffix_count"], "2")

            ahead = _run_cold(path, ANCHOR)
            self.assertNotEqual(ahead.returncode, 0)
            self.assertEqual(ahead.stdout, b"")
            self.assertEqual(ahead.stderr, b"ANCHOR_AHEAD_OF_TRANSCRIPT\n")

    def test_common_prefix_anchor_confirms_two_divergent_suffixes_without_choice(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nexus-r015-forks-") as work:
            directory = Path(work)
            c_path, c_value = self._export_history(
                directory,
                "COMPETING-C-FIRST",
                ("VALID-COMMON-PARENT", "VALID-FIRST-SPEND-TO-C"),
                "c-first",
            )
            d_path, d_value = self._export_history(
                directory,
                "COMPETING-D-FIRST",
                ("VALID-COMMON-PARENT", "VALID-FIRST-SPEND-TO-D"),
                "d-first",
            )
            self.assertEqual(c_value["anchors"][1], d_value["anchors"][1])
            self.assertNotEqual(c_value["terminal_anchor"], d_value["terminal_anchor"])
            common = self._write_json(directory, "common-anchor.json", c_value["anchors"][1])

            for transcript in (c_path, d_path):
                with self.subTest(transcript=transcript.name):
                    result = _run_cold(transcript, common)
                    self.assertEqual(result.returncode, 0, result.stderr.decode())
                    report = json.loads(result.stdout)
                    self.assertEqual(report["highest_confirmed_sequence"], "1")
                    self.assertEqual(report["terminal_anchor_confirmed"], "FALSE")
                    self.assertEqual(report["unconfirmed_suffix_count"], "1")

    def test_cold_source_has_only_admitted_imports_and_no_producer_bridge(self) -> None:
        source = VERIFIER.read_text(encoding="utf-8")
        imports = re.findall(r"^import .*? from ['\"]([^'\"]+)['\"];?$", source, re.MULTILINE)
        imports += re.findall(r"^import ['\"]([^'\"]+)['\"];?$", source, re.MULTILINE)
        admitted = {
            "node:crypto",
            "node:fs",
            "node:fs/promises",
            "node:process",
            "node:util",
            "@noble/ed25519",
        }
        self.assertTrue(imports, "The cold verifier should declare its small import surface.")
        self.assertTrue(set(imports).issubset(admitted), imports)
        for forbidden in (
            "child_process",
            "node:http",
            "node:https",
            "node:net",
            "node:tls",
            "durable_store",
            "system/nexus_lab",
            "independent_verifier.mjs",
            "sqlite3",
            "fetch(",
            "import(",
            "require(",
            "getBuiltinModule",
            "eval(",
            "Function(",
            "WebAssembly",
            "spawn(",
            "execFile(",
        ):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()
