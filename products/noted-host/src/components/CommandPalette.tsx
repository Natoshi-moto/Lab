// Sweep 23 — palette refactored onto util/search.ts and extended with a
// link-pick mode triggered by Cmd/Ctrl+L. Pre-Sweep-23 behaviour is preserved.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context'
import { jumpToSelection, type JumpableKind } from '../util/navigate'
import { buildItems, filterItems, type SearchItem, type SearchWorkspace } from '../util/search'
import type { LinkableType } from '../types'

type Mode = 'normal' | 'link-pick'

/**
 * Sweep 23: data-palette-kind preserves the pre-Sweep-23 vocabulary that
 * Sweep 21's Block 6 ordering test depends on:
 *   - 'studio-route' / 'project-route'  → 'route'
 *   - everything else (tag, document, poem, ...) passes through unchanged
 * Without this mapper the refactored buildItems() leaks 'studio-route'
 * into the data attribute and the cumulative verify breaks.
 */
function paletteKindOf(t: string): string {
  if (t === 'studio-route' || t === 'project-route') return 'route'
  return t
}

function nameForRecord(ws: ReturnType<typeof useWorkspace>, id: string, type: LinkableType): string {
  switch (type) {
    case 'document': return ws.documents.find((d) => d.id === id)?.title ?? '(missing)'
    case 'note':     return ws.notes.find((n) => n.id === id)?.title ?? '(missing)'  // Sweep 27
    case 'poem':     return ws.poems.find((p) => p.id === id)?.title ?? '(missing)'
    case 'longform': return ws.longformDocs.find((p) => p.id === id)?.title ?? '(missing)'
    case 'longform-section': return ws.sections.find((s) => s.id === id)?.title ?? '(missing)'
    case 'build':    return ws.builds.find((b) => b.id === id)?.name ?? '(missing)'
    case 'project':  return ws.projects.find((p) => p.id === id)?.name ?? '(missing)'
    case 'pattern':  return ws.patterns.find((p) => p.id === id)?.name ?? '(missing)'
    case 'pipeline': return ws.pipelines.find((p) => p.id === id)?.name ?? '(missing)'
    default: return '(missing)'
  }
}

