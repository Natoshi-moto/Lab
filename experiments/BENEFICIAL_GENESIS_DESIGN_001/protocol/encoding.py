"""Canonical encoding helpers for Beneficial Genesis objects.

Rules:
- Canonical JSON: UTF-8, sorted object keys, no insignificant whitespace,
  separators=(',', ':'), ensure_ascii=False for readability of test labels only
  in human docs; protocol digests use ensure_ascii=True so codepoints are stable.
- Integers are non-negative Python ints within declared widths.
- Binary fields are lowercase hex without 0x prefix.
- Multi-byte integers in commitment preimages are big-endian.
"""

from __future__ import annotations

import hashlib
import json
import struct
from typing import Any, Mapping


def sha256(data: bytes) -> bytes:
    return hashlib.sha256(data).digest()


def sha256_hex(data: bytes) -> str:
    return sha256(data).hex()


def double_sha256(data: bytes) -> bytes:
    return sha256(sha256(data))


def double_sha256_hex(data: bytes) -> str:
    return double_sha256(data).hex()


def u32_be(value: int) -> bytes:
    if not isinstance(value, int) or value < 0 or value > 0xFFFFFFFF:
        raise ValueError("u32 out of range")
    return struct.pack(">I", value)


def u64_be(value: int) -> bytes:
    if not isinstance(value, int) or value < 0 or value > 0xFFFFFFFFFFFFFFFF:
        raise ValueError("u64 out of range")
    return struct.pack(">Q", value)


def require_hex(name: str, value: str, *, expected_bytes: int | None = None) -> bytes:
    if not isinstance(value, str):
        raise TypeError(f"{name} must be hex string")
    if len(value) % 2 != 0 or any(c not in "0123456789abcdef" for c in value):
        raise ValueError(f"{name} must be lowercase hex")
    raw = bytes.fromhex(value)
    if expected_bytes is not None and len(raw) != expected_bytes:
        raise ValueError(f"{name} must be exactly {expected_bytes} bytes")
    return raw


def canonical_json_bytes(obj: Any) -> bytes:
    """Return deterministic JSON bytes for hashing and fixture equality."""

    return json.dumps(
        obj,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
        allow_nan=False,
    ).encode("utf-8")


def canonical_json_loads(text: str | bytes) -> Any:
    if isinstance(text, bytes):
        text = text.decode("utf-8")
    return json.loads(text)


def deep_sorted(obj: Any) -> Any:
    """Recursively sort mapping keys for defensive comparisons."""

    if isinstance(obj, Mapping):
        return {k: deep_sorted(obj[k]) for k in sorted(obj)}
    if isinstance(obj, list):
        return [deep_sorted(x) for x in obj]
    return obj


def domain_hash(domain: bytes, *parts: bytes) -> bytes:
    """SHA-256 over domain || 0x00 || len(part)||part for each part."""

    acc = bytearray(domain)
    acc.append(0x00)
    for part in parts:
        if not isinstance(part, (bytes, bytearray)):
            raise TypeError("domain_hash parts must be bytes")
        acc.extend(u32_be(len(part)))
        acc.extend(part)
    return sha256(bytes(acc))


def domain_hash_hex(domain: bytes, *parts: bytes) -> str:
    return domain_hash(domain, *parts).hex()
