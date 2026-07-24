"""The Commons — authorship primitive.

The smallest living act of the commons: a steward signs a work they made, and
anyone can verify — forever, without a court and without a market — that this
key authored this exact content at this time. Others may attach *recognition*.

Native vocabulary only. There is deliberately NO owner field that can change,
NO transfer, NO amount, NO price. Authorship is proven, not traded. "Keep it as
yours" means the signature is indelible; nobody can reassign it. STRICT NO SALE
is not a rule here — it is structurally absent. There is nothing to sell.

Pure-stdlib + `cryptography` (Ed25519). No blockchain, no gas, no token.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _canonical(obj: dict) -> bytes:
    """Deterministic bytes of a record, excluding its own signature."""
    body = {k: v for k, v in obj.items() if k != "signature"}
    return json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")


# --- steward keys (a steward holds their own key; that IS the sovereignty) ---

def new_steward() -> tuple[Ed25519PrivateKey, str]:
    sk = Ed25519PrivateKey.generate()
    pub_hex = sk.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw).hex()
    return sk, pub_hex


def work_hash(content: bytes) -> str:
    """Provenance anchor: the fingerprint of the made thing itself."""
    return hashlib.sha256(content).hexdigest()


def digest(record: dict) -> str:
    """Stable identifier of a signed record (for lineage / recognition to cite)."""
    return hashlib.sha256(_canonical(record) + record.get("signature", "").encode()).hexdigest()


# --- authorship: a steward declares & signs "I made this" ---

def make_authorship(
    steward: Ed25519PrivateKey,
    author_pub_hex: str,
    title: str,
    content: bytes,
    *,
    lineage: list[str] | None = None,
    terms: str = "",
    made_at: str | None = None,
) -> dict:
    record = {
        "kind": "authorship",
        "title": title,
        "work_hash": work_hash(content),
        "author": author_pub_hex,
        "lineage": list(lineage or []),   # provenance: parent work_hashes
        "terms": terms,                    # a note in native vocabulary, NOT a legal license
        "made_at": made_at or _now(),
    }
    record["signature"] = steward.sign(_canonical(record)).hex()
    return record


def verify_authorship(record: dict, *, content: bytes | None = None) -> bool:
    """True iff the signature matches the stated author key over this exact record,
    and (if content given) the content still matches its provenance anchor."""
    try:
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(record["author"]))
        pub.verify(bytes.fromhex(record["signature"]), _canonical(record))
    except (InvalidSignature, KeyError, ValueError):
        return False
    if content is not None and work_hash(content) != record.get("work_hash"):
        return False
    return True


# --- recognition: another steward attests to a work (non-transferable) ---

def make_recognition(
    steward: Ed25519PrivateKey,
    by_pub_hex: str,
    authorship_record: dict,
    note: str,
    *,
    at: str | None = None,
) -> dict:
    att = {
        "kind": "recognition",
        "recognizes": digest(authorship_record),
        "by": by_pub_hex,
        "note": note,            # "reproduced" / "verified" / "admired" ...
        "at": at or _now(),
    }
    att["signature"] = steward.sign(_canonical(att)).hex()
    return att


def verify_recognition(recognition: dict, authorship_record: dict) -> bool:
    """True iff the attestation is validly signed by its stated steward AND
    actually points at this authorship record."""
    try:
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(recognition["by"]))
        pub.verify(bytes.fromhex(recognition["signature"]), _canonical(recognition))
    except (InvalidSignature, KeyError, ValueError):
        return False
    return recognition.get("recognizes") == digest(authorship_record)


if __name__ == "__main__":  # a walkthrough you can watch breathe
    alice_sk, alice = new_steward()
    bob_sk, bob = new_steward()

    poem = "the commons remembers what the market would have sold\n".encode()
    work = make_authorship(alice_sk, alice, "Untitled (for the makers)", poem,
                           terms="made freely; attribution kept; never for sale")
    print("authorship valid:        ", verify_authorship(work, content=poem))

    tampered = dict(work, title="Stolen (relabelled)")
    print("relabelled forgery valid:", verify_authorship(tampered), "(want False)")

    rec = make_recognition(bob_sk, bob, work, "reproduced and verified — this is Alice's")
    print("recognition valid:       ", verify_recognition(rec, work))
    print("recognition of a forgery:", verify_recognition(rec, tampered), "(want False)")
