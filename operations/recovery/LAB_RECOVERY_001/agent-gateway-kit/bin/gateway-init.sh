#!/usr/bin/env bash
# Agent Gateway init: set up TO_DO_LIST.md + quarantine in a target project.
set -eu
KIT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:?usage: gateway-init.sh /path/to/your/project}"
mkdir -p "$TARGET/_quarantine"
if [ -f "$TARGET/TO_DO_LIST.md" ]; then
  echo "• TO_DO_LIST.md already exists — not overwriting (that's the point of this kit)."
else
  cp "$KIT_DIR/templates/TO_DO_LIST.md" "$TARGET/TO_DO_LIST.md"
  echo "✔ created $TARGET/TO_DO_LIST.md — open it and fill in STATUS + NOW."
fi
cp -n "$KIT_DIR/AGENT_ONBOARDING.md" "$TARGET/AGENT_ONBOARDING.md" 2>/dev/null || true
echo "✔ quarantine folder ready: $TARGET/_quarantine/"
if [ ! -d "$TARGET/.git" ] && command -v git >/dev/null 2>&1; then
  echo "• Tip: run 'git init' in $TARGET when you're ready for Phase 2 (versioned home)."
fi
echo
echo "Next: python3 $KIT_DIR/bin/inventory.py \"$TARGET\" --out \"$TARGET/gateway-inventory\""
