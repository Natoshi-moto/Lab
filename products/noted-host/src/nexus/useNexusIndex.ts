import { useMemo } from 'react'
import type { StoreName } from '../db'
import type { Link, LinkableType, Snapshot, Tag } from '../types'
import type { RecentView } from '../util/recentViews'
import type { useWorkspace } from '../context'

type Workspace = ReturnType<typeof useWorkspace>

type AnyRecord = Record<string, any> & { id: string }

type LinkableStore =
  | 'writingDocs'
  | 'poems'
  | 'longformProjects'
  | 'longformSections'
  | 'appDesignBuilds'
  | 'projects'
  | 'patterns'
  | 'promptPipelines'
  | 'inboxItems'
  | 'notes'
  | 'scraps'
  | 'prompts'

const LINKABLE_TO_STORE: Record<LinkableType, LinkableStore> = {
  document: 'writingDocs',
  poem: 'poems',
  longform: 'longformProjects',
  'longform-section': 'longformSections',
  build: 'appDesignBuilds',
  project: 'projects',
  pattern: 'patterns',
  pipeline: 'promptPipelines',
  note: 'notes',
  scrap: 'scraps',
  'inbox-item': 'inboxItems',
  prompt: 'prompts',
}

const STORE_TO_LINKABLE: Partial<Record<StoreName, LinkableType>> = {
  writingDocs: 'document',
  poems: 'poem',
  longformProjects: 'longform',
  longformSections: 'longform-section',
  appDesignBuilds: 'build',
  projects: 'project',
  patterns: 'pattern',
  promptPipelines: 'pipeline',
  inboxItems: 'inbox-item',
  notes: 'note',
  scraps: 'scrap',
  prompts: 'prompt',
}

const CANVAS_KINDS = new Set<LinkableType>([
  'document', 'note', 'poem', 'longform', 'build', 'pattern', 'pipeline', 'scrap',
])

export interface NexusRecordRef {
  id: string
  type: LinkableType
}

export interface NexusRecordInfo extends NexusRecordRef {
  title: string
  summary: string
  store: LinkableStore
  projectId: string | null
  projectName: string | null
  parentLongformId?: string | null
  parentLongformTitle?: string | null
  deleted: boolean
  aiLineage: boolean
  convertedFromId: string | null
  convertedFromType: StoreName | null
  convertedAt: number | null
  updatedAt: number | null
  createdAt: number | null
  unresolved: boolean
}

export interface NexusLinkInfo {
  link: Link
  direction: 'outgoing' | 'incoming'
  target: NexusRecordInfo
  relationship: string
  weight: number | null
  aiLineage: boolean
}

export interface NexusLineageNode {
  id: string
  store: StoreName
  type: LinkableType | null
  title: string
  deleted: boolean
  aiLineage: boolean
  convertedAt: number | null
  unresolved: boolean
}

export interface NexusCanvasPlacement {
  projectId: string
  projectName: string
  nodeId: string
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface NexusSuggestedLink {
  id: string
  target: NexusRecordInfo
  reasons: string[]
  score: number
}

export interface NexusContextResult {
  focus: NexusRecordInfo
  project: { id: string; name: string } | null
  outgoing: NexusLinkInfo[]
  incoming: NexusLinkInfo[]
  tags: Tag[]
  snapshots: Snapshot[]
  lineage: { currentAiLineage: boolean; chain: NexusLineageNode[] }
  canvasPlacements: NexusCanvasPlacement[]
  suggestions: NexusSuggestedLink[]
  isOrphan: boolean
}

function firstLine(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  const line = value.split('\n').map((part) => part.trim()).find(Boolean)
  return line ?? fallback
}

function clip(value: string, length = 96): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean
}

