// Sweep 10 verification — Docker tab bodies.
//
// Set CHROMIUM_PATH=/path/to/chromium if Playwright browsers aren't on
// the default lookup path.

import { chromium } from 'playwright'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const HTML = 'file://' + resolve('./verse-studio.html')

const launchOpts = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {}

let pass = 0, fail = 0
const ok  = (n) => { console.log('  PASS', n); pass++ }
const bad = (n, why) => { console.log('  FAIL', n, '—', why); fail++ }
const expect = (n, cond, why) => cond ? ok(n) : bad(n, why || 'condition false')

async function fresh(browser) {
  const ctx = await browser.newContext({ acceptDownloads: true })
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
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction(store, 'readonly')
      const all = tx.objectStore(store).getAll()
      all.onsuccess = () => resolve(all.result)
      all.onerror = () => reject(all.error)
    }
  }), storeName)
}

async function idbPut(page, storeName, record) {
  return page.evaluate(({ store, rec }) => new Promise((resolve, reject) => {
    const req = indexedDB.open('verse-studio', undefined)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction(store, 'readwrite')
      const put = tx.objectStore(store).put(rec)
      put.onsuccess = () => resolve(put.result)
      put.onerror = () => reject(put.error)
    }
  }), { store: storeName, rec: record })
}

async function twoClickConfirm(page, initialText, timeoutMs = 500) {
  const btns = await page.locator('button').all()
  let found = false
  for (const btn of btns) {
    const txt = await btn.textContent().catch(() => '')
    if (txt?.trim() === initialText) {
      await btn.click({ force: true })
      found = true
      break
    }
  }
  if (!found) return false
  await page.waitForTimeout(timeoutMs)
  const btns2 = await page.locator('button').all()
  for (const btn of btns2) {
    const txt = await btn.textContent().catch(() => '')
    if (txt?.toLowerCase().includes('confirm')) { await btn.click({ force: true }); return true }
  }
  return false
}

// Like twoClickConfirm but scoped to a specific data-test selector.
// More reliable than label-based search when ambient delete buttons exist
// elsewhere on the page (e.g. WritingStudio's hover-revealed "del" buttons
// that are still in the DOM with opacity-0).
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

