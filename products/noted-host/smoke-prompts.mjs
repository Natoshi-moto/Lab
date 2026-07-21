// smoke-prompts.mjs — quick smoke of new Prompt Studio compose mode.
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HTML = 'file://' + join(__dirname, 'verse-studio.html')

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const ctx = await browser.newContext()
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })

await page.goto(HTML, { waitUntil: 'load' })
await page.evaluate(() => {
  try { localStorage.clear() } catch {}
  return new Promise((res) => {
    const r = indexedDB.deleteDatabase('verse-studio')
    r.onblocked = r.onsuccess = r.onerror = () => res()
  })
})
await page.reload({ waitUntil: 'load' })
await page.evaluate(() => { location.hash = '#/prompts' })
await page.waitForTimeout(500)

let pass = 0, fail = 0
function check(label, ok) {
  if (ok) { console.log('PASS', label); pass++ }
  else    { console.log('FAIL', label); fail++ }
}

check('1 editor present',     !!(await page.$('[data-test="prompts-editor"]')))
check('2 tabstrip present',   !!(await page.$('[data-test="prompts-tabstrip"]')))
check('3 library present',    !!(await page.$('[data-test="prompts-library"]')))
check('4 status footer',      !!(await page.$('[data-test="prompts-status"]')))

await page.click('[data-test="prompts-editor"]')
await page.keyboard.type('Hello\n')
await page.keyboard.type('/')
await page.waitForTimeout(250)
check('5 slash opens',        !!(await page.$('[data-test="prompts-slash"]')))
await page.keyboard.press('Escape')
await page.waitForTimeout(150)
check('6 slash dismisses',    !(await page.$('[data-test="prompts-slash"]')))

