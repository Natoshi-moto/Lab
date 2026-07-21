from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from system.nexus_lab import github
from system.nexus_lab.github import parse_visibility, require_public_visibility
from system.nexus_lab.util import NexusError


class GitHubGuardTests(unittest.TestCase):
    def test_private_visibility_parses(self) -> None:
        name, visibility = parse_visibility('{"nameWithOwner":"owner/lab","visibility":"PRIVATE"}')
        self.assertEqual(name, "owner/lab")
        self.assertEqual(visibility, "PRIVATE")

    def test_private_visibility_is_refused(self) -> None:
        name, visibility = parse_visibility('{"nameWithOwner":"owner/lab","visibility":"PRIVATE"}')
        with self.assertRaises(NexusError):
            require_public_visibility(name, visibility)

    def test_malformed_response_is_rejected(self) -> None:
        with self.assertRaises(NexusError):
            parse_visibility('{"visibility":"PRIVATE"}')

    def _exercise_bootstrap(
        self,
        root: Path,
        *,
        visibility: str = "PUBLIC",
        permission_exit: int = 0,
        failed_labels: set[str] | None = None,
        issue_exit: int = 0,
    ) -> tuple[dict | None, Exception | None, list[tuple[str, tuple[str, ...], bool]]]:
        calls: list[tuple[str, tuple[str, ...], bool]] = []
        state = {"remote_exists": False}
        failed_labels = failed_labels or set()

        def completed(args: tuple[str, ...], exit_code: int = 0, *, stdout: str = "", stderr: str = ""):
            return subprocess.CompletedProcess(["gh", *args], exit_code, stdout=stdout, stderr=stderr)

        def fake_gh(_root: Path, *args: str, check: bool = True, input_text: str | None = None):
            del input_text
            calls.append(("gh", args, check))
            if args[:2] == ("auth", "status"):
                return completed(args)
            if args[:2] == ("repo", "create"):
                state["remote_exists"] = True
                return completed(args)
            if args[:2] == ("repo", "view"):
                return completed(
                    args,
                    stdout=json.dumps({
                        "nameWithOwner": "owner/fake-repo",
                        "visibility": visibility,
                        "url": "https://github.com/owner/fake-repo",
                    }),
                )
            if args and args[0] == "api":
                return completed(args, permission_exit, stderr="permission denied" if permission_exit else "")
            if args[:2] == ("label", "create"):
                label = args[2]
                exit_code = 5 if label in failed_labels else 0
                return completed(args, exit_code, stderr="label failed" if exit_code else "")
            if args[:2] == ("issue", "create"):
                return completed(args, issue_exit, stderr="issue failed" if issue_exit else "", stdout="issue-url" if not issue_exit else "")
            raise AssertionError(f"Unexpected gh call: {args}")

        def fake_git(_root: Path, *args: str, check: bool = True) -> str:
            calls.append(("git", args, check))
            if args == ("remote", "get-url", "origin"):
                return "git@github.com:owner/fake-repo.git" if state["remote_exists"] else ""
            if args == ("push", "origin", "main", "--follow-tags"):
                return ""
            raise AssertionError(f"Unexpected git call: {args}")

        result = None
        error: Exception | None = None
        with (
            patch.object(github.shutil, "which", return_value="/usr/bin/gh"),
            patch.object(github, "_gh", side_effect=fake_gh),
            patch.object(github, "git", side_effect=fake_git),
            patch.object(github, "ensure_clean_worktree"),
            patch.object(github, "verify_repository"),
            patch.object(github, "utc_now", return_value="2026-07-13T00:00:00Z"),
        ):
            try:
                result = github.github_bootstrap(root, repo_name="fake-repo")
            except Exception as exc:  # returned for exact assertion by each test
                error = exc
        return result, error, calls

    def test_create_verifies_public_and_permissions_before_push(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            result, error, calls = self._exercise_bootstrap(Path(temp))

        self.assertIsNone(error)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["status"], "PASS")
        self.assertTrue(result["content_push_performed"])

        create_idx = next(i for i, call in enumerate(calls) if call[0] == "gh" and call[1][:2] == ("repo", "create"))
        view_idx = next(i for i, call in enumerate(calls) if call[0] == "gh" and call[1][:2] == ("repo", "view"))
        permission_idx = next(i for i, call in enumerate(calls) if call[0] == "gh" and call[1][0] == "api")
        push_idx = next(i for i, call in enumerate(calls) if call[0] == "git" and call[1][0] == "push")
        self.assertLess(create_idx, view_idx)
        self.assertLess(view_idx, permission_idx)
        self.assertLess(permission_idx, push_idx)
        self.assertNotIn("--push", calls[create_idx][1])

    def test_private_visibility_stops_before_permission_or_push(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            result, error, calls = self._exercise_bootstrap(Path(temp), visibility="PRIVATE")

        self.assertIsNone(result)
        self.assertIsInstance(error, NexusError)
        self.assertIn("not PUBLIC", str(error))
        self.assertFalse(any(call[0] == "gh" and call[1] and call[1][0] == "api" for call in calls))
        self.assertFalse(any(call[0] == "git" and call[1] and call[1][0] == "push" for call in calls))

    def test_permission_failure_writes_failed_receipt_and_stops_before_push(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            result, error, calls = self._exercise_bootstrap(root, permission_exit=7)
            receipt = json.loads((root / "operations" / "receipts" / "GITHUB_BOOTSTRAP_RECEIPT.json").read_text(encoding="utf-8"))

        self.assertIsNone(result)
        self.assertIsInstance(error, NexusError)
        self.assertIn("stopped before pushing content", str(error))
        self.assertEqual(receipt["status"], "FAILED")
        self.assertFalse(receipt["content_push_performed"])
        self.assertEqual(receipt["warnings"][0]["code"], "ACTIONS_PERMISSION_LOCKDOWN_FAILED")
        self.assertFalse(any(call[0] == "git" and call[1] and call[1][0] == "push" for call in calls))

    def test_optional_setup_failures_return_partial_with_visible_warnings(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            result, error, _calls = self._exercise_bootstrap(
                Path(temp),
                failed_labels={"claude"},
                issue_exit=9,
            )

        self.assertIsNone(error)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["status"], "PARTIAL")
        self.assertEqual(
            {item["code"] for item in result["warnings"]},
            {"LABEL_CREATE_FAILED", "AUDIT_ISSUE_CREATE_FAILED"},
        )
        self.assertTrue(result["content_push_performed"])


if __name__ == "__main__":
    unittest.main()
