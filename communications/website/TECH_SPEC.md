# Tech spec — Nexus Public Research Surface (website)

**ID:** `TS-NEXUS-PUBLIC-SURFACE-001`  
**Date (UTC):** 2026-07-22  
**status_authority:** `NONE`  
**Companion:** [`WHITE_PAPER.md`](WHITE_PAPER.md)  
**Stack intent:** static, pin-buildable, boring, hard to turn into a scam surface

---

## 1. Goals / non-goals

### Goals

- Static site generated from a **git commit pin** of Natoshi-moto/Lab  
- Render markdown + JSON already in repo  
- Semantic class chips + reds strip  
- Content lint forbidding token/money soft-sell and “independently audited” lies  
- Fast load, accessible, no required JS for core reading  

### Non-goals (v1)

- Backend auth, comments, multi-tenant CMS  
- Client-side agent with write path to STATUS  
- On-chain anything  
- Perfect design system  

---

## 2. Recommended stack (v1)

| Layer | Choice | Why |
|-------|--------|-----|
| Generator | **Eleventy (11ty)** or **Astro** (content mode) | MD/JSON native; static |
| Hosting | GitHub Pages or Cloudflare Pages from Actions | Matches public repo |
| Styling | Small custom CSS (system fonts + one accent) | No CDN dependency if vendored |
| Build pin | `SOURCE_COMMIT` env = full SHA | Footer shows pin |
| Package | Minimal; pin versions | Supply-chain humility |

**Alternative:** pure `mdbook` if operator wants zero JS ecosystem — acceptable if semantic chips still work via HTML classes in preprocessor.

---

## 3. Repo layout (proposed)

```text
communications/website/
  WHITE_PAPER.md
  TECH_SPEC.md
  README.md
  site/                    # generator project (later PR)
    package.json
    eleventy.config.js
    src/
      _data/
        status.json        # copied from root STATUS.json at build
        build.json         # { source_commit, built_at }
      pages/
      css/
    content_lint.mjs
.github/workflows/pages.yml   # optional later
```

v0 of this PR: **paper + spec only** (no generator yet) so operator can accept design before npm surface area.

---

## 4. Data inputs (read-only)

| Input | Path | Transform |
|-------|------|-----------|
| Status | `STATUS.json` | `/status` tables; reds banner |
| Next | `NEXT_ACTION.md` | home “do next” |
| Distrust | `WHY_NOT_TO_TRUST_THIS_PROJECT.md` | `/distrust` |
| Start | `README_START_HERE.md` | `/start` |
| Publications | `communications/publications/**` | indexes |
| Epistemic | `communications/publications/epistemic/**` | `/epistemic` |
| Disclosures | `user-disclosures/entries/**` | `/disclosures` |
| Experiments | `experiments/*/README.md` | cards |
| Break | `operations/receipts/BREAK_SESSION_*/**` | plain language |
| RAM board | `RAM/BOARD.md` | `/ram` with “volatile” banner |
| License | `LICENSE` | `/legal` |

Build **fails** if `STATUS.json` missing or JSON invalid.

---

## 5. Semantic class rendering

Markdown convention (authors must follow):

```markdown
> **OBSERVED:** `./nexus doctor` exit 0 at commit abc123

> **INFERENCE:** Seat optimized for narrative speed over re-probe.

> **OPERATOR_VERBATIM:** (only quote from user-disclosures)
```

Preprocessor wraps blockquotes starting with these tags in `<aside class="sem sem-observed">` etc.

### CSS requirements

- Color + pattern (not color alone)  
- Print styles preserve labels as text  

---

## 6. Content lint (`content_lint.mjs`)

Fail build on (case-insensitive) unless inside an allowed “forbidden phrases we reject” page:

- `buy token`, `investment opportunity`, `guaranteed returns`  
- `independently audited` without link to non-claim  
- `bank-grade`, `military-grade encryption`  
- `multi-ai consensus proves`  

Allowlist path: `/distrust`, `/legal` may quote bad phrases as **rejected**.

---

## 7. Reds component

```text
IF status.human_readable_reds.length > 0:
  show sticky banner listing each red
  link to /break and /status
ELSE:
  show “no human_readable_reds in pin” — still not a safety cert
```

---

## 8. Build & deploy

```yaml
# conceptual CI
on: push to main (paths communications/website/** or content sources)
steps:
  - checkout fetch-depth 0
  - node LTS
  - npm ci
  - node content_lint.mjs
  - npm run build
  - upload pages artifact
env:
  SOURCE_COMMIT: ${{ github.sha }}
```

Preview builds on PRs optional.

---

## 9. Security / privacy

- Public content only; never mount `corpus/local-only`  
- No analytics by default (if added later: opt-in, no fingerprinting)  
- CSP: default-src 'self'; no third-party scripts v1  
- Subresource integrity if any external asset (prefer none)

---

## 10. Accessibility

- WCAG 2.2 AA target  
- Keyboard skip link  
- `prefers-reduced-motion`  
- Semantic headings; one h1 per page  

---

## 11. Testing

| Test | Method |
|------|--------|
| Lint money language | unit on fixture MD |
| STATUS render | fixture STATUS.json |
| Reds banner | STATUS with/without reds |
| Broken link check | lychee or 11ty plugin on build |
| Pin footer | assert SOURCE_COMMIT in index.html |

---

## 12. Phased delivery

| Phase | Deliverable |
|-------|-------------|
| **P0** | This white paper + tech spec (done in docs) |
| **P1** | Generator skeleton + home/status/distrust/start |
| **P2** | Publications + epistemic + disclosures indexes |
| **P3** | Experiments + break plain-language |
| **P4** | GVA page + optional video embeds |
| **P5** | Content lint in CI + Pages deploy |

---

## 13. Acceptance criteria (operator)

- [ ] Hostile stranger finds distrust + reds without GitHub deep links  
- [ ] Every epistemic page shows INFERENCE labeling  
- [ ] Footer pin matches deployed commit  
- [ ] No token language in default nav  
- [ ] Operator can say “this is not a product launch” without contradiction on homepage  

---

## 14. Non-claims

Spec does not authorize implementation until operator commissions a task.  
Not STATUS authority. Not security certification.  
`status_authority: NONE`
