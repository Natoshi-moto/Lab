# Eidolin Testing and Release Draft

## Release principle

The first Eidolin release should be small, reproducible and honest. A stranger must be able to identify the launched implementation, build it, run it, preserve a creature and understand every network and economic boundary.

## Gate 0 — choose the bytes

- [ ] Inventory all Eidolin/Eidolon/Edolin/Lattice copies and launched paths.
- [ ] Compare duplicate TypeScript trees by digest and behavior.
- [ ] Select one candidate root and mark the others legacy/reference.
- [ ] Record which Nexus catalog entry launches which file.
- [ ] Freeze a component version and source digest.

## Gate 1 — clean build

- [ ] Lock dependencies.
- [ ] Run install, typecheck, build, smoke and audit from a clean checkout.
- [ ] Confirm `index.html` references files included in the release.
- [ ] Serve through the documented HTTP root.
- [ ] Confirm tests and build leave the committed tree unchanged.
- [ ] Record supported browsers and platform limitations.

## Gate 2 — deterministic engine

- [ ] Run golden vectors for terrain, DNA, names, manifestations and birth.
- [ ] Test multiple frame rates and pause/resume.
- [ ] Corrupt every protected input and observe verification failure.
- [ ] Separate display timestamps from identity derivation.
- [ ] Property-test normalized ranges and state transitions.
- [ ] Prove renderer failure cannot alter canonical outcomes.

## Gate 3 — persistence and portability

- [ ] Test primary, pending and backup recovery.
- [ ] Test truncated, malformed and future-version saves.
- [ ] Export and import on a fresh browser profile.
- [ ] Preserve conflicting histories rather than overwriting.
- [ ] Exclude secrets and private memory from public exports.
- [ ] Document deletion and reset.

## Gate 4 — Nexus integration

- [ ] Complete managed-block handshake through the actual Noted host.
- [ ] Validate every declared channel and payload.
- [ ] Reject undeclared events, replay and forged source identity.
- [ ] Suspend hidden-route simulation as specified.
- [ ] Require approval for model, Noted-write and publication capabilities.
- [ ] Produce receipts without leaking private content.

## Gate 5 — public boundary

- [ ] Remove/quarantine wallet and transferable NEX surfaces from release routes.
- [ ] Reject price, sale, transfer, redemption, payout, wrap and bridge events.
- [ ] Display strict-no-sale language where social state appears.
- [ ] Inventory all network, CDN, API and relay access.
- [ ] Use no valuable keys in demonstrations.
- [ ] Run a full-history secret scan.

## Documentation required for a tag

```text
README.md
LICENSE or inherited-license statement
CHANGELOG.md
docs/ARCHITECTURE.md
docs/ANIMATION_AND_RENDERING.md
docs/CREATURE_DATA_AND_SAVES.md
docs/NEXUS_INTEGRATION.md
docs/SECURITY.md
docs/KNOWN_LIMITATIONS.md
docs/RELEASE_RECEIPT.md
```

## Evidence standard

A source file can establish that code exists. A test run can establish behavior in one environment. A controlled mutation can establish that a verifier detects one class of failure. None alone establishes production safety. Release receipts should state exact commands, exit codes, environment, commit, dirty state and unchecked areas.

## Raw-release acceptance

An acceptable raw release may omit AI conversation, Nostr, social mechanics and Nex-Sim. It may not mislabel those omissions as hidden capabilities. The minimum useful slice is a deterministic creature/world experience that builds cleanly, saves and exports reliably, runs inside the documented Nexus route, and does not expose financial or secret-key hazards.
