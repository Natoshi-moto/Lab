// verify-sweep27.mjs
// Sweep 27 — Notes type, full citizen.
//
// Block S1..S25 — Notes record type CRUD, studio, sidebar, projects board,
// Atlas, Canvas, tagging, linking, inbox routing, global search, snapshots,
// schema version, and console-error sentinel.

import { chromium } from 'playwright'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(resolve(__dirname, 'verse-studio.html'), 'utf8')

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(html)
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const { port } = server.address()
const BASE = `http://127.0.0.1:${port}`

const launchOpts = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {}
const browser = await chromium.launch(launchOpts)

let pass = 0
let fail = 0

function expect(label, cond, detail = '') {
  if (cond) { console.log(`  PASS  ${label}`); pass++ }
  else      { console.error(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`); fail++ }
}

async function ready(page) {
  await page.waitForFunction(() => !document.body.innerText.includes('Loading'), null, { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(150)
}

async function fresh() {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const errors = { console: [] }
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.console.push(msg.text())
  })
  page.on('pageerror', (err) => {
    errors.console.push(String(err))
  })
  await page.goto(`${BASE}/#/writing`)
  await ready(page)
  return { ctx, page, errors }
}

async function navByHash(page, hash) {
  await page.evaluate((h) => { location.hash = h }, hash)
  await page.waitForTimeout(200)
}

console.log('\nBlock S — Notes type, full citizen (Sweep 27)')

// ── S1 — schema version is 5 in meta IDB store after first boot ─────────────
{
  const { ctx, page } = await fresh()
  const schemaV = await page.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('verse-studio')
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('meta', 'readonly')
      const store = tx.objectStore('meta')
      const get = store.get('schemaVersion')
      get.onsuccess = () => resolve(get.result?.value ?? null)
      get.onerror = () => resolve(null)
    }
    req.onerror = () => resolve(null)
  }))
  expect('S1: schema version is 5 after first boot',
    schemaV === 5, `got ${schemaV}`)
  await ctx.close()
}

// ── S2 — notes IDB store exists ─────────────────────────────────────────────
{
  const { ctx, page } = await fresh()
  const exists = await page.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('verse-studio')
    req.onsuccess = () => {
      const db = req.result
      resolve(db.objectStoreNames.contains('notes'))
    }
    req.onerror = () => resolve(false)
  }))
  expect('S2: notes IDB store exists', exists === true, `exists=${exists}`)
  await ctx.close()
}

// ── S3 — seed Welcome Note is present ───────────────────────────────────────
{
  const { ctx, page } = await fresh()
  const seedNote = await page.evaluate(() => {
    const ws = window.__verseStudio
    return ws.getState().notes.find((n) => n.title === 'Welcome to Notes') || null
  })
  expect('S3: seed Welcome Note is present',
    !!seedNote && seedNote.body.length > 0,
    `seedNote=${JSON.stringify(seedNote)?.slice(0, 80)}`)
  expect('S3: seed Welcome Note attached to Welcome project',
    !!seedNote?.projectId, `projectId=${seedNote?.projectId}`)
  await ctx.close()
}

// ── S4 — createNote returns Note with id, default title, createdAt ──────────
{
  const { ctx, page } = await fresh()
  const note = await page.evaluate(async () => {
    const ws = window.__verseStudio
    return await ws.createNote()
  })
  expect('S4: createNote returns id',
    typeof note?.id === 'string' && note.id.length > 0, JSON.stringify(note))
  expect('S4: createNote default title is "Untitled"',
    note?.title === 'Untitled', JSON.stringify(note))
  expect('S4: createNote sets createdAt',
    typeof note?.createdAt === 'number' && note.createdAt > 0, JSON.stringify(note))
  await ctx.close()
}

// ── S5 — updateNote persists patch (title and body) ─────────────────────────
{
  const { ctx, page } = await fresh()
  const result = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const n = await ws.createNote('Original')
    await ws.updateNote(n.id, { title: 'Updated', body: 'New body' })
    const after = ws.getState().notes.find((x) => x.id === n.id)
    return after
  })
  expect('S5: updateNote persists title patch',
    result?.title === 'Updated', `got "${result?.title}"`)
  expect('S5: updateNote persists body patch',
    result?.body === 'New body', `got "${result?.body}"`)
  await ctx.close()
}

// ── S6 — softDeleteNote sets deletedAt; record still in state ───────────────
{
  const { ctx, page } = await fresh()
  const result = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const n = await ws.createNote('To soft-delete')
    await ws.softDeleteNote(n.id)
    const after = ws.getState().notes.find((x) => x.id === n.id)
    return { exists: !!after, deletedAt: after?.deletedAt }
  })
  expect('S6: softDeleteNote keeps record in state',
    result.exists === true, JSON.stringify(result))
  expect('S6: softDeleteNote stamps deletedAt',
    typeof result.deletedAt === 'number' && result.deletedAt > 0,
    JSON.stringify(result))
  await ctx.close()
}

