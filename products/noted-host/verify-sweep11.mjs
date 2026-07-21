// Sweep 11 verification — Prompt Studio (pipelines + blocks).
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

  // ── Boot — clean across all 10 routes ────────────────────────────────────
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

  // ── Studio renders new content (not the stub) ─────────────────────────────
  console.log('\nStudio renders — not the stub')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    expect('route-stub-prompts present',
      await page.locator('[data-test="route-stub-prompts"]').isVisible())

    const h1Text = await page.locator('[data-test="route-stub-prompts"] h1').textContent().catch(() => '')
    expect('h1 reads "Prompt Studio"', h1Text.trim() === 'Prompt Studio', `got: "${h1Text.trim()}"`)

    expect('new-pipeline button visible',
      await page.locator('[data-test="new-pipeline"]').isVisible())

    // No pipelines seeded by default — empty state visible
    const emptyVisible = await page.locator('text=No pipelines yet.').isVisible().catch(() => false)
    expect('empty state visible on fresh boot', emptyVisible)

    // Confirm the old stub placeholder text is gone
    const bodyText = await page.locator('[data-test="route-stub-prompts"]').innerText().catch(() => '')
    expect('stub placeholder text gone',
      !bodyText.includes('ships in Sweep'), `text: "${bodyText.slice(0, 80)}"`)

    await ctx.close()
  }

  // ── Pipeline create + edit + persist ─────────────────────────────────────
  console.log('\nPipeline create + edit + persist')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    // Create
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)

    const itemCount = await page.locator('[data-test="pipeline-item"]').count()
    expect('pipeline appears in aside after + New', itemCount >= 1, `count: ${itemCount}`)

    const nameVal = await page.locator('[data-test="pipeline-name"]').inputValue().catch(() => '')
    expect('new pipeline name reads "Untitled"', nameVal === 'Untitled', `got: "${nameVal}"`)

    // Edit name + description
    const uniqueName = `Test Pipeline ${Date.now()}`
    const uniqueDesc = `Description ${Date.now()}`
    await page.locator('[data-test="pipeline-name"]').fill(uniqueName)
    await page.locator('[data-test="pipeline-description"]').fill(uniqueDesc)
    await page.waitForTimeout(700)

    // Navigate away and back
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    const nameAfter = await page.locator('[data-test="pipeline-name"]').inputValue().catch(() => '')
    expect('pipeline name persists after navigation', nameAfter === uniqueName, `got: "${nameAfter}"`)

    const descAfter = await page.locator('[data-test="pipeline-description"]').inputValue().catch(() => '')
    expect('pipeline description persists after navigation', descAfter === uniqueDesc, `got: "${descAfter}"`)

    // Raw IDB
    const allPipelines = await idbGetAll(page, 'promptPipelines')
    const stored = allPipelines.find((p) => p.name === uniqueName)
    expect('IDB promptPipelines row has typed name', !!stored, `rows: ${JSON.stringify(allPipelines.map(p=>p.name))}`)
    expect('IDB promptPipelines row has typed description',
      stored?.description === uniqueDesc, `got: "${stored?.description}"`)

    await ctx.close()
  }

  // ── Block CRUD + reorder ──────────────────────────────────────────────────
  console.log('\nBlock CRUD + reorder')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    // Create a pipeline
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)

    // Add first block
    await page.click('[data-test="new-block"]')
    await page.waitForTimeout(400)

    const blockCount = await page.locator('[data-test="block-row"]').count()
    expect('block row appears after + Add block', blockCount >= 1, `count: ${blockCount}`)

    // Default type is 'task'
    const typeVal = await page.locator('[data-test="block-type"]').first().inputValue().catch(() => '')
    expect('new block default type is "task"', typeVal === 'task', `got: "${typeVal}"`)

    // Fill label + body
    const labelText = `Label ${Date.now()}`
    const bodyText  = `Body content ${Date.now()}`
    await page.locator('[data-test="block-label"]').first().fill(labelText)
    await page.locator('[data-test="block-body"]').first().fill(bodyText)
    await page.waitForTimeout(700)

    // Navigate away and back
    await navByHash(page, '#/writing')
    await page.waitForTimeout(200)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    const labelAfter = await page.locator('[data-test="block-label"]').first().inputValue().catch(() => '')
    expect('block label persists', labelAfter === labelText, `got: "${labelAfter}"`)
    const bodyAfter = await page.locator('[data-test="block-body"]').first().inputValue().catch(() => '')
    expect('block body persists', bodyAfter === bodyText, `got: "${bodyAfter}"`)

    // Add second block and reorder
    await page.click('[data-test="new-block"]')
    await page.waitForTimeout(400)

    const blocksBeforeReorder = await idbGetAll(page, 'promptBlocks')
    expect('two blocks in IDB', blocksBeforeReorder.length >= 2, `count: ${blocksBeforeReorder.length}`)

    // Get second block's order before reorder
    const secondBlockEl  = await page.locator('[data-test="block-row"]').nth(1)
    const secondBlockId  = await secondBlockEl.getAttribute('data-block-id')
    const secondBefore   = blocksBeforeReorder.find((b) => b.id === secondBlockId)

    // Click block-up on second block
    await page.locator('[data-test="block-row"]').nth(1).locator('[data-test="block-up"]').click()
    await page.waitForTimeout(400)

    const blocksAfterReorder = await idbGetAll(page, 'promptBlocks')
    const secondAfter = blocksAfterReorder.find((b) => b.id === secondBlockId)
    expect('reorder: second block order decreased',
      secondAfter && secondBefore && secondAfter.order < secondBefore.order,
      `before: ${secondBefore?.order}, after: ${secondAfter?.order}`)

    // Change first block type to 'system'
    await page.locator('[data-test="block-type"]').first().selectOption('system')
    await page.waitForTimeout(400)

    const blocksAfterType = await idbGetAll(page, 'promptBlocks')
    // Find the block that is now first in sort order
    const sortedBlocks = [...blocksAfterType].sort((a, b) => a.order - b.order)
    // After reorder, the originally-second block is now first
    const firstBlock = sortedBlocks[0]
    expect('type select: IDB block type updated',
      firstBlock?.type === 'system', `got: "${firstBlock?.type}"`)

    await ctx.close()
  }

  // ── Soft-delete pipeline → appears in Recently Deleted ───────────────────
  console.log('\nSoft-delete pipeline → Recently Deleted')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    // Create a pipeline
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)
    const pipeName = `To Delete ${Date.now()}`
    await page.locator('[data-test="pipeline-name"]').fill(pipeName)
    await page.waitForTimeout(700)

    // Soft-delete via header button
    await twoClickByTestId(page, 'pipeline-delete')
    await page.waitForTimeout(500)

    // Pipeline should be gone from aside
    const remaining = await page.locator('[data-test="pipeline-item"]').count()
    // We don't know if there are other pipelines, so just check this name is gone
    const namedItems = await page.locator(`[data-test="pipeline-item"]:has-text("${pipeName}")`).count()
    expect('soft-deleted pipeline gone from aside list', namedItems === 0, `found: ${namedItems}`)

    // Open Docker → Recently Deleted
    await openDockerTab(page, 'recently-deleted')
    await page.waitForTimeout(300)

    const deletedRow = page.locator('[data-test="recently-deleted-row"][data-record-kind="pipeline"]')
    const deletedRowCount = await deletedRow.count()
    expect('deleted pipeline appears in Recently Deleted',
      deletedRowCount >= 1, `count: ${deletedRowCount}`)

    // Restore
    await page.locator('[data-test="recently-deleted-restore"]').first().click({ force: true })
    await page.waitForTimeout(400)

    // Navigate to prompts and verify it's back
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    const restoredCount = await page.locator(`[data-test="pipeline-item"]:has-text("${pipeName}")`).count()
    expect('restored pipeline reappears in studio aside',
      restoredCount >= 1, `count: ${restoredCount}`)

    await ctx.close()
  }

  // ── Block hard-delete ─────────────────────────────────────────────────────
  console.log('\nBlock hard-delete')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    // Create a pipeline with 2 blocks
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)
    await page.click('[data-test="new-block"]')
    await page.waitForTimeout(300)
    await page.click('[data-test="new-block"]')
    await page.waitForTimeout(400)

    const blocksBefore = await idbGetAll(page, 'promptBlocks')
    const countBefore  = blocksBefore.length
    expect('two blocks exist before delete', countBefore >= 2, `count: ${countBefore}`)

    // Get first block's id
    const firstBlockEl = page.locator('[data-test="block-row"]').first()
    const firstBlockId = await firstBlockEl.getAttribute('data-block-id')

    // Hard-delete first block via twoClickByTestId scoped to first block-row
    const firstBlockDelete = page.locator('[data-test="block-row"]').first().locator('[data-test="block-delete"]')
    await firstBlockDelete.click({ force: true })
    await page.waitForTimeout(500)
    await firstBlockDelete.click({ force: true })
    await page.waitForTimeout(500)

    // Block disappears from UI
    const uiCount = await page.locator('[data-test="block-row"]').count()
    expect('block row gone from UI after delete', uiCount < countBefore, `ui count: ${uiCount}`)

    // Hard-delete: IDB row is GONE
    const blocksAfter = await idbGetAll(page, 'promptBlocks')
    const stillExists = blocksAfter.find((b) => b.id === firstBlockId)
    expect('block hard-deleted: IDB row gone', !stillExists,
      `block ${firstBlockId} still in IDB`)

    await ctx.close()
  }

  // ── ProjectPicker round-trip ──────────────────────────────────────────────
  console.log('\nProjectPicker round-trip')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    // Create a pipeline
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)

    // ProjectPicker visible
    expect('project-picker visible',
      await page.locator('[data-test="project-picker"]').isVisible())

    // Click picker to open
    await page.click('[data-test="project-picker"]')
    await page.waitForTimeout(200)

    // Pick "Welcome" project (seeded)
    const welcomeOption = page.locator('[data-test="project-picker-option"]').filter({ hasText: 'Welcome' })
    const welcomeId = await welcomeOption.getAttribute('data-project-id')
    await welcomeOption.click()
    await page.waitForTimeout(600)

    // Picker shows welcome project id
    const pickerVal = await page.locator('[data-test="project-picker"]').getAttribute('data-current-project')
    expect('picker shows Welcome project id after select',
      pickerVal === welcomeId, `got: "${pickerVal}", want: "${welcomeId}"`)

    // Reload
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(400)

    // Picker still shows welcome id
    const pickerAfterReload = await page.locator('[data-test="project-picker"]').getAttribute('data-current-project')
    expect('picker persists Welcome id after reload',
      pickerAfterReload === welcomeId, `got: "${pickerAfterReload}"`)

    // IDB check
    const allPipelines = await idbGetAll(page, 'promptPipelines')
    const stored = allPipelines.find((p) => p.projectId === welcomeId)
    expect('IDB promptPipelines row has projectId matching Welcome',
      !!stored, `projectIds: ${JSON.stringify(allPipelines.map(p => p.projectId))}`)

    await ctx.close()
  }

  // ── Export — .txt ─────────────────────────────────────────────────────────
  console.log('\nExport — .txt')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    const pName  = `Export Test ${Date.now()}`
    const bBody1 = `Block one body ${Date.now()}`
    const bBody2 = `Block two body ${Date.now()}`

    // Create pipeline
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)
    await page.locator('[data-test="pipeline-name"]').fill(pName)

    // Add two blocks with known content
    await page.click('[data-test="new-block"]')
    await page.waitForTimeout(300)
    await page.locator('[data-test="block-body"]').nth(0).fill(bBody1)

    await page.click('[data-test="new-block"]')
    await page.waitForTimeout(300)
    await page.locator('[data-test="block-body"]').nth(1).fill(bBody2)

    await page.waitForTimeout(700)

    // Download .txt
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-test="pipeline-export-txt"]'),
    ])

    const dlPath = `./test-downloads/${download.suggestedFilename()}`
    await download.saveAs(dlPath)
    const content = readFileSync(dlPath, 'utf8')

    expect('txt export contains pipeline name',
      content.includes(pName), `name "${pName}" not found in export`)
    expect('txt export contains block 1 body',
      content.includes(bBody1), `body1 "${bBody1}" not found in export`)
    expect('txt export contains block 2 body',
      content.includes(bBody2), `body2 "${bBody2}" not found in export`)
    expect('txt export contains section dividers',
      content.includes('---'), 'no --- divider found')
    expect('txt export filename ends with .txt',
      download.suggestedFilename().endsWith('.txt'),
      `filename: ${download.suggestedFilename()}`)

    await ctx.close()
  }

  // ── Export — .json ────────────────────────────────────────────────────────
  console.log('\nExport — .json')
  {
    const { ctx, page } = await fresh(browser)
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)

    const pName = `JSON Export ${Date.now()}`

    // Create pipeline with 2 blocks
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)
    await page.locator('[data-test="pipeline-name"]').fill(pName)
    await page.click('[data-test="new-block"]')
    await page.waitForTimeout(300)
    await page.click('[data-test="new-block"]')
    await page.waitForTimeout(700)

    // Get pipeline id from the name input attribute
    const pipelineId = await page.locator('[data-test="pipeline-name"]').getAttribute('data-pipeline-id')

    // Download .json
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-test="pipeline-export-json"]'),
    ])

    const dlPath = `./test-downloads/${download.suggestedFilename()}`
    await download.saveAs(dlPath)
    const raw     = readFileSync(dlPath, 'utf8')
    let parsed
    try { parsed = JSON.parse(raw) } catch (e) { parsed = null }

    expect('json export is valid JSON', !!parsed, `parse error on: ${raw.slice(0, 200)}`)
    expect('json export schemaVersion === 2',
      parsed?.schemaVersion === 2, `got: ${parsed?.schemaVersion}`)
    expect('json export kind === "promptPipeline"',
      parsed?.kind === 'promptPipeline', `got: "${parsed?.kind}"`)
    expect('json export pipeline.id matches',
      parsed?.pipeline?.id === pipelineId, `got: "${parsed?.pipeline?.id}", want: "${pipelineId}"`)
    expect('json export has exportedAt',
      typeof parsed?.exportedAt === 'number', `got: ${parsed?.exportedAt}`)
    expect('json export blocks array length matches live count',
      Array.isArray(parsed?.blocks) && parsed.blocks.length === 2,
      `got: ${parsed?.blocks?.length}`)
    expect('json export blocks sorted by order asc', (() => {
      if (!Array.isArray(parsed?.blocks)) return false
      for (let i = 1; i < parsed.blocks.length; i++) {
        if (parsed.blocks[i].order < parsed.blocks[i - 1].order) return false
      }
      return true
    })())
    expect('json export filename ends with .pipeline.json',
      download.suggestedFilename().endsWith('.pipeline.json'),
      `filename: ${download.suggestedFilename()}`)

    await ctx.close()
  }

  // ── Regression — verify-sweep10 spot-checks ───────────────────────────────
  console.log('\nRegression — sweep-10 back-compat spot-checks')
  {
    const { ctx, page } = await fresh(browser)

    // Docker tabs render real content
    const slugs = ['scratchpad', 'clipboard', 'recently-deleted', 'recent-items', 'files', 'quick-add']
    await expandDocker(page)
    for (const slug of slugs) {
      await page.click(`[data-test="docker-tab"][data-docker-tab="${slug}"]`)
      await page.waitForTimeout(200)
      const panelText = await page.locator('[data-test="docker-panel"]').innerText().catch(() => '')
      expect(`${slug}: no "ships in Sweep" placeholder`,
        !panelText.includes('ships in Sweep'), `text: "${panelText.slice(0,60)}"`)
    }

    // Sweep 23: route count grew from 10 to 12 (added /inbox + /atlas).
    // Updated in place from === 10 with this comment so the cumulative
    // verify still passes after Sweep 23.
    const linkCount = await page.locator('aside nav a').count()
    expect('sidebar: 12 routes', linkCount === 12, `count: ${linkCount}`)

    // Canvas still renders
    await navByHash(page, '#/canvas')
    await page.waitForTimeout(300)
    expect('canvas: route-stub-canvas present',
      await page.locator('[data-test="route-stub-canvas"]').isVisible())
    const canvasH1 = await page.locator('[data-test="route-stub-canvas"] h1').textContent().catch(() => '')
    expect('canvas: h1 reads "Canvas"', canvasH1.trim() === 'Canvas', `got: "${canvasH1.trim()}"`)

    // Quick Add still creates pipelines
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)
    const pipesBefore = await page.locator('[data-test="pipeline-item"]').count()

    await openDockerTab(page, 'quick-add')
    await page.locator('[data-test="quick-add-kind"]').selectOption('pipeline')
    const quickPipeName = `Quick pipeline ${Date.now()}`
    await page.locator('[data-test="quick-add-title"]').fill(quickPipeName)
    await page.click('[data-test="quick-add-create"]')
    await page.waitForTimeout(500)

    // Navigate to prompts to see the pipeline
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)
    const pipesAfter = await page.locator('[data-test="pipeline-item"]').count()
    expect('quick-add: creates pipeline visible in studio aside',
      pipesAfter > pipesBefore, `before: ${pipesBefore}, after: ${pipesAfter}`)

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
