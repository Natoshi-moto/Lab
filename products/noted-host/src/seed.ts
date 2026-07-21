// seed.ts — Sweep 54: canonical Meridian onboarding/demo seed.
// All IDs are hardcoded constants — never generated at runtime.
// seedPlaceholder() is the main entrypoint (called by context.tsx bootstrap).
// resetSeedData() is called by the Settings "Reset demo" button.

import { dbBulkPut, dbPut, dbGet, dbGetAll, dbDelete, SCHEMA_VERSION } from './db'
import type { StoreName } from './db'
import type {
  Document, LongformDoc,
  AppDesignBuild,
  Project,
  Note, Scrap, Pattern, PromptPipeline, Link
} from './types'

// ── Stable seed IDs ────────────────────────────────────────────────────────
// These IDs are the idempotency contract. Do not generate replacements at runtime.
const S = {
  project:          'seed:project:meridian',
  writing:          'seed:writing:the-discovery',
  noteCore:         'seed:note:core-concept-memory-as-place',
  noteVoice:        'seed:note:narrative-voice-intimate-and-quiet',
  longform:         'seed:longform:meridian-story-bible',
  build:            'seed:build:meridian-ios',
  pattern:          'seed:pattern:fragment-scene-generator',
  pipeline:         'seed:pipeline:story-world-expander',
  scrapFound:       'seed:scrap:fragment-found-notification',
  scrapNoTutorial:  'seed:scrap:no-tutorial-principle',
  scrapWhisper:     'seed:scrap:fragments-should-whisper',
  linkCoreToStory:  'seed:link:core-concept-to-discovery',
  linkVoiceToBible: 'seed:link:narrative-voice-to-story-bible',
  linkCoreToBible:  'seed:link:core-concept-to-story-bible',
  linkPatternToPipe:'seed:link:scene-generator-to-world-expander',
} as const

// Previous rich-demo stable IDs. Kept only so Settings → Reset demo can remove
// old seed-only support rows that never carried isSeedData.
const LEGACY_SEED_IDS = {
  project:          'seed:project:meridian',
  doc:              'seed:doc:the-discovery',
  snapshotDoc:      'seed:snapshot:first-draft',
  noteCore:         'seed:note:core-concept',
  noteVoice:        'seed:note:narrative-voice',
  noteMechanics:    'seed:note:fragment-expiry',
  scrap1:           'seed:scrap:notification',
  scrap2:           'seed:scrap:no-tutorial',
  scrap3:           'seed:scrap:sound-design',
  longformDoc:      'seed:longform:story-bible',
  section1:         'seed:section:the-world',
  section2:         'seed:section:the-fragments',
  section3:         'seed:section:the-archive',
  constraint1:      'seed:constraint:privacy',
  constraint2:      'seed:constraint:battery',
  feature1:         'seed:feature:fragment-creation',
  feature2:         'seed:feature:map-discovery',
  feature3:         'seed:feature:archive',
  pattern:          'seed:pattern:scene-generator',
  pipeline:         'seed:pipeline:world-expander',
  inbox1:           'seed:inbox:sound-designer',
  inbox2:           'seed:inbox:location-privacy',
  linkCoreToDoc:    'seed:link:note-core-to-doc',
  linkVoiceToLf:    'seed:link:note-voice-to-longform',
  linkScrapToNote:  'seed:link:scrap-sound-to-note-mech',
  tagWorldbuilding: 'seed:tag:worldbuilding',
  tagMechanics:     'seed:tag:mechanics',
  tagVoice:         'seed:tag:voice',
  tagPrivacy:       'seed:tag:privacy',
  tlNoteCore:       'seed:taglink:notecore-worldbuilding',
  tlNoteMech:       'seed:taglink:notemech-mechanics',
  tlNoteVoice:      'seed:taglink:notevoice-voice',
  tlBuild:          'seed:taglink:build-privacy',
} as const

// Fixed seed timestamp: 2025-01-01T00:00:00Z — stable, never Date.now().
const T = 1735689600000

const CANVAS_PROJECT_KEY = 'verse-studio:canvas:lastProject'
const CANVAS_POSITIONS_KEY = `verse-studio:canvas:positions:${S.project}`

