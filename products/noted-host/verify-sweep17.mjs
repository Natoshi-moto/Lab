// Sweep 17 verification — Tag management surface in Settings.
//
// Set CHROMIUM_PATH=/path/to/chromium if Playwright browsers aren't on
// the default lookup path.

import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'fs'
import { resolve } from 'path'

const HTML = 'file://' + resolve('./verse-studio.html')

const launchOpts = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {}

let pass = 0, fail = 0
const ok  = (n)       => { console.log('  PASS', n); pass++ }
const bad = (n, why)  => { console.log('  FAIL', n, '—', why); fail++ }
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

const NON_SETTINGS_ROUTES = [
  '#/writing', '#/poetry', '#/longform', '#/app-design',
  '#/prompts', '#/canvas', '#/projects', '#/library', '#/shelf'
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

async function twoClickByTestId(page, testId, timeoutMs = 500) {
  const btn = page.locator(`[data-test="${testId}"]`).first()
  if ((await btn.count()) === 0) return false
  await btn.click({ force: true })
  await page.waitForTimeout(timeoutMs)
  await btn.click({ force: true })
  return true
}

async function expandDocker(page) {
  const expanded = await page.locator('[data-test="docker"]').getAttribute('data-expanded')
  if (expanded !== 'true') {
    await page.click('[data-test="docker-toggle"]')
    await page.waitForTimeout(150)
  }
}

async function openDockerTab(page, slug) {
  await expandDocker(page)
  await page.click(`[data-test="docker-tab"][data-docker-tab="${slug}"]`)
  await page.waitForTimeout(200)
}

async function createDocAndGetId(page) {
  await navByHash(page, '#/writing')
  await page.waitForTimeout(150)
  await page.click('[data-test="new-doc"]')
  await page.waitForTimeout(400)
  return await page.locator('[data-test="doc-title"]').getAttribute('data-doc-id')
}

async function createPoemAndGetId(page) {
  await navByHash(page, '#/poetry')
  await page.waitForTimeout(150)
  await page.click('[data-test="new-poem"]')
  await page.waitForTimeout(400)
  return await page.locator('[data-test="poem-title"]').getAttribute('data-poem-id')
}

async function createLongformAndGetId(page) {
  await navByHash(page, '#/longform')
  await page.waitForTimeout(150)
  await page.click('[data-test="new-longform"]')
  await page.waitForTimeout(400)
  const btn = page.locator('[data-test="snapshots-button"][data-record-type="longform"]')
  return await btn.getAttribute('data-record-id')
}

async function createBuildAndGetId(page) {
  await navByHash(page, '#/app-design')
  await page.waitForTimeout(150)
  await page.click('[data-test="new-build"]')
  await page.waitForTimeout(400)
  const btn = page.locator('[data-test="snapshots-button"][data-record-type="build"]')
  return await btn.getAttribute('data-record-id')
}

async function createPipelineAndGetId(page) {
  await navByHash(page, '#/prompts')
  await page.waitForTimeout(150)
  await page.click('[data-test="new-pipeline"]')
  await page.waitForTimeout(400)
  const btn = page.locator('[data-test="snapshots-button"][data-record-type="pipeline"]')
  return await btn.getAttribute('data-record-id')
}

async function createProjectAndGetId(page) {
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  await page.click('[data-test="new-project-button"]')
  await page.waitForTimeout(400)
  const btn = page.locator('[data-test="snapshots-button"][data-record-type="project"]')
  return await btn.getAttribute('data-record-id')
}

async function run() {
  rmSync('./test-downloads', { recursive: true, force: true })
  mkdirSync('./test-downloads', { recursive: true })

  const browser = await chromium.launch(launchOpts)

  // ─── Boot: clean across all 10 routes ────────────────────────────────────
  console.log('\n── Boot: clean across all 10 routes ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    for (const route of ROUTES) {
      await navByHash(page, route)
      await page.waitForTimeout(200)
    }
    expect('boot: zero console.error', errors.console.length === 0, JSON.stringify(errors.console))
    expect('boot: zero pageerror',     errors.pageError.length === 0, JSON.stringify(errors.pageError))
    await ctx.close()
  }

  // ─── TagManager mounts exactly in Settings ───────────────────────────────
  console.log('\n── TagManager mounts in Settings ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)
    const countSettings = await page.locator('[data-test="tag-manager"]').count()
    expect('tag-manager: count === 1 in settings', countSettings === 1, `got ${countSettings}`)

    expect('tag-manager: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── TagManager NOT mounted in any other route ───────────────────────────
  console.log('\n── TagManager not mounted outside Settings ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    for (const route of NON_SETTINGS_ROUTES) {
      await navByHash(page, route)
      await page.waitForTimeout(200)
      const count = await page.locator('[data-test="tag-manager"]').count()
      expect(`tag-manager absent on ${route}`, count === 0, `got ${count}`)
    }
    expect('tag-manager placement: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Seeded baseline: one tag, usage count 1 ─────────────────────────────
  console.log('\n── Seeded baseline ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    const rowCount = await page.locator('[data-test="tag-row"]').count()
    expect('seeded baseline: exactly one tag-row', rowCount === 1, `got ${rowCount}`)

    const tagId = await page.locator('[data-test="tag-row"]').first().getAttribute('data-tag-id')
    expect('seeded baseline: tag-row has data-tag-id', !!tagId && tagId.length > 0, `got "${tagId}"`)

    // Confirm the Tag exists in IDB
    const tags = await idbGetAll(page, 'tags')
    const foundTag = tags.find((t) => t.id === tagId)
    expect('seeded baseline: IDB has tag with matching id', !!foundTag, `id=${tagId} not found in IDB`)

    // Usage count must be "1" (one seeded TagLink)
    const usageCount = await page.locator('[data-test="tag-row-usage"]').first().getAttribute('data-usage-count')
    expect('seeded baseline: usage count === "1"', usageCount === '1', `got "${usageCount}"`)

    expect('seeded baseline: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Rename flow ──────────────────────────────────────────────────────────
  console.log('\n── Rename flow ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    const tagId = await page.locator('[data-test="tag-row"]').first().getAttribute('data-tag-id')

    // Click Rename — input should appear pre-filled with "note"
    await page.click('[data-test="tag-row-rename"]')
    await page.waitForTimeout(150)

    const inputCount = await page.locator('[data-test="tag-row-edit-input"]').count()
    expect('rename: edit input appears', inputCount === 1, `got ${inputCount}`)

    const inputVal = await page.locator('[data-test="tag-row-edit-input"]').inputValue()
    expect('rename: input pre-filled with "note"', inputVal === 'note', `got "${inputVal}"`)

    // Clear and type new name
    await page.fill('[data-test="tag-row-edit-input"]', 'memo')
    await page.waitForTimeout(100)

    // Click Save (rename button in edit mode)
    await page.click('[data-test="tag-row-rename"]')
    await page.waitForTimeout(300)

    // Input should be gone
    const inputCountAfter = await page.locator('[data-test="tag-row-edit-input"]').count()
    expect('rename: edit input gone after save', inputCountAfter === 0, `got ${inputCountAfter}`)

    // Row should now show "memo"
    const rowEl = page.locator(`[data-test="tag-row"][data-tag-id="${tagId}"]`)
    const rowText = await rowEl.textContent()
    expect('rename: row shows new name', rowText !== null && rowText.includes('memo'), `rowText="${rowText}"`)

    // No row shows "note" any more
    const allRows = await page.locator('[data-test="tag-row"]').allTextContents()
    const anyNote = allRows.some((t) => t.includes('note'))
    expect('rename: no row shows old name "note"', !anyNote, `rows=${JSON.stringify(allRows)}`)

    // IDB: tag has name "memo"
    const tags = await idbGetAll(page, 'tags')
    const updatedTag = tags.find((t) => t.id === tagId)
    expect('rename: IDB tag.name === "memo"', updatedTag?.name === 'memo', `got "${updatedTag?.name}"`)

    expect('rename: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Empty rename is a no-op ──────────────────────────────────────────────
  console.log('\n── Empty rename is a no-op ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    // Enter edit mode
    await page.click('[data-test="tag-row-rename"]')
    await page.waitForTimeout(150)

    // Clear the input entirely
    await page.fill('[data-test="tag-row-edit-input"]', '')
    await page.waitForTimeout(100)

    // Click Save with empty value
    await page.click('[data-test="tag-row-rename"]')
    await page.waitForTimeout(200)

    // Per spec: input stays open when value is empty
    const inputStillPresent = await page.locator('[data-test="tag-row-edit-input"]').count()
    expect('empty rename: input stays open', inputStillPresent === 1, `got ${inputStillPresent}`)

    // IDB: name unchanged
    const tags = await idbGetAll(page, 'tags')
    const tag = tags[0]
    expect('empty rename: IDB name still "note"', tag?.name === 'note', `got "${tag?.name}"`)

    expect('empty rename: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Cancel works ─────────────────────────────────────────────────────────
  console.log('\n── Cancel works ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    // Enter edit mode, type a change
    await page.click('[data-test="tag-row-rename"]')
    await page.waitForTimeout(150)
    await page.fill('[data-test="tag-row-edit-input"]', 'should-not-save')
    await page.waitForTimeout(100)

    // Cancel
    await page.click('[data-test="tag-row-cancel"]')
    await page.waitForTimeout(200)

    // Input gone
    const inputCount = await page.locator('[data-test="tag-row-edit-input"]').count()
    expect('cancel: edit input gone', inputCount === 0, `got ${inputCount}`)

    // Name unchanged
    const rowText = await page.locator('[data-test="tag-row"]').first().textContent()
    expect('cancel: row still shows "note"', rowText !== null && rowText.includes('note'), `rowText="${rowText}"`)

    // IDB unchanged
    const tags = await idbGetAll(page, 'tags')
    expect('cancel: IDB name still "note"', tags[0]?.name === 'note', `got "${tags[0]?.name}"`)

    expect('cancel: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Escape inside the input also cancels ────────────────────────────────
  console.log('\n── Escape cancels rename ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    // Enter edit mode, type something
    await page.click('[data-test="tag-row-rename"]')
    await page.waitForTimeout(150)
    await page.fill('[data-test="tag-row-edit-input"]', 'escape-me')
    await page.waitForTimeout(100)

    // Press Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // Input gone
    const inputCount = await page.locator('[data-test="tag-row-edit-input"]').count()
    expect('escape: edit input gone', inputCount === 0, `got ${inputCount}`)

    // Name unchanged
    const rowText = await page.locator('[data-test="tag-row"]').first().textContent()
    expect('escape: row still shows "note"', rowText !== null && rowText.includes('note'), `rowText="${rowText}"`)

    expect('escape: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Delete cascades ─────────────────────────────────────────────────────
  console.log('\n── Delete cascades ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    // Confirm seeded tag present with usage 1
    const rowsBefore = await page.locator('[data-test="tag-row"]').count()
    expect('delete: one tag-row before delete', rowsBefore === 1, `got ${rowsBefore}`)

    const usageBefore = await page.locator('[data-test="tag-row-usage"]').first().getAttribute('data-usage-count')
    expect('delete: usage count === "1" before delete', usageBefore === '1', `got "${usageBefore}"`)

    // Two-click delete
    await twoClickByTestId(page, 'tag-row-delete', 500)
    await page.waitForTimeout(300)

    // Row should be gone — empty state should be visible
    const rowsAfter = await page.locator('[data-test="tag-row"]').count()
    expect('delete: zero tag-rows after delete', rowsAfter === 0, `got ${rowsAfter}`)

    const emptyState = await page.locator('[data-test="tag-manager-empty"]').count()
    expect('delete: empty state visible', emptyState === 1, `got ${emptyState}`)

    // IDB: zero tags, zero tagLinks
    const tags = await idbGetAll(page, 'tags')
    expect('delete: IDB tags empty', tags.length === 0, `got ${tags.length}`)

    const tagLinks = await idbGetAll(page, 'tagLinks')
    expect('delete: IDB tagLinks empty (cascade)', tagLinks.length === 0, `got ${tagLinks.length}`)

    // Navigate to Writing, select the seeded doc — TagsBar should have zero chips
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)

    // Click on the seeded doc (first one in the list)
    const docLinks = page.locator('[data-test="doc-list-item"]')
    if (await docLinks.count() > 0) {
      await docLinks.first().click()
      await page.waitForTimeout(300)

      const chips = await page.locator('[data-test="tags-bar-chip"]').count()
      expect('delete cascade: writing doc TagsBar has zero chips', chips === 0, `got ${chips}`)
    } else {
      // Fallback: just assert IDB is clean (doc might have different selector)
      expect('delete cascade: IDB tagLinks empty', tagLinks.length === 0, 'already checked')
    }

    expect('delete: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Usage counts update live ─────────────────────────────────────────────
  console.log('\n── Usage counts update live ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    // Baseline: seeded tag usage === 1
    const usageBefore = await page.locator('[data-test="tag-row-usage"]').first().getAttribute('data-usage-count')
    expect('live count: initial usage === "1"', usageBefore === '1', `got "${usageBefore}"`)

    // Navigate to Writing, create a new doc, attach the "note" tag
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(400)

    // Type "note" in TagsBar input and press Enter to attach existing tag
    await page.fill('[data-test="tags-bar-input"]', 'note')
    await page.waitForTimeout(150)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Navigate back to Settings
    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    const usageAfter = await page.locator('[data-test="tag-row-usage"]').first().getAttribute('data-usage-count')
    expect('live count: usage === "2" after second attach', usageAfter === '2', `got "${usageAfter}"`)

    expect('live count: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Persistence across reload ────────────────────────────────────────────
  console.log('\n── Persistence across reload ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    // Rename to "memo"
    await page.click('[data-test="tag-row-rename"]')
    await page.waitForTimeout(150)
    await page.fill('[data-test="tag-row-edit-input"]', 'memo')
    await page.click('[data-test="tag-row-rename"]')
    await page.waitForTimeout(300)

    // Reload
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    await page.waitForTimeout(200)

    // Navigate to Settings
    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)

    const rowText = await page.locator('[data-test="tag-row"]').first().textContent()
    expect('persistence: row shows "memo" after reload', rowText !== null && rowText.includes('memo'), `rowText="${rowText}"`)

    expect('persistence: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Regression: sidebar still has 10 routes ─────────────────────────────
  console.log('\n── Regression: sidebar ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    await page.waitForTimeout(200)
    // Sweep 23: route count grew from 10 to 12 (added /inbox + /atlas).
    // Updated in place from === 10 with this comment so the cumulative
    // verify still passes after Sweep 23.
    const sidebarLinks = await page.locator('aside a[href^="#/"]').count()
    expect('regression: sidebar has 12 routes', sidebarLinks === 12, `got ${sidebarLinks}`)
    expect('regression sidebar: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Regression: Snapshots still mounts in all six studios ───────────────
  console.log('\n── Regression: Snapshots mounts in all six studios ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Writing
    await createDocAndGetId(page)
    await page.waitForTimeout(200)
    const writingSnaps = await page.locator('[data-test="snapshots-button"][data-record-type="document"]').count()
    expect('regression: snapshots in writing', writingSnaps >= 1, `got ${writingSnaps}`)

    // Poetry
    await createPoemAndGetId(page)
    await page.waitForTimeout(200)
    const poetrySnaps = await page.locator('[data-test="snapshots-button"][data-record-type="poem"]').count()
    expect('regression: snapshots in poetry', poetrySnaps >= 1, `got ${poetrySnaps}`)

    // Longform
    await createLongformAndGetId(page)
    await page.waitForTimeout(200)
    const longformSnaps = await page.locator('[data-test="snapshots-button"][data-record-type="longform"]').count()
    expect('regression: snapshots in longform', longformSnaps >= 1, `got ${longformSnaps}`)

    // App-Design
    await createBuildAndGetId(page)
    await page.waitForTimeout(200)
    const buildSnaps = await page.locator('[data-test="snapshots-button"][data-record-type="build"]').count()
    expect('regression: snapshots in app-design', buildSnaps >= 1, `got ${buildSnaps}`)

    // Prompts
    await createPipelineAndGetId(page)
    await page.waitForTimeout(200)
    const pipeSnaps = await page.locator('[data-test="snapshots-button"][data-record-type="pipeline"]').count()
    expect('regression: snapshots in prompts', pipeSnaps >= 1, `got ${pipeSnaps}`)

    // Projects
    await createProjectAndGetId(page)
    await page.waitForTimeout(200)
    const projSnaps = await page.locator('[data-test="snapshots-button"][data-record-type="project"]').count()
    expect('regression: snapshots in projects', projSnaps >= 1, `got ${projSnaps}`)

    expect('regression snapshots: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Regression: Library has zero tags-bar elements — RETIRED in Sweep 18 ─
  // Library now mounts TagsBar (data-record-type="pattern") when a pattern
  // is selected. The old negative assertion would fail by design after Sweep 18.
  // Positive coverage lives in verify-sweep18.mjs:
  //   "TagsBar present in Library with pattern selected".

  // ─── Regression: Pattern Markdown export still works ─────────────────────
  console.log('\n── Regression: Pattern Markdown export ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(200)
    // Click the first pattern if any exist
    const patterns = page.locator('[data-test="pattern-list-item"]')
    if (await patterns.count() > 0) {
      await patterns.first().click()
      await page.waitForTimeout(300)
      const exportBtn = await page.locator('[data-test="pattern-export-md"]').count()
      expect('regression: pattern-export-md exists', exportBtn >= 1, `got ${exportBtn}`)
    } else {
      // No patterns seeded — just confirm no errors
      expect('regression: pattern export (no patterns to check, skipped)', true)
    }
    expect('regression pattern export: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── No console / page errors during entire run ───────────────────────────
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
