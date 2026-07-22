# White paper — Nexus Public Research Surface

**Title:** *A Distrust-First Public Surface for Multi-Model Research Desks*  
**ID:** `WP-NEXUS-PUBLIC-SURFACE-001`  
**Date (UTC):** 2026-07-22  
**Author seat:** Grok (xAI), under operator direction  
**status_authority:** `NONE`  
**Class:** design white paper for the Lab’s public website — **not** a product cert, **not** a token white paper, **not** investment materials

---

## Abstract

Multi-model research is currently trapped in chat transcripts, private recordings, and GitHub archaeology. Strangers cannot see **what class of claim** they are reading. This paper proposes a public website that is a **read-only projector** of the Nexus Lab’s git-backed objects — STATUS, receipts, publications, epistemic analyses, user disclosures, RAM board snapshots, and experiment freezes — with **semantic classes** (observed vs inference vs operator verbatim vs proposal vs receipt) enforced in the UI.

The site’s core product is not “trust us.” It is **navigable distrust**: permanent reasons not to trust, open reds, and methods others can re-run.

---

## 1. Problem

| Failure | Effect |
|---------|--------|
| Chat dies | Work narrative evaporates |
| Multi-seat agreement looks like science | False independence |
| Green CI badges | Misread as product safety |
| FAIL receipts buried in paths | Strangers never see scars |
| Marketing sites for AI labs | Soft-close risk, money confusion |

The operator runs **3+ models on one desk**. The public needs a surface that explains that mode without laundering it into “AI council approved.”

---

## 2. Thesis

> A research lab website should **publish methods, reds, and claim classes** faster than it publishes confidence.

Success is when a hostile stranger can answer in five minutes:

1. What is this project **not**?  
2. What is still **red**?  
3. What was **observed** vs **inferred** last week?  
4. How do I **re-run** doctor/verify or a break probe?  
5. Where is operator **verbatim** vs seat prose?

---

## 3. Design principles

1. **Distrust-first above the fold** — link permanent register; no hero “secure/safe/audited.”  
2. **Git is source of truth** — site builds from repo pins; no CMS override of STATUS.  
3. **Semantic color system** — OBSERVED / INFERENCE / OPERATOR_VERBATIM / PROPOSAL / RECEIPT.  
4. **Reds never soft-close** — `human_readable_reds` always visible until evidence removes them.  
5. **No token / no value language** — blocked in content lint.  
6. **Multi-seat ≠ multi-institution** — explicit page on bus factor and merger identity.  
7. **GVA-ready** — future embeds of public session stamps with recovery scores, labeled non-proof.  
8. **Boring beauty** — readable, high contrast, print-friendly; not crypto-casino aesthetics.

---

## 4. Audience

| Audience | Site must give them |
|----------|---------------------|
| Hostile engineer | Repro commands, reds, file paths |
| Researcher | Experiment index, non-claims, publications |
| Press | One statement page + “do not say” list |
| Future seat | Entry path + RAM + skills |
| Operator | Public mirror of scoreboard honesty |

---

## 5. Information architecture (site map)

```text
/                         Home: distrust strip + current STATUS snapshot + next action
/distrust                 WHY_NOT_TO_TRUST (rendered) + money ban
/status                   Live pin of STATUS.json + human reds
/start                    README_START_HERE + doctor commands
/publications             Round reports index
/epistemic                Forced seat-on-seat inference analyses
/disclosures              Operator verbatim
/experiments              Cards for R013–R016, BGEN, GVA-001, …
/break                    BREAK receipts plain-language
/methods                  Semantic routing bridge explainers
/ram                      Latest BOARD (read-only; clearly volatile)
/audit                    How to blind-audit this lab
/gva                      Video archive / attestation instrument (non-proof)
/play                     Gamification loops (synthetic standing only)
/genesis                  Eidolin genesis download + hashes
/mesh                     BYO Nostr / PDS / IRC / P2P — you own the network
/relays                   Community relay hints (non-mandatory)
/social-not               Explicit: we are not your only social network
/legal                    MIT + non-claims + no solicitation
```

**Distributed social + game design (detail):** [`DISTRIBUTED_SOCIAL_GAMIFIED.md`](DISTRIBUTED_SOCIAL_GAMIFIED.md)

---

## 6. Semantic routing on the web

Every card and paragraph carries a **class chip**:

| Chip | Color intent | Source |
|------|--------------|--------|
| OBSERVED | Cool solid | Commands, SHAs, API |
| INFERENCE | Amber hatch | Epistemic analyses |
| OPERATOR | White bold | user-disclosures |
| PROPOSAL | Dashed | proposed-features, GVA |
| RECEIPT | Green outline | operations/receipts |
| RED | Red solid | human_readable_reds |

Mixing classes in one sentence is a lint error: split or relabel.

---

## 7. Trust model (site-wide footer)

```text
trust(this website) ≤ trust(git pin it built from) ≤ trust(operator) 
Grok/Claude/Codex agreement ≠ independence
No real-world economic value · Research only
```

---

## 8. What we will not ship on v1

- Account login / social graph  
- Token, NFT, or donation-as-investment framing  
- “Audited secure” badges  
- Live agent that can claim STATUS authority  
- Hidden reds  

---

## 9. Evaluation

| Question | Pass |
|----------|------|
| Can a stranger find T-01 red in &lt;60s? | Yes |
| Can they see an INFERENCE labeled as such? | Yes |
| Can they run doctor from /start? | Yes |
| Does CI fail if money language sneaks in? | Yes (content lint) |

---

## 10. Relation to Lab objects

| Object | Website role |
|--------|----------------|
| `STATUS.json` | `/status` pin |
| `communications/publications` | `/publications` |
| `communications/publications/epistemic` | `/epistemic` |
| `user-disclosures` | `/disclosures` |
| `docs/SEMANTIC_ROUTING_BRIDGE.md` | `/methods` |
| `experiments/*` | `/experiments` |
| GVA public videos | `/gva` embeds later |

---

## 11. Non-claims

This white paper authorizes **no** product launch, **no** token, **no** security certificate, and **no** upgrade of seat inference to fact.  
`status_authority: NONE`
