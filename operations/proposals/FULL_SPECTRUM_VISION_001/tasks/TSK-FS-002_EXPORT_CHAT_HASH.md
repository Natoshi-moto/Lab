# TSK-FS-002 — Seal vision chat export hash

**status_authority:** NONE  
**Claims:** CLAIM-METH-002, CLAIM-GEN-001  
**Done when:** `VISION_THREAD_MANIFEST.md` replaces `EXPORT_PENDING` with hash + storage path class

## Steps

1. Export public-safe vision chat (exclude sealed/clinical).  
2. `sha256sum` the export file.  
3. Store export LOCAL_ONLY or commit only if operator confirms public-safe.  
4. Edit manifest:

```text
Chat export hash: <sha256>
Chat export path: <path or SEALED>
```

5. SESSION_LOG entry.

## Non-claims

- Hashing a chat does not make claims true.  
