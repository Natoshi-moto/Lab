# Battle Engine Parity + Metadata Identity Audit — Phase A

Date: 2026-05-07

Scope: audit only. No application code changed. This document compares the three battle-resolution implementations and inventories metadata/identity non-determinism called out by the Phase A brief.

Standards used:

- **Behavioral parity** where source structure directly determines observable battle output.
- **Source-structure parity** where exhaustive input enumeration was not run in this phase.
- **OUTCOME-AFFECTING** when the value can change battle state, persisted identity, content-addressing, witness/replay material, or protocol result bytes.
- **PRESENTATION-ONLY** when the value only affects local UI, timing, display, or transport convenience.

## Section 1 — Three-engine parity comparison

Implementations compared:

- `engines/battle-engine.js` — canonical deterministic engine.
- `blocks/eidolon/eidolon-os.html` — embedded local OS creature battle logic.
- `blocks/eidolon/eidolon-router.html` — embedded headless world simulation logic.

### Per-surface output table

### Phase B router consolidation status

Phase B consolidated the `eidolon-router` battle-math rows below into canonical `window.NexusBattleEngine` calls. Router line references in the original table remain as Phase A audit evidence; current router code now loads `../../engines/battle-engine.js` (`blocks/eidolon/eidolon-router.html:141`), routes stat/move/type adapters through canonical (`blocks/eidolon/eidolon-router.html:290-313`), and runs headless battles through `initBattle()` / `resolveTurn()` / `isOver()` with deterministic turn seeds (`blocks/eidolon/eidolon-router.html:456-507`). Rows affected by this consolidation are marked `CONSOLIDATED` in their notes. Phase C consolidated the `eidolon-os` rows: current OS code loads `../../engines/battle-engine.js` (`blocks/eidolon/eidolon-os.html:323`), builds battle boards through canonical `initBattle()` adapters (`blocks/eidolon/eidolon-os.html:913-959`), and resolves interactive turns through canonical `resolveTurn()` / `isOver()` with deterministic `sha256:` turn seeds (`blocks/eidolon/eidolon-os.html:1462-1565`).

