import { APP_NAME, APP_VERSION } from '../appMeta'

interface AppMarkProps {
  compact?: boolean
  showVersion?: boolean
}

// Sweep 60 — AppMark adopts the launcher icon's hub-and-spoke geometry
// (icons/noted-v0.01.svg). 512-px source coords are scaled to the existing
// 64-px viewBox: center hub at (32, 29), three outer nodes at top (32, 10),
// lower-left (15, 40), lower-right (49, 40). Stroke/fill use currentColor so
// the existing `text-accent` wrapper drives theme color.
export function AppMark({ compact = false, showVersion = true }: AppMarkProps) {
  const sizeClass = compact ? 'w-7 h-7' : 'w-9 h-9'
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0" aria-label={`${APP_NAME} ${APP_VERSION}`}>
      <div className={`${sizeClass} text-accent flex items-center justify-center rounded-xl bg-accent/5 ring-1 ring-accent/10`}>
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" className="opacity-[0.92] n-app-mark-orbit">
          {/* Faint mesh triangle between outer nodes (decorative) */}
          <polygon points="32,10 15,40 49,40" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.22" strokeLinejoin="round" />
          {/* Spokes: hub → each outer node */}
          <line x1="32" y1="29" x2="32" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <line x1="32" y1="29" x2="15" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <line x1="32" y1="29" x2="49" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          {/* Center hub: outer ring + filled core */}
          <circle cx="32" cy="29" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="32" cy="29" r="2.8" fill="currentColor" />
          {/* Outer nodes: outer ring + filled core */}
          <circle cx="32" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="32" cy="10" r="1.6" fill="currentColor" />
          <circle cx="15" cy="40" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="40" r="1.6" fill="currentColor" />
          <circle cx="49" cy="40" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="49" cy="40" r="1.6" fill="currentColor" />
        </svg>
      </div>
      {showVersion && <div className="text-[8px] leading-none tracking-[0.18em] text-ink-faint uppercase">{APP_VERSION}</div>}
    </div>
  )
}
