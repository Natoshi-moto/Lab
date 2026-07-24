# Secondary-market and leakage model

**status_authority:** `NONE`

**This model does not claim all external trade can be prevented.** Its job is
to make leakage observable, bound the response, and force a receipt at every
escalation — not to promise a sealed system. `operations/LANGUAGE_STANDARD.md`
already states the equivalent posture for language: *"Hostile to it, never
immune from it."* This file is that posture applied to markets.

## Threat catalog

Each threat: preconditions, observable indicators, likely harms, detection
options, containment options, redesign options, halt threshold, evidence
limitations.

### Account sales
- **Preconditions:** an account holds visible standing/progress; no binding
  identity check ties the account to one person.
- **Indicators:** login-location discontinuities; sudden behaviour-pattern
  shift; classified-ad listings referencing the system by name.
- **Harms:** buyer receives unverified provenance; seller may be coerced or
  underpaid; undermines the meaning of earned standing for everyone else.
- **Detection:** external listing-site sweeps (manual or scripted, publicly
  available data only); behavioural-discontinuity heuristics.
- **Containment:** non-transferability by design (see `EARNING_AND_RECOGNITION_MODEL.md`)
  removes most of the object of sale; cannot remove sale of login credentials
  themselves.
- **Redesign:** bind more account state to verified, non-transferable identity
  signals where privacy-appropriate.
- **Halt threshold:** evidence of organized, high-volume account-sale
  brokering — see `HALT_AND_ESCALATION_RULES.md`.
- **Evidence limitations:** most account sales happen entirely off-platform
  and are only ever partially observable.

### OTC trading / brokers
- **Preconditions:** any object with perceived scarcity or status value.
- **Indicators:** third-party sites or channels advertising to "buy/sell"
  system objects; broker accounts with unusual transaction-volume patterns
  where any transfer surface exists at all.
- **Harms:** price discovery outside operator control; pressure toward
  informal escrow scams; reputational harm to the project.
- **Detection:** external monitoring of marketplaces/forums; internal
  anomaly detection on any transfer surface that exists.
- **Containment:** minimize or remove transfer surfaces (`INVARIANTS.md` §E
  defaults); public statements refusing to recognize off-platform deals.
- **Redesign:** convert a transferable category to non-transferable if
  brokering becomes persistent.
- **Halt threshold:** sustained broker activity the containment options
  cannot suppress — see `HALT_AND_ESCALATION_RULES.md`.
- **Evidence limitations:** brokers actively evade detection; absence of
  observed brokering is not evidence of absence.

### Escrow (third-party or informal)
- **Preconditions:** OTC trading exists (see above).
- **Indicators:** third-party "trusted middleman" accounts/services referencing
  the system.
