# Nexus Notes v0.01-3 install commands

Use these commands from inside the unzipped **Nexus Notes v0.01-3** folder — the folder that contains `package.json`.

## Install / clean reinstall as desktop app on Fedora

This installer backs up any old Electron profile folder for v0.01-3 before launch so the app can start from a clean local IndexedDB workspace. Exported `.json` backups are not touched.

```bash
chmod +x ./install-nexus-notes-v0.01-3-fedora.sh && ./install-nexus-notes-v0.01-3-fedora.sh
```

## Open after install

```bash
nexus-notes-v0.01-3
```

## Reset only the local Electron workspace profile

Use this if the app shows **“The workspace could not be loaded.”** It deletes the local Electron profile after explicit confirmation. Exported `.json` backups are not affected.

```bash
nexus-notes-v0.01-3-reset && nexus-notes-v0.01-3
```

Profile data is stored under:

```text
~/.config/nexus-notes-v0.01-3/
```

Installer profile backups are stored under:

```text
~/.config/nexus-notes-v0.01-3-backups/
```

## Uninstall launcher/app files only

No standalone uninstaller script is currently present in the repo. To remove the installed app files while preserving exported backups, run:

```bash
rm -rf ~/.local/share/nexus-notes-v0.01-3 \
  ~/.local/bin/nexus-notes-v0.01-3 \
  ~/.local/bin/nexus-notes-v0.01-3-reset \
  ~/.local/share/applications/nexus-notes-v0.01-3.desktop
```

Remove profile data separately only after backing up anything needed:

```bash
rm -rf ~/.config/nexus-notes-v0.01-3
```

## Packaging rule for future AIs

Every future delivered full `.zip` for this app must include:

- `install-nexus-notes-v0.01-3-fedora.sh`
- `reset-nexus-notes-v0.01-data.sh`
- `NEXUS_NOTES_INSTALL_COMMANDS.MD`
- `NEXUS_NOTES_V0.01-3_INSTALL.MD`
- `electron/main.cjs`
- `icons/nexus-notes-v0.01.svg`
- PNG icon sizes: 64, 128, 256, 512
- built artifacts: `dist/`, `verse-studio.html`, and `noted-v0.02.html`
- an install command note that tells the user to run the installer from the folder containing `package.json`

Do not replace this install path with Electron/Tauri/AppImage packaging changes unless the Orchestrator explicitly asks for a dedicated packaging sweep.

## v0.01-3 packaging note

This package uses the existing Fedora-compatible install script, `install-nexus-notes-v0.01-3-fedora.sh`. It does not change DB/schema/storage contracts.
