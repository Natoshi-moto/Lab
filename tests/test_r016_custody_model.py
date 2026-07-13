from __future__ import annotations

import ast
import importlib.util
import json
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/bounded_model.py"
REPORT_PATH = ROOT / "operations/receipts/R016_PCX_INTEGRATED_CUSTODY_GATE/MODEL_CHECK_REPORT.json"
SELF_TEST_PATH = ROOT / "operations/receipts/R016_PCX_INTEGRATED_CUSTODY_GATE/MODEL_SELF_TEST_REPORT.json"


def load_model():
    spec = importlib.util.spec_from_file_location("r016_bounded_model", MODEL_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError("unable to load R016 bounded model")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class R016CustodyModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.model = load_model()

    def test_model_report_is_deterministic_and_frozen(self) -> None:
        first = self.model.canonical_line(self.model.build_model_report())
        second = self.model.canonical_line(self.model.build_model_report())
        self.assertEqual(first, second)
        self.assertEqual(first, REPORT_PATH.read_bytes())

    def test_self_test_report_is_deterministic_and_frozen(self) -> None:
        first = self.model.canonical_line(self.model.build_self_test_report())
        second = self.model.canonical_line(self.model.build_self_test_report())
        self.assertEqual(first, second)
        self.assertEqual(first, SELF_TEST_PATH.read_bytes())

    def test_every_coverage_class_is_nonzero(self) -> None:
        report = self.model.build_model_report()
        self.assertTrue(report["coverage"])
        self.assertTrue(all(int(value) > 0 for value in report["coverage"].values()))
        self.assertGreater(int(report["state_count"]), 1)
        self.assertGreater(int(report["transition_count"]), int(report["state_count"]))
        self.assertGreater(int(report["race_order_checks"]), 0)

    def test_every_required_mutant_is_killed(self) -> None:
        report = self.model.build_self_test_report()
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["survivors"], [])
        self.assertEqual(report["mutants_killed"], report["mutants_required"])
        self.assertEqual(
            {item["mutant"] for item in report["results"]},
            {name for name, _semantics in self.model.MUTANTS},
        )
        self.assertTrue(all(item["killed"] == "TRUE" for item in report["results"]))

    def test_reports_are_canonical_compact_json_with_no_authority(self) -> None:
        for path in (REPORT_PATH, SELF_TEST_PATH):
            raw = path.read_bytes()
            self.assertTrue(raw.endswith(b"\n"))
            self.assertNotIn(b"\n", raw[:-1])
            value = json.loads(raw)
            self.assertEqual(value["status_authority"], "NONE")
            self.assertEqual(raw, self.model.canonical_line(value))

    def test_model_is_standalone_and_uses_only_admitted_imports(self) -> None:
        source = MODEL_PATH.read_text(encoding="utf-8")
        tree = ast.parse(source)
        imports: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".")[0])
        self.assertLessEqual(
            imports,
            {"__future__", "dataclasses", "hashlib", "json", "sys", "typing"},
        )
        self.assertNotIn("__import__", source)
        self.assertNotIn("import_module", source)


if __name__ == "__main__":
    unittest.main()
