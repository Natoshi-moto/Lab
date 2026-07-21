#!/usr/bin/env bash
# ============================================================
# Nexus Notes v0.01-3 — Fedora 43 Workstation Installer
# Run from inside the unzipped folder containing package.json.
# ============================================================
set -euo pipefail

APP_NAME="Nexus Notes v0.01-3"
APP_ID="nexus-notes-v0.01-3"
CMD_NAME="nexus-notes-v0.01-3"
RESET_CMD_NAME="nexus-notes-v0.01-3-reset"
INSTALL_DIR="$HOME/.local/share/$APP_ID"
BIN_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_ROOT="$HOME/.local/share/icons/hicolor"
CONFIG_ROOT="${XDG_CONFIG_HOME:-$HOME/.config}"
DATA_DIR="$CONFIG_ROOT/$APP_ID"
BACKUP_ROOT="$CONFIG_ROOT/${APP_ID}-backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

printf '\n== Installing %s ==\n' "$APP_NAME"

if [ ! -f "package.json" ]; then
  echo "ERROR: Run this from the folder containing package.json."
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js required. Fedora 43: sudo dnf install -y nodejs npm"; exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm required. Fedora 43: sudo dnf install -y nodejs npm"; exit 1
fi

if [ ! -f "dist/index.html" ]; then
  printf '\n== Building app ==\n'
  npm install && npm run build
fi
if [ ! -f "dist/index.html" ]; then
  echo "ERROR: Build failed."; exit 1
fi

ELECTRON_BIN="$(command -v electron 2>/dev/null || true)"
if [ -z "$ELECTRON_BIN" ] && [ -f "node_modules/.bin/electron" ]; then
  ELECTRON_BIN="$PWD/node_modules/.bin/electron"
fi
if [ -z "$ELECTRON_BIN" ]; then
  printf '\n== Installing Electron locally ==\n'
  npm install --save-dev electron@latest
  ELECTRON_BIN="$PWD/node_modules/.bin/electron"
fi

printf '\n== Backing up existing profile data ==\n'
mkdir -p "$BACKUP_ROOT"
if [ -e "$DATA_DIR" ]; then
  mv "$DATA_DIR" "$BACKUP_ROOT/${APP_ID}.${TIMESTAMP}"
  printf 'Backed up to %s\n' "$BACKUP_ROOT/${APP_ID}.${TIMESTAMP}"
fi

mkdir -p "$INSTALL_DIR" "$BIN_DIR" "$DESKTOP_DIR" \
  "$ICON_ROOT/scalable/apps" "$ICON_ROOT/64x64/apps" \
  "$ICON_ROOT/128x128/apps" "$ICON_ROOT/256x256/apps" "$ICON_ROOT/512x512/apps"

rm -rf "$INSTALL_DIR/dist" "$INSTALL_DIR/icons" "$INSTALL_DIR/electron"
cp -R dist electron icons "$INSTALL_DIR/"

cat > "$INSTALL_DIR/package.json" << 'JSON'
{"name":"nexus-notes-v0.01-3","version":"0.1.3","main":"electron/main.cjs","private":true}
JSON

printf '\n== Installing icons ==\n'
[ -f "icons/nexus-notes-v0.01.svg" ] && cp "icons/nexus-notes-v0.01.svg" "$ICON_ROOT/scalable/apps/$APP_ID.svg"
for SIZE in 64 128 256 512; do
  SRC="icons/nexus-notes-v0.01-${SIZE}.png"
  [ -f "$SRC" ] && cp "$SRC" "$ICON_ROOT/${SIZE}x${SIZE}/apps/$APP_ID.png"
done
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

printf '\n== Writing launcher ==\n'
LAUNCHER="$BIN_DIR/$CMD_NAME"
cat > "$LAUNCHER" << SCRIPT
#!/usr/bin/env bash
cd "$INSTALL_DIR"
exec "${ELECTRON_BIN}" . "\$@"
SCRIPT
chmod +x "$LAUNCHER"

RESET_LAUNCHER="$BIN_DIR/$RESET_CMD_NAME"
cat > "$RESET_LAUNCHER" << SCRIPT
#!/usr/bin/env bash
PROFILE="${CONFIG_ROOT}/${APP_ID}"
echo "Deletes Electron profile at: \$PROFILE"
echo "Exported .json backups are not affected."
read -rp "Type YES to confirm: " R
if [ "\$R" = "YES" ]; then rm -rf "\$PROFILE"; echo "Done. App re-seeds on next launch."; else echo "Cancelled."; fi
SCRIPT
chmod +x "$RESET_LAUNCHER"

cat > "$DESKTOP_DIR/$APP_ID.desktop" << DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=${APP_NAME}
Comment=A private knowledge foundry
Exec=${LAUNCHER} %U
Icon=${APP_ID}
Terminal=false
Categories=Office;Utility;
StartupWMClass=${APP_ID}
StartupNotify=true
X-GNOME-SingleWindow=true
DESKTOP

update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

printf '\n== Done ==\n\n'
printf 'Launch:     %s\n' "$CMD_NAME"
printf 'Reset data: %s\n' "$RESET_CMD_NAME"
printf 'App files:  %s\n\n' "$INSTALL_DIR"
printf 'If icon missing in GNOME: gtk-update-icon-cache -f -t ~/.local/share/icons/hicolor\n\n'
