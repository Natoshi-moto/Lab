// Sweep 16 verification — Snapshots v2 (AppDesign / Prompts / Projects).
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

  // ─── Snapshots button mounts on the three NEW target studios ─────────────
  console.log('\n── Snapshots button mounts on new target studios ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // build
    const buildId = await createBuildAndGetId(page)
    const buildBtn = page.locator('[data-test="snapshots-button"][data-record-type="build"]')
    expect('build: snapshots-button count === 1', await buildBtn.count() === 1)
    expect('build: data-record-id matches', await buildBtn.getAttribute('data-record-id') === buildId)
    expect('build: initial count badge 0', await buildBtn.getAttribute('data-snapshot-count') === '0')

    // pipeline
    const pipelineId = await createPipelineAndGetId(page)
    const pipelineBtn = page.locator('[data-test="snapshots-button"][data-record-type="pipeline"]')
    expect('pipeline: snapshots-button count === 1', await pipelineBtn.count() === 1)
    expect('pipeline: data-record-id matches', await pipelineBtn.getAttribute('data-record-id') === pipelineId)
    expect('pipeline: initial count badge 0', await pipelineBtn.getAttribute('data-snapshot-count') === '0')

    // project
    const projectId = await createProjectAndGetId(page)
    const projectBtn = page.locator('[data-test="snapshots-button"][data-record-type="project"]')
    expect('project: snapshots-button count === 1', await projectBtn.count() === 1)
    expect('project: data-record-id matches', await projectBtn.getAttribute('data-record-id') === projectId)
    expect('project: initial count badge 0', await projectBtn.getAttribute('data-snapshot-count') === '0')

    expect('new studios: zero errors', errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Snapshots button STILL mounted on original three (regression) ────────
  console.log('\n── Snapshots regression: original three studios ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await createDocAndGetId(page)
    expect('doc: snapshots-button still mounts',
      await page.locator('[data-test="snapshots-button"][data-record-type="document"]').count() === 1)

    await createPoemAndGetId(page)
    expect('poem: snapshots-button still mounts',
      await page.locator('[data-test="snapshots-button"][data-record-type="poem"]').count() === 1)

    await createLongformAndGetId(page)
    expect('longform: snapshots-button still mounts',
      await page.locator('[data-test="snapshots-button"][data-record-type="longform"]').count() === 1)

    expect('regression original: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Snapshots button NOT mounted in remaining studios ────────────────────
  console.log('\n── Snapshots button NOT in remaining studios ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // library
    await navByHash(page, '#/library')
    await page.waitForTimeout(150)
    const newPatternBtn = page.locator('[data-test="new-pattern"]')
    if (await newPatternBtn.count() > 0) {
      await newPatternBtn.click()
      await page.waitForTimeout(400)
    }
    expect('library: no snapshots-button',
      await page.locator('[data-test="snapshots-button"]').count() === 0)

    // canvas
    await navByHash(page, '#/canvas')
    await page.waitForTimeout(200)
    expect('canvas: no snapshots-button',
      await page.locator('[data-test="snapshots-button"]').count() === 0)

    // shelf
    await navByHash(page, '#/shelf')
    await page.waitForTimeout(200)
    expect('shelf: no snapshots-button',
      await page.locator('[data-test="snapshots-button"]').count() === 0)

    // settings
    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)
    expect('settings: no snapshots-button',
      await page.locator('[data-test="snapshots-button"]').count() === 0)

    expect('non-target studios: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Capture flow on a build ──────────────────────────────────────────────
  console.log('\n── Capture flow: build ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const buildId = await createBuildAndGetId(page)

    // Fill fields and wait for autosave
    await page.fill('[data-test="build-name"]', 'SnapBuildName')
    await page.fill('[data-test="build-description"]', 'SnapBuildDesc')
    await page.fill('[data-test="build-platform"]', 'SnapBuildPlatform')
    await page.waitForTimeout(700)

    // Open popover
    await page.click('[data-test="snapshots-button"][data-record-type="build"]')
    await page.waitForTimeout(150)
    expect('build capture: snapshots-menu visible',
      await page.locator('[data-test="snapshots-menu"]').count() === 1)
    expect('build capture: empty state visible',
      await page.locator('[data-test="snapshots-empty"]').count() === 1)

    // Take snapshot
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)

    const snapshotRows = page.locator('[data-test="snapshot-row"]')
    expect('build capture: one snapshot row', await snapshotRows.count() === 1)
    const countBadge = await page.locator('[data-test="snapshots-button"][data-record-type="build"]')
      .getAttribute('data-snapshot-count')
    expect('build capture: count badge === 1', countBadge === '1')

    // IDB assertion
    const snapshots = await idbGetAll(page, 'snapshots')
    const buildSnap = snapshots.find((s) => s.recordId === buildId && s.recordType === 'build')
    expect('build capture: IDB snapshot exists', buildSnap !== undefined)
    if (buildSnap) {
      const data = JSON.parse(buildSnap.data)
      expect('build capture: IDB name matches', data.name === 'SnapBuildName')
      expect('build capture: IDB description matches', data.description === 'SnapBuildDesc')
      expect('build capture: IDB platform matches', data.platform === 'SnapBuildPlatform')
    }

    expect('build capture: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Capture flow on a pipeline ───────────────────────────────────────────
  console.log('\n── Capture flow: pipeline ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const pipelineId = await createPipelineAndGetId(page)

    // Fill fields and wait for autosave
    await page.fill('[data-test="pipeline-name"]', 'SnapPipelineName')
    await page.fill('[data-test="pipeline-description"]', 'SnapPipelineDesc')
    await page.waitForTimeout(700)

    // Open popover
    await page.click('[data-test="snapshots-button"][data-record-type="pipeline"]')
    await page.waitForTimeout(150)
    expect('pipeline capture: snapshots-menu visible',
      await page.locator('[data-test="snapshots-menu"]').count() === 1)

    // Take snapshot
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)

    expect('pipeline capture: one snapshot row',
      await page.locator('[data-test="snapshot-row"]').count() === 1)
    const countBadge = await page.locator('[data-test="snapshots-button"][data-record-type="pipeline"]')
      .getAttribute('data-snapshot-count')
    expect('pipeline capture: count badge === 1', countBadge === '1')

    // IDB assertion — captures saved values
    const snapshots = await idbGetAll(page, 'snapshots')
    const pipeSnap = snapshots.find((s) => s.recordId === pipelineId && s.recordType === 'pipeline')
    expect('pipeline capture: IDB snapshot exists', pipeSnap !== undefined)
    if (pipeSnap) {
      const data = JSON.parse(pipeSnap.data)
      expect('pipeline capture: IDB has name', typeof data.name === 'string')
      expect('pipeline capture: IDB has description', typeof data.description === 'string')
    }

    expect('pipeline capture: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Capture flow on a project ────────────────────────────────────────────
  console.log('\n── Capture flow: project ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const projectId = await createProjectAndGetId(page)

    // Fill fields and wait for autosave
    await page.fill('[data-test="project-name"]', 'SnapProjectName')
    await page.fill('[data-test="project-description"]', 'SnapProjectDesc')
    await page.waitForTimeout(700)

    // Open popover
    await page.click('[data-test="snapshots-button"][data-record-type="project"]')
    await page.waitForTimeout(150)
    expect('project capture: snapshots-menu visible',
      await page.locator('[data-test="snapshots-menu"]').count() === 1)

    // Take snapshot
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)

    expect('project capture: one snapshot row',
      await page.locator('[data-test="snapshot-row"]').count() === 1)
    const countBadge = await page.locator('[data-test="snapshots-button"][data-record-type="project"]')
      .getAttribute('data-snapshot-count')
    expect('project capture: count badge === 1', countBadge === '1')

    const snapshots = await idbGetAll(page, 'snapshots')
    const projSnap = snapshots.find((s) => s.recordId === projectId && s.recordType === 'project')
    expect('project capture: IDB snapshot exists', projSnap !== undefined)
    if (projSnap) {
      const data = JSON.parse(projSnap.data)
      expect('project capture: IDB name matches', data.name === 'SnapProjectName')
      expect('project capture: IDB description matches', data.description === 'SnapProjectDesc')
    }

    expect('project capture: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Restore flow on a build (autosave-clobber regression) ───────────────
  console.log('\n── Restore flow: build (autosave-clobber check) ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await createBuildAndGetId(page)

    // Set original values and wait for autosave
    await page.fill('[data-test="build-name"]', 'OriginalBuildName')
    await page.fill('[data-test="build-description"]', 'OriginalBuildDesc')
    await page.fill('[data-test="build-platform"]', 'OriginalBuildPlatform')
    await page.waitForTimeout(700)

    // Take snapshot
    await page.click('[data-test="snapshots-button"][data-record-type="build"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)

    // Close popover with Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // Change all three fields and wait for autosave
    await page.fill('[data-test="build-name"]', 'ModifiedBuildName')
    await page.fill('[data-test="build-description"]', 'ModifiedBuildDesc')
    await page.fill('[data-test="build-platform"]', 'ModifiedBuildPlatform')
    await page.waitForTimeout(700)

    // Restore
    await page.click('[data-test="snapshots-button"][data-record-type="build"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-restore"]')

    // Wait 800ms — must exceed the 400ms autosave delay to catch clobber regressions
    await page.waitForTimeout(800)

    const nameVal = await page.locator('[data-test="build-name"]').inputValue()
    const descVal = await page.locator('[data-test="build-description"]').inputValue()
    const platVal = await page.locator('[data-test="build-platform"]').inputValue()
    expect('build restore: name reverted', nameVal === 'OriginalBuildName', `got "${nameVal}"`)
    expect('build restore: description reverted', descVal === 'OriginalBuildDesc', `got "${descVal}"`)
    expect('build restore: platform reverted', platVal === 'OriginalBuildPlatform', `got "${platVal}"`)

    // IDB check
    const builds = await idbGetAll(page, 'appDesignBuilds')
    const build = builds[builds.length - 1]
    expect('build restore: IDB name matches', build?.name === 'OriginalBuildName', `got "${build?.name}"`)
    expect('build restore: IDB description matches', build?.description === 'OriginalBuildDesc', `got "${build?.description}"`)
    expect('build restore: IDB platform matches', build?.platform === 'OriginalBuildPlatform', `got "${build?.platform}"`)

    expect('build restore: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Restore flow on a pipeline ───────────────────────────────────────────
  console.log('\n── Restore flow: pipeline (autosave-clobber check) ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await createPipelineAndGetId(page)

    // Set original values and wait for autosave
    await page.fill('[data-test="pipeline-name"]', 'OriginalPipelineName')
    await page.fill('[data-test="pipeline-description"]', 'OriginalPipelineDesc')
    await page.waitForTimeout(700)

    // Take snapshot
    await page.click('[data-test="snapshots-button"][data-record-type="pipeline"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // Modify and wait for autosave
    await page.fill('[data-test="pipeline-name"]', 'ModifiedPipelineName')
    await page.fill('[data-test="pipeline-description"]', 'ModifiedPipelineDesc')
    await page.waitForTimeout(700)

    // Restore
    await page.click('[data-test="snapshots-button"][data-record-type="pipeline"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-restore"]')
    await page.waitForTimeout(800)

    const nameVal = await page.locator('[data-test="pipeline-name"]').inputValue()
    expect('pipeline restore: name reverted', nameVal === 'OriginalPipelineName', `got "${nameVal}"`)

    const pipelines = await idbGetAll(page, 'promptPipelines')
    const pipeline = pipelines[pipelines.length - 1]
    expect('pipeline restore: IDB name matches', pipeline?.name === 'OriginalPipelineName', `got "${pipeline?.name}"`)
    expect('pipeline restore: IDB description matches', pipeline?.description === 'OriginalPipelineDesc', `got "${pipeline?.description}"`)

    expect('pipeline restore: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Restore flow on a project ────────────────────────────────────────────
  console.log('\n── Restore flow: project (autosave-clobber check) ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await createProjectAndGetId(page)

    // Set original values and wait for autosave
    await page.fill('[data-test="project-name"]', 'OriginalProjectName')
    await page.fill('[data-test="project-description"]', 'OriginalProjectDesc')
    await page.waitForTimeout(700)

    // Take snapshot
    await page.click('[data-test="snapshots-button"][data-record-type="project"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // Modify and wait for autosave
    await page.fill('[data-test="project-name"]', 'ModifiedProjectName')
    await page.fill('[data-test="project-description"]', 'ModifiedProjectDesc')
    await page.waitForTimeout(700)

    // Restore
    await page.click('[data-test="snapshots-button"][data-record-type="project"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-restore"]')
    await page.waitForTimeout(800)

    const nameVal = await page.locator('[data-test="project-name"]').inputValue()
    const descVal = await page.locator('[data-test="project-description"]').inputValue()
    expect('project restore: name reverted', nameVal === 'OriginalProjectName', `got "${nameVal}"`)
    expect('project restore: description reverted', descVal === 'OriginalProjectDesc', `got "${descVal}"`)

    const projects = await idbGetAll(page, 'projects')
    const project = projects[projects.length - 1]
    expect('project restore: IDB name matches', project?.name === 'OriginalProjectName', `got "${project?.name}"`)
    expect('project restore: IDB description matches', project?.description === 'OriginalProjectDesc', `got "${project?.description}"`)

    expect('project restore: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ─── Snapshots scoped per-record (cross-type) ─────────────────────────────
  console.log('\n── Snapshots scoped per-record (cross-type) ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Create and snapshot a build
    await createBuildAndGetId(page)
    await page.waitForTimeout(300)
    await page.click('[data-test="snapshots-button"][data-record-type="build"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // Create and snapshot a pipeline
    await createPipelineAndGetId(page)
    await page.waitForTimeout(300)
    await page.click('[data-test="snapshots-button"][data-record-type="pipeline"]')
    await page.waitForTimeout(150)
    await page.click('[data-test="snapshot-take"]')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // Navigate back to app-design and verify build only sees its own snapshot
    await navByHash(page, '#/app-design')
    await page.waitForTimeout(300)
    const buildBtn = page.locator('[data-test="snapshots-button"][data-record-type="build"]')
    expect('scoping: build count badge === 1',
      await buildBtn.getAttribute('data-snapshot-count') === '1')
    await buildBtn.click()
    await page.waitForTimeout(150)
    expect('scoping: build popover shows 1 row',
      await page.locator('[data-test="snapshot-row"]').count() === 1)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    // Navigate to prompts and verify pipeline only sees its own snapshot
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(300)
    const pipeBtn = page.locator('[data-test="snapshots-button"][data-record-type="pipeline"]')
    expect('scoping: pipeline count badge === 1',
      await pipeBtn.getAttribute('data-snapshot-count') === '1')
    await pipeBtn.click()
    await page.waitForTimeout(150)
    expect('scoping: pipeline popover shows 1 row',
      await page.locator('[data-test="snapshot-row"]').count() === 1)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    expect('scoping: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
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
