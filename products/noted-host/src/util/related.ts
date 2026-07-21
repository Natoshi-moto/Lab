// Sweep 23 — heuristic "you might also want this" scoring.
//
// Pure-functional, no React, easy to memoize from a component. Computes
// scores against a flattened workspace shape passed in by the caller; this
// keeps the function trivially testable and decouples it from the concrete
// State type.

import type { LinkableType } from '../types'

export interface RelatedScore {
  targetId: string
  targetType: LinkableType
  score: number
  reasons: string[]
}

export interface RelatedWorkspace {
  documents:    { id: string, title: string, body: string, projectId?: string, updatedAt: number, deletedAt?: number }[]
  poems:        { id: string, title: string, body: string, projectId?: string, updatedAt: number, deletedAt?: number }[]
  longformDocs: { id: string, title: string,             projectId?: string, updatedAt: number, deletedAt?: number }[]
  builds:       { id: string, name: string, description: string, projectId?: string, updatedAt: number, deletedAt?: number }[]
  patterns:     { id: string, name: string, description: string, body: string, projectId?: string, updatedAt: number, deletedAt?: number }[]
  pipelines:    { id: string, name: string, description: string, projectId?: string, updatedAt: number, deletedAt?: number }[]
  links:        { sourceId: string, sourceType: LinkableType, targetId: string, targetType: LinkableType }[]
  tagLinks:     { tagId: string, targetId: string, targetType: LinkableType }[]
}

interface CandidateRow {
  id: string
  type: LinkableType
  text: string         // title+body/description, lowercased
  projectId?: string
  updatedAt: number
}

function tokenize(s: string): Set<string> {
  const out = new Set<string>()
  for (const raw of s.split(/[^a-z0-9]+/)) {
    if (raw.length > 4) out.add(raw)
  }
  return out
}

function flatten(ws: RelatedWorkspace): CandidateRow[] {
  const rows: CandidateRow[] = []
  for (const d of ws.documents) {
    if (d.deletedAt != null) continue
    rows.push({
      id: d.id, type: 'document',
      text: ((d.title || '') + ' ' + (d.body || '')).toLowerCase(),
      projectId: d.projectId, updatedAt: d.updatedAt
    })
  }
  for (const p of ws.poems) {
    if (p.deletedAt != null) continue
    rows.push({
      id: p.id, type: 'poem',
      text: ((p.title || '') + ' ' + (p.body || '')).toLowerCase(),
      projectId: p.projectId, updatedAt: p.updatedAt
    })
  }
  for (const lf of ws.longformDocs) {
    if (lf.deletedAt != null) continue
    rows.push({
      id: lf.id, type: 'longform',
      text: (lf.title || '').toLowerCase(),
      projectId: lf.projectId, updatedAt: lf.updatedAt
    })
  }
  for (const b of ws.builds) {
    if (b.deletedAt != null) continue
    rows.push({
      id: b.id, type: 'build',
      text: ((b.name || '') + ' ' + (b.description || '')).toLowerCase(),
      projectId: b.projectId, updatedAt: b.updatedAt
    })
  }
  for (const pat of ws.patterns) {
    if (pat.deletedAt != null) continue
    rows.push({
      id: pat.id, type: 'pattern',
      text: ((pat.name || '') + ' ' + (pat.description || '') + ' ' + (pat.body || '')).toLowerCase(),
      projectId: pat.projectId, updatedAt: pat.updatedAt
    })
  }
  for (const pip of ws.pipelines) {
    if (pip.deletedAt != null) continue
    rows.push({
      id: pip.id, type: 'pipeline',
      text: ((pip.name || '') + ' ' + (pip.description || '')).toLowerCase(),
      projectId: pip.projectId, updatedAt: pip.updatedAt
    })
  }
  return rows
}

