import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../context'

interface Props {
  value: string | undefined
  onChange: (next: string | undefined) => void
  className?: string
}

const COLOUR_MAP: Record<string, string> = {
  tan:   '#c8b395',
  sage:  '#9aa888',
  mauve: '#a89aac',
  slate: '#8896a0',
}

export function ProjectPicker({ value, onChange, className }: Props): JSX.Element {
  const ws = useWorkspace()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const projects = [...ws.projects].sort((a, b) => b.updatedAt - a.updatedAt)
  const current = projects.find((p) => p.id === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function handleSelect(id: string | undefined) {
    onChange(id)
    setOpen(false)
  }

  const colourDot = current?.colour ? COLOUR_MAP[current.colour] : null

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={
          current
            ? 'text-xs rounded px-2 py-1 border border-accent text-ink bg-surface-2 flex items-center gap-1.5'
            : 'text-xs rounded px-2 py-1 border border-line text-ink-soft hover:text-ink hover:bg-surface-2 flex items-center gap-1.5'
        }
        data-test="project-picker"
        data-current-project={value ?? ''}
      >
        {colourDot && (
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: colourDot }}
          />
        )}
        {current ? (current.name || 'Untitled') : 'no project'}
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 left-0 z-10 bg-surface border border-line rounded shadow-md min-w-[180px]"
          data-test="project-picker-menu"
        >
          <button
            onClick={() => handleSelect(undefined)}
            className="w-full text-left text-xs px-3 py-2 text-ink-soft hover:text-ink hover:bg-surface-2 flex items-center gap-2"
            data-test="project-picker-option"
            data-project-id="none"
          >
            <span className="inline-block w-2 h-2 shrink-0" />
            (none)
          </button>
          {projects.map((p) => {
            const dot = p.colour ? COLOUR_MAP[p.colour] : null
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`w-full text-left text-xs px-3 py-2 hover:bg-surface-2 flex items-center gap-2 ${
                  p.id === value ? 'text-ink' : 'text-ink-soft hover:text-ink'
                }`}
                data-test="project-picker-option"
                data-project-id={p.id}
              >
                {dot ? (
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dot }}
                  />
                ) : (
                  <span className="inline-block w-2 h-2 shrink-0" />
                )}
                {p.name || 'Untitled'}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
