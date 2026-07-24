# HANDOFF_CURRENT.md — the baton

> One live baton per project. When any agent stops — credits gone, context full,
> blocked, or done — this file IS the project state. The next agent (any
> provider) starts here after TO_DO_LIST.md. Previous batons are archived to
> `HANDOFF_LOG/` untouched; batons are never edited after archiving.

## BATON
- **id:** B-001
- **from-seat:** (model + provider, e.g. "Claude Opus 4.8")
- **date-utc:** YYYY-MM-DD HH:MM
- **stop-reason:** COMPLETED | CREDITS_EXHAUSTED | CONTEXT_FULL | BLOCKED | HUMAN_PAUSED
- **baseline:** (git SHA and/or freeze-zip sha256 this work stands on)

## STATE — what is true right now
<!-- Only claims with an evidence tag. No optimism. -->
- [RUNTIME-ATTESTED] (things you executed and observed)
- [SOURCE-VERIFIED] (things you read but did not run)
- [UNABLE_TO_VERIFY] (things you could not confirm — say what's needed)

## IN-FLIGHT — the task that was interrupted
- **task:** (one line)
- **done so far:** (bullet list, each tagged with evidence level)
- **NOT done, may look done:** ← the most important field on this page
- **next single concrete step:** (one action the next seat can take immediately)

## MISTAKES — committed as mistakes
<!-- Errors are preserved, never cleaned up silently. A wrong file, a bad edit,
     a false claim in an earlier message: name it, hash it if it's a file,
     state the correction. The mistake and the correction are BOTH history. -->
- (none yet | list)

## FOR THE NEXT SEAT
- **do not trust:** (anything this session produced that wasn't verified)
- **verify first:** (the one check that catches this baton lying)
