# 🧷 Safety kit — the toddler-proof rails

**status_authority:** `NONE`

Loud, pedantic, deliberately patronising guardrails so a fast-moving human (or AI)
does not scare themselves near a **public, permanent** repo. Born from the
2026-07-22 whoopsie (cockiness + lost-track-of-terminals). Nothing broke that day;
these are the stabilisers we added anyway. 🚲

## What's here

- **[`STOP_READ_THIS_FIRST.md`](STOP_READ_THIS_FIRST.md)** — the big emoji sign. The four danger buttons (📤 push, 🔀 merge, 🗑️ delete, ⚙️ settings), the "🐣 where am I?" ritual, and the golden rule. Read it once.
- **[`hooks/`](hooks/)** — automatic screaming that backs up the sign:
  - `pre-push` — HARD-BLOCKS push to `main`/`master`; shouts a PUBLIC = FOREVER warning on every push. Non-interactive, so it never hangs automation.
  - `pre-commit` — BLOCKS committing directly on `main`/`master` (work on a branch).
  - `install.sh` — turns the hooks on for one clone.

## Turn the hooks ON (per clone)

```bash
bash operations/safety/hooks/install.sh
```

Run it once in each clone you actually work in. Worktrees of the same clone share
hooks automatically, so you only install once per clone. Safe and reversible — it
just copies two tiny scripts into `.git/hooks/`.

## Turn the hooks OFF

Delete `pre-push` and `pre-commit` from the folder `install.sh` printed
(usually `.git/hooks/`). That's it.

## What these rails do NOT do

- They do not make the project safe, finished, or validated.
- They do not replace thinking; they buy you the ten seconds to think.
- `main` is also protected on GitHub's side — the local hook is a fast, loud
  early-warning so you find out *before* the server says no.
