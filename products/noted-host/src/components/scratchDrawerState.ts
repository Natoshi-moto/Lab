export const SCRATCH_DRAWER_OPEN_EVENT = 'verse-studio:scratch-drawer:open-change'
export const SCRATCH_DRAWER_OPEN_KEY = 'verse-studio:scratch-drawer:open'

export function isScratchDrawerOpen(): boolean {
  try { return localStorage.getItem(SCRATCH_DRAWER_OPEN_KEY) === 'true' } catch { return false }
}

export function persistScratchDrawerOpen(open: boolean): void {
  try { localStorage.setItem(SCRATCH_DRAWER_OPEN_KEY, open ? 'true' : 'false') } catch { /* ignore */ }
}

export function setScratchDrawerOpen(open: boolean): void {
  persistScratchDrawerOpen(open)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<boolean>(SCRATCH_DRAWER_OPEN_EVENT, { detail: open }))
  }
}
