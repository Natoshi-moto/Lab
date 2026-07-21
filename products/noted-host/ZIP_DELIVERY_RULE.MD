# ZIP_DELIVERY_RULE.MD

When an AI delivers a full Noted codebase ZIP, the ZIP must include:

1. The full source codebase.
2. Current canonical governance docs.
3. `dist/` and packed HTML artifacts if build succeeds (`verse-studio.html` + `noted-v0.01.html`).
4. The version-matched Fedora installer: `install-noted-v0.01-fedora.sh`
5. `Quick Install Command Fedora 43.txt`
6. `NOTED_V0.01_INSTALL_COMMANDS.MD`
7. Icon assets: `icons/noted-v0.01.svg` + PNGs at 64/128/256/512.
8. `electron/main.cjs`

The required install command from inside the unzipped folder containing `package.json` is:

```bash
chmod +x ./install-noted-v0.01-fedora.sh && ./install-noted-v0.01-fedora.sh
```

Do not emit a ZIP without verifying these files match the current app name and version.
Do not invent a new Electron/Tauri/AppImage packaging stack when the existing installer is present and working.
