# External evidence register

**Task:** BGEN-EPISTEMIC-AUDIT-001 · **Accessed:** 2026-07-21 · **Authority:** none

External research was consulted only after the internal audit phases and the
pre-audit freeze were complete. Network access was available. Entries are
context anchors, not calibration: none of them converts a synthetic
parameter into an empirical estimate. No legal conclusions are made; legal
questions are scoped in OPEN_QUESTIONS.md for qualified counsel.

## E-1 — Counterparty (XCP) proof-of-burn genesis, January 2014

- **Source:** Counterparty documentation (docs.counterparty.io, "What is
  XCP?"); Wikipedia "Counterparty (technology)" and secondary summaries.
  Accessed 2026-07-21 via web search.
- **Proposition supported:** a bounded-epoch, send-Bitcoin-to-get-genesis-
  allocation mechanism has a real precedent: ~2,125.63 BTC (≈US$1.6–2M then)
  were sent to a provably unspendable address between 2014-01-02 and
  2014-02-03 (5,000 blocks), yielding ~2.6M XCP allocated proportionally.
  Participants committed funds under denominator uncertainty (final
  BTC-per-XCP ratio unknown until close), the exact exposure modelled as
  FC5.
- **Changes an internal assumption?** No parameter changes. It upgrades
  "people might participate in such a mechanism at all" from speculation to
  precedent, and demonstrates denominator-uncertain participation occurred
  in practice. Differences matter: burn destroys value (no charity
  recipient, no rebate surface), 2014 market conditions were unique, and
  XCP is not evidence of what a charity-destination variant would attract.
- **Confidence/limits:** HIGH that the event occurred as described (widely
  documented, on-chain verifiable in principle — not independently
  re-verified on-chain by this audit); LOW transferability to Beneficial
  Genesis specifics.

## E-2 — Laundering discounts on stolen cryptocurrency (Coincheck 2018 case study)

- **Source:** "How cryptocurrency is laundered: Case study of Coincheck
  hacking incident", Forensic Science International: Synergy (ScienceDirect,
  2021). Accessed 2026-07-21 via web search.
- **Proposition supported:** launderers of the stolen NEM offered it at a
  ~15% discount to market — direct evidence that stolen-asset alternative
  realization is below face value and that liquidation haircuts are real.
- **Changes an internal assumption?** Directionally validates the repaired
  tainted-fund model's structure (`alternative_realization_fraction < 1`,
  `liquidation_haircut > 0`) against the original zero-cost framing. Does
  **not** calibrate any parameter (one case, different asset, different
  channel).
- **Confidence/limits:** HIGH for the case fact; LOW for generalization to
  Bitcoin-donation channels.

## E-3 — Abuse of non-profit organisations for financial crime (FATF)

- **Source:** FATF, "Risk of Terrorist Abuse in Non-Profit Organisations"
  (June 2014); FATF Best Practices on Combating the Abuse of Non-Profit
  Organisations; FATF Recommendation 8 materials (fatf-gafi.org). Accessed
  2026-07-21 via web search.
- **Proposition supported:** abuse of charitable entities (including
  sham/complicit organisations) for illicit finance is a documented,
  regulator-recognized risk class with an established mitigation literature
  (risk-based vetting) — i.e., the rebate/complicit-charity adversary in
  FC2 is a real-world category, not a modelling invention, and charity-set
  curation (Track D) is the recognized control point.
- **Changes an internal assumption?** No rates. It supports treating rebate
  access probability as curation-dependent rather than a free constant —
  reinforcing this audit's finding that Track D design is the actual control
  variable for FC2.
- **Confidence/limits:** HIGH for the category's reality; the literature
  provides no incidence rate applicable to a hypothetical genesis charity
  set.

## Explicitly not found / not sought

- No empirical estimate of participation elasticity for
  donation-incentivized token distributions (the decisive unknown,
  AUD-MODEL-03). The Counterparty precedent shows participation > 0 for a
  burn variant; nothing bounds it for a charity variant.
- No calibration for rebate incidence, seizure probabilities, or lock-up
  discounts.
- No legal authority on any Track F question — deliberately, per the
  no-legal-conclusions constraint.