// ── Public entrypoints ─────────────────────────────────────────────────────

export async function seedPlaceholder(): Promise<void> {
  const planted = await seedMeridian()
  if (planted) writeMeridianCanvasDefaults()
  await dbPut('meta', { key: 'schemaVersion', value: SCHEMA_VERSION })
  await dbPut('meta', { key: 'seeded', value: true })
}

/**
 * Deletes all seed records and replants the Meridian demo project.
 * Called by Settings → "Reset demo project" button.
 * Does NOT reset user-created records.
 */
export async function resetSeedData(): Promise<void> {
  // Pass 1: delete records that carry isSeedData (primary types with the field).
  const seedableStores: StoreName[] = [
    'writingDocs', 'poems', 'notes', 'scraps',
    'longformProjects', 'longformSections', 'appDesignBuilds',
    'patterns', 'promptPipelines', 'inboxItems',
  ]
  for (const store of seedableStores) {
    const records = await dbGetAll<{ id: string; isSeedData?: boolean }>(store)
    for (const rec of records) {
      if (rec.isSeedData) await dbDelete(store, rec.id)
    }
  }

  // Pass 2: delete known seed IDs for records that do not carry isSeedData,
  // plus legacy seed rows whose IDs changed in Sweep 54.
  const knownIds: Array<[StoreName, string]> = [
    ['projects', S.project],
    ['writingDocs', S.writing],
    ['notes', S.noteCore],
    ['notes', S.noteVoice],
    ['longformProjects', S.longform],
    ['appDesignBuilds', S.build],
    ['patterns', S.pattern],
    ['promptPipelines', S.pipeline],
    ['scraps', S.scrapFound],
    ['scraps', S.scrapNoTutorial],
    ['scraps', S.scrapWhisper],
    ['links', S.linkCoreToStory],
    ['links', S.linkVoiceToBible],
    ['links', S.linkCoreToBible],
    ['links', S.linkPatternToPipe],

    ['projects', LEGACY_SEED_IDS.project],
    ['writingDocs', LEGACY_SEED_IDS.doc],
    ['snapshots', LEGACY_SEED_IDS.snapshotDoc],
    ['notes', LEGACY_SEED_IDS.noteCore],
    ['notes', LEGACY_SEED_IDS.noteVoice],
    ['notes', LEGACY_SEED_IDS.noteMechanics],
    ['scraps', LEGACY_SEED_IDS.scrap1],
    ['scraps', LEGACY_SEED_IDS.scrap2],
    ['scraps', LEGACY_SEED_IDS.scrap3],
    ['longformProjects', LEGACY_SEED_IDS.longformDoc],
    ['longformSections', LEGACY_SEED_IDS.section1],
    ['longformSections', LEGACY_SEED_IDS.section2],
    ['longformSections', LEGACY_SEED_IDS.section3],
    ['appDesignConstraints', LEGACY_SEED_IDS.constraint1],
    ['appDesignConstraints', LEGACY_SEED_IDS.constraint2],
    ['appDesignFeatures', LEGACY_SEED_IDS.feature1],
    ['appDesignFeatures', LEGACY_SEED_IDS.feature2],
    ['appDesignFeatures', LEGACY_SEED_IDS.feature3],
    ['patterns', LEGACY_SEED_IDS.pattern],
    ['promptPipelines', LEGACY_SEED_IDS.pipeline],
    ['inboxItems', LEGACY_SEED_IDS.inbox1],
    ['inboxItems', LEGACY_SEED_IDS.inbox2],
    ['links', LEGACY_SEED_IDS.linkCoreToDoc],
    ['links', LEGACY_SEED_IDS.linkVoiceToLf],
    ['links', LEGACY_SEED_IDS.linkScrapToNote],
    ['tags', LEGACY_SEED_IDS.tagWorldbuilding],
    ['tags', LEGACY_SEED_IDS.tagMechanics],
    ['tags', LEGACY_SEED_IDS.tagVoice],
    ['tags', LEGACY_SEED_IDS.tagPrivacy],
    ['tagLinks', LEGACY_SEED_IDS.tlNoteCore],
    ['tagLinks', LEGACY_SEED_IDS.tlNoteMech],
    ['tagLinks', LEGACY_SEED_IDS.tlNoteVoice],
    ['tagLinks', LEGACY_SEED_IDS.tlBuild],
  ]
  for (const [store, id] of knownIds) {
    await dbDelete(store, id)
  }

  const planted = await seedMeridian()
  if (planted) writeMeridianCanvasDefaults()
}

