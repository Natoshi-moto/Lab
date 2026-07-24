# Allowed internal primitives

**status_authority:** `NONE`

These are the categories a future system may build internal rewards from.
Each category is a key in the manifest's `allowed_primitives` object. Every
category requires an explicit property declaration (see
`EARNING_AND_RECOGNITION_MODEL.md` for the full property table and defaults);
this file describes what each category *is* and its recommended defaults.
No category listed here is automatically safe — it is safe only to the
extent its declared properties comply with `INVARIANTS.md` and
`PROHIBITED_CAPABILITIES.md`.

| Category | What it is | Recommended default |
|---|---|---|
| `recognition` | Public or private acknowledgment that a contribution happened | non-transferable |
| `reputation` | An aggregate signal of standing built from contributions/behaviour over time | non-transferable, non-purchasable |
| `authorship_record` | A record binding a person to something they made | non-transferable |
| `access` | Permission to reach a feature, area, or tier of the system | non-transferable; may be granted/revoked by the operator, not sold |
| `creative_permissions` | Rights to create, publish, or extend within the system | non-transferable |
| `participation_rights` | Standing to take part in an activity, vote, or process | non-transferable |
| `non_transferable_status` | Titles, ranks, or badges bound to one account | non-transferable by definition |
| `cosmetic_or_expressive_resources` | Visual, textual, or expressive customization objects with no functional advantage | transferable only under explicit bounded analysis (see `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`) |
| `internal_consumable_resources` | Objects spent to take an in-system action (not held as savings, not appreciating) | non-transferable unless a bounded exception is separately justified |
| `stewardship_responsibilities` | Delegated duties over shared resources (moderation, curation, upkeep) | non-transferable; revocable by the operator; carries obligations, not just privilege |

## Why these categories and not others

This list is deliberately narrower than "everything a game or reputation
system might want." It excludes anything shaped like a currency (a
fungible, accumulable, generically-spendable unit) because a general-purpose
internal currency is the single easiest primitive to mistake for money and
the hardest to keep rhetorically and architecturally closed once it exists —
see `operations/LANGUAGE_STANDARD.md`'s banned-word table entry for `NEX`
("an in-world coin with value... say instead: disposable session points,
wiped on launch") and the live counter-example in `CONTRADICTION_REGISTER.md`
(`Wallet_v4_nexus.html`'s "NEX is earned... one balance"). A future design
that believes it needs a general internal currency should treat that belief
itself as the signal to stop and route through `IMPLEMENTATION_GATES.md`
gate 2 (specialist economics review) before building anything, not as
license to add an eleventh category here.

## Combining categories

A single object may combine categories (e.g., a "founder badge" is both
`recognition` and `non_transferable_status`). Combination does not relax any
individual category's property defaults — the strictest applicable default
governs. A combined object is not automatically excluded from `access` grants
tied to it, but the access itself must independently satisfy this file's
`access` row.

## Non-claims

This file does not claim these ten categories are jointly sufficient for any
specific future system's design goals, nor that a system limited to these
categories is automatically engaging, fair, or free of the harms catalogued
in `USER_HARM_AND_POWER_MODEL.md`. It claims only that these categories, held
to their declared properties, do not by themselves constitute real-world
economic value under `INVARIANTS.md`.