/**
 * Score related records for a given (recordId, recordType).
 *
 * Weights (FIXED — do not tune):
 *   - Explicit Link in either direction:    +5.0
 *   - Same project:                          +2.5
 *   - Each shared tag:                       +1.5
 *   - Both updated within last 24h:          +0.8
 *   - Token overlap on title+body/desc:      +0.05 per shared
 *     significant token (length > 4, lowercased, deduped),
 *     capped at +1.0
 *
 * Excludes:
 *   - The source record itself.
 *   - Soft-deleted records.
 *   - Sections and Projects (not in result-type set).
 *   - Inbox items (not LinkableType).
 *
 * Result types: documents, poems, longformDocs, builds, patterns, pipelines.
 *
 * Result is sorted descending by score, capped at `limit` entries
 * (default 8).
 */
export function relatedTo(
  recordId: string,
  recordType: LinkableType,
  ws: RelatedWorkspace,
  limit?: number
): RelatedScore[] {
  const rows = flatten(ws)

  // Find the source row from the flattened set (or null if it's a kind
  // that's not in the result-type set, like project/longform-section).
  const self = rows.find((r) => r.id === recordId && r.type === recordType)

  // Source projectId / tokens / updatedAt (lookup lightly tolerant of
  // sources that aren't candidates themselves — projects can request
  // "related" too).
  const sourceProjectId =
    self?.projectId ??
    [
      ...ws.documents, ...ws.poems, ...ws.longformDocs,
      ...ws.builds, ...ws.patterns, ...ws.pipelines
    ].find((r: any) => r.id === recordId && (r.projectId !== undefined))?.projectId

  const sourceTokens = self ? tokenize(self.text) : new Set<string>()
  const sourceUpdatedAt = self?.updatedAt ?? 0

  // Index linked pairs (either direction).
  const linkedKeys = new Set<string>()
  for (const l of ws.links) {
    if (l.sourceId === recordId && l.sourceType === recordType) {
      linkedKeys.add(`${l.targetType}:${l.targetId}`)
    } else if (l.targetId === recordId && l.targetType === recordType) {
      linkedKeys.add(`${l.sourceType}:${l.sourceId}`)
    }
  }

  // Index tags on the source.
  const sourceTagIds = new Set<string>()
  for (const tl of ws.tagLinks) {
    if (tl.targetId === recordId && tl.targetType === recordType) {
      sourceTagIds.add(tl.tagId)
    }
  }

  // Index tags per (type:id) for candidate scoring.
  const tagsByCandidate: Map<string, Set<string>> = new Map()
  for (const tl of ws.tagLinks) {
    const key = `${tl.targetType}:${tl.targetId}`
    let set = tagsByCandidate.get(key)
    if (!set) { set = new Set(); tagsByCandidate.set(key, set) }
    set.add(tl.tagId)
  }

  const DAY = 86_400_000
  const sourceRecent = sourceUpdatedAt > 0 && (Date.now() - sourceUpdatedAt) < DAY

  const scored: RelatedScore[] = []
  for (const row of rows) {
    if (row.id === recordId && row.type === recordType) continue

    const reasons: string[] = []
    let score = 0

    const candKey = `${row.type}:${row.id}`
    if (linkedKeys.has(candKey)) {
      score += 5.0
      reasons.push('linked')
    }

    if (row.projectId && sourceProjectId && row.projectId === sourceProjectId) {
      score += 2.5
      reasons.push('same project')
    }

    const candTags = tagsByCandidate.get(candKey)
    if (candTags && sourceTagIds.size > 0) {
      let shared = 0
      for (const tid of candTags) if (sourceTagIds.has(tid)) shared++
      if (shared > 0) {
        score += shared * 1.5
        reasons.push(`${shared} shared tag${shared === 1 ? '' : 's'}`)
      }
    }

    if (sourceRecent && (Date.now() - row.updatedAt) < DAY) {
      score += 0.8
      reasons.push('both recent')
    }

    if (sourceTokens.size > 0) {
      const candTokens = tokenize(row.text)
      let shared = 0
      for (const tok of candTokens) if (sourceTokens.has(tok)) shared++
      if (shared > 0) {
        const bonus = Math.min(1.0, shared * 0.05)
        score += bonus
        reasons.push(`${shared} shared token${shared === 1 ? '' : 's'}`)
      }
    }

    if (score > 0) {
      scored.push({ targetId: row.id, targetType: row.type, score, reasons })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit ?? 8)
}
