# Player Thread

Status: **Sweep I/J shipped** on 2026-05-09.

## Purpose

The Player Thread is a local, UI-only guidance service inside `Nexus_OS.html`. It answers the first-session question: "what should I do next?" without adding a quest log, backend state, rewards, or a new block.

It makes the OS feel more coherent after Sweep H's notification layer by bridging onboarding, Library, Atlas, Wallet, Witness, and Notifications through one quiet taskbar affordance.

## Non-goals

- No backend state.
- No deterministic engine edits.
- No wallet math edits.
- No witness/economy scoring edits.
- No new blocks.
- No forced modal tutorial.
- No invented rewards or claim states.
- No daily-task / achievement language.

## Storage key

```js
`nx-player-thread-${KERNEL_SECRET}`
```

The state is browser-local UX memory only. It is not protocol or economy state.

## State shape

```js
{
  version: 1,
  updatedAt: 0,
  milestones: {
    welcomeSeen: false,
    firstContactStarted: false,
    mootImprinted: false,
    environmentSelected: false,
    desktopReached: false,
    libraryOpened: false,
    atlasOpened: false,
    walkerOpened: false,
    walletOpened: false,
    witnessOpened: false,
    firstNotificationSeen: false,
    firstNotificationActionClicked: false
  },
  dismissals: {},
  history: []
}
```

History is bounded to 40 entries. Malformed or absent storage normalizes to a safe default state.

## Resolver priority

The resolver produces exactly one current thread. Higher-priority OS states win:

1. `await-confirmation` — pending publish count > 0.
2. `review-realm-activity` — unread notification count > 0.
3. `begin-first-contact` — no known Moot and first contact not started.
4. `view-your-moot` — known Moot but Library not opened.
5. `choose-environment` — environment not selected.
6. `walk-the-planet` — Library opened but Atlas/Walker not opened.
7. `witness-to-earn` — Wallet opened, zero balance, Witness unopened.
8. `open-wallet` — known Moot, Wallet unopened.
9. `explore-freely` — early path complete.

## Action routing

Supported actions:

- `launch`
- `open-notifications`
- `open-launcher`
- `return-desktop`

Launches use the existing app catalog and the existing `launchApp` path. Missing preferred targets fall back rather than stalling.

## Fallback rules

Current fallback map:

```js
{
  "first-contact": ["guide", "library", "launcher"],
  "environment-pick": ["mission-control", "launcher"],
  "library": ["vibes-library", "launcher"],
  "atlas": ["walker", "library", "vibes-library", "launcher"],
  "walker": ["atlas", "library", "vibes-library", "launcher"],
  "witness": ["wallet", "mission-control", "launcher"],
  "wallet": ["launcher"],
  "genesis": ["wallet", "launcher"]
}
```

This archive does not contain the later narrative `first-contact` block, so the first-contact thread falls back to the existing guide block.

## Dismissal rules

The desktop nudge is dismissible per thread ID. Dismissal cooldown is 24 hours. The taskbar chip remains visible because it is low-pressure persistent chrome, not a popup.

## Accessibility

- The taskbar chip has `aria-label="Current thread: ..."`.
- The desktop nudge uses `aria-live="polite"`.
- Reduced-motion users inherit the shell motion reduction path.
- Guidance is clickable but not mandatory.

## UI surfaces

- `#nx-thread-chip` in the taskbar.
- `#nx-thread-nudge` desktop card.
- Palette commands: `next`, `thread`, `continue`, `what now`, `current thread`.
- Notification history empty state action.

## Wallet / Genesis visual pass

The same sweep also made Wallet and Genesis more legible:

- Wallet balance gained a dashboard-like intent card.
- Wallet empty states gained direct action buttons.
- Wallet Genesis gained a ritual/trust-anchor hero and status grid.
- Standalone Genesis Verifier gained a hero trust grid, input/results cards, and stronger verdict styling.

