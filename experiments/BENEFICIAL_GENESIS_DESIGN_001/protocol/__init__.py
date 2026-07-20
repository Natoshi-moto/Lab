"""Beneficial Genesis design pack — synthetic Bitcoin-only migration receipts.

All material under this package is SYNTHETIC and NON-OPERATIONAL.
It does not implement a live chain, wallet, bridge, price, or fund path.
"""

from .constants import PROTOCOL_VERSION, REJECTION_CODES
from .verifier import ClaimVerifier, VerificationResult

__all__ = [
    "PROTOCOL_VERSION",
    "REJECTION_CODES",
    "ClaimVerifier",
    "VerificationResult",
]
