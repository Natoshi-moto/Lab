import type { StoreName } from './db'

// All record types for every studio. Defined up-front so the context API
// doesn't reshape after Sweep 2 starts depending on it.
//
// Sweep 6 vocabulary note:
//   - "LongformDoc" was renamed from "LongformProject" to free the word
//     'project' for the new universal Project container (see Project below).
//   - LongformSection.projectId is intentionally NOT renamed: it is a
//     persisted IDB field that points at a LongformDoc.id (NOT a universal
//     Project.id). Renaming it would require rewriting every section row in
//     the migration; the field name stays and this comment exists to prevent
//     future confusion.

/**
 * Canonical lineage/export fields formalized in DB v11 / Sweep 57.
 * Some concepts appeared in earlier sweeps; v11 makes the read/write defaults
 * explicit without rewriting old rows.
 */
export interface LineageFields {
  /** True if this record is part of the seeded demo dataset. Default: false. */
  isSeedData?: boolean
  /** ID of the record this was converted from, if any. Default: null. */
  convertedFromId?: string | null
  /** Store name of the record type this was converted from. Default: null. */
  convertedFromType?: StoreName | null
  /** Timestamp when conversion-created records were derived. Default: null. */
  convertedAt?: number | null
  /** True if this record was created by an AI import or explicitly marked. Default: false. */
  aiLineage?: boolean
  /** Optional persisted content hash reserved for future health/packet flows. Default: null. */
  contentHash?: string | null
}

/**
 * Output routing targets for PromptPipeline runs. Formalized in v11 / Sweep 57.
 * Routing UI and logic land in a later sweep; this field is schema-only now.
 */
export type LongformSectionStatus = 'draft' | 'revise' | 'final' | 'cut'

export type PipelineOutputTarget =
  | 'new-scrap'
  | 'new-note'
  | 'new-document'
  | 'existing-note'
  | 'longform-section'
  | 'ai-import-queue'
  | 'canvas-import-zone'

/**
 * A user-defined semantic color. Colors carry meaning in Nexus, not just
 * decoration. Formalized in v11 / Sweep 57. IDB store will be added in a later sweep;
 * this type is declared here so Link.semanticColorId can reference it.
 */
export interface SemanticColor {
  id: string
  hex: string
  label: string
  description?: string
  scope?: string
  reserved?: boolean
  createdAt: number
  updatedAt: number
}

export type BuildStatus = 'drafting' | 'in-build' | 'shipped' | 'abandoned'
export type FeatureStatus = 'spec' | 'building' | 'working' | 'broken' | 'cut'
export type ElementType =
  | 'button' | 'field' | 'textarea' | 'list'
  | 'panel' | 'label' | 'image' | 'link' | 'other'

/**
 * Things the user can pin to the Shelf. After Sweep 6, 'longform' replaces
 * the old 'project' value (which used to mean a longform draft) and 'project'
 * now means a universal Project container.
 */
export type ShelfRefType =
  | 'document'
  | 'poem'
  | 'longform'
  | 'build'
  | 'project'
  | 'note'

/**
 * Slightly broader than ShelfRefType: any record kind that can be the
 * source/target of a Link, the subject of a Snapshot, or tagged via a TagLink.
 * Includes longform-section, pattern, and pipeline since those become
 * linkable in later sweeps.
 */
export type LinkableType =
  | 'document'
  | 'poem'
  | 'longform'
  | 'longform-section'
  | 'build'
  | 'project'
  | 'pattern'
  | 'pipeline'
  | 'note'
  | 'scrap'        // added Sweep 36
  | 'inbox-item'   // added Sweep 36
  | 'prompt'       // added Sweep 36

/**
 * Block kinds for Prompt Studio pipelines. Schema only — Sweep 11 builds the UI.
 */
export type PromptBlockType =
  | 'system'
  | 'context'
  | 'task'
  | 'review'
  | 'output'
  | 'constraint'
  | 'custom'

export interface MetaRecord {
  key: string
  value: any
}

