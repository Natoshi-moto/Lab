import { SCHEMA_VERSION } from '../db'
import type {
  AppDesignBuild,
  Document,
  InboxItem,
  Link,
  LinkableType,
  LongformDoc,
  LongformSection,
  Note,
  Pattern,
  Poem,
  Project,
  Prompt,
  PromptPipeline,
  Scrap,
  Tag,
  TagLink,
} from '../types'
import type { FocusRecord } from '../focus/FocusContext'

export type AiBriefContentDepth = 'titles_summaries' | 'structure_only'
export type AiBriefNodeType =
  | 'note'
  | 'document'
  | 'scrap'
  | 'longform'
  | 'pattern'
  | 'pipeline'
  | 'build'
  | 'poem'
  | 'inbox'

export type AiBriefEdgeLabel =
  | 'informs'
  | 'expands into'
  | 'relates to'
  | 'guides tone of'
  | 'powers'
  | 'contradicts'
  | 'depends on'
  | 'derived from'
  | 'proposes_change_to'

export const AI_BRIEF_ALLOWED_NODE_TYPES: AiBriefNodeType[] = [
  'note',
  'document',
  'scrap',
  'longform',
  'pattern',
  'pipeline',
  'build',
  'poem',
  'inbox',
]

export const AI_BRIEF_ALLOWED_EDGE_LABELS: AiBriefEdgeLabel[] = [
  'informs',
  'expands into',
  'relates to',
  'guides tone of',
  'powers',
  'contradicts',
  'depends on',
  'derived from',
  'proposes_change_to',
]

export const AI_BRIEF_SYSTEM_PROMPT = `You are operating on a NEXUS TOPOLOGY EXPORT — a snapshot of a knowledge graph from
Noted, a local-first "private knowledge foundry." In Noted, every piece of knowledge is
a relational object (a "record"), and records are connected into a graph by typed edges.
Your job is to read this graph and ENRICH it: add new nodes and edges that create
connections, surface implicit structure, or extend the user's thinking — WITHOUT
damaging anything that already exists.

== HOW TO READ THE JSON ==
You are given a JSON object with:
- \`nodes\`: existing records. Each has a stable \`id\`, a \`type\`, a \`title\`, and either a
  \`body_or_summary\` (its content, possibly summarized — see \`content_depth\`) plus
  \`tags\`, \`projectIds\`, \`semanticColorId\`, and lineage flags.
- \`edges\`: existing relationships. Each has \`id\`, \`sourceId\`, \`targetId\`, \`label\`,
  \`weight\`, \`direction\`.
- \`semantic_colors\`: the palette. Reference a color only by its \`id\`; never invent hex.
- \`content_depth\`: how much of each record you can see:
    - "full_content"    — you see complete bodies.
    - "titles_summaries" — \`body_or_summary\` is a SUMMARY, not the full text.
    - "structure_only"  — bodies are absent; you see only structure.
- \`root\`: if present, the user's current focal record. Bias your additions toward it.

== ABSOLUTE RULES ==
1. NEVER change, rewrite, shorten, or delete any existing node or edge. Every \`id\` in
   the input is read-only and permanent.
2. NEVER reuse an existing \`id\` for anything new.
3. For every node or edge you create, mint a TEMPORARY id: the prefix "tmp:" followed by
   a short unique slug (e.g. "tmp:insight-1"). Noted assigns real ids on import.
4. Edges you create may connect new→new, new→existing, or existing→new. Reference an
   existing node by its exact existing \`id\`; reference a node you are creating by its
   "tmp:" id.
5. Use only the node \`type\` values listed in \`allowed_node_types\`. If nothing fits, use "note".
6. Use only the edge \`label\` values in \`allowed_edge_labels\`, or a short lowercase verb
   phrase if none fit.
7. Reference colors only by an \`id\` from \`semantic_colors\`. Omit the field if unsure.
8. Do NOT fabricate content for fields you cannot see. If \`content_depth\` is not
   "full_content", never write full bodies back onto existing nodes.
9. Stay within the user's domain. Do not inject external facts you cannot ground in
   the provided graph unless the user prompt explicitly asks you to.

== WHAT GOOD ENRICHMENT LOOKS LIKE ==
- New synthesis nodes that connect two or more existing records.
- Edges that make an implicit relationship explicit.
- Structural nodes (themes, clusters, open questions) that organize existing material.
Prefer a few high-value additions over many shallow ones.

== HOW TO RETURN ==
Return ONE valid JSON object and NOTHING else — no prose, no markdown fences. Use exactly
this shape:

{
  "nexus_topology_version": "1.0.0",
  "responding_to_export_id": "{{EXPORT_ID}}",
  "nodes": [
    {
      "id": "tmp:...",
      "op": "new",
      "type": "<one of the allowed types>",
      "title": "...",
      "body_or_summary": "...",
      "tags": ["..."],
      "projectIds": ["<existing project id if relevant>"],
      "semanticColorId": "<id from semantic_colors, optional>",
      "aiLineage": true
    }
  ],
  "edges": [
    {
      "id": "tmp:...",
      "op": "new",
      "sourceId": "<existing id or tmp: id>",
      "targetId": "<existing id or tmp: id>",
      "label": "...",
      "weight": 0.7,
      "direction": "directed",
      "aiLineage": true
    }
  ],
  "notes_for_user": "1-3 sentence plain-language summary of what you added and why."
}

Every object you output MUST set "op":"new" and "aiLineage":true.
Do not echo back existing nodes or edges.
If you have nothing valuable to add, return empty arrays and say why in \`notes_for_user\`.`

