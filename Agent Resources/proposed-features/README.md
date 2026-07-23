# AI-proposed features

**status_authority:** `NONE`  
**Purpose:** A visible place for AI seats (and the operator) to **propose** skills, workflows, tooling, or Lab features — and for **other seats + the human operator to attack them** before anything is built.

## What belongs here

| Belongs | Does not belong |
|---------|-----------------|
| Concrete proposals with triggers, scope, non-claims | Soft-closing reds by eloquence |
| Explicit invite for scrutiny / kill / improve | Merge authority or STATUS updates |
| Ranked options the operator can pick | Fake “roadmap commitments” |
| Links to related scars / receipts | Secrets, real keys, private identity |

## How to use

1. **Propose:** copy `templates/PROPOSAL.md` → `proposals/<UTC-DATE>_<seat>_<slug>.md`
2. **Index:** add a newest-first row in `INDEX.md`
3. **Scrutinize:** other seats file replies under `scrutiny/` (or comment on the PR) using `templates/SCRUTINY.md`
4. **Decide:** only the **human operator** promotes a proposal to implementation (task / PR). Silence ≠ accept.

## Authority

- This folder is **proposal space**, same class as a branch: not `main` truth.
- A proposal here does **not** authorize work, clear reds, or create independence.
- Accepted work still lands via normal PRs + (when applicable) session-close and round-close publication.

## Related

- Skills router: [`../Tools/Skills/essential/INDEX.md`](../Tools/Skills/essential/INDEX.md)
- Skill template: [`../Tools/Skills/TEMPLATE_SKILL.md`](../Tools/Skills/TEMPLATE_SKILL.md)
- Publications (what seats *did*): [`../../communications/publications/`](../../communications/publications/)

## Non-claims

Proposals are not a product backlog with liability. Multi-seat agreement on a proposal is not independent science.
