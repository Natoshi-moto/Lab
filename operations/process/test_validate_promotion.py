#!/usr/bin/env python3
"""Deterministic contract and bypass tests for promotion-origin.yml."""

from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from validate_promotion import ContractError, parse_json_object, parse_pr_body, validate_package  # noqa: E402


LAB_SHA = "187f6bf61de8a46a7f41e41d62c3bd23eed9d9ed"
SANDBOX_SHA = "1111111111111111111111111111111111111111"
ANNOTATED_SHA = "2222222222222222222222222222222222222222"
CHANGED = ["operations/process/example.md"]


def load_fixture(name: str) -> dict:
    return json.loads((HERE / "promotion_fixtures" / name).read_text(encoding="utf-8"))


def sandbox_resolver(_repo: str, tag: str) -> dict:
    if tag == "promotion/test-001":
        return {"kind": "lightweight", "commit": SANDBOX_SHA}
    if tag == "promotion/annotated-001":
        return {"kind": "annotated", "tag_object": "3333333333333333333333333333333333333333", "commit": ANNOTATED_SHA}
    raise ContractError("tag missing")


class PromotionContractTests(unittest.TestCase):
    def assert_rejected(self, name: str, package: dict, resolver=sandbox_resolver, changed=CHANGED) -> None:
        with self.subTest(case=name):
            with self.assertRaises(ContractError):
                validate_package(package, changed_files=changed, tag_resolver=resolver)

    def test_valid_lab_internal(self) -> None:
        validate_package(load_fixture("valid_lab_internal.json"), changed_files=CHANGED)

    def test_valid_sandbox_promotion_with_exact_commit_and_tag(self) -> None:
        validate_package(load_fixture("valid_sandbox_promotion.json"), changed_files=CHANGED, tag_resolver=sandbox_resolver)

    def test_valid_annotated_tag_is_dereferenced(self) -> None:
        package = load_fixture("valid_annotated_sandbox_promotion.json")
        validate_package(package, changed_files=CHANGED, tag_resolver=sandbox_resolver)

    def test_punctuation_and_multiline_values_are_structured_not_grep_parsed(self) -> None:
        package = load_fixture("valid_sandbox_promotion.json")
        package["sandbox_context"] = "line one; punctuation: [] {} !\nline two with `markdown` and commas, still data."
        package["authority_used"] = "operator: bounded task; route=A/B\nsecond line"
        validate_package(package, changed_files=CHANGED, tag_resolver=sandbox_resolver)

    def test_valid_body_has_one_structured_json_block(self) -> None:
        package = load_fixture("valid_lab_internal.json")
        body = "Plain-English context.\n\n```json\n" + json.dumps(package) + "\n```\n"
        self.assertEqual(parse_pr_body(body), package)

    def test_all_negative_cases_fail_closed(self) -> None:
        base = load_fixture("valid_sandbox_promotion.json")
        cases: list[tuple[str, callable, object]] = []

        cases += [
            ("missing origin", lambda p: p.pop("change_origin"), sandbox_resolver),
            ("unknown origin", lambda p: p.__setitem__("change_origin", "UNKNOWN"), sandbox_resolver),
            ("missing sandbox sha", lambda p: p.pop("sandbox_commit"), sandbox_resolver),
            ("abbreviated sha", lambda p: p.__setitem__("sandbox_commit", SANDBOX_SHA[:8]), sandbox_resolver),
            ("non-hex sha", lambda p: p.__setitem__("sandbox_commit", "z" * 40), sandbox_resolver),
            ("missing tag", lambda p: p.pop("sandbox_tag"), sandbox_resolver),
            ("tag resolves elsewhere", lambda p: None, lambda _r, _t: {"commit": "9" * 40}),
            ("tag missing", lambda p: p.__setitem__("sandbox_tag", "promotion/missing"), sandbox_resolver),
            ("branch URL", lambda p: p.__setitem__("sandbox_record_url", "https://github.com/Natoshi-moto/Experimental-Sandbox/tree/main"), sandbox_resolver),
            ("mutable main tag", lambda p: p.__setitem__("sandbox_tag", "main"), sandbox_resolver),
            ("wrong repository", lambda p: p.__setitem__("sandbox_repository", "Natoshi-moto/Lab"), sandbox_resolver),
            ("Sandbox fields present for Lab internal", lambda p: (p.__setitem__("change_origin", "LAB_INTERNAL"), p.__setitem__("sandbox_repository", "Natoshi-moto/Experimental-Sandbox")), sandbox_resolver),
            ("Sandbox fields not applicable for promotion", lambda p: p.__setitem__("sandbox_repository", "NOT_APPLICABLE"), sandbox_resolver),
            ("missing proposed files", lambda p: p.pop("files_proposed_for_lab"), sandbox_resolver),
            ("empty claim", lambda p: p.__setitem__("claim", ""), sandbox_resolver),
            ("missing falsifier", lambda p: p.pop("falsifier"), sandbox_resolver),
            ("missing evidence class", lambda p: p.pop("evidence_class"), sandbox_resolver),
            ("tests passed without detail", lambda p: p["tests_run"][0].__setitem__("details", ""), sandbox_resolver),
            ("missing known failures", lambda p: p.pop("known_failures"), sandbox_resolver),
            ("missing known unknowns", lambda p: p.pop("known_unknowns"), sandbox_resolver),
            ("missing non-claims", lambda p: p.__setitem__("non_claims", []), sandbox_resolver),
            ("missing adversarial review", lambda p: p.pop("adversarial_review"), sandbox_resolver),
            ("missing rights declaration", lambda p: p.pop("rights_and_licences"), sandbox_resolver),
            ("missing security impact", lambda p: p.pop("security_and_privacy_impact"), sandbox_resolver),
            ("missing operator decision", lambda p: p.pop("operator_decision_requested"), sandbox_resolver),
            ("incorrect status authority", lambda p: p.__setitem__("status_authority", "OPERATOR_EXPLICIT"), sandbox_resolver),
            ("commit changed after package", lambda p: p.__setitem__("sandbox_commit", "9" * 40), sandbox_resolver),
            ("network failure", lambda p: None, lambda _r, _t: (_ for _ in ()).throw(OSError("network unavailable"))),
            ("tag ambiguity", lambda p: None, lambda _r, _t: {"ambiguous": True}),
            ("unexpected extra changed file", lambda p: None, sandbox_resolver),
        ]

        for name, mutate, resolver in cases:
            package = copy.deepcopy(base)
            mutate(package)
            changed = CHANGED + ["unexpected.txt"] if name == "unexpected extra changed file" else CHANGED
            self.assert_rejected(name, package, resolver=resolver, changed=changed)

    def test_duplicate_keys_are_rejected(self) -> None:
        with self.assertRaises(ContractError):
            parse_json_object('{"schema":"x","schema":"y"}')

    def test_malformed_json_and_missing_json_block_are_rejected(self) -> None:
        with self.assertRaises(ContractError):
            parse_json_object("not json")
        with self.assertRaises(ContractError):
            parse_pr_body("no structured package here")

    def test_canonical_authority_smuggling_is_rejected(self) -> None:
        package = load_fixture("valid_sandbox_promotion.json")
        package["claim"] = "This is canonical Lab state."
        self.assert_rejected("canonical authority", package)

    def test_bot_bypass_is_not_present_in_workflow(self) -> None:
        workflow = (HERE.parent.parent / ".github/workflows/promotion-origin.yml").read_text(encoding="utf-8")
        self.assertNotIn("dependabot", workflow)
        self.assertNotIn("github.actor", workflow)
        self.assertIn("ready_for_review", workflow)
        self.assertIn("persist-credentials: false", workflow)

    def test_schema_has_the_same_required_contract_fields(self) -> None:
        schema = json.loads((HERE / "experimental-sandbox-promotion.schema.json").read_text(encoding="utf-8"))
        package = load_fixture("valid_sandbox_promotion.json")
        self.assertEqual(set(schema["required"]), set(package))


if __name__ == "__main__":
    unittest.main()
