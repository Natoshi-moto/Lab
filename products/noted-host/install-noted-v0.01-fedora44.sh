#!/usr/bin/env bash
# ============================================================
# Noted v0.01 — Fedora 44 Workstation Installer
# Run from inside the unzipped folder containing package.json.
#
# Changes from the Fedora 43 script:
# - keeps Electron inside ~/.local/share/noted-v0.01 so launchers survive
#   source-folder moves and Fedora upgrades;
# - uses npm ci when package-lock.json is present;
# - does not move/reset your existing profile unless --clean-profile is passed.
# ============================================================
set -euo pipefail

APP_NAME="Noted v0.01"
APP_ID="noted-v0.01"
CMD_NAME="noted-v0.01"
RESET_CMD_NAME="noted-v0.01-reset"
INSTALL_DIR="$HOME/.local/share/$APP_ID"
BIN_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_ROOT="$HOME/.local/share/icons/hicolor"
CONFIG_ROOT="${XDG_CONFIG_HOME:-$HOME/.config}"
DATA_DIR="$CONFIG_ROOT/$APP_ID"
BACKUP_ROOT="$CONFIG_ROOT/${APP_ID}-backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
CLEAN_PROFILE=0

for ARG in "$@"; do
  case "$ARG" in
    --clean-profile) CLEAN_PROFILE=1 ;;
    -h|--help)
      cat <<HELP
Usage: ./install-noted-v0.01-fedora44.sh [--clean-profile]

Installs Noted v0.01 for the current user on Fedora 44.

Options:
  --clean-profile  Move ~/.config/noted-v0.01 to a timestamped backup before launch.
HELP
      exit 0
      ;;
    *) echo "ERROR: unknown option: $ARG"; exit 1 ;;
  esac
done

printf '\n== Installing %s for Fedora 44 ==\n' "$APP_NAME"

if [ ! -f "package.json" ]; then
  echo "ERROR: run this from the folder containing package.json."
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  cat <<'MSG'
ERROR: Node.js and npm are required.
Install them on Fedora with:
  sudo dnf install -y nodejs
MSG
  exit 1
fi

printf '\n== Node toolchain ==\n'
node --version
npm --version

printf '\n== Installing project dependencies ==\n'
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

printf '\n== Building app ==\n'
npm run build

if [ ! -f "dist/index.html" ]; then
  echo "ERROR: build failed: dist/index.html was not created."
  exit 1
fi
if [ ! -f "electron/main.cjs" ]; then
  echo "ERROR: electron/main.cjs missing."
  exit 1
fi

if [ "$CLEAN_PROFILE" = "1" ]; then
  printf '\n== Backing up existing profile data because --clean-profile was passed ==\n'
  mkdir -p "$BACKUP_ROOT"
  if [ -e "$DATA_DIR" ]; then
    mv "$DATA_DIR" "$BACKUP_ROOT/${APP_ID}.${TIMESTAMP}"
    printf 'Backed up to %s\n' "$BACKUP_ROOT/${APP_ID}.${TIMESTAMP}"
  else
    printf 'No existing profile found at %s\n' "$DATA_DIR"
  fi
else
  printf '\n== Keeping existing profile data ==\n'
  printf 'Profile: %s\n' "$DATA_DIR"
  printf 'Use --clean-profile only if you intentionally want a fresh profile.\n'
fi

mkdir -p "$INSTALL_DIR" "$BIN_DIR" "$DESKTOP_DIR" \
  "$ICON_ROOT/scalable/apps" "$ICON_ROOT/64x64/apps" \
  "$ICON_ROOT/128x128/apps" "$ICON_ROOT/256x256/apps" "$ICON_ROOT/512x512/apps"

printf '\n== Copying app files ==\n'
rm -rf "$INSTALL_DIR/dist" "$INSTALL_DIR/icons" "$INSTALL_DIR/electron"
cp -R dist electron icons "$INSTALL_DIR/"

cat > "$INSTALL_DIR/package.json" <<'JSON'
{
  "name": "noted-v0.01-runtime",
  "version": "0.1.0",
  "main": "electron/main.cjs",
  "private": true,
  "dependencies": {
    "electron": "latest"
  }
}
JSON

printf '\n== Installing Electron runtime into app install dir ==\n'
npm install --prefix "$INSTALL_DIR" --omit=dev --no-audit --no-fund

if [ ! -x "$INSTALL_DIR/node_modules/.bin/electron" ]; then
  echo "ERROR: Electron runtime was not installed at $INSTALL_DIR/node_modules/.bin/electron"
  exit 1
fi

printf '\n== Installing icons ==\n'
[ -f "icons/noted-v0.01.svg" ] && cp "icons/noted-v0.01.svg" "$ICON_ROOT/scalable/apps/$APP_ID.svg"
for SIZE in 64 128 256 512; do
  SRC="icons/noted-v0.01-${SIZE}.png"
  [ -f "$SRC" ] && cp "$SRC" "$ICON_ROOT/${SIZE}x${SIZE}/apps/$APP_ID.png"
done
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

printf '\n== Writing launcher ==\n'
LAUNCHER="$BIN_DIR/$CMD_NAME"
cat > "$LAUNCHER" <<SCRIPT
#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$INSTALL_DIR"
cd "\$APP_DIR"
ELECTRON_BIN="\$APP_DIR/node_modules/.bin/electron"
if [ ! -x "\$ELECTRON_BIN" ]; then
  echo "Electron runtime missing: \$ELECTRON_BIN"
  echo "Re-run the Fedora 44 installer from the source folder."
  exit 1
fi
export ELECTRON_OZONE_PLATFORM_HINT="\${ELECTRON_OZONE_PLATFORM_HINT:-auto}"
exec "\$ELECTRON_BIN" . "\$@"
SCRIPT
chmod +x "$LAUNCHER"

RESET_LAUNCHER="$BIN_DIR/$RESET_CMD_NAME"
cat > "$RESET_LAUNCHER" <<SCRIPT
#!/usr/bin/env bash
set -euo pipefail
PROFILE="$CONFIG_ROOT/$APP_ID"
BACKUP_ROOT="$BACKUP_ROOT"
STAMP="\$(date +%Y%m%d-%H%M%S)"
echo "This moves the Electron profile out of the way: \$PROFILE"
echo "Exported .json backups are not affected."
read -rp "Type YES to confirm: " R
if [ "\$R" = "YES" ]; then
  mkdir -p "\$BACKUP_ROOT"
  if [ -e "\$PROFILE" ]; then
    mv "\$PROFILE" "\$BACKUP_ROOT/$APP_ID.\$STAMP"
    echo "Moved to \$BACKUP_ROOT/$APP_ID.\$STAMP"
  else
    echo "No profile found."
  fi
else
  echo "Cancelled."
fi
SCRIPT
chmod +x "$RESET_LAUNCHER"

cat > "$DESKTOP_DIR/$APP_ID.desktop" <<DESKTOP
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

printf '\n== Smoke check ==\n'
"$INSTALL_DIR/node_modules/.bin/electron" --version || true

printf '\n== Done ==\n\n'
printf 'Launch command: %s\n' "$CMD_NAME"
printf 'Reset command:  %s\n' "$RESET_CMD_NAME"
printf 'App files:      %s\n' "$INSTALL_DIR"
printf 'Profile data:   %s\n\n' "$DATA_DIR"
printf 'If %s is not found, add ~/.local/bin to PATH and restart your terminal.\n' "$CMD_NAME"
