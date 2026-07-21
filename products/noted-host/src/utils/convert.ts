import type { StoreName } from '../db'
import type { Scrap, Note, Pattern, InboxItem, LongformSection } from '../types'

// Helper: extract a title from a body string.
// Takes first non-empty line, truncates to 80 chars.
function titleFromBody(body: string): string {
  const first = (body ?? '').split('\n').map((l) => l.trim()).find((l) => l.length > 0)
  if (!first) return 'Untitled'
  return first.length > 80 ? `${first.slice(0, 79)}…` : first
}

/** Scrap → Note field mapping. */
export function scrapToNote(scrap: Scrap): Omit<Note, 'id'> {
  return {
    title: titleFromBody(scrap.body ?? ''),
    body: scrap.body ?? '',
    projectId: scrap.projectId ?? undefined,
    convertedFromId: scrap.id,
    convertedFromType: 'scraps' as StoreName,
    convertedAt: Date.now(),
    contentHash: null,
    aiLineage: scrap.aiLineage ?? false,
    isSeedData: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * Scrap → Pattern (block).
 * CRITICAL: type must be exactly 'block' or the record will not appear
 * in the Prompt Studio block rail. See LANDMINES.MD.
 */
export function scrapToBlock(scrap: Scrap): Omit<Pattern, 'id'> {
  return {
    name: titleFromBody(scrap.body ?? ''),
    description: '',
    type: 'block',
    tags: [],
    body: scrap.body ?? '',
    projectId: scrap.projectId ?? undefined,
    convertedFromId: scrap.id,
    convertedFromType: 'scraps' as StoreName,
    convertedAt: Date.now(),
    contentHash: null,
    aiLineage: scrap.aiLineage ?? false,
    isSeedData: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/** InboxItem → Note field mapping. */
export function inboxToNote(item: InboxItem): Omit<Note, 'id'> {
  return {
    title: item.title || 'Untitled note',
    body: item.body ?? '',
    convertedFromId: item.id,
    convertedFromType: 'inboxItems' as StoreName,
    convertedAt: Date.now(),
    contentHash: null,
    aiLineage: false,
    isSeedData: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/** InboxItem → Scrap field mapping. */
export function inboxToScrap(item: InboxItem): Omit<Scrap, 'id'> {
  // Merge title + body so no content is lost.
  const body = [item.title, item.body].filter(Boolean).join('\n').trim()
  return {
    projectId: null,
    body,
    sourceLabel: 'from inbox',
    convertedFromId: item.id,
    convertedFromType: 'inboxItems' as StoreName,
    convertedAt: Date.now(),
    contentHash: null,
    aiLineage: false,
    isSeedData: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * Note → LongformSection field mapping.
 * @param targetDocId  The LongformDoc.id to attach the section to.
 *                     NOTE: goes into LongformSection.projectId — this is
 *                     intentional legacy naming. See LANDMINES.MD.
 * @param order        Appended order index (caller computes from existing sections).
 */
export function noteToSection(
  note: Note,
  targetDocId: string,
  order: number
): Omit<LongformSection, 'id'> {
  return {
    projectId: targetDocId,
    title: note.title || 'Untitled section',
    body: note.body ?? '',
    order,
    convertedFromId: note.id,
    convertedFromType: 'notes' as StoreName,
    convertedAt: Date.now(),
    isSeedData: false,
    aiLineage: note.aiLineage ?? false,
    contentHash: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
