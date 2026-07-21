// Sweep 23 — always-on TopBar search input. Same haystack as the palette,
// plus a small REPL grammar:
//   >link <q>     create a link from active record (mirrors Cmd+L flow)
//   >tag <name>   attach a tag to the active record (creates if missing)
//   >related      jump to /atlas
//   >snap <label> create a snapshot of the active record
//
// Hidden when the screen is in focus mode (TopBar already unmounts).

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context'
import { jumpToSelection, type JumpableKind } from '../util/navigate'
import { buildItems, filterItems, type SearchItem, type SearchWorkspace } from '../util/search'
import type { LinkableType } from '../types'

interface ReplCmd {
  kind: 'link' | 'tag' | 'related' | 'snap' | 'unknown'
  arg: string
}

function parseRepl(q: string): ReplCmd | null {
  if (!q.startsWith('>')) return null
  const rest = q.slice(1).trim()
  if (rest === '') return { kind: 'unknown', arg: '' }
  const space = rest.indexOf(' ')
  const head = (space === -1 ? rest : rest.slice(0, space)).toLowerCase()
  const arg  = space === -1 ? '' : rest.slice(space + 1).trim()
  if (head === 'link') return { kind: 'link', arg }
  if (head === 'tag') return { kind: 'tag', arg }
  if (head === 'related') return { kind: 'related', arg: '' }
  if (head === 'snap') return { kind: 'snap', arg }
  return { kind: 'unknown', arg: rest }
}