function relationshipLabel(link: Link): string {
  return link.relationshipType?.trim() || link.label?.trim() || 'relates to'
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function collectionForStore(ws: Workspace, store: StoreName): AnyRecord[] {
  switch (store) {
    case 'writingDocs': return ws.documents as AnyRecord[]
    case 'poems': return ws.poems as AnyRecord[]
    case 'longformProjects': return ws.longformDocs as AnyRecord[]
    case 'longformSections': return ws.sections as AnyRecord[]
    case 'appDesignBuilds': return ws.builds as AnyRecord[]
    case 'projects': return ws.projects as AnyRecord[]
    case 'patterns': return ws.patterns as AnyRecord[]
    case 'promptPipelines': return ws.pipelines as AnyRecord[]
    case 'inboxItems': return ws.inboxItems as AnyRecord[]
    case 'notes': return ws.notes as AnyRecord[]
    case 'scraps': return ws.scraps as AnyRecord[]
    case 'prompts': return ws.prompts as AnyRecord[]
    default: return []
  }
}

function collectionForType(ws: Workspace, type: LinkableType): AnyRecord[] {
  return collectionForStore(ws, LINKABLE_TO_STORE[type])
}

function recordTitle(record: AnyRecord | undefined, type: LinkableType, id: string): string {
  if (!record) return `Missing ${type}:${id}`
  if (type === 'scrap') return clip(firstLine(record.body, 'Empty scrap'), 72) || 'Empty scrap'
  if (type === 'inbox-item') return record.title?.trim() || clip(firstLine(record.body, 'Untitled inbox item'), 72) || 'Untitled inbox item'
  if (type === 'project' || type === 'pattern' || type === 'pipeline' || type === 'build') {
    return record.name?.trim() || record.title?.trim() || 'Untitled'
  }
  return record.title?.trim() || record.name?.trim() || 'Untitled'
}

function recordSummary(record: AnyRecord | undefined, type: LinkableType): string {
  if (!record) return 'Record is not currently present in workspace state.'
  if (type === 'project') return clip(record.description ?? '', 160)
  if (type === 'build') return clip(record.description ?? '', 160)
  if (type === 'pattern') return clip(record.description || record.body || '', 160)
  if (type === 'pipeline') return clip(record.description ?? '', 160)
  if (type === 'scrap') return clip(record.body ?? '', 160)
  if (type === 'inbox-item') return clip(record.body ?? '', 160)
  return clip(record.body ?? '', 160)
}

function projectForRecord(ws: Workspace, record: AnyRecord | undefined, type: LinkableType): {
  projectId: string | null
  projectName: string | null
  parentLongformId?: string | null
  parentLongformTitle?: string | null
} {
  if (!record) return { projectId: null, projectName: null }
  if (type === 'project') return { projectId: null, projectName: null }

  if (type === 'longform-section') {
    const doc = ws.longformDocs.find((item) => item.id === record.projectId)
    const project = doc?.projectId ? ws.projects.find((item) => item.id === doc.projectId) : null
    return {
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      parentLongformId: doc?.id ?? record.projectId ?? null,
      parentLongformTitle: doc?.title ?? null,
    }
  }

  const projectId = typeof record.projectId === 'string' ? record.projectId : null
  const project = projectId ? ws.projects.find((item) => item.id === projectId) : null
  return { projectId, projectName: project?.name ?? null }
}

function makeRecordInfo(ws: Workspace, id: string, type: LinkableType): NexusRecordInfo {
  const store = LINKABLE_TO_STORE[type]
  const record = collectionForType(ws, type).find((item) => item.id === id)
  const project = projectForRecord(ws, record, type)
  return {
    id,
    type,
    store,
    title: recordTitle(record, type, id),
    summary: recordSummary(record, type),
    projectId: project.projectId,
    projectName: project.projectName,
    parentLongformId: project.parentLongformId,
    parentLongformTitle: project.parentLongformTitle,
    deleted: Boolean(record?.deletedAt),
    aiLineage: record?.aiLineage === true,
    convertedFromId: typeof record?.convertedFromId === 'string' ? record.convertedFromId : null,
    convertedFromType: typeof record?.convertedFromType === 'string' ? record.convertedFromType as StoreName : null,
    convertedAt: finiteNumber(record?.convertedAt),
    updatedAt: finiteNumber(record?.updatedAt),
    createdAt: finiteNumber(record?.createdAt),
    unresolved: !record,
  }
}

function resolveStoreRecord(ws: Workspace, id: string, store: StoreName): AnyRecord | undefined {
  return collectionForStore(ws, store).find((item) => item.id === id)
}

function makeLineageNode(ws: Workspace, id: string, store: StoreName): NexusLineageNode {
  const type = STORE_TO_LINKABLE[store] ?? null
  const record = resolveStoreRecord(ws, id, store)
  return {
    id,
    store,
    type,
    title: type ? recordTitle(record, type, id) : record?.title ?? record?.name ?? `${store}:${id}`,
    deleted: Boolean(record?.deletedAt),
    aiLineage: record?.aiLineage === true,
    convertedAt: finiteNumber(record?.convertedAt),
    unresolved: !record,
  }
}

function resolveLineage(ws: Workspace, focus: NexusRecordInfo): NexusContextResult['lineage'] {
  const chain: NexusLineageNode[] = []
  const visited = new Set<string>([`${focus.store}:${focus.id}`])
  let nextId = focus.convertedFromId
  let nextStore = focus.convertedFromType

  for (let depth = 0; depth < 6 && nextId && nextStore; depth += 1) {
    const key = `${nextStore}:${nextId}`
    if (visited.has(key)) break
    visited.add(key)
    const node = makeLineageNode(ws, nextId, nextStore)
    chain.push(node)
    const record = resolveStoreRecord(ws, nextId, nextStore)
    if (!record) break
    nextId = typeof record.convertedFromId === 'string' ? record.convertedFromId : null
    nextStore = typeof record.convertedFromType === 'string' ? record.convertedFromType as StoreName : null
  }

  return { currentAiLineage: focus.aiLineage, chain }
}

function getTagsFor(ws: Workspace, id: string, type: LinkableType): Tag[] {
  const tagIds = ws.tagLinks
    .filter((link) => link.targetId === id && link.targetType === type)
    .map((link) => link.tagId)
  return tagIds
    .map((tagId) => ws.tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => Boolean(tag))
}

function getSnapshotsFor(ws: Workspace, id: string, type: LinkableType): Snapshot[] {
  return ws.snapshots
    .filter((snapshot) => snapshot.recordId === id && snapshot.recordType === type)
    .sort((a, b) => b.createdAt - a.createdAt)
}

function readCanvasPositions(projectId: string): Record<string, { x?: number; y?: number; width?: number; height?: number }> {
  try {
    const raw = localStorage.getItem(`verse-studio:canvas:positions:${projectId}`)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function canvasPlacements(ws: Workspace, focus: NexusRecordInfo): NexusCanvasPlacement[] {
  if (!CANVAS_KINDS.has(focus.type)) return []
  const nodeId = `${focus.type}:${focus.id}`
  const placements: NexusCanvasPlacement[] = []
  for (const project of ws.projects) {
    const positions = readCanvasPositions(project.id)
    const pos = positions[nodeId]
    if (!pos) continue
    placements.push({
      projectId: project.id,
      projectName: project.name || 'Untitled project',
      nodeId,
      x: finiteNumber(pos.x) ?? undefined,
      y: finiteNumber(pos.y) ?? undefined,
      width: finiteNumber(pos.width) ?? undefined,
      height: finiteNumber(pos.height) ?? undefined,
    })
  }
  return placements
}

function allRecordInfos(ws: Workspace): NexusRecordInfo[] {
  const out: NexusRecordInfo[] = []
  ;(Object.keys(LINKABLE_TO_STORE) as LinkableType[]).forEach((type) => {
    collectionForType(ws, type).forEach((record) => {
      out.push(makeRecordInfo(ws, record.id, type))
    })
  })
  return out
}

function existingConnectionKey(type: LinkableType, id: string): string {
  return `${type}:${id}`
}

function suggestedLinks(
  ws: Workspace,
  focus: NexusRecordInfo,
  tags: Tag[],
  recentViews: RecentView[]
): NexusSuggestedLink[] {
  const existing = new Set<string>()
  for (const link of ws.links) {
    if (link.sourceId === focus.id && link.sourceType === focus.type) {
      existing.add(existingConnectionKey(link.targetType, link.targetId))
    }
    if (link.targetId === focus.id && link.targetType === focus.type) {
      existing.add(existingConnectionKey(link.sourceType, link.sourceId))
    }
  }

  const focusTagIds = new Set(tags.map((tag) => tag.id))
  const recentRank = new Map<string, number>()
  recentViews.forEach((view, index) => {
    recentRank.set(existingConnectionKey(view.kind as LinkableType, view.id), Math.max(1, 10 - index))
  })

  const candidates: NexusSuggestedLink[] = []
  for (const candidate of allRecordInfos(ws)) {
    const candidateKey = existingConnectionKey(candidate.type, candidate.id)
    if (candidateKey === existingConnectionKey(focus.type, focus.id)) continue
    if (candidate.deleted || candidate.unresolved) continue
    if (existing.has(candidateKey)) continue

    const reasons: string[] = []
    let score = 0
    if (focus.projectId && candidate.projectId && focus.projectId === candidate.projectId) {
      reasons.push(`shared project: ${candidate.projectName || 'project'}`)
      score += 6
    }

    const candidateTagLinks = ws.tagLinks.filter((link) => link.targetId === candidate.id && link.targetType === candidate.type)
    const sharedTags = candidateTagLinks
      .filter((link) => focusTagIds.has(link.tagId))
      .map((link) => ws.tags.find((tag) => tag.id === link.tagId)?.name)
      .filter((name): name is string => Boolean(name))
    if (sharedTags.length > 0) {
      reasons.push(`shared tag${sharedTags.length > 1 ? 's' : ''}: ${sharedTags.slice(0, 3).join(', ')}`)
      score += sharedTags.length * 4
    }

    const recentScore = recentRank.get(candidateKey) ?? 0
    if (recentScore > 0) {
      reasons.push('recent adjacency')
      score += recentScore
    }

    if (score > 0) candidates.push({ id: candidateKey, target: candidate, reasons, score })
  }

  return candidates
    .sort((a, b) => b.score - a.score || (b.target.updatedAt ?? 0) - (a.target.updatedAt ?? 0))
    .slice(0, 8)
}

export function useNexusIndex(ws: Workspace, recentViews: RecentView[]) {
  return useMemo(() => {
    function contextFor(ref: NexusRecordRef | null | undefined): NexusContextResult | null {
      if (!ref?.id || !ref.type) return null
      const focus = makeRecordInfo(ws, ref.id, ref.type)
      const project = focus.projectId
        ? { id: focus.projectId, name: focus.projectName || 'Untitled project' }
        : null
      const outgoing = ws.links
        .filter((link) => link.sourceId === ref.id && link.sourceType === ref.type)
        .map((link): NexusLinkInfo => ({
          link,
          direction: 'outgoing',
          target: makeRecordInfo(ws, link.targetId, link.targetType),
          relationship: relationshipLabel(link),
          weight: finiteNumber(link.weight),
          aiLineage: link.aiLineage === true,
        }))
      const incoming = ws.links
        .filter((link) => link.targetId === ref.id && link.targetType === ref.type)
        .map((link): NexusLinkInfo => ({
          link,
          direction: 'incoming',
          target: makeRecordInfo(ws, link.sourceId, link.sourceType),
          relationship: relationshipLabel(link),
          weight: finiteNumber(link.weight),
          aiLineage: link.aiLineage === true,
        }))
      const tags = getTagsFor(ws, ref.id, ref.type)
      const snapshots = getSnapshotsFor(ws, ref.id, ref.type)
      const placements = canvasPlacements(ws, focus)
      const suggestions = suggestedLinks(ws, focus, tags, recentViews)
      const isOrphan = !project && outgoing.length === 0 && incoming.length === 0 && tags.length === 0 && placements.length === 0

      return {
        focus,
        project,
        outgoing,
        incoming,
        tags,
        snapshots,
        lineage: resolveLineage(ws, focus),
        canvasPlacements: placements,
        suggestions,
        isOrphan,
      }
    }

    return { contextFor, resolveRecord: (id: string, type: LinkableType) => makeRecordInfo(ws, id, type) }
  }, [
    ws.documents, ws.poems, ws.longformDocs, ws.sections, ws.builds,
    ws.projects, ws.patterns, ws.pipelines, ws.inboxItems, ws.notes, ws.scraps, ws.prompts,
    ws.links, ws.tags, ws.tagLinks, ws.snapshots, recentViews,
  ])
}