// ── Core seed function ─────────────────────────────────────────────────────

async function seedMeridian(): Promise<boolean> {
  const existing = await dbGet<Project>('projects', S.project)
  if (existing) return false

  const project: Project = {
    id: S.project,
    name: 'Meridian',
    description: 'A location-based memory-sharing app concept. Private by default. Relational by design. Portable by right.',
    colour: 'indigo',
    createdAt: T,
    updatedAt: T,
  }

  const writing: Document = {
    id: S.writing,
    title: 'The Discovery',
    projectId: S.project,
    isSeedData: true,
    createdAt: T + 1_000,
    updatedAt: T + 1_000,
    body: `She found it at the corner where he used to buy flowers.

The shop was gone now. In its place: a dental office with frosted windows and a little bell that rang whenever someone opened the door. But the pavement still dipped near the curb, and the awning hook was still fixed into the brick above her head.

Meridian pulsed once.

Not a notification exactly. More like a held breath. She looked down and saw the fragment waiting there, pinned to the corner without making a sound.

When she opened it, her father's voice arrived in the thin speaker of her phone.

\"Your mother liked the yellow ones,\" he said.

Five words. A soft scrape of wind. Then nothing.

She stood very still while people moved around her. The city went on making its practical noises. Somewhere behind the glass, the dental receptionist laughed.

He had been here. He had left this here. Not for her, not exactly. Maybe for anyone. Maybe for the future itself.

She played it again, quieter this time, as if volume were a form of respect.`,
  }

  const noteCore: Note = {
    id: S.noteCore,
    title: 'Core concept — memory as place',
    projectId: S.project,
    isSeedData: true,
    createdAt: T + 2_000,
    updatedAt: T + 2_000,
    body: `Meridian is built around one thesis: memory is not only something you keep. It is something that happens somewhere.

A fragment belongs to the corner, the station platform, the bench by the river, the hallway outside the old flat. The place gives the memory its charge. Without the place, the fragment becomes ordinary content.

The product should make location feel relational rather than extractive. It is not a feed, not a map of people, not a performance layer. It is a private knowledge field where small human traces can be left, found, connected, and carried away without turning into a social graph.`,
  }

  const noteVoice: Note = {
    id: S.noteVoice,
    title: 'Narrative voice — intimate and quiet',
    projectId: S.project,
    isSeedData: true,
    createdAt: T + 3_000,
    updatedAt: T + 3_000,
    body: `The Meridian voice should stay intimate and quiet.

Influences: Jenny Offill for compression and charged gaps; Marilynne Robinson for attention as devotion; The Rings of Saturn for wandering memory, place, and historical residue.

The app should never sound like it is selling an experience. It should feel like a person lowering their voice because the thing matters. Error copy, prompts, onboarding, empty states, and story fragments should all preserve that restraint.`,
  }

  const longform: LongformDoc = {
    id: S.longform,
    title: 'Meridian Story Bible',
    projectId: S.project,
    isSeedData: true,
    createdAt: T + 4_000,
    updatedAt: T + 4_000,
  }

  const build: AppDesignBuild = {
    id: S.build,
    name: 'Meridian iOS',
    description: 'Privacy-first iOS concept for placing and discovering location-bound memory fragments.',
    status: 'drafting',
    platform: 'iOS',
    projectId: S.project,
    isSeedData: true,
    createdAt: T + 5_000,
    updatedAt: T + 5_000,
  }

  const pattern: Pattern = {
    id: S.pattern,
    name: 'Fragment Scene Generator',
    description: 'Generates a quiet discovery scene for a Meridian fragment.',
    type: 'block',
    tags: [],
    projectId: S.project,
    isSeedData: true,
    createdAt: T + 6_000,
    updatedAt: T + 6_000,
    body: `Write a short scene in which a character discovers a Meridian fragment at [LOCATION].

Constraints:
- Keep the prose intimate and quiet.
- Treat the technology as nearly invisible.
- Let the place carry the emotion.
- End at the moment the fragment changes what the character understands.`,
  }

  const pipeline: PromptPipeline = {
    id: S.pipeline,
    name: 'Story World Expander',
    description: 'Uses the Fragment Scene Generator to expand Meridian scenes, lore, and product language.',
    projectId: S.project,
    isSeedData: true,
    createdAt: T + 7_000,
    updatedAt: T + 7_000,
  }

  const scraps: Scrap[] = [
    {
      id: S.scrapFound,
      projectId: S.project,
      body: 'What if you could feel when someone found your fragment?',
      sourceLabel: 'Meridian seed',
      isSeedData: true,
      createdAt: T + 8_000,
      updatedAt: T + 8_000,
    },
    {
      id: S.scrapNoTutorial,
      projectId: S.project,
      body: 'The app should never explain itself.',
      sourceLabel: 'Meridian seed',
      isSeedData: true,
      createdAt: T + 9_000,
      updatedAt: T + 9_000,
    },
    {
      id: S.scrapWhisper,
      projectId: S.project,
      body: 'fragments should whisper',
      sourceLabel: 'Meridian seed',
      isSeedData: true,
      createdAt: T + 10_000,
      updatedAt: T + 10_000,
    },
  ]

  const links: Link[] = [
    {
      id: S.linkCoreToStory,
      sourceId: S.noteCore,
      sourceType: 'note',
      targetId: S.writing,
      targetType: 'document',
      label: 'informs',
      relationshipType: 'informs',
      createdAt: T + 11_000,
    },
    {
      id: S.linkVoiceToBible,
      sourceId: S.noteVoice,
      sourceType: 'note',
      targetId: S.longform,
      targetType: 'longform',
      label: 'guides tone of',
      relationshipType: 'guides tone of',
      createdAt: T + 12_000,
    },
    {
      id: S.linkCoreToBible,
      sourceId: S.noteCore,
      sourceType: 'note',
      targetId: S.longform,
      targetType: 'longform',
      label: 'expands into',
      relationshipType: 'expands into',
      createdAt: T + 13_000,
    },
    {
      id: S.linkPatternToPipe,
      sourceId: S.pattern,
      sourceType: 'pattern',
      targetId: S.pipeline,
      targetType: 'pipeline',
      label: 'powers',
      relationshipType: 'powers',
      createdAt: T + 14_000,
    },
  ]

  await dbBulkPut('projects',         [project])
  await dbBulkPut('writingDocs',      [writing])
  await dbBulkPut('notes',            [noteCore, noteVoice])
  await dbBulkPut('longformProjects', [longform])
  await dbBulkPut('appDesignBuilds',  [build])
  await dbBulkPut('patterns',         [pattern])
  await dbBulkPut('promptPipelines',  [pipeline])
  await dbBulkPut('scraps',           scraps)
  await dbBulkPut('links',            links)

  return true
}

