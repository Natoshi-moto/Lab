// Sweep 60 — First-run canonical canvas seed.
//
// On a fresh-or-seed-only workspace, plant the "Nexus Mobile" canonical sample project
// (records + links + canvas positions) so a brand-new install lands on a
// meaningful Canvas instead of an empty one. The whole thing runs through the
// public `ws.*` methods — no direct IDB writes, no new workspace methods, no
// changes to Canvas.tsx. A one-shot marker in localStorage prevents re-seed
// across reloads. On any workspace that contains non-seed records, we set
// the marker and bail without writing anything, so existing user data is
// never touched. Records with ids prefixed 'seed:' (the Meridian demo
// from src/seed.ts) are treated as fresh-workspace-eligible.
//
// Position key shape is intentionally `${kind}:${newId}` to match
// Canvas.tsx's nodeIdSet, which keys canvas positions by
// `${record.kind}:${record.id}` (see Canvas.tsx around line 1116). The
// canonical-canvas.json file uses plain ids in its `positions` array; we
// remap to the prefixed form on write.

import canonicalCanvas from './data/canonicalCanvas.json'
import type { useWorkspace } from './context'
import type { LinkableType } from './types'

const SEEDED_KEY = 'verse-studio:canonical-canvas:seeded'
const POS_PREFIX = 'verse-studio:canvas:positions:'

type Ws = ReturnType<typeof useWorkspace>

type SeedTileType = 'document' | 'note' | 'scrap'

interface ExchangeRecord {
  id: string
  tileType: SeedTileType
  title: string
  body: string
}

interface ExchangeLink {
  id: string
  sourceId: string
  targetId: string
  label?: string | null
}

interface ExchangePosition {
  id: string
  x: number
  y: number
}

// Canvas.tsx uses the record `kind` as the node-id prefix. For seeded record
// types (document/note/scrap), the kind string matches the tileType.
const TILE_TO_NODE_KIND: Record<SeedTileType, string> = {
  document: 'document',
  note: 'note',
  scrap: 'scrap',
}

// LinkableType uses the same singular strings for document/note/scrap, so a
// direct cast is safe inside this seeded subset.
const TILE_TO_LINKABLE: Record<SeedTileType, LinkableType> = {
  document: 'document',
  note: 'note',
  scrap: 'scrap',
}

