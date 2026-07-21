// verify-sweep29.mjs
// Sweep 29 — Right-click linking, Recent Views, Universal Back Button.
//
// Block U1..U18

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

let pass = 0, fail = 0

function expect(label, cond, detail = '') {
  if (cond) { console.log(`  PASS  ${label}`); pass++ }
  else { console.error(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`); fail++ }
}

async function ready(page) {
  await page.waitForFunction(() => !document.body.innerText.includes('Loading'), null, { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(150)
}

async function fresh() {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const errors = { console: [] }
  page.on('console', msg => { if (msg.type() === 'error') errors.console.push(msg.text()) })
  page.on('pageerror', err => { errors.console.push(err.message) })
  await page.goto(BASE)
  await ready(page)
  return { ctx, page, errors }
}

async function nav(page, hash) {
  await page.evaluate(h => { location.hash = h }, hash)
  await page.waitForTimeout(200)
}

console.log('\nBlock U — Sweep 29: right-click linking, recent views, back button')

// ── U1 — Back button present in TopBar ──────────────────────────────────────
{
  const { ctx, page } = await fresh()
  const btn = page.locator('[data-test="topbar-back"]')
  expect('U1: Back button present in TopBar', await btn.count() > 0)
  await ctx.close()
}

// ── U2 — Back button disabled on first page ──────────────────────────────────
{
  const { ctx, page } = await fresh()
  const disabled = await page.locator('[data-test="topbar-back"]').getAttribute('disabled')
  expect('U2: Back button disabled on initial load', disabled !== null, `disabled=${disabled}`)
  await ctx.close()
}

// ── U3 — Back button enabled after navigation ────────────────────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/writing')
  await page.waitForTimeout(300)
  const disabled = await page.locator('[data-test="topbar-back"]').getAttribute('disabled')
  expect('U3: Back button enabled after navigating to Writing', disabled === null, `disabled attr=${disabled}`)
  await ctx.close()
}

// ── U4 — Back button navigates back ─────────────────────────────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/writing')
  await page.waitForTimeout(200)
  await nav(page, '#/poetry')
  await page.waitForTimeout(200)
  await page.locator('[data-test="topbar-back"]').click()
  await page.waitForTimeout(400)
  const hash = await page.evaluate(() => location.hash)
  expect('U4: Back button navigates to previous route', hash === '#/writing', `hash=${hash}`)
  await ctx.close()
}

// ── U5 — Recent Views button present ────────────────────────────────────────
{
  const { ctx, page } = await fresh()
  expect('U5: Recent Views button present', await page.locator('[data-test="recent-views-btn"]').count() > 0)
  await ctx.close()
}

// ── U6 — Recent Views dropdown opens ────────────────────────────────────────
{
  const { ctx, page } = await fresh()
  await page.locator('[data-test="recent-views-btn"]').click()
  await page.waitForTimeout(200)
  expect('U6: Recent Views panel opens on click', await page.locator('[data-test="recent-views-panel"]').count() > 0)
  await ctx.close()
}

// ── U7 — Recent Views shows empty state before any views ─────────────────────
{
  const { ctx, page } = await fresh()
  await page.locator('[data-test="recent-views-btn"]').click()
  await page.waitForTimeout(200)
  const items = await page.locator('[data-test="recent-view-item"]').count()
  expect('U7: Recent Views empty on fresh start', items === 0, `items=${items}`)
  await ctx.close()
}

// ── U8 — Selecting a note adds it to Recent Views ────────────────────────────
{
  const { ctx, page } = await fresh()
  // Navigate to notes — seed note should be there
  await nav(page, '#/notes')
  await page.waitForTimeout(300)
  const noteItems = page.locator('[data-test="notes-list-item"]')
  if (await noteItems.count() > 0) {
    await noteItems.first().click()
    await page.waitForTimeout(400)
    // Open recent views
    await page.locator('[data-test="recent-views-btn"]').click()
    await page.waitForTimeout(200)
    const recentCount = await page.locator('[data-test="recent-view-item"]').count()
    expect('U8: Selecting a note adds it to Recent Views', recentCount > 0, `items=${recentCount}`)
  } else {
    expect('U8: Seed note present for recent view test', false, 'no notes found')
  }
  await ctx.close()
}

// ── U9 — Recent Views item navigates to the record ───────────────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/notes')
  await page.waitForTimeout(300)
  const noteItems = page.locator('[data-test="notes-list-item"]')
  if (await noteItems.count() > 0) {
    await noteItems.first().click()
    await page.waitForTimeout(300)
    await nav(page, '#/writing')
    await page.waitForTimeout(200)
    // Open recent and click the note entry
    await page.locator('[data-test="recent-views-btn"]').click()
    await page.waitForTimeout(200)
    const firstItem = page.locator('[data-test="recent-view-item"]').first()
    if (await firstItem.count() > 0) {
      await firstItem.click()
      await page.waitForTimeout(400)
      const hash = await page.evaluate(() => location.hash)
      expect('U9: Clicking recent view navigates to notes', hash === '#/notes', `hash=${hash}`)
    } else {
      expect('U9: Recent view item present for navigation', false, 'no items')
    }
  } else {
    expect('U9: Notes present for navigation test', false, 'no notes')
  }
  await ctx.close()
}

// ── U10 — Right-click on note list item shows context menu ───────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/notes')
  await page.waitForTimeout(300)
  const noteItem = page.locator('[data-test="notes-list-item"]').first()
  if (await noteItem.count() > 0) {
    await noteItem.click({ button: 'right' })
    await page.waitForTimeout(200)
    expect('U10: Right-click on note shows context menu', await page.locator('[data-test="list-item-menu"]').count() > 0)
  } else {
    expect('U10: Seed note present for right-click test', false, 'no notes')
  }
  await ctx.close()
}

// ── U11 — Context menu has Open, Link to, Shelf, Delete ─────────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/notes')
  await page.waitForTimeout(300)
  const noteItem = page.locator('[data-test="notes-list-item"]').first()
  if (await noteItem.count() > 0) {
    await noteItem.click({ button: 'right' })
    await page.waitForTimeout(200)
    expect('U11a: Context menu has Open', await page.locator('[data-test="list-item-menu-open"]').count() > 0)
    expect('U11b: Context menu has Link to', await page.locator('[data-test="list-item-menu-link"]').count() > 0)
    expect('U11c: Context menu has Add to Shelf', await page.locator('[data-test="list-item-menu-shelf"]').count() > 0)
    expect('U11d: Context menu has Delete', await page.locator('[data-test="list-item-menu-delete"]').count() > 0)
  } else {
    expect('U11: Seed note for menu items test', false, 'no notes')
  }
  await ctx.close()
}

// ── U12 — Context menu Open selects the note ────────────────────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/notes')
  await page.waitForTimeout(300)
  const noteItem = page.locator('[data-test="notes-list-item"]').first()
  if (await noteItem.count() > 0) {
    await noteItem.click({ button: 'right' })
    await page.waitForTimeout(200)
    await page.locator('[data-test="list-item-menu-open"]').click()
    await page.waitForTimeout(300)
    expect('U12: Context menu Open shows note editor', await page.locator('[data-test="notes-title-input"]').count() > 0)
    expect('U12b: Context menu dismissed after Open', await page.locator('[data-test="list-item-menu"]').count() === 0)
  } else {
    expect('U12: Seed note for Open test', false, 'no notes')
  }
  await ctx.close()
}

// ── U13 — Context menu dismisses on outside click ────────────────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/notes')
  await page.waitForTimeout(300)
  const noteItem = page.locator('[data-test="notes-list-item"]').first()
  if (await noteItem.count() > 0) {
    await noteItem.click({ button: 'right' })
    await page.waitForTimeout(200)
    expect('U13a: Menu appeared', await page.locator('[data-test="list-item-menu"]').count() > 0)
    // Click elsewhere
    await page.locator('[data-test="route-stub-notes"]').click({ position: { x: 600, y: 300 } })
    await page.waitForTimeout(200)
    expect('U13b: Menu dismissed on outside click', await page.locator('[data-test="list-item-menu"]').count() === 0)
  } else {
    expect('U13: Seed note for dismiss test', false, 'no notes')
  }
  await ctx.close()
}

// ── U14 — Right-click on doc in Writing Studio ───────────────────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/writing')
  await page.waitForTimeout(300)
  const docItem = page.locator('[data-test="doc-item"]').first()
  if (await docItem.count() > 0) {
    await docItem.click({ button: 'right' })
    await page.waitForTimeout(200)
    expect('U14: Right-click on doc shows context menu', await page.locator('[data-test="list-item-menu"]').count() > 0)
  } else {
    expect('U14: Seed doc present for right-click test', false, 'no docs')
  }
  await ctx.close()
}

// ── U15 — Right-click on poem in Poetry Studio ───────────────────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/poetry')
  await page.waitForTimeout(300)
  const poemItem = page.locator('[data-test="poem-item"]').first()
  if (await poemItem.count() > 0) {
    await poemItem.click({ button: 'right' })
    await page.waitForTimeout(200)
    expect('U15: Right-click on poem shows context menu', await page.locator('[data-test="list-item-menu"]').count() > 0)
  } else {
    expect('U15: Seed poem present for right-click test', false, 'no poems')
  }
  await ctx.close()
}

// ── U16 — Shelf toggle from context menu ────────────────────────────────────
{
  const { ctx, page } = await fresh()
  await nav(page, '#/notes')
  await page.waitForTimeout(300)
  const noteItem = page.locator('[data-test="notes-list-item"]').first()
  if (await noteItem.count() > 0) {
    await noteItem.click({ button: 'right' })
    await page.waitForTimeout(200)
    await page.locator('[data-test="list-item-menu-shelf"]').click()
    await page.waitForTimeout(300)
    // Check shelf now has an item (via ws API)
    const shelfLen = await page.evaluate(() => window.__verseStudio?.shelfItems?.length ?? 0)
    expect('U16: Shelf add via context menu creates a shelf item', shelfLen > 0, `shelfLen=${shelfLen}`)
  } else {
    expect('U16: Seed note present for shelf test', false, 'no notes')
  }
  await ctx.close()
}

// ── U17 — Bundle size within budget ──────────────────────────────────────────
{
  const { statSync } = await import('fs')
  const stat = statSync(resolve(__dirname, 'verse-studio.html'))
  const kb = stat.size / 1024
  expect(`U17: Bundle ≤ 645 KB (actual: ${kb.toFixed(1)} KB)`, kb <= 645, `${kb.toFixed(1)} KB`)
}

// ── U18 — Console-error sentinel ────────────────────────────────────────────
{
  const { ctx, page, errors } = await fresh()
  await nav(page, '#/notes')
  await page.waitForTimeout(200)
  const noteItem = page.locator('[data-test="notes-list-item"]').first()
  if (await noteItem.count() > 0) {
    await noteItem.click()
    await page.waitForTimeout(300)
    await noteItem.click({ button: 'right' })
    await page.waitForTimeout(200)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  }
  await page.locator('[data-test="recent-views-btn"]').click()
  await page.waitForTimeout(200)
  await page.keyboard.press('Escape')
  await nav(page, '#/writing')
  await page.waitForTimeout(200)
  await nav(page, '#/poetry')
  await page.waitForTimeout(200)
  await page.locator('[data-test="topbar-back"]').click()
  await page.waitForTimeout(300)
  expect('U18: No console errors across all Sweep 29 flows',
    errors.console.length === 0,
    JSON.stringify(errors.console))
  await ctx.close()
}

await browser.close()
server.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
