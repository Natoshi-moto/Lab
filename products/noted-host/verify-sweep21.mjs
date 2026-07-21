// verify-sweep21.mjs
// Sweep 21: Universal palette search — tags + patterns + pipelines, tags prioritized
//
// Cumulative expectation post-Sweep-21:
//   sweeps 7–20 unchanged: 793 / 0
//   sweep 21:              this file's pass count
//   total:                 793 + this file's pass count
//
// Tests:
//   Block 1 — Seeded tag reachable from palette, ranked above matching doc
//   Block 2 — Picking a tag navigates to /settings
//   Block 3 — Patterns appear in palette and jump correctly
//   Block 4 — Pipelines appear in palette and jump correctly
//   Block 5 — Soft-deleted patterns and pipelines absent from palette
//   Block 6 — Routes first, tag at position 10 (empty query ordering)
//   Block 7 — Existing route navigation preserved (regression spot-check)
//   Block 8 — Newly created tag appears in palette dynamically

import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const HTML = path.join(__dirname, 'verse-studio.html')

if (!fs.existsSync(HTML)) {
  console.error('verse-studio.html not found — run npm run build first')
  process.exit(1)
}

let pass = 0
let fail = 0

function ok(label) {
  console.log(`  ✓ ${label}`)
  pass++
}
function notOk(label, detail = '') {
  console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`)
  fail++
}
function assert(cond, label, detail = '') {
  cond ? ok(label) : notOk(label, detail)
}

// ---------------------------------------------------------------------------
// IDB helpers
// ---------------------------------------------------------------------------
async function readStore(page, store) {
  return page.evaluate((s) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('verse-studio')
      req.onsuccess = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(s)) { resolve([]); return }
        const tx  = db.transaction([s], 'readonly')
        const st  = tx.objectStore(s)
        const all = st.getAll()
        all.onsuccess = () => resolve(all.result)
        all.onerror   = () => reject(String(all.error))
      }
      req.onerror = () => reject(String(req.error))
    })
  }, store)
}

async function waitReady(page) {
  await page.waitForFunction(() => !document.body.innerText.includes('Loading'), { timeout: 10000 })
}

async function goto(page, hash) {
  await page.evaluate((h) => { location.hash = h }, hash)
  await page.waitForTimeout(300)
}

async function twoClickByTestId(page, testId, timeoutMs = 500) {
  const btn = page.locator(`[data-test="${testId}"]`).first()
  if ((await btn.count()) === 0) return false
  await btn.click({ force: true })
  await page.waitForTimeout(timeoutMs)
  await btn.click({ force: true })
  return true
}

async function openPalette(page) {
  await page.keyboard.press('Meta+k')
  await page.waitForSelector('[data-test="palette"]', { timeout: 3000 })
  await page.waitForTimeout(150)
}

async function closePalette(page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const launchOpts = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {}
const browser = await chromium.launch(launchOpts)

// Fresh page helper
async function freshPage() {
  const ctx  = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`file://${HTML}`)
  await waitReady(page)
  return { page, ctx }
}

// ===========================================================================
// Block 1 — Seeded tag reachable from palette, ranked above matching doc
// ===========================================================================
console.log('\nBlock 1 — Seeded tag reachable from palette, ranked above matching doc')
{
  const { page, ctx } = await freshPage()

  await goto(page, '/writing')
  await openPalette(page)
  await page.fill('[data-test="palette-input"]', 'note')
  await page.waitForTimeout(200)

  const items = await page.locator('[data-test="palette-item"]').all()
  const kinds = []
  const labels = []
  for (const item of items) {
    kinds.push(await item.getAttribute('data-palette-kind'))
    labels.push((await item.textContent() || '').trim())
  }

  const tagIdx = kinds.indexOf('tag')
  const docIdx = kinds.findIndex((k, i) => k === 'document' && labels[i].includes('note'))

  assert(tagIdx >= 0, 'Block 1a: tag item exists in filtered results')
  if (tagIdx >= 0) {
    const tagLabel = labels[tagIdx] || ''
    assert(tagLabel.includes('note'), `Block 1b: tag label includes "note" (got "${tagLabel}")`)
  } else {
    notOk('Block 1b: tag label includes "note" (skipped — no tag found)')
  }
  assert(
    tagIdx >= 0 && docIdx >= 0 && tagIdx < docIdx,
    'Block 1c: tag item appears before matching document item',
    `tagIdx=${tagIdx} docIdx=${docIdx}`
  )

  await closePalette(page)
  await ctx.close()
}

// ===========================================================================
// Block 2 — Picking a tag navigates to /settings
// ===========================================================================
console.log('\nBlock 2 — Picking a tag navigates to /settings')
{
  const { page, ctx } = await freshPage()

  await goto(page, '/writing')
  await openPalette(page)
  await page.fill('[data-test="palette-input"]', 'note')
  await page.waitForTimeout(200)

  const tagItem = page.locator('[data-test="palette-item"][data-palette-kind="tag"]').first()
  await tagItem.click()
  await page.waitForTimeout(300)

  const paletteCount = await page.locator('[data-test="palette"]').count()
  assert(paletteCount === 0, 'Block 2a: palette closes after tag click')

  const hash = await page.evaluate(() => window.location.hash)
  assert(hash === '#/settings', `Block 2b: navigates to #/settings (got "${hash}")`)

  await ctx.close()
}