// ── S7 — restoreNote clears deletedAt ───────────────────────────────────────
{
  const { ctx, page } = await fresh()
  const result = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const n = await ws.createNote('To restore')
    await ws.softDeleteNote(n.id)
    await ws.restoreNote(n.id)
    const after = ws.getState().notes.find((x) => x.id === n.id)
    return { exists: !!after, deletedAt: after?.deletedAt }
  })
  expect('S7: restoreNote clears deletedAt',
    result.exists && result.deletedAt === undefined,
    JSON.stringify(result))
  await ctx.close()
}

// ── S8 — deleteNote (hard) removes from state ───────────────────────────────
{
  const { ctx, page } = await fresh()
  const result = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const n = await ws.createNote('To hard-delete')
    await ws.deleteNote(n.id)
    const after = ws.getState().notes.find((x) => x.id === n.id)
    return { exists: !!after }
  })
  expect('S8: hard deleteNote removes record from state',
    result.exists === false, JSON.stringify(result))
  await ctx.close()
}

// ── S9 — sidebar has Notes link ─────────────────────────────────────────────
{
  const { ctx, page } = await fresh()
  const count = await page.locator('[data-test="sidebar-link-notes"]').count()
  expect('S9: sidebar has Notes link', count >= 1, `count=${count}`)
  await ctx.close()
}

// ── S10 — clicking Notes link navigates to /notes ──────────────────────────
{
  const { ctx, page } = await fresh()
  await page.locator('[data-test="sidebar-link-notes"]').first().click()
  await page.waitForTimeout(200)
  expect('S10: clicking Notes link navigates to /notes',
    /#\/notes/.test(page.url()), `url=${page.url()}`)
  await ctx.close()
}

// ── S11 — Notes studio renders empty state with no selection ────────────────
{
  const { ctx, page } = await fresh()
  // Hard-delete the seed Welcome Note so we can hit the empty state.
  await page.evaluate(async () => {
    const ws = window.__verseStudio
    for (const n of ws.getState().notes) {
      await ws.deleteNote(n.id)
    }
    try { localStorage.removeItem('verse-studio:notes:lastSelected') } catch {}
  })
  await navByHash(page, '#/notes')
  await page.waitForTimeout(200)
  const empty = await page.locator('[data-test="notes-empty"]').count()
  expect('S11: Notes studio renders empty state with no notes',
    empty === 1, `count=${empty}`)
  await ctx.close()
}

// ── S12 — clicking "+ New" creates a Note and selects it ────────────────────
{
  const { ctx, page } = await fresh()
  await navByHash(page, '#/notes')
  await page.waitForTimeout(200)
  const before = await page.evaluate(() => window.__verseStudio.getState().notes.length)
  await page.locator('[data-test="notes-new"]').click()
  await page.waitForTimeout(200)
  const after = await page.evaluate(() => window.__verseStudio.getState().notes.length)
  expect('S12: clicking + New creates a Note',
    after === before + 1, `before=${before} after=${after}`)
  // Title input should now be visible (selection happened)
  const titleInputCount = await page.locator('[data-test="notes-title-input"]').count()
  expect('S12: + New selects the new Note',
    titleInputCount === 1, `count=${titleInputCount}`)
  await ctx.close()
}

// ── S13 — typing in title input autosaves ───────────────────────────────────
{
  const { ctx, page } = await fresh()
  const noteId = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const n = await ws.createNote('Pre')
    return n.id
  })
  await navByHash(page, '#/notes')
  await page.waitForTimeout(200)
  // Click the seeded list item to ensure it's selected
  await page.locator(`[data-test="notes-list-item"][data-note-id="${noteId}"]`).click()
  await page.waitForTimeout(200)
  await page.locator('[data-test="notes-title-input"]').fill('Title via input')
  await page.waitForTimeout(800)  // autosave debounce
  const titleAfter = await page.evaluate((id) => {
    const ws = window.__verseStudio
    return ws.getState().notes.find((n) => n.id === id)?.title
  }, noteId)
  expect('S13: typing in title input autosaves',
    titleAfter === 'Title via input', `got "${titleAfter}"`)
  await ctx.close()
}

