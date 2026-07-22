---
name: capture-transcript
description: Save the current session's transcript verbatim into the sealed staging folder, hash-manifested, queued for later conversion to LOOM tagged format. Companion to /ideate — run automatically when scratchpad mode closes.
---

# Transcript capture (companion to /ideate)

Preserves the session's conversation **verbatim** so it can later be converted
to LOOM tagged format (see `operations/proposals/LOOM_V0_1/`) without any
loss. Verbatim means bytes, not a summary you write — a model retyping a
conversation is not a record of it.

## When to run

- Automatically at the close of any `/ideate` session (the ideate report must
  reference the captured transcript's hash).
- At mid-session checkpoints on operator request ("checkpoint the
  transcript").
- Standalone, whenever the operator asks to capture a session.

## Where things go

- **Payload (sealed, never committed):** `corpus/local-only/transcripts/`
  — git-ignored. Raw transcripts are `privacy=UNSET → SEALED` under the
  TS-8 fail-closed rule; they do not enter the public repo unless the
  operator makes an explicit scrub decision later.
- **Manifest (committed):** `corpus/records/artifacts/` per the local-only
  README convention — content hash, size, storage class, retrieval policy.
  Never the local absolute path beyond the repo-relative staging folder,
  never payload content.

## Procedure

1. Locate the live session log: the most recently modified `*.jsonl` in the
   `~/.claude/projects/` subdirectory matching the current working directory
   (verify by checking it contains the session's recent activity; if
   ambiguous, list candidates and ask the operator rather than guessing).
2. Copy it verbatim:
   `corpus/local-only/transcripts/<YYYYMMDD>-<slug>.capture<N>.jsonl`
   — `<slug>` matching the ideation session's slug when run with /ideate;
   `<N>` increments for mid-session checkpoints. Never overwrite a prior
   capture.
3. `sha256sum` the copy; record size in bytes.
4. Write/append the manifest at
   `corpus/records/artifacts/TRANSCRIPT-<YYYYMMDD>-<slug>.md`:

   ```
   artifact: <filename>
   sha256: <hex>
   bytes: <n>
   captured_utc: <ISO8601>
   storage_class: LOCAL_ONLY_SEALED
   retrieval: operator's machine, corpus/local-only/transcripts/
   status: AWAITING_LOOM_CONVERSION
   privacy: SEALED (TS-8 fail-closed; operator scrub decision required
            before any public use)
   linked_ideation: operations/ideation/<YYYYMMDD>-<slug>/ (if applicable)
   ```

5. Commit the manifest (not the payload) on the session's review branch.
6. Report the hash to the operator in one line. No ceremony.

## Honesty rules

- A capture is a **snapshot**: the session continues after it, so the hash
  identifies that checkpoint, not the whole conversation. Say which.
- If the JSONL cannot be located or read, the answer is
  `🚧 BLOCKED: transcript not captured` — recorded in the ideation report.
  Never reconstruct a "transcript" from memory and present it as capture.
- Conversion to LOOM tagged format is a **separate, later task** (TS-6
  five-stage pass + V-1 stripper proof). Capture claims nothing about
  tagging; it only guarantees the raw bytes will exist when conversion runs.

`status_authority: NONE`