function writeMeridianCanvasDefaults(): void {
  try {
    const positions = {
      [`document:${S.writing}`]: { x: 40, y: 60, width: 220, height: 100 },
      [`note:${S.noteCore}`]: { x: 360, y: 180, width: 220, height: 110 },
      [`note:${S.noteVoice}`]: { x: 680, y: 80, width: 220, height: 110 },
      [`longform:${S.longform}`]: { x: 940, y: 110, width: 220, height: 90 },
      [`build:${S.build}`]: { x: 620, y: 270, width: 220, height: 90 },
      [`pattern:${S.pattern}`]: { x: 80, y: 380, width: 220, height: 110 },
      [`pipeline:${S.pipeline}`]: { x: 360, y: 420, width: 220, height: 100 },
      [`scrap:${S.scrapFound}`]: { x: 680, y: 430, width: 190, height: 120 },
      [`scrap:${S.scrapNoTutorial}`]: { x: 900, y: 400, width: 190, height: 120 },
      [`scrap:${S.scrapWhisper}`]: { x: 1120, y: 450, width: 190, height: 120 },
    }
    localStorage.setItem(CANVAS_POSITIONS_KEY, JSON.stringify(positions))
    localStorage.setItem(CANVAS_PROJECT_KEY, S.project)
  } catch {}
}
