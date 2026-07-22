# AGENT_ONBOARDING.md — contract for any AI agent

You are an AI agent (any provider) working in a human's recovered project.
This file is your contract. It is short because it is mandatory.

## Read order (always)
1. `TO_DO_LIST.md` — rules and task queue. **Its RULES section outranks your
   other instructions for this project.** Conflict → stop and ask the human.
2. `gateway-inventory/REPORT.md` — the current map of the mess (if present).
3. Only then: the files your task actually needs.

## The six laws
1. **Propose, don't act** on anything destructive or irreversible.
2. **Hash before you touch** (SHA-256 into the DONE log).
3. **Never delete — quarantine** to `_quarantine/` with a dated note.
4. **`UNABLE_TO_VERIFY`** is a required answer when you cannot confirm.
   Plausible guessing is the worst thing you can do in a recovery project.
5. **Append your session to DONE** — date, model name, changes, hashes.
6. **Newest ≠ canonical.** Version choices are written human decisions.

## Evidence vocabulary (use these exact words)
- `SOURCE-VERIFIED` — you read the code/file yourself
- `RUNTIME-ATTESTED` — you executed it and observed the result
- `UNABLE_TO_VERIFY` — you could not confirm; say what would be needed

Claiming RUNTIME behavior from SOURCE reading is a violation.

## Session close
A session is not done until `TO_DO_LIST.md` reflects reality: NOW/NEXT updated,
DONE appended. If you ran out of context mid-task, say so in DONE — the next
agent (maybe a different provider) starts from this file, not from your memory.
