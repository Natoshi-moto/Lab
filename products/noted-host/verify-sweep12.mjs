// Sweep 12 verification — Feature Library studio (Pattern records).
//
// Set CHROMIUM_PATH=/path/to/chromium if Playwright browsers aren't on
// the default lookup path.

import { chromium } from 'playwright'
import { mkdirSync, rmSync, readFileSync } from 'fs'
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
    req.onerror  = () => reject(req.error)
    req.onsuccess = () => {
      const db  = req.result
      const tx  = db.transaction(store, 'readonly')
      const all = tx.objectStore(store).getAll()
      all.onsuccess = () => resolve(all.result)
      all.onerror   = () => reject(all.error)
    }
  }), storeName)
}

// Like twoClickConfirm but scoped to a specific data-test selector.
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

  // ── Boot — clean across all 10 routes ───────────────────────────────────
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

  // ── Studio renders new content (not the stub) ───────────────────────────
  console.log('\nStudio renders — not the stub')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    expect('route-stub-library present',
      (await page.locator('[data-test="route-stub-library"]').count()) > 0)

    const h1Text = await page.locator('[data-test="route-stub-library"] h1').textContent().catch(() => '')
    expect('h1 reads "Feature Library"',
      h1Text.trim() === 'Feature Library', `got: "${h1Text.trim()}"`)

    expect('new-pattern button visible',
      await page.locator('[data-test="new-pattern"]').isVisible())

    // No patterns seeded — empty state visible.
    const emptyVisible = await page.locator('text=No patterns yet.').isVisible().catch(() => false)
    expect('empty state visible on fresh boot', emptyVisible)

    // Old stub placeholder text gone.
    const bodyText = await page.locator('[data-test="route-stub-library"]').innerText().catch(() => '')
    expect('stub placeholder text gone',
      !bodyText.includes('ships in Sweep'), `text: "${bodyText.slice(0, 80)}"`)

    await ctx.close()
  }

  // ── Pattern create + edit + persist ─────────────────────────────────────
  console.log('\nPattern create + edit + persist')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    // Create
    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    const itemCount = await page.locator('[data-test="pattern-item"]').count()
    expect('pattern appears in aside after + New', itemCount >= 1, `count: ${itemCount}`)

    const nameVal = await page.locator('[data-test="pattern-name"]').inputValue().catch(() => '')
    expect('new pattern name reads "Untitled pattern"',
      nameVal === 'Untitled pattern', `got: "${nameVal}"`)

    // Edit name + description + body
    const uniqueName = `Test Pattern ${Date.now()}`
    const uniqueDesc = `Description ${Date.now()}`
    const uniqueBody = `Body content ${Date.now()}`
    await page.locator('[data-test="pattern-name"]').fill(uniqueName)
    await page.locator('[data-test="pattern-description"]').fill(uniqueDesc)
    await page.locator('[data-test="pattern-body"]').fill(uniqueBody)
    await page.waitForTimeout(700)

    // Navigate away and back
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    const nameAfter = await page.locator('[data-test="pattern-name"]').inputValue().catch(() => '')
    expect('pattern name persists after navigation',
      nameAfter === uniqueName, `got: "${nameAfter}"`)

    const descAfter = await page.locator('[data-test="pattern-description"]').inputValue().catch(() => '')
    expect('pattern description persists after navigation',
      descAfter === uniqueDesc, `got: "${descAfter}"`)

    const bodyAfter = await page.locator('[data-test="pattern-body"]').inputValue().catch(() => '')
    expect('pattern body persists after navigation',
      bodyAfter === uniqueBody, `got: "${bodyAfter}"`)

    // Raw IDB
    const allPatterns = await idbGetAll(page, 'patterns')
    const stored = allPatterns.find((p) => p.name === uniqueName)
    expect('IDB patterns row has typed name',
      !!stored, `rows: ${JSON.stringify(allPatterns.map(p => p.name))}`)
    expect('IDB patterns row has typed description',
      stored?.description === uniqueDesc, `got: "${stored?.description}"`)
    expect('IDB patterns row has typed body',
      stored?.body === uniqueBody, `got: "${stored?.body}"`)

    await ctx.close()
  }

  // ── Type select ─────────────────────────────────────────────────────────
  console.log('\nType select')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    await page.locator('[data-test="pattern-type"]').selectOption('ui-pattern')
    await page.waitForTimeout(400)

    const allPatterns = await idbGetAll(page, 'patterns')
    expect('IDB patterns row has type=ui-pattern',
      allPatterns.some((p) => p.type === 'ui-pattern'),
      `types: ${JSON.stringify(allPatterns.map(p => p.type))}`)

    // Reload and check
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    await navByHash(page, '#/library')
    await page.waitForTimeout(400)

    const typeVal = await page.locator('[data-test="pattern-type"]').inputValue().catch(() => '')
    expect('type select shows persisted value after reload',
      typeVal === 'ui-pattern', `got: "${typeVal}"`)

    await ctx.close()
  }

  // ── Tags chip input — RETIRED in Sweep 18 ───────────────────────────────
  // The TagsInput component and its data-test="pattern-tag-input" /
  // data-test="pattern-tag-chip" / data-test="pattern-tag-remove" selectors
  // no longer exist. Library now mounts the shared relational TagsBar
  // (data-test="tags-bar" data-record-type="pattern"). The equivalent
  // relational coverage lives in verify-sweep18.mjs:
  //   "Attach via TagsBar persists to TagLinks" and
  //   "TagsBar present in Library with pattern selected".

  // ── Soft-delete (header) → Recently Deleted → Restore ───────────────────
  console.log('\nSoft-delete (header) → Recently Deleted → Restore')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    const uniqueName = `Soft Delete Header ${Date.now()}`
    await page.locator('[data-test="pattern-name"]').fill(uniqueName)
    await page.waitForTimeout(700)

    // Soft-delete via header
    const ok = await twoClickByTestId(page, 'pattern-delete')
    expect('header pattern-delete two-click works', ok)
    await page.waitForTimeout(400)

    // Pattern gone from aside
    const items = await page.locator('[data-test="pattern-item"]').count()
    expect('pattern disappears from aside after header delete',
      items === 0, `count: ${items}`)

    // Recently Deleted shows it
    await openDockerTab(page, 'recently-deleted')
    const rdRow = page.locator('[data-test="recently-deleted-row"][data-record-kind="pattern"]')
    expect('Recently Deleted has a pattern row',
      (await rdRow.count()) >= 1, `count: ${await rdRow.count()}`)

    // Restore
    await rdRow.first().locator('[data-test="recently-deleted-restore"]').click()
    await page.waitForTimeout(400)

    // Reappears in studio
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)
    const itemsAfterRestore = await page.locator('[data-test="pattern-item"]').count()
    expect('pattern reappears in aside after restore',
      itemsAfterRestore >= 1, `count: ${itemsAfterRestore}`)

    await ctx.close()
  }

  // ── Aside-row delete ────────────────────────────────────────────────────
  console.log('\nAside-row delete')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)
    const uniqueName = `Row Delete ${Date.now()}`
    await page.locator('[data-test="pattern-name"]').fill(uniqueName)
    await page.waitForTimeout(700)

    const before = await page.locator('[data-test="pattern-item"]').count()

    // Hover to make the row-level button visible (also force-click as fallback)
    await page.locator('[data-test="pattern-item"]').first().hover()
    const ok = await twoClickByTestId(page, 'pattern-delete-row')
    expect('row pattern-delete-row two-click works', ok)
    await page.waitForTimeout(400)

    const after = await page.locator('[data-test="pattern-item"]').count()
    expect('pattern disappears from aside after row delete',
      after === before - 1, `before: ${before}, after: ${after}`)

    // In Recently Deleted
    await openDockerTab(page, 'recently-deleted')
    const rdCount = await page.locator('[data-test="recently-deleted-row"][data-record-kind="pattern"]').count()
    expect('row-deleted pattern appears in Recently Deleted',
      rdCount >= 1, `count: ${rdCount}`)

    await ctx.close()
  }

  // ── ProjectPicker round-trip ────────────────────────────────────────────
  console.log('\nProjectPicker round-trip')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    expect('project-picker visible',
      await page.locator('[data-test="project-picker"]').isVisible())

    // Open picker, click Welcome
    await page.click('[data-test="project-picker"]')
    await page.waitForTimeout(150)
    const welcomeOption = page.locator('[data-test="project-picker-option"]').filter({ hasText: 'Welcome' })
    const welcomeId = await welcomeOption.getAttribute('data-project-id')
    expect('welcome project option visible', !!welcomeId, `got: "${welcomeId}"`)
    await welcomeOption.click()
    await page.waitForTimeout(300)

    const pickerCurrent = await page.locator('[data-test="project-picker"]').getAttribute('data-current-project')
    expect('picker shows Welcome id after selection',
      pickerCurrent === welcomeId, `got: "${pickerCurrent}"`)

    // Reload
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    await navByHash(page, '#/library')
    await page.waitForTimeout(400)

    const pickerAfterReload = await page.locator('[data-test="project-picker"]').getAttribute('data-current-project')
    expect('picker persists Welcome id after reload',
      pickerAfterReload === welcomeId, `got: "${pickerAfterReload}"`)

    // IDB
    const allPatterns = await idbGetAll(page, 'patterns')
    const stored = allPatterns.find((p) => p.projectId === welcomeId)
    expect('IDB patterns row has projectId matching Welcome',
      !!stored, `projectIds: ${JSON.stringify(allPatterns.map(p => p.projectId))}`)

    await ctx.close()
  }

  // ── Export — .md ────────────────────────────────────────────────────────
  console.log('\nExport — .md')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    const pName = `Export Test ${Date.now()}`
    const pDesc = `An export description ${Date.now()}`
    const pBody = `Pattern body content ${Date.now()}`

    await page.locator('[data-test="pattern-name"]').fill(pName)
    await page.locator('[data-test="pattern-description"]').fill(pDesc)
    await page.locator('[data-test="pattern-body"]').fill(pBody)

    // Set a type
    await page.locator('[data-test="pattern-type"]').selectOption('ui-pattern')

    // Add 2 tags via TagsBar (Sweep 18: relational tags replace chip input)
    const tagInput = page.locator('[data-test="tags-bar-input"]')
    await tagInput.fill('alpha')
    await tagInput.press('Enter')
    await page.waitForTimeout(150)
    await tagInput.fill('beta')
    await tagInput.press('Enter')
    await page.waitForTimeout(700)

    // Download .md
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-test="pattern-export-md"]'),
    ])
    const dlPath = `./test-downloads/${download.suggestedFilename()}`
    await download.saveAs(dlPath)
    const content = readFileSync(dlPath, 'utf8')

    expect('md export starts with ---',
      content.startsWith('---'), `first 20: "${content.slice(0, 20)}"`)
    expect('md export contains name: line',
      content.includes(`name: ${pName}`), `not found: "name: ${pName}"`)
    expect('md export contains type: ui-pattern',
      content.includes('type: ui-pattern'), 'type line not found')
    expect('md export contains tags: [alpha, beta]',
      content.includes('tags: [alpha, beta]'), 'tags line not found')
    expect('md export contains createdAt: ISO',
      /createdAt:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(content),
      'no ISO createdAt')
    expect('md export contains updatedAt: ISO',
      /updatedAt:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(content),
      'no ISO updatedAt')
    expect('md export contains frontmatter close',
      content.split('---').length >= 3, 'no closing ---')
    expect('md export contains heading',
      content.includes(`# ${pName}`), 'no # heading')
    expect('md export contains description',
      content.includes(pDesc), 'description not found')
    expect('md export contains body',
      content.includes(pBody), 'body not found')
    expect('md export filename ends with .md',
      download.suggestedFilename().endsWith('.md'),
      `filename: ${download.suggestedFilename()}`)

    await ctx.close()
  }

  // ── Quick Add → pattern → studio ────────────────────────────────────────
  console.log('\nQuick Add → pattern → studio (no auto-navigation)')
  {
    const { ctx, page } = await fresh(browser)

    await openDockerTab(page, 'quick-add')
    await page.locator('[data-test="quick-add-kind"]').selectOption('pattern')
    const quickPatternName = `Quick pattern ${Date.now()}`
    await page.locator('[data-test="quick-add-title"]').fill(quickPatternName)
    await page.click('[data-test="quick-add-create"]')
    await page.waitForTimeout(500)

    // Transient status visible — Sweep 10 contract
    const statusText = await page.locator('[data-test="quick-add-status"]').textContent().catch(() => '')
    expect('quick-add shows "Created <name>." status',
      statusText.includes('Created') && statusText.includes(quickPatternName),
      `status: "${statusText}"`)

    // Navigate to library — pattern is in the aside
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    const items = await page.locator('[data-test="pattern-item"]').count()
    expect('quick-add: pattern visible in studio aside', items >= 1, `count: ${items}`)

    // IDB has it
    const allPatterns = await idbGetAll(page, 'patterns')
    const stored = allPatterns.find((p) => p.name === quickPatternName)
    expect('quick-add: IDB patterns row exists', !!stored,
      `names: ${JSON.stringify(allPatterns.map(p => p.name))}`)

    await ctx.close()
  }

  // ── Regression — verify-sweep11 spot-checks ─────────────────────────────
  console.log('\nRegression — sweep-11 back-compat spot-checks')
  {
    const { ctx, page } = await fresh(browser)

    // Prompt Studio still has its route stub + new-pipeline
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)
    expect('route-stub-prompts present',
      (await page.locator('[data-test="route-stub-prompts"]').count()) > 0)
    expect('new-pipeline button visible',
      await page.locator('[data-test="new-pipeline"]').isVisible())

    // Sweep 23: route count grew from 10 to 12 (added /inbox + /atlas).
    // Updated in place from === 10 with this comment so the cumulative
    // verify still passes after Sweep 23.
    const linkCount = await page.locator('aside nav a').count()
    expect('sidebar: 12 routes', linkCount === 12, `count: ${linkCount}`)

    // Recently Deleted still shows pipelines (and patterns)
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)
    const ok1 = await twoClickByTestId(page, 'pipeline-delete')
    expect('pipeline-delete (header) still works', ok1)
    await page.waitForTimeout(400)
    await openDockerTab(page, 'recently-deleted')
    const rdPipes = await page.locator('[data-test="recently-deleted-row"][data-record-kind="pipeline"]').count()
    expect('Recently Deleted shows pipelines', rdPipes >= 1, `count: ${rdPipes}`)

    // Quick Add can still create pipelines
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)
    const pipesBefore = await page.locator('[data-test="pipeline-item"]').count()

    await openDockerTab(page, 'quick-add')
    await page.locator('[data-test="quick-add-kind"]').selectOption('pipeline')
    const quickPipeName = `Quick pipeline ${Date.now()}`
    await page.locator('[data-test="quick-add-title"]').fill(quickPipeName)
    await page.click('[data-test="quick-add-create"]')
    await page.waitForTimeout(500)

    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)
    const pipesAfter = await page.locator('[data-test="pipeline-item"]').count()
    expect('quick-add: still creates pipelines visible in prompt studio',
      pipesAfter > pipesBefore, `before: ${pipesBefore}, after: ${pipesAfter}`)

    await ctx.close()
  }

  // ── Summary ─────────────────────────────────────────────────────────────
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
