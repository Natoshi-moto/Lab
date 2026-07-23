#!/bin/sh
# 🧷 Turn ON the toddler-proof hooks for THIS repo/clone.
# Usage:  bash operations/safety/hooks/install.sh
# Safe & reversible: it only copies two small scripts into your .git/hooks/.
# To turn OFF later: delete pre-push and pre-commit from the folder it prints.

set -e
here="$(cd "$(dirname "$0")" && pwd)"
hooks_dir="$(git rev-parse --git-common-dir)/hooks"
mkdir -p "$hooks_dir"

for h in pre-push pre-commit; do
  cp "$here/$h" "$hooks_dir/$h"
  chmod +x "$hooks_dir/$h"
  echo "✅ installed: $hooks_dir/$h"
done

echo ""
echo "🧷 Toddler-proof hooks are now ON for this clone."
echo "   - push to main/master will be BLOCKED"
echo "   - commit directly on main/master will be BLOCKED"
echo "   - every push prints a loud PUBLIC warning"
echo "🗑️  To turn OFF: delete pre-push and pre-commit from $hooks_dir"
