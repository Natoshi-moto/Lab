// Sweep 15 verification — Snapshots UI (capture + restore in Writing / Poetry / Longform).
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
    if (txt?.toLowerCase().includes('confirm')) {
      await btn.click({ force: true })
      return true
    }
  }
  return false
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

  // ─── Snapshots button mounts on three target studios ─────────────────────
  console.log('\n── Snapshots button mounts on target studios ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // document
    const docId = await createDocAndGetId(page)
    const docBtn = page.locator('[data-test="snapshots-button"][data-record-type="document"]')
    expect('doc: snapshots-button count === 1', await docBtn.count() === 1)
    expect('doc: data-record-id matches', await docBtn.getAttribute('data-record-id') === docId)
    expect('doc: initial count badge 0', await docBtn.getAttribute('data-snapshot-count') === '0')

    // poem
    const poemId = await createPoemAndGetId(page)
    const poemBtn = page.locator('[data-test="snapshots-button"][data-record-type="poem"]')
    expect('poem: snapshots-button count === 1', await poemBtn.count() === 1)
    expect('poem: data-record-id matches', await poemBtn.getAttribute('data-record-id') === poemId)
    expect('poem: initial count badge 0', await poemBtn.getAttribute('data-snapshot-count') === '0')

    // longform
    const lfId = await createLongformAndGetId(page)
    const lfBtn = page.locator('[data-test="snapshots-button"][data-record-type="longform"]')
    expect('longform: snapshots-button count === 1', await lfBtn.count() === 1)
    expect('longform: data-record-id matches', await lfBtn.getAttribute('data-record-id') === lfId)
    expect('longform: initial count badge 0', await lfBtn.getAttribute('data-snapshot-count') === '0')

    expect('studios: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Snapshots button NOT mounted in non-record studios ──────────────────
  // Note: Sweep 15 originally asserted no snapshots-button in app-design /
  // prompts / projects, since Sweep 15 only mounted it in writing/poetry/
  // longform. Sweep 16 deliberately extended Snapshots to those three
  // studios, so those assertions were retired here. Library, Canvas, Shelf,
  // and Settings remain the four routes that should NEVER expose a
  // Snapshots button. verify-sweep16 covers the now-positive case for
  // build/pipeline/project.
  console.log('\n── Snapshots button NOT in non-record studios ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // library
    await navByHash(page, '#/library')
    await page.waitForTimeout(150)
    const libNew = page.locator('button').filter({ hasText: /\+ New/i }).first()
    if (await libNew.count() > 0) await libNew.click()
    await page.waitForTimeout(300)
    expect('library: no snapshots-button', await page.locator('[data-test="snapshots-button"]').count() === 0)

    // canvas
    await navByHash(page, '#/canvas')
    await page.waitForTimeout(150)
    expect('canvas: no snapshots-button', await page.locator('[data-test="snapshots-button"]').count() === 0)

    // shelf
    await navByHash(page, '#/shelf')
    await page.waitForTimeout(150)
    expect('shelf: no snapshots-button', await page.locator('[data-test="snapshots-button"]').count() === 0)

    // settings
    await navByHash(page, '#/settings')
    await page.waitForTimeout(150)
    expect('settings: no snapshots-button', await page.locator('[data-test="snapshots-button"]').count() === 0)

    expect('negative mount: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Capture flow on a document ──────────────────────────────────────────
  console.log('\n── Capture flow on a document ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const docId = await createDocAndGetId(page)
    const uniqueTitle = 'SnapTest-' + Date.now()
    await page.fill('[data-test="doc-title"]', uniqueTitle)
    await page.fill('[data-test="doc-body"]', 'Original body text')
    await page.waitForTimeout(700)  // autosave debounce

    // open popover
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    expect('capture: popover opens', await page.locator('[data-test="snapshots-menu"]').count() === 1)
    expect('capture: empty state visible', await page.locator('[data-test="snapshots-empty"]').count() === 1)

    // take snapshot
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    expect('capture: empty state gone', await page.locator('[data-test="snapshots-empty"]').count() === 0)
    expect('capture: one snapshot row', await page.locator('[data-test="snapshot-row"]').count() === 1)

    const countAttr = await page.locator('[data-test="snapshots-button"]').getAttribute('data-snapshot-count')
    expect('capture: count badge === 1', countAttr === '1')

    // IDB check
    const snaps = await idbGetAll(page, 'snapshots')
    const matching = snaps.filter(s => s.recordId === docId && s.recordType === 'document')
    expect('capture: IDB has one snapshot', matching.length === 1)
    if (matching.length > 0) {
      const parsed = JSON.parse(matching[0].data)
      expect('capture: IDB data has title', parsed.title === uniqueTitle)
      expect('capture: IDB data has body', parsed.body === 'Original body text')
    }

    expect('capture: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Restore flow ─────────────────────────────────────────────────────────
  console.log('\n── Restore flow ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const docId = await createDocAndGetId(page)
    const originalTitle = 'Restore-Title-' + Date.now()
    const originalBody  = 'Restore body ' + Date.now()
    await page.fill('[data-test="doc-title"]', originalTitle)
    await page.fill('[data-test="doc-body"]', originalBody)
    await page.waitForTimeout(700)

    // take snapshot
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    // close popover before editing (page.fill doesn't fire mousedown)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // change content
    await page.fill('[data-test="doc-title"]', 'Changed title')
    await page.fill('[data-test="doc-body"]', 'Changed body')
    await page.waitForTimeout(700)

    // restore — re-open popover
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(200)
    await page.click('[data-test="snapshot-restore"]')
    await page.waitForTimeout(400)

    const restoredTitle = await page.locator('[data-test="doc-title"]').inputValue()
    const restoredBody  = await page.locator('[data-test="doc-body"]').inputValue()
    expect('restore: title reverted', restoredTitle === originalTitle, `got "${restoredTitle}"`)
    expect('restore: body reverted',  restoredBody  === originalBody,  `got "${restoredBody}"`)

    // IDB verify
    const docs = await idbGetAll(page, 'writingDocs')
    const doc  = docs.find(d => d.id === docId)
    expect('restore: IDB doc title matches', doc?.title === originalTitle)
    expect('restore: IDB doc body matches',  doc?.body  === originalBody)

    expect('restore: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Restore flow on a poem (autosave-clobber regression) ────────────────
  console.log('\n── Restore flow on a poem ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const poemId = await createPoemAndGetId(page)
    const originalTitle = 'Poem-Restore-' + Date.now()
    const originalBody  = 'Poem body original'
    await page.fill('[data-test="poem-title"]', originalTitle)
    await page.fill('[data-test="poem-body"]', originalBody)
    await page.waitForTimeout(700)

    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    await page.fill('[data-test="poem-title"]', 'Changed poem title')
    await page.fill('[data-test="poem-body"]', 'Changed poem body')
    await page.waitForTimeout(700)

    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(200)
    await page.click('[data-test="snapshot-restore"]')
    // Wait past the autosave delay to confirm autosave doesn't clobber the restore.
    await page.waitForTimeout(800)

    const restoredTitle = await page.locator('[data-test="poem-title"]').inputValue()
    const restoredBody  = await page.locator('[data-test="poem-body"]').inputValue()
    expect('poem restore: title reverted', restoredTitle === originalTitle, `got "${restoredTitle}"`)
    expect('poem restore: body reverted',  restoredBody  === originalBody,  `got "${restoredBody}"`)

    const poems = await idbGetAll(page, 'poems')
    const poem = poems.find(p => p.id === poemId)
    expect('poem restore: IDB title matches (autosave did not clobber)', poem?.title === originalTitle, `IDB title "${poem?.title}"`)
    expect('poem restore: IDB body matches (autosave did not clobber)',  poem?.body  === originalBody)

    expect('poem restore: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Restore flow on a longform (autosave-clobber regression) ────────────
  console.log('\n── Restore flow on a longform ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const lfId = await createLongformAndGetId(page)
    const originalTitle = 'LF-Restore-' + Date.now()
    await page.fill('[data-test="longform-title"]', originalTitle)
    await page.waitForTimeout(700)

    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    await page.fill('[data-test="longform-title"]', 'Changed longform title')
    await page.waitForTimeout(700)

    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(200)
    await page.click('[data-test="snapshot-restore"]')
    // Wait past the autosave delay to confirm autosave doesn't clobber the restore.
    await page.waitForTimeout(800)

    const restoredTitle = await page.locator('[data-test="longform-title"]').inputValue()
    expect('longform restore: title reverted in input', restoredTitle === originalTitle, `got "${restoredTitle}"`)

    // NOTE: the longform IDB store is `longformProjects`, NOT `longformDocs` —
    // that's a frozen v1 schema name (see comment in src/db.ts).
    const lfs = await idbGetAll(page, 'longformProjects')
    const lf = lfs.find(d => d.id === lfId)
    expect('longform restore: IDB title matches (autosave did not clobber)', lf?.title === originalTitle, `IDB title "${lf?.title}"`)

    expect('longform restore: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Delete a snapshot ────────────────────────────────────────────────────
  console.log('\n── Delete a snapshot ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const docId = await createDocAndGetId(page)
    await page.fill('[data-test="doc-title"]', 'Delete-test')
    await page.waitForTimeout(300)

    // take two snapshots
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)

    expect('delete: two rows before delete', await page.locator('[data-test="snapshot-row"]').count() === 2)

    // delete first (two-click)
    await twoClickByTestId(page, 'snapshot-delete', 500)
    await page.waitForTimeout(300)

    expect('delete: one row remains', await page.locator('[data-test="snapshot-row"]').count() === 1)
    const countAfter = await page.locator('[data-test="snapshots-button"]').getAttribute('data-snapshot-count')
    expect('delete: count badge === 1', countAfter === '1')

    const snaps = await idbGetAll(page, 'snapshots')
    const remaining = snaps.filter(s => s.recordId === docId)
    expect('delete: IDB has one remaining', remaining.length === 1)

    expect('delete: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Snapshots scoped per-record ─────────────────────────────────────────
  console.log('\n── Snapshots scoped per-record ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // doc A
    const docAId = await createDocAndGetId(page)
    await page.fill('[data-test="doc-title"]', 'Doc A')
    await page.waitForTimeout(300)
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    // close popover
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // doc B
    const docBId = await createDocAndGetId(page)
    await page.fill('[data-test="doc-title"]', 'Doc B')
    await page.waitForTimeout(300)

    // open B's popover
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    expect('scope: doc B starts empty', await page.locator('[data-test="snapshots-empty"]').count() === 1)
    const countB = await page.locator('[data-test="snapshots-button"]').getAttribute('data-snapshot-count')
    expect('scope: doc B count === 0', countB === '0')

    // take snapshot on B
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    // close
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // navigate back to A — click it in the doc list
    const docABtn = page.locator(`[data-test="doc-item"][data-doc-id="${docAId}"]`)
    await docABtn.click()
    await page.waitForTimeout(300)

    const countA = await page.locator('[data-test="snapshots-button"]').getAttribute('data-snapshot-count')
    expect('scope: doc A still count === 1', countA === '1', `got "${countA}"`)

    // open A's popover and confirm A's snapshot, not B's
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    expect('scope: doc A shows 1 row', await page.locator('[data-test="snapshot-row"]').count() === 1)

    expect('scope: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Outside-click closes the popover ─────────────────────────────────────
  console.log('\n── Outside-click closes popover ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await createDocAndGetId(page)
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    expect('outside-click: popover open', await page.locator('[data-test="snapshots-menu"]').count() === 1)

    // click the body textarea (outside the popover)
    await page.click('[data-test="doc-body"]')
    await page.waitForTimeout(200)
    expect('outside-click: popover closed', await page.locator('[data-test="snapshots-menu"]').count() === 0)

    expect('outside-click: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Capture + reload + snapshot persists ────────────────────────────────
  console.log('\n── Capture + reload + persist ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const docId = await createDocAndGetId(page)
    await page.fill('[data-test="doc-title"]', 'Persist-test')
    await page.waitForTimeout(300)
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)

    // reload
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    await navByHash(page, '#/writing')
    await page.waitForTimeout(300)

    // click the doc
    const docItem = page.locator(`[data-test="doc-item"][data-doc-id="${docId}"]`)
    if (await docItem.count() > 0) await docItem.click()
    await page.waitForTimeout(300)

    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    expect('persist: snapshot row still there', await page.locator('[data-test="snapshot-row"]').count() === 1)
    const countReload = await page.locator('[data-test="snapshots-button"]').getAttribute('data-snapshot-count')
    expect('persist: count badge === 1 after reload', countReload === '1')

    expect('persist: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Snapshots NOT in Recently Deleted ───────────────────────────────────
  console.log('\n── Snapshots NOT in Recently Deleted ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await createDocAndGetId(page)
    await page.click('[data-test="snapshots-button"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)

    // delete the snapshot (two clicks)
    await twoClickByTestId(page, 'snapshot-delete', 500)
    await page.waitForTimeout(300)

    // close popover
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // open Recently Deleted docker tab
    await openDockerTab(page, 'recently-deleted')
    await page.waitForTimeout(200)

    const snapRows = page.locator('[data-record-kind="snapshot"]')
    expect('recently-deleted: no snapshot rows', await snapRows.count() === 0)

    expect('recently-deleted: zero errors', errors.console.length === 0 && errors.pageError.length === 0)
    await ctx.close()
  }

  // ─── Regression: sweeps 13+14 spot-checks ────────────────────────────────
  console.log('\n── Regression: sweeps 13+14 spot-checks ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Writing still has TagsBar
    await createDocAndGetId(page)
    expect('regression: writing has tags-bar', await page.locator('[data-test="tags-bar"][data-record-type="document"]').count() === 1)

    // Poetry still has TagsBar
    await createPoemAndGetId(page)
    expect('regression: poetry has tags-bar', await page.locator('[data-test="tags-bar"][data-record-type="poem"]').count() === 1)

    // Longform still has TagsBar
    await createLongformAndGetId(page)
    expect('regression: longform has tags-bar', await page.locator('[data-test="tags-bar"][data-record-type="longform"]').count() >= 1)

    // AppDesign still has TagsBar
    await navByHash(page, '#/app-design')
    await page.waitForTimeout(150)
    await page.click('[data-test="new-build"]')
    await page.waitForTimeout(400)
    expect('regression: app-design has tags-bar', await page.locator('[data-test="tags-bar"][data-record-type="build"]').count() === 1)

    // Prompts still has TagsBar
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(150)
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)
    expect('regression: prompts has tags-bar', await page.locator('[data-test="tags-bar"][data-record-type="pipeline"]').count() === 1)

    // Projects still has TagsBar
    await navByHash(page, '#/projects')
    await page.waitForTimeout(150)
    await page.click('[data-test="new-project-button"]')
    await page.waitForTimeout(400)
    expect('regression: projects has tags-bar', await page.locator('[data-test="tags-bar"][data-record-type="project"]').count() === 1)

    // Library has zero TagsBar elements
    await navByHash(page, '#/library')
    await page.waitForTimeout(200)
    // regression: library zero tags-bar — RETIRED in Sweep 18.
    // Library now mounts TagsBar (data-record-type="pattern") when a pattern
    // is selected. Positive coverage is in verify-sweep18.mjs.

    // Library pattern Markdown export still exists
    const libNew = page.locator('button').filter({ hasText: /\+ New/i }).first()
    if (await libNew.count() > 0) {
      await libNew.click()
      await page.waitForTimeout(300)
    }
    expect('regression: pattern-export-md exists', await page.locator('[data-test="pattern-export-md"]').count() >= 1)

    // Sweep 23: route count grew from 10 to 12 (added /inbox + /atlas).
    // Updated in place from === 10 with this comment so the cumulative
    // verify still passes after Sweep 23.
    const sidebarLinks = await page.locator('aside a[href^="#/"]').count()
    expect('regression: sidebar has 12 routes', sidebarLinks === 12, `got ${sidebarLinks}`)

    expect('regression: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log(`\n── Results: ${pass} passed, ${fail} failed ──`)
  await browser.close()
  if (fail > 0) process.exit(1)
}

run().catch((e) => { console.error(e); process.exit(1) })
