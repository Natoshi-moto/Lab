from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from system.nexus_lab.doctor import run_doctor, scan_secrets


class DoctorTests(unittest.TestCase):
    def test_secret_pattern_finds_constructed_github_token(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            token = "gh" + "p_" + ("A" * 36)
            (root / "leak.txt").write_text("token=" + token, encoding="utf-8")
            findings = scan_secrets(root)
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0]["kind"], "GITHUB_CLASSIC_TOKEN")

    def test_current_repository_doctor_has_no_errors(self) -> None:
        root = Path(__file__).resolve().parents[1]
        report = run_doctor(root)
        self.assertEqual(report["status"], "PASS", report["errors"])


if __name__ == "__main__":
    unittest.main()
