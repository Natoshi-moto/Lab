import type { ShelfRefType } from '../types'

// Custom event name used by every studio to react to "open this thing"
// requests from outside (Shelf, Cmd+K, etc).
export const SELECT_EVENT = 'verse-studio:select'

// Sweep 21 widens the palette/shelf jump surface to also cover patterns and
// pipelines. ShelfRefType stays narrower (those two are not pinnable to the
// Shelf), so the palette uses this slightly broader union instead.
export type JumpableKind = ShelfRefType | 'pattern' | 'pipeline'

export interface SelectIntent {
  kind: JumpableKind
  id: string
}

/**
 * LocalStorage keys the studios use for their last selection. Centralised
 * here so the shelf / palette write the same keys the studios read.
 *
 * Sweep 6: 'project' (longform draft) was renamed to 'longform' with a
 * fresh storage key (`…lastDoc`). A new 'project' entry was added for the
 * universal Project route — its UI ships in Sweep 8.
 *
 * Sweep 21: 'pattern' and 'pipeline' added. These keys are already read by
 * Library.tsx and PromptStudio.tsx respectively on cold load.
 */
export const SELECTION_KEYS: Record<JumpableKind, string> = {
  document: 'verse-studio:writing:lastDoc',
  poem:     'verse-studio:poetry:lastPoem',
  longform: 'verse-studio:longform:lastDoc',
  build:    'verse-studio:appdesign:lastBuild',
  project:  'verse-studio:projects:lastProject',
  pattern:  'verse-studio:library:lastPattern',   // already used by Library.tsx
  pipeline: 'verse-studio:prompts:lastPipeline',  // already used by PromptStudio.tsx
  note:     'verse-studio:notes:lastSelected'     // Sweep 27
}

export const ROUTE_FOR_TYPE: Record<JumpableKind, string> = {
  document: '/writing',
  poem:     '/poetry',
  longform: '/longform',
  build:    '/app-design',
  project:  '/projects',
  pattern:  '/library',
  pipeline: '/prompts',
  note:     '/notes'  // Sweep 27
}

/**
 * Programmatically open an item in its studio.
 *
 *   1. Write the studio's lastSelected localStorage key (so cold loads land here)
 *   2. Dispatch a `verse-studio:select` custom event for any already-mounted studio
 *   3. Caller is responsible for navigating with react-router's useNavigate
 */
export function jumpToSelection(intent: SelectIntent) {
  try {
    localStorage.setItem(SELECTION_KEYS[intent.kind], intent.id)
  } catch {}
  window.dispatchEvent(new CustomEvent(SELECT_EVENT, { detail: intent }))
}
