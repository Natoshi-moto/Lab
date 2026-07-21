# Noted v0.01 — Installation Reference (legacy filename preserved)

## Fedora 43 Workstation

```bash
bash install-nexus-notes-v0.01-3-fedora.sh
```

**Prerequisites:**
```bash
sudo dnf install -y nodejs npm
```

## Launch

```bash
nexus-notes-v0.01-3
```

Or find **Nexus Notes v0.01-3** in the GNOME app drawer.

## Reset workspace data

```bash
nexus-notes-v0.01-3-reset
```

## What's new in v0.01-3 (Sweep 40)

- **Settings → Diagnostic tab**: Live store record counts, localStorage key
  presence audit (dots, no values shown), schema version display.
  Export workspace JSON and copy a diagnostic summary for bug reports.
- **Settings → Health tab**: 8 workspace health signals — orphan notes,
  unassigned scraps, aging inbox items, unused tags, documents without
  project, empty projects, stale pipelines, AI-lineage records.
  Each shows count, example, and an Open button that navigates directly.
- Runtime evidence class: RUNTIME-INSTRUMENTABLE. Open Settings → Diagnostic
  and verify store counts to attest RUNTIME-VERIFIED.
- Tagline updated: "a private knowledge foundry"

## Uninstall

```bash
rm -rf ~/.local/share/nexus-notes-v0.01-3
rm -f ~/.local/bin/nexus-notes-v0.01-3
rm -f ~/.local/bin/nexus-notes-v0.01-3-reset
rm -f ~/.local/share/applications/nexus-notes-v0.01-3.desktop
for SIZE in scalable 64x64 128x128 256x256 512x512; do
  rm -f ~/.local/share/icons/hicolor/${SIZE}/apps/nexus-notes-v0.01-3.*
done
# Remove profile (backup first!):
rm -rf ~/.config/nexus-notes-v0.01-3
```
