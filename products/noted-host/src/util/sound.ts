// Sweep 23 — synthesized notification ding via Web Audio API.
// No external assets, no base64 — fits the single-file invariant.

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (audioCtx) return audioCtx
  try {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
    return audioCtx
  } catch { return null }
}

/** Best-effort ding. Silent if AudioContext is unavailable or suspended. */
export function playDing(): void {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
    if (ctx.state === 'suspended') return
  }
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Best-effort; never throw out of an audio path.
  }
}

/**
 * Browsers gate Web Audio behind a user gesture. Attach a one-shot pointer
 * listener that resumes the context on first interaction; after that the
 * ding is allowed to play.
 */
export function attachAudioGestureUnlock(): () => void {
  function handler() {
    const ctx = getCtx()
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
    document.removeEventListener('pointerdown', handler)
  }
  document.addEventListener('pointerdown', handler, { once: true })
  return () => document.removeEventListener('pointerdown', handler)
}