export function GlobalSearchBar(): JSX.Element {
  const ws = useWorkspace()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimeoutRef = useRef<number | null>(null)


  const items = useMemo(() => {
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

  const repl = parseRepl(query)
  const filtered: SearchItem[] = useMemo(() => {
    if (repl) return []
    return filterItems(items, query)
  }, [items, query, repl])

  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(Math.max(0, filtered.length - 1))
  }, [filtered.length, activeIdx])

  const showDropdown = focused && (query.length > 0)

  function activate(idx: number) {
    const it = filtered[idx]
    if (!it) return
    setQuery('')
    setFocused(false)
    inputRef.current?.blur()
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

  async function executeRepl(cmd: ReplCmd) {
    const active = ws.activeRecord
    if (cmd.kind === 'related') {
      navigate('/atlas')
    } else if (cmd.kind === 'tag' && cmd.arg) {
      if (!active) return
      // Find or create tag.
      const trimmed = cmd.arg.trim()
      const existing = ws.tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
      const tag = existing ?? await ws.createTag(trimmed)
      await ws.tagItem({
        tagId: tag.id,
        targetId: active.id,
        targetType: active.type as LinkableType
      })
    } else if (cmd.kind === 'link' && cmd.arg) {
      if (!active) return
      // Pick the best filtered match excluding routes/tags/inbox.
      const candidates = filterItems(items, cmd.arg).filter((it) =>
        it.type !== 'studio-route' && it.type !== 'tag' && it.type !== 'project-route'
      )
      const best = candidates[0]
      if (!best || !best.jumpable) return
      if (best.jumpable.id === active.id && (best.type as LinkableType) === active.type) return
      await ws.createLink({
        sourceId: active.id, sourceType: active.type as LinkableType,
        targetId: best.jumpable.id, targetType: best.type as LinkableType
      })
    } else if (cmd.kind === 'snap') {
      if (!active) return
      const label = cmd.arg.trim() || new Date().toLocaleString()
      // Serialize the editable fields of the active record. Pattern-match
      // Snapshots.tsx's per-type handling.
      let data: any = null
      switch (active.type) {
        case 'document': {
          const r = ws.documents.find((d) => d.id === active.id)
          if (r) data = { title: r.title, body: r.body }
          break
        }
        case 'poem': {
          const r = ws.poems.find((p) => p.id === active.id)
          if (r) data = { title: r.title, body: r.body }
          break
        }
        case 'longform': {
          const r = ws.longformDocs.find((p) => p.id === active.id)
          if (r) data = { title: r.title }
          break
        }
        case 'build': {
          const r = ws.builds.find((b) => b.id === active.id)
          if (r) data = { name: r.name, description: r.description, status: r.status, platform: r.platform }
          break
        }
        case 'pipeline': {
          const r = ws.pipelines.find((p) => p.id === active.id)
          if (r) data = { name: r.name, description: r.description }
          break
        }
        case 'project': {
          const r = ws.projects.find((p) => p.id === active.id)
          if (r) data = { name: r.name }
          break
        }
        default: break
      }
      if (data == null) return
      await ws.createSnapshot({
        recordId: active.id,
        recordType: active.type as LinkableType,
        label,
        data: JSON.stringify(data)
      })
    }
    setQuery('')
    setFocused(false)
    inputRef.current?.blur()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setQuery('')
      setFocused(false)
      inputRef.current?.blur()
      return
    }
    if (repl) {
      if (e.key === 'Enter') {
        e.preventDefault()
        executeRepl(repl)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activate(activeIdx)
    }
  }

  return (
    <div className="relative" style={{ width: 360 }}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActiveIdx(0) }}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (blurTimeoutRef.current != null) {
            window.clearTimeout(blurTimeoutRef.current)
            blurTimeoutRef.current = null
          }
          setFocused(true)
        }}
        onBlur={() => {
          if (blurTimeoutRef.current != null) window.clearTimeout(blurTimeoutRef.current)
          blurTimeoutRef.current = window.setTimeout(() => {
            blurTimeoutRef.current = null
            setFocused(false)
          }, 120)
        }}
        placeholder="Search… (> for commands)"
        className="w-full text-xs text-ink bg-surface-2 border border-line rounded px-2 py-1 focus:outline-none focus:border-accent"
        data-test="global-search"
      />
      {showDropdown && (
        <div
          className="absolute top-full mt-1 left-0 right-0 z-40 bg-surface border border-line rounded shadow-md max-h-[60vh] overflow-y-auto"
          data-test="global-search-dropdown"
        >
          {repl ? (
            <div className="px-2 py-1.5 text-[11px] text-ink-soft" data-test="global-search-repl-hint">
              {repl.kind === 'link'    && <span><span className="text-ink-faint uppercase tracking-widest text-[10px] mr-2">link</span>Best match for "{repl.arg}" → press Enter</span>}
              {repl.kind === 'tag'     && <span><span className="text-ink-faint uppercase tracking-widest text-[10px] mr-2">tag</span>Attach "{repl.arg}" to active record → press Enter</span>}
              {repl.kind === 'related' && <span><span className="text-ink-faint uppercase tracking-widest text-[10px] mr-2">related</span>Open Atlas → press Enter</span>}
              {repl.kind === 'snap'    && <span><span className="text-ink-faint uppercase tracking-widest text-[10px] mr-2">snap</span>Snapshot active record{repl.arg ? `: "${repl.arg}"` : ''} → press Enter</span>}
              {repl.kind === 'unknown' && <span className="italic text-ink-faint">Unknown command. Try: &gt;link, &gt;tag, &gt;related, &gt;snap</span>}
            </div>
          ) : (
            <>
              {filtered.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-ink-faint italic">No matches.</div>
              )}
              {filtered.slice(0, 12).map((it, i) => (
                <button
                  key={it.id}
                  onMouseDown={(e) => { e.preventDefault(); activate(i) }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 ${
                    i === activeIdx ? 'bg-surface-3 text-ink' : 'text-ink-soft hover:bg-surface-2'
                  }`}
                  data-test="global-search-result"
                  data-search-result-kind={it.type}
                >
                  <span className="text-[10px] uppercase tracking-widest text-ink-faint w-14 shrink-0">
                    {it.detail}
                  </span>
                  <span className="truncate">{it.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
