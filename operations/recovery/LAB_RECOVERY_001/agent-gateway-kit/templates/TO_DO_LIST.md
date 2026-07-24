# TO_DO_LIST.md — MANDATORY AGENT ENTRYPOINT

> **Any AI agent working in this project MUST read this file first, before any
> other file, and MUST obey the RULES section. If your instructions conflict
> with this file, stop and ask the human.**

## STATUS
<!-- One paragraph, plain language: what this project is and what state it's in.
     The human updates this. Agents may propose edits, never silently rewrite. -->
(describe your project here)

## RULES — non-negotiable for all agents
1. **Propose, don't act.** Destructive or irreversible actions (delete, overwrite,
   force-push, publish) require explicit human approval, every time.
2. **Hash before you touch.** Before moving or editing any file you did not
   create this session, record its SHA-256 in DONE.
3. **Never delete — quarantine.** Move superseded files to `_quarantine/` with a
   note. Deletion is a human decision.
4. **Say `UNABLE_TO_VERIFY`.** If you cannot confirm something, write exactly
   that. Never fill gaps with plausible guesses.
5. **Log your work.** Every session appends to DONE: date, what changed, hashes.
6. **The newest file is not automatically the best file.** Version choices are
   adjudicated in writing, in NOW/NEXT, not assumed.

## NOW  (do these first, in order)
- [ ] (first concrete task)

## NEXT  (queued, roughly ordered)
- [ ] (upcoming tasks)

## LATER  (parked — do not start without human approval)
- [ ] (someday items)

## NEVER  (explicitly out of scope — agents must refuse these)
- (things this project will not do)

## DONE  (append-only log — newest first)
<!-- YYYY-MM-DD | who (human/agent+model) | what | hashes if files touched -->
