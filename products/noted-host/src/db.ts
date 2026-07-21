import { openDB, IDBPDatabase } from 'idb'

/**
 * SCHEMA_VERSION — the export-file format version.
 *
 *   v1: sweeps 1–5 (13 stores, ShelfItem.type included 'project' meaning longform)
 *   v2: Sweep 6   (23 stores; ShelfItem.type 'project' renamed to 'longform';
 *                  'project' now means a universal Project container)
 *   v3: Sweep 18  (Pattern.tags chip-strings backfilled into Tag + TagLink
 *                  records; Pattern.tags field emptied and deprecated)
 *   v4: Sweep 23  (additive: `inboxItems` and `nodePositions` stores)
 *   v5: Sweep 27  (additive: `notes` store, no record-rewrite migration)
 *   v6: recovery version bump only for already-opened installed databases
 *   v7: Sweep 37  (additive: `scraps` store, no record-rewrite migration)
 *   v8: v0.02     (additive: `prompts` store for Prompt Studio drafts)
 *   v9: Sweep 36  (additive: high-frequency indexes and early lineage/export fields.
 *                  These concepts were partially introduced here.)
 *   v10: Sweep 45 (additive: optional LongformSection.status, plus by_status index on
 *                  longformSections. No row rewrites; undefined behaves as draft.)
 *   v11: Sweep 57 (additive: formal canonical lineage/AI/export relationship schema
 *                  alignment. No destructive row rewrites; defaults normalize at read/write.)
 *
 * `importWorkspace` accepts files with `schemaVersion <= SCHEMA_VERSION` and
 * applies migrations on the way in. v1 files are still loadable; their shelf
 * rows get rewritten via {@link migrateShelfV1ToV2}. v3 import files load
 * fine; they simply have no inbox items or node positions, which is the
 * empty state. v4 export files load fine; they have zero notes, which is
 * the correct empty state.
 */
export const SCHEMA_VERSION = 10

export const DB_NAME = 'verse-studio'

/**
 * DB_VERSION — IndexedDB internal schema version.
 *
 *   v1: 13 stores
 *   v2: 23 stores; in-place rewrite of any shelf row whose type === 'project'
 *       to type === 'longform' (so Sweep-5 users keep their shelved drafts).
 *   v3: Sweep 18; Pattern.tags chip-strings backfilled into Tag + TagLink
 *       records via {@link migratePatternTagsV2ToV3}.
 *   v4: Sweep 23; additive — new stores `inboxItems` and `nodePositions`.
 *       The per-store creation loop in `upgrade` handles the create.
 *   v5: Sweep 27; additive — new store `notes`. No record rewrites.
 *   v6: recovery version bump only. No record rewrites.
 *   v7: Sweep 37; additive — new store `scraps`. No record rewrites.
 *   v8: v0.02; additive — new store `prompts`. No record rewrites.
 *   v9: Sweep 36; additive — no store additions; adds IDB indexes on high-frequency
 *       stores for projectId, createdAt, updatedAt, deletedAt. No row rewrites.
 *       Early lineage/export fields began appearing here.
 *   v10: Sweep 45; additive — optional LongformSection.status and a by_status
 *       index on longformSections. No row rewrites; undefined means draft.
 *   v11: Sweep 57; additive — formal canonical lineage/AI/export relationship
 *       schema alignment. Existing rows are not bulk-rewritten; read/write boundaries
 *       normalize missing booleans/null fields.
 */
export const DB_VERSION = 11

