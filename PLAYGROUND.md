# ☢️ LAB-PLAY — abuse sandbox

**This worktree is for HARD EXPERIMENTS.**

| Tree | Path | Branch | Use |
|------|------|--------|-----|
| **RULE** | `/home/anon/audit-lab/Lab` | `grok/agent-resources-round-publication-001` (or whatever you use for real PRs) | Real proposals, Human Gate, no chaos on main |
| **PLAY** | `/home/anon/Lab-PLAY` | `play/operator-abuse-sandbox` | Break, mutate, invent, burn — still don't put secrets |

## Rules of the cage

1. Prefer **all reckless work here**.  
2. Do **not** merge this branch to `main` without a sober Human Gate review.  
3. `CALL PLAY` / BREAKER belongs here by default.  
4. Secrets still forbidden.  
5. To promote an idea: cherry-pick or re-implement on the RULE tree as a clean PR.

## Git

```bash
# PLAY
cd /home/anon/Lab-PLAY
git status
git checkout play/operator-abuse-sandbox

# RULE
cd /home/anon/audit-lab/Lab
```

## Nuke / reset PLAY

```bash
cd /home/anon/audit-lab/Lab
git worktree remove --force /home/anon/Lab-PLAY
git branch -D play/operator-abuse-sandbox   # optional
# recreate from a clean tip when ready
```
