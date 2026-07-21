import React, {
  createContext, useContext, useEffect, useState, useCallback, useRef
} from 'react'
import {
  getDB, dbGetAll, dbGet, dbPut, dbDelete, dbClearAll, dbBulkPut,
  STORES, SCHEMA_VERSION, DB_VERSION, StoreName, migrateShelfV1ToV2, migratePatternTagsV2ToV3, normalizePersistedRowForStore, serializeRowForWorkspaceExport
} from './db'
import type {
  Document, Poem, LongformDoc, LongformSection,
  AppDesignBuild, AppDesignConstraint, AppDesignFeature,
  AppDesignScreen, AppDesignDataShape, AppDesignPhase, AppDesignReview,
  ShelfItem, ShelfRefType, MetaRecord,
  Project, Link, LinkableType, Tag, TagLink,
  DockerScratch, DockerClipboard, Snapshot,
  Pattern, Prompt, PromptPipeline, PromptBlock, PromptBlockType,
  InboxItem, NodePosition, RouteKind,
  Note, Scrap  // Sweep 27, Sweep 37
} from './types'
import { seedPlaceholder } from './seed'
import { evaluateInboxItem } from './util/reminders'
import type { ConversionKind } from './components/ConvertModal'
import { scrapToNote, scrapToBlock, inboxToNote, inboxToScrap, noteToSection } from './utils/convert'

export const SHELF_CAP = 12

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const now = () => Date.now()

type Patch<T> = Partial<T>
export type BootstrapStatus = 'loading' | 'ready' | 'error' | 'blocked'

/**
 * Sweep 23: notification entry produced by the reminder engine and read by
 * NotificationToast + InboxBadge. Lives in a workspace-tree-scoped queue
 * (NOT a global event bus) — see `notificationQueue` on the API surface.
 */
export interface InboxNotification {
  /** Unique notification id; not the inbox item id. */
  id: string
  inboxId: string
  title: string
  firedAt: number
}

// =============================================================================
// State shape
// =============================================================================

interface State {
  ready: boolean
  error: string | null
  bootstrapStatus: BootstrapStatus
  bootstrapError: string | null

  // v1 collections
  documents: Document[]
  poems: Poem[]
  longformDocs: LongformDoc[]   // renamed from `projects` in Sweep 6
  sections: LongformSection[]
  builds: AppDesignBuild[]
  constraints: AppDesignConstraint[]
  features: AppDesignFeature[]
  screens: AppDesignScreen[]
  dataShapes: AppDesignDataShape[]
  phases: AppDesignPhase[]
  reviews: AppDesignReview[]
  shelfItems: ShelfItem[]

  // v2 collections (Sweep 6)
  projects: Project[]            // universal containers (NOT longform)
  links: Link[]
  tags: Tag[]
  tagLinks: TagLink[]
  dockerScratch: DockerScratch[]
  dockerClipboard: DockerClipboard[]
  snapshots: Snapshot[]
  patterns: Pattern[]
  prompts: Prompt[]
  pipelines: PromptPipeline[]
  blocks: PromptBlock[]

  // v4 collections (Sweep 23)
  inboxItems: InboxItem[]
  nodePositions: NodePosition[]

  // v5 collections (Sweep 27)
  notes: Note[]

  // v7 collections (Sweep 37)
  scraps: Scrap[]
}

const EMPTY_DATA: Omit<State, 'ready' | 'error' | 'bootstrapStatus' | 'bootstrapError'> = {
  documents: [], poems: [], longformDocs: [], sections: [],
  builds: [], constraints: [], features: [],
  screens: [], dataShapes: [], phases: [], reviews: [], shelfItems: [],
  projects: [], links: [], tags: [], tagLinks: [],
  dockerScratch: [], dockerClipboard: [], snapshots: [],
  patterns: [], prompts: [], pipelines: [], blocks: [],
  inboxItems: [], nodePositions: [],
  notes: [],  // Sweep 27
  scraps: []  // Sweep 37
}

// =============================================================================
// API
// =============================================================================