export const STORES = [
  // v1 stores — names preserved.
  'meta',
  'writingDocs',
  'poems',
  // FROZEN: 'longformProjects' is a v1 keyed store. The TypeScript type stored
  // here was renamed (LongformProject → LongformDoc) but the IDB store name
  // MUST stay to avoid a record-rewrite migration.
  'longformProjects',
  'longformSections',
  'appDesignBuilds',
  'appDesignConstraints',
  'appDesignFeatures',
  'appDesignScreens',
  'appDesignDataShapes',
  'appDesignPhases',
  'appDesignReviews',
  'shelf',

  // v2 additions (Sweep 6)
  'projects',         // universal Project containers
  'links',            // record-to-record links
  'tags',             // global tag definitions
  'tagLinks',         // tag→record junctions
  'dockerScratch',    // Docker scratchpad tabs
  'dockerClipboard',  // Docker clipboard history
  'snapshots',        // manual record snapshots
  'patterns',         // Feature Library entries
  'promptPipelines',  // Prompt Studio pipelines
  'promptBlocks',     // ordered blocks within pipelines

  // v4 additions (Sweep 23)
  'inboxItems',       // Inbox capture surface
  'nodePositions',    // Atlas persisted (x, y) per synthetic node id

  // v5 additions (Sweep 27)
  'notes',            // free-form Notes record type

  // v7 additions (Sweep 37)
  'scraps',           // project-linked quick captures

  // v8 additions (v0.02)
  'prompts'           // Prompt Studio compose drafts
] as const

export type StoreName = typeof STORES[number]

const LINEAGE_STORES = new Set<StoreName>([
  'writingDocs', 'poems', 'longformProjects', 'longformSections',
  'appDesignBuilds', 'appDesignConstraints', 'appDesignFeatures',
  'appDesignScreens', 'appDesignDataShapes', 'appDesignPhases', 'appDesignReviews',
  'projects', 'patterns', 'promptPipelines', 'promptBlocks',
  'inboxItems', 'notes', 'scraps', 'prompts',
])

function finiteNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Sweep 57 read/write boundary normalization.
 *
 * This is intentionally non-destructive: old rows are not bulk-rewritten during
 * DB upgrade. Any row read into app state or written through the shared DB
 * helpers gets sane v11 defaults while preserving existing content and IDs.
 */
export function normalizePersistedRowForStore<T>(store: StoreName, value: T): T {
  if (!value || typeof value !== 'object') return value
  const row = value as Record<string, any>
  let next: Record<string, any> = row

  if (LINEAGE_STORES.has(store)) {
    next = {
      ...next,
      isSeedData: row.isSeedData === true,
      convertedFromId: row.convertedFromId ?? null,
      convertedFromType: row.convertedFromType ?? null,
      convertedAt: finiteNumberOrNull(row.convertedAt),
      aiLineage: row.aiLineage === true,
      contentHash: typeof row.contentHash === 'string' ? row.contentHash : null,
    }
  }

  if (store === 'promptPipelines') {
    next = {
      ...next,
      outputTarget: row.outputTarget ?? null,
    }
  }

  if (store === 'links') {
    const relationshipType =
      typeof row.relationshipType === 'string' && row.relationshipType.trim()
        ? row.relationshipType.trim()
        : typeof row.label === 'string' && row.label.trim()
          ? row.label.trim()
          : null
    next = {
      ...next,
      label: row.label ?? relationshipType ?? undefined,
      aiLineage: row.aiLineage === true,
      relationshipType,
      semanticColorId: row.semanticColorId ?? null,
      weight: finiteNumberOrNull(row.weight),
    }
  }

  return next as T
}

export function serializeRowForWorkspaceExport<T>(store: StoreName, value: T): T {
  const normalized = normalizePersistedRowForStore(store, value)
  if (store !== 'links' || !normalized || typeof normalized !== 'object') return normalized
  const row = normalized as Record<string, any>
  const label =
    typeof row.relationshipType === 'string' && row.relationshipType.trim()
      ? row.relationshipType.trim()
      : typeof row.label === 'string'
        ? row.label
        : undefined
  const { relationshipType: _relationshipType, ...rest } = row
  return { ...rest, label } as T
}

/**
 * Rewrites a shelf row whose `type` field carries the v1 value 'project'
 * (which meant "longform draft" pre-Sweep-6) into the v2 value 'longform'.
 *
 * Shared between the IDB upgrade callback and the import path so the same
 * migration applies regardless of whether data arrives via an in-place
 * upgrade or via a v1 export file.
 */
export function migrateShelfV1ToV2<T extends { type: string }>(row: T): T {
  if (row && row.type === 'project') {
    return { ...row, type: 'longform' as any }
  }
  return row
}