- **Harms:** escrow-scam exposure for users; false sense of security.
- **Detection:** same as OTC.
- **Containment:** explicit public non-endorsement; no official escrow ever
  (`PROHIBITED_CAPABILITIES.md`'s `operator_escrow_for_external_trade`).
- **Redesign:** n/a — this threat is a symptom of OTC trading, treat at that
  root.
- **Halt threshold:** shared with OTC trading.
- **Evidence limitations:** shared with OTC trading.

### Farming (automated or organized over-earning)
- **Preconditions:** an internal-consumable or scarce object can be earned
  repeatedly by scripted or organized-labour means.
- **Indicators:** anomalous earn-rate distributions; account clusters with
  correlated timing.
- **Harms:** devalues genuine participants' standing; concentrates scarce
  objects for resale purposes even absent an official transfer path (farmed
  objects still leak via account sale).
- **Detection:** rate/anomaly monitoring on earn events.
- **Containment:** rate limits, proof-of-work-equivalent friction, review
  queues for anomalous accounts.
- **Redesign:** reduce or remove scarcity where farming pressure is
  structural rather than incidental.
- **Halt threshold:** farming at a scale that materially devalues the
  category for genuine participants.
- **Evidence limitations:** sophisticated farming mimics genuine behaviour.

### Bots
- **Preconditions:** any automatable earn or participation action.
- **Indicators:** superhuman action rates; API-shaped traffic patterns.
- **Harms:** same as farming; also degrades any social/participation
  category's meaning.
- **Detection:** standard bot-detection heuristics; rate anomalies.
- **Containment:** standard anti-automation controls.
- **Redesign:** reduce reliance on raw action-count for any earned category.
- **Halt threshold:** shared with farming.
- **Evidence limitations:** shared with farming.

### Wash trading
- **Preconditions:** any transfer or bilateral-exchange surface exists.
- **Indicators:** repeated transfers between a small closed set of accounts;
  circular transfer graphs.
- **Harms:** manufactures false scarcity/price signals for external observers,
  even with no official price.
- **Detection:** transfer-graph analysis.
- **Containment:** rate limits and graph-anomaly flags on any transfer
  surface.
- **Redesign:** remove the transfer surface if wash trading is structural.
- **Halt threshold:** wash trading used to support an external price
  narrative about the project (see `misleading_financial_promotion`, but
  note the promotion is third-party, not official — see
  `INVARIANTS.md` §F category 4).
- **Evidence limitations:** wash trading can be indistinguishable from
  genuine repeated gifting between friends at small scale.

### Speculative hoarding
- **Preconditions:** `scarce: true` on any category.
- **Indicators:** concentration of a scarce category in few accounts with
  no corresponding participation.
- **Harms:** locks genuine future participants out of a scarce category;
  invites external price speculation on the hoarded objects.
- **Detection:** concentration/Gini-style analysis on scarce categories.
- **Containment:** avoid `scarce: true` unless functionally necessary; add
  decay or expiry to scarce categories.
- **Redesign:** convert scarce categories to abundant where scarcity was
  incidental rather than load-bearing.
- **Halt threshold:** hoarding that is clearly speculative (no participation
  correlate) at a scale threatening the category's internal meaning.
- **Evidence limitations:** distinguishing hoarding from legitimate
  long-term participation is inherently probabilistic.

### Price boards / fake scarcity
- **Preconditions:** any object perceived to have differential desirability.
- **Indicators:** third-party sites publishing "prices" for system objects.
- **Harms:** legitimizes external market framing regardless of official
  non-endorsement; can mislead users into believing there is real value.
- **Detection:** external web monitoring.
- **Containment:** public correction statements; no official acknowledgment
  that lends the board legitimacy.
- **Redesign:** n/a — symptom of underlying scarcity/desirability design.
- **Halt threshold:** widely-cited price boards materially misleading users
  about real-world value (see `HALT_AND_ESCALATION_RULES.md` "marketing
  implies profit" — note this is third-party marketing the project must
  actively counter-message against, not project marketing).
- **Evidence limitations:** cannot compel third-party site takedown in
  general; monitoring is necessarily incomplete.

### Stolen accounts
- **Preconditions:** accounts hold any earned standing worth taking.
- **Indicators:** credential-stuffing patterns; user reports.
- **Harms:** direct harm to the victim; stolen standing may then be sold
  (compounds with account sales above).
- **Detection:** standard account-security monitoring.
- **Containment:** standard account-security controls (outside this
  document's economy-specific scope; see `USER_HARM_AND_POWER_MODEL.md`'s
  "account theft" row for the harm side).
- **Redesign:** n/a.
- **Halt threshold:** shared with the general security posture, not
  economy-specific.
- **Evidence limitations:** shared with general account-security limits.

### Creator exploitation
- **Preconditions:** `stewardship_responsibilities` or `creative_permissions`
  holders produce value others capture.
- **Indicators:** disproportionate benefit flowing to non-creators from
  creator-produced content/objects.
- **Harms:** unpaid-labour dynamics disguised as "recognition."
- **Detection:** contribution-vs-benefit tracking.
- **Containment:** ensure creator categories retain non-transferable
  authorship credit regardless of downstream use.
- **Redesign:** revisit whether a category structurally extracts creator
  labour without adequate recognition.
- **Halt threshold:** see `USER_HARM_AND_POWER_MODEL.md`'s "labour
  extraction" row.
- **Evidence limitations:** exploitation can be structural and hard to
  attribute to a single decision.

### Coercive acquisition
- **Preconditions:** any object with perceived value that can be demanded
  under threat, social pressure, or harassment.
- **Indicators:** user reports; correlated account transfers under duress
  patterns.
- **Harms:** direct harm to coerced users.
- **Detection:** user reports primarily; hard to detect mechanically.
- **Containment:** non-transferability removes the object of coercion for
  most categories by design.
- **Redesign:** n/a for non-transferable categories; revisit any
  transferable category if coercion reports appear.
- **Halt threshold:** any confirmed coercive-acquisition pattern at scale.
- **Evidence limitations:** severely under-reported by nature.

### External derivatives
- **Preconditions:** a third party creates a financial instrument referencing
  system objects (e.g., a "futures market" on an object's future rarity).
- **Indicators:** external site/exchange listings referencing the system.
- **Harms:** legitimizes financial framing of the system entirely outside
  operator control or knowledge.
- **Detection:** external monitoring.
- **Containment:** public non-endorsement; no data feeds that would make
  such derivatives easier to build (relates to `price_oracle` prohibition).
- **Redesign:** n/a.
- **Halt threshold:** see `HALT_AND_ESCALATION_RULES.md`.
- **Evidence limitations:** cannot prevent third parties building anything
  referencing public information.

### Social-media price promotion
- **Preconditions:** any perceived scarcity/desirability, official or not.
- **Indicators:** influencer or community posts quoting "prices" or urging
  acquisition "before it's worth more."
- **Harms:** directly manufactures the misleading-promotion harm this
  framework exists to prevent, even when the promoter is not the operator.
- **Detection:** social monitoring.
- **Containment:** public correction; refusal to amplify or thank such
  promotion even when it "helps growth."
- **Redesign:** n/a.
- **Halt threshold:** see `HALT_AND_ESCALATION_RULES.md` "marketing implies
  profit."
- **Evidence limitations:** cannot control third-party speech; can only
  refuse to benefit from or endorse it.

### Operator benefit from unofficial trade
- **Preconditions:** the operator has any way to gain (attention, revenue,
  reputation) from external trade of system objects.
- **Indicators:** operator promotion, retweeting, or referencing external
  trade approvingly; operator revenue tied to trading volume by any path.
- **Harms:** converts the operator from a closure-enforcing party into a
  closure-breaking party — the single most severe threat in this catalog,
  because every other containment option assumes an operator motivated to
  contain, not benefit.
- **Detection:** conflict-of-interest review (see `USER_HARM_AND_POWER_MODEL.md`).
- **Containment:** structural — no revenue or incentive path may depend on
  external trade volume (`INVARIANTS.md` §A.4, §A.9, §A.10).
- **Redesign:** remove any incentive structure found to create this
  dependency.
- **Halt threshold:** any confirmed instance is treated as a halt condition
  outright (`HALT_AND_ESCALATION_RULES.md` "operator facilitates exchange or
  pricing"), not merely investigated.
- **Evidence limitations:** intent is hard to prove; the framework
  therefore treats the structural possibility itself, not just confirmed
  intent, as reportable.

### Third-party commercial services around internal objects
- **Preconditions:** any object valuable enough to support a service economy
  (boosting, coaching-for-standing, power-leveling).
- **Indicators:** third-party sites/services advertising system-specific
  paid services.
- **Harms:** commercializes participation; pressures users to pay for
  standing indirectly even with no official redemption.
- **Detection:** external monitoring.
- **Containment:** public non-endorsement; terms of service addressing
  service-purchase-driven account access where legally appropriate (outside
  this document's scope to draft).
- **Redesign:** reduce the grind/reward gap that makes such services
  attractive.
- **Halt threshold:** see `HALT_AND_ESCALATION_RULES.md`.
- **Evidence limitations:** cannot prevent third-party services referencing
  public game/system mechanics.

## Leakage response ladder

Every stage below produces a receipt (see `RECEIPT.json`'s pattern and
`operations/receipts/` conventions elsewhere in this Lab). No stage may be
skipped downward silently — a jump from `OBSERVE` straight to
`HALT_ECONOMY` is permitted when warranted but must state why intermediate
stages were skipped, not simply omit them.

1. **`OBSERVE`** — passive monitoring notices an indicator from the catalog
   above. Receipt: what was observed, when, by what method.
2. **`INVESTIGATE`** — active review of scope and confirmation. Receipt:
   findings, confidence, affected object classes.
3. **`WARN`** — public or targeted-user communication about a detected
   pattern (e.g., a scam-escrow warning). Receipt: message sent, audience,
   reason.
4. **`THROTTLE`** — rate-limit the mechanism enabling the leak. Receipt:
   what was throttled, expected user impact.
5. **`RESTRICT_TRANSFER`** — tighten or remove a transfer surface for the
   affected category. Receipt: exact policy change, category affected.
6. **`SUSPEND_MECHANIC`** — pause the mechanic entirely pending redesign.
   Receipt: scope, expected duration, user communication.
7. **`FREEZE_AFFECTED_OBJECT_CLASS`** — freeze the specific object class
   implicated (not the whole economy). Receipt: exact class, holders
   affected, and the due-process model below.
8. **`HALT_ECONOMY`** — stop the entire economy pending
   `HALT_AND_ESCALATION_RULES.md` review. Receipt: full incident summary.
9. **`RETIRE_MECHANIC`** — permanently remove a mechanic found structurally
   unable to stay closed. Receipt: rationale, what replaces it if anything.

**No automatic confiscation without a separate due-process model.** Any
stage that would remove or freeze a specific user's holdings (stage 7
especially) must be preceded by: notice to the affected user where feasible,
a stated reason, and an appeal path per `USER_HARM_AND_POWER_MODEL.md`'s
"wrongful suspension" and "inaccessible appeals" rows. A design that cannot
describe its due-process model for stage 7 has not satisfied this ladder,
regardless of how well it detects leakage.
