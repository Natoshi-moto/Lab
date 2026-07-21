# UI_SIGNAL_CANON

## Purpose

Keep attention colors meaningful as Nexus becomes more animated and interactive.

## Current canon

- **Amber**: commit, accepted action, important active state, selected forge candidate.
- **Cyan**: information, guidance, preview, non-destructive live state.
- **Rose**: error or failed verification.
- **Warn**: actual warning/pending risk, not decoration.
- **Ink-muted**: inactive, secondary, disabled, or quiet metadata.

## Sweep 15 note

Living Forge surfaces still use amber for selected/primary actions because that matches the recovered Eidolon forge files. Future UI cleanup should reduce decorative amber in neutral app chrome, especially where the user reported “amber signals everywhere.”

## Test hook

`tests/sweep15-living-forge-tests.js` protects the new living forge integrations. A future signal-audit test should assert that warning classes are not used for neutral decorations.

## Sweep 16 calibration — First Hour UX

Sweep 16 adds the first-hour onboarding layer over Living Forge OS: active Nexus-native Multiforge, clearer First Contact outcome copy, companion first-time callout, visible Home Notes → Companion handoff, Wallet zero-start explanation, Web Viewer empty/blocked/disabled states, and Player Thread v2 guidance. Runtime scope remains UX/UI only; wallet canon remains one visible NEX balance starting at 0.
