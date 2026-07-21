# NEXUS Prompt Studio v3 merge notes

This package embeds `prompt-studio-v3.html` into the Noted + Nexus Agent merge.

## Added files

- `public/nexus/prompt-studio-v3.html` — standalone Prompt Studio v3 HTML app.
- `src/studios/promptStudioV3/PromptStudioV3.tsx` — Noted wrapper studio.

## App routes

- `/nexus-agent` — existing Nexus Agent embed.
- `/prompt-studio-v3` — new Prompt Studio v3 embed.

## Sidebar

The Make section now includes `Prompt Studio v3`.

## Integration level

This is a safe iframe mount. Prompt Studio v3 keeps its own localStorage keys and API-key settings. No Noted database schema changes were made.
