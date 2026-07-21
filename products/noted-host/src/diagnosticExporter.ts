/**
 * VERIFICATION INFRASTRUCTURE — src/diagnosticExporter.ts
 * =========================================================
 * Born frozen (Sweep 51). Future changes require explicit UNFREEZE in the
 * sweep prompt, plus posting a fresh exporter_self_hash value in the delivery.
 * See LANDMINES.MD and PREFLIGHT.MD Section 3.5.
 *
 * Algorithm references: HANDY_CODE_SNIPPETS.MD "Build-time hash algorithms (Sweep 51)"
 *
 * Dependency direction: DiagnosticPanel.tsx → diagnosticExporter.ts
 * Do NOT import from DiagnosticPanel.tsx. Do NOT modify db.ts.
 */

import { openWorkspaceDB, DB_VERSION, SCHEMA_VERSION, STORES, DB_NAME } from './db'
import { APP_NAME, APP_VERSION } from './appMeta'
import type { useWorkspace } from './context'

// __BUILD_COMMIT__ and __EXPORTER_SELF_HASH__ are declared in src/build-constants.d.ts
// and injected at build time by the VERIFICATION-INFRASTRUCTURE region in vite.config.ts.

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ValidationBundleEnvironment {
  userAgent: string
  language: string
  timezoneOffset: number
  hardwareConcurrency: number
  screen: {
    width: number
    height: number
    devicePixelRatio: number
  }
}

export interface ValidationBundleDb {
  name: string
  version: number
  schema_version: number
  store_count: number
}

export interface ValidationBundleStoreCount {
  active: number
  deleted: number
}

export interface ValidationBundlePayload {
  db: ValidationBundleDb
  store_counts: Record<string, ValidationBundleStoreCount>
  localstorage: Record<string, string>
  app: { name: string; version: string }
}

export interface ValidationBundle {
  build_commit: string
  schema_version: number
  export_timestamp: string
  environment: ValidationBundleEnvironment
  nonce: string
  exporter_self_hash: string
  payload: ValidationBundlePayload
}

// The ws parameter is the return value of useWorkspace().
type WorkspaceContext = ReturnType<typeof useWorkspace>

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Count active and soft-deleted records. deletedAt is a ms timestamp when set. */
function countSoftDeletable(
  arr: Array<{ deletedAt?: number }>
): ValidationBundleStoreCount {
  let active = 0
  let deleted = 0
  for (const r of arr) {
    if (r.deletedAt != null) deleted++
    else active++
  }
  return { active, deleted }
}

/** Count records with no soft-delete field — all are active. */
function countAll(arr: Array<object>): ValidationBundleStoreCount {
  return { active: arr.length, deleted: 0 }
}

/** Generate a 256-bit cryptographic nonce as 64 lowercase hex chars. */
function generateNonce(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Produce a v1.1 validation-grade diagnostic bundle. The bundle contains:
 *   - build-time provenance (build_commit, exporter_self_hash)
 *   - a cryptographic nonce (fresh per export)
 *   - a real browser environment fingerprint
 *   - per-store record counts derived from the live workspace context
 *   - all verse-studio: localStorage keys with full raw values
 *
 * Runtime db.version is read by opening the IDB connection directly; it must
 * match DB_VERSION from src/db.ts on a healthy install.
 */
export async function exportValidationBundle(
  ws: WorkspaceContext
): Promise<ValidationBundle> {
  // Open IDB to read the runtime IDBDatabase.version property.
  // Uses the existing singleton helper — does not open a second connection
  // if the workspace context has already opened the database.
  const db = await openWorkspaceDB()
  const runtimeDbVersion = db.version

  // Build store_counts in STORES array order (required by bundle contract).
  const storeCountMap: Record<string, ValidationBundleStoreCount> = {
    meta:                 { active: 0, deleted: 0 }, // meta does not follow soft-delete
    writingDocs:          countSoftDeletable(ws.documents),
    poems:                countSoftDeletable(ws.poems),
    longformProjects:     countSoftDeletable(ws.longformDocs),
    longformSections:     countAll(ws.sections),
    appDesignBuilds:      countSoftDeletable(ws.builds),
    appDesignConstraints: countAll(ws.constraints),
    appDesignFeatures:    countAll(ws.features),
    appDesignScreens:     countAll(ws.screens),
    appDesignDataShapes:  countAll(ws.dataShapes),
    appDesignPhases:      countAll(ws.phases),
    appDesignReviews:     countAll(ws.reviews),
    shelf:                countAll(ws.shelfItems),
    projects:             countAll(ws.projects),
    links:                countAll(ws.links),
    tags:                 countAll(ws.tags),
    tagLinks:             countAll(ws.tagLinks),
    dockerScratch:        countAll(ws.dockerScratch),
    dockerClipboard:      countAll(ws.dockerClipboard),
    snapshots:            countAll(ws.snapshots),
    patterns:             countSoftDeletable(ws.patterns),
    promptPipelines:      countSoftDeletable(ws.pipelines),
    promptBlocks:         countAll(ws.blocks),
    inboxItems:           countSoftDeletable(ws.inboxItems),
    nodePositions:        countAll(ws.nodePositions),
    notes:                countSoftDeletable(ws.notes),
    scraps:               countSoftDeletable(ws.scraps),
    prompts:              countSoftDeletable(ws.prompts),
  }

  const store_counts: Record<string, ValidationBundleStoreCount> = {}
  for (const name of STORES) {
    store_counts[name] = storeCountMap[name] ?? { active: 0, deleted: 0 }
  }

  // Collect all verse-studio: localStorage keys with full raw string values.
  const localstorage: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k != null && k.startsWith('verse-studio:')) {
      localstorage[k] = localStorage.getItem(k) ?? ''
    }
  }

  // Assemble the bundle in the exact field order required by the schema contract.
  const bundle: ValidationBundle = {
    build_commit:       __BUILD_COMMIT__,
    schema_version:     1,
    export_timestamp:   new Date().toISOString(),
    environment: {
      userAgent:            navigator.userAgent,
      language:             navigator.language,
      timezoneOffset:       new Date().getTimezoneOffset(),
      hardwareConcurrency:  navigator.hardwareConcurrency,
      screen: {
        width:            screen.width,
        height:           screen.height,
        devicePixelRatio: window.devicePixelRatio,
      },
    },
    nonce:              generateNonce(),
    exporter_self_hash: __EXPORTER_SELF_HASH__,
    payload: {
      db: {
        name:           DB_NAME,
        version:        runtimeDbVersion,
        schema_version: SCHEMA_VERSION,
        store_count:    STORES.length,
      },
      store_counts,
      localstorage,
      app: {
        name:    APP_NAME,
        version: APP_VERSION,
      },
    },
  }

  return bundle
}
