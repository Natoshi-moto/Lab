from __future__ import annotations

import unittest

from system.nexus_lab.github import parse_visibility, require_private_visibility
from system.nexus_lab.util import NexusError


class GitHubGuardTests(unittest.TestCase):
    def test_private_visibility_parses(self) -> None:
        name, visibility = parse_visibility('{"nameWithOwner":"owner/lab","visibility":"PRIVATE"}')
        self.assertEqual(name, "owner/lab")
        self.assertEqual(visibility, "PRIVATE")

    def test_public_visibility_is_refused(self) -> None:
        name, visibility = parse_visibility('{"nameWithOwner":"owner/lab","visibility":"PUBLIC"}')
        with self.assertRaises(NexusError):
            require_private_visibility(name, visibility)

    def test_malformed_response_is_rejected(self) -> None:
        with self.assertRaises(NexusError):
            parse_visibility('{"visibility":"PRIVATE"}')


if __name__ == "__main__":
    unittest.main()
