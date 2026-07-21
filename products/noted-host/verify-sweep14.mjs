// Sweep 14 verification — TagsBar extended to AppDesign / Prompts / Projects.
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

// Text-based two-click confirm for InlineConfirmButtons without a data-test
// prop. Carried forward from Sweep 13 even though Sweep 14 doesn't need it
// directly — keeps the chassis uniform if future sweeps reach for it.
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

// ─────────────────────────────────────────────────────────────────────────────
// Sweep-14 helpers: create-and-select a fresh record in each new studio, then
// return the TagsBar's data-record-id (which the component itself emits, so
// no studio-specific selector gymnastics).

async function createBuildAndGetId(page) {
  await navByHash(page, '#/app-design')
  await page.waitForTimeout(150)
  await page.click('[data-test="new-build"]')
  await page.waitForTimeout(400)
  const tagsBar = page.locator('[data-test="tags-bar"][data-record-type="build"]')
  return await tagsBar.getAttribute('data-record-id')
}

async function createPipelineAndGetId(page) {
  await navByHash(page, '#/prompts')
  await page.waitForTimeout(150)
  await page.click('[data-test="new-pipeline"]')
  await page.waitForTimeout(400)
  const tagsBar = page.locator('[data-test="tags-bar"][data-record-type="pipeline"]')
  return await tagsBar.getAttribute('data-record-id')
}

async function createProjectAndGetId(page) {
  await navByHash(page, '#/projects')
  await page.waitForTimeout(150)
  // The button's data-test is "new-project-button" in the source.
  await page.click('[data-test="new-project-button"]')
  await page.waitForTimeout(400)
  const tagsBar = page.locator('[data-test="tags-bar"][data-record-type="project"]')
  return await tagsBar.getAttribute('data-record-id')
}

async function createDocAndGetId(page) {
  await navByHash(page, '#/writing')
  await page.waitForTimeout(150)
  await page.click('[data-test="new-doc"]')
  await page.waitForTimeout(400)
  return await page.locator('[data-test="doc-title"]').getAttribute('data-doc-id')
}

