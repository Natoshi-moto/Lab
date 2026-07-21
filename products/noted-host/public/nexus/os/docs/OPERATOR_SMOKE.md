# Operator Smoke Checklist — Round 006

Run from the archive root:

```bash
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080/Nexus_OS.html` in a Chromium-family browser.

## Protocol harness

```bash
bash tests/run.sh
```

Expected:
- `python3 -m py_compile nexus_proxy.py` exits 0.
- `node tests/syntax-check.js` prints `SYNTAX SUMMARY pass=25 fail=0` or better.
- `node tests/protocol-harness.js` prints all `PASS` lines and `SUMMARY pass=14 fail=0`.

## Vibes Library boot + realm genesis

1. Launch **Vibes Library** from Nexus OS.
2. Open DevTools console.
3. From any ported block or a small test block, request `vibe.realm.list`.

Expected:
- Vibes Library reaches mounted/online state.
- `vibe.realm.list` returns `{ok:true,data:[...]}` with one `realm-charter/1` summary for `realm_genesis_0`.
- `vibe.realm.current` returns `{ok:true, realm_id:"realm_genesis_0", charter_summary:{...}}`.
- Deleting the charter and rebooting the Library does **not** auto-recreate it unless IndexedDB metadata is reset.

## Realm switch

1. Save or import a second `realm-charter/1` vibe whose `payload.realm_id` is unique.
2. Request `vibe.realm.set({realm_id:"<new_id>"})`.
3. Request `vibe.realm.current`.

Expected:
- Known realm returns `{ok:true}` and persists across Library reload.
- Unknown realm returns `{ok:false,error:"unknown realm"}`.

## Realm-aware creature/world saves

1. Launch **Atlas** and save a world without manually specifying a `realm` field.
2. Request `vibe.load({id:<world_id>})`.
3. Launch/save a creature-producing block or import a creature JSON/HTML.
4. Request `vibe.load({id:<creature_id>})`.

Expected:
- World and creature saves succeed while a current realm exists.
- Loaded envelopes include `realm:"realm_genesis_0"` or the active realm.
- If all realm charters are deleted and no active realm exists, `creature/*` and `world/*` saves reject with `{ok:false,error:"realm required"}`.

## Creature import + birth attestation

1. Drag an Eidolon creature HTML or a creature JSON/vibe envelope onto Vibes Library.
2. Inspect the saved vibe with `vibe.load`.
3. If no Social/Forum/Channels Nostr identity exists, stop here.
4. If a Nostr identity exists in localStorage and crypto deps are available, call `vibe.attest({id:<creature_id>})`.

Expected without Nostr identity/libs:
- Import succeeds.
- Vibe type is `creature/eidolon-1`.
- `realm` equals current realm.
- `content_addr` is present.
- `attestation:"deferred"`.

Expected with Nostr identity/libs:
- `vibe.attest` returns `{ok:true,data:{id,attestation,event_id,published}}`.
- Saved vibe contains `attestation_event` of kind `30420`.
- Event tags include `d`, `realm`, `gen`, and `parents`.
- Relay publish is best-effort; `published:0` still leaves the signed event stored locally with deferred status.

## Library service IPC port

1. Launch **Vibes Library** first.
2. Launch **Atlas**, **Crucible**, **Arena**, **Mission Control**, and **NexusDB**.
3. In Mission Control, verify kernel feed shows each block reaching mounted state.
4. Trigger `vibe.list`, `vibe.load`, and `vibe.realm.current` requests from Mission Control or DevTools.

Expected:
- Library responds on `vibe.result` with matching `_reqId`.
- Ported clients do not hang on request timeouts except when intentionally requesting absent ids.


## Receiving foreign birth attestations

1. Ensure Vibes Library is launched and `vibe.realm.current` returns `realm_genesis_0` or another active realm.
2. Ensure browser DevTools console shows either:
   - `nostr attestation subscribe: kind 30420 realm <realm_id>`, or
   - a clear warning that WebSocket/relays are unavailable.
3. From another browser profile/user, publish a valid Nostr kind `30420` event with tags:
   - `["d", "sha256:<creature_hash>"]`
   - `["realm", "<active_realm_id>"]`
   - `["gen", "<generation>"]`
   - `["parents", "<parent_ref_1>", ...]`
4. Wait for relay delivery.
5. Request `vibe.list({type:"creature-stub/1"})`.

