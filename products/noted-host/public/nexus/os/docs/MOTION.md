# Nexus Motion Language

Status: **Sweep H shipped**. This document is the canonical reference for motion vocabulary introduced by the OS communication pass.

## Purpose

Motion is now treated as shared OS language rather than per-block decoration. The goal is to make live events legible without turning the taskbar into a noisy HUD.

## Semantic tokens

The shell now defines these tokens in `Nexus_OS.html`. A mirrored reference file also exists at `engines/nexus-tokens.css` for future extraction into shared CSS.

```css
--motion-enter:    240ms cubic-bezier(0.2, 0.8, 0.2, 1);
--motion-exit:     180ms cubic-bezier(0.4, 0, 1, 1);
--motion-emphasis: 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
--motion-pulse:    var(--pulse-mid);
--motion-shake:    180ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
--motion-count:    var(--count-speed);
--motion-reduce:   1ms;
```

## Keyframes

The current shared shell vocabulary is:

- `nx-fade-in`
- `nx-fade-out`
- `nx-slide-in-right`
- `nx-slide-out-right`
- `nx-pulse-amber`
- `nx-pulse-cyan`
- `nx-pulse-rose`
- `nx-shake`
- `nx-count-up`
- `nx-count-down`
- `nx-shimmer`

## Reduced motion

`prefers-reduced-motion: reduce` is honored by overriding the semantic motion tokens to `--motion-reduce` and reducing global animation / transition durations to 1ms inside the shell. Future blocks should use the semantic tokens instead of hard-coded timings so the accessibility behavior composes automatically.

## Current consumers

- OS notification toasts: `nx-slide-in-right` / `nx-slide-out-right`.
- Reward notifications: `nx-shimmer` accent.
- Live taskbar NEX chip: `nx-count-up` / dimming via `flash-credit` and `flash-debit`.
- Realm activity indicator: `nx-pulse-amber`, `nx-pulse-cyan`, `nx-pulse-rose` by event class.
- Open matching windows: `nx-live-pulse` or `nx-live-pulse-cyan` when a routed event lands.

## Future extraction rule

Do not move these rules into `engines/nexus-tokens.css` as a runtime dependency until every block load path is audited. The current CSS file is a reference and future shared-token seed; the OS still inlines the tokens to preserve the no-build, single-entry boot contract.


## Sweep I/J additions

The Player Thread uses the existing shell motion vocabulary for one-shot emphasis on thread changes and for the desktop nudge entrance. Wallet/Genesis polish adds CSS transitions and reduced-motion guards, but does not introduce a new semantic motion vocabulary.

Current additional consumers:

- `#nx-thread-chip`: one-shot `nx-pulse-cyan` on thread change.
- `#nx-thread-nudge`: `nx-fade-in` entrance, hidden after dismissal.
- Wallet dashboard cards: hover transitions only, reduced-motion guarded.
- Genesis verifier verdict sheen/loading: reduced-motion guarded.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

First Contact, Environment Forge, and Lattice Shell use live canvas animation. Preserve reduced-motion friendliness when adding future motion controls: do not make these surfaces mandatory to understand the state, and keep selected companion/world values visible as text.

## Sweep 14 — Control, persistence, and one-wallet clarity

- Baseline after implementation: `bash tests/run.sh` reports 473 passes / 0 fails.
- First Contact now writes real `vibe.save` envelopes for the accepted companion/world when Vibes Library is awake, while also mirroring the world into Atlas local fallback storage.
- Environment Forge now has human presets, Library save, Atlas fallback mirroring, and desktop background preview/finalization.
- Compose Stage is now a three-step ingredient flow: Companion → World → The Room. It routes to existing legacy forge tools only.
- Desktop Home Notes stores local notes under `nexus:home-notes:v1` and sends a one-shot inbox item to Companion at `nexus:home-note-inbox:v1`. Companion imports that as a movable note and clears the inbox.
- Wallet copy now emphasizes one wallet / one visible NEX balance. UTXOs are labeled as proof outputs, not separate balances.
- Delete/Backspace shielding was broadened for focused text inputs to reduce Chromium shortcut prompts during searches/typing.



## 2026-05-09 boot calibration note

Motion vocabulary remains current after boot calibration. No CSS/runtime changes were made during the doc-only pass; tests remain 473/0.
