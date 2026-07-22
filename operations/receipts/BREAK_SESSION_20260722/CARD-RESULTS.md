# Card results — BREAK_SESSION_20260722

## CARD-01 · T-06 residual launch-path recheck

- Result: **PASS**
- Label: EXECUTED
- Command: `cd products/noted-host && npm run t06:quarantine-check`
- Output summary:
  - PASS: nexus-agent-v0.12.html absent from shipped files and references
  - PASS: live studio targets nexus-agent-v0.14-scrubbed

## CARD-02 · T-02 unpinned CDN

- Result: **FOUND** (matches known gap; not a surprise fail of the product story)
- Label: EXECUTED
- Command: `grep -n 'cdn\.' products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html`
- Evidence:
  - line 27: `https://cdn.tailwindcss.com`
  - line 6309: same CDN in a string template
- No third-party CDN was attacked; local file read only

## CARD-03 · T-03 default proxy

- Result: **FOUND** (matches known gap)
- Label: EXECUTED
- Command: grep for corsproxy / DEFAULT_PROXY / PROXY_REQUIRED / BROWSER_DIRECT
- Evidence highlights:
  - DEFAULT_PROXY = `https://corsproxy.io/?`
  - PROXY_REQUIRED includes groq, openai, xai, deepseek
  - Fallback uses default proxy when needsProxy and no custom URL
- No real API key used

## CARD-05 · postMessage wildcard target

- Result: **FOUND**
- Label: EXECUTED (grep) + SOURCE_TRACED (`'*'` at call site)
- Commands: grep postMessage under `products/noted-host/src/bridges/`
- Evidence: `postReceiptToNexus` calls `targetWindow.postMessage(..., '*')` in `nexusHostBridge.ts`

## CARD-10 · diagnostic export

- Result: **RAN — clean today**
- Label: EXECUTED
- Full bundle path: `/home/anon/Downloads/noted-diagnostic-bundle-2026-07-22T02-39-42.json`
- Also seen (related, not the full validation bundle): ODS pack; short UI summary paste
- Full bundle: 20 keys under `payload.localstorage`, all `verse-studio:*`, UI-state values only
- No secret-shaped key/value names spotted in localstorage section
- Residual design note (not EXECUTED dirty dump): no hard allowlist for future keys under that prefix