Expected:
- Event signature and id are verified before import.
- Matching active-realm attestations create or update a `creature-stub/1` vibe.
- Stub summary has `foreign_stub:true`, `attestations >= 1`, `realm:<active_realm_id>`, and `content_hash:"sha256:<creature_hash>"`.
- Invalid signatures, wrong event ids, bad JSON, or wrong realm are ignored.

## Foreign stub appearing in Library UI

1. After receiving a valid foreign attestation, open Vibes Library.
2. Filter by **Foreign Stubs** or request `vibe.list({type:"creature/*"})` from Mission Control/DevTools.
3. Click the stub.

Expected:
- Stub appears as type `creature-stub/1`.
- Detail view shows `realm`, deferred/local attestation status, and parent/child lineage rows where available.
- `vibe.load({id:<stub_id>})` returns full stub payload with `full_artifact:false`.

## Lineage merge: stub before import

1. Receive a foreign attestation for parent creature hash `sha256:PARENT`.
2. Confirm `vibe.list({type:"creature-stub/1"})` includes a stub for `sha256:PARENT`.
3. Import a local creature whose lineage/parents include `external:sha256:PARENT` or raw `sha256:PARENT`.
4. Load the imported creature.

Expected:
- Imported creature `parents[]` contains the stub id, not `external:sha256:PARENT`.
- `vibe.lineage({id:<imported_id>,depth:4})` includes the parent stub in `ancestors[]`.

## Lineage merge: import before stub

1. Import a local creature whose parent reference is unknown, producing `parents:["external:<nonce>"]`.
2. Receive a valid kind `30420` whose `creature_hash` or `d` tag matches `<nonce>`.
3. Load the local creature again.

Expected:
- Library creates a foreign stub.
- Existing creature parent reference is forward-resolved from `external:<nonce>` to the new stub id.
- `vibe.lineage` traverses through the stub.

## Mission Control lineage tree

1. Launch Vibes Library, import or receive at least one creature with two parents or one parent stub.
2. Launch Mission Control.
3. Open the creature/vibe dossier from the inventory panel.
4. Inspect the lineage SVG.

Expected:
- Focused creature is centered.
- Ancestors render above; descendants render below.
- Multi-parent creatures show multiple converging curved parent edges.
- Each node shows name, generation, realm, and source indicator.
- Foreign stubs are dashed/reduced opacity.
- Clicking a node focuses it and redraws lineage.
- Clicking an edge surfaces attestation count for that child lineage step.

## Sexual breeding offer between two windows

Preconditions:
- Two browser windows/profiles are running the same archive.
- Both have Vibes Library launched.
- Both have a Nostr identity available through the Social/Channels/Forums localStorage identity pattern.
- Both have full local creature entries for both parent Eidolons; stubs are insufficient.
- Both use at least one shared relay in `nx.soc.relays` or `nx.channels.relays`.

Steps:
1. In Window A, launch **Kin Forge**.
2. Select local Parent A.
3. Paste Window B's 64-char Nostr pubkey as partner.
4. Paste Parent B's `content_hash` / `content_addr` / local id.
5. Click **Send offer**.
6. In Window B, launch **Kin Forge** and click **Load inbox**.
7. Accept the matching offer.
8. In Window A, also open the same offer and click **Accept / run protocol** if A has not already started the protocol loop.

Expected:
- Both sides publish/observe kind `30421` offer.
- Commit/reveal progresses through kind `30422` and `30423` events.
- If one side fails to commit/reveal, UI shows forfeit reason such as `partner_no_commit` or `partner_no_reveal`.
- On success, both sides derive the same `jointSeed` and twin hashes.

## Breed receipt and twin import

Steps:
1. After successful commit-reveal, inspect Vibes Library in both windows.
2. Request `vibe.breed.receipts({})` or inspect Library UI/logs.
3. Request `vibe.list({type:"creature/*"})`.
4. Load each new twin vibe.

Expected:
- Kind `30424` breed receipt is visible/stored.
- If both parent DNAs are local, Library recomputes `sexualBreed()` and verifies `twin1_hash` / `twin2_hash` before saving twins.
- New twin vibes have `type:"creature/eidolon-1"`, `subFormat:"eidolon-bred/1"`, `parents` containing both local parents, and `payload.breed_id`.
- Library attempts kind `30420` birth attestation for each locally saved twin.
- If parent DNAs are unavailable, Library saves `creature-stub/1` twin stubs instead of full twins.

## Mission Control breeding lineage

Steps:
1. Launch Mission Control after twins are saved.
2. Focus either twin in the inventory/dossier view.
3. Inspect the lineage graph.

Expected:
- The twin is centered.
- Both parents appear above the twin.
- Edges converge from both parents into the twin node.
- The sibling twin appears as another descendant of the same parents where lineage depth includes it.

