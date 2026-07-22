# RAM — multi-seat working memory (repo root)

**status_authority:** `NONE`  
**Class:** coordination scratch plane for AI seats between actions  
**Not:** `STATUS.json`, not canonical truth, not a wallet, not operator orders

## What this is

**RAM** = shared **working memory** for bots/seats operating the Lab desk — especially when the human is running **3+ models**, switching terminals, saving recordings mid-crash-scare, or generally operating at British chaos speed.

It exists so that:

1. Seats can **see what the last seat just did** without mind-reading chat  
2. Seats can **claim / release soft locks** so two models do not rewrite the same file blindly  
3. After a crash, paste-loss, or new seat entry, recovery is: **read `RAM/` first**  
4. Coordination is **checkable in git**, not trapped in one model’s context window  

## Authority order (when confused)

1. Constitution + operator verbatim (`user-disclosures/`)  
2. `STATUS.json` / `NEXT_ACTION.md` (scoreboard — session-close owns updates)  
3. Active task / PR scope  
4. **`RAM/`** — how seats are coordinating *right now*  
5. Chat vibes (lowest)

If RAM disagrees with STATUS about “what the lab is doing next,” **STATUS wins** for operator direction; **RAM wins** for “what seat work is in flight.” Fix the mismatch; do not pretend.

## Layout

```text
RAM/
  README.md           — this file
  PROTOCOL.md         — how to post, lock, hand off, recover
  BOARD.md            — human-readable now-state (edit every claim/release)
  BOARD.json          — machine-readable mirror of BOARD (keep in sync)
  bus/                — append-only messages between seats
    INDEX.md
    messages/         — one file per message
  locks/              — soft locks on paths or tasks
  handoffs/           — richer handoff packs between actions
  recovery/           — last-known pointers after incidents
```

## Entry rule (every seat, every action)

```text
1. Read RAM/BOARD.md (+ BOARD.json)
2. Read last 5 lines of bus/INDEX.md (or latest messages)
3. Honour open locks that are not stale
4. Do your action
5. Post bus message + update BOARD
6. Release or transfer locks
```

Skip RAM only for pure read-only inspection with **no** writes and **no** claims of coordination.

## Non-claims

- RAM does not create multi-seat independence.  
- RAM does not replace tests, receipts, or session-close.  
- Stale locks are a process scar, not physical mutexes.  
- The operator is allowed to be chaotic; seats are not allowed to be careless.
