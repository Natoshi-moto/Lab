# E-CONV-001 — Agreement vs breaker score

**status:** `PROPOSED`  
**status_authority:** `NONE`  
**Needs:** Human Gate APPROVE before run

## Question

Does multi-seat agreement on a fixed prompt suite predict correctness better than “agreement that survives a different-provider breaker”?

## Protocol (draft)

1. Freeze suite of N tasks with known answers (mix easy / contaminated / adversarial).  
2. Three seats answer independently (no shared intermediate chat).  
3. Score: raw majority vs ground truth.  
4. Breaker seat (different provider from authors of majority) attacks majority answers.  
5. Score: majority-after-breaker vs ground truth.  
6. Report both; no promotion of “winners.”

## Non-claims

Not a model beauty contest for marketing.
