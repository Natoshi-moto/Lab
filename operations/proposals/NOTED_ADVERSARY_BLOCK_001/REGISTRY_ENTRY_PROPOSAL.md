# Registry entry proposal — block-registry.json

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY / NOT YET APPLIED`
**Date:** 2026-07-22
**Target file:** `products/noted-host/public/nexus/block-registry.json` (currently at `"version": "0.05"`)

This proposal does **not** apply the diff below. It is submitted for Claude review alongside the rest of this packet. Applying it before the block itself exists would register a route to a file that doesn't exist yet — do not merge this diff standalone.

---

## Why a new `kind`

Existing kinds (`kernel`, `managed-block`, `legacy-block`, `managed-block-suite`) all read as "part of the trusted lineup." Filing the adversary block under `managed-block` would misrepresent it in the one place — the registry itself — that's supposed to be the honest inventory. Propose a new kind:

```
"kind": "security-block"
```

Role: adversarial / diagnostic only. Never implies trust or endorsement by inclusion, unlike the other kinds.

---

## Proposed directory placement

New sibling directory next to the existing block categories:

```
products/noted-host/public/nexus/os/blocks/
├── agent/
├── apps/
├── eidolon/
├── forges/
├── nostr/
├── social/
├── system/
├── ui/
├── vibes/
├── world/
└── security/          ← new
    └── adversary-proof-v1.html
```

---

## Proposed registry diff (illustrative — not applied)

```diff
   "blocks": [
     ...existing entries unchanged...
+    {
+      "id": "adversary-proof-v1",
+      "title": "Adversary Proof Block — DO NOT USE WITH REAL VALUE",
+      "kind": "security-block",
+      "path": "nexus/os/blocks/security/adversary-proof-v1.html",
+      "notedRoute": "/adversary-proof",
+      "role": "Runs known-open attacks (T-01/T-02/T-03/T-06/T-14) against its own host on synthetic data; records receipts; demonstrates Snooper's coverage gap. Proof of unsafety, not a security feature."
+    }
   ]
```

---

## Proposed new top-level section: block releases

The registry currently has a single `"version"` field and no per-block release history. Propose adding a minimal `"releases"` array so this block's shipping is itself a recorded, dated event — the "block release section" this packet is the first entry in:

```diff
   "principle": "Noted hosts the archive. Nexus routes blocks. Each app remains a sovereign block until a deeper data bridge is explicitly built.",
+  "releases": [
+    {
+      "release_id": "NEXUS-BLOCK-RELEASE-001",
+      "block_id": "adversary-proof-v1",
+      "date": "TBD — set at actual ship time, not proposal time",
+      "summary": "First Nexus block release. Purpose: prove the host/Agent membrane is not safe for real money. Not a feature release.",
+      "status_authority": "NONE"
+    }
+  ],
   "blocks": [ ... ]
```

Future block releases append to this array; existing entries are never rewritten, same non-renumbering discipline as the T-ID spine.

---

## Sequencing

This diff is a Codex packet only after: (1) Claude review of this whole folder, (2) operator GO, (3) the actual `adversary-proof-v1.html` file exists and has been reviewed — never register a route before the target exists, per the same discipline `HARDENING_SEQUENCE.md` applies to H1 (don't leave dangling launcher entries).
