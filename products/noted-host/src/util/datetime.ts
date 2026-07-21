// Sweep 23.1 — datetime-local input binding utilities.
//
// The pre-23.1 InboxItemEditor used `new Date(ms).toISOString().slice(0, 16)`
// to format a UTC ms timestamp for an <input type="datetime-local">.
// toISOString returns UTC time in ISO format; the input expects LOCAL wall-
// clock time. The result was that a user in a positive UTC offset (e.g.
// London BST) would type "02:00", store it correctly as the corresponding
// UTC ms, but on next render see "01:00" — and any further edit would
// drift the value.
//
// These two pure functions replace that binding with a local-time formatter
// and a local-time parser. The native `new Date(string)` parser interprets
// "YYYY-MM-DDTHH:MM" as local time, so the parse direction is fine; only
// the format direction needed fixing.

/**
 * Format a UTC ms timestamp as a local-time string suitable for
 * <input type="datetime-local"> bindings.
 *
 * Output: "YYYY-MM-DDTHH:MM" in the user's local timezone.
 *
 * Returns empty string if ms is null/undefined/non-finite.
 */
export function msToLocalDatetimeInputValue(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return ''
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear() +
    '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate()) +
    'T' + pad(d.getHours()) +
    ':' + pad(d.getMinutes())
  )
}

/**
 * Parse a <input type="datetime-local"> string back to UTC ms.
 *
 * Input: "YYYY-MM-DDTHH:MM" interpreted as LOCAL time.
 * Returns NaN for empty/invalid input — caller should treat NaN as
 * "clear the dueAt field".
 */
export function localDatetimeInputValueToMs(s: string): number {
  if (!s) return NaN
  const ms = new Date(s).getTime()  // Native parser interprets as local
  return Number.isFinite(ms) ? ms : NaN
}
