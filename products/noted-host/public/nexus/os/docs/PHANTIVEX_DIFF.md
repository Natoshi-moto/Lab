# PHANTIVEX Engine Diff — Sweep 5.5 rev

Canonical donor authority: embedded `eidolon-battle-PHANTIVEX-enhanced_1_.html` engine surfaces supplied by orchestrator, covering donor lines 230–345 and 928–975.

## Surface diff

| Surface | Result | Current platform location | Diff / note |
|---|---|---|---|
| 8-type names | MATCH | `battle-engine.js` lines 9, 16–20 | `TOXIC`, `SPECTRAL`, `WILD`, `IRON`, `VOID`, `ANCIENT`, `LIGHT`, `SHADOW`. |
| 8-type matrix / BEATS | MATCH | `battle-engine.js` lines 16–20 | Each type beats the same two donor targets. |
| Counter coverage balance | MATCH donor property | `battle-engine.js` lines 16–20 | Donor property: counter coverage is intentionally asymmetric. WILD and IRON are beaten by 1 type; VOID and ANCIENT by 3; others by 2. No rebalance applied. |
| Effectiveness multiplier | MATCH | `battle-engine.js` lines 110–114 | Pure multiplicative `2x` per matched defender type; no `0.5x` / resistance path. Dual-type defenders can receive `4x`. |
| Trait names + byte index | MATCH | `battle-engine.js` lines 10–13, 94–97 | 16 ordered traits; byte index equals trait index. |
| Trait threshold | MATCH | `battle-engine.js` lines 14, 94–99 | Strict `>128`, not `>=128`. |
| Trait sort and top-N moves | MATCH | `battle-engine.js` lines 94–102 | Sorts by trait value descending, tie-stable by original trait order; takes top 4. Explicit tie fallback preserves donor stable-sort behavior across JS engines. |
| TRAIT_MOVES | MATCH after reconciliation | `battle-engine.js` lines 27–44 | All donor name/power/category/accuracy/PP/effect values match. `PHANTOM CLAW.effect` corrected from platform `phantom` to donor `null`. |
| Move `type` field | DIVERGENT → RECONCILED | `battle-engine.js` lines 27–49 | Sweep 5 platform added explicit move `type`; donor has no explicit type. Removed. Offensive type now derives from `attacker.types[0]` at resolution. |
| BASE_MOVES | MATCH after reconciliation | `battle-engine.js` lines 45–50 | Donor filler order and values match. Removed platform-only explicit type fields. |
| TYPE_FROM_TRAIT | MATCH | `battle-engine.js` lines 21–26 | Same trait→type map. |
| Stats mapping | MATCH after reconciliation | `battle-engine.js` lines 83–92 | Donor names only: `maxHp`, `atk`, `def`, `spAtk`, `spDef`, `spd`. Removed platform alias fields `hp`, `attack`, `defense`, `spAttack`, `spDefense`, `speed` from `deriveStats()`. |
| Stats byte usage | MATCH | `battle-engine.js` lines 83–92 | `dna[2]=spd`, `dna[3]=atk`, `dna[4]=spAtk`, `dna[5]=def`, `dna[6]=spDef`, `dna[7]=maxHp`; traits still read `dna[0..15]`. |
| Type derivation | MATCH | `battle-engine.js` lines 104–109 | Default `['SPECTRAL']`; primary from highest expressed trait; optional secondary from second expressed trait only if different. |
| Stage multiplier table | MATCH | `battle-engine.js` lines 51, 81 | 13 entries; stage range `-6..+6`; neutral `1` at index 6. |
| Damage formula coefficients | MATCH with deterministic normalization | `battle-engine.js` lines 137–147 | Donor coefficient form retained: `floor((atk/def*power/50 + 2) * rand * eff * critMult)`, minimum 1. `Math.random()` replaced by seeded PRNG. |
| Offensive type in damage | MATCH after reconciliation | `battle-engine.js` lines 142, 159 | Uses `attacker.types[0]` only. Sweep 5 had `move.type || attacker.types[0]`; removed. |
| Critical multiplier support | MATCH practical donor default | `battle-engine.js` lines 137–147 | Donor `calcDmg(..., isCrit=false)` has `1.5` crit multiplier. Platform preserves optional parameter but no crit-trigger mechanic is added. |
| Accuracy and dodge checks | MATCH with deterministic normalization | `battle-engine.js` lines 149–155 | Same miss gates as donor family; all random checks use seeded PRNG. |
| Poison effect | MATCH with deterministic normalization | `battle-engine.js` line 162 | Probability `0.4`; `Math.random()` replaced by seeded PRNG. |
| Burn effect | MATCH with deterministic normalization | `battle-engine.js` line 163 | Probability `0.3`; `Math.random()` replaced by seeded PRNG. |
| Multi effect | MATCH after reconciliation | `battle-engine.js` line 164 | Donor effect is hit-again indicator only. Sweep 5 repeated damage; removed. |
| Recoil effect | MATCH | `battle-engine.js` line 165 | `floor(dmg * 0.33)`. |
| Dodge effect | MATCH | `battle-engine.js` line 169 | Sets `attacker.dodging = true`. |
| Accuracy-down effect | MATCH | `battle-engine.js` line 168 | Sets `defender.accDown = true`. |
| Heal effects | MATCH | `battle-engine.js` lines 166–167 | `heal+ = 40% maxHp`; `heal = 25% maxHp`. |
| Defense boost | MATCH | `battle-engine.js` line 170 | `defSt + 2`, capped at `+6`. |
| Ancient boost | MATCH with deterministic normalization | `battle-engine.js` line 171 | Probability `0.1`; boosts `atkSt`, `spASt`, `defSt` by `+1`, cap `+6`; random replaced by seeded PRNG. |
| Phantom anti-dodge | DIVERGENT → RECONCILED | `battle-engine.js` lines 42, 152 | Donor says `PHANTOM CLAW.effect = null`; platform anti-dodge special case removed. |
| End-of-turn poison damage | MATCH after reconciliation | `battle-engine.js` line 175 | Donor-provided value: `floor(maxHp * 0.1)`. Sweep 5 used `0.0625`; corrected. |
| End-of-turn burn damage | MATCH after reconciliation | `battle-engine.js` line 176 | Donor-provided value: `floor(maxHp * 0.06)`. Sweep 5 used `0.0625`; corrected. |
| Speed / turn order | INTENTIONAL_NORMALIZATION | `battle-engine.js` lines 185–186 | Donor uses `player >= opponent`. Platform has no universal player; stateA wins exact speed ties. In battle protocol, stateA is assigned by canonical lower Eidolon hash, making ties deterministic cross-party. |
| makeBoard initial state | MATCH after reconciliation | `battle-engine.js` lines 119–131 | JSON state mirrors donor board: `dna`, `hues`, `name`, `types`, `moves`, `maxHp`, `hp`, `base`, stages at 0, `status:null`, `dodging:false`, `accDown:false`. Adds `side`, `id`, `turn` as platform transcript metadata. |
| JSON-only state | INTENTIONAL_NORMALIZATION | whole file | Preserved for transcript hashing and cross-machine deterministic equality. |
| Engine hash constant | PLATFORM-ONLY | `battle-engine.js` line 8 | Required by realm charter engine binding and ranked battle rejection. |
| UMD export wrapper | PLATFORM-ONLY | `battle-engine.js` lines 4, 213–216 | Required for browser classic-script loading and Node tests. |

