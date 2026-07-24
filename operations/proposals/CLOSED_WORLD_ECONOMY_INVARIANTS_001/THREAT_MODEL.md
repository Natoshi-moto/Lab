# Threat model — what "closed-world" means mechanically

**status_authority:** `NONE`

## 1. The mechanical definition

A "closed-world" internal economy is not a label a README applies to itself.
It is a claim about **five mechanical surfaces**, each independently checkable,
each independently capable of breaking closure on its own:

| Surface | Closed-world requirement | Break condition |
|---|---|---|
| **Entry** | Objects are minted only by declared internal mechanisms (contribution, recognition, participation) | Any path lets real money, crypto, or an external asset buy internal standing directly |
| **Custody** | Objects live only inside operator-controlled internal state | Any exportable bearer instrument, private key, or portable token exists |
| **Transfer** | Movement between accounts is limited to the declared `transfer_policy` for that object category (see `ALLOWED_INTERNAL_PRIMITIVES.md`) | An open order book, unbounded peer transfer, or account-sale tooling exists for any category |
| **Exit** | Objects cannot be converted to cash, crypto, goods, services, debt relief, or externally recognized value through any *official* path | A redemption, cash-out, bridge, wrap, or operator-supported exchange rate exists anywhere |
| **Narrative** | Public communications describe the system in the native vocabulary (recognition, authorship, standing) and never in investment vocabulary | Marketing, docs, or UI copy uses "invest," "yield," "cash out," "appreciating asset," or similar (see `operations/LANGUAGE_STANDARD.md`'s banned-word table) |

Closure means **all five hold simultaneously and continuously**, not that
a design document asserts closure once at launch. Each surface can silently
regress independently — a system can be closed on Entry and Exit but open
a transfer hole; it can be architecturally closed but rhetorically open
(marketing implies investment); it can be code-closed but operator-opened
(an operator manually facilitates a trade "as a favor"). `CONTRADICTION_REGISTER.md`
documents a live example of exactly this kind of regression already present
in this repository (`Wallet_v4_nexus.html`): doctrine closed, shipped surface open.

## 2. Why labels don't establish closure (the central doctrine, applied)

> Closed-world intent is not established by labels. It must be maintained by
> architecture, incentives, communications, monitoring, enforcement, and
> willingness to halt.

Concretely, a system claiming closure must show, continuously, not once:

1. **Architecture** — no code path implements Entry/Custody/Transfer/Exit
   violations, verified by the checks in `IMPLEMENTATION_GATES.md`.
2. **Incentives** — no internal actor (including the operator) profits more
   from an object leaking value externally than from it staying internal.
3. **Communications** — every public-facing surface passes the language
   standard; violations are treated as incidents (`CONTRADICTION_REGISTER.md`
   entries), not typos.
4. **Monitoring** — the indicators in `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`
   are actually watched, not merely defined on paper.
5. **Enforcement** — the response ladder in `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`
   actually fires when indicators trip, with a receipt each time.
6. **Willingness to halt** — `HALT_AND_ESCALATION_RULES.md`'s conditions are
   treated as automatic triggers for a decision, not a hypothetical.

A system that has architecture but not monitoring, or enforcement but not
willingness to halt, is not closed — it is closed-shaped.

## 3. Capability growth increases the burden of proof

> Capability growth increases the burden of proof.

As a system adds capability, the evidence bar for continued closure rises
correspondingly. A rough ordering, least to most burden:

1. Read-only recognition (a name on a list) — near-zero leakage surface.
2. Non-transferable status with in-system consequences (badges, ranks) —
   low surface; watch for status-purchase-by-favor.
3. Bounded, operator-mediated bilateral exchange of expressive objects —
   moderate surface; watch for account-sale substitution.
4. Any peer-to-peer transfer, even rate-limited — high surface; requires
   the full `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md` threat catalog to be
   actively monitored before shipping.
5. Any chance-based acquisition combined with (3) or (4) — blocked pending
   specialist review regardless of stated bounds (`INVARIANTS.md` §Chance).
6. Anything resembling a market (price discovery, order matching, escrow) —
   `PROHIBITED_CAPABILITIES.md` bars this outright; it is not a "high burden
   of proof" tier, it is a `HALT_AND_ESCALATION_RULES.md` trigger.

A future implementation that wants tier 3 or 4 must clear proportionally more
of `IMPLEMENTATION_GATES.md` before shipping than a tier-1 or tier-2 system.

## 4. Discovery of external trade does not validate the economy

> Discovery of external trade does not validate the economy; it triggers
> investigation, containment, redesign, restriction, or suspension.

This is the doctrine's clearest falsifiable trap: a designer could point to
observed external trading volume as evidence of "product-market fit" or
"the community values it." Under this framework that observation is
**exclusively** evidence for `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`'s response
ladder — it triggers `OBSERVE → INVESTIGATE` at minimum, never a design
justification. `experiments/BENEFICIAL_GENESIS_UNIFIED_THESIS_001/CANONICAL_CHECKPOINT_001.md`
already states this for the Beneficial Genesis track: *"If someone prices it,
lists it, wraps it, farms it, or sells 'exposure' to it, that is an attack on
the experiment's category, not product-market fit."* This proposal generalizes
that sentence to every future closed-world system in scope.

## 5. Sandbox activity is not canonical truth or safety

> Sandbox activity may be canonical as history and shared context without
> being canonical as truth, safety, or Lab acceptance.

Any economy prototype built in `Natoshi-moto/Experimental-Sandbox` — including
one that "worked," attracted users, or produced interesting data — is historical
record only. It reaches Lab acceptance, if ever, only through
`operations/process/EXPERIMENTAL_SANDBOX_PROMOTION.md`'s gate, and passing that
gate is explicitly not proof of safety, security, correctness, or deployment
suitability (that document's own line 25–26). A Sandbox economy that leaked
value externally, harmed users, or looked successful is not evidence this
framework's invariants are unnecessary; it is exactly the evidence class this
framework exists to contain, per §4 above.

## 6. What this threat model does not cover

- It does not model the cryptographic or infrastructure security of any
  specific implementation (see `IMPLEMENTATION_GATES.md` gate 4).
- It does not model jurisdiction-specific financial or gambling law (gates 5
  and 12).
- It does not model harms unrelated to economy mechanics (see `constitution/`
  and `WHY_NOT_TO_TRUST_THIS_PROJECT.md` for the Lab's general distrust
  register, which this proposal does not attempt to restate).
- It assumes good-faith initial design; `USER_HARM_AND_POWER_MODEL.md` covers
  operator-power abuse risk separately.