async function run() {
  rmSync('./test-downloads', { recursive: true, force: true })
  mkdirSync('./test-downloads', { recursive: true })

  const browser = await chromium.launch(launchOpts)

  // ── Boot clean across all routes ─────────────────────────────────────────
  console.log('\nBoot — no console errors across every route')
  {
    const { ctx, page, errors } = await fresh(browser)
    expect('app reaches ready state', await page.locator('aside nav').isVisible())
    for (const hash of ROUTES) {
      await navByHash(page, hash)
      await page.waitForTimeout(200)
    }
    expect('zero console.error', errors.console.length === 0, errors.console.join('; '))
    expect('zero pageerror',     errors.pageError.length === 0, errors.pageError.join('; '))
    await ctx.close()
  }

  // ── Docker bodies render the right component (not the placeholder) ────────
  console.log('\nDocker bodies — no placeholder text')
  {
    const slugs = ['scratchpad', 'clipboard', 'recently-deleted', 'recent-items', 'files', 'quick-add']
    const distinguishingSelectors = {
      'scratchpad':       '[data-test="scratch-list"], [data-test="scratch-empty"]',
      'clipboard':        '[data-test="clipboard-input"]',
      'recently-deleted': '[data-test="recently-deleted-list"], [data-test="recently-deleted-empty"]',
      'recent-items':     '[data-test="recent-items-list"], [data-test="recent-items-empty"]',
      'files':            '[data-test="files-export"]',
      'quick-add':        '[data-test="quick-add-kind"]',
    }

    const { ctx, page } = await fresh(browser)
    await expandDocker(page)

    for (const slug of slugs) {
      await page.click(`[data-test="docker-tab"][data-docker-tab="${slug}"]`)
      await page.waitForTimeout(200)

      const panelText = await page.locator('[data-test="docker-panel"]').innerText().catch(() => '')
      expect(
        `${slug}: panel does not contain "ships in Sweep"`,
        !panelText.includes('ships in Sweep'),
        `panel text: "${panelText.slice(0, 80)}"`
      )

      // Check distinguishing selector
      const sel = distinguishingSelectors[slug]
      const visible = await page.locator(sel).first().isVisible().catch(() => false)
      expect(`${slug}: distinguishing selector visible`, visible, `selector: ${sel}`)
    }

    await ctx.close()
  }

  // ── Scratchpad smoke ──────────────────────────────────────────────────────
  console.log('\nScratchpad smoke')
  {
    const { ctx, page } = await fresh(browser)
    await openDockerTab(page, 'scratchpad')

    // Empty state visible on clean boot
    expect('scratchpad: empty state visible',
      await page.locator('[data-test="scratch-empty"]').isVisible())

    // Click + New
    await page.click('[data-test="scratch-new"]')
    await page.waitForTimeout(300)

    expect('scratchpad: empty state gone after new',
      !await page.locator('[data-test="scratch-empty"]').isVisible())
    expect('scratchpad: scratch-list visible',
      await page.locator('[data-test="scratch-list"]').isVisible())
    expect('scratchpad: title input visible',
      await page.locator('[data-test="scratch-title"]').isVisible())

    // Type title and body
    await page.locator('[data-test="scratch-title"]').fill('Persist test title')
    await page.waitForTimeout(100)
    await page.locator('[data-test="scratch-body"]').fill('Persist test body')
    await page.waitForTimeout(600) // allow autosave

    // Navigate away and back, values should persist
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)
    await navByHash(page, '#/poetry')
    await page.waitForTimeout(200)
    await openDockerTab(page, 'scratchpad')

    const titleVal = await page.locator('[data-test="scratch-title"]').inputValue().catch(() => '')
    const bodyVal  = await page.locator('[data-test="scratch-body"]').inputValue().catch(() => '')
    expect('scratchpad: title persisted', titleVal === 'Persist test title', `got: "${titleVal}"`)
    expect('scratchpad: body persisted',  bodyVal  === 'Persist test body',  `got: "${bodyVal}"`)

    // Create a second scratch, reorder
    await page.click('[data-test="scratch-new"]')
    await page.waitForTimeout(300)

    const rows = await page.locator('[data-test="scratch-item"]').all()
    expect('scratchpad: two rows after second new', rows.length === 2, `count: ${rows.length}`)

    // Get first row id
    const firstId = await page.locator('[data-test="scratch-item"]').first().getAttribute('data-scratch-id')

    // Hover first row and click down
    await page.locator('[data-test="scratch-item"]').first().hover()
    await page.waitForTimeout(100)
    await page.locator('[data-test="scratch-down"]').first().click()
    await page.waitForTimeout(400)

    // Check IDB tabIndex swapped
    const scratches = await idbGetAll(page, 'dockerScratch')
    const first = scratches.find((s) => s.id === firstId)
    expect('scratchpad: reorder reflected in IDB', first && first.tabIndex > 0, `tabIndex: ${first?.tabIndex}`)

    // Delete via InlineConfirmButton.
    // Use scoped helper because the WritingStudio's hover-revealed "del"
    // button is still in the DOM (opacity-0) and would be hit by a global
    // text-search helper.
    await page.locator('[data-test="scratch-item"]').first().hover()
    await page.waitForTimeout(100)
    const deleted = await twoClickByTestId(page, 'scratch-delete')
    await page.waitForTimeout(400)

    expect('scratchpad: twoClickByTestId returned true', deleted)
    const afterDelete = await idbGetAll(page, 'dockerScratch')
    expect('scratchpad: IDB row count decreased', afterDelete.length < scratches.length,
      `before: ${scratches.length} after: ${afterDelete.length}`)
    const rowsAfter = await page.locator('[data-test="scratch-item"]').count()
    expect('scratchpad: UI row removed after delete', rowsAfter < rows.length, `rows: ${rowsAfter}`)

    await ctx.close()
  }

  // ── Clipboard smoke ───────────────────────────────────────────────────────
  console.log('\nClipboard smoke')
  {
    const { ctx, page } = await fresh(browser)
    await openDockerTab(page, 'clipboard')

    // Empty state
    expect('clipboard: empty state visible',
      await page.locator('[data-test="clipboard-empty"]').isVisible())

    // Capture manual text
    const testText = `clip-test-${Date.now()}`
    await page.locator('[data-test="clipboard-input"]').fill(testText)
    await page.click('[data-test="clipboard-capture"]')
    await page.waitForTimeout(300)

    expect('clipboard: empty state gone after capture',
      !await page.locator('[data-test="clipboard-empty"]').isVisible())
    expect('clipboard: row visible',
      await page.locator('[data-test="clipboard-row"]').first().isVisible())

    // Check IDB
    const clips = await idbGetAll(page, 'dockerClipboard')
    const found = clips.find((c) => c.text === testText)
    expect('clipboard: IDB row exists with captured text', !!found, `found: ${JSON.stringify(found)}`)

    // Click Copy — should show "Copied!" briefly
    await page.click('[data-test="clipboard-copy"]')
    await page.waitForTimeout(100)
    const copyText = await page.locator('[data-test="clipboard-copy"]').first().textContent().catch(() => '')
    expect('clipboard: copy button shows Copied! feedback',
      copyText?.includes('Copied!'), `got: "${copyText}"`)

    // Delete the row via scoped helper to avoid hitting WritingStudio's
    // ambient hover-revealed "del" button.
    const deleted = await twoClickByTestId(page, 'clipboard-delete')
    await page.waitForTimeout(400)
    expect('clipboard: twoClickByTestId returned true', deleted)

    const clipsAfter = await idbGetAll(page, 'dockerClipboard')
    expect('clipboard: IDB row removed', !clipsAfter.find((c) => c.text === testText))
    expect('clipboard: empty state restored',
      await page.locator('[data-test="clipboard-empty"]').isVisible())

    await ctx.close()
  }

  // ── Recently Deleted smoke ────────────────────────────────────────────────
  console.log('\nRecently Deleted smoke')
  {
    const { ctx, page } = await fresh(browser)

    // Create and soft-delete a doc
    await navByHash(page, '#/writing')
    await page.waitForTimeout(300)
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(300)
    await page.locator('[data-test="doc-title"]').fill('Trash test doc')
    await page.waitForTimeout(600)

    const docItem = page.locator('[data-test="doc-item"]').filter({ hasText: 'Trash test doc' }).first()
    const docId = await docItem.getAttribute('data-doc-id')

    await twoClickConfirm(page, 'del')
    await page.waitForTimeout(500)

    // Open Recently Deleted tab
    await openDockerTab(page, 'recently-deleted')

    expect('recently-deleted: row visible for soft-deleted doc',
      await page.locator('[data-test="recently-deleted-row"][data-record-kind="document"]').first().isVisible())

    // Restore
    await page.locator('[data-test="recently-deleted-restore"]').first().click()
    await page.waitForTimeout(400)

    const rowsAfterRestore = await page.locator('[data-test="recently-deleted-row"][data-record-kind="document"]').count()
    expect('recently-deleted: row gone after restore', rowsAfterRestore === 0, `rows: ${rowsAfterRestore}`)

    // Navigate to Writing — doc should be back
    await navByHash(page, '#/writing')
    await page.waitForTimeout(300)
    const restored = await page.locator('[data-test="doc-item"]').filter({ hasText: 'Trash test doc' }).count()
    expect('recently-deleted: doc back in writing list after restore', restored > 0, `count: ${restored}`)

    // Soft-delete again, then permanent purge
    await twoClickConfirm(page, 'del')
    await page.waitForTimeout(500)
    await openDockerTab(page, 'recently-deleted')

    const purged = await twoClickConfirm(page, 'purge')
    await page.waitForTimeout(500)
    expect('recently-deleted: twoClickConfirm purge returned true', purged)

    const docsIdb = await idbGetAll(page, 'writingDocs')
    const stillExists = docsIdb.find((d) => d.id === docId)
    expect('recently-deleted: IDB row gone after permanent purge', !stillExists,
      `id still in IDB: ${docId}`)

    await ctx.close()
  }

  // ── Recent Items smoke ────────────────────────────────────────────────────
  console.log('\nRecent Items smoke')
  {
    const { ctx, page } = await fresh(browser)
    await openDockerTab(page, 'recent-items')

    const rows = await page.locator('[data-test="recent-items-row"]').count()
    expect('recent-items: ≥3 rows (seeded data)', rows >= 3, `found: ${rows}`)

    // Click a document row → should nav to writing
    const docRow = page.locator('[data-test="recent-items-row"][data-record-kind="document"]').first()
    expect('recent-items: document row visible', await docRow.isVisible())
    await docRow.click()
    await page.waitForTimeout(400)

    const hash = await page.evaluate(() => window.location.hash)
    expect('recent-items: clicking doc row navigates to #/writing', hash === '#/writing', `hash: ${hash}`)

    // The selected doc's title input should be visible
    const titleInput = page.locator('[data-test="doc-title"]')
    expect('recent-items: doc title input visible after nav', await titleInput.isVisible())

    await ctx.close()
  }

  // ── Files smoke ───────────────────────────────────────────────────────────
  console.log('\nFiles smoke')
  {
    const { ctx, page } = await fresh(browser)
    await openDockerTab(page, 'files')

    expect('files: export button visible',
      await page.locator('[data-test="files-export"]').isVisible())
    expect('files: import button visible',
      await page.locator('[data-test="files-import"]').isVisible())

    // Export — intercept download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-test="files-export"]')
    ])
    const dlPath = await download.path()
    expect('files: download occurred', !!dlPath, 'no download path')

    if (dlPath) {
      const { readFileSync } = await import('fs')
      let parsed
      try { parsed = JSON.parse(readFileSync(dlPath, 'utf8')) } catch { parsed = null }
      expect('files: export is valid JSON', !!parsed, 'could not parse')
      // Sweep 23: SCHEMA_VERSION bumped 3→4 (additive: inboxItems and
      // nodePositions stores). Updated in place from === 3 with this comment
      // so the cumulative verify still passes after Sweep 23.
      expect('files: export has schemaVersion 4',
        parsed?.schemaVersion === 4, `schemaVersion: ${parsed?.schemaVersion}`)
    }

    // Import — write minimal synthetic v2 export, feed to file input
    const synthetic = JSON.stringify({
      schemaVersion: 2,
      documents: [], poems: [], longformDocs: [], sections: [],
      builds: [], constraints: [], features: [], screens: [],
      dataShapes: [], phases: [], reviews: [], shelfItems: [],
      projects: [], links: [], tags: [], tagLinks: [],
      dockerScratch: [], dockerClipboard: [], snapshots: [],
      patterns: [], pipelines: [], blocks: []
    })
    const synthPath = resolve('./test-downloads/synthetic-v2.json')
    writeFileSync(synthPath, synthetic)

    await page.setInputFiles('[data-test="files-import-file"]', synthPath)
    await page.waitForTimeout(500)

    const statusEl = page.locator('[data-test="files-status"]')
    const statusKind = await statusEl.getAttribute('data-status-kind').catch(() => null)
    expect('files: import status shows ok', statusKind === 'ok', `data-status-kind: ${statusKind}`)

    await ctx.close()
  }

  // ── Quick Add smoke ───────────────────────────────────────────────────────
  console.log('\nQuick Add smoke')
  {
    const { ctx, page } = await fresh(browser)
    await openDockerTab(page, 'quick-add')

    expect('quick-add: kind select visible',
      await page.locator('[data-test="quick-add-kind"]').isVisible())
    expect('quick-add: title input visible',
      await page.locator('[data-test="quick-add-title"]').isVisible())
    expect('quick-add: create button visible',
      await page.locator('[data-test="quick-add-create"]').isVisible())

    // Create a Document
    await page.locator('[data-test="quick-add-kind"]').selectOption('document')
    const docName = `Quick added doc ${Date.now()}`
    await page.locator('[data-test="quick-add-title"]').fill(docName)
    await page.click('[data-test="quick-add-create"]')
    await page.waitForTimeout(500)

    const hash = await page.evaluate(() => window.location.hash)
    expect('quick-add: document creation navigates to #/writing', hash === '#/writing', `hash: ${hash}`)

    const titleVal = await page.locator('[data-test="doc-title"]').inputValue().catch(() => '')
    expect('quick-add: new doc title matches', titleVal === docName, `got: "${titleVal}"`)

    // Title input should be cleared
    await openDockerTab(page, 'quick-add')
    const titleAfter = await page.locator('[data-test="quick-add-title"]').inputValue().catch(() => '')
    expect('quick-add: title input cleared after create', titleAfter === '', `got: "${titleAfter}"`)

    // Create a Pattern (no studio) — stays on current route, shows status
    await page.locator('[data-test="quick-add-kind"]').selectOption('pattern')
    await page.locator('[data-test="quick-add-title"]').fill('Pattern test xyz')
    await page.click('[data-test="quick-add-create"]')
    await page.waitForTimeout(300)

    const hashAfterPattern = await page.evaluate(() => window.location.hash)
    expect('quick-add: pattern creation does not navigate away',
      hashAfterPattern === '#/writing', `hash: ${hashAfterPattern}`)

    const statusVisible = await page.locator('[data-test="quick-add-status"]').isVisible()
    expect('quick-add: status line shown for pattern', statusVisible)

    await ctx.close()
  }

  // ── Regression — verify-sweep9 spot-checks ────────────────────────────────
  console.log('\nRegression — sweep-9 back-compat spot-checks')
  {
    const { ctx, page } = await fresh(browser)

    // Canvas still renders
    await navByHash(page, '#/canvas')
    await page.waitForTimeout(300)
    expect('canvas: route-stub-canvas present',
      await page.locator('[data-test="route-stub-canvas"]').isVisible())
    const h1 = await page.locator('[data-test="route-stub-canvas"] h1').textContent().catch(() => '')
    expect('canvas: h1 reads "Canvas"', h1 === 'Canvas', `got: "${h1}"`)

    // Sweep 23: route count grew from 10 to 12 (added /inbox + /atlas).
    // Updated in place from === 10 with this comment so the cumulative
    // verify still passes after Sweep 23.
    const linkCount = await page.locator('aside nav a').count()
    expect('sidebar: 12 routes', linkCount === 12, `count: ${linkCount}`)

    // Soft-delete still works in Writing
    await navByHash(page, '#/writing')
    await page.waitForTimeout(300)
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(300)
    await page.locator('[data-test="doc-title"]').fill('Regression soft-delete check')
    await page.waitForTimeout(600)
    await twoClickConfirm(page, 'del')
    await page.waitForTimeout(400)
    const gone = await page.locator('[data-test="doc-item"]').filter({ hasText: 'Regression soft-delete check' }).count()
    expect('writing: soft-deleted doc gone from list', gone === 0, `found: ${gone}`)

    await ctx.close()
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`  ${pass} passed  /  ${fail} failed`)
  console.log('─'.repeat(50))
  if (fail > 0) process.exit(1)

  await browser.close()
}

run().catch((e) => {
  console.error('Unhandled error:', e)
  process.exit(1)
})