| Surface | Canonical | eidolon-os | eidolon-router | Match? | Ingress shape | Seed provenance | Layer | Notes |
|---|---|---|---|---|---|---|---|---|
| Stat derivation | `deriveStats(dna)` normalizes first, then emits `maxHp`, `atk`, `def`, `spAtk`, `spDef`, `spd` from bytes `[7,3,5,4,6,2]` (`engines/battle-engine.js:83-92`). | `computeStats(dna)` uses the same formulas and field names but assumes a raw array (`blocks/eidolon/eidolon-os.html:964-972`). | `computeStats(dna)` uses the same formulas and field names but assumes a raw array (`blocks/eidolon/eidolon-router.html:332-335`). | PARTIAL | Canonical: `payload.dna` or `eidolon.dna`; OS: raw `dna` args or challenger `payload.dna`; router: `creature.dna`, plus library import path reads `payload.axes`. | none | OUTCOME-AFFECTING | Source formulas match, but only canonical normalizes malformed/short/string DNA (`engines/battle-engine.js:55-65`). Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: invalid ingress can produce divergent stats or `NaN` outside the canonical engine; router and OS now delegate stat derivation to canonical. |
| Move derivation | `expressedTraits()` filters `>128` and sorts by value descending with explicit original-index tiebreak (`engines/battle-engine.js:94-102`). | Filters `>128`, value-only sort, top 4, base padding (`blocks/eidolon/eidolon-os.html:975-983`). | Filters `>128`, value-only sort, top 4, base padding (`blocks/eidolon/eidolon-router.html:337-340`). | PARTIAL | Canonical: normalized `payload.dna`; OS/router: raw arrays. | none | OUTCOME-AFFECTING | OS/router rely on ES2019+ stable sort rather than explicit index tiebreak. Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: modern engines usually match, but explicit tie handling is safer and canonical already owns it; router and OS now delegate move derivation to canonical. |
| Type derivation | Uses same expressed-trait ranking; default `['SPECTRAL']`; optional secondary if different (`engines/battle-engine.js:104-109`). | Same logic but value-only sort and no DNA normalization (`blocks/eidolon/eidolon-os.html:986-994`). | Same logic but value-only sort and no DNA normalization (`blocks/eidolon/eidolon-router.html:342-347`). | PARTIAL | Canonical: normalized `payload.dna`; OS/router: raw arrays. | none | OUTCOME-AFFECTING | Divergence is the same ingress/tie risk as move derivation. Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: tie or malformed DNA can alter primary/secondary type and therefore damage effectiveness; router and OS now delegate type derivation to canonical. |
| Move list / effect catalog | Donor-reconciled `TRAIT_MOVES` and `BASE_MOVES`; `PHANTOM CLAW.effect = null`, `multi` is an indicator only (`engines/battle-engine.js:27-50`). | Catalog values match canonical; descriptions are UI-only. `PHANTOM CLAW.effect = null` (`blocks/eidolon/eidolon-os.html:908-932`). | Catalog values match canonical; `PHANTOM CLAW.effect = null` (`blocks/eidolon/eidolon-router.html:290-313`). | YES | same DNA-derived trait catalog | none | OUTCOME-AFFECTING | Catalog entries were source-structure equivalent at Phase A. Phase B router status: `CONSOLIDATED`; Phase C OS status: `CONSOLIDATED`; neither block now defines a local catalog, and both consume canonical move data through canonical fighter state. |
| Type matrix / effectiveness | `TYPE_MATRIX` gives each attacker type two advantaged defender types; multiplier stacks by defender types (`engines/battle-engine.js:16-20`, `engines/battle-engine.js:110-114`). | `BEATS` and `typeEff()` are equivalent (`blocks/eidolon/eidolon-os.html:949-959`). | `BEATS` and `typeEff()` are equivalent (`blocks/eidolon/eidolon-router.html:320-328`). | YES | derived types from DNA | none | OUTCOME-AFFECTING | Source-structure equivalent. Phase B router status: `CONSOLIDATED`; Phase C OS status: `CONSOLIDATED`; neither block now defines local `BEATS` / `typeEff()` for battle resolution. |
| Damage calculation | `calcDamage(attacker, defender, move, rng, isCrit)` uses stage multipliers, `attacker.types[0]`, seeded `rand = 0.85 + rng()*0.15`, optional `critMult`, and min 1 (`engines/battle-engine.js:137-147`). | `calcDmg()` uses same coefficient form but `Math.random()` and no crit parameter (`blocks/eidolon/eidolon-os.html:1508-1516`). | `simCalcDmg()` uses same coefficient form but `Math.random()` and no crit parameter (`blocks/eidolon/eidolon-router.html:500-507`). | NO | Canonical: initialized battle states; OS/router: local board objects. | Canonical: seeded PRNG; OS/router: `Math.random`. | OUTCOME-AFFECTING | Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: same DNA/move inputs can produce different damage and winner because OS/router use unseeded random variance; router and OS now route damage through canonical seeded `resolveTurn()`. |
| Accuracy / dodge gates | Dodge resolves first, then accuracy-down 30%, then accuracy roll, all seeded (`engines/battle-engine.js:149-156`). | Same broad gates, but `Math.random()` and a dead `move.effect !== 'phantom'` bypass condition (`blocks/eidolon/eidolon-os.html:1572-1591`). | Accuracy roll happens before dodge, uses `Math.random()`, and has the same dead `move.effect !== 'phantom'` bypass condition (`blocks/eidolon/eidolon-router.html:510-513`). | NO | Canonical: states + chosen moves; OS/router: board objects + chosen moves. | Canonical: seeded PRNG; OS/router: `Math.random`. | OUTCOME-AFFECTING | Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: router can consume/check accuracy before dodge and all duplicate miss decisions are non-replayable; router and OS now use canonical seeded gate ordering. |
| Effect resolution — poison/burn application | Poison 40%, burn 30%, seeded (`engines/battle-engine.js:161-164`). | Same probabilities but `Math.random()` (`blocks/eidolon/eidolon-os.html:1519-1526`). | Same probabilities but `Math.random()` (`blocks/eidolon/eidolon-router.html:516-518`). | NO | board/state objects | Canonical: seeded PRNG; OS/router: `Math.random`. | OUTCOME-AFFECTING | Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: status application can diverge for the same battle; router and OS now delegate status application to canonical. |
| Effect resolution — multi | `multi` emits an indicator only; no second damage application (`engines/battle-engine.js:164`). | `multi` logs `Hit again!` only; no second damage (`blocks/eidolon/eidolon-os.html:1527-1529`). | `multi` applies `def.hp -= dmg` again (`blocks/eidolon/eidolon-router.html:526`). | NO | board/state objects | Canonical: seeded PRNG; router: `Math.random` upstream. | OUTCOME-AFFECTING | Router classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: `SWARM RUSH` / `FERAL CLAWS` are materially stronger in headless world simulation than in canonical battles; router and OS now inherit canonical single-damage + multi-indicator behavior. |
| Effect resolution — recoil/heal/defense/accuracy/dodge | Recoil 33%, heal+ 40%, heal 25%, `acc-`, `dodge`, `def+` +2, all bounded (`engines/battle-engine.js:165-170`). | Same state changes, but only positive cap on defense stage (`blocks/eidolon/eidolon-os.html:1530-1547`). | Same broad state changes, but only positive cap on defense stage (`blocks/eidolon/eidolon-router.html:519-524`). | PARTIAL | board/state objects | none for these specific deterministic effects | OUTCOME-AFFECTING | Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: currently same for ordinary positive boosts, but duplicate code lacks canonical lower-bound clamp discipline and should not remain authoritative; router and OS now delegate these effects to canonical. |
| Effect resolution — Ancient Power boost | 10% seeded chance; boosts `atkSt`, `defSt`, and `spASt` by +1 (`engines/battle-engine.js:171`). | 10% `Math.random()` chance; boosts `atkSt`, `defSt`, and `spASt` (`blocks/eidolon/eidolon-os.html:1548-1554`). | 10% `Math.random()` chance; boosts only `atkSt` and `spASt`, not `defSt` (`blocks/eidolon/eidolon-router.html:525`). | NO | board/state objects | Canonical: seeded PRNG; OS/router: `Math.random`. | OUTCOME-AFFECTING | Router classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: Ancient Power winners in headless simulation have lower defensive snowballing than canonical/OS; router and OS now inherit canonical `defSt` boost behavior. |
| End-of-turn status ticks | Poison = `floor(maxHp*0.1)`, burn = `floor(maxHp*0.06)` (`engines/battle-engine.js:174-177`). | Poison and burn are both `floor(maxHp*0.0625)` (`blocks/eidolon/eidolon-os.html:1559-1562`). | Poison only, `floor(maxHp*0.0625)`; burn is not ticked (`blocks/eidolon/eidolon-router.html:544-545`). | NO | board/state objects | none | OUTCOME-AFFECTING | Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: poison is weaker in both duplicates, burn is wrong in OS and effectively absent as ongoing damage in router; router and OS now inherit canonical poison 10% / burn 6% ticks. |
| Turn / round flow | `resolveTurn()` clones state, increments turn, seeds RNG, stateA wins exact speed ties, applies first then second if alive, then ticks both statuses (`engines/battle-engine.js:178-192`). | Player wins speed ties via `>=`; enemy move is random; second attack delayed by UI/log lifecycle; ticks status only after second attack path (`blocks/eidolon/eidolon-os.html:1613-1644`, `blocks/eidolon/eidolon-os.html:1683-1687`). | First side wins speed ties by `>=`; both moves random; loop up to 80 turns; winner chosen by higher HP if cap reached (`blocks/eidolon/eidolon-router.html:530-557`). | NO | Canonical: explicit `moveA`, `moveB`, `turnSeed`; OS: player-chosen move + random enemy; router: two creature objects. | Canonical: seeded PRNG/explicit turn seed; OS/router: `Math.random`; OS also UI async timing. | OUTCOME-AFFECTING | Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: neither duplicate can produce canonical replay transcripts from the same move/seed sequence; router and OS now pass explicit moves and deterministic `sha256:` turn seeds to canonical; OS still chooses enemy moves in the presentation layer. |
| Victory condition | `isOver()` returns winner only after HP <= 0; simultaneous faint uses remaining HP comparison (`engines/battle-engine.js:194-200`). | `checkFaint()` immediately calls player/enemy winner; no simultaneous-faint tie handling visible in the same way (`blocks/eidolon/eidolon-os.html:1648-1649`). | At loop cap or completion, winner is `a` if `a.hp >= b.hp`, else `b` (`blocks/eidolon/eidolon-router.html:551`). | NO | state/board HP values | none | OUTCOME-AFFECTING | Classification: `DUPLICATE_DRIFT`. Phase B router status: `CONSOLIDATED`. Phase C OS status: `CONSOLIDATED`. Consequence: edge cases around simultaneous KO, status ticks, and 80-turn caps can resolve differently; router and OS now use canonical `isOver()`; router preserves only its 80-turn HP fallback as orchestration policy. |
| Headless world simulation wrapper | Canonical owns pure battle math only; population/evolution is outside engine scope. | Not applicable; OS shell is interactive. | Owns population, movement, challenge routing, mutation/evolution, and library save/load (`blocks/eidolon/eidolon-router.html:383-405`, `blocks/eidolon/eidolon-router.html:564-597`, `blocks/eidolon/eidolon-router.html:614-684`). | PARTIAL | Router consumes creature objects and sometimes `payload.axes` from Library (`blocks/eidolon/eidolon-router.html:748-752`). | substrate tile seed, `Math.random`, and world state | OUTCOME-AFFECTING | Classification: `INTENTIONAL_DIFFERENCE`. Consequence: router should keep world/population orchestration, but its internal battle math should delegate to canonical. |