interface API extends State {
  // documents
  createDocument: (title?: string) => Promise<Document>
  updateDocument: (id: string, patch: Patch<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  softDeleteDocument: (id: string) => Promise<void>
  restoreDocument: (id: string) => Promise<void>

  // poems
  createPoem: (title?: string) => Promise<Poem>
  updatePoem: (id: string, patch: Patch<Poem>) => Promise<void>
  deletePoem: (id: string) => Promise<void>
  softDeletePoem: (id: string) => Promise<void>
  restorePoem: (id: string) => Promise<void>

  // notes (Sweep 27 — modeled on poem)
  createNote: (title?: string) => Promise<Note>
  updateNote: (id: string, patch: Patch<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  softDeleteNote: (id: string) => Promise<void>
  restoreNote: (id: string) => Promise<void>

  // scraps (Sweep 37 — data layer only; UI lands later)
  createScrap: (data: Pick<Scrap, 'body'> & Partial<Pick<Scrap, 'projectId' | 'sourceLabel'>>) => Promise<Scrap>
  updateScrap: (id: string, data: Partial<Pick<Scrap, 'body' | 'projectId'>>) => Promise<void>
  softDeleteScrap: (id: string) => Promise<void>
  purgeScrap: (id: string) => Promise<void>

  // longform docs (renamed from "projects" in Sweep 6)
  createLongformDoc: (title?: string) => Promise<LongformDoc>
  updateLongformDoc: (id: string, patch: Patch<LongformDoc>) => Promise<void>
  deleteLongformDoc: (id: string) => Promise<void>
  softDeleteLongformDoc: (id: string) => Promise<void>
  restoreLongformDoc: (id: string) => Promise<void>
  createSection: (docId: string, title?: string) => Promise<LongformSection>
  updateSection: (id: string, patch: Patch<LongformSection>) => Promise<void>
  deleteSection: (id: string) => Promise<void>
  reorderSection: (id: string, direction: -1 | 1) => Promise<void>

  // builds
  createBuild: (name?: string) => Promise<AppDesignBuild>
  updateBuild: (id: string, patch: Patch<AppDesignBuild>) => Promise<void>
  deleteBuild: (id: string) => Promise<void>
  softDeleteBuild: (id: string) => Promise<void>
  restoreBuild: (id: string) => Promise<void>

  // constraints
  createConstraint: (buildId: string, text?: string) => Promise<AppDesignConstraint>
  updateConstraint: (id: string, patch: Patch<AppDesignConstraint>) => Promise<void>
  deleteConstraint: (id: string) => Promise<void>
  reorderConstraint: (id: string, direction: -1 | 1) => Promise<void>

  // features
  createFeature: (buildId: string, statement?: string) => Promise<AppDesignFeature>
  updateFeature: (id: string, patch: Patch<AppDesignFeature>) => Promise<void>
  deleteFeature: (id: string) => Promise<void>
  reorderFeature: (id: string, direction: -1 | 1) => Promise<void>

  // screens
  createScreen: (buildId: string, name?: string) => Promise<AppDesignScreen>
  updateScreen: (id: string, patch: Patch<AppDesignScreen>) => Promise<void>
  deleteScreen: (id: string) => Promise<void>
  reorderScreen: (id: string, direction: -1 | 1) => Promise<void>

  // data shapes
  createDataShape: (buildId: string, name?: string) => Promise<AppDesignDataShape>
  updateDataShape: (id: string, patch: Patch<AppDesignDataShape>) => Promise<void>
  deleteDataShape: (id: string) => Promise<void>
  reorderDataShape: (id: string, direction: -1 | 1) => Promise<void>

  // phases
  createPhase: (buildId: string, name?: string) => Promise<AppDesignPhase>
  updatePhase: (id: string, patch: Patch<AppDesignPhase>) => Promise<void>
  setActivePhase: (buildId: string, phaseId: string) => Promise<void>
  deletePhase: (id: string) => Promise<void>
  reorderPhase: (id: string, direction: -1 | 1) => Promise<void>

  // reviews
  createReview: (buildId: string, phaseId: string, deliveredArtifact?: string) => Promise<AppDesignReview>
  updateReview: (id: string, patch: Patch<AppDesignReview>) => Promise<void>
  deleteReview: (id: string) => Promise<void>

  // shelf
  addToShelf: (item: { type: ShelfRefType, refId: string, title: string }) => Promise<void>
  removeFromShelf: (id: string) => Promise<void>
  isOnShelf: (type: ShelfRefType, refId: string) => boolean
  shelfTitleFor: (type: ShelfRefType, refId: string) => string | null

  // === Sweep 6: universal Projects ===
  createProject: (name?: string, description?: string) => Promise<Project>
  updateProject: (id: string, patch: Patch<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // === Sweep 6: links ===
  createLink: (args: {
    sourceId: string, sourceType: LinkableType,
    targetId: string, targetType: LinkableType,
    label?: string
  }) => Promise<Link>
  deleteLink: (id: string) => Promise<void>

  // === Sweep 6: tags ===
  createTag: (name: string, colour?: string) => Promise<Tag>
  updateTag: (id: string, patch: Patch<Tag>) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  tagItem: (args: { tagId: string, targetId: string, targetType: LinkableType }) => Promise<TagLink>
  untagItem: (tagLinkId: string) => Promise<void>

  // === Sweep 6: docker (data only; UI lands Sweeps 7 & 10) ===
  createScratch: (title?: string) => Promise<DockerScratch>
  updateScratch: (id: string, patch: Patch<DockerScratch>) => Promise<void>
  deleteScratch: (id: string) => Promise<void>
  reorderScratch: (id: string, direction: -1 | 1) => Promise<void>
  captureClipboard: (args: { text: string, sourceLabel?: string }) => Promise<DockerClipboard>
  removeClipboard: (id: string) => Promise<void>

  // === Sweep 6: snapshots ===
  createSnapshot: (args: {
    recordId: string, recordType: LinkableType, label: string, data: string
  }) => Promise<Snapshot>
  deleteSnapshot: (id: string) => Promise<void>

  // === Sweep 6: patterns ===
  createPattern: (init?: Partial<Pattern>) => Promise<Pattern>
  updatePattern: (id: string, patch: Patch<Pattern>) => Promise<void>
  deletePattern: (id: string) => Promise<void>
  softDeletePattern: (id: string) => Promise<void>
  restorePattern: (id: string) => Promise<void>

  // === v0.02: Prompt Studio compose drafts ===
  createPrompt: (data: Pick<Prompt, 'title'> & Partial<Pick<Prompt, 'body'>>) => Promise<Prompt>
  updatePrompt: (id: string, data: Partial<Pick<Prompt, 'title' | 'body'>>) => Promise<void>
  softDeletePrompt: (id: string) => Promise<void>

  // === Sweep 6: prompt pipelines / blocks ===
  createPipeline: (name?: string) => Promise<PromptPipeline>
  updatePipeline: (id: string, patch: Patch<PromptPipeline>) => Promise<void>
  deletePipeline: (id: string) => Promise<void>
  softDeletePipeline: (id: string) => Promise<void>
  restorePipeline: (id: string) => Promise<void>
  createBlock: (pipelineId: string, type?: PromptBlockType, label?: string) => Promise<PromptBlock>
  updateBlock: (id: string, patch: Patch<PromptBlock>) => Promise<void>
  deleteBlock: (id: string) => Promise<void>
  reorderBlock: (id: string, direction: -1 | 1) => Promise<void>

  // === Sweep 23: inbox capture ===
  createInboxItem: (partial?: Partial<InboxItem>) => Promise<InboxItem>
  updateInboxItem: (id: string, patch: Patch<InboxItem>, opts?: { touch?: boolean }) => Promise<void>
  softDeleteInboxItem: (id: string) => Promise<void>
  restoreInboxItem: (id: string) => Promise<void>
  deleteInboxItem: (id: string) => Promise<void>
  markInboxItemDone: (id: string) => Promise<void>
  dismissInboxItem: (id: string) => Promise<void>
  routeInboxItemTo: (inboxId: string, kind: RouteKind) => Promise<string | null>
  convertRecord: (args: {
    kind: ConversionKind
    sourceId: string
    targetDocId?: string
    migrateTags?: boolean
  }) => Promise<{ newId: string }>

  // === Sweep 23: Atlas node positions ===
  setNodePosition: (syntheticId: string, x: number, y: number, pinned?: boolean) => Promise<void>
  getNodePosition: (syntheticId: string) => NodePosition | undefined
  clearNodePositions: () => Promise<void>

  // === Sweep 23: link helpers ===
  updateLink: (id: string, patch: Patch<Link>) => Promise<void>

  // === Sweep 23: active record + reminders ===
  activeRecord: { id: string, type: LinkableType } | null
  setActiveRecord: (r: { id: string, type: LinkableType } | null) => void
  tickReminders: () => void

  // === Sweep 23: notification queue (consumed by toast + badge) ===
  notificationQueue: InboxNotification[]
  notificationTick: number
  dismissNotification: (id: string) => void

  // workspace-level
  exportWorkspace: () => Promise<any>
  importWorkspace: (data: any, mode: 'merge' | 'replace') => Promise<{ ok: boolean, message?: string }>
  wipeWorkspace: () => Promise<void>
}

const Ctx = createContext<API | null>(null)

export function useWorkspace(): API {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}

// =============================================================================
// Helpers (pure)
// =============================================================================

function reorderInList<T extends { id: string, order: number }>(
  list: T[], id: string, direction: -1 | 1
): T[] {
  const sorted = [...list].sort((a, b) => a.order - b.order)
  const idx = sorted.findIndex((x) => x.id === id)
  if (idx < 0) return list
  const swapWith = idx + direction
  if (swapWith < 0 || swapWith >= sorted.length) return list
  const a = sorted[idx]
  const b = sorted[swapWith]
  return list.map((x) => {
    if (x.id === a.id) return { ...x, order: b.order }
    if (x.id === b.id) return { ...x, order: a.order }
    return x
  })
}

function nextOrder<T extends { order: number }>(list: T[]): number {
  if (!list.length) return 0
  return Math.max(...list.map((x) => x.order)) + 1
}

function nextTabIndex<T extends { tabIndex: number }>(list: T[]): number {
  if (!list.length) return 0
  return Math.max(...list.map((x) => x.tabIndex)) + 1
}

function activeScraps(list: Scrap[]): Scrap[] {
  return list
    .filter((s) => s.deletedAt === undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

function activePrompts(list: Prompt[]): Prompt[] {
  return list
    .filter((p) => p.deletedAt === undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Read every store from IDB into a plain object whose keys match the State
 * shape. Boot, importWorkspace, and wipeWorkspace all funnel through this so
 * adding a store is a one-place edit.
 */
async function hydrateStore<T>(store: StoreName): Promise<T[]> {
  try {
    return (await dbGetAll<T>(store)).map((row) => normalizePersistedRowForStore(store, row))
  } catch (error) {
    console.warn(`[Verse Studio] Store hydration failed for: ${store}`, error)
    return []
  }
}

async function hydrateAllStores(): Promise<Omit<State, 'ready' | 'error' | 'bootstrapStatus' | 'bootstrapError'>> {
  const [
    documents, poems, longformDocs, sections, builds,
    constraints, features, screens, dataShapes, phases, reviews, shelfItems,
    projects, links, tags, tagLinks,
    dockerScratch, dockerClipboard, snapshots, patterns, prompts, pipelines, blocks,
    inboxItems, nodePositions,
    notes,  // Sweep 27
    scraps  // Sweep 37
  ] = await Promise.all([
    hydrateStore<Document>('writingDocs'),
    hydrateStore<Poem>('poems'),
    hydrateStore<LongformDoc>('longformProjects'),
    hydrateStore<LongformSection>('longformSections'),
    hydrateStore<AppDesignBuild>('appDesignBuilds'),
    hydrateStore<AppDesignConstraint>('appDesignConstraints'),
    hydrateStore<AppDesignFeature>('appDesignFeatures'),
    hydrateStore<AppDesignScreen>('appDesignScreens'),
    hydrateStore<AppDesignDataShape>('appDesignDataShapes'),
    hydrateStore<AppDesignPhase>('appDesignPhases'),
    hydrateStore<AppDesignReview>('appDesignReviews'),
    hydrateStore<ShelfItem>('shelf'),
    hydrateStore<Project>('projects'),
    hydrateStore<Link>('links'),
    hydrateStore<Tag>('tags'),
    hydrateStore<TagLink>('tagLinks'),
    hydrateStore<DockerScratch>('dockerScratch'),
    hydrateStore<DockerClipboard>('dockerClipboard'),
    hydrateStore<Snapshot>('snapshots'),
    hydrateStore<Pattern>('patterns'),
    hydrateStore<Prompt>('prompts'),
    hydrateStore<PromptPipeline>('promptPipelines'),
    hydrateStore<PromptBlock>('promptBlocks'),
    hydrateStore<InboxItem>('inboxItems'),
    hydrateStore<NodePosition>('nodePositions'),
    hydrateStore<Note>('notes'),  // Sweep 27
    hydrateStore<Scrap>('scraps')  // Sweep 37
  ])
  return {
    documents, poems, longformDocs, sections, builds,
    constraints, features, screens, dataShapes, phases, reviews, shelfItems,
    projects, links, tags, tagLinks,
    dockerScratch, dockerClipboard, snapshots, patterns,
    prompts: activePrompts(prompts), pipelines, blocks,
    inboxItems, nodePositions,
    notes,  // Sweep 27
    scraps: activeScraps(scraps)  // Sweep 37
  }
}

// =============================================================================
// Provider
// =============================================================================

interface ProviderProps { children: React.ReactNode }

export function WorkspaceProvider({ children }: ProviderProps) {
  const [state, setState] = useState<State>({
    ready: false, error: null, bootstrapStatus: 'loading', bootstrapError: null, ...EMPTY_DATA
  })

  // Boot: open IDB, seed if needed, hydrate state.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        console.info(
          '[Verse Studio] Bootstrap starting. Expected DB_VERSION:', DB_VERSION,
          'SCHEMA_VERSION:', SCHEMA_VERSION
        )
        const db = await getDB()
        console.info(
          '[Verse Studio] DB opened. Actual version:', db.version,
          'Stores:', [...db.objectStoreNames]
        )
        const seeded = await dbGet<MetaRecord>('meta', 'seeded')
        if (!seeded?.value) {
          await seedPlaceholder()
        }
            const schema = await dbGet<MetaRecord>('meta', 'schemaVersion')
        if (schema?.value !== SCHEMA_VERSION) {
          await dbPut('meta', { key: 'schemaVersion', value: SCHEMA_VERSION })
        }
        const data = await hydrateAllStores()
        if (cancelled) return
        setState({
          ready: true, error: null,
          bootstrapStatus: 'ready', bootstrapError: null,
          ...data
        })
      } catch (error: any) {
        console.error('[Verse Studio] Bootstrap failed:', error)
        if (cancelled) return
        const message = error?.message ?? 'Unknown error'
        const blocked = error?.code === 'DB_BLOCKED'
        setState((s) => ({
          ...s,
          ready: false,
          error: message,
          bootstrapStatus: blocked ? 'blocked' : 'error',
          bootstrapError: message
        }))
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Optimistic updates throughout: state first, then persist. Makes
  // unmount-flush followed by an immediate re-mount safe.
  const stateRef = useRef(state)
  stateRef.current = state

  // ---------------------------------------------------------------------------
  // Sweep 23: Link cascade helper for hard-delete.
  //
  // Every hard-delete path on a LinkableType record collects the Links that
  // touch it (as source or target), removes them from state in the same
  // setState call as the record removal, and dbDelete()s them after the
  // record itself has been deleted. Pattern-matches `deleteTag`'s tagLink
  // cascade. Soft-delete intentionally leaves Links alone — Restore restores
  // the connections.
  // ---------------------------------------------------------------------------
  function collectLinkOrphans(recordId: string, recordType: LinkableType): Link[] {
    return stateRef.current.links.filter((l) =>
      (l.sourceId === recordId && l.sourceType === recordType) ||
      (l.targetId === recordId && l.targetType === recordType)
    )
  }

  // ---------------------------------------------------------------------------
  // Generic write primitives. These keep the per-type CRUD short and uniform.
  // ---------------------------------------------------------------------------

  /** Optimistic create: append to state, persist. */
  async function createIn<T extends { id: string }>(
    store: StoreName, item: T, stateKey: keyof State
  ): Promise<T> {
    const normalized = normalizePersistedRowForStore(store, item) as T
    setState((s) => ({
      ...s,
      [stateKey]: [...(s[stateKey] as unknown as T[]), normalized]
    } as State))
    await dbPut(store, normalized)
    return normalized
  }

  /** Optimistic update by id: merge patch, persist. */
  async function updateIn<T extends { id: string }>(
    store: StoreName, id: string, patch: Partial<T>, stateKey: keyof State,
    touch: boolean = false  // bump updatedAt if true
  ): Promise<void> {
    const list = stateRef.current[stateKey] as unknown as T[]
    const cur = list.find((x) => x.id === id)
    if (!cur) return
    const nextRaw = touch
      ? { ...cur, ...patch, updatedAt: now() } as T
      : { ...cur, ...patch } as T
    const next = normalizePersistedRowForStore(store, nextRaw) as T
    setState((s) => ({
      ...s,
      [stateKey]: (s[stateKey] as unknown as T[]).map((x) => x.id === id ? next : x)
    } as State))
    await dbPut(store, next as object)
  }

  /** Optimistic hard delete by id: remove from state, delete from store. */
  async function deleteIn<T extends { id: string }>(
    store: StoreName, id: string, stateKey: keyof State
  ): Promise<void> {
    setState((s) => ({
      ...s,
      [stateKey]: (s[stateKey] as unknown as T[]).filter((x) => x.id !== id)
    } as State))
    await dbDelete(store, id)
  }

  /** Soft delete: stamp deletedAt = now. */
  async function softDeleteIn<T extends { id: string, deletedAt?: number }>(
    store: StoreName, id: string, stateKey: keyof State
  ): Promise<void> {
    return updateIn<T>(store, id, { deletedAt: now() } as Partial<T>, stateKey)
  }

  /** Restore: clear deletedAt. */
  async function restoreIn<T extends { id: string, deletedAt?: number }>(
    store: StoreName, id: string, stateKey: keyof State
  ): Promise<void> {
    const list = stateRef.current[stateKey] as unknown as T[]
    const cur = list.find((x) => x.id === id)
    if (!cur) return
    const next = { ...cur }
    delete (next as any).deletedAt
    setState((s) => ({
      ...s,
      [stateKey]: (s[stateKey] as unknown as T[]).map((x) => x.id === id ? next : x)
    } as State))
    await dbPut(store, next as object)
  }

  // === Sweep 20: auto-snapshot before soft-delete ============================
  /**
   * Sweep 20: capture a labelled Snapshot of a record's editor-controlled
   * fields immediately before soft-delete. Idempotent (skips if record is
   * already soft-deleted or not found). Best-effort: any failure is
   * swallowed and logged so the soft-delete itself cannot be blocked.
   *
   * The data shape mirrors the existing manual `buildSnapshotData`
   * closures, so the existing Snapshots Restore button round-trips
   * auto-snapshots identically to manual ones.
   */
  async function autoSnapshotBeforeSoftDelete(
    kind: 'document' | 'poem' | 'longform' | 'build' | 'pattern' | 'pipeline' | 'note',
    id: string
  ): Promise<void> {
    try {
      let recordType: LinkableType
      let data: string
      switch (kind) {
        case 'document': {
          const r = stateRef.current.documents.find((d) => d.id === id)
          if (!r || r.deletedAt) return
          recordType = 'document'
          data = JSON.stringify({ title: r.title, body: r.body })
          break
        }
        case 'poem': {
          const r = stateRef.current.poems.find((p) => p.id === id)
          if (!r || r.deletedAt) return
          recordType = 'poem'
          data = JSON.stringify({ title: r.title, body: r.body })
          break
        }
        case 'note': {  // Sweep 27 — same shape as poem
          const r = stateRef.current.notes.find((n) => n.id === id)
          if (!r || r.deletedAt) return
          recordType = 'note'
          data = JSON.stringify({ title: r.title, body: r.body })
          break
        }
        case 'longform': {
          const r = stateRef.current.longformDocs.find((d) => d.id === id)
          if (!r || r.deletedAt) return
          recordType = 'longform'
          data = JSON.stringify({ title: r.title })
          break
        }
        case 'build': {
          const r = stateRef.current.builds.find((b) => b.id === id)
          if (!r || r.deletedAt) return
          recordType = 'build'
          data = JSON.stringify({
            name: r.name, description: r.description, platform: r.platform
          })
          break
        }
        case 'pattern': {
          const r = stateRef.current.patterns.find((p) => p.id === id)
          if (!r || r.deletedAt) return
          recordType = 'pattern'
          data = JSON.stringify({
            name: r.name, description: r.description, type: r.type, body: r.body
          })
          break
        }
        case 'pipeline': {
          const r = stateRef.current.pipelines.find((p) => p.id === id)
          if (!r || r.deletedAt) return
          recordType = 'pipeline'
          data = JSON.stringify({ name: r.name, description: r.description })
          break
        }
        default:
          return
      }
      const label = `Before delete — ${new Date().toLocaleString()}`
      const snap: Snapshot = {
        id: uid(),
        recordId: id,
        recordType,
        label,
        data,
        createdAt: now()
      }
      await createIn<Snapshot>('snapshots', snap, 'snapshots')
    } catch (err) {
      console.warn('[Sweep 20] autoSnapshotBeforeSoftDelete failed (soft-delete will proceed):', err)
    }
  }

  // === Documents =============================================================
  const createDocument = useCallback(async (title?: string) => {
    const doc: Document = {
      id: uid(), title: title ?? 'Untitled', body: '',
      createdAt: now(), updatedAt: now()
    }
    return createIn<Document>('writingDocs', doc, 'documents')
  }, [])
  const updateDocument = useCallback(async (id: string, patch: Patch<Document>) => {
    return updateIn<Document>('writingDocs', id, patch, 'documents', true)
  }, [])
  const deleteDocument = useCallback(async (id: string) => {
    const orphans = stateRef.current.shelfItems.filter((s) => s.type === 'document' && s.refId === id)
    const linkOrphans = collectLinkOrphans(id, 'document')
    setState((s) => ({
      ...s,
      documents: s.documents.filter((d) => d.id !== id),
      shelfItems: s.shelfItems.filter((it) => !(it.type === 'document' && it.refId === id)),
      links: s.links.filter((l) => !linkOrphans.some((o) => o.id === l.id))
    }))
    await dbDelete('writingDocs', id)
    for (const o of orphans) await dbDelete('shelf', o.id)
    for (const l of linkOrphans) await dbDelete('links', l.id)
  }, [])
  const softDeleteDocument = useCallback(async (id: string) => {
    await autoSnapshotBeforeSoftDelete('document', id)
    return softDeleteIn<Document>('writingDocs', id, 'documents')
  }, [])
  const restoreDocument = useCallback(async (id: string) => {
    return restoreIn<Document>('writingDocs', id, 'documents')
  }, [])

  // === Poems =================================================================
  const createPoem = useCallback(async (title?: string) => {
    const p: Poem = {
      id: uid(), title: title ?? 'Untitled', body: '',
      createdAt: now(), updatedAt: now()
    }
    return createIn<Poem>('poems', p, 'poems')
  }, [])
  const updatePoem = useCallback(async (id: string, patch: Patch<Poem>) => {
    return updateIn<Poem>('poems', id, patch, 'poems', true)
  }, [])
  const deletePoem = useCallback(async (id: string) => {
    const orphans = stateRef.current.shelfItems.filter((s) => s.type === 'poem' && s.refId === id)
    const linkOrphans = collectLinkOrphans(id, 'poem')
    setState((s) => ({
      ...s,
      poems: s.poems.filter((p) => p.id !== id),
      shelfItems: s.shelfItems.filter((it) => !(it.type === 'poem' && it.refId === id)),
      links: s.links.filter((l) => !linkOrphans.some((o) => o.id === l.id))
    }))
    await dbDelete('poems', id)
    for (const o of orphans) await dbDelete('shelf', o.id)
    for (const l of linkOrphans) await dbDelete('links', l.id)
  }, [])
  const softDeletePoem = useCallback(async (id: string) => {
    await autoSnapshotBeforeSoftDelete('poem', id)
    return softDeleteIn<Poem>('poems', id, 'poems')
  }, [])
  const restorePoem = useCallback(async (id: string) => {
    return restoreIn<Poem>('poems', id, 'poems')
  }, [])

  // === Notes (Sweep 27) ======================================================
  // Pattern-clone of Poem CRUD. Note has identical schema (single body field,
  // projectId, soft-delete, snapshots) — the deltas are just the IDB store
  // name ('notes' vs 'poems'), the LinkableType discriminator ('note' vs
  // 'poem'), and the state slice key ('notes' vs 'poems').
  const createNote = useCallback(async (title?: string) => {
    const n: Note = {
      id: uid(), title: title ?? 'Untitled', body: '',
      createdAt: now(), updatedAt: now()
    }
    return createIn<Note>('notes', n, 'notes')
  }, [])
  const updateNote = useCallback(async (id: string, patch: Patch<Note>) => {
    return updateIn<Note>('notes', id, patch, 'notes', true)
  }, [])
  const deleteNote = useCallback(async (id: string) => {
    const orphans = stateRef.current.shelfItems.filter((s) => s.type === 'note' && s.refId === id)
    const linkOrphans = collectLinkOrphans(id, 'note')
    setState((s) => ({
      ...s,
      notes: s.notes.filter((n) => n.id !== id),
      shelfItems: s.shelfItems.filter((it) => !(it.type === 'note' && it.refId === id)),
      links: s.links.filter((l) => !linkOrphans.some((o) => o.id === l.id))
    }))
    await dbDelete('notes', id)
    for (const o of orphans) await dbDelete('shelf', o.id)
    for (const l of linkOrphans) await dbDelete('links', l.id)
  }, [])
  const softDeleteNote = useCallback(async (id: string) => {
    await autoSnapshotBeforeSoftDelete('note', id)
    return softDeleteIn<Note>('notes', id, 'notes')
  }, [])
  const restoreNote = useCallback(async (id: string) => {
    return restoreIn<Note>('notes', id, 'notes')
  }, [])

  // === Scraps (Sweep 37) =====================================================
  const createScrap = useCallback(async (data: Pick<Scrap, 'body'> & Partial<Pick<Scrap, 'projectId' | 'sourceLabel'>>) => {
    const t = now()
    const scrap = normalizePersistedRowForStore('scraps', {
      id: uid(),
      projectId: data.projectId ?? null,
      body: data.body,
      sourceLabel: data.sourceLabel ?? 'manual',
      createdAt: t,
      updatedAt: t
    }) as Scrap
    setState((s) => ({
      ...s,
      scraps: activeScraps([...s.scraps, scrap])
    }))
    await dbPut('scraps', scrap)
    return scrap
  }, [])

  const updateScrap = useCallback(async (id: string, data: Partial<Pick<Scrap, 'body' | 'projectId'>>) => {
    const cur = stateRef.current.scraps.find((s) => s.id === id)
    if (!cur) return
    const next = normalizePersistedRowForStore('scraps', { ...cur, ...data, updatedAt: now() }) as Scrap
    setState((s) => ({
      ...s,
      scraps: activeScraps(s.scraps.map((x) => x.id === id ? next : x))
    }))
    await dbPut('scraps', next)
  }, [])

  const softDeleteScrap = useCallback(async (id: string) => {
    const cur = stateRef.current.scraps.find((s) => s.id === id)
    if (!cur) return
    const next = normalizePersistedRowForStore('scraps', { ...cur, deletedAt: now(), updatedAt: now() }) as Scrap
    setState((s) => ({
      ...s,
      scraps: s.scraps.filter((x) => x.id !== id)
    }))
    await dbPut('scraps', next)
  }, [])

  const purgeScrap = useCallback(async (id: string) => {
    setState((s) => ({
      ...s,
      scraps: s.scraps.filter((x) => x.id !== id)
    }))
    await dbDelete('scraps', id)
  }, [])

  // === Longform docs (was "projects" in sweeps 1–5) ==========================
  const createLongformDoc = useCallback(async (title?: string) => {
    const doc: LongformDoc = {
      id: uid(), title: title ?? 'Untitled',
      createdAt: now(), updatedAt: now()
    }
    return createIn<LongformDoc>('longformProjects', doc, 'longformDocs')
  }, [])
  const updateLongformDoc = useCallback(async (id: string, patch: Patch<LongformDoc>) => {
    return updateIn<LongformDoc>('longformProjects', id, patch, 'longformDocs', true)
  }, [])
  const deleteLongformDoc = useCallback(async (id: string) => {
    // LongformSection.projectId still points at LongformDoc.id — see types.ts header.
    const sections = stateRef.current.sections.filter((s) => s.projectId === id)
    const orphans = stateRef.current.shelfItems.filter((s) => s.type === 'longform' && s.refId === id)
    // Sweep 23: cascade Links on the longform doc itself AND on every
    // section that's about to be cascade-deleted with it.
    const linkOrphans = [
      ...collectLinkOrphans(id, 'longform'),
      ...sections.flatMap((sec) => collectLinkOrphans(sec.id, 'longform-section'))
    ]
    setState((s) => ({
      ...s,
      longformDocs: s.longformDocs.filter((p) => p.id !== id),
      sections: s.sections.filter((sec) => sec.projectId !== id),
      shelfItems: s.shelfItems.filter((it) => !(it.type === 'longform' && it.refId === id)),
      links: s.links.filter((l) => !linkOrphans.some((o) => o.id === l.id))
    }))
    await dbDelete('longformProjects', id)
    for (const sec of sections) await dbDelete('longformSections', sec.id)
    for (const o of orphans) await dbDelete('shelf', o.id)
    for (const l of linkOrphans) await dbDelete('links', l.id)
  }, [])
  const softDeleteLongformDoc = useCallback(async (id: string) => {
    await autoSnapshotBeforeSoftDelete('longform', id)
    return softDeleteIn<LongformDoc>('longformProjects', id, 'longformDocs')
  }, [])
  const restoreLongformDoc = useCallback(async (id: string) => {
    return restoreIn<LongformDoc>('longformProjects', id, 'longformDocs')
  }, [])

  const createSection = useCallback(async (docId: string, title?: string) => {
    const sectionsForDoc = stateRef.current.sections.filter((s) => s.projectId === docId)
    const sec: LongformSection = {
      id: uid(),
      projectId: docId, // FK → LongformDoc.id (field name preserved)
      title: title ?? 'Untitled section',
      body: '',
      order: nextOrder(sectionsForDoc),
      createdAt: now(),
      updatedAt: now()
    }
    return createIn<LongformSection>('longformSections', sec, 'sections')
  }, [])
  const updateSection = useCallback(async (id: string, patch: Patch<LongformSection>) => {
    return updateIn<LongformSection>('longformSections', id, patch, 'sections', true)
  }, [])
  const deleteSection = useCallback(async (id: string) => {
    // Sweep 23: cascade Links on the section.
    const linkOrphans = collectLinkOrphans(id, 'longform-section')
    setState((s) => ({
      ...s,
      links: s.links.filter((l) => !linkOrphans.some((o) => o.id === l.id))
    }))
    for (const l of linkOrphans) await dbDelete('links', l.id)
    return deleteIn<LongformSection>('longformSections', id, 'sections')
  }, [])
  const reorderSection = useCallback(async (id: string, direction: -1 | 1) => {
    const cur = stateRef.current.sections.find((s) => s.id === id)
    if (!cur) return
    const siblings = stateRef.current.sections.filter((s) => s.projectId === cur.projectId)
    const reordered = reorderInList(siblings, id, direction)
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec) => reordered.find((r) => r.id === sec.id) ?? sec)
    }))
    for (const sib of reordered) {
      const before = siblings.find((s) => s.id === sib.id)
      if (before && before.order !== sib.order) await dbPut('longformSections', sib)
    }
  }, [])

  // === Builds ================================================================
  const createBuild = useCallback(async (name?: string) => {
    const b: AppDesignBuild = {
      id: uid(),
      name: name ?? 'Untitled Build',
      description: '', status: 'drafting', platform: '',
      createdAt: now(), updatedAt: now()
    }
    return createIn<AppDesignBuild>('appDesignBuilds', b, 'builds')
  }, [])
  const updateBuild = useCallback(async (id: string, patch: Patch<AppDesignBuild>) => {
    return updateIn<AppDesignBuild>('appDesignBuilds', id, patch, 'builds', true)
  }, [])
  const deleteBuild = useCallback(async (id: string) => {
    const cs = stateRef.current.constraints.filter((x) => x.buildId === id)
    const fs = stateRef.current.features.filter((x) => x.buildId === id)
    const ss = stateRef.current.screens.filter((x) => x.buildId === id)
    const ds = stateRef.current.dataShapes.filter((x) => x.buildId === id)
    const ps = stateRef.current.phases.filter((x) => x.buildId === id)
    const rs = stateRef.current.reviews.filter((x) => x.buildId === id)
    const orphans = stateRef.current.shelfItems.filter((s) => s.type === 'build' && s.refId === id)
    const linkOrphans = collectLinkOrphans(id, 'build')
    setState((s) => ({
      ...s,
      builds: s.builds.filter((b) => b.id !== id),
      constraints: s.constraints.filter((x) => x.buildId !== id),
      features: s.features.filter((x) => x.buildId !== id),
      screens: s.screens.filter((x) => x.buildId !== id),
      dataShapes: s.dataShapes.filter((x) => x.buildId !== id),
      phases: s.phases.filter((x) => x.buildId !== id),
      reviews: s.reviews.filter((x) => x.buildId !== id),
      shelfItems: s.shelfItems.filter((it) => !(it.type === 'build' && it.refId === id)),
      links: s.links.filter((l) => !linkOrphans.some((o) => o.id === l.id))
    }))
    await dbDelete('appDesignBuilds', id)
    for (const x of cs) await dbDelete('appDesignConstraints', x.id)
    for (const x of fs) await dbDelete('appDesignFeatures', x.id)
    for (const x of ss) await dbDelete('appDesignScreens', x.id)
    for (const x of ds) await dbDelete('appDesignDataShapes', x.id)
    for (const x of ps) await dbDelete('appDesignPhases', x.id)
    for (const x of rs) await dbDelete('appDesignReviews', x.id)
    for (const o of orphans) await dbDelete('shelf', o.id)
    for (const l of linkOrphans) await dbDelete('links', l.id)
  }, [])
  const softDeleteBuild = useCallback(async (id: string) => {
    await autoSnapshotBeforeSoftDelete('build', id)
    return softDeleteIn<AppDesignBuild>('appDesignBuilds', id, 'builds')
  }, [])
  const restoreBuild = useCallback(async (id: string) => {
    return restoreIn<AppDesignBuild>('appDesignBuilds', id, 'builds')
  }, [])

  // Generic helpers for build-scoped collections (constraints/features/screens/etc.)
  const buildScopedCreate = useCallback(
    async <T extends { id: string, buildId: string, order: number }>(
      store: StoreName,
      buildId: string,
      build: (order: number) => T,
      stateKey: keyof State
    ): Promise<T> => {
      const list = (stateRef.current[stateKey] as unknown as T[]).filter((x) => x.buildId === buildId)
      const item = normalizePersistedRowForStore(store, build(nextOrder(list))) as T
      setState((s) => ({ ...s, [stateKey]: [...(s[stateKey] as unknown as T[]), item] } as State))
      await dbPut(store, item)
      return item
    }, [])

  const buildScopedUpdate = useCallback(
    async <T extends { id: string, buildId: string }>(
      store: StoreName,
      id: string,
      patch: Partial<T>,
      stateKey: keyof State
    ) => {
      const list = stateRef.current[stateKey] as unknown as T[]
      const cur = list.find((x) => x.id === id)
      if (!cur) return
      const next = normalizePersistedRowForStore(store, { ...cur, ...patch }) as T
      setState((s) => ({
        ...s,
        [stateKey]: (s[stateKey] as unknown as T[]).map((x) => x.id === id ? next : x)
      } as State))
      await dbPut(store, next as T)
    }, [])

  const buildScopedDelete = useCallback(
    async <T extends { id: string }>(
      store: StoreName,
      id: string,
      stateKey: keyof State
    ) => {
      setState((s) => ({
        ...s,
        [stateKey]: (s[stateKey] as unknown as T[]).filter((x) => x.id !== id)
      } as State))
      await dbDelete(store, id)
    }, [])

  const buildScopedReorder = useCallback(
    async <T extends { id: string, buildId: string, order: number }>(
      store: StoreName,
      id: string,
      direction: -1 | 1,
      stateKey: keyof State
    ) => {
      const all = stateRef.current[stateKey] as unknown as T[]
      const cur = all.find((x) => x.id === id)
      if (!cur) return
      const siblings = all.filter((x) => x.buildId === cur.buildId)
      const reordered = reorderInList(siblings, id, direction)
      setState((s) => ({
        ...s,
        [stateKey]: (s[stateKey] as unknown as T[]).map((x) => reordered.find((r) => r.id === x.id) ?? x)
      } as State))
      for (const sib of reordered) {
        const before = siblings.find((s) => s.id === sib.id)
        if (before && before.order !== sib.order) await dbPut(store, sib)
      }
    }, [])

  // === Constraints ===========================================================
  const createConstraint = useCallback(async (buildId: string, text?: string) => {
    return buildScopedCreate<AppDesignConstraint>(
      'appDesignConstraints', buildId,
      (order) => ({ id: uid(), buildId, text: text ?? '', challenged: false, why: '', order }),
      'constraints'
    )
  }, [buildScopedCreate])
  const updateConstraint = useCallback(async (id: string, patch: Patch<AppDesignConstraint>) => {
    return buildScopedUpdate<AppDesignConstraint>('appDesignConstraints', id, patch, 'constraints')
  }, [buildScopedUpdate])
  const deleteConstraint = useCallback(async (id: string) => {
    return buildScopedDelete<AppDesignConstraint>('appDesignConstraints', id, 'constraints')
  }, [buildScopedDelete])
  const reorderConstraint = useCallback(async (id: string, direction: -1 | 1) => {
    return buildScopedReorder<AppDesignConstraint>('appDesignConstraints', id, direction, 'constraints')
  }, [buildScopedReorder])

  // === Features ==============================================================
  const createFeature = useCallback(async (buildId: string, statement?: string) => {
    return buildScopedCreate<AppDesignFeature>(
      'appDesignFeatures', buildId,
      (order) => ({
        id: uid(), buildId,
        statement: statement ?? '',
        status: 'spec', notes: '', criteria: [], order
      }),
      'features'
    )
  }, [buildScopedCreate])
  const updateFeature = useCallback(async (id: string, patch: Patch<AppDesignFeature>) => {
    return buildScopedUpdate<AppDesignFeature>('appDesignFeatures', id, patch, 'features')
  }, [buildScopedUpdate])
  const deleteFeature = useCallback(async (id: string) => {
    const screensWithIt = stateRef.current.screens.filter((s) => s.featureLinks.includes(id))
    setState((s) => ({
      ...s,
      screens: s.screens.map((sc) => sc.featureLinks.includes(id)
        ? { ...sc, featureLinks: sc.featureLinks.filter((x) => x !== id) }
        : sc)
    }))
    for (const sc of screensWithIt) {
      const next = { ...sc, featureLinks: sc.featureLinks.filter((x) => x !== id) }
      await dbPut('appDesignScreens', next)
    }
    return buildScopedDelete<AppDesignFeature>('appDesignFeatures', id, 'features')
  }, [buildScopedDelete])
  const reorderFeature = useCallback(async (id: string, direction: -1 | 1) => {
    return buildScopedReorder<AppDesignFeature>('appDesignFeatures', id, direction, 'features')
  }, [buildScopedReorder])

  // === Screens ===============================================================
  const createScreen = useCallback(async (buildId: string, name?: string) => {
    return buildScopedCreate<AppDesignScreen>(
      'appDesignScreens', buildId,
      (order) => ({
        id: uid(), buildId,
        name: name ?? 'Untitled screen',
        zones: [], featureLinks: [], order
      }),
      'screens'
    )
  }, [buildScopedCreate])
  const updateScreen = useCallback(async (id: string, patch: Patch<AppDesignScreen>) => {
    return buildScopedUpdate<AppDesignScreen>('appDesignScreens', id, patch, 'screens')
  }, [buildScopedUpdate])
  const deleteScreen = useCallback(async (id: string) => {
    return buildScopedDelete<AppDesignScreen>('appDesignScreens', id, 'screens')
  }, [buildScopedDelete])
  const reorderScreen = useCallback(async (id: string, direction: -1 | 1) => {
    return buildScopedReorder<AppDesignScreen>('appDesignScreens', id, direction, 'screens')
  }, [buildScopedReorder])

  // === Data Shapes ===========================================================
  const createDataShape = useCallback(async (buildId: string, name?: string) => {
    return buildScopedCreate<AppDesignDataShape>(
      'appDesignDataShapes', buildId,
      (order) => ({
        id: uid(), buildId,
        name: name ?? 'Untitled shape',
        fields: [], order
      }),
      'dataShapes'
    )
  }, [buildScopedCreate])
  const updateDataShape = useCallback(async (id: string, patch: Patch<AppDesignDataShape>) => {
    return buildScopedUpdate<AppDesignDataShape>('appDesignDataShapes', id, patch, 'dataShapes')
  }, [buildScopedUpdate])
  const deleteDataShape = useCallback(async (id: string) => {
    return buildScopedDelete<AppDesignDataShape>('appDesignDataShapes', id, 'dataShapes')
  }, [buildScopedDelete])
  const reorderDataShape = useCallback(async (id: string, direction: -1 | 1) => {
    return buildScopedReorder<AppDesignDataShape>('appDesignDataShapes', id, direction, 'dataShapes')
  }, [buildScopedReorder])

  // === Phases ================================================================
  const createPhase = useCallback(async (buildId: string, name?: string) => {
    const existing = stateRef.current.phases.filter((p) => p.buildId === buildId)
    return buildScopedCreate<AppDesignPhase>(
      'appDesignPhases', buildId,
      (order) => ({
        id: uid(), buildId,
        name: name ?? 'Untitled phase',
        criteria: [],
        active: existing.length === 0,
        order
      }),
      'phases'
    )
  }, [buildScopedCreate])
  const updatePhase = useCallback(async (id: string, patch: Patch<AppDesignPhase>) => {
    return buildScopedUpdate<AppDesignPhase>('appDesignPhases', id, patch, 'phases')
  }, [buildScopedUpdate])
  const setActivePhase = useCallback(async (buildId: string, phaseId: string) => {
    setState((s) => ({
      ...s,
      phases: s.phases.map((p) => p.buildId === buildId ? { ...p, active: p.id === phaseId } : p)
    }))
    const phases = stateRef.current.phases.filter((p) => p.buildId === buildId)
    for (const p of phases) {
      const shouldBeActive = p.id === phaseId
      if (p.active !== shouldBeActive) {
        await dbPut('appDesignPhases', { ...p, active: shouldBeActive })
      }
    }
  }, [])
  const deletePhase = useCallback(async (id: string) => {
    return buildScopedDelete<AppDesignPhase>('appDesignPhases', id, 'phases')
  }, [buildScopedDelete])
  const reorderPhase = useCallback(async (id: string, direction: -1 | 1) => {
    return buildScopedReorder<AppDesignPhase>('appDesignPhases', id, direction, 'phases')
  }, [buildScopedReorder])

  // === Reviews ===============================================================
  const createReview = useCallback(async (buildId: string, phaseId: string, deliveredArtifact?: string) => {
    const phase = stateRef.current.phases.find((p) => p.id === phaseId)
    const review = normalizePersistedRowForStore('appDesignReviews', {
      id: uid(),
      buildId,
      phaseId,
      phaseName: phase?.name ?? '',
      deliveredArtifact: deliveredArtifact ?? '',
      results: (phase?.criteria ?? []).map((c) => ({
        id: c.id, text: c.text, status: 'unset' as const, note: ''
      })),
      createdAt: now()
    }) as AppDesignReview
    setState((s) => ({ ...s, reviews: [...s.reviews, review] }))
    await dbPut('appDesignReviews', review)
    return review
  }, [])
  const updateReview = useCallback(async (id: string, patch: Patch<AppDesignReview>) => {
    return updateIn<AppDesignReview>('appDesignReviews', id, patch, 'reviews')
  }, [])
  const deleteReview = useCallback(async (id: string) => {
    return deleteIn<AppDesignReview>('appDesignReviews', id, 'reviews')
  }, [])

  // === Shelf =================================================================
  const addToShelf = useCallback(async (item: { type: ShelfRefType, refId: string, title: string }) => {
    if (stateRef.current.shelfItems.some((s) => s.type === item.type && s.refId === item.refId)) return
    const newItem: ShelfItem = {
      id: uid(), type: item.type, refId: item.refId, title: item.title,
      addedAt: now(), archived: false
    }
    const all = [...stateRef.current.shelfItems, newItem]
    const active = all.filter((s) => !s.archived).sort((a, b) => a.addedAt - b.addedAt)
    const overflow = active.length - SHELF_CAP
    const archived: string[] = []
    if (overflow > 0) {
      for (let i = 0; i < overflow; i++) archived.push(active[i].id)
    }
    setState((s) => ({
      ...s,
      shelfItems: [
        ...s.shelfItems.map((it) => archived.includes(it.id) ? { ...it, archived: true } : it),
        newItem
      ]
    }))
    await dbPut('shelf', newItem)
    for (const archId of archived) {
      const target = all.find((x) => x.id === archId)
      if (target) await dbPut('shelf', { ...target, archived: true })
    }
  }, [])
  const removeFromShelf = useCallback(async (id: string) => {
    setState((s) => ({ ...s, shelfItems: s.shelfItems.filter((it) => it.id !== id) }))
    await dbDelete('shelf', id)
  }, [])
  const isOnShelf = useCallback((type: ShelfRefType, refId: string) => {
    return state.shelfItems.some((s) => s.type === type && s.refId === refId)
  }, [state.shelfItems])
  const shelfTitleFor = useCallback((type: ShelfRefType, refId: string) => {
    const it = state.shelfItems.find((s) => s.type === type && s.refId === refId)
    return it ? it.title : null
  }, [state.shelfItems])

  // ===========================================================================
  // Sweep 6: universal Projects
  // ===========================================================================
  const createProject = useCallback(async (name?: string, description?: string) => {
    const proj: Project = {
      id: uid(),
      name: name ?? 'Untitled project',
      description: description ?? '',
      createdAt: now(), updatedAt: now()
    }
    return createIn<Project>('projects', proj, 'projects')
  }, [])
  const updateProject = useCallback(async (id: string, patch: Patch<Project>) => {
    return updateIn<Project>('projects', id, patch, 'projects', true)
  }, [])
  const deleteProject = useCallback(async (id: string) => {
    // Detach (don't cascade-delete) any items whose projectId points at this project,
    // and clean up any shelf rows shelved as type='project' with this refId.
    const cur = stateRef.current
    const detachDocs   = cur.documents.filter((d) => d.projectId === id)
    const detachPoems  = cur.poems.filter((p) => p.projectId === id)
    const detachLong   = cur.longformDocs.filter((p) => p.projectId === id)
    const detachBuilds = cur.builds.filter((b) => b.projectId === id)
    const detachPats   = cur.patterns.filter((p) => p.projectId === id)
    const detachPipes  = cur.pipelines.filter((p) => p.projectId === id)
    const orphans = cur.shelfItems.filter((s) => s.type === 'project' && s.refId === id)
    // Sweep 23: cascade Links where the project itself is source/target.
    // (Member records still exist after detach; their own Links survive.)
    const linkOrphans = collectLinkOrphans(id, 'project')

    setState((s) => ({
      ...s,
      projects: s.projects.filter((p) => p.id !== id),
      documents:    s.documents.map((d) => d.projectId === id ? { ...d, projectId: undefined } : d),
      poems:        s.poems.map((p) => p.projectId === id ? { ...p, projectId: undefined } : p),
      longformDocs: s.longformDocs.map((p) => p.projectId === id ? { ...p, projectId: undefined } : p),
      builds:       s.builds.map((b) => b.projectId === id ? { ...b, projectId: undefined } : b),
      patterns:     s.patterns.map((p) => p.projectId === id ? { ...p, projectId: undefined } : p),
      pipelines:    s.pipelines.map((p) => p.projectId === id ? { ...p, projectId: undefined } : p),
      shelfItems:   s.shelfItems.filter((it) => !(it.type === 'project' && it.refId === id)),
      links:        s.links.filter((l) => !linkOrphans.some((o) => o.id === l.id))
    }))

    await dbDelete('projects', id)
    for (const d of detachDocs)   { const n = { ...d };   delete (n as any).projectId; await dbPut('writingDocs', n) }
    for (const p of detachPoems)  { const n = { ...p };   delete (n as any).projectId; await dbPut('poems', n) }
    for (const p of detachLong)   { const n = { ...p };   delete (n as any).projectId; await dbPut('longformProjects', n) }
    for (const b of detachBuilds) { const n = { ...b };   delete (n as any).projectId; await dbPut('appDesignBuilds', n) }
    for (const p of detachPats)   { const n = { ...p };   delete (n as any).projectId; await dbPut('patterns', n) }
    for (const p of detachPipes)  { const n = { ...p };   delete (n as any).projectId; await dbPut('promptPipelines', n) }
    for (const o of orphans) await dbDelete('shelf', o.id)
    for (const l of linkOrphans) await dbDelete('links', l.id)
  }, [])

  // ===========================================================================
  // Sweep 6: links — Sweep 23 made createLink idempotent and added updateLink.
  // ===========================================================================
  const createLink = useCallback(async (args: {
    sourceId: string, sourceType: LinkableType,
    targetId: string, targetType: LinkableType,
    label?: string
  }) => {
    // Sweep 23: idempotent on the unordered pair
    // (sourceId+sourceType, targetId+targetType). If a Link already connects
    // the two records in either direction, return the existing one without
    // creating a duplicate. Pattern-match `tagItem`. The label of an
    // already-existing link is intentionally left alone — callers that want
    // to update a label use updateLink.
    const existing = stateRef.current.links.find((l) =>
      (l.sourceId === args.sourceId && l.sourceType === args.sourceType &&
       l.targetId === args.targetId && l.targetType === args.targetType) ||
      (l.sourceId === args.targetId && l.sourceType === args.targetType &&
       l.targetId === args.sourceId && l.targetType === args.sourceType)
    )
    if (existing) return existing

    const link: Link = {
      id: uid(),
      sourceId: args.sourceId, sourceType: args.sourceType,
      targetId: args.targetId, targetType: args.targetType,
      label: args.label,
      relationshipType: args.label ?? null,
      aiLineage: false,
      semanticColorId: null,
      weight: null,
      createdAt: now()
    }
    return createIn<Link>('links', link, 'links')
  }, [])
  const updateLink = useCallback(async (id: string, patch: Patch<Link>) => {
    return updateIn<Link>('links', id, patch, 'links')
  }, [])
  const deleteLink = useCallback(async (id: string) => {
    return deleteIn<Link>('links', id, 'links')
  }, [])

  // ===========================================================================
  // Sweep 6: tags
  // ===========================================================================
  const createTag = useCallback(async (name: string, colour?: string) => {
    const tag: Tag = { id: uid(), name, colour, createdAt: now() }
    return createIn<Tag>('tags', tag, 'tags')
  }, [])
  const updateTag = useCallback(async (id: string, patch: Patch<Tag>) => {
    return updateIn<Tag>('tags', id, patch, 'tags')
  }, [])
  const deleteTag = useCallback(async (id: string) => {
    // Cascade: remove every tagLink that points at this tag.
    const orphanLinks = stateRef.current.tagLinks.filter((tl) => tl.tagId === id)
    setState((s) => ({
      ...s,
      tags: s.tags.filter((t) => t.id !== id),
      tagLinks: s.tagLinks.filter((tl) => tl.tagId !== id)
    }))
    await dbDelete('tags', id)
    for (const tl of orphanLinks) await dbDelete('tagLinks', tl.id)
  }, [])
  const tagItem = useCallback(async (args: { tagId: string, targetId: string, targetType: LinkableType }) => {
    // Idempotent: if the same triple already exists, return it.
    const existing = stateRef.current.tagLinks.find((tl) =>
      tl.tagId === args.tagId && tl.targetId === args.targetId && tl.targetType === args.targetType)
    if (existing) return existing
    const tl: TagLink = { id: uid(), ...args }
    return createIn<TagLink>('tagLinks', tl, 'tagLinks')
  }, [])
  const untagItem = useCallback(async (tagLinkId: string) => {
    return deleteIn<TagLink>('tagLinks', tagLinkId, 'tagLinks')
  }, [])

  // ===========================================================================
  // Sweep 6: docker (Scratchpad + Clipboard)
  // ===========================================================================
  const createScratch = useCallback(async (title?: string) => {
    const list = stateRef.current.dockerScratch
    const sc: DockerScratch = {
      id: uid(),
      tabIndex: nextTabIndex(list),
      title: title ?? 'New tab',
      body: '',
      updatedAt: now()
    }
    return createIn<DockerScratch>('dockerScratch', sc, 'dockerScratch')
  }, [])
  const updateScratch = useCallback(async (id: string, patch: Patch<DockerScratch>) => {
    return updateIn<DockerScratch>('dockerScratch', id, { ...patch, updatedAt: now() }, 'dockerScratch')
  }, [])
  const deleteScratch = useCallback(async (id: string) => {
    return deleteIn<DockerScratch>('dockerScratch', id, 'dockerScratch')
  }, [])
  const reorderScratch = useCallback(async (id: string, direction: -1 | 1) => {
    // Reorder by tabIndex (treated as `order`).
    const all = stateRef.current.dockerScratch.map((s) => ({ ...s, order: s.tabIndex }))
    const reordered = reorderInList(all, id, direction)
    const synced = reordered.map((x) => ({ ...x, tabIndex: x.order }))
    setState((s) => ({
      ...s,
      dockerScratch: s.dockerScratch.map((sc) => {
        const upd = synced.find((r) => r.id === sc.id)
        return upd ? { ...sc, tabIndex: upd.tabIndex } : sc
      })
    }))
    for (const upd of synced) {
      const before = stateRef.current.dockerScratch.find((s) => s.id === upd.id)
      if (before && before.tabIndex !== upd.tabIndex) {
        const { order: _drop, ...row } = upd as any
        await dbPut('dockerScratch', row)
      }
    }
  }, [])

  const captureClipboard = useCallback(async (args: { text: string, sourceLabel?: string }) => {
    const c: DockerClipboard = {
      id: uid(),
      text: args.text,
      sourceLabel: args.sourceLabel,
      capturedAt: now()
    }
    return createIn<DockerClipboard>('dockerClipboard', c, 'dockerClipboard')
  }, [])
  const removeClipboard = useCallback(async (id: string) => {
    return deleteIn<DockerClipboard>('dockerClipboard', id, 'dockerClipboard')
  }, [])

  // ===========================================================================
  // Sweep 6: snapshots
  // ===========================================================================
  const createSnapshot = useCallback(async (args: {
    recordId: string, recordType: LinkableType, label: string, data: string
  }) => {
    const snap: Snapshot = {
      id: uid(),
      recordId: args.recordId,
      recordType: args.recordType,
      label: args.label,
      data: args.data,
      createdAt: now()
    }
    return createIn<Snapshot>('snapshots', snap, 'snapshots')
  }, [])
  const deleteSnapshot = useCallback(async (id: string) => {
    return deleteIn<Snapshot>('snapshots', id, 'snapshots')
  }, [])

  // ===========================================================================
  // Sweep 6: patterns
  // ===========================================================================
  const createPattern = useCallback(async (init?: Partial<Pattern>) => {
    const p: Pattern = {
      id: uid(),
      name: init?.name ?? 'Untitled pattern',
      description: init?.description ?? '',
      type: init?.type ?? 'snippet',
      tags: init?.tags ?? [],
      body: init?.body ?? '',
      projectId: init?.projectId,
      createdAt: now(), updatedAt: now()
    }
    return createIn<Pattern>('patterns', p, 'patterns')
  }, [])
  const updatePattern = useCallback(async (id: string, patch: Patch<Pattern>) => {
    return updateIn<Pattern>('patterns', id, patch, 'patterns', true)
  }, [])
  const deletePattern = useCallback(async (id: string) => {
    const linkOrphans = collectLinkOrphans(id, 'pattern')
    setState((s) => ({
      ...s,
      links: s.links.filter((l) => !linkOrphans.some((o) => o.id === l.id))
    }))
    for (const l of linkOrphans) await dbDelete('links', l.id)
    return deleteIn<Pattern>('patterns', id, 'patterns')
  }, [])
  const softDeletePattern = useCallback(async (id: string) => {
    await autoSnapshotBeforeSoftDelete('pattern', id)
    return softDeleteIn<Pattern>('patterns', id, 'patterns')
  }, [])
  const restorePattern = useCallback(async (id: string) => {
    return restoreIn<Pattern>('patterns', id, 'patterns')
  }, [])

  // ===========================================================================
  // v0.02: Prompt Studio compose drafts
  // ===========================================================================
  const createPrompt = useCallback(async (data: Pick<Prompt, 'title'> & Partial<Pick<Prompt, 'body'>>) => {
    const prompt = normalizePersistedRowForStore('prompts', {
      id: uid(),
      title: data.title || 'Untitled prompt',
      body: data.body ?? '',
      createdAt: now(),
      updatedAt: now()
    }) as Prompt
    setState((s) => ({
      ...s,
      prompts: activePrompts([...s.prompts, prompt])
    }))
    await dbPut('prompts', prompt)
    return prompt
  }, [])

  const updatePrompt = useCallback(async (id: string, data: Partial<Pick<Prompt, 'title' | 'body'>>) => {
    const cur = stateRef.current.prompts.find((p) => p.id === id)
    if (!cur) return
    const next = normalizePersistedRowForStore('prompts', { ...cur, ...data, updatedAt: now() }) as Prompt
    setState((s) => ({
      ...s,
      prompts: activePrompts(s.prompts.map((p) => p.id === id ? next : p))
    }))
    await dbPut('prompts', next)
  }, [])

  const softDeletePrompt = useCallback(async (id: string) => {
    const cur = stateRef.current.prompts.find((p) => p.id === id)
    if (!cur) return
    const next = normalizePersistedRowForStore('prompts', { ...cur, deletedAt: now(), updatedAt: now() }) as Prompt
    setState((s) => ({
      ...s,
      prompts: s.prompts.filter((p) => p.id !== id)
    }))
    await dbPut('prompts', next)
  }, [])

  // ===========================================================================
  // Sweep 6: prompt pipelines and blocks
  // ===========================================================================
  const createPipeline = useCallback(async (name?: string) => {
    const p: PromptPipeline = {
      id: uid(),
      name: name ?? 'Untitled prompt/pipeline',
      description: '',
      outputTarget: null,
      createdAt: now(), updatedAt: now()
    }
    return createIn<PromptPipeline>('promptPipelines', p, 'pipelines')
  }, [])
  const updatePipeline = useCallback(async (id: string, patch: Patch<PromptPipeline>) => {
    return updateIn<PromptPipeline>('promptPipelines', id, patch, 'pipelines', true)
  }, [])
  const deletePipeline = useCallback(async (id: string) => {
    // Cascade-delete child blocks.
    const orphanBlocks = stateRef.current.blocks.filter((b) => b.pipelineId === id)
    // Sweep 23: cascade Links touching the pipeline.
    const linkOrphans = collectLinkOrphans(id, 'pipeline')
    setState((s) => ({
      ...s,
      pipelines: s.pipelines.filter((p) => p.id !== id),
      blocks:    s.blocks.filter((b) => b.pipelineId !== id),
      links:     s.links.filter((l) => !linkOrphans.some((o) => o.id === l.id))
    }))
    await dbDelete('promptPipelines', id)
    for (const b of orphanBlocks) await dbDelete('promptBlocks', b.id)
    for (const l of linkOrphans) await dbDelete('links', l.id)
  }, [])
  const softDeletePipeline = useCallback(async (id: string) => {
    await autoSnapshotBeforeSoftDelete('pipeline', id)
    return softDeleteIn<PromptPipeline>('promptPipelines', id, 'pipelines')
  }, [])
  const restorePipeline = useCallback(async (id: string) => {
    return restoreIn<PromptPipeline>('promptPipelines', id, 'pipelines')
  }, [])

  const createBlock = useCallback(async (
    pipelineId: string, type?: PromptBlockType, label?: string
  ) => {
    const siblings = stateRef.current.blocks.filter((b) => b.pipelineId === pipelineId)
    const blk: PromptBlock = {
      id: uid(),
      pipelineId,
      type: type ?? 'task',
      label: label ?? '',
      body: '',
      order: nextOrder(siblings)
    }
    return createIn<PromptBlock>('promptBlocks', blk, 'blocks')
  }, [])
  const updateBlock = useCallback(async (id: string, patch: Patch<PromptBlock>) => {
    return updateIn<PromptBlock>('promptBlocks', id, patch, 'blocks')
  }, [])
  const deleteBlock = useCallback(async (id: string) => {
    return deleteIn<PromptBlock>('promptBlocks', id, 'blocks')
  }, [])
  const reorderBlock = useCallback(async (id: string, direction: -1 | 1) => {
    const cur = stateRef.current.blocks.find((b) => b.id === id)
    if (!cur) return
    const siblings = stateRef.current.blocks.filter((b) => b.pipelineId === cur.pipelineId)
    const reordered = reorderInList(siblings, id, direction)
    setState((s) => ({
      ...s,
      blocks: s.blocks.map((b) => reordered.find((r) => r.id === b.id) ?? b)
    }))
    for (const sib of reordered) {
      const before = siblings.find((s) => s.id === sib.id)
      if (before && before.order !== sib.order) await dbPut('promptBlocks', sib)
    }
  }, [])

  // ===========================================================================
  // Workspace-level
  // ===========================================================================
  const exportWorkspace = useCallback(async () => {
    const out: Record<string, any> = { schemaVersion: SCHEMA_VERSION, exportedAt: now() }
    for (const store of STORES) {
      const rows = await dbGetAll(store)
      out[store] = rows.map((row) => serializeRowForWorkspaceExport(store, row))
    }
    return out
  }, [])

  const importWorkspace = useCallback(async (data: any, mode: 'merge' | 'replace') => {
    if (!data || typeof data !== 'object') {
      return { ok: false, message: 'Not a valid workspace file.' }
    }
    const incoming = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0
    if (incoming > SCHEMA_VERSION || incoming < 1) {
      return {
        ok: false,
        message: `Schema mismatch. Expected ≤ ${SCHEMA_VERSION}, found ${data.schemaVersion ?? '(missing)'}.`
      }
    }
    if (mode === 'replace') {
      await dbClearAll()
    }
    // v2 → v3: backfill Pattern.tags chip-strings into Tag + TagLink records.
    // Mutate the incoming arrays in-place (data is typed as any) so the
    // existing per-store loop below writes the migrated rows automatically.
    if (incoming < 3) {
      const migrated = migratePatternTagsV2ToV3(
        Array.isArray(data.tags)     ? data.tags     : [],
        Array.isArray(data.tagLinks) ? data.tagLinks : [],
        Array.isArray(data.patterns) ? data.patterns : []
      )
      data.tags     = migrated.tags
      data.tagLinks = migrated.tagLinks
      data.patterns = migrated.patterns
    }
    for (const store of STORES) {
      let rows = data[store]
      if (!Array.isArray(rows)) continue
      // v1 → v2: rewrite shelf rows whose type === 'project' to type === 'longform'.
      if (store === 'shelf' && incoming < 2) {
        rows = rows.map(migrateShelfV1ToV2)
      }
      rows = rows.map((row: any) => normalizePersistedRowForStore(store, row))
      await dbBulkPut(store, rows)
    }
    await dbPut('meta', { key: 'schemaVersion', value: SCHEMA_VERSION })
    await dbPut('meta', { key: 'seeded', value: true })
    const fresh = await hydrateAllStores()
    setState((s) => ({ ...s, ready: true, error: null, ...fresh }))
    return { ok: true }
  }, [])

  const wipeWorkspace = useCallback(async () => {
    await dbClearAll()
    await seedPlaceholder()
    const fresh = await hydrateAllStores()
    setState((s) => ({ ...s, ready: true, error: null, ...fresh }))
  }, [])

  // ===========================================================================
  // Sweep 23: inbox capture
  // ===========================================================================
  const createInboxItem = useCallback(async (partial?: Partial<InboxItem>) => {
    const item: InboxItem = {
      id: uid(),
      title: partial?.title ?? '',
      body: partial?.body ?? '',
      createdAt: now(),
      updatedAt: now(),
      dueAt: partial?.dueAt,
      recurrence: partial?.recurrence,
      lastFiredAt: partial?.lastFiredAt,
      dismissedAt: partial?.dismissedAt,
      doneAt: partial?.doneAt
    }
    return createIn<InboxItem>('inboxItems', item, 'inboxItems')
  }, [])

  const updateInboxItem = useCallback(async (
    id: string,
    patch: Patch<InboxItem>,
    opts?: { touch?: boolean }
  ) => {
    return updateIn<InboxItem>('inboxItems', id, patch, 'inboxItems', !!opts?.touch)
  }, [])

  const softDeleteInboxItem = useCallback(async (id: string) => {
    // No autoSnapshotBeforeSoftDelete — InboxItem is not a LinkableType and
    // Snapshots cannot be taken of it.
    return softDeleteIn<InboxItem>('inboxItems', id, 'inboxItems')
  }, [])

  const restoreInboxItem = useCallback(async (id: string) => {
    return restoreIn<InboxItem>('inboxItems', id, 'inboxItems')
  }, [])

  const deleteInboxItem = useCallback(async (id: string) => {
    return deleteIn<InboxItem>('inboxItems', id, 'inboxItems')
  }, [])

  const markInboxItemDone = useCallback(async (id: string) => {
    return updateIn<InboxItem>(
      'inboxItems', id, { doneAt: now(), dueAt: undefined }, 'inboxItems'
    )
  }, [])

  const dismissInboxItem = useCallback(async (id: string) => {
    return updateIn<InboxItem>(
      'inboxItems', id, { dismissedAt: now(), dueAt: undefined }, 'inboxItems'
    )
  }, [])

  const routeInboxItemTo = useCallback(async (
    inboxId: string, kind: RouteKind
  ): Promise<string | null> => {
    const item = stateRef.current.inboxItems.find((i) => i.id === inboxId)
    if (!item) return null
    if (item.deletedAt || item.dismissedAt || item.doneAt) return null

    const title = item.title || 'Untitled'
    let newId: string
    switch (kind) {
      case 'document': {
        const created = await createIn<Document>('writingDocs', {
          id: uid(),
          title,
          body: item.body,
          convertedFromId: item.id,
          convertedFromType: 'inboxItems' as StoreName,
          convertedAt: now(),
          aiLineage: false,
          isSeedData: false,
          createdAt: now(), updatedAt: now()
        }, 'documents')
        newId = created.id
        break
      }
      case 'poem': {
        const created = await createIn<Poem>('poems', {
          id: uid(),
          title,
          body: item.body,
          convertedFromId: item.id,
          convertedFromType: 'inboxItems' as StoreName,
          convertedAt: now(),
          aiLineage: false,
          isSeedData: false,
          createdAt: now(), updatedAt: now()
        }, 'poems')
        newId = created.id
        break
      }
      case 'note': {  // Sweep 27 — same shape as poem
        const created = await createIn<Note>('notes', {
          id: uid(),
          title,
          body: item.body,
          convertedFromId: item.id,
          convertedFromType: 'inboxItems' as StoreName,
          convertedAt: now(),
          aiLineage: false,
          isSeedData: false,
          createdAt: now(), updatedAt: now()
        }, 'notes')
        newId = created.id
        break
      }
      case 'longform': {
        // Longform docs hold sections, not body. Body is intentionally
        // discarded here — the routing UI warns the user beforehand.
        const created = await createIn<LongformDoc>('longformProjects', {
          id: uid(),
          title,
          convertedFromId: item.id,
          convertedFromType: 'inboxItems' as StoreName,
          convertedAt: now(),
          aiLineage: false,
          isSeedData: false,
          createdAt: now(), updatedAt: now()
        }, 'longformDocs')
        newId = created.id
        break
      }
      case 'pattern': {
        const created = await createIn<Pattern>('patterns', {
          id: uid(),
          name: title,
          description: '',
          type: 'general',
          tags: [],
          body: item.body,
          convertedFromId: item.id,
          convertedFromType: 'inboxItems' as StoreName,
          convertedAt: now(),
          aiLineage: false,
          isSeedData: false,
          createdAt: now(), updatedAt: now()
        }, 'patterns')
        newId = created.id
        break
      }
      case 'pipeline': {
        const created = await createIn<PromptPipeline>('promptPipelines', {
          id: uid(),
          name: title,
          description: item.body,
          outputTarget: null,
          convertedFromId: item.id,
          convertedFromType: 'inboxItems' as StoreName,
          convertedAt: now(),
          aiLineage: false,
          isSeedData: false,
          createdAt: now(), updatedAt: now()
        }, 'pipelines')
        newId = created.id
        break
      }
      case 'build': {
        const created = await createIn<AppDesignBuild>('appDesignBuilds', {
          id: uid(),
          name: title,
          description: item.body,
          status: 'drafting',
          platform: '',
          convertedFromId: item.id,
          convertedFromType: 'inboxItems' as StoreName,
          convertedAt: now(),
          aiLineage: false,
          isSeedData: false,
          createdAt: now(), updatedAt: now()
        }, 'builds')
        newId = created.id
        break
      }
      case 'scrap': {
        const body = [item.title, item.body].filter(Boolean).join('\n').trim()
        const created = await createIn<Scrap>('scraps', {
          id: uid(),
          projectId: null,
          body,
          sourceLabel: 'from inbox',
          convertedFromId: item.id,
          convertedFromType: 'inboxItems' as StoreName,
          convertedAt: now(),
          aiLineage: false,
          isSeedData: false,
          createdAt: now(), updatedAt: now()
        }, 'scraps')
        newId = created.id
        break
      }
      default: return null
    }

    // Soft-delete (don't hard-delete — user might want to recover).
    await softDeleteIn<InboxItem>('inboxItems', inboxId, 'inboxItems')
    return newId
  }, [])

  const convertRecord = useCallback(async ({
    kind, sourceId, targetDocId, migrateTags = true
  }: {
    kind: ConversionKind
    sourceId: string
    targetDocId?: string
    migrateTags?: boolean
  }): Promise<{ newId: string }> => {
    const id = uid()
    const s = stateRef.current

    switch (kind) {
      case 'scrap-to-note': {
        const src = s.scraps.find((r) => r.id === sourceId)
        if (!src) throw new Error('Source scrap not found')
        const fields = scrapToNote(src)
        await createIn<Note>('notes', { id, ...fields }, 'notes')
        break
      }

      case 'scrap-to-block': {
        const src = s.scraps.find((r) => r.id === sourceId)
        if (!src) throw new Error('Source scrap not found')
        const fields = scrapToBlock(src)
        await createIn<Pattern>('patterns', { id, ...fields }, 'patterns')
        break
      }

      case 'inbox-to-note': {
        const src = s.inboxItems.find((r) => r.id === sourceId)
        if (!src) throw new Error('Source inbox item not found')
        const fields = inboxToNote(src)
        await createIn<Note>('notes', { id, ...fields }, 'notes')
        await softDeleteIn<InboxItem>('inboxItems', sourceId, 'inboxItems')
        break
      }

      case 'inbox-to-scrap': {
        const src = s.inboxItems.find((r) => r.id === sourceId)
        if (!src) throw new Error('Source inbox item not found')
        const fields = inboxToScrap(src)
        await createIn<Scrap>('scraps', { id, ...fields }, 'scraps')
        await softDeleteIn<InboxItem>('inboxItems', sourceId, 'inboxItems')
        break
      }

      case 'note-to-section': {
        if (!targetDocId) throw new Error('targetDocId required for note-to-section')
        const src = s.notes.find((r) => r.id === sourceId)
        if (!src) throw new Error('Source note not found')
        const existingSections = s.sections.filter((sec) => sec.projectId === targetDocId)
        const order = existingSections.length > 0
          ? Math.max(...existingSections.map((sec) => sec.order)) + 1
          : 0
        const fields = noteToSection(src, targetDocId, order)
        await createIn<LongformSection>('longformSections', { id, ...fields }, 'sections')
        break
      }

      default:
        throw new Error(`Unknown conversion kind: ${kind}`)
    }

    if (migrateTags) {
      const typeMap: Record<ConversionKind, { targetType: LinkableType }> = {
        'scrap-to-note': { targetType: 'note' },
        'scrap-to-block': { targetType: 'pattern' },
        'inbox-to-note': { targetType: 'note' },
        'inbox-to-scrap': { targetType: 'scrap' },
        'note-to-section': { targetType: 'longform-section' },
      }
      const { targetType } = typeMap[kind]
      const srcTagLinks = s.tagLinks.filter((tl) => tl.targetId === sourceId)
      for (const tl of srcTagLinks) {
        await createIn<TagLink>('tagLinks', {
          id: uid(),
          tagId: tl.tagId,
          targetId: id,
          targetType,
        }, 'tagLinks')
      }
    }

    return { newId: id }
  }, [])

  // ===========================================================================
  // Sweep 23: Atlas node positions
  // ===========================================================================
  const setNodePosition = useCallback(async (
    syntheticId: string, x: number, y: number, pinned?: boolean
  ) => {
    const cur = stateRef.current.nodePositions.find((p) => p.id === syntheticId)
    if (cur) {
      return updateIn<NodePosition>(
        'nodePositions', syntheticId, { x, y, pinned }, 'nodePositions'
      )
    }
    const next: NodePosition = { id: syntheticId, x, y, pinned }
    setState((s) => ({
      ...s,
      nodePositions: [...s.nodePositions, next]
    }))
    await dbPut('nodePositions', next)
  }, [])

  const getNodePosition = useCallback((syntheticId: string): NodePosition | undefined => {
    // Bug 2.9 (Sweep 26 — deferred): O(n) array scan. Not a bug today
    // because n stays under ~50 in normal use. If Atlas grows past ~500
    // nodes consider an indexed lookup (Map<string, NodePosition>).
    return stateRef.current.nodePositions.find((p) => p.id === syntheticId)
  }, [])

  const clearNodePositions = useCallback(async () => {
    // Bug 2.8 (Sweep 26): parallelize the IDB deletes. Pre-26 this loop
    // ran N sequential `await dbDelete(...)` calls; on a 100-node
    // workspace that's 100 sequential IDB transactions, which left the
    // background "really clear" trailing the optimistic UI clear by
    // multiple seconds. If the user reloaded mid-clear the positions
    // half-survived. Promise.all collapses the wait to one round-trip.
    const all = stateRef.current.nodePositions
    setState((s) => ({ ...s, nodePositions: [] }))
    await Promise.all(all.map((p) => dbDelete('nodePositions', p.id)))
  }, [])

  // ===========================================================================
  // Sweep 23: active record + reminder engine + notification queue
  // ===========================================================================
  const [activeRecord, setActiveRecordState] = useState<{ id: string, type: LinkableType } | null>(null)
  const setActiveRecord = useCallback((r: { id: string, type: LinkableType } | null) => {
    setActiveRecordState(r)
  }, [])

  // Notification queue: ref + tick counter so two consumers (toast + badge)
  // re-read when the engine fires. NOT a global event bus — single ref under
  // this provider. See the InboxNotification block in the API doc.
  const notificationQueueRef = useRef<InboxNotification[]>([])
  const [notificationTick, setNotificationTick] = useState(0)

  const dismissNotification = useCallback((id: string) => {
    notificationQueueRef.current = notificationQueueRef.current.filter((n) => n.id !== id)
    setNotificationTick((t) => t + 1)
  }, [])

  /**
   * Run a reminder pass. If silent, fires patches without enqueuing toasts.
   * Used both by setInterval ticks (non-silent) and by the catch-up pass on
   * boot (silent).
   */
  const runReminderPass = useCallback(async (silent: boolean): Promise<void> => {
    const items = stateRef.current.inboxItems
    let anyFired = false
    for (const item of items) {
      const decision = evaluateInboxItem(item, Date.now())
      if (!decision) continue
      // Persist the patch.
      await updateIn<InboxItem>('inboxItems', item.id, decision.patch, 'inboxItems')
      if (!silent) {
        notificationQueueRef.current = [
          ...notificationQueueRef.current,
          {
            id: uid(),
            inboxId: item.id,
            title: item.title || 'Untitled',
            firedAt: Date.now()
          }
        ]
        anyFired = true
      }
    }
    if (anyFired) setNotificationTick((t) => t + 1)
  }, [])

  const tickReminders = useCallback(() => {
    // Fire-and-forget; tests await via a small timeout.
    runReminderPass(false)
  }, [runReminderPass])

  // Mount the interval after first hydration (state.ready becomes true).
  // The catch-up pass runs once, silently.
  const remindersBootedRef = useRef(false)
  useEffect(() => {
    if (!state.ready) return
    if (remindersBootedRef.current) return
    remindersBootedRef.current = true

    // Silent catch-up pass first.
    runReminderPass(true)

    // Then a regular interval at 30s.
    const handle = window.setInterval(() => {
      runReminderPass(false)
    }, 30_000)
    return () => {
      window.clearInterval(handle)
    }
  }, [state.ready, runReminderPass])

  // window.__verseStudio test injection. Guarded so SSR / non-browser harnesses
  // don't crash. Reassigned each render so the closures see fresh state.
  if (typeof window !== 'undefined') {
    ;(window as any).__verseStudio = {
      tickReminders,
      getState: () => stateRef.current,
      // Sweep 23.2: minimal API surface for M4 (deleteProject detach assertion).
      createProject,
      createDocument,
      updateDocument,
      deleteProject,
      // Sweep 26: extra exposures for Block R (Canvas/Atlas hygiene tests).
      // Pure pass-through to existing CRUD — no new methods, no schema
      // changes. Pattern set by Sweep 23.2; the surface is test-only and
      // does not constitute a frozen-four unfreeze.
      createLink,
      deleteLink,
      setNodePosition,
      clearNodePositions,
      createLongformDoc,
      updateLongformDoc,
      createSection,
      createPoem,
      updatePoem,
      // Sweep 27: Notes test injection (Block S).
      createNote,
      updateNote,
      softDeleteNote,
      restoreNote,
      deleteNote,
      createScrap,
      updateScrap,
      softDeleteScrap,
      purgeScrap,
      createPrompt,
      updatePrompt,
      softDeletePrompt,
      tagItem,
      createInboxItem,
      routeInboxItemTo,
      convertRecord,
      addToShelf,
      createSnapshot
    }
  }

  const value: API = {
    ...state,
    createDocument, updateDocument, deleteDocument, softDeleteDocument, restoreDocument,
    createPoem, updatePoem, deletePoem, softDeletePoem, restorePoem,
    // Sweep 27
    createNote, updateNote, deleteNote, softDeleteNote, restoreNote,
    // Sweep 37
    createScrap, updateScrap, softDeleteScrap, purgeScrap,
    createLongformDoc, updateLongformDoc, deleteLongformDoc, softDeleteLongformDoc, restoreLongformDoc,
    createSection, updateSection, deleteSection, reorderSection,
    createBuild, updateBuild, deleteBuild, softDeleteBuild, restoreBuild,
    createConstraint, updateConstraint, deleteConstraint, reorderConstraint,
    createFeature, updateFeature, deleteFeature, reorderFeature,
    createScreen, updateScreen, deleteScreen, reorderScreen,
    createDataShape, updateDataShape, deleteDataShape, reorderDataShape,
    createPhase, updatePhase, setActivePhase, deletePhase, reorderPhase,
    createReview, updateReview, deleteReview,
    addToShelf, removeFromShelf, isOnShelf, shelfTitleFor,
    createProject, updateProject, deleteProject,
    createLink, updateLink, deleteLink,
    createTag, updateTag, deleteTag, tagItem, untagItem,
    createScratch, updateScratch, deleteScratch, reorderScratch,
    captureClipboard, removeClipboard,
    createSnapshot, deleteSnapshot,
    createPattern, updatePattern, deletePattern, softDeletePattern, restorePattern,
    createPrompt, updatePrompt, softDeletePrompt,
    createPipeline, updatePipeline, deletePipeline, softDeletePipeline, restorePipeline,
    createBlock, updateBlock, deleteBlock, reorderBlock,
    // Sweep 23
    createInboxItem, updateInboxItem, softDeleteInboxItem, restoreInboxItem,
    deleteInboxItem, markInboxItemDone, dismissInboxItem, routeInboxItemTo, convertRecord,
    setNodePosition, getNodePosition, clearNodePositions,
    activeRecord, setActiveRecord, tickReminders,
    notificationQueue: notificationQueueRef.current, notificationTick, dismissNotification,
    exportWorkspace, importWorkspace, wipeWorkspace
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
