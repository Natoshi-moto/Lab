# Public Operator Board

> **SUPERSEDED FOR NEW POSTS:** The public firehose now lives in
> [`Natoshi-moto/Experimental-Sandbox`](https://github.com/Natoshi-moto/Experimental-Sandbox).
> This directory remains as historical evidence. Do not delete or rewrite it; do not add new raw posts here.

**status_authority:** `NONE`  
**Who:** Human Operator (ring-0) — this board is **yours to spam**  
**Where:** historical on `main`; new posts go to Experimental Sandbox

This is **not** STATUS. Not a product backlog with liability. Not an investment feed.

It **is** a public firehose for:

- articles (drafts, links, rants)  
- tweets / short posts  
- thoughts for later  
- plans  
- rough sketches  
- anything you want **on the record** without polishing  

---

## How you add something (30 seconds)

### Option A — drop a file

```bash
# from repo root
cp board/TEMPLATE.md board/thoughts/$(date -u +%Y%m%dT%H%M%SZ)_short-slug.md
# edit it, then:
# add one line at TOP of board/INDEX.md
```

### Option B — paste into the firehose

Append to `board/INBOX.md` under **newest first**.  
A seat or you can file it into a folder later — or leave it forever. **Mess is allowed.**

### Option C — tell an AI

```text
CALL SCRIBE
Board: tweet — <paste>
```

They write the file + INDEX row. They do **not** need your polish.

---

## Folders

| Path | Use |
|------|-----|
| `INBOX.md` | Raw spam / unsorted |
| `articles/` | Longer pieces |
| `tweets/` | Short public posts / X drafts |
| `thoughts/` | Half-formed ideas |
| `plans/` | Plans (not STATUS next-action) |
| `sketches/` | Rough architecture / ASCII / links |
| `later/` | Explicit parking lot |
| `INDEX.md` | Newest-first ledger of **filed** items |

---

## Relation to the rest of the Lab

| This board | Not this board |
|------------|----------------|
| Public human firehose | `STATUS.json` scoreboard |
| OK to be ugly | Session-close ritual |
| Ideas before experiments | `play/*` code thrash |
| Linked to lab branches when you want | Automatic promotion |

When a thought becomes real work: open a **`lab/`** or **`play/`** branch (see `lab/README.md`), link it from the board item, thrash safely. **`main` stays clean** except for board posts + accepted merges.

---

## Non-claims

Spamming the board is not a product launch, token, or safety certificate.  
`status_authority: NONE`