export interface Document extends LineageFields {
  id: string
  title: string
  body: string
  createdAt: number
  updatedAt: number
  /** Universal Project membership. Undefined = not in any project. */
  projectId?: string
  /** Soft-delete timestamp. Undefined = active; number = trashed at that ms. */
  deletedAt?: number
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

export interface Poem extends LineageFields {
  id: string
  title: string
  body: string
  createdAt: number
  updatedAt: number
  projectId?: string
  deletedAt?: number
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

/**
 * A free-form note. Markdown-friendly body (no rendered preview in v1).
 * The catch-all writing surface for thoughts that aren't poems, documents,
 * longform, builds, patterns, or pipelines. Sweep 27 — fills the gap that
 * Inbox (capture-and-route), Compose (prompt drafting), and Quick-Add
 * (make-a-card-and-type) had each been working around since Sweep 23.
 */
export interface Note extends LineageFields {
  id: string
  title: string
  body: string
  createdAt: number
  updatedAt: number
  projectId?: string
  deletedAt?: number
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

export interface Scrap extends LineageFields {
  id: string
  projectId: string | null
  body: string
  sourceLabel?: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

export interface Prompt extends LineageFields {
  id: string
  title: string
  body: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

/**
 * A long writing piece composed of ordered LongformSections.
 * Was named LongformProject in sweeps 1–5 (renamed in Sweep 6).
 */
export interface LongformDoc extends LineageFields {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  projectId?: string
  deletedAt?: number
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

export interface LongformSection extends LineageFields {
  id: string
  /**
   * FK → LongformDoc.id. Field name stays as `projectId` to avoid a record
   * rewrite migration; it does NOT refer to a universal Project. See header.
   */
  projectId: string
  title: string
  body: string
  order: number
  /** Optional compile status. Undefined is treated as 'draft'. */
  status?: LongformSectionStatus
  createdAt: number
  updatedAt: number
  isSeedData?: boolean
  aiLineage?: boolean
}

export interface PassCriterion {
  id: string
  text: string
  met: boolean
}

export interface AppDesignBuild extends LineageFields {
  id: string
  name: string
  description: string
  status: BuildStatus
  platform: string
  createdAt: number
  updatedAt: number
  projectId?: string
  deletedAt?: number
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

export interface AppDesignConstraint extends LineageFields {
  id: string
  buildId: string
  text: string
  challenged: boolean
  why: string
  order: number
}

export interface AppDesignFeature extends LineageFields {
  id: string
  buildId: string
  statement: string
  status: FeatureStatus
  notes: string
  criteria: PassCriterion[]
  order: number
}

export interface ScreenElement {
  id: string
  type: ElementType
  label: string
}

export interface ScreenZone {
  id: string
  name: string
  elements: ScreenElement[]
}

export interface AppDesignScreen extends LineageFields {
  id: string
  buildId: string
  name: string
  zones: ScreenZone[]
  featureLinks: string[]
  order: number
}

export interface DataShapeField {
  id: string
  name: string
  type: string
  description: string
}

export interface AppDesignDataShape extends LineageFields {
  id: string
  buildId: string
  name: string
  fields: DataShapeField[]
  order: number
}

export interface AppDesignPhase extends LineageFields {
  id: string
  buildId: string
  name: string
  criteria: PassCriterion[]
  active: boolean
  order: number
}

export interface ReviewCriterionResult {
  id: string
  text: string
  status: 'green' | 'red' | 'unset'
  note: string
}

export interface AppDesignReview extends LineageFields {
  id: string
  buildId: string
  phaseId: string
  phaseName: string
  deliveredArtifact: string
  results: ReviewCriterionResult[]
  createdAt: number
}

export interface ShelfItem {
  id: string
  type: ShelfRefType
  refId: string
  title: string
  addedAt: number
  archived: boolean
}

// ===========================================================================
// Sweep 6 additions — universal Project, links, tags, docker, snapshots,
// patterns, prompt pipelines/blocks. UI for these arrives in sweeps 7–14.
// ===========================================================================

/**
 * Universal Project: a container that can hold any record type. Items belong
 * to it via an optional `projectId` field on Document, Poem, LongformDoc,
 * AppDesignBuild, Pattern, and PromptPipeline. No join table.
 */
export interface Project extends LineageFields {
  id: string
  name: string
  description: string
  colour?: string
  createdAt: number
  updatedAt: number
}

/** Point-and-click record-to-record link. Symmetric in storage; UI may treat. */
export interface Link {
  id: string
  sourceId: string
  sourceType: LinkableType
  targetId: string
  targetType: LinkableType
  /** @deprecated Backcompat/export alias. New storage writes should prefer relationshipType. */
  label?: string
  createdAt: number
  /** True if this link was created by an AI import or explicitly marked. Default: false. */
  aiLineage?: boolean
  /** Canonical stored relationship type label, e.g. 'supports' or 'contradicts'. */
  relationshipType?: string | null
  /** Reference to a SemanticColor.id if this link carries visual semantic meaning */
  semanticColorId?: string | null
  /** Visual weight hint for canvas edge rendering. 1 = normal, >1 = heavier. */
  weight?: number | null
}

export interface Tag {
  id: string
  name: string
  colour?: string
  createdAt: number
}

/** Junction row: one tag attached to one record. */
export interface TagLink {
  id: string
  tagId: string
  targetId: string
  targetType: LinkableType
}

/** A single scratchpad tab in the Docker. Tabs are reorderable by tabIndex. */
export interface DockerScratch {
  id: string
  tabIndex: number
  title: string
  body: string
  updatedAt: number
}

/** One entry in the Docker's clipboard history (text copied from inside the app). */
export interface DockerClipboard {
  id: string
  text: string
  sourceLabel?: string
  capturedAt: number
}

/** Manual restore-point capture of a single record's state. */
export interface Snapshot {
  id: string
  recordId: string
  recordType: LinkableType
  label: string
  /** JSON-stringified snapshot of the record at capture time. */
  data: string
  createdAt: number
}

/** Reusable Feature Library entry. Free-form `type` until Sweep 12 narrows it. */
export interface Pattern extends LineageFields {
  id: string
  name: string
  description: string
  type: string
  /** @deprecated Sweep 18 — empty after migration. Tag attachments live in TagLinks. */
  tags: string[]
  body: string
  projectId?: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

export interface PromptPipeline extends LineageFields {
  id: string
  name: string
  description: string
  projectId?: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
  /**
   * Where pipeline output is routed on run. Null/undefined = no routing
   * (output shown inline only). Formalized in v11 / Sweep 57.
   */
  outputTarget?: PipelineOutputTarget | null
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

export interface PromptBlock extends LineageFields {
  id: string
  pipelineId: string
  type: PromptBlockType
  label: string
  body: string
  order: number
}

// ===========================================================================
// Sweep 23 additions — Inbox capture surface and Atlas node-position store.
// ===========================================================================

/**
 * Recurrence specifier for InboxItem timers.
 *
 * 'none'    — fire once at dueAt, then clear dueAt.
 * 'daily'   — fire at dueAt, then advance dueAt by 1 day (86_400_000 ms).
 * 'weekly'  — fire at dueAt, then advance by 7 days.
 * 'monthly' — fire at dueAt, then advance by 1 calendar month
 *             via Date setMonth, accepting JS's standard month-rollover
 *             behaviour (Jan 31 -> Mar 3, etc.).
 */
export type InboxRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'

/**
 * Inbox capture record. Items can carry timers and recurrences. When a
 * timer fires, an in-app toast appears and a synthesized ding plays.
 *
 * Inbox items are pre-records — they cannot be link targets, tag targets,
 * or snapshot targets. Routing creates a typed record (Document/Poem/etc.)
 * and soft-deletes the InboxItem.
 *
 * InboxItem joins the soft-deletable kinds (was 6, now 7).
 */
export interface InboxItem extends LineageFields {
  id: string
  title: string
  body: string
  createdAt: number
  updatedAt: number