### End-of-section summary

#### Features to port from duplicates to canonical

- None identified for battle-resolution math. The duplicate-only logic is either orchestration outside battle math or drift from the reconciled PHANTIVEX/canonical engine.
- Router world/population/challenge orchestration should remain outside canonical battle math: `spawnCreature()` (`blocks/eidolon/eidolon-router.html:383-405`), `evolveCreature()` (`blocks/eidolon/eidolon-router.html:579-597`), `sendChallengerToOS()` (`blocks/eidolon/eidolon-router.html:667-684`). Tag: OUTCOME-AFFECTING shell behavior, but not a canonical battle-engine feature.

#### Logic in duplicates that should be deleted in favor of canonical calls

- OS stat/move/type tables and derivation: former `blocks/eidolon/eidolon-os.html:902-1009` — OUTCOME-AFFECTING. Phase C status: `CONSOLIDATED` via canonical adapters and `initBattle()` at current `blocks/eidolon/eidolon-os.html:913-959`.
- OS damage/effect/turn/status logic: former `blocks/eidolon/eidolon-os.html:1508-1644` — OUTCOME-AFFECTING. Phase C status: `CONSOLIDATED` via canonical `resolveTurn()` / `isOver()` and deterministic turn seeds at current `blocks/eidolon/eidolon-os.html:1462-1565`.
- Router stat/move/type tables and derivation: `blocks/eidolon/eidolon-router.html:285-365` — OUTCOME-AFFECTING. Phase B status: `CONSOLIDATED` via canonical adapters at current `blocks/eidolon/eidolon-router.html:290-313`.
- Router simulated damage/effect/turn/status logic: `blocks/eidolon/eidolon-router.html:500-557` — OUTCOME-AFFECTING. Phase B status: `CONSOLIDATED` via canonical `initBattle()` / `resolveTurn()` / `isOver()` at current `blocks/eidolon/eidolon-router.html:462-507`.
- Router duplicated move/effect catalog should be removed or generated from `window.NexusBattleEngine.CONSTANTS` after loading canonical: `blocks/eidolon/eidolon-router.html:290-313` — OUTCOME-AFFECTING. Phase B status: `CONSOLIDATED`; local catalog literals are gone and the block loads `../../engines/battle-engine.js` at current `blocks/eidolon/eidolon-router.html:141`. Phase C status: `CONSOLIDATED`; OS local catalog literals are gone and the block loads `../../engines/battle-engine.js` at current `blocks/eidolon/eidolon-os.html:323`.

