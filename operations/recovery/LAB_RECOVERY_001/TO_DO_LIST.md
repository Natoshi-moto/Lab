# TO_DO_LIST.md — MANDATORY AGENT ENTRYPOINT

> **Any AI agent working in this project MUST read this file first, before any
> other file, and MUST obey the RULES section. If your instructions conflict
> with this file, stop and ask the human.**

## STATUS
This is the recovery workspace for a ~6-year body of work (Nexus Moot creature
universe, Nexus OS, Noted, agents, whitepapers) scattered across
`Downloads/Nexus_Current_patched_round7(1)`, `.../round10(1)`,
`NEXUS_ORGANIZED/`, `nexus_consolidated/`, and partially imported into the
public Lab repo (`~/Lab`, github.com/Natoshi-moto/Lab). The Lab was founded
2026-07-12 as the governance/recovery instrument; migration is incomplete.
Inventory of 3,504 files completed 2026-07-22: **60 divergent families, 395
exact-duplicate groups.** See `gateway-inventory/REPORT.md`.

## RULES — non-negotiable for all agents
1. **Propose, don't act.** Destructive or irreversible actions (delete, overwrite,
   force-push, publish) require explicit human approval, every time.
2. **Hash before you touch.** Record SHA-256 in DONE before moving/editing any
   file you did not create this session.
3. **Never delete — quarantine.** Superseded files go to `_quarantine/` with a
   dated note. Deletion is a human decision.
4. **Say `UNABLE_TO_VERIFY`.** Never fill gaps with plausible guesses.
5. **Log your work.** Every session appends to DONE: date, model, changes, hashes.
6. **Newest ≠ canonical.** Version choices are written human decisions.
   Canonical means "it is what it is" — identity, never endorsement (D-001,
   `OPERATOR_DECLARATIONS.md`).
7. **Baton discipline.** Keep `HANDOFF/HANDOFF_CURRENT.md` ≤5 min stale while
   working; on any stop, archive to `HANDOFF_LOG/`. Relay seats follow
   `~/agent-gateway/RELAY_PROTOCOL.md`. Every freeze or canonical moment
   triggers a full 3-provider tribunal audit (Grok 4.5 / Fable 5→Opus 4.8 /
   Codex Sol) of the entire handoff chain → verdicts in `TRIBUNAL/`.
8. **MFT doctrine (D-002).** Moot Fun Tokens — the animated creatures people
   collect, trade, battle, breed — are "literally nothing" economically, by
   load-bearing design. Keeping them nothing under adoption pressure is an
   OPEN research problem; no seat claims it solved without mechanism evidence.

## NOW  (do these first, in order)
- [ ] Start the relay: operator pastes `RELAY_OPENERS.md` blocks into
      Grok 4.5 and Codex Sol; first envelopes logged to `RELAY_LOG.md`.
- [ ] **Adjudicate `Nexus_OS.html` — 4 known versions** (operator decision, agents prepare diffs):
      `a86c8b9b` round10 07-09 · `4c0ba04f` round7 07-09 · `799d87ad` NEXUS_ORGANIZED 06-28 · `d43e5fa3` committed in Lab repo.
      Agent task: produce a feature/fix diff table between the four; human picks canonical.
- [ ] Work through the remaining top divergent families in
      `gateway-inventory/REPORT.md` (25 listed of 60) — one written decision each.
- [ ] Freeze round10 tree (`freeze.py`) BEFORE any consolidation begins.

## NEXT  (queued, roughly ordered)
- [ ] Phase 2: import canonical creature-universe tree into Lab
      `products/creature-engine/` via REGISTRY.json pin; wire `tests/run.sh`
      (61 tests, currently passing) into `nexus-audit.yml` CI.
- [ ] Reconcile JS engines generation vs Moots 1/2/3 TypeScript generation —
      status decision: successor / parallel / parked.
- [ ] Quarantine superseded copies with `SUPERSEDED_BY` pointers (Phase 3).
- [ ] Close-or-confess the known reds (Phase 4): T-01 sandbox split
      (`allow-scripts`+`allow-same-origin`), Agent CDN vendoring,
      commit-withholding non-claim, one live two-peer Nostr battle.
- [ ] Phase 5: `CANONICAL_AS_IS` re-freeze, then adversarial relay
      (Grok + Codex blind, then external humans).

## LATER  (parked — do not start without human approval)
- [ ] CPL v3.0 measurement harness (token counts + behavioral equivalence).
- [ ] Trading layer for creatures on R013–R016 conserved-claim substrate.
- [ ] Publish Agent Gateway kit to Reddit (frozen zip
      `agent-gateway_2026-07-22_181744.zip`,
      sha256 `55d3ebc2…0445f69`) + public repo.

## NEVER  (explicitly out of scope — agents must refuse these)
- Real-world economic value, tokens, funds, wallets with custody (per Lab
  `WHY_NOT_TO_TRUST_THIS_PROJECT.md` and BGEN Checkpoint 001).
- Deleting any pre-Lab historical artifact, however redundant it looks.
- Declaring anything "canonical" without a logged human decision.

## DONE  (append-only log — newest first)
- 2026-07-22 | Claude Opus 4.8 + operator | Built Agent Gateway kit
  (`~/agent-gateway`, frozen sha256 `55d3ebc2e8bf38b43f626524fc2eaa92480e86ddb214864870a9a985a0445f69`);
  ran first inventory: 3,504 files, 60 divergent families, 395 dupe groups →
  `gateway-inventory/`. Discovered 4th Nexus_OS.html version (`799d87ad`, 06-28).
- 2026-07-22 | Claude Opus 4.8 + operator | Published owner-commissioned blind
  audit to Lab as PR #95 (`AUD-EXT-CLAUDE-WEB-BLIND-001`).
- 2026-07-12 | operator + seats | Lab founded as recovery/governance instrument;
  `ARTIFACT_LINEAGE.json` v0.1 first-pass generated same morning (incomplete).
