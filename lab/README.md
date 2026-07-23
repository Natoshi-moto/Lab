# Safe Lab Mode — go nuts, keep `main` clean

**status_authority:** `NONE`  
**Human Gate:** still only you merge to `main`  

This is the documented, public contract for **parallel chaos**.

---

## The deal

| Zone | What you do | What CI does | Touches `main`? |
|------|-------------|--------------|-----------------|
| **`main`** | Board posts + Human-merged good stuff | Full Nexus Audit | Yes — keep it green |
| **`lab/**` branches | Named experiments, documented, linked from board | **Lab-mode CI** on every push | No |
| **`play/**` branches | Total abuse (see also `/home/anon/Lab-PLAY`) | **Lab-mode CI** on every push | No |
| **Forks** | Your or others’ forks | Their CI if any | No |

You may open **as many** `lab/*` and `play/*` branches as you want.  
Ugly names OK. Parallel OK. Abandoned OK.  
**Only rule:** do not merge garbage into `main` without a sober Gate moment.

---

## Branch naming

```text
lab/<short-topic>-<optional-date>     # semi-serious experiment
play/<anything-you-want>              # pure thrash
```

Examples:

```text
lab/gva-fixture-trial-001
lab/three-pane-mock-html
play/i-hate-this-api
play/eidolin-explode-7
```

---

## Document + link (so future-you / AIs find it)

1. Optional: board item in `board/plans/` or `board/INBOX.md` with branch name.  
2. Register in [`BRANCHES.md`](BRANCHES.md) (one line — or tell an AI `CALL SCRIBE` to add it).  
3. Push:

```bash
git checkout -b lab/my-idea
# thrash
git push -u origin HEAD
```

CI runs **automatically** on that push (`.github/workflows/lab-mode.yml`).

---

## What lab-mode CI checks (safe, non-blocking of main)

On every push/PR to `lab/**` or `play/**`:

1. Checkout  
2. `./nexus doctor` (fail the lab run if doctor fails — your lab is broken, main is fine)  
3. `python3 -m unittest discover -s tests -v` (best effort; may need `npm ci` for full R013+)  
4. **Never** deploys, never tags, never touches `main`

Failed lab CI = “this playground is sick,” **not** “Lab is down.”

---

## Two local folders (optional)

| Path | Branch | Use |
|------|--------|-----|
| `/home/anon/audit-lab/Lab` | RULE / `main` / real PRs | Careful |
| `/home/anon/Lab-PLAY` | `play/operator-abuse-sandbox` | Default abuse worktree |

See `Agent Resources/Agent-Profile-Persona/rails/RULE_VS_PLAY.md`.

---

## Promote something that worked

```text
1. Note the lab/play branch + what worked
2. On a clean RULE branch from main: re-apply cleanly
3. PR → Human merges to main
4. Board item: "promoted from lab/foo"
```

Cherry-pick only if history is not cursed.

---

## CALL mapping

| You want | CALL | Where |
|----------|------|--------|
| Spam thoughts publicly | `SCRIBE` | `board/` on main |
| Code chaos | `PLAY` / `BREAKER` | `Lab-PLAY` or `play/*` |
| Serious feature | `BUILDER` | `lab/*` then PR |

---

## Non-claims

Lab mode is not a product sandbox with user data. No secrets on any branch.  
`status_authority: NONE`
