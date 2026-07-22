# Ideation ledger — 20260722-emade-repoe

Mode: /ideate scratchpad. Operator is final authority. Explicit-scrap-only.
Everything below is 🌱 DRAFTED unless stated. `status_authority: NONE`.

---

## IDEA-001 — EMADE REPOE bracket notation
- seed (operator's words, verbatim):

```
[E]MADE REPOE[E]
[D]-DON'T READ OR WASTE TOKENS ON
[N]-Name
[H]-Human
[E]-Event
[A]-Action
[T]-Thought
[K]-Keep
[O]-Organize
[F]-FINALIZED
[bN]-Bot name
[bE]-Bot Event
[M]-Misunderstanding
[bE]-Archived Chat and extracted Grep material [bE]
[bN]-Bot name-   [b-n=claude-sonnet-4.5]
[G]-Graveyard(nothing gets deleted only stopped from wasting tokens unless told otherwise
[h-T] half thought
[b-h-T] bot half thought
[b-h-t-r-t-a=F] bot half thought about _____ revised and thought about X and then did Y [b-h-t-r-t-a]
[D-t-Bn-E-h-t-m-r]= don't read these thoughs from Grok 3 about the commit it was a half thought that was a misunderstanding that is now resolved[D-t-Bn-E-h-t-m-r]

if not brackets the deconstruct  then atomize then come back before following the next step = deconstruct < atomize
Chains: build > debug > audit (<GO_BACK)(>GO_FORWARD)(GO_BACK<) > deconstruct < atomize > build > debug ~
[~] = repeat action from the start
[<] = think back a step before proceeding
[>] = advance after completion of current task
[^] = think laterally like a human would (simulate for data not truth)
[@] = location
[/] = depends on
[*] = guiding principle/north star
[+] = upgrade/addition/expansion
[] (×13 empty)
 see it like topology of thought
```

- restatement (Claude's, marked as mine): a human-native annotation language
  with three parts — (1) a tag lexicon of single letters for actors/objects
  (`[H]` human, `[bN]` bot name), states (`[F]` finalized, `[h-T]` half
  thought), and token-economy directives (`[D]` don't-read, `[G]` graveyard);
  (2) a composite grammar chaining letters into narrative arcs
  (`[b-h-t-r-t-a=F]`); (3) a process algebra of flow operators
  (`> < ~ ^ @ / * +`) forming chains like `build > debug > audit`. Empty
  `[]`s read as declared expansion slots. Framing: "topology of thought" —
  the notation encodes the *shape and flow* of work, not just labels.
- 🧑 OWNER-OVERRIDE, on record: LOOM v0.1 Part III CUT the composite bracket
  grammar (measured 100% false-positive collision rate vs. code/markdown).
  Operator, knowing collisions exist, chooses iteration on brackets anyway.
  This is the first recorded owner-override in the corpus. The ⚡ CONFLICT
  with LOOM's cut is preserved, not resolved.
- steelman: see session notes in report; core — compositional letters give
  open expressiveness glyphs can't (23 fixed glyphs vs. generative grammar);
  author-native notation beats imported notation for the person who must
  actually use it at 2am; flow operators encode process, which LOOM's static
  glyphs cannot; [D]/[G] are token-economy primitives LOOM only has as
  retrieval filters.
- stress (open problems, each testable, none scrapping):
  - S1 collision class: `[T]` matches `arr[T]` etc. (measured, LOOM session).
    Candidate defenses to iterate: (a) tags valid only at line-start,
    (b) sigil variant `[;T]`, (c) marry to LOOM fences — tags live outside
    fenced payloads, collision class vanishes structurally.
  - S2 one-letter-two-meanings: `r` = "revised" in `[b-h-t-r-t-a=F]` but
    "resolved" in `[D-t-Bn-E-h-t-m-r]`. Composite grammar has no declared
    positional semantics — two different events can produce identical tags.
  - S3 `[bE]` defined twice in the seed itself: "Bot Event" and "Archived
    Chat and extracted Grep material."
  - S4 case rule undeclared: `[h-T]` vs `[b-h-t-…]` — is T≡t?
  - S5 three spellings of the same control op: `(<GO_BACK)`, `(>GO_FORWARD)`,
    `(GO_BACK<)` — needs one canonical form.
  - S6 `~` scope: "repeat action from the start" — start of chain, or start
    of current step?
  - S7 title `[E]MADE REPOE[E]` uses a tag as a delimiter — decorative or
    semantic?
  - S8 the "if not brackets the deconstruct then atomize" line is itself a
    [h-T]; parse attempted (non-bracketed material → deconstruct → atomize →
    step back → proceed) — needs operator confirmation.
- status: LIVE
- depends-on: [[IDEA-002]] (public test path), conflicts-with: LOOM v0.1
  Part III bracket-cut (⚡ preserved)

## IDEA-002 — Public iteration path
- seed (operator's words): "I'm choosing that we're iterating on it and going
  to test it publicly whenever the scratchpad and loom skill (that we evolve)
  work together"
- restatement (mine): EMADE REPOE v-next gets tested in public once /ideate +
  /capture-transcript + LOOM conversion form a working pipeline; the skills
  themselves are expected to evolve as part of this.
- status: LIVE (roadmap commitment, operator-set)

## IDEA-003 — PRIVATE canvas mode
- seed (operator's words): "there is also a PRIVATE canvas mode for private
  ideation. We are not doing that now but make it later add it as a task
  quickly"
- restatement (mine): a variant of /ideate whose ledger, transcript, and
  report never enter the public repo — presumably corpus/local-only or
  off-repo entirely. Operator explicitly deferred.
- status: LIVE — PARKED-TASK (operator-deferred, do not start without
  operator go)

## IDEA-004 — Brackets-author / LOOM-stores synthesis (Claude's, marked)
- seed: none (this is my proposal, not the operator's)
- statement: EMADE REPOE and LOOM may not be competitors. Brackets = the
  human authoring/thinking syntax (fast to type, author-native, generative);
  LOOM = the storage/verification substrate (fences, hashes, V-1). Tags
  outside fences can never collide with payload — S1 dissolves structurally
  rather than being defended against. The LOOM tagging pass becomes a
  *compiler* from operator brackets to archived records.
- status: LIVE

## Fork points routed to operator (unanswered)
- F1: S2 — one meaning per letter, or positional grammar? (pick one)
- F2: S3 — which `[bE]` definition wins?
- F3: S4 — case rule?
- F4: S6 — `~` scope?
- F5: Are the 13 empty `[]` reserved expansion slots, or something else?
- F6: S8 parse — did I read the deconstruct/atomize rule right?

## Non-claims
- Nothing here is tested beyond intellectual stress. All 🌱.
- The 🧑 override does not resolve the ⚡ CONFLICT with LOOM's Part III cut.
- No public test has run; IDEA-002 is a commitment, not an event.
