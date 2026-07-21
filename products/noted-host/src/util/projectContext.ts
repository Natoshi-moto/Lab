// Sweep 25 — Project context tracking.
//
// Why this exists
// ───────────────
// Pre-Sweep-25, navigating from a Project board card to (say) the Writing
// studio severed the user's mental thread. The Writing studio knew nothing
// about the project they came from. There was no breadcrumb, no "back to
// project", no way to return except through the sidebar — which doesn't
// remember which project they were in.
//
// The fix is a thin "project context" channel that:
//
//   1. Records which project the user was working in WHEN they navigated
//      to a record.
//   2. Is read by every studio's TopBar, which renders a `← Project Name`
//      pill if the context is set.
//   3. Clears itself when the user returns to /projects (they've completed
//      the round trip) or when they explicitly dismiss the pill.
//
// Why localStorage and not React context
// ──────────────────────────────────────
// Context lives in `WorkspaceProvider`, which is a frozen file. Adding a
// field there means an unfreeze. localStorage is the established pattern
// for cross-studio breadcrumb state in this codebase (e.g. lastDoc keys
// per studio). The cost is one storage event per change — negligible.
//
// Why a tiny event bus on top of localStorage
// ───────────────────────────────────────────
// `localStorage` doesn't fire the `storage` event in the same window that
// wrote the value. The breadcrumb component needs to react when a card is
// clicked in the same tab. A custom DOM event covers that.

const KEY = 'verse-studio:projectContext'
const EVENT = 'verse-studio:projectContext:change'

export interface ProjectContext {
  projectId: string
  /** Where the user navigated TO. Used to know whether to keep the
   *  breadcrumb visible — once they're back on /projects, drop it. */
  enteredAt: number
}

export function setProjectContext(projectId: string): void {
  try {
    const ctx: ProjectContext = { projectId, enteredAt: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(ctx))
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {}
}

export function clearProjectContext(): void {
  try {
    localStorage.removeItem(KEY)
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {}
}

export function getProjectContext(): ProjectContext | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.projectId !== 'string') return null
    return parsed as ProjectContext
  } catch {
    return null
  }
}

/**
 * Subscribe to context changes. Returns an unsubscribe fn.
 * Fires for both same-window writes (via the custom event) and
 * cross-tab writes (via the native storage event).
 */
export function subscribeProjectContext(cb: () => void): () => void {
  const onCustom = () => cb()
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb()
  }
  window.addEventListener(EVENT, onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}
