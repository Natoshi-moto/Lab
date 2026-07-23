#!/usr/bin/env bash
# Emergency multi-drive repo snapshot — spam every configured drive, keep last N.
# Usage (from anywhere):
#   ./operations/backup/emergency_snapshot.sh
#   ./operations/backup/emergency_snapshot.sh --reason "operator emergency"
# status_authority: NONE — does not change STATUS.json

set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
CONF="${ROOT}/operations/backup/targets.env"
REASON="${1:-}"
if [[ "${1:-}" == "--reason" ]]; then
  REASON="${2:-operator-request}"
elif [[ "${1:-}" == -* ]]; then
  REASON="operator-request"
else
  REASON="${REASON:-operator-request}"
fi

if [[ ! -f "$CONF" ]]; then
  echo "NEXUS BACKUP ERROR: missing $CONF" >&2
  exit 2
fi

# shellcheck disable=SC1090
source "$CONF"

MAX_SNAPSHOTS="${MAX_SNAPSHOTS:-20}"
UTC="$(date -u +%Y%m%dT%H%M%SZ)"
SHORT_SHA="nogit"
if git -C "$ROOT" rev-parse --short HEAD >/dev/null 2>&1; then
  SHORT_SHA="$(git -C "$ROOT" rev-parse --short HEAD)"
fi
SNAP_ID="${UTC}_${SHORT_SHA}"
STAMP_DIR_NAME="snap_${SNAP_ID}"

echo "=== EMERGENCY SNAPSHOT $SNAP_ID ==="
echo "reason: $REASON"
echo "root:   $ROOT"
echo "max:    $MAX_SNAPSHOTS per target"

EXCLUDE=(
  --exclude 'node_modules/'
  --exclude '.git/objects/pack/tmp_*'
  --exclude 'products/noted-host/node_modules/'
  --exclude '__pycache__/'
  --exclude '.cache/'
  # Lab-Recovery freezes can be multi-GB; keep emergency snaps lean (20× roll)
  --exclude 'gateway-freezes/'
  --exclude '_quarantine/'
  --exclude '*.zip'
)

# Collect SOURCE_* and TARGET_*
declare -a SOURCES=()
declare -a SOURCE_NAMES=()
declare -a TARGETS=()

while IFS= read -r line; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  if [[ "$line" =~ ^SOURCE_([A-Za-z0-9_]+)=(.*)$ ]]; then
    SOURCE_NAMES+=("${BASH_REMATCH[1]}")
    SOURCES+=("${BASH_REMATCH[2]}")
  elif [[ "$line" =~ ^TARGET_([A-Za-z0-9_]+)=(.*)$ ]]; then
    TARGETS+=("${BASH_REMATCH[2]}")
  fi
done < "$CONF"

