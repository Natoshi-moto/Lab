# Halt and escalation rules

**status_authority:** `NONE`

This file is the destination `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`'s
response ladder points to at its top stages, and the condition list a
`halt_policy.conditions` manifest field must draw from or extend.

## Halt conditions

Any one of the following is sufficient to require an immediate operator
decision under this framework (halt, restrict, redesign, or — if the
operator determines the condition is a false positive — documented
dismissal with reasoning):

1. Official redemption introduced (any `PROHIBITED_CAPABILITIES.md`
   `*_redemption` key flips to an official capability).
2. External transfer bridge introduced.
3. Operator facilitates exchange or pricing (see `INVARIANTS.md` §F
   category 5 — treated as automatic, not merely investigated).
4. Persistent secondary market without adequate containment (containment
   options in `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md` exhausted or refused).
5. Substantial user harm (any Part 1 row in `USER_HARM_AND_POWER_MODEL.md`
   materializing at scale).
6. Minors exposed to chance-value mechanics.
7. Internal incentives become labour-like compensation (participation
   functions as a job substitute rather than recognition).
8. Internal objects become de facto payment for external services (see
   "third-party commercial services" in `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`,
   escalated once it becomes the *primary* way such services are paid for).
9. Marketing implies profit (official marketing; third-party marketing
   triggers the ladder's `WARN`/`INVESTIGATE` stages first, per that threat
   entry, before rising to a halt condition if uncorrected and amplified by
   the operator).
10. Rights or licence uncertainty (unclear who owns/may use
    creator-produced in-system material).
11. Monitoring becomes impossible (the indicators in
    `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md` can no longer be observed —
    e.g., a platform or API change removes visibility).
12. Controls rely primarily on unenforced prose (the exact failure mode this
    Lab's own `operations/handoffs/OPERATOR_STATE_OF_THE_REPO_001.md`
    already names for `STRICT NO SALE`: "declared, not enforced" — see
    `CONTRADICTION_REGISTER.md`).
13. Specialist review identifies serious unresolved classification risk
    (e.g., a securities, gambling, or money-transmitter classification
    concern surfaces that this framework cannot resolve — see
    `IMPLEMENTATION_GATES.md` gates 2, 5, 12).

## What a halt condition triggers

Reaching a halt condition does **not** by itself mean automatic shutdown.
It means:

1. A receipt is filed immediately (what condition, what evidence, when).
2. The operator receives a plain-language explanation of the condition and
   its consequences before any downstream action (mirrors the Lab-wide rule
   that irreversible or outward-facing actions require a plain-language
   explanation first).
3. One of `HALT_ECONOMY`, `SUSPEND_MECHANIC`, `FREEZE_AFFECTED_OBJECT_CLASS`,
   `RESTRICT_TRANSFER`, or `RETIRE_MECHANIC` (per the ladder) is selected
   and receipted, or the operator documents why the condition is a false
   positive and no action is warranted — silence is not an acceptable
   response to a triggered halt condition.

## Due process for confiscation or freezing

No stage of the ladder in `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md` that
touches a specific user's holdings may execute without:

- a stated reason recorded before or at the time of action;
- notice to the affected user, where technically feasible and where notice
  itself would not compound harm (e.g., tipping off an active fraud ring
  mid-investigation may justify delayed notice, but delayed, not absent);
- an appeal path per `USER_HARM_AND_POWER_MODEL.md`'s wrongful-suspension
  and inaccessible-appeals rows;
- a restitution path if the action is later found wrong.

## Escalation is not automatic confiscation

This framework explicitly separates *detecting* a halt condition from
*executing* an irreversible user-facing action. A future implementation
that collapses these two steps — auto-freezing accounts the moment an
indicator trips, with no human review — does not satisfy this file, even
if it technically "responds fast."

## Review and appeal of the halt itself

A halt, suspension, or freeze decision is itself subject to the same
transparency this framework demands of every other operator power
(`USER_HARM_AND_POWER_MODEL.md` Part 2): it must be logged, explained, and
carry a stated review date rather than standing indefinitely un-reviewed.

## Non-claims

Naming these conditions does not guarantee they will be detected in time,
correctly classified, or acted on appropriately. See `CLAIMS_AND_NONCLAIMS.md`.
