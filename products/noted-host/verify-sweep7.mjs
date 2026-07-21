// Sweep 7 verification — sidebar redesign, route stubs, persistent Docker.
//
// Set CHROMIUM_PATH=/path/to/chromium if your Playwright browsers aren't on
// the default lookup path; otherwise this just calls chromium.launch().

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

// Sweep 23: route count grew from 10 to 12 (added /inbox + /atlas).
// Updated in place from the original Sweep-7 ROUTES list with this comment
// so the cumulative verify still passes after Sweep 23.
const ROUTES = [
  { hash: '#/inbox',      label: 'Inbox' },
  { hash: '#/writing',    label: 'Writing Studio' },
  { hash: '#/poetry',     label: 'Poetry Studio' },
  { hash: '#/longform',   label: 'Longform Studio' },
  { hash: '#/app-design', label: 'App-Design Studio' },
  { hash: '#/prompts',    label: 'Prompt Studio' },
  { hash: '#/canvas',     label: 'Canvas' },
  { hash: '#/atlas',      label: 'Atlas' },
  { hash: '#/projects',   label: 'Projects' },
  { hash: '#/library',    label: 'Feature Library' },
  { hash: '#/shelf',      label: 'Shelf' },
  { hash: '#/settings',   label: 'Settings' }
]

// Stub routes new to Sweep 7.
const STUBS = [
  { hash: '#/projects', paletteQuery: 'Projects',        stubTest: 'route-stub-projects', heading: 'Projects' },
  { hash: '#/prompts',  paletteQuery: 'Prompt Studio',   stubTest: 'route-stub-prompts',  heading: 'Prompt Studio' },
  { hash: '#/canvas',   paletteQuery: 'Canvas',          stubTest: 'route-stub-canvas',   heading: 'Canvas' },
  { hash: '#/library',  paletteQuery: 'Feature Library', stubTest: 'route-stub-library',  heading: 'Feature Library' }
]

async function navByHash(page, hash) {
  await page.click(`aside a[href="${hash}"]`)
  await page.waitForFunction(
    (h) => window.location.hash === h,
    hash
  )
}

