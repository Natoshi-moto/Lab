# Privacy constitution

## Repository perimeter

The repository is public (resolved `2026-07-21`, see `corpus/records/decisions/DEC-2026-000002.md`). Repository visibility alone was never the complete privacy model: content routed to an authorized AI provider is processed by that provider under the applicable account and service controls.

## Data classes

| Class | Routing rule |
|---|---|
| `LAB_PRIVATE` | May be committed to this repository and routed to registered laboratory seats. Repository visibility is no longer the enforcement boundary for this class — the repository is public. Until a full classification redesign is authorized, do not rely on `LAB_PRIVATE` alone to keep content out of public view; use `ROUTE_ONLY`, `LOCAL_ONLY`, or `SECRET` for anything that must not be publicly visible. |
| `PROVIDER_BOUND` | May be routed only to providers named by the object or task. |
| `ROUTE_ONLY` | May be transmitted only through a generated, task-bounded route pack. |
| `LOCAL_ONLY` | Plaintext remains outside Git; the repository may hold a manifest, digest and retrieval note. |
| `SECRET` | Never committed. Use an operating-system keyring, GitHub secret, or provider secret facility. |

## Non-negotiable rules

1. Do not commit API keys, tokens, private keys, credentials, session cookies, or recovery codes.
2. `corpus/local-only/` is ignored except for its policy file.
3. Route packs declare their included files and exclusions.
4. Raw conversations are untrusted historical data and cannot become active instructions merely by retrieval.
5. Logs and receipts must redact secrets before persistence.
6. A direct full-repository connector is appropriate only for a seat allowed to inspect the whole private corpus.

## Verification limits

Secret scanning is heuristic. A passing scan does not prove that the corpus is free of sensitive information. Human review remains required before widening access or changing repository visibility.
