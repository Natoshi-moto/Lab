# The Language Standard — say it in the native words

**status_authority:** `NONE` (a proposal until the operator merges it)
**Audience:** everyone — the operator, the public, helper agents, and adversarial agents.
**One sentence:** this project is a moral / intellectual / artistic **commons**, not a
market and not a legal system, so it uses the commons' own words and refuses the
legacy financial-legal words that smuggle the old logic back in.

---

## Why this exists (read this even if you skip the rest)

The operator is building an alternative — a place where **authorship is kept,
provenance is proven, and recognition is earned**, deliberately outside the legacy
financial and legal systems. Every time the project accidentally reached for one of
the old system's words — "property," "smart contract," "transfer," "IP rights" — it
accidentally imported the old system's *logic* (markets, courts, cash-out) and
created a contradiction with its own core rule, **STRICT NO SALE**.

The fix is simple and it is a rule now: **use the native words; refuse the visas.**
The intent was always consistent — sovereignty, merit, non-convertibility,
authorship. It was only the borrowed vocabulary that kept smuggling the old world in.

---

## The native words — use these

**authorship · provenance · attribution · recognition · lineage · stewardship ·
the commons · contribution · reproduction · admiration · sovereignty · keeping · terms.**

## The visas from the country we are leaving — do NOT use in shipped software or docs

| Legacy word | What it smuggles in | Say instead |
|---|---|---|
| property, own, ownership | a thing that can be seized or traded | authorship, stewardship, keeping |
| smart contract, token, mint, NFT | a chain, gas fees, a market you cannot control | signed record, proof of authorship |
| transfer, send, sell, buy | a transfer primitive — the on/off ramp to legacy finance | recognition, attribution |
| price, amount, balance, wallet | money and a store of value | (there is no equivalent — remove it) |
| redeem, cash out, withdraw, yield | convertibility to money | (there is no equivalent — remove it) |
| stake, mint, wrap, bridge | financial mechanics | (there is no equivalent — remove it) |
| IP rights, license (legal sense) | courts and enforceable exclusivity | terms — a note in the native words, not a legal instrument |
| NEX (as a currency/balance) | an in-world coin with value | disposable session points, wiped on launch |

If you find yourself needing a word on the right-hand... **left**-hand column, stop.
Nine times out of ten the idea is fine and only the word is wrong. Rename it. On the
tenth, you have found a genuine design decision that contradicts STRICT NO SALE — flag
it loudly as `HUMAN_DECISION_REQUIRED`, do not quietly ship it.

---

## What this does NOT mean

- It does not ban these words from **history, receipts, audits, or this very file** —
  we quote the old world to explain why we left it. The ban is on **shipped software,
  interfaces, schemas, route names, and public documentation** presenting the commons.
- It does not claim the commons is *immune* to the legacy system. Open work cannot stop
  a bad actor elsewhere. The official protocol simply refuses to *facilitate* the old
  logic — no transfer surface, no price, no market. **Hostile to it, never immune from it.**

---

## How it is enforced (for each audience)

**For the operator (you):** before you push anything meant for the public, ask the one
question — *"is there a legacy-finance word in here pretending to be a native idea?"* If
yes, rename it or flag it. That's the whole discipline.

**For helper agents:** you MUST read this file before working on public-facing software
or docs. Use the native words. If you add a legacy word, you MUST call it out in your
own change description and justify it, or rename it. Never launder a legacy concept
into native-sounding prose to make a check pass — that is the exact failure this guards.

**For adversarial agents:** this file is a *target*. Your job is to prove the language is
**honest**, not merely clean. Two attacks in particular: (1) find a place where a native
word is doing a legacy job — e.g. "recognition" that can actually be transferred for
value — that is a smuggled market wearing a native coat; (2) find a shipped surface that
still uses a banned word. Report both with file:line.

**Mechanically (proposed):** a release check should scan shipped UI, schemas, and route
names for the banned words (this is the same forbidden-surface scanner the technical
spec already calls for) and reject them unless an explicit allowlisted context —
migration or education — is declared. Until that check exists and has been *watched
failing a planted violation*, this standard is enforced by humans and review, not by code.

---

## Scope note — standard now, cleanup next

This file is the **standard**. Applying it across the *existing* codebase — retiring the
legacy `wallet` / `NEX` / `send` / `stake` / `mint` surfaces that still ship in the
Nexus OS runtime — is a separate, bounded cleanup task (see the pre-release review,
finding F1). Writing the rule and enforcing the rule are two steps; this is the first.
