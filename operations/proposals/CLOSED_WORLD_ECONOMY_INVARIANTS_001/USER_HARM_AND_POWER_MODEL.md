# User-harm and operator-power model

**status_authority:** `NONE`

**Do not assume benevolent ownership is sufficient.** This file exists
because good intent does not bound power, and this proposal treats operator
action as system action (`INVARIANTS.md` §F, category 5) — an operator who
personally facilitates leakage is not a mitigating exception to this model,
they are its most severe entry.

## Part 1 — user harm

For each harm: affected users, safeguards, monitoring, appeal path,
rollback/restitution concept, unresolved questions.

### Minors
- **Affected:** users below the applicable age of majority/consent, and
  their guardians.
- **Safeguards:** age-appropriate design defaults; no chance-plus-value
  mechanics ever reach any user without adult verification the system does
  not currently have a way to perform reliably (see unresolved questions).
- **Monitoring:** none currently specified — unresolved.
- **Appeal path:** guardian-initiated account review.
- **Rollback/restitution:** account/data removal on verified guardian
  request.
- **Unresolved questions:** this framework has no age-verification mechanism
  to propose; treat any system with an under-18-reachable user base as
  requiring gate 6 (`IMPLEMENTATION_GATES.md`) before any chance or scarce
  mechanic ships to it at all.

### Compulsive engagement
- **Affected:** any user, disproportionately those prone to compulsive
  patterns.
- **Safeguards:** no engagement mechanic may be tuned against measured
  session-extension as a design goal; visible time/activity summaries.
- **Monitoring:** session-length and return-frequency distributions,
  reviewed for compulsive-pattern outliers.
- **Appeal path:** self-exclusion / cool-down request honored without
  friction.
- **Rollback/restitution:** none meaningful once time is spent; prevention
  is the only real safeguard.
- **Unresolved questions:** where the line sits between "engaging" and
  "compulsive" is not resolved here — specialist review required (gate 3).

### Gambling-like reinforcement / chance-based rewards
- **Affected:** any user exposed to a chance mechanic.
- **Safeguards:** `INVARIANTS.md` §D blocks the payment+chance+prize+transfer
  combination outright; the remaining narrow carve-out (cosmetic, free,
  non-transferable chance) still requires disclosed odds.
- **Monitoring:** none needed for the narrow carve-out; the blocked
  combination should never exist to monitor.
- **Appeal path:** n/a if the mechanic is correctly blocked; standard appeal
  otherwise.
- **Rollback/restitution:** n/a for a correctly-blocked mechanic.
- **Unresolved questions:** whether even the narrow cosmetic carve-out
  should exist at all for a system reachable by minors — see gate 6.

### Paid access pressure
- **Affected:** users pressured to pay (real money) for faster access to
  non-purchasable categories, if a system sells convenience alongside a
  closed economy.
- **Safeguards:** any real-money sale must be for the *service* (e.g.,
  hosting, support, cosmetic-only items already declared purchasable=false
  is a contradiction and blocked by the validator) not for `earned`
  categories; `PROHIBITED_CAPABILITIES.md` blocks purchasable earned
  categories entirely.
- **Monitoring:** review of any real-money storefront against the
  `allowed_primitives` declarations for contradiction.
- **Appeal path:** refund process for any confirmed contradiction-sale.
- **Rollback/restitution:** refund plus category correction.
- **Unresolved questions:** none beyond the general contradiction check.

### Sunk-cost manipulation
- **Affected:** long-tenured users with large accumulated non-transferable
  standing.
- **Safeguards:** standing should not be designed to expire specifically to
  force re-engagement; expiry, where used, must be disclosed up front.
- **Monitoring:** review of any expiry/decay mechanic's stated purpose.
- **Appeal path:** standard appeal.
- **Rollback/restitution:** restoration where a technical error (not a
  disclosed design) caused loss.
