# NOTED-SOVEREIGNTY-ASSAULT-001 — proposal packet

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22
**Parent programme:** `experiments/NOTED_PROJECT_OS_001/`
**Binds to:** `BGEN-CANONICAL-CHECKPOINT-001`
**Does not:** authorize implementation, merge, live funds, tokens, or any real-world economic value claim
**Authored by:** Claude, parallel design seat (ad hoc for this task — not `SEAT-CLAUDE-DEBUG` per `AI_ROUTING.md`; see open question in `CHARTER.md` about whether a design seat belongs in that map)

---

## What this is

A destination for hardening / sovereignty / privacy adversarial-review campaigns against the Noted Project OS host and its embedded Agent block — the "vicious multi-model assault → debug → retest" work the operator asked for after layout density work lands. It follows the same `operations/proposals/<ID>/` convention already used by R012–R016 (see `operations/proposals/R016_PCX_INTEGRATED_CUSTODY_GATE/` for a sibling example, including its own `THREAT_MODEL.md`).

This is **not** a certified audit, **not** a security product, and passing everything in here does not promote `status_authority` past `NONE`. Main records human authorization; this folder never does that on its own.

## Why this folder and not somewhere else

`experiments/NOTED_PROJECT_OS_001/CONTAINMENT.md` forbids new top-level junk folders without registration. `operations/proposals/` already is the registered, repo-wide destination for exactly this shape of thing — a bounded, not-yet-authorized campaign proposal, reviewed before any implementation starts. Putting Noted's security campaign in a Noted-only pocket would make it invisible to any AI or human scanning `operations/proposals/` the way every other proposal in this repo is found. Putting it here keeps one discovery path for the whole Lab.

A one-line pointer has been added to `experiments/NOTED_PROJECT_OS_001/README.md`'s read-order table so anyone starting from the Noted programme side finds this too.

## Read order

| Order | File | Purpose |
|---|---|---|
| 1 | This README | Orientation, why this exists, how to add to it |
| 2 | `THREAT_MODEL.md` | The numbered T-ID spine — what can leak, grounded in the actual code, not generic threat-modeling |
| 3 | `CHARTER.md` | Campaign structure: waves, seats, evidence bar, win conditions W1–W4 |
| 4 | `SNOOPER_IA.md` | Power Snooper membrane-mode design: warning state machine, log contents, retention, redaction, placement |
| 5 | `COLD_DROP_BAR.md` | Checklist gating "strangers can unpack this without shame" |
| 6 | `TENSION_MAP.md` | CDN/provider-keys vs. local-first sovereignty — options, not a decision |
| 7 | `ODS_SECURITY_CASES.md` | Spec-only stubs for new adversarial ODS P1 cases (`ODS-SEC-00x`), matching the existing `scripts/agent-prompt-smoke.mjs` / `npm run ods:p1` harness idiom |
| 8 | `NEXT_ACTION.proposal.md` | What actually needs a human decision next |
| 9 | `STATUS.proposal.json` | Draft status block for this proposal only — never the Lab's real `STATUS.json` |

## How any AI adds to this folder

1. New findings get a new **T-ID** appended to `THREAT_MODEL.md` (don't renumber existing ones — T-IDs are stable references other files cite).
2. A T-ID is not "closed" on a code-read alone. Closing requires: a reproducible probe, the fix, a re-run of the same probe showing it no longer reproduces, and a receipt recorded under `operations/receipts/` once the operator authorizes it. See `CHARTER.md`'s evidence bar.
3. Don't fold new material into one mega-document. Each file here has one job — a charter is not a threat model, a threat model is not a UI spec. Cross-reference T-IDs by number instead of repeating their content.
4. Same-provider or multi-model agreement is never independent corroboration — this applies here exactly as it does everywhere else in the Lab (`AI_ROUTING.md` §1).
5. Nothing in this folder authorizes implementation. If a wave is ready to build, that's a separate, explicit, human-authorized task — reference this folder's T-IDs in that task, don't copy them.
6. Never claim security certification, audit status, or real-world value here or in anything this folder leads to.

## Non-claims

Same as the rest of this programme: research only, no price/value endorsement, multi-AI agreement is not independence, this proposal is not permission. See `PURPOSE_AND_NONCLAIMS.md` at the Lab root and `CANONICAL_CHECKPOINT_001.md`.

---

## Sister packets (do not ignore)

**`operations/proposals/NOTED_STOP_THE_LINE_001/`** raises the **cost of ignoring this campaign**. It defines hard gates, a feature-work productivity tax, and a waiver-only escape hatch. Read it after this folder’s threat spine. It does not replace T-IDs; it makes them **economically unavoidable**.

**`operations/proposals/NOTED_MEMBRANE_HARDENING_001/`** is Grok-drive’s **updated hardening plan** (mutual distrust doctrine, sequenced H0–H5 work packages, claims lockdown, Claude review brief). It does **not** renumber T-IDs or close findings. Read after this folder + stop-the-line.