// ===========================================================================
// Block 3 — Patterns appear in palette and jump correctly
// ===========================================================================
console.log('\nBlock 3 — Patterns appear in palette and jump correctly')
{
  const { page, ctx } = await freshPage()

  await goto(page, '/library')
  await page.waitForTimeout(300)

  await page.click('[data-test="new-pattern"]')
  await page.waitForTimeout(300)

  await page.fill('[data-test="pattern-name"]', 'PaletteTestPattern')
  await page.waitForTimeout(700)

  const patterns = await readStore(page, 'patterns')
  const pattern  = patterns.find((p) => p.name === 'PaletteTestPattern')
  assert(!!pattern, 'Block 3a: PaletteTestPattern exists in IDB')

  if (!pattern) {
    notOk('Block 3b: pattern palette item visible (skipped — pattern not in IDB)')
    notOk('Block 3c: clicking pattern closes palette (skipped)')
    notOk('Block 3d: hash is #/library (skipped)')
    notOk('Block 3e: localStorage key set to patternId (skipped)')
    await ctx.close()
  } else {
    const patternId = pattern.id
    await goto(page, '/writing')
    await page.waitForTimeout(300)

    await openPalette(page)
    await page.fill('[data-test="palette-input"]', 'PaletteTestPattern')
    await page.waitForTimeout(200)

    const patItems = await page.locator('[data-test="palette-item"][data-palette-kind="pattern"]').count()
    assert(patItems === 1, `Block 3b: exactly one pattern palette item (got ${patItems})`)

    await page.locator('[data-test="palette-item"][data-palette-kind="pattern"]').first().click()
    await page.waitForTimeout(300)

    const paletteCount = await page.locator('[data-test="palette"]').count()
    assert(paletteCount === 0, 'Block 3c: palette closes after pattern click')

    const hash = await page.evaluate(() => window.location.hash)
    assert(hash === '#/library', `Block 3d: hash is #/library (got "${hash}")`)

    const lsVal = await page.evaluate(() => localStorage.getItem('verse-studio:library:lastPattern'))
    assert(lsVal === patternId, `Block 3e: localStorage lastPattern === patternId (got "${lsVal}", expected "${patternId}")`)

    await ctx.close()
  }
}

// ===========================================================================
// Block 4 — Pipelines appear in palette and jump correctly
// ===========================================================================
console.log('\nBlock 4 — Pipelines appear in palette and jump correctly')
{
  const { page, ctx } = await freshPage()

  await goto(page, '/prompts')
  await page.waitForTimeout(300)

  await page.click('[data-test="new-pipeline"]')
  await page.waitForTimeout(300)

  await page.fill('[data-test="pipeline-name"]', 'PaletteTestPipeline')
  await page.waitForTimeout(700)

  const pipelines = await readStore(page, 'promptPipelines')
  const pipeline  = pipelines.find((p) => p.name === 'PaletteTestPipeline')
  assert(!!pipeline, 'Block 4a: PaletteTestPipeline exists in IDB')

  if (!pipeline) {
    notOk('Block 4b: pipeline palette item visible (skipped — pipeline not in IDB)')
    notOk('Block 4c: clicking pipeline closes palette (skipped)')
    notOk('Block 4d: hash is #/prompts (skipped)')
    notOk('Block 4e: localStorage key set to pipelineId (skipped)')
    await ctx.close()
  } else {
    const pipelineId = pipeline.id
    await goto(page, '/writing')
    await page.waitForTimeout(300)

    await openPalette(page)
    await page.fill('[data-test="palette-input"]', 'PaletteTestPipeline')
    await page.waitForTimeout(200)

    const pipeItems = await page.locator('[data-test="palette-item"][data-palette-kind="pipeline"]').count()
    assert(pipeItems === 1, `Block 4b: exactly one pipeline palette item (got ${pipeItems})`)

    await page.locator('[data-test="palette-item"][data-palette-kind="pipeline"]').first().click()
    await page.waitForTimeout(300)

    const paletteCount = await page.locator('[data-test="palette"]').count()
    assert(paletteCount === 0, 'Block 4c: palette closes after pipeline click')

    const hash = await page.evaluate(() => window.location.hash)
    assert(hash === '#/prompts', `Block 4d: hash is #/prompts (got "${hash}")`)

    const lsVal = await page.evaluate(() => localStorage.getItem('verse-studio:prompts:lastPipeline'))
    assert(lsVal === pipelineId, `Block 4e: localStorage lastPipeline === pipelineId (got "${lsVal}", expected "${pipelineId}")`)

    await ctx.close()
  }
}

// ===========================================================================
// Block 5 — Soft-deleted patterns and pipelines absent from palette
// ===========================================================================
console.log('\nBlock 5 — Soft-deleted patterns and pipelines absent from palette')

