import { chromium } from 'playwright'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(resolve(__dirname, 'verse-studio.html'), 'utf8')

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(html)
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const { port } = server.address()
const BASE = `http://127.0.0.1:${port}`

const launchOpts = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {}
const browser = await chromium.launch(launchOpts)

let pass = 0
let fail = 0

function assert(cond, label) {
  if (cond) {
    console.log(`  PASS  ${label}`)
    pass++
  } else {
    console.error(`  FAIL  ${label}`)
    fail++
  }
}

async function ready(page) {
  await page.waitForFunction(() => !document.body.innerText.includes('Loading'))
}

// ── Block 1 — Default state: focus OFF, chrome visible ──────────────────────
{
  console.log('\nBlock 1 — Default state: focus OFF, chrome visible')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/#/writing`)
  await ready(page)

  const shellFocus = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(shellFocus === 'false', 'shell data-focus="false" by default')

  const asideCount = await page.locator('aside:has(a[href="#/writing"])').count()
  assert(asideCount === 1, 'Sidebar <aside> visible')

  const dockerCount = await page.locator('[data-test="docker"]').count()
  assert(dockerCount === 1, 'Docker visible')

  const toggleExists = await page.locator('[data-test="focus-toggle"]').count()
  assert(toggleExists === 1, 'focus-toggle button exists')

  const toggleActive = await page.getAttribute('[data-test="focus-toggle"]', 'data-focus-active')
  assert(toggleActive === 'false', 'focus-toggle data-focus-active="false"')

  await ctx.close()
}

// ── Block 2 — Toggle ON via button: chrome hides ─────────────────────────────
{
  console.log('\nBlock 2 — Toggle ON: chrome hides')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/#/writing`)
  await ready(page)

  await page.click('[data-test="focus-toggle"]')
  await page.waitForTimeout(200)

  const shellFocus = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(shellFocus === 'true', 'shell data-focus="true" after toggle')

  const toggleActive = await page.getAttribute('[data-test="focus-toggle"]', 'data-focus-active')
  assert(toggleActive === 'true', 'focus-toggle data-focus-active="true"')

  const asideCount = await page.locator('aside:has(a[href="#/writing"])').count()
  assert(asideCount === 0, 'Sidebar <aside> not in DOM')

  const dockerCount = await page.locator('[data-test="docker"]').count()
  assert(dockerCount === 0, 'Docker not in DOM')

  const newDocCount = await page.locator('[data-test="new-doc"]').count()
  assert(newDocCount > 0, 'main content (new-doc) still visible in focus mode')

  await ctx.close()
}

// ── Block 3 — Persist across reload ──────────────────────────────────────────
{
  console.log('\nBlock 3 — Persist across reload')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/#/writing`)
  await ready(page)

  // Enable focus
  await page.click('[data-test="focus-toggle"]')
  await page.waitForTimeout(200)

  // Reload
  await page.reload()
  await ready(page)

  const shellFocus = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(shellFocus === 'true', 'shell data-focus="true" after reload')

  const asideCount = await page.locator('aside:has(a[href="#/writing"])').count()
  assert(asideCount === 0, 'Sidebar still hidden after reload')

  const dockerCount = await page.locator('[data-test="docker"]').count()
  assert(dockerCount === 0, 'Docker still hidden after reload')

  const lsValue = await page.evaluate(() => localStorage.getItem('verse-studio:focus'))
  assert(lsValue === 'true', 'localStorage verse-studio:focus === "true"')

  await ctx.close()
}

// ── Block 4 — Toggle OFF: chrome returns ─────────────────────────────────────
{
  console.log('\nBlock 4 — Toggle OFF: chrome returns')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/#/writing`)
  await ready(page)

  // Enable then disable
  await page.click('[data-test="focus-toggle"]')
  await page.waitForTimeout(200)
  await page.click('[data-test="focus-toggle"]')
  await page.waitForTimeout(200)

  const shellFocus = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(shellFocus === 'false', 'shell data-focus="false" after toggle off')

  const asideCount = await page.locator('aside:has(a[href="#/writing"])').count()
  assert(asideCount === 1, 'Sidebar <aside> reappears')

  const dockerCount = await page.locator('[data-test="docker"]').count()
  assert(dockerCount === 1, 'Docker reappears')

  const lsValue = await page.evaluate(() => localStorage.getItem('verse-studio:focus'))
  assert(lsValue === 'false', 'localStorage verse-studio:focus === "false"')

  await ctx.close()
}

