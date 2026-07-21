// Sweep 19 verification — Tag merge action in the Settings TagManager.
//
// Set CHROMIUM_PATH=/path/to/chromium if Playwright browsers aren't on
// the default lookup path.

import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { resolve } from 'path'

const HTML = 'file://' + resolve('./verse-studio.html')

const launchOpts = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {}

let pass = 0, fail = 0
const ok     = (n)       => { console.log('  PASS', n); pass++ }
const bad    = (n, why)  => { console.log('  FAIL', n, '—', why); fail++ }
const expect = (n, cond, why) => cond ? ok(n) : bad(n, why || 'condition false')

async function fresh(browser) {
  const ctx  = await browser.newContext({ acceptDownloads: true })
  const page = await ctx.newPage()
  const errors = { console: [], pageError: [] }
  page.on('pageerror', (e) => {
    errors.pageError.push(e.message)
    console.log('  [pageerror]', e.message)
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.console.push(msg.text())
      console.log('  [console.error]', msg.text())
    }
  })
  await page.goto(HTML)
  await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
  return { ctx, page, errors }
}

const ROUTES = [
  '#/writing', '#/poetry', '#/longform', '#/app-design',
  '#/prompts', '#/canvas', '#/projects', '#/library', '#/shelf', '#/settings'
]

async function navByHash(page, hash) {
  await page.click(`aside a[href="${hash}"]`)
  await page.waitForFunction((h) => window.location.hash === h, hash)
}

function idbGetAll(page, storeName) {
  return page.evaluate((store) => new Promise((resolve, reject) => {
    const req = indexedDB.open('verse-studio', undefined)
    req.onerror   = () => reject(req.error)
    req.onsuccess = () => {
      const db  = req.result
      const tx  = db.transaction(store, 'readonly')
      const all = tx.objectStore(store).getAll()
      all.onsuccess = () => resolve(all.result)
      all.onerror   = () => reject(all.error)
    }
  }), storeName)
}