/**
 * Backfills the relational tag store from `Pattern.tags` chip-strings.
 *
 * For every chip-string on every Pattern: find-or-create a Tag with that
 * name (case-insensitive match against existing tags), then ensure a
 * TagLink exists for (patternId, tagId, 'pattern') — both `tagItem`-
 * style idempotency and case-insensitive name match. After backfill,
 * each Pattern's `tags` field is replaced with `[]`.
 *
 * Pure function — caller decides where the resulting arrays are written.
 * Shared between the IDB upgrade callback and the import path.
 */
export function migratePatternTagsV2ToV3(
  tags: Array<{ id: string; name: string; colour?: string; createdAt: number }>,
  tagLinks: Array<{ id: string; tagId: string; targetId: string; targetType: string }>,
  patterns: Array<{ id: string; tags: string[]; [key: string]: any }>
): {
  tags: Array<{ id: string; name: string; colour?: string; createdAt: number }>,
  tagLinks: Array<{ id: string; tagId: string; targetId: string; targetType: string }>,
  patterns: Array<{ id: string; tags: string[]; [key: string]: any }>
} {
  const outTags     = [...tags]
  const outTagLinks = [...tagLinks]
  const outPatterns = patterns.map((p) => {
    if (!Array.isArray(p.tags) || p.tags.length === 0) {
      return { ...p, tags: [] }
    }
    for (const chip of p.tags) {
      const name = String(chip).trim()
      if (!name) continue
      const nameLower = name.toLowerCase()

      // Find-or-create Tag (case-insensitive)
      let tag = outTags.find((t) => t.name.toLowerCase() === nameLower)
      if (!tag) {
        tag = {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
          name,
          createdAt: Date.now(),
        }
        outTags.push(tag)
      }

      // Idempotent TagLink creation
      const already = outTagLinks.some(
        (tl) => tl.tagId === tag!.id && tl.targetId === p.id && tl.targetType === 'pattern'
      )
      if (!already) {
        outTagLinks.push({
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
          tagId: tag.id,
          targetId: p.id,
          targetType: 'pattern',
        })
      }
    }
    return { ...p, tags: [] }
  })

  return { tags: outTags, tagLinks: outTagLinks, patterns: outPatterns }
}

