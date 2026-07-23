#!/usr/bin/env bash
# Full Spectrum pack integrity: CLAIMS.json ids must appear in CLAIMS_REGISTER.md
# and core handoff files must exist. status_authority: NONE — local/CI helper only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REG="$ROOT/CLAIMS_REGISTER.md"
JSON="$ROOT/CLAIMS.json"
FAIL=0

need=(
  "$ROOT/HANDOFF_ANY_AI.md"
  "$ROOT/OPERATOR_ONE_PAGE.md"
  "$ROOT/README.md"
  "$ROOT/PACK_INDEX.json"
  "$REG"
  "$JSON"
  "$ROOT/MITHUB.md"
  "$ROOT/GENESIS_TRACEABILITY.md"
  "$ROOT/LOOM_RECORD_001_PACK_GENESIS.md"
)

for f in "${need[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "MISSING: $f"
    FAIL=1
  fi
done

if [[ ! -f "$JSON" || ! -f "$REG" ]]; then
  echo "Cannot check claim ids"
  exit 1
fi

# Extract CLAIM-* ids from JSON without requiring jq
mapfile -t IDS < <(grep -oE 'CLAIM-[A-Z0-9-]+' "$JSON" | sort -u)

if [[ ${#IDS[@]} -lt 1 ]]; then
  echo "No CLAIM ids found in CLAIMS.json"
  exit 1
fi

for id in "${IDS[@]}"; do
  if ! grep -qF "$id" "$REG"; then
    echo "CLAIM missing from CLAIMS_REGISTER.md: $id"
    FAIL=1
  fi
done

# Dual-write scent: MITHUB claims should appear in MITHUB.md
for id in CLAIM-MIT-001 CLAIM-MIT-002 CLAIM-MIT-003 CLAIM-MIT-004 CLAIM-MIT-005; do
  if ! grep -qF "$id" "$ROOT/MITHUB.md" && ! grep -qF "CLAIM-MIT" "$ROOT/MITHUB.md"; then
    echo "WARN: $id not referenced in MITHUB.md (soft)"
  fi
done

if [[ "$FAIL" -ne 0 ]]; then
  echo "check_claim_ids: FAIL"
  exit 1
fi

echo "check_claim_ids: PASS (${#IDS[@]} ids, core files present)"
exit 0
