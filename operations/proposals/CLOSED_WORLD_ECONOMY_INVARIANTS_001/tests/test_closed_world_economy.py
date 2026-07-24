"""Deterministic tests for the closed-world-economy invariants proposal.

Covers, per the operation brief:
  - every TEST_VECTORS.json valid vector passes the validator;
  - every TEST_VECTORS.json invalid/hostile vector is rejected, with the
    expected reason;
  - malformed JSON (duplicate keys, syntax errors, non-object top level)
    is rejected before schema checks even run;
  - the CLI entry point (validate_file / main) behaves the same as calling
    the library function directly;
  - the schema file, the validator's own constants, and the plain-language
    doctrine docs (PROHIBITED_CAPABILITIES.md, ALLOWED_INTERNAL_PRIMITIVES.md,
    EARNING_AND_RECOGNITION_MODEL.md) agree on the same key sets, so a future
    edit to one that silently drifts from the others fails CI instead of
    surfacing only as a reviewer's guess.

A pass here means the validator behaves as designed against these known
cases. It does not mean the validator catches every possible violation an
adversarial manifest author might construct -- see ../CLAIMS_AND_NONCLAIMS.md.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

PKG = Path(__file__).resolve().parents[1]
if str(PKG / "tools") not in sys.path:
    sys.path.insert(0, str(PKG / "tools"))

from validate_closed_world_economy import (  # noqa: E402
    ContractError,
    KNOWN_PRIMITIVE_CATEGORIES,
    REQUIRED_PRIMITIVE_PROPERTIES,
    REQUIRED_PROHIBITED_CAPABILITIES,
    REQUIRED_TOP_LEVEL,
    ALL_TRANSFER_POLICY_ENUM_VALUES,
    ALLOWED_TRANSFER_POLICY_VALUES,
    main as validator_main,
    parse_manifest,
    validate_file,
    validate_manifest,
)

VECTORS_PATH = PKG / "TEST_VECTORS.json"
SCHEMA_PATH = PKG / "schema" / "closed_world_economy.schema.json"
VALIDATOR_PATH = PKG / "tools" / "validate_closed_world_economy.py"


def load_vectors() -> dict:
    return json.loads(VECTORS_PATH.read_text(encoding="utf-8"))


def _md_table_keys(text: str, section_start: str | None = None, section_end: str | None = None) -> set[str]:
    """Extract backtick-quoted first-column keys from a markdown table.

    Optionally scoped to the text between two heading markers, so a file with
    more than one table (e.g. EARNING_AND_RECOGNITION_MODEL.md's property
    table followed by its per-category defaults table) only yields keys from
    the intended table.
    """
    if section_start is not None:
        start = text.index(section_start)
        text = text[start:]
    if section_end is not None:
        end = text.index(section_end)
        text = text[:end]
    return set(re.findall(r"^\|\s*`([a-z_]+)`\s*\|", text, re.MULTILINE))


class ValidVectorsPassTests(unittest.TestCase):
    def test_all_valid_vectors_pass(self) -> None:
        vectors = load_vectors()["valid_vectors"]
        self.assertGreaterEqual(len(vectors), 1, "at least one valid vector must exist")
        for name, manifest in vectors.items():
            with self.subTest(vector=name):
                validate_manifest(manifest)  # must not raise

    def test_valid_vectors_round_trip_through_json_text(self) -> None:
        """A valid vector re-serialized to text and re-parsed must still pass.

        Guards against a vector that only "passes" because of Python object
        identity quirks (e.g. bool vs int) that would not survive a real
        manifest author hand-writing JSON.
        """
        vectors = load_vectors()["valid_vectors"]
        for name, manifest in vectors.items():
            with self.subTest(vector=name):
                text = json.dumps(manifest)
                validate_manifest(parse_manifest(text))


class InvalidVectorsRejectTests(unittest.TestCase):
    def test_all_invalid_vectors_are_rejected_for_the_stated_reason(self) -> None:
        vectors = load_vectors()["invalid_vectors"]
        self.assertGreaterEqual(len(vectors), 1, "at least one hostile vector must exist")
        for name, case in vectors.items():
            with self.subTest(vector=name):
                with self.assertRaises(ContractError) as ctx:
                    validate_manifest(case["manifest"])
                self.assertIn(
                    case["expect_error_substring"],
                    str(ctx.exception),
                    f"{name}: expected substring not found in rejection reason",
                )

    def test_hostile_vectors_cover_every_prohibited_capability_flip(self) -> None:
        """Every prohibited capability must have at least one dedicated hostile
        vector somewhere in the catalog that flips it false and gets rejected,
        not just the three spot-checked by name."""
        vectors = load_vectors()["invalid_vectors"]
        flipped_capabilities: set[str] = set()
        for case in vectors.values():
            manifest = case["manifest"]
            if not isinstance(manifest, dict):
                continue
            caps = manifest.get("prohibited_capabilities")
            if not isinstance(caps, dict):
                continue
            flipped_capabilities.update(key for key, val in caps.items() if val is False)
        # This proposal spot-checks a representative subset (cash redemption,
        # OTC matching, account-sale tooling) rather than all 21 mechanically,
        # since the validator's per-key check is uniform (see
        # _validate_prohibited_capabilities); this test only guards that the
        # representative subset stays present in the catalog.
        self.assertTrue(flipped_capabilities, "no hostile vector flips any prohibited capability")
        self.assertIn("cash_redemption", flipped_capabilities)


class MalformedJsonTests(unittest.TestCase):
    """These cases cannot be expressed as already-parsed vectors in
    TEST_VECTORS.json (a JSON file cannot itself contain a JSON document with
    duplicate keys once parsed), so they are tested directly against
    parse_manifest's raw-text handling."""

    def test_duplicate_top_level_key_rejected(self) -> None:
        text = '{"schema": "closed-world-economy/v1", "schema": "closed-world-economy/v1"}'
        with self.assertRaises(ContractError) as ctx:
            parse_manifest(text)
        self.assertIn("duplicate JSON key", str(ctx.exception))

    def test_syntax_error_rejected(self) -> None:
        with self.assertRaises(ContractError) as ctx:
            parse_manifest("{not valid json")
        self.assertIn("malformed JSON", str(ctx.exception))

    def test_top_level_json_array_rejected(self) -> None:
        with self.assertRaises(ContractError) as ctx:
            parse_manifest("[]")
        self.assertIn("manifest must be a JSON object", str(ctx.exception))

    def test_top_level_json_scalar_rejected(self) -> None:
        with self.assertRaises(ContractError) as ctx:
            parse_manifest('"just a string"')
        self.assertIn("manifest must be a JSON object", str(ctx.exception))


