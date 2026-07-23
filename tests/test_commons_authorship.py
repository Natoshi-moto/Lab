"""Negative-control tests for the commons authorship primitive.

Discipline: a verifier earns trust only once you have watched it FAIL a
deliberate corruption. Each test below corrupts one thing and asserts the
verifier rejects it. STRICT NO SALE is asserted structurally: there is no
transfer/amount/owner-change surface to test, because none exists.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..",
                                "experiments", "THE_COMMONS_001"))

from commons.authorship import (  # noqa: E402
    make_authorship,
    make_recognition,
    new_steward,
    verify_authorship,
    verify_recognition,
    work_hash,
)


class AuthorshipTests(unittest.TestCase):
    def setUp(self):
        self.alice_sk, self.alice = new_steward()
        self.bob_sk, self.bob = new_steward()
        self.content = b"a work made freely, kept as the maker's own"
        self.work = make_authorship(self.alice_sk, self.alice, "A Work", self.content)

    def test_valid_authorship_verifies(self):
        self.assertTrue(verify_authorship(self.work, content=self.content))

    def test_relabelled_work_fails(self):
        forged = dict(self.work, title="Someone Else's Work")
        self.assertFalse(verify_authorship(forged))

    def test_tampered_content_fails(self):
        self.assertFalse(verify_authorship(self.work, content=b"a different work"))

    def test_reassigned_author_fails(self):
        # Claiming Bob authored Alice's signed record must not verify.
        stolen = dict(self.work, author=self.bob)
        self.assertFalse(verify_authorship(stolen))

    def test_forged_signature_fails(self):
        forged = dict(self.work, signature="00" * 64)
        self.assertFalse(verify_authorship(forged))

    def test_no_transfer_or_amount_surface_exists(self):
        # STRICT NO SALE, structurally: the record simply has no money/ownership-
        # transfer field to exploit.
        for banned in ("owner", "amount", "price", "transfer", "to", "balance"):
            self.assertNotIn(banned, self.work)


class RecognitionTests(unittest.TestCase):
    def setUp(self):
        self.alice_sk, self.alice = new_steward()
        self.bob_sk, self.bob = new_steward()
        self.content = b"reproducible contribution"
        self.work = make_authorship(self.alice_sk, self.alice, "Contribution", self.content)
        self.rec = make_recognition(self.bob_sk, self.bob, self.work, "reproduced")

    def test_valid_recognition_verifies(self):
        self.assertTrue(verify_recognition(self.rec, self.work))

    def test_recognition_of_a_forgery_fails(self):
        forged_work = dict(self.work, title="Relabelled")
        self.assertFalse(verify_recognition(self.rec, forged_work))

    def test_tampered_recognition_fails(self):
        tampered = dict(self.rec, note="admired instead")
        self.assertFalse(verify_recognition(tampered, self.work))

    def test_impersonated_recognizer_fails(self):
        impersonated = dict(self.rec, by=self.alice)
        self.assertFalse(verify_recognition(impersonated, self.work))


if __name__ == "__main__":
    unittest.main()
