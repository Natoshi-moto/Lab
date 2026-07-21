# Forge UX Canon

## Everything user-made is live

Creatures, worlds, and attacks should be animated canvas objects before they are saved. Static cards are fallback only.

## Core creation loop

Every maker surface should expose some version of this loop:

```text
randomize → lock → reroll → pick → fine tune → accept/save
```

## Companion UX

A companion is a canonical Eidolon creature spec. It must render from axes and labels, support animation, and be stored at `nexus:selected-companion:v1` when selected.

## World UX

A world is a canonical Eidolon environment spec. It must render from layered axes and become the OS desktop through `nexus:selected-environment:v1` and `system.environment.selected`.

## Attack UX

An attack is a canonical Eidolon attack spec. It should be scrubbed and replayed. The player-facing model is:

```text
anticipation → strike → impact → recovery
```

## Multiforge

Multiforge is the “show me nine options” surface. It is not a replacement for fine tuning; it is the fast path into it.

## Templates

Templates are saved directions. They become custom randomizers and should never be confused with economy rewards.

## Signal colors

- Amber: accepted, committed, important active state.
- Cyan: guidance and information.
- Rose: errors.
- Yellow/warn: actual caution.
- Muted ink: inactive, disabled, empty.

## Storage expectations

- `nexus:selected-companion:v1` stores canonical creature specs.
- `nexus:selected-environment:v1` stores canonical environment specs.
- `nexus:selected-attack:v1` stores canonical attack specs.
- Fallback mirrors are allowed, but the selected keys are the active OS source of truth.

## First Contact inline forge (Sweep 23)

First Contact exposes 8 key creature axes inline. Users sculpt size, width, shape, color, accent, limbs, eyes, and aura before accepting. This is the gateway into the full forge (Eidolon Forge ⚒), not a replacement for it. The 8 axes were chosen to show the most visually legible changes; the full 36-axis surface lives in Eidolon Forge.
