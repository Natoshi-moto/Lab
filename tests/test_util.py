from __future__ import annotations

import unittest

from system.nexus_lab.util import NexusError, canonical_json_bytes, parse_manifest, sha256_bytes, validate_identifier, validate_relative_path


class UtilTests(unittest.TestCase):
    def test_canonical_json_is_order_independent(self) -> None:
        left = canonical_json_bytes({"b": 2, "a": 1})
        right = canonical_json_bytes({"a": 1, "b": 2})
        self.assertEqual(left, right)
        self.assertEqual(sha256_bytes(left), sha256_bytes(right))

    def test_path_traversal_is_rejected(self) -> None:
        for value in ("../secret", "/absolute", ".git/config", "a/../../b", "a\\b"):
            with self.subTest(value=value), self.assertRaises(NexusError):
                validate_relative_path(value)

    def test_identifiers_reject_path_separators_and_control_characters(self) -> None:
        for value in ("../AUD", "a/b", "line\nbreak", "", "_starts-wrong"):
            with self.subTest(value=value), self.assertRaises(NexusError):
                validate_identifier(value)
        self.assertEqual(validate_identifier("AUD-R001.valid_2"), "AUD-R001.valid_2")

    def test_manifest_rejects_duplicate_paths(self) -> None:
        digest = "a" * 64
        with self.assertRaises(NexusError):
            parse_manifest(f"{digest}  a.txt\n{digest}  a.txt\n")


if __name__ == "__main__":
    unittest.main()
