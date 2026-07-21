# Noted v0.01 — Install Commands

Use these commands from inside the unzipped **Noted v0.01** folder — the folder containing `package.json`.

## Install / clean reinstall on Fedora 43

```bash
chmod +x ./install-noted-v0.01-fedora.sh && ./install-noted-v0.01-fedora.sh
```

## Launch

```bash
noted-v0.01
```

## Reset workspace

If the app shows **"The workspace could not be loaded."**:

```bash
noted-v0.01-reset && noted-v0.01
```

Profile data: `~/.config/noted-v0.01/`
Installer backups: `~/.config/noted-v0.01-backups/`

## Uninstall

```bash
rm -rf ~/.local/share/noted-v0.01 \
  ~/.local/bin/noted-v0.01 \
  ~/.local/bin/noted-v0.01-reset \
  ~/.local/share/applications/noted-v0.01.desktop
```