## Reconciled divergences

1. Removed explicit `type` field from all trait and base moves.
2. Changed `calcDamage()`/damage events to use only `attacker.types[0]`.
3. Changed `PHANTOM CLAW.effect` from platform `phantom` to donor `null`.
4. Removed platform phantom anti-dodge bypass.
5. Removed platform repeated damage from `multi`; it is now an event/indicator only.
6. Corrected poison end-of-turn damage to 10% max HP.
7. Corrected burn end-of-turn damage to 6% max HP.
8. Removed non-donor stat aliases from `deriveStats()`.
9. Recomputed `ENGINE_HASH` and bumped genesis ruleset to v1.2.

## INTENTIONAL_NORMALIZATION

| Normalization | Rationale |
|---|---|
| Seeded PRNG replaces all donor `Math.random()` calls | Required for byte-identical multiplayer resolution and replay. |
| StateA wins exact speed ties | Donor favors `player` via `>=`; multiplayer has no inherent player. Battle protocol assigns stateA by canonical lower Eidolon hash. |
| Stable explicit tie fallback in expressed-trait sort | Donor relies on JS stable sort. Explicit fallback preserves donor order across environments. |
| JSON-only battle state | Required for transcript hashing, state-hash signatures, and cross-machine equality. |
| Engine hash/version exports | Required by realm charter binding and ranked battle validation. |
| UMD wrapper | Required for no-build browser loading plus Node tests. |

## DEFERRED

None.

## Hash status

- Engine bytes changed.
- `ENGINE_HASH`: `sha256:79cd0f7ce56120d4aee1aa6616e94c1adbda58d164ffd444e4201e2215ef65a9`
- `realm_genesis_0.ruleset.version`: `1.2`
- `realm_genesis_0.ruleset_hash`: `sha256:d2d9728ead1542f1b216b988bd93a8dc4e678b0e3ea6350661b8674cd212ec39`

## Verification

`bash tests/run.sh` passed after reconciliation:

```text
SYNTAX SUMMARY pass=36 fail=0
BREED SUMMARY pass=5 fail=0
BATTLE-ENGINE SUMMARY pass=12 fail=0
BATTLE-PROTOCOL SUMMARY pass=7 fail=0
SUMMARY pass=35 fail=0
```
