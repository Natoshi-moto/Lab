# Agent Gateway 🗂️

**A recovery kit for disorganized humans and the AI agents they hire.**

You have six years of projects in Downloads, `final_v2(3).zip`, and folders
named `New Base`. You want an AI agent (Claude Code, Codex, Cursor, Grok —
any of them) to help you fix it. This kit gives you and the agent a shared,
safe starting point. No accounts, no dependencies, no cloud. Python 3.8+ only.

## The idea in 30 seconds

1. **Inventory** — hash every file so "which copy is real?" becomes answerable.
2. **TO_DO_LIST.md** — one mandatory file every agent must read first. It holds
   your rules (never delete, hash before touching) and your task queue.
3. **Freeze** — zip + hash any folder you're about to change, so there's always
   a "these exact bytes existed" receipt to go back to.
4. **Decide** — divergent versions get a written human decision, not a silent merge.

Your agent does the labor. You keep the authority. Everything is reversible.

## Quickstart (copy-paste these)

```bash
# 1. Get the kit into your home directory (or copy the folder there)
cd ~/agent-gateway

# 2. Set up a project: creates TO_DO_LIST.md + quarantine folder
bash bin/gateway-init.sh ~/my-messy-project

# 3. Inventory the mess (add as many paths as you like)
python3 bin/inventory.py ~/my-messy-project ~/Downloads --out ~/my-messy-project/gateway-inventory

# 4. Read the report — the "divergent families" section is your real to-do list
less ~/my-messy-project/gateway-inventory/REPORT.md

# 5. Before changing ANYTHING, freeze it
python3 bin/freeze.py ~/my-messy-project

# 6. Optional GUI: open gui/dashboard.html in any browser,
#    load your INVENTORY.json, explore duplicates visually. Works offline.
```

## Onboarding your agent (any provider)

Tell your agent, in your first message:

> Read `TO_DO_LIST.md` and obey its RULES section before doing anything else.
> Then read `gateway-inventory/REPORT.md` and propose (do not execute) a plan
> for the top three divergent families.

That's it. The kit's files carry the rest of the instructions. See
`AGENT_ONBOARDING.md` for the full agent-facing contract.

## What this kit will never do

- Delete anything (quarantine only, by human decision)
- Phone home, install packages, or require an account
- Decide which version of your work is "the real one" — that's yours

## The five phases (same method used live on the Nexus Lab)

| Phase | What | Command / artifact |
|---|---|---|
| 0 | Freeze & inventory — delete nothing | `inventory.py`, `freeze.py` |
| 1 | Adjudicate — human decides canonical versions | decisions logged in `TO_DO_LIST.md` |
| 2 | Import — canonical copies move into one versioned home (git) | `git init`, commit with hashes |
| 3 | Quarantine — superseded copies archived with pointers | `_quarantine/` + notes |
| 4 | Confess — known problems written down before anyone else finds them | NEVER + STATUS sections |
| 5 | Re-freeze & invite review | `freeze.py`, share the hash |

MIT licensed. Fork it, rebrand it, give it to your grandmother.