- **Unresolved questions:** where legitimate decay (e.g., a "current
  contributor" status needing renewal) crosses into manipulation is a
  design-review question, not resolved here.

### Status coercion
- **Affected:** users pressured by peers or stewards to act against their
  interest to protect or gain status.
- **Safeguards:** `stewardship_responsibilities` holders are themselves
  subject to the operator-power abuse-risk review below.
- **Monitoring:** user reports.
- **Appeal path:** report to operator, review independent of the accused
  steward.
- **Rollback/restitution:** status correction, steward review.
- **Unresolved questions:** independent (non-operator) review capacity is
  not specified — this Lab's own `constitution/AUTHORITY.md` notes the
  same limit for itself (single-operator, no independent reviewer).

### Harassment
- **Affected:** any user.
- **Safeguards:** standard moderation tooling under
  `stewardship_responsibilities`.
- **Monitoring:** reports.
- **Appeal path:** standard appeal against moderation action.
- **Rollback/restitution:** moderation reversal on successful appeal.
- **Unresolved questions:** out of this document's economy-specific scope
  beyond noting moderation power itself is reviewed in Part 2.

### Fraud
- **Affected:** any user, especially in any bounded bilateral exchange.
- **Safeguards:** non-transferability removes most fraud surface by
  default; bounded exchanges should log both sides.
- **Monitoring:** exchange-dispute rate.
- **Appeal path:** dispute review.
- **Rollback/restitution:** reversal where verifiable.
- **Unresolved questions:** verification standard for "he-said/she-said"
  disputes is unresolved.

### Account theft
- **Affected:** any user.
- **Safeguards:** standard account security (outside this document's
  economy-specific scope).
- **Monitoring:** standard security monitoring.
- **Appeal path:** account-recovery process.
- **Rollback/restitution:** restoration of standing to verified rightful
  owner.
- **Unresolved questions:** interacts with account-sale detection —
  distinguishing "stolen" from "sold-then-regretted" is unresolved.

### Creator exploitation
- **Affected:** `creative_permissions`/`stewardship_responsibilities`
  holders. See `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`'s matching threat
  entry for mechanics; this row is the harm side.
- **Safeguards:** non-transferable authorship credit persists regardless of
  downstream use.
- **Monitoring:** contribution-vs-benefit review.
- **Appeal path:** creator dispute process.
- **Rollback/restitution:** credit correction; cannot retroactively pay for
  labour under this framework's non-monetary design (a real tension — flagged
  as unresolved).
- **Unresolved questions:** whether a non-monetary system can ever fully
  avoid labour-extraction dynamics for prolific creators is not resolved
  here.

### Labour extraction
- Same as creator exploitation, generalized to any user whose "play" or
  "participation" functions as unpaid work for the system (e.g., extensive
  moderation, content curation). Same rows apply.

### Opaque rankings
- **Affected:** any user in a `reputation`/ranking system.
- **Safeguards:** ranking methodology should be disclosed at a level
  sufficient for users to understand what raises/lowers it, without
  disclosing enough to enable gaming that defeats the ranking's purpose.
- **Monitoring:** user complaints about incomprehensible rank changes.
- **Appeal path:** rank-explanation request.
- **Rollback/restitution:** correction of demonstrated ranking errors.
- **Unresolved questions:** the disclosure/gameability tradeoff is not
  resolved here — specialist review (gate 3).

### Wrongful suspension
- **Affected:** any suspended user.
- **Safeguards:** suspension requires a stated reason.
- **Monitoring:** suspension-rate and appeal-success-rate review.
- **Appeal path:** mandatory, and must not itself require payment or favor.
- **Rollback/restitution:** full restoration of standing on successful
  appeal.
- **Unresolved questions:** independent appeal review capacity, as above.

### Inaccessible appeals
- **Affected:** any user needing to appeal any action in this model.
- **Safeguards:** every row above that references "appeal path" fails this
  framework's intent if the path is undiscoverable, requires payment, or has
  no response guarantee.
- **Monitoring:** appeal-submission-to-response latency and rate.
- **Appeal path:** n/a (this is the appeal-path row itself).
- **Rollback/restitution:** n/a.
- **Unresolved questions:** response-time commitment is not specified here —
  an implementation-specific gate (gate 11, plain-English operator card).

### Discriminatory outcomes
- **Affected:** users in any protected or vulnerable class whom a ranking,
  access, or moderation mechanism systematically disadvantages.
- **Safeguards:** review of mechanic outcomes for disparate impact.
- **Monitoring:** outcome-distribution review across mechanics.
- **Appeal path:** standard appeal, escalated to design review if a pattern
  emerges.
- **Rollback/restitution:** mechanic redesign; individual correction where
  identifiable.
- **Unresolved questions:** requires specialist review (gate 3); not
  resolved by this document.

### Concentration of operator power
- See Part 2 in full; cross-referenced here because it is itself a listed
  harm category.

### AI-generated manipulation
- **Affected:** any user interacting with AI-driven ranking, matching, or
  content-generation inside the system.
- **Safeguards:** disclosure that AI is involved where it materially affects
  outcomes; no AI-driven mechanic may be tuned toward engagement-maximization
  as an unstated goal (mirrors the compulsive-engagement safeguard).
