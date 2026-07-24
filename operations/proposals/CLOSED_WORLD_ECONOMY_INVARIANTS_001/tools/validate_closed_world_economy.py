#!/usr/bin/env python3
"""Fail-closed validation for closed-world-economy manifests.

This module intentionally uses only Python's standard library, matching the
house convention in operations/process/validate_promotion.py. It checks a
single manifest JSON object against schema/closed_world_economy.schema.json's
contract, plus cross-field consistency rules that schema alone cannot express
(exact leakage-ladder ordering, the allowed/prohibited contradiction check,
and a recursive scan for vague load-bearing placeholders such as "TBD").

A passing result means exactly one thing: the submitted manifest is
internally consistent with selected declared invariants. It is not proof of
legal, social, economic, or implementation safety. See
../CLAIMS_AND_NONCLAIMS.md.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Iterable

SCHEMA = "closed-world-economy/v1"
SHA_RE = re.compile(r"^[0-9a-f]{40}$")
VAGUE_RE = re.compile(r"\b(TBD|TODO|N/?A|PENDING|XXX|FIXME)\b", re.IGNORECASE)

REQUIRED_TOP_LEVEL = {
    "schema", "economy_id", "accepted_lab_sha", "source_doctrine_sha",
    "implementation_sha", "status_authority", "prohibited_capabilities",
    "allowed_primitives", "transfer_policy", "redemption_policy",
    "external_market_policy", "chance_policy", "vulnerable_user_policy",
    "monitoring_policy", "halt_policy", "known_exceptions",
    "unresolved_questions", "non_claims",
}

REQUIRED_PROHIBITED_CAPABILITIES = {
    "cash_redemption", "crypto_redemption", "external_goods_services_redemption",
    "revenue_entitlement", "ownership_claim", "debt_claim", "promised_appreciation",
    "yield_or_interest", "official_exchange_rate", "official_liquidity_provision",
    "price_oracle", "external_wallet_withdrawal", "blockchain_bridge",
    "exportable_bearer_instrument", "external_trading_api",
    "operator_escrow_for_external_trade", "official_otc_matching",
    "account_sale_tooling", "collateral_or_lending",
    "misleading_financial_promotion", "unbounded_transfer",
    "paid_random_transferable_rewards",
}

KNOWN_PRIMITIVE_CATEGORIES = {
    "recognition", "reputation", "authorship_record", "access",
    "creative_permissions", "participation_rights", "non_transferable_status",
    "cosmetic_or_expressive_resources", "internal_consumable_resources",
    "stewardship_responsibilities",
}

REQUIRED_PRIMITIVE_PROPERTIES = {
    "transferable", "giftable", "sellable", "redeemable", "purchasable",
    "scarce", "inheritable", "collateralizable", "usable_for_governance",
    "obtainable_through_chance", "convertible_to_external_value",
}

# Properties that must always be false: this framework never permits these
# regardless of category (INVARIANTS.md, PROHIBITED_CAPABILITIES.md).
ALWAYS_FALSE_PRIMITIVE_PROPERTIES = {
    "redeemable", "collateralizable", "convertible_to_external_value",
}

# Transfer-policy values permitted in a passing manifest. AUCTION,
# OPEN_ORDER_BOOK, ACCOUNT_TRANSFER, ASSET_EXPORT, and CROSS_PROJECT_TRANSFER
# are market- or export-shaped and are rejected outright by this validator;
# a design that believes it needs one of them is out of this framework's
# scope entirely (see INVARIANTS.md SS E and THREAT_MODEL.md SS 3).
ALLOWED_TRANSFER_POLICY_VALUES = {
    "NON_TRANSFERABLE", "OPERATOR_MEDIATED", "ONE_WAY_GIFT",
    "BOUNDED_BILATERAL_EXCHANGE",
}
ALL_TRANSFER_POLICY_ENUM_VALUES = ALLOWED_TRANSFER_POLICY_VALUES | {
    "AUCTION", "OPEN_ORDER_BOOK", "ACCOUNT_TRANSFER", "ASSET_EXPORT",
    "CROSS_PROJECT_TRANSFER",
}

CANONICAL_LEAKAGE_LADDER = [
    "OBSERVE", "INVESTIGATE", "WARN", "THROTTLE", "RESTRICT_TRANSFER",
    "SUSPEND_MECHANIC", "FREEZE_AFFECTED_OBJECT_CLASS", "HALT_ECONOMY",
    "RETIRE_MECHANIC",
]


class ContractError(ValueError):
    pass


def _no_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ContractError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def parse_manifest(text: str) -> dict[str, Any]:
    try:
        value = json.loads(text, object_pairs_hook=_no_duplicate_pairs)
    except (json.JSONDecodeError, ContractError) as exc:
        raise ContractError(f"malformed JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ContractError("manifest must be a JSON object")
    return value


def _text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ContractError(f"{field} must be a non-empty string")
    return value.strip()


def _bool(value: Any, field: str) -> bool:
    if not isinstance(value, bool):
        raise ContractError(f"{field} must be a boolean")
    return value


def _list_of_strings(value: Any, field: str, *, allow_empty: bool = True) -> list[str]:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ContractError(f"{field} must be an array of strings")
    if not allow_empty and not value:
        raise ContractError(f"{field} must contain at least one entry")
    for item in value:
        if not item.strip():
            raise ContractError(f"{field} entries must be non-empty strings")
    return value


def _all_strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from _all_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from _all_strings(item)


def _reject_vague_placeholders(manifest: dict[str, Any]) -> None:
    for value in _all_strings(manifest):
        match = VAGUE_RE.search(value)
        if match:
            raise ContractError(
                f"vague load-bearing placeholder {match.group(0)!r} found in a manifest string field"
            )


def _validate_prohibited_capabilities(value: Any) -> None:
    if not isinstance(value, dict):
        raise ContractError("prohibited_capabilities must be an object")
    missing = sorted(REQUIRED_PROHIBITED_CAPABILITIES - value.keys())
    extra = sorted(value.keys() - REQUIRED_PROHIBITED_CAPABILITIES)
    if missing:
        raise ContractError(f"prohibited_capabilities is missing required keys: {', '.join(missing)}")
    if extra:
        raise ContractError(f"prohibited_capabilities has unexpected keys: {', '.join(extra)}")
    not_true = sorted(key for key, val in value.items() if val is not True)
    if not_true:
        raise ContractError(
            "prohibited_capabilities must declare every capability prohibited (true); "
            f"not true for: {', '.join(not_true)}"
        )


def _validate_allowed_primitives(value: Any) -> None:
    if not isinstance(value, dict):
        raise ContractError("allowed_primitives must be an object")
    unknown = sorted(value.keys() - KNOWN_PRIMITIVE_CATEGORIES)
    if unknown:
        raise ContractError(f"allowed_primitives has unknown categories: {', '.join(unknown)}")
    for category, props in value.items():
        if not isinstance(props, dict):
            raise ContractError(f"allowed_primitives.{category} must be an object")
        missing = sorted(REQUIRED_PRIMITIVE_PROPERTIES - props.keys())
        extra = sorted(props.keys() - REQUIRED_PRIMITIVE_PROPERTIES)
        if missing:
            raise ContractError(f"allowed_primitives.{category} is missing properties: {', '.join(missing)}")
        if extra:
            raise ContractError(f"allowed_primitives.{category} has unexpected properties: {', '.join(extra)}")
        for prop in REQUIRED_PRIMITIVE_PROPERTIES:
            _bool(props[prop], f"allowed_primitives.{category}.{prop}")
        for prop in ALWAYS_FALSE_PRIMITIVE_PROPERTIES:
            if props[prop] is not False:
                raise ContractError(
                    "contradictory allowed/prohibited declaration: "
                    f"allowed_primitives.{category}.{prop} must be false "
                    "(this framework prohibits it for every category)"
                )
        if props["obtainable_through_chance"] is True and (
            props["purchasable"] is True or props["transferable"] is True
        ):
            raise ContractError(
                f"allowed_primitives.{category} combines chance with purchasable and/or "
                "transferable; this is the blocked loot-box/wagering pattern (INVARIANTS.md SS D)"
            )


def _validate_transfer_policy(value: Any, allowed_primitives: dict[str, Any]) -> None:
    if not isinstance(value, dict):
        raise ContractError("transfer_policy must be an object")
    unknown = sorted(value.keys() - KNOWN_PRIMITIVE_CATEGORIES)
    if unknown:
        raise ContractError(f"transfer_policy has unknown categories: {', '.join(unknown)}")
    for category, policy in value.items():
        if policy not in ALL_TRANSFER_POLICY_ENUM_VALUES:
            raise ContractError(f"transfer_policy.{category} is not a recognized transfer policy value")
        if policy not in ALLOWED_TRANSFER_POLICY_VALUES:
            raise ContractError(
                f"transfer_policy.{category}={policy} is market- or export-shaped and is not "
                "permitted under this framework (see tools/validate_closed_world_economy.py "
                "ALLOWED_TRANSFER_POLICY_VALUES)"
            )


def _validate_redemption_policy(value: Any) -> None:
    if not isinstance(value, dict) or set(value) != {"official_redemption", "external_settlement", "notes"}:
        raise ContractError("redemption_policy requires exactly official_redemption, external_settlement, notes")
    if value["official_redemption"] is not False:
        raise ContractError("redemption_policy.official_redemption must be false")
    if value["external_settlement"] is not False:
        raise ContractError("redemption_policy.external_settlement must be false")
    _text(value["notes"], "redemption_policy.notes")


def _validate_external_market_policy(value: Any) -> None:
    fields = {"official_facilitation", "tolerated_workaround_response", "prohibited_workaround_response"}
    if not isinstance(value, dict) or set(value) != fields:
        raise ContractError(f"external_market_policy requires exactly {', '.join(sorted(fields))}")
    if value["official_facilitation"] is not False:
        raise ContractError("external_market_policy.official_facilitation must be false")
    _text(value["tolerated_workaround_response"], "external_market_policy.tolerated_workaround_response")
    _text(value["prohibited_workaround_response"], "external_market_policy.prohibited_workaround_response")


def _validate_chance_policy(value: Any) -> None:
    fields = {"loot_boxes", "paid_randomness", "wagering", "chance_with_payment_and_transfer"}
    if not isinstance(value, dict) or set(value) != fields:
        raise ContractError(f"chance_policy requires exactly {', '.join(sorted(fields))}")
    for field in ("loot_boxes", "paid_randomness", "wagering"):
        if value[field] is not False:
            raise ContractError(f"chance_policy.{field} must be false")
    if value["chance_with_payment_and_transfer"] != "BLOCKED_PENDING_SPECIALIST_REVIEW":
        raise ContractError("chance_policy.chance_with_payment_and_transfer must be BLOCKED_PENDING_SPECIALIST_REVIEW")


def _validate_vulnerable_user_policy(value: Any, allowed_primitives: dict[str, Any]) -> None:
    if not isinstance(value, dict) or set(value) != {"minors_reachable", "safeguards"}:
        raise ContractError("vulnerable_user_policy requires exactly minors_reachable, safeguards")
    minors_reachable = _bool(value["minors_reachable"], "vulnerable_user_policy.minors_reachable")
    _text(value["safeguards"], "vulnerable_user_policy.safeguards")
    if minors_reachable:
        chance_categories = [
            category for category, props in allowed_primitives.items()
            if props.get("obtainable_through_chance") is True
        ]
        if chance_categories:
            raise ContractError(
                "minors_reachable is true but chance-obtainable categories are declared: "
                f"{', '.join(sorted(chance_categories))} (HALT_AND_ESCALATION_RULES.md: "
                "minors exposed to chance-value mechanics)"
            )


def _validate_monitoring_policy(value: Any) -> None:
    if not isinstance(value, dict) or set(value) != {"leakage_response_ladder", "receipts_required"}:
        raise ContractError("monitoring_policy requires exactly leakage_response_ladder, receipts_required")
    ladder = value["leakage_response_ladder"]
    if ladder != CANONICAL_LEAKAGE_LADDER:
        raise ContractError(
            "monitoring_policy.leakage_response_ladder must exactly equal the canonical nine-stage "
            f"ladder in order: {CANONICAL_LEAKAGE_LADDER}"
        )
    if value["receipts_required"] is not True:
        raise ContractError("monitoring_policy.receipts_required must be true")


def _validate_halt_policy(value: Any) -> None:
    if not isinstance(value, dict) or set(value) != {"conditions", "due_process_required"}:
        raise ContractError("halt_policy requires exactly conditions, due_process_required")
    _list_of_strings(value["conditions"], "halt_policy.conditions", allow_empty=False)
    if value["due_process_required"] is not True:
        raise ContractError("halt_policy.due_process_required must be true")


def validate_manifest(manifest: dict[str, Any]) -> None:
    if not isinstance(manifest, dict):
        raise ContractError("manifest must be a JSON object")
    missing = sorted(REQUIRED_TOP_LEVEL - manifest.keys())
    extra = sorted(manifest.keys() - REQUIRED_TOP_LEVEL)
    if missing:
        raise ContractError(f"missing required fields: {', '.join(missing)}")
    if extra:
        raise ContractError(f"unexpected top-level fields: {', '.join(extra)}")

    if manifest["schema"] != SCHEMA:
        raise ContractError(f"schema must be {SCHEMA}")
    if manifest["status_authority"] != "NONE":
        raise ContractError("status_authority must be NONE")

    _text(manifest["economy_id"], "economy_id")
    if not SHA_RE.fullmatch(_text(manifest["accepted_lab_sha"], "accepted_lab_sha")):
        raise ContractError("accepted_lab_sha must be a full lowercase 40-character SHA")
    if not SHA_RE.fullmatch(_text(manifest["source_doctrine_sha"], "source_doctrine_sha")):
        raise ContractError("source_doctrine_sha must be a full lowercase 40-character SHA")
    implementation_sha = _text(manifest["implementation_sha"], "implementation_sha")
    if implementation_sha != "NOT_YET_IMPLEMENTED" and not SHA_RE.fullmatch(implementation_sha):
        raise ContractError("implementation_sha must be NOT_YET_IMPLEMENTED or a full lowercase 40-character SHA")

    _validate_prohibited_capabilities(manifest["prohibited_capabilities"])
    _validate_allowed_primitives(manifest["allowed_primitives"])
    _validate_transfer_policy(manifest["transfer_policy"], manifest["allowed_primitives"])
    _validate_redemption_policy(manifest["redemption_policy"])
    _validate_external_market_policy(manifest["external_market_policy"])
    _validate_chance_policy(manifest["chance_policy"])
    _validate_vulnerable_user_policy(manifest["vulnerable_user_policy"], manifest["allowed_primitives"])
    _validate_monitoring_policy(manifest["monitoring_policy"])
    _validate_halt_policy(manifest["halt_policy"])
    _list_of_strings(manifest["known_exceptions"], "known_exceptions")
    _list_of_strings(manifest["unresolved_questions"], "unresolved_questions")
    _list_of_strings(manifest["non_claims"], "non_claims", allow_empty=False)

    _reject_vague_placeholders(manifest)


def validate_file(manifest_file: Path) -> None:
    manifest = parse_manifest(manifest_file.read_text(encoding="utf-8"))
    validate_manifest(manifest)
    print(f"Closed-world economy manifest PASS: {manifest['economy_id']}; status_authority=NONE")
    print(
        "This means only: the submitted manifest is internally consistent with selected "
        "declared invariants. It is not legal, security, economic, or harm-safety clearance."
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest-file", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        validate_file(args.manifest_file)
    except (ContractError, OSError) as exc:
        print(f"CLOSED-WORLD ECONOMY MANIFEST REJECTED: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
