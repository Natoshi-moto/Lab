import { spawn } from 'node:child_process'
import { access, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const mode = process.argv.includes('--preview') ? 'preview' : 'dev'
const port = mode === 'preview' ? 5184 : 5183
const baseUrl = `http://127.0.0.1:${port}`

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function chromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  }

  try {
    const expected = chromium.executablePath()
    if (await exists(expected)) return expected
  } catch {
    // Fall through to locally cached Playwright browsers from another revision.
  }

  const cache = join(homedir(), '.cache', 'ms-playwright')
  const entries = (await readdir(cache).catch(() => [])).sort().reverse()
  for (const entry of entries) {
    for (const relative of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-linux/headless_shell']) {
      const candidate = join(cache, entry, relative)
      if (await exists(candidate)) return candidate
    }
  }
  return undefined
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function parseStatus(text) {
  const match = text.match(/ok\s+(\d+)\s*\/\s*rejected\s+(\d+)\s*\/\s*ignored\s+(\d+)/)
  if (!match) throw new Error(`Could not parse bridge status: ${text}`)
  return { accepted: Number(match[1]), rejected: Number(match[2]), ignored: Number(match[3]) }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
  console.log(`PASS ${message}`)
}

const command = mode === 'preview'
  ? ['npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort']]
  : ['npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort']]
const server = spawn(command[0], command[1], { stdio: ['ignore', 'pipe', 'pipe'] })
server.stdout.on('data', (chunk) => process.stdout.write(chunk))
server.stderr.on('data', (chunk) => process.stderr.write(chunk))

let browser
try {
  await waitForServer(baseUrl)
  const executablePath = await chromiumExecutable()
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
  const page = await browser.newPage()
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto(`${baseUrl}/#/nexus-router`, { waitUntil: 'domcontentloaded' })
  const studio = page.locator('[data-test="nexus-router-studio"]')
  const iframe = page.locator('[data-test="nexus-router-iframe"]')
  const status = page.locator('[data-test="nexus-host-bridge-status"]')
  await studio.waitFor()
  await iframe.waitFor()
  assert(await iframe.getAttribute('src') === './nexus/os/Nexus_OS.html', 'router iframe uses the package public path')

  await page.waitForFunction(() => {
    const text = document.querySelector('[data-test="nexus-host-bridge-status"]')?.textContent || ''
    return /listening/.test(text) && /ok\s+[1-9]\d*/.test(text)
  })
  const before = parseStatus(await status.innerText())
  assert(before.accepted >= 1, 'iframe boot diagnostic.ping receives an accepted receipt')

  const frame = page.frames().find((candidate) => candidate.url().includes('/nexus/os/Nexus_OS.html'))
  assert(Boolean(frame), 'Nexus_OS iframe is loaded')
  await frame.evaluate(() => window.NexusHostAdapterStub.ping())
  await page.waitForFunction((accepted) => {
    const text = document.querySelector('[data-test="nexus-host-bridge-status"]')?.textContent || ''
    const match = text.match(/ok\s+(\d+)/)
    return match && Number(match[1]) === accepted + 1
  }, before.accepted)
  const afterTrusted = parseStatus(await status.innerText())
  assert(afterTrusted.accepted === before.accepted + 1, 'one trusted ping increments accepted exactly once')

  const untrusted = await page.evaluate(async () => {
    let receiptReplies = 0
    const listener = (event) => {
      if (event.data?.type === 'NEXUS_HOST_BRIDGE_RECEIPT') receiptReplies += 1
    }
    window.addEventListener('message', listener)
    window.postMessage({
      type: 'NEXUS_HOST_BRIDGE',
      envelope: {
        id: 'smoke-untrusted',
        createdAt: new Date().toISOString(),
        source: { kind: 'nexus-router', id: 'impersonator' },
        target: { kind: 'noted-host', id: 'noted-host' },
        kind: 'diagnostic.ping',
        intent: 'smoke.untrusted',
        capability: 'nexus.emit',
        channel: 'diagnostic.ping',
        tags: [], refs: [], payload: {},
        policy: { requiresApproval: false, reversible: false, risk: 'low', capability: 'nexus.emit' },
      },
    }, '*')
    await new Promise((resolve) => setTimeout(resolve, 150))
    window.removeEventListener('message', listener)
    return receiptReplies
  })
  const afterUntrusted = parseStatus(await status.innerText())
  assert(afterUntrusted.rejected === afterTrusted.rejected + 1, 'protocol impersonation records one local UNTRUSTED_SOURCE rejection')
  assert(afterUntrusted.accepted === afterTrusted.accepted, 'protocol impersonation is not accepted')
  assert(untrusted === 0, 'host never postMessages a receipt back to the untrusted sender')
  assert((await status.innerText()).includes('trusted Nexus iframe'), 'local rejection is visible in bridge state')
  assert(consoleErrors.length === 0, `browser console has no errors (${consoleErrors.join('; ') || 'none'})`)
  assert(pageErrors.length === 0, `page has no uncaught errors (${pageErrors.join('; ') || 'none'})`)
  console.log(`bridge smoke PASS (${mode})`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  await new Promise((resolve) => server.once('exit', resolve))
}
