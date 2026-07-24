# The Commons — principles (the lodestone)

**status_authority:** `NONE`
Check every future idea against this page. If an idea needs a word from the
right-hand column, it is trying to smuggle the old world back in. Stop and rename it.

## What this is

A moral, intellectual and artistic **commons with cryptographic memory**.
Authorship, provenance, recognition and merit are established as **social and
ethical facts made durable by cryptography** — not legal instruments, not
financial instruments. Bitcoin's ethos (hold your own keys, inspectable rules,
portable state, minimized trust, voluntary participation, history hard to rewrite
unnoticed) pointed at *creative work* instead of money. You become your own notary.

## Native vocabulary — use these

authorship · provenance · attribution · recognition · lineage · stewardship ·
the commons · contribution · reproduction · admiration · sovereignty · keeping.

## Visas from the country we are leaving — do NOT use

| Old-world word | Why it smuggles the old logic | Say instead |
|---|---|---|
| property, own(ership) | implies a thing that can be taken/traded | authorship, stewardship |
| smart contract, token, mint | drags a chain, gas, a market you can't control | signed record, proof |
| transfer, send, sell, buy, price | a transfer primitive is the on/off ramp to legacy finance | recognition, attribution |
| IP rights, license (legal) | invokes courts and enforceable exclusivity | terms (a note in native words) |
| wallet, balance, redeem | reintroduces money and cash-out | (no equivalent — there is none) |

## What this refuses to be

- **Not for sale.** Nothing here transfers for value. There is no amount field.
- **Not a gateway** onto or off of the legacy financial system.
- **Not a legal enforcement layer.** Cryptography *evidences* authorship; it does
  not command a court. We rely on recognition and community norms, not lawsuits.
- **Not immune, only hostile.** Open work cannot stop a bad actor elsewhere from
  copying or reselling a screenshot. The official protocol simply refuses to
  *facilitate* that logic — no transfer, no price, no market surface. We claim
  hostility to the old logic, never immunity from it.

## Standing risks we accept and must keep testing

- **Proof without power.** Recognition is social; a copier faces reputation, not
  a court. So Sybil-resistance and capture-resistance are the *main* work, not a footnote.
- **Build a *for*, not just an *against*.** Detestation of the old system is the
  engine; beauty, recognition and sovereignty are the destination. Lead with the destination.

## The first living act

`commons/authorship.py` — a steward signs a work; anyone verifies it forever;
recognition attaches; nothing can be reassigned or sold, by construction.
See `PRIMITIVE_SPEC.md`. Watch it fail forgery in `tests/test_commons_authorship.py`.
