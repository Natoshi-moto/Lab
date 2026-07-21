// verify-sweep25.mjs
// Sweep 25 — Projects studio workspace deck-out.
//
// Block Q1..Q9 — drawer, breadcrumb, quick-capture, stream.

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
  await page.goto(`${BASE}/#/writing`)
  await ready(page)
  return { ctx, page }
}

async function navByHash(page, hash) {
  await page.evaluate((h) => { location.hash = h }, hash)
  await page.waitForTimeout(200)
}

console.log('\nBlock Q — Projects workspace (Sweep 25)')

{
  // Q1 — ProjectHub renders with stat strip
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('Hub test')
    const d = await ws.createDocument('A')
    await ws.updateDocument(d.id, { projectId: p.id })
    return { pId: p.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(150)
  const hubVisible = await page.locator('[data-test="project-hub"]').count()
  expect('Q1: ProjectHub renders', hubVisible === 1, `count=${hubVisible}`)
  const stat = await page.locator('[data-test="project-stat-strip"]').textContent()
  expect('Q1: stat strip shows item count', /1\s*item/.test(stat || ''), `got "${stat}"`)
  await ctx.close()
}

{
  // Q2 — Quick capture creates + attaches a record in one action
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('QC test')
    return { pId: p.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator('[data-test="quick-capture-input"]').fill('Captured doc')
  await page.locator('[data-test="quick-capture-commit"]').click()
  await page.waitForTimeout(250)
  const docCount = await page.evaluate((pId) => {
    const ws = window.__verseStudio
    return ws.getState().documents.filter(d => d.projectId === pId && !d.deletedAt && d.title === 'Captured doc').length
  }, ids.pId)
  expect('Q2: quick capture created an attached document', docCount === 1, `count=${docCount}`)
  // ...AND opened the drawer
  const drawer = await page.locator('[data-test="card-drawer"]').count()
  expect('Q2: quick capture opens the drawer for the new card', drawer === 1, `count=${drawer}`)
  await ctx.close()
}

{
  // Q3 — Clicking a card opens the drawer (no navigation)
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('Drawer test')
    const d = await ws.createDocument('Drawer doc')
    await ws.updateDocument(d.id, { projectId: p.id })
    return { pId: p.id, dId: d.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator(`[data-test="board-card"][data-record-id="${ids.dId}"]`).click()
  await page.waitForTimeout(200)
  const drawer = await page.locator('[data-test="card-drawer"]').count()
  expect('Q3: card click opens drawer', drawer === 1, `count=${drawer}`)
  // No navigation occurred (still on /projects)
  const url = page.url()
  expect('Q3: no navigation away from /projects', /#\/projects/.test(url), `url=${url}`)
  await ctx.close()
}

{
  // Q4 — Drawer mini-editor autosaves the title
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('Save test')
    const d = await ws.createDocument('Original')
    await ws.updateDocument(d.id, { projectId: p.id })
    return { pId: p.id, dId: d.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator(`[data-test="board-card"][data-record-id="${ids.dId}"]`).click()
  await page.waitForTimeout(200)
  await page.locator('[data-test="drawer-title"]').fill('Edited via drawer')
  await page.waitForTimeout(700)  // autosave debounce
  const titleAfter = await page.evaluate((id) => {
    const ws = window.__verseStudio
    const d = ws.getState().documents.find((x) => x.id === id)
    return d ? d.title : null
  }, ids.dId)
  expect('Q4: drawer-title autosave persists to the record',
    titleAfter === 'Edited via drawer', `got "${titleAfter}"`)
  await ctx.close()
}

{
  // Q5 — Esc closes the drawer
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('Esc test')
    const d = await ws.createDocument('Esc doc')
    await ws.updateDocument(d.id, { projectId: p.id })
    return { pId: p.id, dId: d.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator(`[data-test="board-card"][data-record-id="${ids.dId}"]`).click()
  await page.waitForTimeout(200)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  const drawer = await page.locator('[data-test="card-drawer"]').count()
  expect('Q5: Esc closes the drawer', drawer === 0, `count=${drawer}`)
  await ctx.close()
}

{
  // Q6 — "Open in studio" from the drawer sets project context AND navigates
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('Studio test')
    const d = await ws.createDocument('Studio doc')
    await ws.updateDocument(d.id, { projectId: p.id })
    return { pId: p.id, dId: d.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator(`[data-test="board-card"][data-record-id="${ids.dId}"]`).click()
  await page.waitForTimeout(200)
  await page.locator('[data-test="card-drawer-open-in-studio"]').click()
  await page.waitForTimeout(300)
  expect('Q6: navigated to /writing', /#\/writing/.test(page.url()), `url=${page.url()}`)
  // Breadcrumb is rendered in TopBar
  const crumb = await page.locator('[data-test="from-project-breadcrumb"]').count()
  expect('Q6: breadcrumb pill renders in TopBar', crumb === 1, `count=${crumb}`)
  // Breadcrumb references the right project
  const crumbProj = await page.locator('[data-test="from-project-breadcrumb"]').getAttribute('data-project-id')
  expect('Q6: breadcrumb references the source project',
    crumbProj === ids.pId, `got "${crumbProj}"`)
  await ctx.close()
}

{
  // Q7 — Clicking the breadcrumb returns to /projects
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('Round-trip test')
    const d = await ws.createDocument('RT doc')
    await ws.updateDocument(d.id, { projectId: p.id })
    return { pId: p.id, dId: d.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator(`[data-test="board-card"][data-record-id="${ids.dId}"]`).click()
  await page.waitForTimeout(200)
  await page.locator('[data-test="card-drawer-open-in-studio"]').click()
  await page.waitForTimeout(300)
  // Now click the breadcrumb.
  await page.locator('[data-test="from-project-breadcrumb"]').click()
  await page.waitForTimeout(300)
  expect('Q7: breadcrumb click returns to /projects', /#\/projects/.test(page.url()), `url=${page.url()}`)
  // And clears (we're on /projects now).
  const crumbAfter = await page.locator('[data-test="from-project-breadcrumb"]').count()
  expect('Q7: breadcrumb auto-clears on /projects', crumbAfter === 0, `count=${crumbAfter}`)
  await ctx.close()
}

{
  // Q8 — Project Stream shows events for attached items
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('Stream test')
    const d1 = await ws.createDocument('Doc one')
    const d2 = await ws.createDocument('Doc two')
    await ws.updateDocument(d1.id, { projectId: p.id })
    await ws.updateDocument(d2.id, { projectId: p.id })
    return { pId: p.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(200)
  // Stream tab is the default side-panel mode.
  const streamVisible = await page.locator('[data-test="project-stream"]').count()
  expect('Q8: stream panel is visible by default', streamVisible === 1, `count=${streamVisible}`)
  const eventCount = await page.locator('[data-test="stream-event"]').count()
  expect('Q8: stream renders at least 2 created events',
    eventCount >= 2, `count=${eventCount}`)
  await ctx.close()
}

{
  // Q9 — Backdrop click closes the drawer
  const { ctx, page } = await fresh()
  const ids = await page.evaluate(async () => {
    const ws = window.__verseStudio
    const p = await ws.createProject('Backdrop test')
    const d = await ws.createDocument('BD doc')
    await ws.updateDocument(d.id, { projectId: p.id })
    return { pId: p.id, dId: d.id }
  })
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.locator(`[data-test="project-item"][data-project-id="${ids.pId}"]`).click()
  await page.waitForTimeout(150)
  await page.locator(`[data-test="board-card"][data-record-id="${ids.dId}"]`).click()
  await page.waitForTimeout(200)
  await page.locator('[data-test="card-drawer-backdrop"]').click()
  await page.waitForTimeout(150)
  const drawer = await page.locator('[data-test="card-drawer"]').count()
  expect('Q9: backdrop click closes the drawer', drawer === 0, `count=${drawer}`)
  await ctx.close()
}

await browser.close()
server.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