async function run() {
  mkdirSync('./test-downloads', { recursive: true })

  const browser = await chromium.launch(launchOpts)

  // ── Boot clean across all 10 routes ──────────────────────────────────────
  console.log('\n── Boot: clean across all 10 routes ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    for (const route of ROUTES) {
      await navByHash(page, route)
      await page.waitForTimeout(150)
    }
    expect('boot: zero console.error', errors.console.length === 0, JSON.stringify(errors.console))
    expect('boot: zero pageerror',     errors.pageError.length === 0, JSON.stringify(errors.pageError))
    await ctx.close()
  }

  // ── Merge button visible per row, hidden during edit ──────────────────────
  console.log('\n── Merge button visibility ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    // The seeded "note" tag should have exactly one merge button
    const mergeCount = await page.locator('[data-test="tag-row-merge"]').count()
    expect('merge button present for seeded note tag (count === 1)',
      mergeCount === 1, `count: ${mergeCount}`)

    // Click Rename — merge button should disappear during edit
    await page.click('[data-test="tag-row-rename"]')
    await page.waitForTimeout(150)
    expect('edit-input visible after clicking Rename',
      await page.locator('[data-test="tag-row-edit-input"]').count() === 1)
    expect('merge button hidden during edit (count === 0)',
      await page.locator('[data-test="tag-row-merge"]').count() === 0)

    // Cancel edit — merge button should reappear
    await page.click('[data-test="tag-row-cancel"]')
    await page.waitForTimeout(150)
    expect('merge button reappears after Cancel',
      await page.locator('[data-test="tag-row-merge"]').count() === 1)

    expect('merge visibility: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Merge with no other tags shows empty state ────────────────────────────
  console.log('\n── Merge empty state (only one tag) ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    // Only one tag in a fresh session (seeded "note")
    await page.click('[data-test="tag-row-merge"]')
    await page.waitForTimeout(150)

    expect('merge popover opens (count === 1)',
      await page.locator('[data-test="tag-row-merge-popover"]').count() === 1)
    expect('merge-empty shown when no other tags',
      await page.locator('[data-test="tag-row-merge-empty"]').count() === 1)

    // Escape closes popover
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    expect('popover closes on Escape',
      await page.locator('[data-test="tag-row-merge-popover"]').count() === 0)

    expect('merge empty state: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Merge two tags — TagLinks redirected, source tag deleted ──────────────
  console.log('\n── Core merge: TagLinks redirected, source deleted ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Create doc in Writing and tag it "zeta"
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(400)
    await page.fill('[data-test="tags-bar-input"]', 'zeta-tag')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Create poem in Poetry and tag it "alpha-tag"
    await navByHash(page, '#/poetry')
    await page.waitForTimeout(200)
    await page.click('[data-test="new-poem"]')
    await page.waitForTimeout(400)
    await page.fill('[data-test="tags-bar-input"]', 'alpha-tag')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Navigate to Settings — confirm 3 tag rows (note, zeta-tag, alpha-tag)
    await navByHash(page, '#/settings')
    await page.waitForTimeout(300)

    const tagRows = page.locator('[data-test="tag-row"]')
    const rowCount = await tagRows.count()
    expect('settings shows 3 tag rows (note + zeta-tag + alpha-tag)',
      rowCount === 3, `got ${rowCount}`)

    // Read the tag IDs from data attributes
    let zetaTagId  = null
    let alphaTagId = null
    for (let i = 0; i < rowCount; i++) {
      const row  = tagRows.nth(i)
      const text = await row.textContent()
      const id   = await row.getAttribute('data-tag-id')
      if (text && text.includes('zeta-tag')) zetaTagId  = id
      if (text && text.includes('alpha-tag')) alphaTagId = id
    }

    // Find alpha-tag row and click its Merge button
    const alphaRow2 = page.locator(`[data-test="tag-row"][data-tag-id="${alphaTagId}"]`)
    await alphaRow2.locator('[data-test="tag-row-merge"]').click()
    await page.waitForTimeout(200)

    // Popover should list "zeta-tag" as a target
    const targetBtn = page.locator(`[data-test="tag-row-merge-target"][data-target-tag-name="zeta-tag"]`)
    expect('merge popover shows "zeta-tag" as target',
      await targetBtn.count() === 1, `count: ${await targetBtn.count()}`)

    await targetBtn.click()
    await page.waitForTimeout(600)

    // "alpha-tag" row should be gone
    const alphaRowAfter = page.locator(`[data-test="tag-row"][data-tag-id="${alphaTagId}"]`)
    expect('"alpha-tag" row is gone after merge',
      await alphaRowAfter.count() === 0)

    // "zeta-tag" row usage count should be 2
    const zetaRow    = page.locator(`[data-test="tag-row"][data-tag-id="${zetaTagId}"]`)
    const usageBadge = zetaRow.locator('[data-test="tag-row-usage"]')
    const usageCount = await usageBadge.getAttribute('data-usage-count')
    expect('"zeta-tag" usage count is 2 after merge',
      usageCount === '2', `got: ${usageCount}`)

    // IDB assertions
    const allTags  = await idbGetAll(page, 'tags')
    const allLinks = await idbGetAll(page, 'tagLinks')

    const alphaTagInIDB = allTags.find((t) => t.name === 'alpha-tag')
    expect('IDB: zero Tag rows with name "alpha-tag"',
      !alphaTagInIDB, `still found: ${JSON.stringify(alphaTagInIDB)}`)

    const orphanLinks = allLinks.filter((tl) => tl.tagId === alphaTagId)
    expect('IDB: zero TagLinks pointing at deleted alpha-tag id',
      orphanLinks.length === 0, `orphan count: ${orphanLinks.length}`)

    const zetaLinks = allLinks.filter((tl) => tl.tagId === zetaTagId)
    expect('IDB: exactly two TagLinks pointing at "zeta-tag" tag id',
      zetaLinks.length === 2, `count: ${zetaLinks.length}`)

    const hasDocLink  = zetaLinks.some((tl) => tl.targetType === 'document')
    const hasPoemLink = zetaLinks.some((tl) => tl.targetType === 'poem')
    expect('IDB: one zeta-tag TagLink is targetType "document"', hasDocLink)
    expect('IDB: one zeta-tag TagLink is targetType "poem"', hasPoemLink)

    expect('core merge: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Idempotent merge — both tags on same record ───────────────────────────
  console.log('\n── Idempotent merge (both tags already on same record) ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Create one doc, attach both "alpha" and "beta"
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(400)

    await page.fill('[data-test="tags-bar-input"]', 'alpha')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    await page.fill('[data-test="tags-bar-input"]', 'beta')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Navigate to Settings
    await navByHash(page, '#/settings')
    await page.waitForTimeout(300)

    const tagRows = page.locator('[data-test="tag-row"]')
    let alphaTagId = null
    let betaTagId  = null
    const rowCount = await tagRows.count()
    for (let i = 0; i < rowCount; i++) {
      const row  = tagRows.nth(i)
      const text = await row.textContent()
      const id   = await row.getAttribute('data-tag-id')
      if (text && text.includes('alpha')) alphaTagId = id
      if (text && text.includes('beta'))  betaTagId  = id
    }

    // Merge "alpha" into "beta"
    const alphaRow = page.locator(`[data-test="tag-row"][data-tag-id="${alphaTagId}"]`)
    await alphaRow.locator('[data-test="tag-row-merge"]').click()
    await page.waitForTimeout(200)

    const betaTarget = page.locator(`[data-test="tag-row-merge-target"][data-target-tag-name="beta"]`)
    await betaTarget.click()
    await page.waitForTimeout(600)

    // "alpha" row gone
    expect('"alpha" row is gone after idempotent merge',
      await page.locator(`[data-test="tag-row"][data-tag-id="${alphaTagId}"]`).count() === 0)

    // "beta" usage count is 1 (not 2 — idempotent)
    const betaRow   = page.locator(`[data-test="tag-row"][data-tag-id="${betaTagId}"]`)
    const betaBadge = betaRow.locator('[data-test="tag-row-usage"]')
    const betaCount = await betaBadge.getAttribute('data-usage-count')
    expect('"beta" usage count is 1 (idempotent — no duplicate TagLink)',
      betaCount === '1', `got: ${betaCount}`)

    // IDB: exactly ONE TagLink for beta
    const allLinks  = await idbGetAll(page, 'tagLinks')
    const betaLinks = allLinks.filter((tl) => tl.tagId === betaTagId)
    expect('IDB: exactly one TagLink for "beta" tag id',
      betaLinks.length === 1, `count: ${betaLinks.length}`)

    expect('idempotent merge: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Outside-click closes popover without merging ──────────────────────────
  console.log('\n── Outside-click closes popover without merging ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Need two tags to get a non-empty popover
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(400)
    await page.fill('[data-test="tags-bar-input"]', 'outside-click-tag')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(300)

    const tagRows = page.locator('[data-test="tag-row"]')
    // Open merge popover on first row
    await tagRows.first().locator('[data-test="tag-row-merge"]').click()
    await page.waitForTimeout(200)
    expect('popover opens',
      await page.locator('[data-test="tag-row-merge-popover"]').count() === 1)

    // Click somewhere outside — the Settings "Theme" heading area
    await page.click('text=Theme')
    await page.waitForTimeout(200)
    expect('popover closes after outside-click',
      await page.locator('[data-test="tag-row-merge-popover"]').count() === 0)

    // Both tags still exist
    const remainingRows = await page.locator('[data-test="tag-row"]').count()
    expect('both tags still exist after outside-click dismiss',
      remainingRows === 2, `got: ${remainingRows}`)

    expect('outside-click: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Persistence across reload ─────────────────────────────────────────────
  console.log('\n── Persistence across reload ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Create two tags and merge them
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(400)
    await page.fill('[data-test="tags-bar-input"]', 'persist-src')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    await page.fill('[data-test="tags-bar-input"]', 'persist-dst')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(300)

    // Read tag IDs
    const tagRows  = page.locator('[data-test="tag-row"]')
    const rowCount = await tagRows.count()
    let srcId = null, dstId = null
    for (let i = 0; i < rowCount; i++) {
      const row  = tagRows.nth(i)
      const text = await row.textContent()
      const id   = await row.getAttribute('data-tag-id')
      if (text && text.includes('persist-src')) srcId = id
      if (text && text.includes('persist-dst')) dstId = id
    }

    // Merge persist-src into persist-dst
    const srcRow = page.locator(`[data-test="tag-row"][data-tag-id="${srcId}"]`)
    await srcRow.locator('[data-test="tag-row-merge"]').click()
    await page.waitForTimeout(200)
    await page.locator(`[data-test="tag-row-merge-target"][data-target-tag-name="persist-dst"]`).click()
    await page.waitForTimeout(600)

    // Reload page
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    await navByHash(page, '#/settings')
    await page.waitForTimeout(300)

    // persist-src should be gone
    const srcAfterReload = page.locator(`[data-test="tag-row"][data-tag-id="${srcId}"]`)
    expect('persist-src tag gone after reload',
      await srcAfterReload.count() === 0)

    // persist-dst should have usage count 1
    const dstAfterReload = page.locator(`[data-test="tag-row"][data-tag-id="${dstId}"]`)
    const dstBadge = dstAfterReload.locator('[data-test="tag-row-usage"]')
    const dstCount = await dstBadge.getAttribute('data-usage-count')
    expect('persist-dst usage count is 1 after reload',
      dstCount === '1', `got: ${dstCount}`)

    expect('persistence: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Regression: sidebar still has 12 routes ───────────────────────────────
  // Sweep 23: route count grew from 10 to 12 (added /inbox + /atlas).
  // Updated in place from === 10 with this comment so the cumulative
  // verify still passes after Sweep 23.
  console.log('\n── Regression: sidebar 12 routes ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    const sidebarLinks = await page.locator('aside a[href^="#/"]').count()
    expect('regression: sidebar has 12 routes', sidebarLinks === 12, `got ${sidebarLinks}`)
    expect('regression sidebar: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Regression: TagManager mounts only in Settings ────────────────────────
  console.log('\n── Regression: TagManager only in Settings ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(150)
    expect('regression: tag-manager present in settings',
      await page.locator('[data-test="tag-manager"]').count() === 1)

    for (const route of ROUTES.filter((r) => r !== '#/settings')) {
      await navByHash(page, route)
      await page.waitForTimeout(150)
      expect(`regression: tag-manager absent in ${route}`,
        await page.locator('[data-test="tag-manager"]').count() === 0)
    }

    expect('regression tag-manager: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Regression: TagsBar still mounts in Library on Pattern selected ───────
  console.log('\n── Regression: TagsBar in Library with pattern selected ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(200)
    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    expect('regression: tags-bar with data-record-type="pattern" present',
      await page.locator('[data-test="tags-bar"][data-record-type="pattern"]').count() === 1)

    expect('regression library tagsbar: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── No console / page errors during the entire run ───────────────────────
  console.log('\n── Final clean-run error check ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    for (const route of ROUTES) {
      await navByHash(page, route)
      await page.waitForTimeout(150)
    }
    expect('final: zero console.error', errors.console.length === 0, JSON.stringify(errors.console))
    expect('final: zero pageerror',     errors.pageError.length === 0, JSON.stringify(errors.pageError))
    await ctx.close()
  }

  await browser.close()

  console.log(`\n── Results: ${pass} passed, ${fail} failed ──\n`)
  if (fail > 0) process.exit(1)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
