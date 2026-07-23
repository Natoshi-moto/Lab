# Vault index — verbatim adversarial reports (newest first)

**status_authority:** `NONE`
**Rule:** one row per report folder; newest at top; never delete a row. Full
verbatim reports live under `reports/`. Short human-readable reasons live in
[`../WHY_NOT_TO_TRUST_THIS_PROJECT.md`](../WHY_NOT_TO_TRUST_THIS_PROJECT.md).

| Date (UTC) | Track | Seats | Headline | Worst confirmed severity | Folder |
|------------|-------|-------|----------|--------------------------|--------|
| 2026-07-23 | NOTED | Codex + Claude | Browser product's real credential/content handling contradicts its "sovereign / local-first" language; keys in localStorage & URL; default third-party CORS proxy; 71-page shared-origin no-CSP credential store; export leaks content + author identity (creds-in-export worst case falsified) | HIGH (confirmed structural; no exploit chain proven) | [reports/2026-07-23_NOTED_frontend-privacy-assault/](reports/2026-07-23_NOTED_frontend-privacy-assault/) |

## How to add a row

1. Create `reports/<UTC-DATE>_<TRACK>_<slug>/`, copy verbatim report file(s) in.
2. Write `PROVENANCE.md` (source path + `sha256` + author seat per file).
3. Insert one row **above** the previous newest here.
4. Add **one** short line to `../WHY_NOT_TO_TRUST_THIS_PROJECT.md`
   (§ Evidenced serious universal vulnerabilities) linking to the folder.
5. Do not paste the report body into the index files — that is what this vault is for.