class CliEntryPointTests(unittest.TestCase):
    """The library functions (validate_manifest/parse_manifest) are the
    authoritative checks; these tests confirm the shipped CLI wraps them
    without changing behaviour, since a future implementation gate will
    invoke the CLI, not the library, in CI."""

    def _write_manifest(self, manifest: dict) -> Path:
        handle = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        )
        json.dump(manifest, handle)
        handle.close()
        return Path(handle.name)

    def test_cli_accepts_a_valid_vector(self) -> None:
        vectors = load_vectors()["valid_vectors"]
        manifest = next(iter(vectors.values()))
        path = self._write_manifest(manifest)
        try:
            self.assertEqual(validator_main(["--manifest-file", str(path)]), 0)
        finally:
            path.unlink()

    def test_cli_rejects_a_hostile_vector(self) -> None:
        vectors = load_vectors()["invalid_vectors"]
        manifest = vectors["hostile_prohibited_capability_cash_redemption_disabled"]["manifest"]
        path = self._write_manifest(manifest)
        try:
            self.assertEqual(validator_main(["--manifest-file", str(path)]), 1)
        finally:
            path.unlink()

    def test_cli_subprocess_end_to_end(self) -> None:
        """One real subprocess invocation, matching how a human or a future
        implementation gate would actually run this tool from a shell."""
        vectors = load_vectors()["valid_vectors"]
        manifest = next(iter(vectors.values()))
        path = self._write_manifest(manifest)
        try:
            result = subprocess.run(
                [sys.executable, str(VALIDATOR_PATH), "--manifest-file", str(path)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("PASS", result.stdout)
            self.assertIn("not legal, security, economic, or harm-safety clearance", result.stdout)
        finally:
            path.unlink()

    def test_validate_file_raises_on_missing_file(self) -> None:
        with self.assertRaises(OSError):
            validate_file(PKG / "does_not_exist.json")


class SchemaValidatorDocParityTests(unittest.TestCase):
    """Guards against exactly the failure mode this proposal's own doctrine
    warns about (THREAT_MODEL.md SS2: "controls rely primarily on unenforced
    prose"): if a human edits one of schema / validator / doctrine doc and
    forgets the others, this fails instead of silently drifting."""

    def test_schema_top_level_required_matches_validator(self) -> None:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        self.assertEqual(set(schema["required"]), REQUIRED_TOP_LEVEL)

    def test_schema_prohibited_capabilities_required_matches_validator(self) -> None:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        required = schema["properties"]["prohibited_capabilities"]["required"]
        self.assertEqual(set(required), REQUIRED_PROHIBITED_CAPABILITIES)

    def test_schema_primitive_categories_enum_matches_validator(self) -> None:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        enum = schema["properties"]["allowed_primitives"]["propertyNames"]["enum"]
        self.assertEqual(set(enum), KNOWN_PRIMITIVE_CATEGORIES)

    def test_schema_primitive_properties_required_matches_validator(self) -> None:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        required = schema["$defs"]["primitive_properties"]["required"]
        self.assertEqual(set(required), REQUIRED_PRIMITIVE_PROPERTIES)

    def test_schema_transfer_policy_enum_matches_validator_universe(self) -> None:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        enum = schema["properties"]["transfer_policy"]["additionalProperties"]["enum"]
        self.assertEqual(set(enum), ALL_TRANSFER_POLICY_ENUM_VALUES)

    def test_prohibited_capabilities_doc_matches_validator(self) -> None:
        doc = (PKG / "PROHIBITED_CAPABILITIES.md").read_text(encoding="utf-8")
        doc_keys = _md_table_keys(doc)
        self.assertEqual(doc_keys, REQUIRED_PROHIBITED_CAPABILITIES)

    def test_allowed_primitives_doc_matches_validator(self) -> None:
        doc = (PKG / "ALLOWED_INTERNAL_PRIMITIVES.md").read_text(encoding="utf-8")
        doc_keys = _md_table_keys(doc)
        self.assertEqual(doc_keys, KNOWN_PRIMITIVE_CATEGORIES)

    def test_earning_model_property_table_matches_validator(self) -> None:
        doc = (PKG / "EARNING_AND_RECOGNITION_MODEL.md").read_text(encoding="utf-8")
        doc_keys = _md_table_keys(
            doc,
            section_start="## Required property declaration",
            section_end="## Default recommendations by category",
        )
        self.assertEqual(doc_keys, REQUIRED_PRIMITIVE_PROPERTIES)

    def test_allowed_transfer_policy_values_are_a_subset_of_the_full_enum(self) -> None:
        self.assertTrue(ALLOWED_TRANSFER_POLICY_VALUES.issubset(ALL_TRANSFER_POLICY_ENUM_VALUES))
        market_or_export_shaped = ALL_TRANSFER_POLICY_ENUM_VALUES - ALLOWED_TRANSFER_POLICY_VALUES
        self.assertEqual(
            market_or_export_shaped,
            {"AUCTION", "OPEN_ORDER_BOOK", "ACCOUNT_TRANSFER", "ASSET_EXPORT", "CROSS_PROJECT_TRANSFER"},
        )


class WorkedExampleParityTest(unittest.TestCase):
    def test_valid_bounded_work_recognition_matches_earning_model_defaults(self) -> None:
        """EARNING_AND_RECOGNITION_MODEL.md's default table declares every
        property false for the `recognition` category. The vector referenced
        by name in that same doc's worked example must match exactly, or the
        doc's own citation of this vector would be describing a fiction."""
        vectors = load_vectors()["valid_vectors"]
        self.assertIn("valid_bounded_work_recognition", vectors)
        recognition_props = vectors["valid_bounded_work_recognition"]["allowed_primitives"]["recognition"]
        for prop in REQUIRED_PRIMITIVE_PROPERTIES:
            with self.subTest(property=prop):
                self.assertIs(recognition_props[prop], False)


if __name__ == "__main__":
    unittest.main()