#### Intentional differences that affect consolidation design

- Router needs a headless AI/simulation shell that chooses moves and updates world population. Phase B status: `CONSOLIDATED` for battle math; the shell now chooses highest-power moves and calls canonical `initBattle()` / `resolveTurn()` / `isOver()` rather than owning damage/effects.
- OS needs an interactive presentation shell that chooses a local enemy move, queues logs, and animates events. Phase C status: `CONSOLIDATED` for battle math; the shell now calls canonical `resolveTurn()` once per player turn and animates the returned event objects rather than owning damage/effects.
- OS needs an interactive/presentation shell that animates and delays log advancement. That does not block consolidation, but presentation timing should sit above canonical turn results.

#### CONSOLIDATION_DIRECTION_UNSAFE findings

- None found. Canonical-as-target is safe on Phase A evidence. The duplicates do not contain battle-resolution architecture that canonical lacks; they contain drift, non-deterministic random calls, and UI/world shell responsibilities.

## Section 2 — Metadata identity audit

Status updated in Phase A.5. Original Phase A line references are retained where useful; implementation line numbers have shifted after the fix sweep.

### `blocks/vibes/vibes-library.html`

| Original File:Line | Usage | Content or metadata? | Status | Phase A.5 disposition |
|---|---|---|---|---|
| `blocks/vibes/vibes-library.html:358` | Slot consumption fallback timestamp inside `payload.slots.consumed`. | CONTENT | FIXED | `consumeSlot()` now requires caller-supplied `ref.ts` and returns `slot_ts_required` instead of falling back to wall clock. |
| `blocks/vibes/vibes-library.html:503` | Import `createdAt` fallback. | METADATA | MARKED METADATA | Left as display metadata and marked inline as not content-addressed. |
| `blocks/vibes/vibes-library.html:569` | Nostr `created_at` for signed event. | CONTENT | FIXED | `signNostrEvent()` now requires explicit `created_at`; audited signing paths pass it from deterministic/caller-supplied event content. |
| `blocks/vibes/vibes-library.html:601` | Birth attestation content `ts`. | CONTENT | FIXED | Birth attestation `ts` now derives from envelope `createdAt` or a canonical content-addressed stamp. |
| `blocks/vibes/vibes-library.html:679` | Attestation parse fallback timestamp. | CONTENT | FIXED | Parser now uses `content.ts` or `ev.created_at*1000`; missing event time rejects the import path. |
| `blocks/vibes/vibes-library.html:684` | Added attestation list fallback timestamp. | CONTENT | FIXED | `augmentAttestation()` now requires a finite timestamp instead of falling back to local time. |
| `blocks/vibes/vibes-library.html:697` | Foreign-stub attestation timestamp fallback. | CONTENT | FIXED | Stub attestations now require `data.ts` / source event time. |
| `blocks/vibes/vibes-library.html:706` | Foreign-stub `createdAt` fallback. | METADATA | FIXED | Stub `createdAt` now mirrors attestation/source event time rather than local clock. |
| `blocks/vibes/vibes-library.html:717` | Foreign-stub `payload.discovered_at`. | METADATA | MARKED METADATA | Kept as local discovery/display metadata and marked inline. |
| `blocks/vibes/vibes-library.html:852` | Breed offer ID includes `ts: Date.now()` inside hashed material. | CONTENT | FIXED | Offer ID now hashes canonical `{parents, partner, realm, nonce}` and rejects missing nonce with `nonce_required`. |
| `blocks/vibes/vibes-library.html:853` | Breed offer expiry timestamp. | CONTENT | FIXED | Handler now requires caller-supplied `expires`; no hidden wall-clock fallback. |
| `blocks/vibes/vibes-library.html:854` | Breed offer content `ts`. | CONTENT | FIXED | Handler now requires caller-supplied `ts`; Kin Forge supplies it explicitly. |
| `blocks/vibes/vibes-library.html:905` | Breed receipt content `ts`; included in signed receipt body. | CONTENT | FIXED | Receipt creation now requires explicit `ts`; accept path forwards caller-supplied `ts`. |
| `blocks/vibes/vibes-library.html:917` | Local twin `createdAt` from receipt `ts` fallback. | METADATA | FIXED | Twin `createdAt` now requires receipt `ts`; no `Date.now()` fallback. |
| `blocks/vibes/vibes-library.html:932` | Foreign twin-stub `createdAt` from receipt `ts` fallback. | METADATA | FIXED | Stub `createdAt` now requires receipt `ts`; no `Date.now()` fallback. |
| `blocks/vibes/vibes-library.html:934` | Foreign twin-stub `payload.discovered_at`. | METADATA | MARKED METADATA | Kept as local discovery/display metadata and marked inline. |
| `blocks/vibes/vibes-library.html:948` | Breed receipt attestation timestamp fallback. | CONTENT | FIXED | Receipt import now rejects missing/non-numeric `ev.created_at`; evidence timestamp uses the source event. |
| `blocks/vibes/vibes-library.html:1105` | Battle-result `createdAt` fallback around canonical result content. | CONTENT / METADATA | FIXED | Battle result save now requires `content.ts` before constructing `birthHash`, `createdAt`, and payload `ts`. |
| `blocks/vibes/vibes-library.html:1107` | Battle-result payload `ts: content.ts || Date.now()`. | CONTENT | FIXED | Payload `ts` now uses required `content.ts`; no wall-clock fallback. |
| `blocks/vibes/vibes-library.html:1150` | Ranked loser slot consumption timestamp fallback. | CONTENT | FIXED | Ranked slot consumption now requires battle result `ts`. |
| `blocks/vibes/vibes-library.html:1184` | Imprint slot consumption timestamp. | CONTENT | FIXED | Imprint slot `ts` now derives from canonical `{imprint_id}` and slot consumption failure is surfaced. |
| `blocks/vibes/vibes-library.html:1195` | Battle intent ID includes `ts: Date.now()` in hashed material. | CONTENT | FIXED | Battle intent ID now hashes canonical `{partner,eidolonA,eidolonB,charter,ranked,nonce}` and rejects missing nonce. |
| `blocks/vibes/vibes-library.html:1208` | Battle intent expiry timestamp. | CONTENT | FIXED | Handler now requires caller-supplied `expires`; Arena supplies it explicitly. |
| `blocks/vibes/vibes-library.html:1209` | Battle intent content `ts`. | CONTENT | FIXED | Handler now requires caller-supplied `ts`; Arena supplies it explicitly. |
| `blocks/vibes/vibes-library.html:1249` | Relay subscription ID uses `Math.random()`. | METADATA | MARKED METADATA | Left as live relay-session metadata and marked inline. |
| `blocks/vibes/vibes-library.html:1250` | Relay query `since` window uses current time. | METADATA | MARKED METADATA | Left as live relay-session metadata and marked inline. |
| `blocks/vibes/vibes-library.html:1371` | IndexedDB lineage edge timestamp. | CONTENT | FIXED | Lineage edge `ts` now derives from child `createdAt` or child content hash; otherwise it fails closed. |
| `blocks/vibes/vibes-library.html:1589` | Generic import `createdAt` fallback. | METADATA | MARKED METADATA | Left as display metadata and marked inline as not content-addressed. |