// ---- 5a: pattern -----------------------------------------------------------
{
  const { page, ctx } = await freshPage()

  await goto(page, '/library')
  await page.waitForTimeout(300)

  await page.click('[data-test="new-pattern"]')
  await page.waitForTimeout(300)
  await page.fill('[data-test="pattern-name"]', 'PaletteHiddenPattern')
  await page.waitForTimeout(700)

  await twoClickByTestId(page, 'pattern-delete')
  await page.waitForTimeout(400)

  await openPalette(page)
  await page.fill('[data-test="palette-input"]', 'PaletteHiddenPattern')
  await page.waitForTimeout(200)

  const count = await page.locator('[data-test="palette-item"]').count()
  assert(count === 0, `Block 5a: soft-deleted pattern absent from palette (got ${count} items)`)

  await closePalette(page)
  await ctx.close()
}

// ---- 5b: pipeline ----------------------------------------------------------
{
  const { page, ctx } = await freshPage()

  await goto(page, '/prompts')
  await page.waitForTimeout(300)

  await page.click('[data-test="new-pipeline"]')
  await page.waitForTimeout(300)
  await page.fill('[data-test="pipeline-name"]', 'PaletteHiddenPipeline')
  await page.waitForTimeout(700)

  await twoClickByTestId(page, 'pipeline-delete')
  await page.waitForTimeout(400)

  await openPalette(page)
  await page.fill('[data-test="palette-input"]', 'PaletteHiddenPipeline')
  await page.waitForTimeout(200)

  const count = await page.locator('[data-test="palette-item"]').count()
  assert(count === 0, `Block 5b: soft-deleted pipeline absent from palette (got ${count} items)`)

  await closePalette(page)
  await ctx.close()
}

// ===========================================================================
// Block 6 — Routes first, tag at position 12 (empty query). Sweep 23
// raised the route count from 10 to 12 (added /inbox + /atlas).
// Updated in place from === 10 with this comment so the cumulative
// verify still passes after Sweep 23.
console.log('\nBlock 6 — Routes first, tag at position 12 (empty query)')
{
  const { page, ctx } = await freshPage()

  await goto(page, '/writing')
  await openPalette(page)
  // No query — show all
  await page.waitForTimeout(150)

  const items = await page.locator('[data-test="palette-item"]').all()
  const kinds = []
  for (const item of items) {
    kinds.push(await item.getAttribute('data-palette-kind'))
  }

  let routesFirst = true
  for (let i = 0; i < 12 && i < kinds.length; i++) {
    if (kinds[i] !== 'route') { routesFirst = false; break }
  }
  assert(routesFirst && kinds.length >= 12, `Block 6a: first 12 items are routes (count=${kinds.length})`)
  assert(kinds[12] === 'tag', `Block 6b: position 12 is a tag (got "${kinds[12]}")`)

  await closePalette(page)
  await ctx.close()
}

// ===========================================================================
// Block 7 — Existing route navigation preserved (regression spot-check)
// ===========================================================================
console.log('\nBlock 7 — Existing route navigation preserved')
{
  const { page, ctx } = await freshPage()

  await goto(page, '/shelf')
  await openPalette(page)
  await page.fill('[data-test="palette-input"]', 'Canvas')
  await page.waitForTimeout(200)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)

  const hash1 = await page.evaluate(() => window.location.hash)
  assert(hash1 === '#/canvas', `Block 7a: Canvas route navigates to #/canvas (got "${hash1}")`)

  await goto(page, '/shelf')
  await openPalette(page)
  await page.fill('[data-test="palette-input"]', 'Feature Library')
  await page.waitForTimeout(200)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)

  const hash2 = await page.evaluate(() => window.location.hash)
  assert(hash2 === '#/library', `Block 7b: Feature Library route navigates to #/library (got "${hash2}")`)

  await ctx.close()
}

// ===========================================================================
// Block 8 — New tag appears in palette dynamically
// ===========================================================================
console.log('\nBlock 8 — New tag appears in palette dynamically')
{
  const { page, ctx } = await freshPage()

  await goto(page, '/writing')
  await page.waitForTimeout(300)

  // Click the seed doc to open it in the editor (selector source-verified: data-test="doc-item")
  const docItem = page.locator('[data-test="doc-item"]').first()
  if (await docItem.count() > 0) {
    await docItem.click()
    await page.waitForTimeout(400)
  }

  // Find TagsBar input and create a new tag
  const tagInput = page.locator('[data-test="tags-bar-input"]').first()
  if (await tagInput.count() > 0) {
    await tagInput.click()
    await tagInput.fill('palette-test-tag-xyz')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)

    await openPalette(page)
    await page.fill('[data-test="palette-input"]', 'palette-test-tag-xyz')
    await page.waitForTimeout(200)

    const tagItems = await page.locator('[data-test="palette-item"][data-palette-kind="tag"]').count()
    assert(tagItems >= 1, `Block 8: new tag "palette-test-tag-xyz" visible in palette (got ${tagItems})`)
    await closePalette(page)
  } else {
    notOk('Block 8: could not locate tags-bar-input to create dynamic tag')
  }

  await ctx.close()
}

// ---------------------------------------------------------------------------
await browser.close()
console.log(`\nverify-sweep21: ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
