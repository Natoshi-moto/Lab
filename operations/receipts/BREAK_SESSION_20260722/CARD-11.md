# CARD-11 result — BREAK_SESSION_20260722 (session 2)

- Card: CARD-11 · Where would a provider key live (synthetic only)
- Threat links: signal-B open question; adjacent to T-07 (crypto strength — deferred, NOT audited here);
  severity amplified by T-01 (CARD-04)
- Seat: Claude Opus 4.8 (Anthropic) — `status_authority: NONE`
- Model family: Anthropic (same account/family as prior Claude seats — **NOT** independent corroboration)
- Date/time run (UTC): 2026-07-22 ~05:00
- main SHA at start: `1a1c9c01a88ef30601882a45706bb9c37e3d35a1` (clean tree, on `main`)
- Result: **FAIL** (provider key stored as **plaintext at rest** in the observed default/pre-activation state)
- Evidence label: **EXECUTED** (saved a synthetic key, read raw storage) + **SOURCE_TRACED** (encrypted path for activated users)

## What was tested (layman)

When you save a provider API key, where does it physically land in browser storage, and does it
look encrypted at rest? Synthetic fake key only: `sk-TEST-DO-NOT-USE-0000`.

## How it was run (synthetic only)

- Fresh throwaway Playwright chromium context (empty storage, no real keys/notes).
- Loaded the real Noted app on the dev server, opened the Agent iframe.
- Saved the fake key through the **exact persistence path** the Agent's `saveKey()` uses —
  `NEXUS.storage.set('keys:test-synthetic', 'sk-TEST-DO-NOT-USE-0000')`
  (`nexus-agent-v0.14-scrubbed.html:2282-2283`).
- Read the **raw** stored bytes directly from IndexedDB `nexus-kernel` store `kv`, bypassing the
  decrypting wrapper, plus the `localStorage nx:` fallback.
- Probe: `scratchpad/card11_probe.js` (throwaway, not committed to product).

## EXECUTED evidence (observed live)

```json
{
  "readback_via_wrapper": "sk-TEST-DO-NOT-USE-0000",
  "raw_idb (nexus-kernel/kv 'keys:test-synthetic')": {"_v":"sk-TEST-DO-NOT-USE-0000","_ts":"2026-07-22T05:00:51.534Z"},
  "raw_ls_nx ('nx:keys:test-synthetic')": "{\"_v\":\"sk-TEST-DO-NOT-USE-0000\",\"_ts\":\"...\"}",
  "crypto_chain_present": {
    "crypto:verifier":"absent","crypto:salt":"absent","crypto:escrow":"absent",
    "crypto:keypair":"present(object)","crypto:meta":"present(object)"
  }
}
```

The fake key is stored **verbatim in plaintext** (`_v` = the fake key; `_ts` is Gen1's
unencrypted timestamp stamp) — **not** the `enc:`-prefixed AES-256-GCM ciphertext form. It is
plaintext in **both** IndexedDB `nexus-kernel/kv` and `localStorage nx:keys:...`.

## Why (SOURCE_TRACED root cause)

Storage-encryption wrapper — `nexus-agent-v0.14-scrubbed.html:1864-1871`:

```js
NEXUS.storage.set = async function(key, value) {
  if (!_activeKey) return original.set(key, value);   // <-- plaintext when not activated
  var stamped = _stamp(value);
  var ct = await NEXUS.crypto.encrypt(_activeKey, stamped);
  return original.set(key, 'enc:' + ct);              // 'enc:' ciphertext only when activated
};
```

`_activeKey` is set only by `activateStorageKey()` (`:2049`, `:1814`), called by the auth gate
after a password/PBKDF2 or BIP-39 recovery (`runAuthGate` `:7565`, `_runOnboarding` first-run
`:7600-7603`). In the observed state, `crypto:verifier/salt/escrow` were **absent** ⇒ the gate had
not activated ⇒ every `storage.set` fell through to plaintext.

## Scope / honesty caveats (do not overclaim)

- **Activated users get ciphertext (SOURCE_TRACED, not run live):** a user who completes onboarding
  and sets a password activates the wrapper, after which `keys:<provider>` is stored as `enc:`
  AES-256-GCM. This card did **not** live-test the post-activation path.
- **Residual UNKNOWN:** whether the normal UI lets a user save a provider key *before* activation
  completes. This probe saved via the real persistence API (faithful to `saveKey`) rather than by
  clicking the settings button that sits behind the onboarding overlay. So the proven fact is
  "the persistence layer stores plaintext pre-activation and does **not** fail closed," not
  necessarily "the UI hands a user a plaintext-key state." Flagged as a follow-up.
- **This is not a crypto audit** — T-07 (encryption strength) remains deferred and unassessed.

## Severity amplification (combine with CARD-04)

CARD-04 (EXECUTED-FAIL this session) proved the same-origin Agent iframe can open
`nexus-kernel/kv` and read it directly. CARD-11 shows that in the pre-activation state that store
holds **plaintext provider keys**. Together: an actor with code in the iframe (T-01) reads provider
keys in the clear in this state. Separately, `nexus-agent-v0.14-scrubbed.html:2357` documents that
`crypto:keypair` holds the **raw private key in plaintext** (present pre-activation, and readable
per CARD-04) — that is the identity key, not a provider key, but it is plaintext-at-rest by design.

## Stop condition honored

CARD-11's stop condition: on finding the key in plaintext, stop, capture evidence, file as FAIL.
Storage exploration was halted at that point; the only further reading done was SOURCE_TRACED code
(activation trigger) to characterize severity honestly — no further live storage probing.

## Non-claims (tattoo)

- `status_authority: NONE`. A FAIL here is honest progress, not a certification.
- **NOT independent corroboration** — same Anthropic account/family as prior seats.
- Synthetic fake key only; no real key ever used. Throwaway browser profile; no real data.
- No fix attempted; making storage fail-closed pre-activation, or forcing activation before any
  key persistence, is **out of scope** for this break session.
