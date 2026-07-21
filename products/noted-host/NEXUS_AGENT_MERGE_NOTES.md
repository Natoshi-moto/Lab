# Nexus Agent merge notes

This package embeds `Nexus_Agent_v0_12_katex_code_rendering.html` as a first-pass Noted studio.

## What changed

- Added `public/nexus/nexus-agent-v0.12.html`.
- Added `src/studios/nexusAgent/NexusAgentStudio.tsx`.
- Added route `/nexus-agent` in `src/App.tsx`.
- Added a `Nexus Agent` sidebar item in `src/components/Sidebar.tsx`.
- Included `install-noted-v0.01-fedora44.sh` for Fedora 44 install/launcher repair.

## Why this merge shape

Nexus Agent is a single-file app with its own runtime, storage layer, provider settings, agent system, quine export, Markdown/KaTeX/code rendering, and external CDN dependencies. Embedding it as an iframe avoids a destructive rewrite while making it accessible from Noted.

## Next native-merge candidates

1. Import Nexus exported sessions into Noted Notes or Scraps.
2. Port Nexus Markdown/KaTeX/code rendering into Noted editors/previews.
3. Port Nexus Agent definitions into Noted Prompt Studio pipelines.
4. Replace external CDN links with bundled local dependencies for fully offline use.
