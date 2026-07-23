# RULE tree vs PLAY tree

**status_authority:** `NONE`

You asked for a place to **abuse experiments** while still doing **rule-one** work. That is two checkouts of the same GitHub repo:

| | **RULE** | **PLAY** |
|--|----------|----------|
| **Path** | `/home/anon/audit-lab/Lab` | `/home/anon/Lab-PLAY` |
| **Branch** | Real work (e.g. `grok/agent-resources-…`, `main`) | `play/operator-abuse-sandbox` |
| **Use** | PRs, Gate, publications, careful builds | Break, mutate, invent, thrash |
| **CALL** | BUILDER / SCRIBE / GATE-CLERK / AUDITOR | **PLAY** / **BREAKER** default |
| **Merge to main** | Only with Human Gate + review | **Almost never** — re-implement cleanly on RULE |

## Commands

```bash
# Rule-one desk
cd /home/anon/audit-lab/Lab

# Abuse desk
cd /home/anon/Lab-PLAY
cat PLAYGROUND.md
```

## Promote an experiment out of PLAY

1. Note what worked in PLAY (paths, idea).  
2. On RULE tree: new proposal branch from current real tip.  
3. Re-apply the good parts cleanly (or cherry-pick if history is sane).  
4. PR → Human merges.

## Reset PLAY when it becomes a dumpster

```bash
cd /home/anon/audit-lab/Lab
git worktree remove --force /home/anon/Lab-PLAY
git branch -D play/operator-abuse-sandbox
git worktree add /home/anon/Lab-PLAY -b play/operator-abuse-sandbox HEAD   # or origin/main
```

## Still never

Secrets, real money claims, force-push to `main` from either tree.