export async function maybeSeedCanonicalCanvas(ws: Ws): Promise<void> {
  // 1. Idempotency — marker absent means we may attempt; presence means done.
  try {
    if (localStorage.getItem(SEEDED_KEY) === 'true') return
  } catch {
    // localStorage unreachable (private mode, etc.). Refuse to seed because we
    // can't store the marker and would re-seed on every reload otherwise.
    return
  }

  // 2. Eligibility gate — Sweep 60.1.
  // Seed if the workspace is "fresh enough": either truly empty, or contains
  // only records produced by src/seed.ts (the built-in Meridian demo, whose
  // record ids are prefixed with 'seed:'). Any non-seed record means real
  // user data exists; set the marker and bail without writing.
  //
  // Why this is needed: src/seed.ts (Frozen Four) auto-populates Meridian
  // on every fresh install BEFORE maybeSeedCanonicalCanvas runs. A strict
  // emptiness check therefore prevented the canonical canvas from ever
  // landing on a real fresh install.
  const onlySeedOrEmpty = <T extends { id: string }>(
    xs: ReadonlyArray<T> | undefined,
  ): boolean => {
    if (!xs || xs.length === 0) return true
    return xs.every((r) => typeof r.id === 'string' && r.id.startsWith('seed:'))
  }

  const isFreshOrSeedOnly =
    onlySeedOrEmpty(ws.projects) &&
    onlySeedOrEmpty(ws.documents) &&
    onlySeedOrEmpty(ws.notes) &&
    onlySeedOrEmpty(ws.scraps)

  if (!isFreshOrSeedOnly) {
    // Real user data present — never seed here, but still set the marker so
    // we don't re-check on every reload.
    try { localStorage.setItem(SEEDED_KEY, 'true') } catch { /* ignore */ }
    return
  }

  const data = canonicalCanvas as {
    records: ExchangeRecord[]
    links: ExchangeLink[]
    positions: ExchangePosition[]
  }

  // 3. Create the project.
  const project = await ws.createProject(
    'Nexus Mobile',
    'Canonical sample project — private messaging app for Android. Demonstrates the relational canvas. Delete or rename freely.',
  )

  // 4. Create records and build origId → { newId, kind } remap.
  const remap = new Map<string, { newId: string; kind: SeedTileType }>()
  for (const rec of data.records) {
    if (!rec || typeof rec.id !== 'string') continue
    const tileType = rec.tileType
    if (tileType !== 'document' && tileType !== 'note' && tileType !== 'scrap') continue

    let newId: string
    try {
      switch (tileType) {
        case 'document': {
          const d = await ws.createDocument(rec.title || 'Untitled')
          await ws.updateDocument(d.id, { body: rec.body || '', projectId: project.id })
          newId = d.id
          break
        }
        case 'note': {
          const n = await ws.createNote(rec.title || 'Untitled')
          await ws.updateNote(n.id, { body: rec.body || '', projectId: project.id })
          newId = n.id
          break
        }
        case 'scrap': {
          const s = await ws.createScrap({ body: rec.body || '', projectId: project.id })
          newId = s.id
          break
        }
      }
    } catch (err) {
      // Tolerate a single record failure — keep seeding the rest.
      console.error('[firstRunCanvas] record create failed:', rec.id, err)
      continue
    }
    remap.set(rec.id, { newId, kind: tileType })
  }

  // 5. Create links with remapped endpoints. Both source and target types are
  // required by ws.createLink; we read them from the remap.
  for (const link of data.links) {
    const src = remap.get(link.sourceId)
    const tgt = remap.get(link.targetId)
    if (!src || !tgt) continue
    try {
      const args: {
        sourceId: string; sourceType: LinkableType
        targetId: string; targetType: LinkableType
        label?: string
      } = {
        sourceId: src.newId,
        sourceType: TILE_TO_LINKABLE[src.kind],
        targetId: tgt.newId,
        targetType: TILE_TO_LINKABLE[tgt.kind],
      }
      if (link.label) args.label = link.label
      await ws.createLink(args)
    } catch (err) {
      // Tolerate per-link failures; the project still reads fine.
      console.error('[firstRunCanvas] link create failed:', link.id, err)
    }
  }

  // 6. Write canvas positions to the existing key shape Canvas.tsx reads.
  // Node ids are `${kind}:${newId}` (see Canvas.tsx ~line 1116).
  try {
    const positionMap: Record<string, { x: number; y: number }> = {}
    for (const pos of data.positions) {
      const rec = remap.get(pos.id)
      if (!rec) continue
      if (typeof pos.x !== 'number' || typeof pos.y !== 'number') continue
      const nodeId = `${TILE_TO_NODE_KIND[rec.kind]}:${rec.newId}`
      positionMap[nodeId] = { x: pos.x, y: pos.y }
    }
    localStorage.setItem(POS_PREFIX + project.id, JSON.stringify(positionMap))
  } catch (err) {
    // If positions don't persist, the project still works — Canvas falls
    // back to its grid layout for any node missing a stored position.
    console.error('[firstRunCanvas] position write failed:', err)
  }

  // 6b. Make Canvas open on the canonical project — Sweep 60.2.
  // The eligibility gate above (onlySeedOrEmpty across projects, documents,
  // notes, scraps) already guarantees a fresh-or-seed-only workspace, so no
  // user-chosen lastProject exists yet that this write could clobber.
  // src/seed.ts:writeMeridianCanvasDefaults() (Frozen Four) writes
  // 'verse-studio:canvas:lastProject' = 'seed:project:meridian' during
  // context bootstrap, BEFORE App.tsx fires maybeSeedCanonicalCanvas on
  // ws.ready. A `=== null` guard at this site therefore always no-ops on a
  // real fresh install and the user lands on Meridian instead of the
  // canonical canvas. Unconditional write is correct here.
  try {
    localStorage.setItem('verse-studio:canvas:lastProject', project.id)
  } catch { /* ignore */ }

  // 6c. Persist the canonical project id under a stable key so the
  // Sweep 61 default-to-Nexus migration (maybeDefaultCanvasToNexus) can
  // resolve it on later boots without a name lookup. Fresh installs get
  // this for free; installs seeded before this key existed fall back to a
  // name match inside that migration.
  try {
    localStorage.setItem('verse-studio:canvas:canonicalProject', project.id)
  } catch { /* ignore */ }

  // 7. Mark seeded. Even on partial failure above we set the marker so we
  // don't re-attempt and double-seed on the next reload.
  try { localStorage.setItem(SEEDED_KEY, 'true') } catch { /* ignore */ }
}

