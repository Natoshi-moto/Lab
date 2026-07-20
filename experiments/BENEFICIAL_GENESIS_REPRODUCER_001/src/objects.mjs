/**
 * Protocol object construction and validation.
 */

import {
  DOMAIN_CHARITY_SET,
  PROTOCOL_VERSION,
} from "./constants.mjs";
import {
  canonicalJsonBytes,
  domainHashHex,
  requireHex,
} from "./encoding.mjs";

export function charityGenesisEntry({
  charity_id,
  script_pubkey_hex,
  attestation_commitment_hex,
  valid_from_height,
  valid_until_height,
}) {
  requireHex("script_pubkey_hex", script_pubkey_hex);
  requireHex("attestation_commitment_hex", attestation_commitment_hex, { expectedBytes: 32 });
  if (!charity_id || typeof charity_id !== "string") {
    throw new Error("charity_id required");
  }
  if (
    typeof valid_from_height !== "number" ||
    typeof valid_until_height !== "number" ||
    !Number.isInteger(valid_from_height) ||
    !Number.isInteger(valid_until_height) ||
    valid_from_height < 0 ||
    valid_until_height < valid_from_height
  ) {
    throw new Error("invalid charity validity window");
  }
  return {
    attestation_commitment_hex,
    charity_id,
    script_pubkey_hex,
    valid_from_height,
    valid_until_height,
  };
}

export function charitySetCommitment(entries) {
  const ids = entries.map((e) => e.charity_id);
  if (ids.length !== new Set(ids).size) {
    throw new Error("DUPLICATE_CHARITY_ENTRY");
  }
  const ordered = [...entries].sort((a, b) =>
    a.charity_id < b.charity_id ? -1 : a.charity_id > b.charity_id ? 1 : 0,
  );
  const digest = domainHashHex(
    DOMAIN_CHARITY_SET,
    canonicalJsonBytes({ entries: ordered, version: PROTOCOL_VERSION }),
  );
  return {
    commitment_hex: digest,
    entries: ordered,
    schema: "CharitySetCommitment",
    version: PROTOCOL_VERSION,
  };
}

export function validateCharitySet(obj) {
  if (
    !obj ||
    typeof obj !== "object" ||
    new Set(Object.keys(obj)).size !== 4 ||
    !("commitment_hex" in obj && "entries" in obj && "schema" in obj && "version" in obj)
  ) {
    throw new Error("MALFORMED_CHARITY_ENTRY");
  }
  if (obj.schema !== "CharitySetCommitment" || obj.version !== PROTOCOL_VERSION) {
    throw new Error("MALFORMED_CHARITY_ENTRY");
  }
  try {
    requireHex("commitment_hex", obj.commitment_hex, { expectedBytes: 32 });
  } catch {
    throw new Error("MALFORMED_CHARITY_ENTRY");
  }
  const entries = obj.entries;
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error("MALFORMED_CHARITY_ENTRY");
  }
  const validated = [];
  for (const entry of entries) {
    if (
      !entry ||
      typeof entry !== "object" ||
      new Set(Object.keys(entry)).size !== 5 ||
      !(
        "attestation_commitment_hex" in entry &&
        "charity_id" in entry &&
        "script_pubkey_hex" in entry &&
        "valid_from_height" in entry &&
        "valid_until_height" in entry
      )
    ) {
      throw new Error("MALFORMED_CHARITY_ENTRY");
    }
    try {
      validated.push(charityGenesisEntry(entry));
    } catch {
      throw new Error("MALFORMED_CHARITY_ENTRY");
    }
  }
  const ids = validated.map((e) => e.charity_id);
  if (ids.length !== new Set(ids).size) {
    throw new Error("DUPLICATE_CHARITY_ENTRY");
  }
  if (JSON.stringify(ids) !== JSON.stringify([...ids].sort())) {
    throw new Error("MALFORMED_CHARITY_ENTRY");
  }
  const expected = charitySetCommitment(validated);
  if (obj.commitment_hex !== expected.commitment_hex) {
    throw new Error("CHARITY_SET_COMMITMENT_INVALID");
  }
  return expected;
}
