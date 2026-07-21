import type { JumpableKind } from './navigate'

const STALE_DAYS = 30
const HOMELESS_INBOX_DAYS = 7
const now = Date.now()

interface LinkLike {
  sourceId: string
  targetId: string
}

interface TagLinkLike {
  tagId: string
  targetId: string
}

interface RecordLike {
  id: string
  title?: string
  name?: string
  body?: string
  projectId?: string | null
  createdAt?: number
  updatedAt?: number
  deletedAt?: number
  aiLineage?: unknown
}

interface InboxItemLike extends RecordLike {
  doneAt?: number
  dismissedAt?: number
}

export interface HealthWorkspaceInput {
  links: LinkLike[]
  tagLinks: TagLinkLike[]
  notes: RecordLike[]
  scraps: RecordLike[]
  inboxItems: InboxItemLike[]
  tags: RecordLike[]
  documents: RecordLike[]
  poems: RecordLike[]
  longformDocs: RecordLike[]
  builds: RecordLike[]
  patterns: RecordLike[]
  pipelines: RecordLike[]
  prompts: RecordLike[]
  projects: RecordLike[]
}

export type HealthSignalOpenTarget =
  | { type: 'jump'; kind: JumpableKind; id: string }
  | { type: 'route'; route: string }

export interface HealthSignal {
  id: string
  label: string
  description: string
  count: number
  example: string | null
  openTarget: HealthSignalOpenTarget | null
}

function truncate(s: string, n = 48): string {
  const first = s.split('\n').find(l => l.trim()) ?? s
  return first.length > n ? first.slice(0, n) + '…' : first || '(empty)'
}

export function computeWorkspaceHealthSignals(ws: HealthWorkspaceInput): HealthSignal[] {
  const linkedIds = new Set<string>()
  const taggedIds = new Set<string>()
  for (const l of ws.links) { linkedIds.add(l.sourceId); linkedIds.add(l.targetId) }
  for (const tl of ws.tagLinks) taggedIds.add(tl.targetId)

  const orphanNotes = ws.notes.filter(
    n => !n.deletedAt && !n.projectId && !linkedIds.has(n.id) && !taggedIds.has(n.id)
  )
  const orphanScraps = ws.scraps.filter(s => !s.deletedAt && !s.projectId)
  const homelessInbox = ws.inboxItems.filter(
    i => !i.deletedAt && !i.doneAt && !i.dismissedAt
      && (now - (i.createdAt ?? now)) > HOMELESS_INBOX_DAYS * 86_400_000
  )
  const usedTagIds = new Set(ws.tagLinks.map(tl => tl.tagId))
  const unusedTags = ws.tags.filter(t => !usedTagIds.has(t.id))
  const unprojectdDocs = ws.documents.filter(d => !d.deletedAt && !d.projectId)

  const usedProjectIds = new Set<string>()
  for (const r of [...ws.documents, ...ws.poems, ...ws.notes, ...ws.longformDocs,
                    ...ws.builds, ...ws.patterns, ...ws.pipelines, ...ws.prompts]) {
    const pid = r.projectId
    if (pid) usedProjectIds.add(pid)
  }
  for (const s of ws.scraps) { if (s.projectId) usedProjectIds.add(s.projectId) }
  const emptyProjects = ws.projects.filter(p => !usedProjectIds.has(p.id))

  const stalePipelines = ws.pipelines.filter(
    p => !p.deletedAt && (now - (p.updatedAt ?? p.createdAt ?? now)) > STALE_DAYS * 86_400_000
  )
  const aiRecords = [
    ...ws.documents.filter(r => !r.deletedAt && r.aiLineage),
    ...ws.notes.filter(r => !r.deletedAt && r.aiLineage),
    ...ws.scraps.filter(r => !r.deletedAt && r.aiLineage),
  ]

  return [
    {
      id: 'orphan-notes',
      label: 'Orphan notes',
      description: 'Notes with no project, links, or tags.',
      count: orphanNotes.length,
      example: orphanNotes[0] ? truncate(orphanNotes[0].title || orphanNotes[0].body || '') : null,
      openTarget: orphanNotes[0] ? { type: 'jump', kind: 'note', id: orphanNotes[0].id } : null,
    },
    {
      id: 'orphan-scraps',
      label: 'Unassigned scraps',
      description: 'Scraps not attached to any project.',
      count: orphanScraps.length,
      example: orphanScraps[0] ? truncate(orphanScraps[0].body || '') : null,
      openTarget: orphanScraps[0] ? { type: 'route', route: '/projects' } : null,
    },
    {
      id: 'homeless-inbox',
      label: 'Aging inbox items',
      description: `Inbox items older than ${HOMELESS_INBOX_DAYS} days with no action.`,
      count: homelessInbox.length,
      example: homelessInbox[0] ? truncate(homelessInbox[0].title || '') : null,
      openTarget: homelessInbox[0] ? { type: 'route', route: '/inbox' } : null,
    },
    {
      id: 'unused-tags',
      label: 'Unused tags',
      description: 'Tags with no records attached.',
      count: unusedTags.length,
      example: unusedTags[0] ? truncate(unusedTags[0].name || '') : null,
      openTarget: unusedTags[0] ? { type: 'route', route: '/settings' } : null,
    },
    {
      id: 'unprojecttd-docs',
      label: 'Documents without a project',
      description: 'Writing documents not assigned to any project.',
      count: unprojectdDocs.length,
      example: unprojectdDocs[0] ? truncate(unprojectdDocs[0].title || '') : null,
      openTarget: unprojectdDocs[0] ? { type: 'jump', kind: 'document', id: unprojectdDocs[0].id } : null,
    },
    {
      id: 'empty-projects',
      label: 'Empty projects',
      description: 'Projects with no records attached.',
      count: emptyProjects.length,
      example: emptyProjects[0] ? truncate(emptyProjects[0].name || '') : null,
      openTarget: emptyProjects[0] ? { type: 'jump', kind: 'project', id: emptyProjects[0].id } : null,
    },
    {
      id: 'stale-pipelines',
      label: 'Stale pipelines',
      description: `Pipelines not updated in ${STALE_DAYS}+ days.`,
      count: stalePipelines.length,
      example: stalePipelines[0] ? truncate(stalePipelines[0].name || '') : null,
      openTarget: stalePipelines[0] ? { type: 'jump', kind: 'pipeline', id: stalePipelines[0].id } : null,
    },
    {
      id: 'ai-lineage',
      label: 'AI-lineage records',
      description: 'Records marked as AI-created, ready for review.',
      count: aiRecords.length,
      example: aiRecords[0] ? truncate(aiRecords[0].title ?? aiRecords[0].body ?? '') : null,
      openTarget: aiRecords[0] ? { type: 'route', route: '/projects' } : null,
    },
  ]
}