### `engines/battle-protocol.js`

| Original File:Line | Usage | Content or metadata? | Status | Phase A.5 disposition |
|---|---|---|---|---|
| `engines/battle-protocol.js:25` | `crypto.getRandomValues()` / Node crypto for commit/reveal salt. | CONTENT | FIXED | Cryptographic salt remains canonical; deterministic `saltProvider` injection was added for fixtures. |
| `engines/battle-protocol.js:27` | `Math.random()` fallback salt. | CONTENT | FIXED | Weak fallback removed; absence of WebCrypto/Node crypto now throws. |
| `engines/battle-protocol.js:102` | `battle_commit.ts` signed message timestamp. | CONTENT | DEFERRED — protocol message ts | Explicitly out of scope per Phase A.5. |
| `engines/battle-protocol.js:111` | `battle_reveal.ts` signed message timestamp. | CONTENT | DEFERRED — protocol message ts | Explicitly out of scope per Phase A.5. |
| `engines/battle-protocol.js:128` | `battle_state.ts` signed state-hash message timestamp. | CONTENT | DEFERRED — protocol message ts | Explicitly out of scope per Phase A.5. |
| `engines/battle-protocol.js:136` | `battle_forfeit.ts`. | CONTENT | DEFERRED — protocol message ts | Explicitly out of scope per Phase A.5. |
| `engines/battle-protocol.js:149` | `resultContent().ts`. | CONTENT | DEFERRED — protocol message ts | Explicitly out of scope per Phase A.5. |