# USB autodiscovers
if [[ "${USB_AUTODISCOVER:-0}" == "1" ]]; then
  for d in /run/media/"${USER}"/*/lab-emergency-snapshots /media/"${USER}"/*/lab-emergency-snapshots; do
    [[ -d "$d" || -e "$(dirname "$d" 2>/dev/null)" ]] || continue
    parent="$(dirname "$d")"
    if [[ -d "$parent" && -w "$parent" ]]; then
      mkdir -p "$d" 2>/dev/null || true
      if [[ -d "$d" && -w "$d" ]]; then
        # avoid dupes
        skip=0
        for t in "${TARGETS[@]+"${TARGETS[@]}"}"; do
          [[ "$t" == "$d" ]] && skip=1
        done
        [[ $skip -eq 0 ]] && TARGETS+=("$d")
      fi
    fi
  done
  # also: any mounted stick with free write where we can create the folder
  for parent in /run/media/"${USER}"/* /media/"${USER}"/*; do
    [[ -d "$parent" && -w "$parent" ]] || continue
    # skip if looks like the OS root clones
    base="$(basename "$parent")"
    d="$parent/lab-emergency-snapshots"
    mkdir -p "$d" 2>/dev/null || true
    if [[ -d "$d" && -w "$d" ]]; then
      skip=0
      for t in "${TARGETS[@]+"${TARGETS[@]}"}"; do
        [[ "$t" == "$d" ]] && skip=1
      done
      [[ $skip -eq 0 ]] && TARGETS+=("$d") && echo "USB/auto target: $d"
    fi
  done
fi

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  echo "NEXUS BACKUP ERROR: no TARGET_* configured" >&2
  exit 2
fi

RECEIPT_DIR="${ROOT}/operations/receipts/EMERGENCY_SNAPSHOT_${UTC}"
mkdir -p "$RECEIPT_DIR"
RECEIPT="${RECEIPT_DIR}/RECEIPT.md"
{
  echo "# Emergency snapshot $SNAP_ID"
  echo
  echo "- **UTC:** $UTC"
  echo "- **Reason:** $REASON"
  echo "- **Lab tip:** \`$SHORT_SHA\`"
  echo "- **Max kept per target:** $MAX_SNAPSHOTS"
  echo "- **status_authority:** NONE"
  echo
  echo "## Results"
  echo
} > "$RECEIPT"

ok=0
fail=0
skipped=0

prune_old() {
  local dest_root="$1"
  local max="$2"
  # snap_* directories only, newest first
  mapfile -t snaps < <(find "$dest_root" -mindepth 1 -maxdepth 1 -type d -name 'snap_*' -printf '%T@ %p\n' 2>/dev/null | sort -rn | cut -d' ' -f2-)
  local n=${#snaps[@]}
  if (( n > max )); then
    local i
    for (( i=max; i<n; i++ )); do
      echo "  prune: ${snaps[$i]}"
      rm -rf "${snaps[$i]}"
    done
  fi
}

for dest in "${TARGETS[@]}"; do
  echo
  echo "--- target: $dest"
  if [[ ! -d "$(dirname "$dest")" && ! -d "$dest" ]]; then
    # try create parent if mount exists
    parent="$(dirname "$dest")"
    if [[ ! -d "$parent" ]]; then
      echo "  SKIP (parent missing — drive not mounted?): $parent"
      echo "- SKIP \`$dest\` — parent missing" >> "$RECEIPT"
      skipped=$((skipped + 1))
      continue
    fi
  fi
  if ! mkdir -p "$dest" 2>/dev/null; then
    echo "  SKIP (cannot create): $dest"
    echo "- SKIP \`$dest\` — cannot create" >> "$RECEIPT"
    skipped=$((skipped + 1))
    continue
  fi
  if [[ ! -w "$dest" ]]; then
    echo "  SKIP (not writable): $dest"
    echo "- SKIP \`$dest\` — not writable" >> "$RECEIPT"
    skipped=$((skipped + 1))
    continue
  fi

  snap_path="${dest}/${STAMP_DIR_NAME}"
  mkdir -p "$snap_path"
  meta="${snap_path}/SNAPSHOT_META.txt"
  {
    echo "snap_id=$SNAP_ID"
    echo "utc=$UTC"
    echo "reason=$REASON"
    echo "lab_sha=$SHORT_SHA"
    echo "host=$(hostname 2>/dev/null || echo unknown)"
  } > "$meta"

  copy_fail=0
  for i in "${!SOURCES[@]}"; do
    name="${SOURCE_NAMES[$i]}"
    src="${SOURCES[$i]}"
    if [[ ! -d "$src" ]]; then
      echo "  WARN missing source $name: $src"
      echo "missing_source_${name}=$src" >> "$meta"
      continue
    fi
    out="${snap_path}/${name}"
    echo "  rsync $name <- $src"
    if rsync -a --info=stats0,progress2 "${EXCLUDE[@]}" "$src/" "$out/"; then
      echo "  OK $name"
    else
      echo "  FAIL $name"
      copy_fail=1
    fi
  done

  # always include a git bundle of Lab if git repo
  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    bundle="${snap_path}/Lab.bundle"
    echo "  git bundle -> $bundle"
    git -C "$ROOT" bundle create "$bundle" --all 2>/dev/null || echo "  WARN bundle failed"
  fi

  prune_old "$dest" "$MAX_SNAPSHOTS"

  if [[ $copy_fail -eq 0 ]]; then
    echo "- **OK** \`$snap_path\`" >> "$RECEIPT"
    ok=$((ok + 1))
  else
    echo "- **PARTIAL/FAIL** \`$snap_path\`" >> "$RECEIPT"
    fail=$((fail + 1))
  fi
done

{
  echo
  echo "## Summary"
  echo
  echo "| ok | fail | skipped |"
  echo "|----|------|---------|"
  echo "| $ok | $fail | $skipped |"
  echo
  echo "Rolling delete: each target keeps newest **$MAX_SNAPSHOTS** \`snap_*\` directories."
} >> "$RECEIPT"

echo
echo "=== DONE ok=$ok fail=$fail skipped=$skipped ==="
echo "Receipt: $RECEIPT"

# soft success if at least one target ok
if [[ $ok -eq 0 ]]; then
  exit 1
fi
exit 0
