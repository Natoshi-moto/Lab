# Social and Synthetic Economy Draft

## Boundary

`SYNTHETIC DATA · NON-TRANSFERABLE · NON-REDEEMABLE · STRICT NO SALE`

The purpose of social mechanics is recognition, discovery, challenge and shared play. The purpose is not to create a shadow asset, speculative market or route to payment.

## Intended objects

- **Appreciation:** a signed acknowledgement attached to a creature, run, break, repair or creative artifact. It has no amount and cannot be spent.
- **Reproduction:** a claim that another participant independently reproduced a result.
- **Contribution standing:** an explainable summary of confirmed runs, breaks and repairs.
- **Creature card:** a user-selected public identity summary without private memory.
- **Challenge:** a scenario or battle invitation with bounded rules.
- **Progression:** local unlocks and expression derived from use or play.

## Forbidden official surfaces

- buying, selling, auctioning or pricing creatures or points;
- transferable balances, tips, ranks, credentials or game energy;
- cash-out, redemption, payout, yield, wage or credit;
- fiat, sats, bitcoin or cryptocurrency denomination;
- wrapping, bridging, on-ramps or off-ramps;
- language implying appreciation receipts are scarce investments.

Open-source code cannot prevent an external account sale. Official builds can omit transfer primitives, reject sale metadata, refuse identity handoff, show the boundary visibly and decline to endorse external markets.

## Current contradiction

The inherited Nexus OS includes a wallet, NEX balance, mint, transfer, send, stake and sats-related language and tests. Some battle and Vibes paths are coupled to wallet locks or synthetic accounting. These paths are not compliant merely because their state is browser-local or described as display-only.

Before Eidolin can claim this draft's boundary, release routing must remove or quarantine those surfaces, decouple creature play from wallet state and add negative protocol tests.

## Optional Nostr sharing

Nostr may transport public creature cards, challenges, run digests, reproduction attestations, repairs and appreciation. Signing must occur through an isolated user-selected signer. A relay event does not gain trust by being signed; content, schema, replay and authorization remain validated.

Private workspace topology, full prompts, API keys, signing keys and private creature memory are never published by default.

## Gamification principles

- Reward useful action, not compulsive checking.
- Explain why progression changed.
- Make ranking optional and scoped.
- Prefer independent reproduction over raw popularity.
- Do not let tips purchase authority.
- Provide block, mute, reset and offline modes.
- Ensure a user can enjoy and retain the creature without a social account.

## Required adversarial tests

- submit tip events containing amounts or currency units;
- replay an appreciation receipt;
- attempt to transfer a creature or reputation record;
- forge a reproduction without the referenced run;
- create Sybil accounts that mutually inflate standing;
- publish private fields through a creature card;
- rename forbidden fields to evade a string scan;
- invoke legacy wallet routes from an Eidolin action;
- confirm the UI never calls synthetic data earnings, funds or value.
