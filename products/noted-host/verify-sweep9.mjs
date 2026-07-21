// Sweep 9 verification — Canvas studio + soft-delete cutover.
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

// Click a button by its initial label text, then click the "Confirm?" button that appears.
// Returns true if both clicks succeeded.
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

async function run() {
  rmSync('./test-downloads', { recursive: true, force: true })
  mkdirSync('./test-downloads', { recursive: true })

  const browser = await chromium.launch(launchOpts)

  // ── Boot clean ────────────────────────────────────────────────────────────
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

  // ── Canvas studio renders ─────────────────────────────────────────────────
  console.log('\nCanvas studio renders')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/canvas')
    await page.waitForTimeout(300)

    // back-compat markers
    expect('route-stub-canvas present',
      await page.locator('[data-test="route-stub-canvas"]').isVisible())
    const h1 = await page.locator('[data-test="route-stub-canvas"] h1').textContent().catch(() => '')
    expect('h1 reads "Canvas"', h1 === 'Canvas', `got: "${h1}"`)

    // picker present, empty state shown
    expect('canvas-project-picker present',
      await page.locator('[data-test="canvas-project-picker"]').isVisible())
    expect('canvas-empty shown when no project selected',
      await page.locator('[data-test="canvas-empty"]').isVisible())
    expect('no canvas nodes when empty',
      await page.locator('[data-test="canvas-node"]').count() === 0)

    // Select Welcome via picker
    await page.click('[data-test="canvas-project-picker"] [data-test="project-picker"]')
    await page.waitForTimeout(200)
    const projects = await idbGetAll(page, 'projects')
    const welcome = projects.find((p) => p.name === 'Welcome')
    expect('Welcome project exists', !!welcome)

    if (welcome) {
      await page.click(`[data-test="project-picker-option"][data-project-id="${welcome.id}"]`)
      await page.waitForTimeout(800)

      const nodeCount = await page.locator('[data-test="canvas-node"]').count()
      expect('≥3 canvas nodes after selecting Welcome', nodeCount >= 3, `found ${nodeCount}`)

      // Check kind attributes
      const kinds = await page.locator('[data-test="canvas-node"]').evaluateAll(
        (els) => els.map((e) => e.getAttribute('data-node-kind'))
      )
      const validKinds = new Set(['document','poem','longform','build','pattern','pipeline'])
      const allValid = kinds.every((k) => validKinds.has(k))
      expect('all nodes have valid data-node-kind', allValid, `kinds: ${kinds}`)
    }

    await ctx.close()
  }

  // ── Canvas node-click navigation ──────────────────────────────────────────
  console.log('\nCanvas node-click navigation')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/canvas')
    await page.waitForTimeout(300)

    const projects = await idbGetAll(page, 'projects')
    const welcome = projects.find((p) => p.name === 'Welcome')

    if (welcome) {
      await page.click('[data-test="canvas-project-picker"] [data-test="project-picker"]')
      await page.waitForTimeout(200)
      await page.click(`[data-test="project-picker-option"][data-project-id="${welcome.id}"]`)
      await page.waitForTimeout(800)

      // Click the document node
      const docNode = page.locator('[data-test="canvas-node"][data-node-kind="document"]').first()
      await docNode.click()
      await page.waitForTimeout(500)

      const hash = await page.evaluate(() => window.location.hash)
      expect('clicking doc node navigates to #/writing', hash === '#/writing', `hash: ${hash}`)

      // The seeded doc title
      const titleVal = await page.locator('[data-test="doc-title"]').inputValue().catch(() => '')
      expect('doc title is "A first note"', titleVal === 'A first note', `got: "${titleVal}"`)
    } else {
      bad('canvas node-click navigation', 'Welcome project not found')
    }

    await ctx.close()
  }

  // ── Canvas edge persistence via IDB write ─────────────────────────────────
  console.log('\nCanvas edge persistence')
  {
    const { ctx, page } = await fresh(browser)

    // Get seeded doc and poem ids
    const docs  = await idbGetAll(page, 'writingDocs')
    const poems = await idbGetAll(page, 'poems')
    const projects = await idbGetAll(page, 'projects')
    const welcome = projects.find((p) => p.name === 'Welcome')
    const seededDoc  = docs.find((d) => d.projectId === welcome?.id && !d.deletedAt)
    const seededPoem = poems.find((p) => p.projectId === welcome?.id && !p.deletedAt)

    expect('seeded doc found',  !!seededDoc)
    expect('seeded poem found', !!seededPoem)

    if (seededDoc && seededPoem && welcome) {
      const linkId = `test-link-${Date.now()}`
      await idbPut(page, 'links', {
        id: linkId,
        sourceId: seededDoc.id,
        sourceType: 'document',
        targetId: seededPoem.id,
        targetType: 'poem',
        createdAt: Date.now(),
      })

      // Reload, navigate to canvas, select Welcome
      await page.reload()
      await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
      await navByHash(page, '#/canvas')
      await page.waitForTimeout(300)

      await page.click('[data-test="canvas-project-picker"] [data-test="project-picker"]')
      await page.waitForTimeout(200)
      await page.click(`[data-test="project-picker-option"][data-project-id="${welcome.id}"]`)
      await page.waitForTimeout(800)

      const edgeEl = await page.locator(`[data-test="canvas-edge"][data-link-id="${linkId}"]`).count()
      expect(`edge with link-id "${linkId}" rendered`, edgeEl > 0, `found ${edgeEl}`)
    }

    await ctx.close()
  }

  // ── Canvas position persistence ───────────────────────────────────────────
  console.log('\nCanvas position persistence')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/canvas')
    await page.waitForTimeout(300)

    const projects = await idbGetAll(page, 'projects')
    const welcome = projects.find((p) => p.name === 'Welcome')

    if (welcome) {
      await page.click('[data-test="canvas-project-picker"] [data-test="project-picker"]')
      await page.waitForTimeout(200)
      await page.click(`[data-test="project-picker-option"][data-project-id="${welcome.id}"]`)
      await page.waitForTimeout(800)

      // Check localStorage has positions
      const posRaw = await page.evaluate((pid) =>
        localStorage.getItem('verse-studio:canvas:positions:' + pid),
        welcome.id
      )
      expect('positions stored in localStorage', !!posRaw, 'no entry found')

      if (posRaw) {
        const posObj = JSON.parse(posRaw)
        expect('positions object has at least one entry', Object.keys(posObj).length >= 1)
      }
    } else {
      bad('canvas position persistence', 'Welcome not found')
    }

    await ctx.close()
  }

  // ── Soft-delete cutover smoke ─────────────────────────────────────────────
  console.log('\nSoft-delete cutover smoke')

  // Writing
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/writing')
    await page.waitForTimeout(300)
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(300)
    await page.locator('[data-test="doc-title"]').fill('Sweep 9 doomed')
    await page.waitForTimeout(600)

    // Find the doc in the list
    const docItem = page.locator('[data-test="doc-item"]').filter({ hasText: 'Sweep 9 doomed' }).first()
    const docId = await docItem.getAttribute('data-doc-id')
    expect('doc created in list', await docItem.isVisible())

    // Hover + delete via twoClickConfirm
    await twoClickConfirm(page, 'del')
    await page.waitForTimeout(600)

    // Gone from UI
    const stillInList = await page.locator('[data-test="doc-item"]').filter({ hasText: 'Sweep 9 doomed' }).count()
    expect('Writing: soft-deleted doc gone from UI list', stillInList === 0, `found ${stillInList}`)

    // Still in IDB with deletedAt
    const docs = await idbGetAll(page, 'writingDocs')
    const deleted = docs.find((d) => d.id === docId)
    expect('Writing: doc still in IDB', !!deleted)
    expect('Writing: doc has numeric deletedAt', typeof deleted?.deletedAt === 'number',
      `deletedAt=${deleted?.deletedAt}`)

    await ctx.close()
  }

  // Poetry
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/poetry')
    await page.waitForTimeout(300)
    await page.click('[data-test="new-poem"]')
    await page.waitForTimeout(300)
    await page.locator('[data-test="poem-title"]').fill('Sweep 9 doomed poem')
    await page.waitForTimeout(600)

    const poemItem = page.locator('[data-test="poem-item"]').filter({ hasText: 'Sweep 9 doomed poem' }).first()
    const poemId = await poemItem.getAttribute('data-poem-id')
    expect('poem created', await poemItem.isVisible())

    await twoClickConfirm(page, 'del')
    await page.waitForTimeout(600)

    const stillInList = await page.locator('[data-test="poem-item"]').filter({ hasText: 'Sweep 9 doomed poem' }).count()
    expect('Poetry: soft-deleted poem gone from UI', stillInList === 0)

    const poems = await idbGetAll(page, 'poems')
    const deleted = poems.find((p) => p.id === poemId)
    expect('Poetry: poem still in IDB with deletedAt', typeof deleted?.deletedAt === 'number',
      `deletedAt=${deleted?.deletedAt}`)

    await ctx.close()
  }

  // Longform
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/longform')
    await page.waitForTimeout(300)
    await page.click('[data-test="new-longform"]')
    await page.waitForTimeout(300)
    await page.locator('[data-test="longform-title"]').fill('Sweep 9 doomed longform')
    await page.waitForTimeout(600)

    const pill = page.locator('[data-test="longform-pill"]').filter({ hasText: 'Sweep 9 doomed longform' }).first()
    const longformId = await pill.getAttribute('data-longform-id')
    expect('longform created', await pill.isVisible())

    if (await pill.isVisible()) {
      await twoClickConfirm(page, 'Delete longform')
      await page.waitForTimeout(600)
    } else {
      bad('Longform: find delete button', 'Delete longform button not found')
    }

    const stillVisible = await page.locator('[data-test="longform-pill"]').filter({ hasText: 'Sweep 9 doomed longform' }).count()
    expect('Longform: soft-deleted doc gone from UI', stillVisible === 0)

    const lfDocs = await idbGetAll(page, 'longformProjects')
    const deleted = lfDocs.find((d) => d.id === longformId)
    expect('Longform: doc still in IDB with deletedAt', typeof deleted?.deletedAt === 'number',
      `deletedAt=${deleted?.deletedAt}`)

    await ctx.close()
  }

  // App-Design
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/app-design')
    await page.waitForTimeout(300)
    await page.click('[data-test="new-build"]')
    await page.waitForTimeout(400)
    const buildPill = page.locator('[data-test="build-pill"]').first()
    const buildId = await buildPill.getAttribute('data-build-id')

    await twoClickConfirm(page, 'Delete build')
    await page.waitForTimeout(600)

    const builds = await idbGetAll(page, 'appDesignBuilds')
    const deleted = builds.find((b) => b.id === buildId)
    expect('App-Design: build still in IDB with deletedAt', typeof deleted?.deletedAt === 'number',
      `deletedAt=${deleted?.deletedAt}`)

    await ctx.close()
  }

  // ── Shelf treats soft-deleted as stale ────────────────────────────────────
  console.log('\nShelf treats soft-deleted as stale')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/writing')
    await page.waitForTimeout(300)

    // Select the seeded doc (first active doc in list)
    await page.locator('[data-test="doc-item"]').first().click()
    await page.waitForTimeout(200)
    const docTitle = await page.locator('[data-test="doc-title"]').inputValue()

    // Shelve it
    await page.click('[data-test="shelf-toggle"]')
    await page.waitForTimeout(400)

    // Soft-delete via InlineConfirmButton
    await twoClickConfirm(page, 'Delete')
    await page.waitForTimeout(600)

    // Navigate to Shelf
    await navByHash(page, '#/shelf')
    await page.waitForTimeout(400)

    // The shelf-open button for the stale item should have line-through
    const staleBtn = page.locator('[data-test="shelf-open"]').filter({ hasText: docTitle })
    const btnClass = await staleBtn.getAttribute('class').catch(() => '')
    expect('stale shelf item has line-through styling',
      btnClass?.includes('line-through'), `class: "${btnClass}"`)

    await ctx.close()
  }

  // ── Cmd+K filters soft-deleted ────────────────────────────────────────────
  console.log('\nCmd+K filters soft-deleted records')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/writing')
    await page.waitForTimeout(300)

    // Create a uniquely-titled doc
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(300)
    await page.locator('[data-test="doc-title"]').fill('Filter test doc xqz')
    await page.waitForTimeout(600)

    // Soft-delete it using twoClickConfirm
    await twoClickConfirm(page, 'Delete')
    await page.waitForTimeout(600)

    // Open palette and search
    await page.keyboard.press('Meta+k')
    await page.waitForTimeout(300)
    await page.locator('[data-test="palette-input"]').fill('Filter test doc xqz')
    await page.waitForTimeout(200)

    const matches = await page.locator('[data-test="palette-item"]').filter({ hasText: 'Filter test doc xqz' }).count()
    expect('soft-deleted doc absent from palette', matches === 0, `found ${matches} matches`)

    await ctx.close()
  }

  // ── Regression: verify-sweep8 spot-checks ────────────────────────────────
  console.log('\nRegression — sweep-8 back-compat spot-checks')
  {
    const { ctx, page } = await fresh(browser)

    // Projects studio still renders
    await navByHash(page, '#/projects')
    expect('Projects studio present',
      await page.locator('[data-test="route-stub-projects"]').isVisible())

    // ProjectPicker in Writing
    await navByHash(page, '#/writing')
    await page.waitForTimeout(300)
    // Re-create a doc since seeded one may be soft-deleted in prior tests
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(300)
    expect('ProjectPicker in Writing',
      await page.locator('[data-test="project-picker"]').isVisible())

    // Longform still uses "longform" copy
    await navByHash(page, '#/longform')
    await page.waitForTimeout(300)
    expect('new-longform button present',
      await page.locator('[data-test="new-longform"]').isVisible())
    expect('new-project absent from longform',
      await page.locator('[data-test="new-project"]').count() === 0)

    // Docker present
    expect('Docker present',
      await page.locator('[data-test="docker-toggle"]').isVisible())

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
