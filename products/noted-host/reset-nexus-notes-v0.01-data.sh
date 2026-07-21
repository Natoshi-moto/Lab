#!/usr/bin/env bash
set -euo pipefail

APP_ID="nexus-notes-v0.01"
APP_NAME="Nexus Notes v0.01"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
CONFIG_ROOT="${XDG_CONFIG_HOME:-$HOME/.config}"
PRIMARY_DATA_DIR="$CONFIG_ROOT/$APP_ID"
LEGACY_DATA_DIR="$CONFIG_ROOT/$APP_NAME"
BACKUP_ROOT="$CONFIG_ROOT/${APP_ID}-backups"

printf '\n== Resetting %s local Electron workspace profile ==\n' "$APP_NAME"
printf 'This moves Electron/Chromium profile data out of the way; it does not delete your exported .json backups.\n'

mkdir -p "$BACKUP_ROOT"

for dir in "$PRIMARY_DATA_DIR" "$LEGACY_DATA_DIR"; do
  if [ -e "$dir" ]; then
    base="$(basename "$dir" | tr ' /' '__')"
    target="$BACKUP_ROOT/${base}.${TIMESTAMP}"
    printf 'Moving %s -> %s\n' "$dir" "$target"
    mv "$dir" "$target"
  fi
done

printf 'Done. Next launch starts with a fresh local workspace database.\n\n'