## Sweep 5 — Platform Multiplayer Battle Smoke

### Solo regression
1. Open `Nexus_OS.html` through localhost.
2. Launch **Vibes Library** and **Arena**.
3. In Arena keep mode on **Solo**.
4. Pick an existing battle vibe.
5. Expected: existing Arena battle rendering still loads; HUD appears; replay/export buttons retain prior behavior.

### Charter migration v1.0/v1.1 → v1.2
1. In an existing install that already has `realm_genesis_0` at ruleset v1.0, launch Vibes Library.
2. Query/inspect `vibe.realm.current` or open the Realm card.
3. Expected: `ruleset.version` is `1.2`, `engine_hash` is populated, and the charter id remains `v_realm_c85fe8b5cb6941eb`.

### Two-window platform battle intent
1. In two browser windows/profiles, configure Nostr identity and a shared relay.
2. Both windows launch Vibes Library and Arena.
3. In Arena switch to **Multiplayer**.
4. Window A picks a full local Eidolon, enters Window B's pubkey and B's Eidolon hash, and sends intent.
5. Window B clicks **Inbox**, accepts the intent.
6. Expected: intent appears in B's Library/Arena inbox; accept returns ok; no sovereign Eidolon HTML is modified.

### Battle protocol / result
1. Run a full turn sequence through the multiplayer flow when both parents are locally available in each window.
2. Expected: both sides derive the same battle engine hash, same state hashes per turn, and same final transcript hash.
3. Expected: a co-signed kind `30434` result appears on relay.
4. Expected: Library saves a `battle-result/1` vibe in both windows.

### Mission Control history
1. Launch Mission Control after a completed battle.
2. Query battle-result vibes or inspect inventory.
3. Expected: battle result is historical only; no lineage edge is created until future stake/evolution sweeps.

## Sweep 6 — Milestone C Stake / Witness / Imprint Smoke

### Casual battle no stake
1. Launch Vibes Library and Arena.
2. Keep Arena in Solo or non-ranked multiplayer mode.
3. Complete/record a battle result without `ranked:true`.
4. Query `vibe.creature.slots({id})` for both creatures.
5. Expected: no slot consumption occurs; `remaining` is unchanged.

### Ranked battle slot lock
1. Launch Wallet v4, Vibes Library, and Arena in two windows/profiles.
2. Ensure each local creature has `payload.slots.total = 3` and at least one remaining slot.
3. Issue ranked intent via `vibe.battle.start_ranked({myEidolon, partnerEidolon, partnerPubkey})` or Arena multiplayer flow once UI wiring is active.
4. Expected: Wallet emits/returns a `wallet.lock.result` with `terms_raw = eidolon:slot:<eidolon_id>:battle:<battle_id>`.
5. Expected: the kind `30431` intent includes `ranked:true` plus `lock_a` / `lock_b` references where available.

### Ranked result slot consumption
1. Complete or inject a valid co-signed kind `30434` result-cert with `ranked:true` and `winner:"A"` or `"B"`.
2. Open the loser creature in Vibes Library.
3. Query `vibe.creature.slots({id:<loser>})`.
4. Expected: loser `remaining` decrements by 1; winner remains unchanged.
5. Exhaust all three loser slots and query `vibe.creature.spent({id})`.
6. Expected: `{spent:true}` and ranked battle/imprint attempts reject with `creature spent`.

### Witness-attested result certificate
1. Publish five witness advertisements, kind `30450`, content `{realm, capacity, since}`.
2. Start a battle with witness request enabled.
3. Expected: selected witnesses are deterministic for the battle id and candidate pool.
4. Complete result-cert with both party signatures and at least 3 selected witness signatures.
5. Expected: Library verifies the 3-of-5 quorum and stores `battle-result/1`.
6. Expected: with fewer than 3 valid witness signatures, result-cert is rejected or remains untrusted.

### Imprint flow
1. Complete a ranked win and verify the winner has at least one remaining slot.
2. In Arena multiplayer mode, pick the winning Eidolon and click **Imprint**.
3. Enter the ranked winning `battle_id`.
4. Expected: `vibe.imprint.create` creates a new `creature/eidolon-1` descendant envelope.
5. Expected: the source winner consumes one imprint slot.
6. Expected: descendant `parents:[source_id]`, `payload.scars[]` includes the battle scar, and `payload.html` contains a sovereign descendant HTML scaffold with scar rendering.
7. Export/load generated HTML manually and confirm a visible fracture/scar appears on the canvas.