// ── Block 5 — Keyboard shortcut works ────────────────────────────────────────
{
  console.log('\nBlock 5 — Keyboard shortcut')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/#/writing`)
  await ready(page)

  // Ctrl+. toggles ON
  await page.keyboard.press('Control+.')
  await page.waitForTimeout(200)
  const afterFirst = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(afterFirst === 'true', 'Ctrl+. toggles focus ON')

  // Ctrl+. toggles OFF
  await page.keyboard.press('Control+.')
  await page.waitForTimeout(200)
  const afterSecond = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(afterSecond === 'false', 'Ctrl+. toggles focus OFF')

  // Plain period in textarea must NOT toggle focus
  await page.click('[data-test="new-doc"]')
  await ready(page)
  await page.waitForTimeout(200)
  const beforeDot = await page.getAttribute('[data-test="shell"]', 'data-focus')
  const docBody = page.locator('[data-test="doc-body"]')
  await docBody.waitFor({ state: 'visible' })
  await docBody.click()
  await page.keyboard.type('.')
  await page.waitForTimeout(200)
  const afterDot = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(afterDot === beforeDot, 'Plain "." in textarea does not toggle focus')

  await ctx.close()
}

// ── Block 6 — Focus state survives navigation ─────────────────────────────────
{
  console.log('\nBlock 6 — Focus survives navigation')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/#/writing`)
  await ready(page)

  // Enable focus
  await page.click('[data-test="focus-toggle"]')
  await page.waitForTimeout(200)

  // Navigate to poetry
  await page.evaluate(() => { location.hash = '#/poetry' })
  await page.waitForTimeout(200)
  const focusPoetry = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(focusPoetry === 'true', 'data-focus="true" on /poetry')
  const asidePoetry = await page.locator('aside:has(a[href="#/writing"])').count()
  assert(asidePoetry === 0, 'Sidebar hidden on /poetry')

  // Navigate to library
  await page.evaluate(() => { location.hash = '#/library' })
  await page.waitForTimeout(200)
  const focusLibrary = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(focusLibrary === 'true', 'data-focus="true" on /library')
  const asideLibrary = await page.locator('aside:has(a[href="#/writing"])').count()
  assert(asideLibrary === 0, 'Sidebar hidden on /library')

  // Toggle OFF then navigate, chrome must be present
  await page.click('[data-test="focus-toggle"]')
  await page.waitForTimeout(200)
  await page.evaluate(() => { location.hash = '#/writing' })
  await page.waitForTimeout(200)
  const focusOff = await page.getAttribute('[data-test="shell"]', 'data-focus')
  assert(focusOff === 'false', 'data-focus="false" after toggle off + navigate')
  const asideOff = await page.locator('aside:has(a[href="#/writing"])').count()
  assert(asideOff === 1, 'Sidebar reappears after toggle off + navigate')

  await ctx.close()
}

// ── Block 7 — Cmd+K palette still works in focus mode ────────────────────────
{
  console.log('\nBlock 7 — Palette works in focus mode')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/#/writing`)
  await ready(page)

  // Enable focus
  await page.click('[data-test="focus-toggle"]')
  await page.waitForTimeout(200)

  // Open palette
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(300)
  const paletteCount = await page.locator('[data-test="palette"]').count()
  assert(paletteCount === 1, 'Palette opens in focus mode')

  // Close palette
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  const paletteClosed = await page.locator('[data-test="palette"]').count()
  assert(paletteClosed === 0, 'Palette closes on Escape')

  await ctx.close()
}

await browser.close()
server.close()

console.log(`\nverify-sweep22: ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