type ExportWorkspace = {
  documents: Document[]
  notes: Note[]
  scraps: Scrap[]
  longformDocs: LongformDoc[]
  sections: LongformSection[]
  patterns: Pattern[]
  pipelines: PromptPipeline[]
  builds: AppDesignBuild[]
  poems: Poem[]
  inboxItems: InboxItem[]
  prompts: Prompt[]
  links: Link[]
  tags: Tag[]
  tagLinks: TagLink[]
  projects: Project[]
}

type AiBriefNode = {
  id: string
  type: AiBriefNodeType
  sourceType: LinkableType | 'prompt'
  title: string
  body_or_summary?: string
  tags: string[]
  projectIds: string[]
  semanticColorId?: string | null
  contentHash: string
  aiLineage: boolean
  isSeedData?: boolean
}

type AiBriefEdge = {
  id: string
  sourceId: string
  targetId: string
  label: string
  weight: number
  direction: 'directed'
  semanticColorId?: string | null
  aiLineage: boolean
}

export type AiBriefExport = {
  nexus_topology_version: '1.0.0'
  export_id: string
  exported_at: string
  workspace_schema_version: number
  content_depth: AiBriefContentDepth
  counts: { nodes: number; edges: number }
  root: Record<string, unknown>
  nodes: AiBriefNode[]
  edges: AiBriefEdge[]
  semantic_colors: []
  allowed_node_types: AiBriefNodeType[]
  allowed_edge_labels: AiBriefEdgeLabel[]
  system_prompt: string
  user_prompt: string
}

export function buildAiBriefExport({
  workspace,
  focus,
  contentDepth = 'titles_summaries',
}: {
  workspace: ExportWorkspace
  focus: FocusRecord
  contentDepth?: AiBriefContentDepth
}): AiBriefExport {
  const nodes = buildNodes(workspace, contentDepth)
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = buildEdges(workspace.links, nodeIds)
  const root = buildRoot(focus, workspace, nodeIds)

  return {
    nexus_topology_version: '1.0.0',
    export_id: createExportId(),
    exported_at: new Date().toISOString(),
    workspace_schema_version: SCHEMA_VERSION,
    content_depth: contentDepth,
    counts: { nodes: nodes.length, edges: edges.length },
    root,
    nodes,
    edges,
    semantic_colors: [],
    allowed_node_types: AI_BRIEF_ALLOWED_NODE_TYPES,
    allowed_edge_labels: AI_BRIEF_ALLOWED_EDGE_LABELS,
    system_prompt: AI_BRIEF_SYSTEM_PROMPT,
    user_prompt: '',
  }
}

