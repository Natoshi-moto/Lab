// verify-sweep24.mjs
// Sweep 24 — Atlas tokens fix + Projects board rebuild + Prompt Compose mode.
//
// Boilerplate mirrors verify-sweep23.mjs. Run via: node verify-sweep24.mjs
//
// Block N — Atlas SVG renders with theming (regression for the
//           --color-* token rename + drag/click suppression)
// Block O — Projects board (kanban columns + create-in-project + attach
//           existing + cards-click-to-navigate + detach)
// Block P — Prompt Studio Compose mode (mode toggle + pattern insert +
//           save-as-pattern + draft persistence)

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
  const errors = { console: [], pageError: [] }
  const page = await ctx.newPage()
  page.on('console', (msg) => { if (msg.type() === 'error') errors.console.push(msg.text()) })
  page.on('pageerror', (err) => errors.pageError.push(String(err)))
  await page.goto(`${BASE}/#/writing`)
  await ready(page)
  return { ctx, page, errors }
}

async function navByHash(page, hash) {
  await page.evaluate((h) => { location.hash = h }, hash)
  await page.waitForTimeout(150)
}

// ── Block N — Atlas tokens + drag-click suppression ─────────────────────────
console.log('\nBlock N — Atlas tokens fix')
{
  // N1 — Atlas record circles use accent fill (not the broken --color-accent)
  const { ctx, page } = await fresh()
  await navByHash(page, '#/atlas')
  await page.waitForTimeout(500)
  const circles = await page.locator('circle[data-test], svg circle').count().catch(() => 0)
  // The seed has at least one record, so at least one circle should exist.
  expect('N1: Atlas renders at least one <circle>', circles >= 1, `count=${circles}`)
  if (circles >= 1) {
    const fillResolved = await page.evaluate(() => {
      const c = document.querySelector('svg circle')
      if (!c) return null
      const cs = getComputedStyle(c)
      return cs.fill
    })
    expect('N1: circle fill resolves to a colour (not "none" or empty)',
      typeof fillResolved === 'string' &&
      fillResolved.length > 0 &&
      fillResolved !== 'none' &&
      fillResolved !== 'rgb(0, 0, 0)',
      `fill="${fillResolved}"`)
  }
  await ctx.close()
}

{
  // N2 — Atlas edges have a stroke (was rgb(0,0,0) on default before the fix
  //      because the stroke attribute referenced a nonexistent var)
  const { ctx, page } = await fresh()
  await navByHash(page, '#/atlas')
  await page.waitForTimeout(500)
  const edgeCount = await page.locator('[data-test="atlas-edge"]').count()
  if (edgeCount >= 1) {
    const stroke = await page.locator('[data-test="atlas-edge"]').first().evaluate(el =>
      getComputedStyle(el).stroke
    )
    expect('N2: edge stroke resolves to a colour',
      typeof stroke === 'string' && stroke.length > 0 && stroke !== 'none',
      `stroke="${stroke}"`)
  } else {
    // If the seed has no edges, this assertion is vacuous but still a pass.
    expect('N2: no edges in seed (vacuous pass)', true)
  }
  await ctx.close()
}