// ── S14 — typing in body input autosaves ────────────────────────────────────
{
  const { ctx, page } = await fresh()
  const noteId = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const n = await ws.createNote('Body test')
    return n.id
  })
  await navByHash(page, '#/notes')
  await page.waitForTimeout(200)
  await page.locator(`[data-test="notes-list-item"][data-note-id="${noteId}"]`).click()
  await page.waitForTimeout(200)
  await page.locator('[data-test="notes-body-input"]').fill('# Markdown body\n\nWith multiple lines.')
  await page.waitForTimeout(800)
  const bodyAfter = await page.evaluate((id) => {
    const ws = window.__verseStudio
    return ws.getState().notes.find((n) => n.id === id)?.body
  }, noteId)
  expect('S14: typing in body input autosaves',
    /# Markdown body/.test(bodyAfter || ''),
    `got "${(bodyAfter || '').slice(0, 60)}"`)
  await ctx.close()
}

// ── S15 — project picker on Note assigns projectId ──────────────────────────
{
  const { ctx, page } = await fresh()
  const result = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const proj = await ws.createProject('S15 project')
    const n = await ws.createNote('Project test')
    await ws.updateNote(n.id, { projectId: proj.id })
    const after = ws.getState().notes.find((x) => x.id === n.id)
    return { projectId: after?.projectId, expected: proj.id }
  })
  expect('S15: Note projectId persists via updateNote',
    result.projectId === result.expected,
    JSON.stringify(result))
  await ctx.close()
}

// ── S16 — Note appears in Projects board Notes column ───────────────────────
{
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const proj = await ws.createProject('Board test')
    const n = await ws.createNote('Board note')
    await ws.updateNote(n.id, { projectId: proj.id })
    return { pId: proj.id, nId: n.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(200)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(300)
  // The board card for this note should be present
  const cardCount = await page.locator(`[data-test="board-card"][data-record-id="${ids.nId}"]`).count()
  expect('S16: Note appears as a board card under its project',
    cardCount === 1, `count=${cardCount}`)
  await ctx.close()
}

// ── S17 — Note appears in Atlas with notes filter on ───────────────────────
{
  const { ctx, page } = await fresh()
  await page.evaluate(async () => {
    const ws = window.__verseStudio
    await ws.createNote('Atlas note one')
    await ws.createNote('Atlas note two')
  })
  await navByHash(page, '#/atlas')
  await page.waitForTimeout(1500)  // settle
  const noteNodeCount = await page.locator('[data-node-type="note"]').count()
  expect('S17: Note nodes render in Atlas with notes filter on (default)',
    noteNodeCount >= 2, `count=${noteNodeCount}`)
  await ctx.close()
}

// ── S18 — Note hidden in Atlas with notes filter off ────────────────────────
{
  const { ctx, page } = await fresh()
  await page.evaluate(async () => {
    const ws = window.__verseStudio
    await ws.createNote('Atlas filter note')
  })
  await navByHash(page, '#/atlas')
  await page.waitForTimeout(1500)
  // Toggle the Notes kind filter off
  await page.locator('[data-test="atlas-filter-kind-note"]').click()
  await page.waitForTimeout(800)
  const noteNodeCount = await page.locator('[data-node-type="note"]').count()
  expect('S18: Note nodes hidden in Atlas with notes filter off',
    noteNodeCount === 0, `count=${noteNodeCount}`)
  await ctx.close()
}

// ── S19 — Note appears in Canvas project view as a card ────────────────────
{
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const proj = await ws.createProject('Canvas note proj')
    const n = await ws.createNote('Canvas note')
    await ws.updateNote(n.id, { projectId: proj.id })
    return { pId: proj.id, nId: n.id }
  })
  await navByHash(page, '#/canvas')
  await page.waitForTimeout(200)
  await page.locator('[data-test="canvas-project-picker"] button').click()
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-picker-menu"] button:has-text("Canvas note proj")`).click()
  await page.waitForTimeout(400)
  const cardCount = await page.locator(`[data-node-record-id="${ids.nId}"]`).count()
  expect('S19: Note renders as a Canvas card with kind=note',
    cardCount === 1, `count=${cardCount}`)
  const kindAttr = await page.locator(`[data-node-record-id="${ids.nId}"]`).getAttribute('data-node-kind')
  expect('S19: Canvas card has data-node-kind=note',
    kindAttr === 'note', `got "${kindAttr}"`)
  await ctx.close()
}

// ── S20 — tagging a Note creates a TagLink record ───────────────────────────
{
  const { ctx, page } = await fresh()
  const result = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const n = await ws.createNote('Tag test')
    const tag = await ws.createTag('newtag')
    await ws.tagItem({ tagId: tag.id, targetId: n.id, targetType: 'note' })
    const tl = ws.getState().tagLinks.find((x) =>
      x.tagId === tag.id && x.targetId === n.id && x.targetType === 'note')
    return { exists: !!tl }
  })
  expect('S20: tagging a Note creates a TagLink with targetType=note',
    result.exists === true, JSON.stringify(result))
  await ctx.close()
}