async function run() {
  rmSync('./test-downloads', { recursive: true, force: true })
  mkdirSync('./test-downloads', { recursive: true })

  const browser = await chromium.launch(launchOpts)

  // ── Boot — clean across all 10 routes ────────────────────────────────────
  console.log('\nBoot — no console errors across every route')
  {
    const { ctx, page, errors } = await fresh(browser)
    for (const hash of ROUTES) {
      await navByHash(page, hash)
      await page.waitForTimeout(150)
    }
    expect('boot: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    expect('boot: zero page errors', errors.pageError.length === 0,
      JSON.stringify(errors.pageError))
    await ctx.close()
  }

  // ── TagsBar mounts on the three NEW studios ──────────────────────────────
  console.log('\nTagsBar mounts on AppDesign, Prompts, Projects')
  {
    const { ctx, page, errors } = await fresh(browser)

    // App-Design build
    const buildId = await createBuildAndGetId(page)
    const tagsBarB = page.locator('[data-test="tags-bar"][data-record-type="build"]')
    expect('app-design: tags-bar visible exactly once', await tagsBarB.count() === 1,
      `count: ${await tagsBarB.count()}`)
    expect('app-design: tags-bar record-id non-empty', !!buildId, `got: ${buildId}`)
    // Cross-check vs IDB: only one build exists (none seeded), so its id matches.
    const builds = await idbGetAll(page, 'appDesignBuilds')
    expect('app-design: tags-bar record-id matches IDB build',
      builds.length === 1 && builds[0].id === buildId,
      `idb: ${JSON.stringify(builds.map((b) => b.id))} vs bar: ${buildId}`)

    // Prompt pipeline
    const pipelineId = await createPipelineAndGetId(page)
    const tagsBarPipe = page.locator('[data-test="tags-bar"][data-record-type="pipeline"]')
    expect('prompts: tags-bar visible exactly once', await tagsBarPipe.count() === 1,
      `count: ${await tagsBarPipe.count()}`)
    expect('prompts: tags-bar record-id non-empty', !!pipelineId, `got: ${pipelineId}`)
    const pipelines = await idbGetAll(page, 'promptPipelines')
    expect('prompts: tags-bar record-id matches IDB pipeline',
      pipelines.length === 1 && pipelines[0].id === pipelineId,
      `idb: ${JSON.stringify(pipelines.map((p) => p.id))} vs bar: ${pipelineId}`)

    // Universal project
    const projectId = await createProjectAndGetId(page)
    const tagsBarProj = page.locator('[data-test="tags-bar"][data-record-type="project"]')
    expect('projects: tags-bar visible exactly once', await tagsBarProj.count() === 1,
      `count: ${await tagsBarProj.count()}`)
    expect('projects: tags-bar record-id non-empty', !!projectId, `got: ${projectId}`)
    const projects = await idbGetAll(page, 'projects')
    // Two projects now: the seeded "Welcome" + the freshly created one.
    const matchProj = projects.find((p) => p.id === projectId)
    expect('projects: tags-bar record-id is one of the IDB project rows',
      !!matchProj, `idb ids: ${projects.map((p) => p.id).join(',')}`)

    expect('new-mounts: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    expect('new-mounts: zero page errors', errors.pageError.length === 0,
      JSON.stringify(errors.pageError))
    await ctx.close()
  }

  // ── TagsBar still mounted in original three studios ──────────────────────
  console.log('\nTagsBar still mounted in Writing, Poetry, Longform (Sweep 13 regression)')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/writing')
    await page.waitForTimeout(150)
    await page.click('[data-test="doc-item"]')
    await page.waitForTimeout(200)
    expect('writing: tags-bar count === 1',
      await page.locator('[data-test="tags-bar"][data-record-type="document"]').count() === 1)

    await navByHash(page, '#/poetry')
    await page.waitForTimeout(150)
    await page.click('[data-test="poem-item"]')
    await page.waitForTimeout(200)
    expect('poetry: tags-bar count === 1',
      await page.locator('[data-test="tags-bar"][data-record-type="poem"]').count() === 1)

    await navByHash(page, '#/longform')
    await page.waitForTimeout(150)
    await page.click('[data-test="longform-pill"]')
    await page.waitForTimeout(200)
    expect('longform: tags-bar count === 1',
      await page.locator('[data-test="tags-bar"][data-record-type="longform"]').count() === 1)

    expect('regression-mounts: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── TagsBar NOT mounted in Library / Canvas / Shelf / Settings ───────────
  console.log('\nTagsBar NOT mounted in Library/Canvas/Shelf/Settings')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Library — create a pattern first, then verify zero TagsBars
    await navByHash(page, '#/library')
    await page.waitForTimeout(150)
    const newPat = page.locator('[data-test="new-pattern"]')
    if (await newPat.count() > 0) {
      await newPat.click()
      await page.waitForTimeout(300)
    }
    // library: no tags-bar — RETIRED in Sweep 18.
    // Library now mounts TagsBar (data-record-type="pattern") when a pattern
    // is selected. Positive coverage is in verify-sweep18.mjs:
    //   "TagsBar present in Library with pattern selected".

    for (const [hash, label] of [
      ['#/canvas', 'canvas'],
      ['#/shelf', 'shelf'],
      ['#/settings', 'settings'],
    ]) {
      await navByHash(page, hash)
      await page.waitForTimeout(150)
      expect(`${label}: no tags-bar`,
        await page.locator('[data-test="tags-bar"]').count() === 0)
    }

    expect('non-target-studios: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── Round-trip on a build ────────────────────────────────────────────────
  console.log('\nRound-trip: create build, attach tag "arch", reload, chip persists')
  {
    const { ctx, page, errors } = await fresh(browser)
    const buildId = await createBuildAndGetId(page)

    await page.fill('[data-test="tags-bar-input"]', 'arch')
    await page.waitForTimeout(100)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)

    const chip = page.locator('[data-test="tags-bar-chip"][data-tag-name="arch"]')
    expect('build round-trip: arch chip visible', await chip.count() === 1,
      `chip count: ${await chip.count()}`)

    // IDB: tag + tagLink
    const tags = await idbGetAll(page, 'tags')
    const archTag = tags.find((t) => t.name === 'arch')
    expect('build round-trip: arch Tag row in IDB', !!archTag,
      `tags: ${tags.map((t) => t.name).join(',')}`)
    const tagLinks = await idbGetAll(page, 'tagLinks')
    const link = tagLinks.find((tl) =>
      tl.targetId === buildId && tl.targetType === 'build' && archTag && tl.tagId === archTag.id
    )
    expect('build round-trip: TagLink row with targetType "build" in IDB', !!link,
      `links: ${JSON.stringify(tagLinks)}`)

    // Reload — BuildSwitcher persists selection via localStorage; the same
    // build should auto-select.
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    await navByHash(page, '#/app-design')
    await page.waitForTimeout(400)

    const chipAfter = page.locator('[data-test="tags-bar-chip"][data-tag-name="arch"]')
    expect('build round-trip: arch chip persists after reload',
      await chipAfter.count() === 1, `chip count: ${await chipAfter.count()}`)
    const reloadedBarId = await page.locator('[data-test="tags-bar"][data-record-type="build"]')
      .getAttribute('data-record-id')
    expect('build round-trip: same build re-selected after reload',
      reloadedBarId === buildId, `expected ${buildId} got ${reloadedBarId}`)

    expect('build-roundtrip: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── Round-trip on a pipeline ─────────────────────────────────────────────
  console.log('\nRound-trip: create pipeline, attach unique tag, reload, chip persists')
  {
    const { ctx, page, errors } = await fresh(browser)
    const pipelineId = await createPipelineAndGetId(page)

    const tagName = `pipe-${Date.now()}`
    await page.fill('[data-test="tags-bar-input"]', tagName)
    await page.waitForTimeout(100)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)

    const chip = page.locator(`[data-test="tags-bar-chip"][data-tag-name="${tagName}"]`)
    expect('pipeline round-trip: chip visible', await chip.count() === 1,
      `chip count: ${await chip.count()}`)

    const tags = await idbGetAll(page, 'tags')
    const tag = tags.find((t) => t.name === tagName)
    expect('pipeline round-trip: Tag row in IDB', !!tag,
      `tags: ${tags.map((t) => t.name).join(',')}`)
    const tagLinks = await idbGetAll(page, 'tagLinks')
    const link = tagLinks.find((tl) =>
      tl.targetId === pipelineId && tl.targetType === 'pipeline' && tag && tl.tagId === tag.id
    )
    expect('pipeline round-trip: TagLink with targetType "pipeline" in IDB', !!link,
      `links: ${JSON.stringify(tagLinks)}`)

    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(400)

    const chipAfter = page.locator(`[data-test="tags-bar-chip"][data-tag-name="${tagName}"]`)
    expect('pipeline round-trip: chip persists after reload',
      await chipAfter.count() === 1, `chip count: ${await chipAfter.count()}`)
    const reloadedBarId = await page.locator('[data-test="tags-bar"][data-record-type="pipeline"]')
      .getAttribute('data-record-id')
    expect('pipeline round-trip: same pipeline re-selected after reload',
      reloadedBarId === pipelineId, `expected ${pipelineId} got ${reloadedBarId}`)

    expect('pipeline-roundtrip: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── Round-trip on a project ──────────────────────────────────────────────
  console.log('\nRound-trip: create project, attach unique tag, reload, chip persists')
  {
    const { ctx, page, errors } = await fresh(browser)
    const projectId = await createProjectAndGetId(page)

    const tagName = `proj-${Date.now()}`
    await page.fill('[data-test="tags-bar-input"]', tagName)
    await page.waitForTimeout(100)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)

    const chip = page.locator(`[data-test="tags-bar-chip"][data-tag-name="${tagName}"]`)
    expect('project round-trip: chip visible', await chip.count() === 1,
      `chip count: ${await chip.count()}`)

    const tags = await idbGetAll(page, 'tags')
    const tag = tags.find((t) => t.name === tagName)
    expect('project round-trip: Tag row in IDB', !!tag,
      `tags: ${tags.map((t) => t.name).join(',')}`)
    const tagLinks = await idbGetAll(page, 'tagLinks')
    const link = tagLinks.find((tl) =>
      tl.targetId === projectId && tl.targetType === 'project' && tag && tl.tagId === tag.id
    )
    expect('project round-trip: TagLink with targetType "project" in IDB', !!link,
      `links: ${JSON.stringify(tagLinks)}`)

    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    await navByHash(page, '#/projects')
    await page.waitForTimeout(400)

    const chipAfter = page.locator(`[data-test="tags-bar-chip"][data-tag-name="${tagName}"]`)
    expect('project round-trip: chip persists after reload',
      await chipAfter.count() === 1, `chip count: ${await chipAfter.count()}`)
    const reloadedBarId = await page.locator('[data-test="tags-bar"][data-record-type="project"]')
      .getAttribute('data-record-id')
    expect('project round-trip: same project re-selected after reload',
      reloadedBarId === projectId, `expected ${projectId} got ${reloadedBarId}`)

    expect('project-roundtrip: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── Cross-studio reuse: ONE Tag, THREE TagLinks of different targetType ──
  console.log('\nCross-studio reuse: one tag attached to document + build + project')
  {
    const { ctx, page, errors } = await fresh(browser)
    const tagName = `cross-${Date.now()}`

    // 1. Document
    const docId = await createDocAndGetId(page)
    await page.fill('[data-test="tags-bar-input"]', tagName)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    expect('cross: chip on document',
      await page.locator(`[data-test="tags-bar-chip"][data-tag-name="${tagName}"]`).count() === 1)

    // 2. Build
    const buildId = await createBuildAndGetId(page)
    // Type the existing tag name; the dropdown should offer it as a suggestion.
    await page.fill('[data-test="tags-bar-input"]', tagName)
    await page.waitForTimeout(150)
    // Press Enter — exact-match path attaches without creating a new Tag.
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    expect('cross: chip on build',
      await page.locator(`[data-test="tags-bar-chip"][data-tag-name="${tagName}"]`).count() === 1)

    // 3. Project
    const projectId = await createProjectAndGetId(page)
    await page.fill('[data-test="tags-bar-input"]', tagName)
    await page.waitForTimeout(150)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    expect('cross: chip on project',
      await page.locator(`[data-test="tags-bar-chip"][data-tag-name="${tagName}"]`).count() === 1)

    // IDB assertions: the relational invariant.
    const tags = await idbGetAll(page, 'tags')
    const matching = tags.filter((t) => t.name === tagName)
    expect('cross: exactly ONE Tag row with this name', matching.length === 1,
      `matched: ${matching.length} (names: ${tags.map((t) => t.name).join(',')})`)

    const tagId = matching[0]?.id
    const tagLinks = await idbGetAll(page, 'tagLinks')
    const linksForTag = tagLinks.filter((tl) => tl.tagId === tagId)
    expect('cross: exactly THREE TagLink rows for this tag',
      linksForTag.length === 3,
      `count: ${linksForTag.length} — links: ${JSON.stringify(linksForTag)}`)

    const targetTypes = new Set(linksForTag.map((tl) => tl.targetType))
    expect('cross: TagLinks span document, build, project',
      targetTypes.has('document') && targetTypes.has('build') && targetTypes.has('project'),
      `targetTypes: ${[...targetTypes].join(',')}`)

    // Each link should also reference the right id.
    expect('cross: document link targets the right doc',
      linksForTag.some((tl) => tl.targetType === 'document' && tl.targetId === docId))
    expect('cross: build link targets the right build',
      linksForTag.some((tl) => tl.targetType === 'build' && tl.targetId === buildId))
    expect('cross: project link targets the right project',
      linksForTag.some((tl) => tl.targetType === 'project' && tl.targetId === projectId))

    expect('cross-studio-reuse: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── Backspace on empty input removes last tag (in PIPELINE studio) ───────
  console.log('\nBackspace on empty input removes last tag — pipeline studio')
  {
    const { ctx, page, errors } = await fresh(browser)
    const pipelineId = await createPipelineAndGetId(page)

    // Attach two tags so backspace has something distinct to remove.
    await page.fill('[data-test="tags-bar-input"]', 'first')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    await page.fill('[data-test="tags-bar-input"]', 'second')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    const chipsBefore = await page.locator('[data-test="tags-bar-chip"]').count()
    expect('pipeline backspace: baseline chip count === 2', chipsBefore === 2,
      `count: ${chipsBefore}`)

    const linksBefore = (await idbGetAll(page, 'tagLinks'))
      .filter((tl) => tl.targetId === pipelineId && tl.targetType === 'pipeline')
    expect('pipeline backspace: baseline tagLinks for pipeline === 2',
      linksBefore.length === 2, `count: ${linksBefore.length}`)

    // Empty input + Backspace → last attached link removed.
    const input = page.locator('[data-test="tags-bar-input"]')
    await input.click()
    await input.fill('')
    await page.waitForTimeout(50)
    await page.keyboard.press('Backspace')
    await page.waitForTimeout(400)

    const chipsAfter = await page.locator('[data-test="tags-bar-chip"]').count()
    expect('pipeline backspace: one fewer chip', chipsAfter === 1,
      `before ${chipsBefore} after ${chipsAfter}`)

    const linksAfter = (await idbGetAll(page, 'tagLinks'))
      .filter((tl) => tl.targetId === pipelineId && tl.targetType === 'pipeline')
    expect('pipeline backspace: one fewer tagLink in IDB',
      linksAfter.length === 1, `count: ${linksAfter.length}`)

    expect('pipeline-backspace: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── Chip × in a NEW studio (project) ─────────────────────────────────────
  console.log('\nChip × on a fresh project removes only that chip')
  {
    const { ctx, page, errors } = await fresh(browser)
    const projectId = await createProjectAndGetId(page)

    await page.fill('[data-test="tags-bar-input"]', 'alpha')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    await page.fill('[data-test="tags-bar-input"]', 'beta')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    const alphaChip = page.locator('[data-test="tags-bar-chip"][data-tag-name="alpha"]')
    const betaChip  = page.locator('[data-test="tags-bar-chip"][data-tag-name="beta"]')
    expect('project chip-x setup: alpha chip present', await alphaChip.count() === 1)
    expect('project chip-x setup: beta chip present',  await betaChip.count() === 1)

    const alphaTagId = await alphaChip.getAttribute('data-tag-id')
    await alphaChip.locator('[data-test="tags-bar-chip-remove"]').click()
    await page.waitForTimeout(400)

    expect('project chip-x: alpha chip gone',  await alphaChip.count() === 0)
    expect('project chip-x: beta chip remains', await betaChip.count() === 1)

    const tagLinks = await idbGetAll(page, 'tagLinks')
    const alphaLink = tagLinks.find((tl) =>
      tl.tagId === alphaTagId && tl.targetId === projectId && tl.targetType === 'project'
    )
    const betaForProject = tagLinks.filter((tl) =>
      tl.targetId === projectId && tl.targetType === 'project' && tl.tagId !== alphaTagId
    )
    expect('project chip-x: alpha tagLink removed from IDB', !alphaLink,
      `still found: ${JSON.stringify(alphaLink)}`)
    expect('project chip-x: beta tagLink remains in IDB',
      betaForProject.length === 1, `count: ${betaForProject.length}`)

    expect('project-chip-x: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── Regression: sidebar still has 10 routes ──────────────────────────────
  console.log('\nRegression: sidebar still exposes 12 routes')
  {
    const { ctx, page, errors } = await fresh(browser)
    // Sweep 23: route count grew from 10 to 12 (added /inbox + /atlas).
    // Updated in place from === 10 with this comment so the cumulative
    // verify still passes after Sweep 23.
    const links = await page.locator('aside a').count()
    expect('regression: sidebar has 12 links', links === 12, `count: ${links}`)
    expect('sidebar-regression: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── Regression: Library Pattern Markdown export still works ──────────────
  console.log('\nRegression: Library Pattern .md export (Library untouched)')
  {
    const { ctx, page, errors } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(150)
    const newPat = page.locator('[data-test="new-pattern"]')
    if (await newPat.count() > 0) {
      await newPat.click()
      await page.waitForTimeout(300)
    }
    // Add a denormalized pattern tag chip via the Library's own input.
    // Sweep 18: pattern-tag-input removed; use tags-bar-input instead.
    const tagInput = page.locator('[data-test="tags-bar-input"]')
    if (await tagInput.count() > 0) {
      await tagInput.fill('reg14')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(200)
    }
    const exportBtn = page.locator('[data-test="pattern-export-md"]')
    if (await exportBtn.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 3000 }).catch(() => null),
        exportBtn.click()
      ])
      if (download) {
        const path = await download.path()
        if (path) {
          const { readFileSync } = await import('fs')
          const content = readFileSync(path, 'utf8')
          expect('regression: pattern export starts with ---', content.startsWith('---'),
            `head: ${content.slice(0, 30)}`)
          expect('regression: pattern export contains tags: [',
            content.includes('tags: ['), `head: ${content.slice(0, 200)}`)
        } else {
          ok('regression: pattern export download triggered (path not readable)')
        }
      } else {
        bad('regression: pattern export download did not fire',
          'no download event captured')
      }
    } else {
      bad('regression: pattern-export-md button missing', 'selector not found')
    }

    // regression: library still has zero tags-bar elements — RETIRED in Sweep 18.
    // Library now mounts TagsBar (data-record-type="pattern") when a pattern
    // is selected. Positive coverage is in verify-sweep18.mjs.

    expect('library-regression: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    await ctx.close()
  }

  // ── No errors during the entire run ──────────────────────────────────────
  console.log('\nFinal whole-run error check (separate fresh page)')
  {
    const { ctx, page, errors } = await fresh(browser)
    for (const hash of ROUTES) {
      await navByHash(page, hash)
      await page.waitForTimeout(120)
    }
    // Touch each new mount once.
    await createBuildAndGetId(page)
    await createPipelineAndGetId(page)
    await createProjectAndGetId(page)
    expect('final: zero console errors', errors.console.length === 0,
      JSON.stringify(errors.console))
    expect('final: zero page errors', errors.pageError.length === 0,
      JSON.stringify(errors.pageError))
    await ctx.close()
  }

  // ── Summary ──────────────────────────────────────────────────────────────
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