### `engines/eidolon-generator.js`

| Original File:Line | Usage | Content or metadata? | Status | Phase A.5 disposition |
|---|---|---|---|---|
| `engines/eidolon-generator.js:14` | Imprint nonce from wall clock. | CONTENT | FIXED | Nonce now derives from `sha256Hex(canonical({parentHash,battle_id,scars})).slice(0,16)`. |
| `engines/eidolon-generator.js:14` | Imprint `createdAt` from wall clock. | CONTENT | FIXED | `createdAt` is explicit, inherited from parent/result when supplied, or uses a deterministic placeholder. |
| `engines/eidolon-generator.js:21` | Scar `position_seed` fallback to `Date.now()`. | CONTENT | FIXED | `makeScar()` now requires `battle_id` or `position_seed` and fails closed otherwise. |

### `engines/nexus-block-client.js`

| Original File:Line | Usage | Content or metadata? | Status | Phase A.5 disposition |
|---|---|---|---|---|
| `engines/nexus-block-client.js:8-11` | Request IDs use `crypto.randomUUID()` or `Math.random()`. | METADATA | MARKED METADATA | Left as transport-only request metadata and marked inline. |
| `engines/nexus-block-client.js:46-47` | Commit/reveal salt uses WebCrypto or `Math.random()` fallback. | CONTENT | FIXED | Weak fallback removed; missing WebCrypto now throws, with deterministic `saltProvider` injection for tests. |
| `engines/nexus-block-client.js:69` | Commit message `ts`. | CONTENT | FIXED | `commitReveal()` now requires `timestampProvider`; no hidden wall-clock fallback in the shared client. |
| `engines/nexus-block-client.js:83` | Reveal message `ts`. | CONTENT | FIXED | Same as commit timestamp: caller-supplied via `timestampProvider`. |
| `engines/nexus-block-client.js:114` | Equivocation proof `detected_at`. | METADATA | MARKED METADATA | Left as local observation metadata and marked inline. |

