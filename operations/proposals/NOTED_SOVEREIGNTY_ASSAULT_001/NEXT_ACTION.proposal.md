# NEXT ACTION

This proposal packet is design-only. Nothing here has been implemented, and nothing here is authorized to be implemented yet. The next action is an operator decision, not a build task.

## Decisions actually needed

1. **Wave A go/no-go** (`CHARTER.md`): T-01/T-02/T-03 are the highest-severity, best-grounded findings in `THREAT_MODEL.md`. Does this get handed to Codex/Claude-debug as a bounded task, and on what timeline relative to the layout-density work already in flight?
2. **Tension map choice** (`TENSION_MAP.md`): option A, B, or C (or a sequence) for the CDN/proxy/same-origin tradeoff — this gates how Wave A gets implemented, not just whether.
3. **T-06 disposition**: is removing/quarantining the stale `nexus-agent-v0.12.html` copies something to authorize now as a small bounded task, independent of the larger campaign?
4. **T-10 disclosure**: the private-repo-vs-public-repo mismatch is `HUMAN_DECISION_REQUIRED` per Lab `CLAUDE.md` — this proposal does not resolve it, only surfaces that it blocks a clean cold-drop claim.
5. **Snooper scope**: build `SNOOPER_IA.md` as specified (membrane-only, with its coverage gap stated in-product), or reconsider scope before committing to it.
6. **Seat map question** (`CHARTER.md`): does `AI_ROUTING.md` gain a fourth seat for this proposal's role, or stay ad hoc per task?

## What should NOT happen next

- No implementation starts from this packet alone.
- No merge to `main` of this packet's branch without explicit operator instruction.
- No T-ID gets marked closed without the evidence bar in `CHARTER.md` being met and the operator (or Grok-drive, with the operator) signing off.