These are presentation changes. They do not change signatures, conservation checks, authority pinning, UTXO consumption, or proof rules.

## Test coverage

`tests/player-thread-tests.js` covers:

- storage key shape,
- taskbar metadata,
- resolver priority,
- pending/unread overrides,
- lattice imprint milestone tracking,
- dead-letter avoidance for shell-consumed thread events,
- bounded history,
- palette command presence,
- fallback routing,
- Wallet/Genesis polish sentinel classes.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

Player Thread now has a real `first-contact` target available. Fallback remains important for partial archives, but the preferred route should stay `first-contact → blocks/world/first-contact.html` as long as the block exists.

## Sweep 14 — Control, persistence, and one-wallet clarity

- Baseline after implementation: `bash tests/run.sh` reports 473 passes / 0 fails.
- First Contact now writes real `vibe.save` envelopes for the accepted companion/world when Vibes Library is awake, while also mirroring the world into Atlas local fallback storage.
- Environment Forge now has human presets, Library save, Atlas fallback mirroring, and desktop background preview/finalization.
- Compose Stage is now a three-step ingredient flow: Companion → World → The Room. It routes to existing legacy forge tools only.
- Desktop Home Notes stores local notes under `nexus:home-notes:v1` and sends a one-shot inbox item to Companion at `nexus:home-note-inbox:v1`. Companion imports that as a movable note and clears the inbox.
- Wallet copy now emphasizes one wallet / one visible NEX balance. UTXOs are labeled as proof outputs, not separate balances.
- Delete/Backspace shielding was broadened for focused text inputs to reduce Chromium shortcut prompts during searches/typing.



## 2026-05-09 boot calibration note

Player Thread remains current after boot calibration. It is a local shell guidance service, not backend state or progression. No runtime changes were made during the doc-only pass; tests remain 473/0.

---

## Sweep 15 — Living Forge OS integration (2026-05-09)

Calibration baseline after this sweep: **526 passes / 0 fails** via `bash tests/run.sh`; `node tools/channel-atlas.js --check` passes with **67 channels across 35 blocks**.

Material user-facing changes:
- Added shared Eidolon UX/runtime adapters: `engines/eidolon-schema.js`, `engines/eidolon-creature-renderer.js`, `engines/eidolon-environment-renderer.js`, `engines/eidolon-battle-renderer.js`, `engines/eidolon-storage.js`.
- First Contact now uses the shared live creature/world forge renderers and emits both `system.companion.selected` and `system.environment.selected` on acceptance.
- The OS shell now renders the selected environment as an animated desktop canvas and the selected companion as an animated bottom-left inhabitant.
- Lattice Shell is now a real axis-level creature forge with editable labels, locks, sweeps, group randomize, and selected-companion persistence.
- Environment Forge is now a full axis-level world forge with presets, 16:9 live canvas, sweep controls, creature silhouette preview, Library save, and Atlas fallback.
- Compose Stage is now a Battleforge-style scrub/playback attack authoring surface with 3x3 candidates, phase bar, templates, and `system.attack.selected`.
- Web Viewer now has a persistent history stack, repaired back/forward routing, search fallback, and Delete/Backspace shielding in the URL bar.
- Companion imports canonical Eidolon `axes` specs and polls the Home Notes inbox for same-tab iframe writes.

Preserved invariants:
- Wallet remains zero-start and one visible NEX balance.
- No economy, witness, ranked-battle, or deterministic battle math was changed.
- Legacy Eidolon files remain preserved under `legacy/eidolon-forges/` as canon/source material.

## Sweep 16 calibration — First Hour UX

Sweep 16 adds the first-hour onboarding layer over Living Forge OS: active Nexus-native Multiforge, clearer First Contact outcome copy, companion first-time callout, visible Home Notes → Companion handoff, Wallet zero-start explanation, Web Viewer empty/blocked/disabled states, and Player Thread v2 guidance. Runtime scope remains UX/UI only; wallet canon remains one visible NEX balance starting at 0.
