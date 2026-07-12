from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from system.nexus_lab.doctor import MAX_SECRET_SCAN_BYTES, run_doctor, scan_secrets


class DoctorTests(unittest.TestCase):
    @staticmethod
    def _constructed_github_token() -> str:
        return "gh" + "p_" + ("A" * 36)

    def _assert_github_token_found(self, filename: str) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / filename).write_text(
                "token=" + self._constructed_github_token(),
                encoding="utf-8",
            )
            findings = scan_secrets(root)
            self.assertEqual(len(findings), 1, findings)
            self.assertEqual(findings[0]["kind"], "GITHUB_CLASSIC_TOKEN")
            self.assertEqual(findings[0]["path"], filename)

    def test_secret_pattern_finds_constructed_github_token(self) -> None:
        self._assert_github_token_found("leak.txt")

    def test_secret_pattern_scans_dotenv(self) -> None:
        self._assert_github_token_found(".env")

    def test_secret_pattern_scans_dotenv_variant(self) -> None:
        self._assert_github_token_found(".env.local")

    def test_secret_pattern_scans_extensionless_credentials_file(self) -> None:
        self._assert_github_token_found("credentials")

    def test_secret_scan_reports_size_limit_exclusion(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            path = root / ".env"
            path.write_bytes(b"x" * (MAX_SECRET_SCAN_BYTES + 1))
            skipped: list[dict] = []
            findings = scan_secrets(root, skipped_files=skipped)
            self.assertEqual(findings, [])
            self.assertEqual(len(skipped), 1)
            self.assertEqual(skipped[0]["path"], ".env")
            self.assertEqual(skipped[0]["reason"], "SIZE_LIMIT")
            self.assertEqual(skipped[0]["limit_bytes"], MAX_SECRET_SCAN_BYTES)

    def test_doctor_reports_worktree_symlink(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "target.txt").write_text("x", encoding="utf-8")
            (root / "link.txt").symlink_to("target.txt")
            report = run_doctor(root)
            self.assertTrue(any(item.startswith("SYMLINK_IN_WORKTREE") for item in report["errors"]))

    def test_current_repository_doctor_has_no_errors(self) -> None:
        root = Path(__file__).resolve().parents[1]
        report = run_doctor(root)
        self.assertEqual(report["status"], "PASS", report["errors"])


if __name__ == "__main__":
    unittest.main()