// ── S21 — linking a Note to a Document creates a Link record ────────────────
{
  const { ctx, page } = await fresh()
  const result = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const d = await ws.createDocument('Doc')
    const n = await ws.createNote('Linked note')
    await ws.createLink({
      sourceType: 'note', sourceId: n.id,
      targetType: 'document', targetId: d.id
    })
    const link = ws.getState().links.find((l) =>
      l.sourceType === 'note' && l.sourceId === n.id &&
      l.targetType === 'document' && l.targetId === d.id)
    return { exists: !!link }
  })
  expect('S21: linking Note→Document creates a Link record',
    result.exists === true, JSON.stringify(result))
  await ctx.close()
}

// ── S22 — global search finds Note by title substring ──────────────────────
{
  const { ctx, page } = await fresh()
  await page.evaluate(async () => {
    const ws = window.__verseStudio
    await ws.createNote('UniqueGlobalSearchTokenAlpha')
  })
  // Use Cmd+K palette as a deterministic search surface
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(200)
  await page.keyboard.type('UniqueGlobalSearchTokenAlpha')
  await page.waitForTimeout(300)
  // Look for the note among palette items
  const matchingItems = await page.locator('[data-test="palette-item"]')
    .filter({ hasText: 'UniqueGlobalSearchTokenAlpha' })
    .count()
  expect('S22: palette finds Note by title substring',
    matchingItems >= 1, `count=${matchingItems}`)
  await page.keyboard.press('Escape')
  await ctx.close()
}

// ── S23 — Inbox route-to-note creates a Note and soft-deletes the Inbox item
{
  const { ctx, page } = await fresh()
  const result = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const item = await ws.createInboxItem({ title: 'Route this', body: 'Inbox body content' })
    const newId = await ws.routeInboxItemTo(item.id, 'note')
    const note = ws.getState().notes.find((n) => n.id === newId)
    const inboxAfter = ws.getState().inboxItems.find((i) => i.id === item.id)
    return {
      newId,
      noteTitle: note?.title,
      noteBody: note?.body,
      inboxDeletedAt: inboxAfter?.deletedAt
    }
  })
  expect('S23: routeInboxItemTo("note") creates a Note',
    typeof result.newId === 'string' && result.newId.length > 0,
    JSON.stringify(result))
  expect('S23: routed Note has the inbox item title',
    result.noteTitle === 'Route this', JSON.stringify(result))
  expect('S23: routed Note has the inbox item body',
    result.noteBody === 'Inbox body content', JSON.stringify(result))
  expect('S23: routed inbox item is soft-deleted',
    typeof result.inboxDeletedAt === 'number',
    JSON.stringify(result))
  await ctx.close()
}

// ── S24 — snapshot of a Note round-trips ────────────────────────────────────
{
  const { ctx, page } = await fresh()
  const result = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const n = await ws.createNote('Snap test')
    await ws.updateNote(n.id, { body: 'Snapshot body' })
    const snap = await ws.createSnapshot({
      recordId: n.id,
      recordType: 'note',
      label: 'manual snap',
      data: JSON.stringify({ title: 'Snap test', body: 'Snapshot body' })
    })
    const after = ws.getState().snapshots.find((s) => s.id === snap.id)
    return {
      exists: !!after,
      recordType: after?.recordType,
      recordId: after?.recordId
    }
  })
  expect('S24: snapshot of a Note can be created',
    result.exists === true, JSON.stringify(result))
  expect('S24: snapshot has recordType="note"',
    result.recordType === 'note', JSON.stringify(result))
  await ctx.close()
}

// ── S25 — console-error sentinel ────────────────────────────────────────────
{
  const { ctx, page, errors } = await fresh()
  // Walk through several flows that exercise the new code paths
  await navByHash(page, '#/notes')
  await page.waitForTimeout(200)
  await page.locator('[data-test="notes-new"]').click()
  await page.waitForTimeout(200)
  await page.locator('[data-test="notes-title-input"]').fill('Sentinel test')
  await page.waitForTimeout(700)
  await navByHash(page, '#/atlas')
  await page.waitForTimeout(1500)
  await navByHash(page, '#/projects')
  await page.waitForTimeout(300)
  await navByHash(page, '#/canvas')
  await page.waitForTimeout(300)
  expect('S25: no console errors across notes/atlas/projects/canvas flows',
    errors.console.length === 0,
    JSON.stringify(errors.console))
  await ctx.close()
}

await browser.close()
server.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
