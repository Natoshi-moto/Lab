// Sweep 23 — shared search utilities.
//
// Extracted from CommandPalette so the always-on TopBar GlobalSearchBar
// uses the same haystack and the same matcher. Keep palette behaviour
// identical to the pre-Sweep-23 implementation.

import type { LinkableType } from '../types'
import type { JumpableKind } from './navigate'

export interface SearchItem {
  id: string
  type: LinkableType | 'tag' | 'project-route' | 'studio-route'
  label: string
  detail?: string
  /** hash-router path */
  navigateTo: string
  /** lowercased, joined match string */
  haystack: string
  /** Optional jumpable kind/id pair for record items */
  jumpable?: { kind: JumpableKind, id: string }
}

/**
 * Minimal workspace shape required by buildItems. Defined as a structural
 * type so the function isn't coupled to context.tsx's API interface.
 */
export interface SearchWorkspace {
  documents:    { id: string, title: string, projectId?: string, deletedAt?: number }[]
  notes:        { id: string, title: string, projectId?: string, deletedAt?: number }[]  // Sweep 27
  poems:        { id: string, title: string, projectId?: string, deletedAt?: number }[]
  longformDocs: { id: string, title: string, projectId?: string, deletedAt?: number }[]
  builds:       { id: string, name: string,  projectId?: string, deletedAt?: number }[]
  projects:     { id: string, name: string }[]
  patterns:     { id: string, name: string,  projectId?: string, deletedAt?: number }[]
  pipelines:    { id: string, name: string,  projectId?: string, deletedAt?: number }[]
  inboxItems:   { id: string, title: string, body: string, deletedAt?: number, doneAt?: number, dismissedAt?: number }[]
  tags:         { id: string, name: string }[]
  tagLinks:     { tagId: string, targetId: string, targetType: LinkableType }[]
}

const ROUTES: { path: string, label: string }[] = [
  { path: '/inbox',       label: 'Inbox' },
  { path: '/writing',     label: 'Writing Studio' },
  { path: '/notes',       label: 'Notes' },  // Sweep 27
  { path: '/poetry',      label: 'Poetry Studio' },
  { path: '/longform',    label: 'Longform Studio' },
  { path: '/app-design',  label: 'App-Design Studio' },
  { path: '/prompts',     label: 'Prompt Studio' },
  { path: '/canvas',      label: 'Canvas' },
  { path: '/atlas',       label: 'Atlas' },
  { path: '/projects',    label: 'Projects' },
  { path: '/library',     label: 'Feature Library' },
  { path: '/shelf',       label: 'Shelf' },
  { path: '/settings',    label: 'Settings' }
]

function buildHaystack(parts: Array<string | undefined>): string {
  return parts
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .join(' ')
    .toLowerCase()
}

/**
 * Build the canonical search-item set. Construction order is significant:
 * routes first, then tags, then records — matches the pre-Sweep-23
 * Command Palette ordering.
 */
export function buildItems(ws: SearchWorkspace): SearchItem[] {
  const out: SearchItem[] = []

  // Lookup tables for record-side haystack enrichment.
  const projectNameById: Record<string, string> = {}
  for (const p of ws.projects) projectNameById[p.id] = p.name
  const tagById: Record<string, string> = {}
  for (const t of ws.tags) tagById[t.id] = t.name
  const tagNamesByTarget: Record<string, string[]> = {}
  for (const tl of ws.tagLinks) {
    const name = tagById[tl.tagId]
    if (!name) continue
    const key = `${tl.targetType}:${tl.targetId}`
    if (!tagNamesByTarget[key]) tagNamesByTarget[key] = []
    tagNamesByTarget[key].push(name)
  }

  // 1. Routes.
  for (const r of ROUTES) {
    out.push({
      id: 'route:' + r.path,
      type: 'studio-route',
      label: r.label,
      detail: 'go to',
      navigateTo: r.path,
      haystack: buildHaystack([r.label, 'go to'])
    })
  }

  // 2. Tags. Picking a tag jumps to /settings (TagManager lives there).
  for (const t of ws.tags) {
    out.push({
      id: 'tag:' + t.id,
      type: 'tag',
      label: t.name,
      detail: 'tag',
      navigateTo: '/settings',
      haystack: buildHaystack([t.name, 'tag'])
    })
  }

  // 3. Records. Soft-deleted are excluded.
  function pushJumpable(
    kind: JumpableKind,
    id: string,
    label: string,
    detail: string,
    type: LinkableType,
    route: string,
    projectId?: string
  ) {
    const tagNames = tagNamesByTarget[`${type}:${id}`] ?? []
    const projectName = projectId ? projectNameById[projectId] : undefined
    out.push({
      id: kind + ':' + id,
      type,
      label: label || '(untitled)',
      detail,
      navigateTo: route,
      haystack: buildHaystack([label || '(untitled)', detail, ...tagNames, projectName]),
      jumpable: { kind, id }
    })
  }

  for (const d of ws.documents)    { if (d.deletedAt !== undefined) continue; pushJumpable('document',  d.id, d.title, 'open doc',      'document',  '/writing',    d.projectId) }
  for (const n of ws.notes)        { if (n.deletedAt !== undefined) continue; pushJumpable('note',      n.id, n.title, 'open note',     'note',      '/notes',      n.projectId) }  // Sweep 27
  for (const p of ws.poems)        { if (p.deletedAt !== undefined) continue; pushJumpable('poem',      p.id, p.title, 'open poem',     'poem',      '/poetry',     p.projectId) }
  for (const p of ws.longformDocs) { if (p.deletedAt !== undefined) continue; pushJumpable('longform',  p.id, p.title, 'open longform', 'longform',  '/longform',   p.projectId) }
  for (const b of ws.builds)       { if (b.deletedAt !== undefined) continue; pushJumpable('build',     b.id, b.name,  'open build',    'build',     '/app-design', b.projectId) }
  for (const p of ws.projects)     pushJumpable('project',  p.id, p.name,  'open project',  'project', '/projects')
  for (const p of ws.patterns)     { if (p.deletedAt !== undefined) continue; pushJumpable('pattern',   p.id, p.name,  'open pattern',  'pattern',   '/library',    p.projectId) }
  for (const p of ws.pipelines)    { if (p.deletedAt !== undefined) continue; pushJumpable('pipeline',  p.id, p.name,  'open pipeline', 'pipeline',  '/prompts',    p.projectId) }

  // Inbox items — visible to typed search ("welcome…"). Soft-deleted /
  // dismissed / done items are filtered out. Click navigates to /inbox
  // and selects the item via the lastItem localStorage key.
  for (const it of ws.inboxItems) {
    if (it.deletedAt !== undefined) continue
    if (it.dismissedAt !== undefined) continue
    if (it.doneAt !== undefined) continue
    out.push({
      id: 'inbox:' + it.id,
      type: 'studio-route',
      label: it.title || '(untitled inbox)',
      detail: 'inbox',
      navigateTo: '/inbox',
      haystack: buildHaystack([it.title, it.body, 'inbox'])
    })
  }

  return out
}

export function filterItems(items: SearchItem[], q: string): SearchItem[] {
  const trimmed = q.trim().toLowerCase()
  if (!trimmed) return items
  return items.filter((it) => it.haystack.includes(trimmed))
}
