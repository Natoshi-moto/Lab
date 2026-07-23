#!/usr/bin/env bash
# Hash all files under the Full Spectrum pack (sorted paths) into one tree digest.
# status_authority: NONE
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/PACK_TREE.sha256"
# Exclude the output file itself if present
TMP="$(mktemp)"
(
  cd "$ROOT"
  find . -type f ! -name 'PACK_TREE.sha256' -print0 \
    | sort -z \
    | xargs -0 sha256sum
) >"$TMP"
TREE="$(sha256sum "$TMP" | awk '{print $1}')"
{
  echo "# Full Spectrum pack tree digest"
  echo "# generated_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "# method=sha256sum of sorted 'sha256sum path' lines for all pack files"
  echo "pack_tree_sha256=$TREE"
  echo ""
  cat "$TMP"
} >"$OUT"
rm -f "$TMP"
echo "Wrote $OUT"
echo "pack_tree_sha256=$TREE"