// ── Sweep 61 — default Canvas to the canonical Nexus project ─────────────────
//
// Problem this fixes: on a fresh-or-seed-only install, maybeSeedCanonicalCanvas
// repoints `canvas:lastProject` to the new Nexus project. But on a workspace
// that already holds real user data, that function bails (eligibility gate),
// so the Meridian default written by seed.ts:writeMeridianCanvasDefaults()
// (`canvas:lastProject = 'seed:project:meridian'`) is never corrected and the
// Canvas keeps opening on Meridian.
//
// This one-time migration mirrors the Sweep 56-R Nexus-Panel default-open
// pattern: a dedicated 'applied' marker, a single corrective write, and a
// hard rule that a deliberate user navigation is never clobbered. It only
// repoints when the stored value is the seed-written Meridian id or is
// absent. If the Nexus project cannot be resolved yet, it makes NO write and
// leaves the marker unset so a later boot can retry.

const NEXUS_DEFAULT_APPLIED_KEY = 'verse-studio:canvas:default-nexus-applied'
const CANONICAL_PROJECT_KEY = 'verse-studio:canvas:canonicalProject'
const LAST_PROJECT_KEY = 'verse-studio:canvas:lastProject'
const MERIDIAN_SEED_PROJECT_ID = 'seed:project:meridian'

export function maybeDefaultCanvasToNexus(ws: Ws): void {
  try {
    if (localStorage.getItem(NEXUS_DEFAULT_APPLIED_KEY) === 'true') return
  } catch {
    // localStorage unreachable — cannot record the marker, so refuse to act
    // (otherwise we would repoint on every boot).
    return
  }

  // Resolve the canonical Nexus project. Prefer the stable id written at seed
  // time; fall back to a name/description match for installs seeded before
  // the canonicalProject key existed.
  let nexusId: string | undefined
  try {
    const stored = localStorage.getItem(CANONICAL_PROJECT_KEY)
    if (stored && ws.projects.some((p) => p.id === stored)) nexusId = stored
  } catch { /* ignore */ }

  if (!nexusId) {
    const byName = ws.projects.find(
      (p) =>
        p.name === 'Nexus Mobile' ||
        (typeof p.description === 'string' &&
          p.description.startsWith('Canonical sample project')),
    )
    nexusId = byName?.id
  }

  // Nexus project not present yet (e.g. seed still settling). Do NOT set the
  // marker — retry on a later boot once the project exists.
  if (!nexusId) return

  let current: string | null = null
  try { current = localStorage.getItem(LAST_PROJECT_KEY) } catch { /* ignore */ }

  // Only repoint the seed-written Meridian default or an empty value. A user
  // who has navigated to any other project keeps their choice.
  if (current === null || current === '' || current === MERIDIAN_SEED_PROJECT_ID) {
    try { localStorage.setItem(LAST_PROJECT_KEY, nexusId) } catch { /* ignore */ }
  }

  // Cache the resolved id for future boots and mark the migration done.
  try { localStorage.setItem(CANONICAL_PROJECT_KEY, nexusId) } catch { /* ignore */ }
  try { localStorage.setItem(NEXUS_DEFAULT_APPLIED_KEY, 'true') } catch { /* ignore */ }
}
