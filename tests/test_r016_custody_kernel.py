"""Adversarial conformance tests for the additive R016 custody kernel.

All Ed25519 private keys are generated at test runtime in a temporary
directory by OpenSSL. No fixed or committed private key material is used.
"""

from __future__ import annotations

import copy
import hashlib
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from system.nexus_lab.custody_kernel import (
    NETWORK,
    PROFILE,
    PROTOCOL_VERSION,
    RECOVERY_THRESHOLD,
    STATUS_AUTHORITY,
    ZERO_HEAD,
    AuthorityEscalationError,
    BackupNotRestorableError,
    BoundsError,
    CanonicalEncodingError,
    ConservationError,
    DuplicateKeyError,
    EventIdMismatchError,
    InvalidSignatureError,
    KeyReuseError,
    KeyRoleError,
    Machine,
    ObjectIdCollisionError,
    QuorumError,
    RetiredKeyError,
    LockedControllerError,
    SchemaError,
    StaleStateError,
    canonical_json,
    derive_outpoint,
    operation_id,
    recovery_policy_hash,
    signature_message,
)


def ident(label: str) -> str:
    return hashlib.sha256(("r016-test:" + label).encode("ascii")).hexdigest()


class EphemeralKeys:
    """Runtime-only OpenSSL Ed25519 keys."""

    def __init__(self, names: list[str]) -> None:
        self._temp = tempfile.TemporaryDirectory(prefix="r016-test-keys-")
        self.directory = Path(self._temp.name)
        self.private: dict[str, Path] = {}
        self.public: dict[str, str] = {}
        for name in names:
            private_path = self.directory / f"{name}.pem"
            subprocess.run(
                [
                    "openssl",
                    "genpkey",
                    "-algorithm",
                    "Ed25519",
                    "-out",
                    str(private_path),
                ],
                check=True,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            exported = subprocess.run(
                [
                    "openssl",
                    "pkey",
                    "-in",
                    str(private_path),
                    "-pubout",
                    "-outform",
                    "DER",
                ],
                check=True,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
            ).stdout
            self.private[name] = private_path
            self.public[name] = exported[-32:].hex()

    def sign(self, name: str, message: bytes) -> str:
        message_path = self.directory / "message.bin"
        signature_path = self.directory / "signature.bin"
        message_path.write_bytes(message)
        subprocess.run(
            [
                "openssl",
                "pkeyutl",
                "-sign",
                "-inkey",
                str(self.private[name]),
                "-rawin",
                "-in",
                str(message_path),
                "-out",
                str(signature_path),
            ],
            check=True,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return signature_path.read_bytes().hex()

    def close(self) -> None:
        self._temp.cleanup()


class R016CustodyKernelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if shutil.which("openssl") is None:
            raise unittest.SkipTest("OpenSSL is required for R016 conformance")
        names = [
            "a0",
            "ag0",
            "ag1",
            "ag2",
            "b0",
            "bg0",
            "bg1",
            "bg2",
            "n1",
            "n2",
            "n3",
            "n4",
            "n5",
            "n6",
            "n7",
            "n8",
            "rogue",
        ]
        cls.keys = EphemeralKeys(names)
        cls.alice = ident("controller-alice")
        cls.bob = ident("controller-bob")
        cls.a1 = ident("alice-utxo-1")
        cls.a2 = ident("alice-utxo-2")
        cls.b1 = ident("bob-utxo-1")

    @classmethod
    def tearDownClass(cls) -> None:
        cls.keys.close()

    def genesis_wire(self) -> bytes:
        controllers = [
            {
                "active_key": self.keys.public["a0"],
                "controller": self.alice,
                "recovery_keys": sorted(
                    [
                        self.keys.public["ag0"],
                        self.keys.public["ag1"],
                        self.keys.public["ag2"],
                    ]
                ),
            },
            {
                "active_key": self.keys.public["b0"],
                "controller": self.bob,
                "recovery_keys": sorted(
                    [
                        self.keys.public["bg0"],
                        self.keys.public["bg1"],
                        self.keys.public["bg2"],
                    ]
                ),
            },
        ]
        utxos = [
            {"amount": "40", "controller": self.alice, "outpoint": self.a1},
            {"amount": "60", "controller": self.alice, "outpoint": self.a2},
            {"amount": "25", "controller": self.bob, "outpoint": self.b1},
        ]
        return canonical_json(
            {
                "controllers": sorted(
                    controllers, key=lambda item: item["controller"]
                ),
                "kind": "GENESIS",
                "network": NETWORK,
                "profile": PROFILE,
                "status_authority": STATUS_AUTHORITY,
                "utxos": sorted(utxos, key=lambda item: item["outpoint"]),
                "version": PROTOCOL_VERSION,
            }
        )

    def machine(self) -> Machine:
        return Machine(self.genesis_wire())

    def base(
        self,
        machine: Machine,
        kind: str,
        object_label: str,
        controller: str | None = None,
    ) -> dict:
        controller = controller or self.alice
        current = machine.controller(controller)
        _ = object_label
        return {
            "controller": controller,
            "controller_epoch": current["epoch"],
            "controller_head": current["head"],
            "kind": kind,
            "network": NETWORK,
            "object_id": ZERO_HEAD,
            "predecessor": machine.state_root,
            "profile": PROFILE,
            "status_authority": STATUS_AUTHORITY,
            "version": PROTOCOL_VERSION,
        }

    def sign_proof(
        self,
        op: dict,
        role: str,
        name: str,
        outpoint: str | None = None,
    ) -> dict[str, str]:
        key = self.keys.public[name]
        message = signature_message(op, role, key=key, outpoint=outpoint)
        proof = {"key": key, "signature": self.keys.sign(name, message)}
        if outpoint is not None:
            proof["outpoint"] = outpoint
        return proof

    def transfer(
        self,
        machine: Machine,
        label: str,
        inputs: list[str],
        outputs: list[tuple[str, str]],
        active_name: str = "a0",
    ) -> dict:
        op = self.base(machine, "TRANSFER", label)
        op["inputs"] = sorted(inputs)
        op["outputs"] = [
            {"amount": amount, "controller": controller}
            for controller, amount in outputs
        ]
        op["object_id"] = operation_id(op)
        op["proofs"] = [
            self.sign_proof(
                op, "TRANSFER_ACTIVE", active_name, outpoint=outpoint
            )
            for outpoint in op["inputs"]
        ]
        return op

    def rotate(
        self,
        machine: Machine,
        label: str,
        new_name: str,
        active_name: str = "a0",
        guardian_name: str = "ag0",
    ) -> dict:
        op = self.base(machine, "ROTATE", label)
        op["new_key"] = self.keys.public[new_name]
        op["object_id"] = operation_id(op)
        op["proofs"] = {
            "active": self.sign_proof(op, "ROTATE_ACTIVE", active_name),
            "guardian": self.sign_proof(
                op, "ROTATE_GUARDIAN", guardian_name
            ),
            "new_key": self.sign_proof(op, "ROTATE_NEW_KEY", new_name),
        }
        return op

    def recover(
        self,
        machine: Machine,
        label: str,
        new_name: str,
        guardians: tuple[str, str] = ("ag0", "ag1"),
    ) -> dict:
        op = self.base(machine, "RECOVER", label)
        op["new_key"] = self.keys.public[new_name]
        op["object_id"] = operation_id(op)
        proofs = [
            self.sign_proof(op, "RECOVER_GUARDIAN", name)
            for name in guardians
        ]
        op["proofs"] = {
            "guardians": sorted(proofs, key=lambda item: item["key"]),
            "new_key": self.sign_proof(op, "RECOVER_NEW_KEY", new_name),
        }
        return op

    def revoke(
        self,
        machine: Machine,
        label: str,
        guardians: tuple[str, str] = ("ag0", "ag1"),
    ) -> dict:
        op = self.base(machine, "REVOKE", label)
        op["object_id"] = operation_id(op)
        proofs = [
            self.sign_proof(op, "REVOKE_GUARDIAN", name)
            for name in guardians
        ]
        op["proofs"] = {
            "guardians": sorted(proofs, key=lambda item: item["key"])
        }
        return op

    def test_happy_transfer_conserves_and_changes_ownership(self) -> None:
        machine = self.machine()
        before_total = sum(int(item["amount"]) for item in machine.utxos())
        before_controllers = machine.public_state()["controllers"]
        op = self.transfer(
            machine,
            "happy-transfer",
            [self.a1],
            [(self.bob, "15"), (self.alice, "25")],
        )
        receipt = machine.apply(canonical_json(op))

        self.assertEqual(receipt["result"], "APPLIED")
        self.assertEqual(receipt["before_root"], op["predecessor"])
        self.assertEqual(receipt["after_root"], machine.state_root)
        self.assertEqual(len(receipt["receipt_hash"]), 64)
        self.assertEqual(receipt["status_authority"], "NONE")
        self.assertEqual(machine.height, 1)
        self.assertEqual(machine.last_object_id, op["object_id"])
        self.assertEqual(machine.public_state()["height"], "1")
        self.assertEqual(
            machine.public_state()["last_object_id"], op["object_id"]
        )
        after = {item["outpoint"]: item for item in machine.utxos()}
        self.assertNotIn(self.a1, after)
        self.assertEqual(
            after[derive_outpoint(op["object_id"], 0)]["controller"], self.bob
        )
        self.assertEqual(
            sum(int(item["amount"]) for item in after.values()), before_total
        )
        self.assertEqual(machine.public_state()["controllers"], before_controllers)

    def test_happy_rotation_recovery_and_revocation(self) -> None:
        machine = self.machine()
        recovery_keys = machine.controller(self.alice)["recovery_keys"]

        rotation = self.rotate(machine, "happy-rotate", "n1")
        machine.apply(canonical_json(rotation))
        after_rotation = machine.controller(self.alice)
        self.assertEqual(after_rotation["active_key"], self.keys.public["n1"])
        self.assertIn(self.keys.public["a0"], after_rotation["retired_keys"])
        self.assertEqual(after_rotation["epoch"], "1")
        self.assertEqual(after_rotation["recovery_keys"], recovery_keys)
        self.assertEqual(
            after_rotation["recovery_threshold"], RECOVERY_THRESHOLD
        )
        self.assertEqual(
            after_rotation["recovery_policy_hash"],
            recovery_policy_hash(self.alice, recovery_keys),
        )

        recovery = self.recover(machine, "happy-recover", "n2")
        machine.apply(canonical_json(recovery))
        after_recovery = machine.controller(self.alice)
        self.assertEqual(after_recovery["active_key"], self.keys.public["n2"])
        self.assertIn(self.keys.public["n1"], after_recovery["retired_keys"])
        self.assertEqual(after_recovery["epoch"], "2")

        revocation = self.revoke(machine, "happy-revoke")
        machine.apply(canonical_json(revocation))
        locked = machine.controller(self.alice)
        self.assertEqual(locked["status"], "LOCKED")
        self.assertEqual(locked["active_key"], ZERO_HEAD)
        self.assertIn(self.keys.public["n2"], locked["retired_keys"])
        self.assertEqual(locked["epoch"], "3")

    def test_retired_stale_and_locked_active_keys_fail(self) -> None:
        machine = self.machine()
        stale_before_rotation = self.transfer(
            machine,
            "stale-before-rotation",
            [self.a1],
            [(self.bob, "40")],
        )
        machine.apply(canonical_json(self.rotate(machine, "retire-a0", "n1")))

        with self.assertRaises(StaleStateError):
            machine.apply(canonical_json(stale_before_rotation))

        current_but_old_key = self.transfer(
            machine,
            "old-key-current-context",
            [self.a1],
            [(self.bob, "40")],
            active_name="a0",
        )
        with self.assertRaises(RetiredKeyError):
            machine.apply(canonical_json(current_but_old_key))

        machine2 = self.machine()
        machine2.apply(canonical_json(self.revoke(machine2, "lock-alice")))
        after_revoke = self.transfer(
            machine2,
            "locked-spend",
            [self.a1],
            [(self.bob, "40")],
        )
        with self.assertRaises(LockedControllerError):
            machine2.apply(canonical_json(after_revoke))

    def test_signature_role_tamper_and_quorum_attacks_fail(self) -> None:
        machine = self.machine()
        wrong_role = self.transfer(
            machine,
            "guardian-is-not-active",
            [self.a1],
            [(self.bob, "40")],
            active_name="ag0",
        )
        with self.assertRaises(KeyRoleError):
            machine.apply(canonical_json(wrong_role))

        tampered = self.transfer(
            machine,
            "tampered-transfer",
            [self.a1],
            [(self.bob, "40")],
        )
        tampered["outputs"][0]["amount"] = "39"
        tampered["object_id"] = operation_id(tampered)
        with self.assertRaises(InvalidSignatureError):
            machine.apply(canonical_json(tampered))

        outpoint_bound = self.transfer(
            machine,
            "outpoint-index-bound",
            [self.a1, self.a2],
            [(self.bob, "100")],
        )
        self.assertIn(
            b'"input_index":"0"',
            signature_message(
                outpoint_bound,
                "TRANSFER_ACTIVE",
                key=self.keys.public["a0"],
                outpoint=outpoint_bound["inputs"][0],
            ),
        )
        first_signature = outpoint_bound["proofs"][0]["signature"]
        outpoint_bound["proofs"][0]["signature"] = outpoint_bound["proofs"][1][
            "signature"
        ]
        outpoint_bound["proofs"][1]["signature"] = first_signature
        with self.assertRaises(InvalidSignatureError):
            machine.apply(canonical_json(outpoint_bound))

        duplicated_guardian = self.recover(
            machine,
            "duplicate-guardian",
            "n1",
            guardians=("ag0", "ag0"),
        )
        with self.assertRaises(QuorumError):
            machine.apply(canonical_json(duplicated_guardian))

        wrong_guardian = self.recover(
            machine,
            "wrong-guardian-role",
            "n1",
            guardians=("ag0", "bg0"),
        )
        with self.assertRaises(KeyRoleError):
            machine.apply(canonical_json(wrong_guardian))

        false_possession = self.recover(
            machine, "false-new-key-possession", "n1"
        )
        message = signature_message(
            false_possession,
            "RECOVER_NEW_KEY",
            key=self.keys.public["n1"],
        )
        false_possession["proofs"]["new_key"]["signature"] = self.keys.sign(
            "rogue", message
        )
        with self.assertRaises(InvalidSignatureError):
            machine.apply(canonical_json(false_possession))

    def test_raw_keys_are_globally_single_use_and_never_reactivated(self) -> None:
        machine = self.machine()
        guardian_reuse = self.rotate(
            machine, "reuse-guardian-as-active", "ag0"
        )
        with self.assertRaises(KeyReuseError):
            machine.apply(canonical_json(guardian_reuse))

        machine.apply(canonical_json(self.rotate(machine, "first-use-n1", "n1")))
        reactivate_retired = self.recover(
            machine, "reactivate-retired-a0", "a0"
        )
        with self.assertRaises(KeyReuseError):
            machine.apply(canonical_json(reactivate_retired))

    def test_canonical_duplicate_exact_schema_and_string_integer_rules(self) -> None:
        machine = self.machine()
        op = self.transfer(
            machine,
            "encoding-target",
            [self.a1],
            [(self.bob, "40")],
        )
        wire = canonical_json(op)

        with self.assertRaises(CanonicalEncodingError):
            machine.apply(b" " + wire)

        duplicated = wire.replace(
            b'"kind":"TRANSFER"',
            b'"kind":"TRANSFER","kind":"TRANSFER"',
            1,
        )
        with self.assertRaises(DuplicateKeyError):
            machine.apply(duplicated)

        unknown = copy.deepcopy(op)
        unknown["surprise"] = "no"
        with self.assertRaises(SchemaError):
            machine.apply(canonical_json(unknown))

        numeric = copy.deepcopy(op)
        numeric["outputs"][0]["amount"] = 40
        numeric_wire = json.dumps(
            numeric, sort_keys=True, separators=(",", ":")
        ).encode("ascii")
        with self.assertRaises(SchemaError):
            machine.apply(numeric_wire)

    def test_exact_replay_is_idempotent_and_object_aliasing_fails(self) -> None:
        machine = self.machine()
        first = self.transfer(
            machine,
            "replay-object",
            [self.a1],
            [(self.bob, "40")],
        )
        wire = canonical_json(first)
        receipt = machine.apply(wire)
        root = machine.state_root
        height = machine.height

        self.assertEqual(machine.apply(wire), receipt)
        self.assertEqual(machine.state_root, root)
        self.assertEqual(machine.height, height)
        accepted = machine.accepted_object(first["object_id"])
        self.assertIsNotNone(accepted)
        assert accepted is not None
        self.assertEqual(accepted[0], wire)
        self.assertEqual(accepted[1], receipt)

        collision = self.transfer(
            machine,
            "replay-object",
            [self.a2],
            [(self.bob, "60")],
        )
        collision["object_id"] = first["object_id"]
        with self.assertRaises(ObjectIdCollisionError):
            machine.apply(canonical_json(collision))

    def test_content_address_and_status_authority_are_mandatory(self) -> None:
        machine = self.machine()
        operation = self.transfer(
            machine,
            "content-address-target",
            [self.a1],
            [(self.bob, "40")],
        )
        operation["object_id"] = ident("caller-selected-id")
        with self.assertRaises(EventIdMismatchError):
            machine.apply(canonical_json(operation))

        escalation = self.transfer(
            machine,
            "authority-escalation",
            [self.a1],
            [(self.bob, "40")],
        )
        escalation["status_authority"] = "OPERATOR"
        with self.assertRaises(AuthorityEscalationError):
            machine.apply(canonical_json(escalation))

        genesis = json.loads(self.genesis_wire().decode("ascii"))
        genesis["status_authority"] = "ADMIN"
        with self.assertRaises(AuthorityEscalationError):
            Machine(canonical_json(genesis))

    def test_conservation_ownership_and_sibling_spends_fail_closed(self) -> None:
        machine = self.machine()
        inflation = self.transfer(
            machine,
            "inflation",
            [self.a1],
            [(self.bob, "41")],
        )
        with self.assertRaises(ConservationError):
            machine.apply(canonical_json(inflation))

        sibling_one = self.transfer(
            machine,
            "sibling-one",
            [self.a1],
            [(self.bob, "40")],
        )
        sibling_two = self.transfer(
            machine,
            "sibling-two",
            [self.a2],
            [(self.bob, "60")],
        )
        machine.apply(canonical_json(sibling_one))
        with self.assertRaises(StaleStateError):
            machine.apply(canonical_json(sibling_two))

    def test_transfer_races_every_custody_transition_in_both_orders(self) -> None:
        custody_builders = {
            "rotation": lambda m: self.rotate(m, "race-rotate", "n1"),
            "recovery": lambda m: self.recover(m, "race-recover", "n1"),
            "revocation": lambda m: self.revoke(m, "race-revoke"),
        }
        for custody_name, custody_builder in custody_builders.items():
            for first_name in ("transfer", "custody"):
                with self.subTest(custody=custody_name, first=first_name):
                    machine = self.machine()
                    transfer = self.transfer(
                        machine,
                        f"race-transfer-{custody_name}",
                        [self.a1],
                        [(self.bob, "40")],
                    )
                    custody = custody_builder(machine)
                    first, second = (
                        (transfer, custody)
                        if first_name == "transfer"
                        else (custody, transfer)
                    )
                    machine.apply(canonical_json(first))
                    with self.assertRaises(StaleStateError):
                        machine.apply(canonical_json(second))
                    self.assertEqual(machine.height, 1)

    def test_conflicting_recoveries_are_first_winner_second_stale(self) -> None:
        for winner in ("n1", "n2"):
            with self.subTest(winner=winner):
                machine = self.machine()
                recovery_one = self.recover(
                    machine, "conflicting-recovery-one", "n1"
                )
                recovery_two = self.recover(
                    machine, "conflicting-recovery-two", "n2"
                )
                first, second = (
                    (recovery_one, recovery_two)
                    if winner == "n1"
                    else (recovery_two, recovery_one)
                )
                machine.apply(canonical_json(first))
                with self.assertRaises(StaleStateError):
                    machine.apply(canonical_json(second))
                self.assertEqual(
                    machine.controller(self.alice)["active_key"],
                    self.keys.public[winner],
                )

    def test_public_checkpoint_requires_exact_anchor_and_has_no_secrets(self) -> None:
        machine = self.machine()
        genesis_anchor = machine.state_root
        old_checkpoint = machine.public_checkpoint(genesis_anchor)
        decoded_genesis_checkpoint = json.loads(old_checkpoint.decode("ascii"))
        self.assertEqual(
            decoded_genesis_checkpoint["status_authority"], STATUS_AUTHORITY
        )
        self.assertEqual(
            decoded_genesis_checkpoint["state"]["height"], "0"
        )
        self.assertEqual(
            decoded_genesis_checkpoint["state"]["last_object_id"], ZERO_HEAD
        )
        lowered = old_checkpoint.lower()
        for forbidden in (b"private", b"secret", b"seed", b"pem"):
            self.assertNotIn(forbidden, lowered)
        exact = machine.classify_public_checkpoint(
            old_checkpoint, genesis_anchor
        )
        self.assertTrue(exact.restorable)
        self.assertEqual(exact.classification, "RESTORABLE")

        operation = self.transfer(
            machine,
            "checkpoint-advance",
            [self.a1],
            [(self.bob, "40")],
        )
        machine.apply(canonical_json(operation))
        current_anchor = machine.state_root
        stale = machine.classify_public_checkpoint(
            old_checkpoint, current_anchor
        )
        self.assertEqual(stale.classification, "STALE")
        self.assertFalse(stale.restorable)
        with self.assertRaises(BackupNotRestorableError) as caught:
            machine.public_checkpoint(genesis_anchor)
        self.assertEqual(caught.exception.category, "STALE")

        current_checkpoint = machine.public_checkpoint(current_anchor)
        checkpoint_object = json.loads(current_checkpoint.decode("ascii"))
        ahead_object = copy.deepcopy(checkpoint_object)
        ahead_object["height"] = str(machine.height + 1)
        ahead = machine.classify_public_checkpoint(
            canonical_json(ahead_object), current_anchor
        )
        self.assertEqual(ahead.classification, "AHEAD")

        conflict_object = copy.deepcopy(checkpoint_object)
        conflict_object["state"]["utxos"][0]["amount"] = "999"
        conflict = machine.classify_public_checkpoint(
            canonical_json(conflict_object), current_anchor
        )
        self.assertEqual(conflict.classification, "CONFLICTING")

        unanchored = machine.classify_public_checkpoint(
            current_checkpoint, ident("not-a-machine-root")
        )
        self.assertEqual(unanchored.classification, "UNANCHORED")
        with self.assertRaises(BackupNotRestorableError) as caught:
            machine.require_restorable_public_checkpoint(
                canonical_json(ahead_object), current_anchor
            )
        self.assertEqual(caught.exception.category, "AHEAD")

    def test_genesis_key_reuse_and_wire_bounds_are_rejected(self) -> None:
        genesis = json.loads(self.genesis_wire().decode("ascii"))
        genesis["controllers"][1]["active_key"] = genesis["controllers"][0][
            "recovery_keys"
        ][0]
        with self.assertRaises(KeyReuseError):
            Machine(canonical_json(genesis))

        zero_genesis = json.loads(self.genesis_wire().decode("ascii"))
        zero_genesis["controllers"][0]["active_key"] = ZERO_HEAD
        with self.assertRaises(SchemaError):
            Machine(canonical_json(zero_genesis))

        machine = self.machine()
        zero_new_key = self.rotate(machine, "zero-new-key", "n1")
        zero_new_key["new_key"] = ZERO_HEAD
        with self.assertRaises(SchemaError):
            machine.apply(canonical_json(zero_new_key))

        zero_proof_key = self.transfer(
            machine,
            "zero-proof-key",
            [self.a1],
            [(self.bob, "40")],
        )
        zero_proof_key["proofs"][0]["key"] = ZERO_HEAD
        with self.assertRaises(SchemaError):
            machine.apply(canonical_json(zero_proof_key))

        with self.assertRaises(BoundsError):
            machine.apply(b"x" * (70 * 1024))