  /** Absolute ms timestamp for next fire. Undefined = no timer set. */
  dueAt?: number

  /** Repeat policy. Default 'none'. */
  recurrence?: InboxRecurrence

  /**
   * Last fired timestamp. Used to dedupe fires across reloads:
   * fire only if dueAt <= now AND lastFiredAt < dueAt.
   */
  lastFiredAt?: number

  /** Set when user dismisses without routing/completing. */
  dismissedAt?: number

  /** Set when user marks the item done from the inbox. */
  doneAt?: number

  /** Soft-delete timestamp (consistent with the six soft-deletable kinds). */
  deletedAt?: number
  isSeedData?: boolean
  convertedFromId?: string | null
  convertedFromType?: StoreName | null
  aiLineage?: boolean
}

/**
 * Persisted (x, y) for a node in the Atlas graph.
 *
 * The id field is a synthetic key in the form `${type}:${recordId}`,
 * e.g. 'document:abc123', 'tag:xyz789', 'project:prj456'.
 *
 * Stale positions (referencing deleted records) are tolerated; Atlas
 * lazily ignores unresolved ids.
 */
export interface NodePosition {
  id: string
  x: number
  y: number
  pinned?: boolean
}

/**
 * Routing target kinds for `routeInboxItemTo`. A subset of LinkableType —
 * inbox items can route to record-creating kinds, not to projects or
 * sections (which are downstream of records).
 */
export type RouteKind = 'document' | 'poem' | 'longform' | 'pattern' | 'pipeline' | 'build' | 'note' | 'scrap'
