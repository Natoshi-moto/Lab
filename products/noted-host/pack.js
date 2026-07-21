// pack.js — inlines Vite's dist/ into a single local HTML artifact
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, 'dist')

if (!existsSync(distDir)) {
  console.error('dist/ does not exist. Run vite build first.')
  process.exit(1)
}

let html = readFileSync(join(distDir, 'index.html'), 'utf-8')

// Inline <script ... src="...">. Preserve type="module" / other attrs.
html = html.replace(
  /<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/g,
  (match, before, src, after) => {
    const rel = src.replace(/^\.\//, '').replace(/^\//, '')
    const fullPath = join(distDir, rel)
    if (!existsSync(fullPath)) {
      console.warn('Could not inline (missing):', fullPath)
      return match
    }
    const code = readFileSync(fullPath, 'utf-8')
    const safe = code.replace(/<\/script>/g, '<\\/script>')
    const attrs = (before + ' ' + after).replace(/\s+/g, ' ').trim()
    return `<script ${attrs}>${safe}</script>`
  }
)

// Inline <link rel="stylesheet" href="...">.
html = html.replace(
  /<link\b[^>]*\brel=["']stylesheet["'][^>]*>/g,
  (match) => {
    const hrefMatch = match.match(/href=["']([^"']+)["']/)
    if (!hrefMatch) return match
    const rel = hrefMatch[1].replace(/^\.\//, '').replace(/^\//, '')
    const fullPath = join(distDir, rel)
    if (!existsSync(fullPath)) {
      console.warn('Could not inline (missing):', fullPath)
      return match
    }
    const css = readFileSync(fullPath, 'utf-8')
    return `<style>${css}</style>`
  }
)

// Hard checks. The whole point of this script is to fail loud if anything leaks.
const checks = [
  { re: /<script\b[^>]*\bsrc=/i, msg: 'external <script src=...> remains' },
  { re: /<link\b[^>]*\brel=["']stylesheet["']/i, msg: 'external stylesheet <link> remains' },
  { re: /\/assets\//, msg: '/assets/ reference remains' }
]
for (const { re, msg } of checks) {
  if (re.test(html)) {
    console.error('FAIL:', msg)
    process.exit(1)
  }
}

const outPath = join(__dirname, 'verse-studio.html')
const brandedOutPath = join(__dirname, 'noted-v0.01.html')
writeFileSync(outPath, html)
writeFileSync(brandedOutPath, html)
const size = statSync(outPath).size
console.log(`OK  verse-studio.html + noted-v0.01.html  (${(size / 1024).toFixed(1)} KB)`)