export async function openWorkspaceDB(): Promise<IDBPDatabase> {
  let blockedReject: (error: unknown) => void = () => {}
  const blockedPromise = new Promise<never>((_resolve, reject) => {
    blockedReject = reject
  })
  let timeoutId: number | undefined
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = window.setTimeout(() => {
      reject({ code: 'DB_TIMEOUT', message: 'Database open timed out.' })
    }, 8000)
  })

  const openPromise = openDB(DB_NAME, DB_VERSION, {
    blocked() {
      console.warn('[Verse Studio] DB upgrade blocked — close other tabs.')
      blockedReject({ code: 'DB_BLOCKED', message: 'Database upgrade blocked by another tab.' })
    },
    async upgrade(db, oldVersion, _newVersion, tx) {
      try {
        // Create any stores that don't yet exist. Idempotent.
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) {
            const keyPath = name === 'meta' ? 'key' : 'id'
            db.createObjectStore(name, { keyPath })
          }
        }

        // v1 → v2: rewrite ShelfItem.type 'project' → 'longform'.
        // First-time installs hit this with oldVersion=0 and an empty shelf,
        // so the loop is a no-op for them.
        if (oldVersion < 2 && db.objectStoreNames.contains('shelf')) {
          const shelfStore = tx.objectStore('shelf')
          const all = await shelfStore.getAll()
          for (const row of all) {
            if (row && row.type === 'project') {
              await shelfStore.put({ ...row, type: 'longform' })
            }
          }
        }

        // v2 → v3: backfill Pattern.tags chip-strings into Tag + TagLink records.
        // First-time installs hit this with oldVersion=0 and empty stores —
        // migratePatternTagsV2ToV3 returns the empty arrays unchanged.
        if (oldVersion < 3 && db.objectStoreNames.contains('patterns')) {
          const tagStore     = tx.objectStore('tags')
          const tagLinkStore = tx.objectStore('tagLinks')
          const patStore     = tx.objectStore('patterns')
          const tagsAll      = await tagStore.getAll()
          const tagLinksAll  = await tagLinkStore.getAll()
          const patternsAll  = await patStore.getAll()
          const migrated = migratePatternTagsV2ToV3(tagsAll, tagLinksAll, patternsAll)
          // Write back. Use put() per row, not clear-and-put.
          for (const t  of migrated.tags)     await tagStore.put(t)
          for (const tl of migrated.tagLinks) await tagLinkStore.put(tl)
          for (const p  of migrated.patterns) await patStore.put(p)
        }

        // v3 → v4: additive only — new stores `inboxItems` and `nodePositions`
        // are created by the per-store loop above. No row rewrites needed.
        // First-time installs hit this with oldVersion=0 and the loop creates
        // every store; this block is here so future schema audits can find it.
        if (oldVersion < 4) {
          // No row migrations.
        }

        // v4 → v5: additive only — new store `notes` is created by the
        // per-store loop above. No row rewrites needed. v4 export files
        // load fine; they have zero notes, which is the correct empty state.
        if (oldVersion < 5) {
          // No row migrations.
        }

        // v5 → v6: version bump only. Some installed builds already created
        // an IndexedDB database at internal version 6. Opening it with DB_VERSION
        // 5 fails before the app can load. No store rewrite is required here.
        if (oldVersion < 6) {
          // No row migrations.
        }

        // v6 → v7: additive only — new store `scraps` is created by the
        // per-store loop above. No row rewrites needed.
        if (oldVersion < 7) {
          // No row migrations.
        }

        // v7 → v8: additive only — new store `prompts` is created by the
        // per-store loop above. No row rewrites needed.
        if (oldVersion < 8) {
          // No row migrations.
        }

        // v8 → v9: additive only — adds IDB indexes on high-frequency stores.
        // No row rewrites. New type fields default at read time.
        if (oldVersion < 9) {
          // Stores that carry projectId — index for fast project membership queries
          const projectIdStores = [
            'writingDocs', 'poems', 'notes', 'scraps',
            'longformProjects', 'appDesignBuilds', 'patterns', 'promptPipelines', 'prompts'
          ] as const

          for (const storeName of projectIdStores) {
            if (db.objectStoreNames.contains(storeName)) {
              const store = tx.objectStore(storeName)
              if (!store.indexNames.contains('by_projectId')) {
                store.createIndex('by_projectId', 'projectId', { unique: false })
              }
            }
          }

          // Stores that carry createdAt — index for chronological sort
          const createdAtStores = [
            'writingDocs', 'poems', 'notes', 'scraps',
            'longformProjects', 'longformSections', 'appDesignBuilds', 'patterns',
            'promptPipelines', 'inboxItems', 'links', 'snapshots', 'prompts'
          ] as const

          for (const storeName of createdAtStores) {
            if (db.objectStoreNames.contains(storeName)) {
              const store = tx.objectStore(storeName)
              if (!store.indexNames.contains('by_createdAt')) {
                store.createIndex('by_createdAt', 'createdAt', { unique: false })
              }
            }
          }

          // Stores that carry updatedAt — index for recency queries
          const updatedAtStores = [
            'writingDocs', 'poems', 'notes', 'scraps',
            'longformProjects', 'longformSections', 'appDesignBuilds', 'patterns',
            'promptPipelines', 'inboxItems', 'prompts'
          ] as const

          for (const storeName of updatedAtStores) {
            if (db.objectStoreNames.contains(storeName)) {
              const store = tx.objectStore(storeName)
              if (!store.indexNames.contains('by_updatedAt')) {
                store.createIndex('by_updatedAt', 'updatedAt', { unique: false })
              }
            }
          }

          // Stores that carry deletedAt — index for soft-delete queries
          const deletedAtStores = [
            'writingDocs', 'poems', 'notes', 'scraps',
            'longformProjects', 'appDesignBuilds', 'patterns',
            'promptPipelines', 'inboxItems', 'prompts'
          ] as const

          for (const storeName of deletedAtStores) {
            if (db.objectStoreNames.contains(storeName)) {
              const store = tx.objectStore(storeName)
              if (!store.indexNames.contains('by_deletedAt')) {
                store.createIndex('by_deletedAt', 'deletedAt', { unique: false })
              }
            }
          }

          // links store — index sourceId and targetId for backlink queries
          if (db.objectStoreNames.contains('links')) {
            const linksStore = tx.objectStore('links')
            if (!linksStore.indexNames.contains('by_sourceId')) {
              linksStore.createIndex('by_sourceId', 'sourceId', { unique: false })
            }
            if (!linksStore.indexNames.contains('by_targetId')) {
              linksStore.createIndex('by_targetId', 'targetId', { unique: false })
            }
          }

          // snapshots store — index recordId for fast per-record snapshot queries
          if (db.objectStoreNames.contains('snapshots')) {
            const snapshotsStore = tx.objectStore('snapshots')
            if (!snapshotsStore.indexNames.contains('by_recordId')) {
              snapshotsStore.createIndex('by_recordId', 'recordId', { unique: false })
            }
          }
        }

        // v9 → v10: additive only — optional LongformSection.status plus index.
        // No row rewrites. Legacy rows without status are treated as draft in UI.
        if (oldVersion < 10 && db.objectStoreNames.contains('longformSections')) {
          const sectionStore = tx.objectStore('longformSections')
          if (!sectionStore.indexNames.contains('by_status')) {
            sectionStore.createIndex('by_status', 'status', { unique: false })
          }
        }

        // v10 → v11: additive schema-canon alignment only. No destructive row
        // rewrite and no contentHash backfill; v11 defaults normalize at the
        // read/write/import boundaries. Record the current schema in meta so
        // diagnostics can reflect the formalized model after upgrade.
        if (oldVersion < 11 && db.objectStoreNames.contains('meta')) {
          const metaStore = tx.objectStore('meta')
          await metaStore.put({ key: 'schemaVersion', value: SCHEMA_VERSION })
          await metaStore.put({ key: 'dbVersion', value: DB_VERSION })
        }
      } catch (error) {
        console.error('[Verse Studio] DB upgrade failed:', error)
        throw error
      }
    }
  })

  try {
    const db = await Promise.race([openPromise, blockedPromise, timeoutPromise])
    ;(db as any).onversionchange = () => {
      db.close()
      console.warn('[Verse Studio] DB version changed in another tab. Closing.')
    }
    return db
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}

