// Sweep 18 verification — Library Pattern.tags migration to relational tags.
//
// Set CHROMIUM_PATH=/path/to/chromium if Playwright browsers aren't on
// the default lookup path.

import { chromium } from 'playwright'
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

const HTML = 'file://' + resolve('./verse-studio.html')

const launchOpts = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {}

let pass = 0, fail = 0
const ok     = (n)       => { console.log('  PASS', n); pass++ }
const bad    = (n, why)  => { console.log('  FAIL', n, '—', why); fail++ }
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

async function run() {
  mkdirSync('./test-downloads', { recursive: true })

  const browser = await chromium.launch(launchOpts)

  // ── TagsBar present in Library with pattern selected ─────────────────────
  console.log('\n── TagsBar present in Library with pattern selected ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(200)

    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    const tagsBar = page.locator('[data-test="tags-bar"][data-record-type="pattern"]')
    expect('tags-bar with data-record-type="pattern" is present',
      await tagsBar.count() === 1, `count: ${await tagsBar.count()}`)

    // Old chip container must be gone
    expect('old pattern-tags chip container is absent',
      await page.locator('[data-test="pattern-tags"]').count() === 0)

    // Old chip input must be gone
    expect('old pattern-tag-input is absent',
      await page.locator('[data-test="pattern-tag-input"]').count() === 0)

    expect('tagsbar boot: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Attach via TagsBar persists to TagLinks (IDB) ────────────────────────
  console.log('\n── Attach via TagsBar persists to TagLinks ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(200)

    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    const uniqueTag = `sweep18-tag-${Date.now()}`
    await page.fill('[data-test="tags-bar-input"]', uniqueTag)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Chip visible in TagsBar
    const chip = page.locator(`[data-test="tags-bar-chip"][data-tag-name="${uniqueTag}"]`)
    expect('tags-bar chip visible after Enter',
      await chip.count() === 1, `count: ${await chip.count()}`)

    // TagLink persisted to IDB with targetType 'pattern'
    const tagLinks = await idbGetAll(page, 'tagLinks')
    const patternLinks = tagLinks.filter((tl) => tl.targetType === 'pattern')
    expect('at least one TagLink with targetType "pattern" in IDB',
      patternLinks.length >= 1, `pattern tagLinks: ${patternLinks.length}`)

    // Pattern.tags is empty (chip-string field deprecated)
    const patterns = await idbGetAll(page, 'patterns')
    const pat = patterns.find((p) => !p.deletedAt)
    expect('Pattern.tags field is empty array (deprecated)',
      Array.isArray(pat?.tags) && pat.tags.length === 0,
      `tags: ${JSON.stringify(pat?.tags)}`)

    expect('attach persists: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Settings shows newly attached tag ────────────────────────────────────
  console.log('\n── Settings shows newly attached tag ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Create a pattern and attach "library-tag"
    await navByHash(page, '#/library')
    await page.waitForTimeout(200)
    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    await page.fill('[data-test="tags-bar-input"]', 'library-tag')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(600)

    // Navigate to settings and check tag count
    await navByHash(page, '#/settings')
    await page.waitForTimeout(300)

    const tagRows = page.locator('[data-test="tag-row"]')
    const rowCount = await tagRows.count()
    expect('settings shows 2 tag rows (note + library-tag)',
      rowCount === 2, `got ${rowCount}`)

    const rowTexts = await tagRows.allTextContents()
    const hasLibraryTag = rowTexts.some((t) => t.includes('library-tag'))
    expect('one tag row contains "library-tag"', hasLibraryTag,
      `rows: ${JSON.stringify(rowTexts)}`)

    expect('settings tag count: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Markdown export uses relational tags (sorted) ────────────────────────
  console.log('\n── Markdown export sources from TagLinks (sorted) ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    await navByHash(page, '#/library')
    await page.waitForTimeout(200)

    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    const pName = `Export Test Pattern ${Date.now()}`
    const pDesc = `Export test description`
    const pBody = `Export test body`

    await page.fill('[data-test="pattern-name"]', pName)
    await page.fill('[data-test="pattern-description"]', pDesc)
    await page.fill('[data-test="pattern-body"]', pBody)
    await page.locator('[data-test="pattern-type"]').selectOption('ui-pattern')

    // Add "beta" first, then "alpha" — export should sort them alphabetically
    await page.fill('[data-test="tags-bar-input"]', 'beta')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    await page.fill('[data-test="tags-bar-input"]', 'alpha')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(700)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-test="pattern-export-md"]'),
    ])
    const dlPath = resolve(`./test-downloads/${download.suggestedFilename()}`)
    await download.saveAs(dlPath)
    const content = readFileSync(dlPath, 'utf8')

    expect('md export starts with ---',
      content.startsWith('---'), `first 20: "${content.slice(0, 20)}"`)
    expect('md export contains name: line',
      content.includes(`name: ${pName}`))
    expect('md export contains type: ui-pattern',
      content.includes('type: ui-pattern'))
    expect('md export tags sorted alphabetically: [alpha, beta]',
      content.includes('tags: [alpha, beta]'),
      `tags line not found; snippet: "${content.slice(0, 300)}"`)
    expect('md export contains createdAt: ISO',
      /createdAt:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(content))
    expect('md export contains updatedAt: ISO',
      /updatedAt:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(content))

    expect('md export: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Migration backfill from a v2 import file ─────────────────────────────
  console.log('\n── Migration backfill from v2 import ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const v2 = {
      schemaVersion: 2,
      exportedAt: Date.now(),
      patterns: [{
        id: 'pat-test-1',
        name: 'Test Pattern',
        description: '', type: 'ui-pattern', body: '',
        tags: ['Migrated', 'react'],
        createdAt: Date.now(), updatedAt: Date.now()
      }],
      tags: [],
      tagLinks: [],
      writingDocs: [], poems: [], longformProjects: [], longformSections: [],
      appDesignBuilds: [], appDesignConstraints: [], appDesignFeatures: [],
      appDesignScreens: [], appDesignDataShapes: [], appDesignPhases: [],
      appDesignReviews: [], shelf: [], projects: [], links: [],
      dockerScratch: [], dockerClipboard: [], snapshots: [],
      promptPipelines: [], promptBlocks: []
    }

    const v2Path = resolve('./test-downloads/v2-migration-test.json')
    writeFileSync(v2Path, JSON.stringify(v2))

    // Navigate to settings, switch mode to replace, import
    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)
    await page.locator('[data-test="import-mode"]').selectOption('replace')
    await page.setInputFiles('[data-test="import-file"]', v2Path)
    await page.waitForTimeout(800)

    // Tags store should now have 2 new tags
    const tags = await idbGetAll(page, 'tags')
    const tagNames = tags.map((t) => t.name)
    expect('migration: 2 Tags created from chip-strings',
      tags.length >= 2, `tag count: ${tags.length}; names: ${JSON.stringify(tagNames)}`)

    const hasMigrated = tagNames.some((n) => n.toLowerCase() === 'migrated')
    const hasReact    = tagNames.some((n) => n.toLowerCase() === 'react')
    expect('migration: Tag "Migrated" exists', hasMigrated,
      `tags: ${JSON.stringify(tagNames)}`)
    expect('migration: Tag "react" exists', hasReact,
      `tags: ${JSON.stringify(tagNames)}`)

    // TagLinks: 2 rows pointing at pat-test-1 with targetType 'pattern'
    const tagLinks = await idbGetAll(page, 'tagLinks')
    const patLinks = tagLinks.filter((tl) => tl.targetId === 'pat-test-1' && tl.targetType === 'pattern')
    expect('migration: 2 TagLinks for pat-test-1 (targetType "pattern")',
      patLinks.length === 2, `count: ${patLinks.length}`)

    // Pattern.tags must be empty after migration
    const patterns = await idbGetAll(page, 'patterns')
    const migratedPat = patterns.find((p) => p.id === 'pat-test-1')
    expect('migration: Pattern.tags is [] after migration',
      Array.isArray(migratedPat?.tags) && migratedPat.tags.length === 0,
      `tags: ${JSON.stringify(migratedPat?.tags)}`)

    expect('v2 import migration: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Migration is case-insensitive at the Tag layer ────────────────────────
  console.log('\n── Migration case-insensitive Tag dedup ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    const v2 = {
      schemaVersion: 2,
      exportedAt: Date.now(),
      patterns: [
        {
          id: 'pat-A',
          name: 'Pattern A', description: '', type: 'snippet', body: '',
          tags: ['React'],
          createdAt: Date.now(), updatedAt: Date.now()
        },
        {
          id: 'pat-B',
          name: 'Pattern B', description: '', type: 'snippet', body: '',
          tags: ['react'],
          createdAt: Date.now(), updatedAt: Date.now()
        }
      ],
      tags: [],
      tagLinks: [],
      writingDocs: [], poems: [], longformProjects: [], longformSections: [],
      appDesignBuilds: [], appDesignConstraints: [], appDesignFeatures: [],
      appDesignScreens: [], appDesignDataShapes: [], appDesignPhases: [],
      appDesignReviews: [], shelf: [], projects: [], links: [],
      dockerScratch: [], dockerClipboard: [], snapshots: [],
      promptPipelines: [], promptBlocks: []
    }

    const v2Path = resolve('./test-downloads/v2-casesensitive-test.json')
    writeFileSync(v2Path, JSON.stringify(v2))

    await navByHash(page, '#/settings')
    await page.waitForTimeout(200)
    await page.locator('[data-test="import-mode"]').selectOption('replace')
    await page.setInputFiles('[data-test="import-file"]', v2Path)
    await page.waitForTimeout(800)

    // Exactly ONE tag matching "react" (case-insensitive)
    const tags = await idbGetAll(page, 'tagLinks')
    const allTags = await idbGetAll(page, 'tags')
    const reactTags = allTags.filter((t) => t.name.toLowerCase() === 'react')
    expect('case-insensitive dedup: exactly 1 Tag for "react"',
      reactTags.length === 1, `count: ${reactTags.length}; tags: ${JSON.stringify(allTags.map(t => t.name))}`)

    // Both patterns have a TagLink pointing at the single tag
    const tagLinks = await idbGetAll(page, 'tagLinks')
    const reactTagId = reactTags[0]?.id
    const patALink = tagLinks.find((tl) => tl.targetId === 'pat-A' && tl.tagId === reactTagId)
    const patBLink = tagLinks.find((tl) => tl.targetId === 'pat-B' && tl.tagId === reactTagId)
    expect('case-insensitive dedup: pat-A has TagLink to the single react tag',
      !!patALink, `tagLinks: ${JSON.stringify(tagLinks)}`)
    expect('case-insensitive dedup: pat-B has TagLink to the same react tag',
      !!patBLink, `tagLinks: ${JSON.stringify(tagLinks)}`)

    expect('case dedup: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Delete cascade still works for Pattern-attached tags ─────────────────
  console.log('\n── Delete cascade: Settings delete removes Pattern TagLinks ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Create a pattern and attach a tag
    await navByHash(page, '#/library')
    await page.waitForTimeout(200)
    await page.click('[data-test="new-pattern"]')
    await page.waitForTimeout(400)

    const cascadeTag = `cascade-tag-${Date.now()}`
    await page.fill('[data-test="tags-bar-input"]', cascadeTag)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Capture the pattern id from data-pattern-id attribute
    const patternId = await page.locator('[data-test="pattern-name"]').getAttribute('data-pattern-id')

    // Navigate to settings and two-click delete the tag
    await navByHash(page, '#/settings')
    await page.waitForTimeout(300)

    const tagRows = page.locator('[data-test="tag-row"]')
    const rowCount = await tagRows.count()
    // Find the row containing our cascade tag
    let deleted = false
    for (let i = 0; i < rowCount; i++) {
      const rowText = await tagRows.nth(i).textContent()
      if (rowText && rowText.includes(cascadeTag)) {
        const deleteBtn = tagRows.nth(i).locator('[data-test="tag-row-delete"]')
        await deleteBtn.click({ force: true })
        await page.waitForTimeout(400)
        await deleteBtn.click({ force: true })
        await page.waitForTimeout(400)
        deleted = true
        break
      }
    }
    expect('cascade: found and deleted the tag in Settings', deleted, 'tag row not found')

    // IDB: zero TagLinks for that tagId, any targetType
    const tagLinks = await idbGetAll(page, 'tagLinks')
    const allTags  = await idbGetAll(page, 'tags')
    const cascadeTg = allTags.find((t) => t.name === cascadeTag)
    const orphanLinks = cascadeTg
      ? tagLinks.filter((tl) => tl.tagId === cascadeTg.id)
      : []
    expect('cascade: zero TagLinks remain for deleted tag (IDB)',
      orphanLinks.length === 0, `orphan links: ${JSON.stringify(orphanLinks)}`)

    // Navigate back to Library and confirm TagsBar has zero chips for the pattern
    await navByHash(page, '#/library')
    await page.waitForTimeout(300)

    // Re-select the pattern if needed
    if (patternId) {
      const patItem = page.locator(`[data-test="pattern-item"][data-pattern-id="${patternId}"]`)
      if (await patItem.count() > 0) await patItem.click()
      await page.waitForTimeout(300)
    }

    const chipCount = await page.locator('[data-test="tags-bar-chip"]').count()
    expect('cascade: Library TagsBar shows zero chips after Settings delete',
      chipCount === 0, `chips: ${chipCount}`)

    expect('cascade: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Regression: sidebar still has 12 routes ───────────────────────────────
  // Sweep 23: route count grew from 10 to 12 (added /inbox + /atlas).
  // Updated in place from === 10 with this comment so the cumulative
  // verify still passes after Sweep 23.
  console.log('\n── Regression: sidebar 12 routes ──')
  {
    const { ctx, page, errors } = await fresh(browser)
    const sidebarLinks = await page.locator('aside a[href^="#/"]').count()
    expect('regression: sidebar has 12 routes', sidebarLinks === 12, `got ${sidebarLinks}`)
    expect('regression sidebar: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Regression: TagManager mounts only in Settings ────────────────────────
  console.log('\n── Regression: TagManager only in Settings ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    await navByHash(page, '#/settings')
    await page.waitForTimeout(150)
    expect('regression: tag-manager present in settings',
      await page.locator('[data-test="tag-manager"]').count() === 1)

    for (const route of ROUTES.filter((r) => r !== '#/settings')) {
      await navByHash(page, route)
      await page.waitForTimeout(150)
      expect(`regression: tag-manager absent in ${route}`,
        await page.locator('[data-test="tag-manager"]').count() === 0)
    }

    expect('regression tag-manager: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── Regression: Snapshots mounts in all six relevant studios ─────────────
  console.log('\n── Regression: Snapshots in six studios ──')
  {
    const { ctx, page, errors } = await fresh(browser)

    // Writing — create a doc first so the Snapshots button appears
    await navByHash(page, '#/writing')
    await page.waitForTimeout(150)
    await page.click('[data-test="new-doc"]')
    await page.waitForTimeout(400)
    expect('regression: snapshots-button in writing',
      await page.locator('[data-test="snapshots-button"][data-record-type="document"]').count() >= 1)

    // Poetry
    await navByHash(page, '#/poetry')
    await page.waitForTimeout(150)
    await page.click('[data-test="new-poem"]')
    await page.waitForTimeout(400)
    expect('regression: snapshots-button in poetry',
      await page.locator('[data-test="snapshots-button"][data-record-type="poem"]').count() >= 1)

    // Longform
    await navByHash(page, '#/longform')
    await page.waitForTimeout(150)
    await page.click('[data-test="new-longform"]')
    await page.waitForTimeout(400)
    expect('regression: snapshots-button in longform',
      await page.locator('[data-test="snapshots-button"][data-record-type="longform"]').count() >= 1)

    // App-design
    await navByHash(page, '#/app-design')
    await page.waitForTimeout(150)
    await page.click('[data-test="new-build"]')
    await page.waitForTimeout(400)
    expect('regression: snapshots-button in app-design',
      await page.locator('[data-test="snapshots-button"][data-record-type="build"]').count() >= 1)

    // Prompts
    await navByHash(page, '#/prompts')
    await page.waitForTimeout(150)
    await page.click('[data-test="new-pipeline"]')
    await page.waitForTimeout(400)
    expect('regression: snapshots-button in prompts',
      await page.locator('[data-test="snapshots-button"][data-record-type="pipeline"]').count() >= 1)

    // Projects
    await navByHash(page, '#/projects')
    await page.waitForTimeout(150)
    await page.click('[data-test="new-project-button"]')
    await page.waitForTimeout(400)
    expect('regression: snapshots-button in projects',
      await page.locator('[data-test="snapshots-button"][data-record-type="project"]').count() >= 1)

    expect('regression snapshots: zero errors',
      errors.console.length === 0 && errors.pageError.length === 0,
      JSON.stringify({ console: errors.console, pageError: errors.pageError }))
    await ctx.close()
  }

  // ── No console / page errors during the entire run ───────────────────────
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
