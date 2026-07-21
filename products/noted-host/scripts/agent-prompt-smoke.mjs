import { spawn } from 'node:child_process'
import { access, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const port = 5187
const baseUrl = `http://127.0.0.1:${port}`

async function exists(path) { try { await access(path); return true } catch { return false } }
async function chromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  if (await exists(chromium.executablePath())) return chromium.executablePath()
  const cache = join(homedir(), '.cache', 'ms-playwright')
  for (const entry of (await readdir(cache).catch(() => [])).sort().reverse()) {
    for (const relative of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-linux/headless_shell']) {
      const candidate = join(cache, entry, relative)
      if (await exists(candidate)) return candidate
    }
  }
}
async function waitForServer() {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try { if ((await fetch(baseUrl)).ok) return } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for ${baseUrl}`)
}
function assert(condition, message) {
  if (!condition) throw new Error(message)
  console.log(`PASS ${message}`)
}

const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
server.stdout.on('data', (chunk) => process.stdout.write(chunk))
server.stderr.on('data', (chunk) => process.stderr.write(chunk))

let browser
try {
  await waitForServer()
  const executablePath = await chromiumExecutable()
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
  const page = await browser.newPage()
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('cdn.tailwindcss.com')) consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto(`${baseUrl}/#/nexus-agent`, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-test="nexus-agent-studio"]').waitFor()
  const frame = page.frames().find((candidate) => candidate.url().includes('nexus-agent-v0.14-scrubbed.html'))
  assert(Boolean(frame), 'ODS-AG-001 scrubbed v0.14 Agent iframe loads')
  const embedded = await frame.locator('#embedded-data').textContent()
  const factory = JSON.parse(embedded)
  assert(factory._mode === 'factory' && Object.keys(factory.tier1).length === 0 && Object.keys(factory.tier2).length === 0, 'ODS-AG-001 embedded data is factory-empty')

  await frame.evaluate(() => {
    window.parent.postMessage({
      type: 'NEXUS_HOST_BRIDGE',
      envelope: {
        id: 'ods-pr-001-fixture', createdAt: new Date().toISOString(),
        source: { kind: 'agent', id: 'ods-agent-fixture' }, target: { kind: 'noted-host', id: 'noted-host' },
        kind: 'prompt.snapshot.import.requested', intent: 'noted.prompt.import.requested',
        capability: 'noted.write', channel: 'prompt.snapshot.import.requested', tags: [], refs: [],
        payload: { title: 'ODS imported prompt', body: 'Explain the evidence boundary.', format: 'RAW', snapshotId: 'ods-snapshot-001' },
        policy: { requiresApproval: true, reversible: true, risk: 'medium', capability: 'noted.write' }
      }
    }, '*')
  })
  await page.locator('[data-test="prompt-import-approval"]').waitFor()
  assert(await page.locator('[data-test="prompt-import-approval"]').innerText().then((text) => text.includes('ODS imported prompt')), 'ODS-PR-001 request is previewed before mutation')
  await page.locator('[data-test="prompt-import-approve"]').click()
  await page.locator('[data-test="prompt-import-success"]').waitFor()
  await page.locator('[data-test="prompt-import-open-prompts"]').click()
  await page.waitForURL(/#\/prompts$/)
  assert((await page.locator('body').innerText()).includes('ODS imported prompt'), 'ODS-PR-001 approved prompt appears in Prompt Studio')
  assert(consoleErrors.length === 0, `browser console has no unexpected errors (${consoleErrors.join('; ') || 'none'})`)
  assert(pageErrors.length === 0, `page has no uncaught errors (${pageErrors.join('; ') || 'none'})`)
  console.log('ODS Phase 2 Agent/prompt PASS')
} finally {
  await browser?.close()
  if (server.exitCode === null) {
    await new Promise((resolve) => { server.once('exit', resolve); server.kill('SIGTERM') })
  }
}
