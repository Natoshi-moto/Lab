import { spawn } from 'node:child_process'
import { access, readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const mode = process.argv.includes('--preview') ? 'preview' : 'dev'
const port = mode === 'preview' ? 5186 : 5185
const baseUrl = `http://127.0.0.1:${port}`

async function exists(path) {
  try { await access(path); return true } catch { return false }
}

async function chromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const expected = chromium.executablePath()
  if (await exists(expected)) return expected
  const cache = join(homedir(), '.cache', 'ms-playwright')
  for (const entry of (await readdir(cache).catch(() => [])).sort().reverse()) {
    for (const relative of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-linux/headless_shell']) {
      const candidate = join(cache, entry, relative)
      if (await exists(candidate)) return candidate
    }
  }
  return undefined
}

async function waitForServer(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try { if ((await fetch(baseUrl)).ok) return } catch { /* still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for ${baseUrl}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
  console.log(`PASS ${message}`)
}

const server = spawn('npm', ['run', mode, '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
server.stdout.on('data', (chunk) => process.stdout.write(chunk))
server.stderr.on('data', (chunk) => process.stderr.write(chunk))

let browser
try {
  await waitForServer()
  const executablePath = await chromiumExecutable()
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
  const page = await browser.newPage({ acceptDownloads: true })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto(`${baseUrl}/#/diagnostics`, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-test="diagnostics-studio"]').waitFor()
  assert(await page.locator('[data-test="ods-nonclaims"]').isVisible(), 'research-only non-claims banner is visible')
  const diagnosticsLinks = await page.locator('[data-test="sidebar-link-diagnostics"]').count()
  assert(mode === 'dev' ? diagnosticsLinks === 1 : diagnosticsLinks === 0, mode === 'dev' ? 'Diagnostics sidebar entry is visible in DEV' : 'Diagnostics sidebar entry is hidden in production preview')

  const ids = ['ODS-ENV-001', 'ODS-HOST-001', 'ODS-BR-001', 'ODS-BR-002', 'ODS-BR-003', 'ODS-BR-004', 'ODS-BR-005', 'ODS-PATH-001', 'ODS-PACK-001']
  for (const id of ids) assert(await page.locator(`[data-test="ods-case-${id}"]`).count() === 1, `${id} is defined in the P0 catalog`)

  const frame = page.frames().find((candidate) => candidate.url().includes('/nexus/os/Nexus_OS.html'))
  assert(Boolean(frame), 'ODS trusted Nexus iframe loads')
  await frame.waitForFunction(() => Boolean(window.NexusHostAdapterStub?.ping))

  for (const id of ['ODS-ENV-001', 'ODS-HOST-001', 'ODS-PATH-001', 'ODS-PACK-001', 'ODS-BR-001', 'ODS-BR-002']) {
    await page.locator(`[data-test="ods-case-${id}"] button`).click()
    await page.locator(`[data-test="ods-result-${id}"]`).waitFor()
    assert((await page.locator(`[data-test="ods-case-${id}"]`).innerText()).includes('PASS'), `${id} runner passes`)
  }

  const downloadPromise = page.waitForEvent('download')
  await page.locator('[data-test="ods-export-json"]').click()
  const download = await downloadPromise
  const path = await download.path()
  assert(Boolean(path), 'diagnosis pack downloads as JSON')
  const pack = JSON.parse(await readFile(path, 'utf8'))
  assert(pack.schema === 'noted.ods-pack/v1', 'export uses noted.ods-pack/v1 schema')
  assert(pack.status_authority === 'NONE', 'export status_authority is NONE')
  assert(pack.cases_run.length === 6, 'export contains the six implemented ODS-0 case runs')
  assert(pack.cases_run.every((run) => run.result === 'PASS'), 'exported implemented runs are PASS')
  assert(consoleErrors.length === 0, `browser console has no errors (${consoleErrors.join('; ') || 'none'})`)
  assert(pageErrors.length === 0, `page has no uncaught errors (${pageErrors.join('; ') || 'none'})`)
  console.log(`ODS-0 smoke PASS (${mode})`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  await new Promise((resolve) => server.once('exit', resolve))
}