async function run() {
  rmSync('./test-downloads', { recursive: true, force: true })
  mkdirSync('./test-downloads', { recursive: true })

  const browser = await chromium.launch(launchOpts)

  // ---- Boot is clean across all 12 routes (Sweep 23) ----
  console.log('\nBoot — no console errors across every route')
  {
    const { ctx, page, errors } = await fresh(browser)
    expect('app reaches ready state',
      !(await page.evaluate(() => document.body.innerText.includes('Loading'))),
      'still showed Loading')

    for (const r of ROUTES) {
      await navByHash(page, r.hash)
      await page.waitForTimeout(60)  // let any deferred error surface
    }

    expect('no console.error during full route walk',
      errors.console.length === 0,
      `${errors.console.length} console errors: ${errors.console.slice(0, 3).join(' | ')}`)
    expect('no pageerror during full route walk',
      errors.pageError.length === 0,
      `${errors.pageError.length} page errors: ${errors.pageError.slice(0, 3).join(' | ')}`)

    await ctx.close()
  }

  // ---- Sidebar exposes all 12 routes (Sweep 23) ----
  console.log('\nSidebar — all 12 routes render and click')
  {
    const { ctx, page } = await fresh(browser)
    const hrefs = await page.$$eval('aside a', (els) =>
      els.map((e) => e.getAttribute('href')))
    expect('sidebar has exactly 12 NavLinks',
      hrefs.length === 12,
      `got ${hrefs.length}: ${JSON.stringify(hrefs)}`)

    const expected = ROUTES.map((r) => r.hash).sort()
    const actual = [...hrefs].sort()
    expect('sidebar hrefs match expected route set',
      JSON.stringify(expected) === JSON.stringify(actual),
      `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)

    // Click each link, assert hash flips.
    for (const r of ROUTES) {
      await navByHash(page, r.hash)
      const hash = await page.evaluate(() => window.location.hash)
      expect(`sidebar link → ${r.hash}`,
        hash === r.hash,
        `got ${hash}`)
    }

    await ctx.close()
  }

  // ---- Each new stub renders its data-test marker ----
  console.log('\nStub routes — each renders its route-stub marker')
  {
    const { ctx, page } = await fresh(browser)
    for (const s of STUBS) {
      await navByHash(page, s.hash)
      await page.waitForSelector(`[data-test="${s.stubTest}"]`, { timeout: 3000 })
      const heading = await page.$eval(`[data-test="${s.stubTest}"] h1`, (el) => el.textContent.trim())
      expect(`${s.hash} renders [data-test=${s.stubTest}] with heading "${s.heading}"`,
        heading === s.heading,
        `got heading "${heading}"`)
    }
    await ctx.close()
  }

  // ---- Cmd+K palette navigates to each stub (no fallback redirect) ----
  console.log('\nCmd+K — each new route lands on its stub, not /writing')
  {
    for (const s of STUBS) {
      const { ctx, page } = await fresh(browser)
      // Park on /shelf so a buggy fallback to /writing would be obvious.
      await navByHash(page, '#/shelf')

      await page.keyboard.down('Meta')
      await page.keyboard.press('K')
      await page.keyboard.up('Meta')
      await page.waitForSelector('[data-test="palette"]', { timeout: 3000 })

      await page.click('[data-test="palette-input"]')
      await page.fill('[data-test="palette-input"]', s.paletteQuery)
      await page.waitForTimeout(80)
      await page.keyboard.press('Enter')

      // The palette closes and the stub renders.
      await page.waitForSelector(`[data-test="${s.stubTest}"]`, { timeout: 3000 })
      const hash = await page.evaluate(() => window.location.hash)
      expect(`palette '${s.paletteQuery}' → ${s.hash}`,
        hash === s.hash,
        `got ${hash} (would be #/writing if fallback fired)`)

      await ctx.close()
    }
  }

  // ---- Docker present on every route ----
  console.log('\nDocker — present on every route')
  {
    const { ctx, page } = await fresh(browser)
    for (const r of ROUTES) {
      await navByHash(page, r.hash)
      const present = await page.evaluate(() =>
        !!document.querySelector('[data-test="docker"]'))
      expect(`${r.hash} mounts the Docker`,
        present,
        '[data-test="docker"] missing')
    }
    await ctx.close()
  }

  // ---- Docker collapse/expand persists across reload ----
  console.log('\nDocker — toggle and persistence')
  {
    const { ctx, page } = await fresh(browser)

    // Default state: collapsed.
    let expanded = await page.$eval('[data-test="docker"]', (el) =>
      el.getAttribute('data-expanded'))
    expect('default state is collapsed',
      expanded === 'false',
      `data-expanded=${expanded}`)

    let panelPresent = await page.evaluate(() =>
      !!document.querySelector('[data-test="docker-panel"]'))
    expect('collapsed: no docker-panel rendered',
      !panelPresent, 'docker-panel was present while collapsed')

    // Expand.
    await page.click('[data-test="docker-toggle"]')
    await page.waitForFunction(() =>
      document.querySelector('[data-test="docker"]')?.getAttribute('data-expanded') === 'true')
    panelPresent = await page.evaluate(() =>
      !!document.querySelector('[data-test="docker-panel"]'))
    expect('toggle expands the docker',
      panelPresent, 'docker-panel did not appear after toggle')

    // Reload — expansion persists.
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    expanded = await page.$eval('[data-test="docker"]', (el) =>
      el.getAttribute('data-expanded'))
    expect('expansion persists across reload',
      expanded === 'true',
      `after reload, data-expanded=${expanded}`)

    // Collapse.
    await page.click('[data-test="docker-toggle"]')
    await page.waitForFunction(() =>
      document.querySelector('[data-test="docker"]')?.getAttribute('data-expanded') === 'false')

    // Reload again — collapse persists.
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    expanded = await page.$eval('[data-test="docker"]', (el) =>
      el.getAttribute('data-expanded'))
    expect('collapse persists across reload',
      expanded === 'false',
      `after reload, data-expanded=${expanded}`)

    await ctx.close()
  }

  // ---- Docker tab clicks update the active marker ----
  console.log('\nDocker — tab clicks change the active tab')
  {
    const { ctx, page } = await fresh(browser)

    // Default active tab.
    const initial = await page.$$eval('[data-test="docker-tab"]', (els) =>
      els.map((e) => ({
        slug: e.getAttribute('data-docker-tab'),
        active: e.getAttribute('data-active') === 'true'
      })))
    expect('docker has six tabs',
      initial.length === 6,
      `got ${initial.length}`)
    const initialActive = initial.filter((t) => t.active)
    expect('exactly one tab active by default',
      initialActive.length === 1,
      `got ${initialActive.length}`)
    expect('default active tab is scratchpad',
      initialActive[0]?.slug === 'scratchpad',
      `got ${initialActive[0]?.slug}`)

    // Click Clipboard.
    await page.click('[data-test="docker-tab"][data-docker-tab="clipboard"]')
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-test="docker-tab"][data-docker-tab="clipboard"]')
      return el?.getAttribute('data-active') === 'true'
    })
    const afterClip = await page.$$eval('[data-test="docker-tab"]', (els) =>
      els.filter((e) => e.getAttribute('data-active') === 'true')
        .map((e) => e.getAttribute('data-docker-tab')))
    expect('after Clipboard click, exactly one tab active and it is clipboard',
      afterClip.length === 1 && afterClip[0] === 'clipboard',
      `got ${JSON.stringify(afterClip)}`)

    // Click Files.
    await page.click('[data-test="docker-tab"][data-docker-tab="files"]')
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-test="docker-tab"][data-docker-tab="files"]')
      return el?.getAttribute('data-active') === 'true'
    })
    const afterFiles = await page.$$eval('[data-test="docker-tab"]', (els) =>
      els.filter((e) => e.getAttribute('data-active') === 'true')
        .map((e) => e.getAttribute('data-docker-tab')))
    expect('after Files click, exactly one tab active and it is files',
      afterFiles.length === 1 && afterFiles[0] === 'files',
      `got ${JSON.stringify(afterFiles)}`)

    // Active tab persists across reload (same localStorage key as expansion).
    await page.reload()
    await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
    const afterReload = await page.$$eval('[data-test="docker-tab"]', (els) =>
      els.filter((e) => e.getAttribute('data-active') === 'true')
        .map((e) => e.getAttribute('data-docker-tab')))
    expect('active tab persists across reload',
      afterReload.length === 1 && afterReload[0] === 'files',
      `got ${JSON.stringify(afterReload)}`)

    await ctx.close()
  }

  await browser.close()
  console.log(`\n${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch((e) => { console.error(e); process.exit(1) })