export function CommandPalette() {
  const navigate = useNavigate()
  const ws = useWorkspace()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('normal')
  const [linkSource, setLinkSource] = useState<{ id: string, type: LinkableType } | null>(null)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for cmd/ctrl+K and cmd/ctrl+L globally.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open && mode === 'normal') {
          setOpen(false)
        } else {
          setMode('normal')
          setLinkSource(null)
          setOpen(true)
        }
      } else if (isMod && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        const active = ws.activeRecord
        if (!active) {
          // No active record means there's no source to link from. Open
          // normal-mode palette as a graceful fallback.
          setMode('normal')
          setLinkSource(null)
          setOpen(true)
          return
        }
        setMode('link-pick')
        setLinkSource(active)
        setOpen(true)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, mode, ws.activeRecord])

  // When opening, focus the input and reset.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      window.setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const items: SearchItem[] = useMemo(() => {
    const w: SearchWorkspace = {
      documents: ws.documents, notes: ws.notes, poems: ws.poems, longformDocs: ws.longformDocs,
      builds: ws.builds, projects: ws.projects, patterns: ws.patterns,
      pipelines: ws.pipelines, inboxItems: ws.inboxItems,
      tags: ws.tags, tagLinks: ws.tagLinks
    }
    return buildItems(w)
  }, [
    ws.documents, ws.notes, ws.poems, ws.longformDocs, ws.builds, ws.projects,
    ws.patterns, ws.pipelines, ws.inboxItems, ws.tags, ws.tagLinks
  ])

  const filtered = useMemo(() => {
    let base = filterItems(items, query)
    if (mode === 'link-pick') {
      // Only record kinds are valid link targets: filter out routes/tags/inbox.
      base = base.filter((it) =>
        it.type !== 'studio-route' && it.type !== 'tag' && it.type !== 'project-route'
      )
    }
    return base
  }, [items, query, mode])

  // Keep activeIdx within bounds.
  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(Math.max(0, filtered.length - 1))
  }, [filtered.length, activeIdx])

  function isSelfLink(it: SearchItem): boolean {
    if (mode !== 'link-pick' || !linkSource) return false
    if (!it.jumpable) return false
    return it.jumpable.id === linkSource.id && (it.type as LinkableType) === linkSource.type
  }

  async function activate(idx: number) {
    const it = filtered[idx]
    if (!it) return
    if (mode === 'link-pick') {
      if (!linkSource || !it.jumpable) return
      if (isSelfLink(it)) return
      await ws.createLink({
        sourceId: linkSource.id, sourceType: linkSource.type,
        targetId: it.jumpable.id, targetType: (it.type as LinkableType)
      })
      setOpen(false)
      return
    }
    // Normal mode: navigate.
    setOpen(false)
    if (it.jumpable) {
      jumpToSelection({ kind: it.jumpable.kind as JumpableKind, id: it.jumpable.id })
      navigate(it.navigateTo)
    } else if (it.id.startsWith('inbox:')) {
      const inboxId = it.id.replace(/^inbox:/, '')
      try { localStorage.setItem('verse-studio:inbox:lastItem', inboxId) } catch {}
      navigate('/inbox')
    } else {
      navigate(it.navigateTo)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activate(activeIdx)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  if (!open) return null

  const linkSourceName = linkSource ? nameForRecord(ws, linkSource.id, linkSource.type) : null
  const isLinkMode = mode === 'link-pick'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      onMouseDown={() => setOpen(false)}
      data-test={isLinkMode ? 'palette-link-mode' : 'palette'}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-md" />
      <div
        className="relative w-full max-w-xl rounded-2xl border border-line n-command-card overflow-hidden n-soft-motion"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isLinkMode && (
          <div
            className="border-b border-line px-3 py-1.5 text-[11px] text-ink-soft bg-surface-2"
            data-test="palette-link-source"
            data-link-source-id={linkSource?.id}
            data-link-source-type={linkSource?.type}
          >
            <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mr-2">
              Linking from
            </span>
            <span className="text-ink">{linkSourceName ?? '(missing)'}</span>
          </div>
        )}
        <div className="border-b border-line px-4 py-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={onKey}
            placeholder={
              isLinkMode
                ? 'Pick a record to link to…'
                : 'Type to search routes, tags, docs, poems, longform, builds, projects, patterns, pipelines…'
            }
            className="title-input w-full text-sm text-ink placeholder:text-ink-faint"
            data-test="palette-input"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-ink-faint italic">No matches.</div>
          )}
          {filtered.map((it, i) => {
            const self = isSelfLink(it)
            return (
              <button
                key={it.id}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => activate(i)}
                disabled={self}
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-3 ${
                  self
                    ? 'opacity-40 cursor-not-allowed'
                    : i === activeIdx
                      ? 'bg-accent/10 text-ink'
                      : 'text-ink-soft hover:bg-surface-2'
                }`}
                data-test="palette-item"
                data-palette-kind={paletteKindOf(it.type)}
                data-active={i === activeIdx ? 'true' : 'false'}
                title={self ? 'Cannot link to self' : undefined}
              >
                <span className="text-[10px] uppercase tracking-widest text-ink-faint w-14 shrink-0">
                  {self ? 'self' : it.detail}
                </span>
                <span className="truncate">{it.label}</span>
              </button>
            )
          })}
        </div>
        <div className="border-t border-line px-4 py-2 flex items-center justify-between text-[10px] text-ink-faint uppercase tracking-widest bg-surface/45">
          <span>↑↓ navigate · ↵ {isLinkMode ? 'link' : 'open'} · esc close</span>
          <span data-test="palette-count">{filtered.length}</span>
        </div>
      </div>
    </div>
  )
}