function buildNodes(workspace: ExportWorkspace, contentDepth: AiBriefContentDepth): AiBriefNode[] {
  const tagsFor = makeTagsResolver(workspace.tags, workspace.tagLinks)
  const nodes: AiBriefNode[] = []

  for (const record of workspace.documents.filter((r) => !r.deletedAt)) {
    nodes.push(makeNode(record.id, 'document', 'document', record.title, record.body, record.projectId, record, tagsFor, contentDepth))
  }
  for (const record of workspace.notes.filter((r) => !r.deletedAt)) {
    nodes.push(makeNode(record.id, 'note', 'note', record.title, record.body, record.projectId, record, tagsFor, contentDepth))
  }
  for (const record of workspace.scraps.filter((r) => !r.deletedAt)) {
    nodes.push(makeNode(record.id, 'scrap', 'scrap', firstLine(record.body) || record.sourceLabel || 'Untitled scrap', record.body, record.projectId, record, tagsFor, contentDepth))
  }
  for (const record of workspace.longformDocs.filter((r) => !r.deletedAt)) {
    const sectionBodies = workspace.sections
      .filter((section) => section.projectId === record.id)
      .sort((a, b) => a.order - b.order)
      .map((section) => `${section.title}\n${section.body}`)
      .join('\n\n')
    nodes.push(makeNode(record.id, 'longform', 'longform', record.title, sectionBodies || record.title, record.projectId, record, tagsFor, contentDepth))
  }
  for (const section of workspace.sections) {
    nodes.push(makeNode(section.id, 'longform', 'longform-section', section.title, section.body, section.projectId, section, tagsFor, contentDepth))
  }
  for (const record of workspace.patterns.filter((r) => !r.deletedAt)) {
    nodes.push(makeNode(record.id, 'pattern', 'pattern', record.name, [record.description, record.body].filter(Boolean).join('\n\n'), record.projectId, record, tagsFor, contentDepth))
  }
  for (const record of workspace.pipelines.filter((r) => !r.deletedAt)) {
    nodes.push(makeNode(record.id, 'pipeline', 'pipeline', record.name, record.description, record.projectId, record, tagsFor, contentDepth))
  }
  for (const record of workspace.builds.filter((r) => !r.deletedAt)) {
    nodes.push(makeNode(record.id, 'build', 'build', record.name, record.description, record.projectId, record, tagsFor, contentDepth))
  }
  for (const record of workspace.poems.filter((r) => !r.deletedAt)) {
    nodes.push(makeNode(record.id, 'poem', 'poem', record.title, record.body, record.projectId, record, tagsFor, contentDepth))
  }
  for (const record of workspace.inboxItems.filter((r) => !r.deletedAt && !r.doneAt)) {
    nodes.push(makeNode(record.id, 'inbox', 'inbox-item', record.title, record.body, null, record, tagsFor, contentDepth))
  }
  // Prompt records do not have a dedicated allowed node type in the v1.0.0
  // envelope. They are exported as note-like nodes and marked with sourceType.
  for (const record of workspace.prompts.filter((r) => !r.deletedAt)) {
    nodes.push(makeNode(record.id, 'note', 'prompt', record.title, record.body, null, record, tagsFor, contentDepth))
  }

  return nodes
}

function makeNode(
  id: string,
  type: AiBriefNodeType,
  sourceType: LinkableType | 'prompt',
  title: string,
  body: string,
  projectId: string | null | undefined,
  lineage: { aiLineage?: boolean; isSeedData?: boolean },
  tagsFor: (id: string, type: LinkableType | 'prompt') => string[],
  contentDepth: AiBriefContentDepth
): AiBriefNode {
  const textBasis = `${title}\n${body}`
  return {
    id,
    type,
    sourceType,
    title: normalizeWhitespace(title) || '(untitled)',
    ...(contentDepth === 'titles_summaries' ? { body_or_summary: summarize(body) } : {}),
    tags: tagsFor(id, sourceType),
    projectIds: projectId ? [projectId] : [],
    semanticColorId: null,
    contentHash: shortHash(textBasis),
    aiLineage: lineage.aiLineage === true,
    ...(lineage.isSeedData === true ? { isSeedData: true } : {}),
  }
}