- **Monitoring:** review of AI-mechanic tuning objectives.
- **Appeal path:** standard appeal.
- **Rollback/restitution:** mechanic correction.
- **Unresolved questions:** not resolved here — this is exactly the kind of
  question `WHY_NOT_TO_TRUST_THIS_PROJECT.md` §B already raises about AI
  seats generally, applied to in-system AI mechanics specifically.

### Irreversible reputation harm
- **Affected:** any user whose `reputation` or `non_transferable_status`
  suffers a wrongful or disproportionate hit.
- **Safeguards:** correction mechanism must exist for any reputation-scoring
  mechanic; scores should not be presented as immutable history that cannot
  be annotated with a correction.
- **Monitoring:** correction-request rate and resolution.
- **Appeal path:** mandatory.
- **Rollback/restitution:** score correction; the framework cannot undo
  social/reputational consequences already experienced by the user outside
  the system, which is exactly why this harm is named "irreversible."
- **Unresolved questions:** genuinely unresolved — this is a structural
  limit of any reputation system, not a gap this document can close.

## Part 2 — operator power

For each power: scope, auditability, explanation, appeal, abuse risk,
emergency use, review/sunset. This mirrors `constitution/AUTHORITY.md`'s
principal/power separation, applied to an economy operator specifically.

| Power | Scope | Auditability | Explanation required | Appeal | Abuse risk | Emergency use | Review/sunset |
|---|---|---|---|---|---|---|---|
| **Issue** | Grant any category to any account | Every issuance logged with reason | Yes, per issuance | N/A (grants aren't appealable, only denials might be) | Favoritism, insider grants | Immediate, for correction of system error | Periodic issuance-pattern review |
| **Remove** | Revoke a category from an account | Every removal logged | Yes | Yes, mandatory | Wrongful punishment | Immediate, for confirmed fraud/theft | Same as issue |
| **Freeze** | Halt a category/account's ability to act | Logged, time-bounded by default | Yes | Yes | Used to silence dissent rather than address genuine risk | Yes, pending investigation (Ladder stage 6–7) | Must have a stated review date, not indefinite |
| **Rank** | Set or adjust ranking/reputation values | Methodology disclosed at the level in Part 1's "opaque rankings" row | Aggregate methodology yes; per-user manual override yes | Yes | Manual override used to reward favorites | Rare, logged | Periodic review of manual-override frequency |
| **Promote** | Grant `stewardship_responsibilities` or elevated `access` | Logged | Yes | N/A for grants | Cronyism | N/A | Periodic review of promotion patterns |
| **Demote** | Remove `stewardship_responsibilities` or elevated `access` | Logged | Yes | Yes | Retaliatory demotion | Immediate for confirmed abuse of the steward power itself | Same as remove |
| **Moderate** | Act on content/behaviour under `stewardship_responsibilities` | Logged | Yes | Yes | Selective enforcement | Yes | Periodic pattern review |
| **Suspend** | Ladder stages 6–8 | Logged, receipted per `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md` | Yes | Yes | Overuse to suppress legitimate activity | Yes, this is what it's for | Stated review date |
| **Alter rules** | Change the declared manifest / policy itself | Every change is a new manifest version, diffable | Yes, plain-language (see gate 11) | N/A directly; affected users may appeal specific applications | Rules changed retroactively to justify a past action | Emergency amendments still require post-hoc disclosure | Every rule change re-enters `IMPLEMENTATION_GATES.md` at the affected gates |
| **Inspect records** | Read any account's internal history | Access itself should be logged | Only on request/audit | N/A | Privacy violation, profiling | Yes, for investigating a specific ladder stage | Periodic access-log review |
| **Approve exceptions** | Grant a `known_exceptions` entry | Logged in the manifest itself | Yes, in the exception's own text | N/A | Exceptions used to quietly reopen a closed capability | Rare | Every exception is reviewed at the next manifest revision |

**Every row's "abuse risk" column exists because the operator is a single,
non-independently-reviewed party in this Lab's own structure**
(`constitution/AUTHORITY.md`; `WHY_NOT_TO_TRUST_THIS_PROJECT.md` §A). This
model does not propose a solution to that structural fact — it proposes
naming the risk against every power explicitly, so a future implementation
cannot claim the risk wasn't considered.

## Non-claims

This model does not claim its safeguards are sufficient, that its monitoring
is currently implemented anywhere, or that naming a risk mitigates it. See
`CLAIMS_AND_NONCLAIMS.md`.