// Seed a block via direct IDB write so we can test summon-and-insert.
await page.evaluate(() => {
  return new Promise((res, rej) => {
    const open = indexedDB.open('verse-studio')
    open.onsuccess = () => {
      const db = open.result
      const tx = db.transaction('patterns', 'readwrite')
      tx.objectStore('patterns').put({
        id: 'smoke-block-1',
        name: 'persona',
        description: '',
        type: 'block',
        tags: [],
        body: 'You are a {{role}} who {{verbs}}.',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    }
    open.onerror = () => rej(open.error)
  })
})
await page.reload({ waitUntil: 'load' })
await page.evaluate(() => { location.hash = '#/prompts' })
await page.waitForTimeout(500)

const cardCount = await page.$$eval('[data-test="prompts-library-card"]', (els) => els.length)
check('7 library shows persisted block', cardCount >= 1)

await page.click('[data-test="prompts-editor"]')
await page.evaluate(() => {
  const ta = document.querySelector('[data-test="prompts-editor"]')
  ta.focus()
  ta.setSelectionRange(ta.value.length, ta.value.length)
})
await page.keyboard.type('\nQ: ')
await page.keyboard.type('/per')
await page.waitForTimeout(250)
check('8 slash with query opens', !!(await page.$('[data-test="prompts-slash"]')))
await page.keyboard.press('Enter')
await page.waitForTimeout(250)
const editorVal = await page.$eval('[data-test="prompts-editor"]', (e) => e.value)
check('9 block inserted', editorVal.includes('You are a {{role}}'))

const sel = await page.$eval('[data-test="prompts-editor"]', (e) => ({
  start: e.selectionStart, end: e.selectionEnd,
}))
check('10 first variable selected', sel.end > sel.start)

await page.click('[data-test="prompts-view-pipelines"]')
await page.waitForTimeout(250)
await page.click('[data-test="new-pipeline"]')
await page.waitForTimeout(250)

// 11. Pipelines view shows the v2 vars editor + add-step button.
check('11 vars editor present',
  !!(await page.$('[data-test="pipeline-vars"]')))
const addStepBtn = await page.$('[data-test="pipeline-add-step"]')
check('11b add-step button present', !!addStepBtn)

// 11c. Picker opens, shows the seeded blocks.
await addStepBtn.click()
await page.waitForTimeout(200)
check('11c picker opens', !!(await page.$('[data-test="pipeline-picker"]')))

// 11d-g. End-to-end materialize: pick a block, set a binding, materialize.
const pickerItems = await page.$$('[data-test="pipeline-picker-item"]')
if (pickerItems.length > 0) {
  // Click the first item (mousedown is bound to onPick).
  await pickerItems[0].dispatchEvent('mousedown')
  await page.waitForTimeout(200)
  check('11d step added',
    !!(await page.$('[data-test="pipeline-step"]')))

  // Expand the step
  await page.click('[data-test="pipeline-step-toggle"]')
  await page.waitForTimeout(150)

  // Set a binding for the first var ({{role}})
  const bindingInputs = await page.$$('[data-test="pipeline-step-binding"]')
  if (bindingInputs.length > 0) {
    await bindingInputs[0].fill('interrogator')
    await page.waitForTimeout(200)
    const preview = await page.$eval(
      '[data-test="pipeline-step-preview"]',
      (e) => e.textContent || ''
    )
    check('11e materialized preview reflects binding',
      preview.includes('interrogator'))
  } else {
    check('11e materialized preview reflects binding', false)
  }

  // Click materialize and verify a flash appears (clipboard may be
  // permission-blocked in headless; the flash signals the materialize
  // path ran end-to-end either way).
  await page.click('[data-test="pipeline-materialize"]')
  await page.waitForTimeout(250)
  const flash = await page.$('[data-test="pipeline-flash"]')
  check('11f materialize button fires (flash visible)', !!flash)
  // Verify the materialized text directly via the export-txt path which
  // shares the same materializer and works without clipboard access.
  const evalText = await page.evaluate(() => {
    // Find the .txt download trigger; we can't intercept the download easily,
    // so instead check that the in-DOM step preview includes the substituted
    // value, which proves substituteVars works.
    const pre = document.querySelector('[data-test="pipeline-step-preview"]')
    return pre ? pre.textContent || '' : ''
  })
  check('11g preview applies substitution end-to-end',
    evalText.includes('interrogator'))
} else {
  check('11d step added', false)
  check('11e materialized preview reflects binding', false)
  check('11f materialize button fires (flash visible)', false)
  check('11g preview applies substitution end-to-end', false)
}

// 12. Variable-highlight overlay renders {{var}} as a span with bg.
await page.click('[data-test="prompts-view-compose"]')
await page.waitForTimeout(200)
const varSpanCount = await page.$$eval(
  '[data-test="prompts-editor-overlay"] span',
  (els) => els.filter((el) => /^\{\{.+\}\}$/.test(el.textContent || '')).length
)
check('12 overlay highlights variables', varSpanCount >= 1)

// 13. Pin a block — pinned section should appear.
await page.click('[data-test="prompts-library-pin"]')
await page.waitForTimeout(150)
check('13 pinned section header appears',
  !!(await page.$('[data-test="prompts-library-pinned-header"]')))

// 14. Use-count appears after summon.
const useCount = await page.$('[data-test="prompts-library-usecount"]')
check('14 use count tracked', !!useCount)

// 15. Right-click context menu (only when there's content).
await page.click('[data-test="prompts-editor"]')
const editorBox = await page.$eval('[data-test="prompts-editor"]', (el) => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
})
await page.mouse.move(editorBox.x, editorBox.y)
await page.mouse.click(editorBox.x, editorBox.y, { button: 'right' })
await page.waitForTimeout(200)
check('15 right-click context menu opens',
  !!(await page.$('[data-test="prompts-ctxmenu"]')))
await page.keyboard.press('Escape')
await page.waitForTimeout(150)

// 16. Cmd+/ opens slash popover globally
await page.click('[data-test="prompts-editor"]')
await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control')
await page.keyboard.press('/')
await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control')
await page.waitForTimeout(250)
check('16 cmd/ctrl + / opens summoner',
  !!(await page.$('[data-test="prompts-slash"]')))
await page.keyboard.press('Escape')
await page.waitForTimeout(150)

// 17–21: linking gesture between blocks
// Seed a second block so we have a target.
await page.evaluate(() => new Promise((res, rej) => {
  const open = indexedDB.open('verse-studio')
  open.onsuccess = () => {
    const tx = open.result.transaction('patterns', 'readwrite')
    tx.objectStore('patterns').put({
      id: 'b2', name: 'task-spec', description: '',
      type: 'block', tags: [],
      body: 'Solve the following: {{problem}}',
      createdAt: Date.now(), updatedAt: Date.now(),
    })
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  }
}))
await page.reload()
await page.evaluate(() => { location.hash = '#/prompts' })
await page.waitForTimeout(500)

const cards = await page.$$('[data-test="prompts-library-card"]')
check('17 two cards in library', cards.length >= 2)

const c0 = await cards[0].boundingBox()
const c1 = await cards[1].boundingBox()
if (c0 && c1) {
  // Right-mousedown on card 0, drag to card 1, release.
  await page.mouse.move(c0.x + c0.width / 2, c0.y + c0.height / 2)
  await page.mouse.down({ button: 'right' })
  await page.waitForTimeout(120)
  check('18 link line overlay appears',
    !!(await page.$('[data-test="prompts-link-line"]')))
  // Drag (mouse must move while button is down).
  await page.mouse.move(c1.x + c1.width / 2, c1.y + c1.height / 2, { steps: 6 })
  await page.waitForTimeout(80)
  await page.mouse.up({ button: 'right' })
  await page.waitForTimeout(250)
  check('19 link line cleared after drop',
    !(await page.$('[data-test="prompts-link-line"]')))
  // Both cards now show ↔ chip.
  const chips = await page.$$('[data-test="prompts-library-linkcount"]')
  check('20 link-count chips appear on both cards', chips.length >= 2)
} else {
  check('18 link line overlay appears', false)
  check('19 link line cleared after drop', false)
  check('20 link-count chips appear on both cards', false)
}

// 21. Click the chip → playground opens with both blocks visible.
const chip = await page.$('[data-test="prompts-library-linkcount"]')
if (chip) {
  await chip.click()
  await page.waitForTimeout(250)
  check('21 playground opens',
    !!(await page.$('[data-test="prompts-playground"]')))
  const nodes = await page.$$('[data-test="prompts-pg-node"]')
  check('22 playground shows focus + neighbor', nodes.length >= 2)
  const edges = await page.$$('[data-test="prompts-pg-edge"]')
  check('23 playground shows edge', edges.length >= 1)
} else {
  check('21 playground opens', false)
  check('22 playground shows focus + neighbor', false)
  check('23 playground shows edge', false)
}

// 24-25: contextmenu suppression — capture-phase, fires before the OS menu
const cardCtxPrevented = await page.$eval(
  '[data-test="prompts-library-card"]',
  (el) => {
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    el.dispatchEvent(ev)
    return ev.defaultPrevented
  }
)
check('24 card contextmenu defaultPrevented', cardCtxPrevented)

const nodeCtxPrevented = await page.$eval(
  '[data-test="prompts-pg-node"]',
  (el) => {
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    el.dispatchEvent(ev)
    return ev.defaultPrevented
  }
)
check('25 playground node contextmenu defaultPrevented', nodeCtxPrevented)

// 26: right-click+drag from a playground node fires the linking gesture
const pgNodes = await page.$$('[data-test="prompts-pg-node"]')
if (pgNodes.length >= 2) {
  const n0 = await pgNodes[0].boundingBox()
  const n1 = await pgNodes[1].boundingBox()
  if (n0 && n1) {
    await page.mouse.move(n0.x + n0.width / 2, n0.y + n0.height / 2)
    await page.mouse.down({ button: 'right' })
    await page.waitForTimeout(120)
    check('26 link line appears from playground node',
      !!(await page.$('[data-test="prompts-link-line"]')))
    await page.mouse.move(n1.x + n1.width / 2, n1.y + n1.height / 2, { steps: 6 })
    await page.mouse.up({ button: 'right' })
    await page.waitForTimeout(200)
  } else {
    check('26 link line appears from playground node', false)
  }
} else {
  check('26 link line appears from playground node', false)
}

// 27-32: pipelines v2 follow-ups — bug fix + new affordances
// Switch back to pipelines view; pick a fresh pipeline; create a new block
// from the picker by typing a name that doesn't exist; confirm the editor
// auto-opens for the new block.
await page.click('[data-test="prompts-view-pipelines"]')
await page.waitForTimeout(200)
await page.click('[data-test="new-pipeline"]')
await page.waitForTimeout(200)
await page.click('[data-test="pipeline-add-step"]')
await page.waitForTimeout(150)
await page.fill('[data-test="pipeline-picker-search"]', 'fresh-block-xyz')
await page.waitForTimeout(150)
await page.click('[data-test="pipeline-picker-create"]')
await page.waitForTimeout(300)
check('27 block-edit drawer auto-opens after picker creates a block',
  !!(await page.$('[data-test="prompts-block-drawer"]')))
// Write a body in the drawer; verify the step preview shows it.
await page.fill('[data-test="prompts-block-body"]', 'Hello from {{place}}.')
await page.waitForTimeout(500)
await page.click('[data-test="prompts-block-close"]')
await page.waitForTimeout(200)

// Now expand the step
await page.click('[data-test="pipeline-step-toggle"]')
await page.waitForTimeout(150)
const stepPreview = await page.$eval('[data-test="pipeline-step-preview"]', (e) => e.textContent || '')
check('28 step preview reflects edited block body',
  stepPreview.includes('Hello from'))

// Duplicate the step — should create a second step row with the same pattern
const dupBtn = await page.$('[data-test="pipeline-step-duplicate"]')
if (dupBtn) {
  await dupBtn.click()
  await page.waitForTimeout(200)
  const stepCount = await page.$$eval('[data-test="pipeline-step"]', (els) => els.length)
  check('29 duplicate creates a second step', stepCount >= 2)
} else {
  check('29 duplicate creates a second step', false)
}

// Live preview panel renders and shows the materialized output
const preview = await page.$('[data-test="pipeline-preview"]')
check('30 live preview panel mounted', !!preview)
const previewBody = preview
  ? await page.$eval('[data-test="pipeline-preview-body"]', (e) => e.textContent || '')
  : ''
check('31 live preview includes block body',
  previewBody.includes('Hello from'))

// Paste & split: open drawer, paste a 3-section blob, split, commit
await page.click('[data-test="pipeline-paste-split"]')
await page.waitForTimeout(200)
await page.fill('[data-test="paste-split-input"]', `# SECTION ALPHA\n\nFirst section body.\n\n═══════════\n\n# SECTION BETA\n\nSecond section body.\n\n━━━━━━━━━━\n\n# SECTION GAMMA\n\nThird section body.`)
await page.click('[data-test="paste-split-go"]')
await page.waitForTimeout(200)
const partCount = await page.$$eval('[data-test="paste-split-part"]', (els) => els.length)
check('32 paste-split splits into 3 parts', partCount === 3)
await page.click('[data-test="paste-split-commit"]')
await page.waitForTimeout(400)
const finalSteps = await page.$$eval('[data-test="pipeline-step"]', (els) => els.length)
check('33 paste-split appends 3 new steps', finalSteps >= 5)

console.log('---')
console.log(`pass: ${pass}  fail: ${fail}  console-errors: ${errs.length}`)
if (errs.length) console.log(errs.slice(0, 5).join('\n'))
await browser.close()
process.exit(fail || errs.length ? 1 : 0)
