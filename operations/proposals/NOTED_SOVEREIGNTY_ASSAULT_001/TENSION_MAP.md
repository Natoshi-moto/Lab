# Tension map — Agent CDN/keys vs. local-first sovereignty story

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22

T-01 (same-origin iframe), T-02 (unpinned CDN), and T-03 (default public proxy) are really one system-level choice, not three unrelated bugs. Three options, no recommendation forced — this is a call for the operator to make explicitly rather than have it happen by default because nobody looked at it directly.

| Option | What it means | Cost |
|---|---|---|
| **A — Status quo, disclosed loudly** | Keep CDN + default proxy + `allow-same-origin`; make the non-claims impossible to miss | Cheapest; sovereignty claim stays honest-but-weak: "local-first, with named exceptions" |
| **B — Vendor + drop default proxy** | Bundle Tailwind/marked/highlight/katex locally (kills T-02); remove `DEFAULT_PROXY`, require the user to set their own if they want a proxy-needing provider (weakens T-03) | Real engineering work; breaks first-run experience for groq/openai/xai/deepseek until the user configures something |
| **C — Split trust: drop `allow-same-origin`** | Removes T-01's core mechanism | Agent loses its own local storage (sessions, keys) unless something else grants it back deliberately, with its own explicit warning — likely the biggest single win against the biggest single finding, but also the most disruptive |

Options are not mutually exclusive across time — e.g. B then C is a plausible sequence, C alone without B still leaves T-02/T-03 open.