## Section 3 — `GENE_DATA` imprint verification

**Diagnosis: FIXED.** Phase D added the missing bridge inside the emitted scar renderer: `scarSvgScript()` now emits `const GENE_DATA=JSON.parse(document.getElementById('creature-dna').textContent);` before `draw()` reads `const g=GENE_DATA` (`engines/eidolon-generator.js:19-22`). The JSON writer remains the `<script id="creature-dna" type="application/json">...` tag in `generateEidolonHtml()` (`engines/eidolon-generator.js:33`), so the standalone renderer now consumes the same payload Library imports through `extractJsonScript()` / `parseEidolonHtml()` (`blocks/vibes/vibes-library.html:454-462`). Regression coverage: `tests/imprint-tests.js:10-14` asserts the generated HTML contains the explicit `GENE_DATA` parse bridge and that the bridge appears after the JSON writer. Existing imprint outputs generated before this fix may still be broken as standalone visual artifacts; this source now emits bridged artifacts going forward.

## Noticed in passing

- `blocks/vibes/vibes-arena.html:413-489` uses `Math.random()` for arcade damage display, shake, attack timing, and move choice. This is presentation/local simulation, not canonical battle resolution, but it can mislead users if displayed numbers are interpreted as protocol results.
- `blocks/eidolon/eidolon-router.html:719-731` saves router creatures as `subFormat:'eidolon-forge/1'` with DNA in `payload.axes`; canonical battle/Library surfaces expect `payload.dna` for creatures. This schema split invalidates naive parity tests that feed all three implementations the same envelope.
- `docs/PHANTIVEX_DIFF.md` already documents that canonical removed repeated `multi` damage and phantom anti-dodge behavior. The router duplicate still has repeated `multi` damage at `blocks/eidolon/eidolon-router.html:526`.
