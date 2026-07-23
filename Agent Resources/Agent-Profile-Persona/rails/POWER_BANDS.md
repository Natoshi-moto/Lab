# Power bands

**status_authority:** `NONE`

| Band | Code | Write paths | Git |
|------|------|-------------|-----|
| **READ** | `R` | none | status/log/show only |
| **NEST** | `N` | `experiments/**`, `operations/proposals/**`, `Agent Resources/**` (drafts), `~/Grok/**`, `Lab-Recovery/**` play, `RAM/**` bus | proposal branches only; no main |
| **LAB_PROPOSE** | `P` | same as NEST + PR-oriented Lab changes on **non-main** branches | push branch / open PR; **no merge** |

**PROMOTE** does not exist as a band. Merge, tag, release, STATUS promote, ship language = **Human only**.

## Escalation

Persona may ask Human: `REQUEST_BAND: P` or `REQUEST_GATE: merge PR #n`.  
Seat never self-escalates.
