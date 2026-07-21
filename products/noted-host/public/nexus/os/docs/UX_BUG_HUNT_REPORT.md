# UX_BUG_HUNT_REPORT

## Sweep 15 bug/UX findings and repairs

### Browser back/forward

**Finding:** Web Viewer had a shallow in-memory history stack and was fragile when navigating through blocked iframe states.

**Repair:** `blocks/apps/nexus-webviewer.html` now has a persistent `nx-webviewer-history-v2` stack, `goToHistory()`, normalized URL/search handling, and URL-bar Delete/Backspace shielding.

### Environment/creature static feel

**Finding:** First Contact, Lattice Shell, and Environment Forge were not using the recovered Eidolon mechanics as the player-facing feel.

**Repair:** Added shared Eidolon schema/renderers and wired First Contact, Lattice Shell, Environment Forge, OS desktop background, and live companion to them.

### Companion/Home Notes bridge

**Finding:** Desktop Home Notes could write the inbox while Companion was already open, but the import only happened on Companion init.

**Repair:** Companion now listens for storage changes and also polls `nexus:home-note-inbox:v1` as a same-tab iframe fallback.

### Compose Stage confusion

**Finding:** Compose Stage was still mostly a launcher/router.

**Repair:** Compose Stage now provides Battleforge-style 3×3 attack candidates, playback scrubber, phase bar, speed controls, template save, and `system.attack.selected`.

### Canonical economy

**Status:** Preserved. Wallet still starts at 0 NEX and no forge/first-contact path grants NEX.

## Verification

```text
526 passes / 0 fails
```

## Sweep 16 calibration — First Hour UX

Sweep 16 adds the first-hour onboarding layer over Living Forge OS: active Nexus-native Multiforge, clearer First Contact outcome copy, companion first-time callout, visible Home Notes → Companion handoff, Wallet zero-start explanation, Web Viewer empty/blocked/disabled states, and Player Thread v2 guidance. Runtime scope remains UX/UI only; wallet canon remains one visible NEX balance starting at 0.