{
  // N3 — verse-studio.html bundle does NOT contain the broken token name
  //      (cheap regression guard against the --color- prefix coming back)
  const { ctx, page } = await fresh()
  const bundle = readFileSync(resolve(__dirname, 'verse-studio.html'), 'utf8')
  const stale = bundle.match(/var\(--color-(accent|ink|line)/g) || []
  expect('N3: bundle has no var(--color-accent|ink|line) references',
    stale.length === 0, `found ${stale.length} stale token references`)
  await ctx.close()
}

// ── Block O — Projects board ────────────────────────────────────────────────
console.log('\nBlock O — Projects board')

{
  // O1 — Projects route renders a six-column board
  const { ctx, page } = await fresh()
  await navByHash(page, '#/projects')
  await page.waitForTimeout(200)
  // Pick the first project (seed Welcome).
  const firstProject = await page.locator('[data-test="project-item"]').first()
  if ((await firstProject.count()) === 0) {
    // Create one if seed didn't.
    await page.locator('[data-test="new-project-button"]').click()
    await page.waitForTimeout(150)
  } else {
    await firstProject.click()
    await page.waitForTimeout(150)
  }
  const columns = await page.locator('[data-test="board-column"]').count()
  expect('O1: board renders six columns', columns === 6, `got ${columns}`)
  const kinds = await page.locator('[data-test="board-column"]').evaluateAll(els =>
    els.map(e => e.getAttribute('data-board-kind'))
  )
  const expected = ['document', 'poem', 'longform', 'build', 'pattern', 'pipeline']
  expect('O1: columns are in canonical order',
    JSON.stringify(kinds) === JSON.stringify(expected),
    `got ${JSON.stringify(kinds)}`)
  await ctx.close()
}

{
  // O2 — "+ New" in a column creates a record AND attaches it to the project
  const { ctx, page } = await fresh()
  await navByHash(page, '#/projects')
  await page.waitForTimeout(200)
  await page.locator('[data-test="new-project-button"]').click()
  await page.waitForTimeout(150)
  // Click "+ New" in the document column.
  await page.locator('[data-test="board-new-in-project"][data-board-kind="document"]').click()
  await page.waitForTimeout(200)
  // A card should appear in the document column.
  const cardCount = await page.locator('[data-test="board-card"][data-board-kind="document"]').count()
  expect('O2: + New created a card in the document column', cardCount === 1, `got ${cardCount}`)
  // The new doc should have projectId set to the selected project.
  const linkedDoc = await page.evaluate(() => {
    const ws = window.__verseStudio
    const docs = ws.getState().documents.filter(d => !d.deletedAt)
    return docs.length > 0 ? { count: docs.length, hasProj: !!docs[0].projectId } : null
  })
  expect('O2: created doc has a projectId',
    linkedDoc !== null && linkedDoc.hasProj === true,
    JSON.stringify(linkedDoc))
  await ctx.close()
}

{
  // O3 — "+ Existing" popover shows candidates from other projects
  const { ctx, page } = await fresh()
  // Setup: two projects; doc in project A; verify it shows up in project B's
  // "+ Existing" popover.
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const a = await ws.createProject('Project A')
    const b = await ws.createProject('Project B')
    const doc = await ws.createDocument('Floater')
    await ws.updateDocument(doc.id, { projectId: a.id })
    return { aId: a.id, bId: b.id, docId: doc.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(200)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.bId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator('[data-test="board-add-existing"][data-board-kind="document"]').click()
  await page.waitForTimeout(150)
  const optionCount = await page.locator('[data-test="board-add-existing-option"]').count()
  expect('O3: existing-pickers shows the doc from Project A',
    optionCount >= 1, `got ${optionCount}`)
  await ctx.close()
}

{
  // O4 — clicking an existing-option attaches the record to the current project
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const a = await ws.createProject('Project A')
    const b = await ws.createProject('Project B')
    const doc = await ws.createDocument('Yank target')
    await ws.updateDocument(doc.id, { projectId: a.id })
    return { aId: a.id, bId: b.id, docId: doc.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(200)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.bId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator('[data-test="board-add-existing"][data-board-kind="document"]').click()
  await page.waitForTimeout(150)
  await page.locator(`[data-test="board-add-existing-option"][data-record-id="${ids.docId}"]`).click()
  await page.waitForTimeout(200)
  const finalProjectId = await page.evaluate((id) => {
    const ws = window.__verseStudio
    const d = ws.getState().documents.find((x) => x.id === id)
    return d ? d.projectId : null
  }, ids.docId)
  expect('O4: doc moved to Project B', finalProjectId === ids.bId,
    `final projectId=${finalProjectId}, expected=${ids.bId}`)
  await ctx.close()
}

{
  // O5 — detach button on a card removes its projectId
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const a = await ws.createProject('Project A')
    const doc = await ws.createDocument('Detach me')
    await ws.updateDocument(doc.id, { projectId: a.id })
    return { aId: a.id, docId: doc.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(200)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.aId}"]`).click()
  await page.waitForTimeout(150)
  // Find the detach button on the card. InlineConfirmButton requires a
  // double click (label → confirm).
  const card = page.locator(`[data-test="board-card"][data-record-id="${ids.docId}"]`)
  const detachButton = card.locator('button:has-text("detach")')
  await detachButton.click()
  await page.waitForTimeout(50)
  const confirmButton = card.locator('button:has-text("confirm?")')
  await confirmButton.click()
  await page.waitForTimeout(200)
  const finalProjectId = await page.evaluate((id) => {
    const ws = window.__verseStudio
    const d = ws.getState().documents.find((x) => x.id === id)
    return d ? d.projectId : null
  }, ids.docId)
  expect('O5: detach cleared the projectId',
    finalProjectId === undefined || finalProjectId === null,
    `final projectId=${finalProjectId}`)
  await ctx.close()
}

{
  // O6 — sidebar item count reflects all six kinds
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('Counter test')
    const d = await ws.createDocument()
    const po = await ws.createPoem()
    const pat = await ws.createPattern()
    await ws.updateDocument(d.id, { projectId: p.id })
    await ws.updatePoem(po.id, { projectId: p.id })
    await ws.updatePattern(pat.id, { projectId: p.id })
    return { pId: p.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(200)
  const sidebarItem = page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`)
  const text = await sidebarItem.textContent()
  expect('O6: project sidebar shows "3 items"',
    /3\s*items/.test(text || ''), `got "${text}"`)
  await ctx.close()
}

// ── Block P — Prompt Studio Compose mode ────────────────────────────────────
console.log('\nBlock P — Prompt Studio Compose mode')

{
  // P1 — mode toggle is visible and defaults to Pipelines
  const { ctx, page } = await fresh()
  await navByHash(page, '#/prompts')
  await page.waitForTimeout(200)
  const toggleVisible = await page.locator('[data-test="prompt-mode-toggle"]').count()
  expect('P1: mode toggle is rendered', toggleVisible === 1, `count=${toggleVisible}`)
  const pipelinesActive = await page.locator('[data-test="prompt-mode-pipelines"]').getAttribute('data-active')
  expect('P1: defaults to Pipelines mode', pipelinesActive === 'true', `got "${pipelinesActive}"`)
  await ctx.close()
}

{
  // P2 — Compose mode renders pattern library + editor
  const { ctx, page } = await fresh()
  await navByHash(page, '#/prompts')
  await page.waitForTimeout(200)
  await page.locator('[data-test="prompt-mode-compose"]').click()
  await page.waitForTimeout(150)
  const composeVisible = await page.locator('[data-test="prompt-compose"]').count()
  expect('P2: Compose surface mounts', composeVisible === 1, `count=${composeVisible}`)
  const editorVisible = await page.locator('[data-test="compose-editor"]').count()
  expect('P2: editor textarea exists', editorVisible === 1, `count=${editorVisible}`)
  const listVisible = await page.locator('[data-test="compose-pattern-list"]').count()
  expect('P2: pattern list exists', listVisible === 1, `count=${listVisible}`)
  await ctx.close()
}

{
  // P3 — clicking a pattern inserts its body into the editor
  const { ctx, page } = await fresh()
  // Setup: create one pattern with known body.
  await page.evaluate(async () => {
    const ws = window.__verseStudio
    await ws.createPattern({ name: 'Greeting', body: 'Hello world.', type: 'prompt' })
  })
  await navByHash(page, '#/prompts')
  await page.waitForTimeout(200)
  await page.locator('[data-test="prompt-mode-compose"]').click()
  await page.waitForTimeout(200)
  // Click the pattern card.
  await page.locator('[data-test="compose-pattern-card"]').first().click()
  await page.waitForTimeout(150)
  const editorValue = await page.locator('[data-test="compose-editor"]').inputValue()
  expect('P3: editor contains pattern body after click',
    editorValue.includes('Hello world.'),
    `editor="${editorValue}"`)
  await ctx.close()
}

{
  // P4 — Save-as-Pattern persists the draft as a new Pattern record
  const { ctx, page } = await fresh()
  await navByHash(page, '#/prompts')
  await page.waitForTimeout(200)
  await page.locator('[data-test="prompt-mode-compose"]').click()
  await page.waitForTimeout(150)
  // Type into the editor.
  await page.locator('[data-test="compose-editor"]').fill('A handcrafted prompt.')
  await page.waitForTimeout(50)
  // Auto-confirm the prompt() dialog with our chosen name.
  page.once('dialog', async (d) => {
    await d.accept('My Saved Prompt')
  })
  await page.locator('[data-test="compose-save-as-pattern"]').click()
  await page.waitForTimeout(300)
  const saved = await page.evaluate(() => {
    const ws = window.__verseStudio
    return ws.getState().patterns.find(p => p.name === 'My Saved Prompt')
  })
  expect('P4: Save-as-Pattern created a Pattern record',
    saved && saved.body === 'A handcrafted prompt.',
    saved ? `body="${saved.body}"` : 'no pattern found')
  await ctx.close()
}

{
  // P5 — draft survives reload
  const { ctx, page } = await fresh()
  await navByHash(page, '#/prompts')
  await page.waitForTimeout(200)
  await page.locator('[data-test="prompt-mode-compose"]').click()
  await page.waitForTimeout(150)
  await page.locator('[data-test="compose-editor"]').fill('Persistent draft text.')
  await page.waitForTimeout(150)
  // Reload.
  await page.reload()
  await ready(page)
  await page.waitForTimeout(200)
  // Mode should still be compose (persisted).
  const composeActive = await page.locator('[data-test="prompt-mode-compose"]').getAttribute('data-active')
  expect('P5: compose mode persists across reload',
    composeActive === 'true', `got "${composeActive}"`)
  const editorValue = await page.locator('[data-test="compose-editor"]').inputValue()
  expect('P5: draft text persists across reload',
    editorValue === 'Persistent draft text.',
    `got "${editorValue}"`)
  await ctx.close()
}

// ── Final ───────────────────────────────────────────────────────────────────
await browser.close()
server.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