function buildEdges(links: Link[], nodeIds: Set<string>): AiBriefEdge[] {
  return links
    .filter((link) => nodeIds.has(link.sourceId) && nodeIds.has(link.targetId))
    .map((link) => ({
      id: link.id,
      sourceId: link.sourceId,
      targetId: link.targetId,
      label: normalizeWhitespace(link.relationshipType || link.label || '') || 'relates to',
      weight: normalizeWeight(link.weight),
      direction: 'directed' as const,
      semanticColorId: link.semanticColorId ?? null,
      aiLineage: link.aiLineage === true,
    }))
}

function buildRoot(focus: FocusRecord, workspace: ExportWorkspace, nodeIds: Set<string>): Record<string, unknown> {
  if (!focus.id || !focus.type || !nodeIds.has(focus.id)) return {}
  const nodeType = mapLinkableType(focus.type)
  if (!nodeType) return {}
  return {
    id: focus.id,
    type: nodeType,
    sourceType: focus.type,
    title: resolveTitle(focus.id, focus.type, workspace),
    origin: focus.origin,
    focusedAt: focus.focusedAt,
  }
}

function mapLinkableType(type: LinkableType): AiBriefNodeType | null {
  switch (type) {
    case 'document': return 'document'
    case 'note': return 'note'
    case 'scrap': return 'scrap'
    case 'longform':
    case 'longform-section': return 'longform'
    case 'pattern': return 'pattern'
    case 'pipeline': return 'pipeline'
    case 'build': return 'build'
    case 'poem': return 'poem'
    case 'inbox-item': return 'inbox'
    case 'prompt': return 'note'
    case 'project': return null
  }
}

function resolveTitle(id: string, type: LinkableType, workspace: ExportWorkspace): string {
  switch (type) {
    case 'document': return workspace.documents.find((r) => r.id === id)?.title || '(untitled)'
    case 'note': return workspace.notes.find((r) => r.id === id)?.title || '(untitled)'
    case 'scrap': return firstLine(workspace.scraps.find((r) => r.id === id)?.body || '') || '(empty scrap)'
    case 'longform': return workspace.longformDocs.find((r) => r.id === id)?.title || '(untitled)'
    case 'longform-section': return workspace.sections.find((r) => r.id === id)?.title || '(untitled section)'
    case 'pattern': return workspace.patterns.find((r) => r.id === id)?.name || '(untitled)'
    case 'pipeline': return workspace.pipelines.find((r) => r.id === id)?.name || '(untitled)'
    case 'build': return workspace.builds.find((r) => r.id === id)?.name || '(untitled)'
    case 'poem': return workspace.poems.find((r) => r.id === id)?.title || '(untitled)'
    case 'inbox-item': return workspace.inboxItems.find((r) => r.id === id)?.title || '(untitled inbox)'
    case 'prompt': return workspace.prompts.find((r) => r.id === id)?.title || '(untitled prompt)'
    case 'project': return workspace.projects.find((r) => r.id === id)?.name || '(untitled project)'
  }
}

function makeTagsResolver(tags: Tag[], tagLinks: TagLink[]) {
  return (id: string, type: LinkableType | 'prompt'): string[] => {
    const linkableType = type === 'prompt' ? 'prompt' : type
    return tagLinks
      .filter((tagLink) => tagLink.targetId === id && tagLink.targetType === linkableType)
      .map((tagLink) => tags.find((tag) => tag.id === tagLink.tagId)?.name)
      .filter((tag): tag is string => Boolean(tag))
  }
}

function summarize(body: string): string {
  const text = normalizeWhitespace(body)
  if (!text) return ''
  return text.length <= 360 ? text : `${text.slice(0, 357)}…`
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function firstLine(value: string): string {
  return value.split('\n').find((line) => line.trim())?.trim() || ''
}

function normalizeWeight(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.5
  if (value < 0) return 0
  if (value > 1) return 1
  return Math.round(value * 100) / 100
}

function shortHash(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function createExportId(): string {
  const cryptoObject = typeof crypto !== 'undefined' ? crypto : undefined
  if (cryptoObject?.randomUUID) return cryptoObject.randomUUID()
  return `ai-brief-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
