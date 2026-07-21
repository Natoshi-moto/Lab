import { useEffect, useRef, useState } from 'react'

export const AUTOSAVE_DELAY_MS = 400

/**
 * Debounced autosave with unmount flush.
 *
 * `signature` is a primitive (string) summary of the draft used for change
 * detection — it must change exactly when the draft does. `isDirty` is true
 * when the draft has unsaved changes vs the source-of-truth. `save` is a
 * closure that pushes the current draft into the workspace context.
 *
 * Behaviour:
 *   - On every signature change while dirty, restart a `delay`ms timer.
 *   - When the timer fires, call `save()`.
 *   - When `isDirty` flips to false (a save just landed), cancel any timer.
 *   - On unmount: if still dirty, fire `save()` immediately. This is what
 *     makes editor components keyed by item id safe to swap — the previous
 *     editor flushes its pending change before the next one mounts.
 */
export function useDebouncedAutosave(
  signature: string,
  isDirty: boolean,
  save: () => void,
  delay: number = AUTOSAVE_DELAY_MS
): { lastSavedAt: number | null } {
  const saveRef = useRef(save)
  saveRef.current = save
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  function markSaved() {
    if (mountedRef.current) setLastSavedAt(Date.now())
  }

  useEffect(() => {
    if (!isDirty) return
    const t = window.setTimeout(() => {
      saveRef.current()
      markSaved()
    }, delay)
    return () => clearTimeout(t)
  }, [signature, isDirty, delay])

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        saveRef.current()
        markSaved()
      }
    }
  }, [])

  return { lastSavedAt }
}
