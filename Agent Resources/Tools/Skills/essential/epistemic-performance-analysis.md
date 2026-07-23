```yaml
skill_id: epistemic-performance-analysis
version: 1.0
status: ACTIVE
last_used: 2026-07-22
roles_involved: [EVERY_AI_SEAT]
one_line: Every seat must score prior seats and the operator as INFERENCE, then score itself and the gap.
mandatory_for: ALL_AI_ENTRY_AND_ROUND_CLOSE
```

# Epistemic performance analysis (MANDATORY)

**status_authority:** `NONE`

## When to use

- **Entering** a desk that already has prior seat work (read bus, publications, PRs, handoffs).  
- **Ending** every real work round (together with `round-close-publication`).  
- After emergency / multi-seat bursts / operator corrections about “wrong fear object.”

## What you must produce

File:

```text
communications/publications/epistemic/<UTC-DATE>_<seat>_<slug>.md
```

Copy structure from `communications/publications/templates/EPISTEMIC_ANALYSIS.md`.  
Add a row to `communications/publications/epistemic/INDEX.md` (newest first).

## Hard rules

1. **Label inference.** Every judgment about another seat or the human must sit under a heading that says **`INFERENCE`** (not “fact,” not “proven”). Facts (git SHAs, exit codes, PR numbers) go under **`OBSERVED`**.  
2. **Prior models.** Name seats you can see in git/RAM/publications (claude, codex, grok, fable, chatgpt, …). Score epistemic performance: honesty about non-claims, overclaim risk, independence theater, recovery after operator correction, tool-use discipline.  
3. **User / operator.** Same: inference about judgment, flow-state, reds handling, clarity of authority — **never** invent private mental states; ground in public text.  
4. **Self.** Mandatory section: contribution **and** lack thereof; what you optimized for; what you avoided; where you were theater.  
5. **Gap.** What void remains in **semantic routing** (how meaning moves between seats, STATUS, RAM, routes, humans).  
6. **Bridge.** One concrete proposal to fill that void (may point at existing design docs).  
7. **Do not** use this file to soft-close T-01/CARD-11 or claim multi-seat independence.

## State recognition

| Paste / situation | Action |
|-------------------|--------|
| Round closing | Write epistemic file + publication report |
| New seat, desk already hot | Write short epistemic entry on priors before big writes |
| Operator says “analyse the seats” | Full template |

## Non-claims

This analysis is **not** independent science, not HR review, not proof of model superiority. It is a forced habit against narrative laundering.