let _db: IDBPDatabase | null = null

export async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db
  _db = await openWorkspaceDB()
  return _db
}

export async function probeIndexedDB(): Promise<{ ok: true } | { ok: false, error: string }> {
  if (typeof indexedDB === 'undefined') {
    return { ok: false, error: 'IndexedDB is not available in this browser.' }
  }
  try {
    const db = await openWorkspaceDB()
    db.close()
    _db = null
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}

export async function dbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await getDB()
  return (await db.getAll(store)).map((row) => normalizePersistedRowForStore(store, row)) as T[]
}

export async function dbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await getDB()
  const row = await db.get(store, key)
  return row ? normalizePersistedRowForStore(store, row) as T : undefined
}

export async function dbPut<T extends object>(store: StoreName, value: T): Promise<void> {
  const db = await getDB()
  await db.put(store, normalizePersistedRowForStore(store, value))
}

export async function dbDelete(store: StoreName, key: string): Promise<void> {
  const db = await getDB()
  await db.delete(store, key)
}

export async function dbClear(store: StoreName): Promise<void> {
  const db = await getDB()
  await db.clear(store)
}

export async function dbClearAll(): Promise<void> {
  const db = await getDB()
  for (const s of STORES) await db.clear(s)
}

export async function dbBulkPut<T extends object>(store: StoreName, values: T[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(store, 'readwrite')
  for (const v of values) tx.store.put(normalizePersistedRowForStore(store, v))
  await tx.done
}
